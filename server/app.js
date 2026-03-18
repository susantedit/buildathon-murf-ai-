import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import generateRoutes from './routes/generate.js'
import historyRoutes from './routes/history.js'

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())

// Routes
app.use('/api', generateRoutes)
app.use('/api', historyRoutes)

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
