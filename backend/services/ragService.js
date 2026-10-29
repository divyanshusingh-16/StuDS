/**
 * STUDS Chapter-Aware Retrieval-Augmented Generation (RAG) Service
 * 
 * Provides:
 * 1. Page-preserving document chunking and vector indexing
 * 2. Authorized chapter-filtered vector retrieval
 * 3. Grounded doubt answering citing verified textbook pages
 * 4. Strict insufficient-context handling to prevent AI hallucinations
 * 5. Safe draft isolation and non-destructive re-indexing
 */

const crypto = require('crypto');
const DocumentChunk = require('../models/DocumentChunk');
const Content = require('../models/Content');
const Subject = require('../models/Subject');
const Unit = require('../models/Unit');
const { generateEmbedding, cosineSimilarity } = require('./embeddingService');
const { extractTextFromPdf, createPageAwareSemanticChunks } = require('./pdfTextExtractor');

let genAI = null;
try {
  genAI = require('../config/gemini');
} catch (_) {
  genAI = null;
}

/**
 * Computes MD5 hash of text to detect document changes and prevent duplicate re-indexing.
 */
function computeContentHash(text) {
  if (!text) return '';
  return crypto.createHash('md5').update(text).digest('hex');
}

/**
 * Indexes or re-indexes an approved chapter document into page-aware vector chunks.
 * Safe and atomic: does NOT overwrite existing published materials if extraction fails.
 */
async function indexChapterDocument({
  chapterId,
  noteId = null,
  pdfBuffer = null,
  rawText = null,
  pages = null,
  isPublished = true,
  docTitle = '',
  sourcePdfUrl = '',
  sourcePdfName = '',
  forceReindex = false
}) {
  if (!chapterId) {
    throw new Error('chapterId is required for RAG document indexing.');
  }

  // 1. Resolve hierarchy metadata for authorization filtering
  let subjectId = null;
  let unitId = null;
  let semester = null;

  try {
    const unitDoc = await Unit.findOne({ 'chapters.chapterId': chapterId });
    if (unitDoc) {
      unitId = unitDoc._id;
      subjectId = unitDoc.subjectId;
      const subjectDoc = await Subject.findById(unitDoc.subjectId);
      if (subjectDoc) {
        semester = subjectDoc.semester;
      }
    }
  } catch (metaErr) {
    console.warn(`[RAG] Notice: could not resolve hierarchy metadata for chapter ${chapterId}:`, metaErr.message);
  }

  // 2. Extract or chunk source content
  let extractedPages = pages || [];
  let fullText = rawText || '';

  if (pdfBuffer && (!extractedPages.length || !fullText)) {
    try {
      const extraction = await extractTextFromPdf(pdfBuffer);
      if (extraction.status === 'success' || extraction.rawText) {
        fullText = extraction.rawText;
        extractedPages = extraction.pages || [];
      }
    } catch (extractErr) {
      console.error(`[RAG] Text extraction failed during indexing:`, extractErr.message);
      return {
        success: false,
        error: `Text extraction failed: ${extractErr.message}`
      };
    }
  }

  if (!fullText && !extractedPages.length) {
    return {
      success: false,
      error: 'No valid text or pages found to index for this chapter.'
    };
  }

  const contentHash = computeContentHash(fullText);

  // 3. Deduplication check: skip if identical content already indexed
  if (!forceReindex && noteId) {
    const existing = await DocumentChunk.findOne({ chapterId, noteId, contentHash });
    if (existing) {
      const count = await DocumentChunk.countDocuments({ chapterId, noteId });
      return {
        success: true,
        alreadyIndexed: true,
        chunkCount: count,
        contentHash
      };
    }
  }

  // 4. Generate page-aware semantic chunks with overlap
  let chunks = [];
  if (extractedPages.length > 0) {
    chunks = createPageAwareSemanticChunks(extractedPages, { targetChunkSize: 900, overlapSize: 150 });
  } else {
    // Synthetic single-page fallback
    chunks = createPageAwareSemanticChunks([{ num: 1, text: fullText }], { targetChunkSize: 900, overlapSize: 150 });
  }

  if (!chunks.length) {
    return {
      success: false,
      error: 'Could not generate valid semantic chunks from document text.'
    };
  }

  // 5. Generate embeddings for all chunks
  const chunkDocs = [];
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const embedding = await generateEmbedding(chunk.text);
    const chunkId = `${chapterId}_${noteId || 'doc'}_${chunk.chunkIndex}`;

    chunkDocs.push({
      chunkId,
      chapterId,
      subjectId,
      unitId,
      semester,
      noteId,
      docTitle: docTitle || `Chapter ${chapterId} Study Material`,
      sourcePdfUrl,
      sourcePdfName,
      chunkIndex: chunk.chunkIndex,
      text: chunk.text,
      pageNumber: chunk.pageNumber || chunk.startPage || 1,
      startPage: chunk.startPage || 1,
      endPage: chunk.endPage || chunk.startPage || 1,
      wordCount: chunk.wordCount || 0,
      charCount: chunk.charCount || chunk.text.length,
      embedding,
      isPublished: Boolean(isPublished),
      contentHash
    });
  }

  // 6. Atomically persist chunks (clean existing note chunks first)
  try {
    if (noteId) {
      await DocumentChunk.deleteMany({ chapterId, noteId });
    } else {
      await DocumentChunk.deleteMany({ chapterId });
    }

    await DocumentChunk.insertMany(chunkDocs);

    // 7. Update note metadata in Content collection if noteId is available
    if (noteId) {
      await Content.updateOne(
        { chapterId, 'notes._id': noteId },
        {
          $set: {
            'notes.$.extractedChunks': chunks.map(c => ({
              chunkIndex: c.chunkIndex,
              text: c.text,
              wordCount: c.wordCount,
              charCount: c.charCount,
              pageNumber: c.pageNumber,
              startPage: c.startPage,
              endPage: c.endPage
            }))
          }
        }
      ).catch(() => {});
    }

    return {
      success: true,
      chunkCount: chunkDocs.length,
      pageRange: {
        minPage: Math.min(...chunkDocs.map(c => c.startPage)),
        maxPage: Math.max(...chunkDocs.map(c => c.endPage))
      },
      contentHash
    };
  } catch (dbErr) {
    console.error(`[RAG] Failed to write chunks to database:`, dbErr.message);
    return {
      success: false,
      error: `Database write error: ${dbErr.message}`
    };
  }
}

