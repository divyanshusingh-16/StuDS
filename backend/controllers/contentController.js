const Content = require('../models/Content');
const cloudinary = require('../config/cloudinary');
const path = require('path');
const fs = require('fs');

async function cleanupOldAsset(publicId, fileUrl) {
  if (publicId && !publicId.startsWith('local:')) {
    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
    } catch (err) {
      console.warn('Failed to delete Cloudinary asset:', err.message);
    }
  } else if (fileUrl && fileUrl.includes('/uploads/')) {
    try {
      const fileName = path.basename(fileUrl);
      const filePath = path.join(__dirname, '..', 'uploads', fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (err) {
      console.warn('Failed to delete local upload file:', err.message);
    }
  }
}

exports.cleanupOldAsset = cleanupOldAsset;

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
    const {
      title,
      content: noteContent,
      subject,
      unit,
      status,
      fileUrl,
      fileName,
      fileSize,
      mimeType,
      filePublicId,
      originalDocumentUrl,
      originalDocumentName
    } = req.body;
    
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Note title is required.' });
    }

    const effectiveFileUrl = fileUrl || originalDocumentUrl || '';
    const effectiveFileName = fileName || originalDocumentName || '';

    if (!noteContent && !effectiveFileUrl) {
      return res.status(400).json({ error: 'Either structured notes content or an uploaded PDF document is required.' });
    }

    const newNote = {
      title: title.trim(),
      content: noteContent || '',
      subject: subject || '',
      unit: unit || '',
      chapter: chapterId,
      status: status || 'draft',
      createdBy: req.auth.user._id,
      fileUrl: effectiveFileUrl,
      fileName: effectiveFileName,
      fileSize: fileSize || null,
      mimeType: mimeType || 'application/pdf',
      filePublicId: filePublicId || null,
      originalDocumentUrl: effectiveFileUrl,
      originalDocumentName: effectiveFileName
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
    const {
      title,
      content: noteContent,
      status,
      fileUrl,
      fileName,
      fileSize,
      mimeType,
      filePublicId,
      originalDocumentUrl,
      originalDocumentName
    } = req.body;
    
    const content = await Content.findOne({ chapterId });
    if (!content) return res.status(404).json({ error: 'Chapter content not found' });
    
    const note = content.notes.id(noteId);
    if (!note) return res.status(404).json({ error: 'Note not found' });
    
    // Handle asset replacement: delete old asset if a new publicId is assigned
    if (filePublicId && note.filePublicId && note.filePublicId !== filePublicId) {
      cleanupOldAsset(note.filePublicId, note.fileUrl);
    }

    if (title !== undefined) note.title = title.trim();
    if (noteContent !== undefined) note.content = noteContent;
    if (status !== undefined) note.status = status;
    
    if (fileUrl !== undefined || originalDocumentUrl !== undefined) {
      const updatedUrl = fileUrl !== undefined ? fileUrl : originalDocumentUrl;
      note.fileUrl = updatedUrl;
      note.originalDocumentUrl = updatedUrl;
    }
    if (fileName !== undefined || originalDocumentName !== undefined) {
      const updatedName = fileName !== undefined ? fileName : originalDocumentName;
      note.fileName = updatedName;
      note.originalDocumentName = updatedName;
    }
    if (fileSize !== undefined) note.fileSize = fileSize;
    if (mimeType !== undefined) note.mimeType = mimeType;
    if (filePublicId !== undefined) note.filePublicId = filePublicId;
    if (req.body.extractedMarkdown !== undefined) note.extractedMarkdown = req.body.extractedMarkdown;
    if (req.body.rawExtractedText !== undefined) note.rawExtractedText = req.body.rawExtractedText;
    if (req.body.textExtractionStatus !== undefined) note.textExtractionStatus = req.body.textExtractionStatus;
    
    await content.save();
    return res.status(200).json(note);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.deleteNote = async (req, res) => {
  try {
    const { chapterId, noteId } = req.params;
    const content = await Content.findOne({ chapterId });
    if (!content) return res.status(404).json({ error: 'Chapter content not found' });

    const note = content.notes.id(noteId);
    if (!note) return res.status(404).json({ error: 'Note not found' });

    // Safely delete associated asset
    if (note.filePublicId || note.fileUrl || note.originalDocumentUrl) {
      cleanupOldAsset(note.filePublicId, note.fileUrl || note.originalDocumentUrl);
    }

    content.notes.pull({ _id: noteId });
    await content.save();
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
