# STUDS – College Study Material Portal & Academic Management System

> **Comprehensive Technical Architecture & Operations Guide**  
> *Clear, beginner-friendly, and professional guide to the STUDS codebase architecture, features, workflows, and operations.*

---

## 1. Project Overview

### What is STUDS?
**STUDS** is a modern, full-stack educational web application designed for college and university students, professors, and academic administrators. It acts as a centralized repository and interactive learning platform for college study resources, curriculum management, and pre-examination self-assessment.

### The Problem It Solves
In traditional academic environments, college study materials are often scattered across Google Drives, email threads, messaging groups, and disparate websites. Students struggle with:
- Finding notes specific to their exact department, course branch, and semester.
- Accessing past examination question papers (PYQs) without broken links.
- Quickly revising dense topics before exams.
- Self-testing their understanding on specific chapters.
- Lack of centralized content moderation and administration.
- Hallucinated or low-quality AI study notes that deviate from official university syllabi.

### Main Purpose & Solution
STUDS provides a single, structured, responsive web application that organizes academic curricula into a strict, navigable hierarchy:  
$$\text{Department} \longrightarrow \text{Course / Specialization} \longrightarrow \text{Semester} \longrightarrow \text{Subject} \longrightarrow \text{Unit} \longrightarrow \text{Chapter}$$

For each chapter, the system provides four coordinated study formats:
1. **Comprehensive Study Material**: Textbook-level notes rendered from rich Markdown, featuring attached PDF/DOCX downloads and AI Chapter Synthesis.
2. **Study Resources (4-in-1 Hub)**:
   - **Short Notes**: High-yield revision bullet points.
   - **Important Topics**: Key examination topics identified from the curriculum.
   - **Key Definitions**: Essential terminology and glossary definitions.
   - **Exam Revision Guide**: Structured revision notes with formulas, comparisons, and Markdown summary tables.
3. **Past Examination Question Papers (PYQs)**: Cloud-hosted PDF viewer embedded directly in the browser via an isolated sandbox iframe.
4. **Interactive Practice Quizzes**: Self-evaluating multiple-choice quizzes with randomized 5-question attempts, server-side scoring, and instant explanation reviews.

Administrators have access to a secure, role-restricted dashboard with a **Safe PDF-to-AI Pipeline** to extract textbook text, verify syllabus coverage, generate source-grounded study resources into isolated staging drafts, edit materials, and publish them atomically to students.

---

## 2. Technologies Used

### Backend Stack
| Technology / Library | Version | Purpose in STUDS |
| :--- | :--- | :--- |
| **Node.js** | LTS (v18+) | JavaScript runtime environment executing the backend REST server. |
| **Express.js** | `^5.2.1` | Minimalist web framework providing routing, middleware pipelines, and HTTP request handling. |
| **MongoDB & Mongoose** | `^9.6.2` | NoSQL document database and Object Data Modeling (ODM) library for modeling and querying users, sessions, subjects, units, and chapter contents. |
| **Cookie-Parser** | `^1.4.7` | Parses the HTTP request `Cookie` header into `req.cookies` to extract secure session tokens. |
| **CORS** | `^2.8.6` | Configures Cross-Origin Resource Sharing to restrict browser requests to authorized frontend origins with cookie credential support. |
| **Bcrypt** | `^6.0.0` | Secure password hashing algorithm (salt rounds: 12) for protecting user credentials against dictionary and rainbow table attacks. |
| **Express-Rate-Limit** | `^8.6.2` | Protects the authentication endpoints against brute-force login attacks (caps requests to 10 per 15 minutes). |
| **Multer** | `^2.1.1` | Multipart/form-data middleware configured with in-memory storage to handle PDF and DOCX document file uploads (up to 35MB). |
| **pdf-parse** | `^2.4.5` | High-throughput in-memory PDF stream parser extracting raw text, page count, and structure from uploaded lecture notes. |
| **tesseract.js** | `^7.0.0` | Optical Character Recognition (OCR) engine for converting scanned document images into text. |
| **Mammoth** | `^1.13.0` | In-memory parser converting Microsoft Word `.docx` documents into semantic HTML. |
| **Turndown** | `^7.2.4` | HTML-to-Markdown converter turning Mammoth HTML output into clean, structured Markdown. |
| **Dotenv** | `^17.4.2` | Loads environment configurations (`PORT`, `MONGO_URI`, API keys) from `.env` files into `process.env`. |
| **Nodemon** | `^3.1.14` | Development utility that automatically restarts the Node server upon code changes. |

### External Services & Cloud APIs
| Service / SDK | Version | Purpose in STUDS |
| :--- | :--- | :--- |
| **Google Generative AI (`@google/generative-ai`)** | `^0.24.1` | Interacts with **Gemini 2.0 Flash / 1.5 Flash / 1.5 Pro** for source-grounded learning resource generation, 20-MCQ question bank synthesis, 5-point chapter summaries, and multimodal PDF OCR fallback. |
| **Cloudinary (`cloudinary`)** | `^2.10.0` | Cloud media storage service used to store past exam paper PDFs and lecture note attachments streamed securely from the backend. |

