import { useState, useEffect } from 'react';
import { api, photoSrc } from '../../api';
import { useToast } from '../../Toast';
import type { Location } from '../../types';

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
                    {floorplanBusyId === location.id
                      ? 'Working…'
                      : location.floorplanUrl
                        ? '🗺️ Replace floorplan'
                        : '🗺️ Upload floorplan'}
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
  card: {
    backgroundColor: 'var(--surface)',
    borderRadius: '8px',
    padding: '32px',
    boxShadow: '0 2px 10px var(--shadow)',
  },
  title: {
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '24px',
    color: 'var(--text)',
  },
  error: {
    padding: '12px 16px',
    backgroundColor: 'var(--danger-bg)',
    color: 'var(--danger-text)',
    borderRadius: '4px',
    fontSize: '14px',
    marginBottom: '16px',
  },
  form: {
    marginBottom: '24px',
  },
  formRow: {
    display: 'flex',
    gap: '12px',
  },
  input: {
    flex: 1,
    padding: '10px 12px',
    border: '1px solid var(--border-strong)',
    borderRadius: '4px',
    fontSize: '14px',
    backgroundColor: 'var(--input-bg)',
    color: 'var(--text)',
  },
  btnPrimary: {
    padding: '10px 20px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500' as const,
  },
  list: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
    marginBottom: '24px',
  },
  listItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
    padding: '16px',
    backgroundColor: 'var(--bg)',
    borderRadius: '4px',
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
    width: '80px',
    height: '60px',
    objectFit: 'cover' as const,
    borderRadius: '4px',
    border: '1px solid var(--border-strong)',
    backgroundColor: 'var(--surface)',
    flexShrink: 0,
  },
  floorplanPlaceholder: {
    width: '80px',
    height: '60px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '4px',
    border: '1px dashed var(--border-strong)',
    color: 'var(--text-faint)',
    fontSize: '11px',
    textAlign: 'center' as const,
    flexShrink: 0,
  },
  floorplanActions: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap' as const,
  },
  floorplanBtn: {
    display: 'inline-block',
    padding: '8px 14px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500' as const,
  },
  floorplanBtnDisabled: {
    opacity: 0.6,
    cursor: 'default',
  },
  floorplanRemoveBtn: {
    padding: '8px 14px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500' as const,
  },
  itemName: {
    fontSize: '14px',
    fontWeight: '600',
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
    padding: '4px 8px',
    backgroundColor: 'var(--success-bg)',
    color: 'var(--success-text)',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '600' as const,
  },
  empty: {
    fontSize: '14px',
    color: 'var(--text-faint)',
    fontStyle: 'italic',
  },
  info: {
    fontSize: '14px',
    color: 'var(--text-muted)',
    marginTop: '24px',
  },
};
