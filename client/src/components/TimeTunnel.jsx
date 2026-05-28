import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * TimeTunnel — 3D tunnel timeline for commit/session history
 * Pure canvas perspective tunnel with floating cards
 */
export default function TimeTunnel({ items = [], onSelect, style = {} }) {
  const canvasRef = useRef(null)
  const [activeIdx, setActiveIdx] = useState(0)
  const [hovered, setHovered] = useState(null)

  const DEMO_ITEMS = items.length ? items : [
    { id: 1, label: 'Session #1', time: '2h ago',  color: '#4F8CFF', icon: '🧠' },
    { id: 2, label: 'Session #2', time: '5h ago',  color: '#A855F7', icon: '🎭' },
    { id: 3, label: 'Session #3', time: '1d ago',  color: '#22d3ee', icon: '🔍' },
    { id: 4, label: 'Session #4', time: '2d ago',  color: '#f59e0b', icon: '📊' },
    { id: 5, label: 'Session #5', time: '3d ago',  color: '#10b981', icon: '🎯' },
  ]

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const ctx = canvas.getContext('2d')
    const W = canvas.offsetWidth || 600
    const H = 200
    canvas.width = W
    canvas.height = H

    let animId
    let frame = 0

    const draw = () => {
      animId = requestAnimationFrame(draw)
      frame++

      ctx.clearRect(0, 0, W, H)

      const cx = W / 2
      const cy = H / 2
      const RINGS = 12

      // Draw tunnel rings
      for (let i = RINGS; i >= 0; i--) {
        const t = i / RINGS
        const z = t
        const scale = 0.15 + z * 0.85
        const rx = cx
        const ry = cy
        const rw = W * 0.45 * scale
        const rh = H * 0.38 * scale
        const opacity = t * 0.5

        // Animated ring offset
        const offset = (frame * 0.8 + i * 8) % (RINGS * 8)
        const animT = (offset / (RINGS * 8))

        ctx.beginPath()
        ctx.ellipse(rx, ry, rw, rh, 0, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(79,140,255,${opacity * 0.6})`
        ctx.lineWidth = 1
        ctx.stroke()

        // Corner connectors
        if (i < RINGS) {
          const prevScale = ((i + 1) / RINGS)
          const prevRw = W * 0.45 * (0.15 + prevScale * 0.85)
          const prevRh = H * 0.38 * (0.15 + prevScale * 0.85)
          ;[[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sx, sy]) => {
            ctx.beginPath()
            ctx.moveTo(rx + sx * rw * 0.7, ry + sy * rh * 0.7)
            ctx.lineTo(rx + sx * prevRw * 0.7, ry + sy * prevRh * 0.7)
            ctx.strokeStyle = `rgba(168,85,247,${opacity * 0.3})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          })
        }
      }

      // Center glow
      const centerGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 60)
      centerGlow.addColorStop(0, 'rgba(79,140,255,0.15)')
      centerGlow.addColorStop(1, 'transparent')
      ctx.fillStyle = centerGlow
      ctx.beginPath()
      ctx.arc(cx, cy, 60, 0, Math.PI * 2)
      ctx.fill()
    }

    draw()
    return () => cancelAnimationFrame(animId)
  }, [])

  return (
    <div style={{ position: 'relative', width: '100%', overflow: 'hidden', ...style }}>
      {/* Tunnel canvas */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{ width: '100%', height: 200, display: 'block', borderRadius: 16 }}
      />

      {/* Timeline items floating over tunnel */}
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        padding: '0 24px',
        pointerEvents: 'none',
      }}>
        {DEMO_ITEMS.map((item, i) => {
          const isActive = i === activeIdx
          const scale = isActive ? 1 : 0.75 - Math.abs(i - activeIdx) * 0.08
          const opacity = Math.max(0.3, 1 - Math.abs(i - activeIdx) * 0.25)
          const translateZ = isActive ? 0 : -Math.abs(i - activeIdx) * 20

          return (
            <motion.div
              key={item.id}
              animate={{ scale, opacity, y: isActive ? -8 : 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              onClick={() => { setActiveIdx(i); onSelect?.(item) }}
              style={{
                pointerEvents: 'auto',
                cursor: 'pointer',
                padding: '8px 14px',
                borderRadius: 12,
                background: isActive
                  ? `linear-gradient(135deg, ${item.color}22, rgba(11,15,26,0.9))`
                  : 'rgba(11,15,26,0.7)',
                border: `1px solid ${isActive ? item.color + '60' : 'rgba(79,140,255,0.15)'}`,
                backdropFilter: 'blur(12px)',
                boxShadow: isActive ? `0 0 20px ${item.color}33` : 'none',
                minWidth: 60,
                textAlign: 'center',
                flexShrink: 0,
              }}
            >
              <div style={{ fontSize: 18, marginBottom: 4 }}>{item.icon}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: isActive ? item.color : '#94a3b8', whiteSpace: 'nowrap' }}>
                {item.label}
              </div>
              <div style={{ fontSize: 9, color: '#4a5568', marginTop: 2 }}>{item.time}</div>
            </motion.div>
          )
        })}
      </div>

      {/* Navigation dots */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 12 }}>
        {DEMO_ITEMS.map((item, i) => (
          <motion.button
            key={item.id}
            onClick={() => setActiveIdx(i)}
            animate={{ scale: i === activeIdx ? 1.4 : 1 }}
            style={{
              width: 6, height: 6, borderRadius: '50%', border: 'none',
              background: i === activeIdx ? item.color : 'rgba(255,255,255,0.2)',
              cursor: 'pointer', padding: 0,
              boxShadow: i === activeIdx ? `0 0 8px ${item.color}` : 'none',
            }}
          />
        ))}
      </div>
    </div>
  )
}
