const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const validator = require('validator');
const passport = require('passport');

const { getDB, seedDefaultCategories } = require('../db/database');
const { sendVerificationEmail } = require('../services/email');

const router = express.Router();
const COOKIE_OPTS = { httpOnly: true, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 };

function issueToken(userId, res) {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.cookie('token', token, COOKIE_OPTS);
  return token;
}

// ── Register ──────────────────────────────────────────────────────────────────
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) return res.status(400).json({ error: 'All fields are required' });
    if (!validator.isEmail(email)) return res.status(400).json({ error: 'Invalid email address' });
    if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

    const db = getDB();
    const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
    if (exists) return res.status(409).json({ error: 'An account with this email already exists' });

    const hashed  = await bcrypt.hash(password, 12);
    const token   = crypto.randomBytes(32).toString('hex');
    const expiry  = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const result = db.prepare(
      'INSERT INTO users (name, email, password, verify_token, verify_token_exp) VALUES (?, ?, ?, ?, ?)'
    ).run(name.trim(), email.toLowerCase(), hashed, token, expiry);

    seedDefaultCategories(result.lastInsertRowid);
    await sendVerificationEmail(email.toLowerCase(), name.trim(), token);

    return res.status(201).json({ message: 'Account created! Please check your email to verify your account.' });
  } catch (err) {
    next(err);
  }
});

// ── Verify Email ──────────────────────────────────────────────────────────────
router.get('/verify-email', (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).json({ error: 'Verification token is required' });

  const db = getDB();
  const user = db.prepare('SELECT * FROM users WHERE verify_token = ?').get(token);

  if (!user) return res.status(400).json({ error: 'Invalid verification link' });
  if (new Date(user.verify_token_exp) < new Date()) {
    return res.status(400).json({ error: 'Verification link has expired. Please request a new one.' });
  }

  db.prepare('UPDATE users SET email_verified = 1, verify_token = NULL, verify_token_exp = NULL WHERE id = ?').run(user.id);
  issueToken(user.id, res);

  return res.json({ message: 'Email verified successfully!', user: { id: user.id, name: user.name, email: user.email, currency: user.currency } });
});

// ── Resend Verification ───────────────────────────────────────────────────────
router.post('/resend-verification', async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email || !validator.isEmail(email)) return res.status(400).json({ error: 'Valid email is required' });

    const db = getDB();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
    if (!user) return res.status(404).json({ error: 'No account found with this email' });
    if (user.email_verified) return res.status(400).json({ error: 'Email is already verified' });

    const token  = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    db.prepare('UPDATE users SET verify_token = ?, verify_token_exp = ? WHERE id = ?').run(token, expiry, user.id);

    await sendVerificationEmail(user.email, user.name, token);
    return res.json({ message: 'Verification email sent!' });
  } catch (err) {
    next(err);
  }
});

// ── Login ─────────────────────────────────────────────────────────────────────
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
    if (!validator.isEmail(email)) return res.status(400).json({ error: 'Invalid email address' });

    const db = getDB();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
    if (!user || !user.password) return res.status(401).json({ error: 'Invalid email or password' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

    if (!user.email_verified) {
      return res.status(403).json({
        error: 'Please verify your email before logging in.',
        code: 'EMAIL_NOT_VERIFIED',
        email: user.email,
      });
    }

    issueToken(user.id, res);
    return res.json({ user: { id: user.id, name: user.name, email: user.email, currency: user.currency, avatar_url: user.avatar_url } });
  } catch (err) {
    next(err);
  }
});

// ── Google OAuth ──────────────────────────────────────────────────────────────
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));

router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.CLIENT_URL}/login?error=google_failed` }),
  (req, res) => {
    issueToken(req.user.id, res);
    res.redirect(`${process.env.CLIENT_URL}/dashboard`);
  }
);

// ── Me ────────────────────────────────────────────────────────────────────────
router.get('/me', (req, res) => {
  try {
    const token = req.cookies?.token;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const db = getDB();
    const user = db.prepare('SELECT id, name, email, currency, email_verified, avatar_url FROM users WHERE id = ?').get(decoded.userId);
    if (!user) return res.status(401).json({ error: 'User not found' });
    return res.json({ user });
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
});

// ── Update Currency ───────────────────────────────────────────────────────────
router.patch('/currency', (req, res) => {
  try {
    const token = req.cookies?.token;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { currency } = req.body;
    if (!currency) return res.status(400).json({ error: 'Currency is required' });
    getDB().prepare('UPDATE users SET currency = ? WHERE id = ?').run(currency, decoded.userId);
    return res.json({ message: 'Currency updated' });
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
});

// ── Logout ────────────────────────────────────────────────────────────────────
router.post('/logout', (_req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
});

module.exports = router;
