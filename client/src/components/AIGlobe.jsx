import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

/**
 * AIGlobe — 3D wireframe globe with animated arcs and data points
 * Pure canvas WebGL-style rendering — no Three.js dependency
 * Represents global AI intelligence network
 */

function latLonToXYZ(lat, lon, r) {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lon + 180) * (Math.PI / 180)
  return {
    x: -r * Math.sin(phi) * Math.cos(theta),
    y: r * Math.cos(phi),
    z: r * Math.sin(phi) * Math.sin(theta),
  }
}

function project(x, y, z, rotY, rotX, cx, cy, fov) {
  // Rotate Y
  const cosY = Math.cos(rotY), sinY = Math.sin(rotY)
  const x1 = x * cosY + z * sinY
  const z1 = -x * sinY + z * cosY
  // Rotate X
  const cosX = Math.cos(rotX), sinX = Math.sin(rotX)
  const y2 = y * cosX - z1 * sinX
  const z2 = y * sinX + z1 * cosX
  // Perspective
  const scale = fov / (fov + z2)
  return { x: cx + x1 * scale, y: cy + y2 * scale, z: z2, scale }
}

// Data points — major cities / AI hubs
const DATA_POINTS = [
  { lat: 40.7, lon: -74.0, label: 'New York', color: '#4F8CFF' },
  { lat: 51.5, lon: -0.1,  label: 'London',   color: '#A855F7' },
  { lat: 35.7, lon: 139.7, label: 'Tokyo',    color: '#22d3ee' },
  { lat: 37.8, lon: -122.4,label: 'SF',       color: '#4F8CFF' },
  { lat: 28.6, lon: 77.2,  label: 'Delhi',    color: '#f59e0b' },
  { lat: -23.5,lon: -46.6, label: 'São Paulo',color: '#A855F7' },
  { lat: 55.7, lon: 37.6,  label: 'Moscow',   color: '#22d3ee' },
  { lat: 31.2, lon: 121.5, label: 'Shanghai', color: '#4F8CFF' },
  { lat: -33.9,lon: 151.2, label: 'Sydney',   color: '#10b981' },
  { lat: 1.3,  lon: 103.8, label: 'Singapore',color: '#A855F7' },
  { lat: 48.9, lon: 2.3,   label: 'Paris',    color: '#22d3ee' },
  { lat: 19.4, lon: -99.1, label: 'Mexico',   color: '#f59e0b' },
]

// Arc connections between cities
const ARCS = [
  [0, 1], [0, 3], [1, 2], [2, 7], [3, 4], [4, 9],
  [5, 0], [6, 1], [7, 9], [8, 9], [10, 1], [11, 0],
  [2, 8], [4, 7], [0, 10],
]

