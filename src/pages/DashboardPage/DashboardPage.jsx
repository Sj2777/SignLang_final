import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  getLearningData,
  loadQuizBestScore,
  mergeQuizHistories,
  mergeTranslateHistories,
} from '../../lib/offlineDb';
import {
  getRegisteredOrganizations,
  getLearnerMembership,
  registerLearnerToOrg,
  unregisterLearnerFromOrg,
  getOrgMemberRequests,
  approveMemberRequest,
  rejectMemberRequest,
} from '../../lib/organizations';
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

function toLocalDateStr(dateObj) {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function calculateStreak(historyItems) {
  if (!historyItems || historyItems.length === 0) return 0;

  const dates = new Set();
  for (const item of historyItems) {
    if (!item) continue;
    const raw = item.completedAt || item.timestamp || item.date;
    if (raw) {
      const d = new Date(raw);
      if (!isNaN(d.getTime())) {
        dates.add(toLocalDateStr(d));
      }
    }
  }

  if (dates.size === 0) return historyItems.length > 0 ? 1 : 0;

  const now = new Date();
  const todayStr = toLocalDateStr(now);
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = toLocalDateStr(yesterday);

  let current = todayStr;
  if (!dates.has(todayStr)) {
    if (dates.has(yesterdayStr)) {
      current = yesterdayStr;
    } else {
      return historyItems.length > 0 ? 1 : 0;
    }
  }

  let streak = 0;
  let checkDate = new Date(current === todayStr ? now : yesterday);
  while (true) {
    const checkStr = toLocalDateStr(checkDate);
    if (dates.has(checkStr)) {
      streak += 1;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return Math.max(streak, historyItems.length > 0 ? 1 : 0);
}

export default function DashboardPage() {
  const { user } = useAuth();
  
  const activeUser = user || (() => {
    try {
      return JSON.parse(localStorage.getItem('handspeak_active_user'));
    } catch {
      return null;
    }
  })();

  const userName = activeUser?.user_metadata?.name || activeUser?.email?.split('@')[0] || 'User';
  const isOrg = activeUser?.user_metadata?.account_type === 'organization';

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

  const [organizations, setOrganizations] = useState([]);
  const [learnerOrg, setLearnerOrg] = useState(null);
  const [orgRequests, setOrgRequests] = useState([]);
  const [actionNotice, setActionNotice] = useState('');

  const userId = activeUser?.id || (activeUser?.email ? 'usr_' + activeUser.email.trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, '_') : 'guest');
  const emailKey = activeUser?.email ? activeUser.email.trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, '_') : null;

  const handleRegisterOrg = (org) => {
    try {
      const membership = registerLearnerToOrg(userId, org, {
        name: userName,
        email: activeUser?.email,
      });
      setLearnerOrg(membership);
      const isAutoApproved = membership.status === 'approved';
      setActionNotice(
        isAutoApproved
          ? `You have joined ${org.name} as a registered member!`
          : `Registration request sent to ${org.name}! The organization mentor will review and approve your request.`
      );
    } catch (err) {
      console.error('Registration failed:', err);
    }
  };

  const handleUnregisterOrg = (orgId) => {
    try {
      unregisterLearnerFromOrg(userId, orgId);
      setLearnerOrg(null);
      setActionNotice('Your affiliation with this organization has been removed.');
    } catch (err) {
      console.error('Unregister failed:', err);
    }
  };

  const handleApproveLearner = (learnerId) => {
    try {
      approveMemberRequest(userId, learnerId);
      setOrgRequests(getOrgMemberRequests(userId));
      setActionNotice('Learner request approved successfully! They are now an active member.');
    } catch (err) {
      console.error('Approval failed:', err);
    }
  };

  const handleRejectLearner = (learnerId) => {
    try {
      rejectMemberRequest(userId, learnerId);
      setOrgRequests(getOrgMemberRequests(userId));
      setActionNotice('Learner request updated.');
    } catch (err) {
      console.error('Rejection failed:', err);
    }
  };

  const loadUserData = () => {
    const orgs = getRegisteredOrganizations();
    setOrganizations(orgs);
    setLearnerOrg(getLearnerMembership(userId));

    if (isOrg) {
      const requests = getOrgMemberRequests(userId);
      setOrgRequests(requests);
      return;
    }

    // Strict user-scoped localStorage read (NO cross-account leakage)
    let allLocalQuizAttempts = [];
    let allLocalTransAttempts = [];
    let localBest = 0;

    try {
      const bestKeys = [
        `handspeak_quiz_best_${userId}`,
        emailKey ? `handspeak_quiz_best_usr_${emailKey}` : null,
      ].filter(Boolean);

      for (const k of bestKeys) {
        const val = Number(localStorage.getItem(k)) || 0;
        if (val > localBest) localBest = val;
      }

      const histKeys = [
        `handspeak_quiz_history_${userId}`,
        `handspeak_quizHistory_${userId}`,
        emailKey ? `handspeak_quiz_history_usr_${emailKey}` : null,
      ].filter(Boolean);

      for (const k of histKeys) {
        const raw = localStorage.getItem(k);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) allLocalQuizAttempts.push(...parsed);
          } catch {}
        }
      }

      const transKeys = [
        `handspeak_translateHistory_${userId}`,
        `handspeak_translate_history_${userId}`,
        emailKey ? `handspeak_translateHistory_usr_${emailKey}` : null,
      ].filter(Boolean);

      for (const k of transKeys) {
        const raw = localStorage.getItem(k);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) allLocalTransAttempts.push(...parsed);
          } catch {}
        }
      }
    } catch {}

    const initialHistory = mergeQuizHistories(allLocalQuizAttempts);
    const initialTrans = mergeTranslateHistories(allLocalTransAttempts);
    const maxInHistory = initialHistory.reduce((max, item) => Math.max(max, Number(item?.score) || 0), 0);
    const initialBest = Math.max(localBest, maxInHistory);
    const quizCount = initialHistory.length;
    const totalScore = initialHistory.reduce((sum, item) => sum + (Number(item?.score) || 0), 0);
    const avgScore = quizCount > 0 ? Math.round(totalScore / quizCount) : 0;
    const accuracy = quizCount > 0 ? Math.min(100, Math.round((avgScore / 15) * 100)) : 0;
    const streak = calculateStreak([...initialHistory, ...initialTrans]);
    const uniqueSigns = new Set(initialTrans.map((t) => t.sign).filter(Boolean));
    const signsPracticed = uniqueSigns.size > 0 ? uniqueSigns.size : (initialBest > 0 ? Math.min(26, initialBest * 2) : 0);

    // Set initial synchronous user data immediately
    setLearningStats({
      bestScore: initialBest,
      quizCount,
      avgScore,
      accuracy,
      streak: Math.max(streak, quizCount > 0 ? 1 : 0),
      signsPracticed,
      recentQuizzes: [...initialHistory].slice(-4).reverse(),
      loaded: true,
    });

    // Merge asynchronously from user-isolated IndexedDB
    Promise.all([
      getLearningData(activeUser || userId).catch(() => null),
      loadQuizBestScore(activeUser || userId).catch(() => initialBest),
    ]).then(([data, bestScore]) => {
      const history = mergeQuizHistories(initialHistory, data?.quizHistory);
      const translateHistory = mergeTranslateHistories(initialTrans, data?.translateHistory);
      const maxScore = history.reduce((max, item) => Math.max(max, Number(item?.score) || 0), 0);
      const effectiveBest = Math.max(bestScore || 0, initialBest, data?.quizBestScore || 0, maxScore);
      const finalCount = history.length;
      const finalTotal = history.reduce((sum, item) => sum + (Number(item?.score) || 0), 0);
      const finalAvg = finalCount > 0 ? Math.round(finalTotal / finalCount) : 0;
      const finalAccuracy = finalCount > 0 ? Math.min(100, Math.round((finalAvg / 15) * 100)) : 0;
      const finalStreak = calculateStreak([...history, ...translateHistory]);
      const finalSigns = new Set(translateHistory.map((t) => t.sign).filter(Boolean));
      const finalSignsCount = finalSigns.size > 0 ? finalSigns.size : (effectiveBest > 0 ? Math.min(26, effectiveBest * 2) : 0);

      setLearningStats({
        bestScore: effectiveBest,
        quizCount: finalCount,
        avgScore: finalAvg,
        accuracy: finalAccuracy,
        streak: Math.max(finalStreak, finalCount > 0 ? 1 : 0),
        signsPracticed: finalSignsCount,
        recentQuizzes: [...history].slice(-4).reverse(),
        loaded: true,
      });
    });
  };

  useEffect(() => {
    // Reset state completely to prevent stale flash when switching accounts
    setLearningStats({
      bestScore: 0,
      quizCount: 0,
      avgScore: 0,
      accuracy: 0,
      streak: 0,
      signsPracticed: 0,
      recentQuizzes: [],
      loaded: false,
    });
    setLearnerOrg(null);
    setOrgRequests([]);
    loadUserData();

    const handleRefresh = () => loadUserData();
    const handleLogout = () => {
      setLearningStats({
        bestScore: 0,
        quizCount: 0,
        avgScore: 0,
        accuracy: 0,
        streak: 0,
        signsPracticed: 0,
        recentQuizzes: [],
        loaded: false,
      });
      setLearnerOrg(null);
      setOrgRequests([]);
    };

    window.addEventListener('focus', handleRefresh);
    window.addEventListener('storage', handleRefresh);
    window.addEventListener('handspeak_quiz_updated', handleRefresh);
    window.addEventListener('handspeak_org_updated', handleRefresh);
    window.addEventListener('handspeak_logout', handleLogout);

    return () => {
      window.removeEventListener('focus', handleRefresh);
      window.removeEventListener('storage', handleRefresh);
      window.removeEventListener('handspeak_quiz_updated', handleRefresh);
      window.removeEventListener('handspeak_org_updated', handleRefresh);
      window.removeEventListener('handspeak_logout', handleLogout);
    };
  }, [user?.id, isOrg]);

  const approvedMembersCount = orgRequests.filter((r) => r.status === 'approved').length;
  const pendingRequestsCount = orgRequests.filter((r) => r.status === 'pending').length;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Welcome back, {userName}!</h1>
        <p>{isOrg ? 'Manage learner membership requests and your deaf welfare chapter.' : 'Here is your real-time sign language learning progress.'}</p>
      </header>

      {/* Analytics Overview Panel */}
      <section className={styles.analyticsSection}>
        <h2 className={styles.sectionTitle}>Overview</h2>
        
        {isOrg ? (
          // Organization Profile & Incoming Requests Dashboard
          <>
            <div className={styles.orgInfoCard}>
              <div className={styles.orgField}>
                <span className={styles.orgLabel}>Organization</span>
                <span className={styles.orgValue}>{user?.user_metadata?.name || 'HandSpeak Partner'}</span>
              </div>
              <div className={styles.orgField}>
                <span className={styles.orgLabel}>Official Contact</span>
                <span className={styles.orgValue}>{user?.user_metadata?.contact_num || 'Not specified'}</span>
              </div>
              <div className={styles.orgField}>
                <span className={styles.orgLabel}>Registered Address</span>
                <span className={styles.orgValue}>{user?.user_metadata?.address || 'Not specified'}</span>
              </div>
              <div className={styles.orgField}>
                <span className={styles.orgLabel}>Verification Status</span>
                <span className={styles.orgValue} style={{ color: '#10B981' }}>
                  {user?.user_metadata?.phone_verified ? 'Mobile Verified ✓' : 'Registered Partner ✓'}
                </span>
              </div>
            </div>

            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statHeader}>
                  <span className={styles.statTitle}>Approved Learners</span>
                  <UsersSVG />
                </div>
                <div className={styles.statValue}>{approvedMembersCount}</div>
                <div className={styles.statSub}>Active registered members</div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statHeader}>
                  <span className={styles.statTitle}>Pending Requests</span>
                  <ActivitySVG />
                </div>
                <div className={styles.statValue} style={{ color: pendingRequestsCount > 0 ? '#D97706' : 'inherit' }}>
                  {pendingRequestsCount}
                </div>
                <div className={styles.statSub}>
                  {pendingRequestsCount > 0 ? 'Awaiting your review' : 'All requests reviewed'}
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statHeader}>
                  <span className={styles.statTitle}>Program Rating</span>
                  <StarSVG />
                </div>
                <div className={styles.statValue}>5.0 / 5</div>
                <div className={styles.statSub}>Deaf Welfare Certified</div>
              </div>
            </div>

            {/* ORGANIZATION APPROVAL WORKFLOW DASHBOARD */}
            <div className={styles.orgRequestsSection}>
              <h2 className={styles.sectionTitle}>Learner Membership Requests &amp; Roster</h2>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginTop: '-0.5rem', marginBottom: '1.25rem' }}>
                Review incoming affiliation requests from sign language learners. Approved learners are officially enrolled in your mentorship program.
              </p>

              {actionNotice && (
                <div className={styles.toastSuccess} style={{ marginBottom: '1.25rem' }}>
                  <span>{actionNotice}</span>
                  <button
                    type="button"
                    onClick={() => setActionNotice('')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: '#065F46', padding: '0 4px' }}
                  >
                    ✕
                  </button>
                </div>
              )}

              {orgRequests.length === 0 ? (
                <div className={styles.emptyPrompt} style={{ background: 'var(--color-surface)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                  <span>📬 No membership requests yet. When learners register with your organization in the Partner Directory, their requests will appear here for approval.</span>
                </div>
              ) : (
                <div className={styles.requestsList}>
                  {orgRequests.map((req) => (
                    <div key={req.userId} className={styles.requestCard}>
                      <div className={styles.requestInfo}>
                        <div className={styles.requestName}>
                          <span>{req.name || 'HandSpeak Learner'}</span>
                          {req.status === 'approved' && <span className={styles.badgeApproved}>Approved ✓</span>}
                          {req.status === 'pending' && <span className={styles.badgePending}>Pending Review ⏳</span>}
                          {req.status === 'rejected' && <span className={styles.badgeRejected}>Rejected</span>}
                        </div>
                        <div className={styles.requestMeta}>
                          <span>✉️ {req.email || 'Email on file'}</span>
                          <span>📅 Requested: {req.registeredAt ? new Date(req.registeredAt).toLocaleDateString() : 'Recent'}</span>
                        </div>
                      </div>

                      <div className={styles.requestActions}>
                        {req.status === 'pending' && (
                          <>
                            <button
                              type="button"
                              className={styles.btnApprove}
                              onClick={() => handleApproveLearner(req.userId)}
                            >
                              Approve Request ✓
                            </button>
                            <button
                              type="button"
                              className={styles.btnReject}
                              onClick={() => handleRejectLearner(req.userId)}
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {req.status === 'approved' && (
                          <button
                            type="button"
                            className={styles.btnRemove}
                            onClick={() => handleRejectLearner(req.userId)}
                          >
                            Revoke Membership
                          </button>
                        )}
                        {req.status === 'rejected' && (
                          <button
                            type="button"
                            className={styles.btnApprove}
                            onClick={() => handleApproveLearner(req.userId)}
                          >
                            Re-Approve
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          // Learner Dynamic Stats (Accurate strictly to this user)
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

            {/* Recent Quiz Attempts Log */}
            <div className={styles.historyCard}>
              <h3 className={styles.historyTitle}>
                Recent Quiz Attempts
                {learningStats.recentQuizzes.length > 0 && (
                  <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-muted)' }}>
                    ({learningStats.recentQuizzes.length} recent sessions)
                  </span>
                )}
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
                          {quiz.score === learningStats.bestScore && quiz.score > 0 && (
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

            {/* Partner Organisations Section for Learners */}
            <div className={styles.orgsSection}>
              <h2 className={styles.sectionTitle}>Partner Organisations &amp; Deaf Communities</h2>

              {actionNotice && (
                <div className={styles.toastSuccess}>
                  <span>{actionNotice}</span>
                  <button
                    type="button"
                    onClick={() => setActionNotice('')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: '#065F46', padding: '0 4px' }}
                    aria-label="Dismiss notice"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Learner's Registered Affiliation Banner with Status */}
              {learnerOrg && (
                learnerOrg.status === 'pending' ? (
                  <div className={styles.pendingBanner}>
                    <div className={styles.pendingText}>
                      <span style={{ fontSize: '1.25rem' }}>⏳</span>
                      <span>Request Pending: You applied to register with <strong>{learnerOrg.orgName}</strong>. Awaiting mentor approval.</span>
                    </div>
                    <button
                      type="button"
                      className={styles.btnReject}
                      onClick={() => handleUnregisterOrg(learnerOrg.orgId)}
                    >
                      Cancel Request
                    </button>
                  </div>
                ) : (
                  <div className={styles.affiliationBanner}>
                    <div className={styles.affiliationText}>
                      <span style={{ fontSize: '1.25rem' }}>🏛️</span>
                      <span>Registered Member: You are an active registered learner with <strong>{learnerOrg.orgName}</strong></span>
                    </div>
                    <button
                      type="button"
                      className={styles.affiliationAction}
                      onClick={() => handleUnregisterOrg(learnerOrg.orgId)}
                    >
                      Leave Organisation
                    </button>
                  </div>
                )
              )}

              <div className={styles.orgGrid}>
                {organizations.map((org) => {
                  const isMember = learnerOrg?.orgId === org.id;
                  const isPending = isMember && learnerOrg?.status === 'pending';
                  const isApproved = isMember && learnerOrg?.status === 'approved';

                  return (
                    <div
                      key={org.id}
                      className={`${styles.orgCard} ${isApproved ? styles.orgCardRegistered : ''}`}
                    >
                      <div className={styles.orgCardTop}>
                        <div className={styles.orgHeaderRow}>
                          <h3 className={styles.orgName}>{org.name}</h3>
                          {org.verified && <span className={styles.verifiedBadge}>Verified Partner ✓</span>}
                        </div>

                        <span className={styles.orgCategory}>{org.category}</span>
                        <p className={styles.orgDescription}>{org.description}</p>

                        <div className={styles.orgContactDetails}>
                          <div className={styles.contactRow}>
                            <span className={styles.contactIcon}>📞</span>
                            <span className={styles.contactText}>
                              <a href={`tel:${org.contact_num}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                                {org.contact_num}
                              </a>
                            </span>
                          </div>

                          <div className={styles.contactRow}>
                            <span className={styles.contactIcon}>✉️</span>
                            <span className={styles.contactText}>
                              <a href={`mailto:${org.email}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                                {org.email}
                              </a>
                            </span>
                          </div>

                          <div className={styles.contactRow}>
                            <span className={styles.contactIcon}>📍</span>
                            <span className={styles.contactText}>{org.address}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        {isApproved ? (
                          <button
                            type="button"
                            className={styles.orgRegisteredBtn}
                            onClick={() => handleUnregisterOrg(org.id)}
                          >
                            <span>Registered Member ✓</span>
                            <span style={{ fontSize: '0.8rem', opacity: 0.85 }}>(Click to Leave)</span>
                          </button>
                        ) : isPending ? (
                          <button
                            type="button"
                            className={styles.orgRegisteredBtn}
                            style={{ background: '#FEF3C7', color: '#92400E', borderColor: '#FDE68A' }}
                            onClick={() => handleUnregisterOrg(org.id)}
                          >
                            <span>Pending Approval ⏳</span>
                            <span style={{ fontSize: '0.8rem', opacity: 0.85 }}>(Click to Cancel)</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            className={styles.orgRegisterBtn}
                            onClick={() => handleRegisterOrg(org)}
                          >
                            <span>Request to Register</span>
                            <span>➔</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
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
