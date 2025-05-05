class OfflineManager {
  constructor() {
    this.dbName = 'BallisticCalculatorDB';
    this.dbVersion = 2;
    this.db = null;
  }

  async getDB() {
    if (this.db) return this.db;
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = (event) => {
        console.error('Database error:', event.target.error);
        reject(event.target.error);
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Создаем хранилище для сессий
        if (!db.objectStoreNames.contains('sessions')) {
          const sessionsStore = db.createObjectStore('sessions', { 
            keyPath: 'id',
            autoIncrement: true 
          });
          sessionsStore.createIndex('date', 'date', { unique: false });
        }

        // Создаем хранилище для пуль
        if (!db.objectStoreNames.contains('bullets')) {
          const bulletsStore = db.createObjectStore('bullets', {
            keyPath: 'id'
          });
          bulletsStore.createIndex('caliber', 'caliber', { unique: false });
        }

        // Создаем хранилище для заметок
        if (!db.objectStoreNames.contains('notes')) {
          const notesStore = db.createObjectStore('notes', {
            keyPath: 'id',
            autoIncrement: true
          });
          notesStore.createIndex('sessionId', 'sessionId', { unique: false });
        }
      };
    });
  }

  async addBullet(bullet) {
    const db = await this.getDB();
    const tx = db.transaction('bullets', 'readwrite');
    const store = tx.objectStore('bullets');
    return store.add(bullet);
  }

  async getBullets() {
    const db = await this.getDB();
    const tx = db.transaction('bullets', 'readonly');
    const store = tx.objectStore('bullets');
    return store.getAll();
  }

  async deleteBullet(id) {
    const db = await this.getDB();
    const tx = db.transaction('bullets', 'readwrite');
    const store = tx.objectStore('bullets');
    return store.delete(id);
  }

  async addSession(session) {
    const db = await this.getDB();
    const tx = db.transaction('sessions', 'readwrite');
    const store = tx.objectStore('sessions');
    return store.add(session);
  }

  async getSessions() {
    const db = await this.getDB();
    const tx = db.transaction('sessions', 'readonly');
    const store = tx.objectStore('sessions');
    const index = store.index('date');
    return index.getAll();
  }

  async deleteSession(id) {
    const db = await this.getDB();
    const tx = db.transaction('sessions', 'readwrite');
    const store = tx.objectStore('sessions');
    return store.delete(id);
  }

  async addNote(note) {
    const db = await this.getDB();
    const tx = db.transaction('notes', 'readwrite');
    const store = tx.objectStore('notes');
    return store.add(note);
  }

  async getNotes(sessionId) {
    const db = await this.getDB();
    const tx = db.transaction('notes', 'readonly');
    const store = tx.objectStore('notes');
    const index = store.index('sessionId');
    return index.getAll(sessionId);
  }

  async deleteNote(id) {
    const db = await this.getDB();
    const tx = db.transaction('notes', 'readwrite');
    const store = tx.objectStore('notes');
    return store.delete(id);
  }
}

export default OfflineManager;