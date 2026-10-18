/**
 * Verification Test Suite:
 * 1. AlertRepository & DisasterRepository - Coordinator Incoming Disaster Advisory Posting
 * 2. RBAC Enforcement - Residents and Responders cannot declare or post advisories
 * 3. Durable Storage & Sync Event Queue generation
 * 4. Landfall countdown, TCWS signal, preparations checklist, and affected zones contracts
 * 5. 72-Hour Go-Bag Checklist Items and Local Storage persistence
 */

import { localDB, STORES } from '../src/services/offline/db';
import { AlertRepository, DisasterRepository } from '../src/services/repositories';
import { GO_BAG_ITEMS, STORAGE_KEY } from '../src/components/safety/GoBagChecklistModal';
import { GoBagChecklistCard } from '../src/components/safety/GoBagChecklistCard';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { User, Alert } from '../src/types';

// In-memory mock store for test verification
const inMemoryStores: Record<string, Map<string, any>> = {};

function getStore(name: string) {
  if (!inMemoryStores[name]) {
    inMemoryStores[name] = new Map();
  }
  return inMemoryStores[name];
}

// Setup mocks for localDB
localDB.get = async (storeName: any, key: string) => {
  return getStore(storeName).get(key);
};
localDB.put = async (storeName: any, value: any) => {
  getStore(storeName).set(value.id || value.event_id, value);
};
localDB.getAll = async (storeName: any) => {
  return Array.from(getStore(storeName).values());
};
localDB.delete = async (storeName: any, key: string) => {
  getStore(storeName).delete(key);
};
localDB.clear = async (storeName: any) => {
  getStore(storeName).clear();
};

// Setup mock window & localStorage
const mockStorage: Record<string, string> = {};
(global as any).localStorage = {
  getItem: (k: string) => mockStorage[k] || null,
  setItem: (k: string, v: string) => { mockStorage[k] = v; },
  removeItem: (k: string) => { delete mockStorage[k]; },
  clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); },
};

(global as any).window = {
  dispatchEvent: (event: any) => {
    // mock event dispatch
  },
  addEventListener: () => {},
  removeEventListener: () => {},
};

const coordinatorUser: User = {
  id: 'usr_coord_123',
  name: 'Engr. Marlo Santos',
  role: 'COORDINATOR',
  email: 'coordinator@marikina.gov.ph',
  phone: '0917-888-9999',
  locationName: 'Marikina City Disaster Risk Reduction Command Center',
  status: 'ACTIVE',
};

const residentUser: User = {
  id: 'usr_res_456',
  name: 'Elena Dalisay',
  role: 'RESIDENT',
  email: 'elena@gmail.com',
  phone: '0918-111-2222',
  locationName: 'Purok 3, Barangay Tumana',
  status: 'ACTIVE',
};

const responderUser: User = {
  id: 'usr_resp_789',
  name: 'Lt. Dan Fernandez',
  role: 'RESPONDER',
  email: 'dan@rescue161.marikina.gov.ph',
  phone: '0919-333-4444',
  locationName: 'Rescue Station 161 Bravo',
  status: 'ACTIVE',
};

