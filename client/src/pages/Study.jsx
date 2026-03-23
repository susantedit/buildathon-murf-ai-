import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, Lightbulb, RotateCcw, Smile, HelpCircle, CheckCircle2, XCircle, Trophy, Star, Mic, MicOff } from 'lucide-react'
import toast from 'react-hot-toast'
import WaveformPlayer from '../components/WaveformPlayer'
import WorkflowSteps from '../components/WorkflowSteps'
import VoiceMicButton from '../components/VoiceMicButton'
import ShareButton from '../components/ShareButton'
import { PageHeader, Label, SubmitBtn, ResultCard } from '../components/UI'
import QuoteBar from '../components/QuoteBar'
import { api } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { recordSession } from '../utils/stats'
import { playClickSound, playWhooshSound, playSuccessSound } from '../utils/soundGenerator'

const modes = [
  { key: 'normal',   label: 'Explain',  Icon: Lightbulb, desc: 'Clear explanation' },
  { key: 'simple',   label: 'Simplify', Icon: Smile,     desc: "Like I'm 10" },
  { key: 'revision', label: 'Revision', Icon: RotateCcw, desc: 'Bullet points' },
  { key: 'quiz',     label: 'Quiz Me',  Icon: HelpCircle, desc: '10+ questions' },
  { key: 'viva',     label: 'Viva',     Icon: Mic,        desc: 'Oral exam' },
]

const steps = [
  { label: 'Topic', icon: '📝' },
  { label: 'Analyze', icon: '🧠' },
  { label: 'Voice', icon: '🎙️' },
  { label: 'Learn', icon: '✨' },
]

const levelLabels = ['Basic', 'Intermediate', 'Advanced']
const levelColors = ['#10b981', '#f59e0b', '#ef4444']
const levelEmojis = ['🌱', '🔥', '🚀']

function parseQuiz(text) {
  const lines = text.split('\n').filter(l => l.trim())
  const questions = []
  let current = null
  for (const line of lines) {
    const qMatch = line.match(/^(\d+)[.)]\s+(.+)/)
    if (qMatch) {
      if (current) questions.push(current)
      current = { question: qMatch[2], options: [], answer: null }
    } else if (current && /^[a-dA-D][.)]\s+/.test(line.trim())) {
      current.options.push(line.trim())
    } else if (current && /answer[:\s]/i.test(line)) {
      current.answer = line.replace(/answer[:\s]*/i, '').trim()
    }
  }
  if (current) questions.push(current)
  return questions
}

