/**
 * STUDS PDF Text Extraction & Validation Service
 * 
 * Implements Stage 2 (Text extraction & optional OCR)
 * and Stage 3 (Source-text validation) of the STUDS pipeline.
 * Also splits text into structured semantic chunks for future RAG / embeddings.
 */

let pdfParseModule;
try {
  pdfParseModule = require('pdf-parse');
} catch (_) {
  pdfParseModule = null;
}

let genAI = null;
try {
  genAI = require('../config/gemini');
} catch (_) {
  genAI = null;
}

/**
 * Extracts raw text from a PDF buffer using pdf-parse.
 */
async function extractWithPdfParse(pdfBuffer) {
  if (!pdfParseModule) {
    throw new Error('pdf-parse is not installed on the server.');
  }

  // Handle v1 function export
  if (typeof pdfParseModule === 'function') {
    const res = await pdfParseModule(pdfBuffer);
    return {
      text: (res.text || '').trim(),
      pageCount: res.numpages || 1
    };
  }

  // Handle v2 class export
  if (pdfParseModule.PDFParse) {
    const parser = new pdfParseModule.PDFParse({ data: pdfBuffer });
    const res = await parser.getText();
    const pageCount = (await parser.getInfo())?.numPages || 1;
    await parser.destroy();
    return {
      text: (res?.text || '').trim(),
      pageCount
    };
  }

  // Handle default export
  if (pdfParseModule.default && typeof pdfParseModule.default === 'function') {
    const res = await pdfParseModule.default(pdfBuffer);
    return {
      text: (res.text || '').trim(),
      pageCount: res.numpages || 1
    };
  }

  throw new Error('Unrecognized pdf-parse export format.');
}

/**
 * Multimodal OCR fallback using Google Gemini if PDF has no extractable text layer.
 */
async function extractWithGeminiOcr(pdfBuffer) {
  if (!genAI || !process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.length < 10) {
    return null;
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const base64Data = pdfBuffer.toString('base64');

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: 'application/pdf',
          data: base64Data
        }
      },
      'Extract all readable text, section headings, and academic content from this document verbatim without omitting formulas, tables, or technical details.'
    ]);

    const text = result?.response?.text();
    return text ? text.trim() : null;
  } catch (err) {
    console.warn('[PDFExtractor] Gemini OCR fallback failed:', err.message);
    return null;
  }
}

/**
 * Stage 3: Source-Text Validation
 * Validates whether the extracted text contains meaningful academic content
 * before allowing it into the Gemini generation pipeline.
 */
function validateSourceText(text) {
  if (!text || typeof text !== 'string') {
    return {
      isValid: false,
      reason: 'Extracted text is empty or missing.'
    };
  }

  const cleanText = text.trim();
  if (cleanText.length < 150) {
    return {
      isValid: false,
      reason: `Extracted text is too short (${cleanText.length} characters). A meaningful academic chapter must contain sufficient content.`
    };
  }

  // Check printable character ratio to reject corrupted / binary output
  const printableMatches = cleanText.match(/[\x20-\x7E\t\n\r\u00A0-\uFFFF]/g) || [];
  const printableRatio = printableMatches.length / cleanText.length;
  if (printableRatio < 0.75) {
    return {
      isValid: false,
      reason: 'Extracted text contains excessive binary or unprintable characters, suggesting file corruption.'
    };
  }

  // Check recognizable word count (words with 2+ alphanumeric chars)
  const words = cleanText.match(/[a-zA-Z0-9]{2,}/g) || [];
  if (words.length < 35) {
    return {
      isValid: false,
      reason: `Extracted text has only ${words.length} recognizable words. Insufficient content for generating chapter study resources.`
    };
  }

  return {
    isValid: true,
    charCount: cleanText.length,
    wordCount: words.length
  };
}

/**
 * Splits extracted text into structured semantic chunks for future RAG & embeddings.
 * Chunks are sized between ~600 and 1200 characters, respecting paragraph boundaries.
 */
function createSemanticChunks(text, targetChunkSize = 900) {
  if (!text || typeof text !== 'string') return [];

  const paragraphs = text.split(/\n\s*\n/);
  const chunks = [];
  let currentChunk = '';
  let chunkIndex = 0;

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;

    if (currentChunk.length + trimmed.length > targetChunkSize && currentChunk.length > 200) {
      const words = (currentChunk.match(/\b\w+\b/g) || []).length;
      chunks.push({
        chunkIndex: chunkIndex++,
        text: currentChunk.trim(),
        wordCount: words
      });
      currentChunk = trimmed;
    } else {
      currentChunk = currentChunk ? `${currentChunk}\n\n${trimmed}` : trimmed;
    }
  }

  if (currentChunk.trim()) {
    const words = (currentChunk.match(/\b\w+\b/g) || []).length;
    chunks.push({
      chunkIndex: chunkIndex++,
      text: currentChunk.trim(),
      wordCount: words
    });
  }

  return chunks;
}

/**
 * Primary Extraction Function
 * Extracts text, runs OCR if needed, validates, and generates semantic chunks.
 */
async function extractTextFromPdf(pdfBuffer) {
  let rawText = '';
  let pageCount = 1;
  let usedOcr = false;

  try {
    const res = await extractWithPdfParse(pdfBuffer);
    rawText = res.text;
    pageCount = res.pageCount;
  } catch (parseErr) {
    console.warn('[PDFExtractor] pdf-parse direct extraction error:', parseErr.message);
  }

  // If text is minimal or missing, attempt OCR for scanned PDFs
  if (!rawText || rawText.trim().length < 100) {
    const ocrText = await extractWithGeminiOcr(pdfBuffer);
    if (ocrText && ocrText.length >= 100) {
      rawText = ocrText;
      usedOcr = true;
    }
  }

  if (!rawText || rawText.trim().length < 50) {
    return {
      status: 'no_text',
      rawText: '',
      pageCount,
      charCount: 0,
      wordCount: 0,
      chunks: [],
      usedOcr,
      validation: {
        isValid: false,
        reason: 'No extractable text found in this PDF. It appears to be a scanned image without an embedded digital text layer.'
      }
    };
  }

  const validation = validateSourceText(rawText);
  const words = (rawText.match(/\b\w+\b/g) || []).length;
  const chunks = createSemanticChunks(rawText);

  return {
    status: validation.isValid ? 'success' : 'invalid_text',
    rawText,
    pageCount,
    charCount: rawText.length,
    wordCount: words,
    chunks,
    usedOcr,
    validation
  };
}

module.exports = {
  extractTextFromPdf,
  validateSourceText,
  createSemanticChunks,
  extractWithPdfParse
};
