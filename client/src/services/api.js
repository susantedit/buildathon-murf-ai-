const BASE = '/api'

async function post(endpoint, body) {
  const res = await fetch(`${BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  return res.json()
}

async function get(endpoint) {
  const res = await fetch(`${BASE}${endpoint}`)
  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  return res.json()
}

export const api = {
  generateScript:  (text, tone)  => post('/generate-script',  { text, tone }),
  generateAdvice:  (text)        => post('/generate-advice',   { text }),
  explainTopic:    (topic, mode) => post('/explain-topic',     { topic, mode }),
  generatePlan:    (goal)        => post('/generate-plan',     { goal }),
  textToSpeech:    (text, voice) => post('/text-to-speech',    { text, voice }),
  getHistory:      ()            => get('/history'),
  deleteHistory:   (id)          => fetch(`${BASE}/history/${id}`, { method: 'DELETE' }).then(r => r.json()),
}
