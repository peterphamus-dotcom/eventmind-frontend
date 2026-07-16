import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import type { UserReport, UserReportStatus } from '../../types';

const REASON_LABELS: Record<string, string> = {
  HARASSMENT: 'Harassment',
  INAPPROPRIATE_CONTENT: 'Inappropriate content',
  SAFETY_CONCERN: 'Safety concern',
  SPAM: 'Spam',
  OTHER: 'Other',
};

function relativeTime(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export default function AdminUserReports() {
  const [reports, setReports] = useState<UserReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<UserReportStatus | ''>('OPEN');

  useEffect(() => {
    loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  async function loadReports() {
    setIsLoading(true);
    setError(null);
    try {
      const filters = statusFilter ? { status: statusFilter } : {};
      const response = await api.listUserReports(filters);
      setReports(response.data.data?.items || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load reports');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleUpdateStatus(id: string, status: UserReportStatus) {
    try {
      const response = await api.updateUserReportStatus(id, status);
      const updated = response.data.data;
      if (!updated) return;
      // If the current filter no longer matches, drop it from view; otherwise patch in place.
      if (statusFilter && updated.status !== statusFilter) {
        setReports((prev) => prev.filter((r) => r.id !== id));
      } else {
        setReports((prev) => prev.map((r) => (r.id === id ? updated : r)));
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update report');
    }
  }

  return (
    <div style={styles.card}>
      <h2 style={styles.title}>User Reports</h2>

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.filterRow}>
        <label style={styles.label}>Filter by status:</label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as UserReportStatus | '')}
          style={styles.select}
        >
          <option value="OPEN">Open</option>
          <option value="RESOLVED">Resolved</option>
          <option value="DISMISSED">Dismissed</option>
          <option value="">All</option>
        </select>
      </div>

      {isLoading ? (
        <p>Loading reports...</p>
      ) : reports.length === 0 ? (
        <p style={styles.empty}>No reports found</p>
      ) : (
        <div style={styles.list}>
          {reports.map((r) => (
            <div key={r.id} style={styles.reportCard}>
              <div style={styles.reportHeader}>
                <span style={styles.reasonBadge}>{REASON_LABELS[r.reason] || r.reason}</span>
                <span
                  style={{
                    ...styles.statusBadge,
                    backgroundColor:
                      r.status === 'OPEN' ? '#dc3545' : r.status === 'RESOLVED' ? '#28a745' : '#6c757d',
                  }}
                >
                  {r.status}
                </span>
                <span style={styles.date} title={new Date(r.createdAt).toLocaleString()}>
                  {relativeTime(r.createdAt)}
                </span>
              </div>

              <div style={styles.reportBody}>
                <Link to={`/users/${r.reportedUser.id}`} style={styles.userLink}>
                  {r.reportedUser.name}
                </Link>{' '}
                reported by{' '}
                <Link to={`/users/${r.reporter.id}`} style={styles.userLink}>
                  {r.reporter.name}
                </Link>
              </div>

              {r.details && <p style={styles.details}>{r.details}</p>}

              {r.resolvedBy && (
                <p style={styles.resolvedNote}>
                  {r.status === 'RESOLVED' ? 'Resolved' : 'Dismissed'} by {r.resolvedBy.name}
                  {r.resolvedAt ? ` · ${relativeTime(r.resolvedAt)}` : ''}
                </p>
              )}

              <div style={styles.actions}>
                {r.status !== 'RESOLVED' && (
                  <button onClick={() => handleUpdateStatus(r.id, 'RESOLVED')} style={styles.btnResolve}>
                    Mark Resolved
                  </button>
                )}
                {r.status !== 'DISMISSED' && (
                  <button onClick={() => handleUpdateStatus(r.id, 'DISMISSED')} style={styles.btnDismiss}>
                    Dismiss
                  </button>
                )}
                {r.status !== 'OPEN' && (
                  <button onClick={() => handleUpdateStatus(r.id, 'OPEN')} style={styles.btnReopen}>
                    Reopen
                  </button>
                )}
              </div>
            </div>
          ))}
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
    fontWeight: '600' as const,
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
    fontWeight: '600' as const,
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
  list: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '14px',
  },
  reportCard: {
    padding: '16px',
    backgroundColor: 'var(--bg)',
    borderRadius: '6px',
  },
  reportHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
    flexWrap: 'wrap' as const,
  },
  reasonBadge: {
    display: 'inline-block',
    padding: '3px 8px',
    backgroundColor: 'var(--tag-bg)',
    color: 'var(--tag-text)',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '600' as const,
  },
  statusBadge: {
    display: 'inline-block',
    padding: '3px 8px',
    color: 'white',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '600' as const,
  },
  date: {
    fontSize: '12px',
    color: 'var(--text-faint)',
    marginLeft: 'auto',
  },
  reportBody: {
    fontSize: '14px',
    color: 'var(--text)',
    marginBottom: '8px',
  },
  userLink: {
    color: '#007bff',
    textDecoration: 'none',
    fontWeight: '600' as const,
  },
  details: {
    fontSize: '13px',
    color: 'var(--text-muted)',
    margin: '0 0 10px 0',
    whiteSpace: 'pre-wrap' as const,
  },
  resolvedNote: {
    fontSize: '12px',
    color: 'var(--text-faint)',
    fontStyle: 'italic' as const,
    margin: '0 0 10px 0',
  },
  actions: {
    display: 'flex',
    gap: '8px',
  },
  btnResolve: {
    padding: '6px 12px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500' as const,
  },
  btnDismiss: {
    padding: '6px 12px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500' as const,
  },
  btnReopen: {
    padding: '6px 12px',
    backgroundColor: 'transparent',
    border: '1px solid var(--border-strong)',
    color: 'var(--text)',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500' as const,
  },
  empty: {
    fontSize: '14px',
    color: 'var(--text-faint)',
    fontStyle: 'italic' as const,
  },
};
