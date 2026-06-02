const express = require('express');
const Subject = require('../models/Subject');
const Unit = require('../models/Unit');
const Content = require('../models/Content');
const uploadMiddleware = require('../middleware/uploadMiddleware');
const cloudinary = require('../config/cloudinary');
const contentController = require('../controllers/contentController');

const router = express.Router();

// Authentication Middleware
const adminAuth = (req, res, next) => {
  const adminSecret = process.env.ADMIN_SECRET;
  const clientSecret = req.headers['x-admin-auth'];
  if (!adminSecret || clientSecret !== adminSecret) {
    return res.status(401).json({ error: 'Unauthorized: Invalid admin credentials.' });
  }
  next();
};

router.use(adminAuth);

// POST /subject
router.post('/subject', async (req, res) => {
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
router.post('/unit', async (req, res) => {
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
router.post('/content/upsert', contentController.upsertChapterContent);

// POST /upload-pdf
router.post('/upload-pdf', uploadMiddleware.single('file'), async (req, res) => {
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

module.exports = router;
