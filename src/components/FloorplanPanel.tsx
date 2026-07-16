import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, photoSrc } from '../api';
import type { Ticket, Location } from '../types';

const urgencyColor = (urgency: string) =>
  urgency === 'HIGH' ? '#dc3545' : urgency === 'MEDIUM' ? '#ffc107' : '#28a745';

/** Floorplan view: pick a location, see pinned tickets plotted on its
 *  floorplan image, click a pin for a quick-glance popover. */
export function FloorplanPanel() {
  const navigate = useNavigate();
  const [locations, setLocations] = useState<Location[]>([]);
  const [locationId, setLocationId] = useState('');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const floorplanLocations = locations.filter((loc) => loc.floorplanUrl);
  const selectedLocation = floorplanLocations.find((loc) => loc.id === locationId);
  const selectedTicket = tickets.find((t) => t.id === selectedTicketId);

  useEffect(() => {
    api
      .listLocations()
      .then((res) => {
        const items = res.data.data?.items || [];
        setLocations(items);
        const firstWithFloorplan = items.find((loc) => loc.floorplanUrl);
        if (firstWithFloorplan) setLocationId(firstWithFloorplan.id);
      })
      .catch(() => setError('Failed to load locations'))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (!locationId) {
      setTickets([]);
      return;
    }
    setSelectedTicketId(null);
    api
      .listTickets(1, 100, { locationId, hasPin: 'true' })
      .then((res) => setTickets(res.data.data?.items || []))
      .catch(() => setError('Failed to load pinned tickets'));
  }, [locationId]);

  if (isLoading) return <p>Loading…</p>;

  if (floorplanLocations.length === 0) {
    return (
      <div style={styles.empty}>
        <p>No floorplans uploaded yet.</p>
        <p style={styles.emptyHint}>
          An admin can upload one for a location in Admin Panel → Locations.
        </p>
      </div>
    );
  }

  return (
    <div>
      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.controls}>
        <select
          value={locationId}
          onChange={(e) => setLocationId(e.target.value)}
          style={styles.select}
        >
          {floorplanLocations.map((loc) => (
            <option key={loc.id} value={loc.id}>
              {loc.name}
            </option>
          ))}
        </select>
      </div>

      {selectedLocation && (
        <div style={styles.wrap} onClick={() => setSelectedTicketId(null)}>
          <img
            src={photoSrc(selectedLocation.floorplanUrl!)}
            alt={`${selectedLocation.name} floorplan`}
            style={styles.img}
          />
          {tickets.map((ticket) => (
            <button
              key={ticket.id}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedTicketId(ticket.id === selectedTicketId ? null : ticket.id);
              }}
              style={{
                ...styles.pin,
                left: `${(ticket.pinX ?? 0) * 100}%`,
                top: `${(ticket.pinY ?? 0) * 100}%`,
                backgroundColor: urgencyColor(ticket.urgency),
                opacity: ticket.status === 'RESOLVED' || ticket.status === 'ARCHIVED' ? 0.5 : 1,
              }}
              aria-label={`Ticket: ${ticket.title}`}
              title={ticket.title}
            />
          ))}

          {selectedTicket && (
            <div
              style={{
                ...styles.popover,
                left: `${(selectedTicket.pinX ?? 0) * 100}%`,
                top: `${(selectedTicket.pinY ?? 0) * 100}%`,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <p style={styles.popoverTitle}>{selectedTicket.title}</p>
              <div style={styles.popoverMeta}>
                <span style={{ ...styles.badge, backgroundColor: urgencyColor(selectedTicket.urgency) }}>
                  {selectedTicket.urgency}
                </span>
                <span style={styles.statusText}>{selectedTicket.status.replace(/_/g, ' ')}</span>
              </div>
              {selectedTicket.submitter && (
                <p style={styles.popoverSubmitter}>By {selectedTicket.submitter.name}</p>
              )}
              <button
                type="button"
                onClick={() => navigate(`/tickets/${selectedTicket.id}`)}
                style={styles.viewBtn}
              >
                View full ticket →
              </button>
            </div>
          )}
        </div>
      )}

      {selectedLocation && tickets.length === 0 && (
        <p style={styles.noPins}>No tickets pinned on this floorplan yet.</p>
      )}
    </div>
  );
}

const styles = {
  error: {
    padding: '12px 16px',
    backgroundColor: 'var(--danger-bg)',
    color: 'var(--danger-text)',
    borderRadius: '4px',
    fontSize: '14px',
    marginBottom: '16px',
  },
  controls: {
    marginBottom: '16px',
  },
  select: {
    padding: '10px 12px',
    border: '1px solid var(--border-strong)',
    borderRadius: '4px',
    fontSize: '14px',
    fontFamily: 'inherit',
    backgroundColor: 'var(--input-bg)',
    color: 'var(--text)',
    minWidth: '200px',
  },
  wrap: {
    position: 'relative' as const,
    display: 'inline-block',
    maxWidth: '100%',
    border: '1px solid var(--border-strong)',
    borderRadius: '4px',
    overflow: 'visible' as const,
  },
  img: {
    display: 'block',
    maxWidth: '100%',
    width: '100%',
    borderRadius: '4px',
    userSelect: 'none' as const,
  },
  pin: {
    position: 'absolute' as const,
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    border: '2px solid white',
    boxShadow: '0 1px 4px rgba(0,0,0,0.5)',
    transform: 'translate(-50%, -50%)',
    cursor: 'pointer',
    padding: 0,
  },
  popover: {
    position: 'absolute' as const,
    transform: 'translate(-50%, calc(-100% - 16px))',
    backgroundColor: 'var(--surface)',
    border: '1px solid var(--border-strong)',
    borderRadius: '6px',
    boxShadow: '0 4px 16px var(--shadow)',
    padding: '12px 14px',
    width: '220px',
    zIndex: 20,
  },
  popoverTitle: {
    fontSize: '14px',
    fontWeight: '600' as const,
    color: 'var(--text)',
    margin: '0 0 8px 0',
  },
  popoverMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '6px',
  },
  badge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '600' as const,
    color: 'white',
  },
  statusText: {
    fontSize: '12px',
    color: 'var(--text-muted)',
  },
  popoverSubmitter: {
    fontSize: '12px',
    color: 'var(--text-faint)',
    margin: '0 0 10px 0',
  },
  viewBtn: {
    width: '100%',
    padding: '8px 10px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500' as const,
  },
  noPins: {
    fontSize: '14px',
    color: 'var(--text-faint)',
    marginTop: '16px',
  },
  empty: {
    padding: '40px 20px',
    textAlign: 'center' as const,
    color: 'var(--text-muted)',
  },
  emptyHint: {
    fontSize: '13px',
    color: 'var(--text-faint)',
  },
};
