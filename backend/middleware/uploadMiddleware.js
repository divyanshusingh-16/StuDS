const multer = require('multer');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/markdown',
    'text/plain'
  ];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const err = new Error('Unsupported file format. Only PDF, DOCX, and Markdown files are allowed.');
    err.status = 400;
    cb(err, false);
  }
};

const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: { fileSize: 35 * 1024 * 1024 }, // 35MB limit (supports 40+ page comprehensive notes)
});

/**
 * Validates that a file buffer represents a genuine PDF by checking
 * the standard magic bytes "%PDF-" (0x25, 0x50, 0x44, 0x46, 0x2D).
 */
function isGenuinePdf(buffer) {
  if (!buffer || !Buffer.isBuffer(buffer) || buffer.length < 5) return false;
  return buffer.slice(0, 5).toString('ascii') === '%PDF-';
}

module.exports = uploadMiddleware;
module.exports.isGenuinePdf = isGenuinePdf;

