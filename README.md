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
| 📚 Study Mode | Explain, simplify, revise, or quiz any topic with voice |
| 🧘 Focus Mode | Pomodoro timer + AI guided meditation with Murf voice |
| 📅 Productivity Planner | Set a goal, get a voice-guided daily plan |
| 🛡️ Safety Guardian | SOS hold button, fake call screen, live GPS alerts |
| 🌍 Voice Translator | Translate & hear text in 80+ languages |
| 🎙️ Podcast Studio | Turn URLs/PDFs/prompts into multi-voice podcasts |
| 📖 Voice Journal | Speak your daily entry, AI reflects it back |
| 📋 History | All sessions saved per user in MongoDB |

### Additional Features
- Google Sign-In via Firebase Auth
- Streak tracker with daily activity badge
- Onboarding tour for first-time users
- Response rating (thumbs up/down)
- Copy + Download on every response
- Copy as Markdown (Creator)
- Language selector on AI responses (translate to Nepali, Hindi, etc.)
- Loading skeleton screens
- Daily notification/reminder system
- Voice input (Web Speech API) on all pages
- Mood detector — auto-selects voice tone from input
- Share button (Web Share API + clipboard fallback)
- PWA installable on mobile
- Voice speed control (0.75x – 1.5x)
- Export history as .txt
- Stats dashboard on Profile
- Keyboard shortcuts: Ctrl+Enter to submit, Escape to reset
- ⚡ Powered by Murf Falcon badge on every audio response
- Session count badge on History nav
- Confetti on SOS activation
- Try Demo button on Home

---

## Tech Stack

- **Frontend:** React + Vite, Framer Motion, Tailwind CSS, Firebase Auth
- **Backend:** Node.js + Express, MongoDB (Mongoose)
- **AI:** Groq API (llama-3.3-70b-versatile) with multi-key fallback
- **TTS:** Murf Falcon API
- **Translation:** Google Translate (free, no key)
- **Email:** Resend API
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
# client/.env — Firebase config + VITE_API_URL
# server/.env — GROQ_API_KEY, MURF_API_KEY, MONGODB_URI, RESEND_API_KEY

# Run
cd client && npm run dev
cd server && node app.js
```

---

## Contact

susantedit@gmail.com
