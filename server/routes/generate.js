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
import multer from 'multer'
import { handleTranscribe } from '../controllers/transcribeController.js'

const upload = multer({ storage: multer.memoryStorage() })

const router = Router()

router.post('/generate-script', handleGenerateScript)
router.post('/generate-advice', handleGenerateAdvice)
router.post('/explain-topic', handleExplainTopic)
router.post('/generate-plan', handleGeneratePlan)
router.post('/text-to-speech', handleTextToSpeech)
router.post('/translate', handleTranslate)
router.post('/transcribe', upload.single('audio'), handleTranscribe)
router.get('/stt/status', (req, res) => {
  const provider = (process.env.STT_PROVIDER || '').toUpperCase()
  const configured = provider === 'OPENAI' ? !!process.env.OPENAI_API_KEY : false
  res.json({ provider: provider || null, configured })
})
router.post('/send-alert', handleSendAlert)
router.post('/contact', handleContact)
router.post('/describe-image', handleDescribeImage)

export default router
