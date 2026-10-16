const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const http = require('http');

const PORT = parseInt(process.env.PORT || '5001', 10);
const HOST = '127.0.0.1';
const BASE = '/api';
const CHAPTER_ID = '09455e6f-b461-4263-8524-4a4b75c5ba52'; // Chapter 1.1 Computer Networks

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

function makeRequest({ path: reqPath, method = 'GET', body = null, headers = {}, cookie = '' }) {
  return new Promise((resolve, reject) => {
    const finalHeaders = {
      'Origin': 'http://localhost:5173',
      ...headers,
    };
    if (cookie) finalHeaders['Cookie'] = cookie;

    let payload = null;
    if (body) {
      if (Buffer.isBuffer(body)) {
        payload = body;
      } else if (typeof body === 'object') {
        finalHeaders['Content-Type'] = 'application/json';
        payload = Buffer.from(JSON.stringify(body));
      } else {
        payload = Buffer.from(body);
      }
      finalHeaders['Content-Length'] = payload.length;
    }

    let requestPath = reqPath;
    if (requestPath.startsWith('http://') || requestPath.startsWith('https://')) {
      try {
        const parsed = new URL(requestPath);
        requestPath = parsed.pathname;
      } catch (e) {}
    } else if (!requestPath.startsWith('/api') && !requestPath.startsWith('/uploads')) {
      requestPath = BASE + requestPath;
    }

    const options = {
      hostname: HOST,
      port: PORT,
      path: requestPath,
      method,
      headers: finalHeaders,
    };

    const req = http.request(options, (res) => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString();
        let json = null;
        try { json = JSON.parse(raw); } catch (e) {}
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: json || raw,
          raw
        });
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function runTests() {
  console.log('\n============================================================');
  console.log('   STUDS: Validate & Clean Extracted Chapter Notes Test Suite');
  console.log('============================================================\n');

  // STEP 1: Admin Login
  console.log('▶ STEP 1: Authenticate Super Admin');
  {
    const loginRes = await makeRequest({
      path: '/auth/login',
      method: 'POST',
      body: {
        email: process.env.ADMIN_EMAIL || 'admin@studs.app',
        password: process.env.ADMIN_PASSWORD || 'StudsAdmin@2024!Secure'
      }
    });

    assert('Admin login successful (200)', loginRes.status === 200, `got ${loginRes.status}`);
    const setCookie = loginRes.headers['set-cookie'];
    sessionCookie = Array.isArray(setCookie) ? setCookie.join('; ') : setCookie;
    assert('Session cookie received', !!sessionCookie);
  }

  // STEP 2: Verify Note and PDF Association in Database
  let targetNoteId = '';
  let noteOriginalPdfUrl = '';
  console.log('\n▶ STEP 2: Inspect Existing Chapter 1.1 Notes & PDF Association');
  {
    const notesRes = await makeRequest({
      path: `/admin/content/${CHAPTER_ID}/notes`,
      method: 'GET',
      cookie: sessionCookie
    });

    assert('Fetch notes succeeds (200)', notesRes.status === 200);
    assert('At least one note exists for Chapter 1.1', Array.isArray(notesRes.body) && notesRes.body.length > 0);

    const cnNote = (notesRes.body || []).find(n => n.fileName?.includes('Computer_Networks') || n.rawExtractedText?.length > 50000) || notesRes.body[0];
    assert('Computer Networks Chapter 1.1 note found', !!cnNote);
    targetNoteId = cnNote._id;
    noteOriginalPdfUrl = cnNote.fileUrl;

    assert('Source PDF is attached', !!cnNote.fileUrl);
    assert('PDF fileName preserved', !!cnNote.fileName);
    assert('Original raw text captured (~78,062 chars)', (cnNote.rawExtractedText?.length || 0) > 70000, `length: ${cnNote.rawExtractedText?.length}`);
  }

  // STEP 3: Execute Note Cleaning Pipeline via API
  let cleanedMarkdown = '';
  console.log('\n▶ STEP 3: Clean Extracted Notes via API (/admin/clean-extracted-text)');
  {
    const cleanRes = await makeRequest({
      path: '/admin/clean-extracted-text',
      method: 'POST',
      body: {
        chapterId: CHAPTER_ID,
        noteId: targetNoteId,
        saveToNote: true
      },
      cookie: sessionCookie
    });

    assert('Clean endpoint returns 200', cleanRes.status === 200, `got ${cleanRes.status}`);
    assert('Success flag is true', cleanRes.body?.success === true);
    cleanedMarkdown = cleanRes.body?.extractedMarkdown || '';

    // Requirement 1: Headers & footers removed
    assert('Page number markers ("-- X of 41 --") removed', !/--\s*\d+\s*of\s*\d+\s*--/i.test(cleanedMarkdown));
    assert('Repeated running headers removed', !/Computer Networks\s*\|\s*Unit 1\s*\|\s*Chapter 1\.1/i.test(cleanedMarkdown));
    assert('Repeated footers ("STUDS | Study Notes Page X") removed', !/STUDS\s*\|\s*Study Notes Page\s*\d+/i.test(cleanedMarkdown));

    // Requirement 2: Markdown heading levels
    assert('Document has Level 1 Title', cleanedMarkdown.includes('# Computer Networks'));
    assert('Major sections converted to Level 2 (##)', cleanedMarkdown.includes('## 1. Introduction') && cleanedMarkdown.includes('## 4. Network Topologies'));
    assert('Subsections converted to Level 3 (###)', cleanedMarkdown.includes('### 1.1 Data Communication') && cleanedMarkdown.includes('### 4.1 Bus Topology'));

    // Requirement 3 & 4: Tables preserved and converted to Markdown tables
    assert('Identifiable tables converted to Markdown tables', (cleanedMarkdown.match(/\| :---/g) || []).length >= 5);
    assert('LAN vs MAN vs WAN comparison table present', cleanedMarkdown.includes('| Local Area Network (LAN) | Metropolitan Area Network (MAN) | Wide Area Network (WAN) |'));
    assert('Network Topologies comparison table present', cleanedMarkdown.includes('| Bus Topology | Star Topology | Ring Topology | Mesh Topology | Tree Topology |'));
    assert('OSI vs TCP/IP comparison table present', cleanedMarkdown.includes('| OSI Reference Model | TCP/IP Model |'));
    assert('OSI Seven Layers table present', cleanedMarkdown.includes('| **7** | **Application Layer** |'));

    // Requirement 5: ASCII diagrams preserved in code blocks
    assert('ASCII Diagrams preserved in ```text code blocks', (cleanedMarkdown.match(/```text/g) || []).length >= 5);
    assert('Client-Server model diagram preserved', cleanedMarkdown.includes('Figure 2.1: Client-Server Architecture'));
    assert('Bus topology diagram preserved', cleanedMarkdown.includes('Backbone Cable'));
    assert('Star topology diagram preserved', cleanedMarkdown.includes('Hub/Switch'));
    assert('Mesh topology diagram preserved', cleanedMarkdown.includes('Full Mesh Topology'));

    // Requirement 8: Non-truncation verification (accounting for all sections)
    assert('Cleaned content is complete and non-truncated (>70,000 chars)', cleanedMarkdown.length > 70000, `got ${cleanedMarkdown.length}`);
    assert('Ending section (Possible Exam Questions) present', cleanedMarkdown.includes('## Possible Exam Questions'));
    assert('Quick revision summary table present', cleanedMarkdown.includes('## Quick Revision Summary'));

    // Requirement 9: Syllabus verification (19/19 topics)
    const verification = cleanRes.body?.syllabusVerification;
    assert('Syllabus verification returned', !!verification);
    assert('All 19 syllabus topics covered (100%)', verification?.coveredCount === 19 && verification?.coveragePercent === 100);
  }

  // STEP 4: Verify Separation of Raw Text vs Cleaned Markdown (Requirement 6)
  console.log('\n▶ STEP 4: Raw Text & Cleaned Markdown Separation in Database (Requirement 6)');
  {
    const noteCheck = await makeRequest({
      path: `/admin/content/${CHAPTER_ID}/notes`,
      method: 'GET',
      cookie: sessionCookie
    });

    const noteInDb = (noteCheck.body || []).find(n => n._id === targetNoteId);
    assert('Note exists in database', !!noteInDb);
    assert('Raw extracted text is preserved untouched (~78,062 chars)', (noteInDb.rawExtractedText?.length || 0) > 70000);
    assert('Cleaned markdown is stored in extractedMarkdown field', (noteInDb.extractedMarkdown?.length || 0) > 70000);
    assert('Raw text and Cleaned markdown are distinct strings', noteInDb.rawExtractedText !== noteInDb.extractedMarkdown);
  }

  // STEP 5: Admin Edit of Cleaned Notes (Requirement 7)
  console.log('\n▶ STEP 5: Admin Edit & Save of Cleaned Notes (Requirement 7)');
  {
    const editedMarkdown = cleanedMarkdown + '\n\n> 📝 **Instructor Note**: Verified and approved for Semester 5 Computer Networks examinations.';
    const updateRes = await makeRequest({
      path: `/admin/content/${CHAPTER_ID}/notes/${targetNoteId}`,
      method: 'PUT',
      body: {
        extractedMarkdown: editedMarkdown
      },
      cookie: sessionCookie
    });

    assert('Update note succeeds (200)', updateRes.status === 200);
    assert('Edited markdown persisted to database', updateRes.body?.extractedMarkdown?.includes('Instructor Note'));
  }

  // STEP 6: Apply to Published Content and Verify Student Portal
  console.log('\n▶ STEP 6: Apply to Published Content & Student Portal Verification');
  {
    const publishRes = await makeRequest({
      path: `/admin/content/${CHAPTER_ID}/notes/${targetNoteId}`,
      method: 'PUT',
      body: {
        content: cleanedMarkdown,
        status: 'published'
      },
      cookie: sessionCookie
    });

    assert('Publish note succeeds (200)', publishRes.status === 200);
    assert('Note status is published', publishRes.body?.status === 'published');
    assert('Note content field populated with cleaned markdown', publishRes.body?.content?.length > 70000);

    // Verify Student Portal view
    const studentRes = await makeRequest({
      path: `/content/${CHAPTER_ID}`,
      method: 'GET'
    });

    assert('Student portal responds with 200', studentRes.status === 200);
    const studentNote = (studentRes.body?.notes || []).find(n => n._id === targetNoteId);
    assert('Published note visible to students', !!studentNote);
    assert('Student receives cleaned markdown content', studentNote?.content?.length > 70000);
    assert('Student content includes markdown tables', studentNote?.content?.includes('| Local Area Network (LAN) |'));
    assert('Student content includes topology diagrams', studentNote?.content?.includes('Figure 4.1: Bus Topology'));

    // Requirement 10: Original PDF remains viewable and downloadable
    assert('Student receives original PDF URL', !!studentNote?.fileUrl);
    const pdfFetch = await makeRequest({
      path: studentNote.fileUrl,
      method: 'GET'
    });
    assert('Original PDF is accessible and downloadable (200)', pdfFetch.status === 200);
  }

  console.log('\n============================================================');
  console.log(`  RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('============================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
