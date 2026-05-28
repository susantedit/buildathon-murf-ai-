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

function buildPhaseLabel(turnCount) {
  if (turnCount <= 3) return 'Phase 1'
  if (turnCount <= 7) return 'Phase 2'
  if (turnCount <= 12) return 'Phase 3'
  return 'Phase 4'
}

function extractListMatches(text, regex) {
  return Array.from(new Set((text.match(regex) || []).map(item => item.trim()).filter(Boolean)))
}

function fallbackPersonaLine(persona, scammerMessage, turnCount) {
  const phase = buildPhaseLabel(turnCount)
  const samples = {
    elderly: [
      'Oh dear, can you say that again a little slower?',
      'I think I need my glasses for that part. Wait, let me look.',
      'My grandson usually helps me with this. What did you say your name was?',
      'I wrote something down, but I may have mixed up the numbers.',
    ],
    professional: [
      'I am going to need verification before we proceed.',
      'That is interesting. What department are you with again?',
      'Please hold while I confirm the details on my end.',
      'Send me the reference number and your supervisor information.',
    ],
    newbie: [
      'Sorry, I am not sure what that means. Can you explain it more simply?',
      'I think I tapped the wrong thing. What should I do now?',
      'Could you repeat that slowly from the beginning?',
      'I am trying to follow along, but I may need step-by-step help.',
    ],
  }

  const lines = samples[persona?.id] || samples.professional
  const chosen = lines[(turnCount - 1) % lines.length]
  const leadIn = phase === 'Phase 4'
    ? 'I am still here, but I need one more detail before I can do anything.'
    : phase === 'Phase 3'
      ? 'Almost got it, I just need to confirm a few things first.'
      : ''

  return [leadIn, chosen, scammerMessage.includes('?') ? 'Could you clarify that for me?' : 'Please repeat the important part one more time.']
    .filter(Boolean)
    .join(' ')
    .slice(0, 260)
}

