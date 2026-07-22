import type { CSSProperties } from 'react';

/* ============================================================
   Badge tints and the small line icons the list panels share.
   Kept together so tickets, reports, and the detail pages read
   the same urgency at a glance.
   ============================================================ */

const CHIP: CSSProperties = {
  padding: '3px 9px',
  borderRadius: '999px',
  fontSize: '10.5px',
  fontWeight: 700,
  letterSpacing: '0.02em',
  whiteSpace: 'nowrap',
};

/** Amber is too light to carry white text, so MEDIUM gets a dark label. */
const URGENCY_TINT: Record<string, CSSProperties> = {
  HIGH: { backgroundColor: 'var(--danger)', color: 'white' },
  MEDIUM: { backgroundColor: 'var(--warning)', color: 'var(--warning-text-on)' },
  LOW: { backgroundColor: 'var(--success)', color: 'white' },
};

const STATUS_TINT: Record<string, CSSProperties> = {
  OPEN: { backgroundColor: 'var(--accent)', color: 'white' },
  IN_PROGRESS: { backgroundColor: 'var(--warning)', color: 'var(--warning-text-on)' },
  RESOLVED: { backgroundColor: 'var(--success)', color: 'white' },
  ARCHIVED: { backgroundColor: 'var(--neutral)', color: 'white' },
};

export const urgencyBadge = (urgency: string): CSSProperties => ({
  ...CHIP,
  ...(URGENCY_TINT[urgency] || URGENCY_TINT.LOW),
});

export const statusBadge = (status: string): CSSProperties => ({
  ...CHIP,
  ...(STATUS_TINT[status] || STATUS_TINT.ARCHIVED),
});

/** Left rail colour on a list card — the urgency read before any text. */
export const urgencyRail = (urgency: string): string =>
  urgency === 'HIGH' ? 'var(--danger)' : urgency === 'MEDIUM' ? 'var(--warning)' : 'var(--success)';

export function LocationIcon({ size = 11 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

export function PinIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="var(--accent)" style={{ flexShrink: 0 }}>
      <path d="M12 2a5 5 0 0 0-5 5c0 2.4 1.3 4 2.5 5.2L6 17h5v5l1 2 1-2v-5h5l-3.5-4.8C15.7 11 17 9.4 17 7a5 5 0 0 0-5-5z" />
    </svg>
  );
}

export function StarIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="var(--warning-alt)" style={{ flexShrink: 0 }}>
      <polygon points="12 2 15 9 22 9.5 17 14.5 18.5 22 12 18 5.5 22 7 14.5 2 9.5 9 9 12 2" />
    </svg>
  );
}

export function PlusIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

export function SortIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="var(--neutral)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <polyline points="7 15 12 20 17 15" />
      <polyline points="7 9 12 4 17 9" />
    </svg>
  );
}

export function MapPinOutlineIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="var(--neutral)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

/** Dashed "add new" affordance at the top of each list. */
export const addCardStyle: CSSProperties = {
  backgroundColor: 'transparent',
  padding: '15px',
  borderRadius: '10px',
  border: '1.5px dashed var(--border-dashed)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '7px',
  color: 'var(--text-muted)',
  fontSize: '14px',
  fontWeight: 600,
  marginBottom: '22px',
};
