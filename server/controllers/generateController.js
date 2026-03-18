import { generateScript, generateAdvice, explainTopic, generatePlan } from '../services/geminiService.js'
import { textToSpeech } from '../services/murfService.js'
import Session from '../models/Session.js'

export async function handleGenerateScript(req, res) {
  try {
    const { text, tone = 'motivational' } = req.body
    if (!text) return res.status(400).json({ error: 'text is required' })

    const responseText = await generateScript(text, tone)
    const audioUrl = await textToSpeech(responseText, tone)

    await Session.create({ mode: 'creator', inputText: text, responseText, audioUrl })
    res.json({ text: responseText, audio: audioUrl })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
}

export async function handleGenerateAdvice(req, res) {
  try {
    const { text } = req.body
    if (!text) return res.status(400).json({ error: 'text is required' })

    const responseText = await generateAdvice(text)
    const audioUrl = await textToSpeech(responseText, 'calm')

    await Session.create({ mode: 'assistant', inputText: text, responseText, audioUrl })
    res.json({ text: responseText, audio: audioUrl })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
}

export async function handleExplainTopic(req, res) {
  try {
    const { topic, mode = 'normal' } = req.body
    if (!topic) return res.status(400).json({ error: 'topic is required' })

    const responseText = await explainTopic(topic, mode)
    const audioUrl = await textToSpeech(responseText, 'teacher')

    await Session.create({ mode: 'study', inputText: topic, responseText, audioUrl })
    res.json({ text: responseText, audio: audioUrl })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
}

export async function handleGeneratePlan(req, res) {
  try {
    const { goal } = req.body
    if (!goal) return res.status(400).json({ error: 'goal is required' })

    const responseText = await generatePlan(goal)
    const audioUrl = await textToSpeech(responseText, 'motivational')

    await Session.create({ mode: 'planner', inputText: goal, responseText, audioUrl })
    res.json({ text: responseText, audio: audioUrl })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
}

export async function handleTextToSpeech(req, res) {
  try {
    const { text, voice = 'calm' } = req.body
    if (!text) return res.status(400).json({ error: 'text is required' })

    const audioUrl = await textToSpeech(text, voice)
    res.json({ audio: audioUrl })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
}
