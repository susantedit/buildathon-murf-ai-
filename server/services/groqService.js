import axios from 'axios'

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'

function normalizeKeyList(values = []) {
  return [...new Set(values.map(value => String(value || '').trim()).filter(Boolean))]
}

export function getGroqKeys() {
  const numberedKeys = [
    process.env.GROQ_API_KEY,
    process.env.GROQ_API_KEY_2,
    process.env.GROQ_API_KEY_3,
    process.env.GROQ_API_KEY_4,
    process.env.GROQ_API_KEY_5,
  ]

  const csvKeys = String(process.env.GROQ_API_KEYS || '')
    .split(/[\n,;]/)
    .map(key => key.trim())
    .filter(Boolean)

  return normalizeKeyList([...numberedKeys, ...csvKeys])
}

function stripJsonFence(content = '') {
  return content
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim()
}

function parseJsonResponse(content, fallback) {
  try {
    return JSON.parse(stripJsonFence(content))
  } catch {
    const start = content.indexOf('{')
    const end = content.lastIndexOf('}')
    if (start >= 0 && end > start) {
      try { return JSON.parse(content.slice(start, end + 1)) } catch {}
    }
    return fallback
  }
}

async function callGroq(prompt, { model = 'llama-3.3-70b-versatile', temperature = 0.7, maxTokens = 1024 } = {}) {
  const keys = getGroqKeys()
  if (!keys.length) throw new Error('No GROQ_API_KEY configured')

  let lastError
  for (const key of keys) {
    try {
      const res = await axios.post(
        GROQ_URL,
        {
          model,
          messages: [{ role: 'user', content: prompt }],
          temperature,
          max_tokens: maxTokens,
        },
        {
          headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
          timeout: 30000,
        }
      )

      const content = res.data?.choices?.[0]?.message?.content
      if (!content) throw new Error('Invalid response from Groq')
      return content
    } catch (err) {
      const status = err.response?.status
      const shouldFailover = !status || [401, 403, 408, 429, 500, 502, 503, 504].includes(status)
      if (shouldFailover) {
        lastError = err
        continue
      }
      throw new Error(`Groq API error: ${err.response?.data?.error?.message || err.message}`)
    }
  }
  throw lastError || new Error('All GROQ_API_KEY values exhausted')
}

export async function generateScript(idea, tone = 'motivational') {
  return callGroq(
    `You are a professional content creator. Write a short, engaging ${tone} script (60-90 seconds when spoken) for: "${idea}". Make it punchy, emotional, and ready to record. No stage directions, just the spoken words.`,
    { maxTokens: 700 }
  )
}

export async function generateAdvice(problem) {
  return callGroq(
    `You are a calm, wise life mentor. A person says: "${problem}". Give clear, structured, practical advice in 3-4 steps. Be warm, direct, and actionable. Keep it under 150 words.`,
    { maxTokens: 500 }
  )
}

export async function explainTopic(topic, mode = 'normal') {
  const prompts = {
    normal: `Explain "${topic}" clearly like a great teacher. Use simple language, give an example, and keep it under 150 words.`,
    simple: `Explain "${topic}" like I am 10 years old. Use very simple words, a fun analogy, and keep it under 100 words.`,
    revision: `Give a quick revision summary of "${topic}" in bullet points. Max 5 bullets, each one sentence. Focus on key facts only.`,
  }
  return callGroq(prompts[mode] || prompts.normal, { maxTokens: 450 })
}

export async function generatePlan(goal) {
  return callGroq(
    `You are a productivity coach. Create a practical, actionable daily plan for this goal: "${goal}". Format your response ONLY as numbered steps like: 1. Step one 2. Step two etc. Maximum 7 steps. Each step should be specific and doable in one day. Keep each step under 20 words. No bullet points, no headers, just numbered steps.`,
    { maxTokens: 450 }
  )
}

