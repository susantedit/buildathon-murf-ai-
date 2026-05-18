// NeuralBackground — Pure CSS/JS animated particle background (no Three.js)
// 60 particles + 20 SVG connection lines, fixed position, aria-hidden
import { useEffect, useRef, useState, useMemo } from 'react'

const COLORS = ['#4F8CFF', '#A855F7', '#22d3ee']
const PARTICLE_COUNT = 60
const LINE_COUNT = 20
const CONNECTION_DIST = 180

// Seeded pseudo-random for stable SSR-safe values
function seededRand(seed) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

function generateParticles() {
  const rand = seededRand(42)
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    id: i,
    x: rand() * 100,       // % of viewport width
    y: rand() * 100,       // % of viewport height
    size: 2 + rand() * 3,  // 2–5px
    color: COLORS[Math.floor(rand() * COLORS.length)],
    duration: 12 + rand() * 20,
    delay: -(rand() * 20),
    driftX: (rand() - 0.5) * 60,
    driftY: (rand() - 0.5) * 60,
    opacity: 0.3 + rand() * 0.5,
  }))
}

function generateLines(particles) {
  const lines = []
  const used = new Set()
  let attempts = 0
  while (lines.length < LINE_COUNT && attempts < 500) {
    attempts++
    const i = Math.floor(Math.random() * particles.length)
    const j = Math.floor(Math.random() * particles.length)
    if (i === j) continue
    const key = `${Math.min(i, j)}-${Math.max(i, j)}`
    if (used.has(key)) continue
    const a = particles[i]
    const b = particles[j]
    const dx = (a.x - b.x) * 16   // rough pixel estimate (100vw ≈ 1600px)
    const dy = (a.y - b.y) * 9    // rough pixel estimate (100vh ≈ 900px)
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist < CONNECTION_DIST) {
      used.add(key)
      lines.push({ id: key, x1: a.x, y1: a.y, x2: b.x, y2: b.y, color: a.color })
    }
  }
  return lines
}

export default function NeuralBackground() {
  const [mounted, setMounted] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)
    const handler = (e) => setReducedMotion(e.matches)
    mq.addEventListener('change', handler)
    setMounted(true)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const particles = useMemo(() => generateParticles(), [])
  const lines = useMemo(() => generateLines(particles), [particles])

  if (!mounted || reducedMotion) return null

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      {/* SVG connection lines */}
      <svg
        width="100%"
        height="100%"
        style={{ position: 'absolute', inset: 0 }}
        aria-hidden="true"
      >
        {lines.map(line => (
          <line
            key={line.id}
            x1={`${line.x1}%`}
            y1={`${line.y1}%`}
            x2={`${line.x2}%`}
            y2={`${line.y2}%`}
            stroke={line.color}
            strokeWidth={0.6}
            strokeOpacity={0.18}
          />
        ))}
      </svg>

      {/* Particle divs */}
      {particles.map(p => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            background: p.color,
            opacity: p.opacity,
            boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
            animation: `neural-drift-${p.id % 6} ${p.duration}s ${p.delay}s linear infinite`,
            willChange: 'transform',
          }}
        />
      ))}

      {/* Keyframe styles injected once */}
      <style>{`
        @keyframes neural-drift-0 {
          0%   { transform: translate(0, 0); }
          25%  { transform: translate(30px, -20px); }
          50%  { transform: translate(15px, 35px); }
          75%  { transform: translate(-25px, 10px); }
          100% { transform: translate(0, 0); }
        }
        @keyframes neural-drift-1 {
          0%   { transform: translate(0, 0); }
          33%  { transform: translate(-20px, 30px); }
          66%  { transform: translate(25px, -15px); }
          100% { transform: translate(0, 0); }
        }
        @keyframes neural-drift-2 {
          0%   { transform: translate(0, 0); }
          20%  { transform: translate(20px, 25px); }
          40%  { transform: translate(-30px, 10px); }
          60%  { transform: translate(10px, -30px); }
          80%  { transform: translate(-15px, 20px); }
          100% { transform: translate(0, 0); }
        }
        @keyframes neural-drift-3 {
          0%   { transform: translate(0, 0) scale(1); }
          50%  { transform: translate(-20px, -25px) scale(1.2); }
          100% { transform: translate(0, 0) scale(1); }
        }
        @keyframes neural-drift-4 {
          0%   { transform: translate(0, 0); }
          30%  { transform: translate(35px, 15px); }
          70%  { transform: translate(-10px, -30px); }
          100% { transform: translate(0, 0); }
        }
        @keyframes neural-drift-5 {
          0%   { transform: translate(0, 0) rotate(0deg); }
          50%  { transform: translate(20px, -20px) rotate(180deg); }
          100% { transform: translate(0, 0) rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
