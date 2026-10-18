/**
 * Resilia Network Connectivity & Auto-Sync Notifier
 * Listens for internet disconnection and reconnection events.
 * Displays clear, professional status toasts informing the user when:
 * 1. Internet connection is lost (offline mode activated, changes saved locally).
 * 2. Internet connection is restored (automatic sync triggered).
 * 3. Auto-synchronization completes successfully with the cloud server.
 */

import React, { useEffect, useRef } from 'react';
import { useToast } from '../common/Toast';

export const NetworkSyncNotifier: React.FC = () => {
  const { info, success, warning } = useToast();
  const lastOfflineToastRef = useRef<number>(0);

  useEffect(() => {
    // 1. Internet connection lost
    const handleInternetLost = () => {
      const now = Date.now();
      // Debounce toast notifications (minimum 4 seconds apart)
      if (now - lastOfflineToastRef.current > 4000) {
        lastOfflineToastRef.current = now;
        warning(
          'Internet connection lost. Resilia is operating in full offline local mode. All field operations will be safely recorded locally.',
          'Offline Mode Active'
        );
      }
    };

    // 2. Internet connection restored
    const handleInternetRestored = () => {
      info(
        'Internet connection re-established! Automatically syncing queued offline records with Command Center...',
        'Network Restored'
      );
    };

    // 3. Auto-sync completed
    const handleSyncComplete = (event: Event) => {
      const customEvent = event as CustomEvent<{
        syncedCount: number;
        conflictCount: number;
        reason?: string;
        fromInternetRestored?: boolean;
      }>;
      const detail = customEvent.detail;

      if (detail?.fromInternetRestored) {
        if (detail.syncedCount > 0) {
          success(
            `Synchronized ${detail.syncedCount} queued field record(s) to cloud server. All portals are up to date.`,
            'Auto-Sync Complete'
          );
        } else {
          success(
            'All field operations verified and up to date with cloud server.',
            'System Synchronized'
          );
        }
      }
    };

    window.addEventListener('resilia_internet_lost', handleInternetLost);
    window.addEventListener('resilia_internet_restored', handleInternetRestored);
    window.addEventListener('resilia_sync_complete', handleSyncComplete);

    return () => {
      window.removeEventListener('resilia_internet_lost', handleInternetLost);
      window.removeEventListener('resilia_internet_restored', handleInternetRestored);
      window.removeEventListener('resilia_sync_complete', handleSyncComplete);
    };
  }, [info, success, warning]);

  return null;
};
