import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import SplashScreen from './components/SplashScreen'
import LoginGate from './components/LoginGate'
import PWAInstallPrompt from './components/PWAInstallPrompt'
import OnboardingTour from './components/OnboardingTour'
import Home from './pages/Home'
import Creator from './pages/Creator'
import Assistant from './pages/Assistant'
import Study from './pages/Study'
import Focus from './pages/Focus'
import Planner from './pages/Planner'
import SafetyNew from './pages/Safety'
import Translator from './pages/Translator'
import History from './pages/History'
import Profile from './pages/Profile'
import Podcast from './pages/Podcast'
import Journal from './pages/Journal'
import Games from './pages/Games'
import { recordActivity } from './utils/streak'
import { api } from './services/api'
import { ChevronUp } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

function BackToTop() {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Back to top"
          style={{ position: 'fixed', bottom: 80, right: 16, width: 40, height: 40, borderRadius: '50%', border: 'none', background: 'linear-gradient(135deg,#8b5cf6,#3b82f6)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 900, boxShadow: '0 4px 16px rgba(139,92,246,0.4)' }}>
          <ChevronUp size={18} color="#fff" />
        </motion.button>
      )}
    </AnimatePresence>
  )
}

function AppInner() {
  const [splashDone, setSplashDone] = useState(false)
  const { user, loading } = useAuth()

  // Record daily activity for streak
  useEffect(() => { if (user) recordActivity() }, [user])

  // Wake up Render server on load (free tier sleeps after inactivity)
  useEffect(() => { api.ping() }, [])

  // Show splash first
  if (!splashDone) return <SplashScreen onDone={() => setSplashDone(true)} />

  // Firebase still resolving auth state
  if (loading) return null

  // Not signed in — show login gate
  if (!user) return <LoginGate />

  // Signed in — show full app
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/"           element={<Home />} />
        <Route path="/creator"    element={<Creator />} />
        <Route path="/assistant"  element={<Assistant />} />
        <Route path="/study"      element={<Study />} />
        <Route path="/focus"      element={<Focus />} />
        <Route path="/planner"    element={<Planner />} />
        <Route path="/safety"     element={<SafetyNew />} />
        <Route path="/translator" element={<Translator />} />
        <Route path="/history"    element={<History />} />
        <Route path="/profile"    element={<Profile />} />
        <Route path="/podcast"    element={<Podcast />} />
        <Route path="/journal"    element={<Journal />} />
        <Route path="/games"      element={<Games />} />
      </Routes>
      <PWAInstallPrompt />
      <OnboardingTour />
      <BackToTop />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--bg2)',
            color: 'var(--text1)',
            border: '1px solid var(--border)',
            backdropFilter: 'blur(20px)'
          }
        }}
      />
    </BrowserRouter>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppInner />
      </AuthProvider>
    </ThemeProvider>
  )
}
