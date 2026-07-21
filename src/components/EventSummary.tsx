import { useEffect, useState } from 'react';
import { api } from '../api';

interface Summary {
  headline: string;
  actions: { action: string; priority: 'HIGH' | 'MEDIUM' | 'LOW' }[];
  generatedAt: string;
}

type Priority = Summary['actions'][number]['priority'];

/** Medium sits on a light amber, so it takes a dark label rather than white. */
const PRIORITY_CHIP: Record<Priority, React.CSSProperties> = {
  HIGH: { backgroundColor: 'var(--danger)', color: 'white' },
  MEDIUM: { backgroundColor: 'var(--warning)', color: 'var(--warning-text-on)' },
  LOW: { backgroundColor: 'var(--success)', color: 'white' },
};

const SparkleIcon = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="var(--purple)" style={{ flexShrink: 0 }}>
    <path d="M12 2l1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8L12 2z" />
  </svg>
);

/**
 * AI-generated "state of the event" brief: a one-line headline plus
 * suggested actions, derived from the current tickets and reports.
 * One shared summary for everyone (cached server-side). Hidden when
 * the backend has no AI configured or the summary fails.
 */
export function EventSummary() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api
      .getEventSummary()
      .then((res) => setSummary(res.data.data || null))
      .catch(() => setSummary(null)) // hide the card on failure
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div style={styles.card}>
        <div style={styles.rail} />
        <div style={styles.header}>
          <span style={styles.title}>{SparkleIcon} Event Brief</span>
        </div>
        <p style={styles.loading}>Reading the room…</p>
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div style={styles.card}>
      <div style={styles.rail} />
      <div style={styles.header}>
        <span style={styles.title}>{SparkleIcon} Event Brief</span>
        <span style={styles.timestamp}>Updated {timeAgo(summary.generatedAt)}</span>
      </div>

      <p style={styles.headline}>{summary.headline}</p>

      {summary.actions.length > 0 && (
        <ul style={styles.actionList}>
          {summary.actions.map((a, i) => (
            <li key={i} style={styles.actionItem}>
              <span style={{ ...styles.priorityChip, ...PRIORITY_CHIP[a.priority] }}>
                {a.priority}
              </span>
              <span style={styles.actionText}>{a.action}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function timeAgo(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  return `${hours}h ago`;
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    padding: '18px 22px',
    marginBottom: '22px',
    boxShadow: '0 1px 2px oklch(0% 0 0 / 0.03), 0 8px 22px oklch(0% 0 0 / 0.045)',
  },
  // Purple spine marking the brief as machine-written rather than user content.
  rail: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '3px',
    backgroundColor: 'var(--purple)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: '10px',
    marginBottom: '9px',
    flexWrap: 'wrap',
  },
  title: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    fontWeight: 700,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  timestamp: {
    fontSize: '12px',
    color: 'var(--text-faint)',
  },
  loading: {
    fontSize: '14px',
    color: 'var(--text-faint)',
    fontStyle: 'italic',
    margin: 0,
  },
  headline: {
    fontSize: '15px',
    fontWeight: 600,
    color: 'var(--text)',
    margin: '0 0 12px',
    lineHeight: 1.45,
  },
  actionList: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '9px',
  },
  actionItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
  },
  priorityChip: {
    flexShrink: 0,
    padding: '2px 9px',
    borderRadius: '999px',
    fontSize: '10px',
    fontWeight: 700,
    lineHeight: '16px',
    marginTop: '2px',
  },
  actionText: {
    fontSize: '13.5px',
    color: 'var(--text)',
    lineHeight: 1.5,
  },
};
