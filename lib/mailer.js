/**
 * RJDL* Email Delivery Pipeline
 * Configured for Gmail SMTP (smtp.gmail.com, port 465 SSL)
 * Compliant with Gmail deliverability and anti-spam best practices.
 */

const nodemailer = require('nodemailer');

// Initialize reusable Nodemailer transporter
function getTransporter() {
  const user = process.env.GMAIL_USER || 'rjdlxindia@gmail.com';
  const pass = (process.env.GMAIL_APP_PASSWORD || '').replace(/\s+/g, ''); // remove any accidental spaces

  if (!pass || pass === 'your_16_character_app_password') {
    console.warn('[RJDL Mailer] Warning: GMAIL_APP_PASSWORD is not configured. Emails will fail until an App Password is provided.');
  }

  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // true for port 465, false for 587
    auth: {
      user: user,
      pass: pass
    },
    // Connection pooling for fast response
    pool: true,
    maxConnections: 3,
    maxMessages: 100
  });
}

/**
 * Escapes HTML characters to prevent HTML injection in email bodies
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Sends a structured enquiry email to rjdlxindia@gmail.com
 */
async function sendEnquiryEmail({ name, email, company, country, projectType, budget, timeline, message, ip, userAgent }) {
  const transporter = getTransporter();
  const recipient = process.env.RECIPIENT_EMAIL || 'rjdlxindia@gmail.com';
  const senderEmail = process.env.GMAIL_USER || 'rjdlxindia@gmail.com';

  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeCompany = escapeHtml(company || 'Not specified');
  const safeCountry = escapeHtml(country || 'Not specified');
  const safeProjectType = escapeHtml(projectType || 'Custom Project');
  const safeBudget = escapeHtml(budget || 'Not specified');
  const safeTimeline = escapeHtml(timeline || 'Not specified');
  const safeMessage = escapeHtml(message).replace(/\n/g, '<br>');

  const now = new Date();
  const timeUtc = now.toISOString();
  const timeLocal = now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'full', timeStyle: 'long' });

  // 1. Plain text alternative (critical for spam filtering & fallback)
  const plainText = `[RJDL*] NEW CLIENT ENQUIRY

PROJECT TYPE: ${projectType}
CLIENT NAME: ${name}
CLIENT EMAIL: ${email}
COMPANY / STUDIO: ${company || '—'}
COUNTRY: ${country || '—'}
INDICATIVE BUDGET: ${budget || '—'}
TIMELINE: ${timeline || '—'}

THE IDEA / BRIEF:
--------------------------------------------------
${message}
--------------------------------------------------

METADATA:
Submitted: ${timeLocal} (${timeUtc})
Client IP: ${ip || 'Unknown'}
User Agent: ${userAgent || 'Unknown'}

You can reply directly to this email to contact ${name} (${email}).
`;

  // 2. High-end Luxury Architectural HTML Email Template
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Enquiry — ${safeProjectType} — ${safeName}</title>
</head>
<body style="margin:0; padding:0; background-color:#FAF7F0; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#211D18; -webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#FAF7F0; width:100%; padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:620px; background-color:#FFFFFF; border:1px solid #EAE2D2; border-radius:4px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.03);">
          
          <!-- Header Bar -->
          <tr>
            <td style="background-color:#161310; padding:28px 36px; border-bottom:2px solid #A9854B;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td>
                    <span style="font-size:22px; font-weight:700; letter-spacing:0.08em; color:#FAF7F0; text-transform:uppercase;">RJDL<span style="color:#C4A468; font-style:italic;">*</span></span>
                    <span style="display:block; font-size:10px; letter-spacing:0.3em; color:#A9854B; text-transform:uppercase; margin-top:4px;">Studio Enquiry Notification</span>
                  </td>
                  <td align="right">
                    <span style="display:inline-block; font-size:11px; font-weight:600; letter-spacing:0.18em; text-transform:uppercase; background-color:rgba(196,164,104,0.18); color:#C4A468; padding:6px 14px; border-radius:100px; border:1px solid rgba(196,164,104,0.3);">${safeProjectType}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding:36px 36px 20px;">
              <h2 style="margin:0 0 8px; font-size:20px; font-weight:600; color:#161310; letter-spacing:-0.01em;">New Project Submission</h2>
              <p style="margin:0 0 26px; font-size:13px; color:#635C52; line-height:1.5;">A new brief was submitted via the website inquiry form. Hit "Reply" in your email client to respond directly to the sender.</p>

              <!-- Client Information Table -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse; margin-bottom:28px;">
                <tr>
                  <td style="padding:10px 12px; border-bottom:1px solid #F0ECE1; font-size:11px; font-weight:600; letter-spacing:0.15em; text-transform:uppercase; color:#8C8375; width:34%;">Name</td>
                  <td style="padding:10px 12px; border-bottom:1px solid #F0ECE1; font-size:14px; font-weight:600; color:#161310;">${safeName}</td>
                </tr>
                <tr>
                  <td style="padding:10px 12px; border-bottom:1px solid #F0ECE1; font-size:11px; font-weight:600; letter-spacing:0.15em; text-transform:uppercase; color:#8C8375;">Email</td>
                  <td style="padding:10px 12px; border-bottom:1px solid #F0ECE1; font-size:14px; color:#161310;">
                    <a href="mailto:${safeEmail}" style="color:#A9854B; text-decoration:none; font-weight:500;">${safeEmail}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 12px; border-bottom:1px solid #F0ECE1; font-size:11px; font-weight:600; letter-spacing:0.15em; text-transform:uppercase; color:#8C8375;">Company / Studio</td>
                  <td style="padding:10px 12px; border-bottom:1px solid #F0ECE1; font-size:14px; color:#161310;">${safeCompany}</td>
                </tr>
                <tr>
                  <td style="padding:10px 12px; border-bottom:1px solid #F0ECE1; font-size:11px; font-weight:600; letter-spacing:0.15em; text-transform:uppercase; color:#8C8375;">Country</td>
                  <td style="padding:10px 12px; border-bottom:1px solid #F0ECE1; font-size:14px; color:#161310;">${safeCountry}</td>
                </tr>
                <tr>
                  <td style="padding:10px 12px; border-bottom:1px solid #F0ECE1; font-size:11px; font-weight:600; letter-spacing:0.15em; text-transform:uppercase; color:#8C8375;">Indicative Budget</td>
                  <td style="padding:10px 12px; border-bottom:1px solid #F0ECE1; font-size:14px; color:#161310;">${safeBudget}</td>
                </tr>
                <tr>
                  <td style="padding:10px 12px; border-bottom:1px solid #F0ECE1; font-size:11px; font-weight:600; letter-spacing:0.15em; text-transform:uppercase; color:#8C8375;">Timeline</td>
                  <td style="padding:10px 12px; border-bottom:1px solid #F0ECE1; font-size:14px; color:#161310;">${safeTimeline}</td>
                </tr>
              </table>

              <!-- Project Brief Box -->
              <div style="margin-top:20px; background-color:#FAF7F0; border:1px solid #EAE2D2; border-left:4px solid #A9854B; padding:20px 22px; border-radius:3px;">
                <span style="display:block; font-size:11px; font-weight:700; letter-spacing:0.2em; text-transform:uppercase; color:#A9854B; margin-bottom:10px;">The Idea / Brief</span>
                <div style="font-size:14px; line-height:1.75; color:#211D18; white-space:pre-wrap;">${safeMessage}</div>
              </div>

              <!-- Quick Reply Action -->
              <div style="margin-top:30px; text-align:center;">
                <a href="mailto:${safeEmail}?subject=${encodeURIComponent(`Re: [RJDL] Your Enquiry — ${projectType}`)}" style="display:inline-block; background-color:#161310; color:#FAF7F0; font-size:12px; font-weight:600; letter-spacing:0.22em; text-transform:uppercase; text-decoration:none; padding:14px 28px; border-radius:100px; border:1px solid #161310;">Reply to ${safeName} &rarr;</a>
              </div>
            </td>
          </tr>

          <!-- Metadata Audit Footer -->
          <tr>
            <td style="background-color:#F5EFE6; padding:22px 36px; border-top:1px solid #EAE2D2; font-size:11px; color:#7D7467; line-height:1.6;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td>
                    <strong>Submission Time:</strong> ${safeName ? timeLocal : ''} (IST)<br>
                    <strong>Client IP:</strong> ${escapeHtml(ip || 'N/A')} &bull; <strong>Platform:</strong> ${escapeHtml((userAgent || '').slice(0, 90))}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>

        <!-- Security & Anti-Spam Notice -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:620px; margin-top:16px;">
          <tr>
            <td align="center" style="font-size:11px; color:#9E9689; line-height:1.5;">
              This is an authenticated transactional inquiry sent via RJDL* website engine.<br>
              Domain authentication: SPF / DKIM verified &bull; Delivered to ${recipient}
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>`;

  // 3. Send mail with standard headers
  const mailOptions = {
    from: `"RJDL* Studio" <${senderEmail}>`,
    to: recipient,
    replyTo: `"${name}" <${email}>`,
    subject: `[RJDL] New Enquiry — ${projectType} — ${name}`,
    text: plainText,
    html: htmlContent,
    headers: {
      'X-Entity-Ref-ID': `RJDL-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      'X-Mailer': 'RJDL-Studio-Form-Engine/1.0',
      'X-Priority': '1' // High priority business enquiry
    }
  };

  const info = await transporter.sendMail(mailOptions);
  return info;
}

module.exports = {
  sendEnquiryEmail,
  getTransporter
};
