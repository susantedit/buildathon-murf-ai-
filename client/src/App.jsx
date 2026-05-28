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
import Home from './pages/HomeNew'
import Interviews from './pages/Interviews'
import InterviewBuilder from './pages/InterviewBuilder'
import InterviewRoom from './pages/InterviewRoom'
import InterviewReview from './pages/InterviewReview'
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
import CageBait from './pages/CageBait'
import Verification from './pages/Verification'
import CursorGlow from './components/CursorGlow'
import { AdaptiveUIProvider } from './components/AdaptiveUIContext'
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
          style={{ position: 'fixed', bottom: 80, right: 16, width: 46, height: 46, borderRadius: '16px', border: '1px solid rgba(255,255,255,0.14)', background: 'linear-gradient(135deg, rgba(34,211,238,0.95), rgba(249,115,22,0.95))', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 900, boxShadow: '0 18px 40px rgba(34,211,238,0.25)' }}>
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
        <Route path="/interviews" element={<Interviews />} />
        <Route path="/interviews/new" element={<InterviewBuilder />} />
        <Route path="/interviews/live/:sessionId" element={<InterviewRoom />} />
        <Route path="/interviews/review/:sessionId" element={<InterviewReview />} />
        <Route path="/vortex"     element={<Home />} />
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
        <Route path="/cagebait"   element={<CageBait />} />
        <Route path="/verification" element={<Verification />} />
      </Routes>
      <PWAInstallPrompt />
      <OnboardingTour />
      <BackToTop />
      <CursorGlow />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'rgba(7, 12, 24, 0.92)',
            color: 'var(--text1)',
            border: '1px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(20px)',
            borderRadius: '14px',
            boxShadow: '0 16px 50px rgba(2, 6, 23, 0.35)'
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
        <AdaptiveUIProvider>
          <AppInner />
        </AdaptiveUIProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
