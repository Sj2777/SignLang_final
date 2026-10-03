import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './DashboardPage.module.css';

const ActivitySVG = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>
);

const FlameSVG = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z"/>
  </svg>
);

const StarSVG = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

const UsersSVG = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
    <circle cx="9" cy="7" r="4"></circle>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
  </svg>
);

export default function DashboardPage() {
  const { user } = useAuth();
  
  const userName = user?.user_metadata?.name || 'User';
  const isOrg = user?.user_metadata?.account_type === 'organization';

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Welcome back, {userName}!</h1>
        <p>{isOrg ? 'Manage your community and outreach.' : 'Ready to continue your sign language journey?'}</p>
      </header>

      {/* Analytics Overview Panel */}
      <section className={styles.analyticsSection}>
        <h2 className={styles.sectionTitle}>Overview</h2>
        
        {isOrg ? (
          // Organization Stats
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statHeader}>
                <span className={styles.statTitle}>Active Learners</span>
                <UsersSVG />
              </div>
              <div className={styles.statValue}>124</div>
              <div className={styles.statSub}>+12 this week</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statHeader}>
                <span className={styles.statTitle}>Community Rating</span>
                <StarSVG />
              </div>
              <div className={styles.statValue}>4.9/5</div>
              <div className={styles.statSub}>Top 5% in Pune</div>
            </div>
          </div>
        ) : (
          // Learner Stats
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statHeader}>
                <span className={styles.statTitle}>Current Streak</span>
                <FlameSVG />
              </div>
              <div className={styles.statValue}>14 Days</div>
              <div className={styles.statSub}>Keep it up! 🔥</div>
            </div>
            
            <div className={styles.statCard}>
              <div className={styles.statHeader}>
                <span className={styles.statTitle}>Signs Mastered</span>
                <ActivitySVG />
              </div>
              <div className={styles.statValue}>42</div>
              <div className={styles.statSub}>+8 signs this week</div>
            </div>
            
            <div className={styles.statCard}>
              <div className={styles.statHeader}>
                <span className={styles.statTitle}>Quiz Accuracy</span>
                <StarSVG />
              </div>
              <div className={styles.statValue}>94%</div>
              <div className={styles.statSub}>Top 15% of learners</div>
            </div>
          </div>
        )}
      </section>

      {/* Tool Launchers */}
      <section className={styles.toolsSection}>
        <h2 className={styles.sectionTitle}>Your Tools</h2>
        <div className={styles.grid}>
          <Link to="/translate" className={styles.card}>
            <div className={styles.icon}>📷</div>
            <h2>Live Translator</h2>
            <p>Practice signs with real-time AI feedback.</p>
          </Link>
          
          <Link to="/reverse-translate" className={styles.card}>
            <div className={styles.icon}>⌨️</div>
            <h2>Text to ISL</h2>
            <p>Type or speak to see the sign language translation.</p>
          </Link>
          
          <Link to="/speed-quiz" className={styles.card}>
            <div className={styles.icon}>🎮</div>
            <h2>Speed Quiz</h2>
            <p>Test your knowledge in a gamified speed run.</p>
          </Link>
        </div>
      </section>
    </div>
  );
}
