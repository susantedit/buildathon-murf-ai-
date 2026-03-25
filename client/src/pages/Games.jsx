import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Gamepad2, BookOpen, Mic, Zap, Brain, Timer, Star, ChevronRight, RotateCcw, Check, X, Volume2, Trophy, Lightbulb, Wind } from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '../services/api'
import QuoteBar from '../components/QuoteBar'
import { playClickSound, playSuccessSound, playErrorSound } from '../utils/soundGenerator'

// ── helpers ──────────────────────────────────────────────────────────────────
function speak(text) {
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.rate = 0.95
  window.speechSynthesis.speak(u)
}

// ── Word of the Day ───────────────────────────────────────────────────────────
function WordOfDay() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  const fetch = async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await api.generateAdvice(
        'Give me a single interesting English word. Reply ONLY in this exact JSON format (no markdown): {"word":"...","pronunciation":"...","partOfSpeech":"...","definition":"...","example":"...","funFact":"..."}'
      )
      const json = extractJSON(res.text)
      if (!json?.word) throw new Error('bad json')
      setData(json)
    } catch {
      setError(true)
      toast.error('Failed to load word')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetch() }, [])

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: 'var(--text3)' }}>Expand your vocabulary daily</div>
        <button onClick={fetch} disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--glass)', color: 'var(--text2)', fontSize: 12, cursor: 'pointer' }}>
          <RotateCcw size={12} /> New Word
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--text3)' }}>
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: '#8b5cf6', margin: '0 auto 12px' }} />
          Loading word...
        </div>
      ) : data ? (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="card" style={{ padding: 24, marginBottom: 12, background: 'linear-gradient(135deg,rgba(139,92,246,0.08),rgba(59,130,246,0.08))', border: '1px solid rgba(139,92,246,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--text1)', fontFamily: 'Syne,system-ui,sans-serif', letterSpacing: '-0.02em' }}>{data.word}</div>
                <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 2 }}>{data.pronunciation} · <em>{data.partOfSpeech}</em></div>
              </div>
              <button onClick={() => speak(`${data.word}. ${data.definition}. Example: ${data.example}`)}
                style={{ width: 40, height: 40, borderRadius: '50%', border: '1px solid rgba(139,92,246,0.3)', background: 'rgba(139,92,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                <Volume2 size={16} color="#8b5cf6" />
              </button>
            </div>
            <div style={{ fontSize: 14, color: 'var(--text1)', lineHeight: 1.6, marginBottom: 12 }}>{data.definition}</div>
            <div style={{ fontSize: 13, color: 'var(--text2)', fontStyle: 'italic', padding: '10px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', borderLeft: '3px solid #8b5cf6' }}>
              "{data.example}"
            </div>
          </div>
          {data.funFact && (
            <div className="card" style={{ padding: 14, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <Lightbulb size={18} color="#f59e0b" style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>{data.funFact}</div>
            </div>
          )}
        </motion.div>
      ) : (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text2)' }}>
          <BookOpen size={36} color="var(--text3)" style={{ margin: '0 auto 12px' }} />
          <div style={{ fontSize: 14, marginBottom: 16 }}>{error ? 'Could not load word. Make sure the server is running.' : 'No word loaded yet.'}</div>
          <button onClick={fetch} className="btn" style={{ background: 'linear-gradient(135deg,#8b5cf6,#3b82f6)' }}>
            <RotateCcw size={14} /> Try Again
          </button>
        </div>
      )}
    </div>
  )
}