export async function describeImage(base64Image, mimeType = 'image/jpeg') {
  const keys = getGroqKeys()
  if (!keys.length) throw new Error('No GROQ_API_KEY configured')

  const visionModels = [
    'meta-llama/llama-4-scout-17b-16e-instruct',
    'llava-v1.5-7b-4096-preview',
  ]

  let lastError
  for (const key of keys) {
    for (const model of visionModels) {
      try {
        const res = await axios.post(
          GROQ_URL,
          {
            model,
            messages: [{
              role: 'user',
              content: [
                { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Image}` } },
                { type: 'text', text: 'Describe this image in 3-4 vivid sentences. Be specific about colors, objects, people, mood, and setting. Write as if narrating to someone who cannot see it.' },
              ]
            }],
            temperature: 0.7,
            max_tokens: 512,
          },
          {
            headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
            timeout: 30000,
          }
        )

        const content = res.data?.choices?.[0]?.message?.content
        if (!content) throw new Error('Invalid response')
        return content
      } catch (err) {
        const status = err.response?.status
        if (status === 429 || status === 401) { lastError = err; break }
        if (status === 400) { lastError = err; continue }
        throw new Error(`Vision API error: ${err.response?.data?.error?.message || err.message}`)
      }
    }
  }
  throw lastError || new Error('All vision models/keys exhausted')
}

export async function generateInterviewPlan({ role, company = '', seniority = 'mid-level', focus = '', tone = 'professional', goal = '' }) {
  const prompt = `You are designing a premium mock interview experience.

Return valid JSON only with this exact shape:
{
  "title": "...",
  "description": "...",
  "openingLine": "...",
  "estimatedMinutes": 30,
  "questionBank": [
    { "id": 1, "category": "...", "question": "...", "whyItMatters": "...", "idealSignal": "..." }
  ],
  "evaluationRubric": [
    { "skill": "...", "weight": 25, "description": "..." }
  ],
  "coachNotes": ["..."],
  "closingLine": "...",
  "voiceStyle": "calm"
}

Build the interview for the role "${role}"${company ? ` at ${company}` : ''}.
Seniority: ${seniority}.
Focus areas: ${focus || 'communication, problem solving, ownership, collaboration'}.
Tone: ${tone}.
Goal: ${goal || 'help the candidate perform confidently in a live interview'}.

Make it practical, modern, and specific. Include exactly 6 questions. Keep openingLine concise and suitable for Murf narration.`

  const content = await callGroq(prompt, { temperature: 0.55, maxTokens: 1600 })
  return parseJsonResponse(content, {
    title: `${role} interview`,
    description: `Practice interview for ${role}`,
    openingLine: `Welcome to your mock interview for ${role}. Let's begin.`,
    estimatedMinutes: 30,
    questionBank: [],
    evaluationRubric: [],
    coachNotes: [],
    closingLine: 'Great work today.',
    voiceStyle: 'calm',
  })
}

export async function continueInterview({ plan, transcript = [], currentQuestion = '', answer = '', turn = 1, unverified = false }) {
  const prompt = `You are a skilled interview coach running a live mock interview.

Return valid JSON only with this shape:
{
  "reply": "...",
  "nextQuestion": "...",
  "progressText": "...",
  "score": 0,
  "coachingNote": "...",
  "strength": "...",
  "gap": "...",
  "isComplete": false,
  "summarySnippet": "...",
  "unverifiedFacts": ["..."]
}

Interview plan:
${JSON.stringify(plan).slice(0, 7000)}

Transcript so far:
${JSON.stringify(transcript).slice(0, 7000)}

Current question:
${currentQuestion}

Candidate answer:
${answer}

Turn: ${turn}

The caller may request "unverified" output. The value is: ${unverified}.
If ${unverified} then populate the unverifiedFacts array with up to 3 concise, plausible-sounding but possibly unverified observations or facts related to the candidate's answer (each one short). If ${unverified} is false, return an empty array for unverifiedFacts.

Keep reply short and natural, like a real interviewer. Provide one nextQuestion unless the interview should wrap. The nextQuestion should feel like a follow-up or a smooth transition to the next round.`

  const content = await callGroq(prompt, { temperature: 0.5, maxTokens: 1000 })
  return parseJsonResponse(content, {
    reply: 'Thanks. Let us keep going.',
    nextQuestion: plan?.questionBank?.[turn]?.question || '',
    progressText: `Question ${turn + 1}`,
    score: 72,
    coachingNote: 'Good structure, add more specifics.',
    strength: 'Clear communication',
    gap: 'Needs more concrete examples',
    isComplete: false,
    summarySnippet: 'Solid answer with room for more detail.',
    unverifiedFacts: [],
  })
}

export async function summarizeInterview({ plan, transcript = [] }) {
  const prompt = `You are generating a final interview review for a mock interview product.

Return valid JSON only with this exact shape:
{
  "summary": "...",
  "overallScore": 0,
  "hiringVerdict": "...",
  "strengths": ["..."],
  "gaps": ["..."],
  "recommendations": ["..."],
  "questionScores": [
    { "question": "...", "score": 0, "note": "..." }
  ],
  "bestMoments": ["..."],
  "nextPracticePlan": ["..."],
  "closingLine": "..."
}

Interview plan:
${JSON.stringify(plan).slice(0, 7000)}

Transcript:
${JSON.stringify(transcript).slice(0, 12000)}

Make the review specific, encouraging, and actionable. The summary should read like premium interview feedback.`

  const content = await callGroq(prompt, { temperature: 0.45, maxTokens: 1400 })
  return parseJsonResponse(content, {
    summary: 'You completed a strong mock interview. Keep tightening examples and clarity.',
    overallScore: 78,
    hiringVerdict: 'Promising candidate',
    strengths: ['Clear structure', 'Good pacing'],
    gaps: ['Needs sharper examples', 'Could be more concise'],
    recommendations: ['Use STAR framing', 'Prepare one impact story per skill'],
    questionScores: [],
    bestMoments: ['Answered with confidence'],
    nextPracticePlan: ['Rehearse stories out loud', 'Practice follow-ups'],
    closingLine: 'You are close. Keep iterating and you will level up quickly.',
  })
}