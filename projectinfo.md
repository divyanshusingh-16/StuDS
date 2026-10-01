# STUDS – College Study Material Portal & Management System

> **Comprehensive Technical Documentation**  
> *Clear, beginner-friendly, and professional guide to the STUDS codebase architecture, features, workflows, and operations.*

---

## 1. Project Overview

### What is STUDS?
**STUDS** is a modern, full-stack educational web application designed for college and university students, professors, and academic administrators. It acts as a centralized repository and interactive learning platform for college study resources.

### The Problem It Solves
In traditional academic environments, college study materials are often scattered across Google Drives, email threads, messaging groups, and disparate websites. Students struggle with:
- Finding notes specific to their exact department, course branch, and semester.
- Accessing past examination question papers (PYQs) without broken links.
- Quickly revising dense topics before exams.
- Self-testing their understanding on specific chapters.
- Lack of centralized content moderation and administration.

### Main Purpose & Solution
STUDS provides a single, structured, responsive web application that organizes academic curricula into a strict, navigable hierarchy:  
**Department &rarr; Course / Specialization &rarr; Semester &rarr; Subject &rarr; Unit &rarr; Chapter**

For each chapter, the system provides four coordinated study formats:
1. **Full Academic Notes** (rendered from rich Markdown, featuring AI-generated chapter summaries).
2. **Key Revision Pointers** (high-yield bullet points for rapid review).
3. **Past Question Papers (PYQs)** (cloud-hosted PDF viewer embedded directly in the browser).
4. **Interactive Practice Quizzes** (self-evaluating multiple-choice questions with instant scoring).

Administrators have access to a secure, role-restricted dashboard to upload PDFs, curate notes, generate AI summaries via Google Gemini, and structure new course tracks.

---

## 2. Technologies Used

### Backend Stack
| Technology / Library | Version | Purpose in STUDS |
| :--- | :--- | :--- |
| **Node.js** | LTS | JavaScript runtime environment executing the backend server. |
| **Express.js** | `^5.2.1` | Minimalist web application framework providing routing, middleware pipelines, and HTTP request handling. |
| **MongoDB & Mongoose** | `^9.6.2` | NoSQL document database and Object Data Modeling (ODM) library for modeling and querying users, sessions, subjects, units, and chapter contents. |
| **Cookie-Parser** | `^1.4.7` | Parses the HTTP request `Cookie` header into `req.cookies` to extract secure session tokens. |
| **CORS** | `^2.8.6` | Configures Cross-Origin Resource Sharing to restrict browser requests to authorized frontend origins with cookie credential support. |
| **Bcrypt** | `^6.0.0` | Secure password hashing algorithm (salt rounds: 12) for protecting user credentials against dictionary and rainbow table attacks. |
| **Express-Rate-Limit** | `^8.6.2` | Protects the authentication endpoints against brute-force login attacks (caps requests to 10 per 15 minutes). |
| **Multer** | `^2.1.1` | Multipart/form-data middleware configured with in-memory storage to handle PDF document file uploads (up to 10MB). |
| **Dotenv** | `^17.4.2` | Loads environment configurations (`PORT`, `MONGO_URI`, API keys) from `.env` files into `process.env`. |
| **Nodemon** | `^3.1.14` | Development utility that automatically restarts the Node server upon code changes. |

### External Services & Cloud APIs
| Service / SDK | Version | Purpose in STUDS |
| :--- | :--- | :--- |
| **Google Generative AI (`@google/generative-ai`)** | `^0.24.1` | Interacts with the Gemini 1.5 Flash AI model to synthesize lengthy chapter notes into dense, 5-point revision summaries. |
| **Cloudinary (`cloudinary`)** | `^2.10.0` | Cloud media storage service used to store past exam paper PDFs streamed securely from the backend. |

