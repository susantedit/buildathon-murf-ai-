import { generateScript, generateAdvice, explainTopic, generatePlan } from '../services/geminiService.js'
import { textToSpeech } from '../services/murfService.js'
import Session from '../models/Session.js'

export async function handleGenerateScript(req, res) {
  try {
    const { text, tone = 'motivational' } = req.body
    if (!text) return res.status(400).json({ error: 'text is required' })

    console.log('Generating script for:', text)
    const responseText = await generateScript(text, tone)
    console.log('Script generated, converting to speech...')
    
    const audioUrl = await textToSpeech(responseText, tone, 'creator')
    console.log('Audio generated successfully')

    await Session.create({ mode: 'creator', inputText: text, responseText, audioUrl })
    res.json({ text: responseText, audio: audioUrl })
  } catch (err) {
    console.error('Generate Script Error:', err)
    res.status(500).json({ 
      error: err.message || 'Something went wrong. Check your API keys.',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    })
  }
}

export async function handleGenerateAdvice(req, res) {
  try {
    const { text } = req.body
    if (!text) return res.status(400).json({ error: 'text is required' })

    console.log('Generating advice for:', text)
    const responseText = await generateAdvice(text)
    const audioUrl = await textToSpeech(responseText, 'calm', 'assistant')

    await Session.create({ mode: 'assistant', inputText: text, responseText, audioUrl })
    res.json({ text: responseText, audio: audioUrl })
  } catch (err) {
    console.error('Generate Advice Error:', err)
    res.status(500).json({ 
      error: err.message || 'Something went wrong. Check your API keys.',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    })
  }
}

export async function handleExplainTopic(req, res) {
  try {
    const { topic, mode = 'normal' } = req.body
    if (!topic) return res.status(400).json({ error: 'topic is required' })

    console.log('Explaining topic:', topic)
    const responseText = await explainTopic(topic, mode)
    const audioUrl = await textToSpeech(responseText, 'teacher', 'study')

    await Session.create({ mode: 'study', inputText: topic, responseText, audioUrl })
    res.json({ text: responseText, audio: audioUrl })
  } catch (err) {
    console.error('Explain Topic Error:', err)
    res.status(500).json({ 
      error: err.message || 'Something went wrong. Check your API keys.',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    })
  }
}

export async function handleGeneratePlan(req, res) {
  try {
    const { goal } = req.body
    if (!goal) return res.status(400).json({ error: 'goal is required' })

    console.log('Generating plan for:', goal)
    const responseText = await generatePlan(goal)
    const audioUrl = await textToSpeech(responseText, 'motivational', 'planner')

    await Session.create({ mode: 'planner', inputText: goal, responseText, audioUrl })
    res.json({ text: responseText, audio: audioUrl })
  } catch (err) {
    console.error('Generate Plan Error:', err)
    res.status(500).json({ 
      error: err.message || 'Something went wrong. Check your API keys.',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    })
  }
}

export async function handleTextToSpeech(req, res) {
  try {
    const { text, voice = 'calm', mode = 'assistant' } = req.body
    if (!text) return res.status(400).json({ error: 'text is required' })

    console.log('Converting text to speech...')
    const audioUrl = await textToSpeech(text, voice, mode)
    res.json({ audio: audioUrl })
  } catch (err) {
    console.error('Text to Speech Error:', err)
    res.status(500).json({ 
      error: err.message || 'Something went wrong. Check your API keys.',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    })
  }
}
