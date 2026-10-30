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
- Unauthenticated access leading to unmoderated resource leakage or scrapers accessing raw curriculum documents.
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

**Mandatory Student Portal Authentication & College UID Support**:
STUDS protects all academic assets behind mandatory session authentication. Students register using either their official institutional email or College UID / Roll Number (e.g., `22BCS10142`). The server strictly locks self-registered accounts to the `student` role, preventing unauthorized elevation to administrative rights.

**Administrative Operations**:
Administrators have access to a secure, role-restricted dashboard with a **Safe PDF-to-AI Pipeline** to extract textbook text, verify syllabus coverage, generate source-grounded study resources into isolated staging drafts, edit materials, and publish them atomically to students.

---

## 2. Technologies Used

### Backend Stack
| Technology / Library | Version | Purpose in STUDS |
| :--- | :--- | :--- |
| **Node.js** | LTS (v18+) | JavaScript runtime environment executing the backend REST server. |
| **Express.js** | `^5.2.1` | Minimalist web framework providing routing, middleware pipelines, and HTTP request handling. |
| **MongoDB & Mongoose** | `^9.6.2` | NoSQL document database and Object Data Modeling (ODM) library for modeling and querying users, sessions, subjects, units, and chapter contents. Connections are locked to the `StuDS` database. |
| **Cookie-Parser** | `^1.4.7` | Parses the HTTP request `Cookie` header into `req.cookies` to extract secure session tokens. |
| **CORS** | `^2.8.6` | Configures Cross-Origin Resource Sharing with normalized origin matching supporting multi-domain production setups and credentials. |
| **Bcrypt** | `^6.0.0` | Secure password hashing algorithm (salt rounds: 12) for protecting user credentials against dictionary and rainbow table attacks. |
| **Express-Rate-Limit** | `^8.6.2` | Protects the authentication endpoints against brute-force login attacks (15 logins / 15m; 10 registrations / hour). |
| **Multer** | `^2.1.1` | Multipart/form-data middleware configured with in-memory storage to handle PDF and DOCX document file uploads (up to 35MB). |
| **pdf-parse** | `^2.4.5` | High-throughput in-memory PDF stream parser extracting raw text, page count, and structure from uploaded lecture notes. |
| **tesseract.js** | `^7.0.0` | Optical Character Recognition (OCR) engine for converting scanned document images into text. |
| **Mammoth** | `^1.13.0` | In-memory parser converting Microsoft Word `.docx` documents into semantic HTML. |
| **Turndown** | `^7.2.4` | HTML-to-Markdown converter turning Mammoth HTML output into clean, structured Markdown. |
| **Dotenv** | `^17.4.2` | Loads environment configurations (`PORT`, `MONGO_URI`, API keys) from `.env` files into `process.env`. |
| **Nodemon** | `^3.1.14` | Development utility that automatically restarts the Node server upon code changes. |
| **Express-Rate-Limit** (doubt) | `^8.6.2` | Additional rate-limiter instance on doubt-solving endpoints (30 questions / 15m per IP). |

### External Services & Cloud APIs
| Service / SDK | Version | Purpose in STUDS |
| :--- | :--- | :--- |
| **Google Generative AI (`@google/generative-ai`)** | `^0.24.1` | Interacts with **Gemini 2.0 Flash / 1.5 Flash / 1.5 Pro** for source-grounded learning resource generation, 20-MCQ question bank synthesis, 5-point chapter summaries, multimodal PDF OCR fallback, and `text-embedding-004` vector embeddings for chapter-aware RAG. |
| **Cloudinary (`cloudinary`)** | `^2.10.0` | Cloud media storage service used to store past exam paper PDFs and lecture note attachments streamed securely from the backend. |

### Frontend Stack
| Technology / Library | Version | Purpose in STUDS |
| :--- | :--- | :--- |
| **React 19** | `^19.2.6` | Declarative UI library for building reactive client-side components and state trees. |
| **Vite** | `^8.0.14` | Next-generation frontend build tool and local dev server providing instantaneous Hot Module Replacement (HMR). |
| **Tailwind CSS v4** | `^4.3.0` | Utility-first CSS engine powering the entire design system, dark mode styles, and responsive layouts. |
| **@tailwindcss/vite** | `^4.3.0` | Official Vite plugin integrating Tailwind CSS v4 compiler directly into the build pipeline. |
| **React Router DOM** | `^7.15.1` | Client-side routing library managing navigation between the student portal (`/`), authentication pages (`/login`, `/register`), and admin workspace (`/admin`). |
| **React Markdown** | `^10.1.0` | Renders raw Markdown strings from the database into formatted, sanitized HTML for notes and AI summaries. |
| **Remark GFM** | `^4.0.1` | Plugin for React Markdown enabling GitHub Flavored Markdown (tables, strikethrough, autolinks, task lists). |
| **Lucide React** | `^1.16.0` | Modern, lightweight icon library providing UI symbols (search, book, chevron, sun/moon, layers, etc.). |

