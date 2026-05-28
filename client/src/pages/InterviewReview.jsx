import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Download, FileText, Share2, Star, Sparkles, ThumbsUp, ThumbsDown, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import ShareButton from '../components/ShareButton'
import ResponseRating from '../components/ResponseRating'
import QuoteBar from '../components/QuoteBar'
import { PageHeader, ResultCard } from '../components/UI'
import { useAuth } from '../context/AuthContext'
import { api } from '../services/api'
import { getInterviewSession, saveInterviewSession } from '../utils/interviews'

function normalizeRemote(session) {
  const meta = session.meta || {}
  return {
    id: String(session._id),
    title: meta.title || session.inputText || 'Mock interview',
    role: meta.role || '',
    company: meta.company || '',
    seniority: meta.seniority || '',
    focus: meta.focus || '',
    status: meta.status || 'completed',
    score: meta.feedback?.overallScore || 0,
    transcript: meta.transcript || [],
    feedback: meta.feedback || null,
    plan: meta.plan || null,
    audioUrl: session.audioUrl || '',
    createdAt: session.createdAt,
    updatedAt: session.createdAt,
  }
}

function SectionCard({ title, children, icon: Icon, color = '#06b6d4' }) {
  return (
    <div className="card" style={{ padding: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        {Icon && <Icon size={16} color={color} />}
        <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text1)' }}>{title}</div>
      </div>
      {children}
    </div>
  )
}

export default function InterviewReview() {
  const navigate = useNavigate()
  const { sessionId } = useParams()
  const { userId } = useAuth()
  const [session, setSession] = useState(null)

  useEffect(() => {
    const local = getInterviewSession(sessionId)
    if (local) return setSession(local)

    const remote = async () => {
      try {
        const history = await api.getHistory(userId)
        const match = history.find(item => String(item._id) === String(sessionId))
        if (match) {
          const hydrated = normalizeRemote(match)
          setSession(hydrated)
          saveInterviewSession(hydrated)
        }
      } catch {
        toast.error('Could not load interview review')
      }
    }
    remote()
  }, [sessionId, userId])

  const feedback = session?.feedback || {}
  const transcript = session?.transcript || []
  const shareText = useMemo(() => {
    const summary = feedback.summary || session?.title || 'Interview completed'
    return `Interview review for ${session?.role || 'candidate'}\nScore: ${feedback.overallScore || session?.score || 0}/100\n${summary}`
  }, [feedback.summary, feedback.overallScore, session?.role, session?.score, session?.title])

  const downloadTranscript = () => {
    if (!session) return
    const lines = [
      `INTERVIEW REVIEW`,
      `Role: ${session.role || 'Unknown'}`,
      `Company: ${session.company || 'N/A'}`,
      `Score: ${feedback.overallScore || session.score || 0}/100`,
      '',
      `Summary: ${feedback.summary || session.feedback?.summary || 'No summary'}`,
      '',
      'Transcript:',
      ...transcript.map(item => `[${item.speaker}] ${item.text}`),
    ].join('\n')
    const blob = new Blob([lines], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `interview-review-${sessionId}.txt`
    link.click()
    URL.revokeObjectURL(url)
    toast.success('Transcript downloaded')
  }

  const downloadAudio = async () => {
    if (!session?.audioUrl) return toast.error('No audio available')
    try {
      const resp = await fetch(session.audioUrl)
      if (!resp.ok) return toast.error('Could not fetch audio')
      const blob = await resp.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `interview-audio-${sessionId}.mp3`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Audio downloaded')
    } catch (err) {
      console.error('Download audio error', err)
      toast.error('Download failed')
    }
  }

  if (!session) {
    return (
      <div className="page-wrapper">
        <div className="page-content">
          <div className="card shimmer" style={{ height: 280 }} />
        </div>
      </div>
    )
  }

  return (
    <div className="page-wrapper">
      <div className="page-content">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
          <PageHeader icon={Sparkles} color="#06b6d4" title="Interview Review" sub="Full transcript, score breakdown, strengths, gaps, and next practice plan." />
          <QuoteBar section="interview" color="#06b6d4" />

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
            <button className="btn" onClick={() => navigate('/interviews')} style={{ background: 'var(--glass)', color: 'var(--text2)' }}><ArrowLeft size={14} /> Back to dashboard</button>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <ShareButton text={shareText} audioUrl={session.audioUrl} label="Share review" style={{ background: 'var(--glass)' }} />
              <button className="btn" onClick={downloadTranscript} style={{ background: 'var(--glass)', color: 'var(--text2)' }}><Download size={14} /> Download transcript</button>
              <button className="btn" onClick={downloadAudio} style={{ background: 'var(--glass)', color: 'var(--text2)' }}><Download size={14} /> Download audio</button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 14, marginBottom: 14 }}>
            <div className="card" style={{ padding: 20, background: 'linear-gradient(135deg, rgba(6,182,212,0.10), rgba(139,92,246,0.10))' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Overall result</div>
                  <div style={{ fontSize: 26, fontWeight: 900, color: 'var(--text1)', marginTop: 6 }}>{feedback.overallScore || session.score || 0}/100</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <ResponseRating sessionId={sessionId} />
                  <div style={{ padding: '7px 12px', borderRadius: 999, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.22)', color: '#10b981', fontSize: 11, fontWeight: 800 }}>{feedback.hiringVerdict || 'Review ready'}</div>
                </div>
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.75, color: 'var(--text2)', marginTop: 14 }}>{feedback.summary || session.feedback?.summary || 'Your review will appear here once the interview ends.'}</p>
              {session.audioUrl && (
                <audio controls src={session.audioUrl} style={{ width: '100%', marginTop: 16, borderRadius: 12 }} />
              )}
            </div>
            <SectionCard title="Quick actions" icon={FileText} color="#8b5cf6">
              <div style={{ display: 'grid', gap: 10 }}>
                <button className="btn" onClick={() => navigate('/interviews/new')}><Sparkles size={14} /> Start next interview</button>
                <button className="btn" onClick={downloadTranscript} style={{ background: 'var(--glass)', color: 'var(--text2)' }}><Download size={14} /> Export transcript</button>
                <button className="btn" onClick={() => navigator.clipboard.writeText(shareText).then(() => toast.success('Copied')).catch(() => toast.error('Copy failed'))} style={{ background: 'var(--glass)', color: 'var(--text2)' }}><Share2 size={14} /> Copy summary</button>
              </div>
              <div style={{ marginTop: 14, padding: 14, borderRadius: 14, background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.18)' }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#06b6d4', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Transcript length</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--text1)' }}>{transcript.length} turns</div>
              </div>
            </SectionCard>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <SectionCard title="Strengths" icon={ThumbsUp} color="#10b981">
              <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 8, color: 'var(--text2)', lineHeight: 1.7 }}>
                {(feedback.strengths || []).map((item, index) => <li key={index}>{item}</li>)}
                {(!feedback.strengths || feedback.strengths.length === 0) && <li>No strengths captured yet.</li>}
              </ul>
            </SectionCard>
            <SectionCard title="Gaps" icon={ThumbsDown} color="#ef4444">
              <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 8, color: 'var(--text2)', lineHeight: 1.7 }}>
                {(feedback.gaps || []).map((item, index) => <li key={index}>{item}</li>)}
                {(!feedback.gaps || feedback.gaps.length === 0) && <li>No gaps captured yet.</li>}
              </ul>
            </SectionCard>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <SectionCard title="Next practice plan" icon={CheckCircle2} color="#06b6d4">
              <ol style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 8, color: 'var(--text2)', lineHeight: 1.7 }}>
                {(feedback.nextPracticePlan || feedback.recommendations || []).map((item, index) => <li key={index}>{item}</li>)}
                {((feedback.nextPracticePlan || feedback.recommendations || []).length === 0) && <li>Practice more answers to unlock recommendations.</li>}
              </ol>
            </SectionCard>
            <SectionCard title="Question scores" icon={Star} color="#8b5cf6">
              <div style={{ display: 'grid', gap: 10 }}>
                {(feedback.questionScores || []).map((item, index) => (
                  <div key={index} style={{ padding: 12, borderRadius: 14, background: 'var(--glass)', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 6 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text1)' }}>{item.question || `Question ${index + 1}`}</div>
                      <div style={{ fontSize: 12, fontWeight: 800, color: '#8b5cf6' }}>{item.score || 0}/100</div>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>{item.note || 'No note available.'}</div>
                  </div>
                ))}
                {(!feedback.questionScores || feedback.questionScores.length === 0) && <div style={{ fontSize: 13, color: 'var(--text3)' }}>The final breakdown will appear here after the review is generated.</div>}
              </div>
            </SectionCard>
          </div>

          <SectionCard title="Transcript" icon={FileText} color="#06b6d4">
            <div style={{ display: 'grid', gap: 12 }}>
              {transcript.map((item, index) => (
                <div key={`${item.speaker}-${index}`} style={{ padding: 12, borderRadius: 14, background: item.speaker === 'candidate' ? 'rgba(6,182,212,0.08)' : 'rgba(139,92,246,0.08)', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: item.speaker === 'candidate' ? '#06b6d4' : '#8b5cf6', marginBottom: 4 }}>{item.speaker}</div>
                  <div style={{ fontSize: 13, color: 'var(--text1)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{item.text}</div>
                </div>
              ))}
              {transcript.length === 0 && <div style={{ color: 'var(--text3)', fontSize: 13 }}>No transcript captured yet.</div>}
            </div>
          </SectionCard>

          <div style={{ marginTop: 14 }}>
            <ResultCard
              icon={<Sparkles size={14} color="#06b6d4" />}
              label="Review summary"
              text={feedback.summary || session.feedback?.summary || 'Your summary is ready.'}
              typewriter={false}
              sessionId={sessionId}
            />
          </div>
        </motion.div>
      </div>
    </div>
  )
}