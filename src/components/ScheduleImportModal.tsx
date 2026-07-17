import { useState } from 'react';
import { api } from '../api';
import { useToast } from '../Toast';
import { Modal } from './Modal';
import type { Location, ScheduleImportSourceType } from '../types';

interface ScheduleImportModalProps {
  locations: Location[];
  onClose: () => void;
  onImported: () => void;
}

interface DraftRow {
  title: string;
  description: string;
  startTime: string; // datetime-local value
  endTime: string; // datetime-local value
  locationId: string;
}

const SOURCE_OPTIONS: { value: ScheduleImportSourceType; label: string; accept: string; hint: string }[] = [
  { value: 'ICS', label: '📅 Calendar (.ics)', accept: '.ics', hint: 'An .ics file exported from Google Calendar or similar.' },
  { value: 'EXCEL', label: '📊 Excel', accept: '.xls,.xlsx', hint: 'A spreadsheet with Title/Start/End/Location/Description columns.' },
  { value: 'PDF', label: '📄 PDF', accept: '.pdf', hint: 'AI-assisted extraction — always review before importing.' },
  { value: 'IMAGE', label: '🖼️ Image', accept: 'image/jpeg,image/png', hint: 'A JPG or PNG photo of a printed schedule, whiteboard, or screenshot — AI-assisted extraction, always review before importing.' },
];

function toLocalInputValue(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Admin-only: upload an .ics/.xlsx/.pdf schedule export, review the parsed
 * draft items (editable), then confirm to bulk-create them. Nothing is
 * saved until the reviewer explicitly confirms.
 */
export function ScheduleImportModal({ locations, onClose, onImported }: ScheduleImportModalProps) {
  const showToast = useToast();
  const [sourceType, setSourceType] = useState<ScheduleImportSourceType>('ICS');
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [rows, setRows] = useState<DraftRow[] | null>(null);
  const [rowErrors, setRowErrors] = useState<Record<number, string>>({});
  const [isImporting, setIsImporting] = useState(false);

  async function handleParse() {
    if (!file || isParsing) return;
    setIsParsing(true);
    setParseError(null);
    try {
      const response = await api.previewScheduleImport(file, sourceType);
      const drafts = response.data.data?.items || [];
      setRows(
        drafts.map((d) => ({
          title: d.title,
          description: d.description || '',
          startTime: toLocalInputValue(d.startTime),
          endTime: toLocalInputValue(d.endTime),
          locationId: d.suggestedLocationId || '',
        }))
      );
      if (drafts.length === 0) setParseError('No items were found in that file.');
    } catch (err: any) {
      setParseError(err.response?.data?.error || 'Failed to parse file');
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

    const errors: Record<number, string> = {};
    rows.forEach((r, i) => {
      if (!r.title.trim()) errors[i] = 'Title is required';
      else if (!r.startTime) errors[i] = 'Start time is required';
    });
    setRowErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsImporting(true);
    try {
      const payload = rows.map((r) => ({
        title: r.title.trim(),
        description: r.description.trim() || null,
        startTime: new Date(r.startTime).toISOString(),
        endTime: r.endTime ? new Date(r.endTime).toISOString() : null,
        locationId: r.locationId || null,
      }));
      const response = await api.confirmScheduleImport(payload);
      showToast(`Imported ${response.data.data?.created ?? payload.length} schedule item(s)`);
      onImported();
    } catch (err: any) {
      const serverErrors = err.response?.data?.data?.errors as { index: number; message: string }[] | undefined;
      if (serverErrors) {
        setRowErrors(Object.fromEntries(serverErrors.map((e) => [e.index, e.message])));
      }
      setParseError(err.response?.data?.error || 'Failed to import schedule items');
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <Modal title="Import Schedule" onClose={onClose}>
      {parseError && <div style={styles.error}>{parseError}</div>}

      {!rows ? (
        <>
          <div style={styles.section}>
            <label style={styles.label}>Source</label>
            <div style={styles.sourceRow}>
              {SOURCE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setSourceType(opt.value);
                    setFile(null);
                  }}
                  style={{ ...styles.sourceBtn, ...(sourceType === opt.value ? styles.sourceBtnActive : {}) }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p style={styles.hint}>{SOURCE_OPTIONS.find((o) => o.value === sourceType)?.hint}</p>
          </div>

          <div style={styles.section}>
            <label style={styles.label}>File</label>
            <input
              type="file"
              accept={SOURCE_OPTIONS.find((o) => o.value === sourceType)?.accept}
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              style={styles.input}
            />
          </div>

          <button onClick={handleParse} style={styles.primaryBtn} disabled={!file || isParsing}>
            {isParsing ? 'Parsing…' : 'Parse File'}
          </button>
        </>
      ) : (
        <>
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
                    value={row.startTime}
                    onChange={(e) => updateRow(index, { startTime: e.target.value })}
                    style={styles.rowInput}
                  />
                  <input
                    type="datetime-local"
                    value={row.endTime}
                    onChange={(e) => updateRow(index, { endTime: e.target.value })}
                    style={styles.rowInput}
                  />
                  <select
                    value={row.locationId}
                    onChange={(e) => updateRow(index, { locationId: e.target.value })}
                    style={styles.rowInput}
                  >
                    <option value="">No location</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                </div>
                <input
                  type="text"
                  value={row.description}
                  onChange={(e) => updateRow(index, { description: e.target.value })}
                  placeholder="Description (optional)"
                  style={styles.rowDescInput}
                />
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
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '6px',
    marginBottom: '6px',
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
  rowDescInput: {
    width: '100%',
    padding: '6px 8px',
    border: '1px solid var(--border-strong)',
    borderRadius: '4px',
    backgroundColor: 'var(--input-bg)',
    color: 'var(--text)',
    fontSize: '12px',
    boxSizing: 'border-box' as const,
  },
  footerActions: {
    display: 'flex',
    gap: '10px',
  },
};
