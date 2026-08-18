const DB_NAME = 'mote-web-v2';
const DB_VERSION = 1;

let databasePromise;

export function createId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `mote-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed.'));
  });
}

function transactionDone(transaction) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB transaction failed.'));
    transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB transaction aborted.'));
  });
}

export function openDatabase() {
  if (databasePromise) return databasePromise;

  databasePromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains('groups')) {
        const groups = db.createObjectStore('groups', { keyPath: 'id' });
        groups.createIndex('sortOrder', 'sortOrder', { unique: false });
      }

      if (!db.objectStoreNames.contains('notes')) {
        const notes = db.createObjectStore('notes', { keyPath: 'id' });
        notes.createIndex('groupId', 'groupId', { unique: false });
        notes.createIndex('updatedAt', 'updatedAt', { unique: false });
        notes.createIndex('deletedAt', 'deletedAt', { unique: false });
        notes.createIndex('isHidden', 'isHidden', { unique: false });
        notes.createIndex('isFavorite', 'isFavorite', { unique: false });
      }

      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Unable to open Mote database.'));
    request.onblocked = () => reject(new Error('Mote database upgrade is blocked by another tab.'));
  });

  return databasePromise;
}

async function getAll(storeName) {
  const db = await openDatabase();
  const transaction = db.transaction(storeName, 'readonly');
  return requestToPromise(transaction.objectStore(storeName).getAll());
}

async function put(storeName, value) {
  const db = await openDatabase();
  const transaction = db.transaction(storeName, 'readwrite');
  transaction.objectStore(storeName).put(value);
  await transactionDone(transaction);
  return value;
}

export async function getGroups() {
  const groups = await getAll('groups');
  return groups.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name));
}

export async function saveGroup(group) {
  return put('groups', group);
}

export async function deleteGroupAndMoveNotesToInbox(groupId) {
  const db = await openDatabase();
  const transaction = db.transaction(['groups', 'notes'], 'readwrite');
  const groupsStore = transaction.objectStore('groups');
  const notesStore = transaction.objectStore('notes');
  const notesRequest = notesStore.getAll();

  notesRequest.onsuccess = () => {
    const now = new Date().toISOString();
    for (const note of notesRequest.result) {
      if (note.groupId === groupId) notesStore.put({ ...note, groupId: null, updatedAt: now });
    }
    groupsStore.delete(groupId);
  };

  await transactionDone(transaction);
}

export async function deleteGroupAndMoveNotesToTrash(groupId) {
  const db = await openDatabase();
  const transaction = db.transaction(['groups', 'notes'], 'readwrite');
  const groupsStore = transaction.objectStore('groups');
  const notesStore = transaction.objectStore('notes');
  const notesRequest = notesStore.getAll();

  notesRequest.onsuccess = () => {
    const now = new Date().toISOString();
    for (const note of notesRequest.result) {
      if (note.groupId === groupId) {
        notesStore.put({
          ...note,
          groupId: null,
          deletedAt: note.deletedAt ?? now,
          updatedAt: now
        });
      }
    }
    groupsStore.delete(groupId);
  };

  await transactionDone(transaction);
}

export async function getNotes() {
  return getAll('notes');
}

export async function getNote(id) {
  const db = await openDatabase();
  const transaction = db.transaction('notes', 'readonly');
  return requestToPromise(transaction.objectStore('notes').get(id));
}

export async function saveNote(note) {
  return put('notes', note);
}

export async function permanentlyDeleteNote(id) {
  const db = await openDatabase();
  const transaction = db.transaction('notes', 'readwrite');
  transaction.objectStore('notes').delete(id);
  await transactionDone(transaction);
}

export async function cleanupExpiredTrash(days = 30) {
  const db = await openDatabase();
  const transaction = db.transaction('notes', 'readwrite');
  const store = transaction.objectStore('notes');
  const request = store.getAll();
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

  request.onsuccess = () => {
    for (const note of request.result) {
      if (note.deletedAt && new Date(note.deletedAt).getTime() <= cutoff) store.delete(note.id);
    }
  };

  await transactionDone(transaction);
}

export async function getSettings() {
  const rows = await getAll('settings');
  return Object.fromEntries(rows.map((entry) => [entry.key, entry.value]));
}

export async function setSetting(key, value) {
  return put('settings', { key, value, updatedAt: new Date().toISOString() });
}

export async function createBackupSnapshot() {
  const [groups, notes, settingsRows] = await Promise.all([getGroups(), getNotes(), getAll('settings')]);
  return {
    format: 'mote-backup',
    version: 2,
    databaseSchemaVersion: DB_VERSION,
    exportedAt: new Date().toISOString(),
    groups,
    notes,
    settings: Object.fromEntries(settingsRows.map((entry) => [entry.key, entry.value]))
  };
}

export async function replaceAllData(snapshot) {
  const db = await openDatabase();
  const transaction = db.transaction(['groups', 'notes', 'settings'], 'readwrite');
  const groupsStore = transaction.objectStore('groups');
  const notesStore = transaction.objectStore('notes');
  const settingsStore = transaction.objectStore('settings');

  groupsStore.clear();
  notesStore.clear();
  settingsStore.clear();

  for (const group of snapshot.groups) groupsStore.put(group);
  for (const note of snapshot.notes) notesStore.put(note);
  for (const [key, value] of Object.entries(snapshot.settings ?? {})) {
    settingsStore.put({ key, value: String(value), updatedAt: new Date().toISOString() });
  }

  await transactionDone(transaction);
}
