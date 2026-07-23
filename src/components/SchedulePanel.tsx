import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../AuthContext';
import { useToast } from '../Toast';
import { api } from '../api';
import { Modal } from './Modal';
import { LocationFilter } from './LocationFilter';
import { ScheduleImportModal } from './ScheduleImportModal';
import { ScheduleItemModal } from './ScheduleItemModal';
import { groupByDay, formatDayHeading, timeBucketOf, bucketColorVar, isItemPast } from '../scheduleGrouping';
import type { ScheduleItem, Location } from '../types';

interface FormState {
  mode: 'create' | 'edit';
  id?: string;
  title: string;
  description: string;
  startTime: string; // datetime-local value
  endTime: string; // datetime-local value
  locationId: string;
}

const emptyForm: FormState = { mode: 'create', title: '', description: '', startTime: '', endTime: '', locationId: '' };

/** Converts an ISO datetime to the value a <input type="datetime-local"> expects. */
function toLocalInputValue(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatRange(startIso: string, endIso?: string | null): string {
  const start = new Date(startIso);
  const startStr = start.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  if (!endIso) return startStr;
  const end = new Date(endIso);
  const sameDay = start.toDateString() === end.toDateString();
  const endStr = end.toLocaleString(undefined, sameDay ? { hour: 'numeric', minute: '2-digit' } : { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  return `${startStr} – ${endStr}`;
}

/** The event schedule/agenda: grouped by day, collapsible, today expanded. */
export function SchedulePanel() {
  const { user } = useAuth();
  const showToast = useToast();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'CORE_TEAM';

  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedLocationIds, setSelectedLocationIds] = useState<string[]>([]);

  const [form, setForm] = useState<FormState | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const hasInitializedDays = useRef(false);

  const loadItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.listSchedule({
        search: search.trim() || undefined,
        locationId: selectedLocationIds.length > 0 ? selectedLocationIds.join(',') : undefined,
        kind: 'OFFICIAL',
      });
      const loaded = response.data.data?.items || [];
      setItems(loaded);
      if (!hasInitializedDays.current && loaded.length > 0) {
        hasInitializedDays.current = true;
        const todayKey = new Date();
        const pad = (n: number) => String(n).padStart(2, '0');
        const key = `${todayKey.getFullYear()}-${pad(todayKey.getMonth() + 1)}-${pad(todayKey.getDate())}`;
        setExpandedDays(new Set([key]));
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load schedule');
    } finally {
      setIsLoading(false);
    }
  }, [search, selectedLocationIds]);

  useEffect(() => {
    const timer = setTimeout(loadItems, 250);
    return () => clearTimeout(timer);
  }, [loadItems]);

  useEffect(() => {
    api.listLocations().then((res) => setLocations(res.data.data?.items || [])).catch(() => setLocations([]));
  }, []);

  function openCreateForm() {
    setForm({ ...emptyForm });
    setFormError(null);
  }

  function openEditForm(item: ScheduleItem) {
    setForm({
      mode: 'edit',
      id: item.id,
      title: item.title,
      description: item.description || '',
      startTime: toLocalInputValue(item.startTime),
      endTime: toLocalInputValue(item.endTime),
      locationId: item.location?.id || '',
    });
    setFormError(null);
  }

  async function handleSubmit() {
    if (!form || isSubmitting) return;
    if (!form.title.trim()) {
      setFormError('Title is required');
      return;
    }
    if (!form.startTime) {
      setFormError('Start time is required');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        startTime: new Date(form.startTime).toISOString(),
        endTime: form.endTime ? new Date(form.endTime).toISOString() : undefined,
        locationId: form.locationId || undefined,
      };
      if (form.mode === 'create') {
        await api.createScheduleItem(payload);
        showToast('Schedule item added');
      } else {
        await api.updateScheduleItem(form.id as string, {
          ...payload,
          endTime: form.endTime ? new Date(form.endTime).toISOString() : null,
          locationId: form.locationId || null,
        });
        showToast('Schedule item updated');
      }
      setForm(null);
      loadItems();
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'Failed to save schedule item');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this schedule item? This cannot be undone.')) return;
    try {
      await api.deleteScheduleItem(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      showToast('Schedule item deleted');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete schedule item');
    }
  }

  function toggleDay(dayKey: string) {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(dayKey)) next.delete(dayKey);
      else next.add(dayKey);
      return next;
    });
  }

  const dayGroups = groupByDay(items);

  return (
    <div>
      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.controls}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search schedule…"
          style={styles.search}
        />
        <div style={styles.locationControl}>
          <LocationFilter locations={locations} selectedIds={selectedLocationIds} onChange={setSelectedLocationIds} />
        </div>
        {isAdmin && (
          <>
            <button onClick={() => setImportOpen(true)} style={styles.importBtn}>
              📥 Import
            </button>
            <button onClick={openCreateForm} style={styles.addBtn}>
              + Add Item
            </button>
          </>
        )}
      </div>

      {isLoading ? (
        <p>Loading…</p>
      ) : items.length === 0 ? (
        <div style={styles.empty}>
          <p>🗓️ No schedule items yet.</p>
          {isAdmin ? (
            <p style={styles.emptyHint}>
              Import a schedule from Google Calendar (.ics), Excel, PDF, or a photo. Or manually add events.
            </p>
          ) : (
            <p style={styles.emptyHint}>The event schedule will appear here once published by an admin.</p>
          )}
        </div>
      ) : (
        <div style={styles.dayGroups}>
          {dayGroups.map(({ dayKey, items: dayItems }) => {
            const isExpanded = expandedDays.has(dayKey);
            return (
              <div key={dayKey} style={styles.dayGroup}>
                <button onClick={() => toggleDay(dayKey)} style={styles.dayHeader}>
                  <span style={{ ...styles.dayChevron, transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
                  <span style={styles.dayHeading}>{formatDayHeading(dayKey)}</span>
                  <span style={styles.dayCount}>{dayItems.length}</span>
                </button>
                {isExpanded && (
                  <div style={styles.list}>
                    {dayItems.map((item) => {
                      const past = isItemPast(item);
                      const accent = bucketColorVar(timeBucketOf(item.startTime));
                      return (
                        <div
                          key={item.id}
                          style={{ ...styles.card, borderLeft: `4px solid ${past ? 'var(--border-strong)' : accent}`, opacity: past ? 0.55 : 1 }}
                        >
                          <div onClick={() => setPreviewId(item.id)} style={styles.cardClickable}>
                            <div style={styles.timeCol}>{formatRange(item.startTime, item.endTime)}</div>
                            <div style={styles.body}>
                              <div style={styles.title}>{item.title}</div>
                              <div style={styles.meta}>
                                {item.location && <span style={styles.metaText}>📍 {item.location.name}</span>}
                                {!!item.commentCount && <span style={styles.metaText}>💬 {item.commentCount}</span>}
                                {item.isSubscribed && <span style={styles.metaText}>🔔</span>}
                                {item.myReminderOffsetMinutes != null && <span style={styles.metaText}>⏰</span>}
                              </div>
                            </div>
                          </div>
                          {isAdmin && (
                            <div style={styles.actions}>
                              <button onClick={() => openEditForm(item)} style={styles.editBtn}>
                                Edit
                              </button>
                              <button onClick={() => handleDelete(item.id)} style={styles.deleteBtn}>
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {previewId && (
        <ScheduleItemModal
          itemId={previewId}
          onClose={() => {
            setPreviewId(null);
            loadItems();
          }}
        />
      )}

      {form && (
        <Modal title={form.mode === 'create' ? 'Add Schedule Item' : 'Edit Schedule Item'} onClose={() => setForm(null)}>
          {formError && <div style={styles.error}>{formError}</div>}

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

          <div style={styles.row2}>
            <div style={styles.section}>
              <label style={styles.label}>Starts</label>
              <input
                type="datetime-local"
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                style={styles.input}
              />
            </div>
            <div style={styles.section}>
              <label style={styles.label}>Ends (optional)</label>
              <input
                type="datetime-local"
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.section}>
            <label style={styles.label}>Location (optional)</label>
            <select
              value={form.locationId}
              onChange={(e) => setForm({ ...form, locationId: e.target.value })}
              style={styles.input}
            >
              <option value="">None</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.section}>
            <label style={styles.label}>Description (optional)</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              style={styles.textarea}
              rows={4}
              maxLength={5000}
            />
          </div>

          <button onClick={handleSubmit} style={styles.primaryBtn} disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : form.mode === 'create' ? 'Add Item' : 'Save Changes'}
          </button>
        </Modal>
      )}

      {importOpen && (
        <ScheduleImportModal
          locations={locations}
          onClose={() => setImportOpen(false)}
          onImported={() => {
            setImportOpen(false);
            loadItems();
          }}
        />
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
    marginBottom: '20px',
    flexWrap: 'wrap' as const,
    alignItems: 'center',
  },
  search: {
    flex: '1 1 200px',
    minWidth: '160px',
    padding: '10px 12px',
    border: '1px solid var(--border-strong)',
    borderRadius: '4px',
    fontSize: '14px',
    backgroundColor: 'var(--input-bg)',
    color: 'var(--text)',
  },
  locationControl: {
    flex: '1 1 180px',
    minWidth: '160px',
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
  importBtn: {
    padding: '10px 16px',
    backgroundColor: 'transparent',
    border: '1px solid var(--border-strong)',
    color: 'var(--text)',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600' as const,
    whiteSpace: 'nowrap' as const,
  },
  dayGroups: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
  },
  dayGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  dayHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 12px',
    backgroundColor: 'var(--surface-alt)',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    textAlign: 'left' as const,
    width: '100%',
  },
  dayChevron: {
    fontSize: '10px',
    color: 'var(--text-muted)',
    transition: 'transform 0.15s ease',
    flexShrink: 0,
  },
  dayHeading: {
    fontSize: '14px',
    fontWeight: '700' as const,
    color: 'var(--text)',
    flex: 1,
  },
  dayCount: {
    fontSize: '12px',
    fontWeight: '600' as const,
    color: 'var(--text-muted)',
  },
  list: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  card: {
    backgroundColor: 'var(--surface)',
    borderRadius: '6px',
    boxShadow: '0 1px 4px var(--shadow)',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '4px 8px',
  },
  cardClickable: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '12px 8px',
    cursor: 'pointer',
  },
  timeCol: {
    flexShrink: 0,
    fontSize: '13px',
    fontWeight: '600' as const,
    color: 'var(--text-muted)',
    minWidth: '140px',
  },
  body: {
    minWidth: 0,
    flex: 1,
  },
  title: {
    fontSize: '15px',
    fontWeight: '600' as const,
    color: 'var(--text)',
    marginBottom: '4px',
  },
  meta: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap' as const,
  },
  metaText: {
    fontSize: '12px',
    color: 'var(--text-muted)',
  },
  actions: {
    display: 'flex',
    gap: '8px',
    flexShrink: 0,
    paddingRight: '8px',
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
    flex: 1,
  },
  row2: {
    display: 'flex',
    gap: '12px',
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
