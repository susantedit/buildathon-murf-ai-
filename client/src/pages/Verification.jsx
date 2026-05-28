// Verification — Realtime Fact Analysis Console
import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShieldCheck, Globe, Sparkles, RefreshCw, Upload, Link2, FileText, Image as ImageIcon,
  AlertTriangle, Clock3, CheckCircle2, XCircle, MinusCircle, TrendingUp, Eye, Gauge,
  Search, ChevronRight, ArrowUpRight, TriangleAlert, Layers3, ScanLine
} from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '../services/api'
import FloatingPanel from '../components/FloatingPanel'
import WaveformVisualizer from '../components/WaveformVisualizer'

const verdictMeta = {
  VERIFIED: { label: 'Verified', color: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.28)', Icon: CheckCircle2 },
  LIKELY_TRUE: { label: 'Likely true', color: '#22c55e', bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.28)', Icon: CheckCircle2 },
  UNVERIFIABLE: { label: 'Unverifiable', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.28)', Icon: MinusCircle },
  LIKELY_FALSE: { label: 'Likely false', color: '#fb7185', bg: 'rgba(251,113,133,0.12)', border: 'rgba(251,113,133,0.30)', Icon: XCircle },
  FALSE: { label: 'False', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.30)', Icon: XCircle },
  CONFLICTING: { label: 'Conflicting', color: '#a855f7', bg: 'rgba(168,85,247,0.12)', border: 'rgba(168,85,247,0.30)', Icon: AlertTriangle },
}

const inputModes = [
  { key: 'text', label: 'Paste text', icon: FileText, hint: 'Articles, posts, transcripts, OCR text, JSON, CSV' },
  { key: 'url', label: 'Verify URL', icon: Link2, hint: 'Open web pages, articles, social posts, docs' },
  { key: 'file', label: 'Upload file', icon: Upload, hint: 'Screenshots, images, text files, PDFs, DOCX, PPTX' },
]

const samplePrompts = [
  'The WHO declared a new global emergency in 2026.',
  'This screenshot claims the CEO resigned and stock collapsed overnight.',
  'A post says the government banned a popular app effective immediately.',
]

function formatPercent(value) {
  if (Number.isNaN(value) || value == null) return '0%'
  return `${Math.max(0, Math.min(100, Math.round(value)))}%`
}

function formatTime(ts) {
  try {
    return new Date(ts).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
  } catch {
    return ''
  }
}

function scoreToWidth(score) {
  return `${Math.max(6, Math.min(100, score || 0))}%`
}

async function fileToText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}

async function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('Failed to read image'))
    reader.readAsDataURL(file)
  })
}

function SectionLabel({ icon: Icon, title, subtitle }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
      <div style={{ width: 34, height: 34, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(79,140,255,0.12)', border: '1px solid rgba(79,140,255,0.24)' }}>
        <Icon size={16} color="#4F8CFF" />
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text1)', letterSpacing: '-0.01em' }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: 'var(--text3)' }}>{subtitle}</div>}
      </div>
    </div>
  )
}

