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

export async function getLearningData(userId) {
  if (!userId) throw new Error('A user id is required to load learning data.');
  const database = await getDatabase();
  return (await database.get('learningData', userId)) ?? createEmptyLearningData(userId);
}

export async function saveQuizBestScore(userId, score) {
  if (!userId) throw new Error('A user id is required to save a quiz score.');
  if (!Number.isFinite(score) || score < 0) {
    throw new Error('Quiz best score must be a non-negative number.');
  }

  const database = await getDatabase();
  const transaction = database.transaction('learningData', 'readwrite');
  const store = transaction.objectStore('learningData');
  const current = (await store.get(userId)) ?? createEmptyLearningData(userId);
  const updated = {
    ...current,
    quizBestScore: Math.max(current.quizBestScore, score),
    updatedAt: new Date().toISOString(),
  };
  await store.put(updated);
  await transaction.done;
  return updated.quizBestScore;
}

export async function loadQuizBestScore(userId) {
  const learningData = await getLearningData(userId);
  let legacyScore;

  try {
    const legacyValue = localStorage.getItem(LEGACY_QUIZ_BEST_KEY);
    if (legacyValue !== null) {
      const parsed = Number(legacyValue);
      if (Number.isFinite(parsed) && parsed >= 0) legacyScore = parsed;
    }
  } catch (error) {
    console.warn('Could not read the previous Speed Quiz score from localStorage.', error);
  }

  if (legacyScore === undefined) return learningData.quizBestScore;

  const migratedScore = await saveQuizBestScore(userId, legacyScore);
  try {
    localStorage.removeItem(LEGACY_QUIZ_BEST_KEY);
  } catch (error) {
    console.warn('Could not remove the migrated Speed Quiz score from localStorage.', error);
  }
  return migratedScore;
}

export async function recordLearningHistory(userId, historyKey, record) {
  if (!userId) throw new Error('A user id is required to record learning history.');
  if (!HISTORY_KEYS.has(historyKey)) {
    throw new Error(`Unsupported learning history collection: ${historyKey}`);
  }

  const database = await getDatabase();
  const transaction = database.transaction('learningData', 'readwrite');
  const store = transaction.objectStore('learningData');
  const current = (await store.get(userId)) ?? createEmptyLearningData(userId);
  const updated = {
    ...current,
    [historyKey]: [...current[historyKey], record],
    updatedAt: new Date().toISOString(),
  };
  await store.put(updated);
  await transaction.done;
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


