// src/hooks/useAuth.ts
import { useState, useEffect, useCallback } from 'react';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'teacher' | 'student' | 'admin';
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = async () => {
      try {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }
      } catch (err) {
        setError('Failed to load user');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = useCallback(
    async (email: string, password: string, _role: 'teacher' | 'student') => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/v1/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || 'Login failed');
        }

        const data = await response.json();
        const loggedUser: User = {
          id: String(data.id),
          email: data.email,
          name: data.full_name || data.email?.split('@')[0] || 'User',
          role: data.role,
        };
        setUser(loggedUser);
        localStorage.setItem('user', JSON.stringify(loggedUser));
        return loggedUser;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Login failed';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('user');
  }, []);

  return { user, loading, error, login, logout, isAuthenticated: !!user };
};
