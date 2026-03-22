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
  try {
    if (!process.env.MURF_API_KEY) {
      throw new Error('MURF_API_KEY is not configured')
    }

    console.log('Converting to speech:', { text: text.substring(0, 50), voiceStyle, mode })

    // Use smart voice selection
    const voiceId = selectVoice(mode, voiceStyle)
    console.log('Selected voice:', voiceId)

    const res = await axios.post(
      MURF_URL,
      {
        voiceId,
        text,
        format: 'MP3',
        sampleRate: 24000,
        speed: mode === 'creator' ? 1.05 : 1,
        pitch: 0
      },
      {
        headers: {
          'api-key': process.env.MURF_API_KEY,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    )

    console.log('Murf response: audioFile =', res.data.audioFile ? 'received' : 'missing')
    const audioUrl = res.data.audioFile || res.data.encodedAudio || ''
    
    if (!audioUrl) {
      console.error('No audio URL in response:', res.data)
      throw new Error('No audio URL returned from Murf API')
    }

    console.log('Audio URL generated:', audioUrl.substring(0, 100))
    return audioUrl
  } catch (error) {
    console.error('Murf API Error:', error.response?.data || error.message)
    
    if (error.response?.status === 401 || error.response?.status === 403) {
      throw new Error('Invalid Murf API key. Please check your credentials.')
    } else if (error.response?.status === 429) {
      throw new Error('Murf API rate limit exceeded. Please try again later.')
    } else if (error.response?.status === 402) {
      throw new Error('Murf API credits exhausted. Please check your account.')
    } else {
      throw new Error(`Murf API error: ${error.message}`)
    }
  }
}
