import React from 'react';
import { useAuth } from '../AuthContext';

function GoalFilters({ activeTab, onTabChange, cycles, selectedCycle, onCycleChange, searchTerm, onSearchChange, workflowFilter, onWorkflowFilter }) {
    var { user } = useAuth();
    var isManager = user && (user.role === 'TEAM_LEADER' || user.role === 'ADMIN' || user.role === 'HR');

    var tabs = [
        { key: 'my', label: '📋 My Goals' },
        { key: 'team', label: '👥 My Team' },
    ];
    if (isManager) {
        tabs.push({ key: 'pending', label: '⏳ Pending Approvals' });
        tabs.push({ key: 'change_requests', label: '📝 Change Requests' });
        tabs.push({ key: 'awaiting_eval', label: '📊 Awaiting Evaluation' });
    }
    tabs.push({ key: 'all', label: '🌐 All Goals' });

    var workflowStatuses = [
        { key: 'all', label: 'All Statuses' },
        { key: 'draft', label: 'Draft' },
        { key: 'pending', label: 'Pending (Submitted)' },
        { key: 'pending_approval', label: 'Pending Approval' },
        { key: 'revision_requested', label: 'Revision Requested' },
        { key: 'rejected', label: 'Rejected' },
        { key: 'assigned', label: 'Assigned' },
        { key: 'approved', label: 'Approved / Active' },
        { key: 'evaluated', label: 'Evaluated' },
        { key: 'archived', label: 'Archived' },
    ];

    return (
        <div className="goals-filters">
            <div className="goals-filters__tabs">
                {tabs.map(function (tab) {
                    return (
                        <button
                            key={tab.key}
                            className={'goals-filters__tab' + (activeTab === tab.key ? ' goals-filters__tab--active' : '')}
                            onClick={function () { onTabChange(tab.key); }}
                        >
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            <div className="goals-filters__controls" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <input 
                    type="text" 
                    placeholder="Search goals..." 
                    value={searchTerm} 
                    onChange={function (e) { onSearchChange(e.target.value); }}
                    className="goals-filters__search"
                    style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none' }}
                />
                {onWorkflowFilter && (
                    <select
                        className="goals-filters__cycle-select"
                        value={workflowFilter || 'all'}
                        onChange={function (e) { onWorkflowFilter(e.target.value === 'all' ? null : e.target.value); }}
                    >
                        {workflowStatuses.map(function (s) {
                            return <option key={s.key} value={s.key}>{s.label}</option>;
                        })}
                    </select>
                )}
                <select
                    className="goals-filters__cycle-select"
                    value={selectedCycle}
                    onChange={function (e) { onCycleChange(e.target.value); }}
                >
                    <option value="">All Cycles</option>
                    {cycles.map(function (c) {
                        return <option key={c._id} value={c._id}>{c.name} ({c.year})</option>;
                    })}
                </select>
            </div>
        </div>
    );
}

export default GoalFilters;
