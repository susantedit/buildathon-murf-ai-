import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, ShieldCheck, Sparkles, Zap } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import HeroOrb from './HeroOrb'

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
        background: 'radial-gradient(circle at top, rgba(34,211,238,0.12), transparent 42%), linear-gradient(180deg, #050816 0%, #060b18 100%)',
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 28,
        alignItems: 'center',
        justifyItems: 'center',
        padding: 24,
        color: 'var(--text1)'
      }}
    >
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        style={{ position: 'relative', minHeight: 640, display: 'flex', alignItems: 'center' }}
      >
        <div style={{ position: 'absolute', inset: 0, borderRadius: 36, background: 'radial-gradient(circle at 20% 20%, rgba(34,211,238,0.18), transparent 30%), radial-gradient(circle at 80% 30%, rgba(249,115,22,0.15), transparent 28%), rgba(255,255,255,0.03)', filter: 'blur(2px)' }} />
        <div style={{ position: 'relative', padding: 28, maxWidth: 640 }}>
          <div className="badge" style={{ background: 'rgba(34,211,238,0.12)', border: '1px solid rgba(34,211,238,0.25)', color: '#67e8f9', marginBottom: 18 }}>
            <Sparkles size={13} /> Voice-native workspace
          </div>
          <h1 style={{ fontSize: 'clamp(2.6rem, 7vw, 4.8rem)', lineHeight: 0.94, margin: '0 0 16px', letterSpacing: '-0.05em', fontFamily: 'Space Grotesk, system-ui, sans-serif' }}>
            Step into a cleaner, faster, more memorable build.
          </h1>
          <p style={{ fontSize: 16, lineHeight: 1.8, color: 'var(--text2)', maxWidth: 560, marginBottom: 24 }}>
            Sign in to access the redesigned voice AI experience, synced history, and the full product shell that feels built for a final-stage demo.
          </p>
          <div style={{ display: 'grid', gap: 12, maxWidth: 420 }}>
            {[
              { icon: <ShieldCheck size={16} />, text: 'Per-user history and contacts tied to your account' },
              { icon: <Sparkles size={16} />, text: 'Premium motion, layered depth, and a new visual language' },
              { icon: <Zap size={16} />, text: 'Voice, text, and AI modes ready from a single entry point' },
            ].map(item => (
              <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 18, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ width: 32, height: 32, borderRadius: 12, background: 'rgba(34,211,238,0.12)', border: '1px solid rgba(34,211,238,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#67e8f9', flexShrink: 0 }}>{item.icon}</div>
                <span style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5 }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.05 }}
        style={{ width: '100%', maxWidth: 520, justifySelf: 'center' }}
      >
        <div className="card" style={{ padding: 24, borderRadius: 28, background: 'rgba(7,12,24,0.84)', borderColor: 'rgba(255,255,255,0.09)', boxShadow: '0 30px 90px rgba(2,6,23,0.42)' }}>
          <div style={{ position: 'relative', minHeight: 280, marginBottom: 18 }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: 24, background: 'radial-gradient(circle at 50% 45%, rgba(34,211,238,0.16), transparent 45%), radial-gradient(circle at 70% 70%, rgba(249,115,22,0.12), transparent 32%)' }} />
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 280 }}>
              <HeroOrb size={280} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
            {[
              { label: 'Unlock', value: 'voice history + labs' },
              { label: 'Access', value: 'all modes + PWA' },
            ].map(item => (
              <div key={item.label} className="card" style={{ padding: 14, borderRadius: 18, background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{item.label}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text1)', lineHeight: 1.5 }}>{item.value}</div>
              </div>
            ))}
          </div>

          <motion.button
            initial={{ y: 6, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSignIn}
            disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
              width: '100%', padding: '16px 20px', borderRadius: 18,
              background: loading ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #22d3ee, #f97316)',
              border: '1px solid rgba(255,255,255,0.08)',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: 15, fontWeight: 800, color: '#fff',
              boxShadow: '0 20px 48px rgba(34,211,238,0.25)'
            }}
          >
            {loading ? (
              <><span className="spin" style={{ borderColor: 'rgba(255,255,255,0.35)', borderTopColor: 'transparent' }} />Signing in...</>
            ) : (
              <>
                <Zap size={16} />
                Continue with Google
                <ArrowRight size={16} />
              </>
            )}
          </motion.button>

          <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 14, lineHeight: 1.7, textAlign: 'center' }}>
            By signing in you agree to store your activity history and contacts linked to your Google account.
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}
