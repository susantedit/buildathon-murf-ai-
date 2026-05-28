import axios from 'axios'
import FormData from 'form-data'

export async function handleTranscribe(req, res) {
  try {
    const file = req.file
    if (!file) return res.status(400).json({ error: 'audio file is required (form field: audio)' })

    // Determine provider
    const provider = (process.env.STT_PROVIDER || '').toUpperCase()

    if (provider === 'OPENAI' && process.env.OPENAI_API_KEY) {
      // Forward to OpenAI Whisper transcription endpoint
      const form = new FormData()
      form.append('file', file.buffer, { filename: file.originalname || 'recording.wav', contentType: file.mimetype || 'audio/wav' })
      form.append('model', 'whisper-1')

      const headers = {
        ...form.getHeaders(),
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      }

      const resp = await axios.post('https://api.openai.com/v1/audio/transcriptions', form, { headers, timeout: 120000 })
      if (resp.data && resp.data.text) {
        return res.json({ text: resp.data.text })
      }
      return res.status(502).json({ error: 'No transcription returned from OpenAI' })
    }

    // Other providers can be added here (AssemblyAI, Deepgram, etc.)

    return res.status(501).json({ error: 'No STT provider configured. Set STT_PROVIDER and provider API key in env.' })
  } catch (err) {
    console.error('Transcribe Error:', err?.response?.data || err.message || err)
    res.status(500).json({ error: err.message || 'Transcription failed' })
  }
}
