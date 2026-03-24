import React from 'react';
import ProgressDonut from './ProgressDonut';
import UserAvatar from '../UserAvatar';

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
        const status = obj.goalStatus || 'no_status';
        if (status === 'on_track') return { label: 'On Track', color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)' };
        if (status === 'at_risk') return { label: 'At Risk', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)' };
        if (status === 'off_track') return { label: 'Behind', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)' };
        if (status === 'achieved') return { label: 'Achieved', color: '#7C3AED', bg: 'rgba(124, 58, 237, 0.1)' };
        return { label: 'No Status', color: '#6B7280', bg: 'rgba(107, 114, 128, 0.1)' };
    }

    const statusCounts = { 'On Track': 0, 'At Risk': 0, 'Off Track': 0, 'Achieved': 0, 'No Status': 0 };
    activeGoals.forEach(g => {
        const info = getStatusInfo(g);
        if (statusCounts[info.label] !== undefined) {
            statusCounts[info.label]++;
        } else {
            statusCounts[info.label] = 1;
        }
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
                        <p className="dash-card__empty">No goals matching this filter.</p>
                    ) : (
                        activeGoals.slice(0, 6).map(obj => {
                            const statusInfo = getStatusInfo(obj);
                            const commentCount = (obj.comments || []).length;
                            return (
                                <div key={obj._id} className="goal-item" style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                                        <UserAvatar user={obj.owner} size={32} />
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{obj.title}</span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                <span>📅 {new Date(obj.deadline || obj.createdAt).toLocaleDateString()}</span>
                                                {commentCount > 0 && <span>💬 {commentCount}</span>}
                                                <span style={{ 
                                                    padding: '2px 8px', 
                                                    borderRadius: '10px', 
                                                    background: statusInfo.bg, 
                                                    color: statusInfo.color,
                                                    fontWeight: '700',
                                                    fontSize: '0.7rem'
                                                }}>
                                                    {statusInfo.label}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ width: '80px', textAlign: 'right' }}>
                                        <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{obj.achievementPercent || 0}%</div>
                                        <div className="progress-bar-bg" style={{ height: '4px', background: 'var(--bg-main)', borderRadius: '2px', marginTop: '4px' }}>
                                            <div style={{ height: '100%', width: `${obj.achievementPercent || 0}%`, background: statusInfo.color, borderRadius: '2px' }} />
                                        </div>
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
