import { useEffect, useRef } from 'react'

/**
 * StarfieldBackground — Three.js-style 3D starfield using pure WebGL canvas
 * Slow-moving particles with depth illusion + mouse parallax
 * No external dependencies — pure canvas 2D with perspective projection
 */
export default function StarfieldBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    let W = window.innerWidth
    let H = window.innerHeight
    let animId
    let mouse = { x: W / 2, y: H / 2 }

    canvas.width = W
    canvas.height = H

    // Star colors — blue/purple/cyan/white
    const COLORS = ['#4F8CFF', '#A855F7', '#22d3ee', '#ffffff', '#ffffff', '#ffffff']

    // Generate stars with z-depth
    const STAR_COUNT = 280
    const stars = Array.from({ length: STAR_COUNT }, () => ({
      x: (Math.random() - 0.5) * W * 3,
      y: (Math.random() - 0.5) * H * 3,
      z: Math.random() * W,
      pz: 0,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: Math.random() * 1.5 + 0.3,
    }))

    // Nebula blobs for depth
    const NEBULAS = [
      { x: W * 0.15, y: H * 0.2,  r: 300, color: 'rgba(79,140,255,0.04)' },
      { x: W * 0.85, y: H * 0.15, r: 250, color: 'rgba(168,85,247,0.04)' },
      { x: W * 0.5,  y: H * 0.8,  r: 350, color: 'rgba(34,211,238,0.03)' },
      { x: W * 0.1,  y: H * 0.75, r: 200, color: 'rgba(168,85,247,0.03)' },
    ]

    const onResize = () => {
      W = window.innerWidth
      H = window.innerHeight
      canvas.width = W
      canvas.height = H
    }

    const onMouseMove = (e) => {
      mouse.x = e.clientX
      mouse.y = e.clientY
    }

    window.addEventListener('resize', onResize, { passive: true })
    window.addEventListener('mousemove', onMouseMove, { passive: true })

    let frame = 0

    const draw = () => {
      animId = requestAnimationFrame(draw)
      frame++

      // Clear with deep space color
      ctx.fillStyle = '#0B0F1A'
      ctx.fillRect(0, 0, W, H)

      // Draw nebula blobs
      NEBULAS.forEach(n => {
        const parallaxX = (mouse.x - W / 2) * 0.008
        const parallaxY = (mouse.y - H / 2) * 0.008
        const grad = ctx.createRadialGradient(
          n.x + parallaxX, n.y + parallaxY, 0,
          n.x + parallaxX, n.y + parallaxY, n.r
        )
        grad.addColorStop(0, n.color)
        grad.addColorStop(1, 'transparent')
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(n.x + parallaxX, n.y + parallaxY, n.r, 0, Math.PI * 2)
        ctx.fill()
      })

      // Mouse parallax offset
      const offsetX = (mouse.x - W / 2) * 0.0015
      const offsetY = (mouse.y - H / 2) * 0.0015

      // Draw stars with perspective projection
      const cx = W / 2
      const cy = H / 2
      const speed = 0.4

      stars.forEach(star => {
        star.pz = star.z
        star.z -= speed

        if (star.z <= 0) {
          star.x = (Math.random() - 0.5) * W * 3
          star.y = (Math.random() - 0.5) * H * 3
          star.z = W
          star.pz = star.z
        }

        // Project to 2D
        const sx = (star.x / star.z) * W + cx + offsetX * (W / star.z)
        const sy = (star.y / star.z) * H + cy + offsetY * (H / star.z)
        const px = (star.x / star.pz) * W + cx
        const py = (star.y / star.pz) * H + cy

        // Size based on depth
        const size = Math.max(0.1, (1 - star.z / W) * 3.5)
        const opacity = Math.min(1, (1 - star.z / W) * 1.4)

        if (sx < 0 || sx > W || sy < 0 || sy > H) return

        // Draw streak for fast stars
        if (size > 1.5) {
          ctx.beginPath()
          ctx.moveTo(px, py)
          ctx.lineTo(sx, sy)
          ctx.strokeStyle = star.color + Math.floor(opacity * 80).toString(16).padStart(2, '0')
          ctx.lineWidth = size * 0.4
          ctx.stroke()
        }

        // Draw star dot
        ctx.beginPath()
        ctx.arc(sx, sy, size * star.size, 0, Math.PI * 2)
        ctx.fillStyle = star.color + Math.floor(opacity * 255).toString(16).padStart(2, '0')
        ctx.fill()

        // Glow for bright stars
        if (size > 2) {
          const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, size * 3)
          glow.addColorStop(0, star.color + '44')
          glow.addColorStop(1, 'transparent')
          ctx.fillStyle = glow
          ctx.beginPath()
          ctx.arc(sx, sy, size * 3, 0, Math.PI * 2)
          ctx.fill()
        }
      })
    }

    draw()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('mousemove', onMouseMove)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        display: 'block',
      }}
    />
  )
}
