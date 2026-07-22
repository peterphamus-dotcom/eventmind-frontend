import { useState } from 'react';
import type { ReactionSummary } from '../types';

const PALETTE = ['👍', '❤️', '🎉', '👀', '🚨', '✅'];

interface ReactionBarProps {
  reactions: ReactionSummary[];
  /** Toggle an emoji; resolves to the target's fresh reaction summary */
  onToggle: (emoji: string) => Promise<ReactionSummary[]>;
}

export function ReactionBar({ reactions, onToggle }: ReactionBarProps) {
  const [current, setCurrent] = useState<ReactionSummary[]>(reactions);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function toggle(emoji: string) {
    if (busy) return;
    setBusy(true);
    setPickerOpen(false);
    try {
      const updated = await onToggle(emoji);
      setCurrent(updated);
    } catch {
      // leave state unchanged on failure
    } finally {
      setBusy(false);
    }
  }

  const active = current.filter((r) => r.count > 0);

  return (
    <div style={styles.bar}>
      {active.map((r) => (
        <button
          key={r.emoji}
          type="button"
          onClick={() => toggle(r.emoji)}
          disabled={busy}
          style={{
            ...styles.chip,
            ...(r.reactedByMe ? styles.chipActive : {}),
          }}
          title={r.reactedByMe ? 'Remove your reaction' : 'Add your reaction'}
        >
          <span style={styles.emoji}>{r.emoji}</span>
          <span style={styles.count}>{r.count}</span>
        </button>
      ))}

      <div style={styles.pickerAnchor}>
        <button
          type="button"
          onClick={() => setPickerOpen((o) => !o)}
          disabled={busy}
          style={styles.addBtn}
          title="Add a reaction"
        >
          🙂+
        </button>
        {pickerOpen && (
          <>
            <div style={styles.backdrop} onClick={() => setPickerOpen(false)} />
            <div style={styles.picker}>
              {PALETTE.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => toggle(emoji)}
                  style={styles.pickerEmoji}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  bar: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flexWrap: 'wrap' as const,
  },
  chip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '3px 9px',
    borderRadius: '14px',
    border: '1px solid var(--border-strong)',
    backgroundColor: 'var(--surface)',
    cursor: 'pointer',
    fontSize: '12.5px',
    lineHeight: 1,
    color: 'var(--text)',
  },
  chipActive: {
    backgroundColor: 'var(--accent-soft)',
    borderColor: 'var(--accent)',
  },
  emoji: {
    fontSize: '14px',
  },
  count: {
    fontWeight: '600' as const,
    color: 'var(--text)',
  },
  pickerAnchor: {
    position: 'relative' as const,
    display: 'inline-flex',
  },
  addBtn: {
    padding: '3px 9px',
    borderRadius: '14px',
    border: '1px dashed var(--border-strong)',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    fontSize: '12.5px',
    lineHeight: 1,
    color: 'var(--text-muted)',
  },
  backdrop: {
    position: 'fixed' as const,
    inset: 0,
    zIndex: 10,
  },
  picker: {
    position: 'absolute' as const,
    top: 'calc(100% + 4px)',
    left: 0,
    zIndex: 11,
    display: 'flex',
    gap: '4px',
    padding: '6px 8px',
    backgroundColor: 'var(--surface)',
    border: '1px solid var(--border-strong)',
    borderRadius: '8px',
    boxShadow: '0 4px 16px var(--shadow)',
  },
  pickerEmoji: {
    fontSize: '20px',
    lineHeight: 1,
    padding: '2px',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
  },
};
