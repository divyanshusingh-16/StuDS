#!/usr/bin/env node
/**
 * STUDS Phase 1 — Security Test Suite
 * Uses native http module (no external deps, works on all Node versions).
 * Run: node scripts/securityTest.js
 */
'use strict';
require('dotenv').config();
const http = require('http');

const HOST = '127.0.0.1';
const PORT = parseInt(process.env.TEST_PORT || '5001', 10);
const BASE = '/api';
const ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || 'admin@studs.app';
const ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD || 'StudsAdmin@2024!Secure';
const AGENT = new http.Agent({ keepAlive: false });

let passed = 0;
let failed = 0;
let sessionCookie = '';

function assert(label, condition, detail = '') {
  if (condition) {
    console.log(`  ✅ PASS: ${label}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${label}${detail ? ' — ' + detail : ''}`);
    failed++;
  }
}

function httpRequest(path, method = 'GET', body = null, cookieStr = '') {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : null;
    const headers = {
      'Content-Type': 'application/json',
      'Origin': 'http://localhost:5173',
    };
    if (cookieStr) headers['Cookie'] = cookieStr;
    if (bodyStr) headers['Content-Length'] = Buffer.byteLength(bodyStr);

    const options = { hostname: HOST, port: PORT, path: BASE + path, method, headers, agent: AGENT };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let body = {};
        try { body = JSON.parse(data); } catch {}
        resolve({ status: res.statusCode, body, headers: res.headers });
      });
    });
    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

