# STUDS – College Study Material Portal & Academic Management System

![React 19](https://img.shields.io/badge/React-19.2.6-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-8.0.14-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.3.0-38B2AC?logo=tailwind-css&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-LTS-339933?logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-5.2.1-000000?logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose_9.6.2-47A248?logo=mongodb&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Google_Gemini-2.0_%26_1.5_Flash-4285F4?logo=google&logoColor=white)
![Cloudinary](https://img.shields.io/badge/Cloudinary-Media_Cloud-3448C5?logo=cloudinary&logoColor=white)

---

## 📌 Table of Contents

1. [Project Overview](#-project-overview)
2. [Key Features](#-key-features)
3. [Technology Stack & Tools](#-technology-stack--tools)
   - [Frontend Technologies](#frontend-technologies)
   - [Backend Technologies](#backend-technologies)
   - [Database & Storage](#database--storage)
   - [AI & Cloud Services](#ai--cloud-services)
   - [Development & Testing Utilities](#development--testing-utilities)
4. [How the System Works (Architecture & Workflows)](#-how-the-system-works-architecture--workflows)
   - [System Architecture Diagram](#system-architecture-diagram)
   - [1. Student Portal Experience & Mandatory Authentication Flow](#1-student-portal-experience--mandatory-authentication-flow)
   - [2. Admin Learning Resources Studio (Protected Workflow)](#2-admin-learning-resources-studio-protected-workflow)
   - [3. Safe 10-Stage PDF-to-AI Generation Pipeline](#3-safe-10-stage-pdf-to-ai-generation-pipeline)
   - [4. Source Grounding, Shortfall Reporting & Hallucination Prevention](#4-source-grounding-shortfall-reporting--hallucination-prevention)
   - [5. Intelligent Notes Cleaner & Syllabus Coverage Engine](#5-intelligent-notes-cleaner--syllabus-coverage-engine)
   - [6. Secure Chapter Quiz Engine & Anti-Cheating Architecture](#6-secure-chapter-quiz-engine--anti-cheating-architecture)
   - [7. Semantic Text Chunking & RAG Preparation](#7-semantic-text-chunking--rag-preparation)
   - [8. Unified Authentication, Stateful Sessions & Partitioned Cookie Security](#8-unified-authentication-stateful-sessions--partitioned-cookie-security)
   - [9. Enhanced Global Command Search (`Ctrl + K`) Engine](#9-enhanced-global-command-search-ctrl--k-engine)
5. [Database Models & Schemas](#-database-models--schemas)
6. [API Endpoints Reference](#-api-endpoints-reference)
   - [Public Health & Root Endpoints](#public-health--root-endpoints)
   - [Authentication Endpoints (`/api/auth`)](#authentication-endpoints-apiauth)
   - [Student Portal Data Endpoints (`/api`)](#student-portal-data-endpoints-api)
   - [Student Quiz Practice Endpoints (`/api/quiz`)](#student-quiz-practice-endpoints-apiquiz)
   - [Admin Pipeline & Content Routes (`/api/admin`)](#admin-pipeline--content-routes-apiadmin)
7. [Project Directory Structure](#-project-directory-structure)
8. [Installation & Setup Guide](#-installation--setup-guide)
   - [Prerequisites](#prerequisites)
   - [Step 1: Clone Repository](#step-1-clone-repository)
   - [Step 2: Backend Environment Configuration](#step-2-backend-environment-configuration)
   - [Step 3: Install Backend Dependencies & Seed Data](#step-3-install-backend-dependencies--seed-data)
   - [Step 4: Create Initial Super-Admin Account](#step-4-create-initial-super-admin-account)
   - [Step 5: Launch Backend Server](#step-5-launch-backend-server)
   - [Step 6: Frontend Setup & Local Development](#step-6-frontend-setup--local-development)
   - [Accessing the Portal & Workflows](#accessing-the-portal--workflows)
9. [Automation Scripts & CLI Test Suites](#-automation-scripts--cli-test-suites)
10. [Security & Isolation Principles](#-security--isolation-principles)
11. [License](#-license)

---

## 📖 Project Overview

### What is STUDS?
**STUDS** is an enterprise-grade, full-stack educational study portal and academic management system created to streamline how college students discover, consume, and self-assess study materials, and how academic administrators publish and manage curriculum content.

### The Problem It Solves
In modern colleges and universities, academic resources are routinely scattered across ad-hoc Google Drive folders, messaging chats, disparate faculty blogs, and broken PDF links. Students struggle with:
- Locating syllabus-accurate materials matching their specific department, course branch, and semester.
- Inability to quickly revise high-yield concepts before mid-terms and finals.
- Missing or inaccessible Previous Year examination Question papers (PYQs).
- A lack of immediate self-evaluation tools to test comprehension chapter by chapter.
- Unauthenticated, chaotic distribution where study materials are exposed to unverified crawlers or stale copies.
- Messy administrative workflows with no single source of truth or content moderation.

### The Solution
STUDS eliminates fragmentation by enforcing a structured 6-tier academic taxonomy:  
$$\text{Department} \longrightarrow \text{Course / Specialization} \longrightarrow \text{Semester} \longrightarrow \text{Subject} \longrightarrow \text{Unit} \longrightarrow \text{Chapter}$$

For every single chapter, STUDS unifies **four coordinated study modules**:
1. **Comprehensive Study Material** – Textbook-level Markdown notes rendered via `react-markdown` and `remark-gfm`, PDF document download/preview attachments, and AI Chapter Synthesis.
2. **Key Study Resources (4-in-1 Hub)**:
   - **Short Notes**: High-yield takeaways for rapid review.
   - **Important Topics**: Key examination topics identified from the curriculum.
   - **Key Definitions**: Essential terminology and glossary definitions.
   - **Exam Revision Guide**: Structured revision notes with formulas, comparisons, and Markdown summary tables.
3. **Previous Years' Exam Papers (PYQs)** – Cloud-hosted, high-performance embedded PDF viewer sandboxed directly in the browser.
4. **Interactive Practice Quizzes** – Secure chapter quizzes with randomized 5-question attempts, server-side answer evaluation, score calculation, and detailed rationale feedback.

---

## ✨ Key Features

- **Mandatory Student Portal Authentication & College UID Support**:
  - Gated student access: All student portal views (`/`) and underlying curriculum data APIs (`/api/subjects`, `/api/units`, `/api/content`, `/api/search`, `/api/quiz`) require an authenticated session.
  - Dedicated authentication interfaces: Clean, responsive `/login` and `/register` pages with seamless return navigation (`state: { from }`).
  - Institutional College UID or Email login: Students can authenticate using either their official College UID / Roll Number (e.g. `22BCS10142`) or standard institutional email address.
  - Server-enforced student role lock: Registration strictly forces `role: 'student'`; client-side role injection or privilege escalation is prevented.
  - Safe registration UX journey: Successful registration creates the user and redirects to `/login` with a success banner without issuing premature auto-login cookies.
  - User profile menu: Header dropdown displaying user avatar initial, College UID / email, role badge, shortcut to the Admin Workspace (for admins/super-admins), and one-click session sign-out.
- **Enhanced Multi-Tier Search Ranking Algorithm**:
  - Unified search indexing across Subjects, Units, Chapters, and Academic Reference Notes with weighted relevance scoring.
  - Multi-tier matching formula:
    - Exact match (+1000)
    - Prefix match (+600)
    - Substring match (+400)
    - Word-level token matching with suffix stemming (e.g., stripping plural `s`) (+280 to +300)
    - All-tokens-matched bonus (+400)
    - Context bonus across combined Subject + Unit + Chapter strings (+200)
    - Subject code multiplier (1.6x)
    - Active semester boost (+80 points for items matching the user's active semester)
  - Visual token highlighting: Real-time regex highlighting of matching search tokens in titles, course codes, parent hierarchy breadcrumbs, and snippet text.
  - Keyboard navigation (`Ctrl + K` / `Cmd + K`, `↑`, `↓`, `Enter`, `Esc`) with color-coded classification badges (`subject`, `unit`, `chapter`, `resource`).
- **Safe 10-Stage PDF-to-AI Pipeline**:
  - Genuine PDF verification (magic bytes `%PDF-` and MIME check, up to 35MB).
  - Dual extraction: High-performance stream extraction via `pdf-parse` with automatic fallback to **Google Gemini Multimodal OCR** for scanned documents.
  - Source-text validation: Checks printable character ratio (>75%), minimum word threshold, and detects binary corruption.
  - Missing-resource detection: Generates only absent learning materials (`fullNotes`, `shortNotes`, `importantTopics`, `keyDefinitions`, `examRevisionNotes`, `quizQuestions`) to prevent overwriting existing assets.
  - Strict source grounding: AI synthesis is strictly constrained to extracted document text at low temperature (`0.2`).
  - Shortfall reporting: Reports factual shortfalls instead of hallucinating fake questions when source text is brief.
  - Staging draft isolation: Generated materials persist in staging drafts (`draftStudyResources`, `draftQuizQuestions`, `draftFullNotesMarkdown`) without altering published student-facing materials.
  - Admin Studio review: Content admins can review, edit, and fine-tune drafted questions, definitions, and revision notes.
  - Explicit atomic publication: One-click approval promotes validated drafts to production and synchronizes backward-compatible models.
  - Resilient retry: Failed generation attempts retain the original PDF and extracted text, enabling retries without re-uploading large assets.
- **Intelligent Note Cleaner & Syllabus Coverage Engine**:
  - Strips repetitive headers, footers, page markers (`-- 1 of 45 --`), and course boilerplate.
  - Converts section headers to clean hierarchical Markdown (`#`, `##`, `###`, `####`).
  - Auto-formats tabular sections into GitHub Flavored Markdown (GFM) tables.
  - Preserves ASCII / fixed-width network topology diagrams and architectural illustrations.
  - Verifies syllabus topic coverage against standard university curriculum guidelines.
- **Semantic Text Chunking for Future RAG / Embeddings**:
  - Splits extracted textbook notes into semantic paragraph chunks (~600–1200 characters) stored in MongoDB for future vector embeddings, citation indexing, and AI doubt solving.
- **Multi-Format Document Ingestion**:
  - Native PDF document handling via Multer in-memory streaming directly to Cloudinary.
  - Microsoft Word `.docx` file ingestion parsed via Mammoth into HTML and transformed into clean Markdown via Turndown.
- **Secure Chapter Quiz Practice Engine**:
  - Server-side question randomization: Pulls 5 distinct random questions per student attempt from the chapter question bank.
  - Cheating prevention: Server strips `correctAnswer` and `explanation` from the attempt payload.
  - Server-side score validation: Validates student answers against the database, tabulates percentage scores, and unlocks explanations post-submission.
- **Enterprise-Grade Stateful Session Security & CHIPS Partitioning**:
  - High-entropy cryptographic session tokens (48 random bytes).
  - Stored strictly as HMAC-SHA256 hashes using a server pepper secret (`SESSION_TOKEN_PEPPER`).
  - Zero sensitive tokens in browser `localStorage`.
  - Delivered via `HttpOnly`, `SameSite: 'lax'` (development) or `SameSite: 'none'` (production), and `Secure` cookies (`studs_session`).
  - Partitioned cookie support (`partitioned: true` / CHIPS) for seamless cross-domain deployments (e.g. Vercel frontend + Render backend).
  - Inactivity timeout: Automatic 3-day inactivity expiration with throttled `lastUsedAt` updates (every 5 minutes).
  - Native MongoDB TTL automatic session expiration without background cron jobs.
  - Constant-time bcrypt credential verification to neutralize user enumeration timing attacks.
  - Rate limiting (15 login attempts / 15 minutes, 10 registrations / hour) on authentication routes.
  - CORS normalization supporting multi-origin environment configurations with trailing slash cleanup.
  - Explicit database name fallback (`dbName: 'StuDS'`) protecting MongoDB Atlas connection strings.
  - Dynamic media URL normalizer resolving localhost / 127.0.0.1 paths into live host domains for production PDF streaming.
- **Fine-Grained Role-Based Access Control (RBAC)**:
  - `student`: Authenticated read-only access to published university curricula, notes, and interactive quizzes.
  - `content_admin`: Full access to upload PDFs/DOCX, trigger AI resource generation, edit staging drafts, and publish materials.
  - `super_admin`: Complete platform control including subject creation, syllabus unit structuring, and administrative account management.
- **Modern Responsive UI / UX**:
  - Tailwind CSS v4 design system with smooth micro-interactions.
  - Seamless Light and Dark mode toggle with `localStorage` persistence.
  - Accessible hover elevations, keyboard focus rings, and `prefers-reduced-motion` compliance.

---

## 🛠 Technology Stack & Tools

### Frontend Technologies
| Tool / Library | Version | Role in Project |
| :--- | :--- | :--- |
| **React** | `^19.2.6` | Declarative UI library powering reactive component state and rendering trees. |
| **Vite** | `^8.0.14` | High-speed frontend build tool and dev server with instant Hot Module Replacement (HMR). |
| **Tailwind CSS v4** | `^4.3.0` | Utility-first CSS engine powering the dark/light design system and responsive layouts. |
| **@tailwindcss/vite** | `^4.3.0` | Official Vite plugin integrating the Tailwind CSS v4 compiler directly into the build pipeline. |
| **React Router DOM** | `^7.15.1` | Client-side routing managing navigation between student portal (`/`), auth pages (`/login`, `/register`), and admin dashboard (`/admin`). |
| **React Markdown** | `^10.1.0` | Safely parses and renders Markdown strings into structured HTML for notes and revision summaries. |
| **Remark GFM** | `^4.0.1` | Remark plugin adding GitHub Flavored Markdown support (tables, strikethrough, autolinks, task lists). |
| **Lucide React** | `^1.16.0` | Crisp SVG icon set for clean navigational controls, status badges, and visual indicators. |

### Backend Technologies
| Tool / Library | Version | Role in Project |
| :--- | :--- | :--- |
| **Node.js** | LTS (v18+) | Server-side JavaScript runtime environment executing the backend REST APIs. |
| **Express.js** | `^5.2.1` | Minimalist web framework handling routing, middleware pipelines, and HTTP controllers. |
| **Cookie-Parser** | `^1.4.7` | Parses incoming HTTP request `Cookie` headers into `req.cookies` to extract session tokens. |
| **CORS** | `^2.8.6` | Configures Cross-Origin Resource Sharing with normalized multi-origin whitelisting and cookie support. |
| **Bcrypt** | `^6.0.0` | Industry-standard password hashing algorithm (cost factor 12) for account protection. |
| **Express-Rate-Limit** | `^8.6.2` | Brute-force protection on authentication endpoints (15 logins / 15m, 10 registrations / hour). |
| **Multer** | `^2.1.1` | In-memory multipart/form-data handler for PDF and DOCX document uploads (up to 35MB). |
| **pdf-parse** | `^2.4.5` | Fast in-memory PDF stream parser for high-throughput text extraction from uploaded textbook notes. |
| **tesseract.js** | `^7.0.0` | Client/server OCR engine for optical character recognition on scanned academic documents. |
| **Mammoth** | `^1.13.0` | Reads `.docx` files in-memory and converts them into structured HTML. |
| **Turndown** | `^7.2.4` | Converts HTML markup generated from Word documents into clean Markdown. |
| **Dotenv** | `^17.4.2` | Loads environment configurations and secrets from `.env` into `process.env`. |
| **Nodemon** | `^3.1.14` | Hot-reload development daemon that restarts the Node server upon code changes. |

### Database & Storage
| Tool / Technology | Version | Role in Project |
| :--- | :--- | :--- |
| **MongoDB** | `^6.0+` | NoSQL document database providing flexible document modeling, text indexing, and TTL support. |
| **Mongoose** | `^9.6.2` | Object Data Modeling (ODM) library providing validation, schemas, and queries. Locked to `StuDS` database. |
| **MongoDB TTL Index** | Built-in | Background thread automatically purges expired session records (`expireAfterSeconds: 0`). |
| **MongoDB Text Index** | Built-in | Compound full-text search indexes on notes and revision summaries with relevance scoring. |
| **Sparse Unique Index** | Built-in | Enforces uniqueness on College UID (`uid`) while allowing null values for legacy or admin accounts. |

### AI & Cloud Services
| Service / SDK | Version | Role in Project |
| :--- | :--- | :--- |
| **Google Generative AI (`@google/generative-ai`)** | `^0.24.1` | Multi-model integration with **Google Gemini 2.0 Flash / 1.5 Flash / 1.5 Pro** for source-grounded learning resource synthesis and multimodal PDF OCR. |
| **Cloudinary (`cloudinary`)** | `^2.10.0` | Cloud media storage holding raw exam PDF files and uploaded course notes documents. |

### Development & Testing Utilities
| Utility / Test Suite | Path | Role in Project |
| :--- | :--- | :--- |
| **Security Test Suite** | `backend/scripts/securityTest.js` | 42-point automated verification testing authentication, student registration, College UID support, role spoofing prevention, session revocation, and search ranking regression. |
| **Safe PDF Pipeline Suite** | `backend/scripts/testSafePdfPipeline.js` | 37-point automated verification across 8 test groups verifying extraction, validation, staging isolation, and atomic publication. |
| **Search Relevance Suite** | `backend/scripts/testSearch.js` | Automated verification of query tokenization, suffix stemming, semester boost, and relevance scoring thresholds. |
| **Notes Cleaner Suite** | `backend/scripts/testCleanedNotesWorkflow.js` | Verifies boilerplate stripping, markdown table formatting, and syllabus coverage verification. |
| **Study Resources Suite** | `backend/scripts/testStudyResourcesWorkflow.js` | Verifies Gemini generation, missing-resource detection, and quiz validation. |
| **UID Index Cleaner** | `backend/scripts/cleanUid.js` | Unsets null UID keys across the user collection to maintain sparse unique index integrity. |
| **Chapter 1.1 Audit & Backup** | `backend/scripts/audit_chapter1_1_records.js` | Validates data consistency, verified backup JSON files, and ensures official curriculum assets remain intact. |

---

## ⚙️ How the System Works (Architecture & Workflows)

### System Architecture Diagram

```
+-------------------------------------------------------------------------------------------------------------------------+
|                                                    CLIENT BROWSER                                                       |
|                                                                                                                         |
|   +----------------------------------------------------+    +-------------------------------------------------------+   |
|   |          STUDENT AUTHENTICATION & PORTAL           |    |             ADMIN DASHBOARD (AdminDashboard)          |   |
|   |  - LoginPage (/login) & RegisterPage (/register)   |    |  - Cascading 6-Tier Academic Selector                 |   |
|   |  - Mandatory Auth Gate (Redirect with return path) |    |  - Document Upload (PDF / DOCX with Cloudinary/Multer)|   |
|   |  - Student Profile Dropdown (UID, Role, Sign Out)  |    |  - Text Extraction & Notes Cleaner Studio             |   |
|   |  - Course Selector (localStorage)                  |    |  - Safe AI Resource Generator (Gemini 2.0/1.5 Flash)  |   |
|   |  - Semester Subject Accordion                      |    |  - Staging Draft Studio & 20-MCQ Question Bank Editor |   |
|   |  - Tab 1: Study Material (Markdown + Attachments)  |    |  - Atomic Publication Guard & Rollback Safety         |   |
|   |  - Tab 2: Study Resources (Short/Topics/Defs/Rev)  |    |  - Session Auth Gate (HttpOnly Cookie)                |   |
|   |  - Tab 3: Past Papers (Embedded Cloudinary PDF)    |    +-------------------------------------------------------+   |
|   |  - Tab 4: Practice Quiz (Random 5 MCQs + Scoring)  |                                                                |
|   |  - Enhanced Command Search (Ctrl+K + Stemming)     |                                                                |
|   +----------------------------------------------------+                                                                |
+-------------------------------------------------------------------------------------------------------------------------+
                                 |                                                                 |
            HTTP (HttpOnly Cookie: studs_session, credentials)                HTTP (HttpOnly Cookie: studs_session, credentials)
                                 v                                                                 v
+-------------------------------------------------------------------------------------------------------------------------+
|                                                EXPRESS BACKEND (Node.js)                                                |
|                                                                                                                         |
|   [CORS Normalized Whitelist] ---> [cookieParser] ---> [Rate Limiter] ---> [requireAuth (3-day idle)] ---> [requireRole]|
|                                                                                                                         |
|   +----------------------------------------------------+    +-------------------------------------------------------+   |
|   |          PUBLIC HEALTH & ROOT ENDPOINTS            |    |              PROTECTED ROUTES (/api/admin)            |   |
|   |  GET  /              (API status: healthy)         |    |  POST /subject                (super_admin)           |   |
|   |  GET  /api/health    (API status: healthy)         |    |  POST /unit                   (super_admin)           |   |
|   |                                                    |    |  POST /content/upsert         (content_admin)         |   |
|   |              AUTH ROUTES (/api/auth)               |    |  POST /upload-pdf             (Cloudinary stream)     |   |
|   |  POST /register      (Student self-signup, 10/hr)  |    |  POST /upload-notes-pdf       (Multer + Cloudinary)   |   |
|   |  POST /login         (Email or College UID, 15/15m)|    |  POST /upload-document        (Mammoth DOCX parser)   |   |
|   |  POST /logout        (Session purge + clear cookie)|    |  POST /extract-pdf-text       (pdf-parse / Gemini OCR)|   |
|   |  GET  /me            (Profile: id, email, uid, role|    |  POST /clean-extracted-text   (noteCleanerService)    |   |
|   |                                                    |    |  GET  /content/:id/pipeline/status (Pipeline Monitor) |   |
|   |          AUTHENTICATED PORTAL ROUTES (/api)        |    |  POST /content/:id/pipeline/generate (Staging Draft)  |   |
|   |  GET  /subjects/:semester (Filtered by course/sem) |    |  PUT  /content/:id/draft      (Admin Manual Edit)     |   |
|   |  GET  /units/:subjectId                            |    |  POST /content/:id/pipeline/publish (Atomic Promote)  |   |
|   |  GET  /content/:chapterId (Drafts & answers redacted    |                                                       |
|   |  GET  /search?q=...&semester=... (Weighted scoring)|                                                           |
|   |                                                    |                                                           |
|   |              QUIZ ROUTES (/api/quiz)               |                                                           |
|   |  GET  /quiz/:chapterId/attempt (Random 5 MCQs)     |                                                           |
|   |  POST /quiz/:chapterId/submit  (Score & Explain)   |                                                           |
|   +----------------------------------------------------+    +-------------------------------------------------------+   |
+-------------------------------------------------------------------------------------------------------------------------+
                                 |                                                                 |
                  Mongoose Queries & Aggregations                                       External Cloud Services
                                 v                                                                 v
+--------------------------------------------------------+        +-------------------------------------------------------+
|                    MONGODB DATABASE                    |        |                EXTERNAL CLOUD SERVICES                |
|  - Users     (Bcrypt hashes, College UID sparse index) |        |                                                       |
|  - Sessions  (HMAC-SHA256 tokens, 7d TTL, 3d idle check|        |  - Cloudinary: Raw PDF Document Storage & CDN         |
|  - Subjects  (Catalog, codes, semester indexing)       |        |  - Google Gemini: 2.0 Flash / 1.5 Flash / 1.5 Pro     |
|  - Units     (Syllabus units, chapters, contact hours) |        |    (Source-Grounded Resource Generation & OCR)        |
|  - Contents  (Published materials, staging drafts,     |        +-------------------------------------------------------+
|               semantic chunks, pipeline status)        |
+--------------------------------------------------------+
```

---

### 1. Student Portal Experience & Mandatory Authentication Flow

1. **Authentication Check & Gatekeeper**:
   - On initial launch of the student portal (`/`), the app checks for an active session by calling `getCurrentUser()` (`GET /api/auth/me`).
   - If unauthenticated, the user is redirected to `/login`, preserving the attempted route (`state: { from: location }`).
2. **Student Self-Registration & Sign-In Journey**:
   - New students navigate to `/register` and provide their College UID (e.g., `22BCS10142`) or institutional email, and a secure password (minimum 8 characters).
   - The backend validates the identifier format, hashes the password via bcrypt (salt rounds: 12), and hardcodes `role: 'student'`.
   - Upon successful registration (HTTP 201), the student is redirected to `/login` with a green confirmation banner. An authenticated session cookie is purposefully **not** issued at registration to verify sign-in credentials.
   - On `/login`, students authenticate with their UID or email. Upon success, an `HttpOnly` session cookie (`studs_session`) is set and the user is redirected back to their destination.
3. **Student Profile & Navigation Menu**:
   - The top header navbar displays the authenticated student's avatar initial and UID/email.
   - Clicking the user button opens a menu showing their full email, role badge (`student`), a direct shortcut to the Admin Workspace (if permitted), and a "Sign Out" button that clears the session cookie and redirects to `/login`.
4. **Course Configuration**:
   - The portal checks `localStorage` for `userCourse`. If not set, a modal prompts the student to select their Department (e.g., `Engineering (B.E./M.E.)`) and Specialization (e.g., `Computer Science (CSE)`).
   - This choice is persisted in `localStorage` and drives dynamic subject filtering.
5. **Semester & Curriculum Drill-Down**:
   - The user selects a semester tab (Semester 1 through 8).
   - The portal calls `fetchSubjectsBySemester(semester, course)`.
   - The backend returns deduplicated, clean subjects ordered according to curriculum sequence.
   - Clicking a subject accordion calls `fetchUnitsBySubject(subjectId)` to render syllabus units and chapters.
6. **Coordinated Study Modules**:
   - Clicking a chapter invokes `fetchContentByChapter(chapterId)`:
     - **Tab 1: Study Material**: Textbook-level formatted Markdown notes rendered via `ReactMarkdown` and `remark-gfm`. AI summaries are featured in an "AI Chapter Synthesis" banner. Published notes include PDF/DOCX attachments with local-to-production URL normalization.
     - **Tab 2: Study Resources**: 4-in-1 study resource hub (Short Notes, Important Topics, Key Definitions, Exam Revision Guide).
     - **Tab 3: Past Papers (PYQs)**: Historical exam papers indexed by year, rendered in a sandboxed iframe streamed via Cloudinary.
     - **Tab 4: Practice Quiz**: Randomized 5-question multiple-choice practice attempt with server-side grading and instant rationale review.
7. **Theme Persistence**:
   - A single-click toggle switches between Light and Dark mode, applying `.dark` to `document.documentElement` and saving the preference in `localStorage`.

---

### 2. Admin Learning Resources Studio (Protected Workflow)

1. **Gatekeeper & Session Validation**:
   - Navigating to `/admin` invokes `getCurrentUser()` (`GET /api/auth/me`).
   - If unauthenticated or if the role is not `content_admin` or `super_admin`, access is denied with a 403 Forbidden.
2. **Strict 6-Level Cascading Selector**:
   - To eliminate orphaned data in MongoDB, the dashboard enforces a strict cascading state machine:
     $$\text{Department} \longrightarrow \text{Course} \longrightarrow \text{Semester} \longrightarrow \text{Subject} \longrightarrow \text{Unit} \longrightarrow \text{Chapter}$$
   - Changing any higher-level item instantly resets all lower-level selections.
3. **Document Ingestion & Text Extraction**:
   - Admins upload PDF or DOCX lecture notes.
   - Text is extracted via `extractPdfText` (`POST /api/admin/extract-pdf-text`) and cleaned using `cleanExtractedText` (`POST /api/admin/clean-extracted-text`).
   - Cleaned Markdown, extraction statistics, and syllabus coverage percentages are presented in an interactive editor.
4. **AI Generation into Staging Draft**:
   - Admins trigger AI generation (`POST /api/admin/content/:chapterId/pipeline/generate`).
   - Gemini synthesizes full notes, short notes, topics, definitions, revision guides, and up to 20 MCQs into isolated staging draft fields (`draftStudyResources`, `draftQuizQuestions`, `draftFullNotesMarkdown`).
   - Published resources visible to students remain completely unchanged.
5. **Manual Review & Editing**:
   - Admins can inspect and modify draft resources in the Learning Resources Studio.
   - Draft edits are saved via `PUT /api/admin/content/:chapterId/draft`.
6. **Explicit Atomic Publication**:
   - Clicking **Approve & Publish to Students** triggers `POST /api/admin/content/:chapterId/pipeline/publish`.
   - The backend validates all questions, promotes staging drafts to published status, syncs backward-compatible fields (`shortNotes`, `quizData`), and clears staging drafts in an atomic MongoDB operation.

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

1. **Stage 1 (Upload & Validation)**: Validates genuine PDF magic bytes (`%PDF-`) and enforces a 35MB ceiling.
2. **Stage 2 (Text Extraction & OCR)**: Parses text streams using `pdf-parse`. If the document is a scanned image with no text layer, automatically invokes Google Gemini Multimodal OCR.
3. **Stage 3 (Source Validation)**: Analyzes printable character ratios (>75%) and word density to reject binary corrupted files.
4. **Stage 4 (Missing Detection)**: Checks which resources already exist so the system does not regenerate or overwrite existing valid assets unless explicitly instructed.
5. **Stage 5 (Source Grounding)**: Prompts Gemini with strict system instructions to derive content solely from the provided text.
6. **Stage 6 (Structured Output Validation)**: Validates MCQ options (exactly 4 distinct choices), verifies verbatim correct answers, deduplicates questions, and records shortfall notices if fewer than 20 questions can be strictly supported.
7. **Stage 7 (Staging Isolation)**: Saves generated resources to `draftStudyResources`, `draftQuizQuestions`, and `draftFullNotesMarkdown`. The student API filters these out, keeping student views safe.
8. **Stage 8 (Admin Review)**: Provides an interactive studio interface where admins can edit, add, or delete drafted questions and notes.
9. **Stage 9 (Atomic Publication)**: Validates the draft question bank, assigns published status, updates `studyResources` and `quizQuestions`, and clears drafts atomically.
10. **Stage 10 (Fault Tolerance & Retry)**: If generation fails, the original PDF and extracted text are preserved, allowing administrators to retry without re-uploading large PDF assets.

---

### 4. Source Grounding, Shortfall Reporting & Hallucination Prevention

A common failure in academic AI systems is **hallucination**—inventing examination questions or definitions when the source document is brief or lacks detail. STUDS enforces strict safeguards:
- **Temperature Control (`0.2`)**: Gemini runs at low temperature to favor factual reproduction over creative extrapolation.
- **Shortfall Reporting**: If an uploaded PDF chapter supports only 12 legitimate questions, Gemini returns 12 questions and populates `shortfallReason`:
  > *"The provided source text (8,420 characters) supported 12 distinct, verified questions without hallucinating duplicate or ungrounded questions."*
- **Shortfall Notice Banner**: The admin dashboard renders a dedicated amber alert notifying admins of the shortfall, allowing them to manually add questions or supply additional reference text.

---

### 5. Intelligent Notes Cleaner & Syllabus Coverage Engine

Raw text extracted from PDFs often suffers from header contamination, broken line breaks, and missing formatting. The STUDS Note Cleaner (`backend/services/noteCleanerService.js`) resolves this:
- **Boilerplate Removal**: Regular expressions strip running headers, footers, and page counters (`-- 1 of 45 --`).
- **Markdown Header Hierarchy**: Maps document outlines into semantic Markdown headings (`#`, `##`, `###`, `####`).
- **Table Transformation**: Detects tabular data and aligns columns into valid GitHub Flavored Markdown tables.
- **Diagram Preservation**: Preserves ASCII network topologies and system architecture charts in fixed-width Markdown code blocks.
- **Syllabus Coverage Verification**: Cross-references cleaned notes against predefined syllabus topics (e.g., Semester 5 Computer Networks: OSI Model, TCP/IP, Routing Protocols) and computes a coverage percentage.

---

### 6. Secure Chapter Quiz Engine & Anti-Cheating Architecture

Traditional client-side quiz applications expose correct answers in JavaScript state or browser network payloads. STUDS implements a secure two-phase quiz protocol:

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

### 7. Semantic Text Chunking & RAG Preparation

Extracted chapter text is automatically partitioned by `pdfTextExtractor.js` into semantic chunks (~600–1200 characters) preserving paragraph boundaries. Each chunk records:
- `chunkIndex`: Positional index within the document.
- `text`: Cleaned academic text content.
- `wordCount`: Word count per chunk.

These chunks are stored in `notes.$.extractedChunks` within MongoDB, providing the foundation for future vector embeddings, retrieval-augmented generation (RAG), and cited doubt solving.

---

### 8. Unified Authentication, Stateful Sessions & Partitioned Cookie Security

STUDS avoids insecure stateless JWT implementations in `localStorage` in favor of **database-backed, stateful sessions** for both students and administrators:

1. **Registration & Role Safety**:
   - `POST /api/auth/register` validates identifier format (either standard email or College UID regex `^[a-zA-Z0-9_-]{3,30}$`).
   - Passwords must be at least 8 characters long.
   - User role is unconditionally hardcoded to `student` on the server, rejecting any client attempt to supply admin roles.
   - Rate limiting: Restricted to 10 registrations per IP per hour.
   - No auto-login cookie: Registration returns HTTP 201 so the user signs in deliberately.
2. **Constant-Time Verification**:
   - `POST /api/auth/login` checks the user database by email or College UID.
   - If the user does not exist, `bcrypt.compare` runs against a dummy hash (`DUMMY_PASSWORD_HASH`) to prevent timing attacks.
   - Rate limiting: Restricted to 15 login attempts per 15 minutes.
3. **Token Generation & Peppered HMAC**:
   - The server creates a cryptographically secure 48-byte random token (`crypto.randomBytes(48).toString('base64url')`).
   - The database stores **only** an HMAC-SHA256 hash of this token combined with the server pepper (`SESSION_TOKEN_PEPPER`).
4. **Partitioned Cookie Issuance (CHIPS)**:
   - Raw tokens travel strictly inside the `studs_session` cookie:
     - `HttpOnly: true` (Inaccessible to JavaScript, immune to XSS)
     - `SameSite: 'lax'` (development) or `'none'` (production)
     - `Secure: true` (enforced in production over HTTPS)
     - `Partitioned: true` (CHIPS support for cross-domain decoupled hosting like Vercel + Render)
     - `Path: '/'`
     - `maxAge: 7 days` (configurable via `SESSION_TTL_DAYS`)
5. **Inactivity Expiration (3-Day Idle Window)**:
   - `requireAuth` verifies whether `lastUsedAt` exceeds 3 days (`INACTIVITY_TIMEOUT_MS = 3 * 24 * 60 * 60 * 1000`).
   - Idle sessions are instantly destroyed in MongoDB and cookies cleared.
   - Active sessions update `lastUsedAt` throttled to once every 5 minutes.
6. **Automatic Cleanup (MongoDB TTL)**:
   - `Session` collection contains a TTL index: `sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })`.
   - MongoDB automatically removes expired sessions from disk without any cron job.
7. **Logout**:
   - `POST /api/auth/logout` deletes the session from MongoDB and clears the browser cookie.

---

### 9. Enhanced Global Command Search (`Ctrl + K`) Engine

1. The user presses `Ctrl + K` (or `Cmd + K`) or clicks the search bar in the header.
2. The user types a query; `CommandSearch.jsx` employs a **200ms debounce** to prevent server query flooding.
3. The request hits `GET /api/search?q={query}&semester={selectedSemester}`.
4. The backend tokenizes the query, strips common grammatical suffixes (word stemming), and scores matches across:
   - **Subjects**: Subject code (1.6x multiplier) and Subject Name.
   - **Units**: Unit Number and Unit Name.
   - **Chapters**: Chapter Name, cleaned title, and full context string.
   - **Published Notes**: Document title and academic reference metadata.
5. **Relevance Scoring Breakdown**:
   - Exact match: `+1000`
   - Prefix match: `+600`
   - Substring match: `+400`
   - Token match with stem: `+280` to `+300`
   - All tokens matched: `+400`
   - Combined context match: `+200`
   - Current semester boost: `+80`
6. Results are sorted in descending order of score and returned as a top-15 ranked array.
7. `CommandSearch.jsx` highlights matching query tokens using inline regex styling, supports full keyboard navigation (`↑`, `↓`, `Enter`, `Esc`), and navigates directly to the matched resource.

---

## 🗄 Database Models & Schemas

### 1. `User` Model (`backend/models/User.js`)
```javascript
const userSchema = new mongoose.Schema({
  email:        { type: String, required: true, lowercase: true, maxlength: 254 },
  uid:          { type: String, trim: true, maxlength: 50 }, // College UID / Roll No (e.g. 22BCS10142)
  passwordHash: { type: String, required: true, select: false },
  role:         { type: String, enum: ['student', 'content_admin', 'super_admin'], default: 'student', index: true },
  isActive:     { type: Boolean, default: true, index: true },
  lastLoginAt:  { type: Date, default: null }
}, { timestamps: true });

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ uid: 1 }, { unique: true, sparse: true }); // Sparse allows null for non-UID users

userSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id.toString(),
    email: this.email,
    uid: this.uid || null,
    role: this.role,
  };
};
```

### 2. `Session` Model (`backend/models/Session.js`)
```javascript
const sessionSchema = new mongoose.Schema({
  tokenHash:  { type: String, required: true, unique: true, select: false }, // HMAC-SHA256 with pepper
  userId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  expiresAt:  { type: Date, required: true }, // Absolute lifetime (7 days)
  lastUsedAt: { type: Date, required: true }, // Verified against 3-day inactivity threshold
  userAgent:  { type: String, maxlength: 512, default: null },
  ipAddress:  { type: String, maxlength: 128, default: null }
}, { timestamps: true });

sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // MongoDB TTL auto-cleanup
```

### 3. `Content` Model (`backend/models/Content.js`)
```javascript
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
// Compound Index: { subjectId: 1, unitNumber: 1 }
```

---

## 📡 API Endpoints Reference

### Public Health & Root Endpoints
| Method | Endpoint | Access Level | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Public | Root health check returning `{"status":"healthy","message":"API active"}`. |
| `GET` | `/api/health` | Public | API health check returning `{"status":"healthy","message":"API active"}`. |

### Authentication Endpoints (`/api/auth`)
| Method | Endpoint | Access Level | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public (Rate-limited: 10/hr) | Student self-registration with password >= 8 chars and College UID or email. Returns HTTP 201 without issuing cookie. |
| `POST` | `/api/auth/login` | Public (Rate-limited: 15/15m)| Authenticates student or admin using email or College UID. Issues `studs_session` HttpOnly cookie. |
| `POST` | `/api/auth/logout` | Authenticated | Revokes session token in MongoDB and clears browser cookie. |
| `GET` | `/api/auth/me` | Authenticated | Returns current authenticated user profile (`id`, `email`, `uid`, `role`). |

### Student Portal Data Endpoints (`/api`)
*Note: All student portal data routes require a valid authenticated session (`requireAuth`).*

| Method | Endpoint | Query / Body Params | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/subjects/:semester` | `?course=...` | Fetches deduplicated, ordered subjects for the specified semester and course. |
| `GET` | `/api/units/:subjectId` | — | Fetches syllabus units and chapters for the chosen subject. |
| `GET` | `/api/content/:chapterId` | — | Fetches published chapter materials. Redacts draft staging fields and unreleased quiz answers. Normalizes media URLs. |
| `GET` | `/api/search` | `?q=...&semester=...` | Multi-tier ranked search across subjects, units, chapters, and notes with stemming and semester boost. |

### Student Quiz Practice Endpoints (`/api/quiz`)
*Note: Requires authenticated student or admin session.*

| Method | Endpoint | Access Level | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/quiz/:chapterId/attempt` | Authenticated | Pulls 5 random questions from chapter question bank with answers and explanations redacted. |
| `POST` | `/api/quiz/:chapterId/submit` | Authenticated | Validates student answers server-side, calculates percentage score, and reveals explanations. |

### Admin Pipeline & Content Routes (`/api/admin`)
*All admin endpoints require valid session authentication with `content_admin` or `super_admin` role and trusted origin verification.*

| Method | Endpoint | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/admin/subject` | `super_admin` | Creates a new subject under a department and course. |
| `POST` | `/api/admin/unit` | `super_admin` | Creates a new unit and its chapters under a subject. |
| `POST` | `/api/admin/content/upsert` | `content_admin`, `super_admin` | Atomically creates or updates chapter content. |
| `GET` | `/api/admin/content/:chapterId/notes` | `content_admin`, `super_admin` | Retrieves all notes (including drafts) for a chapter. |
| `POST` | `/api/admin/content/:chapterId/notes` | `content_admin`, `super_admin` | Creates a new study note entry under a chapter. |
| `PUT` | `/api/admin/content/:chapterId/notes/:noteId` | `content_admin`, `super_admin` | Updates title, content, or published status of a note. |
| `DELETE` | `/api/admin/content/:chapterId/notes/:noteId` | `content_admin`, `super_admin` | Deletes a study note. |
| `POST` | `/api/admin/upload-pdf` | `content_admin`, `super_admin` | Streams a PDF past paper to Cloudinary and returns its secure URL. |
| `POST` | `/api/admin/upload-notes-pdf` | `content_admin`, `super_admin` | Uploads and replaces notes PDF attachment with Cloudinary streaming. |
| `POST` | `/api/admin/upload-document` | `content_admin`, `super_admin` | Uploads DOCX/PDF/MD, parses DOCX to Markdown, streams to Cloudinary. |
| `POST` | `/api/admin/extract-pdf-text` | `content_admin`, `super_admin` | Server-side PDF extraction via `pdf-parse` with Gemini OCR fallback (Stage 2 & 3). |
| `POST` | `/api/admin/clean-extracted-text` | `content_admin`, `super_admin` | Cleans raw text into structured Markdown and runs syllabus verification. |
| `GET` | `/api/admin/content/:id/pipeline/status` | `content_admin`, `super_admin` | Returns complete pipeline, extraction, draft staging, and published overview. |
| `POST` | `/api/admin/content/:id/pipeline/generate` | `content_admin`, `super_admin` | Synthesizes missing or targeted resources into staging drafts via Gemini. |
| `POST` | `/api/admin/content/:id/pipeline/retry` | `content_admin`, `super_admin` | Re-attempts generation from existing extracted text without re-uploading. |
| `PUT` | `/api/admin/content/:id/draft` | `content_admin`, `super_admin` | Saves admin manual edits to staging draft without publishing to students. |
| `POST` | `/api/admin/content/:id/pipeline/publish` | `content_admin`, `super_admin` | Explicit atomic promotion of approved draft to published student view. |
| `GET` | `/api/admin/content/:id/study-resources` | `content_admin`, `super_admin` | Inspects existing resources, draft staging, and question bank. |
| `POST` | `/api/admin/generate-summary` | `content_admin`, `super_admin` | Synthesizes chapter markdown into a 5-point summary via Google Gemini. |

---

## 📂 Project Directory Structure

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
│   ├── server.js                       # Express app entry point, MongoDB connection & CORS
│   ├── backups/                        # Verified JSON audit backups of official curriculum
│   ├── config/
│   │   ├── auth.js                     # Token generation, HMAC hashing, cookie configuration
│   │   ├── cloudinary.js               # Cloudinary SDK client setup
│   │   └── gemini.js                   # Google Gemini Generative AI client setup
│   ├── controllers/
│   │   └── contentController.js        # Content upserting and Notes CRUD controller
│   ├── db/                             # Local standalone MongoDB storage folder
│   ├── middleware/
│   │   ├── authMiddleware.js           # requireAuth (3-day idle), requireRole, requireTrustedOrigin
│   │   └── uploadMiddleware.js         # Multer in-memory storage & PDF/DOCX MIME filter
│   ├── models/
│   │   ├── Content.js                  # Chapter materials, notes, quizzes, PYQs, drafts schema
│   │   ├── Session.js                  # Database-backed session schema with TTL index & lastUsedAt
│   │   ├── Subject.js                  # Subject schema with department & semester indexing
│   │   ├── Unit.js                     # Unit and chapter sub-document schemas
│   │   └── User.js                     # User schema with College UID (sparse unique), email, roles
│   ├── routes/
│   │   ├── adminRoutes.js              # Protected administrative & pipeline studio endpoints
│   │   ├── authRoutes.js               # Authentication routes (register, login, logout, /me)
│   │   └── portalRoutes.js             # Authenticated student portal query, search & quiz routes
│   ├── services/
│   │   ├── aiService.js                # Google Gemini 1.5 Flash 5-point summarization logic
│   │   ├── curatedCurriculum.js        # Verified curriculum package for Computer Networks Ch 1.1
│   │   ├── noteCleanerService.js       # Notes cleaner & syllabus coverage verification
│   │   ├── pdfTextExtractor.js         # Dual extraction (pdf-parse / Gemini OCR) & semantic chunking
│   │   ├── pipelineService.js          # 10-stage safe PDF-to-AI pipeline orchestration
│   │   └── studyResourcesService.js    # Grounded Gemini generation, shortfall reporting, MCQ check
│   └── scripts/
│       ├── audit_chapter1_1_records.js # Curriculum data consistency and audit verification tool
│       ├── cleanUid.js                 # Database maintenance tool unsetting null UIDs
│       ├── createSuperAdmin.js         # CLI tool to securely initialize the first super-admin
│       ├── importDocx.js               # Utility script to test Mammoth DOCX to Markdown conversion
│       ├── inspectRawNotes.js          # CLI tool to inspect extracted note buffers and chunks
│       ├── restoreChapter1_1.js        # Recovery script for Chapter 1.1 official records
│       ├── securityTest.js             # 42-point automated security & regression testing suite
│       ├── seed.js                     # Database seeding script for sample curricula
│       ├── syncSem5.js                 # Semester 5 subject synchronization utility
│       ├── syncSem5Syllabus.js         # Full Computer Networks & Semester 5 syllabus seeder
│       ├── testCleanedNotesWorkflow.js # Automated verification for note cleaner service
│       ├── testNoteCleaner.js          # Unit tests for note cleaning regex rules
│       ├── testPhase1PdfWorkflow.js    # Automated tests for PDF upload & streaming
│       ├── testSafePdfPipeline.js      # 37-point test suite for safe pipeline orchestration
│       ├── testSearch.js               # Search scoring algorithm and ranking test suite
│       └── testStudyResourcesWorkflow.js# Test suite for Gemini resource synthesis
└── frontend/                           # React 19 + Vite + Tailwind CSS Single-Page Application
    ├── .gitignore                      # Frontend ignore rules (dist, node_modules)
    ├── eslint.config.js                # ESLint rules and React hooks configuration
    ├── index.html                      # HTML5 template and viewport setup
    ├── package.json                    # Frontend dependencies and scripts
    ├── package-lock.json               # Frontend dependency lockfile
    ├── vercel.json                     # SPA routing rewrite rules for Vercel deployment
    ├── vite.config.js                  # Vite configuration with React and Tailwind v4 plugins
    ├── public/                         # Public static assets & vector favicon
    └── src/
        ├── App.jsx                     # Root application, routing, Portal UI, and 4-tab viewer
        ├── index.css                   # Global styles importing Tailwind CSS v4 & theme tokens
        ├── main.jsx                    # React root rendering entry point
        ├── assets/                     # Static media assets and images
        ├── components/
        │   ├── AdminDashboard.jsx      # Cascading admin workspace with Learning Resources Studio
        │   ├── CommandSearch.jsx       # Global Ctrl+K command palette modal with debounced search
        │   ├── LoginPage.jsx           # Dedicated student & administrator sign-in page
        │   └── RegisterPage.jsx        # Dedicated student self-registration page with UID support
        └── services/
            └── api.js                  # Centralized fetch wrapper (credentials: 'include')
```

---

## 🚀 Installation & Setup Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **MongoDB**: Community Server running locally on port 27017, or a MongoDB Atlas cloud URI
- **Cloudinary Account**: Required for uploading past examination PDF papers and notes attachments
- **Google Gemini API Key**: Required for AI chapter study resource generation and OCR
- **Git**

---

### Step 1: Clone Repository
```bash
git clone <repository-url>
cd "college study material project"
```

---

### Step 2: Backend Environment Configuration
Navigate to the `backend/` directory and create your `.env` file:
```bash
cd backend
cp .env.example .env
```

Open `backend/.env` in your editor and configure the required variables:
```env
# Server & Database Settings
NODE_ENV=development
PORT=5001
MONGO_URI=mongodb://127.0.0.1:27017/studs_portal
MONGO_DB_NAME=StuDS

# CORS & Session Security
FRONTEND_ORIGINS=http://localhost:5173
SESSION_TOKEN_PEPPER=change_this_to_a_random_32_character_secret_string_12345
SESSION_TTL_DAYS=7

# Cloudinary Storage Credentials (for past papers & documents)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Google Gemini API Key (for AI chapter summarization and OCR)
GEMINI_API_KEY=your_gemini_api_key
```

> **Security Note:** In production, ensure `SESSION_TOKEN_PEPPER` is a cryptographically strong 32+ character random string and never commit `.env` to git.

---

### Step 3: Install Backend Dependencies & Seed Data
Inside the `backend/` folder:
```bash
# Install backend dependencies
npm install

# Seed sample curricula (Computer Science & AI tracks across Semesters)
npm run seed

# Seed the complete Semester 5 Computer Networks syllabus units & chapters
node scripts/syncSem5Syllabus.js
```

---

### Step 4: Create Initial Super-Admin Account
To access the administrative workspace at `/admin`, initialize the first `super_admin`:

**On Linux / macOS:**
```bash
SUPER_ADMIN_EMAIL="admin@studs.app" SUPER_ADMIN_PASSWORD="YourSecurePassword123!" npm run create:super-admin
```

**On Windows PowerShell:**
```powershell
$env:SUPER_ADMIN_EMAIL="admin@studs.app"; $env:SUPER_ADMIN_PASSWORD="YourSecurePassword123!"; npm run create:super-admin
```

> **Rules:** Passwords must be at least 12 characters long. The script safely refuses execution if a `super_admin` user already exists in the database.

---

### Step 5: Launch Backend Server
```bash
npm run dev
```
The server will boot on **`http://localhost:5001`** (or your configured `PORT`).  
Verify the health check by navigating to: `http://localhost:5001/` &rarr; `{"status":"healthy","message":"API active"}`.

---

### Step 6: Frontend Setup & Local Development
Open a separate terminal window and navigate to the `frontend/` folder:
```bash
cd frontend
npm install
npm run dev
```

The Vite development server will start at: **`http://localhost:5173`**.

---

### Accessing the Portal & Workflows
- **Student Portal**: Open [http://localhost:5173](http://localhost:5173). You will be directed to `/login` if unauthenticated.
- **Student Registration**: Click "Don't have an account? Sign up" to open [http://localhost:5173/register](http://localhost:5173/register). Enter your College UID (e.g. `22BCS10142`) and password, then sign in.
- **Admin Workspace**: Open [http://localhost:5173/admin](http://localhost:5173/admin) and log in with your super-admin credentials.
- **Global Search**: Press `Ctrl + K` (or `Cmd + K` on Mac) anywhere inside the authenticated portal.

---

## ⚡ Automation Scripts & CLI Test Suites

Located in `backend/scripts/`:

| Script | Command | Purpose |
| :--- | :--- | :--- |
| `securityTest.js` | `node scripts/securityTest.js` | **42-point automated test suite**: Tests mandatory student auth rejection, login validation, student registration journey (short password, bad identifier, valid registration, no premature auto-login cookie, College UID support, role injection prevention, duplicate conflict), student login & HttpOnly cookie issuance, authenticated student access, student-to-admin 403 role isolation, search accuracy & ranking regression (10 real test queries), admin super_admin login & privileges, and student logout with immediate session invalidation. |
| `testSearch.js` | `node scripts/testSearch.js` | Verifies multi-tier search scoring, prefix matching, word stemming, context bonuses, and semester boosts. |
| `testSafePdfPipeline.js` | `node scripts/testSafePdfPipeline.js` | **37-point automated test suite** across 8 groups verifying the 10-stage safe pipeline and staging draft isolation. |
| `testCleanedNotesWorkflow.js`| `node scripts/testCleanedNotesWorkflow.js`| End-to-end tests for boilerplate cleaning, markdown tables, and syllabus coverage. |
| `testStudyResourcesWorkflow.js`| `node scripts/testStudyResourcesWorkflow.js`| Tests Gemini generation, missing-resource detection, and shortfall alerts. |
| `createSuperAdmin.js` | `npm run create:super-admin` | Creates the primary administrative user account safely using environment credentials. |
| `cleanUid.js` | `node scripts/cleanUid.js` | Unsets null UID fields in MongoDB to preserve sparse unique index integrity. |
| `seed.js` | `npm run seed` | Ingests sample subjects, units, notes, past papers, and quizzes into MongoDB. |
| `syncSem5Syllabus.js` | `node scripts/syncSem5Syllabus.js` | Synchronizes syllabus data and chapter outlines for Semester 5 Computer Networks. |
| `syncSem5.js` | `node scripts/syncSem5.js` | Cleans up legacy subject codes and normalizes Semester 5 curriculum ordering. |
| `audit_chapter1_1_records.js`| `npm run audit:ch1-1` | Audits Chapter 1.1 database consistency and generates timestamped audit records. |
| `restoreChapter1_1.js` | `npm run restore:ch1-1` | Restores official Chapter 1.1 materials from verified JSON backup. |
| `importDocx.js` | `node scripts/importDocx.js` | Demonstrates and tests Word `.docx` to Markdown conversion using Mammoth & Turndown. |
| `inspectRawNotes.js` | `node scripts/inspectRawNotes.js` | Inspects extracted note buffers and verifies chunk splitting. |

---

## 🔒 Security & Isolation Principles

1. **Mandatory Student Authentication**: Unauthenticated requests to curriculum APIs (`/api/subjects`, `/api/units`, `/api/content`, `/api/search`, `/api/quiz`) return HTTP 401 Unauthorized. The frontend portal redirects unauthenticated visitors to `/login`.
2. **Server-Enforced Role Lock**: Self-registration enforces `role: 'student'`. Client-supplied role overrides are strictly ignored, preventing student-to-admin privilege escalation.
3. **Staging Draft Isolation**: Generated study resources are written to staging draft documents (`draftStudyResources`, `draftQuizQuestions`, `draftFullNotesMarkdown`). The student portal filters these out, guaranteeing that students only ever see verified, published curriculum content.
4. **Cheating Prevention & Answer Redaction**: The `/api/quiz/:chapterId/attempt` endpoint strips `correctAnswer` and `explanation` from quiz payloads. Answers are evaluated exclusively on the server upon submission.
5. **Stateful Session Storage**: Avoids vulnerable client-side JWT storage in `localStorage`. All sessions live in MongoDB with HMAC-SHA256 hashed keys.
6. **Double-Hashed Secrets**: Session tokens are hashed with a server-side pepper secret (`SESSION_TOKEN_PEPPER`). Even with full database read access, an attacker cannot construct valid authentication cookies.
7. **Partitioned Cookies (CHIPS)**: Cookies are issued with `partitioned: true` in production, ensuring session cookies are delivered properly across cross-domain environments (e.g. Vercel frontend talking to Render backend).
8. **Inactivity Eviction (3-Day Timeout)**: Sessions inactive for more than 3 days are immediately deleted from MongoDB and cleared in the client browser, with throttled `lastUsedAt` updates every 5 minutes.
9. **Automated Session Eviction (TTL Index)**: MongoDB TTL indexes clean up expired session documents automatically without requiring cron jobs.
10. **Timing Attack Protection**: Password verification uses constant-time bcrypt checks against a dummy hash when emails do not exist, preventing email enumeration.
11. **Brute-Force Rate Limiting**: The login route is restricted to 15 requests per 15-minute window; registration is restricted to 10 accounts per hour per IP.
12. **Strict Origin Enforcement & CORS Normalization**: Cross-Origin requests are restricted to explicitly allowed origins defined in `FRONTEND_ORIGINS`, with trailing slash normalization.
13. **Explicit Database Targeting**: Connection strings default explicitly to `dbName: 'StuDS'`, preventing Atlas URIs from misrouting to unintended databases.

---

## 📄 License

This project is licensed under the **ISC License**. Developed for academic study material management, curriculum orchestration, and interactive e-learning.