### Frontend Stack
| Technology / Library | Version | Purpose in STUDS |
| :--- | :--- | :--- |
| **React 19** | `^19.2.6` | Declarative UI library for building reactive client-side components and state trees. |
| **Vite** | `^8.0.14` | Next-generation frontend build tool and local dev server providing instantaneous Hot Module Replacement (HMR). |
| **Tailwind CSS v4** | `^4.3.0` | Utility-first CSS engine powering the entire design system, dark mode styles, and responsive layouts. |
| **@tailwindcss/vite** | `^4.3.0` | Official Vite plugin integrating Tailwind CSS v4 compiler directly into the build pipeline. |
| **React Router DOM** | `^7.15.1` | Client-side routing library managing navigation between the student portal (`/`) and the admin workspace (`/admin`). |
| **React Markdown** | `^10.1.0` | Renders raw Markdown strings from the database into formatted, sanitized HTML for notes and AI summaries. |
| **Remark GFM** | `^4.0.1` | Plugin for React Markdown enabling GitHub Flavored Markdown (tables, strikethrough, autolinks, task lists). |
| **Lucide React** | `^1.16.0` | Modern, lightweight icon library providing UI symbols (search, book, chevron, sun/moon, layers, etc.). |

---

## 3. Complete Project Structure

```
college study material project/
├── .gitignore                          # Global git ignore configurations
├── README.md                           # Master project documentation
├── projectinfo.md                      # Complete technical reference manual
├── backend/                            # Express.js REST API server
│   ├── .env                            # Backend environment secrets (never commit)
│   ├── .env.example                    # Template for backend environment variables
│   ├── .gitignore                      # Backend ignore rules (node_modules, db)
│   ├── package.json                    # Backend npm dependencies and scripts
│   ├── package-lock.json               # Backend dependency lockfile
│   ├── server.js                       # Express app entry point & MongoDB connection
│   ├── config/
│   │   ├── auth.js                     # Token generation, HMAC hashing, cookie security options
│   │   ├── cloudinary.js               # Cloudinary SDK client setup
│   │   └── gemini.js                   # Google Gemini Generative AI client setup
│   ├── controllers/
│   │   └── contentController.js        # Controller for upserting chapter materials & notes CRUD
│   ├── db/                             # Local standalone MongoDB storage directory
│   ├── middleware/
│   │   ├── authMiddleware.js           # requireAuth, requireRole, requireTrustedOrigin guards
│   │   └── uploadMiddleware.js         # Multer in-memory storage & PDF/DOCX magic-byte filter
│   ├── models/
│   │   ├── Content.js                  # Chapter materials, notes, quizzes, PYQs, drafts schema
│   │   ├── Session.js                  # Mongoose schema for database-backed user sessions with TTL index
│   │   ├── Subject.js                  # Mongoose schema for academic subjects & semester mappings
│   │   ├── Unit.js                     # Mongoose schema for syllabus units and sub-chapters
│   │   └── User.js                     # Mongoose schema for user accounts, passwords, and roles
│   ├── routes/
│   │   ├── adminRoutes.js              # Protected admin endpoints (pipeline studio, notes, upload)
│   │   ├── authRoutes.js               # Authentication endpoints (login, logout, session /me)
│   │   └── portalRoutes.js             # Public student portal endpoints (subjects, units, search, quiz)
│   ├── services/
│   │   ├── aiService.js                # Google Gemini 1.5 Flash 5-point chapter summarization
│   │   ├── noteCleanerService.js       # Cleans PDF notes, formats Markdown, checks syllabus coverage
│   │   ├── pdfTextExtractor.js         # Dual extraction (pdf-parse / Gemini OCR) & semantic chunking
│   │   ├── pipelineService.js          # 10-stage safe PDF-to-AI pipeline orchestration
│   │   └── studyResourcesService.js    # Grounded Gemini generation, shortfall reporting, MCQ check
│   └── scripts/
│       ├── createSuperAdmin.js         # CLI utility to create the initial super_admin safely
│       ├── importDocx.js               # Utility script to test Mammoth DOCX to Markdown conversion
│       ├── inspectRawNotes.js          # CLI script to inspect raw text extraction buffers
│       ├── securityTest.js             # 42-point automated security verification test suite
│       ├── seed.js                     # Database seeding script for sample university curricula
│       ├── syncSem5.js                 # Semester 5 subject synchronization utility
│       ├── syncSem5Syllabus.js         # Full Computer Networks & Semester 5 syllabus seeder
│       ├── testCleanedNotesWorkflow.js # Automated verification for note cleaner service
│       ├── testNoteCleaner.js          # Unit tests for note cleaning regex rules
│       ├── testPhase1PdfWorkflow.js    # Automated tests for PDF upload & streaming
│       ├── testSafePdfPipeline.js      # 37-point test suite for safe pipeline orchestration
│       └── testStudyResourcesWorkflow.js# Test suite for Gemini resource synthesis
└── frontend/                           # React 19 + Vite + Tailwind CSS Single-Page Application
    ├── .gitignore                      # Frontend ignore rules (dist, node_modules)
    ├── eslint.config.js                # ESLint rules and React hooks configuration
    ├── index.html                      # HTML5 entry page with meta viewport and font setup
    ├── package.json                    # Frontend dependencies, scripts (dev, build, lint)
    ├── package-lock.json               # Frontend dependency lockfile
    ├── vercel.json                     # Single-page application (SPA) rewrite rules for Vercel
    ├── vite.config.js                  # Vite configuration with React and Tailwind CSS v4 plugins
    ├── public/                         # Static public assets & vector favicon
    └── src/
        ├── App.jsx                     # Root application, routing, Student Portal UI, and 4-tab viewer
        ├── index.css                   # Global CSS stylesheet importing Tailwind CSS v4 & theme tokens
        ├── main.jsx                    # React root mount point (renders App in StrictMode)
        ├── assets/                     # Frontend media and local assets
        ├── components/
        │   ├── AdminDashboard.jsx      # Cascading admin portal with Learning Resources Studio
        │   └── CommandSearch.jsx       # Global Ctrl+K command palette modal with debounced search
        └── services/
            └── api.js                  # Centralized API fetch wrapper and endpoint methods
```

