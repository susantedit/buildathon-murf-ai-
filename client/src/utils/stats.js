// Session stats tracker — words generated, audio minutes, mode counts
const KEY = 'vortex-stats'

export function recordSession({ mode, wordCount = 0, audioDuration = 0 }) {
  const s = getStats()
  s.totalSessions = (s.totalSessions || 0) + 1
  s.totalWords = (s.totalWords || 0) + wordCount
  s.totalAudioSeconds = (s.totalAudioSeconds || 0) + audioDuration
  s.modes = s.modes || {}
  s.modes[mode] = (s.modes[mode] || 0) + 1
  localStorage.setItem(KEY, JSON.stringify(s))
  return s
}

export function getStats() {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}') } catch { return {} }
}

export function getMostUsedMode(modes = {}) {
  if (!Object.keys(modes).length) return null
  return Object.entries(modes).sort((a, b) => b[1] - a[1])[0][0]
}
