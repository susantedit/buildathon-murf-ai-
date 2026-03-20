import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, BookOpen, FileDown, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { PageHeader } from '../components/UI'
import QuoteBar from '../components/QuoteBar'
import { api } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { playClickSound, playSuccessSound } from '../utils/soundGenerator'

const cfg = {
  creator:    { color: '#8b5cf6', label: 'Creator',    emoji: '🎬' },
  assistant:  { color: '#3b82f6', label: 'Assistant',  emoji: '🧠' },
  study:      { color: '#c084fc', label: 'Study',      emoji: '📚' },
  focus:      { color: '#10b981', label: 'Focus',      emoji: '🧘' },
  planner:    { color: '#f59e0b', label: 'Planner',    emoji: '📅' },
  translator: { color: '#10b981', label: 'Translator', emoji: '🌍' },
  safety:     { color: '#ef4444', label: 'Safety',     emoji: '🛡️' },
  podcast:    { color: '#7c3aed', label: 'Podcast',    emoji: '🎙️' },
}

function SessionCard({ s, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)
  const c = cfg[s.mode] || { color: '#64748b', label: s.mode, emoji: '💬' }

  const copy = async () => {
    await navigator.clipboard.writeText(s.responseText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Copied!')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}
      className="card" style={{ marginBottom: 10, overflow: 'hidden' }}>

      {/* Header row — always visible, click to expand */}
      <div
        onClick={() => { setExpanded(e => !e); playClickSound() }}
        style={{ padding: 16, display: 'flex', alignItems: 'flex-start', gap: 14, cursor: 'pointer' }}>
        <div style={{ fontSize: 24, flexShrink: 0 }}>{c.emoji}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
            <span style={{ background: c.color + '20', color: c.color, padding: '2px 8px', fontSize: 11, borderRadius: 20, fontWeight: 700 }}>
              {c.label}
            </span>
            <span style={{ fontSize: 11, color: 'var(--text3)' }}>
              {new Date(s.createdAt).toLocaleDateString()} · {new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          {/* Input (question) */}
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text1)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {s.inputText}
          </p>
          {/* Response preview when collapsed */}
          {!expanded && (
            <p style={{ fontSize: 12, color: 'var(--text2)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.5 }}>
              {s.responseText}
            </p>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <div style={{ color: 'var(--text3)' }}>
            {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </div>
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={e => { e.stopPropagation(); onDelete(s._id) }}
            style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Trash2 size={13} color="#ef4444" />
          </motion.button>
        </div>
      </div>

      {/* Expanded full response */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}>
            <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--border)', paddingTop: 14 }}>

              {/* Input section */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                  Your input
                </div>
                <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>
                  {s.inputText}
                </div>
              </div>

              {/* Full response */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    AI Response
                  </div>
                  <button onClick={copy}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--glass)', color: 'var(--text2)', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                    {copied ? <Check size={11} color="#10b981" /> : <Copy size={11} />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <div style={{ padding: '12px 14px', borderRadius: 10, background: c.color + '08', border: `1px solid ${c.color}20`, fontSize: 13, color: 'var(--text1)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                  {s.responseText}
                </div>
              </div>

              {/* Audio if available */}
              {s.audioUrl && (
                <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <audio controls src={s.audioUrl} style={{ flex: 1, height: 36, borderRadius: 8 }} />
                  <a href={s.audioUrl} download={`vortex-${s.mode}-${s._id}.mp3`}
                    style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${c.color}40`, background: c.color + '12', color: c.color, fontSize: 11, fontWeight: 600, textDecoration: 'none' }}>
                    ⬇️ Audio
                  </a>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function History() {
  const { userId, displayName, avatarUrl } = useAuth()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')

  useEffect(() => { loadHistory() }, [userId])

  const loadHistory = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.getHistory(userId)
      setSessions(data)
    } catch (err) {
      setError(err.message)
      toast.error('Could not load history')
    } finally {
      setLoading(false)
    }
  }

  const remove = async id => {
    playClickSound()
    try {
      await api.deleteHistory(id)
      setSessions(s => s.filter(x => x._id !== id))
      playSuccessSound()
      toast.success('Deleted')
    } catch { toast.error('Delete failed') }
  }

  const exportTxt = () => {
    if (!sessions.length) return toast.error('No sessions to export')
    const lines = sessions.map((s, i) => {
      const c = cfg[s.mode] || { label: s.mode }
      return `${i + 1}. [${c.label}] ${new Date(s.createdAt).toLocaleDateString()}\nInput: ${s.inputText}\nResponse: ${s.responseText}\n`
    }).join('\n---\n\n')
    const content = `VORTEX VOICE AI — Session History\nExported: ${new Date().toLocaleString()}\nUser: ${displayName}\nTotal: ${sessions.length} sessions\n\n${'='.repeat(50)}\n\n${lines}`
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `vortex-history-${Date.now()}.txt`; a.click()
    URL.revokeObjectURL(url)
    toast.success('Exported!')
  }

  const modes = ['all', ...Object.keys(cfg)]
  const filtered = filter === 'all' ? sessions : sessions.filter(s => s.mode === filter)

  return (
    <div className="page-wrapper">
      <div className="page-content">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <PageHeader icon={BookOpen} color="#8b5cf6" title="History" sub="Your past sessions — tap any card to expand" />
          <QuoteBar section="history" color="#8b5cf6" />

          {/* User banner */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 12, background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', marginBottom: 12 }}>
            {avatarUrl
              ? <img src={avatarUrl} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
              : <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fff' }}>{displayName?.slice(0,2).toUpperCase()}</div>
            }
            <span style={{ fontSize: 13, color: 'var(--text2)', flex: 1 }}>
              <strong style={{ color: 'var(--text1)' }}>{displayName}</strong> · {sessions.length} sessions
            </span>
            {sessions.length > 0 && (
              <button onClick={exportTxt}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 8, border: '1px solid rgba(139,92,246,0.3)', background: 'rgba(139,92,246,0.1)', color: '#8b5cf6', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                <FileDown size={12} /> Export
              </button>
            )}
          </div>

          {/* Mode filter chips */}
          {sessions.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
              {modes.map(m => {
                const c = cfg[m]
                const count = m === 'all' ? sessions.length : sessions.filter(s => s.mode === m).length
                if (m !== 'all' && count === 0) return null
                return (
                  <button key={m} onClick={() => setFilter(m)}
                    style={{ padding: '4px 12px', borderRadius: 20, border: `1px solid ${filter === m ? (c?.color || '#8b5cf6') + '60' : 'var(--border)'}`, background: filter === m ? (c?.color || '#8b5cf6') + '15' : 'var(--glass)', color: filter === m ? (c?.color || '#8b5cf6') : 'var(--text2)', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                    {m === 'all' ? `All (${count})` : `${c?.emoji} ${c?.label} (${count})`}
                  </button>
                )
              })}
            </div>
          )}

          {loading && [1,2,3].map(i => <div key={i} className="card shimmer" style={{ height: 80, marginBottom: 10 }} />)}

          {error && (
            <div className="card" style={{ padding: 24, textAlign: 'center', background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
              <p style={{ color: '#ef4444', fontSize: 14, marginBottom: 12 }}>Failed to load history</p>
              <p style={{ color: 'var(--text3)', fontSize: 12, marginBottom: 16 }}>{error}</p>
              <button onClick={loadHistory} className="btn">Retry</button>
            </div>
          )}

          {!loading && !error && sessions.length === 0 && (
            <div className="card" style={{ padding: 48, textAlign: 'center' }}>
              <svg width="120" height="100" viewBox="0 0 120 100" fill="none" style={{ marginBottom: 16, opacity: 0.6 }}>
                <rect x="10" y="20" width="100" height="70" rx="8" fill="var(--border)" />
                <rect x="20" y="32" width="60" height="6" rx="3" fill="var(--text3)" opacity="0.5" />
                <rect x="20" y="44" width="80" height="6" rx="3" fill="var(--text3)" opacity="0.3" />
                <rect x="20" y="56" width="50" height="6" rx="3" fill="var(--text3)" opacity="0.2" />
              </svg>
              <p style={{ color: 'var(--text2)', fontSize: 15, fontWeight: 600, marginBottom: 6 }}>No sessions yet</p>
              <p style={{ color: 'var(--text3)', fontSize: 13 }}>Start using the app and your history will appear here.</p>
            </div>
          )}

          <AnimatePresence>
            {!loading && !error && filtered.map((s, i) => (
              <SessionCard key={s._id} s={s} onDelete={remove} />
            ))}
          </AnimatePresence>

          {!loading && !error && filtered.length === 0 && sessions.length > 0 && (
            <div style={{ textAlign: 'center', padding: 32, color: 'var(--text3)', fontSize: 13 }}>
              No {filter} sessions yet.
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
