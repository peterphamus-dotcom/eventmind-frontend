import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { TicketsPanel } from '../components/TicketsPanel';
import { ReportsPanel } from '../components/ReportsPanel';
import { FloorplanPanel } from '../components/FloorplanPanel';
import { LibraryPanel } from '../components/LibraryPanel';
import { SchedulePanel } from '../components/SchedulePanel';
import { EventSummary } from '../components/EventSummary';
import { NotificationBell } from '../components/NotificationBell';
import { AboutModal } from '../components/AboutModal';
import { FeedbackModal } from '../components/FeedbackModal';
import { DisplaySettingsModal } from '../components/DisplaySettingsModal';
import { InviteModal } from '../components/InviteModal';
import { AwaitingApproval } from '../components/AwaitingApproval';

type Tab = 'tickets' | 'reports' | 'floorplan' | 'library' | 'schedule';

/** Line icons at the two sizes the shell uses: 16px in menus and tabs, 17px in header buttons. */
function Icon({ size = 16, children }: { size?: number; children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0 }}
    >
      {children}
    </svg>
  );
}

const paths = {
  hamburger: (
    <>
      <line x1="4" y1="7" x2="20" y2="7" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="17" x2="20" y2="17" />
    </>
  ),
  profile: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.5-7 8-7s8 3 8 7" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </>
  ),
  cog: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </>
  ),
  sliders: (
    <>
      <line x1="4" y1="21" x2="4" y2="14" />
      <line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" />
      <line x1="20" y1="12" x2="20" y2="3" />
      <line x1="1" y1="14" x2="7" y2="14" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="17" y1="16" x2="23" y2="16" />
    </>
  ),
  message: (
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </>
  ),
  ticket: (
    <path d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4z" />
  ),
  report: (
    <>
      <rect x="6" y="4" width="12" height="16" rx="2" />
      <line x1="9" y1="10" x2="15" y2="10" />
      <line x1="9" y1="14" x2="15" y2="14" />
    </>
  ),
  floorplan: (
    <>
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
      <line x1="8" y1="2" x2="8" y2="18" />
      <line x1="16" y1="6" x2="16" y2="22" />
    </>
  ),
  library: (
    <>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </>
  ),
  schedule: (
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </>
  ),
};

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'tickets', label: 'Tickets', icon: paths.ticket },
  { id: 'reports', label: 'Reports', icon: paths.report },
  { id: 'floorplan', label: 'Floorplan', icon: paths.floorplan },
  { id: 'library', label: 'Library', icon: paths.library },
  { id: 'schedule', label: 'Schedule', icon: paths.schedule },
];

/** MEMBER -> Member, CORE_TEAM -> Core Team */
function formatRole(role?: string) {
  if (!role) return '';
  return role
    .split('_')
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' ');
}

