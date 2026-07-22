import { useState, useEffect } from 'react';
import { api, photoSrc } from '../../api';
import { useToast } from '../../Toast';
import { styles as shared } from '../../components/AdminShared';
import type { Location } from '../../types';

const MapIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: '-2px', marginRight: '5px' }}>
    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
    <line x1="8" y1="2" x2="8" y2="18" />
    <line x1="16" y1="6" x2="16" y2="22" />
  </svg>
);

export default function AdminLocations() {
  const showToast = useToast();
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [floorplanBusyId, setFloorplanBusyId] = useState<string | null>(null);

  useEffect(() => {
    loadLocations();
  }, []);

  async function loadLocations() {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.listLocations();
      setLocations(response.data.data?.items || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load locations');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) {
      setError('Location name is required');
      return;
    }

    setIsCreating(true);
    setError(null);
    try {
      const response = await api.createLocation(newName);
      setLocations([...locations, response.data.data!]);
      setNewName('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create location');
    } finally {
      setIsCreating(false);
    }
  }

  async function handleFloorplanSelect(locationId: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setFloorplanBusyId(locationId);
    setError(null);
    try {
      const response = await api.uploadLocationFloorplan(locationId, file);
      const floorplanUrl = response.data.data!.floorplanUrl;
      setLocations((prev) =>
        prev.map((loc) => (loc.id === locationId ? { ...loc, floorplanUrl } : loc))
      );
      showToast('Floorplan uploaded ✓');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to upload floorplan');
    } finally {
      setFloorplanBusyId(null);
    }
  }

  async function handleRemoveFloorplan(locationId: string) {
    setFloorplanBusyId(locationId);
    setError(null);
    try {
      await api.removeLocationFloorplan(locationId);
      setLocations((prev) =>
        prev.map((loc) => (loc.id === locationId ? { ...loc, floorplanUrl: null } : loc))
      );
      showToast('Floorplan removed');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to remove floorplan');
    } finally {
      setFloorplanBusyId(null);
    }
  }

  return (
    <div style={styles.card}>
      <h2 style={styles.title}>Location Management</h2>

      {error && <div style={styles.error}>{error}</div>}

      {/* Create Form */}
      <form onSubmit={handleCreate} style={styles.form}>
        <div style={styles.formRow}>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Enter new location name..."
            style={styles.input}
            disabled={isCreating}
          />
          <button
            type="submit"
            style={styles.btnPrimary}
            disabled={isCreating}
          >
            {isCreating ? 'Creating...' : '+ Add Location'}
          </button>
        </div>
      </form>

      {/* Locations List */}
      {isLoading ? (
        <p>Loading locations...</p>
      ) : locations.length === 0 ? (
        <p style={styles.empty}>No locations yet</p>
      ) : (
        <div style={styles.list}>
          {locations.map((location) => (
            <div key={location.id} style={styles.listItem}>
              <div style={styles.listItemTop}>
                <div>
                  <p style={styles.itemName}>{location.name}</p>
                  <p style={styles.itemId}>ID: {location.id}</p>
                </div>
                <span style={styles.badge}>Active</span>
              </div>

              <div style={styles.floorplanRow}>
                {location.floorplanUrl ? (
                  <img
                    src={photoSrc(location.floorplanUrl)}
                    alt={`${location.name} floorplan`}
                    style={styles.floorplanThumb}
                  />
                ) : (
                  <div style={styles.floorplanPlaceholder}>No floorplan</div>
                )}
                <div style={styles.floorplanActions}>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    id={`floorplan-input-${location.id}`}
                    style={{ display: 'none' }}
                    onChange={(e) => handleFloorplanSelect(location.id, e)}
                    disabled={floorplanBusyId === location.id}
                  />
                  <label
                    htmlFor={`floorplan-input-${location.id}`}
                    style={{
                      ...styles.floorplanBtn,
                      ...(floorplanBusyId === location.id ? styles.floorplanBtnDisabled : {}),
                    }}
                  >
                    {floorplanBusyId === location.id ? (
                      'Working…'
                    ) : (
                      <>
                        {MapIcon}
                        {location.floorplanUrl ? 'Replace floorplan' : 'Upload floorplan'}
                      </>
                    )}
                  </label>
                  {location.floorplanUrl && (
                    <button
                      type="button"
                      onClick={() => handleRemoveFloorplan(location.id)}
                      style={styles.floorplanRemoveBtn}
                      disabled={floorplanBusyId === location.id}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <p style={styles.info}>
        Total locations: <strong>{locations.length}</strong>
      </p>
    </div>
  );
}

const styles = {
  card: shared.card,
  title: shared.title,
  error: {
    padding: '11px 14px',
    backgroundColor: 'var(--danger-soft)',
    color: 'var(--danger-text)',
    borderRadius: '9px',
    fontSize: '14px',
    marginBottom: '16px',
  },
  form: {
    marginBottom: '20px',
  },
  formRow: shared.addRow,
  input: shared.addInput,
  btnPrimary: shared.addBtn,
  list: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
    marginBottom: '20px',
  },
  listItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
    padding: '14px 16px',
    backgroundColor: 'var(--bg)',
    borderRadius: '9px',
    border: '1px solid var(--border)',
  },
  listItemTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  floorplanRow: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
  },
  floorplanThumb: {
    width: '76px',
    height: '56px',
    objectFit: 'cover' as const,
    borderRadius: '7px',
    border: '1px solid var(--border-strong)',
    backgroundColor: 'var(--surface)',
    flexShrink: 0,
  },
  floorplanPlaceholder: {
    width: '76px',
    height: '56px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '7px',
    border: '1px dashed var(--border-strong)',
    color: 'var(--text-faint)',
    fontSize: '10px',
    textAlign: 'center' as const,
    flexShrink: 0,
  },
  floorplanActions: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap' as const,
    alignItems: 'center',
  },
  floorplanBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '8px 14px',
    backgroundColor: 'var(--accent)',
    color: 'white',
    border: 'none',
    borderRadius: '7px',
    cursor: 'pointer',
    fontSize: '12.5px',
    fontWeight: '600' as const,
  },
  floorplanBtnDisabled: {
    opacity: 0.6,
    cursor: 'default',
  },
  floorplanRemoveBtn: {
    padding: '8px 14px',
    backgroundColor: 'transparent',
    border: '1px solid var(--border-strong)',
    color: 'var(--text-muted)',
    borderRadius: '7px',
    cursor: 'pointer',
    fontSize: '12.5px',
    fontWeight: '600' as const,
  },
  itemName: {
    fontSize: '14.5px',
    fontWeight: '600' as const,
    color: 'var(--text)',
    margin: '0 0 4px 0',
  },
  itemId: {
    fontSize: '12px',
    color: 'var(--text-faint)',
    margin: 0,
  },
  badge: {
    display: 'inline-block',
    padding: '3px 9px',
    backgroundColor: 'var(--success-soft)',
    color: 'var(--success)',
    borderRadius: '6px',
    fontSize: '11.5px',
    fontWeight: '700' as const,
  },
  empty: shared.empty,
  info: {
    fontSize: '13px',
    color: 'var(--text-muted)',
    marginTop: '20px',
  },
};
