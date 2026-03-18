# 🚀 Vortex Voice AI - Complete Setup Guide

Welcome to Vortex Voice AI! A voice-powered platform for content creation, learning, and personal guidance.

---

## 📋 Prerequisites

Before starting, ensure you have:
- **Node.js** (v16+): [Download](https://nodejs.org/)
- **npm** or **yarn** package manager
- **MongoDB Atlas Account** (free tier): [Create Account](https://mongodb.com/atlas)
- **Google Gemini API Key** (free): [Get Key](https://aistudio.google.com)
- **Murf Falcon TTS API Key**: [Get Key](https://murf.ai/api-key)

---

## 🔧 Step 1: Get Your API Keys

### 1.1 MongoDB Atlas Setup
1. Go to [mongodb.com/atlas](https://mongodb.com/atlas)
2. Sign up and create a free cluster
3. In the cluster, go to **Connect** → **Drivers**
4. Copy your connection string: `mongodb+srv://username:password@cluster.mongodb.net/database`

### 1.2 Google Gemini API
1. Visit [aistudio.google.com](https://aistudio.google.com)
2. Click "Get API Key" in the left sidebar
3. Copy your API key

### 1.3 Murf Falcon TTS API
1. Go to [murf.ai](https://murf.ai)
2. Sign up and go to Dashboard
3. Navigate to **API Keys** section
4. Generate a new API key and copy it

---

## 📁 Step 2: Project Setup

### 2.1 Clone or Extract Project
```bash
cd buildathon
```

### 2.2 Server Setup
```bash
cd server

# Copy environment template and fill in your API keys
cp .env.example .env

# Edit .env with your credentials
# Linux/Mac: nano .env
# Windows: notepad .env
```

**Fill in your `.env`:**
```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@cluster.mongodb.net/vortexvoice
GEMINI_API_KEY=your_gemini_key_here
MURF_API_KEY=your_murf_key_here
FRONTEND_URL=http://localhost:5173
```

### 2.3 Install Server Dependencies
```bash
npm install
```

### 2.4 Start Backend Server
```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

Server runs at: `http://localhost:5000`

---

## 🎨 Step 3: Frontend Setup

### 3.1 Navigate to Client
```bash
cd ../client
```

### 3.2 Install Dependencies
```bash
npm install
```

### 3.3 Start Development Server
```bash
npm run dev
```

Frontend runs at: `http://localhost:5173`

---

## ✅ Step 4: Verify Everything Works

1. **Open** `http://localhost:5173` in your browser
2. **Test each mode:**
   - **Creator Mode** (🎬): Type a content idea and generate a script
   - **Assistant Mode** (🧠): Ask for advice about a problem
   - **Study Mode** (📚): Ask to explain a topic
   - **Focus Mode** (🧘): Start a focus timer
   - **Planner** (📅): Generate a daily plan for a goal
   - **History** (📖): View all past sessions

If audio plays and text generates → **Success! 🎉**

---

## 🛠️ Troubleshooting

### Issue: "API Keys Error" or "Cannot connect to MongoDB"
**Solution:**
1. Double-check `.env` file has correct credentials
2. Ensure MongoDB cluster is deployed and accessible
3. Whitelist your IP in MongoDB Atlas → Network Access

### Issue: CORS Error
**Solution:**
1. Ensure backend is running on `:5000`
2. Check `FRONTEND_URL` in `.env` matches frontend URL
3. Restart backend server

### Issue: Audio Not Playing
**Solution:**
1. Check browser console for errors
2. Verify Murf API key is valid
3. Check Murf account has credits remaining

### Issue: "Module not found" errors
**Solution:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules
npm install

# Clear npm cache
npm cache clean --force
```

---

## 📱 Mobile App Installation (PWA)

### Install as App
1. **iOS**: Open in Safari → Share → Add to Home Screen
2. **Android**: Open in Chrome → Menu → Install App → Install
3. **Desktop**: Chrome menu → Install Vortex Voice AI

The app works offline for UI, but requires internet for API calls.

---

## 🚀 Deployment

### Deploy Backend (Render, Railway, or Heroku)
1. Push code to GitHub
2. Connect to deployment platform
3. Set environment variables
4. Deploy!

### Deploy Frontend (Vercel, Netlify)
1. Build production:
```bash
npm run build
```
2. Deploy the `dist` folder
3. Update `FRONTEND_URL` in backend `.env`

---

## 📚 API Endpoints Reference

```
POST /api/generate-script      → Creator mode (text to script + voice)
POST /api/generate-advice       → Assistant mode (problem solving)
POST /api/explain-topic         → Study mode (teach me)
POST /api/generate-plan         → Planner mode (daily plan)
POST /api/text-to-speech        → Convert any text to speech
GET  /api/history               → Get all saved sessions
DELETE /api/history/:id         → Delete a session
```

---

## 🎯 Project Structure

```
vortex-voice-ai/
├── client/                 # React frontend
│   ├── src/
│   │   ├── pages/         # Page components
│   │   ├── components/    # Reusable components
│   │   ├── services/      # API calls
│   │   ├── context/       # Theme & state
│   │   └── index.css      # Styling
│   └── public/            # Static files
│
└── server/                 # Node.js backend
    ├── routes/            # API routes
    ├── controllers/       # Route handlers
    ├── models/           # MongoDB schemas
    ├── services/         # Gemini & Murf API
    └── app.js            # Express server
```

---

## 🔑 Key Features

✅ **Creator Mode** - Generate scripts for content  
✅ **Life Assistant** - Get voice advice for decisions  
✅ **Study Mode** - Learn any topic with voice  
✅ **Focus Mode** - Pomodoro timer with breathing guide  
✅ **Planner** - AI-generated daily plans  
✅ **History** - Save and replay all sessions  
✅ **Dark/Light Theme** - Beautiful UI with theme switcher  
✅ **Mobile Responsive** - Works on all devices  
✅ **PWA** - Install as native app  
✅ **3D Animations** - Interactive 3D orb  

---

## 💡 Tips for Best Experience

1. **Use Chrome/Edge** for best performance
2. **Check Murf API credits** - API calls cost credits
3. **Keep API keys safe** - Never commit `.env` to git
4. **Use shorter prompts** - Better for TTS quality
5. **Enable notifications** - Get alerts for long tasks

---

## 📞 Support

Having issues? Check:
- MongoDB: [Docs](https://docs.mongodb.com/)
- Gemini API: [Documentation](https://ai.google.dev/)
- Murf API: [Docs](https://murf.ai/docs)
- Vite: [Guide](https://vitejs.dev/)
- React: [Docs](https://react.dev/)

---

## 🎓 Next Steps

1. ✅ Setup is complete!
2. 📝 Try creating a script in Creator Mode
3. 🎯 Ask for advice in Assistant Mode
4. 📚 Learn something new in Study Mode
5. 🎉 Share your experience!

**Enjoy creating with Vortex Voice AI!** 🚀
