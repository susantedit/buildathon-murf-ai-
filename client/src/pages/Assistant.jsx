import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Brain } from 'lucide-react'
import toast from 'react-hot-toast'
import WaveformPlayer from '../components/WaveformPlayer'
import WorkflowSteps from '../components/WorkflowSteps'
import VoiceMicButton from '../components/VoiceMicButton'
import ShareButton from '../components/ShareButton'
import { PageHeader, Label, SubmitBtn, ResultCard } from '../components/UI'
import QuoteBar from '../components/QuoteBar'
import { api } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { detectMood } from '../utils/moodDetector'
import { recordSession } from '../utils/stats'
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
  const [sessionId] = useState(() => `assistant-${Date.now()}`)
  const [translated, setTranslated] = useState(null)
  const [translatLang, setTranslateLang] = useState('')
  const [translating, setTranslating] = useState(false)
  const [history, setHistory] = useState([]) // session conversation history

  const LANGS = [
    { code: 'ne', label: 'Nepali' }, { code: 'hi', label: 'Hindi' },
    { code: 'es', label: 'Spanish' }, { code: 'fr', label: 'French' },
    { code: 'de', label: 'German' }, { code: 'ja', label: 'Japanese' },
    { code: 'zh', label: 'Chinese' }, { code: 'ar', label: 'Arabic' },
    { code: 'pt', label: 'Portuguese' }, { code: 'ko', label: 'Korean' },
  ]

  const translateResult = async (lang) => {
    if (!result?.text || !lang) return
    setTranslateLang(lang)
    setTranslating(true)
    try {
      const data = await api.translateText(result.text, lang)
      setTranslated(data.translatedText || data.text || '')
    } catch { toast.error('Translation failed') }
    finally { setTranslating(false) }
  }

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
      recordSession({ mode: 'assistant', wordCount: d.text?.split(' ').length || 0 })
      // Add to session history
      setHistory(h => [...h, { q: input, a: d.text, audio: d.audio }])
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
    setTranslated(null)
    setTranslateLang('')
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handler = e => {
      if (e.ctrlKey && e.key === 'Enter') { e.preventDefault(); go() }
      if (e.key === 'Escape' && result) reset()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [input, result])

  return (
    <div className="page-wrapper" style={{ '--page-accent': '#06b6d4' }}>
      <div className="page-content">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <PageHeader icon={Brain} color="#3b82f6" title="Life Assistant" sub="Voice-guided advice for stress, decisions & daily life" />
          <QuoteBar section="assistant" color="#3b82f6" />

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
              <ResultCard icon={<Brain size={14} color="#3b82f6" />} label="AI Advice" text={result.text} sessionId={sessionId} />

              {/* Translate response */}
              <div className="card" style={{ padding: '12px 16px', marginTop: 8, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 600 }}>🌍 Translate:</span>
                <select value={translatLang} onChange={e => translateResult(e.target.value)}
                  style={{ fontSize: 12, padding: '4px 8px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--glass)', color: 'var(--text1)', cursor: 'pointer' }}>
                  <option value="">Select language...</option>
                  {LANGS.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
                </select>
                {translating && <span style={{ fontSize: 11, color: 'var(--text3)' }}>Translating...</span>}
              </div>
              {translated && (
                <div className="card" style={{ padding: 16, marginTop: 4, background: 'rgba(59,130,246,0.06)', borderColor: 'rgba(59,130,246,0.2)' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#3b82f6', marginBottom: 6 }}>
                    🌍 {LANGS.find(l => l.code === translatLang)?.label} Translation
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text1)', lineHeight: 1.7 }}>{translated}</p>
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button onClick={reset} className="btn" style={{ background: 'var(--glass)', color: 'var(--text1)', border: '1px solid var(--border)', flex: 1 }}>
                  ← Start Over
                </button>
                <ShareButton text={result.text} audioUrl={result.audio} />
              </div>
            </>
          )}

          {/* Session conversation history */}
          {history.length > 1 && (
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text3)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                This session · {history.length} exchanges
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {history.slice(0, -1).map((item, i) => (
                  <div key={i} className="card" style={{ padding: 14, opacity: 0.75 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#3b82f6', marginBottom: 4 }}>Q: {item.q}</div>
                    <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.a}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
