import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useSocketEvent } from '../useSocket';

const POLL_INTERVAL_MS = 30000;

/** Header icon button linking to /messages, with a live unread-conversation badge. */
export function MessagesButton() {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  async function loadUnreadCount() {
    try {
      const res = await api.getUnreadMessageCount();
      setUnreadCount(res.data.data?.count || 0);
    } catch {
      // Non-critical background poll; ignore failures
    }
  }

  useEffect(() => {
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  // Sockets give an instant nudge; the poll above is the fallback if a
  // socket event is missed (e.g. briefly disconnected).
  useSocketEvent('conversation:updated', loadUnreadCount);
  useSocketEvent('message:new', loadUnreadCount);

  return (
    <button onClick={() => navigate('/messages')} style={styles.btn} aria-label="Messages">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 6 9-6" />
      </svg>
      {unreadCount > 0 && <span style={styles.badge}>{unreadCount > 99 ? '99+' : unreadCount}</span>}
    </button>
  );
}

const styles = {
  btn: {
    position: 'relative' as const,
    padding: '8px 10px',
    backgroundColor: 'transparent',
    border: '1px solid var(--border-strong)',
    borderRadius: '8px',
    cursor: 'pointer',
    color: 'var(--text)',
    display: 'flex',
    alignItems: 'center',
    lineHeight: 1,
  },
  badge: {
    position: 'absolute' as const,
    top: '-5px',
    right: '-5px',
    backgroundColor: 'var(--danger)',
    color: 'white',
    fontSize: '10px',
    fontWeight: '700' as const,
    borderRadius: '999px',
    padding: '1px 5px',
    minWidth: '15px',
    textAlign: 'center' as const,
    lineHeight: 1.3,
  },
};
