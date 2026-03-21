import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../components/AuthContext';

var API = 'http://localhost:5000';

function MeetingsPage() {
    var { user } = useAuth();
    var [meetings, setMeetings] = useState([]);
    var [users, setUsers] = useState([]);
    var [teams, setTeams] = useState([]);
    var [loading, setLoading] = useState(true);
    var [showModal, setShowModal] = useState(false);
    var [showDetail, setShowDetail] = useState(null);
    var [filter, setFilter] = useState('upcoming');
    var [error, setError] = useState('');
    var [success, setSuccess] = useState('');

    var [form, setForm] = useState({
        title: '', description: '', date: '', startTime: '09:00', endTime: '10:00',
        type: 'team', attendees: [], team: '', recurring: 'none', location: '',
    });

    async function fetchMeetings() {
        try {
            var params = {};
            if (filter === 'upcoming') params.upcoming = 'true';
            if (filter === 'completed') params.status = 'completed';
            if (filter === 'cancelled') params.status = 'cancelled';
            var res = await axios.get(API + '/api/meetings', { params });
            setMeetings(res.data.meetings || []);
        } catch (err) {
            console.error('Fetch meetings error:', err);
        } finally {
            setLoading(false);
        }
    }

    async function fetchUsers() {
        try {
            var res = await axios.get(API + '/api/users');
            setUsers(res.data.users || res.data || []);
        } catch (err) { console.error(err); }
    }

    async function fetchTeams() {
        try {
            var res = await axios.get(API + '/api/teams');
            setTeams(Array.isArray(res.data) ? res.data : res.data.teams || []);
        } catch (err) { console.error(err); }
    }

    useEffect(function () { fetchMeetings(); fetchUsers(); fetchTeams(); }, []);
    useEffect(function () { setLoading(true); fetchMeetings(); }, [filter]);
    useEffect(function () { if (success) { var t = setTimeout(function () { setSuccess(''); }, 3000); return function () { clearTimeout(t); }; } }, [success]);

    function openCreateModal() {
        setForm({ title: '', description: '', date: '', startTime: '09:00', endTime: '10:00', type: 'team', attendees: [], team: '', recurring: 'none', location: '' });
        setShowModal(true);
        setError('');
    }

    async function handleCreate(e) {
        e.preventDefault();
        setError('');
        try {
            await axios.post(API + '/api/meetings', form);
            setSuccess('Meeting created!');
            setShowModal(false);
            fetchMeetings();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create meeting');
        }
    }

    async function handleDelete(id) {
        try {
            await axios.delete(API + '/api/meetings/' + id);
            setSuccess('Meeting deleted');
            fetchMeetings();
            if (showDetail && showDetail._id === id) setShowDetail(null);
        } catch (err) { setError('Failed to delete meeting'); }
    }

    async function handleDuplicate(id) {
        try {
            await axios.post(API + '/api/meetings/' + id + '/duplicate');
            setSuccess('Meeting duplicated!');
            fetchMeetings();
        } catch (err) { setError('Failed to duplicate'); }
    }

    async function handleStatusChange(id, status) {
        try {
            await axios.put(API + '/api/meetings/' + id, { status });
            setSuccess('Status updated');
            fetchMeetings();
            if (showDetail && showDetail._id === id) {
                var res = await axios.get(API + '/api/meetings/' + id);
                setShowDetail(res.data.meeting);
            }
        } catch (err) { setError('Failed to update status'); }
    }

    async function handleAddNote(id, notes) {
        try {
            await axios.put(API + '/api/meetings/' + id, { notes });
            setSuccess('Notes saved');
            var res = await axios.get(API + '/api/meetings/' + id);
            setShowDetail(res.data.meeting);
        } catch (err) { setError('Failed to save notes'); }
    }

    function toggleAttendee(userId) {
        setForm(function (prev) {
            var arr = prev.attendees.slice();
            var idx = arr.indexOf(userId);
            if (idx > -1) arr.splice(idx, 1);
            else arr.push(userId);
            return Object.assign({}, prev, { attendees: arr });
        });
    }

    function formatDate(d) { return d ? new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : '—'; }
    function formatTime(t) { return t || '—'; }
    function getTypeIcon(type) { return { one_on_one: '👤', team: '👥', all_hands: '🏢', check_in: '✅', review: '📊', planning: '📋', other: '📌' }[type] || '📌'; }
    function getStatusColor(status) { return { scheduled: '#6c5ce7', in_progress: '#0984e3', completed: '#00b894', cancelled: '#d63031' }[status] || '#636e72'; }

    if (loading) return <div className="loading">Loading meetings...</div>;

    return (
        <div className="page">
            <div className="page-header">
                <h1>📅 Meetings</h1>
                <button onClick={openCreateModal} className="add-btn">+ New Meeting</button>
            </div>

            {/* Filter Tabs */}
            <div className="goals-tabs" style={{ marginBottom: '1.5rem' }}>
                {['upcoming', 'all', 'completed', 'cancelled'].map(function (f) {
                    return <button key={f}
                        className={'goals-tab' + (filter === f ? ' goals-tab--active' : '')}
                        onClick={function () { setFilter(f); }}
                    >{f.charAt(0).toUpperCase() + f.slice(1)}</button>;
                })}
            </div>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            {meetings.length === 0 ? (
                <div className="goals-table-empty">
                    <div className="goals-table-empty__icon">📅</div>
                    <h3>No meetings found</h3>
                    <p>Schedule your first meeting to get started</p>
                </div>
            ) : (
                <div className="meetings-grid">
                    {meetings.map(function (meeting) {
                        return (
                            <div key={meeting._id} className="meeting-card" onClick={function () { setShowDetail(meeting); }}>
                                <div className="meeting-card__header">
                                    <span className="meeting-card__type">{getTypeIcon(meeting.type)} {meeting.type.replace('_', ' ')}</span>
                                    <span className="meeting-card__status" style={{ background: getStatusColor(meeting.status) }}>{meeting.status}</span>
                                </div>
                                <h3 className="meeting-card__title">{meeting.title}</h3>
                                <div className="meeting-card__meta">
                                    <span>📅 {formatDate(meeting.date)}</span>
                                    <span>🕐 {formatTime(meeting.startTime)} – {formatTime(meeting.endTime)}</span>
                                </div>
                                {meeting.attendees && meeting.attendees.length > 0 && (
                                    <div className="meeting-card__attendees">
                                        {meeting.attendees.slice(0, 4).map(function (a) {
                                            return <span key={a._id} className="meeting-card__avatar" title={a.name}>{a.name ? a.name.charAt(0).toUpperCase() : '?'}</span>;
                                        })}
                                        {meeting.attendees.length > 4 && <span className="meeting-card__avatar meeting-card__avatar--more">+{meeting.attendees.length - 4}</span>}
                                    </div>
                                )}
                                {meeting.recurring !== 'none' && <span className="meeting-card__recurring">🔄 {meeting.recurring}</span>}
                                <div className="meeting-card__actions" onClick={function (e) { e.stopPropagation(); }}>
                                    {meeting.status === 'scheduled' && <button className="edit-btn" onClick={function () { handleStatusChange(meeting._id, 'in_progress'); }}>▶ Start</button>}
                                    {meeting.status === 'in_progress' && <button className="submit-btn small" onClick={function () { handleStatusChange(meeting._id, 'completed'); }}>✓ Complete</button>}
                                    <button className="view-btn" onClick={function () { handleDuplicate(meeting._id); }}>📋 Duplicate</button>
                                    <button className="delete-btn" onClick={function () { handleDelete(meeting._id); }}>🗑️</button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Create Modal */}
            {showModal && (
                <div className="goal-modal-overlay" onClick={function () { setShowModal(false); }}>
                    <div className="goal-modal" onClick={function (e) { e.stopPropagation(); }}>
                        <div className="goal-modal__header">
                            <h2>Create New Meeting</h2>
                            <button className="goal-modal__close" onClick={function () { setShowModal(false); }}>✕</button>
                        </div>
                        {error && <div className="goal-modal__error">{error}</div>}
                        <form className="goal-modal__form" onSubmit={handleCreate}>
                            <div className="goal-modal__field">
                                <label>Meeting Title *</label>
                                <input type="text" value={form.title} onChange={function (e) { setForm(Object.assign({}, form, { title: e.target.value })); }} placeholder="e.g. Weekly Team Sync" required />
                            </div>
                            <div className="goal-modal__field">
                                <label>Description</label>
                                <textarea value={form.description} onChange={function (e) { setForm(Object.assign({}, form, { description: e.target.value })); }} rows={2} placeholder="Meeting agenda overview..."></textarea>
                            </div>
                            <div className="goal-modal__row">
                                <div className="goal-modal__field">
                                    <label>Date *</label>
                                    <input type="date" value={form.date} onChange={function (e) { setForm(Object.assign({}, form, { date: e.target.value })); }} required />
                                </div>
                                <div className="goal-modal__field">
                                    <label>Type</label>
                                    <select value={form.type} onChange={function (e) { setForm(Object.assign({}, form, { type: e.target.value })); }}>
                                        <option value="team">Team</option>
                                        <option value="one_on_one">One-on-One</option>
                                        <option value="all_hands">All Hands</option>
                                        <option value="check_in">Check-in</option>
                                        <option value="review">Review</option>
                                        <option value="planning">Planning</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                            </div>
                            <div className="goal-modal__row">
                                <div className="goal-modal__field">
                                    <label>Start Time</label>
                                    <input type="time" value={form.startTime} onChange={function (e) { setForm(Object.assign({}, form, { startTime: e.target.value })); }} />
                                </div>
                                <div className="goal-modal__field">
                                    <label>End Time</label>
                                    <input type="time" value={form.endTime} onChange={function (e) { setForm(Object.assign({}, form, { endTime: e.target.value })); }} />
                                </div>
                            </div>
                            <div className="goal-modal__row">
                                <div className="goal-modal__field">
                                    <label>Recurring</label>
                                    <select value={form.recurring} onChange={function (e) { setForm(Object.assign({}, form, { recurring: e.target.value })); }}>
                                        <option value="none">None</option>
                                        <option value="daily">Daily</option>
                                        <option value="weekly">Weekly</option>
                                        <option value="biweekly">Bi-weekly</option>
                                        <option value="monthly">Monthly</option>
                                    </select>
                                </div>
                                <div className="goal-modal__field">
                                    <label>Location</label>
                                    <input type="text" value={form.location} onChange={function (e) { setForm(Object.assign({}, form, { location: e.target.value })); }} placeholder="Room / Link" />
                                </div>
                            </div>
                            {teams.length > 0 && (
                                <div className="goal-modal__field">
                                    <label>Team</label>
                                    <select value={form.team} onChange={function (e) { setForm(Object.assign({}, form, { team: e.target.value })); }}>
                                        <option value="">None</option>
                                        {teams.map(function (t) { return <option key={t._id} value={t._id}>{t.name}</option>; })}
                                    </select>
                                </div>
                            )}
                            <div className="goal-modal__field">
                                <label>Attendees</label>
                                <div className="members-selection" style={{ maxHeight: '150px', overflow: 'auto' }}>
                                    {users.map(function (u) {
                                        var isSelected = form.attendees.includes(u._id);
                                        return (
                                            <label key={u._id} className={'member-checkbox' + (isSelected ? ' selected' : '')}>
                                                <input type="checkbox" checked={isSelected} onChange={function () { toggleAttendee(u._id); }} />
                                                <span className="member-info">
                                                    <span className="member-name">{u.name}</span>
                                                    <span className="member-email">{u.email}</span>
                                                </span>
                                            </label>
                                        );
                                    })}
                                </div>
                                <p className="form-hint">Selected: {form.attendees.length} attendee(s)</p>
                            </div>
                            <div className="goal-modal__actions">
                                <button type="submit" className="goal-modal__submit">Create Meeting</button>
                                <button type="button" className="goal-modal__cancel" onClick={function () { setShowModal(false); }}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Detail Panel */}
            {showDetail && (
                <MeetingDetailPanel
                    meeting={showDetail}
                    onClose={function () { setShowDetail(null); }}
                    onRefresh={function () { fetchMeetings(); }}
                    onSaveNotes={handleAddNote}
                    onStatusChange={handleStatusChange}
                />
            )}
        </div>
    );
}

function MeetingDetailPanel({ meeting, onClose, onRefresh, onSaveNotes, onStatusChange }) {
    var [activeTab, setActiveTab] = useState('details');
    var [notes, setNotes] = useState(meeting.notes || '');
    var [detail, setDetail] = useState(meeting);

    useEffect(function () {
        fetchDetail();
    }, [meeting._id]);

    async function fetchDetail() {
        try {
            var res = await axios.get(API + '/api/meetings/' + meeting._id);
            setDetail(res.data.meeting || meeting);
            setNotes(res.data.meeting?.notes || meeting.notes || '');
        } catch (err) { console.error(err); }
    }

    function formatDate(d) { return d ? new Date(d).toLocaleDateString() : '—'; }
    function formatDateTime(d) { return d ? new Date(d).toLocaleString() : '—'; }

    var tabs = ['details', 'agenda', 'notes', 'actions'];

    return (
        <div className="goal-panel-overlay" onClick={onClose}>
            <div className="goal-panel" onClick={function (e) { e.stopPropagation(); }}>
                <div className="goal-panel__header">
                    <div className="goal-panel__header-top">
                        <h2>{detail.title}</h2>
                        <button className="goal-panel__close" onClick={onClose}>✕</button>
                    </div>
                    <p className="goal-panel__desc">{detail.description || 'No description'}</p>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                        {detail.status === 'scheduled' && <button className="edit-btn" onClick={function () { onStatusChange(detail._id, 'in_progress'); }}>▶ Start Meeting</button>}
                        {detail.status === 'in_progress' && <button className="submit-btn small" onClick={function () { onStatusChange(detail._id, 'completed'); }}>✓ Complete</button>}
                        <span style={{ background: '#6c5ce7', color: '#fff', padding: '4px 12px', borderRadius: '12px', fontSize: '12px' }}>{detail.status}</span>
                    </div>
                </div>

                <div className="goal-panel__tabs">
                    {tabs.map(function (tab) {
                        return <button key={tab} className={'goal-panel__tab' + (activeTab === tab ? ' goal-panel__tab--active' : '')} onClick={function () { setActiveTab(tab); }}>{tab.charAt(0).toUpperCase() + tab.slice(1)}</button>;
                    })}
                </div>

                <div className="goal-panel__content">
                    {activeTab === 'details' && (
                        <div className="goal-panel__details">
                            <div className="goal-panel__detail-row"><span>Organizer:</span><span>{detail.organizer?.name || 'Unknown'}</span></div>
                            <div className="goal-panel__detail-row"><span>Date:</span><span>{formatDate(detail.date)}</span></div>
                            <div className="goal-panel__detail-row"><span>Time:</span><span>{detail.startTime} – {detail.endTime}</span></div>
                            <div className="goal-panel__detail-row"><span>Type:</span><span>{detail.type?.replace('_', ' ')}</span></div>
                            <div className="goal-panel__detail-row"><span>Recurring:</span><span>{detail.recurring || 'None'}</span></div>
                            <div className="goal-panel__detail-row"><span>Location:</span><span>{detail.location || '—'}</span></div>
                            <div className="goal-panel__detail-row"><span>Team:</span><span>{detail.team?.name || '—'}</span></div>
                            <div className="goal-panel__detail-row"><span>Attendees:</span><span>{(detail.attendees || []).map(function (a) { return a.name; }).join(', ') || 'None'}</span></div>
                            {detail.relatedObjectives && detail.relatedObjectives.length > 0 && (
                                <div className="goal-panel__detail-row"><span>Linked Goals:</span><span>{detail.relatedObjectives.map(function (o) { return o.title; }).join(', ')}</span></div>
                            )}
                        </div>
                    )}

                    {activeTab === 'agenda' && (
                        <div className="goal-panel__kpis">
                            <h3>Agenda Items ({(detail.agenda || []).length})</h3>
                            {(detail.agenda || []).length === 0 ? (
                                <p className="goal-panel__empty">No agenda items. Add items when editing the meeting.</p>
                            ) : (
                                (detail.agenda || []).map(function (item, i) {
                                    return (
                                        <div key={i} className="goal-panel__kpi-item">
                                            <div className="goal-panel__kpi-top">
                                                <span className="goal-panel__kpi-title">{item.completed ? '✅' : '⬜'} {item.title}</span>
                                                <span className="goal-panel__kpi-type">{item.duration} min</span>
                                            </div>
                                            {item.notes && <p style={{ fontSize: '13px', color: '#666', margin: '4px 0 0' }}>{item.notes}</p>}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}

                    {activeTab === 'notes' && (
                        <div className="goal-panel__updates">
                            <h3>Meeting Notes</h3>
                            <textarea
                                className="goal-panel__notes-area"
                                value={notes}
                                onChange={function (e) { setNotes(e.target.value); }}
                                rows={10}
                                placeholder="Type meeting notes here..."
                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontFamily: 'inherit', fontSize: '14px', resize: 'vertical' }}
                            ></textarea>
                            <button style={{ marginTop: '8px' }} className="submit-btn small" onClick={function () { onSaveNotes(detail._id, notes); }}>💾 Save Notes</button>
                        </div>
                    )}

                    {activeTab === 'actions' && (
                        <div className="goal-panel__kpis">
                            <h3>Action Items ({(detail.actionItems || []).length})</h3>
                            {(detail.actionItems || []).length === 0 ? (
                                <p className="goal-panel__empty">No action items yet.</p>
                            ) : (
                                (detail.actionItems || []).map(function (item, i) {
                                    return (
                                        <div key={i} className="goal-panel__kpi-item">
                                            <div className="goal-panel__kpi-top">
                                                <span className="goal-panel__kpi-title">{item.completed ? '✅' : '⬜'} {item.title}</span>
                                                {item.assignee && <span className="goal-panel__kpi-type">{item.assignee.name}</span>}
                                            </div>
                                            {item.dueDate && <p style={{ fontSize: '12px', color: '#999', margin: '2px 0 0' }}>Due: {formatDate(item.dueDate)}</p>}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default MeetingsPage;
