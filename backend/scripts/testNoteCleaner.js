const dns = require('dns');
try { dns.setServers(['8.8.8.8', '1.1.1.1']); } catch (e) {}
require('dotenv').config();
const mongoose = require('mongoose');
const { cleanExtractedNotes } = require('../services/noteCleanerService');

async function testCleaner() {
  await mongoose.connect(process.env.MONGO_URI);
  const Content = require('../models/Content');
  const c = await Content.findOne({ chapterId: '09455e6f-b461-4263-8524-4a4b75c5ba52' });
  const note = c.notes.id('6ad00f09ecf42d1ff5e31c81');
  const rawText = note.rawExtractedText;

  console.log('--- Testing Note Cleaner on Raw Text (' + rawText.length + ' chars) ---');
  const result = cleanExtractedNotes(rawText);

  console.log('\nCleaning Statistics:');
  console.log('Original Length:', result.stats.originalLength);
  console.log('Cleaned Length:', result.stats.cleanedLength);
  console.log('Words Count:', result.stats.wordsCount);
  console.log('Tables Count:', result.stats.tablesCount);
  console.log('Diagrams Count:', result.stats.diagramsCount);
  console.log('Sections Found:', result.stats.sectionsFound);

  console.log('\nSyllabus Verification:');
  console.log('Covered Topics:', result.syllabusVerification.coveredCount + '/' + result.syllabusVerification.totalTopics + ' (' + result.syllabusVerification.coveragePercent + '%)');
  result.syllabusVerification.topicResults.forEach(t => {
    console.log((t.isCovered ? '  ✅ ' : '  ❌ ') + t.title + (t.isCovered ? ' [matched: ' + t.matchedKeyword + ']' : ''));
  });

  console.log('\n--- First 1500 chars of Cleaned Markdown ---');
  console.log(result.cleanedMarkdown.slice(0, 1500));

  console.log('\n--- Sample of Topology Table & Diagrams ---');
  const topoIdx = result.cleanedMarkdown.indexOf('### 4.7 Comparison of Network Topologies');
  if (topoIdx !== -1) {
    console.log(result.cleanedMarkdown.slice(topoIdx, topoIdx + 1200));
  }

  await mongoose.disconnect();
}

testCleaner().catch(err => {
  console.error(err);
  process.exit(1);
});
