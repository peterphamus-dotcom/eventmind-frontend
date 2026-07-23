import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useToast } from '../Toast';
import { Modal } from './Modal';
import { CommentsSection } from './CommentsSection';
import { DetailRow, BellIcon, styles as detailStyles } from './DetailPage';
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

interface ScheduleItemModalProps {
  itemId: string;
  onClose: () => void;
}

/** Click-to-preview: the same content as the schedule item detail page, in a modal. */
export function ScheduleItemModal({ itemId, onClose }: ScheduleItemModalProps) {
  const showToast = useToast();
  const [item, setItem] = useState<ScheduleItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [reminderChoice, setReminderChoice] = useState<string>('none');

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    api
      .getScheduleItem(itemId)
      .then((response) => {
        if (cancelled) return;
        const data = response.data.data || null;
        setItem(data);
        setReminderChoice(data?.myReminderOffsetMinutes != null ? String(data.myReminderOffsetMinutes) : 'none');
      })
      .catch((err: any) => {
        if (!cancelled) setError(err.response?.data?.error || 'Failed to load schedule item');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [itemId]);

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

  const start = item ? new Date(item.startTime) : null;
  const end = item?.endTime ? new Date(item.endTime) : null;

  return (
    <Modal title={item?.title || 'Schedule Item'} onClose={onClose}>
      {isLoading && <p style={detailStyles.loading}>Loading…</p>}
      {error && <div style={detailStyles.error}>{error}</div>}

      {item && (
        <>
          {item.description && <p style={detailStyles.bodyText}>{item.description}</p>}

          <div style={localStyles.actionRow}>
            <button
              onClick={handleSubscribeToggle}
              style={{ ...detailStyles.subscribeBtn, ...(item.isSubscribed ? detailStyles.subscribeBtnActive : {}) }}
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

          <div style={localStyles.details}>
            {start && <DetailRow label="Starts">{start.toLocaleString()}</DetailRow>}
            {end && <DetailRow label="Ends">{end.toLocaleString()}</DetailRow>}
            {item.location && <DetailRow label="Location">{item.location.name}</DetailRow>}
            <DetailRow label="Added by">
              <Link to={`/users/${item.createdBy.id}`} style={detailStyles.userLink}>
                {item.createdBy.name}
              </Link>
            </DetailRow>
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
        </>
      )}
    </Modal>
  );
}

const localStyles: Record<string, React.CSSProperties> = {
  actionRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
    marginBottom: '18px',
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
  details: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    fontSize: '13.5px',
    marginBottom: '20px',
    paddingBottom: '20px',
    borderBottom: '1px solid var(--border)',
  },
};
