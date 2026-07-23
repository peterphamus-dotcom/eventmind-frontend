import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, photoSrc } from '../../api';
import { styles as shared, roleBadge } from '../../components/AdminShared';
import type { User } from '../../types';

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

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<string>('');

  useEffect(() => {
    loadUsers();
  }, [selectedRole]);

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

      {/* Filter */}
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
};
