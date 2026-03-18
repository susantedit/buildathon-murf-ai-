import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Home, Mic, Brain, BookOpen, History, Sun, Moon, Timer, CalendarDays, Menu, X, Shield } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

const links = [
  { to: '/',          label: 'Home',      Icon: Home },
  { to: '/creator',   label: 'Creator',   Icon: Mic },
  { to: '/assistant', label: 'Assistant', Icon: Brain },
  { to: '/study',     label: 'Study',     Icon: BookOpen },
  { to: '/focus',     label: 'Focus',     Icon: Timer },
  { to: '/planner',   label: 'Planner',   Icon: CalendarDays },
  { to: '/safety',    label: 'Safety',    Icon: Shield },
  { to: '/history',   label: 'History',   Icon: History },
]

export default function Navbar() {
  const { dark, toggle } = useTheme()
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Desktop */}
      <nav className="navbar">
        <NavLink to="/" className="nav-logo">
          <div className="nav-logo-icon"><Zap size={15} color="#fff" /></div>
          <span className="nav-logo-text">Vortex Voice AI</span>
        </NavLink>

        <div className="nav-links">
          {links.map(({ to, label, Icon }) => (
            <NavLink key={to} to={to} end={to === '/'}
              className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
              <Icon size={13} />{label}
            </NavLink>
          ))}
        </div>

        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          className="icon-btn" onClick={toggle}>
          {dark ? <Sun size={15} /> : <Moon size={15} />}
        </motion.button>
      </nav>

      {/* Mobile top bar */}
      <div className="mob-top">
        <NavLink to="/" className="nav-logo">
          <div className="nav-logo-icon" style={{ width: 28, height: 28, borderRadius: 8 }}>
            <Zap size={13} color="#fff" />
          </div>
          <span className="nav-logo-text" style={{ fontSize: 14 }}>Vortex Voice AI</span>
        </NavLink>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="icon-btn" style={{ width: 32, height: 32 }} onClick={toggle}>
            {dark ? <Sun size={14} /> : <Moon size={14} />}
          </button>
          <button className="icon-btn" style={{ width: 32, height: 32 }} onClick={() => setOpen(o => !o)}>
            {open ? <X size={14} /> : <Menu size={14} />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div className="mob-menu"
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            {links.map(({ to, label, Icon }) => (
              <NavLink key={to} to={to} end={to === '/'}
                className={({ isActive }) => 'mob-link' + (isActive ? ' active' : '')}
                onClick={() => setOpen(false)}>
                <Icon size={15} />{label}
              </NavLink>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom nav */}
      <nav className="bot-nav">
        {links.slice(0, 7).map(({ to, label, Icon }) => (
          <NavLink key={to} to={to} end={to === '/'}
            className={({ isActive }) => 'bot-link' + (isActive ? ' active' : '')}>
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  )
}
