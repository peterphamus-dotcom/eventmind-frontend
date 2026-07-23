import { useState, useEffect } from 'react';
import { api } from '../../api';
import { useToast } from '../../Toast';
import { styles as shared } from '../../components/AdminShared';
import type { PendingUser, Location, Team } from '../../types';

function relativeTime(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

interface AdminApprovalsProps {
  /** Reports the live pending count so the parent's tab badge stays in sync. */
  onCountChange?: (count: number) => void;
}

export default function AdminApprovals({ onCountChange }: AdminApprovalsProps) {
  const showToast = useToast();
  const [pending, setPending] = useState<PendingUser[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Per-row approval form state, keyed by user id.
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [formRole, setFormRole] = useState<string>('MEMBER');
  const [formLocationId, setFormLocationId] = useState<string>('');
  const [formTeamIds, setFormTeamIds] = useState<string[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setIsLoading(true);
    setError(null);
    try {
      const [pendingRes, locRes, teamRes] = await Promise.all([
        api.listPendingUsers(),
        api.listLocations(),
        api.listTeams(),
      ]);
      const items = pendingRes.data.data?.items || [];
      setPending(items);
      onCountChange?.(items.length);
      setLocations(locRes.data.data?.items || []);
      setTeams(teamRes.data.data?.items || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load pending approvals');
    } finally {
      setIsLoading(false);
    }
  }

  function openApprove(user: PendingUser) {
    setExpandedId(user.id);
    setFormRole('MEMBER');
    setFormLocationId(locations[0]?.id || '');
    setFormTeamIds([]);
  }

  function toggleTeam(id: string) {
    setFormTeamIds((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
  }

  async function handleApprove(user: PendingUser) {
    if (!formLocationId) {
      setError('Please choose a home location before approving.');
      return;
    }
    setBusyId(user.id);
    setError(null);
    try {
      await api.approvePendingUser(user.id, {
        role: formRole,
        homeLocationId: formLocationId,
        teamIds: formTeamIds,
      });
      const next = pending.filter((u) => u.id !== user.id);
      setPending(next);
      onCountChange?.(next.length);
      setExpandedId(null);
      showToast(`${user.name} approved`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to approve user');
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject(user: PendingUser) {
    if (!confirm(`Reject ${user.name}'s request? They won't be able to log in.`)) return;
    setBusyId(user.id);
    setError(null);
    try {
      await api.rejectPendingUser(user.id);
      const next = pending.filter((u) => u.id !== user.id);
      setPending(next);
      onCountChange?.(next.length);
      showToast(`${user.name} rejected`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to reject user');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div style={styles.card}>
      <h2 style={styles.title}>
        Pending Approvals {pending.length > 0 && <span style={styles.countBadge}>{pending.length}</span>}
      </h2>
      <p style={styles.blurb}>
        New sign-ups and invited users land here. Approve to grant access (assigning a role, home
        location, and teams), or reject to deny it.
      </p>

      {error && <div style={styles.error}>{error}</div>}

      {isLoading ? (
        <p>Loading…</p>
      ) : pending.length === 0 ? (
        <div style={styles.empty}>
          <p>No one is waiting for approval right now.</p>
          <p style={styles.emptyHint}>When someone signs up or accepts an invite, they'll appear here.</p>
        </div>
      ) : (
        <div style={styles.list}>
          {pending.map((user) => (
            <div key={user.id} style={styles.userCard}>
              <div style={styles.userHead}>
                <div>
                  <div style={styles.userName}>{user.name}</div>
                  <div style={styles.userMeta}>{user.email}</div>
                  <div style={styles.userMeta}>
                    {user.invitedBy ? `Invited by ${user.invitedBy.name}` : 'Public sign-up'} ·{' '}
                    {relativeTime(user.createdAt)}
                  </div>
                  {user.bio && <div style={styles.userBio}>“{user.bio}”</div>}
                </div>
                {expandedId !== user.id && (
                  <div style={styles.headActions}>
                    <button onClick={() => openApprove(user)} style={styles.approveBtn} disabled={busyId === user.id}>
                      Approve
                    </button>
                    <button onClick={() => handleReject(user)} style={styles.rejectBtn} disabled={busyId === user.id}>
                      Reject
                    </button>
                  </div>
                )}
              </div>

              {expandedId === user.id && (
                <div style={styles.approveForm}>
                  <div style={styles.formRow}>
                    <div style={styles.formField}>
                      <label style={styles.label}>Role</label>
                      <select value={formRole} onChange={(e) => setFormRole(e.target.value)} style={styles.select}>
                        <option value="MEMBER">Member</option>
                        <option value="CORE_TEAM">Core Team</option>
                        <option value="ADMIN">Admin</option>
                        <option value="EXPO">Expo</option>
                      </select>
                    </div>
                    <div style={styles.formField}>
                      <label style={styles.label}>Home location</label>
                      <select
                        value={formLocationId}
                        onChange={(e) => setFormLocationId(e.target.value)}
                        style={styles.select}
                      >
                        <option value="">Select…</option>
                        {locations.map((loc) => (
                          <option key={loc.id} value={loc.id}>
                            {loc.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div style={styles.formField}>
                    <label style={styles.label}>Teams (optional)</label>
                    {teams.length === 0 ? (
                      <span style={styles.noTeams}>No teams yet — you can assign them later.</span>
                    ) : (
                      <div style={styles.teamChecks}>
                        {teams.map((team) => (
                          <label key={team.id} style={styles.teamCheck}>
                            <input
                              type="checkbox"
                              checked={formTeamIds.includes(team.id)}
                              onChange={() => toggleTeam(team.id)}
                            />
                            {team.name}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={styles.formActions}>
                    <button onClick={() => handleApprove(user)} style={styles.approveBtn} disabled={busyId === user.id}>
                      {busyId === user.id ? 'Approving…' : 'Confirm approval'}
                    </button>
                    <button onClick={() => setExpandedId(null)} style={styles.cancelBtn} disabled={busyId === user.id}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  card: shared.card,
  title: {
    fontSize: '18px',
    fontWeight: '700' as const,
    margin: '0 0 8px',
    color: 'var(--text)',
    display: 'flex',
    alignItems: 'center',
    gap: '9px',
  },
  countBadge: shared.badgeCount,
  blurb: shared.subtitle,
  error: {
    padding: '11px 14px',
    backgroundColor: 'var(--danger-soft)',
    color: 'var(--danger-text)',
    borderRadius: '9px',
    fontSize: '14px',
    marginBottom: '16px',
  },
  empty: {
    textAlign: 'center' as const,
    padding: '32px 20px',
    color: 'var(--text-muted)',
  },
  emptyHint: {
    fontSize: '14px',
    color: 'var(--text-faint)',
    margin: '8px 0 0 0',
  },
  list: shared.list,
  userCard: shared.row,
  userHead: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '12px',
    flexWrap: 'wrap' as const,
  },
  userName: {
    fontSize: '15.5px',
    fontWeight: '700' as const,
    color: 'var(--text)',
  },
  userMeta: {
    fontSize: '12.5px',
    color: 'var(--text-muted)',
    marginTop: '2px',
  },
  userBio: {
    fontSize: '12.5px',
    color: 'var(--text-muted)',
    fontStyle: 'italic' as const,
    marginTop: '6px',
  },
  headActions: shared.rowActions,
  approveBtn: {
    padding: '8px 15px',
    backgroundColor: 'var(--success)',
    color: 'white',
    border: 'none',
    borderRadius: '7px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600' as const,
  },
  rejectBtn: {
    padding: '8px 15px',
    backgroundColor: 'transparent',
    border: '1px solid var(--danger)',
    color: 'var(--danger-text)',
    borderRadius: '7px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600' as const,
  },
  cancelBtn: {
    padding: '9px 18px',
    backgroundColor: 'transparent',
    border: '1px solid var(--border-strong)',
    color: 'var(--text)',
    borderRadius: '7px',
    cursor: 'pointer',
    fontSize: '13.5px',
    fontWeight: '600' as const,
  },
  approveForm: {
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '14px',
  },
  formRow: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap' as const,
  },
  formField: {
    flex: '1 1 180px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
  },
  label: {
    fontSize: '11px',
    fontWeight: '700' as const,
    color: 'var(--text-muted)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  select: {
    padding: '9px 11px',
    border: '1px solid var(--border-strong)',
    borderRadius: '7px',
    fontSize: '14px',
    backgroundColor: 'var(--surface)',
    color: 'var(--text)',
  },
  teamChecks: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '8px',
  },
  teamCheck: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '14px',
    color: 'var(--text)',
  },
  noTeams: {
    fontSize: '13px',
    color: 'var(--text-faint)',
    fontStyle: 'italic' as const,
  },
  formActions: {
    display: 'flex',
    gap: '8px',
  },
};
