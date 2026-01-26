// src/components/Navbar.jsx
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="navbar">
      <div className="navbarInner">
        <div className="navLeft">
          <NavLink to="/" className={({ isActive }) => `navLink ${isActive ? 'active' : ''}`}>Dashboard</NavLink>
          <NavLink to="/objectives" className={({ isActive }) => `navLink ${isActive ? 'active' : ''}`}>Objectives</NavLink>
          <NavLink to="/evaluations" className={({ isActive }) => `navLink ${isActive ? 'active' : ''}`}>Evaluations</NavLink>
          <NavLink to="/teams" className={({ isActive }) => `navLink ${isActive ? 'active' : ''}`}>Teams</NavLink>
          <NavLink to="/hrdecisions" className={({ isActive }) => `navLink ${isActive ? 'active' : ''}`}>HR Decisions</NavLink>
          <NavLink to="/kpi" className={({ isActive }) => `navLink ${isActive ? 'active' : ''}`}>KPIs</NavLink>
        </div>

        <div className="navRight">
          {user && <span className="navUser">{user.email} ({user.role})</span>}
          {user ? (
            <button className="btn btnDanger" onClick={handleLogout}>Logout</button>
          ) : (
            <NavLink to="/login" className="btn">Login</NavLink>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;