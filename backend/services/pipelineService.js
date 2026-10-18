/**
 * STUDS Safe PDF-to-AI Pipeline Orchestration Service
 * 
 * Orchestrates all 10 stages:
 * 1. PDF upload and validation
 * 2. Text extraction and optional OCR
 * 3. Source-text validation
 * 4. Missing-resource detection
 * 5. Gemini generation (source-grounded)
 * 6. Structured-output validation & shortfall reporting
 * 7. Draft persistence (staging version, leaving published version safe)
 * 8. Admin review & manual editing
 * 9. Explicit atomic publication
 * 10. Error handling and retry without re-uploading
 */

const fs = require('fs');
const path = require('path');
const Content = require('../models/Content');
const Subject = require('../models/Subject');
const Unit = require('../models/Unit');
const cloudinary = require('../config/cloudinary');
const { extractTextFromPdf } = require('./pdfTextExtractor');
const { cleanExtractedNotes } = require('./noteCleanerService');
const { generateChapterStudyResources, detectMissingResources, validateQuizQuestions } = require('./studyResourcesService');
const { cleanupOldAsset } = require('../controllers/contentController');

function isCloudinaryConfigured() {
  const name = process.env.CLOUDINARY_CLOUD_NAME;
  const key = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;
  return Boolean(
    name && name !== 'your_cloud_name' &&
    key && key !== 'your_api_key' &&
    secret && secret !== 'your_api_secret'
  );
}

/**
 * Downloads / reads the PDF buffer from Cloudinary or local uploads.
 */
