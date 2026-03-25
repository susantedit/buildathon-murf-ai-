import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import generateRoutes from './routes/generate.js'
import historyRoutes from './routes/history.js'
import testRoutes from './routes/test.js'
import contactRoutes from './routes/contacts.js'
import podcastRoutes from './routes/podcast.js'
import { verifyEmailConfig } from './services/emailService.js'

dotenv.config()

// Debug: Check environment variables
console.log('Environment variables loaded:')
console.log('- PORT:', process.env.PORT)
console.log('- MONGODB_URI:', process.env.MONGODB_URI ? 'Set' : 'NOT SET')
console.log('- GROQ_API_KEY:', process.env.GROQ_API_KEY ? 'Set' : 'NOT SET')
console.log('- MURF_API_KEY:', process.env.MURF_API_KEY ? 'Set' : 'NOT SET')

const app = express()

// Raw CORS headers — absolute first middleware, catches everything including cold-start races
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*')
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,api-key,Accept')
  res.header('Access-Control-Allow-Credentials', 'true')
  if (req.method === 'OPTIONS') return res.sendStatus(204)
  next()
})

// CORS configuration for production
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://vortex-voice-ai.netlify.app',
  'https://murf-challenge-susantedit.netlify.app',
  'https://buildathon-murf-ai.vercel.app',
  'https://vortex-voice-frontend.onrender.com',
  process.env.FRONTEND_URL
].filter(Boolean)

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, curl, etc.)
    if (!origin) return callback(null, true)
    // Allow localhost dev
    if (origin.startsWith('http://localhost')) return callback(null, true)
    // Allow any Vercel or Netlify deploy URL
    if (origin.endsWith('.vercel.app') || origin.endsWith('.netlify.app')) return callback(null, true)
    // Allow explicitly listed origins
    if (allowedOrigins.includes(origin)) return callback(null, true)
    // Allow all for now (hackathon — tighten later)
    return callback(null, true)
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'api-key', 'Accept']
}))

// Explicit preflight handler — must be before routes
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*')
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,api-key,Accept')
  res.header('Access-Control-Allow-Credentials', 'true')
  res.sendStatus(204)
})

app.use(express.json({ limit: '10mb' }))

// Routes
app.use('/api', generateRoutes)
app.use('/api', historyRoutes)
app.use('/api', testRoutes)
app.use('/api', contactRoutes)
app.use('/api', podcastRoutes)

app.get('/', (req, res) => res.json({ status: 'Vortex Voice AI server running' }))
app.get('/api/ping', (req, res) => res.json({ ok: true, ts: Date.now() }))

// Connect DB + start
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected')
    verifyEmailConfig() // Check Gmail SMTP on startup
    app.listen(process.env.PORT || 5000, () =>
      console.log(`Server running on port ${process.env.PORT || 5000}`)
    )
  })
  .catch(err => console.error('DB connection error:', err))
