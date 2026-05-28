import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bug, Mic, Brain, Shield, BookOpen, Timer, CalendarDays, Languages,
  Radio, BookHeart, Gamepad2, History, Zap, ArrowRight, Sparkles,
  Mail, Send, Users, Code2, Heart, ChevronDown, Activity, Cpu,
  Globe, Lock, ShieldCheck,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '../services/api'
import AiCoreSphere from '../components/AiCoreSphere'
import StarfieldBackground from '../components/StarfieldBackground'
import AIGlobe from '../components/AIGlobe'
import TimeTunnel from '../components/TimeTunnel'
import HolographicCalendar from '../components/HolographicCalendar'
import FloatingPanel from '../components/FloatingPanel'
import AboutSection from '../components/AboutSection'
import { useAdaptiveUI } from '../components/AdaptiveUIContext'
import StreakBadge from '../components/StreakBadge'
import QuoteBar from '../components/QuoteBar'
import { playClickSound, playHoverSound } from '../utils/soundGenerator'

// ── Data ─────────────────────────────────────────────────────────────────────

const pillars = [
  {
    Icon: Bug,
    label: 'CageBait',
    subtitle: 'AI Scam Honeypot',
    desc: 'Deploy AI personas to waste scammers\u2019 time and extract intelligence.',
    path: '/cagebait',
    badge: 'New',
    gradient: 'linear-gradient(135deg,rgba(239,68,68,0.18),rgba(245,158,11,0.10))',
    border: 'rgba(239,68,68,0.35)',
    accent: '#ef4444',
  },
  {
    Icon: ShieldCheck,
    label: 'Verify',
    subtitle: 'Realtime Claim Analysis',
    desc: 'Extract claims, cross-check live sources, and flag contradictions before misinformation spreads.',
    path: '/verification',
    badge: null,
    gradient: 'linear-gradient(135deg,rgba(16,185,129,0.16),rgba(79,140,255,0.10))',
    border: 'rgba(16,185,129,0.35)',
    accent: '#10b981',
  },
  {
    Icon: Bug,
    label: 'CageBait',
    subtitle: 'AI Scam Honeypot',
    desc: 'Deploy AI personas to waste scammers\' time and extract intelligence.',
    path: '/cagebait',
    badge: 'New',
    gradient: 'linear-gradient(135deg,rgba(239,68,68,0.18),rgba(245,158,11,0.10))',
    border: 'rgba(239,68,68,0.35)',
    accent: '#ef4444',
  },
  {
    Icon: Mic,
    label: 'Emotion Voice',
    subtitle: 'Voice Adaptation',
    desc: 'Murf Falcon voices shift based on your detected emotional state.',
    path: '/assistant',
    badge: null,
    gradient: 'linear-gradient(135deg,rgba(168,85,247,0.18),rgba(236,72,153,0.08))',
    border: 'rgba(168,85,247,0.35)',
    accent: '#A855F7',
  },
  {
    Icon: Activity,
    label: 'Memory Graph',
    subtitle: 'Personalized Guidance',
    desc: '10-session memory tracks your patterns for truly personalized AI.',
    path: '/assistant',
    badge: null,
    gradient: 'linear-gradient(135deg,rgba(34,211,238,0.18),rgba(79,140,255,0.08))',
    border: 'rgba(34,211,238,0.35)',
    accent: '#22d3ee',
  },
]

const adaptiveModes = [
  { key: 'debugging', label: 'Debug Mode',   color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.35)' },
  { key: 'learning',  label: 'Learn Mode',   color: '#4F8CFF', bg: 'rgba(79,140,255,0.12)',  border: 'rgba(79,140,255,0.35)' },
  { key: 'exploring', label: 'Explore Mode', color: '#A855F7', bg: 'rgba(168,85,247,0.12)', border: 'rgba(168,85,247,0.35)' },
]

