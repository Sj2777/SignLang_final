import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { clearCachedUser, getCachedUser, saveCachedUser } from './offlineUserStore.js';

const AuthContext = createContext(null);

function offlineError() {
  return new Error("You're offline. Connect to the internet to sign in or create an account.");
}

async function requestJson(url, options = {}) {
  if (!navigator.onLine) throw offlineError();

  let response;
  try {
    response = await fetch(url, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      ...options,
    });
  } catch (error) {
    if (error instanceof TypeError) throw offlineError();
    throw error;
  }

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : null;

  if (!response.ok) {
    const error = new Error(data?.error?.message || 'Something went wrong.');
    error.status = response.status;
    error.code = data?.error?.code;
    throw error;
  }

  return data;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionError, setSessionError] = useState('');
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  const refreshUser = async () => {
    try {
      setSessionError('');
      const { user: currentUser } = await requestJson('/api/auth/me');
      await saveCachedUser(currentUser);
      setUser(currentUser);
      setIsOffline(false);
      return currentUser;
    } catch (error) {
      const isNetworkFailure = !navigator.onLine || error.message.startsWith("You're offline.");
      if (isNetworkFailure) {
        setIsOffline(true);
        try {
          setUser(await getCachedUser());
        } catch (storageError) {
          console.error('Could not load the cached HandSpeak profile:', storageError);
          setSessionError('Your saved offline profile could not be opened on this device.');
        }
      } else if (error.status === 401 || error.code === 'AUTH_REQUIRED' || error.code === 'INVALID_SESSION') {
        setUser(null);
        try {
          await clearCachedUser();
        } catch (storageError) {
          console.error('Could not clear the cached HandSpeak profile:', storageError);
        }
      } else {
        setIsOffline(false);
        setSessionError(error.message);
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    async function initialize() {
      try {
        const cachedUser = await getCachedUser();
        if (mounted && !navigator.onLine) setUser(cachedUser);
      } catch (error) {
        console.error('Could not load the cached HandSpeak profile:', error);
      }
      if (mounted) await refreshUser();
    }

    const handleOnline = () => {
      setIsOffline(false);
      refreshUser();
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    initialize();

    return () => {
      mounted = false;
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const signIn = async (accountType, formData) => {
    const payload = await requestJson(`/api/auth/login/${accountType}`, {
      method: 'POST',
      body: JSON.stringify(formData),
    });
    await saveCachedUser(payload.user);
    setUser(payload.user);
    return payload.user;
  };

  const signUp = async (accountType, formData) => {
    const payload = await requestJson(`/api/auth/register/${accountType}`, {
      method: 'POST',
      body: JSON.stringify(formData),
    });
    await saveCachedUser(payload.user);
    setUser(payload.user);
    return payload.user;
  };

  const signOut = async () => {
    try {
      await requestJson('/api/auth/logout', { method: 'POST' });
    } finally {
      setUser(null);
      try {
        await clearCachedUser();
      } catch (error) {
        console.error('Could not clear the cached HandSpeak profile:', error);
      }
    }
  };

  const value = useMemo(() => ({
    user,
    setUser,
    isLoading,
    sessionError,
    isOffline,
    refreshUser,
    signIn,
    signUp,
    signOut,
  }), [user, isLoading, sessionError, isOffline]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.');
  }
  return context;
}
