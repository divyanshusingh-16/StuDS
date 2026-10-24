const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

function normalize(str) {
  if (!str) return '';
  return str
    .replace(/[\u2010\u2011\u2012\u2013\u2014\u2015\u2212]/g, '-')
    .replace(/[^a-zA-Z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function scoreMatch(targetStr, query, tokens) {
  if (!targetStr) return 0;
  const targetNorm = normalize(targetStr);
  if (!targetNorm) return 0;
  let score = 0;

  if (targetNorm === query) score += 1000;
  else if (targetNorm.startsWith(query)) score += 600;
  else if (targetNorm.includes(query)) score += 400;

  const targetWords = targetNorm.split(' ');
  let allTokensMatched = true;

  for (const token of tokens) {
    const tokenStem = token.replace(/s$/, '');
    let tokenMatched = false;
    for (const tw of targetWords) {
      const twStem = tw.replace(/s$/, '');
      if (tw === token) {
        score += 300;
        tokenMatched = true;
        break;
      } else if (twStem.length > 2 && twStem === tokenStem) {
        score += 280;
        tokenMatched = true;
        break;
      } else if (tw.startsWith(token)) {
        score += 200;
        tokenMatched = true;
        break;
      } else if (tw.includes(token)) {
        score += 80;
        tokenMatched = true;
        break;
      }
    }
    if (!tokenMatched) allTokensMatched = false;
  }

  if (tokens.length > 1 && allTokensMatched) {
    score += 400;
  }

  return score;
}

async function testSearch(q, Subject, Unit, Content) {
  const normQ = normalize(q);
  const tokens = normQ.split(' ').filter(Boolean);
  console.log(`\n=== Query: "${q}" (tokens: [${tokens.join(', ')}]) ===`);

  const subjects = await Subject.find({}).lean();
  const units = await Unit.find({}).lean();
  const contents = await Content.find({}).lean();

  const results = [];
  const seen = new Set();

  // 1. Search Subjects
  for (const sub of subjects) {
    if (/^CONT_/i.test(sub.subjectCode) || /^CONT_/i.test(sub.subjectName)) continue;
    const codeScore = scoreMatch(sub.subjectCode, normQ, tokens) * 1.6;
    const nameScore = scoreMatch(sub.subjectName, normQ, tokens) > 0
      ? scoreMatch(sub.subjectName, normQ, tokens) + 60
      : 0;
    const score = Math.max(codeScore, nameScore);
    if (score >= 80) {
      const key = `sub_${sub._id}`;
      if (!seen.has(key)) {
        seen.add(key);
        results.push({
          type: 'subject',
          title: sub.subjectName,
          code: sub.subjectCode,
          parentContext: `Semester ${sub.semester} • ${sub.department || 'Course'}`,
          score: Math.round(score),
          semester: sub.semester,
          subjectId: sub._id
        });
      }
    }
  }

  // Map subjects for unit/chapter context
  const subMap = new Map();
  subjects.forEach(s => subMap.set(String(s._id), s));

  // 2. Search Units & Chapters
  for (const u of units) {
    const parentSub = subMap.get(String(u.subjectId));
    if (!parentSub) continue;

    const unitScore = scoreMatch(u.unitName, normQ, tokens);
    if (unitScore >= 80) {
      const key = `unit_${u._id}`;
      if (!seen.has(key)) {
        seen.add(key);
        results.push({
          type: 'unit',
          title: `Unit ${u.unitNumber}: ${u.unitName}`,
          code: parentSub.subjectCode,
          parentContext: `${parentSub.subjectName} • Unit ${u.unitNumber}`,
          score: Math.round(unitScore * 0.95),
          semester: parentSub.semester,
          subjectId: parentSub._id,
          unitId: u._id
        });
      }
    }

    for (const ch of (u.chapters || [])) {
      const cleanChTitle = (ch.chapterName || '').replace(/^(\d+(\.\d+)*\s*[-–—:]*\s*)/, '');
      const chScore = Math.max(scoreMatch(ch.chapterName, normQ, tokens), scoreMatch(cleanChTitle, normQ, tokens));
      // Check combined match with unit/subject (e.g. "physical layer introduction" or "network intro")
      const contextNorm = normalize(`${parentSub.subjectName} ${u.unitName} ${ch.chapterName}`);
      let contextBonus = 0;
      if (tokens.length > 1) {
        const matchesAll = tokens.every(t => contextNorm.includes(t));
        if (matchesAll) contextBonus = 200;
      }

      const totalScore = Math.max(chScore, (chScore > 0 ? chScore + contextBonus : 0));
      if (totalScore >= 80) {
        const key = `ch_${ch.chapterId}`;
        if (!seen.has(key)) {
          seen.add(key);
          results.push({
            type: 'chapter',
            title: ch.chapterName,
            code: parentSub.subjectCode,
            parentContext: `${parentSub.subjectName} • Unit ${u.unitNumber} ${u.unitName}`,
            score: Math.round(totalScore),
            semester: parentSub.semester,
            subjectId: parentSub._id,
            unitId: u._id,
            chapterId: ch.chapterId
          });
        }
      }
    }
  }

  // 3. Search Published Content & Notes
  for (const content of contents) {
    // Check published notes
    const publishedNotes = (content.notes || []).filter(n => n.status === 'published');
    for (const note of publishedNotes) {
      const noteScore = scoreMatch(note.title, normQ, tokens);
      if (noteScore >= 80) {
        // Find chapter
        for (const u of units) {
          const ch = (u.chapters || []).find(c => c.chapterId === content.chapterId);
          if (ch) {
            const parentSub = subMap.get(String(u.subjectId));
            const key = `note_${note._id || note.title}`;
            if (!seen.has(key)) {
              seen.add(key);
              results.push({
                type: 'resource',
                title: note.title,
                code: parentSub?.subjectCode || null,
                parentContext: `${ch.chapterName} • Notes`,
                score: Math.round(noteScore * 0.85),
                semester: parentSub?.semester || 5,
                subjectId: parentSub?._id,
                unitId: u._id,
                chapterId: ch.chapterId
              });
            }
          }
        }
      }
    }
  }

  results.sort((a, b) => b.score - a.score);
  results.slice(0, 5).forEach((r, idx) => {
    console.log(`  #${idx + 1} [${r.type}] ${r.code ? r.code + ' — ' : ''}${r.title} (score: ${r.score})`);
    console.log(`      Context: ${r.parentContext}`);
  });
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI, { dbName: process.env.MONGO_DB_NAME || 'StuDS' });
  const Subject = mongoose.model('Subject', new mongoose.Schema({}, { strict: false }));
  const Unit = mongoose.model('Unit', new mongoose.Schema({}, { strict: false }));
  const Content = mongoose.model('Content', new mongoose.Schema({}, { strict: false }));

  const testQueries = [
    'co',
    'comp',
    'competitive',
    'competitive coding',
    'intro',
    'introduction',
    'network',
    'CS503',
    'CS504',
    'physical layer'
  ];

  for (const q of testQueries) {
    await testSearch(q, Subject, Unit, Content);
  }

  await mongoose.disconnect();
}

run().catch(console.error);