### Frontend Stack
| Technology / Library | Version | Purpose in STUDS |
| :--- | :--- | :--- |
| **React 19** | `^19.2.6` | Declarative UI library for building reactive client-side components and state trees. |
| **Vite** | `^8.0.12` | Next-generation frontend build tool and local dev server providing instantaneous Hot Module Replacement (HMR). |
| **Tailwind CSS v4** | `^4.3.0` | Utility-first CSS engine powering the entire design system, dark mode styles, and responsive layouts. |
| **@tailwindcss/vite** | `^4.3.0` | Official Vite plugin integrating Tailwind CSS v4 compiler directly into the build pipeline. |
| **React Router DOM** | `^7.15.1` | Client-side routing library managing navigation between the student portal (`/`) and the admin workspace (`/admin`). |
| **React Markdown** | `^10.1.0` | Renders raw Markdown strings from the database into formatted, sanitized HTML for notes and AI summaries. |
| **Lucide React** | `^1.16.0` | Modern, lightweight icon library providing UI symbols (search, book, chevron, sun/moon, layers, etc.). |

---

## 3. Complete Project Structure

```
college study material project/
├── .gitignore                      # Git ignore rules for root
├── README.md                       # High-level project specifications & security overview
├── projectinfo.md                  # This complete documentation file
├── backend/
│   ├── .env                        # Local backend environment secrets (ignored by git)
│   ├── .env.example                # Template for environment variables
│   ├── .gitignore                  # Git ignore rules for backend (node_modules, .env, db)
│   ├── package.json                # Backend scripts and npm package dependencies
│   ├── package-lock.json           # Backend dependency lockfile
│   ├── server.js                   # Main Express application entry point and database connection
│   ├── config/
│   │   ├── auth.js                 # Session token generator, HMAC hashing, cookie security options
│   │   ├── cloudinary.js           # Cloudinary SDK configuration
│   │   └── gemini.js               # Google Gemini Generative AI client initialization
│   ├── controllers/
│   │   └── contentController.js    # Controller for upserting chapter materials
│   ├── db/                         # Local MongoDB database storage directory (for standalone mongod)
│   ├── middleware/
│   │   ├── authMiddleware.js       # requireAuth, requireRole, requireTrustedOrigin guards
│   │   └── uploadMiddleware.js     # Multer memory storage and PDF MIME-type filter
│   ├── models/
│   │   ├── Content.js              # Mongoose schema for chapter notes, pyqs, quizzes, and AI summaries
│   │   ├── Session.js              # Mongoose schema for database-backed user sessions with TTL auto-expiry
│   │   ├── Subject.js              # Mongoose schema for academic subjects & semester mappings
│   │   ├── Unit.js                 # Mongoose schema for syllabus units and sub-chapters
│   │   └── User.js                 # Mongoose schema for user accounts, passwords, and roles
│   ├── routes/
│   │   ├── adminRoutes.js          # Protected admin endpoints (subject, unit, content upsert, PDF upload, AI)
│   │   ├── authRoutes.js           # Authentication endpoints (login, logout, session verification /me)
│   │   └── portalRoutes.js         # Public student portal endpoints (subjects, units, search, content)
│   └── scripts/
│       ├── createSuperAdmin.js     # CLI utility to create the initial super_admin safely
│       ├── securityTest.js         # Automated security verification test suite
│       └── seed.js                 # Database seeding script for sample university curricula
└── frontend/
    ├── .gitignore                  # Git ignore rules for frontend (node_modules, dist)
    ├── eslint.config.js            # ESLint rules and React hooks configuration
    ├── index.html                  # HTML5 entry page with meta viewport and font setup
    ├── package.json                # Frontend dependencies, scripts (dev, build, lint)
    ├── package-lock.json           # Frontend dependency lockfile
    ├── vercel.json                 # Single-page application (SPA) rewrite rules for Vercel deployment
    ├── vite.config.js              # Vite configuration with React and Tailwind CSS v4 plugins
    ├── public/                     # Static public assets
    └── src/
        ├── App.jsx                 # Main frontend router, Student Portal UI, layout, and tab viewer
        ├── index.css               # Global CSS stylesheet importing Tailwind CSS
        ├── main.jsx                # React root mount point (renders App in StrictMode)
        ├── assets/                 # Frontend media and local assets
        ├── components/
        │   ├── AdminDashboard.jsx  # Multi-level cascading admin portal with form modules & auth gate
        │   └── CommandSearch.jsx   # Global Ctrl+K command palette modal with live debounced search
        └── services/
            └── api.js              # Centralized API fetch wrapper and endpoint methods
```

