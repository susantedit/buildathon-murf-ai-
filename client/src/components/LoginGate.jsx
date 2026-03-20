import { useState } from 'react'
import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function LoginGate() {
  const { signIn } = useAuth()
  const [loading, setLoading] = useState(false)

  const handleSignIn = async () => {
    setLoading(true)
    try {
      await signIn()
      toast.success('Welcome to Vortex Voice AI!')
    } catch {
      toast.error('Sign-in cancelled')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'var(--bg1)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: 24, textAlign: 'center'
      }}
    >
      {/* Logo */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        style={{ marginBottom: 32 }}
      >
        <div style={{
          width: 72, height: 72, borderRadius: 20, margin: '0 auto 16px',
          background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 40px rgba(124,58,237,0.4)'
        }}>
          <Zap size={36} color="#fff" />
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 8px', background: 'linear-gradient(135deg, #7c3aed, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Vortex Voice AI
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text2)', margin: 0 }}>
          Your AI-powered voice assistant
        </p>
      </motion.div>

      {/* Features */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        style={{ marginBottom: 40, maxWidth: 320 }}
      >
        {[
          { icon: '🔒', text: 'Your data saved permanently to your account' },
          { icon: '📱', text: 'Access from any device, any browser' },
          { icon: '🌍', text: '80+ languages · AI modes · Voice generation' },
        ].map((f, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, padding: '10px 14px', borderRadius: 12, background: 'var(--glass)', border: '1px solid var(--border)', textAlign: 'left' }}>
            <span style={{ fontSize: 20 }}>{f.icon}</span>
            <span style={{ fontSize: 13, color: 'var(--text2)' }}>{f.text}</span>
          </div>
        ))}
      </motion.div>

      {/* Sign in button */}
      <motion.button
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={handleSignIn}
        disabled={loading}
        style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 28px', borderRadius: 14,
          background: loading ? 'var(--glass)' : '#fff',
          border: '1px solid rgba(0,0,0,0.12)',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: 15, fontWeight: 700, color: '#1f1f1f',
          boxShadow: '0 2px 16px rgba(0,0,0,0.15)',
          minWidth: 240, justifyContent: 'center'
        }}
      >
        {loading ? (
          <><span className="spin" style={{ borderColor: '#7c3aed', borderTopColor: 'transparent' }} />Signing in...</>
        ) : (
          <>
            {/* Google G logo */}
            <svg width="20" height="20" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              <path fill="none" d="M0 0h48v48H0z"/>
            </svg>
            Continue with Google
          </>
        )}
      </motion.button>

      <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 16, maxWidth: 280 }}>
        By signing in you agree to store your activity history and contacts linked to your Google account.
      </p>
    </motion.div>
  )
}
