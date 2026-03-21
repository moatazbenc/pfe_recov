import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';

function FeedbackCard() {
    var { user } = useAuth();
    var [feedbacks, setFeedbacks] = useState([]);
    var [showForm, setShowForm] = useState(false);
    var [form, setForm] = useState({ recipientName: '', type: 'praise', message: '' });

    var types = [
        { key: 'praise', label: '👏 Praise', color: '#059669' },
        { key: 'suggestion', label: '💡 Suggestion', color: '#d97706' },
        { key: 'concern', label: '⚠️ Concern', color: '#dc2626' },
    ];

    useEffect(function () {
        try {
            var stored = JSON.parse(localStorage.getItem('feedbacks') || '[]');
            setFeedbacks(stored.slice(0, 10));
        } catch (e) { }
    }, []);

    function handleSend() {
        if (!form.recipientName.trim() || !form.message.trim()) return;

        var newFb = {
            id: Date.now(),
            from: user.name,
            to: form.recipientName,
            type: form.type,
            message: form.message,
            date: new Date().toISOString()
        };

        var updated = [newFb].concat(feedbacks).slice(0, 20);
        setFeedbacks(updated);
        localStorage.setItem('feedbacks', JSON.stringify(updated));
        setForm({ recipientName: '', type: 'praise', message: '' });
        setShowForm(false);
    }

    function getTypeInfo(type) {
        return types.find(function (t) { return t.key === type; }) || types[0];
    }

    return (
        <div className="dash-card dash-card--feedback">
            <div className="dash-card__header">
                <span className="dash-card__icon">💬</span>
                <h3>Continuous Feedback</h3>
                <button
                    onClick={function () { setShowForm(!showForm); }}
                    style={{ marginLeft: 'auto', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', padding: '4px 12px', cursor: 'pointer', fontSize: '0.8rem' }}
                >
                    {showForm ? 'Cancel' : '+ Send'}
                </button>
            </div>
            <div className="dash-card__body">
                {showForm && (
                    <div style={{ marginBottom: '12px', padding: '12px', background: '#f0f9ff', borderRadius: '8px' }}>
                        <input
                            type="text"
                            placeholder="Colleague's name"
                            value={form.recipientName}
                            onChange={function (e) { setForm(Object.assign({}, form, { recipientName: e.target.value })); }}
                            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '6px', marginBottom: '8px', boxSizing: 'border-box' }}
                        />
                        <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                            {types.map(function (t) {
                                return (
                                    <button
                                        key={t.key}
                                        onClick={function () { setForm(Object.assign({}, form, { type: t.key })); }}
                                        style={{
                                            flex: 1,
                                            padding: '6px',
                                            border: form.type === t.key ? '2px solid ' + t.color : '1px solid #ddd',
                                            borderRadius: '6px',
                                            background: form.type === t.key ? t.color + '15' : 'white',
                                            cursor: 'pointer',
                                            fontSize: '0.8rem'
                                        }}
                                    >
                                        {t.label}
                                    </button>
                                );
                            })}
                        </div>
                        <textarea
                            placeholder="Write your feedback..."
                            value={form.message}
                            onChange={function (e) { setForm(Object.assign({}, form, { message: e.target.value })); }}
                            rows={2}
                            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '6px', marginBottom: '8px', resize: 'none', boxSizing: 'border-box' }}
                        />
                        <button
                            onClick={handleSend}
                            disabled={!form.recipientName.trim() || !form.message.trim()}
                            style={{ width: '100%', padding: '8px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                        >
                            Send Feedback
                        </button>
                    </div>
                )}

                {feedbacks.length === 0 ? (
                    <div className="dash-card__empty-state">
                        <div className="dash-card__empty-icon">💬</div>
                        <p>No feedback yet</p>
                        <span className="dash-card__empty-hint">Send feedback anytime to teammates</span>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {feedbacks.slice(0, 4).map(function (fb) {
                            var info = getTypeInfo(fb.type);
                            return (
                                <div key={fb.id} style={{ padding: '8px', background: '#f8fafc', borderRadius: '6px', borderLeft: '3px solid ' + info.color }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                                        <span><strong>{fb.from}</strong> → <strong>{fb.to}</strong></span>
                                        <span style={{ color: info.color, fontWeight: 600 }}>{info.label}</span>
                                    </div>
                                    <p style={{ fontSize: '0.8rem', color: '#4b5563', margin: '4px 0 2px' }}>{fb.message}</p>
                                    <small style={{ color: '#9ca3af' }}>{new Date(fb.date).toLocaleDateString()}</small>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

export default FeedbackCard;