---

## 3. Complete Project Structure

```
college study material project/
├── .gitignore                          # Global git ignore configurations
├── README.md                           # Master project documentation
├── projectinfo.md                      # Comprehensive technical architecture and operations guide
├── backend/                            # Express.js REST API server
│   ├── .env                            # Backend environment secrets (never commit)
│   ├── .env.example                    # Template for backend environment variables
│   ├── .gitignore                      # Backend ignore rules (node_modules, db)
│   ├── package.json                    # Backend npm dependencies and scripts
│   ├── package-lock.json               # Backend dependency lockfile
│   ├── server.js                       # Express app entry point, MongoDB connection & CORS setup
│   ├── backups/                        # Verified JSON audit backups of official curriculum
│   ├── config/
│   │   ├── auth.js                     # Token generation, HMAC hashing, cookie configuration
│   │   ├── cloudinary.js               # Cloudinary SDK client setup
│   │   └── gemini.js                   # Google Gemini Generative AI client setup
│   ├── controllers/
│   │   └── contentController.js        # Controller for upserting chapter materials & notes CRUD
│   ├── db/                             # Local standalone MongoDB storage directory
│   ├── middleware/
│   │   ├── authMiddleware.js           # requireAuth (3-day idle timeout), requireRole, requireTrustedOrigin
│   │   └── uploadMiddleware.js         # Multer in-memory storage & PDF/DOCX magic-byte filter
│   ├── models/
│   │   ├── Content.js                  # Chapter materials, notes, quizzes, PYQs, drafts schema
│   │   ├── DocumentChunk.js            # 768-dim page-aware vector chunks schema for chapter RAG
│   │   ├── Session.js                  # Mongoose schema for user sessions with TTL index & lastUsedAt
│   │   ├── Subject.js                  # Mongoose schema for academic subjects & semester mappings
│   │   ├── Unit.js                     # Mongoose schema for syllabus units and sub-chapters
│   │   └── User.js                     # Mongoose schema with College UID (sparse unique index), email, roles
│   ├── routes/
│   │   ├── adminRoutes.js              # Protected admin endpoints (pipeline studio, notes, upload, RAG indexing)
│   │   ├── authRoutes.js               # Authentication endpoints (register, login, logout, /me)
│   │   └── portalRoutes.js             # Authenticated student portal endpoints (subjects, units, search, quiz, doubt)
│   ├── services/
│   │   ├── aiService.js                # Google Gemini 1.5 Flash 5-point chapter summarization
│   │   ├── curatedCurriculum.js        # Verified curriculum package for Computer Networks Ch 1.1
│   │   ├── embeddingService.js         # Gemini text-embedding-004 & deterministic semantic fallback
│   │   ├── noteCleanerService.js       # Cleans PDF notes, formats Markdown, checks syllabus coverage
│   │   ├── pdfTextExtractor.js         # Dual extraction (pdf-parse / Gemini OCR), page citations & overlapping chunks
│   │   ├── pipelineService.js          # 10-stage safe PDF-to-AI pipeline orchestration
│   │   ├── ragService.js               # Chapter-aware RAG vector search, retrieval & doubt answering
│   │   └── studyResourcesService.js    # Grounded Gemini generation, shortfall reporting, MCQ check
│   └── scripts/
│       ├── audit_chapter1_1_records.js # Database consistency and audit verification utility
│       ├── cleanUid.js                 # Database maintenance tool unsetting null UID fields
│       ├── createSuperAdmin.js         # CLI utility to create the initial super_admin safely
│       ├── importDocx.js               # Utility script to test Mammoth DOCX to Markdown conversion
│       ├── indexChapter1_1.js          # Safe RAG ingestion script for Computer Networks Chapter 1.1
│       ├── inspectRawNotes.js          # CLI script to inspect raw text extraction buffers
│       ├── restoreChapter1_1.js        # Recovery script restoring Chapter 1.1 records from backup
│       ├── securityTest.js             # 42-point automated security & regression verification test suite
│       ├── seed.js                     # Database seeding script for sample university curricula
│       ├── syncSem5.js                 # Semester 5 subject synchronization utility
│       ├── syncSem5Syllabus.js         # Full Computer Networks & Semester 5 syllabus seeder
│       ├── test_api_mapping.js         # API route mapping and endpoint connectivity validation
│       ├── testCleanedNotesWorkflow.js # Automated verification for note cleaner service
│       ├── testNoteCleaner.js          # Unit tests for note cleaning regex rules
│       ├── testPhase1PdfWorkflow.js    # Automated tests for PDF upload & streaming
│       ├── testRagWorkflow.js          # 37-point automated verification for chapter-aware RAG
│       ├── testSafePdfPipeline.js      # 37-point test suite for safe pipeline orchestration
│       ├── testSearch.js               # Search scoring algorithm and ranking test runner
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
        │   ├── CommandSearch.jsx       # Global Ctrl+K command palette modal with debounced search
        │   ├── LoginPage.jsx           # Dedicated student & administrator sign-in page
        │   └── RegisterPage.jsx        # Dedicated student self-registration page with UID support
        └── services/
            └── api.js                  # Centralized API fetch wrapper and endpoint methods
```

