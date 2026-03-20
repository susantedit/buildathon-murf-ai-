// Daily usage streak tracker
const KEY = 'vortex-streak'

function today() {
  return new Date().toISOString().slice(0, 10) // YYYY-MM-DD
}

export function recordActivity() {
  const data = getStreak()
  const t = today()
  if (data.lastDate === t) return data // already recorded today

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yStr = yesterday.toISOString().slice(0, 10)

  const newStreak = data.lastDate === yStr ? data.current + 1 : 1
  const updated = { current: newStreak, best: Math.max(newStreak, data.best || 0), lastDate: t }
  localStorage.setItem(KEY, JSON.stringify(updated))
  return updated
}

export function getStreak() {
  try {
    const saved = localStorage.getItem(KEY)
    if (!saved) return { current: 0, best: 0, lastDate: null }
    const data = JSON.parse(saved)
    // If last activity wasn't today or yesterday, streak is broken
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yStr = yesterday.toISOString().slice(0, 10)
    if (data.lastDate !== today() && data.lastDate !== yStr) {
      return { current: 0, best: data.best || 0, lastDate: data.lastDate }
    }
    return data
  } catch { return { current: 0, best: 0, lastDate: null } }
}
