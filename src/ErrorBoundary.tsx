import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Catches render-time crashes (most commonly: a browser tab left open
 * across a deploy, running stale JS against the newly-deployed API)
 * and shows a reload prompt instead of an unmounted blank page.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error('Unhandled render error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={styles.container}>
          <div style={styles.card}>
            <h2 style={styles.title}>Something went wrong</h2>
            <p style={styles.text}>
              This can happen if the app updated while this tab was open.
              Reloading usually fixes it.
            </p>
            <button style={styles.button} onClick={() => window.location.reload()}>
              Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  card: {
    maxWidth: '400px',
    textAlign: 'center' as const,
  },
  title: {
    fontSize: '20px',
    fontWeight: '600' as const,
    marginBottom: '8px',
  },
  text: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '20px',
  },
  button: {
    padding: '10px 24px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600' as const,
  },
};
