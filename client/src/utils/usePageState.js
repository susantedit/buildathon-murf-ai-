import { useState, useEffect } from 'react'

/**
 * Drop-in replacement for useState that persists to sessionStorage.
 * Survives phone app-switching, tab backgrounding, and browser suspension.
 * Clears when the browser tab is fully closed (sessionStorage behavior).
 *
 * Usage: const [value, setValue] = usePageState('unique-key', defaultValue)
 */
export function usePageState(key, defaultValue) {
  const [state, setState] = useState(() => {
    try {
      const saved = sessionStorage.getItem(key)
      return saved !== null ? JSON.parse(saved) : defaultValue
    } catch {
      return defaultValue
    }
  })

  useEffect(() => {
    try {
      sessionStorage.setItem(key, JSON.stringify(state))
    } catch {
      // sessionStorage full or unavailable — fail silently
    }
  }, [key, state])

  return [state, setState]
}
