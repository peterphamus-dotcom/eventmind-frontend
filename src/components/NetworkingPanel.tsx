import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../Toast';
import { api } from '../api';
import { UserLink } from './UserLink';
import type { NetworkingProfile, SuggestedMatch, MeetingRequest, Tag } from '../types';

type SubTab = 'directory' | 'suggested' | 'requests';

function initialsOf(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function formatProposedTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  DECLINED: 'Declined',
  CANCELLED: 'Cancelled',
};

function PersonCard({ profile, matchCopy }: { profile: NetworkingProfile; matchCopy?: string }) {
  return (
    <div style={styles.card}>
      <div style={styles.cardAvatar}>{initialsOf(profile.name)}</div>
      <div style={styles.cardBody}>
        <div style={styles.cardTopRow}>
          <span style={styles.cardName}>
            <UserLink id={profile.id} name={profile.name} />
          </span>
          <span style={styles.roleBadge}>{profile.role.replace('_', ' ')}</span>
        </div>
        {profile.goalTags.length > 0 && (
          <div style={styles.tagRow}>
            {profile.goalTags.map((tag) => (
              <span key={tag.id} style={styles.tagChip}>
                {tag.name}
              </span>
            ))}
          </div>
        )}
        {matchCopy && <div style={styles.matchCopy}>{matchCopy}</div>}
        {profile.networkingBlurb && <p style={styles.blurb}>{profile.networkingBlurb}</p>}
      </div>
    </div>
  );
}

/**
 * Business networking: browse/filter people by goal tag, see admin-curated
 * "suggested matches" (complementary tag pairs), and manage meeting requests.
 * Message/Follow/Report + the actual "Request meeting" action live on the
 * shared UserProfileCard popover (opened via UserLink) — this panel is
 * discovery + the meeting-request inbox only.
 */
