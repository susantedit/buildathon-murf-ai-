import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, Sparkles, Zap, Video, Flame, Smile, BookOpen, Briefcase } from 'lucide-react'
import toast from 'react-hot-toast'
import WaveformPlayer from '../components/WaveformPlayer'
import WorkflowSteps from '../components/WorkflowSteps'
import VoiceHistorySidebar from '../components/VoiceHistorySidebar'
import VoiceMicButton from '../components/VoiceMicButton'
import ShareButton from '../components/ShareButton'
import { PageHeader, Label, SubmitBtn, ResultCard } from '../components/UI'
import QuoteBar from '../components/QuoteBar'
import { api } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { detectMood } from '../utils/moodDetector'
import { saveToHistory } from '../utils/voiceHistory'
import { recordSession } from '../utils/stats'
import { playWhooshSound, playSuccessSound, playClickSound } from '../utils/soundGenerator'

const tones = [
  { key: 'motivational', label: 'Motivational', Icon: Flame,    desc: 'High energy, inspiring',  color: '#ef4444' },
  { key: 'calm',         label: 'Calm',         Icon: Smile,    desc: 'Soothing, peaceful',       color: '#10b981' },
  { key: 'storytelling', label: 'Storytelling', Icon: BookOpen, desc: 'Narrative, engaging',      color: '#8b5cf6' },
  { key: 'serious',      label: 'Professional', Icon: Briefcase,desc: 'Formal, authoritative',    color: '#3b82f6' },
]

const steps = [
  { label: 'Write' },
  { label: 'Voice' },
  { label: 'Preview' },
  { label: 'Export' },
]

