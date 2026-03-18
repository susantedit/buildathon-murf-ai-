import express from 'express'
import axios from 'axios'

const router = express.Router()

// Test endpoint to verify API keys
router.get('/test-apis', async (req, res) => {
  const results = {
    mongodb: false,
    gemini: false,
    murf: false,
    errors: {}
  }

  // Test MongoDB
  try {
    const mongoose = await import('mongoose')
    results.mongodb = mongoose.default.connection.readyState === 1
    if (!results.mongodb) {
      results.errors.mongodb = 'MongoDB not connected'
    }
  } catch (err) {
    results.errors.mongodb = err.message
  }

  // Test Gemini API
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not set')
    }
    
    const geminiRes = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      { contents: [{ parts: [{ text: 'Say hello' }] }] },
      { timeout: 10000 }
    )
    
    results.gemini = !!geminiRes.data?.candidates?.[0]?.content
  } catch (err) {
    results.errors.gemini = err.response?.data?.error?.message || err.message
  }

  // Test Murf API
  try {
    if (!process.env.MURF_API_KEY) {
      throw new Error('MURF_API_KEY not set')
    }
    
    const murfRes = await axios.post(
      'https://api.murf.ai/v1/speech/generate',
      {
        voiceId: 'en-US-natalie',
        text: 'Hello',
        format: 'MP3',
        sampleRate: 24000
      },
      {
        headers: {
          'api-key': process.env.MURF_API_KEY,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    )
    
    results.murf = !!(murfRes.data?.audioFile || murfRes.data?.encodedAudio)
  } catch (err) {
    results.errors.murf = err.response?.data?.message || err.message
  }

  const allWorking = results.mongodb && results.gemini && results.murf

  res.status(allWorking ? 200 : 500).json({
    status: allWorking ? 'All APIs working' : 'Some APIs failed',
    results,
    timestamp: new Date().toISOString()
  })
})

export default router
