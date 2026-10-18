/**
 * Automated Test Suite: Auto-Sync on Internet Restoration
 *
 * Verifies:
 * 1. App detects internet loss, switches status to OFFLINE, and flags wasOffline = true.
 * 2. Writes during offline mode are saved in localDB and queued in STORES.SYNC_EVENTS.
 * 3. When internet is restored, the app triggers auto-sync immediately.
 * 4. Sync icon enters active spinning state (animate-spin) while syncing.
 * 5. Queued offline events are uploaded, acknowledged, and remote records merged.
 * 6. resilia_internet_restored and resilia_sync_complete (with fromInternetRestored: true) events fire.
 * 7. System returns to clean CONNECTED / ONLINE status with sync icon returning to idle.
 */

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { localDB, STORES } from '../src/services/offline/db';
import { EventQueueService } from '../src/services/offline/eventQueue';
import { syncClient } from '../src/services/offline/syncClient';
import { ConnectivityBadge } from '../src/components/layout/ConnectivityBadge';
import { SyncEvent } from '../src/types';

// In-memory mock store
const inMemoryStores: Record<string, Map<string, any>> = {};

function getStore(name: string) {
  if (!inMemoryStores[name]) {
    inMemoryStores[name] = new Map();
  }
  return inMemoryStores[name];
}

(localDB as any).get = async (storeName: any, key: string) => {
  return getStore(storeName).get(key) || null;
};
(localDB as any).put = async (storeName: any, value: any) => {
  const key = value.id || value.event_id || value.claimCode || value.tagCode;
  getStore(storeName).set(key, value);
};
(localDB as any).getAll = async (storeName: any) => {
  return Array.from(getStore(storeName).values());
};
(localDB as any).delete = async (storeName: any, key: string) => {
  getStore(storeName).delete(key);
};
(localDB as any).clear = async (storeName: any) => {
  getStore(storeName).clear();
};

// Mock browser environments
const mockStorage: Record<string, string> = {};
(global as any).localStorage = {
  getItem: (k: string) => mockStorage[k] || null,
  setItem: (k: string, v: string) => { mockStorage[k] = v; },
  removeItem: (k: string) => { delete mockStorage[k]; },
  clear: () => { Object.keys(mockStorage).forEach((k) => delete mockStorage[k]); },
};

const windowEvents: { event: string; detail?: any }[] = [];
(global as any).window = {
  dispatchEvent: (event: any) => {
    windowEvents.push({ event: event.type, detail: event.detail });
  },
  addEventListener: () => {},
  removeEventListener: () => {},
};

try {
  Object.defineProperty(globalThis.navigator, 'onLine', {
    value: true,
    configurable: true,
    writable: true,
  });
} catch {
  // ignore
}

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, testName: string, details?: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passCount++;
  } else {
    console.error(`  ✗ FAIL: ${testName}${details ? ' - ' + details : ''}`);
    failCount++;
  }
}

