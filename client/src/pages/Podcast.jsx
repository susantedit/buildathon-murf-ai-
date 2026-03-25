import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Radio, Link, FileText, Mic, Sparkles, Send, MessageSquare, Play, Pause, ChevronDown, ChevronUp, Upload, SkipForward } from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { PageHeader } from '../components/UI'
import QuoteBar from '../components/QuoteBar'
import { playClickSound, playSuccessSound } from '../utils/soundGenerator'

const MODES = [
  { key: 'url',    label: 'Web Article', icon: Link,     desc: 'Any article or blog URL' },
  { key: 'youtube',label: 'YouTube',     icon: Radio,    desc: 'YouTube video URL' },
  { key: 'pdf',    label: 'PDF Upload',  icon: Upload,   desc: 'Upload a PDF document' },
  { key: 'text',   label: 'Raw Text',    icon: FileText, desc: 'Paste text or notes' },
  { key: 'prompt', label: 'AI Prompt',   icon: Sparkles, desc: 'Describe a topic' },
]

const STYLES = [
  { key: 'conversational', label: 'Casual',      emoji: null },
  { key: 'educational',    label: 'Educational', emoji: null },
  { key: 'debate',         label: 'Debate',      emoji: null },
  { key: 'interview',      label: 'Interview',   emoji: null },
]

const DEPTHS = [
  { key: 'short',  label: 'Short',  emoji: null, desc: '4-5 exchanges' },
  { key: 'medium', label: 'Medium', emoji: null, desc: '6-8 exchanges' },
  { key: 'deep',   label: 'Deep',   emoji: null, desc: '10-12 exchanges' },
]

const LANGUAGES = [
  'English', 'Nepali', 'Hindi', 'Spanish', 'French', 'German',
  'Japanese', 'Korean', 'Arabic', 'Portuguese', 'Russian', 'Bengali',
]

// Extract text from PDF using FileReader + basic parsing
async function extractPdfText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = e.target.result
        // Basic PDF text extraction — grab readable strings
        const matches = text.match(/\(([^)]{3,})\)/g) || []
        const extracted = matches
          .map(m => m.slice(1, -1).replace(/\\n/g, ' ').replace(/\\/g, ''))
          .filter(s => /[a-zA-Z]/.test(s))
          .join(' ')
          .slice(0, 4000)
        if (extracted.length < 50) {
          // Fallback: just use raw readable chars
          const raw = text.replace(/[^\x20-\x7E\n]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 4000)
          resolve(raw)
        } else {
          resolve(extracted)
        }
      } catch { reject(new Error('Could not parse PDF')) }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsBinaryString(file)
  })
}

// Single audio line with play/pause
function AudioLine({ line, index, isPlaying, onPlay, onEnd }) {
  const audioRef = useRef(null)
  const isHost = line.speaker === 'HOST'

  useEffect(() => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.play().catch(() => {})
    } else {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
  }, [isPlaying])

  return (
    <motion.div
      initial={{ opacity: 0, x: isHost ? -16 : 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
      style={{ display: 'flex', gap: 10, marginBottom: 12, flexDirection: isHost ? 'row' : 'row-reverse' }}
    >
      <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, background: isHost ? 'linear-gradient(135deg,#7c3aed,#3b82f6)' : 'linear-gradient(135deg,#10b981,#059669)', color: '#fff' }}>
        {isHost ? 'H' : 'G'}
      </div>
      <div style={{ maxWidth: '75%' }}>
        <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 4, textAlign: isHost ? 'left' : 'right' }}>
          {isHost ? 'Host · Marcus' : 'Guest · Natalie'}
        </div>
        <div style={{ padding: '10px 14px', borderRadius: isHost ? '4px 14px 14px 14px' : '14px 4px 14px 14px', background: isHost ? 'rgba(124,58,237,0.12)' : 'rgba(16,185,129,0.12)', border: `1px solid ${isHost ? 'rgba(124,58,237,0.25)' : 'rgba(16,185,129,0.25)'}` }}>
          <p style={{ fontSize: 13, color: 'var(--text1)', margin: '0 0 8px', lineHeight: 1.5 }}>{line.text}</p>
          {line.audioUrl && (
            <button onClick={() => onPlay(index)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 20, border: 'none', background: isHost ? 'rgba(124,58,237,0.2)' : 'rgba(16,185,129,0.2)', cursor: 'pointer', fontSize: 11, color: isHost ? '#a78bfa' : '#34d399' }}>
              {isPlaying ? <Pause size={11} /> : <Play size={11} />}
              {isPlaying ? 'Pause' : 'Play'}
            </button>
          )}
        </div>
        {line.audioUrl && <audio ref={audioRef} src={line.audioUrl} onEnded={onEnd} />}
      </div>
    </motion.div>
  )
}

