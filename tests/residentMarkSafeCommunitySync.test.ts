import { describe, it, before, beforeEach } from 'node:test';
import assert from 'node:assert';
import {
  CitizenSafetyStatus,
  SafetyCheckIn,
  safetyCheckInService,
} from '../src/services/safety/safetyCheckInService';
import { cloudStore } from '../server/store';
import { SyncEvent } from '../src/types';

import { localDB } from '../src/services/offline/db';

// Mock storage and DOM for node environment
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

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

const windowEvents: { event: string; detail?: any }[] = [];
(global as any).window = {
  dispatchEvent: (event: any) => {
    windowEvents.push({ event: event.type, detail: event.detail });
    return true;
  },
  addEventListener: () => {},
  removeEventListener: () => {},
};
(global as any).CustomEvent = class CustomEvent {
  type: string;
  detail: any;
  constructor(type: string, params?: any) {
    this.type = type;
    this.detail = params?.detail;
  }
};

describe('Resident Mark Me Safe to Command Center Community Safety Sync', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('1. Resident check-in records data, increments accounted population, and computes correct stats', async () => {
    const initialStats = safetyCheckInService.getSummaryStats();
    const initialTotalAccounted = initialStats.totalPeopleAccounted;

    const checkIn = await safetyCheckInService.recordResidentCheckIn(
      {
        residentName: 'Rosa Alcantara',
        contactPhone: '+63 918 123 4567',
        residentId: 'res_rosa_001',
        status: 'SAFE_AT_HOME',
        currentLocation: '2nd Floor, 12 Kalayaan St., Tumana',
        familyCount: 4,
        vulnerableCount: 1,
        notes: 'Dry, food for 3 days',
      },
      'res_rosa_001'
    );

    assert.ok(checkIn.id, 'Check-in should have generated an ID');
    assert.strictEqual(checkIn.residentName, 'Rosa Alcantara');
    assert.strictEqual(checkIn.status, 'SAFE_AT_HOME');
    assert.strictEqual(checkIn.familyCount, 4);

    const updatedStats = safetyCheckInService.getSummaryStats();
    assert.strictEqual(
      updatedStats.totalPeopleAccounted,
      initialTotalAccounted + 4,
      'Total accounted population should increase by familyCount (4)'
    );
    assert.strictEqual(
      updatedStats.atHome,
      initialStats.atHome + 1,
      'Safe at home household count should increment by 1'
    );
  });

  it('2. Idempotent check-in updates prevent duplicate headcount when resident updates status', async () => {
    // Initial check-in at home with 3 people
    await safetyCheckInService.recordResidentCheckIn(
      {
        residentName: 'Carlos Dalisay',
        contactPhone: '+63 919 555 7890',
        residentId: 'res_carlos_002',
        status: 'SAFE_AT_HOME',
        currentLocation: '15 Tumana Dike',
        familyCount: 3,
        vulnerableCount: 0,
      },
      'res_carlos_002'
    );

    const stats1 = safetyCheckInService.getSummaryStats();

    // Resident later updates status: evacuated to shelter with 4 people accounted
    const updated = await safetyCheckInService.recordResidentCheckIn(
      {
        residentName: 'Carlos Dalisay',
        contactPhone: '+63 919 555 7890',
        residentId: 'res_carlos_002',
        status: 'SAFE_AT_SHELTER',
        currentLocation: 'Malanday Elementary School Room 102',
        shelterName: 'Malanday Elementary School',
        familyCount: 4,
        vulnerableCount: 1,
      },
      'res_carlos_002'
    );

    const stats2 = safetyCheckInService.getSummaryStats();

    // The resident should have updated their existing entry, not created a duplicate
    const residentRecords = safetyCheckInService.getForResident('res_carlos_002');
    assert.strictEqual(residentRecords.length, 1, 'Should only have 1 active check-in entry for resident');
    assert.strictEqual(residentRecords[0].status, 'SAFE_AT_SHELTER');
    assert.strictEqual(residentRecords[0].familyCount, 4);

    // Total check-ins (households) should remain unchanged between the two submissions
    assert.strictEqual(stats2.totalCheckIns, stats1.totalCheckIns, 'Household count must not duplicate');
    // atHome should decrease by 1, atShelters should increase by 1
    assert.strictEqual(stats2.atHome, stats1.atHome - 1);
    assert.strictEqual(stats2.atShelters, stats1.atShelters + 1);
    // Net total people accounted should increase by 1 (from 3 to 4)
    assert.strictEqual(stats2.totalPeopleAccounted, stats1.totalPeopleAccounted + 1);
  });

  it('3. Coordinator can verify resident check-in in Command Center', async () => {
    const entry = await safetyCheckInService.recordResidentCheckIn(
      {
        residentName: 'Mang Benigno',
        contactPhone: '+63 922 111 3333',
        residentId: 'res_benigno_003',
        status: 'SAFE_AT_SHELTER',
        currentLocation: 'Bulelak Gym',
        shelterName: 'Bulelak Gym',
        familyCount: 2,
        vulnerableCount: 1,
      },
      'res_benigno_003'
    );

    assert.strictEqual(entry.isVerified, false, 'Initial resident check-in should be unverified');

    const verified = safetyCheckInService.toggleVerify(entry.id, 'Coordinator Maria');
    assert.ok(verified, 'Verification should return updated record');
    assert.strictEqual(verified?.isVerified, true, 'Record should now be verified');
    assert.strictEqual(verified?.verifiedBy, 'Coordinator Maria');
    assert.ok(verified?.verifiedAt, 'verifiedAt timestamp should be set');
  });

  it('4. Search and filter in Command Center matches resident check-ins', async () => {
    await safetyCheckInService.recordResidentCheckIn(
      {
        residentName: 'Felicidad Dimagiba',
        contactPhone: '+63 917 999 8888',
        residentId: 'res_felicidad_004',
        status: 'NEEDS_ASSISTANCE',
        currentLocation: '3rd Floor, 88 JP Rizal St.',
        familyCount: 5,
        vulnerableCount: 2,
        notes: 'Low on drinking water',
      },
      'res_felicidad_004'
    );

    // Search by name
    const searchName = safetyCheckInService.search('Dimagiba', 'ALL');
    assert.ok(searchName.some((r) => r.residentName.includes('Dimagiba')));

    // Search by phone
    const searchPhone = safetyCheckInService.search('999 8888', 'ALL');
    assert.ok(searchPhone.some((r) => r.contactPhone.includes('999 8888')));

    // Filter by category
    const filterNeedsAid = safetyCheckInService.search('', 'NEEDS_ASSISTANCE');
    assert.ok(filterNeedsAid.some((r) => r.residentId === 'res_felicidad_004'));
  });

  it('5. Cloud synchronization: Server store ingests safety_checkin and returns it in getChangesSince', async () => {
    const checkInPayload: SafetyCheckIn = {
      id: 'safe_cloud_005',
      residentName: 'Danilo Cruz',
      contactPhone: '+63 918 000 1111',
      residentId: 'res_danilo_005',
      status: 'SAFE_AT_HOME',
      currentLocation: 'Barangka High Grounds',
      familyCount: 3,
      vulnerableCount: 0,
      timestamp: new Date().toISOString(),
    };

    const syncEvent: SyncEvent = {
      event_id: 'evt_safe_sync_test_' + Date.now(),
      entity_type: 'safety_checkin',
      entity_id: checkInPayload.id,
      operation: 'CREATE',
      payload: checkInPayload,
      origin_device_id: 'dev_test_phone_001',
      actor_id: 'res_danilo_005',
      created_at: new Date().toISOString(),
      schema_version: 1,
      sync_status: 'PENDING',
      retry_count: 0,
    };

    const { acknowledgements } = cloudStore.processSyncEvents([syncEvent]);
    assert.strictEqual(acknowledgements.length, 1);
    assert.strictEqual(acknowledgements[0].status, 'ACKNOWLEDGED');

    const changes = cloudStore.getChangesSince();
    assert.ok(Array.isArray(changes.safetyCheckIns), 'getChangesSince must include safetyCheckIns array');
    const synced = changes.safetyCheckIns.find((c) => c.id === 'safe_cloud_005');
    assert.ok(synced, 'safetyCheckIns from getChangesSince must contain uploaded check-in');
    assert.strictEqual(synced.residentName, 'Danilo Cruz');
  });

  it('6. Remote check-ins pulled from server merge seamlessly into local safetyCheckInService', () => {
    const remoteRecord: SafetyCheckIn = {
      id: 'safe_remote_006',
      residentName: 'Severino Reyes',
      contactPhone: '+63 920 777 6655',
      residentId: 'res_severino_006',
      status: 'SAFE_AT_SHELTER',
      shelterName: 'Concepcion Elementary School',
      currentLocation: 'Concepcion Elementary School Room 10',
      familyCount: 6,
      vulnerableCount: 2,
      timestamp: new Date().toISOString(),
    };

    safetyCheckInService.mergeRemoteCheckIns([remoteRecord]);

    const all = safetyCheckInService.getAll();
    const found = all.find((r) => r.id === 'safe_remote_006');
    assert.ok(found, 'Remote check-in should be present in local registry');
    assert.strictEqual(found.residentName, 'Severino Reyes');
    assert.strictEqual(found.familyCount, 6);

    const stats = safetyCheckInService.getSummaryStats();
    assert.ok(stats.atShelters >= 1);
  });
});
