import { motion } from 'framer-motion'
import { Check } from 'lucide-react'

export default function WorkflowSteps({ currentStep, steps }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 32, gap: 8 }}>
      {steps.map((step, i) => {
        const isActive = i === currentStep
        const isComplete = i < currentStep
        const stepNum = i + 1

        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: isActive ? 1.1 : 1 }}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: isComplete
                    ? 'linear-gradient(135deg, #10b981, #34d399)'
                    : isActive
                    ? 'linear-gradient(135deg, #8b5cf6, #3b82f6)'
                    : 'var(--glass)',
                  border: `2px solid ${isComplete ? '#10b981' : isActive ? '#8b5cf6' : 'var(--border)'}`,
                  color: isComplete || isActive ? '#fff' : 'var(--text3)',
                  fontSize: 14,
                  fontWeight: 700,
                  transition: 'all 0.3s'
                }}>
                {isComplete ? <Check size={18} /> : stepNum}
              </motion.div>

              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: isActive ? 'var(--text1)' : isComplete ? '#10b981' : 'var(--text3)',
                  transition: 'color 0.3s'
                }}>
                  {step.label}
                </div>
                {step.icon && (
                  <div style={{ fontSize: 16, marginTop: 2 }}>{step.icon}</div>
                )}
              </div>
            </div>

            {i < steps.length - 1 && (
              <div style={{
                width: 40,
                height: 2,
                background: isComplete ? '#10b981' : 'var(--border)',
                marginBottom: 30,
                transition: 'background 0.3s'
              }} />
            )}
          </div>
        )
      })}
    </div>
  )
}
