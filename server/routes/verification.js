import express from 'express'
import { handleAnalyzeVerification, handleRefreshVerification } from '../controllers/verificationController.js'

const router = express.Router()

router.post('/verify/analyze', handleAnalyzeVerification)
router.post('/verify/refresh', handleRefreshVerification)

export default router
