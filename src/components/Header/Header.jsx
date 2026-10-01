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
            <Link to="/dashboard" className={styles.btnPrimary} id="header-dashboard-btn">
              Dashboard
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