function QuizCard({ questions, topic, level, onNextLevel }) {
  const [answers, setAnswers] = useState({})
  const [revealed, setRevealed] = useState({})
  const [submitted, setSubmitted] = useState(false)

  if (!questions.length) return null

  const answered = Object.keys(answers).length
  const total = questions.length
  const score = questions.reduce((acc, q, i) => {
    if (answers[i] === undefined) return acc
    const opt = q.options[answers[i]] || ''
    const correct = q.answer && opt.toLowerCase().includes(q.answer.toLowerCase().slice(0, 3))
    return acc + (correct ? 1 : 0)
  }, 0)

  const levelColor = levelColors[level] || '#8b5cf6'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 12 }}>
      {/* Level badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 10,
        background: `${levelColor}15`, border: `1px solid ${levelColor}40` }}>
        <span style={{ fontSize: 16 }}>{levelEmojis[level]}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: levelColor }}>Level {level + 1} — {levelLabels[level]}</span>
        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text3)' }}>{answered}/{total} answered</span>
      </div>

      {questions.map((q, i) => (
        <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
          className="card" style={{ padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text1)', marginBottom: 12 }}>
            Q{i + 1}. {q.question}
          </div>
          {q.options.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {q.options.map((opt, j) => {
                const selected = answers[i] === j
                const isCorrect = q.answer && opt.toLowerCase().includes(q.answer.toLowerCase().slice(0, 3))
                return (
                  <button key={j} onClick={() => {
                    if (submitted) return
                    setAnswers(a => ({ ...a, [i]: j }))
                    setRevealed(r => ({ ...r, [i]: true }))
                  }}
                    style={{ padding: '9px 14px', borderRadius: 10,
                      border: `1px solid ${selected ? (isCorrect ? 'rgba(16,185,129,0.5)' : 'rgba(239,68,68,0.5)') : 'var(--border)'}`,
                      background: selected ? (isCorrect ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)') : 'var(--glass)',
                      color: 'var(--text1)', fontSize: 12, textAlign: 'left', cursor: submitted ? 'default' : 'pointer',
                      display: 'flex', alignItems: 'center', gap: 8 }}>
                    {selected && revealed[i] && (isCorrect
                      ? <CheckCircle2 size={14} color="#10b981" />
                      : <XCircle size={14} color="#ef4444" />)}
                    {opt}
                  </button>
                )
              })}
            </div>
          ) : (
            <div>
              {!revealed[i] ? (
                <button onClick={() => setRevealed(r => ({ ...r, [i]: true }))}
                  className="btn" style={{ background: 'var(--glass)', color: 'var(--text2)', border: '1px solid var(--border)', fontSize: 12 }}>
                  Show Answer
                </button>
              ) : (
                <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', fontSize: 13, color: '#10b981' }}>
                  ✅ {q.answer || 'See explanation above'}
                </div>
              )}
            </div>
          )}
        </motion.div>
      ))}

      {/* Score + Next Level */}
      {answered === total && !submitted && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="card" style={{ padding: 20, textAlign: 'center', background: `${levelColor}10`, borderColor: `${levelColor}40` }}>
          <div style={{ fontSize: 28, marginBottom: 6 }}>
            {score >= total * 0.8 ? '🏆' : score >= total * 0.5 ? '👍' : '📚'}
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: levelColor, marginBottom: 4 }}>
            {score}/{total} correct
          </div>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 16 }}>
            {score >= total * 0.8 ? 'Excellent! Ready for the next level.' : score >= total * 0.5 ? 'Good job! Keep going.' : 'Keep practicing!'}
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button onClick={() => setSubmitted(true)} className="btn"
              style={{ background: 'var(--glass)', color: 'var(--text2)', border: '1px solid var(--border)', fontSize: 12 }}>
              Review Answers
            </button>
            {level < 2 && (
              <button onClick={() => onNextLevel(level + 1)} className="btn"
                style={{ background: `linear-gradient(135deg,${levelColor},#8b5cf6)`, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Star size={14} /> Level {level + 2} — {levelLabels[level + 1]}
              </button>
            )}
            {level >= 2 && (
              <div style={{ padding: '8px 16px', borderRadius: 10, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)', fontSize: 13, color: '#10b981', fontWeight: 700 }}>
                🎓 Master level complete!
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  )
}

// ── Viva Practice Mode ────────────────────────────────────────────────────────
function VivaMode({ topic }) {
  const [questions, setQuestions] = useState([])
  const [current, setCurrent] = useState(0)
  const [listening, setListening] = useState(false)
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [loading, setLoading] = useState(false)
  const [scores, setScores] = useState([])
  const [done, setDone] = useState(false)
  const recRef = useRef(null)

  const loadQuestions = async () => {
    setLoading(true)
    try {
      const res = await api.explainTopic(
        `Generate 5 oral exam (viva) questions about "${topic}". Reply ONLY as a JSON array (no markdown): ["question1","question2","question3","question4","question5"]`,
        'normal'
      )
      const arr = JSON.parse(res.text.replace(/```json|```/gi,'').trim().match(/\[[\s\S]*\]/)?.[0] || '[]')
      setQuestions(arr.slice(0,5))
      // Speak first question
      if (arr[0]) setTimeout(() => speak(arr[0]), 500)
    } catch { toast.error('Failed to load questions') }
    finally { setLoading(false) }
  }

  function speak(text) {
    if (!window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.rate = 0.9
    window.speechSynthesis.speak(u)
  }

  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return toast.error('Speech recognition not supported')
    const rec = new SR()
    rec.lang = 'en-US'; rec.interimResults = false
    recRef.current = rec
    setListening(true); setAnswer('')
    rec.start()
    rec.onresult = e => { setAnswer(e.results[0][0].transcript); setListening(false) }
    rec.onerror = () => setListening(false)
    rec.onend = () => setListening(false)
  }

  const evaluate = async () => {
    if (!answer.trim()) return toast.error('Answer first')
    setLoading(true)
    try {
      const res = await api.generateAdvice(
        `You are a strict but fair examiner. The question was: "${questions[current]}". The student answered: "${answer}". 
        Evaluate and reply ONLY in JSON: {"score":7,"verdict":"Good|Excellent|Needs Work","feedback":"...","modelAnswer":"..."}`
      )
      const data = JSON.parse(res.text.replace(/```json|```/gi,'').trim().match(/\{[\s\S]*\}/)?.[0] || '{}')
      setFeedback(data)
      setScores(s => [...s, data.score || 5])
      playSuccessSound()
    } catch { toast.error('Evaluation failed') }
    finally { setLoading(false) }
  }

  const next = () => {
    if (current + 1 >= questions.length) { setDone(true); return }
    setCurrent(c => c + 1); setAnswer(''); setFeedback(null)
    setTimeout(() => speak(questions[current + 1]), 300)
  }

  const avg = scores.length ? Math.round(scores.reduce((a,b) => a+b,0) / scores.length) : 0
  const scoreColor = s => s >= 8 ? '#10b981' : s >= 5 ? '#f59e0b' : '#ef4444'

  if (!topic?.trim()) return (
    <div style={{ textAlign: 'center', padding: 32, color: 'var(--text3)', fontSize: 13 }}>
      Enter a topic above and click "Explain with Voice" first, then switch to Viva mode.
    </div>
  )

  if (questions.length === 0) return (
    <div style={{ textAlign: 'center', padding: 24 }}>
      <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16 }}>
        AI will ask you 5 oral exam questions on <strong style={{ color: '#c084fc' }}>{topic}</strong>.<br/>
        Answer by speaking — AI evaluates your confidence and correctness.
      </div>
      <button onClick={loadQuestions} disabled={loading} className="btn"
        style={{ background: 'linear-gradient(135deg,#c084fc,#8b5cf6)' }}>
        {loading ? '...' : <><Mic size={14} /> Start Viva</>}
      </button>
    </div>
  )

  if (done) return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center', padding: 32 }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>{avg >= 8 ? '🏆' : avg >= 5 ? '👍' : '📚'}</div>
      <div style={{ fontSize: 24, fontWeight: 900, color: scoreColor(avg), fontFamily: 'Syne,system-ui,sans-serif' }}>{avg}/10</div>
      <div style={{ fontSize: 14, color: 'var(--text2)', marginTop: 6, marginBottom: 8 }}>Average Viva Score</div>
      <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 24 }}>
        {avg >= 8 ? 'Excellent! You know this topic well.' : avg >= 5 ? 'Good effort. Review the weak areas.' : 'Keep studying and try again.'}
      </div>
      <button onClick={() => { setQuestions([]); setCurrent(0); setScores([]); setDone(false); setFeedback(null); setAnswer('') }}
        className="btn" style={{ background: 'linear-gradient(135deg,#c084fc,#8b5cf6)' }}>
        <RotateCcw size={14} /> Try Again
      </button>
    </motion.div>
  )

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 12, color: 'var(--text3)' }}>Question {current + 1} of {questions.length}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#c084fc' }}>Avg: {avg || '—'}/10</span>
      </div>
      <div style={{ height: 4, borderRadius: 2, background: 'var(--border)', marginBottom: 20 }}>
        <div style={{ height: '100%', borderRadius: 2, background: 'linear-gradient(90deg,#c084fc,#8b5cf6)', width: `${(current / questions.length) * 100}%`, transition: 'width 0.3s' }} />
      </div>

      <div className="card" style={{ padding: 20, marginBottom: 14, background: 'rgba(192,132,252,0.06)', border: '1px solid rgba(192,132,252,0.2)' }}>
        <div style={{ fontSize: 11, color: '#c084fc', fontWeight: 700, marginBottom: 8 }}>🎓 EXAMINER ASKS</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text1)', lineHeight: 1.6 }}>{questions[current]}</div>
        <button onClick={() => speak(questions[current])} style={{ marginTop: 10, fontSize: 11, padding: '4px 10px', borderRadius: 8, border: '1px solid rgba(192,132,252,0.3)', background: 'rgba(192,132,252,0.1)', color: '#c084fc', cursor: 'pointer' }}>
          🔊 Repeat question
        </button>
      </div>

      {!feedback ? (
        <>
          {answer && (
            <div style={{ padding: '10px 14px', borderRadius: 10, background: 'var(--glass)', border: '1px solid var(--border)', fontSize: 13, color: 'var(--text1)', marginBottom: 12, lineHeight: 1.6 }}>
              🗣️ "{answer}"
            </div>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={startListening} disabled={listening || loading}
              className="btn" style={{ flex: 1, background: listening ? 'linear-gradient(135deg,#ef4444,#dc2626)' : 'linear-gradient(135deg,#c084fc,#8b5cf6)' }}>
              {listening ? (
                <><motion.div animate={{ scale: [1,1.3,1] }} transition={{ repeat: Infinity, duration: 0.6 }}
                  style={{ width: 10, height: 10, borderRadius: '50%', background: '#fff' }} /> Listening...</>
              ) : <><Mic size={14} /> {answer ? 'Re-answer' : 'Speak Answer'}</>}
            </button>
            {answer && (
              <button onClick={evaluate} disabled={loading}
                style={{ padding: '0 16px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                {loading ? '...' : 'Evaluate'}
              </button>
            )}
          </div>
        </>
      ) : (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="card" style={{ padding: 18, marginBottom: 12, background: scoreColor(feedback.score) + '10', borderColor: scoreColor(feedback.score) + '40' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{ fontSize: 32, fontWeight: 900, color: scoreColor(feedback.score), fontFamily: 'Syne,system-ui,sans-serif' }}>{feedback.score}</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: scoreColor(feedback.score) }}>{feedback.verdict}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>out of 10</div>
              </div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 10 }}>{feedback.feedback}</div>
            <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', fontSize: 12, color: 'var(--text2)' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#10b981', marginBottom: 4 }}>MODEL ANSWER</div>
              {feedback.modelAnswer}
            </div>
          </div>
          <button onClick={next} className="btn" style={{ background: 'linear-gradient(135deg,#c084fc,#8b5cf6)' }}>
            {current + 1 >= questions.length ? '🏁 See Final Score' : 'Next Question →'}
          </button>
        </motion.div>
      )}
    </div>
  )
}

