const Session = require('../models/Session');
const { User } = require('../models/User');
const { SESSION_COOKIE_NAME, hashSessionToken } = require('../config/auth');

const trustedOrigins = (process.env.FRONTEND_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

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

    const user = await User.findById(session.userId);
    if (!user || !user.isActive) {
      await Session.deleteOne({ _id: session._id });
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (Date.now() - session.lastUsedAt.getTime() > 5 * 60 * 1000) {
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

function requireTrustedOrigin(req, res, next) {
  const origin = req.get('origin');
  if (!origin || !trustedOrigins.includes(origin)) {
    return res.status(403).json({ error: 'Request origin is not allowed.' });
  }
  return next();
}

module.exports = { requireAuth, requireRole, requireTrustedOrigin };
