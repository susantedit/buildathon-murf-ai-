import mongoose from 'mongoose'

const stegMessageSchema = new mongoose.Schema({
  // Encrypted payload bytes (salt + IV + wrappedKey + tag + ciphertext)
  payload: { type: Buffer, required: true },

  // Reference to the stego WAV file (GridFS file ID or storage URL)
  coverAudioRef: { type: String, required: true },

  // Burn-on-read state
  read: { type: Boolean, default: false, index: true },
  readAt: { type: Date, default: null },

  // Delivery metadata
  senderId: { type: String, required: true },
  receiverId: { type: String, required: true },
  roomId: { type: String, required: true },

  createdAt: { type: Date, default: Date.now, index: true },
})

// TTL index: auto-delete unread documents after 24 hours
stegMessageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 })

// Compound index for atomic burn query
stegMessageSchema.index({ _id: 1, read: 1 })

export default mongoose.model('StegMessage', stegMessageSchema)
