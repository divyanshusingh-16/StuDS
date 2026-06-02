const genAI = require('../config/gemini');

const SYSTEM_INSTRUCTION = `You are an elite university professor. Analyze the following raw markdown college course text and compile an ultra-dense, high-impact study summary. Format the output cleanly using 5 semantic markdown bullet points. Do not include introductory text, conversational filler, or structural fluff.`;

const MAX_INPUT_CHARS = 50000;

async function generateChapterSummary(chapterContentMarkdown) {
  if (!chapterContentMarkdown || typeof chapterContentMarkdown !== 'string') {
    throw new Error('Invalid input: chapterContentMarkdown must be a non-empty string.');
  }

  const trimmedInput = chapterContentMarkdown.slice(0, MAX_INPUT_CHARS);

  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    systemInstruction: SYSTEM_INSTRUCTION,
  });

  const result = await model.generateContent(trimmedInput);
  const response = result.response;
  return response.text();
}

module.exports = { generateChapterSummary };
