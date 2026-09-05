const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const message = error.error || `API error: ${response.status}`;
    throw new Error(`${response.status} ${message}`);
  }
  return response.status === 204 ? null : response.json();
};

const fetchJson = (url, options = {}) => {
  const baseOptions = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    }
  };
  const merged = {
    ...baseOptions,
    ...options,
    headers: {
      ...baseOptions.headers,
      ...(options.headers || {})
    }
  };
  return fetch(url, merged).then(handleResponse);
};

export const apiClient = {
  getProblems: () =>
    fetchJson(`${API_URL}/problems`),

  getProblem: (id) =>
    fetchJson(`${API_URL}/problems/${id}`),

  createProblem: (data) =>
    fetchJson(`${API_URL}/problems`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  updateProblem: (id, data) =>
    fetchJson(`${API_URL}/problems/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),

  deleteProblem: (id) =>
    fetchJson(`${API_URL}/problems/${id}`, { method: 'DELETE' }),

  getSubmissionsByUser: (userId) =>
    fetchJson(`${API_URL}/submissions/user/${userId}`),

  getSubmissionsByProblem: (problemId) =>
    fetchJson(`${API_URL}/submissions/problemset/${problemId}`),

  getSubmission: (id) =>
    fetchJson(`${API_URL}/submissions/${id}`),

  createSubmission: (data) =>
    fetchJson(`${API_URL}/submissions`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  testSubmit: (data) =>
    fetchJson(`${API_URL}/submissions/test-submit`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  updateSubmission: (id, data) =>
    fetchJson(`${API_URL}/submissions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  deleteSubmission: (id) =>
    fetchJson(`${API_URL}/submissions/${id}`, { method: 'DELETE' }),

  getUsers: () =>
    fetchJson(`${API_URL}/users`),

  getUser: (id) =>
    fetchJson(`${API_URL}/users/${id}`),

  createUser: (data) =>
    fetchJson(`${API_URL}/users`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  updateUser: (id, data) =>
    fetchJson(`${API_URL}/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),

  deleteUser: (id) =>
    fetchJson(`${API_URL}/users/${id}`, { method: 'DELETE' }),

  login: (data) =>
    fetchJson(`${API_URL}/auth/login`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  register: (data) =>
    fetchJson(`${API_URL}/auth/register`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  getContests: () =>
    fetchJson(`${API_URL}/contests`),

  createContest: (data) =>
    fetchJson(`${API_URL}/contests`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  getContest: (id) =>
    fetchJson(`${API_URL}/contests/${id}`),

  getBlogs: () =>
    fetchJson(`${API_URL}/blogs`),

  getBlog: (id) =>
    fetchJson(`${API_URL}/blogs/${id}`),

  createBlog: (data) =>
    fetchJson(`${API_URL}/blogs`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  healthCheck: () =>
    fetchJson(`${API_URL}/health`),

  executeCode: (code, language = 'javascript', input = '') =>
    fetchJson(`${API_URL}/execute`, {
      method: 'POST',
      body: JSON.stringify({ code, language, input })
    }),

  getCurrentUser: () =>
    fetchJson(`${API_URL}/auth/me`),

  logout: () =>
    fetchJson(`${API_URL}/auth/logout`, {
      method: 'POST'
    })
};

export default apiClient;