function MetricCard({ label, value, icon: Icon, color }) {
  return (
    <div style={{
      padding: '14px 16px', borderRadius: 16,
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.06)',
      boxShadow: '0 12px 30px rgba(2,6,23,0.20)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <Icon size={12} color={color} />
        <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
      </div>
      <div style={{ fontSize: 18, fontWeight: 900, color, fontFamily: "'Space Grotesk',system-ui,sans-serif" }}>{value}</div>
    </div>
  )
}

function EvidenceCard({ evidence }) {
  return (
    <div style={{
      padding: 12, borderRadius: 14,
      background: 'rgba(11,15,26,0.92)',
      border: `1px solid ${evidence.trusted ? 'rgba(16,185,129,0.24)' : 'rgba(255,255,255,0.08)'}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text1)', marginBottom: 4, lineHeight: 1.4 }}>{evidence.title || 'Source'}</div>
          <div style={{ fontSize: 11, color: 'var(--text3)', wordBreak: 'break-word' }}>{evidence.url}</div>
        </div>
        <a href={evidence.url} target="_blank" rel="noreferrer" style={{ color: '#4F8CFF', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, textDecoration: 'none', flexShrink: 0 }}>
          Open <ArrowUpRight size={11} />
        </a>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8, marginTop: 10 }}>
        <div style={{ fontSize: 10, color: 'var(--text3)' }}>Reliability<br /><strong style={{ color: 'var(--text1)' }}>{formatPercent(evidence.reliabilityScore)}</strong></div>
        <div style={{ fontSize: 10, color: 'var(--text3)' }}>Support<br /><strong style={{ color: 'var(--text1)' }}>{formatPercent(evidence.supportScore)}</strong></div>
        <div style={{ fontSize: 10, color: 'var(--text3)' }}>Freshness<br /><strong style={{ color: 'var(--text1)' }}>{formatPercent(evidence.freshnessScore)}</strong></div>
      </div>
      {evidence.snippet && (
        <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text2)', lineHeight: 1.6 }}>
          {evidence.snippet}
        </div>
      )}
    </div>
  )
}

export default function Verification() {
  const [mode, setMode] = useState('text')
  const [inputText, setInputText] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [imageText, setImageText] = useState('')
  const [imagePreview, setImagePreview] = useState('')
  const [fileName, setFileName] = useState('')
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [result, setResult] = useState(null)
  const [liveStatus, setLiveStatus] = useState('Idle')
  const [livePulse, setLivePulse] = useState(0)
  const textareaRef = useRef(null)
  const refreshTimerRef = useRef(null)

  useEffect(() => {
    const ticker = setInterval(() => setLivePulse(v => (v + 1) % 6), 2600)
    return () => clearInterval(ticker)
  }, [])

  useEffect(() => {
    if (!autoRefresh || !result) {
      clearInterval(refreshTimerRef.current)
      return undefined
    }

    refreshTimerRef.current = setInterval(() => {
      handleRefresh(true)
    }, 120000)

    return () => clearInterval(refreshTimerRef.current)
  }, [autoRefresh, result])

  const currentVerdict = result?.summary?.overallStatus || 'UNVERIFIABLE'
  const verdictInfo = verdictMeta[currentVerdict] || verdictMeta.UNVERIFIABLE
  const liveClaimCount = result?.claims?.length || 0
  const confidence = result?.summary?.confidence || 0
  const freshness = result?.summary?.freshness || 0
  const reliability = result?.summary?.sourceReliability || 0
  const manipulationRisk = result?.summary?.manipulationRisk || 0

  const groupedClaims = useMemo(() => {
    if (!result?.claims?.length) return []
    return result.claims.map((claim, index) => ({ ...claim, index }))
  }, [result])

  const analyzeInput = async () => {
    if (!inputText.trim() && !sourceUrl.trim() && !imageText.trim()) {
      toast.error('Add text, a URL, or an image first')
      return
    }

    setLoading(true)
    setLiveStatus('Extracting claims...')
    try {
      const response = await api.verifyClaims({
        inputText,
        sourceUrl,
        imageText,
        inputType: mode,
      })
      setResult(response)
      setLiveStatus(`Updated ${formatTime(response.lastChecked)}`)
      toast.success(`Analysis complete: ${response.summary?.overallStatus || 'UNVERIFIABLE'}`)
    } catch (error) {
      toast.error(error.message || 'Verification failed')
      setLiveStatus('Analysis failed')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async (silent = false) => {
    if (!inputText.trim() && !sourceUrl.trim() && !imageText.trim()) return

    setRefreshing(true)
    if (!silent) setLiveStatus('Refreshing evidence...')
    try {
      const response = await api.refreshVerification({
        inputText,
        sourceUrl,
        imageText,
        inputType: mode,
      })
      setResult(response)
      if (!silent) {
        setLiveStatus(`Refreshed ${formatTime(response.lastChecked)}`)
        toast.success('Evidence refreshed')
      }
    } catch (error) {
      if (!silent) toast.error(error.message || 'Refresh failed')
      setLiveStatus('Refresh failed')
    } finally {
      setRefreshing(false)
    }
  }

  const handleFile = async (file) => {
    if (!file) return
    setFileName(file.name)

    const isImage = file.type.startsWith('image/')
    const isTextLike = /text\//.test(file.type) || ['application/json', 'text/csv', 'application/xml', 'text/xml', 'application/rtf'].includes(file.type)

    try {
      if (isImage) {
        setMode('file')
        setLiveStatus('Running OCR on image...')
        const dataUrl = await fileToDataUrl(file)
        setImagePreview(dataUrl)
        const [, base64] = dataUrl.split(',')
        const description = await api.describeImage(base64, file.type)
        setImageText(description.text || description || '')
        setLiveStatus('OCR extracted, ready to verify')
        toast.success('Image analyzed')
        return
      }

      if (isTextLike) {
        const text = await fileToText(file)
        setInputText(text)
        setMode('text')
        setLiveStatus('Loaded text content')
        toast.success('File loaded')
        return
      }

      const text = await fileToText(file)
      setInputText(text)
      setMode('text')
      setLiveStatus('Loaded file text')
      toast.success('File loaded')
    } catch (error) {
      toast.error(error.message || 'Could not read that file')
      setLiveStatus('File read failed')
    }
  }

  const applySample = (sample) => {
    setMode('text')
    setInputText(sample)
    setSourceUrl('')
    setImageText('')
    setImagePreview('')
    setFileName('')
    setLiveStatus('Sample loaded')
    textareaRef.current?.focus()
  }

  return (
    <div className="page-wrapper" style={{ background: '#07101f', minHeight: '100vh' }}>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(79,140,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(79,140,255,0.05) 1px, transparent 1px)', backgroundSize: '38px 38px' }} />
        <div style={{ position: 'absolute', top: '8%', left: '12%', width: 380, height: 380, borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,211,238,0.13), transparent 70%)', filter: 'blur(50px)' }} />
        <div style={{ position: 'absolute', bottom: '15%', right: '10%', width: 420, height: 420, borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,85,247,0.10), transparent 70%)', filter: 'blur(55px)' }} />
      </div>

      <div className="page-content-wide" style={{ position: 'relative', zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          style={{ marginBottom: 28 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 52, height: 52, borderRadius: 16, background: 'linear-gradient(135deg, #4F8CFF, #22c55e)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 32px rgba(79,140,255,0.34)' }}>
                <ShieldCheck size={26} color="#fff" />
              </div>
              <div>
                <h1 style={{
                  fontFamily: "'Space Grotesk', system-ui, sans-serif",
                  fontWeight: 900,
                  fontSize: 28,
                  letterSpacing: '-0.04em',
                  background: 'linear-gradient(135deg, #4F8CFF, #22c55e, #f59e0b)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>
                  Realtime Verify
                </h1>
                <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>
                  Autonomous claim extraction, live source checks, contradiction scoring, and freshness tracking.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 999, background: 'rgba(16,185,129,0.10)', border: '1px solid rgba(16,185,129,0.24)', color: '#10b981', fontSize: 12, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: `0 0 14px rgba(16,185,129,${0.35 + livePulse * 0.08})` }} />
                {liveStatus}
              </div>
              <button
                onClick={() => setAutoRefresh(v => !v)}
                className="btn"
                style={{ width: 'auto', padding: '10px 14px', fontSize: 12 }}
                aria-label="Toggle live monitoring"
              >
                <RefreshCw size={14} />
                {autoRefresh ? 'Live monitoring on' : 'Live monitoring off'}
              </button>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.05 }}
          style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.08fr) minmax(320px, 0.92fr)', gap: 16, alignItems: 'start' }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <FloatingPanel glowColor="#4F8CFF" style={{ padding: 20 }}>
              <SectionLabel icon={Layers3} title="Input Console" subtitle="Paste text, verify a URL, or upload a file for OCR and text extraction." />

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginBottom: 14 }}>
                {inputModes.map(({ key, label, icon: Icon, hint }) => (
                  <button
                    key={key}
                    onClick={() => setMode(key)}
                    className="btn"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      background: mode === key ? 'linear-gradient(135deg, rgba(79,140,255,0.20), rgba(34,197,94,0.12))' : 'rgba(255,255,255,0.04)',
                      border: mode === key ? '1px solid rgba(79,140,255,0.35)' : '1px solid rgba(255,255,255,0.08)',
                      color: 'var(--text1)',
                      justifyContent: 'flex-start',
                      textAlign: 'left',
                      gap: 10,
                    }}
                  >
                    <Icon size={16} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800 }}>{label}</div>
                      <div style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.4 }}>{hint}</div>
                    </div>
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                {mode === 'url' ? (
                  <motion.div key="url" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Source URL</label>
                    <input
                      className="inp"
                      value={sourceUrl}
                      onChange={e => setSourceUrl(e.target.value)}
                      placeholder="https://..."
                      aria-label="Source URL"
                    />
                  </motion.div>
                ) : mode === 'file' ? (
                  <motion.div key="file" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Upload file</label>
                    <div style={{
                      padding: 18, borderRadius: 16,
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px dashed rgba(79,140,255,0.26)',
                    }}>
                      <input
                        type="file"
                        onChange={e => handleFile(e.target.files?.[0])}
                        aria-label="Upload file"
                        accept="image/*,.txt,.json,.csv,.xml,.rtf,.html,.htm,.pdf,.docx,.pptx"
                        style={{ width: '100%', color: 'var(--text2)' }}
                      />
                      <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 10, lineHeight: 1.6 }}>
                        Images will be OCR'd through the existing vision endpoint. Text files are read directly.
                      </div>
                      {fileName && (
                        <div style={{ marginTop: 10, fontSize: 12, color: '#22c55e', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Upload size={12} /> {fileName}
                        </div>
                      )}
                    </div>
                    {imagePreview && (
                      <img src={imagePreview} alt="Uploaded preview" style={{ maxWidth: '100%', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)' }} />
                    )}
                  </motion.div>
                ) : (
                  <motion.div key="text" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Claims or transcript</label>
                    <textarea
                      ref={textareaRef}
                      className="inp"
                      value={inputText}
                      onChange={e => setInputText(e.target.value)}
                      placeholder="Paste a claim, article, transcript, screenshot OCR text, or statement here..."
                      rows={9}
                      style={{ resize: 'vertical', lineHeight: 1.7 }}
                      aria-label="Claim input"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {imageText && (
                <div style={{ marginTop: 14, padding: 14, borderRadius: 14, background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.16)' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>OCR Text</div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.7, maxHeight: 140, overflow: 'auto' }}>{imageText}</div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
                <button onClick={analyzeInput} className="btn" style={{ width: 'auto', paddingInline: 18 }} disabled={loading} aria-label="Analyze claims">
                  {loading ? <div className="spin" /> : <Search size={16} />}
                  Analyze Claims
                </button>
                <button onClick={() => handleRefresh(false)} className="btn" style={{ width: 'auto', paddingInline: 18, background: 'rgba(79,140,255,0.12)' }} disabled={refreshing || !result} aria-label="Refresh verification">
                  {refreshing ? <div className="spin" /> : <RefreshCw size={16} />}
                  Refresh Evidence
                </button>
                <button onClick={() => applySample(samplePrompts[Math.floor(Math.random() * samplePrompts.length)])} className="btn" style={{ width: 'auto', paddingInline: 18, background: 'rgba(168,85,247,0.12)' }} aria-label="Load sample claim">
                  <Sparkles size={16} />
                  Load Sample
                </button>
              </div>
            </FloatingPanel>

            <FloatingPanel glowColor="#22c55e" style={{ padding: 20 }}>
              <SectionLabel icon={TrendingUp} title="Live Evidence Stream" subtitle="Updates automatically when live monitoring is enabled." />

              {result ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 12, height: 12, borderRadius: '50%', background: verdictInfo.color, boxShadow: `0 0 16px ${verdictInfo.color}88` }} />
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--text1)' }}>{verdictInfo.label}</div>
                        <div style={{ fontSize: 12, color: 'var(--text3)' }}>Last checked {formatTime(result.lastChecked)}</div>
                      </div>
                    </div>
                    <div style={{ padding: '6px 10px', borderRadius: 999, background: verdictInfo.bg, border: `1px solid ${verdictInfo.border}`, color: verdictInfo.color, fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      {currentVerdict}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
                    <MetricCard label="Confidence" value={formatPercent(confidence)} icon={Gauge} color="#4F8CFF" />
                    <MetricCard label="Reliability" value={formatPercent(reliability)} icon={ShieldCheck} color="#10b981" />
                    <MetricCard label="Freshness" value={formatPercent(freshness)} icon={Clock3} color="#f59e0b" />
                    <MetricCard label="Manipulation risk" value={formatPercent(manipulationRisk)} icon={TriangleAlert} color="#ef4444" />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {result.liveNotes?.map(note => (
                      <div key={note} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text2)' }}>
                        <ScanLine size={12} color="#22d3ee" />
                        {note}
                      </div>
                    ))}
                  </div>

                  {result.sourceUrl && (
                    <a href={result.sourceUrl} target="_blank" rel="noreferrer" style={{ color: '#4F8CFF', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
                      Verified source URL <ArrowUpRight size={12} />
                    </a>
                  )}
                </div>
              ) : (
                <div style={{ padding: '20px 0', color: 'var(--text3)', fontSize: 12, lineHeight: 1.7 }}>
                  Load a claim, then the console will extract statements, compare evidence, and surface a verdict with freshness and manipulation risk.
                </div>
              )}
            </FloatingPanel>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <FloatingPanel glowColor={verdictInfo.color} style={{ padding: 20 }}>
              <SectionLabel icon={Eye} title="Claim Board" subtitle="Each extracted claim gets its own verdict, confidence, and supporting evidence." />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {groupedClaims.length ? groupedClaims.map(claim => {
                  const claimVerdictInfo = verdictMeta[claim.verdict] || verdictMeta.UNVERIFIABLE
                  const VerdictIcon = claimVerdictInfo.Icon
                  return (
                    <div key={`${claim.index}-${claim.claim}`} style={{
                      padding: 14,
                      borderRadius: 16,
                      background: 'rgba(255,255,255,0.03)',
                      border: `1px solid ${claimVerdictInfo.border}`,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                            <div style={{ padding: '4px 8px', borderRadius: 999, background: claimVerdictInfo.bg, border: `1px solid ${claimVerdictInfo.border}`, color: claimVerdictInfo.color, fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                              <VerdictIcon size={11} /> {claim.verdict}
                            </div>
                            <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{claim.category}</div>
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text1)', lineHeight: 1.65 }}>{claim.claim}</div>
                        </div>
                        <div style={{ flexShrink: 0, textAlign: 'right' }}>
                          <div style={{ fontSize: 11, color: 'var(--text3)' }}>Confidence</div>
                          <div style={{ fontSize: 14, fontWeight: 900, color: claimVerdictInfo.color }}>{formatPercent(claim.confidence)}</div>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gap: 8, marginBottom: 10 }}>
                        <div style={{ height: 6, borderRadius: 999, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                          <div style={{ width: scoreToWidth(claim.confidence), height: '100%', background: `linear-gradient(90deg, ${claimVerdictInfo.color}, rgba(34,211,238,0.9))`, borderRadius: 999 }} />
                        </div>
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', fontSize: 11, color: 'var(--text3)' }}>
                          <span>Source reliability {formatPercent(claim.sourceReliability)}</span>
                          <span>Freshness {formatPercent(claim.freshnessScore)}</span>
                          <span>Manipulation risk {formatPercent(claim.manipulationRisk)}</span>
                        </div>
                      </div>

                      <div style={{ padding: 12, borderRadius: 14, background: 'rgba(11,15,26,0.70)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 12 }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: '#22d3ee', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Reasoning</div>
                        <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.7 }}>{claim.reasoning}</div>
                      </div>

                      {claim.evidence?.length ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {claim.evidence.map(evidence => <EvidenceCard key={`${claim.claim}-${evidence.url}`} evidence={evidence} />)}
                        </div>
                      ) : (
                        <div style={{ fontSize: 12, color: 'var(--text3)' }}>No evidence retrieved for this claim.</div>
                      )}
                    </div>
                  )
                }) : (
                  <div style={{ padding: '20px 0', fontSize: 12, color: 'var(--text3)', lineHeight: 1.7 }}>
                    No claims extracted yet. The verifier extracts dates, names, numbers, statistics, and quotes automatically once you run an analysis.
                  </div>
                )}
              </div>
            </FloatingPanel>

            <FloatingPanel glowColor="#f59e0b" style={{ padding: 20 }}>
              <SectionLabel icon={Globe} title="Operational Summary" subtitle="Quick summary of how the current evidence set looks." />
              {result ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
                  <MetricCard label="Claims" value={String(result.summary?.totalClaims || 0)} icon={FileText} color="#4F8CFF" />
                  <MetricCard label="Supported" value={String((result.summary?.verifiedCount || 0) + (result.summary?.likelyTrueCount || 0))} icon={CheckCircle2} color="#10b981" />
                  <MetricCard label="Challenged" value={String(result.summary?.likelyFalseCount || 0)} icon={XCircle} color="#ef4444" />
                  <MetricCard label="Unverifiable" value={String(result.summary?.unverifiableCount || 0)} icon={MinusCircle} color="#f59e0b" />
                </div>
              ) : (
                <div style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.7 }}>
                  Once evidence is loaded, this panel summarizes the current trust state, conflict level, and the confidence gradient across the claim set.
                </div>
              )}
            </FloatingPanel>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
