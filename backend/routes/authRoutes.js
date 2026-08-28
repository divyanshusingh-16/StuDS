const express = require('express');
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');
const Session = require('../models/Session');
const { User } = require('../models/User');
const { requireAuth } = require('../middleware/authMiddleware');
const {
  SESSION_COOKIE_NAME,
  createSessionToken,
  getClearCookieOptions,
  getCookieOptions,
  getSessionTtlMs,
  hashSessionToken,
} = require('../config/auth');

const router = express.Router();
const DUMMY_PASSWORD_HASH = '$2b$12$OOGwOxQFWKUUFUOnPviRGu4FSIZh0i94vwNsfi06CGL28xkgMT0ta';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again later.' },
});

function normalizeEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

function isValidLoginInput(email, password) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    && typeof password === 'string'
    && password.length > 0
    && password.length <= 1024;
}

router.post('/login', loginLimiter, async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const { password } = req.body || {};

    if (!isValidLoginInput(email, password)) {
      return res.status(400).json({ error: 'A valid email and password are required.' });
    }

    const user = await User.findOne({ email }).select('+passwordHash');
    const passwordMatches = await bcrypt.compare(password, user?.passwordHash || DUMMY_PASSWORD_HASH);
    if (!user || !user.isActive || !passwordMatches) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const sessionToken = createSessionToken();
    const now = new Date();
    await Session.create({
      tokenHash: hashSessionToken(sessionToken),
      userId: user._id,
      expiresAt: new Date(now.getTime() + getSessionTtlMs()),
      lastUsedAt: now,
      userAgent: req.get('user-agent')?.slice(0, 512) || null,
      ipAddress: req.ip?.slice(0, 128) || null,
    });

    user.lastLoginAt = now;
    await user.save();
    res.cookie(SESSION_COOKIE_NAME, sessionToken, getCookieOptions());
    return res.status(200).json({ user: user.toSafeJSON() });
  } catch (error) {
    return next(error);
  }
});

router.post('/logout', async (req, res, next) => {
  try {
    const sessionToken = req.cookies?.[SESSION_COOKIE_NAME];
    if (sessionToken && typeof sessionToken === 'string') {
      await Session.deleteOne({ tokenHash: hashSessionToken(sessionToken) });
    }
    res.clearCookie(SESSION_COOKIE_NAME, getClearCookieOptions());
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

router.get('/me', requireAuth, (req, res) => res.json({ user: req.auth.user.toSafeJSON() }));

module.exports = router;
