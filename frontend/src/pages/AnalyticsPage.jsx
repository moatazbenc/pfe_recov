import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../components/AuthContext';

var API = 'http://localhost:5000';

function AnalyticsPage() {
  var { user } = useAuth();
  var [loading, setLoading] = useState(true);
  var [dashStats, setDashStats] = useState({});
  var [performance, setPerformance] = useState(null);
  var [taskStats, setTaskStats] = useState(null);
  var [feedbackStats, setFeedbackStats] = useState(null);
  var [recognitionStats, setRecognitionStats] = useState(null);

  var token = localStorage.getItem('token');
  var headers = { Authorization: 'Bearer ' + token };

  useEffect(function () { loadData(); }, []);

  function loadData() {
    setLoading(true);
    var promises = [
      axios.get(API + '/api/stats/dashboard', { headers: headers }),
      axios.get(API + '/api/tasks/stats', { headers: headers }),
      axios.get(API + '/api/feedback/stats', { headers: headers }),
      axios.get(API + '/api/recognition/stats', { headers: headers }),
    ];
    if (user.role === 'ADMIN' || user.role === 'HR') {
      promises.push(axios.get(API + '/api/stats/performance', { headers: headers }));
    }

    Promise.all(promises)
      .then(function (res) {
        setDashStats(res[0].data || {});
        setTaskStats(res[1].data.stats || {});
        setFeedbackStats(res[2].data.stats || {});
        setRecognitionStats(res[3].data.stats || {});
        if (res[4]) setPerformance(res[4].data || null);
      })
      .catch(function () {})
      .finally(function () { setLoading(false); });
  }

  if (loading) {
    return <div className="page-container"><div className="loading-state"><div className="spinner"></div><p>Loading analytics...</p></div></div>;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-header__left">
          <h1 className="page-title">📈 Analytics</h1>
          <p className="page-subtitle">Performance insights and usage data</p>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="analytics-section">
        <h2 className="section-title">Overview</h2>
        <div className="stats-row">
          <div className="mini-stat mini-stat--purple"><span className="mini-stat__value">{dashStats.objectives || 0}</span><span className="mini-stat__label">Goals</span></div>
          <div className="mini-stat mini-stat--blue"><span className="mini-stat__value">{dashStats.teams || 0}</span><span className="mini-stat__label">Teams</span></div>
          <div className="mini-stat mini-stat--green"><span className="mini-stat__value">{dashStats.users || 0}</span><span className="mini-stat__label">Users</span></div>
          <div className="mini-stat mini-stat--orange"><span className="mini-stat__value">{dashStats.cycles || 0}</span><span className="mini-stat__label">Cycles</span></div>
        </div>
      </div>

      {/* Task Analytics */}
      <div className="analytics-section">
        <h2 className="section-title">Task Analytics</h2>
        <div className="stats-row">
          <div className="mini-stat"><span className="mini-stat__value">{taskStats.total || 0}</span><span className="mini-stat__label">Total Tasks</span></div>
          <div className="mini-stat"><span className="mini-stat__value" style={{ color: '#10b981' }}>{taskStats.done || 0}</span><span className="mini-stat__label">Completed</span></div>
          <div className="mini-stat"><span className="mini-stat__value" style={{ color: '#3b82f6' }}>{taskStats.inProgress || 0}</span><span className="mini-stat__label">In Progress</span></div>
          <div className="mini-stat"><span className="mini-stat__value" style={{ color: '#ef4444' }}>{taskStats.overdue || 0}</span><span className="mini-stat__label">Overdue</span></div>
          <div className="mini-stat"><span className="mini-stat__value" style={{ color: '#6366f1' }}>{taskStats.completionRate || 0}%</span><span className="mini-stat__label">Completion Rate</span></div>
        </div>
      </div>

      {/* Feedback Analytics */}
      <div className="analytics-section">
        <h2 className="section-title">Feedback Analytics</h2>
        <div className="stats-row">
          <div className="mini-stat"><span className="mini-stat__value">{feedbackStats.received || 0}</span><span className="mini-stat__label">Received</span></div>
          <div className="mini-stat"><span className="mini-stat__value">{feedbackStats.sent || 0}</span><span className="mini-stat__label">Sent</span></div>
        </div>
        {feedbackStats.byType && feedbackStats.byType.length > 0 && (
          <div className="analytics-breakdown">
            <h3 className="subsection-title">By Type</h3>
            <div className="breakdown-list">{feedbackStats.byType.map(function (t) { return <div key={t._id} className="breakdown-item"><span className="breakdown-item__label">{t._id}</span><span className="breakdown-item__value">{t.count}</span></div>; })}</div>
          </div>
        )}
      </div>

      {/* Recognition Analytics */}
      <div className="analytics-section">
        <h2 className="section-title">Recognition Analytics</h2>
        <div className="stats-row">
          <div className="mini-stat"><span className="mini-stat__value">{recognitionStats.received || 0}</span><span className="mini-stat__label">Received</span></div>
          <div className="mini-stat"><span className="mini-stat__value">{recognitionStats.sent || 0}</span><span className="mini-stat__label">Given</span></div>
          <div className="mini-stat mini-stat--purple"><span className="mini-stat__value">{recognitionStats.totalPoints || 0}</span><span className="mini-stat__label">Total Points</span></div>
        </div>
      </div>

      {/* Performance (Admin only) */}
      {performance && (
        <div className="analytics-section">
          <h2 className="section-title">Performance Overview</h2>
          <div className="stats-row">
            <div className="mini-stat mini-stat--green"><span className="mini-stat__value">{performance.overview?.companyAverage?.toFixed(1) || '0.0'}</span><span className="mini-stat__label">Company Avg</span></div>
            <div className="mini-stat mini-stat--red"><span className="mini-stat__value">{performance.overview?.redFlagsCount || 0}</span><span className="mini-stat__label">Red Flags (&lt;60)</span></div>
          </div>
          <div className="analytics-grid">
            <div className="analytics-card">
              <h3>🏆 Top Performers</h3>
              {performance.topPerformers?.length ? (
                <div className="perf-list">{performance.topPerformers.map(function (p) { return <div key={p._id} className="perf-item"><span>{p.user?.name || 'Unknown'}</span><span className="perf-score perf-score--good">{p.finalScore.toFixed(1)}</span></div>; })}</div>
              ) : <p className="empty-text">No data</p>}
            </div>
            <div className="analytics-card">
              <h3>⚠️ Needs Attention</h3>
              {performance.bottomPerformers?.length ? (
                <div className="perf-list">{performance.bottomPerformers.map(function (p) { return <div key={p._id} className="perf-item"><span>{p.user?.name || 'Unknown'}</span><span className={'perf-score' + (p.finalScore < 60 ? ' perf-score--bad' : ' perf-score--warn')}>{p.finalScore.toFixed(1)}</span></div>; })}</div>
              ) : <p className="empty-text">No data</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AnalyticsPage;
