import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, signInWithPopup, signOut as fbSignOut, updateProfile } from 'firebase/auth'
import { auth, provider } from '../firebase'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser]           = useState(undefined)
  const [loading, setLoading]     = useState(true)
  // Custom overrides stored in localStorage
  const [customName, setCustomName]     = useState(() => localStorage.getItem('vortex-custom-name') || '')
  const [customAvatar, setCustomAvatar] = useState(() => localStorage.getItem('vortex-custom-avatar') || '')

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
    return unsub
  }, [])

  const signIn  = () => signInWithPopup(auth, provider)
  const signOut = () => {
    localStorage.removeItem('vortex-custom-name')
    localStorage.removeItem('vortex-custom-avatar')
    setCustomName('')
    setCustomAvatar('')
    return fbSignOut(auth)
  }

  // Update display name (Firebase + localStorage)
  const updateDisplayName = async (name) => {
    if (user) await updateProfile(user, { displayName: name })
    setCustomName(name)
    localStorage.setItem('vortex-custom-name', name)
  }

  // Update avatar (base64 stored in localStorage)
  const updateAvatar = (base64) => {
    setCustomAvatar(base64)
    localStorage.setItem('vortex-custom-avatar', base64)
  }

  // Resolved values — custom overrides take priority
  const displayName  = customName  || user?.displayName  || 'User'
  const avatarUrl    = customAvatar || user?.photoURL     || null
  const userId       = user?.uid || getDeviceId()

  return (
    <AuthContext.Provider value={{
      user, loading, signIn, signOut, userId,
      displayName, avatarUrl,
      updateDisplayName, updateAvatar,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

function getDeviceId() {
  let id = localStorage.getItem('vortex-device-id')
  if (!id) {
    id = 'dev_' + Math.random().toString(36).slice(2) + Date.now().toString(36)
    localStorage.setItem('vortex-device-id', id)
  }
  return id
}