---

## 4. Purpose of Important Files & Folders

### Frontend Components & Authentication Pages
- **`frontend/src/components/LoginPage.jsx`**: Dedicated authentication screen for students and administrators. Supports login by College UID (e.g., `22BCS10142`) or institutional email. Features client-side validation, password visibility toggle, error handling (rate limit notices, connection failures), and renders registration success banners when redirected from `/register`.
- **`frontend/src/components/RegisterPage.jsx`**: Student self-registration portal. Accepts College UID or email and a password (min 8 characters) with password confirmation validation. Directs newly created users to `/login` without setting an automatic session cookie, ensuring verified credentials.
- **`frontend/src/App.jsx`**: Houses the student portal, client routing, and mandatory authentication gating. If `currentStudent` is null, automatically redirects visitors to `/login` while storing `state: { from: location }`. Features the student profile menu in the header, semester navigation, subject/unit accordions, 4-tab content viewer, and light/dark theme toggle.
- **`frontend/src/components/CommandSearch.jsx`**: Quick-search command palette accessible via `Ctrl+K`. Features real-time regex highlighting of query tokens, 200ms debouncing, keyboard navigation (`↑`, `↓`, `Enter`, `Esc`), and type badges (`subject`, `unit`, `chapter`, `resource`).
- **`frontend/src/components/AdminDashboard.jsx`**: Administrative workspace with a 6-tier cascading selector, document upload studio, text extraction, note cleaning, Safe AI resource generation, staging draft review, and atomic publication.
- **`frontend/src/services/api.js`**: Centralized API abstraction layer configured with `credentials: 'include'`. Houses methods for student authentication (`loginStudent`, `registerStudent`, `getCurrentUser`, `logoutStudent`), portal data querying, and admin operations.

### Backend Routing & Middleware
- **`backend/routes/portalRoutes.js`**: Enforces `router.use(requireAuth)` across all endpoints. Serves subjects, units, published chapter content (redacting draft staging and quiz answers), and powers the multi-tier search engine with word stemming and active semester boosts.
- **`backend/routes/authRoutes.js`**: Handles `POST /register`, `POST /login`, `POST /logout`, and `GET /me`. Applies rate limiters (15 logins / 15m; 10 registrations / hour), enforces `role: 'student'` server-side during registration, supports College UID normalization, and runs constant-time bcrypt verification.
- **`backend/routes/adminRoutes.js`**: Protected administrative routes requiring authenticated sessions and `content_admin` or `super_admin` roles.
- **`backend/middleware/authMiddleware.js`**: Contains `requireAuth` (validates HMAC-SHA256 session token, enforces 3-day inactivity timeout, updates throttled `lastUsedAt`), `requireRole` (RBAC guard), and `requireTrustedOrigin` (CSRF guard).
- **`backend/config/auth.js`**: Generates 48-byte cryptographically secure session tokens, hashes them with HMAC-SHA256 and `SESSION_TOKEN_PEPPER`, and configures `HttpOnly`, `SameSite`, `Secure`, and `Partitioned` cookie flags.
- **`backend/server.js`**: Server initialization, CORS normalization (handles comma-separated domains and trims slashes), trust proxy configuration, and Mongoose connection with explicit `dbName: 'StuDS'`.

