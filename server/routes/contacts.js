import { Router } from 'express'
import Contact from '../models/Contact.js'

const router = Router()

// GET all contacts for a device
router.get('/contacts/:deviceId', async (req, res) => {
  try {
    const contacts = await Contact.find({ deviceId: req.params.deviceId }).sort({ createdAt: 1 })
    res.json(contacts)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST add contact
router.post('/contacts', async (req, res) => {
  try {
    const { deviceId, name, email } = req.body
    if (!deviceId || !name || !email) return res.status(400).json({ error: 'deviceId, name, email required' })
    const contact = await Contact.create({ deviceId, name, email })
    res.json(contact)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE contact
router.delete('/contacts/:id', async (req, res) => {
  try {
    await Contact.findByIdAndDelete(req.params.id)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
