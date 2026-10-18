/**
 * Resilia Versioned IndexedDB Storage Layer & Migration System
 *
 * Implements versioned object stores and secondary indexes for:
 * 1. users & cached role information
 * 2. community operational information
 * 3. shelters & accessibility attributes
 * 4. resources & supplies
 * 5. incidents & hazards
 * 6. reports & corroborating/contradicting field observations
 * 7. verifications & coordinator decisions
 * 8. assistanceRequests & vulnerability profiles
 * 9. missions & responder dispatches
 * 10. alerts & emergency advisories
 * 11. cachedKnowledge records
 * 12. pendingSyncEvents durable queue
 * 13. syncConflicts resolution records
 * 14. auditEntries ledger
 * 15. inventoryMovements ledger
 */

export const DB_NAME = 'resilia_local_db';
export const DB_VERSION = 3; // Incremented for Triage, Ration Ayuda, Missing Kin, Mutual Aid, and Outbreak Watch

export const STORES = {
  USERS: 'users',
  COMMUNITY: 'community',
  SHELTERS: 'shelters',
  RESOURCES: 'resources',
  MOVEMENTS: 'inventoryMovements',
  INCIDENTS: 'incidents',
  REPORTS: 'reports',
  VERIFICATIONS: 'verifications',
  ASSISTANCE: 'assistanceRequests',
  MISSIONS: 'missions',
  ALERTS: 'alerts',
  KNOWLEDGE: 'cachedKnowledge',
  SYNC_EVENTS: 'pendingSyncEvents',
  SYNC_CONFLICTS: 'syncConflicts',
  AUDIT: 'auditEntries',
  // New Operational Stores
  TRIAGE_RECORDS: 'triageRecords',
  RATION_DISTRIBUTIONS: 'rationDistributions',
  MISSING_PERSONS: 'missingPersons',
  MUTUAL_AID: 'mutualAidPosts',
  OUTBREAK_WATCH: 'outbreakWatch',
} as const;

export type StoreName = (typeof STORES)[keyof typeof STORES];

export interface DBMigration {
  version: number;
  description: string;
  migrate: (db: IDBDatabase, tx: IDBTransaction) => void;
}

/**
 * Versioned Database Migrations
 * Executes sequentially when oldVersion < targetVersion
 */