export function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  // Remember the tab across detail-page round trips
  const [activeTab, setActiveTab] = useState<Tab>(
    (sessionStorage.getItem('dashboardTab') as Tab) || 'tickets'
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [displaySettingsOpen, setDisplaySettingsOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const isActive = user?.status === 'ACTIVE';
  const isPending = !!user && user.status !== 'ACTIVE';
  const canSeeAdminPanel = isActive && (user?.role === 'ADMIN' || user?.role === 'CORE_TEAM');

  function selectTab(tab: Tab) {
    setActiveTab(tab);
    sessionStorage.setItem('dashboardTab', tab);
  }

  async function handleLogout() {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  /** Menu rows share their chrome; only the icon, label, and action differ. */
  function menuItem(icon: React.ReactNode, label: string, onClick: () => void) {
    return (
      <button
        onClick={() => {
          setMenuOpen(false);
          onClick();
        }}
        style={styles.menuItem}
      >
        <Icon>{icon}</Icon>
        {label}
      </button>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>EventMind Dashboard</h1>
        <div style={styles.userInfo}>
          <span style={styles.userName}>
            {user?.name} <span style={styles.userRole}>({formatRole(user?.role)})</span>
          </span>
          <NotificationBell />
          <div style={styles.menuAnchor}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              style={styles.iconBtn}
              aria-label="Menu"
            >
              <Icon size={17}>{paths.hamburger}</Icon>
            </button>
            {menuOpen && (
              <>
                <div style={styles.menuBackdrop} onClick={() => setMenuOpen(false)} />
                <div style={styles.menuPopover}>
                  {menuItem(paths.profile, 'My Profile', () => navigate('/profile'))}
                  {isActive && menuItem(paths.mail, 'Invite Someone', () => setInviteOpen(true))}
                  {canSeeAdminPanel &&
                    menuItem(paths.sliders, 'Admin Panel', () => navigate('/admin'))}
                  {menuItem(paths.cog, 'Display Settings', () => setDisplaySettingsOpen(true))}
                  {menuItem(paths.message, 'Feedback', () => setFeedbackOpen(true))}
                  {menuItem(paths.info, 'About', () => setAboutOpen(true))}
                </div>
              </>
            )}
          </div>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            Logout
          </button>
        </div>
      </div>

      {feedbackOpen && <FeedbackModal onClose={() => setFeedbackOpen(false)} />}
      {aboutOpen && <AboutModal onClose={() => setAboutOpen(false)} />}
      {displaySettingsOpen && <DisplaySettingsModal onClose={() => setDisplaySettingsOpen(false)} />}
      {inviteOpen && <InviteModal onClose={() => setInviteOpen(false)} />}

      {/* Pending users get the waiting room instead of the app tabs */}
      {isPending ? (
        <div style={styles.content}>
          <AwaitingApproval onOpenDisplaySettings={() => setDisplaySettingsOpen(true)} />
        </div>
      ) : (
        <div style={styles.content}>
          {/* AI event brief */}
          <EventSummary />

          {/* Tab switcher */}
          <div style={styles.tabs}>
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => selectTab(tab.id)}
                style={{
                  ...styles.tab,
                  ...(activeTab === tab.id ? styles.tabActive : {}),
                }}
              >
                <Icon>{tab.icon}</Icon>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Active panel */}
          {activeTab === 'tickets' && <TicketsPanel />}
          {activeTab === 'reports' && <ReportsPanel />}
          {activeTab === 'floorplan' && <FloorplanPanel />}
          {activeTab === 'library' && <LibraryPanel />}
          {activeTab === 'schedule' && <SchedulePanel />}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: 'var(--bg)',
  },
  header: {
    backgroundColor: 'var(--surface)',
    padding: '16px clamp(16px, 4vw, 40px)',
    borderBottom: '1px solid var(--border)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
    gap: '10px',
  },
  title: {
    fontSize: 'clamp(18px, 3vw, 21px)',
    fontWeight: 700,
    margin: 0,
    letterSpacing: '-0.01em',
  },
  userInfo: {
    display: 'flex',
    gap: '14px',
    alignItems: 'center',
    fontSize: '14px',
    flexWrap: 'wrap' as const,
  },
  userName: {
    color: 'var(--text-muted)',
  },
  userRole: {
    color: 'var(--text-faint)',
  },
  logoutBtn: {
    padding: '8px 15px',
    backgroundColor: 'var(--danger-soft)',
    color: 'var(--danger-text)',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13.5px',
    fontWeight: 600,
  },
  menuAnchor: {
    position: 'relative' as const,
  },
  iconBtn: {
    padding: '8px 10px',
    backgroundColor: 'transparent',
    border: '1px solid var(--border-strong)',
    borderRadius: '8px',
    cursor: 'pointer',
    color: 'var(--text)',
    display: 'flex',
    alignItems: 'center',
  },
  menuBackdrop: {
    position: 'fixed' as const,
    inset: 0,
    zIndex: 10,
  },
  menuPopover: {
    position: 'absolute' as const,
    top: 'calc(100% + 6px)',
    right: 0,
    zIndex: 11,
    backgroundColor: 'var(--surface)',
    border: '1px solid var(--border-strong)',
    borderRadius: '10px',
    boxShadow: '0 4px 20px oklch(0% 0 0 / 0.1)',
    minWidth: '190px',
    padding: '6px',
  },
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    width: '100%',
    textAlign: 'left' as const,
    padding: '9px 12px',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '7px',
    cursor: 'pointer',
    fontSize: '14px',
    color: 'var(--text)',
    whiteSpace: 'nowrap' as const,
  },
  content: {
    padding: 'clamp(16px, 4vw, 40px)',
    maxWidth: '1000px',
    margin: '0 auto',
  },
  tabs: {
    display: 'flex',
    gap: '6px',
    marginBottom: '24px',
    borderBottom: '1px solid var(--border-strong)',
    overflowX: 'auto' as const,
  },
  tab: {
    display: 'flex',
    alignItems: 'center',
    gap: '7px',
    padding: '12px 18px',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    fontSize: '14.5px',
    fontWeight: 600,
    color: 'var(--text-muted)',
    borderBottom: '2px solid transparent',
    marginBottom: '-1px',
    whiteSpace: 'nowrap' as const,
  },
  tabActive: {
    color: 'var(--accent)',
    borderBottomColor: 'var(--accent)',
  },
};
