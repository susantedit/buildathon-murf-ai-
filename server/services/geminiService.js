import axios from 'axios'

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'

// Multiple keys — auto-fallback when one hits rate limit
function getKeys() {
  return [
    process.env.GROQ_API_KEY,
    process.env.GROQ_API_KEY_2,
    process.env.GROQ_API_KEY_3,
  ].filter(Boolean)
}

async function callGroq(prompt) {
  const keys = getKeys()
  if (!keys.length) throw new Error('No GROQ_API_KEY configured')

  let lastError
  for (const key of keys) {
    try {
      const res = await axios.post(
        GROQ_URL,
        {
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 1024,
        },
        {
          headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
          timeout: 30000,
        }
      )
      if (!res.data?.choices?.[0]?.message?.content) throw new Error('Invalid response from Groq')
      return res.data.choices[0].message.content
    } catch (err) {
      const status = err.response?.status
      if (status === 429 || status === 401) {
        // Rate limited or invalid — try next key
        console.warn(`Groq key failed (${status}), trying next key...`)
        lastError = err
        continue
      }
      // Other errors — throw immediately
      throw new Error(`Groq API error: ${err.message}`)
    }
  }
  throw new Error('All Groq API keys exhausted. Add more keys or wait for rate limit reset.')
}

export async function generateScript(idea, tone = 'motivational') {
  return callGroq(`You are a professional content creator. Write a short, engaging ${tone} script (60-90 seconds when spoken) for: "${idea}". Make it punchy, emotional, and ready to record. No stage directions, just the spoken words.`)
}

export async function generateAdvice(problem) {
  return callGroq(`You are a calm, wise life mentor. A person says: "${problem}". Give clear, structured, practical advice in 3-4 steps. Be warm, direct, and actionable. Keep it under 150 words.`)
}

export async function generatePlan(goal) {
  return callGroq(`You are a productivity coach. Create a practical, actionable daily plan for this goal: "${goal}". Format your response ONLY as numbered steps like: 1. Step one 2. Step two etc. Maximum 7 steps. Each step should be specific and doable in one day. Keep each step under 20 words. No bullet points, no headers, just numbered steps.`)
}

export async function explainTopic(topic, mode = 'normal') {
  const prompts = {
    normal:   `Explain "${topic}" clearly like a great teacher. Use simple language, give an example, and keep it under 150 words.`,
    simple:   `Explain "${topic}" like I am 10 years old. Use very simple words, a fun analogy, and keep it under 100 words.`,
    revision: `Give a quick revision summary of "${topic}" in bullet points. Max 5 bullets, each one sentence. Focus on key facts only.`,
  }
  return callGroq(prompts[mode] || prompts.normal)
}

export async function describeImage(base64Image, mimeType = 'image/jpeg') {
  const keys = getKeys()
  if (!keys.length) throw new Error('No GROQ_API_KEY configured')

  let lastError
  for (const key of keys) {
    try {
      const res = await axios.post(
        GROQ_URL,
        {
          model: 'meta-llama/llama-4-scout-17b-16e-instruct',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image_url',
                  image_url: { url: `data:${mimeType};base64,${base64Image}` }
                },
                {
                  type: 'text',
                  text: 'Describe this image in 3-4 vivid sentences. Be specific about colors, objects, people, mood, and setting. Write as if narrating to someone who cannot see it.'
                }
              ]
            }
          ],
          temperature: 0.7,
          max_tokens: 512,
        },
        {
          headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
          timeout: 30000,
        }
      )
      if (!res.data?.choices?.[0]?.message?.content) throw new Error('Invalid response')
      return res.data.choices[0].message.content
    } catch (err) {
      const status = err.response?.status
      if (status === 429 || status === 401) { lastError = err; continue }
      throw new Error(`Vision API error: ${err.response?.data?.error?.message || err.message}`)
    }
  }
  throw lastError || new Error('All keys exhausted')
}
