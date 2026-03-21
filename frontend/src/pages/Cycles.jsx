import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../components/AuthContext';

function Cycles() {
  const { user } = useAuth();
  const [cycles, setCycles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCycle, setEditingCycle] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    year: new Date().getFullYear(),
    type: 'Mid-Year',
    status: 'active',
    evaluationStart: '',
    evaluationEnd: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const API = 'http://localhost:5000';

  async function fetchCycles() {
    try {
      const res = await axios.get(API + '/api/cycles');
      setCycles(res.data);
    } catch (err) {
      console.error('Fetch cycles error:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(function () {
    fetchCycles();
  }, []);

  function openCreateModal() {
    setEditingCycle(null);
    setFormData({
      name: '',
      year: new Date().getFullYear(),
      type: 'Mid-Year',
      status: 'active',
      evaluationStart: '',
      evaluationEnd: ''
    });
    setShowModal(true);
    setError('');
  }

  function openEditModal(cycle) {
    setEditingCycle(cycle);
    setFormData({
      name: cycle.name,
      year: cycle.year,
      type: cycle.type,
      status: cycle.status,
      evaluationStart: cycle.evaluationStart ? cycle.evaluationStart.substring(0, 10) : '',
      evaluationEnd: cycle.evaluationEnd ? cycle.evaluationEnd.substring(0, 10) : ''
    });
    setShowModal(true);
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editingCycle) {
        await axios.put(API + '/api/cycles/' + editingCycle._id, formData);
        setSuccess('Cycle updated successfully!');
      } else {
        await axios.post(API + '/api/cycles', formData);
        setSuccess('Cycle created successfully!');
      }
      setShowModal(false);
      fetchCycles();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save cycle');
    }
  }

  async function handleDelete(id) {
    try {
      await axios.delete(API + '/api/cycles/' + id);
      setSuccess('Cycle deleted!');
      fetchCycles();
    } catch (err) {
      setError('Failed to delete cycle');
    }
  }

  function getStatusColor(status) {
    const colors = {
      draft: '#95a5a6',
      active: '#27ae60',
      closed: '#3498db',
    };
    return colors[status] || '#666';
  }

  function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString();
  }

  if (loading) {
    return <div className="loading">Loading cycles...</div>;
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>📅 Evaluation Cycles</h1>
        {(user.role === 'ADMIN' || user.role === 'HR') && (
          <button onClick={openCreateModal} className="add-btn">+ Create Cycle</button>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {cycles.length === 0 ? (
        <div className="empty-state">
          <h2>📅 No Cycles Yet</h2>
          <p>Create your first evaluation cycle to get started.</p>
        </div>
      ) : (
        <div className="cycles-grid">
          {cycles.map(function (cycle) {
            return (
              <div key={cycle._id} className="cycle-card">
                <div className="cycle-header">
                  <h3>{cycle.name}</h3>
                  <span className="status-badge" style={{ backgroundColor: getStatusColor(cycle.status) }}>
                    {cycle.status}
                  </span>
                </div>

                <div className="cycle-info">
                  <p><strong>Year:</strong> {cycle.year}</p>
                  <p><strong>Type:</strong> {cycle.type}</p>
                </div>

                <div className="cycle-dates">
                  <div className="date-section">
                    <h4>📝 Evaluation Period</h4>
                    <p>{formatDate(cycle.evaluationStart)} - {formatDate(cycle.evaluationEnd)}</p>
                  </div>
                </div>

                {(user.role === 'ADMIN' || user.role === 'HR') && (
                  <div className="card-actions">
                    <button onClick={function () { openEditModal(cycle); }} className="edit-btn">
                      ✏️ Edit
                    </button>
                    <button onClick={function () { handleDelete(cycle._id); }} className="delete-btn">
                      🗑️ Delete
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{editingCycle ? '✏️ Edit Cycle' : '📅 Create Cycle'}</h2>
              <button onClick={function () { setShowModal(false); }} className="close-btn">×</button>
            </div>

            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Cycle Name:</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={function (e) { setFormData({ ...formData, name: e.target.value }); }}
                  placeholder="e.g., 2024 Mid-Year Evaluation"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Year:</label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={function (e) { setFormData({ ...formData, year: parseInt(e.target.value) }); }}
                    min="2020"
                    max="2030"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Type:</label>
                  <select
                    value={formData.type}
                    onChange={function (e) { setFormData({ ...formData, type: e.target.value }); }}
                  >
                    <option value="Mid-Year">Mid-Year</option>
                    <option value="End-Year">End-Year</option>
                    <option value="Quarter">Quarter</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Status:</label>
                <select
                  value={formData.status}
                  onChange={function (e) { setFormData({ ...formData, status: e.target.value }); }}
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div className="form-section">
                <h4>📝 Evaluation Period</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>Start:</label>
                    <input
                      type="date"
                      value={formData.evaluationStart}
                      onChange={function (e) { setFormData({ ...formData, evaluationStart: e.target.value }); }}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>End:</label>
                    <input
                      type="date"
                      value={formData.evaluationEnd}
                      onChange={function (e) { setFormData({ ...formData, evaluationEnd: e.target.value }); }}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button type="submit" className="submit-btn">
                  {editingCycle ? 'Update Cycle' : 'Create Cycle'}
                </button>
                <button type="button" onClick={function () { setShowModal(false); }} className="cancel-btn">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Cycles;