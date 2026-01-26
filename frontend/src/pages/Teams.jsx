// src/pages/Teams.jsx
// Team management page for HR and Manager
// FIXED: Infinite loop and rendering issues

import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { fetchTeams, createTeam, updateTeam, deleteTeam } from '../api/teams';
import TeamModal from '../components/teams/TeamModal';
import ConfirmDeleteModal from '../components/teams/ConfirmDeleteModal';
import { ToastContainer, useToast } from '../components/common/Toast';

// Styles
const styles = {
  container: {
    maxWidth: '1000px',
    margin: '2rem auto',
    padding: '0 1rem',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
  },
  title: {
    margin: 0,
    fontSize: '24px',
    fontWeight: '600',
    color: '#111827',
  },
  createBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  createBtnIcon: {
    fontSize: '18px',
    lineHeight: '1',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    backgroundColor: 'white',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  th: {
    padding: '12px 16px',
    textAlign: 'left',
    backgroundColor: '#f9fafb',
    borderBottom: '1px solid #e5e7eb',
    fontSize: '12px',
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  td: {
    padding: '12px 16px',
    borderBottom: '1px solid #e5e7eb',
    fontSize: '14px',
    color: '#374151',
  },
  actions: {
    display: 'flex',
    gap: '8px',
  },
  actionBtn: {
    padding: '6px 10px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.2s',
  },
  editBtn: {
    backgroundColor: '#e0e7ff',
    color: '#4338ca',
  },
  deleteBtn: {
    backgroundColor: '#fee2e2',
    color: '#b91c1c',
  },
  loading: {
    textAlign: 'center',
    padding: '3rem',
    color: '#6b7280',
    fontSize: '16px',
  },
  error: {
    padding: '1rem',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '6px',
    color: '#b91c1c',
    marginBottom: '1rem',
  },
  empty: {
    textAlign: 'center',
    padding: '3rem',
    color: '#6b7280',
    fontSize: '16px',
  },
  badge: {
    display: 'inline-block',
    padding: '2px 8px',
    backgroundColor: '#e0e7ff',
    color: '#4338ca',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '500',
    marginRight: '4px',
    marginBottom: '4px',
  },
  managerInfo: {
    display: 'flex',
    flexDirection: 'column',
  },
  managerName: {
    fontWeight: '500',
    color: '#111827',
  },
  managerEmail: {
    fontSize: '12px',
    color: '#6b7280',
  },
  collaboratorList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px',
    maxWidth: '300px',
  },
  noData: {
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  retryBtn: {
    marginTop: '1rem',
    padding: '8px 16px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    cursor: 'pointer',
  },
};

const Teams = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toasts, removeToast, showSuccess, showError } = useToast();

  // Data state
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Prevent infinite loop - track if we've already fetched
  const hasFetched = useRef(false);

  // Check if user is HR (can perform CRUD)
  const isHR = user?.role === 'HR' || user?.role === 'Admin';

  // Fetch teams function
  const loadTeams = async () => {
    console.log('[Teams] loadTeams called');
    
    try {
      setLoading(true);
      setError('');
      
      const data = await fetchTeams();
      
      console.log('[Teams] Raw response:', data);
      
      // Extract teams array
      let teamsArray = [];
      if (Array.isArray(data)) {
        teamsArray = data;
      } else if (Array.isArray(data.teams)) {
        teamsArray = data.teams;
      } else if (Array.isArray(data.data)) {
        teamsArray = data.data;
      }
      
      console.log('[Teams] Setting teams:', teamsArray);
      setTeams(teamsArray);
      
    } catch (err) {
      console.error('[Teams] Error:', err);
      
      if (err.status === 401) {
        showError('Session expired. Please login again.');
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }
      
      if (err.status === 403) {
        setError('You do not have permission to view teams.');
        return;
      }

      setError(err.message || 'Failed to load teams');
      
    } finally {
      setLoading(false);
    }
  };

  // Fetch teams ONCE on mount
  useEffect(() => {
    // Wait for auth to complete
    if (authLoading) {
      console.log('[Teams] Auth loading, waiting...');
      return;
    }
    
    // Check if user exists
    if (!user) {
      console.log('[Teams] No user, redirecting to login');
      navigate('/login');
      return;
    }
    
    // Prevent duplicate fetches
    if (hasFetched.current) {
      console.log('[Teams] Already fetched, skipping');
      return;
    }
    
    console.log('[Teams] Initial fetch for user:', user.name);
    hasFetched.current = true;
    loadTeams();
    
  }, [authLoading, user, navigate]);

  // Handle Create Team
  const handleCreate = async (teamData) => {
    setIsSubmitting(true);
    setIsCreateModalOpen(false);

    try {
      const data = await createTeam(teamData);
      const newTeam = data.team || data;
      
      // Add to local state
      setTeams((prev) => [...prev, newTeam]);
      showSuccess(`Team "${newTeam.name}" created successfully!`);
      
    } catch (err) {
      console.error('[Teams] Create error:', err);

      if (err.status === 401) {
        showError('Session expired. Please login again.');
        navigate('/login');
        return;
      }
      
      if (err.status === 409) {
        showError(err.message || 'A team with this name or manager already exists.');
        return;
      }

      showError(err.message || 'Failed to create team');
      
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Edit Team
  const handleEdit = async (teamData) => {
    if (!selectedTeam) return;

    setIsSubmitting(true);
    const teamId = selectedTeam._id;
    setIsEditModalOpen(false);

    try {
      const data = await updateTeam(teamId, teamData);
      const updatedTeam = data.team || data;
      
      // Update local state
      setTeams((prev) =>
        prev.map((t) => (t._id === teamId ? updatedTeam : t))
      );
      showSuccess(`Team "${updatedTeam.name}" updated successfully!`);
      
    } catch (err) {
      console.error('[Teams] Update error:', err);

      if (err.status === 401) {
        showError('Session expired. Please login again.');
        navigate('/login');
        return;
      }
      
      if (err.status === 409) {
        showError(err.message || 'A team with this name or manager already exists.');
        return;
      }

      showError(err.message || 'Failed to update team');
      
    } finally {
      setIsSubmitting(false);
      setSelectedTeam(null);
    }
  };

  // Handle Delete Team
  const handleDelete = async () => {
    if (!selectedTeam) return;

    setIsSubmitting(true);
    const teamToDelete = selectedTeam;
    const teamId = selectedTeam._id;
    setIsDeleteModalOpen(false);

    try {
      await deleteTeam(teamId);
      
      // Remove from local state
      setTeams((prev) => prev.filter((t) => t._id !== teamId));
      showSuccess(`Team "${teamToDelete.name}" deleted successfully!`);
      
    } catch (err) {
      console.error('[Teams] Delete error:', err);

      if (err.status === 401) {
        showError('Session expired. Please login again.');
        navigate('/login');
        return;
      }

      showError(err.message || 'Failed to delete team');
      
    } finally {
      setIsSubmitting(false);
      setSelectedTeam(null);
    }
  };

  // Manual retry
  const handleRetry = () => {
    hasFetched.current = false;
    loadTeams();
  };

  // Open Edit Modal
  const openEditModal = (team) => {
    setSelectedTeam(team);
    setIsEditModalOpen(true);
  };

  // Open Delete Modal
  const openDeleteModal = (team) => {
    setSelectedTeam(team);
    setIsDeleteModalOpen(true);
  };

  // Show loading while auth is checking
  if (authLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Checking authentication...</div>
      </div>
    );
  }

  // Main render
  return (
    <div style={styles.container}>
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Header */}
      <div style={styles.header}>
        <h2 style={styles.title}>Teams ({teams.length})</h2>

        {isHR && (
          <button
            style={styles.createBtn}
            onClick={() => setIsCreateModalOpen(true)}
          >
            <span style={styles.createBtnIcon}>➕</span>
            Create Team
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div style={styles.error}>
          {error}
          <br />
          <button style={styles.retryBtn} onClick={handleRetry}>
            Retry
          </button>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div style={styles.loading}>Loading teams...</div>
      ) : teams.length === 0 ? (
        <div style={styles.empty}>
          {isHR
            ? 'No teams yet. Click "Create Team" to add one.'
            : 'No teams found.'}
        </div>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Manager</th>
              <th style={styles.th}>Collaborators</th>
              {isHR && <th style={{ ...styles.th, width: '120px' }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {teams.map((team) => (
              <tr key={team._id}>
                <td style={styles.td}>
                  <strong>{team.name}</strong>
                </td>

                <td style={styles.td}>
                  {team.manager ? (
                    <div style={styles.managerInfo}>
                      <span style={styles.managerName}>
                        {team.manager.name || 'Unknown'}
                      </span>
                      {team.manager.email && (
                        <span style={styles.managerEmail}>{team.manager.email}</span>
                      )}
                    </div>
                  ) : (
                    <span style={styles.noData}>No manager</span>
                  )}
                </td>

                <td style={styles.td}>
                  {team.collaborators && team.collaborators.length > 0 ? (
                    <div style={styles.collaboratorList}>
                      {team.collaborators.map((c, idx) => (
                        <span key={c._id || idx} style={styles.badge}>
                          {c.name || 'Unknown'}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span style={styles.noData}>No collaborators</span>
                  )}
                </td>

                {isHR && (
                  <td style={styles.td}>
                    <div style={styles.actions}>
                      <button
                        style={{ ...styles.actionBtn, ...styles.editBtn }}
                        onClick={() => openEditModal(team)}
                        title="Edit team"
                      >
                        ✏️
                      </button>
                      <button
                        style={{ ...styles.actionBtn, ...styles.deleteBtn }}
                        onClick={() => openDeleteModal(team)}
                        title="Delete team"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Create Team Modal */}
      <TeamModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreate}
        team={null}
        isLoading={isSubmitting}
      />

      {/* Edit Team Modal */}
      <TeamModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedTeam(null);
        }}
        onSubmit={handleEdit}
        team={selectedTeam}
        isLoading={isSubmitting}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedTeam(null);
        }}
        onConfirm={handleDelete}
        team={selectedTeam}
        isLoading={isSubmitting}
      />
    </div>
  );
};

export default Teams;