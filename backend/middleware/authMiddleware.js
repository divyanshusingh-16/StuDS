const Session = require('../models/Session');
const { User } = require('../models/User');
const { SESSION_COOKIE_NAME, hashSessionToken, getClearCookieOptions } = require('../config/auth');

const INACTIVITY_TIMEOUT_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

async function requireAuth(req, res, next) {
  try {
    const sessionToken = req.cookies?.[SESSION_COOKIE_NAME];
    if (!sessionToken || typeof sessionToken !== 'string') {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const session = await Session.findOne({
      tokenHash: hashSessionToken(sessionToken),
      expiresAt: { $gt: new Date() },
    });

    if (!session) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    // Enforce 3-day inactivity timeout
    const now = Date.now();
    if (now - session.lastUsedAt.getTime() > INACTIVITY_TIMEOUT_MS) {
      await Session.deleteOne({ _id: session._id });
      res.clearCookie(SESSION_COOKIE_NAME, getClearCookieOptions());
      return res.status(401).json({ error: 'Session expired due to inactivity. Please log in again.' });
    }

    const user = await User.findById(session.userId);
    if (!user || !user.isActive) {
      await Session.deleteOne({ _id: session._id });
      res.clearCookie(SESSION_COOKIE_NAME, getClearCookieOptions());
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (now - session.lastUsedAt.getTime() > 5 * 60 * 1000) {
      session.lastUsedAt = new Date();
      await session.save();
    }

    req.auth = { user, session };
    return next();
  } catch (error) {
    return next(error);
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.auth?.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    if (!roles.includes(req.auth.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions.' });
    }
    return next();
  };
}

function getTrustedOrigins() {
  return (process.env.FRONTEND_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean);
}

function requireTrustedOrigin(req, res, next) {
  const trusted = getTrustedOrigins();
  const origin = req.get('origin');
  
  if (origin) {
    const cleanOrigin = origin.trim().replace(/\/+$/, '');
    if (trusted.includes(cleanOrigin)) {
      return next();
    }
    return res.status(403).json({ error: 'Request origin is not allowed.' });
  }

  // Fallback to Referer header if Origin is omitted by browser
  const referer = req.get('referer');
  if (referer) {
    try {
      const refererOrigin = new URL(referer).origin.replace(/\/+$/, '');
      if (trusted.includes(refererOrigin)) {
        return next();
      }
    } catch {}
  }

  return res.status(403).json({ error: 'Request origin is not allowed.' });
}

module.exports = { requireAuth, requireRole, requireTrustedOrigin };
