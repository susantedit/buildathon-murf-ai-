import { io } from 'socket.io-client'

const SERVER_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export const socket = io(SERVER_URL, {
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
})

/**
 * Listen for incoming voice-note events.
 * @param {(data: object) => void} callback - Called with the event payload.
 */
export function onVoiceNote(callback) {
  socket.on('voice-note', callback)
}

/**
 * Remove a previously registered voice-note listener.
 * @param {(data: object) => void} callback - The same function reference passed to onVoiceNote.
 */
export function offVoiceNote(callback) {
  socket.off('voice-note', callback)
}
