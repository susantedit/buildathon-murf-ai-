import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, AlertTriangle, Phone, MapPin, Users, Check, X, Settings, ChevronDown, ChevronUp } from 'lucide-react'
import toast from 'react-hot-toast'
import { PageHeader } from '../components/UI'
import { api } from '../services/api'
import { vibrateEmergency, vibrateSuccess } from '../utils/haptics'
import { playSuccessSound, playErrorSound } from '../utils/soundGenerator'
import { useAuth } from '../context/AuthContext'

// Country-specific emergency numbers
const EMERGENCY_NUMBERS = {
  NP: { police: '100', ambulance: '102', country: 'Nepal', flag: '🇳🇵' },
  IN: { police: '100', ambulance: '102', country: 'India', flag: '🇮🇳' },
  US: { police: '911', ambulance: '911', country: 'USA', flag: '🇺🇸' },
  GB: { police: '999', ambulance: '999', country: 'UK', flag: '🇬🇧' },
  AU: { police: '000', ambulance: '000', country: 'Australia', flag: '🇦🇺' },
}

export default function SafetyNew() {
  const { userId, user, signIn } = useAuth()
  // Emergency state
  const [emergencyMode, setEmergencyMode] = useState(false)
  const [holdProgress, setHoldProgress] = useState(0)
  const [isHolding, setIsHolding] = useState(false)
  
  // Status indicators
  const [recording, setRecording] = useState(false)
  const [liveTracking, setLiveTracking] = useState(false)
  const [alertsSent, setAlertsSent] = useState(false)
  const [aiGuidance, setAiGuidance] = useState(null)
  
  // Location & contacts
  const [location, setLocation] = useState(null)
  const [liveTrackingLink, setLiveTrackingLink] = useState(null)
  const [contacts, setContacts] = useState([])
  const [newContact, setNewContact] = useState({ name: '', email: '' })
  
  // Settings
  const [country, setCountry] = useState('NP')
  const [situationType, setSituationType] = useState('general')
  const [showSettings, setShowSettings] = useState(false)
  
  // Refs
  const holdTimerRef = useRef(null)
  const holdIntervalRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const trackingIntervalRef = useRef(null)

  useEffect(() => {
    // Load contacts from MongoDB (permanent, survives browser clears)
    api.getContacts(userId)
      .then(data => setContacts(data))
      .catch(() => {
        // Fallback to localStorage if backend down
        const saved = localStorage.getItem('safety-contacts')
        if (saved) setContacts(JSON.parse(saved))
      })
  }, [])

  // LONG PRESS HANDLER
  const handlePressStart = () => {
    setIsHolding(true)
    setHoldProgress(0)
    
    // Progress animation
    holdIntervalRef.current = setInterval(() => {
      setHoldProgress(prev => {
        if (prev >= 100) {
          clearInterval(holdIntervalRef.current)
          return 100
        }
        return prev + 4 // 100% in 2.5 seconds
      })
    }, 100)
    
    // Trigger after 2.5 seconds
    holdTimerRef.current = setTimeout(() => {
      triggerEmergency()
    }, 2500)
  }

  const handlePressEnd = () => {
    setIsHolding(false)
    setHoldProgress(0)
    clearTimeout(holdTimerRef.current)
    clearInterval(holdIntervalRef.current)
  }

  // START AUTO RECORDING
  const startAutoRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
      mediaRecorderRef.current = new MediaRecorder(stream)
      const chunks = []

      mediaRecorderRef.current.ondataavailable = (e) => chunks.push(e.data)
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' })
        const url = URL.createObjectURL(blob)
        console.log('Evidence recorded:', url)
        // In production: upload to cloud
      }

      mediaRecorderRef.current.start()
      setRecording(true)
    } catch (err) {
      console.error('Recording failed:', err)
    }
  }

  // START LIVE TRACKING
  const startLiveTracking = () => {
    setLiveTracking(true)
    
    // Get initial location
    navigator.geolocation.getCurrentPosition((position) => {
      const loc = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        timestamp: Date.now()
      }
      setLocation(loc)
      
      // Generate shareable link
      const link = `https://www.google.com/maps?q=${loc.lat},${loc.lng}`
      setLiveTrackingLink(link)
    })
    
    // Update every 5 seconds
    trackingIntervalRef.current = setInterval(() => {
      navigator.geolocation.getCurrentPosition((position) => {
        const loc = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          timestamp: Date.now()
        }
        setLocation(loc)
        
        // Update link
        const link = `https://www.google.com/maps?q=${loc.lat},${loc.lng}`
        setLiveTrackingLink(link)
        
        // In production: send to backend
        console.log('Live location update:', loc)
      })
    }, 5000)
  }

  // SEND EMAIL ALERTS TO CONTACTS
  const sendEmailAlerts = async (loc) => {
    if (contacts.length === 0) return

    const emailContacts = contacts.filter(c => c.email && c.email.includes('@'))
    if (emailContacts.length === 0) {
      toast('No valid email contacts — add Gmail addresses')
      return
    }

    try {
      await api.sendAlert({
        toEmails: emailContacts.map(c => c.email),
        userName: emailContacts[0]?.name || 'User',
        location: loc || null,
        situationType
      })
      toast.success(`📧 Alert sent to ${emailContacts.length} contact(s)`)
    } catch (err) {
      console.error('Email alert failed:', err)
      // Fallback to mailto if API fails
      const time = new Date().toLocaleTimeString()
      const mapLink = loc ? `https://maps.google.com/?q=${loc.lat},${loc.lng}` : 'Location unavailable'
      const subject = encodeURIComponent('🚨 Emergency Alert from Vortex Voice AI')
      const body = encodeURIComponent(
`⚠️ EMERGENCY ALERT - Vortex Voice AI

User: ${emailContacts[0]?.name || 'User'}
Time: ${time}
Status: Emergency Active
Situation: ${situationType}

📍 Location: ${mapLink}

Please check on the user immediately.
— Vortex Voice AI Safety System`
      )
      const toList = emailContacts.map(c => c.email).join(',')
      window.open(`mailto:${toList}?subject=${subject}&body=${body}`, '_blank')
      toast('📧 Opened email client (API unavailable)')
    }
  }
  const getAIGuidance = async () => {
    const prompts = {
      followed: 'Someone is following me. Provide 3 immediate actions in bullet points. Be specific.',
      medical: 'Medical emergency. Provide 3 immediate first aid steps in bullet points.',
      harassment: 'Experiencing harassment. Provide 3 immediate safety actions in bullet points.',
      general: 'Emergency situation. Provide 3 immediate safety actions in bullet points.'
    }
    
    try {
      const guidance = await api.generateAdvice(prompts[situationType])
      setAiGuidance(guidance.text)
      
      // Play voice guidance
      if (guidance.audio) {
        const audio = new Audio(guidance.audio)
        audio.play()
      }
    } catch (err) {
      console.error('AI guidance failed:', err)
      setAiGuidance('Stay calm. Help is on the way. Move to a safe, well-lit area.')
    }
  }

  // TRIGGER EMERGENCY
  const triggerEmergency = async () => {
    setEmergencyMode(true)
    vibrateEmergency()
    
    // Play alert sound
    const audio = new Audio()
    audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGGS57OihUBELTKXh8bllHAU2jdXvzn0pBSh+zPDajzsKElyx6OyrWBQLSKDf8sFuIwUrgc7y2Yk2CBhkuezooVARCkyl4fG5ZRwFNo3V7859KQUofsz'
    audio.play().catch(() => {})
    
    // Start all emergency features
    startAutoRecording()
    getAIGuidance()

    // Start live tracking + send email once location is ready
    setLiveTracking(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const loc = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          timestamp: Date.now()
        }
        setLocation(loc)
        const link = `https://www.google.com/maps?q=${loc.lat},${loc.lng}`
        setLiveTrackingLink(link)
        sendEmailAlerts(loc)
        // Continue live updates every 5s
        trackingIntervalRef.current = setInterval(() => {
          navigator.geolocation.getCurrentPosition((p) => {
            const updated = { lat: p.coords.latitude, lng: p.coords.longitude, timestamp: Date.now() }
            setLocation(updated)
            setLiveTrackingLink(`https://www.google.com/maps?q=${updated.lat},${updated.lng}`)
          })
        }, 5000)
      },
      () => {
        // No location — still send alert
        sendEmailAlerts(null)
        startLiveTracking()
      }
    )

    // Send alerts
    setTimeout(() => {
      setAlertsSent(true)
      toast.success(`🚨 Alert sent to ${contacts.length} contact(s)`)
    }, 1000)
  }

  // CANCEL EMERGENCY
  const cancelEmergency = () => {
    setEmergencyMode(false)
    setRecording(false)
    setLiveTracking(false)
    setAlertsSent(false)
    setAiGuidance(null)
    
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
    }
    
    if (trackingIntervalRef.current) {
      clearInterval(trackingIntervalRef.current)
    }
    
    toast('Emergency cancelled')
  }

  // CALL EMERGENCY
  const callEmergency = (type) => {
    const number = EMERGENCY_NUMBERS[country][type]
    window.location.href = `tel:${number}`
  }

  // CONTACT MANAGEMENT
  const addContact = async () => {
    if (!newContact.name || !newContact.email || !newContact.email.includes('@')) {
      playErrorSound()
      return toast.error('Enter name and a valid Gmail address')
    }
    // Require Google sign-in for permanent storage
    if (!user) {
      toast('Sign in with Google to save contacts permanently', {
        icon: '🔐',
        duration: 4000,
        style: { cursor: 'pointer' }
      })
      try { await signIn() } catch { return }
    }
    try {
      playSuccessSound()
      const saved = await api.addContact({ deviceId: userId, name: newContact.name, email: newContact.email })
      const updated = [...contacts, saved]
      setContacts(updated)
      // Also keep localStorage as backup
      localStorage.setItem('safety-contacts', JSON.stringify(updated))
      setNewContact({ name: '', email: '' })
      toast.success('Contact saved permanently')
    } catch (err) {
      // Fallback: save to localStorage only
      const fallback = [...contacts, { ...newContact, id: Date.now() }]
      setContacts(fallback)
      localStorage.setItem('safety-contacts', JSON.stringify(fallback))
      setNewContact({ name: '', email: '' })
      toast('Contact saved locally (backend offline)')
    }
  }

  const removeContact = async (id) => {
    try {
      await api.deleteContact(id)
    } catch (_) { /* ignore if offline */ }
    const updated = contacts.filter(c => (c._id || c.id) !== id)
    setContacts(updated)
    localStorage.setItem('safety-contacts', JSON.stringify(updated))
    toast.success('Contact removed')
  }

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop()
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
      }
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current)
      }
    }
  }, [])

  return (
    <div className="page-wrapper" style={{ 
      '--page-accent': '#ef4444',
      background: emergencyMode ? 'linear-gradient(180deg, rgba(239,68,68,0.2) 0%, var(--bg1) 100%)' : 'var(--bg1)'
    }}>
      <div className="page-content" style={{ maxWidth: emergencyMode ? '100%' : '600px', padding: emergencyMode ? '0' : '20px' }}>
        
        {/* EMERGENCY MODE - FULL SCREEN */}
        {emergencyMode ? (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            style={{ 
              minHeight: '100vh', 
              display: 'flex', 
              flexDirection: 'column',
              padding: '20px'
            }}>
            
            {/* Status Header */}
            <div style={{ 
              background: 'rgba(239,68,68,0.15)', 
              border: '2px solid rgba(239,68,68,0.4)',
              borderRadius: 16,
              padding: 20,
              marginBottom: 20
            }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#ef4444', marginBottom: 12, textAlign: 'center' }}>
                🚨 EMERGENCY ACTIVE
              </div>
              
              {/* Status Indicators */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                <div style={{ 
                  padding: 12, 
                  borderRadius: 10, 
                  background: recording ? 'rgba(239,68,68,0.2)' : 'rgba(100,116,139,0.1)',
                  border: `1px solid ${recording ? 'rgba(239,68,68,0.4)' : 'rgba(100,116,139,0.2)'}`,
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: 20, marginBottom: 4 }}>🔴</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: recording ? '#ef4444' : 'var(--text3)' }}>
                    {recording ? 'Recording' : 'Standby'}
                  </div>
                </div>
                
                <div style={{ 
                  padding: 12, 
                  borderRadius: 10, 
                  background: liveTracking ? 'rgba(59,130,246,0.2)' : 'rgba(100,116,139,0.1)',
                  border: `1px solid ${liveTracking ? 'rgba(59,130,246,0.4)' : 'rgba(100,116,139,0.2)'}`,
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: 20, marginBottom: 4 }}>📍</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: liveTracking ? '#3b82f6' : 'var(--text3)' }}>
                    {liveTracking ? 'Live Tracking' : 'Standby'}
                  </div>
                </div>
                
                <div style={{ 
                  padding: 12, 
                  borderRadius: 10, 
                  background: alertsSent ? 'rgba(16,185,129,0.2)' : 'rgba(100,116,139,0.1)',
                  border: `1px solid ${alertsSent ? 'rgba(16,185,129,0.4)' : 'rgba(100,116,139,0.2)'}`,
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: 20, marginBottom: 4 }}>📱</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: alertsSent ? '#10b981' : 'var(--text3)' }}>
                    {alertsSent ? 'Alerts Sent' : 'Pending'}
                  </div>
                </div>
                
                <div style={{ 
                  padding: 12, 
                  borderRadius: 10, 
                  background: aiGuidance ? 'rgba(139,92,246,0.2)' : 'rgba(100,116,139,0.1)',
                  border: `1px solid ${aiGuidance ? 'rgba(139,92,246,0.4)' : 'rgba(100,116,139,0.2)'}`,
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: 20, marginBottom: 4 }}>🤖</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: aiGuidance ? '#8b5cf6' : 'var(--text3)' }}>
                    {aiGuidance ? 'AI Active' : 'Loading'}
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <button 
                  onClick={() => callEmergency('police')}
                  style={{
                    padding: 14,
                    borderRadius: 10,
                    border: '2px solid #ef4444',
                    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                    color: '#fff',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}>
                  📞 Police {EMERGENCY_NUMBERS[country].police}
                </button>
                <button 
                  onClick={() => callEmergency('ambulance')}
                  style={{
                    padding: 14,
                    borderRadius: 10,
                    border: '2px solid #ef4444',
                    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                    color: '#fff',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}>
                  🚑 Ambulance {EMERGENCY_NUMBERS[country].ambulance}
                </button>
              </div>
            </div>

            {/* AI Guidance */}
            {aiGuidance && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }}
                style={{
                  background: 'rgba(139,92,246,0.15)',
                  border: '2px solid rgba(139,92,246,0.4)',
                  borderRadius: 16,
                  padding: 20,
                  marginBottom: 20
                }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#8b5cf6', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 20 }}>🤖</span>
                  AI SAFETY GUIDANCE
                </div>
                <div style={{ fontSize: 13, color: 'var(--text1)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                  {aiGuidance}
                </div>
              </motion.div>
            )}

            {/* Live Location */}
            {liveTrackingLink && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }}
                style={{
                  background: 'rgba(59,130,246,0.15)',
                  border: '2px solid rgba(59,130,246,0.4)',
                  borderRadius: 16,
                  padding: 20,
                  marginBottom: 20
                }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#3b82f6', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 20 }}>📍</span>
                  LIVE LOCATION
                </div>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 10 }}>
                  {location && (
                    <>
                      <div>Lat: {location.lat.toFixed(6)}</div>
                      <div>Lng: {location.lng.toFixed(6)}</div>
                      <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>
                        Updated: {new Date(location.timestamp).toLocaleTimeString()}
                      </div>
                    </>
                  )}
                </div>
                <a 
                  href={liveTrackingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'block',
                    padding: 12,
                    borderRadius: 8,
                    background: '#3b82f6',
                    color: '#fff',
                    textAlign: 'center',
                    fontSize: 13,
                    fontWeight: 600,
                    textDecoration: 'none'
                  }}>
                  View on Google Maps →
                </a>
              </motion.div>
            )}

            {/* Cancel Button */}
            <button 
              onClick={cancelEmergency}
              style={{
                marginTop: 'auto',
                padding: 16,
                borderRadius: 12,
                border: '2px solid rgba(239,68,68,0.4)',
                background: 'rgba(239,68,68,0.1)',
                color: '#ef4444',
                fontSize: 15,
                fontWeight: 700,
                cursor: 'pointer'
              }}>
              Cancel Emergency
            </button>
          </motion.div>
        ) : (
          /* NORMAL MODE - BIG SOS BUTTON */
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <PageHeader icon={Shield} color="#ef4444" title="Safety Guardian" sub="Hold button for 2.5s to activate emergency" />

            {/* BIG SOS BUTTON */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh', marginBottom: 30 }}>
              <motion.button
                onMouseDown={handlePressStart}
                onMouseUp={handlePressEnd}
                onMouseLeave={handlePressEnd}
                onTouchStart={handlePressStart}
                onTouchEnd={handlePressEnd}
                whileTap={{ scale: 0.95 }}
                style={{
                  position: 'relative',
                  width: 280,
                  height: 280,
                  borderRadius: '50%',
                  border: '8px solid #ef4444',
                  background: isHolding 
                    ? `conic-gradient(#ef4444 ${holdProgress}%, rgba(239,68,68,0.2) ${holdProgress}%)`
                    : 'linear-gradient(135deg, #ef4444, #dc2626)',
                  color: '#fff',
                  fontSize: 24,
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 20px 60px rgba(239,68,68,0.4)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 12,
                  transition: 'all 0.2s'
                }}>
                <AlertTriangle size={48} />
                <div>HOLD FOR</div>
                <div style={{ fontSize: 32 }}>SOS</div>
                {isHolding && (
                  <div style={{ fontSize: 14, fontWeight: 600 }}>
                    {Math.ceil((100 - holdProgress) / 40)}s
                  </div>
                )}
              </motion.button>
            </div>

            {/* Settings Toggle */}
            <button 
              onClick={() => setShowSettings(!showSettings)}
              style={{
                width: '100%',
                padding: 14,
                borderRadius: 12,
                border: '1px solid var(--border)',
                background: 'var(--glass)',
                color: 'var(--text1)',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 16
              }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Settings size={16} />
                Settings & Contacts
              </div>
              {showSettings ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {/* Settings Panel */}
            <AnimatePresence>
              {showSettings && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ overflow: 'hidden' }}>
                  
                  {/* Country */}
                  <div className="card" style={{ padding: 16, marginBottom: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text1)', marginBottom: 8 }}>
                      {EMERGENCY_NUMBERS[country].flag} Country
                    </div>
                    <select 
                      value={country} 
                      onChange={(e) => setCountry(e.target.value)}
                      className="inp" 
                      style={{ fontSize: 13 }}>
                      <option value="NP">🇳🇵 Nepal (100, 102)</option>
                      <option value="IN">🇮🇳 India (100, 102)</option>
                      <option value="US">🇺🇸 USA (911)</option>
                      <option value="GB">🇬🇧 UK (999)</option>
                      <option value="AU">🇦🇺 Australia (000)</option>
                    </select>
                  </div>

                  {/* Situation Type */}
                  <div className="card" style={{ padding: 16, marginBottom: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text1)', marginBottom: 8 }}>
                      Situation Type
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {[
                        { value: 'general', label: '⚠️ General' },
                        { value: 'followed', label: '👤 Followed' },
                        { value: 'medical', label: '🏥 Medical' },
                        { value: 'harassment', label: '🚫 Harassment' }
                      ].map(({ value, label }) => (
                        <button 
                          key={value}
                          onClick={() => setSituationType(value)}
                          style={{
                            padding: 10,
                            borderRadius: 8,
                            border: `1px solid ${situationType === value ? 'rgba(239,68,68,0.4)' : 'var(--border)'}`,
                            background: situationType === value ? 'rgba(239,68,68,0.15)' : 'var(--glass)',
                            color: situationType === value ? '#ef4444' : 'var(--text1)',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Emergency Contacts */}
                  <div className="card" style={{ padding: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text1)', marginBottom: 4 }}>
                      Emergency Contacts ({contacts.length})
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 12, padding: '6px 10px', borderRadius: 6, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
                      ⚠️ Demo uses email (mailto). Real SMS/push requires backend integration.
                    </div>
                    
                    <div style={{ marginBottom: 12 }}>
                      <input 
                        type="text" 
                        placeholder="Contact Name" 
                        value={newContact.name}
                        onChange={e => setNewContact({ ...newContact, name: e.target.value })}
                        className="inp" 
                        style={{ marginBottom: 6, fontSize: 13 }} 
                      />
                      <input 
                        type="email" 
                        placeholder="Gmail address (e.g. friend@gmail.com)" 
                        value={newContact.email}
                        onChange={e => setNewContact({ ...newContact, email: e.target.value })}
                        className="inp" 
                        style={{ marginBottom: 8, fontSize: 13 }} 
                      />
                      <button 
                        onClick={addContact} 
                        className="btn"
                        style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', fontSize: 13 }}>
                        <Check size={14} />Add Contact
                      </button>
                    </div>

                    {contacts.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: 16, color: 'var(--text3)', fontSize: 12 }}>
                        No contacts added — add a Gmail to receive emergency alerts
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {contacts.map(contact => (
                          <div 
                            key={contact._id || contact.id} 
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'space-between', 
                              padding: 10, 
                              borderRadius: 8, 
                              background: 'var(--glass)', 
                              border: '1px solid var(--border)' 
                            }}>
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text1)' }}>
                                {contact.name}
                              </div>
                              <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                                {contact.email || contact.phone}
                              </div>
                            </div>
                            <button 
                              onClick={() => removeContact(contact._id || contact.id)}
                              style={{ 
                                width: 24, 
                                height: 24, 
                                borderRadius: 6, 
                                border: '1px solid rgba(239,68,68,0.3)', 
                                background: 'rgba(239,68,68,0.1)', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                cursor: 'pointer' 
                              }}>
                              <X size={12} color="#ef4444" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Info */}
            <div className="card" style={{ padding: 14, marginTop: 16, background: 'rgba(59,130,246,0.08)', borderColor: 'rgba(59,130,246,0.2)' }}>
              <div style={{ fontSize: 11, color: 'var(--text2)', lineHeight: 1.6 }}>
                <strong style={{ color: '#3b82f6' }}>How it works:</strong> Hold the SOS button for 2.5 seconds to activate. The system will automatically start recording, track your location live, send alerts to contacts, and provide AI safety guidance.
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
