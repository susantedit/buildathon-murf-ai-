import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Brain } from 'lucide-react'
import toast from 'react-hot-toast'
import WaveformPlayer from '../components/WaveformPlayer'
import WorkflowSteps from '../components/WorkflowSteps'
import VoiceMicButton from '../components/VoiceMicButton'
import ShareButton from '../components/ShareButton'
import { PageHeader, Label, SubmitBtn, ResultCard } from '../components/UI'
import { api } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { detectMood } from '../utils/moodDetector'
import { playClickSound, playWhooshSound, playSuccessSound } from '../utils/soundGenerator'

const chips = ["I can't focus", 'Exam stress', 'I feel overwhelmed', 'Help me decide', 'I lack motivation', 'Study plan for tomorrow']

const MOOD_LABELS = { calm: '🧘 Calm tone', motivational: '🔥 Motivational tone', storytelling: '📖 Storytelling tone', serious: '💼 Professional tone' }

const steps = [
  { label: 'Input', icon: '✍️' },
  { label: 'Process', icon: '🤖' },
  { label: 'Voice', icon: '🎙️' },
  { label: 'Ready', icon: '✅' },
]

export default function Assistant() {
  const { userId } = useAuth()
  const location = useLocation()
  const [currentStep, setCurrentStep] = useState(0)
  const [input, setInput] = useState(location.state?.input || '')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [detectedMood, setDetectedMood] = useState(null)

  const handleInput = val => {
    setInput(val)
    if (val.length > 15) {
      const mood = detectMood(val)
      setDetectedMood(mood)
    }
  }

  const go = async () => {
    if (!input.trim()) return toast.error('Describe your problem first')
    playWhooshSound()
    setCurrentStep(1)
    setLoading(true)
    setResult(null)
    try {
      setCurrentStep(2)
      const d = await api.generateAdvice(input, userId)
      setResult(d)
      setCurrentStep(3)
      playSuccessSound()
      toast.success('Advice ready!')
    } catch { toast.error('Something went wrong. Check your API keys.') }
    finally { setLoading(false) }
  }

  const reset = () => {
    playClickSound()
    setCurrentStep(0)
    setResult(null)
    setDetectedMood(null)
  }

  return (
    <div className="page-wrapper" style={{ '--page-accent': '#06b6d4' }}>
      <div className="page-content">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <PageHeader icon={Brain} color="#3b82f6" title="Life Assistant" sub="Voice-guided advice for stress, decisions & daily life" />

          <WorkflowSteps currentStep={currentStep} steps={steps} />

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            {chips.map(c => <button key={c} className="chip" onClick={() => { playClickSound(); handleInput(c) }}>{c}</button>)}
          </div>

          <div className="card" style={{ padding: 24, marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <Label style={{ margin: 0 }}>What is on your mind?</Label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {detectedMood && (
                  <span style={{ fontSize: 11, color: '#8b5cf6', fontWeight: 600 }}>{MOOD_LABELS[detectedMood]}</span>
                )}
                <VoiceMicButton onResult={handleInput} />
              </div>
            </div>
            <textarea value={input} onChange={e => handleInput(e.target.value)}
              placeholder="e.g. I am stressed about my exams and cannot focus... (or tap 🎤 to speak)"
              rows={4} className="inp" style={{ marginBottom: 16 }} />
            <SubmitBtn loading={loading} onClick={go} label="🎤 Get Voice Advice" loadingLabel="Thinking..." />
          </div>

          <WaveformPlayer audioUrl={result?.audio} isLoading={loading} mode="assistant" />

          {result?.text && (
            <>
              <ResultCard icon={<Brain size={14} color="#3b82f6" />} label="AI Advice" text={result.text} />
              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button onClick={reset} className="btn" style={{ background: 'var(--glass)', color: 'var(--text1)', border: '1px solid var(--border)', flex: 1 }}>
                  ← Start Over
                </button>
                <ShareButton text={result.text} audioUrl={result.audio} />
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  )
}
