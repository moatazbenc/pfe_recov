import React from 'react';

function SurveyCard() {
    return (
        <div className="dash-card dash-card--survey">
            <div className="dash-card__header">
                <span className="dash-card__icon">📊</span>
                <h3>Latest Survey</h3>
            </div>
            <div className="dash-card__body">
                <div className="dash-card__empty-state">
                    <div className="dash-card__empty-icon">📊</div>
                    <p>No active surveys</p>
                    <span className="dash-card__empty-hint">Employee surveys coming soon</span>
                </div>
            </div>
        </div>
    );
}

export default SurveyCard;
