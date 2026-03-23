// ── Shared AudioContext ───────────────────────────────────────────────────────
let audioContext = null
function ctx() {
  if (!audioContext || audioContext.state === 'closed') {
    audioContext = new (window.AudioContext || window.webkitAudioContext)()
  }
  if (audioContext.state === 'suspended') audioContext.resume()
  return audioContext
}

// ── Reverb helper (convolver with impulse) ────────────────────────────────────
function makeReverb(ac, duration = 0.6, decay = 2) {
  const len = ac.sampleRate * duration
  const buf = ac.createBuffer(2, len, ac.sampleRate)
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c)
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay)
  }
  const conv = ac.createConvolver()
  conv.buffer = buf
  return conv
}

// ── Breathing sounds (Focus page) ────────────────────────────────────────────
export function playBreathSound(type = 'in') {
  try {
    const ac = ctx()
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.connect(gain); gain.connect(ac.destination)
    osc.type = 'sine'
    if (type === 'in') {
      osc.frequency.setValueAtTime(180, ac.currentTime)
      osc.frequency.exponentialRampToValueAtTime(360, ac.currentTime + 4)
      gain.gain.setValueAtTime(0.08, ac.currentTime)
      gain.gain.linearRampToValueAtTime(0.22, ac.currentTime + 4)
    } else if (type === 'out') {
      osc.frequency.setValueAtTime(360, ac.currentTime)
      osc.frequency.exponentialRampToValueAtTime(180, ac.currentTime + 4)
      gain.gain.setValueAtTime(0.22, ac.currentTime)
      gain.gain.linearRampToValueAtTime(0.04, ac.currentTime + 4)
    } else {
      osc.frequency.setValueAtTime(220, ac.currentTime)
      gain.gain.setValueAtTime(0.1, ac.currentTime)
    }
    osc.start(ac.currentTime); osc.stop(ac.currentTime + 4)
    return () => { try { osc.stop() } catch {} }
  } catch { return () => {} }
}

// ── Timer tick ────────────────────────────────────────────────────────────────
export function playTimerSound() {
  try {
    const ac = ctx()
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.connect(gain); gain.connect(ac.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(1200, ac.currentTime)
    gain.gain.setValueAtTime(0.18, ac.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.08)
    osc.start(ac.currentTime); osc.stop(ac.currentTime + 0.08)
  } catch {}
}

// ── Completion — bright ascending arpeggio ────────────────────────────────────
export function playCompletionSound() {
  try {
    const ac = ctx()
    const rev = makeReverb(ac, 0.8, 3)
    rev.connect(ac.destination)
    // C4 E4 G4 C5
    ;[261.63, 329.63, 392, 523.25].forEach((freq, i) => {
      const osc = ac.createOscillator()
      const gain = ac.createGain()
      osc.connect(gain); gain.connect(rev)
      osc.type = 'triangle'
      osc.frequency.value = freq
      const t = ac.currentTime + i * 0.13
      gain.gain.setValueAtTime(0, t)
      gain.gain.linearRampToValueAtTime(0.28, t + 0.04)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5)
      osc.start(t); osc.stop(t + 0.55)
    })
  } catch {}
}

// ── Click — soft wood tap ─────────────────────────────────────────────────────
export function playClickSound() {
  try {
    const ac = ctx()
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.connect(gain); gain.connect(ac.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(900, ac.currentTime)
    osc.frequency.exponentialRampToValueAtTime(400, ac.currentTime + 0.06)
    gain.gain.setValueAtTime(0.12, ac.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.07)
    osc.start(ac.currentTime); osc.stop(ac.currentTime + 0.08)
  } catch {}
}

// ── Hover — barely-there chime ────────────────────────────────────────────────
export function playHoverSound() {
  try {
    const ac = ctx()
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.connect(gain); gain.connect(ac.destination)
    osc.type = 'sine'
    osc.frequency.value = 1800
    gain.gain.setValueAtTime(0.04, ac.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.06)
    osc.start(ac.currentTime); osc.stop(ac.currentTime + 0.07)
  } catch {}
}

// ── Whoosh — page transition ──────────────────────────────────────────────────
export function playWhooshSound() {
  try {
    const ac = ctx()
    const bufSize = ac.sampleRate * 0.25
    const buf = ac.createBuffer(1, bufSize, ac.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufSize)
    const src = ac.createBufferSource()
    src.buffer = buf
    const filter = ac.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.setValueAtTime(400, ac.currentTime)
    filter.frequency.exponentialRampToValueAtTime(2000, ac.currentTime + 0.25)
    filter.Q.value = 0.8
    const gain = ac.createGain()
    gain.gain.setValueAtTime(0.3, ac.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.25)
    src.connect(filter); filter.connect(gain); gain.connect(ac.destination)
    src.start(); src.stop(ac.currentTime + 0.26)
  } catch {}
}

// ── SUCCESS — warm chime chord (major triad + shimmer) ───────────────────────
export function playSuccessSound() {
  try {
    const ac = ctx()
    const rev = makeReverb(ac, 1.2, 2.5)
    rev.connect(ac.destination)
    // G4 B4 D5 G5 — G major
    ;[392, 493.88, 587.33, 783.99].forEach((freq, i) => {
      const osc = ac.createOscillator()
      const gain = ac.createGain()
      osc.connect(gain); gain.connect(rev)
      osc.type = i < 2 ? 'sine' : 'triangle'
      osc.frequency.value = freq
      const t = ac.currentTime + i * 0.06
      gain.gain.setValueAtTime(0, t)
      gain.gain.linearRampToValueAtTime(0.22 - i * 0.03, t + 0.03)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.9)
      osc.start(t); osc.stop(t + 1)
    })
    // Shimmer — high bell
    const bell = ac.createOscillator()
    const bellGain = ac.createGain()
    bell.connect(bellGain); bellGain.connect(rev)
    bell.type = 'sine'
    bell.frequency.value = 1567.98 // G6
    bellGain.gain.setValueAtTime(0.1, ac.currentTime + 0.1)
    bellGain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 1.2)
    bell.start(ac.currentTime + 0.1); bell.stop(ac.currentTime + 1.3)
  } catch {}
}

