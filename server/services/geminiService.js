import axios from 'axios'

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'

async function callGemini(prompt) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured')
    }

    const res = await axios.post(
      `${GEMINI_URL}?key=${process.env.GEMINI_API_KEY}`,
      { contents: [{ parts: [{ text: prompt }] }] },
      { timeout: 30000 }
    )

    if (!res.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid response from Gemini API')
    }

    return res.data.candidates[0].content.parts[0].text
  } catch (error) {
    console.error('Gemini API Error:', error.response?.data || error.message)
    
    if (error.response?.status === 400) {
      throw new Error('Invalid Gemini API key or request format')
    } else if (error.response?.status === 429) {
      throw new Error('Gemini API rate limit exceeded. Please try again later.')
    } else if (error.response?.status === 403) {
      throw new Error('Gemini API key is invalid or expired')
    } else {
      throw new Error(`Gemini API error: ${error.message}`)
    }
  }
}

export async function generateScript(idea, tone = 'motivational') {
  const prompt = `You are a professional content creator. Write a short, engaging ${tone} script (60-90 seconds when spoken) for: "${idea}". Make it punchy, emotional, and ready to record. No stage directions, just the spoken words.`
  return callGemini(prompt)
}

export async function generateAdvice(problem) {
  const prompt = `You are a calm, wise life mentor. A person says: "${problem}". Give clear, structured, practical advice in 3-4 steps. Be warm, direct, and actionable. Keep it under 150 words.`
  return callGemini(prompt)
}

export async function generatePlan(goal) {
  const prompt = `You are a productivity coach. Create a practical, actionable daily plan for this goal: "${goal}". Format your response ONLY as numbered steps like: 1. Step one 2. Step two etc. Maximum 7 steps. Each step should be specific and doable in one day. Keep each step under 20 words. No bullet points, no headers, just numbered steps.`
  return callGemini(prompt)
}

export async function explainTopic(topic, mode = 'normal') {
  const prompts = {
    normal: `Explain "${topic}" clearly like a great teacher. Use simple language, give an example, and keep it under 150 words.`,
    simple: `Explain "${topic}" like I am 10 years old. Use very simple words, a fun analogy, and keep it under 100 words.`,
    revision: `Give a quick revision summary of "${topic}" in bullet points. Max 5 bullets, each one sentence. Focus on key facts only.`
  }
  return callGemini(prompts[mode] || prompts.normal)
}
