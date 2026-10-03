import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import styles from './DashboardLayout.module.css';

export default function DashboardLayout() {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className={styles.dashboardContainer}>
      {/* Sidebar Nav */}
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <Link to="/">HandSpeak</Link>
        </div>

        <nav className={styles.navLinks}>
          <Link 
            to="/dashboard" 
            className={`${styles.navLink} ${location.pathname === '/dashboard' ? styles.active : ''}`}
          >
            Portal Home
          </Link>
          <Link 
            to="/translate" 
            className={`${styles.navLink} ${location.pathname === '/translate' ? styles.active : ''}`}
          >
            Live Translator
          </Link>
          <Link 
            to="/reverse-translate" 
            className={`${styles.navLink} ${location.pathname === '/reverse-translate' ? styles.active : ''}`}
          >
            Text ➔ ISL
          </Link>
          <Link 
            to="/speed-quiz" 
            className={`${styles.navLink} ${location.pathname === '/speed-quiz' ? styles.active : ''}`}
          >
            Speed Quiz Game
          </Link>
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.userInfo}>
            <div className={styles.userAvatar}>
              {user?.email?.[0].toUpperCase()}
            </div>
            <span className={styles.userEmail}>{user?.email}</span>
          </div>
          <div className={styles.actions}>
            <button onClick={toggleTheme} className={styles.iconBtn} aria-label="Toggle Theme">
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
            <button onClick={handleLogout} className={styles.logoutBtn}>
              Log out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={styles.mainContent}>
        <Outlet />
      </main>
    </div>
  );
}
