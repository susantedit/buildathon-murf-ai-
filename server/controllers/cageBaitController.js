import { generatePersonaResponse, extractIntel, generateSessionSummary, PERSONAS } from '../services/cageBaitService.js'
import { textToSpeech } from '../services/murfService.js'
import Session from '../models/Session.js'

// GET /api/cagebait/personas
export async function handleGetPersonas(req, res) {
  try {
    const personas = Object.values(PERSONAS).map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
    }))
    res.json({ personas })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// POST /api/cagebait/respond
// Body: { personaId, conversationHistory, scammerMessage, turnCount, userId, withVoice }
export async function handleRespond(req, res) {
  try {
    const {
      personaId = 'elderly',
      conversationHistory = [],
      scammerMessage,
      turnCount = 1,
      userId = 'anonymous',
      withVoice = true,
    } = req.body

    if (!scammerMessage) return res.status(400).json({ error: 'scammerMessage is required' })

    console.log(`[CageBait] Persona: ${personaId}, Turn: ${turnCount}, Message: "${scammerMessage.substring(0, 60)}"`)

    // Generate persona text response
    const responseText = await generatePersonaResponse(
      personaId,
      conversationHistory,
      scammerMessage,
      turnCount
    )

    // Generate voice with Murf Falcon (non-fatal if it fails)
    let audioUrl = ''
    if (withVoice) {
      try {
        const persona = PERSONAS[personaId]
        audioUrl = await textToSpeech(responseText, personaId, 'cagebait')
        console.log(`[CageBait] Voice generated for ${persona?.name}`)
      } catch (ttsErr) {
        console.warn('[CageBait] TTS skipped (non-fatal):', ttsErr.message)
      }
    }

    res.json({
      text: responseText,
      response: responseText,
      audio: audioUrl,
      audioUrl,
      turnCount,
    })
  } catch (err) {
    console.error('[CageBait] Respond Error:', err)
    res.status(500).json({ error: err.message || 'Failed to generate response' })
  }
}

// POST /api/cagebait/extract-intel
// Body: { conversationText }
export async function handleExtractIntel(req, res) {
  try {
    const { conversationText } = req.body
    if (!conversationText) return res.status(400).json({ error: 'conversationText is required' })

    console.log('[CageBait] Extracting intel from conversation...')
    const intel = await extractIntel(conversationText)
    res.json({ intel })
  } catch (err) {
    console.error('[CageBait] Intel Extraction Error:', err)
    res.status(500).json({ error: err.message || 'Failed to extract intel' })
  }
}

// POST /api/cagebait/end-session
// Body: { conversationHistory, intel, personaId, durationSeconds, userId }
export async function handleEndSession(req, res) {
  try {
    const {
      conversationHistory = [],
      intel = null,
      personaId = 'elderly',
      durationSeconds = 0,
      userId = 'anonymous',
    } = req.body

    console.log(`[CageBait] Ending session for ${userId}, duration: ${durationSeconds}s`)

    const conversationText = conversationHistory
      .map(m => `${m.role === 'user' ? 'SCAMMER' : 'AGENT'}: ${m.content}`)
      .join('\n')

    const extractedIntel = intel || (conversationText.length > 50 ? await extractIntel(conversationText) : null)

    // Generate summary
    const summary = await generateSessionSummary(conversationHistory, extractedIntel, personaId, durationSeconds)

    await Session.create({
      userId,
      mode: 'cagebait',
      inputText: `CageBait session — ${personaId} persona — ${Math.floor(durationSeconds / 60)}m ${durationSeconds % 60}s`,
      responseText: summary,
      audioUrl: '',
    })

    res.json({ summary, saved: true, intel: extractedIntel })
  } catch (err) {
    console.error('[CageBait] End Session Error:', err)
    res.status(500).json({ error: err.message || 'Failed to end session' })
  }
}
