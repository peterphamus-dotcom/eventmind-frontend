import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../AuthContext';
import { useToast } from '../Toast';
import { api, photoSrc } from '../api';
import { Modal } from './Modal';
import type { LibraryDocument, LibraryDocumentKind, Tag } from '../types';

function relativeTime(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function formatFileSize(bytes?: number | null): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface FormState {
  mode: 'create' | 'edit';
  kind: LibraryDocumentKind;
  id?: string;
  title: string;
  content: string;
  file: File | null;
  tagIds: string[];
  isPublic: boolean;
}

const emptyForm: FormState = {
  mode: 'create',
  kind: 'TEXT',
  title: '',
  content: '',
  file: null,
  tagIds: [],
  isPublic: false,
};

export function LibraryPanel() {
  const { user } = useAuth();
  const showToast = useToast();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'CORE_TEAM';

  const [documents, setDocuments] = useState<LibraryDocument[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [form, setForm] = useState<FormState | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadDocuments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.listLibraryDocuments({ search: search.trim() || undefined, tagIds: tagFilter });
      setDocuments(response.data.data?.items || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  }, [search, tagFilter]);

  useEffect(() => {
    const timer = setTimeout(loadDocuments, 250);
    return () => clearTimeout(timer);
  }, [loadDocuments]);

  useEffect(() => {
    api.listTags().then((res) => setAllTags(res.data.data?.items || []));
  }, []);

  function toggleTagFilter(tagId: string) {
    setTagFilter((prev) => (prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]));
  }

  function toggleFormTag(tagId: string) {
    setForm((prev) =>
      prev
        ? { ...prev, tagIds: prev.tagIds.includes(tagId) ? prev.tagIds.filter((id) => id !== tagId) : [...prev.tagIds, tagId] }
        : prev
    );
  }

  function openCreateForm() {
    setForm({ ...emptyForm });
    setFormError(null);
  }

  function openEditForm(doc: LibraryDocument) {
    setForm({
      mode: 'edit',
      kind: doc.kind,
      id: doc.id,
      title: doc.title,
      content: doc.content || '',
      file: null,
      tagIds: doc.tags.map((t) => t.id),
      isPublic: doc.isPublic,
    });
    setFormError(null);
  }

  async function handleSubmit() {
    if (!form || isSubmitting) return;
    if (!form.title.trim()) {
      setFormError('Title is required');
      return;
    }
    if (form.mode === 'create' && form.kind === 'TEXT' && !form.content.trim()) {
      setFormError('Content is required');
      return;
    }
    if (form.mode === 'create' && form.kind === 'FILE' && !form.file) {
      setFormError('A file is required');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    try {
      if (form.mode === 'create') {
        if (form.kind === 'TEXT') {
          await api.createLibraryTextDocument({
            title: form.title.trim(),
            content: form.content.trim(),
            tagIds: form.tagIds,
            isPublic: form.isPublic,
          });
        } else {
          const fd = new FormData();
          fd.append('title', form.title.trim());
          fd.append('file', form.file as File);
          fd.append('tagIds', JSON.stringify(form.tagIds));
          fd.append('isPublic', String(form.isPublic));
          await api.uploadLibraryDocument(fd);
        }
        showToast('Document added');
      } else {
        const updates: { title?: string; content?: string; tagIds?: string[]; isPublic?: boolean } = {
          title: form.title.trim(),
          tagIds: form.tagIds,
          isPublic: form.isPublic,
        };
        if (form.kind === 'TEXT') updates.content = form.content.trim();
        await api.updateLibraryDocument(form.id as string, updates);
        showToast('Document updated');
      }
      setForm(null);
      loadDocuments();
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'Failed to save document');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this document? This cannot be undone.')) return;
    try {
      await api.deleteLibraryDocument(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      showToast('Document deleted');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete document');
    }
  }

  return (
    <div>
      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.controls}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search documents..."
          style={styles.search}
        />
        {isAdmin && (
          <button onClick={openCreateForm} style={styles.addBtn}>
            + Add Document
          </button>
        )}
      </div>

      {allTags.length > 0 && (
        <div style={styles.tagFilterRow}>
          {allTags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => toggleTagFilter(tag.id)}
              style={{
                ...styles.tagButton,
                ...(tagFilter.includes(tag.id) ? styles.tagButtonActive : {}),
              }}
            >
              {tag.name}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <p>Loading…</p>
      ) : documents.length === 0 ? (
        <div style={styles.empty}>
          <p>📚 No documents yet.</p>
          {isAdmin ? (
            <p style={styles.emptyHint}>Admins can share SOPs, emergency procedures, setup docs, or any reference materials here.</p>
          ) : (
            <p style={styles.emptyHint}>Shared documents will appear here. Check back soon or ask an admin to upload something!</p>
          )}
        </div>
      ) : (
        <div style={styles.list}>
          {documents.map((doc) => (
            <div key={doc.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <span style={styles.kindIcon}>{doc.kind === 'FILE' ? '📎' : '📄'}</span>
                <span style={styles.title}>{doc.title}</span>
                {doc.isPublic && isAdmin && <span style={styles.publicBadge}>Public</span>}
              </div>

              {doc.tags.length > 0 && (
                <div style={styles.tags}>
                  {doc.tags.map((tag) => (
                    <span key={tag.id} style={styles.tagChip}>
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}

              {doc.kind === 'FILE' ? (
                <a
                  href={photoSrc(doc.fileUrl || '')}
                  download={doc.fileName || undefined}
                  target="_blank"
                  rel="noreferrer"
                  style={styles.downloadLink}
                >
                  ⬇ {doc.fileName || 'Download'} {doc.fileSize ? `(${formatFileSize(doc.fileSize)})` : ''}
                </a>
              ) : (
                <>
                  <button
                    onClick={() => setExpandedId(expandedId === doc.id ? null : doc.id)}
                    style={styles.viewToggle}
                  >
                    {expandedId === doc.id ? 'Hide content ▲' : 'View content ▼'}
                  </button>
                  {expandedId === doc.id && <p style={styles.content}>{doc.content}</p>}
                </>
              )}

              <div style={styles.meta}>
                By {doc.createdBy.name} · {relativeTime(doc.createdAt)}
              </div>

              {isAdmin && (
                <div style={styles.actions}>
                  <button onClick={() => openEditForm(doc)} style={styles.editBtn}>
                    Edit
                  </button>
                  <button onClick={() => handleDelete(doc.id)} style={styles.deleteBtn}>
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {form && (
        <Modal
          title={form.mode === 'create' ? 'Add Document' : 'Edit Document'}
          onClose={() => setForm(null)}
        >
          {formError && <div style={styles.error}>{formError}</div>}

          {form.mode === 'create' && (
            <div style={styles.section}>
              <label style={styles.label}>Type</label>
              <div style={styles.kindToggle}>
                <button
                  onClick={() => setForm({ ...form, kind: 'TEXT' })}
                  style={{ ...styles.kindBtn, ...(form.kind === 'TEXT' ? styles.kindBtnActive : {}) }}
                >
                  📄 Text
                </button>
                <button
                  onClick={() => setForm({ ...form, kind: 'FILE' })}
                  style={{ ...styles.kindBtn, ...(form.kind === 'FILE' ? styles.kindBtnActive : {}) }}
                >
                  📎 File
                </button>
              </div>
            </div>
          )}

          <div style={styles.section}>
            <label style={styles.label}>Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              style={styles.input}
              maxLength={200}
            />
          </div>

          {form.kind === 'TEXT' ? (
            <div style={styles.section}>
              <label style={styles.label}>Content</label>
              <textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                style={styles.textarea}
                rows={8}
                maxLength={20000}
              />
            </div>
          ) : form.mode === 'create' ? (
            <div style={styles.section}>
              <label style={styles.label}>File</label>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,image/jpeg,image/png,image/webp"
                onChange={(e) => setForm({ ...form, file: e.target.files?.[0] || null })}
                style={styles.input}
              />
            </div>
          ) : null}

          <div style={styles.section}>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={form.isPublic}
                onChange={(e) => setForm({ ...form, isPublic: e.target.checked })}
              />
              Visible to Expo users
            </label>
          </div>

          {allTags.length > 0 && (
            <div style={styles.section}>
              <label style={styles.label}>Visible to (leave blank for everyone)</label>
              <div style={styles.tagFilterRow}>
                {allTags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => toggleFormTag(tag.id)}
                    style={{
                      ...styles.tagButton,
                      ...(form.tagIds.includes(tag.id) ? styles.tagButtonActive : {}),
                    }}
                  >
                    {form.tagIds.includes(tag.id) && '✓ '}
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button onClick={handleSubmit} style={styles.primaryBtn} disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : form.mode === 'create' ? 'Add Document' : 'Save Changes'}
          </button>
        </Modal>
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
    display: 'flex',
    gap: '12px',
    marginBottom: '16px',
    flexWrap: 'wrap' as const,
  },
  search: {
    flex: 1,
    minWidth: '200px',
    padding: '10px 12px',
    border: '1px solid var(--border-strong)',
    borderRadius: '4px',
    fontSize: '14px',
    backgroundColor: 'var(--input-bg)',
    color: 'var(--text)',
  },
  addBtn: {
    padding: '10px 16px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600' as const,
    whiteSpace: 'nowrap' as const,
  },
  tagFilterRow: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '8px',
    marginBottom: '20px',
  },
  tagButton: {
    padding: '6px 12px',
    border: '1px solid var(--border-strong)',
    borderRadius: '16px',
    backgroundColor: 'var(--surface)',
    color: 'var(--text)',
    fontSize: '13px',
    cursor: 'pointer',
  },
  tagButtonActive: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
    color: 'white',
  },
  list: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  card: {
    backgroundColor: 'var(--surface)',
    borderRadius: '8px',
    padding: '16px',
    boxShadow: '0 1px 4px var(--shadow)',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '6px',
  },
  kindIcon: {
    fontSize: '16px',
  },
  title: {
    fontSize: '15px',
    fontWeight: '600' as const,
    color: 'var(--text)',
  },
  publicBadge: {
    display: 'inline-block',
    padding: '2px 8px',
    backgroundColor: 'var(--accent-soft)',
    color: 'var(--accent-text)',
    borderRadius: '10px',
    fontSize: '10.5px',
    fontWeight: '700' as const,
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    color: 'var(--text)',
    cursor: 'pointer',
  },
  tags: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '6px',
    marginBottom: '10px',
  },
  tagChip: {
    display: 'inline-block',
    padding: '2px 8px',
    backgroundColor: 'var(--tag-bg)',
    color: 'var(--tag-text)',
    borderRadius: '10px',
    fontSize: '11px',
    fontWeight: '500' as const,
  },
  downloadLink: {
    display: 'inline-block',
    color: '#007bff',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '500' as const,
    marginBottom: '8px',
  },
  viewToggle: {
    background: 'none',
    border: 'none',
    color: '#007bff',
    fontSize: '13px',
    cursor: 'pointer',
    padding: 0,
    marginBottom: '8px',
  },
  content: {
    fontSize: '14px',
    color: 'var(--text)',
    whiteSpace: 'pre-wrap' as const,
    backgroundColor: 'var(--bg)',
    padding: '12px',
    borderRadius: '4px',
    marginBottom: '8px',
  },
  meta: {
    fontSize: '12px',
    color: 'var(--text-faint)',
    marginBottom: '8px',
  },
  actions: {
    display: 'flex',
    gap: '8px',
  },
  editBtn: {
    padding: '6px 12px',
    backgroundColor: 'transparent',
    border: '1px solid var(--border-strong)',
    color: 'var(--text)',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500' as const,
  },
  deleteBtn: {
    padding: '6px 12px',
    backgroundColor: 'transparent',
    border: '1px solid #dc3545',
    color: '#dc3545',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500' as const,
  },
  empty: {
    textAlign: 'center' as const,
    padding: '40px 20px',
    color: 'var(--text-muted)',
  },
  emptyHint: {
    fontSize: '14px',
    color: 'var(--text-faint)',
    margin: '8px 0 0 0',
  },
  section: {
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    fontSize: '12px',
    fontWeight: '600' as const,
    color: 'var(--text-muted)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    marginBottom: '6px',
  },
  kindToggle: {
    display: 'flex',
    gap: '8px',
  },
  kindBtn: {
    flex: 1,
    padding: '10px',
    border: '1px solid var(--border-strong)',
    borderRadius: '4px',
    backgroundColor: 'var(--surface)',
    color: 'var(--text)',
    cursor: 'pointer',
    fontSize: '14px',
  },
  kindBtnActive: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
    color: 'white',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid var(--border-strong)',
    borderRadius: '4px',
    backgroundColor: 'var(--input-bg)',
    color: 'var(--text)',
    fontSize: '14px',
    boxSizing: 'border-box' as const,
  },
  textarea: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid var(--border-strong)',
    borderRadius: '4px',
    backgroundColor: 'var(--input-bg)',
    color: 'var(--text)',
    fontSize: '14px',
    fontFamily: 'inherit',
    resize: 'vertical' as const,
    boxSizing: 'border-box' as const,
  },
  primaryBtn: {
    padding: '10px 20px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600' as const,
    width: '100%',
  },
};