export default function AIGlobe({ size = 320, style = {} }) {
  const canvasRef = useRef(null)
  const [hovered, setHovered] = useState(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const S = size
    canvas.width = S
    canvas.height = S

    const cx = S / 2, cy = S / 2
    const R = S * 0.38
    const FOV = S * 1.2

    let rotY = 0
    let rotX = 0.25
    let animId
    let frame = 0
    let arcProgress = 0

    // Generate globe wireframe points
    const wirePoints = []
    for (let lat = -80; lat <= 80; lat += 20) {
      for (let lon = -180; lon < 180; lon += 8) {
        wirePoints.push(latLonToXYZ(lat, lon, R))
      }
    }
    for (let lon = -180; lon < 180; lon += 30) {
      for (let lat = -80; lat <= 80; lat += 4) {
        wirePoints.push(latLonToXYZ(lat, lon, R))
      }
    }

    // Precompute data point 3D positions
    const dpPositions = DATA_POINTS.map(dp => latLonToXYZ(dp.lat, dp.lon, R))

    // Arc animation state
    const arcStates = ARCS.map(() => ({
      progress: Math.random(),
      speed: 0.003 + Math.random() * 0.004,
    }))

    const draw = () => {
      animId = requestAnimationFrame(draw)
      frame++
      rotY += 0.003

      ctx.clearRect(0, 0, S, S)

      // Outer glow
      const outerGlow = ctx.createRadialGradient(cx, cy, R * 0.7, cx, cy, R * 1.4)
      outerGlow.addColorStop(0, 'rgba(79,140,255,0.06)')
      outerGlow.addColorStop(0.5, 'rgba(168,85,247,0.04)')
      outerGlow.addColorStop(1, 'transparent')
      ctx.fillStyle = outerGlow
      ctx.beginPath()
      ctx.arc(cx, cy, R * 1.4, 0, Math.PI * 2)
      ctx.fill()

      // Globe base sphere
      const sphereGrad = ctx.createRadialGradient(cx - R * 0.2, cy - R * 0.2, 0, cx, cy, R)
      sphereGrad.addColorStop(0, 'rgba(79,140,255,0.08)')
      sphereGrad.addColorStop(0.6, 'rgba(11,15,26,0.85)')
      sphereGrad.addColorStop(1, 'rgba(11,15,26,0.95)')
      ctx.fillStyle = sphereGrad
      ctx.beginPath()
      ctx.arc(cx, cy, R, 0, Math.PI * 2)
      ctx.fill()

      // Wireframe dots (only front-facing)
      wirePoints.forEach(p => {
        const proj = project(p.x, p.y, p.z, rotY, rotX, cx, cy, FOV)
        if (proj.z > -R * 0.1) {
          const opacity = Math.min(0.5, (proj.z + R) / (R * 2) * 0.5)
          ctx.beginPath()
          ctx.arc(proj.x, proj.y, 0.7, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(79,140,255,${opacity})`
          ctx.fill()
        }
      })

      // Draw arcs between data points
      arcStates.forEach((arc, i) => {
        arc.progress += arc.speed
        if (arc.progress > 1) arc.progress = 0

        const [ai, bi] = ARCS[i]
        const a = dpPositions[ai]
        const b = dpPositions[bi]

        // Draw arc as series of interpolated points
        const STEPS = 40
        const points = []
        for (let t = 0; t <= STEPS; t++) {
          const tt = t / STEPS
          // Slerp between a and b with arc height
          const ix = a.x + (b.x - a.x) * tt
          const iy = a.y + (b.y - a.y) * tt
          const iz = a.z + (b.z - a.z) * tt
          const len = Math.sqrt(ix * ix + iy * iy + iz * iz)
          const arcH = R * 1.18
          points.push({
            x: (ix / len) * arcH,
            y: (iy / len) * arcH,
            z: (iz / len) * arcH,
          })
        }

        // Only draw the animated portion
        const drawEnd = Math.floor(arc.progress * STEPS)
        const drawStart = Math.max(0, drawEnd - 12)

        ctx.beginPath()
        let started = false
        for (let t = drawStart; t <= drawEnd; t++) {
          const p = points[t]
          const proj = project(p.x, p.y, p.z, rotY, rotX, cx, cy, FOV)
          if (proj.z < -R * 0.5) continue
          if (!started) { ctx.moveTo(proj.x, proj.y); started = true }
          else ctx.lineTo(proj.x, proj.y)
        }

        const color = DATA_POINTS[ai].color
        const tailOpacity = 0.7
        ctx.strokeStyle = color + Math.floor(tailOpacity * 255).toString(16).padStart(2, '0')
        ctx.lineWidth = 1.5
        ctx.shadowColor = color
        ctx.shadowBlur = 6
        ctx.stroke()
        ctx.shadowBlur = 0
      })

      // Draw data points
      dpPositions.forEach((p, i) => {
        const proj = project(p.x, p.y, p.z, rotY, rotX, cx, cy, FOV)
        if (proj.z < -R * 0.2) return

        const dp = DATA_POINTS[i]
        const pulse = 0.7 + Math.sin(frame * 0.05 + i * 0.8) * 0.3
        const r = 3.5 * proj.scale * pulse

        // Outer ring
        ctx.beginPath()
        ctx.arc(proj.x, proj.y, r * 2.5, 0, Math.PI * 2)
        ctx.strokeStyle = dp.color + '44'
        ctx.lineWidth = 1
        ctx.stroke()

        // Inner dot
        ctx.beginPath()
        ctx.arc(proj.x, proj.y, r, 0, Math.PI * 2)
        ctx.fillStyle = dp.color
        ctx.shadowColor = dp.color
        ctx.shadowBlur = 8
        ctx.fill()
        ctx.shadowBlur = 0
      })

      // Atmosphere rim
      const rimGrad = ctx.createRadialGradient(cx, cy, R * 0.88, cx, cy, R * 1.05)
      rimGrad.addColorStop(0, 'transparent')
      rimGrad.addColorStop(0.5, 'rgba(79,140,255,0.12)')
      rimGrad.addColorStop(1, 'rgba(168,85,247,0.08)')
      ctx.fillStyle = rimGrad
      ctx.beginPath()
      ctx.arc(cx, cy, R * 1.05, 0, Math.PI * 2)
      ctx.fill()

      // Highlight
      const hlGrad = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.3, 0, cx - R * 0.3, cy - R * 0.3, R * 0.6)
      hlGrad.addColorStop(0, 'rgba(255,255,255,0.06)')
      hlGrad.addColorStop(1, 'transparent')
      ctx.fillStyle = hlGrad
      ctx.beginPath()
      ctx.arc(cx, cy, R, 0, Math.PI * 2)
      ctx.fill()
    }

    draw()
    return () => cancelAnimationFrame(animId)
  }, [size])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.2, ease: 'easeOut' }}
      style={{ position: 'relative', width: size, height: size, ...style }}
    >
      <canvas
        ref={canvasRef}
        aria-label="Global AI intelligence network"
        style={{ display: 'block', filter: 'drop-shadow(0 0 40px rgba(79,140,255,0.3))' }}
      />
      {/* Rotating ring */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        style={{
          position: 'absolute',
          inset: -12,
          borderRadius: '50%',
          border: '1px solid rgba(79,140,255,0.15)',
          pointerEvents: 'none',
        }}
      />
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
        style={{
          position: 'absolute',
          inset: -24,
          borderRadius: '50%',
          border: '1px dashed rgba(168,85,247,0.10)',
          pointerEvents: 'none',
        }}
      />
      {/* Label */}
      <div style={{
        position: 'absolute',
        bottom: -32,
        left: '50%',
        transform: 'translateX(-50%)',
        fontSize: 10,
        fontWeight: 700,
        color: '#4F8CFF',
        fontFamily: "'JetBrains Mono', monospace",
        textTransform: 'uppercase',
        letterSpacing: '0.12em',
        whiteSpace: 'nowrap',
        textShadow: '0 0 12px rgba(79,140,255,0.6)',
      }}>
        Global AI Network
      </div>
    </motion.div>
  )
}
