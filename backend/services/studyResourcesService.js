/**
 * STUDS Source-Grounded Learning Resource Generation Service
 * 
 * Implements Stage 4 (Missing-resource detection),
 * Stage 5 (Gemini generation strictly grounded in source text),
 * and Stage 6 (Structured-output validation & shortfall reporting).
 * 
 * Critical Rules Enforced:
 * 1. Strict source grounding: Never invent questions or facts from general model knowledge.
 * 2. Shortfall reporting: If the PDF text supports fewer than 20 valid questions,
 *    report the shortfall instead of padding with fake or hallucinated questions.
 * 3. Never overwrite approved content: Generate only missing or explicitly selected resources.
 * 4. Separate draft/staging persistence: Retain published resources on error.
 */

const genAI = require('../config/gemini');

const SUPPORTED_GEMINI_MODELS = [
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-pro'
];

/**
 * Detects which resources are currently missing for a chapter.
 */
function detectMissingResources(content) {
  const published = content?.studyResources || {};
  const draft = content?.draftStudyResources || {};

  const hasFullNotes = Boolean(content?.fullNotesMarkdown && content.fullNotesMarkdown.trim().length > 100);
  const hasShortNotes = Boolean(
    (published.shortNotes && published.shortNotes.length > 0) ||
    (draft.shortNotes && draft.shortNotes.length > 0) ||
    (content?.shortNotes && content.shortNotes.length > 0)
  );
  const hasTopics = Boolean(
    (published.importantTopics && published.importantTopics.length > 0) ||
    (draft.importantTopics && draft.importantTopics.length > 0)
  );
  const hasDefinitions = Boolean(
    (published.keyDefinitions && published.keyDefinitions.length > 0) ||
    (draft.keyDefinitions && draft.keyDefinitions.length > 0)
  );
  const hasRevision = Boolean(
    (published.examRevisionNotes && published.examRevisionNotes.trim().length > 50) ||
    (draft.examRevisionNotes && draft.examRevisionNotes.trim().length > 50)
  );
  const hasQuiz = Boolean(
    (content?.quizQuestions && content.quizQuestions.length >= 10) ||
    (content?.draftQuizQuestions && content.draftQuizQuestions.length >= 10)
  );

  return {
    fullNotes: !hasFullNotes,
    shortNotes: !hasShortNotes,
    importantTopics: !hasTopics,
    keyDefinitions: !hasDefinitions,
    examRevisionNotes: !hasRevision,
    quizQuestions: !hasQuiz,
    allComplete: hasFullNotes && hasShortNotes && hasTopics && hasDefinitions && hasRevision && hasQuiz
  };
}

/**
 * Validates and sanitizes multiple-choice questions.
 * Enforces:
 * - Exactly 4 distinct options.
 * - Correct answer must match one of the options verbatim.
 * - Difficulty must be 'easy', 'medium', or 'hard'.
 * - Deduplicates questions by normalized text.
 * - Associates with chapterId.
 */
function validateQuizQuestions(rawQuestions, chapterId = '') {
  if (!Array.isArray(rawQuestions)) return { validQuestions: [], discardedCount: 0 };

  const seenQuestions = new Set();
  const validQuestions = [];
  let discardedCount = 0;

  for (const q of rawQuestions) {
    if (!q || typeof q !== 'object') {
      discardedCount++;
      continue;
    }

    const questionText = String(q.question || '').trim();
    if (!questionText || questionText.length < 10) {
      discardedCount++;
      continue;
    }

    // Deduplicate
    const normKey = questionText.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (seenQuestions.has(normKey)) {
      discardedCount++;
      continue;
    }
    seenQuestions.add(normKey);

    // Validate options
    const rawOptions = Array.isArray(q.options) ? q.options : [];
    const cleanOptions = rawOptions
      .map(opt => String(opt || '').trim())
      .filter(opt => opt.length > 0);

    if (cleanOptions.length !== 4) {
      discardedCount++;
      continue;
    }

    // Check for duplicate options within the same question
    const uniqueOptions = new Set(cleanOptions.map(o => o.toLowerCase()));
    if (uniqueOptions.size !== 4) {
      discardedCount++;
      continue;
    }

    // Validate correct answer
    const correctAnswer = String(q.correctAnswer || '').trim();
    const matchedOption = cleanOptions.find(o => o.toLowerCase() === correctAnswer.toLowerCase());
    if (!matchedOption) {
      discardedCount++;
      continue;
    }

    // Validate difficulty
    const rawDiff = String(q.difficulty || 'medium').toLowerCase();
    const difficulty = ['easy', 'medium', 'hard'].includes(rawDiff) ? rawDiff : 'medium';

    validQuestions.push({
      question: questionText,
      options: cleanOptions,
      correctAnswer: matchedOption,
      explanation: String(q.explanation || `The correct answer is "${matchedOption}".`).trim(),
      difficulty,
      chapterId: chapterId || undefined,
      status: 'draft'
    });
  }

  return { validQuestions, discardedCount };
}

