import { createContext, useContext, useState, useEffect } from 'react';
import type { User } from './types';
import { api } from './api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<{ needsVerification: boolean; email: string; message: string }>;
  verifyEmail: (token: string) => Promise<void>;
  acceptInvite: (token: string, name: string, password: string) => Promise<void>;
  clearError: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is already logged in on mount
  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const response = await api.getMe();
      setUser(response.data.data || null);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email: string, password: string) {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.login(email, password);
      setUser(response.data.data || null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }

  async function logout() {
    setIsLoading(true);
    try {
      await api.logout();
      setUser(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Logout failed');
    } finally {
      setIsLoading(false);
    }
  }

  async function register(email: string, password: string, name: string) {
    setError(null);
    try {
      const response = await api.register(email, password, name);
      // Self-signup does NOT log in — the user must verify their email first.
      return response.data.data as { needsVerification: boolean; email: string; message: string };
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
      throw err;
    }
  }

  async function verifyEmail(token: string) {
    setError(null);
    try {
      const response = await api.verifyEmail(token);
      setUser(response.data.data || null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Verification failed');
      throw err;
    }
  }

  async function acceptInvite(token: string, name: string, password: string) {
    setError(null);
    try {
      const response = await api.acceptInvite(token, name, password);
      setUser(response.data.data || null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to accept invite');
      throw err;
    }
  }

  async function refreshUser() {
    try {
      const response = await api.getMe();
      setUser(response.data.data || null);
    } catch {
      // Non-critical refresh; keep the existing user state
    }
  }

  return (
    <AuthContext.Provider
      value={{ user, isLoading, error, login, logout, register, verifyEmail, acceptInvite, clearError: () => setError(null), refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
