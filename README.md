# Vortex Voice AI

**Live Demo:** https://murf-challenge-susantedit.netlify.app  
**Backend API:** https://buildathon-murf-ai.onrender.com  
**GitHub:** https://github.com/susantedit/buildathon-murf-ai-

A voice-first AI platform built for the Murf AI Hackathon. Combines Groq AI (llama-3.3-70b-versatile) with Murf Falcon TTS to deliver real-time voice responses across 13+ modes.

---

## Features

| Mode | Description |
|------|-------------|
| 🎬 Creator Mode | Generate scripts + voice for reels, YouTube, podcasts |
| 🧠 Life Assistant | Voice-guided advice for stress, decisions & daily life |
| 📚 Study Mode | Explain, simplify, revise, or quiz any topic — 3 depth levels |
| 🧘 Focus Mode | Custom Pomodoro timer + guided breathing + completion overlay |
| 📅 Productivity Planner | Set a goal, get a voice-guided daily plan |
| 🛡️ Safety Guardian | SOS hold button, fake call, live GPS + email alerts, weather widget |
| 🌍 Voice Translator | Translate & hear text in 80+ languages including Nepali |
| 🎙️ Podcast Studio | Turn URLs/PDFs/YouTube/prompts into multi-voice podcasts with RAG chat |
| 📖 Voice Journal | Speak your daily entry, AI reflects it back |
| 🎮 Brain Games | 12 interactive games — quiz, debate, riddles, mood, Pokémon & more |
| 📋 History | All sessions saved per user in MongoDB |

---

## Brain Games — 12 Tabs

| Tab | Description | API Used |
|-----|-------------|----------|
| 📖 Word of the Day | AI picks a word with definition, example & fun fact | Groq AI |
| 🎯 Vocab Quiz | Real trivia questions by category | Open Trivia DB (no key) |
| 🗣️ Debate Mode | Pick a topic, argue against the AI | Groq AI |
| ⚡ Speed Reader | Flash words one-by-one at adjustable WPM | — |
| 🧩 Brain Teaser | Daily riddle with hint system + fallback pool | Groq AI |
| 😊 Mood Check-in | Emoji mood picker + AI advice + 14-day history | Groq AI |
| 🎤 Pronunciation Coach | Speak a word, AI scores your pronunciation | Web Speech API + Groq |
| 🎵 Mood Music | 6 ambient tracks generated via Web Audio API | — |
| 📸 Image to Voice | Upload image, AI describes it aloud | Groq AI |
| 📰 Live News Reader | AI generates news anchor-style summary | Groq AI |
| 😂 Daily Jokes | Safe-mode jokes by category with punchline reveal | JokeAPI (no key) |
| 🎮 Pokémon Trivia | Guess Gen 1 Pokémon from silhouette | PokeAPI (no key) |

---

## Safety Guardian — Full Feature Set

- Hold SOS button 2.5s → activates emergency mode with animated progress ring
- Live GPS tracking — updates every 10 seconds
- Weather widget at SOS location (temp, wind speed, condition) via Open-Meteo
- Emergency email alerts sent instantly to saved contacts via EmailJS
- Location update emails every 2 minutes while SOS is active
- All-clear email sent automatically when SOS is cancelled
- 3 EmailJS account rotation for 600 emails/month free quota
- Fake police/ambulance/fire call with real AI dispatcher chat
- Voice trigger "Help me" → hands-free SOS activation
- Situation types: General, Followed, Medical, Harassment
- Country selector with dial codes: Nepal, India, USA, UK, Australia, Canada, Germany, France, Japan, Pakistan
- Call history saved locally with full chat transcript

---

## Free APIs Used (No Key Required)

| API | Used For |
|-----|----------|
| Open Trivia DB | Quiz questions in Brain Games |
| JokeAPI | Daily Jokes tab |
| PokeAPI | Pokémon Trivia tab |
| Open-Meteo | Weather widget on Safety page |
| Quotable API | Live motivational quotes on every page |
| Google Translate | Voice Translator (free tier) |

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

## Additional Features

- Google Sign-In via Firebase Auth
- Streak tracker with daily activity badge
- Onboarding tour for first-time users (mobile responsive)
- Response rating (thumbs up/down)
- Copy + Download on every response
- Voice input (Web Speech API) on all pages
- Mood detector — auto-selects voice tone from input
- Share button (Web Share API + clipboard fallback)
- PWA installable on mobile — auto-updates without hard refresh
- Voice speed control (0.75x – 1.5x)
- Export history as .txt
- Stats dashboard on Profile
- Keyboard shortcuts: Ctrl+Enter to submit, Escape to reset
- Live QuoteBar on every page (section-specific, fetched from Quotable API)
- Session count badge on History nav
- Confetti on SOS activation

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
VITE_EMAILJS_SERVICE_ID_2=
VITE_EMAILJS_TEMPLATE_ID_2=
VITE_EMAILJS_UPDATE_TEMPLATE_2=
VITE_EMAILJS_PUBLIC_KEY_2=
VITE_EMAILJS_SERVICE_ID_3=
VITE_EMAILJS_TEMPLATE_ID_3=
VITE_EMAILJS_UPDATE_TEMPLATE_3=
VITE_EMAILJS_PUBLIC_KEY_3=
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
