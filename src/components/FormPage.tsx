import type { ReactNode, CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';

/* ============================================================
   Shared chrome for the create forms — CreateTicket, CreateReport
   — and other single-card form pages (Profile uses the styles but
   not the shell, since its card is sectioned rather than a plain
   field stack).
   ============================================================ */

const ChevronLeft = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

interface FormPageProps {
  title: string;
  onSubmit: (e: React.FormEvent) => void;
  children: ReactNode;
}

export function FormPage({ title, onSubmit, children }: FormPageProps) {
  const navigate = useNavigate();

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={() => navigate('/dashboard')} style={styles.backBtn}>
          {ChevronLeft}
          Back to Dashboard
        </button>
        <h1 style={styles.title}>{title}</h1>
      </div>

      <div style={styles.content}>
        <form style={styles.card} onSubmit={onSubmit}>
          {children}
        </form>
      </div>
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
    padding: '16px clamp(16px, 4vw, 40px)',
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
    fontSize: '20px',
    fontWeight: 700,
    margin: 0,
  },
  content: {
    maxWidth: '760px',
    margin: 'clamp(16px, 4vw, 32px) auto',
    padding: '0 20px',
  },
  card: {
    backgroundColor: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '14px',
    padding: 'clamp(20px, 4vw, 32px)',
    boxShadow: '0 1px 2px oklch(0% 0 0 / 0.03), 0 10px 26px oklch(0% 0 0 / 0.05)',
    display: 'flex',
    flexDirection: 'column',
    gap: '22px',
  },

  /* --- field primitives, shared by both create forms and Profile --- */
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '18px',
  },
  label: {
    fontSize: '13.5px',
    fontWeight: 600,
    color: 'var(--text)',
  },
  uppercaseLabel: {
    display: 'block',
    fontSize: '11px',
    fontWeight: 700,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '7px',
  },
  input: {
    padding: '11px 13px',
    border: '1px solid var(--border-strong)',
    borderRadius: '9px',
    fontSize: '14.5px',
    fontFamily: 'inherit',
    backgroundColor: 'var(--surface)',
    color: 'var(--text)',
    boxSizing: 'border-box',
    width: '100%',
  },
  textarea: {
    padding: '12px 13px',
    border: '1px solid var(--border-strong)',
    borderRadius: '9px',
    fontSize: '14.5px',
    fontFamily: 'inherit',
    resize: 'vertical',
    backgroundColor: 'var(--surface)',
    color: 'var(--text)',
    boxSizing: 'border-box',
    width: '100%',
  },
  select: {
    padding: '11px 13px',
    border: '1px solid var(--border-strong)',
    borderRadius: '9px',
    fontSize: '14.5px',
    fontFamily: 'inherit',
    backgroundColor: 'var(--surface)',
    color: 'var(--text)',
  },
  readOnlyValue: {
    padding: '11px 13px',
    fontSize: '14.5px',
    color: 'var(--text-muted)',
    backgroundColor: 'var(--bg)',
    borderRadius: '9px',
  },
  tagGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
    gap: '8px',
  },
  tagButton: {
    padding: '8px 12px',
    // Longhand: tagButtonActive overrides borderColor alone, and mixing
    // that with the border shorthand makes React warn on every toggle.
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'var(--border-strong)',
    borderRadius: '9px',
    backgroundColor: 'var(--surface)',
    color: 'var(--text)',
    cursor: 'pointer',
    fontSize: '13px',
  },
  tagButtonActive: {
    backgroundColor: 'var(--accent)',
    color: 'white',
    borderColor: 'var(--accent)',
  },
  error: {
    padding: '11px 14px',
    backgroundColor: 'var(--danger-soft)',
    color: 'var(--danger-text)',
    borderRadius: '9px',
    fontSize: '14px',
  },
  loadWarning: {
    fontSize: '13px',
    color: 'var(--danger-text)',
    margin: 0,
  },
  retryBtn: {
    fontSize: '13px',
    color: 'var(--accent)',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 600,
    padding: 0,
    textDecoration: 'underline',
    minHeight: 'auto',
  },
  actions: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },
  submitBtn: {
    flex: '1 1 140px',
    padding: '11px 18px',
    backgroundColor: 'var(--success)',
    color: 'white',
    border: 'none',
    borderRadius: '9px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 600,
  },
  cancelBtn: {
    flex: '1 1 140px',
    padding: '11px 18px',
    backgroundColor: 'transparent',
    border: '1px solid var(--border-strong)',
    color: 'var(--text)',
    borderRadius: '9px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 600,
  },
};

export function MapPinFilled({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="var(--accent)" stroke="white" strokeWidth="1">
      <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7z" />
      <circle cx="12" cy="9" r="2.5" fill="white" />
    </svg>
  );
}
