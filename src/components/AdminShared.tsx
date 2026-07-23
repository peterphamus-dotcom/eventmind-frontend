import type { CSSProperties } from 'react';

/* ============================================================
   Shared chrome for the Admin tabs. Every tab is the same card:
   12px radius, hairline border, the layered shadow, an h2 title.
   Row/pill/button primitives are collected here so eleven files
   don't each redeclare the same tokens with drifting values.
   ============================================================ */

export const styles: Record<string, CSSProperties> = {
  card: {
    backgroundColor: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    padding: 'clamp(18px, 4vw, 28px) clamp(16px, 4vw, 30px)',
    boxShadow: '0 1px 2px oklch(0% 0 0 / 0.03), 0 8px 22px oklch(0% 0 0 / 0.045)',
  },
  title: {
    fontSize: '18px',
    fontWeight: 700,
    margin: '0 0 20px',
  },
  titleTight: {
    fontSize: '18px',
    fontWeight: 700,
    margin: '0 0 6px',
  },
  subtitle: {
    fontSize: '12.5px',
    color: 'var(--text-faint)',
    margin: '0 0 20px',
    lineHeight: 1.5,
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: 700,
    margin: '0 0 10px',
  },

  /* --- add-new row (text input + primary button) --- */
  addRow: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
    flexWrap: 'wrap',
  },
  addInput: {
    flex: '1 1 180px',
    minWidth: '180px',
    padding: '10px 13px',
    border: '1px solid var(--border-strong)',
    borderRadius: '8px',
    backgroundColor: 'var(--surface)',
    color: 'var(--text)',
    fontSize: '14px',
  },
  addBtn: {
    padding: '10px 18px',
    backgroundColor: 'var(--success)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13.5px',
    fontWeight: 600,
    whiteSpace: 'nowrap',
  },

  /* --- filter row --- */
  filterRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '20px',
    flexWrap: 'wrap',
  },
  filterLabel: {
    fontSize: '13.5px',
    fontWeight: 600,
  },
  select: {
    padding: '9px 12px',
    border: '1px solid var(--border-strong)',
    borderRadius: '8px',
    backgroundColor: 'var(--surface)',
    color: 'var(--text)',
    fontSize: '13.5px',
  },
  selectSmall: {
    padding: '8px 11px',
    border: '1px solid var(--border-strong)',
    borderRadius: '7px',
    backgroundColor: 'var(--surface)',
    color: 'var(--text)',
    fontSize: '13.5px',
  },
  input: {
    padding: '9px 12px',
    border: '1px solid var(--border-strong)',
    borderRadius: '8px',
    backgroundColor: 'var(--surface)',
    color: 'var(--text)',
    fontSize: '13.5px',
  },

  /* --- list rows --- */
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  row: {
    padding: '14px 16px',
    backgroundColor: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: '9px',
  },
  rowHead: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
  },
  rowActions: {
    display: 'flex',
    gap: '8px',
    flexShrink: 0,
  },
  empty: {
    fontSize: '13.5px',
    color: 'var(--text-faint)',
    fontStyle: 'italic',
    margin: 0,
  },
  footerCount: {
    fontSize: '13px',
    color: 'var(--text-muted)',
    marginTop: '20px',
  },

  /* --- buttons --- */
  btnPrimary: {
    padding: '6px 12px',
    backgroundColor: 'var(--accent)',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 600,
  },
  btnSuccess: {
    padding: '6px 12px',
    backgroundColor: 'var(--success)',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 600,
  },
  btnDanger: {
    padding: '6px 12px',
    backgroundColor: 'var(--danger)',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 600,
  },
  btnDangerOutline: {
    padding: '8px 15px',
    backgroundColor: 'transparent',
    border: '1px solid var(--danger)',
    color: 'var(--danger-text)',
    borderRadius: '7px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 600,
  },
  btnNeutral: {
    padding: '6px 13px',
    backgroundColor: 'var(--neutral)',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 600,
  },
  btnOutline: {
    padding: '9px 18px',
    backgroundColor: 'transparent',
    border: '1px solid var(--border-strong)',
    color: 'var(--text)',
    borderRadius: '7px',
    cursor: 'pointer',
    fontSize: '13.5px',
    fontWeight: 600,
  },

  /* --- pills --- */
  pillAccent: {
    padding: '3px 10px',
    backgroundColor: 'var(--accent-soft)',
    color: 'var(--accent-text)',
    borderRadius: '12px',
    fontSize: '11.5px',
    fontWeight: 600,
  },
  pillSuccess: {
    padding: '3px 10px',
    backgroundColor: 'var(--success-soft)',
    color: 'var(--success)',
    borderRadius: '12px',
    fontSize: '11.5px',
    fontWeight: 600,
  },
  pillNeutral: {
    padding: '2px 8px',
    backgroundColor: 'var(--border)',
    color: 'var(--text-muted)',
    borderRadius: '6px',
    fontSize: '10.5px',
    fontWeight: 700,
  },
  pillDanger: {
    padding: '2px 8px',
    backgroundColor: 'var(--danger)',
    color: 'white',
    borderRadius: '10px',
    fontSize: '10.5px',
    fontWeight: 700,
  },
  badgeCount: {
    padding: '2px 10px',
    backgroundColor: 'var(--accent)',
    color: 'white',
    borderRadius: '999px',
    fontSize: '12.5px',
    fontWeight: 700,
  },

  /* --- avatar initial circle used in the Users table --- */
  avatarSm: {
    width: '26px',
    height: '26px',
    borderRadius: '50%',
    backgroundColor: 'var(--accent-soft)',
    color: 'var(--accent-text)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11.5px',
    fontWeight: 700,
    flexShrink: 0,
  },

  /* --- table --- */
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    padding: '11px',
    textAlign: 'left',
    fontSize: '12.5px',
    fontWeight: 700,
    color: 'var(--text-secondary)',
  },
  thead: {
    backgroundColor: 'var(--surface-alt)',
    borderBottom: '2px solid var(--border-strong)',
  },
  td: {
    padding: '11px',
    fontSize: '13.5px',
  },
  tr: {
    borderBottom: '1px solid var(--border)',
  },
};

export function DeleteIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export const ROLE_TINT: Record<string, CSSProperties> = {
  ADMIN: { backgroundColor: 'var(--purple)', color: 'white' },
  CORE_TEAM: { backgroundColor: 'var(--accent)', color: 'white' },
  MEMBER: { backgroundColor: 'var(--border)', color: 'var(--text-muted)' },
  EXPO: { backgroundColor: 'var(--success)', color: 'white' },
};

export function roleBadge(role: string): CSSProperties {
  return {
    display: 'inline-block',
    padding: '3px 9px',
    borderRadius: '10px',
    fontSize: '11px',
    fontWeight: 700,
    ...(ROLE_TINT[role] || ROLE_TINT.MEMBER),
  };
}
