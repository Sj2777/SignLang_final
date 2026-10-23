import { openDB } from 'idb';

const DATABASE_NAME = 'handspeak-offline';
const DATABASE_VERSION = 1;
const ACTIVE_PROFILE_KEY = 'active-profile';
const LEGACY_QUIZ_BEST_KEY = 'speedQuizBest';
const RETRY_DELAYS_MS = [500, 1500];
const HISTORY_KEYS = new Set(['lessonHistory', 'translateHistory', 'quizHistory']);

function getDatabase() {
  if (!('indexedDB' in globalThis)) {
    throw new Error('IndexedDB is unavailable in this browser.');
  }

  return openDB(DATABASE_NAME, DATABASE_VERSION, {
    upgrade(database, oldVersion) {
      if (oldVersion < 1) {
        database.createObjectStore('profiles', { keyPath: 'key' });
        database.createObjectStore('learningData', { keyPath: 'userId' });
        const pendingSync = database.createObjectStore('pendingSync', {
          keyPath: 'id',
          autoIncrement: true,
        });
        pendingSync.createIndex('by-user', 'userId');
      }
    },
  });
}

function normalizeAccountType(value) {
  return value === 'organization' ? 'organization' : 'individual';
}

export async function cacheUserProfile(user) {
  if (!user?.id) {
    throw new Error('Cannot cache a profile without a user id.');
  }

  const metadata = user.user_metadata ?? {};
  const profile = {
    key: ACTIVE_PROFILE_KEY,
    userId: user.id,
    email: user.email ?? '',
    account_type: normalizeAccountType(metadata.account_type),
    name: typeof metadata.name === 'string' ? metadata.name : '',
  };

  if (profile.account_type === 'organization') {
    profile.contact_num =
      typeof metadata.contact_num === 'string' ? metadata.contact_num : '';
    profile.address =
      typeof metadata.address === 'string' ? metadata.address : '';
  }

  const database = await getDatabase();
  await database.put('profiles', profile);
  return profile;
}

export async function getCachedUserProfile() {
  const database = await getDatabase();
  return database.get('profiles', ACTIVE_PROFILE_KEY);
}

export async function clearCachedUserProfile() {
  const database = await getDatabase();
  await database.delete('profiles', ACTIVE_PROFILE_KEY);
}

export function userFromCachedProfile(profile) {
  if (!profile?.userId) return null;

  const userMetadata = {
    account_type: normalizeAccountType(profile.account_type),
    name: profile.name ?? '',
  };
  if (userMetadata.account_type === 'organization') {
    userMetadata.contact_num = profile.contact_num ?? '';
    userMetadata.address = profile.address ?? '';
  }

  return {
    id: profile.userId,
    email: profile.email ?? '',
    user_metadata: userMetadata,
  };
}

function createEmptyLearningData(userId) {
  return {
    userId,
    quizBestScore: 0,
    quizHistory: [],
    lessonHistory: [],
    translateHistory: [],
    progress: {},
    updatedAt: new Date().toISOString(),
  };
}

export function resolveUserId(userOrId) {
  if (!userOrId) return 'usr_guest';
  if (typeof userOrId === 'object') {
    if (userOrId.id) return String(userOrId.id);
    if (userOrId.email) {
      return 'usr_' + userOrId.email.trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, '_');
    }
    return 'usr_guest';
  }
  return String(userOrId);
}

export function mergeQuizHistories(...sources) {
  const seen = new Set();
  const merged = [];

  for (const src of sources) {
    if (!Array.isArray(src)) continue;
    for (const item of src) {
      if (!item || typeof item !== 'object') continue;
      const score = Number(item.score ?? item.points ?? item.value) || 0;
      const completedAt = item.completedAt || item.timestamp || item.date || item.createdAt || '';
      const dedupeKey = completedAt ? `${completedAt}_${score}` : `attempt_${Math.random()}`;
      if (!seen.has(dedupeKey)) {
        seen.add(dedupeKey);
        merged.push({
          score,
          completedAt: completedAt || new Date().toISOString(),
        });
      }
    }
  }

  // Sort chronologically ascending
  merged.sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime());
  return merged;
}

export function mergeTranslateHistories(...sources) {
  const seen = new Set();
  const merged = [];

  for (const src of sources) {
    if (!Array.isArray(src)) continue;
    for (const item of src) {
      if (!item || typeof item !== 'object') continue;
      const sign = item.sign || item.letter || '';
      const timestamp = item.timestamp || item.completedAt || item.date || '';
      const dedupeKey = `${timestamp}_${sign}`;
      if (sign && !seen.has(dedupeKey)) {
        seen.add(dedupeKey);
        merged.push({
          sign,
          timestamp: timestamp || new Date().toISOString(),
        });
      }
    }
  }

  return merged;
}

