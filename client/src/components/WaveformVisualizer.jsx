// CSS-only animated waveform bars — no Web Audio API needed
// Used in CageBait, Assistant, and WaveformPlayer

export default function WaveformVisualizer({
  isPlaying = false,
  color = '#4F8CFF',
  barCount = 20,
  height = 32,
  style = {},
}) {
  return (
    <div
      aria-hidden="true"
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: 2,
        height,
        ...style,
      }}
    >
      {Array.from({ length: barCount }).map((_, i) => {
        const baseH = 20 + Math.abs(Math.sin(i * 0.8)) * 40
        const animDelay = (i * 0.05) % 0.8

        return (
          <div
            key={i}
            className={isPlaying ? 'wv-bar playing' : 'wv-bar'}
            style={{
              flex: 1,
              borderRadius: 3,
              background: isPlaying
                ? `linear-gradient(to top, ${color}, ${color}88)`
                : `${color}33`,
              height: isPlaying ? `${baseH}%` : '20%',
              transformOrigin: 'bottom',
              animationDelay: `${animDelay}s`,
              animationDuration: `${0.6 + (i % 4) * 0.1}s`,
              transition: 'height 0.3s ease, background 0.3s ease',
              willChange: 'transform',
            }}
          />
        )
      })}
    </div>
  )
}
