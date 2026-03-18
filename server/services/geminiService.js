import axios from 'axios'

// Groq API - FREE and FAST!
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'

async function callGroq(prompt) {
  try {
    const GROQ_API_KEY = process.env.GROQ_API_KEY // Get it here, not at module level
    
    console.log('GROQ_API_KEY exists:', !!GROQ_API_KEY)
    console.log('GROQ_API_KEY value:', GROQ_API_KEY ? 'Set (hidden)' : 'NOT SET')
    
    if (!GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY is not configured')
    }

    const res = await axios.post(
      GROQ_URL,
      {
        model: 'llama-3.3-70b-versatile', // Updated model (free and fast)
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1024
      },
      {
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    )

    if (!res.data?.choices?.[0]?.message?.content) {
      throw new Error('Invalid response from Groq API')
    }

    return res.data.choices[0].message.content
  } catch (error) {
    console.error('Groq API Error:', error.response?.data || error.message)
    
    if (error.response?.status === 401) {
      throw new Error('Invalid Groq API key. Get one free at https://console.groq.com/')
    } else if (error.response?.status === 429) {
      throw new Error('Groq API rate limit exceeded. Please try again later.')
    } else {
      throw new Error(`Groq API error: ${error.message}`)
    }
  }
}

export async function generateScript(idea, tone = 'motivational') {
  const prompt = `You are a professional content creator. Write a short, engaging ${tone} script (60-90 seconds when spoken) for: "${idea}". Make it punchy, emotional, and ready to record. No stage directions, just the spoken words.`
  return callGroq(prompt)
}

export async function generateAdvice(problem) {
  const prompt = `You are a calm, wise life mentor. A person says: "${problem}". Give clear, structured, practical advice in 3-4 steps. Be warm, direct, and actionable. Keep it under 150 words.`
  return callGroq(prompt)
}

export async function generatePlan(goal) {
  const prompt = `You are a productivity coach. Create a practical, actionable daily plan for this goal: "${goal}". Format your response ONLY as numbered steps like: 1. Step one 2. Step two etc. Maximum 7 steps. Each step should be specific and doable in one day. Keep each step under 20 words. No bullet points, no headers, just numbered steps.`
  return callGroq(prompt)
}

export async function explainTopic(topic, mode = 'normal') {
  const prompts = {
    normal: `Explain "${topic}" clearly like a great teacher. Use simple language, give an example, and keep it under 150 words.`,
    simple: `Explain "${topic}" like I am 10 years old. Use very simple words, a fun analogy, and keep it under 100 words.`,
    revision: `Give a quick revision summary of "${topic}" in bullet points. Max 5 bullets, each one sentence. Focus on key facts only.`
  }
  return callGroq(prompts[mode] || prompts.normal)
}
