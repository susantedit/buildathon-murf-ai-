/**
 * steg.property.test.js — Property-Based Tests for StegChat
 *
 * Tests Properties 1–6, 8, 10, 11, 15 using fast-check.
 * Each property is tagged with the requirement(s) it validates.
 *
 * Feature: steg-chat
 */

import * as fc from 'fast-check'
import { describe, it, expect } from 'vitest'

import {
  encrypt,
  decrypt,
  validateMessage,
  CryptoError,
} from '../../services/stegCryptoService.js'

import {
  encode,
  decode,
  capacity,
  LsbCapacityError,
  LsbMalformedError,
} from '../../services/stegLsbService.js'

// ─── WAV Buffer Arbitrary ─────────────────────────────────────────────────────

/**
 * Build a valid 44-byte PCM WAV header + `numSamples` 16-bit PCM samples.
 *
 * WAV header layout (44 bytes):
 *   [0]  "RIFF"          (4 bytes)
 *   [4]  fileSize        (4 bytes LE) = 36 + dataSize
 *   [8]  "WAVE"          (4 bytes)
 *   [12] "fmt "          (4 bytes)
 *   [16] chunkSize = 16  (4 bytes LE)
 *   [20] audioFormat = 1 (2 bytes LE, PCM)
 *   [22] numChannels = 1 (2 bytes LE)
 *   [24] sampleRate = 44100 (4 bytes LE)
 *   [28] byteRate = 88200  (4 bytes LE)
 *   [32] blockAlign = 2   (2 bytes LE)
 *   [34] bitsPerSample=16 (2 bytes LE)
 *   [36] "data"          (4 bytes)
 *   [40] dataSize        (4 bytes LE) = numSamples * 2
 *   [44] samples...
 */
function buildWavBuffer(numSamples, sampleValues) {
  const dataSize = numSamples * 2
  const fileSize = 36 + dataSize
  const buf = Buffer.alloc(44 + dataSize)

  // RIFF chunk descriptor
  buf.write('RIFF', 0, 'ascii')
  buf.writeUInt32LE(fileSize, 4)
  buf.write('WAVE', 8, 'ascii')

  // fmt sub-chunk
  buf.write('fmt ', 12, 'ascii')
  buf.writeUInt32LE(16, 16)       // chunkSize
  buf.writeUInt16LE(1, 20)        // audioFormat = PCM
  buf.writeUInt16LE(1, 22)        // numChannels = 1
  buf.writeUInt32LE(44100, 24)    // sampleRate
  buf.writeUInt32LE(88200, 28)    // byteRate = sampleRate * blockAlign
  buf.writeUInt16LE(2, 32)        // blockAlign = numChannels * bitsPerSample/8
  buf.writeUInt16LE(16, 34)       // bitsPerSample

  // data sub-chunk
  buf.write('data', 36, 'ascii')
  buf.writeUInt32LE(dataSize, 40)

  // Write samples as Int16LE
  for (let i = 0; i < numSamples; i++) {
    buf.writeInt16LE(sampleValues[i], 44 + i * 2)
  }

  return buf
}

/**
 * Arbitrary that generates a valid PCM WAV buffer.
 * Uses 100–2000 samples to keep tests fast.
 */
function arbWavBuffer() {
  return fc
    .integer({ min: 100, max: 2000 })
    .chain((numSamples) =>
      fc
        .array(fc.integer({ min: -32768, max: 32767 }), {
          minLength: numSamples,
          maxLength: numSamples,
        })
        .map((samples) => buildWavBuffer(numSamples, samples))
    )
}

/**
 * Arbitrary that generates a random payload that fits within the WAV's capacity.
 * Skips (via fc.pre) if capacity <= 0.
 */
function arbPayloadWithinCapacity(wav) {
  const cap = capacity(wav)
  fc.pre(cap > 0)
  const len = Math.max(1, Math.min(cap, 1))
  // We'll use a chain approach in the property itself; here we return an
  // arbitrary for a payload of length [1, cap].
  return fc.uint8Array({ minLength: 1, maxLength: cap }).map((arr) => Buffer.from(arr))
}

// ─── Helper: read samples from a WAV buffer ───────────────────────────────────

function readSamples(wavBuffer) {
  const n = (wavBuffer.length - 44) / 2
  const samples = []
  for (let i = 0; i < n; i++) {
    samples.push(wavBuffer.readInt16LE(44 + i * 2))
  }
  return samples
}

// ─── Helper: SNR / PSNR ───────────────────────────────────────────────────────

/**
 * Compute SNR in dB between original and stego WAV buffers.
 * SNR = 20 * log10(signalPower / noisePower)
 * where signalPower = RMS of original samples, noisePower = RMS of difference.
 */
