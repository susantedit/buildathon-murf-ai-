import axios from 'axios'

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'

function getKeys() {
  return [
    process.env.GROQ_API_KEY,
    process.env.GROQ_API_KEY_2,
    process.env.GROQ_API_KEY_3,
  ].filter(Boolean)
}

async function callGroq(prompt, temperature = 0.2, maxTokens = 1600) {
  const keys = getKeys()
  if (!keys.length) throw new Error('No GROQ_API_KEY configured')

  let lastError
  for (const key of keys) {
    try {
      const response = await axios.post(
        GROQ_URL,
        {
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          temperature,
          max_tokens: maxTokens,
        },
        {
          headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
          timeout: 30000,
        }
      )

      const content = response.data?.choices?.[0]?.message?.content
      if (!content) throw new Error('Invalid response from Groq')
      return content
    } catch (error) {
      const status = error.response?.status
      if (status === 401 || status === 429) {
        lastError = error
        continue
      }
      throw new Error(`Groq API error: ${error.message}`)
    }
  }

  throw lastError || new Error('All Groq API keys exhausted.')
}

function normalizeText(text) {
  return String(text || '')
    .replace(/\s+/g, ' ')
    .replace(/[“”]/g, '"')
    .replace(/[’]/g, "'")
    .trim()
}

