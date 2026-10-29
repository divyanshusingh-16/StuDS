const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export const normalizePdfUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  // If already an external cloud URL (e.g. Cloudinary, S3), keep as-is
  if (/^https?:\/\/(?!localhost|127\.0\.0\.1)/i.test(trimmed)) {
    return trimmed;
  }

  // If pointing to localhost / 127.0.0.1
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(trimmed)) {
    const path = trimmed.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/, '');
    const cleanPath = path.startsWith('/') ? path : `/${path}`;

    // When deployed in production (e.g. https://stu-ds.vercel.app or any non-localhost host)
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      return cleanPath;
    }
    return trimmed;
  }

  // If relative path like /uploads/...
  if (trimmed.startsWith('/')) {
    return trimmed;
  }

  return trimmed;
};

const apiFetch = (path, options = {}) => fetch(`${BASE_URL}${path}`, {
  credentials: 'include',
  ...options,
});

export const fetchSubjectsBySemester = async (semester, course) => {
  const query = course ? `?course=${encodeURIComponent(course)}` : '';
  const res = await apiFetch(`/subjects/${semester}${query}`);
  if (!res.ok) throw new Error('Failed to fetch subjects');
  return res.json();
};

export const fetchUnitsBySubject = async (subjectId) => {
  const res = await apiFetch(`/units/${subjectId}`);
  if (!res.ok) throw new Error('Failed to fetch units');
  return res.json();
};

export const fetchContentByChapter = async (chapterId) => {
  const res = await apiFetch(`/content/${chapterId}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Failed to fetch content');
  return res.json();
};

// Admin wrappers
export const addSubject = async (subjectData) => {
  const res = await apiFetch('/admin/subject', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(subjectData),
  });
  if (!res.ok) throw new Error('Failed to add subject');
  return res.json();
};

export const addUnit = async (unitData) => {
  const res = await apiFetch('/admin/unit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(unitData),
  });
  if (!res.ok) throw new Error('Failed to add unit');
  return res.json();
};

export const upsertContent = async (contentData) => {
  const res = await apiFetch('/admin/content/upsert', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(contentData),
  });
  if (!res.ok) throw new Error('Failed to upsert content');
  return res.json();
};

export const fetchNotes = async (chapterId) => {
  const res = await apiFetch(`/admin/content/${chapterId}/notes`);
  if (!res.ok) throw new Error('Failed to fetch notes');
  return res.json();
};

export const createNote = async (chapterId, noteData) => {
  const res = await apiFetch(`/admin/content/${chapterId}/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(noteData),
  });
  if (!res.ok) throw new Error('Failed to create note');
  return res.json();
};

