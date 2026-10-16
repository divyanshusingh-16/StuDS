const mongoose = require('mongoose');

const pyqLinkSchema = new mongoose.Schema(
  {
    year: {
      type: Number,
      required: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

const noteSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    // Supplementary structured text / Markdown (manually authored or extracted and edited by admin)
    content: { type: String, default: '' },
    subject: { type: String },
    unit: { type: String },
    chapter: { type: String },
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    // PDF attachment fields
    fileUrl: { type: String },
    fileName: { type: String },
    fileSize: { type: Number },
    mimeType: { type: String, default: 'application/pdf' },
    filePublicId: { type: String },
    originalDocumentUrl: { type: String },
    originalDocumentName: { type: String },
    // PDF text extraction fields (kept separate from the original PDF)
    rawExtractedText: { type: String, default: '' },       // Raw text output from pdf-parse
    extractedMarkdown: { type: String, default: '' },      // Formatted Markdown version (for display)
    textExtractionStatus: {
      type: String,
      enum: ['none', 'pending', 'success', 'no_text', 'failed'],
      default: 'none'
    },
  },
  { timestamps: true }
);


const quizDataSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
    },
    options: {
      type: [String],
      required: true,
      validate: [
        {
          validator: function (v) {
            return v && v.length === 4;
          },
        },
      ],
    },
    correctAnswer: {
      type: String,
      required: true,
      validate: {
        validator: function (v) {
          return this.options && this.options.includes(v);
        },
      },
    },
  },
  { _id: false }
);

const keyDefinitionSchema = new mongoose.Schema(
  {
    term: { type: String, required: true },
    definition: { type: String, required: true },
  },
  { _id: true }
);

const studyResourcesSchema = new mongoose.Schema(
  {
    shortNotes: { type: [String], default: [] },
    importantTopics: { type: [String], default: [] },
    keyDefinitions: { type: [keyDefinitionSchema], default: [] },
    examRevisionNotes: { type: String, default: '' },
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
    generatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const quizQuestionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
    },
    options: {
      type: [String],
      required: true,
      validate: [
        {
          validator: function (v) {
            return v && v.length === 4;
          },
          message: 'Every quiz question must have exactly 4 options.',
        },
      ],
    },
    correctAnswer: {
      type: String,
      required: true,
    },
    explanation: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft',
    },
  },
  { _id: true, timestamps: true }
);

const contentSchema = new mongoose.Schema(
  {
    chapterId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    fullNotesMarkdown: {
      type: String,
      default: '',
    },
    shortNotes: {
      type: [String],
      default: [],
    },
    studyResources: {
      type: studyResourcesSchema,
      default: () => ({}),
    },
    pyqLinks: {
      type: [pyqLinkSchema],
      default: [],
    },
    quizData: {
      type: [quizDataSchema],
      default: [],
    },
    quizQuestions: {
      type: [quizQuestionSchema],
      default: [],
    },
    aiSummary: {
      type: String,
      default: null,
    },
    notes: {
      type: [noteSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

contentSchema.index({ fullNotesMarkdown: 'text', shortNotes: 'text' }, { weights: { fullNotesMarkdown: 3, shortNotes: 1 } });

module.exports = mongoose.model('Content', contentSchema);
