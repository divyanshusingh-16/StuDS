const express = require('express');
const Subject = require('../models/Subject');
const Unit = require('../models/Unit');
const Content = require('../models/Content');

const router = express.Router();

router.get('/subjects/:semester', async (req, res) => {
  try {
    const semester = parseInt(req.params.semester, 10);
    const { course } = req.query;

    const filter = {
      semester,
      subjectCode: { $not: /^CONT_/i },
      subjectName: { $not: /^CONT_/i }
    };
    if (course) filter.course = course;
    if (semester === 5) {
      filter.subjectName = {
        ...filter.subjectName,
        $nin: ['Soft Skills-III', 'Soft Skills – III', 'Soft Skills - III']
      };
    }

    const subjects = await Subject.find(filter)
      .select('_id subjectName subjectCode semester department course specialization order')
      .sort({ order: 1, subjectName: 1 })
      .lean();

    // Clean subject names and deduplicate
    const seenNames = new Set();
    const cleanSubjects = [];

    for (const sub of subjects) {
      // Remove any leading code prefix like "CS501 - " or "CS501: " if present
      let cleanName = (sub.subjectName || '')
        .replace(/^[A-Z0-9_-]+\s*[-:]\s*/i, '')
        .trim();

      // Normalize hyphens for consistency
      cleanName = cleanName.replace(/\s*-\s*II/g, ' – II').replace(/\s*-\s*III/g, ' – III');

      if (/^CONT_/i.test(cleanName) || /^CONT_/i.test(sub.subjectCode)) {
        continue;
      }
      if (semester === 5 && /^Soft Skills/i.test(cleanName)) {
        continue;
      }

      // Deduplicate by clean name
      const normalizedKey = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (seenNames.has(normalizedKey)) {
        continue;
      }
      seenNames.add(normalizedKey);

      cleanSubjects.push({
        _id: sub._id,
        subjectName: cleanName,
        subjectCode: sub.subjectCode,
        semester: sub.semester,
        department: sub.department,
        course: sub.course,
        specialization: sub.specialization,
        order: sub.order || 0
      });
    }

    res.json(cleanSubjects);
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

module.exports = router;
