import { useState, useEffect } from 'react';
import { api } from '../../api';
import type { Team, Ticket, Report, Tag } from '../../types';

const URGENCY_COLORS: Record<string, string> = {
  HIGH: '#dc3545',
  MEDIUM: '#ffc107',
  LOW: '#28a745',
};

const STATUS_COLORS: Record<string, string> = {
  OPEN: '#007bff',
  IN_PROGRESS: '#ffc107',
  RESOLVED: '#28a745',
  ARCHIVED: '#6c757d',
};

/**
 * Read-only "view as team" preview: lets an admin pick any team and see
 * exactly which tickets/reports a hypothetical MEMBER of only that team
 * would see, based on the tag-overlap visibility rule. No actions
 * (comment, pin, resolve) are available from here — preview only.
 */
export default function AdminViewAs() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [teamTags, setTeamTags] = useState<Tag[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoadingTeams, setIsLoadingTeams] = useState(true);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .listTeams()
      .then((res) => setTeams(res.data.data?.items || []))
      .catch(() => setError('Failed to load teams'))
      .finally(() => setIsLoadingTeams(false));
  }, []);

  useEffect(() => {
    if (!selectedTeamId) {
      setTickets([]);
      setReports([]);
      setTeamTags([]);
      return;
    }

    setIsLoadingPreview(true);
    setError(null);
    Promise.all([
      api.previewTicketsAsTeam(selectedTeamId),
      api.previewReportsAsTeam(selectedTeamId),
    ])
      .then(([ticketsRes, reportsRes]) => {
        setTickets(ticketsRes.data.data?.items || []);
        setReports(reportsRes.data.data?.items || []);
        setTeamTags(ticketsRes.data.data?.team.tags || []);
      })
      .catch((err: any) => setError(err.response?.data?.error || 'Failed to load preview'))
      .finally(() => setIsLoadingPreview(false));
  }, [selectedTeamId]);

  const selectedTeam = teams.find((t) => t.id === selectedTeamId);

  return (
    <div style={styles.card}>
      <h2 style={styles.title}>View As</h2>
      <p style={styles.subtitle}>
        Preview the dashboard as a hypothetical MEMBER of a chosen team, based on that
        team's tags. Read-only — no comments, pins, or status changes can be made from here.
      </p>

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.selectRow}>
        <label style={styles.label} htmlFor="viewAsTeam">
          Preview as team
        </label>
        <select
          id="viewAsTeam"
          value={selectedTeamId}
          onChange={(e) => setSelectedTeamId(e.target.value)}
          style={styles.select}
          disabled={isLoadingTeams || teams.length === 0}
        >
          <option value="">— Select a team —</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      {!isLoadingTeams && teams.length === 0 && (
        <p style={styles.empty}>No teams exist yet. Create one in the Teams tab first.</p>
      )}

      {selectedTeamId && (
        <div style={styles.banner}>
          👁️ Viewing as a MEMBER of <strong>{selectedTeam?.name}</strong>
          {teamTags.length > 0 ? (
            <>
              {' '}
              — visible tags:{' '}
              {teamTags.map((t) => (
                <span key={t.id} style={styles.tagBadge}>
                  {t.name}
                </span>
              ))}
            </>
          ) : (
            <> — this team has no tags, so a member of it would see nothing</>
          )}
        </div>
      )}

      {isLoadingPreview && <p style={styles.loading}>Loading preview…</p>}

      {!isLoadingPreview && selectedTeamId && (
        <div style={styles.columns}>
          <div>
            <h3 style={styles.sectionTitle}>🎫 Tickets ({tickets.length})</h3>
            {tickets.length === 0 ? (
              <p style={styles.empty}>No tickets visible to this team.</p>
            ) : (
              <div style={styles.list}>
                {tickets.map((t) => (
                  <div key={t.id} style={styles.itemCard}>
                    <div style={styles.itemHeader}>
                      <span style={{ ...styles.badge, backgroundColor: URGENCY_COLORS[t.urgency] }}>
                        {t.urgency}
                      </span>
                      <span style={{ ...styles.badge, backgroundColor: STATUS_COLORS[t.status] }}>
                        {t.status.replace('_', ' ')}
                      </span>
                      <span style={styles.itemLocation}>📍 {t.location?.name}</span>
                    </div>
                    <p style={styles.itemTitle}>{t.title}</p>
                    <p style={styles.itemMeta}>
                      {(t.tags || []).map((tag) => tag.name).join(', ') || 'untagged'} · submitted by{' '}
                      {t.submitter?.name}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 style={styles.sectionTitle}>📋 Reports ({reports.length})</h3>
            {reports.length === 0 ? (
              <p style={styles.empty}>No reports visible to this team.</p>
            ) : (
              <div style={styles.list}>
                {reports.map((r) => (
                  <div key={r.id} style={styles.itemCard}>
                    <div style={styles.itemHeader}>
                      <span style={styles.itemLocation}>📍 {r.location?.name}</span>
                    </div>
                    <p style={styles.itemTitle}>{r.text}</p>
                    <p style={styles.itemMeta}>
                      {(r.tags || []).map((tag) => tag.name).join(', ') || 'untagged'} · submitted by{' '}
                      {r.submitter?.name}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
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
  selectRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
    flexWrap: 'wrap',
  },
  label: {
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--text-muted)',
  },
  select: {
    padding: '10px 12px',
    border: '1px solid var(--border-strong)',
    borderRadius: '4px',
    fontSize: '14px',
    backgroundColor: 'var(--input-bg)',
    color: 'var(--text)',
    minWidth: '220px',
  },
  banner: {
    padding: '12px 16px',
    backgroundColor: 'var(--bg)',
    border: '1px solid var(--border)',
    borderLeft: '4px solid #7c5cff',
    borderRadius: '6px',
    fontSize: '13px',
    color: 'var(--text)',
    marginBottom: '20px',
    lineHeight: 1.6,
  },
  tagBadge: {
    display: 'inline-block',
    padding: '2px 8px',
    marginLeft: '4px',
    backgroundColor: 'var(--tag-bg)',
    color: 'var(--tag-text)',
    borderRadius: '10px',
    fontSize: '12px',
    fontWeight: 500,
  },
  loading: {
    fontSize: '14px',
    color: 'var(--text-faint)',
    fontStyle: 'italic',
  },
  columns: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '24px',
  },
  sectionTitle: {
    fontSize: '15px',
    fontWeight: 600,
    color: 'var(--text)',
    marginBottom: '12px',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  itemCard: {
    padding: '12px 14px',
    backgroundColor: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: '6px',
  },
  itemHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginBottom: '6px',
    flexWrap: 'wrap',
  },
  badge: {
    padding: '2px 8px',
    borderRadius: '10px',
    color: 'white',
    fontSize: '10px',
    fontWeight: 700,
  },
  itemLocation: {
    fontSize: '12px',
    color: 'var(--text-faint)',
    marginLeft: 'auto',
  },
  itemTitle: {
    fontSize: '14px',
    fontWeight: 500,
    color: 'var(--text)',
    margin: '0 0 4px',
    lineHeight: 1.4,
  },
  itemMeta: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    margin: 0,
  },
  empty: {
    fontSize: '13px',
    color: 'var(--text-faint)',
    fontStyle: 'italic',
  },
};
