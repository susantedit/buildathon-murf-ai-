// CageBait — Scam Honeypot Intelligence Operations Center
// State machine: IDLE → ACTIVE → ENDED
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bug, Shield, Phone, Link, Building, CreditCard,
  AlertTriangle, Flag, Clock, ChevronDown, ChevronUp,
  Copy, Check, Mic, X, Zap, Eye, Sparkles
} from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '../services/api'
import { useAuth } from '../context/AuthContext'
import VoiceMicButton from '../components/VoiceMicButton'
import FloatingPanel from '../components/FloatingPanel'
import VoiceOrb from '../components/VoiceOrb'
import CodeGraphViewer from '../components/CodeGraphViewer'
import WaveformVisualizer from '../components/WaveformVisualizer'

// ─── Persona definitions ──────────────────────────────────────────────────────
const PERSONAS = [
  {
    id: 'elderly',
    name: 'Grandma Rose',
    emoji: '👵',
    description: 'Sweet, confused 74-year-old retired teacher',
    color: '#f59e0b',
    colorBg: 'rgba(245,158,11,0.12)',
    colorBorder: 'rgba(245,158,11,0.35)',
  },
  {
    id: 'professional',
    name: 'David Chen',
    emoji: '👨‍💼',
    description: 'Skeptical 42-year-old financial analyst',
    color: '#4F8CFF',
    colorBg: 'rgba(79,140,255,0.12)',
    colorBorder: 'rgba(79,140,255,0.35)',
  },
  {
    id: 'newbie',
    name: 'Jamie',
    emoji: '🧑‍💻',
    description: 'Confused 28-year-old digital newbie',
    color: '#A855F7',
    colorBg: 'rgba(168,85,247,0.12)',
    colorBorder: 'rgba(168,85,247,0.35)',
  },
]

// ─── Phase logic ──────────────────────────────────────────────────────────────
function getPhase(turnCount) {
  if (turnCount <= 3) return 0
  if (turnCount <= 7) return 1
  if (turnCount <= 12) return 2
  return 3
}

const PHASE_LABELS = ['Recon', 'Engage', 'Extract', 'Endgame']
const PHASE_COLORS = ['#4F8CFF', '#f59e0b', '#A855F7', '#ef4444']

// ─── Intel icon map ───────────────────────────────────────────────────────────
const INTEL_ICONS = {
  phoneNumbers: { icon: Phone, color: '#f97316', label: 'Phone Numbers' },
  bankNames: { icon: Building, color: '#A855F7', label: 'Banks' },
  upiIds: { icon: CreditCard, color: '#f59e0b', label: 'UPI IDs' },
  suspiciousLinks: { icon: Link, color: '#ef4444', label: 'Suspicious Links' },
  companyNames: { icon: Building, color: '#4F8CFF', label: 'Companies' },
  scamType: { icon: Bug, color: '#ef4444', label: 'Scam Type' },
  redFlags: { icon: Flag, color: '#ef4444', label: 'Red Flags' },
  summary: { icon: Eye, color: '#22d3ee', label: 'Summary' },
}

// ─── Build graph nodes/edges from intel ──────────────────────────────────────
function buildIntelGraph(intel) {
  if (!intel) return { nodes: [], edges: [] }
  const nodes = []
  const edges = []
  const centerId = 'scammer'
  nodes.push({ id: centerId, label: intel.scamType || 'Scammer', type: 'center' })

  const addItems = (items, type) => {
    if (!items || !items.length) return
    items.forEach((item, i) => {
      const id = `${type}-${i}`
      nodes.push({ id, label: item, type })
      edges.push({ source: centerId, target: id })
    })
  }

  addItems(intel.phoneNumbers, 'phone')
  addItems(intel.bankNames, 'bank')
  addItems(intel.upiIds, 'upi')
  addItems(intel.suspiciousLinks, 'link')
  addItems(intel.companyNames, 'company')
  return { nodes, edges }
}

// ─── Sound helpers ────────────────────────────────────────────────────────────
const playSound = (src) => { try { new Audio(src).play().catch(() => {}) } catch (_) {} }