### Backend Services & Scripts
- **`backend/services/pipelineService.js`**: Central coordinator for the 10-stage PDF-to-AI pipeline. Enforces draft staging isolation and atomic publication.
- **`backend/services/pdfTextExtractor.js`**: High-throughput PDF extraction via `pdf-parse` with Gemini Multimodal OCR fallback, page-boundary tracking, and overlapping semantic chunk splitting.
- **`backend/services/studyResourcesService.js`**: Prompts Gemini 2.0 / 1.5 Flash at low temperature (`0.2`), validates 4-option MCQs, and reports factual shortfalls instead of hallucinating.
- **`backend/services/noteCleanerService.js`**: Cleans headers/footers, converts text into Markdown tables, preserves network ASCII diagrams, and checks syllabus coverage.
- **`backend/services/curatedCurriculum.js`**: Verified domain package for Semester 5 Computer Networks (Unit 1, Chapter 1.1) containing verified MCQs, notes, and definitions.
- **`backend/services/embeddingService.js`**: Generates 768-dimensional vector embeddings using Google Gemini `text-embedding-004`. Falls back to a deterministic semantic hashing algorithm when the API is unavailable.
- **`backend/services/ragService.js`**: Chapter-aware Retrieval-Augmented Generation (RAG) service. Performs cosine-similarity vector search over `DocumentChunk` collection, retrieves top-K chunks with page citations (`[Page X]`), and feeds verified context to Gemini for grounded doubt answering. Rejects out-of-scope questions with an insufficient-context status.
- **`backend/scripts/securityTest.js`**: Automated 42-point security and regression test suite verifying health checks, mandatory student auth, student registration journey, role spoofing prevention, College UID login, student-to-admin isolation, and search ranking regression.
- **`backend/scripts/testSearch.js`**: Search ranking unit test runner testing query normalization, suffix stemming, and score thresholds.
- **`backend/scripts/testRagWorkflow.js`**: 37-point automated verification for the chapter-aware RAG system — covers unauthenticated rejection, role isolation, input validation, vector retrieval relevance, page attribution, anti-hallucination guardrail, multi-turn follow-ups, and admin deduplication.
- **`backend/scripts/indexChapter1_1.js`**: Safe RAG ingestion helper that chunks and embeds the approved Computer Networks Chapter 1.1 PDF into 99 page-aware `DocumentChunk` records without altering existing notes, quizzes, or study resources.
- **`backend/scripts/test_api_mapping.js`**: API route mapping and endpoint connectivity validator.
- **`backend/scripts/cleanUid.js`**: Maintenance script that removes null UID fields to preserve MongoDB's sparse unique index.

---

## 5. How the Project Works (Workflows & Lifecycle)

### 1. Student Portal Experience & Mandatory Authentication Flow
1. **Authentication Check & Gatekeeper**:
   - When a user accesses `/`, `App.jsx` evaluates `getCurrentUser()`.
   - If no valid session cookie is found, the user is redirected to `/login`, preserving their target destination in `state: { from: location }`.
2. **Registration & Sign-In Journey**:
   - Students without an account click "Sign up" to visit `/register`.
   - They provide their College UID (e.g. `22BCS10142`) or email, and a secure password (minimum 8 characters).
   - The backend validates the input, enforces `role: 'student'` server-side, hashes the password via bcrypt (cost factor: 12), and returns HTTP 201.
   - An authenticated cookie is purposefully not set upon registration; the user is redirected to `/login` with a green confirmation alert.
   - The student logs in on `/login`. The backend issues a secure `studs_session` HttpOnly cookie with `Partitioned: true` and redirects them to the portal.
3. **Student Profile & Navigation Menu**:
   - The header displays the user's avatar initial and UID/email.
   - Clicking opens a dropdown showing their full identifier, role badge (`student`), an Admin Workspace shortcut (if permitted), and a "Sign Out" button.
4. **Course Configuration & Subject Filtering**:
   - The user selects their Department and Specialization via the course modal, saving the preference to `localStorage`.
   - Choosing a semester tab (1 through 8) triggers `fetchSubjectsBySemester(semester, course)`.
   - Subjects are returned deduplicated, cleaned, and sorted in curriculum order.
5. **Curriculum Drill-Down & 4-Tab Viewer**:
   - Selecting a subject fetches units; selecting a unit displays chapters.
   - Clicking a chapter loads four synchronized tabs:
     - **Tab 1: Study Material**: Textbook-level formatted Markdown notes with AI synthesis and downloadable attachments.
     - **Tab 2: Study Resources**: 4-in-1 study resource hub (Short Notes, Important Topics, Key Definitions, Exam Revision Guide).
     - **Tab 3: Past Papers (PYQs)**: Embedded PDF viewer loaded inside a sandboxed iframe.
     - **Tab 4: Practice Quiz**: Randomized 5-question multiple-choice practice attempt with server-side grading and instant rationale review.
6. **Command Palette Search (`Ctrl + K`)**:
   - The user presses `Ctrl + K` or clicks the search bar.
   - Debounced queries hit `GET /api/search?q=...&semester=...`.
   - Matches are ranked using the multi-tier scoring formula and returned with live regex token highlighting.

---

