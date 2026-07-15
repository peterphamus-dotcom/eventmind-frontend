import { useEffect, useState } from 'react';
import { api } from '../api';

interface Summary {
  headline: string;
  actions: { action: string; priority: 'HIGH' | 'MEDIUM' | 'LOW' }[];
  generatedAt: string;
}

const PRIORITY_COLORS: Record<Summary['actions'][number]['priority'], string> = {
  HIGH: '#dc3545',
  MEDIUM: '#ffc107',
  LOW: '#28a745',
};

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
        <div style={styles.header}>
          <span style={styles.title}>✨ Event Brief</span>
        </div>
        <p style={styles.loading}>Reading the room…</p>
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <span style={styles.title}>✨ Event Brief</span>
        <span style={styles.timestamp}>
          Updated {timeAgo(summary.generatedAt)}
        </span>
      </div>

      <p style={styles.headline}>{summary.headline}</p>

      {summary.actions.length > 0 && (
        <ul style={styles.actionList}>
          {summary.actions.map((a, i) => (
            <li key={i} style={styles.actionItem}>
              <span
                style={{
                  ...styles.priorityChip,
                  backgroundColor: PRIORITY_COLORS[a.priority],
                }}
              >
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
    backgroundColor: 'var(--surface)',
    border: '1px solid var(--border)',
    borderLeft: '4px solid #7c5cff',
    borderRadius: '8px',
    padding: '16px 20px',
    marginBottom: '24px',
    boxShadow: '0 2px 10px var(--shadow)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: '10px',
    marginBottom: '8px',
    flexWrap: 'wrap',
  },
  title: {
    fontSize: '13px',
    fontWeight: 700,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
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
    margin: '0 0 10px',
    lineHeight: 1.4,
  },
  actionList: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  actionItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
  },
  priorityChip: {
    flexShrink: 0,
    padding: '2px 8px',
    borderRadius: '10px',
    color: 'white',
    fontSize: '10px',
    fontWeight: 700,
    lineHeight: '16px',
    marginTop: '2px',
  },
  actionText: {
    fontSize: '14px',
    color: 'var(--text)',
    lineHeight: 1.45,
  },
};
