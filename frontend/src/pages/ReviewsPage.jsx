import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../components/AuthContext';

var API = 'http://localhost:5000';

function ReviewsPage() {
  var { user } = useAuth();
  var [tab, setTab] = useState('my');
  var [reviews, setReviews] = useState([]);
  var [templates, setTemplates] = useState([]);
  var [loading, setLoading] = useState(true);
  var [showCreate, setShowCreate] = useState(false);
  var [showConduct, setShowConduct] = useState(null);
  var [showTemplateForm, setShowTemplateForm] = useState(false);
  var [users, setUsers] = useState([]);
  var [cycles, setCycles] = useState([]);
  var [form, setForm] = useState({ revieweeId: '', templateId: '', cycleId: '', type: 'self' });
  var [templateForm, setTemplateForm] = useState({ name: '', description: '', type: 'general', questions: [{ text: '', type: 'rating', maxScore: 5, category: 'general' }] });
  var [conductForm, setConductForm] = useState({ responses: [], overallRating: 0, overallComments: '', strengths: '', areasForImprovement: '' });
  var [sending, setSending] = useState(false);

  var token = localStorage.getItem('token');
  var headers = { Authorization: 'Bearer ' + token };
  var isAdmin = user.role === 'ADMIN' || user.role === 'HR';

  useEffect(function () { loadData(); }, [tab]);

  function loadData() {
    setLoading(true);
    var reviewUrl = tab === 'my' ? '/api/reviews/my' : tab === 'about' ? '/api/reviews/about-me' : '/api/reviews/all';
    Promise.all([
      axios.get(API + reviewUrl, { headers: headers }),
      axios.get(API + '/api/reviews/templates', { headers: headers }),
      axios.get(API + '/api/users', { headers: headers }),
      axios.get(API + '/api/cycles', { headers: headers }),
    ]).then(function (res) {
      setReviews(res[0].data.reviews || []);
      setTemplates(res[1].data.templates || []);
      setUsers(Array.isArray(res[2].data) ? res[2].data : (res[2].data.users || []));
      setCycles(Array.isArray(res[3].data) ? res[3].data : (res[3].data.cycles || res[3].data.data || []));
    }).catch(function () {}).finally(function () { setLoading(false); });
  }

  function handleCreateReview() {
    if (!form.revieweeId || !form.type) return;
    setSending(true);
    axios.post(API + '/api/reviews', form, { headers: headers })
      .then(function () { setShowCreate(false); setForm({ revieweeId: '', templateId: '', cycleId: '', type: 'self' }); loadData(); })
      .catch(function (e) { alert(e.response?.data?.message || 'Error'); })
      .finally(function () { setSending(false); });
  }

  function handleCreateTemplate() {
    if (!templateForm.name || !templateForm.questions.length) return;
    setSending(true);
    axios.post(API + '/api/reviews/templates', templateForm, { headers: headers })
      .then(function () { setShowTemplateForm(false); setTemplateForm({ name: '', description: '', type: 'general', questions: [{ text: '', type: 'rating', maxScore: 5, category: 'general' }] }); loadData(); })
      .catch(function (e) { alert(e.response?.data?.message || 'Error'); })
      .finally(function () { setSending(false); });
  }

  function openConduct(review) {
    setShowConduct(review);
    setConductForm({
      responses: review.responses || [],
      overallRating: review.overallRating || 0,
      overallComments: review.overallComments || '',
      strengths: review.strengths || '',
      areasForImprovement: review.areasForImprovement || '',
    });
  }

  function updateResponse(i, field, value) {
    var rs = conductForm.responses.slice();
    rs[i] = Object.assign({}, rs[i]);
    rs[i][field] = value;
    setConductForm(Object.assign({}, conductForm, { responses: rs }));
  }

  function handleSubmitReview() {
    setSending(true);
    axios.put(API + '/api/reviews/' + showConduct._id + '/submit', conductForm, { headers: headers })
      .then(function () { setShowConduct(null); loadData(); })
      .catch(function (e) { alert(e.response?.data?.message || 'Error'); })
      .finally(function () { setSending(false); });
  }

  function handleSaveDraft() {
    axios.put(API + '/api/reviews/' + showConduct._id + '/draft', conductForm, { headers: headers })
      .then(function () { alert('Draft saved!'); })
      .catch(function (e) { alert(e.response?.data?.message || 'Error'); });
  }

  var typeLabels = { self: '🪞 Self', manager: '👔 Manager', peer: '🤝 Peer', '360': '🔄 360°', upward: '⬆️ Upward' };
  var statusColors = { pending: '#f59e0b', in_progress: '#3b82f6', submitted: '#10b981', completed: '#6366f1', acknowledged: '#8b5cf6' };

  var tabs = [{ key: 'my', label: 'Reviews to Complete' }, { key: 'about', label: 'About Me' }];
  if (isAdmin) tabs.push({ key: 'all', label: 'All Reviews' });
  tabs.push({ key: 'templates', label: 'Templates' });

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-header__left">
          <h1 className="page-title">📋 Reviews</h1>
          <p className="page-subtitle">Performance reviews and templates</p>
        </div>
        <div className="page-header__actions">
          {isAdmin && <button className="btn btn--secondary" onClick={function () { setShowTemplateForm(!showTemplateForm); }}>{showTemplateForm ? 'Cancel' : '+ Template'}</button>}
          {(isAdmin || user.role === 'TEAM_LEADER') && <button className="btn btn--primary" onClick={function () { setShowCreate(!showCreate); }}>{showCreate ? 'Cancel' : '+ Assign Review'}</button>}
        </div>
      </div>

      {showCreate && (
        <div className="form-card">
          <h3 className="form-card__title">Assign Review</h3>
          <div className="form-grid">
            <div className="form-group"><label>Reviewee</label><select className="form-select" value={form.revieweeId} onChange={function (e) { setForm(Object.assign({}, form, { revieweeId: e.target.value })); }}><option value="">Select...</option>{users.map(function (u) { return <option key={u._id} value={u._id}>{u.name}</option>; })}</select></div>
            <div className="form-group"><label>Type</label><select className="form-select" value={form.type} onChange={function (e) { setForm(Object.assign({}, form, { type: e.target.value })); }}><option value="self">Self Review</option><option value="manager">Manager Review</option><option value="peer">Peer Review</option><option value="360">360° Review</option><option value="upward">Upward Review</option></select></div>
            <div className="form-group"><label>Template</label><select className="form-select" value={form.templateId} onChange={function (e) { setForm(Object.assign({}, form, { templateId: e.target.value })); }}><option value="">No template</option>{templates.map(function (t) { return <option key={t._id} value={t._id}>{t.name}</option>; })}</select></div>
            <div className="form-group"><label>Cycle</label><select className="form-select" value={form.cycleId} onChange={function (e) { setForm(Object.assign({}, form, { cycleId: e.target.value })); }}><option value="">No cycle</option>{cycles.map(function (c) { return <option key={c._id} value={c._id}>{c.name}</option>; })}</select></div>
          </div>
          <div className="form-actions"><button className="btn btn--secondary" onClick={function () { setShowCreate(false); }}>Cancel</button><button className="btn btn--primary" onClick={handleCreateReview} disabled={sending}>{sending ? 'Creating...' : 'Assign Review'}</button></div>
        </div>
      )}

      {showTemplateForm && (
        <div className="form-card">
          <h3 className="form-card__title">Create Template</h3>
          <div className="form-grid">
            <div className="form-group"><label>Name</label><input className="form-input" value={templateForm.name} onChange={function (e) { setTemplateForm(Object.assign({}, templateForm, { name: e.target.value })); }} /></div>
            <div className="form-group"><label>Type</label><select className="form-select" value={templateForm.type} onChange={function (e) { setTemplateForm(Object.assign({}, templateForm, { type: e.target.value })); }}><option value="general">General</option><option value="self">Self</option><option value="manager">Manager</option><option value="peer">Peer</option><option value="360">360°</option></select></div>
            <div className="form-group form-group--full"><label>Description</label><textarea className="form-textarea" rows={2} value={templateForm.description} onChange={function (e) { setTemplateForm(Object.assign({}, templateForm, { description: e.target.value })); }} /></div>
            <div className="form-group form-group--full">
              <label>Questions</label>
              {templateForm.questions.map(function (q, i) {
                return (
                  <div key={i} className="question-builder">
                    <div className="question-builder__row">
                      <input className="form-input" placeholder={'Question ' + (i + 1)} value={q.text} onChange={function (e) { var qs = templateForm.questions.slice(); qs[i] = Object.assign({}, qs[i], { text: e.target.value }); setTemplateForm(Object.assign({}, templateForm, { questions: qs })); }} />
                      <select className="form-select form-select--sm" value={q.type} onChange={function (e) { var qs = templateForm.questions.slice(); qs[i] = Object.assign({}, qs[i], { type: e.target.value }); setTemplateForm(Object.assign({}, templateForm, { questions: qs })); }}><option value="rating">Rating</option><option value="text">Text</option><option value="competency">Competency</option></select>
                      {templateForm.questions.length > 1 && <button className="btn btn--ghost btn--sm" onClick={function () { var qs = templateForm.questions.filter(function (_, idx) { return idx !== i; }); setTemplateForm(Object.assign({}, templateForm, { questions: qs })); }}>✕</button>}
                    </div>
                  </div>
                );
              })}
              <button className="btn btn--secondary btn--sm" onClick={function () { setTemplateForm(Object.assign({}, templateForm, { questions: templateForm.questions.concat([{ text: '', type: 'rating', maxScore: 5, category: 'general' }]) })); }}>+ Add Question</button>
            </div>
          </div>
          <div className="form-actions"><button className="btn btn--secondary" onClick={function () { setShowTemplateForm(false); }}>Cancel</button><button className="btn btn--primary" onClick={handleCreateTemplate} disabled={sending}>{sending ? 'Creating...' : 'Create Template'}</button></div>
        </div>
      )}

      {showConduct && (
        <div className="modal-overlay" onClick={function () { setShowConduct(null); }}>
          <div className="modal-content modal-content--lg" onClick={function (e) { e.stopPropagation(); }}>
            <h3 className="modal-title">{typeLabels[showConduct.type] || showConduct.type} Review</h3>
            <p className="modal-desc">Reviewing: <strong>{showConduct.reviewee?.name || 'Unknown'}</strong></p>
            <div className="review-conduct">
              {conductForm.responses.map(function (r, i) {
                return (
                  <div key={i} className="review-question">
                    <label className="review-question__label">{i + 1}. {r.questionText}</label>
                    {r.questionType === 'rating' && (
                      <div className="rating-group">{[1,2,3,4,5].map(function (v) { return <button key={v} className={'rating-btn' + (r.score == v ? ' rating-btn--active' : '')} onClick={function () { updateResponse(i, 'score', v); }}>{v}</button>; })}</div>
                    )}
                    {(r.questionType === 'text' || r.questionType === 'competency') && <textarea className="form-textarea" rows={2} value={r.answer || ''} onChange={function (e) { updateResponse(i, 'answer', e.target.value); }} />}
                  </div>
                );
              })}
              <div className="review-conduct__overall">
                <div className="form-group"><label>Overall Rating</label><div className="rating-group">{[1,2,3,4,5].map(function (v) { return <button key={v} className={'rating-btn rating-btn--lg' + (conductForm.overallRating == v ? ' rating-btn--active' : '')} onClick={function () { setConductForm(Object.assign({}, conductForm, { overallRating: v })); }}>{'⭐'.repeat(v)}</button>; })}</div></div>
                <div className="form-group form-group--full"><label>Overall Comments</label><textarea className="form-textarea" rows={2} value={conductForm.overallComments} onChange={function (e) { setConductForm(Object.assign({}, conductForm, { overallComments: e.target.value })); }} /></div>
                <div className="form-group"><label>Strengths</label><textarea className="form-textarea" rows={2} value={conductForm.strengths} onChange={function (e) { setConductForm(Object.assign({}, conductForm, { strengths: e.target.value })); }} /></div>
                <div className="form-group"><label>Areas for Improvement</label><textarea className="form-textarea" rows={2} value={conductForm.areasForImprovement} onChange={function (e) { setConductForm(Object.assign({}, conductForm, { areasForImprovement: e.target.value })); }} /></div>
              </div>
            </div>
            <div className="form-actions">
              <button className="btn btn--secondary" onClick={function () { setShowConduct(null); }}>Cancel</button>
              <button className="btn btn--secondary" onClick={handleSaveDraft}>Save Draft</button>
              <button className="btn btn--primary" onClick={handleSubmitReview} disabled={sending}>{sending ? 'Submitting...' : 'Submit Review'}</button>
            </div>
          </div>
        </div>
      )}

      <div className="tab-bar">
        {tabs.map(function (t) { return <button key={t.key} className={'tab-btn' + (tab === t.key ? ' tab-btn--active' : '')} onClick={function () { setTab(t.key); }}>{t.label}</button>; })}
      </div>

      {loading ? (
        <div className="loading-state"><div className="spinner"></div><p>Loading...</p></div>
      ) : tab === 'templates' ? (
        <div className="template-list">
          {templates.length === 0 ? (
            <div className="empty-state"><div className="empty-state__icon">📝</div><h3>No templates</h3><p>Create a review template to get started.</p></div>
          ) : templates.map(function (t) {
            return (
              <div key={t._id} className="template-item">
                <div className="template-item__info"><h3>{t.name}</h3><p>{t.description}</p><div className="template-item__meta"><span className="meta-tag">{t.type}</span><span className="meta-tag">{t.questions?.length || 0} questions</span></div></div>
              </div>
            );
          })}
        </div>
      ) : reviews.length === 0 ? (
        <div className="empty-state"><div className="empty-state__icon">📋</div><h3>No reviews</h3><p>{tab === 'my' ? 'You have no pending reviews.' : 'No reviews available.'}</p></div>
      ) : (
        <div className="review-list">
          {reviews.map(function (r) {
            return (
              <div key={r._id} className="review-item">
                <div className="review-item__info">
                  <h3 className="review-item__title">{typeLabels[r.type] || r.type}</h3>
                  <p className="review-item__people">
                    {tab === 'my' ? ('Review for: ' + (r.reviewee?.name || 'Unknown')) : ('By: ' + (r.reviewer?.name || 'Anonymous'))}
                  </p>
                  <div className="review-item__meta">
                    <span className="status-chip" style={{ background: (statusColors[r.status] || '#6b7280') + '18', color: statusColors[r.status] || '#6b7280' }}>{r.status}</span>
                    {r.cycle && <span className="meta-tag">{r.cycle.name}</span>}
                    {r.template && <span className="meta-tag">📝 {r.template.name}</span>}
                    {r.overallRating && <span className="meta-tag">⭐ {r.overallRating}/5</span>}
                    <span className="review-item__date">{new Date(r.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="review-item__actions">
                  {tab === 'my' && (r.status === 'pending' || r.status === 'in_progress') && <button className="btn btn--primary btn--sm" onClick={function () { openConduct(r); }}>Conduct Review</button>}
                  {tab === 'about' && r.overallComments && <button className="btn btn--secondary btn--sm" onClick={function () { alert('Overall: ' + r.overallRating + '/5\n\n' + r.overallComments + '\n\nStrengths: ' + r.strengths + '\n\nImprovements: ' + r.areasForImprovement); }}>View Details</button>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ReviewsPage;
