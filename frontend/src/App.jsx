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
  Folder,
  Library
} from 'lucide-react';
import { fetchSubjectsBySemester, fetchUnitsBySubject, fetchContentByChapter } from './services/api';
import AdminDashboard from './components/AdminDashboard';
import CommandSearch from './components/CommandSearch';

const DEPARTMENT_CATALOG = {
  "Engineering (B.E./M.E.)": ["Aerospace", "Automobile", "Biotechnology", "Chemical", "Civil", "Electrical", "Mechatronics", "Food Technology", "Computer Science (CSE) - IBM", "Computer Science (CSE) - TCS"],
  "Management & Business (BBA/MBA)": ["General", "Marketing", "Finance", "HR", "Business Analytics", "Tourism & Hospitality"],
  "Computing (BCA/MCA)": ["Cloud Computing", "Agentic AI", "UI/UX Design", "Data Analytics", "Full Stack Development"],
  "Other Disciplines": ["Legal Studies", "Pharmacy", "Applied Health Sciences", "Media Studies", "Animation"]
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
    return localStorage.getItem('userCourse') || null;
  });
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(!localStorage.getItem('userCourse'));

  const [selectedSemester, setSelectedSemester] = useState(null);
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
    { id: 'full-notes', label: 'Full Notes' },
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
  const [activeQuizIndex, setActiveQuizIndex] = useState(null);
  const semesters = [1, 2, 3, 4, 5, 6, 7, 8];

  const handleCourseSelect = (dept, spec) => {
    const courseString = `${dept}: ${spec}`;
    setSelectedCourse(courseString);
    localStorage.setItem('userCourse', courseString);
    
    // Cascading state reset
    setSelectedSemester(null);
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
    if (item.subjectId) setSelectedSubject(item.subjectId);
    if (item.chapterId) {
      // Assuming chapter structure needs to be found to set properly
      setSelectedChapter(item);
    }
  };

  useEffect(() => {
    if (!selectedSemester || !selectedCourse) return;
    setIsLoadingSubjects(true);
    fetchSubjectsBySemester(selectedSemester, selectedCourse)
      .then(data => {
        setSubjects(Array.isArray(data) ? data : []);
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

  const handleSubjectExpand = (sub) => {
    const isExpanding = expandedSubject !== sub._id;
    if (isExpanding) {
      setExpandedSubject(sub._id);
      setSelectedSubject(sub);
      
      if (!subjectUnitsMap[sub._id]) {
        fetchUnitsBySubject(sub._id)
          .then(data => {
            setSubjectUnitsMap(prev => ({
              ...prev,
              [sub._id]: Array.isArray(data) ? data : []
            }));
          })
          .catch(err => console.error('Failed to fetch units:', err));
      }
    } else {
      setExpandedSubject("");
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

  return (
    <div className="h-screen w-full bg-white dark:bg-slate-950 flex flex-col font-sans text-slate-900 dark:text-slate-100 overflow-hidden transition-colors duration-200">
      <CommandSearch onNavigate={handleNavigate} />
      {/* HEADER NAVBAR */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 h-14 bg-white border-b border-slate-200 dark:bg-slate-900 dark:border-slate-800">
        <div className="flex items-center gap-6">
          <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2 pr-4 border-r border-slate-200 dark:border-slate-800">
            <Layers className="w-5 h-5 text-blue-600 dark:text-blue-500" />
            StuDS
          </span>

          <button 
            onClick={() => setIsCourseModalOpen(true)}
            className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors max-w-[200px] md:max-w-xs truncate"
          >
            <span className="truncate">{selectedCourse || "Select Course"}</span>
            <ChevronDown className="w-3.5 h-3.5 shrink-0 text-slate-400" />
          </button>
          
          {/* Semester Selector Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg dark:bg-slate-800">
            {semesters.map((sem) => (
              <button
                key={sem}
                onClick={() => {
                  setSelectedSemester(sem);
                  setSelectedChapter(null);
                }}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  selectedSemester === sem
                    ? 'bg-white text-slate-950 shadow-xs dark:bg-slate-700 dark:text-white'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                Sem {sem}
              </button>
            ))}
          </nav>
        </div>

        {/* Search Bar & Theme Action controls */}
        <div className="flex items-center gap-4 w-1/3 justify-end">
          <button 
            onClick={() => window.dispatchEvent(new Event('open-command-palette'))}
            className="relative w-full max-w-xs group hidden md:flex items-center text-left"
          >
            <Search className="absolute left-2.5 top-2 w-4 h-4 text-slate-400 group-focus-within:text-slate-600 dark:text-slate-500" />
            <div 
              className="w-full text-xs pl-9 pr-12 py-1.5 rounded-md border border-slate-200 bg-slate-50 focus:outline-hidden focus:border-slate-400 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:focus:border-slate-700 transition-all text-slate-400"
            >Quick search notes...</div>
            <div className="absolute right-2 top-1.5 flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-medium text-slate-400 bg-white border border-slate-200 rounded-sm dark:bg-slate-900 dark:border-slate-800 dark:text-slate-500">
              <Command className="w-2.5 h-2.5" />K
            </div>
          </button>

          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
            aria-label="Toggle Theme"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      <main className="flex flex-1 min-h-0">
        <aside className="w-72 bg-white border-r border-slate-200 dark:bg-slate-900 dark:border-slate-800 p-4 select-none shrink-0 overflow-y-auto">
          {/* Mobile Semester fallback */}
          <div className="md:hidden mb-4 pb-4 border-b border-slate-200 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Semester</span>
            <div className="flex flex-wrap gap-1">
              {semesters.map(sem => (
                <button
                  key={sem}
                  onClick={() => {
                    setSelectedSemester(sem);
                    setSelectedChapter(null);
                  }}
                  className={`w-8 h-8 flex items-center justify-center text-xs font-medium rounded-md transition-all ${
                    selectedSemester === sem ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' : 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {sem}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 mb-4 px-2 text-xs font-semibold text-slate-400 dark:text-slate-500 tracking-wider uppercase">
            <BookOpen className="w-3.5 h-3.5" />
            Subjects
          </div>

          {!selectedSemester ? (
            <p className="text-xs text-slate-400 px-2 italic">Select a semester above to load subjects.</p>
          ) : isLoadingSubjects && subjects.length === 0 ? (
            <p className="text-xs text-slate-400 px-2 animate-pulse">Loading subjects...</p>
          ) : subjects.length === 0 ? (
            <p className="text-xs text-slate-400 px-2 italic">No subjects registered for this branch yet.</p>
          ) : (
            <div className="space-y-1">
              {subjects.map((sub) => {
                const isSubExpanded = expandedSubject === sub._id;
                const subjectUnits = subjectUnitsMap[sub._id];
                return (
                  <div key={sub._id} className="space-y-1">
                    {/* Subject Row Accordion Toggle */}
                    <button
                      onClick={() => handleSubjectExpand(sub)}
                      className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-left transition-colors ${
                        isSubExpanded 
                          ? 'bg-slate-50 text-slate-900 font-medium dark:bg-slate-800/50 dark:text-white' 
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/30 dark:hover:text-slate-200'
                      }`}
                    >
                      <div className="flex flex-col min-w-0 pr-2">
                        <span className="text-[10px] font-mono tracking-tight text-slate-400 dark:text-slate-500">{sub.subjectCode}</span>
                        <span className="text-xs truncate">{sub.subjectName}</span>
                      </div>
                      {isSubExpanded ? <ChevronDown className="w-3.5 h-3.5 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 shrink-0" />}
                    </button>

                    {/* Render Subject Units if Expanded */}
                    {isSubExpanded && (
                      <div className="pl-3 border-l border-slate-100 dark:border-slate-800 ml-3 space-y-1 py-1">
                        {!subjectUnits ? (
                          <span className="text-[10px] text-slate-400 animate-pulse px-2">Loading units...</span>
                        ) : subjectUnits.length === 0 ? (
                          <span className="text-[10px] text-slate-400 italic px-2">No units found.</span>
                        ) : (
                          subjectUnits.map((unit) => {
                            const isUnitExpanded = expandedUnit === unit._id;
                            return (
                              <div key={unit._id} className="space-y-0.5">
                                <button
                                  onClick={() => setExpandedUnit(isUnitExpanded ? null : unit._id)}
                                  className="w-full flex items-center justify-between py-1 px-2 rounded-sm text-[11px] text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800 text-left"
                                >
                                  <span className="truncate font-medium">Unit {unit.unitNumber}: {unit.unitName}</span>
                                  {isUnitExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                </button>

                                {/* Render Chapters if Expanded */}
                                {isUnitExpanded && (
                                  <div className="pl-2 space-y-0.5 py-0.5">
                                    {unit.chapters.map((chap) => (
                                      <button
                                        key={chap.chapterId}
                                        onClick={() => setSelectedChapter(chap)}
                                        className={`w-full text-left text-[11px] py-1 px-2.5 rounded-xs truncate transition-all ${
                                          selectedChapter?.chapterId === chap.chapterId
                                            ? 'bg-blue-50 text-blue-600 font-medium dark:bg-blue-950/40 dark:text-blue-400'
                                            : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
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

        <section className="flex-1 overflow-y-auto p-10 relative bg-white dark:bg-slate-950">
          {contentLoading && (
            <div className="absolute top-10 right-10 text-xs font-medium text-slate-400 dark:text-slate-500 animate-pulse">
              Loading content...
            </div>
          )}
          
          {!selectedChapter ? (
            /* PRECISE POLISHED EMPTY STATE COMPONENT */
            <div className="h-full flex items-center justify-center py-20">
              <div className="max-w-md w-full text-center border border-slate-200 bg-white rounded-xl p-8 dark:bg-slate-900 dark:border-slate-800 shadow-xs">
                <div className="w-12 h-12 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-4">
                  <Book className="w-6 h-6" />
                </div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-1">Welcome to Your Study Hub</h2>
                <p className="text-xs text-slate-400 dark:text-slate-500 mb-6 max-w-xs mx-auto">
                  Access comprehensive documentation, shorthand revision pointers, question modules, and practice testing instances.
                </p>

                <div className="text-left border-t border-slate-100 pt-5 dark:border-slate-800 space-y-3.5">
                  <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400 dark:text-slate-500 block">Quick Workspace Guides</span>
                  
                  <div className="flex gap-3 items-start text-xs">
                    <Layers className="w-4 h-4 mt-0.5 text-slate-400 shrink-0" />
                    <div>
                      <span className="font-medium text-slate-700 dark:text-slate-300 block">Isolate via Semesters</span>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500">Toggle semester buttons at the top layout bar to isolate distinct curriculum sets instantly.</span>
                    </div>
                  </div>

                  <div className="flex gap-3 items-start text-xs">
                    <Command className="w-4 h-4 mt-0.5 text-slate-400 shrink-0" />
                    <div>
                      <span className="font-medium text-slate-700 dark:text-slate-300 block">Command Index Palette</span>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500">Initialize a workspace search using <kbd className="px-1 border rounded-xs font-mono text-[10px] bg-slate-50 dark:bg-slate-950 dark:border-slate-800">Ctrl</kbd> + <kbd className="px-1 border rounded-xs font-mono text-[10px] bg-slate-50 dark:bg-slate-950 dark:border-slate-800">K</kbd> to jump straight to core files.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : content ? (
            <div className="max-w-4xl mx-auto flex flex-col min-h-full bg-white border border-slate-200 rounded-lg p-6 dark:bg-slate-900 dark:border-slate-800 mt-4 mb-4">
              <header className="border-b border-slate-200 dark:border-slate-800 pb-4 mb-6 shrink-0">
                <h1 className="text-xl font-bold tracking-tight mb-2 text-slate-900 dark:text-white">{selectedChapter.chapterName}</h1>
                <p className="text-xs text-slate-400 dark:text-slate-500 mb-6">{selectedSubject?.subjectName} • Chapter Reference</p>
                <div className="flex gap-6 overflow-x-auto">
                  {tabs.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`pb-3 text-sm font-medium transition-colors whitespace-nowrap border-b-2 ${
                        activeTab === tab.id
                          ? 'border-slate-900 dark:border-slate-100 text-slate-900 dark:text-slate-100'
                          : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </header>

              <div className="flex-1 pb-12">
                {activeTab === 'full-notes' && (
                  <div className="flex flex-col gap-6">
                    {content.aiSummary && (
                      <div className="bg-slate-50/50 border border-slate-200 dark:bg-slate-800/30 dark:border-slate-700/50 rounded-lg p-5">
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
                          ✨ StuDS AI Chapter Synthesis
                        </h3>
                        <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed prose prose-slate dark:prose-invert prose-sm max-w-none">
                          <ReactMarkdown>{content.aiSummary}</ReactMarkdown>
                        </div>
                      </div>
                    )}
                    <div className="prose prose-slate dark:prose-invert prose-sm max-w-none">
                      <ReactMarkdown>{content.fullNotesMarkdown || '*No full notes available.*'}</ReactMarkdown>
                    </div>
                  </div>
                )}
                
                {activeTab === 'shortNotes' && (
                  <div className="text-sm text-slate-800 dark:text-slate-200">
                    {content.shortNotes?.length > 0 ? (
                      <ul className="list-disc pl-5 space-y-1.5 marker:text-slate-400 dark:marker:text-slate-600">
                        {content.shortNotes.map((note, idx) => (
                          <li key={idx} className="text-sm leading-snug text-slate-700 dark:text-slate-300">{note}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-slate-500 italic">No short notes available.</p>
                    )}
                  </div>
                )}
                
                {activeTab === 'pyqs' && (
                  <div className="text-sm text-slate-800 h-full flex flex-col">
                    {sortedPyqs.length > 0 ? (
                      selectedPyq ? (
                        <div className="flex flex-col h-[70vh]">
                          <button 
                            onClick={() => setSelectedPyq(null)}
                            className="text-sm text-slate-600 hover:text-slate-900 font-medium mb-4 self-start border border-slate-200 px-3 py-1.5 rounded bg-slate-50"
                          >
                            &larr; Back to List
                          </button>
                          <iframe 
                            src={selectedPyq} 
                            className="w-full flex-1 border-0 rounded bg-slate-100" 
                            title="PYQ Viewer"
                          />
                        </div>
                      ) : (
                        <div className="flex flex-col gap-3">
                          {sortedPyqs.map((pyq, idx) => (
                            <button 
                              key={idx} 
                              onClick={() => setSelectedPyq(pyq.fileUrl)}
                              className="flex items-center justify-between p-4 border border-slate-200 rounded-md hover:border-slate-300 hover:bg-slate-50 transition-colors text-left"
                            >
                              <span className="font-medium text-slate-900">{pyq.year} Past Paper</span>
                              <span className="text-blue-600 font-medium">Open Viewer &rarr;</span>
                            </button>
                          ))}
                        </div>
                      )
                    ) : (
                      <p className="text-slate-500 italic">No past papers available.</p>
                    )}
                  </div>
                )}
                
                {activeTab === 'quiz' && (
                  <div className="text-sm text-slate-800 max-w-2xl">
                    {content.quizData?.length > 0 ? (
                      isSubmitted ? (
                        <div className="border border-slate-200 rounded-md p-6 bg-slate-50">
                          <h3 className="text-lg font-semibold text-slate-900 mb-4">Quiz Results</h3>
                          <p className="font-medium text-slate-700 mb-6">You scored <span className="text-slate-900 font-bold">{quizScore}</span> out of {content.quizData.length}</p>
                          
                          <div className="space-y-6 mb-8">
                            {content.quizData.map((quiz, idx) => {
                              const isCorrect = userAnswersArray[idx] === quiz.correctAnswer;
                              return (
                                <div key={idx} className="pb-4 border-b border-slate-200 last:border-0 last:pb-0">
                                  <p className="font-medium text-slate-900 mb-2">{idx + 1}. {quiz.question}</p>
                                  <p className={`mb-1 ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                                    Your Answer: {userAnswersArray[idx]}
                                  </p>
                                  {!isCorrect && (
                                    <p className="text-slate-600 font-medium">
                                      Correct Answer: {quiz.correctAnswer}
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          <button 
                            onClick={retryQuiz}
                            className="bg-slate-900 text-white px-4 py-2 rounded-md font-medium hover:bg-slate-800 transition-colors"
                          >
                            Retry Quiz
                          </button>
                        </div>
                      ) : (
                        <div className="border border-slate-200 rounded-md p-6">
                          <div className="flex items-center justify-between mb-6">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Question {currentQuestionIndex + 1} of {content.quizData.length}</span>
                          </div>
                          <p className="font-semibold text-slate-900 text-base mb-6">
                            {content.quizData[currentQuestionIndex].question}
                          </p>
                          <div className="flex flex-col gap-3 mb-8">
                            {content.quizData[currentQuestionIndex].options.map((opt, oIdx) => (
                              <label 
                                key={oIdx} 
                                className={`flex items-center p-3 border rounded cursor-pointer transition-colors ${
                                  selectedAnswer === opt 
                                    ? 'border-slate-900 bg-slate-50' 
                                    : 'border-slate-200 hover:bg-slate-50'
                                }`}
                              >
                                <input 
                                  type="radio" 
                                  name="quizOption" 
                                  value={opt}
                                  checked={selectedAnswer === opt}
                                  onChange={(e) => setSelectedAnswer(e.target.value)}
                                  className="w-4 h-4 text-slate-900 border-slate-300 focus:ring-slate-900 mr-3"
                                />
                                <span className="text-slate-700">{opt}</span>
                              </label>
                            ))}
                          </div>
                          
                          <button
                            onClick={handleQuizNext}
                            disabled={!selectedAnswer}
                            className="bg-slate-900 text-white px-5 py-2 rounded-md font-medium hover:bg-slate-800 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
                          >
                            {currentQuestionIndex < content.quizData.length - 1 ? 'Next Question' : 'Submit Quiz'}
                          </button>
                        </div>
                      )
                    ) : (
                      <p className="text-slate-500 italic">No practice quiz available.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto mt-12 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-lg p-10 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center mb-5">
                <BookOpen className="w-6 h-6 text-slate-500 dark:text-slate-400" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-2">Resources are currently being organized for this section. Check back soon!</h3>
            </div>
          )}
        </section>
      </main>

      {/* Course Selection Modal */}
      {isCourseModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/50 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-6 md:p-8 border-b border-slate-200 dark:border-slate-800 shrink-0 bg-slate-50 dark:bg-slate-950 flex justify-between items-center">
              <div>
                <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Configure Your Workspace</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Select your academic department and exact stream to initialize your study environment.</p>
              </div>
              {selectedCourse && (
                <button 
                  onClick={() => setIsCourseModalOpen(false)}
                  className="hidden md:block px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  Close &times;
                </button>
              )}
            </div>
            
            <div className="p-6 md:p-8 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-8">
              {Object.entries(DEPARTMENT_CATALOG).map(([dept, specs]) => (
                <div key={dept} className="flex flex-col">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">{dept}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {specs.map(spec => {
                      const courseString = `${dept}: ${spec}`;
                      const isActive = selectedCourse === courseString;
                      return (
                        <button
                          key={spec}
                          onClick={() => handleCourseSelect(dept, spec)}
                          className={`text-left px-3 py-2.5 text-xs rounded-md border transition-colors flex items-center justify-between ${
                            isActive
                              ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:border-blue-500 dark:text-blue-400 font-semibold shadow-xs'
                              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'
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
              <div className="md:hidden p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-center shrink-0">
                <button 
                  onClick={() => setIsCourseModalOpen(false)}
                  className="w-full py-2.5 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 rounded-md font-medium text-sm"
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
