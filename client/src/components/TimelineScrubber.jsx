// TimelineScrubber — Horizontal timeline scrubber with drag support
// Props: items [{id, label, time}], value (current index), onChange (callback)
import { useRef, useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'

export default function TimelineScrubber({
  items = [],
  value = 0,
  onChange,
  height = 64,
  style = {},
  className = '',
}) {
  const trackRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const [hovered, setHovered] = useState(null)

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v))

  // Convert pointer X position to item index
  const xToIndex = useCallback((clientX) => {
    if (!trackRef.current || !items.length) return 0
    const rect = trackRef.current.getBoundingClientRect()
    const ratio = clamp((clientX - rect.left) / rect.width, 0, 1)
    return Math.round(ratio * (items.length - 1))
  }, [items.length])

  // Pointer down — start drag
  const handlePointerDown = useCallback((e) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    setDragging(true)
    const idx = xToIndex(e.clientX)
    onChange?.(idx)
  }, [xToIndex, onChange])

  // Pointer move — drag
  const handlePointerMove = useCallback((e) => {
    if (!dragging) return
    const idx = xToIndex(e.clientX)
    onChange?.(idx)
  }, [dragging, xToIndex, onChange])

  // Pointer up — end drag
  const handlePointerUp = useCallback(() => {
    setDragging(false)
  }, [])

  // Keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault()
      onChange?.(clamp(value - 1, 0, items.length - 1))
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault()
      onChange?.(clamp(value + 1, 0, items.length - 1))
    } else if (e.key === 'Home') {
      e.preventDefault()
      onChange?.(0)
    } else if (e.key === 'End') {
      e.preventDefault()
      onChange?.(items.length - 1)
    }
  }, [value, items.length, onChange])

  if (!items.length) return null

  const progress = items.length > 1 ? value / (items.length - 1) : 0
  const currentItem = items[value]

  return (
    <div
      className={className}
      style={{
        width: '100%',
        userSelect: 'none',
        ...style,
      }}
      aria-label="Timeline scrubber"
    >
      {/* Current item label */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 10,
      }}>
        <motion.div
          key={value}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          style={{ fontSize: 13, fontWeight: 700, color: 'var(--text1)' }}
        >
          {currentItem?.label || ''}
        </motion.div>
        {currentItem?.time && (
          <div style={{
            fontSize: 11, fontWeight: 600, color: '#4F8CFF',
            fontFamily: "'JetBrains Mono', monospace",
            padding: '2px 8px', borderRadius: 999,
            background: 'rgba(79,140,255,0.1)',
            border: '1px solid rgba(79,140,255,0.25)',
          }}>
            {currentItem.time}
          </div>
        )}
      </div>

      {/* Track area */}
      <div
        ref={trackRef}
        role="slider"
        aria-valuemin={0}
        aria-valuemax={items.length - 1}
        aria-valuenow={value}
        aria-valuetext={currentItem?.label || String(value)}
        tabIndex={0}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onKeyDown={handleKeyDown}
        style={{
          position: 'relative',
          height: height,
          cursor: dragging ? 'grabbing' : 'grab',
          outline: 'none',
          paddingTop: 20,
          paddingBottom: 20,
        }}
      >
        {/* Track background */}
        <div style={{
          position: 'absolute',
          left: 0, right: 0,
          top: '50%',
          transform: 'translateY(-50%)',
          height: 4,
          borderRadius: 2,
          background: 'rgba(255,255,255,0.07)',
          border: '1px solid rgba(79,140,255,0.12)',
        }} />

        {/* Filled track */}
        <motion.div
          style={{
            position: 'absolute',
            left: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            height: 4,
            borderRadius: 2,
            background: 'linear-gradient(90deg, #4F8CFF, #A855F7)',
            boxShadow: '0 0 8px rgba(79,140,255,0.5)',
            width: `${progress * 100}%`,
            transition: dragging ? 'none' : 'width 0.25s ease',
          }}
        />

        {/* Tick marks */}
        {items.map((item, i) => {
          const tickProgress = items.length > 1 ? i / (items.length - 1) : 0
          const showLabel = i % 3 === 0
          const isActive = i <= value
          const isCurrent = i === value

          return (
            <div
              key={item.id ?? i}
              style={{
                position: 'absolute',
                left: `${tickProgress * 100}%`,
                top: '50%',
                transform: 'translate(-50%, -50%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                pointerEvents: 'none',
              }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              {/* Tick */}
              <div style={{
                width: isCurrent ? 10 : 6,
                height: isCurrent ? 10 : 6,
                borderRadius: '50%',
                background: isActive
                  ? (isCurrent ? '#fff' : '#4F8CFF')
                  : 'rgba(255,255,255,0.2)',
                border: isCurrent ? '2px solid #4F8CFF' : 'none',
                boxShadow: isCurrent ? '0 0 10px rgba(79,140,255,0.8)' : 'none',
                transition: 'all 0.2s',
                pointerEvents: 'auto',
                cursor: 'pointer',
              }}
                onClick={() => onChange?.(i)}
              />

              {/* Label every 3rd item */}
              {showLabel && (
                <div style={{
                  position: 'absolute',
                  top: 14,
                  fontSize: 9,
                  fontWeight: 600,
                  color: isActive ? 'var(--text2)' : 'var(--text3)',
                  whiteSpace: 'nowrap',
                  maxWidth: 60,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  textAlign: 'center',
                  transition: 'color 0.2s',
                  pointerEvents: 'none',
                }}>
                  {item.label}
                </div>
              )}
            </div>
          )
        })}

        {/* Draggable handle */}
        <motion.div
          style={{
            position: 'absolute',
            left: `${progress * 100}%`,
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #4F8CFF, #A855F7)',
            border: '2px solid rgba(255,255,255,0.9)',
            boxShadow: dragging
              ? '0 0 0 6px rgba(79,140,255,0.25), 0 0 20px rgba(79,140,255,0.6)'
              : '0 0 0 3px rgba(79,140,255,0.2), 0 0 12px rgba(79,140,255,0.4)',
            cursor: dragging ? 'grabbing' : 'grab',
            zIndex: 2,
            transition: dragging ? 'none' : 'left 0.25s ease, box-shadow 0.2s',
          }}
          whileHover={{ scale: 1.2 }}
          animate={{ scale: dragging ? 1.15 : 1 }}
        />

        {/* Hover tooltip */}
        {hovered !== null && hovered !== value && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'absolute',
              left: `${(items.length > 1 ? hovered / (items.length - 1) : 0) * 100}%`,
              bottom: '100%',
              transform: 'translateX(-50%)',
              background: 'rgba(11,15,26,0.95)',
              border: '1px solid rgba(79,140,255,0.3)',
              borderRadius: 8,
              padding: '4px 8px',
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--text1)',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              zIndex: 10,
              marginBottom: 6,
            }}
          >
            {items[hovered]?.label}
            {items[hovered]?.time && (
              <span style={{ color: '#4F8CFF', marginLeft: 6 }}>{items[hovered].time}</span>
            )}
          </motion.div>
        )}
      </div>

      {/* Item count indicator */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        marginTop: 4, fontSize: 10, color: 'var(--text3)',
        fontFamily: "'JetBrains Mono', monospace",
      }}>
        <span>{items[0]?.label || '0'}</span>
        <span style={{ color: '#4F8CFF' }}>{value + 1} / {items.length}</span>
        <span>{items[items.length - 1]?.label || String(items.length - 1)}</span>
      </div>
    </div>
  )
}
