import Session from '../models/Session.js'

export async function getHistory(req, res) {
  try {
    const sessions = await Session.find().sort({ createdAt: -1 }).limit(50)
    res.json(sessions)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function deleteHistory(req, res) {
  try {
    await Session.findByIdAndDelete(req.params.id)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
