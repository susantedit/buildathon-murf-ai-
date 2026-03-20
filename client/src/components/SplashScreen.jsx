import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import './SplashScreen.css'

export default function SplashScreen({ onDone }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    // Show for ~2.5s then fade out
    const t = setTimeout(() => {
      setVisible(false)
      setTimeout(onDone, 500)
    }, 2500)
    return () => clearTimeout(t)
  }, [])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="splash-screen"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="splash-container">
            {/* Speeder */}
            <div className="speeder">
              <span>
                <span />
                <span />
                <span />
                <span />
              </span>
              <div className="speeder-base">
                <span />
                <div className="speeder-face" />
              </div>
            </div>

            {/* App name below */}
            <div className="splash-title">Vortex Voice AI</div>

            {/* Progress bar */}
            <div className="splash-progress" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
