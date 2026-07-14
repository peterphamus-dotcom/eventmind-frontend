import { useState, useEffect } from 'react';
import { api } from '../../api';
import type { User } from '../../types';

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
                <th style={styles.headerCell}>Current Role</th>
                <th style={styles.headerCell}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} style={styles.row}>
                  <td style={styles.cell}>{user.name}</td>
                  <td style={styles.cell}>{user.email}</td>
                  <td style={styles.cell}>
                    <span
                      style={{
                        ...styles.badge,
                        backgroundColor:
                          user.role === 'ADMIN'
                            ? '#dc3545'
                            : user.role === 'CORE_TEAM'
                              ? '#007bff'
                              : '#6c757d',
                      }}
                    >
                      {user.role}
                    </span>
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
                          style={{
                            ...styles.btnSmall,
                            backgroundColor: '#6c757d',
                          }}
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
  card: {
    backgroundColor: 'var(--surface)',
    borderRadius: '8px',
    padding: '32px',
    boxShadow: '0 2px 10px var(--shadow)',
  },
  title: {
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '24px',
    color: 'var(--text)',
  },
  error: {
    padding: '12px 16px',
    backgroundColor: 'var(--danger-bg)',
    color: 'var(--danger-text)',
    borderRadius: '4px',
    fontSize: '14px',
    marginBottom: '16px',
  },
  filterRow: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    marginBottom: '24px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--text)',
  },
  select: {
    padding: '8px 12px',
    border: '1px solid var(--border-strong)',
    borderRadius: '4px',
    fontSize: '14px',
    backgroundColor: 'var(--input-bg)',
    color: 'var(--text)',
  },
  tableContainer: {
    overflowX: 'auto' as const,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
  },
  headerRow: {
    backgroundColor: 'var(--bg)',
    borderBottom: '2px solid var(--border-strong)',
  },
  headerCell: {
    padding: '12px',
    textAlign: 'left' as const,
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--text)',
  },
  row: {
    borderBottom: '1px solid var(--border)',
  },
  cell: {
    padding: '12px',
    fontSize: '14px',
    color: 'var(--text)',
  },
  badge: {
    display: 'inline-block',
    padding: '4px 8px',
    borderRadius: '4px',
    color: 'white',
    fontSize: '12px',
    fontWeight: '600' as const,
  },
  editRow: {
    display: 'flex',
    gap: '8px',
  },
  selectSmall: {
    padding: '6px 8px',
    border: '1px solid var(--border-strong)',
    borderRadius: '4px',
    fontSize: '13px',
    backgroundColor: 'var(--input-bg)',
    color: 'var(--text)',
  },
  btnSmall: {
    padding: '6px 12px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500' as const,
  },
  btnEdit: {
    padding: '6px 12px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500' as const,
  },
  empty: {
    fontSize: '14px',
    color: 'var(--text-faint)',
    fontStyle: 'italic',
  },
};
