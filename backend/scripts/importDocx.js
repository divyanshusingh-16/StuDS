const mongoose = require('mongoose');
const mammoth = require('mammoth');
const TurndownService = require('turndown');
require('dotenv').config();

const Content = require('../models/Content');
const Unit = require('../models/Unit');
const Subject = require('../models/Subject');

async function importNotes() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/studs_portal');
    console.log('Connected to MongoDB');

    // Find Subject
    const subject = await Subject.findOne({ subjectName: 'Computer Networks' });
    if (!subject) throw new Error('Subject not found');

    // Find Unit
    const unit = await Unit.findOne({ subjectId: subject._id, unitNumber: 1 });
    if (!unit) throw new Error('Unit not found');

    // Find Chapter
    const chapter = unit.chapters.find(c => c.chapterName.includes('1.1 Introduction'));
    if (!chapter) throw new Error('Chapter not found');
    
    console.log('Chapter ID:', chapter.chapterId);

    // Read docx
    const result = await mammoth.convertToHtml({ path: 'C:/Users/divya/Downloads/Unit-1.1.docx' });
    const html = result.value;
    
    const turndownService = new TurndownService({ headingStyle: 'atx' });
    const markdown = turndownService.turndown(html);
    
    console.log('Converted markdown snippet:', markdown.substring(0, 500));

    // Update Content
    const content = await Content.findOneAndUpdate(
      { chapterId: chapter.chapterId },
      { $setOnInsert: { chapterId: chapter.chapterId } },
      { upsert: true, new: true }
    );
    
    // Check if a note already exists to avoid duplicates
    const existingNote = content.notes.find(n => n.title === 'Chapter 1.1 Complete Notes');
    if (!existingNote) {
      content.notes.push({
        title: 'Chapter 1.1 Complete Notes',
        content: markdown,
        status: 'published',
        subject: subject.subjectName,
        unit: 'Unit ' + unit.unitNumber,
        chapter: chapter.chapterId
      });
      await content.save();
      console.log('Note inserted successfully');
    } else {
      console.log('Note already exists');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.disconnect();
  }
}

importNotes();
