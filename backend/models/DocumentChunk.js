const mongoose = require('mongoose');

const documentChunkSchema = new mongoose.Schema(
  {
    chunkId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    chapterId: {
      type: String,
      required: true,
      index: true
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      index: true
    },
    unitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Unit',
      index: true
    },
    semester: {
      type: Number,
      index: true
    },
    noteId: {
      type: mongoose.Schema.Types.ObjectId,
      index: true
    },
    docTitle: {
      type: String,
      default: ''
    },
    sourcePdfUrl: {
      type: String,
      default: ''
    },
    sourcePdfName: {
      type: String,
      default: ''
    },
    chunkIndex: {
      type: Number,
      required: true
    },
    text: {
      type: String,
      required: true
    },
    pageNumber: {
      type: Number,
      required: true,
      index: true
    },
    startPage: {
      type: Number,
      required: true
    },
    endPage: {
      type: Number,
      required: true
    },
    wordCount: {
      type: Number,
      default: 0
    },
    charCount: {
      type: Number,
      default: 0
    },
    embedding: {
      type: [Number],
      default: []
    },
    isPublished: {
      type: Boolean,
      default: false,
      index: true
    },
    contentHash: {
      type: String,
      default: '',
      index: true
    }
  },
  { timestamps: true }
);

// Compound indexes for high-throughput authorized RAG retrieval
documentChunkSchema.index({ chapterId: 1, isPublished: 1 });
documentChunkSchema.index({ chapterId: 1, noteId: 1, chunkIndex: 1 });
documentChunkSchema.index({ semester: 1, chapterId: 1, isPublished: 1 });

module.exports = mongoose.model('DocumentChunk', documentChunkSchema);

