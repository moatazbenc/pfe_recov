import React from 'react';

var statusConfig = {
    no_status: { label: 'No Status', color: '#9CA3AF', bg: '#f3f4f6' },
    on_track: { label: 'On Track', color: '#059669', bg: '#d1fae5' },
    at_risk: { label: 'At Risk', color: '#D97706', bg: '#fef3c7' },
    off_track: { label: 'Off Track', color: '#DC2626', bg: '#fee2e2' },
    closed: { label: 'Closed', color: '#6B7280', bg: '#e5e7eb' },
    achieved: { label: 'Achieved', color: '#7C3AED', bg: '#ede9fe' },
};

function GoalStatusBadge({ status, onClick, count }) {
    var config = statusConfig[status] || statusConfig.no_status;
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
export { statusConfig };
