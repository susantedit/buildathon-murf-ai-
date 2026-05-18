import express from 'express'
import {
  handleGetPersonas,
  handleRespond,
  handleExtractIntel,
  handleEndSession,
} from '../controllers/cageBaitController.js'

const router = express.Router()

router.get('/cagebait/personas', handleGetPersonas)
router.post('/cagebait/respond', handleRespond)
router.post('/cagebait/extract-intel', handleExtractIntel)
router.post('/cagebait/end-session', handleEndSession)

export default router
