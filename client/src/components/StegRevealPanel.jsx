import { useState, useRef, useEffect, useCallback } from 'react'

/**
 * StegRevealPanel
 *
 * Renders a near-invisible dot trigger. Triple-clicking within 500 ms opens
 * a minimal dark overlay panel for composing (send) or unlocking (receive)
 * a covert voice-note payload.
 *
 * Props:
 *   mode          – 'send' | 'receive'
 *   stegMessageId – opaque ID passed back to onSubmit
 *   onSubmit(data) – called with { message, pin } (send) or { pin } (receive)
 *   onDismiss()   – called when the panel is closed without submitting
 */
export default function StegRevealPanel({ mode, stegMessageId, onSubmit, onDismiss }) {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [pin, setPin] = useState('')
  const [errors, setErrors] = useState({})

  const clickCountRef = useRef(0)
  const clickTimerRef = useRef(null)

  // ── clear all ephemeral state ──────────────────────────────────────────────
  const clearState = useCallback(() => {
    setMessage('')
    setPin('')
    setErrors({})
    setOpen(false)
  }, [])

  // ── navigate-away / visibility cleanup ────────────────────────────────────
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        setTimeout(clearState, 500)
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      // also clear on unmount (route change)
      setTimeout(clearState, 500)
    }
  }, [clearState])

  // ── triple-click detection ─────────────────────────────────────────────────
  const handleDotClick = () => {
    clickCountRef.current += 1

    if (clickTimerRef.current) clearTimeout(clickTimerRef.current)

    if (clickCountRef.current === 3) {
      clickCountRef.current = 0
      setOpen(true)
      return
    }

    clickTimerRef.current = setTimeout(() => {
      clickCountRef.current = 0
    }, 500)
  }

  // ── dismiss without submit ─────────────────────────────────────────────────
  const handleDismiss = () => {
    clearState()
    onDismiss?.()
  }

  // ── validation ─────────────────────────────────────────────────────────────
  const validate = () => {
    const next = {}

    if (mode === 'send') {
      if (!message || message.trim().length === 0) {
        next.message = 'A note is required.'
      }
      if (message.length > 2000) {
        next.message = 'Note must be 2000 characters or fewer.'
      }
    }

    if (!pin || pin.length < 6) {
      next.pin = 'PIN must be at least 6 characters.'
    }

    return next
  }

  // ── submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    const data = mode === 'send'
      ? { message, pin, stegMessageId }
      : { pin, stegMessageId }

    clearState()
    onSubmit?.(data)
  }

  // ── shared input style ─────────────────────────────────────────────────────
  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.05)',
    color: 'var(--text1, #f1f5f9)',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  }

  const errorStyle = {
    fontSize: 12,
    color: '#f87171',
    marginTop: 4,
  }

  const labelStyle = {
    fontSize: 12,
    color: 'var(--text3, #94a3b8)',
    marginBottom: 6,
    display: 'block',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  }

  return (
    <>
      {/* Near-invisible trigger dot */}
      <span
        onClick={handleDotClick}
        style={{
          display: 'inline-block',
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: 'currentColor',
          opacity: 0.1,
          cursor: 'default',
          userSelect: 'none',
          flexShrink: 0,
        }}
      />

      {/* Overlay panel */}
      {open && (
        <div
          role="dialog"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(2,6,23,0.72)',
            backdropFilter: 'blur(6px)',
          }}
          onClick={(e) => {
            // dismiss on backdrop click
            if (e.target === e.currentTarget) handleDismiss()
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 420,
              margin: '0 16px',
              borderRadius: 20,
              background: 'rgba(7,12,24,0.92)',
              border: '1px solid rgba(255,255,255,0.09)',
              boxShadow: '0 24px 64px rgba(2,6,23,0.6)',
              padding: 24,
              color: 'var(--text1, #f1f5f9)',
            }}
          >
            <form onSubmit={handleSubmit} noValidate>
              {mode === 'send' && (
                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>
                    Note
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => {
                      setMessage(e.target.value)
                      if (errors.message) setErrors((prev) => ({ ...prev, message: undefined }))
                    }}
                    maxLength={2000}
                    rows={4}
                    placeholder="Your note…"
                    style={{
                      ...inputStyle,
                      resize: 'vertical',
                      minHeight: 90,
                    }}
                  />
                  {errors.message && <p style={errorStyle}>{errors.message}</p>}
                  <p style={{ fontSize: 11, color: 'var(--text3, #94a3b8)', marginTop: 4, textAlign: 'right' }}>
                    {message.length} / 2000
                  </p>
                </div>
              )}

              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>
                  PIN
                </label>
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value)
                    if (errors.pin) setErrors((prev) => ({ ...prev, pin: undefined }))
                  }}
                  minLength={6}
                  placeholder="••••••"
                  style={inputStyle}
                  autoComplete="off"
                />
                {errors.pin && <p style={errorStyle}>{errors.pin}</p>}
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={handleDismiss}
                  style={{
                    flex: 1,
                    padding: '11px 0',
                    borderRadius: 12,
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.04)',
                    color: 'var(--text2, #cbd5e1)',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 2,
                    padding: '11px 0',
                    borderRadius: 12,
                    border: 'none',
                    background: 'linear-gradient(135deg, #22d3ee, #818cf8)',
                    color: '#fff',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  {mode === 'send' ? 'Attach' : 'Play'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
