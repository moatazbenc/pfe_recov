import React from 'react';
import ProgressDonut from '../dashboard/ProgressDonut';
import GoalStatusBadge from './GoalStatusBadge';

function GoalProgressSummary({ objectives, statusFilter, onStatusFilter }) {
    var total = objectives.length;
    var avgProgress = total > 0 ? objectives.reduce(function (sum, o) { return sum + (o.achievementPercent || 0); }, 0) / total : 0;

    var counts = { no_status: 0, on_track: 0, at_risk: 0, off_track: 0, closed: 0, achieved: 0 };
    objectives.forEach(function (o) {
        var s = o.goalStatus || 'no_status';
        if (counts[s] !== undefined) counts[s]++;
    });

    var statuses = ['no_status', 'on_track', 'at_risk', 'off_track', 'closed', 'achieved'];

    return (
        <div className="goals-progress-summary">
            <div className="goals-progress-summary__donut">
                <ProgressDonut percent={Math.round(avgProgress)} size={100} color="#7C3AED" label="Overall" />
            </div>
            <div className="goals-progress-summary__statuses">
                {statuses.map(function (s) {
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