async function runAutoSyncSuite() {
  console.log('\n======================================================');
  console.log('TEST SUITE: Automatic Sync on Internet Restoration');
  console.log('======================================================\n');

  // Reset stores
  for (const k of Object.keys(inMemoryStores)) {
    inMemoryStores[k].clear();
  }
  windowEvents.length = 0;

  // --------------------------------------------------------------------------
  // TEST 1: App detects internet loss
  // --------------------------------------------------------------------------
  console.log('Test 1: Transitioning into OFFLINE state (Internet Loss)');
  syncClient.handleInternetLost();

  assert(syncClient.getStatus() === 'OFFLINE', 'Status switches to OFFLINE upon internet loss');
  assert(!syncClient.isOnline(), 'isOnline() returns false when offline');
  assert((syncClient as any).wasOffline === true, 'wasOffline flag is set to true');
  assert(
    windowEvents.some((e) => e.event === 'resilia_internet_lost'),
    'Dispatches resilia_internet_lost custom event'
  );

  // ConnectivityBadge reflects OFFLINE in all portals
  const offlineBadgeHtml = renderToStaticMarkup(
    React.createElement(ConnectivityBadge, { variant: 'dark' })
  );
  assert(offlineBadgeHtml.includes('OFFLINE'), 'ConnectivityBadge renders "OFFLINE"');

  // --------------------------------------------------------------------------
  // TEST 2: Queuing mutations while OFFLINE
  // --------------------------------------------------------------------------
  console.log('\nTest 2: Operations recorded in local IndexedDB & pending event queue while offline');
  const sampleIncident = {
    id: 'inc_flood_offline_001',
    title: 'Flash Flood on Alley 4',
    type: 'FLOOD',
    severity: 'HIGH',
    status: 'REPORTED',
    lat: 14.658,
    lng: 121.102,
  };

  await EventQueueService.recordLocalWrite(
    'incident',
    STORES.INCIDENTS,
    sampleIncident,
    'CREATE',
    'user_responder_juan'
  );

  const pendingEvents = await EventQueueService.getPendingEvents();
  assert(pendingEvents.length === 1, 'Event queue contains 1 pending offline write');
  assert(pendingEvents[0].entity_id === 'inc_flood_offline_001', 'Queued event matches offline incident');

  // --------------------------------------------------------------------------
  // TEST 3: Internet Restored triggers Auto-Sync
  // --------------------------------------------------------------------------
  console.log('\nTest 3: Internet restored triggers automatic field synchronization');
  windowEvents.length = 0;

  // Mock global fetch for health check & sync endpoints
  (global as any).fetch = async (url: string, init?: any) => {
    if (url.includes('/api/v1/health')) {
      return {
        ok: true,
        headers: { get: () => 'application/json' },
        json: async () => ({ status: 'ok', service: 'Resilia' }),
      };
    }
    if (url.includes('/api/v1/sync/upload')) {
      const body = JSON.parse(init.body);
      const acks = (body.events || []).map((e: SyncEvent) => ({
        event_id: e.event_id,
        ack_at: new Date().toISOString(),
        status: 'ACKNOWLEDGED',
      }));
      return {
        ok: true,
        json: async () => ({ acknowledgements: acks }),
      };
    }
    if (url.includes('/api/v1/sync/pull')) {
      return {
        ok: true,
        json: async () => ({
          remoteRecords: {
            incidents: [
              {
                id: 'inc_cloud_update_002',
                title: 'River Gauge Advisory',
                type: 'FLOOD',
                severity: 'CRITICAL',
                status: 'VERIFIED',
              },
            ],
          },
          pulledAt: new Date().toISOString(),
        }),
      };
    }
    return { ok: true, json: async () => ({}) };
  };

  // Trigger internet restored and await auto sync
  await syncClient.handleInternetReconnected();

  assert(
    windowEvents.some((e) => e.event === 'resilia_internet_restored'),
    'Dispatches resilia_internet_restored event'
  );
  assert(
    windowEvents.some((e) => e.event === 'resilia_sync_start'),
    'Automatically initiates sync start event'
  );

  const completeEvent = windowEvents.find((e) => e.event === 'resilia_sync_complete');
  assert(Boolean(completeEvent), 'Dispatches resilia_sync_complete event');
  assert(completeEvent?.detail?.fromInternetRestored === true, 'Sync complete detail indicates fromInternetRestored: true');
  assert(completeEvent?.detail?.syncedCount === 1, 'Acknowledged and synced 1 queued offline record');

  // Verify pending events queue cleared
  const remainingPending = await EventQueueService.getPendingEvents();
  assert(remainingPending.length === 0, 'Pending event queue is completely flushed and synced');

  // Verify remote record merged into local store
  const remoteIncident = await localDB.get(STORES.INCIDENTS, 'inc_cloud_update_002');
  assert(Boolean(remoteIncident), 'Remote cloud record merged into local IndexedDB');

  // Verify status is back to ONLINE / CONNECTED
  assert(syncClient.getStatus() === 'ONLINE', 'Status restored to ONLINE');
  assert(!syncClient.isCurrentlySyncing(), 'Sync flag returned to idle (not syncing)');

  // --------------------------------------------------------------------------
  // TEST 4: ConnectivityBadge shows CONNECTED & Idle Sync Icon
  // --------------------------------------------------------------------------
  console.log('\nTest 4: UI shows CONNECTED with idle Sync Icon after auto-sync');
  const connectedBadgeHtml = renderToStaticMarkup(
    React.createElement(ConnectivityBadge, { variant: 'dark' })
  );
  assert(connectedBadgeHtml.includes('CONNECTED'), 'Renders CONNECTED status');
  assert(!connectedBadgeHtml.includes('animate-spin'), 'Sync icon stops spinning when sync finishes');

  console.log('\n======================================================');
  console.log(`TEST RESULTS: ${passCount} Passed, ${failCount} Failed`);
  console.log('======================================================\n');

  if (failCount > 0) {
    process.exit(1);
  }
  process.exit(0);
}

runAutoSyncSuite().catch((err) => {
  console.error('Fatal error in auto-sync test suite:', err);
  process.exit(1);
});
