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
   - [1. Student Portal Experience (Public Flow)](#1-student-portal-experience-public-flow)
   - [2. Admin Learning Resources Studio (Protected Workflow)](#2-admin-learning-resources-studio-protected-workflow)
   - [3. Safe 10-Stage PDF-to-AI Generation Pipeline](#3-safe-10-stage-pdf-to-ai-generation-pipeline)
   - [4. Source Grounding, Shortfall Reporting & Hallucination Prevention](#4-source-grounding-shortfall-reporting--hallucination-prevention)
   - [5. Intelligent Notes Cleaner & Syllabus Coverage Engine](#5-intelligent-notes-cleaner--syllabus-coverage-engine)
   - [6. Secure Chapter Quiz Engine & Anti-Cheating Architecture](#6-secure-chapter-quiz-engine--anti-cheating-architecture)
   - [7. Semantic Text Chunking & RAG Preparation](#7-semantic-text-chunking--rag-preparation)
   - [8. Authentication & Stateful Session Security](#8-authentication--stateful-session-security)
   - [9. Global Command Search (`Ctrl + K`) Engine](#9-global-command-search-ctrl--k-engine)
5. [Database Models & Schemas](#-database-models--schemas)
6. [API Endpoints Reference](#-api-endpoints-reference)
   - [Public Student Portal Routes (`/api`)](#public-student-portal-routes-api)
   - [Student Quiz Practice Endpoints (`/api/quiz`)](#student-quiz-practice-endpoints-apiquiz)
   - [Authentication Endpoints (`/api/auth`)](#authentication-endpoints-apiauth)
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

- **Strict 6-Tier Academic Taxonomy**: Eliminates unstructured directories by organizing studies systematically into Department, Course, Semester, Subject, Unit, and Chapter.
- **Safe 10-Stage PDF-to-AI Pipeline**:
  - Genuine PDF verification (magic bytes and MIME check).
  - Dual extraction: high-performance stream extraction via `pdf-parse` with automatic fallback to **Google Gemini Multimodal OCR** for scanned documents.
  - Source-text validation: checks printable character ratio (>75%), minimum word threshold, and detects binary corruption.
  - Missing-resource detection: generates only absent learning materials (`fullNotes`, `shortNotes`, `importantTopics`, `keyDefinitions`, `examRevisionNotes`, `quizQuestions`) to prevent overwriting existing assets.
  - Strict source grounding: AI synthesis is strictly constrained to extracted document text.
  - Shortfall reporting: Reports factual shortfalls instead of hallucinating fake questions when source text is brief.
  - Staging draft isolation: Generated materials persist in staging drafts (`draftStudyResources`, `draftQuizQuestions`, `draftFullNotesMarkdown`) without altering published student-facing materials.
  - Admin Studio review: Content admins can review, edit, and fine-tune drafted questions, definitions, and revision notes.
  - Explicit atomic publication: One-click approval promotes validated drafts to production and synchronizes backward-compatible models.
  - Resilient retry: Failed generation attempts retain the original PDF and extracted text, enabling retries without re-uploading large assets.
- **Intelligent Note Cleaner & Syllabus Coverage**:
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
  - Server-side question randomization: pulls 5 distinct random questions per student attempt from the chapter question bank.
  - Cheating prevention: server strips `correctAnswer` and `explanation` from the attempt payload.
  - Server-side score validation: validates student answers against the database, tabulates percentage scores, and unlocks explanations post-submission.
- **Global Command Search (`Ctrl + K` / `Cmd + K`)**:
  - Keyboard-driven modal search palette backed by MongoDB compound `$text` search indexing.
  - 250ms debouncing, live snippet highlighting, and direct chapter navigation.
- **Enterprise-Grade Stateful Session Security**:
  - High-entropy cryptographic session tokens (48 random bytes).
  - Stored strictly as HMAC-SHA256 hashes using a server pepper secret (`SESSION_TOKEN_PEPPER`).
  - Zero sensitive tokens in browser `localStorage`.
  - Delivered via `HttpOnly`, `SameSite`, and `Secure` cookies (`studs_session`).
  - Native MongoDB TTL automatic session expiration without background cron jobs.
  - Constant-time bcrypt credential verification to neutralize user enumeration timing attacks.
  - Rate limiting (10 attempts / 15 minutes) on authentication routes.
  - Strict CORS origin whitelisting and CSRF origin guards.
- **Fine-Grained Role-Based Access Control (RBAC)**:
  - `student`: Public read-only access to published university curricula, notes, and interactive quizzes.
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
| **React Router DOM** | `^7.15.1` | Client-side routing managing navigation between the student portal (`/`) and admin dashboard (`/admin`). |
| **React Markdown** | `^10.1.0` | Safely parses and renders Markdown strings into structured HTML for notes and revision summaries. |
| **Remark GFM** | `^4.0.1` | Remark plugin adding GitHub Flavored Markdown support (tables, strikethrough, autolinks, task lists). |
| **Lucide React** | `^1.16.0` | Crisp SVG icon set for clean navigational controls, status badges, and visual indicators. |

### Backend Technologies
| Tool / Library | Version | Role in Project |
| :--- | :--- | :--- |
| **Node.js** | LTS (v18+) | Server-side JavaScript runtime environment executing the backend REST APIs. |
| **Express.js** | `^5.2.1` | Minimalist web framework handling routing, middleware pipelines, and HTTP controllers. |
| **Cookie-Parser** | `^1.4.7` | Parses incoming HTTP request `Cookie` headers into `req.cookies` to extract session tokens. |
| **CORS** | `^2.8.6` | Configures Cross-Origin Resource Sharing with whitelisted origins and credential sharing support. |
| **Bcrypt** | `^6.0.0` | Industry-standard password hashing algorithm (cost factor 12) for account protection. |
| **Express-Rate-Limit** | `^8.6.2` | Brute-force protection on authentication endpoints (10 attempts per 15-minute window). |
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
| **Mongoose** | `^9.6.2` | Object Data Modeling (ODM) library providing validation, schemas, and queries. |
| **MongoDB TTL Index** | Built-in | Background thread automatically purges expired session records (`expireAfterSeconds: 0`). |
| **MongoDB Text Index** | Built-in | Compound full-text search indexes on notes and revision summaries with relevance scoring. |

### AI & Cloud Services
| Service / SDK | Version | Role in Project |
| :--- | :--- | :--- |
| **Google Generative AI (`@google/generative-ai`)** | `^0.24.1` | Multi-model integration with **Google Gemini 2.0 Flash / 1.5 Flash / 1.5 Pro** for source-grounded learning resource synthesis and multimodal PDF OCR. |
| **Cloudinary (`cloudinary`)** | `^2.10.0` | Cloud media storage holding raw exam PDF files and uploaded course notes documents. |

### Development & Testing Utilities
| Utility / Test Suite | Path | Role in Project |
| :--- | :--- | :--- |
| **Security Test Suite** | `backend/scripts/securityTest.js` | 42-point automated verification testing authentication, RBAC, session revocation, and rate limiting. |
| **Safe PDF Pipeline Suite** | `backend/scripts/testSafePdfPipeline.js` | 37-point automated verification across 8 test groups verifying extraction, validation, staging isolation, and atomic publication. |
| **Notes Cleaner Suite** | `backend/scripts/testCleanedNotesWorkflow.js` | Verifies boilerplate stripping, markdown table formatting, and syllabus coverage verification. |
| **Study Resources Suite** | `backend/scripts/testStudyResourcesWorkflow.js` | Verifies Gemini generation, missing-resource detection, and quiz validation. |

---

## ⚙️ How the System Works (Architecture & Workflows)

### System Architecture Diagram

```
+-------------------------------------------------------------------------------------------------------------------------+
|                                                    CLIENT BROWSER                                                       |
|                                                                                                                         |
|   +----------------------------------------------------+    +-------------------------------------------------------+   |
|   |             STUDENT PORTAL (App.jsx)               |    |             ADMIN DASHBOARD (AdminDashboard)          |   |
|   |  - Course Selector (localStorage)                  |    |  - Cascading 6-Tier Academic Selector                 |   |
|   |  - Semester Subject Accordion                      |    |  - Document Upload (PDF / DOCX with Cloudinary/Multer)|   |
|   |  - Tab 1: Study Material (Markdown + Attachments)  |    |  - Text Extraction & Notes Cleaner Studio             |   |
|   |  - Tab 2: Study Resources (Short/Topics/Defs/Rev)  |    |  - Safe AI Resource Generator (Gemini 2.0/1.5 Flash)  |   |
|   |  - Tab 3: Past Papers (Embedded Cloudinary PDF)    |    |  - Staging Draft Studio & 20-MCQ Question Bank Editor |   |
|   |  - Tab 4: Practice Quiz (Random 5 MCQs + Scoring)  |    |  - Atomic Publication Guard & Rollback Safety         |   |
|   |  - Command Search Palette (Ctrl+K)                 |    |  - Session Auth Gate (HttpOnly Cookie)                |   |
|   +----------------------------------------------------+    +-------------------------------------------------------+   |
+-------------------------------------------------------------------------------------------------------------------------+
                                 |                                                                 |
                 HTTP (Credentials: include)                                       HTTP (HttpOnly Cookie: studs_session)
                                 v                                                                 v
+-------------------------------------------------------------------------------------------------------------------------+
|                                                EXPRESS BACKEND (Node.js)                                                |
|                                                                                                                         |
|   [CORS Whitelist] ---> [cookieParser] ---> [Rate Limiter] ---> [Origin Verifier] ---> [authMiddleware (RBAC)]          |
|                                                                                                                         |
|   +----------------------------------------------------+    +-------------------------------------------------------+   |
|   |               PUBLIC ROUTES (/api)                 |    |              PROTECTED ROUTES (/api/admin)            |   |
|   |  GET  /subjects/:semester                          |    |  POST /subject                (super_admin)           |   |
|   |  GET  /units/:subjectId                            |    |  POST /unit                   (super_admin)           |   |
|   |  GET  /content/:chapterId                          |    |  POST /content/upsert         (content_admin)         |   |
|   |  GET  /search?q=...                                |    |  POST /upload-pdf             (Cloudinary stream)     |   |
|   |                                                    |    |  POST /upload-notes-pdf       (Multer + Cloudinary)   |   |
|   |              QUIZ ROUTES (/api/quiz)               |    |  POST /upload-document        (Mammoth DOCX parser)   |   |
|   |  GET  /quiz/:chapterId/attempt (Random 5 MCQs)     |    |  POST /extract-pdf-text       (pdf-parse / Gemini OCR)|   |
|   |  POST /quiz/:chapterId/submit  (Score & Explain)   |    |  POST /clean-extracted-text   (noteCleanerService)    |   |
|   |                                                    |    |  GET  /content/:id/pipeline/status (Pipeline Monitor) |   |
|   |              AUTH ROUTES (/api/auth)               |    |  POST /content/:id/pipeline/generate (Staging Draft)  |   |
|   |  POST /login | POST /logout | GET /me              |    |  PUT  /content/:id/draft      (Admin Manual Edit)     |   |
|   |                                                    |    |  POST /content/:id/pipeline/publish (Atomic Promote)  |   |
|   +----------------------------------------------------+    +-------------------------------------------------------+   |
+-------------------------------------------------------------------------------------------------------------------------+
                                 |                                                                 |
                 Mongoose Queries & Aggregations                                       External Cloud Services
                                 v                                                                 v
+--------------------------------------------------------+        +-------------------------------------------------------+
|                    MONGODB DATABASE                    |        |                EXTERNAL CLOUD SERVICES                |
|  - Users     (Password hashes with constant-time verify|        |                                                       |
|  - Sessions  (HMAC-SHA256 tokens, TTL auto-expiry)     |        |  - Cloudinary: Raw PDF Document Storage & CDN         |
|  - Subjects  (Catalog, codes, semester indexing)       |        |  - Google Gemini: 2.0 Flash / 1.5 Flash / 1.5 Pro     |
|  - Units     (Syllabus units, chapters, contact hours) |        |    (Source-Grounded Resource Generation & OCR)        |
|  - Contents  (Published materials, staging drafts,     |        +-------------------------------------------------------+
|               semantic chunks, pipeline status)        |
+--------------------------------------------------------+
```

---

### 1. Student Portal Experience (Public Flow)

1. **Course Configuration**:
   - On initial launch, the portal checks `localStorage` for `userCourse`.
   - If not found, a configuration modal opens allowing the student to select their Department (e.g., `Engineering (B.E./M.E.)`) and Specialization (e.g., `Computer Science (CSE)`).
   - This choice is persisted in `localStorage` and drives subject filtering.
2. **Semester Filtering**:
   - The user selects a semester tab (Semester 1 through 8).
   - The frontend calls `fetchSubjectsBySemester(semester, course)`.
   - The backend queries the `Subject` collection filtered by semester and course, deduplicating and sorting subjects by order.
3. **Curriculum Drill-Down**:
   - Clicking a subject accordion executes `fetchUnitsBySubject(subjectId)`.
   - Expanding a unit reveals its individual chapters.
4. **Content Consumption & Interaction**:
   - Selecting a chapter calls `fetchContentByChapter(chapterId)`.
   - The user is presented with **4 coordinated tabs**:
     - **Tab 1: Study Material**: Textbook-level formatted Markdown notes rendered via `ReactMarkdown` and `remark-gfm`. If an AI summary is available, it is showcased in a prominent "AI Chapter Synthesis" banner. Published notes are listed with document download and preview attachments.
     - **Tab 2: Study Resources**: A comprehensive 4-in-1 study resource hub:
       - *Short Notes*: Concise revision bullet points.
       - *Important Topics*: High-weightage exam topics.
       - *Key Definitions*: Academic terms with clear definitions.
       - *Exam Revision Guide*: High-yield formulas, comparisons, and summary guide.
     - **Tab 3: Past Papers (PYQs)**: Historical exam papers indexed by year. Clicking a year loads the PDF inside a sandboxed iframe streamed from Cloudinary.
     - **Tab 4: Practice Quiz**: An interactive quiz engine. Clicking start fetches 5 random questions without leaking answers (`/api/quiz/:chapterId/attempt`). Students answer sequentially, submit their attempt (`/api/quiz/:chapterId/submit`), and receive an instant score with an answer key and explanation review.
5. **Theme Switching**:
   - A single-click theme switcher toggles between Light and Dark mode, applying the `.dark` class to `document.documentElement` and persisting the preference in `localStorage`.

---

### 2. Admin Learning Resources Studio (Protected Workflow)

1. **Gatekeeper & Session Validation**:
   - Navigating to `/admin` invokes `getCurrentUser()` (`GET /api/auth/me`).
   - If unauthenticated, the user is presented with the Administrative Login screen.
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

The STUDS pipeline (`backend/services/pipelineService.js`) orchestrates a safe, 10-stage process ensuring data integrity, source grounding, and zero student disruption:

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
7. **Stage 7 (Staging Isolation)**: Saves generated resources to `draftStudyResources`, `draftQuizQuestions`, and `draftFullNotesMarkdown`. The public API filters these out, keeping student views safe.
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

### 7. Semantic Text Chunking & RAG Preparation

Extracted chapter text is automatically partitioned by `pdfTextExtractor.js` into semantic chunks (~600–1200 characters) preserving paragraph boundaries. Each chunk records:
- `chunkIndex`: Positional index within the document.
- `text`: Cleaned academic text content.
- `wordCount`: Word count per chunk.

These chunks are stored in `notes.$.extractedChunks` within MongoDB, providing the foundation for future vector embeddings, retrieval-augmented generation (RAG), and cited doubt solving.

---

### 8. Authentication & Stateful Session Security

STUDS avoids insecure stateless JWT implementations in favor of **database-backed, stateful sessions**:

1. **Login Request**: Admin submits `email` and `password` to `POST /api/auth/login`.
2. **Rate Limiting**: `express-rate-limit` enforces a maximum of 10 requests per 15 minutes per IP.
3. **Constant-Time Verification**:
   - `User.findOne({ email }).select('+passwordHash')` looks up the user.
   - If the user does not exist, `bcrypt.compare` executes against a dummy hash to prevent timing attacks.
4. **Token Generation & Peppered HMAC**:
   - The server creates a cryptographically secure 48-byte random token (`crypto.randomBytes(48).toString('base64url')`).
   - The database stores **only** an HMAC-SHA256 hash of this token combined with the server pepper (`SESSION_TOKEN_PEPPER`).
5. **Secure Cookie Issuance**:
   - The raw token is sent back inside the `studs_session` cookie:
     - `HttpOnly: true` (Inaccessible to JavaScript, immune to XSS)
     - `SameSite: 'lax'` (development) or `'none'` (production)
     - `Secure: true` (enforced in production over HTTPS)
     - `Path: '/'`
     - `maxAge: 7 days` (configurable via `SESSION_TTL_DAYS`)
6. **Automatic Cleanup (MongoDB TTL)**:
   - The `Session` collection contains a TTL index: `sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })`.
   - MongoDB automatically removes expired sessions from disk without any cron job.
7. **Logout**:
   - `POST /api/auth/logout` deletes the session from MongoDB and clears the browser cookie.

---

### 9. Global Command Search (`Ctrl + K`) Engine

1. The user presses `Ctrl + K` (or `Cmd + K`) or clicks the search bar in the header.
2. The user types a query; `CommandSearch.jsx` employs a **250ms debounce** to prevent server query flooding.
3. The request hits `GET /api/search?q={query}`.
4. MongoDB executes a compound `$text` search over `fullNotesMarkdown` (weight: 3) and `shortNotes` (weight: 1).
5. The backend cross-references matching chapter IDs with the `Unit` collection to populate human-readable unit titles and extracts a clean 120-character text snippet.
6. The user uses the keyboard arrow keys (`ArrowUp`, `ArrowDown`, `Enter`) to navigate results and jumps directly into that chapter.

---

## 🗄 Database Models & Schemas

### 1. `Subject` Model (`backend/models/Subject.js`)
Represents an academic course within a degree program.
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

### 2. `Unit` Model (`backend/models/Unit.js`)
Represents a syllabus unit belonging to a subject, containing multiple chapters.
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
// Composite unique index: { subjectId: 1, unitNumber: 1 }
```

### 3. `Content` Model (`backend/models/Content.js`)
Stores all educational materials associated with a specific chapter, including published assets, staging drafts, extracted chunks, and pipeline status.
```javascript
{
  chapterId:         { type: String, required: true, unique: true, index: true },
  
  // Published Core Content
  fullNotesMarkdown: { type: String, default: '' },
  shortNotes:        [String],
  aiSummary:         { type: String, default: null },
  pyqLinks: [{
    year:    { type: Number, required: true },
    fileUrl: { type: String, required: true }
  }],
  quizData: [{
    question:      { type: String, required: true },
    options:       { type: [String], validate: v => v.length === 4 },
    correctAnswer: { type: String, required: true }
  }],
  quizQuestions: [{
    question:         { type: String, required: true },
    options:          { type: [String], validate: v => v.length === 4 },
    correctAnswer:    { type: String, required: true },
    explanation:      { type: String, default: '' },
    difficulty:       { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    status:           { type: String, enum: ['draft', 'published'], default: 'draft' },
    isManuallyEdited: { type: Boolean, default: false }
  }],
  studyResources: {
    shortNotes:        [String],
    importantTopics:   [String],
    keyDefinitions:    [{ term: String, definition: String, isManuallyEdited: Boolean }],
    examRevisionNotes: String,
    status:            { type: String, enum: ['draft', 'published'], default: 'draft' },
    generatedAt:       { type: Date, default: Date.now },
    publishedAt:       Date,
    approvedBy:        { type: ObjectId, ref: 'User' },
    shortfallReason:   String,
    sourceLimitations: [String]
  },
  notes: [{
    title:                { type: String, required: true },
    content:              { type: String, default: '' },
    subject:              String,
    unit:                 String,
    chapter:              String,
    status:               { type: String, enum: ['draft', 'published'], default: 'draft' },
    fileUrl:              String,
    fileName:             String,
    fileSize:             Number,
    filePublicId:         String,
    rawExtractedText:     { type: String, default: '' },
    extractedMarkdown:    { type: String, default: '' },
    textExtractionStatus: { type: String, enum: ['none', 'pending', 'extracting', 'success', 'no_text', 'failed'], default: 'none' },
    extractedChunks:      [{ chunkIndex: Number, text: String, wordCount: Number }],
    pageCount:            { type: Number, default: 0 },
    charCount:            { type: Number, default: 0 },
    wordCount:            { type: Number, default: 0 },
    processingError:      String
  }],

  // Isolated Staging Draft Resources
  draftStudyResources:    studyResourcesSchema,
  draftQuizQuestions:     [quizQuestionSchema],
  draftFullNotesMarkdown: { type: String, default: '' },

  // Pipeline Tracking & Shortfall Reporting
  processingStatus: {
    type: String,
    enum: ['idle', 'uploading', 'uploaded', 'extracting', 'extracted', 'generating', 'draft_ready', 'published', 'failed'],
    default: 'idle'
  },
  processingError:  { type: String, default: '' },
  lastProcessingAt: Date,
  shortfallNotice: {
    hasShortfall:  { type: Boolean, default: false },
    expectedCount: { type: Number, default: 20 },
    actualCount:   { type: Number, default: 0 },
    reason:        { type: String, default: '' }
  }
}
// Full-text compound index: { fullNotesMarkdown: 'text', shortNotes: 'text' }
```

### 4. `User` Model (`backend/models/User.js`)
Stores user accounts with role authorization.
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
Persists authenticated server sessions with automatic TTL expiration.
```javascript
{
  tokenHash:  { type: String, required: true, unique: true, select: false },
  userId:     { type: ObjectId, ref: 'User', required: true, index: true },
  expiresAt:  { type: Date, required: true },
  lastUsedAt: { type: Date, required: true },
  userAgent:  { type: String, maxlength: 512, default: null },
  ipAddress:  { type: String, maxlength: 128, default: null }
}
// Auto-purges expired records: { expiresAt: 1 }, { expireAfterSeconds: 0 }
```

---

## 📡 API Endpoints Reference

### Public Student Portal Routes (`/api`)
| Method | Endpoint | Query / Body Params | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/subjects/:semester` | `?course=...` | Fetches deduplicated, ordered subjects for the specified semester and course. |
| `GET` | `/api/units/:subjectId` | — | Fetches syllabus units and chapters for the chosen subject. |
| `GET` | `/api/content/:chapterId` | — | Fetches published chapter materials. Redacts draft staging fields and unreleased quiz answers. |
| `GET` | `/api/search` | `?q=search_term` | Debounced full-text search across all notes with relevance scoring. |
| `GET` | `/` | — | Health check endpoint returning `{"status":"healthy","message":"API active"}`. |

### Student Quiz Practice Endpoints (`/api/quiz`)
| Method | Endpoint | Access Level | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/quiz/:chapterId/attempt` | Public | Pulls 5 random questions from chapter question bank with answers and explanations redacted. |
| `POST` | `/api/quiz/:chapterId/submit` | Public | Validates student answers server-side, calculates percentage score, and reveals explanations. |

### Authentication Endpoints (`/api/auth`)
| Method | Endpoint | Access Level | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Public (Rate-limited) | Validates credentials, issues `studs_session` HttpOnly cookie. |
| `POST` | `/api/auth/logout` | Authenticated | Revokes session token in MongoDB and clears browser cookie. |
| `GET` | `/api/auth/me` | Authenticated | Returns current authenticated user profile (`id`, `email`, `role`). |

### Admin Pipeline & Content Routes (`/api/admin`)
*All admin endpoints require valid session authentication and trusted origin verification.*

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
├── projectinfo.md                      # Detailed technical architecture documentation
├── backend/                            # Express.js REST API server
│   ├── .env                            # Backend environment secrets (never commit)
│   ├── .env.example                    # Template for backend environment variables
│   ├── .gitignore                      # Backend ignore rules (node_modules, db)
│   ├── package.json                    # Backend npm dependencies and scripts
│   ├── package-lock.json               # Backend dependency lockfile
│   ├── server.js                       # Express app entry point & MongoDB connection
│   ├── config/
│   │   ├── auth.js                     # Token generation, HMAC hashing, cookie configuration
│   │   ├── cloudinary.js               # Cloudinary SDK client setup
│   │   └── gemini.js                   # Google Gemini Generative AI client setup
│   ├── controllers/
│   │   └── contentController.js        # Content upserting and Notes CRUD controller
│   ├── db/                             # Local standalone MongoDB storage folder
│   ├── middleware/
│   │   ├── authMiddleware.js           # requireAuth, requireRole, requireTrustedOrigin
│   │   └── uploadMiddleware.js         # Multer in-memory storage & PDF/DOCX MIME filter
│   ├── models/
│   │   ├── Content.js                  # Chapter materials, notes, quizzes, PYQs, drafts schema
│   │   ├── Session.js                  # Database-backed session schema with TTL index
│   │   ├── Subject.js                  # Subject schema with department & semester indexing
│   │   ├── Unit.js                     # Unit and chapter sub-document schemas
│   │   └── User.js                     # User account schema with password hashes and roles
│   ├── routes/
│   │   ├── adminRoutes.js              # Protected administrative & pipeline studio endpoints
│   │   ├── authRoutes.js               # Authentication routes (login, logout, session check)
│   │   └── portalRoutes.js             # Public student portal query & quiz routes
│   ├── services/
│   │   ├── aiService.js                # Google Gemini 1.5 Flash 5-point summarization logic
│   │   ├── noteCleanerService.js       # Notes cleaner & syllabus coverage verification
│   │   ├── pdfTextExtractor.js         # Dual extraction (pdf-parse / Gemini OCR) & semantic chunking
│   │   ├── pipelineService.js          # 10-stage safe PDF-to-AI pipeline orchestration
│   │   └── studyResourcesService.js    # Grounded Gemini generation, shortfall reporting, MCQ check
│   └── scripts/
│       ├── createSuperAdmin.js         # CLI tool to securely initialize the first super-admin
│       ├── importDocx.js               # Utility script to test Mammoth DOCX to Markdown conversion
│       ├── inspectRawNotes.js          # CLI tool to inspect extracted note buffers and chunks
│       ├── securityTest.js             # Automated security regression testing suite (42 tests)
│       ├── seed.js                     # Database seeding script for sample curricula
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
        │   └── CommandSearch.jsx       # Global Ctrl+K command palette modal with debounced search
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

### Accessing the Web Application
- **Student Portal**: Open [http://localhost:5173](http://localhost:5173) in your browser.
- **Admin Workspace**: Open [http://localhost:5173/admin](http://localhost:5173/admin) and log in with your super-admin credentials.
- **Global Search**: Press `Ctrl + K` (or `Cmd + K` on Mac) anywhere on the student portal.

---

## ⚡ Automation Scripts & CLI Test Suites

Located in `backend/scripts/`:

| Script | Command | Purpose |
| :--- | :--- | :--- |
| `createSuperAdmin.js` | `npm run create:super-admin` | Creates the primary administrative user account safely using environment credentials. |
| `seed.js` | `npm run seed` | Ingests sample subjects, units, notes, past papers, and quizzes into MongoDB. |
| `syncSem5Syllabus.js` | `node scripts/syncSem5Syllabus.js` | Synchronizes syllabus data and chapter outlines for Semester 5 Computer Networks. |
| `syncSem5.js` | `node scripts/syncSem5.js` | Cleans up legacy subject codes and normalizes Semester 5 curriculum ordering. |
| `importDocx.js` | `node scripts/importDocx.js` | Demonstrates and tests Word `.docx` to Markdown conversion using Mammoth & Turndown. |
| `inspectRawNotes.js` | `node scripts/inspectRawNotes.js` | Inspects extracted note buffers and verifies chunk splitting. |
| `securityTest.js` | `node scripts/securityTest.js` | Automated 42-point security test suite verifying session auth, RBAC, and origin protection. |
| `testSafePdfPipeline.js` | `node scripts/testSafePdfPipeline.js` | 37-point automated test suite verifying the 10-stage safe pipeline and staging draft isolation. |
| `testCleanedNotesWorkflow.js`| `node scripts/testCleanedNotesWorkflow.js`| End-to-end tests for boilerplate cleaning, markdown tables, and syllabus coverage. |
| `testStudyResourcesWorkflow.js`| `node scripts/testStudyResourcesWorkflow.js`| Tests Gemini generation, missing-resource detection, and shortfall alerts. |

---

## 🔒 Security & Isolation Principles

1. **Staging Draft Isolation**: Generated study resources are written to staging draft documents (`draftStudyResources`, `draftQuizQuestions`, `draftFullNotesMarkdown`). The student portal filters these out, guaranteeing that students only ever see verified, published curriculum content.
2. **Cheating Prevention & Answer Redaction**: The `/api/quiz/:chapterId/attempt` endpoint strips `correctAnswer` and `explanation` from quiz payloads. Answers are evaluated exclusively on the server upon submission.
3. **Stateful Session Storage**: Avoids vulnerable client-side JWT storage in `localStorage`. All sessions live in MongoDB with HMAC-SHA256 hashed keys.
4. **Double-Hashed Secrets**: Session tokens are hashed with a server-side pepper secret. Even with database read access, an attacker cannot construct valid authentication cookies.
5. **Automated Session Eviction**: MongoDB TTL indexes clean up expired session documents automatically without requiring cron jobs.
6. **Timing Attack Protection**: Password verification uses constant-time bcrypt checks against a dummy hash when emails do not exist, preventing email enumeration.
7. **Brute-Force Rate Limiting**: The login route is restricted to 10 requests per 15-minute window per IP.
8. **Strict Origin Enforcement**: Cross-Origin requests are restricted to explicitly allowed origins defined in `FRONTEND_ORIGINS`.
9. **Role-Based Guards**: Middleware routes strictly enforce access levels: `student`, `content_admin`, and `super_admin`.

---

## 📄 License

This project is licensed under the **ISC License**. Developed for academic study material management, curriculum orchestration, and interactive e-learning.
