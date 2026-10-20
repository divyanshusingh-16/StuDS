const dns = require('dns');
try { dns.setServers(['8.8.8.8', '1.1.1.1']); } catch (e) {}
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');

async function testApiMapping() {
  await mongoose.connect(process.env.MONGO_URI);
  const Subject = require('../models/Subject');
  const Unit = require('../models/Unit');
  const Content = require('../models/Content');

  console.log('Testing portal API query behavior for Semester 5...');

  const courseQuery = 'Engineering (B.E./M.E.): Computer Science (CSE)';
  const escapedCourse = courseQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const filter = {
    semester: 5,
    subjectCode: { $not: /^CONT_/i },
    subjectName: { $not: /^CONT_/i },
    course: { $regex: `^${escapedCourse}$`, $options: 'i' },
    subjectName: { $nin: ['Soft Skills-III', 'Soft Skills – III', 'Soft Skills - III'] }
  };

  const subjects = await Subject.find(filter).sort({ order: 1, subjectName: 1 }).lean();
  console.log(`Subjects matched (${subjects.length}):`, subjects.map(s => `${s.subjectCode}: ${s.subjectName}`));

  const cn = subjects.find(s => s.subjectCode === 'CS504' || s.subjectName === 'Computer Networks');
  if (!cn) {
    console.error('CRITICAL BUG: Computer Networks was filtered out by Subject query!');
  } else {
    console.log('CN subject found:', cn._id);
  }

  // Check Units
  const units = await Unit.find({ subjectId: cn._id }).sort({ unitNumber: 1 }).lean();
  console.log(`Units found for CN (${units.length}):`, units.map(u => `Unit ${u.unitNumber}: ${u.unitName} (${u.chapters?.length || 0} chapters)`));

  const u1 = units.find(u => u.unitNumber === 1);
  const ch1_1 = u1?.chapters?.find(c => /1\.1/i.test(c.chapterName) || /Introduction/i.test(c.chapterName));
  console.log('Ch 1.1 in Unit 1:', ch1_1);

  // Check Content query: GET /api/content/:chapterId
  const chapterId = ch1_1.chapterId;
  const rawContent = await Content.findOne({ chapterId }).lean();
  if (!rawContent) {
    console.error('CRITICAL: Content not found for chapterId:', chapterId);
  } else {
    console.log('\n--- Content returned by DB for chapterId:', chapterId, '---');
    console.log('Content _id:', rawContent._id);
    console.log('Notes count:', rawContent.notes?.length);
    console.log('Notes statuses:', rawContent.notes?.map(n => ({ title: n.title, status: n.status, fileUrl: n.fileUrl, contentLen: n.content?.length })));
    console.log('studyResources status:', rawContent.studyResources?.status);
    console.log('quizQuestions count:', rawContent.quizQuestions?.length);
    console.log('quizQuestions published count:', rawContent.quizQuestions?.filter(q => q.status === 'published').length);
    console.log('fullNotesMarkdown length:', rawContent.fullNotesMarkdown?.length);
  }

  // Simulate GET /api/content/:chapterId (portalRoutes.js lines 153-189)
  const studentPayload = JSON.parse(JSON.stringify(rawContent));
  if (studentPayload.notes && Array.isArray(studentPayload.notes)) {
    studentPayload.notes = studentPayload.notes.filter(note => note.status === 'published');
  }
  if (studentPayload.studyResources && studentPayload.studyResources.status !== 'published') {
    delete studentPayload.studyResources;
  }
  if (studentPayload.quizQuestions && Array.isArray(studentPayload.quizQuestions)) {
    studentPayload.quizQuestions = studentPayload.quizQuestions
      .filter(q => q.status === 'published')
      .map(q => ({
        _id: q._id,
        question: q.question,
        options: q.options
      }));
  }
  delete studentPayload.draftStudyResources;
  delete studentPayload.draftQuizQuestions;
  delete studentPayload.draftFullNotesMarkdown;
  delete studentPayload.extractedText;
  delete studentPayload.extractedChunks;
  delete studentPayload.processingError;
  delete studentPayload.shortfallNotice;

  console.log('\n--- Payload sent to Student Portal UI ---');
  console.log('Notes visible to students:', studentPayload.notes?.length);
  console.log('Has studyResources:', Boolean(studentPayload.studyResources));
  console.log('studyResources.shortNotes:', studentPayload.studyResources?.shortNotes?.length);
  console.log('studyResources.importantTopics:', studentPayload.studyResources?.importantTopics?.length);
  console.log('studyResources.keyDefinitions:', studentPayload.studyResources?.keyDefinitions?.length);
  console.log('studyResources.examRevisionNotes length:', studentPayload.studyResources?.examRevisionNotes?.length);
  console.log('quizQuestions for students (no answers):', studentPayload.quizQuestions?.length);
  console.log('fullNotesMarkdown visible:', studentPayload.fullNotesMarkdown?.length);

  await mongoose.disconnect();
}

testApiMapping().catch(console.error);
