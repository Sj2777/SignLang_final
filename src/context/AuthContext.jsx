import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// ⚙️  GOOGLE OAUTH CONFIG
//     1. Create a project at https://console.cloud.google.com/
//     2. Enable the "Google Identity" API
//     3. Create an OAuth 2.0 Web Client ID
//     4. Add http://localhost:5173 (dev) and your prod domain to Authorized Origins
//
// ⚠️ IMPORTANT: Set your client ID in a .env file locally (do not commit it):
//    VITE_GOOGLE_CLIENT_ID=your-actual-client-id.apps.googleusercontent.com
// ─────────────────────────────────────────────────────────────────────────────
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// Backend endpoint that accepts the Google ID token + intended role
// Expected request:  POST /api/auth/google  { idToken: string, role: 'client'|'organization' }
// Expected response: { token: string, role: string, profileComplete: boolean, name: string, email: string, picture?: string }
const BACKEND_AUTH_URL = '/api/auth/google';

// ─────────────────────────────────────────────────────────────────────────────

const AuthContext = createContext(null);

/**
 * Dynamically loads the Google Identity Services script.
 * Returns a promise that resolves when the script is ready.
 */
function loadGoogleScript() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts) { resolve(); return; }
    if (document.getElementById('google-gsi-script')) {
      // Script tag exists but google not ready yet — wait for load
      document.getElementById('google-gsi-script').addEventListener('load', resolve);
      return;
    }
    const script = document.createElement('script');
    script.id = 'google-gsi-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error('Failed to load Google Identity Services script.'));
    document.head.appendChild(script);
  });
}

export function AuthProvider({ children }) {
  // user shape: { name, email, picture, role, profileComplete, token }
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('sb_user');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError]   = useState('');

  // Keep a ref to the pending role so the GIS callback can read it
  const pendingRoleRef = useRef(null);

  // Persist user to localStorage whenever it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('sb_user',  JSON.stringify(user));
      localStorage.setItem('sb_token', user.token || '');
    } else {
      localStorage.removeItem('sb_user');
      localStorage.removeItem('sb_token');
    }
  }, [user]);

  // ── CORE: handle the credential Google returns ──────────────────────────
  const handleGoogleCredential = useCallback(async (response) => {
    // response.credential is the Google ID token (JWT)
    const idToken = response.credential;
    const role    = pendingRoleRef.current;

    if (!idToken || !role) {
      setAuthError('Google sign-in was cancelled or returned no credential.');
      setAuthLoading(false);
      return null;
    }

    try {
      // ── TODO: Replace mock below with real fetch ────────────────────────
      // const res = await fetch(BACKEND_AUTH_URL, {
      //   method:  'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body:    JSON.stringify({ idToken, role }),
      // });
      // if (!res.ok) {
      //   const msg = await res.text();
      //   throw new Error(msg || `Server error ${res.status}`);
      // }
      // const data = await res.json();
      // ───────────────────────────────────────────────────────────────────

      // ── MOCK response — remove when real backend is wired ──────────────
      await new Promise(r => setTimeout(r, 1200));
      const mockName = role === 'organization' ? 'Deaf Connect Foundation' : 'Alex Rivera';
      const data = {
        token:           'mock_jwt_token_' + Date.now(),
        role,
        profileComplete: role === 'client' ? true : false, // orgs start incomplete
        name:            mockName,
        email:           'user@gmail.com',
        picture:         null,
      };
      // ── END MOCK ────────────────────────────────────────────────────────

      const newUser = { ...data };
      setUser(newUser);
      setAuthError('');
      return newUser;

    } catch (err) {
      setAuthError(err.message || 'Authentication failed. Please try again.');
      return null;
    } finally {
      setAuthLoading(false);
      pendingRoleRef.current = null;
    }
  }, []);

  // ── PUBLIC: trigger Google OAuth for a given role ───────────────────────
  const loginWithGoogle = useCallback(async (role) => {
    setAuthLoading(true);
    setAuthError('');
    pendingRoleRef.current = role;

    // Check if client ID is missing/undefined or a placeholder
    if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID.includes('your-actual-client-id')) {
      console.warn("VITE_GOOGLE_CLIENT_ID is not configured. Falling back to local mock authentication.");
      setTimeout(() => {
        const mockName = role === 'organization' ? 'Deaf Connect Foundation' : 'Alex Rivera';
        const data = {
          token:           'mock_jwt_token_' + Date.now(),
          role,
          profileComplete: role === 'client' ? true : false, // orgs start incomplete
          name:            mockName,
          email:           'user@gmail.com',
          picture:         null,
        };
        setUser(data);
        setAuthError('');
        setAuthLoading(false);
        pendingRoleRef.current = null;
      }, 1000);
      return;
    }

    try {
      await loadGoogleScript();

      // ── TODO: Ensure GOOGLE_CLIENT_ID is set at the top of this file ───
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback:  handleGoogleCredential,
        // auto_select: false,  // set true for returning users
        // ux_mode: 'popup',    // or 'redirect' — popup is simpler for SPAs
      });

      // Programmatically trigger the One Tap / popup prompt
      window.google.accounts.id.prompt((notification) => {
        // notification.isNotDisplayed() or notification.isSkippedMoment()
        // means the user dismissed or the prompt can't show
        if (
          notification.isNotDisplayed() ||
          notification.isSkippedMoment()
        ) {
          setAuthError('Google sign-in was dismissed. Please try again.');
          setAuthLoading(false);
          pendingRoleRef.current = null;
        }
      });

    } catch (err) {
      setAuthError(err.message || 'Could not initialize Google sign-in.');
      setAuthLoading(false);
      pendingRoleRef.current = null;
    }
  }, [handleGoogleCredential]);

  // ── PUBLIC: complete org profile (called after org sign-in) ─────────────
  const completeOrgProfile = useCallback(async (profileData) => {
    setAuthLoading(true);
    setAuthError('');
    try {
      // ── TODO: Replace mock with real fetch ─────────────────────────────
      // const token = localStorage.getItem('sb_token');
      // const res = await fetch('/api/organizations/me/profile', {
      //   method:  'PUT',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${token}`,
      //   },
      //   body: JSON.stringify(profileData),
      // });
      // if (!res.ok) throw new Error(await res.text());
      // ── END TODO ────────────────────────────────────────────────────────

      await new Promise(r => setTimeout(r, 1300)); // mock delay

      // Mark profileComplete in local user state
      setUser(prev => ({ ...prev, profileComplete: true, ...profileData }));
      return { success: true };
    } catch (err) {
      setAuthError(err.message || 'Failed to save profile.');
      return { success: false, error: err.message };
    } finally {
      setAuthLoading(false);
    }
  }, []);

  // ── PUBLIC: logout ───────────────────────────────────────────────────────
  const logout = useCallback(() => {
    // Revoke Google session so One Tap doesn't auto-sign back in
    if (window.google?.accounts?.id) {
      window.google.accounts.id.disableAutoSelect();
    }
    // TODO: also call backend logout/token-revoke endpoint if needed
    setUser(null);
    setAuthError('');
  }, []);

  const clearError = useCallback(() => setAuthError(''), []);

  return (
    <AuthContext.Provider value={{
      user,
      authLoading,
      authError,
      loginWithGoogle,
      completeOrgProfile,
      logout,
      clearError,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
