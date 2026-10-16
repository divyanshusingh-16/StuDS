# STUDS – College Study Material Portal & Academic Management System

![React 19](https://img.shields.io/badge/React-19.2.6-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-8.0.12-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.3.0-38B2AC?logo=tailwind-css&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-LTS-339933?logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-5.2.1-000000?logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose_9.6.2-47A248?logo=mongodb&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Google_Gemini-1.5_Flash-4285F4?logo=google&logoColor=white)
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
   - [Development & Security Utilities](#development--security-utilities)
4. [How the System Works (Architecture & Flows)](#-how-the-system-works-architecture--flows)
   - [System Architecture Diagram](#system-architecture-diagram)
   - [1. Student Portal Workflow (Public Experience)](#1-student-portal-workflow-public-experience)
   - [2. Admin Workspace Workflow (Protected Ingestion)](#2-admin-workspace-workflow-protected-ingestion)
   - [3. Authentication & Stateful Session Lifecycle](#3-authentication--stateful-session-lifecycle)
   - [4. Document Parsing & Storage Pipeline](#4-document-parsing--storage-pipeline)
   - [5. AI Chapter Summarization Pipeline](#5-ai-chapter-summarization-pipeline)
   - [6. Global Command Search (Ctrl + K) Engine](#6-global-command-search-ctrl--k-engine)
5. [Database Models & Schemas](#-database-models--schemas)
6. [API Endpoints Reference](#-api-endpoints-reference)
7. [Project Directory Structure](#-project-directory-structure)
8. [Installation & Setup Guide](#-installation--setup-guide)
   - [Prerequisites](#prerequisites)
   - [Step 1: Clone Repository](#step-1-clone-repository)
   - [Step 2: Backend Environment Configuration](#step-2-backend-environment-configuration)
   - [Step 3: Install Backend Dependencies & Seed Data](#step-3-install-backend-dependencies--seed-data)
   - [Step 4: Create Initial Super-Admin Account](#step-4-create-initial-super-admin-account)
   - [Step 5: Launch Backend Server](#step-5-launch-backend-server)
   - [Step 6: Frontend Setup & Local Development](#step-6-frontend-setup--local-development)
9. [Automation Scripts & CLI Utilities](#-automation-scripts--cli-utilities)
10. [Security Implementations](#-security-implementations)
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

For every single chapter, STUDS unifies **four dedicated study modules**:
1. **Comprehensive Study Notes** – High-definition Markdown notes with built-in AI Chapter Synthesis.
2. **Key Revision Short Notes** – Concise, bulleted takeaways for rapid pre-exam revision.
3. **Previous Years' Exam Papers (PYQs)** – Cloud-hosted, high-performance embedded PDF viewer.
4. **Interactive Practice Quizzes** – Self-scoring multiple-choice quizzes with instant grading, progress tracking, and answer explanations.

---

## ✨ Key Features

- **Strict 6-Tier Hierarchy**: Keeps courses organized systematically across all university disciplines (Engineering, Management, Computing, and Applied Sciences).
- **4-in-1 Study Hub**: Seamlessly switch between rich textbook notes, short revision points, original past exam papers, and practice quizzes on any chapter.
- **AI Chapter Synthesis**: Powered by Google Gemini 1.5 Flash to automatically condense verbose chapter texts into clean, 5-point revision summaries.
- **Global Command Search (`Ctrl + K` / `Cmd + K`)**: Keyboard-driven modal search palette backed by MongoDB `$text` search indexing, complete with query debouncing and direct chapter navigation.
- **Direct Document Ingestion (DOCX, Markdown & PDF)**: Admin support for uploading `.docx` Word documents (auto-converted to Markdown via Mammoth and Turndown) or PDF question papers streamed directly to Cloudinary.
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
  - `student`: Read-only access to published university curricula.
  - `content_admin`: Manage chapter notes, upload PDFs/documents, and run AI summaries.
  - `super_admin`: Full administrative rights including creating new subjects and units.
- **Modern Responsive UI / UX**:
  - Tailwind CSS v4 design system with smooth micro-interactions.
  - Seamless Light and Dark mode toggle with `localStorage` persistence.
  - Accordion-style curriculum navigation and embedded PDF sandbox iframe.

---

## 🛠 Technology Stack & Tools

### Frontend Technologies
| Tool / Library | Version | Role in Project |
| :--- | :--- | :--- |
| **React** | `^19.2.6` | Modern component architecture, state hooks, and reactive UI trees. |
| **Vite** | `^8.0.12` | Next-generation build tool and dev server with instant Hot Module Replacement (HMR). |
| **Tailwind CSS v4** | `^4.3.0` | High-performance CSS engine for utility-first styling, glassmorphism, and responsive layouts. |
| **@tailwindcss/vite** | `^4.3.0` | Official Vite plugin integrating the Tailwind CSS v4 compiler. |
| **React Router DOM** | `^7.15.1` | Client-side routing managing navigation between the student portal (`/`) and the admin workspace (`/admin`). |
| **React Markdown** | `^10.1.0` | Safely parses and renders Markdown strings into structured HTML for textbook notes and AI summaries. |
| **Lucide React** | `^1.16.0` | Crisp SVG icon set for clean navigational controls and visual indicators. |

### Backend Technologies
| Tool / Library | Version | Role in Project |
| :--- | :--- | :--- |
| **Node.js** | LTS (v18+) | Server-side JavaScript runtime executing the backend APIs. |
| **Express.js** | `^5.2.1` | Web framework handling routing, middleware pipelines, and RESTful HTTP APIs. |
| **Cookie-Parser** | `^1.4.7` | Parses incoming HTTP request `Cookie` headers into `req.cookies` to extract session tokens. |
| **CORS** | `^2.8.6` | Configures Cross-Origin Resource Sharing with whitelisted origins and credential sharing support. |
| **Bcrypt** | `^6.0.0` | Industry-standard password hashing algorithm (cost factor 12) for account protection. |
| **Express-Rate-Limit** | `^8.6.2` | Brute-force protection on authentication endpoints (10 attempts per 15-minute window). |
| **Multer** | `^2.1.1` | In-memory multipart/form-data handler for PDF and DOCX file uploads (up to 10MB). |
| **Mammoth** | `^1.13.0` | Reads `.docx` files in-memory and converts them into structured HTML. |
| **Turndown** | `^7.2.4` | Converts HTML markup generated from Word documents into clean Markdown. |
| **Dotenv** | `^17.4.2` | Loads environment configurations and secrets from `.env` into `process.env`. |
| **Nodemon** | `^3.1.14` | Hot-reload development daemon that restarts the Node server upon code changes. |

### Database & Storage
| Tool / Technology | Version | Role in Project |
| :--- | :--- | :--- |
| **MongoDB** | `^6.0+` | NoSQL document database providing schemaless flexibility, text indexing, and TTL support. |
| **Mongoose** | `^9.6.2` | Object Data Modeling (ODM) library providing validation, schemas, and queries. |
| **MongoDB TTL Index** | Built-in | Background thread automatically purges expired session records (`expireAfterSeconds: 0`). |
| **MongoDB Text Index** | Built-in | Compound full-text search indexes on notes and revision summaries with relevance scoring. |

### AI & Cloud Services
| Service / SDK | Version | Role in Project |
| :--- | :--- | :--- |
| **Google Generative AI (`@google/generative-ai`)** | `^0.24.1` | Integrates with **Google Gemini 1.5 Flash** to automatically condense chapter notes into 5-point study summaries. |
| **Cloudinary (`cloudinary`)** | `^2.10.0` | Cloud media storage holding raw exam PDF files and uploaded course notes documents. |

---

## ⚙️ How the System Works (Architecture & Flows)

### System Architecture Diagram

```
+-----------------------------------------------------------------------------------------+
|                                    CLIENT BROWSER                                       |
|                                                                                         |
|   +------------------------------------+    +---------------------------------------+   |
|   |    STUDENT PORTAL (App.jsx)        |    |     ADMIN DASHBOARD (AdminDashboard)  |   |
|   |  - Course Selector (localStorage)  |    |  - Cascading 6-Tier Selector          |   |
|   |  - Semester Subject Accordion      |    |  - Multi-Part Notes & Quiz Authoring  |   |
|   |  - 4 Tabs: Notes/Short/PYQ/Quiz    |    |  - DOCX / PDF Uploader                |   |
|   |  - Command Search Palette (Ctrl+K) |    |  - Gemini AI Summary Trigger          |   |
|   +------------------------------------+    +---------------------------------------+   |
+-----------------------------------------------------------------------------------------+
                                 |                                 |
                 HTTP (Credentials: include)       HTTP (HttpOnly Cookie: studs_session)
                                 v                                 v
+-----------------------------------------------------------------------------------------+
|                                EXPRESS BACKEND (Node.js)                                |
|                                                                                         |
|   [CORS Whitelist] ---> [cookieParser] ---> [Rate Limiter] ---> [Origin Verifier]       |
|                                                                                         |
|   +-------------------------------------+   +---------------------------------------+   |
|   |      PUBLIC ROUTES (/api)           |   |       PROTECTED ROUTES (/api/admin)   |   |
|   |  GET  /subjects/:semester           |   |  POST /subject   (super_admin)        |   |
|   |  GET  /units/:subjectId             |   |  POST /unit      (super_admin)        |   |
|   |  GET  /content/:chapterId           |   |  POST /content/upsert (content_admin) |   |
|   |  GET  /search?q=...                 |   |  POST /upload-pdf     (Cloudinary)    |   |
|   +-------------------------------------+   |  POST /upload-document (Mammoth/Cloud)|   |
|   |       AUTH ROUTES (/api/auth)       |   |  POST /generate-summary (Gemini AI)   |   |
|   |  POST /login | /logout | GET /me    |   +---------------------------------------+   |
+-----------------------------------------------------------------------------------------+
                                 |                                 |
                Mongoose Queries & Aggregations       External API Streams
                                 v                                 v
+------------------------------------+        +-------------------------------------------+
|          MONGODB DATABASE          |        |          EXTERNAL CLOUD SERVICES          |
|  - Users     (Password hashes)     |        |                                           |
|  - Sessions  (TTL auto-expiration) |        |  - Cloudinary: Raw PDF Storage & Delivery |
|  - Subjects  (Catalog & semester)  |        |  - Google Gemini: 1.5 Flash Summarization |
|  - Units     (Syllabus & chapters) |        +-------------------------------------------+
|  - Contents  (Notes, PYQs, Quizzes)|
+------------------------------------+
```

---

### 1. Student Portal Workflow (Public Experience)

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
     - **Tab 1: Study Material**: Formatted Markdown notes rendered via `ReactMarkdown`. If an AI summary is available, it is showcased in a prominent "AI Chapter Synthesis" banner. Published notes are listed with document download attachments.
     - **Tab 2: Short Notes**: Bullet points specifically targeted for fast pre-exam review.
     - **Tab 3: Past Papers (PYQs)**: Historical exam papers indexed by year. Clicking a year loads the PDF inside a sandboxed iframe streamed from Cloudinary.
     - **Tab 4: Practice Quiz**: An interactive quiz engine. Students answer 4-option multiple choice questions sequentially, submit their attempt, and receive an instant score with an answer key and explanation review.
5. **Theme Switching**:
   - A single-click theme switcher toggles between Light and Dark mode, applying the `.dark` class to `document.documentElement` and persisting the preference in `localStorage`.

---

### 2. Admin Workspace Workflow (Protected Ingestion)

1. **Gatekeeper & Session Validation**:
   - Navigating to `/admin` invokes `getCurrentUser()` (`GET /api/auth/me`).
   - If unauthenticated, the user is presented with the Administrative Login screen.
2. **Strict 6-Level Cascading Selector**:
   - To eliminate orphaned data in MongoDB, the dashboard enforces a strict cascading state machine:
     $$\text{Department} \longrightarrow \text{Course} \longrightarrow \text{Semester} \longrightarrow \text{Subject} \longrightarrow \text{Unit} \longrightarrow \text{Chapter}$$
   - Changing any higher-level item instantly resets all lower-level selections.
3. **Content Ingestion & Authoring**:
   - **Notes Creation**: Admins can type Markdown directly or upload `.docx` / `.md` files. `.docx` files are parsed via Mammoth into HTML and converted into clean Markdown via Turndown before storage.
   - **AI Synthesis**: Admins click **Generate AI Summary**, which sends the chapter markdown to Gemini 1.5 Flash to automatically create a 5-point digest.
   - **PDF Uploads**: Uploading a past question paper streams the file buffer through Multer memory storage directly to Cloudinary, attaching the secure HTTPS URL to the chapter's `pyqLinks`.
   - **Quiz Authoring**: Admins add multiple-choice questions, set 4 possible options, and select the correct answer.
4. **Atomic Persistence**:
   - Clicking **Save Chapter Materials** calls `POST /api/admin/content/upsert`.
   - The backend performs an atomic `findOneAndUpdate({ chapterId }, payload, { upsert: true })` in MongoDB.

---

### 3. Authentication & Stateful Session Lifecycle

Unlike standard stateless JWT setups that cannot be revoked without maintaining blacklists, STUDS utilizes **database-backed, stateful sessions**:

1. **Login Request**: Admin submits `email` and `password` to `POST /api/auth/login`.
2. **Rate Limiting**: `express-rate-limit` checks if the IP has exceeded 10 attempts in 15 minutes.
3. **Constant-Time Verification**:
   - `User.findOne({ email }).select('+passwordHash')` looks up the user.
   - If the user does not exist, `bcrypt.compare` runs against a dummy hash to prevent timing attacks.
4. **Token Generation & Peppered HMAC**:
   - The server creates a cryptographically secure 48-byte random token (`crypto.randomBytes(48).toString('base64url')`).
   - The database stores **only** an HMAC-SHA256 hash of this token combined with the server pepper (`SESSION_TOKEN_PEPPER`).
   - If the database is compromised, the attacker cannot forge session cookies because the pepper remains secret.
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

### 4. Document Parsing & Storage Pipeline

```
[ Admin uploads .docx or .pdf ]
             |
             v
 [ Multer Memory Storage Buffer ]
             |
             +----------------------------------------------+
             |                                              |
      (If .docx Document)                            (If .pdf Document)
             |                                              |
             v                                              v
 [ Mammoth: In-Memory HTML ]                  [ Cloudinary upload_stream ]
             |                                              |
             v                                              v
 [ Turndown: Convert to Markdown ]            [ Returns HTTPS Raw Asset URL ]
             |                                              |
             +----------------------+-----------------------+
                                    |
                                    v
                     [ MongoDB Content Collection ]
```

---

### 5. AI Chapter Summarization Pipeline

1. The admin composes or pastes chapter markdown notes.
2. The frontend triggers `POST /api/admin/generate-summary` with `{ chapterContentMarkdown }`.
3. The backend validates that content does not exceed 50,000 characters.
4. The service sends the content to **Google Gemini 1.5 Flash** with an academic system prompt:
   > *"Synthesize the educational text into exactly 5 clear, high-yield bullet points for college exam revision."*
5. The generated markdown summary is returned to the frontend editor for preview and saved alongside the chapter materials.

---

### 6. Global Command Search (`Ctrl + K`) Engine

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
Stores all educational materials associated with a specific chapter.
```javascript
{
  chapterId:         { type: String, required: true, unique: true, index: true },
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
  notes: [{
    title:                { type: String, required: true },
    content:              { type: String, required: true },
    subject:              String,
    unit:                 String,
    chapter:              String,
    status:               { type: String, enum: ['draft', 'published'], default: 'draft' },
    originalDocumentUrl:  String,
    originalDocumentName: String,
    createdBy:            { type: ObjectId, ref: 'User' }
  }]
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
| `GET` | `/api/content/:chapterId` | — | Fetches chapter materials (notes, short notes, PYQs, quizzes, AI summary). Filters notes to published only. |
| `GET` | `/api/search` | `?q=search_term` | Debounced full-text search across all notes with relevance scoring. |
| `GET` | `/` | — | Health check endpoint returning `{"status":"healthy","message":"API active"}`. |

### Authentication Routes (`/api/auth`)
| Method | Endpoint | Access Level | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Public (Rate-limited) | Validates credentials, issues `studs_session` HttpOnly cookie. |
| `POST` | `/api/auth/logout` | Authenticated | Revokes session token in MongoDB and clears browser cookie. |
| `GET` | `/api/auth/me` | Authenticated | Returns current authenticated user profile (`id`, `email`, `role`). |

### Admin Management Routes (`/api/admin`)
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
| `POST` | `/api/admin/upload-document` | `content_admin`, `super_admin` | Uploads DOCX/PDF/MD, parses DOCX to Markdown, streams to Cloudinary. |
| `POST` | `/api/admin/generate-summary` | `content_admin`, `super_admin` | Synthesizes chapter markdown into a 5-point summary via Google Gemini. |

---

## 📂 Project Directory Structure

```
college study material project/
├── .gitignore                          # Global git ignore configurations
├── README.md                           # Master project documentation
├── projectinfo.md                      # Detailed architectural references & notes
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
│   │   ├── Content.js                  # Chapter materials, notes, quizzes, PYQs schema
│   │   ├── Session.js                  # Database-backed session schema with TTL index
│   │   ├── Subject.js                  # Subject schema with department & semester indexing
│   │   ├── Unit.js                     # Unit and chapter sub-document schemas
│   │   └── User.js                     # User account schema with password hashes and roles
│   ├── routes/
│   │   ├── adminRoutes.js              # Protected administrative endpoints
│   │   ├── authRoutes.js               # Authentication routes (login, logout, session check)
│   │   └── portalRoutes.js             # Public student portal query & search routes
│   ├── services/
│   │   └── aiService.js                # Google Gemini 1.5 Flash summarization logic
│   └── scripts/
│       ├── createSuperAdmin.js         # CLI tool to securely initialize the first super-admin
│       ├── importDocx.js               # Utility script to test Mammoth DOCX to Markdown conversion
│       ├── securityTest.js             # Automated security regression testing suite
│       ├── seed.js                     # Database seeding script for sample curricula
│       ├── syncSem5.js                 # Semester 5 subject synchronization utility
│       └── syncSem5Syllabus.js         # Full Computer Networks & Semester 5 syllabus seeder
└── frontend/                           # React 19 + Vite + Tailwind CSS Single-Page Application
    ├── .gitignore                      # Frontend ignore rules (dist, node_modules)
    ├── eslint.config.js                # ESLint rules and React hooks configuration
    ├── index.html                      # HTML5 template and viewport setup
    ├── package.json                    # Frontend dependencies and scripts
    ├── package-lock.json               # Frontend dependency lockfile
    ├── vercel.json                     # SPA routing rewrite rules for Vercel deployment
    ├── vite.config.js                  # Vite configuration with React and Tailwind v4 plugins
    ├── public/                         # Public static assets
    └── src/
        ├── App.jsx                     # Root application, routing, Portal UI, and tab viewer
        ├── index.css                   # Global styles importing Tailwind CSS v4 & dark mode rules
        ├── main.jsx                    # React root rendering entry point
        ├── assets/                     # Static media assets and images
        ├── components/
        │   ├── AdminDashboard.jsx      # 6-step cascading admin workspace with authoring modules
        │   └── CommandSearch.jsx       # Global Ctrl+K command palette modal with debounced search
        └── services/
            └── api.js                  # Centralized fetch wrapper (credentials: 'include')
```

---

## 🚀 Installation & Setup Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **MongoDB**: Community Server running locally on port 27017, or a MongoDB Atlas cloud URI
- **Cloudinary Account**: Required for uploading past examination PDF papers
- **Google Gemini API Key**: Required for AI chapter summarization features
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

# Google Gemini API Key (for AI chapter summarization)
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

# (Optional) Seed the complete Semester 5 Computer Networks syllabus units & chapters
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
The server will boot on **`http://localhost:5001`** (or your custom `PORT`).  
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
- **Admin Workspace**: Open [http://localhost:5173/admin](http://localhost:5173/admin) and log in with the super-admin credentials created in Step 4.
- **Global Search**: Press `Ctrl + K` (or `Cmd + K` on Mac) anywhere on the student portal.

---

## ⚡ Automation Scripts & CLI Utilities

Located in `backend/scripts/`:

| Script | Command | Purpose |
| :--- | :--- | :--- |
| `createSuperAdmin.js` | `npm run create:super-admin` | Creates the primary administrative user account safely using environment credentials. |
| `seed.js` | `npm run seed` | Ingests sample subjects, units, notes, past papers, and quizzes into MongoDB. |
| `syncSem5Syllabus.js` | `node scripts/syncSem5Syllabus.js` | Synchronizes syllabus data and chapter outlines for Semester 5 Computer Networks. |
| `syncSem5.js` | `node scripts/syncSem5.js` | Cleans up legacy subject codes and normalizes Semester 5 curriculum ordering. |
| `importDocx.js` | `node scripts/importDocx.js` | Demonstrates and tests Word `.docx` to Markdown conversion using Mammoth & Turndown. |
| `securityTest.js` | `node scripts/securityTest.js` | Automated end-to-end security test suite verifying authentication, RBAC, and origin protection. |
| `testPhase1PdfWorkflow.js` | `node scripts/testPhase1PdfWorkflow.js` | 47-point automated test suite verifying PDF upload, magic bytes, draft/publish lifecycle, text extraction, and persistence. |

---

## 🔒 Security Implementations

1. **Stateful Session Storage**: Avoids insecure client-side token storage (like storing JWTs in `localStorage` where they are vulnerable to XSS). All sessions live in MongoDB with HMAC-SHA256 hashed keys.
2. **Double-Hashed Secrets**: Session tokens are hashed with a server-side pepper secret. Even with database read access, an attacker cannot construct valid authentication cookies.
3. **Automated Session Eviction**: MongoDB TTL indexes clean up expired session documents automatically without requiring cron jobs.
4. **Timing Attack Protection**: Password verification uses constant-time bcrypt checks against a dummy hash when emails do not exist, preventing email enumeration.
5. **Brute-Force Rate Limiting**: The login route is restricted to 10 requests per 15-minute window per IP.
6. **Strict Origin Enforcement**: Cross-Origin requests are restricted to explicitly allowed origins defined in `FRONTEND_ORIGINS`.
7. **Role-Based Guards**: Middleware routes strictly enforce access levels: `student`, `content_admin`, and `super_admin`.

---

## 📄 License

This project is licensed under the **ISC License**. Developed for academic study material management and modern e-learning workflows.
