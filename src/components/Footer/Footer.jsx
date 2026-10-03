import { Link } from 'react-router-dom';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer} id="about">
      <div className={`container ${styles.inner}`}>
        {/* Brand col */}
        <div className={styles.brand}>
          <div className={styles.logoRow}>
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden="true">
              <rect width="32" height="32" rx="8" fill="url(#foot-logo-grad)" />
              <path d="M8 22V14l4-3 4 5 4-7 4 6v7" stroke="white" strokeWidth="2.2"
                    strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="24" cy="10" r="2.5" fill="#A78BFA" />
              <defs>
                <linearGradient id="foot-logo-grad" x1="0" y1="0" x2="32" y2="32">
                  <stop stopColor="#2563EB" />
                  <stop offset="1" stopColor="#7C3AED" />
                </linearGradient>
              </defs>
            </svg>
            <span className={styles.logoText}>HandSpeak</span>
          </div>
          <p className={styles.tagline}>
            Breaking barriers between the hearing and Deaf communities through
            AI-powered sign language technology.
          </p>
          <div className={styles.socials} aria-label="Social media links">
            <a href="https://github.com/Sj2777/SignLang_final" target="_blank" rel="noopener noreferrer" className={styles.socialLink} aria-label="GitHub">
              G
            </a>
          </div>
        </div>

        {/* Links */}
        <div className={styles.links}>
          <div className={styles.linkGroup}>
            <h3 className={styles.linkHeading}>Platform</h3>
            <a href="/#features" className={styles.link}>Features</a>
            <Link to="/translate" className={styles.link}>Live Translator</Link>
            <Link to="/speed-quiz" className={styles.link}>Speed Quiz</Link>
          </div>
          <div className={styles.linkGroup}>
            <h3 className={styles.linkHeading}>Community</h3>
            <a href="/#account-types" className={styles.link}>For Learners</a>
            <a href="/#account-types" className={styles.link}>For Organizations</a>
            <a href="https://github.com/Sj2777/SignLang_final" target="_blank" rel="noopener noreferrer" className={styles.link}>GitHub Repo</a>
          </div>
          <div className={styles.linkGroup}>
            <h3 className={styles.linkHeading}>Legal</h3>
            <a href="/" className={styles.link}>Privacy Policy</a>
            <a href="/" className={styles.link}>Terms of Service</a>
            <a href="/" className={styles.link}>Cookie Policy</a>
          </div>
        </div>
      </div>

      <div className={`container ${styles.bottom}`}>
        <span>© {new Date().getFullYear()} HandSpeak. All rights reserved.</span>
        <span className={styles.madeWith}>
          Built for the Deaf & Hard-of-Hearing community 🤟
        </span>
      </div>
    </footer>
  );
}
