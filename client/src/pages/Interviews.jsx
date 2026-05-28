import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Play, ArrowUpRight, Trash2, Clock3, Star, Sparkles, FileDown, Share2, LayoutGrid, WandSparkles, Target, Mic2, ArrowRight, Activity } from 'lucide-react'
import toast from 'react-hot-toast'
import { PageHeader } from '../components/UI'
import HeroLarge from '../components/HeroLarge'
import QuoteBar from '../components/QuoteBar'
import StreakBadge from '../components/StreakBadge'
import ShareButton from '../components/ShareButton'
import { useAuth } from '../context/AuthContext'
import { api } from '../services/api'
import { deleteInterviewSession, getInterviewSessions } from '../utils/interviews'
import { playClickSound, playSuccessSound } from '../utils/soundGenerator'

function normalizeRemote(session) {
  const meta = session.meta || {}
  return {
    id: String(session._id),
    title: meta.title || session.inputText || 'Mock interview',
    role: meta.role || session.inputText || 'Interview',
    company: meta.company || '',
    seniority: meta.seniority || '',
    focus: meta.focus || '',
    status: meta.status || 'completed',
    score: meta.feedback?.overallScore ?? meta.score ?? 0,
    transcript: meta.transcript || [],
    feedback: meta.feedback || null,
    plan: meta.plan || null,
    audioUrl: session.audioUrl || '',
    createdAt: session.createdAt,
    updatedAt: session.createdAt,
    source: 'server',
  }
}

function normalizeLocal(session) {
  return {
    id: String(session.id || session._id),
    title: session.title || session.plan?.title || session.role || 'Mock interview',
    role: session.role || '',
    company: session.company || '',
    seniority: session.seniority || '',
    focus: session.focus || '',
    status: session.status || 'draft',
    score: session.score || session.feedback?.overallScore || 0,
    transcript: session.transcript || [],
    feedback: session.feedback || null,
    plan: session.plan || null,
    audioUrl: session.audioUrl || '',
    createdAt: session.createdAt,
    updatedAt: session.updatedAt || session.createdAt,
    source: 'local',
  }
}

function StatCard({ label, value, hint, color = '#8b5cf6', icon: Icon }) {
  return (
    <div className="card" style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ width: 44, height: 44, borderRadius: 14, background: color + '18', border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {Icon && <Icon size={18} color={color} />}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text1)', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', marginTop: 4 }}>{label}</div>
        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{hint}</div>
      </div>
    </div>
  )
}

const templates = [
  { label: 'Frontend interview', role: 'Senior Frontend Engineer', company: 'Studio Forge', focus: 'system design, accessibility, product thinking', tone: 'professional' },
  { label: 'Product interview', role: 'Product Manager', company: 'Northstar', focus: 'roadmaps, tradeoffs, analytics, stakeholder management', tone: 'friendly' },
  { label: 'Leadership interview', role: 'Engineering Manager', company: 'Flux Labs', focus: 'team health, hiring, coaching, execution', tone: 'high-pressure' },
]

function InterviewCard({ session, onDelete, onOpen, onReview }) {
  const summary = session.feedback?.summary || session.plan?.description || 'Ready to continue.'
  const accent = session.status === 'completed' ? '#10b981' : session.status === 'live' ? '#f59e0b' : '#8b5cf6'
  const statusClass = `status-${(session.status || 'draft').toString().toLowerCase()}`

  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="big-card">
      <div className={`card-badge ${statusClass}`}>{session.seniority || session.status}</div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div className="card-illustration" style={{ background: accent + '18', border: `1px solid ${accent}35` }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: accent, opacity: 0.12 }} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 4 }}>{session.role || 'Role'}{session.company ? ` · ${session.company}` : ''}</div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text1)', margin: 0, lineHeight: 1.2 }}>{session.title}</h3>
            </div>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 12 }}>{summary}</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', color: 'var(--text3)', fontSize: 11 }}>
            <span>{new Date(session.createdAt || Date.now()).toLocaleDateString()}</span>
            {typeof session.score === 'number' && session.score > 0 && <span>Score {session.score}/100</span>}
            {session.seniority && <span>{session.seniority}</span>}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0, minWidth: 140 }}>
          <button className="btn card-cta" onClick={() => onOpen(session)} style={{ justifyContent: 'center' }}>
            <Play size={14} /> {session.status === 'completed' ? 'Resume' : 'Continue'}
          </button>
          <button className="btn card-cta" onClick={() => onReview(session)} style={{ justifyContent: 'center', background: 'var(--glass)', color: 'var(--text2)' }}>
            <ArrowUpRight size={14} /> Review
          </button>
          <button onClick={() => onDelete(session)} style={{ padding: '8px 14px', borderRadius: 12, border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.08)', color: '#ef4444', cursor: 'pointer', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>
    </motion.div>
  )
}

