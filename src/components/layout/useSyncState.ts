import { useState, useEffect, useCallback } from 'react';
import { syncClient } from '../../services/offline/syncClient';
import { ConnectivityStatus } from '../../types';
import { EventQueueService } from '../../services/offline/eventQueue';

export function useSyncState() {
  const [status, setStatus] = useState<ConnectivityStatus>(() => syncClient.getStatus());
  const [isSyncing, setIsSyncing] = useState<boolean>(() => syncClient.isCurrentlySyncing());
  const [isSimulatedOffline, setIsSimulatedOffline] = useState<boolean>(() => syncClient.isSimulatingOffline());
  const [pendingCount, setPendingCount] = useState<number>(0);

  const refreshPending = useCallback(async () => {
    try {
      const events = await EventQueueService.getPendingEvents();
      setPendingCount(events.length);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    refreshPending();

    const unsub = syncClient.subscribe((newStatus) => {
      setStatus(newStatus);
      setIsSyncing(newStatus === 'SYNCING' || syncClient.isCurrentlySyncing());
      setIsSimulatedOffline(syncClient.isSimulatingOffline());
      refreshPending();
    });

    const handleSyncStart = () => {
      setIsSyncing(true);
    };

    const handleSyncEnd = () => {
      setIsSyncing(false);
      refreshPending();
    };

    const handleLocalWrite = () => {
      refreshPending();
    };

    const handleConnectivityUpdate = () => {
      refreshPending();
      setStatus(syncClient.getStatus());
      setIsSyncing(syncClient.isCurrentlySyncing());
      setIsSimulatedOffline(syncClient.isSimulatingOffline());
    };

    window.addEventListener('resilia_sync_start', handleSyncStart);
    window.addEventListener('resilia_sync_end', handleSyncEnd);
    window.addEventListener('resilia_sync_complete', handleSyncEnd);
    window.addEventListener('resilia_local_write', handleLocalWrite);
    window.addEventListener('resilia_internet_lost', handleConnectivityUpdate);
    window.addEventListener('resilia_internet_restored', handleConnectivityUpdate);

    return () => {
      unsub();
      window.removeEventListener('resilia_sync_start', handleSyncStart);
      window.removeEventListener('resilia_sync_end', handleSyncEnd);
      window.removeEventListener('resilia_sync_complete', handleSyncEnd);
      window.removeEventListener('resilia_local_write', handleLocalWrite);
      window.removeEventListener('resilia_internet_lost', handleConnectivityUpdate);
      window.removeEventListener('resilia_internet_restored', handleConnectivityUpdate);
    };
  }, [refreshPending]);

  const isConnected =
    !isSimulatedOffline &&
    (status === 'ONLINE' || status === 'SYNCING' || (typeof navigator !== 'undefined' && navigator.onLine && status !== 'OFFLINE'));

  const triggerSync = useCallback(async () => {
    return await syncClient.triggerSync();
  }, []);

  const toggleSimulatedOffline = useCallback(() => {
    const next = !isSimulatedOffline;
    setIsSimulatedOffline(next);
    syncClient.setSimulatedOffline(next);
  }, [isSimulatedOffline]);

  return {
    status,
    isConnected,
    isSyncing,
    isSimulatedOffline,
    pendingCount,
    triggerSync,
    toggleSimulatedOffline,
  };
}
