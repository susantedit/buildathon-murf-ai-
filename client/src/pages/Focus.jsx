import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, RotateCcw, Wind, Timer, Volume2, VolumeX } from 'lucide-react'
import { PageHeader } from '../components/UI'
import { playBreathSound, playTimerSound, playCompletionSound } from '../utils/soundGenerator'
import { vibrateBreath, vibrateSuccess, vibrateLight } from '../utils/haptics'

const sessions = [
  { label: 'Deep Focus', duration: 25, desc: 'Pomodoro work session', color: '#8b5cf6', emoji: '🎯' },
  { label: 'Calm Mind',  duration: 10, desc: 'Breathing and reset',   color: '#3b82f6', emoji: '🧘' },
  { label: 'Power Nap',  duration: 5,  desc: 'Quick recharge',        color: '#10b981', emoji: '⚡' },
  { label: 'Study Flow', duration: 45, desc: 'Extended study mode',   color: '#c084fc', emoji: '📖' },
]

const breathSteps = ['Breathe in...', 'Hold...', 'Breathe out...', 'Hold...']

export default function Focus() {
  const [sel, setSel] = useState(sessions[0])
  const [running, setRunning] = useState(false)
  const [timeLeft, setTimeLeft] = useState(sessions[0].duration * 60)
  const [breathIdx, setBreathIdx] = useState(0)
  const [breathOn, setBreathOn] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const timerRef = useRef(null)
  const breathRef = useRef(null)

  useEffect(() => {
    if (running) {
      timerRef.current = setInterval(() => setTimeLeft(t => { 
        if (t <= 1) { 
          clearInterval(timerRef.current)
          setRunning(false)
          if (soundEnabled) playCompletionSound()
          vibrateSuccess()
          return 0
        }
        if (t <= 10 && soundEnabled) {
          playTimerSound()
          vibrateLight()
        }
        return t - 1
      }), 1000)
    } else clearInterval(timerRef.current)
    return () => clearInterval(timerRef.current)
  }, [running, soundEnabled])

  useEffect(() => {
    if (breathOn) {
      const soundType = breathIdx === 0 ? 'in' : breathIdx === 2 ? 'out' : 'hold'
      if (soundEnabled) playBreathSound(soundType)
      vibrateBreath(soundType)
      breathRef.current = setTimeout(() => setBreathIdx(i => (i + 1) % 4), 4000)
    } else clearTimeout(breathRef.current)
    return () => clearTimeout(breathRef.current)
  }, [breathOn, breathIdx, soundEnabled])

  const pick = s => { setSel(s); setTimeLeft(s.duration * 60); setRunning(false) }
  const reset = () => { setRunning(false); setTimeLeft(sel.duration * 60) }

  const mins = String(Math.floor(timeLeft / 60)).padStart(2, '0')
  const secs = String(timeLeft % 60).padStart(2, '0')
  const progress = 1 - timeLeft / (sel.duration * 60)
  const C = 2 * Math.PI * 90

  return (
    <div className="page-wrapper" style={{ '--page-accent': '#ef4444' }}>
      <div className="page-content">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <PageHeader icon={Timer} color="#10b981" title="Focus Mode" sub="Guided sessions to help you stay in flow" />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 28 }}>
            {sessions.map(s => (
              <button key={s.label} onClick={() => pick(s)} className="card"
                style={{ padding: 16, textAlign: 'left', cursor: 'pointer', background: sel.label === s.label ? s.color + '12' : 'var(--glass)', borderColor: sel.label === s.label ? s.color + '55' : 'var(--border)' }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>{s.emoji}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text1)' }}>{s.label}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{s.duration} min · {s.desc}</div>
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28 }}>
            <div style={{ position: 'relative', width: 200, height: 200 }}>
              <svg width="200" height="200" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="100" cy="100" r="90" fill="none" stroke="var(--border)" strokeWidth="8" />
                <circle cx="100" cy="100" r="90" fill="none" stroke={sel.color} strokeWidth="8"
                  strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - progress)}
                  style={{ transition: 'stroke-dashoffset 0.5s' }} />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontFamily: 'Poppins,system-ui,sans-serif', fontWeight: 700, fontSize: 36, color: 'var(--text1)' }}>{mins}:{secs}</div>
                <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{sel.label}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 20 }}>
              <button className="icon-btn" onClick={reset} style={{ width: 44, height: 44, borderRadius: 12 }}>
                <RotateCcw size={18} color="var(--text2)" />
              </button>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => setRunning(r => !r)}
                style={{ width: 64, height: 64, borderRadius: 20, border: 'none', cursor: 'pointer', background: `linear-gradient(135deg,${sel.color},#3b82f6)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {running ? <Pause size={26} color="#fff" /> : <Play size={26} color="#fff" />}
              </motion.button>
              <button className="icon-btn" onClick={() => setBreathOn(b => !b)}
                style={{ width: 44, height: 44, borderRadius: 12, background: breathOn ? 'rgba(59,130,246,0.2)' : 'var(--glass)', borderColor: breathOn ? 'rgba(59,130,246,0.4)' : 'var(--border)' }}>
                <Wind size={18} color={breathOn ? '#3b82f6' : 'var(--text2)'} />
              </button>
              <button className="icon-btn" onClick={() => setSoundEnabled(s => !s)}
                style={{ width: 44, height: 44, borderRadius: 12 }}>
                {soundEnabled ? <Volume2 size={18} color="var(--text2)" /> : <VolumeX size={18} color="var(--text3)" />}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {breathOn && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="card" style={{ padding: 24, textAlign: 'center' }}>
                <motion.div key={breathIdx} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  style={{ fontSize: 22, fontWeight: 600, color: '#3b82f6', fontFamily: 'Poppins,system-ui,sans-serif', marginBottom: 8 }}>
                  {breathSteps[breathIdx]}
                </motion.div>
                <div style={{ fontSize: 12, color: 'var(--text3)' }}>4 seconds</div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 12 }}>
                  {breathSteps.map((_, i) => <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: i === breathIdx ? '#3b82f6' : 'var(--border)', transition: 'background 0.3s' }} />)}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!breathOn && (
            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text2)', marginBottom: 12 }}>Focus tips</div>
              {['Put your phone face down', 'Close unnecessary tabs', 'Drink water before starting', 'Set a clear goal for this session'].map(tip => (
                <div key={tip} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text3)', marginBottom: 8 }}>
                  <span style={{ color: sel.color }}>•</span>{tip}
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