---

## 4. Purpose of Important Files & Folders

### Backend Services (`backend/services/`)
- **`pipelineService.js`**: The central orchestrator of the **Safe 10-Stage PDF-to-AI Pipeline**. Enforces draft isolation, prevents overwriting of approved content, handles error recovery, manages pipeline statuses, and executes atomic promotions from draft to published.
- **`pdfTextExtractor.js`**: Handles Stage 2 (Text Extraction) and Stage 3 (Source-Text Validation). Uses `pdf-parse` for in-memory stream extraction with automatic fallback to **Google Gemini Multimodal OCR** for scanned documents. Splits extracted content into semantic chunks (~600–1200 characters) for future vector embeddings.
- **`studyResourcesService.js`**: Handles Stage 4 (Missing-Resource Detection), Stage 5 (Source-Grounded Gemini Generation), and Stage 6 (Structured Output Validation). Prompts Gemini 2.0 / 1.5 Flash at low temperature (`0.2`), sanitizes up to 20 MCQs (ensuring 4 distinct options and matching answers), and reports shortfalls instead of hallucinating questions.
- **`noteCleanerService.js`**: Strips repetitive running headers, footers, page markers (`-- 1 of 45 --`), formats section headers into proper hierarchical Markdown (`#`, `##`, `###`), converts tabular text into GFM tables, preserves ASCII topology diagrams, and validates syllabus coverage against academic curriculum standards.
- **`aiService.js`**: Dedicated lightweight service for generating 5-point chapter summaries from raw Markdown text.

### Backend Infrastructure
- **`server.js`**: Initializes Express, registers CORS with origin whitelists, configures cookie parser, connects to MongoDB, and mounts `/api`, `/api/quiz`, `/api/admin`, and `/api/auth`.
- **`config/auth.js`**: Handles cryptographically secure session tokens (48 random bytes), hashes them using HMAC-SHA256 with a private secret (`SESSION_TOKEN_PEPPER`), and constructs strict `HttpOnly` cookie configurations.
- **`middleware/authMiddleware.js`**: Protects sensitive endpoints. Checks the session cookie against MongoDB, validates user status, verifies Role-Based Access Control (`student`, `content_admin`, `super_admin`), and enforces CSRF protection via trusted origin checks.
- **`middleware/uploadMiddleware.js`**: Configures `multer` with memory storage and strict MIME/magic-byte filters permitting only genuine `application/pdf` and `application/vnd.openxmlformats-officedocument.wordprocessingml.document` with a 35MB limit.

### Frontend Components & Services
- **`frontend/src/App.jsx`**: Houses the main student portal. Implements the department selection modal, semester navigation, subject/unit/chapter accordion, 4-tab content viewer (Study Material, Study Resources, Past Papers, Practice Quiz), and light/dark theme toggle.
- **`frontend/src/components/AdminDashboard.jsx`**: Administrative operations interface allowing content admins to select exact curriculum nodes via a 6-step cascading dropdown, upload PDF/DOCX notes, run the Safe AI Pipeline, review staging drafts, and manage chapter content.
- **`frontend/src/components/CommandSearch.jsx`**: Quick-search command palette accessible via `Ctrl+K` or clicking search, supporting keyboard navigation and direct navigation to matching chapters.
- **`frontend/src/services/api.js`**: Single point of communication with the backend. Automatically passes `credentials: 'include'` so HTTP-only session cookies travel seamlessly on every request.

---

## 5. How the Project Works (Workflows & Lifecycle)

### 1. Student Portal Experience (Public Flow)
1. **Initial Visit & Course Configuration**:
   - When a user accesses the portal (`/`), the app checks `localStorage` for a previously saved course preference (`userCourse`).
   - If not found, a configuration modal opens, presenting university departments (`Engineering`, `Management & Business`, `Computing`, `Other Disciplines`) and their specific branches (e.g., `Computer Science (CSE)`).
   - Selecting a branch saves the choice in `localStorage` and initializes the workspace.
