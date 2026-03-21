import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../components/AuthContext';

var API = 'http://localhost:5000';

function RecognitionPage() {
  var { user } = useAuth();
  var [tab, setTab] = useState('feed');
  var [items, setItems] = useState([]);
  var [leaderboard, setLeaderboard] = useState([]);
  var [loading, setLoading] = useState(true);
  var [showForm, setShowForm] = useState(false);
  var [users, setUsers] = useState([]);
  var [form, setForm] = useState({ recipientId: '', message: '', badge: '⭐', badgeLabel: 'Star', category: 'other', visibility: 'public' });
  var [sending, setSending] = useState(false);

  var token = localStorage.getItem('token');
  var headers = { Authorization: 'Bearer ' + token };

  var badges = [
    { emoji: '⭐', label: 'Star' }, { emoji: '🏆', label: 'Champion' }, { emoji: '🚀', label: 'Rockstar' },
    { emoji: '💎', label: 'Diamond' }, { emoji: '🔥', label: 'On Fire' }, { emoji: '🎯', label: 'Bullseye' },
    { emoji: '💡', label: 'Innovator' }, { emoji: '🤝', label: 'Team Player' }, { emoji: '👏', label: 'Applause' }, { emoji: '🌟', label: 'Superstar' }
  ];
  var categories = ['teamwork', 'innovation', 'leadership', 'customer_focus', 'excellence', 'other'];

  useEffect(function () { loadData(); }, [tab]);

  function loadData() {
    setLoading(true);
    var promises = [axios.get(API + '/api/users', { headers: headers })];
    if (tab === 'feed') promises.push(axios.get(API + '/api/recognition/feed', { headers: headers }));
    else if (tab === 'received') promises.push(axios.get(API + '/api/recognition/received', { headers: headers }));
    else if (tab === 'sent') promises.push(axios.get(API + '/api/recognition/sent', { headers: headers }));
    else if (tab === 'leaderboard') promises.push(axios.get(API + '/api/recognition/leaderboard', { headers: headers }));

    Promise.all(promises).then(function (res) {
      setUsers(Array.isArray(res[0].data) ? res[0].data : (res[0].data.users || []));
      if (tab === 'leaderboard') setLeaderboard(res[1].data.leaderboard || []);
      else setItems(res[1].data.recognitions || []);
    }).catch(function () {}).finally(function () { setLoading(false); });
  }

  function handleSend() {
    if (!form.recipientId || !form.message.trim()) return;
    setSending(true);
    axios.post(API + '/api/recognition', form, { headers: headers })
      .then(function () { setShowForm(false); setForm({ recipientId: '', message: '', badge: '⭐', badgeLabel: 'Star', category: 'other', visibility: 'public' }); loadData(); })
      .catch(function (e) { alert(e.response?.data?.message || 'Error'); })
      .finally(function () { setSending(false); });
  }

  function handleLike(id) {
    axios.post(API + '/api/recognition/' + id + '/like', {}, { headers: headers }).then(function () { loadData(); });
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-header__left">
          <h1 className="page-title">🏆 Recognition</h1>
          <p className="page-subtitle">Celebrate and recognize your colleagues</p>
        </div>
        <button className="btn btn--primary" onClick={function () { setShowForm(!showForm); }}>{showForm ? 'Cancel' : '+ Give Recognition'}</button>
      </div>

      {showForm && (
        <div className="form-card">
          <h3 className="form-card__title">Recognize a Colleague</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Who are you recognizing?</label>
              <select className="form-select" value={form.recipientId} onChange={function (e) { setForm(Object.assign({}, form, { recipientId: e.target.value })); }}>
                <option value="">Select person...</option>
                {users.filter(function (u) { return u._id !== user.id; }).map(function (u) { return <option key={u._id} value={u._id}>{u.name}</option>; })}
              </select>
            </div>
            <div className="form-group">
              <label>Category</label>
              <select className="form-select" value={form.category} onChange={function (e) { setForm(Object.assign({}, form, { category: e.target.value })); }}>
                {categories.map(function (c) { return <option key={c} value={c}>{c.replace(/_/g, ' ').replace(/\b\w/g, function (l) { return l.toUpperCase(); })}</option>; })}
              </select>
            </div>
            <div className="form-group form-group--full">
              <label>Choose a Badge</label>
              <div className="badge-grid">
                {badges.map(function (b) {
                  return <button key={b.emoji} className={'badge-btn' + (form.badge === b.emoji ? ' badge-btn--active' : '')} onClick={function () { setForm(Object.assign({}, form, { badge: b.emoji, badgeLabel: b.label })); }} title={b.label}><span className="badge-btn__emoji">{b.emoji}</span><span className="badge-btn__label">{b.label}</span></button>;
                })}
              </div>
            </div>
            <div className="form-group form-group--full">
              <label>Message</label>
              <textarea className="form-textarea" rows={3} placeholder="Why are you recognizing them?" value={form.message} onChange={function (e) { setForm(Object.assign({}, form, { message: e.target.value })); }} />
            </div>
          </div>
          <div className="form-actions">
            <button className="btn btn--secondary" onClick={function () { setShowForm(false); }}>Cancel</button>
            <button className="btn btn--primary" onClick={handleSend} disabled={sending || !form.recipientId || !form.message.trim()}>{sending ? 'Sending...' : 'Send Recognition ' + form.badge}</button>
          </div>
        </div>
      )}

      <div className="tab-bar">
        {['feed', 'received', 'sent', 'leaderboard'].map(function (t) { return <button key={t} className={'tab-btn' + (tab === t ? ' tab-btn--active' : '')} onClick={function () { setTab(t); }}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>; })}
      </div>

      {loading ? (
        <div className="loading-state"><div className="spinner"></div><p>Loading...</p></div>
      ) : tab === 'leaderboard' ? (
        <div className="leaderboard">
          {leaderboard.length === 0 ? (
            <div className="empty-state"><div className="empty-state__icon">🏆</div><h3>No data yet</h3><p>Start recognizing colleagues to build the leaderboard!</p></div>
          ) : (
            <div className="leaderboard__list">
              {leaderboard.map(function (entry, i) {
                var medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '#' + (i + 1);
                return (
                  <div key={entry._id} className="leaderboard__item">
                    <span className="leaderboard__rank">{medal}</span>
                    <div className="leaderboard__user">
                      <span className="leaderboard__name">{entry.user?.name || 'Unknown'}</span>
                      <span className="leaderboard__role">{entry.user?.role}</span>
                    </div>
                    <div className="leaderboard__stats">
                      <span className="leaderboard__points">{entry.totalPoints} pts</span>
                      <span className="leaderboard__count">{entry.count} recognitions</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : items.length === 0 ? (
        <div className="empty-state"><div className="empty-state__icon">⭐</div><h3>No recognitions yet</h3><p>{tab === 'feed' ? 'Be the first to recognize a colleague!' : 'Recognitions will appear here.'}</p></div>
      ) : (
        <div className="recognition-feed">
          {items.map(function (r) {
            return (
              <div key={r._id} className="recognition-item">
                <div className="recognition-item__badge">{r.badge}</div>
                <div className="recognition-item__content">
                  <div className="recognition-item__header">
                    <span className="recognition-item__from">{r.sender?.name || 'Unknown'}</span>
                    <span className="recognition-item__arrow">recognized</span>
                    <span className="recognition-item__to">{r.recipient?.name || 'Unknown'}</span>
                  </div>
                  <p className="recognition-item__message">{r.message}</p>
                  <div className="recognition-item__footer">
                    <span className="meta-tag">{(r.category || 'other').replace(/_/g, ' ')}</span>
                    <span className="recognition-item__date">{new Date(r.createdAt).toLocaleDateString()}</span>
                    {tab === 'feed' && <button className="btn btn--ghost btn--sm" onClick={function () { handleLike(r._id); }}>❤️ {r.likes?.length || 0}</button>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default RecognitionPage;
