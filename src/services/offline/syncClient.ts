/**
 * Resilia Sync Client & Connectivity Engine
 * Performs continuous heartbeat checks against the real backend /api/v1/health,
 * manages sync states (ONLINE, DEGRADED, OFFLINE, SYNCING, SYNC_ERROR),
 * uploads pending events, downloads cloud updates, and handles conflicts.
 */

import { ConnectivityStatus, SyncConflict, SyncEvent } from '../../types';
import { localDB, STORES } from './db';
import { EventQueueService } from './eventQueue';

type ConnectivityListener = (status: ConnectivityStatus) => void;

class SyncClientService {
  private status: ConnectivityStatus = 'ONLINE';
  private listeners: Set<ConnectivityListener> = new Set();
  private checkIntervalId: any = null;
  private isSyncing = false;
  private lastSuccessfulSync: string | null = null;
  private simulatedOffline = false; // Allow manual offline toggle for testing
  private debounceTimeout: any = null;
  private crossTabChannel: BroadcastChannel | null = null;

  constructor() {
    this.lastSuccessfulSync = typeof localStorage !== 'undefined' ? localStorage.getItem('resilia_last_sync_time') : null;
    this.simulatedOffline = typeof localStorage !== 'undefined' ? localStorage.getItem('resilia_simulated_offline') === 'true' : false;

    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.checkBackendHealth());
      window.addEventListener('offline', () => this.setStatus('OFFLINE'));

      // Automatically trigger sync when any write occurs while ONLINE
      window.addEventListener('resilia_local_write', () => {
        if (!this.simulatedOffline) {
          this.scheduleDebouncedSync();
        }
      });

