import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../components/AuthContext';

function MyTeamPage() {
    var { user } = useAuth();
    var [team, setTeam] = useState(null);
    var [loading, setLoading] = useState(true);
    var [error, setError] = useState('');

    useEffect(function () {
        fetchMyTeam();
    }, []);

    async function fetchMyTeam() {
        setLoading(true);
        setError('');
        try {
            var res = await api.get('/api/teams/my-team');
            setTeam(res.data.team);
        } catch (err) {
            if (err.response && err.response.status === 404) {
                setError('You are not assigned to any team yet.');
            } else {
                setError('Failed to load team information.');
            }
        } finally {
            setLoading(false);
        }
    }

    function getInitials(name) {
        if (!name) return '?';
        return name.split(' ').map(function (w) { return w[0]; }).join('').toUpperCase().substring(0, 2);
    }

    function getAvatarColor(name) {
        if (!name) return '#6366f1';
        var colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#6366f1', '#ef4444', '#84cc16', '#f97316'];
        var hash = 0;
        for (var i = 0; i < name.length; i++) { hash = name.charCodeAt(i) + ((hash << 5) - hash); }
        return colors[Math.abs(hash) % colors.length];
    }

    var currentUserId = user._id || user.id;

    if (loading) {
        return (
            <div className="my-team-page">
                <div className="my-team-page__loading">
                    <div className="dash-loading__spinner"></div>
                    <p>Loading your team...</p>
                </div>
            </div>
        );
    }

    if (error || !team) {
        return (
            <div className="my-team-page">
                <div className="my-team-page__header">
                    <h1>👥 My Team</h1>
                </div>
                <div className="my-team-page__empty">
                    <div className="my-team-page__empty-icon">👥</div>
                    <h2>No Team Found</h2>
                    <p>{error || 'You have not been assigned to a team yet. Contact your administrator.'}</p>
                </div>
            </div>
        );
    }

    var leader = team.leader;
    var members = team.members || [];
    var isLeader = leader && String(leader._id) === String(currentUserId);
    var totalMembers = members.length + (leader ? 1 : 0);

    return (
        <div className="my-team-page">
            <div className="my-team-page__header">
                <div>
                    <h1>👥 My Team</h1>
                    <p className="my-team-page__subtitle">{team.name}</p>
                </div>
                <div className="my-team-page__stats">
                    <div className="my-team-page__stat">
                        <span className="my-team-page__stat-value">{totalMembers}</span>
                        <span className="my-team-page__stat-label">Total People</span>
                    </div>
                    <div className="my-team-page__stat">
                        <span className="my-team-page__stat-value">{members.length}</span>
                        <span className="my-team-page__stat-label">Members</span>
                    </div>
                </div>
            </div>

            {team.description && (
                <div className="my-team-page__description">
                    <p>{team.description}</p>
                </div>
            )}

            {/* Team Leader Card */}
            {leader && (
                <div className="my-team-page__section">
                    <h2 className="my-team-page__section-title">👔 Team Leader</h2>
                    <div className="my-team-page__leader-card">
                        <div className="my-team-page__avatar my-team-page__avatar--leader" style={{ backgroundColor: getAvatarColor(leader.name) }}>
                            {getInitials(leader.name)}
                        </div>
                        <div className="my-team-page__person-info">
                            <div className="my-team-page__person-name">
                                {leader.name}
                                <span className="my-team-page__leader-badge">👑 Team Leader</span>
                                {isLeader && <span className="my-team-page__you-badge">You</span>}
                            </div>
                            <div className="my-team-page__person-email">{leader.email}</div>
                            <div className="my-team-page__person-role">{leader.role}</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Team Members */}
            <div className="my-team-page__section">
                <h2 className="my-team-page__section-title">👤 Team Members ({members.length})</h2>
                {members.length === 0 ? (
                    <p className="my-team-page__empty-text">No members in this team yet.</p>
                ) : (
                    <div className="my-team-page__members-grid">
                        {members.map(function (member) {
                            var isMe = String(member._id) === String(currentUserId);
                            return (
                                <div key={member._id} className={'my-team-page__member-card' + (isMe ? ' my-team-page__member-card--me' : '')}>
                                    <div className="my-team-page__avatar" style={{ backgroundColor: getAvatarColor(member.name) }}>
                                        {getInitials(member.name)}
                                    </div>
                                    <div className="my-team-page__person-info">
                                        <div className="my-team-page__person-name">
                                            {member.name}
                                            {isMe && <span className="my-team-page__you-badge">You</span>}
                                        </div>
                                        <div className="my-team-page__person-email">{member.email}</div>
                                        <div className="my-team-page__person-role">{member.role}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

export default MyTeamPage;