export async function getLearningData(userOrId) {
  const userId = resolveUserId(userOrId);
  const emailKey = typeof userOrId === 'object' && userOrId?.email
    ? userOrId.email.trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, '_')
    : null;

  // Gather ALL local storage quiz history and best scores across all candidate and existing keys
  let localBest = 0;
  let allLocalQuizAttempts = [];
  let allLocalTransAttempts = [];

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      const lower = key.toLowerCase();

      // Collect quiz attempts
      if (lower.includes('quiz') && (lower.includes('hist') || lower.includes('attempt'))) {
        try {
          const raw = localStorage.getItem(key);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              allLocalQuizAttempts.push(...parsed);
            } else if (parsed && typeof parsed === 'object' && 'score' in parsed) {
              allLocalQuizAttempts.push(parsed);
            }
          }
        } catch {}
      }

      // Collect best scores
      if (lower.includes('quiz') && (lower.includes('best') || lower.includes('score'))) {
        try {
          const val = Number(localStorage.getItem(key)) || 0;
          if (val > localBest) localBest = val;
        } catch {}
      }

      // Collect translate history
      if (lower.includes('translate') && (lower.includes('hist') || lower.includes('attempt'))) {
        try {
          const raw = localStorage.getItem(key);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) allLocalTransAttempts.push(...parsed);
          }
        } catch {}
      }
    }
  } catch (err) {
    console.warn('Storage scan note in getLearningData:', err);
  }

  let dbData = null;
  try {
    const database = await getDatabase();
    dbData = await database.get('learningData', userId);
  } catch (err) {
    console.warn('Could not read learningData from IndexedDB:', err);
  }

  const result = dbData ?? createEmptyLearningData(userId);

  // Seamlessly merge IndexedDB and localStorage
  result.quizHistory = mergeQuizHistories(result.quizHistory, allLocalQuizAttempts);
  result.translateHistory = mergeTranslateHistories(result.translateHistory, allLocalTransAttempts);

  const maxInHistory = result.quizHistory.reduce((max, item) => Math.max(max, Number(item?.score) || 0), 0);
  result.quizBestScore = Math.max(result.quizBestScore || 0, localBest, maxInHistory);

  return result;
}

export async function saveQuizBestScore(userOrId, score) {
  const userId = resolveUserId(userOrId);
  const parsedScore = Number(score) || 0;
  if (!Number.isFinite(parsedScore) || parsedScore < 0) {
    throw new Error('Quiz best score must be a non-negative number.');
  }

  // Mirror synchronously to localStorage
  try {
    const key = `handspeak_quiz_best_${userId}`;
    const prev = Number(localStorage.getItem(key)) || 0;
    const finalScore = Math.max(prev, parsedScore);
    localStorage.setItem(key, String(finalScore));
    localStorage.setItem('speedQuizBest', String(finalScore));
    localStorage.setItem('handspeak_quiz_best', String(finalScore));
  } catch {}

  try {
    const database = await getDatabase();
    const transaction = database.transaction('learningData', 'readwrite');
    const store = transaction.objectStore('learningData');
    const current = (await store.get(userId)) ?? createEmptyLearningData(userId);
    const updated = {
      ...current,
      quizBestScore: Math.max(current.quizBestScore, parsedScore),
      updatedAt: new Date().toISOString(),
    };
    await store.put(updated);
    await transaction.done;
    return updated.quizBestScore;
  } catch (err) {
    console.warn('Could not save quiz best score to IndexedDB:', err);
    return parsedScore;
  }
}

export async function recordQuizCompletion(userOrId, score) {
  const userId = resolveUserId(userOrId);
  const emailKey = typeof userOrId === 'object' && userOrId?.email
    ? userOrId.email.trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, '_')
    : null;

  const parsedScore = Number(score) || 0;
  const now = new Date().toISOString();
  const newAttempt = { score: parsedScore, completedAt: now };

  let newBest = parsedScore;

  // 1. Synchronously persist to localStorage across all candidate keys
  try {
    const bestKeys = [
      `handspeak_quiz_best_${userId}`,
      emailKey ? `handspeak_quiz_best_usr_${emailKey}` : null,
      'speedQuizBest',
      'handspeak_quiz_best',
      'handspeak_quiz_best_usr_guest',
    ].filter(Boolean);

    for (const bk of bestKeys) {
      const prev = Number(localStorage.getItem(bk)) || 0;
      newBest = Math.max(prev, newBest);
      localStorage.setItem(bk, String(newBest));
    }

    const histKeys = [
      `handspeak_quiz_history_${userId}`,
      `handspeak_quizHistory_${userId}`,
      emailKey ? `handspeak_quiz_history_usr_${emailKey}` : null,
      'handspeak_quiz_history',
      'speedQuizHistory',
      'handspeak_quiz_history_usr_guest',
    ].filter(Boolean);

    let existingHist = [];
    for (const hk of histKeys) {
      const raw = localStorage.getItem(hk);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > existingHist.length) {
            existingHist = parsed;
          }
        } catch {}
      }
    }

    const updatedHist = [...existingHist, newAttempt];
    for (const hk of histKeys) {
      localStorage.setItem(hk, JSON.stringify(updatedHist));
    }

    // Trigger event for immediate dashboard updates
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('handspeak_quiz_updated', {
        detail: { score: parsedScore, completedAt: now, best: newBest }
      }));
    }
  } catch (err) {
    console.warn('Could not save quiz completion to localStorage:', err);
  }

  // 2. Atomically persist to IndexedDB in a single transaction
  try {
    const database = await getDatabase();
    const transaction = database.transaction('learningData', 'readwrite');
    const store = transaction.objectStore('learningData');
    const current = (await store.get(userId)) ?? createEmptyLearningData(userId);
    const finalBest = Math.max(current.quizBestScore || 0, newBest);
    const finalHist = [...(current.quizHistory || []), newAttempt];

    const updated = {
      ...current,
      quizBestScore: finalBest,
      quizHistory: finalHist,
      updatedAt: now,
    };
    await store.put(updated);
    await transaction.done;
    return { bestScore: finalBest, quizHistory: finalHist };
  } catch (err) {
    console.warn('Could not save quiz completion to IndexedDB:', err);
    return { bestScore: newBest, quizHistory: [newAttempt] };
  }
}

