// Email via Resend API (https://resend.com) — works on Render (no SMTP needed)
// Set RESEND_API_KEY in Render env vars. Free tier: 100 emails/day.
// Fallback: if no Resend key, tries Gmail SMTP (may timeout on Render free tier)

async function sendViaResend({ to, subject, html, text: textBody }) {
  // Use verified sender — on free Resend tier without a domain, use onboarding@resend.dev
  // but it can only send to the account owner's email. For emergency alerts to contacts,
  // we try the custom from first, fall back to resend.dev sender.
  const from = process.env.RESEND_FROM_EMAIL
    ? `Vortex Voice AI <${process.env.RESEND_FROM_EMAIL}>`
    : 'Vortex Voice AI <onboarding@resend.dev>'

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text: textBody,
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `Resend API error: ${res.status}`)
  }
  return res.json()
}

async function sendViaGmail({ to, subject, html, text: textBody }) {
  const nodemailer = (await import('nodemailer')).default
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    requireTLS: true,
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
    tls: { rejectUnauthorized: false },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
  })
  await transporter.sendMail({
    from: `"Vortex Voice AI 🚨" <${process.env.GMAIL_USER}>`,
    to: Array.isArray(to) ? to.join(', ') : to,
    subject,
    html,
    text: textBody,
  })
}

async function sendEmail({ to, subject, html, text: textBody }) {
  if (process.env.RESEND_API_KEY) {
    return sendViaResend({ to, subject, html, text: textBody })
  }
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    return sendViaGmail({ to, subject, html, text: textBody })
  }
  throw new Error('No email provider configured. Set RESEND_API_KEY or GMAIL_USER + GMAIL_APP_PASSWORD.')
}

export async function verifyEmailConfig() {
  if (process.env.RESEND_API_KEY) {
    console.log('✅ Email: Resend API configured')
    return true
  }
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn('⚠️  Email disabled: set RESEND_API_KEY (recommended) or GMAIL_USER + GMAIL_APP_PASSWORD')
    return false
  }
  try {
    const nodemailer = (await import('nodemailer')).default
    const t = nodemailer.createTransport({
      host: 'smtp.gmail.com', port: 587, secure: false, requireTLS: true,
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
      connectionTimeout: 8000,
    })
    await t.verify()
    console.log('✅ Gmail SMTP ready:', process.env.GMAIL_USER)
    return true
  } catch (err) {
    console.error('❌ Gmail SMTP failed:', err.message)
    return false
  }
}

