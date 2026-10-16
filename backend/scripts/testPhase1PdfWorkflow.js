require('dotenv').config();
const http = require('http');
const https = require('https');
const path = require('path');
const fs = require('fs');

const PORT = parseInt(process.env.PORT || '5001', 10);
const HOST = '127.0.0.1';
const BASE = '/api';
const CHAPTER_ID = '09455e6f-b461-4263-8524-4a4b75c5ba52'; // Chapter 1.1

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

function createMultipartBody(fields, files, boundary) {
  const chunks = [];

  for (const [key, value] of Object.entries(fields)) {
    chunks.push(Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${value}\r\n`
    ));
  }

  for (const file of files) {
    chunks.push(Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="${file.name}"; filename="${file.filename}"\r\nContent-Type: ${file.contentType}\r\n\r\n`
    ));
    chunks.push(file.content);
    chunks.push(Buffer.from('\r\n'));
  }

  chunks.push(Buffer.from(`--${boundary}--\r\n`));
  return Buffer.concat(chunks);
}

// Generate valid minimal PDF buffer
function generateSamplePdf(title = 'Chapter 1.1 Study Notes') {
  const content = `%PDF-1.5
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << >> >>
endobj
4 0 obj
<< /Length 51 >>
stream
BT
/F1 24 Tf
100 700 Td
(${title}) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000216 00000 n 
trailer
<< /Size 5 /Root 1 0 R >>
startxref
318
%%EOF`;
  return Buffer.from(content);
}

