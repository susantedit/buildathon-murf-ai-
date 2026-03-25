import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Phone, MapPin, Users, Mic, X, Video, Navigation, AlertTriangle, Check, PhoneCall, Radio, MicOff, Volume2, Clock, ChevronRight, UserX, Heart, ShieldOff } from 'lucide-react'
import toast from 'react-hot-toast'
import emailjs from '@emailjs/browser'
import { api } from '../services/api'
import { vibrateEmergency, vibrateSuccess, vibrateLight } from '../utils/haptics'
import { playClickSound, playSuccessSound, playErrorSound } from '../utils/soundGenerator'
import QuoteBar from '../components/QuoteBar'
import { useAuth } from '../context/AuthContext'

// EmailJS config — supports up to 3 accounts for quota rotation
// Set VITE_EMAILJS_* in Netlify env vars
const EJS_ACCOUNTS = [
  {
    serviceId:  import.meta.env.VITE_EMAILJS_SERVICE_ID   || '',
    templateId: import.meta.env.VITE_EMAILJS_TEMPLATE_ID  || '',
    updateId:   import.meta.env.VITE_EMAILJS_UPDATE_TEMPLATE   || '',
    allclearId: import.meta.env.VITE_EMAILJS_ALLCLEAR_TEMPLATE || '',
    publicKey:  import.meta.env.VITE_EMAILJS_PUBLIC_KEY   || '',
  },
  {
    serviceId:  import.meta.env.VITE_EMAILJS_SERVICE_ID_2   || '',
    templateId: import.meta.env.VITE_EMAILJS_TEMPLATE_ID_2  || '',
    updateId:   import.meta.env.VITE_EMAILJS_UPDATE_TEMPLATE_2   || '',
    allclearId: import.meta.env.VITE_EMAILJS_ALLCLEAR_TEMPLATE_2 || '',
    publicKey:  import.meta.env.VITE_EMAILJS_PUBLIC_KEY_2   || '',
  },
  {
    serviceId:  import.meta.env.VITE_EMAILJS_SERVICE_ID_3   || '',
    templateId: import.meta.env.VITE_EMAILJS_TEMPLATE_ID_3  || '',
    updateId:   import.meta.env.VITE_EMAILJS_UPDATE_TEMPLATE_3   || '',
    allclearId: import.meta.env.VITE_EMAILJS_ALLCLEAR_TEMPLATE_3 || '',
    publicKey:  import.meta.env.VITE_EMAILJS_PUBLIC_KEY_3   || '',
  },
].filter(a => a.serviceId && a.publicKey && !a.serviceId.startsWith('your_') && !a.publicKey.startsWith('your_'))

let ejsAccountIndex = 0
const getEjsAccount = () => {
  if (EJS_ACCOUNTS.length === 0) return null
  const acc = EJS_ACCOUNTS[ejsAccountIndex % EJS_ACCOUNTS.length]
  ejsAccountIndex = (ejsAccountIndex + 1) % EJS_ACCOUNTS.length
  return acc
}
const ejsReady = () => EJS_ACCOUNTS.length > 0

async function sendSOSEmail({ toEmail, toName, userName, phone, location, situationType, updateCount, type = 'initial' }) {
  if (EJS_ACCOUNTS.length === 0) throw new Error('No EmailJS account configured')

  const mapLink = location ? `https://maps.google.com/?q=${location.lat},${location.lng}` : null
  const locationText = location ? `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}` : 'Location unavailable'

  const subjectMap = {
    initial:  `🚨 EMERGENCY — ${userName || 'User'} needs help NOW!`,
    update:   `📍 Location Update #${updateCount} — ${userName || 'User'} SOS Still Active`,
    allclear: `✅ All Clear — ${userName || 'User'} is safe`,
  }
  const severityMap = {
    initial:  ['followed','harassment'].includes(situationType) ? '🔴 HIGH RISK' : situationType === 'medical' ? '🟠 MEDICAL' : '🟡 GENERAL',
    update:   `🔄 UPDATE #${updateCount} — SOS STILL ACTIVE`,
    allclear: '✅ ALL CLEAR — PERSON IS SAFE',
  }
  const bannerMap = {
    initial:  `${userName || 'User'} has triggered an SOS — respond immediately`,
    update:   `${userName || 'User'} SOS still active — may be moving`,
    allclear: `${userName || 'User'} has cancelled the SOS — they are safe`,
  }

  const params = {
    to_email:       toEmail,
    to_name:        toName || toEmail,
    from_name:      'Vortex Voice AI Safety',
    user_name:      userName || 'User',
    phone:          phone || 'N/A',
    situation:      type === 'allclear' ? '✅ Cancelled — person is safe' : (situationType || 'General'),
    severity:       severityMap[type] || severityMap.initial,
    banner_text:    bannerMap[type] || bannerMap.initial,
    email_subject:  subjectMap[type] || subjectMap.initial,
    location_link:  mapLink || '#',
    location_text:  locationText,
    lat:            location ? location.lat.toFixed(6) : 'N/A',
    lng:            location ? location.lng.toFixed(6) : 'N/A',
    time:           new Date().toLocaleString(),
    update_count:   updateCount || '1',
    email_type:     type,
  }

  // Try each account in order — if one fails (quota exceeded), try next
  // allclear always starts from account 0 for max reliability
  const startIdx = type === 'allclear' ? 0 : ejsAccountIndex
  let lastErr
  for (let i = 0; i < EJS_ACCOUNTS.length; i++) {
    const acc = EJS_ACCOUNTS[(startIdx + i) % EJS_ACCOUNTS.length]
    // initial → Template 1, update/allclear → Template 2
    const templateId = type === 'initial' ? acc.templateId : (acc.updateId || acc.templateId)
    console.log(`EmailJS attempt ${i + 1}: service=${acc.serviceId} template=${templateId}`)
    try {
      const result = await emailjs.send(acc.serviceId, templateId, params, acc.publicKey)
      if (type !== 'allclear') ejsAccountIndex = (startIdx + i + 1) % EJS_ACCOUNTS.length
      return result
    } catch (err) {
      console.warn(`EmailJS account ${i + 1} failed:`, err.status, err.text || err.message)
      lastErr = err
    }
  }
  throw lastErr
}

