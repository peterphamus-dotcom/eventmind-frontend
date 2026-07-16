import { useState, useMemo } from 'react';
import type { Location } from '../types';

interface LocationFilterProps {
  locations: Location[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

// Below this many locations, a search box just adds clutter to the popover.
const SEARCH_THRESHOLD = 8;

/**
 * Multi-select location filter: a button that opens a checkbox popover.
 * Empty selection means "all locations". Shows a quick clear chip once
 * something is selected, and a type-to-filter box once the location list
 * is long enough to need it.
 */
export function LocationFilter({ locations, selectedIds, onChange }: LocationFilterProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  function toggle(id: string) {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((x) => x !== id)
        : [...selectedIds, id]
    );
  }

  function close() {
    setOpen(false);
    setQuery('');
  }

  const label =
    selectedIds.length === 0
      ? 'All locations'
      : selectedIds.length === 1
        ? locations.find((l) => l.id === selectedIds[0])?.name || '1 location'
        : `${selectedIds.length} locations`;

  const filteredLocations = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return locations;
    return locations.filter((l) => l.name.toLowerCase().includes(q));
  }, [locations, query]);

  return (
    <div style={styles.anchor}>
      <div style={styles.row}>
        <button type="button" onClick={() => setOpen(!open)} style={styles.button}>
          {label} ▾
        </button>
        {selectedIds.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            style={styles.clearBtn}
            aria-label="Clear location filter"
            title="Clear location filter"
          >
            ✕
          </button>
        )}
      </div>
      {open && (
        <>
          <div style={styles.backdrop} onClick={close} />
          <div style={styles.popover}>
            {locations.length > SEARCH_THRESHOLD && (
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter locations…"
                style={styles.search}
                autoFocus
              />
            )}
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
            {filteredLocations.map((loc) => (
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
            {filteredLocations.length === 0 && (
              <p style={styles.noResults}>No locations match "{query}"</p>
            )}
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
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    width: '100%',
    position: 'relative' as const,
    zIndex: 11,
  },
  button: {
    flex: 1,
    minWidth: 0,
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
  clearBtn: {
    flexShrink: 0,
    padding: '8px 10px',
    border: '1px solid var(--border-strong)',
    borderRadius: '4px',
    backgroundColor: 'var(--input-bg)',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    fontSize: '13px',
    lineHeight: 1,
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
    maxHeight: '300px',
    overflowY: 'auto' as const,
    padding: '4px 0',
  },
  search: {
    display: 'block',
    boxSizing: 'border-box' as const,
    width: 'calc(100% - 20px)',
    margin: '4px 10px 8px',
    padding: '6px 8px',
    border: '1px solid var(--border-strong)',
    borderRadius: '4px',
    backgroundColor: 'var(--bg)',
    color: 'var(--text)',
    fontSize: '13px',
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
  noResults: {
    padding: '10px 14px',
    fontSize: '13px',
    color: 'var(--text-faint)',
    fontStyle: 'italic' as const,
    margin: 0,
  },
};
