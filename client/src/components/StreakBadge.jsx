// Daily streak badge — shows current streak with fire emoji
import { motion } from 'framer-motion'
import { getStreak } from '../utils/streak'

export default function StreakBadge({ style = {} }) {
  const { current, best } = getStreak()
  if (current === 0) return null

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      title={`Best streak: ${best} days`}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '4px 10px', borderRadius: 20,
        background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.35)',
        fontSize: 12, fontWeight: 700, color: '#f59e0b',
        ...style
      }}>
      🔥 {current} day{current !== 1 ? 's' : ''}
    </motion.div>
  )
}
