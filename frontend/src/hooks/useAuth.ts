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
    async (email: string, password: string, role: 'teacher' | 'student') => {
      setLoading(true);
      setError(null);
      try {
        // Simulate login - in production, call your auth API
        const mockUser: User = {
          id: Math.random().toString(36).substr(2, 9),
          email,
          name: email.split('@')[0],
          role,
        };
        setUser(mockUser);
        localStorage.setItem('user', JSON.stringify(mockUser));
        return mockUser;
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
