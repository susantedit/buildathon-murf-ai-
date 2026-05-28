// Reusable mic button for voice input — uses Web Speech API
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Mic, MicOff } from 'lucide-react'
import { useVoiceInput } from '../utils/useVoiceInput'
import StegRecorder from './StegRecorder'

export default function VoiceMicButton({ onResult, style = {}, buttonId }) {
  const { listening, start, stop, supported } = useVoiceInput(onResult)
  const [recOpen, setRecOpen] = useState(false)
  const [sttMode, setSttMode] = useState('checking') // 'browser' | 'server' | 'mock'

  useEffect(() => {
    let mounted = true
    async function check() {
      try {
        const resp = await fetch('/api/stt/status')
        if (!mounted) return
        if (supported) return setSttMode('browser')
        if (resp.ok) {
          const data = await resp.json()
          if (data.configured) return setSttMode('server')
        }
        setSttMode('mock')
      } catch (err) {
        if (!mounted) return
        if (supported) return setSttMode('browser')
        setSttMode('mock')
      }
    }
    check()
    return () => { mounted = false }
  }, [supported])

  // If browser supports Web Speech API, use it. Otherwise show a recorder fallback.
  if (!supported) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setRecOpen(true)}
          id={buttonId}
          title="Open audio recorder"
          style={{
            width: 36, height: 36, borderRadius: '50%', border: 'none', cursor: 'pointer',
            background: 'rgba(139,92,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, transition: 'background 0.2s',
            ...style
          }}>
          <Mic size={16} color="#8b5cf6" />
        </motion.button>
        <div style={{ fontSize: 11, color: 'var(--text3)', padding: '4px 8px', borderRadius: 999, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.03)', height: 28, display: 'flex', alignItems: 'center' }}>
          {sttMode === 'checking' && 'Checking...'}
          {sttMode === 'server' && 'Server STT'}
          {sttMode === 'mock' && 'Local recorder'}
        </div>
        {recOpen && (
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', right: 0, top: 8, zIndex: 60, width: 360 }}>
              <StegRecorder onRecordingComplete={async (blob) => {
                // Try uploading to server /transcribe endpoint first
                try {
                  const form = new FormData()
                  form.append('audio', blob, 'recording.wav')
                  const resp = await fetch('/api/generate/transcribe', { method: 'POST', body: form })
                  if (resp.ok) {
                    const data = await resp.json()
                    const text = data.text || ''
                    if (text) onResult(text)
                    else alert('No transcription was returned by the server.')
                    setRecOpen(false)
                    return
                  }

                  // If server returns 501 (not configured) or other error, fallback to local download
                  const txt = await resp.text()
                  console.warn('Transcribe endpoint error:', resp.status, txt)
                } catch (err) {
                  console.warn('Transcribe upload failed:', err.message)
                }

                // Fallback: save locally and instruct user to paste
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = 'recording.wav'
                a.click()
                URL.revokeObjectURL(url)
                setRecOpen(false)
                alert('Recording saved locally as recording.wav. Server STT unavailable; paste transcription here or configure STT_PROVIDER on the server.')
              }} onCancel={() => setRecOpen(false)} />
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={listening ? stop : start}
      id={buttonId}
      title={listening ? 'Stop listening' : 'Speak your input'}
      style={{
        width: 36, height: 36, borderRadius: '50%', border: 'none', cursor: 'pointer',
        background: listening ? 'linear-gradient(135deg,#ef4444,#dc2626)' : 'rgba(139,92,246,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, transition: 'background 0.2s',
        boxShadow: listening ? '0 0 0 4px rgba(239,68,68,0.2)' : 'none',
        ...style
      }}>
      {listening
        ? <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.8 }}>
            <MicOff size={16} color="#fff" />
          </motion.div>
        : <Mic size={16} color="#8b5cf6" />
      }
    </motion.button>
      <div style={{ fontSize: 11, color: listening ? '#ef4444' : 'var(--text3)', padding: '4px 8px', borderRadius: 999, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.03)', height: 28, display: 'flex', alignItems: 'center' }}>
        {sttMode === 'checking' && 'Checking...'}
        {sttMode === 'browser' && 'Browser STT'}
        {sttMode === 'server' && 'Server STT'}
        {sttMode === 'mock' && 'Local recorder'}
      </div>
    </div>
  )
}
