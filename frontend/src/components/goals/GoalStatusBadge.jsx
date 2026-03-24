import React from 'react';

var statusConfig = {
    // Execution statuses
    no_status: { label: 'No Status', color: '#9CA3AF', bg: '#f3f4f6', icon: '○' },
    not_started: { label: 'Not Started', color: '#6B7280', bg: '#f3f4f6', icon: '◇' },
    in_progress: { label: 'In Progress', color: '#3B82F6', bg: '#dbeafe', icon: '▶' },
    on_track: { label: 'On Track', color: '#059669', bg: '#d1fae5', icon: '✓' },
    at_risk: { label: 'At Risk', color: '#D97706', bg: '#fef3c7', icon: '⚠' },
    off_track: { label: 'Off Track', color: '#DC2626', bg: '#fee2e2', icon: '✗' },
    on_hold: { label: 'On Hold', color: '#8B5CF6', bg: '#ede9fe', icon: '⏸' },
    closed: { label: 'Closed', color: '#6B7280', bg: '#e5e7eb', icon: '■' },
    achieved: { label: 'Achieved', color: '#7C3AED', bg: '#ede9fe', icon: '★' },
};

var workflowConfig = {
    draft: { label: 'Draft', color: '#95a5a6', bg: '#f1f5f9', icon: '✎' },
    pending: { label: 'Pending', color: '#e67e22', bg: '#fff7ed', icon: '🕐' },
    pending_approval: { label: 'Pending Approval', color: '#f59e0b', bg: '#fffbeb', icon: '⏳' },
    submitted: { label: 'Submitted', color: '#f39c12', bg: '#fffbeb', icon: '⏳' },
    revision_requested: { label: 'Revision Requested', color: '#e67e22', bg: '#fff7ed', icon: '↩' },
    rejected: { label: 'Rejected', color: '#e74c3c', bg: '#fee2e2', icon: '✗' },
    assigned: { label: 'Pending Acknowledgment', color: '#6366f1', bg: '#eef2ff', icon: '📌' },
    acknowledged: { label: 'Acknowledged', color: '#06b6d4', bg: '#ecfeff', icon: '✓' },
    approved: { label: 'Approved', color: '#27ae60', bg: '#d1fae5', icon: '✓' },
    validated: { label: 'Validated', color: '#27ae60', bg: '#d1fae5', icon: '✓' },
    locked: { label: 'Locked', color: '#475569', bg: '#e2e8f0', icon: '🔒' },
    cancelled: { label: 'Cancelled', color: '#94a3b8', bg: '#f1f5f9', icon: '⊘' },
    evaluated: { label: 'Evaluated', color: '#7c3aed', bg: '#f5f3ff', icon: '📊' },
    archived: { label: 'Archived', color: '#9ca3af', bg: '#f3f4f6', icon: '📁' },
};

function GoalStatusBadge({ status, onClick, count, type }) {
    var config;
    if (type === 'workflow') {
        config = workflowConfig[status] || workflowConfig.draft;
    } else {
        config = statusConfig[status] || statusConfig.no_status;
    }
    return (
        <span
            className="goal-status-badge"
            style={{ color: config.color, backgroundColor: config.bg, cursor: onClick ? 'pointer' : 'default' }}
            onClick={onClick}
        >
            <span className="goal-status-badge__dot" style={{ backgroundColor: config.color }}></span>
            {config.label}
            {count !== undefined && <span className="goal-status-badge__count">{count}</span>}
        </span>
    );
}

export default GoalStatusBadge;
export { statusConfig, workflowConfig };