function computeSNR(originalWav, stegoWav) {
  const orig = readSamples(originalWav)
  const steg = readSamples(stegoWav)
  const n = orig.length

  let signalSumSq = 0
  let noiseSumSq = 0
  for (let i = 0; i < n; i++) {
    signalSumSq += orig[i] * orig[i]
    const diff = steg[i] - orig[i]
    noiseSumSq += diff * diff
  }

  if (noiseSumSq === 0) return Infinity
  if (signalSumSq === 0) return 0

  return 20 * Math.log10(Math.sqrt(signalSumSq / n) / Math.sqrt(noiseSumSq / n))
}

/**
 * Compute PSNR in dB between original and stego WAV buffers.
 * PSNR = 20 * log10(32767 / RMSE)
 * where RMSE = sqrt(mean squared error between samples).
 */
function computePSNR(originalWav, stegoWav) {
  const orig = readSamples(originalWav)
  const steg = readSamples(stegoWav)
  const n = orig.length

  let sumSqErr = 0
  for (let i = 0; i < n; i++) {
    const diff = steg[i] - orig[i]
    sumSqErr += diff * diff
  }

  if (sumSqErr === 0) return Infinity

  const rmse = Math.sqrt(sumSqErr / n)
  return 20 * Math.log10(32767 / rmse)
}

// ─── Property Tests ───────────────────────────────────────────────────────────

