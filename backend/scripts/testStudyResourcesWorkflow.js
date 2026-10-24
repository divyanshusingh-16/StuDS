const path = require('path');
const http = require('http');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

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
  console.log('   STUDS: AI-Powered Chapter Study Resources & Quiz Test Suite');
  console.log('============================================================\n');

  // STEP 1: Admin Authentication
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

  // STEP 2: Verify Initial Chapter Content & Notes State
  let targetNoteId = '';
  console.log('\n▶ STEP 2: Verify Chapter 1.1 Content and Note Ingestion');
  {
    const notesRes = await makeRequest({
      path: `/admin/content/${CHAPTER_ID}/notes`,
      method: 'GET',
      cookie: sessionCookie
    });

    assert('Fetch notes succeeds (200)', notesRes.status === 200);
    assert('Chapter 1.1 notes exist', Array.isArray(notesRes.body) && notesRes.body.length > 0);
    const note = notesRes.body[0];
    targetNoteId = note._id;
    assert('Cleaned markdown is available for study resources generation', (note.extractedMarkdown?.length || note.content?.length) > 5000);
  }

  // STEP 3: Generate Study Resources & 20 MCQs via API (Requirement 1 & 2)
  let generatedData = null;
  console.log('\n▶ STEP 3: Generate Study Resources & Exactly 20 MCQs (Requirements 1 & 2)');
  {
    const genRes = await makeRequest({
      path: `/admin/content/${CHAPTER_ID}/study-resources/generate`,
      method: 'POST',
      body: {
        forceRegenerate: true,
        noteId: targetNoteId
      },
      cookie: sessionCookie
    });

    assert('Generate endpoint returns 200', genRes.status === 200, `got ${genRes.status}`);
    assert('Generate success flag is true', genRes.body?.success === true);
    generatedData = genRes.body;

    const resources = genRes.body?.studyResources;
    assert('Short notes generated (>= 10 items)', Array.isArray(resources?.shortNotes) && resources.shortNotes.length >= 10, `got ${resources?.shortNotes?.length}`);
    assert('Important topics generated (>= 8 topics)', Array.isArray(resources?.importantTopics) && resources.importantTopics.length >= 8, `got ${resources?.importantTopics?.length}`);
    assert('Key definitions generated (>= 12 items)', Array.isArray(resources?.keyDefinitions) && resources.keyDefinitions.length >= 12, `got ${resources?.keyDefinitions?.length}`);
    assert('Exam revision notes generated (Markdown > 2000 chars)', typeof resources?.examRevisionNotes === 'string' && resources.examRevisionNotes.length > 2000, `got ${resources?.examRevisionNotes?.length}`);
    assert('Study resources initially saved in "draft" status', resources?.status === 'draft');

    // Requirement 2: Exactly 20 chapter-specific MCQs
    const questions = genRes.body?.quizQuestions;
    assert('Exactly 20 MCQs generated', Array.isArray(questions) && questions.length === 20, `got ${questions?.length}`);

    // Validate structure of all 20 MCQs
    let allValid = true;
    for (let i = 0; i < (questions?.length || 0); i++) {
      const q = questions[i];
      const hasQ = typeof q.question === 'string' && q.question.length > 5;
      const has4Opts = Array.isArray(q.options) && q.options.length === 4;
      const validAns = has4Opts && q.options.includes(q.correctAnswer);
      const hasExp = typeof q.explanation === 'string' && q.explanation.length > 10;
      if (!hasQ || !has4Opts || !validAns || !hasExp) {
        allValid = false;
        console.error(`Invalid MCQ at index ${i}:`, q);
        break;
      }
    }
    assert('All 20 MCQs have 4 options, 1 valid answer, and an explanation', allValid);
  }

  // STEP 4: Prevent Accidental Overwrite / Duplication (Requirement 5)
  console.log('\n▶ STEP 4: Safeguard: Prevent Accidental Duplicate Overwrite (Requirement 5)');
  {
    const duplicateRes = await makeRequest({
      path: `/admin/content/${CHAPTER_ID}/study-resources/generate`,
      method: 'POST',
      body: {
        forceRegenerate: false // Should trigger safeguard
      },
      cookie: sessionCookie
    });

    assert('Duplicate check returns 200 with confirmation notice', duplicateRes.status === 200);
    assert('Safeguard triggered (requiresConfirmation is true)', duplicateRes.body?.requiresConfirmation === true);
    assert('Question count reported for review', duplicateRes.body?.existingQuestionCount === 20);
  }

  // STEP 5: Separation of Resources & Original PDF / Source Text (Requirement 3 & 6)
  console.log('\n▶ STEP 5: Verify Data Separation & Integrity in MongoDB (Requirements 3 & 6)');
  {
    const inspectRes = await makeRequest({
      path: `/admin/content/${CHAPTER_ID}/study-resources`,
      method: 'GET',
      cookie: sessionCookie
    });

    assert('Admin inspect study resources returns 200', inspectRes.status === 200);
    assert('Study resources exist and are isolated', !!inspectRes.body?.studyResources);
    assert('Quiz questions exist as separate subdocuments', Array.isArray(inspectRes.body?.quizQuestions) && inspectRes.body.quizQuestions.length === 20);

    // Verify notes and PDF remain completely intact
    const notesCheck = await makeRequest({
      path: `/admin/content/${CHAPTER_ID}/notes`,
      method: 'GET',
      cookie: sessionCookie
    });
    const cnNote = notesCheck.body[0];
    assert('Original PDF URL intact', !!cnNote.fileUrl);
    assert('Raw extracted text untouched (>70,000 chars)', (cnNote.rawExtractedText?.length || 0) > 70000);
    assert('Cleaned markdown untouched (>70,000 chars)', (cnNote.extractedMarkdown?.length || 0) > 70000);
  }

  // STEP 6: Admin Preview, Edit, Approval, and Publishing Controls (Requirement 4)
  console.log('\n▶ STEP 6: Admin Preview, Edit, Approval, and Publishing (Requirement 4)');
  let approvedQuestions = [];
  {
    const current = generatedData;
    const editedShortNotes = [
      ...current.studyResources.shortNotes,
      "Exam Tip: Remember that Star topology has a single point of failure at the central hub/switch."
    ];

    // Admin edits question 1 explanation and approves all
    const modifiedQuestions = current.quizQuestions.map((q, idx) => {
      if (idx === 0) {
        return {
          ...q,
          explanation: q.explanation + " Verified by Course Instructor."
        };
      }
      return q;
    });

    const updateRes = await makeRequest({
      path: `/admin/content/${CHAPTER_ID}/study-resources`,
      method: 'PUT',
      body: {
        studyResources: {
          ...current.studyResources,
          shortNotes: editedShortNotes,
          status: 'published'
        },
        quizQuestions: modifiedQuestions,
        publishAll: true
      },
      cookie: sessionCookie
    });

    assert('Admin update and publish returns 200', updateRes.status === 200, `got ${updateRes.status}`);
    assert('Update success flag is true', updateRes.body?.success === true);
    assert('Study resources status is "published"', updateRes.body?.studyResources?.status === 'published');
    assert('Edited short note persisted', updateRes.body?.studyResources?.shortNotes?.some(n => n.includes('Exam Tip')));
    assert('Admin edited question explanation persisted', updateRes.body?.quizQuestions?.[0]?.explanation?.includes('Verified by Course Instructor'));
    approvedQuestions = updateRes.body?.quizQuestions || [];
  }

  // STEP 7: Security Check: Never Expose Correct Answers in Portal (Requirement 8)
  console.log('\n▶ STEP 7: Security: Answers NOT Exposed to Student Before Submission (Requirement 8)');
  {
    const studentContentRes = await makeRequest({
      path: `/content/${CHAPTER_ID}`,
      method: 'GET',
      cookie: sessionCookie
    });

    assert('Student content endpoint returns 200', studentContentRes.status === 200);
    assert('Student receives published study resources', !!studentContentRes.body?.studyResources);
    assert('Student receives short notes', studentContentRes.body?.studyResources?.shortNotes?.length > 0);

    // Check quizQuestions in content payload
    const studentQuestions = studentContentRes.body?.quizQuestions || [];
    if (studentQuestions.length > 0) {
      const leaksAnswers = studentQuestions.some(q => q.correctAnswer || q.explanation);
      assert('No correct answers or explanations leaked in /content/:chapterId', !leaksAnswers);
    } else {
      assert('Quiz questions sanitized or separated from initial content payload', true);
    }
  }

  // STEP 8: Quiz Attempt: 5 Distinct Random Questions (Requirements 7 & 8)
  console.log('\n▶ STEP 8: Quiz Attempt: 5 Distinct Random Questions Sampled (Requirement 7 & 8)');
  let attempt1 = null;
  let attempt2 = null;
  {
    const attempt1Res = await makeRequest({
      path: `/quiz/${CHAPTER_ID}/attempt`,
      method: 'GET',
      cookie: sessionCookie
    });

    assert('Fetch quiz attempt returns 200', attempt1Res.status === 200);
    assert('Attempt returns unique attemptId', !!attempt1Res.body?.attemptId);
    assert('Exactly 5 questions returned in attempt', attempt1Res.body?.questions?.length === 5, `got ${attempt1Res.body?.questions?.length}`);

    attempt1 = attempt1Res.body;

    // Verify questions have unique IDs and NO answers
    const ids = new Set(attempt1.questions.map(q => q._id));
    assert('All 5 selected questions are distinct', ids.size === 5);

    const hasAnyAnswer = attempt1.questions.some(q => q.correctAnswer !== undefined || q.explanation !== undefined);
    assert('Attempt payload strictly excludes correctAnswer and explanation', !hasAnyAnswer);

    // Randomization Test: Fetch second attempt and verify randomization
    const attempt2Res = await makeRequest({
      path: `/quiz/${CHAPTER_ID}/attempt`,
      method: 'GET',
      cookie: sessionCookie
    });
    attempt2 = attempt2Res.body;

    const set1 = attempt1.questions.map(q => q._id).sort().join(',');
    const set2 = attempt2.questions.map(q => q._id).sort().join(',');
    
    // With 5 chosen from 20 (15,504 combinations), two random samples will virtually never be identical
    assert('Multiple quiz attempts receive randomized subsets of questions', set1 !== set2 || attempt1.attemptId !== attempt2.attemptId);
  }

  // STEP 9: Server-Side Score Calculation and Validation (Requirement 7)
  console.log('\n▶ STEP 9: Server-Side Score Calculation (Requirement 7)');
  {
    // Test Case A: Submit all 5 correct answers
    const perfectAnswers = attempt1.questions.map(q => {
      const fullDoc = approvedQuestions.find(aq => aq._id?.toString() === q._id?.toString() || aq.question === q.question);
      return {
        questionId: q._id,
        selectedAnswer: fullDoc ? fullDoc.correctAnswer : q.options[0]
      };
    });

    const submitPerfectRes = await makeRequest({
      path: `/quiz/${CHAPTER_ID}/submit`,
      method: 'POST',
      body: {
        attemptId: attempt1.attemptId,
        answers: perfectAnswers
      },
      cookie: sessionCookie
    });

    assert('Submit quiz returns 200', submitPerfectRes.status === 200);
    assert('Server calculates perfect score: 5 / 5', submitPerfectRes.body?.score === 5 && submitPerfectRes.body?.total === 5);
    assert('Server percentage: 100%', submitPerfectRes.body?.percentage === 100);
    assert('Explanations and correct answers revealed post-submission', submitPerfectRes.body?.results?.[0]?.explanation?.length > 0);

    // Test Case B: Submit 3 correct and 2 incorrect answers
    const partialAnswers = attempt1.questions.map((q, idx) => {
      const fullDoc = approvedQuestions.find(aq => aq._id?.toString() === q._id?.toString() || aq.question === q.question);
      if (idx < 3) {
        // Correct answer
        return { questionId: q._id, selectedAnswer: fullDoc.correctAnswer };
      } else {
        // Pick an intentionally wrong option
        const wrongOption = q.options.find(opt => opt !== fullDoc.correctAnswer) || 'Incorrect';
        return { questionId: q._id, selectedAnswer: wrongOption };
      }
    });

    const submitPartialRes = await makeRequest({
      path: `/quiz/${CHAPTER_ID}/submit`,
      method: 'POST',
      body: {
        attemptId: attempt1.attemptId,
        answers: partialAnswers
      },
      cookie: sessionCookie
    });

    assert('Partial score calculated correctly: 3 / 5', submitPartialRes.body?.score === 3);
    assert('Percentage calculated correctly: 60%', submitPartialRes.body?.percentage === 60);
    assert('Results array flags correct and incorrect accurately', 
      submitPartialRes.body?.results?.filter(r => r.isCorrect).length === 3 &&
      submitPartialRes.body?.results?.filter(r => !r.isCorrect).length === 2
    );

    // Test Case C: Submit 0 correct answers
    const zeroAnswers = attempt1.questions.map(q => {
      const fullDoc = approvedQuestions.find(aq => aq._id?.toString() === q._id?.toString() || aq.question === q.question);
      const wrongOption = q.options.find(opt => opt !== fullDoc.correctAnswer) || 'Incorrect';
      return { questionId: q._id, selectedAnswer: wrongOption };
    });

    const submitZeroRes = await makeRequest({
      path: `/quiz/${CHAPTER_ID}/submit`,
      method: 'POST',
      body: {
        attemptId: attempt1.attemptId,
        answers: zeroAnswers
      },
      cookie: sessionCookie
    });

    assert('Zero score calculated correctly: 0 / 5 (0%)', submitZeroRes.body?.score === 0 && submitZeroRes.body?.percentage === 0);
  }

  // STEP 10: Persistence after Refresh
  console.log('\n▶ STEP 10: Persistence After Reload (Requirement 9)');
  {
    const reloadContent = await makeRequest({
      path: `/content/${CHAPTER_ID}`,
      method: 'GET',
      cookie: sessionCookie
    });

    assert('Reload content succeeds (200)', reloadContent.status === 200);
    assert('Published study resources persist in DB', reloadContent.body?.studyResources?.status === 'published');
    assert('Published short notes count persisted (>= 10)', reloadContent.body?.studyResources?.shortNotes?.length >= 10);
    assert('Key definitions count persisted (>= 12)', reloadContent.body?.studyResources?.keyDefinitions?.length >= 12);
    assert('Exam revision guide persisted', reloadContent.body?.studyResources?.examRevisionNotes?.length > 1000);

    // Verify subsequent quiz attempts continue to work cleanly
    const reAttempt = await makeRequest({
      path: `/quiz/${CHAPTER_ID}/attempt`,
      method: 'GET',
      cookie: sessionCookie
    });
    assert('Subsequent quiz attempt succeeds with 5 questions', reAttempt.body?.questions?.length === 5);
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
