/**
 * Cognitive State Engine — pure function, no side effects
 * Computes a cognitive score from behavioral signals
 *
 * @typedef {{ latencyMs: number, interactionRate: number, mood: string, inputLength: number }} Signals
 * @typedef {{ score: number, label: 'Focus'|'Stressed'|'Confident'|'Neutral', voiceTone: string }} CognitiveScore
 */

/**
 * Compute cognitive score from user behavioral signals.
 * Rules applied in priority order — first match wins.
 *
 * @param {Signals} signals
 * @returns {CognitiveScore}
 */
export function computeCognitiveScore({ latencyMs = 5000, interactionRate = 1, mood = '', inputLength = 0 }) {
  // Rule 1: Fast response + high interaction rate → Focus
  if (latencyMs < 3000 && interactionRate > 2) {
    return { score: 85, label: 'Focus', voiceTone: 'focus' }
  }

  // Rule 2: Stress keywords detected + slow response → Stressed
  if (mood === 'calm' && latencyMs > 8000) {
    return { score: 30, label: 'Stressed', voiceTone: 'calm' }
  }

  // Rule 3: Motivational mood + decent interaction rate → Confident
  if (mood === 'motivational' && interactionRate > 1.5) {
    return { score: 90, label: 'Confident', voiceTone: 'motivational' }
  }

  // Rule 4: Default → Neutral
  return { score: 60, label: 'Neutral', voiceTone: 'supportive' }
}

/**
 * Map cognitive label to a display color
 * @param {'Focus'|'Stressed'|'Confident'|'Neutral'} label
 * @returns {string} hex color
 */
export function cognitiveColor(label) {
  const map = {
    Focus: '#4F8CFF',
    Stressed: '#ef4444',
    Confident: '#10b981',
    Neutral: '#94a3b8',
  }
  return map[label] || '#94a3b8'
}

/**
 * Map cognitive label to a CSS class name
 * @param {'Focus'|'Stressed'|'Confident'|'Neutral'} label
 * @returns {string}
 */
export function cognitiveCssClass(label) {
  const map = {
    Focus: 'cog-focus',
    Stressed: 'cog-stressed',
    Confident: 'cog-confident',
    Neutral: 'cog-neutral',
  }
  return map[label] || 'cog-neutral'
}

/**
 * Map cognitive label to a voice description for display
 * @param {'Focus'|'Stressed'|'Confident'|'Neutral'} label
 * @returns {string}
 */
export function cognitiveVoiceLabel(label) {
  const map = {
    Focus: 'Julia voice · Steady',
    Stressed: 'Natalie voice · Calm',
    Confident: 'Marcus voice · Energetic',
    Neutral: 'Julia voice · Supportive',
  }
  return map[label] || 'Supportive voice'
}
