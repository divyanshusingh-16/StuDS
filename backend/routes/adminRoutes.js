const express = require('express');
const path = require('path');
const fs = require('fs');
const Subject = require('../models/Subject');
const Unit = require('../models/Unit');
const Content = require('../models/Content');
const uploadMiddleware = require('../middleware/uploadMiddleware');
const { isGenuinePdf } = require('../middleware/uploadMiddleware');
const cloudinary = require('../config/cloudinary');
const contentController = require('../controllers/contentController');
const { requireAuth, requireRole, requireTrustedOrigin } = require('../middleware/authMiddleware');
const { generateChapterSummary } = require('../services/aiService');
const { cleanExtractedNotes, verifySyllabusCoverage } = require('../services/noteCleanerService');
const { generateChapterStudyResources } = require('../services/studyResourcesService');
const pipelineService = require('../services/pipelineService');
const mammoth = require('mammoth');
const TurndownService = require('turndown');
let pdfParseModule;
try {
  pdfParseModule = require('pdf-parse');
} catch (_) {
  pdfParseModule = null;
}

async function extractTextFromPdfBuffer(pdfBuffer) {
  if (!pdfParseModule) {
    throw new Error('pdf-parse is not installed on the server.');
  }
  // If v1 function
  if (typeof pdfParseModule === 'function') {
    const res = await pdfParseModule(pdfBuffer);
    return (res.text || '').trim();
  }
  // If v2 class { PDFParse }
  if (pdfParseModule.PDFParse) {
    const parser = new pdfParseModule.PDFParse({ data: pdfBuffer });
    const res = await parser.getText();
    await parser.destroy();
    return (res?.text || '').trim();
  }
  // If default export
  if (typeof pdfParseModule.default === 'function') {
    const res = await pdfParseModule.default(pdfBuffer);
    return (res.text || '').trim();
  }
  throw new Error('Unrecognized pdf-parse export format.');
}

const router = express.Router();

router.use(requireAuth, requireTrustedOrigin);

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

