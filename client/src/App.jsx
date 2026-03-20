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
import SafetyNew from './pages/SafetyNew'
import Translator from './pages/Translator'
import History from './pages/History'
import Profile from './pages/Profile'
import Podcast from './pages/Podcast'
import Journal from './pages/Journal'
import { recordActivity } from './utils/streak'

function AppInner() {
  const [splashDone, setSplashDone] = useState(false)
  const { user, loading } = useAuth()

  // Record daily activity for streak
  useEffect(() => { if (user) recordActivity() }, [user])

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
      </Routes>
      <PWAInstallPrompt />
      <OnboardingTour />
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
