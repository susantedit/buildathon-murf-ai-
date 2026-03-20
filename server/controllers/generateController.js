import { generateScript, generateAdvice, explainTopic, generatePlan } from '../services/geminiService.js'
import { textToSpeech } from '../services/murfService.js'
import { sendEmergencyAlert } from '../services/emailService.js'
import Session from '../models/Session.js'

export async function handleGenerateScript(req, res) {
  try {
    const { text, tone = 'motivational', userId = 'anonymous' } = req.body
    if (!text) return res.status(400).json({ error: 'text is required' })

    console.log('Generating script for:', text)
    const responseText = await generateScript(text, tone)
    console.log('Script generated, converting to speech...')
    
    const audioUrl = await textToSpeech(responseText, tone, 'creator')
    console.log('Audio generated successfully')

    await Session.create({ userId, mode: 'creator', inputText: text, responseText, audioUrl })
    res.json({ text: responseText, audio: audioUrl })
  } catch (err) {
    console.error('Generate Script Error:', err)
    res.status(500).json({ 
      error: err.message || 'Something went wrong. Check your API keys.',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    })
  }
}

export async function handleGenerateAdvice(req, res) {
  try {
    const { text, userId = 'anonymous' } = req.body
    if (!text) return res.status(400).json({ error: 'text is required' })

    console.log('Generating advice for:', text)
    const responseText = await generateAdvice(text)
    const audioUrl = await textToSpeech(responseText, 'calm', 'assistant')

    await Session.create({ userId, mode: 'assistant', inputText: text, responseText, audioUrl })
    res.json({ text: responseText, audio: audioUrl })
  } catch (err) {
    console.error('Generate Advice Error:', err)
    res.status(500).json({ 
      error: err.message || 'Something went wrong. Check your API keys.',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    })
  }
}

export async function handleExplainTopic(req, res) {
  try {
    const { topic, mode = 'normal', userId = 'anonymous' } = req.body
    if (!topic) return res.status(400).json({ error: 'topic is required' })

    console.log('Explaining topic:', topic)
    const responseText = await explainTopic(topic, mode)
    const audioUrl = await textToSpeech(responseText, 'teacher', 'study')

    await Session.create({ userId, mode: 'study', inputText: topic, responseText, audioUrl })
    res.json({ text: responseText, audio: audioUrl })
  } catch (err) {
    console.error('Explain Topic Error:', err)
    res.status(500).json({ 
      error: err.message || 'Something went wrong. Check your API keys.',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    })
  }
}

export async function handleGeneratePlan(req, res) {
  try {
    const { goal, userId = 'anonymous' } = req.body
    if (!goal) return res.status(400).json({ error: 'goal is required' })

    console.log('Generating plan for:', goal)
    const responseText = await generatePlan(goal)
    const audioUrl = await textToSpeech(responseText, 'motivational', 'planner')

    await Session.create({ userId, mode: 'planner', inputText: goal, responseText, audioUrl })
    res.json({ text: responseText, audio: audioUrl })
  } catch (err) {
    console.error('Generate Plan Error:', err)
    res.status(500).json({ 
      error: err.message || 'Something went wrong. Check your API keys.',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    })
  }
}

export async function handleTextToSpeech(req, res) {
  try {
    const { text, voice = 'calm', mode = 'assistant' } = req.body
    if (!text) return res.status(400).json({ error: 'text is required' })

    console.log('Converting text to speech...')
    const audioUrl = await textToSpeech(text, voice, mode)
    res.json({ audio: audioUrl })
  } catch (err) {
    console.error('Text to Speech Error:', err)
    res.status(500).json({ 
      error: err.message || 'Something went wrong. Check your API keys.',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    })
  }
}

