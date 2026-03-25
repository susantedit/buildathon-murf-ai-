import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export const QUOTES = {
  assistant: [
    { text: 'You are stronger than you think, braver than you feel, and more capable than you imagine.', author: 'susantedit' },
    { text: 'Every storm runs out of rain. Keep going — your breakthrough is closer than you think.', author: 'susantedit' },
    { text: 'In the middle of every difficulty lies opportunity. Seize it.', author: 'Albert Einstein' },
    { text: 'Talk to yourself like someone you love. You deserve that kindness.', author: 'Brené Brown' },
    { text: 'The comeback is always stronger than the setback.', author: 'susantedit' },
    { text: 'You didn\'t come this far to only come this far. Push through.', author: 'susantedit' },
  ],
  creator: [
    { text: 'Your voice has the power to move people. Use it — the world is waiting.', author: 'susantedit' },
    { text: 'Creativity is intelligence having fun. Let it run wild today.', author: 'Albert Einstein' },
    { text: 'Done is better than perfect. Ship it, learn, and level up.', author: 'Sheryl Sandberg' },
    { text: 'One piece of content can change your life. Start creating now.', author: 'susantedit' },
    { text: 'The best creators don\'t wait for inspiration — they create it.', author: 'susantedit' },
    { text: 'Your story is your superpower. Tell it boldly and unapologetically.', author: 'susantedit' },
  ],
  study: [
    { text: 'Every expert was once a beginner. Every pro was once an amateur. Keep learning.', author: 'susantedit' },
    { text: 'An investment in knowledge pays the best interest — always.', author: 'Benjamin Franklin' },
    { text: 'The more you learn, the more you earn — in every sense of the word.', author: 'susantedit' },
    { text: 'Knowledge is the one thing no one can ever take from you. Collect it fiercely.', author: 'susantedit' },
    { text: 'Study hard today so your future self can live the life you dream of.', author: 'susantedit' },
    { text: 'Your brain is a muscle. Every study session makes it stronger.', author: 'susantedit' },
  ],
  focus: [
    { text: 'Where focus goes, energy flows. Direct yours with intention.', author: 'Tony Robbins' },
    { text: 'One hour of deep focus beats eight hours of distracted work.', author: 'susantedit' },
    { text: 'The successful warrior is the average person with laser-like focus.', author: 'Bruce Lee' },
    { text: 'Protect your focus like it\'s your most valuable asset — because it is.', author: 'susantedit' },
    { text: 'You are one focused session away from a breakthrough.', author: 'susantedit' },
    { text: 'Silence the noise. Do the work. The results will speak for themselves.', author: 'susantedit' },
  ],
  planner: [
    { text: 'A goal without a plan is just a wish. Make it real — plan it today.', author: 'Antoine de Saint-Exupéry' },
    { text: 'Small daily improvements over time lead to stunning results.', author: 'Robin Sharma' },
    { text: 'The secret of getting ahead is getting started. Right now.', author: 'Mark Twain' },
    { text: 'Plan your work, work your plan, and watch your dreams become reality.', author: 'Napoleon Hill' },
    { text: 'Every big achievement started with a single step on a single day.', author: 'susantedit' },
    { text: 'You don\'t rise to the level of your goals — you fall to the level of your systems.', author: 'James Clear' },
  ],
  journal: [
    { text: 'Writing is how you discover what you truly think and feel. Be honest with yourself.', author: 'susantedit' },
    { text: 'Your journal is a safe space where your truest self can speak freely.', author: 'susantedit' },
    { text: 'The act of writing is the act of discovering what you believe.', author: 'David Hare' },
    { text: 'Fill your paper with the breathings of your heart — no filter needed.', author: 'William Wordsworth' },
    { text: 'Journaling turns chaos into clarity. Write it out.', author: 'susantedit' },
    { text: 'One day you\'ll read these words and be amazed at how far you\'ve come.', author: 'susantedit' },
  ],
  podcast: [
    { text: 'Your voice is the most powerful instrument you own. Use it to move the world.', author: 'susantedit' },
    { text: 'Great stories don\'t just happen — they\'re crafted by people brave enough to tell them.', author: 'Ira Glass' },
    { text: 'Storytelling is the most powerful way to put ideas into the world today.', author: 'Robert McKee' },
    { text: 'One podcast episode can reach someone who needed to hear exactly that today.', author: 'susantedit' },
    { text: 'The world needs your perspective. Record it. Share it. Impact lives.', author: 'susantedit' },
    { text: 'Every great podcast started with someone who just decided to hit record.', author: 'susantedit' },
  ],
  translator: [
    { text: 'To have another language is to possess a second soul.', author: 'Charlemagne' },
    { text: 'Language is the bridge between cultures. Build more bridges.', author: 'susantedit' },
    { text: 'Every language you learn opens a new world of people, ideas, and possibilities.', author: 'susantedit' },
    { text: 'One language sets you in a corridor for life. Two languages open every door.', author: 'Frank Smith' },
    { text: 'Speaking someone\'s language is the greatest act of respect you can offer.', author: 'susantedit' },
    { text: 'The more languages you know, the more human you become.', author: 'susantedit' },
  ],
  safety: [
    { text: 'You are braver than you believe, stronger than you seem, and smarter than you think.', author: 'A.A. Milne' },
    { text: 'She remembered who she was — and the game changed entirely.', author: 'Lalah Delia' },
    { text: 'Courage is not the absence of fear. It\'s deciding that something else matters more.', author: 'Ambrose Redmoon' },
    { text: 'Your safety matters. Your voice matters. You matter.', author: 'susantedit' },
    { text: 'The most powerful thing you can do is trust yourself and take action.', author: 'susantedit' },
    { text: 'You are not alone. Help is always within reach.', author: 'susantedit' },
  ],
  history: [
    { text: 'First, solve the problem. Then, write the code.', author: 'John Johnson' },
    { text: 'Every session you complete is proof that you showed up. That\'s everything.', author: 'susantedit' },
    { text: 'Progress is the sum of small wins. Look how many you\'ve stacked.', author: 'susantedit' },
    { text: 'Your history is your proof of growth. Be proud of every entry.', author: 'susantedit' },
    { text: 'Consistency beats intensity every time. Keep showing up.', author: 'susantedit' },
    { text: 'The person you\'re becoming is built one session at a time.', author: 'susantedit' },
  ],
  profile: [
    { text: '🚀 Building cool things with code while exploring AI, Generative AI, and Cybersecurity.', author: 'susantedit' },
    { text: 'First, solve the problem. Then, write the code.', author: 'John Johnson' },
    { text: 'Your vibe attracts your tribe. Keep building, keep growing.', author: 'susantedit' },
    { text: 'The best investment you can make is in yourself.', author: 'Warren Buffett' },
    { text: 'Every day is a chance to level up. Show up and do the work.', author: 'susantedit' },
    { text: 'Code is poetry. Make yours worth reading.', author: 'susantedit' },
  ],
  home: [
    { text: '🚀 Building cool things with code while exploring AI, Generative AI, and Cybersecurity.', author: 'susantedit' },
    { text: 'First, solve the problem. Then, write the code.', author: 'John Johnson' },
    { text: 'The best way to predict the future is to build it yourself.', author: 'Peter Drucker' },
    { text: 'AI is not a replacement for human creativity — it\'s a supercharger for it.', author: 'susantedit' },
    { text: 'Build things that matter. Ship things that help. Change lives.', author: 'susantedit' },
    { text: 'Every great product started as someone\'s crazy idea. Keep building.', author: 'susantedit' },
    { text: 'Voice is the most natural interface humans have ever had. We\'re just getting started.', author: 'susantedit' },
  ],
}