const modeCards = [
  { Icon: ShieldCheck, label: 'Verify',          desc: 'Fact-check text, URLs, screenshots, and transcripts.', color: '#10b981', path: '/verification', badge: 'New' },
  { Icon: Bug,         label: 'CageBait',       desc: 'AI scam honeypot — waste their time.',         color: '#ef4444', path: '/cagebait',   badge: 'New' },
  { Icon: Mic,         label: 'Creator',         desc: 'Scripts, hooks, reels, podcast-ready output.', color: '#22d3ee', path: '/creator',    badge: null },
  { Icon: Brain,       label: 'Assistant',       desc: 'Voice guidance for stress and daily clarity.', color: '#4F8CFF', path: '/assistant',  badge: null },
  { Icon: BookOpen,    label: 'Study',           desc: 'Explain any topic like a teacher.',            color: '#ec4899', path: '/study',      badge: null },
  { Icon: Timer,       label: 'Focus',           desc: 'Structured deep-work with calm voice cues.',   color: '#10b981', path: '/focus',      badge: null },
  { Icon: CalendarDays,label: 'Planner',         desc: 'Turn a goal into a guided day plan.',          color: '#f59e0b', path: '/planner',    badge: null },
  { Icon: Shield,      label: 'Safety',          desc: 'Fast emergency flows with location sharing.',  color: '#ef4444', path: '/safety',     badge: null },
  { Icon: Languages,   label: 'Translator',      desc: 'Translate and hear text in 80+ languages.',   color: '#10b981', path: '/translator', badge: null },
  { Icon: Radio,       label: 'Podcast',         desc: 'Convert articles into a 2-voice podcast.',    color: '#ec4899', path: '/podcast',    badge: null },
  { Icon: BookHeart,   label: 'Journal',         desc: 'Speak your day and get a reflective response.',color: '#8b5cf6', path: '/journal',    badge: null },
  { Icon: Gamepad2,    label: 'Games',           desc: 'Playful challenges for memory and mood.',      color: '#a855f7', path: '/games',      badge: null },
  { Icon: History,     label: 'History',         desc: 'Review sessions, answers, and output.',        color: '#64748b', path: '/history',    badge: null },
]

const stats = [
  { value: '7',    label: 'AI Pillars',     gradient: 'linear-gradient(135deg,#4F8CFF,#A855F7)' },
  { value: '3',    label: 'Murf Personas',  gradient: 'linear-gradient(135deg,#A855F7,#22d3ee)' },
  { value: '80+',  label: 'Languages',      gradient: 'linear-gradient(135deg,#22d3ee,#4F8CFF)' },
  { value: 'Live', label: 'Adaptive Voice', gradient: 'linear-gradient(135deg,#f59e0b,#ef4444)' },
]

const whatsNew = [
  {
    Icon: ShieldCheck,
    label: 'Verify',
    badge: 'New',
    desc: 'Realtime fact verification with claim extraction, live evidence checks, and contradiction scoring.',
    color: '#10b981',
    path: '/verification',
  },
  {
    Icon: Bug,
    label: 'CageBait',
    badge: 'New',
    desc: 'Deploy AI honeypot personas that waste scammers\' time and extract real intelligence.',
    color: '#ef4444',
    path: '/cagebait',
  },
  {
    Icon: Cpu,
    label: 'Cognitive Engine',
    badge: 'New',
    desc: 'Behavioral analysis that adapts voice tone, pacing, and response style in real time.',
    color: '#4F8CFF',
    path: '/assistant',
  },
  {
    Icon: Sparkles,
    label: 'NeuroGlass UI',
    badge: 'New',
    desc: 'Deep-space glassmorphism design system with adaptive CSS variables and 3D tilt cards.',
    color: '#A855F7',
    path: '/assistant',
  },
]

// ── Section entrance variant ──────────────────────────────────────────────────
const sectionVariant = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' } },
}

