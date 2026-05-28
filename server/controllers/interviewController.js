import Session from '../models/Session.js'
import { textToSpeech } from '../services/murfService.js'
import { continueInterview, generateInterviewPlan, summarizeInterview } from '../services/groqService.js'

export async function handleCreateInterview(req, res) {
  try {
    const { role, company = '', seniority = 'mid-level', focus = '', tone = 'professional', goal = '', userId = 'anonymous' } = req.body
    if (!role) return res.status(400).json({ error: 'role is required' })

    const plan = await generateInterviewPlan({ role, company, seniority, focus, tone, goal })
    let audioUrl = ''
    try {
      audioUrl = await textToSpeech(plan.openingLine || plan.description || plan.title || `Welcome to your ${role} mock interview.`, 'calm', 'interview')
    } catch (err) {
      console.warn('Interview intro audio skipped:', err.message)
    }

    const label = [role, company].filter(Boolean).join(' at ') || role
    const session = await Session.create({
      userId,
      mode: 'interview',
      inputText: label,
      responseText: plan.description || plan.title || 'Mock interview created',
      audioUrl,
      meta: {
        title: plan.title || `${role} interview`,
        role,
        company,
        seniority,
        focus,
        goal,
        tone,
        plan,
        transcript: [],
        status: 'live',
      },
    })

    res.json({ sessionId: session._id, plan, audio: audioUrl, audioUrl })
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to create interview' })
  }
}

export async function handleContinueInterview(req, res) {
  try {
    const { sessionId, plan, transcript = [], currentQuestion = '', answer = '', turn = 0, unverified = false } = req.body
    if (!answer) return res.status(400).json({ error: 'answer is required' })

    const response = await continueInterview({ plan, transcript, currentQuestion, answer, turn: Number(turn) || 0, unverified: !!unverified })

    let audioUrl = ''
    try {
      // If unverified facts are present, include them in the spoken output with a disclaimer
      const unverifiedSection = Array.isArray(response.unverifiedFacts) && response.unverifiedFacts.length > 0
        ? `\n\nDisclaimer: The following information may be unverified.\n${response.unverifiedFacts.join('\n')}`
        : ''

      const ttsText = `${response.reply || response.nextQuestion || response.summarySnippet || 'Let us continue.'}${unverifiedSection}`
      audioUrl = await textToSpeech(ttsText, 'calm', 'interview')
    } catch (err) {
      console.warn('Interview turn audio skipped:', err.message)
    }

    if (sessionId) {
      await Session.findByIdAndUpdate(sessionId, {
        meta: {
          plan,
          transcript,
          latestTurn: Number(turn) || 0,
          latestAnswer: answer,
          latestCoachNote: response.coachingNote,
          progressText: response.progressText,
        }
      })
    }

    res.json({ ...response, audio: audioUrl, audioUrl })
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to continue interview' })
  }
}

export async function handleSummarizeInterview(req, res) {
  try {
    const { sessionId, plan, transcript = [], role = '', company = '', seniority = '', focus = '', userId = 'anonymous' } = req.body
    const feedback = await summarizeInterview({ plan, transcript })

    let audioUrl = ''
    try {
      audioUrl = await textToSpeech(feedback.summary || feedback.closingLine || 'Interview complete.', 'supportive', 'review')
    } catch (err) {
      console.warn('Interview feedback audio skipped:', err.message)
    }

    const payload = {
      userId,
      mode: 'interview',
      inputText: [role, company].filter(Boolean).join(' at ') || role || 'Mock interview',
      responseText: feedback.summary || feedback.hiringVerdict || 'Interview feedback ready',
      audioUrl,
      meta: {
        title: plan?.title || `${role} interview`,
        role,
        company,
        seniority,
        focus,
        plan,
        transcript,
        feedback,
        status: 'completed',
      },
    }

    let session = null
    if (sessionId) {
      session = await Session.findByIdAndUpdate(sessionId, payload, { new: true })
    }
    if (!session) session = await Session.create(payload)

    res.json({ sessionId: session._id, feedback, audio: audioUrl, audioUrl })
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to summarize interview' })
  }
}