### 2. Admin Workspace & Learning Resources Studio (Protected Flow)
1. **Authentication & Session Check**:
   - Navigating to `/admin` triggers `getCurrentUser()`. If unauthenticated or if the role is not `content_admin` or `super_admin`, access is denied (403 Forbidden).
2. **Hierarchical Cascading Selector**:
   - Enforces a 6-tier cascading dropdown:
     $$\text{Department} \longrightarrow \text{Course} \longrightarrow \text{Semester} \longrightarrow \text{Subject} \longrightarrow \text{Unit} \longrightarrow \text{Chapter}$$
   - Changing any higher-level item resets all lower-level selections.
3. **Document Ingestion & Text Extraction**:
   - Admins upload PDF or DOCX lecture notes.
   - Text is extracted via `pdf-parse` (or Gemini OCR) and cleaned using `noteCleanerService`.
4. **AI Generation into Staging Draft**:
   - Admins trigger AI generation (`POST /api/admin/content/:chapterId/pipeline/generate`).
   - Gemini synthesizes full notes, short notes, topics, definitions, revision guides, and up to 20 MCQs into staging draft fields (`draftStudyResources`, `draftQuizQuestions`, `draftFullNotesMarkdown`).
   - Published student views remain completely untouched.
5. **Manual Review & Editing**:
   - Admins inspect and edit drafted materials in the Learning Resources Studio.
   - Draft edits are saved via `PUT /api/admin/content/:chapterId/draft`.
6. **Explicit Atomic Publication**:
   - Clicking **Approve & Publish to Students** triggers `POST /api/admin/content/:chapterId/pipeline/publish`.
   - The backend validates questions, promotes drafts to published status, and clears draft fields atomically.

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

### 4. Enhanced Search Engine & Multi-Tier Relevance Ranking Algorithm

The STUDS search engine (`backend/routes/portalRoutes.js`) uses a deterministic relevance scoring algorithm combining token matching, word stemming, and context awareness:

```
Score = MatchTypeBase + TokenStemScore + AllTokensBonus + ContextBonus + CodeMultiplier + SemesterBoost
```

- **Exact Match (`+1000`)**: Target string exactly matches the normalized query.
- **Prefix Match (`+600`)**: Target string begins with the query string.
- **Substring Match (`+400`)**: Query string appears as an exact substring.
- **Token Matching with Stemming (`+280` to `+300`)**:
  - Query tokens and target words have terminal plural suffixes (e.g., `'s'`) stripped before matching.
  - Exact token match: `+300` per token.
  - Stemmed token match: `+280` per token.
  - Prefix token match: `+200` per token.
  - Infix token match: `+80` per token.
- **All-Tokens Bonus (`+400`)**: Added when all query words successfully match the target string.
- **Context Bonus (`+200`)**: Added when all tokens match within the combined string of Subject + Unit + Chapter.
- **Subject Code Multiplier (`1.6x`)**: Subject codes (e.g. `CS504`, `CS503`) receive a 1.6x multiplier to prioritize exact course codes.
- **Active Semester Boost (`+80`)**: If the matched subject or chapter corresponds to the student's currently active semester tab, it receives an 80-point boost.

---

## 6. Data Flow Diagrams

### Student Authentication & Reading Flow
```
+-----------------------------------------------------------------------------------+
|                                  STUDENT CLIENT                                   |
|   1. Hits '/'  --> Checks session via GET /api/auth/me                            |
|   2. If unauthenticated, redirected to '/login' (or '/register' for new students) |
|   3. Submits credentials --> Receives HttpOnly cookie (studs_session)             |
|   4. Returns to '/' --> Selects Course & Semester --> Explores Curriculum         |
+-----------------------------------------------------------------------------------+
                                         |
                                         | HTTP GET requests (with studs_session cookie)
                                         v
+-----------------------------------------------------------------------------------+
|                                 EXPRESS BACKEND                                   |
|   CORS Origin Check  -->  requireAuth Middleware (Validates Token & 3-Day Idle)   |
|                      -->  Route Handler (portalRoutes.js)                         |
+-----------------------------------------------------------------------------------+
                                         |
                                         | Mongoose Queries
                                         v
+-----------------------------------------------------------------------------------+
|                                MONGODB DATABASE                                   |
|         Find Subjects/Units  <--->  Find Chapter Content  <---> Multi-Tier Search |
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
[ Authenticated Student requests quiz attempt ]
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

### 1. `User` Model (`backend/models/User.js`)
```javascript
const mongoose = require('mongoose');

const USER_ROLES = ['student', 'content_admin', 'super_admin'];

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    uid: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: USER_ROLES,
      default: 'student',
      required: true,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      required: true,
      index: true,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ uid: 1 }, { unique: true, sparse: true });

userSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id.toString(),
    email: this.email,
    uid: this.uid || null,
    role: this.role,
  };
};

module.exports = {
  User: mongoose.model('User', userSchema),
  USER_ROLES,
};
```

### 2. `Session` Model (`backend/models/Session.js`)
```javascript
const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
  {
    tokenHash: {
      type: String,
      required: true,
      select: false,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    lastUsedAt: {
      type: Date,
      required: true,
    },
    userAgent: {
      type: String,
      maxlength: 512,
      default: null,
    },
    ipAddress: {
      type: String,
      maxlength: 128,
      default: null,
    },
  },
  { timestamps: true }
);

sessionSchema.index({ tokenHash: 1 }, { unique: true });
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // MongoDB TTL auto-cleanup

module.exports = mongoose.model('Session', sessionSchema);
```

### 3. `Content` Model (`backend/models/Content.js`)
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

### 4. `Subject` Model (`backend/models/Subject.js`)
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

### 5. `Unit` Model (`backend/models/Unit.js`)
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

---

## 8. Complete API Reference

### Public Health Endpoints
| Method | Endpoint | Access Level | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Public | Root health check returning `{"status":"healthy","message":"API active"}`. |
| `GET` | `/api/health` | Public | API health check returning `{"status":"healthy","message":"API active"}`. |

### Authentication Routes (`/api/auth`)
| Method | Endpoint | Access Level | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public (Rate-limited: 10/hr) | Student self-registration. Validates password >= 8 chars and email/UID. Role is strictly locked to `student`. Returns HTTP 201 without issuing a session cookie. |
| `POST` | `/api/auth/login` | Public (Rate-limited: 15/15m)| Authenticates student or admin using email or College UID. Issues `studs_session` HttpOnly cookie. |
| `POST` | `/api/auth/logout` | Authenticated | Revokes session token in MongoDB and clears browser cookie. |
| `GET` | `/api/auth/me` | Authenticated | Returns current authenticated user profile (`id`, `email`, `uid`, `role`). |

### Authenticated Student Portal Routes (`/api`)
*Note: All portal data routes require a valid session cookie (`requireAuth`).*

| Method | Endpoint | Access Level | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/subjects/:semester` | Authenticated | Returns deduplicated, ordered subjects for semester and course. |
| `GET` | `/api/units/:subjectId` | Authenticated | Returns units and chapter outlines for the chosen subject. |
| `GET` | `/api/content/:chapterId` | Authenticated | Returns published chapter materials. Redacts drafts and unreleased quiz answers. Normalizes media URLs. |
| `GET` | `/api/search?q=...&semester=...` | Authenticated | Multi-tier ranked search across subjects, units, chapters, and notes with stemming and active semester boosts. |

### Student Quiz Routes (`/api/quiz`)
*Note: Requires authenticated student or admin session.*

| Method | Endpoint | Access Level | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/quiz/:chapterId/attempt` | Authenticated | Generates a 5-question random attempt with answers/explanations redacted. |
| `POST` | `/api/quiz/:chapterId/submit` | Authenticated | Validates student answers server-side and reveals scores and explanations. |

### Student Chapter-Aware RAG Doubt Solving Routes (`/api/doubt`)
*Note: Requires authenticated student or admin session. Rate-limited to 30 questions / 15m.*

| Method | Endpoint | Access Level | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/doubt/ask` | Authenticated | Chapter-scoped RAG doubt answering. Grounded strictly in verified textbook chunks with exact page citations (`[Page X]`). Rejects out-of-scope questions with insufficient-context status to prevent hallucination. |
| `GET` | `/api/doubt/status/:chapterId` | Authenticated | Inspects the chapter's vector indexing status, indexed chunk count, and source document metadata. |

### Admin Pipeline & Management Routes (`/api/admin`)
*All admin endpoints require session authentication with `content_admin` or `super_admin` role and trusted origin verification.*

