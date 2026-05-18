import { useEffect, useRef, useState } from 'react'
import { motion, useSpring } from 'framer-motion'

export default function CursorGlow() {
  const [visible, setVisible] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [trail, setTrail] = useState([])
  const mouseX = useSpring(0, { stiffness: 500, damping: 28 })
  const mouseY = useSpring(0, { stiffness: 500, damping: 28 })
  const ringX = useSpring(0, { stiffness: 150, damping: 20 })
  const ringY = useSpring(0, { stiffness: 150, damping: 20 })
  const trailRef = useRef([])
  const frameRef = useRef(null)

  useEffect(() => {
    // Hide on touch devices
    if (window.matchMedia('(pointer: coarse)').matches) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    setVisible(true)

    const onMove = (e) => {
      mouseX.set(e.clientX)
      mouseY.set(e.clientY)
      ringX.set(e.clientX)
      ringY.set(e.clientY)

      // Update trail
      trailRef.current = [
        { x: e.clientX, y: e.clientY, id: Date.now() },
        ...trailRef.current.slice(0, 4),
      ]
      setTrail([...trailRef.current])
    }

    const onOver = (e) => {
      const el = e.target
      if (el.closest('button, a, [role="button"], .card, input, textarea, select')) {
        setHovered(true)
      } else {
        setHovered(false)
      }
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    window.addEventListener('mouseover', onOver, { passive: true })

    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseover', onOver)
      cancelAnimationFrame(frameRef.current)
    }
  }, [mouseX, mouseY, ringX, ringY])

  if (!visible) return null

  return (
    <div
      aria-hidden="true"
      style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999 }}
    >
      {/* Trail dots */}
      {trail.map((point, i) => (
        <div
          key={point.id}
          style={{
            position: 'fixed',
            left: point.x - 3,
            top: point.y - 3,
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: '#4F8CFF',
            opacity: (1 - i * 0.2) * 0.3,
            pointerEvents: 'none',
            transition: 'opacity 0.3s',
          }}
        />
      ))}

      {/* Outer ring */}
      <motion.div
        style={{
          position: 'fixed',
          x: ringX,
          y: ringY,
          width: hovered ? 44 : 36,
          height: hovered ? 44 : 36,
          marginLeft: hovered ? -22 : -18,
          marginTop: hovered ? -22 : -18,
          borderRadius: '50%',
          border: '1px solid rgba(79,140,255,0.5)',
          background: 'transparent',
          transition: 'width 0.2s, height 0.2s',
        }}
      />

      {/* Main dot */}
      <motion.div
        style={{
          position: 'fixed',
          x: mouseX,
          y: mouseY,
          width: hovered ? 10 : 8,
          height: hovered ? 10 : 8,
          marginLeft: hovered ? -5 : -4,
          marginTop: hovered ? -5 : -4,
          borderRadius: '50%',
          background: '#4F8CFF',
          boxShadow: '0 0 12px rgba(79,140,255,0.8)',
          transition: 'width 0.15s, height 0.15s',
        }}
      />
    </div>
  )
}