export async function handleTranslate(req, res) {
  try {
    const { text, targetLang } = req.body
    if (!text) return res.status(400).json({ error: 'text is required' })
    if (!targetLang) return res.status(400).json({ error: 'targetLang is required' })

    console.log('Translating text to:', targetLang)
    
    // Import translation service
    const { translateText, isSupportedLanguage } = await import('../services/translationService.js')
    
    // Check if target language is supported
    if (!isSupportedLanguage(targetLang)) {
      return res.status(400).json({ 
        error: 'Target language not fully supported',
        targetLang 
      })
    }
    
    // Translate with auto-detection
    const translationResult = await translateText(text, targetLang)
    
    console.log(`Translation complete: ${translationResult.detectedLang} → ${targetLang}`)
    console.log('Generating voice...')
    
    // Generate voice for translated text
    const audioUrl = await textToSpeech(translationResult.translatedText, 'calm', 'assistant')
    
    res.json({ 
      translatedText: translationResult.translatedText,
      detectedLang: translationResult.detectedLang,
      detectedLangName: translationResult.detectedLangName,
      targetLang: translationResult.targetLang,
      originalText: translationResult.originalText,
      audio: audioUrl
    })
  } catch (err) {
    console.error('Translation Error:', err)
    res.status(500).json({ 
      error: err.message || 'Translation failed',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    })
  }
}

export async function handleSendAlert(req, res) {
  try {
    const { toEmails, userName, location, situationType } = req.body

    if (!toEmails || !Array.isArray(toEmails) || toEmails.length === 0) {
      return res.status(400).json({ error: 'toEmails array is required' })
    }

    // Validate emails
    const validEmails = toEmails.filter(e => e && e.includes('@'))
    if (validEmails.length === 0) {
      return res.status(400).json({ error: 'No valid email addresses provided' })
    }

    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      return res.status(503).json({ error: 'Email service not configured. Add GMAIL_USER and GMAIL_APP_PASSWORD to .env' })
    }

    const result = await sendEmergencyAlert({ toEmails: validEmails, userName, location, situationType })
    console.log(`Emergency alert sent to: ${validEmails.join(', ')}`)
    res.json({ success: true, ...result })
  } catch (err) {
    console.error('Send Alert Error:', err)
    res.status(500).json({ error: err.message || 'Failed to send alert' })
  }
}

export async function handleContact(req, res) {
  try {
    const { name, email, message } = req.body
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'name, email, and message are required' })
    }

    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      return res.status(503).json({ error: 'Email service not configured' })
    }

    const nodemailer = (await import('nodemailer')).default
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      requireTLS: true,
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD }
    })

    // Verify connection first
    await transporter.verify()

    await transporter.sendMail({
      from: `"Vortex Voice AI" <${process.env.GMAIL_USER}>`,
      to: process.env.GMAIL_USER, // send to yourself
      replyTo: email,
      subject: `[Vortex Voice AI] Message from ${name}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#0f0f1a;color:#fff;border-radius:12px;overflow:hidden;">
          <div style="background:linear-gradient(135deg,#8b5cf6,#3b82f6);padding:20px 24px;">
            <h2 style="margin:0;font-size:20px;">📬 New Contact Message</h2>
            <p style="margin:4px 0 0;opacity:0.85;font-size:13px;">Vortex Voice AI Contact Form</p>
          </div>
          <div style="padding:24px;">
            <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
              <tr><td style="padding:8px 0;color:#a0a0b0;width:80px;">Name</td><td style="padding:8px 0;font-weight:bold;">${name}</td></tr>
              <tr><td style="padding:8px 0;color:#a0a0b0;">Email</td><td style="padding:8px 0;"><a href="mailto:${email}" style="color:#8b5cf6;">${email}</a></td></tr>
            </table>
            <div style="background:rgba(139,92,246,0.1);border:1px solid rgba(139,92,246,0.3);border-radius:8px;padding:16px;">
              <p style="margin:0;line-height:1.7;white-space:pre-wrap;">${message}</p>
            </div>
            <p style="color:#a0a0b0;font-size:11px;margin-top:20px;text-align:center;">Sent from Vortex Voice AI · ${new Date().toLocaleString()}</p>
          </div>
        </div>
      `
    })

    console.log(`Contact email sent from ${email}`)
    res.json({ success: true })
  } catch (err) {
    console.error('Contact Error:', err.message)
    // Return specific error so frontend can show it
    res.status(500).json({ 
      error: err.message || 'Failed to send message',
      hint: err.message?.includes('Invalid login') 
        ? 'Gmail App Password is wrong. Go to myaccount.google.com → Security → App Passwords and generate a new one.'
        : err.message?.includes('verify')
          ? 'Gmail SMTP connection failed. Check GMAIL_USER and GMAIL_APP_PASSWORD in .env'
          : undefined
    })
  }
}
