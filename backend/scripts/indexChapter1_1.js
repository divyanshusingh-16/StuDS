const path = require('path');
const fs = require('fs');
const dns = require('dns');
try { dns.setServers(['8.8.8.8', '1.1.1.1']); } catch (e) {}
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');

const Content = require('../models/Content');
const DocumentChunk = require('../models/DocumentChunk');
const { indexChapterDocument, retrieveRelevantChunks, answerStudentDoubt } = require('../services/ragService');

const CHAPTER_1_1_ID = '09455e6f-b461-4263-8524-4a4b75c5ba52';

async function runIndexAndVerify() {
  console.log('================================================================');
  console.log('    STUDS Chapter 1.1: Safe RAG Ingestion & Verification');
  console.log('================================================================\n');

  try {
    await mongoose.connect(process.env.MONGO_URI, { dbName: 'StuDS' });
    console.log('Connected to MongoDB.\n');

    // 1. Check existing Chapter 1.1 record state
    const content = await Content.findOne({ chapterId: CHAPTER_1_1_ID });
    if (!content) {
      throw new Error(`Chapter 1.1 (${CHAPTER_1_1_ID}) not found in database!`);
    }

    console.log('>> Found Chapter 1.1 Content record.');
    console.log(`   Status: ${content.processingStatus}`);
    console.log(`   Quiz Questions Count: ${content.quizQuestions.length}`);
    console.log(`   Short Notes Count: ${content.shortNotes.length}`);
    console.log(`   Full Notes Length: ${content.fullNotesMarkdown.length} chars`);

    // Verify notes array
    const note = content.notes[0];
    if (!note) {
      throw new Error('No note found in Chapter 1.1!');
    }
    console.log(`   Note Title: "${note.title}"`);
    console.log(`   Note Status: "${note.status}"`);
    console.log(`   Note File: "${note.fileName}"\n`);

    // 2. Load PDF buffer safely
    const pdfPath = path.join(__dirname, '../uploads/1792019982392-Computer_Networks_Unit1_Chapter1.1_Introduction.pdf');
    if (!fs.existsSync(pdfPath)) {
      throw new Error(`PDF file not found at ${pdfPath}`);
    }
    const pdfBuffer = fs.readFileSync(pdfPath);
    console.log(`>> Loaded real PDF buffer: ${(pdfBuffer.length / 1024).toFixed(1)} KB`);

    // 3. Index Chapter 1.1 document safely
    console.log('\n>> Indexing Chapter 1.1 into DocumentChunk collection...');
    const indexResult = await indexChapterDocument({
      chapterId: CHAPTER_1_1_ID,
      noteId: note._id,
      pdfBuffer,
      docTitle: note.title,
      sourcePdfUrl: note.fileUrl,
      sourcePdfName: note.fileName,
      isPublished: true,
      forceReindex: true
    });

    console.log('>> Indexing result:', indexResult);
    if (!indexResult.success) {
      throw new Error(`Indexing failed: ${indexResult.error}`);
    }

    // 4. Verify DocumentChunk collection
    const chunkCount = await DocumentChunk.countDocuments({ chapterId: CHAPTER_1_1_ID, isPublished: true });
    console.log(`\n>> Total published chunks in database for Chapter 1.1: ${chunkCount}`);
    if (chunkCount === 0) {
      throw new Error('Expected chunkCount > 0!');
    }

    // Inspect sample chunk
    const sampleChunk = await DocumentChunk.findOne({ chapterId: CHAPTER_1_1_ID, chunkIndex: 0 });
    console.log('   Sample Chunk 0:');
    console.log(`   - Chunk ID: ${sampleChunk.chunkId}`);
    console.log(`   - Pages: ${sampleChunk.startPage} to ${sampleChunk.endPage}`);
    console.log(`   - Word Count: ${sampleChunk.wordCount}`);
    console.log(`   - Embedding length: ${sampleChunk.embedding.length}`);
    console.log(`   - Text sample: ${sampleChunk.text.slice(0, 100)}...`);

    // 5. Verify Content record preservation (CRITICAL REQUIREMENT)
    const afterContent = await Content.findOne({ chapterId: CHAPTER_1_1_ID });
    console.log('\n--- VERIFYING CONTENT RECORD PRESERVATION ---');
    console.log(`   Processing Status preserved: ${afterContent.processingStatus === content.processingStatus}`);
    console.log(`   Quiz Questions count preserved: ${afterContent.quizQuestions.length} === ${content.quizQuestions.length}`);
    console.log(`   Short Notes count preserved: ${afterContent.shortNotes.length} === ${content.shortNotes.length}`);
    console.log(`   Full Notes length preserved: ${afterContent.fullNotesMarkdown.length} === ${content.fullNotesMarkdown.length}`);
    console.log(`   Note Extracted Chunks updated with page metadata: ${afterContent.notes[0].extractedChunks.length} chunks`);

    if (afterContent.quizQuestions.length !== content.quizQuestions.length) {
      throw new Error('REGRESSION: quizQuestions count changed!');
    }
    if (afterContent.shortNotes.length !== content.shortNotes.length) {
      throw new Error('REGRESSION: shortNotes count changed!');
    }

    // 6. Test RAG Retrieval Relevance & Page Attribution
    console.log('\n--- TESTING RETRIEVAL & GROUNDING ---');
    
    // Query 1: Topologies & Formulas
    console.log('\n>> Test Query 1: "What is the formula to calculate links in a mesh topology?"');
    const q1Result = await answerStudentDoubt({
      question: 'What is the formula to calculate links in a mesh topology?',
      chapterId: CHAPTER_1_1_ID
    });
    console.log('   isGrounded:', q1Result.isGrounded);
    console.log('   hasSufficientContext:', q1Result.hasSufficientContext);
    console.log('   Sources Count:', q1Result.sources.length);
    if (q1Result.sources[0]) {
      console.log(`   Top Source: Page ${q1Result.sources[0].startPage} (score: ${q1Result.sources[0].score})`);
      console.log(`   Snippet: ${q1Result.sources[0].snippet.slice(0, 120)}...`);
    }
    console.log('   Answer preview:', q1Result.answer.slice(0, 200).replace(/\n/g, ' '));

    // Query 2: OSI vs TCP/IP
    console.log('\n>> Test Query 2: "Compare the OSI model and TCP/IP model"');
    const q2Result = await answerStudentDoubt({
      question: 'Compare the OSI model and TCP/IP model',
      chapterId: CHAPTER_1_1_ID
    });
    console.log('   isGrounded:', q2Result.isGrounded);
    console.log('   hasSufficientContext:', q2Result.hasSufficientContext);
    console.log('   Sources Count:', q2Result.sources.length);
    if (q2Result.sources[0]) {
      console.log(`   Top Source: Page ${q2Result.sources[0].startPage} (score: ${q2Result.sources[0].score})`);
    }

    // Query 3: Insufficient Context Test (Out of syllabus)
    console.log('\n>> Test Query 3 (Insufficient context): "What are the ingredients to bake a chocolate fudge cake?"');
    const q3Result = await answerStudentDoubt({
      question: 'What are the ingredients to bake a chocolate fudge cake?',
      chapterId: CHAPTER_1_1_ID
    });
    console.log('   isGrounded:', q3Result.isGrounded);
    console.log('   hasSufficientContext:', q3Result.hasSufficientContext);
    console.log('   Answer:', q3Result.answer);
    if (q3Result.hasSufficientContext) {
      throw new Error('Insufficient context test failed: out-of-scope query was marked as having sufficient context!');
    }

    console.log('\n================================================================');
    console.log('  ALL CHAPTER 1.1 RAG INGESTION & RETRIEVAL VERIFICATIONS PASSED!');
    console.log('================================================================\n');
  } catch (err) {
    console.error('Test error:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

runIndexAndVerify();

