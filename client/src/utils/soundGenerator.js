// Generate breathing sounds using Web Audio API
export function playBreathSound(type = 'in') {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)()
  const oscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()

  oscillator.connect(gainNode)
  gainNode.connect(audioContext.destination)

  if (type === 'in') {
    // Breathe in - rising tone
    oscillator.frequency.setValueAtTime(200, audioContext.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 4)
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.3, audioContext.currentTime + 4)
  } else if (type === 'out') {
    // Breathe out - falling tone
    oscillator.frequency.setValueAtTime(400, audioContext.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 4)
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.1, audioContext.currentTime + 4)
  } else {
    // Hold - steady low tone
    oscillator.frequency.setValueAtTime(250, audioContext.currentTime)
    gainNode.gain.setValueAtTime(0.15, audioContext.currentTime)
  }

  oscillator.type = 'sine'
  oscillator.start(audioContext.currentTime)
  oscillator.stop(audioContext.currentTime + 4)

  return () => {
    try {
      oscillator.stop()
      audioContext.close()
    } catch (e) {
      // Already stopped
    }
  }
}

export function playTimerSound() {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)()
  const oscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()

  oscillator.connect(gainNode)
  gainNode.connect(audioContext.destination)

  oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
  oscillator.type = 'sine'
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)

  oscillator.start(audioContext.currentTime)
  oscillator.stop(audioContext.currentTime + 0.5)
}

export function playCompletionSound() {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)()
  
  // Play three ascending tones
  const frequencies = [523.25, 659.25, 783.99] // C, E, G
  
  frequencies.forEach((freq, i) => {
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    oscillator.frequency.setValueAtTime(freq, audioContext.currentTime + i * 0.15)
    oscillator.type = 'sine'
    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime + i * 0.15)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + i * 0.15 + 0.3)
    
    oscillator.start(audioContext.currentTime + i * 0.15)
    oscillator.stop(audioContext.currentTime + i * 0.15 + 0.3)
  })
}

// UI Feedback Sounds
export function playClickSound() {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)()
  const oscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()

  oscillator.connect(gainNode)
  gainNode.connect(audioContext.destination)

  oscillator.frequency.setValueAtTime(600, audioContext.currentTime)
  oscillator.type = 'sine'
  gainNode.gain.setValueAtTime(0.15, audioContext.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)

  oscillator.start(audioContext.currentTime)
  oscillator.stop(audioContext.currentTime + 0.1)
}

export function playHoverSound() {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)()
  const oscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()

  oscillator.connect(gainNode)
  gainNode.connect(audioContext.destination)

  oscillator.frequency.setValueAtTime(400, audioContext.currentTime)
  oscillator.type = 'sine'
  gainNode.gain.setValueAtTime(0.08, audioContext.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05)

  oscillator.start(audioContext.currentTime)
  oscillator.stop(audioContext.currentTime + 0.05)
}

export function playWhooshSound() {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)()
  const oscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()

  oscillator.connect(gainNode)
  gainNode.connect(audioContext.destination)

  oscillator.frequency.setValueAtTime(200, audioContext.currentTime)
  oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.3)
  oscillator.type = 'sine'
  gainNode.gain.setValueAtTime(0.2, audioContext.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)

  oscillator.start(audioContext.currentTime)
  oscillator.stop(audioContext.currentTime + 0.3)
}

export function playSuccessSound() {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)()
  
  // Two-tone success chime
  const frequencies = [659.25, 783.99] // E, G
  
  frequencies.forEach((freq, i) => {
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    oscillator.frequency.setValueAtTime(freq, audioContext.currentTime + i * 0.1)
    oscillator.type = 'sine'
    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime + i * 0.1)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + i * 0.1 + 0.4)
    
    oscillator.start(audioContext.currentTime + i * 0.1)
    oscillator.stop(audioContext.currentTime + i * 0.1 + 0.4)
  })
}

export function playErrorSound() {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)()
  const oscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()

  oscillator.connect(gainNode)
  gainNode.connect(audioContext.destination)

  oscillator.frequency.setValueAtTime(300, audioContext.currentTime)
  oscillator.frequency.exponentialRampToValueAtTime(150, audioContext.currentTime + 0.2)
  oscillator.type = 'sawtooth'
  gainNode.gain.setValueAtTime(0.15, audioContext.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)

  oscillator.start(audioContext.currentTime)
  oscillator.stop(audioContext.currentTime + 0.2)
}