      // Listen for updates from other open browser tabs
      if ('BroadcastChannel' in window) {
        try {
          this.crossTabChannel = new BroadcastChannel('resilia_sync_channel');
          this.crossTabChannel.onmessage = (event) => {
            if (event.data?.type === 'RESILIA_LOCAL_WRITE') {
              // Fire local event so current tab UI reloads
              window.dispatchEvent(new CustomEvent('resilia_local_write', { detail: event.data }));
              if (!this.simulatedOffline) {
                this.scheduleDebouncedSync();
              }
            }
          };
        } catch {
          // ignore
        }
      }
    }
  }

  public scheduleDebouncedSync(delay = 100) {
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }
    this.debounceTimeout = setTimeout(() => {
      if (!this.simulatedOffline && this.status !== 'OFFLINE') {
        this.triggerSync().catch(() => {});
      }
    }, delay);
  }

  public init() {
    this.checkBackendHealth();
    if (!this.checkIntervalId) {
      this.checkIntervalId = setInterval(() => {
        this.checkBackendHealth();
      }, 4000); // Continuous live sync every 4s for resident, coordinator, and responder
    }
  }

  public setSimulatedOffline(offline: boolean) {
    this.simulatedOffline = offline;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('resilia_simulated_offline', offline ? 'true' : 'false');
    }
    if (offline) {
      this.setStatus('OFFLINE');
    } else {
      this.checkBackendHealth();
    }
  }

  public isSimulatingOffline(): boolean {
    return this.simulatedOffline;
  }

  public getStatus(): ConnectivityStatus {
    return this.status;
  }

  public getLastSyncTime(): string | null {
    return this.lastSuccessfulSync;
  }

  public subscribe(listener: ConnectivityListener): () => void {
    this.listeners.add(listener);
    listener(this.status);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private setStatus(newStatus: ConnectivityStatus) {
    if (this.status !== newStatus) {
      this.status = newStatus;
      this.listeners.forEach((fn) => fn(newStatus));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('resilia_connectivity_change', { detail: newStatus }));
      }
    }
  }

  /**
   * Probes real backend health endpoint: /api/v1/health
   * Never relies on navigator.onLine alone!
   */
  public async checkBackendHealth(): Promise<boolean> {
    if (this.simulatedOffline) {
      this.setStatus('OFFLINE');
      return false;
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.setStatus('OFFLINE');
      return false;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch('/api/v1/health', {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data.status === 'ok') {
          if (this.status === 'OFFLINE' || this.status === 'DEGRADED') {
            this.setStatus('ONLINE');
          } else if (this.status !== 'SYNCING') {
            this.setStatus('ONLINE');
          }
          // Automatically sync in background when online and not currently syncing
          if (!this.isSyncing) {
            this.triggerSync().catch(() => {});
          }
          return true;
        } else {
          this.setStatus('DEGRADED');
          return false;
        }
      } else {
        this.setStatus('DEGRADED');
        return false;
      }
    } catch {
      this.setStatus('OFFLINE');
      return false;
    }
  }

  /**
   * Executes bidirectional synchronization:
   * 1. Reads pending local events
   * 2. POST /api/v1/sync/upload
   * 3. Marks server acknowledgements
   * 4. GET /api/v1/sync/pull for remote changes
   * 5. Detects conflicts and records any divergence
   */
  public async triggerSync(): Promise<{ success: boolean; syncedCount: number; conflictCount: number }> {
    if (this.isSyncing) {
      return { success: false, syncedCount: 0, conflictCount: 0 };
    }

    if (this.status === 'OFFLINE' || this.simulatedOffline) {
      return { success: false, syncedCount: 0, conflictCount: 0 };
    }

    this.isSyncing = true;
    this.setStatus('SYNCING');

    try {
      const pendingEvents = await EventQueueService.getPendingEvents();

      let syncedCount = 0;
      let conflictCount = 0;

      if (pendingEvents.length > 0) {
        const response = await fetch('/api/v1/sync/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ events: pendingEvents }),
        });

        if (!response.ok) {
          throw new Error(`Sync upload failed with status ${response.status}`);
        }

        const result = await response.json();
        const acks: { event_id: string; ack_at: string; status: 'ACKNOWLEDGED' | 'CONFLICT'; conflict_details?: any }[] =
          result.acknowledgements || [];

        for (const ack of acks) {
          if (ack.status === 'ACKNOWLEDGED') {
            await EventQueueService.markEventSynced(ack.event_id, ack.ack_at);
            syncedCount++;
          } else if (ack.status === 'CONFLICT') {
            // Record explicit conflict
            conflictCount++;
            const evt = pendingEvents.find((e) => e.event_id === ack.event_id);
            if (evt) {
              const conflictRecord: SyncConflict = {
                id: 'conf_' + evt.event_id,
                event_id: evt.event_id,
                entity_type: evt.entity_type,
                entity_id: evt.entity_id,
                localPayload: evt.payload,
                remotePayload: ack.conflict_details?.serverVersion || {},
                conflictType: ack.conflict_details?.conflictType || 'CONCURRENT_MODIFICATION',
                detectedAt: new Date().toISOString(),
                resolved: false,
              };
              await localDB.put(STORES.SYNC_CONFLICTS, conflictRecord);
              await EventQueueService.markEventFailed(ack.event_id, 'Conflict with cloud state');
            }
          }
        }
      }

      // 2. Pull remote updates from cloud
      const pullResponse = await fetch('/api/v1/sync/pull?since=' + encodeURIComponent(this.lastSuccessfulSync || ''));
      if (pullResponse.ok) {
        const pullData = await pullResponse.json();
        if (pullData.remoteRecords) {
          let hasNewRecords = false;
          // Merge remote records into local IndexedDB
          for (const [storeName, records] of Object.entries(pullData.remoteRecords)) {
            if (Array.isArray(records) && Object.values(STORES).includes(storeName as any)) {
              for (const rec of records) {
                // If this entity has a pending local write, avoid blind overwrite!
                const hasPending = pendingEvents.some((p) => p.entity_id === (rec as any).id);
                if (!hasPending) {
                  await localDB.put(storeName as any, rec);
                  hasNewRecords = true;
                }
              }
            }
          }
          if (hasNewRecords && typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('resilia_local_write'));
          }
        }
        if (pullData.pulledAt) {
          this.lastSuccessfulSync = pullData.pulledAt;
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('resilia_last_sync_time', pullData.pulledAt);
          }
        }
      }

      this.setStatus('ONLINE');
      this.isSyncing = false;

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('resilia_sync_complete', { detail: { syncedCount, conflictCount } }));
      }

      return { success: true, syncedCount, conflictCount };
    } catch (err: any) {
      console.warn('Sync failed:', err);
      this.setStatus('SYNC_ERROR');
      this.isSyncing = false;
      return { success: false, syncedCount: 0, conflictCount: 0 };
    }
  }
}

export const syncClient = new SyncClientService();
