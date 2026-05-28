import { useRef, useCallback } from 'react'

/**
 * FloatingPanel — 3D perspective tilt on mouse move
 * Wraps any content in a glass card that tilts toward the cursor
 */
export default function FloatingPanel({
  children,
  glowColor = '#4F8CFF',
  className = '',
  style = {},
  disabled = false,
  ...props
}) {
  const ref = useRef(null)

  const handleMouseMove = useCallback((e) => {
    if (disabled || !ref.current) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const rect = ref.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const rotateX = ((e.clientY - centerY) / rect.height) * -12
    const rotateY = ((e.clientX - centerX) / rect.width) * 12
    // apply transform and expose glow/color as CSS vars so styles are consistent across pages
    ref.current.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(4px)`
    ref.current.style.setProperty('--fp-glow', `${glowColor}22`)
    ref.current.style.setProperty('--fp-border', `${glowColor}55`)
  }, [glowColor, disabled])

  const handleMouseLeave = useCallback(() => {
    if (!ref.current) return
    ref.current.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) translateZ(0)'
    ref.current.style.setProperty('--fp-glow', 'transparent')
    ref.current.style.setProperty('--fp-border', 'rgba(79,140,255,0.18)')
  }, [])

  return (
    <div
      ref={ref}
      className={`card floating-panel ${className}`}
      tabIndex={0}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onFocus={() => { if (ref.current) ref.current.style.transform = 'perspective(800px) translateZ(4px)'; }}
      onBlur={() => { if (ref.current) ref.current.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) translateZ(0)'; }}
      style={{
        transition: 'transform 0.15s ease, box-shadow 0.25s ease, border-color 0.25s ease',
        willChange: 'transform',
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  )
}