export default function Creator() {
  const { userId } = useAuth()
  const [currentStep, setCurrentStep] = useState(0)
  const [input, setInput] = useState('')
  const [tone, setTone] = useState('motivational')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [generationTime, setGenerationTime] = useState(null)
  const [autoDetected, setAutoDetected] = useState(false)
  const [enhanceScript, setEnhanceScript] = useState(true)
  const [activeTab, setActiveTab] = useState('script') // script | hooks
  const [hooks, setHooks] = useState(null)
  const [hooksLoading, setHooksLoading] = useState(false)

  // Auto-detect mood when user types
  useEffect(() => {
    if (input.length > 20) {
      const detected = detectMood(input)
      if (detected !== tone) {
        setTone(detected)
        setAutoDetected(true)
        setTimeout(() => setAutoDetected(false), 2000)
      }
    }
  }, [input])

  const goToVoice = () => {
    if (!input.trim()) return toast.error('Enter a content idea first')
    playWhooshSound()
    setCurrentStep(1)
    generateVoice()
  }

  const generateVoice = async () => {
    setLoading(true)
    setResult(null)
    setGenerationTime(null)
    const startTime = performance.now()
    
    try {
      const data = await api.generateScript(input, tone, userId)
      const endTime = performance.now()
      const timeInSeconds = ((endTime - startTime) / 1000).toFixed(2)
      
      setResult(data)
      setGenerationTime(timeInSeconds)
      setCurrentStep(2)
      recordSession({ mode: 'creator', wordCount: data.text?.split(' ').length || 0 })
      
      // Save to history
      saveToHistory({
        mode: 'creator',
        input: input,
        tone: tone,
        text: data.text,
        audio: data.audio,
        generationTime: timeInSeconds
      })
      
      playSuccessSound()
      toast.success(`Generated in ${timeInSeconds}s! 🚀`)
    } catch {
      toast.error('Something went wrong. Check your API keys.')
      setCurrentStep(0)
    } finally {
      setLoading(false)
    }
  }

  const regenerate = () => {
    playClickSound()
    setCurrentStep(0)
    setResult(null)
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handler = e => {
      if (e.ctrlKey && e.key === 'Enter') { e.preventDefault(); if (currentStep === 0) goToVoice() }
      if (e.key === 'Escape' && result) regenerate()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [input, result, currentStep])

  const goToExport = () => {
    playClickSound()
    setCurrentStep(3)
  }

  const handleReplay = (item) => {
    setInput(item.input)
    setTone(item.tone)
    setResult({ text: item.text, audio: item.audio })
    setGenerationTime(item.generationTime)
    setCurrentStep(2)
    toast.success('Replaying from history')
  }

  const generateHooks = async () => {
    if (!input.trim()) return toast.error('Enter a content idea first')
    setHooksLoading(true); setHooks(null)
    try {
      const res = await api.generateAdvice(
        `You are a viral content strategist. For the topic: "${input}" (tone: ${tone}), generate hooks for social media.
Reply ONLY in this exact JSON (no markdown):
{
  "hooks": ["hook1","hook2","hook3","hook4","hook5"],
  "retentionLines": ["line1","line2","line3"],
  "ctas": ["cta1","cta2","cta3"],
  "titleIdeas": ["title1","title2","title3"]
}`
      )
      const parsed = JSON.parse(res.text.replace(/```json|```/gi,'').trim().match(/\{[\s\S]*\}/)?.[0] || '{}')
      if (!parsed.hooks) throw new Error('bad json')
      setHooks(parsed)
      playSuccessSound()
    } catch { toast.error('Failed to generate hooks') }
    finally { setHooksLoading(false) }
  }

  return (
    <div className="page-wrapper" style={{ '--page-accent': '#f59e0b' }}>
      <div className="page-content">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <PageHeader icon={Video} color="#8b5cf6" title="Creator Mode" sub="Generate scripts and voice for reels, YouTube and podcasts" />
          <QuoteBar section="creator" color="#8b5cf6" />

          <WorkflowSteps currentStep={currentStep} steps={steps} />

          {/* Tab switcher */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 16, background: 'var(--glass)', borderRadius: 12, padding: 4, border: '1px solid var(--border)' }}>
            {[['script','Script + Voice'],['hooks','Hook Generator']].map(([t,l]) => (
              <button key={t} onClick={() => { setActiveTab(t); playClickSound() }}
                style={{ flex: 1, padding: '8px', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                  background: activeTab === t ? 'linear-gradient(135deg,#8b5cf6,#f59e0b)' : 'transparent',
                  color: activeTab === t ? '#fff' : 'var(--text2)' }}>
                {t === 'script' ? <><Mic size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />{l}</> : <><Flame size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />{l}</>}
              </button>
            ))}
          </div>

          {/* Hook Generator tab */}
          {activeTab === 'hooks' && (
            <AnimatePresence mode="wait">
              <motion.div key="hooks" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="card" style={{ padding: 20, marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <Flame size={18} color="#f59e0b" />
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text1)' }}>Viral Hook Generator</div>
                  </div>
                  <input value={input} onChange={e => setInput(e.target.value)}
                    placeholder="Your content topic or idea..."
                    className="inp" style={{ marginBottom: 10, fontSize: 14 }} />
                  <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                    {tones.map(t => (
                      <button key={t.key} onClick={() => setTone(t.key)}
                        style={{ padding: '6px 12px', borderRadius: 20, border: `1px solid ${tone === t.key ? 'rgba(139,92,246,0.5)' : 'var(--border)'}`, background: tone === t.key ? 'rgba(139,92,246,0.15)' : 'var(--glass)', color: tone === t.key ? '#8b5cf6' : 'var(--text2)', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <t.Icon size={12} color={tone === t.key ? '#8b5cf6' : t.color} /> {t.label}
                      </button>
                    ))}
                  </div>
                  <button onClick={generateHooks} disabled={hooksLoading} className="btn"
                    style={{ background: 'linear-gradient(135deg,#f59e0b,#ef4444)' }}>
                    {hooksLoading ? (
                      <><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                        style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff' }} /> Generating...</>
                    ) : <><Flame size={14} /> Generate Hooks</>}
                  </button>
                </div>

                <AnimatePresence>
                  {hooks && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {[
                        { label: 'Opening Hooks', items: hooks.hooks, color: '#ef4444' },
                        { label: 'Retention Lines', items: hooks.retentionLines, color: '#f59e0b' },
                        { label: 'Call to Actions', items: hooks.ctas, color: '#10b981' },
                        { label: 'Title Ideas', items: hooks.titleIdeas, color: '#8b5cf6' },
                      ].map(({ label, items, color }) => items?.length > 0 && (
                        <div key={label} className="card" style={{ padding: 16 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 10 }}>{label}</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {items.map((item, i) => (
                              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                                <span style={{ fontSize: 11, fontWeight: 700, color, flexShrink: 0, marginTop: 2 }}>{i + 1}.</span>
                                <div style={{ flex: 1, fontSize: 13, color: 'var(--text1)', lineHeight: 1.5 }}>{item}</div>
                                <button onClick={() => { navigator.clipboard.writeText(item); toast.success('Copied!') }}
                                  style={{ fontSize: 10, padding: '3px 8px', borderRadius: 6, border: `1px solid ${color}40`, background: color + '12', color, cursor: 'pointer', flexShrink: 0 }}>
                                  Copy
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </AnimatePresence>
          )}

          {activeTab === 'script' && (
          <AnimatePresence mode="wait">
            {/* Step 1: Write Script */}
            {currentStep === 0 && (
              <motion.div key="write" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <div className="card" style={{ padding: 24, marginBottom: 12 }}>
                  <Label>Your content idea</Label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 12, color: 'var(--text3)', flex: 1 }}>Type or speak your idea</span>
                    <VoiceMicButton onResult={val => { setInput(val); const d = detectMood(val); if (d !== tone) { setTone(d); setAutoDetected(true); setTimeout(() => setAutoDetected(false), 2000) } }} />
                  </div>
                  <textarea value={input} onChange={e => setInput(e.target.value)}
                    placeholder="e.g. Motivational reel about never giving up, productivity tips for students..."
                    rows={5} className="inp" style={{ marginBottom: 16 }} />

                  <Label>Voice mood {autoDetected && <span style={{ color: '#10b981', fontSize: 11, marginLeft: 6 }}>✨ Auto-detected</span>}</Label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 18 }}>
                    {tones.map(t => (
                      <button key={t.key} onClick={() => setTone(t.key)}
                        className="card"
                        style={{
                          padding: 14,
                          textAlign: 'left',
                          cursor: 'pointer',
                          background: tone === t.key ? 'rgba(139,92,246,0.15)' : 'var(--glass)',
                          borderColor: tone === t.key ? 'rgba(139,92,246,0.4)' : 'var(--border)'
                        }}>
                        <div style={{ width: 32, height: 32, borderRadius: 10, background: t.color + '18', border: `1px solid ${t.color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                          <t.Icon size={16} color={tone === t.key ? '#8b5cf6' : t.color} />
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: tone === t.key ? '#8b5cf6' : 'var(--text1)' }}>
                          {t.label}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{t.desc}</div>
                      </button>
                    ))}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 10, background: 'var(--glass)', border: '1px solid var(--border)', marginBottom: 18 }}>
                    <input type="checkbox" id="enhance" checked={enhanceScript} onChange={e => setEnhanceScript(e.target.checked)}
                      style={{ width: 16, height: 16, cursor: 'pointer' }} />
                    <label htmlFor="enhance" style={{ fontSize: 13, color: 'var(--text1)', cursor: 'pointer', flex: 1 }}>
                      Enhance script with AI before voicing
                    </label>
                    <span style={{ fontSize: 11, color: 'var(--text3)' }}>Recommended</span>
                  </div>

                  <button className="btn" onClick={goToVoice}>
                    <Sparkles size={16} /> Generate Script & Voice
                  </button>
                </div>

                <div className="card" style={{ padding: 16, background: 'rgba(139,92,246,0.08)', borderColor: 'rgba(139,92,246,0.2)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <Zap size={16} color="#8b5cf6" style={{ flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#8b5cf6', marginBottom: 4 }}>
                        Pro Tip
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.5 }}>
                        Be specific about your target audience and desired length. Example: "30-second motivational reel for entrepreneurs"
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Generating Voice */}
            {currentStep === 1 && (
              <motion.div key="voice" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="card" style={{ padding: 40, textAlign: 'center' }}>
                  <div className="spin" style={{ width: 40, height: 40, borderWidth: 3, margin: '0 auto 16px' }} />
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text1)', marginBottom: 6 }}>
                    Generating your script and voice...
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text2)' }}>
                    AI is crafting the perfect {tone} script with voice
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Preview */}
            {currentStep === 2 && result && (
              <motion.div key="preview" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                {generationTime && (
                  <div className="card" style={{ padding: 16, marginBottom: 12, background: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.3)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                      <Zap size={18} color="#10b981" />
                      <div>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#10b981' }}>
                          Falcon Speed: {generationTime}s
                        </span>
                        <span style={{ fontSize: 12, color: 'var(--text2)', marginLeft: 8 }}>
                          ⚡ Powered by Murf Falcon - The Fastest TTS
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <WaveformPlayer audioUrl={result.audio} isLoading={false} mode="creator" />

                {result.text && (
                  <ResultCard icon={<Mic size={14} color="#8b5cf6" />} label="Generated Script" text={result.text} />
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
                  <button className="btn" onClick={regenerate}
                    style={{ background: 'var(--glass)', color: 'var(--text1)', border: '1px solid var(--border)' }}>
                    ← Start Over
                  </button>
                  <button className="btn" onClick={goToExport}>
                    Continue to Export →
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 4: Export */}
            {currentStep === 3 && result && (
              <motion.div key="export" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                <div className="card" style={{ padding: 24, textAlign: 'center' }}>
                  <div style={{ fontSize: 48, marginBottom: 12, display: 'flex', justifyContent: 'center' }}>
                    <Sparkles size={48} color="#8b5cf6" />
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text1)', marginBottom: 8 }}>
                    Your content is ready!
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 20 }}>
                    Download the audio and use it in your videos, reels, or podcasts
                  </div>

                  <div style={{ display: 'grid', gap: 10 }}>
                    <a href={result.audio} download={`vortex-creator-${Date.now()}.mp3`}
                      className="btn" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                      <Zap size={14} /> Download Audio (MP3)
                    </a>

                    <button className="btn" onClick={() => navigator.clipboard.writeText(result.text)}
                      style={{ background: 'var(--glass)', color: 'var(--text1)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                      <BookOpen size={14} /> Copy Script to Clipboard
                    </button>

                    <button className="btn"
                      onClick={() => {
                        const md = `# Creator Script\n\n${result.text}`
                        navigator.clipboard.writeText(md)
                        toast.success('Copied as Markdown!')
                      }}
                      style={{ background: 'var(--glass)', color: 'var(--text1)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                      <Sparkles size={14} /> Copy as Markdown
                    </button>

                    <ShareButton text={result.text} audioUrl={result.audio} label="Share Script" style={{ justifyContent: 'center', padding: '10px 14px' }} />

                    <button className="btn" onClick={regenerate}
                      style={{ background: 'var(--glass)', color: 'var(--text1)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                      <Sparkles size={14} /> Create Another
                    </button>
                  </div>
                </div>

                <div className="card" style={{ padding: 16, marginTop: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 10 }}>
                    Optimized for:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {['Instagram Reels', 'YouTube Shorts', 'TikTok', 'Podcasts', 'Stories'].map(platform => (
                      <div key={platform} className="chip" style={{ fontSize: 11 }}>
                        {platform}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          )}
        </motion.div>
      </div>

      <VoiceHistorySidebar onReplay={handleReplay} />
    </div>
  )
}
