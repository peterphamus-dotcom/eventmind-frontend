import { useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { UserProfileCard } from './UserProfileCard';

interface UserLinkProps {
  id: string;
  name: string;
  style?: CSSProperties;
}

/**
 * Drop-in replacement for a plain username render (or a `<Link to={/users/:id}>`)
 * that pops open a UserProfileCard on click instead of navigating away.
 * Clicking your own name just links to /profile — no self-message/follow/report.
 */
export function UserLink({ id, name, style }: UserLinkProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const isSelf = user?.id === id;

  if (isSelf) {
    return (
      <Link to="/profile" style={{ ...baseStyle, ...style }}>
        {name}
      </Link>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          // Usernames often sit inside a larger clickable row/card (a comment,
          // a post, a list item) — stop that ancestor click from also firing.
          e.stopPropagation();
          setIsOpen(true);
        }}
        style={{ ...baseButtonStyle, ...style }}
      >
        {name}
      </button>
      {isOpen && <UserProfileCard userId={id} name={name} onClose={() => setIsOpen(false)} />}
    </>
  );
}

const baseStyle: CSSProperties = {
  textDecoration: 'none',
};

const baseButtonStyle: CSSProperties = {
  background: 'none',
  border: 'none',
  padding: 0,
  margin: 0,
  font: 'inherit',
  color: 'inherit',
  cursor: 'pointer',
  textAlign: 'left',
  ...baseStyle,
};