// ── Vocab Quiz (Open Trivia DB — no key needed) ───────────────────────────────
function VocabQuiz() {
  const [topic, setTopic] = useState('')
  const [questions, setQuestions] = useState([])
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState(null)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  // Open Trivia DB categories
  const CATEGORIES = [
    { label: 'General', id: 9 }, { label: 'Science', id: 17 }, { label: 'History', id: 23 },
    { label: 'Geography', id: 22 }, { label: 'Sports', id: 21 }, { label: 'Movies', id: 11 },
    { label: 'Music', id: 12 }, { label: 'Computers', id: 18 },
  ]

  const start = async (catId) => {
    setLoading(true)
    setQuestions([]); setCurrent(0); setScore(0); setDone(false); setSelected(null)
    try {
      const cat = catId || CATEGORIES.find(c => c.label.toLowerCase() === topic.toLowerCase())?.id || 9
      const res = await fetch(`https://opentdb.com/api.php?amount=5&category=${cat}&type=multiple&encode=url3986`)
      const data = await res.json()
      if (data.response_code !== 0) throw new Error('No questions')
      const parsed = data.results.map(q => {
        const correct = decodeURIComponent(q.correct_answer)
        const opts = [...q.incorrect_answers.map(decodeURIComponent), correct].sort(() => Math.random() - 0.5)
        return { q: decodeURIComponent(q.question), options: opts, answer: correct, explanation: `Category: ${decodeURIComponent(q.category)}` }
      })
      setQuestions(parsed)
    } catch {
      // fallback to AI
      try {
        const res = await api.generateAdvice(
          `Create a 5-question multiple choice quiz about "${topic || 'general knowledge'}". Reply ONLY in JSON (no markdown):
[{"q":"question","options":["A","B","C","D"],"answer":"correct option text","explanation":"brief explanation"}]`
        )
        setQuestions(JSON.parse(res.text.replace(/```json|```/g, '').trim()))
      } catch { toast.error('Failed to generate quiz') }
    } finally { setLoading(false) }
  }

  const pick = (opt) => {
    if (selected !== null) return
    setSelected(opt)
    const correct = opt === questions[current].answer
    if (correct) { playSuccessSound(); setScore(s => s + 1) } else { playErrorSound() }
  }

  const next = () => {
    if (current + 1 >= questions.length) { setDone(true) } else { setCurrent(c => c + 1); setSelected(null) }
  }

  if (done) return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center', padding: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>{score >= 4 ? <Trophy size={48} color="#f59e0b" /> : score >= 3 ? <Star size={48} color="#3b82f6" /> : <BookOpen size={48} color="#8b5cf6" />}</div>
      <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--text1)', fontFamily: 'Syne,system-ui,sans-serif' }}>{score}/5</div>
      <div style={{ fontSize: 14, color: 'var(--text2)', marginTop: 6, marginBottom: 24 }}>
        {score === 5 ? 'Perfect score!' : score >= 3 ? 'Good job!' : 'Keep practicing!'}
      </div>
      <button onClick={() => { setQuestions([]); setDone(false); setTopic('') }} className="btn" style={{ background: 'linear-gradient(135deg,#8b5cf6,#3b82f6)' }}>
        <RotateCcw size={14} /> Play Again
      </button>
    </motion.div>
  )

  return (
    <div>
      {questions.length === 0 ? (
        <div>
          <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 16 }}>Real trivia questions — pick a category or type a topic</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            {CATEGORIES.map(c => (
              <button key={c.id} onClick={() => { setTopic(c.label); start(c.id) }}
                className="chip">{c.label}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={topic} onChange={e => setTopic(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && start()}
              placeholder="Or type any topic (AI-generated)..."
              className="inp" style={{ flex: 1, fontSize: 13 }} />
            <button onClick={() => start()} disabled={loading || !topic.trim()}
              style={{ padding: '0 16px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#8b5cf6,#3b82f6)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              {loading ? '...' : 'Go'}
            </button>
          </div>
          {loading && (
            <div style={{ textAlign: 'center', padding: 24, color: 'var(--text3)', fontSize: 13 }}>
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid var(--border)', borderTopColor: '#8b5cf6', margin: '0 auto 8px' }} />
              Loading questions...
            </div>
          )}
        </div>
      ) : (
        <motion.div key={current} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ fontSize: 12, color: 'var(--text3)' }}>Question {current + 1} of {questions.length}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#8b5cf6' }}>Score: {score}</span>
          </div>
          <div style={{ height: 4, borderRadius: 2, background: 'var(--border)', marginBottom: 20 }}>
            <div style={{ height: '100%', borderRadius: 2, background: 'linear-gradient(90deg,#8b5cf6,#3b82f6)', width: `${(current / questions.length) * 100}%`, transition: 'width 0.3s' }} />
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text1)', marginBottom: 20, lineHeight: 1.5 }}
            dangerouslySetInnerHTML={{ __html: questions[current].q }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {questions[current].options.map((opt, i) => {
              const isCorrect = opt === questions[current].answer
              const isSelected = opt === selected
              let bg = 'var(--glass)', border = 'var(--border)', color = 'var(--text1)'
              if (selected !== null) {
                if (isCorrect) { bg = 'rgba(16,185,129,0.15)'; border = '#10b981'; color = '#10b981' }
                else if (isSelected) { bg = 'rgba(239,68,68,0.15)'; border = '#ef4444'; color = '#ef4444' }
              }
              return (
                <button key={i} onClick={() => pick(opt)}
                  style={{ padding: '12px 16px', borderRadius: 10, border: `1px solid ${border}`, background: bg, color, fontSize: 13, textAlign: 'left', cursor: selected ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.2s' }}>
                  <span style={{ width: 22, height: 22, borderRadius: '50%', border: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span dangerouslySetInnerHTML={{ __html: opt }} />
                  {selected !== null && isCorrect && <Check size={14} style={{ marginLeft: 'auto' }} />}
                  {selected !== null && isSelected && !isCorrect && <X size={14} style={{ marginLeft: 'auto' }} />}
                </button>
              )
            })}
          </div>
          {selected !== null && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 8, background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', fontSize: 12, color: 'var(--text2)', lineHeight: 1.6, display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                <Lightbulb size={12} color="#3b82f6" style={{ flexShrink: 0, marginTop: 2 }} /> {questions[current].explanation}
              </div>
              <button onClick={next} className="btn" style={{ marginTop: 12, background: 'linear-gradient(135deg,#8b5cf6,#3b82f6)' }}>
                {current + 1 >= questions.length ? 'See Results' : 'Next'} <ChevronRight size={14} />
              </button>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  )
}

// ── Debate Mode ───────────────────────────────────────────────────────────────
function DebateMode() {
  const [topic, setTopic] = useState('')
  const [side, setSide] = useState('for') // for | against
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [started, setStarted] = useState(false)
  const chatRef = useRef(null)

  useEffect(() => { chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' }) }, [messages])

  const start = async () => {
    if (!topic.trim()) return toast.error('Enter a debate topic')
    setStarted(true)
    setLoading(true)
    try {
      const res = await api.generateAdvice(
        `You are a skilled debater arguing ${side === 'for' ? 'AGAINST' : 'FOR'} the topic: "${topic}". Open the debate with a strong 2-3 sentence argument. Be direct and persuasive.`
      )
      setMessages([{ from: 'ai', text: res.text, side: side === 'for' ? 'against' : 'for' }])
      speak(res.text)
    } catch { toast.error('Failed to start debate') }
    finally { setLoading(false) }
  }

  const send = async () => {
    if (!input.trim() || loading) return
    const text = input.trim()
    setInput('')
    setMessages(m => [...m, { from: 'user', text, side }])
    setLoading(true)
    try {
      const history = messages.map(m => `${m.from === 'ai' ? 'AI' : 'User'}: ${m.text}`).join('\n')
      const res = await api.generateAdvice(
        `Debate topic: "${topic}". You are arguing ${side === 'for' ? 'AGAINST' : 'FOR'} it. The user just said: "${text}". Debate history:\n${history}\n\nRespond with a sharp counter-argument in 2-3 sentences.`
      )
      setMessages(m => [...m, { from: 'ai', text: res.text, side: side === 'for' ? 'against' : 'for' }])
      speak(res.text)
    } catch { toast.error('AI failed to respond') }
    finally { setLoading(false) }
  }

  if (!started) return (
    <div>
      <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 16 }}>Pick a topic, choose your side, and debate the AI</div>
      <input value={topic} onChange={e => setTopic(e.target.value)}
        placeholder="e.g. AI will replace humans, Social media is harmful..."
        className="inp" style={{ marginBottom: 12, fontSize: 14 }} />
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[['for','I argue FOR','#10b981'],['against','I argue AGAINST','#ef4444']].map(([v, l, c]) => (
          <button key={v} onClick={() => setSide(v)}
            style={{ flex: 1, padding: '10px', borderRadius: 10, border: `1px solid ${side === v ? c + '60' : 'var(--border)'}`, background: side === v ? c + '15' : 'var(--glass)', color: side === v ? c : 'var(--text2)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            {l}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        {['AI will replace humans','Social media is harmful','Remote work is better','Homework should be banned'].map(t => (
          <button key={t} className="chip" onClick={() => setTopic(t)}>{t}</button>
        ))}
      </div>
      <button onClick={start} className="btn" style={{ background: 'linear-gradient(135deg,#f59e0b,#ef4444)' }}>
        <Mic size={14} /> Start Debate
      </button>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 420 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexShrink: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', maxWidth: '70%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>"{topic}"</div>
        <button onClick={() => { setStarted(false); setMessages([]); setTopic('') }}
          style={{ fontSize: 11, padding: '4px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--glass)', color: 'var(--text3)', cursor: 'pointer' }}>
          New Topic
        </button>
      </div>
      <div ref={chatRef} style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 8 }}>
        {messages.map((m, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            style={{ display: 'flex', justifyContent: m.from === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{ maxWidth: '82%' }}>
              <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 3, textAlign: m.from === 'user' ? 'right' : 'left' }}>
                {m.from === 'user' ? `You (${m.side})` : `AI (${m.side})`}
              </div>
              <div style={{ padding: '10px 14px', borderRadius: m.from === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                background: m.from === 'user' ? 'linear-gradient(135deg,#8b5cf6,#3b82f6)' : 'var(--glass)',
                border: '1px solid var(--border)', color: 'var(--text1)', fontSize: 13, lineHeight: 1.55 }}>
                {m.text}
              </div>
            </div>
          </motion.div>
        ))}
        {loading && (
          <div style={{ display: 'flex', gap: 4, padding: '10px 14px', borderRadius: 12, background: 'var(--glass)', border: '1px solid var(--border)', width: 60 }}>
            {[0,1,2].map(i => (
              <motion.div key={i} animate={{ y: [0,-4,0] }} transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.15 }}
                style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text3)' }} />
            ))}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 8, paddingTop: 8, borderTop: '1px solid var(--border)', flexShrink: 0 }}>
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Make your argument..."
          className="inp" style={{ flex: 1, fontSize: 13 }} />
        <button onClick={send} disabled={loading}
          style={{ width: 40, height: 40, borderRadius: '50%', border: 'none', background: 'linear-gradient(135deg,#f59e0b,#ef4444)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <ChevronRight size={18} color="#fff" />
        </button>
      </div>
    </div>
  )
}

// ── Speed Reader ──────────────────────────────────────────────────────────────
function SpeedReader() {
  const [text, setText] = useState('')
  const [wpm, setWpm] = useState(250)
  const [words, setWords] = useState([])
  const [idx, setIdx] = useState(0)
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)
  const timerRef = useRef(null)

  const start = () => {
    const w = text.trim().split(/\s+/).filter(Boolean)
    if (w.length < 3) return toast.error('Enter at least a few words')
    setWords(w); setIdx(0); setDone(false); setRunning(true)
  }

  useEffect(() => {
    if (!running) return
    timerRef.current = setInterval(() => {
      setIdx(i => {
        if (i + 1 >= words.length) { clearInterval(timerRef.current); setRunning(false); setDone(true); return i }
        return i + 1
      })
    }, Math.round(60000 / wpm))
    return () => clearInterval(timerRef.current)
  }, [running, wpm, words])

  const stop = () => { clearInterval(timerRef.current); setRunning(false) }
  const reset = () => { stop(); setIdx(0); setDone(false) }

  const SAMPLE = "The quick brown fox jumps over the lazy dog. Speed reading is a skill that can be developed with practice. Focus on the word in the center and let your brain absorb it naturally."

  return (
    <div>
      {!running && !done ? (
        <div>
          <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 16 }}>Flash words one at a time to train your reading speed</div>
          <textarea value={text} onChange={e => setText(e.target.value)}
            placeholder="Paste any text here..."
            rows={4} className="inp" style={{ marginBottom: 12, fontSize: 13 }} />
          <button onClick={() => setText(SAMPLE)} className="chip" style={{ marginBottom: 12 }}>Use sample text</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <span style={{ fontSize: 12, color: 'var(--text2)', flexShrink: 0 }}>Speed: {wpm} WPM</span>
            <input type="range" min={100} max={800} step={50} value={wpm} onChange={e => setWpm(+e.target.value)}
              style={{ flex: 1, accentColor: '#8b5cf6' }} />
          </div>
          <button onClick={start} className="btn" style={{ background: 'linear-gradient(135deg,#10b981,#3b82f6)' }}>
            <Timer size={14} /> Start Reading
          </button>
        </div>
      ) : (
        <div style={{ textAlign: 'center' }}>
          {done ? (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}><Check size={48} color="#10b981" /></div>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text1)', marginBottom: 6 }}>Done!</div>
              <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 24 }}>{words.length} words at {wpm} WPM</div>
              <button onClick={reset} className="btn" style={{ background: 'linear-gradient(135deg,#10b981,#3b82f6)' }}>
                <RotateCcw size={14} /> Read Again
              </button>
            </motion.div>
          ) : (
            <>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 24 }}>{idx + 1} / {words.length} · {wpm} WPM</div>
              <div style={{ height: 4, borderRadius: 2, background: 'var(--border)', marginBottom: 32 }}>
                <div style={{ height: '100%', borderRadius: 2, background: 'linear-gradient(90deg,#10b981,#3b82f6)', width: `${((idx + 1) / words.length) * 100}%`, transition: 'width 0.1s' }} />
              </div>
              <AnimatePresence mode="wait">
                <motion.div key={idx}
                  initial={{ opacity: 0, scale: 0.7, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 1.2, y: -10 }}
                  transition={{ duration: 0.08 }}
                  style={{ fontSize: 'clamp(2rem,6vw,3.5rem)', fontWeight: 900, color: 'var(--text1)', fontFamily: 'Syne,system-ui,sans-serif', minHeight: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {words[idx]}
                </motion.div>
              </AnimatePresence>
              <div style={{ marginTop: 32 }}>
                <button onClick={stop}
                  style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--glass)', color: 'var(--text2)', fontSize: 12, cursor: 'pointer' }}>
                  Stop
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ── Brain Teaser ──────────────────────────────────────────────────────────────
const FALLBACK_RIDDLES = {
  Classic: [
    { riddle: "I speak without a mouth and hear without ears. I have no body, but I come alive with the wind. What am I?", answer: "An echo", difficulty: "Medium", emoji: "🌬️" },
    { riddle: "The more you take, the more you leave behind. What am I?", answer: "Footsteps", difficulty: "Easy", emoji: "👣" },
    { riddle: "I have cities, but no houses live there. Mountains, but no trees. Water, but no fish. What am I?", answer: "A map", difficulty: "Medium", emoji: "🗺️" },
    { riddle: "What has hands but can't clap?", answer: "A clock", difficulty: "Easy", emoji: "🕐" },
    { riddle: "I'm light as a feather, yet even the strongest person can't hold me for more than a few minutes. What am I?", answer: "Breath", difficulty: "Medium", emoji: "💨" },
    { riddle: "What comes once in a minute, twice in a moment, but never in a thousand years?", answer: "The letter M", difficulty: "Hard", emoji: "🔤" },
    { riddle: "I have a head and a tail, but no body. What am I?", answer: "A coin", difficulty: "Easy", emoji: "🪙" },
    { riddle: "The more you have of it, the less you see. What is it?", answer: "Darkness", difficulty: "Easy", emoji: "🌑" },
    { riddle: "I can fly without wings, cry without eyes. Wherever I go, darkness follows me. What am I?", answer: "A cloud", difficulty: "Medium", emoji: "☁️" },
    { riddle: "I have no life, but I can die. What am I?", answer: "A battery", difficulty: "Medium", emoji: "🔋" },
  ],
  Science: [
    { riddle: "I have no mass, no charge, and barely interact with anything — yet I pass through your body by the trillions every second. What am I?", answer: "A neutrino", difficulty: "Hard", emoji: "⚛️" },
    { riddle: "I am the only planet in our solar system that rotates on its side like a rolling ball. What am I?", answer: "Uranus", difficulty: "Medium", emoji: "🪐" },
    { riddle: "Remove my first letter and I become a country. Remove my second and I'm still a country. Remove my third and I'm still a country. What am I?", answer: "Ukraine", difficulty: "Hard", emoji: "🌍" },
    { riddle: "I am the hottest thing in the universe, yet I am invisible. I am created in the heart of every star. What am I?", answer: "Nuclear fusion", difficulty: "Hard", emoji: "🌟" },
    { riddle: "I am the only element that is a liquid metal at room temperature. What am I?", answer: "Mercury", difficulty: "Medium", emoji: "🧪" },
    { riddle: "I travel at 300,000 km per second, yet I can be bent by gravity. What am I?", answer: "Light", difficulty: "Easy", emoji: "💡" },
    { riddle: "I am the smallest unit of life. What am I?", answer: "A cell", difficulty: "Easy", emoji: "🔬" },
  ],
  Logic: [
    { riddle: "A rooster lays an egg on top of a barn roof. Which way does it roll?", answer: "Roosters don't lay eggs", difficulty: "Easy", emoji: "🐓" },
    { riddle: "You are in a dark room with a candle, a wood stove, and a gas lamp. You only have one match. What do you light first?", answer: "The match", difficulty: "Medium", emoji: "🕯️" },
    { riddle: "A man walks into a restaurant and orders albatross soup. He takes one sip, goes home, and kills himself. Why?", answer: "He realized the soup he ate on a deserted island wasn't really albatross — it was his wife", difficulty: "Hard", emoji: "🍲" },
    { riddle: "How many months have 28 days?", answer: "All 12 months", difficulty: "Easy", emoji: "📅" },
    { riddle: "If you have me, you want to share me. If you share me, you no longer have me. What am I?", answer: "A secret", difficulty: "Medium", emoji: "🤫" },
    { riddle: "I am always in front of you but can never be seen. What am I?", answer: "The future", difficulty: "Medium", emoji: "🔮" },
    { riddle: "A man is pushing his car along a road when he comes to a hotel. He shouts 'I'm bankrupt!' Why?", answer: "He is playing Monopoly", difficulty: "Hard", emoji: "🎲" },
  ],
  Math: [
    { riddle: "I am an odd number. Take away one letter and I become even. What number am I?", answer: "Seven (remove the 's')", difficulty: "Medium", emoji: "7️⃣" },
    { riddle: "What 3-digit number, when you multiply its digits together, gives you the same number?", answer: "135 (1×3×5=15... actually: 1×3×5=15, try 111)", difficulty: "Hard", emoji: "🔢" },
    { riddle: "If there are 3 apples and you take away 2, how many apples do you have?", answer: "2 — the ones you took", difficulty: "Easy", emoji: "🍎" },
    { riddle: "A snail is at the bottom of a 10-foot well. Each day it climbs 3 feet, each night it slides back 2 feet. How many days to escape?", answer: "8 days", difficulty: "Hard", emoji: "🐌" },
    { riddle: "What is the next number in the sequence: 1, 1, 2, 3, 5, 8, 13...?", answer: "21 (Fibonacci sequence)", difficulty: "Medium", emoji: "📐" },
  ],
  Wordplay: [
    { riddle: "I am a word of 5 letters. Take away my first letter and I am a country. Take away my first two letters and I am the opposite of my original meaning. What am I?", answer: "Alive → Live → Ive (evil backwards)", difficulty: "Hard", emoji: "📝" },
    { riddle: "What word becomes shorter when you add two letters to it?", answer: "Short", difficulty: "Medium", emoji: "✏️" },
    { riddle: "I start with E, end with E, and contain only one letter. What am I?", answer: "An envelope", difficulty: "Medium", emoji: "✉️" },
    { riddle: "What 8-letter word has one letter in it?", answer: "Envelope", difficulty: "Easy", emoji: "🔡" },
    { riddle: "Forward I am heavy, backward I am not. What am I?", answer: "Ton (not backwards)", difficulty: "Medium", emoji: "⚖️" },
    { riddle: "What word is spelled incorrectly in every dictionary?", answer: "Incorrectly", difficulty: "Easy", emoji: "📖" },
  ],
}
const ALL_RIDDLE_MODES = Object.keys(FALLBACK_RIDDLES)

function extractJSON(text) {
  // Try direct parse first
  try { return JSON.parse(text) } catch {}
  // Strip markdown fences
  const stripped = text.replace(/```json|```/gi, '').trim()
  try { return JSON.parse(stripped) } catch {}
  // Extract first {...} block
  const match = stripped.match(/\{[\s\S]*?\}/)
  if (match) try { return JSON.parse(match[0]) } catch {}
  return null
}

function BrainTeaser() {
  const [riddleMode, setRiddleMode] = useState('Classic')
  const [riddle, setRiddle] = useState(null)
  const [revealed, setRevealed] = useState(false)
  const [hint, setHint] = useState(null)
  const [loading, setLoading] = useState(false)
  const [hintLoading, setHintLoading] = useState(false)
  const [guess, setGuess] = useState('')
  const [result, setResult] = useState(null) // 'correct' | 'wrong' | 'win'
  const [streak, setStreak] = useState(0)
  const [wrongCount, setWrongCount] = useState(0)

  const voiceSay = (text) => {
    if (!window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.rate = 0.92; u.pitch = 1.1
    window.speechSynthesis.speak(u)
  }

  const load = async (mode = riddleMode) => {
    setLoading(true); setRevealed(false); setHint(null); setGuess(''); setResult(null); setWrongCount(0)
    try {
      const res = await api.generateAdvice(
        `Give me a clever ${mode.toLowerCase()} brain teaser or riddle. Make it interesting and surprising. Reply ONLY in this exact JSON format (no markdown, no extra text): {"riddle":"...","answer":"...","difficulty":"Easy|Medium|Hard","emoji":"single emoji"}`
      )
      const parsed = extractJSON(res.text)
      if (parsed?.riddle && parsed?.answer) {
        setRiddle({ ...parsed, emoji: parsed.emoji || '🧩' })
        voiceSay(parsed.riddle)
      } else throw new Error('bad json')
    } catch {
      const pool = FALLBACK_RIDDLES[mode] || FALLBACK_RIDDLES.Classic
      const fb = pool[Math.floor(Math.random() * pool.length)]
      setRiddle(fb)
      voiceSay(fb.riddle)
    } finally { setLoading(false) }
  }

  const getHint = async () => {
    setHintLoading(true)
    try {
      const res = await api.generateAdvice(`Give a subtle one-sentence hint for this riddle without revealing the answer: "${riddle.riddle}"`)
      setHint(res.text)
      voiceSay('Here is your hint: ' + res.text)
    } catch { setHint('Think about it from a different angle...') }
    finally { setHintLoading(false) }
  }

  const checkGuess = () => {
    if (!guess.trim() || !riddle) return
    const g = guess.trim().toLowerCase()
    const a = riddle.answer.toLowerCase()
    const correct = a.includes(g) || g.includes(a.split(' ')[0]) || g.split(' ').some(w => w.length > 3 && a.includes(w))
    if (correct) {
      setResult('win')
      setRevealed(true)
      setStreak(s => s + 1)
      playWinSound()
      voiceSay(streak >= 2
        ? `Incredible! ${streak + 1} in a row! The answer is ${riddle.answer}. You are on fire!`
        : `Brilliant! That is correct! The answer is ${riddle.answer}. Well done!`)
    } else {
      setWrongCount(w => w + 1)
      setResult('wrong')
      playBuzzerSound()
      const taunts = ['Nope, try again!', 'Not quite!', 'Almost... think harder!', 'Wrong! Give it another shot.']
      voiceSay(taunts[Math.floor(Math.random() * taunts.length)])
    }
  }

  const handleReveal = () => {
    setRevealed(true)
    setStreak(0)
    playErrorSound()
    voiceSay(`The answer is... ${riddle.answer}. Better luck next time!`)
  }

  const switchMode = (m) => { setRiddleMode(m); load(m) }

  useEffect(() => { load() }, [])

  const diffColor = { Easy: '#10b981', Medium: '#f59e0b', Hard: '#ef4444' }
  const modeIcons = { Classic: Brain, Science: Zap, Logic: Brain, Math: Star, Wordplay: BookOpen }

  return (
    <div>
      {/* Mode selector */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto', paddingBottom: 2, scrollbarWidth: 'none' }}>
        {ALL_RIDDLE_MODES.map(m => {
          const MIcon = modeIcons[m] || Brain
          return (
          <button key={m} onClick={() => switchMode(m)}
            style={{ flexShrink: 0, padding: '6px 12px', borderRadius: 20, border: `1px solid ${riddleMode === m ? 'rgba(245,158,11,0.5)' : 'var(--border)'}`,
              background: riddleMode === m ? 'rgba(245,158,11,0.15)' : 'var(--glass)',
              color: riddleMode === m ? '#f59e0b' : 'var(--text2)', fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 5 }}>
            <MIcon size={11} /> {m}
          </button>
          )
        })}
      </div>

      {/* Streak */}
      {streak > 0 && (
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 20, background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', marginBottom: 12, width: 'fit-content' }}>
          <Zap size={14} color="#f59e0b" />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b' }}>{streak} streak!</span>
        </motion.div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: 'var(--text3)' }}>Can you solve it?</div>
        <button onClick={() => load()} disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--glass)', color: 'var(--text2)', fontSize: 12, cursor: 'pointer' }}>
          <RotateCcw size={12} /> New Riddle
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--text3)' }}>
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: '#f59e0b', margin: '0 auto 12px' }} />
          Thinking of a riddle...
        </div>
      ) : riddle ? (
        <motion.div key={riddle.riddle} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="card" style={{ padding: 24, marginBottom: 12, background: 'linear-gradient(135deg,rgba(245,158,11,0.08),rgba(239,68,68,0.06))', border: '1px solid rgba(245,158,11,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Lightbulb size={16} color="#f59e0b" />
                </div>
                {riddle.difficulty && (
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20,
                    background: (diffColor[riddle.difficulty] || '#f59e0b') + '20',
                    color: diffColor[riddle.difficulty] || '#f59e0b',
                    border: `1px solid ${(diffColor[riddle.difficulty] || '#f59e0b')}40` }}>
                    {riddle.difficulty}
                  </span>
                )}
                {wrongCount > 0 && (
                  <span style={{ fontSize: 10, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 3 }}>
                    <X size={10} /> ×{wrongCount}
                  </span>
                )}
              </div>
              <button onClick={() => voiceSay(riddle.riddle)}
                style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <Volume2 size={14} color="#f59e0b" />
              </button>
            </div>

            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text1)', lineHeight: 1.7, marginBottom: 20 }}>{riddle.riddle}</div>

            {!revealed ? (
              <>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  <input value={guess} onChange={e => setGuess(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && checkGuess()}
                    placeholder="Your answer..."
                    className="inp" style={{ flex: 1, fontSize: 13 }} />
                  <button onClick={checkGuess}
                    style={{ padding: '0 16px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#f59e0b,#ef4444)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
                    Check
                  </button>
                </div>

                <AnimatePresence>
                  {result === 'wrong' && (
                    <motion.div key="wrong" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                      style={{ fontSize: 12, color: '#ef4444', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <X size={12} /> Not quite — try again!
                      {wrongCount >= 2 && <span style={{ color: 'var(--text3)' }}>({wrongCount} attempts)</span>}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={getHint} disabled={hintLoading}
                    style={{ fontSize: 12, padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.1)', color: '#f59e0b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                    {hintLoading ? '...' : <><Lightbulb size={12} /> Hint</>}
                  </button>
                  <button onClick={handleReveal}
                    style={{ fontSize: 12, padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--glass)', color: 'var(--text3)', cursor: 'pointer' }}>
                    Reveal
                  </button>
                </div>

                {hint && (
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    style={{ marginTop: 12, padding: '10px 14px', borderRadius: 8, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', fontSize: 12, color: 'var(--text2)', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                    <Lightbulb size={12} color="#f59e0b" style={{ flexShrink: 0, marginTop: 2 }} /> {hint}
                  </motion.div>
                )}
              </>
            ) : (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                {result === 'win' ? (
                  <div style={{ padding: '16px 18px', borderRadius: 12, background: 'linear-gradient(135deg,rgba(16,185,129,0.15),rgba(16,185,129,0.08))', border: '1px solid rgba(16,185,129,0.4)', textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}><Trophy size={32} color="#10b981" /></div>
                    <div style={{ fontSize: 13, color: '#10b981', fontWeight: 700, marginBottom: 4 }}>Correct!</div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--text1)' }}>{riddle.answer}</div>
                  </div>
                ) : (
                  <div style={{ padding: '14px 18px', borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
                    <div style={{ fontSize: 11, color: '#ef4444', fontWeight: 700, marginBottom: 4 }}>The Answer Was:</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text1)' }}>{riddle.answer}</div>
                  </div>
                )}
                <button onClick={() => load()} className="btn" style={{ marginTop: 14, background: 'linear-gradient(135deg,#f59e0b,#ef4444)' }}>
                  <RotateCcw size={14} /> Next Riddle
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>
      ) : (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text2)' }}>
          <Lightbulb size={36} color="var(--text3)" style={{ margin: '0 auto 12px' }} />
          <div style={{ fontSize: 14, marginBottom: 16 }}>Click "New Riddle" to get started.</div>
        </div>
      )}
    </div>
  )
}

// ── Mood Check-in ─────────────────────────────────────────────────────────────
function MoodCheckin() {
  const MOODS = [
    { label: 'Great',    color: '#10b981', value: 5, icon: 'smile-big' },
    { label: 'Good',     color: '#3b82f6', value: 4, icon: 'smile' },
    { label: 'Okay',     color: '#f59e0b', value: 3, icon: 'meh' },
    { label: 'Low',      color: '#8b5cf6', value: 2, icon: 'frown' },
    { label: 'Rough',    color: '#ef4444', value: 1, icon: 'frown-big' },
  ]
  const [selected, setSelected] = useState(null)
  const [advice, setAdvice] = useState(null)
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState(() => JSON.parse(localStorage.getItem('mood-history') || '[]'))

  const pick = async (mood) => {
    setSelected(mood); setAdvice(null); setLoading(true)
    const entry = { ...mood, date: new Date().toLocaleDateString(), time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
    const updated = [entry, ...history].slice(0, 14)
    setHistory(updated)
    localStorage.setItem('mood-history', JSON.stringify(updated))
    try {
      const res = await api.generateAdvice(
        `The user is feeling "${mood.label}" today (${mood.value}/5). Give them a warm, personalized 2-sentence message with one practical tip to improve or maintain their mood. Be genuine and brief.`
      )
      setAdvice(res.text)
      speak(res.text)
    } catch {}
    finally { setLoading(false) }
  }

  return (
    <div>
      <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 20 }}>How are you feeling right now?</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 24 }}>
        {MOODS.map(m => (
          <button key={m.value} onClick={() => pick(m)}
            style={{ flex: 1, padding: '14px 4px', borderRadius: 12, border: `2px solid ${selected?.value === m.value ? m.color : 'var(--border)'}`,
              background: selected?.value === m.value ? m.color + '18' : 'var(--glass)', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
              <Star size={22} color={selected?.value === m.value ? m.color : 'var(--text3)'} />
            </div>
            <div style={{ fontSize: 10, fontWeight: 600, color: selected?.value === m.value ? m.color : 'var(--text3)' }}>{m.label}</div>
          </button>
        ))}
      </div>

      <AnimatePresence>
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ textAlign: 'center', padding: 20, color: 'var(--text3)', fontSize: 13 }}>
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid var(--border)', borderTopColor: selected?.color, margin: '0 auto 8px' }} />
            Getting your message...
          </motion.div>
        )}
        {advice && !loading && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            style={{ padding: '16px 18px', borderRadius: 12, background: (selected?.color || '#8b5cf6') + '12', border: `1px solid ${(selected?.color || '#8b5cf6')}30`, marginBottom: 20 }}>
            <div style={{ fontSize: 18, marginBottom: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: (selected?.color || '#8b5cf6') + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                <Star size={18} color={selected?.color || '#8b5cf6'} />
              </div>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text1)', lineHeight: 1.7 }}>{advice}</div>
          </motion.div>
        )}
      </AnimatePresence>

      {history.length > 0 && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', marginBottom: 10 }}>Recent moods</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {history.slice(0, 7).map((h, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 20, background: 'var(--glass)', border: '1px solid var(--border)' }}>
                <Star size={12} color={h.color || '#8b5cf6'} />
                <span style={{ fontSize: 10, color: 'var(--text3)' }}>{h.label} · {h.date}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Pronunciation Coach ───────────────────────────────────────────────────────
function PronunciationCoach() {
  const [word, setWord] = useState('')
  const [listening, setListening] = useState(false)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const recognitionRef = useRef(null)

  const listenAndScore = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      return toast.error('Speech recognition not supported in this browser')
    }
    if (!word.trim()) return toast.error('Enter a word first')
    setResult(null)
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const rec = new SR()
    rec.lang = 'en-US'
    rec.interimResults = false
    rec.maxAlternatives = 3
    recognitionRef.current = rec
    setListening(true)
    rec.start()
    rec.onresult = async (e) => {
      setListening(false)
      const spoken = Array.from(e.results[0]).map(r => r.transcript.trim().toLowerCase())
      const target = word.trim().toLowerCase()
      const exact = spoken[0] === target
      const close = spoken.some(s => s.includes(target) || target.includes(s))
      setLoading(true)
      try {
        const res = await api.generateAdvice(
          `The user tried to pronounce the word "${word}". They said: "${spoken[0]}". 
          Was it correct? Give a score out of 10, one tip to improve pronunciation, and the phonetic spelling. 
          Reply ONLY in JSON: {"score":7,"phonetic":"...","tip":"...","verdict":"Good|Perfect|Try Again"}`
        )
        const data = extractJSON(res.text)
        setResult({ ...data, spoken: spoken[0], exact, close })
        if (data.score >= 8) playSuccessSound(); else playErrorSound()
      } catch {
        setResult({ score: exact ? 10 : close ? 7 : 4, spoken: spoken[0], phonetic: word, tip: exact ? 'Perfect!' : 'Keep practicing!', verdict: exact ? 'Perfect' : close ? 'Good' : 'Try Again' })
      } finally { setLoading(false) }
    }
    rec.onerror = () => { setListening(false); toast.error('Could not hear you — try again') }
    rec.onend = () => setListening(false)
  }

  const scoreColor = (s) => s >= 8 ? '#10b981' : s >= 5 ? '#f59e0b' : '#ef4444'

  return (
    <div>
      <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 16 }}>Say a word and AI scores your pronunciation</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input value={word} onChange={e => setWord(e.target.value)}
          placeholder="Enter a word to practice..."
          className="inp" style={{ flex: 1, fontSize: 14 }} />
        <button onClick={() => speak(word)} disabled={!word.trim()}
          style={{ width: 40, height: 40, borderRadius: 8, border: '1px solid rgba(59,130,246,0.3)', background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
          <Volume2 size={16} color="#3b82f6" />
        </button>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        {['Entrepreneur','Pronunciation','Worcestershire','Squirrel','Specifically','Particularly'].map(w => (
          <button key={w} className="chip" onClick={() => setWord(w)}>{w}</button>
        ))}
      </div>
      <button onClick={listenAndScore} disabled={listening || loading}
        className="btn" style={{ background: listening ? 'linear-gradient(135deg,#ef4444,#dc2626)' : 'linear-gradient(135deg,#8b5cf6,#3b82f6)', marginBottom: 20 }}>
        {listening ? (
          <><motion.div animate={{ scale: [1,1.3,1] }} transition={{ repeat: Infinity, duration: 0.6 }}
            style={{ width: 10, height: 10, borderRadius: '50%', background: '#fff' }} /> Listening...</>
        ) : loading ? (
          <><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
            style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff' }} /> Scoring...</>
        ) : <><Mic size={14} /> Speak Now</>}
      </button>

      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 36, fontWeight: 900, color: scoreColor(result.score), fontFamily: 'Syne,system-ui,sans-serif' }}>{result.score}</div>
                <div style={{ fontSize: 10, color: 'var(--text3)' }}>/ 10</div>
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: scoreColor(result.score), marginBottom: 4 }}>{result.verdict}</div>
                <div style={{ fontSize: 12, color: 'var(--text3)' }}>You said: "<em>{result.spoken}</em>"</div>
                <div style={{ fontSize: 12, color: 'var(--text3)' }}>Phonetic: <strong style={{ color: 'var(--text2)' }}>{result.phonetic}</strong></div>
              </div>
            </div>
            <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', fontSize: 12, color: 'var(--text2)', lineHeight: 1.6, display: 'flex', alignItems: 'flex-start', gap: 6 }}>
              <Lightbulb size={12} color="#8b5cf6" style={{ flexShrink: 0, marginTop: 2 }} /> {result.tip}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Mood Music ────────────────────────────────────────────────────────────────
function MoodMusic({ audioRef, onPlayChange }) {
  const [playing, setPlaying] = useState(audioRef.current.playing)

  const TRACKS = [
    { label: 'Focus',  color: '#3b82f6', desc: 'Deep concentration', freq: [396, 417], type: 'sine', gain: 0.18, Icon: Brain },
    { label: 'Calm',   color: '#10b981', desc: 'Peaceful & relaxed', freq: [528, 264], type: 'sine', gain: 0.15, Icon: Wind },
    { label: 'Energy', color: '#f59e0b', desc: 'Boost motivation', freq: [200, 400, 600], type: 'triangle', gain: 0.18, Icon: Zap },
    { label: 'Sleep',  color: '#8b5cf6', desc: 'Wind down & rest', freq: [174, 285], type: 'sine', gain: 0.14, Icon: Star },
    { label: 'Happy',  color: '#ec4899', desc: 'Uplifting vibes', freq: [261, 329, 392], type: 'sine', gain: 0.18, Icon: Star },
    { label: 'Rain',   color: '#64748b', desc: 'White noise rain', freq: null, type: 'noise', gain: 0.25, Icon: Volume2 },
  ]

  const stopAll = () => {
    audioRef.current.nodes.forEach(n => { try { n.stop() } catch {} })
    audioRef.current.nodes = []
    if (audioRef.current.ctx) { audioRef.current.ctx.close(); audioRef.current.ctx = null }
    audioRef.current.playing = null
    setPlaying(null)
    onPlayChange?.(null)
  }

  const play = (track) => {
    if (audioRef.current.playing === track.label) { stopAll(); return }
    stopAll()
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      audioRef.current.ctx = ctx
      ctx.resume().then(() => {
        const master = ctx.createGain()
        master.gain.setValueAtTime(0, ctx.currentTime)
        master.gain.linearRampToValueAtTime(track.gain, ctx.currentTime + 1.5)
        master.connect(ctx.destination)

        if (track.type === 'noise') {
          const bufSize = ctx.sampleRate * 2
          const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate)
          const data = buf.getChannelData(0)
          for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1
          const src = ctx.createBufferSource()
          src.buffer = buf; src.loop = true
          const filter = ctx.createBiquadFilter()
          filter.type = 'lowpass'; filter.frequency.value = 1200
          src.connect(filter); filter.connect(master)
          src.start()
          audioRef.current.nodes.push(src)
        } else {
          track.freq.forEach((f, i) => {
            const osc = ctx.createOscillator()
            osc.type = track.type
            osc.frequency.value = f
            if (i > 0) osc.detune.value = (i % 2 === 0 ? 3 : -3)
            osc.connect(master)
            osc.start()
            audioRef.current.nodes.push(osc)
          })
        }
        audioRef.current.playing = track.label
        setPlaying(track.label)
        onPlayChange?.(track.label)
      })
    } catch { toast.error('Audio not available') }
  }

  return (
    <div>
      <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 20 }}>Ambient sounds generated for your mood</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
        {TRACKS.map(t => (
          <motion.button key={t.label} whileTap={{ scale: 0.95 }} onClick={() => play(t)}
            style={{ padding: '16px 8px', borderRadius: 12,
              border: `2px solid ${playing === t.label ? t.color : 'rgba(255,255,255,0.15)'}`,
              background: playing === t.label ? t.color + '30' : 'rgba(255,255,255,0.08)',
              cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s',
              boxShadow: playing === t.label ? `0 0 16px ${t.color}40` : 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>
              {playing === t.label ? (
                <motion.div animate={{ scale: [1,1.2,1] }} transition={{ repeat: Infinity, duration: 1 }}>
                  <t.Icon size={22} color={t.color} />
                </motion.div>
              ) : <t.Icon size={22} color="rgba(255,255,255,0.6)" />}
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: playing === t.label ? t.color : 'rgba(255,255,255,0.85)', marginBottom: 2 }}>{t.label}</div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)' }}>{t.desc}</div>
            {playing === t.label && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 2, marginTop: 6 }}>
                {[0,1,2].map(i => (
                  <motion.div key={i} animate={{ height: [4,12,4] }} transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.15 }}
                    style={{ width: 3, borderRadius: 2, background: t.color }} />
                ))}
              </div>
            )}
          </motion.button>
        ))}
      </div>
      {playing && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: 16, textAlign: 'center' }}>
          <button onClick={stopAll}
            style={{ padding: '8px 20px', borderRadius: 20, border: '1px solid var(--border)', background: 'var(--glass)', color: 'var(--text2)', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <X size={12} /> Stop Music
          </button>
        </motion.div>
      )}
    </div>
  )
}

