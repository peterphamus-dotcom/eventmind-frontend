import { useState } from 'react';
import { Modal } from './Modal';
import type { TabId, TabSettingsMap, TabSettingsPatch } from '../types';
import { COMMENTABLE_TAB_IDS } from '../types';

const TAB_META: { id: TabId; label: string }[] = [
  { id: 'tickets', label: 'Tickets' },
  { id: 'reports', label: 'Reports' },
  { id: 'floorplan', label: 'Floorplan' },
  { id: 'library', label: 'Library' },
  { id: 'schedule', label: 'Schedule' },
  { id: 'sideSchedule', label: 'Side Schedule' },
  { id: 'community', label: 'Community' },
];

type TriState = 'default' | 'on' | 'off';

interface RowState {
  visible: TriState;
  canComment: TriState;
}

function toRowState(setting?: TabSettingsMap[TabId]): RowState {
  return {
    visible: setting?.visible === undefined ? 'default' : setting.visible ? 'on' : 'off',
    canComment: setting?.canComment === undefined ? 'default' : setting.canComment ? 'on' : 'off',
  };
}

function toInitialRows(tabSettings?: TabSettingsMap | null): Record<TabId, RowState> {
  const rows = {} as Record<TabId, RowState>;
  for (const { id } of TAB_META) rows[id] = toRowState(tabSettings?.[id]);
  return rows;
}

interface TabAccessModalProps {
  /** Shown in the modal title, e.g. a user's name or a team's name. */
  subjectLabel: string;
  /** Whether this edits a user's own override or a team's default. */
  scope: 'user' | 'team';
  /** Existing raw overrides (not the effective/resolved settings). */
  tabSettings?: TabSettingsMap | null;
  onSave: (patch: TabSettingsPatch) => Promise<void>;
  onClose: () => void;
}

/**
 * Shared per-tab visibility + comment-permission editor, used for both a
 * single user's override and a team's default. Each row is independently
 * "Default" (inherit team/role), "Show/Allow", or "Hide/Restrict" — saving
 * sends only the tabs that differ from their current stored state, as a
 * full replace per tab (see backend applyTabSettingsPatch).
 */
export function TabAccessModal({ subjectLabel, scope, tabSettings, onSave, onClose }: TabAccessModalProps) {
  const [rows, setRows] = useState<Record<TabId, RowState>>(() => toInitialRows(tabSettings));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setField(tabId: TabId, field: keyof RowState, value: TriState) {
    setRows((prev) => ({ ...prev, [tabId]: { ...prev[tabId], [field]: value } }));
  }

  async function handleSave() {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      const patch: TabSettingsPatch = {};
      for (const { id } of TAB_META) {
        const row = rows[id];
        const commentable = COMMENTABLE_TAB_IDS.includes(id);
        if (row.visible === 'default' && (!commentable || row.canComment === 'default')) {
          patch[id] = null;
          continue;
        }
        patch[id] = {
          ...(row.visible !== 'default' ? { visible: row.visible === 'on' } : {}),
          ...(commentable && row.canComment !== 'default' ? { canComment: row.canComment === 'on' } : {}),
        };
      }
      await onSave(patch);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save access settings');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={`Manage Access — ${subjectLabel}`} onClose={onClose}>
      <p style={styles.subtext}>
        Choose which dashboard tabs are visible and where commenting is allowed. "Default" inherits{' '}
        {scope === 'user' ? "this user's team setting, or the role default if no team overrides it" : 'the role default'}.
      </p>
      {error && <div style={styles.error}>{error}</div>}
      <div style={styles.table}>
        <div style={styles.headerRow}>
          <span style={styles.headerTab}>Tab</span>
          <span style={styles.headerCol}>Visibility</span>
          <span style={styles.headerCol}>Comments</span>
        </div>
        {TAB_META.map(({ id, label }) => {
          const commentable = COMMENTABLE_TAB_IDS.includes(id);
          const row = rows[id];
          return (
            <div key={id} style={styles.row}>
              <span style={styles.tabLabel}>{label}</span>
              <select
                value={row.visible}
                onChange={(e) => setField(id, 'visible', e.target.value as TriState)}
                style={styles.select}
              >
                <option value="default">Default</option>
                <option value="on">Show</option>
                <option value="off">Hide</option>
              </select>
              {commentable ? (
                <select
                  value={row.canComment}
                  onChange={(e) => setField(id, 'canComment', e.target.value as TriState)}
                  style={styles.select}
                >
                  <option value="default">Default</option>
                  <option value="on">Allow</option>
                  <option value="off">Restrict</option>
                </select>
              ) : (
                <span style={styles.dash}>—</span>
              )}
            </div>
          );
        })}
      </div>
      <div style={styles.actions}>
        <button onClick={handleSave} disabled={saving} style={styles.btnPrimary}>
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button onClick={onClose} style={styles.btnSecondary}>
          Cancel
        </button>
      </div>
    </Modal>
  );
}

const styles: Record<string, React.CSSProperties> = {
  subtext: {
    fontSize: '13px',
    color: 'var(--text-muted)',
    margin: '0 0 16px',
    lineHeight: 1.5,
  },
  error: {
    padding: '11px 13px',
    backgroundColor: 'var(--danger-soft)',
    color: 'var(--danger-text)',
    borderRadius: '9px',
    fontSize: '13px',
    marginBottom: '14px',
  },
  table: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    marginBottom: '18px',
  },
  headerRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 110px 110px',
    gap: '8px',
    padding: '0 4px 6px',
  },
  headerTab: {
    fontSize: '11px',
    fontWeight: 700,
    color: 'var(--text-faint)',
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
  },
  headerCol: {
    fontSize: '11px',
    fontWeight: 700,
    color: 'var(--text-faint)',
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
    textAlign: 'center',
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 110px 110px',
    gap: '8px',
    alignItems: 'center',
    padding: '7px 4px',
    borderTop: '1px solid var(--border)',
  },
  tabLabel: {
    fontSize: '13.5px',
    fontWeight: 600,
    color: 'var(--text)',
  },
  select: {
    fontSize: '12.5px',
    padding: '5px 6px',
    borderRadius: '6px',
    border: '1px solid var(--border-strong)',
    backgroundColor: 'var(--surface)',
    color: 'var(--text)',
  },
  dash: {
    textAlign: 'center',
    color: 'var(--text-faint)',
  },
  actions: {
    display: 'flex',
    gap: '10px',
  },
  btnPrimary: {
    padding: '10px 18px',
    backgroundColor: 'var(--accent)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13.5px',
    fontWeight: 600,
  },
  btnSecondary: {
    padding: '10px 18px',
    backgroundColor: 'var(--neutral)',
    color: 'var(--text)',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13.5px',
    fontWeight: 600,
  },
};