async function getPdfBufferFromUrl(fileUrl) {
  if (!fileUrl) throw new Error('No PDF file URL provided.');

  if (fileUrl.includes('/uploads/')) {
    const fileName = path.basename(fileUrl.split('?')[0]);
    const filePath = path.join(__dirname, '..', 'uploads', fileName);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Local PDF file not found on server at: ${filePath}`);
    }
    return fs.readFileSync(filePath);
  }

  const fetchRes = await fetch(fileUrl);
  if (!fetchRes.ok) {
    throw new Error(`Failed to download PDF from storage (HTTP ${fetchRes.status})`);
  }
  const arrayBuf = await fetchRes.arrayBuffer();
  return Buffer.from(arrayBuf);
}

/**
 * Finds chapter, unit, and subject names for academic context.
 */
async function getAcademicContext(chapterId) {
  let chapterTitle = 'Chapter';
  let unitName = 'Unit';
  let subjectName = 'Academic Subject';

  const unit = await Unit.findOne({ 'chapters.chapterId': chapterId }).lean();
  if (unit) {
    unitName = unit.unitName || `Unit ${unit.unitNumber}`;
    const ch = (unit.chapters || []).find(c => c.chapterId === chapterId);
    if (ch) chapterTitle = ch.chapterName || chapterTitle;

    const sub = await Subject.findById(unit.subjectId).lean();
    if (sub) subjectName = sub.subjectName || subjectName;
  }

  return { chapterTitle, unitName, subjectName };
}

/**
 * Stage 2 & 3: Run Text Extraction & Cleaning for a Note
 */
async function extractNoteText(chapterId, noteId) {
  const content = await Content.findOne({ chapterId });
  if (!content) throw new Error('Chapter content record not found.');

  const note = content.notes.id(noteId) || content.notes[0];
  if (!note) throw new Error('No note found to extract text from.');

  const pdfUrl = note.fileUrl || note.originalDocumentUrl;
  if (!pdfUrl) throw new Error('Note does not have an attached PDF document.');

  // Update status to extracting
  note.textExtractionStatus = 'extracting';
  content.processingStatus = 'extracting';
  content.processingError = '';
  await content.save();

  try {
    const pdfBuffer = await getPdfBufferFromUrl(pdfUrl);
    const extractRes = await extractTextFromPdf(pdfBuffer);

    if (extractRes.status === 'no_text') {
      note.textExtractionStatus = 'no_text';
      note.rawExtractedText = '';
      note.extractedMarkdown = '';
      content.processingStatus = 'failed';
      content.processingError = extractRes.validation.reason;
      await content.save();

      return {
        success: false,
        status: 'no_text',
        message: extractRes.validation.reason,
        charCount: 0
      };
    }

    if (!extractRes.validation.isValid) {
      note.textExtractionStatus = 'failed';
      content.processingStatus = 'failed';
      content.processingError = extractRes.validation.reason;
      await content.save();

      return {
        success: false,
        status: 'invalid_text',
        message: extractRes.validation.reason,
        charCount: extractRes.charCount
      };
    }

    const { chapterTitle, unitName, subjectName } = await getAcademicContext(chapterId);
    const cleanRes = cleanExtractedNotes(extractRes.rawText, {
      chapterName: chapterTitle,
      subjectName,
      unitName
    });

    note.rawExtractedText = extractRes.rawText;
    note.extractedMarkdown = cleanRes.cleanedMarkdown;
    note.extractedChunks = extractRes.chunks || [];
    note.pageCount = extractRes.pageCount || 1;
    note.charCount = extractRes.charCount || 0;
    note.wordCount = extractRes.wordCount || 0;
    note.textExtractionStatus = 'success';

    content.processingStatus = 'extracted';
    content.processingError = '';
    content.lastProcessingAt = new Date();
    await content.save();

    return {
      success: true,
      status: 'success',
      charCount: extractRes.charCount,
      wordCount: extractRes.wordCount,
      pageCount: extractRes.pageCount,
      chunksCount: extractRes.chunks.length,
      rawExtractedText: extractRes.rawText,
      extractedMarkdown: cleanRes.cleanedMarkdown,
      stats: cleanRes.stats
    };
  } catch (err) {
    note.textExtractionStatus = 'failed';
    note.processingError = err.message;
    content.processingStatus = 'failed';
    content.processingError = err.message;
    await content.save();
    throw err;
  }
}

/**
 * Stage 4, 5, 6, 7: Generate Study Resources into Staging Draft
 * Critical Rules:
 * - Never overwrite published content!
 * - Never delete existing valid published content if generation fails!
 * - If generation fails, retain PDF, extracted text, and previous published state!
 */
async function generateStagingResources(chapterId, options = {}) {
  const { mode = 'missing_only', targets = [], forceRegenerate = false, noteId } = options;

  const content = await Content.findOne({ chapterId });
  if (!content) throw new Error('Chapter content record not found.');

  // Safeguard: Check if draft already exists and requires confirmation
  const hasExistingDraft = Boolean(
    (content.draftStudyResources?.shortNotes && content.draftStudyResources.shortNotes.length > 0) ||
    (content.draftQuizQuestions && content.draftQuizQuestions.length > 0)
  );

  if (hasExistingDraft && !forceRegenerate) {
    return {
      success: false,
      requiresConfirmation: true,
      message: 'A staging draft already exists for this chapter. Confirm to regenerate and overwrite this draft.',
      hasDraft: true,
      hasPublished: content.studyResources?.status === 'published'
    };
  }

  // Find source text from note or content
  let sourceText = '';
  let activeNote = null;
  if (noteId) {
    activeNote = content.notes.id(noteId);
  }
  if (!activeNote) {
    activeNote = content.notes.find(n => n.textExtractionStatus === 'success' && n.rawExtractedText?.length > 150) ||
                 content.notes.find(n => n.extractedMarkdown?.length > 150) ||
                 content.notes[0];
  }

  sourceText = activeNote?.rawExtractedText || activeNote?.extractedMarkdown || activeNote?.content || content.fullNotesMarkdown;

  if (!sourceText || sourceText.trim().length < 150) {
    throw new Error('No valid extracted source text found. Please extract text from the chapter PDF first.');
  }

  const academicCtx = await getAcademicContext(chapterId);

  // Set processing status without touching published data
  content.processingStatus = 'generating';
  content.processingError = '';
  await content.save();

  try {
    const generated = await generateChapterStudyResources(
      sourceText,
      {
        chapterId,
        chapterTitle: academicCtx.chapterTitle,
        subjectName: academicCtx.subjectName,
        unitName: academicCtx.unitName
      },
      {
        mode,
        targets,
        existingResources: {
          studyResources: content.studyResources,
          quizQuestions: content.quizQuestions,
          fullNotesMarkdown: content.fullNotesMarkdown,
          draftStudyResources: content.draftStudyResources,
          draftQuizQuestions: content.draftQuizQuestions
        }
      }
    );

    if (generated.isUnchanged) {
      content.processingStatus = content.studyResources?.status === 'published' ? 'published' : 'idle';
      await content.save();
      return {
        success: true,
        isUnchanged: true,
        message: generated.message
      };
    }

    // Preserve existing draft fields if selective generation was run
    const currentDraft = content.draftStudyResources || {};
    const updatedDraftStudyResources = {
      shortNotes: generated.studyResources.shortNotes.length > 0
        ? generated.studyResources.shortNotes
        : (currentDraft.shortNotes || content.studyResources?.shortNotes || []),
      importantTopics: generated.studyResources.importantTopics.length > 0
        ? generated.studyResources.importantTopics
        : (currentDraft.importantTopics || content.studyResources?.importantTopics || []),
      keyDefinitions: generated.studyResources.keyDefinitions.length > 0
        ? generated.studyResources.keyDefinitions
        : (currentDraft.keyDefinitions || content.studyResources?.keyDefinitions || []),
      examRevisionNotes: generated.studyResources.examRevisionNotes
        ? generated.studyResources.examRevisionNotes
        : (currentDraft.examRevisionNotes || content.studyResources?.examRevisionNotes || ''),
      status: 'draft',
      generatedAt: new Date(),
      shortfallReason: generated.studyResources.shortfallReason || currentDraft.shortfallReason || '',
      sourceLimitations: generated.studyResources.sourceLimitations || currentDraft.sourceLimitations || []
    };

    const updatedDraftQuestions = generated.quizQuestions.length > 0
      ? generated.quizQuestions
      : (content.draftQuizQuestions?.length > 0 ? content.draftQuizQuestions : (content.quizQuestions || []));

    const updatedDraftFullNotes = generated.fullNotesMarkdown || content.draftFullNotesMarkdown || activeNote?.extractedMarkdown || content.fullNotesMarkdown || '';

    // Save into DRAFT staging version (Requirement 3: Never replace published version with draft)
    content.draftStudyResources = updatedDraftStudyResources;
    content.draftQuizQuestions = updatedDraftQuestions;
    content.draftFullNotesMarkdown = updatedDraftFullNotes;
    content.shortfallNotice = generated.shortfallNotice || { hasShortfall: false, expectedCount: 20, actualCount: updatedDraftQuestions.length, reason: '' };
    content.processingStatus = 'draft_ready';
    content.processingError = '';
    content.lastProcessingAt = new Date();

    await content.save();

    return {
      success: true,
      processingStatus: 'draft_ready',
      message: 'Generated study resources and MCQs into staging draft. Review and approve before publishing.',
      draftStudyResources: content.draftStudyResources,
      draftQuizQuestions: content.draftQuizQuestions,
      draftFullNotesMarkdown: content.draftFullNotesMarkdown,
      shortfallNotice: content.shortfallNotice,
      questionCount: content.draftQuizQuestions.length,
      source: generated.source
    };
  } catch (err) {
    // Stage 10: Retain original PDF, extracted text, and existing published resources
    content.processingStatus = 'failed';
    content.processingError = err.message;
    await content.save();
    throw err;
  }
}

/**
 * Stage 8: Update Draft Staging Resources (during Admin manual editing)
 */
async function updateDraftResources(chapterId, draftPayload) {
  const content = await Content.findOne({ chapterId });
  if (!content) throw new Error('Chapter content record not found.');

  const { draftStudyResources, draftQuizQuestions, draftFullNotesMarkdown } = draftPayload;

  if (draftStudyResources) {
    const cur = content.draftStudyResources || {};
    content.draftStudyResources = {
      shortNotes: Array.isArray(draftStudyResources.shortNotes) ? draftStudyResources.shortNotes : cur.shortNotes || [],
      importantTopics: Array.isArray(draftStudyResources.importantTopics) ? draftStudyResources.importantTopics : cur.importantTopics || [],
      keyDefinitions: Array.isArray(draftStudyResources.keyDefinitions) ? draftStudyResources.keyDefinitions : cur.keyDefinitions || [],
      examRevisionNotes: draftStudyResources.examRevisionNotes !== undefined ? draftStudyResources.examRevisionNotes : cur.examRevisionNotes || '',
      status: 'draft',
      generatedAt: cur.generatedAt || new Date(),
      shortfallReason: draftStudyResources.shortfallReason || cur.shortfallReason || '',
      sourceLimitations: draftStudyResources.sourceLimitations || cur.sourceLimitations || [],
      isManuallyEdited: true
    };
  }

  if (Array.isArray(draftQuizQuestions)) {
    const { validQuestions } = validateQuizQuestions(draftQuizQuestions, chapterId);
    content.draftQuizQuestions = validQuestions.map(q => ({
      ...q,
      status: 'draft',
      isManuallyEdited: true
    }));
  }

  if (draftFullNotesMarkdown !== undefined) {
    content.draftFullNotesMarkdown = String(draftFullNotesMarkdown);
  }

  content.processingStatus = 'draft_ready';
  await content.save();

  return {
    success: true,
    message: 'Draft saved successfully.',
    draftStudyResources: content.draftStudyResources,
    draftQuizQuestions: content.draftQuizQuestions,
    draftFullNotesMarkdown: content.draftFullNotesMarkdown
  };
}

/**
 * Stage 9: Explicit Atomic Publication
 * Promotes validated draft resources to published so students see the complete updated set.
 */
async function publishChapterResources(chapterId, user) {
  const content = await Content.findOne({ chapterId });
  if (!content) throw new Error('Chapter content record not found.');

  const draftResources = content.draftStudyResources;
  const draftQuestions = content.draftQuizQuestions;
  const draftFullNotes = content.draftFullNotesMarkdown;

  if (!draftResources && (!draftQuestions || draftQuestions.length === 0) && !draftFullNotes) {
    throw new Error('No draft resources found to publish.');
  }

  // Validate questions before publication
  const questionsToPublish = Array.isArray(draftQuestions) && draftQuestions.length > 0
    ? draftQuestions
    : (content.quizQuestions || []);

  const { validQuestions, discardedCount } = validateQuizQuestions(questionsToPublish, chapterId);
  if (discardedCount > 0 && validQuestions.length === 0) {
    throw new Error('All draft quiz questions failed validation. Please review and fix questions before publishing.');
  }

  const publishedQuestions = validQuestions.map(q => ({
    ...q,
    status: 'published'
  }));

  const resourcesToPublish = draftResources || content.studyResources || {};
  const publishedStudyResources = {
    shortNotes: Array.isArray(resourcesToPublish.shortNotes) ? resourcesToPublish.shortNotes : [],
    importantTopics: Array.isArray(resourcesToPublish.importantTopics) ? resourcesToPublish.importantTopics : [],
    keyDefinitions: Array.isArray(resourcesToPublish.keyDefinitions) ? resourcesToPublish.keyDefinitions : [],
    examRevisionNotes: resourcesToPublish.examRevisionNotes || '',
    status: 'published',
    generatedAt: resourcesToPublish.generatedAt || new Date(),
    publishedAt: new Date(),
    approvedBy: user?._id || undefined,
    shortfallReason: resourcesToPublish.shortfallReason || '',
    sourceLimitations: resourcesToPublish.sourceLimitations || []
  };

  // Atomic update: promote drafts to published
  content.studyResources = publishedStudyResources;
  content.quizQuestions = publishedQuestions;
  if (draftFullNotes) {
    content.fullNotesMarkdown = draftFullNotes;
  }

  // Backward compatibility sync
  content.shortNotes = publishedStudyResources.shortNotes;
  content.quizData = publishedQuestions.map(q => ({
    question: q.question,
    options: q.options,
    correctAnswer: q.correctAnswer
  }));

  // Mark latest note as published
  if (content.notes && content.notes.length > 0) {
    const latestNote = content.notes[content.notes.length - 1];
    latestNote.status = 'published';
    if (draftFullNotes && !latestNote.content) {
      latestNote.content = draftFullNotes;
    }
  }

  // Clear staging draft fields now that they have been approved and published
  content.draftStudyResources = null;
  content.draftQuizQuestions = [];
  content.draftFullNotesMarkdown = '';

  content.processingStatus = 'published';
  content.processingError = '';
  await content.save();

  return {
    success: true,
    message: 'Chapter learning resources approved and published to students successfully.',
    studyResources: content.studyResources,
    quizQuestions: content.quizQuestions,
    questionCount: publishedQuestions.length,
    fullNotesMarkdown: content.fullNotesMarkdown
  };
}

/**
 * Returns comprehensive pipeline and chapter status.
 */
async function getPipelineStatus(chapterId) {
  const content = await Content.findOne({ chapterId }).lean();
  if (!content) {
    return {
      exists: false,
      processingStatus: 'idle',
      pdf: null,
      extraction: null,
      draft: null,
      published: null
    };
  }

  const noteWithPdf = (content.notes || []).find(n => n.fileUrl || n.originalDocumentUrl) || (content.notes || [])[0] || null;

  return {
    exists: true,
    chapterId,
    processingStatus: content.processingStatus || 'idle',
    processingError: content.processingError || '',
    lastProcessingAt: content.lastProcessingAt || null,
    shortfallNotice: content.shortfallNotice || null,
    pdf: noteWithPdf ? {
      noteId: noteWithPdf._id,
      fileName: noteWithPdf.fileName || noteWithPdf.originalDocumentName || 'Document.pdf',
      fileSize: noteWithPdf.fileSize || 0,
      fileUrl: noteWithPdf.fileUrl || noteWithPdf.originalDocumentUrl,
      filePublicId: noteWithPdf.filePublicId,
      uploadStatus: noteWithPdf.fileUrl ? (noteWithPdf.fileUrl.includes('cloudinary') ? 'cloudinary' : 'local') : 'none'
    } : null,
    extraction: noteWithPdf ? {
      status: noteWithPdf.textExtractionStatus || 'none',
      charCount: noteWithPdf.charCount || noteWithPdf.rawExtractedText?.length || 0,
      wordCount: noteWithPdf.wordCount || 0,
      pageCount: noteWithPdf.pageCount || 1,
      chunksCount: noteWithPdf.extractedChunks?.length || 0,
      hasRawText: Boolean(noteWithPdf.rawExtractedText && noteWithPdf.rawExtractedText.length > 0),
      hasCleanedMarkdown: Boolean(noteWithPdf.extractedMarkdown && noteWithPdf.extractedMarkdown.length > 0)
    } : null,
    draft: {
      hasDraft: Boolean(content.draftStudyResources || (content.draftQuizQuestions && content.draftQuizQuestions.length > 0)),
      studyResources: content.draftStudyResources || null,
      quizQuestions: content.draftQuizQuestions || [],
      fullNotesMarkdown: content.draftFullNotesMarkdown || '',
      questionCount: content.draftQuizQuestions?.length || 0
    },
    published: {
      isPublished: content.studyResources?.status === 'published',
      publishedAt: content.studyResources?.publishedAt || null,
      studyResources: content.studyResources?.status === 'published' ? content.studyResources : null,
      quizQuestions: (content.quizQuestions || []).filter(q => q.status === 'published'),
      fullNotesMarkdown: content.fullNotesMarkdown || '',
      questionCount: (content.quizQuestions || []).filter(q => q.status === 'published').length
    }
  };
}

module.exports = {
  extractNoteText,
  generateStagingResources,
  generateChapterResources: generateStagingResources,
  updateDraftResources,
  publishChapterResources,
  publishPipelineResources: publishChapterResources,
  getPipelineStatus,
  getAcademicContext,
  isCloudinaryConfigured,
  detectMissingResources
};
