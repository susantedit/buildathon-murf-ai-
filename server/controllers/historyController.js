import Session from '../models/Session.js'

export async function getHistory(req, res) {
  try {
    const userId = req.query.userId || 'anonymous'
    const sessions = await Session.find({ userId }).sort({ createdAt: -1 }).limit(200)
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
