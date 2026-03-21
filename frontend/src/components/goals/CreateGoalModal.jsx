import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../AuthContext';

var API = 'http://localhost:5000';

function CreateGoalModal({ onClose, onCreated, cycles, selectedCycle, parentGoals, existingObjectives }) {
    var { user } = useAuth();
    var [form, setForm] = useState({
        title: '',
        description: '',
        successIndicator: '',
        weight: 20,
        deadline: '',
        startDate: '',
        cycle: selectedCycle || '',
        category: 'individual',
        labels: '',
        visibility: 'public',
        parentObjective: '',
        goalStatus: 'no_status',
        targetUser: '',
        targetTeam: ''
    });
    var [error, setError] = useState('');
    var [loading, setLoading] = useState(false);
    var [availableTeams, setAvailableTeams] = useState([]);
    var [availableUsers, setAvailableUsers] = useState([]);

    useEffect(() => {
        if (user.role === 'TEAM_LEADER' || user.role === 'ADMIN' || user.role === 'HR') {
            const fetchAssignmentData = async () => {
                try {
                    const token = localStorage.getItem('token');
                    if (token) {
                        const res = await axios.get(API + '/api/teams', {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        const teamsData = res.data;
                        setAvailableTeams(teamsData);
                        
                        let usersMap = new Map();
                        teamsData.forEach(t => {
                            if (t.members) t.members.forEach(m => usersMap.set(m._id, m));
                        });
                        setAvailableUsers(Array.from(usersMap.values()));
                    }
                } catch (err) {
                    console.error("Failed to fetch assignment data", err);
                }
            };
            fetchAssignmentData();
        }
    }, [user.role]);

    // Smart weight calculation (Bug 7 fix)
    var currentCycleObjectives = (existingObjectives || []).filter(function(o) {
        var objCycleId = o.cycle?._id || o.cycle;
        return objCycleId === (form.cycle || selectedCycle) && o.category === form.category;
    });
    var usedWeight = currentCycleObjectives.reduce(function(sum, o) { return sum + (o.weight || 0); }, 0);
    var remainingWeight = Math.max(0, 100 - usedWeight);
    var maxWeight = Math.min(100, remainingWeight);

    function handleChange(field, value) {
        setForm(function (prev) {
            var next = Object.assign({}, prev);
            next[field] = value;
            return next;
        });
    }

    async function handleAIGenerate(e) {
        e.preventDefault();
        setLoading(true);
        try {
            var token = localStorage.getItem('token');
            var res = await axios.post(API + '/api/ai/generate-goal', {
                department: user.department || 'General',
                context: form.title || ''
            }, { headers: { Authorization: `Bearer ${token}` } });
            
            var suggestedWeight = Math.min(res.data.weight || 20, remainingWeight);
            setForm(prev => ({
                ...prev,
                title: res.data.title || prev.title,
                description: res.data.description || prev.description,
                successIndicator: res.data.successIndicator || prev.successIndicator,
                weight: suggestedWeight
            }));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');

        // Validate weight doesn't exceed remaining
        var newWeight = parseInt(form.weight);
        if (newWeight > remainingWeight) {
            setError('Weight (' + newWeight + '%) exceeds remaining capacity (' + remainingWeight + '%). Adjust your weight.');
            return;
        }

        setLoading(true);
        try {
            var payload = {
                title: form.title,
                description: form.description,
                successIndicator: form.successIndicator || form.title,
                weight: newWeight,
                deadline: form.deadline || null,
                startDate: form.startDate || null,
                cycle: form.cycle,
                category: form.category,
                labels: form.labels ? form.labels.split(',').map(function (l) { return l.trim(); }).filter(Boolean) : [],
                visibility: form.visibility,
                parentObjective: form.parentObjective || null,
                goalStatus: form.goalStatus,
                targetUser: form.targetUser || null,
                targetTeam: form.targetTeam || null
            };
            await axios.post(API + '/api/objectives', payload);
            if (onCreated) onCreated();
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create goal');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="goal-modal-overlay" onClick={onClose}>
            <div className="goal-modal" onClick={function (e) { e.stopPropagation(); }}>
                <div className="goal-modal__header">
                    <h2>Create New Goal</h2>
                    <button className="goal-modal__close" onClick={onClose}>✕</button>
                </div>

                {error && <div className="goal-modal__error">{error}</div>}

                <form className="goal-modal__form" onSubmit={handleSubmit}>
                    {/* Bug 6 fix: Prominent Goal Type selector */}
                    <div className="goal-modal__field">
                        <label>Goal Type *</label>
                        <div className="goal-type-selector">
                            <div
                                className={'goal-type-card' + (form.category === 'individual' ? ' goal-type-card--active' : '')}
                                onClick={function() { handleChange('category', 'individual'); }}
                            >
                                <div className="goal-type-card__icon">🧑</div>
                                <div className="goal-type-card__label">Individual Goal</div>
                                <div className="goal-type-card__desc">Assigned to a specific person</div>
                            </div>
                            {(user.role === 'TEAM_LEADER' || user.role === 'ADMIN') && (
                                <div
                                    className={'goal-type-card' + (form.category === 'team' ? ' goal-type-card--active' : '')}
                                    onClick={function() { handleChange('category', 'team'); }}
                                >
                                    <div className="goal-type-card__icon">👥</div>
                                    <div className="goal-type-card__label">Team Goal</div>
                                    <div className="goal-type-card__desc">Distributed to all team members</div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="goal-modal__field">
                        <label>Goal Title *</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input type="text" value={form.title} onChange={function (e) { handleChange('title', e.target.value); }} placeholder="e.g. Achieve Company Growth" required minLength={5} maxLength={100} style={{ flex: 1 }} />
                            <button type="button" onClick={handleAIGenerate} disabled={loading} className="goal-modal__ai-btn" title="Let AI write a SMART goal for you based on title/department">
                                ✨ AI Assist
                            </button>
                        </div>
                    </div>

                    <div className="goal-modal__field">
                        <label>Description</label>
                        <textarea value={form.description} onChange={function (e) { handleChange('description', e.target.value); }} placeholder="Describe this goal..." rows={3}></textarea>
                    </div>

                    <div className="goal-modal__field">
                        <label>Success Indicator (SMART)</label>
                        <textarea value={form.successIndicator} onChange={function (e) { handleChange('successIndicator', e.target.value); }} placeholder="What does success look like? (min 10 chars)" rows={2} minLength={10}></textarea>
                    </div>

                    <div className="goal-modal__row">
                        <div className="goal-modal__field">
                            <label>Cycle *</label>
                            <select value={form.cycle} onChange={function (e) { handleChange('cycle', e.target.value); }} required>
                                <option value="">Select Cycle</option>
                                {cycles.map(function (c) { return <option key={c._id} value={c._id}>{c.name} ({c.year})</option>; })}
                            </select>
                        </div>
                        <div className="goal-modal__field">
                            <label>Initial Status</label>
                            <select value={form.goalStatus} onChange={function (e) { handleChange('goalStatus', e.target.value); }}>
                                <option value="no_status">No Status</option>
                                <option value="on_track">On Track</option>
                                <option value="at_risk">At Risk</option>
                                <option value="off_track">Off Track</option>
                            </select>
                        </div>
                    </div>

                    <div className="goal-modal__row">
                        {(user.role === 'TEAM_LEADER' || user.role === 'ADMIN' || user.role === 'HR') && form.category === 'individual' && (
                            <div className="goal-modal__field">
                                <label>Assign To (Collaborator)</label>
                                <select value={form.targetUser} onChange={function (e) { handleChange('targetUser', e.target.value); }}>
                                    <option value="">Myself</option>
                                    {availableUsers.map(function (u) { return <option key={u._id} value={u._id}>{u.name}</option>; })}
                                </select>
                            </div>
                        )}
                        {(user.role === 'TEAM_LEADER' || user.role === 'ADMIN' || user.role === 'HR') && form.category === 'team' && (
                            <div className="goal-modal__field">
                                <label>Target Team *</label>
                                <select value={form.targetTeam} onChange={function (e) { handleChange('targetTeam', e.target.value); }} required={form.category === 'team'}>
                                    <option value="">Select Team</option>
                                    {availableTeams
                                      .filter(function(t) { return user.role === 'ADMIN' || user.role === 'HR' || t.leader?._id === user.id; })
                                      .map(function (t) { return <option key={t._id} value={t._id}>{t.name}</option>; })}
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="goal-modal__row">
                        <div className="goal-modal__field">
                            <label>Start Date</label>
                            <input type="date" value={form.startDate} onChange={function (e) { handleChange('startDate', e.target.value); }} />
                        </div>
                        <div className="goal-modal__field">
                            <label>End Date</label>
                            <input type="date" value={form.deadline} onChange={function (e) { handleChange('deadline', e.target.value); }} />
                        </div>
                    </div>

                    {/* Bug 7 fix: Smart weight system */}
                    <div className="goal-modal__field">
                        <label>Weight: {form.weight}%</label>
                        <input type="range" min="1" max={maxWeight || 1} value={Math.min(form.weight, maxWeight)} onChange={function (e) { handleChange('weight', e.target.value); }} />
                        <div className="weight-capacity-bar">
                            <div className="weight-capacity-bar__track">
                                <div className="weight-capacity-bar__used" style={{ width: usedWeight + '%' }}></div>
                                <div className="weight-capacity-bar__new" style={{ width: Math.min(form.weight, remainingWeight) + '%', left: usedWeight + '%' }}></div>
                            </div>
                            <div className="weight-capacity-bar__labels">
                                <span>Used: {usedWeight}%</span>
                                <span>New: {form.weight}%</span>
                                <span>Remaining: {Math.max(0, remainingWeight - form.weight)}%</span>
                            </div>
                        </div>
                        {parseInt(form.weight) > remainingWeight && (
                            <div className="weight-warning">⚠️ Weight exceeds remaining capacity ({remainingWeight}% available)</div>
                        )}
                    </div>

                    <div className="goal-modal__row">
                        <div className="goal-modal__field">
                            <label>Labels (comma-separated)</label>
                            <input type="text" value={form.labels} onChange={function (e) { handleChange('labels', e.target.value); }} placeholder="e.g. Strategic, High Priority" />
                        </div>
                        <div className="goal-modal__field">
                            <label>Visibility</label>
                            <select value={form.visibility} onChange={function (e) { handleChange('visibility', e.target.value); }}>
                                <option value="public">Public</option>
                                <option value="team">Team</option>
                                <option value="department">Department</option>
                                <option value="private">Private</option>
                            </select>
                        </div>
                    </div>

                    {parentGoals && parentGoals.length > 0 && (
                        <div className="goal-modal__field">
                            <label>Parent Goal</label>
                            <select value={form.parentObjective} onChange={function (e) { handleChange('parentObjective', e.target.value); }}>
                                <option value="">None (Top-Level Goal)</option>
                                {parentGoals.map(function (p) { return <option key={p._id} value={p._id}>{p.title}</option>; })}
                            </select>
                        </div>
                    )}

                    <div className="goal-modal__actions">
                        <button type="submit" className="goal-modal__submit" disabled={loading || parseInt(form.weight) > remainingWeight}>{loading ? 'Creating...' : 'Create Goal'}</button>
                        <button type="button" className="goal-modal__cancel" onClick={onClose}>Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default CreateGoalModal;
