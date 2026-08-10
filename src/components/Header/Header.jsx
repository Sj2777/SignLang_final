import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import styles from './Header.module.css';

/* Minimalist Hand Logo SVG */
const Logo = () => (
  <Link to="/" className={styles.logoLink} aria-label="LinkHands Home">
    <div className={styles.logoMark}>
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/>
        <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"/>
        <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/>
        <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>
      </svg>
    </div>
    <span className={styles.logoText}>LinkHands</span>
  </Link>
);

export default function Header() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate('/');
  };

  const initials = user?.name
    ? user.name.slice(0, 2).toUpperCase()
    : '??';

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
      <div className={`container ${styles.inner}`}>
        <Logo />

        <nav className={styles.nav} aria-label="Main navigation">
          <a href="#features" className={styles.navLink}>Features</a>
          <a href="#account-types" className={styles.navLink}>Community</a>
          <a href="#about" className={styles.navLink}>About</a>
        </nav>

        <div className={styles.actions}>
          <button 
            onClick={toggleTheme} 
            className={styles.themeToggle} 
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          
          {user ? (
            <div className={styles.userMenu}>
              <button
                className={styles.avatarBtn}
                onClick={() => setMenuOpen(o => !o)}
                aria-expanded={menuOpen}
                aria-haspopup="true"
                aria-label="User menu"
              >
                <div className={styles.avatar}>{initials}</div>
                <span className={styles.avatarName}>{user.name}</span>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"
                     className={`${styles.chevron} ${menuOpen ? styles.chevronOpen : ''}`}>
                  <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5"
                        strokeLinecap="round" fill="none" />
                </svg>
              </button>
              {menuOpen && (
                <div className={styles.dropdown} role="menu">
                  <Link
                    to={user.role === 'organization' ? '/org-dashboard' : '/dashboard'}
                    className={styles.dropdownItem}
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                  >
                    <span>📊</span> Dashboard
                  </Link>
                  <button className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}
                          role="menuitem" onClick={handleLogout}>
                    <span>🚪</span> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/auth" className={styles.btnPrimary} id="header-signin-btn">
              <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true" style={{ flexShrink: 0 }}>
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.36-8.16 2.36-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
