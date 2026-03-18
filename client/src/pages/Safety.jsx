import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, AlertTriangle, Phone, MapPin, Users, Volume2, Mic, Check, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { PageHeader } from '../components/UI'
import { api } from '../services/api'
import { vibrateEmergency, vibrateSuccess, vibrateLight } from '../utils/haptics'
import { playClickSound, playSuccessSound, playErrorSound } from '../utils/soundGenerator'

export default function Safety() {
  const [emergencyMode, setEmergencyMode] = useState(false)
  const [contacts, setContacts] = useState([])
  const [newContact, setNewContact] = useState({ name: '', phone: '' })
  const [location, setLocation] = useState(null)
  const [listening, setListening] = useState(false)
  const [fakeCallActive, setFakeCallActive] = useState(false)

  useEffect(() => {
    // Load saved contacts from localStorage
    const saved = localStorage.getItem('safety-contacts')
    if (saved) setContacts(JSON.parse(saved))
  }, [])

  const saveContacts = (newContacts) => {
    setContacts(newContacts)
    localStorage.setItem('safety-contacts', JSON.stringify(newContacts))
  }

  const addContact = () => {
    if (!newContact.name || !newContact.phone) {
      playErrorSound()
      return toast.error('Enter name and phone number')
    }
    playSuccessSound()
    const updated = [...contacts, { ...newContact, id: Date.now() }]
    saveContacts(updated)
    setNewContact({ name: '', phone: '' })
    toast.success('Contact added')
  }

  const removeContact = (id) => {
    playClickSound()
    saveContacts(contacts.filter(c => c.id !== id))
    toast.success('Contact removed')
  }

  const getLocation = () => {
    if (!navigator.geolocation) {
      playErrorSound()
      toast.error('Geolocation not supported')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        playSuccessSound()
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        })
        toast.success('Location captured')
      },
      () => {
        playErrorSound()
        toast.error('Could not get location')
      }
    )
  }

  const triggerEmergency = async () => {
    setEmergencyMode(true)
    vibrateEmergency()
    getLocation()

    // Play alert sound
    const audio = new Audio()
    audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGGS57OihUBELTKXh8bllHAU2jdXvzn0pBSh+zPDajzsKElyx6OyrWBQLSKDf8sFuIwUrgc7y2Yk2CBhkuezooVARCkyl4fG5ZRwFNo3V7859KQUofsz'
    audio.play().catch(() => {})

    // Generate voice guidance
    try {
      const guidance = await api.generateAdvice(
        'Emergency situation. Provide calm, clear safety instructions in 2-3 sentences. Tell them help is coming and to stay calm.'
      )
      
      // Play voice guidance
      if (guidance.audio) {
        const voiceAudio = new Audio(guidance.audio)
        voiceAudio.play()
      }

      vibrateSuccess()
      toast.success('Emergency alert sent!')
    } catch {
      toast.error('Could not generate voice guidance')
    }

    // Simulate sending alerts (in real app, this would call backend)
    setTimeout(() => {
      toast.success(`Alert sent to ${contacts.length} contacts`)
    }, 1000)
  }

  const cancelEmergency = () => {
    playClickSound()
    setEmergencyMode(false)
    toast('Emergency mode cancelled')
  }

  const startFakeCall = () => {
    playClickSound()
    setFakeCallActive(true)
    vibrateLight()
    
    // Play ringtone
    const ringtone = new Audio()
    ringtone.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGGS57OihUBELTKXh8bllHAU2jdXvzn0pBSh+zPDajzsKElyx6OyrWBQLSKDf8sFuIwUrgc7y2Yk2CBhkuezooVARCkyl4fG5ZRwFNo3V7859KQUofsz'
    ringtone.loop = true
    ringtone.play()

    setTimeout(() => {
      ringtone.pause()
      vibrateSuccess()
      // Play fake voice
      toast.success('Fake call started - pretend to talk')
    }, 3000)
  }

  const endFakeCall = () => {
    playClickSound()
    setFakeCallActive(false)
    toast('Call ended')
  }

  const startVoiceDetection = () => {
    playClickSound()
    setListening(true)
    toast('Listening for "Help me" or "Emergency"...')
    
    // In real app, use Web Speech API
    // For demo, simulate after 3 seconds
    setTimeout(() => {
      setListening(false)
      toast.success('Voice trigger detected!')
      triggerEmergency()
    }, 3000)
  }

  return (
    <div className="page-wrapper" style={{ '--page-accent': '#ef4444' }}>
      <div className="page-content">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <PageHeader icon={Shield} color="#ef4444" title="Safety Guardian" sub="Voice-powered emergency assistance for women" />

          {/* Emergency Mode Active */}
          <AnimatePresence>
            {emergencyMode && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="card" style={{ padding: 24, marginBottom: 16, background: 'rgba(239,68,68,0.15)', borderColor: 'rgba(239,68,68,0.4)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <AlertTriangle size={24} color="#ef4444" />
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#ef4444' }}>
                      Emergency Mode Active
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text2)' }}>
                      Alerts sent • Voice guidance playing
                    </div>
                  </div>
                </div>
                <button onClick={cancelEmergency}
                  style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.2)', color: '#ef4444', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  Cancel Emergency
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Emergency Button */}
          {!emergencyMode && (
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={triggerEmergency}
              style={{
                width: '100%',
                padding: 24,
                borderRadius: 16,
                border: '2px solid #ef4444',
                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                color: '#fff',
                fontSize: 18,
                fontWeight: 700,
                cursor: 'pointer',
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                boxShadow: '0 8px 32px rgba(239,68,68,0.3)'
              }}>
              <AlertTriangle size={24} />
              EMERGENCY - TAP FOR HELP
            </motion.button>
          )}

          {/* Voice Trigger */}
          <div className="card" style={{ padding: 20, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <Mic size={18} color="#ef4444" />
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text1)' }}>
                Voice Trigger
              </span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 14 }}>
              Say "Help me" or "Emergency" to activate safety mode
            </p>
            <button onClick={startVoiceDetection} disabled={listening}
              className="btn" style={{ background: listening ? 'var(--glass)' : 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
              {listening ? (
                <><span className="spin" />Listening...</>
              ) : (
                <><Mic size={16} />Start Voice Detection</>
              )}
            </button>
          </div>

          {/* Fake Call */}
          <div className="card" style={{ padding: 20, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <Phone size={18} color="#10b981" />
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text1)' }}>
                Fake Call
              </span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 14 }}>
              Generate a fake incoming call to escape uncomfortable situations
            </p>
            {!fakeCallActive ? (
              <button onClick={startFakeCall} className="btn"
                style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                <Phone size={16} />Start Fake Call
              </button>
            ) : (
              <button onClick={endFakeCall} className="btn"
                style={{ background: 'var(--glass)', color: 'var(--text1)', border: '1px solid var(--border)' }}>
                End Call
              </button>
            )}
          </div>

          {/* Location */}
          <div className="card" style={{ padding: 20, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <MapPin size={18} color="#3b82f6" />
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text1)' }}>
                Location Sharing
              </span>
            </div>
            {location ? (
              <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 10 }}>
                <div>Lat: {location.lat.toFixed(6)}</div>
                <div>Lng: {location.lng.toFixed(6)}</div>
              </div>
            ) : (
              <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 14 }}>
                Your location will be shared with emergency contacts
              </p>
            )}
            <button onClick={getLocation} className="btn"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>
              <MapPin size={16} />Get Current Location
            </button>
          </div>

          {/* Emergency Contacts */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <Users size={18} color="#8b5cf6" />
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text1)' }}>
                Emergency Contacts ({contacts.length})
              </span>
            </div>

            {/* Add Contact Form */}
            <div style={{ marginBottom: 16 }}>
              <input type="text" placeholder="Name" value={newContact.name}
                onChange={e => setNewContact({ ...newContact, name: e.target.value })}
                className="inp" style={{ marginBottom: 8 }} />
              <input type="tel" placeholder="Phone Number" value={newContact.phone}
                onChange={e => setNewContact({ ...newContact, phone: e.target.value })}
                className="inp" style={{ marginBottom: 10 }} />
              <button onClick={addContact} className="btn"
                style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
                <Check size={16} />Add Contact
              </button>
            </div>

            {/* Contact List */}
            {contacts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 20, color: 'var(--text3)', fontSize: 13 }}>
                No emergency contacts added yet
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {contacts.map(contact => (
                  <div key={contact.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 10, background: 'var(--glass)', border: '1px solid var(--border)' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text1)' }}>
                        {contact.name}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text3)' }}>
                        {contact.phone}
                      </div>
                    </div>
                    <button onClick={() => removeContact(contact.id)}
                      style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <X size={14} color="#ef4444" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info Card */}
          <div className="card" style={{ padding: 16, marginTop: 16, background: 'rgba(59,130,246,0.08)', borderColor: 'rgba(59,130,246,0.2)' }}>
            <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>
              <strong style={{ color: '#3b82f6' }}>How it works:</strong> In an emergency, tap the button or use voice trigger. The app will send your location to emergency contacts, play a loud alert, and provide voice guidance to help you stay calm.
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
