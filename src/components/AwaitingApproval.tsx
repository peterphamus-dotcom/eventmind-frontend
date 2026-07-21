import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

interface AwaitingApprovalProps {
  onOpenDisplaySettings: () => void;
}

const ClockIcon = (
  <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto' }}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const RefreshIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="1 4 1 10 7 10" />
    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
  </svg>
);

/** Icons for the "things you can do" rows — all accent-stroked at 20px. */
const actionIconProps = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'var(--accent)',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  style: { flexShrink: 0 },
};

const ProfileIcon = (
  <svg {...actionIconProps}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4 3.5-7 8-7s8 3 8 7" />
  </svg>
);

const DisplayIcon = (
  <svg {...actionIconProps}>
    <rect x="2" y="3" width="20" height="14" rx="2" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
  </svg>
);

const LockIcon = (
  <svg {...actionIconProps}>
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

/** The waiting-room view shown to PENDING users in place of the dashboard tabs.
 * They can tidy up their profile and settings while an admin reviews them. */
export function AwaitingApproval({ onOpenDisplaySettings }: AwaitingApprovalProps) {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);
  const [checkedMsg, setCheckedMsg] = useState<string | null>(null);

  async function checkStatus() {
    setChecking(true);
    setCheckedMsg(null);
    await refreshUser();
    // If still pending after refresh, let them know nothing changed yet.
    setChecking(false);
    setCheckedMsg('Still awaiting approval — we’ll email you the moment you’re in.');
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.hero}>
        {ClockIcon}
        <h2 style={styles.heading}>Awaiting admin approval</h2>
        <p style={styles.sub}>
          Thanks, {user?.name?.split(' ')[0] || 'there'}! Your account is set up. An admin or core-team
          member needs to approve you before you can access the event workspace. You’ll get an email
          and a notification the moment you’re approved.
        </p>
        <button onClick={checkStatus} style={styles.checkBtn} disabled={checking}>
          {RefreshIcon}
          {checking ? 'Checking…' : 'Check approval status'}
        </button>
        {checkedMsg && <p style={styles.checkedMsg}>{checkedMsg}</p>}
      </div>

      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Things you can do while you wait</h3>
        <div style={styles.actions}>
          <button style={styles.action} onClick={() => navigate('/profile')}>
            {ProfileIcon}
            <span>
              <span style={styles.actionLabel}>Complete your profile</span>
              <span style={styles.actionHint}>Add a photo, bio, and contact info so your team recognizes you.</span>
            </span>
          </button>
          <button style={styles.action} onClick={onOpenDisplaySettings}>
            {DisplayIcon}
            <span>
              <span style={styles.actionLabel}>Adjust display settings</span>
              <span style={styles.actionHint}>Pick light or dark mode and how densely lists are shown.</span>
            </span>
          </button>
          <button style={styles.action} onClick={() => navigate('/profile')}>
            {LockIcon}
            <span>
              <span style={styles.actionLabel}>Change your password</span>
              <span style={styles.actionHint}>Update the password you signed up with, from your profile.</span>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  wrap: {
    maxWidth: '640px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '24px',
  },
  hero: {
    textAlign: 'center' as const,
    padding: '32px 20px 24px',
  },
  heading: {
    fontSize: '22px',
    fontWeight: 700,
    color: 'var(--text)',
    margin: '14px 0 10px',
  },
  sub: {
    fontSize: '14.5px',
    color: 'var(--text-muted)',
    lineHeight: 1.6,
    margin: '0 auto 20px',
    maxWidth: '440px',
  },
  checkBtn: {
    padding: '10px 20px',
    backgroundColor: 'var(--accent)',
    color: 'white',
    border: 'none',
    borderRadius: '9px',
    cursor: 'pointer',
    fontSize: '13.5px',
    fontWeight: 600,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '7px',
  },
  checkedMsg: {
    fontSize: '12.5px',
    color: 'var(--text-muted)',
    marginTop: '12px',
  },
  card: {
    backgroundColor: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    boxShadow: '0 1px 2px oklch(0% 0 0 / 0.03), 0 8px 22px oklch(0% 0 0 / 0.045)',
    padding: '22px',
  },
  cardTitle: {
    fontSize: '15px',
    fontWeight: 700,
    color: 'var(--text)',
    margin: '0 0 16px',
  },
  actions: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
  },
  action: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '14px',
    textAlign: 'left' as const,
    padding: '14px',
    border: '1px solid var(--border)',
    borderRadius: '9px',
    backgroundColor: 'var(--bg)',
    cursor: 'pointer',
    width: '100%',
    boxSizing: 'border-box' as const,
  },
  actionLabel: {
    display: 'block',
    fontSize: '14.5px',
    fontWeight: 600,
    color: 'var(--text)',
    marginBottom: '2px',
  },
  actionHint: {
    display: 'block',
    fontSize: '12.5px',
    color: 'var(--text-muted)',
    lineHeight: 1.4,
  },
};
