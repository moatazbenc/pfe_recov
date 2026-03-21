import React from 'react';

function ReviewCard({ recentDecisions }) {
    const decisions = recentDecisions || [];
    const latest = decisions[0] || null;

    function getActionLabel(action) {
        const labels = {
            reward: '🏆 Reward',
            promotion: '📈 Promotion',
            bonus: '💰 Bonus',
            satisfactory: '✅ Satisfactory',
            coaching: '👨‍🏫 Coaching',
            training: '📚 Training',
            position_change: '🔄 Position Change',
            termination_review: '⚠️ Review',
        };
        return labels[action] || action;
    }

    function getScoreColor(score) {
        if (score >= 80) return '#10B981';
        if (score >= 60) return '#F59E0B';
        return '#EF4444';
    }

    return (
        <div className="dash-card dash-card--review">
            <div className="dash-card__header">
                <span className="dash-card__icon">📋</span>
                <h3>Latest Review</h3>
            </div>
            <div className="dash-card__body">
                {!latest ? (
                    <div className="dash-card__empty-state">
                        <div className="dash-card__empty-icon">📋</div>
                        <p>No reviews yet</p>
                        <span className="dash-card__empty-hint">Your evaluation data will appear here</span>
                    </div>
                ) : (
                    <div className="review-latest">
                        <div className="review-latest__score" style={{ borderColor: getScoreColor(latest.finalScore) }}>
                            <span className="review-latest__score-value" style={{ color: getScoreColor(latest.finalScore) }}>
                                {latest.finalScore}
                            </span>
                            <span className="review-latest__score-label">/100</span>
                        </div>
                        <div className="review-latest__info">
                            <span className="review-latest__name">{latest.user?.name || 'Unknown'}</span>
                            <span className="review-latest__action">{getActionLabel(latest.action)}</span>
                            <span className="review-latest__date">
                                {new Date(latest.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ReviewCard;