export default function QuoteBar({ section = 'home', color = '#8b5cf6' }) {
  const quotes = QUOTES[section] || QUOTES.home
  const [idx, setIdx] = useState(() => Math.floor(Math.random() * quotes.length))
  const [liveQuote, setLiveQuote] = useState(null)

  // Quotable API is down (expired cert) — use local quotes only
  // Cycle every 7 seconds
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % quotes.length), 7000)
    return () => clearInterval(t)
  }, [quotes.length])

  const q = liveQuote || quotes[idx]

  return (
    <div style={{
      marginBottom: 20, padding: '12px 16px', borderRadius: 12,
      background: `${color}0d`, border: `1px solid ${color}22`,
      display: 'flex', alignItems: 'flex-start', gap: 10,
    }}>
      <span style={{ fontSize: 15, flexShrink: 0, marginTop: 2 }}>✨</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <AnimatePresence mode="wait">
          <motion.div key={idx}
            initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.3 }}>
            <div style={{ fontSize: 12, fontStyle: 'italic', color: 'var(--text2)', lineHeight: 1.65 }}>
              "{q.text}"
            </div>
            <div style={{ fontSize: 11, color, fontWeight: 700, marginTop: 5 }}>
              — {q.author}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
      {/* Clickable dot nav */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0, paddingTop: 4 }}>
        {quotes.map((_, i) => (
          <button key={i} onClick={() => setIdx(i)}
            style={{
              width: 5, height: 5, borderRadius: '50%', border: 'none',
              cursor: 'pointer', padding: 0,
              background: i === idx ? color : `${color}35`,
              transition: 'background 0.3s, transform 0.2s',
              transform: i === idx ? 'scale(1.4)' : 'scale(1)',
            }} />
        ))}
      </div>
    </div>
  )
}

