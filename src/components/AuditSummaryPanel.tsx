import { useState } from 'react';
import { api } from '../api';
import { useToast } from '../Toast';
import type { AuditSummaryReport } from '../types';

/**
 * AI Audit Summary generator: aggregates every audit log (all time — logs
 * are kept forever) into at-a-glance totals plus an AI-written producer
 * review (what went well, what needs work, changes for future events, and
 * any critical recurring incidents). The same summary is baked into the
 * audit-logs.csv export as a header block.
 */
export function AuditSummaryPanel() {
  const showToast = useToast();
  const [report, setReport] = useState<AuditSummaryReport | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setBusy(true);
    setError(null);
    try {
      const res = await api.getAuditLogSummary();
      setReport(res.data.data || null);
      if (!res.data.data?.narrative) {
        showToast('Summary generated (AI narrative unavailable — totals only)');
      } else {
        showToast('AI audit summary generated ✓');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to generate audit summary. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  const stats = report?.stats;
  const narrative = report?.narrative;

  return (
    <div style={styles.card}>
      <h2 style={styles.title}>AI Audit Summary</h2>
      <p style={styles.subtitle}>
        Aggregates every audit log entry ever recorded into at-a-glance totals, plus an
        AI-written producer review — what went well, what needs work, changes to consider
        for future events, and any critical recurring incidents. The same summary is
        included at the top of the Audit Logs CSV export.
      </p>

      <button onClick={generate} style={styles.generateBtn} disabled={busy}>
        {busy ? 'Generating…' : report ? 'Regenerate Summary' : 'Generate Summary'}
      </button>

      {error && <div style={styles.error}>{error}</div>}

      {stats && (
        <div style={styles.report}>
          {stats.totalActions === 0 ? (
            <div style={styles.notice}>No audit log activity recorded yet.</div>
          ) : (
            <>
              <Section title="At a Glance">
                <div style={styles.statGrid}>
                  <StatTile label="Total Actions" value={stats.totalActions} />
                  <StatTile label="Admin Actions" value={stats.byCategory.ADMIN_ACTION} />
                  <StatTile label="User Actions" value={stats.byCategory.USER_ACTION} />
                  <StatTile label="Unique Actors" value={stats.uniqueActors} />
                  <StatTile label="Unique Targets" value={stats.uniqueTargets} />
                  <StatTile label="Repeated Targets" value={stats.topRepeatedTargets.length} />
                </div>
                {(stats.dateRange.earliest || stats.dateRange.latest) && (
                  <p style={styles.rangeLine}>
                    Range: {stats.dateRange.earliest ? new Date(stats.dateRange.earliest).toLocaleString() : 'n/a'} —{' '}
                    {stats.dateRange.latest ? new Date(stats.dateRange.latest).toLocaleString() : 'n/a'}
                  </p>
                )}

                <h4 style={styles.subhead}>By Action Type</h4>
                <ul style={styles.list}>
                  {stats.byAction.slice(0, 12).map((a) => (
                    <li key={a.action}>
                      {a.action}: {a.count}
                    </li>
                  ))}
                </ul>

                <h4 style={styles.subhead}>Top Actors</h4>
                {stats.byActor.length === 0 ? (
                  <p style={styles.muted}>None</p>
                ) : (
                  <ol style={styles.list}>
                    {stats.byActor.slice(0, 10).map((a) => (
                      <li key={a.actorId}>
                        {a.name} — {a.count}
                      </li>
                    ))}
                  </ol>
                )}

                {stats.topRepeatedTargets.length > 0 && (
                  <>
                    <h4 style={styles.subhead}>Targets Acted On More Than Once</h4>
                    <ul style={styles.list}>
                      {stats.topRepeatedTargets.map((t) => (
                        <li key={t.targetId}>
                          {t.targetType} {t.targetId.slice(0, 8)}… — {t.count}x ({t.actions.join(', ')})
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </Section>

              {narrative ? (
                <>
                  <Section title="What Went Well">
                    <p style={styles.prose}>{narrative.wentWell}</p>
                  </Section>
                  <Section title="What Needs Work">
                    <p style={styles.prose}>{narrative.needsWork}</p>
                  </Section>
                  <Section title="Changes to Consider for Future Events">
                    <p style={styles.prose}>{narrative.futureEventChanges}</p>
                  </Section>
                  <Section title="Critical Flags">
                    <p style={styles.prose}>{narrative.criticalFlags}</p>
                  </Section>
                </>
              ) : (
                <div style={styles.notice}>
                  AI narrative unavailable (the server has no AI key configured, or generation
                  failed) — showing computed totals only.
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div style={styles.statTile}>
      <div style={styles.statValue}>{value}</div>
      <div style={styles.statLabel}>{label}</div>
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
  subtitle: { fontSize: '12.5px', color: 'var(--text-faint)', margin: '0 0 16px', lineHeight: 1.5, maxWidth: '640px' },
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
    marginTop: '16px',
  },
  report: {
    marginTop: '20px',
    borderTop: '1px solid var(--border)',
    paddingTop: '20px',
  },
  notice: {
    padding: '10px 14px',
    backgroundColor: 'var(--warning-soft)',
    color: 'var(--warning-text-on-soft)',
    borderRadius: '8px',
    fontSize: '13px',
    marginBottom: '18px',
  },
  statGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: '10px',
    marginBottom: '14px',
  },
  statTile: {
    padding: '12px 14px',
    backgroundColor: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: '9px',
    textAlign: 'center',
  },
  statValue: { fontSize: '22px', fontWeight: 800, color: 'var(--text)', lineHeight: 1.2 },
  statLabel: { fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginTop: '2px' },
  rangeLine: { fontSize: '12px', color: 'var(--text-faint)', margin: '0 0 14px' },
  section: { marginBottom: '22px' },
  sectionTitle: { fontSize: '15px', fontWeight: 700, color: 'var(--text)', margin: '0 0 10px' },
  subhead: { fontSize: '13px', fontWeight: 700, color: 'var(--text)', margin: '14px 0 6px' },
  prose: { fontSize: '14px', lineHeight: 1.6, color: 'var(--text-secondary)', margin: 0, whiteSpace: 'pre-wrap' },
  list: { fontSize: '13.5px', lineHeight: 1.7, color: 'var(--text-secondary)', margin: '0 0 0 18px', padding: 0 },
  muted: { fontSize: '13px', color: 'var(--text-faint)', margin: 0 },
};
