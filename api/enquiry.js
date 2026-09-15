/**
 * Vercel Serverless Function Handler
 * Route: POST /api/enquiry
 */

const { sendEnquiryEmail } = require('../lib/mailer');

module.exports = async function handler(req, res) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const {
      name,
      email,
      company,
      country,
      projectType,
      budget,
      timeline,
      message,
      b_hp_field,
      website_hp,
      _ts
    } = req.body || {};

    // 1. Honeypot check
    if (b_hp_field || website_hp) {
      return res.status(200).json({ success: true, message: 'Thank you. Your enquiry has been received.' });
    }

    // 2. Velocity check
    if (_ts) {
      const elapsed = Date.now() - parseInt(_ts, 10);
      if (!isNaN(elapsed) && elapsed < 1800) {
        return res.status(200).json({ success: true, message: 'Thank you. Your enquiry has been received.' });
      }
    }

    // 3. Validation
    const errors = [];
    if (!name || typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100) {
      errors.push('Name must be between 2 and 100 characters.');
    }

    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
    if (!email || typeof email !== 'string' || !emailRegex.test(email.trim()) || email.trim().length > 150) {
      errors.push('Please provide a valid email address.');
    }

    if (!message || typeof message !== 'string' || message.trim().length < 10) {
      errors.push('Please provide at least 10 characters describing your idea or requirements.');
    } else if (message.trim().length > 2000) {
      errors.push('Message cannot exceed 2000 characters.');
    }

    if (errors.length > 0) {
      return res.status(400).json({ success: false, error: errors[0], allErrors: errors });
    }

    // 4. Send Email
    const clientIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'Vercel-Edge';
    const userAgent = req.headers['user-agent'] || 'Unknown';

    await sendEnquiryEmail({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      company: company ? company.trim() : '',
      country: country ? country.trim() : '',
      projectType: projectType ? projectType.trim() : 'Custom Product',
      budget: budget ? budget.trim() : '',
      timeline: timeline ? timeline.trim() : '',
      message: message.trim(),
      ip: String(clientIp).split(',')[0].trim(),
      userAgent: userAgent
    });

    return res.status(200).json({
      success: true,
      message: 'Thank you. Your enquiry has been received. We will respond within 48 hours.'
    });

  } catch (err) {
    console.error('[Vercel API Error]', err);
    return res.status(500).json({
      success: false,
      error: 'An error occurred while sending your enquiry. Please email us at rjdlxindia@gmail.com.'
    });
  }
};
