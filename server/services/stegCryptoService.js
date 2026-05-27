/**
 * stegCryptoService.js — Crypto_Engine for StegChat
 *
 * Provides AES-256-GCM encryption/decryption with PBKDF2 key derivation
 * and RSA-2048-OAEP key wrapping. Uses ONLY Node.js built-in `crypto` module.
 *
 * Payload binary layout:
 *   Offset   0 : 16 bytes — PBKDF2 salt (CSPRNG)
 *   Offset  16 : 12 bytes — AES-GCM IV (CSPRNG)
 *   Offset  28 : 256 bytes — RSA-2048-OAEP wrapped AES key
 *   Offset 284 : 16 bytes — AES-GCM authentication tag
 *   Offset 300 : N bytes  — AES-256-GCM ciphertext
 *   Total: 300 + N bytes
 */

import crypto from 'crypto'

// ── RSA-2048 key pair generated once at module load, never persisted ──────────
const { publicKey: rsaPublicKey, privateKey: rsaPrivateKey } =
  crypto.generateKeyPairSync('rsa', { modulusLength: 2048 })

// ── Payload field offsets ─────────────────────────────────────────────────────
const SALT_OFFSET       = 0
const SALT_LENGTH       = 16
const IV_OFFSET         = 16
const IV_LENGTH         = 12
const WRAPPED_KEY_OFFSET = 28
const WRAPPED_KEY_LENGTH = 256
const TAG_OFFSET        = 284
const TAG_LENGTH        = 16
const CIPHERTEXT_OFFSET = 300

// ── Custom error class ────────────────────────────────────────────────────────

/**
 * Thrown when AES-GCM authentication tag verification fails (wrong PIN or
 * tampered payload).
 */
export class CryptoError extends Error {
  constructor (message = 'Decryption failed: authentication tag mismatch') {
    super(message)
    this.name = 'CryptoError'
  }
}

// ── Helper: promisify crypto.pbkdf2 ──────────────────────────────────────────

/**
 * Derive a 32-byte AES key from a PIN and salt using PBKDF2-SHA-256.
 * @param {string} pin
 * @param {Buffer} salt
 * @returns {Promise<Buffer>}
 */
function deriveKey (pin, salt) {
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(pin, salt, 100_000, 32, 'sha256', (err, key) => {
      if (err) reject(err)
      else resolve(key)
    })
  })
}

// ── Core functions ────────────────────────────────────────────────────────────

/**
 * Zeroize a Buffer in place (overwrite every byte with 0x00).
 * @param {Buffer} buf
 */
export function zeroize (buf) {
  buf.fill(0)
}

/**
 * Validate a PIN.
 * @param {string} pin
 * @returns {{ valid: boolean, error?: string }}
 */
export function validatePin (pin) {
  if (typeof pin !== 'string' || pin.length < 6) {
    return { valid: false, error: 'PIN must be at least 6 characters' }
  }
  return { valid: true }
}

/**
 * Validate a secret message.
 * @param {string} msg
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateMessage (msg) {
  if (typeof msg !== 'string' || msg.trim().length === 0) {
    return { valid: false, error: 'Message must not be empty or all whitespace' }
  }
  return { valid: true }
}

/**
 * Encrypt a plaintext message with a PIN.
 *
 * Steps:
 *  1. Generate 16-byte CSPRNG salt and 12-byte CSPRNG IV.
 *  2. Derive 32-byte AES key via PBKDF2-SHA-256 (100,000 iterations).
 *  3. Encrypt plaintext with AES-256-GCM.
 *  4. Wrap AES key with RSA-2048-OAEP (SHA-256).
 *  5. Concatenate [salt | IV | wrappedKey | tag | ciphertext].
 *  6. Zeroize AES key buffer before returning.
 *
 * @param {string} plaintext
 * @param {string} pin
 * @returns {Promise<Buffer>} Binary payload buffer
 */
export async function encrypt (plaintext, pin) {
  // 1. Generate random salt and IV
  const salt = crypto.randomBytes(SALT_LENGTH)
  const iv   = crypto.randomBytes(IV_LENGTH)

  // 2. Derive AES key
  const aesKey = await deriveKey(pin, salt)

  try {
    // 3. Encrypt with AES-256-GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', aesKey, iv)
    const plaintextBuffer = Buffer.from(plaintext, 'utf8')
    const ciphertext = Buffer.concat([
      cipher.update(plaintextBuffer),
      cipher.final()
    ])
    const tag = cipher.getAuthTag() // 16 bytes

    // 4. Wrap AES key with RSA-2048-OAEP
    const wrappedKey = crypto.publicEncrypt(
      { key: rsaPublicKey, oaepHash: 'sha256' },
      aesKey
    )

    // 5. Concatenate payload: [salt(16) | IV(12) | wrappedKey(256) | tag(16) | ciphertext(N)]
    const payload = Buffer.concat([salt, iv, wrappedKey, tag, ciphertext])

    return payload
  } finally {
    // 6. Zeroize AES key regardless of success or failure
    zeroize(aesKey)
  }
}

/**
 * Decrypt a payload buffer with a PIN.
 *
 * Steps:
 *  1. Slice fields from payload at defined offsets.
 *  2. Derive AES key from salt + pin via PBKDF2.
 *  3. Unwrap AES key with RSA private key (OAEP SHA-256).
 *  4. Decrypt ciphertext with AES-256-GCM and verify authentication tag.
 *  5. Zeroize key buffers.
 *
 * @param {Buffer} payload
 * @param {string} pin
 * @returns {Promise<string>} Decrypted plaintext
 * @throws {CryptoError} If GCM authentication tag verification fails
 */
export async function decrypt (payload, pin) {
  // 1. Slice fields from payload
  const salt       = payload.slice(SALT_OFFSET,        SALT_OFFSET + SALT_LENGTH)
  const iv         = payload.slice(IV_OFFSET,          IV_OFFSET + IV_LENGTH)
  const wrappedKey = payload.slice(WRAPPED_KEY_OFFSET, WRAPPED_KEY_OFFSET + WRAPPED_KEY_LENGTH)
  const tag        = payload.slice(TAG_OFFSET,         TAG_OFFSET + TAG_LENGTH)
  const ciphertext = payload.slice(CIPHERTEXT_OFFSET)

  // 2. Derive AES key from salt + pin
  const derivedKey = await deriveKey(pin, salt)

  let unwrappedKey = null
  try {
    // 3. Unwrap AES key with RSA private key
    unwrappedKey = crypto.privateDecrypt(
      { key: rsaPrivateKey, oaepHash: 'sha256' },
      wrappedKey
    )

    // 4. Decrypt with AES-256-GCM and verify authentication tag
    const decipher = crypto.createDecipheriv('aes-256-gcm', unwrappedKey, iv)
    decipher.setAuthTag(tag)

    let plaintext
    try {
      plaintext = Buffer.concat([
        decipher.update(ciphertext),
        decipher.final()
      ]).toString('utf8')
    } catch (err) {
      // GCM tag mismatch surfaces here
      throw new CryptoError()
    }

    return plaintext
  } finally {
    // 5. Zeroize key buffers
    zeroize(derivedKey)
    if (unwrappedKey) zeroize(unwrappedKey)
  }
}
