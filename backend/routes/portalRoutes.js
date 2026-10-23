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
    if (course) {
      // Use case-insensitive exact match to handle minor encoding/naming differences
      filter.course = { $regex: `^${course.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' };
    }
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
    
    const normalizeMediaUrl = (url) => {
      if (!url || typeof url !== 'string') return url;
      if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(url)) {
        const host = req.get('host');
        if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
          const proto = req.get('x-forwarded-proto') || req.protocol || 'https';
          const path = url.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/, '');
          return `${proto}://${host}${path}`;
        }
      }
      return url;
    };

    // Only return published notes to students & dynamically normalize media URLs
    if (content.notes && Array.isArray(content.notes)) {
      content.notes = content.notes
        .filter(note => note.status === 'published')
        .map(note => ({
          ...note,
          fileUrl: normalizeMediaUrl(note.fileUrl),
          originalDocumentUrl: normalizeMediaUrl(note.originalDocumentUrl)
        }));
    }

    if (content.pastPapers && Array.isArray(content.pastPapers)) {
      content.pastPapers = content.pastPapers.map(pyq => ({
        ...pyq,
        fileUrl: normalizeMediaUrl(pyq.fileUrl)
      }));
    }

    // Only return published study resources to students
    if (content.studyResources && content.studyResources.status !== 'published') {
      delete content.studyResources;
    }

    // Requirement 8: NEVER expose correct answers or explanations before submission
    if (content.quizQuestions && Array.isArray(content.quizQuestions)) {
      content.quizQuestions = content.quizQuestions
        .filter(q => q.status === 'published')
        .map(q => ({
          _id: q._id,
          question: q.question,
          options: q.options
        }));
    }

    if (content.quizData && Array.isArray(content.quizData)) {
      content.quizData = content.quizData.map(q => ({
        question: q.question,
        options: q.options
      }));
    }

    // Critical Rule: Never expose draft or staging resources to students
    delete content.draftStudyResources;
    delete content.draftQuizQuestions;
    delete content.draftFullNotesMarkdown;
    delete content.extractedText;
    delete content.extractedChunks;
    delete content.processingError;
    delete content.shortfallNotice;
    
    res.json(content);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// SECURE CHAPTER QUIZ PRACTICE ENDPOINTS
// ==========================================

// GET /quiz/:chapterId/attempt — 5 distinct random questions without answers
router.get('/quiz/:chapterId/attempt', async (req, res) => {
  try {
    const { chapterId } = req.params;
    const content = await Content.findOne({ chapterId }).lean();

    if (!content) {
      return res.status(404).json({ error: 'Chapter content not found.' });
    }

    // Filter for approved/published questions
    let publishedQuestions = (content.quizQuestions || []).filter(q => q.status === 'published');
    
    // Fallback to quizData if quizQuestions not populated yet
    if (publishedQuestions.length === 0 && content.quizData && content.quizData.length > 0) {
      publishedQuestions = content.quizData.map((q, idx) => ({
        _id: `legacy_${idx}`,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: 'Standard chapter syllabus review question.'
      }));
    }

    if (publishedQuestions.length === 0) {
      return res.status(404).json({
        error: 'No published quiz questions available for this chapter yet.'
      });
    }

    // Requirement 7: Shuffle and randomly select exactly 5 distinct questions
    const pool = [...publishedQuestions];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    const selectedCount = Math.min(5, pool.length);
    const selected = pool.slice(0, selectedCount);

    const attemptId = `att_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    // Requirement 8: Never leak correctAnswer or explanation in attempt
    const sanitizedQuestions = selected.map(q => ({
      _id: q._id ? q._id.toString() : q.question,
      question: q.question,
      options: q.options
    }));

    return res.json({
      success: true,
      attemptId,
      chapterId,
      totalAvailable: publishedQuestions.length,
      questionCount: sanitizedQuestions.length,
      questions: sanitizedQuestions
    });
  } catch (error) {
    console.error('[Quiz Attempt]', error.message);
    return res.status(500).json({ error: error.message });
  }
});

// POST /quiz/:chapterId/submit — Server-side score validation & explanation reveal
router.post('/quiz/:chapterId/submit', async (req, res) => {
  try {
    const { chapterId } = req.params;
    const { attemptId, answers } = req.body;

    if (!answers) {
      return res.status(400).json({ error: 'Answers payload is required.' });
    }

    const content = await Content.findOne({ chapterId }).lean();
    if (!content) {
      return res.status(404).json({ error: 'Chapter content not found.' });
    }

    // Combine questions lookup dictionary
    const allQuestions = [...(content.quizQuestions || [])];
    if (content.quizData) {
      content.quizData.forEach((q, idx) => {
        allQuestions.push({
          _id: `legacy_${idx}`,
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: 'Standard syllabus question.'
        });
      });
    }

    // Normalize answers into an array
    let normalizedAnswers = [];
    if (Array.isArray(answers)) {
      normalizedAnswers = answers;
    } else if (typeof answers === 'object') {
      normalizedAnswers = Object.entries(answers).map(([questionId, selectedAnswer]) => ({
        questionId,
        selectedAnswer
      }));
    }

    let score = 0;
    const results = [];

    for (const ans of normalizedAnswers) {
      const qId = String(ans.questionId || ans.id || '');
      const selected = String(ans.selectedAnswer || '').trim();

      // Find question by _id or question text
      const questionDoc = allQuestions.find(q =>
        (q._id && q._id.toString() === qId) ||
        (q.question && q.question.trim().toLowerCase() === qId.toLowerCase())
      );

      if (!questionDoc) {
        results.push({
          questionId: qId,
          question: 'Question not found in database',
          selectedAnswer: selected,
          correctAnswer: null,
          isCorrect: false,
          explanation: 'This question could not be verified against the chapter question bank.'
        });
        continue;
      }

      const isCorrect = selected === String(questionDoc.correctAnswer).trim();
      if (isCorrect) score++;

      results.push({
        questionId: questionDoc._id ? questionDoc._id.toString() : qId,
        question: questionDoc.question,
        selectedAnswer: selected,
        correctAnswer: questionDoc.correctAnswer,
        isCorrect,
        explanation: questionDoc.explanation || `The correct answer is ${questionDoc.correctAnswer}.`
      });
    }

    const total = results.length;
    const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

    return res.json({
      success: true,
      attemptId: attemptId || null,
      chapterId,
      score,
      total,
      percentage,
      results
    });
  } catch (error) {
    console.error('[Quiz Submit]', error.message);
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