2. **Semester Filtering**:
   - The user selects a semester tab (Semester 1 through 8).
   - React sends an asynchronous request via `fetchSubjectsBySemester(semester, course)`.
   - The backend queries the `Subject` collection filtered by semester and course, returning matching subjects.
3. **Curriculum Drill-Down**:
   - Clicking a subject expands its accordion and fetches its syllabus units via `fetchUnitsBySubject(subjectId)`.
   - Expanding a unit displays its individual chapters.
4. **Content Consumption & Interaction**:
   - Clicking a chapter invokes `fetchContentByChapter(chapterId)`.
   - The main viewer loads four interactive tabs:
     - **Tab 1: Study Material**: Displays formatted markdown notes rendered by `ReactMarkdown` and `remark-gfm`. If an AI summary exists, it displays an "AI Chapter Synthesis" box at the top. Attached PDF notes can be previewed or downloaded.
     - **Tab 2: Study Resources**: A unified 4-in-1 resource hub with sub-tabs for *Short Notes*, *Important Topics*, *Key Definitions*, and the *Exam Revision Guide*.
     - **Tab 3: Past Papers (PYQs)**: Displays available previous exam years. Clicking a paper loads the PDF directly inside an embedded, sandboxed iframe.
     - **Tab 4: Practice Quiz**: Presents an interactive quiz with multiple-choice radio options. Clicking start requests 5 random questions from `/api/quiz/:chapterId/attempt` with answers redacted. Students submit answers to `/api/quiz/:chapterId/submit` and receive an instant score with an answer key and explanation review.
5. **Command Palette Search (`Ctrl + K`)**:
   - At any time, pressing `Ctrl + K` or clicking the search bar opens `CommandSearch`.
   - Typing triggers a debounced (250ms) MongoDB text search (`/api/search?q=...`) across full notes and short notes.
   - Results show matching chapter titles, unit contexts, and highlighted snippets. Clicking any result navigates straight to that chapter.

---

### 2. Admin Workspace & Learning Resources Studio (Protected Flow)
1. **Authentication & Session Check**:
   - Navigating to `/admin` triggers `getCurrentUser()` (`GET /api/auth/me`).
   - If no valid session cookie is present, an administrative login form is presented.
   - Submitting valid credentials (`POST /api/auth/login`) issues a secure, HttpOnly `studs_session` cookie.
2. **Hierarchical Cascading Selector**:
   - To prevent orphaned or misclassified content, the admin dashboard uses a strict 6-tier cascading dropdown:
     $$\text{Department} \longrightarrow \text{Course} \longrightarrow \text{Semester} \longrightarrow \text{Subject} \longrightarrow \text{Unit} \longrightarrow \text{Chapter}$$
   - Selecting an item dynamically loads and unlocks the next level while resetting lower-level selections.
3. **Document Ingestion & Text Extraction**:
   - Admins upload PDF or DOCX lecture notes.
   - The server extracts text using `pdf-parse` (or Gemini OCR fallback) and cleans boilerplate via `noteCleanerService`.
   - Extraction statistics and syllabus coverage percentages are presented in an interactive editor.
4. **AI Resource Generation (Staging Draft)**:
   - Admins trigger AI generation (`POST /api/admin/content/:chapterId/pipeline/generate`).
   - Gemini synthesizes full notes, short notes, topics, definitions, revision guides, and up to 20 MCQs into isolated staging draft fields (`draftStudyResources`, `draftQuizQuestions`, `draftFullNotesMarkdown`).
   - Published resources visible to students remain completely unchanged.
5. **Manual Review & In-Line Editing**:
   - Admins inspect and edit drafted materials in the Learning Resources Studio.
   - Draft edits are saved via `PUT /api/admin/content/:chapterId/draft`.
6. **Explicit Atomic Publication**:
   - Clicking **Approve & Publish to Students** triggers `POST /api/admin/content/:chapterId/pipeline/publish`.
   - The backend promotes staging drafts to published status and clears drafts in an atomic MongoDB operation.

---

### 3. Safe 10-Stage PDF-to-AI Generation Pipeline

```
[ Stage 1: PDF Upload & MIME Validation ]
                   |
                   v
[ Stage 2: Dual Text Extraction (pdf-parse / Gemini OCR) ]
                   |
                   v
[ Stage 3: Source-Text Validation (>75% printable, >=35 words) ]
                   |
                   v
[ Stage 4: Missing-Resource Detection (Targeted Generation) ]
                   |
                   v
[ Stage 5: Gemini Source-Grounded Generation (Temp 0.2) ]
                   |
                   v
[ Stage 6: Structured Output Validation & Shortfall Reporting ]
                   |
                   v
[ Stage 7: Staging Draft Persistence (Isolated from Students) ]
                   |
                   v
[ Stage 8: Admin Studio Review & Manual In-Line Editing ]
                   |
                   v
[ Stage 9: Explicit Atomic Publication (Promote to Production) ]
                   |
                   v
[ Stage 10: Fault-Tolerant Retry without Re-Uploading ]
```

---

## 6. Data Flow Diagrams

