import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Bot, Briefcase, Building2, Target, Sparkles, Mic, WandSparkles, ChevronsRight, LayoutGrid } from 'lucide-react'
import toast from 'react-hot-toast'
import VoiceMicButton from '../components/VoiceMicButton'
import QuoteBar from '../components/QuoteBar'
import StreakBadge from '../components/StreakBadge'
import { PageHeader, Skeleton } from '../components/UI'
import { useAuth } from '../context/AuthContext'
import { api } from '../services/api'
import { clearInterviewDraft, getInterviewDraft, saveInterviewDraft, saveInterviewSession } from '../utils/interviews'

const initialForm = {
  role: '',
  company: '',
  seniority: 'mid-level',
  focus: 'communication, ownership, problem solving',
  tone: 'professional',
  goal: 'Perform with confidence in a realistic mock interview',
}

const templates = [
  { label: 'Frontend', role: 'Senior Frontend Engineer', company: 'Studio Forge', focus: 'system design, accessibility, product thinking', tone: 'professional' },
  { label: 'Product', role: 'Product Manager', company: 'Northstar', focus: 'roadmaps, tradeoffs, analytics, stakeholder management', tone: 'friendly' },
  { label: 'Leadership', role: 'Engineering Manager', company: 'Flux Labs', focus: 'team health, hiring, coaching, execution', tone: 'high-pressure' },
]

