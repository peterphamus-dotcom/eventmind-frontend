import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import type { Ticket, Location } from '../types';

type SortOption = 'default' | 'recent' | 'urgency';
type StatusFilter = 'ALL' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'ARCHIVED';

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'OPEN', label: 'Open' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'ARCHIVED', label: 'Archived' },
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'default', label: 'Pinned & urgent first' },
  { value: 'recent', label: 'Most recent' },
  { value: 'urgency', label: 'Urgency' },
];

type TicketStats = Record<'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'ARCHIVED', number>;

export function TicketList() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [locationFilter, setLocationFilter] = useState('ALL');
  const [locations, setLocations] = useState<Location[]>([]);

  useEffect(() => {
    loadTickets();
  }, [sortBy, statusFilter, locationFilter]);

  useEffect(() => {
    api
      .getTicketStats()
      .then((res) => setStats(res.data.data || null))
      .catch(() => setStats(null)); // tiles just hide if stats fail
    api
      .listLocations()
      .then((res) => setLocations(res.data.data?.items || []))
      .catch(() => setLocations([])); // dropdown just shows All if this fails
  }, []);

  async function loadTickets() {
    setIsLoading(true);
    setError(null);
    try {
      const filters: Record<string, string> = {};
      if (sortBy !== 'default') filters.sortBy = sortBy;
      if (statusFilter !== 'ALL') filters.status = statusFilter;
      if (locationFilter !== 'ALL') filters.locationId = locationFilter;

      const response = await api.listTickets(1, 100, filters);
      setTickets(response.data.data?.items || []);
      setTotal(response.data.data?.total || 0);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load tickets');
    } finally {
      setIsLoading(false);
    }
  }

  const urgencyColor = (urgency: string) =>
    urgency === 'HIGH' ? '#dc3545' : urgency === 'MEDIUM' ? '#ffc107' : '#28a745';

  const statusColor = (status: string) =>
    status === 'OPEN'
      ? '#007bff'
      : status === 'IN_PROGRESS'
        ? '#ffc107'
        : status === 'RESOLVED'
          ? '#28a745'
          : '#6c757d';

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button onClick={() => navigate('/dashboard')} style={styles.backBtn}>
          ← Back to Dashboard
        </button>
        <h1 style={styles.title}>All Tickets</h1>
      </div>

      <div style={styles.content}>
        {/* Status counters */}
        {stats && (
          <div style={styles.statsRow}>
            {(
              [
                ['OPEN', 'Open'],
                ['IN_PROGRESS', 'In Progress'],
                ['RESOLVED', 'Resolved'],
                ['ARCHIVED', 'Archived'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setStatusFilter(statusFilter === key ? 'ALL' : key)}
                style={{
                  ...styles.statTile,
                  borderColor: statusColor(key),
                  ...(statusFilter === key ? { backgroundColor: '#f0f7ff' } : {}),
                }}
              >
                <span style={{ ...styles.statNumber, color: statusColor(key) }}>
                  {stats[key]}
                </span>
                <span style={styles.statLabel}>{label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Controls */}
        <div style={styles.controls}>
          <div style={styles.sortControl}>
            <label style={styles.sortLabel}>Location</label>
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              style={styles.sortSelect}
            >
              <option value="ALL">All locations</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>
          <div style={styles.sortControl}>
            <label style={styles.sortLabel}>Sort by</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              style={styles.sortSelect}
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        {/* List */}
        {isLoading ? (
          <p style={styles.loading}>Loading tickets...</p>
        ) : tickets.length === 0 ? (
          <p style={styles.empty}>
            {statusFilter === 'ALL'
              ? 'No tickets yet.'
              : `No ${STATUS_FILTERS.find((f) => f.value === statusFilter)?.label.toLowerCase()} tickets.`}
          </p>
        ) : (
          <div style={styles.list}>
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => navigate(`/tickets/${ticket.id}`)}
                style={{
                  ...styles.listItem,
                  borderLeftColor: urgencyColor(ticket.urgency),
                  opacity: ticket.status === 'RESOLVED' || ticket.status === 'ARCHIVED' ? 0.65 : 1,
                }}
              >
                <div style={styles.itemBody}>
                  <h3 style={styles.itemTitle}>{ticket.title}</h3>
                  <div style={styles.itemMeta}>
                    <span
                      style={{ ...styles.badge, backgroundColor: statusColor(ticket.status) }}
                    >
                      {ticket.status.replace(/_/g, ' ')}
                    </span>
                    <span
                      style={{ ...styles.badge, backgroundColor: urgencyColor(ticket.urgency) }}
                    >
                      {ticket.urgency}
                    </span>
                    <span style={styles.metaText}>📍 {ticket.location?.name}</span>
                    <span style={styles.metaText}>
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div style={styles.itemBadge}>
                  {ticket.isPinnedGlobal && '📌'}
                  {ticket.userHasPersonalPin && '⭐'}
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && tickets.length > 0 && (
          <p style={styles.count}>
            Showing {tickets.length} of {total} ticket{total === 1 ? '' : 's'}
          </p>
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
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap' as const,
  },
  backBtn: {
    fontSize: '14px',
    color: '#007bff',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '500' as const,
    padding: 0,
  },
  title: {
    fontSize: 'clamp(18px, 5vw, 24px)',
    fontWeight: 'bold',
    margin: 0,
  },
  content: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: 'clamp(16px, 4vw, 32px)',
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: '12px',
    marginBottom: '20px',
  },
  statTile: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '4px',
    padding: '14px 8px',
    backgroundColor: 'white',
    border: '1px solid',
    borderLeftWidth: '4px',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  statNumber: {
    fontSize: '24px',
    fontWeight: '700' as const,
    lineHeight: 1,
  },
  statLabel: {
    fontSize: '12px',
    color: '#666',
    fontWeight: '600' as const,
  },
  controls: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap' as const,
    marginBottom: '20px',
  },
  sortControl: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  sortLabel: {
    fontSize: '13px',
    color: '#666',
    fontWeight: '600' as const,
    whiteSpace: 'nowrap' as const,
  },
  sortSelect: {
    padding: '8px 10px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    backgroundColor: 'white',
  },
  error: {
    padding: '12px 16px',
    backgroundColor: '#fee',
    color: '#c00',
    borderRadius: '4px',
    fontSize: '14px',
    marginBottom: '16px',
  },
  loading: {
    color: '#666',
  },
  empty: {
    fontSize: '14px',
    color: '#999',
    fontStyle: 'italic',
    padding: '24px 0',
  },
  list: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
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
    gap: '8px',
  },
  itemBody: {
    minWidth: 0,
  },
  itemTitle: {
    fontSize: '15px',
    fontWeight: '600' as const,
    margin: '0 0 8px 0',
    color: '#333',
  },
  itemMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap' as const,
  },
  badge: {
    padding: '3px 8px',
    borderRadius: '10px',
    color: 'white',
    fontSize: '11px',
    fontWeight: '600' as const,
  },
  metaText: {
    fontSize: '12px',
    color: '#666',
  },
  itemBadge: {
    fontSize: '16px',
    flexShrink: 0,
  },
  count: {
    fontSize: '13px',
    color: '#999',
    marginTop: '16px',
  },
};
