import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  cacheUserProfile,
  clearCachedUserProfile,
  getCachedUserProfile,
  syncPendingDataWithRetry,
  userFromCachedProfile,
} from '../lib/offlineDb';
import useOnlineStatus from '../hooks/useOnlineStatus';

const AuthContext = createContext({});
const SESSION_RETRY_DELAYS_MS = [500, 1500];

function isInvalidSessionError(error) {
  return error?.status === 401 || error?.status === 403 ||
    error?.name === 'AuthSessionMissingError';
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOfflineSession, setIsOfflineSession] = useState(false);
  const [authMessage, setAuthMessage] = useState('');
  const isOffline = useOnlineStatus();
  const userRef = useRef(null);

  const updateUser = useCallback((nextUser, offlineSession = false) => {
    userRef.current = nextUser;
    setUser(nextUser);
    setIsOfflineSession(offlineSession);
  }, []);

  const persistProfile = useCallback(async (nextUser) => {
    try {
      await cacheUserProfile(nextUser);
    } catch (error) {
      console.error('Could not cache the signed-in user profile for offline use.', error);
    }
  }, []);

  const clearProfile = useCallback(async () => {
    try {
      await clearCachedUserProfile();
    } catch (error) {
      console.error('Could not clear the cached user profile.', error);
    }
  }, []);

  const expireOfflineSession = useCallback(async () => {
    updateUser(null);
    setAuthMessage('Your saved session is no longer valid. Please log in again while online.');
    await clearProfile();

    const { error } = await supabase.auth.signOut({ scope: 'local' });
    if (error) {
      console.warn('The local session was cleared, but Supabase could not revoke it.', error);
    }
  }, [clearProfile, updateUser]);

  const validateSession = useCallback(async (candidateUser) => {
    if (!candidateUser?.id) return;

    for (let attempt = 0; ; attempt += 1) {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (userRef.current?.id !== candidateUser.id) return;
        if (error) {
          if (isInvalidSessionError(error)) {
            await expireOfflineSession();
            return;
          }
          throw error;
        }

        if (!data.user) {
          await expireOfflineSession();
          return;
        }

        updateUser(data.user);
        setAuthMessage('');
        await persistProfile(data.user);
        try {
          await syncPendingDataWithRetry(data.user.id);
        } catch (syncError) {
          console.error('Could not check pending offline learning updates.', syncError);
        }
        return;
      } catch (error) {
        if (userRef.current?.id !== candidateUser.id) return;
        if (attempt >= SESSION_RETRY_DELAYS_MS.length) {
          console.error('Could not revalidate the saved Supabase session.', error);
          if (userRef.current) setIsOfflineSession(true);
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, SESSION_RETRY_DELAYS_MS[attempt]));
      }
    }
  }, [expireOfflineSession, persistProfile, updateUser]);

  useEffect(() => {
    let mounted = true;

    const restoreCachedProfile = async () => {
      try {
        const profile = await getCachedUserProfile();
        if (!mounted || !profile) return null;
        const cachedUser = userFromCachedProfile(profile);
        updateUser(cachedUser, true);
        return cachedUser;
      } catch (error) {
        console.error('Could not load the cached offline user profile.', error);
        return null;
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        updateUser(session.user, !navigator.onLine);
        setAuthMessage('');
        void persistProfile(session.user);
      } else if (event === 'SIGNED_OUT') {
        updateUser(null);
        void clearProfile();
      }
    });

    const handleOffline = () => {
      if (userRef.current) setIsOfflineSession(true);
    };
    const handleOnline = () => {
      if (userRef.current) void validateSession(userRef.current);
    };
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    const loadInitialSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (data.session?.user) {
          updateUser(data.session.user, !navigator.onLine);
          void persistProfile(data.session.user);
        } else if (!navigator.onLine) {
          await restoreCachedProfile();
        } else {
          await clearProfile();
        }
      } catch (error) {
        console.warn('Could not load the Supabase session; checking the offline profile.', error);
        const cachedUser = await restoreCachedProfile();
        if (cachedUser && navigator.onLine) {
          void validateSession(cachedUser);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void loadInitialSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, [clearProfile, persistProfile, updateUser, validateSession]);

  useEffect(() => {
    if (isOffline && userRef.current) setIsOfflineSession(true);
  }, [isOffline]);

  const signIn = async (email, password) => {
    const result = await supabase.auth.signInWithPassword({ email, password });
    if (!result.error && result.data.user) {
      updateUser(result.data.user);
      setAuthMessage('');
      await persistProfile(result.data.user);
    }
    return result;
  };

  const signUp = async (email, password, metaData) => {
    const result = await supabase.auth.signUp({
      email,
      password,
      options: { data: metaData },
    });
    if (!result.error && result.data.session?.user) {
      updateUser(result.data.session.user);
      setAuthMessage('');
      await persistProfile(result.data.session.user);
    }
    return result;
  };

  const signOut = async () => {
    updateUser(null);
    setAuthMessage('');
    try {
      return await supabase.auth.signOut({ scope: 'local' });
    } finally {
      await clearProfile();
    }
  };

  const value = {
    user,
    loading,
    isOffline,
    isOfflineSession,
    authMessage,
    clearAuthMessage: () => setAuthMessage(''),
    signIn,
    signUp,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