export function NetworkingPanel() {
  const showToast = useToast();
  const [subTab, setSubTab] = useState<SubTab>('directory');

  const [directory, setDirectory] = useState<NetworkingProfile[] | null>(null);
  const [search, setSearch] = useState('');
  const [goalTagFilterIds, setGoalTagFilterIds] = useState<string[]>([]);
  const [goalTags, setGoalTags] = useState<Tag[]>([]);

  function toggleGoalTagFilter(id: string) {
    setGoalTagFilterIds((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
  }

  const [suggested, setSuggested] = useState<SuggestedMatch[] | null>(null);

  const [requestsBox, setRequestsBox] = useState<'incoming' | 'outgoing'>('incoming');
  const [incoming, setIncoming] = useState<MeetingRequest[] | null>(null);
  const [outgoing, setOutgoing] = useState<MeetingRequest[] | null>(null);
  const [respondingId, setRespondingId] = useState<string | null>(null);

  const loadGoalTags = useCallback(async () => {
    try {
      const res = await api.listTags(1, 100, true);
      setGoalTags(res.data.data?.items || []);
    } catch {
      setGoalTags([]);
    }
  }, []);

  const loadDirectory = useCallback(async () => {
    try {
      const res = await api.listNetworkingDirectory({
        goalTagIds: goalTagFilterIds.length ? goalTagFilterIds : undefined,
        search: search.trim() || undefined,
      });
      setDirectory(res.data.data || []);
    } catch {
      setDirectory([]);
    }
  }, [goalTagFilterIds, search]);

  const loadSuggested = useCallback(async () => {
    try {
      const res = await api.listSuggestedMatches();
      setSuggested(res.data.data || []);
    } catch {
      setSuggested([]);
    }
  }, []);

  const loadIncoming = useCallback(async () => {
    try {
      const res = await api.listMeetingRequests('incoming');
      setIncoming(res.data.data || []);
    } catch {
      setIncoming([]);
    }
  }, []);

  const loadOutgoing = useCallback(async () => {
    try {
      const res = await api.listMeetingRequests('outgoing');
      setOutgoing(res.data.data || []);
    } catch {
      setOutgoing([]);
    }
  }, []);

  useEffect(() => {
    loadGoalTags();
  }, [loadGoalTags]);

  useEffect(() => {
    if (subTab === 'directory') loadDirectory();
    else if (subTab === 'suggested') loadSuggested();
    else {
      loadIncoming();
      loadOutgoing();
    }
  }, [subTab, loadDirectory, loadSuggested, loadIncoming, loadOutgoing]);

  // Directory search/filter re-fetches without switching tabs.
  useEffect(() => {
    if (subTab === 'directory') loadDirectory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goalTagFilterIds, search]);

  async function respond(id: string, action: 'accept' | 'decline') {
    if (respondingId) return;
    setRespondingId(id);
    try {
      if (action === 'accept') await api.acceptMeetingRequest(id);
      else await api.declineMeetingRequest(id);
      showToast(action === 'accept' ? 'Meeting accepted' : 'Meeting declined');
      await loadIncoming();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to update meeting request');
    } finally {
      setRespondingId(null);
    }
  }

  async function cancel(id: string) {
    if (respondingId) return;
    setRespondingId(id);
    try {
      await api.cancelMeetingRequest(id);
      showToast('Meeting request cancelled');
      await loadOutgoing();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to cancel meeting request');
    } finally {
      setRespondingId(null);
    }
  }

  const pendingIncomingCount = (incoming || []).filter((r) => r.status === 'PENDING').length;

  return (
    <div style={styles.container}>
      <div style={styles.tabRow}>
        <button
          style={{ ...styles.tabBtn, ...(subTab === 'directory' ? styles.tabBtnActive : {}) }}
          onClick={() => setSubTab('directory')}
        >
          Directory
        </button>
        <button
          style={{ ...styles.tabBtn, ...(subTab === 'suggested' ? styles.tabBtnActive : {}) }}
          onClick={() => setSubTab('suggested')}
        >
          Suggested Matches
        </button>
        <button
          style={{ ...styles.tabBtn, ...(subTab === 'requests' ? styles.tabBtnActive : {}) }}
          onClick={() => setSubTab('requests')}
        >
          Meeting Requests
          {pendingIncomingCount > 0 && <span style={styles.tabBadge}>{pendingIncomingCount}</span>}
        </button>
      </div>

      {subTab === 'directory' && (
        <>
          <div style={styles.filterRow}>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, bio, or post…"
              style={styles.searchInput}
            />
          </div>
          {goalTags.length > 0 && (
            <div style={styles.tagFilterRow}>
              {goalTags.map((tag) => {
                const active = goalTagFilterIds.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleGoalTagFilter(tag.id)}
                    style={{ ...styles.tagFilterChip, ...(active ? styles.tagFilterChipActive : {}) }}
                  >
                    {tag.name}
                  </button>
                );
              })}
            </div>
          )}
          <div style={styles.list}>
            {directory == null ? (
              <p style={styles.empty}>Loading…</p>
            ) : directory.length === 0 ? (
              <p style={styles.empty}>No one matches your filters yet.</p>
            ) : (
              directory.map((p) => <PersonCard key={p.id} profile={p} />)
            )}
          </div>
        </>
      )}

      {subTab === 'suggested' && (
        <div style={styles.list}>
          {suggested == null ? (
            <p style={styles.empty}>Loading…</p>
          ) : suggested.length === 0 ? (
            <p style={styles.empty}>
              No suggested matches yet. Add networking goals on your{' '}
              <a href="/profile" style={styles.inlineLink}>
                profile
              </a>{' '}
              to see people whose goals complement yours.
            </p>
          ) : (
            suggested.map((p) => (
              <PersonCard
                key={p.id}
                profile={p}
                matchCopy={
                  p.matchedOn.mine.length > 0 && p.matchedOn.theirs.length > 0
                    ? `You're into ${p.matchedOn.mine.map((t) => t.name).join(', ')} — they're into ${p.matchedOn.theirs
                        .map((t) => t.name)
                        .join(', ')}`
                    : undefined
                }
              />
            ))
          )}
        </div>
      )}

      {subTab === 'requests' && (
        <>
          <div style={styles.filterRow}>
            <button
              style={{ ...styles.boxBtn, ...(requestsBox === 'incoming' ? styles.boxBtnActive : {}) }}
              onClick={() => setRequestsBox('incoming')}
            >
              Incoming{pendingIncomingCount > 0 && <span style={styles.tabBadge}>{pendingIncomingCount}</span>}
            </button>
            <button
              style={{ ...styles.boxBtn, ...(requestsBox === 'outgoing' ? styles.boxBtnActive : {}) }}
              onClick={() => setRequestsBox('outgoing')}
            >
              Outgoing
            </button>
          </div>
          <div style={styles.list}>
            {requestsBox === 'incoming' ? (
              incoming == null ? (
                <p style={styles.empty}>Loading…</p>
              ) : incoming.length === 0 ? (
                <p style={styles.empty}>No meeting requests yet.</p>
              ) : (
                incoming.map((r) => (
                  <div key={r.id} style={styles.requestRow}>
                    <div style={styles.requestBody}>
                      <div style={styles.requestTopRow}>
                        <UserLink id={r.requester.id} name={r.requester.name} />
                        <span style={styles.requestTime}>{formatProposedTime(r.proposedTime)}</span>
                      </div>
                      {r.note && <p style={styles.requestNote}>{r.note}</p>}
                      {r.status !== 'PENDING' && (
                        <span style={styles.statusTag}>{STATUS_LABEL[r.status]}</span>
                      )}
                    </div>
                    {r.status === 'PENDING' && (
                      <div style={styles.requestActions}>
                        <button
                          style={styles.acceptBtn}
                          disabled={respondingId === r.id}
                          onClick={() => respond(r.id, 'accept')}
                        >
                          Accept
                        </button>
                        <button
                          style={styles.declineBtn}
                          disabled={respondingId === r.id}
                          onClick={() => respond(r.id, 'decline')}
                        >
                          Decline
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )
            ) : outgoing == null ? (
              <p style={styles.empty}>Loading…</p>
            ) : outgoing.length === 0 ? (
              <p style={styles.empty}>You haven't sent any meeting requests yet.</p>
            ) : (
              outgoing.map((r) => (
                <div key={r.id} style={styles.requestRow}>
                  <div style={styles.requestBody}>
                    <div style={styles.requestTopRow}>
                      <UserLink id={r.recipient.id} name={r.recipient.name} />
                      <span style={styles.requestTime}>{formatProposedTime(r.proposedTime)}</span>
                    </div>
                    {r.note && <p style={styles.requestNote}>{r.note}</p>}
                    <span style={styles.statusTag}>{STATUS_LABEL[r.status]}</span>
                  </div>
                  {r.status === 'PENDING' && (
                    <div style={styles.requestActions}>
                      <button style={styles.declineBtn} disabled={respondingId === r.id} onClick={() => cancel(r.id)}>
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '760px',
    margin: '0 auto',
    padding: '20px clamp(16px, 4vw, 32px)',
  },
  tabRow: {
    display: 'flex',
    borderBottom: '1px solid var(--border)',
    marginBottom: '18px',
  },
  tabBtn: {
    flex: 1,
    padding: '11px 8px',
    background: 'none',
    borderWidth: '0 0 2px 0',
    borderStyle: 'solid',
    borderColor: 'transparent',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
  },
  tabBtnActive: {
    color: 'var(--accent)',
    borderColor: 'var(--accent)',
  },
  tabBadge: {
    backgroundColor: 'var(--accent)',
    color: 'white',
    fontSize: '10.5px',
    fontWeight: 700,
    borderRadius: '999px',
    padding: '1px 6px',
  },
  filterRow: {
    display: 'flex',
    gap: '10px',
    marginBottom: '16px',
    flexWrap: 'wrap',
  },
  searchInput: {
    flex: 1,
    minWidth: '160px',
    padding: '9px 12px',
    border: '1px solid var(--border-strong)',
    borderRadius: '8px',
    backgroundColor: 'var(--input-bg)',
    color: 'var(--text)',
    fontSize: '13.5px',
  },
  boxBtn: {
    padding: '8px 16px',
    background: 'none',
    border: '1px solid var(--border-strong)',
    borderRadius: '8px',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    fontSize: '12.5px',
    fontWeight: 600,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
  },
  boxBtnActive: {
    borderColor: 'var(--accent)',
    color: 'var(--accent)',
  },
  tagFilterRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginBottom: '16px',
  },
  tagFilterChip: {
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--text-muted)',
    backgroundColor: 'var(--surface)',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'var(--border-strong)',
    borderRadius: '999px',
    padding: '5px 12px',
    cursor: 'pointer',
  },
  tagFilterChipActive: {
    color: 'var(--accent-text)',
    backgroundColor: 'var(--accent-soft)',
    borderColor: 'var(--accent)',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  empty: {
    padding: '30px 16px',
    fontSize: '13px',
    color: 'var(--text-faint)',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  inlineLink: {
    color: 'var(--accent)',
    fontWeight: 600,
  },
  card: {
    display: 'flex',
    gap: '12px',
    padding: '14px 16px',
    backgroundColor: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '10px',
  },
  cardAvatar: {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    backgroundColor: 'var(--accent-soft)',
    color: 'var(--accent-text)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '15px',
    fontWeight: 700,
    flexShrink: 0,
  },
  cardBody: {
    minWidth: 0,
    flex: 1,
  },
  cardTopRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
  },
  cardName: {
    fontSize: '14px',
    fontWeight: 700,
    color: 'var(--text)',
  },
  roleBadge: {
    fontSize: '10.5px',
    fontWeight: 700,
    color: 'var(--accent-text)',
    backgroundColor: 'var(--accent-soft)',
    padding: '2px 9px',
    borderRadius: '10px',
    textTransform: 'capitalize',
    flexShrink: 0,
  },
  tagRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '5px',
    marginTop: '6px',
  },
  tagChip: {
    fontSize: '11px',
    fontWeight: 600,
    color: 'var(--text-muted)',
    backgroundColor: 'var(--bg)',
    padding: '2px 9px',
    borderRadius: '10px',
  },
  matchCopy: {
    fontSize: '11.5px',
    color: 'var(--accent-text)',
    marginTop: '6px',
    fontStyle: 'italic',
  },
  blurb: {
    fontSize: '12.5px',
    color: 'var(--text-muted)',
    marginTop: '6px',
    marginBottom: 0,
    lineHeight: 1.5,
  },
  requestRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    padding: '13px 16px',
    backgroundColor: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '10px',
  },
  requestBody: {
    minWidth: 0,
    flex: 1,
  },
  requestTopRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
    fontSize: '13.5px',
    fontWeight: 700,
  },
  requestTime: {
    fontSize: '11.5px',
    fontWeight: 600,
    color: 'var(--text-faint)',
    flexShrink: 0,
  },
  requestNote: {
    fontSize: '12.5px',
    color: 'var(--text-muted)',
    margin: '5px 0 0',
    lineHeight: 1.5,
  },
  statusTag: {
    display: 'inline-block',
    marginTop: '6px',
    fontSize: '10.5px',
    fontWeight: 700,
    color: 'var(--text-faint)',
    textTransform: 'uppercase',
  },
  requestActions: {
    display: 'flex',
    gap: '8px',
    flexShrink: 0,
  },
  acceptBtn: {
    padding: '7px 13px',
    backgroundColor: 'var(--accent)',
    color: 'white',
    border: 'none',
    borderRadius: '7px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 600,
  },
  declineBtn: {
    padding: '7px 13px',
    backgroundColor: 'transparent',
    border: '1px solid var(--border-strong)',
    borderRadius: '7px',
    color: 'var(--danger-text)',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 600,
  },
};
