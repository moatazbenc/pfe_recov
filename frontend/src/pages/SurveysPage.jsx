import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../components/AuthContext';
import { useToast } from '../components/common/Toast';
import ConfirmDialog from '../components/common/ConfirmDialog';
import LoadingSkeleton from '../components/common/LoadingSkeleton';

function SurveysPage() {
  var { user } = useAuth();
  var [tab, setTab] = useState('active');
  var [surveys, setSurveys] = useState([]);
  var [loading, setLoading] = useState(true);
  var [showCreate, setShowCreate] = useState(false);
  var [showRespond, setShowRespond] = useState(null);
  var [showResults, setShowResults] = useState(null);
  var [form, setForm] = useState({ title: '', description: '', anonymous: false, type: 'survey', questions: [{ text: '', type: 'rating', options: [], required: true }] });
  var [answers, setAnswers] = useState([]);
  var [results, setResults] = useState(null);
  var [sending, setSending] = useState(false);

  var toast = useToast();
  var [confirmDelete, setConfirmDelete] = useState(null);
  var isAdmin = user.role === 'ADMIN' || user.role === 'HR' || user.role === 'TEAM_LEADER';

  useEffect(function () { loadData(); }, [tab]);

  function loadData() {
    setLoading(true);
    var url = tab === 'active' ? '/api/surveys/active' : '/api/surveys/all';
    api.get(url)
      .then(function (res) { setSurveys(res.data.surveys || []); })
      .catch(function () { toast.error('Failed to load surveys'); })
      .finally(function () { setLoading(false); });
  }

  function addQuestion() {
    setForm(Object.assign({}, form, { questions: form.questions.concat([{ text: '', type: 'rating', options: [], required: true }]) }));
  }

  function updateQuestion(i, field, value) {
    var qs = form.questions.slice();
    qs[i] = Object.assign({}, qs[i]);
    qs[i][field] = value;
    setForm(Object.assign({}, form, { questions: qs }));
  }

  function removeQuestion(i) {
    var qs = form.questions.filter(function (_, idx) { return idx !== i; });
    setForm(Object.assign({}, form, { questions: qs }));
  }

  function handleCreate() {
    if (!form.title.trim() || !form.questions.length || !form.questions[0].text) return;
    setSending(true);
    api.post('/api/surveys', form)
      .then(function (res) {
        var surveyId = res.data.survey._id;
        return api.put('/api/surveys/' + surveyId + '/publish', {});
      })
      .then(function () { setShowCreate(false); setForm({ title: '', description: '', anonymous: false, type: 'survey', questions: [{ text: '', type: 'rating', options: [], required: true }] }); loadData(); toast.success('Survey created and published!'); })
      .catch(function (e) { toast.error(e.response?.data?.message || 'Error creating survey'); })
      .finally(function () { setSending(false); });
  }

  function openRespond(survey) {
    setShowRespond(survey);
    setAnswers(survey.questions.map(function () { return ''; }));
  }

  function handleRespond() {
    var formatted = answers.map(function (val, i) { return { questionIndex: i, value: val }; });
    setSending(true);
    api.post('/api/surveys/' + showRespond._id + '/respond', { answers: formatted })
      .then(function () { setShowRespond(null); loadData(); toast.success('Response submitted!'); })
      .catch(function (e) { toast.error(e.response?.data?.message || 'Error submitting response'); })
      .finally(function () { setSending(false); });
  }

  function openResults(surveyId) {
    api.get('/api/surveys/' + surveyId + '/results')
      .then(function (res) { setResults(res.data); setShowResults(surveyId); })
      .catch(function (e) { toast.error(e.response?.data?.message || 'Error loading results'); });
  }

  function handleDelete(id) {
    api.delete('/api/surveys/' + id)
      .then(function () { loadData(); toast.success('Survey deleted'); })
      .catch(function () { toast.error('Failed to delete survey'); });
    setConfirmDelete(null);
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-header__left">
          <h1 className="page-title">📊 Surveys</h1>
          <p className="page-subtitle">Create and respond to employee surveys</p>
        </div>
        {isAdmin && <button className="btn btn--primary" onClick={function () { setShowCreate(!showCreate); }}>{showCreate ? 'Cancel' : '+ New Survey'}</button>}
      </div>

      {showCreate && (
        <div className="form-card">
          <h3 className="form-card__title">Create Survey</h3>
          <div className="form-grid">
            <div className="form-group form-group--full">
              <label>Title</label>
              <input className="form-input" placeholder="Survey title..." value={form.title} onChange={function (e) { setForm(Object.assign({}, form, { title: e.target.value })); }} />
            </div>
            <div className="form-group form-group--full">
              <label>Description</label>
              <textarea className="form-textarea" rows={2} placeholder="Description..." value={form.description} onChange={function (e) { setForm(Object.assign({}, form, { description: e.target.value })); }} />
            </div>
            <div className="form-group">
              <label>Type</label>
              <select className="form-select" value={form.type} onChange={function (e) { setForm(Object.assign({}, form, { type: e.target.value })); }}>
                <option value="survey">Survey</option><option value="pulse">Pulse Survey</option><option value="engagement">Engagement</option><option value="exit">Exit Survey</option><option value="onboarding">Onboarding</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-checkbox-label"><input type="checkbox" checked={form.anonymous} onChange={function (e) { setForm(Object.assign({}, form, { anonymous: e.target.checked })); }} /> Anonymous responses</label>
            </div>
            <div className="form-group form-group--full">
              <label>Questions</label>
              {form.questions.map(function (q, i) {
                return (
                  <div key={i} className="question-builder">
                    <div className="question-builder__row">
                      <input className="form-input" placeholder={'Question ' + (i + 1)} value={q.text} onChange={function (e) { updateQuestion(i, 'text', e.target.value); }} />
                      <select className="form-select form-select--sm" value={q.type} onChange={function (e) { updateQuestion(i, 'type', e.target.value); }}>
                        <option value="rating">Rating (1-5)</option><option value="text">Free Text</option><option value="yes_no">Yes/No</option><option value="multiple_choice">Multiple Choice</option><option value="scale">Scale (1-10)</option>
                      </select>
                      {form.questions.length > 1 && <button className="btn btn--ghost btn--sm" onClick={function () { removeQuestion(i); }}>✕</button>}
                    </div>
                    {q.type === 'multiple_choice' && (
                      <input className="form-input" placeholder="Options (comma-separated)" value={(q.options || []).join(',')} onChange={function (e) { updateQuestion(i, 'options', e.target.value.split(',').map(function (o) { return o.trim(); })); }} />
                    )}
                  </div>
                );
              })}
              <button className="btn btn--secondary btn--sm" onClick={addQuestion}>+ Add Question</button>
            </div>
          </div>
          <div className="form-actions">
            <button className="btn btn--secondary" onClick={function () { setShowCreate(false); }}>Cancel</button>
            <button className="btn btn--primary" onClick={handleCreate} disabled={sending}>{sending ? 'Creating...' : 'Create & Publish'}</button>
          </div>
        </div>
      )}

      {showRespond && (
        <div className="modal-overlay" onClick={function () { setShowRespond(null); }}>
          <div className="modal-content modal-content--lg" onClick={function (e) { e.stopPropagation(); }}>
            <h3 className="modal-title">{showRespond.title}</h3>
            {showRespond.description && <p className="modal-desc">{showRespond.description}</p>}
            <div className="survey-respond">
              {showRespond.questions.map(function (q, i) {
                return (
                  <div key={i} className="survey-question">
                    <label className="survey-question__label">{i + 1}. {q.text} {q.required && <span style={{ color: '#ef4444' }}>*</span>}</label>
                    {q.type === 'rating' && (
                      <div className="rating-group">{[1,2,3,4,5].map(function (v) { return <button key={v} className={'rating-btn' + (answers[i] == v ? ' rating-btn--active' : '')} onClick={function () { var a = answers.slice(); a[i] = v; setAnswers(a); }}>{v}</button>; })}</div>
                    )}
                    {q.type === 'scale' && (
                      <div className="rating-group">{[1,2,3,4,5,6,7,8,9,10].map(function (v) { return <button key={v} className={'rating-btn rating-btn--sm' + (answers[i] == v ? ' rating-btn--active' : '')} onClick={function () { var a = answers.slice(); a[i] = v; setAnswers(a); }}>{v}</button>; })}</div>
                    )}
                    {q.type === 'text' && <textarea className="form-textarea" rows={2} value={answers[i]} onChange={function (e) { var a = answers.slice(); a[i] = e.target.value; setAnswers(a); }} />}
                    {q.type === 'yes_no' && (
                      <div className="chip-group">{['Yes', 'No'].map(function (v) { return <button key={v} className={'chip' + (answers[i] === v ? ' chip--active' : '')} onClick={function () { var a = answers.slice(); a[i] = v; setAnswers(a); }}>{v}</button>; })}</div>
                    )}
                    {q.type === 'multiple_choice' && (
                      <div className="chip-group">{(q.options || []).map(function (o) { return <button key={o} className={'chip' + (answers[i] === o ? ' chip--active' : '')} onClick={function () { var a = answers.slice(); a[i] = o; setAnswers(a); }}>{o}</button>; })}</div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="form-actions">
              <button className="btn btn--secondary" onClick={function () { setShowRespond(null); }}>Cancel</button>
              <button className="btn btn--primary" onClick={handleRespond} disabled={sending}>{sending ? 'Submitting...' : 'Submit Response'}</button>
            </div>
          </div>
        </div>
      )}

      {showResults && results && (
        <div className="modal-overlay" onClick={function () { setShowResults(null); }}>
          <div className="modal-content modal-content--lg" onClick={function (e) { e.stopPropagation(); }}>
            <h3 className="modal-title">Results: {results.survey?.title}</h3>
            <p className="modal-desc">{results.survey?.responses?.length || 0} responses</p>
            <div className="survey-results">
              {(results.aggregated || []).map(function (r, i) {
                return (
                  <div key={i} className="result-item">
                    <h4 className="result-item__question">{i + 1}. {r.question}</h4>
                    {(r.type === 'rating' || r.type === 'scale') && (
                      <div className="result-item__rating"><span className="result-item__avg">{r.average}</span><span className="result-item__meta"> avg ({r.count} responses, range: {r.min}–{r.max})</span></div>
                    )}
                    {(r.type === 'multiple_choice' || r.type === 'yes_no') && r.distribution && (
                      <div className="result-item__dist">{Object.entries(r.distribution).map(function (entry) { return <div key={entry[0]} className="result-bar"><span className="result-bar__label">{entry[0]}</span><div className="result-bar__track"><div className="result-bar__fill" style={{ width: (r.count ? (entry[1] / r.count) * 100 : 0) + '%' }}></div></div><span className="result-bar__count">{entry[1]}</span></div>; })}</div>
                    )}
                    {r.type === 'text' && r.responses && (
                      <div className="result-item__texts">{r.responses.map(function (t, ti) { return <p key={ti} className="result-item__text-response">"{t}"</p>; })}</div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="form-actions"><button className="btn btn--secondary" onClick={function () { setShowResults(null); }}>Close</button></div>
          </div>
        </div>
      )}

      <div className="tab-bar">
        <button className={'tab-btn' + (tab === 'active' ? ' tab-btn--active' : '')} onClick={function () { setTab('active'); }}>Active Surveys</button>
        {isAdmin && <button className={'tab-btn' + (tab === 'all' ? ' tab-btn--active' : '')} onClick={function () { setTab('all'); }}>All Surveys</button>}
      </div>

      {loading ? (
        <LoadingSkeleton rows={3} height={90} />
      ) : surveys.length === 0 ? (
        <div className="empty-state"><div className="empty-state__icon">📊</div><h3>No surveys yet</h3><p>{isAdmin ? 'Create a survey to get started!' : 'No active surveys to respond to.'}</p></div>
      ) : (
        <div className="survey-list">
          {surveys.map(function (s) {
            var statusColor = s.status === 'active' ? '#10b981' : s.status === 'draft' ? '#6b7280' : '#ef4444';
            return (
              <div key={s._id} className="survey-item">
                <div className="survey-item__info">
                  <h3 className="survey-item__title">{s.title}</h3>
                  {s.description && <p className="survey-item__desc">{s.description}</p>}
                  <div className="survey-item__meta">
                    <span className="status-chip" style={{ background: statusColor + '18', color: statusColor }}>{s.status}</span>
                    <span className="meta-tag">{s.type}</span>
                    <span className="meta-tag">{s.questions?.length || 0} questions</span>
                    <span className="meta-tag">{s.responseCount || 0} responses</span>
                    {s.anonymous && <span className="meta-tag">🔒 Anonymous</span>}
                  </div>
                </div>
                <div className="survey-item__actions">
                  {s.status === 'active' && !s.hasResponded && <button className="btn btn--primary btn--sm" onClick={function () { openRespond(s); }}>Respond</button>}
                  {s.status === 'active' && s.hasResponded && <span className="status-chip" style={{ background: '#10b98118', color: '#10b981' }}>✓ Responded</span>}
                  {isAdmin && <button className="btn btn--secondary btn--sm" onClick={function () { openResults(s._id); }}>Results</button>}
                  {isAdmin && <button className="btn btn--ghost btn--sm" style={{ color: '#ef4444' }} onClick={function () { setConfirmDelete(s._id); }}>🗑️</button>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete Survey?"
        message="All responses will be permanently lost."
        confirmLabel="Delete"
        danger={true}
        onConfirm={function () { handleDelete(confirmDelete); }}
        onCancel={function () { setConfirmDelete(null); }}
      />
    </div>
  );
}

export default SurveysPage;
