import { Router } from 'express'
import { handleCreateInterview, handleContinueInterview, handleSummarizeInterview } from '../controllers/interviewController.js'

const router = Router()

router.post('/interviews/create', handleCreateInterview)
router.post('/interviews/next', handleContinueInterview)
router.post('/interviews/feedback', handleSummarizeInterview)

export default router