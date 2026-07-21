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

type AdminTab = 'approvals' | 'users' | 'teams' | 'locations' | 'tags' | 'banner' | 'export' | 'viewAs' | 'reminders' | 'socialIntel' | 'userReports';

export function AdminPanel() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('approvals');
  const [pendingCount, setPendingCount] = useState(0);

  // Badge the Approvals tab with how many people are waiting.
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
        <h1 style={styles.title}>⚙️ Admin Panel</h1>
        <div style={styles.userInfo}>
          <span>{user?.name} ({user?.role})</span>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            Logout
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        <button
          onClick={() => setActiveTab('approvals')}
          style={{
            ...styles.tab,
            ...(activeTab === 'approvals' ? styles.tabActive : {}),
          }}
        >
          ✅ Approvals{pendingCount > 0 ? ` (${pendingCount})` : ''}
        </button>
        <button
          onClick={() => setActiveTab('users')}
          style={{
            ...styles.tab,
            ...(activeTab === 'users' ? styles.tabActive : {}),
          }}
        >
          👥 Users
        </button>
        <button
          onClick={() => setActiveTab('teams')}
          style={{
            ...styles.tab,
            ...(activeTab === 'teams' ? styles.tabActive : {}),
          }}
        >
          🤝 Teams
        </button>
        <button
          onClick={() => setActiveTab('locations')}
          style={{
            ...styles.tab,
            ...(activeTab === 'locations' ? styles.tabActive : {}),
          }}
        >
          📍 Locations
        </button>
        <button
          onClick={() => setActiveTab('tags')}
          style={{
            ...styles.tab,
            ...(activeTab === 'tags' ? styles.tabActive : {}),
          }}
        >
          🏷️ Tags
        </button>
        <button
          onClick={() => setActiveTab('export')}
          style={{
            ...styles.tab,
            ...(activeTab === 'export' ? styles.tabActive : {}),
          }}
        >
          ⬇ Export
        </button>
        <button
          onClick={() => setActiveTab('viewAs')}
          style={{
            ...styles.tab,
            ...(activeTab === 'viewAs' ? styles.tabActive : {}),
          }}
        >
          👁️ View As
        </button>
        <button
          onClick={() => setActiveTab('reminders')}
          style={{
            ...styles.tab,
            ...(activeTab === 'reminders' ? styles.tabActive : {}),
          }}
        >
          ⏰ Reminders
        </button>
        <button
          onClick={() => setActiveTab('socialIntel')}
          style={{
            ...styles.tab,
            ...(activeTab === 'socialIntel' ? styles.tabActive : {}),
          }}
        >
          📡 Social Intel
        </button>
        <button
          onClick={() => setActiveTab('userReports')}
          style={{
            ...styles.tab,
            ...(activeTab === 'userReports' ? styles.tabActive : {}),
          }}
        >
          🚩 User Reports
        </button>
        {user?.role === 'ADMIN' && (
          <button
            onClick={() => setActiveTab('banner')}
            style={{
              ...styles.tab,
              ...(activeTab === 'banner' ? styles.tabActive : {}),
            }}
          >
            📢 Banner
          </button>
        )}
      </div>

      {/* Content */}
      <div style={styles.content}>
        {activeTab === 'approvals' && <AdminApprovals />}
        {activeTab === 'users' && <AdminUsers />}
        {activeTab === 'teams' && <AdminTeams />}
        {activeTab === 'locations' && <AdminLocations />}
        {activeTab === 'tags' && <AdminTags />}
        {activeTab === 'export' && <AdminExport />}
        {activeTab === 'viewAs' && <AdminViewAs />}
        {activeTab === 'reminders' && <AdminReminders />}
        {activeTab === 'socialIntel' && <AdminSocialIntel />}
        {activeTab === 'userReports' && <AdminUserReports />}
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
    gap: '8px',
  },
  title: {
    fontSize: 'clamp(20px, 5vw, 28px)',
    fontWeight: 'bold',
    margin: 0,
    color: 'var(--text)',
  },
  userInfo: {
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
    fontSize: '14px',
    flexWrap: 'wrap' as const,
  },
  logoutBtn: {
    padding: '8px 16px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500' as const,
  },
  tabs: {
    display: 'flex',
    gap: '0',
    backgroundColor: 'var(--surface)',
    borderBottom: '1px solid var(--border-strong)',
    padding: '0 clamp(8px, 3vw, 40px)',
    overflowX: 'auto' as const,
  },
  tab: {
    padding: '16px clamp(12px, 3vw, 24px)',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500' as const,
    color: 'var(--text-muted)',
    borderBottom: '3px solid transparent',
    transition: 'all 0.2s',
    whiteSpace: 'nowrap' as const,
  },
  tabActive: {
    color: '#007bff',
    borderBottomColor: '#007bff',
  },
  content: {
    maxWidth: '1200px',
    margin: 'clamp(16px, 4vw, 40px) auto',
    padding: '0 clamp(12px, 3vw, 20px)',
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
    backgroundColor: '#007bff',
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
    color: '#007bff',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '500' as const,
  },
};
