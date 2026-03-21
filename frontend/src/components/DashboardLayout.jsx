import React from 'react';
import { useAuth } from './AuthContext';
import Sidebar from './Sidebar';
import Notifications from './Notifications';

function DashboardLayout({ children }) {
    const { user, logout } = useAuth();

    if (!user) {
        return <>{children}</>;
    }

    return (
        <div className="dashboard-layout">
            <Sidebar />
            <div className="dashboard-layout__main">
                {/* Top bar */}
                <header className="dashboard-layout__topbar">
                    <div className="topbar__left">
                        {/* Breadcrumb or search could go here */}
                    </div>
                    <div className="topbar__right">
                        <Notifications />
                        <button onClick={logout} className="topbar__logout" title="Logout">
                            🚪
                        </button>
                    </div>
                </header>

                {/* Page content */}
                <div className="dashboard-layout__content">
                    {children}
                </div>
            </div>
        </div>
    );
}

export default DashboardLayout;
