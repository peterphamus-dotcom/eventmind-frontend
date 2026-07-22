import { useState, useEffect } from 'react';
import { api } from '../../api';
import { styles as shared } from '../../components/AdminShared';
import type { Reminder, ReminderTargetType, User, Team, Location } from '../../types';

const PRESETS = [
  { label: 'Every 30 minutes', minutes: 30 },
  { label: 'Every hour', minutes: 60 },
  { label: 'Every 2 hours', minutes: 120 },
  { label: 'Custom (hours)', minutes: -1 },
];

function formatInterval(minutes: number): string {
  if (minutes % 60 === 0) {
    const hours = minutes / 60;
    return `every ${hours} hour${hours === 1 ? '' : 's'}`;
  }
  return `every ${minutes} minutes`;
}

function relativeTime(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export default function AdminReminders() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [allLocations, setAllLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [targetType, setTargetType] = useState<ReminderTargetType>('USER');
  const [targetId, setTargetId] = useState('');
  const [presetMinutes, setPresetMinutes] = useState(60);
  const [customHours, setCustomHours] = useState('4');
  const [isCreating, setIsCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setIsLoading(true);
    setError(null);
    try {
      const [remindersRes, usersRes, teamsRes, locationsRes] = await Promise.all([
        api.listReminders(),
        api.listUsers(1, 100),
        api.listTeams(),
        api.listLocations(),
      ]);
      setReminders(remindersRes.data.data?.items || []);
      setAllUsers(usersRes.data.data?.items || []);
      setAllTeams(teamsRes.data.data?.items || []);
      setAllLocations(locationsRes.data.data?.items || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load reminders');
    } finally {
      setIsLoading(false);
    }
  }

  function targetOptions() {
    if (targetType === 'USER') return allUsers.map((u) => ({ id: u.id, label: `${u.name} (${u.email})` }));
    if (targetType === 'TEAM') return allTeams.map((t) => ({ id: t.id, label: t.name }));
    return allLocations.map((l) => ({ id: l.id, label: l.name }));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!targetId) {
      setError('Please choose a target');
      return;
    }
    const intervalMinutes =
      presetMinutes === -1 ? Math.round(parseFloat(customHours || '0') * 60) : presetMinutes;
    if (!intervalMinutes || intervalMinutes < 15) {
      setError('Custom interval must be at least 15 minutes (0.25 hours)');
      return;
    }

    setIsCreating(true);
    setError(null);
    try {
      const data: any = { targetType, intervalMinutes };
      if (targetType === 'USER') data.userId = targetId;
      else if (targetType === 'TEAM') data.teamId = targetId;
      else data.locationId = targetId;

      const res = await api.createReminder(data);
      setReminders([res.data.data!, ...reminders]);
      setTargetId('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create reminder');
    } finally {
      setIsCreating(false);
    }
  }

  async function handleToggleActive(reminder: Reminder) {
    setBusyId(reminder.id);
    setError(null);
    try {
      const res = await api.updateReminder(reminder.id, { isActive: !reminder.isActive });
      setReminders(reminders.map((r) => (r.id === reminder.id ? res.data.data! : r)));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update reminder');
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this reminder schedule?')) return;
    setBusyId(id);
    setError(null);
    try {
      await api.deleteReminder(id);
      setReminders(reminders.filter((r) => r.id !== id));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete reminder');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div style={styles.card}>
      <h2 style={styles.title}>Report Reminders</h2>
      <p style={styles.subtitle}>
        Set up a recurring schedule requiring a report from a user, team, or location. Assignees and
        admins/core team get notified — repeating every interval — until a matching report comes in.
      </p>

      {error && <div style={styles.error}>{error}</div>}

      {/* Create Form */}
      <form onSubmit={handleCreate} style={styles.form}>
        <div style={styles.formRow}>
          <select
            value={targetType}
            onChange={(e) => {
              setTargetType(e.target.value as ReminderTargetType);
              setTargetId('');
            }}
            style={styles.select}
            disabled={isCreating}
          >
            <option value="USER">User</option>
            <option value="TEAM">Team</option>
            <option value="LOCATION">Location</option>
          </select>

          <select
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            style={{ ...styles.select, flex: 1 }}
            disabled={isCreating}
          >
            <option value="">Select {targetType.toLowerCase()}...</option>
            {targetOptions().map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>

          <select
            value={presetMinutes}
            onChange={(e) => setPresetMinutes(parseInt(e.target.value, 10))}
            style={styles.select}
            disabled={isCreating}
          >
            {PRESETS.map((p) => (
              <option key={p.label} value={p.minutes}>
                {p.label}
              </option>
            ))}
          </select>

          {presetMinutes === -1 && (
            <input
              type="number"
              min="0.25"
              step="0.25"
              value={customHours}
              onChange={(e) => setCustomHours(e.target.value)}
              style={styles.customInput}
              disabled={isCreating}
              placeholder="hours"
            />
          )}

          <button type="submit" style={styles.btnPrimary} disabled={isCreating}>
            {isCreating ? 'Creating...' : '+ Add Reminder'}
          </button>
        </div>
      </form>

      {/* Reminders List */}
      {isLoading ? (
        <p>Loading reminders...</p>
      ) : reminders.length === 0 ? (
        <p style={styles.empty}>No reminders yet. Create one above.</p>
      ) : (
        <div style={styles.list}>
          {reminders.map((r) => (
            <div key={r.id} style={styles.reminderCard}>
              <div style={styles.reminderMain}>
                <div style={styles.reminderHeader}>
                  <span style={styles.typeBadge}>{r.targetType}</span>
                  <span style={styles.targetName}>{r.targetName}</span>
                  {r.isOverdue && <span style={styles.overdueBadge}>OVERDUE</span>}
                  {!r.isActive && <span style={styles.pausedBadge}>PAUSED</span>}
                </div>
                <div style={styles.reminderMeta}>
                  {formatInterval(r.intervalMinutes)} · last report {relativeTime(r.lastFulfilledAt)} · created
                  by {r.createdBy.name}
                </div>
              </div>
              <div style={styles.reminderActions}>
                <button
                  onClick={() => handleToggleActive(r)}
                  style={r.isActive ? styles.btnPause : styles.btnResume}
                  disabled={busyId === r.id}
                >
                  {r.isActive ? 'Pause' : 'Resume'}
                </button>
                <button
                  onClick={() => handleDelete(r.id)}
                  style={styles.btnDelete}
                  disabled={busyId === r.id}
                >
                  Delete
                </button>
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
  title: shared.titleTight,
  subtitle: shared.subtitle,
  error: {
    padding: '11px 14px',
    backgroundColor: 'var(--danger-soft)',
    color: 'var(--danger-text)',
    borderRadius: '9px',
    fontSize: '14px',
    marginBottom: '16px',
  },
  form: {
    marginBottom: '20px',
  },
  formRow: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap' as const,
    alignItems: 'center',
  },
  select: shared.select,
  customInput: {
    width: '90px',
    padding: '9px 12px',
    border: '1px solid var(--border-strong)',
    borderRadius: '8px',
    fontSize: '13.5px',
    backgroundColor: 'var(--surface)',
    color: 'var(--text)',
  },
  btnPrimary: {
    padding: '9px 18px',
    backgroundColor: 'var(--success)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600' as const,
    whiteSpace: 'nowrap' as const,
  },
  list: shared.list,
  reminderCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    padding: '13px 15px',
    backgroundColor: 'var(--bg)',
    borderRadius: '9px',
    border: '1px solid var(--border)',
    flexWrap: 'wrap' as const,
  },
  reminderMain: {
    flex: 1,
    minWidth: '200px',
  },
  reminderHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '4px',
    flexWrap: 'wrap' as const,
  },
  typeBadge: {
    padding: '2px 8px',
    backgroundColor: 'var(--accent-soft)',
    color: 'var(--accent-text)',
    borderRadius: '10px',
    fontSize: '11px',
    fontWeight: '700' as const,
  },
  targetName: {
    fontSize: '14px',
    fontWeight: '600' as const,
    color: 'var(--text)',
  },
  overdueBadge: shared.pillDanger,
  pausedBadge: {
    padding: '2px 8px',
    backgroundColor: 'var(--neutral)',
    color: 'white',
    borderRadius: '10px',
    fontSize: '10.5px',
    fontWeight: '700' as const,
  },
  reminderMeta: {
    fontSize: '11.5px',
    color: 'var(--text-faint)',
  },
  reminderActions: {
    display: 'flex',
    gap: '8px',
  },
  btnPause: shared.btnNeutral,
  btnResume: shared.btnPrimary,
  btnDelete: shared.btnDanger,
  empty: shared.empty,
};
