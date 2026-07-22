import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api } from '../api';
import { useToast } from '../Toast';
import { CommentsSection } from '../components/CommentsSection';
import { DetailPage, DetailSection, DetailRow, BellIcon, styles } from '../components/DetailPage';
import type { ScheduleItem } from '../types';

const REMINDER_OPTIONS = [
  { value: 0, label: 'At start time' },
  { value: 15, label: '15 minutes before' },
  { value: 30, label: '30 minutes before' },
  { value: 60, label: '1 hour before' },
  { value: 1440, label: '1 day before' },
];

const ClockIcon = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

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

  if (isLoading) return <div style={styles.loading}>Loading…</div>;
  if (error) return <div style={styles.error}>{error}</div>;
  if (!item) return <div style={styles.error}>Schedule item not found</div>;

  const start = new Date(item.startTime);
  const end = item.endTime ? new Date(item.endTime) : null;

  return (
    <DetailPage title="Schedule Item">
      <DetailSection>
        <h2 style={localStyles.itemTitle}>{item.title}</h2>
        {item.description && <p style={styles.bodyText}>{item.description}</p>}

        <div style={localStyles.actionRow}>
          <button
            onClick={handleSubscribeToggle}
            style={{ ...styles.subscribeBtn, ...(item.isSubscribed ? styles.subscribeBtnActive : {}) }}
            disabled={isUpdating}
            title="Get notified about comments on this item"
          >
            {BellIcon}
            {item.isSubscribed ? 'Subscribed' : 'Subscribe'}
          </button>

          <div style={localStyles.reminderControl}>
            <span style={localStyles.reminderLabel}>
              {ClockIcon}
              Remind me:
            </span>
            <select
              value={reminderChoice}
              onChange={(e) => handleReminderChange(e.target.value)}
              style={localStyles.reminderSelect}
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
      </DetailSection>

      <DetailSection title="Details">
        <div style={styles.details}>
          <DetailRow label="Starts">{start.toLocaleString()}</DetailRow>
          {end && <DetailRow label="Ends">{end.toLocaleString()}</DetailRow>}
          {item.location && <DetailRow label="Location">{item.location.name}</DetailRow>}
          <DetailRow label="Added by">
            <Link to={`/users/${item.createdBy.id}`} style={styles.userLink}>
              {item.createdBy.name}
            </Link>
          </DetailRow>
        </div>
      </DetailSection>

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
    </DetailPage>
  );
}

const localStyles: Record<string, React.CSSProperties> = {
  itemTitle: {
    fontSize: '19px',
    fontWeight: 700,
    margin: '0 0 10px',
    color: 'var(--text)',
  },
  actionRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  reminderControl: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  reminderLabel: {
    fontSize: '12.5px',
    color: 'var(--text-muted)',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
  },
  reminderSelect: {
    padding: '7px 10px',
    border: '1px solid var(--border-strong)',
    borderRadius: '7px',
    backgroundColor: 'var(--surface)',
    color: 'var(--text)',
    fontSize: '12.5px',
  },
};
