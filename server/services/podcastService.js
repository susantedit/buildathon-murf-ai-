import axios from 'axios'

// Extract readable text from a URL (article/blog/YouTube page)
export async function extractFromUrl(url) {
  const res = await axios.get(url, {
    timeout: 12000,
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; VortexBot/1.0)' }
  })
  const html = res.data
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 4000)
  if (text.length < 100) throw new Error('Could not extract enough text from URL')
  return text
}

// Generate a 2-speaker podcast script
export async function generatePodcastScript(text, style = 'conversational', depth = 'medium', language = 'English') {
  const { generateAdvice } = await import('./geminiService.js')

  const styleGuides = {
    conversational: 'casual, friendly, like two friends discussing',
    educational:    'informative, teacher and student style',
    debate:         'two opposing viewpoints debating the topic',
    interview:      'interviewer asking questions, expert answering',
  }

  const depthGuides = {
    short:  '4-5 exchanges, very concise, under 120 words total',
    medium: '6-8 exchanges, balanced, about 200-250 words total',
    deep:   '10-12 exchanges, detailed and thorough, about 350-400 words total',
  }

  const langNote = language && language.toLowerCase() !== 'english'
    ? `IMPORTANT: Write the entire script in ${language} language.`
    : ''

  const prompt = `You are a podcast script writer. Create a 2-speaker podcast script based on this content:

"${text.slice(0, 2000)}"

Style: ${styleGuides[style] || styleGuides.conversational}
Length: ${depthGuides[depth] || depthGuides.medium}
${langNote}

Format EXACTLY like this (no extra text, just the script):
HOST: [line]
GUEST: [line]
HOST: [line]
GUEST: [line]

Make it engaging, natural, and informative. End with a clear conclusion.`

  return generateAdvice(prompt)
}

// Parse script lines
export function parseScript(script) {
  const lines = []
  for (const line of script.split('\n')) {
    const hostMatch  = line.match(/^HOST:\s*(.+)/i)
    const guestMatch = line.match(/^GUEST:\s*(.+)/i)
    if (hostMatch)  lines.push({ speaker: 'HOST',  text: hostMatch[1].trim() })
    if (guestMatch) lines.push({ speaker: 'GUEST', text: guestMatch[1].trim() })
  }
  return lines
}
