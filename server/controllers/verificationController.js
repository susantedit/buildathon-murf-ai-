import { verifyFactClaims, refreshVerification } from '../services/verificationService.js'

export async function handleAnalyzeVerification(req, res) {
  try {
    const {
      inputText = '',
      sourceUrl = '',
      imageText = '',
      inputType = 'text',
    } = req.body

    if (!inputText && !sourceUrl && !imageText) {
      return res.status(400).json({ error: 'inputText, sourceUrl, or imageText is required' })
    }

    const result = await verifyFactClaims({ inputText, sourceUrl, imageText, inputType })
    res.json(result)
  } catch (error) {
    console.error('[Verification] Analyze Error:', error)
    res.status(500).json({ error: error.message || 'Failed to analyze claims' })
  }
}

export async function handleRefreshVerification(req, res) {
  try {
    const {
      inputText = '',
      sourceUrl = '',
      imageText = '',
      inputType = 'text',
    } = req.body

    if (!inputText && !sourceUrl && !imageText) {
      return res.status(400).json({ error: 'inputText, sourceUrl, or imageText is required' })
    }

    const result = await refreshVerification({ inputText, sourceUrl, imageText, inputType })
    res.json(result)
  } catch (error) {
    console.error('[Verification] Refresh Error:', error)
    res.status(500).json({ error: error.message || 'Failed to refresh verification' })
  }
}