// ── Image to Voice ────────────────────────────────────────────────────────────
function ImageToVoice() {
  const [image, setImage] = useState(null) // base64
  const [preview, setPreview] = useState(null)
  const [description, setDescription] = useState(null)
  const [loading, setLoading] = useState(false)
  const fileRef = useRef(null)

  const onFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return toast.error('Please select an image')
    const reader = new FileReader()
    reader.onload = (ev) => {
      setPreview(ev.target.result)
      setImage(ev.target.result.split(',')[1]) // base64 only
      setDescription(null)
    }
    reader.readAsDataURL(file)
  }

  const describe = async () => {
    if (!image) return
    setLoading(true)
    try {
      const mimeType = fileRef.current?.files?.[0]?.type || 'image/jpeg'
      const res = await api.describeImage(image, mimeType)
      setDescription(res.text)
      speak(res.text)
    } catch { toast.error('Failed to describe image') }
    finally { setLoading(false) }
  }

  return (
    <div>
      <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 16 }}>Upload an image — AI describes it and reads it aloud</div>

      <div onClick={() => fileRef.current?.click()}
        style={{ border: `2px dashed ${preview ? 'rgba(139,92,246,0.4)' : 'var(--border)'}`, borderRadius: 14, padding: preview ? 0 : 40, textAlign: 'center', cursor: 'pointer', marginBottom: 16, overflow: 'hidden', transition: 'border-color 0.2s', background: 'var(--glass)' }}>
        {preview ? (
          <img src={preview} alt="uploaded" style={{ width: '100%', maxHeight: 240, objectFit: 'cover', display: 'block' }} />
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
              <Gamepad2 size={32} color="var(--text3)" />
            </div>
            <div style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 600 }}>Click to upload image</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>JPG, PNG, GIF supported</div>
          </>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" onChange={onFile} style={{ display: 'none' }} />

      {preview && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button onClick={describe} disabled={loading} className="btn" style={{ flex: 1, background: 'linear-gradient(135deg,#8b5cf6,#3b82f6)' }}>
            {loading ? (
              <><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff' }} /> Describing...</>
            ) : <><Brain size={14} /> Describe Image</>}
          </button>
          <button onClick={() => { setPreview(null); setImage(null); setDescription(null) }}
            style={{ padding: '0 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--glass)', color: 'var(--text3)', cursor: 'pointer' }}>
            <X size={14} />
          </button>
        </div>
      )}

      <AnimatePresence>
        {description && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            style={{ padding: '16px 18px', borderRadius: 12, background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#8b5cf6' }}>AI Description</div>
              <button onClick={() => speak(description)}
                style={{ width: 30, height: 30, borderRadius: '50%', border: '1px solid rgba(139,92,246,0.3)', background: 'rgba(139,92,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <Volume2 size={13} color="#8b5cf6" />
              </button>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text1)', lineHeight: 1.7 }}>{description}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Live News Reader ──────────────────────────────────────────────────────────
function NewsReader() {
  const [topic, setTopic] = useState('technology')
  const [news, setNews] = useState(null)
  const [loading, setLoading] = useState(false)

  const fetch = async () => {
    setLoading(true); setNews(null)
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    try {
      const res = await api.generateAdvice(
        `Today is ${today}. You are a professional news anchor. Generate a realistic, current news headline and detailed summary about "${topic}" that reflects events happening around this date.
        Reply ONLY in this exact JSON format (no markdown):
        {"headline":"...","summary":"...","source":"...","sourceUrl":"...","category":"...","date":"${today}","readTime":"45 sec","anchor":"Alex Chen"}`
      )
      const data = extractJSON(res.text)
      if (!data?.headline) throw new Error('bad json')
      setNews(data)
    } catch { toast.error('Failed to fetch news') }
    finally { setLoading(false) }
  }

  const readAloud = () => {
    if (!news) return
    speak(`Breaking news. ${news.headline}. ${news.summary}. Reported by ${news.source}.`)
  }

  const TOPICS = ['Technology', 'Science', 'Nepal', 'AI', 'Space', 'Health', 'Sports', 'Business']

  return (
    <div>
      <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 16 }}>AI generates a news summary — Murf reads it like an anchor</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input value={topic} onChange={e => setTopic(e.target.value)}
          placeholder="Topic (e.g. AI, Nepal, Space...)"
          className="inp" style={{ flex: 1, fontSize: 13 }} />
        <button onClick={fetch} disabled={loading}
          style={{ padding: '0 16px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#ec4899,#8b5cf6)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
          {loading ? '...' : 'Fetch'}
        </button>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        {TOPICS.map(t => <button key={t} className="chip" onClick={() => setTopic(t)}>{t}</button>)}
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: 32, color: 'var(--text3)' }}>
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: '#ec4899', margin: '0 auto 10px' }} />
          Generating news...
        </div>
      )}

      <AnimatePresence>
        {news && !loading && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <div className="card" style={{ padding: 20, background: 'linear-gradient(135deg,rgba(236,72,153,0.06),rgba(139,92,246,0.06))', border: '1px solid rgba(236,72,153,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: 'rgba(236,72,153,0.15)', color: '#ec4899', border: '1px solid rgba(236,72,153,0.3)', textTransform: 'uppercase' }}>
                  {news.category || topic}
                </span>
                <span style={{ fontSize: 10, color: 'var(--text3)' }}>{news.readTime} read</span>
                <span style={{ fontSize: 10, color: 'var(--text3)', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}><Mic size={10} /> {news.anchor}</span>
              </div>
              <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text1)', lineHeight: 1.4, marginBottom: 12, fontFamily: 'Syne,system-ui,sans-serif' }}>
                {news.headline}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.7, marginBottom: 16 }}>{news.summary}</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <span style={{ fontSize: 11, color: 'var(--text3)' }}>Source: {news.source}</span>
                  {news.date && <span style={{ fontSize: 11, color: 'var(--text3)' }}>{news.date}</span>}
                  {news.sourceUrl && (
                    <a href={news.sourceUrl} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: 11, color: '#ec4899', textDecoration: 'none' }}>
                      {news.sourceUrl.replace(/^https?:\/\//, '').split('/')[0]}
                    </a>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={readAloud}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: '1px solid rgba(236,72,153,0.3)', background: 'rgba(236,72,153,0.1)', color: '#ec4899', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    <Volume2 size={13} /> Read Aloud
                  </button>
                  <button onClick={fetch}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--glass)', color: 'var(--text2)', fontSize: 12, cursor: 'pointer' }}>
                    <RotateCcw size={12} /> Next
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Daily Joke (JokeAPI — no key) ─────────────────────────────────────────────
function DailyJoke() {
  const [joke, setJoke] = useState(null)
  const [loading, setLoading] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [category, setCategory] = useState('Any')

  const CATS = ['Any','Programming','Misc','Dark','Pun','Spooky','Christmas']

  const load = async () => {
    setLoading(true); setRevealed(false); setJoke(null)
    try {
      const res = await fetch(`https://v2.jokeapi.dev/joke/${category}?safe-mode&blacklistFlags=nsfw,racist,sexist`)
      const data = await res.json()
      setJoke(data)
    } catch { toast.error('Failed to load joke') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {CATS.map(c => (
          <button key={c} onClick={() => setCategory(c)}
            className="chip" style={{ background: category === c ? 'rgba(236,72,153,0.15)' : undefined, color: category === c ? '#ec4899' : undefined, border: category === c ? '1px solid rgba(236,72,153,0.4)' : undefined }}>
            {c}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text3)' }}>
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: '#ec4899', margin: '0 auto 10px' }} />
          Loading joke...
        </div>
      ) : joke ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="card" style={{ padding: 24, background: 'linear-gradient(135deg,rgba(236,72,153,0.06),rgba(139,92,246,0.06))', border: '1px solid rgba(236,72,153,0.2)', marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#ec4899', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Star size={12} color="#ec4899" /> {joke.category}
            </div>
            {joke.type === 'single' ? (
              <div style={{ fontSize: 15, color: 'var(--text1)', lineHeight: 1.7 }}>{joke.joke}</div>
            ) : (
              <>
                <div style={{ fontSize: 15, color: 'var(--text1)', lineHeight: 1.7, marginBottom: 16 }}>{joke.setup}</div>
                {!revealed ? (
                  <button onClick={() => { setRevealed(true); playSuccessSound() }}
                    style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid rgba(236,72,153,0.4)', background: 'rgba(236,72,153,0.1)', color: '#ec4899', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Star size={14} /> Reveal Punchline
                  </button>
                ) : (
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(236,72,153,0.12)', border: '1px solid rgba(236,72,153,0.3)', fontSize: 15, fontWeight: 700, color: '#ec4899' }}>
                    {joke.delivery}
                  </motion.div>
                )}
              </>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={load} className="btn" style={{ background: 'linear-gradient(135deg,#ec4899,#8b5cf6)' }}>
              <RotateCcw size={14} /> Next Joke
            </button>
            <button onClick={() => { if (joke.type === 'single') speak(joke.joke); else speak(`${joke.setup} ... ${joke.delivery}`) }}
              style={{ padding: '0 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--glass)', color: 'var(--text2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
              <Volume2 size={13} /> Read
            </button>
          </div>
        </motion.div>
      ) : (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text2)' }}>
          <Star size={36} color="var(--text3)" style={{ margin: '0 auto 12px' }} />
          <div style={{ fontSize: 14, marginBottom: 16 }}>Could not load joke. Check your connection.</div>
          <button onClick={load} className="btn" style={{ background: 'linear-gradient(135deg,#ec4899,#8b5cf6)' }}>
            <RotateCcw size={14} /> Try Again
          </button>
        </div>
      )}
    </div>
  )
}

// ── Pokémon Trivia (PokeAPI — no key) ─────────────────────────────────────────
function PokemonTrivia() {
  const [pokemon, setPokemon] = useState(null)
  const [loading, setLoading] = useState(false)
  const [guesses, setGuesses] = useState([])
  const [input, setInput] = useState('')
  const [revealed, setRevealed] = useState(false)
  const [score, setScore] = useState(0)
  const [round, setRound] = useState(0)

  const TYPE_COLORS = {
    fire:'#ef4444',water:'#3b82f6',grass:'#10b981',electric:'#f59e0b',
    psychic:'#ec4899',ice:'#06b6d4',dragon:'#8b5cf6',dark:'#374151',
    normal:'#9ca3af',fighting:'#f97316',flying:'#a78bfa',poison:'#a855f7',
    ground:'#d97706',rock:'#78716c',bug:'#84cc16',ghost:'#6d28d9',
    steel:'#6b7280',fairy:'#f9a8d4',
  }

  const load = async () => {
    setLoading(true); setRevealed(false); setGuesses([]); setInput('')
    try {
      const id = Math.floor(Math.random() * 151) + 1 // Gen 1 only
      const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`)
      const data = await res.json()
      setPokemon({
        id, name: data.name,
        sprite: data.sprites.front_default,
        types: data.types.map(t => t.type.name),
        height: data.height / 10,
        weight: data.weight / 10,
        hp: data.stats[0].base_stat,
        attack: data.stats[1].base_stat,
      })
    } catch { toast.error('Failed to load Pokémon') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const guess = () => {
    if (!input.trim() || !pokemon) return
    const g = input.trim().toLowerCase()
    setInput('')
    if (g === pokemon.name.toLowerCase()) {
      setRevealed(true); setScore(s => s + 1); setRound(r => r + 1)
      playSuccessSound()
      toast.success('Correct!')
    } else {
      setGuesses(prev => [...prev, g])
      playErrorSound()
    }
  }

  const skip = () => { setRevealed(true); setRound(r => r + 1) }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: 'var(--text3)' }}>Guess the Pokémon from its silhouette!</div>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b' }}>Score: {score}/{round}</div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: '#f59e0b', margin: '0 auto' }} />
        </div>
      ) : pokemon ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* Silhouette or revealed sprite */}
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <img src={pokemon.sprite} alt={revealed ? pokemon.name : '???'}
                style={{ width: 120, height: 120, imageRendering: 'pixelated',
                  filter: revealed ? 'none' : 'brightness(0)',
                  transition: 'filter 0.5s' }} />
            </div>
            <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--text1)', marginTop: 8, fontFamily: 'Syne,system-ui,sans-serif', textTransform: 'capitalize' }}>
              {revealed ? pokemon.name : '???'}
            </div>
            {revealed && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 6 }}>
                {pokemon.types.map(t => (
                  <span key={t} style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: (TYPE_COLORS[t] || '#8b5cf6') + '25', color: TYPE_COLORS[t] || '#8b5cf6', border: `1px solid ${(TYPE_COLORS[t] || '#8b5cf6')}40`, textTransform: 'capitalize' }}>{t}</span>
                ))}
              </div>
            )}
          </div>

          {/* Hints */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
            {[
              { label: 'Type', value: revealed ? pokemon.types.join(', ') : '?', hint: true },
              { label: 'HP', value: pokemon.hp, hint: false },
              { label: 'Height', value: `${pokemon.height}m`, hint: false },
              { label: 'Attack', value: pokemon.attack, hint: false },
            ].map(({ label, value, hint }) => (
              <div key={label} style={{ padding: '10px 12px', borderRadius: 8, background: 'var(--glass)', border: '1px solid var(--border)', textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 3 }}>{label}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text1)', textTransform: 'capitalize' }}>{hint && !revealed ? '?' : value}</div>
              </div>
            ))}
          </div>

          {!revealed ? (
            <>
              {guesses.length > 0 && (
                <div style={{ marginBottom: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {guesses.map((g, i) => (
                    <span key={i} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 20, background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', textTransform: 'capitalize', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <X size={10} /> {g}
                    </span>
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && guess()}
                  placeholder="Pokémon name..."
                  className="inp" style={{ flex: 1, fontSize: 13 }} />
                <button onClick={guess}
                  style={{ padding: '0 14px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#f59e0b,#ef4444)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  Guess
                </button>
                <button onClick={skip}
                  style={{ padding: '0 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--glass)', color: 'var(--text3)', fontSize: 12, cursor: 'pointer' }}>
                  Skip
                </button>
              </div>
            </>
          ) : (
            <button onClick={load} className="btn" style={{ background: 'linear-gradient(135deg,#f59e0b,#ef4444)' }}>
              <RotateCcw size={14} /> Next Pokémon
            </button>
          )}
        </motion.div>
      ) : (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text2)' }}>
          <Trophy size={36} color="var(--text3)" style={{ margin: '0 auto 12px' }} />
          <div style={{ fontSize: 14, marginBottom: 16 }}>Could not load Pokémon. Check your connection.</div>
          <button onClick={load} className="btn" style={{ background: 'linear-gradient(135deg,#f59e0b,#ef4444)' }}>
            <RotateCcw size={14} /> Try Again
          </button>
        </div>
      )}
    </div>
  )
}

// ── TABS array and main export ──────────────────────────────────────────────
const TABS = [
  { id: 'word',    label: 'Word',      icon: BookOpen,  component: WordOfDay },
  { id: 'quiz',    label: 'Quiz',      icon: Brain,     component: VocabQuiz },
  { id: 'debate',  label: 'Debate',    icon: Zap,       component: DebateMode },
  { id: 'speed',   label: 'Speed',     icon: Timer,     component: SpeedReader },
  { id: 'riddle',  label: 'Riddle',    icon: Lightbulb, component: BrainTeaser },
  { id: 'mood',    label: 'Mood',      icon: Star,      component: MoodCheckin },
  { id: 'pronun',  label: 'Pronounce', icon: Mic,       component: PronunciationCoach },
  { id: 'music',   label: 'Music',     icon: Volume2,   component: MoodMusic },
  { id: 'image',   label: 'Image',     icon: Gamepad2,  component: ImageToVoice },
  { id: 'news',    label: 'News',      icon: ChevronRight, component: NewsReader },
  { id: 'joke',    label: 'Jokes',     icon: Star,      component: DailyJoke },
  { id: 'pokemon', label: 'Pokémon',   icon: Trophy,    component: PokemonTrivia },
]

export default function Games() {
  const [tab, setTab] = useState('word')
  const audioRef = useRef({ ctx: null, nodes: [], playing: null })
  const [nowPlaying, setNowPlaying] = useState(null)

  // Sync nowPlaying from audioRef for the persistent bar
  const handleAudioChange = (label) => setNowPlaying(label)

  const stopGlobalAudio = () => {
    audioRef.current.nodes.forEach(n => { try { n.stop() } catch {} })
    audioRef.current.nodes = []
    if (audioRef.current.ctx) { audioRef.current.ctx.close(); audioRef.current.ctx = null }
    audioRef.current.playing = null
    setNowPlaying(null)
  }

  const Active = TABS.find(t => t.id === tab)?.component || WordOfDay
  const activeProps = tab === 'music' ? { audioRef, onPlayChange: handleAudioChange } : {}

  return (
    <div className="page-wrapper" style={{ '--page-accent': '#8b5cf6' }}>
      <div className="page-content" style={{ paddingTop: 80 }}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Gamepad2 size={22} color="#8b5cf6" />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text1)', fontFamily: 'Syne,system-ui,sans-serif' }}>Brain Games</div>
              <div style={{ fontSize: 12, color: 'var(--text3)' }}>Learn, play, and grow with AI</div>
            </div>
          </div>

          <QuoteBar section="study" color="#8b5cf6" />

          {/* Tabs — wrap on desktop, scroll on mobile */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
            {TABS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => { setTab(id); playClickSound() }}
                style={{ padding: '8px 14px', borderRadius: 20, cursor: 'pointer', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
                  background: tab === id ? 'linear-gradient(135deg,#8b5cf6,#3b82f6)' : 'rgba(255,255,255,0.1)',
                  color: tab === id ? '#fff' : 'rgba(255,255,255,0.75)',
                  border: tab === id ? '1px solid transparent' : '1px solid rgba(255,255,255,0.2)',
                  display: 'flex', alignItems: 'center', gap: 5 }}>
                <Icon size={12} />{label}
              </button>
            ))}
          </div>

          {/* Active tab content */}
          <div className="card" style={{ padding: 20 }}>
            <AnimatePresence mode="wait">
              <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <Active {...activeProps} />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Persistent now-playing bar */}
          <AnimatePresence>
            {nowPlaying && tab !== 'music' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 16px', borderRadius: 12, background: 'rgba(139,92,246,0.15)',
                  border: '1px solid rgba(139,92,246,0.3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ display: 'flex', gap: 2 }}>
                    {[0,1,2].map(i => (
                      <motion.div key={i} animate={{ height: [4,10,4] }} transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.15 }}
                        style={{ width: 3, borderRadius: 2, background: '#8b5cf6' }} />
                    ))}
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--text2)' }}>Now playing: <strong style={{ color: '#a78bfa' }}>{nowPlaying}</strong></span>
                </div>
                <button onClick={stopGlobalAudio}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 8,
                    border: '1px solid rgba(139,92,246,0.3)', background: 'transparent', color: 'var(--text3)', fontSize: 11, cursor: 'pointer' }}>
                  <X size={11} /> Stop
                </button>
              </motion.div>
            )}
          </AnimatePresence>

        </motion.div>
      </div>
    </div>
  )
}
