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
                        <input 
                            type="text" 
                            className="topbar__search-input" 
                            placeholder="🔍 Search users, goals, teams..."
                        />
                    </div>
                    <div className="topbar__right">
                        <Notifications />
                        <button onClick={logout} className="topbar__logout" title="Logout" style={{background: 'transparent', border: '1px solid #e2e8f0', borderRadius:'50%', width:'36px', height:'36px', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer'}}>
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