// ─── Main Component ───────────────────────────────────────────────────────────
export default function CageBait() {
  const { userId } = useAuth()

  // State machine
  const [phase, setPhase] = useState('IDLE') // IDLE | ACTIVE | ENDED
  const [selectedPersona, setSelectedPersona] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [typing, setTyping] = useState(false)
  const [turnCount, setTurnCount] = useState(0)
  const [intel, setIntel] = useState(null)
  const [intelOpen, setIntelOpen] = useState(false)
  const [sessionReport, setSessionReport] = useState(null)
  const [copied, setCopied] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [extractingIntel, setExtractingIntel] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [startTime, setStartTime] = useState(null)

  const transcriptRef = useRef(null)
  const timerRef = useRef(null)
  const inputRef = useRef(null)

  // ── Timer ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase === 'ACTIVE' && startTime) {
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTime) / 1000))
      }, 1000)
    } else {
      clearInterval(timerRef.current)
    }
    return () => clearInterval(timerRef.current)
  }, [phase, startTime])

  // ── Auto-scroll transcript ─────────────────────────────────────────────────
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight
    }
  }, [messages, typing])

  // ── Format timer ──────────────────────────────────────────────────────────
  const formatTime = (s) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  // ── Start session ──────────────────────────────────────────────────────────
  const handleStart = () => {
    if (!selectedPersona) { toast.error('Select a persona first'); return }
    setPhase('ACTIVE')
    setMessages([])
    setTurnCount(0)
    setIntel(null)
    setElapsed(0)
    setStartTime(Date.now())
    playSound('/sounds/killfeed-pop.mp3')
    toast.success(`${selectedPersona.name} is ready. Start the conversation!`, { icon: '🎭' })
  }

  // ── Send message ───────────────────────────────────────────────────────────
  const handleSend = async () => {
    const text = input.trim()
    if (!text || loading || phase !== 'ACTIVE') return

    const scammerMsg = { role: 'scammer', content: text, id: Date.now() }
    setMessages(prev => [...prev, scammerMsg])
    setInput('')
    setLoading(true)
    setTyping(true)
    playSound('/sounds/order-placed.mp3')

    const newTurn = turnCount + 1
    setTurnCount(newTurn)

    try {
      // Build conversation history for API
      const history = messages.map(m => ({
        role: m.role === 'scammer' ? 'user' : 'assistant',
        content: m.content,
      }))

      const res = await api.cageBaitRespond({
        personaId: selectedPersona.id,
        conversationHistory: history,
        scammerMessage: text,
        turnCount: newTurn,
        userId,
      })

      setTyping(false)

      const personaMsg = {
        role: 'persona',
        content: res.response || res.text || '',
        id: Date.now() + 1,
      }
      setMessages(prev => [...prev, personaMsg])

      // Auto-play audio if provided
      const audioUrl = res.audioUrl || res.audio
      if (audioUrl) {
        setIsSpeaking(true)
        const audio = new Audio(audioUrl)
        audio.onended = () => setIsSpeaking(false)
        audio.play().catch(() => {})
      }

      // Background intel extraction every 3 turns
      if (newTurn % 3 === 0) {
        const allText = [...messages, scammerMsg, personaMsg]
          .map(m => `${m.role === 'scammer' ? 'SCAMMER' : selectedPersona.name}: ${m.content}`)
          .join('\n')
        api.cageBaitIntel({ conversationText: allText, userId })
          .then(r => { if (r?.intel) setIntel(r.intel) })
          .catch(() => {})
      }
    } catch (err) {
      setTyping(false)
      toast.error(err.message || 'Failed to get response')
    } finally {
      setLoading(false)
    }
  }

  const handleExtractIntel = async () => {
    if (!messages.length || extractingIntel) return

    const allText = messages
      .map(m => `${m.role === 'scammer' ? 'SCAMMER' : selectedPersona?.name}: ${m.content}`)
      .join('\n')

    setExtractingIntel(true)
    try {
      const res = await api.cageBaitIntel({ conversationText: allText, userId })
      if (res?.intel) {
        setIntel(res.intel)
        toast.success('Intel extracted')
      } else {
        toast('No intel captured yet')
      }
    } catch (err) {
      toast.error(err.message || 'Failed to extract intel')
    } finally {
      setExtractingIntel(false)
    }
  }

  // ── End session ────────────────────────────────────────────────────────────
  const handleEnd = async () => {
    setPhase('ENDED')
    clearInterval(timerRef.current)
    playSound('/sounds/rank-up.mp3')

    try {
      const allText = messages
        .map(m => `${m.role === 'scammer' ? 'SCAMMER' : selectedPersona?.name}: ${m.content}`)
        .join('\n')

      const res = await api.cageBaitEndSession({
        conversationHistory: messages.map(m => ({
          role: m.role === 'scammer' ? 'user' : 'assistant',
          content: m.content,
        })),
        personaId: selectedPersona?.id,
        durationSeconds: elapsed,
        userId,
      })

      // Final intel extraction
      if (allText.length > 50) {
        const intelRes = await api.cageBaitIntel({ conversationText: allText, userId })
        if (intelRes?.intel) setIntel(intelRes.intel)
      }

      setSessionReport({
        elapsed,
        turnCount,
        summary: res.summary || '',
        intel: res.intel || intel,
      })
    } catch (err) {
      setSessionReport({ elapsed, turnCount, summary: 'Session ended.', intel })
    }
  }

  // ── Copy report ────────────────────────────────────────────────────────────
  const handleCopyReport = () => {
    if (!sessionReport) return
    const text = [
      `=== CAGEBAIT SESSION REPORT ===`,
      `Persona: ${selectedPersona?.name}`,
      `Duration: ${formatTime(sessionReport.elapsed)}`,
      `Turns: ${sessionReport.turnCount}`,
      ``,
      sessionReport.summary,
      ``,
      sessionReport.intel ? `Scam Type: ${sessionReport.intel.scamType || 'Unknown'}` : '',
      sessionReport.intel?.redFlags?.length ? `Red Flags: ${sessionReport.intel.redFlags.join(', ')}` : '',
    ].filter(Boolean).join('\n')
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  // ── Reset ──────────────────────────────────────────────────────────────────
  const handleReset = () => {
    setPhase('IDLE')
    setMessages([])
    setTurnCount(0)
    setIntel(null)
    setSessionReport(null)
    setElapsed(0)
    setStartTime(null)
    setSelectedPersona(null)
  }

  // ── Key handler ────────────────────────────────────────────────────────────
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // ── Current phase index ────────────────────────────────────────────────────
  const currentPhaseIdx = getPhase(turnCount)
  const persona = selectedPersona

  // ── Intel graph data ───────────────────────────────────────────────────────
  const { nodes: graphNodes, edges: graphEdges } = buildIntelGraph(intel)

  return (
    <div className="page-wrapper" style={{ background: '#0B0F1A', minHeight: '100vh' }}>
      {/* Scan line overlay */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <div className="cb-scan-line" />
        {/* Grid overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(79,140,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(79,140,255,0.04) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />
      </div>

      <div className="page-content-wide" style={{ position: 'relative', zIndex: 1 }}>

        {/* ── Page Header ─────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ marginBottom: 32 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 52, height: 52, borderRadius: 16,
                background: 'linear-gradient(135deg, #ef4444, #f97316)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 32px rgba(239,68,68,0.4)',
              }}>
                <Bug size={26} color="#fff" />
              </div>
              <div>
                <h1 style={{
                  fontFamily: "'Space Grotesk', system-ui, sans-serif",
                  fontWeight: 800, fontSize: 26, letterSpacing: '-0.03em',
                  background: 'linear-gradient(135deg, #ef4444, #f97316, #f59e0b)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>
                  CageBait
                </h1>
                <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>
                  Scam Honeypot · Intelligence Operations Center
                </p>
              </div>
            </div>

            {/* Status + Timer */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {phase === 'ACTIVE' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  <div className="cb-status-dot" style={{ background: '#10b981' }} />
                  <span aria-live="polite" className="cb-timer">{formatTime(elapsed)}</span>
                </motion.div>
              )}
              {phase === 'ACTIVE' && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleEnd}
                  aria-label="End session"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 16px', borderRadius: 999,
                    background: 'rgba(239,68,68,0.15)',
                    border: '1px solid rgba(239,68,68,0.4)',
                    color: '#ef4444', fontSize: 13, fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <X size={14} /> End Session
                </motion.button>
              )}
              {phase === 'ENDED' && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleReset}
                  aria-label="Start new session"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 16px', borderRadius: 999,
                    background: 'rgba(79,140,255,0.15)',
                    border: '1px solid rgba(79,140,255,0.4)',
                    color: '#4F8CFF', fontSize: 13, fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <Zap size={14} /> New Session
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>


        {/* ── Phase Progress Bar ───────────────────────────────────────────── */}
        {phase === 'ACTIVE' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ marginBottom: 24 }}
          >
            <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
              {PHASE_LABELS.map((label, i) => (
                <div key={label} style={{ flex: 1 }}>
                  <div style={{
                    height: 3, borderRadius: 2,
                    background: i <= currentPhaseIdx
                      ? `linear-gradient(90deg, ${PHASE_COLORS[i]}, ${PHASE_COLORS[Math.min(i + 1, 3)]})`
                      : 'rgba(255,255,255,0.08)',
                    transition: 'background 0.5s ease',
                    boxShadow: i <= currentPhaseIdx ? `0 0 8px ${PHASE_COLORS[i]}66` : 'none',
                  }} />
                  <div style={{
                    fontSize: 10, fontWeight: 700, marginTop: 4,
                    color: i <= currentPhaseIdx ? PHASE_COLORS[i] : 'var(--text3)',
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                    transition: 'color 0.3s',
                  }}>
                    {label}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Shield size={12} color={PHASE_COLORS[currentPhaseIdx]} />
              <span style={{ fontSize: 11, color: 'var(--text3)' }}>
                Turn {turnCount} · Phase {currentPhaseIdx + 1}: {PHASE_LABELS[currentPhaseIdx]}
              </span>
            </div>
          </motion.div>
        )}

        {/* ── IDLE: Persona Selection ──────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {phase === 'IDLE' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              {/* Intro banner */}
              <div className="card" style={{
                padding: '24px 28px', marginBottom: 28,
                background: 'linear-gradient(135deg, rgba(239,68,68,0.08), rgba(249,115,22,0.06))',
                borderColor: 'rgba(239,68,68,0.25)',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                    background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Shield size={20} color="#ef4444" />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text1)', marginBottom: 6 }}>
                      How CageBait Works
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.7 }}>
                      Choose a persona, then paste or type what the scammer says. Your AI persona will respond to waste their time while extracting intelligence. Every conversation is analyzed for phone numbers, bank details, UPI IDs, and scam patterns.
                    </div>
                  </div>
                </div>
              </div>

              {/* Persona cards */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Eye size={14} color="#4F8CFF" />
                  Choose Your Persona
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
                  {PERSONAS.map((p, i) => (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <FloatingPanel
                        glowColor={p.color}
                        className={`cb-persona-card${selectedPersona?.id === p.id ? ' selected' : ''}`}
                        onClick={() => setSelectedPersona(p)}
                        style={{
                          borderColor: selectedPersona?.id === p.id ? p.colorBorder : undefined,
                          background: selectedPersona?.id === p.id
                            ? `linear-gradient(135deg, ${p.colorBg}, rgba(11,15,26,0.8))`
                            : undefined,
                          cursor: 'pointer',
                        }}
                        role="button"
                        tabIndex={0}
                        aria-label={`Select persona ${p.name}`}
                        onKeyDown={(e) => e.key === 'Enter' && setSelectedPersona(p)}
                      >
                        <div
                          className="cb-avatar"
                          style={{ background: p.colorBg, border: `2px solid ${p.colorBorder}` }}
                        >
                          {p.emoji}
                        </div>
                        <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text1)', marginBottom: 4 }}>
                          {p.name}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.5, marginBottom: 12 }}>
                          {p.description}
                        </div>
                        {selectedPersona?.id === p.id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 5,
                              padding: '4px 10px', borderRadius: 999,
                              background: p.colorBg, border: `1px solid ${p.colorBorder}`,
                              fontSize: 11, fontWeight: 700, color: p.color,
                            }}
                          >
                            <Check size={10} /> Selected
                          </motion.div>
                        )}
                      </FloatingPanel>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Start button */}
              <motion.button
                whileHover={{ scale: selectedPersona ? 1.02 : 1 }}
                whileTap={{ scale: selectedPersona ? 0.97 : 1 }}
                onClick={handleStart}
                disabled={!selectedPersona}
                aria-label="Start CageBait session"
                className="btn"
                style={{ maxWidth: 320 }}
              >
                <Zap size={16} />
                Start Session
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>


        {/* ── ACTIVE: Operations Center ────────────────────────────────────── */}
        <AnimatePresence>
          {phase === 'ACTIVE' && (
            <motion.div
              key="active"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16, alignItems: 'start' }}
            >
              {/* Left: Transcript + Input */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Active persona badge */}
                {persona && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 16px', borderRadius: 14,
                      background: `linear-gradient(135deg, ${persona.colorBg}, rgba(11,15,26,0.6))`,
                      border: `1px solid ${persona.colorBorder}`,
                    }}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%', fontSize: 18,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: persona.colorBg, border: `2px solid ${persona.colorBorder}`,
                      flexShrink: 0,
                    }}>
                      {persona.emoji}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text1)' }}>{persona.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text2)' }}>{persona.description}</div>
                    </div>
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <WaveformVisualizer isPlaying={isSpeaking} color={persona.color} barCount={12} height={24} />
                    </div>
                  </motion.div>
                )}

                {/* Transcript */}
                <div
                  ref={transcriptRef}
                  className="card"
                  style={{
                    padding: 20, minHeight: 380, maxHeight: 480,
                    overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12,
                    position: 'relative',
                    background: 'linear-gradient(180deg, rgba(11,15,26,0.98), rgba(11,15,26,0.88))',
                    border: '1px solid rgba(79,140,255,0.18)',
                    boxShadow: '0 20px 60px rgba(2,6,23,0.45)',
                  }}
                >
                  <div style={{
                    position: 'sticky', top: -20, zIndex: 2,
                    margin: '-20px -20px 10px', padding: '14px 18px',
                    background: 'linear-gradient(135deg, rgba(79,140,255,0.16), rgba(168,85,247,0.08), rgba(11,15,26,0.92))',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    backdropFilter: 'blur(16px)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 14px #10b981' }} />
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.72)' }}>
                            Live Transcript
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text2)' }}>
                            Turn {turnCount} · {PHASE_LABELS[currentPhaseIdx]} · {messages.length} messages captured
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <div style={{
                          padding: '6px 10px', borderRadius: 999,
                          background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.24)',
                          color: '#ef4444', fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase',
                        }}>
                          Active bait
                        </div>
                        <div style={{
                          padding: '6px 10px', borderRadius: 999,
                          background: 'rgba(34,211,238,0.10)', border: '1px solid rgba(34,211,238,0.20)',
                          color: '#22d3ee', fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase',
                        }}>
                          Auto intel on
                        </div>
                      </div>
                    </div>
                    <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                      {PHASE_LABELS.map((label, index) => (
                        <div key={label} style={{
                          height: 4,
                          borderRadius: 999,
                          background: index <= currentPhaseIdx
                            ? `linear-gradient(90deg, ${PHASE_COLORS[index]}, ${PHASE_COLORS[Math.min(index + 1, 3)]})`
                            : 'rgba(255,255,255,0.08)',
                          boxShadow: index <= currentPhaseIdx ? `0 0 14px ${PHASE_COLORS[index]}55` : 'none',
                        }} />
                      ))}
                    </div>
                  </div>

                  {messages.length === 0 && (
                    <div style={{
                      flex: 1, display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center', gap: 12,
                      color: 'var(--text3)', fontSize: 13,
                    }}>
                      <div style={{ fontSize: 32 }}>🎭</div>
                      <div>Type what the scammer says to begin</div>
                    </div>
                  )}

                  <AnimatePresence initial={false}>
                    {messages.map((msg, index) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 12, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        style={{
                          display: 'flex',
                          justifyContent: msg.role === 'scammer' ? 'flex-end' : 'flex-start',
                        }}
                      >
                        <div style={{ maxWidth: '82%' }}>
                          <div style={{
                            fontSize: 10, fontWeight: 700, marginBottom: 6,
                            color: msg.role === 'scammer' ? '#ef4444' : persona?.color || '#4F8CFF',
                            textAlign: msg.role === 'scammer' ? 'right' : 'left',
                            textTransform: 'uppercase', letterSpacing: '0.06em',
                          }}>
                            {msg.role === 'scammer' ? '🦹 Scammer' : `🎭 ${persona?.name}`}
                          </div>
                          <div
                            className={msg.role === 'scammer' ? 'cb-msg-scammer' : 'cb-msg-persona card'}
                            style={{
                              position: 'relative',
                              overflow: 'hidden',
                              boxShadow: msg.role === 'scammer'
                                ? '0 8px 24px rgba(239,68,68,0.12)'
                                : '0 10px 30px rgba(79,140,255,0.12)',
                              border: msg.role === 'scammer'
                                ? '1px solid rgba(239,68,68,0.26)'
                                : `1px solid ${persona?.colorBorder || 'rgba(79,140,255,0.24)'}`,
                            }}
                          >
                            <div style={{ fontSize: 13, lineHeight: 1.7 }}>
                              {msg.content}
                            </div>
                            <div style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              gap: 10, marginTop: 10, paddingTop: 10,
                              borderTop: '1px solid rgba(255,255,255,0.05)',
                              fontSize: 10, color: 'var(--text3)',
                            }}>
                              <span>Turn {index + 1}</span>
                              <span>{new Date(Math.max(Number(msg.id) - (msg.role === 'persona' ? 1 : 0), 0)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {/* Typing indicator */}
                  <AnimatePresence>
                    {typing && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        style={{ display: 'flex', justifyContent: 'flex-start' }}
                      >
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 700, marginBottom: 4, color: persona?.color || '#4F8CFF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            🎭 {persona?.name}
                          </div>
                          <div className="cb-typing">
                            <span /><span /><span />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Input row */}
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                  <div style={{ flex: 1, position: 'relative' }}>
                    <textarea
                      ref={inputRef}
                      className="inp"
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Type what the scammer says… (Enter to send)"
                      rows={2}
                      disabled={loading}
                      aria-label="Scammer message input"
                      style={{ resize: 'none', paddingRight: 48 }}
                    />
                  </div>
                  <VoiceMicButton
                    onResult={text => setInput(prev => prev + (prev ? ' ' : '') + text)}
                    aria-label="Voice input"
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSend}
                    disabled={loading || !input.trim()}
                    aria-label="Send message"
                    style={{
                      width: 44, height: 44, borderRadius: 12, border: 'none',
                      background: loading || !input.trim()
                        ? 'rgba(79,140,255,0.2)'
                        : 'linear-gradient(135deg, #4F8CFF, #A855F7)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                      flexShrink: 0,
                      boxShadow: input.trim() ? '0 4px 16px rgba(79,140,255,0.35)' : 'none',
                      transition: 'all 0.2s',
                    }}
                  >
                    {loading
                      ? <div className="spin" />
                      : <Zap size={18} color="#fff" />
                    }
                  </motion.button>
                </div>

                {/* VoiceOrb for hands-free */}
                <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 4 }}>
                  <VoiceOrb
                    onResult={text => {
                      setInput(text)
                      setTimeout(() => handleSend(), 100)
                    }}
                    isSpeaking={isSpeaking}
                    size={56}
                  />
                </div>
              </div>

              {/* Right: Intel Dashboard */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Intel panel */}
                <div className="card" style={{ overflow: 'hidden' }}>
                  <button
                    onClick={() => setIntelOpen(o => !o)}
                    aria-label={intelOpen ? 'Collapse intel dashboard' : 'Expand intel dashboard'}
                    style={{
                      width: '100%', padding: '14px 16px',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      background: 'transparent', border: 'none', cursor: 'pointer',
                      color: 'var(--text1)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="cb-status-dot" style={{ background: intel ? '#10b981' : '#f59e0b' }} />
                      <span style={{ fontSize: 13, fontWeight: 700 }}>Intel Dashboard</span>
                      {intel && (
                        <span style={{
                          fontSize: 10, padding: '2px 8px', borderRadius: 999,
                          background: 'rgba(16,185,129,0.15)', color: '#10b981',
                          border: '1px solid rgba(16,185,129,0.3)', fontWeight: 700,
                        }}>
                          LIVE
                        </span>
                      )}
                    </div>
                    {intelOpen ? <ChevronUp size={16} color="var(--text3)" /> : <ChevronDown size={16} color="var(--text3)" />}
                  </button>

                  <div style={{ padding: '0 16px 16px', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button
                      onClick={handleExtractIntel}
                      disabled={extractingIntel || !messages.length}
                      aria-label="Extract intel from conversation"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '8px 12px', borderRadius: 999,
                        background: extractingIntel ? 'rgba(79,140,255,0.16)' : 'rgba(34,211,238,0.10)',
                        border: '1px solid rgba(34,211,238,0.28)',
                        color: 'var(--text1)', fontSize: 12, fontWeight: 700,
                        cursor: extractingIntel || !messages.length ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {extractingIntel ? <div className="spin" style={{ width: 12, height: 12 }} /> : <Sparkles size={12} />}
                      Extract Intel
                    </button>
                  </div>

                  <AnimatePresence>
                    {intelOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        style={{ overflow: 'hidden' }}
                      >
                        <div style={{ padding: '0 16px 16px' }}>
                          {!intel ? (
                            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text3)', fontSize: 12 }}>
                              <div style={{ fontSize: 24, marginBottom: 8 }}>🔍</div>
                              Intel will appear after 3 turns
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                              {/* Scam type */}
                              {intel.scamType && (
                                <div>
                                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                                    Scam Type
                                  </div>
                                  <div className="cb-intel-chip" style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}>
                                    <Bug size={10} /> {intel.scamType}
                                  </div>
                                </div>
                              )}

                              {/* Intel chips */}
                              {[
                                { key: 'phoneNumbers', icon: Phone, color: '#f97316', label: 'Phones' },
                                { key: 'bankNames', icon: Building, color: '#A855F7', label: 'Banks' },
                                { key: 'upiIds', icon: CreditCard, color: '#f59e0b', label: 'UPI IDs' },
                                { key: 'suspiciousLinks', icon: Link, color: '#ef4444', label: 'Links' },
                                { key: 'companyNames', icon: Building, color: '#4F8CFF', label: 'Companies' },
                              ].map(({ key, icon: Icon, color, label }) => {
                                const items = intel[key]
                                if (!items?.length) return null
                                return (
                                  <div key={key}>
                                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                                      {label}
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                      {items.map((item, i) => (
                                        <motion.div
                                          key={i}
                                          initial={{ opacity: 0, scale: 0.8 }}
                                          animate={{ opacity: 1, scale: 1 }}
                                          transition={{ delay: i * 0.05 }}
                                          className="cb-intel-chip"
                                          style={{
                                            background: `${color}15`,
                                            border: `1px solid ${color}40`,
                                            color,
                                          }}
                                        >
                                          <Icon size={9} /> {item}
                                        </motion.div>
                                      ))}
                                    </div>
                                  </div>
                                )
                              })}

                              {/* Red flags */}
                              {intel.redFlags?.length > 0 && (
                                <div>
                                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                                    Red Flags
                                  </div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                    {intel.redFlags.map((flag, i) => (
                                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 11, color: '#ef4444' }}>
                                        <AlertTriangle size={10} style={{ flexShrink: 0, marginTop: 2 }} />
                                        {flag}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Summary */}
                              {intel.summary && (
                                <div style={{
                                  padding: '10px 12px', borderRadius: 10,
                                  background: 'rgba(34,211,238,0.06)',
                                  border: '1px solid rgba(34,211,238,0.2)',
                                  fontSize: 11, color: 'var(--text2)', lineHeight: 1.6,
                                }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5, color: '#22d3ee', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                    <Eye size={10} /> Summary
                                  </div>
                                  {intel.summary}
                                </div>
                              )}

                              {/* Knowledge graph */}
                              {graphNodes.length > 0 && (
                                <div>
                                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                                    Intel Graph
                                  </div>
                                  <CodeGraphViewer nodes={graphNodes} edges={graphEdges} height={200} />
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Session stats */}
                <div className="card" style={{ padding: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                    Session Stats
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
                    {[
                      { label: 'Turns', value: turnCount, icon: Zap, color: '#4F8CFF' },
                      { label: 'Time', value: formatTime(elapsed), icon: Clock, color: '#f59e0b' },
                      { label: 'Phase', value: PHASE_LABELS[currentPhaseIdx], icon: Flag, color: PHASE_COLORS[currentPhaseIdx] },
                      { label: 'Intel', value: intel ? 'Active' : 'Pending', icon: Eye, color: intel ? '#10b981' : '#94a3b8' },
                    ].map(({ label, value, icon: Icon, color }) => (
                      <div key={label} style={{
                        padding: '10px 12px', borderRadius: 10,
                        background: `${color}0d`, border: `1px solid ${color}25`,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                          <Icon size={10} color={color} />
                          <span style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 800, color, fontFamily: "'JetBrains Mono', monospace" }}>
                          {value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>


        {/* ── ENDED: Session Report Overlay ────────────────────────────────── */}
        <AnimatePresence>
          {phase === 'ENDED' && sessionReport && (
            <motion.div
              key="report"
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            >
              <div className="card" style={{
                padding: 32,
                background: 'linear-gradient(135deg, rgba(79,140,255,0.10), rgba(168,85,247,0.07), rgba(11,15,26,0.95))',
                borderColor: 'rgba(79,140,255,0.32)',
                position: 'relative', overflow: 'hidden',
                boxShadow: '0 28px 80px rgba(2,6,23,0.5)',
              }}>
                {/* Scan line */}
                <div className="cb-scan-line" />

                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'radial-gradient(circle at top left, rgba(79,140,255,0.16), transparent 28%), radial-gradient(circle at top right, rgba(168,85,247,0.12), transparent 22%)',
                  pointerEvents: 'none',
                }} />

                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: 28 }}>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.1 }}
                    style={{ fontSize: 48, marginBottom: 12 }}
                  >
                    🏆
                  </motion.div>
                  <h2 style={{
                    fontFamily: "'Space Grotesk', system-ui, sans-serif",
                    fontWeight: 800, fontSize: 22,
                    background: 'linear-gradient(135deg, #4F8CFF, #A855F7)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text', marginBottom: 6,
                  }}>
                    Session Complete
                  </h2>
                  <p style={{ fontSize: 13, color: 'var(--text2)' }}>
                    {persona?.name} kept the scammer engaged
                  </p>
                </div>

                <div style={{
                  marginBottom: 22, padding: '16px 18px', borderRadius: 16,
                  background: 'rgba(11,15,26,0.58)', border: '1px solid rgba(255,255,255,0.08)',
                  backdropFilter: 'blur(14px)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#22d3ee', marginBottom: 4 }}>
                        Mission Debrief
                      </div>
                      <div style={{ fontSize: 14, color: 'var(--text1)', lineHeight: 1.6 }}>
                        {sessionReport.summary || 'Session closed cleanly.'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <div style={{ padding: '7px 10px', borderRadius: 999, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.24)', color: '#10b981', fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                        Saved
                      </div>
                      <div style={{ padding: '7px 10px', borderRadius: 999, background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.24)', color: '#f59e0b', fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                        {sessionReport.intel ? 'Intel captured' : 'Intel pending'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
                  {[
                    { label: 'Time Wasted', value: formatTime(sessionReport.elapsed), icon: Clock, color: '#f59e0b' },
                    { label: 'Turns', value: sessionReport.turnCount, icon: Zap, color: '#4F8CFF' },
                    { label: 'Intel Items', value: sessionReport.intel
                      ? [
                          ...(sessionReport.intel.phoneNumbers || []),
                          ...(sessionReport.intel.upiIds || []),
                          ...(sessionReport.intel.bankNames || []),
                          ...(sessionReport.intel.companyNames || []),
                        ].length
                      : 0, icon: Eye, color: '#10b981' },
                  ].map(({ label, value, icon: Icon, color }, i) => (
                    <motion.div
                      key={label}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + i * 0.1 }}
                      style={{
                        padding: '16px 12px', borderRadius: 14, textAlign: 'center',
                        background: `${color}0d`, border: `1px solid ${color}30`,
                      }}
                    >
                      <Icon size={18} color={color} style={{ marginBottom: 8 }} />
                      <div style={{ fontSize: 20, fontWeight: 800, color, fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>
                        {value}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        {label}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Summary */}
                {sessionReport.summary && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    style={{
                      padding: '16px 18px', borderRadius: 12, marginBottom: 20,
                      background: 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.2)',
                      fontSize: 13, color: 'var(--text2)', lineHeight: 1.7,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, color: '#22d3ee', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      <Eye size={12} /> Session Summary
                    </div>
                    {sessionReport.summary}
                  </motion.div>
                )}

                {/* Intel summary chips */}
                {sessionReport.intel && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    style={{ marginBottom: 24 }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                      Captured Intel
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {sessionReport.intel.scamType && (
                        <div className="cb-intel-chip" style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}>
                          <Bug size={9} /> {sessionReport.intel.scamType}
                        </div>
                      )}
                      {[
                        ...(sessionReport.intel.phoneNumbers || []).map(v => ({ v, icon: Phone, color: '#f97316' })),
                        ...(sessionReport.intel.upiIds || []).map(v => ({ v, icon: CreditCard, color: '#f59e0b' })),
                        ...(sessionReport.intel.bankNames || []).map(v => ({ v, icon: Building, color: '#A855F7' })),
                      ].map(({ v, icon: Icon, color }, i) => (
                        <div key={i} className="cb-intel-chip" style={{ background: `${color}15`, border: `1px solid ${color}40`, color }}>
                          <Icon size={9} /> {v}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleCopyReport}
                    aria-label="Copy session report"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 7,
                      padding: '10px 20px', borderRadius: 999,
                      background: copied ? 'rgba(16,185,129,0.15)' : 'rgba(79,140,255,0.12)',
                      border: `1px solid ${copied ? 'rgba(16,185,129,0.4)' : 'rgba(79,140,255,0.35)'}`,
                      color: copied ? '#10b981' : '#4F8CFF',
                      fontSize: 13, fontWeight: 700, cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? 'Copied!' : 'Copy Report'}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleReset}
                    aria-label="Start new session"
                    className="btn"
                    style={{ flex: 1, minWidth: 140 }}
                  >
                    <Zap size={14} /> New Session
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  )
}
