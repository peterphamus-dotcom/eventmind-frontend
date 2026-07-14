import { useState } from 'react';
import type { Location } from '../types';

interface LocationFilterProps {
  locations: Location[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

/**
 * Multi-select location filter: a button that opens a checkbox popover.
 * Empty selection means "all locations".
 */
export function LocationFilter({ locations, selectedIds, onChange }: LocationFilterProps) {
  const [open, setOpen] = useState(false);

  function toggle(id: string) {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((x) => x !== id)
        : [...selectedIds, id]
    );
  }

  const label =
    selectedIds.length === 0
      ? 'All locations'
      : selectedIds.length === 1
        ? locations.find((l) => l.id === selectedIds[0])?.name || '1 location'
        : `${selectedIds.length} locations`;

  return (
    <div style={styles.anchor}>
      <button type="button" onClick={() => setOpen(!open)} style={styles.button}>
        {label} ▾
      </button>
      {open && (
        <>
          <div style={styles.backdrop} onClick={() => setOpen(false)} />
          <div style={styles.popover}>
            <button
              type="button"
              onClick={() => onChange([])}
              style={{
                ...styles.item,
                fontWeight: selectedIds.length === 0 ? '700' : '400',
              }}
            >
              {selectedIds.length === 0 ? '✓ ' : ''}All locations
            </button>
            {locations.map((loc) => (
              <button
                key={loc.id}
                type="button"
                onClick={() => toggle(loc.id)}
                style={{
                  ...styles.item,
                  fontWeight: selectedIds.includes(loc.id) ? '700' : '400',
                }}
              >
                {selectedIds.includes(loc.id) ? '✓ ' : ''}
                {loc.name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const styles = {
  anchor: {
    position: 'relative' as const,
    flex: 1,
    minWidth: 0,
  },
  button: {
    width: '100%',
    padding: '8px 10px',
    border: '1px solid var(--border-strong)',
    borderRadius: '4px',
    backgroundColor: 'var(--input-bg)',
    color: 'var(--text)',
    cursor: 'pointer',
    fontSize: '16px',
    textAlign: 'left' as const,
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden' as const,
    textOverflow: 'ellipsis' as const,
  },
  backdrop: {
    position: 'fixed' as const,
    inset: 0,
    zIndex: 10,
  },
  popover: {
    position: 'absolute' as const,
    top: 'calc(100% + 4px)',
    left: 0,
    zIndex: 11,
    backgroundColor: 'var(--surface)',
    border: '1px solid var(--border-strong)',
    borderRadius: '6px',
    boxShadow: '0 4px 16px var(--shadow)',
    minWidth: '200px',
    maxHeight: '260px',
    overflowY: 'auto' as const,
    padding: '4px 0',
  },
  item: {
    display: 'block',
    width: '100%',
    textAlign: 'left' as const,
    padding: '10px 14px',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    color: 'var(--text)',
  },
};
