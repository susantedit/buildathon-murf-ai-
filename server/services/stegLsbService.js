/**
 * stegLsbService.js — LSB Steganographic Codec for WAV audio
 *
 * WAV layout assumed:
 *   - Standard 44-byte PCM WAV header (never modified)
 *   - Samples start at byte offset 44
 *   - Each sample is a signed 16-bit little-endian integer
 *   - Only the LSB (bit 0) of each sample is modified
 *
 * Bit packing: MSB-first
 *   bit 7 of payload byte → first sample LSB
 *   bit 0 of payload byte → eighth sample LSB
 *
 * Embedded layout:
 *   Samples 0–31:   4-byte big-endian payload length header (32 bits)
 *   Samples 32–N:   payload bytes (8 samples per byte)
 */

const WAV_HEADER_SIZE = 44
const LENGTH_HEADER_BITS = 32 // 4 bytes × 8 bits

// ─── Error Classes ────────────────────────────────────────────────────────────

export class LsbCapacityError extends Error {
  constructor (message = 'Audio too short for message') {
    super(message)
    this.name = 'LsbCapacityError'
  }
}

export class LsbMalformedError extends Error {
  constructor (message = 'Could not read hidden data') {
    super(message)
    this.name = 'LsbMalformedError'
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Return the number of 16-bit PCM samples in the WAV data section.
 * @param {Buffer} wavBuffer
 * @returns {number}
 */
function numSamples (wavBuffer) {
  return (wavBuffer.length - WAV_HEADER_SIZE) / 2
}

/**
 * Read a signed Int16LE sample from the WAV buffer at the given sample index.
 * @param {Buffer} buf
 * @param {number} sampleIndex  0-based index into the sample array
 * @returns {number}  signed 16-bit integer
 */
function readSample (buf, sampleIndex) {
  return buf.readInt16LE(WAV_HEADER_SIZE + sampleIndex * 2)
}

/**
 * Write a signed Int16LE sample into the buffer at the given sample index.
 * @param {Buffer} buf
 * @param {number} sampleIndex
 * @param {number} value  signed 16-bit integer
 */
function writeSample (buf, sampleIndex, value) {
  buf.writeInt16LE(value, WAV_HEADER_SIZE + sampleIndex * 2)
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Return the maximum number of payload bytes that can be embedded in the WAV.
 *
 * Formula: Math.floor((numSamples - 32) / 8)
 *   - 32 samples are reserved for the 4-byte big-endian length header
 *   - Each payload byte requires 8 samples (one bit per sample)
 *
 * @param {Buffer} wavBuffer
 * @returns {number}
 */
export function capacity (wavBuffer) {
  const n = numSamples(wavBuffer)
  return Math.floor((n - LENGTH_HEADER_BITS) / 8)
}

/**
 * Embed payload bytes into the LSB of each 16-bit PCM sample.
 *
 * A 4-byte big-endian length header is prepended to the payload before
 * embedding so the decoder knows exactly how many bytes to extract.
 *
 * The original wavBuffer is never mutated; a new Buffer is returned.
 *
 * @param {Buffer} wavBuffer  Cover audio (standard 44-byte PCM WAV)
 * @param {Buffer} payload    Bytes to embed
 * @returns {Buffer}          New WAV Buffer with payload embedded in LSBs
 * @throws {LsbCapacityError} If the audio has insufficient capacity
 */
export function encode (wavBuffer, payload) {
  const cap = capacity(wavBuffer)
  if (payload.length > cap) {
    throw new LsbCapacityError(
      `Payload length ${payload.length} exceeds WAV capacity ${cap}`
    )
  }

  // Copy the entire WAV buffer — never mutate the original
  const out = Buffer.from(wavBuffer)

  // Build the full bit stream: 4-byte big-endian length header + payload bytes
  const lengthHeader = Buffer.allocUnsafe(4)
  lengthHeader.writeUInt32BE(payload.length, 0)
  const fullData = Buffer.concat([lengthHeader, payload])

  // Embed each bit into the LSB of successive samples (MSB-first within each byte)
  let sampleIndex = 0
  for (let byteIdx = 0; byteIdx < fullData.length; byteIdx++) {
    const byte = fullData[byteIdx]
    for (let bitPos = 7; bitPos >= 0; bitPos--) {
      const bit = (byte >>> bitPos) & 1
      const sample = readSample(out, sampleIndex)
      // Clear LSB and set to the payload bit
      const modified = (sample & ~1) | bit
      writeSample(out, sampleIndex, modified)
      sampleIndex++
    }
  }

  return out
}

/**
 * Extract payload bytes from a stego WAV Buffer.
 *
 * Reads the 4-byte big-endian length header from the first 32 sample LSBs,
 * then extracts that many bytes from the subsequent sample LSBs.
 *
 * @param {Buffer} wavBuffer  Stego WAV Buffer
 * @returns {Buffer}          Extracted payload bytes
 * @throws {LsbMalformedError} If the length header value exceeds available samples
 */
export function decode (wavBuffer) {
  const n = numSamples(wavBuffer)

  // Need at least 32 samples to read the length header
  if (n < LENGTH_HEADER_BITS) {
    throw new LsbMalformedError('WAV too short to contain a length header')
  }

  // Read 32 bits (4 bytes) from the first 32 sample LSBs — big-endian
  let lengthValue = 0
  for (let i = 0; i < LENGTH_HEADER_BITS; i++) {
    const bit = readSample(wavBuffer, i) & 1
    lengthValue = (lengthValue << 1) | bit
  }
  // lengthValue is a 32-bit unsigned integer (JS bitwise ops work on 32-bit signed,
  // so convert to unsigned)
  lengthValue = lengthValue >>> 0

  // Validate: the payload bytes must fit in the remaining samples
  const remainingSamples = n - LENGTH_HEADER_BITS
  const maxPayloadBytes = Math.floor(remainingSamples / 8)
  if (lengthValue > maxPayloadBytes) {
    throw new LsbMalformedError(
      `Length header value ${lengthValue} exceeds available capacity ${maxPayloadBytes}`
    )
  }

  // Extract `lengthValue` bytes from samples starting at index 32
  const payload = Buffer.allocUnsafe(lengthValue)
  let sampleIndex = LENGTH_HEADER_BITS

  for (let byteIdx = 0; byteIdx < lengthValue; byteIdx++) {
    let byte = 0
    for (let bitPos = 7; bitPos >= 0; bitPos--) {
      const bit = readSample(wavBuffer, sampleIndex) & 1
      byte |= (bit << bitPos)
      sampleIndex++
    }
    payload[byteIdx] = byte
  }

  return payload
}
