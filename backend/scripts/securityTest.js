#!/usr/bin/env node
/**
 * STUDS Comprehensive Security & Regression Test Suite
 * Tests mandatory student authentication, role isolation, session enforcement,
 * public health checks, and search relevance ranking.
 *
 * Run: node scripts/securityTest.js
 */
'use strict';
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const http = require('http');

const HOST = '127.0.0.1';
const PORT = parseInt(process.env.TEST_PORT || process.env.PORT || '5001', 10);
const BASE = '/api';
const ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || 'admin@studs.app';
const ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD || 'StudsAdmin@2024!Secure';
const AGENT = new http.Agent({ keepAlive: false });

let passed = 0;
let failed = 0;
let adminSessionCookie = '';
let studentSessionCookie = '';

function assert(label, condition, detail = '') {
  if (condition) {
    console.log(`  ✅ PASS: ${label}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${label}${detail ? ' — ' + detail : ''}`);
    failed++;
  }
}

function httpRequest(path, method = 'GET', body = null, cookieStr = '', rawPath = false) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : null;
    const headers = {
      'Content-Type': 'application/json',
      'Origin': 'http://localhost:5173',
    };
    if (cookieStr) headers['Cookie'] = cookieStr;
    if (bodyStr) headers['Content-Length'] = Buffer.byteLength(bodyStr);

    const fullPath = rawPath ? path : BASE + path;
    const options = { hostname: HOST, port: PORT, path: fullPath, method, headers, agent: AGENT };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let parsed = {};
        try { parsed = JSON.parse(data); } catch {}
        resolve({ status: res.statusCode, body: parsed, headers: res.headers, rawText: data });
      });
    });
    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

