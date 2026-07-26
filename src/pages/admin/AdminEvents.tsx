import { useState, useEffect } from 'react';
import { api } from '../../api';
import { useToast } from '../../Toast';
import { useAuth } from '../../AuthContext';

interface Event {
  eventName: string;
  dbName: string;
  createdAt: string;
}

interface CreatedEvent {
  eventName: string;
  dbName: string;
  adminEmail: string;
  adminPassword: string;
  clonedFrom: string;
}

export default function AdminEvents() {
  const showToast = useToast();
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({ eventName: '', cloneFromCurrent: false });
  const [createdEvent, setCreatedEvent] = useState<CreatedEvent | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  async function loadEvents() {
    try {
      setLoading(true);
      const res = await api.listEvents();
      setEvents(res.data.data?.items || []);
    } catch (error: any) {
      showToast('Failed to load events');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateEvent() {
    if (!formData.eventName.trim()) {
      showToast('Event name is required');
      return;
    }

    try {
      setCreating(true);
      const res = await api.createEvent(formData.eventName, formData.cloneFromCurrent);
      const newEvent = res.data.data as CreatedEvent;
      setCreatedEvent(newEvent);
      setFormData({ eventName: '', cloneFromCurrent: false });
      setShowForm(false);
      await loadEvents();
      showToast(`Event "${newEvent.eventName}" created successfully`);
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Failed to create event';
      showToast(errorMsg);
    } finally {
      setCreating(false);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    showToast('Copied to clipboard');
  }

  if (loading) {
    return <div style={styles.container}>Loading events...</div>;
  }

  return (
    <div style={styles.container}>
      {/* Created Event Credentials Display */}
      {createdEvent && (
        <div style={styles.credentialsBox}>
          <h3 style={styles.credentialsTitle}>✓ Event Created</h3>
          <div style={styles.credentialsContent}>
            <div style={styles.credentialRow}>
              <span style={styles.label}>Event Name:</span>
              <div style={styles.valueGroup}>
                <code style={styles.code}>{createdEvent.eventName}</code>
              </div>
            </div>
            <div style={styles.credentialRow}>
              <span style={styles.label}>Cloned From:</span>
              <div style={styles.valueGroup}>
                <code style={styles.code}>{createdEvent.clonedFrom}</code>
              </div>
            </div>
            <div style={styles.credentialRow}>
              <span style={styles.label}>Admin Email:</span>
              <div style={styles.valueGroup}>
                <code style={styles.code}>{createdEvent.adminEmail}</code>
                <button onClick={() => copyToClipboard(createdEvent.adminEmail)} style={styles.copyBtn}>
                  Copy
                </button>
              </div>
            </div>
            <div style={styles.credentialRow}>
              <span style={styles.label}>Admin Password:</span>
              <div style={styles.valueGroup}>
                <code style={styles.code}>{createdEvent.adminPassword}</code>
                <button onClick={() => copyToClipboard(createdEvent.adminPassword)} style={styles.copyBtn}>
                  Copy
                </button>
              </div>
            </div>
            <p style={styles.credentialsNote}>
              Save these credentials. The password cannot be recovered and must be changed on first login.
            </p>
            <button onClick={() => setCreatedEvent(null)} style={styles.dismissBtn}>
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Create Event Section */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Create New Event</h2>
        {showForm ? (
          <div style={styles.form}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Event Name</label>
              <input
                type="text"
                placeholder="e.g., Coachella 2026"
                value={formData.eventName}
                onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
                style={styles.input}
              />
              <p style={styles.hint}>Human-readable event identifier (spaces allowed)</p>
            </div>

            <fieldset style={styles.fieldset}>
              <legend style={styles.label}>Initialize Event</legend>
              <div style={styles.radioGroup}>
                <label style={styles.radioLabel}>
                  <input
                    type="radio"
                    name="initMode"
                    checked={!formData.cloneFromCurrent}
                    onChange={() => setFormData({ ...formData, cloneFromCurrent: false })}
                    style={styles.radio}
                  />
                  <span>Start fresh from template</span>
                </label>
                <p style={styles.hint}>Creates blank database with "Main Venue" location only</p>
              </div>
              <div style={styles.radioGroup}>
                <label style={styles.radioLabel}>
                  <input
                    type="radio"
                    name="initMode"
                    checked={formData.cloneFromCurrent}
                    onChange={() => setFormData({ ...formData, cloneFromCurrent: true })}
                    disabled={!user || events.length === 0}
                    style={styles.radio}
                  />
                  <span>Clone from current event</span>
                </label>
                <p style={styles.hint}>Copies locations, teams, and tags from your current event</p>
              </div>
            </fieldset>

            <div style={styles.formActions}>
              <button
                onClick={handleCreateEvent}
                disabled={creating || !formData.eventName.trim()}
                style={{ ...styles.submitBtn, opacity: creating || !formData.eventName.trim() ? 0.6 : 1 }}
              >
                {creating ? 'Creating...' : 'Create Event'}
              </button>
              <button onClick={() => setShowForm(false)} style={styles.cancelBtn}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowForm(true)} style={styles.createBtn}>
            + New Event Instance
          </button>
        )}
      </div>

      {/* Events List */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Active Events ({events.length})</h2>
        {events.length === 0 ? (
          <p style={styles.empty}>No events created yet</p>
        ) : (
          <div style={styles.eventsList}>
            {events.map((event) => (
              <div key={event.eventName} style={styles.eventCard}>
                <div style={styles.eventHeader}>
                  <h3 style={styles.eventName}>{event.eventName}</h3>
                  <span style={styles.dbName}>{event.dbName}</span>
                </div>
                <p style={styles.eventDate}>Created {new Date(event.createdAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '24px clamp(16px, 4vw, 40px)',
    maxWidth: '900px',
  },
  section: {
    marginBottom: '32px',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 700,
    color: 'var(--text)',
    margin: '0 0 16px',
    letterSpacing: '-0.01em',
  },
  form: {
    backgroundColor: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    padding: '20px',
  },
  formGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--text)',
    marginBottom: '8px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid var(--border)',
    borderRadius: '6px',
    fontSize: '14px',
    backgroundColor: 'var(--bg)',
    color: 'var(--text)',
    boxSizing: 'border-box' as const,
  },
  select: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid var(--border)',
    borderRadius: '6px',
    fontSize: '14px',
    backgroundColor: 'var(--bg)',
    color: 'var(--text)',
    boxSizing: 'border-box' as const,
  },
  fieldset: {
    border: 'none',
    padding: 0,
    margin: '20px 0 0',
  },
  radioGroup: {
    marginBottom: '16px',
  },
  radioLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '14px',
    color: 'var(--text)',
    cursor: 'pointer',
  },
  radio: {
    cursor: 'pointer',
  },
  hint: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    margin: '6px 0 0',
  },
  formActions: {
    display: 'flex',
    gap: '10px',
    marginTop: '24px',
  },
  submitBtn: {
    flex: 1,
    padding: '11px 16px',
    backgroundColor: 'var(--accent)',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 600,
    transition: 'background-color 0.2s',
  },
  cancelBtn: {
    padding: '11px 16px',
    backgroundColor: 'var(--surface-hover)',
    color: 'var(--text)',
    border: '1px solid var(--border)',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 600,
  },
  createBtn: {
    padding: '12px 20px',
    backgroundColor: 'var(--accent)',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 600,
  },
  credentialsBox: {
    backgroundColor: 'var(--success-soft)',
    border: '1px solid var(--success-border)',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '32px',
  },
  credentialsTitle: {
    fontSize: '16px',
    fontWeight: 700,
    color: 'var(--success-text)',
    margin: '0 0 16px',
  },
  credentialsContent: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  credentialRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  code: {
    backgroundColor: 'var(--bg)',
    padding: '6px 10px',
    borderRadius: '4px',
    fontSize: '13px',
    fontFamily: 'monospace',
    color: 'var(--text)',
    flex: 1,
  },
  valueGroup: {
    display: 'flex',
    gap: '8px',
    flex: 1,
    alignItems: 'center',
  },
  copyBtn: {
    padding: '6px 12px',
    backgroundColor: 'var(--success-text)',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 600,
  },
  credentialsNote: {
    fontSize: '12px',
    color: 'var(--success-text)',
    margin: '12px 0 0',
  },
  dismissBtn: {
    alignSelf: 'flex-start' as const,
    padding: '8px 16px',
    backgroundColor: 'transparent',
    color: 'var(--success-text)',
    border: '1px solid var(--success-text)',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 600,
  },
  eventsList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '16px',
  },
  eventCard: {
    backgroundColor: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    padding: '16px',
  },
  eventHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '12px',
    marginBottom: '8px',
  },
  eventName: {
    fontSize: '16px',
    fontWeight: 700,
    color: 'var(--text)',
    margin: 0,
  },
  dbName: {
    fontSize: '12px',
    backgroundColor: 'var(--bg)',
    color: 'var(--text-muted)',
    padding: '4px 8px',
    borderRadius: '4px',
    fontFamily: 'monospace',
    whiteSpace: 'nowrap' as const,
  },
  eventDate: {
    fontSize: '13px',
    color: 'var(--text-muted)',
    margin: 0,
  },
  empty: {
    padding: '20px',
    textAlign: 'center' as const,
    color: 'var(--text-muted)',
  },
};
