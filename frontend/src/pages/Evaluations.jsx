// Evaluations management page for all roles
// Lists evaluations for user/team/all depending on role
import React, { useEffect, useState } from 'react';

const Evaluations = () => {
  const [evaluations, setEvaluations] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchEvaluations = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/evaluations', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
        setEvaluations(data.evaluations);
      } catch (err) {
        setError(err.message);
      }
    };
    fetchEvaluations();
  }, []);

  return (
    <div style={{ maxWidth: 900, margin: '2rem auto' }}>
      <h2>Evaluations</h2>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <table border="1" cellPadding="8" style={{ width: '100%', marginTop: '1rem' }}>
        <thead>
          <tr>
            <th>Objective</th>
            <th>Cycle</th>
            <th>Score</th>
            <th>Final Score</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {evaluations.map(ev => (
            <tr key={ev._id}>
              <td>{ev.objective?.title}</td>
              <td>{ev.cycle}</td>
              <td>{ev.score}</td>
              <td>{ev.finalScore}</td>
              <td>{ev.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* TODO: Add create/finalize actions for managers */}
    </div>
  );
};

export default Evaluations;
