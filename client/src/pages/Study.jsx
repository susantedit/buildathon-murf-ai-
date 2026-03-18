import { useState } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Lightbulb, RotateCcw, Smile } from 'lucide-react'
import toast from 'react-hot-toast'
import WaveformPlayer from '../components/WaveformPlayer'
import WorkflowSteps from '../components/WorkflowSteps'
import { PageHeader, Label, SubmitBtn, ResultCard } from '../components/UI'
import { api } from '../services/api'
import { playClickSound, playWhooshSound, playSuccessSound } from '../utils/soundGenerator'

const modes = [
  { key: 'normal',   label: 'Explain',  Icon: Lightbulb, desc: 'Clear explanation' },
  { key: 'simple',   label: 'Simplify', Icon: Smile,     desc: "Like I'm 10" },
  { key: 'revision', label: 'Revision', Icon: RotateCcw, desc: 'Bullet points' },
]

const steps = [
  { label: 'Topic', icon: '📝' },
  { label: 'Analyze', icon: '🧠' },
  { label: 'Voice', icon: '🎙️' },
  { label: 'Learn', icon: '✨' },
]

export default function Study() {
  const [topic, setTopic] = useState('')
  const [mode, setMode] = useState('normal')
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const go = async () => {
    if (!topic.trim()) return toast.error('Enter a topic first')
    playWhooshSound()
    setCurrentStep(1)
    setLoading(true)
    setResult(null)
    try { 
      setCurrentStep(2)
      const d = await api.explainTopic(topic, mode)
      setResult(d)
      setCurrentStep(3)
      playSuccessSound()
      toast.success('Explanation ready!')
    }
    catch { toast.error('Something went wrong. Check your API keys.') }
    finally { setLoading(false) }
  }

  const reset = () => {
    playClickSound()
    setCurrentStep(0)
    setResult(null)
    setTopic('')
  }

  return (
    <div className="page-wrapper" style={{ '--page-accent': '#7c3aed' }}>
      <div className="page-content">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <PageHeader icon={BookOpen} color="#c084fc" title="Study Mode" sub="Voice explanations for any topic, like a personal teacher" />

          <WorkflowSteps currentStep={currentStep} steps={steps} />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 16 }}>
            {modes.map(({ key, label, Icon, desc }) => (
              <button key={key} onClick={() => { playClickSound(); setMode(key) }} className="card"
                style={{ padding: '14px 8px', textAlign: 'center', cursor: 'pointer', background: mode === key ? 'rgba(192,132,252,0.15)' : 'var(--glass)', borderColor: mode === key ? 'rgba(192,132,252,0.4)' : 'var(--border)' }}>
                <Icon size={18} color={mode === key ? '#c084fc' : 'var(--text3)'} style={{ margin: '0 auto 5px', display: 'block' }} />
                <div style={{ fontSize: 13, fontWeight: 600, color: mode === key ? '#c084fc' : 'var(--text1)' }}>{label}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{desc}</div>
              </button>
            ))}
          </div>

          <div className="card" style={{ padding: 24, marginBottom: 12 }}>
            <Label>Topic or concept</Label>
            <textarea value={topic} onChange={e => setTopic(e.target.value)}
              placeholder="e.g. Photosynthesis, Newton's laws, World War 2..."
              rows={3} className="inp" style={{ marginBottom: 16 }} />
            <SubmitBtn loading={loading} onClick={go} label="📚 Explain with Voice" loadingLabel="Explaining..." />
          </div>

          <WaveformPlayer audioUrl={result?.audio} isLoading={loading} mode="study" />
          {result?.text && <ResultCard icon={<BookOpen size={14} color="#c084fc" />} label="Explanation" text={result.text} />}
          
          {result && (
            <button onClick={reset} className="btn" style={{ marginTop: 12, background: 'var(--glass)', color: 'var(--text1)', border: '1px solid var(--border)' }}>
              ← Start Over
            </button>
          )}
        </motion.div>
      </div>
    </div>
  )
}
