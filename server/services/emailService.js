import nodemailer from 'nodemailer'

// Gmail SMTP transporter
// Requires GMAIL_USER and GMAIL_APP_PASSWORD in .env
// Get App Password: Google Account → Security → 2-Step Verification → App Passwords
function createTransporter() {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD
    }
  })
}

// Call this once on startup to catch auth issues early
export async function verifyEmailConfig() {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn('⚠️  Email alerts disabled: GMAIL_USER or GMAIL_APP_PASSWORD not set')
    return false
  }
  try {
    const t = createTransporter()
    await t.verify()
    console.log('✅ Gmail SMTP ready:', process.env.GMAIL_USER)
    return true
  } catch (err) {
    console.error('❌ Gmail SMTP auth failed:', err.message)
    console.error('   → Check GMAIL_USER and GMAIL_APP_PASSWORD in .env')
    console.error('   → App Password must be 16 chars, no spaces')
    return false
  }
}

export async function sendEmergencyAlert({ toEmails, userName, location, situationType, features }) {
  const transporter = createTransporter()

  const time = new Date().toLocaleTimeString()
  const date = new Date().toLocaleDateString()
  const mapLink = location
    ? `https://maps.google.com/?q=${location.lat},${location.lng}`
    : null

  const subject = '🚨 Emergency Alert from Vortex Voice AI'

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f0f1a; color: #ffffff; border-radius: 12px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #ef4444, #dc2626); padding: 24px; text-align: center;">
        <h1 style="margin: 0; font-size: 28px;">🚨 EMERGENCY ALERT</h1>
        <p style="margin: 8px 0 0; opacity: 0.9;">Vortex Voice AI Safety System</p>
      </div>
      
      <div style="padding: 24px;">
        <div style="background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); border-radius: 8px; padding: 16px; margin-bottom: 20px;">
          <p style="margin: 0; font-size: 16px;">⚠️ This is an automated safety alert triggered from <strong>Vortex Voice AI</strong>.</p>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr>
            <td style="padding: 8px 0; color: #a0a0b0; width: 140px;">👤 User Name</td>
            <td style="padding: 8px 0; font-weight: bold;">${userName || 'User'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #a0a0b0;">⏰ Time</td>
            <td style="padding: 8px 0;">${time}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #a0a0b0;">📅 Date</td>
            <td style="padding: 8px 0;">${date}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #a0a0b0;">🚨 Status</td>
            <td style="padding: 8px 0; color: #ef4444; font-weight: bold;">Emergency Active</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #a0a0b0;">⚠️ Situation</td>
            <td style="padding: 8px 0;">${situationType ? situationType.charAt(0).toUpperCase() + situationType.slice(1) : 'General'}</td>
          </tr>
        </table>

        ${location ? `
        <div style="background: rgba(59,130,246,0.1); border: 1px solid rgba(59,130,246,0.3); border-radius: 8px; padding: 16px; margin-bottom: 20px;">
          <h3 style="margin: 0 0 12px; color: #3b82f6;">📍 Live Location</h3>
          <p style="margin: 4px 0;">Latitude: <strong>${location.lat.toFixed(6)}</strong></p>
          <p style="margin: 4px 0;">Longitude: <strong>${location.lng.toFixed(6)}</strong></p>
          <a href="${mapLink}" style="display: inline-block; margin-top: 12px; padding: 10px 20px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
            🔗 View on Google Maps
          </a>
        </div>
        ` : `
        <div style="background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.3); border-radius: 8px; padding: 16px; margin-bottom: 20px;">
          <p style="margin: 0; color: #f59e0b;">📍 Location unavailable at time of alert</p>
        </div>
        `}

        <div style="background: rgba(139,92,246,0.1); border: 1px solid rgba(139,92,246,0.3); border-radius: 8px; padding: 16px; margin-bottom: 20px;">
          <h3 style="margin: 0 0 12px; color: #8b5cf6;">🎙️ Safety Features Active</h3>
          <ul style="margin: 0; padding-left: 20px; line-height: 1.8;">
            <li>Voice recording activated</li>
            <li>Live location tracking enabled (updates every 5s)</li>
            <li>AI safety guidance provided</li>
            <li>Alert sent to all emergency contacts</li>
          </ul>
        </div>

        <div style="background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); border-radius: 8px; padding: 16px; margin-bottom: 20px; text-align: center;">
          <p style="margin: 0; font-size: 16px; font-weight: bold;">Please check on the user immediately or contact local emergency services.</p>
        </div>

        <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 20px 0;" />
        
        <p style="color: #a0a0b0; font-size: 12px; text-align: center; margin: 0;">
          — Vortex Voice AI Safety System<br/>
          <a href="https://murf-challenge-susantedit.netlify.app/safety" style="color: #8b5cf6;">murf-challenge-susantedit.netlify.app</a><br/><br/>
          ⚠️ This is a demo alert. Real-time automatic messaging will require full backend SMS/push integration.
        </p>
      </div>
    </div>
  `

  const textBody = `
⚠️ EMERGENCY ALERT

This is an automated safety alert triggered from Vortex Voice AI.

User Name: ${userName || 'User'}
Time: ${time} | Date: ${date}
Status: Emergency Active
Situation: ${situationType ? situationType.charAt(0).toUpperCase() + situationType.slice(1) : 'General'}

📍 Live Location:
${location ? `Latitude: ${location.lat.toFixed(6)}\nLongitude: ${location.lng.toFixed(6)}\n\n🔗 View on Map: ${mapLink}` : 'Location unavailable'}

🎙️ Safety Features Active:
- Voice recording activated
- Live tracking enabled (updates every 5s)
- AI guidance provided
- Alert sent to all emergency contacts

Please check on the user immediately or contact local emergency services.

— Vortex Voice AI Safety System
https://murf-challenge-susantedit.netlify.app/safety

⚠️ Demo alert. Real-time messaging requires backend SMS/push integration.
  `.trim()

  await transporter.sendMail({
    from: `"Vortex Voice AI 🚨" <${process.env.GMAIL_USER}>`,
    to: toEmails.join(', '),
    subject,
    text: textBody,
    html: htmlBody
  })

  return { sent: toEmails.length, recipients: toEmails }
}
