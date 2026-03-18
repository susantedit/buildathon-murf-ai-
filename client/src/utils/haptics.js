// Haptic feedback utilities for mobile devices

export function vibrateLight() {
  if ('vibrate' in navigator) {
    navigator.vibrate(50)
  }
}

export function vibrateMedium() {
  if ('vibrate' in navigator) {
    navigator.vibrate(100)
  }
}

export function vibrateHeavy() {
  if ('vibrate' in navigator) {
    navigator.vibrate(200)
  }
}

export function vibratePattern(pattern) {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern)
  }
}

export function vibrateSuccess() {
  if ('vibrate' in navigator) {
    navigator.vibrate([100, 50, 100])
  }
}

export function vibrateError() {
  if ('vibrate' in navigator) {
    navigator.vibrate([200, 100, 200])
  }
}

export function vibrateEmergency() {
  if ('vibrate' in navigator) {
    // Long, urgent pattern
    navigator.vibrate([300, 100, 300, 100, 300])
  }
}

export function vibrateBreath(type = 'in') {
  if ('vibrate' in navigator) {
    if (type === 'in') {
      // Gentle increasing pattern
      navigator.vibrate([50, 50, 100, 50, 150])
    } else if (type === 'out') {
      // Gentle decreasing pattern
      navigator.vibrate([150, 50, 100, 50, 50])
    } else {
      // Hold - steady
      navigator.vibrate(100)
    }
  }
}
