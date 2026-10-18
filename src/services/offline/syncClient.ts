/**
 * Resilia Sync Client & Connectivity Engine
 * Performs continuous heartbeat checks against the real backend /api/v1/health,
 * manages sync states (ONLINE, DEGRADED, OFFLINE, SYNCING, SYNC_ERROR),
 * uploads pending events, downloads cloud updates, and handles conflicts.
 */

import { ConnectivityStatus, SyncConflict, SyncEvent } from '../../types';
import { localDB, STORES } from './db';
import { EventQueueService } from './eventQueue';
import { safetyCheckInService } from '../safety/safetyCheckInService';

type ConnectivityListener = (status: ConnectivityStatus) => void;

class SyncClientService {
  private status: ConnectivityStatus = 'ONLINE';
  private wasOffline = false;
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
    if (this.simulatedOffline) {
      this.wasOffline = true;
      this.status = 'OFFLINE';
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.handleInternetReconnected();
      });
      window.addEventListener('offline', () => {
        this.handleInternetLost();
      });

      // Window focus or visibility change triggers check if we were offline
      window.addEventListener('focus', () => {
        if (this.wasOffline || this.status === 'OFFLINE') {
          this.checkBackendHealth();
        }
      });
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && (this.wasOffline || this.status === 'OFFLINE')) {
          this.checkBackendHealth();
        }
      });

      // Automatically trigger sync when any write occurs while ONLINE
      window.addEventListener('resilia_local_write', () => {
        if (!this.simulatedOffline && this.isOnline()) {
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
              if (!this.simulatedOffline && this.isOnline()) {
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

  public handleInternetLost() {
    this.wasOffline = true;
    this.setStatus('OFFLINE');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('resilia_internet_lost'));
    }
  }

  public async handleInternetReconnected(): Promise<boolean> {
    this.wasOffline = true;
    return await this.checkBackendHealth();
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
    const wasSimulated = this.simulatedOffline;
    this.simulatedOffline = offline;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('resilia_simulated_offline', offline ? 'true' : 'false');
    }
    if (offline) {
      this.handleInternetLost();
    } else {
      if (wasSimulated) {
        this.wasOffline = true;
      }
      this.checkBackendHealth();
    }
  }

  public isSimulatingOffline(): boolean {
    return this.simulatedOffline;
  }

  public getStatus(): ConnectivityStatus {
    return this.status;
  }

  public isCurrentlySyncing(): boolean {
    return this.isSyncing || this.status === 'SYNCING';
  }

  public isOnline(): boolean {
    if (this.simulatedOffline) return false;
    if (typeof navigator !== 'undefined' && !navigator.onLine) return false;
    return this.status === 'ONLINE' || this.status === 'SYNCING';
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
      this.wasOffline = true;
      this.setStatus('OFFLINE');
      return false;
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.wasOffline = true;
      this.setStatus('OFFLINE');
      return false;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const res = await fetch('/api/v1/health', {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      let isHealthy = false;
      if (res.ok) {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await res.json();
          isHealthy = data.status === 'ok';
        } else {
          // If running on static host (e.g. Firebase Hosting rewrite), reaching origin confirms online
          isHealthy = true;
        }
      }

      if (isHealthy) {
        const cameFromOffline = this.wasOffline || this.status === 'OFFLINE';
        this.wasOffline = false;
        this.setStatus('ONLINE');

        if (cameFromOffline) {
          await this.handleBackOnline();
        } else if (!this.isSyncing) {
          this.scheduleDebouncedSync(300);
        }
        return true;
      } else {
        this.setStatus('DEGRADED');
        return false;
      }
    } catch {
      // If browser confirms device has internet connectivity (e.g. external network reachable)
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        const cameFromOffline = this.wasOffline || this.status === 'OFFLINE';
        this.wasOffline = false;
        this.setStatus('ONLINE');
        if (cameFromOffline) {
          await this.handleBackOnline();
        }
        return true;
      }

      this.wasOffline = true;
      this.setStatus('OFFLINE');
      return false;
    }
  }

  private async handleBackOnline(): Promise<void> {
    console.log('[Resilia SyncClient] Internet connection restored. Triggering automatic field sync...');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('resilia_internet_restored', {
          detail: { timestamp: new Date().toISOString() },
        })
      );
    }
    // Automatically trigger sync immediately upon reconnection from internet loss
    await this.triggerSync({ reason: 'INTERNET_RESTORED' }).catch((err) => {
      console.warn('Auto-sync on internet restoration warning:', err);
    });
  }

  /**
   * Executes bidirectional synchronization:
   * 1. Reads pending local events
   * 2. POST /api/v1/sync/upload
   * 3. Marks server acknowledgements
   * 4. GET /api/v1/sync/pull for remote changes
   * 5. Detects conflicts and records any divergence
   */
  public async triggerSync(options?: { reason?: string }): Promise<{ success: boolean; syncedCount: number; conflictCount: number }> {
    if (this.isSyncing) {
      return { success: false, syncedCount: 0, conflictCount: 0 };
    }

    if (this.status === 'OFFLINE' || this.simulatedOffline) {
      return { success: false, syncedCount: 0, conflictCount: 0 };
    }

    this.isSyncing = true;
    this.setStatus('SYNCING');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('resilia_sync_start', { detail: options }));
    }

    // Ping testConnection in firebase in background if configured
    if (typeof window !== 'undefined') {
      import('../firebase/firebase')
        .then(({ testConnection }) => testConnection?.())
        .catch(() => {});
    }

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
          if (Array.isArray((pullData.remoteRecords as any).safetyCheckIns) && (pullData.remoteRecords as any).safetyCheckIns.length > 0) {
            safetyCheckInService.mergeRemoteCheckIns((pullData.remoteRecords as any).safetyCheckIns);
            hasNewRecords = true;
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
        window.dispatchEvent(new CustomEvent('resilia_sync_end'));
        window.dispatchEvent(
          new CustomEvent('resilia_sync_complete', {
            detail: {
              syncedCount,
              conflictCount,
              reason: options?.reason,
              fromInternetRestored: options?.reason === 'INTERNET_RESTORED',
            },
          })
        );
      }

      return { success: true, syncedCount, conflictCount };
    } catch (err: any) {
      console.warn('Sync failed:', err);
      this.setStatus('SYNC_ERROR');
      this.isSyncing = false;
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('resilia_sync_end'));
      }
      return { success: false, syncedCount: 0, conflictCount: 0 };
    }
  }
}

export const syncClient = new SyncClientService();
