import { useState } from 'react'
import { motion } from 'framer-motion'
import { Copy, Check } from 'lucide-react'
import WaveformVisualizer from './WaveformVisualizer'
import TypewriterText from './TypewriterText'
import { useAdaptiveUI } from './AdaptiveUIContext'

/**
 * AIResponseCard — animated slide-in response card
 * Used in Assistant and CageBait pages
 */
export default function AIResponseCard({
  text,
  label = 'AI Response',
  icon = null,
  audioUrl = '',
  isPlaying = false,
  typewriter = true,
  accentColor = null,
}) {
  const [copied, setCopied] = useState(false)
  const { modeColors } = useAdaptiveUI()
  const color = accentColor || modeColors['--ng-blue'] || '#4F8CFF'

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* ignore */ }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      className="card"
      style={{
        padding: 20,
        marginTop: 12,
        borderLeft: `3px solid ${color}`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {icon}
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)' }}>{label}</span>
        </div>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={copy}
          aria-label="Copy response"
          style={{
            width: 28, height: 28, borderRadius: 8,
            border: '1px solid var(--border)',
            background: 'var(--glass)',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {copied
            ? <Check size={12} color="#10b981" />
            : <Copy size={12} color="var(--text3)" />
          }
        </motion.button>
      </div>

      {/* Text */}
      <p style={{ fontSize: 14, lineHeight: 1.75, color: 'var(--text1)', whiteSpace: 'pre-line' }}>
        {typewriter ? <TypewriterText text={text} /> : text}
      </p>

      {/* Waveform strip when audio is playing */}
      {audioUrl && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
          <WaveformVisualizer isPlaying={isPlaying} color={color} height={24} barCount={24} />
        </div>
      )}

      {/* Subtle glow overlay */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 0, left: 0,
          width: 3,
          height: '100%',
          background: `linear-gradient(to bottom, ${color}, ${color}44)`,
          borderRadius: '3px 0 0 3px',
        }}
      />
    </motion.div>
  )
}
