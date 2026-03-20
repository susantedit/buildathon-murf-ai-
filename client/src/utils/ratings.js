// Response rating storage
const KEY = 'vortex-ratings'

export function saveRating(sessionId, rating) {
  const all = getRatings()
  all[sessionId] = { rating, ts: Date.now() }
  localStorage.setItem(KEY, JSON.stringify(all))
}

export function getRating(sessionId) {
  return getRatings()[sessionId]?.rating || null
}

export function getRatings() {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}') } catch { return {} }
}

export function getRatingStats() {
  const all = Object.values(getRatings())
  const thumbsUp = all.filter(r => r.rating === 'up').length
  const thumbsDown = all.filter(r => r.rating === 'down').length
  return { thumbsUp, thumbsDown, total: all.length }
}
