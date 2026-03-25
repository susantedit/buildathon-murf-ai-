import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, ArrowRight, Sparkles, Mail, Send, Radio, Shield, Users, Code2, Heart, Mic, Brain, BookOpen, Timer, CalendarDays, Languages, BookHeart, Gamepad2, History } from 'lucide-react'
import { playHoverSound, playClickSound } from '../utils/soundGenerator'
import { api } from '../services/api'
import toast from 'react-hot-toast'
import StreakBadge from '../components/StreakBadge'
import QuoteBar from '../components/QuoteBar'

const modes = [
  { Icon: Mic,          label: 'Creator Mode',        desc: 'Scripts & voice for reels, YouTube, podcasts',   color: '#8b5cf6', path: '/creator' },
  { Icon: Brain,        label: 'Life Assistant',       desc: 'AI voice guidance for stress, decisions & life',  color: '#3b82f6', path: '/assistant' },
  { Icon: BookOpen,     label: 'Study Mode',           desc: 'Voice explanations for any topic like a teacher', color: '#c084fc', path: '/study' },
  { Icon: Timer,        label: 'Focus Mode',           desc: 'Guided timer sessions to keep you in flow',       color: '#10b981', path: '/focus' },
  { Icon: CalendarDays, label: 'Productivity Planner', desc: 'Set a goal, get a voice-guided daily plan',       color: '#f59e0b', path: '/planner' },
  { Icon: Shield,       label: 'Safety Guardian',      desc: 'Voice-powered emergency assistance for women',    color: '#ef4444', path: '/safety' },
  { Icon: Languages,    label: 'Voice Translator',     desc: 'Translate text into native speech across 80+ languages', color: '#10b981', path: '/translator' },
  { Icon: Radio,        label: 'Podcast Studio',       desc: 'Turn URLs, PDFs & prompts into multi-voice podcasts', color: '#ec4899', path: '/podcast' },
  { Icon: BookHeart,    label: 'Voice Journal',        desc: 'Speak your daily entry, AI reflects it back',    color: '#ec4899', path: '/journal' },
  { Icon: Gamepad2,     label: 'Brain Games',          desc: 'Quiz, debate, speed reading, riddles & mood',     color: '#8b5cf6', path: '/games' },
  { Icon: History,      label: 'History',              desc: 'Review all your past sessions and responses',     color: '#64748b', path: '/history' },
]

const chips = ['Focus tips', 'Exam stress', 'Motivational reel', 'Explain quantum physics', 'Daily plan', 'I feel overwhelmed']

// Multilingual welcome words
const welcomeWords = [
  { text: 'Welcome',      lang: 'English',    color: '#8b5cf6' },
  { text: 'स्वागत छ',      lang: 'Nepali',     color: '#ef4444' },
  { text: 'स्वागत है',      lang: 'Hindi',      color: '#f59e0b' },
  { text: 'Bienvenido',   lang: 'Spanish',    color: '#10b981' },
  { text: 'Bienvenue',    lang: 'French',     color: '#3b82f6' },
  { text: 'مرحباً',        lang: 'Arabic',     color: '#ec4899' },
  { text: 'ようこそ',       lang: 'Japanese',   color: '#8b5cf6' },
  { text: 'Willkommen',   lang: 'German',     color: '#f59e0b' },
  { text: '환영합니다',     lang: 'Korean',     color: '#10b981' },
  { text: 'Benvenuto',    lang: 'Italian',    color: '#3b82f6' },
  { text: 'Добро пожаловать', lang: 'Russian', color: '#ef4444' },
  { text: '欢迎',          lang: 'Chinese',    color: '#ec4899' },
  { text: 'Bem-vindo',    lang: 'Portuguese', color: '#8b5cf6' },
  { text: 'خوش آمدید',    lang: 'Persian',    color: '#f59e0b' },
  { text: 'Selamat datang', lang: 'Malay',    color: '#10b981' },
]

