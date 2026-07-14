import { useState } from 'react';
import { api } from '../../api';
import { useToast } from '../../Toast';

type Which = 'tickets' | 'reports';

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
          <div style={styles.tileIcon}>🎫</div>
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
            {busy === 'tickets' ? 'Preparing…' : '⬇ Download CSV'}
          </button>
        </div>

        <div style={styles.tile}>
          <div style={styles.tileIcon}>📋</div>
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
            {busy === 'reports' ? 'Preparing…' : '⬇ Download CSV'}
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
  card: {
    backgroundColor: 'var(--surface)',
    borderRadius: '8px',
    padding: '32px',
    boxShadow: '0 2px 10px var(--shadow)',
  },
  title: {
    fontSize: '20px',
    fontWeight: 600,
    marginBottom: '4px',
    color: 'var(--text)',
  },
  subtitle: {
    fontSize: '13px',
    color: 'var(--text-faint)',
    marginBottom: '24px',
    maxWidth: '620px',
    lineHeight: 1.5,
  },
  error: {
    padding: '12px 16px',
    backgroundColor: 'var(--danger-bg)',
    color: 'var(--danger-text)',
    borderRadius: '4px',
    fontSize: '14px',
    marginBottom: '16px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '16px',
  },
  tile: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    padding: '20px',
    backgroundColor: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
  },
  tileIcon: {
    fontSize: '28px',
  },
  tileBody: {
    flex: 1,
  },
  tileTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: 'var(--text)',
    margin: '0 0 6px',
  },
  tileText: {
    fontSize: '13px',
    color: 'var(--text-muted)',
    margin: 0,
    lineHeight: 1.5,
  },
  btn: {
    padding: '10px 16px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 600,
  },
};
