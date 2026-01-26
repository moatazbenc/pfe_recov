import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Teams from './pages/Teams';
import Objectives from './pages/Objectives';
import EvaluationCalendar from './pages/EvaluationCalendar';
import HRDecisions from './pages/HRDecisions';
import KPI from './pages/KPI';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './components/AuthContext';

import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <div style={{ padding: '2rem' }}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/register" element={<ProtectedRoute roles={['HR']}><Register /></ProtectedRoute>} />
            <Route path="/teams" element={<ProtectedRoute roles={['HR', 'Manager']}><Teams /></ProtectedRoute>} />
            <Route path="/objectives" element={<ProtectedRoute><Objectives /></ProtectedRoute>} />
            <Route path="/evaluations" element={<ProtectedRoute><EvaluationCalendar /></ProtectedRoute>} />
            <Route path="/hrdecisions" element={<ProtectedRoute roles={['HR']}><HRDecisions /></ProtectedRoute>} />
            <Route path="/kpi" element={<ProtectedRoute><KPI /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;