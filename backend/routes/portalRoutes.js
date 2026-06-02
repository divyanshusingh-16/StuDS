const express = require('express');
const Subject = require('../models/Subject');
const Unit = require('../models/Unit');
const Content = require('../models/Content');
const { generateChapterSummary } = require('../services/aiService');

const router = express.Router();

router.get('/subjects/:semester', async (req, res) => {
  try {
    const semester = parseInt(req.params.semester, 10);
    const subjects = await Subject.find({ semester })
      .select('_id subjectName subjectCode')
      .sort({ subjectName: 1 })
      .lean();
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/units/:subjectId', async (req, res) => {
  try {
    const { subjectId } = req.params;
    const units = await Unit.find({ subjectId })
      .sort({ unitNumber: 1 })
      .lean();
    res.json(units);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/search', async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) return res.json([]);

    const contents = await Content.find(
      { $text: { $search: query } },
      { score: { $meta: "textScore" } }
    )
    .sort({ score: { $meta: "textScore" } })
    .limit(5)
    .lean();

    if (contents.length === 0) return res.json([]);

    const chapterIds = contents.map(c => c.chapterId);
    const units = await Unit.find({ 'chapters.chapterId': { $in: chapterIds } }).lean();

    const results = contents.map(content => {
      let chapterName = content.chapterId;
      let unitName = 'Unknown Unit';
      let subjectId = null;

      for (const unit of units) {
        const chapter = unit.chapters.find(c => c.chapterId === content.chapterId);
        if (chapter) {
          chapterName = chapter.chapterName;
          unitName = unit.unitName;
          subjectId = unit.subjectId;
          break;
        }
      }

      const rawText = (content.fullNotesMarkdown || '').replace(/[#*`_\[\]()]/g, ' ').replace(/\s+/g, ' ').trim();
      const snippet = rawText.substring(0, 120) + (rawText.length > 120 ? '...' : '');

      return {
        type: 'chapter',
        title: chapterName,
        parentContext: unitName,
        snippet,
        subjectId,
        chapterId: content.chapterId,
        score: content.score
      };
    });

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/content/:chapterId', async (req, res) => {
  try {
    const { chapterId } = req.params;
    const content = await Content.findOne({ chapterId }).lean();
    
    if (!content) {
      return res.status(404).json({ error: 'No study materials uploaded for this chapter yet.' });
    }
    
    res.json(content);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/admin/generate-summary', async (req, res) => {
  const { chapterContentMarkdown } = req.body;

  if (!chapterContentMarkdown || typeof chapterContentMarkdown !== 'string' || chapterContentMarkdown.trim().length === 0) {
    return res.status(400).json({ error: 'chapterContentMarkdown is required and must be a non-empty string.' });
  }

  if (chapterContentMarkdown.length > 50000) {
    return res.status(413).json({ error: 'Input exceeds the maximum allowed size of 50,000 characters.' });
  }

  try {
    const summary = await generateChapterSummary(chapterContentMarkdown);
    res.json({ summary });
  } catch (error) {
    console.error('[AI] Summary generation failed:', error.message);
    res.status(502).json({ error: 'AI service failed to generate a summary. Please try again.' });
  }
});

module.exports = router;
