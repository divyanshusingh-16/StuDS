import { useState, useEffect } from 'react';
import { fetchSubjectsBySemester, fetchUnitsBySubject, upsertContent, uploadPdfFile, loginAdmin, generateAiSummary } from '../services/api';

const COURSE_CATALOG = {
  'Engineering': [
    'B.E. - Aerospace', 'B.E. - Automobile', 'B.E. - Biotechnology', 'B.E. - Chemical',
    'B.E. - Civil', 'B.E. - Electrical', 'B.E. - Mechatronics', 'B.E. - Food Technology',
    'B.E. - CSE (IBM Specialization)', 'B.E. - CSE (TCS Specialization)',
  ],
  'Management & Business': [
    'BBA - General', 'BBA - Marketing', 'BBA - Finance', 'BBA - HR',
    'MBA - Business Analytics', 'MBA - Tourism & Hospitality',
  ],
  'Computing': [
    'BCA - Cloud Computing', 'BCA - Agentic AI', 'BCA - UI/UX Design',
    'BCA - Data Analytics', 'BCA - Full Stack Development', 'MCA',
  ],
  'Other Disciplines': [
    'Legal Studies (BA/BBA LLB)', 'Pharmacy', 'Applied Health Sciences',
    'Media Studies', 'Animation',
  ],
};

const DEPARTMENTS = Object.keys(COURSE_CATALOG);

const SELECT_CLS = 'w-full px-3 py-2 text-sm border border-slate-300 rounded bg-white focus:outline-none focus:border-slate-500 disabled:bg-slate-100 disabled:cursor-not-allowed';
const LABEL_CLS = 'block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2';