function fallbackIntel(conversationText) {
  const text = conversationText || ''
  const compactText = text.replace(/\s+/g, ' ').trim()
  const lower = text.toLowerCase()

  const phoneNumbers = extractListMatches(text, /(?:\+?\d[\d\s().-]{6,}\d)/g)
    .filter(value => value.replace(/\D/g, '').length >= 7)
    .slice(0, 8)

  const upiIds = extractListMatches(text, /[a-z0-9._-]+@[a-z0-9.-]+/gi)
    .filter(value => /upi|paytm|phonepe|gpay|googlepay|ybl|ibl|axl|okicici|oksbi/i.test(value) || /@/.test(value))
    .slice(0, 8)

  const suspiciousLinks = extractListMatches(text, /https?:\/\/[^\s)]+/gi).slice(0, 8)
  const emailAddresses = extractListMatches(text, /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi).slice(0, 8)
  const otpCodes = extractListMatches(text, /(?:otp|verification code|code|pin)[^\d]{0,12}(\d{4,8})/gi).slice(0, 8)
  const moneyAmounts = extractListMatches(text, /(?:₹|rs\.?|inr|usd|\$)\s?\d[\d,]*(?:\.\d{1,2})?/gi).slice(0, 8)
  const accountHints = extractListMatches(text, /(?:account|ac no|a\/c|card|routing|ifsc|swift|cvv|pin|passcode)[^\n.]{0,40}/gi).slice(0, 8)
  const courierRefs = extractListMatches(text, /(?:dhl|fedex|ups|courier|parcel|shipment|delivery|tracking)[^\n.]{0,40}/gi).slice(0, 8)
  const paymentApps = extractListMatches(text, /\b(?:paytm|phonepe|gpay|google pay|amazon pay|cash app|venmo|zelle)\b/gi).slice(0, 6)

  const bankNames = ['HDFC', 'ICICI', 'SBI', 'Axis', 'Kotak', 'PNB', 'Bank of America', 'Chase', 'Wells Fargo']
    .filter(name => new RegExp(`\\b${name.replace(/\s+/g, '\\s+')}\\b`, 'i').test(text))

  const companyNames = extractListMatches(text, /\b[A-Z][A-Za-z0-9&.-]{2,}(?:\s+[A-Z][A-Za-z0-9&.-]{2,}){0,3}\b/g)
    .filter(name => !['SCAMMER', 'AGENT', 'CAGEBAIT', 'PLEASE', 'THANK', 'USD', 'INR'].includes(name.toUpperCase()))
    .slice(0, 10)

  const scamType = /bank|account|login|otp|pin|cvv|ifsc|wire/i.test(lower)
    ? 'Financial account verification scam'
    : /tech support|support|computer|virus|remote access|anydesk|teamviewer/i.test(lower)
      ? 'Tech support scam'
      : /courier|parcel|delivery|shipment|tracking|customs/i.test(lower)
        ? 'Courier or delivery scam'
        : /job|hiring|interview|salary|hr|recruitment/i.test(lower)
          ? 'Job offer scam'
          : /crypto|wallet|bitcoin|usdt|usdc|binance|coinbase/i.test(lower)
            ? 'Crypto investment scam'
            : /romance|dating|love|relationship/i.test(lower)
              ? 'Romance scam'
              : /gift|prize|lottery|winner|reward|claim/i.test(lower)
                ? 'Prize or giveaway scam'
                : /refund|invoice|subscription|billing/i.test(lower)
                  ? 'Refund or billing scam'
                  : 'Suspicious scam attempt'

  const redFlags = []
  if (/urgent|immediately|right now|today only|last chance|within (?:5|10|15) minutes|expires soon/i.test(lower)) redFlags.push('Pressure tactics and urgency used')
  if (phoneNumbers.length) redFlags.push('Direct callback number shared')
  if (suspiciousLinks.length) redFlags.push('Suspicious link requested or shared')
  if (upiIds.length) redFlags.push('Payment credential pattern detected')
  if (otpCodes.length) redFlags.push('OTP or verification code solicitation detected')
  if (moneyAmounts.length) redFlags.push('Explicit monetary demand or payout mentioned')
  if (accountHints.length) redFlags.push('Sensitive account or card detail request')
  if (/remote access|anydesk|teamviewer|screen share|install (?:software|app)|allow access/i.test(lower)) redFlags.push('Remote access requested')
  if (courierRefs.length) redFlags.push('Courier or delivery pretext used')
  if (paymentApps.length) redFlags.push('Payment app referenced')

  const urgencyTactics = extractListMatches(text, /(?:urgent|immediately|right now|last chance|final notice|act now|do not hang up|verify now|expires? today)[^.\n]*/gi).slice(0, 6)
  const artifactCount = [phoneNumbers, suspiciousLinks, upiIds, otpCodes, accountHints].filter(list => list.length > 0).length
  const summary = artifactCount > 0
    ? `A ${scamType.toLowerCase()} was identified from the transcript. The fallback extractor captured high-signal artifacts for review.`
    : 'The conversation was analyzed locally and preserved for further review. No strong structured artifacts were present in the fallback pass.'

  return {
    phoneNumbers,
    bankNames,
    upiIds,
    suspiciousLinks,
    emailAddresses,
    companyNames,
    employeeIds: extractListMatches(text, /\b(?:EMP|ID|REF|TICKET|CASE|TKT)[-\s:]?[A-Z0-9-]{3,}\b/gi).slice(0, 8),
    scamType,
    redFlags: [...new Set(redFlags)],
    urgencyTactics: [...new Set(urgencyTactics)],
    summary,
    otpCodes,
    moneyAmounts,
    accountHints,
    courierRefs,
    paymentApps,
    fallbackConfidence: artifactCount > 2 ? 'high' : artifactCount > 0 ? 'medium' : 'low',
  }
}

function fallbackSessionSummary(conversationHistory, intel, personaId, durationSeconds) {
  const minutes = Math.floor(durationSeconds / 60)
  const seconds = durationSeconds % 60
  const scamType = intel?.scamType || 'Unknown scam type'
  const intelCount = [
    ...(intel?.phoneNumbers || []),
    ...(intel?.upiIds || []),
    ...(intel?.bankNames || []),
    ...(intel?.companyNames || []),
  ].length
  const turnCount = conversationHistory.length

  return `${PERSONAS[personaId]?.name || 'Agent'} kept the scammer engaged for ${minutes}m ${seconds}s across ${turnCount} turns. ${scamType}. Captured ${intelCount} intel items for review.`
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

  try {
    const response = await callGroq(messages, 0.9, 200)
    return response.trim()
  } catch (error) {
    console.warn('[CageBait] Falling back to local persona response:', error.message)
    return fallbackPersonaLine(persona, scammerMessage, turnCount)
  }
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
  } catch (error) {
    console.warn('[CageBait] Falling back to local intel extraction:', error.message)
    return fallbackIntel(conversationText)
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
  } catch (error) {
    console.warn('[CageBait] Falling back to local session summary:', error.message)
    return fallbackSessionSummary(conversationHistory, intel, personaId, durationSeconds)
  }
}
