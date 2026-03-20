import axios from 'axios'
import { textToSpeech } from '../services/murfService.js'
import { extractFromUrl, generatePodcastScript, parseScript } from '../services/podcastService.js'
import { generateAdvice } from '../services/geminiService.js'
import Session from '../models/Session.js'

// POST /api/podcast/generate
export async function handleGeneratePodcast(req, res) {
  try {
    const { mode, content, url, style = 'conversational', depth = 'medium', language = 'English', userId = 'anonymous' } = req.body

    let sourceText = ''

    if (mode === 'url' || mode === 'youtube') {
      if (!url) return res.status(400).json({ error: 'URL is required' })
      try {
        sourceText = await extractFromUrl(url)
      } catch (e) {
        return res.status(400).json({ error: 'Could not extract content from URL: ' + e.message })
      }
    } else if (mode === 'text' || mode === 'prompt') {
      if (!content) return res.status(400).json({ error: 'Content is required' })
      sourceText = content
    } else {
      return res.status(400).json({ error: 'Invalid mode' })
    }

    // Generate 2-speaker script
    const script = await generatePodcastScript(sourceText, style, depth, language)
    const lines  = parseScript(script)

    if (!lines.length) return res.status(500).json({ error: 'Failed to parse podcast script' })

    // Generate voice for each line (HOST = marcus, GUEST = natalie)
    const voiceMap = { HOST: 'en-US-marcus', GUEST: 'en-US-natalie' }
    const audioLines = []

    for (const line of lines) {
      try {
        const audioUrl = await textToSpeech(line.text, line.speaker === 'HOST' ? 'motivational' : 'calm', 'assistant')
        audioLines.push({ ...line, audioUrl })
      } catch {
        audioLines.push({ ...line, audioUrl: null })
      }
    }

    // Save to history
    await Session.create({
      userId,
      mode: 'podcast',
      inputText: sourceText.slice(0, 200),
      responseText: script,
      audioUrl: audioLines[0]?.audioUrl || '',
    })

    res.json({ script, lines: audioLines, sourceText: sourceText.slice(0, 500) })
  } catch (err) {
    console.error('Podcast Error:', err)
    res.status(500).json({ error: err.message })
  }
}

// POST /api/podcast/chat  — chat with transcript (RAG-lite)
export async function handlePodcastChat(req, res) {
  try {
    const { question, transcript } = req.body
    if (!question || !transcript) return res.status(400).json({ error: 'question and transcript required' })

    const prompt = `You are an AI assistant. Answer the question ONLY based on the podcast transcript below. If the answer is not in the transcript, say "That wasn't covered in this podcast."

TRANSCRIPT:
${transcript.slice(0, 3000)}

QUESTION: ${question}

Give a concise, helpful answer in 2-3 sentences.`

    const answer = await generateAdvice(prompt)
    res.json({ answer })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