describe('StegChat Property-Based Tests', () => {

  // ── Property 1: LSB Codec Round-Trip ────────────────────────────────────────
  // Validates: Requirements 11.3, 13.1, 13.2, 4.2, 7.2
  it('Property 1: LSB Codec Round-Trip — decode(encode(wav, payload)) equals payload', () => {
    /**
     * **Validates: Requirements 11.3, 13.1, 13.2, 4.2, 7.2**
     */
    fc.assert(
      fc.property(
        arbWavBuffer().chain((wav) => {
          const cap = capacity(wav)
          fc.pre(cap > 0)
          return fc
            .uint8Array({ minLength: 1, maxLength: cap })
            .map((arr) => ({ wav, payload: Buffer.from(arr) }))
        }),
        ({ wav, payload }) => {
          const stego = encode(wav, payload)
          const recovered = decode(stego)
          return recovered.equals(payload)
        }
      ),
      { numRuns: 100 }
    )
  })

  // ── Property 2: Sample Integrity Invariant ───────────────────────────────────
  // Validates: Requirements 4.4, 4.5, 11.4
  it('Property 2: Sample Integrity Invariant — modified samples differ by ≤ 1 and upper 15 bits are preserved', () => {
    /**
     * **Validates: Requirements 4.4, 4.5, 11.4**
     */
    fc.assert(
      fc.property(
        arbWavBuffer().chain((wav) => {
          const cap = capacity(wav)
          fc.pre(cap > 0)
          return fc
            .uint8Array({ minLength: 1, maxLength: cap })
            .map((arr) => ({ wav, payload: Buffer.from(arr) }))
        }),
        ({ wav, payload }) => {
          const originalSamples = readSamples(wav)
          const stego = encode(wav, payload)
          const stegoSamples = readSamples(stego)

          return stegoSamples.every((s, i) => {
            const orig = originalSamples[i]
            // (a) absolute difference ≤ 1
            const diffOk = Math.abs(s - orig) <= 1
            // (b) upper 15 bits (bits 15–1) are identical
            // Treat as unsigned 16-bit for the mask comparison
            const upperBitsOk = (((s & 0xFFFF) & 0xFFFE) === ((orig & 0xFFFF) & 0xFFFE))
            return diffOk && upperBitsOk
          })
        }
      ),
      { numRuns: 100 }
    )
  })

  // ── Property 3: Audio Fidelity SNR/PSNR ─────────────────────────────────────
  // Validates: Requirements 11.1, 11.2
  it('Property 3: Audio Fidelity — SNR ≥ 80 dB and PSNR ≥ 80 dB', () => {
    /**
     * **Validates: Requirements 11.1, 11.2**
     */
    fc.assert(
      fc.property(
        arbWavBuffer().chain((wav) => {
          const cap = capacity(wav)
          fc.pre(cap > 0)
          // Use non-zero samples to avoid degenerate SNR; filter out all-zero WAVs
          const samples = readSamples(wav)
          fc.pre(samples.some((s) => s !== 0))
          return fc
            .uint8Array({ minLength: 1, maxLength: cap })
            .map((arr) => ({ wav, payload: Buffer.from(arr) }))
        }),
        ({ wav, payload }) => {
          const stego = encode(wav, payload)
          const snr = computeSNR(wav, stego)
          const psnr = computePSNR(wav, stego)
          return snr >= 80 && psnr >= 80
        }
      ),
      { numRuns: 100 }
    )
  })

  // ── Property 4: Crypto Engine Encrypt-Decrypt Round-Trip ────────────────────
  // Validates: Requirements 3.1, 3.2, 3.3, 7.3, 7.4
  it('Property 4: Crypto Engine Encrypt-Decrypt Round-Trip — decrypt(encrypt(plaintext, pin), pin) === plaintext', async () => {
    /**
     * **Validates: Requirements 3.1, 3.2, 3.3, 7.3, 7.4**
     */
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 2000 }),
        fc.string({ minLength: 6, maxLength: 64 }),
        async (plaintext, pin) => {
          const payload = await encrypt(plaintext, pin)
          const recovered = await decrypt(payload, pin)
          return recovered === plaintext
        }
      ),
      { numRuns: 100 }
    )
  })

  // ── Property 5: Payload Binary Structure ─────────────────────────────────────
  // Validates: Requirements 3.4
  it('Property 5: Payload Binary Structure — correct offsets and minimum length', async () => {
    /**
     * **Validates: Requirements 3.4**
     */
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 2000 }),
        fc.string({ minLength: 6, maxLength: 64 }),
        async (plaintext, pin) => {
          const payload = await encrypt(plaintext, pin)
          // Total length must be at least 300 bytes (fixed fields) + ciphertext
          if (payload.length < 300) return false
          // salt: [0, 16)
          if (payload.slice(0, 16).length !== 16) return false
          // IV: [16, 28)
          if (payload.slice(16, 28).length !== 12) return false
          // wrappedKey: [28, 284)
          if (payload.slice(28, 284).length !== 256) return false
          // GCM tag: [284, 300)
          if (payload.slice(284, 300).length !== 16) return false
          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  // ── Property 6: No Plaintext in Payload ──────────────────────────────────────
  // Validates: Requirements 5.2, 5.3
  it('Property 6: No Plaintext in Payload — encrypted payload does not contain raw plaintext bytes', async () => {
    /**
     * **Validates: Requirements 5.2, 5.3**
     */
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 2000 }),
        fc.string({ minLength: 6, maxLength: 64 }),
        async (plaintext, pin) => {
          const payload = await encrypt(plaintext, pin)
          const plaintextBytes = Buffer.from(plaintext, 'utf8')
          return payload.indexOf(plaintextBytes) === -1
        }
      ),
      { numRuns: 100 }
    )
  })

  // ── Property 8: Wrong PIN → CryptoError ──────────────────────────────────────
  // Validates: Requirements 7.5
  it('Property 8: Wrong PIN → CryptoError — decrypting with wrong PIN throws CryptoError', async () => {
    /**
     * **Validates: Requirements 7.5**
     */
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 2000 }),
        fc.string({ minLength: 6, maxLength: 64 }),
        fc.string({ minLength: 6, maxLength: 64 }),
        async (plaintext, pinA, pinB) => {
          fc.pre(pinA !== pinB)
          const payload = await encrypt(plaintext, pinA)
          try {
            await decrypt(payload, pinB)
            return false // should have thrown
          } catch (e) {
            return e instanceof CryptoError
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  // ── Property 10: LSB Codec Determinism ───────────────────────────────────────
  // Validates: Requirements 13.4
  it('Property 10: LSB Codec Determinism — encode called twice produces byte-identical output', () => {
    /**
     * **Validates: Requirements 13.4**
     */
    fc.assert(
      fc.property(
        arbWavBuffer().chain((wav) => {
          const cap = capacity(wav)
          fc.pre(cap > 0)
          return fc
            .uint8Array({ minLength: 1, maxLength: cap })
            .map((arr) => ({ wav, payload: Buffer.from(arr) }))
        }),
        ({ wav, payload }) => {
          const stego1 = encode(wav, payload)
          const stego2 = encode(wav, payload)
          return stego1.equals(stego2)
        }
      ),
      { numRuns: 100 }
    )
  })

  // ── Property 11: CSPRNG Uniqueness ───────────────────────────────────────────
  // Validates: Requirements 12.1
  it('Property 11: CSPRNG Uniqueness — two encrypt() calls produce different salts and IVs', async () => {
    /**
     * **Validates: Requirements 12.1**
     */
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 2000 }),
        fc.string({ minLength: 6, maxLength: 64 }),
        async (plaintext, pin) => {
          const p1 = await encrypt(plaintext, pin)
          const p2 = await encrypt(plaintext, pin)

          const salt1 = p1.slice(0, 16)
          const salt2 = p2.slice(0, 16)
          const iv1 = p1.slice(16, 28)
          const iv2 = p2.slice(16, 28)

          return !salt1.equals(salt2) && !iv1.equals(iv2)
        }
      ),
      { numRuns: 100 }
    )
  })

  // ── Property 15: Whitespace Message Rejection ─────────────────────────────────
  // Validates: Requirements 2.5
  it('Property 15: Whitespace Message Rejection — validateMessage rejects whitespace-only strings', () => {
    /**
     * **Validates: Requirements 2.5**
     */
    fc.assert(
      fc.property(
        fc.stringOf(fc.constantFrom(' ', '\t', '\n', '\r')),
        (whitespaceMsg) => {
          const result = validateMessage(whitespaceMsg)
          return result.valid === false
        }
      ),
      { numRuns: 100 }
    )
  })
})
