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

// ── Rate limiters ──────────────────────────────────────────────────────────────
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again later.' },
});

// Slightly stricter for registration to prevent bulk account creation
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  limit: 10,                  // 10 registrations per IP per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many accounts created. Please try again later.' },
});

// ── Helpers ────────────────────────────────────────────────────────────────────
function normalizeIdentifier(raw) {
  if (typeof raw !== 'string') return { valid: false };
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > 254) return { valid: false };

  if (trimmed.includes('@')) {
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
    if (!isEmail) return { valid: false };
    return { valid: true, email: trimmed.toLowerCase(), rawUid: null };
  }

  // College UID or student username: alphanumeric, hyphen, underscore, 3-30 chars (e.g. 22BCS10142)
  const isUid = /^[a-zA-Z0-9_-]{3,30}$/.test(trimmed);
  if (!isUid) return { valid: false };
  return {
    valid: true,
    email: `${trimmed.toLowerCase()}@student.studs.app`,
    rawUid: trimmed,
  };
}

function isValidPassword(password) {
  return (
    typeof password === 'string' &&
    password.length >= 8 &&
    password.length <= 1024
  );
}

// ── POST /api/auth/register ─────────────────────────────────────────────────
// Public student self-registration.
// SECURITY: The `student` role is ALWAYS assigned server-side regardless of any
// role value the client may send.
// UX JOURNEY: After registration, the student must sign in with their credentials;
// an authenticated session is NOT silently created upon registration.
router.post('/register', registerLimiter, async (req, res, next) => {
  try {
    const rawIdentifier = req.body?.email || req.body?.username || req.body?.identifier;
    const { password } = req.body || {};

    const ident = normalizeIdentifier(rawIdentifier);
    if (!ident.valid) {
      return res.status(400).json({ error: 'A valid college UID or email address is required.' });
    }
    if (!isValidPassword(password)) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters long.',
      });
    }

    // Check for duplicate account by email or uid
    const queryConditions = [{ email: ident.email }];
    if (ident.rawUid) {
      queryConditions.push({ uid: ident.rawUid });
    }
    const existing = await User.findOne({ $or: queryConditions });
    if (existing) {
      return res.status(409).json({ error: 'An account with this college UID or email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const userPayload = {
      email: ident.email,
      passwordHash,
      role: 'student',
      isActive: true,
    };
    if (ident.rawUid) {
      userPayload.uid = ident.rawUid;
    }
    const user = await User.create(userPayload);

    // Per mandatory requirement: Take student to login page rather than automatically
    // granting access to protected content. Do not set session cookie here.
    return res.status(201).json({
      success: true,
      message: 'Account created successfully. Please sign in.',
      user: user.toSafeJSON(),
    });
  } catch (error) {
    return next(error);
  }
});

// ── POST /api/auth/login ───────────────────────────────────────────────────
router.post('/login', loginLimiter, async (req, res, next) => {
  try {
    const rawIdentifier = req.body?.email || req.body?.username || req.body?.identifier;
    const { password } = req.body || {};

    const ident = normalizeIdentifier(rawIdentifier);
    if (!ident.valid || typeof password !== 'string' || password.length === 0 || password.length > 1024) {
      return res.status(400).json({ error: 'Valid username/email and password are required.' });
    }

    const queryConditions = [{ email: ident.email }];
    if (ident.rawUid) {
      queryConditions.push({ uid: ident.rawUid });
    }
    const user = await User.findOne({ $or: queryConditions }).select('+passwordHash');

    const passwordMatches = await bcrypt.compare(password, user?.passwordHash || DUMMY_PASSWORD_HASH);
    if (!user || !user.isActive || !passwordMatches) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const sessionToken = createSessionToken();
    const now = new Date();
    await Session.create({
      tokenHash: hashSessionToken(sessionToken),
      userId: user._id,
      expiresAt: new Date(now.getTime() + getSessionTtlMs()), // 7-day absolute lifetime
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

// ── POST /api/auth/logout ─────────────────────────────────────────────────
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

// ── GET /api/auth/me ──────────────────────────────────────────────────────
router.get('/me', requireAuth, (req, res) => res.json({ user: req.auth.user.toSafeJSON() }));

module.exports = router;
