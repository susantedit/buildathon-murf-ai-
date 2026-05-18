import { useRef, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Float } from '@react-three/drei'
import * as THREE from 'three'

const STATE_COLORS = {
  idle: { emissive: '#1a3a6e', color: '#4F8CFF', intensity: 0.4 },
  listening: { emissive: '#6b1a1a', color: '#ef4444', intensity: 0.8 },
  processing: { emissive: '#3d1a6e', color: '#A855F7', intensity: 0.6 },
  responding: { emissive: '#0d4a5a', color: '#22d3ee', intensity: 0.9 },
}

function Sphere({ state }) {
  const meshRef = useRef()
  const ring1Ref = useRef()
  const ring2Ref = useRef()
  const ring3Ref = useRef()
  const { mouse } = useThree()
  const cfg = STATE_COLORS[state] || STATE_COLORS.idle

  useFrame((_, delta) => {
    if (!meshRef.current) return

    // Mouse parallax
    meshRef.current.rotation.y += (mouse.x * 0.3 - meshRef.current.rotation.y) * 0.05
    meshRef.current.rotation.x += (-mouse.y * 0.2 - meshRef.current.rotation.x) * 0.05

    // State-based animations
    if (state === 'idle') {
      const t = Date.now() * 0.001
      meshRef.current.scale.setScalar(1 + Math.sin(t) * 0.02)
    }

    if (state === 'processing' && ring1Ref.current) {
      ring1Ref.current.rotation.z += delta * 1.5
      ring2Ref.current.rotation.x += delta * 1.0
      ring3Ref.current.rotation.y += delta * 0.7
    }

    if (state === 'listening') {
      const t = Date.now() * 0.003
      if (ring1Ref.current) ring1Ref.current.scale.setScalar(1 + Math.sin(t) * 0.3)
      if (ring2Ref.current) ring2Ref.current.scale.setScalar(1 + Math.sin(t + 0.5) * 0.4)
      if (ring3Ref.current) ring3Ref.current.scale.setScalar(1 + Math.sin(t + 1.0) * 0.5)
    }

    if (state === 'responding') {
      const t = Date.now() * 0.002
      meshRef.current.scale.setScalar(1 + Math.sin(t * 2) * 0.04)
    }
  })

  const ringColor = cfg.color

  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3}>
      {/* Main sphere */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshStandardMaterial
          color={cfg.color}
          emissive={cfg.emissive}
          emissiveIntensity={cfg.intensity}
          roughness={0.2}
          metalness={0.8}
          wireframe={false}
        />
      </mesh>

      {/* Rings */}
      <mesh ref={ring1Ref} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.4, 0.02, 8, 64]} />
        <meshBasicMaterial color={ringColor} transparent opacity={state === 'idle' ? 0.2 : 0.7} />
      </mesh>
      <mesh ref={ring2Ref} rotation={[Math.PI / 3, Math.PI / 4, 0]}>
        <torusGeometry args={[1.7, 0.015, 8, 64]} />
        <meshBasicMaterial color={ringColor} transparent opacity={state === 'idle' ? 0.1 : 0.5} />
      </mesh>
      <mesh ref={ring3Ref} rotation={[Math.PI / 6, Math.PI / 3, Math.PI / 5]}>
        <torusGeometry args={[2.0, 0.01, 8, 64]} />
        <meshBasicMaterial color={ringColor} transparent opacity={state === 'idle' ? 0.08 : 0.35} />
      </mesh>
    </Float>
  )
}

export default function AiCoreSphereR3F({ state = 'idle', size = 200 }) {
  return (
    <div style={{ width: size, height: size }} aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 4], fov: 45 }}
        dpr={Math.min(window.devicePixelRatio, 2)}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.3} />
        <pointLight position={[5, 5, 5]} intensity={1.5} color="#4F8CFF" />
        <pointLight position={[-5, -5, 5]} intensity={0.8} color="#A855F7" />
        <Sphere state={state} />
      </Canvas>
    </div>
  )
}