export default function AdminDashboard() {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() =>
    sessionStorage.getItem('adminAuth') === 'true'
  );
  const [loginPasscode, setLoginPasscode] = useState('');
  const [loginError, setLoginError] = useState('');

  const [adminSecret, setAdminSecret] = useState('');

  // --- Cascade State ---
  const [department, setDepartment] = useState('');
  const [course, setCourse] = useState('');
  const [semester, setSemester] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [subjectId, setSubjectId] = useState('');
  const [units, setUnits] = useState([]);
  const [unitId, setUnitId] = useState('');
  const [chapterId, setChapterId] = useState('');

  // --- Content States ---
  const [fullNotesMarkdown, setFullNotesMarkdown] = useState('');
  const [shortNotes, setShortNotes] = useState([]);
  const [newShortNote, setNewShortNote] = useState('');
  const [pyqLinks, setPyqLinks] = useState([]);
  const [newPyqYear, setNewPyqYear] = useState('');
  const [newPyqUrl, setNewPyqUrl] = useState('');
  const [isUploadingPyq, setIsUploadingPyq] = useState(false);
  const [pyqUploadError, setPyqUploadError] = useState('');
  const [quizData, setQuizData] = useState([]);
  const [newQuiz, setNewQuiz] = useState({ question: '', options: ['', '', '', ''], correctAnswer: '' });

  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [aiSummary, setAiSummary] = useState('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [aiSummaryError, setAiSummaryError] = useState('');

  // --- Cascade Reset Handlers ---
  const handleDepartmentChange = (val) => {
    setDepartment(val);
    setCourse('');
    setSemester('');
    setSubjects([]);
    setSubjectId('');
    setUnits([]);
    setUnitId('');
    setChapterId('');
  };

  const handleCourseChange = (val) => {
    setCourse(val);
    setSemester('');
    setSubjects([]);
    setSubjectId('');
    setUnits([]);
    setUnitId('');
    setChapterId('');
  };

  const handleSemesterChange = (val) => {
    setSemester(val);
    setSubjects([]);
    setSubjectId('');
    setUnits([]);
    setUnitId('');
    setChapterId('');
  };

  const handleSubjectChange = (val) => {
    setSubjectId(val);
    setUnits([]);
    setUnitId('');
    setChapterId('');
  };

  const handleUnitChange = (val) => {
    setUnitId(val);
    setChapterId('');
  };

  // --- Data Fetching Effects ---
  useEffect(() => {
    if (!semester || !course) { setSubjects([]); setSubjectId(''); return; }
    fetchSubjectsBySemester(semester).then(setSubjects).catch(console.error);
  }, [semester, course]);

  useEffect(() => {
    if (!subjectId) { setUnits([]); setUnitId(''); return; }
    fetchUnitsBySubject(subjectId).then(setUnits).catch(console.error);
  }, [subjectId]);

  const activeUnit = units.find(u => u._id === unitId);
  const chapters = activeUnit?.chapters || [];
  const courseOptions = COURSE_CATALOG[department] || [];

  // --- Content Handlers ---
  const handleAddShortNote = () => {
    if (!newShortNote.trim()) return;
    setShortNotes([...shortNotes, newShortNote.trim()]);
    setNewShortNote('');
  };

  const handleRemoveShortNote = (index) => setShortNotes(shortNotes.filter((_, i) => i !== index));

  const handleAddPyq = () => {
    if (!newPyqYear || !newPyqUrl.trim()) return;
    setPyqLinks([...pyqLinks, { year: parseInt(newPyqYear, 10), fileUrl: newPyqUrl.trim() }]);
    setNewPyqYear('');
    setNewPyqUrl('');
  };

  const handleRemovePyq = (index) => setPyqLinks(pyqLinks.filter((_, i) => i !== index));

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') { setPyqUploadError('Only PDF files are allowed.'); return; }
    if (!adminSecret) { setPyqUploadError('Admin Secret is required before uploading files.'); return; }
    setPyqUploadError('');
    setIsUploadingPyq(true);
    try {
      const response = await uploadPdfFile(file, adminSecret);
      setNewPyqUrl(response.fileUrl);
    } catch (err) {
      setPyqUploadError(err.message);
    } finally {
      setIsUploadingPyq(false);
      e.target.value = null;
    }
  };

  const handleQuizOptionChange = (idx, value) => {
    const newOptions = [...newQuiz.options];
    newOptions[idx] = value;
    setNewQuiz({ ...newQuiz, options: newOptions });
  };

  const handleAddQuiz = () => {
    if (!newQuiz.question.trim() || newQuiz.options.some(o => !o.trim()) || !newQuiz.correctAnswer.trim()) {
      alert('Please fill all quiz fields and select a correct answer.');
      return;
    }
    if (!newQuiz.options.includes(newQuiz.correctAnswer)) {
      alert('Correct answer must match one of the options exactly.');
      return;
    }
    setQuizData([...quizData, { ...newQuiz }]);
    setNewQuiz({ question: '', options: ['', '', '', ''], correctAnswer: '' });
  };

  const handleRemoveQuiz = (index) => setQuizData(quizData.filter((_, i) => i !== index));

  const handleGenerateSummary = async () => {
    if (!fullNotesMarkdown.trim() || isGeneratingSummary) return;
    setAiSummaryError('');
    setAiSummary('');
    setIsGeneratingSummary(true);
    try {
      const summary = await generateAiSummary(fullNotesMarkdown, adminSecret);
      setAiSummary(summary);
    } catch (err) {
      setAiSummaryError(err.message);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleSubmit = async () => {
    setFeedback(null);
    setValidationErrors({});

    if (!adminSecret) { setValidationErrors({ auth: 'Admin Secret is required.' }); return; }
    if (!department || !course) { setValidationErrors({ course: 'Department and Course are required.' }); return; }
    if (!chapterId) { setValidationErrors({ chapter: 'Please select a valid chapter.' }); return; }
    if (!fullNotesMarkdown.trim()) { setValidationErrors({ notes: 'Full Notes Markdown cannot be empty.' }); return; }

    setLoading(true);
    try {
      await upsertContent({
        chapterId,
        fullNotesMarkdown,
        shortNotes,
        pyqLinks,
        quizData,
        ...(aiSummary.trim() ? { aiSummary } : {}),
      }, adminSecret);

      setFeedback({ type: 'success', text: 'Content successfully upserted!' });
      setFullNotesMarkdown('');
      setShortNotes([]);
      setPyqLinks([]);
      setQuizData([]);
      setAiSummary('');
      setAiSummaryError('');
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      await loginAdmin(loginPasscode);
      sessionStorage.setItem('adminAuth', 'true');
      setAdminSecret(loginPasscode);
      setIsAdminAuthenticated(true);
    } catch (err) {
      setLoginError(err.message);
    }
  };

  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <form onSubmit={handleLogin} className="bg-white p-8 border border-slate-200 rounded-lg shadow-sm w-96 flex flex-col gap-4">
          <div className="flex flex-col gap-1 items-center mb-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Admin Portal</h1>
            <p className="text-sm text-slate-500">Restricted Access</p>
          </div>
          <input
            type="password"
            placeholder="Enter Passcode"
            value={loginPasscode}
            onChange={e => setLoginPasscode(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded focus:outline-none focus:border-slate-900 text-sm"
          />
          {loginError && <p className="text-xs text-red-600 text-center font-medium">{loginError}</p>}
          <button type="submit" className="w-full py-2 bg-slate-900 text-white font-medium rounded text-sm hover:bg-slate-800 transition-colors">Authorize Session</button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-8">
      <div className="max-w-6xl mx-auto bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">

        <header className="px-6 py-4 border-b border-slate-200 bg-slate-900 text-white flex justify-between items-center">
          <h1 className="font-semibold tracking-tight text-lg">Admin Operations Workspace</h1>
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Auth</span>
            <input
              type="password"
              placeholder="Admin Secret"
              value={adminSecret}
              onChange={e => setAdminSecret(e.target.value)}
              className={`px-3 py-1.5 text-sm rounded bg-slate-800 border ${validationErrors.auth ? 'border-red-500' : 'border-slate-700'} text-white focus:outline-none focus:border-slate-500 w-48`}
            />
          </div>
        </header>

        <div className="flex flex-col md:flex-row h-[calc(100vh-8rem)]">

          {/* Left Sidebar: 6-Level Cascade */}
          <aside className="w-full md:w-80 border-r border-slate-200 bg-slate-50 p-6 flex flex-col gap-5 overflow-y-auto shrink-0">

            {/* Level 1: Department */}
            <div>
              <label className={LABEL_CLS}>1. Department</label>
              <select
                value={department}
                onChange={e => handleDepartmentChange(e.target.value)}
                className={SELECT_CLS}
              >
                <option value="">-- Select Department --</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              {validationErrors.course && <p className="text-xs text-red-600 mt-1">{validationErrors.course}</p>}
            </div>

            {/* Level 2: Course & Specialization */}
            <div>
              <label className={LABEL_CLS}>2. Course & Specialization</label>
              <select
                value={course}
                onChange={e => handleCourseChange(e.target.value)}
                disabled={!department}
                className={SELECT_CLS}
              >
                <option value="">-- Select Course --</option>
                {courseOptions.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Level 3: Semester */}
            <div>
              <label className={LABEL_CLS}>3. Semester</label>
              <select
                value={semester}
                onChange={e => handleSemesterChange(e.target.value)}
                disabled={!course}
                className={SELECT_CLS}
              >
                <option value="">-- Select Semester --</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Semester {s}</option>)}
              </select>
            </div>

            {/* Level 4: Subject */}
            <div>
              <label className={LABEL_CLS}>4. Subject</label>
              <select
                value={subjectId}
                onChange={e => handleSubjectChange(e.target.value)}
                disabled={!semester}
                className={SELECT_CLS}
              >
                <option value="">-- Select Subject --</option>
                {subjects.map(sub => (
                  <option key={sub._id} value={sub._id}>{sub.subjectCode} - {sub.subjectName}</option>
                ))}
              </select>
            </div>

            {/* Level 5: Unit */}
            <div>
              <label className={LABEL_CLS}>5. Unit</label>
              <select
                value={unitId}
                onChange={e => handleUnitChange(e.target.value)}
                disabled={!subjectId}
                className={SELECT_CLS}
              >
                <option value="">-- Select Unit --</option>
                {units.map(u => <option key={u._id} value={u._id}>Unit {u.unitNumber}: {u.unitName}</option>)}
              </select>
            </div>

            {/* Level 6: Chapter */}
            <div>
              <label className={LABEL_CLS}>6. Chapter</label>
              <select
                value={chapterId}
                onChange={e => setChapterId(e.target.value)}
                disabled={!unitId}
                className={`${SELECT_CLS} ${validationErrors.chapter ? 'border-red-500' : ''}`}
              >
                <option value="">-- Select Chapter --</option>
                {chapters.map(c => <option key={c.chapterId} value={c.chapterId}>{c.chapterName}</option>)}
              </select>
              {validationErrors.chapter && <p className="text-xs text-red-600 mt-1">{validationErrors.chapter}</p>}
            </div>

            {/* Context Summary */}
            {course && (
              <div className="mt-auto pt-4 border-t border-slate-200">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Active Context</p>
                <p className="text-xs text-slate-600 font-medium truncate">{department}</p>
                <p className="text-xs text-slate-500 truncate">{course}</p>
                {semester && <p className="text-xs text-slate-400">Semester {semester}</p>}
              </div>
            )}
          </aside>

          {/* Right Workspace */}
          <section className="flex-1 p-8 overflow-y-auto relative">
            {!chapterId ? (
              <div className="h-full flex flex-col items-center justify-center gap-2">
                <span className="text-slate-400 text-sm font-medium">Select a chapter from the hierarchy to begin data entry.</span>
                {!department && <span className="text-xs text-slate-300">Start by selecting a Department from the left panel.</span>}
              </div>
            ) : (
              <div className="max-w-3xl mx-auto flex flex-col gap-10 pb-12">

                {/* Module A */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <h2 className="text-sm font-bold text-slate-900">Module A: Full Notes</h2>
                    <button
                      onClick={handleGenerateSummary}
                      disabled={!fullNotesMarkdown.trim() || isGeneratingSummary || loading}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-md bg-white text-slate-600 hover:border-slate-400 hover:text-slate-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {isGeneratingSummary ? (
                        <>
                          <span className="w-3 h-3 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin inline-block" />
                          Synthesizing content...
                        </>
                      ) : <>✨ Generate AI Summary</>}
                    </button>
                  </div>
                  <textarea
                    rows={10}
                    placeholder="Enter raw Markdown string here..."
                    value={fullNotesMarkdown}
                    onChange={e => setFullNotesMarkdown(e.target.value)}
                    disabled={loading}
                    className={`w-full px-4 py-3 text-sm border rounded bg-white focus:outline-none focus:border-slate-900 font-mono ${validationErrors.notes ? 'border-red-500' : 'border-slate-300'} disabled:bg-slate-50 disabled:text-slate-500`}
                  />
                  {validationErrors.notes && <p className="text-xs text-red-600">{validationErrors.notes}</p>}
                  {aiSummaryError && (
                    <p className="text-xs text-red-600 font-medium border border-red-100 bg-red-50 rounded px-3 py-2">{aiSummaryError}</p>
                  )}
                  {aiSummary && (
                    <div className="mt-1 border border-slate-200 rounded-md bg-slate-50 overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 bg-white">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">AI Summary Preview</span>
                        <button
                          onClick={() => { setAiSummary(''); setAiSummaryError(''); }}
                          className="text-xs text-slate-400 hover:text-slate-700 transition-colors"
                        >
                          Discard
                        </button>
                      </div>
                      <pre className="px-4 py-3 text-xs text-slate-700 whitespace-pre-wrap font-mono leading-relaxed">{aiSummary}</pre>
                    </div>
                  )}
                </div>

                {/* Module B */}
                <div className="flex flex-col gap-2">
                  <h2 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2">Module B: Short Notes</h2>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add a revision point..."
                      value={newShortNote}
                      onChange={e => setNewShortNote(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddShortNote()}
                      disabled={loading}
                      className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded bg-white focus:outline-none focus:border-slate-500 disabled:bg-slate-50 disabled:text-slate-500"
                    />
                    <button onClick={handleAddShortNote} disabled={loading} className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded hover:bg-slate-800 transition-colors disabled:bg-slate-400">Add Point</button>
                  </div>
                  {shortNotes.length > 0 && (
                    <ul className="mt-3 flex flex-col gap-2">
                      {shortNotes.map((note, idx) => (
                        <li key={idx} className="flex justify-between items-center p-3 border border-slate-200 rounded bg-slate-50 text-sm">
                          <span>{note}</span>
                          <button onClick={() => handleRemoveShortNote(idx)} disabled={loading} className="text-xs font-bold text-red-600 hover:underline disabled:text-red-300">Remove</button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Module C */}
                <div className="flex flex-col gap-2">
                  <h2 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2">Module C: PYQs</h2>
                  <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
                    <input
                      type="number"
                      placeholder="Year (e.g. 2023)"
                      value={newPyqYear}
                      onChange={e => setNewPyqYear(e.target.value)}
                      disabled={loading}
                      className="w-32 px-3 py-2 text-sm border border-slate-300 rounded bg-white focus:outline-none focus:border-slate-500 shrink-0 disabled:bg-slate-50 disabled:text-slate-500"
                    />
                    <input
                      type="text"
                      placeholder="PDF Document URL"
                      value={newPyqUrl}
                      onChange={e => setNewPyqUrl(e.target.value)}
                      disabled={loading}
                      className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded bg-white focus:outline-none focus:border-slate-500 disabled:bg-slate-50 disabled:text-slate-500"
                    />
                    <button
                      onClick={handleAddPyq}
                      disabled={loading || !newPyqUrl.trim() || !newPyqYear}
                      className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded hover:bg-slate-800 transition-colors disabled:bg-slate-400 shrink-0"
                    >
                      + Add Paper
                    </button>
                  </div>
                  {pyqLinks.length > 0 && (
                    <div className="mt-3 border border-slate-200 rounded overflow-hidden">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-bold border-b border-slate-200">
                          <tr>
                            <th className="px-4 py-2 w-24">Year</th>
                            <th className="px-4 py-2">Document URL</th>
                            <th className="px-4 py-2 w-20 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white">
                          {pyqLinks.map((pyq, idx) => (
                            <tr key={idx}>
                              <td className="px-4 py-2 font-medium text-slate-900">{pyq.year}</td>
                              <td className="px-4 py-2 text-slate-600 truncate max-w-[200px]">{pyq.fileUrl}</td>
                              <td className="px-4 py-2 text-right">
                                <button onClick={() => handleRemovePyq(idx)} disabled={loading} className="text-xs font-bold text-red-600 hover:underline disabled:text-red-300">Remove</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Module D */}
                <div className="flex flex-col gap-2">
                  <h2 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2">Module D: Interactive Quiz</h2>
                  <div className="border border-slate-200 rounded p-4 bg-slate-50 flex flex-col gap-4">
                    <input
                      type="text"
                      placeholder="Question Text"
                      value={newQuiz.question}
                      onChange={e => setNewQuiz({ ...newQuiz, question: e.target.value })}
                      disabled={loading}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded bg-white focus:outline-none focus:border-slate-500 disabled:bg-slate-50 disabled:text-slate-500"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      {[0, 1, 2, 3].map(i => (
                        <input
                          key={i}
                          type="text"
                          placeholder={`Option ${i + 1}`}
                          value={newQuiz.options[i]}
                          onChange={e => handleQuizOptionChange(i, e.target.value)}
                          disabled={loading}
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded bg-white focus:outline-none focus:border-slate-500 disabled:bg-slate-50 disabled:text-slate-500"
                        />
                      ))}
                    </div>
                    <div className="flex gap-3 items-center">
                      <select
                        value={newQuiz.correctAnswer}
                        onChange={e => setNewQuiz({ ...newQuiz, correctAnswer: e.target.value })}
                        disabled={loading}
                        className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded bg-white focus:outline-none focus:border-slate-500 disabled:bg-slate-50 disabled:text-slate-500"
                      >
                        <option value="">-- Map Correct Answer --</option>
                        {newQuiz.options.map((opt, i) => opt && <option key={i} value={opt}>{opt}</option>)}
                      </select>
                      <button onClick={handleAddQuiz} disabled={loading} className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded hover:bg-slate-800 transition-colors disabled:bg-slate-400 shrink-0">Add Question to Quiz</button>
                    </div>
                  </div>
                  {quizData.length > 0 && (
                    <div className="mt-3 flex flex-col gap-3">
                      {quizData.map((q, idx) => (
                        <div key={idx} className="p-4 border border-slate-200 rounded bg-white text-sm relative">
                          <button onClick={() => handleRemoveQuiz(idx)} disabled={loading} className="absolute top-4 right-4 text-xs font-bold text-red-600 hover:underline disabled:text-red-300">Remove</button>
                          <p className="font-medium text-slate-900 mb-2">{idx + 1}. {q.question}</p>
                          <p className="text-slate-600">Ans: <span className="text-green-600 font-semibold">{q.correctAnswer}</span></p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {feedback && (
                  <div className={`p-4 rounded text-sm font-medium border ${feedback.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
                    {feedback.text}
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full py-3 bg-slate-900 text-white text-sm font-semibold rounded shadow hover:bg-slate-800 transition-colors disabled:bg-slate-400"
                >
                  {loading ? 'Processing...' : 'Save Chapter Materials'}
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