async function runTests() {
  console.log('\n============================================================');
  console.log('   STUDS PHASE 1: Chapter Notes PDF Workflow Test Suite');
  console.log('============================================================\n');

  // TEST 8: Verify unauthorized users cannot upload, edit, publish, or delete notes
  console.log('▶ TEST CASE 8: Security & Unauthorized Access Guards');
  {
    const uploadRes = await makeRequest({ path: '/admin/upload-notes-pdf', method: 'POST' });
    assert('Unauthorized PDF upload returns 401', uploadRes.status === 401, `got ${uploadRes.status}`);

    const createRes = await makeRequest({ path: `/admin/content/${CHAPTER_ID}/notes`, method: 'POST', body: { title: 'Hacked' } });
    assert('Unauthorized note creation returns 401', createRes.status === 401, `got ${createRes.status}`);

    const updateRes = await makeRequest({ path: `/admin/content/${CHAPTER_ID}/notes/fakeid`, method: 'PUT', body: { title: 'Hacked' } });
    assert('Unauthorized note update returns 401', updateRes.status === 401, `got ${updateRes.status}`);

    const deleteRes = await makeRequest({ path: `/admin/content/${CHAPTER_ID}/notes/fakeid`, method: 'DELETE' });
    assert('Unauthorized note deletion returns 401', deleteRes.status === 401, `got ${deleteRes.status}`);
  }

  // TEST 7: Attempt invalid file uploads and confirm they are rejected
  console.log('\n▶ TEST CASE 7: Invalid File Upload & Magic-Byte Validation');
  {
    // Login first as admin
    const loginRes = await makeRequest({
      path: '/auth/login',
      method: 'POST',
      body: { email: 'admin@studs.app', password: 'StudsAdmin@2024!Secure' }
    });
    assert('Admin login successful (200)', loginRes.status === 200, `got ${loginRes.status}`);
    const setCookie = loginRes.headers['set-cookie'];
    sessionCookie = Array.isArray(setCookie) ? setCookie.join('; ') : setCookie;
    assert('Session cookie received', !!sessionCookie);

    // 7A: Fake PDF (a text file renamed to fake_notes.pdf)
    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
    const fakeFileContent = Buffer.from('THIS IS NOT A REAL PDF FILE. NO MAGIC BYTES.');
    const bodyFake = createMultipartBody({}, [{
      name: 'file',
      filename: 'fake_notes.pdf',
      contentType: 'application/pdf',
      content: fakeFileContent
    }], boundary);

    const fakeUploadRes = await makeRequest({
      path: '/admin/upload-notes-pdf',
      method: 'POST',
      headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
      body: bodyFake,
      cookie: sessionCookie
    });

    assert('Fake PDF without %PDF- magic bytes rejected with 400', fakeUploadRes.status === 400, `got ${fakeUploadRes.status}`);
    assert('Clear validation error message for non-genuine PDF', typeof fakeUploadRes.body?.error === 'string' && fakeUploadRes.body.error.includes('genuine PDF'));

    // 7B: Empty file upload
    const emptyUploadRes = await makeRequest({
      path: '/admin/upload-notes-pdf',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {},
      cookie: sessionCookie
    });
    assert('Empty upload request rejected with 400', emptyUploadRes.status === 400, `got ${emptyUploadRes.status}`);
  }

  // TEST 1: Upload a valid PDF to Chapter 1.1 and preview it
  console.log('\n▶ TEST CASE 1: Valid PDF Upload & Preview for Chapter 1.1');
  let uploadedPdf1 = null;
  {
    const boundary = '----WebKitFormBoundarySamplePdfUpload1';
    const samplePdfBuffer = generateSamplePdf('Chapter 1.1 Introduction to Computer Networks');
    const bodyValid = createMultipartBody({}, [{
      name: 'file',
      filename: 'Chapter_1.1_Introduction_Notes.pdf',
      contentType: 'application/pdf',
      content: samplePdfBuffer
    }], boundary);

    const uploadRes = await makeRequest({
      path: '/admin/upload-notes-pdf',
      method: 'POST',
      headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
      body: bodyValid,
      cookie: sessionCookie
    });

    assert('Valid PDF upload succeeds with 200', uploadRes.status === 200, `got ${uploadRes.status}`);
    assert('Response returns fileUrl', !!uploadRes.body?.fileUrl, uploadRes.body?.fileUrl);
    assert('Response returns fileName', uploadRes.body?.fileName === 'Chapter_1.1_Introduction_Notes.pdf');
    assert('Response returns fileSize', uploadRes.body?.fileSize === samplePdfBuffer.length);
    assert('Response returns mimeType application/pdf', uploadRes.body?.mimeType === 'application/pdf');

    uploadedPdf1 = uploadRes.body;

    // Verify preview / access via HTTP GET
    const previewRes = await makeRequest({
      path: uploadedPdf1.fileUrl,
      method: 'GET'
    });
    assert('PDF file is previewable & accessible via HTTP GET (200)', previewRes.status === 200, `got ${previewRes.status}`);
  }

  // TEST 2: Save as Draft and verify hidden from Student Portal
  console.log('\n▶ TEST CASE 2: Save as Draft & Student Privacy Verification');
  let testNoteId = null;
  {
    const notePayload = {
      title: 'Chapter 1.1 Introduction Notes (Comprehensive)',
      content: '## Chapter 1.1 Overview\n- Fundamental network hardware\n- Topologies and models',
      status: 'draft',
      subject: 'Computer Networks',
      unit: 'Unit 1',
      fileUrl: uploadedPdf1.fileUrl,
      fileName: uploadedPdf1.fileName,
      fileSize: uploadedPdf1.fileSize,
      filePublicId: uploadedPdf1.filePublicId,
      mimeType: 'application/pdf'
    };

    const createRes = await makeRequest({
      path: `/admin/content/${CHAPTER_ID}/notes`,
      method: 'POST',
      body: notePayload,
      cookie: sessionCookie
    });

    assert('Note created as Draft returns 201', createRes.status === 201, `got ${createRes.status}`);
    assert('Note has _id', !!createRes.body?._id);
    assert('Note status is draft', createRes.body?.status === 'draft');
    testNoteId = createRes.body?._id;

    // Query public student endpoint
    const studentRes = await makeRequest({
      path: `/content/${CHAPTER_ID}`,
      method: 'GET'
    });

    assert('Student portal responds with 200', studentRes.status === 200, `got ${studentRes.status}`);
    const studentNotes = studentRes.body?.notes || [];
    const foundDraft = studentNotes.find(n => n._id === testNoteId);
    assert('Draft note is HIDDEN from student portal', !foundDraft, foundDraft ? 'Draft leaked!' : 'Draft correctly excluded');
  }

  // TEST 3: Edit the title and save changes
  console.log('\n▶ TEST CASE 3: Edit Title & Metadata Updates');
  {
    const updatePayload = {
      title: 'Chapter 1.1 Complete Introduction to Data Communication (Edited)',
      status: 'draft',
      fileUrl: uploadedPdf1.fileUrl,
      fileName: uploadedPdf1.fileName,
      fileSize: uploadedPdf1.fileSize,
      filePublicId: uploadedPdf1.filePublicId,
    };

    const updateRes = await makeRequest({
      path: `/admin/content/${CHAPTER_ID}/notes/${testNoteId}`,
      method: 'PUT',
      body: updatePayload,
      cookie: sessionCookie
    });

    assert('Note update succeeds with 200', updateRes.status === 200, `got ${updateRes.status}`);
    assert('Note title updated', updateRes.body?.title === updatePayload.title);
  }

  // TEST 9: Verify updating does not create duplicate records
  console.log('\n▶ TEST CASE 9: No Duplicate Records on Note Update');
  {
    const adminNotesRes = await makeRequest({
      path: `/admin/content/${CHAPTER_ID}/notes`,
      method: 'GET',
      cookie: sessionCookie
    });

    assert('Admin fetch notes returns 200', adminNotesRes.status === 200);
    const matchingNotes = (adminNotesRes.body || []).filter(n => n._id === testNoteId);
    assert('Note exists exactly once (no duplicates created on update)', matchingNotes.length === 1, `count: ${matchingNotes.length}`);
  }

  // TEST 4: Publish the note and verify students can view and download it
  console.log('\n▶ TEST CASE 4: Publish Note & Student Portal Access');
  {
    const publishRes = await makeRequest({
      path: `/admin/content/${CHAPTER_ID}/notes/${testNoteId}`,
      method: 'PUT',
      body: { status: 'published' },
      cookie: sessionCookie
    });

    assert('Publish note succeeds with 200', publishRes.status === 200, `got ${publishRes.status}`);
    assert('Note status is published', publishRes.body?.status === 'published');

    // Query student portal
    const studentRes = await makeRequest({
      path: `/content/${CHAPTER_ID}`,
      method: 'GET'
    });

    assert('Student portal returns 200', studentRes.status === 200);
    const publishedNotes = studentRes.body?.notes || [];
    const studentNote = publishedNotes.find(n => n._id === testNoteId);
    assert('Published note is now VISIBLE to students', !!studentNote);
    assert('Student note has correct title', studentNote?.title?.includes('Edited'));
    assert('Student note contains valid fileUrl for viewing/downloading', !!studentNote?.fileUrl);

    // Verify student can download the PDF
    const downloadRes = await makeRequest({ path: studentNote.fileUrl, method: 'GET' });
    assert('Student can download the PDF file directly (200)', downloadRes.status === 200);
  }

  // TEST 5: Replace the PDF with a new version
  console.log('\n▶ TEST CASE 5: Replace PDF with New Version & Safe Asset Handling');
  let uploadedPdf2 = null;
  {
    const boundary = '----WebKitFormBoundarySamplePdfUpload2';
    const samplePdfBuffer2 = generateSamplePdf('Chapter 1.1 Revision Version 2 — 41 Page Document');
    const bodyReplace = createMultipartBody(
      { oldPublicId: uploadedPdf1.filePublicId || '', oldFileUrl: uploadedPdf1.fileUrl || '' },
      [{
        name: 'file',
        filename: 'Chapter_1.1_Notes_v2.pdf',
        contentType: 'application/pdf',
        content: samplePdfBuffer2
      }],
      boundary
    );

    const replaceUploadRes = await makeRequest({
      path: '/admin/upload-notes-pdf',
      method: 'POST',
      headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
      body: bodyReplace,
      cookie: sessionCookie
    });

    assert('Replacement PDF upload returns 200', replaceUploadRes.status === 200, `got ${replaceUploadRes.status}`);
    uploadedPdf2 = replaceUploadRes.body;
    assert('New fileName is Chapter_1.1_Notes_v2.pdf', uploadedPdf2?.fileName === 'Chapter_1.1_Notes_v2.pdf');

    // Update note with new PDF
    const updateNoteRes = await makeRequest({
      path: `/admin/content/${CHAPTER_ID}/notes/${testNoteId}`,
      method: 'PUT',
      body: {
        fileUrl: uploadedPdf2.fileUrl,
        fileName: uploadedPdf2.fileName,
        fileSize: uploadedPdf2.fileSize,
        filePublicId: uploadedPdf2.filePublicId,
        title: 'Chapter 1.1 — Complete Notes (Version 2)'
      },
      cookie: sessionCookie
    });

    assert('Note updated with replaced PDF', updateNoteRes.status === 200);
    assert('Note now references Version 2 PDF', updateNoteRes.body?.fileName === 'Chapter_1.1_Notes_v2.pdf');

    // Verify student portal sees new version
    const studentRes = await makeRequest({ path: `/content/${CHAPTER_ID}`, method: 'GET' });
    const studentNote = (studentRes.body?.notes || []).find(n => n._id === testNoteId);
    assert('Student portal serves replaced PDF (v2)', studentNote?.fileName === 'Chapter_1.1_Notes_v2.pdf');
  }

  // TEST 6: Reload both pages and confirm data persists
  console.log('\n▶ TEST CASE 6: Persistence Verification');
  {
    const adminCheck = await makeRequest({ path: `/admin/content/${CHAPTER_ID}/notes`, method: 'GET', cookie: sessionCookie });
    const persistedAdminNote = (adminCheck.body || []).find(n => n._id === testNoteId);
    assert('Admin note data persists in database', !!persistedAdminNote);
    assert('Admin persisted note has correct v2 file', persistedAdminNote?.fileName === 'Chapter_1.1_Notes_v2.pdf');

    const studentCheck = await makeRequest({ path: `/content/${CHAPTER_ID}`, method: 'GET' });
    const persistedStudentNote = (studentCheck.body?.notes || []).find(n => n._id === testNoteId);
    assert('Student portal data persists in database', !!persistedStudentNote);
  }

  // TEST 10: Regression Tests (PYQs, Markdown/DOCX, AI Summary)
  console.log('\n▶ TEST CASE 10: Regression Testing (PYQ Upload & AI Summaries)');
  {
    // 10A: PYQ upload
    const boundary = '----WebKitFormBoundaryPyqTest';
    const pyqPdf = generateSamplePdf('2023 End-Term Exam Paper');
    const pyqBody = createMultipartBody({}, [{
      name: 'file',
      filename: 'PYQ_2023_Networks.pdf',
      contentType: 'application/pdf',
      content: pyqPdf
    }], boundary);

    const pyqUploadRes = await makeRequest({
      path: '/admin/upload-pdf',
      method: 'POST',
      headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
      body: pyqBody,
      cookie: sessionCookie
    });

    assert('PYQ upload endpoint functions properly (200)', pyqUploadRes.status === 200, `got ${pyqUploadRes.status}`);
    assert('PYQ upload returns fileUrl', !!pyqUploadRes.body?.fileUrl);

    // 10B: AI Chapter Summary
    const aiSummaryRes = await makeRequest({
      path: '/admin/generate-summary',
      method: 'POST',
      body: { chapterContentMarkdown: 'Computer Networks introduces packet switching, OSI 7 layer model, TCP/IP protocol suite, transmission media including fiber optics and twisted pair, and physical layer signaling.' },
      cookie: sessionCookie
    });

    assert('AI summary generation functions properly (200 or 502 if rate-limited)', [200, 502].includes(aiSummaryRes.status), `got ${aiSummaryRes.status}`);
  }

  // TEST 11: Server-Side PDF Text Extraction
  console.log('\n▶ TEST CASE 11: Server-Side PDF Text Extraction');
  {
    const extractRes = await makeRequest({
      path: '/admin/extract-pdf-text',
      method: 'POST',
      body: { chapterId: CHAPTER_ID, noteId: testNoteId },
      cookie: sessionCookie
    });

    assert('Extract text endpoint returns 200', extractRes.status === 200, `got ${extractRes.status} ${JSON.stringify(extractRes.body)}`);
    assert('Extraction status is success or no_text', ['success', 'no_text'].includes(extractRes.body?.status));
    assert('Extracted markdown or message returned', typeof extractRes.body?.extractedMarkdown === 'string');
  }

  // Cleanup: Delete the test note created during testing
  console.log('\n▶ CLEANUP: Deleting test note');
  {
    const delRes = await makeRequest({
      path: `/admin/content/${CHAPTER_ID}/notes/${testNoteId}`,
      method: 'DELETE',
      cookie: sessionCookie
    });
    assert('Test note deleted successfully', delRes.status === 200);

    const verifyDel = await makeRequest({ path: `/admin/content/${CHAPTER_ID}/notes`, method: 'GET', cookie: sessionCookie });
    const remaining = (verifyDel.body || []).filter(n => n._id === testNoteId);
    assert('Test note confirmed removed from DB', remaining.length === 0);
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
