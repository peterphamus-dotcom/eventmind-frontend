import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { TicketsPanel } from '../components/TicketsPanel';
import { ReportsPanel } from '../components/ReportsPanel';

type Tab = 'tickets' | 'reports';

export function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  // Remember the tab across detail-page round trips
  const [activeTab, setActiveTab] = useState<Tab>(
    (sessionStorage.getItem('dashboardTab') as Tab) || 'tickets'
  );

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

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>EventMind Dashboard</h1>
        <div style={styles.userInfo}>
          <span>
            {user?.name} ({user?.role})
          </span>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={styles.content}>
        {/* Quick Actions */}
        <div style={styles.actions}>
          <button onClick={() => navigate('/reports/new')} style={styles.actionBtn}>
            + Report Issue
          </button>
          <button onClick={() => navigate('/tickets/new')} style={styles.actionBtn}>
            + Create Ticket
          </button>
          {(user?.role === 'ADMIN' || user?.role === 'CORE_TEAM') && (
            <button onClick={() => navigate('/admin')} style={styles.actionBtn}>
              ⚙️ Admin Panel
            </button>
          )}
        </div>

        {/* Tab switcher */}
        <div style={styles.tabs}>
          <button
            onClick={() => selectTab('tickets')}
            style={{
              ...styles.tab,
              ...(activeTab === 'tickets' ? styles.tabActive : {}),
            }}
          >
            🎫 Tickets
          </button>
          <button
            onClick={() => selectTab('reports')}
            style={{
              ...styles.tab,
              ...(activeTab === 'reports' ? styles.tabActive : {}),
            }}
          >
            📋 Reports
          </button>
        </div>

        {/* Active panel */}
        {activeTab === 'tickets' ? <TicketsPanel /> : <ReportsPanel />}
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
    padding: '16px clamp(16px, 4vw, 40px)',
    borderBottom: '1px solid #eee',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
    gap: '8px',
  },
  title: {
    fontSize: 'clamp(18px, 5vw, 24px)',
    fontWeight: 'bold',
    margin: 0,
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
  },
  content: {
    padding: 'clamp(16px, 4vw, 40px)',
    maxWidth: '1000px',
    margin: '0 auto',
  },
  actions: {
    display: 'flex',
    gap: '12px',
    marginBottom: '24px',
    flexWrap: 'wrap' as const,
  },
  actionBtn: {
    padding: '12px 20px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    flex: '1 1 150px',
    maxWidth: '300px',
  },
  tabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '24px',
    borderBottom: '1px solid #ddd',
  },
  tab: {
    padding: '12px 24px',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '600' as const,
    color: '#666',
    borderBottom: '3px solid transparent',
    marginBottom: '-1px',
  },
  tabActive: {
    color: '#007bff',
    borderBottomColor: '#007bff',
  },
};
