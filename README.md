# Vortex Voice AI

**Live Demo:** https://murf-challenge-susantedit.netlify.app  
**Backend API:** https://buildathon-murf-ai.onrender.com  
**GitHub:** https://github.com/susantedit/buildathon-murf-ai-

A voice-first AI platform built for the Murf AI Hackathon. Combines Groq AI (llama-3.3-70b-versatile) with Murf Falcon TTS to deliver real-time voice responses across 10+ modes.

---

## Features

| Mode | Description |
|------|-------------|
| 🎬 Creator Mode | Generate scripts + voice for reels, YouTube, podcasts |
| 🧠 Life Assistant | Voice-guided advice for stress, decisions & daily life |
| 📚 Study Mode | Explain, simplify, revise, or quiz any topic — 3 depth levels + quiz with scoring |
| 🧘 Focus Mode | Custom Pomodoro timer + guided breathing + completion overlay |
| 📅 Productivity Planner | Set a goal, get a voice-guided daily plan |
| 🛡️ Safety Guardian | SOS hold button, fake police call, live GPS + email alerts to contacts |
| 🌍 Voice Translator | Translate & hear text in 80+ languages including Nepali |
| 🎙️ Podcast Studio | Turn URLs/PDFs/YouTube/prompts into multi-voice podcasts with RAG chat |
| 📖 Voice Journal | Speak your daily entry, AI reflects it back |
| 📋 History | All sessions saved per user in MongoDB |

### Safety Guardian — Full Feature Set
- Hold SOS button 3s → activates emergency mode with progress ring
- Live GPS tracking — updates every 10 seconds
- Emergency email alerts sent instantly to saved contacts via EmailJS
- Location update emails every 2 minutes while SOS is active
- All-clear email sent automatically when SOS is cancelled
- 3 EmailJS account rotation for 600 emails/month free quota
- Fake police/ambulance/fire call with real AI dispatcher chat
- Voice trigger "Help me" → hands-free SOS activation
- Situation types: General, Followed, Medical, Harassment
- Country selector for local emergency numbers (Nepal, India, USA, UK, Australia)
- Call history saved locally

### Additional Features
- Google Sign-In via Firebase Auth
- Streak tracker with daily activity badge
- Onboarding tour for first-time users (mobile responsive)
- Response rating (thumbs up/down)
- Copy + Download on every response
- Copy as Markdown (Creator)
- Language selector on AI responses
- Loading skeleton screens
- Daily notification/reminder system
- Voice input (Web Speech API) on all pages
- Mood detector — auto-selects voice tone from input
- Share button (Web Share API + clipboard fallback)
- PWA installable on mobile — auto-updates without hard refresh
- Voice speed control (0.75x – 1.5x)
- Export history as .txt
- Stats dashboard on Profile
- Keyboard shortcuts: Ctrl+Enter to submit, Escape to reset
- Motivational QuoteBar on every page (section-specific quotes)
- ⚡ Powered by Murf Falcon badge on every audio response
- Session count badge on History nav
- Confetti on SOS activation

---

## Tech Stack

- **Frontend:** React + Vite, Framer Motion, Tailwind CSS, Firebase Auth
- **Backend:** Node.js + Express, MongoDB (Mongoose)
- **AI:** Groq API (llama-3.3-70b-versatile) with multi-key fallback
- **TTS:** Murf Falcon API
- **Translation:** Google Translate (free, no key needed)
- **Email:** EmailJS (frontend, no backend needed) — 3-account rotation
- **Hosting:** Netlify (frontend) + Render (backend)

---

## Setup

```bash
# Clone
git clone https://github.com/susantedit/buildathon-murf-ai-

# Install
cd client && npm install
cd ../server && npm install

# Configure env vars (see .env.example files)
# client/.env  — Firebase config, VITE_API_URL, VITE_EMAILJS_*
# server/.env  — GROQ_API_KEY, MURF_API_KEY, MONGODB_URI

# Run
cd client && npm run dev
cd server && node app.js
```

### Required Environment Variables

**Netlify (client):**
```
VITE_API_URL=https://buildathon-murf-ai.onrender.com
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_EMAILJS_SERVICE_ID=
VITE_EMAILJS_TEMPLATE_ID=
VITE_EMAILJS_UPDATE_TEMPLATE=
VITE_EMAILJS_PUBLIC_KEY=
```

**Render (server):**
```
MONGODB_URI=
GROQ_API_KEY=
MURF_API_KEY=
```

---

## Contact

susantedit@gmail.com
