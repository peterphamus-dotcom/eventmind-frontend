import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useToast } from '../Toast';

interface Event {
  eventName: string;
  dbName: string;
  createdAt: string;
}

export function EventSelector() {
  const navigate = useNavigate();
  const showToast = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selecting, setSelecting] = useState<string | null>(null);

  useEffect(() => {
    loadEvents();
  }, []);

  async function loadEvents() {
    try {
      setLoading(true);
      const res = await api.listEvents();
      setEvents(res.data.data?.items || []);
      if ((res.data.data?.items || []).length === 0) {
        setError('No events found. Contact an administrator to create one.');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectEvent(eventName: string) {
    setSelecting(eventName);
    try {
      await api.switchEvent(eventName);
      showToast(`Switched to "${eventName}"`);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to select event');
      setSelecting(null);
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Select an Event</h1>
        <p style={styles.subtitle}>Choose an event to access its dashboard.</p>

        {error && <div style={styles.error}>{error}</div>}

        {loading ? (
          <p style={styles.loading}>Loading events...</p>
        ) : events.length === 0 ? (
          <p style={styles.empty}>No events available</p>
        ) : (
          <div style={styles.eventsList}>
            {events.map((event) => (
              <button
                key={event.eventName}
                onClick={() => handleSelectEvent(event.eventName)}
                disabled={selecting === event.eventName}
                style={styles.eventCard}
              >
                <div style={styles.eventName}>{event.eventName}</div>
                <div style={styles.eventDate}>
                  Created {new Date(event.createdAt).toLocaleDateString()}
                </div>
                {selecting === event.eventName && (
                  <div style={styles.loadingText}>Selecting...</div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--bg)',
    padding: '20px',
  },
  card: {
    backgroundColor: 'var(--surface)',
    borderRadius: '8px',
    boxShadow: '0 4px 12px var(--shadow)',
    padding: '40px',
    maxWidth: '500px',
    width: '100%',
  },
  title: {
    fontSize: '24px',
    fontWeight: '700' as const,
    color: 'var(--text)',
    margin: '0 0 8px',
  },
  subtitle: {
    fontSize: '14px',
    color: 'var(--text-muted)',
    margin: '0 0 24px',
  },
  error: {
    padding: '12px 14px',
    backgroundColor: 'var(--danger-soft)',
    color: 'var(--danger-text)',
    borderRadius: '6px',
    fontSize: '14px',
    marginBottom: '20px',
  },
  loading: {
    textAlign: 'center' as const,
    color: 'var(--text-muted)',
    padding: '20px',
  },
  empty: {
    textAlign: 'center' as const,
    color: 'var(--text-faint)',
    padding: '20px',
  },
  eventsList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  eventCard: {
    padding: '16px',
    backgroundColor: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: '6px',
    cursor: 'pointer',
    textAlign: 'left' as const,
    transition: 'all 0.2s',
    fontSize: '14px',
    ':hover': {
      backgroundColor: 'var(--surface-hover)',
      borderColor: 'var(--accent)',
    },
  },
  eventName: {
    fontSize: '16px',
    fontWeight: '600' as const,
    color: 'var(--text)',
    marginBottom: '4px',
  },
  eventDate: {
    fontSize: '12px',
    color: 'var(--text-muted)',
  },
  loadingText: {
    fontSize: '12px',
    color: 'var(--accent)',
    marginTop: '8px',
  },
};