| Method | Endpoint | Role Guard | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/admin/content/:chapterId/rag/index` | `content_admin`, `super_admin` | Safely chunks and embeds approved chapter PDF into 768-dim vector chunks with page boundaries. Deduplicates identical content hashes without re-embedding. |
| `GET` | `/api/admin/content/:chapterId/rag/status` | `content_admin`, `super_admin` | Inspects chapter vector indexing metrics and chunk counts. |
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

1. **Mandatory Authentication & Server-Enforced Role Lock**:
   - The student portal rejects unauthenticated data access.
   - Self-registration strictly binds the user to `role: 'student'`. Client-supplied role fields are discarded.
2. **Institutional College UID with Sparse Unique Indexing**:
   - `User.js` indexes `uid` with `{ unique: true, sparse: true }`.
   - Students can register and sign in with either a College UID (e.g. `22BCS10142`) or an institutional email address.
3. **Database-Backed Stateful Sessions with Peppered HMAC-SHA256**:
   - Replaces stateless JWTs with revocable database sessions.
   - 48-byte random tokens are stored exclusively as HMAC-SHA256 hashes combined with `SESSION_TOKEN_PEPPER`.
   - Raw tokens travel solely inside secure `HttpOnly` cookies.
4. **CHIPS Partitioned Cookies for Distributed Hosting**:
   - In production, session cookies are issued with `Partitioned: true` and `SameSite: 'none'`.
   - Enables seamless cookie transmission when the frontend (e.g., Vercel) and backend (e.g., Render) run on separate domains.
5. **Inactivity Eviction & Throttled Session Updates**:
   - `requireAuth` enforces a 3-day inactivity threshold (`INACTIVITY_TIMEOUT_MS = 3 * 24 * 60 * 60 * 1000`).
   - If an account is idle for > 3 days, the session is purged from MongoDB and cookies are cleared.
   - Active sessions update `lastUsedAt` throttled to once every 5 minutes.
6. **MongoDB TTL (Time-To-Live) Collections**:
   - `Session.js` declares an index on `expiresAt` with `{ expireAfterSeconds: 0 }`. MongoDB automatically purges expired records.
7. **Multi-Tier Relevance Search Ranking Algorithm**:
   - Scores items across Subjects, Units, Chapters, and Notes using exact matches, prefix matches, word stemming, all-tokens bonuses, subject code weighting (1.6x), and active semester bonuses.
8. **Staging Draft Isolation**:
   - AI generation writes directly to isolated draft fields (`draftStudyResources`, `draftQuizQuestions`, `draftFullNotesMarkdown`). The student API strips drafts, ensuring students only view verified, published curriculum content.
9. **Shortfall Reporting vs Hallucination Prevention**:
   - When source documents are brief, Gemini returns only verified questions and reports an explicit shortfall reason rather than inventing ungrounded examination questions.
10. **Chapter-Aware RAG Doubt Solving**:
    - Approved chapter PDFs are chunked into 768-dimensional vector embeddings (`text-embedding-004`) and stored in the `DocumentChunk` collection with page-boundary metadata.
    - Student doubt questions are embedded and matched against chapter vectors via cosine similarity.
    - Gemini answers are strictly grounded in retrieved chunks with exact `[Page X]` citations. Out-of-scope questions receive an explicit insufficient-context rejection instead of hallucinated answers.
11. **Semantic Chunking with Page Attribution**:
    - Notes are split into overlapping chunks (~600–1200 chars) respecting paragraph boundaries and preserving start/end page numbers, powering both the RAG system and future vector search.
12. **Defensive API Hardening**:
    - **Timing Attack Mitigation**: When verifying passwords, if a user identifier does not exist, bcrypt still runs against a constant dummy hash (`DUMMY_PASSWORD_HASH`) to prevent account enumeration.
    - **Explicit Database Targeting**: `server.js` connects with `{ dbName: process.env.MONGO_DB_NAME || 'StuDS' }`, preventing Atlas URIs from misrouting.
    - **Dynamic Media Normalization**: Localhost URLs in media attachments are dynamically rewritten to the active production host.

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
MONGO_DB_NAME=StuDS
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
- **Student Portal**: Open `http://localhost:5173` in your browser. If unauthenticated, you will be redirected to `/login`.
- **Student Registration**: Navigate to `http://localhost:5173/register` to create a student account using your College UID or email.
- **Admin Dashboard**: Open `http://localhost:5173/admin` and log in with your super-admin credentials.
- **Backend Health Check**: Open `http://localhost:5001/` to verify the API returns `{"status":"healthy","message":"API active"}`.

---

## 11. Automated Test Suites & Verification

STUDS provides comprehensive automated test suites located in `backend/scripts/`:

