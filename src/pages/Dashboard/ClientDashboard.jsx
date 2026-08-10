import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './Dashboard.module.css';

export default function ClientDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <div className={styles.page}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarLogo}>
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="8" fill="url(#dash-grad)" />
            <path d="M8 22V14l4-3 4 5 4-7 4 6v7" stroke="white" strokeWidth="2.2"
                  strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="24" cy="10" r="2.5" fill="#A78BFA" />
            <defs>
              <linearGradient id="dash-grad" x1="0" y1="0" x2="32" y2="32">
                <stop stopColor="#2563EB" /><stop offset="1" stopColor="#7C3AED" />
              </linearGradient>
            </defs>
          </svg>
          <span className={styles.sidebarBrand}>LinkHands</span>
        </div>

        <nav className={styles.sidebarNav} aria-label="Dashboard navigation">
          {[
            { icon: '📊', label: 'Dashboard',    active: true  },
            { icon: '📚', label: 'My Lessons'               },
            { icon: '🤖', label: 'AI Translator'             },
            { icon: '🏆', label: 'Leaderboard'               },
            { icon: '📥', label: 'Downloads'                 },
            { icon: '🏢', label: 'Organizations'             },
            { icon: '📅', label: 'Events'                    },
          ].map(({ icon, label, active }) => (
            <button key={label}
                    className={`${styles.navItem} ${active ? styles.navItemActive : ''}`}>
              <span className={styles.navIcon}>{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <button className={styles.logoutBtn} onClick={handleLogout}>
          <span>🚪</span> Sign Out
        </button>
      </aside>

      <main className={styles.main}>
        {/* Top bar */}
        <header className={styles.topBar}>
          <div>
            <h1 className={styles.pageTitle}>Welcome back, {user?.name} 👋</h1>
            <p className={styles.pageSub}>Keep up the great work on your sign language journey.</p>
          </div>
          <div className={styles.avatar}>{user?.name?.slice(0,2).toUpperCase()}</div>
        </header>

        {/* Stat cards */}
        <div className={styles.statsGrid}>
          {[
            { icon: '🔥', label: 'Day Streak',       value: '14 days',  color: '#D97706' },
            { icon: '📚', label: 'Lessons Done',      value: '32',       color: '#2563EB' },
            { icon: '🤟', label: 'Signs Mastered',    value: '218',      color: '#7C3AED' },
            { icon: '🏆', label: 'Leaderboard Rank',  value: '#12',      color: '#059669' },
          ].map(({ icon, label, value, color }) => (
            <div key={label} className={styles.statCard}>
              <div className={styles.statIcon} style={{ '--c': color }}>{icon}</div>
              <div>
                <div className={styles.statValue}>{value}</div>
                <div className={styles.statLabel}>{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Placeholder content area */}
        <div className={styles.placeholderGrid}>
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Continue Learning</h2>
            <p className={styles.cardSub}>Pick up where you left off</p>
            <div className={styles.lessonRow}>
              <div className={styles.lessonIcon}>📖</div>
              <div className={styles.lessonInfo}>
                <div className={styles.lessonName}>Module 4 — Everyday Phrases</div>
                <div className={styles.progressBar}>
                  <div className={styles.progressFill} style={{ width: '68%' }} />
                </div>
                <div className={styles.lessonMeta}>68% complete · 8 signs remaining</div>
              </div>
            </div>
            <div className={styles.placeholderNote}>
              {/* TODO: Fetch from GET /api/users/me/progress */}
              Full lesson list loads here after API integration.
            </div>
          </div>

          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Upcoming Events</h2>
            <p className={styles.cardSub}>Near you this month</p>
            {[
              { name: 'ASL Workshop — Greetings', date: 'Aug 12', org: 'Deaf Connect' },
              { name: 'Community Sign Meetup',    date: 'Aug 19', org: 'LinkHands' },
            ].map(ev => (
              <div key={ev.name} className={styles.eventRow}>
                <div className={styles.eventDate}>{ev.date}</div>
                <div>
                  <div className={styles.eventName}>{ev.name}</div>
                  <div className={styles.eventOrg}>by {ev.org}</div>
                </div>
              </div>
            ))}
            <div className={styles.placeholderNote}>
              {/* TODO: Fetch from GET /api/events?upcoming=true */}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
