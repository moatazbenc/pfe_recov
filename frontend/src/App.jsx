import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './components/AuthContext';
import { ThemeProvider } from './components/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Cycles from './pages/Cycles';
import Evaluations from './pages/Evaluations';
import Validation from './pages/Validation';
import HRDecisions from './pages/HRDecisions';
import Teams from './pages/Teams';
import Users from './pages/Users';
import Settings from './pages/Settings';
import GoalsPage from './pages/GoalsPage';
import MeetingsPage from './pages/MeetingsPage';
import FeedbackPage from './pages/FeedbackPage';
import RecognitionPage from './pages/RecognitionPage';
import TasksPage from './pages/TasksPage';
import SurveysPage from './pages/SurveysPage';
import ReviewsPage from './pages/ReviewsPage';
import CareerPage from './pages/CareerPage';
import AnalyticsPage from './pages/AnalyticsPage';
import TeamFeed from './pages/TeamFeed';
import MyTeamPage from './pages/MyTeamPage';
// AI Assistant intentionally removed from the application

import './App.css';
import './premium.css';

// Role-gated route: redirects to /dashboard if user lacks required role
function RoleRoute({ allowedRoles, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout><Dashboard /></DashboardLayout></ProtectedRoute>} />
          <Route path="/feed" element={<ProtectedRoute><DashboardLayout><TeamFeed /></DashboardLayout></ProtectedRoute>} />
          {/* AI Assistant route intentionally removed */}
          <Route path="/my-team" element={<ProtectedRoute><DashboardLayout><MyTeamPage /></DashboardLayout></ProtectedRoute>} />
          <Route path="/cycles" element={<ProtectedRoute><DashboardLayout><Cycles /></DashboardLayout></ProtectedRoute>} />
          <Route path="/objectives" element={<Navigate to="/goals" replace />} />
          <Route path="/goals" element={<ProtectedRoute><DashboardLayout><GoalsPage /></DashboardLayout></ProtectedRoute>} />
          <Route path="/evaluations" element={<ProtectedRoute><DashboardLayout><Evaluations /></DashboardLayout></ProtectedRoute>} />
          <Route path="/validation" element={<ProtectedRoute><DashboardLayout><Validation /></DashboardLayout></ProtectedRoute>} />
          <Route path="/hr-decisions" element={<ProtectedRoute><DashboardLayout><HRDecisions /></DashboardLayout></ProtectedRoute>} />
          {/* Teams: only accessible to ADMIN, HR, TEAM_LEADER — collaborators are redirected */}
          <Route path="/teams" element={
            <ProtectedRoute>
              <DashboardLayout>
                <RoleRoute allowedRoles={['ADMIN', 'HR', 'TEAM_LEADER']}>
                  <Teams />
                </RoleRoute>
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/users" element={<ProtectedRoute><DashboardLayout><Users /></DashboardLayout></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><DashboardLayout><Settings /></DashboardLayout></ProtectedRoute>} />
          <Route path="/meetings" element={<ProtectedRoute><DashboardLayout><MeetingsPage /></DashboardLayout></ProtectedRoute>} />
          <Route path="/feedback" element={<ProtectedRoute><DashboardLayout><FeedbackPage /></DashboardLayout></ProtectedRoute>} />
          <Route path="/recognition" element={<ProtectedRoute><DashboardLayout><RecognitionPage /></DashboardLayout></ProtectedRoute>} />
          <Route path="/tasks" element={<ProtectedRoute><DashboardLayout><TasksPage /></DashboardLayout></ProtectedRoute>} />
          <Route path="/surveys" element={<ProtectedRoute><DashboardLayout><SurveysPage /></DashboardLayout></ProtectedRoute>} />
          <Route path="/reviews" element={<ProtectedRoute><DashboardLayout><ReviewsPage /></DashboardLayout></ProtectedRoute>} />
          <Route path="/career" element={<ProtectedRoute><DashboardLayout><CareerPage /></DashboardLayout></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><DashboardLayout><AnalyticsPage /></DashboardLayout></ProtectedRoute>} />

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;