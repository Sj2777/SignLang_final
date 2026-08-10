import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './Dashboard.module.css';

export default function OrgDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <div className={styles.page}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarLogo}>
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="8" fill="url(#org-dash-grad)" />
            <path d="M8 22V14l4-3 4 5 4-7 4 6v7" stroke="white" strokeWidth="2.2"
                  strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="24" cy="10" r="2.5" fill="#A78BFA" />
            <defs>
              <linearGradient id="org-dash-grad" x1="0" y1="0" x2="32" y2="32">
                <stop stopColor="#7C3AED" /><stop offset="1" stopColor="#2563EB" />
              </linearGradient>
            </defs>
          </svg>
          <span className={styles.sidebarBrand}>LinkHands</span>
        </div>

        <nav className={styles.sidebarNav} aria-label="Organization dashboard navigation">
          {[
            { icon: '📊', label: 'Overview',        active: true },
            { icon: '📅', label: 'Events'                       },
            { icon: '👥', label: 'Members'                      },
            { icon: '🎓', label: 'Lessons'                      },
            { icon: '📈', label: 'Analytics'                    },
            { icon: '⚙️', label: 'Profile & Settings'           },
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
        <header className={styles.topBar}>
          <div>
            <h1 className={styles.pageTitle}>{user?.name} Dashboard 🏛️</h1>
            <p className={styles.pageSub}>Manage your organization, events, and outreach.</p>
          </div>
          <div className={styles.avatar} style={{ background: 'linear-gradient(135deg,#7C3AED,#8B5CF6)' }}>
            {user?.name?.slice(0,2).toUpperCase()}
          </div>
        </header>

        <div className={styles.statsGrid}>
          {[
            { icon: '👥', label: 'Connected Learners', value: '148',    color: '#7C3AED' },
            { icon: '📅', label: 'Events This Month',  value: '3',      color: '#2563EB' },
            { icon: '🎓', label: 'Lessons Published',  value: '12',     color: '#059669' },
            { icon: '📊', label: 'Outreach Score',     value: '94/100', color: '#D97706' },
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

        <div className={styles.placeholderGrid}>
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Upcoming Events</h2>
            <p className={styles.cardSub}>Manage and create community events</p>
            {[
              { name: 'ASL Workshop — Greetings', date: 'Aug 12', attendees: 24 },
              { name: 'Volunteer Orientation',    date: 'Aug 20', attendees: 11 },
            ].map(ev => (
              <div key={ev.name} className={styles.eventRow}>
                <div className={styles.eventDate}>{ev.date}</div>
                <div>
                  <div className={styles.eventName}>{ev.name}</div>
                  <div className={styles.eventOrg}>{ev.attendees} attendees registered</div>
                </div>
              </div>
            ))}
            <div className={styles.placeholderNote}>
              {/* TODO: Fetch from GET /api/organizations/me/events */}
            </div>
          </div>

          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Recent Activity</h2>
            <p className={styles.cardSub}>Learner interactions in the last 7 days</p>
            {[
              { text: 'New learner connected',       time: '2h ago'  },
              { text: 'Event RSVP from Jane Doe',    time: '5h ago'  },
              { text: 'Lesson viewed: Greetings',    time: '1d ago'  },
              { text: 'Profile visit from user #47', time: '2d ago'  },
            ].map(a => (
              <div key={a.text} className={styles.activityRow}>
                <div className={styles.activityDot} />
                <div className={styles.activityText}>{a.text}</div>
                <div className={styles.activityTime}>{a.time}</div>
              </div>
            ))}
            <div className={styles.placeholderNote}>
              {/* TODO: Fetch from GET /api/organizations/me/activity */}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
