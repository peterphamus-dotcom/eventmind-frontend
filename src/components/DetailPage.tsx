import type { ReactNode, CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';

/* ============================================================
   Shared chrome for the detail pages — ticket, report, schedule
   item, and public user profile.

   All four are a header bar over a single elevated card divided
   into labelled sections, so the shell lives here and the section
   styles below are shared rather than re-declared in each page.
   ============================================================ */

const ChevronLeft = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

interface DetailPageProps {
  title?: string;
  /** Where the back button goes. Defaults to the dashboard. */
  backTo?: string;
  /** Overrides backTo — used by pages that return to wherever you came from. */
  onBack?: () => void;
  backLabel?: string;
  /** Narrower for profile-style pages; the record pages use the default. */
  maxWidth?: string;
  /** Extra controls in the header bar, right-aligned. */
  headerExtra?: ReactNode;
  children: ReactNode;
}

export function DetailPage({
  title,
  backTo = '/dashboard',
  onBack,
  backLabel = 'Back to Dashboard',
  maxWidth,
  headerExtra,
  children,
}: DetailPageProps) {
  const navigate = useNavigate();

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={onBack ?? (() => navigate(backTo))} style={styles.backBtn}>
          {ChevronLeft}
          {backLabel}
        </button>
        {title && <h1 style={styles.title}>{title}</h1>}
        {headerExtra && <div style={styles.headerExtra}>{headerExtra}</div>}
      </div>

      <div style={{ ...styles.content, ...(maxWidth ? { maxWidth } : {}) }}>
        <div style={styles.card}>{children}</div>
      </div>
    </div>
  );
}

/** A labelled block inside the card. The last one drops its rule. */
export function DetailSection({
  title,
  last = false,
  children,
}: {
  title?: string;
  last?: boolean;
  children: ReactNode;
}) {
  return (
    <div style={last ? styles.sectionLast : styles.section}>
      {title && <h3 style={styles.sectionTitle}>{title}</h3>}
      {children}
    </div>
  );
}

/** One label/value line in a Details block. */
export function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={styles.detailRow}>
      <span style={styles.detailLabel}>{label}</span>
      <span style={styles.detailValue}>{children}</span>
    </div>
  );
}

export const styles: Record<string, CSSProperties> = {
  container: {
    minHeight: '100vh',
    backgroundColor: 'var(--bg)',
    color: 'var(--text)',
  },
  header: {
    backgroundColor: 'var(--surface)',
    padding: '20px clamp(16px, 4vw, 40px)',
    borderBottom: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    gap: '18px',
    flexWrap: 'wrap',
  },
  backBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--accent)',
    fontSize: '13.5px',
    fontWeight: 600,
    cursor: 'pointer',
    padding: 0,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
  },
  title: {
    fontSize: '19px',
    fontWeight: 700,
    margin: 0,
  },
  headerExtra: {
    marginLeft: 'auto',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  content: {
    maxWidth: '840px',
    margin: '36px auto',
    padding: '0 20px',
  },
  card: {
    backgroundColor: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '14px',
    padding: 'clamp(18px, 4vw, 30px) clamp(16px, 4vw, 34px)',
    boxShadow: '0 1px 2px oklch(0% 0 0 / 0.03), 0 10px 26px oklch(0% 0 0 / 0.05)',
  },
  section: {
    paddingBottom: '22px',
    marginBottom: '22px',
    borderBottom: '1px solid var(--border)',
  },
  sectionLast: {},
  sectionTitle: {
    fontSize: '14.5px',
    fontWeight: 700,
    margin: '0 0 14px',
    color: 'var(--text)',
  },
  /** Larger heading for the lead section of a page. */
  leadTitle: {
    fontSize: '16px',
    fontWeight: 700,
    margin: '0 0 12px',
    color: 'var(--text)',
  },
  bodyText: {
    fontSize: '14.5px',
    lineHeight: 1.6,
    color: 'var(--text-muted)',
    margin: '0 0 14px',
    whiteSpace: 'pre-wrap',
  },
  details: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    fontSize: '13.5px',
  },
  detailRow: {
    display: 'flex',
    gap: '14px',
    flexWrap: 'wrap',
  },
  detailLabel: {
    fontWeight: 600,
    minWidth: '140px',
    color: 'var(--text)',
  },
  detailValue: {
    color: 'var(--text-secondary)',
  },
  userLink: {
    color: 'var(--accent)',
    textDecoration: 'none',
    fontWeight: 600,
  },
  tags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  tag: {
    display: 'inline-block',
    padding: '5px 12px',
    backgroundColor: 'var(--accent-soft)',
    color: 'var(--accent-text)',
    borderRadius: '16px',
    fontSize: '12.5px',
    fontWeight: 600,
  },
  photoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: '14px',
  },
  photo: {
    width: '100%',
    aspectRatio: '1',
    objectFit: 'cover',
    borderRadius: '9px',
    display: 'block',
    backgroundColor: 'var(--bg)',
  },
  photoCaption: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    margin: '6px 0 0',
  },
  photoDate: {
    fontSize: '11.5px',
    color: 'var(--text-faint)',
    margin: '2px 0 0',
  },
  actions: {
    display: 'flex',
    gap: '10px',
    marginTop: '26px',
    flexWrap: 'wrap',
  },
  primaryBtn: {
    flex: 1,
    padding: '11px 18px',
    backgroundColor: 'var(--accent)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13.5px',
    fontWeight: 600,
  },
  secondaryBtn: {
    flex: 1,
    padding: '11px 18px',
    backgroundColor: 'transparent',
    border: '1px solid var(--border-strong)',
    color: 'var(--text)',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13.5px',
    fontWeight: 600,
  },
  /** Bell toggle shown next to the reaction row. */
  subscribeBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: '5px 11px',
    fontSize: '12.5px',
    fontWeight: 600,
    backgroundColor: 'transparent',
    // Longhand: subscribeBtnActive overrides borderColor alone, and mixing
    // that with the border shorthand makes React warn on every toggle.
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'var(--border-strong)',
    borderRadius: '14px',
    cursor: 'pointer',
    color: 'var(--text-muted)',
  },
  subscribeBtnActive: {
    backgroundColor: 'var(--warning-soft2)',
    borderColor: 'var(--warning-alt)',
    color: 'var(--warning-text2)',
  },
  reactionRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  loading: {
    padding: '40px 20px',
    fontSize: '15px',
    color: 'var(--text-muted)',
    textAlign: 'center',
  },
  error: {
    margin: '40px auto',
    maxWidth: '600px',
    padding: '14px 18px',
    fontSize: '14px',
    color: 'var(--danger-text)',
    backgroundColor: 'var(--danger-soft)',
    borderRadius: '10px',
  },
};

export const BellIcon = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);
