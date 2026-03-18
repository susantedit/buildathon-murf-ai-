import mongoose from 'mongoose'

const sessionSchema = new mongoose.Schema({
  mode: {
    type: String,
    enum: ['creator', 'assistant', 'study', 'focus', 'planner'],
    required: true
  },
  inputText: { type: String, required: true },
  responseText: { type: String, default: '' },
  audioUrl: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
})

export default mongoose.model('Session', sessionSchema)
