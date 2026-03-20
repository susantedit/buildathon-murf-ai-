import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookHeart, Trash2, Mic } from 'lucide-react'
import toast from 'react-hot-toast'
import WaveformPlayer from '../components/WaveformPlayer'
import VoiceMicButton from '../components/VoiceMicButton'
import ShareButton from '../components/ShareButton'
import { PageHeader, SubmitBtn } from '../components/UI'
import QuoteBar from '../components/QuoteBar'
import { api } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { playClickSound, playSuccessSound } from '../utils/soundGenerator'
import { detectMood } from '../utils/moodDetector'

const MOOD_EMOJI = { calm: '🧘', motivational: '🔥', storytelling: '📖', serious: '💼' }

export default function Journal() {
  const { userId } = useAuth()
  const [entry, setEntry] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [entries, setEntries] = useState([])
  const [detectedMood, setDetectedMood] = useState(null)

  useEffect(() => {
    const saved = localStorage.getItem('voice-journal')
    if (saved) setEntries(JSON.parse(saved))
  }, [])

  const handleInput = val => {
    setEntry(val)
    if (val.length > 10) setDetectedMood(detectMood(val))
  }

  const summarize = async () => {
    if (!entry.trim()) return toast.error('Write or speak your journal entry first')
    setLoading(true)
    setResult(null)
    try {
      const d = await api.generateAdvice(
        `This is my journal entry for today: "${entry}". Please summarize it in 2-3 sentences, reflect on the key emotions and themes, and give one encouraging insight. Keep it warm and personal.`,
        userId
      )
      setResult(d)
      playSuccessSound()

      // Save entry
      const newEntry = {
        id: Date.now(),
        text: entry,
        summary: d.text,
        mood: detectedMood || 'calm',
        date: new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
      const updated = [newEntry, ...entries].slice(0, 30)
      setEntries(updated)
      localStorage.setItem('voice-journal', JSON.stringify(updated))
      toast.success('Journal entry saved!')
    } catch { toast.error('Something went wrong') }
    finally { setLoading(false) }
  }

  const deleteEntry = id => {
    playClickSound()
    const updated = entries.filter(e => e.id !== id)
    setEntries(updated)
    localStorage.setItem('voice-journal', JSON.stringify(updated))
    toast('Entry deleted')
  }

  const reset = () => {
    playClickSound()
    setEntry('')
    setResult(null)
    setDetectedMood(null)
  }

  return (
    <div className="page-wrapper" style={{ '--page-accent': '#ec4899' }}>
      <div className="page-content">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <PageHeader icon={BookHeart} color="#ec4899" title="Voice Journal" sub="Speak or write your thoughts — AI summarizes and reflects" />
          <QuoteBar section="journal" color="#ec4899" />

          <div className="card" style={{ padding: 24, marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)' }}>
                Today's entry {detectedMood && <span style={{ color: '#ec4899' }}>{MOOD_EMOJI[detectedMood]}</span>}
              </span>
              <VoiceMicButton onResult={handleInput} />
            </div>
            <textarea value={entry} onChange={e => handleInput(e.target.value)}
              placeholder="How was your day? What's on your mind? Speak or type freely... (tap 🎤 to speak)"
              rows={5} className="inp" style={{ marginBottom: 6 }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
              <span style={{ fontSize: 11, color: entry.length > 800 ? '#ef4444' : 'var(--text3)' }}>
                {entry.trim() ? entry.trim().split(/\s+/).length : 0} words · {entry.length} chars
              </span>
            </div>
            <SubmitBtn loading={loading} onClick={summarize} label="🎙️ Summarize & Reflect" loadingLabel="Reflecting..." />
          </div>

          <WaveformPlayer audioUrl={result?.audio} isLoading={loading} mode="assistant" />

          <AnimatePresence>
            {result?.text && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="card" style={{ padding: 20, marginTop: 12, borderColor: 'rgba(236,72,153,0.3)', background: 'rgba(236,72,153,0.05)' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#ec4899', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Mic size={13} /> AI Reflection
                </div>
                <p style={{ fontSize: 13, color: 'var(--text1)', lineHeight: 1.7, margin: 0 }}>{result.text}</p>
                <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                  <button onClick={reset} className="btn" style={{ background: 'var(--glass)', color: 'var(--text1)', border: '1px solid var(--border)', flex: 1, fontSize: 12 }}>
                    New Entry
                  </button>
                  <ShareButton text={result.text} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Past entries */}
          {entries.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text2)', marginBottom: 12 }}>Past Entries</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {entries.map(e => (
                  <motion.div key={e.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="card" style={{ padding: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 16 }}>{MOOD_EMOJI[e.mood] || '📝'}</span>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text1)' }}>{e.date}</div>
                          <div style={{ fontSize: 10, color: 'var(--text3)' }}>{e.time}</div>
                        </div>
                      </div>
                      <button onClick={() => deleteEntry(e.id)}
                        style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Trash2 size={12} color="#ef4444" />
                      </button>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text3)', margin: '0 0 8px', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {e.text}
                    </p>
                    {e.summary && (
                      <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(236,72,153,0.08)', border: '1px solid rgba(236,72,153,0.2)', fontSize: 12, color: 'var(--text2)', lineHeight: 1.5 }}>
                        💭 {e.summary}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
