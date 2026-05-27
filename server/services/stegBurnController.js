import StegMessage from '../models/StegMessage.js'

/**
 * Custom error thrown when all retry attempts to delete a StegMessage fail.
 */
export class BurnDeleteError extends Error {
  constructor(message = 'Failed to delete StegMessage after retries') {
    super(message)
    this.name = 'BurnDeleteError'
  }
}

/**
 * Atomically delete a StegMessage that has not yet been read.
 * Uses findOneAndDelete({_id, read: false}) for atomic burn-on-read.
 * Retries up to 3 times with exponential backoff (100ms, 200ms, 400ms) on MongoDB error.
 * Returns the deleted document, or null if already consumed (not found / already burned).
 * Throws BurnDeleteError after 3 consecutive failures.
 *
 * @param {string} stegMessageId - MongoDB ObjectId of the StegMessage to burn
 * @returns {Promise<object|null>} The deleted document, or null if already consumed
 */
export async function burn(stegMessageId) {
  const delays = [100, 200, 400]

  for (let attempt = 0; attempt <= delays.length; attempt++) {
    try {
      const deleted = await StegMessage.findOneAndDelete({ _id: stegMessageId, read: false })
      // null means document not found (already burned or never existed) — not an error
      return deleted
    } catch (err) {
      if (attempt < delays.length) {
        // Wait with exponential backoff before retrying
        await new Promise((resolve) => setTimeout(resolve, delays[attempt]))
      } else {
        // All 3 retries exhausted
        console.error(
          `[CRITICAL] BurnDeleteError: failed to delete StegMessage ${stegMessageId} after ${delays.length} retries. Last error: ${err.message}`
        )
        throw new BurnDeleteError(
          `Failed to delete StegMessage ${stegMessageId} after ${delays.length} retries: ${err.message}`
        )
      }
    }
  }
}

/**
 * Delete all StegMessage documents that have exceeded the 24-hour TTL.
 * This is a fallback for cases where MongoDB's TTL index has not yet fired.
 * Intended to be called by a scheduled cron job.
 *
 * @returns {Promise<void>}
 */
export async function purgeExpired() {
  const cutoff = new Date(Date.now() - 86400000) // 24 hours ago
  await StegMessage.deleteMany({ createdAt: { $lt: cutoff } })
}