export default function Interviews() {
  const navigate = useNavigate()
  const { userId, displayName } = useAuth()
  const [remoteSessions, setRemoteSessions] = useState([])
  const [localSessions, setLocalSessions] = useState(getInterviewSessions())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      try {
        const history = await api.getHistory(userId)
        if (!mounted) return
        setRemoteSessions(history.filter(session => session.mode === 'interview').map(normalizeRemote))
      } catch {
        if (mounted) setRemoteSessions([])
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()
    const onStorage = () => setLocalSessions(getInterviewSessions())
    window.addEventListener('storage', onStorage)
    return () => {
      mounted = false
      window.removeEventListener('storage', onStorage)
    }
  }, [userId])

  useEffect(() => {
    const timer = setInterval(() => setLocalSessions(getInterviewSessions()), 1000)
    return () => clearInterval(timer)
  }, [])

  const sessions = useMemo(() => {
    const map = new Map()
    for (const session of [...remoteSessions, ...localSessions.map(normalizeLocal)]) {
      map.set(session.id, { ...(map.get(session.id) || {}), ...session })
    }
    return [...map.values()].sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0))
  }, [remoteSessions, localSessions])

  const completed = sessions.filter(session => session.status === 'completed')
  const active = sessions.filter(session => session.status !== 'completed')
  const scored = sessions.filter(session => session.score > 0)
  const averageScore = scored.length ? Math.round(scored.reduce((sum, session) => sum + session.score, 0) / scored.length) : 0
  const latest = sessions[0]
  const strongest = [...scored].sort((a, b) => b.score - a.score)[0]
  const latestSummary = latest?.feedback?.summary || latest?.plan?.description || 'No interview started yet.'

  const openBuilder = () => {
    playClickSound()
    navigate('/interviews/new')
  }

  const startTemplate = template => {
    playClickSound()
    navigate('/interviews/new', { state: template })
  }

  const openSession = session => {
    playClickSound()
    navigate(`/interviews/live/${session.id}`)
  }

  const openReview = session => {
    playClickSound()
    navigate(`/interviews/review/${session.id}`)
  }

  const removeSession = session => {
    deleteInterviewSession(session.id)
    setLocalSessions(getInterviewSessions())
    playSuccessSound()
    toast.success('Removed from local history')
  }

  const exportSummary = () => {
    if (!sessions.length) return toast.error('No interviews to export')
    const lines = sessions.map((session, index) => {
      const feedback = session.feedback?.summary || session.plan?.description || 'No summary yet.'
      return `${index + 1}. ${session.title}\nRole: ${session.role || 'Unknown'}\nScore: ${session.score || 0}\nStatus: ${session.status}\nSummary: ${feedback}\n`
    }).join('\n---\n\n')

    const content = `INTERVIEW OS — Session Export\nUser: ${displayName}\nTotal: ${sessions.length}\nCompleted: ${completed.length}\nActive: ${active.length}\n\n${lines}`
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `interview-export-${Date.now()}.txt`
    link.click()
    URL.revokeObjectURL(url)
    toast.success('Export ready')
  }

  return (
    <div className="page-wrapper">
      <div className="page-content">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <HeroLarge />
          <QuoteBar section="interview" color="#06b6d4" />

          <div className="card" style={{ padding: 18, marginBottom: 14, background: 'linear-gradient(135deg, rgba(6,182,212,0.12), rgba(139,92,246,0.10))' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 14, alignItems: 'stretch' }}>
              <div style={{ padding: 4 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text1)', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                  <Activity size={13} /> Interview cockpit
                </div>
                <div style={{ fontSize: 30, fontWeight: 900, color: 'var(--text1)', lineHeight: 1.05, marginBottom: 10 }}>A sharper mock interview flow, built to feel premium.</div>
                <p style={{ fontSize: 14, lineHeight: 1.75, color: 'var(--text2)', maxWidth: 680 }}>Launch interviews faster, track progress more clearly, and review each answer with a cleaner coaching path. Groq powers the conversation, Murf delivers the voice, and your history stays organized in one place.</p>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
                  <button className="btn" onClick={openBuilder}><Plus size={14} /> Start new interview</button>
                  {latest && latest.status !== 'completed' && <button className="btn" onClick={() => openSession(latest)} style={{ background: 'var(--glass)', color: 'var(--text2)' }}><Play size={14} /> Continue latest</button>}
                  <button className="btn" onClick={exportSummary} style={{ background: 'var(--glass)', color: 'var(--text2)' }}><FileDown size={14} /> Export archive</button>
                </div>
              </div>
              <div style={{ display: 'grid', gap: 10 }}>
                <div style={{ padding: 14, borderRadius: 18, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <Mic2 size={15} color="#06b6d4" />
                    <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text1)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Latest summary</div>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.7 }}>{latestSummary}</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
                  <div style={{ padding: 14, borderRadius: 18, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Best score</div>
                    <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--text1)', marginTop: 6 }}>{strongest ? `${strongest.score}/100` : '—'}</div>
                  </div>
                  <div style={{ padding: 14, borderRadius: 18, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Completion</div>
                    <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--text1)', marginTop: 6 }}>{sessions.length ? Math.round((completed.length / sessions.length) * 100) : 0}%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
            {templates.map(template => (
              <button key={template.label} onClick={() => startTemplate(template)} style={{ padding: '10px 14px', borderRadius: 14, border: '1px solid var(--border)', background: 'var(--glass)', color: 'var(--text1)', cursor: 'pointer', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <LayoutGrid size={14} /> {template.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <StreakBadge />
              <div style={{ padding: '6px 12px', borderRadius: 999, background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)', color: '#06b6d4', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Draft → Live → Review</div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn" onClick={openBuilder}><Plus size={14} /> New interview</button>
              {latest && latest.status !== 'completed' && <button className="btn" onClick={() => openSession(latest)} style={{ background: 'var(--glass)', color: 'var(--text2)' }}><Play size={14} /> Resume</button>}
              <button className="btn" onClick={exportSummary} style={{ background: 'var(--glass)', color: 'var(--text2)' }}><FileDown size={14} /> Export</button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12, marginBottom: 16 }}>
            <StatCard label="Total interviews" value={sessions.length} hint="All saved practice sessions" icon={Clock3} color="#06b6d4" />
            <StatCard label="Active drafts" value={active.length} hint="Ready to continue" icon={Play} color="#f59e0b" />
            <StatCard label="Completed" value={completed.length} hint="Review-ready interviews" icon={Star} color="#10b981" />
            <StatCard label="Average score" value={averageScore ? `${averageScore}/100` : '—'} hint="Based on completed feedback" icon={Sparkles} color="#8b5cf6" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12, marginBottom: 16 }}>
            <div className="card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <WandSparkles size={16} color="#06b6d4" />
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text1)' }}>Smart presets</div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.7 }}>Jump into a realistic session with ready-made role templates instead of starting from scratch.</div>
            </div>
            <div className="card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Target size={16} color="#8b5cf6" />
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text1)' }}>Focused coaching</div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.7 }}>Track scores, transcript depth, and next-step practice guidance from one clean review path.</div>
            </div>
            <div className="card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <ArrowRight size={16} color="#10b981" />
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text1)' }}>Fast resume</div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.7 }}>Pick up the latest live interview with one click and keep momentum without reconfiguring everything.</div>
            </div>
          </div>

          <div className="card" style={{ padding: 18, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Live status</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text1)', marginTop: 4 }}>Interview flow, one clear path</div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['Draft', 'Live', 'Review'].map((label, index) => (
                  <div key={label} style={{ padding: '6px 12px', borderRadius: 999, background: index === 1 ? 'rgba(6,182,212,0.12)' : 'var(--glass)', border: `1px solid ${index === 1 ? 'rgba(6,182,212,0.25)' : 'var(--border)'}`, color: index === 1 ? '#06b6d4' : 'var(--text2)', fontSize: 11, fontWeight: 800 }}>{label}</div>
                ))}
              </div>
            </div>
            <div style={{ height: 10 }} />
            <div style={{ height: 8, borderRadius: 999, background: 'rgba(148,163,184,0.12)', overflow: 'hidden' }}>
              <div style={{ width: `${sessions.length ? Math.min(100, (completed.length / sessions.length) * 100) : 0}%`, height: '100%', borderRadius: 999, background: 'linear-gradient(90deg,#06b6d4,#8b5cf6)' }} />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 10, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text1)' }}>Recent interviews</div>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>Open a live interview, review feedback, or export your session archive.</div>
            </div>
            <ShareButton text={`I am running ${sessions.length} mock interviews with Interview OS.`} label="Share progress" style={{ background: 'var(--glass)' }} />
          </div>

          {loading && (
            <div style={{ display: 'grid', gap: 12 }}>
              {[1, 2, 3].map(index => <div key={index} className="card shimmer" style={{ height: 120 }} />)}
            </div>
          )}

          {!loading && sessions.length === 0 && (
            <div className="card" style={{ padding: 44, textAlign: 'center' }}>
              <Sparkles size={30} color="#06b6d4" style={{ marginBottom: 10 }} />
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text1)' }}>No interviews yet</div>
              <p style={{ fontSize: 13, color: 'var(--text2)', margin: '8px 0 20px' }}>Start with a role, company, and focus area. Groq will generate the interview; Murf will narrate it back.</p>
              <button className="btn" onClick={openBuilder}><Plus size={14} /> Create your first interview</button>
            </div>
          )}

          <div>
            <AnimatePresence>
              {!loading && (
                <div className="card-grid">
                  {sessions.map(session => (
                    <InterviewCard key={session.id} session={session} onDelete={removeSession} onOpen={openSession} onReview={openReview} />
                  ))}
                </div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  )
}