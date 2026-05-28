import { useRef } from 'react'
import { motion } from 'framer-motion'
import { Mic, Brain, Shield, Zap, Globe, Users, Code2, Activity, Bug, Cpu } from 'lucide-react'
import FloatingPanel from './FloatingPanel'
import AIGlobe from './AIGlobe'

const sectionVariant = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' } },
}

const TIMELINE = [
  { year: 'Idea',    label: 'Problem Identified',   desc: 'Users switch between 5+ apps for AI help. No single voice-first system existed.',  color: '#4F8CFF' },
  { year: 'Build',   label: 'Core Engine Built',     desc: 'Murf Falcon TTS + Groq AI + Firebase Auth wired into a unified voice pipeline.',    color: '#A855F7' },
  { year: 'Expand',  label: 'CageBait Added',        desc: 'First AI scam honeypot with 3 distinct Murf Falcon personas. Genuinely novel.',     color: '#ef4444' },
  { year: 'Adapt',   label: 'Cognitive Engine',      desc: 'Behavioral signals drive voice tone selection in real time. The system learns you.', color: '#22d3ee' },
  { year: 'Launch',  label: 'VortexOS Ships',        desc: 'A spatial AI interface — not a website, not a dashboard. An operating system.',     color: '#10b981' },
]

const TECH_STACK = [
  { name: 'Murf Falcon',  role: 'Voice Intelligence',  color: '#4F8CFF', icon: '🎙️' },
  { name: 'Groq AI',      role: 'LLM Reasoning',       color: '#A855F7', icon: '🧠' },
  { name: 'Firebase',     role: 'Auth + Identity',     color: '#f59e0b', icon: '🔐' },
  { name: 'MongoDB',      role: 'Memory Graph',        color: '#10b981', icon: '🗄️' },
  { name: 'React + Vite', role: 'Frontend Engine',     color: '#22d3ee', icon: '⚡' },
  { name: 'Node.js',      role: 'Backend API',         color: '#84cc16', icon: '🔧' },
]

const STATS = [
  { value: '6',    label: 'AI Pillars',      color: '#4F8CFF' },
  { value: '3',    label: 'Murf Personas',   color: '#A855F7' },
  { value: '80+',  label: 'Languages',       color: '#22d3ee' },
  { value: '10',   label: 'Session Memory',  color: '#f59e0b' },
  { value: '4',    label: 'Adaptive Modes',  color: '#10b981' },
  { value: '∞',    label: 'Scammers Wasted', color: '#ef4444' },
]

const IMPACT = [
  { Icon: Users,  label: 'Students',  desc: 'Voice-guided study, focus, and planning tools that adapt to stress levels.',  color: '#4F8CFF' },
  { Icon: Mic,    label: 'Creators',  desc: 'Script generation, podcast production, and multilingual voice output.',        color: '#A855F7' },
  { Icon: Shield, label: 'Safety',    desc: 'Emergency SOS with live GPS, email alerts, and fake call escape tools.',       color: '#ef4444' },
  { Icon: Bug,    label: 'Defenders', desc: 'CageBait deploys AI personas to waste scammers\' time and extract intel.',     color: '#f59e0b' },
]

