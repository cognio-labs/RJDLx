/**
 * RJDL* Email Pipeline Diagnostic & Verification Script
 * Run with: node test-email.js
 */

require('dotenv').config();
const { getTransporter, sendEnquiryEmail } = require('./lib/mailer');

async function runDiagnostic() {
  console.log('====================================================');
  console.log('       RJDL* GMAIL PIPELINE DIAGNOSTIC SUITE        ');
  console.log('====================================================\n');

  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  const recipient = process.env.RECIPIENT_EMAIL || 'rjdlxindia@gmail.com';

  console.log(`[1/3] Environment Check:`);
  console.log(` - Authenticated Sender (GMAIL_USER): ${user ? user : 'MISSING (define in .env)'}`);
  console.log(` - App Password (GMAIL_APP_PASSWORD): ${pass && pass !== 'your_16_character_app_password' ? '********' + pass.slice(-4) : 'NOT CONFIGURED'}`);
  console.log(` - Destination Inbox (RECIPIENT_EMAIL): ${recipient}\n`);

  if (!pass || pass === 'your_16_character_app_password') {
    console.error('ERROR: GMAIL_APP_PASSWORD is not set in .env.');
    console.error('Please generate a 16-character Gmail App Password from:');
    console.error('https://myaccount.google.com/apppasswords');
    console.error('Then add it to your .env file and re-run this script.\n');
    process.exit(1);
  }

  console.log(`[2/3] Connecting to Gmail SMTP (smtp.gmail.com:465 SSL)...`);
  const transporter = getTransporter();

  try {
    await transporter.verify();
    console.log(` SUCCESS: Connected & Authenticated with Gmail SMTP!\n`);
  } catch (err) {
    console.error(` FAILED: Could not authenticate with Gmail SMTP:`);
    console.error(` Error code: ${err.code || 'UNKNOWN'}`);
    console.error(` Message: ${err.message}\n`);
    console.error(' Troubleshooting tips:');
    console.error(' 1. Ensure 2-Step Verification is active on your Google Account.');
    console.error(' 2. Ensure you are using an App Password, NOT your personal account password.');
    console.error(' 3. Remove spaces from the 16-character password in your .env file.\n');
    process.exit(1);
  }

  console.log(`[3/3] Sending test submission to ${recipient}...`);
  try {
    const result = await sendEnquiryEmail({
      name: 'RJDL Test Client',
      email: 'client-test@example.com',
      company: 'Architectural Digest Studio',
      country: 'United Kingdom',
      projectType: 'Custom Product',
      budget: '$15k – $50k',
      timeline: 'Prototype in 4–6 weeks',
      message: 'This is an automated diagnostic test from the RJDL* email delivery pipeline verifying SPF, DKIM, headers, and Gmail inbox delivery.',
      ip: '127.0.0.1 (Local Diagnostic)',
      userAgent: 'Node.js Test Suite / ' + process.platform
    });

    console.log(` SUCCESS: Test inquiry delivered!`);
    console.log(` Message ID: ${result.messageId}`);
    console.log(` Response: ${result.response}`);
    console.log(`\n Check your Gmail inbox at: https://mail.google.com/`);
    console.log(' Look for: "[RJDL] New Enquiry — Custom Product — RJDL Test Client"');
    console.log('====================================================\n');
  } catch (err) {
    console.error(` FAILED to dispatch email:`, err);
    process.exit(1);
  }
}

runDiagnostic();