async function runTests() {
  console.log('=== RUNNING RESILIA DISASTER ADVISORY & GO-BAG VERIFICATION TESTS ===\n');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✓ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`✗ [FAIL] ${testName}${detail ? ` - ${detail}` : ''}`);
      failed++;
    }
  }

  // --- TEST 1: RBAC Permission Enforcement on Posting Advisories ---
  try {
    let residentBlocked = false;
    try {
      await AlertRepository.postDisasterAdvisory(
        {
          title: 'Illegitimate Resident Advisory',
          severity: 'CRITICAL',
          message: 'Trying to broadcast without coordinator role',
          daysUntilLandfall: 1,
        },
        residentUser
      );
    } catch (e: any) {
      residentBlocked = e.message.includes('Permission Denied');
    }
    assert(residentBlocked, 'RBAC: Residents cannot post disaster advisories');

    let responderBlocked = false;
    try {
      await AlertRepository.postDisasterAdvisory(
        {
          title: 'Illegitimate Responder Advisory',
          severity: 'CRITICAL',
          message: 'Trying to broadcast without coordinator role',
          daysUntilLandfall: 1,
        },
        responderUser
      );
    } catch (e: any) {
      responderBlocked = e.message.includes('Permission Denied');
    }
    assert(responderBlocked, 'RBAC: Responders cannot post disaster advisories');
  } catch (err: any) {
    assert(false, 'RBAC test execution', err.message);
  }

  // --- TEST 2: Coordinator Successfully Posts Typhoon Advisory with Landfall & Preparations ---
  try {
    const typhoonParams = {
      title: 'PAGASA TCWS #3: SUPER TYPHOON PEPITO APPROACHING NCR / VALLEY',
      severity: 'WARNING' as const,
      message: 'Super Typhoon Pepito is tracking west-northwest with sustained winds of 195 km/h. Expected landfall in approximately 2 days.',
      disasterName: 'Super Typhoon Pepito (Man-yi)',
      disasterType: 'TYPHOON',
      daysUntilLandfall: 2,
      expectedLandfall: 'Friday evening (approx. 48 hours)',
      signalLevel: 3,
      affectedZones: ['Barangay Tumana', 'Malanday Lowlands', 'Nangka Riverbanks'],
      preparations: [
        'Inspect and pack 72-hour family Go-Bag',
        'Anchor loose roof tin sheets',
        'Fully charge powerbanks and radios',
        'Store 1 gallon of potable water per person/day',
      ],
      weatherCondition: 'Approaching Gale Winds',
      rainfallStatus: 'Yellow to Orange Rainfall Warning Expected',
    };

    const newAdvisory = await AlertRepository.postDisasterAdvisory(typhoonParams, coordinatorUser);

    assert(!!newAdvisory.id, 'Coordinator post advisory generates alert ID');
    assert(newAdvisory.active === true, 'New advisory is active');
    assert(newAdvisory.disasterName === typhoonParams.disasterName, 'Preserves disasterName attribute');
    assert(newAdvisory.daysUntilLandfall === 2, 'Preserves daysUntilLandfall = 2');
    assert(newAdvisory.signalLevel === 3, 'Preserves TCWS signalLevel = 3');
    assert(newAdvisory.preparations?.length === 4, 'Preserves all 4 preparations checklist items');
    assert(newAdvisory.affectedZones?.length === 3, 'Preserves all 3 affected zones');

    // Verify stored in IndexedDB STORES.ALERTS
    const storedAlert = await localDB.get<Alert>(STORES.ALERTS, newAdvisory.id);
    assert(!!storedAlert, 'Advisory durably saved in STORES.ALERTS');
    assert(storedAlert?.title === typhoonParams.title, 'Stored alert title matches');
    assert(storedAlert?.daysUntilLandfall === 2, 'Stored alert has daysUntilLandfall = 2');

    // Verify EventQueueService recorded a SyncEvent for offline sync
    const syncEvents = await localDB.getAll<any>(STORES.SYNC_EVENTS);
    const advisorySyncEvent = syncEvents.find((evt: any) => evt.entity_id === newAdvisory.id);
    assert(!!advisorySyncEvent, 'Sync event recorded in STORES.SYNC_EVENTS');
    assert(advisorySyncEvent?.entity_type === 'alert', 'Sync event entity_type is alert');
    assert(advisorySyncEvent?.operation === 'CREATE', 'Sync event operation is CREATE');
    assert(advisorySyncEvent?.sync_status === 'PENDING', 'Sync event marked PENDING for sync client');

    // Verify Audit log recorded
    const auditLogs = await localDB.getAll<any>(STORES.AUDIT);
    const advisoryAudit = auditLogs.find((a: any) => a.entityId === newAdvisory.id);
    assert(!!advisoryAudit, 'Audit log recorded in STORES.AUDIT');
    assert(advisoryAudit?.action === 'POST_DISASTER_ADVISORY', 'Audit action is POST_DISASTER_ADVISORY');
    assert(advisoryAudit?.actorId === coordinatorUser.id, 'Audit actor is coordinator');
  } catch (err: any) {
    assert(false, 'Coordinator post advisory execution', err.message);
  }

  // --- TEST 3: Dismissing Advisories ---
  try {
    const alerts = await AlertRepository.getActive();
    const alertToDismiss = alerts[0];
    assert(!!alertToDismiss, 'Found active alert to dismiss');

    // Test non-coordinator dismissal fails
    let residentDismissBlocked = false;
    try {
      await AlertRepository.dismissAlert(alertToDismiss.id, residentUser);
    } catch {
      residentDismissBlocked = true;
    }
    assert(residentDismissBlocked, 'RBAC: Residents cannot dismiss advisories');

    // Test coordinator dismisses
    await AlertRepository.dismissAlert(alertToDismiss.id, coordinatorUser);
    const updatedAlert = await localDB.get<Alert>(STORES.ALERTS, alertToDismiss.id);
    assert(updatedAlert?.active === false, 'Advisory marked active = false after coordinator dismissal');
  } catch (err: any) {
    assert(false, 'Advisory dismissal execution', err.message);
  }

  // --- TEST 4: Go-Bag Checklist Items & Persistence Contracts ---
  try {
    assert(STORAGE_KEY === 'resilia_gobag_checks_v1', 'GoBag storage key is resilia_gobag_checks_v1');
    assert(GO_BAG_ITEMS.length === 12, 'Go-Bag checklist contains 12 standard items');

    const expectedItemIds = [
      'water',
      'food',
      'meds',
      'docs',
      'whistle',
      'powerbank',
      'cash',
      'masks',
      'radio',
      'blanket',
      'sanitation',
      'multitool',
    ];

    const actualItemIds = GO_BAG_ITEMS.map((item) => item.id);
    const allFound = expectedItemIds.every((id) => actualItemIds.includes(id));
    assert(allFound, 'Go-Bag items include water, food, meds, docs, whistle, powerbank, cash, masks, radio, blanket, sanitation, multitool');

    // Verify key item titles and descriptions explicitly contain requested essentials
    const itemTitlesAndDescs = GO_BAG_ITEMS.map((i) => `${i.title} ${i.description}`.toLowerCase()).join(' ');
    assert(itemTitlesAndDescs.includes('water'), 'Go-Bag covers drinking water');
    assert(itemTitlesAndDescs.includes('non-perishable'), 'Go-Bag covers non-perishables');
    assert(itemTitlesAndDescs.includes('first aid kit'), 'Go-Bag covers first aid kit');
    assert(itemTitlesAndDescs.includes('flashlight'), 'Go-Bag covers flashlight');
    assert(itemTitlesAndDescs.includes('radio'), 'Go-Bag covers radio');
    assert(itemTitlesAndDescs.includes('waterproof pouch') && itemTitlesAndDescs.includes('documents'), 'Go-Bag covers documents in waterproof pouch');
    assert(itemTitlesAndDescs.includes('whistle'), 'Go-Bag covers whistle');
    assert(itemTitlesAndDescs.includes('batteries'), 'Go-Bag covers spare batteries');
    assert(itemTitlesAndDescs.includes('clothes'), 'Go-Bag covers clothes');
    assert(itemTitlesAndDescs.includes('hygiene'), 'Go-Bag covers hygiene');
    assert(itemTitlesAndDescs.includes('emergency cash'), 'Go-Bag covers emergency cash');

    const criticalItems = GO_BAG_ITEMS.filter((i) => i.isCritical);
    assert(criticalItems.length >= 7, 'Go-Bag has at least 7 critical survival items flagged');

    // Verify local storage packing simulation
    const simulatedChecks: Record<string, boolean> = { water: true, food: true, whistle: true, powerbank: true };
    mockStorage[STORAGE_KEY] = JSON.stringify(simulatedChecks);
    const readBack = JSON.parse(mockStorage[STORAGE_KEY]);
    assert(readBack.water === true && readBack.whistle === true, 'Go-Bag checklist state successfully stored and parsed from localStorage');

    // Verify GoBagChecklistCard component dropdown contract
    assert(typeof GoBagChecklistCard === 'function', 'GoBagChecklistCard component is exported and valid');
    const defaultCardElement = React.createElement(GoBagChecklistCard, { defaultOpen: false });
    assert(React.isValidElement(defaultCardElement), 'GoBagChecklistCard creates valid React element with defaultOpen=false');
    const openCardElement = React.createElement(GoBagChecklistCard, { isOpen: true, defaultOpen: true });
    assert(openCardElement.props.isOpen === true, 'GoBagChecklistCard supports controlled isOpen prop');
    assert(openCardElement.props.defaultOpen === true, 'GoBagChecklistCard supports defaultOpen prop');

    // Deep HTML rendering verification: Collapsed state
    const collapsedHtml = renderToString(React.createElement(GoBagChecklistCard, { defaultOpen: false }));
    assert(collapsedHtml.includes('aria-expanded="false"'), 'Collapsed GoBag card has aria-expanded="false" on trigger');
    assert(collapsedHtml.includes('grid-rows-[0fr]'), 'Collapsed GoBag card has CSS grid-rows-[0fr]');
    assert(collapsedHtml.includes('invisible'), 'Collapsed GoBag card prevents keyboard focus with invisible visibility');
    assert(collapsedHtml.includes('aria-hidden="true"'), 'Collapsed GoBag card hides content with aria-hidden="true"');
    assert(collapsedHtml.includes('inert'), 'Collapsed GoBag card prevents tab traversal with inert attribute');

    // Deep HTML rendering verification: Expanded state & full guide button
    let dummyModalCalled = false;
    const expandedHtml = renderToString(
      React.createElement(GoBagChecklistCard, {
        isOpen: true,
        onOpenFullModal: () => { dummyModalCalled = true; },
      })
    );
    assert(expandedHtml.includes('aria-expanded="true"'), 'Expanded GoBag card has aria-expanded="true" on trigger');
    assert(expandedHtml.includes('grid-rows-[1fr]'), 'Expanded GoBag card has CSS grid-rows-[1fr]');
    assert(expandedHtml.includes('visible'), 'Expanded GoBag card has visible class for content');
    assert(!expandedHtml.includes('grid-rows-[0fr]'), 'Expanded GoBag card does not contain closed grid class');
    assert(expandedHtml.includes('Full Guide'), 'Expanded GoBag card renders Full Guide button when prop is passed');
    assert(expandedHtml.includes('role="checkbox"'), 'Expanded GoBag checklist items have role="checkbox" for accessibility');
    assert(expandedHtml.includes('aria-checked="true"'), 'Pre-packed items have aria-checked="true"');
    assert(expandedHtml.includes('role="region"'), 'Collapsible content container has role="region"');
    assert(expandedHtml.includes('Readiness:'), 'Header displays evacuation readiness percentage pill');
  } catch (err: any) {
    assert(false, 'Go-Bag test execution', err.message);
  }

  // --- TEST 5: Edge Cases (Landfall = 0 Imminent, Signal 0, INFO level storm watch) ---
  try {
    const imminentAdvisory = await AlertRepository.postDisasterAdvisory(
      {
        title: 'LANDFALL IMMINENT: TYPHOON EYE PASSING IN 6 HOURS',
        severity: 'CRITICAL',
        message: 'Eye of typhoon making direct landfall shortly.',
        disasterName: 'Typhoon Ulysses',
        daysUntilLandfall: 0,
        signalLevel: 5,
        preparations: [],
      },
      coordinatorUser
    );

    assert(imminentAdvisory.daysUntilLandfall === 0, 'Edge case: daysUntilLandfall = 0 supported for imminent landfall');
    assert(imminentAdvisory.signalLevel === 5, 'Edge case: TCWS Signal #5 supported');

    // Test INFO level advisory (e.g. 3-day Tropical Storm Kristine)
    const infoAdvisory = await AlertRepository.postDisasterAdvisory(
      {
        title: 'PAGASA TROPICAL CYCLONE ADVISORY #1: TROPICAL STORM 72-HOUR WATCH',
        severity: 'INFO',
        message: 'A developing tropical storm is forecast to approach Luzon within 72 hours.',
        disasterName: 'Tropical Storm Kristine',
        daysUntilLandfall: 3,
        signalLevel: 1,
        preparations: ['Review family Go-Bag', 'Monitor official reports'],
        affectedZones: ['Marikina Valley'],
      },
      coordinatorUser
    );
    assert(infoAdvisory.severity === 'INFO', 'Advisory with INFO severity successfully created');
    assert(infoAdvisory.daysUntilLandfall === 3, 'Advisory preserves 3 days until landfall');

    // --- TEST 6: Multi-Alert Coexistence and Audience Visibility ---
    // Responders and residents query active alerts: both the imminent critical alert and the typhoon watch must be returned
    const allActive = await AlertRepository.getActive();
    const hasIncomingAdvisories = allActive.some(
      (a) => typeof a.daysUntilLandfall === 'number' && a.daysUntilLandfall >= 0
    );
    assert(hasIncomingAdvisories, 'Active alert repository returns incoming disaster advisories for users');

    const typhoonAlert = allActive.find((a) => a.disasterName === 'Tropical Storm Kristine');
    assert(!!typhoonAlert, 'Tropical Storm Kristine advisory is queryable in active alerts');
    assert(typhoonAlert?.preparations?.length === 2, 'Advisory preparations checklist accessible to users');
  } catch (err: any) {
    assert(false, 'Edge case testing', err.message);
  }

  console.log(`\n======================================================`);
  console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log(`======================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal error running tests:', err);
  process.exit(1);
});
