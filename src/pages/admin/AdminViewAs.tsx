import { useState, useEffect } from 'react';
import { api } from '../../api';
import { styles as shared } from '../../components/AdminShared';
import { urgencyBadge, statusBadge, LocationIcon } from '../../components/badges';
import type { Team, Ticket, Report, Tag } from '../../types';

const TicketIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: '-2px', marginRight: '6px' }}>
    <path d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4z" />
  </svg>
);

const ReportIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: '-2px', marginRight: '6px' }}>
    <rect x="6" y="4" width="12" height="16" rx="2" />
    <line x1="9" y1="10" x2="15" y2="10" />
    <line x1="9" y1="14" x2="15" y2="14" />
  </svg>
);

const EyeIcon = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: '-2px', marginRight: '4px' }}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

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
          {EyeIcon} Viewing as a MEMBER of <strong>{selectedTeam?.name}</strong>
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
            <h3 style={styles.sectionTitle}>{TicketIcon}Tickets ({tickets.length})</h3>
            {tickets.length === 0 ? (
              <p style={styles.empty}>No tickets visible to this team.</p>
            ) : (
              <div style={styles.list}>
                {tickets.map((t) => (
                  <div key={t.id} style={styles.itemCard}>
                    <div style={styles.itemHeader}>
                      <span style={urgencyBadge(t.urgency)}>{t.urgency}</span>
                      <span style={statusBadge(t.status)}>{t.status.replace('_', ' ')}</span>
                      <span style={styles.itemLocation}>
                        <LocationIcon size={11} /> {t.location?.name}
                      </span>
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
            <h3 style={styles.sectionTitle}>{ReportIcon}Reports ({reports.length})</h3>
            {reports.length === 0 ? (
              <p style={styles.empty}>No reports visible to this team.</p>
            ) : (
              <div style={styles.list}>
                {reports.map((r) => (
                  <div key={r.id} style={styles.itemCard}>
                    <div style={styles.itemHeader}>
                      <span style={styles.itemLocation}>
                        <LocationIcon size={11} /> {r.location?.name}
                      </span>
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
  card: shared.card,
  title: shared.titleTight,
  subtitle: {
    fontSize: '12.5px',
    color: 'var(--text-faint)',
    marginBottom: '18px',
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
  selectRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '18px',
    flexWrap: 'wrap',
  },
  label: {
    fontSize: '12.5px',
    fontWeight: 700,
    color: 'var(--text-muted)',
  },
  select: {
    padding: '9px 12px',
    border: '1px solid var(--border-strong)',
    borderRadius: '8px',
    fontSize: '13.5px',
    backgroundColor: 'var(--surface)',
    color: 'var(--text)',
    minWidth: '200px',
  },
  banner: {
    padding: '12px 16px',
    backgroundColor: 'var(--bg)',
    border: '1px solid var(--border)',
    borderLeft: '4px solid var(--purple)',
    borderRadius: '8px',
    fontSize: '12.5px',
    color: 'var(--text)',
    marginBottom: '20px',
    lineHeight: 1.6,
  },
  tagBadge: {
    display: 'inline-block',
    padding: '2px 8px',
    marginLeft: '4px',
    backgroundColor: 'var(--accent-soft)',
    color: 'var(--accent-text)',
    borderRadius: '10px',
    fontSize: '11.5px',
    fontWeight: 600,
  },
  loading: {
    fontSize: '14px',
    color: 'var(--text-faint)',
    fontStyle: 'italic',
  },
  columns: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '20px',
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: 700,
    color: 'var(--text)',
    marginBottom: '10px',
    display: 'flex',
    alignItems: 'center',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '9px',
  },
  itemCard: {
    padding: '11px 13px',
    backgroundColor: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: '7px',
  },
  itemHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginBottom: '6px',
    flexWrap: 'wrap',
  },
  itemLocation: {
    fontSize: '12px',
    color: 'var(--text-faint)',
    marginLeft: 'auto',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '3px',
  },
  itemTitle: {
    fontSize: '13.5px',
    fontWeight: 600,
    color: 'var(--text)',
    margin: '0 0 4px',
    lineHeight: 1.4,
  },
  itemMeta: {
    fontSize: '11.5px',
    color: 'var(--text-muted)',
    margin: 0,
  },
  empty: shared.empty,
};
