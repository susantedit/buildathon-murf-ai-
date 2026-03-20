import { useState, useRef, useEffect } from 'react'
import { Play, Pause, Download, Volume2 } from 'lucide-react'

const BARS = 28

export default function AudioPlayer({ audioUrl, isLoading }) {
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const ref = useRef(null)

  useEffect(() => {
    if (audioUrl && ref.current) { ref.current.src = audioUrl; setPlaying(false); setProgress(0) }
  }, [audioUrl])

  const toggle = () => {
    if (!ref.current) return
    playing ? ref.current.pause() : ref.current.play()
    setPlaying(p => !p)
  }

  const onTime = () => {
    if (!ref.current) return
    const p = (ref.current.currentTime / ref.current.duration) * 100
    setProgress(isNaN(p) ? 0 : p)
  }

  const dl = () => {
    if (!audioUrl) return
    
    // Fetch the audio and download it
    fetch(audioUrl)
      .then(response => response.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `vortex-${Date.now()}.mp3`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      })
      .catch(err => {
        console.error('Download error:', err)
        // Fallback: open in new tab
        window.open(audioUrl, '_blank')
      })
  }

  if (isLoading) return <div className="card shimmer" style={{ height: 80, marginBottom: 12 }} />
  if (!audioUrl) return null

  return (
    <div className="card" style={{ padding: 18, marginBottom: 12 }}>
      <audio ref={ref} onTimeUpdate={onTime} onEnded={() => { setPlaying(false); setProgress(0) }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={toggle}
          style={{ width: 42, height: 42, borderRadius: '50%', border: 'none', background: 'linear-gradient(135deg,#8b5cf6,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {playing ? <Pause size={17} color="#fff" /> : <Play size={17} color="#fff" />}
        </button>

        <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: 2, height: 38, overflow: 'hidden' }}>
          {Array.from({ length: BARS }).map((_, i) => {
            const h = 18 + Math.abs(Math.sin(i * 0.7) * 26 + Math.cos(i * 0.4) * 16)
            const filled = (i / BARS) * 100 < progress
            return (
              <div key={i} style={{
                flex: 1, borderRadius: 3, height: h + '%',
                background: filled ? 'linear-gradient(to top,#8b5cf6,#c084fc)' : 'var(--border)',
                animation: playing ? `wave ${0.7 + (i % 5) * 0.14}s ease-in-out ${i * 0.035}s infinite alternate` : 'none',
              }} />
            )
          })}
        </div>

        <Volume2 size={14} color="#8b5cf6" style={{ flexShrink: 0 }} />

        <button onClick={dl}
          style={{ width: 34, height: 34, borderRadius: 9, border: '1px solid rgba(139,92,246,0.3)', background: 'rgba(139,92,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Download size={13} color="#a78bfa" />
        </button>
      </div>

      <div 
        style={{ marginTop: 10, height: 3, borderRadius: 3, background: 'var(--border)', cursor: 'pointer' }}
        onClick={(e) => {
          if (!ref.current || !ref.current.duration) return
          const rect = e.currentTarget.getBoundingClientRect()
          const clickX = e.clientX - rect.left
          const percentage = clickX / rect.width
          ref.current.currentTime = percentage * ref.current.duration
          setProgress(percentage * 100)
        }}
      >
        <div style={{ height: '100%', borderRadius: 3, width: progress + '%', background: 'linear-gradient(to right,#8b5cf6,#3b82f6)', transition: 'width 0.4s' }} />
      </div>
    </div>
  )
}
