import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { api } from '../api';
import AdminApprovals from './admin/AdminApprovals';
import AdminUsers from './admin/AdminUsers';
import AdminLocations from './admin/AdminLocations';
import AdminTags from './admin/AdminTags';
import AdminTeams from './admin/AdminTeams';
import AdminBanner from './admin/AdminBanner';
import AdminExport from './admin/AdminExport';
import AdminViewAs from './admin/AdminViewAs';
import AdminReminders from './admin/AdminReminders';
import AdminSocialIntel from './admin/AdminSocialIntel';
import AdminUserReports from './admin/AdminUserReports';
import AdminContentReports from './admin/AdminContentReports';

type AdminTab = 'approvals' | 'users' | 'teams' | 'locations' | 'tags' | 'banner' | 'export' | 'viewAs' | 'reminders' | 'socialIntel' | 'userReports' | 'contentReports';

const GearIcon = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const TABS: { id: AdminTab; label: string; adminOnly?: boolean }[] = [
  { id: 'approvals', label: 'Approvals' },
  { id: 'users', label: 'Users' },
  { id: 'teams', label: 'Teams' },
  { id: 'locations', label: 'Locations' },
  { id: 'tags', label: 'Tags' },
  { id: 'export', label: 'Export' },
  { id: 'viewAs', label: 'View As' },
  { id: 'reminders', label: 'Reminders' },
  { id: 'socialIntel', label: 'Social Intel' },
  { id: 'userReports', label: 'User Reports' },
  { id: 'contentReports', label: 'Content Reports' },
  { id: 'banner', label: 'Banner', adminOnly: true },
];

/** MEMBER -> Member, CORE_TEAM -> Core Team */
function formatRole(role?: string) {
  if (!role) return '';
  return role
    .split('_')
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' ');
}

export function AdminPanel() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('approvals');
  const [pendingCount, setPendingCount] = useState(0);

  // Badge the Approvals tab with how many people are waiting. This fetch keeps
  // the badge right while the admin is on other tabs; once the Approvals panel
  // is open it reports its own count via onCountChange, so approving or
  // rejecting updates the badge immediately rather than on the next tab switch.
  useEffect(() => {
    let active = true;
    api
      .listPendingUsers()
      .then((res) => {
        if (active) setPendingCount(res.data.data?.total || 0);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [activeTab]);

  if (user?.role !== 'ADMIN' && user?.role !== 'CORE_TEAM') {
    return (
      <div style={styles.container}>
        <div style={styles.error}>
          <h2>Access Denied</h2>
          <p>Only administrators can access this page.</p>
          <button onClick={() => navigate('/dashboard')} style={styles.btn}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  async function handleLogout() {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>
          {GearIcon}
          Admin Panel
        </h1>
        <div style={styles.userInfo}>
          <span style={styles.userName}>
            {user?.name} <span style={styles.userRole}>({formatRole(user?.role)})</span>
          </span>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            Logout
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        {TABS.filter((tab) => !tab.adminOnly || user?.role === 'ADMIN').map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              ...styles.tab,
              ...(activeTab === tab.id ? styles.tabActive : {}),
            }}
          >
            {tab.label}
            {tab.id === 'approvals' && pendingCount > 0 && (
              <span style={styles.badge}>{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={styles.content}>
        {activeTab === 'approvals' && <AdminApprovals onCountChange={setPendingCount} />}
        {activeTab === 'users' && <AdminUsers />}
        {activeTab === 'teams' && <AdminTeams />}
        {activeTab === 'locations' && <AdminLocations />}
        {activeTab === 'tags' && <AdminTags />}
        {activeTab === 'export' && <AdminExport />}
        {activeTab === 'viewAs' && <AdminViewAs />}
        {activeTab === 'reminders' && <AdminReminders />}
        {activeTab === 'socialIntel' && <AdminSocialIntel />}
        {activeTab === 'userReports' && <AdminUserReports />}
        {activeTab === 'contentReports' && <AdminContentReports />}
        {activeTab === 'banner' && <AdminBanner />}
      </div>

      {/* Footer */}
      <div style={styles.footer}>
        <button onClick={() => navigate('/dashboard')} style={styles.backBtn}>
          ← Back to Dashboard
        </button>
      </div>
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
    fontSize: 'clamp(20px, 3vw, 24px)',
    fontWeight: 700,
    margin: 0,
    letterSpacing: '-0.01em',
    display: 'flex',
    alignItems: 'center',
    gap: '9px',
    color: 'var(--text)',
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
  tabs: {
    display: 'flex',
    gap: '2px',
    backgroundColor: 'var(--surface)',
    borderBottom: '1px solid var(--border-strong)',
    padding: '0 clamp(16px, 4vw, 40px)',
    overflowX: 'auto' as const,
  },
  tab: {
    padding: '16px clamp(12px, 3vw, 24px)',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    color: 'var(--text-muted)',
    // Longhand: React warns when a shorthand and its longhand are swapped
    // across renders, which is exactly what tabActive does below.
    borderBottomWidth: '3px',
    borderBottomStyle: 'solid' as const,
    borderBottomColor: 'transparent',
    transition: 'all 0.2s',
    whiteSpace: 'nowrap' as const,
  },
  tabActive: {
    color: 'var(--accent)',
    borderBottomColor: 'var(--accent)',
  },
  badge: {
    marginLeft: '6px',
    backgroundColor: 'var(--accent)',
    color: 'white',
    borderRadius: '999px',
    padding: '1px 7px',
    fontSize: '11px',
    fontWeight: 700,
  },
  content: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: 'clamp(16px, 4vw, 36px) clamp(16px, 3vw, 20px)',
  },
  error: {
    maxWidth: '600px',
    margin: '80px auto',
    padding: '40px',
    backgroundColor: 'var(--surface)',
    borderRadius: '8px',
    textAlign: 'center' as const,
  },
  btn: {
    padding: '10px 20px',
    backgroundColor: 'var(--accent)',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    marginTop: '20px',
  },
  footer: {
    padding: '40px',
    textAlign: 'center' as const,
  },
  backBtn: {
    fontSize: '14px',
    color: 'var(--accent)',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 500,
  },
};