async function run() {
  console.log('\n══════════════════════════════════════════════════════════════');
  console.log('  STUDS Security, Authentication & Search Test Suite');
  console.log('══════════════════════════════════════════════════════════════\n');

  // ── 1. Public endpoints and health checks ────────────────────────────────
  console.log('── 1. Public endpoints and health checks ────────────────────');
  const rootHealth = await httpRequest('/', 'GET', null, '', true);
  assert('GET / → 200 publicly (API active)', rootHealth.status === 200, `got ${rootHealth.status}`);

  const apiHealth = await httpRequest('/health', 'GET');
  assert('GET /api/health → 200 publicly', apiHealth.status === 200, `got ${apiHealth.status}`);

  // ── 2. Unauthenticated learning API endpoints ────────────────────────────
  console.log('\n── 2. Unauthenticated access protection (Mandatory Auth) ───');
  const protectedStudentEndpoints = [
    ['/subjects/5', 'GET'],
    ['/units/some-subject-id', 'GET'],
    ['/search?q=comp', 'GET'],
    ['/content/09455e6f-b461-4263-8524-4a4b75c5ba52', 'GET'],
    ['/quiz/09455e6f-b461-4263-8524-4a4b75c5ba52/attempt', 'GET'],
    ['/quiz/09455e6f-b461-4263-8524-4a4b75c5ba52/submit', 'POST'],
  ];

  for (const [path, method] of protectedStudentEndpoints) {
    const r = await httpRequest(path, method, method === 'POST' ? { answers: [] } : null);
    assert(`${method} ${path} without session → 401 Unauthorized`, r.status === 401, `got ${r.status}`);
  }

  // Unauthenticated admin access
  const adminEndpoints = [
    ['/admin/subject', 'POST', {}],
    ['/admin/unit', 'POST', {}],
    ['/admin/content/upsert', 'POST', {}],
    ['/admin/generate-summary', 'POST', { chapterContentMarkdown: 'test' }],
  ];
  for (const [path, method, body] of adminEndpoints) {
    const r = await httpRequest(path, method, body);
    assert(`${method} ${path} without session → 401`, r.status === 401, `got ${r.status}`);
  }

  // ── 3. Login input validation ─────────────────────────────────────────────
  console.log('\n── 3. Login input validation ────────────────────────────────');
  const badInputs = [
    [{}, 'empty body'],
    [{ email: 'not-an-email-or-uid!', password: 'pass' }, 'malformed identifier'],
    [{ email: ADMIN_EMAIL }, 'missing password'],
    [{ password: 'pass' }, 'missing email/username'],
    [{ email: ADMIN_EMAIL, password: '' }, 'empty password'],
    [{ email: ADMIN_EMAIL, password: 'x'.repeat(1025) }, 'password > 1024 chars'],
  ];
  for (const [body, label] of badInputs) {
    const r = await httpRequest('/auth/login', 'POST', body);
    assert(`Login rejects ${label} → 400`, r.status === 400, `got ${r.status}`);
  }

  // ── 4. Student registration security & journey ────────────────────────────
  console.log('\n── 4. Student registration security & journey ──────────────');
  const TEST_STUDENT_EMAIL = `sec-student-${Date.now()}@studs-test.app`;
  const TEST_STUDENT_PASSWORD = 'TestStudent@8chars!';

  // 4a. Short password
  const shortPass = await httpRequest('/auth/register', 'POST', { email: TEST_STUDENT_EMAIL, password: 'short' });
  assert('Register: short password (<8 chars) → 400', shortPass.status === 400, `got ${shortPass.status}`);

  // 4b. Invalid identifier
  const badId = await httpRequest('/auth/register', 'POST', { email: '!!invalid!!', password: TEST_STUDENT_PASSWORD });
  assert('Register: invalid email/UID → 400', badId.status === 400, `got ${badId.status}`);

  // 4c. Successful registration returns 201 AND does NOT issue session cookie
  const regRes = await httpRequest('/auth/register', 'POST', { email: TEST_STUDENT_EMAIL, password: TEST_STUDENT_PASSWORD });
  assert('Register: valid input → 201 Created', regRes.status === 201, `got ${regRes.status}`);
  assert('Register: user role is "student" on server', regRes.body?.user?.role === 'student', `got ${regRes.body?.user?.role}`);
  assert('Register: does NOT leak passwordHash', !JSON.stringify(regRes.body).includes('passwordHash'));

  const rawRegCookies = regRes.headers['set-cookie'];
  const regCookieStr = Array.isArray(rawRegCookies) ? rawRegCookies.join('; ') : (rawRegCookies || '');
  assert('Register: does NOT auto-login (no session cookie issued)', !regCookieStr.includes('studs_session'), 'session cookie was unexpectedly set');

  // 4d. College UID registration support (e.g. 22BCS10142)
  const TEST_UID = `UID${Date.now().toString().slice(-6)}`;
  const regUidRes = await httpRequest('/auth/register', 'POST', { username: TEST_UID, password: TEST_STUDENT_PASSWORD });
  assert('Register: accepts valid College UID format → 201', regUidRes.status === 201, `got ${regUidRes.status}`);
  assert('Register: UID correctly recorded in user object', regUidRes.body?.user?.uid === TEST_UID, `got ${regUidRes.body?.user?.uid}`);

  // 4e. Role injection prevention
  const roleInject = await httpRequest('/auth/register', 'POST', {
    email: `role-inj-${Date.now()}@studs-test.app`,
    password: TEST_STUDENT_PASSWORD,
    role: 'super_admin',
  });
  assert('Register: client-supplied "super_admin" role overridden to "student"',
    roleInject.body?.user?.role === 'student',
    `got role: ${roleInject.body?.user?.role}`);

  // 4f. Duplicate detection
  const dup = await httpRequest('/auth/register', 'POST', { email: TEST_STUDENT_EMAIL, password: TEST_STUDENT_PASSWORD });
  assert('Register: duplicate email/UID → 409 Conflict', dup.status === 409, `got ${dup.status}`);

  // ── 5. Student login & session ────────────────────────────────────────────
  console.log('\n── 5. Student login & session issuance ─────────────────────');
  const studentLoginRes = await httpRequest('/auth/login', 'POST', { email: TEST_STUDENT_EMAIL, password: TEST_STUDENT_PASSWORD });
  assert('Student login: valid credentials → 200', studentLoginRes.status === 200, `got ${studentLoginRes.status}`);
  assert('Student login: returns role "student"', studentLoginRes.body?.user?.role === 'student');

  const rawStudentCookies = studentLoginRes.headers['set-cookie'];
  const studentCookieStr = Array.isArray(rawStudentCookies) ? rawStudentCookies.join('; ') : (rawStudentCookies || '');
  const studentCookieMatch = studentCookieStr.match(/studs_session=[^;]+/);
  studentSessionCookie = studentCookieMatch?.[0] || '';
  assert('Student login: issues HttpOnly session cookie', !!studentSessionCookie && studentCookieStr.toLowerCase().includes('httponly'));

  // Test College UID login
  const uidLoginRes = await httpRequest('/auth/login', 'POST', { username: TEST_UID, password: TEST_STUDENT_PASSWORD });
  assert('Student login: sign in with College UID → 200', uidLoginRes.status === 200, `got ${uidLoginRes.status}`);

  // ── 6. Student authenticated access & role enforcement ────────────────────
  console.log('\n── 6. Authenticated student access & role isolation ─────────');
  const semRes = await httpRequest('/subjects/5', 'GET', null, studentSessionCookie);
  assert('Student with session: GET /subjects/5 → 200', semRes.status === 200, `got ${semRes.status}`);
  assert('Student with session: /subjects returns array', Array.isArray(semRes.body));

  // Role isolation: student trying to access admin endpoint → 403 Forbidden
  const studentAdminAttempt = await httpRequest('/admin/subject', 'POST', { subjectName: 'Hacked' }, studentSessionCookie);
  assert('Student accessing /admin/subject → 403 Forbidden', studentAdminAttempt.status === 403, `got ${studentAdminAttempt.status}`);

  // ── 7. Search accuracy, partial matching & relevance ranking ──────────────
  console.log('\n── 7. Search accuracy & regression verification ────────────');
  const searchQueries = [
    { q: 'co', expectContains: ['Competitive Coding', 'Computer Networks'] },
    { q: 'comp', expectContains: ['Computer Networks', 'Competitive Coding'] },
    { q: 'competitive', expectContains: ['Competitive Coding'] },
    { q: 'competitive coding', topExpect: 'Competitive Coding – II' },
    { q: 'intro', expectContains: ['1.1 Introduction'] },
    { q: 'introduction', topExpect: '1.1 Introduction' },
    { q: 'network', expectContains: ['Computer Networks'] },
    { q: 'CS503', topExpect: 'Competitive Coding – II' },
    { q: 'CS504', topExpect: 'Computer Networks' },
    { q: 'physical layer', expectContains: ['Physical Layer'] },
  ];

  for (const item of searchQueries) {
    const sRes = await httpRequest(`/search?q=${encodeURIComponent(item.q)}&semester=5`, 'GET', null, studentSessionCookie);
    assert(`Search "${item.q}": returns 200 array`, sRes.status === 200 && Array.isArray(sRes.body), `got ${sRes.status}`);
    const results = sRes.body || [];
    assert(`Search "${item.q}": returns > 0 results`, results.length > 0, `results count: ${results.length}`);

    if (item.topExpect) {
      const topTitle = results[0]?.title || '';
      assert(`Search "${item.q}": top result is "${item.topExpect}"`,
        topTitle.toLowerCase().includes(item.topExpect.toLowerCase()),
        `got top result: "${topTitle}"`);
    }

    if (item.expectContains) {
      for (const exp of item.expectContains) {
        const found = results.some(r =>
          (r.title && r.title.toLowerCase().includes(exp.toLowerCase())) ||
          (r.parentContext && r.parentContext.toLowerCase().includes(exp.toLowerCase()))
        );
        assert(`Search "${item.q}": results contain "${exp}"`, found, `not found in [${results.map(r => r.title).join(', ')}]`);
      }
    }
  }

  // ── 8. Admin authentication & admin portal access ────────────────────────
  console.log('\n── 8. Admin authentication & privileges ─────────────────────');
  const adminLoginRes = await httpRequest('/auth/login', 'POST', { email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
  assert('Admin login: valid super_admin credentials → 200', adminLoginRes.status === 200, `got ${adminLoginRes.status}`);
  assert('Admin login: user role is super_admin', adminLoginRes.body?.user?.role === 'super_admin');

  const rawAdminCookies = adminLoginRes.headers['set-cookie'];
  const adminCookieStr = Array.isArray(rawAdminCookies) ? rawAdminCookies.join('; ') : (rawAdminCookies || '');
  const adminCookieMatch = adminCookieStr.match(/studs_session=[^;]+/);
  adminSessionCookie = adminCookieMatch?.[0] || '';
  assert('Admin login: session cookie extracted', !!adminSessionCookie);

  const adminMe = await httpRequest('/auth/me', 'GET', null, adminSessionCookie);
  assert('/auth/me with admin session → 200 with role super_admin', adminMe.status === 200 && adminMe.body?.user?.role === 'super_admin');

  // ── 9. Student logout and session invalidation ─────────────────────────────
  console.log('\n── 9. Logout and session invalidation ───────────────────────');
  const logoutRes = await httpRequest('/auth/logout', 'POST', null, studentSessionCookie);
  assert('Student logout → 204 No Content', logoutRes.status === 204, `got ${logoutRes.status}`);

  const afterLogoutSubjects = await httpRequest('/subjects/5', 'GET', null, studentSessionCookie);
  assert('After logout, GET /subjects/5 → 401 Unauthorized', afterLogoutSubjects.status === 401, `got ${afterLogoutSubjects.status}`);

  const afterLogoutSearch = await httpRequest('/search?q=comp', 'GET', null, studentSessionCookie);
  assert('After logout, GET /search → 401 Unauthorized', afterLogoutSearch.status === 401, `got ${afterLogoutSearch.status}`);

  // Cleanup admin session
  await httpRequest('/auth/logout', 'POST', null, adminSessionCookie);

  // ── Final ─────────────────────────────────────────────────────────────────
  console.log('\n══════════════════════════════════════════════════════════════');
  console.log(`  Results: ${passed} passed, ${failed} failed`);
  console.log('══════════════════════════════════════════════════════════════\n');
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error('\nTest suite error:', err.message);
  process.exit(1);
});
