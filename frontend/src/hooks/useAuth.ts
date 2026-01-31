// src/hooks/useAuth.ts
import { useState, useEffect, useCallback, useMemo } from 'react';

export type UserRole = 'teacher' | 'student' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

const USER_STORAGE_KEY = 'user';

/**
 * Hook for managing user authentication state.
 * Persists user data to localStorage and provides login/logout functionality.
 */
export const useAuth = () => {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  // Load user from localStorage on mount
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem(USER_STORAGE_KEY);
      if (savedUser) {
        const parsed = JSON.parse(savedUser) as User;
        setState({ user: parsed, loading: false, error: null });
      } else {
        setState((prev) => ({ ...prev, loading: false }));
      }
    } catch {
      localStorage.removeItem(USER_STORAGE_KEY);
      setState({ user: null, loading: false, error: null });
    }
  }, []);

  const login = useCallback(
    async (email: string, password: string, _role: UserRole): Promise<User> => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const response = await fetch('/api/v1/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.detail || 'Login failed');
        }

        const data = await response.json();
        const loggedUser: User = {
          id: String(data.id),
          email: data.email,
          name: data.full_name || data.email?.split('@')[0] || 'User',
          role: data.role as UserRole,
        };

        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(loggedUser));
        setState({ user: loggedUser, loading: false, error: null });
        return loggedUser;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Login failed';
        setState((prev) => ({ ...prev, loading: false, error: message }));
        throw err;
      }
    },
    []
  );

  const logout = useCallback(() => {
    localStorage.removeItem(USER_STORAGE_KEY);
    setState({ user: null, loading: false, error: null });
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  // Memoize return value to prevent unnecessary re-renders
  return useMemo(
    () => ({
      user: state.user,
      loading: state.loading,
      error: state.error,
      login,
      logout,
      clearError,
      isAuthenticated: !!state.user,
    }),
    [state.user, state.loading, state.error, login, logout, clearError]
  );
};
