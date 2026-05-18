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
            <motion.div
              className="splash-orb"
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="splash-ring splash-ring-a" />
              <div className="splash-ring splash-ring-b" />
              <div className="splash-core" />
            </motion.div>

            <div className="splash-brand">Vortex Atlas</div>
            <div className="splash-copy">A premium voice-native AI workspace</div>
            <div className="splash-progress" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
