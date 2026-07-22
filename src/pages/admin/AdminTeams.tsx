import { useState, useEffect } from 'react';
import { api } from '../../api';
import { styles as shared } from '../../components/AdminShared';
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
                        {deletingId === team.id ? 'Deleting…' : 'Delete'}
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
  card: shared.card,
  title: shared.titleTight,
  subtitle: shared.subtitle,
  error: {
    padding: '11px 14px',
    backgroundColor: 'var(--danger-soft)',
    color: 'var(--danger-text)',
    borderRadius: '9px',
    fontSize: '14px',
    marginBottom: '16px',
  },
  form: {
    marginBottom: '20px',
  },
  formRow: shared.addRow,
  input: shared.addInput,
  btnPrimary: shared.addBtn,
  teamList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '14px',
  },
  teamCard: shared.row,
  teamHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
    gap: '10px',
  },
  teamName: {
    fontSize: '15px',
    fontWeight: '700' as const,
    color: 'var(--text)',
    margin: 0,
  },
  teamActions: shared.rowActions,
  btnEdit: shared.btnPrimary,
  btnDelete: shared.btnDanger,
  btnSave: shared.btnSuccess,
  btnCancel: shared.btnNeutral,
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
    minWidth: '64px',
  },
  metaEmpty: {
    color: 'var(--text-faint)',
    fontStyle: 'italic' as const,
  },
  tagBadge: shared.pillAccent,
  memberBadge: shared.pillSuccess,
  editSection: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '14px',
  },
  editGroup: {},
  editLabel: {
    fontSize: '11px',
    fontWeight: '700' as const,
    color: 'var(--text-muted)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
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
    // Longhand: chipActive overrides borderColor alone, and mixing
    // that with the border shorthand makes React warn on every toggle.
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'var(--border-strong)',
    borderRadius: '16px',
    cursor: 'pointer',
    fontSize: '13px',
  },
  chipActive: {
    backgroundColor: 'var(--accent)',
    color: 'white',
    borderColor: 'var(--accent)',
  },
  empty: shared.empty,
  info: {
    fontSize: '13px',
    color: 'var(--text-muted)',
    marginTop: '20px',
  },
};
