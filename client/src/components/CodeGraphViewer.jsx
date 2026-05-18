import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * CodeGraphViewer — SVG force-directed graph
 * Used in CageBait Intel Dashboard to visualize scammer intel
 */
export default function CodeGraphViewer({ nodes = [], edges = [], height = 280 }) {
  const svgRef = useRef(null)
  const [positions, setPositions] = useState({})
  const [tooltip, setTooltip] = useState(null)
  const [hoveredNode, setHoveredNode] = useState(null)
  const animRef = useRef(null)
  const posRef = useRef({})
  const velRef = useRef({})

  const NODE_COLORS = {
    center: '#ef4444',
    phone: '#f97316',
    upi: '#f59e0b',
    link: '#ef4444',
    company: '#4F8CFF',
    bank: '#A855F7',
    email: '#22d3ee',
    default: '#94a3b8',
  }

  useEffect(() => {
    if (!nodes.length) return

    const W = svgRef.current?.clientWidth || 400
    const H = height

    // Initialize positions
    const pos = {}
    const vel = {}
    nodes.forEach((n, i) => {
      if (n.type === 'center') {
        pos[n.id] = { x: W / 2, y: H / 2 }
      } else {
        const angle = (i / (nodes.length - 1)) * Math.PI * 2
        pos[n.id] = {
          x: W / 2 + Math.cos(angle) * (W * 0.3),
          y: H / 2 + Math.sin(angle) * (H * 0.3),
        }
      }
      vel[n.id] = { x: 0, y: 0 }
    })
    posRef.current = pos
    velRef.current = vel
    setPositions({ ...pos })

    // Simple force simulation
    let frame = 0
    const simulate = () => {
      if (frame++ > 120) return // stop after convergence

      const p = posRef.current
      const v = velRef.current

      // Repulsion between nodes
      nodes.forEach(a => {
        nodes.forEach(b => {
          if (a.id === b.id) return
          const dx = p[a.id].x - p[b.id].x
          const dy = p[a.id].y - p[b.id].y
          const dist = Math.sqrt(dx * dx + dy * dy) || 1
          const force = 1200 / (dist * dist)
          v[a.id].x += (dx / dist) * force * 0.1
          v[a.id].y += (dy / dist) * force * 0.1
        })
      })

      // Spring attraction along edges
      edges.forEach(e => {
        const a = p[e.source]
        const b = p[e.target]
        if (!a || !b) return
        const dx = b.x - a.x
        const dy = b.y - a.y
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        const force = (dist - 100) * 0.03
        v[e.source].x += (dx / dist) * force
        v[e.source].y += (dy / dist) * force
        v[e.target].x -= (dx / dist) * force
        v[e.target].y -= (dy / dist) * force
      })

      // Center gravity
      nodes.forEach(n => {
        if (n.type === 'center') return
        v[n.id].x += (W / 2 - p[n.id].x) * 0.005
        v[n.id].y += (H / 2 - p[n.id].y) * 0.005
      })

      // Apply velocity + damping + bounds
      nodes.forEach(n => {
        if (n.type === 'center') return
        v[n.id].x *= 0.85
        v[n.id].y *= 0.85
        p[n.id].x = Math.max(20, Math.min(W - 20, p[n.id].x + v[n.id].x))
        p[n.id].y = Math.max(20, Math.min(H - 20, p[n.id].y + v[n.id].y))
      })

      setPositions({ ...p })
      animRef.current = requestAnimationFrame(simulate)
    }

    animRef.current = requestAnimationFrame(simulate)
    return () => cancelAnimationFrame(animRef.current)
  }, [nodes, edges, height])

  if (!nodes.length) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)', fontSize: 13 }}>
        No intel graph data yet
      </div>
    )
  }

  const W = svgRef.current?.clientWidth || 400

  return (
    <div style={{ position: 'relative', width: '100%', height }}>
      <svg
        ref={svgRef}
        width="100%"
        height={height}
        style={{ overflow: 'visible' }}
        aria-label="Intel knowledge graph"
      >
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Edges */}
        {edges.map((e, i) => {
          const a = positions[e.source]
          const b = positions[e.target]
          if (!a || !b) return null
          return (
            <motion.line
              key={`edge-${i}`}
              x1={a.x} y1={a.y} x2={b.x} y2={b.y}
              stroke="rgba(79,140,255,0.3)"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
            />
          )
        })}

        {/* Nodes */}
        {nodes.map((n, i) => {
          const pos = positions[n.id]
          if (!pos) return null
          const color = NODE_COLORS[n.type] || NODE_COLORS.default
          const r = n.type === 'center' ? 14 : hoveredNode === n.id ? 11 : 8

          return (
            <g key={n.id}>
              <motion.circle
                cx={pos.x} cy={pos.y} r={r}
                fill={`${color}33`}
                stroke={color}
                strokeWidth={2}
                filter="url(#glow)"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20, delay: i * 0.08 }}
                onMouseEnter={() => { setHoveredNode(n.id); setTooltip({ ...n, x: pos.x, y: pos.y }) }}
                onMouseLeave={() => { setHoveredNode(null); setTooltip(null) }}
                style={{ cursor: 'pointer' }}
              />
              {n.type === 'center' && (
                <motion.circle
                  cx={pos.x} cy={pos.y} r={r + 6}
                  fill="none"
                  stroke={color}
                  strokeWidth={1}
                  opacity={0.4}
                  animate={{ r: [r + 4, r + 10, r + 4], opacity: [0.4, 0.1, 0.4] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
            </g>
          )
        })}
      </svg>

      {/* Tooltip */}
      <AnimatePresence>
        {tooltip && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            style={{
              position: 'absolute',
              left: Math.min(tooltip.x + 12, W - 140),
              top: tooltip.y - 36,
              background: 'rgba(11,15,26,0.95)',
              border: '1px solid rgba(79,140,255,0.3)',
              borderRadius: 8,
              padding: '6px 10px',
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--text1)',
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
              zIndex: 10,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {tooltip.label}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
