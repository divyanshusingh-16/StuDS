require('dotenv').config();
const mongoose = require('mongoose');

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  const Content = require('../models/Content');
  const c = await Content.findOne({ chapterId: '09455e6f-b461-4263-8524-4a4b75c5ba52' });
  const note = c.notes.id('6ad00f09ecf42d1ff5e31c81');
  const raw = note.rawExtractedText;

  const lines = raw.split(/\r?\n/);
  console.log('Total lines:', lines.length);

  // Identify all section headers
  const headingRegex = /^(\d+(\.\d+)*\s+[A-Z].*|^Chapter Overview|^Learning Objectives|^Summary|^Review Questions|^Important Questions|^Quick Revision Summary)/;
  const headings = [];
  lines.forEach((l, idx) => {
    const trimmed = l.trim();
    if (headingRegex.test(trimmed)) {
      headings.push({ line: idx + 1, heading: trimmed });
    }
  });

  console.log('\n--- DETECTED HEADINGS (' + headings.length + ') ---');
  headings.forEach(h => console.log('Line ' + h.line + ': ' + h.heading));

  // Find diagrams or box drawings
  console.log('\n--- DETECTED BOX DRAWINGS / DIAGRAMS ---');
  let inBox = false;
  let boxStart = 0;
  let boxLines = [];
  lines.forEach((l, idx) => {
    if (l.includes('+---') || l.includes('|') && (l.includes('WAN') || l.includes('MAN') || l.includes('LAN') || l.includes('Host') || l.includes('Switch') || l.includes('Router') || l.includes('Topology') || l.includes('Layer'))) {
      if (!inBox) {
        inBox = true;
        boxStart = idx + 1;
        boxLines = [];
      }
      boxLines.push(l);
    } else if (inBox && !l.includes('|') && !l.includes('+') && !l.includes('-')) {
      inBox = false;
      if (boxLines.length > 2) {
        console.log('\nDiagram around line ' + boxStart + ' (' + boxLines.length + ' lines):');
        console.log(boxLines.slice(0, 10).join('\n'));
        if (boxLines.length > 10) console.log('... (' + (boxLines.length - 10) + ' more lines)');
      }
      boxLines = [];
    }
  });

  await mongoose.disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });
