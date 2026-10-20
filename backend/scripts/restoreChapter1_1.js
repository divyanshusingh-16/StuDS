const dns = require('dns');
try { dns.setServers(['8.8.8.8', '1.1.1.1']); } catch (e) {}
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Content = require('../models/Content');

const CHAPTER_ID = '09455e6f-b461-4263-8524-4a4b75c5ba52';

async function restore() {
  console.log('>> Connecting to MongoDB Atlas...');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('>> Connected.');

  const content = await Content.findOne({ chapterId: CHAPTER_ID });
  if (!content) {
    throw new Error(`Chapter record ${CHAPTER_ID} not found in database.`);
  }

  // Load authentic data from verified domain curriculum package
  const historical = require('../services/curatedCurriculum.js');
  
  const shortNotes = [
    ...historical.CURATED_SHORT_NOTES,
    "Exam Tip: Remember that Star topology has a single point of failure at the central hub/switch."
  ];
  const importantTopics = historical.CURATED_IMPORTANT_TOPICS;
  const keyDefinitions = historical.CURATED_KEY_DEFINITIONS;
  const examRevisionNotes = historical.CURATED_EXAM_REVISION_NOTES;
  const quizQuestions = historical.CURATED_CH1_1_MCQS.map(q => ({
    question: q.question,
    options: q.options,
    correctAnswer: q.correctAnswer,
    explanation: q.explanation,
    difficulty: 'medium',
    status: 'published',
    chapterId: CHAPTER_ID,
    isManuallyEdited: false
  }));

  // Restore Full Notes Markdown from notes[0].extractedMarkdown
  const note0 = (content.notes && content.notes[0]) || null;
  const fullNotes = note0?.extractedMarkdown || content.fullNotesMarkdown || '';
  if (note0) {
    note0.status = 'published';
    if (!note0.content && fullNotes) {
      note0.content = fullNotes;
    }
  }

  content.fullNotesMarkdown = fullNotes;
  content.shortNotes = shortNotes;
  content.studyResources = {
    shortNotes,
    importantTopics,
    keyDefinitions,
    examRevisionNotes,
    status: 'published',
    publishedAt: new Date(),
    shortfallReason: '',
    sourceLimitations: [],
    isManuallyEdited: false
  };
  content.quizQuestions = quizQuestions;
  content.quizData = quizQuestions.map(q => ({
    question: q.question,
    options: q.options,
    correctAnswer: q.correctAnswer
  }));

  // Clear staging draft fields (Requirement 3: Clean published state)
  content.draftStudyResources = null;
  content.draftQuizQuestions = [];
  content.draftFullNotesMarkdown = '';
  content.shortfallNotice = {
    hasShortfall: false,
    expectedCount: 20,
    actualCount: 20,
    reason: ''
  };
  content.processingStatus = 'published';
  content.processingError = '';
  content.lastProcessingAt = new Date();

  await content.save();

  console.log('>> Successfully restored Chapter 1.1:');
  console.log('   - MCQ Questions:', content.quizQuestions.length);
  console.log('   - Short Notes:', content.studyResources.shortNotes.length);
  console.log('   - Important Topics:', content.studyResources.importantTopics.length);
  console.log('   - Key Definitions:', content.studyResources.keyDefinitions.length);
  console.log('   - Exam Revision Guide Length:', content.studyResources.examRevisionNotes.length, 'chars');
  console.log('   - Full Notes Markdown Length:', content.fullNotesMarkdown.length, 'chars');
  console.log('   - Processing Status:', content.processingStatus);

  process.exit(0);
}

restore().catch(err => {
  console.error('Restore failed:', err);
  process.exit(1);
});
