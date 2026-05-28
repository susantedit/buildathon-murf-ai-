import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, GitBranch, Mic, Languages, Check, X, Cpu, Clock, BookOpen } from 'lucide-react'
import toast from 'react-hot-toast'
import WaveformPlayer from '../components/WaveformPlayer'
import WorkflowSteps from '../components/WorkflowSteps'
import VoiceMicButton from '../components/VoiceMicButton'
import ShareButton from '../components/ShareButton'
import { PageHeader, Label, SubmitBtn, ResultCard } from '../components/UI'
import QuoteBar from '../components/QuoteBar'
import AiCoreSphere from '../components/AiCoreSphere'
import { api } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { detectMood } from '../utils/moodDetector'
import { recordSession } from '../utils/stats'
import { playClickSound, playWhooshSound, playSuccessSound } from '../utils/soundGenerator'
import { computeCognitiveScore, cognitiveCssClass, cognitiveVoiceLabel } from '../utils/cognitiveEngine'
import { useAdaptiveUI } from '../components/AdaptiveUIContext'

// ── Stop words for topic extraction ──────────────────────────────────────────
const STOP_WORDS = new Set(['that','this','with','from','have','will','been','they','what','when','where','which','your','about','into','more','also','some','than','then','them','these','those','such','each','much','very','just','like','over','only','both','here','there','after','before','other','same','most','many','even','well','back','good','make','take','come','know','time','year','long','down','help','feel','need','want','cant','dont','wont','isnt','arent','wasnt','havent'])

function extractTopics(text) {
  return text.toLowerCase().split(/\s+/).filter(w => w.length >= 4 && !STOP_WORDS.has(w.replace(/[^a-z]/g, ''))).slice(0, 3)
}

function buildMemoryContext(memory) {
  if (!memory.length) return ''
  const moodCounts = {}
  const topicSet = new Set()
  memory.slice(0, 5).forEach(m => {
    if (m.mood) moodCounts[m.mood] = (moodCounts[m.mood] || 0) + 1
    m.topics?.forEach(t => topicSet.add(t))
  })
  const recurringMood = Object.entries(moodCounts).find(([, c]) => c >= 3)?.[0]
  const recurringTopics = [...topicSet].slice(0, 4)
  const parts = []
  if (recurringMood) parts.push(`This user has shown a recurring ${recurringMood} pattern. Tailor your advice accordingly.`)
  if (recurringTopics.length >= 2) parts.push(`Recurring topics: ${recurringTopics.join(', ')}.`)
  return parts.join(' ')
}

const chips = ["I can't focus", 'Exam stress', 'I feel overwhelmed', 'Help me decide', 'I lack motivation', 'Study plan for tomorrow']

const MOOD_LABELS = { calm: 'Calm tone', motivational: 'Motivational tone', storytelling: 'Storytelling tone', serious: 'Professional tone' }

const steps = [
  { label: 'Input' },
  { label: 'Process' },
  { label: 'Voice' },
  { label: 'Ready' },
]

