// Detect mood from user input text
export function detectMood(text) {
  const lowerText = text.toLowerCase()

  // Stress/Anxiety keywords → Calm
  const stressKeywords = ['stress', 'anxious', 'worried', 'nervous', 'overwhelm', 'panic', 'scared', 'afraid', 'tired', 'exhausted']
  if (stressKeywords.some(word => lowerText.includes(word))) {
    return 'calm'
  }

  // Motivation/Energy keywords → Motivational
  const motivationKeywords = ['crush', 'achieve', 'goal', 'win', 'success', 'hustle', 'grind', 'push', 'never give up', 'keep going', 'motivation']
  if (motivationKeywords.some(word => lowerText.includes(word))) {
    return 'motivational'
  }

  // Story/Narrative keywords → Storytelling
  const storyKeywords = ['story', 'once upon', 'tale', 'journey', 'adventure', 'experience', 'happened', 'remember when']
  if (storyKeywords.some(word => lowerText.includes(word))) {
    return 'storytelling'
  }

  // Business/Professional keywords → Serious
  const professionalKeywords = ['business', 'professional', 'corporate', 'meeting', 'presentation', 'report', 'analysis', 'strategy']
  if (professionalKeywords.some(word => lowerText.includes(word))) {
    return 'serious'
  }

  // Default to motivational for general content
  return 'motivational'
}
