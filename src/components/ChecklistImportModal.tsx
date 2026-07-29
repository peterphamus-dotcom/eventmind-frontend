import { useState } from 'react';
import { api } from '../api';
import { useToast } from '../Toast';
import { Modal } from './Modal';

interface ChecklistImportModalProps {
  onClose: () => void;
  onImported: () => void;
}

interface DraftRow {
  title: string;
  notes: string;
  time: string; // datetime-local value, or '' for no time
}

type SourceMode = 'file' | 'text';

function toLocalInputValue(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Upload a document/image/spreadsheet or paste raw text, review the parsed
 * draft items (editable), then confirm to create a new checklist from them.
 * Nothing is saved until the reviewer explicitly confirms.
 */
export function ChecklistImportModal({ onClose, onImported }: ChecklistImportModalProps) {
  const showToast = useToast();
  const [sourceMode, setSourceMode] = useState<SourceMode>('file');
  const [file, setFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [rows, setRows] = useState<DraftRow[] | null>(null);
  const [rowErrors, setRowErrors] = useState<Record<number, string>>({});
  const [isImporting, setIsImporting] = useState(false);

  async function handleParse() {
    if (isParsing) return;
    if (sourceMode === 'file' && !file) return;
    if (sourceMode === 'text' && !pastedText.trim()) return;

    setIsParsing(true);
    setParseError(null);
    try {
      const response =
        sourceMode === 'file' ? await api.previewChecklistImport(file as File) : await api.previewChecklistImportText(pastedText);
      const drafts = response.data.data?.items || [];
      setRows(
        drafts.map((d) => ({
          title: d.title,
          notes: d.notes || '',
          time: toLocalInputValue(d.time),
        }))
      );
      if (drafts.length === 0) setParseError('No items were found in that input.');
    } catch (err: any) {
      setParseError(err.response?.data?.error || 'Failed to parse input');
    } finally {
      setIsParsing(false);
    }
  }

  function updateRow(index: number, updates: Partial<DraftRow>) {
    setRows((prev) => (prev ? prev.map((r, i) => (i === index ? { ...r, ...updates } : r)) : prev));
  }

  function removeRow(index: number) {
    setRows((prev) => (prev ? prev.filter((_, i) => i !== index) : prev));
  }

  async function handleConfirm() {
    if (!rows || isImporting) return;
    if (!name.trim()) {
      setParseError('Checklist name is required');
      return;
    }

    const errors: Record<number, string> = {};
    rows.forEach((r, i) => {
      if (!r.title.trim()) errors[i] = 'Title is required';
    });
    setRowErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsImporting(true);
    try {
      const payload = rows.map((r) => ({
        title: r.title.trim(),
        notes: r.notes.trim() || null,
        time: r.time ? new Date(r.time).toISOString() : null,
      }));
      await api.confirmChecklistImport(name.trim(), payload);
      showToast(`Imported ${payload.length} item(s)`);
      onImported();
    } catch (err: any) {
      setParseError(err.response?.data?.error || 'Failed to import checklist');
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <Modal title="Import Checklist" onClose={onClose}>
      {parseError && <div style={styles.error}>{parseError}</div>}

      {!rows ? (
        <>
          <div style={styles.section}>
            <label style={styles.label}>Source</label>
            <div style={styles.sourceRow}>
              <button
                onClick={() => setSourceMode('file')}
                style={{ ...styles.sourceBtn, ...(sourceMode === 'file' ? styles.sourceBtnActive : {}) }}
              >
                📄 Upload File
              </button>
              <button
                onClick={() => setSourceMode('text')}
                style={{ ...styles.sourceBtn, ...(sourceMode === 'text' ? styles.sourceBtnActive : {}) }}
              >
                📋 Paste Text
              </button>
            </div>
            <p style={styles.hint}>
              {sourceMode === 'file'
                ? 'A PDF, Word doc (.docx), spreadsheet (.xlsx/.xls/.csv), or a photo/screenshot (.jpg/.png) of a checklist — AI-assisted extraction, always review before importing.'
                : 'Paste or type a list — one item per line works best. Times are only picked up where explicitly stated.'}
            </p>
          </div>

          {sourceMode === 'file' ? (
            <div style={styles.section}>
              <label style={styles.label}>File</label>
              <input
                type="file"
                accept=".pdf,.docx,.xlsx,.xls,.csv,.jpg,.jpeg,.png,.txt"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                style={styles.input}
              />
            </div>
          ) : (
            <div style={styles.section}>
              <label style={styles.label}>Text</label>
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder={'Bring badge\nSet up booth by 8am\nRestock brochures\n...'}
                style={styles.textarea}
                rows={8}
              />
            </div>
          )}

          <button
            onClick={handleParse}
            style={styles.primaryBtn}
            disabled={isParsing || (sourceMode === 'file' ? !file : !pastedText.trim())}
          >
            {isParsing ? 'Parsing…' : 'Parse'}
          </button>
        </>
      ) : (
        <>
          <div style={styles.section}>
            <label style={styles.label}>Checklist Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Day 1 Setup"
              style={styles.input}
              maxLength={200}
            />
          </div>

          <p style={styles.reviewHint}>
            Review and edit before importing — nothing is saved yet. {rows.length} item{rows.length === 1 ? '' : 's'} found.
          </p>

          <div style={styles.rowList}>
            {rows.map((row, index) => (
              <div key={index} style={styles.row}>
                <div style={styles.rowHeader}>
                  <input
                    type="text"
                    value={row.title}
                    onChange={(e) => updateRow(index, { title: e.target.value })}
                    placeholder="Title"
                    style={styles.rowTitleInput}
                  />
                  <button onClick={() => removeRow(index)} style={styles.removeBtn} title="Remove this item">
                    ✕
                  </button>
                </div>
                {rowErrors[index] && <div style={styles.rowError}>{rowErrors[index]}</div>}
                <div style={styles.rowGrid}>
                  <input
                    type="datetime-local"
                    value={row.time}
                    onChange={(e) => updateRow(index, { time: e.target.value })}
                    style={styles.rowInput}
                  />
                  <input
                    type="text"
                    value={row.notes}
                    onChange={(e) => updateRow(index, { notes: e.target.value })}
                    placeholder="Notes (optional)"
                    style={styles.rowInput}
                  />
                </div>
              </div>
            ))}
            {rows.length === 0 && <p style={styles.hint}>All items removed. Go back and re-parse to try again.</p>}
          </div>

          <div style={styles.footerActions}>
            <button onClick={() => setRows(null)} style={styles.secondaryBtn} disabled={isImporting}>
              ← Back
            </button>
            <button onClick={handleConfirm} style={styles.primaryBtn} disabled={isImporting || rows.length === 0}>
              {isImporting ? 'Importing…' : `Import ${rows.length} Item${rows.length === 1 ? '' : 's'}`}
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}

const styles = {
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
  sourceRow: {
    display: 'flex',
    gap: '8px',
  },
  sourceBtn: {
    flex: 1,
    padding: '10px 6px',
    border: '1px solid var(--border-strong)',
    borderRadius: '4px',
    backgroundColor: 'var(--surface)',
    color: 'var(--text)',
    cursor: 'pointer',
    fontSize: '13px',
  },
  sourceBtnActive: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
    color: 'white',
  },
  hint: {
    fontSize: '12px',
    color: 'var(--text-faint)',
    marginTop: '8px',
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
    flex: 1,
  },
  secondaryBtn: {
    padding: '10px 20px',
    backgroundColor: 'transparent',
    border: '1px solid var(--border-strong)',
    color: 'var(--text)',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600' as const,
  },
  reviewHint: {
    fontSize: '13px',
    color: 'var(--text-muted)',
    marginBottom: '14px',
  },
  rowList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
    maxHeight: '400px',
    overflowY: 'auto' as const,
    marginBottom: '16px',
  },
  row: {
    backgroundColor: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: '6px',
    padding: '10px',
  },
  rowHeader: {
    display: 'flex',
    gap: '8px',
    marginBottom: '6px',
  },
  rowTitleInput: {
    flex: 1,
    padding: '8px 10px',
    border: '1px solid var(--border-strong)',
    borderRadius: '4px',
    backgroundColor: 'var(--input-bg)',
    color: 'var(--text)',
    fontSize: '14px',
    fontWeight: '600' as const,
    boxSizing: 'border-box' as const,
  },
  removeBtn: {
    flexShrink: 0,
    padding: '0 12px',
    backgroundColor: 'transparent',
    border: '1px solid var(--border-strong)',
    color: 'var(--text-muted)',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
  },
  rowError: {
    fontSize: '12px',
    color: 'var(--danger-text)',
    marginBottom: '6px',
  },
  rowGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 2fr',
    gap: '6px',
  },
  rowInput: {
    padding: '6px 8px',
    border: '1px solid var(--border-strong)',
    borderRadius: '4px',
    backgroundColor: 'var(--input-bg)',
    color: 'var(--text)',
    fontSize: '12px',
    boxSizing: 'border-box' as const,
    minWidth: 0,
  },
  footerActions: {
    display: 'flex',
    gap: '10px',
  },
};
