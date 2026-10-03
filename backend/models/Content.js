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
    content: { type: String, required: true },
    subject: { type: String },
    unit: { type: String },
    chapter: { type: String },
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
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
    pyqLinks: {
      type: [pyqLinkSchema],
      default: [],
    },
    quizData: {
      type: [quizDataSchema],
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
