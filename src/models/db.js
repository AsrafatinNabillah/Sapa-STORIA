let db;
const DB_NAME = 'myDatabase';
const DB_VERSION = 1;
const STORE_NAME = 'stories';

export async function openDB() {
  if (db) return db; // Hindari open ulang
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = function(event) {
      db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = function(event) {
      db = event.target.result;
      resolve(db);
    };

    request.onerror = function(event) {
      reject(`Gagal membuka database: ${event.target.errorCode}`);
    };
  });
}

export async function saveData(data) {
  console.log('Menyimpan data:', data); // Log data sebelum disimpan

  if (!db) await openDB(); // Pastikan DB siap

  if (!data || typeof data !== 'object') {
    return Promise.reject("Data tidak valid: bukan objek");
  }

  if (!data.id) {
    console.error("Data tidak memiliki key 'id'. Data yang diterima:", data);
    return Promise.reject("Data tidak memiliki id yang valid");
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(data);

    request.onsuccess = () => resolve(true);
    request.onerror = (event) => {
      console.error("Gagal menyimpan data ke IndexedDB:", event.target.error);
      reject(`Gagal menyimpan data: ${event.target.error}`);
    };
  });
}

export async function getAllData() {
  if (!db) await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject('Gagal mengambil data');
  });
}

export async function deleteData(id) {
  if (!db) await openDB();
  if (!id) {
    return Promise.reject("ID tidak valid");
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve(true);
    request.onerror = () => reject('Gagal menghapus data');
  });
}

export async function getDataById(id) {
  if (!db) await openDB();
  if (!id) {
    return Promise.reject("ID tidak valid");
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => {
      if (request.result) {
        resolve(request.result);
      } else {
        reject('Data tidak ditemukan');
      }
    };
    request.onerror = () => reject('Gagal mengambil data');
  });
}
