import React from 'react';
import { useAuth } from '../AuthContext';

function DashboardHeader({ activeTab, onTabChange }) {
    const { user } = useAuth();

    const tabs = [
        { key: 'me', label: 'Me' },
        { key: 'team', label: 'My Team' },
        { key: 'org', label: 'My Organization' },
    ];

    return (
        <div className="dash-header">
            <div className="dash-header__greeting">
                <h1>Hello, {user?.name || 'User'} <span className="dash-header__wave">👋</span></h1>
                <p className="dash-header__subtitle">Welcome back! Here's your performance overview.</p>
            </div>
            <div className="dash-header__tabs">
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        className={'dash-header__tab' + (activeTab === tab.key ? ' dash-header__tab--active' : '')}
                        onClick={() => onTabChange(tab.key)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
        </div>
    );
}

export default DashboardHeader;
