import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { motion } from 'framer-motion'
import TypewriterText from './TypewriterText'
import ResponseRating from './ResponseRating'

export function PageHeader({ icon: Icon, color, title, sub }) {
  return (
    <div className="ph">
      <div className="ph-icon" style={{ background: color + '18', border: `1px solid ${color}35` }}>
        {Icon && <Icon size={24} color={color} aria-hidden="true" />}
      </div>
      <div>
        <h1>{title}</h1>
        <p>{sub}</p>
      </div>
    </div>
  )
}

export function Label({ children, style = {} }) {
  return <label className="lbl" style={style}>{children}</label>
}

export function SubmitBtn({ loading, onClick, label, loadingLabel }) {
  return (
    <button className="btn" onClick={onClick} disabled={loading} aria-busy={loading}>
      {loading ? <><span className="spin" aria-hidden="true" />{loadingLabel}</> : label}
    </button>
  )
}

// Skeleton shimmer for loading states
export function Skeleton({ height = 80, style = {} }) {
  return <div className="card shimmer" style={{ height, marginBottom: 12, ...style }} aria-hidden="true" />
}

export function ResultCard({ icon, label, text, typewriter = true, sessionId }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* ignore */ }
  }

  return (
    <div className="card result" role="region" aria-label={label}>
      <div className="result-hd" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {icon}
          <span className="result-lbl">{label}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {sessionId && <ResponseRating sessionId={sessionId} />}
          <motion.button whileTap={{ scale: 0.9 }} onClick={copy} aria-label="Copy response"
            style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--glass)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {copied ? <Check size={12} color="#10b981" /> : <Copy size={12} color="var(--text3)" />}
          </motion.button>
        </div>
      </div>
      <p className="result-txt">
        {typewriter ? <TypewriterText text={text} /> : text}
      </p>
    </div>
  )
}
