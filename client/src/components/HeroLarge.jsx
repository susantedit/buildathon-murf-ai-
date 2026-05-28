import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sparkles, Play } from 'lucide-react'

export default function HeroLarge({ title = 'Get Interview-Ready with AI-Powered Practice & Feedback', subtitle = 'Practice real interview questions & get instant feedback.', cta = 'Start an Interview' }) {
  const navigate = useNavigate()
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ borderRadius: 16, overflow: 'hidden', background: 'linear-gradient(180deg, rgba(10,12,16,0.9), rgba(18,20,28,0.9))', padding: 28, display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24, alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#A855F7,#22d3ee)', display: 'grid', placeItems: 'center' }}>
              <Sparkles size={18} color="#fff" />
            </div>
            <div style={{ color: 'var(--text3)', fontSize: 12, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase' }}>PrepWise</div>
          </div>
          <h1 style={{ fontSize: 'clamp(1.6rem,2.6vw,2.4rem)', margin: 0, fontWeight: 800, color: 'var(--text1)', lineHeight: 1.05 }}>{title}</h1>
          <p style={{ color: 'var(--text2)', marginTop: 12, maxWidth: 600 }}>{subtitle}</p>
          <div style={{ marginTop: 18, display: 'flex', gap: 12 }}>
            <button className="btn" onClick={() => navigate('/interviews/new')}><Play size={14} /> {cta}</button>
            <button className="btn" onClick={() => navigate('/interviews')} style={{ background: 'var(--glass)', color: 'var(--text2)' }}>View interviews</button>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 320, height: 180, borderRadius: 12, background: 'linear-gradient(135deg,#0b1020,#1b2230)', border: '1px solid rgba(255,255,255,0.04)', display: 'grid', placeItems: 'center' }}>
            {/* Illustration placeholder — swap with asset for Figma fidelity */}
            <div style={{ color: 'var(--text3)', fontSize: 13 }}>Illustration</div>
          </div>
        </div>
      </div>
    </div>
  )
}