async function run() {
  console.log('\n══════════════════════════════════════════');
  console.log('  STUDS Phase 1 — Security Test Suite');
  console.log('══════════════════════════════════════════\n');

  // ── 1. Unauthenticated admin endpoint access ──────────────────────────────
  console.log('── 1. Unauthenticated admin endpoint access ─────────────────');

  const adminEndpoints = [
    ['/admin/subject', 'POST', {}],
    ['/admin/unit', 'POST', {}],
    ['/admin/content/upsert', 'POST', {}],
    ['/admin/generate-summary', 'POST', { chapterContentMarkdown: 'test' }],
  ];

  for (const [path, method, body] of adminEndpoints) {
    const r = await httpRequest(path, method, body);
    assert(`${method} ${path} → 401 without session`, r.status === 401, `got ${r.status}`);
    assert(`No secrets in ${path} response`, !JSON.stringify(r.body).match(/passwordHash|secret|token/i));
  }

  // ── 2. Input validation ───────────────────────────────────────────────────
  console.log('\n── 2. Login input validation ────────────────────────────────');

  const badInputs = [
    [{}, 'empty body'],
    [{ email: 'not-an-email', password: 'pass' }, 'malformed email'],
    [{ email: ADMIN_EMAIL }, 'missing password'],
    [{ password: 'pass' }, 'missing email'],
    [{ email: ADMIN_EMAIL, password: '' }, 'empty password'],
    [{ email: ADMIN_EMAIL, password: 'x'.repeat(1025) }, 'password > 1024 chars'],
  ];
  for (const [body, label] of badInputs) {
    const r = await httpRequest('/auth/login', 'POST', body);
    assert(`Login rejects ${label} → 400`, r.status === 400, `got ${r.status}`);
  }

  // ── 3. Wrong credentials ──────────────────────────────────────────────────
  console.log('\n── 3. Wrong credentials ─────────────────────────────────────');

  const wrongPass = await httpRequest('/auth/login', 'POST', { email: ADMIN_EMAIL, password: 'WrongPassword999!' });
  assert('Wrong password → 401', wrongPass.status === 401, `got ${wrongPass.status}`);
  assert('Error is generic (no email-enumeration)', wrongPass.body?.error === 'Invalid email or password.');

  const wrongEmail = await httpRequest('/auth/login', 'POST', { email: 'nonexistent@studs.app', password: 'Whatever123!' });
  assert('Non-existent email → same 401 (no email enumeration)', wrongEmail.status === 401 && wrongEmail.body?.error === 'Invalid email or password.');

  // ── 4. Successful login ───────────────────────────────────────────────────
  console.log('\n── 4. Successful login ──────────────────────────────────────');

  const loginRes = await httpRequest('/auth/login', 'POST', { email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
  assert('Correct credentials → 200', loginRes.status === 200, `got ${loginRes.status}`);
  assert('Response contains user object', !!loginRes.body?.user);
  assert('Response user has id', !!loginRes.body?.user?.id);
  assert('Response user email matches', loginRes.body?.user?.email === ADMIN_EMAIL);
  assert('Response user role is super_admin', loginRes.body?.user?.role === 'super_admin');
  assert('Response does NOT leak passwordHash', !JSON.stringify(loginRes.body).includes('passwordHash'));
  assert('Response does NOT leak session token', !JSON.stringify(loginRes.body).toLowerCase().includes('studs_session'));
  assert('Response does NOT leak secrets', !JSON.stringify(loginRes.body).match(/ADMIN_SECRET|ADMIN_PASSWORD/i));

  const rawSetCookie = loginRes.headers['set-cookie'];
  const setCookieStr = Array.isArray(rawSetCookie) ? rawSetCookie.join('; ') : (rawSetCookie || '');
  assert('Set-Cookie header present after login', !!setCookieStr, `got: ${setCookieStr || 'none'}`);
  assert('Cookie is HttpOnly', setCookieStr.toLowerCase().includes('httponly'));
  assert('Cookie has Max-Age', setCookieStr.toLowerCase().includes('max-age'));

  const cookieMatch = setCookieStr.match(/studs_session=[^;]+/);
  sessionCookie = cookieMatch?.[0] || '';
  assert('Session cookie extracted for subsequent tests', !!sessionCookie);

  // ── 5. /auth/me ───────────────────────────────────────────────────────────
  console.log('\n── 5. /auth/me endpoint ─────────────────────────────────────');

  const meRes = await httpRequest('/auth/me', 'GET', null, sessionCookie);
  assert('/auth/me → 200 with valid session', meRes.status === 200, `got ${meRes.status}`);
  assert('/auth/me returns matching user', meRes.body?.user?.email === ADMIN_EMAIL);
  assert('/auth/me does not leak passwordHash', !JSON.stringify(meRes.body).includes('passwordHash'));

  const meNoAuth = await httpRequest('/auth/me', 'GET', null, '');
  assert('/auth/me → 401 without session', meNoAuth.status === 401, `got ${meNoAuth.status}`);

  // ── 6. Authenticated admin access ─────────────────────────────────────────
  console.log('\n── 6. Authenticated super_admin access ──────────────────────');

  const upsertRes = await httpRequest('/admin/content/upsert', 'POST', { chapterId: 'security-test-ch', fullNotesMarkdown: '# Test' }, sessionCookie);
  assert('Authenticated content upsert → not 401/403', upsertRes.status !== 401 && upsertRes.status !== 403, `got ${upsertRes.status}`);

  // ── 7. Logout and session revocation ──────────────────────────────────────
  console.log('\n── 7. Logout and session revocation ─────────────────────────');

  const logoutRes = await httpRequest('/auth/logout', 'POST', null, sessionCookie);
  assert('Logout → 204', logoutRes.status === 204, `got ${logoutRes.status}`);

  const afterLogoutMe = await httpRequest('/auth/me', 'GET', null, sessionCookie);
  assert('After logout, /auth/me → 401 (session revoked server-side)', afterLogoutMe.status === 401, `got ${afterLogoutMe.status}`);

  const afterLogoutAdmin = await httpRequest('/admin/generate-summary', 'POST', { chapterContentMarkdown: 'test' }, sessionCookie);
  assert('After logout, admin endpoint → 401', afterLogoutAdmin.status === 401, `got ${afterLogoutAdmin.status}`);

  // ── 8. Double logout (idempotent) ─────────────────────────────────────────
  console.log('\n── 8. Double logout (idempotent) ────────────────────────────');

  const doubleLogout = await httpRequest('/auth/logout', 'POST', null, sessionCookie);
  assert('Second logout → 204 (safe)', doubleLogout.status === 204, `got ${doubleLogout.status}`);

  // ── 9. Public routes regression ───────────────────────────────────────────
  console.log('\n── 9. Public routes (no auth required) ──────────────────────');

  const subjectsRes = await httpRequest('/subjects/4?course=Engineering%20(B.E.%2FM.E.)%3A%20Computer%20Science%20(CSE)', 'GET');
  assert('GET /subjects/:semester → 200 publicly', subjectsRes.status === 200, `got ${subjectsRes.status}`);
  assert('/subjects returns array', Array.isArray(subjectsRes.body));

  const searchRes = await httpRequest('/search?q=algorithms', 'GET');
  assert('GET /search → 200 publicly', searchRes.status === 200, `got ${searchRes.status}`);

  // ── 10. Rate limiting ─────────────────────────────────────────────────────
  console.log('\n── 10. Login rate limiting ──────────────────────────────────');

  // Re-login to reset rate limit context (different IP path), use a fresh email pattern
  let hitRateLimit = false;
  for (let i = 0; i < 12; i++) {
    const r = await httpRequest('/auth/login', 'POST', { email: `ratelimitest${i}@x.com`, password: 'badpassword' });
    if (r.status === 429) { hitRateLimit = true; break; }
  }
  assert('Rate limiting fires → 429 after repeated bad attempts', hitRateLimit);

  // ── Final ─────────────────────────────────────────────────────────────────
  console.log('\n══════════════════════════════════════════');
  console.log(`  Results: ${passed} passed, ${failed} failed`);
  console.log('══════════════════════════════════════════\n');
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error('\nTest suite error:', err.message);
  process.exit(1);
});