// POST /subject
router.post('/subject', requireRole('super_admin'), async (req, res) => {
  try {
    const { subjectName, subjectCode, semester, department, course, specialization } = req.body;

    if (!department || !course || !specialization) {
      return res.status(400).json({ error: 'department, course, and specialization are required.' });
    }

    const newSubject = new Subject({ subjectName, subjectCode, semester, department, course, specialization });
    const saved = await newSubject.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /unit
router.post('/unit', requireRole('super_admin'), async (req, res) => {
  try {
    const { subjectId, unitNumber, unitName, chapters } = req.body;
    const newUnit = new Unit({ subjectId, unitNumber, unitName, chapters });
    const saved = await newUnit.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /content/upsert
router.post('/content/upsert', requireRole('content_admin', 'super_admin'), contentController.upsertChapterContent);

// Notes CRUD
router.get('/content/:chapterId/notes', requireRole('content_admin', 'super_admin'), contentController.getNotes);
router.post('/content/:chapterId/notes', requireRole('content_admin', 'super_admin'), contentController.createNote);
router.put('/content/:chapterId/notes/:noteId', requireRole('content_admin', 'super_admin'), contentController.updateNote);
router.delete('/content/:chapterId/notes/:noteId', requireRole('content_admin', 'super_admin'), contentController.deleteNote);

// POST /upload-notes-pdf (Dedicated PDF Study Notes Upload with Magic-Byte Validation & Asset Management)
router.post('/upload-notes-pdf', requireRole('content_admin', 'super_admin'), uploadMiddleware.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    // Validate that the buffer is a genuine PDF by checking the %PDF- magic header
    if (!isGenuinePdf(req.file.buffer)) {
      return res.status(400).json({ error: 'Validation failed: The uploaded file is not a genuine PDF document.' });
    }

    // If replacing an existing file, clean up the old asset reference
    const oldPublicId = req.body.oldPublicId;
    const oldFileUrl = req.body.oldFileUrl;
    if (oldPublicId || oldFileUrl) {
      await contentController.cleanupOldAsset(oldPublicId, oldFileUrl);
    }

    // If Cloudinary is configured with valid credentials, stream to Cloudinary
    if (isCloudinaryConfigured()) {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'student_portal_notes',
          resource_type: 'raw',
          format: 'pdf',
        },
        (error, result) => {
          if (error) {
            return res.status(500).json({ error: 'Cloudinary upload failed: ' + error.message });
          }
          return res.status(200).json({
            fileUrl: result.secure_url,
            fileName: req.file.originalname,
            fileSize: req.file.size,
            mimeType: 'application/pdf',
            filePublicId: result.public_id,
          });
        }
      );
      uploadStream.end(req.file.buffer);
    } else {
      // Local development fallback when Cloudinary credentials are not configured
      const uploadsDir = path.join(__dirname, '..', 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      const safeName = `${Date.now()}-${req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const filePath = path.join(uploadsDir, safeName);
      fs.writeFileSync(filePath, req.file.buffer);

      const host = req.get('host') || `localhost:${process.env.PORT || 5001}`;
      const protocol = req.protocol || 'http';
      const fileUrl = `${protocol}://${host}/uploads/${safeName}`;

      return res.status(200).json({
        fileUrl,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: 'application/pdf',
        filePublicId: `local:${safeName}`,
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /upload-pdf (PYQs)
router.post('/upload-pdf', requireRole('content_admin', 'super_admin'), uploadMiddleware.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    if (!isGenuinePdf(req.file.buffer)) {
      return res.status(400).json({ error: 'Validation failed: The uploaded file is not a genuine PDF document.' });
    }

    if (isCloudinaryConfigured()) {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'student_portal_docs',
          resource_type: 'raw',
          format: 'pdf',
        },
        (error, result) => {
          if (error) {
            return res.status(500).json({ error: 'Cloudinary upload failed: ' + error.message });
          }
          res.status(200).json({ fileUrl: result.secure_url, filePublicId: result.public_id });
        }
      );

      uploadStream.end(req.file.buffer);
    } else {
      const uploadsDir = path.join(__dirname, '..', 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      const safeName = `${Date.now()}-${req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const filePath = path.join(uploadsDir, safeName);
      fs.writeFileSync(filePath, req.file.buffer);

      const host = req.get('host') || `localhost:${process.env.PORT || 5001}`;
      const protocol = req.protocol || 'http';
      const fileUrl = `${protocol}://${host}/uploads/${safeName}`;

      res.status(200).json({ fileUrl, filePublicId: `local:${safeName}` });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /upload-document (For Notes system: PDF, DOCX, MD)
router.post('/upload-document', requireRole('content_admin', 'super_admin'), uploadMiddleware.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    // Convert DOCX to Markdown if it's a docx
    let extractedMarkdown = '';
    if (req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      try {
        const result = await mammoth.convertToHtml({ buffer: req.file.buffer });
        const turndownService = new TurndownService({ headingStyle: 'atx' });
        extractedMarkdown = turndownService.turndown(result.value);
      } catch (err) {
        console.error('Error extracting docx:', err);
      }
    } else if (req.file.mimetype === 'text/markdown' || req.file.mimetype === 'text/plain') {
      extractedMarkdown = req.file.buffer.toString('utf-8');
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'student_portal_docs',
        resource_type: 'raw',
        format: req.file.originalname.split('.').pop()
      },
      (error, result) => {
        if (error) {
          return res.status(500).json({ error: 'Cloudinary upload failed: ' + error.message });
        }
        res.status(200).json({ 
          fileUrl: result.secure_url,
          fileName: req.file.originalname,
          extractedMarkdown 
        });
      }
    );

    uploadStream.end(req.file.buffer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/generate-summary', requireRole('content_admin', 'super_admin'), async (req, res) => {
  const { chapterContentMarkdown } = req.body;

  if (!chapterContentMarkdown || typeof chapterContentMarkdown !== 'string' || chapterContentMarkdown.trim().length === 0) {
    return res.status(400).json({ error: 'chapterContentMarkdown is required and must be a non-empty string.' });
  }
  if (chapterContentMarkdown.length > 50000) {
    return res.status(413).json({ error: 'Input exceeds the maximum allowed size of 50,000 characters.' });
  }

  try {
    const summary = await generateChapterSummary(chapterContentMarkdown);
    return res.json({ summary });
  } catch (error) {
    console.error('[AI] Summary generation failed:', error.message);
    return res.status(502).json({ error: 'AI service failed to generate a summary. Please try again.' });
  }
});

// POST /extract-pdf-text — Server-side PDF text extraction & validation (Stage 2 & 3)
router.post('/extract-pdf-text', requireRole('content_admin', 'super_admin'), async (req, res) => {
  const { chapterId, noteId } = req.body;
  if (!chapterId || !noteId) {
    return res.status(400).json({ error: 'chapterId and noteId are required.' });
  }

  try {
    const result = await pipelineService.extractNoteText(chapterId, noteId);
    return res.json(result);
  } catch (error) {
    console.error('[PDF Extract]', error.message);
    return res.status(500).json({ error: error.message });
  }
});

// POST /clean-extracted-text — Clean existing raw text or custom text without re-parsing PDF
router.post('/clean-extracted-text', requireRole('content_admin', 'super_admin'), async (req, res) => {
  const { chapterId, noteId, rawText: customRawText, saveToNote } = req.body;
  if (!chapterId || !noteId) {
    return res.status(400).json({ error: 'chapterId and noteId are required.' });
  }

  try {
    const content = await Content.findOne({ chapterId });
    if (!content) return res.status(404).json({ error: 'Chapter content not found.' });

    const note = content.notes.id(noteId);
    if (!note) return res.status(404).json({ error: 'Note not found.' });

    const raw = customRawText !== undefined ? customRawText : note.rawExtractedText;
    if (!raw || !raw.trim()) {
      return res.status(400).json({ error: 'No raw text found to clean. Please extract text from the PDF first.' });
    }

    const { chapterTitle, unitName, subjectName } = await pipelineService.getAcademicContext(chapterId);
    const cleanResult = cleanExtractedNotes(raw, {
      chapterName: chapterTitle,
      subjectName,
      unitName
    });

    if (saveToNote !== false) {
      note.extractedMarkdown = cleanResult.cleanedMarkdown;
      await content.save();
    }

    return res.json({
      success: true,
      extractedMarkdown: cleanResult.cleanedMarkdown,
      rawExtractedText: raw,
      stats: cleanResult.stats,
      syllabusVerification: cleanResult.syllabusVerification
    });
  } catch (error) {
    console.error('[PDF Clean]', error.message);
    return res.status(500).json({ error: error.message });
  }
});

// ========================================================
// STUDS SAFE PDF-TO-AI PIPELINE & STUDY RESOURCES ROUTES
// ========================================================

// GET /content/:chapterId/pipeline/status — Full pipeline, PDF, extraction, draft & published overview
router.get('/content/:chapterId/pipeline/status', requireRole('content_admin', 'super_admin'), async (req, res) => {
  try {
    const { chapterId } = req.params;
    const status = await pipelineService.getPipelineStatus(chapterId);
    return res.json(status);
  } catch (error) {
    console.error('[Pipeline Status GET]', error.message);
    return res.status(500).json({ error: error.message });
  }
});

// POST /content/:chapterId/pipeline/generate — Generate missing or targeted resources into staging draft
router.post('/content/:chapterId/pipeline/generate', requireRole('content_admin', 'super_admin'), async (req, res) => {
  try {
    const { chapterId } = req.params;
    const { mode, targets, forceRegenerate, noteId } = req.body;
    const result = await pipelineService.generateStagingResources(chapterId, {
      mode: mode || 'missing_only',
      targets: targets || [],
      forceRegenerate: Boolean(forceRegenerate),
      noteId
    });
    return res.json(result);
  } catch (error) {
    console.error('[Pipeline Generate POST]', error.message);
    return res.status(500).json({ error: error.message });
  }
});

// POST /content/:chapterId/pipeline/retry — Re-attempt generation from existing extracted text
router.post('/content/:chapterId/pipeline/retry', requireRole('content_admin', 'super_admin'), async (req, res) => {
  try {
    const { chapterId } = req.params;
    const { noteId } = req.body;
    const result = await pipelineService.generateStagingResources(chapterId, {
      mode: 'missing_only',
      forceRegenerate: true,
      noteId
    });
    return res.json(result);
  } catch (error) {
    console.error('[Pipeline Retry POST]', error.message);
    return res.status(500).json({ error: error.message });
  }
});

// PUT /content/:chapterId/draft — Persist admin edits to staging draft without publishing
router.put('/content/:chapterId/draft', requireRole('content_admin', 'super_admin'), async (req, res) => {
  try {
    const { chapterId } = req.params;
    const result = await pipelineService.updateDraftResources(chapterId, req.body);
    return res.json(result);
  } catch (error) {
    console.error('[Pipeline Draft PUT]', error.message);
    return res.status(500).json({ error: error.message });
  }
});

// POST /content/:chapterId/pipeline/publish — Explicit atomic publication of approved draft
router.post('/content/:chapterId/pipeline/publish', requireRole('content_admin', 'super_admin'), async (req, res) => {
  try {
    const { chapterId } = req.params;
    const result = await pipelineService.publishChapterResources(chapterId, req.auth?.user);
    return res.json(result);
  } catch (error) {
    console.error('[Pipeline Publish POST]', error.message);
    return res.status(400).json({ error: error.message });
  }
});

// GET /content/:chapterId/study-resources — Inspect existing resources & quiz questions
router.get('/content/:chapterId/study-resources', requireRole('content_admin', 'super_admin'), async (req, res) => {
  try {
    const { chapterId } = req.params;
    const content = await Content.findOne({ chapterId }).lean();
    if (!content) {
      return res.status(404).json({ error: 'Chapter content not found.' });
    }

    const hasPublished = content.studyResources?.status === 'published';
    const hasDraft = Boolean(content.draftStudyResources || (content.draftQuizQuestions && content.draftQuizQuestions.length > 0));

    // Return published resources as primary, with drafts attached for admin studio review
    return res.json({
      success: true,
      studyResources: content.studyResources || null,
      quizQuestions: content.quizQuestions || [],
      shortNotes: content.shortNotes || [],
      fullNotesMarkdown: content.fullNotesMarkdown || '',
      draftStudyResources: content.draftStudyResources || null,
      draftQuizQuestions: content.draftQuizQuestions || [],
      draftFullNotesMarkdown: content.draftFullNotesMarkdown || '',
      processingStatus: content.processingStatus || 'idle',
      processingError: content.processingError || '',
      shortfallNotice: content.shortfallNotice || null,
      hasPublishedResources: hasPublished,
      hasDraftResources: hasDraft
    });
  } catch (error) {
    console.error('[Study Resources GET]', error.message);
    return res.status(500).json({ error: error.message });
  }
});

// POST /content/:chapterId/study-resources/generate — Backward-compatible wrapper
router.post('/content/:chapterId/study-resources/generate', requireRole('content_admin', 'super_admin'), async (req, res) => {
  const { chapterId } = req.params;
  const { forceRegenerate, noteId, mode, targets } = req.body;

  try {
    const result = await pipelineService.generateStagingResources(chapterId, {
      mode: mode || (forceRegenerate ? 'all' : 'missing_only'),
      targets: targets || [],
      forceRegenerate: Boolean(forceRegenerate),
      noteId
    });
    return res.json({
      ...result,
      studyResources: result.draftStudyResources || result.studyResources,
      quizQuestions: result.draftQuizQuestions || result.quizQuestions
    });
  } catch (error) {
    console.error('[Study Resources Generate]', error.message);
    return res.status(500).json({ error: error.message });
  }
});

// PUT /content/:chapterId/study-resources — Backward-compatible wrapper for edit & publishing
router.put('/content/:chapterId/study-resources', requireRole('content_admin', 'super_admin'), async (req, res) => {
  const { chapterId } = req.params;
  const { studyResources, quizQuestions, publishAll, draftFullNotesMarkdown } = req.body;

  try {
    if (publishAll) {
      // First update the draft with the submitted values, then publish
      await pipelineService.updateDraftResources(chapterId, {
        draftStudyResources: studyResources,
        draftQuizQuestions: quizQuestions,
        draftFullNotesMarkdown
      });
      const pubResult = await pipelineService.publishChapterResources(chapterId, req.auth?.user);
      return res.json(pubResult);
    } else {
      // Save as draft
      const draftResult = await pipelineService.updateDraftResources(chapterId, {
        draftStudyResources: studyResources,
        draftQuizQuestions: quizQuestions,
        draftFullNotesMarkdown
      });
      return res.json(draftResult);
    }
  } catch (error) {
    console.error('[Study Resources Update]', error.message);
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
