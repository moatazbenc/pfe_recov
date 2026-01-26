// src/api/teams.js
// API service for team CRUD operations
// Robust version with comprehensive error handling

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

/**
 * Get auth headers with JWT token
 */
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    console.warn('[API] No auth token found in localStorage');
  }
  
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

/**
 * Handle API response - parse JSON and handle errors
 */
const handleResponse = async (res, endpoint) => {
  console.log(`[API] ${endpoint} - Status: ${res.status}`);
  
  // Handle non-JSON responses
  const contentType = res.headers.get('content-type');
  
  let data;
  try {
    const text = await res.text();
    data = text ? JSON.parse(text) : {};
  } catch (parseError) {
    console.error(`[API] ${endpoint} - Failed to parse response:`, parseError);
    const error = new Error('Invalid response from server');
    error.status = res.status;
    throw error;
  }
  
  console.log(`[API] ${endpoint} - Response:`, data);
  
  if (!res.ok) {
    const error = new Error(data.message || `Request failed with status ${res.status}`);
    error.status = res.status;
    error.data = data;
    throw error;
  }
  
  if (data.success === false) {
    const error = new Error(data.message || 'Operation failed');
    error.status = res.status;
    error.data = data;
    throw error;
  }
  
  return data;
};

/**
 * Make API request with error handling
 */
const makeRequest = async (url, options, endpoint) => {
  try {
    console.log(`[API] ${endpoint} - Requesting: ${url}`);
    const res = await fetch(url, options);
    return handleResponse(res, endpoint);
  } catch (err) {
    // Network error (server not reachable)
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      console.error(`[API] ${endpoint} - Network error:`, err.message);
      const networkError = new Error(
        `Cannot connect to server. Please ensure the backend is running on ${API_BASE_URL}`
      );
      networkError.status = 0;
      networkError.isNetworkError = true;
      throw networkError;
    }
    throw err;
  }
};

/**
 * Fetch all teams
 * GET /api/teams
 */
export const fetchTeams = async () => {
  const endpoint = 'GET /api/teams';
  const url = `${API_BASE_URL}/api/teams`;
  
  return makeRequest(
    url,
    {
      method: 'GET',
      headers: getAuthHeaders(),
    },
    endpoint
  );
};

/**
 * Fetch single team by ID
 * GET /api/teams/:id
 */
export const fetchTeamById = async (id) => {
  const endpoint = `GET /api/teams/${id}`;
  const url = `${API_BASE_URL}/api/teams/${id}`;
  
  return makeRequest(
    url,
    {
      method: 'GET',
      headers: getAuthHeaders(),
    },
    endpoint
  );
};

/**
 * Create a new team
 * POST /api/teams
 * @param {Object} teamData - { name, manager, collaborators }
 */
export const createTeam = async (teamData) => {
  const endpoint = 'POST /api/teams';
  const url = `${API_BASE_URL}/api/teams`;
  
  console.log(`[API] ${endpoint} - Payload:`, teamData);
  
  return makeRequest(
    url,
    {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(teamData),
    },
    endpoint
  );
};

/**
 * Update an existing team
 * PUT /api/teams/:id
 * @param {string} id - Team ID
 * @param {Object} teamData - { name, manager, collaborators }
 */
export const updateTeam = async (id, teamData) => {
  const endpoint = `PUT /api/teams/${id}`;
  const url = `${API_BASE_URL}/api/teams/${id}`;
  
  console.log(`[API] ${endpoint} - Payload:`, teamData);
  
  return makeRequest(
    url,
    {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(teamData),
    },
    endpoint
  );
};

/**
 * Delete a team
 * DELETE /api/teams/:id
 * @param {string} id - Team ID
 */
export const deleteTeam = async (id) => {
  const endpoint = `DELETE /api/teams/${id}`;
  const url = `${API_BASE_URL}/api/teams/${id}`;
  
  return makeRequest(
    url,
    {
      method: 'DELETE',
      headers: getAuthHeaders(),
    },
    endpoint
  );
};