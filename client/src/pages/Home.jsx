import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Zap, ArrowRight, Sparkles } from 'lucide-react'
import { playHoverSound, playClickSound } from '../utils/soundGenerator'

const modes = [
  { emoji: '🎬', label: 'Creator Mode',        desc: 'Scripts & voice for reels, YouTube, podcasts',   color: '#8b5cf6', path: '/creator' },
  { emoji: '🧠', label: 'Life Assistant',       desc: 'AI voice guidance for stress, decisions & life',  color: '#3b82f6', path: '/assistant' },
  { emoji: '📚', label: 'Study Mode',           desc: 'Voice explanations for any topic like a teacher', color: '#c084fc', path: '/study' },
  { emoji: '🧘', label: 'Focus Mode',           desc: 'Guided timer sessions to keep you in flow',       color: '#10b981', path: '/focus' },
  { emoji: '📅', label: 'Productivity Planner', desc: 'Set a goal, get a voice-guided daily plan',       color: '#f59e0b', path: '/planner' },
  { emoji: '🛡️', label: 'Safety Guardian',      desc: 'Voice-powered emergency assistance for women',    color: '#ef4444', path: '/safety' },
  { emoji: '📖', label: 'History',              desc: 'Review all your past sessions and responses',     color: '#64748b', path: '/history' },
]

const chips = ['Focus tips', 'Exam stress', 'Motivational reel', 'Explain quantum physics', 'Daily plan', 'I feel overwhelmed']

export default function Home() {
  const [input, setInput] = useState('')
  const navigate = useNavigate()

  return (
    <div className="page-wrapper">
      <div className="page-content-wide">

        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          style={{ textAlign: 'center', paddingBottom: 40 }}>

          <div className="badge" style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.28)', color: '#8b5cf6', marginBottom: 20 }}>
            <Sparkles size={13} /> Voice-First AI Platform · Powered by Murf Falcon
          </div>

          <h1 style={{ fontFamily: 'Syne,system-ui,sans-serif', fontWeight: 800, fontSize: 'clamp(2.2rem,5vw,3.8rem)', lineHeight: 1.1, color: 'var(--text1)', marginBottom: 16, position: 'relative', letterSpacing: '-0.02em' }}>
            {/* Decorative waveform background */}
            <svg style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '120%', height: '120%', opacity: 0.05, zIndex: -1, pointerEvents: 'none' }} viewBox="0 0 200 60" preserveAspectRatio="none">
              <path d="M0,30 Q10,10 20,30 T40,30 T60,30 T80,30 T100,30 T120,30 T140,30 T160,30 T180,30 T200,30" fill="none" stroke="#8b5cf6" strokeWidth="2" />
              <path d="M0,30 Q10,50 20,30 T40,30 T60,30 T80,30 T100,30 T120,30 T140,30 T160,30 T180,30 T200,30" fill="none" stroke="#3b82f6" strokeWidth="2" />
            </svg>
            Create<span style={{ color: 'var(--text2)' }}>.</span> Learn<span style={{ color: 'var(--text2)' }}>.</span> Grow<span style={{ color: 'var(--text2)' }}>.</span>
            <br />
            <span style={{ background: 'linear-gradient(135deg,#8b5cf6,#3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>with AI Voice</span>
          </h1>

          <p style={{ fontSize: 15, color: 'var(--text2)', maxWidth: 520, margin: '0 auto 28px', lineHeight: 1.7, fontWeight: 500 }}>
            Your AI-powered assistant for content, learning, and life.
          </p>

          {/* Input */}
          <div style={{ position: 'relative', maxWidth: 620, margin: '0 auto 16px' }}>
            <textarea value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && input.trim()) { e.preventDefault(); navigate('/assistant', { state: { input } }) } }}
              placeholder="Type your idea, problem, or topic..."
              rows={3} className="inp" style={{ paddingRight: 110, fontSize: 15 }} />
            <button className="btn" onClick={() => input.trim() && navigate('/assistant', { state: { input } })}
              style={{ position: 'absolute', right: 10, bottom: 10, width: 'auto', padding: '9px 18px', fontSize: 13, borderRadius: 10 }}>
              <Zap size={14} /> Go
            </button>
          </div>

          {/* Chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginBottom: 44 }}>
            {chips.map(c => <button key={c} className="chip" onClick={() => setInput(c)}>{c}</button>)}
          </div>
        </motion.div>

        {/* Mode cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 16 }}>
          {modes.map(({ emoji, label, desc, color, path }, i) => (
            <motion.div key={label} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.07 }}
              whileHover={{ scale: 1.03, y: -4 }}
              onHoverStart={() => playHoverSound()}
              onClick={() => { playClickSound(); navigate(path) }}
              className="card"
              style={{ 
                padding: 22, 
                cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                transition: 'box-shadow 0.3s'
              }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, fontSize: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', background: color + '18', border: `1px solid ${color}35`, marginBottom: 14 }}>
                {emoji}
              </div>
              <div style={{ fontFamily: 'Syne,system-ui,sans-serif', fontWeight: 600, fontSize: 15, color: 'var(--text1)', marginBottom: 6 }}>{label}</div>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 14, lineHeight: 1.55 }}>{desc}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color }}>Open <ArrowRight size={12} /></div>
            </motion.div>
          ))}
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginTop: 28 }}>
          {[['6+','AI Modes'],['5 Voices','Murf Falcon'],['100%','Free to Use']].map(([v,l]) => (
            <div key={l} className="card" style={{ padding: '16px 8px', textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 4, background: 'linear-gradient(135deg,#8b5cf6,#3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontFamily: 'Syne,system-ui,sans-serif' }}>{v}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
