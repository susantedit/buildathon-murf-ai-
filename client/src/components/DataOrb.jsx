import { motion } from 'framer-motion'

/**
 * DataOrb — User data orb with orbiting stats for Profile page
 * Stats orbit around a central glowing sphere
 */
export default function DataOrb({ stats = [], size = 200, style = {} }) {
  const DEMO_STATS = stats.length ? stats : [
    { label: 'Sessions', value: '24', color: '#4F8CFF' },
    { label: 'Streak',   value: '7d',  color: '#f59e0b' },
    { label: 'Modes',    value: '6',   color: '#A855F7' },
    { label: 'Score',    value: '92',  color: '#10b981' },
  ]

  const cx = size / 2
  const cy = size / 2
  const orbitR = size * 0.36

  return (
    <div
      aria-label="User data visualization"
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
      {/* Orbit ring */}
      <div style={{
        position: 'absolute',
        width: orbitR * 2,
        height: orbitR * 2,
        borderRadius: '50%',
        border: '1px dashed rgba(79,140,255,0.2)',
        pointerEvents: 'none',
      }} />

      {/* Orbiting stat nodes */}
      {DEMO_STATS.map((stat, i) => {
        const angle = (i / DEMO_STATS.length) * Math.PI * 2
        const duration = 12 + i * 2

        return (
          <motion.div
            key={stat.label}
            animate={{ rotate: 360 }}
            transition={{ duration, repeat: Infinity, ease: 'linear' }}
            style={{
              position: 'absolute',
              width: orbitR * 2,
              height: orbitR * 2,
              borderRadius: '50%',
              pointerEvents: 'none',
            }}
          >
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration, repeat: Infinity, ease: 'linear' }}
              style={{
                position: 'absolute',
                left: '50%',
                top: 0,
                transform: `translateX(-50%) rotate(${(i / DEMO_STATS.length) * 360}deg) translateY(-${orbitR}px) rotate(-${(i / DEMO_STATS.length) * 360}deg)`,
                width: 44,
                height: 44,
                marginLeft: -22,
                marginTop: -22,
                borderRadius: 12,
                background: `${stat.color}18`,
                border: `1px solid ${stat.color}40`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(8px)',
                boxShadow: `0 0 12px ${stat.color}22`,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 800, color: stat.color, lineHeight: 1, fontFamily: "'JetBrains Mono', monospace" }}>
                {stat.value}
              </div>
              <div style={{ fontSize: 8, color: '#4a5568', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 2 }}>
                {stat.label}
              </div>
            </motion.div>
          </motion.div>
        )
      })}

      {/* Central orb */}
      <motion.div
        animate={{
          scale: [1, 1.05, 1],
          boxShadow: [
            '0 0 20px rgba(79,140,255,0.3)',
            '0 0 40px rgba(79,140,255,0.5)',
            '0 0 20px rgba(79,140,255,0.3)',
          ],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          width: size * 0.28,
          height: size * 0.28,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 35% 35%, rgba(79,140,255,0.4), rgba(168,85,247,0.2))',
          border: '2px solid rgba(79,140,255,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1,
        }}
      >
        <div style={{ fontSize: 22 }}>🧬</div>
      </motion.div>
    </div>
  )
}
