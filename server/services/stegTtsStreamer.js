import axios from 'axios'

/**
 * Error thrown when the Murf TTS streaming API returns a non-2xx response
 * or the request times out.
 */
export class TtsStreamError extends Error {
  constructor(message) {
    super(message)
    this.name = 'TtsStreamError'
  }
}

/**
 * Stream decrypted plaintext to Murf Falcon and pipe audio chunks to res.
 * Uses axios with responseType: 'stream' to avoid buffering.
 * Calls onFirstChunk() before piping begins (triggers burn).
 *
 * SECURITY: plaintext is NEVER logged or stored.
 *
 * @param {string} plaintext - The decrypted message text to synthesize.
 * @param {import('express').Response} res - The Express response object.
 * @param {() => Promise<void>} onFirstChunk - Async callback invoked before piping starts (triggers burn-on-read).
 * @returns {Promise<void>}
 * @throws {TtsStreamError} On non-2xx Murf API response or timeout.
 *
 * Validates: Requirements 8.1, 8.2, 8.5, 8.6, 14.3
 */
export async function streamToClient(plaintext, res, onFirstChunk) {
  let murfResponse

  try {
    murfResponse = await axios({
      method: 'post',
      url: 'https://api.murf.ai/v1/speech/stream',
      data: {
        text: plaintext,
        voiceId: 'en-US-natalie',
        format: 'MP3',
      },
      headers: {
        'api-key': process.env.MURF_API_KEY,
      },
      responseType: 'stream',
      timeout: 10000,
    })
  } catch (err) {
    // Covers both network/timeout errors and non-2xx responses (axios throws on non-2xx by default)
    throw new TtsStreamError(
      err.code === 'ECONNABORTED'
        ? 'Murf TTS request timed out'
        : `Murf TTS request failed: ${err.message}`
    )
  }

  // Validate HTTP status (axios throws on non-2xx, but guard explicitly for safety)
  if (murfResponse.status < 200 || murfResponse.status >= 300) {
    throw new TtsStreamError(`Murf TTS returned status ${murfResponse.status}`)
  }

  // Trigger burn-on-read BEFORE piping audio to the client
  await onFirstChunk()

  res.setHeader('Content-Type', 'audio/mpeg')
  res.setHeader('Transfer-Encoding', 'chunked')

  murfResponse.data.pipe(res)
}
