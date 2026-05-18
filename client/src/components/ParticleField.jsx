import { useEffect, useRef } from 'react'

// Pure CSS + JS particle field — no Three.js dependency needed here
// 40 particles with random positions, sizes, colors, drift speeds
const COLORS = ['#4F8CFF', '#A855F7', '#22d3ee', '#4F8CFF', '#A855F7']

function randomBetween(a, b) {
  return a + Math.random() * (b - a)
}

export default function ParticleField() {
  const containerRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Check reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const particles = []
    const COUNT = 40

    for (let i = 0; i < COUNT; i++) {
      const el = document.createElement('div')
      const size = randomBetween(2, 6)
      const color = COLORS[Math.floor(Math.random() * COLORS.length)]
      const x = randomBetween(0, 100)
      const y = randomBetween(0, 100)
      const duration = randomBetween(8, 20)
      const delay = randomBetween(0, 10)
      const driftX = randomBetween(-30, 30)
      const driftY = randomBetween(-40, -10)

      el.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background: ${color};
        left: ${x}%;
        top: ${y}%;
        opacity: ${randomBetween(0.2, 0.7)};
        box-shadow: 0 0 ${size * 2}px ${color};
        animation: particle-drift-${i} ${duration}s ${delay}s linear infinite;
        will-change: transform;
      `

      // Inject keyframe for this particle
      const style = document.createElement('style')
      style.textContent = `
        @keyframes particle-drift-${i} {
          0%   { transform: translate(0, 0) scale(1); opacity: ${randomBetween(0.2, 0.6)}; }
          50%  { transform: translate(${driftX}px, ${driftY}px) scale(${randomBetween(0.8, 1.3)}); opacity: ${randomBetween(0.4, 0.8)}; }
          100% { transform: translate(${driftX * 0.5}px, ${driftY * 2}px) scale(0.5); opacity: 0; }
        }
      `
      document.head.appendChild(style)
      container.appendChild(el)
      particles.push({ el, style })
    }

    return () => {
      particles.forEach(({ el, style }) => {
        el.remove()
        style.remove()
      })
    }
  }, [])

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'hidden',
      }}
    />
  )
}
