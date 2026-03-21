import React, { useState } from 'react';
import GoalProgressBar from './GoalProgressBar';
import GoalStatusBadge from './GoalStatusBadge';

function GoalTable({ objectives, onGoalClick, onStatusChange, onDelete, onDuplicate, onEdit }) {
    var [expandedRows, setExpandedRows] = useState({});

    function toggleRow(id) {
        setExpandedRows(function (prev) {
            var next = Object.assign({}, prev);
            next[id] = !next[id];
            return next;
        });
    }

    function formatDate(d) {
        if (!d) return '—';
        return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    function getInitials(name) {
        if (!name) return '?';
        return name.split(' ').map(function (w) { return w[0]; }).join('').toUpperCase().substring(0, 2);
    }

    function getWeightColor(w) { if (w >= 30) return '#e74c3c'; if (w >= 20) return '#f39c12'; return '#27ae60'; }
    function getStatusColor(s) { return { draft: '#95a5a6', active: '#3498db', submitted: '#f39c12', validated: '#27ae60', rejected: '#e74c3c', completed: '#9b59b6' }[s] || '#666'; }

    function isOverdue(obj) {
        if (!obj.deadline) return false;
        return new Date(obj.deadline) < new Date() && obj.goalStatus !== 'closed' && obj.goalStatus !== 'achieved';
    }

    var map = {};
    objectives.forEach(function (o) { map[o._id] = { ...o, children: [] }; });
    var roots = [];
    objectives.forEach(function (o) {
        var parentId = o.parentObjective?._id || o.parentObjective;
        if (parentId && map[parentId]) {
            map[parentId].children.push(map[o._id]);
        } else {
            roots.push(map[o._id]);
        }
    });

    if (objectives.length === 0) {
        return (
            <div className="goals-table-empty">
                <div className="goals-table-empty__icon">🎯</div>
                <h3>No goals found</h3>
                <p>Create your first goal to get started</p>
            </div>
        );
    }

    function renderRow(obj, level) {
        var expanded = expandedRows[obj._id];
        return (
            <React.Fragment key={obj._id}>
                <div className={'goals-table__row-wrapper' + (expanded ? ' goals-table__row-wrapper--expanded' : '') + (obj.status === 'rejected' ? ' goals-table__row-wrapper--rejected' : '')} style={{ marginLeft: (level * 20) + 'px', borderLeft: level > 0 ? '2px solid #e2e8f0' : 'none' }}>
                    <div className="goals-table__row" onClick={function () { onGoalClick(obj); }}>
                        <div className="goals-table__col goals-table__col--title">
                            <button className="goals-table__expand" onClick={function (e) { e.stopPropagation(); toggleRow(obj._id); }}>
                                {obj.children && obj.children.length > 0 ? (expanded ? '▾' : '▸') : <span style={{display:'inline-block', width:'12px'}}></span>}
                            </button>
                            <div className="goals-table__avatar" title={obj.owner?.name || 'Unknown'}>
                                {getInitials(obj.owner?.name)}
                            </div>
                            <div className="goals-table__title-text">
                                <span className="goals-table__goal-title">{obj.title}</span>
                                <div style={{ display: 'flex', gap: '4px', marginTop: '2px' }}>
                                    {obj.category === 'team' && <span className="goals-table__team-tag">TEAM</span>}
                                    <span className="goals-table__workflow-badge" style={{ backgroundColor: getStatusColor(obj.status) }}>{obj.status}</span>
                                </div>
                            </div>
                        </div>

                        <div className="goals-table__col goals-table__col--weight">
                            <span className="goals-table__weight-badge" style={{ backgroundColor: getWeightColor(obj.weight) }}>{obj.weight}</span>
                        </div>

                        <div className="goals-table__col goals-table__col--progress">
                            <GoalProgressBar percent={obj.achievementPercent || 0} size="small" />
                        </div>

                        <div className="goals-table__col goals-table__col--status">
                            <GoalStatusBadge status={obj.goalStatus || 'no_status'} />
                        </div>

                        <div className="goals-table__col goals-table__col--date">
                            <span className={isOverdue(obj) ? 'goals-table__date--overdue' : ''}>
                                {formatDate(obj.deadline)}
                            </span>
                        </div>

                        <div className="goals-table__col goals-table__col--actions">
                            <div className="goals-table__action-buttons" onClick={function (e) { e.stopPropagation(); }}>
                                {onEdit && <button className="goals-table__btn goals-table__btn--edit" onClick={function () { onEdit(obj); }} title="Edit">✏️</button>}
                                <button className="goals-table__btn goals-table__btn--delete" onClick={function () { onDelete(obj._id); }} title="Delete">🗑️</button>
                                <div className="goals-table__action-menu">
                                    <button className="goals-table__action-btn">⋮</button>
                                    <div className="goals-table__dropdown">
                                        <button onClick={function () { onGoalClick(obj); }}>View Details</button>
                                        {onEdit && <button onClick={function () { onEdit(obj); }}>Edit Goal</button>}
                                        <button onClick={function () { onDuplicate(obj._id); }}>Duplicate</button>
                                        <button className="goals-table__dropdown--danger" onClick={function () { onDelete(obj._id); }}>Delete</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {expanded && (
                        <div className="goals-table__expanded">
                            <div className="goals-table__expanded-info">
                                <div><strong>Description:</strong> {obj.description || 'No description'}</div>
                                <div><strong>Weight:</strong> {obj.weight}%</div>
                                <div><strong>KPIs:</strong> {obj.kpis?.length || 0}</div>
                                {obj.successIndicator && <div><strong>Success Indicator:</strong> {obj.successIndicator}</div>}
                                {obj.status === 'rejected' && obj.managerComments && (
                                    <div className="goals-table__rejection-notice">
                                        <strong>⚠️ Manager Feedback:</strong> {obj.managerComments}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {obj.children && obj.children.length > 0 && expanded && (
                    <div className="goals-table__children">
                        {obj.children.map(function (child) { return renderRow(child, level + 1); })}
                    </div>
                )}
            </React.Fragment>
        );
    }

    return (
        <div className="goals-table">
            <div className="goals-table__header">
                <div className="goals-table__col goals-table__col--title">Goal</div>
                <div className="goals-table__col goals-table__col--weight">Weight</div>
                <div className="goals-table__col goals-table__col--progress">Progress</div>
                <div className="goals-table__col goals-table__col--status">Status</div>
                <div className="goals-table__col goals-table__col--date">End Date</div>
                <div className="goals-table__col goals-table__col--actions"></div>
            </div>

            {roots.map(function (obj) { return renderRow(obj, 0); })}
        </div>
    );
}

export default GoalTable;