export default function InterviewBuilder() {
  const navigate = useNavigate()
  const location = useLocation()
  const { userId } = useAuth()
  const [form, setForm] = useState(initialForm)
  const [voiceTarget, setVoiceTarget] = useState('role')
  const [creating, setCreating] = useState(false)
  const [preview, setPreview] = useState(null)

  useEffect(() => {
    const draft = getInterviewDraft()
    if (draft) setForm(prev => ({ ...prev, ...draft }))
  }, [])

  useEffect(() => {
    const preset = location.state
    if (preset) setForm(prev => ({ ...prev, ...preset }))
  }, [location.state])

  useEffect(() => {
    saveInterviewDraft(form)
  }, [form])

  const isReady = useMemo(() => form.role.trim().length > 1, [form.role])

  const setField = (field, value) => setForm(current => ({ ...current, [field]: value }))

  const applyTemplate = template => {
    setForm(current => ({ ...current, ...template }))
    toast.success(`${template.label} preset loaded`)
  }

  const handleVoiceResult = text => {
    setField(voiceTarget, text)
    toast.success(`Voice captured for ${voiceTarget}`)
  }

  const createInterview = async event => {
    event.preventDefault()
    if (!isReady) return toast.error('Add a role first')

    setCreating(true)
    try {
      const response = await api.createInterview({ ...form, userId })
      const session = saveInterviewSession({
        id: response.sessionId,
        title: response.plan?.title || `${form.role} interview`,
        role: form.role,
        company: form.company,
        seniority: form.seniority,
        focus: form.focus,
        tone: form.tone,
        goal: form.goal,
        plan: response.plan,
        status: 'live',
        score: 0,
        transcript: [
          { speaker: 'interviewer', text: response.plan?.openingLine || response.plan?.description || 'Welcome to your mock interview.', kind: 'opening' },
        ],
        audioUrl: response.audioUrl || response.audio || '',
        currentIndex: 0,
        updatedAt: new Date().toISOString(),
      })
      clearInterviewDraft()
      setPreview(session)
      toast.success('Interview created')
      navigate(`/interviews/live/${response.sessionId}`)
    } catch (err) {
      toast.error(err.message || 'Could not create interview')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="page-wrapper">
      <div className="page-content">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
          <PageHeader icon={Sparkles} color="#06b6d4" title="Create Interview" sub="Set the role, focus, and tone. Groq builds the interview. Murf voices the opener." />
          <QuoteBar section="interview" color="#06b6d4" />

          <div className="card" style={{ padding: 18, marginBottom: 14, background: 'linear-gradient(135deg, rgba(6,182,212,0.12), rgba(139,92,246,0.10))' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text1)', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                  <LayoutGrid size={13} /> Quick start
                </div>
                <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--text1)', marginBottom: 6 }}>Load a realistic interview preset in one click.</div>
                <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.7, maxWidth: 720 }}>Use a template to prefill the role, company, focus, and tone, then refine with voice or keyboard. It makes the mock interview flow feel faster and more polished.</div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {templates.map(template => (
                  <button key={template.label} type="button" onClick={() => applyTemplate(template)} style={{ padding: '8px 12px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--glass)', color: 'var(--text1)', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
                    {template.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
            <StreakBadge />
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['role', 'focus', 'goal'].map(target => (
                <button key={target} onClick={() => setVoiceTarget(target)} style={{ padding: '6px 12px', borderRadius: 999, border: `1px solid ${voiceTarget === target ? 'rgba(6,182,212,0.35)' : 'var(--border)'}`, background: voiceTarget === target ? 'rgba(6,182,212,0.12)' : 'var(--glass)', color: voiceTarget === target ? '#06b6d4' : 'var(--text2)', fontSize: 11, fontWeight: 800, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Voice fills {target}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={createInterview} className="card" style={{ padding: 18 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14 }}>
              <div>
                <label className="lbl">Role</label>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <input className="inp" value={form.role} onChange={e => setField('role', e.target.value)} placeholder="Senior Frontend Engineer" style={{ flex: 1 }} />
                  <VoiceMicButton onResult={handleVoiceResult} />
                </div>
              </div>
              <div>
                <label className="lbl">Company</label>
                <input className="inp" value={form.company} onChange={e => setField('company', e.target.value)} placeholder="Acme Labs" />
              </div>
              <div>
                <label className="lbl">Seniority</label>
                <select className="inp" value={form.seniority} onChange={e => setField('seniority', e.target.value)}>
                  {['entry-level', 'mid-level', 'senior', 'staff', 'lead'].map(option => <option key={option} value={option}>{option}</option>)}
                </select>
              </div>
              <div>
                <label className="lbl">Tone</label>
                <select className="inp" value={form.tone} onChange={e => setField('tone', e.target.value)}>
                  {['professional', 'friendly', 'high-pressure', 'calm'].map(option => <option key={option} value={option}>{option}</option>)}
                </select>
              </div>
            </div>

            <div style={{ marginTop: 14 }}>
              <label className="lbl">Focus areas</label>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <textarea className="inp" value={form.focus} onChange={e => setField('focus', e.target.value)} rows={3} placeholder="system design, leadership, product sense" style={{ flex: 1, resize: 'vertical' }} />
                <VoiceMicButton onResult={handleVoiceResult} />
              </div>
            </div>

            <div style={{ marginTop: 14 }}>
              <label className="lbl">Interview goal</label>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <textarea className="inp" value={form.goal} onChange={e => setField('goal', e.target.value)} rows={3} placeholder="Land the job with crisp answers and strong examples" style={{ flex: 1, resize: 'vertical' }} />
                <VoiceMicButton onResult={handleVoiceResult} />
              </div>
            </div>

            <div style={{ marginTop: 18, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button className="btn" type="submit" disabled={creating || !isReady}>
                {creating ? <><span className="spin" /> Generating interview...</> : <><WandSparkles size={14} /> Build interview</>}
              </button>
              <button type="button" className="btn" onClick={() => navigate('/')} style={{ background: 'var(--glass)', color: 'var(--text2)' }}>
                <ChevronsRight size={14} /> Back to dashboard
              </button>
            </div>
          </form>

          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 14, marginTop: 14 }}>
            <div className="card" style={{ padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Bot size={18} color="#06b6d4" />
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text1)' }}>How it works</div>
              </div>
              <div style={{ display: 'grid', gap: 10 }}>
                {[
                  ['Groq creates', 'A structured interview with questions, rubric, and coaching notes.'],
                  ['Murf speaks', 'The opener is narrated with a polished interviewer voice.'],
                  ['Voice input', 'Use the mic to fill the role, focus, or goal fields.'],
                  ['Save drafts', 'Your interview setup stays available until you launch it.'],
                ].map(([title, desc]) => (
                  <div key={title} style={{ padding: 12, borderRadius: 14, background: 'var(--glass)', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text1)', marginBottom: 4 }}>{title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>{desc}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="card" style={{ padding: 18, background: 'linear-gradient(180deg, rgba(6,182,212,0.08), rgba(139,92,246,0.08))' }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Preview</div>
              {creating && !preview ? <Skeleton height={220} /> : (
                <div style={{ display: 'grid', gap: 12 }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text1)', lineHeight: 1.2 }}>{preview?.title || form.role || 'Your interview will appear here'}</div>
                  <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>{preview?.plan?.description || '6-question interview with a live opener, coaching notes, and final feedback summary.'}</div>
                  <div style={{ display: 'grid', gap: 8 }}>
                    <div style={{ padding: 12, borderRadius: 14, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Voice opener</div>
                      <div style={{ fontSize: 13, color: 'var(--text1)', lineHeight: 1.6 }}>{preview?.plan?.openingLine || 'The interviewer opener will be voiced by Murf.'}</div>
                    </div>
                    <div style={{ padding: 12, borderRadius: 14, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Question count</div>
                      <div style={{ fontSize: 13, color: 'var(--text1)', lineHeight: 1.6 }}>6 tailored questions plus a final review</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}