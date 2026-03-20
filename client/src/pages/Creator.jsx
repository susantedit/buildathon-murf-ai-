import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, Sparkles, Zap, Video } from 'lucide-react'
import toast from 'react-hot-toast'
import WaveformPlayer from '../components/WaveformPlayer'
import WorkflowSteps from '../components/WorkflowSteps'
import VoiceHistorySidebar from '../components/VoiceHistorySidebar'
import { PageHeader, Label, SubmitBtn, ResultCard } from '../components/UI'
import { api } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { detectMood } from '../utils/moodDetector'
import { saveToHistory } from '../utils/voiceHistory'
import { playWhooshSound, playSuccessSound, playClickSound } from '../utils/soundGenerator'

const tones = [
  { key: 'motivational', label: 'Motivational', emoji: '🔥', desc: 'High energy, inspiring' },
  { key: 'calm', label: 'Calm', emoji: '🧘', desc: 'Soothing, peaceful' },
  { key: 'storytelling', label: 'Storytelling', emoji: '📖', desc: 'Narrative, engaging' },
  { key: 'serious', label: 'Professional', emoji: '💼', desc: 'Formal, authoritative' },
]

const steps = [
  { label: 'Write', icon: '✍️' },
  { label: 'Voice', icon: '🎙️' },
  { label: 'Preview', icon: '👁️' },
  { label: 'Export', icon: '📥' },
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

  return (
    <div className="page-wrapper" style={{ '--page-accent': '#f59e0b' }}>
      <div className="page-content">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <PageHeader icon={Video} color="#8b5cf6" title="Creator Mode" sub="Generate scripts and voice for reels, YouTube and podcasts" />

          <WorkflowSteps currentStep={currentStep} steps={steps} />

          <AnimatePresence mode="wait">
            {/* Step 1: Write Script */}
            {currentStep === 0 && (
              <motion.div key="write" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <div className="card" style={{ padding: 24, marginBottom: 12 }}>
                  <Label>Your content idea</Label>
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
                        <div style={{ fontSize: 20, marginBottom: 4 }}>{t.emoji}</div>
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
                      ✨ Enhance script with AI before voicing
                    </label>
                    <span style={{ fontSize: 11, color: 'var(--text3)' }}>Recommended</span>
                  </div>

                  <button className="btn" onClick={goToVoice}>
                    <Sparkles size={16} /> ✨ Generate Script & Voice
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
                  <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text1)', marginBottom: 8 }}>
                    Your content is ready!
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 20 }}>
                    Download the audio and use it in your videos, reels, or podcasts
                  </div>

                  <div style={{ display: 'grid', gap: 10 }}>
                    <a href={result.audio} download={`vortex-creator-${Date.now()}.mp3`}
                      className="btn" style={{ textDecoration: 'none' }}>
                      📥 Download Audio (MP3)
                    </a>

                    <button className="btn" onClick={() => navigator.clipboard.writeText(result.text)}
                      style={{ background: 'var(--glass)', color: 'var(--text1)', border: '1px solid var(--border)' }}>
                      📋 Copy Script to Clipboard
                    </button>

                    <button className="btn" onClick={regenerate}
                      style={{ background: 'var(--glass)', color: 'var(--text1)', border: '1px solid var(--border)' }}>
                      ✨ Create Another
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
        </motion.div>
      </div>

      <VoiceHistorySidebar onReplay={handleReplay} />
    </div>
  )
}
