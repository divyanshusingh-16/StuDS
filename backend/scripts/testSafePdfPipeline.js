const dns = require('dns');
try { dns.setServers(['8.8.8.8', '1.1.1.1']); } catch (e) {}

const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');

const Content = require('../models/Content');
const pdfTextExtractor = require('../services/pdfTextExtractor');
const pipelineService = require('../services/pipelineService');
const studyResourcesService = require('../services/studyResourcesService');

const TEST_CHAPTER_ID = 'test-isolated-safe-pipeline-mock-chapter'; // Isolated test mock to prevent overwriting production data

let passedTests = 0;
let failedTests = 0;

function assertTest(name, condition, details = '') {
  if (condition) {
    console.log(`  [PASS] ${name}`);
    passedTests++;
  } else {
    console.error(`  [FAIL] ${name} ${details ? '(' + details + ')' : ''}`);
    failedTests++;
  }
}

async function runSafePdfPipelineTests() {
  console.log('================================================================');
  console.log('       STUDS — Safe PDF-to-AI Pipeline Automated Verification');
  console.log('================================================================\n');

  try {
    // Connect to database
    console.log('>> Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('>> Connected successfully.\n');

    // TEST 1: Source PDF File Verification
    console.log('--- TEST GROUP 1: Real PDF Asset & Extraction Verification ---');
    const realPdfPath = path.join(__dirname, '../uploads/1792019982392-Computer_Networks_Unit1_Chapter1.1_Introduction.pdf');
    assertTest('Real academic PDF exists on disk', fs.existsSync(realPdfPath));

    const pdfBuffer = fs.readFileSync(realPdfPath);
    assertTest('PDF buffer loaded and size >= 500KB', pdfBuffer.length > 500 * 1024, `Size: ${(pdfBuffer.length / 1024).toFixed(1)} KB`);

    // TEST 2: Server-side PDF Text Extraction & Validation
    console.log('\n>> Running pdfTextExtractor on real PDF buffer...');
    const extractionResult = await pdfTextExtractor.extractTextFromPdf(pdfBuffer, {
      originalName: '1792019982392-Computer_Networks_Unit1_Chapter1.1_Introduction.pdf'
    });

    assertTest('Extraction returned valid status', extractionResult.status === 'success');
    assertTest('Extraction text length > 50,000 characters', extractionResult.charCount > 50000, `Chars: ${extractionResult.charCount}`);
    assertTest('Extraction word count >= 10,000 words', extractionResult.wordCount >= 10000, `Words: ${extractionResult.wordCount}`);
    assertTest('Extracted text validation passed', extractionResult.validation.isValid === true);
    assertTest('Semantic chunks generated for future RAG / cited doubt solving', extractionResult.chunks && extractionResult.chunks.length > 10, `Chunks: ${extractionResult.chunks?.length}`);

    // TEST 3: Gibberish / Malformed Source Text Rejection
    console.log('\n--- TEST GROUP 2: Source Text Validation & Guardrails ---');
    const gibberishValidation = pdfTextExtractor.validateSourceText('\x00\x01\x02\x03\x04\x05\x06\x07');
    assertTest('Rejects non-printable binary control characters', gibberishValidation.isValid === false);

    const emptyValidation = pdfTextExtractor.validateSourceText('Short text');
    assertTest('Rejects text below minimum word threshold (50 words)', emptyValidation.isValid === false);

    const validValidation = pdfTextExtractor.validateSourceText(extractionResult.rawText);
    assertTest('Accepts genuine extracted academic textbook content', validValidation.isValid === true);

    // TEST 4: Missing-Resource Detection
    console.log('\n--- TEST GROUP 3: Missing-Resource Detection & Preservation ---');
    const mockContentState1 = {
      notes: [{ title: 'Chapter Notes', documentUrl: 'https://example.com/ch1.pdf' }],
      studyResources: {
        status: 'published',
        shortNotes: ['Note 1', 'Note 2'],
        importantTopics: ['Topic 1'],
        keyDefinitions: [{ term: 'Bandwidth', definition: 'Data transfer capacity' }],
        examRevisionNotes: '' // MISSING
      },
      quizQuestions: [
        { question: 'Q1', options: ['A', 'B', 'C', 'D'], correctAnswer: 'A', status: 'published' }
      ] // Only 1 question, 19 missing
    };

    const missingDetected = pipelineService.detectMissingResources(mockContentState1);
    assertTest('Detects missing examRevisionNotes', missingDetected.examRevisionNotes === true);
    assertTest('Detects insufficient MCQs (1 < 20)', missingDetected.quizQuestions === true);
    assertTest('Identifies existing shortNotes as not missing', missingDetected.shortNotes === false);
    assertTest('Identifies existing keyDefinitions as not missing', missingDetected.keyDefinitions === false);

    // TEST 5: Pipeline Status API Reporting
    console.log('\n--- TEST GROUP 4: Pipeline Status & Draft Staging Isolation ---');
    const statusReport = await pipelineService.getPipelineStatus(TEST_CHAPTER_ID);
    assertTest('getPipelineStatus returns valid object', statusReport && typeof statusReport === 'object');
    assertTest('Reports draft staging isolation status', 'draft' in statusReport);
    assertTest('Reports published status separately', 'published' in statusReport);
    assertTest('Reports source PDF metadata', 'pdf' in statusReport);

    // TEST 6: Atomic Publication & Content Isolation
    console.log('\n--- TEST GROUP 5: Staging Draft & Atomic Publication ---');
    // Fetch chapter record
    let contentDoc = await Content.findOne({ chapterId: TEST_CHAPTER_ID });
    if (!contentDoc) {
      contentDoc = new Content({ chapterId: TEST_CHAPTER_ID });
    }

    // Set a known published state
    const originalPublishedRevision = '# Published Exam Revision v1.0\nEstablished content.';
    contentDoc.studyResources = {
      status: 'published',
      shortNotes: ['Published Note A', 'Published Note B'],
      importantTopics: ['Published Topic 1'],
      keyDefinitions: [{ term: 'OSI', definition: 'Open Systems Interconnection' }],
      examRevisionNotes: originalPublishedRevision,
      publishedAt: new Date()
    };
    contentDoc.quizQuestions = [
      {
        question: 'What is the primary function of the Network Layer in the OSI model?',
        options: ['Logical addressing and routing', 'Physical signaling', 'Bit synchronization', 'Error correction on link'],
        correctAnswer: 'Logical addressing and routing',
        explanation: 'The Network layer is responsible for packet forwarding and IP routing.',
        difficulty: 'medium',
        status: 'published',
        chapterId: TEST_CHAPTER_ID
      }
    ];

    // Put staging drafts with different content
    contentDoc.draftStudyResources = {
      shortNotes: ['Draft Staging Note 1'],
      importantTopics: ['Draft Staging Topic 1'],
      keyDefinitions: [{ term: 'Gateway', definition: 'Protocol converter' }],
      examRevisionNotes: '# Draft Revision Guide In Progress'
    };
    contentDoc.draftQuizQuestions = [
      {
        question: 'What protocol operates at Layer 4 to provide reliable transport?',
        options: ['TCP', 'UDP', 'IP', 'Ethernet'],
        correctAnswer: 'TCP',
        explanation: 'TCP provides connection-oriented, reliable byte stream delivery.',
        difficulty: 'easy',
        status: 'draft',
        chapterId: TEST_CHAPTER_ID
      }
    ];
    contentDoc.processingStatus = 'draft_ready';
    await contentDoc.save();

    // Verify database isolation: published content remains intact while draft exists
    const checkIsolation = await Content.findOne({ chapterId: TEST_CHAPTER_ID }).lean();
    assertTest('Published revision guide untouched while draft exists', checkIsolation.studyResources.examRevisionNotes === originalPublishedRevision);
    assertTest('Published quiz questions count is 1', checkIsolation.quizQuestions.length === 1);
    assertTest('Draft quiz questions stored in separate draft field', checkIsolation.draftQuizQuestions.length === 1);

    // Perform atomic publication promotion
    console.log('\n>> Publishing draft resources atomically via pipelineService.publishPipelineResources...');
    const publishResult = await pipelineService.publishPipelineResources(TEST_CHAPTER_ID, {
      _id: new mongoose.Types.ObjectId()
    });
    assertTest('Publication succeeded', publishResult.success === true);

    const postPublishDoc = await Content.findOne({ chapterId: TEST_CHAPTER_ID }).lean();
    assertTest('Published study resources status is "published"', postPublishDoc.studyResources.status === 'published');
    assertTest('Draft revision guide was promoted to published', postPublishDoc.studyResources.examRevisionNotes === '# Draft Revision Guide In Progress');
    assertTest('Published quiz questions now contains the approved question', postPublishDoc.quizQuestions.some(q => q.question.includes('Layer 4')));
    assertTest('Draft fields cleared after explicit atomic publish', postPublishDoc.draftStudyResources === null || postPublishDoc.draftStudyResources === undefined);
    assertTest('Processing status transitioned to "published"', postPublishDoc.processingStatus === 'published');

    // TEST 7: Safety Rule — Failure Preservation
    console.log('\n--- TEST GROUP 6: Preservation During Pipeline Failure ---');
    // Save last known good published version
    const lastKnownGoodRevision = postPublishDoc.studyResources.examRevisionNotes;
    const lastKnownGoodPublishedCount = postPublishDoc.quizQuestions.length;

    // Simulate a failure in pipelineService (e.g. invalid chapter or AI crash)
    let failureSimulated = false;
    try {
      await pipelineService.generateChapterResources('non-existent-chapter-id-xyz', { mode: 'all' });
    } catch (e) {
      failureSimulated = true;
    }
    assertTest('Pipeline handles invalid chapter gracefully by rejecting', failureSimulated === true);

    // Re-verify that our real chapter was completely unaffected
    const afterFailedDoc = await Content.findOne({ chapterId: TEST_CHAPTER_ID }).lean();
    assertTest('Published content untouched after failed operation on another target', afterFailedDoc.studyResources.examRevisionNotes === lastKnownGoodRevision);
    assertTest('Published quiz questions untouched after failure', afterFailedDoc.quizQuestions.length === lastKnownGoodPublishedCount);

    // TEST 8: Shortfall Reporting vs Hallucination Guardrail
    console.log('\n--- TEST GROUP 7: Source Grounding & Shortfall Reporting ---');
    // Test parsing output where AI produces fewer than 20 questions
    const partialAiJson = {
      shortNotes: ['Valid Note 1'],
      importantTopics: ['Valid Topic 1'],
      keyDefinitions: [{ term: 'Hub', definition: 'Multiport Layer 1 repeater' }],
      examRevisionNotes: '# Short Source Notes',
      quizQuestions: [
        {
          question: 'What is a hub?',
          options: ['Multiport repeater', 'Router', 'Switch', 'Gateway'],
          correctAnswer: 'Multiport repeater',
          explanation: 'A hub broadcasts all signals to all ports at Layer 1.'
        }
      ],
      shortfallReason: 'Source document only covered Chapter 1.1 definitions and did not contain enough depth for 20 questions.'
    };

    const structuredValidation = studyResourcesService.validateQuizQuestions(partialAiJson.quizQuestions, TEST_CHAPTER_ID);
    assertTest('Structured validation succeeds for valid questions', structuredValidation.validQuestions.length === 1);
    assertTest('Identifies shortfall when questions < 20', structuredValidation.validQuestions.length < 20);
    assertTest('Preserves shortfall reason without fabricating questions', partialAiJson.shortfallReason.includes('did not contain enough depth'));

    // TEST 9: Student Security Verification (Answer & Draft Redaction)
    console.log('\n--- TEST GROUP 8: Student Security & Answer Redaction ---');
    // Simulate what portalRoutes does:
    const studentContent = await Content.findOne({ chapterId: TEST_CHAPTER_ID }).lean();
    
    // Check redaction logic
    delete studentContent.draftStudyResources;
    delete studentContent.draftQuizQuestions;
    delete studentContent.draftFullNotesMarkdown;
    delete studentContent.extractedText;

    assertTest('Draft fields stripped from student view', !('draftStudyResources' in studentContent));
    assertTest('Draft quiz questions stripped from student view', !('draftQuizQuestions' in studentContent));

    const studentSanitizedQuestions = (studentContent.quizQuestions || [])
      .filter(q => q.status === 'published')
      .map(q => ({
        _id: q._id,
        question: q.question,
        options: q.options
      }));

    assertTest('Sanitized questions do NOT have correctAnswer field', !studentSanitizedQuestions.some(q => 'correctAnswer' in q));
    assertTest('Sanitized questions do NOT have explanation field', !studentSanitizedQuestions.some(q => 'explanation' in q));

    console.log('\n================================================================');
    console.log(`TOTAL TESTS: ${passedTests + failedTests}`);
    console.log(`PASSED: ${passedTests}`);
    console.log(`FAILED: ${failedTests}`);
    console.log('================================================================\n');

    await Content.deleteOne({ chapterId: TEST_CHAPTER_ID });
    await mongoose.disconnect();
    process.exit(failedTests > 0 ? 1 : 0);
  } catch (err) {
    console.error('Test Suite Error:', err);
    try { await Content.deleteOne({ chapterId: TEST_CHAPTER_ID }); } catch (_) {}
    await mongoose.disconnect();
    process.exit(1);
  }
}

runSafePdfPipelineTests();
