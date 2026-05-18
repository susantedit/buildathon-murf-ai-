// AiCoreSphere — Pure SVG + CSS animated sphere (no Three.js)
// States: idle | listening | processing | responding
import { useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const STATE_COLORS = {
  idle:       { primary: '#4F8CFF', secondary: '#A855F7', glow: 'rgba(79,140,255,0.4)' },
  listening:  { primary: '#ef4444', secondary: '#f97316', glow: 'rgba(239,68,68,0.5)' },
  processing: { primary: '#f59e0b', secondary: '#22d3ee', glow: 'rgba(245,158,11,0.45)' },
  responding: { primary: '#10b981', secondary: '#4F8CFF', glow: 'rgba(16,185,129,0.45)' },
}

const STATE_LABELS = {
  idle: 'Standby',
  listening: 'Listening',
  processing: 'Processing',
  responding: 'Responding',
}

export default function AiCoreSphere({
  state = 'idle',
  size = 120,
  className = '',
  style = {},
}) {
  const colors = STATE_COLORS[state] || STATE_COLORS.idle
  const cx = size / 2
  const cy = size / 2
  const r = size * 0.36

  // Latitude/longitude lines for sphere illusion
  const latLines = 5
  const lonLines = 6

  return (
    <div
      className={className}
      aria-label={`AI Core — ${STATE_LABELS[state]}`}
      role="img"
      style={{
        width: size,
        height: size,
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-hidden="true"
        style={{ overflow: 'visible' }}
      >
        <defs>
          {/* Radial gradient for sphere body */}
          <radialGradient id={`sphere-grad-${state}`} cx="38%" cy="35%" r="65%">
            <stop offset="0%" stopColor={colors.primary} stopOpacity="0.55" />
            <stop offset="55%" stopColor={colors.secondary} stopOpacity="0.25" />
            <stop offset="100%" stopColor="#0B0F1A" stopOpacity="0.85" />
          </radialGradient>

          {/* Glow filter */}
          <filter id={`sphere-glow-${state}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={size * 0.06} result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Clip to sphere */}
          <clipPath id={`sphere-clip-${state}`}>
            <circle cx={cx} cy={cy} r={r} />
          </clipPath>
        </defs>

        {/* ── Outer glow ring ── */}
        <motion.circle
          cx={cx} cy={cy} r={r + size * 0.06}
          fill="none"
          stroke={colors.primary}
          strokeWidth={1}
          opacity={0.25}
          animate={
            state === 'idle'
              ? { r: [r + size * 0.04, r + size * 0.10, r + size * 0.04], opacity: [0.25, 0.08, 0.25] }
              : state === 'listening'
              ? { r: [r + size * 0.04, r + size * 0.18, r + size * 0.04], opacity: [0.5, 0.05, 0.5] }
              : { r: r + size * 0.06, opacity: 0.2 }
          }
          transition={{ duration: state === 'listening' ? 1.0 : 2.5, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* ── Listening: expanding concentric rings ── */}
        <AnimatePresence>
          {state === 'listening' && [0, 1, 2].map(i => (
            <motion.circle
              key={`ring-${i}`}
              cx={cx} cy={cy}
              r={r}
              fill="none"
              stroke={colors.primary}
              strokeWidth={1.5}
              initial={{ r, opacity: 0.7 }}
              animate={{ r: r + size * (0.15 + i * 0.12), opacity: 0 }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                delay: i * 0.5,
                ease: 'easeOut',
              }}
            />
          ))}
        </AnimatePresence>

        {/* ── Sphere body ── */}
        <motion.circle
          cx={cx} cy={cy} r={r}
          fill={`url(#sphere-grad-${state})`}
          stroke={colors.primary}
          strokeWidth={1.5}
          filter={`url(#sphere-glow-${state})`}
          animate={
            state === 'idle'
              ? { scale: [1, 1.03, 1], opacity: [0.9, 1, 0.9] }
              : state === 'processing'
              ? { scale: [1, 1.02, 1] }
              : { scale: 1, opacity: 1 }
          }
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{ transformOrigin: `${cx}px ${cy}px` }}
        />

        {/* ── Latitude lines (ellipses) ── */}
        <g clipPath={`url(#sphere-clip-${state})`} opacity={0.35}>
          {Array.from({ length: latLines }).map((_, i) => {
            const t = (i + 1) / (latLines + 1)
            const latY = cy - r + t * r * 2
            const latR = Math.sqrt(Math.max(0, r * r - (latY - cy) * (latY - cy)))
            return (
              <ellipse
                key={`lat-${i}`}
                cx={cx} cy={latY}
                rx={latR} ry={latR * 0.28}
                fill="none"
                stroke={colors.primary}
                strokeWidth={0.7}
                opacity={0.6}
              />
            )
          })}
        </g>

        {/* ── Longitude lines ── */}
        <g clipPath={`url(#sphere-clip-${state})`} opacity={0.3}>
          {Array.from({ length: lonLines }).map((_, i) => {
            const angle = (i / lonLines) * Math.PI
            const skewX = Math.cos(angle) * r
            return (
              <ellipse
                key={`lon-${i}`}
                cx={cx} cy={cy}
                rx={Math.abs(skewX)} ry={r}
                fill="none"
                stroke={colors.secondary}
                strokeWidth={0.7}
                opacity={0.5}
              />
            )
          })}
        </g>

        {/* ── Processing: rotating arc ── */}
        <AnimatePresence>
          {state === 'processing' && (
            <motion.g
              key="proc-arc"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.circle
                cx={cx} cy={cy}
                r={r + size * 0.08}
                fill="none"
                stroke={colors.primary}
                strokeWidth={2.5}
                strokeDasharray={`${r * 0.9} ${r * 5}`}
                strokeLinecap="round"
                animate={{ rotate: 360 }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                style={{ transformOrigin: `${cx}px ${cy}px` }}
              />
              <motion.circle
                cx={cx} cy={cy}
                r={r + size * 0.13}
                fill="none"
                stroke={colors.secondary}
                strokeWidth={1.5}
                strokeDasharray={`${r * 0.5} ${r * 6}`}
                strokeLinecap="round"
                animate={{ rotate: -360 }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
                style={{ transformOrigin: `${cx}px ${cy}px` }}
              />
            </motion.g>
          )}
        </AnimatePresence>

        {/* ── Responding: waveform bars around sphere ── */}
        <AnimatePresence>
          {state === 'responding' && (
            <motion.g
              key="resp-bars"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {Array.from({ length: 16 }).map((_, i) => {
                const angle = (i / 16) * Math.PI * 2
                const barR = r + size * 0.07
                const bx = cx + Math.cos(angle) * barR
                const by = cy + Math.sin(angle) * barR
                const maxH = size * 0.09
                return (
                  <motion.rect
                    key={i}
                    x={bx - 1.5}
                    y={by - maxH / 2}
                    width={3}
                    height={maxH}
                    rx={1.5}
                    fill={colors.primary}
                    opacity={0.75}
                    animate={{
                      height: [maxH * 0.2, maxH * (0.4 + (i % 5) * 0.15), maxH * 0.2],
                      opacity: [0.4, 0.9, 0.4],
                      y: [by - maxH * 0.1, by - maxH * (0.2 + (i % 5) * 0.075), by - maxH * 0.1],
                    }}
                    transition={{
                      duration: 0.5 + (i % 4) * 0.1,
                      repeat: Infinity,
                      delay: i * 0.04,
                      ease: 'easeInOut',
                    }}
                    transform={`rotate(${(i / 16) * 360}, ${cx}, ${cy})`}
                  />
                )
              })}
            </motion.g>
          )}
        </AnimatePresence>

        {/* ── Core highlight ── */}
        <circle
          cx={cx - r * 0.25}
          cy={cy - r * 0.28}
          r={r * 0.18}
          fill="rgba(255,255,255,0.18)"
        />

        {/* ── Center dot ── */}
        <motion.circle
          cx={cx} cy={cy} r={size * 0.04}
          fill={colors.primary}
          opacity={0.9}
          animate={{ scale: [1, 1.4, 1], opacity: [0.9, 0.5, 0.9] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          style={{ transformOrigin: `${cx}px ${cy}px` }}
        />
      </svg>

      {/* State label */}
      <div style={{
        position: 'absolute',
        bottom: -size * 0.18,
        left: '50%',
        transform: 'translateX(-50%)',
        fontSize: Math.max(9, size * 0.09),
        fontWeight: 700,
        color: colors.primary,
        fontFamily: "'JetBrains Mono', monospace",
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        whiteSpace: 'nowrap',
        textShadow: `0 0 12px ${colors.glow}`,
        pointerEvents: 'none',
      }}>
        {STATE_LABELS[state]}
      </div>
    </div>
  )
}
