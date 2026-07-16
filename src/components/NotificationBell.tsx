import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import type { Notification, NotificationSettings } from '../types';

const POLL_INTERVAL_MS = 30000;

const SETTINGS_META: { key: keyof NotificationSettings; label: string }[] = [
  { key: 'notifyOnComment', label: 'New comments' },
  { key: 'notifyOnStatusChange', label: 'Status changes' },
  { key: 'notifyOnUrgencyChange', label: 'Urgency changes' },
  { key: 'notifyOnReaction', label: 'Reactions to my comments' },
];

function relativeTime(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

/** Header bell icon: unread badge, dropdown feed, and per-trigger settings. */
export function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings | null>(null);

  useEffect(() => {
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  async function loadUnreadCount() {
    try {
      const res = await api.getUnreadNotificationCount();
      setUnreadCount(res.data.data?.count || 0);
    } catch {
      // Non-critical background poll; ignore failures
    }
  }

  async function loadNotifications() {
    setIsLoading(true);
    try {
      const res = await api.listNotifications(1, 20);
      setNotifications(res.data.data?.items || []);
    } catch {
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  }

  function toggleOpen() {
    const next = !open;
    setOpen(next);
    setSettingsOpen(false);
    if (next) loadNotifications();
  }

  async function handleItemClick(n: Notification) {
    setOpen(false);
    if (!n.read) {
      setUnreadCount((c) => Math.max(0, c - 1));
      try {
        await api.markNotificationRead(n.id);
      } catch {
        // best-effort
      }
    }
    if (n.ticketId) navigate(`/tickets/${n.ticketId}`);
    else if (n.reportId) navigate(`/reports/${n.reportId}`);
  }

  async function handleMarkAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    try {
      await api.markAllNotificationsRead();
    } catch {
      // best-effort
    }
  }

  async function openSettings() {
    setSettingsOpen(true);
    if (!settings) {
      try {
        const res = await api.getNotificationSettings();
        setSettings(res.data.data || null);
      } catch {
        setSettings(null);
      }
    }
  }

  async function toggleSetting(key: keyof NotificationSettings) {
    if (!settings) return;
    const previous = settings;
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    try {
      await api.updateNotificationSettings({ [key]: updated[key] });
    } catch {
      setSettings(previous);
    }
  }

  return (
    <div style={styles.anchor}>
      <button onClick={toggleOpen} style={styles.bellBtn} aria-label="Notifications">
        🔔
        {unreadCount > 0 && (
          <span style={styles.badge}>{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>
      {open && (
        <>
          <div style={styles.backdrop} onClick={() => setOpen(false)} />
          <div style={styles.popover}>
            <div style={styles.popoverHeader}>
              <span style={styles.popoverTitle}>Notifications</span>
              <div style={styles.headerActions}>
                {!settingsOpen && (
                  <button onClick={handleMarkAllRead} style={styles.linkBtn}>
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => (settingsOpen ? setSettingsOpen(false) : openSettings())}
                  style={styles.iconBtn}
                  aria-label="Notification settings"
                  title="Notification settings"
                >
                  {settingsOpen ? '✕' : '⚙️'}
                </button>
              </div>
            </div>

            {settingsOpen ? (
              <div style={styles.settingsPanel}>
                {settings ? (
                  SETTINGS_META.map(({ key, label }) => (
                    <label key={key} style={styles.settingRow}>
                      <input
                        type="checkbox"
                        checked={settings[key]}
                        onChange={() => toggleSetting(key)}
                      />
                      {label}
                    </label>
                  ))
                ) : (
                  <p style={styles.empty}>Loading settings…</p>
                )}
              </div>
            ) : isLoading ? (
              <p style={styles.empty}>Loading…</p>
            ) : notifications.length === 0 ? (
              <p style={styles.empty}>No notifications yet.</p>
            ) : (
              <div style={styles.list}>
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => handleItemClick(n)}
                    style={{ ...styles.item, ...(n.read ? {} : styles.itemUnread) }}
                  >
                    <p style={styles.itemMessage}>{n.message}</p>
                    <span style={styles.itemTime}>{relativeTime(n.createdAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

const styles = {
  anchor: {
    position: 'relative' as const,
  },
  bellBtn: {
    position: 'relative' as const,
    padding: '8px 12px',
    backgroundColor: 'transparent',
    border: '1px solid var(--border-strong)',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
    color: 'var(--text)',
    lineHeight: 1,
  },
  badge: {
    position: 'absolute' as const,
    top: '-6px',
    right: '-6px',
    backgroundColor: '#dc3545',
    color: 'white',
    fontSize: '10px',
    fontWeight: '700' as const,
    borderRadius: '999px',
    padding: '2px 5px',
    minWidth: '16px',
    textAlign: 'center' as const,
    lineHeight: 1.2,
  },
  backdrop: {
    position: 'fixed' as const,
    inset: 0,
    zIndex: 10,
  },
  popover: {
    position: 'absolute' as const,
    top: 'calc(100% + 4px)',
    right: 0,
    zIndex: 11,
    backgroundColor: 'var(--surface)',
    border: '1px solid var(--border-strong)',
    borderRadius: '6px',
    boxShadow: '0 4px 16px var(--shadow)',
    width: '320px',
    maxWidth: '90vw',
  },
  popoverHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 14px',
    borderBottom: '1px solid var(--border)',
  },
  popoverTitle: {
    fontSize: '14px',
    fontWeight: '700' as const,
    color: 'var(--text)',
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  linkBtn: {
    background: 'none',
    border: 'none',
    color: '#007bff',
    fontSize: '12px',
    cursor: 'pointer',
    padding: 0,
  },
  iconBtn: {
    background: 'none',
    border: 'none',
    fontSize: '13px',
    cursor: 'pointer',
    padding: 0,
    color: 'var(--text-muted)',
  },
  list: {
    maxHeight: '360px',
    overflowY: 'auto' as const,
  },
  item: {
    padding: '10px 14px',
    borderBottom: '1px solid var(--border)',
    cursor: 'pointer',
  },
  itemUnread: {
    backgroundColor: 'var(--tag-bg)',
  },
  itemMessage: {
    fontSize: '13px',
    color: 'var(--text)',
    margin: '0 0 4px 0',
  },
  itemTime: {
    fontSize: '11px',
    color: 'var(--text-faint)',
  },
  empty: {
    padding: '20px 14px',
    fontSize: '13px',
    color: 'var(--text-faint)',
    fontStyle: 'italic' as const,
    textAlign: 'center' as const,
    margin: 0,
  },
  settingsPanel: {
    padding: '12px 14px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
  },
  settingRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    color: 'var(--text)',
    cursor: 'pointer',
  },
};
