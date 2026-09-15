/**
 * RJDL* Production Server
 * Serves static assets and provides secure, rate-limited email inquiry endpoint.
 */

require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { sendEnquiryEmail } = require('./lib/mailer');

const app = express();
const PORT = process.env.PORT || 4583;

// Trust reverse proxy headers (e.g. Nginx, Cloudflare, Vercel)
app.set('trust proxy', 1);

// Middleware
app.use(cors());
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// Request Logger
app.use((req, res, next) => {
  res.on('finish', () => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url} -> ${res.statusCode}`);
  });
  next();
});

// 1. Strict IP Rate Limiter: Max 5 enquiries per IP per hour
const enquiryLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 50, // limit each IP to 50 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many enquiry submissions from this IP. Please wait an hour or write to us directly at rjdlxindia@gmail.com'
  }
});

// 2. Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    brand: 'RJDL*',
    timestamp: new Date().toISOString()
  });
});

// 3. Form Submission API Endpoint
app.post('/api/enquiry', enquiryLimiter, async (req, res) => {
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
    } = req.body;

    // --- A. Honeypot check (Bots fill this invisible field) ---
    if (b_hp_field || website_hp) {
      console.warn(`[Anti-Spam] Honeypot triggered from IP: ${req.ip}`);
      // Return 200 OK fake success to not alert the bot runner
      return res.status(200).json({
        success: true,
        message: 'Thank you. Your enquiry has been received.'
      });
    }

    // --- B. Form fill velocity check (Bots submit in < 1.8 seconds) ---
    if (_ts) {
      const elapsed = Date.now() - parseInt(_ts, 10);
      if (!isNaN(elapsed) && elapsed < 1800) {
        console.warn(`[Anti-Spam] Velocity check failed (${elapsed}ms) from IP: ${req.ip}`);
        return res.status(200).json({
          success: true,
          message: 'Thank you. Your enquiry has been received.'
        });
      }
    }

    // --- C. Server-Side Validation ---
    const errors = [];

    // Name: Required, 2-100 characters
    if (!name || typeof name !== 'string') {
      errors.push('Name is required.');
    } else if (name.trim().length < 2 || name.trim().length > 100) {
      errors.push('Name must be between 2 and 100 characters.');
    }

    // Email: Required, standard RFC regex, max 150 chars
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
    if (!email || typeof email !== 'string') {
      errors.push('Email is required.');
    } else if (!emailRegex.test(email.trim()) || email.trim().length > 150) {
      errors.push('Please provide a valid email address.');
    }

    // Message (The Idea): Required, 10-2000 characters
    if (!message || typeof message !== 'string') {
      errors.push('The idea / project description is required.');
    } else if (message.trim().length < 2) {
      errors.push('Please provide details describing your idea or requirements.');
    } else if (message.trim().length > 2000) {
      errors.push('Message cannot exceed 2000 characters.');
    }

    // Optional field length guards
    if (company && typeof company === 'string' && company.length > 120) {
      errors.push('Company name is too long (max 120 chars).');
    }
    if (country && typeof country === 'string' && country.length > 80) {
      errors.push('Country name is too long (max 80 chars).');
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: errors[0],
        allErrors: errors
      });
    }

    // --- D. Send Email via Pipeline ---
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
    const userAgent = req.get('User-Agent') || 'Unknown';

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

    console.log(`[RJDL Form] Successfully dispatched inquiry from "${name}" <${email}>`);

    return res.status(200).json({
      success: true,
      message: "Thank you. Your enquiry has been received. We will respond within 48 hours."
    });

  } catch (err) {
    console.error('[RJDL Form Error]', err);
    return res.status(500).json({
      success: false,
      error: 'An error occurred while sending your enquiry. Please write directly to rjdlxindia@gmail.com.'
    });
  }
});

// 4. Static Asset Delivery with Cache Control Headers
app.use(express.static(path.join(__dirname, '.'), {
  etag: false,
  setHeaders: (res, filePath) => {
    // For local development, disable aggressive caching
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  }
}));

// Fallback to index.html for SPA view routes (with static asset guard)
app.get('{*splat}', (req, res) => {
  if (/\.(css|js|png|jpg|jpeg|gif|svg|webp|ico|woff|woff2)$/i.test(req.path)) {
    const filename = path.basename(req.path);
    const cssPath = path.join(__dirname, 'css', filename);
    const jsPath = path.join(__dirname, 'js', filename);
    const imgPath = path.join(__dirname, 'images', filename);
    const fs = require('fs');
    if (fs.existsSync(cssPath)) return res.sendFile(cssPath);
    if (fs.existsSync(jsPath)) return res.sendFile(jsPath);
    if (fs.existsSync(imgPath)) return res.sendFile(imgPath);
    return res.status(404).end();
  }
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start Server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(` RJDL* Server running at http://localhost:${PORT}`);
    console.log(` Enquiry Endpoint: http://localhost:${PORT}/api/enquiry`);
    console.log(` Destination Inbox: ${process.env.RECIPIENT_EMAIL || 'rjdlxindia@gmail.com'}`);
    console.log(`=========================================`);
  });
}

module.exports = app;
