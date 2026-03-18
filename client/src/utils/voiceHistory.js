// Voice history management using localStorage
const HISTORY_KEY = 'vortex-voice-history'
const MAX_HISTORY = 5

export function saveToHistory(item) {
  try {
    const history = getHistory()
    const newItem = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      ...item
    }
    
    // Add to beginning, keep only last 5
    const updated = [newItem, ...history].slice(0, MAX_HISTORY)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated))
    return updated
  } catch (error) {
    console.error('Failed to save to history:', error)
    return []
  }
}

export function getHistory() {
  try {
    const stored = localStorage.getItem(HISTORY_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('Failed to get history:', error)
    return []
  }
}

export function clearHistory() {
  try {
    localStorage.removeItem(HISTORY_KEY)
    return []
  } catch (error) {
    console.error('Failed to clear history:', error)
    return []
  }
}

export function deleteHistoryItem(id) {
  try {
    const history = getHistory()
    const updated = history.filter(item => item.id !== id)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated))
    return updated
  } catch (error) {
    console.error('Failed to delete history item:', error)
    return getHistory()
  }
}
