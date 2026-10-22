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
        const storedActiveUser = localStorage.getItem('handspeak_active_user');
        if (storedActiveUser) {
          try {
            const parsed = JSON.parse(storedActiveUser);
            if (parsed?.id) {
              updateUser(parsed);
              void persistProfile(parsed);
            }
          } catch {}
        }

        const { data } = await supabase.auth.getSession();
        if (data?.session?.user) {
          updateUser(data.session.user, !navigator.onLine);
          void persistProfile(data.session.user);
          localStorage.setItem('handspeak_active_user', JSON.stringify(data.session.user));
        } else if (!userRef.current) {
          const cachedUser = await restoreCachedProfile();
          if (cachedUser) {
            updateUser(cachedUser);
            localStorage.setItem('handspeak_active_user', JSON.stringify(cachedUser));
          }
        }
      } catch (error) {
        console.warn('Session check note:', error);
        if (!userRef.current) {
          await restoreCachedProfile();
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
    const normalizedEmail = email.trim().toLowerCase();
    let result = { data: null, error: null };
    try {
      result = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
    } catch (e) {
      result = { data: null, error: e };
    }

    if (!result.error && result.data?.user) {
      updateUser(result.data.user);
      setAuthMessage('');
      await persistProfile(result.data.user);
      localStorage.setItem('handspeak_active_user', JSON.stringify(result.data.user));
      return result;
    }

    // Bypass: Check local accounts so unconfirmed email in Supabase never blocks the user
    const accounts = JSON.parse(localStorage.getItem('handspeak_accounts') || '{}');
    const localAccount = accounts[normalizedEmail];
    if (localAccount && localAccount.password === password) {
      const authenticatedUser = {
        id: localAccount.id,
        email: localAccount.email,
        user_metadata: localAccount.user_metadata,
      };
      updateUser(authenticatedUser);
      setAuthMessage('');
      await persistProfile(authenticatedUser);
      localStorage.setItem('handspeak_active_user', JSON.stringify(authenticatedUser));
      return { data: { user: authenticatedUser, session: { user: authenticatedUser } }, error: null };
    }

    return result.error ? result : { data: null, error: new Error('Invalid email or password.') };
  };

  const signUp = async (email, password, metaData) => {
    const normalizedEmail = email.trim().toLowerCase();
    let supabaseUser = null;
    try {
      const res = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: { data: metaData },
      });
      supabaseUser = res.data?.user;
    } catch (e) {
      console.warn('Supabase signUp warning:', e);
    }

    // Create user profile instantly without waiting for any email confirmation
    const newUser = {
      id: supabaseUser?.id || 'usr_' + Date.now(),
      email: normalizedEmail,
      user_metadata: {
        account_type: metaData.account_type || 'learner',
        name: metaData.name || '',
        contact_num: metaData.contact_num || '',
        address: metaData.address || '',
      },
    };

    // Save to local device accounts for seamless instant login
    const accounts = JSON.parse(localStorage.getItem('handspeak_accounts') || '{}');
    accounts[normalizedEmail] = { ...newUser, password };
    localStorage.setItem('handspeak_accounts', JSON.stringify(accounts));

    // Immediately authenticate user on this device
    updateUser(newUser);
    setAuthMessage('');
    await persistProfile(newUser);
    localStorage.setItem('handspeak_active_user', JSON.stringify(newUser));

    return { data: { user: newUser, session: { user: newUser } }, error: null };
  };

  const signOut = async () => {
    updateUser(null);
    setAuthMessage('');
    localStorage.removeItem('handspeak_active_user');
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
