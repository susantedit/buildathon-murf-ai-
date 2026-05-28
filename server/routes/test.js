import express from 'express'
import axios from 'axios'
import { getGroqKeys } from '../services/groqService.js'

const router = express.Router()

// Test endpoint to verify API keys
router.get('/test-apis', async (req, res) => {
  const results = {
    mongodb: false,
    groq: false,
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

  // Test Groq API
  try {
    const keys = getGroqKeys()
    if (!keys.length) {
      throw new Error('GROQ_API_KEY not set')
    }
    
    let lastError
    for (const key of keys) {
      try {
        const groqRes = await axios.post(
          'https://api.groq.com/openai/v1/chat/completions',
          {
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: 'Say hello' }],
            max_tokens: 50
          },
          {
            headers: {
              'Authorization': `Bearer ${key}`,
              'Content-Type': 'application/json'
            },
            timeout: 10000
          }
        )

        results.groq = !!groqRes.data?.choices?.[0]?.message?.content
        lastError = null
        break
      } catch (err) {
        const status = err.response?.status
        if (!status || [401, 403, 408, 429, 500, 502, 503, 504].includes(status)) {
          lastError = err
          continue
        }
        throw err
      }
    }

    if (!results.groq && lastError) {
      throw lastError
    }
  } catch (err) {
    results.errors.groq = err.response?.data?.error?.message || err.message
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

  const allWorking = results.mongodb && results.groq && results.murf

  res.status(allWorking ? 200 : 500).json({
    status: allWorking ? 'All APIs working' : 'Some APIs failed',
    results,
    timestamp: new Date().toISOString()
  })
})

export default router
