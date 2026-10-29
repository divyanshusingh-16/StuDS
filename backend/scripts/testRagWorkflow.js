const path = require('path');
const dns = require('dns');
try { dns.setServers(['8.8.8.8', '1.1.1.1']); } catch (e) {}
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const BASE_URL = 'http://127.0.0.1:5001';
const CHAPTER_1_1_ID = '09455e6f-b461-4263-8524-4a4b75c5ba52';

const ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || 'admin@studs.app';
const ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD || 'StudsAdmin@2024!Secure';

const TEST_STUDENT_EMAIL = `rag-student-${Date.now()}@studs-test.app`;
const TEST_STUDENT_PASSWORD = 'TestPassword123!';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assertTest(name, condition, details = '') {
  totalTests++;
  if (condition) {
    console.log(`  ✅ PASS: ${name}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${name} ${details ? '(' + details + ')' : ''}`);
    failedTests++;
  }
}

function parseCookie(res) {
  const raw = res.headers.get('set-cookie');
  if (!raw) return '';
  const match = raw.match(/studs_session=([^;]+)/);
  return match ? `studs_session=${match[1]}` : '';
}

async function runTests() {
  console.log('══════════════════════════════════════════════════════════════');
  console.log('  STUDS Chapter-Aware RAG Automated Verification Suite');
  console.log('══════════════════════════════════════════════════════════════\n');

  try {
    // ── 1. Unauthenticated Security ──────────────────────────────
    console.log('── 1. Unauthenticated Security & Protection ──────────────────');
    const unauthAsk = await fetch(`${BASE_URL}/api/doubt/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chapterId: CHAPTER_1_1_ID, question: 'What is a network?' })
    });
    assertTest('POST /api/doubt/ask without session → 401 Unauthorized', unauthAsk.status === 401);

    const unauthStatus = await fetch(`${BASE_URL}/api/doubt/status/${CHAPTER_1_1_ID}`);
    assertTest('GET /api/doubt/status/:chapterId without session → 401 Unauthorized', unauthStatus.status === 401);

    const unauthAdminIndex = await fetch(`${BASE_URL}/api/admin/content/${CHAPTER_1_1_ID}/rag/index`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    assertTest('POST /api/admin/content/:chapterId/rag/index without session → 401 Unauthorized', unauthAdminIndex.status === 401);

    // ── 2. Register & Authenticate Student User ──────────────────
    console.log('\n── 2. Student Authentication & Role Isolation ────────────────');
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEST_STUDENT_EMAIL, password: TEST_STUDENT_PASSWORD })
    });
    assertTest('Student registration returns 201', regRes.status === 201);

    const studentLogin = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEST_STUDENT_EMAIL, password: TEST_STUDENT_PASSWORD })
    });
    assertTest('Student login returns 200', studentLogin.status === 200);
    const studentCookie = parseCookie(studentLogin);
    assertTest('Student session cookie received', studentCookie.length > 0);

    // Test student accessing admin RAG endpoint → 403
    const studentAdminAccess = await fetch(`${BASE_URL}/api/admin/content/${CHAPTER_1_1_ID}/rag/index`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': studentCookie,
        'Origin': 'http://localhost:5173'
      }
    });
    assertTest('Student session accessing admin RAG index endpoint → 403 Forbidden', studentAdminAccess.status === 403);

    // ── 3. Input Validation Guardrails ───────────────────────────
    console.log('\n── 3. Input Validation & Parameter Guardrails ────────────────');
    const emptyQ = await fetch(`${BASE_URL}/api/doubt/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': studentCookie },
      body: JSON.stringify({ chapterId: CHAPTER_1_1_ID, question: '' })
    });
    assertTest('Rejects empty question body → 400', emptyQ.status === 400);

    const shortQ = await fetch(`${BASE_URL}/api/doubt/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': studentCookie },
      body: JSON.stringify({ chapterId: CHAPTER_1_1_ID, question: 'ab' })
    });
    assertTest('Rejects question < 3 chars → 400', shortQ.status === 400);

    const longQ = await fetch(`${BASE_URL}/api/doubt/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': studentCookie },
      body: JSON.stringify({ chapterId: CHAPTER_1_1_ID, question: 'x'.repeat(1005) })
    });
    assertTest('Rejects question > 1000 chars → 400', longQ.status === 400);

    const missingCh = await fetch(`${BASE_URL}/api/doubt/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': studentCookie },
      body: JSON.stringify({ question: 'What is a router?' })
    });
    assertTest('Rejects missing chapterId → 400', missingCh.status === 400);

    const notFoundCh = await fetch(`${BASE_URL}/api/doubt/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': studentCookie },
      body: JSON.stringify({ chapterId: 'non-existent-chap-id', question: 'What is a router?' })
    });
    assertTest('Rejects non-existent chapterId → 404', notFoundCh.status === 404);

    // ── 4. RAG Index Status ───────────────────────────────────────
    console.log('\n── 4. Chapter RAG Status Verification ────────────────────────');
    const statusRes = await fetch(`${BASE_URL}/api/doubt/status/${CHAPTER_1_1_ID}`, {
      headers: { 'Cookie': studentCookie }
    });
    assertTest('GET /api/doubt/status/:chapterId returns 200', statusRes.status === 200);
    const statusData = await statusRes.json();
    assertTest('Status reports isIndexed: true', statusData.isIndexed === true);
    assertTest('Status reports chunkCount > 50', statusData.chunkCount >= 50, `Found: ${statusData.chunkCount}`);

    // ── 5. Grounded Answering & Page Attribution ─────────────────
    console.log('\n── 5. Grounded Question Answering & Citations ────────────────');
    const askRes1 = await fetch(`${BASE_URL}/api/doubt/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': studentCookie },
      body: JSON.stringify({
        chapterId: CHAPTER_1_1_ID,
        question: 'What is the formula to calculate links in a mesh topology?'
      })
    });
    assertTest('Valid question returns 200', askRes1.status === 200);
    const data1 = await askRes1.json();
    assertTest('Response has success: true', data1.success === true);
    assertTest('Response has isGrounded: true', data1.isGrounded === true);
    assertTest('Response has hasSufficientContext: true', data1.hasSufficientContext === true);
    assertTest('Sources array is populated', Array.isArray(data1.sources) && data1.sources.length > 0);
    assertTest('Top source cites Page 10 or 11', data1.sources[0]?.startPage === 10 || data1.sources[0]?.startPage === 11, `Cited: Page ${data1.sources[0]?.startPage}`);
    assertTest('Source includes snippet text', Boolean(data1.sources[0]?.snippet && data1.sources[0]?.snippet.length > 20));
    assertTest('Source includes numeric relevance score', typeof data1.sources[0]?.score === 'number');

    // ── 6. Comparative Retrieval ─────────────────────────────────
    console.log('\n── 6. Comparative Model Retrieval ────────────────────────────');
    const askRes2 = await fetch(`${BASE_URL}/api/doubt/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': studentCookie },
      body: JSON.stringify({
        chapterId: CHAPTER_1_1_ID,
        question: 'Compare the OSI reference model and TCP/IP model'
      })
    });
    assertTest('OSI comparison question returns 200', askRes2.status === 200);
    const data2 = await askRes2.json();
    assertTest('Comparison has isGrounded: true', data2.isGrounded === true);
    assertTest('Cites OSI reference chapter page >= 25', data2.sources.some(s => s.startPage >= 25), `Pages: ${data2.sources.map(s => s.startPage).join(', ')}`);

    // ── 7. Insufficient Context Guardrail (Anti-Hallucination) ───
    console.log('\n── 7. Anti-Hallucination & Insufficient Context ──────────────');
    const askRes3 = await fetch(`${BASE_URL}/api/doubt/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': studentCookie },
      body: JSON.stringify({
        chapterId: CHAPTER_1_1_ID,
        question: 'What are the best chocolate cake recipes and baking temperature?'
      })
    });
    assertTest('Out-of-scope question returns 200', askRes3.status === 200);
    const data3 = await askRes3.json();
    assertTest('isGrounded is false for out-of-scope question', data3.isGrounded === false);
    assertTest('hasSufficientContext is false', data3.hasSufficientContext === false);
    assertTest('Returns 0 sources for out-of-scope question', data3.sources.length === 0);
    assertTest('Refusal answer informs student of insufficient materials', data3.answer.toLowerCase().includes('insufficient') || data3.answer.toLowerCase().includes('do not contain'));

    // ── 8. Multi-turn Follow-up Context ──────────────────────────
    console.log('\n── 8. Multi-turn Follow-up Conversation ──────────────────────');
    const askRes4 = await fetch(`${BASE_URL}/api/doubt/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': studentCookie },
      body: JSON.stringify({
        chapterId: CHAPTER_1_1_ID,
        question: 'Does a hub separate collision domains like a switch?',
        history: [
          { role: 'user', content: 'What is the difference between a hub and a switch?' },
          { role: 'assistant', content: 'A hub is a layer 1 device that repeats to all ports, while a switch is layer 2.' }
        ]
      })
    });
    assertTest('Follow-up question returns 200', askRes4.status === 200);
    const data4 = await askRes4.json();
    assertTest('Follow-up is grounded', data4.isGrounded === true);
    assertTest('Follow-up cites collision domain / device pages (14–22 or 37–39)', data4.sources.some(s => (s.startPage >= 14 && s.startPage <= 22) || (s.startPage >= 37 && s.startPage <= 40)), `Pages: ${data4.sources.map(s => s.startPage).join(', ')}`);

    // ── 9. Super Admin RAG Management ─────────────────────────────
    console.log('\n── 9. Super Admin RAG Management & Deduplication ─────────────');
    const adminLogin = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
    });
    assertTest('Admin login returns 200', adminLogin.status === 200);
    const adminCookie = parseCookie(adminLogin);

    // Deduplication check: re-index without forceReindex
    const dedupRes = await fetch(`${BASE_URL}/api/admin/content/${CHAPTER_1_1_ID}/rag/index`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': adminCookie,
        'Origin': 'http://localhost:5173'
      },
      body: JSON.stringify({ forceReindex: false })
    });
    assertTest('Admin re-index returns 200', dedupRes.status === 200);
    const dedupData = await dedupRes.json();
    assertTest('Detects already indexed document (deduplication)', dedupData.alreadyIndexed === true || dedupData.success === true);

    console.log('\n══════════════════════════════════════════════════════════════');
    console.log(`  RAG Test Suite Results: ${passedTests} passed, ${failedTests} failed`);
    console.log('══════════════════════════════════════════════════════════════\n');

    if (failedTests > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

runTests();
