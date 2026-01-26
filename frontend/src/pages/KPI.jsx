// KPI/statistics dashboard page for all roles
// Shows team/employee performance and evolution
import React, { useEffect, useState } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

const KPI = () => {
  const [teamPerformance, setTeamPerformance] = useState(null);
  const [employeeRanking, setEmployeeRanking] = useState([]);
  const [evolution, setEvolution] = useState([]);
  const [error, setError] = useState('');

  // Example: fetch team performance for a team and cycle
  useEffect(() => {
    const fetchKPI = async () => {
      try {
        const token = localStorage.getItem('token');
        // Replace with actual teamId and cycle as needed
        const teamRes = await fetch('/api/kpi/team-performance?teamId=TEAM_ID&cycle=mid-year', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const teamData = await teamRes.json();
        if (teamData.success) setTeamPerformance(teamData.average);
        // Employee ranking
        const rankRes = await fetch('/api/kpi/employee-ranking?cycle=mid-year', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const rankData = await rankRes.json();
        if (rankData.success) setEmployeeRanking(rankData.ranking);
        // Performance evolution for a user (replace USER_ID)
        const evoRes = await fetch('/api/kpi/performance-evolution?userId=USER_ID', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const evoData = await evoRes.json();
        if (evoData.success) setEvolution(evoData.evolution);
      } catch (err) {
        setError(err.message);
      }
    };
    fetchKPI();
  }, []);

  return (
    <div style={{ maxWidth: 900, margin: '2rem auto' }}>
      <h2>KPI & Statistics Dashboard</h2>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <div>
        <h3>Team Performance (mid-year)</h3>
        {teamPerformance !== null ? (
          <Bar
            data={{
              labels: ['Team'],
              datasets: [{
                label: 'Average Score',
                data: [teamPerformance],
                backgroundColor: '#36a2eb'
              }]
            }}
            options={{
              responsive: true,
              plugins: { legend: { display: false } }
            }}
          />
        ) : 'Loading...'}
      </div>
      <div>
        <h3>Employee Ranking (mid-year)</h3>
        {employeeRanking.length > 0 ? (
          <Bar
            data={{
              labels: employeeRanking.map(r => r.user?.name),
              datasets: [{
                label: 'Total Score',
                data: employeeRanking.map(r => r.totalScore),
                backgroundColor: '#4bc0c0'
              }]
            }}
            options={{
              responsive: true,
              plugins: { legend: { display: false } }
            }}
          />
        ) : 'Loading...'}
      </div>
      <div>
        <h3>Performance Evolution (USER_ID)</h3>
        {evolution.length > 0 ? (
          <Line
            data={{
              labels: evolution.map(e => e._id),
              datasets: [{
                label: 'Total Score',
                data: evolution.map(e => e.totalScore),
                borderColor: '#ff6384',
                backgroundColor: 'rgba(255,99,132,0.2)'
              }]
            }}
            options={{
              responsive: true,
              plugins: { legend: { display: true } }
            }}
          />
        ) : 'Loading...'}
      </div>
      {/* TODO: Replace TEAM_ID and USER_ID with actual values from context/user */}
    </div>
  );
};

export default KPI;
