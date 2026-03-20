// Reusable mic button for voice input — uses Web Speech API
import { motion } from 'framer-motion'
import { Mic, MicOff } from 'lucide-react'
import { useVoiceInput } from '../utils/useVoiceInput'

export default function VoiceMicButton({ onResult, style = {} }) {
  const { listening, start, stop, supported } = useVoiceInput(onResult)
  if (!supported) return null

  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={listening ? stop : start}
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
  )
}
