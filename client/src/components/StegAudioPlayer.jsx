import { useState, useRef, useCallback } from 'react'
import WaveformPlayer from './WaveformPlayer'
import StegRevealPanel from './StegRevealPanel'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

/**
 * StegAudioPlayer
 *
 * Wraps WaveformPlayer with no visual difference.
 * Holds a stegMessageId prop (invisible to the user).
 * Renders a StegRevealPanel in receive mode alongside the player.
 *
 * Props:
 *   audioUrl      – URL / data-URL of the stego WAV
 *   stegMessageId – MongoDB ObjectId string (not rendered in UI)
 *   duration      – duration in seconds (passed to WaveformPlayer)
 *   mode          – WaveformPlayer mode string (default 'creator')
 *   isLoading     – forwarded to WaveformPlayer
 */
export default function StegAudioPlayer({
  audioUrl,
  stegMessageId,
  duration,
  mode = 'creator',
  isLoading = false,
}) {
  const [statusMsg, setStatusMsg] = useState(null)
  const [playbackUrl, setPlaybackUrl] = useState(null)
  const blobUrlRef = useRef(null)

  // Revoke any previous Blob URL to prevent memory leaks
  const revokeBlobUrl = useCallback(() => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current)
      blobUrlRef.current = null
    }
  }, [])

  const handleReveal = useCallback(async ({ pin }) => {
    setStatusMsg(null)
    revokeBlobUrl()

    try {
      const response = await fetch(`${API_BASE}/api/steg/reveal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stegMessageId, pin }),
      })

      if (response.status === 401) {
        setStatusMsg('Incorrect PIN')
        return
      }
      if (response.status === 404) {
        setStatusMsg('Message already played')
        return
      }
      if (response.status === 429) {
        setStatusMsg('Too many attempts — try again later')
        return
      }
      if (!response.ok) {
        setStatusMsg('Playback failed')
        return
      }

      // Stream the audio chunks into a Blob
      const chunks = []
      const reader = response.body.getReader()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        chunks.push(value)
      }

      const blob = new Blob(chunks, { type: 'audio/mpeg' })
      const url = URL.createObjectURL(blob)
      blobUrlRef.current = url
      setPlaybackUrl(url)

      // Play via a transient Audio element; revoke Blob URL on ended
      const audio = new Audio(url)
      audio.onended = () => {
        revokeBlobUrl()
        setPlaybackUrl(null)
      }
      audio.onerror = () => {
        revokeBlobUrl()
        setPlaybackUrl(null)
        setStatusMsg('Playback failed')
      }
      audio.play().catch(() => {
        revokeBlobUrl()
        setPlaybackUrl(null)
        setStatusMsg('Playback failed')
      })
    } catch {
      setStatusMsg('Playback failed')
    }
  }, [stegMessageId, revokeBlobUrl])

  return (
    <div style={{ position: 'relative' }}>
      {/* Normal-looking audio player — visually identical to any other voice note */}
      <WaveformPlayer
        audioUrl={audioUrl}
        isLoading={isLoading}
        mode={mode}
      />

      {/* Status message (incorrect PIN, already played, etc.) */}
      {statusMsg && (
        <p style={{
          margin: '4px 0 0',
          fontSize: 12,
          color: '#f87171',
          textAlign: 'center',
        }}>
          {statusMsg}
        </p>
      )}

      {/* Hidden trigger + PIN panel — receive mode */}
      {stegMessageId && (
        <div style={{
          position: 'absolute',
          bottom: 8,
          right: 8,
          lineHeight: 1,
        }}>
          <StegRevealPanel
            mode="receive"
            stegMessageId={stegMessageId}
            onSubmit={handleReveal}
            onDismiss={() => setStatusMsg(null)}
          />
        </div>
      )}
    </div>
  )
}