/**
 * Validates key definitions.
 */
function validateKeyDefinitions(rawDefinitions) {
  if (!Array.isArray(rawDefinitions)) return [];

  const seenTerms = new Set();
  const cleanDefinitions = [];

  for (const item of rawDefinitions) {
    if (!item || typeof item !== 'object') continue;
    const term = String(item.term || '').trim();
    const definition = String(item.definition || '').trim();

    if (!term || !definition || term.length < 2 || definition.length < 10) continue;

    const normTerm = term.toLowerCase();
    if (seenTerms.has(normTerm)) continue;
    seenTerms.add(normTerm);

    cleanDefinitions.push({ term, definition });
  }

  return cleanDefinitions;
}

/**
 * Builds the strictly source-grounded Gemini prompt.
 */
function buildGenerationPrompt(extractedSourceText, context = {}, targets = []) {
  const { chapterTitle = 'Chapter', subjectName = 'Academic Course', unitName = 'Unit' } = context;
  const targetAll = targets.length === 0;

  const targetList = [];
  if (targetAll || targets.includes('fullNotes')) targetList.push('1. fullNotesMarkdown: Comprehensive, readable textbook notes in Markdown with hierarchical headers (#, ##, ###), bold concepts, and structured paragraphs.');
  if (targetAll || targets.includes('shortNotes')) targetList.push('2. shortNotes: Array of 12-16 high-yield, concise bullet points.');
  if (targetAll || targets.includes('importantTopics')) targetList.push('3. importantTopics: Array of 8-12 high-weightage examination topics identified in the text.');
  if (targetAll || targets.includes('keyDefinitions')) targetList.push('4. keyDefinitions: Array of objects [{ "term": "...", "definition": "..." }].');
  if (targetAll || targets.includes('examRevisionNotes')) targetList.push('5. examRevisionNotes: Structured Markdown revision guide with key comparisons, formulas, and high-yield review tables.');
  if (targetAll || targets.includes('quizQuestions')) targetList.push('6. quizQuestions: Array of EXACTLY 20 multiple-choice questions (or as many valid questions as the text can strictly support, up to 20). Each MCQ MUST have:\n   - "question": clear question text\n   - "options": array of exactly 4 distinct options\n   - "correctAnswer": exact matching string from options\n   - "explanation": clear explanation grounded in the text\n   - "difficulty": "easy" | "medium" | "hard"');

  return `You are a distinguished university professor and academic curriculum author.
Analyze the following authentic textbook notes extracted from the uploaded chapter PDF:

---
SUBJECT: ${subjectName}
UNIT: ${unitName}
CHAPTER: ${chapterTitle}
---
SOURCE TEXT (Length: ${extractedSourceText.length} characters):
${extractedSourceText.slice(0, 40000)}
---

CRITICAL SOURCE-GROUNDING REQUIREMENTS:
- You must base ALL output STRICTLY and EXCLUSIVELY on the provided source text above.
- Do NOT introduce outside knowledge, unrelated textbook trivia, or general model assumptions not supported by the document.
- If the source text is short or does not contain enough unique factual material to sustain 20 valid questions without repetition or inventing ungrounded facts, GENERATE ONLY THE VALID QUESTIONS SUPPORTED BY THE TEXT, and explicitly state the shortfall in "shortfallReason".
- If any section of the text is ambiguous, incomplete, or damaged, state the limitation in "sourceLimitations".

Generate a valid JSON object matching this schema:
{
  ${targetAll || targets.includes('fullNotes') ? '"fullNotesMarkdown": "# Complete formatted markdown notes...",' : ''}
  ${targetAll || targets.includes('shortNotes') ? '"shortNotes": ["Takeaway 1", "Takeaway 2", ...],' : ''}
  ${targetAll || targets.includes('importantTopics') ? '"importantTopics": ["Topic 1", "Topic 2", ...],' : ''}
  ${targetAll || targets.includes('keyDefinitions') ? '"keyDefinitions": [{ "term": "Term Name", "definition": "Academic definition based on text" }],' : ''}
  ${targetAll || targets.includes('examRevisionNotes') ? '"examRevisionNotes": "Complete markdown exam revision guide...",' : ''}
  ${targetAll || targets.includes('quizQuestions') ? `"quizQuestions": [
    {
      "question": "Question text directly answerable from source",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Exact string matching one option",
      "explanation": "Why this is correct based on the source text",
      "difficulty": "easy"
    }
  ],` : ''}
  "shortfallReason": null, // or string if fewer than 20 questions can be strictly supported
  "sourceLimitations": [] // or list of strings noting any unclear or missing source sections
}

OUTPUT VALID JSON ONLY.`;
}