| Test Suite | Command | Coverage & Assertions |
| :--- | :--- | :--- |
| **Security Test Suite** (`securityTest.js`) | `node scripts/securityTest.js` | **42 test assertions**: Tests public health checks, unauthenticated 401 route rejection, login input validation, student registration journey (short password, bad identifier, valid registration, no premature auto-login cookie, College UID support, role injection prevention, duplicate conflict), student login & HttpOnly cookie issuance, authenticated student access, student-to-admin 403 role isolation, search accuracy & ranking regression (10 real test queries), admin super_admin login & privileges, and student logout with immediate session invalidation. |
| **Search Relevance Suite** (`testSearch.js`) | `node scripts/testSearch.js` | Verifies multi-tier scoring algorithm, query tokenization, suffix stemming, subject code multiplier, context matching, and active semester bonus. |
| **Safe PDF Pipeline Suite** (`testSafePdfPipeline.js`) | `node scripts/testSafePdfPipeline.js` | **37 test assertions across 8 groups**: Verifies PDF buffer loading, text extraction, printable character ratio checks, missing-resource detection, staging draft isolation, atomic publication promotion, retry without re-upload, shortfall reporting, and student answer redaction. |
| **Notes Cleaner Suite** (`testCleanedNotesWorkflow.js` & `testNoteCleaner.js`) | `node scripts/testCleanedNotesWorkflow.js` | Verifies boilerplate stripping, markdown table formatting, diagram preservation, and syllabus topic coverage calculation. |
| **Chapter-Aware RAG Suite** (`testRagWorkflow.js`) | `node scripts/testRagWorkflow.js` | **37 test assertions**: Verifies unauthenticated 401 rejection on doubt & RAG admin endpoints, student role isolation, input validation, vector retrieval relevance, page attribution (`[Page X]`), comparative query handling, anti-hallucination insufficient context guardrail, multi-turn follow-ups, and admin document deduplication. |
| **Chapter 1.1 Safe Ingestion & Verification** (`indexChapter1_1.js`) | `npm run index:ch1-1` | Safely chunks and embeds approved Chapter 1.1 PDF into 99 page-aware vector chunks without modifying or reseeding existing notes, quizzes, or resources. |
| **Study Resources Suite** (`testStudyResourcesWorkflow.js`) | `node scripts/testStudyResourcesWorkflow.js` | Verifies Gemini generation, missing-resource detection, 4-option MCQ structure, and shortfall alert handling. |
| **API Mapping Suite** (`test_api_mapping.js`) | `node scripts/test_api_mapping.js` | Validates API route mapping and endpoint connectivity across all registered routes. |
| **UID Index Cleaner** (`cleanUid.js`) | `node scripts/cleanUid.js` | Unsets null UID keys across the user collection to maintain sparse unique index integrity. |
| **Chapter 1.1 Audit & Backup** (`audit_chapter1_1_records.js`) | `npm run audit:ch1-1` | Audits Chapter 1.1 database records, verifies backups, and validates official curriculum data integrity. |

---

## 12. Overall Workflow Summary

```
[ Academic Administrator ]                                [ Student User ]
           |                                                     |
           v                                                     v
Logs in at `/admin`                                       Signs up at `/register` / Logs in at `/login`
           |                                                     |
Selects Department & Course                               Enters Portal at `/`
           |                                                     |
Uploads PDF/DOCX Lecture Notes                            Selects Branch & Semester
           |                                                     |
Runs Text Extraction & Cleaner                            Browses Syllabus Units
           |                                                     |
Triggers Safe AI Generator (Gemini)                       Selects Chapter
           |                                                     |
Reviews & Edits Staging Draft                             Reads Full Notes & AI Summary
           |                                                     |
Publishes Materials to Students                           Explores 4-in-1 Study Resources
           |                                                     |
           |                                              Views Past Papers in Embedded Iframe
           |                                                     |
           +-------------------> [ CONTENT ] <-------------------+
                                 AVAILABLE      Takes Interactive Quiz & Reviews Score
```

1. **Setup**: The college super-admin creates the subjects and units for each semester.
2. **Authoring & Ingestion**: Academic admins select a chapter, upload lecture PDFs or Word documents, and extract and clean the text.
3. **Safe AI Enhancement**: Admins trigger Gemini AI to create short notes, important topics, key definitions, revision guides, and practice MCQs into an isolated staging draft.
4. **RAG Indexing**: After publication, admins optionally run the RAG indexer (`POST /api/admin/content/:chapterId/rag/index`) to embed the approved PDF into 768-dim vector chunks for doubt-solving.
5. **Curation & Publication**: Admins inspect, edit, and approve the draft before executing an atomic publish.
6. **Student Authentication**: Students register via `/register` with their College UID or email and sign in on `/login`.
7. **Discovery**: Students configure their degree stream, select their semester, and access organized course materials.
8. **Search**: Students use `Ctrl + K` to search across all notes with weighted relevance scoring and jump straight to relevant concepts.
9. **Self-Assessment**: Students test their mastery using chapter-specific interactive quizzes with immediate score calculation and answer explanations.
10. **Doubt Solving**: Students ask textbook-grounded questions via `POST /api/doubt/ask`. Answers are cited with exact page references (`[Page X]`) from verified course PDFs.
