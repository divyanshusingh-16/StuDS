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

// POST /extract-pdf-text — Server-side PDF text extraction (admin only, manual trigger)
router.post('/extract-pdf-text', requireRole('content_admin', 'super_admin'), async (req, res) => {
  const { chapterId, noteId } = req.body;
  if (!chapterId || !noteId) {
    return res.status(400).json({ error: 'chapterId and noteId are required.' });
  }

  if (!pdfParseModule) {
    return res.status(501).json({ error: 'PDF text extraction is not available (pdf-parse not installed).' });
  }

  try {
    const content = await Content.findOne({ chapterId });
    if (!content) return res.status(404).json({ error: 'Chapter content not found.' });

    const note = content.notes.id(noteId);
    if (!note) return res.status(404).json({ error: 'Note not found.' });

    const pdfUrl = note.fileUrl || note.originalDocumentUrl;
    if (!pdfUrl) {
      return res.status(400).json({ error: 'This note has no attached PDF to extract text from.' });
    }

    // Fetch the PDF buffer (supports both local /uploads/ and Cloudinary URLs)
    let pdfBuffer;
    if (pdfUrl.includes('/uploads/')) {
      // Local file
      const fileName = path.basename(pdfUrl.split('?')[0]);
      const filePath = path.join(__dirname, '..', 'uploads', fileName);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Local PDF file not found on server. It may have been deleted.' });
      }
      pdfBuffer = fs.readFileSync(filePath);
    } else {
      // Remote URL (Cloudinary, etc.)
      const fetchRes = await fetch(pdfUrl);
      if (!fetchRes.ok) {
        return res.status(502).json({ error: `Failed to download PDF for extraction (HTTP ${fetchRes.status}).` });
      }
      const arrayBuf = await fetchRes.arrayBuffer();
      pdfBuffer = Buffer.from(arrayBuf);
    }

    let rawText = '';
    try {
      rawText = await extractTextFromPdfBuffer(pdfBuffer);
    } catch (parseErr) {
      return res.status(422).json({
        error: 'PDF parsing failed. The file may be corrupted or encrypted.',
        detail: parseErr.message
      });
    }

    if (!rawText || rawText.length < 20) {
      // Likely a scanned / image-only PDF
      note.textExtractionStatus = 'no_text';
      note.rawExtractedText = '';
      note.extractedMarkdown = '';
      await content.save();
      return res.json({
        success: true,
        status: 'no_text',
        message: 'No extractable text found. This PDF appears to be a scanned image. OCR is not supported in this phase.',
        rawExtractedText: '',
        extractedMarkdown: ''
      });
    }

    // Run the note cleaner service to produce clean, well-formatted Markdown
    const cleanResult = cleanExtractedNotes(rawText);
    const extractedMarkdown = cleanResult.cleanedMarkdown;

    // Persist raw extracted text and cleaned markdown into the note
    note.rawExtractedText = rawText;
    note.extractedMarkdown = extractedMarkdown;
    note.textExtractionStatus = 'success';
    await content.save();

    return res.json({
      success: true,
      status: 'success',
      rawExtractedText: rawText,
      extractedMarkdown,
      charCount: rawText.length,
      cleanCharCount: extractedMarkdown.length,
      stats: cleanResult.stats,
      syllabusVerification: cleanResult.syllabusVerification
    });
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

    const cleanResult = cleanExtractedNotes(raw);

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

// ==========================================
// STUDY RESOURCES & 20-MCQ QUIZ ADMIN ROUTES
// ==========================================

// GET /content/:chapterId/study-resources — Inspect existing resources & quiz questions
router.get('/content/:chapterId/study-resources', requireRole('content_admin', 'super_admin'), async (req, res) => {
  try {
    const { chapterId } = req.params;
    const content = await Content.findOne({ chapterId }).lean();
    if (!content) {
      return res.status(404).json({ error: 'Chapter content not found.' });
    }

    return res.json({
      success: true,
      studyResources: content.studyResources || null,
      quizQuestions: content.quizQuestions || [],
      shortNotes: content.shortNotes || [],
      hasPublishedResources: content.studyResources?.status === 'published'
    });
  } catch (error) {
    console.error('[Study Resources GET]', error.message);
    return res.status(500).json({ error: error.message });
  }
});

// POST /content/:chapterId/study-resources/generate — Generate resources from cleaned notes
router.post('/content/:chapterId/study-resources/generate', requireRole('content_admin', 'super_admin'), async (req, res) => {
  const { chapterId } = req.params;
  const { forceRegenerate, noteId } = req.body;

  try {
    const content = await Content.findOne({ chapterId });
    if (!content) {
      return res.status(404).json({ error: 'Chapter content not found.' });
    }

    // Safeguard 5: Prevent accidental overwrite of published resources
    const hasExisting = Boolean(
      (content.studyResources?.shortNotes && content.studyResources.shortNotes.length > 0) ||
      (content.quizQuestions && content.quizQuestions.length > 0)
    );

    if (hasExisting && !forceRegenerate) {
      return res.status(200).json({
        success: false,
        requiresConfirmation: true,
        message: 'Study resources or quiz questions already exist for this chapter. Confirm to regenerate and overwrite drafts.',
        existingQuestionCount: content.quizQuestions?.length || 0,
        status: content.studyResources?.status || 'draft'
      });
    }

    // Locate the cleaned markdown source notes
    let sourceMarkdown = '';
    if (noteId) {
      const specificNote = content.notes.id(noteId);
      if (specificNote) {
        sourceMarkdown = specificNote.extractedMarkdown || specificNote.content || '';
      }
    }

    if (!sourceMarkdown) {
      const bestNote = content.notes.find(n => n.extractedMarkdown && n.extractedMarkdown.length > 500) ||
                       content.notes.find(n => n.content && n.content.length > 500) ||
                       content.notes[0];
      sourceMarkdown = bestNote?.extractedMarkdown || bestNote?.content || content.fullNotesMarkdown || '';
    }

    // Generate study resources and 20 MCQs
    const generated = await generateChapterStudyResources(sourceMarkdown, content.chapterId);

    // Save as draft by default for admin preview and approval
    content.studyResources = {
      shortNotes: generated.shortNotes,
      importantTopics: generated.importantTopics,
      keyDefinitions: generated.keyDefinitions,
      examRevisionNotes: generated.examRevisionNotes,
      status: 'draft',
      generatedAt: new Date()
    };

    // Format quiz questions into schema instances with draft status
    content.quizQuestions = generated.quizQuestions.map(q => ({
      question: q.question.trim(),
      options: q.options.map(opt => String(opt).trim()),
      correctAnswer: String(q.correctAnswer).trim(),
      explanation: q.explanation ? String(q.explanation).trim() : '',
      status: 'draft'
    }));

    await content.save();

    return res.json({
      success: true,
      message: 'Generated study resources and 20 MCQs successfully as draft.',
      studyResources: content.studyResources,
      quizQuestions: content.quizQuestions,
      questionCount: content.quizQuestions.length,
      source: generated.source
    });
  } catch (error) {
    console.error('[Study Resources Generate]', error.message);
    return res.status(500).json({ error: error.message });
  }
});

// PUT /content/:chapterId/study-resources — Admin preview, edit, approval, and publishing
router.put('/content/:chapterId/study-resources', requireRole('content_admin', 'super_admin'), async (req, res) => {
  const { chapterId } = req.params;
  const { studyResources, quizQuestions, publishAll } = req.body;

  try {
    const content = await Content.findOne({ chapterId });
    if (!content) {
      return res.status(404).json({ error: 'Chapter content not found.' });
    }

    // Update study resources if provided
    if (studyResources) {
      const current = content.studyResources || {};
      const newStatus = publishAll ? 'published' : (studyResources.status || current.status || 'draft');
      
      content.studyResources = {
        shortNotes: Array.isArray(studyResources.shortNotes) ? studyResources.shortNotes : current.shortNotes || [],
        importantTopics: Array.isArray(studyResources.importantTopics) ? studyResources.importantTopics : current.importantTopics || [],
        keyDefinitions: Array.isArray(studyResources.keyDefinitions) ? studyResources.keyDefinitions : current.keyDefinitions || [],
        examRevisionNotes: studyResources.examRevisionNotes !== undefined ? studyResources.examRevisionNotes : current.examRevisionNotes || '',
        status: newStatus,
        generatedAt: current.generatedAt || new Date()
      };

      // Sync to content.shortNotes for backward compatibility when published
      if (newStatus === 'published' && Array.isArray(content.studyResources.shortNotes)) {
        content.shortNotes = content.studyResources.shortNotes;
      }
    }

    // Update quiz questions if provided
    if (Array.isArray(quizQuestions)) {
      const questionStatus = publishAll ? 'published' : undefined;
      const seenQuestions = new Set();
      const cleanQuestions = [];

      for (const q of quizQuestions) {
        if (!q.question || !q.question.trim()) continue;
        const normKey = q.question.trim().toLowerCase();
        if (seenQuestions.has(normKey)) continue; // Deduplicate questions
        seenQuestions.add(normKey);

        const options = Array.isArray(q.options) ? q.options.map(o => String(o).trim()) : [];
        if (options.length !== 4) {
          return res.status(400).json({ error: `Question "${q.question}" must have exactly 4 options.` });
        }

        const correctAnswer = String(q.correctAnswer || '').trim();
        if (!options.includes(correctAnswer)) {
          return res.status(400).json({ error: `Correct answer "${correctAnswer}" must match one of the 4 options.` });
        }

        cleanQuestions.push({
          _id: q._id || undefined,
          question: q.question.trim(),
          options,
          correctAnswer,
          explanation: q.explanation ? String(q.explanation).trim() : '',
          status: questionStatus || q.status || 'published'
        });
      }

      content.quizQuestions = cleanQuestions;

      // Sync published questions into content.quizData for backward compatibility
      if (publishAll || cleanQuestions.some(q => q.status === 'published')) {
        content.quizData = cleanQuestions
          .filter(q => q.status === 'published')
          .map(q => ({
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer
          }));
      }
    }

    await content.save();

    return res.json({
      success: true,
      message: 'Study resources and quiz questions successfully updated.',
      studyResources: content.studyResources,
      quizQuestions: content.quizQuestions,
      questionCount: content.quizQuestions.length
    });
  } catch (error) {
    console.error('[Study Resources Update]', error.message);
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
