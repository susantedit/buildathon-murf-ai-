import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Languages, Copy, ArrowLeftRight, Mic, MicOff, Search, X } from 'lucide-react'
import toast from 'react-hot-toast'
import WaveformPlayer from '../components/WaveformPlayer'
import VoiceMicButton from '../components/VoiceMicButton'
import { PageHeader } from '../components/UI'
import QuoteBar from '../components/QuoteBar'
import { api } from '../services/api'
import { playClickSound, playSuccessSound } from '../utils/soundGenerator'

const languages = [
  { code: 'ne',    name: 'Nepali',              flag: '🇳🇵', region: 'nepal' },
  { code: 'mai',   name: 'Maithili',             flag: '🇳🇵', region: 'nepal', fallback: 'ne' },
  { code: 'bho',   name: 'Bhojpuri',             flag: '🇳🇵', region: 'nepal', fallback: 'ne' },
  { code: 'new',   name: 'Newari (Nepal Bhasa)', flag: '🇳🇵', region: 'nepal', fallback: 'ne' },
  { code: 'tharu', name: 'Tharu',                flag: '🇳🇵', region: 'nepal', fallback: 'ne' },
  { code: 'tam',   name: 'Tamang',               flag: '🇳🇵', region: 'nepal', fallback: 'ne' },
  { code: 'hi',    name: 'Hindi',      flag: '🇮🇳' },
  { code: 'bn',    name: 'Bengali',    flag: '🇧🇩' },
  { code: 'ur',    name: 'Urdu',       flag: '🇵🇰' },
  { code: 'ta',    name: 'Tamil',      flag: '🇮🇳' },
  { code: 'te',    name: 'Telugu',     flag: '🇮🇳' },
  { code: 'mr',    name: 'Marathi',    flag: '🇮🇳' },
  { code: 'gu',    name: 'Gujarati',   flag: '🇮🇳' },
  { code: 'kn',    name: 'Kannada',    flag: '🇮🇳' },
  { code: 'ml',    name: 'Malayalam',  flag: '🇮🇳' },
  { code: 'pa',    name: 'Punjabi',    flag: '🇮🇳' },
  { code: 'si',    name: 'Sinhala',    flag: '🇱🇰' },
  { code: 'en',    name: 'English',    flag: '🇺🇸' },
  { code: 'es',    name: 'Spanish',    flag: '🇪🇸' },
  { code: 'fr',    name: 'French',     flag: '🇫🇷' },
  { code: 'de',    name: 'German',     flag: '🇩🇪' },
  { code: 'it',    name: 'Italian',    flag: '🇮🇹' },
  { code: 'pt',    name: 'Portuguese', flag: '🇧🇷' },
  { code: 'ru',    name: 'Russian',    flag: '🇷🇺' },
  { code: 'ja',    name: 'Japanese',   flag: '🇯🇵' },
  { code: 'ko',    name: 'Korean',     flag: '🇰🇷' },
  { code: 'zh-CN', name: 'Chinese (Simplified)',  flag: '🇨🇳' },
  { code: 'zh-TW', name: 'Chinese (Traditional)', flag: '🇹🇼' },
  { code: 'ar',    name: 'Arabic',     flag: '🇸🇦' },
  { code: 'tr',    name: 'Turkish',    flag: '🇹🇷' },
  { code: 'fa',    name: 'Persian',    flag: '🇮🇷' },
  { code: 'he',    name: 'Hebrew',     flag: '🇮🇱' },
  { code: 'th',    name: 'Thai',       flag: '🇹🇭' },
  { code: 'vi',    name: 'Vietnamese', flag: '🇻🇳' },
  { code: 'id',    name: 'Indonesian', flag: '🇮🇩' },
  { code: 'ms',    name: 'Malay',      flag: '🇲🇾' },
  { code: 'fil',   name: 'Filipino',   flag: '🇵🇭' },
  { code: 'my',    name: 'Burmese',    flag: '🇲🇲' },
  { code: 'km',    name: 'Khmer',      flag: '🇰🇭' },
  { code: 'lo',    name: 'Lao',        flag: '🇱🇦' },
  { code: 'nl',    name: 'Dutch',      flag: '🇳🇱' },
  { code: 'pl',    name: 'Polish',     flag: '🇵🇱' },
  { code: 'sv',    name: 'Swedish',    flag: '🇸🇪' },
  { code: 'no',    name: 'Norwegian',  flag: '🇳🇴' },
  { code: 'da',    name: 'Danish',     flag: '🇩🇰' },
  { code: 'fi',    name: 'Finnish',    flag: '🇫🇮' },
  { code: 'el',    name: 'Greek',      flag: '🇬🇷' },
  { code: 'cs',    name: 'Czech',      flag: '🇨🇿' },
  { code: 'hu',    name: 'Hungarian',  flag: '🇭🇺' },
  { code: 'ro',    name: 'Romanian',   flag: '🇷🇴' },
  { code: 'uk',    name: 'Ukrainian',  flag: '🇺🇦' },
  { code: 'bg',    name: 'Bulgarian',  flag: '🇧🇬' },
  { code: 'hr',    name: 'Croatian',   flag: '🇭🇷' },
  { code: 'sk',    name: 'Slovak',     flag: '🇸🇰' },
  { code: 'sl',    name: 'Slovenian',  flag: '🇸🇮' },
  { code: 'et',    name: 'Estonian',   flag: '🇪🇪' },
  { code: 'lv',    name: 'Latvian',    flag: '🇱🇻' },
  { code: 'lt',    name: 'Lithuanian', flag: '🇱🇹' },
  { code: 'sr',    name: 'Serbian',    flag: '🇷🇸' },
  { code: 'sq',    name: 'Albanian',   flag: '🇦🇱' },
  { code: 'mk',    name: 'Macedonian', flag: '🇲🇰' },
  { code: 'bs',    name: 'Bosnian',    flag: '🇧🇦' },
  { code: 'az',    name: 'Azerbaijani',flag: '🇦🇿' },
  { code: 'ka',    name: 'Georgian',   flag: '🇬🇪' },
  { code: 'hy',    name: 'Armenian',   flag: '🇦🇲' },
  { code: 'kk',    name: 'Kazakh',     flag: '🇰🇿' },
  { code: 'uz',    name: 'Uzbek',      flag: '🇺🇿' },
  { code: 'mn',    name: 'Mongolian',  flag: '🇲🇳' },
  { code: 'cy',    name: 'Welsh',      flag: '🏴' },
  { code: 'ga',    name: 'Irish',      flag: '🇮🇪' },
  { code: 'is',    name: 'Icelandic',  flag: '🇮🇸' },
  { code: 'mt',    name: 'Maltese',    flag: '🇲🇹' },
  { code: 'sw',    name: 'Swahili',    flag: '🇰🇪' },
  { code: 'af',    name: 'Afrikaans',  flag: '🇿🇦' },
  { code: 'zu',    name: 'Zulu',       flag: '🇿🇦' },
  { code: 'am',    name: 'Amharic',    flag: '🇪🇹' },
  { code: 'ha',    name: 'Hausa',      flag: '🇳🇬' },
  { code: 'yo',    name: 'Yoruba',     flag: '🇳🇬' },
  { code: 'ig',    name: 'Igbo',       flag: '🇳🇬' },
  { code: 'es-MX', name: 'Spanish (Mexico)',    flag: '🇲🇽' },
  { code: 'es-AR', name: 'Spanish (Argentina)', flag: '🇦🇷' },
]

