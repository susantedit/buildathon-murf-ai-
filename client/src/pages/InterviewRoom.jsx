import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Bot, Mic, Send, SkipForward, WandSparkles, TimerReset, CheckCircle2, Volume2, Camera, CameraOff, Video, VideoOff } from 'lucide-react'
import toast from 'react-hot-toast'
import VoiceMicButton from '../components/VoiceMicButton'
import QuoteBar from '../components/QuoteBar'
import { PageHeader, ResultCard } from '../components/UI'
import { useAuth } from '../context/AuthContext'
import { api } from '../services/api'
import { getInterviewSession, saveInterviewSession, updateInterviewSession } from '../utils/interviews'

function playAudio(url) {
  if (!url) return
  const audio = new Audio(url)
  audio.play().catch(() => {})
}

function TranscriptBubble({ item }) {
  const isCandidate = item.speaker === 'candidate'
  return (
    <div style={{ display: 'flex', justifyContent: isCandidate ? 'flex-end' : 'flex-start' }}>
      <div style={{ maxWidth: '82%', padding: '12px 14px', borderRadius: 16, background: isCandidate ? 'rgba(6,182,212,0.12)' : 'rgba(139,92,246,0.1)', border: `1px solid ${isCandidate ? 'rgba(6,182,212,0.25)' : 'rgba(139,92,246,0.2)'}` }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: isCandidate ? '#06b6d4' : '#8b5cf6', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{item.speaker}</div>
        <div style={{ fontSize: 13, color: 'var(--text1)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{item.text}</div>
      </div>
    </div>
  )
}

export default function InterviewRoom() {
  const navigate = useNavigate()
  const { sessionId } = useParams()
  const { userId, displayName } = useAuth()
  const [session, setSession] = useState(null)
  const [answer, setAnswer] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [unverifiedMode, setUnverifiedMode] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [cameraOn, setCameraOn] = useState(false)
  const [cameraLoading, setCameraLoading] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const cameraVideoRef = useRef(null)
  const cameraStreamRef = useRef(null)
  const startedAt = useRef(Date.now())

  useEffect(() => {
    const local = getInterviewSession(sessionId)
    if (local) {
      setSession(local)
      startedAt.current = new Date(local.createdAt || Date.now()).getTime()
      return
    }
    const remote = async () => {
      try {
        const history = await api.getHistory(userId)
        const match = history.find(item => String(item._id) === String(sessionId))
        if (match) {
          const meta = match.meta || {}
          const hydrated = {
            id: String(match._id),
            title: meta.title || match.inputText || 'Mock interview',
            role: meta.role || match.inputText || '',
            company: meta.company || '',
            seniority: meta.seniority || '',
            focus: meta.focus || '',
            status: meta.status || 'completed',
            score: meta.feedback?.overallScore || 0,
            transcript: meta.transcript || [],
            feedback: meta.feedback || null,
            plan: meta.plan || null,
            audioUrl: match.audioUrl || '',
            createdAt: match.createdAt,
            updatedAt: match.createdAt,
          }
          setSession(hydrated)
          saveInterviewSession(hydrated)
          startedAt.current = new Date(hydrated.createdAt || Date.now()).getTime()
        }
      } catch {
        toast.error('Could not load interview session')
      }
    }
    remote()
  }, [sessionId, userId])

  useEffect(() => {
    const timer = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt.current) / 1000)), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    return () => {
      cameraStreamRef.current?.getTracks?.().forEach(track => track.stop())
    }
  }, [])

  useEffect(() => {
    if (!cameraVideoRef.current) return
    cameraVideoRef.current.srcObject = cameraStreamRef.current || null
  }, [cameraOn])

  const plan = session?.plan || {}
  const transcript = session?.transcript || []
  const currentIndex = session?.currentIndex || 0
  const currentQuestion = plan.questionBank?.[currentIndex]
  const completedQuestions = Math.min(currentIndex, plan.questionBank?.length || 0)
  const progress = plan.questionBank?.length ? Math.min(100, Math.round((completedQuestions / plan.questionBank.length) * 100)) : 0
  const isFinished = session?.status === 'completed' || currentIndex >= (plan.questionBank?.length || 0)

  const syncSession = patch => {
    const merged = { ...(session || {}), ...patch, updatedAt: new Date().toISOString() }
    setSession(merged)
    updateInterviewSession(sessionId, merged)
  }

  const finalizeInterview = async liveTranscript => {
    setAnalyzing(true)
    try {
      const response = await api.summarizeInterview({
        sessionId,
        plan,
        transcript: liveTranscript,
        role: session?.role || '',
        company: session?.company || '',
        seniority: session?.seniority || '',
        focus: session?.focus || '',
        userId,
      })
      const feedback = response.feedback || {}
      syncSession({
        transcript: liveTranscript,
        feedback,
        score: feedback.overallScore || 0,
        status: 'completed',
        audioUrl: response.audioUrl || response.audio || session?.audioUrl || '',
        completedAt: new Date().toISOString(),
      })
      if (response.audioUrl || response.audio) playAudio(response.audioUrl || response.audio)
      navigate(`/interviews/review/${sessionId}`)
    } catch (err) {
      toast.error(err.message || 'Could not finish interview')
    } finally {
      setAnalyzing(false)
    }
  }

  const submitAnswer = async () => {
    if (!answer.trim()) return toast.error('Add an answer first')
    if (!currentQuestion) return finalizeInterview(transcript)

    setSubmitting(true)
    const userTurn = { speaker: 'candidate', text: answer.trim(), kind: 'answer', createdAt: new Date().toISOString() }
    const nextTranscript = [...transcript, { speaker: 'interviewer', text: currentQuestion.question, kind: 'question', createdAt: new Date().toISOString() }, userTurn]
    setAnswer('')
    syncSession({ transcript: nextTranscript, status: 'live', currentIndex })

    try {
      const response = await api.continueInterview({
        sessionId,
        plan,
        transcript: nextTranscript,
        currentQuestion: currentQuestion.question,
        answer: userTurn.text,
        turn: currentIndex + 1,
        unverified: unverifiedMode,
      })

      const interviewerText = response.reply || response.coachingNote || response.summarySnippet || 'Thanks, let us continue.'
      const responseTranscript = [...nextTranscript, { speaker: 'coach', text: interviewerText, kind: 'coaching', createdAt: new Date().toISOString() }]
      const nextIndex = currentIndex + 1
      const shouldFinish = response.isComplete || nextIndex >= (plan.questionBank?.length || 0)

      syncSession({
        transcript: responseTranscript,
        currentIndex: nextIndex,
        status: shouldFinish ? 'analyzing' : 'live',
        score: Math.max(session?.score || 0, response.score || 0),
        latestCoachNote: response.coachingNote || '',
        progressText: response.progressText || '',
      })
      if (response.audioUrl || response.audio) playAudio(response.audioUrl || response.audio)

      if (shouldFinish) {
        await finalizeInterview(responseTranscript)
      }
    } catch (err) {
      toast.error(err.message || 'Could not submit answer')
    } finally {
      setSubmitting(false)
    }
  }

  const handleKeyDown = event => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault()
      submitAnswer()
    }
    if (event.key === 'Escape') {
      setAnswer('')
    }
  }

  const actionHint = useMemo(() => {
    if (isFinished) return 'Interview complete. Review the feedback or open another session.'
    return cameraOn ? 'Press Ctrl+Enter to send, speak with the mic, and keep eye contact with the camera preview.' : 'Press Ctrl+Enter to send, or use the mic to speak your answer.'
  }, [cameraOn, isFinished])

  // Keyboard shortcuts: 'm' toggles mic, 'Shift+D' downloads transcript
  useEffect(() => {
    const onKey = (e) => {
      // ignore if typing in inputs or textareas
      const tag = (document.activeElement && document.activeElement.tagName) || ''
      if (tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable) return

      if (e.key.toLowerCase() === 'm' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const btn = document.getElementById('mic-btn')
        if (btn) btn.click()
      }

      if (e.key.toLowerCase() === 'd' && e.shiftKey) {
        // download transcript
        const lines = transcript.map(item => `[${item.speaker}] ${item.text}`).join('\n')
        const blob = new Blob([lines], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `interview-transcript-${sessionId || Date.now()}.txt`
        a.click()
        URL.revokeObjectURL(url)
        toast.success('Transcript downloaded')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [transcript, sessionId])

  const toggleCamera = async () => {
    if (cameraOn) {
      cameraStreamRef.current?.getTracks?.().forEach(track => track.stop())
      cameraStreamRef.current = null
      setCameraOn(false)
      setCameraError('')
      return
    }

    setCameraLoading(true)
    setCameraError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      cameraStreamRef.current = stream
      if (cameraVideoRef.current) cameraVideoRef.current.srcObject = stream
      setCameraOn(true)
    } catch (error) {
      setCameraError('Camera access was blocked or unavailable.')
      toast.error('Camera access is not available')
    } finally {
      setCameraLoading(false)
    }
  }

  if (!session) {
    return (
      <div className="page-wrapper">
        <div className="page-content">
          <div className="card shimmer" style={{ height: 260 }} />
        </div>
      </div>
    )
  }

  return (
    <div className="page-wrapper">
      <div className="page-content">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>

              {/* Hero: interviewer + candidate tiles */}
              <div className="interview-hero">
                <div className="participant-tile">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexDirection: 'column' }}>
                    <div className="participant-avatar">
                      <div style={{ width: 72, height: 72, borderRadius: 12, background: 'radial-gradient(circle,#c4b5fd,#7c3aed)', display: 'grid', placeItems: 'center' }}>
                        <Bot size={36} color="#fff" />
                      </div>
                    </div>
                    <div className="participant-label">AI Interviewer</div>
                  </div>
                </div>
                <div className="participant-tile">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexDirection: 'column' }}>
                    <div className="participant-avatar" style={{ background: 'linear-gradient(135deg,#0ea5a7,#06b6d4)' }}>
                      <div style={{ width: 72, height: 72, borderRadius: 999, background: 'url(https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop)&quot;)', backgroundSize: 'cover' }} />
                    </div>
                    <div className="participant-label">{(displayName || 'You') + ' (You)'}</div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div className="question-pill">{currentQuestion?.question || plan.closingLine || 'Interview ready — press Send or use the mic.'}</div>
              </div>

          <div className="card" style={{ padding: 16, marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Progress</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text1)', marginTop: 4 }}>{session.role}{session.company ? ` · ${session.company}` : ''}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <div style={{ padding: '6px 12px', borderRadius: 999, background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.22)', color: '#06b6d4', fontSize: 11, fontWeight: 800 }}>Q {Math.min(currentIndex + 1, plan.questionBank?.length || 0)} / {plan.questionBank?.length || 0}</div>
                <div style={{ padding: '6px 12px', borderRadius: 999, background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.22)', color: '#8b5cf6', fontSize: 11, fontWeight: 800 }}>{Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}</div>
                <div style={{ padding: '6px 12px', borderRadius: 999, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.22)', color: '#10b981', fontSize: 11, fontWeight: 800 }}>{session.status || 'live'}</div>
              </div>
            </div>
            <div style={{ height: 10 }} />
            <div style={{ height: 8, borderRadius: 999, background: 'rgba(148,163,184,0.12)', overflow: 'hidden' }}>
              <div style={{ width: `${progress}%`, height: '100%', borderRadius: 999, background: 'linear-gradient(90deg,#06b6d4,#8b5cf6)' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12, marginBottom: 14 }}>
            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Focus</div>
              <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.65 }}>{session.focus || 'Keep answers concise, specific, and grounded in examples.'}</div>
            </div>
            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Tone</div>
              <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.65 }}>{session.tone || 'professional'} interviewer with real-time feedback and coaching.</div>
            </div>
            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Goal</div>
              <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.65 }}>{session.goal || 'Use the interview to sharpen clarity, structure, and confidence.'}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 14 }}>
            <div className="card" style={{ padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Current question</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text1)', marginTop: 4 }}>{currentQuestion?.question || plan.closingLine || 'Interview complete'}</div>
                </div>
                <button className="btn" onClick={() => navigate('/interviews')} style={{ background: 'var(--glass)', color: 'var(--text2)' }}><TimerReset size={14} /> Dashboard</button>
              </div>

              <div style={{ padding: 14, borderRadius: 16, background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.16)', marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#06b6d4', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Coach prompt</div>
                <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.65 }}>{session.latestCoachNote || plan.coachNotes?.[0] || 'Answer naturally and keep your example specific.'}</div>
              </div>

              <label className="lbl">Your answer</label>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <textarea className="inp" value={answer} onChange={e => setAnswer(e.target.value)} onKeyDown={handleKeyDown} rows={6} placeholder="Speak or type your answer here. Press Ctrl+Enter to submit." style={{ flex: 1, resize: 'vertical' }} />
                <VoiceMicButton buttonId="mic-btn" onResult={text => setAnswer(current => (current ? `${current} ${text}` : text))} />
              </div>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
                <button className="btn" onClick={submitAnswer} disabled={submitting || analyzing || isFinished}><Send size={14} /> {submitting ? 'Sending...' : 'Send answer'}</button>
                <button className="btn" onClick={() => setUnverifiedMode(m => !m)} style={{ background: unverifiedMode ? 'linear-gradient(90deg,#ff7a7a,#ffb86b)' : 'var(--glass)', color: unverifiedMode ? '#2b0216' : 'var(--text2)' }}>{unverifiedMode ? 'Unverified: ON' : 'Unverified: OFF'}</button>
                <button className="btn" onClick={() => finalizeInterview(transcript)} disabled={submitting || analyzing} style={{ background: 'var(--glass)', color: 'var(--text2)' }}><CheckCircle2 size={14} /> End & review</button>
                <button className="btn" onClick={() => setAnswer('')} style={{ background: 'var(--glass)', color: 'var(--text2)' }}><Mic size={14} /> Clear</button>
              </div>
              {unverifiedMode && <div style={{ fontSize: 12, color: '#b45309', marginTop: 8 }}>Unverified mode: responses include speculative facts. Verify before use.</div>}
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 10 }}>{actionHint}</div>
            </div>

            <div style={{ display: 'grid', gap: 14 }}>
              <div className="card" style={{ padding: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Video size={16} color="#06b6d4" />
                    <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text1)' }}>Camera check</div>
                  </div>
                  <button className="btn" onClick={toggleCamera} disabled={cameraLoading} style={{ background: 'var(--glass)', color: 'var(--text2)' }}>
                    {cameraOn ? <><CameraOff size={14} /> Stop camera</> : <><Camera size={14} /> {cameraLoading ? 'Starting...' : 'Enable camera'}</>}
                  </button>
                </div>
                <div style={{ position: 'relative', aspectRatio: '16/10', borderRadius: 18, overflow: 'hidden', background: 'linear-gradient(180deg, rgba(15,23,42,0.95), rgba(15,23,42,0.75))', border: '1px solid var(--border)' }}>
                  {cameraOn ? (
                    <video ref={cameraVideoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', padding: 20, textAlign: 'center' }}>
                      <div>
                        <div style={{ width: 64, height: 64, borderRadius: 20, margin: '0 auto 12px', display: 'grid', placeItems: 'center', background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.2)' }}>
                          <VideoOff size={24} color="#06b6d4" />
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text1)', marginBottom: 6 }}>Camera off</div>
                        <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>Enable your camera to practice eye contact and interview presence.</div>
                      </div>
                    </div>
                  )}
                </div>
                <div style={{ fontSize: 11, color: cameraError ? '#ef4444' : 'var(--text3)', marginTop: 10 }}>{cameraError || 'Your camera stays local in the browser and is only used for this practice session.'}</div>
              </div>

              <div className="card" style={{ padding: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <Volume2 size={16} color="#06b6d4" />
                  <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text1)' }}>Live transcript</div>
                </div>
                <div style={{ display: 'grid', gap: 10, maxHeight: 400, overflow: 'auto', paddingRight: 4 }}>
                  {transcript.length === 0 && (
                    <div style={{ padding: 14, borderRadius: 14, background: 'rgba(148,163,184,0.08)', color: 'var(--text3)', fontSize: 13, lineHeight: 1.6 }}>
                      Your interview transcript will appear here as you answer each question.
                    </div>
                  )}
                  {transcript.map((item, index) => <TranscriptBubble key={`${item.speaker}-${index}`} item={item} />)}
                </div>
              </div>
            </div>
          </div>

          {plan.questionBank?.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <ResultCard
                icon={<WandSparkles size={14} color="#06b6d4" />}
                label="Interview rubric"
                text={(plan.evaluationRubric || []).map(item => `${item.skill} (${item.weight}%): ${item.description}`).join('\n') || 'Groq generated rubric will appear in the final review.'}
                typewriter={false}
                sessionId={sessionId}
              />
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}