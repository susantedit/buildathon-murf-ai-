import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, RotateCcw, Wind, Timer, Volume2, VolumeX, Sparkles, CheckCircle2, Target, Brain, Zap, BookOpen, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import WaveformPlayer from '../components/WaveformPlayer'
import { PageHeader } from '../components/UI'
import QuoteBar from '../components/QuoteBar'
import { playBreathSound, playTimerSound, playCompletionSound } from '../utils/soundGenerator'
import { vibrateBreath, vibrateSuccess, vibrateLight } from '../utils/haptics'
import { api } from '../services/api'
import { useAuth } from '../context/AuthContext'

function launchFocusConfetti() {
  const colors = ['#10b981','#8b5cf6','#3b82f6','#f59e0b','#ec4899']
  for (let i = 0; i < 60; i++) {
    const el = document.createElement('div')
    el.style.cssText = `position:fixed;width:${6+Math.random()*8}px;height:${6+Math.random()*8}px;border-radius:2px;top:-10px;left:${Math.random()*100}vw;background:${colors[Math.floor(Math.random()*colors.length)]};z-index:99999;pointer-events:none;animation:confetti-fall ${1.5+Math.random()*2}s ${Math.random()*0.8}s linear forwards`
    document.body.appendChild(el)
    setTimeout(() => el.remove(), 4000)
  }
  if (!document.getElementById('focus-confetti-style')) {
    const s = document.createElement('style')
    s.id = 'focus-confetti-style'
    s.textContent = '@keyframes confetti-fall{0%{transform:translateY(-10px) rotate(0deg);opacity:1}100%{transform:translateY(100vh) rotate(720deg);opacity:0}}'
    document.head.appendChild(s)
  }
}

const sessions = [
  { label: 'Deep Focus', duration: 25,   desc: 'Pomodoro work session', color: '#8b5cf6', Icon: Target   },
  { label: 'Calm Mind',  duration: 10,   desc: 'Breathing and reset',   color: '#3b82f6', Icon: Brain    },
  { label: 'Power Nap',  duration: 5,    desc: 'Quick recharge',        color: '#10b981', Icon: Zap      },
  { label: 'Study Flow', duration: 45,   desc: 'Extended study mode',   color: '#c084fc', Icon: BookOpen },
  { label: 'Custom',     duration: null, desc: 'Set your own time',     color: '#f59e0b', Icon: Clock    },
]

const breathSteps = ['Breathe in...', 'Hold...', 'Breathe out...', 'Hold...']

const sessionQuotes = {
  'Deep Focus': [
    'Flow is the state where challenge meets skill.',
    'One task at a time. That is the secret.',
    'Deep work is the superpower of the 21st century.',
    'Your best work happens when distractions disappear.',
    'Focus is not about saying yes — it is about saying no.',
    'The present moment is where great work lives.',
  ],
  'Calm Mind': [
    'Stillness is where clarity is born.',
    'Breathe. You are exactly where you need to be.',
    'Peace is not the absence of noise — it is the presence of calm.',
    'A calm mind is a powerful mind.',
    'Let go of what you cannot control.',
    'Rest is not laziness — it is wisdom.',
  ],
  'Power Nap': [
    'Even a short rest can reset everything.',
    'Recharge now, conquer later.',
    'Rest is part of the process.',
    'A few minutes of stillness can change your whole day.',
    'Your brain needs breaks to perform at its best.',
    'Recovery is a skill. Practice it.',
  ],
  'Study Flow': [
    'Every expert was once a beginner.',
    'Learning is the only thing the mind never exhausts.',
    'Knowledge compounds — keep going.',
    'The more you learn, the more you can do.',
    'Curiosity is the engine of achievement.',
    'Study hard now, shine later.',
  ],
  'Custom': [
    'You set the pace. You own the session.',
    'Every minute of focus is an investment.',
    'Progress, not perfection.',
    'Small steps, big results.',
    'You are building something great.',
    'Stay the course.',
  ],
}

