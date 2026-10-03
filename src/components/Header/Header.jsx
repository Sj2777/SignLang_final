import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import styles from './Header.module.css';

/* Minimalist Hand Logo SVG */
const Logo = () => (
  <Link to="/" className={styles.logoLink} aria-label="HandSpeak Home">
    <div className={styles.logoMark}>
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/>
        <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"/>
        <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/>
        <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>
      </svg>
    </div>
    <span className={styles.logoText}>HandSpeak</span>
  </Link>
);

export default function Header() {
  const { theme, toggleTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
      <div className={`container ${styles.inner}`}>
        <Logo />

        <nav className={styles.nav} aria-label="Main navigation">
          <Link to="/translate" className={styles.navLink}>ISL ➔ Text</Link>
          <Link to="/reverse-translate" className={styles.navLink}>Text ➔ ISL</Link>
          <a href="/#features" className={styles.navLink}>Features</a>
          <a href="/#account-types" className={styles.navLink}>Community</a>
          <a href="/#about" className={styles.navLink}>About</a>
          <Link to="/speed-quiz" className={styles.navLink}>Games</Link>
        </nav>

        <div className={styles.actions}>
          <button 
            onClick={toggleTheme} 
            className={styles.themeToggle} 
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          
          <Link to="/translate" className={styles.btnPrimary} id="header-cta-btn">
            Live Translator
          </Link>
        </div>
      </div>
    </header>
  );
}
