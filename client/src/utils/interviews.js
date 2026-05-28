const KEY = 'interview-os-sessions'
const DRAFT_KEY = 'interview-os-draft'

function read(key, fallback) {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function getInterviewSessions() {
  return read(KEY, []).sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0))
}

export function getInterviewSession(id) {
  return getInterviewSessions().find(session => session.id === id || session._id === id) || null
}

export function saveInterviewSession(session) {
  const current = getInterviewSessions().filter(item => (item.id || item._id) !== (session.id || session._id))
  const next = [{
    createdAt: session.createdAt || new Date().toISOString(),
    updatedAt: session.updatedAt || new Date().toISOString(),
    transcript: [],
    status: 'draft',
    score: 0,
    ...session,
    id: session.id || session._id || String(Date.now()),
  }, ...current]
  write(KEY, next)
  return next[0]
}

export function updateInterviewSession(id, patch) {
  const sessions = getInterviewSessions()
  const updated = sessions.map(session => {
    if ((session.id || session._id) !== id) return session
    return { ...session, ...patch, updatedAt: new Date().toISOString() }
  })
  write(KEY, updated)
  return updated.find(session => (session.id || session._id) === id) || null
}

export function deleteInterviewSession(id) {
  const updated = getInterviewSessions().filter(session => (session.id || session._id) !== id)
  write(KEY, updated)
  return updated
}

export function saveInterviewDraft(draft) {
  write(DRAFT_KEY, { ...draft, updatedAt: new Date().toISOString() })
}

export function getInterviewDraft() {
  return read(DRAFT_KEY, null)
}

export function clearInterviewDraft() {
  localStorage.removeItem(DRAFT_KEY)
}