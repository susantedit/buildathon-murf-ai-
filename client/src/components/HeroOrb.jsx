import { useEffect, useRef, useState } from 'react'

export default function HeroOrb({ size = 320 }) {
  const canvasRef = useRef(null)
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 })

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!canvasRef.current) return
      const rect = canvasRef.current.getBoundingClientRect()
      setMousePos({
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height
      })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = size, H = size
    canvas.width = W
    canvas.height = H

    let frame = 0
    let raf

    // Enhanced particles
    const particles = Array.from({ length: 70 }, () => ({
      angle: Math.random() * Math.PI * 2,
      radius: 50 + Math.random() * 100,
      speed: 0.002 + Math.random() * 0.008,
      size: 1 + Math.random() * 2.5,
      opacity: 0.2 + Math.random() * 0.8,
      phi: Math.random() * Math.PI * 2,
      phiSpeed: 0.003 + Math.random() * 0.009,
      color: ['#a78bfa', '#60a5fa', '#c084fc', '#38bdf8'][Math.floor(Math.random() * 4)],
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.002 + Math.random() * 0.004
    }))

    // Rings
    const rings = Array.from({ length: 8 }, (_, i) => ({
      r: 25 + i * 18,
      opacity: 0.1 - i * 0.008,
      dashOffset: i * 12,
      speed: 0.0003 + Math.random() * 0.0008
    }))

    function draw() {
      ctx.clearRect(0, 0, W, H)
      const cx = W / 2, cy = H / 2
      const t = frame * 0.016
      const influence = 0.3

      // Outer glow
      const glowSize = 160 + (mousePos.x - 0.5) * 20
      const outerGlow = ctx.createRadialGradient(cx, cy, 80, cx, cy, glowSize)
      outerGlow.addColorStop(0, `rgba(139,92,246,${0.12 + influence * 0.06})`)
      outerGlow.addColorStop(0.5, `rgba(59,130,246,${0.06 + influence * 0.03})`)
      outerGlow.addColorStop(1, 'rgba(139,92,246,0)')
      ctx.fillStyle = outerGlow
      ctx.beginPath()
      ctx.arc(cx, cy, glowSize, 0, Math.PI * 2)
      ctx.fill()

      // Wire rings
      rings.forEach((ring) => {
        ctx.save()
        ctx.translate(cx, cy)
        ctx.rotate(t * (0.2 + ring.speed * 100) + ring.dashOffset * 0.15)
        for (let i = 0; i < 2; i++) {
          ctx.beginPath()
          ctx.arc(0, 0, ring.r + i * 2, 0, Math.PI * 2)
          ctx.setLineDash([6, 12])
          ctx.lineDashOffset = ring.dashOffset - frame * (0.5 + ring.speed * 50)
          ctx.strokeStyle = `rgba(139,92,246,${ring.opacity * (0.8 + i * 0.2)})`
          ctx.lineWidth = i === 0 ? 1 : 0.7
          ctx.stroke()
        }
        ctx.restore()
      })

      // Equator ring
      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(t * 0.5 + (mousePos.x - 0.5) * 0.5)
      ctx.beginPath()
      const eqW = 110 + (mousePos.y - 0.5) * 20
      ctx.ellipse(0, 0, eqW, 28 + (mousePos.x - 0.5) * 10, 0, 0, Math.PI * 2)
      const eqGrad = ctx.createLinearGradient(-eqW, 0, eqW, 0)
      eqGrad.addColorStop(0, 'rgba(139,92,246,0)')
      eqGrad.addColorStop(0.5, 'rgba(139,92,246,0.25)')
      eqGrad.addColorStop(1, 'rgba(139,92,246,0)')
      ctx.strokeStyle = eqGrad
      ctx.lineWidth = 2
      ctx.stroke()
      ctx.restore()

      // Meridian ring
      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(t * 0.4 + (mousePos.y - 0.5) * 0.5)
      ctx.beginPath()
      ctx.ellipse(0, 0, 28, 110, Math.PI / 3, 0, Math.PI * 2)
      ctx.strokeStyle = `rgba(96,165,250,${0.15 + influence * 0.1})`
      ctx.lineWidth = 1.5
      ctx.stroke()
      ctx.restore()

      // Orb body
      const specOffsetX = (mousePos.x - 0.5) * 20
      const specOffsetY = (mousePos.y - 0.5) * 20
      const grad = ctx.createRadialGradient(cx - 28 + specOffsetX, cy - 28 + specOffsetY, 10, cx, cy, 110)
      grad.addColorStop(0, 'rgba(216,180,254,0.65)')
      grad.addColorStop(0.25, 'rgba(167,139,250,0.55)')
      grad.addColorStop(0.5, 'rgba(139,92,246,0.50)')
      grad.addColorStop(0.75, 'rgba(59,130,246,0.45)')
      grad.addColorStop(1, 'rgba(16,8,40,0.15)')
      ctx.beginPath()
      const orbRadius = 108 + Math.sin(t * 0.7) * 2 + (mousePos.x - 0.5) * 4
      ctx.arc(cx, cy, orbRadius, 0, Math.PI * 2)
      ctx.fillStyle = grad
      ctx.fill()

      // Specular highlight
      const specGrad = ctx.createRadialGradient(cx - 30 - specOffsetX, cy - 35 - specOffsetY, 3, cx - 20, cy - 25, 50)
      specGrad.addColorStop(0, `rgba(255,255,255,${0.4 + influence * 0.1})`)
      specGrad.addColorStop(0.4, `rgba(255,255,255,${0.1 + influence * 0.05})`)
      specGrad.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.beginPath()
      ctx.arc(cx, cy, 108, 0, Math.PI * 2)
      ctx.fillStyle = specGrad
      ctx.fill()

      // Particles
      particles.forEach((p) => {
        p.angle += p.speed
        p.phi += p.phiSpeed
        p.wobble += p.wobbleSpeed
        const wobbling = Math.sin(p.wobble) * 10
        const x = cx + Math.cos(p.angle) * p.radius * Math.cos(p.phi) + wobbling
        const y = cy + Math.sin(p.angle) * p.radius * 0.45 + Math.sin(p.phi) * p.radius * 0.3 + wobbling * 0.5
        const scale = Math.sin(p.angle) * 0.4 + 0.8
        const g2 = ctx.createRadialGradient(x, y, 0, x, y, p.size * 2.8 * scale)
        g2.addColorStop(0, p.color.replace(')', `,${p.opacity * scale * 0.7})`).replace('rgb', 'rgba'))
        g2.addColorStop(0.5, p.color.replace(')', `,${p.opacity * scale * 0.3})`).replace('rgb', 'rgba'))
        g2.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.beginPath()
        ctx.arc(x, y, p.size * scale, 0, Math.PI * 2)
        ctx.fillStyle = g2
        ctx.fill()
      })

      // Core pulse
      const coreR = 45 + Math.sin(t * 1.8) * 6 + (mousePos.x - 0.5) * 3
      const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR)
      coreGrad.addColorStop(0, `rgba(255,255,255,${0.25 + influence * 0.1})`)
      coreGrad.addColorStop(0.4, `rgba(167,139,250,${0.15 + influence * 0.05})`)
      coreGrad.addColorStop(1, 'rgba(167,139,250,0)')
      ctx.beginPath()
      ctx.arc(cx, cy, coreR, 0, Math.PI * 2)
      ctx.fillStyle = coreGrad
      ctx.fill()

      // Energy waves
      for (let i = 0; i < 3; i++) {
        const waveR = 50 + i * 30 + Math.sin(t * 1.2 + i) * 15
        ctx.beginPath()
        ctx.arc(cx, cy, waveR, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(139,92,246,${(0.15 - i * 0.04) * (1 - i * 0.2)})`
        ctx.lineWidth = 0.5
        ctx.stroke()
      }

      frame++
      raf = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(raf)
  }, [size, mousePos])

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: size,
        height: size,
        maxWidth: '100%',
        filter: 'drop-shadow(0 0 40px rgba(139,92,246,0.4))',
        imageRendering: 'crisp-edges'
      }}
    />
  )
}