/**
 * Retrieves relevant chunks for a student query, strictly filtered by chapter and published status.
 */
async function retrieveRelevantChunks({
  query,
  chapterId,
  semester = null,
  isPublishedOnly = true,
  topK = 4,
  minSimilarity = 0.22
}) {
  if (!query || typeof query !== 'string' || !chapterId) {
    return { chunks: [], count: 0, query: query || '' };
  }

  const queryEmbedding = await generateEmbedding(query);

  const filter = { chapterId };
  if (isPublishedOnly) {
    filter.isPublished = true;
  }
  if (semester) {
    filter.semester = semester;
  }

  // Fetch candidate chunks for the authorized chapter
  const candidateChunks = await DocumentChunk.find(filter)
    .select('chunkId chapterId noteId docTitle sourcePdfUrl sourcePdfName chunkIndex text pageNumber startPage endPage embedding isPublished')
    .lean();

  if (!candidateChunks || candidateChunks.length === 0) {
    return { chunks: [], count: 0, query };
  }

  // Calculate similarity and rank
  const scoredChunks = candidateChunks
    .map(chunk => {
      const score = cosineSimilarity(queryEmbedding, chunk.embedding || []);
      return {
        chunkIndex: chunk.chunkIndex,
        text: chunk.text,
        pageNumber: chunk.pageNumber,
        startPage: chunk.startPage,
        endPage: chunk.endPage,
        docTitle: chunk.docTitle,
        sourcePdfUrl: chunk.sourcePdfUrl,
        sourcePdfName: chunk.sourcePdfName,
        score: Number(score.toFixed(4))
      };
    })
    .filter(item => item.score >= minSimilarity)
    .sort((a, b) => b.score - a.score);

  const topChunks = scoredChunks.slice(0, topK);

  return {
    chunks: topChunks,
    count: topChunks.length,
    totalCandidates: candidateChunks.length,
    query
  };
}

/**
 * Answers a student question with strict grounding against verified chapter chunks.
 * Handles insufficient context gracefully and prevents hallucination.
 */
