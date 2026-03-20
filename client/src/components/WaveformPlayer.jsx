import { useState, useRef, useEffect } from 'react'
import { Play, Pause, Download, Volume2, RotateCcw } from 'lucide-react'
import { motion } from 'framer-motion'

const BARS = 40

export default function WaveformPlayer({ audioUrl, isLoading, mode = 'creator' }) {
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [frequencies, setFrequencies] = useState(Array(BARS).fill(0))
  const [speed, setSpeed] = useState(1)
  const audioRef = useRef(null)
  const analyserRef = useRef(null)
  const animationRef = useRef(null)

  const SPEEDS = [0.75, 1, 1.25, 1.5]

  const modeColors = {
    creator: { from: '#8b5cf6', to: '#c084fc' },
    assistant: { from: '#3b82f6', to: '#60a5fa' },
    study: { from: '#c084fc', to: '#e879f9' },
    planner: { from: '#f59e0b', to: '#fbbf24' },
  }

  const colors = modeColors[mode] || modeColors.creator

  useEffect(() => {
    if (audioUrl && audioRef.current) {
      audioRef.current.src = audioUrl
      audioRef.current.playbackRate = speed
      setPlaying(false)
      setProgress(0)
      setCurrentTime(0)
      audioRef.current.onerror = (e) => console.error('Audio loading error:', e)
      audioRef.current.onloadeddata = () => console.log('Audio loaded successfully')
    }
  }, [audioUrl])

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = speed
  }, [speed])

  const updateFrequencies = () => {
    if (!analyserRef.current || !playing) return
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
    analyserRef.current.getByteFrequencyData(dataArray)
    
    // Map frequency data to bars
    const step = Math.floor(dataArray.length / BARS)
    const newFrequencies = Array(BARS).fill(0).map((_, i) => {
      const index = i * step
      return dataArray[index] / 255 // Normalize to 0-1
    })
    
    setFrequencies(newFrequencies)
    animationRef.current = requestAnimationFrame(updateFrequencies)
  }

  const toggle = () => {
    if (!audioRef.current) return
    
    if (playing) {
      audioRef.current.pause()
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    } else {
      // Setup Web Audio API on first play (after user gesture)
      if (!analyserRef.current) {
        try {
          const audioContext = new (window.AudioContext || window.webkitAudioContext)()
          const source = audioContext.createMediaElementSource(audioRef.current)
          const analyser = audioContext.createAnalyser()
          
          analyser.fftSize = 128
          source.connect(analyser)
          analyser.connect(audioContext.destination)
          analyserRef.current = analyser
          console.log('Web Audio API initialized')
        } catch (err) {
          console.error('Web Audio API error:', err)
        }
      }
      
      console.log('Attempting to play audio...')
      audioRef.current.play()
        .then(() => {
          console.log('Audio playing successfully')
          updateFrequencies()
        })
        .catch(err => {
          console.error('Play error:', err)
          alert('Cannot play audio: ' + err.message)
        })
    }
    setPlaying(!playing)
  }

  const onTimeUpdate = () => {
    if (!audioRef.current) return
    const curr = audioRef.current.currentTime
    const dur = audioRef.current.duration
    setCurrentTime(curr)
    setDuration(dur)
    const p = (curr / dur) * 100
    setProgress(isNaN(p) ? 0 : p)
  }

  const onLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration)
    }
  }

  const download = () => {
    if (!audioUrl) return
    
    // Fetch the audio and download it
    fetch(audioUrl)
      .then(response => response.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `vortex-${mode}-${Date.now()}.mp3`
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

  const restart = () => {
    if (!audioRef.current) return
    audioRef.current.currentTime = 0
    setProgress(0)
    setCurrentTime(0)
  }

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (isLoading) {
    return (
      <div className="card shimmer" style={{ height: 120, marginBottom: 12 }} />
    )
  }

  if (!audioUrl) return null

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="card" style={{ padding: 20, marginBottom: 12 }}>
      <audio 
        ref={audioRef} 
        onTimeUpdate={onTimeUpdate} 
        onLoadedMetadata={onLoadedMetadata}
        onEnded={() => { 
          setPlaying(false)
          setProgress(0)
          if (animationRef.current) cancelAnimationFrame(animationRef.current)
        }}
        crossOrigin="anonymous"
        preload="auto"
      />

      {/* Real-time Frequency Waveform - Clickable for seeking */}
      <div 
        style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 60, marginBottom: 16, overflow: 'hidden', cursor: 'pointer' }}
        onClick={(e) => {
          if (!audioRef.current || !duration) return
          const rect = e.currentTarget.getBoundingClientRect()
          const clickX = e.clientX - rect.left
          const percentage = clickX / rect.width
          const newTime = percentage * duration
          audioRef.current.currentTime = newTime
          setCurrentTime(newTime)
          setProgress(percentage * 100)
        }}
      >
        {frequencies.map((freq, i) => {
          const baseHeight = 20
          const dynamicHeight = playing ? baseHeight + (freq * 40) : baseHeight + Math.abs(Math.sin(i * 0.5) * 30)
          const filled = (i / BARS) * 100 < progress

          return (
            <div key={i}
              style={{
                flex: 1,
                borderRadius: 3,
                height: `${dynamicHeight}%`,
                background: filled
                  ? `linear-gradient(to top, ${colors.from}, ${colors.to})`
                  : 'var(--border)',
                transition: playing ? 'height 0.05s ease' : 'height 0.3s ease',
                transformOrigin: 'bottom'
              }}
            />
          )
        })}
      </div>

      {/* Progress bar - Clickable for seeking */}
      <div 
        style={{ height: 4, borderRadius: 4, background: 'var(--border)', marginBottom: 14, cursor: 'pointer', position: 'relative' }}
        onClick={(e) => {
          if (!audioRef.current || !duration) return
          const rect = e.currentTarget.getBoundingClientRect()
          const clickX = e.clientX - rect.left
          const percentage = clickX / rect.width
          const newTime = percentage * duration
          audioRef.current.currentTime = newTime
          setCurrentTime(newTime)
          setProgress(percentage * 100)
        }}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect()
          const hoverX = e.clientX - rect.left
          const percentage = hoverX / rect.width
          const hoverTime = percentage * duration
          e.currentTarget.title = formatTime(hoverTime)
        }}
      >
        <div style={{
          height: '100%',
          borderRadius: 4,
          width: progress + '%',
          background: `linear-gradient(to right, ${colors.from}, ${colors.to})`,
          transition: 'width 0.3s'
        }} />
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={toggle} aria-label={playing ? 'Pause' : 'Play'}
            style={{ width: 44, height: 44, borderRadius: '50%', border: 'none', background: `linear-gradient(135deg, ${colors.from}, ${colors.to})`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            {playing ? <Pause size={18} color="#fff" /> : <Play size={18} color="#fff" />}
          </motion.button>

          <button onClick={restart} className="icon-btn" style={{ width: 36, height: 36 }} aria-label="Restart">
            <RotateCcw size={14} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Volume2 size={14} color={colors.from} aria-hidden="true" />
            <span style={{ fontSize: 12, color: 'var(--text2)', fontVariantNumeric: 'tabular-nums' }}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Speed control */}
          <div style={{ display: 'flex', gap: 3 }}>
            {SPEEDS.map(s => (
              <button key={s} onClick={() => setSpeed(s)} aria-label={`Speed ${s}x`}
                style={{ padding: '3px 7px', borderRadius: 6, border: `1px solid ${speed === s ? colors.from + '80' : 'var(--border)'}`,
                  background: speed === s ? colors.from + '20' : 'var(--glass)',
                  color: speed === s ? colors.from : 'var(--text3)', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>
                {s}x
              </button>
            ))}
          </div>

          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={download} aria-label="Download audio"
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, border: `1px solid ${colors.from}40`, background: `${colors.from}15`, color: colors.from, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            <Download size={13} aria-hidden="true" />
            Download
          </motion.button>
        </div>
      </div>

      {/* Murf Falcon badge */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 10 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, background: `${colors.from}12`, border: `1px solid ${colors.from}30` }}>
          <span style={{ fontSize: 12 }}>⚡</span>
          <span style={{ fontSize: 10, fontWeight: 700, color: colors.from, letterSpacing: '0.03em' }}>Powered by Murf Falcon</span>
        </div>
      </div>
    </motion.div>
  )
}
