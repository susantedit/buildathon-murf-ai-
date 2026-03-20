import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Camera, Edit2, Check, X, LogOut, Mail, Shield, ZoomIn, ZoomOut, Move } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { PageHeader } from '../components/UI'
import { playClickSound, playSuccessSound } from '../utils/soundGenerator'

// ── Image Crop Modal ──────────────────────────────────────────
function CropModal({ src, onSave, onCancel }) {
  const [scale, setScale]   = useState(1)
  const [pos, setPos]       = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const dragStart = useRef(null)

  const onMouseDown = (e) => {
    setDragging(true)
    dragStart.current = { mx: e.clientX, my: e.clientY, px: pos.x, py: pos.y }
  }
  const onMouseMove = (e) => {
    if (!dragging || !dragStart.current) return
    setPos({
      x: dragStart.current.px + (e.clientX - dragStart.current.mx),
      y: dragStart.current.py + (e.clientY - dragStart.current.my),
    })
  }
  const onMouseUp = () => setDragging(false)

  // Touch support
  const onTouchStart = (e) => {
    const t = e.touches[0]
    setDragging(true)
    dragStart.current = { mx: t.clientX, my: t.clientY, px: pos.x, py: pos.y }
  }
  const onTouchMove = (e) => {
    if (!dragging || !dragStart.current) return
    const t = e.touches[0]
    setPos({
      x: dragStart.current.px + (t.clientX - dragStart.current.mx),
      y: dragStart.current.py + (t.clientY - dragStart.current.my),
    })
  }

  const handleSave = useCallback(() => {
    const SIZE = 200
    const canvas = document.createElement('canvas')
    canvas.width = SIZE
    canvas.height = SIZE
    const ctx = canvas.getContext('2d')
    ctx.beginPath()
    ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2, 0, Math.PI * 2)
    ctx.clip()
    const img = new Image()
    img.src = src
    img.onload = () => {
      const drawn = SIZE * scale
      const ox = (SIZE - drawn) / 2 + pos.x
      const oy = (SIZE - drawn) / 2 + pos.y
      ctx.drawImage(img, ox, oy, drawn, drawn)
      onSave(canvas.toDataURL('image/jpeg', 0.85))
    }
  }, [src, scale, pos, onSave])

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        style={{ background: 'var(--bg2)', borderRadius: 20, padding: 24, width: '100%', maxWidth: 360, border: '1px solid var(--border)' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text1)' }}>Adjust Photo</span>
          <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <X size={18} color="var(--text2)" />
          </button>
        </div>

        {/* Crop circle preview */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <div
            style={{ width: 200, height: 200, borderRadius: '50%', overflow: 'hidden', border: '3px solid rgba(139,92,246,0.5)', cursor: dragging ? 'grabbing' : 'grab', position: 'relative', background: '#111', userSelect: 'none' }}
            onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
            onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onMouseUp}
          >
            <img
              src={src} alt="crop"
              draggable={false}
              style={{ position: 'absolute', width: 200 * scale, height: 200 * scale, top: (200 - 200 * scale) / 2 + pos.y, left: (200 - 200 * scale) / 2 + pos.x, objectFit: 'cover', pointerEvents: 'none' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
          <Move size={13} color="var(--text3)" />
          <span style={{ fontSize: 11, color: 'var(--text3)' }}>Drag to reposition</span>
        </div>

        {/* Zoom slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <ZoomOut size={16} color="var(--text2)" />
          <input type="range" min={0.5} max={3} step={0.01} value={scale}
            onChange={e => setScale(parseFloat(e.target.value))}
            style={{ flex: 1, accentColor: '#8b5cf6' }}
          />
          <ZoomIn size={16} color="var(--text2)" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <button onClick={onCancel} className="btn" style={{ background: 'var(--glass)', color: 'var(--text1)', border: '1px solid var(--border)' }}>
            Cancel
          </button>
          <button onClick={handleSave} className="btn" style={{ background: 'linear-gradient(135deg,#7c3aed,#3b82f6)' }}>
            <Check size={14} /> Save
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Editable field ────────────────────────────────────────────
function EditableField({ icon, label, value, onSave, placeholder, multiline }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal]         = useState(value)
  const [saving, setSaving]   = useState(false)

  const save = async () => {
    setSaving(true)
    await onSave(val)
    setSaving(false)
    setEditing(false)
    playSuccessSound()
    toast.success(label + ' updated!')
  }

  return (
    <div style={{ padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ marginTop: 2, flexShrink: 0 }}>{icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>{label}</div>
          {editing ? (
            <div style={{ display: 'flex', gap: 6 }}>
              {multiline
                ? <textarea value={val} onChange={e => setVal(e.target.value)} className="inp" rows={2} style={{ fontSize: 13, flex: 1 }} autoFocus />
                : <input value={val} onChange={e => setVal(e.target.value)} onKeyDown={e => e.key === 'Enter' && save()} className="inp" style={{ fontSize: 13, flex: 1 }} autoFocus />
              }
              <button onClick={save} disabled={saving} style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {saving ? <span className="spin" style={{ width: 10, height: 10 }} /> : <Check size={13} color="#10b981" />}
              </button>
              <button onClick={() => { setEditing(false); setVal(value) }} style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <X size={13} color="#ef4444" />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14, color: val ? 'var(--text1)' : 'var(--text3)', fontWeight: val ? 500 : 400 }}>{val || placeholder}</span>
              <button onClick={() => { setEditing(true); playClickSound() }} style={{ width: 24, height: 24, borderRadius: 6, background: 'var(--glass)', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Edit2 size={11} color="var(--text3)" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main Profile Page ─────────────────────────────────────────
export default function Profile() {
  const { user, displayName, avatarUrl, updateDisplayName, updateAvatar, signOut } = useAuth()
  const [cropSrc, setCropSrc]   = useState(null)
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput]     = useState(displayName)
  const [savingName, setSavingName]   = useState(false)
  const fileRef = useRef(null)

  // Extra profile fields stored in localStorage
  const [bio,      setBio]      = useState(() => localStorage.getItem('vortex-bio')      || '')
  const [location, setLocation] = useState(() => localStorage.getItem('vortex-location') || '')
  const [language, setLanguage] = useState(() => localStorage.getItem('vortex-lang')     || '')

  const saveName = async () => {
    if (!nameInput.trim()) return toast.error('Name cannot be empty')
    setSavingName(true)
    try {
      await updateDisplayName(nameInput.trim())
      playSuccessSound()
      toast.success('Name updated!')
      setEditingName(false)
    } catch { toast.error('Failed to update name') }
    finally { setSavingName(false) }
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) return toast.error('Image must be under 5MB')
    const reader = new FileReader()
    reader.onload = (ev) => setCropSrc(ev.target.result)
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleCropSave = (base64) => {
    updateAvatar(base64)
    setCropSrc(null)
    playSuccessSound()
    toast.success('Photo updated!')
  }

  const handleSignOut = async () => {
    playClickSound()
    await signOut()
    toast.success('Signed out')
  }

  const initials = displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="page-wrapper" style={{ '--page-accent': '#8b5cf6' }}>
      <div className="page-content">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <PageHeader icon={User} color="#8b5cf6" title="Profile" sub="Manage your account" />

          {/* Avatar + Name card */}
          <div className="card" style={{ padding: 32, textAlign: 'center', marginBottom: 12 }}>
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: 20 }}>
              {avatarUrl
                ? <img src={avatarUrl} alt="avatar" style={{ width: 96, height: 96, borderRadius: '50%', objectFit: 'cover', border: '3px solid rgba(139,92,246,0.4)' }} />
                : <div style={{ width: 96, height: 96, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 800, color: '#fff', border: '3px solid rgba(139,92,246,0.4)' }}>{initials}</div>
              }
              <button onClick={() => fileRef.current?.click()}
                style={{ position: 'absolute', bottom: 0, right: 0, width: 30, height: 30, borderRadius: '50%', background: '#8b5cf6', border: '2px solid var(--bg1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <Camera size={14} color="#fff" />
              </button>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
            </div>

            {editingName ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginBottom: 8 }}>
                <input value={nameInput} onChange={e => setNameInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && saveName()}
                  autoFocus className="inp" style={{ textAlign: 'center', fontSize: 18, fontWeight: 700, maxWidth: 220 }} />
                <button onClick={saveName} disabled={savingName} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {savingName ? <span className="spin" style={{ width: 12, height: 12 }} /> : <Check size={14} color="#10b981" />}
                </button>
                <button onClick={() => { setEditingName(false); setNameInput(displayName) }} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={14} color="#ef4444" />
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--text1)' }}>{displayName}</span>
                <button onClick={() => { setEditingName(true); setNameInput(displayName); playClickSound() }}
                  style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--glass)', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Edit2 size={12} color="var(--text2)" />
                </button>
              </div>
            )}
            <p style={{ fontSize: 12, color: 'var(--text3)', margin: 0 }}>Tap camera to upload &amp; adjust photo</p>
          </div>

          {/* Account info (read-only) */}
          <div className="card" style={{ padding: 20, marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Account</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
              <Mail size={16} color="#3b82f6" />
              <div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 2 }}>Email</div>
                <div style={{ fontSize: 14, color: 'var(--text1)', fontWeight: 500 }}>{user?.email || '—'}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0' }}>
              <Shield size={16} color="#10b981" />
              <div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 2 }}>Sign-in method</div>
                <div style={{ fontSize: 14, color: 'var(--text1)', fontWeight: 500 }}>Google</div>
              </div>
            </div>
          </div>

          {/* Editable profile fields */}
          <div className="card" style={{ padding: 20, marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>About You</div>

            <EditableField
              icon={<span style={{ fontSize: 16 }}>📝</span>}
              label="Bio"
              value={bio}
              placeholder="Add a short bio..."
              multiline
              onSave={v => { setBio(v); localStorage.setItem('vortex-bio', v) }}
            />
            <EditableField
              icon={<span style={{ fontSize: 16 }}>📍</span>}
              label="Location"
              value={location}
              placeholder="e.g. Kathmandu, Nepal"
              onSave={v => { setLocation(v); localStorage.setItem('vortex-location', v) }}
            />
            <EditableField
              icon={<span style={{ fontSize: 16 }}>🌐</span>}
              label="Preferred Language"
              value={language}
              placeholder="e.g. Nepali, English,Hindi"
              onSave={v => { setLanguage(v); localStorage.setItem('vortex-lang', v) }}
            />
          </div>

          {/* Sign out */}
          <button onClick={handleSignOut} className="btn"
            style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <LogOut size={15} /> Sign Out
          </button>
        </motion.div>
      </div>

      {/* Crop modal */}
      <AnimatePresence>
        {cropSrc && <CropModal src={cropSrc} onSave={handleCropSave} onCancel={() => setCropSrc(null)} />}
      </AnimatePresence>
    </div>
  )
}