// ── ERROR — low thud + descending buzz ───────────────────────────────────────
export function playErrorSound() {
  try {
    const ac = ctx()
    // Low thud
    const thud = ac.createOscillator()
    const thudGain = ac.createGain()
    thud.connect(thudGain); thudGain.connect(ac.destination)
    thud.type = 'sine'
    thud.frequency.setValueAtTime(120, ac.currentTime)
    thud.frequency.exponentialRampToValueAtTime(50, ac.currentTime + 0.18)
    thudGain.gain.setValueAtTime(0.35, ac.currentTime)
    thudGain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.22)
    thud.start(ac.currentTime); thud.stop(ac.currentTime + 0.25)
    // Descending buzz
    const buzz = ac.createOscillator()
    const buzzGain = ac.createGain()
    buzz.connect(buzzGain); buzzGain.connect(ac.destination)
    buzz.type = 'sawtooth'
    buzz.frequency.setValueAtTime(280, ac.currentTime + 0.05)
    buzz.frequency.exponentialRampToValueAtTime(140, ac.currentTime + 0.3)
    buzzGain.gain.setValueAtTime(0.12, ac.currentTime + 0.05)
    buzzGain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.32)
    buzz.start(ac.currentTime + 0.05); buzz.stop(ac.currentTime + 0.35)
  } catch {}
}

// ── WIN — full fanfare (used after riddle solved / quiz perfect) ──────────────
export function playWinSound() {
  try {
    const ac = ctx()
    const rev = makeReverb(ac, 1.5, 2)
    rev.connect(ac.destination)
    // Fanfare: C E G C E G C (ascending)
    const notes = [261.63, 329.63, 392, 523.25, 659.25, 783.99, 1046.5]
    notes.forEach((freq, i) => {
      const osc = ac.createOscillator()
      const gain = ac.createGain()
      osc.connect(gain); gain.connect(rev)
      osc.type = i % 2 === 0 ? 'triangle' : 'sine'
      osc.frequency.value = freq
      const t = ac.currentTime + i * 0.1
      gain.gain.setValueAtTime(0, t)
      gain.gain.linearRampToValueAtTime(0.25 - i * 0.02, t + 0.04)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55)
      osc.start(t); osc.stop(t + 0.6)
    })
  } catch {}
}

// ── WRONG ANSWER — game-show buzzer ──────────────────────────────────────────
export function playBuzzerSound() {
  try {
    const ac = ctx()
    // Three short descending blips
    ;[400, 320, 240].forEach((freq, i) => {
      const osc = ac.createOscillator()
      const gain = ac.createGain()
      osc.connect(gain); gain.connect(ac.destination)
      osc.type = 'square'
      osc.frequency.value = freq
      const t = ac.currentTime + i * 0.12
      gain.gain.setValueAtTime(0.18, t)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1)
      osc.start(t); osc.stop(t + 0.12)
    })
  } catch {}
}

// ── COIN / POINT — retro collect ─────────────────────────────────────────────
export function playCoinSound() {
  try {
    const ac = ctx()
    ;[988, 1319].forEach((freq, i) => {
      const osc = ac.createOscillator()
      const gain = ac.createGain()
      osc.connect(gain); gain.connect(ac.destination)
      osc.type = 'square'
      osc.frequency.value = freq
      const t = ac.currentTime + i * 0.08
      gain.gain.setValueAtTime(0.15, t)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15)
      osc.start(t); osc.stop(t + 0.18)
    })
  } catch {}
}

// ── LEVEL UP — ascending sweep ────────────────────────────────────────────────
export function playLevelUpSound() {
  try {
    const ac = ctx()
    const rev = makeReverb(ac, 0.6, 3)
    rev.connect(ac.destination)
    ;[523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((freq, i) => {
      const osc = ac.createOscillator()
      const gain = ac.createGain()
      osc.connect(gain); gain.connect(rev)
      osc.type = 'sine'
      osc.frequency.value = freq
      const t = ac.currentTime + i * 0.09
      gain.gain.setValueAtTime(0.2, t)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4)
      osc.start(t); osc.stop(t + 0.45)
    })
  } catch {}
}
