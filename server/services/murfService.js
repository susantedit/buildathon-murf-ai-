import axios from 'axios'

const MURF_URL = 'https://api.murf.ai/v1/speech/generate'

// Context-aware voice mapping for different moods and modes
const voiceMap = {
  // Creator Mode voices (high-energy, punchy)
  motivational: 'en-US-marcus',      // Deep, powerful male voice
  storytelling: 'en-US-ken',         // Warm narrator voice
  serious: 'en-US-wayne',            // Professional, authoritative
  
  // Life Assistant voices (calm, supportive)
  calm: 'en-US-natalie',             // Soothing female voice
  supportive: 'en-US-julia',         // Friendly, empathetic
  
  // Study Mode voices (clear, teacher-like)
  teacher: 'en-US-julia',            // Clear explanation voice
  simple: 'en-US-natalie',           // Gentle, patient voice
  
  // Focus Mode voices (whispered, meditative)
  meditation: 'en-US-natalie',       // Soft, calming
  focus: 'en-US-julia'               // Steady, focused
}

// Smart voice selection based on mode and tone
export function selectVoice(mode, tone) {
  // Creator mode: high-energy voices
  if (mode === 'creator') {
    return voiceMap[tone] || voiceMap.motivational
  }
  
  // Life assistant: calm, supportive voices
  if (mode === 'assistant') {
    return voiceMap.calm
  }
  
  // Study mode: teacher voices
  if (mode === 'study') {
    if (tone === 'simple') return voiceMap.simple
    return voiceMap.teacher
  }
  
  // Focus/meditation: soft voices
  if (mode === 'focus') {
    return voiceMap.meditation
  }
  
  // Planner: motivational voice
  if (mode === 'planner') {
    return voiceMap.motivational
  }
  
  return voiceMap.calm
}

export async function textToSpeech(text, voiceStyle = 'calm', mode = 'assistant') {
  // Use smart voice selection
  const voiceId = selectVoice(mode, voiceStyle)

  const res = await axios.post(
    MURF_URL,
    {
      voiceId,
      text,
      format: 'MP3',
      sampleRate: 24000,
      speed: mode === 'creator' ? 1.05 : 1, // Slightly faster for creator mode
      pitch: 0
    },
    {
      headers: {
        'api-key': process.env.MURF_API_KEY,
        'Content-Type': 'application/json'
      }
    }
  )

  return res.data.audioFile || res.data.encodedAudio || ''
}