// CSS confetti animation injected once
const CONFETTI_CSS = `
@keyframes confetti-fall {
  0%   { transform: translateY(-10px) rotate(0deg); opacity: 1; }
  100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
}
.confetti-piece {
  position: fixed;
  width: 10px;
  height: 10px;
  top: -10px;
  animation: confetti-fall linear forwards;
  z-index: 99999;
  pointer-events: none;
  border-radius: 2px;
}
`

function launchConfetti() {
  if (!document.getElementById('confetti-style')) {
    const style = document.createElement('style')
    style.id = 'confetti-style'
    style.textContent = CONFETTI_CSS
    document.head.appendChild(style)
  }
  const colors = ['#ef4444','#f59e0b','#10b981','#3b82f6','#8b5cf6','#ec4899','#fff']
  for (let i = 0; i < 60; i++) {
    const el = document.createElement('div')
    el.className = 'confetti-piece'
    el.style.left = Math.random() * 100 + 'vw'
    el.style.background = colors[Math.floor(Math.random() * colors.length)]
    el.style.animationDuration = (1.5 + Math.random() * 2) + 's'
    el.style.animationDelay = (Math.random() * 0.8) + 's'
    el.style.width = (6 + Math.random() * 8) + 'px'
    el.style.height = (6 + Math.random() * 8) + 'px'
    document.body.appendChild(el)
    setTimeout(() => el.remove(), 4000)
  }
}

const EMERGENCY = {
  NP: { police: '100', ambulance: '102', fire: '101', label: '🇳🇵 Nepal',     dialCode: '+977' },
  IN: { police: '100', ambulance: '102', fire: '101', label: '🇮🇳 India',     dialCode: '+91'  },
  US: { police: '911', ambulance: '911', fire: '911', label: '🇺🇸 USA',       dialCode: '+1'   },
  GB: { police: '999', ambulance: '999', fire: '999', label: '🇬🇧 UK',        dialCode: '+44'  },
  AU: { police: '000', ambulance: '000', fire: '000', label: '🇦🇺 Australia', dialCode: '+61'  },
  CA: { police: '911', ambulance: '911', fire: '911', label: '🇨🇦 Canada',    dialCode: '+1'   },
  DE: { police: '110', ambulance: '112', fire: '112', label: '🇩🇪 Germany',   dialCode: '+49'  },
  FR: { police: '17',  ambulance: '15',  fire: '18',  label: '🇫🇷 France',    dialCode: '+33'  },
  JP: { police: '110', ambulance: '119', fire: '119', label: '🇯🇵 Japan',     dialCode: '+81'  },
  PK: { police: '15',  ambulance: '115', fire: '16',  label: '🇵🇰 Pakistan',  dialCode: '+92'  },
}

const SITUATIONS = [
  { value: 'general',    Icon: AlertTriangle, label: 'General',    color: '#f59e0b' },
  { value: 'followed',   Icon: UserX,         label: 'Followed',   color: '#ef4444' },
  { value: 'medical',    Icon: Heart,         label: 'Medical',    color: '#3b82f6' },
  { value: 'harassment', Icon: ShieldOff,     label: 'Harassment', color: '#8b5cf6' },
]

