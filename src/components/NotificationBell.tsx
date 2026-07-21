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
  { key: 'notifyOnReminderOverdue', label: 'Overdue report reminders' },
  { key: 'notifyOnScheduleReminder', label: 'Schedule reminders' },
];

function relativeTime(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const PUSH_SUPPORTED = 'serviceWorker' in navigator && 'PushManager' in window;

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
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
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);

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
    else if (n.scheduleItemId) navigate(`/schedule/${n.scheduleItemId}`);
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
    if (PUSH_SUPPORTED) {
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        setPushSubscribed(!!sub);
      } catch {
        setPushSubscribed(false);
      }
    }
  }

  async function togglePush() {
    if (!PUSH_SUPPORTED || pushLoading) return;
    setPushLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;

      if (pushSubscribed) {
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await api.unsubscribePush(sub.endpoint);
          await sub.unsubscribe();
        }
        setPushSubscribed(false);
      } else {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;

        const keyRes = await api.getVapidPublicKey();
        const publicKey = keyRes.data.data?.publicKey;
        if (!publicKey) return;

        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
        await api.subscribePush(sub.toJSON() as PushSubscriptionJSON);
        setPushSubscribed(true);
      }
    } catch (err) {
      console.error('Failed to toggle push notifications:', err);
    } finally {
      setPushLoading(false);
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
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
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
                  {settingsOpen ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  ) : (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                  )}
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

                <div style={styles.settingsDivider} />

                {PUSH_SUPPORTED ? (
                  <label style={styles.settingRow}>
                    <input
                      type="checkbox"
                      checked={pushSubscribed}
                      disabled={pushLoading}
                      onChange={togglePush}
                    />
                    Push notifications on this device
                  </label>
                ) : (
                  <p style={styles.pushUnsupported}>
                    Push notifications aren't supported in this browser.
                  </p>
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
  backdrop: {
    position: 'fixed' as const,
    inset: 0,
    zIndex: 10,
  },
  popover: {
    position: 'absolute' as const,
    top: 'calc(100% + 6px)',
    right: 0,
    zIndex: 11,
    backgroundColor: 'var(--surface)',
    border: '1px solid var(--border-strong)',
    borderRadius: '10px',
    boxShadow: '0 4px 20px oklch(0% 0 0 / 0.1)',
    width: '320px',
    maxWidth: '90vw',
  },
  popoverHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    borderBottom: '1px solid var(--border)',
  },
  popoverTitle: {
    fontSize: '13.5px',
    fontWeight: '700' as const,
    color: 'var(--text)',
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  linkBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--accent)',
    fontSize: '12px',
    fontWeight: '600' as const,
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
    padding: '12px 16px',
    borderBottom: '1px solid var(--border)',
    cursor: 'pointer',
  },
  itemUnread: {
    backgroundColor: 'var(--accent-soft-translucent)',
  },
  itemMessage: {
    fontSize: '13px',
    color: 'var(--text)',
    margin: '0 0 3px 0',
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
    padding: '14px 16px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '11px',
  },
  settingRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '9px',
    fontSize: '13px',
    color: 'var(--text)',
    cursor: 'pointer',
  },
  settingsDivider: {
    borderTop: '1px solid var(--border)',
    margin: '2px 0',
  },
  pushUnsupported: {
    fontSize: '12px',
    color: 'var(--text-faint)',
    fontStyle: 'italic' as const,
    margin: 0,
  },
};
