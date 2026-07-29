import { useState } from 'react';
import { api } from '../api';
import { Modal } from './Modal';
import type { ChecklistItem } from '../types';

const REMINDER_OPTIONS = [
  { value: 0, label: 'At time' },
  { value: 15, label: '15 min before' },
  { value: 30, label: '30 min before' },
  { value: 60, label: '1 hour before' },
  { value: 1440, label: '1 day before' },
];

function toLocalInputValue(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

interface ChecklistItemModalProps {
  checklistId: string;
  item: ChecklistItem;
  onClose: () => void;
  onSaved: (item: ChecklistItem) => void;
  onDeleted: (itemId: string) => void;
}

/** Focused single-card editor: title, notes, time, reminder, delete. Opened by clicking a board card. */
export function ChecklistItemModal({ checklistId, item, onClose, onSaved, onDeleted }: ChecklistItemModalProps) {
  const [title, setTitle] = useState(item.title);
  const [notes, setNotes] = useState(item.notes || '');
  const [time, setTime] = useState(toLocalInputValue(item.time));
  const [reminderChoice, setReminderChoice] = useState<string>(
    item.reminderOffsetMinutes != null ? String(item.reminderOffsetMinutes) : 'none'
  );
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleSave() {
    if (isSaving || !title.trim()) return;
    setIsSaving(true);
    setError(null);
    try {
      const res = await api.updateChecklistItem(checklistId, item.id, {
        title: title.trim(),
        notes: notes.trim() || null,
        time: time ? new Date(time).toISOString() : null,
        reminderOffsetMinutes: reminderChoice === 'none' ? null : parseInt(reminderChoice, 10),
      });
      onSaved(res.data.data!);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save item');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (isDeleting) return;
    if (!confirm('Delete this item?')) return;
    setIsDeleting(true);
    try {
      await api.deleteChecklistItem(checklistId, item.id);
      onDeleted(item.id);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete item');
      setIsDeleting(false);
    }
  }

  return (
    <Modal title="Edit Item" onClose={onClose}>
      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.section}>
        <label style={styles.label}>Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={styles.input}
          maxLength={200}
        />
      </div>

      <div style={styles.section}>
        <label style={styles.label}>Notes (optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          style={styles.textarea}
          rows={3}
          maxLength={2000}
        />
      </div>

      <div style={styles.row2}>
        <div style={styles.section}>
          <label style={styles.label}>Time (optional)</label>
          <input
            type="datetime-local"
            value={time}
            onChange={(e) => {
              setTime(e.target.value);
              if (!e.target.value) setReminderChoice('none');
            }}
            style={styles.input}
          />
        </div>
        <div style={styles.section}>
          <label style={styles.label}>Remind me</label>
          <select
            value={reminderChoice}
            onChange={(e) => setReminderChoice(e.target.value)}
            style={styles.input}
            disabled={!time}
          >
            <option value="none">No reminder</option>
            {REMINDER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={styles.footerActions}>
        <button onClick={handleDelete} style={styles.deleteBtn} disabled={isDeleting}>
          {isDeleting ? 'Deleting…' : 'Delete'}
        </button>
        <button onClick={handleSave} style={styles.primaryBtn} disabled={isSaving || !title.trim()}>
          {isSaving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </Modal>
  );
}

const styles: Record<string, React.CSSProperties> = {
  error: {
    padding: '10px 14px',
    backgroundColor: 'var(--danger-bg)',
    color: 'var(--danger-text)',
    borderRadius: '4px',
    fontSize: '13px',
    marginBottom: '14px',
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
    fontWeight: 600,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
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
    boxSizing: 'border-box',
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
    resize: 'vertical',
    boxSizing: 'border-box',
  },
  footerActions: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '10px',
  },
  deleteBtn: {
    padding: '10px 20px',
    backgroundColor: 'transparent',
    border: '1px solid #dc3545',
    color: '#dc3545',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 600,
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
    flex: 1,
  },
};