// ── Main component ────────────────────────────────────────────────────────────
export default function HomeNew() {
  const navigate = useNavigate()
  const { mode, setMode } = useAdaptiveUI()
  const mouseRef = useRef({ x: 0, y: 0 })
  const heroTextRef = useRef(null)
  const [sphereState, setSphereState] = useState('idle')
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' })
  const [contactSending, setContactSending] = useState(false)
  const [contactSent, setContactSent] = useState(false)
  const [parallax, setParallax] = useState({ x: 0, y: 0 })
  const [globeSize, setGlobeSize] = useState(340)

  // Mouse parallax
  useEffect(() => {
    const onMove = (e) => {
      const cx = window.innerWidth / 2
      const cy = window.innerHeight / 2
      setParallax({
        x: ((e.clientX - cx) / cx) * 12,
        y: ((e.clientY - cy) / cy) * 8,
      })
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  // Responsive globe size
  useEffect(() => {
    const update = () => setGlobeSize(window.innerWidth < 768 ? 220 : window.innerWidth < 1024 ? 280 : 340)
    update()
    window.addEventListener('resize', update, { passive: true })
    return () => window.removeEventListener('resize', update)
  }, [])

  // Sphere state cycling on hero interaction
  const cycleSphere = () => {
    const states = ['idle', 'listening', 'processing', 'responding']
    setSphereState(s => {
      const idx = states.indexOf(s)
      return states[(idx + 1) % states.length]
    })
    playClickSound()
  }

  const sendContact = async () => {
    const { name, email, message } = contactForm
    if (!name || !email || !message) { toast.error('Please fill all fields'); return }
    setContactSending(true)
    try {
      await api.sendContact({ name, email, message })
      setContactSent(true)
      setContactForm({ name: '', email: '', message: '' })
      setTimeout(() => setContactSent(false), 3500)
    } catch (err) {
      const hint = err?.hint || err?.message || ''
      toast.error(hint.includes('App Password')
        ? 'Email config error \u2014 contact susantedit@gmail.com directly'
        : 'Failed to send. Try again or email susantedit@gmail.com')
    } finally {
      setContactSending(false)
    }
  }

  // Active mode display info
  const activeModeInfo = adaptiveModes.find(m => m.key === mode) || adaptiveModes[1]

  return (
    <div className="page-wrapper home-page" style={{ background: '#0B0F1A', minHeight: '100vh' }}>
      {/* 3D Starfield — replaces NeuralBackground for premium feel */}
      <StarfieldBackground />

      {/* ── 1. HERO ─────────────────────────────────────────────────────────── */}
      <section
        style={{
          position: 'relative',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px 24px 60px',
          zIndex: 1,
          overflow: 'hidden',
        }}
      >
        {/* Ambient glow blobs */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
          <div style={{ position: 'absolute', top: '10%', left: '15%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle,rgba(79,140,255,0.10),transparent 70%)', filter: 'blur(60px)' }} />
          <div style={{ position: 'absolute', top: '20%', right: '10%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle,rgba(168,85,247,0.08),transparent 70%)', filter: 'blur(60px)' }} />
          <div style={{ position: 'absolute', bottom: '15%', left: '40%', width: 350, height: 350, borderRadius: '50%', background: 'radial-gradient(circle,rgba(34,211,238,0.06),transparent 70%)', filter: 'blur(60px)' }} />
        </div>

        {/* Two-column hero layout: text left, globe right */}
        <div style={{
          position: 'relative', zIndex: 2,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 40,
          alignItems: 'center',
          maxWidth: 1100,
          width: '100%',
        }}>
          {/* Left: Text + CTA */}
          <div
            style={{
              transform: `translate(${parallax.x * 0.4}px, ${parallax.y * 0.3}px)`,
              transition: 'transform 0.1s linear',
            }}
          >
            {/* Animated badge */}
            <motion.div
              initial={{ opacity: 0, y: -16, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '6px 18px', borderRadius: 999,
                background: 'rgba(79,140,255,0.10)',
                border: '1px solid rgba(79,140,255,0.30)',
                fontSize: 12, fontWeight: 700, color: '#4F8CFF',
                letterSpacing: '0.05em', marginBottom: 24,
              }}
            >
              <Sparkles size={12} />
              Powered by Murf Falcon &middot; Buildathon May 2026
            </motion.div>

            {/* H1 */}
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.2 }}
              style={{
                fontFamily: "'Space Grotesk', system-ui, sans-serif",
                fontWeight: 900,
                fontSize: 'clamp(2rem, 4.5vw, 3.6rem)',
                lineHeight: 1.08,
                letterSpacing: '-0.04em',
                marginBottom: 20,
              }}
            >
              <span className="grad-text-2">Adaptive Voice</span>
              <br />
              <span style={{ color: '#f0f4ff' }}>Intelligence Platform</span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.32 }}
              style={{
                fontSize: 'clamp(13px, 1.6vw, 16px)',
                color: '#94a3b8',
                lineHeight: 1.75,
                maxWidth: 520,
                marginBottom: 32,
              }}
            >
              One platform that listens, adapts, and responds &mdash; from scam defense to cognitive coaching,
              all driven by Murf Falcon&apos;s voice intelligence.
            </motion.p>

            {/* CTA buttons */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.44 }}
              style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 28 }}
            >
              <motion.button
                className="btn"
                style={{ width: 'auto', paddingInline: 28, fontSize: 15, background: 'linear-gradient(135deg,#ef4444,#f59e0b)' }}
                whileHover={{ scale: 1.04, boxShadow: '0 12px 40px rgba(239,68,68,0.45)' }}
                whileTap={{ scale: 0.97 }}
                onClick={() => { playClickSound(); navigate('/cagebait') }}
                onHoverStart={playHoverSound}
              >
                <Bug size={16} /> Launch CageBait
              </motion.button>
              <motion.button
                className="btn"
                style={{ width: 'auto', paddingInline: 28, fontSize: 15 }}
                whileHover={{ scale: 1.04, boxShadow: '0 12px 40px rgba(79,140,255,0.50)' }}
                whileTap={{ scale: 0.97 }}
                onClick={() => { playClickSound(); navigate('/assistant') }}
                onHoverStart={playHoverSound}
              >
                <Brain size={16} /> Try Assistant
              </motion.button>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
              <StreakBadge />
            </motion.div>
          </div>

          {/* Right: AI Globe */}
          <motion.div
            initial={{ opacity: 0, scale: 0.7, x: 40 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 1.0, delay: 0.2, type: 'spring', stiffness: 60 }}
            style={{
              transform: `translate(${parallax.x * 0.8}px, ${parallax.y * 0.5}px)`,
              transition: 'transform 0.12s linear',
              flexShrink: 0,
            }}
          >
            <AIGlobe size={globeSize} />
          </motion.div>
        </div>

        {/* AiCoreSphere below — smaller, interactive */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          style={{
            position: 'relative', zIndex: 2,
            marginTop: 48,
            cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
          }}
          onClick={cycleSphere}
          title="Click to cycle AI state"
        >
          <AiCoreSphere state={sphereState} size={120} />
          <div style={{ fontSize: 10, color: '#4a5568', letterSpacing: '0.08em' }}>
            click to interact
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          style={{
            position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            color: '#4a5568', fontSize: 11, letterSpacing: '0.08em', zIndex: 2,
          }}
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        >
          <span>scroll</span>
          <ChevronDown size={16} />
        </motion.div>
      </section>

      {/* ── 2. STATS STRIP ──────────────────────────────────────────────────── */}
      <motion.section
        variants={sectionVariant} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}
        style={{ position: 'relative', zIndex: 1, padding: '0 24px 80px' }}
      >
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
          {stats.map(({ value, label, gradient }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.1 }}
            >
              <FloatingPanel style={{ padding: '20px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: 'clamp(1.6rem,3vw,2.4rem)', fontWeight: 900, fontFamily: "'Space Grotesk',system-ui,sans-serif", background: gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginBottom: 6 }}>
                  {value}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
              </FloatingPanel>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ── 3. PLATFORM PILLARS ─────────────────────────────────────────────── */}
      <motion.section
        variants={sectionVariant} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}
        style={{ position: 'relative', zIndex: 1, padding: '0 24px 100px' }}
      >
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 16px', borderRadius: 999, background: 'rgba(79,140,255,0.10)', border: '1px solid rgba(79,140,255,0.25)', fontSize: 12, fontWeight: 700, color: '#4F8CFF', marginBottom: 16 }}>
              <Cpu size={12} /> Platform Pillars
            </div>
            <h2 style={{ fontFamily: "'Space Grotesk',system-ui,sans-serif", fontWeight: 800, fontSize: 'clamp(1.6rem,3vw,2.4rem)', letterSpacing: '-0.03em', color: '#f0f4ff', marginBottom: 12 }}>
              Five systems. One platform.
            </h2>
            <p style={{ fontSize: 14, color: '#94a3b8', maxWidth: 520, margin: '0 auto', lineHeight: 1.7 }}>
              Every pillar is powered by Murf Falcon voice intelligence and adapts to your behavior in real time.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 20 }}>
            {pillars.map(({ Icon, label, subtitle, desc, path, badge, gradient, border, accent }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.12 }}
              >
                <FloatingPanel
                  glowColor={accent}
                  style={{ padding: 24, cursor: 'pointer', background: gradient, borderColor: border, height: '100%' }}
                  onClick={() => { playClickSound(); navigate(path) }}
                  onMouseEnter={playHoverSound}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 14, background: `${accent}20`, border: `1px solid ${accent}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={22} color={accent} />
                    </div>
                    {badge && (
                      <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 999, background: `${accent}20`, color: accent, border: `1px solid ${accent}40`, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        {badge}
                      </span>
                    )}
                  </div>
                  <div style={{ fontFamily: "'Space Grotesk',system-ui,sans-serif", fontWeight: 700, fontSize: 16, color: '#f0f4ff', marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: accent, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{subtitle}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6, marginBottom: 14 }}>{desc}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: accent }}>
                    Explore <ArrowRight size={12} />
                  </div>
                </FloatingPanel>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ── 4. HOW IT WORKS ─────────────────────────────────────────────────── */}
      <motion.section
        variants={sectionVariant} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}
        style={{ position: 'relative', zIndex: 1, padding: '0 24px 100px' }}
      >
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 16px', borderRadius: 999, background: 'rgba(168,85,247,0.10)', border: '1px solid rgba(168,85,247,0.25)', fontSize: 12, fontWeight: 700, color: '#A855F7', marginBottom: 16 }}>
              <Activity size={12} /> How It Works
            </div>
            <h2 style={{ fontFamily: "'Space Grotesk',system-ui,sans-serif", fontWeight: 800, fontSize: 'clamp(1.6rem,3vw,2.4rem)', letterSpacing: '-0.03em', color: '#f0f4ff' }}>
              The cognitive loop
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 16, position: 'relative' }}>
            {/* Connecting line */}
            <div style={{ position: 'absolute', top: 36, left: '12%', right: '12%', height: 2, background: 'linear-gradient(90deg,#4F8CFF,#A855F7,#22d3ee,#f59e0b)', opacity: 0.25, zIndex: 0, display: 'none' }} className="how-line" />
            {howItWorks.map(({ Icon, label, desc, color }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.15 }}
              >
                <FloatingPanel glowColor={color} style={{ padding: 22, textAlign: 'center', position: 'relative', zIndex: 1 }}>
                  <div style={{ width: 52, height: 52, borderRadius: '50%', background: `${color}18`, border: `2px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', boxShadow: `0 0 20px ${color}30` }}>
                    <Icon size={24} color={color} />
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 800, color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                    Step {i + 1}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#f0f4ff', marginBottom: 8 }}>{label}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6 }}>{desc}</div>
                </FloatingPanel>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ── 5. ADAPTIVE UI DEMO ─────────────────────────────────────────────── */}
      <motion.section
        variants={sectionVariant} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}
        style={{ position: 'relative', zIndex: 1, padding: '0 24px 100px' }}
      >
        <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 16px', borderRadius: 999, background: 'rgba(34,211,238,0.10)', border: '1px solid rgba(34,211,238,0.25)', fontSize: 12, fontWeight: 700, color: '#22d3ee', marginBottom: 16 }}>
            <Sparkles size={12} /> Live Demo
          </div>
          <h2 style={{ fontFamily: "'Space Grotesk',system-ui,sans-serif", fontWeight: 800, fontSize: 'clamp(1.6rem,3vw,2.4rem)', letterSpacing: '-0.03em', color: '#f0f4ff', marginBottom: 12 }}>
            Adaptive UI — watch it change
          </h2>
          <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.7, marginBottom: 32 }}>
            The entire platform palette shifts based on context. Click a mode to see it live.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 28 }}>
            {adaptiveModes.map(({ key, label, color, bg, border }) => (
              <motion.button
                key={key}
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { setMode(key); playClickSound() }}
                style={{
                  padding: '10px 22px', borderRadius: 999, cursor: 'pointer',
                  background: mode === key ? bg : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${mode === key ? border : 'rgba(255,255,255,0.10)'}`,
                  color: mode === key ? color : '#94a3b8',
                  fontSize: 13, fontWeight: 700,
                  transition: 'all 0.25s',
                  boxShadow: mode === key ? `0 0 20px ${color}30` : 'none',
                }}
              >
                {label}
              </motion.button>
            ))}
            <motion.button
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { setMode('default'); playClickSound() }}
              style={{
                padding: '10px 22px', borderRadius: 999, cursor: 'pointer',
                background: mode === 'default' ? 'rgba(79,140,255,0.12)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${mode === 'default' ? 'rgba(79,140,255,0.35)' : 'rgba(255,255,255,0.10)'}`,
                color: mode === 'default' ? '#4F8CFF' : '#94a3b8',
                fontSize: 13, fontWeight: 700, transition: 'all 0.25s',
              }}
            >
              Reset
            </motion.button>
          </div>
          <FloatingPanel glowColor={activeModeInfo.color} style={{ padding: 20, background: activeModeInfo.bg, borderColor: activeModeInfo.border }}>
            <div style={{ fontSize: 13, color: activeModeInfo.color, fontWeight: 700, marginBottom: 6 }}>
              Active: {activeModeInfo.label}
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6 }}>
              CSS variables are being overridden in real time. Every card, button, and border on this page now uses the {activeModeInfo.label.toLowerCase()} palette.
            </div>
          </FloatingPanel>
        </div>
      </motion.section>

      {/* ── 6. WHAT'S NEW ───────────────────────────────────────────────────── */}
      <motion.section
        variants={sectionVariant} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}
        style={{ position: 'relative', zIndex: 1, padding: '0 24px 100px' }}
      >
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 16px', borderRadius: 999, background: 'rgba(245,158,11,0.10)', border: '1px solid rgba(245,158,11,0.25)', fontSize: 12, fontWeight: 700, color: '#f59e0b', marginBottom: 16 }}>
              <Sparkles size={12} /> What&apos;s New
            </div>
            <h2 style={{ fontFamily: "'Space Grotesk',system-ui,sans-serif", fontWeight: 800, fontSize: 'clamp(1.6rem,3vw,2.4rem)', letterSpacing: '-0.03em', color: '#f0f4ff' }}>
              Latest upgrades
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 18 }}>
            {whatsNew.map(({ Icon, label, badge, desc, color, path }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.12 }}
              >
                <FloatingPanel
                  glowColor={color}
                  style={{ padding: 22, cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
                  onClick={() => { playClickSound(); navigate(path) }}
                >
                  <div style={{ position: 'absolute', top: 14, right: 14, fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 999, background: `${color}20`, color, border: `1px solid ${color}40`, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {badge}
                  </div>
                  <div style={{ width: 42, height: 42, borderRadius: 13, background: `${color}18`, border: `1px solid ${color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                    <Icon size={20} color={color} />
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#f0f4ff', marginBottom: 8 }}>{label}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6, marginBottom: 14 }}>{desc}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color }}>
                    Try it <ArrowRight size={11} />
                  </div>
                </FloatingPanel>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ── 7. ALL MODES GRID ───────────────────────────────────────────────── */}
      <motion.section
        variants={sectionVariant} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}
        style={{ position: 'relative', zIndex: 1, padding: '0 24px 100px' }}
      >
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2 style={{ fontFamily: "'Space Grotesk',system-ui,sans-serif", fontWeight: 800, fontSize: 'clamp(1.6rem,3vw,2.4rem)', letterSpacing: '-0.03em', color: '#f0f4ff', marginBottom: 10 }}>
              All Modes
            </h2>
            <p style={{ fontSize: 14, color: '#94a3b8' }}>Every tool in the platform, one click away.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 14 }}>
            {modeCards.map(({ Icon, label, desc, color, path, badge }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.05 }}
              >
                <FloatingPanel
                  glowColor={color}
                  style={{ padding: 20, cursor: 'pointer', position: 'relative' }}
                  onClick={() => { playClickSound(); navigate(path) }}
                  onMouseEnter={playHoverSound}
                >
                  {badge && (
                    <div style={{ position: 'absolute', top: 12, right: 12, fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 999, background: `${color}20`, color, border: `1px solid ${color}40`, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {badge}
                    </div>
                  )}
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: `${color}18`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                    <Icon size={20} color={color} />
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#f0f4ff', marginBottom: 5 }}>{label}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.55, marginBottom: 12 }}>{desc}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, color }}>
                    Open <ArrowRight size={11} />
                  </div>
                </FloatingPanel>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ── 8. TIME TUNNEL — Session History ────────────────────────────────── */}
      <motion.section
        variants={sectionVariant} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}
        style={{ position: 'relative', zIndex: 1, padding: '0 24px 100px' }}
      >
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 16px', borderRadius: 999, background: 'rgba(34,211,238,0.10)', border: '1px solid rgba(34,211,238,0.25)', fontSize: 12, fontWeight: 700, color: '#22d3ee', marginBottom: 16 }}>
              <History size={12} /> Time Machine
            </div>
            <h2 style={{ fontFamily: "'Space Grotesk',system-ui,sans-serif", fontWeight: 800, fontSize: 'clamp(1.6rem,3vw,2.4rem)', letterSpacing: '-0.03em', color: '#f0f4ff', marginBottom: 10 }}>
              Session Timeline
            </h2>
            <p style={{ fontSize: 14, color: '#94a3b8', maxWidth: 480, margin: '0 auto' }}>
              Travel through your AI session history. Each node is a conversation, a decision, a moment of intelligence.
            </p>
          </div>
          <FloatingPanel glowColor="#22d3ee" style={{ padding: 24 }}>
            <TimeTunnel />
          </FloatingPanel>
        </div>
      </motion.section>

      {/* ── 9. HOLOGRAPHIC CALENDAR ─────────────────────────────────────────── */}
      <motion.section
        variants={sectionVariant} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}
        style={{ position: 'relative', zIndex: 1, padding: '0 24px 100px' }}
      >
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24, alignItems: 'start' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 16px', borderRadius: 999, background: 'rgba(168,85,247,0.10)', border: '1px solid rgba(168,85,247,0.25)', fontSize: 12, fontWeight: 700, color: '#A855F7', marginBottom: 16 }}>
              <CalendarDays size={12} /> Holographic Planner
            </div>
            <h2 style={{ fontFamily: "'Space Grotesk',system-ui,sans-serif", fontWeight: 800, fontSize: 'clamp(1.4rem,2.5vw,2rem)', letterSpacing: '-0.03em', color: '#f0f4ff', marginBottom: 12 }}>
              Tasks float in space
            </h2>
            <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.7, marginBottom: 20 }}>
              Priority-coded tasks glow with neon intensity. High-priority items pulse red. Your planner adapts to your cognitive state.
            </p>
            <motion.button
              className="btn"
              style={{ width: 'auto', paddingInline: 24 }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => { playClickSound(); navigate('/planner') }}
            >
              <CalendarDays size={14} /> Open Planner
            </motion.button>
          </div>
          <FloatingPanel glowColor="#A855F7" style={{ padding: 20 }}>
            <HolographicCalendar />
          </FloatingPanel>
        </div>
      </motion.section>

      {/* ── 10. ABOUT SECTION ───────────────────────────────────────────────── */}
      <AboutSection />

      {/* ── 11. CONTACT ─────────────────────────────────────────────────────── */}
      <motion.section
        variants={sectionVariant} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}
        style={{ position: 'relative', zIndex: 1, padding: '0 24px 120px' }}
      >
        <div style={{ maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontFamily: "'Space Grotesk',system-ui,sans-serif", fontWeight: 800, fontSize: 'clamp(1.4rem,2.5vw,2rem)', letterSpacing: '-0.03em', color: '#f0f4ff', marginBottom: 8 }}>
            Get in Touch
          </h2>
          <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 28 }}>
            Feedback, ideas, or collaboration? Send a message.
          </p>
          <FloatingPanel style={{ padding: 28 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>Name</label>
                  <input type="text" placeholder="Your name" value={contactForm.name} onChange={e => setContactForm(f => ({ ...f, name: e.target.value }))} className="inp" style={{ fontSize: 13 }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>Email</label>
                  <input type="email" placeholder="your@email.com" value={contactForm.email} onChange={e => setContactForm(f => ({ ...f, email: e.target.value }))} className="inp" style={{ fontSize: 13 }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>Message</label>
                <textarea placeholder="Your feedback or idea..." value={contactForm.message} onChange={e => setContactForm(f => ({ ...f, message: e.target.value }))} rows={4} className="inp" style={{ fontSize: 13, resize: 'vertical' }} />
              </div>
              <AnimatePresence mode="wait">
                {contactSent ? (
                  <motion.div key="sent" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 14, borderRadius: 12, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.35)' }}>
                    <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M2 7l4 4 6-6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#10b981' }}>Message sent!</div>
                      <div style={{ fontSize: 11, color: 'var(--text3)' }}>We&apos;ll get back to you soon.</div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.button key="btn" onClick={sendContact} disabled={contactSending} className="btn"
                    style={{ background: contactSending ? 'var(--glass)' : undefined, border: contactSending ? '1px solid var(--border)' : 'none', color: contactSending ? 'var(--text2)' : '#fff', cursor: contactSending ? 'not-allowed' : 'pointer' }}>
                    {contactSending ? (
                      <><div className="spin" /> Sending...</>
                    ) : (
                      <><Send size={14} /> Send Message</>
                    )}
                  </motion.button>
                )}
              </AnimatePresence>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, justifyContent: 'center', paddingTop: 4 }}>
                <Mail size={12} color="var(--text3)" />
                <span style={{ fontSize: 12, color: 'var(--text3)' }}>susantedit@gmail.com</span>
              </div>
            </div>
          </FloatingPanel>
        </div>
      </motion.section>

      {/* ── 9. FOOTER ───────────────────────────────────────────────────────── */}
      <footer style={{ position: 'relative', zIndex: 1, padding: '24px', textAlign: 'center', borderTop: '1px solid rgba(79,140,255,0.10)' }}>
        <div style={{ fontSize: 12, color: '#4a5568' }}>
          Built for Murf Falcon Buildathon May 2026 &middot; Powered by{' '}
          <span style={{ color: '#4F8CFF', fontWeight: 700 }}>Murf Falcon TTS</span>
          {' '}&middot;{' '}
          <span style={{ color: '#A855F7', fontWeight: 700 }}>Groq AI</span>
          {' '}&middot;{' '}
          <span style={{ color: '#22d3ee', fontWeight: 700 }}>React + Vite</span>
        </div>
      </footer>

    </div>
  )
}
