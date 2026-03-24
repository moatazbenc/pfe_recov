import React from 'react';
import ProgressDonut from '../dashboard/ProgressDonut';
import GoalStatusBadge from './GoalStatusBadge';

function GoalProgressSummary({ objectives, statusFilter, onStatusFilter }) {
    var approvedObjectives = objectives.filter(function(o) {
        return o.status === 'approved' || o.status === 'validated';
    });
    
    var total = approvedObjectives.length;
    var avgProgress = total > 0 ? approvedObjectives.reduce(function (sum, o) { return sum + (o.achievementPercent || 0); }, 0) / total : 0;

    var counts = { no_status: 0, not_started: 0, in_progress: 0, on_track: 0, at_risk: 0, off_track: 0, on_hold: 0, closed: 0, achieved: 0 };
    approvedObjectives.forEach(function (o) {
        var s = o.goalStatus || 'no_status';
        if (counts[s] !== undefined) counts[s]++;
    });

    var statuses = ['no_status', 'not_started', 'in_progress', 'on_track', 'at_risk', 'off_track', 'on_hold', 'closed', 'achieved'];

    return (
        <div className="goals-progress-summary">
            <div className="goals-progress-summary__donut">
                <ProgressDonut percent={Math.round(avgProgress)} size={100} color="#7C3AED" label="Overall" />
            </div>
            <div className="goals-progress-summary__statuses">
                {statuses.map(function (s) {
                    if (counts[s] === 0 && !['no_status', 'on_track', 'at_risk'].includes(s)) return null;
                    return (
                        <GoalStatusBadge
                            key={s}
                            status={s}
                            count={counts[s]}
                            onClick={function () { onStatusFilter(statusFilter === s ? null : s); }}
                        />
                    );
                })}
            </div>
        </div>
    );
}

export default GoalProgressSummary;