export default function Study() {
  const { userId } = useAuth()
  const [topic, setTopic] = useState('')
  const [mode, setMode] = useState('normal')
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [quizQuestions, setQuizQuestions] = useState([])
  const [quizLevel, setQuizLevel] = useState(0)
  const [sessionId] = useState(() => `study-${Date.now()}`)
  const audioRef = useRef(null)

  // Auto-play audio when result arrives
  useEffect(() => {
    if (result?.audio) {
      setTimeout(() => {
        const audio = document.querySelector('audio[data-waveform]')
        if (audio) audio.play().catch(() => {})
      }, 500)
    }
  }, [result?.audio])

  const generateQuiz = async (level = 0, topicOverride) => {
    const t = topicOverride || topic
    if (!t.trim()) return toast.error('Enter a topic first')
    playWhooshSound()
    setCurrentStep(1)
    setLoading(true)
    setResult(null)
    setQuizQuestions([])
    setQuizLevel(level)
    const difficulty = levelLabels[level].toLowerCase()
    try {
      setCurrentStep(2)
      const d = await api.explainTopic(
        `Generate exactly 10 multiple-choice quiz questions about: "${t}" at ${difficulty} difficulty level.
${level === 0 ? 'Use basic, foundational questions suitable for beginners.' : ''}
${level === 1 ? 'Use intermediate questions that require some understanding.' : ''}
${level === 2 ? 'Use advanced, challenging questions that require deep knowledge.' : ''}
Format EACH question exactly like this:
1. Question text here
a) First option
b) Second option
c) Third option
d) Fourth option
Answer: correct option letter or text

Make sure all 10 questions follow this exact format. Keep questions educational and clear.`,
        'normal', userId
      )
      setQuizQuestions(parseQuiz(d.text))
      setResult(d)
      setCurrentStep(3)
      recordSession({ mode: 'study', wordCount: d.text?.split(' ').length || 0 })
      playSuccessSound()
      toast.success(`Level ${level + 1} quiz ready — ${levelLabels[level]}!`)
    } catch { toast.error('Something went wrong. Check your API keys.') }
    finally { setLoading(false) }
  }

  const go = async () => {
    if (!topic.trim()) return toast.error('Enter a topic first')
    if (mode === 'quiz') { generateQuiz(0); return }
    if (mode === 'viva') return // VivaMode handles its own loading
    playWhooshSound()
    setCurrentStep(1)
    setLoading(true)
    setResult(null)
    try {
      setCurrentStep(2)
      const d = await api.explainTopic(topic, mode, userId)
      setResult(d)
      setCurrentStep(3)
      recordSession({ mode: 'study', wordCount: d.text?.split(' ').length || 0 })
      playSuccessSound()
      toast.success('Explanation ready!')
    } catch { toast.error('Something went wrong. Check your API keys.') }
    finally { setLoading(false) }
  }

  const reset = () => {
    playClickSound()
    setCurrentStep(0)
    setResult(null)
    setTopic('')
    setQuizQuestions([])
    setQuizLevel(0)
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handler = e => {
      if (e.ctrlKey && e.key === 'Enter') { e.preventDefault(); go() }
      if (e.key === 'Escape' && result) reset()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [topic, result])

  return (
    <div className="page-wrapper" style={{ '--page-accent': '#7c3aed' }}>
      <div className="page-content">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <PageHeader icon={BookOpen} color="#c084fc" title="Study Mode" sub="Voice explanations for any topic, like a personal teacher" />
          <QuoteBar section="study" color="#c084fc" />

          <WorkflowSteps currentStep={currentStep} steps={steps} />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 16 }}>
            {modes.map(({ key, label, Icon, desc }) => (
              <button key={key} onClick={() => { playClickSound(); setMode(key) }} className="card"
                style={{ padding: '12px 6px', textAlign: 'center', cursor: 'pointer',
                  background: mode === key ? 'rgba(192,132,252,0.15)' : 'var(--glass)',
                  borderColor: mode === key ? 'rgba(192,132,252,0.4)' : 'var(--border)' }}>
                <Icon size={16} color={mode === key ? '#c084fc' : 'var(--text3)'} style={{ margin: '0 auto 4px', display: 'block' }} />
                <div style={{ fontSize: 11, fontWeight: 600, color: mode === key ? '#c084fc' : 'var(--text1)' }}>{label}</div>
                <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>{desc}</div>
              </button>
            ))}
          </div>

          <div className="card" style={{ padding: 24, marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <Label style={{ margin: 0 }}>Topic or concept</Label>
              <VoiceMicButton onResult={setTopic} />
            </div>
            <textarea value={topic} onChange={e => setTopic(e.target.value)}
              placeholder="e.g. Photosynthesis, Newton's laws, World War 2... (or tap 🎤)"
              rows={3} className="inp" style={{ marginBottom: 16 }} />
            <SubmitBtn loading={loading} onClick={go}
              label={mode === 'quiz' ? '🧠 Generate Quiz (10 Questions)' : mode === 'viva' ? '🎓 Start Viva Practice' : '📚 Explain with Voice'}
              loadingLabel={mode === 'quiz' ? 'Generating quiz...' : 'Explaining...'} />
          </div>

          {mode !== 'quiz' && mode !== 'viva' && <WaveformPlayer audioUrl={result?.audio} isLoading={loading} mode="study" />}

          {result?.text && mode !== 'quiz' && mode !== 'viva' && (
            <>
              <ResultCard icon={<BookOpen size={14} color="#c084fc" />} label="Explanation" text={result.text} sessionId={sessionId} />
              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button onClick={reset} className="btn" style={{ background: 'var(--glass)', color: 'var(--text1)', border: '1px solid var(--border)', flex: 1 }}>
                  ← Start Over
                </button>
                <button onClick={async () => {
                  if (!topic.trim()) return
                  setLoading(true)
                  setResult(null)
                  try {
                    const d = await api.explainTopic(
                      `Explain "${topic}" in a completely different way than before. Use a different analogy, different structure, or different perspective. Mode: ${mode}.`,
                      mode, userId
                    )
                    setResult(d)
                    toast.success('New explanation ready!')
                  } catch { toast.error('Something went wrong') }
                  finally { setLoading(false) }
                }} className="btn" style={{ background: 'rgba(192,132,252,0.15)', color: '#c084fc', border: '1px solid rgba(192,132,252,0.4)' }}>
                  🔄 Different angle
                </button>
                <ShareButton text={result.text} />
              </div>
            </>
          )}

          {mode === 'viva' && <VivaMode topic={topic} />}

          {mode === 'quiz' && result && (
            <>
              <WaveformPlayer audioUrl={result?.audio} isLoading={loading} mode="study" />
              <QuizCard
                questions={quizQuestions}
                topic={topic}
                level={quizLevel}
                onNextLevel={(nextLevel) => generateQuiz(nextLevel, topic)}
              />
              {quizQuestions.length === 0 && result.text && (
                <ResultCard icon={<HelpCircle size={14} color="#c084fc" />} label="Quiz" text={result.text} />
              )}
              <button onClick={reset} className="btn" style={{ marginTop: 12, background: 'var(--glass)', color: 'var(--text1)', border: '1px solid var(--border)' }}>
                ← Start Over
              </button>
            </>
          )}
        </motion.div>
      </div>
    </div>
  )
}
