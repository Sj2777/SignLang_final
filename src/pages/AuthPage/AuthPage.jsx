import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './AuthPage.module.css';

/* ── Google "G" logo SVG ─────────────────────────────────── */
const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.36-8.16 2.36-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    <path fill="none" d="M0 0h48v48H0z"/>
  </svg>
);

/* ── Minimalist Hand Icon SVG ── */
const MinimalHand = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/>
    <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"/>
    <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/>
    <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>
  </svg>
);

/* ── Role card ───────────────────────────────────────────── */
function GoogleRoleButton({ role, label, sublabel, icon, onClick, loading, disabled, colorClass }) {
  return (
    <button
      className={`${styles.roleBtn} ${styles[colorClass]} ${loading ? styles.roleBtnLoading : ''}`}
      onClick={() => onClick(role)}
      disabled={disabled}
      id={`google-auth-${role}`}
      aria-label={`Continue with Google as ${label}`}
      aria-busy={loading}
    >
      <div className={styles.roleBtnTop}>
        <span className={styles.roleBtnIcon}>{icon}</span>
        <div className={styles.roleBtnText}>
          <span className={styles.roleBtnLabel}>{label}</span>
          <span className={styles.roleBtnSub}>{sublabel}</span>
        </div>
      </div>

      <div className={styles.roleBtnAction}>
        {loading ? (
          <>
            <div className={styles.spinner} />
            <span>Connecting…</span>
          </>
        ) : (
          <>
            <GoogleIcon />
            <span>Continue with Google</span>
          </>
        )}
      </div>
    </button>
  );
}

/* ── Main AuthPage ───────────────────────────────────────── */
export default function AuthPage() {
  const { user, authLoading, authError, loginWithGoogle, clearError } = useAuth();
  const navigate = useNavigate();
  const [activeRole, setActiveRole] = useState(null);

  useEffect(() => {
    if (!user) return;
    if (user.role === 'organization' && !user.profileComplete) {
      navigate('/complete-profile', { replace: true });
    } else if (user.role === 'organization') {
      navigate('/org-dashboard', { replace: true });
    } else {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleGoogleClick = async (role) => {
    clearError();
    setActiveRole(role);
    await loginWithGoogle(role);
    setActiveRole(null);
  };

  return (
    <div className={styles.page}>
      {/* Editorial background shapes */}
      <div className={styles.bgBlobLeft} aria-hidden="true"></div>
      <div className={styles.bgBlobRight} aria-hidden="true"></div>

      <Link to="/" className={styles.backLink} aria-label="Back to home">
        ← Home
      </Link>

      <div className={styles.card} role="main">
        <div className={styles.logoRow}>
          <MinimalHand />
          <span className={styles.logoText}>LinkHands</span>
        </div>

        <h1 className={styles.heading}>Welcome back</h1>
        <p className={styles.sub}>
          Choose your account type and continue with Google.
        </p>

        {authError && (
          <div className={styles.errorBanner} role="alert" aria-live="assertive">
            <span>⚠</span> {authError}
            <button className={styles.errorDismiss} onClick={clearError} aria-label="Dismiss error">✕</button>
          </div>
        )}

        <div className={styles.roleGrid}>
          <GoogleRoleButton
            role="client"
            label="Learner"
            sublabel="Individual learning sign language"
            icon={<span role="img" aria-label="student">🧑‍🎓</span>}
            onClick={handleGoogleClick}
            loading={authLoading && activeRole === 'client'}
            disabled={authLoading}
            colorClass="btnTerracotta"
          />
          <GoogleRoleButton
            role="organization"
            label="Organization"
            sublabel="Deaf school, NGO, or advocacy group"
            icon={<span role="img" aria-label="building">🏛️</span>}
            onClick={handleGoogleClick}
            loading={authLoading && activeRole === 'organization'}
            disabled={authLoading}
            colorClass="btnTeal"
          />
        </div>

        <p className={styles.securityNote}>
          Secured by Google OAuth 2.0.
        </p>
      </div>
    </div>
  );
}
