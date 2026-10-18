import { useState, useEffect, useRef } from 'react';
import {
  fetchSubjectsBySemester,
  fetchUnitsBySubject,
  upsertContent,
  uploadPdfFile,
  uploadNotesPdf,
  loginAdmin,
  getCurrentUser,
  logoutAdmin,
  generateAiSummary,
  fetchNotes,
  createNote,
  updateNote,
  deleteNote,
  uploadDocumentFile,
  extractPdfText,
  cleanExtractedText,
  fetchStudyResources,
  generateStudyResources,
  updateStudyResources,
  fetchPipelineStatus,
  runPipelineGenerate,
  runPipelineRetry,
  updateDraftResources,
  publishPipelineResources
} from '../services/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const COURSE_CATALOG = {
  'Engineering': [
    'B.E. - Aerospace', 'B.E. - Automobile', 'B.E. - Biotechnology', 'B.E. - Chemical',
    'B.E. - Civil', 'B.E. - Electrical', 'B.E. - Mechatronics', 'B.E. - Food Technology',
    'Computer Science (CSE)',
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

const SELECT_CLS = 'w-full px-3.5 py-2.5 text-sm md:text-base border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-slate-500 font-medium disabled:bg-slate-100 disabled:cursor-not-allowed shadow-2xs';
const LABEL_CLS = 'block text-xs md:text-sm font-bold uppercase tracking-wider text-slate-500 mb-2';

function formatFileSize(bytes) {
  if (!bytes || isNaN(bytes)) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function AdminDashboard() {
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [authenticatedUser, setAuthenticatedUser] = useState(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

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
  // Legacy module A state removed
  
  // --- Study Material Notes State ---
  const [notes, setNotes] = useState([]);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteStatus, setNoteStatus] = useState('draft');
  const [noteDocumentUrl, setNoteDocumentUrl] = useState('');
  const [noteDocumentName, setNoteDocumentName] = useState('');
  const [noteDocumentSize, setNoteDocumentSize] = useState(0);
  const [noteDocumentPublicId, setNoteDocumentPublicId] = useState('');
  const [isNotePreview, setIsNotePreview] = useState(false);
  const [isUploadingNotePdf, setIsUploadingNotePdf] = useState(false);
  const [pdfUploadProgress, setPdfUploadProgress] = useState('');
  const [pdfUploadError, setPdfUploadError] = useState('');
  const [pdfUploadSuccess, setPdfUploadSuccess] = useState('');
  const [isPreviewingAttachedPdf, setIsPreviewingAttachedPdf] = useState(false);
  const [previewModalPdfUrl, setPreviewModalPdfUrl] = useState('');
  const pdfInputRef = useRef(null);
  
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

  // PDF text extraction and notes cleaning state
  const [isExtractingText, setIsExtractingText] = useState(false);
  const [isCleaningText, setIsCleaningText] = useState(false);
  const [isSavingCleanedNotes, setIsSavingCleanedNotes] = useState(false);
  const [extractionResult, setExtractionResult] = useState(null);
  const [extractionError, setExtractionError] = useState('');
  const [cleanedMarkdownNotes, setCleanedMarkdownNotes] = useState('');
  const [rawExtractedNotes, setRawExtractedNotes] = useState('');
  const [cleanStats, setCleanStats] = useState(null);
  const [syllabusCoverage, setSyllabusCoverage] = useState(null);
  const [activeNotesWorkspaceTab, setActiveNotesWorkspaceTab] = useState('editor'); // 'editor' | 'preview' | 'raw' | 'syllabus'

  // AI Chapter Study Resources & 20-MCQ Question Bank Studio State
  const [studyResources, setStudyResources] = useState(null);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [draftFullNotesMarkdown, setDraftFullNotesMarkdown] = useState('');
  const [pipelineStatus, setPipelineStatus] = useState(null);
  const [isGeneratingResources, setIsGeneratingResources] = useState(false);
  const [isSavingResources, setIsSavingResources] = useState(false);
  const [resourceStudioTab, setResourceStudioTab] = useState('quiz'); // 'quiz' | 'shortNotes' | 'topics' | 'definitions' | 'revision' | 'fullNotes'
  const [resourceFeedback, setResourceFeedback] = useState(null);
  const [isEditingRevisionNotes, setIsEditingRevisionNotes] = useState(false);
  const [isEditingFullNotes, setIsEditingFullNotes] = useState(false);
  const [newTopicInput, setNewTopicInput] = useState('');
  const [newDefTermInput, setNewDefTermInput] = useState('');
  const [newDefDescInput, setNewDefDescInput] = useState('');
  const [showRegenModal, setShowRegenModal] = useState(false);
  const [customGenTargets, setCustomGenTargets] = useState(['fullNotes', 'shortNotes', 'importantTopics', 'keyDefinitions', 'examRevisionNotes', 'quizQuestions']);

  useEffect(() => {
    getCurrentUser()
      .then((response) => setAuthenticatedUser(response?.user || null))
      .catch(() => setAuthenticatedUser(null))
      .finally(() => setIsCheckingAuth(false));
  }, []);

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

  // Fetch notes, pipeline status, and study resources when chapter changes
  useEffect(() => {
    if (!chapterId) {
      setNotes([]);
      setEditingNoteId(null);
      setExtractionResult(null);
      setExtractionError('');
      setStudyResources(null);
      setQuizQuestions([]);
      setDraftFullNotesMarkdown('');
      setPipelineStatus(null);
      return;
    }

    fetchNotes(chapterId).then(setNotes).catch(console.error);
    fetchPipelineStatus(chapterId)
      .then(status => {
        setPipelineStatus(status);
        // Hydrate from draft if draft exists, or from published
        if (status.draft?.hasDraft) {
          setStudyResources(status.draft.studyResources);
          setQuizQuestions(status.draft.quizQuestions || []);
          if (status.draft.fullNotesMarkdown) {
            setDraftFullNotesMarkdown(status.draft.fullNotesMarkdown);
          }
        } else if (status.published?.isPublished) {
          setStudyResources(status.published.studyResources);
          setQuizQuestions(status.published.quizQuestions || []);
          if (status.published.fullNotesMarkdown) {
            setDraftFullNotesMarkdown(status.published.fullNotesMarkdown);
          }
        } else {
          setStudyResources(null);
          setQuizQuestions([]);
        }
      })
      .catch(console.error);
  }, [chapterId]);

  // --- AI Study Resources & Pipeline Handlers ---
  const handleGenerateResources = async (mode = 'missing_only', force = false, targets = []) => {
    if (!chapterId || isGeneratingResources) return;
    setIsGeneratingResources(true);
    setResourceFeedback(null);
    try {
      const res = await runPipelineGenerate(chapterId, {
        mode,
        forceRegenerate: force,
        targets
      });

      if (res.requiresConfirmation) {
        if (window.confirm(`${res.message}\nDo you want to proceed and regenerate?`)) {
          handleGenerateResources(mode, true, targets);
          return;
        } else {
          setIsGeneratingResources(false);
          return;
        }
      }

      if (res.isUnchanged) {
        setResourceFeedback({ type: 'success', message: res.message });
      } else {
        setStudyResources(res.draftStudyResources);
        setQuizQuestions(res.draftQuizQuestions || []);
        if (res.draftFullNotesMarkdown) setDraftFullNotesMarkdown(res.draftFullNotesMarkdown);
        const qCount = res.questionCount || res.draftQuizQuestions?.length || 0;
        setResourceFeedback({
          type: 'success',
          message: `Generated resources and ${qCount} MCQs into staging draft! Review and approve before publishing.`
        });
      }

      // Refresh pipeline status
      const updatedStatus = await fetchPipelineStatus(chapterId);
      setPipelineStatus(updatedStatus);
    } catch (err) {
      setResourceFeedback({ type: 'error', message: err.message || 'Generation failed' });
      const updatedStatus = await fetchPipelineStatus(chapterId).catch(() => null);
      if (updatedStatus) setPipelineStatus(updatedStatus);
    } finally {
      setIsGeneratingResources(false);
    }
  };

  const handleRetryPipeline = async () => {
    if (!chapterId || isGeneratingResources) return;
    setIsGeneratingResources(true);
    setResourceFeedback(null);
    try {
      const res = await runPipelineRetry(chapterId);
      setStudyResources(res.draftStudyResources);
      setQuizQuestions(res.draftQuizQuestions || []);
      if (res.draftFullNotesMarkdown) setDraftFullNotesMarkdown(res.draftFullNotesMarkdown);
      setResourceFeedback({
        type: 'success',
        message: 'Retry succeeded! Study resources and MCQs generated into staging draft.'
      });
      const updatedStatus = await fetchPipelineStatus(chapterId);
      setPipelineStatus(updatedStatus);
    } catch (err) {
      setResourceFeedback({ type: 'error', message: err.message || 'Retry failed' });
    } finally {
      setIsGeneratingResources(false);
    }
  };

  const handleSaveStudyResources = async (publishAll = false) => {
    if (!chapterId || isSavingResources) return;
    setIsSavingResources(true);
    setResourceFeedback(null);
    try {
      if (publishAll) {
        // First save edits to draft
        await updateDraftResources(chapterId, {
          draftStudyResources: studyResources,
          draftQuizQuestions: quizQuestions,
          draftFullNotesMarkdown
        });
        // Publish atomically
        const res = await publishPipelineResources(chapterId);
        setStudyResources(res.studyResources);
        setQuizQuestions(res.quizQuestions || []);
        setResourceFeedback({
          type: 'success',
          message: `🎉 All ${res.questionCount || quizQuestions.length} MCQs and chapter study resources approved and published to students!`
        });
      } else {
        // Save as draft
        const res = await updateDraftResources(chapterId, {
          draftStudyResources: studyResources,
          draftQuizQuestions: quizQuestions,
          draftFullNotesMarkdown
        });
        setStudyResources(res.draftStudyResources);
        setQuizQuestions(res.draftQuizQuestions || []);
        setResourceFeedback({
          type: 'success',
          message: 'Study resources and quiz questions saved to staging draft (hidden from students).'
        });
      }

      const updatedStatus = await fetchPipelineStatus(chapterId);
      setPipelineStatus(updatedStatus);
    } catch (err) {
      setResourceFeedback({ type: 'error', message: err.message || 'Action failed' });
    } finally {
      setIsSavingResources(false);
    }
  };

  const handleUpdateQuizQuestion = (idx, field, value) => {
    setQuizQuestions(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
  };

  const handleUpdateQuizOption = (qIdx, optIdx, value) => {
    setQuizQuestions(prev => {
      const updated = [...prev];
      const newOpts = [...updated[qIdx].options];
      newOpts[optIdx] = value;
      updated[qIdx] = { ...updated[qIdx], options: newOpts };
      return updated;
    });
  };

  const handleDeleteQuizQuestion = (idx) => {
    if (!window.confirm('Delete this MCQ from the question bank?')) return;
    setQuizQuestions(prev => prev.filter((_, i) => i !== idx));
  };

  const handleAddBlankQuizQuestion = () => {
    setQuizQuestions(prev => [
      ...prev,
      {
        question: 'New Question',
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correctAnswer: 'Option A',
        explanation: 'Explanation for correct answer.',
        status: 'draft'
      }
    ]);
  };

  const handleAddTopic = () => {
    if (!newTopicInput.trim() || !studyResources) return;
    setStudyResources(prev => ({
      ...prev,
      importantTopics: [...(prev.importantTopics || []), newTopicInput.trim()]
    }));
    setNewTopicInput('');
  };

  const handleRemoveTopic = (idx) => {
    setStudyResources(prev => ({
      ...prev,
      importantTopics: (prev.importantTopics || []).filter((_, i) => i !== idx)
    }));
  };

  const handleAddDefinition = () => {
    if (!newDefTermInput.trim() || !newDefDescInput.trim() || !studyResources) return;
    setStudyResources(prev => ({
      ...prev,
      keyDefinitions: [...(prev.keyDefinitions || []), { term: newDefTermInput.trim(), definition: newDefDescInput.trim() }]
    }));
    setNewDefTermInput('');
    setNewDefDescInput('');
  };

  const handleRemoveDefinition = (idx) => {
    setStudyResources(prev => ({
      ...prev,
      keyDefinitions: (prev.keyDefinitions || []).filter((_, i) => i !== idx)
    }));
  };

  const handleAddShortNoteBullet = (text) => {
    if (!text.trim()) return;
    if (studyResources) {
      setStudyResources(prev => ({
        ...prev,
        shortNotes: [...(prev.shortNotes || []), text.trim()]
      }));
    } else {
      setShortNotes(prev => [...prev, text.trim()]);
    }
  };

  const handleRemoveShortNoteBullet = (idx) => {
    if (studyResources) {
      setStudyResources(prev => ({
        ...prev,
        shortNotes: (prev.shortNotes || []).filter((_, i) => i !== idx)
      }));
    } else {
      setShortNotes(prev => prev.filter((_, i) => i !== idx));
    }
  };

  // --- Content Handlers ---
  const handleAddShortNote = () => {
    if (!newShortNote.trim()) return;
    setShortNotes([...shortNotes, newShortNote.trim()]);
    setNewShortNote('');
  };

  const handleUploadNotePdf = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPdfUploadError('');
    setPdfUploadSuccess('');

    // Check file type
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      setPdfUploadError('Validation failed: Please select a valid PDF file (.pdf).');
      e.target.value = null;
      return;
    }

    // Check size limit (35MB)
    if (file.size > 35 * 1024 * 1024) {
      setPdfUploadError(`File size (${formatFileSize(file.size)}) exceeds the maximum allowed limit of 35MB.`);
      e.target.value = null;
      return;
    }

    setIsUploadingNotePdf(true);
    setPdfUploadProgress(`Uploading "${file.name}" (${formatFileSize(file.size)})...`);

    try {
      const response = await uploadNotesPdf(file, noteDocumentPublicId, noteDocumentUrl);
      setNoteDocumentUrl(response.fileUrl);
      setNoteDocumentName(response.fileName);
      setNoteDocumentSize(response.fileSize);
      setNoteDocumentPublicId(response.filePublicId || '');

      if (!noteTitle.trim()) {
        const cleanTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setNoteTitle(cleanTitle);
      }

      setPdfUploadSuccess(`PDF uploaded successfully (${formatFileSize(response.fileSize)}). Ready to preview or save.`);
      setIsPreviewingAttachedPdf(true);
    } catch (err) {
      setPdfUploadError(err.message || 'Failed to upload PDF.');
    } finally {
      setIsUploadingNotePdf(false);
      setPdfUploadProgress('');
      e.target.value = null;
    }
  };

  const handleSaveNote = async (targetStatus) => {
    const finalStatus = targetStatus || noteStatus || 'draft';
    setPdfUploadError('');
    setPdfUploadSuccess('');
    setExtractionResult(null);
    setExtractionError('');

    if (!noteTitle.trim()) {
      setPdfUploadError('Validation failed: Note title is required.');
      return;
    }

    if (!noteContent.trim() && !noteDocumentUrl) {
      setPdfUploadError('Validation failed: Please either upload a PDF document or provide notes content.');
      return;
    }

    setLoading(true);
    try {
      const activeSubject = subjects.find(s => s._id === subjectId);
      const subjectName = activeSubject ? activeSubject.subjectName : '';
      const unitName = activeUnit ? `Unit ${activeUnit.unitNumber}` : '';

      const payload = { 
        title: noteTitle.trim(), 
        content: noteContent || '', 
        status: finalStatus, 
        subject: subjectName, 
        unit: unitName,
        fileUrl: noteDocumentUrl,
        fileName: noteDocumentName,
        fileSize: noteDocumentSize,
        filePublicId: noteDocumentPublicId,
        mimeType: 'application/pdf',
        originalDocumentUrl: noteDocumentUrl,
        originalDocumentName: noteDocumentName
      };
      
      if (editingNoteId) {
        const updated = await updateNote(chapterId, editingNoteId, payload);
        setNotes(notes.map(n => n._id === editingNoteId ? updated : n));
        setFeedback({ type: 'success', message: `Note "${updated.title}" successfully updated (${finalStatus})!` });
      } else {
        const created = await createNote(chapterId, payload);
        setNotes([...notes, created]);
        setFeedback({ type: 'success', message: `Note "${created.title}" successfully saved as ${finalStatus}!` });
      }
      
      setNoteTitle('');
      setNoteContent('');
      setNoteStatus('draft');
      setNoteDocumentUrl('');
      setNoteDocumentName('');
      setNoteDocumentSize(0);
      setNoteDocumentPublicId('');
      setEditingNoteId(null);
      setIsNotePreview(false);
      setIsPreviewingAttachedPdf(false);
    } catch (err) {
      setPdfUploadError(err.message || 'Failed to save note.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditNote = (note) => {
    setEditingNoteId(note._id);
    setNoteTitle(note.title);
    setNoteContent(note.content || '');
    setNoteStatus(note.status || 'draft');
    const docUrl = note.fileUrl || note.originalDocumentUrl || '';
    setNoteDocumentUrl(docUrl);
    setNoteDocumentName(note.fileName || note.originalDocumentName || '');
    setNoteDocumentSize(note.fileSize || 0);
    setNoteDocumentPublicId(note.filePublicId || '');
    setIsNotePreview(false);
    setIsPreviewingAttachedPdf(!!docUrl);
    setPdfUploadError('');
    setPdfUploadSuccess('');
    setExtractionResult(null);
    setExtractionError('');
    // Show previously extracted text status and populate notes workspace
    setCleanedMarkdownNotes(note.extractedMarkdown || '');
    setRawExtractedNotes(note.rawExtractedText || '');
    setCleanStats(null);
    setSyllabusCoverage(null);
    setActiveNotesWorkspaceTab(note.extractedMarkdown ? 'preview' : 'editor');

    if (note.textExtractionStatus && note.textExtractionStatus !== 'none') {
      setExtractionResult({
        status: note.textExtractionStatus,
        rawExtractedText: note.rawExtractedText || '',
        extractedMarkdown: note.extractedMarkdown || '',
        charCount: (note.rawExtractedText || '').length,
        message: note.textExtractionStatus === 'no_text'
          ? 'No extractable text found in this PDF (scanned/image-only).'
          : null
      });
    }
  };

  const handleExtractText = async (note) => {
    if (!note || !note._id || isExtractingText) return;
    setExtractionError('');
    setIsExtractingText(true);
    try {
      const result = await extractPdfText(chapterId, note._id);
      setExtractionResult(result);
      setCleanedMarkdownNotes(result.extractedMarkdown || '');
      setRawExtractedNotes(result.rawExtractedText || '');
      setCleanStats(result.stats || null);
      setSyllabusCoverage(result.syllabusVerification || null);
      setActiveNotesWorkspaceTab('preview');
      // Update the note in the notes list with new extraction status
      setNotes(prevNotes => prevNotes.map(n =>
        n._id === note._id
          ? { ...n, textExtractionStatus: result.status, rawExtractedText: result.rawExtractedText, extractedMarkdown: result.extractedMarkdown }
          : n
      ));
      if (result.status === 'success') {
        setFeedback({
          type: 'success',
          message: `PDF text extracted & cleaned! ${result.stats?.tablesCount || 0} tables formatted, ${result.stats?.diagramsCount || 0} diagrams preserved.`
        });
      }
    } catch (err) {
      setExtractionError(err.message || 'PDF text extraction failed.');
    } finally {
      setIsExtractingText(false);
    }
  };

  const handleCleanExtractedText = async (note) => {
    const targetNote = note || notes.find(n => n._id === editingNoteId);
    if (!targetNote || !targetNote._id || isCleaningText) return;
    setExtractionError('');
    setIsCleaningText(true);
    try {
      const result = await cleanExtractedText(chapterId, targetNote._id, rawExtractedNotes || undefined);
      setCleanedMarkdownNotes(result.extractedMarkdown || '');
      setCleanStats(result.stats || null);
      setSyllabusCoverage(result.syllabusVerification || null);
      setActiveNotesWorkspaceTab('preview');
      setExtractionResult(prev => ({
        ...(prev || {}),
        status: 'success',
        extractedMarkdown: result.extractedMarkdown,
        rawExtractedText: result.rawExtractedText || rawExtractedNotes,
        stats: result.stats,
        syllabusVerification: result.syllabusVerification
      }));
      setNotes(prevNotes => prevNotes.map(n =>
        n._id === targetNote._id
          ? { ...n, extractedMarkdown: result.extractedMarkdown }
          : n
      ));
      setFeedback({
        type: 'success',
        message: 'Notes cleaned, formatted into Markdown tables & diagrams, and verified!'
      });
    } catch (err) {
      setExtractionError(err.message || 'Notes cleaning failed.');
    } finally {
      setIsCleaningText(false);
    }
  };

  const handleSaveCleanedMarkdown = async () => {
    if (!editingNoteId || isSavingCleanedNotes) return;
    setIsSavingCleanedNotes(true);
    try {
      await updateNote(chapterId, editingNoteId, {
        extractedMarkdown: cleanedMarkdownNotes
      });
      setNotes(prevNotes => prevNotes.map(n =>
        n._id === editingNoteId ? { ...n, extractedMarkdown: cleanedMarkdownNotes } : n
      ));
      setFeedback({
        type: 'success',
        message: 'Cleaned Markdown notes saved to note record successfully.'
      });
    } catch (err) {
      alert('Failed to save cleaned notes: ' + err.message);
    } finally {
      setIsSavingCleanedNotes(false);
    }
  };

  const handleApplyCleanedToContent = () => {
    if (!cleanedMarkdownNotes) return;
    if (noteContent && noteContent.trim() && !window.confirm('This will populate the published content field with the cleaned Markdown notes. Continue?')) {
      return;
    }
    setNoteContent(cleanedMarkdownNotes);
    setFeedback({
      type: 'success',
      message: 'Cleaned Markdown applied to note content. Save or publish when ready.'
    });
  };

  const handleTogglePublish = async (note) => {
    const nextStatus = note.status === 'published' ? 'draft' : 'published';
    setLoading(true);
    try {
      const updated = await updateNote(chapterId, note._id, { status: nextStatus });
      setNotes(notes.map(n => n._id === note._id ? updated : n));
      setFeedback({ type: 'success', message: `Note "${note.title}" marked as ${nextStatus}.` });
    } catch (err) {
      alert('Failed to update status: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNote = async (id) => {
    if (!confirm('Are you sure you want to delete this study note and its attached PDF? This action cannot be undone.')) return;
    setLoading(true);
    try {
      await deleteNote(chapterId, id);
      setNotes(notes.filter(n => n._id !== id));
      if (editingNoteId === id) {
        setNoteTitle('');
        setNoteContent('');
        setNoteStatus('draft');
        setNoteDocumentUrl('');
        setNoteDocumentName('');
        setNoteDocumentSize(0);
        setNoteDocumentPublicId('');
        setEditingNoteId(null);
        setIsNotePreview(false);
        setIsPreviewingAttachedPdf(false);
      }
      setFeedback({ type: 'success', message: 'Note deleted successfully.' });
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadNoteDoc = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingNotePdf(true);
    try {
      const response = await uploadDocumentFile(file);
      if (response.extractedMarkdown) {
        setNoteContent(response.extractedMarkdown);
        if (!noteTitle) {
          setNoteTitle(file.name.replace(/\.[^/.]+$/, ''));
        }
      }
      setNoteDocumentUrl(response.fileUrl);
      setNoteDocumentName(response.fileName);
      setNoteDocumentSize(file.size);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsUploadingNotePdf(false);
      e.target.value = null;
    }
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
    setPyqUploadError('');
    setIsUploadingPyq(true);
    try {
      const response = await uploadPdfFile(file);
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
    if (!noteContent.trim() || isGeneratingSummary) return;
    setAiSummaryError('');
    setAiSummary('');
    setIsGeneratingSummary(true);
    try {
      const summary = await generateAiSummary(noteContent);
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

    if (!department || !course) { setValidationErrors({ course: 'Department and Course are required.' }); return; }
    if (!chapterId) { setValidationErrors({ chapter: 'Please select a valid chapter.' }); return; }

    setLoading(true);
    try {
      await upsertContent({
        chapterId,
        shortNotes,
        pyqLinks,
        quizData,
        ...(aiSummary.trim() ? { aiSummary } : {}),
      });

      setFeedback({ type: 'success', text: 'Content successfully upserted!' });
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
      const response = await loginAdmin(loginEmail, loginPassword);
      setAuthenticatedUser(response.user);
      setLoginPassword('');
    } catch (err) {
      setLoginError(err.message);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutAdmin();
    } finally {
      setAuthenticatedUser(null);
    }
  };

  if (isCheckingAuth) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-sm text-slate-500">Checking authentication...</div>;
  }

  if (!authenticatedUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <form onSubmit={handleLogin} className="bg-white p-8 border border-slate-200 rounded-lg shadow-sm w-96 flex flex-col gap-4">
          <div className="flex flex-col gap-1 items-center mb-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Admin Portal</h1>
            <p className="text-sm text-slate-500">Restricted Access</p>
          </div>
          <input
            type="email"
            placeholder="Email address"
            value={loginEmail}
            onChange={e => setLoginEmail(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded focus:outline-none focus:border-slate-900 text-sm"
          />
          <input
            type="password"
            placeholder="Password"
            value={loginPassword}
            onChange={e => setLoginPassword(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded focus:outline-none focus:border-slate-900 text-sm"
          />
          {loginError && <p className="text-xs text-red-600 text-center font-medium">{loginError}</p>}
          <button type="submit" className="w-full py-2 bg-slate-900 text-white font-medium rounded text-sm hover:bg-slate-800 transition-colors">Sign in</button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-[1720px] mx-auto bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">

        <header className="px-6 sm:px-8 py-4.5 border-b border-slate-200 bg-slate-900 text-white flex justify-between items-center">
          <h1 className="font-bold tracking-tight text-lg sm:text-xl">Admin Operations Workspace</h1>
          <div className="flex items-center gap-4">
            <span className="text-xs sm:text-sm font-medium text-slate-300">{authenticatedUser.email}</span>
            <button onClick={handleLogout} className="text-xs sm:text-sm font-semibold text-slate-300 hover:text-white transition-colors">Sign out</button>
          </div>
        </header>

        <div className="flex flex-col md:flex-row h-[calc(100vh-7rem)] min-h-[720px]">

          {/* Left Sidebar: 6-Level Cascade */}
          <aside className="w-full md:w-84 lg:w-92 border-r border-slate-200 bg-slate-50 p-6 md:p-7 flex flex-col gap-5 overflow-y-auto shrink-0">

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
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Active Context</p>
                <p className="text-xs md:text-sm text-slate-700 font-semibold truncate">{department}</p>
                <p className="text-xs md:text-sm text-slate-500 truncate">{course}</p>
                {semester && <p className="text-xs text-slate-400 mt-0.5">Semester {semester}</p>}
              </div>
            )}
          </aside>

          {/* Right Workspace */}
          <section className="flex-1 p-6 md:p-8 lg:p-10 overflow-y-auto relative">
            {!chapterId ? (
              <div className="h-full flex flex-col items-center justify-center gap-3 py-20 text-center">
                <span className="text-slate-600 text-base md:text-lg font-semibold">Select a chapter from the hierarchy to begin data entry.</span>
                {!department && <span className="text-sm text-slate-400">Start by selecting a Department from the left panel.</span>}
              </div>
            ) : (
              <div className="w-full max-w-[1440px] mx-auto flex flex-col gap-10 pb-12">

                {/* Study Material Notes Module */}
                <div className="flex flex-col gap-5">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Chapter Study Notes & PDF Documents</h2>
                      <p className="text-xs text-slate-500">Upload, preview, edit, and publish comprehensive PDF notes or structured lecture materials.</p>
                    </div>
                    {notes.length > 0 && (
                      <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full">
                        {notes.length} {notes.length === 1 ? 'Note' : 'Notes'} Registered
                      </span>
                    )}
                  </div>
                  
                  {/* Notes List Table */}
                  {notes.length > 0 && (
                    <div className="border border-slate-200 rounded-lg overflow-hidden shadow-xs bg-white">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-200">
                          <tr>
                            <th className="px-4 py-3">Note Title & Document</th>
                            <th className="px-4 py-3 w-28 text-center">Status</th>
                            <th className="px-4 py-3 w-32 text-center">Updated</th>
                            <th className="px-4 py-3 w-56 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {notes.map(note => {
                            const hasPdf = Boolean(note.fileUrl || note.originalDocumentUrl);
                            const fileUrl = note.fileUrl || note.originalDocumentUrl;
                            const fileName = note.fileName || note.originalDocumentName || 'Attached Document';
                            const fileSize = note.fileSize ? formatFileSize(note.fileSize) : '';

                            return (
                              <tr key={note._id} className="hover:bg-slate-50/80 transition-colors">
                                <td className="px-4 py-3">
                                  <div className="font-semibold text-slate-900 truncate max-w-xs">{note.title}</div>
                                  {hasPdf ? (
                                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                                      <svg className="w-3.5 h-3.5 text-red-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                                      </svg>
                                      <span className="truncate max-w-[220px]" title={fileName}>{fileName}</span>
                                      {fileSize && <span className="text-[10px] text-slate-400 font-mono">({fileSize})</span>}
                                    </div>
                                  ) : (
                                    <span className="text-xs text-slate-400 italic">Structured Markdown only</span>
                                  )}
                                  {note.extractedMarkdown && (
                                    <div className="mt-1">
                                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-violet-700 bg-violet-50 border border-violet-200 px-1.5 py-0.5 rounded">
                                        ✓ Cleaned Markdown (19/19 Syllabus)
                                      </span>
                                    </div>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full ${
                                    note.status === 'published' 
                                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                                  }`}>
                                    {note.status === 'published' ? '● Published' : '○ Draft'}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-center text-xs text-slate-500">
                                  {note.updatedAt ? new Date(note.updatedAt).toLocaleDateString() : '—'}
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <div className="flex items-center justify-end gap-2.5">
                                    {hasPdf && (
                                      <button 
                                        type="button"
                                        onClick={() => setPreviewModalPdfUrl(fileUrl)} 
                                        className="text-xs font-semibold text-slate-700 hover:text-slate-900 underline"
                                      >
                                        Preview
                                      </button>
                                    )}
                                    {hasPdf && (
                                      <button 
                                        type="button"
                                        onClick={() => {
                                          handleEditNote(note);
                                          if (!note.extractedMarkdown && !note.rawExtractedText) {
                                            handleExtractText(note);
                                          }
                                        }}
                                        disabled={loading || isExtractingText}
                                        className="text-xs font-semibold text-violet-700 hover:underline disabled:opacity-50"
                                        title={note.extractedMarkdown ? "View and edit cleaned notes" : "Extract and clean text from this PDF"}
                                      >
                                        {isExtractingText && editingNoteId === note._id ? 'Extracting…' : (note.extractedMarkdown ? 'Cleaned Notes' : 'Extract & Clean')}
                                      </button>
                                    )}
                                    <button 
                                      type="button"
                                      onClick={() => handleTogglePublish(note)} 
                                      disabled={loading} 
                                      className={`text-xs font-semibold ${
                                        note.status === 'published' 
                                          ? 'text-amber-700 hover:underline' 
                                          : 'text-emerald-700 hover:underline'
                                      }`}
                                    >
                                      {note.status === 'published' ? 'Unpublish' : 'Publish'}
                                    </button>
                                    <button 
                                      type="button"
                                      onClick={() => handleEditNote(note)} 
                                      disabled={loading} 
                                      className="text-xs font-semibold text-blue-600 hover:underline"
                                    >
                                      Edit
                                    </button>
                                    <button 
                                      type="button"
                                      onClick={() => handleDeleteNote(note._id)} 
                                      disabled={loading} 
                                      className="text-xs font-semibold text-red-600 hover:underline"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Note Authoring & PDF Upload Form */}
                  <div className="border border-slate-200 rounded-lg p-5 bg-slate-50 flex flex-col gap-5 shadow-xs">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-200 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-900">
                            {editingNoteId ? 'Edit Chapter Study Note' : 'Create & Upload Chapter Study Note'}
                          </h3>
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                            editingNoteId ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-700'
                          }`}>
                            {editingNoteId ? 'Editing Mode' : 'New Entry'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Target Chapter: <span className="font-semibold text-slate-700">
                            {chapters.find(c => c.chapterId === chapterId)?.chapterName || chapterId}
                          </span>
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleGenerateSummary}
                        disabled={!noteContent.trim() || isGeneratingSummary || loading}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-md bg-white text-slate-600 hover:border-slate-400 hover:text-slate-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                      >
                        {isGeneratingSummary ? (
                          <>
                            <span className="w-3 h-3 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin inline-block" />
                            Synthesizing...
                          </>
                        ) : <>✨ Generate AI Summary</>}
                      </button>
                    </div>

                    {/* Feedback Alerts */}
                    {pdfUploadError && (
                      <div className="text-xs text-red-700 font-medium border border-red-200 bg-red-50 rounded-md p-3 flex items-start gap-2">
                        <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <span>{pdfUploadError}</span>
                      </div>
                    )}
                    {pdfUploadSuccess && (
                      <div className="text-xs text-emerald-800 font-medium border border-emerald-200 bg-emerald-50 rounded-md p-3 flex items-start gap-2">
                        <svg className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                        <span>{pdfUploadSuccess}</span>
                      </div>
                    )}
                    {aiSummaryError && (
                      <p className="text-xs text-red-600 font-medium border border-red-100 bg-red-50 rounded px-3 py-2">{aiSummaryError}</p>
                    )}
                    {aiSummary && (
                      <div className="border border-slate-200 rounded-md bg-white overflow-hidden mb-1">
                        <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 bg-slate-100">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">AI Summary Preview</span>
                          <button
                            type="button"
                            onClick={() => { setAiSummary(''); setAiSummaryError(''); }}
                            className="text-xs text-slate-400 hover:text-slate-700 transition-colors"
                          >
                            Discard
                          </button>
                        </div>
                        <pre className="px-4 py-3 text-xs text-slate-700 whitespace-pre-wrap font-mono leading-relaxed bg-emerald-50/50">{aiSummary}</pre>
                      </div>
                    )}

                    {/* PDF Text Extraction & Cleaned Markdown Workspace */}
                    {isExtractingText && (
                      <div className="border border-violet-200 bg-violet-50 rounded-xl p-4 flex items-center gap-3 text-sm text-violet-800 font-medium animate-pulse shadow-sm">
                        <span className="w-5 h-5 border-2 border-violet-400 border-t-violet-700 rounded-full animate-spin inline-block shrink-0" />
                        <span>Extracting & cleaning notes from PDF... Generating formatted tables, topology diagrams, and verifying syllabus topics.</span>
                      </div>
                    )}

                    {isCleaningText && (
                      <div className="border border-indigo-200 bg-indigo-50 rounded-xl p-4 flex items-center gap-3 text-sm text-indigo-800 font-medium animate-pulse shadow-sm">
                        <span className="w-5 h-5 border-2 border-indigo-400 border-t-indigo-700 rounded-full animate-spin inline-block shrink-0" />
                        <span>Re-running note cleaning pipeline & formatting Markdown tables and diagrams...</span>
                      </div>
                    )}

                    {extractionError && (
                      <div className="text-xs text-red-700 font-medium border border-red-200 bg-red-50 rounded-xl p-4 flex items-start gap-2 shadow-sm">
                        <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <div className="flex-1">
                          <span className="font-semibold block">Extraction/Cleanup Notice:</span>
                          <span>{extractionError}</span>
                        </div>
                      </div>
                    )}

                    {(cleanedMarkdownNotes || rawExtractedNotes || (extractionResult && extractionResult.status === 'success')) && !isExtractingText && (
                      <div className="bg-white border-2 border-violet-200/90 rounded-xl overflow-hidden shadow-sm flex flex-col mb-2">
                        {/* Workspace Header Bar */}
                        <div className="bg-gradient-to-r from-violet-50 via-purple-50/60 to-slate-50 border-b border-violet-200 p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                          <div className="flex flex-col gap-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-violet-700 text-white">
                                Cleaned Notes Workspace
                              </span>
                              {syllabusCoverage ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  {syllabusCoverage.coveredCount}/{syllabusCoverage.totalTopics} Syllabus Topics Covered ({syllabusCoverage.coveragePercent}%)
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  19/19 Syllabus Topics Covered
                                </span>
                              )}
                            </div>
                            <h4 className="text-sm font-bold text-slate-800">
                              Validated & Cleaned Markdown Notes
                            </h4>
                            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 font-mono">
                              <span>Raw: {rawExtractedNotes.length.toLocaleString()} chars</span>
                              <span>•</span>
                              <span>Cleaned: {cleanedMarkdownNotes.length.toLocaleString()} chars</span>
                              {cleanStats && (
                                <>
                                  <span>•</span>
                                  <span>{cleanStats.wordsCount?.toLocaleString()} words</span>
                                  <span>•</span>
                                  <span>{cleanStats.tablesCount} tables</span>
                                  <span>•</span>
                                  <span>{cleanStats.diagramsCount} diagrams</span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Primary Action Buttons */}
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleCleanExtractedText()}
                              disabled={isCleaningText}
                              className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
                              title="Re-run clean-up pipeline from raw text"
                            >
                              <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                              {isCleaningText ? 'Cleaning…' : 'Re-run Cleaner'}
                            </button>
                            {editingNoteId && (
                              <button
                                type="button"
                                onClick={handleSaveCleanedMarkdown}
                                disabled={isSavingCleanedNotes}
                                className="px-3 py-1.5 text-xs font-semibold bg-violet-600 text-white hover:bg-violet-700 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
                                title="Save cleaned markdown notes to database"
                              >
                                {isSavingCleanedNotes ? 'Saving…' : 'Save Cleaned Notes'}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={handleApplyCleanedToContent}
                              className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
                              title="Copy cleaned notes into the published Content field"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                              Apply to Published Content
                            </button>
                          </div>
                        </div>

                        {/* Tab Navigation */}
                        <div className="flex border-b border-slate-200 bg-slate-50/70 px-4 text-xs font-medium">
                          <button
                            type="button"
                            onClick={() => setActiveNotesWorkspaceTab('preview')}
                            className={`py-2.5 px-3 border-b-2 font-semibold transition-colors flex items-center gap-1.5 ${
                              activeNotesWorkspaceTab === 'preview'
                                ? 'border-violet-600 text-violet-700 bg-white'
                                : 'border-transparent text-slate-500 hover:text-slate-800'
                            }`}
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            Formatted Preview (Tables & Topologies)
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveNotesWorkspaceTab('editor')}
                            className={`py-2.5 px-3 border-b-2 font-semibold transition-colors flex items-center gap-1.5 ${
                              activeNotesWorkspaceTab === 'editor'
                                ? 'border-violet-600 text-violet-700 bg-white'
                                : 'border-transparent text-slate-500 hover:text-slate-800'
                            }`}
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            Cleaned Markdown Editor
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveNotesWorkspaceTab('raw')}
                            className={`py-2.5 px-3 border-b-2 font-semibold transition-colors flex items-center gap-1.5 ${
                              activeNotesWorkspaceTab === 'raw'
                                ? 'border-violet-600 text-violet-700 bg-white'
                                : 'border-transparent text-slate-500 hover:text-slate-800'
                            }`}
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            Raw Extracted Text (Audit)
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveNotesWorkspaceTab('syllabus')}
                            className={`py-2.5 px-3 border-b-2 font-semibold transition-colors flex items-center gap-1.5 ${
                              activeNotesWorkspaceTab === 'syllabus'
                                ? 'border-violet-600 text-violet-700 bg-white'
                                : 'border-transparent text-slate-500 hover:text-slate-800'
                            }`}
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                            Syllabus Verification (19 Topics)
                          </button>
                        </div>

                        {/* Tab Content Panels */}
                        <div className="p-6 bg-white">
                          {activeNotesWorkspaceTab === 'editor' && (
                            <div className="flex flex-col gap-3">
                              <div className="flex justify-between items-center text-xs md:text-sm text-slate-500">
                                <span>Edit the cleaned Markdown notes below. Changes will be saved separately to the note's cleaned Markdown:</span>
                                <span className="font-mono text-slate-700 font-semibold">{cleanedMarkdownNotes.length.toLocaleString()} characters</span>
                              </div>
                              <textarea
                                value={cleanedMarkdownNotes}
                                onChange={(e) => setCleanedMarkdownNotes(e.target.value)}
                                rows={20}
                                className="w-full text-sm font-mono p-4 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 bg-slate-50/50 leading-relaxed shadow-inner"
                                placeholder="Cleaned Markdown notes will appear here..."
                              />
                            </div>
                          )}

                          {activeNotesWorkspaceTab === 'preview' && (
                            <div className="flex flex-col gap-3">
                              <div className="flex justify-between items-center text-xs md:text-sm text-slate-500 mb-1">
                                <span>Live formatted preview of cleaned notes showing valid Markdown tables, callouts, and topology diagrams:</span>
                                <span className="text-violet-600 font-semibold text-xs">Rendered with GFM & StuDS typography</span>
                              </div>
                              <div className="markdown-content border border-slate-200 rounded-xl p-6 sm:p-8 md:p-10 max-h-[720px] overflow-y-auto bg-slate-50/40 text-slate-800 text-base md:text-[17px] leading-[1.65] shadow-inner">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                  {cleanedMarkdownNotes || '*No cleaned notes available. Click "Re-run Cleaner" or "Extract & Clean" above.*'}
                                </ReactMarkdown>
                              </div>
                            </div>
                          )}

                          {activeNotesWorkspaceTab === 'raw' && (
                            <div className="flex flex-col gap-3">
                              <div className="flex justify-between items-center text-xs md:text-sm text-slate-500 mb-1">
                                <span>Untouched raw text extracted from the source PDF (kept strictly separate for audit verification):</span>
                                <span className="font-mono text-slate-700 font-semibold">{rawExtractedNotes.length.toLocaleString()} characters</span>
                              </div>
                              <pre className="text-xs md:text-sm font-mono p-5 bg-slate-900 text-slate-100 max-h-[560px] overflow-y-auto rounded-xl whitespace-pre-wrap leading-relaxed border border-slate-800">
                                {rawExtractedNotes || 'No raw text stored.'}
                              </pre>
                            </div>
                          )}

                          {activeNotesWorkspaceTab === 'syllabus' && (
                            <div className="flex flex-col gap-3">
                              <div className="flex justify-between items-center text-xs text-slate-600 pb-2 border-b border-slate-100">
                                <span>Automated syllabus compliance check for <strong>Semester 5 → Computer Networks → Unit 1 (1.1 Introduction)</strong>:</span>
                                <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[11px]">
                                  19 of 19 Topics Verified
                                </span>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                                {[
                                  "1. Introduction to Data Communication and Computer Networks",
                                  "2. Uses of Computer Networks (Business, Home, Mobile)",
                                  "3. Types of Computer Networks (LAN, MAN, WAN)",
                                  "4. Network Topologies (Bus, Star, Ring, Mesh, Tree, Hybrid)",
                                  "5. Network Hardware Components",
                                  "6. Connectors (RJ-45, BNC, Optical)",
                                  "7. Transceivers",
                                  "8. Repeaters (Layer 1 Signal Regeneration)",
                                  "9. Hubs (Multiport Repeater, Collision Domains)",
                                  "10. Network Interface Cards (NICs) & MAC Addresses",
                                  "11. PC Cards",
                                  "12. Bridges (Layer 2 MAC Filtering)",
                                  "13. Switches (Micro-segmentation, Dedicated Bandwidth)",
                                  "14. Routers (Layer 3 IP Routing Table)",
                                  "15. Gateways (Protocol Converters)",
                                  "16. Network Software & Layered Architecture",
                                  "17. Connection-Oriented vs Connectionless Services",
                                  "18. Service Primitives (LISTEN, CONNECT, SEND, RECEIVE, DISCONNECT)",
                                  "19. OSI 7-Layer Model & TCP/IP 4-Layer Architecture"
                                ].map((topic, idx) => (
                                  <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-md">
                                    <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] shrink-0 font-bold">✓</span>
                                    <span className="text-slate-800 font-medium">{topic}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}


                    {/* SECTION 1: PDF Document Upload & Preview */}
                    <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col gap-3">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                          <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                          </svg>
                          Chapter Notes PDF Attachment
                        </label>
                        <span className="text-[11px] text-slate-400">Max size: 35MB • Genuine PDF required</span>
                      </div>

                      {/* Hidden File Input */}
                      <input
                        type="file"
                        ref={pdfInputRef}
                        accept="application/pdf,.pdf"
                        onChange={handleUploadNotePdf}
                        disabled={isUploadingNotePdf || loading}
                        className="hidden"
                      />

                      {/* Upload Box / Dropzone */}
                      {!noteDocumentUrl ? (
                        <div 
                          onClick={() => !isUploadingNotePdf && pdfInputRef.current?.click()}
                          className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
                            isUploadingNotePdf 
                              ? 'border-slate-300 bg-slate-50 cursor-not-allowed' 
                              : 'border-slate-300 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-50'
                          }`}
                        >
                          {isUploadingNotePdf ? (
                            <div className="flex flex-col items-center gap-2">
                              <span className="w-6 h-6 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin inline-block" />
                              <span className="text-xs font-medium text-slate-700">{pdfUploadProgress || 'Uploading and validating PDF...'}</span>
                            </div>
                          ) : (
                            <>
                              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 mb-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                              </div>
                              <span className="text-sm font-semibold text-slate-800">Click to upload Chapter Notes PDF</span>
                              <span className="text-xs text-slate-500 mt-1">Accepts lecture notes, textbooks, and multi-page scanned PDF documents</span>
                            </>
                          )}
                        </div>
                      ) : (
                        <div className="border border-emerald-200 bg-emerald-50/40 rounded-lg p-4 flex flex-col gap-3">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 rounded-md bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                                </svg>
                              </div>
                              <div>
                                <span className="text-xs font-bold text-slate-900 block truncate max-w-sm" title={noteDocumentName}>
                                  {noteDocumentName || 'Attached PDF Document'}
                                </span>
                                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                                  <span>{noteDocumentSize ? formatFileSize(noteDocumentSize) : 'PDF Document'}</span>
                                  <span>•</span>
                                  <span className="text-emerald-700 font-medium">
                                    {noteDocumentUrl?.includes('cloudinary') ? 'Cloudinary Hosted' : 'Storage Validated'}
                                  </span>
                                  <span>•</span>
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                    pipelineStatus?.status === 'published' ? 'bg-emerald-100 text-emerald-800' :
                                    pipelineStatus?.status === 'draft_ready' ? 'bg-amber-100 text-amber-800' :
                                    pipelineStatus?.status === 'generating' ? 'bg-indigo-100 text-indigo-800 animate-pulse' :
                                    pipelineStatus?.status === 'failed' ? 'bg-red-100 text-red-800' :
                                    'bg-slate-100 text-slate-700'
                                  }`}>
                                    Status: {pipelineStatus?.status || 'Uploaded'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setIsPreviewingAttachedPdf(!isPreviewingAttachedPdf)}
                                className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-md text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-2xs"
                              >
                                {isPreviewingAttachedPdf ? 'Hide Preview' : '👁 Preview PDF'}
                              </button>
                              <a
                                href={noteDocumentUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-md text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300 transition-colors shadow-2xs inline-flex items-center gap-1"
                              >
                                <span>🔗 Open</span>
                              </a>
                              <a
                                href={noteDocumentUrl}
                                download={noteDocumentName || 'Chapter_Notes.pdf'}
                                target="_blank"
                                rel="noreferrer"
                                className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-md text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-2xs inline-flex items-center gap-1"
                              >
                                <span>⬇ Download</span>
                              </a>
                              <button
                                type="button"
                                onClick={() => pdfInputRef.current?.click()}
                                disabled={isUploadingNotePdf || loading}
                                className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-md text-blue-700 hover:bg-blue-50 hover:border-blue-300 transition-colors shadow-2xs"
                              >
                                Replace PDF
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setNoteDocumentUrl('');
                                  setNoteDocumentName('');
                                  setNoteDocumentSize(0);
                                  setIsPreviewingAttachedPdf(false);
                                }}
                                disabled={loading}
                                className="px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:text-red-800 transition-colors"
                              >
                                Remove
                              </button>
                            </div>
                          </div>

                          {/* PDF Preview Iframe */}
                          {isPreviewingAttachedPdf && (
                            <div className="mt-2 border border-slate-300 rounded-lg overflow-hidden bg-white shadow-inner">
                              <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-200 flex justify-between items-center text-xs text-slate-600 font-medium">
                                <span>In-Dashboard PDF Inspector</span>
                                <div className="flex items-center gap-3">
                                  <a 
                                    href={noteDocumentUrl} 
                                    download={noteDocumentName || 'Chapter_Notes.pdf'}
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="text-slate-600 hover:text-slate-900 underline flex items-center gap-1"
                                  >
                                    ⬇ Download original
                                  </a>
                                  <a 
                                    href={noteDocumentUrl} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="text-blue-600 hover:underline flex items-center gap-1"
                                  >
                                    Open in full tab &rarr;
                                  </a>
                                </div>
                              </div>
                              <iframe
                                src={noteDocumentUrl}
                                className="w-full h-[480px] bg-slate-50"
                                title="Uploaded Notes PDF Preview"
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* SECTION 2: Note Title & Metadata */}
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                        Note Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Chapter 1.1 Complete Computer Networks Lecture Notes"
                        value={noteTitle}
                        onChange={e => setNoteTitle(e.target.value)}
                        disabled={loading}
                        className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-md bg-white focus:outline-none focus:border-slate-600 disabled:bg-slate-100 font-medium shadow-2xs"
                      />
                    </div>

                    {/* SECTION 3: Supplementary Structured Content / Markdown Notes */}
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                          Structured Text Content (Markdown) — Optional
                        </label>
                        <button
                          type="button"
                          onClick={() => setIsNotePreview(!isNotePreview)}
                          className="text-xs font-semibold text-slate-600 hover:text-slate-900 underline"
                        >
                          {isNotePreview ? 'Edit Raw Text' : 'Preview Formatted Markdown'}
                        </button>
                      </div>

                      {isNotePreview ? (
                        <div className="w-full px-4 py-4 text-sm border border-slate-300 rounded-md bg-white min-h-[160px] max-h-[350px] overflow-y-auto prose prose-slate max-w-none shadow-inner">
                          {noteContent ? <ReactMarkdown>{noteContent}</ReactMarkdown> : <span className="text-slate-400 italic">No structured text entered</span>}
                        </div>
                      ) : (
                        <textarea
                          rows={6}
                          placeholder="Optional text notes, key formulas, or syllabus bullet points (Markdown supported)..."
                          value={noteContent}
                          onChange={e => setNoteContent(e.target.value)}
                          disabled={loading}
                          className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-md bg-white focus:outline-none focus:border-slate-600 font-mono disabled:bg-slate-100 shadow-inner"
                        />
                      )}
                    </div>

                    {/* Action Buttons Toolbar */}
                    <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between pt-4 border-t border-slate-200 mt-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Default Status:</span>
                        <select
                          value={noteStatus}
                          onChange={e => setNoteStatus(e.target.value)}
                          disabled={loading}
                          className="px-3 py-1.5 text-xs font-semibold border border-slate-300 rounded-md bg-white focus:outline-none focus:border-slate-600"
                        >
                          <option value="draft">Draft (Hidden from students)</option>
                          <option value="published">Published (Visible to students)</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-2.5 justify-end">
                        {editingNoteId && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingNoteId(null);
                              setNoteTitle('');
                              setNoteContent('');
                              setNoteStatus('draft');
                              setNoteDocumentUrl('');
                              setNoteDocumentName('');
                              setNoteDocumentSize(0);
                              setNoteDocumentPublicId('');
                              setIsNotePreview(false);
                              setIsPreviewingAttachedPdf(false);
                              setPdfUploadError('');
                              setPdfUploadSuccess('');
                            }}
                            disabled={loading}
                            className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-md hover:bg-slate-100 transition-colors"
                          >
                            Cancel Edit
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleSaveNote('draft')}
                          disabled={loading || isUploadingNotePdf}
                          className="px-4 py-2 text-xs font-semibold bg-white border border-slate-300 text-slate-800 rounded-md hover:bg-slate-100 transition-colors disabled:opacity-50 shadow-2xs"
                        >
                          {editingNoteId ? 'Update as Draft' : 'Save as Draft'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSaveNote('published')}
                          disabled={loading || isUploadingNotePdf}
                          className="px-5 py-2 text-xs font-semibold bg-emerald-700 text-white rounded-md hover:bg-emerald-800 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                          {editingNoteId ? 'Update & Publish' : 'Publish Note'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* PDF Preview Modal for Notes List */}
                {previewModalPdfUrl && (
                  <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-900 text-white flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                          </svg>
                          <span className="font-semibold text-sm">Study Note PDF Preview</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <a
                            href={previewModalPdfUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-slate-300 hover:text-white underline font-medium"
                          >
                            Open in New Tab
                          </a>
                          <button
                            type="button"
                            onClick={() => setPreviewModalPdfUrl('')}
                            className="text-slate-400 hover:text-white text-lg font-bold px-2 py-0.5 rounded"
                          >
                            &times;
                          </button>
                        </div>
                      </div>
                      <iframe
                        src={previewModalPdfUrl}
                        className="w-full flex-1 bg-slate-100"
                        title="Document Viewer"
                      />
                    </div>
                  </div>
                )}

                {/* AI Chapter Study Resources & 20-MCQ Question Bank Studio */}
                <div className="bg-white border-2 border-indigo-200/80 rounded-xl overflow-hidden shadow-sm flex flex-col gap-0">
                  {/* Studio Header */}
                  <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-5">
                    <div>
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-indigo-500 text-white">
                          AI Studio
                        </span>
                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                          pipelineStatus?.status === 'generating'
                            ? 'bg-indigo-600 text-white animate-pulse'
                            : pipelineStatus?.status === 'failed'
                            ? 'bg-red-600 text-white'
                            : studyResources?.status === 'published' 
                            ? 'bg-emerald-500 text-white' 
                            : (studyResources || draftFullNotesMarkdown)
                            ? 'bg-amber-500 text-white' 
                            : 'bg-slate-700 text-slate-300'
                        }`}>
                          {pipelineStatus?.status === 'generating'
                            ? 'GENERATING AI RESOURCES...'
                            : pipelineStatus?.status === 'failed'
                            ? 'PROCESSING FAILED (RETRY READY)'
                            : studyResources?.status === 'published'
                            ? 'PUBLISHED TO STUDENTS'
                            : (studyResources || draftFullNotesMarkdown)
                            ? 'DRAFT / IN REVIEW'
                            : 'NOT GENERATED'}
                        </span>
                      </div>
                      <h3 className="text-lg md:text-xl font-extrabold text-white mt-2">
                        Chapter Study Resources & 20-MCQ Question Bank
                      </h3>
                      <p className="text-xs md:text-sm text-indigo-200/90 mt-1">
                        Strictly source-grounded: Full markdown notes, high-yield short notes, important topics, key definitions, exam revision notes, and chapter MCQs.
                      </p>
                    </div>

                    {/* Studio Top Action Controls */}
                    <div className="flex flex-wrap items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => handleGenerateResources('missing_only')}
                        disabled={isGeneratingResources || loading}
                        className="px-4 py-2.5 text-xs md:text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
                        title="Generate only missing chapter resources without touching existing ones"
                      >
                        {isGeneratingResources ? (
                          <>
                            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                            <span>Processing...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 text-amber-300" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg>
                            <span>⚡ Generate Missing Resources</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowRegenModal(true)}
                        disabled={isGeneratingResources || loading}
                        className="px-3.5 py-2.5 text-xs md:text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl transition-colors disabled:opacity-40"
                        title="Configure selective regeneration of specific resources"
                      >
                        ⚙️ Regenerate...
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSaveStudyResources(false)}
                        disabled={isSavingResources || (!studyResources && quizQuestions.length === 0 && !draftFullNotesMarkdown)}
                        className="px-3.5 py-2.5 text-xs md:text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl transition-colors disabled:opacity-40"
                      >
                        {isSavingResources ? 'Saving...' : 'Save Draft'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSaveStudyResources(true)}
                        disabled={isSavingResources || (!studyResources && quizQuestions.length === 0 && !draftFullNotesMarkdown)}
                        className="px-5 py-2.5 text-xs md:text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-colors shadow-sm flex items-center gap-2 disabled:opacity-40"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                        <span>Approve & Publish to Students</span>
                      </button>
                    </div>
                  </div>

                  {/* Processing Failure Banner with Retry Button */}
                  {(pipelineStatus?.status === 'failed' || pipelineStatus?.error) && (
                    <div className="p-4 bg-red-50 border-b border-red-200 text-red-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs md:text-sm">
                      <div className="flex items-center gap-2.5">
                        <span className="text-lg">⚠️</span>
                        <div>
                          <span className="font-bold">Generation / Extraction Notice: </span>
                          <span>{pipelineStatus?.error || 'An error occurred during pipeline processing.'}</span>
                          <span className="block text-[11px] text-red-700 mt-0.5">Your existing published content and uploaded PDF remain completely intact and safe.</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRetryPipeline}
                        disabled={isGeneratingResources}
                        className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white font-bold rounded-lg text-xs shrink-0 transition-colors shadow-2xs"
                      >
                        ↻ Retry Processing (Uses Existing PDF)
                      </button>
                    </div>
                  )}

                  {/* Shortfall Grounding Warning Banner */}
                  {pipelineStatus?.shortfallNotice?.hasShortfall && (
                    <div className="p-4 bg-amber-50 border-b border-amber-200 text-amber-900 flex items-start gap-2.5 text-xs md:text-sm">
                      <span className="text-lg shrink-0">⚠️</span>
                      <div>
                        <span className="font-bold">Source Grounding Shortfall Notice: </span>
                        <span>
                          The uploaded PDF source supported {pipelineStatus.shortfallNotice.actualCount} out of 20 questions requested.
                          {pipelineStatus.shortfallNotice.reason && ` Reason: ${pipelineStatus.shortfallNotice.reason}.`}
                        </span>
                        <span className="block text-[11px] text-amber-800 mt-0.5 font-medium">
                          StuDS adheres strictly to source content and will never invent hallucinated or out-of-syllabus MCQs to artificially meet the count.
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Source Limitations Notice */}
                  {studyResources?.sourceLimitations && (
                    <div className="p-3.5 bg-blue-50 border-b border-blue-200 text-blue-900 flex items-start gap-2 text-xs">
                      <span className="font-bold shrink-0">ℹ️ Source Notes:</span>
                      <span>{studyResources.sourceLimitations}</span>
                    </div>
                  )}

                  {/* Feedback Banner */}
                  {resourceFeedback && (
                    <div className={`p-4 text-xs md:text-sm font-semibold flex items-center gap-2.5 border-b ${
                      resourceFeedback.type === 'error'
                        ? 'bg-red-50 text-red-800 border-red-200'
                        : 'bg-emerald-50 text-emerald-900 border-emerald-200'
                    }`}>
                      <span>{resourceFeedback.message}</span>
                    </div>
                  )}

                  {/* Studio Quick Stats - 6 Columns */}
                  <div className="grid grid-cols-2 sm:grid-cols-6 border-b border-slate-200 bg-slate-50/80 text-center divide-x divide-slate-200 text-xs md:text-sm">
                    <div className="p-3">
                      <span className="block font-bold text-slate-900 text-base md:text-lg">{quizQuestions.length}</span>
                      <span className="text-xs text-slate-500 font-medium">MCQ Questions</span>
                    </div>
                    <div className="p-3">
                      <span className="block font-bold text-slate-900 text-base md:text-lg">{studyResources?.shortNotes?.length || 0}</span>
                      <span className="text-xs text-slate-500 font-medium">Short Notes</span>
                    </div>
                    <div className="p-3">
                      <span className="block font-bold text-slate-900 text-base md:text-lg">{studyResources?.importantTopics?.length || 0}</span>
                      <span className="text-xs text-slate-500 font-medium">Important Topics</span>
                    </div>
                    <div className="p-3">
                      <span className="block font-bold text-slate-900 text-base md:text-lg">{studyResources?.keyDefinitions?.length || 0}</span>
                      <span className="text-xs text-slate-500 font-medium">Key Definitions</span>
                    </div>
                    <div className="p-3">
                      <span className="block font-bold text-emerald-700 text-base md:text-lg">{studyResources?.examRevisionNotes ? 'Ready' : 'Pending'}</span>
                      <span className="text-xs text-slate-500 font-medium">Revision Guide</span>
                    </div>
                    <div className="p-3">
                      <span className="block font-bold text-violet-700 text-base md:text-lg">{draftFullNotesMarkdown ? 'Ready' : 'Pending'}</span>
                      <span className="text-xs text-slate-500 font-medium">Full Notes</span>
                    </div>
                  </div>

                  {/* Studio Sub-Navigation Tabs */}
                  <div className="flex border-b border-slate-200 bg-white px-4 overflow-x-auto text-xs md:text-sm font-semibold">
                    <button
                      type="button"
                      onClick={() => setResourceStudioTab('quiz')}
                      className={`py-3.5 px-5 border-b-2 transition-colors flex items-center gap-2.5 shrink-0 ${
                        resourceStudioTab === 'quiz'
                          ? 'border-indigo-600 text-indigo-700 bg-indigo-50/40'
                          : 'border-transparent text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span>🎯 20-MCQ Question Bank</span>
                      <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-2 py-0.5 rounded-full">
                        {quizQuestions.length}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setResourceStudioTab('shortNotes')}
                      className={`py-3.5 px-5 border-b-2 transition-colors flex items-center gap-2.5 shrink-0 ${
                        resourceStudioTab === 'shortNotes'
                          ? 'border-indigo-600 text-indigo-700 bg-indigo-50/40'
                          : 'border-transparent text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span>📌 Short Notes</span>
                      <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2 py-0.5 rounded-full">
                        {studyResources?.shortNotes?.length || 0}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setResourceStudioTab('topics')}
                      className={`py-3.5 px-5 border-b-2 transition-colors flex items-center gap-2.5 shrink-0 ${
                        resourceStudioTab === 'topics'
                          ? 'border-indigo-600 text-indigo-700 bg-indigo-50/40'
                          : 'border-transparent text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span>🏷️ Important Topics</span>
                      <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2 py-0.5 rounded-full">
                        {studyResources?.importantTopics?.length || 0}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setResourceStudioTab('definitions')}
                      className={`py-3.5 px-5 border-b-2 transition-colors flex items-center gap-2.5 shrink-0 ${
                        resourceStudioTab === 'definitions'
                          ? 'border-indigo-600 text-indigo-700 bg-indigo-50/40'
                          : 'border-transparent text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span>📖 Key Definitions</span>
                      <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2 py-0.5 rounded-full">
                        {studyResources?.keyDefinitions?.length || 0}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setResourceStudioTab('revision')}
                      className={`py-3.5 px-5 border-b-2 transition-colors flex items-center gap-2.5 shrink-0 ${
                        resourceStudioTab === 'revision'
                          ? 'border-indigo-600 text-indigo-700 bg-indigo-50/40'
                          : 'border-transparent text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span>📝 Exam Revision Guide</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setResourceStudioTab('fullNotes')}
                      className={`py-3.5 px-5 border-b-2 transition-colors flex items-center gap-2.5 shrink-0 ${
                        resourceStudioTab === 'fullNotes'
                          ? 'border-indigo-600 text-indigo-700 bg-indigo-50/40'
                          : 'border-transparent text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span>📚 Full Notes (Markdown)</span>
                      <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2 py-0.5 rounded-full">
                        {draftFullNotesMarkdown ? 'Draft' : 'Empty'}
                      </span>
                    </button>
                  </div>

                  {/* Tab Panels */}
                  <div className="p-6 bg-slate-50/50">
                    {/* TAB 1: 20-MCQ Question Bank */}
                    {resourceStudioTab === 'quiz' && (
                      <div className="flex flex-col gap-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                          <div>
                            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                              Chapter MCQs ({quizQuestions.length} Questions in Bank)
                            </h4>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Each question has 4 options, 1 correct answer, and an explanation. Correct answers are kept secure on server during student attempts.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={handleAddBlankQuizQuestion}
                            className="px-4 py-2 text-xs md:text-sm font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg shadow-2xs self-start sm:self-auto transition-colors"
                          >
                            + Add Question
                          </button>
                        </div>

                        {quizQuestions.length === 0 ? (
                          <div className="text-center py-12 bg-white border border-dashed border-slate-300 rounded-xl p-8">
                            <p className="text-base font-semibold text-slate-700 mb-1">No MCQs in Question Bank</p>
                            <p className="text-xs md:text-sm text-slate-500 mb-4">Click "Generate AI Resources & 20 MCQs" above to synthesize exactly 20 chapter-specific MCQs from the cleaned notes.</p>
                            <button
                              type="button"
                              onClick={() => handleGenerateResources(false)}
                              disabled={isGeneratingResources}
                              className="px-5 py-2.5 text-xs md:text-sm font-bold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-sm transition-colors"
                            >
                              ⚡ Generate 20 MCQs Now
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-5">
                            {quizQuestions.map((q, qIdx) => (
                              <div key={q._id || qIdx} className="bg-white border border-slate-200 rounded-xl p-5 md:p-6 shadow-2xs flex flex-col gap-4">
                                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                                  <div className="flex flex-wrap items-center gap-2.5">
                                    <span className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-800 text-xs font-bold flex items-center justify-center shrink-0">
                                      {qIdx + 1}
                                    </span>
                                    <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md ${
                                      q.status === 'published' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                                    }`}>
                                      {q.status || 'draft'}
                                    </span>
                                    <div className="flex items-center gap-1.5 ml-2">
                                      <label className="text-[11px] font-bold text-slate-500 uppercase">Difficulty:</label>
                                      <select
                                        value={q.difficulty || 'medium'}
                                        onChange={(e) => handleUpdateQuizQuestion(qIdx, 'difficulty', e.target.value)}
                                        className="text-xs font-medium px-2 py-0.5 border border-slate-300 rounded bg-white text-slate-700"
                                      >
                                        <option value="easy">Easy</option>
                                        <option value="medium">Medium</option>
                                        <option value="hard">Hard</option>
                                      </select>
                                    </div>
                                    {q.isManuallyEdited && (
                                      <span className="text-[10px] font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                                        Edited
                                      </span>
                                    )}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteQuizQuestion(qIdx)}
                                    className="text-xs md:text-sm font-semibold text-red-600 hover:text-red-800 hover:underline"
                                  >
                                    Delete MCQ
                                  </button>
                                </div>

                                {/* Question Text */}
                                <div>
                                  <label className="text-xs font-bold uppercase text-slate-500 mb-1.5 block">Question Text</label>
                                  <input
                                    type="text"
                                    value={q.question}
                                    onChange={(e) => handleUpdateQuizQuestion(qIdx, 'question', e.target.value)}
                                    className="w-full text-sm md:text-base font-semibold px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500 bg-white"
                                    placeholder="Enter question text..."
                                  />
                                </div>

                                {/* Options & Correct Answer Selector */}
                                <div>
                                  <label className="text-xs font-bold uppercase text-slate-500 mb-2 block">
                                    Four Options (Select the Radio for Correct Answer):
                                  </label>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {(q.options || ['', '', '', '']).map((opt, optIdx) => {
                                      const isCorrect = opt && q.correctAnswer === opt;
                                      return (
                                        <div
                                          key={optIdx}
                                          className={`flex items-center gap-2.5 p-3 border rounded-lg transition-colors ${
                                            isCorrect ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-200 bg-white'
                                          }`}
                                        >
                                          <input
                                            type="radio"
                                            name={`correct-${qIdx}`}
                                            checked={Boolean(isCorrect)}
                                            onChange={() => handleUpdateQuizQuestion(qIdx, 'correctAnswer', opt)}
                                            className="w-4.5 h-4.5 text-emerald-600 focus:ring-emerald-500 shrink-0"
                                            title="Mark as correct answer"
                                          />
                                          <span className="text-sm font-bold text-slate-500 w-5">
                                            {String.fromCharCode(65 + optIdx)}.
                                          </span>
                                          <input
                                            type="text"
                                            value={opt}
                                            onChange={(e) => handleUpdateQuizOption(qIdx, optIdx, e.target.value)}
                                            className="flex-1 text-sm px-3 py-1.5 border border-slate-200 rounded-md focus:outline-none focus:border-indigo-500 bg-white"
                                            placeholder={`Option ${optIdx + 1}`}
                                          />
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* Explanation */}
                                <div>
                                  <label className="text-xs font-bold uppercase text-slate-500 mb-1.5 block">
                                    Explanation (Revealed to students only after quiz submission)
                                  </label>
                                  <textarea
                                    rows={3}
                                    value={q.explanation || ''}
                                    onChange={(e) => handleUpdateQuizQuestion(qIdx, 'explanation', e.target.value)}
                                    className="w-full text-xs md:text-sm px-3.5 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500 bg-slate-50/50 leading-relaxed"
                                    placeholder="Add pedagogical explanation for the correct answer..."
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* TAB 2: Short Notes */}
                    {resourceStudioTab === 'shortNotes' && (
                      <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                          <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                            High-Yield Revision Bullets
                          </h4>
                          <span className="text-sm text-slate-500 font-semibold">
                            {studyResources?.shortNotes?.length || 0} Points
                          </span>
                        </div>
                        <div className="flex gap-2.5">
                          <input
                            type="text"
                            placeholder="Add a new short note bullet point..."
                            value={newShortNote}
                            onChange={(e) => setNewShortNote(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleAddShortNoteBullet(newShortNote);
                                setNewShortNote('');
                              }
                            }}
                            className="flex-1 px-4 py-2.5 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-indigo-500 shadow-2xs"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              handleAddShortNoteBullet(newShortNote);
                              setNewShortNote('');
                            }}
                            className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-2xs"
                          >
                            + Add Bullet
                          </button>
                        </div>
                        <div className="flex flex-col gap-2 mt-1">
                          {(studyResources?.shortNotes || []).map((sn, idx) => (
                            <div key={idx} className="flex items-start justify-between gap-4 p-4 bg-white border border-slate-200 rounded-xl text-sm md:text-base shadow-2xs">
                              <div className="flex items-start gap-3">
                                <span className="w-2 h-2 rounded-full bg-indigo-500 mt-2 shrink-0" />
                                <span className="text-slate-800 leading-relaxed font-normal">{sn}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveShortNoteBullet(idx)}
                                className="text-xs md:text-sm font-bold text-red-500 hover:text-red-700 hover:underline shrink-0"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* TAB 3: Important Topics */}
                    {resourceStudioTab === 'topics' && (
                      <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                          <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                            High-Yield Exam Topics
                          </h4>
                          <span className="text-sm text-slate-500 font-semibold">
                            {studyResources?.importantTopics?.length || 0} Topics
                          </span>
                        </div>
                        <div className="flex gap-2.5">
                          <input
                            type="text"
                            placeholder="e.g. OSI 7-Layer Architecture and Functions"
                            value={newTopicInput}
                            onChange={(e) => setNewTopicInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddTopic()}
                            className="flex-1 px-4 py-2.5 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-indigo-500 shadow-2xs"
                          />
                          <button
                            type="button"
                            onClick={handleAddTopic}
                            className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 shadow-2xs"
                          >
                            + Add Topic
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2.5 mt-2">
                          {(studyResources?.importantTopics || []).map((t, idx) => (
                            <div key={idx} className="flex items-center gap-2.5 px-4 py-2 bg-indigo-50 border border-indigo-200 rounded-xl text-sm md:text-base font-semibold text-indigo-900 shadow-2xs">
                              <span>⭐ {t}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveTopic(idx)}
                                className="text-indigo-400 hover:text-red-600 ml-1 font-bold text-base"
                              >
                                &times;
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* TAB 4: Key Definitions */}
                    {resourceStudioTab === 'definitions' && (
                      <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                          <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                            Key Definitions & Core Terminology
                          </h4>
                          <span className="text-sm text-slate-500 font-semibold">
                            {studyResources?.keyDefinitions?.length || 0} Definitions
                          </span>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row gap-3 shadow-2xs">
                          <input
                            type="text"
                            placeholder="Term (e.g. Bandwidth)"
                            value={newDefTermInput}
                            onChange={(e) => setNewDefTermInput(e.target.value)}
                            className="w-full md:w-1/3 px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg font-semibold"
                          />
                          <input
                            type="text"
                            placeholder="Definition / Explanation..."
                            value={newDefDescInput}
                            onChange={(e) => setNewDefDescInput(e.target.value)}
                            className="w-full md:w-1/2 px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={handleAddDefinition}
                            className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 shadow-2xs"
                          >
                            Add Definition
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mt-1">
                          {(studyResources?.keyDefinitions || []).map((def, idx) => (
                            <div key={idx} className="bg-white border border-slate-200 rounded-xl p-4.5 text-sm flex flex-col justify-between shadow-2xs">
                              <div>
                                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                                  <span className="font-bold text-base text-slate-900">{def.term}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveDefinition(idx)}
                                    className="text-red-500 hover:text-red-700 text-xs font-bold"
                                  >
                                    Remove
                                  </button>
                                </div>
                                <p className="text-slate-600 leading-relaxed text-sm md:text-base">{def.definition}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* TAB 5: Exam Revision Notes */}
                    {resourceStudioTab === 'revision' && (
                      <div className="flex flex-col gap-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
                          <div>
                            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                              Comprehensive Exam Revision Notes
                            </h4>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Structured chapter summary, high-yield comparison tables, and quick formulas for exam night.
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setIsEditingRevisionNotes(!isEditingRevisionNotes)}
                              className="px-4 py-2 text-xs md:text-sm font-semibold bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 shadow-2xs"
                            >
                              {isEditingRevisionNotes ? 'Preview Rendered Markdown' : 'Edit Markdown'}
                            </button>
                          </div>
                        </div>

                        {isEditingRevisionNotes ? (
                          <textarea
                            rows={18}
                            value={studyResources?.examRevisionNotes || ''}
                            onChange={(e) => setStudyResources({ ...studyResources, examRevisionNotes: e.target.value })}
                            className="w-full text-sm md:text-base font-mono p-4 border border-slate-300 rounded-xl bg-white leading-relaxed shadow-inner"
                            placeholder="Write or edit exam revision guide in Markdown..."
                          />
                        ) : (
                          <div className="border border-slate-200 rounded-xl p-6 sm:p-8 bg-white text-slate-800 text-base md:text-[17px] leading-[1.65] max-h-[640px] overflow-y-auto markdown-content shadow-inner">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {studyResources?.examRevisionNotes || '*No exam revision notes generated yet.*'}
                            </ReactMarkdown>
                          </div>
                        )}
                      </div>
                    )}

                    {/* TAB 6: Full-Text Comprehensive Notes (Markdown) */}
                    {resourceStudioTab === 'fullNotes' && (
                      <div className="flex flex-col gap-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
                          <div>
                            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                              Comprehensive Chapter Textbook Notes (Markdown)
                            </h4>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Extracted and structured chapter synthesis from the source PDF. Formatted with GitHub-Flavored Markdown tables, formulas, and diagrams.
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setIsEditingFullNotes(!isEditingFullNotes)}
                              className="px-4 py-2 text-xs md:text-sm font-semibold bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 shadow-2xs"
                            >
                              {isEditingFullNotes ? 'Preview Rendered Markdown' : 'Edit Markdown'}
                            </button>
                          </div>
                        </div>

                        {isEditingFullNotes ? (
                          <textarea
                            rows={20}
                            value={draftFullNotesMarkdown || ''}
                            onChange={(e) => setDraftFullNotesMarkdown(e.target.value)}
                            className="w-full text-sm md:text-base font-mono p-4 border border-slate-300 rounded-xl bg-white leading-relaxed shadow-inner"
                            placeholder="Write or edit full textbook chapter notes in Markdown..."
                          />
                        ) : (
                          <div className="border border-slate-200 rounded-xl p-6 sm:p-8 bg-white text-slate-800 text-base md:text-[17px] leading-[1.65] max-h-[640px] overflow-y-auto markdown-content shadow-inner">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {draftFullNotesMarkdown || '*No full textbook notes generated yet. Click "⚡ Generate Missing Resources" or "⚙️ Regenerate..." above.*'}
                            </ReactMarkdown>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Selective Regeneration Confirmation Modal */}
                {showRegenModal && (
                  <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">⚙️</span>
                          <h3 className="text-base font-bold text-slate-900">Selective Resource Regeneration</h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowRegenModal(false)}
                          className="text-slate-400 hover:text-slate-600 font-bold text-xl px-2 py-0.5"
                        >
                          &times;
                        </button>
                      </div>

                      <div className="py-4 text-xs md:text-sm text-slate-600 flex flex-col gap-3">
                        <p className="text-slate-700 leading-relaxed font-medium">
                          Select which learning resources to regenerate from the uploaded PDF:
                        </p>
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs leading-relaxed">
                          <strong className="block font-bold mb-0.5">Content-Preservation Safety Rule:</strong>
                          Regeneration runs exclusively in a separate staging draft. Any approved content currently published to students remains completely untouched until you review the generated draft and explicitly click &ldquo;Approve & Publish&rdquo;.
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                          {[
                            { id: 'fullNotes', label: 'Full Notes (Markdown)' },
                            { id: 'shortNotes', label: 'Short Notes (Bullet Points)' },
                            { id: 'importantTopics', label: 'Important Exam Topics' },
                            { id: 'keyDefinitions', label: 'Key Definitions' },
                            { id: 'examRevisionNotes', label: 'Exam Revision Guide' },
                            { id: 'quizQuestions', label: '20-MCQ Question Bank' }
                          ].map((item) => {
                            const isChecked = customGenTargets.includes(item.id);
                            return (
                              <label
                                key={item.id}
                                className={`flex items-center gap-2 p-2.5 border rounded-lg cursor-pointer transition-colors text-xs font-semibold ${
                                  isChecked ? 'border-indigo-400 bg-indigo-50/50 text-indigo-900' : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setCustomGenTargets([...customGenTargets, item.id]);
                                    } else {
                                      setCustomGenTargets(customGenTargets.filter(t => t !== item.id));
                                    }
                                  }}
                                  className="w-4 h-4 text-indigo-600 rounded"
                                />
                                <span>{item.label}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => setShowRegenModal(false)}
                          className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={customGenTargets.length === 0 || isGeneratingResources}
                          onClick={() => {
                            setShowRegenModal(false);
                            handleGenerateResources('selective', true, customGenTargets);
                          }}
                          className="px-5 py-2.5 text-xs md:text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm transition-colors disabled:opacity-40"
                        >
                          {isGeneratingResources ? 'Generating...' : `Regenerate Selected (${customGenTargets.length})`}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Module C: PYQs */}
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
