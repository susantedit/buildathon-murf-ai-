import { useState, useRef, useEffect, useCallback } from 'react'
import { Mic, Square, X, AlertCircle } from 'lucide-react'
import { motion } from 'framer-motion'

const MIN_DURATION_S = 1
const MAX_DURATION_S = 120
const SAMPLE_RATE = 44100
const WAV_HEADER_BYTES = 44

// Build a 44-byte PCM WAV header for the given parameters
function buildWavHeader(numSamples, sampleRate, numChannels, bitsPerSample) {
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8)
  const blockAlign = numChannels * (bitsPerSample / 8)
  const dataSize = numSamples * numChannels * (bitsPerSample / 8)
  const buffer = new ArrayBuffer(WAV_HEADER_BYTES)
  const view = new DataView(buffer)

  // RIFF chunk descriptor
  view.setUint8(0, 0x52); view.setUint8(1, 0x49); view.setUint8(2, 0x46); view.setUint8(3, 0x46) // "RIFF"
  view.setUint32(4, 36 + dataSize, true)                                                          // ChunkSize
  view.setUint8(8, 0x57); view.setUint8(9, 0x41); view.setUint8(10, 0x56); view.setUint8(11, 0x45) // "WAVE"

  // fmt sub-chunk
  view.setUint8(12, 0x66); view.setUint8(13, 0x6D); view.setUint8(14, 0x74); view.setUint8(15, 0x20) // "fmt "
  view.setUint32(16, 16, true)          // Subchunk1Size (PCM = 16)
  view.setUint16(20, 1, true)           // AudioFormat (PCM = 1)
  view.setUint16(22, numChannels, true) // NumChannels
  view.setUint32(24, sampleRate, true)  // SampleRate
  view.setUint32(28, byteRate, true)    // ByteRate
  view.setUint16(32, blockAlign, true)  // BlockAlign
  view.setUint16(34, bitsPerSample, true) // BitsPerSample

  // data sub-chunk
  view.setUint8(36, 0x64); view.setUint8(37, 0x61); view.setUint8(38, 0x74); view.setUint8(39, 0x61) // "data"
  view.setUint32(40, dataSize, true)    // Subchunk2Size

  return buffer
}

// Encode raw Float32 PCM samples to a WAV Blob (mono, 16-bit, 44100 Hz)
function encodeWavBlob(float32Samples, sampleRate) {
  const numSamples = float32Samples.length
  const header = buildWavHeader(numSamples, sampleRate, 1, 16)
  const pcmData = new Int16Array(numSamples)
  for (let i = 0; i < numSamples; i++) {
    const clamped = Math.max(-1, Math.min(1, float32Samples[i]))
    pcmData[i] = clamped < 0 ? clamped * 32768 : clamped * 32767
  }
  return new Blob([header, pcmData.buffer], { type: 'audio/wav' })
}

