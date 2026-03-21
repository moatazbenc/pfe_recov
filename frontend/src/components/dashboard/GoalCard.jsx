import React from 'react';
import ProgressDonut from './ProgressDonut';

function GoalCard({ objectives, loading }) {
    if (loading) {
        return (
            <div className="dash-card dash-card--goals">
                <div className="dash-card__header">
                    <span className="dash-card__icon">🎯</span>
                    <h3>Active Goals</h3>
                </div>
                <div className="dash-card__body">
                    <p className="dash-card__loading">Loading goals...</p>
                </div>
            </div>
        );
    }

    const goals = objectives || [];
    const activeGoals = goals;
    const totalProgress = activeGoals.length > 0
        ? Math.round(activeGoals.reduce((sum, o) => sum + (o.achievementPercent || 0), 0) / activeGoals.length)
        : 0;

    function getStatusInfo(obj) {
        const pct = obj.achievementPercent || 0;
        if (obj.status === 'validated' || obj.status === 'locked') return { label: 'Closed', color: '#6B7280' };
        if (pct >= 70) return { label: 'On Track', color: '#10B981' };
        if (pct >= 40) return { label: 'At Risk', color: '#F59E0B' };
        return { label: 'Off Track', color: '#EF4444' };
    }

    const statusCounts = { 'On Track': 0, 'At Risk': 0, 'Off Track': 0, 'Closed': 0 };
    activeGoals.forEach(g => {
        const info = getStatusInfo(g);
        statusCounts[info.label]++;
    });

    return (
        <div className="dash-card dash-card--goals">
            <div className="dash-card__header">
                <span className="dash-card__icon">🎯</span>
                <h3>Active Goals</h3>
                <span className="dash-card__count">{activeGoals.length}</span>
            </div>
            <div className="dash-card__body dash-card__body--split">
                <div className="dash-card__list">
                    {activeGoals.length === 0 ? (
                        <p className="dash-card__empty">No active goals yet. Create your first objective!</p>
                    ) : (
                        activeGoals.slice(0, 5).map(obj => {
                            const statusInfo = getStatusInfo(obj);
                            return (
                                <div key={obj._id} className="goal-item">
                                    <div className="goal-item__info">
                                        <span className="goal-item__title">{obj.title}</span>
                                        <div className="goal-item__meta">
                                            <span className="goal-item__weight">{obj.weight}%</span>
                                            <span className="goal-item__status" style={{ color: statusInfo.color }}>
                                                ● {statusInfo.label}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="goal-item__progress">
                                        <div className="goal-item__bar">
                                            <div
                                                className="goal-item__bar-fill"
                                                style={{
                                                    width: (obj.achievementPercent || 0) + '%',
                                                    backgroundColor: statusInfo.color,
                                                }}
                                            />
                                        </div>
                                        <span className="goal-item__pct">{obj.achievementPercent || 0}%</span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
                {activeGoals.length > 0 && (
                    <div className="dash-card__donut-section">
                        <ProgressDonut percent={totalProgress} size={100} color="#7C3AED" label="Overall" />
                        <div className="goal-status-legend">
                            {Object.entries(statusCounts).map(([label, count]) => {
                                if (count === 0) return null;
                                const colors = { 'On Track': '#10B981', 'At Risk': '#F59E0B', 'Off Track': '#EF4444', 'Closed': '#6B7280' };
                                return (
                                    <div key={label} className="goal-status-legend__item">
                                        <span className="goal-status-legend__dot" style={{ backgroundColor: colors[label] }} />
                                        <span>{count} {label}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default GoalCard;
