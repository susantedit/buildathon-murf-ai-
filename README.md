# 🎙️ Vortex Voice AI

> **Voice-first AI platform combining content creation, life assistance, and learning — powered by Google Gemini + Murf Falcon.**

A revolutionary platform where voice is the primary interface. Create scripts, get life guidance, learn new topics, and boost productivity—all through natural, human-like voice interaction.

---

## 📋 Table of Contents

- [Key Features](#-key-features)
- [Tech Stack](#️-tech-stack)
- [How It Works - Complete Process Flow](#-how-it-works---complete-process-flow)
- [Architecture Overview](#-architecture-overview)
- [Detailed Process Breakdown](#-detailed-process-breakdown)
- [Quick Start](#-quick-start)
- [API Documentation](#-api-documentation)
- [Project Structure](#-project-structure)
- [Troubleshooting](#-troubleshooting)

---

## ✨ Key Features

- � **Creator Mode** — Generate engaging scripts with professional voice for YouTube, TikTok, Podcasts
- 🧠 **Life Assistant** — AI mentorship for decisions, stress, and motivation
- 📚 **Study Mode** — Learn any topic with voice explanations like a personal teacher
- 🧘 **Focus Mode** — Pomodoro timer + guided breathing exercises
- 📅 **Planner** — AI-generated daily action plans for goals
- 📖 **History** — Save and revisit all past sessions
- 🌓 **Dark/Light Theme** — Beautiful glassmorphism UI with theme switcher
- 📱 **Mobile App** — Install as PWA on any device
- 🚀 **3D Animations** — Interactive 3D orb with physics

---

## 🏗️ Tech Stack

**Frontend**: React 18 + Vite + Framer Motion + Tailwind CSS  
**Backend**: Node.js + Express + MongoDB  
**AI**: Google Gemini 1.5 Flash API + Murf Falcon TTS  
**Database**: MongoDB Atlas (Cloud)  
**Deployment**: Netlify (Frontend) + Render/Railway (Backend)

---

## 🔄 How It Works - Complete Process Flow

### High-Level User Journey

```
User Input → Frontend (React) → Backend API (Express) → AI Processing (Gemini) 
→ Voice Generation (Murf) → Database Storage (MongoDB) → Audio Playback → History
```

### Step-by-Step Process

1. **User Interaction**
   - User selects a mode (Creator/Assistant/Study/Planner/Focus)
   - Enters text input (idea, problem, topic, or goal)
   - Clicks submit button

2. **Frontend Processing**
   - React component captures input
   - Validates data and shows loading state
   - Sends POST request to backend API via `api.js` service

3. **Backend Receives Request**
   - Express server receives request at specific endpoint
   - Controller validates input parameters
   - Routes to appropriate service function

4. **AI Text Generation (Gemini)**
   - Backend calls Google Gemini API with custom prompt
   - Gemini generates contextual response based on mode:
     - **Creator**: Engaging 60-90 second script
     - **Assistant**: Structured 3-4 step advice
     - **Study**: Clear educational explanation
     - **Planner**: Numbered daily action plan (max 7 steps)
   - Response text returned to controller

5. **Voice Synthesis (Murf Falcon)**
   - Backend sends generated text to Murf API
   - Smart voice selection based on mode and tone:
     - Creator: High-energy voices (Marcus, Ken, Wayne)
     - Assistant: Calm voices (Natalie, Julia)
     - Study: Teacher voices (Julia, Natalie)
     - Focus: Meditative voices (Natalie)
   - Murf returns audio file URL or base64 encoded audio

6. **Database Storage**
   - Session data saved to MongoDB:
     - Mode type
     - User input text
     - AI response text
     - Audio URL
     - Timestamp
   - Enables history tracking and retrieval

7. **Response to Frontend**
   - Backend sends JSON response:
     ```json
     {
       "text": "AI generated response...",
       "audio": "https://murf-audio-url.mp3"
     }
     ```

8. **Audio Playback**
   - Frontend receives response
   - AudioPlayer component loads audio URL
   - Waveform visualization displays
   - User can play, pause, download audio
   - Text response shown alongside audio

9. **History Management**
   - All sessions automatically saved
   - Users can view past interactions in History page
   - Delete unwanted sessions
   - Replay audio from previous sessions

---

## 🏛️ Architecture Overview

### Frontend Architecture (React + Vite)

```
client/
├── src/
│   ├── pages/              # Route components
│   │   ├── Home.jsx        # Landing page with mode selector
│   │   ├── Creator.jsx     # Script generation interface
│   │   ├── Assistant.jsx   # Life advice interface
│   │   ├── Study.jsx       # Learning interface
│   │   ├── Focus.jsx       # Meditation/Pomodoro timer
│   │   ├── Planner.jsx     # Goal planning interface
│   │   └── History.jsx     # Session history viewer
│   │
│   ├── components/         # Reusable UI components
│   │   ├── AudioPlayer.jsx      # Audio playback with waveform
│   │   ├── HeroOrb.jsx          # 3D animated orb
│   │   ├── Navbar.jsx           # Navigation bar
│   │   ├── TypewriterText.jsx   # Animated text effect
│   │   ├── UI.jsx               # Common UI elements
│   │   ├── VoiceHistorySidebar.jsx  # History sidebar
│   │   ├── WaveformPlayer.jsx   # Audio waveform visualization
│   │   └── WorkflowSteps.jsx    # Process visualization
│   │
│   ├── services/           # API communication
│   │   └── api.js          # Centralized API client
│   │
│   ├── context/            # State management
│   │   └── ThemeContext.jsx     # Dark/Light theme
│   │
│   ├── utils/              # Helper functions
│   │   ├── haptics.js           # Mobile haptic feedback
│   │   ├── moodDetector.js      # Emotion detection
│   │   ├── soundGenerator.js    # Audio utilities
│   │   └── voiceHistory.js      # History management
│   │
│   └── styles/             # CSS modules
│       ├── base.css
│       ├── components.css
│       ├── navbar.css
│       └── variables.css
```

### Backend Architecture (Node.js + Express)

```
server/
├── app.js                  # Express server setup
│
├── routes/                 # API route definitions
│   ├── generate.js         # Generation endpoints
│   └── history.js          # History endpoints
│
├── controllers/            # Business logic
│   ├── generateController.js    # Handles all generation requests
│   └── historyController.js     # Handles history CRUD
│
├── services/               # External API integrations
│   ├── geminiService.js         # Google Gemini AI integration
│   └── murfService.js           # Murf Falcon TTS integration
│
└── models/                 # Database schemas
    └── Session.js               # MongoDB session model
```

---

## 🔍 Detailed Process Breakdown

### 1. Creator Mode Process

**Purpose**: Generate professional voice scripts for content creators

**User Flow**:
```
Input: "Create a motivational reel about success"
↓
Gemini Prompt: "You are a professional content creator. Write a short, 
engaging motivational script (60-90 seconds when spoken) for: 'success'. 
Make it punchy, emotional, and ready to record."
↓
Gemini Response: "Success isn't about perfection. It's about progress..."
↓
Murf Voice: Marcus (deep, powerful male voice) at 1.05x speed
↓
Output: Text + Audio URL
↓
Saved to MongoDB as 'creator' mode session
```

**Technical Implementation**:
```javascript
// Frontend: client/src/pages/Creator.jsx
const response = await api.generateScript(text, tone)

// Backend: server/controllers/generateController.js
const responseText = await generateScript(text, tone)
const audioUrl = await textToSpeech(responseText, tone, 'creator')
await Session.create({ mode: 'creator', inputText, responseText, audioUrl })

// Gemini Service: server/services/geminiService.js
const prompt = `You are a professional content creator. Write a short, 
engaging ${tone} script (60-90 seconds when spoken) for: "${idea}". 
Make it punchy, emotional, and ready to record.`

// Murf Service: server/services/murfService.js
voiceId: 'en-US-marcus', speed: 1.05, format: 'MP3'
```

### 2. Life Assistant Mode Process

**Purpose**: Provide structured advice for personal problems

**User Flow**:
```
Input: "I'm stressed about my presentation tomorrow"
↓
Gemini Prompt: "You are a calm, wise life mentor. A person says: 
'I'm stressed about my presentation tomorrow'. Give clear, structured, 
practical advice in 3-4 steps."
↓
Gemini Response: "1. Prepare your key points tonight... 2. Practice once..."
↓
Murf Voice: Natalie (soothing female voice) at normal speed
↓
Output: Text + Audio URL
↓
Saved to MongoDB as 'assistant' mode session
```

**Technical Implementation**:
```javascript
// Frontend: client/src/pages/Assistant.jsx
const response = await api.generateAdvice(text)

// Backend: server/controllers/generateController.js
const responseText = await generateAdvice(text)
const audioUrl = await textToSpeech(responseText, 'calm', 'assistant')

// Gemini Service
const prompt = `You are a calm, wise life mentor. A person says: "${problem}". 
Give clear, structured, practical advice in 3-4 steps. Be warm, direct, 
and actionable. Keep it under 150 words.`

// Murf Service
voiceId: 'en-US-natalie', speed: 1.0, format: 'MP3'
```

### 3. Study Mode Process

**Purpose**: Explain educational topics with voice

**User Flow**:
```
Input: "Explain photosynthesis" + Mode: "simple"
↓
Gemini Prompt: "Explain 'photosynthesis' like I am 10 years old. 
Use very simple words, a fun analogy, and keep it under 100 words."
↓
Gemini Response: "Photosynthesis is like plants eating sunlight for breakfast..."
↓
Murf Voice: Natalie (gentle, patient voice)
↓
Output: Text + Audio URL
↓
Saved to MongoDB as 'study' mode session
```

**Technical Implementation**:
```javascript
// Frontend: client/src/pages/Study.jsx
const response = await api.explainTopic(topic, mode)

// Backend: server/controllers/generateController.js
const responseText = await explainTopic(topic, mode)
const audioUrl = await textToSpeech(responseText, 'teacher', 'study')

// Gemini Service - Three modes:
// 1. Normal: "Explain clearly like a great teacher"
// 2. Simple: "Explain like I am 10 years old"
// 3. Revision: "Give a quick revision summary in bullet points"

// Murf Service
voiceId: 'en-US-julia', speed: 1.0, format: 'MP3'
```

### 4. Planner Mode Process

**Purpose**: Generate actionable daily plans for goals

**User Flow**:
```
Input: "I want to learn Spanish in 3 months"
↓
Gemini Prompt: "You are a productivity coach. Create a practical, 
actionable daily plan for this goal: 'learn Spanish in 3 months'. 
Format as numbered steps. Maximum 7 steps."
↓
Gemini Response: "1. Download Duolingo and complete 15 minutes daily 
2. Watch one Spanish YouTube video..."
↓
Murf Voice: Marcus (motivational voice)
↓
Output: Text + Audio URL
↓
Saved to MongoDB as 'planner' mode session
```

**Technical Implementation**:
```javascript
// Frontend: client/src/pages/Planner.jsx
const response = await api.generatePlan(goal)

// Backend: server/controllers/generateController.js
const responseText = await generatePlan(goal)
const audioUrl = await textToSpeech(responseText, 'motivational', 'planner')

// Gemini Service
const prompt = `You are a productivity coach. Create a practical, 
actionable daily plan for this goal: "${goal}". Format your response 
ONLY as numbered steps. Maximum 7 steps. Each step should be specific 
and doable in one day.`

// Murf Service
voiceId: 'en-US-marcus', speed: 1.0, format: 'MP3'
```

### 5. Focus Mode Process

**Purpose**: Guided meditation and Pomodoro timer

**User Flow**:
```
User clicks "Start Focus Session"
↓
Predefined calm script: "Close your eyes. Take a deep breath..."
↓
Murf Voice: Natalie (meditative voice)
↓
25-minute Pomodoro timer starts
↓
Breathing exercise animations
↓
Audio plays with visual guidance
```

**Technical Implementation**:
```javascript
// Frontend: client/src/pages/Focus.jsx
// Uses predefined scripts, no Gemini call
const focusScript = "Close your eyes. Take a deep breath. Let go of distractions..."
const response = await api.textToSpeech(focusScript, 'meditation')

// Backend: server/controllers/generateController.js
const audioUrl = await textToSpeech(text, voice, 'focus')

// Murf Service
voiceId: 'en-US-natalie', speed: 0.95, format: 'MP3'
```

### 6. History Management Process

**Purpose**: Store and retrieve all user sessions

**User Flow**:
```
User navigates to History page
↓
Frontend requests: GET /api/history
↓
Backend queries MongoDB: Session.find().sort({ createdAt: -1 }).limit(50)
↓
Returns array of sessions with:
  - Mode type
  - Input text
  - Response text
  - Audio URL
  - Timestamp
↓
Frontend displays in chronological order
↓
User can replay audio or delete sessions
```

**Technical Implementation**:
```javascript
// Frontend: client/src/pages/History.jsx
const sessions = await api.getHistory()

// Backend: server/controllers/historyController.js
export async function getHistory(req, res) {
  const sessions = await Session.find().sort({ createdAt: -1 }).limit(50)
  res.json(sessions)
}

// Delete session
await api.deleteHistory(sessionId)

// Backend
export async function deleteHistory(req, res) {
  await Session.findByIdAndDelete(req.params.id)
  res.json({ success: true })
}
```

---

## 🔌 API Documentation

### Base URL
```
Development: http://localhost:5000/api
Production: https://your-backend.render.com/api
```

### Endpoints

#### 1. Generate Script (Creator Mode)
```http
POST /api/generate-script
Content-Type: application/json

Request Body:
{
  "text": "Create a motivational reel about success",
  "tone": "motivational" | "storytelling" | "serious"
}

Response:
{
  "text": "Success isn't about perfection...",
  "audio": "https://murf-audio-url.mp3"
}
```

#### 2. Generate Advice (Life Assistant)
```http
POST /api/generate-advice
Content-Type: application/json

Request Body:
{
  "text": "I'm stressed about my presentation"
}

Response:
{
  "text": "Here's what you should do: 1. Prepare...",
  "audio": "https://murf-audio-url.mp3"
}
```

#### 3. Explain Topic (Study Mode)
```http
POST /api/explain-topic
Content-Type: application/json

Request Body:
{
  "topic": "Photosynthesis",
  "mode": "normal" | "simple" | "revision"
}

Response:
{
  "text": "Photosynthesis is the process...",
  "audio": "https://murf-audio-url.mp3"
}
```

#### 4. Generate Plan (Planner Mode)
```http
POST /api/generate-plan
Content-Type: application/json

Request Body:
{
  "goal": "Learn Spanish in 3 months"
}

Response:
{
  "text": "1. Download Duolingo... 2. Watch Spanish videos...",
  "audio": "https://murf-audio-url.mp3"
}
```

#### 5. Text to Speech (Generic)
```http
POST /api/text-to-speech
Content-Type: application/json

Request Body:
{
  "text": "Any text to convert to speech",
  "voice": "calm" | "motivational" | "teacher" | "meditation"
}

Response:
{
  "audio": "https://murf-audio-url.mp3"
}
```

#### 6. Get History
```http
GET /api/history

Response:
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "mode": "creator",
    "inputText": "Create a motivational reel",
    "responseText": "Success isn't about...",
    "audioUrl": "https://murf-audio-url.mp3",
    "createdAt": "2024-03-18T10:30:00.000Z"
  },
  ...
]
```

#### 7. Delete History Item
```http
DELETE /api/history/:id

Response:
{
  "success": true
}
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- MongoDB Atlas account
- Google Gemini API Key ([Get it here](https://makersuite.google.com/app/apikey))
- Murf Falcon API Key ([Get it here](https://murf.ai/api))

### Installation

```bash
# Clone repository
git clone <your-repo-url>
cd vortex-voice-ai

# Backend setup
cd server
cp .env.example .env
# Edit .env with your API keys:
# GEMINI_API_KEY=your_key
# MURF_API_KEY=your_key
# MONGODB_URI=your_mongodb_connection_string
npm install
npm run dev

# Frontend setup (new terminal)
cd client
npm install
npm run dev
```

Visit `http://localhost:5173` 🎉

---

## 📂 Project Structure

```
vortex-voice-ai/
├── client/                      # React frontend
│   ├── public/
│   │   ├── sounds/              # Audio files
│   │   ├── sw.js                # Service worker (PWA)
│   │   └── manifest.json        # PWA manifest
│   │
│   └── src/
│       ├── pages/               # Route components
│       ├── components/          # Reusable UI
│       ├── services/            # API client
│       ├── context/             # React context
│       ├── utils/               # Helper functions
│       └── styles/              # CSS modules
│
├── server/                      # Node.js backend
│   ├── routes/                  # API routes
│   ├── controllers/             # Request handlers
│   ├── services/                # External APIs
│   ├── models/                  # MongoDB schemas
│   └── app.js                   # Express server
│
├── .env.example                 # Environment template
└── README.md                    # This file
```

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| MongoDB connection error | Check `.env` credentials, whitelist IP in Atlas |
| CORS error | Verify backend runs on `:5000`, check FRONTEND_URL |
| Audio not playing | Verify Murf API key, check API credits |
| Gemini API error | Check API key, verify quota limits |
| Slow performance | Use Chrome, check network, restart servers |
| Build errors | Delete `node_modules`, run `npm install` again |

---

## 🎨 Design Highlights

- ✨ Glassmorphism UI with animated gradients
- 🎯 Smooth Framer Motion animations
- 🌓 Dark/light theme support
- 📱 Mobile-first responsive design
- ♿ Accessibility compliant
- 3️⃣ Interactive 3D orb with mouse tracking

---

## 📱 Mobile App (PWA)

Install on any device:
- **iOS**: Safari → Share → Add to Home Screen
- **Android**: Chrome → Menu → Install App
- **Desktop**: Chrome menu → Install Vortex Voice AI

---

## 🤝 Contributing

We welcome contributions! Fork, create a feature branch, and submit a PR.

---

## 📄 License

MIT License - feel free to use for personal or commercial projects.

---

**Made with ❤️ for creators, learners, and achievers. Start using Vortex Voice AI today! 🚀**
