import { useState, useEffect, useCallback, useRef } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { api } from '../api';
import { useToast } from '../Toast';
import { Modal } from './Modal';
import { ChecklistItemModal } from './ChecklistItemModal';
import { ChecklistImportModal } from './ChecklistImportModal';
import type { Checklist, ChecklistItem } from '../types';

/** Which checklist (column) currently holds this item, or the column id itself if dropped on an empty column's droppable area. */
function resolveContainerId(checklists: Checklist[], id: string): string | undefined {
  if (checklists.some((c) => c.id === id)) return id;
  return checklists.find((c) => c.items?.some((i) => i.id === id))?.id;
}

function ChecklistCard({
  item,
  onToggle,
  onClick,
}: {
  item: ChecklistItem;
  onToggle: (item: ChecklistItem) => void;
  onClick: (item: ChecklistItem) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={{ ...styles.card, ...style }} {...attributes} {...listeners} onClick={() => onClick(item)}>
      <div style={styles.cardRow}>
        <input
          type="checkbox"
          checked={item.isChecked}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          onChange={() => onToggle(item)}
          style={styles.checkbox}
        />
        <span style={{ ...styles.cardTitle, ...(item.isChecked ? styles.cardTitleChecked : {}) }}>{item.title}</span>
      </div>
      {(item.time || item.reminderOffsetMinutes != null) && (
        <div style={styles.cardMeta}>
          {item.time && (
            <span style={styles.metaText}>
              🕐 {new Date(item.time).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
            </span>
          )}
          {item.reminderOffsetMinutes != null && <span style={styles.metaText}>🔔</span>}
        </div>
      )}
    </div>
  );
}

function BoardColumn({
  checklist,
  onUpdate,
  onArchive,
  onDelete,
  onToggleItem,
  onCardClick,
  onQuickAdd,
}: {
  checklist: Checklist;
  onUpdate: (id: string, updates: { name?: string; description?: string | null }) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleItem: (item: ChecklistItem) => void;
  onCardClick: (item: ChecklistItem) => void;
  onQuickAdd: (checklistId: string, title: string) => void;
}) {
  const { setNodeRef } = useDroppable({ id: checklist.id });
  const [isRenaming, setIsRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState(checklist.name);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [descriptionDraft, setDescriptionDraft] = useState(checklist.description || '');
  const [quickAddValue, setQuickAddValue] = useState('');
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const items = checklist.items || [];
  const itemIds = items.map((i) => i.id);

  function commitRename() {
    setIsRenaming(false);
    if (nameDraft.trim() && nameDraft.trim() !== checklist.name) onUpdate(checklist.id, { name: nameDraft.trim() });
  }

  function commitDescription() {
    setIsEditingDescription(false);
    const trimmed = descriptionDraft.trim();
    if (trimmed !== (checklist.description || '')) onUpdate(checklist.id, { description: trimmed || null });
  }

  function submitQuickAdd() {
    if (!quickAddValue.trim()) return;
    onQuickAdd(checklist.id, quickAddValue.trim());
    setQuickAddValue('');
  }

  return (
    <div style={styles.column}>
      <div style={styles.columnHeader}>
        {isRenaming ? (
          <input
            autoFocus
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => e.key === 'Enter' && commitRename()}
            style={styles.renameInput}
            maxLength={200}
          />
        ) : (
          <span
            onClick={() => {
              setNameDraft(checklist.name);
              setIsRenaming(true);
            }}
            style={styles.columnTitle}
            title="Click to rename"
          >
            {checklist.name}
          </span>
        )}
        <button onClick={() => setConfirmingRemove(true)} style={styles.columnDeleteBtn} title="Archive or delete checklist">
          ✕
        </button>
      </div>
      {confirmingRemove && (
        <div style={styles.confirmBar}>
          <span style={styles.confirmText}>Remove "{checklist.name}"? Archiving keeps it, restorable later.</span>
          <div style={styles.confirmBtns}>
            <button
              onClick={() => {
                setConfirmingRemove(false);
                onArchive(checklist.id);
              }}
              style={styles.confirmArchiveBtn}
            >
              Archive
            </button>
            <button
              onClick={() => {
                setConfirmingRemove(false);
                onDelete(checklist.id);
              }}
              style={styles.confirmDeleteBtn}
            >
              Delete forever
            </button>
            <button onClick={() => setConfirmingRemove(false)} style={styles.confirmCancelBtn}>
              Cancel
            </button>
          </div>
        </div>
      )}
      {isEditingDescription ? (
        <textarea
          autoFocus
          value={descriptionDraft}
          onChange={(e) => setDescriptionDraft(e.target.value.slice(0, 160))}
          onBlur={commitDescription}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), commitDescription())}
          placeholder="Add a description…"
          maxLength={160}
          rows={2}
          style={styles.descriptionInput}
        />
      ) : (
        <div
          onClick={() => {
            setDescriptionDraft(checklist.description || '');
            setIsEditingDescription(true);
          }}
          style={{ ...styles.columnDescription, ...(checklist.description ? {} : styles.columnDescriptionEmpty) }}
          title="Click to edit description"
        >
          {checklist.description || '+ Add a description'}
        </div>
      )}

      <div style={styles.columnProgress}>
        {checklist.checkedCount}/{checklist.itemCount} done
      </div>

      <div ref={setNodeRef} style={styles.columnBody}>
        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
          {items.map((item) => (
            <ChecklistCard key={item.id} item={item} onToggle={onToggleItem} onClick={onCardClick} />
          ))}
        </SortableContext>
        {items.length === 0 && <div style={styles.columnEmpty}>Drop a card here</div>}
      </div>

      <input
        type="text"
        value={quickAddValue}
        onChange={(e) => setQuickAddValue(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submitQuickAdd()}
        onBlur={submitQuickAdd}
        placeholder="+ Add a card"
        style={styles.quickAddInput}
      />
    </div>
  );
}

