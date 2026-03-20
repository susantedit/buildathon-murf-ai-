import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, BookOpen } from 'lucide-react'
import toast from 'react-hot-toast'
import { PageHeader } from '../components/UI'
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

export default function History() {
  const { userId, displayName, avatarUrl } = useAuth()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadHistory()
  }, [userId])

  const loadHistory = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.getHistory(userId)
      console.log('History loaded:', data.length, 'sessions')
      setSessions(data)
    } catch (err) {
      console.error('History load error:', err)
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
    }
    catch { 
      toast.error('Delete failed')
    }
  }

  const retry = () => {
    loadHistory()
  }

  return (
    <div className="page-wrapper">
      <div className="page-content">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <PageHeader icon={BookOpen} color="#8b5cf6" title="History" sub="Your past sessions" />

          {/* Signed in as banner */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 12, background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', marginBottom: 12 }}>
            {avatarUrl
              ? <img src={avatarUrl} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
              : <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fff' }}>{displayName?.slice(0,2).toUpperCase()}</div>
            }
            <span style={{ fontSize: 13, color: 'var(--text2)' }}>Signed in as <strong style={{ color: 'var(--text1)' }}>{displayName}</strong></span>
          </div>

          {/* Debug Info */}
          {!loading && !error && (
            <div className="card" style={{ padding: 12, marginBottom: 12, background: 'rgba(59,130,246,0.08)', borderColor: 'rgba(59,130,246,0.2)' }}>
              <div style={{ fontSize: 11, color: 'var(--text2)' }}>
                ✅ Connected to backend • {sessions.length} sessions loaded
              </div>
            </div>
          )}

          {loading && [1, 2, 3].map(i => <div key={i} className="card shimmer" style={{ height: 80, marginBottom: 10 }} />)}

          {error && (
            <div className="card" style={{ padding: 24, textAlign: 'center', background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
              <p style={{ color: '#ef4444', fontSize: 14, marginBottom: 12 }}>Failed to load history</p>
              <p style={{ color: 'var(--text3)', fontSize: 12, marginBottom: 16 }}>{error}</p>
              <button onClick={retry} className="btn" style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
                Retry
              </button>
            </div>
          )}

          {!loading && !error && sessions.length === 0 && (
            <div className="card" style={{ padding: 48, textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
              <p style={{ color: 'var(--text2)', fontSize: 14 }}>No sessions yet. Start using the app!</p>
            </div>
          )}

          <AnimatePresence>
            {!loading && !error && sessions.map((s, i) => {
              const c = cfg[s.mode] || { color: '#64748b', label: s.mode, emoji: '💬' }
              return (
                <motion.div key={s._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: i * 0.04 }} className="card"
                  style={{ padding: 16, marginBottom: 10, display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <div style={{ fontSize: 24, flexShrink: 0 }}>{c.emoji}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                      <span className="badge" style={{ background: c.color + '20', color: c.color, padding: '2px 8px', fontSize: 11 }}>{c.label}</span>
                      <span style={{ fontSize: 11, color: 'var(--text3)' }}>{new Date(s.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text1)', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.inputText}</p>
                    <p style={{ fontSize: 12, color: 'var(--text2)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{s.responseText}</p>
                  </div>
                  <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => remove(s._id)}
                    style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Trash2 size={13} color="#ef4444" />
                  </motion.button>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}
