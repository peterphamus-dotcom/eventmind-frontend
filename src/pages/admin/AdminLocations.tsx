import { useState, useEffect } from 'react';
import { api } from '../../api';
import type { Location } from '../../types';

export default function AdminLocations() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

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
              <div>
                <p style={styles.itemName}>{location.name}</p>
                <p style={styles.itemId}>ID: {location.id}</p>
              </div>
              <span style={styles.badge}>Active</span>
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
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '32px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  },
  title: {
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '24px',
    color: '#333',
  },
  error: {
    padding: '12px 16px',
    backgroundColor: '#fee',
    color: '#c00',
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
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    backgroundColor: '#f9f9f9',
    borderRadius: '4px',
    border: '1px solid #eee',
  },
  itemName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#333',
    margin: '0 0 4px 0',
  },
  itemId: {
    fontSize: '12px',
    color: '#999',
    margin: 0,
  },
  badge: {
    display: 'inline-block',
    padding: '4px 8px',
    backgroundColor: '#d4edda',
    color: '#155724',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '600' as const,
  },
  empty: {
    fontSize: '14px',
    color: '#999',
    fontStyle: 'italic',
  },
  info: {
    fontSize: '14px',
    color: '#666',
    marginTop: '24px',
  },
};
