import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import { styles as shared } from '../../components/AdminShared';
import type { ContentReport, UserReportStatus } from '../../types';

const STATUS_TINT: Record<string, React.CSSProperties> = {
  OPEN: { backgroundColor: 'var(--danger)', color: 'white' },
  RESOLVED: { backgroundColor: 'var(--success)', color: 'white' },
  DISMISSED: { backgroundColor: 'var(--neutral)', color: 'white' },
};

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

export default function AdminContentReports() {
  const [reports, setReports] = useState<ContentReport[]>([]);
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
      const response = await api.listContentReports(filters);
      setReports(response.data.data?.items || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load reports');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleUpdateStatus(id: string, status: UserReportStatus) {
    try {
      const response = await api.updateContentReportStatus(id, status);
      const updated = response.data.data;
      if (!updated) return;
      if (statusFilter && updated.status !== statusFilter) {
        setReports((prev) => prev.filter((r) => r.id !== id));
      } else {
        setReports((prev) => prev.map((r) => (r.id === id ? updated : r)));
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update report');
    }
  }

  async function handleToggleHide(r: ContentReport) {
    if (!r.postId || !r.commentId) return;
    try {
      const res = await api.toggleCommunityCommentHide(r.postId, r.commentId);
      const isHidden = res.data.data?.isHidden ?? !r.commentIsHidden;
      setReports((prev) => prev.map((x) => (x.id === r.id ? { ...x, commentIsHidden: isHidden } : x)));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to hide comment');
    }
  }

  return (
    <div style={styles.card}>
      <h2 style={styles.title}>Content Reports</h2>
      <p style={styles.subtitle}>Reported community posts and comments. Hidden comments stay visible to their author but no one else.</p>

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.filterRow}>
        <label style={styles.label}>Filter by status:</label>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as UserReportStatus | '')} style={styles.select}>
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
                <span style={styles.targetBadge}>{r.target === 'COMMENT' ? '💬 Comment' : '📄 Post'}</span>
                <span style={styles.reasonBadge}>{REASON_LABELS[r.reason] || r.reason}</span>
                <span style={{ ...styles.statusBadge, ...STATUS_TINT[r.status] }}>{r.status}</span>
                <span style={styles.date} title={new Date(r.createdAt).toLocaleString()}>{relativeTime(r.createdAt)}</span>
              </div>

              <div style={styles.reportBody}>
                Reported by{' '}
                <Link to={`/users/${r.reporter.id}`} style={styles.userLink}>{r.reporter.name}</Link>
                {r.postTitle && <> · on post “{r.postTitle}”</>}
              </div>

              {r.target === 'COMMENT' && r.commentText != null && (
                <blockquote style={styles.quote}>
                  {r.commentIsHidden && <span style={styles.hiddenTag}>🚫 Hidden</span>}
                  <span style={styles.quoteAuthor}>{r.commentAuthor}:</span> {r.commentText}
                </blockquote>
              )}
              {r.target === 'POST' && r.postTitle == null && (
                <p style={styles.gone}>This post has been deleted.</p>
              )}

              {r.details && <p style={styles.details}>“{r.details}”</p>}

              {r.resolvedBy && (
                <p style={styles.resolvedNote}>
                  {r.status === 'RESOLVED' ? 'Resolved' : 'Dismissed'} by {r.resolvedBy.name}
                  {r.resolvedAt ? ` · ${relativeTime(r.resolvedAt)}` : ''}
                </p>
              )}

              <div style={styles.actions}>
                {r.target === 'COMMENT' && r.commentId && r.postId && (
                  <button onClick={() => handleToggleHide(r)} style={styles.btnHide}>
                    {r.commentIsHidden ? 'Unhide comment' : 'Hide comment'}
                  </button>
                )}
                {r.status !== 'RESOLVED' && (
                  <button onClick={() => handleUpdateStatus(r.id, 'RESOLVED')} style={styles.btnResolve}>Mark Resolved</button>
                )}
                {r.status !== 'DISMISSED' && (
                  <button onClick={() => handleUpdateStatus(r.id, 'DISMISSED')} style={styles.btnDismiss}>Dismiss</button>
                )}
                {r.status !== 'OPEN' && (
                  <button onClick={() => handleUpdateStatus(r.id, 'OPEN')} style={styles.btnReopen}>Reopen</button>
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
  card: shared.card,
  title: shared.title,
  subtitle: { fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 16px' },
  error: { padding: '11px 14px', backgroundColor: 'var(--danger-soft)', color: 'var(--danger-text)', borderRadius: '9px', fontSize: '14px', marginBottom: '16px' },
  filterRow: shared.filterRow,
  label: shared.filterLabel,
  select: shared.selectSmall,
  list: { display: 'flex', flexDirection: 'column' as const, gap: '12px' },
  reportCard: { padding: '15px 17px', backgroundColor: 'var(--bg)', borderRadius: '9px', border: '1px solid var(--border)' },
  reportHeader: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' as const },
  targetBadge: { display: 'inline-block', padding: '3px 9px', backgroundColor: 'var(--surface)', color: 'var(--text-muted)', border: '1px solid var(--border-strong)', borderRadius: '6px', fontSize: '11.5px', fontWeight: '600' as const },
  reasonBadge: { display: 'inline-block', padding: '3px 9px', backgroundColor: 'var(--accent-soft)', color: 'var(--accent-text)', borderRadius: '6px', fontSize: '11.5px', fontWeight: '600' as const },
  statusBadge: { display: 'inline-block', padding: '3px 8px', color: 'white', borderRadius: '4px', fontSize: '12px', fontWeight: '600' as const },
  date: { fontSize: '11.5px', color: 'var(--text-faint)', marginLeft: 'auto' },
  reportBody: { fontSize: '13.5px', color: 'var(--text)', marginBottom: '8px' },
  userLink: { color: 'var(--accent)', textDecoration: 'none', fontWeight: '600' as const },
  quote: { margin: '0 0 10px', padding: '8px 12px', borderLeft: '3px solid var(--border-strong)', backgroundColor: 'var(--surface)', borderRadius: '4px', fontSize: '13px', color: 'var(--text)' },
  quoteAuthor: { fontWeight: '700' as const },
  hiddenTag: { display: 'inline-block', marginRight: '8px', fontSize: '10.5px', fontWeight: '700' as const, color: 'var(--danger-text)', backgroundColor: 'var(--danger-soft)', padding: '1px 7px', borderRadius: '10px' },
  gone: { fontSize: '12.5px', color: 'var(--text-faint)', fontStyle: 'italic' as const, margin: '0 0 10px' },
  details: { fontSize: '12.5px', color: 'var(--text-muted)', margin: '0 0 10px', whiteSpace: 'pre-wrap' as const },
  resolvedNote: { fontSize: '11.5px', color: 'var(--text-faint)', fontStyle: 'italic' as const, margin: '0 0 10px' },
  actions: { display: 'flex', gap: '8px', flexWrap: 'wrap' as const },
  btnHide: { padding: '6px 12px', backgroundColor: 'transparent', border: '1px solid var(--danger-text)', color: 'var(--danger-text)', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' as const },
  btnResolve: shared.btnSuccess,
  btnDismiss: shared.btnNeutral,
  btnReopen: { padding: '6px 12px', backgroundColor: 'transparent', border: '1px solid var(--border-strong)', color: 'var(--text)', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' as const },
  empty: shared.empty,
};
