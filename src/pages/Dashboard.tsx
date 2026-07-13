import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { api } from '../api';
import type { Ticket, Report } from '../types';

export function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setIsLoading(true);
    try {
      const [ticketsRes, reportsRes] = await Promise.all([
        api.listTickets(1, 10),
        api.listReports(1, 10),
      ]);
      setTickets(ticketsRes.data.data?.items || []);
      setReports(reportsRes.data.data?.items || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  const memberWithoutTeam =
    user?.role === 'MEMBER' && (!user.teams || user.teams.length === 0);
  const teamHint = memberWithoutTeam
    ? " You're not on a team yet, so you'll only see items you submit — ask an admin to add you to a team to see your team's activity."
    : '';

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>EventMind Dashboard</h1>
        <div style={styles.userInfo}>
          <span>{user?.name} ({user?.role})</span>
          <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
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

        {isLoading ? (
          <p>Loading...</p>
        ) : (
          <>
            {/* Tickets Section */}
            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>Recent Tickets ({tickets.length})</h2>
              <div style={styles.list}>
                {tickets.length === 0 ? (
                  <p style={styles.empty}>
                    No tickets yet — tap “+ Create Ticket” when something needs
                    to be tracked to resolution.{teamHint}
                  </p>
                ) : (
                  tickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      onClick={() => navigate(`/tickets/${ticket.id}`)}
                      style={{
                        ...styles.listItem,
                        borderLeftColor: ticket.urgency === 'HIGH' ? '#dc3545' : ticket.urgency === 'MEDIUM' ? '#ffc107' : '#28a745',
                      }}
                    >
                      <div>
                        <h3 style={styles.itemTitle}>{ticket.title}</h3>
                        <p style={styles.itemMeta}>
                          Status: {ticket.status} | Urgency: {ticket.urgency} | {ticket.location?.name}
                        </p>
                      </div>
                      <div style={styles.itemBadge}>
                        {ticket.isPinnedGlobal && '📌'}
                        {ticket.userHasPersonalPin && '⭐'}
                      </div>
                    </div>
                  ))
                )}
              </div>
              <button onClick={() => navigate('/tickets')} style={styles.viewAllBtn}>
                View All Tickets →
              </button>
            </section>

            {/* Reports Section */}
            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>Recent Reports ({reports.length})</h2>
              <div style={styles.list}>
                {reports.length === 0 ? (
                  <p style={styles.empty}>
                    No reports yet — tap “+ Report Issue” to log something you
                    saw, with a photo.{teamHint}
                  </p>
                ) : (
                  reports.map((report) => (
                    <div
                      key={report.id}
                      onClick={() => navigate(`/reports/${report.id}`)}
                      style={styles.listItem}
                    >
                      <div>
                        <h3 style={styles.itemTitle}>{report.text}</h3>
                        <p style={styles.itemMeta}>
                          By {report.submitter?.name} | {report.location?.name} | {report.photos?.length || 0} photos
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <button onClick={() => navigate('/reports')} style={styles.viewAllBtn}>
                View All Reports →
              </button>
            </section>
          </>
        )}
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
    maxWidth: '1200px',
    margin: '0 auto',
  },
  actions: {
    display: 'flex',
    gap: '12px',
    marginBottom: '32px',
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
  section: {
    marginBottom: '32px',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '16px',
    color: '#333',
  },
  list: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
    marginBottom: '16px',
  },
  listItem: {
    backgroundColor: 'white',
    padding: '16px',
    borderRadius: '4px',
    borderLeft: '4px solid #007bff',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    transition: 'box-shadow 0.2s',
  },
  itemTitle: {
    fontSize: '14px',
    fontWeight: '600',
    margin: '0 0 6px 0',
    color: '#333',
  },
  itemMeta: {
    fontSize: '12px',
    color: '#666',
    margin: 0,
  },
  itemBadge: {
    fontSize: '16px',
    minWidth: '40px',
    textAlign: 'right' as const,
  },
  empty: {
    fontSize: '14px',
    color: '#999',
    padding: '16px',
    fontStyle: 'italic',
  },
  viewAllBtn: {
    fontSize: '14px',
    color: '#007bff',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '500',
    padding: 0,
  },
};
