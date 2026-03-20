import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CalendarDays, CheckCircle2, Circle } from 'lucide-react'
import toast from 'react-hot-toast'
import WaveformPlayer from '../components/WaveformPlayer'
import WorkflowSteps from '../components/WorkflowSteps'
import VoiceMicButton from '../components/VoiceMicButton'
import ShareButton from '../components/ShareButton'
import { PageHeader, Label, SubmitBtn } from '../components/UI'
import { api } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { playClickSound, playWhooshSound, playSuccessSound } from '../utils/soundGenerator'

const steps = [
  { label: 'Goal', icon: '🎯' },
  { label: 'Plan', icon: '📋' },
  { label: 'Voice', icon: '🎙️' },
  { label: 'Execute', icon: '🚀' },
]

export default function Planner() {
  const { userId } = useAuth()
  const [goal, setGoal] = useState('')
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [checked, setChecked] = useState({})

  const generate = async () => {
    if (!goal.trim()) return toast.error('Enter your goal first')
    playWhooshSound()
    setCurrentStep(1)
    setLoading(true)
    setResult(null)
    setChecked({})
    try {
      setCurrentStep(2)
      const data = await api.generateAdvice(
        'Create a practical daily plan for: "' + goal +
        '". Format as numbered steps (1. 2. 3.), max 6 steps, each clear and actionable. Under 120 words.',
        userId
      )
      setResult(data)
      setCurrentStep(3)
      playSuccessSound()
      toast.success('Plan ready!')
    } catch { toast.error('Something went wrong. Check your API keys.') }
    finally { setLoading(false) }
  }

  const reset = () => {
    playClickSound()
    setCurrentStep(0)
    setResult(null)
    setGoal('')
    setChecked({})
  }

  const planSteps = result?.text
    ? result.text.split('\n').filter(l => /^\d+\./.test(l.trim())).map(l => l.trim())
    : []

  const toggle = i => { playClickSound(); setChecked(c => ({ ...c, [i]: !c[i] })) }
  const done = Object.values(checked).filter(Boolean).length

  return (
    <div className="page-wrapper" style={{ '--page-accent': '#f59e0b' }}>
      <div className="page-content">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <PageHeader icon={CalendarDays} color="#f59e0b" title="Productivity Planner" sub="Set a goal, get a voice-guided daily plan" />

          <WorkflowSteps currentStep={currentStep} steps={steps} />

          <div className="card" style={{ padding: 24, marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <Label style={{ margin: 0 }}>What is your goal?</Label>
              <VoiceMicButton onResult={setGoal} />
            </div>
            <textarea value={goal} onChange={e => setGoal(e.target.value)}
              placeholder="e.g. Prepare for exam in 3 days, finish project by Friday... (or tap 🎤)"
              rows={3} className="inp" style={{ marginBottom: 16 }} />
            <SubmitBtn loading={loading} onClick={generate} label="🚀 Generate Plan" loadingLabel="Planning..." />
          </div>

          <WaveformPlayer audioUrl={result?.audio} isLoading={loading} mode="planner" />

          <AnimatePresence>
            {planSteps.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="card" style={{ padding: 20, marginTop: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <CalendarDays size={14} color="#f59e0b" />
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text2)' }}>Your Plan</span>
                  </div>
                  <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 999, background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>
                    {done}/{planSteps.length} done
                  </span>
                </div>

                <div style={{ height: 4, borderRadius: 4, background: 'var(--border)', marginBottom: 16 }}>
                  <div style={{ height: '100%', borderRadius: 4, width: planSteps.length ? (done / planSteps.length) * 100 + '%' : '0%', background: 'linear-gradient(to right,#f59e0b,#8b5cf6)', transition: 'width 0.4s' }} />
                </div>

                {planSteps.map((step, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }} onClick={() => toggle(i)}
                    style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12, cursor: 'pointer' }}>
                    {checked[i]
                      ? <CheckCircle2 size={17} color="#10b981" style={{ flexShrink: 0, marginTop: 2 }} />
                      : <Circle size={17} color="var(--text3)" style={{ flexShrink: 0, marginTop: 2 }} />}
                    <span style={{ fontSize: 13, color: checked[i] ? 'var(--text3)' : 'var(--text1)', textDecoration: checked[i] ? 'line-through' : 'none', lineHeight: 1.5 }}>
                      {step}
                    </span>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {result?.text && planSteps.length === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="card" style={{ padding: 20, marginTop: 12 }}>
                <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text1)', whiteSpace: 'pre-line' }}>{result.text}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {result && (
            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
              <button onClick={reset} className="btn" style={{ background: 'var(--glass)', color: 'var(--text1)', border: '1px solid var(--border)', flex: 1 }}>
                ← Start Over
              </button>
              <ShareButton text={result?.text} />
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
