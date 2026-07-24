import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { api } from '../../api';
import { useToast } from '../../Toast';
import { styles as shared, roleBadge } from '../../components/AdminShared';
import { Modal } from '../../components/Modal';
import type { SignupQrCode, Role, Team, Location } from '../../types';

const ROLE_LABEL: Record<Role, string> = {
  MEMBER: 'Member',
  CORE_TEAM: 'Core Team',
  ADMIN: 'Admin',
  EXPO: 'Expo',
};

function relativeTime(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function joinUrl(token: string): string {
  return `${window.location.origin}/join/${token}`;
}

interface ComposerState {
  label: string;
  suggestedRole: Role | '';
  teamId: string;
  homeLocationId: string;
}

const emptyComposer: ComposerState = { label: '', suggestedRole: '', teamId: '', homeLocationId: '' };

/**
 * Reusable, scannable sign-up QR codes that ADMIN/CORE_TEAM can generate and
 * post/print/hand out (e.g. a recruiting table) as an additional on-ramp
 * alongside email invites and public self-signup. Each code carries an
 * optional suggested role/team/location shown to the joiner as context; the
 * admin still assigns those for real when approving the resulting account.
 */
export default function AdminSignupQr() {
  const showToast = useToast();
  const [codes, setCodes] = useState<SignupQrCode[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [composer, setComposer] = useState<ComposerState | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [composerError, setComposerError] = useState<string | null>(null);

  const [qrDataUrls, setQrDataUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [codesRes, teamsRes, locsRes] = await Promise.all([
        api.listSignupQrCodes(),
        api.listTeams(),
        api.listLocations(),
      ]);
      const items = codesRes.data.data?.items || [];
      setCodes(items);
      setTeams(teamsRes.data.data?.items || []);
      setLocations(locsRes.data.data?.items || []);
      generateQrImages(items);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load sign-up QR codes');
    } finally {
      setLoading(false);
    }
  }

  async function generateQrImages(items: SignupQrCode[]) {
    const entries = await Promise.all(
      items.map(async (c) => [c.id, await QRCode.toDataURL(joinUrl(c.token), { width: 220, margin: 1 })] as const)
    );
    setQrDataUrls(Object.fromEntries(entries));
  }

  async function submit() {
    if (!composer || submitting) return;
    if (!composer.label.trim()) {
      setComposerError('A label is required');
      return;
    }
    setSubmitting(true);
    setComposerError(null);
    try {
      const res = await api.createSignupQrCode({
        label: composer.label.trim(),
        suggestedRole: composer.suggestedRole || undefined,
        teamId: composer.teamId || undefined,
        homeLocationId: composer.homeLocationId || undefined,
      });
      const created = res.data.data!;
      setCodes((prev) => [created, ...prev]);
      const dataUrl = await QRCode.toDataURL(joinUrl(created.token), { width: 220, margin: 1 });
      setQrDataUrls((prev) => ({ ...prev, [created.id]: dataUrl }));
      setComposer(null);
      showToast('Sign-up QR code created');
    } catch (err: any) {
      setComposerError(err.response?.data?.error || 'Failed to create code');
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(code: SignupQrCode) {
    setBusyId(code.id);
    try {
      const res = await api.toggleSignupQrCode(code.id, !code.isActive);
      const updated = res.data.data!;
      setCodes((prev) => prev.map((c) => (c.id === code.id ? updated : c)));
      showToast(updated.isActive ? 'Code reactivated' : 'Code deactivated');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to update code');
    } finally {
      setBusyId(null);
    }
  }

  function copyLink(token: string) {
    navigator.clipboard.writeText(joinUrl(token)).then(
      () => showToast('Link copied'),
      () => showToast('Could not copy link')
    );
  }

  function downloadQr(code: SignupQrCode) {
    const dataUrl = qrDataUrls[code.id];
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `signup-qr-${code.label.toLowerCase().replace(/\s+/g, '-')}.png`;
    a.click();
  }

  return (
    <div style={shared.card}>
      <h2 style={shared.title}>Sign-up QR Codes</h2>
      <p style={shared.subtitle}>
        Reusable sign-up links you can print or share as a QR — an additional on-ramp for new users
        alongside email invites and public sign-up. Suggested role/team/location are shown to the
        joiner as context; you still assign the real values when you approve them.
      </p>

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.addRow}>
        <button onClick={() => { setComposer({ ...emptyComposer }); setComposerError(null); }} style={shared.addBtn}>
          + New QR Code
        </button>
      </div>

      {loading ? (
        <p>Loading…</p>
      ) : codes.length === 0 ? (
        <p style={shared.empty}>No sign-up QR codes yet — create one to get started.</p>
      ) : (
        <div style={shared.list}>
          {codes.map((code) => (
            <div key={code.id} style={{ ...shared.row, ...(code.isActive ? {} : styles.rowInactive) }}>
              <div style={styles.rowLayout}>
                {qrDataUrls[code.id] && (
                  <img src={qrDataUrls[code.id]} alt={`QR code for ${code.label}`} style={styles.qrImg} />
                )}
                <div style={styles.rowBody}>
                  <div style={shared.rowHead}>
                    <div style={styles.labelLine}>
                      <span style={styles.label}>{code.label}</span>
                      <span style={code.isActive ? shared.pillSuccess : shared.pillNeutral}>
                        {code.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div style={shared.rowActions}>
                      <button onClick={() => copyLink(code.token)} style={shared.btnOutline}>
                        Copy link
                      </button>
                      <button onClick={() => downloadQr(code)} style={shared.btnOutline}>
                        Download QR
                      </button>
                      <button
                        onClick={() => toggleActive(code)}
                        style={code.isActive ? shared.btnNeutral : shared.btnSuccess}
                        disabled={busyId === code.id}
                      >
                        {code.isActive ? 'Deactivate' : 'Reactivate'}
                      </button>
                    </div>
                  </div>

                  <div style={styles.scopeRow}>
                    {code.suggestedRole && <span style={roleBadge(code.suggestedRole)}>{ROLE_LABEL[code.suggestedRole]}</span>}
                    {code.team && <span style={shared.pillAccent}>{code.team.name}</span>}
                    {code.homeLocation && <span style={shared.pillAccent}>{code.homeLocation.name}</span>}
                    {!code.suggestedRole && !code.team && !code.homeLocation && (
                      <span style={styles.noScope}>No suggested role/team/location</span>
                    )}
                  </div>

                  <div style={styles.meta}>
                    Created by {code.createdBy.name} · {relativeTime(code.createdAt)} · {code.joinedCount} joined
                  </div>
                  <div style={styles.linkText}>{joinUrl(code.token)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {composer && (
        <Modal title="New Sign-up QR Code" onClose={() => setComposer(null)}>
          {composerError && <div style={styles.error}>{composerError}</div>}

          <div style={styles.field}>
            <label style={styles.fieldLabel}>Label</label>
            <input
              value={composer.label}
              onChange={(e) => setComposer({ ...composer, label: e.target.value })}
              style={shared.input}
              placeholder="e.g. Vendor booth check-in"
              maxLength={100}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.fieldLabel}>Suggested role (optional)</label>
            <select
              value={composer.suggestedRole}
              onChange={(e) => setComposer({ ...composer, suggestedRole: e.target.value as Role | '' })}
              style={shared.select}
            >
              <option value="">No suggestion</option>
              <option value="MEMBER">Member</option>
              <option value="CORE_TEAM">Core Team</option>
              <option value="ADMIN">Admin</option>
              <option value="EXPO">Expo</option>
            </select>
          </div>

          <div style={styles.field}>
            <label style={styles.fieldLabel}>Suggested team (optional)</label>
            <select
              value={composer.teamId}
              onChange={(e) => setComposer({ ...composer, teamId: e.target.value })}
              style={shared.select}
            >
              <option value="">No suggestion</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div style={styles.field}>
            <label style={styles.fieldLabel}>Suggested location (optional)</label>
            <select
              value={composer.homeLocationId}
              onChange={(e) => setComposer({ ...composer, homeLocationId: e.target.value })}
              style={shared.select}
            >
              <option value="">No suggestion</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>

          <button onClick={submit} style={styles.primaryBtn} disabled={submitting}>
            {submitting ? 'Creating…' : 'Create QR code'}
          </button>
        </Modal>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  error: { padding: '11px 14px', backgroundColor: 'var(--danger-soft)', color: 'var(--danger-text)', borderRadius: '9px', fontSize: '14px', marginBottom: '16px' },
  addRow: { marginBottom: '18px' },
  rowInactive: { opacity: 0.6 },
  rowLayout: { display: 'flex', gap: '16px', flexWrap: 'wrap' },
  qrImg: { width: '96px', height: '96px', borderRadius: '8px', border: '1px solid var(--border)', flexShrink: 0 },
  rowBody: { flex: '1 1 260px', minWidth: 0 },
  labelLine: { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' },
  label: { fontSize: '15px', fontWeight: 700, color: 'var(--text)' },
  scopeRow: { display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' },
  noScope: { fontSize: '12px', color: 'var(--text-faint)', fontStyle: 'italic' },
  meta: { fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' },
  linkText: { fontSize: '11.5px', color: 'var(--text-faint)', marginTop: '4px', wordBreak: 'break-all' },
  field: { marginBottom: '14px' },
  fieldLabel: { display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' },
  primaryBtn: { padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: 600, width: '100%' },
};
