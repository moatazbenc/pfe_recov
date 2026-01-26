// src/pages/Register.jsx
// Register new user (HR only) – calls /api/auth/register

import React, { useState } from 'react';
import { useAuth } from '../components/AuthContext';

// Use same base URL logic as Login/AuthContext
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Collaborator'); // default example
  const [team, setTeam] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { user } = useAuth(); // not strictly needed, but handy for debugging

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('You are not logged in');
      }

      const body = {
        name,
        email,
        password,
        role,
        team: team || undefined, // omit if empty
      };

      const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      // Read raw text first so we don’t crash on empty/non‑JSON response
      const text = await res.text();
      let data = null;

      if (text) {
        try {
          data = JSON.parse(text);
        } catch (parseErr) {
          console.error('Failed to parse register response as JSON:', text);
          throw new Error('Server returned invalid response');
        }
      }

      if (!res.ok || !data || !data.success) {
        const message =
          (data && data.message) ||
          `Registration failed (status ${res.status})`;
        throw new Error(message);
      }

      // Success
      setSuccess('User registered successfully');
      setName('');
      setEmail('');
      setPassword('');
      setTeam('');

      // keep role as is, or reset if you want:
      // setRole('Collaborator');
    } catch (err) {
      console.error('Register error:', err);
      setError(err.message || 'Something went wrong');
    }
  };

  return (
    <div style={{ maxWidth: 500, margin: '2rem auto' }}>
      <h2>Register New User (HR only)</h2>

      {user && (
        <p style={{ fontSize: '0.9rem', color: '#555' }}>
          Logged in as: {user.email} ({user.role})
        </p>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block' }}>Name:</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={{ width: '100%' }}
          />
        </div>

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

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block' }}>Role:</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            style={{ width: '100%' }}
          >
            {/* adjust these to match what your backend allows */}
            <option value="HR">HR</option>
            <option value="Collaborator">Collaborator</option>
            <option value="Manager">Manager</option>
            <option value="Employee">Employee</option>
            <option value="Admin">Admin</option>
          </select>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block' }}>Team (optional):</label>
          <input
            type="text"
            value={team}
            onChange={(e) => setTeam(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>

        {error && (
          <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>
        )}
        {success && (
          <div style={{ color: 'green', marginBottom: '1rem' }}>
            {success}
          </div>
        )}

        <button type="submit">Register</button>
      </form>
    </div>
  );
};

export default Register;