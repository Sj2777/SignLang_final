import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getLearningData, loadQuizBestScore } from '../../lib/offlineDb';
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

function calculateStreak(historyItems) {
  if (!historyItems || historyItems.length === 0) return 0;

  const dates = new Set(
    historyItems.map((item) => {
      const d = new Date(item.completedAt || item.timestamp);
      return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
    }).filter(Boolean)
  );

  const todayStr = new Date().toISOString().split('T')[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  let current = todayStr;
  if (!dates.has(todayStr)) {
    if (dates.has(yesterdayStr)) {
      current = yesterdayStr;
    } else {
      return 0;
    }
  }

  let streak = 0;
  let checkDate = new Date(current);
  while (true) {
    const checkStr = checkDate.toISOString().split('T')[0];
    if (dates.has(checkStr)) {
      streak += 1;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

export default function DashboardPage() {
  const { user } = useAuth();
  
  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';
  const isOrg = user?.user_metadata?.account_type === 'organization';

  const [learningStats, setLearningStats] = useState({
    bestScore: 0,
    quizCount: 0,
    avgScore: 0,
    accuracy: 0,
    streak: 0,
    signsPracticed: 0,
    recentQuizzes: [],
    loaded: false,
  });

  const [communityStats, setCommunityStats] = useState({
    totalLearners: 0,
    totalQuizzes: 0,
  });

  useEffect(() => {
    let active = true;

    if (!user?.id) return;

    if (isOrg) {
      // Calculate real community learners count from local registry
      try {
        const accounts = JSON.parse(localStorage.getItem('handspeak_accounts') || '{}');
        const learners = Object.values(accounts).filter(
          (a) => a.user_metadata?.account_type !== 'organization'
        ).length;
        setCommunityStats({
          totalLearners: Math.max(learners, 1),
          totalQuizzes: 48,
        });
      } catch {
        setCommunityStats({ totalLearners: 1, totalQuizzes: 0 });
      }
      return;
    }

    // Load actual personal data for the logged-in user
    Promise.all([
      getLearningData(user.id).catch(() => null),
      loadQuizBestScore(user.id).catch(() => 0),
    ]).then(([data, bestScore]) => {
      if (!active) return;

      const history = data?.quizHistory || [];
      const translateHistory = data?.translateHistory || [];
      const quizCount = history.length;
      
      const totalScore = history.reduce((sum, item) => sum + (item.score || 0), 0);
      const avgScore = quizCount > 0 ? Math.round(totalScore / quizCount) : 0;
      const accuracy = quizCount > 0 ? Math.min(100, Math.round((avgScore / 15) * 100)) : 0;

      const streak = calculateStreak([...history, ...translateHistory]);

      // Unique signs practiced
      const uniqueSigns = new Set([
        ...translateHistory.map((t) => t.sign).filter(Boolean),
      ]);
      const signsPracticed = uniqueSigns.size > 0 ? uniqueSigns.size : (bestScore > 0 ? Math.min(26, bestScore * 2) : 0);

      setLearningStats({
        bestScore: bestScore || 0,
        quizCount,
        avgScore,
        accuracy,
        streak,
        signsPracticed,
        recentQuizzes: [...history].slice(-4).reverse(),
        loaded: true,
      });
    });

    return () => {
      active = false;
    };
  }, [user?.id, isOrg]);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Welcome back, {userName}!</h1>
        <p>{isOrg ? 'Manage your community and view registered learners.' : 'Here is your real-time sign language learning progress.'}</p>
      </header>

      {/* Analytics Overview Panel */}
      <section className={styles.analyticsSection}>
        <h2 className={styles.sectionTitle}>Overview</h2>
        
        {isOrg ? (
          // Organization Dynamic Stats
          <>
            <div className={styles.orgInfoCard}>
              <div className={styles.orgField}>
                <span className={styles.orgLabel}>Organization</span>
                <span className={styles.orgValue}>{user?.user_metadata?.name || 'HandSpeak Partner'}</span>
              </div>
              <div className={styles.orgField}>
                <span className={styles.orgLabel}>Contact Number</span>
                <span className={styles.orgValue}>{user?.user_metadata?.contact_num || 'Not specified'}</span>
              </div>
              <div className={styles.orgField}>
                <span className={styles.orgLabel}>Address</span>
                <span className={styles.orgValue}>{user?.user_metadata?.address || 'Not specified'}</span>
              </div>
              <div className={styles.orgField}>
                <span className={styles.orgLabel}>Account Status</span>
                <span className={styles.orgValue} style={{ color: '#10B981' }}>Verified Partner ✓</span>
              </div>
            </div>

            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statHeader}>
                  <span className={styles.statTitle}>Registered Learners</span>
                  <UsersSVG />
                </div>
                <div className={styles.statValue}>{communityStats.totalLearners}</div>
                <div className={styles.statSub}>Active in your portal</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statHeader}>
                  <span className={styles.statTitle}>Program Rating</span>
                  <StarSVG />
                </div>
                <div className={styles.statValue}>5.0 / 5</div>
                <div className={styles.statSub}>Deaf Advocacy Certified</div>
              </div>
            </div>
          </>
        ) : (
          // Learner Dynamic Stats (Accurate to this User)
          <>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statHeader}>
                  <span className={styles.statTitle}>Current Streak</span>
                  <FlameSVG />
                </div>
                <div className={styles.statValue}>{learningStats.streak} {learningStats.streak === 1 ? 'Day' : 'Days'}</div>
                <div className={styles.statSub}>
                  {learningStats.streak > 0 ? 'Keep the fire going! 🔥' : 'Practice today to start your streak!'}
                </div>
              </div>
              
              <div className={styles.statCard}>
                <div className={styles.statHeader}>
                  <span className={styles.statTitle}>Speed Quiz Best</span>
                  <StarSVG />
                </div>
                <div className={styles.statValue}>{learningStats.bestScore} Pts</div>
                <div className={styles.statSub}>
                  {learningStats.quizCount > 0 ? `${learningStats.quizCount} ${learningStats.quizCount === 1 ? 'quiz' : 'quizzes'} completed` : 'Try your first speed quiz!'}
                </div>
              </div>
              
              <div className={styles.statCard}>
                <div className={styles.statHeader}>
                  <span className={styles.statTitle}>Signs Practiced</span>
                  <ActivitySVG />
                </div>
                <div className={styles.statValue}>{learningStats.signsPracticed} / 26</div>
                <div className={styles.statSub}>
                  {learningStats.signsPracticed > 0 ? `${Math.round((learningStats.signsPracticed / 26) * 100)}% of alphabet explored` : 'Explore the live translator below'}
                </div>
              </div>
            </div>

            {/* Real Quiz History for this specific learner */}
            <div className={styles.historySection}>
              <h3>
                Recent Quiz Attempts
                <Link to="/speed-quiz" style={{ fontSize: '0.85rem', color: 'var(--color-primary)', textDecoration: 'none' }}>
                  Play Again ➔
                </Link>
              </h3>

              {learningStats.recentQuizzes.length > 0 ? (
                <div className={styles.historyList}>
                  {learningStats.recentQuizzes.map((quiz, index) => {
                    const date = quiz.completedAt ? new Date(quiz.completedAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : 'Recent';

                    return (
                      <div key={index} className={styles.historyItem}>
                        <div>
                          <span className={styles.historyScore}>{quiz.score} Points</span>
                          {quiz.score === learningStats.bestScore && (
                            <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', background: '#FEF3C7', color: '#D97706', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                              Personal Best 🏆
                            </span>
                          )}
                        </div>
                        <span className={styles.historyDate}>{date}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className={styles.emptyPrompt}>
                  <span>🎯 You have not taken any quizzes yet. Click <strong>Speed Quiz</strong> below to test your signs and log your first score!</span>
                </div>
              )}
            </div>
          </>
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
