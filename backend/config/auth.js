const crypto = require('crypto');

const SESSION_COOKIE_NAME = 'studs_session';

function getSessionTtlMs() {
  const configuredDays = Number.parseInt(process.env.SESSION_TTL_DAYS, 10);
  const days = Number.isInteger(configuredDays) && configuredDays > 0 && configuredDays <= 30
    ? configuredDays
    : 7;
  return days * 24 * 60 * 60 * 1000;
}

function getSessionPepper() {
  const pepper = process.env.SESSION_TOKEN_PEPPER;
  if (process.env.NODE_ENV === 'production' && (!pepper || pepper.length < 32)) {
    throw new Error('SESSION_TOKEN_PEPPER must be at least 32 characters in production.');
  }
  return pepper || 'development-only-session-pepper-change-me';
}

function hashSessionToken(token) {
  return crypto
    .createHmac('sha256', getSessionPepper())
    .update(token)
    .digest('hex');
}

function createSessionToken() {
  return crypto.randomBytes(48).toString('base64url');
}

function getCookieOptions() {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
    maxAge: getSessionTtlMs(),
  };
}

function getClearCookieOptions() {
  const { maxAge, ...cookieOptions } = getCookieOptions();
  return cookieOptions;
}

module.exports = {
  SESSION_COOKIE_NAME,
  createSessionToken,
  getClearCookieOptions,
  getCookieOptions,
  getSessionTtlMs,
  hashSessionToken,
};