export default function Focus() {
  const { userId } = useAuth()
  const [sel, setSel] = useState(sessions[0])
  const [running, setRunning] = useState(false)
  const [customMinutes, setCustomMinutes] = useState(20)
  const [timeLeft, setTimeLeft] = useState(sessions[0].duration * 60)
  const [breathIdx, setBreathIdx] = useState(0)
  const [breathOn, setBreathOn] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [meditating, setMeditating] = useState(false)
  const [meditationResult, setMeditationResult] = useState(null)
  const [meditationLoading, setMeditationLoading] = useState(false)
  const [stressLevel, setStressLevel] = useState('moderate')
  const [completed, setCompleted] = useState(false)
  const [currentQuoteIdx, setCurrentQuoteIdx] = useState(0)
  const timerRef = useRef(null)
  const breathRef = useRef(null)
  const quoteRef = useRef(null)

  const [sessionLog, setSessionLog] = useState(() => {
    try { return JSON.parse(localStorage.getItem('focus-session-log') || '[]') } catch { return [] }
  })

  const logSession = (label, duration) => {
    const entry = {
      label, duration,
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      id: Date.now()
    }
    const updated = [entry, ...sessionLog].slice(0, 20)
    setSessionLog(updated)
    localStorage.setItem('focus-session-log', JSON.stringify(updated))
  }

  const activeDuration = sel.duration ?? customMinutes
  const quotes = sessionQuotes[sel.label] || sessionQuotes['Custom']

  // Cycle quotes every 60s while running
  useEffect(() => {
    if (running) {
      setCurrentQuoteIdx(Math.floor(Math.random() * quotes.length))
      quoteRef.current = setInterval(() => {
        setCurrentQuoteIdx(i => (i + 1) % quotes.length)
      }, 60000)
    } else {
      clearInterval(quoteRef.current)
    }
    return () => clearInterval(quoteRef.current)
  }, [running, sel.label])

  useEffect(() => {
    if (running) {
      timerRef.current = setInterval(() => setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current)
          setRunning(false)
          if (soundEnabled) playCompletionSound()
          vibrateSuccess()
          launchFocusConfetti()
          logSession(sel.label, activeDuration)
          setCompleted(true)
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

  const pick = s => {
    setSel(s)
    setTimeLeft((s.duration ?? customMinutes) * 60)
    setRunning(false)
    setCompleted(false)
  }

  const reset = () => {
    setRunning(false)
    setTimeLeft(activeDuration * 60)
    setCompleted(false)
  }

  const mins = String(Math.floor(timeLeft / 60)).padStart(2, '0')
  const secs = String(timeLeft % 60).padStart(2, '0')
  const progress = 1 - timeLeft / (activeDuration * 60)
  const C = 2 * Math.PI * 90

  // Pick a stable completion quote (based on session label)
  const completionQuote = quotes[0]

  const generateMeditation = async () => {
    setMeditationLoading(true)
    setMeditationResult(null)
    try {
      const d = await api.generateAdvice(
        `Create a short 2-minute guided meditation script for someone with ${stressLevel} stress. Include: a calming opening, 3 breathing instructions, a body scan, and a peaceful closing. Use gentle, soothing language. Keep it under 150 words.`,
        userId
      )
      setMeditationResult(d)
      setMeditating(true)
      toast.success('Meditation ready — close your eyes 🧘')
    } catch { toast.error('Could not generate meditation') }
    finally { setMeditationLoading(false) }
  }

  return (
    <div className="page-wrapper" style={{ '--page-accent': '#ef4444' }}>
      <div className="page-content">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <PageHeader icon={Timer} color="#10b981" title="Focus Mode" sub="Guided sessions to help you stay in flow" />
          <QuoteBar section="focus" color="#10b981" />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: sel.duration === null ? 12 : 28 }}>
            {sessions.map(s => (
              <button key={s.label} onClick={() => pick(s)} className="card"
                style={{ padding: 16, textAlign: 'left', cursor: 'pointer',
                  background: sel.label === s.label ? s.color + '12' : 'var(--glass)',
                  borderColor: sel.label === s.label ? s.color + '55' : 'var(--border)' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: s.color + '18', border: `1px solid ${s.color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                  <s.Icon size={18} color={s.color} />
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text1)' }}>{s.label}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{s.duration ? `${s.duration} min · ` : ''}{s.desc}</div>
              </button>
            ))}
          </div>

          {sel.duration === null && (
            <div className="card" style={{ padding: 16, marginBottom: 28, display: 'flex', alignItems: 'center', gap: 12 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', whiteSpace: 'nowrap' }}>Minutes:</label>
              <input type="number" min={1} max={180} value={customMinutes}
                onChange={e => {
                  const v = Math.max(1, Math.min(180, Number(e.target.value) || 1))
                  setCustomMinutes(v)
                  setTimeLeft(v * 60)
                  setRunning(false)
                }}
                className="inp"
                style={{ fontSize: 15, fontWeight: 700, textAlign: 'center', width: 80, padding: '8px 12px' }} />
              <span style={{ fontSize: 12, color: 'var(--text3)' }}>1 – 180 min</span>
            </div>
          )}

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
                style={{ width: 64, height: 64, borderRadius: 20, border: 'none', cursor: 'pointer',
                  background: `linear-gradient(135deg,${sel.color},#3b82f6)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {running ? <Pause size={26} color="#fff" /> : <Play size={26} color="#fff" />}
              </motion.button>
              <button className="icon-btn" onClick={() => setBreathOn(b => !b)}
                style={{ width: 44, height: 44, borderRadius: 12,
                  background: breathOn ? 'rgba(59,130,246,0.2)' : 'var(--glass)',
                  borderColor: breathOn ? 'rgba(59,130,246,0.4)' : 'var(--border)' }}>
                <Wind size={18} color={breathOn ? '#3b82f6' : 'var(--text2)'} />
              </button>
              <button className="icon-btn" onClick={() => setSoundEnabled(s => !s)}
                style={{ width: 44, height: 44, borderRadius: 12 }}>
                {soundEnabled ? <Volume2 size={18} color="var(--text2)" /> : <VolumeX size={18} color="var(--text3)" />}
              </button>
            </div>
          </div>

          {/* Motivational quote while running */}
          <AnimatePresence mode="wait">
            {running && (
              <motion.div key={currentQuoteIdx}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                className="card"
                style={{ padding: 18, textAlign: 'center', marginBottom: 12, background: sel.color + '10', borderColor: sel.color + '30' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
                  <Sparkles size={16} color={sel.color} />
                </div>
                <div style={{ fontSize: 14, fontStyle: 'italic', color: 'var(--text1)', lineHeight: 1.6 }}>
                  "{quotes[currentQuoteIdx]}"
                </div>
              </motion.div>
            )}
          </AnimatePresence>

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
                  {breathSteps.map((_, i) => (
                    <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: i === breathIdx ? '#3b82f6' : 'var(--border)', transition: 'background 0.3s' }} />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!breathOn && !running && (
            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text2)', marginBottom: 12 }}>Focus tips</div>
              {['Put your phone face down', 'Close unnecessary tabs', 'Drink water before starting', 'Set a clear goal for this session'].map(tip => (
                <div key={tip} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text3)', marginBottom: 8 }}>
                  <span style={{ color: sel.color }}>•</span>{tip}
                </div>
              ))}
            </div>
          )}

          {sessionLog.length > 0 && (
            <div className="card" style={{ padding: 20, marginTop: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle2 size={15} color="#10b981" />
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text1)' }}>Today's Sessions</span>
                </div>
                <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: 'rgba(16,185,129,0.12)', color: '#10b981', fontWeight: 700 }}>
                  {sessionLog.filter(s => s.date === new Date().toLocaleDateString()).length} done today
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {sessionLog.slice(0, 5).map(s => (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 10, background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}>
                    <CheckCircle2 size={14} color="#10b981" />
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text1)', flex: 1 }}>{s.label}</span>
                    <span style={{ fontSize: 11, color: 'var(--text3)' }}>{s.duration} min · {s.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card" style={{ padding: 20, marginTop: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Sparkles size={15} color="#8b5cf6" />
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text1)' }}>AI Guided Meditation</span>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              {['low', 'moderate', 'high'].map(level => (
                <button key={level} onClick={() => setStressLevel(level)}
                  style={{ flex: 1, padding: '7px 4px', borderRadius: 8,
                    border: `1px solid ${stressLevel === level ? 'rgba(139,92,246,0.5)' : 'var(--border)'}`,
                    background: stressLevel === level ? 'rgba(139,92,246,0.15)' : 'var(--glass)',
                    color: stressLevel === level ? '#8b5cf6' : 'var(--text3)', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                  {level === 'low' ? 'Low' : level === 'moderate' ? 'Medium' : 'High'}
                </button>
              ))}
            </div>
            <button onClick={generateMeditation} disabled={meditationLoading}
              className="btn" style={{ background: 'linear-gradient(135deg,#8b5cf6,#3b82f6)', fontSize: 13 }}>
              {meditationLoading
                ? <><div className="spin" style={{ width: 14, height: 14, borderWidth: 2 }} /> Generating...</>
                : <><Sparkles size={14} /> Generate Meditation</>}
            </button>
            {meditating && meditationResult && (
              <div style={{ marginTop: 12 }}>
                <WaveformPlayer audioUrl={meditationResult.audio} isLoading={false} mode="assistant" />
                <p style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.7, marginTop: 10, whiteSpace: 'pre-line' }}>{meditationResult.text}</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Completion Overlay — fixes black screen bug */}
      <AnimatePresence>
        {completed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 9999,
              background: 'rgba(0,0,0,0.92)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2, type: 'spring' }}
              style={{ textAlign: 'center', maxWidth: 360 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <div style={{ width: 72, height: 72, borderRadius: 24, background: sel.color + '20', border: `1px solid ${sel.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle2 size={36} color={sel.color} />
                </div>
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', marginBottom: 8, fontFamily: 'Poppins,system-ui,sans-serif' }}>
                Session Complete!
              </div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginBottom: 24 }}>
                {sel.label} · {activeDuration} minutes
              </div>
              <div style={{ padding: '20px 24px', borderRadius: 16, background: sel.color + '20', border: '1px solid ' + sel.color + '40', marginBottom: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>
                  <Sparkles size={13} color="rgba(255,255,255,0.5)" /> Remember
                </div>
                <div style={{ fontSize: 16, fontStyle: 'italic', color: '#fff', lineHeight: 1.7 }}>
                  "{completionQuote}"
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button onClick={() => { setCompleted(false); reset() }}
                  style={{ padding: '14px 28px', borderRadius: 14, border: 'none', cursor: 'pointer',
                    background: `linear-gradient(135deg,${sel.color},#3b82f6)`, color: '#fff', fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <RotateCcw size={16} /> Start Another Session
                </button>
                <button onClick={() => setCompleted(false)}
                  style={{ padding: '12px 28px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer',
                    background: 'transparent', color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
                  Back to Focus Page
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
