import axios from 'axios'

// Free translation API (no API key needed)
const TRANSLATE_API = 'https://translate.googleapis.com/translate_a/single'

// Language name mapping for better UX
const LANGUAGE_NAMES = {
  en: 'English', es: 'Spanish', fr: 'French', de: 'German', it: 'Italian',
  pt: 'Portuguese', ru: 'Russian', ja: 'Japanese', ko: 'Korean', zh: 'Chinese',
  'zh-CN': 'Chinese (Simplified)', 'zh-TW': 'Chinese (Traditional)',
  hi: 'Hindi', bn: 'Bengali', ur: 'Urdu', ta: 'Tamil', te: 'Telugu',
  mr: 'Marathi', gu: 'Gujarati', kn: 'Kannada', ml: 'Malayalam', pa: 'Punjabi',
  si: 'Sinhala', ne: 'Nepali', th: 'Thai', vi: 'Vietnamese', id: 'Indonesian',
  ms: 'Malay', fil: 'Filipino', my: 'Burmese', km: 'Khmer', lo: 'Lao',
  ar: 'Arabic', tr: 'Turkish', fa: 'Persian', he: 'Hebrew', nl: 'Dutch',
  pl: 'Polish', sv: 'Swedish', no: 'Norwegian', da: 'Danish', fi: 'Finnish',
  el: 'Greek', cs: 'Czech', hu: 'Hungarian', ro: 'Romanian', uk: 'Ukrainian',
  bg: 'Bulgarian', hr: 'Croatian', sk: 'Slovak', sl: 'Slovenian', et: 'Estonian',
  lv: 'Latvian', lt: 'Lithuanian', sw: 'Swahili', af: 'Afrikaans', zu: 'Zulu',
  am: 'Amharic', ha: 'Hausa', yo: 'Yoruba', ig: 'Igbo'
}

export async function translateText(text, targetLang) {
  try {
    // Clean input text
    const cleanedText = text.trim().replace(/\s+/g, ' ')
    
    if (!cleanedText) {
      throw new Error('Text cannot be empty')
    }

    // Use Google Translate free API with auto-detection
    const response = await axios.get(TRANSLATE_API, {
      params: {
        client: 'gtx',
        sl: 'auto', // Auto-detect source language
        tl: targetLang,
        dt: 't', // Translation
        q: cleanedText
      }
    })

    // Extract translated text from response
    const translatedText = response.data[0]
      .map(item => item[0])
      .join('')

    // Extract detected source language
    // Google Translate API returns detected language in data[2]
    const detectedLang = response.data[2] || 'unknown'
    const detectedLangName = LANGUAGE_NAMES[detectedLang] || detectedLang.toUpperCase()

    console.log(`Translation: ${detectedLang} → ${targetLang}`)

    return {
      translatedText,
      detectedLang,
      detectedLangName,
      targetLang,
      originalText: cleanedText
    }
  } catch (error) {
    console.error('Translation error:', error)
    throw new Error('Translation failed')
  }
}

// Check if language is supported
export function isSupportedLanguage(langCode) {
  return Object.keys(LANGUAGE_NAMES).includes(langCode)
}

// Get language name
export function getLanguageName(langCode) {
  return LANGUAGE_NAMES[langCode] || langCode.toUpperCase()
}
