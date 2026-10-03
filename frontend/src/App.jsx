import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
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
  Compass
} from 'lucide-react';
import { fetchSubjectsBySemester, fetchUnitsBySubject, fetchContentByChapter } from './services/api';
import AdminDashboard from './components/AdminDashboard';
import CommandSearch from './components/CommandSearch';

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

function Portal() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

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
    return localStorage.getItem('userCourse') || "Engineering (B.E./M.E.): Computer Science (CSE)";
  });
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(!localStorage.getItem('userCourse'));

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
    { id: 'shortNotes', label: 'Short Notes' },
    { id: 'pyqs', label: 'Past Papers' },
    { id: 'quiz', label: 'Practice Quiz' }
  ];
  
  const [activeTab, setActiveTab] = useState('full-notes');

  // Tab C States
  const [selectedPyq, setSelectedPyq] = useState(null);

  // Tab D States
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [userAnswersArray, setUserAnswersArray] = useState([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
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
    if (!selectedSemester || !selectedCourse) return;
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
  }, [selectedSemester, selectedCourse]);

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

  // Reset tab-specific states when switching tabs or chapters
  useEffect(() => {
    setSelectedPyq(null);
    setCurrentQuestionIndex(0);
    setSelectedAnswer('');
    setUserAnswersArray([]);
    setIsSubmitted(false);
  }, [activeTab, selectedChapter]);

  const handleQuizNext = () => {
    if (!content?.quizData) return;
    const newAnswers = [...userAnswersArray, selectedAnswer];
    if (currentQuestionIndex < content.quizData.length - 1) {
      setUserAnswersArray(newAnswers);
      setSelectedAnswer('');
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setUserAnswersArray(newAnswers);
      setIsSubmitted(true);
    }
  };

  const retryQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer('');
    setUserAnswersArray([]);
    setIsSubmitted(false);
  };

  const sortedPyqs = content?.pyqLinks ? [...content.pyqLinks].sort((a, b) => b.year - a.year) : [];
  
  let quizScore = 0;
  if (isSubmitted && content?.quizData) {
    content.quizData.forEach((q, idx) => {
      if (userAnswersArray[idx] === q.correctAnswer) quizScore++;
    });
  }

  const selectedUnits = selectedSubject ? (subjectUnitsMap[selectedSubject._id] || []) : [];
  const selectedMeta = selectedSubject ? (COURSE_OVERVIEWS[selectedSubject.subjectName] || {}) : {};
  const SubjectIcon = selectedMeta.icon || BookOpen;

  return (
    <div className="h-screen w-full bg-[#fafafa] dark:bg-[#0f1013] flex flex-col font-sans text-neutral-900 dark:text-neutral-100 overflow-hidden transition-colors duration-150">
      <CommandSearch onNavigate={handleNavigate} />

      {/* HEADER NAVBAR */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-6 h-14 bg-white dark:bg-[#14161a] border-b border-neutral-200 dark:border-[#222428]">
        <div className="flex items-center gap-5">
          <span className="text-base font-bold tracking-tight text-neutral-900 dark:text-white flex items-center gap-2 pr-4 border-r border-neutral-200 dark:border-[#222428]">
            <Layers className="w-4 h-4 text-neutral-800 dark:text-neutral-200" />
            STUDS
          </span>

          {/* Department / Stream Picker Button */}
          <button 
            onClick={() => setIsCourseModalOpen(true)}
            className="flex items-center gap-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-50 dark:bg-[#1a1c22] border border-neutral-200 dark:border-[#2a2d34] px-3 py-1.5 rounded-md hover:bg-neutral-100 dark:hover:bg-[#22252c] transition-colors max-w-[220px] md:max-w-xs truncate"
          >
            <span className="truncate">{selectedCourse || "Select Course"}</span>
            <ChevronDown className="w-3.5 h-3.5 shrink-0 text-neutral-400" />
          </button>
          
          {/* Semester Selector Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-neutral-100 dark:bg-[#1a1c22] p-0.5 rounded-lg border border-neutral-200 dark:border-[#26282e]">
            {semesters.map((sem) => (
              <button
                key={sem}
                onClick={() => {
                  setSelectedSemester(sem);
                  setSelectedSubject(null);
                  setSelectedChapter(null);
                }}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  selectedSemester === sem
                    ? 'bg-white text-neutral-950 shadow-2xs font-semibold dark:bg-[#22252c] dark:text-white'
                    : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200'
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
            className="relative w-full max-w-xs group hidden md:flex items-center text-left"
          >
            <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500" />
            <div 
              className="w-full text-xs pl-8 pr-12 py-1.5 rounded-md border border-neutral-200 bg-neutral-50 text-neutral-400 dark:border-[#26282e] dark:bg-[#16181d] dark:text-neutral-500 transition-colors"
            >
              Search notes, past papers...
            </div>
            <div className="absolute right-2 top-1.5 flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-medium text-neutral-400 bg-white border border-neutral-200 rounded-xs dark:bg-[#202329] dark:border-[#2c2f37] dark:text-neutral-400">
              <Command className="w-2.5 h-2.5" />K
            </div>
          </button>

          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 rounded-md hover:bg-neutral-100 dark:hover:bg-[#202329] text-neutral-500 dark:text-neutral-400 transition-colors"
            aria-label="Toggle Theme"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      <main className="flex flex-1 min-h-0">
        {/* SIDEBAR NAVIGATION */}
        <aside className="w-72 bg-white dark:bg-[#14161a] border-r border-neutral-200 dark:border-[#222428] p-4 select-none shrink-0 overflow-y-auto">
          {/* Mobile Semester fallback */}
          <div className="md:hidden mb-4 pb-4 border-b border-neutral-200 dark:border-[#222428]">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2 block">Semester</span>
            <div className="flex flex-wrap gap-1">
              {semesters.map(sem => (
                <button
                  key={sem}
                  onClick={() => {
                    setSelectedSemester(sem);
                    setSelectedSubject(null);
                    setSelectedChapter(null);
                  }}
                  className={`w-8 h-8 flex items-center justify-center text-xs font-medium rounded-md transition-all ${
                    selectedSemester === sem 
                      ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900' 
                      : 'bg-neutral-50 text-neutral-600 dark:bg-[#1a1c22] dark:text-neutral-400 border border-neutral-200 dark:border-[#282b33]'
                  }`}
                >
                  {sem}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between mb-3 px-2">
            <div className="flex items-center gap-2 text-[11px] font-bold text-neutral-400 dark:text-neutral-500 tracking-wider uppercase">
              <BookOpen className="w-3.5 h-3.5" />
              Subjects
            </div>
            {selectedSemester && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-[#1f2228] text-neutral-500 dark:text-neutral-400">
                Sem {selectedSemester}
              </span>
            )}
          </div>

          {!selectedSemester ? (
            <p className="text-xs text-neutral-400 px-2 italic">Select a semester above to load subjects.</p>
          ) : isLoadingSubjects && subjects.length === 0 ? (
            <p className="text-xs text-neutral-400 px-2 animate-pulse">Loading semester subjects...</p>
          ) : subjects.length === 0 ? (
            <p className="text-xs text-neutral-400 px-2 italic">No subjects registered for this branch yet.</p>
          ) : (
            <div className="space-y-1">
              {subjects.map((sub) => {
                const isSelected = selectedSubject?._id === sub._id;
                const isSubExpanded = expandedSubject === sub._id;
                const subjectUnits = subjectUnitsMap[sub._id] || [];

                return (
                  <div key={sub._id} className="space-y-1">
                    <button
                      onClick={() => handleSelectSubject(sub)}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-md text-left transition-all ${
                        isSelected
                          ? 'bg-neutral-100 text-neutral-950 font-medium dark:bg-[#1f2228] dark:text-white border border-neutral-200 dark:border-[#2a2d34]'
                          : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-[#1a1c22]/50 dark:hover:text-neutral-200'
                      }`}
                    >
                      <div className="flex flex-col min-w-0 pr-2">
                        <span className="text-xs truncate font-medium">{sub.subjectName}</span>
                        {sub.subjectCode && (
                          <span className="text-[10px] font-mono tracking-tight text-neutral-400 dark:text-neutral-500">{sub.subjectCode}</span>
                        )}
                      </div>
                      {subjectUnits && subjectUnits.length > 0 ? (
                        isSubExpanded ? <ChevronDown className="w-3.5 h-3.5 shrink-0 text-neutral-400" /> : <ChevronRight className="w-3.5 h-3.5 shrink-0 text-neutral-400" />
                      ) : (
                        <ChevronRight className="w-3 h-3 shrink-0 text-neutral-300 dark:text-neutral-600 opacity-60" />
                      )}
                    </button>

                    {/* Render Subject Units if Expanded and Available */}
                    {isSubExpanded && (
                      <div className="pl-3 border-l border-neutral-200 dark:border-[#222428] ml-3 space-y-1 py-1">
                        {subjectUnits.length === 0 ? (
                          <span className="text-[10px] text-neutral-400 italic px-2 block">Syllabus in preparation</span>
                        ) : (
                          subjectUnits.map((unit) => {
                            const isUnitExpanded = expandedUnit === unit._id;
                            return (
                              <div key={unit._id} className="space-y-0.5">
                                <button
                                  onClick={() => setExpandedUnit(isUnitExpanded ? null : unit._id)}
                                  className="w-full flex items-center justify-between py-1 px-2 rounded-sm text-[11px] text-neutral-500 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:bg-[#1f2228] text-left"
                                >
                                  <span className="truncate font-medium">Unit {unit.unitNumber}: {unit.unitName}</span>
                                  {isUnitExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                </button>

                                {/* Render Chapters if Unit is Expanded */}
                                {isUnitExpanded && (
                                  <div className="pl-2 space-y-0.5 py-0.5">
                                    {unit.chapters.map((chap) => (
                                      <button
                                        key={chap.chapterId}
                                        onClick={() => setSelectedChapter(chap)}
                                        className={`w-full text-left text-[11px] py-1 px-2.5 rounded-xs truncate transition-all ${
                                          selectedChapter?.chapterId === chap.chapterId
                                            ? 'bg-neutral-200 text-neutral-900 font-semibold dark:bg-[#282b33] dark:text-white'
                                            : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200'
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
        <section className="flex-1 overflow-y-auto p-6 md:p-8 relative bg-[#fafafa] dark:bg-[#0f1013]">
          {contentLoading && (
            <div className="absolute top-8 right-8 text-xs font-medium text-neutral-400 dark:text-neutral-500 animate-pulse">
              Loading study resources...
            </div>
          )}

          {/* VIEW CONDITION 1: CHAPTER CONTENT ACTIVE */}
          {selectedChapter ? (
            content ? (
              <div className="max-w-4xl mx-auto flex flex-col min-h-full bg-white border border-neutral-200 rounded-xl p-6 md:p-8 dark:bg-[#14161a] dark:border-[#222428] shadow-2xs">
                {/* Back to Subject Workspace Breadcrumb */}
                <div className="mb-4 pb-3 border-b border-neutral-100 dark:border-[#202227] flex items-center justify-between">
                  <button
                    onClick={() => setSelectedChapter(null)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back to {selectedSubject?.subjectName || 'Subject'} Workspace
                  </button>
                  <span className="text-[11px] text-neutral-400 dark:text-neutral-500 font-mono">
                    {selectedSubject?.subjectCode || ''}
                  </span>
                </div>

                <header className="border-b border-neutral-200 dark:border-[#222428] pb-4 mb-6 shrink-0">
                  <h1 className="text-xl font-bold tracking-tight mb-1.5 text-neutral-900 dark:text-white">{selectedChapter.chapterName}</h1>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-5">{selectedSubject?.subjectName} • Chapter Reference</p>
                  
                  <div className="flex gap-6 overflow-x-auto">
                    {tabs.map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`pb-2.5 text-xs font-semibold tracking-wide transition-colors whitespace-nowrap border-b-2 ${
                          activeTab === tab.id
                            ? 'border-neutral-900 dark:border-white text-neutral-900 dark:text-white'
                            : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </header>

                <div className="flex-1 pb-8">
                  {/* TAB 1: FULL NOTES */}
                  {activeTab === 'full-notes' && (
                    <div className="flex flex-col gap-6">
                      {content.aiSummary && (
                        <div className="bg-neutral-50 border border-neutral-200 dark:bg-[#1a1c22] dark:border-[#2a2d34] rounded-lg p-5">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-2 flex items-center gap-2">
                            Academic Synthesis Summary
                          </h3>
                          <div className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed prose prose-neutral dark:prose-invert prose-sm max-w-none">
                            <ReactMarkdown>{content.aiSummary}</ReactMarkdown>
                          </div>
                        </div>
                      )}
                      {content.notes && content.notes.length > 0 ? (
                        <div className="flex flex-col gap-12">
                          {content.notes.map(note => (
                            <div key={note._id} className="prose prose-slate dark:prose-invert max-w-[75ch] mx-auto text-base leading-loose border-b border-neutral-100 dark:border-[#222428] pb-12 last:border-0">
                              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-8">{note.title}</h2>
                              <ReactMarkdown>{note.content}</ReactMarkdown>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="prose prose-neutral dark:prose-invert prose-sm max-w-none leading-relaxed">
                          {content.fullNotesMarkdown ? (
                            <ReactMarkdown>{content.fullNotesMarkdown}</ReactMarkdown>
                          ) : (
                            <p className="text-neutral-500 italic">Study material isn't available yet.</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 2: SHORT NOTES */}
                  {activeTab === 'shortNotes' && (
                    <div className="text-sm text-neutral-800 dark:text-neutral-200">
                      {content.shortNotes?.length > 0 ? (
                        <ul className="list-disc pl-5 space-y-2 marker:text-neutral-400 dark:marker:text-neutral-600">
                          {content.shortNotes.map((note, idx) => (
                            <li key={idx} className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">{note}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-neutral-400 italic">No short revision notes available.</p>
                      )}
                    </div>
                  )}

                  {/* TAB 3: PAST PAPERS */}
                  {activeTab === 'pyqs' && (
                    <div className="text-sm text-neutral-800 dark:text-neutral-200 h-full flex flex-col">
                      {sortedPyqs.length > 0 ? (
                        selectedPyq ? (
                          <div className="flex flex-col h-[70vh]">
                            <button 
                              onClick={() => setSelectedPyq(null)}
                              className="text-xs text-neutral-600 hover:text-neutral-900 font-medium mb-4 self-start border border-neutral-200 px-3 py-1.5 rounded-md bg-neutral-50 dark:bg-[#1a1c22] dark:border-[#2a2d34] dark:text-neutral-300"
                            >
                              &larr; Back to Question Papers List
                            </button>
                            <iframe 
                              src={selectedPyq} 
                              className="w-full flex-1 border border-neutral-200 dark:border-[#2a2d34] rounded-lg bg-neutral-100 dark:bg-[#16181d]" 
                              title="PYQ Viewer"
                            />
                          </div>
                        ) : (
                          <div className="flex flex-col gap-3">
                            {sortedPyqs.map((pyq, idx) => (
                              <button 
                                key={idx} 
                                onClick={() => setSelectedPyq(pyq.fileUrl)}
                                className="flex items-center justify-between p-4 border border-neutral-200 dark:border-[#26282e] rounded-lg hover:border-neutral-400 dark:hover:border-neutral-600 bg-white dark:bg-[#16181d] transition-colors text-left"
                              >
                                <span className="font-medium text-neutral-900 dark:text-white">{pyq.year} Examination Paper</span>
                                <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Open Viewer &rarr;</span>
                              </button>
                            ))}
                          </div>
                        )
                      ) : (
                        <p className="text-neutral-400 italic">No past papers available for this chapter.</p>
                      )}
                    </div>
                  )}

                  {/* TAB 4: PRACTICE QUIZ */}
                  {activeTab === 'quiz' && (
                    <div className="text-sm text-neutral-800 dark:text-neutral-200 max-w-2xl">
                      {content.quizData?.length > 0 ? (
                        isSubmitted ? (
                          <div className="border border-neutral-200 dark:border-[#26282e] rounded-lg p-6 bg-neutral-50 dark:bg-[#16181d]">
                            <h3 className="text-base font-bold text-neutral-900 dark:text-white mb-2">Quiz Results</h3>
                            <p className="font-medium text-neutral-600 dark:text-neutral-400 mb-6">
                              You scored <span className="text-neutral-900 dark:text-white font-bold">{quizScore}</span> out of {content.quizData.length}
                            </p>
                            
                            <div className="space-y-4 mb-6">
                              {content.quizData.map((quiz, idx) => {
                                const isCorrect = userAnswersArray[idx] === quiz.correctAnswer;
                                return (
                                  <div key={idx} className="pb-3 border-b border-neutral-200 dark:border-[#222428] last:border-0 last:pb-0">
                                    <p className="font-medium text-neutral-900 dark:text-white mb-1.5">{idx + 1}. {quiz.question}</p>
                                    <p className={`text-xs ${isCorrect ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                      Your Answer: {userAnswersArray[idx] || '(Not answered)'}
                                    </p>
                                    {!isCorrect && (
                                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                                        Correct Answer: {quiz.correctAnswer}
                                      </p>
                                    )}
                                  </div>
                                );
                              })}
                            </div>

                            <button 
                              onClick={retryQuiz}
                              className="bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 px-4 py-2 rounded-md font-medium text-xs hover:opacity-90 transition-opacity"
                            >
                              Retry Quiz
                            </button>
                          </div>
                        ) : (
                          <div className="border border-neutral-200 dark:border-[#26282e] rounded-lg p-6 bg-white dark:bg-[#16181d]">
                            <div className="flex items-center justify-between mb-4">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                                Question {currentQuestionIndex + 1} of {content.quizData.length}
                              </span>
                            </div>
                            <p className="font-semibold text-neutral-900 dark:text-white text-base mb-6">
                              {content.quizData[currentQuestionIndex].question}
                            </p>
                            <div className="flex flex-col gap-2.5 mb-6">
                              {content.quizData[currentQuestionIndex].options.map((opt, oIdx) => (
                                <label 
                                  key={oIdx} 
                                  className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors text-xs ${
                                    selectedAnswer === opt 
                                      ? 'border-neutral-900 bg-neutral-100 text-neutral-950 font-medium dark:border-white dark:bg-[#20232a] dark:text-white' 
                                      : 'border-neutral-200 hover:bg-neutral-50 dark:border-[#282b33] dark:hover:bg-[#1a1c22] text-neutral-700 dark:text-neutral-300'
                                  }`}
                                >
                                  <input 
                                    type="radio" 
                                    name="quizOption" 
                                    value={opt}
                                    checked={selectedAnswer === opt}
                                    onChange={(e) => setSelectedAnswer(e.target.value)}
                                    className="w-3.5 h-3.5 text-neutral-900 border-neutral-300 focus:ring-neutral-900 mr-3"
                                  />
                                  <span>{opt}</span>
                                </label>
                              ))}
                            </div>
                            
                            <button
                              onClick={handleQuizNext}
                              disabled={!selectedAnswer}
                              className="bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 px-5 py-2 rounded-md font-medium text-xs hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              {currentQuestionIndex < content.quizData.length - 1 ? 'Next Question' : 'Submit Quiz'}
                            </button>
                          </div>
                        )
                      ) : (
                        <p className="text-neutral-400 italic">No practice quiz available for this chapter.</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="max-w-2xl mx-auto mt-12 bg-white dark:bg-[#14161a] border border-neutral-200 dark:border-[#222428] rounded-xl p-8 flex flex-col items-center justify-center text-center shadow-2xs">
                <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-[#1f2228] flex items-center justify-center mb-4">
                  <BookOpen className="w-5 h-5 text-neutral-400" />
                </div>
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
                  Resources are currently in preparation for this chapter
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mb-5">
                  The study materials, lecture summaries, and past papers will be linked in the upcoming curriculum sync.
                </p>
                <button
                  onClick={() => setSelectedChapter(null)}
                  className="px-4 py-2 text-xs font-medium bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-md hover:opacity-90 transition-opacity"
                >
                  Return to Course Workspace
                </button>
              </div>
            )
          ) : selectedSubject ? (
            /* VIEW CONDITION 2: SUBJECT WORKSPACE ACTIVE */
            <div className="max-w-4xl mx-auto py-2 space-y-6">
              {/* Top Navigation & Breadcrumb */}
              <div className="flex items-center justify-between gap-4 border-b border-neutral-200 dark:border-[#222428] pb-4">
                <button
                  onClick={() => setSelectedSubject(null)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to Semester {selectedSemester} Subjects
                </button>
                <div className="flex items-center gap-2 text-xs text-neutral-400 dark:text-neutral-500">
                  <span>{selectedCourse?.split(':')[1]?.trim() || 'CSE'}</span>
                  <span>/</span>
                  <span>Sem {selectedSemester}</span>
                  <span>/</span>
                  <span className="text-neutral-700 dark:text-neutral-300 font-medium">{selectedSubject.subjectName}</span>
                </div>
              </div>

              {/* Subject Header Card */}
              <div className="bg-white dark:bg-[#14161a] border border-neutral-200 dark:border-[#222428] rounded-xl p-6 md:p-8 shadow-2xs">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-lg bg-neutral-100 dark:bg-[#1f2228] border border-neutral-200 dark:border-[#2a2d34] flex items-center justify-center shrink-0 text-neutral-700 dark:text-neutral-300">
                      <SubjectIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h1 className="text-xl md:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
                        {selectedSubject.subjectName}
                      </h1>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-neutral-100 dark:bg-[#1f2228] text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-[#2a2d34]">
                          {selectedSubject.subjectCode || 'ACAD'}
                        </span>
                        <span className="text-xs text-neutral-500 dark:text-neutral-400">
                          {selectedMeta.category || 'Computer Science Engineering'}
                        </span>
                        <span className="text-neutral-300 dark:text-neutral-700">•</span>
                        <span className="text-xs text-neutral-500 dark:text-neutral-400">
                          {selectedMeta.type || 'Core Subject'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-neutral-100 dark:bg-[#1f2228] text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-[#2a2d34] self-start md:self-auto">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>Subject Layer Active</span>
                  </div>
                </div>

                {/* Course Overview */}
                <div className="mt-5 pt-5 border-t border-neutral-100 dark:border-[#1f2127]">
                  <h2 className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-2">
                    Course Overview & Scope
                  </h2>
                  <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
                    {selectedMeta.overview || 'This course represents an integral module of the curriculum, focused on fundamental engineering paradigms, theoretical modeling, and applied technical proficiency.'}
                  </p>

                  {selectedMeta.pillars && (
                    <div className="mt-4">
                      <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider block mb-2">
                        Key Competencies & Focus Areas
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedMeta.pillars.map((pillar, pIdx) => (
                          <span
                            key={pIdx}
                            className="text-xs px-2.5 py-1 rounded-md bg-neutral-50 dark:bg-[#1a1c22] text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-[#282b33]"
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
              <div className="bg-white dark:bg-[#14161a] border border-neutral-200 dark:border-[#222428] rounded-xl p-6 shadow-2xs">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">Curriculum Roadmap & Readiness</h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">Implementation status of syllabus units and learning resources</p>
                  </div>
                  <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-neutral-100 dark:bg-[#1f2228] text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-[#2a2d34]">
                    {selectedUnits.length > 0 ? 'Stage 2/3: Active' : 'Stage 1: Active'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 my-4">
                  <div className="p-3 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-[#1f2228]">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-neutral-900 dark:text-neutral-100" />
                      <span className="text-xs font-semibold text-neutral-900 dark:text-white">1. Subject Layer</span>
                    </div>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400">Curriculum node active</p>
                  </div>

                  <div className={`p-3 rounded-lg border ${selectedUnits.length > 0 ? 'border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-[#1f2228]' : 'border-neutral-200 dark:border-[#222428] bg-white dark:bg-[#14161a]'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      {selectedUnits.length > 0 ? <CheckCircle2 className="w-3.5 h-3.5 text-neutral-900 dark:text-neutral-100" /> : <Clock className="w-3.5 h-3.5 text-neutral-400" />}
                      <span className="text-xs font-semibold text-neutral-900 dark:text-white">2. Units & Syllabus</span>
                    </div>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      {selectedUnits.length > 0 ? `${selectedUnits.length} unit(s) linked` : 'In preparation'}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg border border-neutral-200 dark:border-[#222428] bg-white dark:bg-[#14161a]">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-3.5 h-3.5 text-neutral-400" />
                      <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">3. Notes & Chapters</span>
                    </div>
                    <p className="text-[11px] text-neutral-400 dark:text-neutral-500">Scheduled ingestion</p>
                  </div>

                  <div className="p-3 rounded-lg border border-neutral-200 dark:border-[#222428] bg-white dark:bg-[#14161a]">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-3.5 h-3.5 text-neutral-400" />
                      <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">4. Tests & Papers</span>
                    </div>
                    <p className="text-[11px] text-neutral-400 dark:text-neutral-500">Past papers & quiz</p>
                  </div>
                </div>
              </div>

              {/* Units Section Placeholder */}
              <div className="bg-white dark:bg-[#14161a] border border-neutral-200 dark:border-[#222428] rounded-xl p-6 shadow-2xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-neutral-500" />
                      Syllabus Units & Modules
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                      {selectedUnits.length > 0 ? `${selectedUnits.length} academic unit(s) available` : 'Curriculum units currently under syllabus compilation'}
                    </p>
                  </div>
                  <span className="text-xs text-neutral-400 dark:text-neutral-500 font-mono">
                    {selectedUnits.length > 0 ? `${selectedUnits.reduce((acc, u) => acc + (u.chapters?.length || 0), 0)} Chapters` : '0 Units Active'}
                  </span>
                </div>

                {selectedUnits.length > 0 ? (
                  /* If units exist */
                  <div className="space-y-4 mt-4">
                    {selectedUnits.map((unit) => (
                      <div key={unit._id} className="border-b border-neutral-200 dark:border-[#222428] pb-4 last:border-0">
                        <div className="mb-3">
                          <h4 className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                            Unit {unit.unitNumber}
                          </h4>
                          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mt-1">
                            {unit.unitName}
                          </h3>
                          {unit.contactHours && (
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                              {unit.contactHours} Contact Hours
                            </p>
                          )}
                        </div>
                        
                        <div className="pl-0 space-y-2">
                          {unit.chapters?.map((chap) => (
                            <div key={chap.chapterId} className="group">
                              <div className="flex items-start gap-3">
                                <div className="flex-1">
                                  <button
                                    onClick={() => setSelectedChapter(chap)}
                                    className="text-xs font-medium text-neutral-800 dark:text-neutral-200 hover:text-neutral-900 dark:hover:text-white text-left flex items-center justify-between w-full p-2 rounded-md hover:bg-neutral-50 dark:hover:bg-[#1a1c22] transition-colors"
                                  >
                                    <span>{chap.chapterName}</span>
                                    <ChevronRight className="w-3.5 h-3.5 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </button>
                                  {chap.topics && chap.topics.length > 0 && (
                                    <div className="pl-4 mt-1 space-y-1">
                                      {chap.topics.map((topic, tIdx) => (
                                        <div key={tIdx} className="text-[11px] text-neutral-500 dark:text-neutral-400 pl-2 border-l border-neutral-200 dark:border-[#2a2d34]">
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
                    <div className="p-4 mb-4 rounded-lg bg-neutral-50 dark:bg-[#1a1c22] border border-neutral-200 dark:border-[#282b33] flex items-start gap-3">
                      <Clock className="w-4 h-4 text-neutral-500 mt-0.5 shrink-0" />
                      <div className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                        <span className="font-semibold text-neutral-900 dark:text-white block mb-0.5">Syllabus In Preparation</span>
                        Syllabus units and chapter mappings for <strong className="text-neutral-800 dark:text-neutral-200">{selectedSubject.subjectName}</strong> are currently being coordinated with academic faculty. Units will be populated in the next implementation stage.
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {[
                        { num: 1, title: 'Foundations & Architecture', desc: 'Core theoretical fundamentals and architectural principles.' },
                        { num: 2, title: 'Intermediate Methodologies', desc: 'Design patterns, component lifecycles, and core algorithms.' },
                        { num: 3, title: 'Advanced Concepts', desc: 'Specialized paradigms, distributed operations, and optimizations.' },
                        { num: 4, title: 'Applied Systems & Tools', desc: 'Practical implementation frameworks and applied case problems.' },
                        { num: 5, title: 'Review & Examination Prep', desc: 'Comprehensive recap, synthesis, and past question analysis.' }
                      ].map((item) => (
                        <div
                          key={item.num}
                          className="p-3.5 rounded-lg border border-dashed border-neutral-200 dark:border-[#282b33] bg-neutral-50/40 dark:bg-[#17191e] flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[10px] font-mono font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                                Unit 0{item.num}
                              </span>
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-[#20232a] text-neutral-500 font-medium">
                                Planned
                              </span>
                            </div>
                            <h4 className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-1">{item.title}</h4>
                            <p className="text-[11px] text-neutral-400 dark:text-neutral-500 leading-snug">{item.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Planned Study Materials Hub Ready for Next Stage */}
              <div className="bg-white dark:bg-[#14161a] border border-neutral-200 dark:border-[#222428] rounded-xl p-6 shadow-2xs">
                <div className="mb-4">
                  <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
                    Planned Study Materials Hub
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    The four standard STUDS learning modalities that will activate once syllabus chapters are published.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
                        className="p-4 rounded-lg border border-neutral-200 dark:border-[#26282e] bg-neutral-50/50 dark:bg-[#17191e] flex flex-col justify-between"
                      >
                        <div>
                          <div className="w-8 h-8 rounded-md bg-neutral-100 dark:bg-[#20232a] flex items-center justify-center mb-3 text-neutral-700 dark:text-neutral-300">
                            <IconComponent className="w-4 h-4" />
                          </div>
                          <h4 className="text-xs font-semibold text-neutral-900 dark:text-white mb-1">{mod.title}</h4>
                          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-snug mb-3">{mod.desc}</p>
                        </div>
                        <span className="text-[10px] font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-wider block">
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
              <div className="max-w-4xl mx-auto py-4">
                <div className="mb-6">
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-xs font-medium bg-neutral-100 dark:bg-[#1a1c22] text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-[#26282e] mb-3">
                    <GraduationCap className="w-3.5 h-3.5 text-neutral-500" />
                    <span>{selectedCourse?.split(':')[1]?.trim() || 'Computer Science (CSE)'}</span>
                    <span>•</span>
                    <span>Semester {selectedSemester}</span>
                  </div>
                  <h1 className="text-xl md:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white mb-1.5">
                    Semester {selectedSemester} Academic Curriculum
                  </h1>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-xl leading-relaxed">
                    Select any registered course below or from the sidebar to inspect its syllabus overview, modular roadmap, and academic materials.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {subjects.map((sub, idx) => {
                    const meta = COURSE_OVERVIEWS[sub.subjectName] || {};
                    const CardIcon = meta.icon || BookOpen;
                    return (
                      <div
                        key={sub._id}
                        onClick={() => handleSelectSubject(sub)}
                        className="group cursor-pointer p-4 bg-white dark:bg-[#14161a] border border-neutral-200 dark:border-[#222428] hover:border-neutral-400 dark:hover:border-neutral-500 rounded-xl transition-all flex flex-col justify-between shadow-2xs hover:shadow-xs"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-100 dark:bg-[#1f2228] text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-[#26282e]">
                              {sub.subjectCode || `CS50${idx + 1}`}
                            </span>
                            <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-medium">
                              {meta.credits || 'Core'}
                            </span>
                          </div>
                          
                          <div className="flex items-start gap-2.5 mb-2">
                            <div className="w-7 h-7 rounded-md bg-neutral-100 dark:bg-[#1f2228] flex items-center justify-center shrink-0 text-neutral-700 dark:text-neutral-300 mt-0.5">
                              <CardIcon className="w-3.5 h-3.5" />
                            </div>
                            <h3 className="text-xs font-semibold text-neutral-900 dark:text-white group-hover:text-neutral-700 dark:group-hover:text-neutral-200 transition-colors leading-snug">
                              {sub.subjectName}
                            </h3>
                          </div>

                          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed mb-3">
                            {meta.overview || 'Standard university syllabus module covering conceptual fundamentals and applied problem solving.'}
                          </p>
                        </div>

                        <div className="pt-2.5 border-t border-neutral-100 dark:border-[#1f2127] flex items-center justify-between text-[11px] font-medium text-neutral-700 dark:text-neutral-300">
                          <span>Open Workspace</span>
                          <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center py-16">
                <div className="max-w-md w-full text-center border border-neutral-200 bg-white rounded-xl p-8 dark:bg-[#14161a] dark:border-[#222428] shadow-2xs">
                  <div className="w-10 h-10 rounded-lg bg-neutral-100 dark:bg-[#1f2228] text-neutral-700 dark:text-neutral-300 flex items-center justify-center mx-auto mb-3">
                    <Book className="w-5 h-5" />
                  </div>
                  <h2 className="text-base font-semibold text-neutral-900 dark:text-white mb-1">Select a Semester to Begin</h2>
                  <p className="text-xs text-neutral-400 dark:text-neutral-500 mb-6 max-w-xs mx-auto">
                    Toggle through the semester buttons above to explore registered courses, syllabus roadmaps, and practice tests.
                  </p>

                  <div className="text-left border-t border-neutral-100 pt-4 dark:border-[#202227] space-y-3">
                    <span className="text-[10px] font-bold tracking-wider uppercase text-neutral-400 dark:text-neutral-500 block">Navigation Shortcuts</span>
                    
                    <div className="flex gap-2.5 items-start text-xs">
                      <Layers className="w-3.5 h-3.5 mt-0.5 text-neutral-400 shrink-0" />
                      <div>
                        <span className="font-medium text-neutral-700 dark:text-neutral-300 block">Semester Selection</span>
                        <span className="text-[11px] text-neutral-400 dark:text-neutral-500">Click Sem 5 on the top navigation bar to load Semester 5 subjects.</span>
                      </div>
                    </div>

                    <div className="flex gap-2.5 items-start text-xs">
                      <Command className="w-3.5 h-3.5 mt-0.5 text-neutral-400 shrink-0" />
                      <div>
                        <span className="font-medium text-neutral-700 dark:text-neutral-300 block">Command Palette</span>
                        <span className="text-[11px] text-neutral-400 dark:text-neutral-500">Press <kbd className="px-1 border rounded-xs font-mono text-[10px] bg-neutral-50 dark:bg-[#1f2228] dark:border-[#2a2d34]">Ctrl</kbd> + <kbd className="px-1 border rounded-xs font-mono text-[10px] bg-neutral-50 dark:bg-[#1f2228] dark:border-[#2a2d34]">K</kbd> to search notes across all courses.</span>
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
                          className={`text-left px-3 py-2 text-xs rounded-md border transition-colors flex items-center justify-between ${
                            isActive
                              ? 'border-neutral-900 bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 font-semibold shadow-2xs'
                              : 'border-neutral-200 dark:border-[#222428] bg-white dark:bg-[#181a1f] text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-[#202329]'
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
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}
