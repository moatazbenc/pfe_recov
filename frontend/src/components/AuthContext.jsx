// src/components/AuthContext.jsx
// Auth context for user authentication and role management
// Provides user info and login/logout helpers to the app

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
} from 'react';

const AuthContext = createContext(null);

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch current user on mount
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.log('[Auth] No token found, user is not authenticated');
        setLoading(false);
        return;
      }

      console.log('[Auth] Token found, verifying with server...');

      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        const text = await res.text();
        const data = text ? JSON.parse(text) : null;

        console.log('[Auth] Server response:', res.status, data);

        if (!res.ok || !data?.success) {
          console.warn('[Auth] Token invalid or expired');
          localStorage.removeItem('token');
          setUser(null);
        } else {
          console.log('[Auth] User authenticated:', data.user?.name, 'Role:', data.user?.role);
          setUser(data.user);
        }
      } catch (err) {
        console.error('[Auth] Error verifying token:', err);
        localStorage.removeItem('token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, []);

  // Login handler
  const login = (userData, token) => {
    console.log('[Auth] Login:', userData?.name, 'Role:', userData?.role);
    localStorage.setItem('token', token);
    setUser(userData);
  };

  // Logout handler
  const logout = () => {
    console.log('[Auth] Logout');
    localStorage.removeItem('token');
    setUser(null);
  };

  // Get current token
  const getToken = () => {
    return localStorage.getItem('token');
  };

  const value = {
    user,
    loading,
    login,
    logout,
    getToken,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}