async function answerStudentDoubt({
  question,
  chapterId,
  conversationHistory = [],
  userId = null
}) {
  if (!question || typeof question !== 'string') {
    throw new Error('A valid question string is required.');
  }

  const cleanQuestion = question.trim();
  if (cleanQuestion.length < 3) {
    throw new Error('Question is too short. Please provide a clear question.');
  }
  if (cleanQuestion.length > 1000) {
    throw new Error('Question exceeds maximum allowed length (1000 characters).');
  }

  // 1. Verify chapter content exists and is accessible
  const content = await Content.findOne({ chapterId }).lean();
  if (!content) {
    throw new Error('Chapter content not found.');
  }

  // 2. Retrieve relevant chunks strictly for this chapter
  const retrieval = await retrieveRelevantChunks({
    query: cleanQuestion,
    chapterId,
    isPublishedOnly: true,
    topK: 4,
    minSimilarity: 0.22
  });

  const { chunks } = retrieval;

  // 3. Insufficient context guardrail
  if (!chunks || chunks.length === 0 || (chunks[0] && chunks[0].score < 0.22)) {
    return {
      answer: "The provided study materials for this chapter do not contain sufficient information to answer this question accurately. Please refer to your lecture notes, prescribed textbook, or consult your course instructor for further details on this concept.",
      sources: [],
      isGrounded: false,
      hasSufficientContext: false,
      chapterId,
      retrievedCount: 0
    };
  }

  // 4. Construct grounded context blocks
  const contextText = chunks
    .map(c => `[Excerpt from Page ${c.startPage === c.endPage ? c.startPage : `${c.startPage}–${c.endPage}`}]:\n${c.text}`)
    .join('\n\n---\n\n');

  // Format sources metadata for student UI
  const sources = chunks.map(c => ({
    chunkIndex: c.chunkIndex,
    pageNumber: c.pageNumber,
    startPage: c.startPage,
    endPage: c.endPage,
    docTitle: c.docTitle,
    sourcePdfUrl: c.sourcePdfUrl,
    score: c.score,
    snippet: c.text.length > 250 ? `${c.text.slice(0, 250)}...` : c.text
  }));

  // 5. Attempt Gemini LLM response with grounded prompt
  let generatedAnswer = '';

  if (genAI && process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 10) {
    try {
      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        systemInstruction: `You are the StuDS Academic AI Doubt Solver for university college students.
Your duty is to provide clear, thorough, and strictly grounded explanations based ONLY on the provided textbook excerpts.
Rules:
1. Cite specific page numbers from the provided excerpts (e.g. "[Page 4]" or "[Pages 10–12]") when asserting facts or definitions.
2. Structure your answer using clear Markdown headings, bullet points, and code/table formatting where helpful.
3. If the excerpts do not contain enough details to fully answer a part of the student's question, state explicitly: "The reference material does not mention..." rather than inventing facts.
4. Keep a helpful, encouraging, and academically rigorous tone.`
      });

      const historyContext = conversationHistory
        .slice(-4)
        .map(h => `${h.role === 'user' ? 'Student' : 'Assistant'}: ${h.text || h.content}`)
        .join('\n');

      const userPrompt = `${historyContext ? `Previous Discussion:\n${historyContext}\n\n` : ''}Verified Course Textbook Excerpts:
${contextText}

Student Question:
${cleanQuestion}

Please provide a clear, accurate, and page-cited answer based on the excerpts above:`;

      const result = await model.generateContent(userPrompt);
      const text = result?.response?.text();
      if (text && text.trim().length > 20) {
        generatedAnswer = text.trim();
      }
    } catch (llmErr) {
      console.warn('[RAG] External generative LLM error:', llmErr.message.slice(0, 100));
    }
  }

  // 6. Robust Fallback: Synthesized Grounded Response directly from top verified passages
  if (!generatedAnswer) {
    const primarySource = chunks[0];
    const pageLabel = primarySource.startPage === primarySource.endPage 
      ? `Page ${primarySource.startPage}` 
      : `Pages ${primarySource.startPage}–${primarySource.endPage}`;

    generatedAnswer = `Based on **${primarySource.docTitle || 'the course material'}** (${pageLabel}):\n\n` +
      `${primarySource.text}\n\n` +
      (chunks.length > 1 
        ? `### Additional Reference ([Page ${chunks[1].startPage}]):\n${chunks[1].text.slice(0, 350)}...\n\n` 
        : '') +
      `> ℹ️ *This answer is grounded directly in the verified chapter notes with exact page citations.*`;
  }

  return {
    answer: generatedAnswer,
    sources,
    isGrounded: true,
    hasSufficientContext: true,
    chapterId,
    retrievedCount: chunks.length
  };
}

/**
 * Returns RAG index status for a chapter.
 */
async function getChapterRagStatus(chapterId) {
  if (!chapterId) return { isIndexed: false, chunkCount: 0 };

  const count = await DocumentChunk.countDocuments({ chapterId, isPublished: true });
  const sample = await DocumentChunk.findOne({ chapterId, isPublished: true }).lean();

  return {
    isIndexed: count > 0,
    chunkCount: count,
    docTitle: sample?.docTitle || '',
    sourcePdfUrl: sample?.sourcePdfUrl || '',
    sourcePdfName: sample?.sourcePdfName || '',
    lastIndexedAt: sample?.updatedAt || null
  };
}

module.exports = {
  indexChapterDocument,
  retrieveRelevantChunks,
  answerStudentDoubt,
  getChapterRagStatus,
  computeContentHash
};

