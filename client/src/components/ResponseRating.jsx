// Thumbs up/down rating for AI responses
import { useState } from 'react'
import { motion } from 'framer-motion'
import { ThumbsUp, ThumbsDown } from 'lucide-react'
import { saveRating, getRating } from '../utils/ratings'

export default function ResponseRating({ sessionId, style = {} }) {
  const [rating, setRating] = useState(() => getRating(sessionId))

  const rate = (val) => {
    if (rating === val) return // already rated
    setRating(val)
    saveRating(sessionId, val)
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, ...style }}>
      <span style={{ fontSize: 11, color: 'var(--text3)' }}>Helpful?</span>
      <motion.button whileTap={{ scale: 0.85 }} onClick={() => rate('up')}
        aria-label="Thumbs up"
        style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${rating === 'up' ? 'rgba(16,185,129,0.5)' : 'var(--border)'}`,
          background: rating === 'up' ? 'rgba(16,185,129,0.15)' : 'var(--glass)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <ThumbsUp size={13} color={rating === 'up' ? '#10b981' : 'var(--text3)'} />
      </motion.button>
      <motion.button whileTap={{ scale: 0.85 }} onClick={() => rate('down')}
        aria-label="Thumbs down"
        style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${rating === 'down' ? 'rgba(239,68,68,0.5)' : 'var(--border)'}`,
          background: rating === 'down' ? 'rgba(239,68,68,0.1)' : 'var(--glass)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <ThumbsDown size={13} color={rating === 'down' ? '#ef4444' : 'var(--text3)'} />
      </motion.button>
    </div>
  )
}
