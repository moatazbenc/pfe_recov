import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../components/AuthContext';
import {
  fetchCyclesByYear,
  createCycle,
  updateCycle,
  deleteCycle,
  openCycle,
  closeCycle,
} from '../api/cycles';
import { fetchMyReports, submitReport, uploadAttachments, deleteAttachment } from '../api/reports';

export default function EvaluationCalendar() {
  const { user } = useAuth();
  const [year, setYear] = useState(new Date().getFullYear());
  const [calendar, setCalendar] = useState([]);
  const [cycles, setCycles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Cycle Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    type: 'mid-year',
    year: year,
    submissionStart: '',
    submissionEnd: '',
    reviewDeadline: '',
    description: '',
  });

  // Report Modal State
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [selectedCycle, setSelectedCycle] = useState(null);
  const [objectives, setObjectives] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [expandedObjective, setExpandedObjective] = useState(null);
  const [reportForms, setReportForms] = useState({});
  const [submittingReport, setSubmittingReport] = useState({});
  const [uploadingFiles, setUploadingFiles] = useState({});

  const fileInputRefs = useRef({});

  const isAdmin = user?.role === 'Admin' || user?.role === 'HR';
  const isCollaborator = user?.role === 'Collaborator' || user?.role === 'Employee';

  // Load calendar
  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchCyclesByYear(year);
      setCalendar(data.calendar || []);
      setCycles(data.cycles || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [year]);

  // Find current open cycle
  const currentOpenCycle = cycles.find((c) => {
    if (c.status !== 'open') return false;
    const now = new Date();
    return now >= new Date(c.submissionStart) && now <= new Date(c.submissionEnd);
  });

  // =====================
  // CYCLE CRUD (Admin/HR)
  // =====================

  const openCreate = () => {
    setEditing(null);
    setForm({
      name: '',
      type: 'mid-year',
      year: year,
      submissionStart: '',
      submissionEnd: '',
      reviewDeadline: '',
      description: '',
    });
    setError('');
    setModalOpen(true);
  };

  const openEdit = (cycle, e) => {
    if (e) e.stopPropagation();
    setEditing(cycle);
    setForm({
      name: cycle.name,
      type: cycle.type,
      year: cycle.year,
      submissionStart: cycle.submissionStart ? cycle.submissionStart.split('T')[0] : '',
      submissionEnd: cycle.submissionEnd ? cycle.submissionEnd.split('T')[0] : '',
      reviewDeadline: cycle.reviewDeadline ? cycle.reviewDeadline.split('T')[0] : '',
      description: cycle.description || '',
    });
    setError('');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      if (editing) {
        await updateCycle(editing._id, form);
      } else {
        await createCycle(form);
      }
      closeModal();
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Delete this cycle?')) return;
    try {
      await deleteCycle(id);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggle = async (cycle, e) => {
    if (e) e.stopPropagation();
    try {
      if (cycle.status === 'open') {
        await closeCycle(cycle._id);
      } else {
        await openCycle(cycle._id);
      }
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  // =====================
  // REPORT SUBMISSION (Collaborators)
  // =====================

  const openReportModal = async (cycle) => {
    setSelectedCycle(cycle);
    setReportModalOpen(true);
    setLoadingReports(true);
    setError('');
    setExpandedObjective(null);

    try {
      const data = await fetchMyReports(cycle._id);
      setObjectives(data.objectives || []);

      // Initialize form data for each objective
      const forms = {};
      (data.objectives || []).forEach((obj) => {
        forms[obj.objective._id] = {
          progress: obj.report?.progress || 0,
          comments: obj.report?.comments || '',
          attachments: obj.report?.attachments || [],
          reportId: obj.report?._id || null,
        };
      });
      setReportForms(forms);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingReports(false);
    }
  };

  const closeReportModal = () => {
    setReportModalOpen(false);
    setSelectedCycle(null);
    setObjectives([]);
    setReportForms({});
    setExpandedObjective(null);
  };

  const updateReportForm = (objectiveId, field, value) => {
    setReportForms((prev) => ({
      ...prev,
      [objectiveId]: {
        ...prev[objectiveId],
        [field]: value,
      },
    }));
  };

  const handleSubmitReport = async (objectiveId) => {
    const formData = reportForms[objectiveId];
    if (!formData) return;

    setSubmittingReport((prev) => ({ ...prev, [objectiveId]: true }));
    setError('');

    try {
      const result = await submitReport({
        cycleId: selectedCycle._id,
        objectiveId,
        progress: formData.progress,
        comments: formData.comments,
      });

      // Update form with new report ID
      setReportForms((prev) => ({
        ...prev,
        [objectiveId]: {
          ...prev[objectiveId],
          reportId: result.report._id,
        },
      }));

      // Refresh objectives
      const data = await fetchMyReports(selectedCycle._id);
      setObjectives(data.objectives || []);

      setSuccess('Report submitted successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmittingReport((prev) => ({ ...prev, [objectiveId]: false }));
    }
  };

  const handleFileUpload = async (objectiveId, files) => {
    const formData = reportForms[objectiveId];
    if (!formData?.reportId) {
      setError('Please save the report first before uploading files');
      return;
    }

    setUploadingFiles((prev) => ({ ...prev, [objectiveId]: true }));

    try {
      const result = await uploadAttachments(formData.reportId, Array.from(files));

      setReportForms((prev) => ({
        ...prev,
        [objectiveId]: {
          ...prev[objectiveId],
          attachments: result.attachments || [],
        },
      }));

      setSuccess('Files uploaded!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploadingFiles((prev) => ({ ...prev, [objectiveId]: false }));
      if (fileInputRefs.current[objectiveId]) {
        fileInputRefs.current[objectiveId].value = '';
      }
    }
  };

  const handleDeleteAttachment = async (objectiveId, attachmentId) => {
    if (!window.confirm('Delete this file?')) return;

    const formData = reportForms[objectiveId];

    try {
      await deleteAttachment(formData.reportId, attachmentId);

      setReportForms((prev) => ({
        ...prev,
        [objectiveId]: {
          ...prev[objectiveId],
          attachments: prev[objectiveId].attachments.filter((a) => a._id !== attachmentId),
        },
      }));

      setSuccess('File deleted!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // =====================
  // RENDER
  // =====================

  const btnStyle = { padding: '8px 16px', border: '1px solid #ccc', borderRadius: 6, background: '#fff', cursor: 'pointer', fontSize: 14 };
  const smallBtn = { padding: '4px 8px', fontSize: 11, border: 'none', borderRadius: 4, cursor: 'pointer', marginRight: 4 };

  return (
    <div style={{ maxWidth: 1200, margin: '2rem auto', padding: '0 1rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ margin: 0 }}>📅 Evaluation Calendar</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={() => setYear(year - 1)} style={btnStyle}>← Prev</button>
          <span style={{ fontSize: 20, fontWeight: 600 }}>{year}</span>
          <button onClick={() => setYear(year + 1)} style={btnStyle}>Next →</button>
        </div>
        {isAdmin && (
          <button onClick={openCreate} style={{ ...btnStyle, background: '#3b82f6', color: '#fff', border: 'none' }}>
            + Create Cycle
          </button>
        )}
      </div>

      {/* Messages */}
      {error && <div style={{ padding: '1rem', background: '#fee', border: '1px solid #fcc', borderRadius: 6, color: '#c00', marginBottom: '1rem' }}>{error}</div>}
      {success && <div style={{ padding: '1rem', background: '#d1fae5', border: '1px solid #10b981', borderRadius: 6, color: '#065f46', marginBottom: '1rem' }}>{success}</div>}

      {/* Current Open Cycle Alert (for Collaborators) */}
      {currentOpenCycle && (
        <div style={{ padding: '1rem', background: '#ecfdf5', border: '2px solid #10b981', borderRadius: 8, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ fontWeight: 600, color: '#065f46' }}>🟢 {currentOpenCycle.name} is OPEN</div>
            <div style={{ fontSize: 14, color: '#047857' }}>
              Submit your reports by {new Date(currentOpenCycle.submissionEnd).toLocaleDateString()}
            </div>
          </div>
          <button
            onClick={() => openReportModal(currentOpenCycle)}
            style={{ ...btnStyle, background: '#10b981', color: '#fff', border: 'none' }}
          >
            📝 Submit Reports
          </button>
        </div>
      )}

      {/* Calendar */}
      {loading ? (
        <p style={{ textAlign: 'center', padding: '3rem' }}>Loading...</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
          {calendar.map((m) => (
            <div
              key={m.month}
              style={{
                background: m.hasOpenCycle ? '#ecfdf5' : '#fff',
                border: m.hasOpenCycle ? '2px solid #10b981' : '1px solid #e5e7eb',
                borderRadius: 12,
                padding: '1.5rem',
                cursor: m.hasOpenCycle ? 'pointer' : 'default',
              }}
              onClick={() => {
                if (m.hasOpenCycle) {
                  const openCycleInMonth = m.cycles.find((c) => c.status === 'open');
                  if (openCycleInMonth) openReportModal(openCycleInMonth);
                }
              }}
            >
              <h3 style={{ margin: '0 0 0.5rem' }}>{m.monthName}</h3>
              {m.cycles.length === 0 ? (
                <p style={{ color: '#999', fontSize: 13 }}>No cycle</p>
              ) : (
                m.cycles.map((c) => (
                  <div key={c._id} style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 13 }}>
                      {c.type === 'mid-year' ? '🌤️' : '❄️'} {c.name}
                    </div>
                    <span style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: 12,
                      fontSize: 11,
                      background: c.status === 'open' ? '#10b981' : c.status === 'draft' ? '#f59e0b' : '#6b7280',
                      color: '#fff',
                    }}>
                      {c.status}
                    </span>

                    {isAdmin && (
                      <div style={{ marginTop: 8 }}>
                        <button onClick={(e) => openEdit(c, e)} style={{ ...smallBtn, background: '#e0e7ff', color: '#4338ca' }}>Edit</button>
                        <button onClick={(e) => handleToggle(c, e)} style={{ ...smallBtn, background: '#d1fae5', color: '#065f46' }}>
                          {c.status === 'open' ? 'Close' : 'Open'}
                        </button>
                        <button onClick={(e) => handleDelete(c._id, e)} style={{ ...smallBtn, background: '#fee2e2', color: '#b91c1c' }}>Delete</button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          ))}
        </div>
      )}

      {/* Cycle Create/Edit Modal */}
      {modalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={closeModal}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, width: '100%', maxWidth: 500, maxHeight: '90vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginTop: 0 }}>{editing ? 'Edit Cycle' : 'Create Cycle'}</h2>
            {error && <div style={{ padding: '0.5rem', background: '#fee', border: '1px solid #fcc', borderRadius: 6, color: '#c00', marginBottom: '1rem' }}>{error}</div>}
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 4 }}>Name *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required style={{ width: '100%', padding: 10, border: '1px solid #ccc', borderRadius: 6, boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 4 }}>Type *</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} style={{ width: '100%', padding: 10, border: '1px solid #ccc', borderRadius: 6 }}>
                    <option value="mid-year">Mid-Year</option>
                    <option value="end-year">End-Year</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 4 }}>Year *</label>
                  <input type="number" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} required style={{ width: '100%', padding: 10, border: '1px solid #ccc', borderRadius: 6, boxSizing: 'border-box' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 4 }}>Start Date *</label>
                  <input type="date" value={form.submissionStart} onChange={(e) => setForm({ ...form, submissionStart: e.target.value })} required style={{ width: '100%', padding: 10, border: '1px solid #ccc', borderRadius: 6, boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 4 }}>End Date *</label>
                  <input type="date" value={form.submissionEnd} onChange={(e) => setForm({ ...form, submissionEnd: e.target.value })} required style={{ width: '100%', padding: 10, border: '1px solid #ccc', borderRadius: 6, boxSizing: 'border-box' }} />
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 4 }}>Review Deadline</label>
                <input type="date" value={form.reviewDeadline} onChange={(e) => setForm({ ...form, reviewDeadline: e.target.value })} style={{ width: '100%', padding: 10, border: '1px solid #ccc', borderRadius: 6, boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 4 }}>Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ width: '100%', padding: 10, border: '1px solid #ccc', borderRadius: 6, minHeight: 80, boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button type="button" onClick={closeModal} style={btnStyle}>Cancel</button>
                <button type="submit" disabled={saving} style={{ ...btnStyle, background: '#3b82f6', color: '#fff', border: 'none', opacity: saving ? 0.6 : 1 }}>
                  {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Report Submission Modal */}
      {reportModalOpen && selectedCycle && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }} onClick={closeReportModal}>
          <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 800, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
            
            {/* Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: 0 }}>📝 {selectedCycle.name}</h2>
                <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 14 }}>
                  Window: {new Date(selectedCycle.submissionStart).toLocaleDateString()} - {new Date(selectedCycle.submissionEnd).toLocaleDateString()}
                </p>
              </div>
              <button onClick={closeReportModal} style={{ background: 'none', border: 'none', fontSize: 28, cursor: 'pointer', color: '#6b7280' }}>×</button>
            </div>

            {/* Body */}
            <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
              {error && <div style={{ padding: '0.75rem', background: '#fee', border: '1px solid #fcc', borderRadius: 6, color: '#c00', marginBottom: '1rem' }}>{error}</div>}
              {success && <div style={{ padding: '0.75rem', background: '#d1fae5', border: '1px solid #10b981', borderRadius: 6, color: '#065f46', marginBottom: '1rem' }}>{success}</div>}

              {loadingReports ? (
                <p style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>Loading your objectives...</p>
              ) : objectives.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                  <p style={{ fontSize: 48, marginBottom: 16 }}>📋</p>
                  <p style={{ fontWeight: 600 }}>No Objectives Found</p>
                  <p>Create objectives first in the Objectives page.</p>
                </div>
              ) : (
                <>
                  {/* Summary */}
                  <div style={{ display: 'flex', gap: 16, marginBottom: 24, padding: 16, background: '#f9fafb', borderRadius: 8 }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 24, fontWeight: 700 }}>{objectives.filter((o) => o.isSubmitted).length}/{objectives.length}</div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>Submitted</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 24, fontWeight: 700 }}>
                        {objectives.length > 0 ? Math.round((objectives.filter((o) => o.isSubmitted).length / objectives.length) * 100) : 0}%
                      </div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>Complete</div>
                    </div>
                  </div>

                  {/* Objectives List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {objectives.map((obj) => {
                      const objectiveId = obj.objective._id;
                      const formData = reportForms[objectiveId] || { progress: 0, comments: '', attachments: [], reportId: null };
                      const isExpanded = expandedObjective === objectiveId;
                      const isSubmitting = submittingReport[objectiveId];
                      const isUploading = uploadingFiles[objectiveId];

                      return (
                        <div key={objectiveId} style={{ border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
                          {/* Header */}
                          <div
                            style={{ padding: 16, background: '#f9fafb', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                            onClick={() => setExpandedObjective(isExpanded ? null : objectiveId)}
                          >
                            <div>
                              <div style={{ fontWeight: 600 }}>{obj.objective.title}</div>
                              {obj.objective.description && <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>{obj.objective.description}</div>}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <span style={{ padding: '4px 8px', background: '#e0e7ff', color: '#4338ca', borderRadius: 4, fontSize: 12 }}>
                                Weight: {obj.objective.value}
                              </span>
                              <span style={{
                                padding: '4px 8px',
                                borderRadius: 4,
                                fontSize: 12,
                                background: obj.isSubmitted ? '#d1fae5' : '#fef3c7',
                                color: obj.isSubmitted ? '#065f46' : '#92400e',
                              }}>
                                {obj.isSubmitted ? '✓ Submitted' : '○ Pending'}
                              </span>
                              <span style={{ fontSize: 18, transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
                            </div>
                          </div>

                          {/* Expanded Content */}
                          {isExpanded && (
                            <div style={{ padding: 16, borderTop: '1px solid #e5e7eb' }}>
                              {/* Progress Slider */}
                              <div style={{ marginBottom: 16 }}>
                                <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>Progress: {formData.progress}%</label>
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  value={formData.progress}
                                  onChange={(e) => updateReportForm(objectiveId, 'progress', parseInt(e.target.value))}
                                  style={{ width: '100%' }}
                                />
                              </div>

                              {/* Comments */}
                              <div style={{ marginBottom: 16 }}>
                                <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>Comments</label>
                                <textarea
                                  value={formData.comments}
                                  onChange={(e) => updateReportForm(objectiveId, 'comments', e.target.value)}
                                  placeholder="Describe your progress, achievements, challenges..."
                                  style={{ width: '100%', padding: 10, border: '1px solid #ccc', borderRadius: 6, minHeight: 100, boxSizing: 'border-box' }}
                                />
                              </div>

                              {/* Attachments */}
                              <div style={{ marginBottom: 16 }}>
                                <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>Attachments</label>

                                {/* Existing Files */}
                                {formData.attachments.length > 0 && (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                                    {formData.attachments.map((att) => (
                                      <div key={att._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#f9fafb', borderRadius: 6 }}>
                                        <div>
                                          <span>📎 {att.originalName}</span>
                                          <span style={{ fontSize: 12, color: '#9ca3af', marginLeft: 8 }}>({formatFileSize(att.size)})</span>
                                        </div>
                                        <button
                                          onClick={() => handleDeleteAttachment(objectiveId, att._id)}
                                          style={{ ...smallBtn, background: '#fee2e2', color: '#b91c1c' }}
                                        >
                                          Delete
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Upload Area */}
                                <div
                                  style={{
                                    border: '2px dashed #d1d5db',
                                    borderRadius: 8,
                                    padding: 24,
                                    textAlign: 'center',
                                    cursor: formData.reportId ? 'pointer' : 'not-allowed',
                                    opacity: formData.reportId ? 1 : 0.5,
                                  }}
                                  onClick={() => {
                                    if (formData.reportId && !isUploading) {
                                      fileInputRefs.current[objectiveId]?.click();
                                    }
                                  }}
                                >
                                  <input
                                    type="file"
                                    multiple
                                    ref={(el) => (fileInputRefs.current[objectiveId] = el)}
                                    style={{ display: 'none' }}
                                    onChange={(e) => handleFileUpload(objectiveId, e.target.files)}
                                  />
                                  <div style={{ fontSize: 32, marginBottom: 8 }}>{isUploading ? '⏳' : '📁'}</div>
                                  <div style={{ color: '#6b7280' }}>
                                    {isUploading ? 'Uploading...' : formData.reportId ? 'Click to upload files (max 25MB)' : 'Save report first to upload files'}
                                  </div>
                                </div>
                              </div>

                              {/* Submit Button */}
                              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <button
                                  onClick={() => handleSubmitReport(objectiveId)}
                                  disabled={isSubmitting}
                                  style={{
                                    padding: '10px 20px',
                                    background: obj.isSubmitted ? '#3b82f6' : '#10b981',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: 6,
                                    cursor: 'pointer',
                                    opacity: isSubmitting ? 0.6 : 1,
                                  }}
                                >
                                  {isSubmitting ? '⏳ Saving...' : obj.isSubmitted ? '💾 Update Report' : '✅ Submit Report'}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}