import { Router } from 'express'
import { getHistory, deleteHistory } from '../controllers/historyController.js'

const router = Router()

router.get('/history', getHistory)
router.delete('/history/:id', deleteHistory)

export default router