export const DB_MIGRATIONS: DBMigration[] = [
  {
    version: 1,
    description: 'Initial schema: Create core object stores with primary keys',
    migrate: (db: IDBDatabase) => {
      if (!db.objectStoreNames.contains(STORES.USERS)) {
        db.createObjectStore(STORES.USERS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.COMMUNITY)) {
        db.createObjectStore(STORES.COMMUNITY, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.SHELTERS)) {
        db.createObjectStore(STORES.SHELTERS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.RESOURCES)) {
        db.createObjectStore(STORES.RESOURCES, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.MOVEMENTS)) {
        db.createObjectStore(STORES.MOVEMENTS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.INCIDENTS)) {
        db.createObjectStore(STORES.INCIDENTS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.REPORTS)) {
        db.createObjectStore(STORES.REPORTS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.VERIFICATIONS)) {
        db.createObjectStore(STORES.VERIFICATIONS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.ASSISTANCE)) {
        db.createObjectStore(STORES.ASSISTANCE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.MISSIONS)) {
        db.createObjectStore(STORES.MISSIONS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.ALERTS)) {
        db.createObjectStore(STORES.ALERTS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.KNOWLEDGE)) {
        db.createObjectStore(STORES.KNOWLEDGE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.SYNC_EVENTS)) {
        db.createObjectStore(STORES.SYNC_EVENTS, { keyPath: 'event_id' });
      }
      if (!db.objectStoreNames.contains(STORES.SYNC_CONFLICTS)) {
        db.createObjectStore(STORES.SYNC_CONFLICTS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.AUDIT)) {
        db.createObjectStore(STORES.AUDIT, { keyPath: 'id' });
      }
    },
  },
  {
    version: 2,
    description: 'Add comprehensive performance & lookup indexes across all stores',
    migrate: (db: IDBDatabase, tx: IDBTransaction) => {
      // 1. Users
      const usersStore = tx.objectStore(STORES.USERS);
      if (!usersStore.indexNames.contains('by_role')) {
        usersStore.createIndex('by_role', 'role', { unique: false });
      }
      if (!usersStore.indexNames.contains('by_status')) {
        usersStore.createIndex('by_status', 'status', { unique: false });
      }

      // 2. Shelters
      const shelterStore = tx.objectStore(STORES.SHELTERS);
      if (!shelterStore.indexNames.contains('by_status')) {
        shelterStore.createIndex('by_status', 'status', { unique: false });
      }
      if (!shelterStore.indexNames.contains('by_accessibility')) {
        shelterStore.createIndex('by_accessibility', 'isAccessibleWheelchair', { unique: false });
      }
      if (!shelterStore.indexNames.contains('by_backup_power')) {
        shelterStore.createIndex('by_backup_power', 'hasBackupPower', { unique: false });
      }

      // 3. Resources
      const resourceStore = tx.objectStore(STORES.RESOURCES);
      if (!resourceStore.indexNames.contains('by_category')) {
        resourceStore.createIndex('by_category', 'category', { unique: false });
      }
      if (!resourceStore.indexNames.contains('by_status')) {
        resourceStore.createIndex('by_status', 'status', { unique: false });
      }
      if (!resourceStore.indexNames.contains('by_location')) {
        resourceStore.createIndex('by_location', 'locationId', { unique: false });
      }

      // 4. Incidents
      const incidentStore = tx.objectStore(STORES.INCIDENTS);
      if (!incidentStore.indexNames.contains('by_status')) {
        incidentStore.createIndex('by_status', 'status', { unique: false });
      }
      if (!incidentStore.indexNames.contains('by_type')) {
        incidentStore.createIndex('by_type', 'type', { unique: false });
      }
      if (!incidentStore.indexNames.contains('by_severity')) {
        incidentStore.createIndex('by_severity', 'severity', { unique: false });
      }
      if (!incidentStore.indexNames.contains('by_createdAt')) {
        incidentStore.createIndex('by_createdAt', 'createdAt', { unique: false });
      }

      // 5. Reports
      const reportStore = tx.objectStore(STORES.REPORTS);
      if (!reportStore.indexNames.contains('by_incident')) {
        reportStore.createIndex('by_incident', 'incidentId', { unique: false });
      }
      if (!reportStore.indexNames.contains('by_type')) {
        reportStore.createIndex('by_type', 'reportType', { unique: false });
      }
      if (!reportStore.indexNames.contains('by_timestamp')) {
        reportStore.createIndex('by_timestamp', 'timestamp', { unique: false });
      }

      // 6. Verifications
      const verStore = tx.objectStore(STORES.VERIFICATIONS);
      if (!verStore.indexNames.contains('by_target')) {
        verStore.createIndex('by_target', 'targetId', { unique: false });
      }
      if (!verStore.indexNames.contains('by_status')) {
        verStore.createIndex('by_status', 'status', { unique: false });
      }

      // 7. Assistance Requests
      const reqStore = tx.objectStore(STORES.ASSISTANCE);
      if (!reqStore.indexNames.contains('by_status')) {
        reqStore.createIndex('by_status', 'status', { unique: false });
      }
      if (!reqStore.indexNames.contains('by_priority')) {
        reqStore.createIndex('by_priority', 'priority', { unique: false });
      }
      if (!reqStore.indexNames.contains('by_score')) {
        reqStore.createIndex('by_score', 'priorityScore', { unique: false });
      }
      if (!reqStore.indexNames.contains('by_resident')) {
        reqStore.createIndex('by_resident', 'residentId', { unique: false });
      }

      // 8. Missions
      const missionStore = tx.objectStore(STORES.MISSIONS);
      if (!missionStore.indexNames.contains('by_status')) {
        missionStore.createIndex('by_status', 'status', { unique: false });
      }
      if (!missionStore.indexNames.contains('by_priority')) {
        missionStore.createIndex('by_priority', 'priority', { unique: false });
      }
      if (!missionStore.indexNames.contains('by_responder')) {
        missionStore.createIndex('by_responder', 'assignedResponderId', { unique: false });
      }
      if (!missionStore.indexNames.contains('by_request')) {
        missionStore.createIndex('by_request', 'assistanceRequestId', { unique: false });
      }

      // 9. Alerts
      const alertStore = tx.objectStore(STORES.ALERTS);
      if (!alertStore.indexNames.contains('by_active')) {
        alertStore.createIndex('by_active', 'active', { unique: false });
      }
      if (!alertStore.indexNames.contains('by_severity')) {
        alertStore.createIndex('by_severity', 'severity', { unique: false });
      }

      // 10. Cached Knowledge
      const knowStore = tx.objectStore(STORES.KNOWLEDGE);
      if (!knowStore.indexNames.contains('by_category')) {
        knowStore.createIndex('by_category', 'category', { unique: false });
      }
      if (!knowStore.indexNames.contains('by_topic')) {
        knowStore.createIndex('by_topic', 'topic', { unique: false });
      }

      // 11. Sync Events
      const syncStore = tx.objectStore(STORES.SYNC_EVENTS);
      if (!syncStore.indexNames.contains('by_status')) {
        syncStore.createIndex('by_status', 'sync_status', { unique: false });
      }
      if (!syncStore.indexNames.contains('by_entity_type')) {
        syncStore.createIndex('by_entity_type', 'entity_type', { unique: false });
      }
      if (!syncStore.indexNames.contains('by_created_at')) {
        syncStore.createIndex('by_created_at', 'created_at', { unique: false });
      }

      // 12. Sync Conflicts
      const conflictStore = tx.objectStore(STORES.SYNC_CONFLICTS);
      if (!conflictStore.indexNames.contains('by_resolved')) {
        conflictStore.createIndex('by_resolved', 'resolved', { unique: false });
      }
      if (!conflictStore.indexNames.contains('by_detected_at')) {
        conflictStore.createIndex('by_detected_at', 'detectedAt', { unique: false });
      }

      // 13. Audit Entries
      const auditStore = tx.objectStore(STORES.AUDIT);
      if (!auditStore.indexNames.contains('by_timestamp')) {
        auditStore.createIndex('by_timestamp', 'timestamp', { unique: false });
      }
      if (!auditStore.indexNames.contains('by_actor')) {
        auditStore.createIndex('by_actor', 'actorId', { unique: false });
      }

      // 14. Movements
      const movStore = tx.objectStore(STORES.MOVEMENTS);
      if (!movStore.indexNames.contains('by_resource')) {
        movStore.createIndex('by_resource', 'resourceId', { unique: false });
      }
      if (!movStore.indexNames.contains('by_timestamp')) {
        movStore.createIndex('by_timestamp', 'timestamp', { unique: false });
      }
    },
  },
  {
    version: 3,
    description: 'Add stores and indexes for Triage, Ration Distributions, Missing Kin, Mutual Aid, and Outbreak Watch',
    migrate: (db: IDBDatabase, tx: IDBTransaction) => {
      // 1. Triage Records
      if (!db.objectStoreNames.contains(STORES.TRIAGE_RECORDS)) {
        const triageStore = db.createObjectStore(STORES.TRIAGE_RECORDS, { keyPath: 'id' });
        triageStore.createIndex('by_tag_code', 'tagCode', { unique: true });
        triageStore.createIndex('by_category', 'category', { unique: false });
        triageStore.createIndex('by_responder', 'responderId', { unique: false });
        triageStore.createIndex('by_timestamp', 'timestamp', { unique: false });
      }

      // 2. Ration Distributions
      if (!db.objectStoreNames.contains(STORES.RATION_DISTRIBUTIONS)) {
        const rationStore = db.createObjectStore(STORES.RATION_DISTRIBUTIONS, { keyPath: 'id' });
        rationStore.createIndex('by_household', 'householdId', { unique: false });
        rationStore.createIndex('by_claim_code', 'claimCode', { unique: false });
        rationStore.createIndex('by_timestamp', 'timestamp', { unique: false });
        rationStore.createIndex('by_package', 'packageType', { unique: false });
      }

      // 3. Missing Persons / Kin
      if (!db.objectStoreNames.contains(STORES.MISSING_PERSONS)) {
        const missingStore = db.createObjectStore(STORES.MISSING_PERSONS, { keyPath: 'id' });
        missingStore.createIndex('by_status', 'status', { unique: false });
        missingStore.createIndex('by_name', 'fullName', { unique: false });
        missingStore.createIndex('by_created_at', 'createdAt', { unique: false });
      }

      // 4. Mutual Aid Posts
      if (!db.objectStoreNames.contains(STORES.MUTUAL_AID)) {
        const mutualStore = db.createObjectStore(STORES.MUTUAL_AID, { keyPath: 'id' });
        mutualStore.createIndex('by_type', 'type', { unique: false });
        mutualStore.createIndex('by_category', 'category', { unique: false });
        mutualStore.createIndex('by_status', 'status', { unique: false });
        mutualStore.createIndex('by_purok', 'purokSector', { unique: false });
      }

      // 5. Outbreak Watch & Flood Exposure
      if (!db.objectStoreNames.contains(STORES.OUTBREAK_WATCH)) {
        const outbreakStore = db.createObjectStore(STORES.OUTBREAK_WATCH, { keyPath: 'id' });
        outbreakStore.createIndex('by_user', 'userId', { unique: false });
        outbreakStore.createIndex('by_exposure_timestamp', 'exposureTimestamp', { unique: false });
      }
    },
  },
];

