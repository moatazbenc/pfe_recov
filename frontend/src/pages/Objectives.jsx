import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../components/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const isSuperUser = (role) => role === 'Admin' || role === 'HR';
const isEmployee = (role) => role === 'Collaborator' || role === 'Employee';

export default function Objectives() {
  const { user } = useAuth();

  const [objectives, setObjectives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Create form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [value, setValue] = useState(11);
  const [owner, setOwner] = useState(''); // only for Admin/HR

  // Edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editValue, setEditValue] = useState(11);
  const [editStatus, setEditStatus] = useState('draft'); // only for Admin/HR
  const [editOwner, setEditOwner] = useState(''); // only for Admin/HR

  const totals = useMemo(() => {
    const sum = objectives.reduce((acc, o) => acc + (Number(o.value) || 0), 0);
    return { count: objectives.length, sum };
  }, [objectives]);

  const token = () => localStorage.getItem('token');

  const fetchObjectives = async () => {
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const t = token();
      if (!t) throw new Error('You are not logged in');

      const res = await fetch(`${API_BASE_URL}/api/objectives`, {
        headers: { Authorization: `Bearer ${t}` },
      });

      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || `Failed to load objectives (${res.status})`);
      }

      setObjectives(data.objectives || []);
    } catch (err) {
      setError(err.message || 'Error loading objectives');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchObjectives();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    try {
      const t = token();
      if (!t) throw new Error('You are not logged in');

      const payload = {
        title,
        description,
        value: Number(value),
        ...(isSuperUser(user?.role) && owner ? { owner } : {}),
      };

      const res = await fetch(`${API_BASE_URL}/api/objectives`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${t}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || `Failed to create objective (${res.status})`);
      }

      setSuccessMsg('Objective created.');
      setTitle('');
      setDescription('');
      setValue(11);
      setOwner('');

      await fetchObjectives();
    } catch (err) {
      setError(err.message || 'Error creating objective');
    }
  };

  const openEdit = (obj) => {
    setError('');
    setSuccessMsg('');
    setEditOpen(true);
    setEditId(obj._id);
    setEditTitle(obj.title || '');
    setEditDescription(obj.description || '');
    setEditValue(Number(obj.value) || 11);
    setEditStatus(obj.status || 'draft');
    setEditOwner(obj.owner?.email || obj.owner || '');
  };

  const closeEdit = () => {
    setEditOpen(false);
    setEditId(null);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    try {
      const t = token();
      if (!t) throw new Error('You are not logged in');

      const payload = {
        title: editTitle,
        description: editDescription,
        value: Number(editValue),
      };

      // Only Admin/HR can change these (backend allows it)
      if (isSuperUser(user?.role)) {
        payload.status = editStatus;
        if (editOwner) payload.owner = editOwner; // email or userId
      }

      const res = await fetch(`${API_BASE_URL}/api/objectives/${editId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${t}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || `Failed to update objective (${res.status})`);
      }

      setSuccessMsg('Objective updated.');
      closeEdit();
      await fetchObjectives();
    } catch (err) {
      setError(err.message || 'Error updating objective');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this objective?')) return;
    setError('');
    setSuccessMsg('');

    try {
      const t = token();
      if (!t) throw new Error('You are not logged in');

      const res = await fetch(`${API_BASE_URL}/api/objectives/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${t}` },
      });

      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || `Failed to delete objective (${res.status})`);
      }

      setSuccessMsg('Objective deleted.');
      setObjectives((prev) => prev.filter((o) => o._id !== id));
    } catch (err) {
      setError(err.message || 'Error deleting objective');
    }
  };

  const handleSubmit = async (id) => {
    setError('');
    setSuccessMsg('');

    try {
      const t = token();
      if (!t) throw new Error('You are not logged in');

      const res = await fetch(`${API_BASE_URL}/api/objectives/${id}/submit`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}` },
      });

      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || `Failed to submit (${res.status})`);
      }

      setSuccessMsg('Objective submitted.');
      await fetchObjectives();
    } catch (err) {
      setError(err.message || 'Error submitting objective');
    }
  };

  const handleValidate = async (id) => {
    setError('');
    setSuccessMsg('');

    try {
      const t = token();
      if (!t) throw new Error('You are not logged in');

      const res = await fetch(`${API_BASE_URL}/api/objectives/${id}/validate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}` },
      });

      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || `Failed to validate (${res.status})`);
      }

      setSuccessMsg('Objective validated.');
      await fetchObjectives();
    } catch (err) {
      setError(err.message || 'Error validating objective');
    }
  };

  const canSubmit = (obj) => {
    if (isSuperUser(user?.role)) return obj.status === 'draft';
    if (isEmployee(user?.role)) return obj.status === 'draft';
    return false;
  };

  const canValidate = (obj) => {
    if (isSuperUser(user?.role)) return obj.status !== 'validated';
    if (user?.role === 'Manager') return obj.status === 'submitted';
    return false;
  };

  return (
    <div className="container">
      <div className="pageHeader">
        <div>
          <h1>Objectives</h1>
          {user && <p className="muted">Logged in as {user.email} ({user.role})</p>}
        </div>

        <div className="statsRow">
          <div className="statCard">
            <div className="statLabel">Count</div>
            <div className="statValue">{totals.count}</div>
          </div>
          <div className="statCard">
            <div className="statLabel">Sum of values</div>
            <div className="statValue">{totals.sum}</div>
          </div>
        </div>
      </div>

      {error && <div className="alert alertDanger">{error}</div>}
      {successMsg && <div className="alert alertSuccess">{successMsg}</div>}

      <div className="card">
        <div className="cardHeader">
          <h2>Create Objective</h2>
          <p className="muted">Value must be between <b>11</b> and <b>39</b>.</p>
        </div>

        <form onSubmit={handleCreate} className="formGrid">
          <div className="field">
            <label>Title</label>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>

          <div className="field">
            <label>Value</label>
            <input
              className="input"
              type="number"
              min={11}
              max={39}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              required
            />
          </div>

          <div className="field fieldFull">
            <label>Description</label>
            <textarea className="input" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          {isSuperUser(user?.role) && (
            <div className="field fieldFull">
              <label>Owner (Admin/HR only) — email or userId</label>
              <input
                className="input"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                placeholder="user@email.com OR 65f..."
              />
              <div className="hint">Leave empty to assign to yourself.</div>
            </div>
          )}

          <div className="actionsRow fieldFull">
            <button className="btn" type="submit">Add Objective</button>
            <button className="btn btnGhost" type="button" onClick={fetchObjectives}>Refresh</button>
          </div>
        </form>
      </div>

      <div className="card">
        <div className="cardHeaderRow">
          <h2>Objectives List</h2>
          {loading && <span className="muted">Loading…</span>}
        </div>

        <div className="tableWrap">
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Description</th>
                <th>Value</th>
                <th>Status</th>
                <th>Owner</th>
                <th style={{ width: 320 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {!loading && objectives.length === 0 && (
                <tr>
                  <td colSpan={6} className="emptyCell">No objectives yet</td>
                </tr>
              )}

              {objectives.map((obj) => (
                <tr key={obj._id}>
                  <td><b>{obj.title}</b></td>
                  <td className="muted">{obj.description || '-'}</td>
                  <td>{obj.value}</td>
                  <td><span className={`badge badge-${obj.status}`}>{obj.status}</span></td>
                  <td className="muted">{obj.owner?.email || obj.owner || 'N/A'}</td>
                  <td style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button className="btn btnGhost" onClick={() => openEdit(obj)}>
                      Edit
                    </button>

                    {canSubmit(obj) && (
                      <button className="btn btnGhost" onClick={() => handleSubmit(obj._id)}>
                        Submit
                      </button>
                    )}

                    {canValidate(obj) && (
                      <button className="btn" onClick={() => handleValidate(obj._id)}>
                        Validate
                      </button>
                    )}

                    <button className="btn btnDanger" onClick={() => handleDelete(obj._id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>

          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editOpen && (
        <div
          onClick={closeEdit}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,.55)',
            display: 'grid',
            placeItems: 'center',
            padding: 16,
            zIndex: 50,
          }}
        >
          <div className="card" style={{ width: 'min(700px, 96%)' }} onClick={(e) => e.stopPropagation()}>
            <div className="cardHeaderRow">
              <h2>Edit Objective</h2>
              <button className="btn btnGhost" onClick={closeEdit}>Close</button>
            </div>

            <form onSubmit={handleUpdate} className="formGrid">
              <div className="field">
                <label>Title</label>
                <input className="input" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required />
              </div>

              <div className="field">
                <label>Value</label>
                <input
                  className="input"
                  type="number"
                  min={11}
                  max={39}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  required
                />
              </div>

              <div className="field fieldFull">
                <label>Description</label>
                <textarea className="input" rows={3} value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
              </div>

              {isSuperUser(user?.role) && (
                <>
                  <div className="field">
                    <label>Status (Admin/HR)</label>
                    <select className="input" value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                      <option value="draft">draft</option>
                      <option value="submitted">submitted</option>
                      <option value="validated">validated</option>
                    </select>
                  </div>

                  <div className="field">
                    <label>Owner (Admin/HR)</label>
                    <input
                      className="input"
                      value={editOwner}
                      onChange={(e) => setEditOwner(e.target.value)}
                      placeholder="email or userId"
                    />
                  </div>
                </>
              )}

              <div className="actionsRow fieldFull">
                <button className="btn" type="submit">Save changes</button>
                <button className="btn btnGhost" type="button" onClick={closeEdit}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}