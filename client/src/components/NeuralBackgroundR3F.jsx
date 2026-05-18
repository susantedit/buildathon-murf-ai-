import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const PARTICLE_COUNT = 120
const COLORS = [0x4f8cff, 0xa855f7, 0x22d3ee]

function Particles() {
  const meshRef = useRef()
  const linesRef = useRef()

  const { positions, velocities, colors } = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3)
    const velocities = []
    const colors = new Float32Array(PARTICLE_COUNT * 3)

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20
      positions[i * 3 + 1] = (Math.random() - 0.5) * 12
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8

      velocities.push({
        x: (Math.random() - 0.5) * 0.008,
        y: (Math.random() - 0.5) * 0.008,
        z: (Math.random() - 0.5) * 0.004,
      })

      const c = new THREE.Color(COLORS[Math.floor(Math.random() * COLORS.length)])
      colors[i * 3] = c.r
      colors[i * 3 + 1] = c.g
      colors[i * 3 + 2] = c.b
    }

    return { positions, velocities, colors }
  }, [])

  const linePositions = useMemo(() => new Float32Array(40 * 6), [])

  useFrame(() => {
    if (!meshRef.current) return
    const pos = meshRef.current.geometry.attributes.position.array

    // Update particle positions
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      pos[i * 3] += velocities[i].x
      pos[i * 3 + 1] += velocities[i].y
      pos[i * 3 + 2] += velocities[i].z

      // Wrap at edges
      if (Math.abs(pos[i * 3]) > 10) velocities[i].x *= -1
      if (Math.abs(pos[i * 3 + 1]) > 6) velocities[i].y *= -1
      if (Math.abs(pos[i * 3 + 2]) > 4) velocities[i].z *= -1
    }
    meshRef.current.geometry.attributes.position.needsUpdate = true

    // Update connection lines (nearest 40 pairs)
    if (!linesRef.current) return
    let lineIdx = 0
    for (let i = 0; i < PARTICLE_COUNT && lineIdx < 40; i++) {
      for (let j = i + 1; j < PARTICLE_COUNT && lineIdx < 40; j++) {
        const dx = pos[i * 3] - pos[j * 3]
        const dy = pos[i * 3 + 1] - pos[j * 3 + 1]
        const dz = pos[i * 3 + 2] - pos[j * 3 + 2]
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
        if (dist < 3) {
          linePositions[lineIdx * 6] = pos[i * 3]
          linePositions[lineIdx * 6 + 1] = pos[i * 3 + 1]
          linePositions[lineIdx * 6 + 2] = pos[i * 3 + 2]
          linePositions[lineIdx * 6 + 3] = pos[j * 3]
          linePositions[lineIdx * 6 + 4] = pos[j * 3 + 1]
          linePositions[lineIdx * 6 + 5] = pos[j * 3 + 2]
          lineIdx++
        }
      }
    }
    linesRef.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <>
      <points ref={meshRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.06} vertexColors transparent opacity={0.7} sizeAttenuation />
      </points>

      <lineSegments ref={linesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[linePositions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#4F8CFF" transparent opacity={0.12} />
      </lineSegments>
    </>
  )
}

export default function NeuralBackgroundR3F() {
  return (
    <div
      aria-hidden="true"
      style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}
    >
      <Canvas
        camera={{ position: [0, 0, 8], fov: 60 }}
        dpr={Math.min(window.devicePixelRatio, 2)}
        gl={{ antialias: false, alpha: true }}
      >
        <fog attach="fog" args={['#0B0F1A', 8, 20]} />
        <Particles />
      </Canvas>
    </div>
  )
}
