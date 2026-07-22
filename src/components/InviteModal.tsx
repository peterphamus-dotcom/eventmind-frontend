import { useEffect, useState } from 'react';
import { Modal } from './Modal';
import { api } from '../api';
import { useToast } from '../Toast';
import { useAuth } from '../AuthContext';
import type { Team, Location } from '../types';

interface InviteModalProps {
  onClose: () => void;
}

/** Any approved user can invite someone by email; the invitee sets up their
 * own account and then awaits admin approval. Team/location are optional —
 * purely context for the acceptance page ("you're joining X"); the admin
 * still assigns them for real at approval time. GET /teams is gated to
 * ADMIN/CORE_TEAM (it exposes member emails), so the team picker only shows
 * for those roles; the location picker is open to everyone. */
export function InviteModal({ onClose }: InviteModalProps) {
  const { user } = useAuth();
  const showToast = useToast();
  const canSeeTeams = user?.role === 'ADMIN' || user?.role === 'CORE_TEAM';
  const [email, setEmail] = useState('');
  const [teamId, setTeamId] = useState('');
  const [homeLocationId, setHomeLocationId] = useState('');
  const [teams, setTeams] = useState<Team[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (canSeeTeams) {
      api.listTeams().then((res) => setTeams(res.data.data?.items || []));
    }
    api.listLocations().then((res) => setLocations(res.data.data?.items || []));
  }, [canSeeTeams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const res = await api.sendInvite(email.trim(), teamId || undefined, homeLocationId || undefined);
      showToast(res.data.data?.message || 'Invite sent');
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send invite. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal title="Invite someone" onClose={onClose}>
      <p style={styles.blurb}>
        Enter their email and we’ll send a link to set up an account. They’ll join the pending
        list until an admin approves them.
      </p>

      {error && <div style={styles.error}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@example.com"
          style={styles.input}
          disabled={isSubmitting}
          autoFocus
        />

        {canSeeTeams && (
          <>
            <label style={styles.label}>Team (optional)</label>
            <select
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              style={styles.select}
              disabled={isSubmitting}
            >
              <option value="">No team</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </>
        )}

        <label style={styles.label}>Location (optional)</label>
        <select
          value={homeLocationId}
          onChange={(e) => setHomeLocationId(e.target.value)}
          style={styles.select}
          disabled={isSubmitting}
        >
          <option value="">No location</option>
          {locations.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>

        <button type="submit" style={styles.submitBtn} disabled={isSubmitting || !email.trim()}>
          {isSubmitting ? 'Sending…' : 'Send invite'}
        </button>
      </form>
    </Modal>
  );
}

const styles = {
  blurb: {
    fontSize: '14px',
    color: 'var(--text-muted)',
    margin: '0 0 16px 0',
    lineHeight: 1.5,
  },
  error: {
    padding: '10px 14px',
    backgroundColor: 'var(--danger-bg)',
    color: 'var(--danger-text)',
    borderRadius: '4px',
    fontSize: '13px',
    marginBottom: '14px',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid var(--border-strong)',
    borderRadius: '4px',
    backgroundColor: 'var(--input-bg)',
    color: 'var(--text)',
    fontSize: '14px',
    boxSizing: 'border-box' as const,
    marginBottom: '14px',
  },
  label: {
    display: 'block',
    fontSize: '12.5px',
    fontWeight: '600' as const,
    color: 'var(--text-muted)',
    marginBottom: '6px',
  },
  select: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid var(--border-strong)',
    borderRadius: '4px',
    backgroundColor: 'var(--input-bg)',
    color: 'var(--text)',
    fontSize: '14px',
    boxSizing: 'border-box' as const,
    marginBottom: '14px',
  },
  submitBtn: {
    padding: '10px 20px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600' as const,
    width: '100%',
  },
};
