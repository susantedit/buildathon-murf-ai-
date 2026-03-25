import { Router } from 'express'
import {
  handleGenerateScript,
  handleGenerateAdvice,
  handleExplainTopic,
  handleGeneratePlan,
  handleTextToSpeech,
  handleTranslate,
  handleSendAlert,
  handleContact,
  handleDescribeImage
} from '../controllers/generateController.js'

const router = Router()

router.post('/generate-script', handleGenerateScript)
router.post('/generate-advice', handleGenerateAdvice)
router.post('/explain-topic', handleExplainTopic)
router.post('/generate-plan', handleGeneratePlan)
router.post('/text-to-speech', handleTextToSpeech)
router.post('/translate', handleTranslate)
router.post('/send-alert', handleSendAlert)
router.post('/contact', handleContact)
router.post('/describe-image', handleDescribeImage)

export default router