export default function StegRecorder({ onRecordingComplete, onCancel }) {
  const [state, setState] = useState('idle') // idle | requesting | recording | error
  const [permissionError, setPermissionError] = useState(null)
  const [durationError, setDurationError] = useState(null)
  const [elapsed, setElapsed] = useState(0)

  // Refs — never trigger re-renders
  const audioCtxRef = useRef(null)
  const analyserRef = useRef(null)
  const streamRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const pcmSamplesRef = useRef([])       // used in ScriptProcessor fallback
  const scriptProcessorRef = useRef(null)
  const sourceNodeRef = useRef(null)
  const canvasRef = useRef(null)
  const rafRef = useRef(null)
  const timerRef = useRef(null)
  const startTimeRef = useRef(null)
  const cancelledRef = useRef(false)     // flag: true when cancel was pressed

  // ── Waveform drawing ──────────────────────────────────────────────────────
  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current
    const analyser = analyserRef.current
    if (!canvas || !analyser) return

    const ctx = canvas.getContext('2d')
    const W = canvas.width
    const H = canvas.height
    const bufLen = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufLen)
    analyser.getByteTimeDomainData(dataArray)

    ctx.clearRect(0, 0, W, H)

    // Background
    ctx.fillStyle = 'rgba(139,92,246,0.05)'
    ctx.fillRect(0, 0, W, H)

    // Waveform line
    ctx.lineWidth = 2
    ctx.strokeStyle = '#8b5cf6'
    ctx.beginPath()
    const sliceWidth = W / bufLen
    let x = 0
    for (let i = 0; i < bufLen; i++) {
      const v = dataArray[i] / 128.0
      const y = (v * H) / 2
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
      x += sliceWidth
    }
    ctx.lineTo(W, H / 2)
    ctx.stroke()

    rafRef.current = requestAnimationFrame(drawWaveform)
  }, [])

  // ── Cleanup helper ────────────────────────────────────────────────────────
  const cleanup = useCallback(() => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null }
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect()
      scriptProcessorRef.current = null
    }
    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect()
      sourceNodeRef.current = null
    }
    if (analyserRef.current) {
      analyserRef.current.disconnect()
      analyserRef.current = null
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close()
      audioCtxRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    mediaRecorderRef.current = null
    chunksRef.current = []
    pcmSamplesRef.current = []
  }, [])

  // Cleanup on unmount
  useEffect(() => () => cleanup(), [cleanup])

  // ── Start recording ───────────────────────────────────────────────────────
  const startRecording = useCallback(async () => {
    setPermissionError(null)
    setDurationError(null)
    cancelledRef.current = false
    setState('requesting')

    let stream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch (err) {
      setPermissionError('Microphone access was denied. Please allow microphone permission and try again.')
      setState('error')
      return
    }

    streamRef.current = stream

    // AudioContext at 44100 Hz
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: SAMPLE_RATE })
    audioCtxRef.current = audioCtx

    const source = audioCtx.createMediaStreamSource(stream)
    sourceNodeRef.current = source

    const analyser = audioCtx.createAnalyser()
    analyser.fftSize = 2048
    analyserRef.current = analyser
    source.connect(analyser)

    // Try native MediaRecorder with audio/wav
    const wavSupported = typeof MediaRecorder !== 'undefined' &&
      MediaRecorder.isTypeSupported('audio/wav')

    if (wavSupported) {
      // ── Native WAV path ──────────────────────────────────────────────────
      const mr = new MediaRecorder(stream, { mimeType: 'audio/wav' })
      mediaRecorderRef.current = mr
      chunksRef.current = []

      mr.ondataavailable = e => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data)
      }

      mr.onstop = () => {
        if (cancelledRef.current) return // discard

        const durationSec = (Date.now() - startTimeRef.current) / 1000
        if (durationSec < MIN_DURATION_S) {
          setDurationError(`Recording must be at least ${MIN_DURATION_S} second.`)
          setState('idle')
          cleanup()
          return
        }

        const blob = new Blob(chunksRef.current, { type: 'audio/wav' })
        cleanup()
        setState('idle')
        onRecordingComplete(blob)
      }

      mr.start()
    } else {
      // ── ScriptProcessorNode PCM fallback ─────────────────────────────────
      // bufferSize 4096 gives ~11 ms per callback at 44100 Hz — well above 30 fps
      const bufferSize = 4096
      const scriptProcessor = audioCtx.createScriptProcessor(bufferSize, 1, 1)
      scriptProcessorRef.current = scriptProcessor
      pcmSamplesRef.current = []

      scriptProcessor.onaudioprocess = e => {
        const inputData = e.inputBuffer.getChannelData(0)
        pcmSamplesRef.current.push(new Float32Array(inputData))
      }

      source.connect(scriptProcessor)
      scriptProcessor.connect(audioCtx.destination)
    }

    // Elapsed timer
    startTimeRef.current = Date.now()
    setElapsed(0)
    timerRef.current = setInterval(() => {
      const sec = Math.floor((Date.now() - startTimeRef.current) / 1000)
      setElapsed(sec)
      if (sec >= MAX_DURATION_S) {
        // Auto-stop at max duration
        stopRecording()
      }
    }, 500)

    setState('recording')
    rafRef.current = requestAnimationFrame(drawWaveform)
  }, [cleanup, drawWaveform, onRecordingComplete])

  // ── Stop recording ────────────────────────────────────────────────────────
  const stopRecording = useCallback(() => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null }
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }

    const durationSec = startTimeRef.current
      ? (Date.now() - startTimeRef.current) / 1000
      : 0

    if (durationSec < MIN_DURATION_S) {
      setDurationError(`Recording must be at least ${MIN_DURATION_S} second.`)
      setState('idle')
      cleanup()
      return
    }

    const mr = mediaRecorderRef.current

    if (mr && mr.state !== 'inactive') {
      // Native MediaRecorder path — onstop handler fires after stop()
      mr.stop()
    } else if (scriptProcessorRef.current) {
      // ScriptProcessor fallback — encode manually
      if (cancelledRef.current) {
        cleanup()
        setState('idle')
        return
      }

      // Flatten all Float32 chunks
      const allChunks = pcmSamplesRef.current
      const totalSamples = allChunks.reduce((acc, c) => acc + c.length, 0)
      const flat = new Float32Array(totalSamples)
      let offset = 0
      for (const chunk of allChunks) {
        flat.set(chunk, offset)
        offset += chunk.length
      }

      const blob = encodeWavBlob(flat, SAMPLE_RATE)
      cleanup()
      setState('idle')
      onRecordingComplete(blob)
    } else {
      cleanup()
      setState('idle')
    }
  }, [cleanup, onRecordingComplete])

  // ── Cancel recording ──────────────────────────────────────────────────────
  const handleCancel = useCallback(() => {
    cancelledRef.current = true

    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null }
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }

    const mr = mediaRecorderRef.current
    if (mr && mr.state !== 'inactive') {
      mr.stop() // onstop will check cancelledRef and discard
    } else {
      cleanup()
    }

    setState('idle')
    setElapsed(0)
    setDurationError(null)
    onCancel()
  }, [cleanup, onCancel])

  // ── Format elapsed time ───────────────────────────────────────────────────
  const formatTime = (sec) => {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      padding: '16px',
      borderRadius: 14,
      background: 'var(--glass, rgba(255,255,255,0.04))',
      border: '1px solid var(--border, rgba(255,255,255,0.08))',
    }}>

      {/* Permission error */}
      {permissionError && (
        <div role="alert" style={{
          display: 'flex', alignItems: 'flex-start', gap: 8,
          padding: '10px 12px', borderRadius: 8,
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
          color: '#f87171', fontSize: 13,
        }}>
          <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} aria-hidden="true" />
          <span>{permissionError}</span>
        </div>
      )}

      {/* Duration error */}
      {durationError && (
        <div role="alert" style={{
          display: 'flex', alignItems: 'flex-start', gap: 8,
          padding: '10px 12px', borderRadius: 8,
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
          color: '#f87171', fontSize: 13,
        }}>
          <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} aria-hidden="true" />
          <span>{durationError}</span>
        </div>
      )}

      {/* Live waveform canvas — always mounted so the ref is stable */}
      <canvas
        ref={canvasRef}
        width={320}
        height={64}
        aria-hidden="true"
        style={{
          width: '100%',
          height: 64,
          borderRadius: 8,
          background: 'rgba(139,92,246,0.05)',
          display: state === 'recording' ? 'block' : 'none',
        }}
      />

      {/* Elapsed / max duration indicator */}
      {state === 'recording' && (
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          fontSize: 12, color: 'var(--text2, rgba(255,255,255,0.5))',
          fontVariantNumeric: 'tabular-nums',
        }}>
          <span style={{ color: '#ef4444', fontWeight: 600 }}>
            ● {formatTime(elapsed)}
          </span>
          <span>max {formatTime(MAX_DURATION_S)}</span>
        </div>
      )}

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>

        {state === 'idle' || state === 'error' ? (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={startRecording}
            aria-label="Start recording"
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 18px', borderRadius: 10, border: 'none',
              background: 'linear-gradient(135deg,#8b5cf6,#c084fc)',
              color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            <Mic size={15} aria-hidden="true" />
            Record
          </motion.button>
        ) : state === 'requesting' ? (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 18px', borderRadius: 10,
            background: 'rgba(139,92,246,0.15)',
            color: '#8b5cf6', fontSize: 13, fontWeight: 600,
          }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              style={{ width: 15, height: 15, border: '2px solid #8b5cf6', borderTopColor: 'transparent', borderRadius: '50%' }}
            />
            Requesting…
          </div>
        ) : (
          /* recording state */
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={stopRecording}
            aria-label="Stop recording"
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 18px', borderRadius: 10, border: 'none',
              background: 'linear-gradient(135deg,#ef4444,#dc2626)',
              color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            <motion.div
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ repeat: Infinity, duration: 0.8 }}
            >
              <Square size={14} fill="#fff" aria-hidden="true" />
            </motion.div>
            Stop
          </motion.button>
        )}

        {/* Cancel — always visible so the user can bail out */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleCancel}
          aria-label="Cancel recording"
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '10px 14px', borderRadius: 10,
            border: '1px solid var(--border, rgba(255,255,255,0.1))',
            background: 'var(--glass, rgba(255,255,255,0.04))',
            color: 'var(--text2, rgba(255,255,255,0.5))',
            fontSize: 13, fontWeight: 500, cursor: 'pointer',
          }}
        >
          <X size={14} aria-hidden="true" />
          Cancel
        </motion.button>
      </div>
    </div>
  )
}
