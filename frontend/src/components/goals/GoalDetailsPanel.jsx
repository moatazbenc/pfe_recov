import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import GoalProgressBar from './GoalProgressBar';
import GoalStatusBadge from './GoalStatusBadge';
import CheckInModal from './CheckInModal';
import GoalAlignmentTree from './GoalAlignmentTree';
import { useAuth } from '../AuthContext';

var API = 'http://localhost:5000';

function GoalDetailsPanel({ goal, onClose, onRefresh }) {
    var { user } = useAuth();
    var [activeTab, setActiveTab] = useState('details');
    var [detail, setDetail] = useState(goal);
    var [kpiForm, setKpiForm] = useState({ title: '', metricType: 'percent', initialValue: 0, targetValue: 100, currentValue: 0, unit: '' });
    var [showKpiForm, setShowKpiForm] = useState(false);
    var [commentText, setCommentText] = useState('');
    var [updateText, setUpdateText] = useState('');
    var [newStatus, setNewStatus] = useState(goal.goalStatus || 'no_status');
    var [children, setChildren] = useState([]);
    var [showCheckInModal, setShowCheckInModal] = useState(false);
    // Local KPI values for debounced editing (Bug 2 fix)
    var [kpiLocalValues, setKpiLocalValues] = useState({});
    var debounceTimers = useRef({});

    useEffect(function () {
        fetchDetail();
        fetchChildren();
    }, [goal._id]);

    // Sync local KPI values when detail changes
    useEffect(function () {
        if (detail && detail.kpis) {
            var vals = {};
            detail.kpis.forEach(function (kpi) {
                // Only set if not currently being edited (no local override)
                if (kpiLocalValues[kpi._id] === undefined) {
                    vals[kpi._id] = kpi.currentValue;
                } else {
                    vals[kpi._id] = kpiLocalValues[kpi._id];
                }
            });
            setKpiLocalValues(vals);
        }
    }, [detail]);

    async function fetchDetail() {
        try {
            var token = localStorage.getItem('token');
            var res = await axios.get(API + '/api/objectives/' + goal._id, {
                headers: { Authorization: 'Bearer ' + token }
            });
            setDetail(res.data.objective || res.data);
        } catch (err) { console.error(err); }
    }

    async function fetchChildren() {
        try {
            var token = localStorage.getItem('token');
            var res = await axios.get(API + '/api/objectives/' + goal._id + '/children', {
                headers: { Authorization: 'Bearer ' + token }
            });
            setChildren(res.data.objectives || []);
        } catch (err) { console.error(err); }
    }

    async function handleStatusChange() {
        try {
            await axios.put(API + '/api/objectives/' + goal._id + '/goal-status', { goalStatus: newStatus });
            fetchDetail();
            if (onRefresh) onRefresh();
        } catch (err) { console.error(err); }
    }

    async function handleSuggestKpis() {
        try {
            var token = localStorage.getItem('token');
            var res = await axios.post(API + '/api/ai/suggest-kpis', { goalTitle: detail.title, goalDescription: detail.description }, { headers: { Authorization: `Bearer ${token}` } });
            
            if (res.data.kpis && res.data.kpis.length > 0) {
                for (let kpi of res.data.kpis) {
                    await axios.post(API + '/api/objectives/' + goal._id + '/kpis', kpi, { headers: { Authorization: `Bearer ${token}` } });
                }
                fetchDetail();
                if (onRefresh) onRefresh();
            }
        } catch (err) { console.error(err); }
    }

    async function handleAddKpi(e) {
        e.preventDefault();
        try {
            var token = localStorage.getItem('token');
            await axios.post(API + '/api/objectives/' + goal._id + '/kpis', kpiForm, {
                headers: { Authorization: 'Bearer ' + token }
            });
            setKpiForm({ title: '', metricType: 'percent', initialValue: 0, targetValue: 100, currentValue: 0, unit: '' });
            setShowKpiForm(false);
            fetchDetail();
            if (onRefresh) onRefresh();
        } catch (err) { console.error(err); }
    }

    // Bug 2 fix: Debounced KPI update — edit locally, save after 800ms pause
    function handleKpiLocalChange(kpiId, value) {
        setKpiLocalValues(function (prev) {
            var next = Object.assign({}, prev);
            next[kpiId] = value;
            return next;
        });

        // Clear previous timer for this KPI
        if (debounceTimers.current[kpiId]) {
            clearTimeout(debounceTimers.current[kpiId]);
        }

        // Set new debounce timer
        debounceTimers.current[kpiId] = setTimeout(function () {
            handleUpdateKpiDebounced(kpiId, value);
        }, 800);
    }

    async function handleUpdateKpiDebounced(kpiId, currentValue) {
        try {
            var token = localStorage.getItem('token');
            await axios.put(API + '/api/objectives/' + goal._id + '/kpis/' + kpiId, { currentValue: parseFloat(currentValue) }, {
                headers: { Authorization: 'Bearer ' + token }
            });
            fetchDetail();
            if (onRefresh) onRefresh();
        } catch (err) { console.error(err); }
    }

    async function handleDeleteKpi(kpiId) {
        try {
            var token = localStorage.getItem('token');
            await axios.delete(API + '/api/objectives/' + goal._id + '/kpis/' + kpiId, {
                headers: { Authorization: 'Bearer ' + token }
            });
            fetchDetail();
            if (onRefresh) onRefresh();
        } catch (err) { console.error(err); }
    }

    // Bug 3 fix: Optimistic comment insertion
    async function handleAddComment() {
        if (!commentText.trim()) return;
        var tempComment = {
            _id: 'temp_' + Date.now(),
            user: { _id: user._id || user.id, name: user.name, email: user.email },
            text: commentText,
            createdAt: new Date().toISOString()
        };

        // Optimistically add to UI immediately
        setDetail(function (prev) {
            return Object.assign({}, prev, {
                comments: [...(prev.comments || []), tempComment]
            });
        });
        var savedText = commentText;
        setCommentText('');

        try {
            var token = localStorage.getItem('token');
            var res = await axios.post(API + '/api/objectives/' + goal._id + '/comments', { text: savedText }, {
                headers: { Authorization: 'Bearer ' + token }
            });
            // Replace with server version
            setDetail(res.data.objective || res.data);
        } catch (err) {
            // Rollback on error
            setDetail(function (prev) {
                return Object.assign({}, prev, {
                    comments: (prev.comments || []).filter(function (c) { return c._id !== tempComment._id; })
                });
            });
            setCommentText(savedText);
            console.error(err);
        }
    }

    async function handleDeleteComment(cid) {
        try {
            var token = localStorage.getItem('token');
            await axios.delete(API + '/api/objectives/' + goal._id + '/comments/' + cid, {
                headers: { Authorization: 'Bearer ' + token }
            });
            // Optimistic removal
            setDetail(function (prev) {
                return Object.assign({}, prev, {
                    comments: (prev.comments || []).filter(function (c) { return c._id !== cid; })
                });
            });
        } catch (err) { console.error(err); }
    }

    // Bug 3 fix: Optimistic update insertion
    async function handleAddUpdate() {
        if (!updateText.trim()) return;
        var tempUpdate = {
            _id: 'temp_' + Date.now(),
            user: { _id: user._id || user.id, name: user.name, email: user.email },
            message: updateText,
            createdAt: new Date().toISOString()
        };

        // Optimistically add to UI immediately
        setDetail(function (prev) {
            return Object.assign({}, prev, {
                progressUpdates: [...(prev.progressUpdates || []), tempUpdate]
            });
        });
        var savedText = updateText;
        setUpdateText('');

        try {
            var token = localStorage.getItem('token');
            var res = await axios.post(API + '/api/objectives/' + goal._id + '/progress', { message: savedText }, {
                headers: { Authorization: 'Bearer ' + token }
            });
            // Replace with server version
            setDetail(res.data.objective || res.data);
        } catch (err) {
            // Rollback on error
            setDetail(function (prev) {
                return Object.assign({}, prev, {
                    progressUpdates: (prev.progressUpdates || []).filter(function (u) { return u._id !== tempUpdate._id; })
                });
            });
            setUpdateText(savedText);
            console.error(err);
        }
    }

    function getKpiProgress(kpi) {
        if (kpi.metricType === 'boolean') return kpi.currentValue >= 1 ? 100 : 0;
        var range = kpi.targetValue - kpi.initialValue;
        if (range <= 0) return 100;
        return Math.min(100, Math.max(0, ((kpi.currentValue - kpi.initialValue) / range) * 100));
    }

    function formatDate(d) { return d ? new Date(d).toLocaleDateString() : '—'; }
    function formatDateTime(d) { return d ? new Date(d).toLocaleString() : '—'; }

    var tabs = ['details', 'kpis', 'alignment', 'updates', 'comments', 'settings'];

    return (
        <div className="goal-panel-overlay" onClick={onClose}>
            <div className="goal-panel" onClick={function (e) { e.stopPropagation(); }}>
                {/* Header */}
                <div className="goal-panel__header">
                    <div className="goal-panel__header-top">
                        <h2>{detail.title}</h2>
                        <button className="goal-panel__close" onClick={onClose}>✕</button>
                    </div>
                    <p className="goal-panel__desc">{detail.description || 'No description'}</p>
                    <div className="goal-panel__progress-row">
                        <div style={{ flex: 1 }}><GoalProgressBar percent={detail.achievementPercent || 0} /></div>
                        <GoalStatusBadge status={detail.goalStatus || 'no_status'} />
                        <button className="submit-btn" style={{ padding: '6px 12px', fontSize: '0.85rem' }} onClick={function() { setShowCheckInModal(true); }}>
                            Update Progress
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="goal-panel__tabs">
                    {tabs.map(function (tab) {
                        return (
                            <button key={tab} className={'goal-panel__tab' + (activeTab === tab ? ' goal-panel__tab--active' : '')} onClick={function () { setActiveTab(tab); }}>
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                        );
                    })}
                </div>

                {/* Tab content */}
                <div className="goal-panel__content">
                    {activeTab === 'details' && (
                        <div className="goal-panel__details">
                            <div className="goal-panel__detail-row"><span>Owner:</span><span>{detail.owner?.name || 'Unknown'}</span></div>
                            <div className="goal-panel__detail-row"><span>Category:</span><span>{detail.category || 'individual'}</span></div>
                            <div className="goal-panel__detail-row"><span>Weight:</span><span>{detail.weight}%</span></div>
                            <div className="goal-panel__detail-row"><span>Start Date:</span><span>{formatDate(detail.startDate)}</span></div>
                            <div className="goal-panel__detail-row"><span>End Date:</span><span>{formatDate(detail.deadline)}</span></div>
                            <div className="goal-panel__detail-row"><span>Visibility:</span><span>{detail.visibility || 'public'}</span></div>
                            <div className="goal-panel__detail-row"><span>Labels:</span><span>{(detail.labels || []).join(', ') || 'None'}</span></div>
                            {detail.successIndicator && <div className="goal-panel__detail-row"><span>Success Indicator:</span><span>{detail.successIndicator}</span></div>}
                            {detail.parentObjective && <div className="goal-panel__detail-row"><span>Parent Goal:</span><span>{detail.parentObjective.title || detail.parentObjective}</span></div>}
                        </div>
                    )}

                    {activeTab === 'kpis' && (
                        <div className="goal-panel__kpis">
                            <div className="goal-panel__kpi-header">
                                <h3>Key Results / KPIs ({(detail.kpis || []).length})</h3>
                                <div style={{display:'flex', gap:'8px'}}>
                                    <button className="goal-panel__add-btn" onClick={handleSuggestKpis} style={{ backgroundColor: '#8b5cf6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '4px 10px' }} title="Let AI suggest SMART KPIs">✨ AI Suggest</button>
                                    <button className="goal-panel__add-btn" onClick={function () { setShowKpiForm(!showKpiForm); }}>+ Add KPI</button>
                                </div>
                            </div>

                            {showKpiForm && (
                                <form className="goal-panel__kpi-form" onSubmit={handleAddKpi}>
                                    <input type="text" placeholder="KPI Title" value={kpiForm.title} onChange={function (e) { setKpiForm(Object.assign({}, kpiForm, { title: e.target.value })); }} required />
                                    <select value={kpiForm.metricType} onChange={function (e) { setKpiForm(Object.assign({}, kpiForm, { metricType: e.target.value })); }}>
                                        <option value="percent">Percent</option>
                                        <option value="number">Number</option>
                                        <option value="currency">Currency</option>
                                        <option value="boolean">Boolean</option>
                                        <option value="milestone">Milestone</option>
                                    </select>
                                    <div className="goal-panel__kpi-form-row">
                                        <input type="number" placeholder="Initial" value={kpiForm.initialValue} onChange={function (e) { setKpiForm(Object.assign({}, kpiForm, { initialValue: parseFloat(e.target.value) })); }} />
                                        <input type="number" placeholder="Target" value={kpiForm.targetValue} onChange={function (e) { setKpiForm(Object.assign({}, kpiForm, { targetValue: parseFloat(e.target.value) })); }} />
                                        <input type="text" placeholder="Unit" value={kpiForm.unit} onChange={function (e) { setKpiForm(Object.assign({}, kpiForm, { unit: e.target.value })); }} />
                                    </div>
                                    <div className="goal-panel__kpi-form-actions">
                                        <button type="submit">Add</button>
                                        <button type="button" onClick={function () { setShowKpiForm(false); }}>Cancel</button>
                                    </div>
                                </form>
                            )}

                            <div className="goal-panel__kpi-list">
                                {(detail.kpis || []).length === 0 ? (
                                    <p className="goal-panel__empty">No KPIs defined. Add key results to track progress.</p>
                                ) : (
                                    (detail.kpis || []).map(function (kpi) {
                                        var progress = getKpiProgress(kpi);
                                        var localVal = kpiLocalValues[kpi._id] !== undefined ? kpiLocalValues[kpi._id] : kpi.currentValue;
                                        return (
                                            <div key={kpi._id} className="goal-panel__kpi-item">
                                                <div className="goal-panel__kpi-top">
                                                    <span className="goal-panel__kpi-title">{kpi.title}</span>
                                                    <span className="goal-panel__kpi-type">{kpi.metricType}</span>
                                                    <button className="goal-panel__kpi-delete" onClick={function () { handleDeleteKpi(kpi._id); }}>✕</button>
                                                </div>
                                                <GoalProgressBar percent={progress} size="small" />
                                                <div className="goal-panel__kpi-values">
                                                    <span>Current: <input type="number" className="goal-panel__kpi-input" value={localVal} onChange={function (e) { handleKpiLocalChange(kpi._id, e.target.value); }} /></span>
                                                    <span>Target: {kpi.targetValue} {kpi.unit}</span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'alignment' && (
                        <div className="goal-panel__alignment">
                            <h3 style={{ marginBottom: '4px' }}>Goal Alignment</h3>
                            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '16px' }}>See how this goal aligns upward to team goals and downward to sub-goals.</p>
                            <GoalAlignmentTree rootGoal={detail} />
                        </div>
                    )}

                    {activeTab === 'updates' && (
                        <div className="goal-panel__updates">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <h3 style={{ margin: 0 }}>Progress Updates (Check-ins)</h3>
                                <button className="submit-btn" style={{ padding: '6px 14px', fontSize: '0.85rem' }} onClick={function() { setShowCheckInModal(true); }}>+ Check-in</button>
                            </div>
                            {(detail.progressUpdates || []).length === 0 ? (
                                <p className="goal-panel__empty">No updates yet.</p>
                            ) : (
                                (detail.progressUpdates || []).slice().reverse().map(function (upd, i) {
                                    return (
                                        <div key={upd._id || i} className="goal-panel__update-item">
                                            <div className="goal-panel__update-header">
                                                <strong>{upd.user?.name || 'Unknown'}</strong>
                                                <span>{formatDateTime(upd.createdAt)}</span>
                                            </div>
                                            <p>{upd.message}</p>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}

                    {activeTab === 'comments' && (
                        <div className="goal-panel__comments">
                            <h3>Comments</h3>
                            <div className="goal-panel__add-comment">
                                <textarea placeholder="Write a comment..." value={commentText} onChange={function (e) { setCommentText(e.target.value); }} rows={2}></textarea>
                                <button onClick={handleAddComment} disabled={!commentText.trim()}>Add Comment</button>
                            </div>
                            {(detail.comments || []).length === 0 ? (
                                <p className="goal-panel__empty">No comments.</p>
                            ) : (
                                (detail.comments || []).slice().reverse().map(function (c) {
                                    return (
                                        <div key={c._id} className="goal-panel__comment-item">
                                            <div className="goal-panel__comment-header">
                                                <strong>{c.user?.name || 'Unknown'}</strong>
                                                <span>{formatDateTime(c.createdAt)}</span>
                                                {(c.user?._id === user._id || c.user?._id === user.id) && <button className="goal-panel__comment-delete" onClick={function () { handleDeleteComment(c._id); }}>✕</button>}
                                            </div>
                                            <p>{c.text}</p>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div className="goal-panel__settings">
                            <h3>Goal Settings</h3>
                            <div className="goal-panel__setting-row">
                                <label>Goal Status:</label>
                                <select value={newStatus} onChange={function (e) { setNewStatus(e.target.value); }}>
                                    <option value="no_status">No Status</option>
                                    <option value="on_track">On Track</option>
                                    <option value="at_risk">At Risk</option>
                                    <option value="off_track">Off Track</option>
                                    <option value="closed">Closed</option>
                                    <option value="achieved">Achieved</option>
                                </select>
                                <button onClick={handleStatusChange}>Update</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {showCheckInModal && (
                <CheckInModal 
                    goal={detail} 
                    onClose={function() { setShowCheckInModal(false); }}
                    onCheckInComplete={function() {
                        setShowCheckInModal(false);
                        fetchDetail();
                        if (onRefresh) onRefresh();
                    }}
                />
            )}
        </div>
    );
}

export default GoalDetailsPanel;
