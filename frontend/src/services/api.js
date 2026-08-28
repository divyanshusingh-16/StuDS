const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

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

export const globalSearch = async (query) => {
  const res = await apiFetch(`/search?q=${encodeURIComponent(query)}`);
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
