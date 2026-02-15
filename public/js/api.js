const API_BASE = window.location.origin + '/api';

// API helper functions
async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }

    return data;
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}

// Auth API
const authAPI = {
  register: (username, password) =>
    apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    }),

  login: (username, password) =>
    apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    })
};

// Stations API
const stationsAPI = {
  getAll: (search = '', genre = '') => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (genre) params.append('genre', genre);
    return apiRequest(`/stations?${params.toString()}`);
  },

  getById: (id) => apiRequest(`/stations/${id}`),

  create: (stationData) =>
    apiRequest('/stations', {
      method: 'POST',
      body: JSON.stringify(stationData)
    }),

  update: (id, stationData) =>
    apiRequest(`/stations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(stationData)
    }),

  delete: (id) =>
    apiRequest(`/stations/${id}`, {
      method: 'DELETE'
    })
};

// Broadcasts API
const broadcastsAPI = {
  getSegments: (stationId) => apiRequest(`/broadcasts/${stationId}`),

  addSegment: (stationId, type, config, position) =>
    apiRequest(`/broadcasts/${stationId}`, {
      method: 'POST',
      body: JSON.stringify({ type, config, position })
    }),

  updateSegment: (stationId, segmentId, config, position) =>
    apiRequest(`/broadcasts/${stationId}/${segmentId}`, {
      method: 'PUT',
      body: JSON.stringify({ config, position })
    }),

  deleteSegment: (stationId, segmentId) =>
    apiRequest(`/broadcasts/${stationId}/${segmentId}`, {
      method: 'DELETE'
    }),

  reorderSegments: (stationId, segmentIds) =>
    apiRequest(`/broadcasts/${stationId}/reorder`, {
      method: 'POST',
      body: JSON.stringify({ segmentIds })
    })
};
