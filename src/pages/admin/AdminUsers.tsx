import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, photoSrc } from '../../api';
import { useToast } from '../../Toast';
import { styles as shared, roleBadge } from '../../components/AdminShared';
import { Modal } from '../../components/Modal';
import type { User, Role, Team, Location } from '../../types';

const FlagIcon = (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: '-1px' }}>
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
    <line x1="4" y1="22" x2="4" y2="15" />
  </svg>
);

function relativeTime(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

interface ComposerState {
  name: string;
  email: string;
  password: string;
  role: Role;
  homeLocationId: string;
  teamIds: string[];
}

const emptyComposer: ComposerState = { name: '', email: '', password: '', role: 'MEMBER', homeLocationId: '', teamIds: [] };

export default function AdminUsers() {
  const showToast = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<string>('');

  const [composer, setComposer] = useState<ComposerState | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [composerError, setComposerError] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, [selectedRole]);

  useEffect(() => {
    api.listTeams().then((res) => setTeams(res.data.data?.items || [])).catch(() => {});
    api.listLocations().then((res) => setLocations(res.data.data?.items || [])).catch(() => {});
  }, []);

  async function loadUsers() {
    setIsLoading(true);
    setError(null);
    try {
      const filters = selectedRole ? { role: selectedRole } : {};
      const response = await api.listUsers(1, 100, filters as any);
      setUsers(response.data.data?.items || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  }

  function openComposer() {
    setComposer({ ...emptyComposer, homeLocationId: locations[0]?.id || '' });
    setComposerError(null);
  }

  function toggleComposerTeam(id: string) {
    if (!composer) return;
    setComposer({
      ...composer,
      teamIds: composer.teamIds.includes(id) ? composer.teamIds.filter((t) => t !== id) : [...composer.teamIds, id],
    });
  }

  async function submitNewUser() {
    if (!composer || submitting) return;
    if (!composer.name.trim()) {
      setComposerError('Please enter a name');
      return;
    }
    if (!composer.email.trim()) {
      setComposerError('Please enter an email address');
      return;
    }
    if (composer.password.length < 8) {
      setComposerError('Password must be at least 8 characters');
      return;
    }
    if (!composer.homeLocationId) {
      setComposerError('Please choose a home location');
      return;
    }
    setSubmitting(true);
    setComposerError(null);
    try {
      const res = await api.createUser({
        name: composer.name.trim(),
        email: composer.email.trim(),
        password: composer.password,
        role: composer.role,
        homeLocationId: composer.homeLocationId,
        teamIds: composer.teamIds,
      });
      const created = res.data.data!;
      setUsers((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setComposer(null);
      showToast(`${created.name} added`);
    } catch (err: any) {
      setComposerError(err.response?.data?.error || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdateRole(userId: string, newRole: string) {
    try {
      await api.updateUser(userId, newRole);
      setUsers(
        users.map((u) =>
          u.id === userId ? { ...u, role: newRole as any } : u
        )
      );
      setEditingId(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update user');
    }
  }

  return (
    <div style={styles.card}>
      <h2 style={styles.title}>User Management</h2>

      {error && <div style={styles.error}>{error}</div>}

      {/* Filter + add */}
      <div style={styles.filterRow}>
        <label style={styles.label}>Filter by role:</label>
        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          style={styles.select}
        >
          <option value="">All roles</option>
          <option value="ADMIN">Admin</option>
          <option value="CORE_TEAM">Core Team</option>
          <option value="MEMBER">Member</option>
          <option value="EXPO">Expo</option>
        </select>
        <button onClick={openComposer} style={shared.addBtn}>
          + Add User
        </button>
      </div>

      {/* Users Table */}
      {isLoading ? (
        <p>Loading users...</p>
      ) : users.length === 0 ? (
        <p style={styles.empty}>No users found</p>
      ) : (
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.headerRow}>
                <th style={styles.headerCell}>Name</th>
                <th style={styles.headerCell}>Email</th>
                <th style={styles.headerCell}>Phone</th>
                <th style={styles.headerCell}>Bio</th>
                <th style={styles.headerCell}>Last Report</th>
                <th style={styles.headerCell}>Reports</th>
                <th style={styles.headerCell}>Current Role</th>
                <th style={styles.headerCell}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} style={styles.row}>
                  <td style={styles.cell}>
                    <Link to={`/users/${user.id}`} style={styles.nameCell}>
                      {user.avatarUrl ? (
                        <img src={photoSrc(user.avatarUrl)} alt="" style={styles.avatar} />
                      ) : (
                        <div style={styles.avatarPlaceholder}>
                          {user.name.slice(0, 1).toUpperCase()}
                        </div>
                      )}
                      {user.name}
                    </Link>
                  </td>
                  <td style={styles.cell}>{user.email}</td>
                  <td style={styles.cell}>{user.phone || '—'}</td>
                  <td style={styles.cell} title={user.bio || undefined}>
                    <span style={styles.bioText}>{user.bio || '—'}</span>
                  </td>
                  <td style={styles.cell} title={user.lastReportAt ? new Date(user.lastReportAt).toLocaleString() : undefined}>
                    {user.lastReportAt ? relativeTime(user.lastReportAt) : '—'}
                  </td>
                  <td style={styles.cell}>
                    {user.reportCount ? (
                      <span style={styles.reportBadge}>{FlagIcon} {user.reportCount}</span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td style={styles.cell}>
                    <span style={roleBadge(user.role)}>{user.role}</span>
                  </td>
                  <td style={styles.cell}>
                    {editingId === user.id ? (
                      <div style={styles.editRow}>
                        <select
                          value={editRole}
                          onChange={(e) => setEditRole(e.target.value)}
                          style={styles.selectSmall}
                        >
                          <option value="ADMIN">Admin</option>
                          <option value="CORE_TEAM">Core Team</option>
                          <option value="MEMBER">Member</option>
                          <option value="EXPO">Expo</option>
                        </select>
                        <button
                          onClick={() =>
                            handleUpdateRole(user.id, editRole)
                          }
                          style={styles.btnSmall}
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          style={{ ...styles.btnSmall, backgroundColor: 'var(--neutral)' }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingId(user.id);
                          setEditRole(user.role);
                        }}
                        style={styles.btnEdit}
                      >
                        Edit Role
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {composer && (
        <Modal title="Add User" onClose={() => setComposer(null)}>
          {composerError && <div style={styles.error}>{composerError}</div>}
          <p style={styles.composerHint}>
            Creates the account immediately with the role and location below — no approval step needed.
          </p>

          <div style={styles.field}>
            <label style={styles.fieldLabel}>Name</label>
            <input
              value={composer.name}
              onChange={(e) => setComposer({ ...composer, name: e.target.value })}
              style={shared.input}
              maxLength={100}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.fieldLabel}>Email</label>
            <input
              type="email"
              value={composer.email}
              onChange={(e) => setComposer({ ...composer, email: e.target.value })}
              style={shared.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.fieldLabel}>Password</label>
            <input
              type="text"
              value={composer.password}
              onChange={(e) => setComposer({ ...composer, password: e.target.value })}
              style={shared.input}
              placeholder="At least 8 characters"
            />
          </div>

          <div style={styles.field}>
            <label style={styles.fieldLabel}>Role</label>
            <select
              value={composer.role}
              onChange={(e) => setComposer({ ...composer, role: e.target.value as Role })}
              style={styles.select}
            >
              <option value="MEMBER">Member</option>
              <option value="CORE_TEAM">Core Team</option>
              <option value="ADMIN">Admin</option>
              <option value="EXPO">Expo</option>
            </select>
          </div>

          <div style={styles.field}>
            <label style={styles.fieldLabel}>Home location</label>
            <select
              value={composer.homeLocationId}
              onChange={(e) => setComposer({ ...composer, homeLocationId: e.target.value })}
              style={styles.select}
            >
              <option value="">Select…</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          </div>

          <div style={styles.field}>
            <label style={styles.fieldLabel}>Teams (optional)</label>
            {teams.length === 0 ? (
              <span style={styles.noTeams}>No teams yet — you can assign them later.</span>
            ) : (
              <div style={styles.teamChecks}>
                {teams.map((team) => (
                  <label key={team.id} style={styles.teamCheck}>
                    <input
                      type="checkbox"
                      checked={composer.teamIds.includes(team.id)}
                      onChange={() => toggleComposerTeam(team.id)}
                    />
                    {team.name}
                  </label>
                ))}
              </div>
            )}
          </div>

          <button onClick={submitNewUser} style={styles.primaryBtn} disabled={submitting}>
            {submitting ? 'Creating…' : 'Create user'}
          </button>
        </Modal>
      )}
    </div>
  );
}

const styles = {
  card: shared.card,
  title: shared.title,
  error: {
    padding: '11px 14px',
    backgroundColor: 'var(--danger-soft)',
    color: 'var(--danger-text)',
    borderRadius: '9px',
    fontSize: '14px',
    marginBottom: '16px',
  },
  filterRow: shared.filterRow,
  label: shared.filterLabel,
  select: shared.selectSmall,
  tableContainer: {
    overflowX: 'auto' as const,
  },
  table: shared.table,
  headerRow: shared.thead,
  headerCell: shared.th,
  row: shared.tr,
  cell: shared.td,
  nameCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '9px',
    color: 'var(--text)',
    textDecoration: 'none',
  },
  reportBadge: {
    display: 'inline-block',
    padding: '3px 8px',
    backgroundColor: 'var(--danger-soft)',
    color: 'var(--danger-text)',
    borderRadius: '10px',
    fontSize: '12px',
    fontWeight: '600' as const,
  },
  avatar: {
    width: '26px',
    height: '26px',
    borderRadius: '50%',
    objectFit: 'cover' as const,
    flexShrink: 0,
  },
  avatarPlaceholder: shared.avatarSm,
  bioText: {
    display: 'inline-block',
    maxWidth: '180px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
    verticalAlign: 'bottom',
  },
  editRow: {
    display: 'flex',
    gap: '6px',
    alignItems: 'center',
  },
  selectSmall: {
    padding: '5px 7px',
    border: '1px solid var(--border-strong)',
    borderRadius: '5px',
    fontSize: '12px',
    backgroundColor: 'var(--surface)',
    color: 'var(--text)',
  },
  btnSmall: {
    padding: '6px 10px',
    backgroundColor: 'var(--accent)',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600' as const,
  },
  btnEdit: {
    padding: '6px 12px',
    backgroundColor: 'var(--accent)',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12.5px',
    fontWeight: '600' as const,
  },
  empty: shared.empty,
  composerHint: {
    fontSize: '13px',
    color: 'var(--text-muted)',
    margin: '0 0 16px',
  },
  field: {
    marginBottom: '14px',
  },
  fieldLabel: {
    display: 'block',
    fontSize: '12px',
    fontWeight: '600' as const,
    color: 'var(--text-muted)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    marginBottom: '6px',
  },
  teamChecks: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '8px',
  },
  teamCheck: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '14px',
    color: 'var(--text)',
  },
  noTeams: {
    fontSize: '13px',
    color: 'var(--text-faint)',
    fontStyle: 'italic' as const,
  },
  primaryBtn: {
    padding: '10px 20px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600' as const,
    width: '100%',
  },
};
