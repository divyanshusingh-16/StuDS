const express = require('express');
const Subject = require('../models/Subject');
const Unit = require('../models/Unit');
const Content = require('../models/Content');
const uploadMiddleware = require('../middleware/uploadMiddleware');
const cloudinary = require('../config/cloudinary');
const contentController = require('../controllers/contentController');
const { requireAuth, requireRole, requireTrustedOrigin } = require('../middleware/authMiddleware');
const { generateChapterSummary } = require('../services/aiService');

const router = express.Router();

router.use(requireAuth, requireTrustedOrigin);

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

// POST /upload-pdf
router.post('/upload-pdf', requireRole('content_admin', 'super_admin'), uploadMiddleware.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'student_portal_docs',
        resource_type: 'raw',
      },
      (error, result) => {
        if (error) {
          return res.status(500).json({ error: 'Cloudinary upload failed: ' + error.message });
        }
        res.status(200).json({ fileUrl: result.secure_url });
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

module.exports = router;