### Student Read & Search Flow
```
+-----------------------------------------------------------------------------------+
|                                  STUDENT CLIENT                                   |
|   Selects Department/Course -> Picks Semester -> Selects Subject -> Opens Chapter |
+-----------------------------------------------------------------------------------+
                                         |
                                         | HTTP GET requests (with credentials)
                                         v
+-----------------------------------------------------------------------------------+
|                                 EXPRESS BACKEND                                   |
|               CORS Origin Check  -->  Route Handler (portalRoutes.js)             |
+-----------------------------------------------------------------------------------+
                                         |
                                         | Mongoose Queries
                                         v
+-----------------------------------------------------------------------------------+
|                                MONGODB DATABASE                                   |
|         Find Subjects/Units  <--->  Find Chapter Content  <---> Text Search       |
+-----------------------------------------------------------------------------------+
                                         |
                                         | JSON Response (Drafts & Answers Redacted)
                                         v
+-----------------------------------------------------------------------------------+
|                               STUDENT PORTAL VIEW                                 |
|  - Full Notes (ReactMarkdown)                - AI Chapter Summary (Markdown)      |
|  - Past Papers (Iframe via Cloudinary)       - 4-in-1 Study Resources Hub         |
|  - Randomized Practice Quiz (5 MCQs)         - Instant Graded Scorecard           |
+-----------------------------------------------------------------------------------+
```

### Two-Phase Anti-Cheating Quiz Protocol
```
[ Student requests quiz attempt ]
               |
               v
  GET /api/quiz/:chapterId/attempt
               |
               +---> Server selects 5 random questions from bank
               +---> STRIPS "correctAnswer" and "explanation"
               |
               v
[ Student receives sanitized questions ]
[ Answers questions sequentially in React UI ]
               |
               v
  POST /api/quiz/:chapterId/submit
  Body: { attemptId, answers: [...] }
               |
               +---> Server evaluates answers against database
               +---> Calculates raw score & percentage
               +---> UNLOCKS "correctAnswer" and "explanation"
               |
               v
[ Student receives graded scorecard with full answer explanations ]
```

---

## 7. Complete Database Models & Schemas

### 1. `Content` Model (`backend/models/Content.js`)
```javascript
const mongoose = require('mongoose');

const keyDefinitionSchema = new mongoose.Schema({
  term:             { type: String, required: true },
  definition:       { type: String, required: true },
  isManuallyEdited: { type: Boolean, default: false }
}, { _id: true });

const studyResourcesSchema = new mongoose.Schema({
  shortNotes:        { type: [String], default: [] },
  importantTopics:   { type: [String], default: [] },
  keyDefinitions:    { type: [keyDefinitionSchema], default: [] },
  examRevisionNotes: { type: String, default: '' },
  status:            { type: String, enum: ['draft', 'published'], default: 'draft' },
  generatedAt:       { type: Date, default: Date.now },
  publishedAt:       { type: Date },
  approvedBy:        { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isManuallyEdited:  { type: Boolean, default: false },
  shortfallReason:   { type: String, default: '' },
  sourceLimitations: { type: [String], default: [] }
}, { _id: false });

const quizQuestionSchema = new mongoose.Schema({
  question:         { type: String, required: true },
  options:          { type: [String], required: true, validate: v => v && v.length === 4 },
  correctAnswer:    { type: String, required: true },
  explanation:      { type: String, default: '' },
  difficulty:       { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  chapterId:        { type: String },
  status:           { type: String, enum: ['draft', 'published'], default: 'draft' },
  isManuallyEdited: { type: Boolean, default: false }
}, { _id: true, timestamps: true });

const noteSchema = new mongoose.Schema({
  title:                { type: String, required: true },
  content:              { type: String, default: '' },
  subject:              String,
  unit:                 String,
  chapter:              String,
  status:               { type: String, enum: ['draft', 'published'], default: 'draft' },
  createdBy:            { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  fileUrl:              String,
  fileName:             String,
  fileSize:             Number,
  mimeType:             { type: String, default: 'application/pdf' },
  filePublicId:         String,
  rawExtractedText:     { type: String, default: '' },
  extractedMarkdown:    { type: String, default: '' },
  textExtractionStatus: { type: String, enum: ['none', 'pending', 'extracting', 'success', 'no_text', 'failed'], default: 'none' },
  extractedChunks:      [{ chunkIndex: Number, text: String, wordCount: Number }],
  pageCount:            { type: Number, default: 0 },
  charCount:            { type: Number, default: 0 },
  wordCount:            { type: Number, default: 0 },
  processingError:      { type: String, default: '' }
}, { timestamps: true });

const contentSchema = new mongoose.Schema({
  chapterId:              { type: String, required: true, unique: true, index: true },
  fullNotesMarkdown:      { type: String, default: '' },
  shortNotes:             { type: [String], default: [] },
  studyResources:         { type: studyResourcesSchema, default: () => ({}) },
  pyqLinks:               [{ year: Number, fileUrl: String }],
  quizData:               [{ question: String, options: [String], correctAnswer: String }],
  quizQuestions:          { type: [quizQuestionSchema], default: [] },
  aiSummary:              { type: String, default: null },
  notes:                  { type: [noteSchema], default: [] },

  // Staging Draft Persistence (Isolated from Students)
  draftStudyResources:    { type: studyResourcesSchema, default: null },
  draftQuizQuestions:     { type: [quizQuestionSchema], default: [] },
  draftFullNotesMarkdown: { type: String, default: '' },

  // Pipeline Safety & Status
  processingStatus: {
    type: String,
    enum: ['idle', 'uploading', 'uploaded', 'extracting', 'extracted', 'generating', 'draft_ready', 'published', 'failed'],
    default: 'idle'
  },
  processingError:  { type: String, default: '' },
  lastProcessingAt: { type: Date },
  shortfallNotice: {
    hasShortfall:  { type: Boolean, default: false },
    expectedCount: { type: Number, default: 20 },
    actualCount:   { type: Number, default: 0 },
    reason:        { type: String, default: '' }
  }
}, { timestamps: true });

contentSchema.index({ fullNotesMarkdown: 'text', shortNotes: 'text' }, { weights: { fullNotesMarkdown: 3, shortNotes: 1 } });

module.exports = mongoose.model('Content', contentSchema);
```

