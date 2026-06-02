const mongoose = require('mongoose');
const { randomUUID } = require('crypto');

const chapterSchema = new mongoose.Schema(
  {
    chapterId: {
      type: String,
      required: true,
      default: () => randomUUID(),
    },
    chapterName: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const unitSchema = new mongoose.Schema(
  {
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
    },
    unitNumber: {
      type: Number,
      required: true,
    },
    unitName: {
      type: String,
      required: true,
      trim: true,
    },
    chapters: [chapterSchema],
  },
  {
    timestamps: true,
  }
);

unitSchema.index({ subjectId: 1, unitNumber: 1 }, { unique: true });
unitSchema.index({ unitName: 'text', 'chapters.chapterName': 'text' });

module.exports = mongoose.model('Unit', unitSchema);
