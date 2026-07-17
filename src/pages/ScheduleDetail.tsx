import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api } from '../api';
import { useToast } from '../Toast';
import { CommentsSection } from '../components/CommentsSection';
import type { ScheduleItem } from '../types';

const REMINDER_OPTIONS = [
  { value: 0, label: 'At start time' },
  { value: 15, label: '15 minutes before' },
  { value: 30, label: '30 minutes before' },
  { value: 60, label: '1 hour before' },
  { value: 1440, label: '1 day before' },
];

export function ScheduleDetail() {
  const navigate = useNavigate();
  const showToast = useToast();
  const { itemId } = useParams<{ itemId: string }>();
  const [item, setItem] = useState<ScheduleItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [reminderChoice, setReminderChoice] = useState<string>('none');

  useEffect(() => {
    loadItem();
  }, [itemId]);

  async function loadItem() {
    if (!itemId) return;
    setIsLoading(true);
    try {
      const response = await api.getScheduleItem(itemId);
      const data = response.data.data || null;
      setItem(data);
      setReminderChoice(data?.myReminderOffsetMinutes != null ? String(data.myReminderOffsetMinutes) : 'none');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load schedule item');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubscribeToggle() {
    if (!item || isUpdating) return;
    const nowSubscribed = !item.isSubscribed;
    setIsUpdating(true);
    try {
      await api.subscribeScheduleItem(item.id);
      setItem({ ...item, isSubscribed: nowSubscribed });
      showToast(nowSubscribed ? 'Subscribed to updates' : 'Unsubscribed');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update subscription');
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleReminderChange(value: string) {
    if (!item) return;
    setReminderChoice(value);
    try {
      if (value === 'none') {
        await api.removeScheduleReminder(item.id);
        setItem({ ...item, myReminderOffsetMinutes: null });
        showToast('Reminder removed');
      } else {
        const offset = parseInt(value, 10);
        await api.setScheduleReminder(item.id, offset);
        setItem({ ...item, myReminderOffsetMinutes: offset });
        showToast('Reminder set');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update reminder');
    }
  }

  if (isLoading) return <div style={styles.loading}>Loading...</div>;
  if (error) return <div style={styles.error}>{error}</div>;
  if (!item) return <div style={styles.error}>Schedule item not found</div>;

  const start = new Date(item.startTime);
  const end = item.endTime ? new Date(item.endTime) : null;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={() => navigate('/dashboard')} style={styles.backBtn}>
          ← Back to Dashboard
        </button>
        <h1 style={styles.title}>Schedule Item</h1>
      </div>

      <div style={styles.content}>
        <div style={styles.card}>
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>{item.title}</h2>
            {item.description && <p style={styles.text}>{item.description}</p>}

            <div style={styles.actionRow}>
              <button
                onClick={handleSubscribeToggle}
                style={{ ...styles.subscribeBtn, ...(item.isSubscribed ? styles.subscribeBtnActive : {}) }}
                disabled={isUpdating}
                title="Get notified about comments on this item"
              >
                {item.isSubscribed ? '🔔 Subscribed' : '🔕 Subscribe'}
              </button>

              <div style={styles.reminderControl}>
                <span style={styles.reminderLabel}>⏰ Remind me:</span>
                <select
                  value={reminderChoice}
                  onChange={(e) => handleReminderChange(e.target.value)}
                  style={styles.reminderSelect}
                >
                  <option value="none">No reminder</option>
                  {REMINDER_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div style={styles.section}>
            <h3 style={styles.subtitle}>Details</h3>
            <div style={styles.details}>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Starts:</span>
                <span>{start.toLocaleString()}</span>
              </div>
              {end && (
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>Ends:</span>
                  <span>{end.toLocaleString()}</span>
                </div>
              )}
              {item.location && (
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>Location:</span>
                  <span>{item.location.name}</span>
                </div>
              )}
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Added by:</span>
                <span>
                  <Link to={`/users/${item.createdBy.id}`} style={styles.userLink}>
                    {item.createdBy.name}
                  </Link>
                </span>
              </div>
            </div>
          </div>

          <CommentsSection
            initialComments={item.comments || []}
            onAdd={async (text) => {
              const res = await api.addScheduleComment(item.id, text);
              return res.data.data!;
            }}
            onReact={async (commentId, emoji) => {
              const res = await api.toggleScheduleCommentReaction(item.id, commentId, emoji);
              return res.data.data!.reactions;
            }}
          />

          <div style={styles.actions}>
            <button onClick={() => navigate('/dashboard')} style={styles.secondaryBtn}>
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: 'var(--bg)',
  },
  header: {
    backgroundColor: 'var(--surface)',
    padding: '20px 40px',
    borderBottom: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  backBtn: {
    fontSize: '14px',
    color: '#007bff',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '500',
    padding: 0,
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    margin: 0,
  },
  content: {
    maxWidth: '900px',
    margin: '40px auto',
    padding: '0 20px',
  },
  card: {
    backgroundColor: 'var(--surface)',
    borderRadius: '8px',
    padding: '32px',
    boxShadow: '0 2px 10px var(--shadow)',
  },
  section: {
    marginBottom: '32px',
    paddingBottom: '24px',
    borderBottom: '1px solid var(--border)',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '16px',
    color: 'var(--text)',
    margin: '0 0 16px 0',
  },
  subtitle: {
    fontSize: '16px',
    fontWeight: '600',
    marginBottom: '12px',
    color: 'var(--text)',
    margin: '0 0 12px 0',
  },
  text: {
    fontSize: '15px',
    lineHeight: '1.6',
    color: 'var(--text-muted)',
    margin: '0 0 16px 0',
    whiteSpace: 'pre-wrap' as const,
  },
  actionRow: {
    marginTop: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap' as const,
  },
  subscribeBtn: {
    padding: '8px 12px',
    fontSize: '13px',
    backgroundColor: 'var(--bg)',
    border: '1px solid var(--border-strong)',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: '500' as const,
    color: 'var(--text)',
  },
  subscribeBtnActive: {
    backgroundColor: '#fff3cd',
    borderColor: '#ffc107',
    color: '#856404',
  },
  reminderControl: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  reminderLabel: {
    fontSize: '13px',
    color: 'var(--text-muted)',
  },
  reminderSelect: {
    padding: '8px 10px',
    border: '1px solid var(--border-strong)',
    borderRadius: '4px',
    backgroundColor: 'var(--input-bg)',
    color: 'var(--text)',
    fontSize: '13px',
  },
  details: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  detailRow: {
    display: 'flex',
    gap: '16px',
    fontSize: '14px',
  },
  detailLabel: {
    fontWeight: '600',
    color: 'var(--text)',
    minWidth: '100px',
  },
  userLink: {
    color: '#007bff',
    textDecoration: 'none',
    fontWeight: '500' as const,
  },
  actions: {
    display: 'flex',
    gap: '12px',
    marginTop: '24px',
  },
  secondaryBtn: {
    padding: '10px 20px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    flex: 1,
  },
  loading: {
    padding: '20px',
    fontSize: '16px',
    color: 'var(--text-muted)',
  },
  error: {
    padding: '20px',
    fontSize: '16px',
    color: 'var(--danger-text)',
    backgroundColor: 'var(--danger-bg)',
  },
};
