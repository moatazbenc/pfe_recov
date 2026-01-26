// HR Decisions management page (HR only)
// Lists HR decisions and allows CRUD for HR
import React, { useEffect, useState } from 'react';

const HRDecisions = () => {
  const [decisions, setDecisions] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDecisions = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/hrdecisions', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
        setDecisions(data.decisions);
      } catch (err) {
        setError(err.message);
      }
    };
    fetchDecisions();
  }, []);

  return (
    <div style={{ maxWidth: 900, margin: '2rem auto' }}>
      <h2>HR Decisions</h2>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <table border="1" cellPadding="8" style={{ width: '100%', marginTop: '1rem' }}>
        <thead>
          <tr>
            <th>User</th>
            <th>Type</th>
            <th>Reason</th>
            <th>Date</th>
            <th>Created By</th>
          </tr>
        </thead>
        <tbody>
          {decisions.map(dec => (
            <tr key={dec._id}>
              <td>{dec.user?.name}</td>
              <td>{dec.decisionType}</td>
              <td>{dec.reason}</td>
              <td>{new Date(dec.date).toLocaleDateString()}</td>
              <td>{dec.createdBy?.name}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* TODO: Add create/edit/delete for HR */}
    </div>
  );
};

export default HRDecisions;