export default function Podcast() {
  const { userId } = useAuth()
  const [inputMode, setInputMode] = useState('prompt')
  const [style, setStyle]         = useState('conversational')
  const [depth, setDepth]         = useState('medium')
  const [language, setLanguage]   = useState('English')
  const [content, setContent]     = useState('')
  const [url, setUrl]             = useState('')
  const [pdfFile, setPdfFile]     = useState(null)
  const [loading, setLoading]     = useState(false)
  const [result, setResult]       = useState(null)
  const [playingIdx, setPlayingIdx] = useState(null)
  const [showChat, setShowChat]   = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [chatHistory, setChatHistory] = useState([])
  const [chatLoading, setChatLoading] = useState(false)
  const [showScript, setShowScript] = useState(false)
  const pdfRef = useRef(null)

  const handlePlay = (idx) => {
    setPlayingIdx(prev => prev === idx ? null : idx)
  }

  const handleLineEnd = (idx) => {
    // Auto-advance to next line
    if (result && idx < result.lines.length - 1) {
      setPlayingIdx(idx + 1)
    } else {
      setPlayingIdx(null)
    }
  }

  const playAll = () => {
    if (!result?.lines?.length) return
    setPlayingIdx(0)
    toast('Playing all lines...')
  }

  const generate = async () => {
    const needsUrl = inputMode === 'url' || inputMode === 'youtube'
    if (needsUrl && !url.trim())         return toast.error('Paste a URL first')
    if (inputMode === 'pdf' && !pdfFile) return toast.error('Upload a PDF first')
    if ((inputMode === 'text' || inputMode === 'prompt') && !content.trim()) return toast.error('Enter content first')

    setLoading(true)
    setResult(null)
    setChatHistory([])
    setPlayingIdx(null)
    playClickSound()

    try {
      let finalContent = content
      if (inputMode === 'pdf') {
        toast('📄 Extracting PDF text...')
        finalContent = await extractPdfText(pdfFile)
        if (!finalContent || finalContent.length < 50) return toast.error('Could not extract text from PDF')
      }

      const data = await api.generatePodcast({
        mode: needsUrl ? inputMode : 'text',
        url: url.trim(),
        content: finalContent,
        style, depth, language, userId,
      })
      setResult(data)
      playSuccessSound()
      toast.success('Podcast ready!')
    } catch (err) {
      toast.error(err.message || 'Generation failed')
    } finally {
      setLoading(false)
    }
  }

  const sendChat = async () => {
    if (!chatInput.trim() || !result) return
    const q = chatInput.trim()
    setChatInput('')
    setChatHistory(h => [...h, { role: 'user', text: q }])
    setChatLoading(true)
    try {
      const data = await api.chatWithPodcast({ question: q, transcript: result.script })
      setChatHistory(h => [...h, { role: 'ai', text: data.answer }])
    } catch {
      setChatHistory(h => [...h, { role: 'ai', text: 'Sorry, could not answer that.' }])
    } finally {
      setChatLoading(false)
    }
  }

  return (
    <div className="page-wrapper" style={{ '--page-accent': '#7c3aed' }}>
      <div className="page-content">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <PageHeader icon={Radio} color="#7c3aed" title="Podcast Studio"
            sub="Turn any content into a 2-speaker AI podcast" />
          <QuoteBar section="podcast" color="#7c3aed" />

          <div className="card" style={{ padding: 20, marginBottom: 12 }}>

            {/* Input mode */}
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Content Source</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 7, marginBottom: 16 }}>
              {MODES.map(m => (
                <button key={m.key} onClick={() => { setInputMode(m.key); playClickSound() }} className="card"
                  style={{ padding: '8px 10px', textAlign: 'center', cursor: 'pointer', background: inputMode === m.key ? 'rgba(124,58,237,0.15)' : 'var(--glass)', borderColor: inputMode === m.key ? 'rgba(124,58,237,0.5)' : 'var(--border)' }}>
                  <m.icon size={14} color={inputMode === m.key ? '#a78bfa' : 'var(--text2)'} style={{ margin: '0 auto 4px' }} />
                  <div style={{ fontSize: 11, fontWeight: 700, color: inputMode === m.key ? '#a78bfa' : 'var(--text1)' }}>{m.label}</div>
                </button>
              ))}
            </div>

            {/* Input field */}
            {(inputMode === 'url' || inputMode === 'youtube') && (
              <input type="url" value={url} onChange={e => setUrl(e.target.value)}
                placeholder={inputMode === 'youtube' ? 'https://youtube.com/watch?v=...' : 'https://example.com/article'}
                className="inp" style={{ marginBottom: 16 }} />
            )}
            {inputMode === 'pdf' && (
              <div style={{ marginBottom: 16 }}>
                <input ref={pdfRef} type="file" accept=".pdf" style={{ display: 'none' }}
                  onChange={e => { setPdfFile(e.target.files?.[0] || null); e.target.value = '' }} />
                <button onClick={() => pdfRef.current?.click()} className="card"
                  style={{ width: '100%', padding: 16, textAlign: 'center', cursor: 'pointer', borderStyle: 'dashed', background: pdfFile ? 'rgba(124,58,237,0.08)' : 'var(--glass)' }}>
                  <Upload size={20} color="#a78bfa" style={{ margin: '0 auto 6px' }} />
                  <div style={{ fontSize: 13, color: pdfFile ? '#a78bfa' : 'var(--text2)', fontWeight: 600 }}>
                    {pdfFile ? pdfFile.name : 'Click to upload PDF'}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>Max 10MB</div>
                </button>
              </div>
            )}
            {(inputMode === 'text' || inputMode === 'prompt') && (
              <textarea value={content} onChange={e => setContent(e.target.value)}
                placeholder={inputMode === 'prompt' ? 'e.g. The future of AI in healthcare for beginners...' : 'Paste your text, notes, or article here...'}
                rows={4} className="inp" style={{ marginBottom: 16 }} />
            )}

            {/* Style + Depth + Language row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Style</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {STYLES.map(s => (
                    <button key={s.key} onClick={() => { setStyle(s.key); playClickSound() }}
                      style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid ${style === s.key ? 'rgba(124,58,237,0.5)' : 'var(--border)'}`, background: style === s.key ? 'rgba(124,58,237,0.15)' : 'var(--glass)', color: style === s.key ? '#a78bfa' : 'var(--text2)', fontSize: 12, fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Depth</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {DEPTHS.map(d => (
                    <button key={d.key} onClick={() => { setDepth(d.key); playClickSound() }}
                      style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid ${depth === d.key ? 'rgba(124,58,237,0.5)' : 'var(--border)'}`, background: depth === d.key ? 'rgba(124,58,237,0.15)' : 'var(--glass)', color: depth === d.key ? '#a78bfa' : 'var(--text2)', fontSize: 12, fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}>
                      {d.label} <span style={{ fontSize: 10, opacity: 0.7 }}>· {d.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Language */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Podcast Language</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {LANGUAGES.map(l => (
                  <button key={l} onClick={() => { setLanguage(l); playClickSound() }}
                    style={{ padding: '5px 12px', borderRadius: 20, border: `1px solid ${language === l ? 'rgba(124,58,237,0.5)' : 'var(--border)'}`, background: language === l ? 'rgba(124,58,237,0.15)' : 'var(--glass)', color: language === l ? '#a78bfa' : 'var(--text2)', fontSize: 12, fontWeight: language === l ? 700 : 400, cursor: 'pointer' }}>
                    {l === 'Nepali' ? <span style={{ fontSize: 10, marginRight: 2 }}>NP</span> : null}{l}
                  </button>
                ))}
              </div>
            </div>

            <button className="btn" onClick={generate} disabled={loading}
              style={{ background: loading ? 'var(--glass)' : 'linear-gradient(135deg,#7c3aed,#3b82f6)', width: '100%' }}>
              {loading
                ? <><span className="spin" />Generating podcast...</>
                : <><Radio size={16} />Generate Podcast</>
              }
            </button>
          </div>

          {/* Results */}
          <AnimatePresence>
            {result && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>

                {/* Controls bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <button onClick={playAll} className="btn"
                    style={{ background: 'linear-gradient(135deg,#7c3aed,#3b82f6)', padding: '8px 18px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                    <Play size={14} /> Play All
                  </button>
                  {playingIdx !== null && (
                    <button onClick={() => setPlayingIdx(null)} className="btn"
                      style={{ background: 'var(--glass)', color: 'var(--text1)', border: '1px solid var(--border)', padding: '8px 14px', fontSize: 13 }}>
                      <Pause size={14} /> Stop
                    </button>
                  )}
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                    {[{ label: 'Host', color: '#7c3aed' }, { label: 'Guest', color: '#10b981' }].map(s => (
                      <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: s.color }}>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: s.color }} />{s.label}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Conversation */}
                <div className="card" style={{ padding: 20, marginBottom: 12 }}>
                  {result.lines.map((line, i) => (
                    <AudioLine key={i} line={line} index={i}
                      isPlaying={playingIdx === i}
                      onPlay={handlePlay}
                      onEnd={() => handleLineEnd(i)}
                    />
                  ))}
                </div>

                {/* Full script toggle */}
                <div className="card" style={{ padding: 16, marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <button onClick={() => setShowScript(s => !s)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text2)', fontSize: 13, fontWeight: 600 }}>
                      <span>Full Script</span>
                      {showScript ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                    <button
                      onClick={() => {
                        const blob = new Blob([result.script], { type: 'text/plain' })
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url; a.download = `podcast-script-${Date.now()}.txt`; a.click()
                        URL.revokeObjectURL(url)
                        toast.success('Script downloaded!')
                      }}
                      style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 8, border: '1px solid rgba(124,58,237,0.3)', background: 'rgba(124,58,237,0.1)', color: '#a78bfa', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                      Download .txt
                    </button>
                  </div>
                  {showScript && (
                    <pre style={{ marginTop: 12, fontSize: 12, color: 'var(--text2)', whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{result.script}</pre>
                  )}
                </div>

                {/* RAG Chat */}
                <div className="card" style={{ padding: 20, marginBottom: 12 }}>
                  <button onClick={() => setShowChat(s => !s)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', background: 'none', border: 'none', cursor: 'pointer', marginBottom: showChat ? 16 : 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <MessageSquare size={15} color="#7c3aed" />
                      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text1)' }}>Chat with this Podcast</span>
                      <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 10, background: 'rgba(124,58,237,0.15)', color: '#a78bfa' }}>RAG</span>
                    </div>
                    {showChat ? <ChevronUp size={14} color="var(--text2)" /> : <ChevronDown size={14} color="var(--text2)" />}
                  </button>

                  {showChat && (
                    <>
                      <div style={{ minHeight: 60, maxHeight: 280, overflowY: 'auto', marginBottom: 12 }}>
                        {chatHistory.length === 0 && (
                          <p style={{ fontSize: 13, color: 'var(--text3)', textAlign: 'center', padding: '16px 0' }}>
                            Ask anything — answers are grounded in the transcript only.
                          </p>
                        )}
                        {chatHistory.map((m, i) => (
                          <div key={i} style={{ marginBottom: 10, display: 'flex', flexDirection: m.role === 'user' ? 'row-reverse' : 'row', gap: 8 }}>
                            <div style={{ maxWidth: '80%', padding: '8px 12px', borderRadius: m.role === 'user' ? '14px 4px 14px 14px' : '4px 14px 14px 14px', background: m.role === 'user' ? 'rgba(124,58,237,0.15)' : 'var(--glass)', border: '1px solid var(--border)', fontSize: 13, color: 'var(--text1)', lineHeight: 1.5 }}>
                              {m.text}
                            </div>
                          </div>
                        ))}
                        {chatLoading && (
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '6px 0' }}>
                            <span className="spin" style={{ width: 13, height: 13 }} />
                            <span style={{ fontSize: 12, color: 'var(--text3)' }}>Thinking...</span>
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input value={chatInput} onChange={e => setChatInput(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && sendChat()}
                          placeholder="Ask about this podcast..."
                          className="inp" style={{ flex: 1, fontSize: 13 }} />
                        <button onClick={sendChat} disabled={chatLoading || !chatInput.trim()}
                          style={{ width: 40, height: 40, borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#7c3aed,#3b82f6)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Send size={15} color="#fff" />
                        </button>
                      </div>
                    </>
                  )}
                </div>

                <button onClick={() => { setResult(null); setContent(''); setUrl(''); setPdfFile(null); setPlayingIdx(null); playClickSound() }}
                  className="btn" style={{ background: 'var(--glass)', color: 'var(--text1)', border: '1px solid var(--border)', width: '100%' }}>
                  ← Create Another Podcast
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {!result && !loading && (
            <div className="card" style={{ padding: 16, background: 'rgba(124,58,237,0.06)', borderColor: 'rgba(124,58,237,0.18)' }}>
              <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.8 }}>
                <strong style={{ color: '#a78bfa' }}>Podcast Studio</strong><br />
                URL, YouTube, PDF, Text, or AI Prompt<br />
                4 styles · 3 depth levels · 12 languages<br />
                Host (Marcus) + Guest (Natalie) voices via Murf<br />
                Play All — auto-advances through all lines<br />
                Chat with transcript using RAG AI
              </div>
            </div>
          )}

        </motion.div>
      </div>
    </div>
  )
}