### 2. `Subject` Model (`backend/models/Subject.js`)
```javascript
{
  subjectName:    { type: String, required: true, trim: true },
  subjectCode:    { type: String, required: true, unique: true, uppercase: true },
  semester:       { type: Number, required: true, min: 1, max: 8, index: true },
  department:     { type: String, required: true, index: true },
  course:         { type: String, required: true },
  specialization: { type: String, required: true },
  order:          { type: Number, default: 0, index: true }
}
```

### 3. `Unit` Model (`backend/models/Unit.js`)
```javascript
{
  subjectId:    { type: ObjectId, ref: 'Subject', required: true },
  unitNumber:   { type: Number, required: true },
  unitName:     { type: String, required: true },
  contactHours: { type: Number, default: null },
  chapters: [{
    chapterId:   { type: String, required: true, default: () => randomUUID() },
    chapterName: { type: String, required: true },
    topics:      [String]
  }]
}
// Composite index: { subjectId: 1, unitNumber: 1 }
```

### 4. `User` Model (`backend/models/User.js`)
```javascript
{
  email:        { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true, select: false },
  role:         { type: String, enum: ['student', 'content_admin', 'super_admin'], default: 'student', index: true },
  isActive:     { type: Boolean, default: true, index: true },
  lastLoginAt:  { type: Date, default: null }
}
```

### 5. `Session` Model (`backend/models/Session.js`)
```javascript
{
  tokenHash:  { type: String, required: true, unique: true, select: false },
  userId:     { type: ObjectId, ref: 'User', required: true, index: true },
  expiresAt:  { type: Date, required: true },
  lastUsedAt: { type: Date, required: true },
  userAgent:  { type: String, maxlength: 512, default: null },
  ipAddress:  { type: String, maxlength: 128, default: null }
}
// TTL Auto-sweep: { expiresAt: 1 }, { expireAfterSeconds: 0 }
```

---

## 8. Complete API Reference

### Public Portal Routes (`/api`)
| Method | Endpoint | Access Level | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/subjects/:semester` | Public | Returns deduplicated, ordered subjects for semester and course. |
| `GET` | `/api/units/:subjectId` | Public | Returns units and chapter outlines for the chosen subject. |
| `GET` | `/api/content/:chapterId` | Public | Returns published chapter materials. Redacts drafts and unreleased quiz answers. |
| `GET` | `/api/search?q=...` | Public | Debounced text search across full notes and short notes. |
| `GET` | `/` | Public | Health check endpoint returning `{"status":"healthy","message":"API active"}`. |

### Student Quiz Routes (`/api/quiz`)
| Method | Endpoint | Access Level | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/quiz/:chapterId/attempt` | Public | Generates a 5-question random attempt with answers/explanations redacted. |
| `POST` | `/api/quiz/:chapterId/submit` | Public | Validates student answers server-side and reveals scores and explanations. |

### Authentication Routes (`/api/auth`)
| Method | Endpoint | Access Level | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Public (Rate-limited) | Validates credentials, issues `studs_session` HttpOnly cookie. |
| `POST` | `/api/auth/logout` | Authenticated | Revokes session token in MongoDB and clears browser cookie. |
| `GET` | `/api/auth/me` | Authenticated | Returns current authenticated user profile (`id`, `email`, `role`). |