export async function sendEmergencyAlert({ toEmails, userName, location, situationType }) {
  const time = new Date().toLocaleTimeString()
  const date = new Date().toLocaleDateString()
  const mapLink = location ? `https://maps.google.com/?q=${location.lat},${location.lng}` : null

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0f0f1a;color:#fff;border-radius:12px;overflow:hidden;">
      <div style="background:linear-gradient(135deg,#ef4444,#dc2626);padding:24px;text-align:center;">
        <h1 style="margin:0;font-size:28px;">🚨 EMERGENCY ALERT</h1>
        <p style="margin:8px 0 0;opacity:0.9;">Vortex Voice AI Safety System</p>
      </div>
      <div style="padding:24px;">
        <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
          <tr><td style="padding:8px 0;color:#a0a0b0;width:140px;">👤 User</td><td style="padding:8px 0;font-weight:bold;">${userName || 'User'}</td></tr>
          <tr><td style="padding:8px 0;color:#a0a0b0;">⏰ Time</td><td style="padding:8px 0;">${time} · ${date}</td></tr>
          <tr><td style="padding:8px 0;color:#a0a0b0;">⚠️ Situation</td><td style="padding:8px 0;color:#ef4444;font-weight:bold;">${situationType ? situationType.charAt(0).toUpperCase() + situationType.slice(1) : 'General'}</td></tr>
        </table>
        ${location ? `
        <div style="background:rgba(59,130,246,0.1);border:1px solid rgba(59,130,246,0.3);border-radius:8px;padding:16px;margin-bottom:20px;">
          <h3 style="margin:0 0 12px;color:#3b82f6;">📍 Live Location</h3>
          <p style="margin:4px 0;">Lat: <strong>${location.lat.toFixed(6)}</strong> · Lng: <strong>${location.lng.toFixed(6)}</strong></p>
          <a href="${mapLink}" style="display:inline-block;margin-top:12px;padding:10px 20px;background:#3b82f6;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold;">🔗 View on Google Maps</a>
        </div>` : `<p style="color:#f59e0b;">📍 Location unavailable</p>`}
        <div style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:8px;padding:16px;text-align:center;">
          <p style="margin:0;font-size:16px;font-weight:bold;">Please check on the user immediately or contact local emergency services.</p>
        </div>
        <p style="color:#a0a0b0;font-size:12px;text-align:center;margin-top:20px;">— Vortex Voice AI · <a href="https://murf-challenge-susantedit.netlify.app/safety" style="color:#8b5cf6;">Safety Guardian</a></p>
      </div>
    </div>`

  const text = `🚨 EMERGENCY ALERT\nUser: ${userName || 'User'}\nTime: ${time} · ${date}\nSituation: ${situationType || 'General'}\n${location ? `Location: ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}\nMap: ${mapLink}` : 'Location unavailable'}\n\nPlease check on the user immediately.\n— Vortex Voice AI`

  const subject = '🚨 Emergency Alert from Vortex Voice AI'

  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY not set in Render env vars.')
  }

  // Resend free tier restriction: onboarding@resend.dev can only deliver to the
  // account owner email. We send one email per contact directly using the API.
  // On free tier without a verified domain, each recipient must be the owner —
  // so we send TO the owner and include the contact list in the email body.
  // If RESEND_FROM_EMAIL is set (verified domain), we can send directly to contacts.

  const from = process.env.RESEND_FROM_EMAIL
    ? `Vortex Voice AI 🚨 <${process.env.RESEND_FROM_EMAIL}>`
    : 'Vortex Voice AI <onboarding@resend.dev>'

  const hasVerifiedDomain = !!process.env.RESEND_FROM_EMAIL

  if (hasVerifiedDomain) {
    // Can send directly to any address
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: toEmails, subject, html, text }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.message || `Resend error: ${res.status}`)
    }
    return { sent: toEmails.length, recipients: toEmails }
  }

  // Free tier: send to owner with contacts listed in body
  const ownerEmail = process.env.RESEND_OWNER_EMAIL || 'susantedit@gmail.com'
  const contactsHtml = toEmails.map(e => `<li style="color:#fff">${e}</li>`).join('')
  const alertHtml = html.replace(
    '<p style="color:#a0a0b0;font-size:12px',
    `<div style="background:rgba(139,92,246,0.1);border:1px solid rgba(139,92,246,0.3);border-radius:8px;padding:12px;margin-bottom:16px;">
      <p style="margin:0 0 8px;font-weight:700;color:#8b5cf6;">📬 Alert was triggered for these contacts:</p>
      <ul style="margin:0;padding-left:20px">${contactsHtml}</ul>
      <p style="margin:8px 0 0;font-size:11px;color:#a0a0b0;">Forward this email to them or set RESEND_FROM_EMAIL with a verified domain to auto-send.</p>
    </div>
    <p style="color:#a0a0b0;font-size:12px`
  )

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [ownerEmail], subject, html: alertHtml, text: `${text}\n\nContacts to notify: ${toEmails.join(', ')}` }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `Resend error: ${res.status}`)
  }
  return { sent: toEmails.length, recipients: toEmails, note: 'Sent to owner — forward to contacts or add verified domain' }
}

export async function sendContactEmail({ name, email, message }) {
  const html = `
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
    </div>`

  const to = process.env.CONTACT_EMAIL || process.env.GMAIL_USER || 'susantedit@gmail.com'
  await sendEmail({ to, subject: `[Vortex Voice AI] Message from ${name}`, html, text: `From: ${name} <${email}>\n\n${message}` })
}