const MIC_LANG_MAP = {
  ne: 'ne-NP', hi: 'hi-IN', bn: 'bn-IN', ta: 'ta-IN', te: 'te-IN',
  mr: 'mr-IN', gu: 'gu-IN', kn: 'kn-IN', ml: 'ml-IN', pa: 'pa-IN',
  ur: 'ur-PK', si: 'si-LK', th: 'th-TH', vi: 'vi-VN', id: 'id-ID',
  ms: 'ms-MY', ar: 'ar-SA', tr: 'tr-TR', fa: 'fa-IR', he: 'he-IL',
  ru: 'ru-RU', ja: 'ja-JP', ko: 'ko-KR', 'zh-CN': 'zh-CN', 'zh-TW': 'zh-TW',
  fr: 'fr-FR', de: 'de-DE', es: 'es-ES', it: 'it-IT', pt: 'pt-BR',
  mai: 'ne-NP', bho: 'hi-IN', new: 'ne-NP', tharu: 'hi-IN', tam: 'ne-NP',
}

export default function Translator() {
  const [input, setInput]               = useState('')
  const [sourceLang, setSourceLang]     = useState('auto')
  const [targetLang, setTargetLang]     = useState('es')
  const [loading, setLoading]           = useState(false)
  const [result, setResult]             = useState(null)
  const [detectedLang, setDetectedLang] = useState(null)
  const [detectedLangName, setDetectedLangName] = useState(null)
  const [srcSearch, setSrcSearch]       = useState('')
  const [tgtSearch, setTgtSearch]       = useState('')
  const [listening, setListening]       = useState(false)
  const [nepalMode, setNepalMode]       = useState(false)
  const [activeTab, setActiveTab]       = useState('translate') // translate | convo
  const [convoLangA, setConvoLangA]     = useState('en')
  const [convoLangB, setConvoLangB]     = useState('ne')
  const [convoMessages, setConvoMessages] = useState([])
  const [convoListening, setConvoListening] = useState(null) // null | 'A' | 'B'
  const recognitionRef = useRef(null)
  const convoRecRef = useRef(null)

  const selectedLang   = languages.find(l => l.code === targetLang)
  const selectedSource = languages.find(l => l.code === sourceLang)
  const isLocalDialect = selectedLang?.fallback != null

  const srcFiltered = languages.filter(l =>
    l.name.toLowerCase().includes(srcSearch.toLowerCase()) ||
    l.code.toLowerCase().includes(srcSearch.toLowerCase())
  )

  const tgtFiltered = languages
    .filter(l =>
      l.name.toLowerCase().includes(tgtSearch.toLowerCase()) ||
      l.code.toLowerCase().includes(tgtSearch.toLowerCase())
    )
    .sort((a, b) => {
      if (!nepalMode) return 0
      if (a.region === 'nepal' && b.region !== 'nepal') return -1
      if (b.region === 'nepal' && a.region !== 'nepal') return 1
      return 0
    })

  const displayFrom = sourceLang === 'auto'
    ? (detectedLang
        ? (languages.find(l => l.code === detectedLang) || { flag: '🌐', name: detectedLangName })
        : { flag: '🌐', name: 'Auto Detect' })
    : selectedSource

  // ── MIC ──
  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return toast.error('Speech recognition not supported in this browser')
    const recognition = new SR()
    recognitionRef.current = recognition
    recognition.lang = sourceLang !== 'auto'
      ? (MIC_LANG_MAP[sourceLang] || 'en-US')
      : (MIC_LANG_MAP[targetLang] || 'en-US')
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    recognition.start()
    setListening(true)
    toast('🎤 Listening... speak now')
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript
      setInput(transcript)
      setListening(false)
      toast.success('Got it! Translating...')
      setTimeout(() => doTranslate(transcript), 300)
    }
    recognition.onerror = (e) => {
      setListening(false)
      if (e.error === 'no-speech') toast.error('No speech detected')
      else if (e.error === 'not-allowed') toast.error('Mic permission denied')
      else toast.error('Mic error: ' + e.error)
    }
    recognition.onend = () => setListening(false)
  }

  const stopListening = () => { recognitionRef.current?.stop(); setListening(false) }

  // ── TRANSLATE ──
  const doTranslate = async (textOverride) => {
    const text = textOverride || input
    if (!text.trim()) return toast.error('Enter or speak text to translate')
    setLoading(true)
    setResult(null)
    setDetectedLang(null)
    setDetectedLangName(null)
    try {
      if (isLocalDialect) toast(`Using approximate translation via Nepali for ${selectedLang.name}`, { icon: '⚠️' })
      const data = await api.translateText(text, targetLang)
      setResult(data)
      setDetectedLang(data.detectedLang)
      setDetectedLangName(data.detectedLangName)
      playSuccessSound()
      toast.success('Translated from ' + data.detectedLangName + '!')
    } catch {
      toast.error('Translation failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── SWAP ──
  const swapLanguages = () => {
    playClickSound()
    if (result?.translatedText) {
      setInput(result.translatedText)
      const newTarget = detectedLang || (sourceLang !== 'auto' ? sourceLang : targetLang)
      setSourceLang(targetLang)
      setTargetLang(newTarget)
      setResult(null)
      setDetectedLang(null)
      setDetectedLangName(null)
      toast.success('Languages swapped!')
    } else if (sourceLang !== 'auto') {
      const prev = sourceLang
      setSourceLang(targetLang)
      setTargetLang(prev)
      toast.success('Languages swapped!')
    } else {
      toast('Translate first to swap with auto-detect')
    }
  }

  const copyTranslation = () => {
    if (!result?.translatedText) return
    navigator.clipboard.writeText(result.translatedText)
    playClickSound()
    toast.success('Copied!')
  }

  // ── Conversation Mode ──
  const startConvoListen = (speaker) => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return toast.error('Speech recognition not supported')
    const langCode = speaker === 'A' ? convoLangA : convoLangB
    const rec = new SR()
    convoRecRef.current = rec
    rec.lang = MIC_LANG_MAP[langCode] || 'en-US'
    rec.interimResults = false
    rec.start()
    setConvoListening(speaker)
    rec.onresult = async (e) => {
      setConvoListening(null)
      const spoken = e.results[0][0].transcript
      const targetCode = speaker === 'A' ? convoLangB : convoLangA
      const langAInfo = languages.find(l => l.code === convoLangA)
      const langBInfo = languages.find(l => l.code === convoLangB)
      // Add original message
      setConvoMessages(m => [...m, { speaker, text: spoken, translated: null, loading: true }])
      try {
        const data = await api.translateText(spoken, targetCode)
        setConvoMessages(m => m.map((msg, i) => i === m.length - 1 ? { ...msg, translated: data.translatedText, loading: false } : msg))
        // Speak translation
        if (window.speechSynthesis) {
          window.speechSynthesis.cancel()
          const u = new SpeechSynthesisUtterance(data.translatedText)
          u.lang = MIC_LANG_MAP[targetCode] || 'en-US'
          window.speechSynthesis.speak(u)
        }
      } catch {
        setConvoMessages(m => m.map((msg, i) => i === m.length - 1 ? { ...msg, translated: '(translation failed)', loading: false } : msg))
      }
    }
    rec.onerror = () => setConvoListening(null)
    rec.onend = () => setConvoListening(null)
  }

  return (
    <div className="page-wrapper" style={{ '--page-accent': '#10b981' }}>
      <div className="page-content">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <PageHeader icon={Languages} color="#10b981" title="Voice Translator"
            sub={'Speak or type · ' + languages.length + '+ languages · Auto-detect'} />
          <QuoteBar section="translator" color="#10b981" />

          {/* Tab switcher */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 16, background: 'var(--glass)', borderRadius: 12, padding: 4, border: '1px solid var(--border)' }}>
            {[['translate','🌍 Translate'],['convo','🗣️ Conversation']].map(([t,l]) => (
              <button key={t} onClick={() => { setActiveTab(t); playClickSound() }}
                style={{ flex: 1, padding: '8px', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                  background: activeTab === t ? 'linear-gradient(135deg,#10b981,#3b82f6)' : 'transparent',
                  color: activeTab === t ? '#fff' : 'var(--text2)' }}>
                {l}
              </button>
            ))}
          </div>

          {/* ── Conversation Mode ── */}
          {activeTab === 'convo' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="card" style={{ padding: 16, marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text1)', marginBottom: 12 }}>Two-person live translation</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                  {[['A', convoLangA, setConvoLangA, '#3b82f6'], ['B', convoLangB, setConvoLangB, '#10b981']].map(([speaker, lang, setLang, color]) => {
                    const info = languages.find(l => l.code === lang)
                    return (
                      <div key={speaker}>
                        <div style={{ fontSize: 11, fontWeight: 700, color, marginBottom: 6 }}>Person {speaker}</div>
                        <select value={lang} onChange={e => setLang(e.target.value)}
                          style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: `1px solid ${color}40`, background: 'var(--glass)', color: 'var(--text1)', fontSize: 12, cursor: 'pointer' }}>
                          {languages.map(l => <option key={l.code} value={l.code}>{l.flag} {l.name}</option>)}
                        </select>
                      </div>
                    )
                  })}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[['A','#3b82f6'],['B','#10b981']].map(([speaker, color]) => {
                    const isListening = convoListening === speaker
                    const info = languages.find(l => l.code === (speaker === 'A' ? convoLangA : convoLangB))
                    return (
                      <motion.button key={speaker} whileTap={{ scale: 0.95 }}
                        onClick={() => isListening ? (convoRecRef.current?.stop()) : startConvoListen(speaker)}
                        style={{ padding: '16px 8px', borderRadius: 12, border: `2px solid ${isListening ? color : color + '40'}`,
                          background: isListening ? color + '20' : 'var(--glass)', cursor: 'pointer', textAlign: 'center' }}>
                        <div style={{ fontSize: 20, marginBottom: 6 }}>{info?.flag || '🌐'}</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color }}>{info?.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>
                          {isListening ? (
                            <motion.span animate={{ opacity: [1,0.3,1] }} transition={{ repeat: Infinity, duration: 0.8 }}>
                              🎤 Listening...
                            </motion.span>
                          ) : `Tap to speak`}
                        </div>
                      </motion.button>
                    )
                  })}
                </div>
              </div>

              {/* Conversation messages */}
              {convoMessages.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
                  {convoMessages.map((msg, i) => {
                    const isA = msg.speaker === 'A'
                    const color = isA ? '#3b82f6' : '#10b981'
                    const info = languages.find(l => l.code === (isA ? convoLangA : convoLangB))
                    const targetInfo = languages.find(l => l.code === (isA ? convoLangB : convoLangA))
                    return (
                      <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        style={{ display: 'flex', justifyContent: isA ? 'flex-start' : 'flex-end' }}>
                        <div style={{ maxWidth: '85%' }}>
                          <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 3, textAlign: isA ? 'left' : 'right' }}>
                            Person {msg.speaker} · {info?.flag} {info?.name}
                          </div>
                          <div style={{ padding: '10px 14px', borderRadius: isA ? '4px 16px 16px 16px' : '16px 4px 16px 16px',
                            background: color + '15', border: `1px solid ${color}30`, marginBottom: 4 }}>
                            <div style={{ fontSize: 13, color: 'var(--text1)', lineHeight: 1.5 }}>{msg.text}</div>
                          </div>
                          {msg.loading ? (
                            <div style={{ fontSize: 11, color: 'var(--text3)', padding: '4px 8px' }}>Translating...</div>
                          ) : msg.translated && (
                            <div style={{ padding: '8px 12px', borderRadius: 8, background: 'var(--glass)', border: '1px solid var(--border)' }}>
                              <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 2 }}>{targetInfo?.flag} {targetInfo?.name}</div>
                              <div style={{ fontSize: 13, color: 'var(--text1)', lineHeight: 1.5 }}>{msg.translated}</div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
              {convoMessages.length > 0 && (
                <button onClick={() => setConvoMessages([])}
                  style={{ fontSize: 12, padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--glass)', color: 'var(--text3)', cursor: 'pointer' }}>
                  Clear conversation
                </button>
              )}
            </motion.div>
          )}

          {activeTab === 'translate' && (<>
          <div className="card" style={{ padding: 20, marginBottom: 12 }}>

            {/* FROM -> TO BAR */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 40px 1fr',
              alignItems: 'center', gap: 8, marginBottom: 16,
              padding: '12px 14px', borderRadius: 12,
              background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>From</div>
                <div style={{ padding: '5px 10px', borderRadius: 20, background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.3)', fontSize: 12, fontWeight: 700, color: '#3b82f6', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <span>{displayFrom?.flag || '🌐'}</span>
                  <span>{displayFrom?.name || 'Auto Detect'}</span>
                  {sourceLang === 'auto' && detectedLang && <span style={{ fontSize: 9, opacity: 0.7 }}>(detected)</span>}
                </div>
              </div>
              <button onClick={swapLanguages} title="Swap languages" style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid var(--border)', background: 'var(--glass)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', margin: '0 auto' }}>
                <ArrowLeftRight size={14} color="var(--text2)" />
              </button>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>To</div>
                <div style={{ padding: '5px 10px', borderRadius: 20, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', fontSize: 12, fontWeight: 700, color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <span>{selectedLang?.flag}</span>
                  <span>{selectedLang?.name}</span>
                </div>
              </div>
            </div>

            {/* Nepal Mode toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text1)' }}>Input text</label>
                <VoiceMicButton onResult={val => { setInput(val); setTimeout(() => doTranslate(val), 300) }} />
              </div>
              <button
                onClick={() => { setNepalMode(m => !m); playClickSound() }}
                style={{ padding: '4px 10px', borderRadius: 20, border: '1px solid ' + (nepalMode ? 'rgba(239,68,68,0.4)' : 'var(--border)'), background: nepalMode ? 'rgba(239,68,68,0.12)' : 'var(--glass)', color: nepalMode ? '#ef4444' : 'var(--text2)', fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                {'🇳🇵 Nepal Mode ' + (nepalMode ? 'ON' : 'OFF')}
              </button>
            </div>

            {/* Text input + mic */}
            <div style={{ position: 'relative', marginBottom: 16 }}>
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Type or speak in any language..."
                rows={4}
                className="inp"
                style={{ paddingRight: 52 }}
              />
              <button
                onClick={listening ? stopListening : startListening}
                style={{ position: 'absolute', right: 10, bottom: 10, width: 36, height: 36, borderRadius: '50%', border: '2px solid ' + (listening ? '#ef4444' : 'rgba(16,185,129,0.4)'), background: listening ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                {listening ? <MicOff size={16} color="#ef4444" /> : <Mic size={16} color="#10b981" />}
              </button>
            </div>

            {/* SOURCE LANGUAGE (FROM) */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#3b82f6', marginBottom: 8 }}>🌐 From language</div>
              <div style={{ position: 'relative', marginBottom: 8 }}>
                <Search size={13} color="var(--text3)" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Search source language..."
                  value={srcSearch}
                  onChange={e => setSrcSearch(e.target.value)}
                  className="inp"
                  style={{ paddingLeft: 30, fontSize: 12 }}
                />
                {srcSearch && (
                  <button onClick={() => setSrcSearch('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    <X size={13} color="var(--text3)" />
                  </button>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 6, maxHeight: 180, overflowY: 'auto', padding: 2 }}>
                {!srcSearch && (
                  <button
                    onClick={() => { setSourceLang('auto'); playClickSound() }}
                    className="card"
                    style={{ padding: '8px 6px', textAlign: 'center', cursor: 'pointer', background: sourceLang === 'auto' ? 'rgba(59,130,246,0.15)' : 'var(--glass)', borderColor: sourceLang === 'auto' ? 'rgba(59,130,246,0.5)' : 'var(--border)' }}
                  >
                    <div style={{ fontSize: 18, marginBottom: 3 }}>🌐</div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: sourceLang === 'auto' ? '#3b82f6' : 'var(--text1)' }}>Auto Detect</div>
                  </button>
                )}
                {srcFiltered.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => { setSourceLang(lang.code); playClickSound() }}
                    className="card"
                    style={{ padding: '8px 6px', textAlign: 'center', cursor: 'pointer', background: sourceLang === lang.code ? 'rgba(59,130,246,0.15)' : 'var(--glass)', borderColor: sourceLang === lang.code ? 'rgba(59,130,246,0.5)' : 'var(--border)' }}
                  >
                    <div style={{ fontSize: 18, marginBottom: 3 }}>{lang.flag}</div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: sourceLang === lang.code ? '#3b82f6' : 'var(--text1)', lineHeight: 1.3 }}>{lang.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* TARGET LANGUAGE (TO) */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#10b981', marginBottom: 8 }}>
                {'🎯 To language — ' + tgtFiltered.length + ' available' + (nepalMode ? ' · 🇳🇵 Nepal first' : '')}
              </div>
              <div style={{ position: 'relative', marginBottom: 8 }}>
                <Search size={13} color="var(--text3)" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Search target language..."
                  value={tgtSearch}
                  onChange={e => setTgtSearch(e.target.value)}
                  className="inp"
                  style={{ paddingLeft: 30, fontSize: 12 }}
                />
                {tgtSearch && (
                  <button onClick={() => setTgtSearch('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    <X size={13} color="var(--text3)" />
                  </button>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 6, maxHeight: 240, overflowY: 'auto', padding: 2 }}>
                {tgtFiltered.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => { setTargetLang(lang.code); playClickSound() }}
                    className="card"
                    style={{ padding: '8px 6px', textAlign: 'center', cursor: 'pointer', background: targetLang === lang.code ? 'rgba(16,185,129,0.15)' : (lang.region === 'nepal' && nepalMode ? 'rgba(239,68,68,0.06)' : 'var(--glass)'), borderColor: targetLang === lang.code ? 'rgba(16,185,129,0.5)' : (lang.region === 'nepal' && nepalMode ? 'rgba(239,68,68,0.2)' : 'var(--border)') }}
                  >
                    <div style={{ fontSize: 18, marginBottom: 3 }}>{lang.flag}</div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: targetLang === lang.code ? '#10b981' : 'var(--text1)', lineHeight: 1.3 }}>{lang.name}</div>
                    {lang.fallback && <div style={{ fontSize: 9, color: 'var(--text3)', marginTop: 2 }}>via Nepali</div>}
                  </button>
                ))}
              </div>
            </div>

            {/* Translate button */}
            <button
              className="btn"
              onClick={() => doTranslate()}
              disabled={loading}
              style={{ background: loading ? 'var(--glass)' : 'linear-gradient(135deg, #10b981, #059669)', width: '100%' }}
            >
              {loading
                ? <><span className="spin" />Translating...</>
                : <><Languages size={16} />Translate &amp; Generate Voice</>
              }
            </button>
          </div>

          {/* Detected language badge */}
          <AnimatePresence>
            {!loading && detectedLangName && (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="card" style={{ padding: '10px 16px', marginBottom: 10, background: 'rgba(59,130,246,0.08)', borderColor: 'rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Languages size={13} color="#3b82f6" />
                  <span style={{ fontSize: 12, color: 'var(--text2)' }}>
                    <strong style={{ color: '#3b82f6' }}>Detected:</strong> {detectedLangName}
                    {' → '}
                    <strong style={{ color: '#10b981' }}>{selectedLang?.flag} {selectedLang?.name}</strong>
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results */}
          <AnimatePresence>
            {result && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                {result.audio && <WaveformPlayer audioUrl={result.audio} isLoading={false} mode="assistant" />}

                <div className="card" style={{ padding: 20, marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 20 }}>{selectedLang?.flag}</span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text1)' }}>{selectedLang?.name}</span>
                    </div>
                    <button
                      onClick={copyTranslation}
                      style={{ padding: '5px 10px', borderRadius: 7, border: '1px solid rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.1)', color: '#10b981', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
                    >
                      <Copy size={11} /> Copy
                    </button>
                  </div>
                  <p style={{ fontSize: 15, color: 'var(--text1)', lineHeight: 1.7, margin: 0 }}>{result.translatedText}</p>
                </div>

                <div className="card" style={{ padding: 14, background: 'rgba(100,116,139,0.06)', borderColor: 'rgba(100,116,139,0.15)' }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Original &middot; {detectedLangName || selectedSource?.name}
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, margin: 0 }}>{input}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="card" style={{ padding: 16, marginTop: 14, background: 'rgba(16,185,129,0.06)', borderColor: 'rgba(16,185,129,0.18)' }}>
            <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.7 }}>
              <strong style={{ color: '#10b981' }}>🤖 Smart Translation</strong><br />
              ✓ 🌐 Auto Detect source OR pick manually<br />
              ✓ 🎤 Mic input — speak any language<br />
              ✓ 🇳🇵 Nepali + regional dialects via intelligent fallback<br />
              ✓ 🔄 Swap source &harr; target instantly<br />
              ✓ 🔊 Native voice via Murf Falcon
            </div>
          </div>
          </>)}
        </motion.div>
      </div>
    </div>
  )
}
