import { useState } from 'react';
import { api } from '../../api';
import { useToast } from '../../Toast';
import { styles as shared } from '../../components/AdminShared';

type Which = 'tickets' | 'reports';

const TicketIcon = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4z" />
  </svg>
);

const ReportIcon = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="6" y="4" width="12" height="16" rx="2" />
    <line x1="9" y1="10" x2="15" y2="10" />
    <line x1="9" y1="14" x2="15" y2="14" />
  </svg>
);

/** Admin data export: pull every ticket / report as a CSV download. */
export default function AdminExport() {
  const showToast = useToast();
  const [busy, setBusy] = useState<Which | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function download(which: Which) {
    setBusy(which);
    setError(null);
    try {
      const res =
        which === 'tickets' ? await api.exportTicketsCsv() : await api.exportReportsCsv();
      const date = new Date().toISOString().slice(0, 10);
      triggerDownload(res.data as Blob, `${which}-${date}.csv`);
      showToast(`${which === 'tickets' ? 'Tickets' : 'Reports'} exported ✓`);
    } catch (err: any) {
      setError(`Failed to export ${which}. Please try again.`);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div style={styles.card}>
      <h2 style={styles.title}>Export Data</h2>
      <p style={styles.subtitle}>
        Download every ticket or report in the system as a CSV file — opens in
        Excel, Google Sheets, or Numbers. Includes all items regardless of team
        visibility.
      </p>

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.grid}>
        <div style={styles.tile}>
          {TicketIcon}
          <div style={styles.tileBody}>
            <h3 style={styles.tileTitle}>All Tickets</h3>
            <p style={styles.tileText}>
              Title, description, status, urgency, location, submitter, tags,
              photo &amp; comment counts, timestamps.
            </p>
          </div>
          <button
            onClick={() => download('tickets')}
            style={styles.btn}
            disabled={busy !== null}
          >
            {busy === 'tickets' ? 'Preparing…' : 'Download CSV'}
          </button>
        </div>

        <div style={styles.tile}>
          {ReportIcon}
          <div style={styles.tileBody}>
            <h3 style={styles.tileTitle}>All Reports</h3>
            <p style={styles.tileText}>
              Report text, location, submitter, tags, photo &amp; comment
              counts, submitted timestamp.
            </p>
          </div>
          <button
            onClick={() => download('reports')}
            style={styles.btn}
            disabled={busy !== null}
          >
            {busy === 'reports' ? 'Preparing…' : 'Download CSV'}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Save a Blob to disk by clicking a transient object-URL anchor. */
function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const styles: Record<string, React.CSSProperties> = {
  card: shared.card,
  title: shared.titleTight,
  subtitle: {
    fontSize: '12.5px',
    color: 'var(--text-faint)',
    marginBottom: '20px',
    maxWidth: '600px',
    lineHeight: 1.5,
  },
  error: {
    padding: '11px 14px',
    backgroundColor: 'var(--danger-soft)',
    color: 'var(--danger-text)',
    borderRadius: '9px',
    fontSize: '14px',
    marginBottom: '16px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '16px',
  },
  tile: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    padding: '20px',
    backgroundColor: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: '10px',
  },
  tileBody: {
    flex: 1,
  },
  tileTitle: {
    fontSize: '15px',
    fontWeight: 700,
    color: 'var(--text)',
    margin: 0,
  },
  tileText: {
    fontSize: '12.5px',
    color: 'var(--text-muted)',
    margin: 0,
    lineHeight: 1.5,
  },
  btn: {
    padding: '10px 16px',
    backgroundColor: 'var(--success)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13.5px',
    fontWeight: 600,
  },
};
