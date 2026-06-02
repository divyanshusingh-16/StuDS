const { GoogleGenerativeAI } = require('@google/generative-ai');

if (!process.env.GEMINI_API_KEY) {
  console.warn('[Gemini] GEMINI_API_KEY is not set. AI features will be unavailable.');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

module.exports = genAI;
