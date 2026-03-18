import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import generateRoutes from './routes/generate.js'
import historyRoutes from './routes/history.js'
import testRoutes from './routes/test.js'

dotenv.config()

// Debug: Check environment variables
console.log('Environment variables loaded:')
console.log('- PORT:', process.env.PORT)
console.log('- MONGODB_URI:', process.env.MONGODB_URI ? 'Set' : 'NOT SET')
console.log('- GROQ_API_KEY:', process.env.GROQ_API_KEY ? 'Set' : 'NOT SET')
console.log('- MURF_API_KEY:', process.env.MURF_API_KEY ? 'Set' : 'NOT SET')

const app = express()

// CORS configuration for production
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://vortex-voice-ai.netlify.app',
  process.env.FRONTEND_URL
].filter(Boolean)

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true)
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true
}))

app.use(express.json())

// Routes
app.use('/api', generateRoutes)
app.use('/api', historyRoutes)
app.use('/api', testRoutes)

app.get('/', (req, res) => res.json({ status: 'Vortex Voice AI server running' }))

// Connect DB + start
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected')
    app.listen(process.env.PORT || 5000, () =>
      console.log(`Server running on port ${process.env.PORT || 5000}`)
    )
  })
  .catch(err => console.error('DB connection error:', err))
