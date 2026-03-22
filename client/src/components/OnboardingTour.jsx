// First-time user onboarding tour — 4 steps
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ArrowRight, Mic, Brain, Shield, Sparkles } from 'lucide-react'

const STEPS = [
  {
    icon: <Sparkles size={28} color="#8b5cf6" />,
    title: 'Welcome to Vortex Voice AI',
    desc: 'Your all-in-one AI platform for content creation, learning, productivity, and safety — all powered by voice.',
    color: '#8b5cf6',
  },
  {
    icon: <Mic size={28} color="#ec4899" />,
    title: 'Voice-First Experience',
    desc: 'Tap the 🎤 mic button on any page to speak your input instead of typing. Your voice drives everything.',
    color: '#ec4899',
  },
  {
    icon: <Brain size={28} color="#3b82f6" />,
    title: '10+ AI Modes',
    desc: 'Creator, Assistant, Study, Focus, Planner, Translator, Podcast, Journal — each with AI voice responses via Murf Falcon.',
    color: '#3b82f6',
  },
  {
    icon: <Shield size={28} color="#ef4444" />,
    title: 'Safety Guardian',
    desc: 'Hold the SOS button for 2.5s to send emergency alerts with your live location to trusted contacts.',
    color: '#ef4444',
  },
]

export default function OnboardingTour() {
  const [step, setStep] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const done = localStorage.getItem('vortex-onboarded')
    if (!done) setTimeout(() => setVisible(true), 1200)
  }, [])

  const finish = () => {
    setVisible(false)
    localStorage.setItem('vortex-onboarded', '1')
  }

  const next = () => {
    if (step < STEPS.length - 1) setStep(s => s + 1)
    else finish()
  }

  const current = STEPS[step]

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 3000, backdropFilter: 'blur(4px)' }}
            onClick={finish} />

          {/* Card */}
          <motion.div
            key={step}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', damping: 24, stiffness: 300 }}
            style={{
              position: 'fixed',
              top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 3001,
              width: 'min(340px, 88vw)',
              maxHeight: '85vh',
              overflowY: 'auto',
              background: 'var(--bg2)', borderRadius: 24, padding: 28,
              border: `1px solid ${current.color}40`,
              boxShadow: `0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px ${current.color}20`,
            }}>

            {/* Close */}
            <button onClick={finish} aria-label="Skip tour"
              style={{ position: 'absolute', top: 16, right: 16, width: 28, height: 28, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--glass)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={13} color="var(--text3)" />
            </button>

            {/* Icon */}
            <div style={{ width: 64, height: 64, borderRadius: 20, background: current.color + '18', border: `1px solid ${current.color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
              {current.icon}
            </div>

            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text1)', fontFamily: 'Syne,system-ui,sans-serif', marginBottom: 10, lineHeight: 1.3 }}>
              {current.title}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.7, marginBottom: 24 }}>
              {current.desc}
            </div>

            {/* Step dots */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: 6 }}>
                {STEPS.map((_, i) => (
                  <div key={i} style={{ width: i === step ? 20 : 6, height: 6, borderRadius: 3, background: i === step ? current.color : 'var(--border)', transition: 'all 0.3s' }} />
                ))}
              </div>
              <motion.button whileTap={{ scale: 0.95 }} onClick={next}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 12, border: 'none', background: `linear-gradient(135deg,${current.color},${current.color}cc)`, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                {step < STEPS.length - 1 ? <><span>Next</span><ArrowRight size={14} /></> : <span>Get Started 🚀</span>}
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