/**
 * Private, per-user checklists — a sibling tab to Tickets/Reports, never
 * visible to any other user. Trello-style board: checklists are columns,
 * items are draggable cards, reorderable within a column or dropped into
 * another column. Manual drag position is the sole source of truth for
 * order — time is shown only as a badge, never auto-repositions a card.
 */
export function ChecklistsPanel() {
  const showToast = useToast();
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [archivedChecklists, setArchivedChecklists] = useState<Checklist[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeItem, setActiveItem] = useState<ChecklistItem | null>(null);
  const dragStartSnapshot = useRef<Checklist[] | null>(null);
  const [editing, setEditing] = useState<{ checklistId: string; item: ChecklistItem } | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.listChecklists();
      setChecklists(res.data.data?.items || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load checklists');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadArchived = useCallback(async () => {
    try {
      const res = await api.listArchivedChecklists();
      setArchivedChecklists(res.data.data?.items || []);
    } catch {
      // Silent — archived list is a secondary, discreet affordance.
    }
  }, []);

  useEffect(() => {
    load();
    loadArchived();
  }, [load, loadArchived]);

  async function persistMoves(moves: { checklistId: string; itemIds: string[] }[]) {
    try {
      await api.reorderChecklistItems(moves);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save new order');
      load(); // reconcile with the server on failure
    }
  }

  function handleDragStart(event: DragStartEvent) {
    const id = event.active.id as string;
    const item = checklists.flatMap((c) => c.items || []).find((i) => i.id === id) || null;
    setActiveItem(item);
    dragStartSnapshot.current = checklists;
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;
    const activeContainer = resolveContainerId(checklists, active.id as string);
    const overContainer = resolveContainerId(checklists, over.id as string);
    if (!activeContainer || !overContainer || activeContainer === overContainer) return;

    setChecklists((prev) => {
      const source = prev.find((c) => c.id === activeContainer);
      const dest = prev.find((c) => c.id === overContainer);
      if (!source || !dest) return prev;
      const sourceItems = source.items || [];
      const destItems = dest.items || [];
      const activeIndex = sourceItems.findIndex((i) => i.id === active.id);
      if (activeIndex < 0) return prev;
      const movingItem = sourceItems[activeIndex];
      const overIndex = destItems.findIndex((i) => i.id === over.id);
      const insertAt = overIndex >= 0 ? overIndex : destItems.length;
      const newDestItems = [...destItems];
      newDestItems.splice(insertAt, 0, movingItem);

      return prev.map((c) => {
        if (c.id === activeContainer) return { ...c, items: sourceItems.filter((i) => i.id !== active.id) };
        if (c.id === overContainer) return { ...c, items: newDestItems };
        return c;
      });
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveItem(null);
    const snapshot = dragStartSnapshot.current;
    dragStartSnapshot.current = null;

    if (!over) {
      if (snapshot) setChecklists(snapshot); // dropped outside any column — undo onDragOver's optimistic move
      return;
    }

    const activeContainer = resolveContainerId(checklists, active.id as string);
    const overContainer = resolveContainerId(checklists, over.id as string);
    if (!activeContainer || !overContainer) {
      if (snapshot) setChecklists(snapshot);
      return;
    }

    if (activeContainer === overContainer) {
      const container = checklists.find((c) => c.id === activeContainer);
      const items = container?.items || [];
      const activeIndex = items.findIndex((i) => i.id === active.id);
      const overIndex = items.findIndex((i) => i.id === over.id);
      if (activeIndex < 0 || overIndex < 0 || activeIndex === overIndex) return;
      const newItems = arrayMove(items, activeIndex, overIndex);
      setChecklists((prev) => prev.map((c) => (c.id === activeContainer ? { ...c, items: newItems } : c)));
      persistMoves([{ checklistId: activeContainer, itemIds: newItems.map((i) => i.id) }]);
    } else {
      // Cross-column: onDragOver already moved the item between the local arrays.
      const source = checklists.find((c) => c.id === activeContainer);
      const dest = checklists.find((c) => c.id === overContainer);
      const moves = [
        { checklistId: activeContainer, itemIds: (source?.items || []).map((i) => i.id) },
        { checklistId: overContainer, itemIds: (dest?.items || []).map((i) => i.id) },
      ];
      persistMoves(moves);
    }
  }

  async function handleToggleItem(item: ChecklistItem) {
    const checklistId = resolveContainerId(checklists, item.id);
    if (!checklistId) return;
    const nowChecked = !item.isChecked;
    setChecklists((prev) =>
      prev.map((c) => {
        if (c.id !== checklistId) return c;
        const items = (c.items || []).map((i) => (i.id === item.id ? { ...i, isChecked: nowChecked } : i));
        return { ...c, items, checkedCount: items.filter((i) => i.isChecked).length };
      })
    );
    try {
      await api.toggleChecklistItem(checklistId, item.id);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update item');
      load();
    }
  }

  async function handleQuickAdd(checklistId: string, title: string) {
    try {
      const res = await api.addChecklistItem(checklistId, { title });
      setChecklists((prev) =>
        prev.map((c) =>
          c.id === checklistId
            ? { ...c, items: [...(c.items || []), res.data.data!], itemCount: (c.items?.length || 0) + 1 }
            : c
        )
      );
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add item');
    }
  }

  async function handleUpdateChecklist(id: string, updates: { name?: string; description?: string | null }) {
    try {
      await api.updateChecklist(id, updates);
      setChecklists((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update checklist');
    }
  }

  async function handleDeleteChecklist(id: string) {
    try {
      await api.deleteChecklist(id);
      setChecklists((prev) => prev.filter((c) => c.id !== id));
      showToast('Checklist deleted');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete checklist');
    }
  }

  async function handleArchiveChecklist(id: string) {
    const target = checklists.find((c) => c.id === id);
    try {
      await api.archiveChecklist(id);
      setChecklists((prev) => prev.filter((c) => c.id !== id));
      if (target) setArchivedChecklists((prev) => [{ ...target, archivedAt: new Date().toISOString() }, ...prev]);
      showToast('Checklist archived');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to archive checklist');
    }
  }

  async function handleRestoreChecklist(id: string) {
    const target = archivedChecklists.find((c) => c.id === id);
    try {
      await api.restoreChecklist(id);
      setArchivedChecklists((prev) => prev.filter((c) => c.id !== id));
      if (target) setChecklists((prev) => [{ ...target, archivedAt: null }, ...prev]);
      showToast('Checklist restored');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to restore checklist');
    }
  }

  async function handleCreateChecklist() {
    if (isSubmitting || !newName.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await api.createChecklist(newName.trim());
      setChecklists((prev) => [{ ...res.data.data!, items: [] }, ...prev]);
      setCreating(false);
      setNewName('');
      showToast('Checklist created');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create checklist');
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleItemSaved(updated: ChecklistItem) {
    setChecklists((prev) =>
      prev.map((c) => {
        if (!c.items?.some((i) => i.id === updated.id)) return c;
        return { ...c, items: c.items.map((i) => (i.id === updated.id ? updated : i)) };
      })
    );
  }

  function handleItemDeleted(itemId: string) {
    setChecklists((prev) =>
      prev.map((c) => {
        if (!c.items?.some((i) => i.id === itemId)) return c;
        const items = c.items.filter((i) => i.id !== itemId);
        return { ...c, items, itemCount: items.length, checkedCount: items.filter((i) => i.isChecked).length };
      })
    );
  }

  return (
    <div>
      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.controls}>
        <p style={styles.blurb}>Your own private checklists — never visible to anyone else.</p>
        <div style={styles.controlBtns}>
          <button onClick={() => setImportOpen(true)} style={styles.importBtn}>
            📥 Import
          </button>
          <button onClick={() => setCreating(true)} style={styles.addBtn}>
            + New Checklist
          </button>
        </div>
      </div>

      {isLoading ? (
        <p style={styles.loading}>Loading…</p>
      ) : checklists.length === 0 ? (
        <div style={styles.empty}>
          <p>✅ No checklists yet.</p>
          <p style={styles.emptyHint}>Create one manually, or import from a document, image, spreadsheet, or pasted text.</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div style={styles.board}>
            {checklists.map((c) => (
              <BoardColumn
                key={c.id}
                checklist={c}
                onUpdate={handleUpdateChecklist}
                onArchive={handleArchiveChecklist}
                onDelete={handleDeleteChecklist}
                onToggleItem={handleToggleItem}
                onCardClick={(item) => {
                  const checklistId = resolveContainerId(checklists, item.id);
                  if (checklistId) setEditing({ checklistId, item });
                }}
                onQuickAdd={handleQuickAdd}
              />
            ))}
          </div>
          <DragOverlay>
            {activeItem ? (
              <div style={{ ...styles.card, boxShadow: '0 8px 20px var(--shadow)' }}>
                <div style={styles.cardRow}>
                  <input type="checkbox" checked={activeItem.isChecked} readOnly style={styles.checkbox} />
                  <span style={styles.cardTitle}>{activeItem.title}</span>
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {archivedChecklists.length > 0 && (
        <div style={styles.archivedFooter}>
          <span onClick={() => setShowArchived((v) => !v)} style={styles.archivedLink}>
            {archivedChecklists.length} archived checklist{archivedChecklists.length === 1 ? '' : 's'}
          </span>
          {showArchived && (
            <div style={styles.archivedList}>
              {archivedChecklists.map((c) => (
                <div key={c.id} style={styles.archivedRow}>
                  <span style={styles.archivedName}>{c.name}</span>
                  <span onClick={() => handleRestoreChecklist(c.id)} style={styles.restoreLink}>
                    Restore
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {editing && (
        <ChecklistItemModal
          checklistId={editing.checklistId}
          item={editing.item}
          onClose={() => setEditing(null)}
          onSaved={handleItemSaved}
          onDeleted={handleItemDeleted}
        />
      )}

      {importOpen && (
        <ChecklistImportModal
          onClose={() => setImportOpen(false)}
          onImported={() => {
            setImportOpen(false);
            load();
          }}
        />
      )}

      {creating && (
        <Modal title="New Checklist" onClose={() => setCreating(false)}>
          <input
            autoFocus
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateChecklist()}
            placeholder="e.g. Day 1 Setup"
            style={styles.modalInput}
            maxLength={200}
          />
          <button onClick={handleCreateChecklist} style={styles.primaryBtn} disabled={isSubmitting || !newName.trim()}>
            {isSubmitting ? 'Creating…' : 'Create'}
          </button>
        </Modal>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  error: {
    padding: '12px 16px',
    backgroundColor: 'var(--danger-bg)',
    color: 'var(--danger-text)',
    borderRadius: '4px',
    fontSize: '14px',
    marginBottom: '16px',
  },
  loading: { color: 'var(--text-muted)' },
  controls: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '20px',
    flexWrap: 'wrap',
  },
  blurb: {
    fontSize: '13.5px',
    color: 'var(--text-muted)',
    margin: 0,
  },
  controlBtns: {
    display: 'flex',
    gap: '10px',
    flexShrink: 0,
  },
  addBtn: {
    padding: '10px 16px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 600,
    whiteSpace: 'nowrap',
  },
  importBtn: {
    padding: '10px 16px',
    backgroundColor: 'transparent',
    border: '1px solid var(--border-strong)',
    color: 'var(--text)',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 600,
    whiteSpace: 'nowrap',
  },
  empty: {
    textAlign: 'center',
    padding: '40px 20px',
    color: 'var(--text-muted)',
  },
  emptyHint: {
    fontSize: '14px',
    color: 'var(--text-faint)',
    margin: '8px 0 0 0',
  },
  board: {
    display: 'flex',
    gap: '14px',
    overflowX: 'auto',
    paddingBottom: '8px',
    alignItems: 'flex-start',
  },
  column: {
    flex: '0 0 260px',
    width: '260px',
    backgroundColor: 'var(--surface-alt)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    padding: '10px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  columnHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '6px',
  },
  columnTitle: {
    fontSize: '14px',
    fontWeight: 700,
    color: 'var(--text)',
    cursor: 'pointer',
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  renameInput: {
    flex: 1,
    font: 'inherit',
    fontWeight: 700,
    padding: '3px 6px',
    border: '1px solid var(--border-strong)',
    borderRadius: '4px',
    backgroundColor: 'var(--input-bg)',
    color: 'var(--text)',
    boxSizing: 'border-box',
  },
  columnDeleteBtn: {
    flexShrink: 0,
    padding: '2px 7px',
    backgroundColor: 'transparent',
    border: '1px solid var(--border-strong)',
    color: 'var(--text-muted)',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '11px',
  },
  confirmBar: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    padding: '8px',
    backgroundColor: 'var(--danger-bg)',
    border: '1px solid var(--danger-text)',
    borderRadius: '6px',
  },
  confirmText: {
    fontSize: '11.5px',
    color: 'var(--danger-text)',
    lineHeight: 1.3,
  },
  confirmBtns: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
  },
  confirmArchiveBtn: {
    padding: '4px 8px',
    backgroundColor: 'var(--surface)',
    border: '1px solid var(--border-strong)',
    color: 'var(--text)',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '11px',
    fontWeight: 600,
  },
  confirmDeleteBtn: {
    padding: '4px 8px',
    backgroundColor: '#dc3545',
    border: 'none',
    color: 'white',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '11px',
    fontWeight: 600,
  },
  confirmCancelBtn: {
    padding: '4px 8px',
    backgroundColor: 'transparent',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    fontSize: '11px',
  },
  archivedFooter: {
    marginTop: '18px',
  },
  archivedLink: {
    fontSize: '12.5px',
    color: 'var(--text-faint)',
    cursor: 'pointer',
    textDecoration: 'underline',
  },
  archivedList: {
    marginTop: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    maxWidth: '360px',
  },
  archivedRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '12.5px',
    color: 'var(--text-muted)',
    padding: '4px 0',
    borderBottom: '1px solid var(--border)',
  },
  archivedName: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    marginRight: '10px',
  },
  restoreLink: {
    flexShrink: 0,
    color: 'var(--text)',
    cursor: 'pointer',
    textDecoration: 'underline',
    fontWeight: 600,
  },
  columnDescription: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    lineHeight: 1.35,
    wordBreak: 'break-word',
  },
  columnDescriptionEmpty: {
    fontStyle: 'italic',
    color: 'var(--text-faint)',
  },
  descriptionInput: {
    width: '100%',
    padding: '6px 8px',
    border: '1px solid var(--border-strong)',
    borderRadius: '6px',
    backgroundColor: 'var(--input-bg)',
    color: 'var(--text)',
    fontSize: '12px',
    fontFamily: 'inherit',
    resize: 'vertical',
    boxSizing: 'border-box',
  },
  columnProgress: {
    fontSize: '11.5px',
    color: 'var(--text-muted)',
  },
  columnBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    minHeight: '32px',
  },
  columnEmpty: {
    fontSize: '12px',
    color: 'var(--text-faint)',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: '10px 0',
    border: '1px dashed var(--border-strong)',
    borderRadius: '6px',
  },
  card: {
    backgroundColor: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '6px',
    padding: '8px 10px',
    cursor: 'grab',
    boxShadow: '0 1px 2px var(--shadow)',
  },
  cardRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
  },
  checkbox: {
    marginTop: '2px',
    flexShrink: 0,
    cursor: 'pointer',
  },
  cardTitle: {
    fontSize: '13.5px',
    fontWeight: 600,
    color: 'var(--text)',
    wordBreak: 'break-word',
  },
  cardTitleChecked: {
    textDecoration: 'line-through',
    color: 'var(--text-muted)',
  },
  cardMeta: {
    display: 'flex',
    gap: '8px',
    marginTop: '4px',
    paddingLeft: '24px',
  },
  metaText: {
    fontSize: '11px',
    color: 'var(--text-muted)',
  },
  quickAddInput: {
    padding: '7px 9px',
    border: '1px dashed var(--border-strong)',
    borderRadius: '6px',
    backgroundColor: 'var(--input-bg)',
    color: 'var(--text)',
    fontSize: '13px',
    boxSizing: 'border-box',
  },
  modalInput: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid var(--border-strong)',
    borderRadius: '4px',
    backgroundColor: 'var(--input-bg)',
    color: 'var(--text)',
    fontSize: '14px',
    boxSizing: 'border-box',
    marginBottom: '16px',
  },
  primaryBtn: {
    padding: '10px 20px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 600,
    width: '100%',
  },
};
