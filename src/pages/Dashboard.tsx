import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { TicketsPanel } from '../components/TicketsPanel';
import { ReportsPanel } from '../components/ReportsPanel';
import { EventSummary } from '../components/EventSummary';
import { NotificationBell } from '../components/NotificationBell';

type Tab = 'tickets' | 'reports';

export function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  // Remember the tab across detail-page round trips
  const [activeTab, setActiveTab] = useState<Tab>(
    (sessionStorage.getItem('dashboardTab') as Tab) || 'tickets'
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const canSeeAdminPanel = user?.role === 'ADMIN' || user?.role === 'CORE_TEAM';

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
          <NotificationBell />
          <div style={styles.menuAnchor}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              style={styles.hamburgerBtn}
              aria-label="Menu"
            >
              ☰
            </button>
            {menuOpen && (
              <>
                <div style={styles.menuBackdrop} onClick={() => setMenuOpen(false)} />
                <div style={styles.menuPopover}>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      navigate('/profile');
                    }}
                    style={styles.menuItem}
                  >
                    👤 My Profile
                  </button>
                  {canSeeAdminPanel && (
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        navigate('/admin');
                      }}
                      style={styles.menuItem}
                    >
                      ⚙️ Admin Panel
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={styles.content}>
        {/* AI event brief */}
        <EventSummary />

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
  menuAnchor: {
    position: 'relative' as const,
  },
  hamburgerBtn: {
    padding: '8px 12px',
    backgroundColor: 'transparent',
    border: '1px solid var(--border-strong)',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
    color: 'var(--text)',
    lineHeight: 1,
  },
  menuBackdrop: {
    position: 'fixed' as const,
    inset: 0,
    zIndex: 10,
  },
  menuPopover: {
    position: 'absolute' as const,
    top: 'calc(100% + 4px)',
    right: 0,
    zIndex: 11,
    backgroundColor: 'var(--surface)',
    border: '1px solid var(--border-strong)',
    borderRadius: '6px',
    boxShadow: '0 4px 16px var(--shadow)',
    minWidth: '160px',
    padding: '4px 0',
  },
  menuItem: {
    display: 'block',
    width: '100%',
    textAlign: 'left' as const,
    padding: '10px 14px',
    backgroundColor: 'transparent',
    border: 'none',
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
    gap: '8px',
    marginBottom: '24px',
    borderBottom: '1px solid var(--border-strong)',
  },
  tab: {
    padding: '12px 24px',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '600' as const,
    color: 'var(--text-muted)',
    borderBottom: '3px solid transparent',
    marginBottom: '-1px',
  },
  tabActive: {
    color: '#007bff',
    borderBottomColor: '#007bff',
  },
};
