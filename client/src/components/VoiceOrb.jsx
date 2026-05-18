import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff } from 'lucide-react'
import { useVoiceInput } from '../utils/useVoiceInput'

/**
 * VoiceOrb — floating SVG voice control orb
 * Glows red when listening, blue when AI is speaking
 */
export default function VoiceOrb({
  onResult,
  isSpeaking = false,
  size = 64,
  fixed = false,
  style = {},
}) {
  const { listening, start, stop, supported } = useVoiceInput(onResult)

  if (!supported) return null

  const isActive = listening || isSpeaking
  const color = listening ? '#ef4444' : isSpeaking ? '#4F8CFF' : '#A855F7'
  const glowColor = listening ? 'rgba(239,68,68,0.4)' : isSpeaking ? 'rgba(79,140,255,0.4)' : 'rgba(168,85,247,0.2)'

  const BAR_COUNT = 12
  const bars = Array.from({ length: BAR_COUNT })

  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      onClick={listening ? stop : start}
      aria-label={listening ? 'Stop listening' : 'Start voice input'}
      style={{
        position: fixed ? 'fixed' : 'relative',
        bottom: fixed ? 80 : undefined,
        right: fixed ? 20 : undefined,
        width: size,
        height: size,
        borderRadius: '50%',
        border: `2px solid ${color}`,
        background: `radial-gradient(circle, ${color}22, transparent 70%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: isActive ? `0 0 32px ${glowColor}, 0 0 64px ${glowColor}` : `0 0 16px ${glowColor}`,
        zIndex: fixed ? 800 : undefined,
        transition: 'box-shadow 0.3s, border-color 0.3s',
        ...style,
      }}
    >
      {/* Waveform bars arranged in a circle */}
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ position: 'absolute', inset: 0 }}
        aria-hidden="true"
      >
        {bars.map((_, i) => {
          const angle = (i / BAR_COUNT) * Math.PI * 2
          const cx = size / 2
          const cy = size / 2
          const r = size * 0.32
          const x = cx + Math.cos(angle) * r
          const y = cy + Math.sin(angle) * r
          const barH = isActive ? 4 + Math.random() * 8 : 3

          return (
            <motion.rect
              key={i}
              x={x - 1.5}
              y={y - barH / 2}
              width={3}
              height={barH}
              rx={1.5}
              fill={color}
              opacity={isActive ? 0.8 : 0.3}
              animate={isActive ? {
                height: [3, 4 + (i % 4) * 3, 3],
                opacity: [0.5, 1, 0.5],
              } : { height: 3, opacity: 0.3 }}
              transition={{
                duration: 0.6 + (i % 3) * 0.15,
                repeat: Infinity,
                delay: i * 0.05,
                ease: 'easeInOut',
              }}
              transform={`rotate(${(i / BAR_COUNT) * 360}, ${cx}, ${cy})`}
            />
          )
        })}
      </svg>

      {/* Center icon */}
      <AnimatePresence mode="wait">
        {listening ? (
          <motion.div
            key="off"
            initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
          >
            <MicOff size={size * 0.3} color={color} />
          </motion.div>
        ) : (
          <motion.div
            key="on"
            initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
          >
            <Mic size={size * 0.3} color={color} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pulse ring when active */}
      {isActive && (
        <motion.div
          animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            inset: -4,
            borderRadius: '50%',
            border: `2px solid ${color}`,
            pointerEvents: 'none',
          }}
        />
      )}
    </motion.button>
  )
}