### Purpose of Important Files & Folders
- **`backend/server.js`**: Initializes Express, registers CORS with origin whitelists, configures cookie parser, connects to MongoDB, and mounts `/api`, `/api/admin`, and `/api/auth`.
- **`backend/config/auth.js`**: Handles cryptographically secure session tokens (48 random bytes), hashes them using HMAC-SHA256 with a private secret (`SESSION_TOKEN_PEPPER`), and constructs strict `HttpOnly` cookie configurations.
- **`backend/middleware/authMiddleware.js`**: Protects sensitive endpoints. Checks the session cookie against MongoDB, validates user status, verifies Role-Based Access Control (`student`, `content_admin`, `super_admin`), and enforces CSRF protection via trusted origin checks.
- **`backend/models/`**: Defines the data schema. Notice `Session.js` uses MongoDB TTL indexing (`expireAfterSeconds: 0`) to automatically purge expired sessions without cron jobs.
- **`backend/services/aiService.js`**: Connects to Google Gemini 1.5 Flash to automatically condense raw Markdown notes into high-impact revision bullet points.
- **`frontend/src/App.jsx`**: Houses the main student portal. Implements the department selection modal, semester navigation, subject/unit/chapter accordion, 4-tab content viewer, and light/dark theme toggle.
- **`frontend/src/components/AdminDashboard.jsx`**: An operations interface allowing administrators to select exact curriculum nodes via a 6-step cascading dropdown and manage all 4 study modules.
- **`frontend/src/components/CommandSearch.jsx`**: Quick-search command palette accessible via `Ctrl+K` or clicking search, supporting keyboard navigation and jumping straight to chapters.
- **`frontend/src/services/api.js`**: A single point of communication with the backend. Automatically passes `credentials: 'include'` so HTTP-only session cookies travel seamlessly on every request.

---

## 4. How the Project Works

### 1. Student Portal Experience (Public Flow)
1. **Initial Visit & Course Configuration**:
   - When a user accesses the portal (`/`), the app checks `localStorage` for a previously saved course preference (`userCourse`).
   - If not found, a configuration modal opens, presenting university departments (`Engineering`, `Management & Business`, `Computing`, `Other Disciplines`) and their specific branches (e.g., `Computer Science (CSE)`, `Agentic AI`).
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
     - **Tab 1: Full Notes**: Displays formatted markdown notes rendered by `ReactMarkdown`. If an AI summary exists, it displays an "AI Chapter Synthesis" box at the top.
     - **Tab 2: Short Notes**: An organized list of revision bullet points.
     - **Tab 3: Past Papers (PYQs)**: Displays available previous exam years. Clicking a paper loads the PDF directly inside an embedded, sandboxed iframe.
     - **Tab 4: Practice Quiz**: Presents an interactive quiz with multiple-choice radio options. Students answer questions sequentially, submit the quiz, and receive an instant score with an answer review.
5. **Command Palette Search (`Ctrl + K`)**:
   - At any time, pressing `Ctrl + K` or clicking the search bar opens `CommandSearch`.
   - Typing triggers a debounced (250ms) MongoDB text search (`/api/search?q=...`) across full notes and short notes.
   - Results show matching chapter titles, unit contexts, and highlighted snippets.
   - Clicking any result navigates straight to that chapter.

### 2. Admin Workspace Flow (Protected Flow)
1. **Authentication & Session Check**:
   - Navigating to `/admin` triggers `getCurrentUser()` (`GET /api/auth/me`).
   - If no valid session cookie is present, an administrative login form is presented.
   - Submitting valid credentials (`POST /api/auth/login`) issues a secure, HttpOnly `studs_session` cookie.
2. **Hierarchical Cascading Selector**:
   - To prevent orphaned or misclassified content, the admin dashboard uses a strict 6-tier cascading dropdown:
     `Department` &rarr; `Course` &rarr; `Semester` &rarr; `Subject` &rarr; `Unit` &rarr; `Chapter`
   - Selecting an item dynamically loads and unlocks the next level while resetting lower-level selections.
