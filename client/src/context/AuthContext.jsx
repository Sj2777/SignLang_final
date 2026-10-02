import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { request } from '../api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionError, setSessionError] = useState('');

  const refreshUser = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await request('/auth/me');
      setUser(data.user);
      setSessionError('');
      return data.user;
    } catch (error) {
      if (error.status === 401) {
        setUser(null);
        setSessionError('');
        return null;
      }
      setSessionError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser().catch((error) => {
      console.error('Could not restore the current session:', error);
    });
  }, [refreshUser]);

  const signOut = useCallback(async () => {
    await request('/auth/logout', { method: 'POST' });
    setUser(null);
    setSessionError('');
  }, []);

  const value = useMemo(() => ({
    user,
    setUser,
    isLoading,
    sessionError,
    refreshUser,
    signOut,
  }), [user, isLoading, sessionError, refreshUser, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider.');
  return context;
}
