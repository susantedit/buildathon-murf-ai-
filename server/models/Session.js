import mongoose from 'mongoose'

const sessionSchema = new mongoose.Schema({
  userId: { type: String, index: true, default: 'anonymous' },
  mode: {
    type: String,
    required: true
  },
  inputText: { type: String, required: true },
  responseText: { type: String, default: '' },
  audioUrl: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
})

export default mongoose.model('Session', sessionSchema)
