import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * BreathingCircle — Zen breathing animation for Focus page
 * 4-phase cycle: breathe in → hold → breathe out → hold
 */
const PHASES = [
  { label: 'Breathe In',  duration: 4000, scale: 1.6, color: '#4F8CFF', opacity: 0.8 },
  { label: 'Hold',        duration: 2000, scale: 1.6, color: '#A855F7', opacity: 0.6 },
  { label: 'Breathe Out', duration: 4000, scale: 1.0, color: '#22d3ee', opacity: 0.5 },
  { label: 'Hold',        duration: 2000, scale: 1.0, color: '#4F8CFF', opacity: 0.4 },
]

export default function BreathingCircle({ active = false, size = 180, style = {} }) {
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    if (!active) return
    const timer = setTimeout(() => {
      setPhase(p => (p + 1) % PHASES.length)
    }, PHASES[phase].duration)
    return () => clearTimeout(timer)
  }, [phase, active])

  const current = PHASES[phase]

  return (
    <div
      aria-label={active ? `Breathing: ${current.label}` : 'Breathing circle'}
      style={{
        position: 'relative',
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style,
      }}
    >
      {/* Outer pulse rings */}
      {active && [0, 1, 2].map(i => (
        <motion.div
          key={i}
          animate={{
            scale: [1, current.scale * 1.15, 1],
            opacity: [0.3, 0, 0.3],
          }}
          transition={{
            duration: current.duration / 1000,
            delay: i * 0.4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{
            position: 'absolute',
            width: size * 0.55,
            height: size * 0.55,
            borderRadius: '50%',
            border: `1px solid ${current.color}`,
            pointerEvents: 'none',
          }}
        />
      ))}

      {/* Main breathing circle */}
      <motion.div
        animate={{
          scale: active ? current.scale : 1,
          boxShadow: active
            ? `0 0 ${size * 0.3}px ${current.color}55, 0 0 ${size * 0.6}px ${current.color}22`
            : `0 0 ${size * 0.1}px rgba(79,140,255,0.2)`,
        }}
        transition={{
          duration: current.duration / 1000,
          ease: 'easeInOut',
        }}
        style={{
          width: size * 0.55,
          height: size * 0.55,
          borderRadius: '50%',
          background: active
            ? `radial-gradient(circle, ${current.color}33, ${current.color}11)`
            : 'radial-gradient(circle, rgba(79,140,255,0.15), rgba(79,140,255,0.05))',
          border: `2px solid ${active ? current.color + '80' : 'rgba(79,140,255,0.25)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {/* Inner dot */}
        <motion.div
          animate={{ scale: active ? [1, 1.3, 1] : 1, opacity: active ? [0.8, 1, 0.8] : 0.5 }}
          transition={{ duration: current.duration / 1000, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            width: size * 0.08,
            height: size * 0.08,
            borderRadius: '50%',
            background: active ? current.color : 'rgba(79,140,255,0.4)',
            boxShadow: active ? `0 0 12px ${current.color}` : 'none',
          }}
        />
      </motion.div>

      {/* Phase label */}
      <AnimatePresence mode="wait">
        {active && (
          <motion.div
            key={phase}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'absolute',
              bottom: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: 12,
              fontWeight: 700,
              color: current.color,
              fontFamily: "'Space Grotesk', system-ui, sans-serif",
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              textShadow: `0 0 12px ${current.color}66`,
            }}
          >
            {current.label}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
