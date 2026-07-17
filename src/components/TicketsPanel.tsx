import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, photoSrc } from '../api';
import { useAuth } from '../AuthContext';
import { LocationFilter } from './LocationFilter';
import { CollapsibleSection } from './CollapsibleSection';
import { SearchBar } from './SearchBar';
import type { Ticket, Location } from '../types';

const DEFAULT_VISIBLE_COUNT = 10;

type SortOption = 'urgency' | 'recent';
type StatusFilter = 'ALL' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'ARCHIVED';

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'OPEN', label: 'Open' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'ARCHIVED', label: 'Archived' },
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'urgency', label: 'Most urgent' },
  { value: 'recent', label: 'Most recent' },
];

type TicketStats = Record<'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'ARCHIVED', number>;

/** The full ticket list experience (counters, filters, sort, thumbnails)
 *  without a page header — embeddable in the dashboard or a standalone page. */
export function TicketsPanel() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isCompact = user?.viewDensity === 'COMPACT';
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('urgency');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [selectedLocationIds, setSelectedLocationIds] = useState<string[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showAllRest, setShowAllRest] = useState(false);

  // Debounce the search box so we don't fire a request on every keystroke
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(id);
  }, [search]);

  const locationKey = selectedLocationIds.join(',');
  useEffect(() => {
    loadTickets();
    setShowAllRest(false);
  }, [sortBy, statusFilter, locationKey, debouncedSearch]);

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
      const filters: Record<string, string> = { sortBy };
      if (statusFilter !== 'ALL') filters.status = statusFilter;
      if (selectedLocationIds.length > 0) filters.locationId = selectedLocationIds.join(',');
      if (debouncedSearch) filters.search = debouncedSearch;

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

  const renderTicket = (ticket: Ticket) => (
    <div
      key={ticket.id}
      onClick={() => navigate(`/tickets/${ticket.id}`)}
      style={{
        ...styles.listItem,
        ...(isCompact ? styles.listItemCompact : {}),
        borderLeftColor: urgencyColor(ticket.urgency),
        opacity: ticket.status === 'RESOLVED' || ticket.status === 'ARCHIVED' ? 0.65 : 1,
      }}
    >
      {!isCompact && ticket.photos && ticket.photos.length > 0 && (
        <img
          src={photoSrc(ticket.photos[0].url)}
          alt=""
          loading="lazy"
          style={styles.thumb}
          onError={(e) => {
            // Pre-R2 photos lived on ephemeral disk and are gone
            e.currentTarget.style.display = 'none';
          }}
        />
      )}
      <div style={styles.itemBody}>
        <h3 style={{ ...styles.itemTitle, ...(isCompact ? styles.itemTitleCompact : {}) }}>
          {ticket.title}
        </h3>
        <div style={{ ...styles.itemMeta, ...(isCompact ? styles.itemMetaCompact : {}) }}>
          <span style={{ ...styles.badge, backgroundColor: statusColor(ticket.status) }}>
            {ticket.status.replace(/_/g, ' ')}
          </span>
          <span style={{ ...styles.badge, backgroundColor: urgencyColor(ticket.urgency) }}>
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
  );

  // A ticket appears in at most one group: pinned takes precedence over saved
  const pinned = tickets.filter((t) => t.isPinnedGlobal);
  const saved = tickets.filter((t) => t.userHasPersonalPin && !t.isPinnedGlobal);
  const rest = tickets.filter((t) => !t.isPinnedGlobal && !t.userHasPersonalPin);
  const hasGroups = pinned.length > 0 || saved.length > 0;
  const visibleRest = showAllRest ? rest : rest.slice(0, DEFAULT_VISIBLE_COUNT);
  const restHiddenCount = rest.length - visibleRest.length;

  return (
    <div>
      {/* Add new */}
      <div onClick={() => navigate('/tickets/new')} style={styles.addCard}>
        + Create Ticket
      </div>

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
                ...(statusFilter === key ? { backgroundColor: 'var(--surface-hover)' } : {}),
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

      {/* Search */}
      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search tickets by title or description…"
      />

      {/* Controls */}
      <div style={styles.controls}>
        <div style={styles.control}>
          <span style={styles.controlLabel} role="img" aria-label="Locations" title="Locations">
            📍
          </span>
          <LocationFilter
            locations={locations}
            selectedIds={selectedLocationIds}
            onChange={setSelectedLocationIds}
          />
        </div>
        <div style={styles.control}>
          <span style={styles.controlLabel} role="img" aria-label="Sort by" title="Sort by">
            ↕️
          </span>
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
          {debouncedSearch
            ? `No tickets match “${debouncedSearch}”.`
            : statusFilter === 'ALL'
              ? 'No tickets yet.'
              : `No ${STATUS_FILTERS.find((f) => f.value === statusFilter)?.label.toLowerCase()} tickets.`}
        </p>
      ) : (
        <>
          {pinned.length > 0 && (
            <CollapsibleSection title="📌 Pinned" count={pinned.length} storageKey="tickets-pinned">
              <div style={styles.list}>{pinned.map(renderTicket)}</div>
            </CollapsibleSection>
          )}
          {saved.length > 0 && (
            <CollapsibleSection title="⭐ Saved" count={saved.length} storageKey="tickets-saved">
              <div style={styles.list}>{saved.map(renderTicket)}</div>
            </CollapsibleSection>
          )}
          {rest.length > 0 &&
            (hasGroups ? (
              <CollapsibleSection title="All Tickets" count={rest.length} storageKey="tickets-all">
                <div style={styles.list}>{visibleRest.map(renderTicket)}</div>
                {restHiddenCount > 0 && (
                  <button onClick={() => setShowAllRest(true)} style={styles.showAllBtn}>
                    Show all ({restHiddenCount} more)
                  </button>
                )}
              </CollapsibleSection>
            ) : (
              <div style={styles.group}>
                <div style={styles.list}>{visibleRest.map(renderTicket)}</div>
                {restHiddenCount > 0 && (
                  <button onClick={() => setShowAllRest(true)} style={styles.showAllBtn}>
                    Show all ({restHiddenCount} more)
                  </button>
                )}
              </div>
            ))}
        </>
      )}

      {!isLoading && tickets.length > 0 && (
        <p style={styles.count}>
          Showing {pinned.length + saved.length + visibleRest.length} of {total} ticket{total === 1 ? '' : 's'}
        </p>
      )}
    </div>
  );
}

