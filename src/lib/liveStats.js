import { getRegisteredOrganizations } from './organizations';

/**
 * Returns real-time platform stats computed from actual local data.
 * Offline-first: reads from localStorage/IndexedDB only.
 * All key patterns are aligned with the actual keys written by offlineDb.js and SpeedQuiz.jsx.
 */
export function getPlatformLiveStats() {
  try {
    let accounts = {};
    try {
      accounts = JSON.parse(localStorage.getItem('handspeak_accounts') || '{}');
    } catch {
      accounts = {};
    }

    const accountList = Object.values(accounts);
    const registeredLearners = accountList.filter(
      (a) => a?.user_metadata?.account_type !== 'organization'
    ).length;

    let activeUser = null;
    try {
      activeUser = JSON.parse(localStorage.getItem('handspeak_active_user') || 'null');
    } catch {}

    const hasActiveLearner =
      activeUser && activeUser?.user_metadata?.account_type !== 'organization';
    const learnerCount = Math.max(registeredLearners, hasActiveLearner ? 1 : 0);

    // Real approved partner orgs (defaults + approved registered)
    const orgs = getRegisteredOrganizations();
    const orgCount = orgs.length;

    // Count quizzes from user-specific keys only (not global polluted keys)
    // Keys written by SpeedQuiz.jsx: handspeak_quiz_history_${userId}
    let totalQuizzes = 0;
    let totalSignsTranslated = 0;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      const lower = key.toLowerCase();

      // Match user-scoped quiz history keys: handspeak_quiz_history_usr_* or handspeak_quiz_history_<id>
      if (lower.startsWith('handspeak_quiz_history_') && !lower.endsWith('_guest')) {
        try {
          const items = JSON.parse(localStorage.getItem(key));
          if (Array.isArray(items)) totalQuizzes += items.length;
        } catch {}
      }

      // Match user-scoped translate history keys: handspeak_translatehistory_* 
      // offlineDb.js writes: handspeak_translateHistory_${userId}
      if (
        lower.startsWith('handspeak_translatehistory_') ||
        lower.startsWith('handspeak_translate_history_')
      ) {
        try {
          const items = JSON.parse(localStorage.getItem(key));
          if (Array.isArray(items)) totalSignsTranslated += items.length;
        } catch {}
      }
    }

    return {
      learners: learnerCount,
      organizations: orgCount,
      vocabularyClasses: 36, // 26 A–Z letters + 10 digits (0–9) = 36 signs
      totalQuizzes,
      signsTranslated: totalSignsTranslated,
      communityTotal: Math.max(1, learnerCount + orgCount),
    };
  } catch (err) {
    console.error('Error fetching live platform stats:', err);
    return {
      learners: 0,
      organizations: 4,
      vocabularyClasses: 36, // 26 A–Z letters + 10 digits (0–9) = 36 signs
      totalQuizzes: 0,
      signsTranslated: 0,
      communityTotal: 4,
    };
  }
}
