import { Router } from 'express'
import {
  handleGenerateScript,
  handleGenerateAdvice,
  handleExplainTopic,
  handleGeneratePlan,
  handleTextToSpeech
} from '../controllers/generateController.js'

const router = Router()

router.post('/generate-script', handleGenerateScript)
router.post('/generate-advice', handleGenerateAdvice)
router.post('/explain-topic', handleExplainTopic)
router.post('/generate-plan', handleGeneratePlan)
router.post('/text-to-speech', handleTextToSpeech)

export default router
