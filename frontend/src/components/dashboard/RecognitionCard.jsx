import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import api from '../../services/api';
import { useToast } from '../common/Toast';

function RecognitionCard() {
    var { user } = useAuth();
    var [recognitions, setRecognitions] = useState([]);
    var [loading, setLoading] = useState(true);
    var [showForm, setShowForm] = useState(false);
    var [users, setUsers] = useState([]);
    var [form, setForm] = useState({ recipientId: '', message: '', badge: '⭐' });
    var toast = useToast();

    var badges = [
        { emoji: '⭐', label: 'Star' },
        { emoji: '🏆', label: 'Champion' },
        { emoji: '🚀', label: 'Rockstar' },
        { emoji: '💎', label: 'Diamond' },
        { emoji: '🔥', label: 'On Fire' },
        { emoji: '🎯', label: 'Bullseye' },
    ];

    useEffect(function () {
        fetchFeed();
    }, []);

    async function fetchFeed() {
        setLoading(true);
        try {
            var res = await api.get('/api/recognition/feed');
            setRecognitions((res.data.feed || []).slice(0, 5));
        } catch (err) {
            console.error('Error fetching recognitions', err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(function() {
        if (showForm && users.length === 0) {
            api.get('/api/users').then(res => setUsers(res.data.users || [])).catch(console.error);
        }
    }, [showForm, users.length]);

    async function handleSend() {
        if (!form.recipientId || !form.message.trim()) return;

        try {
            await api.post('/api/recognition', {
                recipientId: form.recipientId,
                badge: form.badge,
                message: form.message,
                visibility: 'public'
            });
            toast.success('Recognition sent successfully!');
            fetchFeed();
            setForm({ recipientId: '', message: '', badge: '⭐' });
            setShowForm(false);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to send recognition');
        }
    }

    return (
        <div className="dash-card dash-card--recognition">
            <div className="dash-card__header">
                <span className="dash-card__icon">🏆</span>
                <h3>Recognition Wall</h3>
                <button 
                    onClick={function () { setShowForm(!showForm); }}
                    style={{ marginLeft: 'auto', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: '6px', padding: '4px 12px', cursor: 'pointer', fontSize: '0.8rem' }}
                >
                    {showForm ? 'Cancel' : '+ Give Info'}
                </button>
            </div>
            <div className="dash-card__body">
                {showForm && (
                    <div style={{ marginBottom: '12px', padding: '12px', background: '#f8f9fa', borderRadius: '8px' }}>
                        <select
                            className="form-control"
                            value={form.recipientId}
                            onChange={function(e) { setForm({...form, recipientId: e.target.value}); }}
                            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '6px', marginBottom: '8px', display: 'block' }}
                        >
                            <option value="">Select Colleague...</option>
                            {users.map(function(u) {
                                if(u._id === user._id) return null;
                                return <option key={u._id} value={u._id}>{u.name} ({u.role})</option>;
                            })}
                        </select>
                        <textarea
                            placeholder="Why are you recognizing them?"
                            value={form.message}
                            onChange={function (e) { setForm(Object.assign({}, form, { message: e.target.value })); }}
                            rows={2}
                            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '6px', marginBottom: '8px', resize: 'none', boxSizing: 'border-box' }}
                        />
                        <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
                            {badges.map(function (b) {
                                return (
                                    <button
                                        key={b.emoji}
                                        onClick={function () { setForm(Object.assign({}, form, { badge: b.emoji })); }}
                                        style={{
                                            padding: '4px 8px',
                                            border: form.badge === b.emoji ? '2px solid #8b5cf6' : '1px solid #ddd',
                                            borderRadius: '6px',
                                            background: form.badge === b.emoji ? '#ede9fe' : 'white',
                                            cursor: 'pointer',
                                            fontSize: '1.1rem'
                                        }}
                                        title={b.label}
                                    >
                                        {b.emoji}
                                    </button>
                                );
                            })}
                        </div>
                        <button
                            onClick={handleSend}
                            disabled={!form.recipientId || !form.message.trim()}
                            style={{ width: '100%', padding: '8px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                        >
                            Send Recognition {form.badge}
                        </button>
                    </div>
                )}

                {loading ? (
                    <p className="dash-card__loading">Loading...</p>
                ) : recognitions.length === 0 ? (
                    <div className="dash-card__empty-state">
                        <div className="dash-card__empty-icon">⭐</div>
                        <p>No recognitions recently</p>
                        <span className="dash-card__empty-hint">Click "+ Give Info" to recognize a colleague</span>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {recognitions.map(function (r) {
                            return (
                                <div key={r._id} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '8px', background: '#faf5ff', borderRadius: '6px' }}>
                                    <span style={{ fontSize: '1.5rem' }}>{r.badge}</span>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '0.85rem' }}>
                                            <strong>{r.sender?.name || 'Anonymous'}</strong> → <strong>{r.recipient?.name || 'Unknown'}</strong>
                                        </div>
                                        <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: '2px 0' }}>{r.message}</p>
                                        <small style={{ color: '#9ca3af' }}>{new Date(r.createdAt).toLocaleDateString()}</small>
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

export default RecognitionCard;
