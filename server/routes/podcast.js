import { Router } from 'express'
import { handleGeneratePodcast, handlePodcastChat } from '../controllers/podcastController.js'

const router = Router()

router.post('/podcast/generate', handleGeneratePodcast)
router.post('/podcast/chat',     handlePodcastChat)

export default router