export default function AboutSection() {
  return (
    <section id="about" style={{ position: 'relative', zIndex: 1, padding: '0 24px 120px' }}>
      <div style={{ maxWidth: 1080, margin: '0 auto' }}>

        {/* ── BIG STATEMENT ── */}
        <motion.div
          variants={sectionVariant} initial="hidden" whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          style={{ textAlign: 'center', marginBottom: 80 }}
        >
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            padding: '5px 16px', borderRadius: 999,
            background: 'rgba(79,140,255,0.10)', border: '1px solid rgba(79,140,255,0.25)',
            fontSize: 12, fontWeight: 700, color: '#4F8CFF', marginBottom: 24,
          }}>
            <Brain size={12} /> About VortexOS
          </div>

          <h2 style={{
            fontFamily: "'Space Grotesk', system-ui, sans-serif",
            fontWeight: 900,
            fontSize: 'clamp(1.8rem, 4vw, 3rem)',
            lineHeight: 1.1,
            letterSpacing: '-0.04em',
            color: '#f0f4ff',
            marginBottom: 20,
          }}>
            VortexOS is not an app.
            <br />
            <span style={{
              background: 'linear-gradient(135deg, #4F8CFF, #A855F7, #22d3ee)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              It is a voice-first operating system.
            </span>
          </h2>

          <p style={{
            fontSize: 'clamp(14px, 1.8vw, 18px)',
            color: '#94a3b8',
            lineHeight: 1.8,
            maxWidth: 680,
            margin: '0 auto',
          }}>
            Designed to assist, protect, and empower users in real time — through voice, intelligence, and adaptive UI that responds to how you think and feel.
          </p>
        </motion.div>

        {/* ── PROBLEM → SOLUTION (two column) ── */}
        <motion.div
          variants={sectionVariant} initial="hidden" whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24, marginBottom: 80 }}
        >
          <FloatingPanel glowColor="#ef4444" style={{ padding: 32 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>
              The Problem
            </div>
            <h3 style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif", fontWeight: 700, fontSize: 20, color: '#f0f4ff', marginBottom: 16, lineHeight: 1.3 }}>
              People are overwhelmed by fragmented tools
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                'Switch between 5+ apps for AI help',
                'No real-time voice-first intelligence',
                'Scammers exploit the vulnerable daily',
                'AI responses feel generic, not personal',
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: '#94a3b8', lineHeight: 1.5 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', flexShrink: 0, marginTop: 6 }} />
                  {item}
                </div>
              ))}
            </div>
          </FloatingPanel>

          <FloatingPanel glowColor="#10b981" style={{ padding: 32 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>
              The Solution
            </div>
            <h3 style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif", fontWeight: 700, fontSize: 20, color: '#f0f4ff', marginBottom: 16, lineHeight: 1.3 }}>
              One system that understands intent and acts instantly
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                'Voice → AI → Action in one seamless loop',
                'Murf Falcon adapts tone to your emotional state',
                'CageBait turns scammers into intelligence sources',
                '10-session memory makes every response personal',
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: '#94a3b8', lineHeight: 1.5 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', flexShrink: 0, marginTop: 6 }} />
                  {item}
                </div>
              ))}
            </div>
          </FloatingPanel>
        </motion.div>

        {/* ── STATS COUNTER ── */}
        <motion.div
          variants={sectionVariant} initial="hidden" whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          style={{ marginBottom: 80 }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 14 }}>
            {STATS.map(({ value, label, color }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, type: 'spring', stiffness: 300 }}
              >
                <FloatingPanel glowColor={color} style={{ padding: '20px 16px', textAlign: 'center' }}>
                  <div style={{
                    fontSize: 'clamp(1.8rem, 3vw, 2.6rem)',
                    fontWeight: 900,
                    fontFamily: "'Space Grotesk', system-ui, sans-serif",
                    background: `linear-gradient(135deg, ${color}, ${color}88)`,
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    marginBottom: 6,
                    textShadow: 'none',
                  }}>
                    {value}
                  </div>
                  <div style={{ fontSize: 11, color: '#4a5568', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                    {label}
                  </div>
                </FloatingPanel>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── HOW IT WORKS (pipeline) ── */}
        <motion.div
          variants={sectionVariant} initial="hidden" whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          style={{ marginBottom: 80 }}
        >
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#A855F7', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
              How It Works
            </div>
            <h3 style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif", fontWeight: 800, fontSize: 'clamp(1.4rem, 2.5vw, 2rem)', color: '#f0f4ff', letterSpacing: '-0.03em' }}>
              The cognitive voice loop
            </h3>
          </div>

          {/* Pipeline visualization */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, flexWrap: 'wrap', rowGap: 12, marginBottom: 32 }}>
            {[
              { label: 'User Speaks',    icon: '🎤', color: '#4F8CFF' },
              { label: 'STT Captures',   icon: '📡', color: '#A855F7' },
              { label: 'Groq Reasons',   icon: '🧠', color: '#22d3ee' },
              { label: 'Murf Speaks',    icon: '🔊', color: '#f59e0b' },
              { label: 'UI Adapts',      icon: '✨', color: '#10b981' },
            ].map((step, i, arr) => (
              <div key={step.label} style={{ display: 'flex', alignItems: 'center' }}>
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.12 }}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                    padding: '16px 20px', borderRadius: 16,
                    background: `${step.color}10`,
                    border: `1px solid ${step.color}30`,
                    minWidth: 100,
                  }}
                >
                  <div style={{ fontSize: 24 }}>{step.icon}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: step.color, textAlign: 'center', lineHeight: 1.3 }}>
                    {step.label}
                  </div>
                </motion.div>
                {i < arr.length - 1 && (
                  <motion.div
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.12 + 0.1 }}
                    style={{
                      width: 32, height: 2,
                      background: `linear-gradient(90deg, ${step.color}60, ${arr[i + 1].color}60)`,
                      transformOrigin: 'left',
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── WHAT MAKES IT UNIQUE ── */}
        <motion.div
          variants={sectionVariant} initial="hidden" whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          style={{ marginBottom: 80 }}
        >
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#22d3ee', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
              Differentiators
            </div>
            <h3 style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif", fontWeight: 800, fontSize: 'clamp(1.4rem, 2.5vw, 2rem)', color: '#f0f4ff', letterSpacing: '-0.03em' }}>
              Not feature-based. Intent-based.
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {[
              { icon: '🎯', title: 'Intent-Based',  desc: 'The system understands what you need, not just what you type. Voice + context = action.',  color: '#4F8CFF' },
              { icon: '🔮', title: 'Predictive',    desc: 'Cognitive engine anticipates your state and adapts voice tone before you ask.',             color: '#A855F7' },
              { icon: '🌊', title: 'Adaptive UI',   desc: 'The entire interface palette shifts based on your mood — debugging, learning, exploring.',   color: '#22d3ee' },
              { icon: '🎭', title: 'CageBait',      desc: 'The only AI system that fights back against scammers using voice personas and intel mining.', color: '#ef4444' },
              { icon: '🧠', title: 'Memory Graph',  desc: '10-session persistent memory with topic extraction makes every response feel personal.',      color: '#10b981' },
              { icon: '🌍', title: 'Multilingual',  desc: '80+ languages with Murf Falcon TTS — not translated text, but native-sounding voice.',       color: '#f59e0b' },
            ].map(({ icon, title, desc, color }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <FloatingPanel glowColor={color} style={{ padding: 22, height: '100%' }}>
                  <div style={{ fontSize: 28, marginBottom: 12 }}>{icon}</div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#f0f4ff', marginBottom: 8 }}>{title}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.65 }}>{desc}</div>
                </FloatingPanel>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── TIMELINE ── */}
        <motion.div
          variants={sectionVariant} initial="hidden" whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          style={{ marginBottom: 80 }}
        >
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h3 style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif", fontWeight: 800, fontSize: 'clamp(1.4rem, 2.5vw, 2rem)', color: '#f0f4ff', letterSpacing: '-0.03em' }}>
              Build Timeline
            </h3>
          </div>

          <div style={{ position: 'relative', maxWidth: 700, margin: '0 auto' }}>
            {/* Vertical line */}
            <div style={{
              position: 'absolute', left: 20, top: 0, bottom: 0, width: 2,
              background: 'linear-gradient(to bottom, #4F8CFF, #A855F7, #22d3ee, #10b981, #f59e0b)',
              opacity: 0.3,
            }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {TIMELINE.map(({ year, label, desc, color }, i) => (
                <motion.div
                  key={year}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}
                >
                  {/* Dot */}
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                    background: `${color}18`, border: `2px solid ${color}60`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 9, fontWeight: 800, color, textTransform: 'uppercase',
                    letterSpacing: '0.04em', boxShadow: `0 0 12px ${color}33`,
                  }}>
                    {year}
                  </div>

                  <FloatingPanel glowColor={color} style={{ flex: 1, padding: '14px 18px' }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#f0f4ff', marginBottom: 4 }}>{label}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6 }}>{desc}</div>
                  </FloatingPanel>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ── TECH STACK ── */}
        <motion.div
          variants={sectionVariant} initial="hidden" whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          style={{ marginBottom: 80 }}
        >
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <h3 style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif", fontWeight: 800, fontSize: 'clamp(1.4rem, 2.5vw, 2rem)', color: '#f0f4ff', letterSpacing: '-0.03em', marginBottom: 8 }}>
              Built on world-class tech
            </h3>
            <p style={{ fontSize: 13, color: '#94a3b8' }}>Every layer chosen for performance, reliability, and voice-first design.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
            {TECH_STACK.map(({ name, role, color, icon }, i) => (
              <motion.div
                key={name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
              >
                <FloatingPanel glowColor={color} style={{ padding: '16px 14px', textAlign: 'center' }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>
                  <div style={{ fontWeight: 800, fontSize: 13, color: '#f0f4ff', marginBottom: 4 }}>{name}</div>
                  <div style={{ fontSize: 10, color, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{role}</div>
                </FloatingPanel>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── IMPACT ── */}
        <motion.div
          variants={sectionVariant} initial="hidden" whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
        >
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <h3 style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif", fontWeight: 800, fontSize: 'clamp(1.4rem, 2.5vw, 2rem)', color: '#f0f4ff', letterSpacing: '-0.03em', marginBottom: 8 }}>
              Who it helps
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
            {IMPACT.map(({ Icon, label, desc, color }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <FloatingPanel glowColor={color} style={{ padding: 22 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 14,
                    background: `${color}18`, border: `1px solid ${color}35`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: 14,
                  }}>
                    <Icon size={22} color={color} />
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#f0f4ff', marginBottom: 8 }}>{label}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.65 }}>{desc}</div>
                </FloatingPanel>
              </motion.div>
            ))}
          </div>
        </motion.div>

      </div>
    </section>
  )
}