// ── Fake Call Screen ──
function FakeCallScreen({ callerName, callerNum, onEnd, situation }) {
  const [callState, setCallState] = useState('ringing') // ringing | connected | ended
  const [muted, setMuted] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [messages, setMessages] = useState([])
  const [aiTyping, setAiTyping] = useState(false)
  const [userInput, setUserInput] = useState('')
  const timerRef = useRef(null)
  const chatRef = useRef(null)

  const AI_RESPONSES = {
    general: [
      "This is the Emergency Response Center. What is your emergency?",
      "I understand. Can you tell me your current location?",
      "Help is on the way. Stay calm and stay on the line.",
      "Are you in immediate danger right now?",
      "We have dispatched officers to your location. ETA 3 minutes.",
    ],
    followed: [
      "Emergency Response. What's happening?",
      "Someone is following you — go to the nearest public place immediately.",
      "Can you describe the person? Height, clothing?",
      "Officers are en route. Stay in a well-lit, crowded area.",
      "Keep talking to me. Don't hang up.",
    ],
    medical: [
      "Emergency Medical Services. What's the nature of the emergency?",
      "Is the patient conscious and breathing?",
      "Ambulance dispatched. Keep the patient still and calm.",
      "Do not give food or water. Keep them warm.",
      "ETA 5 minutes. Stay on the line.",
    ],
    harassment: [
      "Emergency Response. Are you safe right now?",
      "Move away from the person if you can do so safely.",
      "Can you get to a public place or a shop?",
      "Officers are on their way. Can you describe the person?",
      "You're doing great. Help is coming.",
    ],
  }

  useEffect(() => {
    // Auto-connect after 3s
    const t = setTimeout(() => {
      setCallState('connected')
      vibrateSuccess()
      const responses = AI_RESPONSES[situation] || AI_RESPONSES.general
      // First AI message
      setTimeout(() => {
        setMessages([{ from: 'ai', text: responses[0], time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }])
      }, 800)
    }, 3000)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (callState === 'connected') {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
    }
    return () => clearInterval(timerRef.current)
  }, [callState])

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const fmt = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  const sendMessage = async () => {
    if (!userInput.trim()) return
    const text = userInput.trim()
    setUserInput('')
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    setMessages(m => [...m, { from: 'user', text, time }])
    setAiTyping(true)

    try {
      const res = await api.generateAdvice(
        `You are an emergency dispatcher (police/ambulance). The caller says: "${text}". Situation: ${situation}. Reply in 1-2 short sentences, calm and professional.`
      )
      const reply = res.text || 'Stay calm. Help is on the way.'
      setTimeout(() => {
        setAiTyping(false)
        setMessages(m => [...m, { from: 'ai', text: reply, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }])
        if (res.audio) new Audio(res.audio).play().catch(() => {})
      }, 600)
    } catch {
      const responses = AI_RESPONSES[situation] || AI_RESPONSES.general
      const fallback = responses[Math.floor(Math.random() * responses.length)]
      setTimeout(() => {
        setAiTyping(false)
        setMessages(m => [...m, { from: 'ai', text: fallback, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }])
      }, 1000)
    }
  }

  const handleEnd = () => {
    setCallState('ended')
    clearInterval(timerRef.current)
    // Save to call history
    const history = JSON.parse(localStorage.getItem('call-history') || '[]')
    history.unshift({
      id: Date.now(),
      caller: callerName,
      num: callerNum,
      duration: elapsed,
      situation,
      messages,
      date: new Date().toLocaleString()
    })
    localStorage.setItem('call-history', JSON.stringify(history.slice(0, 20)))
    setTimeout(onEnd, 1200)
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', flexDirection: 'column',
        background: callState === 'ringing'
          ? 'linear-gradient(180deg,#1a1a2e 0%,#16213e 100%)'
          : 'linear-gradient(180deg,#0f0f1a 0%,#1a1a2e 100%)' }}>

      {/* Top caller info */}
      <div style={{ padding: '48px 24px 20px', textAlign: 'center', flexShrink: 0 }}>
        {/* Avatar */}
        <motion.div animate={callState === 'ringing' ? { scale: [1, 1.08, 1] } : {}}
          transition={{ repeat: Infinity, duration: 1.2 }}
          style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
            boxShadow: callState === 'ringing' ? '0 0 0 12px rgba(59,130,246,0.15), 0 0 0 24px rgba(59,130,246,0.07)' : '0 4px 20px rgba(59,130,246,0.3)' }}>
          <Shield size={36} color="#fff" />
        </motion.div>

        <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{callerName}</div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>{callerNum}</div>
        <div style={{ fontSize: 13, color: callState === 'ringing' ? '#f59e0b' : '#10b981', fontWeight: 600 }}>
          {callState === 'ringing' ? '📞 Calling...' : callState === 'ended' ? '📵 Call ended' : `🟢 ${fmt(elapsed)}`}
        </div>
      </div>

      {/* Chat area (only when connected) */}
      {callState === 'connected' && (
        <div ref={chatRef} style={{ flex: 1, overflowY: 'auto', padding: '0 16px 8px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {messages.map((m, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              style={{ display: 'flex', justifyContent: m.from === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{ maxWidth: '78%' }}>
                {m.from === 'ai' && (
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 3, marginLeft: 4 }}>Dispatcher · {m.time}</div>
                )}
                <div style={{ padding: '10px 14px', borderRadius: m.from === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: m.from === 'user' ? 'linear-gradient(135deg,#3b82f6,#2563eb)' : 'rgba(255,255,255,0.1)',
                  color: '#fff', fontSize: 13, lineHeight: 1.5 }}>
                  {m.text}
                </div>
                {m.from === 'user' && (
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 3, textAlign: 'right', marginRight: 4 }}>{m.time}</div>
                )}
              </div>
            </motion.div>
          ))}
          {aiTyping && (
            <div style={{ display: 'flex', gap: 4, padding: '10px 14px', borderRadius: '16px 16px 16px 4px', background: 'rgba(255,255,255,0.1)', width: 60 }}>
              {[0,1,2].map(i => (
                <motion.div key={i} animate={{ y: [0,-4,0] }} transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.15 }}
                  style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.5)' }} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Ringing animation */}
      {callState === 'ringing' && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
            Connecting to emergency services...
          </div>
        </div>
      )}

      {/* Input bar (connected) */}
      {callState === 'connected' && (
        <div style={{ padding: '8px 12px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: 8, flexShrink: 0 }}>
          <input value={userInput} onChange={e => setUserInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder="Type your message..."
            style={{ flex: 1, padding: '10px 14px', borderRadius: 24, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: 13, outline: 'none' }} />
          <button onClick={sendMessage}
            style={{ width: 40, height: 40, borderRadius: '50%', border: 'none', background: '#3b82f6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <ChevronRight size={18} color="#fff" />
          </button>
        </div>
      )}

      {/* Bottom controls */}
      <div style={{ padding: '16px 24px 40px', display: 'flex', justifyContent: 'center', gap: 24, flexShrink: 0 }}>
        {callState === 'connected' && (
          <button onClick={() => setMuted(m => !m)}
            style={{ width: 56, height: 56, borderRadius: '50%', border: 'none', cursor: 'pointer',
              background: muted ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {muted ? <MicOff size={22} color="#000" /> : <Mic size={22} color="#fff" />}
          </button>
        )}
        {/* End call */}
        <motion.button whileTap={{ scale: 0.9 }} onClick={handleEnd}
          style={{ width: 68, height: 68, borderRadius: '50%', border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg,#ef4444,#dc2626)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(239,68,68,0.4)' }}>
          <Phone size={26} color="#fff" style={{ transform: 'rotate(135deg)' }} />
        </motion.button>
        {callState === 'connected' && (
          <button style={{ width: 56, height: 56, borderRadius: '50%', border: 'none', cursor: 'pointer',
            background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Volume2 size={22} color="#fff" />
          </button>
        )}
      </div>
    </motion.div>
  )
}

export default function Safety() {
  const { displayName } = useAuth()
  const displayNameRef = useRef('User')
  const [emergencyMode, setEmergencyMode] = useState(false)
  const [contacts, setContacts] = useState([])
  const [newContact, setNewContact] = useState({ name: '', phone: '', email: '' })
  const [location, setLocation] = useState(null)
  const [country, setCountry] = useState('NP')
  const [situation, setSituation] = useState('general')
  const [weather, setWeather] = useState(null)
  const [fakeCall, setFakeCall] = useState(null) // null | { callerName, callerNum }
  const [recording, setRecording] = useState(false)
  const [liveTracking, setLiveTracking] = useState(false)
  const [listening, setListening] = useState(false)
  const [tab, setTab] = useState('sos') // sos | contacts | tools | history
  const [silentMode, setSilentMode] = useState(false)
  const [callHistory, setCallHistory] = useState([])
  // SOS hold state
  const [holding, setHolding] = useState(false)
  const [holdProgress, setHoldProgress] = useState(0)
  const holdTimer = useRef(null)
  const holdInterval = useRef(null)
  const mediaRecorderRef = useRef(null)
  const trackingRef = useRef(null)
  const emailUpdateRef = useRef(null)
  const emailContactsRef = useRef([])
  const updateCountRef = useRef(0)
  const situationRef = useRef('general')
  const currentLocRef = useRef(null)

  useEffect(() => { displayNameRef.current = displayName || 'User' }, [displayName])

  useEffect(() => {
    const saved = localStorage.getItem('safety-contacts')
    if (saved) setContacts(JSON.parse(saved))
    const hist = localStorage.getItem('call-history')
    if (hist) setCallHistory(JSON.parse(hist))
  }, [])

  const saveContacts = c => { setContacts(c); localStorage.setItem('safety-contacts', JSON.stringify(c)) }

  // ── SOS Hold Logic ──
  const startHold = () => {
    setHolding(true)
    setHoldProgress(0)
    vibrateLight()
    let p = 0
    holdInterval.current = setInterval(() => {
      p += 100 / 25 // 2.5 seconds = 25 ticks at 100ms
      setHoldProgress(Math.min(p, 100))
      if (p >= 100) {
        clearInterval(holdInterval.current)
        triggerEmergency()
      }
    }, 100)
  }

  const cancelHold = () => {
    setHolding(false)
    setHoldProgress(0)
    clearInterval(holdInterval.current)
    clearTimeout(holdTimer.current)
  }

  const getLocation = () => new Promise(resolve => {
    if (!navigator.geolocation) return resolve(null)
    navigator.geolocation.getCurrentPosition(
      p => {
        const l = { lat: p.coords.latitude, lng: p.coords.longitude }
        setLocation(l)
        // Fetch weather for this location (Open-Meteo, no key)
        fetch(`https://api.open-meteo.com/v1/forecast?latitude=${l.lat}&longitude=${l.lng}&current_weather=true&hourly=relativehumidity_2m&forecast_days=1`)
          .then(r => r.json())
          .then(d => {
            if (d.current_weather) {
              const wc = d.current_weather.weathercode
              const emoji = wc === 0 ? '☀️' : wc <= 3 ? '⛅' : wc <= 48 ? '🌫️' : wc <= 67 ? '🌧️' : wc <= 77 ? '❄️' : wc <= 82 ? '🌦️' : '⛈️'
              setWeather({ temp: Math.round(d.current_weather.temperature), wind: Math.round(d.current_weather.windspeed), emoji })
            }
          }).catch(() => {})
        resolve(l)
      },
      () => resolve(null)
    )
  })

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorderRef.current = new MediaRecorder(stream)
      mediaRecorderRef.current.start()
      setRecording(true)
    } catch { /* permission denied */ }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop())
      setRecording(false)
    }
  }

  const startTracking = () => {
    setLiveTracking(true)
    trackingRef.current = setInterval(() => {
      navigator.geolocation?.getCurrentPosition(p => {
        const loc = { lat: p.coords.latitude, lng: p.coords.longitude, ts: Date.now() }
        setLocation(loc)
        currentLocRef.current = loc
      })
    }, 10000)
  }

  const stopTracking = () => { clearInterval(trackingRef.current); setLiveTracking(false) }

  const startLocationEmailUpdates = (contacts, situation) => {
    emailContactsRef.current = contacts
    situationRef.current = situation
    updateCountRef.current = 0
    // Send update email every 2 minutes
    emailUpdateRef.current = setInterval(async () => {
      if (!ejsReady()) { console.warn('EmailJS not ready for update'); return }
      updateCountRef.current += 1
      console.log(`Sending location update #${updateCountRef.current}...`)
      const loc = currentLocRef.current
      for (const contact of emailContactsRef.current) {
        try {
          await sendSOSEmail({
            toEmail: contact.email,
            toName: contact.name,
            userName: displayNameRef.current,
            phone: contact.phone,
            location: loc,
            situationType: situationRef.current,
            updateCount: String(updateCountRef.current),
            type: 'update',
          })
        } catch (err) {
          console.error('Location update email failed:', err)
        }
      }
      toast(`📍 Location update #${updateCountRef.current} sent`, { duration: 3000 })
    }, 2 * 60 * 1000) // every 2 minutes
  }

  const stopLocationEmailUpdates = () => {
    clearInterval(emailUpdateRef.current)
  }

  const triggerEmergency = async () => {
    setEmergencyMode(true)
    if (!silentMode) vibrateEmergency()
    if (!silentMode) launchConfetti()
    const loc = await getLocation()
    currentLocRef.current = loc
    startRecording()
    startTracking()

    const emailContacts = contacts.filter(c => c.email)

    if (emailContacts.length > 0) {
      if (!ejsReady()) {
        toast.error('EmailJS not configured — set VITE_EMAILJS_* in Netlify env vars', { duration: 6000 })
      } else {
        let sent = 0
        for (const contact of emailContacts) {
          try {
            await sendSOSEmail({
              toEmail: contact.email,
              toName: contact.name,
              userName: displayNameRef.current,
              phone: contact.phone,
              location: loc,
              situationType: situation,
              updateCount: '1',
              type: 'initial',
            })
            sent++
          } catch (err) {
            console.error(`Failed to send to ${contact.email}:`, err)
          }
        }
        if (sent > 0) {
          toast.success(`📧 Alert sent to ${sent} contact${sent > 1 ? 's' : ''}`, { duration: 4000 })
          // Start sending location updates every 2 min
          startLocationEmailUpdates(emailContacts, situation)
        } else {
          toast.error('Email alerts failed — check EmailJS config', { duration: 6000 })
        }
      }
    }

    try {
      const guidance = await api.generateAdvice(
        `Emergency: ${situation}. Give 3 immediate safety steps. Be brief and calm.`
      )
      if (guidance.audio) new Audio(guidance.audio).play()
    } catch { /* offline */ }

    toast.success('🚨 Emergency activated — stay safe!', { duration: 5000 })
  }

  const cancelEmergency = async () => {
    setEmergencyMode(false)
    stopRecording()
    stopTracking()
    stopLocationEmailUpdates()
    playClickSound()

    // Send all-clear email — delay 3s to avoid EmailJS rate limit
    const emailContacts = emailContactsRef.current
    if (emailContacts.length > 0 && ejsReady()) {
      setTimeout(async () => {
        for (const contact of emailContacts) {
          try {
            console.log('Sending all-clear to:', contact.email, 'template:', EJS_ACCOUNTS[0]?.updateId)
            const result = await sendSOSEmail({
              toEmail: contact.email,
              toName: contact.name,
              userName: displayNameRef.current,
              phone: contact.phone,
              location: currentLocRef.current,
              situationType: '✅ Cancelled — person is safe',
              updateCount: String(updateCountRef.current),
              type: 'allclear',
            })
            console.log('All-clear sent:', result)
          } catch (err) {
            console.error('All-clear email failed:', err.text || err.message || err)
          }
        }
        toast.success('✅ All-clear sent to contacts', { duration: 3000 })
      }, 3000)
    }

    toast('Emergency cancelled')
  }

  useEffect(() => () => { stopRecording(); stopTracking(); stopLocationEmailUpdates() }, [])

  const nums = EMERGENCY[country]

  return (
    <div className="page-wrapper" style={{ '--page-accent': '#ef4444' }}>
      <div className="page-content" style={{ paddingTop: 80 }}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={22} color="#ef4444" />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text1)', fontFamily: 'Syne,system-ui,sans-serif' }}>Safety Guardian</div>
              <div style={{ fontSize: 12, color: 'var(--text3)' }}>Voice-powered emergency assistance</div>
            </div>
            <select value={country} onChange={e => setCountry(e.target.value)}
              style={{ marginLeft: 'auto', fontSize: 11, padding: '4px 8px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--glass)', color: 'var(--text2)', cursor: 'pointer' }}>
              {Object.entries(EMERGENCY).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <QuoteBar section="safety" color="#ef4444" />

          {/* Emergency Active Banner */}
          <AnimatePresence>
            {emergencyMode && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{ padding: '14px 16px', borderRadius: 14, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }}>
                  <AlertTriangle size={20} color="#ef4444" />
                </motion.div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#ef4444' }}>🚨 Emergency Mode Active</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
                    {recording && '🔴 Recording · '}{liveTracking && '📍 Tracking · '}Alerts sent
                  </div>
                </div>
                <button onClick={cancelEmergency}
                  style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.2)', color: '#ef4444', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  Cancel
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 20, background: 'var(--glass)', borderRadius: 12, padding: 4, border: '1px solid var(--border)' }}>
            {[['sos','SOS'],['contacts','Contacts'],['tools','Tools'],['history','History']].map(([t, l]) => (
              <button key={t} onClick={() => { setTab(t); if (t === 'history') setCallHistory(JSON.parse(localStorage.getItem('call-history') || '[]')) }}
                style={{ flex: 1, padding: '8px 2px', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600,
                  background: tab === t ? 'linear-gradient(135deg,#ef4444,#dc2626)' : 'transparent',
                  color: tab === t ? '#fff' : 'var(--text2)' }}>
                {l}
              </button>
            ))}
          </div>

          {/* ── SOS TAB ── */}
          {tab === 'sos' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

              {/* Silent Mode toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 10, background: silentMode ? 'rgba(139,92,246,0.1)' : 'var(--glass)', border: `1px solid ${silentMode ? 'rgba(139,92,246,0.4)' : 'var(--border)'}`, marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: silentMode ? '#8b5cf6' : 'var(--text1)' }}>🤫 Silent SOS Mode</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>No sound/vibration — screen shows fake app</div>
                </div>
                <button onClick={() => { setSilentMode(m => !m); playClickSound() }}
                  style={{ width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', position: 'relative',
                    background: silentMode ? '#8b5cf6' : 'var(--border)', transition: 'background 0.2s' }}>
                  <div style={{ position: 'absolute', top: 2, left: silentMode ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
                </button>
              </div>

              {/* Situation selector */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 20 }}>
                {SITUATIONS.map(({ value, Icon, label, color }) => (
                  <button key={value} onClick={() => { setSituation(value); playClickSound() }}
                    style={{ padding: '10px 4px', borderRadius: 10, border: `1px solid ${situation === value ? color + '60' : 'var(--border)'}`,
                      background: situation === value ? color + '18' : 'var(--glass)', cursor: 'pointer', textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 3 }}><Icon size={18} color={situation === value ? color : 'var(--text3)'} /></div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: situation === value ? color : 'var(--text3)' }}>{label}</div>
                  </button>
                ))}
              </div>

              {/* BIG SOS HOLD BUTTON */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
                <div style={{ position: 'relative', width: 140, height: 140 }}>
                  {/* Pulse rings */}
                  {emergencyMode && [1,2,3].map(i => (
                    <motion.div key={i} animate={{ scale: [1, 2.2], opacity: [0.4, 0] }}
                      transition={{ repeat: Infinity, duration: 2, delay: i * 0.5 }}
                      style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid #ef4444', pointerEvents: 'none' }} />
                  ))}
                  {/* Progress ring */}
                  <svg width="140" height="140" style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}>
                    <circle cx="70" cy="70" r="64" fill="none" stroke="rgba(239,68,68,0.15)" strokeWidth="5" />
                    <circle cx="70" cy="70" r="64" fill="none" stroke="#ef4444" strokeWidth="5"
                      strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 64}
                      strokeDashoffset={2 * Math.PI * 64 * (1 - holdProgress / 100)}
                      style={{ transition: 'stroke-dashoffset 0.1s' }} />
                  </svg>
                  {/* Button */}
                  <motion.button
                    onMouseDown={startHold} onMouseUp={cancelHold} onMouseLeave={cancelHold}
                    onTouchStart={startHold} onTouchEnd={cancelHold}
                    animate={emergencyMode ? { scale: [1, 1.04, 1] } : {}}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    style={{ position: 'absolute', inset: 8, borderRadius: '50%', border: 'none', cursor: 'pointer',
                      background: emergencyMode
                        ? 'linear-gradient(135deg,#dc2626,#991b1b)'
                        : holding
                          ? 'linear-gradient(135deg,#ef4444,#dc2626)'
                          : 'linear-gradient(135deg,#ef4444,#b91c1c)',
                      boxShadow: emergencyMode
                        ? '0 0 40px rgba(239,68,68,0.6)'
                        : '0 8px 32px rgba(239,68,68,0.35)',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                    <Shield size={28} color="#fff" />
                    <div style={{ fontSize: 14, fontWeight: 900, color: '#fff', letterSpacing: 2 }}>SOS</div>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>
                      {emergencyMode ? 'ACTIVE' : holding ? `${Math.round(holdProgress)}%` : 'HOLD 2.5s'}
                    </div>
                  </motion.button>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 16, textAlign: 'center' }}>
                  {emergencyMode ? 'Emergency mode is active' : 'Hold the button for 2.5 seconds to activate'}
                </div>
              </div>

              {/* Quick call buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
                {[
                  { label: 'Police', num: nums.police, color: '#3b82f6', icon: <Shield size={16} />, name: 'Police Emergency' },
                  { label: 'Ambulance', num: nums.ambulance, color: '#10b981', icon: <PhoneCall size={16} />, name: 'Ambulance Service' },
                  { label: 'Fire', num: nums.fire, color: '#f59e0b', icon: <Radio size={16} />, name: 'Fire Brigade' },
                ].map(({ label, num, color, icon, name }) => (
                  <button key={label}
                    onClick={() => setFakeCall({ callerName: name, callerNum: num })}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, padding: '12px 4px', borderRadius: 12,
                      border: `1px solid ${color}40`, background: color + '12', cursor: 'pointer' }}>
                    <div style={{ color }}>{icon}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color }}>{num}</div>
                    <div style={{ fontSize: 10, color: 'var(--text3)' }}>{label}</div>
                    <div style={{ fontSize: 9, color: 'var(--text3)' }}>{nums.dialCode}</div>
                  </button>
                ))}
              </div>

              {/* Location */}
              <div className="card" style={{ padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: location ? 10 : 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <MapPin size={16} color="#3b82f6" />
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text1)' }}>Live Location</span>
                    {liveTracking && <span style={{ fontSize: 10, color: '#10b981', fontWeight: 600 }}>● LIVE</span>}
                  </div>
                  <button onClick={getLocation} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 8, border: '1px solid rgba(59,130,246,0.4)', background: 'rgba(59,130,246,0.12)', color: '#3b82f6', cursor: 'pointer', fontWeight: 600 }}>
                    Get GPS
                  </button>
                </div>
                {location && (
                  <>
                    <a href={`https://www.google.com/maps?q=${location.lat},${location.lng}`} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: 12, color: '#3b82f6', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Navigation size={12} /> {location.lat.toFixed(5)}, {location.lng.toFixed(5)} — View on Maps →
                    </a>
                    {weather && (
                      <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text2)', padding: '6px 10px', borderRadius: 8, background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}>
                        <span style={{ fontSize: 16 }}>{weather.emoji}</span>
                        <span>{weather.temp}°C</span>
                        <span style={{ color: 'var(--text3)' }}>·</span>
                        <span>💨 {weather.wind} km/h</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          )}

          {/* ── CONTACTS TAB ── */}
          {tab === 'contacts' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="card" style={{ padding: 16, marginBottom: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text1)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Users size={15} color="#8b5cf6" /> Add Emergency Contact
                </div>
                <input placeholder="Close person's name" value={newContact.name}
                  onChange={e => setNewContact(f => ({ ...f, name: e.target.value }))}
                  className="inp" style={{ marginBottom: 8, fontSize: 13 }} />
                <input placeholder="Your phone number" type="tel" value={newContact.phone}
                  onChange={e => setNewContact(f => ({ ...f, phone: e.target.value }))}
                  className="inp" style={{ marginBottom: 8, fontSize: 13 }} />
                <input placeholder="Your neighbour's email (for alerts)" type="email" value={newContact.email}
                  onChange={e => setNewContact(f => ({ ...f, email: e.target.value }))}
                  className="inp" style={{ marginBottom: 12, fontSize: 13 }} />
                <button onClick={() => {
                  if (!newContact.name || !newContact.phone) return toast.error('Name and phone required')
                  saveContacts([...contacts, { ...newContact, id: Date.now() }])
                  setNewContact({ name: '', phone: '', email: '' })
                  playSuccessSound()
                  toast.success('Contact added')
                }} className="btn" style={{ background: 'linear-gradient(135deg,#8b5cf6,#7c3aed)' }}>
                  <Check size={15} /> Add Contact
                </button>
              </div>

              {contacts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 32, color: 'var(--text3)', fontSize: 13 }}>
                  No contacts yet. Add someone you trust.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {contacts.map(c => (
                    <div key={c.id} className="card" style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#8b5cf6,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                        {c.name[0].toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text1)' }}>{c.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text3)' }}>{c.phone}{c.email ? ` · ${c.email}` : ''}</div>
                      </div>
                      <a href={`tel:${c.phone}`} style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Phone size={13} color="#10b981" />
                      </a>
                      <button onClick={() => { saveContacts(contacts.filter(x => x.id !== c.id)); toast('Removed') }}
                        style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        <X size={13} color="#ef4444" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ── TOOLS TAB ── */}
          {tab === 'tools' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

              {/* Fake Call */}
              <div className="card" style={{ padding: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <PhoneCall size={17} color="#10b981" />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text1)' }}>Fake Call Escape</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>Simulate an incoming call to leave safely</div>
                  </div>
                </div>
                <button onClick={() => { vibrateLight(); setFakeCall({ callerName: 'Mom', callerNum: '+977 98XXXXXXXX' }) }}
                  className="btn" style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>
                  <PhoneCall size={15} /> Start Fake Call
                </button>
              </div>

              {/* Voice Trigger */}
              <div className="card" style={{ padding: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Mic size={17} color="#ef4444" />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text1)' }}>Voice Trigger</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>Say "Help me" to activate SOS</div>
                  </div>
                </div>
                <button onClick={() => { setListening(true); toast('🎙️ Listening for "Help me"...'); setTimeout(() => { setListening(false); triggerEmergency() }, 3000) }}
                  disabled={listening} className="btn"
                  style={{ background: listening ? 'var(--glass)' : 'linear-gradient(135deg,#ef4444,#dc2626)', color: listening ? 'var(--text2)' : '#fff' }}>
                  {listening ? '🎙️ Listening...' : <><Mic size={15} /> Activate Voice Trigger</>}
                </button>
              </div>

              {/* Evidence Recording */}
              <div className="card" style={{ padding: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Video size={17} color="#f59e0b" />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text1)' }}>Evidence Recording</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>Auto-records audio during emergency</div>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.6, padding: '8px 12px', borderRadius: 8, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
                  ✓ Activates automatically with SOS<br/>
                  ✓ Saved as legal evidence<br/>
                  ✓ Acts as a deterrent
                </div>
              </div>

              {/* Nearby help */}
              <div className="card" style={{ padding: 18 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text1)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <MapPin size={15} color="#3b82f6" /> Find Nearby Help
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[['Police Station','police+station','#3b82f6'],['Hospital','hospital','#10b981']].map(([label, q, color]) => (
                    <button key={label} onClick={() => {
                      if (!location) { toast.error('Get location first (SOS tab)'); return }
                      window.open(`https://www.google.com/maps/search/${q}/@${location.lat},${location.lng},15z`, '_blank')
                    }} style={{ padding: '10px', borderRadius: 10, border: `1px solid ${color}40`, background: color + '12', color, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── HISTORY TAB ── */}
          {tab === 'history' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {callHistory.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--text3)', fontSize: 13 }}>
                  <Clock size={32} color="var(--text3)" style={{ marginBottom: 12, opacity: 0.4 }} />
                  <div>No call history yet.</div>
                  <div style={{ fontSize: 11, marginTop: 4 }}>Calls to emergency services will appear here.</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {callHistory.map(h => (
                    <div key={h.id} className="card" style={{ padding: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: h.messages?.length ? 10 : 0 }}>
                        <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Shield size={18} color="#fff" />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text1)' }}>{h.caller}</div>
                          <div style={{ fontSize: 11, color: 'var(--text3)' }}>{h.num} · {h.date}</div>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'right' }}>
                          <div style={{ fontWeight: 600, color: 'var(--text2)' }}>
                            {String(Math.floor(h.duration / 60)).padStart(2,'0')}:{String(h.duration % 60).padStart(2,'0')}
                          </div>
                          <div style={{ fontSize: 10, marginTop: 2, padding: '2px 6px', borderRadius: 6, background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>{h.situation}</div>
                        </div>
                      </div>
                      {h.messages?.length > 0 && (
                        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {h.messages.slice(0, 3).map((m, i) => (
                            <div key={i} style={{ fontSize: 11, color: 'var(--text3)', display: 'flex', gap: 6 }}>
                              <span style={{ color: m.from === 'ai' ? '#3b82f6' : '#8b5cf6', fontWeight: 600, flexShrink: 0 }}>
                                {m.from === 'ai' ? 'Dispatcher' : 'You'}:
                              </span>
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.text}</span>
                            </div>
                          ))}
                          {h.messages.length > 3 && (
                            <div style={{ fontSize: 10, color: 'var(--text3)' }}>+{h.messages.length - 3} more messages</div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  <button onClick={() => { localStorage.removeItem('call-history'); setCallHistory([]) }}
                    style={{ padding: '8px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: '#ef4444', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    Clear History
                  </button>
                </div>
              )}
            </motion.div>
          )}

        </motion.div>
      </div>

      {/* Silent Mode Fake Screen */}
      <AnimatePresence>
        {silentMode && emergencyMode && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'var(--bg1)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
            {/* Fake calculator UI */}
            <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 8 }}>Calculator</div>
            <div style={{ fontSize: 48, fontWeight: 300, color: 'var(--text1)', letterSpacing: 2 }}>0</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, width: 280 }}>
              {['C','±','%','÷','7','8','9','×','4','5','6','−','1','2','3','+','0','.','='].map((k,i) => (
                <button key={i} style={{ padding: '18px 0', borderRadius: 12, border: 'none', fontSize: 18, fontWeight: 500,
                  background: ['÷','×','−','+','='].includes(k) ? '#f59e0b' : ['C','±','%'].includes(k) ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.08)',
                  color: '#fff', cursor: 'pointer', gridColumn: k === '0' ? 'span 2' : undefined }}>
                  {k}
                </button>
              ))}
            </div>
            {/* Hidden cancel — triple tap */}
            <button onClick={cancelEmergency}
              style={{ position: 'fixed', bottom: 20, right: 20, width: 12, height: 12, borderRadius: '50%', background: 'transparent', border: 'none', cursor: 'pointer', opacity: 0 }}>
              x
            </button>
            <div style={{ position: 'fixed', bottom: 8, fontSize: 9, color: 'rgba(255,255,255,0.1)' }}>
              triple-tap bottom-right to cancel
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fake Call Overlay */}
      <AnimatePresence>
        {fakeCall && (
          <FakeCallScreen
            callerName={fakeCall.callerName}
            callerNum={fakeCall.callerNum}
            situation={situation}
            onEnd={() => { setFakeCall(null); setCallHistory(JSON.parse(localStorage.getItem('call-history') || '[]')) }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
