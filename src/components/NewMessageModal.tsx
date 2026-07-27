import { useState, useEffect, useMemo } from 'react';
import { Modal } from './Modal';
import { api } from '../api';
import type { MessageableUser } from '../types';

interface Props {
  onClose: () => void;
  onCreated: (conversationId: string) => void;
}

/** Start a new 1:1 or group conversation with anyone who has opted in to direct messages. */
export function NewMessageModal({ onClose, onCreated }: Props) {
  const [users, setUsers] = useState<MessageableUser[] | null>(null);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getMessageableUsers()
      .then((res) => setUsers(res.data.data || []))
      .catch(() => setUsers([]));
  }, []);

  const filtered = useMemo(() => {
    if (!users) return [];
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => u.name.toLowerCase().includes(q));
  }, [users, search]);

  const isGroup = selected.length > 1;

  function toggle(userId: string) {
    setSelected((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]));
  }

  async function submit() {
    if (selected.length === 0 || creating) return;
    if (isGroup && groupName.trim().length === 0) {
      setError('Group conversations need a name');
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const res = await api.createConversation({
        participantIds: selected,
        isGroup,
        name: isGroup ? groupName.trim() : undefined,
      });
      if (res.data.data) onCreated(res.data.data.id);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to start conversation');
      setCreating(false);
    }
  }

  return (
    <Modal title="New Message" onClose={onClose}>
      {error && <div style={styles.error}>{error}</div>}

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search people…"
        style={styles.search}
      />

      <div style={styles.list}>
        {users == null ? (
          <p style={styles.empty}>Loading…</p>
        ) : filtered.length === 0 ? (
          <p style={styles.empty}>
            {users.length === 0 ? 'No one has opted in to direct messages yet.' : 'No matches.'}
          </p>
        ) : (
          filtered.map((u) => (
            <label key={u.id} style={styles.row}>
              <input type="checkbox" checked={selected.includes(u.id)} onChange={() => toggle(u.id)} />
              <span style={styles.name}>{u.name}</span>
              <span style={styles.role}>{u.role}</span>
            </label>
          ))
        )}
      </div>

      {isGroup && (
        <div style={styles.groupNameField}>
          <label style={styles.label}>Group name</label>
          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="e.g. Floor Team"
            style={styles.search}
            maxLength={100}
          />
        </div>
      )}

      <button
        onClick={submit}
        style={{ ...styles.submitBtn, opacity: selected.length === 0 ? 0.5 : 1 }}
        disabled={selected.length === 0 || creating}
      >
        {creating ? 'Starting…' : isGroup ? `Start group with ${selected.length}` : 'Start conversation'}
      </button>
    </Modal>
  );
}

const styles: Record<string, React.CSSProperties> = {
  error: {
    padding: '11px 13px',
    backgroundColor: 'var(--danger-soft)',
    color: 'var(--danger-text)',
    borderRadius: '8px',
    fontSize: '13px',
    marginBottom: '12px',
  },
  search: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid var(--border-strong)',
    borderRadius: '8px',
    backgroundColor: 'var(--input-bg)',
    color: 'var(--text)',
    fontSize: '14px',
    boxSizing: 'border-box',
    marginBottom: '12px',
  },
  list: {
    maxHeight: '260px',
    overflowY: 'auto',
    marginBottom: '12px',
    border: '1px solid var(--border)',
    borderRadius: '8px',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 12px',
    borderBottom: '1px solid var(--border)',
    cursor: 'pointer',
    fontSize: '13.5px',
    color: 'var(--text)',
  },
  name: {
    flex: 1,
  },
  role: {
    fontSize: '11px',
    color: 'var(--text-faint)',
    textTransform: 'uppercase',
  },
  empty: {
    padding: '20px 14px',
    fontSize: '13px',
    color: 'var(--text-faint)',
    fontStyle: 'italic',
    textAlign: 'center',
    margin: 0,
  },
  groupNameField: {
    marginBottom: '12px',
  },
  label: {
    display: 'block',
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '6px',
  },
  submitBtn: {
    width: '100%',
    padding: '11px 18px',
    backgroundColor: 'var(--accent)',
    color: 'white',
    border: 'none',
    borderRadius: '9px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 600,
  },
};