function normalizeUrl(url) {
  const clean = normalizeText(url)
  if (!clean) return ''
  if (/^https?:\/\//i.test(clean)) return clean
  return `https://${clean}`
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function uniq(list) {
  return [...new Set((list || []).map(item => normalizeText(item)).filter(Boolean))]
}

function decodeDuckDuckGoUrl(href) {
  try {
    if (!href) return ''
    if (href.startsWith('/l/?')) {
      const query = new URL(`https://duckduckgo.com${href}`).searchParams.get('uddg')
      return query ? decodeURIComponent(query) : href
    }
    return href
  } catch {
    return href
  }
}

function isTrustedSource(url) {
  try {
    const host = new URL(url).hostname.toLowerCase().replace(/^www\./, '')
    return (
      host.endsWith('.gov') ||
      host.endsWith('.edu') ||
      host.endsWith('.org') ||
      host.includes('who.int') ||
      host.includes('nih.gov') ||
      host.includes('cdc.gov') ||
      host.includes('sec.gov') ||
      host.includes('europa.eu') ||
      host.includes('reuters.com') ||
      host.includes('apnews.com') ||
      host.includes('bloomberg.com')
    )
  } catch {
    return false
  }
}

function sourceReliabilityScore(url, title = '') {
  const trusted = isTrustedSource(url)
  if (trusted) return 92
  const lower = `${url} ${title}`.toLowerCase()
  if (lower.includes('official') || lower.includes('press release') || lower.includes('newsroom')) return 82
  if (lower.includes('fact check') || lower.includes('report')) return 74
  if (lower.includes('blog') || lower.includes('medium') || lower.includes('reddit') || lower.includes('facebook') || lower.includes('x.com')) return 28
  return 55
}

function extractPageText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--([\s\S]*?)-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

function extractClaimCandidates(text) {
  const clean = normalizeText(text)
  const sentences = clean
    .split(/(?<=[.!?])\s+/)
    .map(sentence => sentence.trim())
    .filter(Boolean)

  const claimSentences = sentences.filter(sentence => {
    const lengthSignal = sentence.length >= 50
    const factSignal = /\b\d{1,3}(?:,\d{3})*(?:\.\d+)?%?\b/.test(sentence) || /\b(?:19|20)\d{2}\b/.test(sentence) || /\b(?:million|billion|thousand|percent|km|miles|usd|rupees|euro|hours?|days?)\b/i.test(sentence)
    const entitySignal = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,4}\b/.test(sentence) || /https?:\/\//i.test(sentence)
    const directQuoteSignal = /['"]/g.test(sentence)
    return lengthSignal || factSignal || entitySignal || directQuoteSignal
  })

  const highlighted = uniq(claimSentences)
    .slice(0, 12)
    .map(sentence => {
      const claim = sentence.length > 240 ? `${sentence.slice(0, 237)}...` : sentence
      return {
        claim,
        category: detectClaimCategory(claim),
        query: buildSearchQuery(claim),
      }
    })

  if (highlighted.length) return highlighted

  const chunks = clean.split(/(?<=[.!?])\s+/).filter(Boolean).slice(0, 8)
  return chunks.map(chunk => ({
    claim: chunk.length > 240 ? `${chunk.slice(0, 237)}...` : chunk,
    category: detectClaimCategory(chunk),
    query: buildSearchQuery(chunk),
  }))
}

function detectClaimCategory(text) {
  const lower = text.toLowerCase()
  if (/\b(when|date|year|timeline|before|after|ago|today|yesterday|next week)\b/.test(lower)) return 'timeline'
  if (/\b(percentage|percent|increase|decrease|more than|less than|double|triple|million|billion|thousand|budget|revenue|price)\b/.test(lower)) return 'statistic'
  if (/\b(said|quote|quoted|statement|announced|claimed|reported)\b/.test(lower)) return 'quote'
  if (/\b(company|organization|agency|ministry|university|hospital|court|government)\b/.test(lower)) return 'organization'
  if (/\b(where|located|city|country|state|capital|province|region)\b/.test(lower)) return 'location'
  return 'general fact'
}

function buildSearchQuery(text) {
  const clean = normalizeText(text)
  const filtered = clean
    .replace(/["'()\[\]{}]/g, ' ')
    .replace(/\b(?:the|a|an|and|or|but|with|from|that|this|these|those|has|have|had|was|were|is|are|be|been|being|for|to|of|in|on|at|by|as|it|its|their|his|her|they|them)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  const parts = filtered.split(' ').slice(0, 12)
  return parts.join(' ') || clean.slice(0, 80)
}

async function searchDuckDuckGo(query) {
  try {
    const response = await axios.get('https://html.duckduckgo.com/html/', {
      params: { q: query },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      timeout: 20000,
    })

    const html = String(response.data || '')
    const matches = [...html.matchAll(/<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)]

    return matches.slice(0, 5).map(match => ({
      title: extractPageText(match[2]).slice(0, 180),
      url: decodeDuckDuckGoUrl(match[1]),
    }))
  } catch {
    return []
  }
}

async function fetchPageSummary(url) {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      timeout: 20000,
      maxRedirects: 5,
      responseType: 'text',
    })

    const contentType = String(response.headers['content-type'] || '').toLowerCase()
    if (contentType.includes('text/html')) {
      return extractPageText(String(response.data || '')).slice(0, 5000)
    }

    return normalizeText(String(response.data || '')).slice(0, 5000)
  } catch {
    return ''
  }
}

function scoreSupport(claim, evidenceText) {
  const claimText = normalizeText(claim).toLowerCase()
  const evidence = normalizeText(evidenceText).toLowerCase()
  if (!claimText || !evidence) return 0

  const claimTokens = claimText
    .split(/\s+/)
    .filter(token => token.length > 4 && !/^(the|this|that|with|from|have|were|been|there|their|about|would|could|should|after|before|which|because)$/.test(token))
    .slice(0, 12)

  let score = 0
  for (const token of claimTokens) {
    if (evidence.includes(token)) score += 8
  }

  const claimNumbers = claimText.match(/\b\d{1,4}(?:,\d{3})*(?:\.\d+)?%?\b/g) || []
  for (const number of claimNumbers) {
    if (evidence.includes(number)) score += 14
  }

  if (/\b(official|according to|report|announced|confirmed|published)\b/.test(evidence)) score += 10
  if (/\b(false|denied|not true|incorrect|misleading|debunked)\b/.test(evidence)) score -= 12

  return clamp(score, 0, 100)
}

function scoreContradiction(claim, evidenceText) {
  const claimText = normalizeText(claim).toLowerCase()
  const evidence = normalizeText(evidenceText).toLowerCase()
  let score = 0

  if (/\b(never|impossible|fake|hoax|misleading|false)\b/.test(evidence)) score += 12
  if (/\b(denied|refuted|not true|no evidence|does not|did not|cannot)\b/.test(evidence)) score += 10

  const claimNumbers = claimText.match(/\b\d{1,4}(?:,\d{3})*(?:\.\d+)?%?\b/g) || []
  for (const number of claimNumbers) {
    if (evidence.includes(number)) continue
    if (/\b(total|count|price|rate|year|date|percent|million|billion)\b/.test(claimText) && /\b\d{1,4}(?:,\d{3})*(?:\.\d+)?%?\b/.test(evidence)) {
      score += 8
    }
  }

  return clamp(score, 0, 100)
}

function scoreFreshness(evidenceText, url = '') {
  const text = normalizeText(evidenceText)
  const urlText = String(url || '')
  const yearMatches = [...text.matchAll(/\b(20\d{2})\b/g)].map(match => Number(match[1]))
  const recentYear = yearMatches.length ? Math.max(...yearMatches) : null
  const currentYear = new Date().getFullYear()

  if (recentYear && recentYear >= currentYear - 1) return 90
  if (recentYear && recentYear >= currentYear - 3) return 75
  if (/\b(updated|published|posted|breaking|latest|today|this week|this month)\b/i.test(text)) return 68
  if (/\barchive|historic|old|retrospective\b/i.test(text)) return 35
  if (/\b(202\d)\b/.test(urlText)) return 60
  return 55
}

function scoreManipulationRisk(claim) {
  const lower = normalizeText(claim).toLowerCase()
  let score = 20
  if (/\b(shocking|exposed|secret|they don't want you to know|breaking|viral|click here)\b/.test(lower)) score += 30
  if (/\b(screenshot|edited|cropped|anonymous|forwarded|leak|leaked)\b/.test(lower)) score += 20
  if (/\b(ai|chatgpt|hallucination|fake citation|fabricated|misleading)\b/.test(lower)) score += 10
  return clamp(score, 0, 100)
}

function detectVerdict(supportScore, contradictionScore, claim, evidenceCount) {
  if (evidenceCount === 0) return 'UNVERIFIABLE'
  if (contradictionScore >= supportScore + 18) return supportScore > 20 ? 'LIKELY_FALSE' : 'FALSE'
  if (supportScore >= 70 && contradictionScore < 20) return 'VERIFIED'
  if (supportScore >= 45) return 'LIKELY_TRUE'
  return 'UNVERIFIABLE'
}

function summarizeClaimQuality(claim, verdict, supportScore, contradictionScore, evidenceCount) {
  const base = claim.length > 180 ? `${claim.slice(0, 177)}...` : claim
  if (verdict === 'VERIFIED') return `${base} is strongly supported by multiple current sources.`
  if (verdict === 'LIKELY_TRUE') return `${base} is supported, but the available evidence is not fully exhaustive.`
  if (verdict === 'LIKELY_FALSE' || verdict === 'FALSE') return `${base} appears to conflict with stronger evidence or source context.`
  if (!evidenceCount) return `${base} could not be confirmed against trusted sources.`
  return `${base} has partial signals, but the claim remains incomplete or ambiguous.`
}

async function analyzeClaim(claim, sourceUrl = '') {
  const searchQuery = buildSearchQuery(claim.query || claim.claim)
  const searchResults = await searchDuckDuckGo(searchQuery)

  const candidateSources = []
  if (sourceUrl) {
    candidateSources.push({ title: 'Provided source', url: sourceUrl, sourceText: await fetchPageSummary(sourceUrl) })
  }

  for (const result of searchResults.slice(0, 4)) {
    const sourceText = await fetchPageSummary(result.url)
    candidateSources.push({ ...result, sourceText })
  }

  const analyzedSources = candidateSources
    .filter(source => source.url)
    .map(source => {
      const supportScore = scoreSupport(claim.claim, source.sourceText || '')
      const contradictionScore = scoreContradiction(claim.claim, source.sourceText || '')
      return {
        title: source.title || source.url,
        url: source.url,
        snippet: (source.sourceText || '').slice(0, 260),
        reliabilityScore: sourceReliabilityScore(source.url, source.title),
        supportScore,
        contradictionScore,
        trusted: isTrustedSource(source.url),
        freshnessScore: scoreFreshness(source.sourceText || '', source.url),
      }
    })

  const evidenceCount = analyzedSources.length
  const supportScore = analyzedSources.reduce((total, source) => total + source.supportScore, 0) / Math.max(evidenceCount, 1)
  const contradictionScore = analyzedSources.reduce((total, source) => total + source.contradictionScore, 0) / Math.max(evidenceCount, 1)
  const freshnessScore = analyzedSources.length
    ? Math.round(analyzedSources.reduce((total, source) => total + source.freshnessScore, 0) / analyzedSources.length)
    : 50
  const sourceReliability = analyzedSources.length
    ? Math.round(analyzedSources.reduce((total, source) => total + source.reliabilityScore, 0) / analyzedSources.length)
    : 40
  const verdict = detectVerdict(supportScore, contradictionScore, claim.claim, evidenceCount)
  const confidence = clamp(Math.round((supportScore * 0.7) + (sourceReliability * 0.2) - (contradictionScore * 0.45) + (evidenceCount * 3)), 8, 98)
  const manipulationRisk = scoreManipulationRisk(claim.claim)

  const sortedEvidence = analyzedSources
    .sort((a, b) => b.reliabilityScore + b.supportScore - (a.reliabilityScore + a.supportScore))

  return {
    claim: claim.claim,
    category: claim.category,
    query: searchQuery,
    verdict,
    confidence,
    sourceReliability,
    freshnessScore,
    manipulationRisk,
    reasoning: summarizeClaimQuality(claim.claim, verdict, supportScore, contradictionScore, evidenceCount),
    supportScore: Math.round(supportScore),
    contradictionScore: Math.round(contradictionScore),
    evidence: sortedEvidence,
    evidenceCount,
  }
}

function parseGroqClaims(raw) {
  const match = raw.match(/\[[\s\S]*\]/) || raw.match(/\{[\s\S]*\}/)
  if (!match) return []

  const parsed = JSON.parse(match[0])
  const claims = Array.isArray(parsed) ? parsed : parsed.claims || []
  return claims
    .map(claim => ({
      claim: normalizeText(claim.claim || claim.text || claim.statement || ''),
      category: normalizeText(claim.category || claim.type || 'general fact') || 'general fact',
      query: normalizeText(claim.query || claim.claim || claim.text || ''),
    }))
    .filter(entry => entry.claim)
}

function fallbackClaims(text) {
  return extractClaimCandidates(text)
}

async function extractClaims(text) {
  const sourceText = normalizeText(text)
  if (!sourceText) return []

  try {
    if (getKeys().length) {
      const raw = await callGroq(
        `Extract the factual claims from the following input. Return ONLY valid JSON as {"claims":[{"claim":"...","category":"...","query":"..."}]}. Each claim should be concise, checkable, and independently verifiable. Prefer dates, numbers, names, locations, quotes, and policy statements. Limit to 10 claims. INPUT:\n${sourceText}`,
        0.1,
        1200
      )
      const claims = parseGroqClaims(raw)
      if (claims.length) return claims.slice(0, 10)
    }
  } catch {
    // fall through to heuristic extraction
  }

  return fallbackClaims(sourceText).slice(0, 10)
}

async function buildAnalysisBundle({ inputText = '', sourceUrl = '', imageText = '', inputType = 'text' }) {
  const normalizedInput = normalizeText(inputText)
  const normalizedUrl = normalizeUrl(sourceUrl)
  const normalizedImage = normalizeText(imageText)

  const fetchedUrlText = normalizedUrl ? await fetchPageSummary(normalizedUrl) : ''
  const combinedText = [normalizedInput, normalizedImage, fetchedUrlText].filter(Boolean).join('\n\n')
  const claims = await extractClaims(combinedText || normalizedInput || fetchedUrlText)
  const analyzedClaims = []

  for (const claim of claims) {
    analyzedClaims.push(await analyzeClaim(claim, normalizedUrl))
  }

  const total = analyzedClaims.length
  const verifiedCount = analyzedClaims.filter(item => item.verdict === 'VERIFIED').length
  const likelyTrueCount = analyzedClaims.filter(item => item.verdict === 'LIKELY_TRUE').length
  const likelyFalseCount = analyzedClaims.filter(item => item.verdict === 'LIKELY_FALSE' || item.verdict === 'FALSE').length
  const unverifiableCount = analyzedClaims.filter(item => item.verdict === 'UNVERIFIABLE').length
  const averageConfidence = total
    ? Math.round(analyzedClaims.reduce((sum, item) => sum + item.confidence, 0) / total)
    : 0
  const averageReliability = total
    ? Math.round(analyzedClaims.reduce((sum, item) => sum + item.sourceReliability, 0) / total)
    : 0
  const averageFreshness = total
    ? Math.round(analyzedClaims.reduce((sum, item) => sum + item.freshnessScore, 0) / total)
    : 0
  const averageRisk = total
    ? Math.round(analyzedClaims.reduce((sum, item) => sum + item.manipulationRisk, 0) / total)
    : 0

  const overallStatus = likelyFalseCount > verifiedCount + likelyTrueCount
    ? 'CONFLICTING'
    : verifiedCount > 0 && unverifiableCount === 0 && likelyFalseCount === 0
      ? 'VERIFIED'
      : verifiedCount + likelyTrueCount > likelyFalseCount
        ? 'PARTIAL'
        : 'UNVERIFIABLE'

  const liveNotes = [
    `${total} claims extracted`,
    `${verifiedCount + likelyTrueCount} claims supported`,
    `${likelyFalseCount} claims challenged`,
    `${averageReliability}% average source reliability`,
  ]

  return {
    inputType,
    sourceUrl: normalizedUrl,
    lastChecked: new Date().toISOString(),
    claims: analyzedClaims,
    summary: {
      totalClaims: total,
      verifiedCount,
      likelyTrueCount,
      likelyFalseCount,
      unverifiableCount,
      overallStatus,
      confidence: averageConfidence,
      sourceReliability: averageReliability,
      freshness: averageFreshness,
      manipulationRisk: averageRisk,
    },
    liveNotes,
    evidenceSeed: fetchedUrlText ? fetchedUrlText.slice(0, 600) : '',
  }
}

export async function verifyFactClaims(payload) {
  return buildAnalysisBundle(payload)
}

export async function refreshVerification(payload) {
  return buildAnalysisBundle(payload)
}