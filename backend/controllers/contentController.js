const Content = require('../models/Content');

exports.upsertChapterContent = async (req, res) => {
  try {
    const {
      chapterId,
      fullNotesMarkdown,
      shortNotes,
      pyqLinks,
      quizData,
      aiSummary
    } = req.body;

    if (!chapterId) {
      return res.status(400).json({ success: false, error: 'chapterId is required' });
    }

    const updatePayload = { fullNotesMarkdown, shortNotes, pyqLinks, quizData };
    if (aiSummary !== undefined) {
      updatePayload.aiSummary = aiSummary;
    }

    const content = await Content.findOneAndUpdate(
      { chapterId },
      updatePayload,
      { upsert: true, new: true, runValidators: true }
    );

    return res.status(200).json(content);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, error: error.message });
    }
    return res.status(500).json({ success: false, error: error.message });
  }
};
