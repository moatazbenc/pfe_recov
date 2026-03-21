import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../components/AuthContext';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import GoalCard from '../components/dashboard/GoalCard';
import MeetingCard from '../components/dashboard/MeetingCard';
import TaskCard from '../components/dashboard/TaskCard';
import RecognitionCard from '../components/dashboard/RecognitionCard';
import ReviewCard from '../components/dashboard/ReviewCard';
import FeedbackCard from '../components/dashboard/FeedbackCard';
import SurveyCard from '../components/dashboard/SurveyCard';
import ProgressDonut from '../components/dashboard/ProgressDonut';

function Dashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('me');
  const [objectives, setObjectives] = useState([]);
  const [stats, setStats] = useState({ users: 0, teams: 0, objectives: 0, cycles: 0 });
  const [recentActivity, setRecentActivity] = useState({ objectives: [], decisions: [] });
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiRisks, setAiRisks] = useState([]);

  var API = 'http://localhost:5000';

  // Map tab keys to API scope values
  function getScopeFromTab(tab) {
    if (tab === 'team') return 'team';
    if (tab === 'org') return 'org';
    return 'me';
  }

  async function fetchData(tab) {
    setLoading(true);
    try {
      var scope = getScopeFromTab(tab);
      var token = localStorage.getItem('token');
      var headers = { Authorization: 'Bearer ' + token };

      var promises = [
        axios.get(API + '/api/stats/dashboard?scope=' + scope, { headers }),
        axios.get(API + '/api/stats/recent-activity?scope=' + scope, { headers }),
        axios.get(API + '/api/objectives/my', { headers }),
      ];

      if (user.role === 'ADMIN' || user.role === 'HR') {
        promises.push(axios.get(API + '/api/stats/performance', { headers }));
      }

      var results = await Promise.all(promises);

      setStats(results[0].data);
      setRecentActivity(results[1].data);
      var objs = results[2].data;
      setObjectives(Array.isArray(objs) ? objs : (objs.objectives || []));
      if (results[3]) setPerformance(results[3].data);

      // AI Risk Detection
      try {
        var objArr = Array.isArray(objs) ? objs : (objs.objectives || []);
        if (objArr.length > 0) {
          var riskRes = await axios.post(API + '/api/ai/detect-risks', { objectives: objArr }, { headers });
          setAiRisks(riskRes.data.risks || []);
        } else {
          setAiRisks([]);
        }
      } catch (e) { }
    } catch (err) {
      console.error('Fetch dashboard data error:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(function () {
    fetchData(activeTab);
  }, [activeTab]);

  function handleTabChange(newTab) {
    setActiveTab(newTab);
  }

  function getHeatmapData() {
    var objArr = Array.isArray(objectives) ? objectives : [];
    var statusGroups = { on_track: 0, at_risk: 0, off_track: 0, achieved: 0, no_status: 0, closed: 0 };
    objArr.forEach(function (o) {
      var s = o.goalStatus || 'no_status';
      if (statusGroups[s] !== undefined) statusGroups[s]++;
      else statusGroups.no_status++;
    });
    return statusGroups;
  }

  function getTimelineItems() {
    var items = [];
    var objArr = Array.isArray(objectives) ? objectives : [];
    objArr.forEach(function (o) {
      items.push({ type: 'goal', title: o.title, date: o.updatedAt || o.createdAt, status: o.goalStatus, progress: o.achievementPercent || 0 });
    });
    if (recentActivity.decisions) {
      recentActivity.decisions.forEach(function (d) {
        items.push({ type: 'decision', title: d.subject || d.type, date: d.createdAt, status: d.decision });
      });
    }
    items.sort(function (a, b) { return new Date(b.date) - new Date(a.date); });
    return items.slice(0, 8);
  }

  // Tab-aware labels
  function getStatsLabels() {
    if (activeTab === 'me') return { goals: 'My Goals', teams: 'My Team', users: 'Profile', cycles: 'Active Cycles' };
    if (activeTab === 'team') return { goals: 'Team Goals', teams: 'Teams', users: 'Team Members', cycles: 'Active Cycles' };
    return { goals: 'All Goals', teams: 'All Teams', users: 'All Users', cycles: 'All Cycles' };
  }

  var heatmap = getHeatmapData();
  var heatmapColors = { on_track: '#059669', at_risk: '#D97706', off_track: '#DC2626', achieved: '#7C3AED', no_status: '#9CA3AF', closed: '#6B7280' };
  var labels = getStatsLabels();

  if (loading) {
    return (
      <div className="dash-loading">
        <div className="dash-loading__spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dash">
      <DashboardHeader activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Quick Stats Row */}
      <div className="dash-stats-row">
        <div className="dash-stat">
          <div className="dash-stat__icon dash-stat__icon--purple">🎯</div>
          <div className="dash-stat__info">
            <span className="dash-stat__value">{stats.objectives}</span>
            <span className="dash-stat__label">{labels.goals}</span>
          </div>
        </div>
        <div className="dash-stat">
          <div className="dash-stat__icon dash-stat__icon--blue">👥</div>
          <div className="dash-stat__info">
            <span className="dash-stat__value">{stats.teams}</span>
            <span className="dash-stat__label">{labels.teams}</span>
          </div>
        </div>
        <div className="dash-stat">
          <div className="dash-stat__icon dash-stat__icon--green">👤</div>
          <div className="dash-stat__info">
            <span className="dash-stat__value">{stats.users}</span>
            <span className="dash-stat__label">{labels.users}</span>
          </div>
        </div>
        <div className="dash-stat">
          <div className="dash-stat__icon dash-stat__icon--orange">📅</div>
          <div className="dash-stat__info">
            <span className="dash-stat__value">{stats.cycles}</span>
            <span className="dash-stat__label">{labels.cycles}</span>
          </div>
        </div>
      </div>

      {/* AI Risk Alerts */}
      {aiRisks.length > 0 && (
        <div className="dash-risk-alerts">
          <h3 className="dash-risk-alerts__title">🤖 AI Risk Alerts ({aiRisks.length})</h3>
          <div className="dash-risk-alerts__list">
            {aiRisks.slice(0, 3).map(function (r, i) {
              var severityClass = r.severity === 'high' ? 'dash-risk--high' : r.severity === 'medium' ? 'dash-risk--medium' : 'dash-risk--low';
              var icon = r.severity === 'high' ? '🔴' : r.severity === 'medium' ? '🟡' : '🔵';
              return (
                <div key={i} className={'dash-risk-item ' + severityClass}>
                  <span>{icon} {r.message}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Goal Heatmap */}
      <div className="dash-heatmap">
        <h3 className="dash-heatmap__title">🗺️ Goal Heatmap</h3>
        <div className="dash-heatmap__grid">
          {Object.entries(heatmap).map(function (entry) {
            var key = entry[0]; var count = entry[1];
            var color = heatmapColors[key] || '#9CA3AF';
            var label = key.replace(/_/g, ' ').replace(/\b\w/g, function (l) { return l.toUpperCase(); });
            return (
              <div key={key} className="dash-heatmap__cell" style={{
                background: color + '18', borderColor: color + '40', '--heatmap-color': color
              }}>
                <div className="dash-heatmap__count" style={{ color: color }}>{count}</div>
                <div className="dash-heatmap__label" style={{ color: color }}>{label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Cards Grid */}
      <div className="dash-grid">
        <div className="dash-grid__col dash-grid__col--left">
          <MeetingCard />
          <RecognitionCard />
        </div>
        <div className="dash-grid__col dash-grid__col--right">
          <GoalCard objectives={objectives} loading={false} />
          <TaskCard />
        </div>
      </div>

      {/* Performance Timeline */}
      <div className="dash-timeline">
        <h3 className="dash-timeline__title">📈 Performance Timeline</h3>
        {getTimelineItems().length === 0 ? (
          <p className="dash-timeline__empty">No recent activity to display.</p>
        ) : (
          <div className="dash-timeline__list">
            {getTimelineItems().map(function (item, i) {
              var dotColor = item.type === 'goal' ? '#4F46E5' : '#10B981';
              var statusLabel = item.status ? (' — ' + (item.status || '').replace(/_/g, ' ')) : '';
              return (
                <div key={i} className="dash-timeline__item">
                  <div className="dash-timeline__dot" style={{ background: dotColor }}></div>
                  <div className="dash-timeline__content">
                    <div className="dash-timeline__item-title">
                      {item.type === 'goal' ? '🎯' : '⚖️'} {item.title}
                      <span className="dash-timeline__item-status">{statusLabel}</span>
                    </div>
                    <div className="dash-timeline__item-date">
                      {item.date ? new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                      {item.progress > 0 && <span className="dash-timeline__item-progress">{item.progress}%</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Row */}
      <div className="dash-bottom-row">
        <ReviewCard recentDecisions={recentActivity.decisions} />
        <FeedbackCard />
        <SurveyCard />
      </div>

      {/* Performance section for ADMIN/HR */}
      {performance && (user.role === 'ADMIN' || user.role === 'HR') && (
        <div className="dash-performance">
          <h2 className="dash-performance__title">📊 Executive Performance Overview</h2>
          <div className="dash-performance__grid">
            <div className="dash-performance__stat">
              <span className="dash-performance__stat-label">Company Average</span>
              <span className="dash-performance__stat-value">
                {performance.overview?.companyAverage?.toFixed(1) || '0.0'}<small>/100</small>
              </span>
            </div>
            <div className="dash-performance__stat dash-performance__stat--danger">
              <span className="dash-performance__stat-label">Red Flags (&lt;60%)</span>
              <span className="dash-performance__stat-value">
                {performance.overview?.redFlagsCount || 0}<small> employees</small>
              </span>
            </div>
          </div>
          <div className="dash-performance__lists">
            <div className="dash-performance__list">
              <h4>🏆 Top 5 Performers</h4>
              {performance.topPerformers?.length === 0 ? (
                <p className="dash-card__empty">No data available.</p>
              ) : (
                <ul>
                  {performance.topPerformers?.map(function (p) { return (
                    <li key={p._id}>
                      <span>{p.user?.name || 'Unknown'} <small>({p.user?.role || 'N/A'})</small></span>
                      <span className="dash-performance__score dash-performance__score--good">{p.finalScore.toFixed(1)}</span>
                    </li>
                  ); })}
                </ul>
              )}
            </div>
            <div className="dash-performance__list">
              <h4>⚠️ Bottom 5 Performers</h4>
              {performance.bottomPerformers?.length === 0 ? (
                <p className="dash-card__empty">No data available.</p>
              ) : (
                <ul>
                  {performance.bottomPerformers?.map(function (p) { return (
                    <li key={p._id}>
                      <span>{p.user?.name || 'Unknown'} <small>({p.user?.role || 'N/A'})</small></span>
                      <span className={'dash-performance__score' + (p.finalScore < 60 ? ' dash-performance__score--bad' : ' dash-performance__score--warn')}>{p.finalScore.toFixed(1)}</span>
                    </li>
                  ); })}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;