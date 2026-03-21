import React from 'react';
import ProgressDonut from './ProgressDonut';

function TaskCard() {
    return (
        <div className="dash-card dash-card--tasks">
            <div className="dash-card__header">
                <span className="dash-card__icon">✅</span>
                <h3>Tasks</h3>
            </div>
            <div className="dash-card__body dash-card__body--split">
                <div className="dash-card__list">
                    <div className="dash-card__empty-state">
                        <p>No tasks assigned</p>
                        <span className="dash-card__empty-hint">Task management coming soon</span>
                    </div>
                </div>
                <div className="dash-card__donut-section">
                    <ProgressDonut percent={0} size={80} color="#3B82F6" label="Done" />
                </div>
            </div>
        </div>
    );
}

export default TaskCard;
