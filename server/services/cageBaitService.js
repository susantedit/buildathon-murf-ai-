import axios from 'axios'

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'

function getKeys() {
  return [
    process.env.GROQ_API_KEY,
    process.env.GROQ_API_KEY_2,
    process.env.GROQ_API_KEY_3,
  ].filter(Boolean)
}

async function callGroq(messages, temperature = 0.85, maxTokens = 512) {
  const keys = getKeys()
  if (!keys.length) throw new Error('No GROQ_API_KEY configured')

  let lastError
  for (const key of keys) {
    try {
      const res = await axios.post(
        GROQ_URL,
        {
          model: 'llama-3.3-70b-versatile',
          messages,
          temperature,
          max_tokens: maxTokens,
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
        lastError = err
        continue
      }
      throw new Error(`Groq API error: ${err.message}`)
    }
  }
  throw lastError || new Error('All Groq API keys exhausted.')
}

// ─── Persona definitions ──────────────────────────────────────────────────────
export const PERSONAS = {
  elderly: {
    id: 'elderly',
    name: 'Grandma Rose',
    description: 'A sweet, slightly confused 74-year-old retired teacher',
    voiceId: 'en-US-natalie',
    systemPrompt: `You are Grandma Rose, a 74-year-old retired school teacher. You are sweet, slightly hard of hearing, and easily confused by technology. You speak slowly, repeat yourself occasionally, and ask clarifying questions. You are talking to someone who called you claiming to be from your bank / tech support / government. Your job is to keep them on the line as long as possible by being confused, asking them to repeat things, going off on tangents about your grandchildren, and occasionally mishearing things. Never give real information — make up fake details (fake account numbers like "4-5-2-1... wait, let me find my glasses", fake names, etc.). Sound completely believable. Keep responses SHORT (1-3 sentences) so the conversation feels natural.`,
    phase1: 'confused and suspicious',
    phase2: 'warming up, starting to trust',
    phase3: 'asking lots of questions, stalling',
    phase4: 'pretending to look for documents',
  },
  professional: {
    id: 'professional',
    name: 'David Chen',
    description: 'A busy 42-year-old financial analyst',
    voiceId: 'en-US-marcus',
    systemPrompt: `You are David Chen, a 42-year-old financial analyst. You are skeptical but polite. You ask pointed questions, demand verification, and make the scammer work hard. You occasionally put them "on hold" to check things. You pretend to be interested in their offer but keep asking for more details and credentials. Make up plausible-sounding fake details when asked for personal info (fake employee IDs, fake account numbers, etc.). Keep responses SHORT (1-3 sentences). Your goal is to waste their time while extracting as much information about their operation as possible.`,
    phase1: 'skeptical, demanding credentials',
    phase2: 'cautiously interested, asking for details',
    phase3: 'pretending to verify, stalling',
    phase4: 'asking about their company, location, supervisor',
  },
  newbie: {
    id: 'newbie',
    name: 'Jamie',
    description: 'A 28-year-old digital newbie who just got their first smartphone',
    voiceId: 'en-US-julia',
    systemPrompt: `You are Jamie, a 28-year-old who just got their first smartphone and is very new to technology. You are eager to help but constantly confused by tech terms. You ask what everything means, misunderstand instructions, accidentally "do the wrong thing", and need everything explained multiple times. You are talking to someone claiming to be from tech support / your bank / a prize company. Keep them on the line by being genuinely confused and needing step-by-step help with everything. Make up fake details when asked for personal info. Keep responses SHORT (1-3 sentences). Sound authentic and a little embarrassed about not understanding tech.`,
    phase1: 'confused, asking what things mean',
    phase2: 'trying to follow instructions but failing',
    phase3: 'accidentally doing wrong things, needing help',
    phase4: 'asking very basic questions to stall',
  },
}

// ─── Phase logic ──────────────────────────────────────────────────────────────
function getPhaseInstruction(persona, turnCount) {
  if (turnCount <= 3) return `Phase 1 — ${persona.phase1}. Be cautious and slightly suspicious.`
  if (turnCount <= 7) return `Phase 2 — ${persona.phase2}. Start to warm up a little.`
  if (turnCount <= 12) return `Phase 3 — ${persona.phase3}. Keep stalling, ask lots of questions.`
  return `Phase 4 — ${persona.phase4}. You're running out of patience but still stalling.`
}

// ─── Generate persona response ────────────────────────────────────────────────
export async function generatePersonaResponse(personaId, conversationHistory, scammerMessage, turnCount) {
  const persona = PERSONAS[personaId]
  if (!persona) throw new Error(`Unknown persona: ${personaId}`)

  const phaseInstruction = getPhaseInstruction(persona, turnCount)

  const messages = [
    {
      role: 'system',
      content: `${persona.systemPrompt}\n\nCurrent phase: ${phaseInstruction}\n\nIMPORTANT: Keep your response to 1-3 sentences maximum. Sound completely human and natural. Never break character.`
    },
    ...conversationHistory.map(m => ({
      role: m.role,
      content: m.content
    })),
    { role: 'user', content: scammerMessage }
  ]

  const response = await callGroq(messages, 0.9, 200)
  return response.trim()
}

// ─── Background intel extraction ─────────────────────────────────────────────
export async function extractIntel(conversationText) {
  const prompt = `You are a scam intelligence analyst. Analyze this conversation transcript and extract any useful information about the scammer.

CONVERSATION:
${conversationText}

Extract and return a JSON object with these fields (use null if not found):
{
  "phoneNumbers": [],
  "bankNames": [],
  "upiIds": [],
  "suspiciousLinks": [],
  "emailAddresses": [],
  "companyNames": [],
  "employeeIds": [],
  "scamType": "string describing the type of scam",
  "redFlags": [],
  "urgencyTactics": [],
  "summary": "2-3 sentence summary of the scam attempt"
}

Return ONLY valid JSON, no explanation.`

  try {
    const raw = await callGroq([{ role: 'user', content: prompt }], 0.2, 800)
    // Extract JSON from response
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null
    return JSON.parse(jsonMatch[0])
  } catch {
    return null
  }
}

// ─── Generate session summary ─────────────────────────────────────────────────
export async function generateSessionSummary(conversationHistory, intel, personaId, durationSeconds) {
  const persona = PERSONAS[personaId]
  const minutes = Math.floor(durationSeconds / 60)
  const seconds = durationSeconds % 60

  const prompt = `Write a brief, professional scam-bait session report (3-4 sentences) for this session:
- Persona used: ${persona?.name || personaId}
- Duration: ${minutes}m ${seconds}s
- Scam type detected: ${intel?.scamType || 'Unknown'}
- Red flags found: ${intel?.redFlags?.join(', ') || 'None identified'}
- Intel captured: ${[...(intel?.phoneNumbers || []), ...(intel?.upiIds || []), ...(intel?.bankNames || [])].join(', ') || 'None'}

Write in a factual, report-style tone. Mention time wasted as a win.`

  try {
    return await callGroq([{ role: 'user', content: prompt }], 0.5, 300)
  } catch {
    return `Session completed. ${persona?.name || 'Agent'} kept the scammer engaged for ${minutes}m ${seconds}s. ${intel?.scamType ? `Detected scam type: ${intel.scamType}.` : ''} Session data saved for analysis.`
  }
}
