import { useState, useEffect } from 'react';
import { api } from '../../api';
import type { Team, Tag, User } from '../../types';

export default function AdminTeams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTagIds, setEditTagIds] = useState<string[]>([]);
  const [editMemberIds, setEditMemberIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setIsLoading(true);
    setError(null);
    try {
      const [teamsRes, tagsRes, usersRes] = await Promise.all([
        api.listTeams(),
        api.listTags(1, 100),
        api.listUsers(1, 100),
      ]);
      setTeams(teamsRes.data.data?.items || []);
      setAllTags(tagsRes.data.data?.items || []);
      setAllUsers(usersRes.data.data?.items || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load teams');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) {
      setError('Team name is required');
      return;
    }

    setIsCreating(true);
    setError(null);
    try {
      const response = await api.createTeam(newName.trim());
      setTeams([...teams, response.data.data!].sort((a, b) => a.name.localeCompare(b.name)));
      setNewName('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create team');
    } finally {
      setIsCreating(false);
    }
  }

  function startEditing(team: Team) {
    setEditingId(team.id);
    setEditTagIds(team.tags?.map((t) => t.id) || []);
    setEditMemberIds(team.members?.map((m) => m.id) || []);
    setError(null);
  }

  function toggleTag(tagId: string) {
    setEditTagIds((ids) =>
      ids.includes(tagId) ? ids.filter((id) => id !== tagId) : [...ids, tagId]
    );
  }

  function toggleMember(userId: string) {
    setEditMemberIds((ids) =>
      ids.includes(userId) ? ids.filter((id) => id !== userId) : [...ids, userId]
    );
  }

  async function handleSave(teamId: string) {
    setIsSaving(true);
    setError(null);
    try {
      const response = await api.updateTeam(teamId, {
        tagIds: editTagIds,
        memberIds: editMemberIds,
      });
      setTeams(teams.map((t) => (t.id === teamId ? response.data.data! : t)));
      setEditingId(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update team');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(teamId: string) {
    if (!confirm('Are you sure you want to delete this team? Members will lose its tag visibility.')) return;

    setDeletingId(teamId);
    setError(null);
    try {
      await api.deleteTeam(teamId);
      setTeams(teams.filter((t) => t.id !== teamId));
      if (editingId === teamId) setEditingId(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete team');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div style={styles.card}>
      <h2 style={styles.title}>Team Management</h2>
      <p style={styles.subtitle}>
        Members see reports and tickets whose tags overlap their team's tags.
      </p>

      {error && <div style={styles.error}>{error}</div>}

      {/* Create Form */}
      <form onSubmit={handleCreate} style={styles.form}>
        <div style={styles.formRow}>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Enter new team name..."
            style={styles.input}
            disabled={isCreating}
          />
          <button type="submit" style={styles.btnPrimary} disabled={isCreating}>
            {isCreating ? 'Creating...' : '+ Add Team'}
          </button>
        </div>
      </form>

      {/* Teams List */}
      {isLoading ? (
        <p>Loading teams...</p>
      ) : teams.length === 0 ? (
        <p style={styles.empty}>No teams yet. Create one to grant members tag-based visibility.</p>
      ) : (
        <div style={styles.teamList}>
          {teams.map((team) => (
            <div key={team.id} style={styles.teamCard}>
              <div style={styles.teamHeader}>
                <h3 style={styles.teamName}>{team.name}</h3>
                <div style={styles.teamActions}>
                  {editingId === team.id ? (
                    <>
                      <button
                        onClick={() => handleSave(team.id)}
                        style={styles.btnSave}
                        disabled={isSaving}
                      >
                        {isSaving ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        style={styles.btnCancel}
                        disabled={isSaving}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => startEditing(team)} style={styles.btnEdit}>
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(team.id)}
                        style={styles.btnDelete}
                        disabled={deletingId === team.id}
                      >
                        {deletingId === team.id ? 'Deleting...' : '✕ Delete'}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {editingId === team.id ? (
                <div style={styles.editSection}>
                  <div style={styles.editGroup}>
                    <p style={styles.editLabel}>Tags (visibility)</p>
                    <div style={styles.chipRow}>
                      {allTags.map((tag) => (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => toggleTag(tag.id)}
                          style={{
                            ...styles.chip,
                            ...(editTagIds.includes(tag.id) ? styles.chipActive : {}),
                          }}
                        >
                          {editTagIds.includes(tag.id) ? '✓ ' : ''}
                          {tag.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={styles.editGroup}>
                    <p style={styles.editLabel}>Members</p>
                    <div style={styles.chipRow}>
                      {allUsers.map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => toggleMember(u.id)}
                          style={{
                            ...styles.chip,
                            ...(editMemberIds.includes(u.id) ? styles.chipActive : {}),
                          }}
                        >
                          {editMemberIds.includes(u.id) ? '✓ ' : ''}
                          {u.name} ({u.role})
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={styles.teamBody}>
                  <div style={styles.teamMeta}>
                    <span style={styles.metaLabel}>Tags:</span>
                    {team.tags && team.tags.length > 0 ? (
                      team.tags.map((tag) => (
                        <span key={tag.id} style={styles.tagBadge}>
                          {tag.name}
                        </span>
                      ))
                    ) : (
                      <span style={styles.metaEmpty}>none — members of this team see only their own items</span>
                    )}
                  </div>
                  <div style={styles.teamMeta}>
                    <span style={styles.metaLabel}>Members:</span>
                    {team.members && team.members.length > 0 ? (
                      team.members.map((m) => (
                        <span key={m.id} style={styles.memberBadge}>
                          {m.name}
                        </span>
                      ))
                    ) : (
                      <span style={styles.metaEmpty}>none</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <p style={styles.info}>
        Total teams: <strong>{teams.length}</strong>
      </p>
    </div>
  );
}

const styles = {
  card: {
    backgroundColor: 'var(--surface)',
    borderRadius: '8px',
    padding: '32px',
    boxShadow: '0 2px 10px var(--shadow)',
  },
  title: {
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '4px',
    color: 'var(--text)',
  },
  subtitle: {
    fontSize: '13px',
    color: 'var(--text-faint)',
    marginBottom: '24px',
  },
  error: {
    padding: '12px 16px',
    backgroundColor: 'var(--danger-bg)',
    color: 'var(--danger-text)',
    borderRadius: '4px',
    fontSize: '14px',
    marginBottom: '16px',
  },
  form: {
    marginBottom: '24px',
  },
  formRow: {
    display: 'flex',
    gap: '12px',
  },
  input: {
    flex: 1,
    padding: '10px 12px',
    border: '1px solid var(--border-strong)',
    borderRadius: '4px',
    fontSize: '14px',
    backgroundColor: 'var(--input-bg)',
    color: 'var(--text)',
  },
  btnPrimary: {
    padding: '10px 20px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500' as const,
  },
  teamList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  teamCard: {
    padding: '16px',
    backgroundColor: 'var(--bg)',
    borderRadius: '6px',
    border: '1px solid var(--border)',
  },
  teamHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  teamName: {
    fontSize: '16px',
    fontWeight: '600',
    color: 'var(--text)',
    margin: 0,
  },
  teamActions: {
    display: 'flex',
    gap: '8px',
  },
  btnEdit: {
    padding: '6px 14px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '500' as const,
  },
  btnDelete: {
    padding: '6px 10px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '500' as const,
  },
  btnSave: {
    padding: '6px 14px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '500' as const,
  },
  btnCancel: {
    padding: '6px 14px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '500' as const,
  },
  teamBody: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  teamMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flexWrap: 'wrap' as const,
    fontSize: '13px',
  },
  metaLabel: {
    color: 'var(--text-muted)',
    fontWeight: '600' as const,
    minWidth: '70px',
  },
  metaEmpty: {
    color: 'var(--text-faint)',
    fontStyle: 'italic' as const,
  },
  tagBadge: {
    padding: '3px 10px',
    backgroundColor: 'var(--tag-bg)',
    color: 'var(--tag-text)',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '500' as const,
  },
  memberBadge: {
    padding: '3px 10px',
    backgroundColor: 'var(--success-bg)',
    color: 'var(--success-text)',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '500' as const,
  },
  editSection: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  editGroup: {},
  editLabel: {
    fontSize: '13px',
    fontWeight: '600' as const,
    color: 'var(--text-muted)',
    marginBottom: '8px',
  },
  chipRow: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '8px',
  },
  chip: {
    padding: '6px 14px',
    backgroundColor: 'var(--surface)',
    color: 'var(--text)',
    border: '1px solid var(--border-strong)',
    borderRadius: '16px',
    cursor: 'pointer',
    fontSize: '13px',
  },
  chipActive: {
    backgroundColor: '#007bff',
    color: 'white',
    borderColor: '#007bff',
  },
  empty: {
    fontSize: '14px',
    color: 'var(--text-faint)',
    fontStyle: 'italic',
  },
  info: {
    fontSize: '14px',
    color: 'var(--text-muted)',
    marginTop: '24px',
  },
};