class LocalDatabase {
  private dbPromise: Promise<IDBDatabase> | null = null;

  public async getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) {
      return this.dbPromise;
    }

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB is not supported in this runtime environment.'));
        return;
      }

      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const tx = (event.target as IDBOpenDBRequest).transaction!;
        const oldVersion = event.oldVersion;
        const newVersion = event.newVersion || DB_VERSION;

        console.log(`[IndexedDB] Upgrading schema from v${oldVersion} to v${newVersion}...`);

        for (const migration of DB_MIGRATIONS) {
          if (oldVersion < migration.version && migration.version <= newVersion) {
            console.log(`[IndexedDB] Running migration v${migration.version}: ${migration.description}`);
            migration.migrate(db, tx);
          }
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      request.onblocked = () => {
        console.warn('[IndexedDB] Database upgrade blocked by another active connection.');
      };
    });

    return this.dbPromise;
  }

  public async getAll<T>(storeName: StoreName): Promise<T[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result as T[]);
      req.onerror = () => reject(req.error);
    });
  }

  public async getAllByIndex<T>(storeName: StoreName, indexName: string, queryValue: IDBValidKey | IDBKeyRange): Promise<T[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const index = store.index(indexName);
      const req = index.getAll(queryValue);
      req.onsuccess = () => resolve(req.result as T[]);
      req.onerror = () => reject(req.error);
    });
  }

  public async get<T>(storeName: StoreName, key: string): Promise<T | undefined> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result as T | undefined);
      req.onerror = () => reject(req.error);
    });
  }

  public async put<T>(storeName: StoreName, value: T): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(value);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  public async putBatch<T>(storeName: StoreName, values: T[]): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      for (const val of values) {
        store.put(val);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  public async delete(storeName: StoreName, key: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  public async clear(storeName: StoreName): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  public async count(storeName: StoreName): Promise<number> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.count();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
}

export const localDB = new LocalDatabase();
