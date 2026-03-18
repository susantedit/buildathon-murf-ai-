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
  const audioRef = useRef(null)
  const analyserRef = useRef(null)
  const animationRef = useRef(null)

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
      setPlaying(false)
      setProgress(0)
      setCurrentTime(0)
      
      // Setup Web Audio API for real-time visualization
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const source = audioContext.createMediaElementSource(audioRef.current)
      const analyser = audioContext.createAnalyser()
      
      analyser.fftSize = 128
      source.connect(analyser)
      analyser.connect(audioContext.destination)
      analyserRef.current = analyser
    }
  }, [audioUrl])

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
      audioRef.current.play()
      updateFrequencies()
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
    const a = document.createElement('a')
    a.href = audioUrl
    a.download = `vortex-${mode}-${Date.now()}.mp3`
    a.click()
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
      <audio ref={audioRef} onTimeUpdate={onTimeUpdate} onLoadedMetadata={onLoadedMetadata}
        onEnded={() => { 
          setPlaying(false)
          setProgress(0)
          if (animationRef.current) cancelAnimationFrame(animationRef.current)
        }} />

      {/* Real-time Frequency Waveform */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 60, marginBottom: 16, overflow: 'hidden' }}>
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

      {/* Progress bar */}
      <div style={{ height: 4, borderRadius: 4, background: 'var(--border)', marginBottom: 14 }}>
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
            onClick={toggle}
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              border: 'none',
              background: `linear-gradient(135deg, ${colors.from}, ${colors.to})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}>
            {playing ? <Pause size={18} color="#fff" /> : <Play size={18} color="#fff" />}
          </motion.button>

          <button onClick={restart} className="icon-btn" style={{ width: 36, height: 36 }}>
            <RotateCcw size={14} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Volume2 size={14} color={colors.from} />
            <span style={{ fontSize: 12, color: 'var(--text2)', fontVariantNumeric: 'tabular-nums' }}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
        </div>

        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={download}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 14px',
            borderRadius: 10,
            border: `1px solid ${colors.from}40`,
            background: `${colors.from}15`,
            color: colors.from,
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer'
          }}>
          <Download size={13} />
          Download
        </motion.button>
      </div>
    </motion.div>
  )
}
