import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../components/AuthContext';
import GoalFilters from '../components/goals/GoalFilters';
import GoalProgressSummary from '../components/goals/GoalProgressSummary';
import GoalTable from '../components/goals/GoalTable';
import GoalDetailsPanel from '../components/goals/GoalDetailsPanel';
import CreateGoalModal from '../components/goals/CreateGoalModal';
import EditGoalModal from '../components/goals/EditGoalModal';
import ViewSwitcher from '../components/goals/ViewSwitcher';

var API = 'http://localhost:5000';

function GoalsPage() {
    var { user } = useAuth();
    var [objectives, setObjectives] = useState([]);
    var [individualObjectives, setIndividualObjectives] = useState([]);
    var [teamObjectives, setTeamObjectives] = useState([]);
    var [validation, setValidation] = useState(null);
    var [cycles, setCycles] = useState([]);
    var [selectedCycle, setSelectedCycle] = useState('');
    var [activeTab, setActiveTab] = useState('my');
    var [activeView, setActiveView] = useState('list');
    var [statusFilter, setStatusFilter] = useState(null);
    var [searchTerm, setSearchTerm] = useState('');
    var [selectedGoal, setSelectedGoal] = useState(null);
    var [showCreateModal, setShowCreateModal] = useState(false);
    var [loading, setLoading] = useState(true);

    // Edit/Delete modales
    var [showEditModal, setShowEditModal] = useState(false);
    var [editingObjective, setEditingObjective] = useState(null);
    var [deletingObjective, setDeletingObjective] = useState(null);

    var [error, setError] = useState('');
    var [success, setSuccess] = useState('');

    useEffect(function () { fetchCycles(); }, []);
    useEffect(function () { fetchObjectives(); }, [selectedCycle, activeTab]);
    useEffect(function () {
        if (success) { var t = setTimeout(function () { setSuccess(''); }, 3000); return function () { clearTimeout(t); }; }
    }, [success]);
    useEffect(function () {
        if (error) { var t = setTimeout(function () { setError(''); }, 5000); return function () { clearTimeout(t); }; }
    }, [error]);

    async function fetchCycles() {
        try {
            var res = await axios.get(API + '/api/cycles');
            setCycles(res.data);
            var active = res.data.filter(function (c) { return c.status === 'active'; });
            if (active.length > 0) setSelectedCycle(active[0]._id);
        } catch (err) { console.error(err); }
    }

    async function fetchObjectives() {
        setLoading(true);
        try {
            var result = [];
            var indArr = [];
            var tmArr = [];
            if (activeTab === 'my') {
                if (selectedCycle) {
                    var structRes = await axios.get(API + '/api/objectives/user/' + user._id + '/cycle/' + selectedCycle);
                    indArr = structRes.data.individualObjectives || [];
                    tmArr = structRes.data.teamObjectives || [];
                    setIndividualObjectives(indArr);
                    setTeamObjectives(tmArr);
                    setValidation(structRes.data.validation || null);
                    result = indArr; // Only individual goals in 'My Goals'
                } else {
                    var res = await axios.get(API + '/api/objectives/my');
                    var data = res.data;
                    var allData = Array.isArray(data) ? data : (data.objectives || []);
                    indArr = allData.filter(function (o) { return o.category !== 'team'; });
                    tmArr = allData.filter(function (o) { return o.category === 'team'; });
                    setIndividualObjectives(indArr);
                    setTeamObjectives(tmArr);
                    setValidation(null);
                    result = indArr; // Only individual goals in 'My Goals'
                }
            } else {
                var params = {};
                if (selectedCycle) params.cycle = selectedCycle;
                if (activeTab === 'team') params.scope = 'team';
                var res2 = await axios.get(API + '/api/objectives', { params: params });
                var data2 = res2.data;
                var allData2 = [];
                if (data2.objectives) { allData2 = data2.objectives; }
                else if (data2.individualObjectives || data2.teamObjectives) { allData2 = [].concat(data2.individualObjectives || [], data2.teamObjectives || []); }
                else if (Array.isArray(data2)) { allData2 = data2; }
                
                indArr = allData2.filter(function (o) { return o.category !== 'team'; });
                tmArr = allData2.filter(function (o) { return o.category === 'team'; });
                setIndividualObjectives(indArr);
                setTeamObjectives(tmArr);
                setValidation(null);
                result = tmArr; // Only team goals in 'Team' page
            }
            setObjectives(result);
        } catch (err) {
            console.error(err);
            setObjectives([]); setIndividualObjectives([]); setTeamObjectives([]); setValidation(null);
        } finally { setLoading(false); }
    }

    // ---- CRUD ----
    function openDeleteModal(id) {
        setDeletingObjective(id);
    }

    async function handleDeleteConfirm() {
        if (!deletingObjective) return;
        try {
            await axios.delete(API + '/api/objectives/' + deletingObjective);
            setSuccess('Goal deleted successfully!');
            if (selectedGoal && selectedGoal._id === deletingObjective) setSelectedGoal(null);
            setDeletingObjective(null);
            fetchObjectives();
        } catch (err) { setError(err.response?.data?.message || 'Failed to delete'); }
    }

    async function handleDuplicate(id) {
        try {
            await axios.post(API + '/api/objectives/' + id + '/duplicate');
            setSuccess('Goal duplicated!');
            fetchObjectives();
        } catch (err) { setError(err.response?.data?.message || 'Failed to duplicate'); }
    }

    function openEditModal(obj) {
        setEditingObjective(obj);
        setShowEditModal(true);
    }

    function onGoalUpdated() {
        setSuccess('Goal updated successfully!');
        fetchObjectives();
    }

    // ---- Helpers ----
    var rejectedCount = validation ? (validation.totalRejected || 0) : 0;
    var filteredObjectives = statusFilter
        ? objectives.filter(function (o) { return (o.goalStatus || 'no_status') === statusFilter; })
        : objectives;
        
    if (searchTerm) {
        var lower = searchTerm.toLowerCase();
        filteredObjectives = filteredObjectives.filter(function(o) { 
            return (o.title && o.title.toLowerCase().includes(lower)) || 
                   (o.description && o.description.toLowerCase().includes(lower)) ||
                   (o.category && o.category.toLowerCase().includes(lower)) ||
                   (o.owner && o.owner.name && o.owner.name.toLowerCase().includes(lower))
        });
    }

    // ---- Submission Logic ----
    var isDraftCycle = individualObjectives.length > 0 && individualObjectives.every(function (o) { return o.status === 'draft' || o.status === 'rejected'; });
    var totalWeight = individualObjectives.reduce(function (sum, o) { return sum + (o.weight || 0); }, 0);
    var validCount = individualObjectives.length >= 3 && individualObjectives.length <= 10;
    var canSubmit = validCount && totalWeight === 100 && isDraftCycle;

    async function handleSubmitCycle() {
        if (!window.confirm('Submit these goals? Once submitted, they cannot be structurally edited.')) return;
        try {
            var token = localStorage.getItem('token');
            await axios.post(API + '/api/objectives/submit', { cycle: selectedCycle }, { headers: { Authorization: `Bearer ${token}` } });
            setSuccess('Goals submitted successfully!');
            fetchObjectives();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit goals.');
        }
    }

    function getGroupedByUser() {
        var groups = {};
        filteredObjectives.forEach(function (obj) {
            var key = obj.owner?._id || 'unknown';
            if (!groups[key]) groups[key] = { name: obj.owner?.name || 'Unknown', goals: [] };
            groups[key].goals.push(obj);
        });
        return Object.values(groups);
    }

    return (
        <div className="goals-page">
            <div className="goals-page__header">
                <div className="goals-page__header-left">
                    <h1>🎯 Goals</h1>
                    <span className="goals-page__count">{filteredObjectives.length} goals</span>
                </div>
                <div className="goals-page__header-right">
                    <ViewSwitcher activeView={activeView} onChange={setActiveView} />
                    {objectives.length < 10 ? (
                        <button className="goals-page__new-btn" onClick={function () { setShowCreateModal(true); }}>+ New Goal</button>
                    ) : (
                        <button className="goals-page__new-btn" disabled style={{ opacity: 0.5, cursor: 'not-allowed' }} title="Maximum 10 goals allowed">Max Goals Reached</button>
                    )}
                </div>
            </div>

            <GoalFilters 
                activeTab={activeTab} 
                onTabChange={setActiveTab} 
                cycles={cycles} 
                selectedCycle={selectedCycle} 
                onCycleChange={setSelectedCycle} 
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
            />
            <GoalProgressSummary objectives={objectives} statusFilter={statusFilter} onStatusFilter={setStatusFilter} />

            {activeTab === 'my' && selectedCycle && isDraftCycle && (
                <div className="submission-panel" style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '8px', marginBottom: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h3 style={{ margin: '0 0 10px 0', fontSize: '1.2rem', color: '#1e293b' }}>🚀 Goal Submission</h3>
                        <div style={{ display: 'flex', gap: '20px', fontSize: '0.95rem' }}>
                            <div style={{ color: totalWeight === 100 ? '#27ae60' : '#e74c3c' }}>
                                <strong>Weight Capacity:</strong> {totalWeight}% / 100%
                            </div>
                            <div style={{ color: validCount ? '#27ae60' : '#e74c3c' }}>
                                <strong>Goals Count:</strong> {individualObjectives.length} (Req: 3-10)
                            </div>
                        </div>
                    </div>
                    {canSubmit && (
                        <button onClick={handleSubmitCycle} style={{ backgroundColor: '#3b82f6', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                            Submit Goals
                        </button>
                    )}
                </div>
            )}

            {activeTab === 'my' && validation && (
                <div className="validation-panel">
                    <h3>📊 Score Summary</h3>
                    <div className="validation-panel__formula">
                        <strong>Formula:</strong> Final Score = (Individual Score × 70%) + (Team Score × 30%) = max 100
                    </div>
                    <div className="validation-panel__grid">
                        <div className="validation-panel__box">
                            <h4>Individual (70%)</h4>
                            <div className="validation-stats">
                                <div className="validation-stat"><span className="stat-label">Count:</span><span className={'stat-value ' + (validation.isValidIndividualCount ? 'valid' : 'invalid')}>{validation.individualCount} (min {validation.minIndividualObjectives})</span></div>
                                <div className="validation-stat"><span className="stat-label">Weight:</span><span className={'stat-value ' + (validation.isValidIndividualWeight ? 'valid' : 'invalid')}>{validation.individualWeight} / {validation.requiredCategoryTotal}</span></div>
                                <div className="validation-stat"><span className="stat-label">Validated:</span><span className="stat-value">{validation.individualValidatedCount} / {validation.individualCount}</span></div>
                                {validation.individualRejectedCount > 0 && (<div className="validation-stat rejected"><span className="stat-label">Rejected:</span><span className="stat-value">{validation.individualRejectedCount}</span></div>)}
                                <div className="validation-stat"><span className="stat-label">Score:</span><span className="stat-value">{validation.individualScore} / 100</span></div>
                            </div>
                        </div>
                        <div className="validation-panel__box">
                            <h4>Team (30%)</h4>
                            <div className="validation-stats">
                                <div className="validation-stat"><span className="stat-label">Count:</span><span className="stat-value">{validation.teamCount}</span></div>
                                <div className="validation-stat"><span className="stat-label">Weight:</span><span className={'stat-value ' + (validation.isValidTeamWeight ? 'valid' : 'invalid')}>{validation.teamWeight} / {validation.requiredCategoryTotal}</span></div>
                                <div className="validation-stat"><span className="stat-label">Validated:</span><span className="stat-value">{validation.teamValidatedCount} / {validation.teamCount}</span></div>
                                <div className="validation-stat"><span className="stat-label">Score:</span><span className="stat-value">{validation.teamScore} / 100</span></div>
                            </div>
                        </div>
                    </div>
                    {validation.allValidated && (
                        <div className="validation-success" style={{ marginTop: '12px' }}>
                            ✅ All objectives validated! Final Score: <strong>{validation.compositeScore} / 100</strong>
                            <div style={{ fontSize: '12px', color: '#555' }}>= ({validation.individualScore} × 70%) + ({validation.teamScore} × 30%)</div>
                        </div>
                    )}
                </div>
            )}

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}
            {rejectedCount > 0 && (
                <div className="rejected-banner">
                    <span className="rejected-banner-icon">!</span>
                    <div className="rejected-banner-content">
                        <strong>Action Required!</strong>
                        <p>You have {rejectedCount} rejected objective(s) that need revision.</p>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="goals-page__loading"><div className="dash-loading__spinner"></div><p>Loading goals...</p></div>
            ) : (
                <div className="goals-page__content">
                    {activeView === 'list' && (
                        <GoalTable
                            objectives={filteredObjectives}
                            onGoalClick={setSelectedGoal}
                            onStatusChange={fetchObjectives}
                            onDelete={openDeleteModal}
                            onDuplicate={handleDuplicate}
                            onEdit={openEditModal}
                        />
                    )}
                    {activeView === 'feed' && (
                        <div className="goals-page__feed">
                            {filteredObjectives.length === 0 && <p className="goal-panel__empty">No activity to show.</p>}
                            {filteredObjectives.map(function (obj) {
                                return (
                                    <div key={obj._id} className="goals-feed-card" onClick={function () { setSelectedGoal(obj); }}>
                                        <div className="goals-feed-card__header">
                                            <strong>{obj.owner?.name || 'Unknown'}</strong>
                                            <span>{new Date(obj.updatedAt || obj.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <h4>{obj.title}</h4>
                                        <p>{obj.description || 'No description'}</p>
                                        <div className="goals-feed-card__footer">
                                            <span>{(obj.achievementPercent || 0).toFixed(0)}% complete</span>
                                            <span className="goals-feed-card__status" style={{ color: obj.goalStatus === 'on_track' ? '#059669' : obj.goalStatus === 'at_risk' ? '#D97706' : '#9CA3AF' }}>
                                                {obj.goalStatus || 'no status'}
                                            </span>
                                        </div>
                                        <div className="goals-feed-card__actions">
                                            <button onClick={function (e) { e.stopPropagation(); openEditModal(obj); }}>✏️ Edit</button>
                                            <button onClick={function (e) { e.stopPropagation(); openDeleteModal(obj._id); }} className="goals-feed-card__delete">🗑️ Delete</button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    {activeView === 'user' && (
                        <div className="goals-page__user-view">
                            {getGroupedByUser().map(function (group, i) {
                                return (
                                    <div key={i} className="goals-user-group">
                                        <h3 className="goals-user-group__name">👤 {group.name} ({group.goals.length})</h3>
                                        <GoalTable
                                            objectives={group.goals}
                                            onGoalClick={setSelectedGoal}
                                            onStatusChange={fetchObjectives}
                                            onDelete={openDeleteModal}
                                            onDuplicate={handleDuplicate}
                                            onEdit={openEditModal}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Goal Details Panel */}
            {selectedGoal && (
                <GoalDetailsPanel
                    goal={selectedGoal}
                    onClose={function () { setSelectedGoal(null); }}
                    onRefresh={fetchObjectives}
                />
            )}

            {/* Create Goal Modal */}
            {showCreateModal && (
                <CreateGoalModal
                    onClose={function () { setShowCreateModal(false); }}
                    onCreated={fetchObjectives}
                    cycles={cycles}
                    selectedCycle={selectedCycle}
                    parentGoals={objectives.filter(function (o) { return !o.parentObjective; })}
                    existingObjectives={[].concat(individualObjectives, teamObjectives)}
                />
            )}

            {/* Rich Edit Goal Modal */}
            {showEditModal && editingObjective && (
                <EditGoalModal
                    goal={editingObjective}
                    onClose={function () { setShowEditModal(false); setEditingObjective(null); }}
                    onUpdated={onGoalUpdated}
                    cycles={cycles}
                    parentGoals={objectives.filter(function (o) { return !o.parentObjective; })}
                    existingObjectives={[].concat(individualObjectives, teamObjectives)}
                />
            )}

            {/* Custom Delete Confirmation Modal */}
            {deletingObjective && (
                <div className="goal-modal-overlay" onClick={function () { setDeletingObjective(null); }}>
                    <div className="delete-confirm-modal" onClick={function (e) { e.stopPropagation(); }}>
                        <div className="delete-confirm-modal__icon">🗑️</div>
                        <h3>Delete Goal</h3>
                        <p>Are you sure you want to delete this goal? This action cannot be undone.</p>
                        <div className="delete-confirm-modal__actions">
                            <button className="goal-modal__cancel" onClick={function () { setDeletingObjective(null); }}>Cancel</button>
                            <button className="delete-confirm-modal__btn" onClick={handleDeleteConfirm}>Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default GoalsPage;
