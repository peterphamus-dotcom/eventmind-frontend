import { useState, useEffect } from 'react';
import { api } from '../../api';
import type { Tag } from '../../types';

export default function AdminTags() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadTags();
  }, []);

  async function loadTags() {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.listTags(1, 100);
      setTags(response.data.data?.items || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load tags');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) {
      setError('Tag name is required');
      return;
    }

    setIsCreating(true);
    setError(null);
    try {
      const response = await api.createTag(newName);
      setTags([...tags, response.data.data!]);
      setNewName('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create tag');
    } finally {
      setIsCreating(false);
    }
  }

  async function handleDelete(tagId: string) {
    if (!confirm('Are you sure you want to delete this tag?')) return;

    setDeletingId(tagId);
    setError(null);
    try {
      await api.deleteTag(tagId);
      setTags(tags.filter((t) => t.id !== tagId));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete tag');
    } finally {
      setDeletingId(null);
    }
  }

  const predefinedTags = tags.filter((t) => t.isPredefined);
  const customTags = tags.filter((t) => !t.isPredefined);

  return (
    <div style={styles.card}>
      <h2 style={styles.title}>Tag Management</h2>

      {error && <div style={styles.error}>{error}</div>}

      {/* Create Form */}
      <form onSubmit={handleCreate} style={styles.form}>
        <div style={styles.formRow}>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Enter new tag name..."
            style={styles.input}
            disabled={isCreating}
          />
          <button
            type="submit"
            style={styles.btnPrimary}
            disabled={isCreating}
          >
            {isCreating ? 'Creating...' : '+ Add Tag'}
          </button>
        </div>
      </form>

      {/* Tags List */}
      {isLoading ? (
        <p>Loading tags...</p>
      ) : tags.length === 0 ? (
        <p style={styles.empty}>No tags yet</p>
      ) : (
        <>
          {/* Predefined Tags */}
          {predefinedTags.length > 0 && (
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>
                Predefined Tags ({predefinedTags.length})
              </h3>
              <div style={styles.tagGrid}>
                {predefinedTags.map((tag) => (
                  <div key={tag.id} style={styles.tagCard}>
                    <p style={styles.tagName}>{tag.name}</p>
                    <span
                      style={{
                        ...styles.badge,
                        backgroundColor: '#e2e3e5',
                        color: '#383d41',
                      }}
                    >
                      System
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Custom Tags */}
          {customTags.length > 0 && (
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>
                Custom Tags ({customTags.length})
              </h3>
              <div style={styles.tagGrid}>
                {customTags.map((tag) => (
                  <div key={tag.id} style={styles.tagCard}>
                    <p style={styles.tagName}>{tag.name}</p>
                    <button
                      onClick={() => handleDelete(tag.id)}
                      style={styles.deleteBtn}
                      disabled={deletingId === tag.id}
                    >
                      {deletingId === tag.id ? 'Deleting...' : '✕ Delete'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <p style={styles.info}>
        Total tags: <strong>{tags.length}</strong> (Predefined:{' '}
        <strong>{predefinedTags.length}</strong>, Custom:{' '}
        <strong>{customTags.length}</strong>)
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
  section: {
    marginBottom: '32px',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '12px',
  },
  tagGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
    gap: '12px',
  },
  tagCard: {
    padding: '12px',
    backgroundColor: '#f9f9f9',
    borderRadius: '4px',
    border: '1px solid #eee',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  tagName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#333',
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
  deleteBtn: {
    padding: '6px 8px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '500' as const,
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
