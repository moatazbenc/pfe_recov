// Main dashboard page for HR system
// Shows navigation and role-based content
import React from 'react';
import { useAuth } from '../components/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();

  if (!user) {
    return <div>Please <a href="/login">login</a> to access the dashboard.</div>;
  }

  return (
    <div>
      <h1>Welcome, {user.name}</h1>
      <h2>Role: {user.role}</h2>
      <nav>
        <ul>
          {user.role === 'HR' && <li><a href="/register">User Management</a></li>}
          {(user.role === 'HR' || user.role === 'Manager') && <li><a href="/teams">Teams</a></li>}
          <li><a href="/objectives">Objectives</a></li>
          <li><a href="/evaluations">Evaluations</a></li>
          {user.role === 'HR' && <li><a href="/hrdecisions">HR Decisions</a></li>}
          <li><a href="/kpi">KPIs & Statistics</a></li>
        </ul>
      </nav>
      <div>
        {/* Role-based dashboard widgets will go here */}
        <p>Select a section from the navigation above.</p>
      </div>
    </div>
  );
};

export default Dashboard;
