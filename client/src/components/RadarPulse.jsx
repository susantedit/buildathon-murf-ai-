import { motion } from 'framer-motion'

/**
 * RadarPulse — Pulsing radar animation for Safety page
 * Urgent, real, serious feel
 */
export default function RadarPulse({
  active = false,
  size = 120,
  color = '#ef4444',
  rings = 3,
  style = {},
}) {
  return (
    <div
      aria-hidden="true"
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
      {/* Pulse rings */}
      {Array.from({ length: rings }).map((_, i) => (
        <motion.div
          key={i}
          animate={active ? {
            scale: [1, 2.2, 2.2],
            opacity: [0.7, 0, 0],
          } : { scale: 1, opacity: 0.2 }}
          transition={{
            duration: 2,
            delay: i * 0.6,
            repeat: Infinity,
            ease: 'easeOut',
          }}
          style={{
            position: 'absolute',
            width: size * 0.35,
            height: size * 0.35,
            borderRadius: '50%',
            border: `2px solid ${color}`,
            pointerEvents: 'none',
          }}
        />
      ))}

      {/* Rotating radar sweep */}
      {active && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          style={{
            position: 'absolute',
            width: size * 0.8,
            height: size * 0.8,
            borderRadius: '50%',
            border: `1px solid ${color}22`,
            overflow: 'hidden',
          }}
        >
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '50%',
            height: 2,
            transformOrigin: '0 50%',
            background: `linear-gradient(90deg, ${color}88, transparent)`,
          }} />
        </motion.div>
      )}

      {/* Center dot */}
      <motion.div
        animate={active ? {
          scale: [1, 1.3, 1],
          boxShadow: [
            `0 0 8px ${color}`,
            `0 0 24px ${color}`,
            `0 0 8px ${color}`,
          ],
        } : { scale: 1 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          width: size * 0.18,
          height: size * 0.18,
          borderRadius: '50%',
          background: active ? color : `${color}44`,
          border: `2px solid ${color}`,
          zIndex: 1,
        }}
      />
    </div>
  )
}
