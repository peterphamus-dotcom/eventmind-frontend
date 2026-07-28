import { useState, useEffect } from 'react';
import { api } from '../../api';
import { styles as shared } from '../../components/AdminShared';
import type { Tag, TagPair } from '../../types';

export default function AdminTags() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [pairs, setPairs] = useState<TagPair[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newIsGoalTag, setNewIsGoalTag] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [pairTagAId, setPairTagAId] = useState('');
  const [pairTagBId, setPairTagBId] = useState('');
  const [isCreatingPair, setIsCreatingPair] = useState(false);
  const [deletingPairId, setDeletingPairId] = useState<string | null>(null);

  useEffect(() => {
    loadTags();
    loadPairs();
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

  async function loadPairs() {
    try {
      const response = await api.listTagPairs();
      setPairs(response.data.data || []);
    } catch {
      setPairs([]);
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
      const response = await api.createTag(newName, newIsGoalTag);
      setTags([...tags, response.data.data!]);
      setNewName('');
      setNewIsGoalTag(false);
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

  async function handleToggleGoalTag(tag: Tag) {
    setTogglingId(tag.id);
    setError(null);
    try {
      const response = await api.updateTag(tag.id, { isGoalTag: !tag.isGoalTag });
      setTags(tags.map((t) => (t.id === tag.id ? response.data.data! : t)));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update tag');
    } finally {
      setTogglingId(null);
    }
  }

  async function handleCreatePair(e: React.FormEvent) {
    e.preventDefault();
    if (!pairTagAId || !pairTagBId) return;
    setIsCreatingPair(true);
    setError(null);
    try {
      const response = await api.createTagPair(pairTagAId, pairTagBId);
      setPairs([response.data.data!, ...pairs]);
      setPairTagAId('');
      setPairTagBId('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create pair');
    } finally {
      setIsCreatingPair(false);
    }
  }

  async function handleDeletePair(pairId: string) {
    setDeletingPairId(pairId);
    setError(null);
    try {
      await api.deleteTagPair(pairId);
      setPairs(pairs.filter((p) => p.id !== pairId));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete pair');
    } finally {
      setDeletingPairId(null);
    }
  }

  const predefinedTags = tags.filter((t) => t.isPredefined);
  const customTags = tags.filter((t) => !t.isPredefined);
  const goalTags = tags.filter((t) => t.isGoalTag);

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
        <label style={styles.goalTagCheckboxRow}>
          <input type="checkbox" checked={newIsGoalTag} onChange={(e) => setNewIsGoalTag(e.target.checked)} />
          Networking goal tag (shows in the Networking tab's goal picker instead of ticket/report/library pickers)
        </label>
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
                    <div style={styles.tagCardBtnRow}>
                      <span style={styles.systemBadge}>System</span>
                      <button
                        onClick={() => handleToggleGoalTag(tag)}
                        style={tag.isGoalTag ? styles.goalBadgeActive : styles.goalBadge}
                        disabled={togglingId === tag.id}
                      >
                        {tag.isGoalTag ? 'Goal tag ✓' : 'Mark as goal tag'}
                      </button>
                    </div>
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
                    <div style={styles.tagCardBtnRow}>
                      <button
                        onClick={() => handleToggleGoalTag(tag)}
                        style={tag.isGoalTag ? styles.goalBadgeActive : styles.goalBadge}
                        disabled={togglingId === tag.id}
                      >
                        {tag.isGoalTag ? 'Goal tag ✓' : 'Mark as goal tag'}
                      </button>
                      <button
                        onClick={() => handleDelete(tag.id)}
                        style={styles.deleteBtn}
                        disabled={deletingId === tag.id}
                      >
                        {deletingId === tag.id ? 'Deleting…' : 'Delete'}
                      </button>
                    </div>
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

      {goalTags.length > 0 && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Complementary Pairs</h3>
          <p style={styles.info}>
            Pairs power Networking's Suggested Matches — e.g. "Seeking investors" paired with "Offering investment".
            Both tags must be marked as goal tags above.
          </p>
          <form onSubmit={handleCreatePair} style={styles.pairFormRow}>
            <select value={pairTagAId} onChange={(e) => setPairTagAId(e.target.value)} style={styles.input}>
              <option value="">Select a goal tag…</option>
              {goalTags.map((tag) => (
                <option key={tag.id} value={tag.id}>
                  {tag.name}
                </option>
              ))}
            </select>
            <select value={pairTagBId} onChange={(e) => setPairTagBId(e.target.value)} style={styles.input}>
              <option value="">Pairs with…</option>
              {goalTags
                .filter((tag) => tag.id !== pairTagAId)
                .map((tag) => (
                  <option key={tag.id} value={tag.id}>
                    {tag.name}
                  </option>
                ))}
            </select>
            <button type="submit" style={styles.btnPrimary} disabled={isCreatingPair || !pairTagAId || !pairTagBId}>
              {isCreatingPair ? 'Adding…' : '+ Add Pair'}
            </button>
          </form>

          {pairs.length === 0 ? (
            <p style={styles.empty}>No complementary pairs yet</p>
          ) : (
            <div style={styles.pairList}>
              {pairs.map((pair) => (
                <div key={pair.id} style={styles.pairRow}>
                  <span>
                    {pair.tagA.name} <span style={styles.pairArrow}>↔</span> {pair.tagB.name}
                  </span>
                  <button
                    onClick={() => handleDeletePair(pair.id)}
                    style={styles.deleteBtn}
                    disabled={deletingPairId === pair.id}
                  >
                    {deletingPairId === pair.id ? 'Removing…' : 'Remove'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
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
    marginBottom: '22px',
  },
  goalTagCheckboxRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '10px',
    fontSize: '12.5px',
    color: 'var(--text-muted)',
    cursor: 'pointer',
  },
  formRow: shared.addRow,
  input: shared.addInput,
  btnPrimary: shared.addBtn,
  section: {
    marginBottom: '22px',
  },
  sectionTitle: shared.sectionTitle,
  tagGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
    gap: '10px',
  },
  tagCard: {
    padding: '11px 13px',
    backgroundColor: 'var(--bg)',
    borderRadius: '8px',
    border: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
  },
  tagCardBtnRow: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '6px',
  },
  goalBadge: {
    alignSelf: 'flex-start' as const,
    padding: '4px 9px',
    backgroundColor: 'transparent',
    color: 'var(--text-muted)',
    border: '1px solid var(--border-strong)',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '10.5px',
    fontWeight: '600' as const,
  },
  goalBadgeActive: {
    alignSelf: 'flex-start' as const,
    padding: '4px 9px',
    backgroundColor: 'var(--accent-soft)',
    color: 'var(--accent-text)',
    border: '1px solid var(--accent)',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '10.5px',
    fontWeight: '600' as const,
  },
  pairFormRow: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap' as const,
    marginBottom: '16px',
  },
  pairList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  pairRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 13px',
    backgroundColor: 'var(--bg)',
    borderRadius: '8px',
    border: '1px solid var(--border)',
    fontSize: '13px',
    color: 'var(--text)',
  },
  pairArrow: {
    color: 'var(--text-faint)',
  },
  tagName: {
    fontSize: '13.5px',
    fontWeight: '600' as const,
    color: 'var(--text)',
    margin: 0,
  },
  systemBadge: {
    alignSelf: 'flex-start' as const,
    display: 'inline-block',
    padding: '2px 8px',
    backgroundColor: 'var(--border)',
    color: 'var(--text-muted)',
    borderRadius: '6px',
    fontSize: '10.5px',
    fontWeight: '700' as const,
  },
  deleteBtn: {
    alignSelf: 'flex-start' as const,
    padding: '4px 9px',
    backgroundColor: 'var(--danger)',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '11px',
    fontWeight: '600' as const,
  },
  empty: shared.empty,
  info: {
    fontSize: '13px',
    color: 'var(--text-muted)',
    marginTop: '20px',
  },
};
