// Daily focus reminder — uses browser Notification API + service worker
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Bell, BellOff, Check } from 'lucide-react'
import toast from 'react-hot-toast'

export default function NotificationReminder() {
  const [permission, setPermission] = useState(Notification.permission)
  const [time, setTime] = useState(() => localStorage.getItem('vortex-reminder-time') || '09:00')
  const [enabled, setEnabled] = useState(() => localStorage.getItem('vortex-reminder-on') === '1')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!enabled) return
    // Schedule check every minute
    const interval = setInterval(() => {
      const now = new Date()
      const hhmm = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`
      if (hhmm === time && permission === 'granted') {
        new Notification('Vortex Voice AI 🔥', {
          body: "Time for your daily session! Keep your streak going.",
          icon: '/favicon.svg',
          badge: '/favicon.svg',
        })
      }
    }, 60000)
    return () => clearInterval(interval)
  }, [enabled, time, permission])

  const requestAndEnable = async () => {
    if (permission !== 'granted') {
      const result = await Notification.requestPermission()
      setPermission(result)
      if (result !== 'granted') {
        toast.error('Notifications blocked. Enable in browser settings.')
        return
      }
    }
    setEnabled(true)
    localStorage.setItem('vortex-reminder-on', '1')
    localStorage.setItem('vortex-reminder-time', time)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    toast.success(`Reminder set for ${time} daily!`)
  }

  const disable = () => {
    setEnabled(false)
    localStorage.setItem('vortex-reminder-on', '0')
    toast('Reminder disabled')
  }

  const saveTime = () => {
    localStorage.setItem('vortex-reminder-time', time)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    toast.success(`Reminder updated to ${time}`)
  }

  if (!('Notification' in window)) return null

  return (
    <div className="card" style={{ padding: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {enabled ? <Bell size={17} color="#f59e0b" /> : <BellOff size={17} color="var(--text3)" />}
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text1)' }}>Daily Reminder</div>
          <div style={{ fontSize: 11, color: 'var(--text3)' }}>{enabled ? `Active · ${time}` : 'Set a daily focus reminder'}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input type="time" value={time} onChange={e => setTime(e.target.value)}
          className="inp" style={{ fontSize: 14, fontWeight: 600, width: 110, padding: '8px 12px' }} />
        {enabled ? (
          <>
            <motion.button whileTap={{ scale: 0.95 }} onClick={saveTime}
              style={{ flex: 1, padding: '9px 12px', borderRadius: 10, border: '1px solid rgba(16,185,129,0.4)', background: 'rgba(16,185,129,0.12)', color: '#10b981', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
              {saved ? <><Check size={13} /> Saved!</> : 'Update'}
            </motion.button>
            <button onClick={disable}
              style={{ padding: '9px 12px', borderRadius: 10, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: '#ef4444', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              Off
            </button>
          </>
        ) : (
          <motion.button whileTap={{ scale: 0.95 }} onClick={requestAndEnable}
            style={{ flex: 1, padding: '9px 12px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
            <Bell size={13} /> Enable Reminder
          </motion.button>
        )}
      </div>
    </div>
  )
}