// ── Decision Simulator ────────────────────────────────────────────────────────
function DecisionSimulator() {
  const [optionA, setOptionA] = useState('')
  const [optionB, setOptionB] = useState('')
  const [context, setContext] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const simulate = async () => {
    if (!optionA.trim() || !optionB.trim()) return toast.error('Enter both options')
    setLoading(true); setResult(null)
    try {
      const res = await api.generateAdvice(
        `You are a decision analysis AI. The user must choose between two options.
Option A: "${optionA}"
Option B: "${optionB}"
${context ? `Context: "${context}"` : ''}

Analyze both options and reply ONLY in this exact JSON (no markdown):
{
  "recommendation": "A or B",
  "confidence": "High|Medium|Low",
  "summary": "one sentence why",
  "optionA": { "pros": ["...","...","..."], "cons": ["...","..."], "riskLevel": "Low|Medium|High", "longTermImpact": "..." },
  "optionB": { "pros": ["...","...","..."], "cons": ["...","..."], "riskLevel": "Low|Medium|High", "longTermImpact": "..." }
}`
      )
      const parsed = JSON.parse(res.text.replace(/```json|```/gi, '').trim().match(/\{[\s\S]*\}/)?.[0] || '{}')
      if (!parsed.optionA) throw new Error('bad json')
      setResult(parsed)
      playSuccessSound()
    } catch { toast.error('Analysis failed — try again') }
    finally { setLoading(false) }
  }

  const riskColor = r => r === 'Low' ? '#10b981' : r === 'Medium' ? '#f59e0b' : '#ef4444'

  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <GitBranch size={16} color="#8b5cf6" />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text1)' }}>Decision Simulator</div>
          <div style={{ fontSize: 11, color: 'var(--text3)' }}>AI simulates outcomes for both options</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10, marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#3b82f6', marginBottom: 6 }}>Option A</div>
          <input value={optionA} onChange={e => setOptionA(e.target.value)}
            placeholder="e.g. Take the job offer" className="inp" style={{ fontSize: 13 }} />
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#8b5cf6', marginBottom: 6 }}>Option B</div>
          <input value={optionB} onChange={e => setOptionB(e.target.value)}
            placeholder="e.g. Start my own business" className="inp" style={{ fontSize: 13 }} />
        </div>
      </div>
      <input value={context} onChange={e => setContext(e.target.value)}
        placeholder="Optional: add context (age, goals, situation...)"
        className="inp" style={{ fontSize: 13, marginBottom: 12 }} />
      <button onClick={simulate} disabled={loading} className="btn"
        style={{ background: 'linear-gradient(135deg,#8b5cf6,#3b82f6)', marginBottom: result ? 16 : 0 }}>
        {loading ? (
          <><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
            style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff' }} /> Simulating...</>
        ) : <><GitBranch size={14} /> Simulate Outcomes</>}
      </button>

      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            {/* Recommendation banner */}
            <div style={{ padding: '14px 18px', borderRadius: 12, marginBottom: 14,
              background: result.recommendation === 'A' ? 'rgba(59,130,246,0.12)' : 'rgba(139,92,246,0.12)',
              border: `1px solid ${result.recommendation === 'A' ? 'rgba(59,130,246,0.4)' : 'rgba(139,92,246,0.4)'}` }}>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 4 }}>AI Recommendation · {result.confidence} confidence</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: result.recommendation === 'A' ? '#3b82f6' : '#8b5cf6' }}>
                Go with Option {result.recommendation}: {result.recommendation === 'A' ? optionA : optionB}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 6 }}>{result.summary}</div>
            </div>

            {/* Side by side comparison */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10 }}>
              {[['A', result.optionA, '#3b82f6', optionA], ['B', result.optionB, '#8b5cf6', optionB]].map(([label, data, color, name]) => (
                <div key={label} className="card" style={{ padding: 14, borderColor: result.recommendation === label ? color + '60' : 'var(--border)', background: result.recommendation === label ? color + '08' : 'var(--glass)' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color, marginBottom: 8 }}>
                    Option {label} {result.recommendation === label && <Check size={12} style={{ display: 'inline', verticalAlign: 'middle' }} />}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: riskColor(data.riskLevel), marginBottom: 8 }}>
                    Risk: {data.riskLevel}
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    {data.pros?.map((p, i) => <div key={i} style={{ fontSize: 11, color: '#10b981', marginBottom: 2, display: 'flex', alignItems: 'flex-start', gap: 4 }}><Check size={10} style={{ flexShrink: 0, marginTop: 2 }} /> {p}</div>)}
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    {data.cons?.map((c, i) => <div key={i} style={{ fontSize: 11, color: '#ef4444', marginBottom: 2, display: 'flex', alignItems: 'flex-start', gap: 4 }}><X size={10} style={{ flexShrink: 0, marginTop: 2 }} /> {c}</div>)}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text3)', fontStyle: 'italic', lineHeight: 1.5 }}>
                    Long-term: {data.longTermImpact}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function Assistant() {
  const { userId } = useAuth()
  const { setMode } = useAdaptiveUI()
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
  const [history, setHistory] = useState([])
  const [activeTab, setActiveTab] = useState('advice')
  const [sphereState, setSphereState] = useState('idle')
  const [isAudioPlaying, setIsAudioPlaying] = useState(false)
  const [cogScore, setCogScore] = useState({ score: 60, label: 'Neutral', voiceTone: 'supportive' })
  const [submitCount, setSubmitCount] = useState(0)
  const [sessionStart] = useState(Date.now())
  const [lastResponseTime, setLastResponseTime] = useState(null)
  const cogDebounceRef = useRef(null)

  // Memory: last 10 sessions with mood + topics
  const memory = useRef(JSON.parse(localStorage.getItem('assistant-memory') || '[]'))

  const saveMemory = (q, a, mood) => {
    const topics = extractTopics(q)
    const entry = { q, a: a.slice(0, 200), date: new Date().toISOString(), mood, topics }
    const updated = [entry, ...memory.current].slice(0, 10)
    memory.current = updated
    localStorage.setItem('assistant-memory', JSON.stringify(updated))
  }

  // Update cognitive score with debounce on input change
  const updateCogScore = (val, mood) => {
    clearTimeout(cogDebounceRef.current)
    cogDebounceRef.current = setTimeout(() => {
      const latencyMs = lastResponseTime ? Date.now() - lastResponseTime : 5000
      const elapsedMin = (Date.now() - sessionStart) / 60000
      const interactionRate = elapsedMin > 0 ? submitCount / elapsedMin : 1
      const score = computeCognitiveScore({ latencyMs, interactionRate, mood: mood || detectedMood || '', inputLength: val.length })
      setCogScore(score)
      // Sync adaptive UI mode with cognitive state
      if (score.label === 'Stressed') setMode('debugging')
      else if (score.label === 'Confident') setMode('exploring')
      else if (score.label === 'Focus') setMode('learning')
      else setMode('default')
    }, 300)
  }

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
      updateCogScore(val, mood)
      setSphereState('listening')
    } else {
      setSphereState('idle')
    }
  }

  const go = async () => {
    if (!input.trim()) return toast.error('Describe your problem first')
    playWhooshSound()
    setCurrentStep(1)
    setLoading(true)
    setResult(null)
    setSphereState('processing')
    setSubmitCount(c => c + 1)
    try {
      setCurrentStep(2)
      const memCtx = buildMemoryContext(memory.current)
      const promptWithCtx = memCtx ? `${input}\n\n[${memCtx}]` : input
      const d = await api.generateAdvice(promptWithCtx, userId)
      setResult(d)
      setLastResponseTime(Date.now())
      setCurrentStep(3)
      recordSession({ mode: 'assistant', wordCount: d.text?.split(' ').length || 0 })
      setHistory(h => [...h, { q: input, a: d.text, audio: d.audio }])
      saveMemory(input, d.text, detectedMood)
      playSuccessSound()
      setSphereState('responding')
      if (d.audio) {
        setIsAudioPlaying(true)
        const audio = new Audio(d.audio)
        audio.onended = () => { setIsAudioPlaying(false); setSphereState('idle') }
        audio.play().catch(() => { setIsAudioPlaying(false); setSphereState('idle') })
      } else {
        setTimeout(() => setSphereState('idle'), 3000)
      }
      toast.success('Advice ready!')
    } catch { toast.error('Something went wrong. Check your API keys.'); setSphereState('idle') }
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

          {/* Header with AiCoreSphere */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <AiCoreSphere state={sphereState} size={72} style={{ flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <h1 style={{ fontFamily: "'Space Grotesk',system-ui,sans-serif", fontWeight: 700, fontSize: 22, color: 'var(--text1)', marginBottom: 3 }}>
                Life Assistant
              </h1>
              <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 8 }}>
                Voice-guided advice for stress, decisions &amp; daily life
              </p>
              {/* Cognitive Score Badge */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={cogScore.label}
                  initial={{ opacity: 0, x: -10, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 10, scale: 0.9 }}
                  transition={{ duration: 0.25 }}
                  className={`cog-badge ${cognitiveCssClass(cogScore.label)}`}
                  aria-live="polite"
                  style={{ display: 'inline-flex' }}
                >
                  <Cpu size={10} />
                  {cogScore.label} · {cognitiveVoiceLabel(cogScore.label)}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          <QuoteBar section="assistant" color="#3b82f6" />

          <WorkflowSteps currentStep={currentStep} steps={steps} />

          {/* Tab switcher */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 16, background: 'var(--glass)', borderRadius: 12, padding: 4, border: '1px solid var(--border)' }}>
            {[['advice', <><Brain size={13} style={{ marginRight: 4 }} />Advice</>],['decision', <><GitBranch size={13} style={{ marginRight: 4 }} />Decide</>]].map(([t,l]) => (
              <button key={t} onClick={() => { setActiveTab(t); playClickSound() }}
                style={{ flex: 1, padding: '8px', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                  background: activeTab === t ? 'linear-gradient(135deg,#3b82f6,#06b6d4)' : 'transparent',
                  color: activeTab === t ? '#fff' : 'var(--text2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {l}
              </button>
            ))}
          </div>

          {activeTab === 'decision' && <DecisionSimulator />}

          {activeTab === 'advice' && (<>
          {/* Memory section */}
          {memory.current.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              style={{ marginBottom: 16 }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock size={11} /> Memory · Last {Math.min(memory.current.length, 3)} sessions
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {memory.current.slice(0, 3).map((m, i) => {
                  const moodColor = m.mood === 'motivational' ? '#10b981' : m.mood === 'calm' ? '#ef4444' : '#4F8CFF'
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className="mem-card"
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {m.mood && (
                          <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 999, background: `${moodColor}18`, color: moodColor, border: `1px solid ${moodColor}35`, textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0 }}>
                            {m.mood}
                          </span>
                        )}
                        <span style={{ fontSize: 11, color: 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                          {m.q.slice(0, 50)}{m.q.length > 50 ? '…' : ''}
                        </span>
                        <span style={{ fontSize: 10, color: 'var(--text3)', flexShrink: 0 }}>
                          {new Date(m.date).toLocaleDateString()}
                        </span>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          )}

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
            <SubmitBtn loading={loading} onClick={go} label={<><Mic size={14} style={{ marginRight: 6 }} />Get Voice Advice</>} loadingLabel="Thinking..." />
          </div>

          <WaveformPlayer audioUrl={result?.audio} isLoading={loading} mode="assistant" />

          {result?.text && (
            <>
              <ResultCard icon={<Brain size={14} color="#3b82f6" />} label="AI Advice" text={result.text} sessionId={sessionId} />

              {/* Translate response */}
              <div className="card" style={{ padding: '12px 16px', marginTop: 8, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}><Languages size={13} /> Translate:</span>
                <select value={translatLang} onChange={e => translateResult(e.target.value)}
                  style={{ fontSize: 12, padding: '4px 8px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--glass)', color: 'var(--text1)', cursor: 'pointer' }}>
                  <option value="">Select language...</option>
                  {LANGS.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
                </select>
                {translating && <span style={{ fontSize: 11, color: 'var(--text3)' }}>Translating...</span>}
              </div>
              {translated && (
                <div className="card" style={{ padding: 16, marginTop: 4, background: 'rgba(59,130,246,0.06)', borderColor: 'rgba(59,130,246,0.2)' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#3b82f6', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Languages size={12} /> {LANGS.find(l => l.code === translatLang)?.label} Translation
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
          {activeTab === 'advice' && history.length > 1 && (
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
          </>)}
        </motion.div>
      </div>
    </div>
  )
}
