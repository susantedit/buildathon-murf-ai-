import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'

/**
 * HolographicCalendar — floating holographic planner UI
 * Tasks float in 3D space, glow on priority
 */

const PRIORITY_COLORS = {
  high:   { bg: 'rgba(239,68,68,0.15)',   border: 'rgba(239,68,68,0.40)',   glow: '#ef4444', label: 'High' },
  medium: { bg: 'rgba(245,158,11,0.15)',  border: 'rgba(245,158,11,0.40)',  glow: '#f59e0b', label: 'Med' },
  low:    { bg: 'rgba(79,140,255,0.12)',  border: 'rgba(79,140,255,0.30)',  glow: '#4F8CFF', label: 'Low' },
}

const DEMO_TASKS = [
  { id: 1, day: 1,  title: 'CageBait demo prep',    priority: 'high',   done: false },
  { id: 2, day: 1,  title: 'Review Murf voices',    priority: 'medium', done: true  },
  { id: 3, day: 3,  title: 'Submit buildathon',     priority: 'high',   done: false },
  { id: 4, day: 5,  title: 'Update README',         priority: 'low',    done: false },
  { id: 5, day: 7,  title: 'Record demo video',     priority: 'high',   done: false },
  { id: 6, day: 10, title: 'Deploy to Netlify',     priority: 'medium', done: false },
  { id: 7, day: 12, title: 'Write blog post',       priority: 'low',    done: true  },
  { id: 8, day: 15, title: 'Share on Discord',      priority: 'medium', done: false },
]

export default function HolographicCalendar({ style = {} }) {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth())
  const [year, setYear] = useState(now.getFullYear())
  const [tasks, setTasks] = useState(DEMO_TASKS)
  const [selectedDay, setSelectedDay] = useState(now.getDate())
  const [hoveredDay, setHoveredDay] = useState(null)

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDay = new Date(year, month, 1).getDay()
  const monthName = new Date(year, month).toLocaleString('default', { month: 'long' })

  const dayTasks = (day) => tasks.filter(t => t.day === day)

  const toggleTask = (id) => {
    setTasks(ts => ts.map(t => t.id === id ? { ...t, done: !t.done } : t))
  }

  const selectedTasks = dayTasks(selectedDay)

  return (
    <div style={{ ...style, overflow: 'hidden', minWidth: 0 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <motion.button
          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          onClick={() => { if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1) }}
          style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid rgba(79,140,255,0.25)', background: 'rgba(79,140,255,0.08)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4F8CFF' }}
        >
          <ChevronLeft size={14} />
        </motion.button>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: "'Space Grotesk',system-ui,sans-serif", fontWeight: 800, fontSize: 16, color: '#f0f4ff', letterSpacing: '-0.02em' }}>
            {monthName} {year}
          </div>
          <div style={{ fontSize: 10, color: '#4F8CFF', fontFamily: "'JetBrains Mono',monospace", letterSpacing: '0.08em' }}>
            HOLOGRAPHIC PLANNER
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          onClick={() => { if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1) }}
          style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid rgba(79,140,255,0.25)', background: 'rgba(79,140,255,0.08)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4F8CFF' }}
        >
          <ChevronRight size={14} />
        </motion.button>
      </div>

      {/* Day labels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, marginBottom: 4 }}>
        {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: 9, fontWeight: 700, color: '#4a5568', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '4px 0' }}>
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3 }}>
        {/* Empty cells for first day offset */}
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {/* Day cells */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          const isToday = day === now.getDate() && month === now.getMonth() && year === now.getFullYear()
          const isSelected = day === selectedDay
          const dayTaskList = dayTasks(day)
          const hasHigh = dayTaskList.some(t => t.priority === 'high' && !t.done)
          const hasMed = dayTaskList.some(t => t.priority === 'medium' && !t.done)
          const isHovered = hoveredDay === day

          return (
            <motion.button
              key={day}
              whileHover={{ scale: 1.08, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedDay(day)}
              onMouseEnter={() => setHoveredDay(day)}
              onMouseLeave={() => setHoveredDay(null)}
              style={{
                position: 'relative',
                aspectRatio: '1',
                borderRadius: 8,
                border: isSelected
                  ? '1px solid rgba(79,140,255,0.6)'
                  : isToday
                  ? '1px solid rgba(168,85,247,0.5)'
                  : '1px solid rgba(255,255,255,0.05)',
                background: isSelected
                  ? 'rgba(79,140,255,0.18)'
                  : isToday
                  ? 'rgba(168,85,247,0.12)'
                  : isHovered
                  ? 'rgba(79,140,255,0.08)'
                  : 'rgba(255,255,255,0.02)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                boxShadow: isSelected ? '0 0 12px rgba(79,140,255,0.25)' : 'none',
                transition: 'background 0.2s, border-color 0.2s, box-shadow 0.2s',
              }}
            >
              <span style={{
                fontSize: 11, fontWeight: isToday || isSelected ? 800 : 500,
                color: isSelected ? '#4F8CFF' : isToday ? '#A855F7' : '#94a3b8',
                lineHeight: 1,
              }}>
                {day}
              </span>

              {/* Task indicator dots */}
              {dayTaskList.length > 0 && (
                <div style={{ display: 'flex', gap: 2 }}>
                  {hasHigh && <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 4px #ef4444' }} />}
                  {hasMed && <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#f59e0b', boxShadow: '0 0 4px #f59e0b' }} />}
                  {!hasHigh && !hasMed && <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#4F8CFF', boxShadow: '0 0 4px #4F8CFF' }} />}
                </div>
              )}
            </motion.button>
          )
        })}
      </div>

      {/* Selected day tasks */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedDay}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          style={{ marginTop: 16 }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: '#4a5568', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            {monthName} {selectedDay} · {selectedTasks.length} task{selectedTasks.length !== 1 ? 's' : ''}
          </div>

          {selectedTasks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '16px 0', color: '#4a5568', fontSize: 12 }}>
              No tasks — clear day ✨
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {selectedTasks.map(task => {
                const p = PRIORITY_COLORS[task.priority]
                return (
                  <motion.div
                    key={task.id}
                    whileHover={{ x: 4, boxShadow: `0 0 16px ${p.glow}33` }}
                    onClick={() => toggleTask(task.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 12px', borderRadius: 10,
                      background: task.done ? 'rgba(255,255,255,0.02)' : p.bg,
                      border: `1px solid ${task.done ? 'rgba(255,255,255,0.06)' : p.border}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      opacity: task.done ? 0.5 : 1,
                    }}
                  >
                    {/* Checkbox */}
                    <div style={{
                      width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                      border: `2px solid ${task.done ? '#10b981' : p.glow}`,
                      background: task.done ? '#10b981' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {task.done && <svg width="8" height="8" viewBox="0 0 8 8"><path d="M1 4l2 2 4-4" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>}
                    </div>

                    <span style={{
                      fontSize: 12, fontWeight: 600, color: task.done ? '#4a5568' : '#f0f4ff',
                      flex: 1, textDecoration: task.done ? 'line-through' : 'none',
                    }}>
                      {task.title}
                    </span>

                    <span style={{
                      fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 999,
                      background: `${p.glow}20`, color: p.glow,
                      border: `1px solid ${p.glow}40`,
                      textTransform: 'uppercase', letterSpacing: '0.05em',
                    }}>
                      {p.label}
                    </span>
                  </motion.div>
                )
              })}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