export default function Home() {
  const [input, setInput] = useState('')
  const [welcomeIdx, setWelcomeIdx] = useState(0)
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' })
  const navigate = useNavigate()

  // Cycle through welcome words
  useEffect(() => {
    const interval = setInterval(() => {
      setWelcomeIdx(i => (i + 1) % welcomeWords.length)
    }, 1800)
    return () => clearInterval(interval)
  }, [])

  const [contactSending, setContactSending] = useState(false)
  const [contactSent, setContactSent] = useState(false)

  const sendContact = async () => {
    const { name, email, message } = contactForm
    if (!name || !email || !message) {
      toast.error('Please fill all fields')
      return
    }
    setContactSending(true)
    try {
      await api.sendContact({ name, email, message })
      setContactSent(true)
      setContactForm({ name: '', email: '', message: '' })
      setTimeout(() => setContactSent(false), 4000)
    } catch (err) {
      const hint = err?.hint || err?.message || ''
      toast.error(hint.includes('App Password') ? 'Email config error — contact susantedit@gmail.com directly' : 'Failed to send. Try again or email susantedit@gmail.com')
    } finally {
      setContactSending(false)
    }
  }

  const current = welcomeWords[welcomeIdx]

  return (
    <div className="page-wrapper">
      <div className="page-content-wide">

        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          style={{ textAlign: 'center', paddingBottom: 40 }}>

          {/* Logo — same as navbar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 20 }}>
            <div className="nav-logo-icon" style={{ width: 44, height: 44, borderRadius: 14 }}>
              <span style={{ fontSize: 22, fontWeight: 900, color: '#fff', fontFamily: 'Syne,system-ui,sans-serif', letterSpacing: -1 }}>V</span>
            </div>
            <span style={{ fontSize: 22, fontWeight: 800, fontFamily: 'Syne,system-ui,sans-serif', color: 'var(--text1)', letterSpacing: '-0.02em' }}>Vortex Voice AI</span>
          </div>

          <div className="badge" style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.28)', color: '#8b5cf6', marginBottom: 20 }}>
            <Sparkles size={13} /> Voice-First AI Platform · Powered by Murf Falcon
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <StreakBadge />
          </div>

          {/* Multilingual Welcome */}
          <div style={{ marginBottom: 16, height: 56, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={welcomeIdx}
                initial={{ opacity: 0, y: 16, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -16, scale: 0.92 }}
                transition={{ duration: 0.4 }}
                style={{ textAlign: 'center' }}
              >
                <div style={{
                  fontSize: 'clamp(1.6rem, 4vw, 2.8rem)',
                  fontWeight: 800,
                  fontFamily: 'Syne, system-ui, sans-serif',
                  color: current.color,
                  letterSpacing: '-0.02em',
                  lineHeight: 1.1
                }}>
                  {current.text}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  {current.lang}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <h1 style={{ fontFamily: 'Syne,system-ui,sans-serif', fontWeight: 800, fontSize: 'clamp(2rem,4.5vw,3.4rem)', lineHeight: 1.1, color: 'var(--text1)', marginBottom: 16, position: 'relative', letterSpacing: '-0.02em' }}>
            Create<span style={{ color: 'var(--text2)' }}>.</span> Learn<span style={{ color: 'var(--text2)' }}>.</span> Grow<span style={{ color: 'var(--text2)' }}>.</span>
            <br />
            <span style={{ background: 'linear-gradient(135deg,#8b5cf6,#3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>with AI Voice</span>
          </h1>

          <p style={{ fontSize: 15, color: 'var(--text2)', maxWidth: 520, margin: '0 auto 28px', lineHeight: 1.7, fontWeight: 500 }}>
            Your AI-powered assistant for content, learning, and life.
          </p>

          {/* Input */}
          <div style={{ position: 'relative', maxWidth: 620, margin: '0 auto 16px' }}>
            <textarea value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && input.trim()) { e.preventDefault(); navigate('/assistant', { state: { input } }) } }}
              placeholder="Type your idea, problem, or topic..."
              rows={3} className="inp" style={{ paddingRight: 110, fontSize: 15 }} />
            <button className="btn" onClick={() => input.trim() && navigate('/assistant', { state: { input } })}
              style={{ position: 'absolute', right: 10, bottom: 10, width: 'auto', padding: '9px 18px', fontSize: 13, borderRadius: 10 }}>
              <Zap size={14} /> Go
            </button>
          </div>

          {/* Chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
            {chips.map(c => <button key={c} className="chip" onClick={() => setInput(c)}>{c}</button>)}
          </div>

          {/* Try Demo button */}
          <motion.button
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/assistant', { state: { input: "I'm feeling overwhelmed with my studies and can't focus. Help me make a plan." } })}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 22px', borderRadius: 24, border: '1px solid rgba(139,92,246,0.4)', background: 'rgba(139,92,246,0.1)', color: '#8b5cf6', fontSize: 13, fontWeight: 700, cursor: 'pointer', marginBottom: 28 }}>
            <Zap size={14} /> Try Demo — see it in action
          </motion.button>

          <QuoteBar section="home" color="#8b5cf6" />
        </motion.div>

        {/* Mode cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 16 }}>
          {modes.map(({ Icon, label, desc, color, path }, i) => (
            <motion.div key={label} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.07 }}
              whileHover={{ scale: 1.03, y: -4 }}
              onHoverStart={() => playHoverSound()}
              onClick={() => { playClickSound(); navigate(path) }}
              className="card"
              style={{ padding: 22, cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', transition: 'box-shadow 0.3s' }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', background: color + '18', border: `1px solid ${color}35`, marginBottom: 14 }}>
                <Icon size={22} color={color} />
              </div>
              <div style={{ fontFamily: 'Syne,system-ui,sans-serif', fontWeight: 600, fontSize: 15, color: 'var(--text1)', marginBottom: 6 }}>{label}</div>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 14, lineHeight: 1.55 }}>{desc}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color }}>Open <ArrowRight size={12} /></div>
            </motion.div>
          ))}
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginTop: 28, marginBottom: 48 }}>
          {[['10+','AI Modes'],['80+ Languages','Voice Translation'],['100%','Free to Use']].map(([v,l]) => (
            <div key={l} className="card" style={{ padding: '16px 8px', textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 4, background: 'linear-gradient(135deg,#8b5cf6,#3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontFamily: 'Syne,system-ui,sans-serif' }}>{v}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>{l}</div>
            </div>
          ))}
        </div>

        {/* What's New */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} style={{ marginBottom: 48 }}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div className="badge" style={{ background: 'rgba(236,72,153,0.12)', border: '1px solid rgba(236,72,153,0.28)', color: '#ec4899', marginBottom: 10 }}>
              <Sparkles size={12} /> What's New
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'Syne,system-ui,sans-serif', color: 'var(--text1)' }}>Latest Features</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 14 }}>
            {[
              { icon: <Radio size={20} color="#ec4899" />, color: '#ec4899', title: 'Podcast Studio', desc: 'Turn any URL, PDF, or prompt into a multi-voice podcast with RAG chat.', path: '/podcast', badge: 'New' },
              { icon: <Languages size={20} color="#10b981" />, color: '#10b981', title: 'Voice Translator', desc: 'Translate and hear your text in 80+ languages including Nepali.', path: '/translator', badge: 'Upgraded' },
              { icon: <Shield size={20} color="#ef4444" />, color: '#ef4444', title: 'Safety Guardian', desc: 'Emergency alerts with live location sent to your trusted contacts.', path: '/safety', badge: 'Enhanced' },
            ].map(({ icon, color, title, desc, path, badge }) => (
              <motion.div key={title} whileHover={{ scale: 1.03, y: -3 }} onClick={() => navigate(path)}
                className="card" style={{ padding: 20, cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 12, right: 12, fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: color + '20', color, border: `1px solid ${color}40` }}>{badge}</div>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: color + '15', border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>{icon}</div>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text1)', marginBottom: 6 }}>{title}</div>
                <div style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.55 }}>{desc}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color, marginTop: 12 }}>Try it <ArrowRight size={11} /></div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* About Us */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} style={{ marginBottom: 48 }}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div className="badge" style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.28)', color: '#3b82f6', marginBottom: 10 }}>
              <Heart size={12} /> About Us
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'Syne,system-ui,sans-serif', color: 'var(--text1)', marginBottom: 8 }}>Built with purpose</div>
            <div style={{ fontSize: 13, color: 'var(--text2)', maxWidth: 480, margin: '0 auto', lineHeight: 1.7 }}>
              Vortex Voice AI was built to make AI accessible, multilingual, and genuinely useful — from content creators to students to anyone who needs a voice in an emergency.
            </div>
          </div>
          <div className="card" style={{ padding: 28, maxWidth: 680, margin: '0 auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
              {[
                { icon: <Users size={18} color="#8b5cf6" />, title: 'Built for Everyone', desc: 'Students, creators, professionals, and people in need of safety tools.' },
                { icon: <Languages size={18} color="#10b981" />, title: 'Multilingual First', desc: 'Designed with Nepali and 80+ languages at the core, not as an afterthought.' },
                { icon: <Shield size={18} color="#ef4444" />, title: 'Safety Focused', desc: 'Real emergency alerts with live GPS location sent to trusted contacts.' },
                { icon: <Code2 size={18} color="#3b82f6" />, title: 'Open & Modern Stack', desc: 'React, Node.js, Groq AI, Murf TTS, Firebase Auth, MongoDB.' },
              ].map(({ icon, title, desc }) => (
                <div key={title} style={{ display: 'flex', gap: 12 }}>
                  <div style={{ flexShrink: 0, marginTop: 2 }}>{icon}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text1)', marginBottom: 4 }}>{title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.55 }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20, display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
              {['React', 'Node.js', 'Groq AI', 'Murf TTS', 'Firebase', 'MongoDB', 'Netlify', 'Render'].map(tech => (
                <span key={tech} style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20, background: 'var(--glass)', border: '1px solid var(--border)', color: 'var(--text2)' }}>{tech}</span>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Inspired By */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }} style={{ marginBottom: 48 }}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div className="badge" style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.28)', color: '#f59e0b', marginBottom: 10 }}>
              <Heart size={12} /> Inspired By
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'Syne,system-ui,sans-serif', color: 'var(--text1)', marginBottom: 8 }}>
              Standing on great shoulders
            </div>
            <div style={{ fontSize: 13, color: 'var(--text2)', maxWidth: 460, margin: '0 auto', lineHeight: 1.7 }}>
              These builders in the same hackathon pushed the boundaries of what's possible with Murf AI. Their work inspired us to go further.
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 14, maxWidth: 720, margin: '0 auto' }}>
            {[
              {
                name: 'AI Brainstorming',
                author: 'ChatGPT & Claude',
                desc: 'The core concept of combining voice AI with life productivity, safety, and multilingual support came from AI-assisted ideation sessions.',
                color: '#10b981',
                icon: <Brain size={18} color="#10b981" />,
                link: null
              },
              {
                name: 'Community Builders',
                author: 'Murf Hackathon Discord',
                desc: 'Seeing what fellow builders were creating in the hackathon pushed us to think bigger and build a more complete, multi-purpose platform.',
                color: '#f59e0b',
                icon: <Users size={18} color="#f59e0b" />,
                link: null
              },
            ].map(({ name, author, desc, color, icon, link }) => (
              <motion.div key={name} whileHover={{ scale: 1.03, y: -3 }} className="card"
                onClick={() => link && window.open(link, '_blank')}
                style={{ padding: 18, cursor: link ? 'pointer' : 'default', borderColor: color + '30' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: color + '18', border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text1)' }}>{name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>by {author}</div>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.6 }}>{desc}</div>
                {link && <div style={{ fontSize: 11, color, fontWeight: 600, marginTop: 10 }}>View project →</div>}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Contact Section */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'Syne,system-ui,sans-serif', color: 'var(--text1)', marginBottom: 6 }}>
              Get in Touch
            </div>
            <div style={{ fontSize: 13, color: 'var(--text2)' }}>
              Have feedback, ideas, or want to collaborate? Send a message.
            </div>
          </div>

          <div className="card" style={{ padding: 28, maxWidth: 560, margin: '0 auto' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>Name</label>
                  <input
                    type="text"
                    placeholder="Your name"
                    value={contactForm.name}
                    onChange={e => setContactForm(f => ({ ...f, name: e.target.value }))}
                    className="inp"
                    style={{ fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>Email</label>
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={contactForm.email}
                    onChange={e => setContactForm(f => ({ ...f, email: e.target.value }))}
                    className="inp"
                    style={{ fontSize: 13 }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>Message</label>
                <textarea
                  placeholder="Your feedback, idea, or collaboration request..."
                  value={contactForm.message}
                  onChange={e => setContactForm(f => ({ ...f, message: e.target.value }))}
                  rows={4}
                  className="inp"
                  style={{ fontSize: 13, resize: 'vertical' }}
                />
              </div>

              <AnimatePresence mode="wait">
                {contactSent ? (
                  <motion.div key="sent" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '14px', borderRadius: 12,
                      background: 'linear-gradient(135deg,rgba(16,185,129,0.15),rgba(16,185,129,0.08))', border: '1px solid rgba(16,185,129,0.4)' }}>
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300 }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7l4 4 6-6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                    </motion.div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#10b981' }}>Message sent!</div>
                      <div style={{ fontSize: 11, color: 'var(--text3)' }}>We'll get back to you soon.</div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.button key="btn"
                    onClick={sendContact}
                    disabled={contactSending}
                    className="btn"
                    style={{ background: contactSending ? 'var(--glass)' : 'linear-gradient(135deg, #8b5cf6, #3b82f6)', border: contactSending ? '1px solid var(--border)' : 'none', color: contactSending ? 'var(--text2)' : '#fff', cursor: contactSending ? 'not-allowed' : 'pointer' }}>
                    {contactSending ? (
                      <>
                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                          style={{ width: 15, height: 15, borderRadius: '50%', border: '2px solid var(--border)', borderTopColor: '#8b5cf6', flexShrink: 0 }} />
                        Sending...
                      </>
                    ) : (
                      <><Send size={15} />Send Message</>
                    )}
                  </motion.button>
                )}
              </AnimatePresence>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', paddingTop: 4 }}>
                <Mail size={13} color="var(--text3)" />
                <span style={{ fontSize: 12, color: 'var(--text3)' }}>susantedit@gmail.com</span>
              </div>
            </div>
          </div>
        </motion.div>

        <div style={{ height: 48 }} />
      </div>
    </div>
  )
}
