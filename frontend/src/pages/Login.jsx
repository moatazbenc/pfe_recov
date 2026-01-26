// src/pages/Login.jsx
// Login page for HR system
// Handles user login and JWT storage

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';

// Same base URL logic as in AuthContext
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      // Read raw text first to avoid crashing if response is not JSON
      const text = await res.text();
      let data = null;

      if (text) {
        try {
          data = JSON.parse(text);
        } catch (parseErr) {
          console.error('Failed to parse login response as JSON:', text);
          throw new Error('Server returned invalid response');
        }
      }

      if (!res.ok || !data || !data.success) {
        const message =
          (data && data.message) ||
          `Login failed (status ${res.status})`;
        throw new Error(message);
      }

      // success
      login(data.user, data.token);
      navigate('/');
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Something went wrong');
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '2rem auto' }}>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block' }}>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block' }}>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%' }}
          />
        </div>

        {error && (
          <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>
        )}

        <button type="submit">Login</button>
      </form>
    </div>
  );
};

export default Login;