require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

async function audit() {
  console.log('====================================================');
  console.log('STUDS AUDIT: Computer Networks, Sem 5, Unit 1, Ch 1.1');
  console.log('====================================================\n');

  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI not found in backend/.env');
  }

  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB.\n');

  const Subject = require('../models/Subject');
  const Unit = require('../models/Unit');
  const Content = require('../models/Content');

  // 1. Audit Subject
  console.log('--- 1. AUDITING SUBJECTS (Semester 5) ---');
  const subjects = await Subject.find({ semester: 5 }).lean();
  console.log(`Found ${subjects.length} Semester 5 subjects:`);
  subjects.forEach(s => {
    console.log(`- ID: ${s._id} | Code: ${s.subjectCode} | Name: "${s.subjectName}" | Course: "${s.course}" | Spec: "${s.specialization}"`);
  });

  const cnSubject = subjects.find(s => /Computer Networks/i.test(s.subjectName) || /CS504/i.test(s.subjectCode));
  if (!cnSubject) {
    console.warn('WARNING: Computer Networks subject NOT found in Semester 5!');
  } else {
    console.log(`\nMatched Computer Networks Subject: ID = ${cnSubject._id}, Code = ${cnSubject.subjectCode}, Name = "${cnSubject.subjectName}"`);
  }

  // 2. Audit Units for Computer Networks
  console.log('\n--- 2. AUDITING UNITS FOR COMPUTER NETWORKS ---');
  let currentChapter1_1Id = null;
  if (cnSubject) {
    const units = await Unit.find({ subjectId: cnSubject._id }).sort({ unitNumber: 1 }).lean();
    console.log(`Found ${units.length} units for Computer Networks:`);
    for (const u of units) {
      console.log(`Unit ${u.unitNumber}: "${u.unitName}" (ID: ${u._id})`);
      if (u.chapters && u.chapters.length > 0) {
        u.chapters.forEach((ch, idx) => {
          console.log(`   Chapter ${idx + 1}: chapterId: "${ch.chapterId}" | Name: "${ch.chapterName}" | Topics: ${ch.topics?.length || 0}`);
          if (/1\.1/i.test(ch.chapterName) || /Introduction/i.test(ch.chapterName)) {
            currentChapter1_1Id = ch.chapterId;
          }
        });
      } else {
        console.log('   (No chapters found in this unit)');
      }
    }
  }

  console.log(`\nCurrent Unit 1 Chapter 1.1 chapterId in Unit model: "${currentChapter1_1Id}"`);

  // 3. Search Content Collection
  console.log('\n--- 3. AUDITING CONTENT COLLECTION ---');
  const allContents = await Content.find({}).lean();
  console.log(`Total documents in Content collection: ${allContents.length}`);
  
  console.log('\nSummary of all Content records in database:');
  allContents.forEach((c, idx) => {
    console.log(`[${idx + 1}] _id: ${c._id} | chapterId: "${c.chapterId}" | status: ${c.processingStatus} | notes: ${c.notes?.length || 0} | quizQuestions: ${c.quizQuestions?.length || 0} | quizData: ${c.quizData?.length || 0} | shortNotes: ${c.shortNotes?.length || 0} | studyResources: ${c.studyResources ? c.studyResources.status : 'none'}`);
  });

  // Target chapterIds to investigate:
  const targetIds = new Set();
  if (currentChapter1_1Id) targetIds.add(currentChapter1_1Id);
  targetIds.add('09455e6f-b461-4263-8524-4a4b75c5ba52'); // historical known ID

  // Check any content that has notes with "Computer Networks" or "1.1"
  allContents.forEach(c => {
    const hasCnNote = c.notes?.some(n => /Computer Networks/i.test(n.title) || /1\.1/i.test(n.title) || /Introduction/i.test(n.title));
    if (hasCnNote) targetIds.add(c.chapterId);
  });

  console.log(`\nInvestigating target chapterIds:`, Array.from(targetIds));

  const detailedRecords = [];

  for (const tid of targetIds) {
    console.log(`\n====================================================`);
    console.log(`DETAILED AUDIT FOR chapterId: "${tid}"`);
    console.log(`====================================================`);
    const doc = await Content.findOne({ chapterId: tid }).lean();
    if (!doc) {
      console.log(`>> NOT FOUND in Content collection!`);
      continue;
    }

    detailedRecords.push(doc);

    console.log(`Document _id: ${doc._id}`);
    console.log(`Created: ${doc.createdAt} | Updated: ${doc.updatedAt}`);
    console.log(`Processing Status: "${doc.processingStatus}" | Error: "${doc.processingError}"`);
    console.log(`Last Processing At: ${doc.lastProcessingAt}`);
    console.log(`Shortfall Notice:`, doc.shortfallNotice);

    // Full Notes Markdown
    console.log(`\n--- Full Notes Markdown ---`);
    console.log(`fullNotesMarkdown length: ${doc.fullNotesMarkdown?.length || 0} chars`);
    if (doc.fullNotesMarkdown) {
      console.log(`Preview (first 250 chars):\n${doc.fullNotesMarkdown.substring(0, 250)}...\n`);
    }

    // Draft Full Notes Markdown
    console.log(`draftFullNotesMarkdown length: ${doc.draftFullNotesMarkdown?.length || 0} chars`);

    // Notes array
    console.log(`\n--- Notes Array (${doc.notes?.length || 0} items) ---`);
    (doc.notes || []).forEach((n, nIdx) => {
      console.log(`  Note [${nIdx}]:`);
      console.log(`    _id: ${n._id}`);
      console.log(`    title: "${n.title}"`);
      console.log(`    status: "${n.status}"`);
      console.log(`    content length: ${n.content?.length || 0} chars`);
      console.log(`    fileUrl: "${n.fileUrl}"`);
      console.log(`    fileName: "${n.fileName}"`);
      console.log(`    fileSize: ${n.fileSize} bytes`);
      console.log(`    mimeType: "${n.mimeType}"`);
      console.log(`    filePublicId: "${n.filePublicId}"`);
      console.log(`    originalDocumentUrl: "${n.originalDocumentUrl}"`);
      console.log(`    originalDocumentName: "${n.originalDocumentName}"`);
      console.log(`    textExtractionStatus: "${n.textExtractionStatus}"`);
      console.log(`    rawExtractedText length: ${n.rawExtractedText?.length || 0} chars`);
      console.log(`    extractedMarkdown length: ${n.extractedMarkdown?.length || 0} chars`);
      console.log(`    extractedChunks: ${n.extractedChunks?.length || 0} chunks`);
      console.log(`    pageCount: ${n.pageCount}, charCount: ${n.charCount}, wordCount: ${n.wordCount}`);
      console.log(`    processingError: "${n.processingError}"`);
    });

    // Published Study Resources
    console.log(`\n--- Published Study Resources ---`);
    if (doc.studyResources) {
      console.log(`  Status: "${doc.studyResources.status}"`);
      console.log(`  PublishedAt: ${doc.studyResources.publishedAt}`);
      console.log(`  GeneratedAt: ${doc.studyResources.generatedAt}`);
      console.log(`  Short Notes (${doc.studyResources.shortNotes?.length || 0}):`);
      (doc.studyResources.shortNotes || []).slice(0, 3).forEach((sn, i) => console.log(`    [${i+1}] ${sn.substring(0, 100)}...`));
      console.log(`  Important Topics (${doc.studyResources.importantTopics?.length || 0}):`);
      (doc.studyResources.importantTopics || []).forEach((it, i) => console.log(`    [${i+1}] ${it}`));
      console.log(`  Key Definitions (${doc.studyResources.keyDefinitions?.length || 0}):`);
      (doc.studyResources.keyDefinitions || []).slice(0, 3).forEach((kd, i) => console.log(`    [${i+1}] ${kd.term}: ${kd.definition.substring(0, 80)}...`));
      console.log(`  Exam Revision Notes Length: ${doc.studyResources.examRevisionNotes?.length || 0} chars`);
      if (doc.studyResources.examRevisionNotes) {
        console.log(`  Exam Revision Notes Preview:\n${doc.studyResources.examRevisionNotes.substring(0, 200)}...\n`);
      }
      console.log(`  Shortfall Reason: "${doc.studyResources.shortfallReason}"`);
      console.log(`  Source Limitations:`, doc.studyResources.sourceLimitations);
    } else {
      console.log(`  None.`);
    }

    // Draft Study Resources
    console.log(`\n--- Staging Draft Study Resources ---`);
    if (doc.draftStudyResources) {
      console.log(`  Status: "${doc.draftStudyResources.status}"`);
      console.log(`  Short Notes: ${doc.draftStudyResources.shortNotes?.length || 0}`);
      console.log(`  Important Topics: ${doc.draftStudyResources.importantTopics?.length || 0}`);
      console.log(`  Key Definitions: ${doc.draftStudyResources.keyDefinitions?.length || 0}`);
      console.log(`  Exam Revision Notes Length: ${doc.draftStudyResources.examRevisionNotes?.length || 0}`);
    } else {
      console.log(`  None (clean staging).`);
    }

    // Quiz Questions (Modern)
    console.log(`\n--- Modern Quiz Questions (quizQuestions: ${doc.quizQuestions?.length || 0}) ---`);
    const qPub = (doc.quizQuestions || []).filter(q => q.status === 'published');
    const qDraft = (doc.quizQuestions || []).filter(q => q.status === 'draft');
    console.log(`  Published: ${qPub.length} | Draft: ${qDraft.length}`);
    (doc.quizQuestions || []).slice(0, 5).forEach((q, i) => {
      console.log(`  Q${i+1} [${q.status}|${q.difficulty}]: ${q.question}`);
      console.log(`     Options (${q.options?.length}): ${q.options?.join(' | ')}`);
      console.log(`     Correct: "${q.correctAnswer}" | Expl: "${q.explanation?.substring(0, 80)}..."`);
    });
    if ((doc.quizQuestions || []).length > 5) {
      console.log(`  ... and ${(doc.quizQuestions || []).length - 5} more questions.`);
    }

    // Draft Quiz Questions
    console.log(`\n--- Draft Quiz Questions (${doc.draftQuizQuestions?.length || 0}) ---`);

    // Legacy quizData
    console.log(`\n--- Legacy Quiz Data (quizData: ${doc.quizData?.length || 0}) ---`);

    // Legacy shortNotes
    console.log(`\n--- Legacy shortNotes (${doc.shortNotes?.length || 0}) ---`);

    // PYQ Links
    console.log(`\n--- PYQ Links (${doc.pyqLinks?.length || 0}) ---`);
  }

  // 4. Create an immutable, timestamped backup of the current state of these records
  const backupDir = path.join(__dirname, '../backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = Date.now();
  const backupFilePath = path.join(backupDir, `audit_backup_cn_ch1_1_${timestamp}.json`);
  
  const backupPayload = {
    backupTimestamp: new Date().toISOString(),
    auditTarget: 'Computer Networks, Semester 5, Unit 1, Chapter 1.1',
    subject: cnSubject,
    unitModelChapterId: currentChapter1_1Id,
    targetIds: Array.from(targetIds),
    records: detailedRecords,
    allContentChapterIds: allContents.map(c => ({ _id: c._id, chapterId: c.chapterId }))
  };

  fs.writeFileSync(backupFilePath, JSON.stringify(backupPayload, null, 2), 'utf-8');
  console.log(`\n====================================================`);
  console.log(`>> BACKUP CREATED SAFELY AT:`);
  console.log(`   ${backupFilePath}`);
  console.log(`   Size: ${fs.statSync(backupFilePath).size} bytes`);
  console.log(`====================================================\n`);

  await mongoose.disconnect();
  console.log('MongoDB connection closed.');
}

audit().catch(err => {
  console.error('Audit failed with error:', err);
  process.exit(1);
});
