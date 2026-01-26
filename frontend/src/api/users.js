  // src/api/users.js
  // API service for fetching users (for team dropdowns)

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

  /**
   * Get auth headers with JWT token
   */
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
    };
  };

  /**
   * Handle API response
   */
  const handleResponse = async (res) => {
    const data = await res.json();
    
    if (!res.ok || !data.success) {
      const error = new Error(data.message || 'An error occurred');
      error.status = res.status;
      throw error;
    }
    
    return data;
  };

  /**
   * Fetch all managers
   * GET /api/users/managers
   */
  export const fetchManagers = async () => {
    const res = await fetch(`${API_BASE_URL}/api/users/managers`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  };

  /**
   * Fetch all collaborators
   * GET /api/users/collaborators
   */
  export const fetchCollaborators = async () => {
    const res = await fetch(`${API_BASE_URL}/api/users/collaborators`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  };

  /**
   * Fetch users by role(s)
   * GET /api/users?role=Manager,Collaborator
   * @param {string|string[]} roles - Role or array of roles
   */
  export const fetchUsersByRole = async (roles) => {
    const roleParam = Array.isArray(roles) ? roles.join(',') : roles;
    const res = await fetch(`${API_BASE_URL}/api/users?role=${roleParam}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  };