const styles = {
  addCard: {
    backgroundColor: 'transparent',
    padding: '16px',
    borderRadius: '4px',
    border: '2px dashed var(--border-strong)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--text-muted)',
    fontSize: '15px',
    fontWeight: '600' as const,
    marginBottom: '20px',
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
    backgroundColor: 'var(--surface)',
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
    color: 'var(--text-muted)',
    fontWeight: '600' as const,
  },
  controls: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '20px',
    flexWrap: 'wrap' as const,
  },
  control: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flex: '1 1 180px',
    minWidth: '160px',
  },
  controlLabel: {
    fontSize: '16px',
    flexShrink: 0,
  },
  sortSelect: {
    flex: 1,
    minWidth: 0,
    padding: '8px 10px',
    border: '1px solid var(--border-strong)',
    borderRadius: '4px',
    backgroundColor: 'var(--input-bg)',
    color: 'var(--text)',
    fontSize: '16px',
  },
  error: {
    padding: '12px 16px',
    backgroundColor: 'var(--danger-bg)',
    color: 'var(--danger-text)',
    borderRadius: '4px',
    fontSize: '14px',
    marginBottom: '16px',
  },
  loading: {
    color: 'var(--text-muted)',
  },
  empty: {
    fontSize: '14px',
    color: 'var(--text-faint)',
    fontStyle: 'italic',
    padding: '24px 0',
  },
  group: {
    marginBottom: '24px',
  },
  groupTitle: {
    fontSize: '14px',
    fontWeight: '700' as const,
    color: 'var(--text-muted)',
    margin: '0 0 10px 0',
  },
  list: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  listItem: {
    backgroundColor: 'var(--surface)',
    padding: '16px',
    borderRadius: '4px',
    borderLeft: '4px solid #007bff',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '8px',
  },
  listItemCompact: {
    padding: '8px 12px',
  },
  thumb: {
    width: '56px',
    height: '56px',
    objectFit: 'cover' as const,
    borderRadius: '6px',
    flexShrink: 0,
    backgroundColor: 'var(--border)',
  },
  itemBody: {
    minWidth: 0,
    flex: 1,
  },
  itemTitle: {
    fontSize: '15px',
    fontWeight: '600' as const,
    margin: '0 0 8px 0',
    color: 'var(--text)',
  },
  itemTitleCompact: {
    margin: '0 0 4px 0',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  itemMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap' as const,
  },
  itemMetaCompact: {
    flexWrap: 'nowrap' as const,
    overflow: 'hidden',
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
    color: 'var(--text-muted)',
  },
  itemBadge: {
    fontSize: '16px',
    flexShrink: 0,
  },
  count: {
    fontSize: '13px',
    color: 'var(--text-faint)',
    marginTop: '16px',
  },
  showAllBtn: {
    display: 'block',
    width: '100%',
    padding: '10px',
    marginTop: '8px',
    backgroundColor: 'transparent',
    border: '1px dashed var(--border-strong)',
    borderRadius: '4px',
    color: '#007bff',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600' as const,
  },
};