### Admin Pipeline & Management Routes (`/api/admin`)
| Method | Endpoint | Role Guard | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/admin/subject` | `super_admin` | Creates a new subject in the curriculum. |
| `POST` | `/api/admin/unit` | `super_admin` | Adds a new unit and sub-chapters under a subject. |
| `POST` | `/api/admin/content/upsert` | `content_admin`, `super_admin` | Atomically creates or replaces chapter content. |
| `GET` | `/api/admin/content/:id/notes` | `content_admin`, `super_admin` | Retrieves all notes (including drafts) for a chapter. |
| `POST` | `/api/admin/content/:id/notes` | `content_admin`, `super_admin` | Creates a new study note entry under a chapter. |
| `PUT` | `/api/admin/content/:id/notes/:noteId`| `content_admin`, `super_admin` | Updates title, content, or publication status of a note. |
| `DELETE` | `/api/admin/content/:id/notes/:noteId`| `content_admin`, `super_admin` | Deletes a study note. |
| `POST` | `/api/admin/upload-pdf` | `content_admin`, `super_admin` | Streams a PDF past paper to Cloudinary. |
| `POST` | `/api/admin/upload-notes-pdf` | `content_admin`, `super_admin` | Uploads/replaces notes PDF attachment via Cloudinary. |
| `POST` | `/api/admin/upload-document` | `content_admin`, `super_admin` | Ingests DOCX/PDF/MD, parses DOCX to Markdown. |
| `POST` | `/api/admin/extract-pdf-text` | `content_admin`, `super_admin` | Dual extraction via `pdf-parse` with Gemini OCR fallback. |
| `POST` | `/api/admin/clean-extracted-text` | `content_admin`, `super_admin` | Cleans raw text into structured Markdown and verifies syllabus coverage. |
| `GET` | `/api/admin/content/:id/pipeline/status`| `content_admin`, `super_admin` | Returns pipeline overview, extraction stats, and draft status. |
| `POST` | `/api/admin/content/:id/pipeline/generate`| `content_admin`, `super_admin` | Synthesizes missing or targeted resources into staging draft via Gemini. |
| `POST` | `/api/admin/content/:id/pipeline/retry`| `content_admin`, `super_admin` | Retries generation from existing extracted text without re-uploading. |
| `PUT` | `/api/admin/content/:id/draft` | `content_admin`, `super_admin` | Saves admin manual edits to staging draft without publishing. |
| `POST` | `/api/admin/content/:id/pipeline/publish`| `content_admin`, `super_admin` | Explicit atomic promotion of approved draft to published student view. |
| `GET` | `/api/admin/content/:id/study-resources`| `content_admin`, `super_admin` | Inspects existing resources, draft staging, and question bank. |
| `POST` | `/api/admin/generate-summary` | `content_admin`, `super_admin` | Synthesizes chapter markdown into a 5-point summary via Google Gemini. |

---

## 9. Important Concepts Used

1. **Role-Based Access Control (RBAC)**:
   - Users are assigned explicit roles: `student` (public reader), `content_admin` (can manage chapter notes, upload PDFs, run AI summaries), and `super_admin` (can manage content plus create new subjects and units).
   - Protected routes enforce roles through modular middleware (`requireRole('super_admin')`).
2. **Database-Backed Stateful Sessions**:
   - Instead of standard stateless JSON Web Tokens (JWTs) which cannot be easily invalidated before expiry, STUDS uses database-persisted sessions.
   - High-entropy 48-byte random tokens are stored **only** as HMAC-SHA256 hashes combined with a server secret (`SESSION_TOKEN_PEPPER`).
   - Tokens are stored solely in secure HTTP-only cookies, immune to JavaScript XSS theft.
3. **MongoDB TTL (Time-To-Live) Collections**:
   - `Session.js` declares an index on `expiresAt` with `{ expireAfterSeconds: 0 }`. MongoDB background threads automatically delete expired sessions without requiring manual cleanup cron jobs.
4. **Staging Draft Isolation**:
   - AI generation writes directly to isolated draft fields (`draftStudyResources`, `draftQuizQuestions`, `draftFullNotesMarkdown`). The public API strips drafts, ensuring students only view verified, published curriculum content.
5. **Shortfall Reporting vs Hallucination Prevention**:
   - When source documents are brief, Gemini returns only verified questions and reports an explicit shortfall reason rather than inventing ungrounded examination questions.
6. **Semantic Chunking for Future RAG / Embeddings**:
   - Notes are split into 600–1200 character chunks respecting paragraph boundaries, providing pre-processed vectors for future AI doubt-solving.
7. **Debounced Global Text Search**:
   - The search input triggers a timer that waits 250 milliseconds after typing stops before making a network request. Backend queries utilize MongoDB `$text` search indexes with relevance scoring (`$meta: "textScore"`).
8. **Defensive API Hardening**:
   - **Timing Attack Mitigation**: When verifying passwords, if a user email does not exist, bcrypt still hashes against a constant dummy hash string (`DUMMY_PASSWORD_HASH`) to prevent attackers from measuring response time differences to enumerate valid accounts.
   - **CSRF Origin Whitelisting**: `requireTrustedOrigin` verifies the HTTP `Origin` header against explicit domains (`FRONTEND_ORIGINS`) on state-changing requests.

---

## 10. How to Run the Project

### Prerequisites
- **Node.js** (v18.0.0 or higher recommended)
- **MongoDB** (running locally on port 27017, or a remote MongoDB Atlas connection string)
- **Git**

---

### Step 1: Clone the Repository
```bash
git clone <repository-url>
cd "college study material project"
```

---

### Step 2: Configure Backend Environment Variables
Navigate to the `backend/` folder and create a `.env` file based on `.env.example`:

```bash
cd backend
cp .env.example .env
```

Open `backend/.env` and configure your credentials:

```env
NODE_ENV=development
PORT=5001
MONGO_URI=mongodb://127.0.0.1:27017/studs_portal
FRONTEND_ORIGINS=http://localhost:5173
SESSION_TOKEN_PEPPER=a_very_long_random_string_with_at_least_32_characters_123456
SESSION_TTL_DAYS=7

