import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

function Sidebar() {
    const [collapsed, setCollapsed] = useState(false);
    const location = useLocation();
    const { user } = useAuth();

    if (!user) return null;

    function isActive(path) {
        return location.pathname === path;
    }

    const navSections = [
        {
            label: 'Main',
            items: [
                { path: '/dashboard', label: 'Home', icon: '🏠', roles: null },
                { path: '/goals', label: 'Goals', icon: '🎯', roles: null },
                { path: '/tasks', label: 'Tasks', icon: '✅', roles: null },
                { path: '/meetings', label: 'Meetings', icon: '📅', roles: null },
            ],
        },
        {
            label: 'People',
            items: [
                { path: '/feedback', label: 'Feedback', icon: '💬', roles: null },
                { path: '/recognition', label: 'Recognition', icon: '🏆', roles: null },
                { path: '/reviews', label: 'Reviews', icon: '📋', roles: null },
                { path: '/surveys', label: 'Surveys', icon: '📊', roles: null },
            ],
        },
        {
            label: 'Development',
            items: [
                { path: '/career', label: 'Career', icon: '🚀', roles: null },
                { path: '/evaluations', label: 'Evaluations', icon: '📝', roles: null },
                { path: '/cycles', label: 'Cycles', icon: '🔄', roles: null },
            ],
        },
        {
            label: 'Management',
            items: [
                { path: '/validation', label: 'Validation', icon: '✔️', roles: ['ADMIN', 'TEAM_LEADER'] },
                { path: '/hr-decisions', label: 'HR Decisions', icon: '⚖️', roles: ['ADMIN', 'TEAM_LEADER', 'HR'] },
                { path: '/teams', label: 'Teams', icon: '👥', roles: null },
                { path: '/users', label: 'Users', icon: '👤', roles: ['ADMIN', 'HR'] },
                { path: '/analytics', label: 'Analytics', icon: '📈', roles: ['ADMIN', 'HR', 'TEAM_LEADER'] },
                { path: '/settings', label: 'Settings', icon: '⚙️', roles: null },
            ],
        },
    ];

    const initials = user.name
        ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : '??';

    return (
        <aside className={'sidebar' + (collapsed ? ' sidebar--collapsed' : '')}>
            {/* Brand */}
            <div className="sidebar__brand">
                {!collapsed && <span className="sidebar__brand-text">PerfManager</span>}
                <button
                    className="sidebar__toggle"
                    onClick={() => setCollapsed(!collapsed)}
                    title={collapsed ? 'Expand' : 'Collapse'}
                >
                    {collapsed ? '→' : '←'}
                </button>
            </div>

            {/* Navigation */}
            <nav className="sidebar__nav">
                {navSections.map(function (section) {
                    const visibleItems = section.items.filter(function (item) {
                        if (!item.roles) return true;
                        return item.roles.includes(user.role);
                    });
                    if (visibleItems.length === 0) return null;

                    return (
                        <div key={section.label} className="sidebar__section">
                            {!collapsed && <div className="sidebar__section-label">{section.label}</div>}
                            {visibleItems.map(item => (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={'sidebar__link' + (isActive(item.path) ? ' sidebar__link--active' : '')}
                                    title={collapsed ? item.label : ''}
                                >
                                    <span className="sidebar__icon">{item.icon}</span>
                                    {!collapsed && <span className="sidebar__label">{item.label}</span>}
                                </Link>
                            ))}
                        </div>
                    );
                })}
            </nav>

            {/* User section */}
            <div className="sidebar__user">
                <div className="sidebar__avatar">{initials}</div>
                {!collapsed && (
                    <div className="sidebar__user-info">
                        <span className="sidebar__user-name">{user.name}</span>
                        <span className="sidebar__user-role">{user.role}</span>
                    </div>
                )}
            </div>
        </aside>
    );
}

export default Sidebar;
