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

exports.getNotes = async (req, res) => {
  try {
    const { chapterId } = req.params;
    const content = await Content.findOne({ chapterId }).lean();
    if (!content) return res.status(200).json([]);
    return res.status(200).json(content.notes || []);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.createNote = async (req, res) => {
  try {
    const { chapterId } = req.params;
    const { title, content: noteContent, subject, unit, status } = req.body;
    
    if (!title || !noteContent) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const newNote = {
      title,
      content: noteContent,
      subject,
      unit,
      chapter: chapterId,
      status: status || 'draft',
      createdBy: req.auth.user._id,
    };

    const content = await Content.findOneAndUpdate(
      { chapterId },
      { $push: { notes: newNote } },
      { upsert: true, new: true, runValidators: true }
    );

    return res.status(201).json(content.notes[content.notes.length - 1]);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.updateNote = async (req, res) => {
  try {
    const { chapterId, noteId } = req.params;
    const { title, content: noteContent, status } = req.body;
    
    const content = await Content.findOne({ chapterId });
    if (!content) return res.status(404).json({ error: 'Chapter content not found' });
    
    const note = content.notes.id(noteId);
    if (!note) return res.status(404).json({ error: 'Note not found' });
    
    if (title) note.title = title;
    if (noteContent) note.content = noteContent;
    if (status) note.status = status;
    
    await content.save();
    return res.status(200).json(note);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.deleteNote = async (req, res) => {
  try {
    const { chapterId, noteId } = req.params;
    const content = await Content.findOneAndUpdate(
      { chapterId },
      { $pull: { notes: { _id: noteId } } },
      { new: true }
    );
    if (!content) return res.status(404).json({ error: 'Chapter content not found' });
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
