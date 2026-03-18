import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { History, X, Play, Trash2 } from 'lucide-react'
import { getHistory, deleteHistoryItem, clearHistory } from '../utils/voiceHistory'

export default function VoiceHistorySidebar({ onReplay }) {
  const [open, setOpen] = useState(false)
  const [history, setHistory] = useState([])

  useEffect(() => {
    setHistory(getHistory())
  }, [open])

  const handleDelete = (id) => {
    const updated = deleteHistoryItem(id)
    setHistory(updated)
  }

  const handleClearAll = () => {
    if (confirm('Clear all voice history?')) {
      clearHistory()
      setHistory([])
    }
  }

  const handleReplay = (item) => {
    onReplay(item)
    setOpen(false)
  }

  return (
    <>
      {/* Toggle Button */}
      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(true)}
        style={{
          position: 'fixed',
          bottom: 80,
          right: 20,
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
          border: 'none',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(139,92,246,0.4)',
          zIndex: 999
        }}>
        <History size={24} />
        {history.length > 0 && (
          <div style={{
            position: 'absolute',
            top: -4,
            right: -4,
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: '#ef4444',
            color: '#fff',
            fontSize: 11,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {history.length}
          </div>
        )}
      </motion.button>

      {/* Sidebar */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.5)',
                zIndex: 1000
              }} />

            {/* Sidebar Panel */}
            <motion.div initial={{ x: 400 }} animate={{ x: 0 }} exit={{ x: 400 }}
              transition={{ type: 'spring', damping: 25 }}
              style={{
                position: 'fixed',
                top: 0,
                right: 0,
                bottom: 0,
                width: 380,
                maxWidth: '90vw',
                background: 'var(--bg2)',
                borderLeft: '1px solid var(--border)',
                zIndex: 1001,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}>
              
              {/* Header */}
              <div style={{ padding: 20, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text1)', marginBottom: 4 }}>
                    Voice History
                  </h3>
                  <p style={{ fontSize: 12, color: 'var(--text2)' }}>
                    Last {history.length} generations
                  </p>
                </div>
                <button onClick={() => setOpen(false)} className="icon-btn">
                  <X size={18} />
                </button>
              </div>

              {/* History List */}
              <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
                {history.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 40 }}>
                    <History size={48} color="var(--text3)" style={{ margin: '0 auto 12px' }} />
                    <p style={{ fontSize: 14, color: 'var(--text2)' }}>No voice history yet</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {history.map((item, i) => (
                      <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="card" style={{ padding: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text1)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {item.input}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                              {item.mode} • {item.tone} • {new Date(item.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                          <button onClick={() => handleDelete(item.id)}
                            style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                            <Trash2 size={12} color="#ef4444" />
                          </button>
                        </div>
                        <button onClick={() => handleReplay(item)}
                          style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(139,92,246,0.3)', background: 'rgba(139,92,246,0.1)', color: '#8b5cf6', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer' }}>
                          <Play size={12} /> Replay
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              {history.length > 0 && (
                <div style={{ padding: 16, borderTop: '1px solid var(--border)' }}>
                  <button onClick={handleClearAll}
                    style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    Clear All History
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
