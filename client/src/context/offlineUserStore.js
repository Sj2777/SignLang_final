const DATABASE_NAME = 'handspeak-offline';
const DATABASE_VERSION = 1;
const STORE_NAME = 'auth';
const USER_RECORD_KEY = 'cached-user';

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Could not open offline storage.'));
  });
}

async function useStore(mode, operation) {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode);
    const request = operation(transaction.objectStore(STORE_NAME));

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Offline storage request failed.'));
    transaction.oncomplete = () => database.close();
    transaction.onerror = () => {
      database.close();
      reject(transaction.error || new Error('Offline storage transaction failed.'));
    };
    transaction.onabort = () => {
      database.close();
      reject(transaction.error || new Error('Offline storage transaction was aborted.'));
    };
  });
}

export async function getCachedUser() {
  const record = await useStore('readonly', (store) => store.get(USER_RECORD_KEY));
  return record?.user || null;
}

export async function saveCachedUser(user) {
  return useStore('readwrite', (store) => store.put({
    key: USER_RECORD_KEY,
    user,
    savedAt: Date.now(),
  }));
}

export async function clearCachedUser() {
  return useStore('readwrite', (store) => store.delete(USER_RECORD_KEY));
}