export const updateNote = async (chapterId, noteId, noteData) => {
  const res = await apiFetch(`/admin/content/${chapterId}/notes/${noteId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(noteData),
  });
  if (!res.ok) throw new Error('Failed to update note');
  return res.json();
};

export const deleteNote = async (chapterId, noteId) => {
  const res = await apiFetch(`/admin/content/${chapterId}/notes/${noteId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete note');
  return res.json();
};

export const uploadPdfFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const res = await apiFetch('/admin/upload-pdf', {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to upload PDF');
  }
  return res.json();
};

export const uploadNotesPdf = async (file, oldPublicId = '', oldFileUrl = '') => {
  const formData = new FormData();
  formData.append('file', file);
  if (oldPublicId) formData.append('oldPublicId', oldPublicId);
  if (oldFileUrl) formData.append('oldFileUrl', oldFileUrl);
  
  const res = await apiFetch('/admin/upload-notes-pdf', {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to upload notes PDF');
  }
  return res.json();
};

export const uploadDocumentFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const res = await apiFetch('/admin/upload-document', {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to upload document');
  }
  return res.json();
};

export const loginAdmin = async (email, password) => {
  const res = await apiFetch('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Login failed');
  }
  return res.json();
};

// Student self-registration — backend enforces 'student' role server-side
export const registerStudent = async (email, password) => {
  const res = await apiFetch('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Registration failed');
  return data;
};

// Student login (same endpoint as admin — unified login, role comes from server)
export const loginStudent = async (email, password) => {
  const res = await apiFetch('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Login failed');
  return data;
};

export const getCurrentUser = async () => {
  const res = await apiFetch('/auth/me');
  if (res.status === 401) return null;
  if (!res.ok) throw new Error('Failed to verify authentication');
  return res.json();
};

export const logoutAdmin = async () => {
  const res = await apiFetch('/auth/logout', { method: 'POST' });
  if (!res.ok && res.status !== 401) throw new Error('Logout failed');
};

export const logoutStudent = logoutAdmin;

export const globalSearch = async (query, semester = null) => {
  const semParam = semester ? `&semester=${encodeURIComponent(semester)}` : '';
  const res = await apiFetch(`/search?q=${encodeURIComponent(query)}${semParam}`);
  if (!res.ok) throw new Error('Search failed');
  return res.json();
};

export const generateAiSummary = async (chapterContentMarkdown) => {
  const res = await apiFetch('/admin/generate-summary', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ chapterContentMarkdown }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'AI summary generation failed');
  return data.summary;
};

export const extractPdfText = async (chapterId, noteId) => {
  const res = await apiFetch('/admin/extract-pdf-text', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chapterId, noteId }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'PDF text extraction failed');
  return data;
};

export const cleanExtractedText = async (chapterId, noteId, rawText = undefined) => {
  const res = await apiFetch('/admin/clean-extracted-text', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chapterId, noteId, rawText }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Notes cleaning failed');
  return data;
};

export const fetchStudyResources = async (chapterId) => {
  const res = await apiFetch(`/admin/content/${chapterId}/study-resources`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Failed to fetch study resources');
  return data;
};

export const generateStudyResources = async (chapterId, forceRegenerate = false, noteId = undefined) => {
  const res = await apiFetch(`/admin/content/${chapterId}/study-resources/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chapterId, forceRegenerate, noteId }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Failed to generate study resources');
  return data;
};

export const updateStudyResources = async (chapterId, payload) => {
  const res = await apiFetch(`/admin/content/${chapterId}/study-resources`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Failed to update study resources');
  return data;
};

export const fetchPipelineStatus = async (chapterId) => {
  const res = await apiFetch(`/admin/content/${chapterId}/pipeline/status`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Failed to fetch pipeline status');
  return data;
};

export const runPipelineGenerate = async (chapterId, payload = {}) => {
  const res = await apiFetch(`/admin/content/${chapterId}/pipeline/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Pipeline generation failed');
  return data;
};

export const runPipelineRetry = async (chapterId, noteId = undefined) => {
  const res = await apiFetch(`/admin/content/${chapterId}/pipeline/retry`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ noteId }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Pipeline retry failed');
  return data;
};

export const updateDraftResources = async (chapterId, draftPayload) => {
  const res = await apiFetch(`/admin/content/${chapterId}/draft`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(draftPayload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Failed to save draft');
  return data;
};

export const publishPipelineResources = async (chapterId) => {
  const res = await apiFetch(`/admin/content/${chapterId}/pipeline/publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Failed to publish resources');
  return data;
};

export const fetchQuizAttempt = async (chapterId) => {
  const res = await apiFetch(`/quiz/${chapterId}/attempt`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Failed to start quiz attempt');
  return data;
};

export const submitQuizAnswers = async (chapterId, attemptId, answers) => {
  const res = await apiFetch(`/quiz/${chapterId}/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ attemptId, answers }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Failed to submit quiz');
  return data;
};

export const askChapterDoubt = async (chapterId, question, history = []) => {
  const res = await apiFetch('/doubt/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chapterId, question, history }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Failed to submit question to AI Doubt Solver');
  return data;
};

export const fetchChapterRagStatus = async (chapterId) => {
  const res = await apiFetch(`/doubt/status/${chapterId}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { isIndexed: false, chunkCount: 0 };
  return data;
};