/**
 * Calls Gemini with fallback models and retry.
 */
async function callGeminiWithFallback(prompt) {
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.length < 10) {
    throw new Error('GEMINI_API_KEY is not configured in backend environment. Please set a valid Google Gemini API key in backend/.env.');
  }

  let lastError = null;

  for (const modelName of SUPPORTED_GEMINI_MODELS) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2 // Lower temperature for high factual grounding
        }
      });

      const result = await model.generateContent(prompt);
      const responseText = result?.response?.text();
      if (!responseText) {
        throw new Error(`Empty response from Gemini model ${modelName}`);
      }

      const parsed = JSON.parse(responseText);
      return { parsed, modelName };
    } catch (err) {
      lastError = err;
      console.warn(`[StudyResourcesService] Model ${modelName} failed (${err.message}). Trying fallback model...`);
    }
  }

  throw new Error(`Gemini generation failed across all models (${SUPPORTED_GEMINI_MODELS.join(', ')}): ${lastError?.message || 'Unknown AI error'}`);
}

/**
 * Main Stage 5 & 6 Generator Function
 * Generates study resources from validated extracted text.
 * Strictly source-grounded. Never pads with fake questions.
 */
async function generateChapterStudyResources(sourceText, context = {}, options = {}) {
  const { chapterId = '', chapterTitle = 'Chapter 1.1', subjectName = '', unitName = '' } = context;
  const { mode = 'all', targets = [], existingResources = {} } = options;

  if (!sourceText || typeof sourceText !== 'string' || sourceText.trim().length < 150) {
    throw new Error('Validation failed: Source text is too short or empty to generate learning resources.');
  }

  // Determine which resources need to be generated
  let activeTargets = targets;
  if (mode === 'missing_only') {
    const missing = detectMissingResources(existingResources);
    activeTargets = Object.keys(missing).filter(k => missing[k] && k !== 'allComplete');
    if (activeTargets.length === 0) {
      return {
        isUnchanged: true,
        message: 'All study resources are already present and approved for this chapter.',
        studyResources: existingResources.studyResources || null,
        quizQuestions: existingResources.quizQuestions || [],
        fullNotesMarkdown: existingResources.fullNotesMarkdown || ''
      };
    }
  }

  const prompt = buildGenerationPrompt(sourceText, { chapterTitle, subjectName, unitName }, activeTargets);
  const { parsed, modelName } = await callGeminiWithFallback(prompt);

  // Validate and structure questions
  const { validQuestions } = validateQuizQuestions(parsed.quizQuestions || [], chapterId);

  // Check for shortfall if questions were targeted
  const targetedQuiz = activeTargets.length === 0 || activeTargets.includes('quizQuestions');
  let shortfallNotice = null;

  if (targetedQuiz) {
    if (validQuestions.length < 20) {
      shortfallNotice = {
        hasShortfall: true,
        expectedCount: 20,
        actualCount: validQuestions.length,
        reason: parsed.shortfallReason || `The provided source text (${sourceText.length} characters) supported ${validQuestions.length} distinct, verified questions without hallucinating duplicate or ungrounded questions.`
      };
    } else {
      shortfallNotice = {
        hasShortfall: false,
        expectedCount: 20,
        actualCount: validQuestions.length,
        reason: ''
      };
    }
  }

  const keyDefinitions = validateKeyDefinitions(parsed.keyDefinitions || []);
  const shortNotes = Array.isArray(parsed.shortNotes)
    ? parsed.shortNotes.map(s => String(s).trim()).filter(s => s.length > 5)
    : [];
  const importantTopics = Array.isArray(parsed.importantTopics)
    ? parsed.importantTopics.map(t => String(t).trim()).filter(t => t.length > 3)
    : [];
  const examRevisionNotes = typeof parsed.examRevisionNotes === 'string'
    ? parsed.examRevisionNotes.trim()
    : '';
  const fullNotesMarkdown = typeof parsed.fullNotesMarkdown === 'string'
    ? parsed.fullNotesMarkdown.trim()
    : '';

  return {
    fullNotesMarkdown,
    studyResources: {
      shortNotes,
      importantTopics,
      keyDefinitions,
      examRevisionNotes,
      status: 'draft',
      generatedAt: new Date(),
      shortfallReason: shortfallNotice?.hasShortfall ? shortfallNotice.reason : '',
      sourceLimitations: Array.isArray(parsed.sourceLimitations) ? parsed.sourceLimitations : []
    },
    quizQuestions: validQuestions,
    shortfallNotice,
    source: `gemini-ai (${modelName})`,
    activeTargets
  };
}

module.exports = {
  generateChapterStudyResources,
  detectMissingResources,
  validateQuizQuestions,
  validateKeyDefinitions,
  buildGenerationPrompt
};