3. **Content Ingestion & AI Synthesis**:
   - **Module A (Notes)**: The admin pastes raw markdown text. Clicking **Generate AI Summary** sends the text to the backend, which routes it through Google Gemini 1.5 Flash and displays the preview.
   - **Module B (Short Notes)**: The admin types short bullet points, adding them to an interactive list.
   - **Module C (PYQs)**: The admin specifies an exam year and uploads a local PDF. The PDF is streamed directly to Cloudinary, and the secure HTTPS URL is automatically attached.
   - **Module D (Quiz)**: The admin builds multiple-choice questions with 4 options and designates the correct answer.
4. **Saving Materials**:
   - Clicking **Save Chapter Materials** calls `POST /api/admin/content/upsert`.
   - The backend performs an atomic `findOneAndUpdate` with `{ upsert: true }`, creating or replacing chapter content in MongoDB.

---

## 5. Important Components and Modules

### Frontend Components
- **`App` (`frontend/src/App.jsx`)**:
  - The root router. Renders `Portal` at `/` and `AdminDashboard` at `/admin`.
  - Manages dark mode state (`isDarkMode`) by updating the `<html>` root class and saving to `localStorage`.
  - Manages active tab state, quiz progression state (`currentQuestionIndex`, `userAnswersArray`, `isSubmitted`), and PDF viewer state (`selectedPyq`).
- **`CommandSearch` (`frontend/src/components/CommandSearch.jsx`)**:
  - A modal search palette bound to the `keydown` event (`Ctrl+K`, `Escape`, `ArrowUp`, `ArrowDown`, `Enter`).
  - Implements a 250ms debounce before invoking the API to prevent query flooding.
  - Automatically scrolls active search results into view.
- **`AdminDashboard` (`frontend/src/components/AdminDashboard.jsx`)**:
  - Encapsulates role-based access control checking on mount.
  - Handles the 6-level cascading state machines.
  - Manages multi-part forms for notes, revision lists, PDF file uploads, and quiz question builders.
- **`api.js` (`frontend/src/services/api.js`)**:
  - Defines the `apiFetch` wrapper setting `credentials: 'include'`.
  - Exposes dedicated asynchronous functions: `fetchSubjectsBySemester`, `fetchUnitsBySubject`, `fetchContentByChapter`, `globalSearch`, `uploadPdfFile`, `generateAiSummary`, `loginAdmin`, `getCurrentUser`, `logoutAdmin`, and `upsertContent`.

### Backend Modules & Middleware
- **`authMiddleware.js` (`backend/middleware/authMiddleware.js`)**:
  - `requireAuth`: Reads `req.cookies.studs_session`, hashes it with HMAC-SHA256, looks up the session in MongoDB, validates that the session is unexpired and the user is active, and attaches `req.auth = { user, session }`. Automatically bumps `lastUsedAt` every 5 minutes.
  - `requireRole(...roles)`: Verifies if `req.auth.user.role` matches permitted roles (`content_admin`, `super_admin`). Returns `403 Forbidden` if unauthorized.
  - `requireTrustedOrigin`: Enforces that incoming requests originate from allowed frontend domains (`FRONTEND_ORIGINS`).
- **`uploadMiddleware.js` (`backend/middleware/uploadMiddleware.js`)**:
  - Configures `multer` with memory storage and a strict MIME-type filter permitting only `application/pdf` with a 10MB threshold.
- **`aiService.js` (`backend/services/aiService.js`)**:
  - Interfaces with Google Generative AI (`gemini-1.5-flash`). Enforces an input limit of 50,000 characters and applies a rigorous academic system instruction.
- **`contentController.js` (`backend/controllers/contentController.js`)**:
  - Executes schema validation and performs atomic MongoDB upserts on chapter contents.

---

## 6. Data Flow

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
                                         | JSON Response
                                         v
