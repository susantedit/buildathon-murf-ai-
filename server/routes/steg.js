/**
 * steg.js — StegChat API routes
 *
 * POST /api/steg/send   — encrypt + LSB-embed + persist + Socket.IO emit
 * POST /api/steg/reveal — rate-limit + LSB-decode + decrypt + Murf stream + burn
 */

import { Router } from 'express'
import multer from 'multer'
import StegMessage from '../models/StegMessage.js'
import {
  encrypt,
  decrypt,
  validatePin,
  validateMessage,
  CryptoError,
} from '../services/stegCryptoService.js'
import {
  encode,
  decode,
  LsbCapacityError,
  LsbMalformedError,
} from '../services/stegLsbService.js'
import { burn, BurnDeleteError } from '../services/stegBurnController.js'
import { streamToClient, TtsStreamError } from '../services/stegTtsStreamer.js'
import { io } from '../app.js'

const router = Router()

// ── Multer: memory storage, 10 MB limit ──────────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['audio/wav', 'audio/x-wav', 'audio/wave']
    if (allowed.includes(file.mimetype)) {
      cb(null, true)
    } else {
      const err = new Error('Only WAV audio files are accepted')
      err.status = 400
      cb(err)
    }
  },
})

// ── In-memory rate limiter for PIN attempts ───────────────────────────────────
// Key: `${ip}:${stegMessageId}` → { count, resetAt }
const pinAttempts = new Map()
const RATE_LIMIT_MAX = 5
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000 // 15 minutes

function checkRateLimit(ip, stegMessageId) {
  const key = `${ip}:${stegMessageId}`
  const now = Date.now()
  const entry = pinAttempts.get(key)

  if (!entry || now > entry.resetAt) {
    pinAttempts.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return false // not limited
  }

  entry.count += 1
  if (entry.count > RATE_LIMIT_MAX) return true // limited

  return false
}

// ── POST /api/steg/send ───────────────────────────────────────────────────────
router.post(
  '/send',
  (req, res, next) => {
    upload.single('audio')(req, res, (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({ error: 'Audio file too large' })
        }
        return res.status(400).json({ error: err.message || 'Invalid request' })
      }
      next()
    })
  },
  async (req, res) => {
    try {
      // Validate file presence
      if (!req.file) {
        return res.status(400).json({ error: 'Audio file is required' })
      }

      const { message, pin, senderId, receiverId, roomId, duration } = req.body

      // Validate message
      const msgValidation = validateMessage(message)
      if (!msgValidation.valid) {
        return res.status(400).json({ error: msgValidation.error })
      }
      if (message.length > 2000) {
        return res.status(400).json({ error: 'Message must be 2000 characters or fewer' })
      }

      // Validate PIN
      const pinValidation = validatePin(pin)
      if (!pinValidation.valid) {
        return res.status(400).json({ error: pinValidation.error })
      }

      if (!senderId || !receiverId || !roomId) {
        return res.status(400).json({ error: 'senderId, receiverId, and roomId are required' })
      }

      // Encrypt the message
      const payload = await encrypt(message, pin)

      // LSB-embed payload into the WAV
      let stegoWav
      try {
        stegoWav = encode(req.file.buffer, payload)
      } catch (err) {
        if (err instanceof LsbCapacityError) {
          return res.status(422).json({ error: 'Audio too short for message' })
        }
        throw err
      }

      // Store stego WAV as base64 in coverAudioRef
      const coverAudioRef = stegoWav.toString('base64')

      // Persist StegMessage document
      const doc = await StegMessage.create({
        payload,
        coverAudioRef,
        senderId,
        receiverId,
        roomId,
        read: false,
      })

      const stegMessageId = doc._id.toString()

      // Emit via Socket.IO — same structure as a normal voice-note event
      const audioDataUrl = `data:audio/wav;base64,${coverAudioRef}`
      io.to(roomId).emit('voice-note', {
        audioUrl: audioDataUrl,
        stegMessageId,
        senderId,
        roomId,
        duration: parseFloat(duration) || 0,
        timestamp: Date.now(),
      })

      return res.status(200).json({ stegMessageId })
    } catch (err) {
      console.error('[steg/send] error:', err.message)
      return res.status(500).json({ error: 'Something went wrong' })
    }
  }
)

// ── POST /api/steg/reveal ─────────────────────────────────────────────────────
router.post('/reveal', async (req, res) => {
  try {
    const { stegMessageId, pin } = req.body

    if (!stegMessageId || !pin) {
      return res.status(400).json({ error: 'Invalid request' })
    }

    // Rate limit PIN attempts
    const ip = req.ip || req.connection?.remoteAddress || 'unknown'
    if (checkRateLimit(ip, stegMessageId)) {
      return res.status(429).json({ error: 'Too many attempts' })
    }

    // Validate PIN format
    const pinValidation = validatePin(pin)
    if (!pinValidation.valid) {
      return res.status(400).json({ error: 'Invalid request' })
    }

    // Fetch the StegMessage (check it exists and hasn't been read)
    const doc = await StegMessage.findOne({ _id: stegMessageId })
    if (!doc) {
      return res.status(404).json({ error: 'Message already played' })
    }
    if (doc.read) {
      return res.status(404).json({ error: 'Message already played' })
    }

    // Decode stego WAV from base64 coverAudioRef
    const stegoWav = Buffer.from(doc.coverAudioRef, 'base64')

    // LSB-decode to get the encrypted payload
    let encryptedPayload
    try {
      encryptedPayload = decode(stegoWav)
    } catch (err) {
      if (err instanceof LsbMalformedError) {
        return res.status(422).json({ error: 'Could not read hidden data' })
      }
      throw err
    }

    // Decrypt the payload with the PIN
    let plaintext
    try {
      plaintext = await decrypt(encryptedPayload, pin)
    } catch (err) {
      if (err instanceof CryptoError) {
        return res.status(401).json({ error: 'Incorrect PIN' })
      }
      throw err
    }

    // Stream TTS to client — burn fires on first chunk
    try {
      await streamToClient(plaintext, res, async () => {
        await burn(stegMessageId)
      })
    } catch (err) {
      if (err instanceof BurnDeleteError) {
        return res.status(500).json({ error: 'Playback error' })
      }
      if (err instanceof TtsStreamError) {
        return res.status(503).json({ error: 'Playback failed' })
      }
      throw err
    }
  } catch (err) {
    console.error('[steg/reveal] error:', err.message)
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Something went wrong' })
    }
  }
})

export default router
