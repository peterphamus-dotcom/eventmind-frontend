import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import AdminUsers from './admin/AdminUsers';
import AdminLocations from './admin/AdminLocations';
import AdminTags from './admin/AdminTags';

type AdminTab = 'users' | 'locations' | 'tags';

export function AdminPanel() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('users');

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
          onClick={() => setActiveTab('users')}
          style={{
            ...styles.tab,
            ...(activeTab === 'users' ? styles.tabActive : {}),
          }}
        >
          👥 Users
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
      </div>

      {/* Content */}
      <div style={styles.content}>
        {activeTab === 'users' && <AdminUsers />}
        {activeTab === 'locations' && <AdminLocations />}
        {activeTab === 'tags' && <AdminTags />}
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
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    padding: '20px 40px',
    borderBottom: '1px solid #eee',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    margin: 0,
    color: '#333',
  },
  userInfo: {
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
    fontSize: '14px',
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
    backgroundColor: 'white',
    borderBottom: '1px solid #ddd',
    padding: '0 40px',
  },
  tab: {
    padding: '16px 24px',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500' as const,
    color: '#666',
    borderBottom: '3px solid transparent',
    transition: 'all 0.2s',
  },
  tabActive: {
    color: '#007bff',
    borderBottomColor: '#007bff',
  },
  content: {
    maxWidth: '1200px',
    margin: '40px auto',
    padding: '0 20px',
  },
  error: {
    maxWidth: '600px',
    margin: '80px auto',
    padding: '40px',
    backgroundColor: 'white',
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
