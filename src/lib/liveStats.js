import { getRegisteredOrganizations } from './organizations';

/**
 * Computes live, authentic platform statistics from actual registered accounts,
 * affiliated deaf welfare organisations, quiz attempts, and practice sessions.
 */
export function getPlatformLiveStats() {
  try {
    // 1. Count actual registered accounts
    let accounts = {};
    try {
      accounts = JSON.parse(localStorage.getItem('handspeak_accounts') || '{}');
    } catch {
      accounts = {};
    }
    const accountList = Object.values(accounts);

    let activeUser = null;
    try {
      activeUser = JSON.parse(localStorage.getItem('handspeak_active_user') || 'null');
    } catch {}

    const registeredLearners = accountList.filter(
      (a) => a?.user_metadata?.account_type !== 'organization'
    ).length;

    // Minimum 1 if an active session exists
    const hasActiveLearner = activeUser && activeUser?.user_metadata?.account_type !== 'organization';
    const learnerCount = Math.max(registeredLearners, hasActiveLearner ? 1 : 0);

    // 2. Real accredited organisations (ISLRTC, NAD, AIFD, PAD + any registered org accounts)
    const orgs = getRegisteredOrganizations();
    const orgCount = orgs.length;

    // 3. Real quiz attempts and signs translated from device storage
    let totalQuizzes = 0;
    let totalSignsTranslated = 0;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      if (key.includes('quiz_history') || key.includes('quiz_attempts')) {
        try {
          const items = JSON.parse(localStorage.getItem(key));
          if (Array.isArray(items)) {
            totalQuizzes += items.length;
          }
        } catch {}
      }

      if (key.includes('translation_history') || key.includes('learning_data')) {
        try {
          const items = JSON.parse(localStorage.getItem(key));
          if (Array.isArray(items)) {
            totalSignsTranslated += items.length;
          } else if (items?.translateHistory && Array.isArray(items.translateHistory)) {
            totalSignsTranslated += items.translateHistory.length;
          }
        } catch {}
      }
    }

    return {
      learners: learnerCount,
      organizations: orgCount,
      totalQuizzes,
      signsTranslated: totalSignsTranslated,
      vocabularyClasses: 33, // 26 Letters (A-Z) + 7 Regional Indian Word Signs
      communityTotal: Math.max(1, learnerCount + orgCount),
    };
  } catch (err) {
    console.error('Error fetching live platform stats:', err);
    return {
      learners: 1,
      organizations: 4,
      totalQuizzes: 0,
      signsTranslated: 0,
      vocabularyClasses: 33,
      communityTotal: 5,
    };
  }
}
