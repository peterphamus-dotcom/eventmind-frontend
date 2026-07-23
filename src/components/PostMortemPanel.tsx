import { useState, useEffect } from 'react';
import { api } from '../api';
import { useToast } from '../Toast';
import type { PostMortemReport, Location } from '../types';

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

/**
 * Post-mortem generator: aggregates tickets, reports, and user conduct
 * reports (optionally scoped by date range / location) into an AI-written
 * review with the underlying stats. Renders in-app; downloadable as Markdown
 * or printable to PDF.
 */
export function PostMortemPanel() {
  const showToast = useToast();
  const [locations, setLocations] = useState<Location[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [locationId, setLocationId] = useState('');

  const [report, setReport] = useState<PostMortemReport | null>(null);
  const [busy, setBusy] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.listLocations().then((res) => setLocations(res.data.data?.items || [])).catch(() => setLocations([]));
  }, []);

  function currentParams() {
    return {
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      locationId: locationId || undefined,
    };
  }

  async function generate() {
    setBusy(true);
    setError(null);
    try {
      const res = await api.getPostMortem(currentParams());
      setReport(res.data.data || null);
      if (!res.data.data?.narrative) {
        showToast('Report generated (AI narrative unavailable — stats only)');
      } else {
        showToast('Post-mortem generated ✓');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to generate post-mortem. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function downloadMarkdown() {
    setDownloading(true);
    try {
      const res = await api.exportPostMortemMarkdown(currentParams());
      const date = new Date().toISOString().slice(0, 10);
      triggerDownload(res.data as Blob, `post-mortem-${date}.md`);
      showToast('Markdown downloaded ✓');
    } catch {
      setError('Failed to download Markdown. Please try again.');
    } finally {
      setDownloading(false);
    }
  }

  const stats = report?.stats;
  const narrative = report?.narrative;

  return (
    <div style={styles.card}>
      <h2 style={styles.title}>Event Post-Mortem</h2>
      <p style={styles.subtitle}>
        Aggregates every ticket, report, and user conduct report into a review — an
        AI-written summary (what went well, what didn't, recommendations) on top of the
        underlying stats. Optionally scope to a date range or single location.
      </p>

      <div style={styles.filters}>
        <div style={styles.field}>
          <label style={styles.label}>Start date</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={styles.input} />
        </div>
        <div style={styles.field}>
          <label style={styles.label}>End date</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={styles.input} />
        </div>
        <div style={styles.field}>
          <label style={styles.label}>Location</label>
          <select value={locationId} onChange={(e) => setLocationId(e.target.value)} style={styles.input}>
            <option value="">All locations</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
        </div>
        <button onClick={generate} style={styles.generateBtn} disabled={busy}>
          {busy ? 'Generating…' : 'Generate Post-Mortem'}
        </button>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {stats && (
        <div id="post-mortem-report" style={styles.report}>
          <div style={styles.reportActions} className="no-print">
            <button onClick={downloadMarkdown} style={styles.downloadBtn} disabled={downloading}>
              {downloading ? 'Preparing…' : '⬇ Download Markdown'}
            </button>
            <button onClick={() => window.print()} style={styles.printBtn}>
              🖨 Print / Save as PDF
            </button>
          </div>

          {narrative ? (
            <>
              <Section title="Executive Summary">
                <p style={styles.prose}>{narrative.executiveSummary}</p>
              </Section>
            </>
          ) : (
            <div style={styles.notice}>
              AI narrative unavailable (the server has no AI key configured) — showing computed stats only.
            </div>
          )}

          <Section title="Key Metrics — Tickets">
            <ul style={styles.list}>
              <li>Total: {stats.tickets.total}</li>
              <li>
                By status: OPEN {stats.tickets.byStatus.OPEN}, IN_PROGRESS {stats.tickets.byStatus.IN_PROGRESS}, RESOLVED{' '}
                {stats.tickets.byStatus.RESOLVED}, ARCHIVED {stats.tickets.byStatus.ARCHIVED}
              </li>
              <li>
                By urgency: HIGH {stats.tickets.byUrgency.HIGH}, MEDIUM {stats.tickets.byUrgency.MEDIUM}, LOW{' '}
                {stats.tickets.byUrgency.LOW}
              </li>
              {stats.tickets.avgResolutionHours != null && (
                <li>
                  Avg resolution: {stats.tickets.avgResolutionHours.toFixed(1)}h (median{' '}
                  {stats.tickets.medianResolutionHours?.toFixed(1)}h)
                </li>
              )}
              {stats.tickets.oldestUnresolved && (
                <li>
                  Oldest unresolved: "{stats.tickets.oldestUnresolved.title}" [{stats.tickets.oldestUnresolved.urgency}] — open{' '}
                  {stats.tickets.oldestUnresolved.ageDays} days
                </li>
              )}
            </ul>
          </Section>

          <Section title="Key Metrics — Reports">
            <ul style={styles.list}>
              <li>Total: {stats.reports.total}</li>
              <li>By location: {stats.reports.byLocation.map((l) => `${l.location} (${l.count})`).join(', ') || 'none'}</li>
              <li>By tag: {stats.reports.byTag.map((t) => `${t.tag} (${t.count})`).join(', ') || 'none'}</li>
            </ul>
            <h4 style={styles.subhead}>Total submitted per user</h4>
            {stats.reports.byUser.length === 0 ? (
              <p style={styles.muted}>None</p>
            ) : (
              <ul style={styles.list}>
                {stats.reports.byUser.map((u) => (
                  <li key={u.userId}>
                    {u.name}: {u.count}
                  </li>
                ))}
              </ul>
            )}
            <h4 style={styles.subhead}>
              Most-active → least-active <span style={styles.placeholder}>(placeholder score = reports + tickets)</span>
            </h4>
            {stats.activity.length === 0 ? (
              <p style={styles.muted}>None</p>
            ) : (
              <ol style={styles.list}>
                {stats.activity.map((a) => (
                  <li key={a.userId}>
                    {a.name} — score {a.score} ({a.reportsCount} reports, {a.ticketsCount} tickets)
                  </li>
                ))}
              </ol>
            )}
          </Section>

          <Section title="Key Metrics — User Conduct Reports">
            <ul style={styles.list}>
              <li>Total: {stats.userConduct.total}</li>
              <li>
                By status: OPEN {stats.userConduct.byStatus.OPEN}, RESOLVED {stats.userConduct.byStatus.RESOLVED},
                DISMISSED {stats.userConduct.byStatus.DISMISSED}
              </li>
              <li>
                By reason:{' '}
                {Object.entries(stats.userConduct.byReason)
                  .map(([k, v]) => `${k} (${v})`)
                  .join(', ')}
              </li>
            </ul>
          </Section>

          <Section title="Top Locations by Volume">
            {stats.topLocations.length === 0 ? (
              <p style={styles.muted}>None</p>
            ) : (
              <ul style={styles.list}>
                {stats.topLocations.map((l) => (
                  <li key={l.location}>
                    {l.location}: {l.total} total ({l.ticketCount} tickets, {l.reportCount} reports)
                  </li>
                ))}
              </ul>
            )}
          </Section>

          {narrative && (
            <>
              <Section title="Notable Incidents">
                <p style={styles.prose}>{narrative.notableIncidents}</p>
              </Section>
              <Section title="What Went Well">
                <p style={styles.prose}>{narrative.wentWell}</p>
              </Section>
              <Section title="What Needs Improvement">
                <p style={styles.prose}>{narrative.needsImprovement}</p>
              </Section>
              <Section title="Recommendations for Next Event">
                <ol style={styles.list}>
                  {narrative.recommendations.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ol>
              </Section>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={styles.section}>
      <h3 style={styles.sectionTitle}>{title}</h3>
      {children}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    backgroundColor: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    padding: 'clamp(18px, 4vw, 28px) clamp(16px, 4vw, 30px)',
    boxShadow: '0 1px 2px oklch(0% 0 0 / 0.03), 0 8px 22px oklch(0% 0 0 / 0.045)',
    marginTop: '20px',
  },
  title: { fontSize: '18px', fontWeight: 700, margin: '0 0 6px' },
  subtitle: { fontSize: '12.5px', color: 'var(--text-faint)', margin: '0 0 20px', lineHeight: 1.5, maxWidth: '640px' },
  filters: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
    marginBottom: '16px',
  },
  field: { display: 'flex', flexDirection: 'column', gap: '5px' },
  label: {
    fontSize: '11px',
    fontWeight: 600,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  input: {
    padding: '9px 11px',
    border: '1px solid var(--border-strong)',
    borderRadius: '7px',
    backgroundColor: 'var(--input-bg)',
    color: 'var(--text)',
    fontSize: '13.5px',
  },
  generateBtn: {
    padding: '10px 18px',
    backgroundColor: 'var(--accent)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13.5px',
    fontWeight: 600,
  },
  error: {
    padding: '11px 14px',
    backgroundColor: 'var(--danger-soft)',
    color: 'var(--danger-text)',
    borderRadius: '9px',
    fontSize: '14px',
    marginBottom: '16px',
  },
  report: {
    marginTop: '8px',
    borderTop: '1px solid var(--border)',
    paddingTop: '20px',
  },
  reportActions: { display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' },
  downloadBtn: {
    padding: '9px 15px',
    backgroundColor: 'var(--success)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 600,
  },
  printBtn: {
    padding: '9px 15px',
    backgroundColor: 'transparent',
    border: '1px solid var(--border-strong)',
    color: 'var(--text)',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 600,
  },
  notice: {
    padding: '10px 14px',
    backgroundColor: 'var(--warning-soft)',
    color: 'var(--warning-text-on)',
    borderRadius: '8px',
    fontSize: '13px',
    marginBottom: '18px',
  },
  section: { marginBottom: '22px' },
  sectionTitle: { fontSize: '15px', fontWeight: 700, color: 'var(--text)', margin: '0 0 10px' },
  subhead: { fontSize: '13px', fontWeight: 700, color: 'var(--text)', margin: '14px 0 6px' },
  placeholder: { fontSize: '11.5px', fontWeight: 400, color: 'var(--text-faint)' },
  prose: { fontSize: '14px', lineHeight: 1.6, color: 'var(--text-secondary)', margin: 0, whiteSpace: 'pre-wrap' },
  list: { fontSize: '13.5px', lineHeight: 1.7, color: 'var(--text-secondary)', margin: '0 0 0 18px', padding: 0 },
  muted: { fontSize: '13px', color: 'var(--text-faint)', margin: 0 },
};