# Cloudinary Credentials (Required for uploading PYQ PDFs & documents)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Google Gemini API Key (Required for AI study resource generation and OCR)
GEMINI_API_KEY=your_google_gemini_api_key
```

---

### Step 3: Install Backend Dependencies & Seed Data
Inside the `backend/` folder:

```bash
# Install dependencies
npm install

# Seed sample college curriculum (Computer Science & Agentic AI tracks)
npm run seed

# Seed complete Semester 5 Computer Networks syllabus units & chapters
node scripts/syncSem5Syllabus.js
```

---

### Step 4: Create the Initial Super-Admin Account
To access the admin workspace (`/admin`), create the initial super-admin:

**On Linux / macOS:**
```bash
SUPER_ADMIN_EMAIL="admin@studs.app" SUPER_ADMIN_PASSWORD="YourSecurePassword123!" npm run create:super-admin
```

**On Windows PowerShell:**
```powershell
$env:SUPER_ADMIN_EMAIL="admin@studs.app"; $env:SUPER_ADMIN_PASSWORD="YourSecurePassword123!"; npm run create:super-admin
```

> The password must be at least 12 characters long. The script will reject execution if a super-admin account already exists.

---

### Step 5: Start the Backend Server
```bash
# Runs backend on http://localhost:5001 (or configured PORT)
npm run dev
```

---

### Step 6: Setup & Start the Frontend
Open a new terminal window, navigate to the `frontend/` folder, install dependencies, and start the Vite dev server:

```bash
cd frontend
npm install
npm run dev
```

The frontend will run at **`http://localhost:5173`**.

---

### Accessing the Applications
- **Student Portal**: Open `http://localhost:5173` in your browser.
- **Admin Dashboard**: Open `http://localhost:5173/admin` and log in with your super-admin credentials.
- **Backend Health Check**: Open `http://localhost:5001/` to verify the API returns `{"status":"healthy","message":"API active"}`.

---

## 11. Automated Test Suites & Verification

STUDS provides comprehensive automated test suites located in `backend/scripts/`:

| Test Suite | Command | Coverage & Assertions |
| :--- | :--- | :--- |
| **Security Test Suite** (`securityTest.js`) | `node scripts/securityTest.js` | **42 test assertions**: Tests unauthenticated route rejection, rate limiting, credential verification, timing attack mitigation, HttpOnly cookies, session revocation upon logout, and super-admin RBAC authorization. |
| **Safe PDF Pipeline Suite** (`testSafePdfPipeline.js`) | `node scripts/testSafePdfPipeline.js` | **37 test assertions across 8 groups**: Verifies PDF buffer loading, text extraction, printable character ratio checks, missing-resource detection, staging draft isolation, atomic publication promotion, retry without re-upload, shortfall reporting, and student answer redaction. |
| **Notes Cleaner Suite** (`testCleanedNotesWorkflow.js` & `testNoteCleaner.js`) | `node scripts/testCleanedNotesWorkflow.js` | Verifies boilerplate stripping, markdown table formatting, diagram preservation, and syllabus topic coverage calculation. |
| **Study Resources Suite** (`testStudyResourcesWorkflow.js`) | `node scripts/testStudyResourcesWorkflow.js` | Verifies Gemini generation, missing-resource detection, 4-option MCQ structure, and shortfall alert handling. |

---

## 12. Overall Workflow Summary

```
[ Academic Administrator ]                                [ Student User ]
           |                                                     |
           v                                                     v
Logs in at `/admin`                                       Opens Portal at `/`
           |                                                     |
Selects Department & Course                               Selects Branch & Semester
           |                                                     |
Uploads PDF/DOCX Lecture Notes                            Browses Syllabus Units
           |                                                     |
Runs Text Extraction & Cleaner                            Selects Chapter
           |                                                     |
Triggers Safe AI Generator (Gemini)                       Reads Full Notes & AI Summary
           |                                                     |
Reviews & Edits Staging Draft                             Explores 4-in-1 Study Resources
           |                                                     |
Publishes Materials to Students                           Views Past Papers in Embedded Iframe
           |                                                     |
           +-------------------> [ CONTENT ] <-------------------+
                                 AVAILABLE      Takes Interactive Quiz & Reviews Score
```

1. **Setup**: The college super-admin creates the subjects and units for each semester.
2. **Authoring & Ingestion**: Academic admins select a chapter, upload lecture PDFs or Word documents, and extract and clean the text.
3. **Safe AI Enhancement**: Admins trigger Gemini AI to create short notes, important topics, key definitions, revision guides, and practice MCQs into an isolated staging draft.
4. **Curation & Publication**: Admins inspect, edit, and approve the draft before executing an atomic publish.
5. **Discovery**: Students visit the portal, configure their degree stream, select their semester, and instantly access organized course materials.
6. **Search**: Students use `Ctrl + K` to search across all notes and jump straight to relevant concepts.
7. **Self-Assessment**: Students test their mastery using chapter-specific interactive quizzes with immediate score calculation and answer explanations.
