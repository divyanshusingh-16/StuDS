import { useState, useEffect, useCallback, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Sun, 
  Moon, 
  Search, 
  BookOpen, 
  ChevronRight, 
  ChevronDown, 
  Book, 
  Command, 
  Layers,
  HelpCircle,
  FileText,
  Library,
  GraduationCap,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Code2,
  Network,
  Cpu,
  BarChart3,
  Compass,
  ExternalLink,
  Download,
  User,
  X,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { fetchSubjectsBySemester, fetchUnitsBySubject, fetchContentByChapter, fetchQuizAttempt, submitQuizAnswers, normalizePdfUrl, getCurrentUser, logoutAdmin } from './services/api';
import AdminDashboard from './components/AdminDashboard';
import CommandSearch from './components/CommandSearch';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';

function formatFileSize(bytes) {
  if (!bytes || isNaN(bytes)) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

const DEPARTMENT_CATALOG = {
  "Engineering (B.E./M.E.)": ["Aerospace", "Automobile", "Biotechnology", "Chemical", "Civil", "Electrical", "Mechatronics", "Food Technology", "Computer Science (CSE)"],
  "Management & Business (BBA/MBA)": ["General", "Marketing", "Finance", "HR", "Business Analytics", "Tourism & Hospitality"],
  "Computing (BCA/MCA)": ["Cloud Computing", "Agentic AI", "UI/UX Design", "Data Analytics", "Full Stack Development"],
  "Other Disciplines": ["Legal Studies", "Pharmacy", "Applied Health Sciences", "Media Studies", "Animation"]
};

const COURSE_OVERVIEWS = {
  "Project Based Learning in Java": {
    category: "Software Engineering & Systems",
    code: "CS501",
    credits: "4 Credits",
    type: "Core Lab & Theory",
    icon: Code2,
    overview: "A hands-on, project-centric software engineering course emphasizing the architectural design and implementation of enterprise-grade Java applications. Students master object-oriented system design, modular package structures, concurrent programming with thread pools, relational database persistence via JDBC/JPA, design patterns (Singleton, Factory, Observer, MVC), and full lifecycle testing.",
    pillars: ["Enterprise Java", "OOP Architecture", "Concurrency & Multithreading", "JDBC & Data Persistence", "Design Patterns (MVC, Factory)"]
  },
  "Full Stack Development – II": {
    category: "Web Engineering & Distributed Systems",
    code: "CS502",
    credits: "4 Credits",
    type: "Core Engineering",
    icon: Layers,
    overview: "Advanced full-stack web engineering focusing on production-grade client-server architectures, modern component lifecycles, state synchronization, RESTful API design, database modeling and aggregation pipelines, session security, and automated cloud deployments.",
    pillars: ["Modern Component Frameworks", "RESTful Microservices", "MongoDB Aggregations", "Session & Auth Protocols", "Full-Stack Deployment"]
  },
  "Competitive Coding – II": {
    category: "Algorithms & Optimization",
    code: "CS503",
    credits: "3 Credits",
    type: "Core Problem Solving",
    icon: Cpu,
    overview: "Rigorous algorithmic problem solving and time-space optimization targeting advanced programming contests and technical evaluations. Covers complex dynamic programming paradigms, graph traversal and shortest-path algorithms, disjoint-set data structures, greedy techniques, and bit manipulation.",
    pillars: ["Dynamic Programming", "Advanced Graph Algorithms", "Disjoint-Set Union (DSU)", "Greedy Paradigms", "Asymptotic Optimization"]
  },
  "Computer Networks": {
    category: "Systems & Infrastructure",
    code: "CS504",
    credits: "4 Credits",
    type: "Core Systems",
    icon: Network,
    overview: "In-depth study of the foundational principles, structural layered models, and operational protocols of computer networks. Focuses on packet switching, the OSI 7-layer and TCP/IP protocol suites, medium access control, routing algorithms, transport layer flow and congestion control, and network security foundations.",
    pillars: ["OSI & TCP/IP Architecture", "Routing Protocols (OSPF/BGP)", "Transport Layer (TCP/UDP)", "Socket Programming", "Network Security"]
  },
  "Probability and Statistics": {
    category: "Mathematical Sciences",
    code: "MA501",
    credits: "4 Credits",
    type: "Core Mathematics",
    icon: BarChart3,
    overview: "Rigorous mathematical foundations of probability theory, random variables, and statistical inference essential for computer science, machine learning, and algorithm design. Covers probability distributions, expectation, central limit theorem, hypothesis testing, variance estimation, and regression modeling.",
    pillars: ["Discrete & Continuous Distributions", "Random Variables & Expectation", "Central Limit Theorem", "Statistical Hypothesis Testing", "Regression Modeling"]
  },
  "Aptitude – III": {
    category: "Quantitative & Analytical Reasoning",
    code: "GE502",
    credits: "2 Credits",
    type: "Applied Professional Skills",
    icon: Compass,
    overview: "Advanced quantitative problem solving, logical data synthesis, and critical analytical reasoning tailored for university placement examinations and technical assessments. Focuses on speed mathematics, algebraic formulations, permutations, combinations, probability, data interpretation, and deductive logic.",
    pillars: ["Quantitative Problem Solving", "Analytical Reasoning", "Permutations & Combinations", "Data Interpretation", "Speed Mathematics"]
  },
  "Design and Analysis of Algorithms": {
    category: "Algorithms & Complexity",
    code: "CS406",
    credits: "4 Credits",
    type: "Core Theory",
    icon: Cpu,
    overview: "Theoretical foundations and practical methodologies for algorithm design, correctness proving, and complexity analysis. Covers asymptotic bounds, divide-and-conquer, greedy techniques, dynamic programming, graph algorithms, and NP-completeness.",
    pillars: ["Asymptotic Notation", "Divide & Conquer", "Dynamic Programming", "Greedy Methods", "Complexity Classes (P vs NP)"]
  }
};



// ── Portal ────────────────────────────────────────────────────────────────────
function Portal() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  const location = useLocation();

  // ── Student auth state ─────────────────────────────────────────────────────
  const [currentStudent, setCurrentStudent] = useState(null);      // { id, email, role } or null
  const [isAuthLoading, setIsAuthLoading] = useState(true);         // true until /auth/me resolves
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);

  // Restore session on mount
  useEffect(() => {
    getCurrentUser()
      .then(data => setCurrentStudent(data?.user || null))
      .catch(() => setCurrentStudent(null))
      .finally(() => setIsAuthLoading(false));
  }, []);

  // Close user menu on outside click
  useEffect(() => {
    if (!showUserMenu) return;
    function handleClick(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showUserMenu]);

  const handleStudentLogout = useCallback(async () => {
    setShowUserMenu(false);
    try { await logoutAdmin(); } catch {}
    setCurrentStudent(null);
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const [selectedCourse, setSelectedCourse] = useState(() => {
    const stored = localStorage.getItem('userCourse');
    if (stored) {
      // Validate stored course against current catalog to clear stale values
      const isValid = Object.entries(DEPARTMENT_CATALOG).some(([dept, specs]) =>
        specs.some(spec => stored === `${dept}: ${spec}`)
      );
      if (!isValid) {
        localStorage.removeItem('userCourse');
        return "Engineering (B.E./M.E.): Computer Science (CSE)";
      }
      return stored;
    }
    return "Engineering (B.E./M.E.): Computer Science (CSE)";
  });
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(() => {
    const stored = localStorage.getItem('userCourse');
    if (!stored) return true;
    const isValid = Object.entries(DEPARTMENT_CATALOG).some(([dept, specs]) =>
      specs.some(spec => stored === `${dept}: ${spec}`)
    );
    return !isValid;
  });

  const [selectedSemester, setSelectedSemester] = useState(5);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [subjectUnitsMap, setSubjectUnitsMap] = useState({});
  const [expandedSubject, setExpandedSubject] = useState("");
  const [expandedUnit, setExpandedUnit] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [content, setContent] = useState(null);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);
  const [contentLoading, setContentLoading] = useState(false);
  
  const tabs = [
    { id: 'full-notes', label: 'Study Material' },
    { id: 'shortNotes', label: 'Study Resources' },
    { id: 'pyqs', label: 'Past Papers' },
    { id: 'quiz', label: 'Practice Quiz' }
  ];
  
  const [activeTab, setActiveTab] = useState('full-notes');

  // Tab B States: Study Resources Subtabs
  const [studyResourceSubTab, setStudyResourceSubTab] = useState('shortNotes'); // 'shortNotes' | 'topics' | 'definitions' | 'revision'

  // Tab C States: Past Papers
  const [selectedPyq, setSelectedPyq] = useState(null);

  // Tab D States: Secure Quiz Practice
  const [quizAttempt, setQuizAttempt] = useState(null);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(false);
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);
  const [quizSubmissionResult, setQuizSubmissionResult] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [quizError, setQuizError] = useState('');
  const semesters = [1, 2, 3, 4, 5, 6, 7, 8];

  const handleCourseSelect = (dept, spec) => {
    const courseString = `${dept}: ${spec}`;
    setSelectedCourse(courseString);
    localStorage.setItem('userCourse', courseString);
    
    // Cascading state reset
    setSelectedSemester(5);
    setSubjects([]);
    setSelectedSubject(null);
    setSubjectUnitsMap({});
    setExpandedSubject("");
    setExpandedUnit(null);
    setSelectedChapter(null);
    setContent(null);
    setIsCourseModalOpen(false);
  };

  const handleNavigate = (item) => {
    if (item.semester) setSelectedSemester(item.semester);
    if (item.subjectId) {
      const match = subjects.find(s => s._id === item.subjectId);
      if (match) {
        setSelectedSubject(match);
      } else {
        setSelectedSubject({ _id: item.subjectId, subjectName: item.title });
      }
    }
    if (item.chapterId) {
      setSelectedChapter(item);
    }
  };

  useEffect(() => {
    if (!selectedSemester || !selectedCourse || !currentStudent) return;
    setIsLoadingSubjects(true);
    fetchSubjectsBySemester(selectedSemester, selectedCourse)
      .then(data => {
        const cleanList = Array.isArray(data) ? data : [];
        setSubjects(cleanList);
        setSelectedSubject(null);
        setSubjectUnitsMap({});
        setSelectedChapter(null);
        setContent(null);
      })
      .catch(err => {
        console.error('Failed to fetch subjects:', err);
        setSubjects([]);
      })
      .finally(() => setIsLoadingSubjects(false));
  }, [selectedSemester, selectedCourse, currentStudent]);

  const handleSelectSubject = (sub) => {
    setSelectedSubject(sub);
    setSelectedChapter(null);
    setContent(null);

    const isExpanding = expandedSubject !== sub._id;
    setExpandedSubject(isExpanding ? sub._id : "");

    if (!subjectUnitsMap[sub._id]) {
      fetchUnitsBySubject(sub._id)
        .then(data => {
          setSubjectUnitsMap(prev => ({
            ...prev,
            [sub._id]: Array.isArray(data) ? data : []
          }));
        })
        .catch(err => {
          console.error('Failed to fetch units:', err);
          setSubjectUnitsMap(prev => ({ ...prev, [sub._id]: [] }));
        });
    }
  };

  useEffect(() => {
    if (!selectedChapter) return;
    setContentLoading(true);
    fetchContentByChapter(selectedChapter.chapterId)
      .then(data => {
        setContent(data);
        setActiveTab('full-notes');
      })
      .catch(err => {
        console.error('Failed to fetch chapter content:', err);
        setContent(null);
      })
      .finally(() => setContentLoading(false));
  }, [selectedChapter]);

  const startQuizAttempt = async () => {
    if (!selectedChapter) return;
    setIsLoadingQuiz(true);
    setQuizError('');
    setQuizSubmissionResult(null);
    setQuizAnswers({});
    setCurrentQuizIndex(0);
    try {
      const data = await fetchQuizAttempt(selectedChapter.chapterId);
      setQuizAttempt(data);
    } catch (err) {
      setQuizError(err.message || 'Failed to start quiz attempt.');
      setQuizAttempt(null);
    } finally {
      setIsLoadingQuiz(false);
    }
  };

  // Reset tab-specific states when switching tabs or chapters
  useEffect(() => {
    setSelectedPyq(null);
    if (activeTab === 'quiz' && selectedChapter && !quizAttempt && !quizSubmissionResult && !isLoadingQuiz) {
      startQuizAttempt();
    }
  }, [activeTab, selectedChapter]);

  const handleSelectQuizOption = (questionId, option) => {
    setQuizAnswers(prev => ({
      ...prev,
      [questionId]: option
    }));
  };

  const handleNextQuizQuestion = () => {
    if (!quizAttempt?.questions) return;
    if (currentQuizIndex < quizAttempt.questions.length - 1) {
      setCurrentQuizIndex(prev => prev + 1);
    }
  };

  const handlePrevQuizQuestion = () => {
    if (currentQuizIndex > 0) {
      setCurrentQuizIndex(prev => prev - 1);
    }
  };

  const handleSubmitQuiz = async () => {
    if (!quizAttempt || isSubmittingQuiz) return;
    setIsSubmittingQuiz(true);
    setQuizError('');
    try {
      const answersList = (quizAttempt.questions || []).map(q => ({
        questionId: q._id,
        selectedAnswer: quizAnswers[q._id] || ''
      }));
      const result = await submitQuizAnswers(selectedChapter.chapterId, quizAttempt.attemptId, answersList);
      setQuizSubmissionResult(result);
    } catch (err) {
      setQuizError(err.message || 'Failed to submit quiz.');
    } finally {
      setIsSubmittingQuiz(false);
    }
  };

  const sortedPyqs = content?.pyqLinks ? [...content.pyqLinks].sort((a, b) => b.year - a.year) : [];

  const selectedUnits = selectedSubject ? (subjectUnitsMap[selectedSubject._id] || []) : [];
  const selectedMeta = selectedSubject ? (COURSE_OVERVIEWS[selectedSubject.subjectName] || {}) : {};
  const SubjectIcon = selectedMeta.icon || BookOpen;

  if (isAuthLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#f8f8f7] dark:bg-[#0f1013] text-neutral-500 font-sans">
        <div className="w-8 h-8 border-2 border-neutral-400 dark:border-neutral-600 border-t-transparent rounded-full animate-spin mb-3" />
        <span className="text-xs font-mono tracking-wider">Authenticating StuDS Portal…</span>
      </div>
    );
  }

  if (!currentStudent) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div className="h-screen w-full bg-[#f8f8f7] dark:bg-[#0f1013] flex flex-col font-sans text-neutral-900 dark:text-neutral-100 overflow-hidden transition-colors duration-150">
      <CommandSearch onNavigate={handleNavigate} />

      {/* HEADER NAVBAR */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-6 lg:px-8 h-16 bg-white dark:bg-[#14161a] border-b border-neutral-200 dark:border-[#222428] shrink-0">
        <div className="flex items-center gap-6">
          <span className="text-lg font-bold tracking-tight text-neutral-900 dark:text-white flex items-center gap-2.5 pr-5 border-r border-neutral-200 dark:border-[#222428]">
            <Layers className="w-5 h-5 text-neutral-800 dark:text-neutral-200" />
            STUDS
          </span>

          {/* Department / Stream Picker Button */}
          <button 
            onClick={() => setIsCourseModalOpen(true)}
            className="flex items-center gap-2 text-sm font-medium text-neutral-800 dark:text-neutral-200 bg-neutral-50 dark:bg-[#1a1c22] border border-neutral-200 dark:border-[#2a2d34] px-3.5 py-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-[#22252c] max-w-[260px] md:max-w-sm truncate shadow-2xs"
          >
            <span className="truncate">{selectedCourse || "Select Course"}</span>
            <ChevronDown className="w-4 h-4 shrink-0 text-neutral-400" />
          </button>
          
          {/* Semester Selector Tabs */}
          <nav className="hidden md:flex items-center gap-1.5 bg-neutral-100 dark:bg-[#1a1c22] p-1 rounded-xl border border-neutral-200 dark:border-[#26282e]">
            {semesters.map((sem) => (
              <button
                key={sem}
                onClick={() => {
                  setSelectedSemester(sem);
                  setSelectedSubject(null);
                  setSelectedChapter(null);
                }}
                className={`px-3.5 py-1.5 text-sm font-medium rounded-lg ${
                  selectedSemester === sem
                    ? 'bg-white text-neutral-950 shadow-2xs font-semibold dark:bg-[#22252c] dark:text-white'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-white/60 dark:text-neutral-400 dark:hover:text-neutral-200 dark:hover:bg-[#22252c]/50'
                }`}
              >
                Sem {sem}
              </button>
            ))}
          </nav>
        </div>

        {/* Quick Search & Theme Actions */}
        <div className="flex items-center gap-3 w-1/3 justify-end">
          <button 
            onClick={() => window.dispatchEvent(new Event('open-command-palette'))}
            className="relative w-full max-w-sm group hidden md:flex items-center text-left"
          >
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-neutral-400 dark:text-neutral-500" />
            <div 
              className="w-full text-sm pl-9 pr-14 py-2 rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-400 dark:border-[#26282e] dark:bg-[#16181d] dark:text-neutral-500 transition-colors shadow-2xs"
            >
              Search notes, past papers...
            </div>
            <div className="absolute right-2.5 top-2 flex items-center gap-1 px-2 py-0.5 text-xs font-mono font-medium text-neutral-500 bg-white border border-neutral-200 rounded-md dark:bg-[#202329] dark:border-[#2c2f37] dark:text-neutral-400">
              <Command className="w-3 h-3" />K
            </div>
          </button>

          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-[#202329] text-neutral-600 dark:text-neutral-300 transition-colors"
            aria-label="Toggle Theme"
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* Student Account Menu */}
          {currentStudent && (
            <div className="relative" ref={userMenuRef}>
              <button
                id="student-user-menu-btn"
                onClick={() => setShowUserMenu(v => !v)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-[#2a2d36] bg-white dark:bg-[#1a1c22] hover:bg-neutral-50 dark:hover:bg-[#22252c] transition-colors shadow-2xs"
                aria-label="Account menu"
                aria-haspopup="true"
                aria-expanded={showUserMenu}
              >
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 bg-neutral-900 dark:bg-white dark:text-neutral-900">
                  {(currentStudent.uid || currentStudent.email)?.[0]?.toUpperCase() || 'S'}
                </div>
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-200 hidden sm:block max-w-[120px] truncate">
                  {currentStudent.uid || currentStudent.email?.split('@')[0]}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-60 rounded-xl shadow-xl border border-neutral-200 dark:border-[#2a2d36] bg-white dark:bg-[#16181d] overflow-hidden z-50" role="menu">
                  {/* User info */}
                  <div className="px-4 py-3 border-b border-neutral-100 dark:border-[#22252c]">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold shrink-0 bg-neutral-900 dark:bg-white dark:text-neutral-900">
                        {(currentStudent.uid || currentStudent.email)?.[0]?.toUpperCase() || 'S'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-neutral-900 dark:text-white truncate">
                          {currentStudent.uid || currentStudent.email?.split('@')[0]}
                        </p>
                        <p className="text-xs text-neutral-400 dark:text-neutral-500 truncate">{currentStudent.email}</p>
                      </div>
                    </div>
                    <span className="mt-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-neutral-100 dark:bg-[#20232a] text-neutral-700 dark:text-neutral-300 capitalize border border-neutral-200 dark:border-[#2a2d36]">
                      {currentStudent.role || 'student'}
                    </span>
                  </div>
                  {/* Actions */}
                  <div className="p-1.5 space-y-1">
                    {(currentStudent.role === 'super_admin' || currentStudent.role === 'content_admin') && (
                      <a
                        href="/admin"
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-100 dark:hover:bg-[#20232a] transition-colors font-medium no-underline"
                        role="menuitem"
                      >
                        <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        Admin Workspace
                      </a>
                    )}
                    <button
                      id="student-signout-btn"
                      onClick={handleStudentLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-medium"
                      role="menuitem"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      <main className="flex flex-1 min-h-0">
        {/* SIDEBAR NAVIGATION */}
        <aside className="w-72 lg:w-80 bg-white dark:bg-[#14161a] border-r border-neutral-200 dark:border-[#222428] p-5 select-none shrink-0 overflow-y-auto">
          {/* Mobile Semester fallback */}
          <div className="md:hidden mb-4 pb-4 border-b border-neutral-200 dark:border-[#222428]">
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2 block">Semester</span>
            <div className="flex flex-wrap gap-1.5">
              {semesters.map(sem => (
                <button
                  key={sem}
                  onClick={() => {
                    setSelectedSemester(sem);
                    setSelectedSubject(null);
                    setSelectedChapter(null);
                  }}
                  className={`w-9 h-9 flex items-center justify-center text-sm font-medium rounded-lg transition-all ${
                    selectedSemester === sem 
                      ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 font-semibold' 
                      : 'bg-neutral-50 text-neutral-600 dark:bg-[#1a1c22] dark:text-neutral-400 border border-neutral-200 dark:border-[#282b33]'
                  }`}
                >
                  {sem}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between mb-3 px-2">
            <div className="flex items-center gap-2 text-xs font-bold text-neutral-500 dark:text-neutral-400 tracking-wider uppercase">
              <BookOpen className="w-4 h-4" />
              Subjects
            </div>
            {selectedSemester && (
              <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-[#1f2228] text-neutral-600 dark:text-neutral-400 font-semibold">
                Sem {selectedSemester}
              </span>
            )}
          </div>

          {!selectedSemester ? (
            <p className="text-sm text-neutral-400 px-2 italic">Select a semester above to load subjects.</p>
          ) : isLoadingSubjects && subjects.length === 0 ? (
            <p className="text-sm text-neutral-400 px-2 animate-pulse">Loading semester subjects...</p>
          ) : subjects.length === 0 ? (
            <p className="text-sm text-neutral-400 px-2 italic">No subjects registered for this branch yet.</p>
          ) : (
            <div className="space-y-1.5">
              {subjects.map((sub) => {
                const isSelected = selectedSubject?._id === sub._id;
                const isSubExpanded = expandedSubject === sub._id;
                const subjectUnits = subjectUnitsMap[sub._id] || [];

                return (
                  <div key={sub._id} className="space-y-1">
                    <button
                      onClick={() => handleSelectSubject(sub)}
                      className={`sidebar-subject-btn w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left ${
                        isSelected
                          ? 'bg-neutral-100 text-neutral-950 font-semibold dark:bg-[#1f2228] dark:text-white border border-neutral-200 dark:border-[#2a2d34] shadow-2xs'
                          : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950 dark:text-neutral-300 dark:hover:bg-[#1a1c22]/70 dark:hover:text-white'
                      }`}
                    >
                      <div className="flex flex-col min-w-0 pr-2">
                        <span className="text-sm truncate font-medium">{sub.subjectName}</span>
                        {sub.subjectCode && (
                          <span className="text-xs font-mono tracking-tight text-neutral-400 dark:text-neutral-500">{sub.subjectCode}</span>
                        )}
                      </div>
                      {subjectUnits && subjectUnits.length > 0 ? (
                        isSubExpanded ? <ChevronDown className="w-4 h-4 shrink-0 text-neutral-400" /> : <ChevronRight className="w-4 h-4 shrink-0 text-neutral-400" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 shrink-0 text-neutral-300 dark:text-neutral-600 opacity-60" />
                      )}
                    </button>

                    {/* Render Subject Units if Expanded and Available */}
                    {isSubExpanded && (
                      <div className="pl-3.5 border-l-2 border-neutral-200 dark:border-[#222428] ml-3.5 space-y-1 py-1">
                        {subjectUnits.length === 0 ? (
                          <span className="text-xs text-neutral-400 italic px-2 block">Syllabus in preparation</span>
                        ) : (
                          subjectUnits.map((unit) => {
                            const isUnitExpanded = expandedUnit === unit._id;
                            return (
                              <div key={unit._id} className="space-y-1">
                                <button
                                  onClick={() => setExpandedUnit(isUnitExpanded ? null : unit._id)}
                                  className="w-full flex items-center justify-between py-1.5 px-2.5 rounded-md text-xs font-medium text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950 dark:text-neutral-400 dark:hover:bg-[#1f2228] dark:hover:text-neutral-200 text-left transition-colors duration-150"
                                >
                                  <span className="truncate font-medium">Unit {unit.unitNumber}: {unit.unitName}</span>
                                  {isUnitExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                                </button>

                                {/* Render Chapters if Unit is Expanded */}
                                {isUnitExpanded && (
                                  <div className="pl-2 space-y-1 py-0.5">
                                    {unit.chapters.map((chap) => (
                                      <button
                                        key={chap.chapterId}
                                        onClick={() => setSelectedChapter(chap)}
                                        className={`w-full text-left text-xs py-1.5 px-3 rounded-md truncate transition-colors duration-150 ${
                                          selectedChapter?.chapterId === chap.chapterId
                                            ? 'bg-neutral-200/90 text-neutral-950 font-bold dark:bg-[#282b33] dark:text-white'
                                            : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-[#1f2228] dark:hover:text-neutral-200'
                                        }`}
                                      >
                                        {chap.chapterName}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </aside>

        {/* MAIN CONTENT AREA */}
        <section className="flex-1 overflow-y-auto p-6 md:p-8 lg:p-10 relative bg-[#f8f8f7] dark:bg-[#0f1013] min-w-0">
          {contentLoading && (
            <div className="absolute top-8 right-8 text-sm font-semibold text-neutral-500 dark:text-neutral-400 animate-pulse bg-white/80 dark:bg-[#14161a]/80 px-4 py-2 rounded-lg border border-neutral-200 dark:border-[#222428] shadow-xs">
              Loading study resources...
            </div>
          )}

          {/* VIEW CONDITION 1: CHAPTER CONTENT ACTIVE */}
          {selectedChapter ? (
            content ? (
              <div className="w-full max-w-[1560px] mx-auto flex flex-col min-h-full bg-white border border-neutral-200/80 rounded-2xl p-6 md:p-8 lg:p-10 dark:bg-[#14161a] dark:border-[#222428] shadow-xs">
                {/* Back to Subject Workspace Breadcrumb */}
                <div className="mb-6 pb-4 border-b border-neutral-100 dark:border-[#202227] flex items-center justify-between">
                  <button
                    onClick={() => setSelectedChapter(null)}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-600 hover:text-neutral-950 dark:text-neutral-300 dark:hover:text-white"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to {selectedSubject?.subjectName || 'Subject'} Workspace
                  </button>
                  <span className="text-xs font-mono font-bold text-neutral-500 dark:text-neutral-400 px-2.5 py-1 rounded-md bg-neutral-100 dark:bg-[#1c1f26]">
                    {selectedSubject?.subjectCode || ''}
                  </span>
                </div>

                <header className="border-b border-neutral-200 dark:border-[#222428] pb-5 mb-8 shrink-0">
                  <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight mb-2 text-neutral-900 dark:text-white leading-tight">
                    {selectedChapter.chapterName}
                  </h1>
                  <p className="text-sm md:text-base text-neutral-600 dark:text-neutral-400 mb-6 font-medium">
                    {selectedSubject?.subjectName} • Chapter Reference & Study Modules
                  </p>
                  
                  <div className="flex gap-8 overflow-x-auto pb-1">
                    {tabs.map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`tab-btn pb-3 text-sm md:text-base font-bold tracking-wide whitespace-nowrap border-b-2 ${
                          activeTab === tab.id
                            ? 'border-neutral-900 dark:border-white text-neutral-900 dark:text-white'
                            : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 hover:border-neutral-300 dark:hover:text-neutral-200 dark:hover:border-neutral-600'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </header>

                <div className="flex-1 pb-8">
                  {/* TAB 1: FULL NOTES & STUDY MATERIAL */}
                  {activeTab === 'full-notes' && (
                    <div className="flex flex-col gap-8">
                      {content.aiSummary && (
                        <div className="bg-neutral-50/80 border border-neutral-200 dark:bg-[#1a1c22] dark:border-[#2a2d34] rounded-2xl p-6 lg:p-8 shadow-2xs">
                          <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200 mb-3 flex items-center gap-2">
                            Academic Synthesis Summary
                          </h3>
                          <div className="text-base text-neutral-800 dark:text-neutral-200 leading-relaxed markdown-content">
                            <ReactMarkdown>{content.aiSummary}</ReactMarkdown>
                          </div>
                        </div>
                      )}

                      {content.notes && content.notes.length > 0 ? (() => {
                        // Only render notes that have meaningful content (a PDF URL or real text)
                        const renderableNotes = content.notes.filter(note =>
                          (note.fileUrl || note.originalDocumentUrl) ||
                          (note.content && note.content.trim().length > 20)
                        );
                        return renderableNotes.length > 0 ? (
                          <div className="flex flex-col gap-10">
                            {renderableNotes.map(note => {
                              const rawPdfUrl = note.fileUrl || note.originalDocumentUrl;
                              const pdfUrl = normalizePdfUrl(rawPdfUrl);
                              // isPdf is true ONLY when there's an actual PDF URL attached
                              const isPdf = Boolean(
                                pdfUrl && (
                                  pdfUrl.toLowerCase().includes('.pdf') ||
                                  note.mimeType === 'application/pdf'
                                )
                              );

                              return (
                                <div key={note._id} className="flex flex-col gap-6 border-b border-neutral-100 dark:border-[#222428] pb-10 last:border-0 last:pb-0">
                                  {/* Note Header & Actions Card */}
                                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 p-6 bg-neutral-50 dark:bg-[#181a20] border border-neutral-200 dark:border-[#282b33] rounded-2xl shadow-2xs">
                                    <div className="flex flex-col gap-1.5">
                                      <div className="flex flex-wrap items-center gap-2.5">
                                        <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50">
                                          Published Material
                                        </span>
                                        <span className="text-sm text-neutral-600 dark:text-neutral-400 font-medium">
                                          {selectedSubject?.subjectName} • {selectedChapter?.chapterName}
                                        </span>
                                      </div>
                                      <h2 className="text-xl md:text-2xl font-extrabold tracking-tight text-neutral-900 dark:text-white mt-1">
                                        {note.title}
                                      </h2>
                                      {note.fileName && (
                                        <p className="text-sm text-neutral-500 dark:text-neutral-400 flex items-center gap-2 mt-0.5">
                                          <FileText className="w-4 h-4 text-neutral-400" />
                                          <span className="font-medium">{note.fileName}</span>
                                          {note.fileSize && (
                                            <span className="text-neutral-400 font-mono text-xs">
                                              ({formatFileSize(note.fileSize)})
                                            </span>
                                          )}
                                        </p>
                                      )}
                                    </div>

                                    {pdfUrl && (
                                      <div className="flex flex-wrap items-center gap-3 shrink-0">
                                        <a
                                          href={pdfUrl}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-white dark:bg-[#20232a] border border-neutral-300 dark:border-[#2d313a] text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-[#282b33] shadow-2xs no-underline"
                                        >
                                          <ExternalLink className="w-4 h-4" />
                                          Open in New Tab
                                        </a>
                                        <a
                                          href={pdfUrl}
                                          download={note.fileName || `${note.title}.pdf`}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="inline-flex items-center gap-2 px-4.5 py-2.5 text-sm font-semibold rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-100 shadow-2xs no-underline"
                                        >
                                          <Download className="w-4 h-4" />
                                          Download PDF
                                        </a>
                                      </div>
                                    )}
                                  </div>

                                  {/* Accessible Embedded PDF Viewer */}
                                  {isPdf && pdfUrl && (
                                    <div className="w-full rounded-2xl overflow-hidden border border-neutral-200 dark:border-[#2a2d34] bg-neutral-100 dark:bg-[#16181d] shadow-xs">
                                      <div className="bg-neutral-50 dark:bg-[#1b1d23] px-5 py-3 border-b border-neutral-200 dark:border-[#26282e] flex items-center justify-between text-sm text-neutral-600 dark:text-neutral-400 font-medium">
                                        <span className="flex items-center gap-2.5">
                                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                                          <span className="font-semibold text-neutral-800 dark:text-neutral-200">Interactive Document Viewer</span>
                                        </span>
                                        <span className="text-xs text-neutral-400">Scroll to browse pages</span>
                                      </div>
                                      <iframe
                                        src={pdfUrl}
                                        className="w-full h-[82vh] min-h-[720px] bg-white dark:bg-[#16181d]"
                                        title={note.title}
                                      />
                                    </div>
                                  )}

                                  {/* Supplementary / Extracted Markdown Content (if provided alongside a PDF) */}
                                  {note.content && note.content.trim().length > 20 && (
                                    <div className={`markdown-content text-base md:text-[17px] leading-[1.65] ${isPdf ? 'pt-8 border-t border-neutral-200 dark:border-[#282b33]' : ''}`}>
                                      <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-neutral-200 dark:border-[#222428] text-sm font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                                        <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                        <span>Structured Study Notes & Syllabus Guide</span>
                                      </div>
                                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{note.content}</ReactMarkdown>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : content.fullNotesMarkdown ? (
                          <div className="markdown-content text-base md:text-[17px] leading-[1.65]">
                            <ReactMarkdown>{content.fullNotesMarkdown}</ReactMarkdown>
                          </div>
                        ) : (
                          <div className="py-16 px-8 border border-neutral-200 dark:border-[#222428] rounded-2xl bg-neutral-50/50 dark:bg-[#14161a] text-center flex flex-col items-center justify-center">
                            <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-[#1f2228] flex items-center justify-center mb-4 text-neutral-400">
                              <BookOpen className="w-6 h-6" />
                            </div>
                            <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-1.5">
                              No published study materials available for this chapter yet
                            </h3>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-md">
                              Lecture notes and PDF attachments are currently being curated by the academic department.
                            </p>
                          </div>
                        );
                      })() : content.fullNotesMarkdown ? (
                        <div className="markdown-content text-base md:text-[17px] leading-[1.65]">
                          <ReactMarkdown>{content.fullNotesMarkdown}</ReactMarkdown>
                        </div>
                      ) : (
                        <div className="py-16 px-8 border border-neutral-200 dark:border-[#222428] rounded-2xl bg-neutral-50/50 dark:bg-[#14161a] text-center flex flex-col items-center justify-center">
                          <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-[#1f2228] flex items-center justify-center mb-4 text-neutral-400">
                            <BookOpen className="w-6 h-6" />
                          </div>
                          <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-1.5">
                            No published study materials available for this chapter yet
                          </h3>
                          <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-md">
                            Lecture notes and PDF attachments are currently being curated by the academic department.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 2: STUDY RESOURCES (SHORT NOTES, TOPICS, DEFINITIONS, EXAM REVISION) */}
                  {activeTab === 'shortNotes' && (() => {
                    const res = content.studyResources || null;
                    const shortNotesList = res?.shortNotes?.length > 0 ? res.shortNotes : (content.shortNotes || []);
                    const topicsList = res?.importantTopics || [];
                    const defsList = res?.keyDefinitions || [];
                    const revisionMarkdown = res?.examRevisionNotes || '';

                    return (
                      <div className="flex flex-col gap-5">
                        {/* Sub-tab Navigation */}
                        <div className="flex flex-wrap items-center gap-2 p-1.5 bg-neutral-100 dark:bg-[#1a1c22] rounded-xl border border-neutral-200 dark:border-[#282b33] w-fit">
                          <button
                            onClick={() => setStudyResourceSubTab('shortNotes')}
                            className={`px-4 py-2 text-xs md:text-sm font-semibold rounded-lg transition-all ${
                              studyResourceSubTab === 'shortNotes'
                                ? 'bg-white dark:bg-[#252830] text-neutral-900 dark:text-white shadow-xs'
                                : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
                            }`}
                          >
                            📝 High-Yield Bullets ({shortNotesList.length})
                          </button>
                          {topicsList.length > 0 && (
                            <button
                              onClick={() => setStudyResourceSubTab('topics')}
                              className={`px-4 py-2 text-xs md:text-sm font-semibold rounded-lg transition-all ${
                                studyResourceSubTab === 'topics'
                                  ? 'bg-white dark:bg-[#252830] text-neutral-900 dark:text-white shadow-xs'
                                  : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
                              }`}
                            >
                              🎯 Important Topics ({topicsList.length})
                            </button>
                          )}
                          {defsList.length > 0 && (
                            <button
                              onClick={() => setStudyResourceSubTab('definitions')}
                              className={`px-4 py-2 text-xs md:text-sm font-semibold rounded-lg transition-all ${
                                studyResourceSubTab === 'definitions'
                                  ? 'bg-white dark:bg-[#252830] text-neutral-900 dark:text-white shadow-xs'
                                  : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
                              }`}
                            >
                              📖 Key Definitions ({defsList.length})
                            </button>
                          )}
                          {revisionMarkdown && (
                            <button
                              onClick={() => setStudyResourceSubTab('revision')}
                              className={`px-4 py-2 text-xs md:text-sm font-semibold rounded-lg transition-all ${
                                studyResourceSubTab === 'revision'
                                  ? 'bg-white dark:bg-[#252830] text-neutral-900 dark:text-white shadow-xs'
                                  : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
                              }`}
                            >
                              📑 Exam Revision Guide
                            </button>
                          )}
                        </div>

                        {/* SUBTAB 1: Short Notes Bullets */}
                        {studyResourceSubTab === 'shortNotes' && (
                          <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-[#222428]">
                              <span className="text-xs md:text-sm font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                                High-Yield Chapter Takeaways & Revision Points
                              </span>
                              <span className="text-xs md:text-sm text-neutral-400 font-mono font-medium">{shortNotesList.length} Points</span>
                            </div>
                            {shortNotesList.length > 0 ? (
                              <div className="space-y-3">
                                {shortNotesList.map((note, idx) => (
                                  <div
                                    key={idx}
                                    className="resource-card p-4 sm:p-5 rounded-xl border border-neutral-200 dark:border-[#24272f] bg-white dark:bg-[#16181d] text-base md:text-[17px] text-neutral-800 dark:text-neutral-200 leading-[1.65] flex items-start gap-4 shadow-2xs hover:border-neutral-400 dark:hover:border-[#3d4250]"
                                  >
                                    <span className="w-7 h-7 rounded-full bg-neutral-100 dark:bg-[#20232a] text-neutral-700 dark:text-neutral-300 flex items-center justify-center font-mono text-xs shrink-0 font-bold mt-0.5">
                                      {idx + 1}
                                    </span>
                                    <p className="flex-1">{note}</p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-neutral-400 italic">No short revision notes published for this chapter.</p>
                            )}
                          </div>
                        )}

                        {/* SUBTAB 2: Important Topics */}
                        {studyResourceSubTab === 'topics' && (
                          <div className="flex flex-col gap-4">
                            <div className="pb-3 border-b border-neutral-100 dark:border-[#222428]">
                              <span className="text-xs md:text-sm font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                                High-Weightage Examination Topics
                              </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                              {topicsList.map((top, idx) => (
                                <div
                                  key={idx}
                                  className="resource-card p-4 sm:p-5 rounded-xl border border-neutral-200 dark:border-[#24272f] bg-white dark:bg-[#16181d] flex items-start gap-3 shadow-2xs hover:border-neutral-400 dark:hover:border-[#3d4250]"
                                >
                                  <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm mt-0.5">✦</span>
                                  <span className="text-sm md:text-base font-semibold text-neutral-800 dark:text-neutral-200 leading-snug">{top}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* SUBTAB 3: Key Definitions */}
                        {studyResourceSubTab === 'definitions' && (
                          <div className="flex flex-col gap-4">
                            <div className="pb-3 border-b border-neutral-100 dark:border-[#222428]">
                              <span className="text-xs md:text-sm font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                                Core Technical Terminology & Academic Definitions
                              </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {defsList.map((def, idx) => (
                                <div
                                  key={idx}
                                  className="resource-card p-5 rounded-xl border border-neutral-200 dark:border-[#24272f] bg-white dark:bg-[#16181d] flex flex-col gap-2.5 shadow-2xs hover:border-neutral-400 dark:hover:border-[#3d4250]"
                                >
                                  <h4 className="text-base md:text-[17px] font-bold text-neutral-900 dark:text-white flex items-center gap-2.5">
                                    <span className="w-2 h-2 rounded-full bg-violet-500 shrink-0"></span>
                                    <span>{def.term}</span>
                                  </h4>
                                  <p className="text-sm md:text-base text-neutral-700 dark:text-neutral-400 leading-[1.65] pl-4 border-l-2 border-neutral-200 dark:border-[#26282e]">
                                    {def.definition}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* SUBTAB 4: Exam Revision Guide */}
                        {studyResourceSubTab === 'revision' && (
                          <div className="markdown-content text-base md:text-[17px] leading-[1.65] p-6 sm:p-8 md:p-10 bg-white dark:bg-[#16181d] border border-neutral-200 dark:border-[#24272f] rounded-2xl shadow-2xs">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{revisionMarkdown}</ReactMarkdown>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* TAB 3: PAST PAPERS */}
                  {activeTab === 'pyqs' && (
                    <div className="text-base text-neutral-800 dark:text-neutral-200 h-full flex flex-col">
                      {sortedPyqs.length > 0 ? (
                        selectedPyq ? (
                          <div className="flex flex-col h-[82vh] min-h-[700px]">
                            <button 
                              onClick={() => setSelectedPyq(null)}
                              className="text-xs md:text-sm text-neutral-700 hover:text-neutral-950 font-semibold mb-4 self-start border border-neutral-300 px-4 py-2 rounded-lg bg-neutral-50 dark:bg-[#1a1c22] dark:border-[#2a2d34] dark:text-neutral-300 dark:hover:text-white"
                            >
                              &larr; Back to Question Papers List
                            </button>
                            <iframe 
                              src={selectedPyq} 
                              className="w-full flex-1 border border-neutral-200 dark:border-[#2a2d34] rounded-xl bg-neutral-100 dark:bg-[#16181d] shadow-sm" 
                              title="PYQ Viewer"
                            />
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {sortedPyqs.map((pyq, idx) => (
                              <button 
                                key={idx} 
                                onClick={() => setSelectedPyq(normalizePdfUrl(pyq.fileUrl))}
                                className="pyq-card flex items-center justify-between p-5 border border-neutral-200 dark:border-[#26282e] rounded-xl hover:border-neutral-400 dark:hover:border-neutral-500 hover:bg-neutral-50 dark:hover:bg-[#181a20] bg-white dark:bg-[#16181d] text-left shadow-2xs group"
                              >
                                <div>
                                  <span className="font-bold text-base md:text-lg text-neutral-900 dark:text-white block group-hover:text-blue-700 dark:group-hover:text-blue-400">
                                    {pyq.year} Examination Paper
                                  </span>
                                  <span className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 block">University Final Examination Paper</span>
                                </div>
                                <span className="text-xs md:text-sm font-semibold text-neutral-700 dark:text-neutral-300 group-hover:translate-x-1 transition-transform">
                                  Open Viewer &rarr;
                                </span>
                              </button>
                            ))}
                          </div>
                        )
                      ) : (
                        <p className="text-neutral-400 italic">No past papers available for this chapter.</p>
                      )}
                    </div>
                  )}

                  {/* TAB 4: SECURE PRACTICE QUIZ (5 RANDOM QUESTIONS & SERVER-SIDE SCORING) */}
                  {activeTab === 'quiz' && (
                    <div className="text-base text-neutral-800 dark:text-neutral-200 w-full max-w-4xl lg:max-w-5xl mx-auto">
                      {isLoadingQuiz ? (
                        <div className="p-12 border border-neutral-200 dark:border-[#26282e] rounded-2xl bg-white dark:bg-[#16181d] text-center flex flex-col items-center justify-center gap-4 shadow-sm">
                          <span className="w-8 h-8 border-3 border-neutral-300 border-t-neutral-800 dark:border-t-white rounded-full animate-spin inline-block" />
                          <span className="text-sm md:text-base font-medium text-neutral-600 dark:text-neutral-400">Sampling 5 random chapter questions from bank...</span>
                        </div>
                      ) : quizError ? (
                        <div className="p-8 border border-rose-200 bg-rose-50/50 dark:border-rose-900/40 dark:bg-rose-950/20 rounded-2xl text-center flex flex-col items-center gap-4 shadow-sm">
                          <p className="text-sm md:text-base text-rose-700 dark:text-rose-300 font-medium">{quizError}</p>
                          <button
                            onClick={startQuizAttempt}
                            className="px-5 py-2 text-sm font-semibold bg-white dark:bg-[#20232a] border border-neutral-300 dark:border-[#2d313a] rounded-lg shadow-xs hover:bg-neutral-100"
                          >
                            Try Again
                          </button>
                        </div>
                      ) : quizSubmissionResult ? (
                        /* POST-SUBMISSION RESULTS VIEW (WITH SERVER-SIDE SCORE & EXPLANATIONS) */
                        <div className="border border-neutral-200 dark:border-[#26282e] rounded-2xl p-6 sm:p-8 md:p-10 bg-white dark:bg-[#16181d] shadow-sm flex flex-col gap-8">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 pb-6 border-b border-neutral-200 dark:border-[#24272f]">
                            <div>
                              <span className="text-xs md:text-sm font-bold uppercase tracking-wider text-neutral-400">Self-Assessment Results</span>
                              <h3 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-neutral-900 dark:text-white mt-1">
                                You scored {quizSubmissionResult.score} of {quizSubmissionResult.total} ({quizSubmissionResult.percentage}%)
                              </h3>
                              <p className="text-sm md:text-base text-neutral-600 dark:text-neutral-400 mt-2">
                                {quizSubmissionResult.percentage >= 80
                                  ? '🎉 Outstanding! You have mastered the core topics of this chapter.'
                                  : quizSubmissionResult.percentage >= 60
                                  ? '👍 Good performance! Review the explanations below to reinforce your understanding.'
                                  : '📚 Revision recommended. Check the key definitions and retake another practice quiz.'}
                              </p>
                            </div>
                            <button
                              onClick={startQuizAttempt}
                              className="px-5 py-2.5 sm:px-6 sm:py-3 text-xs sm:text-sm md:text-base font-bold bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 rounded-xl hover:opacity-90 transition-opacity shrink-0 shadow-xs"
                            >
                              ↻ Take Another Quiz (5 New Questions)
                            </button>
                          </div>

                          {/* Question-by-Question Review */}
                          <div className="space-y-6">
                            {quizSubmissionResult.results?.map((res, idx) => (
                              <div
                                key={idx}
                                className={`p-5 sm:p-6 rounded-2xl border transition-colors shadow-2xs ${
                                  res.isCorrect
                                    ? 'border-emerald-200 bg-emerald-50/40 dark:border-emerald-900/40 dark:bg-emerald-950/20'
                                    : 'border-rose-200 bg-rose-50/40 dark:border-rose-900/40 dark:bg-rose-950/20'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-3 mb-3">
                                  <span className="text-sm md:text-base lg:text-lg font-bold text-neutral-900 dark:text-white leading-snug">
                                    Q{idx + 1}. {res.question}
                                  </span>
                                  <span
                                    className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-md shrink-0 ${
                                      res.isCorrect
                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'
                                        : 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300'
                                    }`}
                                  >
                                    {res.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                                  </span>
                                </div>

                                <div className="text-sm md:text-base space-y-1.5 mb-3">
                                  <p className="text-neutral-700 dark:text-neutral-300">
                                    <span className="font-semibold">Your Answer:</span>{' '}
                                    <span className={res.isCorrect ? 'text-emerald-700 dark:text-emerald-400 font-medium' : 'text-rose-700 dark:text-rose-400 font-medium'}>
                                      {res.selectedAnswer || '(No answer provided)'}
                                    </span>
                                  </p>
                                  {!res.isCorrect && (
                                    <p className="text-neutral-700 dark:text-neutral-300">
                                      <span className="font-semibold">Correct Answer:</span>{' '}
                                      <span className="text-emerald-700 dark:text-emerald-400 font-semibold">{res.correctAnswer}</span>
                                    </p>
                                  )}
                                </div>

                                {res.explanation && (
                                  <div className="text-xs md:text-sm text-neutral-600 dark:text-neutral-400 pt-3 border-t border-neutral-200/60 dark:border-neutral-700/40 leading-[1.65]">
                                    <span className="font-semibold text-neutral-800 dark:text-neutral-200">Explanation:</span> {res.explanation}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : quizAttempt?.questions?.length > 0 ? (
                        /* ACTIVE QUIZ IN-PROGRESS VIEW */
                        <div className="border border-neutral-200 dark:border-[#26282e] rounded-2xl p-6 sm:p-8 md:p-10 bg-white dark:bg-[#16181d] shadow-sm">
                          {/* Header & Step Tracker */}
                          <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-100 dark:border-[#222428]">
                            <div>
                              <span className="text-xs md:text-sm font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                                Question {currentQuizIndex + 1} of {quizAttempt.questions.length}
                              </span>
                              <span className="text-xs md:text-sm font-mono text-neutral-400 ml-2 hidden sm:inline">
                                (5 Randomly Selected from 20-Question Bank)
                              </span>
                            </div>
                            <span className="text-xs md:text-sm font-mono font-semibold text-neutral-600 dark:text-neutral-400">
                              {Object.keys(quizAnswers).length} / {quizAttempt.questions.length} Answered
                            </span>
                          </div>

                          {/* Progress Bar */}
                          <div className="w-full bg-neutral-100 dark:bg-[#20232a] h-2 rounded-full overflow-hidden mb-8">
                            <div
                              className="bg-neutral-900 dark:bg-white h-full transition-all duration-200"
                              style={{ width: `${((currentQuizIndex + 1) / quizAttempt.questions.length) * 100}%` }}
                            />
                          </div>

                          {/* Current Question */}
                          {(() => {
                            const q = quizAttempt.questions[currentQuizIndex];
                            if (!q) return null;
                            const selected = quizAnswers[q._id] || '';

                            return (
                              <div className="flex flex-col gap-8">
                                <p className="font-bold text-neutral-900 dark:text-white text-lg md:text-xl lg:text-2xl leading-relaxed">
                                  {q.question}
                                </p>

                                {/* 4 Options */}
                                <div className="flex flex-col gap-3.5">
                                  {q.options.map((opt, oIdx) => {
                                    const isChosen = selected === opt;
                                    return (
                                      <label
                                        key={oIdx}
                                        onClick={() => handleSelectQuizOption(q._id, opt)}
                                        className={`quiz-option flex items-center p-4 sm:p-5 md:p-5.5 border-2 rounded-xl sm:rounded-2xl cursor-pointer text-sm md:text-base lg:text-[17px] ${
                                          isChosen
                                            ? 'quiz-option--chosen border-neutral-900 bg-neutral-100 text-neutral-950 font-bold dark:border-white dark:bg-[#20232a] dark:text-white shadow-2xs'
                                            : 'border-neutral-200 hover:bg-neutral-50 hover:border-neutral-400 dark:border-[#282b33] dark:hover:bg-[#1a1c22] dark:hover:border-[#484e5c] text-neutral-700 dark:text-neutral-300'
                                        }`}
                                      >
                                        <input
                                          type="radio"
                                          name={`quizOpt_${q._id}`}
                                          value={opt}
                                          checked={isChosen}
                                          onChange={() => handleSelectQuizOption(q._id, opt)}
                                          className="w-4.5 h-4.5 text-neutral-900 border-neutral-300 focus:ring-neutral-900 mr-3.5 shrink-0"
                                        />
                                        <span className="font-mono font-bold text-neutral-400 mr-3 text-base md:text-lg">{String.fromCharCode(65 + oIdx)}.</span>
                                        <span className="flex-1 leading-snug">{opt}</span>
                                      </label>
                                    );
                                  })}
                                </div>

                                {/* Controls */}
                                <div className="flex items-center justify-between pt-6 border-t border-neutral-100 dark:border-[#222428]">
                                  <button
                                    onClick={handlePrevQuizQuestion}
                                    disabled={currentQuizIndex === 0}
                                    className="px-5 py-2.5 sm:px-6 sm:py-3 text-xs sm:text-sm md:text-base font-semibold rounded-xl border border-neutral-200 dark:border-[#2d313a] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-neutral-50 dark:hover:bg-[#1f2228] transition-colors"
                                  >
                                    &larr; Previous
                                  </button>

                                  {currentQuizIndex < quizAttempt.questions.length - 1 ? (
                                    <button
                                      onClick={handleNextQuizQuestion}
                                      className="px-6 py-2.5 sm:px-8 sm:py-3 text-xs sm:text-sm md:text-base font-bold bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 rounded-xl hover:opacity-90 transition-opacity shadow-xs"
                                    >
                                      Next Question &rarr;
                                    </button>
                                  ) : (
                                    <button
                                      onClick={handleSubmitQuiz}
                                      disabled={isSubmittingQuiz}
                                      className="px-7 py-2.5 sm:px-8 sm:py-3 text-xs sm:text-sm md:text-base font-bold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors shadow-sm flex items-center gap-2"
                                    >
                                      {isSubmittingQuiz ? (
                                        <>
                                          <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                          <span>Validating Answers...</span>
                                        </>
                                      ) : (
                                        <span>Submit Quiz for Grading</span>
                                      )}
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      ) : (
                        <div className="py-16 px-8 border border-neutral-200 dark:border-[#222428] rounded-2xl bg-neutral-50/50 dark:bg-[#14161a] text-center flex flex-col items-center justify-center">
                          <p className="text-sm md:text-base text-neutral-400 italic mb-4">No published quiz questions available for this chapter yet.</p>
                          <button
                            onClick={startQuizAttempt}
                            className="px-5 py-2.5 text-sm font-semibold bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 rounded-lg shadow-xs hover:opacity-90"
                          >
                            Check for Questions
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="w-full max-w-3xl mx-auto mt-12 bg-white dark:bg-[#14161a] border border-neutral-200 dark:border-[#222428] rounded-2xl p-8 sm:p-12 flex flex-col items-center justify-center text-center shadow-sm">
                <div className="w-14 h-14 rounded-full bg-neutral-100 dark:bg-[#1f2228] flex items-center justify-center mb-4 text-neutral-400">
                  <BookOpen className="w-7 h-7" />
                </div>
                <h3 className="text-lg md:text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
                  Resources are currently in preparation for this chapter
                </h3>
                <p className="text-sm md:text-base text-neutral-500 dark:text-neutral-400 max-w-md mb-6 leading-relaxed">
                  The study materials, lecture summaries, and past papers will be linked in the upcoming curriculum sync.
                </p>
                <button
                  onClick={() => setSelectedChapter(null)}
                  className="px-5 py-2.5 text-sm font-semibold bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-xl hover:opacity-90 transition-opacity shadow-xs"
                >
                  Return to Course Workspace
                </button>
              </div>
            )
          ) : selectedSubject ? (
            /* VIEW CONDITION 2: SUBJECT WORKSPACE ACTIVE */
            <div className="w-full max-w-[1560px] mx-auto py-4 space-y-8">
              {/* Top Navigation & Breadcrumb */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 dark:border-[#222428] pb-4">
                <button
                  onClick={() => setSelectedSubject(null)}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Semester {selectedSemester} Subjects
                </button>
                <div className="flex items-center gap-2.5 text-sm text-neutral-400 dark:text-neutral-500 font-medium">
                  <span>{selectedCourse?.split(':')[1]?.trim() || 'CSE'}</span>
                  <span>/</span>
                  <span>Sem {selectedSemester}</span>
                  <span>/</span>
                  <span className="text-neutral-800 dark:text-neutral-200 font-bold">{selectedSubject.subjectName}</span>
                </div>
              </div>

              {/* Subject Header Card */}
              <div className="bg-white dark:bg-[#14161a] border border-neutral-200 dark:border-[#222428] rounded-2xl p-6 sm:p-8 md:p-10 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-5 mb-6">
                  <div className="flex items-start gap-5">
                    <div className="w-14 h-14 rounded-xl bg-neutral-100 dark:bg-[#1f2228] border border-neutral-200 dark:border-[#2a2d34] flex items-center justify-center shrink-0 text-neutral-700 dark:text-neutral-300 shadow-2xs">
                      <SubjectIcon className="w-7 h-7" />
                    </div>
                    <div>
                      <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
                        {selectedSubject.subjectName}
                      </h1>
                      <div className="flex flex-wrap items-center gap-2.5 mt-3">
                        <span className="text-xs md:text-sm font-mono px-2.5 py-1 rounded-md bg-neutral-100 dark:bg-[#1f2228] text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-[#2a2d34] font-bold">
                          {selectedSubject.subjectCode || 'ACAD'}
                        </span>
                        <span className="text-xs md:text-sm text-neutral-600 dark:text-neutral-400 font-medium">
                          {selectedMeta.category || 'Computer Science Engineering'}
                        </span>
                        <span className="text-neutral-300 dark:text-neutral-700">•</span>
                        <span className="text-xs md:text-sm text-neutral-600 dark:text-neutral-400 font-medium">
                          {selectedMeta.type || 'Core Subject'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs md:text-sm font-semibold bg-neutral-100 dark:bg-[#1f2228] text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-[#2a2d34] self-start md:self-auto shadow-2xs">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span>Subject Layer Active</span>
                  </div>
                </div>

                {/* Course Overview */}
                <div className="mt-6 pt-6 border-t border-neutral-100 dark:border-[#1f2127]">
                  <h2 className="text-xs md:text-sm font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-3">
                    Course Overview & Scope
                  </h2>
                  <p className="text-base md:text-[17px] text-neutral-700 dark:text-neutral-300 leading-[1.65]">
                    {selectedMeta.overview || 'This course represents an integral module of the curriculum, focused on fundamental engineering paradigms, theoretical modeling, and applied technical proficiency.'}
                  </p>

                  {selectedMeta.pillars && (
                    <div className="mt-5">
                      <span className="text-xs md:text-sm font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider block mb-3">
                        Key Competencies & Focus Areas
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {selectedMeta.pillars.map((pillar, pIdx) => (
                          <span
                            key={pIdx}
                            className="text-xs md:text-sm font-medium px-3.5 py-1.5 rounded-lg bg-neutral-50 dark:bg-[#1a1c22] text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-[#282b33] shadow-2xs"
                          >
                            {pillar}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Progress Indicator: Curriculum Implementation Roadmap */}
              <div className="bg-white dark:bg-[#14161a] border border-neutral-200 dark:border-[#222428] rounded-2xl p-6 sm:p-8 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base md:text-lg font-bold text-neutral-900 dark:text-white">Curriculum Roadmap & Readiness</h3>
                    <p className="text-xs md:text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">Implementation status of syllabus units and learning resources</p>
                  </div>
                  <span className="text-xs md:text-sm font-mono font-semibold px-3 py-1 rounded-lg bg-neutral-100 dark:bg-[#1f2228] text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-[#2a2d34]">
                    {selectedUnits.length > 0 ? 'Stage 2/3: Active' : 'Stage 1: Active'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 my-4">
                  <div className="p-4 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-[#1f2228] shadow-2xs">
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <CheckCircle2 className="w-4 h-4 text-neutral-900 dark:text-neutral-100" />
                      <span className="text-sm font-bold text-neutral-900 dark:text-white">1. Subject Layer</span>
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">Curriculum node active</p>
                  </div>

                  <div className={`p-4 rounded-xl border shadow-2xs ${selectedUnits.length > 0 ? 'border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-[#1f2228]' : 'border-neutral-200 dark:border-[#222428] bg-white dark:bg-[#14161a]'}`}>
                    <div className="flex items-center gap-2.5 mb-1.5">
                      {selectedUnits.length > 0 ? <CheckCircle2 className="w-4 h-4 text-neutral-900 dark:text-neutral-100" /> : <Clock className="w-4 h-4 text-neutral-400" />}
                      <span className="text-sm font-bold text-neutral-900 dark:text-white">2. Units & Syllabus</span>
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      {selectedUnits.length > 0 ? `${selectedUnits.length} unit(s) linked` : 'In preparation'}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-neutral-200 dark:border-[#222428] bg-white dark:bg-[#14161a] shadow-2xs">
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <Clock className="w-4 h-4 text-neutral-400" />
                      <span className="text-sm font-bold text-neutral-700 dark:text-neutral-300">3. Notes & Chapters</span>
                    </div>
                    <p className="text-xs text-neutral-400 dark:text-neutral-500">Scheduled ingestion</p>
                  </div>

                  <div className="p-4 rounded-xl border border-neutral-200 dark:border-[#222428] bg-white dark:bg-[#14161a] shadow-2xs">
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <Clock className="w-4 h-4 text-neutral-400" />
                      <span className="text-sm font-bold text-neutral-700 dark:text-neutral-300">4. Tests & Papers</span>
                    </div>
                    <p className="text-xs text-neutral-400 dark:text-neutral-500">Past papers & quiz</p>
                  </div>
                </div>
              </div>

              {/* Units Section */}
              <div className="bg-white dark:bg-[#14161a] border border-neutral-200 dark:border-[#222428] rounded-2xl p-6 sm:p-8 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg md:text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2.5">
                      <BookOpen className="w-5 h-5 text-neutral-500" />
                      Syllabus Units & Modules
                    </h3>
                    <p className="text-xs md:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                      {selectedUnits.length > 0 ? `${selectedUnits.length} academic unit(s) available` : 'Curriculum units currently under syllabus compilation'}
                    </p>
                  </div>
                  <span className="text-xs md:text-sm text-neutral-500 dark:text-neutral-400 font-mono font-medium">
                    {selectedUnits.length > 0 ? `${selectedUnits.reduce((acc, u) => acc + (u.chapters?.length || 0), 0)} Chapters` : '0 Units Active'}
                  </span>
                </div>

                {selectedUnits.length > 0 ? (
                  /* If units exist */
                  <div className="space-y-6 mt-4">
                    {selectedUnits.map((unit) => (
                      <div key={unit._id} className="border-b border-neutral-200 dark:border-[#222428] pb-6 last:border-0">
                        <div className="mb-4">
                          <h4 className="text-xs md:text-sm font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                            Unit {unit.unitNumber}
                          </h4>
                          <h3 className="text-base md:text-lg font-bold text-neutral-900 dark:text-white mt-1">
                            {unit.unitName}
                          </h3>
                          {unit.contactHours && (
                            <p className="text-xs md:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                              {unit.contactHours} Contact Hours
                            </p>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {unit.chapters?.map((chap) => (
                            <div key={chap.chapterId} className="chapter-card group p-3.5 rounded-xl border border-neutral-200 dark:border-[#26282e] bg-white dark:bg-[#181a20] hover:bg-neutral-50 hover:border-neutral-400 dark:hover:bg-[#1d1f26] dark:hover:border-neutral-600 shadow-2xs">
                              <div className="flex items-start gap-3">
                                <div className="flex-1">
                                  <button
                                    onClick={() => setSelectedChapter(chap)}
                                    className="text-sm md:text-base font-semibold text-neutral-800 dark:text-neutral-200 hover:text-blue-700 dark:hover:text-blue-400 text-left flex items-center justify-between w-full"
                                  >
                                    <span>{chap.chapterName}</span>
                                    <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:translate-x-1 group-hover:text-blue-600 transition-transform duration-150" />
                                  </button>
                                  {chap.topics && chap.topics.length > 0 && (
                                    <div className="mt-2 space-y-1">
                                      {chap.topics.map((topic, tIdx) => (
                                        <div key={tIdx} className="text-xs text-neutral-500 dark:text-neutral-400 pl-2.5 border-l-2 border-neutral-200 dark:border-[#2a2d34]">
                                          {topic}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Clean Empty State Placeholder for Semester 5 */
                  <div>
                    <div className="p-5 mb-5 rounded-xl bg-neutral-50 dark:bg-[#1a1c22] border border-neutral-200 dark:border-[#282b33] flex items-start gap-3.5 shadow-2xs">
                      <Clock className="w-5 h-5 text-neutral-500 mt-0.5 shrink-0" />
                      <div className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                        <span className="font-bold text-neutral-900 dark:text-white block mb-0.5">Syllabus In Preparation</span>
                        Syllabus units and chapter mappings for <strong className="text-neutral-800 dark:text-neutral-200">{selectedSubject.subjectName}</strong> are currently being coordinated with academic faculty. Units will be populated in the next implementation stage.
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[
                        { num: 1, title: 'Foundations & Architecture', desc: 'Core theoretical fundamentals and architectural principles.' },
                        { num: 2, title: 'Intermediate Methodologies', desc: 'Design patterns, component lifecycles, and core algorithms.' },
                        { num: 3, title: 'Advanced Concepts', desc: 'Specialized paradigms, distributed operations, and optimizations.' },
                        { num: 4, title: 'Applied Systems & Tools', desc: 'Practical implementation frameworks and applied case problems.' },
                        { num: 5, title: 'Review & Examination Prep', desc: 'Comprehensive recap, synthesis, and past question analysis.' }
                      ].map((item) => (
                        <div
                          key={item.num}
                          className="p-4.5 rounded-xl border border-dashed border-neutral-200 dark:border-[#282b33] bg-neutral-50/40 dark:bg-[#17191e] flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-mono font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                                Unit 0{item.num}
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-100 dark:bg-[#20232a] text-neutral-500 font-semibold">
                                Planned
                              </span>
                            </div>
                            <h4 className="text-sm font-bold text-neutral-800 dark:text-neutral-200 mb-1">{item.title}</h4>
                            <p className="text-xs text-neutral-400 dark:text-neutral-500 leading-relaxed">{item.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Planned Study Materials Hub */}
              <div className="bg-white dark:bg-[#14161a] border border-neutral-200 dark:border-[#222428] rounded-2xl p-6 sm:p-8 shadow-sm">
                <div className="mb-6">
                  <h3 className="text-lg md:text-xl font-bold text-neutral-900 dark:text-white">
                    Planned Study Materials Hub
                  </h3>
                  <p className="text-xs md:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                    The four standard STUDS learning modalities that will activate once syllabus chapters are published.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { title: 'Full Lecture Notes', desc: 'Complete textbook-grade markdown notes with AI synthesis summaries.', icon: Book },
                    { title: 'Short Revision Points', desc: 'High-yield bullet points for rapid review before class or examinations.', icon: FileText },
                    { title: 'Past Exam Papers', desc: 'Previous university question papers with in-browser PDF reader.', icon: Library },
                    { title: 'Practice Quizzes', desc: 'Interactive self-testing quizzes with instant scoring and explanation review.', icon: HelpCircle }
                  ].map((mod, mIdx) => {
                    const IconComponent = mod.icon;
                    return (
                      <div
                        key={mIdx}
                        className="p-5 rounded-xl border border-neutral-200 dark:border-[#26282e] bg-neutral-50/50 dark:bg-[#17191e] flex flex-col justify-between shadow-2xs"
                      >
                        <div>
                          <div className="w-10 h-10 rounded-lg bg-neutral-100 dark:bg-[#20232a] flex items-center justify-center mb-3.5 text-neutral-700 dark:text-neutral-300">
                            <IconComponent className="w-5 h-5" />
                          </div>
                          <h4 className="text-sm md:text-base font-bold text-neutral-900 dark:text-white mb-1.5">{mod.title}</h4>
                          <p className="text-xs md:text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed mb-4">{mod.desc}</p>
                        </div>
                        <span className="text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider block">
                          Awaiting Chapter Ingestion
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* VIEW CONDITION 3: SEMESTER OVERVIEW HUB OR INITIAL GUIDE */
            selectedSemester && subjects.length > 0 ? (
              <div className="w-full max-w-[1560px] mx-auto py-6">
                <div className="mb-8">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs md:text-sm font-semibold bg-neutral-100 dark:bg-[#1a1c22] text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-[#26282e] mb-4 shadow-2xs">
                    <GraduationCap className="w-4 h-4 text-neutral-500" />
                    <span>{selectedCourse?.split(':')[1]?.trim() || 'Computer Science (CSE)'}</span>
                    <span>•</span>
                    <span>Semester {selectedSemester}</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white mb-2">
                    Semester {selectedSemester} Academic Curriculum
                  </h1>
                  <p className="text-sm md:text-base text-neutral-500 dark:text-neutral-400 max-w-2xl leading-relaxed">
                    Select any registered course below or from the sidebar to inspect its syllabus overview, modular roadmap, and academic materials.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {subjects.map((sub, idx) => {
                    const meta = COURSE_OVERVIEWS[sub.subjectName] || {};
                    const CardIcon = meta.icon || BookOpen;
                    return (
                      <div
                        key={sub._id}
                        onClick={() => handleSelectSubject(sub)}
                        tabIndex={0}
                        role="button"
                        onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && handleSelectSubject(sub)}
                        className="subject-card group cursor-pointer p-5 sm:p-6 bg-white dark:bg-[#14161a] border border-neutral-200 dark:border-[#222428] hover:border-neutral-400 dark:hover:border-neutral-500 rounded-2xl flex flex-col justify-between shadow-2xs"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-4">
                            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-neutral-100 dark:bg-[#1f2228] text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-[#26282e]">
                              {sub.subjectCode || `CS50${idx + 1}`}
                            </span>
                            <span className="text-xs text-neutral-600 dark:text-neutral-400 font-semibold">
                              {meta.credits || 'Core'}
                            </span>
                          </div>
                          
                          <div className="flex items-start gap-3 mb-3">
                            <div className="w-9 h-9 rounded-lg bg-neutral-100 dark:bg-[#1f2228] flex items-center justify-center shrink-0 text-neutral-700 dark:text-neutral-300 mt-0.5">
                              <CardIcon className="w-4.5 h-4.5" />
                            </div>
                            <h3 className="text-sm md:text-base font-bold text-neutral-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-400 leading-snug">
                              {sub.subjectName}
                            </h3>
                          </div>

                          <p className="text-xs md:text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2 leading-relaxed mb-4">
                            {meta.overview || 'Standard university syllabus module covering conceptual fundamentals and applied problem solving.'}
                          </p>
                        </div>

                        <div className="pt-3.5 border-t border-neutral-100 dark:border-[#1f2127] flex items-center justify-between text-xs md:text-sm font-semibold text-neutral-700 dark:text-neutral-300 group-hover:text-blue-700 dark:group-hover:text-blue-400">
                          <span>Open Workspace</span>
                          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-150" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center py-20">
                <div className="max-w-md w-full text-center border border-neutral-200 bg-white rounded-2xl p-8 sm:p-10 dark:bg-[#14161a] dark:border-[#222428] shadow-sm">
                  <div className="w-12 h-12 rounded-xl bg-neutral-100 dark:bg-[#1f2228] text-neutral-700 dark:text-neutral-300 flex items-center justify-center mx-auto mb-4">
                    <Book className="w-6 h-6" />
                  </div>
                  <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">Select a Semester to Begin</h2>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-8 max-w-xs mx-auto leading-relaxed">
                    Toggle through the semester buttons above to explore registered courses, syllabus roadmaps, and practice tests.
                  </p>

                  <div className="text-left border-t border-neutral-100 pt-5 dark:border-[#202227] space-y-3.5">
                    <span className="text-xs font-bold tracking-wider uppercase text-neutral-400 dark:text-neutral-500 block">Navigation Shortcuts</span>
                    
                    <div className="flex gap-3 items-start text-sm">
                      <Layers className="w-4 h-4 mt-0.5 text-neutral-400 shrink-0" />
                      <div>
                        <span className="font-semibold text-neutral-800 dark:text-neutral-300 block">Semester Selection</span>
                        <span className="text-xs text-neutral-500 dark:text-neutral-500">Click Sem 5 on the top navigation bar to load Semester 5 subjects.</span>
                      </div>
                    </div>

                    <div className="flex gap-3 items-start text-sm">
                      <Command className="w-4 h-4 mt-0.5 text-neutral-400 shrink-0" />
                      <div>
                        <span className="font-semibold text-neutral-800 dark:text-neutral-300 block">Command Palette</span>
                        <span className="text-xs text-neutral-400 dark:text-neutral-500">Press <kbd className="px-1.5 py-0.5 border rounded font-mono text-xs bg-neutral-50 dark:bg-[#1f2228] dark:border-[#2a2d34]">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 border rounded font-mono text-xs bg-neutral-50 dark:bg-[#1f2228] dark:border-[#2a2d34]">K</kbd> to search notes across all courses.</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          )}
        </section>
      </main>

      {/* Course Selection Modal */}
      {isCourseModalOpen && (
        <div className="fixed inset-0 z-[100] bg-neutral-950/40 dark:bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#14161a] border border-neutral-200 dark:border-[#222428] rounded-xl shadow-xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-6 border-b border-neutral-200 dark:border-[#222428] shrink-0 bg-neutral-50/50 dark:bg-[#17191e] flex justify-between items-center">
              <div>
                <h2 className="text-lg md:text-xl font-bold tracking-tight text-neutral-900 dark:text-white">Configure Your Academic Track</h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">Select your department and exact degree specialization.</p>
              </div>
              {selectedCourse && (
                <button 
                  onClick={() => setIsCourseModalOpen(false)}
                  className="hidden md:block px-3 py-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors"
                >
                  Close &times;
                </button>
              )}
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(DEPARTMENT_CATALOG).map(([dept, specs]) => (
                <div key={dept} className="flex flex-col">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-3 border-b border-neutral-100 dark:border-[#202227] pb-1.5">{dept}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {specs.map(spec => {
                      const courseString = `${dept}: ${spec}`;
                      const isActive = selectedCourse === courseString;
                      return (
                        <button
                          key={spec}
                          onClick={() => handleCourseSelect(dept, spec)}
                          className={`text-left px-3 py-2 text-xs rounded-md border flex items-center justify-between ${
                            isActive
                              ? 'border-neutral-900 bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 font-semibold shadow-2xs'
                              : 'border-neutral-200 dark:border-[#222428] bg-white dark:bg-[#181a1f] text-neutral-700 dark:text-neutral-400 hover:border-neutral-400 dark:hover:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-[#202329]'
                          }`}
                        >
                          <span className="truncate pr-2">{spec}</span>
                          {isActive && <ChevronRight className="w-3.5 h-3.5 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {selectedCourse && (
              <div className="md:hidden p-4 border-t border-neutral-200 dark:border-[#222428] bg-neutral-50 dark:bg-[#17191e] flex justify-center shrink-0">
                <button 
                  onClick={() => setIsCourseModalOpen(false)}
                  className="w-full py-2 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-md font-medium text-xs"
                >
                  Continue to Portal
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Portal />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