+-----------------------------------------------------------------------------------+
|                               STUDENT PORTAL VIEW                                 |
|  - Full Notes (ReactMarkdown)                - AI Chapter Summary (Markdown)      |
|  - Past Papers (Iframe via Cloudinary)       - Interactive Quiz (React State)     |
+-----------------------------------------------------------------------------------+
```

### Detailed Flow Descriptions:
1. **Read Flow (Portal View)**:
   - `Frontend` calls `fetchSubjectsBySemester(semester, course)`.
   - `Express` (`portalRoutes.js`) executes `Subject.find({ semester, course }).lean()`.
   - `Frontend` user selects subject &rarr; `Unit.find({ subjectId }).lean()`.
   - `Frontend` user clicks chapter &rarr; `Content.findOne({ chapterId }).lean()`.
   - Data returns as JSON and hydrates React state.
2. **Search Flow (Command Palette)**:
   - User types in `CommandSearch.jsx`.
   - Query sent to `GET /api/search?q={query}`.
   - MongoDB performs a `$text` search over `Content` indexed fields (`fullNotesMarkdown`, `shortNotes`).
   - Results are cross-referenced with `Unit` to attach human-readable unit titles and formatted text snippets before returning to the UI.
3. **Admin Ingestion Flow**:
   - `Admin` enters content and clicks **Generate AI Summary**.
   - `Backend` calls Gemini API (`gemini-1.5-flash`) with system prompt and returns synthesized bullet points.
   - `Admin` selects a PDF file for PYQ &rarr; `Multer` buffers file in RAM &rarr; Cloudinary `upload_stream` sends file to Cloudinary cloud storage &rarr; returns secure HTTPS URL.
   - `Admin` clicks **Save** &rarr; `POST /api/admin/content/upsert` updates MongoDB `Content` record.
4. **Authentication Flow**:
   - Admin submits email and password.
   - `loginLimiter` checks attempt frequency.
   - `User.findOne({ email })` fetches user record with hidden `+passwordHash`.
   - `bcrypt.compare` verifies credentials (using a dummy hash fallback to prevent timing attacks).
   - `crypto.randomBytes(48)` generates a high-entropy session token.
   - Token's HMAC-SHA256 hash is saved to `Session` in MongoDB.
   - Raw token is sent back in an `HttpOnly`, `SameSite`, `Secure` cookie (`studs_session`).

---

## 7. Key Features

- **Strict 6-Tier Academic Hierarchy**: Eliminates messy folder structures by organizing studies into Department, Course, Semester, Subject, Unit, and Chapter.
- **4-in-1 Chapter Content Hub**:
  - Full comprehensive textbook-level markdown notes.
  - Rapid revision bullet points for quick recap.
  - Embedded past exam papers (PDFs) with in-browser preview.
  - Interactive self-testing quiz engine with immediate result tabulation and answer feedback.
- **AI Chapter Synthesis**: Integrates Google Gemini 1.5 Flash to automatically condense verbose course text into concise, 5-point summaries.
- **Instant Global Search (`Ctrl + K`)**: Command-line style search palette with keyboard navigation that searches note contents and jumps straight to matching chapters.
- **Enterprise-Grade Session Authentication**:
  - Database-backed sessions stored only as HMAC-SHA256 hashes.
  - Zero sensitive tokens stored in browser `localStorage`.
  - HTTP-only cookies prevent JavaScript XSS token theft.
  - MongoDB TTL indexes automatically sweep expired sessions.
  - Constant-time password evaluation protects against timing-based user enumeration.
  - Built-in rate limiting prevents brute-force login attempts.
- **Direct Cloud Document Uploads**: Integrates Cloudinary with Multer memory streaming for seamless PDF hosting.
- **Modern Responsive Design**: Dark and Light theme toggle with local storage persistence and mobile-optimized navigation.

---

## 8. How to Run the Project

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

# Cloudinary Credentials (Required for uploading PYQ PDFs)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Google Gemini API Key (Required for AI chapter summarization)
GEMINI_API_KEY=your_google_gemini_api_key
```

> **Note**: In development, `SESSION_TOKEN_PEPPER` can be any random 32+ character string. In production, ensure it is cryptographically generated and kept confidential.

---

### Step 3: Install Backend Dependencies & Seed Data
Inside the `backend/` folder:

```bash
# Install dependencies
npm install

# (Optional) Seed sample college curriculum (Computer Science & Agentic AI tracks)
npm run seed
```

---

### Step 4: Create the Initial Super-Admin Account
To access the admin workspace (`/admin`), create the initial super-admin:

```bash
# Provide temporary environment variables for the command
SUPER_ADMIN_EMAIL="admin@studs.app" SUPER_ADMIN_PASSWORD="YourSecurePassword123!" npm run create:super-admin
```
*(On Windows PowerShell:)*
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

## 9. Important Concepts Used

1. **Role-Based Access Control (RBAC)**:
   - Users are assigned explicit roles: `student` (public reader), `content_admin` (can manage chapter notes, upload PDFs, run AI summaries), and `super_admin` (can manage content plus create new subjects and units).
   - Protected routes enforce roles through modular middleware (`requireRole('super_admin')`).
2. **Database-Backed Session Architecture (Stateful Security)**:
   - Instead of standard stateless JSON Web Tokens (JWTs) which cannot be easily invalidated before expiry, STUDS uses database-persisted sessions.
   - When an admin logs in, a high-entropy 48-byte random token is generated.
   - The database stores **only** an HMAC-SHA256 hash of this token combined with a server-side pepper secret (`SESSION_TOKEN_PEPPER`). Even if the database is leaked, session tokens cannot be derived.
   - Tokens are stored solely in secure HTTP-only cookies, immune to JavaScript XSS theft.
3. **MongoDB TTL (Time-To-Live) Collections**:
   - `Session.js` declares an index on `expiresAt` with `{ expireAfterSeconds: 0 }`. MongoDB background threads automatically delete expired sessions without requiring manual cleanup cron jobs.
4. **Debounced Global Text Search**:
   - The search input triggers a timer that waits 250 milliseconds after the user stops typing before making a network request. This prevents unneeded backend requests on every keystroke.
   - Backend queries utilize MongoDB `$text` search indexes with relevance scoring (`$meta: "textScore"`).
5. **Cascading State Dependencies**:
   - In both the portal and admin dashboard, selecting a parent tier (e.g., Department) resets all child tiers (Course, Semester, Subject, Unit, Chapter) to guarantee state consistency and eliminate invalid queries.
6. **Streaming Cloud Uploads**:
   - PDF uploads utilize Multer in-memory buffering connected to Cloudinary's `upload_stream`. Files are streamed directly to the cloud without writing temporary files to the server's local disk.
7. **Defensive API Hardening**:
   - **Timing Attack Mitigation**: When verifying passwords, if a user email does not exist, bcrypt still hashes against a constant dummy hash string (`DUMMY_PASSWORD_HASH`) to prevent attackers from measuring response time differences to enumerate valid accounts.
   - **CSRF Origin Whitelisting**: `requireTrustedOrigin` verifies the HTTP `Origin` header against explicit domains (`FRONTEND_ORIGINS`) on state-changing requests.

---

## 10. Overall Workflow

Here is a simple step-by-step summary of how the entire STUDS ecosystem operates:

```
[ Academic Administrator ]                      [ Student User ]
           |                                           |
           v                                           v
Logs in at `/admin`                             Opens Portal at `/`
           |                                           |
Selects Department & Subject                    Selects Branch & Semester
           |                                           |
Inputs Markdown Notes                           Browses Syllabus Units
           |                                           |
Clicks "Generate AI Summary" (Gemini)           Selects Chapter
           |                                           |
Uploads Exam PDF (Cloudinary)                   Reads Full Notes & AI Summary
           |                                           |
Creates Quiz Questions                          Reviews Revision Bullet Points
           |                                           |
Saves Materials to MongoDB                      Views Past Papers in Embedded Iframe
           |                                           |
           +-------------------> [ CONTENT ] <---------+
                                 AVAILABLE      Takes Interactive Quiz & Reviews Score
```

1. **Setup**: The college super-admin creates the subjects and units for each semester.
2. **Authoring**: Academic admins select a chapter and compose full notes, revision points, upload previous year exam papers, and author practice quizzes.
3. **AI Enhancement**: Admins trigger Gemini AI to create concise 5-point summaries of the notes.
4. **Discovery**: Students visit the portal, configure their degree stream, select their semester, and instantly access organized course materials.
5. **Search**: Students use `Ctrl + K` to search across all notes and jump straight to the relevant concepts.
6. **Self-Assessment**: Students test their mastery using chapter-specific interactive quizzes with immediate feedback.