export async function loadQuizBestScore(userOrId) {
  const userId = resolveUserId(userOrId);
  const emailKey = typeof userOrId === 'object' && userOrId?.email
    ? userOrId.email.trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, '_')
    : null;

  let localBest = 0;
  const bestKeys = [
    `handspeak_quiz_best_${userId}`,
    emailKey ? `handspeak_quiz_best_usr_${emailKey}` : null,
    'speedQuizBest',
    'handspeak_quiz_best_usr_guest',
  ].filter(Boolean);

  for (const bk of bestKeys) {
    try {
      const val = localStorage.getItem(bk);
      if (val !== null) {
        localBest = Math.max(localBest, Number(val) || 0);
      }
    } catch {}
  }

  try {
    const learningData = await getLearningData(userId);
    const best = Math.max(localBest, learningData?.quizBestScore || 0);
    return best;
  } catch {
    return localBest;
  }
}

export async function recordLearningHistory(userId, historyKey, record) {
  if (!userId) throw new Error('A user id is required to record learning history.');
  if (!HISTORY_KEYS.has(historyKey)) {
    throw new Error(`Unsupported learning history collection: ${historyKey}`);
  }

  // Mirror to localStorage
  try {
    const storageKey = `handspeak_${historyKey}_${userId}`;
    const existing = JSON.parse(localStorage.getItem(storageKey) || '[]');
    const updated = [...existing, record];
    localStorage.setItem(storageKey, JSON.stringify(updated));
  } catch (err) {
    console.warn('Could not mirror learning history to localStorage:', err);
  }

  try {
    const database = await getDatabase();
    const transaction = database.transaction('learningData', 'readwrite');
    const store = transaction.objectStore('learningData');
    const current = (await store.get(userId)) ?? createEmptyLearningData(userId);
    const updated = {
      ...current,
      [historyKey]: [...(current[historyKey] || []), record],
      updatedAt: new Date().toISOString(),
    };
    await store.put(updated);
    await transaction.done;
  } catch (err) {
    console.warn(`Could not save ${historyKey} to IndexedDB:`, err);
  }
}

export async function setLearningProgress(userId, progressKey, value) {
  if (!userId) throw new Error('A user id is required to save learning progress.');
  if (!progressKey) throw new Error('A progress key is required.');

  const database = await getDatabase();
  const transaction = database.transaction('learningData', 'readwrite');
  const store = transaction.objectStore('learningData');
  const current = (await store.get(userId)) ?? createEmptyLearningData(userId);
  await store.put({
    ...current,
    progress: { ...current.progress, [progressKey]: value },
    updatedAt: new Date().toISOString(),
  });
  await transaction.done;
}

export async function queuePendingSync(userId, item) {
  if (!userId) throw new Error('A user id is required to queue a sync item.');
  const database = await getDatabase();
  return database.add('pendingSync', {
    userId,
    item,
    createdAt: new Date().toISOString(),
  });
}

export async function getPendingSync(userId) {
  if (!userId) throw new Error('A user id is required to read pending sync items.');
  const database = await getDatabase();
  return database.getAllFromIndex('pendingSync', 'by-user', userId);
}

export async function removePendingSync(id) {
  const database = await getDatabase();
  await database.delete('pendingSync', id);
}

async function syncPendingData(userId) {
  const pending = await getPendingSync(userId);
  if (pending.length === 0) return;

  // TODO: Push these items once a Supabase learning-progress table is defined.
  console.info(
    `Keeping ${pending.length} learning update(s) local; no Supabase progress table exists yet.`,
  );
}

export async function syncPendingDataWithRetry(userId) {
  for (let attempt = 0; ; attempt += 1) {
    try {
      await syncPendingData(userId);
      return;
    } catch (error) {
      if (attempt >= RETRY_DELAYS_MS.length) throw error;
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[attempt]));
    }
  }
}


