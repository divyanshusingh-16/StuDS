const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const fetchSubjectsBySemester = async (semester, course) => {
  const query = course ? `?course=${encodeURIComponent(course)}` : '';
  const res = await fetch(`${BASE_URL}/subjects/${semester}${query}`);
  if (!res.ok) throw new Error('Failed to fetch subjects');
  return res.json();
};

export const fetchUnitsBySubject = async (subjectId) => {
  const res = await fetch(`${BASE_URL}/units/${subjectId}`);
  if (!res.ok) throw new Error('Failed to fetch units');
  return res.json();
};

export const fetchContentByChapter = async (chapterId) => {
  const res = await fetch(`${BASE_URL}/content/${chapterId}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Failed to fetch content');
  return res.json();
};

// Admin wrappers
export const addSubject = async (subjectData, adminSecret) => {
  const res = await fetch(`${BASE_URL}/admin/subject`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-auth': adminSecret,
    },
    body: JSON.stringify(subjectData),
  });
  if (!res.ok) throw new Error('Failed to add subject');
  return res.json();
};

export const addUnit = async (unitData, adminSecret) => {
  const res = await fetch(`${BASE_URL}/admin/unit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-auth': adminSecret,
    },
    body: JSON.stringify(unitData),
  });
  if (!res.ok) throw new Error('Failed to add unit');
  return res.json();
};

export const upsertContent = async (contentData, adminSecret) => {
  const res = await fetch(`${BASE_URL}/admin/content/upsert`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-auth': adminSecret,
    },
    body: JSON.stringify(contentData),
  });
  if (!res.ok) throw new Error('Failed to upsert content');
  return res.json();
};

export const uploadPdfFile = async (file, adminSecret) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const res = await fetch(`${BASE_URL}/admin/upload-pdf`, {
    method: 'POST',
    headers: {
      'x-admin-auth': adminSecret,
    },
    body: formData,
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to upload PDF');
  }
  return res.json();
};

export const loginAdmin = async (passcode) => {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ passcode }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Login failed');
  }
  return res.json();
};

export const globalSearch = async (query) => {
  const res = await fetch(`${BASE_URL}/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error('Search failed');
  return res.json();
};

export const generateAiSummary = async (chapterContentMarkdown, adminSecret) => {
  const res = await fetch(`${BASE_URL}/admin/generate-summary`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-auth': adminSecret,
    },
    body: JSON.stringify({ chapterContentMarkdown }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'AI summary generation failed');
  return data.summary;
};
