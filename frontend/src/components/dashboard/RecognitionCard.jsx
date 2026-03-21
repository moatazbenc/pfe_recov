import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../AuthContext';

var API = 'http://localhost:5000';

function RecognitionCard() {
    var { user } = useAuth();
    var [recognitions, setRecognitions] = useState([]);
    var [showForm, setShowForm] = useState(false);
    var [form, setForm] = useState({ recipientName: '', message: '', badge: '⭐' });
    var [loading, setLoading] = useState(false);

    var badges = [
        { emoji: '⭐', label: 'Star' },
        { emoji: '🏆', label: 'Champion' },
        { emoji: '🚀', label: 'Rockstar' },
        { emoji: '💎', label: 'Diamond' },
        { emoji: '🔥', label: 'On Fire' },
        { emoji: '🎯', label: 'Bullseye' },
    ];

    useEffect(function () {
        // Load local recognitions from localStorage
        try {
            var stored = JSON.parse(localStorage.getItem('recognitions') || '[]');
            setRecognitions(stored.slice(0, 5));
        } catch (e) { }
    }, []);

    function handleSend() {
        if (!form.recipientName.trim() || !form.message.trim()) return;
        setLoading(true);

        var newRec = {
            id: Date.now(),
            from: user.name,
            to: form.recipientName,
            message: form.message,
            badge: form.badge,
            date: new Date().toISOString()
        };

        var updated = [newRec].concat(recognitions).slice(0, 20);
        setRecognitions(updated);
        localStorage.setItem('recognitions', JSON.stringify(updated));
        setForm({ recipientName: '', message: '', badge: '⭐' });
        setShowForm(false);
        setLoading(false);
    }

    return (
        <div className="dash-card dash-card--recognition">
            <div className="dash-card__header">
                <span className="dash-card__icon">🏆</span>
                <h3>Recognition</h3>
                <button 
                    onClick={function () { setShowForm(!showForm); }}
                    style={{ marginLeft: 'auto', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: '6px', padding: '4px 12px', cursor: 'pointer', fontSize: '0.8rem' }}
                >
                    {showForm ? 'Cancel' : '+ Give'}
                </button>
            </div>
            <div className="dash-card__body">
                {showForm && (
                    <div style={{ marginBottom: '12px', padding: '12px', background: '#f8f9fa', borderRadius: '8px' }}>
                        <input
                            type="text"
                            placeholder="Colleague's name"
                            value={form.recipientName}
                            onChange={function (e) { setForm(Object.assign({}, form, { recipientName: e.target.value })); }}
                            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '6px', marginBottom: '8px', boxSizing: 'border-box' }}
                        />
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
                            disabled={loading || !form.recipientName.trim()}
                            style={{ width: '100%', padding: '8px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                        >
                            Send Recognition {form.badge}
                        </button>
                    </div>
                )}

                {recognitions.length === 0 ? (
                    <div className="dash-card__empty-state">
                        <div className="dash-card__empty-icon">⭐</div>
                        <p>No recognitions yet</p>
                        <span className="dash-card__empty-hint">Click "+ Give" to recognize a colleague</span>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {recognitions.slice(0, 5).map(function (r) {
                            return (
                                <div key={r.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '8px', background: '#faf5ff', borderRadius: '6px' }}>
                                    <span style={{ fontSize: '1.5rem' }}>{r.badge}</span>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '0.85rem' }}>
                                            <strong>{r.from}</strong> → <strong>{r.to}</strong>
                                        </div>
                                        <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: '2px 0' }}>{r.message}</p>
                                        <small style={{ color: '#9ca3af' }}>{new Date(r.date).toLocaleDateString()}</small>
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
