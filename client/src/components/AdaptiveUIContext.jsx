import { createContext, useContext, useState, useCallback, useEffect } from 'react'

const MODES = {
  default: {
    '--ng-blue':   '#4F8CFF',
    '--ng-purple': '#A855F7',
    '--ng-cyan':   '#22d3ee',
    '--g1':        'rgba(79,140,255,0.20)',
    '--g2':        'rgba(168,85,247,0.15)',
    '--border':    'rgba(79,140,255,0.18)',
  },
  debugging: {
    '--ng-blue':   '#ef4444',
    '--ng-purple': '#f97316',
    '--ng-cyan':   '#fbbf24',
    '--g1':        'rgba(239,68,68,0.20)',
    '--g2':        'rgba(249,115,22,0.15)',
    '--border':    'rgba(239,68,68,0.22)',
  },
  learning: {
    '--ng-blue':   '#22d3ee',
    '--ng-purple': '#3b82f6',
    '--ng-cyan':   '#06b6d4',
    '--g1':        'rgba(34,211,238,0.18)',
    '--g2':        'rgba(59,130,246,0.14)',
    '--border':    'rgba(34,211,238,0.20)',
  },
  exploring: {
    '--ng-blue':   '#A855F7',
    '--ng-purple': '#ec4899',
    '--ng-cyan':   '#f472b6',
    '--g1':        'rgba(168,85,247,0.22)',
    '--g2':        'rgba(236,72,153,0.16)',
    '--border':    'rgba(168,85,247,0.24)',
  },
}

const AdaptiveUIContext = createContext({
  mode: 'default',
  setMode: () => {},
  modeColors: MODES.default,
})

export function AdaptiveUIProvider({ children }) {
  const [mode, setModeState] = useState('default')

  const setMode = useCallback((newMode) => {
    if (!MODES[newMode]) return
    setModeState(newMode)

    // Inject CSS variables onto :root with smooth transition
    const root = document.documentElement
    const vars = MODES[newMode]
    Object.entries(vars).forEach(([key, value]) => {
      root.style.setProperty(key, value)
    })
  }, [])

  // Apply default on mount
  useEffect(() => {
    const root = document.documentElement
    Object.entries(MODES.default).forEach(([key, value]) => {
      root.style.setProperty(key, value)
    })
  }, [])

  return (
    <AdaptiveUIContext.Provider value={{ mode, setMode, modeColors: MODES[mode] }}>
      {children}
    </AdaptiveUIContext.Provider>
  )
}

export function useAdaptiveUI() {
  return useContext(AdaptiveUIContext)
}

export { MODES }
