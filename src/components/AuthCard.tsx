import type { ReactNode, CSSProperties } from 'react';

/* ============================================================
   Shared chrome for the logged-out screens — login, signup,
   email verification, invite acceptance.

   These six screens are the same card with different contents,
   so the shell lives here and the form styles below are shared
   rather than re-declared in each page.
   ============================================================ */

/** Tint of the 44px rounded badge above the heading. */
export type BadgeTone = 'accent' | 'soft' | 'danger';

const BADGE_TONE: Record<BadgeTone, CSSProperties> = {
  // Solid accent, white glyph — the primary action on the screen.
  accent: { backgroundColor: 'var(--accent)', color: 'white' },
  // Tinted, accent glyph — informational states.
  soft: { backgroundColor: 'var(--accent-soft)', color: 'var(--accent-text)' },
  danger: { backgroundColor: 'var(--danger-soft)', color: 'var(--danger-text)' },
};

interface AuthCardProps {
  /** Icon badge above the heading. Omit for screens that lead with a spinner. */
  icon?: ReactNode;
  tone?: BadgeTone;
  title: string;
  /** 24px for the screens that lead a flow, 20px for terminal states. */
  titleSize?: number;
  /** Supporting line under the title. */
  subtitle?: ReactNode;
  /** Centers the badge and text — used by the verify-email states. */
  centered?: boolean;
  children?: ReactNode;
  /** Rendered below the children, outside the form flow. */
  footer?: ReactNode;
}

export function AuthCard({
  icon,
  tone = 'accent',
  title,
  titleSize = 22,
  subtitle,
  centered = false,
  children,
  footer,
}: AuthCardProps) {
  return (
    <div style={styles.container}>
      <div style={{ ...styles.card, ...(centered ? styles.cardCentered : {}) }}>
        {icon && (
          <div
            style={{
              ...styles.badge,
              ...BADGE_TONE[tone],
              ...(centered ? styles.badgeCentered : {}),
            }}
          >
            {icon}
          </div>
        )}
        <h1 style={{ ...styles.title, fontSize: `${titleSize}px` }}>{title}</h1>
        {subtitle && <p style={styles.subtitle}>{subtitle}</p>}
        {children}
        {footer}
      </div>
    </div>
  );
}

/** Indeterminate spinner used while a token is being confirmed. */
export function AuthSpinner() {
  return <div style={styles.spinner} />;
}

export const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--bg)',
    padding: '24px',
  },
  card: {
    width: '100%',
    maxWidth: '400px',
    backgroundColor: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '16px',
    boxShadow: '0 1px 2px oklch(0% 0 0 / 0.04), 0 12px 32px oklch(0% 0 0 / 0.06)',
    padding: 'clamp(28px, 6vw, 44px) clamp(22px, 6vw, 40px)',
  },
  cardCentered: {
    textAlign: 'center' as const,
  },
  badge: {
    width: '44px',
    height: '44px',
    borderRadius: '11px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '20px',
  },
  badgeCentered: {
    margin: '0 auto 20px',
  },
  spinner: {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    border: '3px solid var(--border-strong)',
    borderTopColor: 'var(--accent)',
    margin: '0 auto 20px',
    animation: 'spin 0.8s linear infinite',
  },
  title: {
    fontSize: '22px',
    fontWeight: 700,
    margin: '0 0 8px',
    color: 'var(--text)',
    letterSpacing: '-0.02em',
  },
  subtitle: {
    fontSize: '14px',
    color: 'var(--text-muted)',
    margin: '0 0 28px',
    lineHeight: 1.55,
  },

  /* --- form primitives, shared across the auth screens --- */
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
  },
  label: {
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--text)',
  },
  input: {
    padding: '11px 13px',
    border: '1px solid var(--border-strong)',
    borderRadius: '9px',
    fontSize: '15px',
    fontFamily: 'inherit',
    backgroundColor: 'var(--surface)',
    color: 'var(--text)',
    outline: 'none',
  },
  button: {
    padding: '12px 16px',
    backgroundColor: 'var(--accent)',
    color: 'white',
    border: 'none',
    borderRadius: '9px',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: '6px',
  },
  buttonSecondary: {
    width: '100%',
    padding: '11px 16px',
    backgroundColor: 'transparent',
    color: 'var(--accent)',
    border: '1px solid var(--border-strong)',
    borderRadius: '9px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  error: {
    padding: '11px 13px',
    backgroundColor: 'var(--danger-soft)',
    color: 'var(--danger-text)',
    borderRadius: '9px',
    fontSize: '13.5px',
  },
  hint: {
    fontSize: '12.5px',
    color: 'var(--text-muted)',
    margin: '12px 0 0',
  },
  footer: {
    margin: '26px 0 0',
    fontSize: '13.5px',
    color: 'var(--text-muted)',
    textAlign: 'center' as const,
  },
  link: {
    color: 'var(--accent)',
    fontWeight: 600,
    textDecoration: 'none',
    cursor: 'pointer',
  },
};
