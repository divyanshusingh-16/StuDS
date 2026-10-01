require('dotenv').config();
const mongoose = require('mongoose');
const Subject = require('../models/Subject');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/studs_portal';

const SEM5_SUBJECTS = [
  { name: 'Project Based Learning in Java', code: 'CS501', order: 1 },
  { name: 'Full Stack Development – II', code: 'CS502', order: 2 },
  { name: 'Competitive Coding – II', code: 'CS503', order: 3 },
  { name: 'Computer Networks', code: 'CS504', order: 4 },
  { name: 'Probability and Statistics', code: 'MA501', order: 5 },
  { name: 'Aptitude – III', code: 'GE502', order: 6 }
];

async function syncSem5() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(MONGO_URI);

    // 1. Remove Soft Skills from Sem 5
    const softSkillsResult = await Subject.deleteMany({
      semester: 5,
      subjectName: { $regex: /soft\s*skills/i }
    });
    console.log(`Removed ${softSkillsResult.deletedCount} Soft Skills record(s).`);

    // 2. Remove any CONT_ subjects
    const contResult = await Subject.deleteMany({
      $or: [
        { subjectCode: { $regex: /^CONT_/i } },
        { subjectName: { $regex: /^CONT_/i } }
      ]
    });
    console.log(`Removed ${contResult.deletedCount} CONT_ record(s).`);

    // 3. Upsert/Update the 6 subjects
    for (const item of SEM5_SUBJECTS) {
      await Subject.findOneAndUpdate(
        {
          semester: 5,
          course: 'Engineering (B.E./M.E.): Computer Science (CSE)',
          subjectCode: item.code
        },
        {
          $set: {
            subjectName: item.name,
            subjectCode: item.code,
            semester: 5,
            department: 'Engineering (B.E./M.E.)',
            course: 'Engineering (B.E./M.E.): Computer Science (CSE)',
            specialization: 'Computer Science (CSE)',
            order: item.order
          }
        },
        { upsert: true, new: true, runValidators: true }
      );
      console.log(`Synced Sem 5 subject: ${item.name} (${item.code}) [Order: ${item.order}]`);
    }

    // 4. Verify Sem 5 CSE subjects in DB
    const currentSem5 = await Subject.find({
      semester: 5,
      course: 'Engineering (B.E./M.E.): Computer Science (CSE)'
    })
      .sort({ order: 1, subjectName: 1 })
      .lean();

    console.log('\nVerified Semester 5 CSE Subjects in DB:');
    currentSem5.forEach((s, idx) => {
      console.log(`  ${idx + 1}. ${s.subjectName} (${s.subjectCode})`);
    });

  } catch (error) {
    console.error('Error syncing Semester 5 subjects:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('Database disconnected.');
  }
}

syncSem5();
