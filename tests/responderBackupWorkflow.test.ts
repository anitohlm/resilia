/**
 * Automated Test Suite: Responder "Request Backup" & Coordinator Assistance Requests Integration
 *
 * Verifies:
 * 1. Responder can submit structured backup requests with units, reason, quantity, and location.
 * 2. MissionRepository and AssistanceRepository bi-directionally persist backup details in IndexedDB.
 * 3. EventQueue and AuditLog record local writes and sync events.
 * 4. Coordinator Assistance Requests table distinguishes requests with "Backup: Yes (View Details)" vs "Backup: No".
 * 5. BackupDetailsModal renders the responder's request details and allows coordinators to dispatch or resolve backup.
 */

import React from 'react';
import { renderToString } from 'react-dom/server';
import { localDB, STORES } from '../src/services/offline/db';
import {
  MissionRepository,
  AssistanceRepository,
  IncidentRepository,
} from '../src/services/repositories';
import { BackupDetailsModal } from '../src/components/coordinator/BackupDetailsModal';
import {
  User,
  AssistanceRequest,
  Incident,
  Mission,
} from '../src/types';

// In-memory mock store for test execution
const inMemoryStores: Record<string, Map<string, any>> = {};

function getStore(name: string) {
  if (!inMemoryStores[name]) {
    inMemoryStores[name] = new Map();
  }
  return inMemoryStores[name];
}

// Wire mocks for localDB
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
(localDB as any).putBatch = async (storeName: any, items: any[]) => {
  for (const item of items) {
    getStore(storeName).set(item.id, item);
  }
};

// Mock browser environments
const mockStorage: Record<string, string> = {};
(global as any).localStorage = {
  getItem: (k: string) => mockStorage[k] || null,
  setItem: (k: string, v: string) => { mockStorage[k] = v; },
  removeItem: (k: string) => { delete mockStorage[k]; },
  clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); },
};

(global as any).window = {
  dispatchEvent: (event: any) => {},
  addEventListener: () => {},
  removeEventListener: () => {},
};

// Mock Auth Context
const mockResponderUser: User = {
  id: 'user_responder_juan',
  name: 'Officer Juan dela Cruz',
  email: 'juan@resilia.gov.ph',
  role: 'RESPONDER',
  locationName: 'Barangay Tumana / Malanday',
  phone: '+63 917 123 4567',
  status: 'ACTIVE',
};

const mockCoordinatorUser: User = {
  id: 'user_coordinator_maria',
  name: 'Capt. Maria Santos',
  email: 'maria@resilia.gov.ph',
  role: 'COORDINATOR',
  locationName: 'Marikina City Disaster Risk Reduction Command',
  phone: '+63 918 765 4321',
  status: 'ACTIVE',
};

// Test Runner
let passCount = 0;
let failCount = 0;

function assert(condition: boolean, testName: string, failureDetails?: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passCount++;
  } else {
    console.error(`  ✗ FAIL: ${testName}${failureDetails ? ' - ' + failureDetails : ''}`);
    failCount++;
  }
}

async function runTests() {
  console.log('\n======================================================');
  console.log('TEST SUITE: Responder Request Backup & Coordinator View');
  console.log('======================================================\n');

  // Clear in-memory stores
  for (const key of Object.keys(inMemoryStores)) {
    inMemoryStores[key].clear();
  }

  // --------------------------------------------------------------------------
  // TEST CASE 1: Setup Assistance Request & Linked Mission
  // --------------------------------------------------------------------------
  console.log('Test 1: Initializing Assistance Request & Assigned Mission');
  const testRequest: AssistanceRequest = {
    id: 'req_elderly_rescue_001',
    residentId: 'res_001',
    residentName: 'Nanay Corazon Ramos',
    contactPhone: '+63 920 111 2222',
    peopleCount: 2,
    vulnerabilityNeeds: {
      elderlyCount: 1,
      infantCount: 0,
      wheelchairUser: true,
      bedridden: false,
      medicalNeeds: ['Hypertension medication'],
    },
    category: 'EVACUATION',
    description: 'Rapidly rising water entering ground floor. Wheelchair user stranded.',
    locationName: 'Purok 2 Riverside, Barangay Tumana',
    lat: 14.658,
    lng: 121.102,
    priority: 'CRITICAL',
    priorityScore: 92,
    priorityRationale: ['Elderly wheelchair resident in flood zone'],
    status: 'ASSIGNED',
    assignedMissionId: 'mis_rescue_001',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const testMission: Mission = {
    id: 'mis_rescue_001',
    title: 'Rescue Nanay Corazon (Wheelchair extraction)',
    assistanceRequestId: 'req_elderly_rescue_001',
    priority: 'CRITICAL',
    rationale: 'Urgent boat extraction needed for wheelchair user.',
    pickupLocation: 'Purok 2 Riverside, Barangay Tumana',
    destinationLocation: 'Malanday Elementary Evacuation Center',
    lat: 14.658,
    lng: 121.102,
    requestedAssistance: 'Rubber boat evacuation',
    vulnerabilitySummary: '1 Elderly, Wheelchair user',
    assignedResponderId: 'user_responder_juan',
    assignedResponderName: 'Officer Juan dela Cruz',
    status: 'IN_PROGRESS',
    statusHistory: [],
    evidenceRecordIds: ['req_elderly_rescue_001'],
    requiresHumanApproval: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await localDB.put(STORES.ASSISTANCE, testRequest);
  await localDB.put(STORES.MISSIONS, testMission);

  const savedReq = await localDB.get<AssistanceRequest>(STORES.ASSISTANCE, testRequest.id);
  const savedMis = await localDB.get<Mission>(STORES.MISSIONS, testMission.id);
  assert(savedReq !== null && savedMis !== null, 'Assistance Request and Mission stored successfully');
  assert(!savedReq?.hasBackupRequest, 'Initially request hasBackupRequest is false/undefined');

  // --------------------------------------------------------------------------
  // TEST CASE 2: Responder executes Request Backup
  // --------------------------------------------------------------------------
  console.log('\nTest 2: Responder triggers Request Backup on assigned Mission');
  const backupResult = await MissionRepository.requestBackup(
    testMission.id,
    {
      resourceType: 'BOAT_EQUIPMENT',
      reason: 'Current is too fast for single boat. Water reached 1.5m depth with floating tree branches.',
      quantity: 2,
      locationName: 'Purok 2 Riverside Dike Approach',
    },
    mockResponderUser
  );

  assert(backupResult.hasBackupRequest === true, 'Mission hasBackupRequest is true');
  assert(backupResult.backupDetails?.status === 'REQUESTED', 'BackupDetails status is REQUESTED');
  assert(backupResult.backupDetails?.resourceType === 'BOAT_EQUIPMENT', 'Resource type correctly set to BOAT_EQUIPMENT');
  assert(backupResult.backupDetails?.quantity === 2, 'Quantity set to 2');
  assert(backupResult.backupDetails?.requestedByResponderId === 'user_responder_juan', 'Requested by Juan');
  assert(backupResult.backupDetails?.locationName === 'Purok 2 Riverside Dike Approach', 'Location matches scene location');

  // Verify bi-directional propagation to linked AssistanceRequest
  const propagatedReq = (await localDB.get<AssistanceRequest>(STORES.ASSISTANCE, testRequest.id))!;
  assert(propagatedReq.hasBackupRequest === true, 'AssistanceRequest hasBackupRequest automatically updated to true');
  assert(propagatedReq.backupDetails?.resourceType === 'BOAT_EQUIPMENT', 'AssistanceRequest backupDetails contains resourceType');
  assert(propagatedReq.backupDetails?.status === 'REQUESTED', 'AssistanceRequest backupDetails status is REQUESTED');

  // Verify Audit Log and Event Queue
  const auditLogs = await localDB.getAll(STORES.AUDIT);
  assert(auditLogs.some((l: any) => l.action === 'REQUEST_BACKUP'), 'Audit log recorded for REQUEST_BACKUP');

  const eventQueue = await localDB.getAll(STORES.SYNC_EVENTS);
  assert(eventQueue.some((e: any) => e.entity_type === 'mission' && e.operation === 'UPDATE'), 'Event recorded for offline sync queue');

  // --------------------------------------------------------------------------
  // TEST CASE 3: Coordinator Assistance Requests Table Logic
  // --------------------------------------------------------------------------
  console.log('\nTest 3: Assistance Requests Table "Backup" Column Evaluation');
  const reqWithoutBackup: AssistanceRequest = {
    id: 'req_food_002',
    residentId: 'res_002',
    residentName: 'Pedro Penduko',
    contactPhone: '+63 919 888 7777',
    peopleCount: 4,
    vulnerabilityNeeds: {
      elderlyCount: 0,
      infantCount: 0,
      wheelchairUser: false,
      bedridden: false,
      medicalNeeds: [],
    },
    category: 'FOOD',
    description: 'Food ration delivery needed.',
    locationName: 'Tumana Main Road',
    lat: 14.656,
    lng: 121.101,
    priority: 'LOW',
    priorityScore: 30,
    priorityRationale: ['Standard food ration request'],
    status: 'PENDING',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Helper mimicking table cell evaluation in CoordinatorDashboardScreen
  function getBackupStatusDisplay(req: AssistanceRequest, missionsList: Mission[]) {
    const linkedMission = req.assignedMissionId
      ? missionsList.find((m) => m.id === req.assignedMissionId)
      : missionsList.find((m) => m.assistanceRequestId === req.id || m.evidenceRecordIds?.includes(req.id));
    const hasBackup = Boolean(
      req.hasBackupRequest ||
      req.backupDetails?.requested ||
      linkedMission?.hasBackupRequest ||
      linkedMission?.backupDetails?.requested
    );
    const backupObj = req.backupDetails || linkedMission?.backupDetails;

    if (hasBackup && backupObj) {
      return { status: 'Yes', hasLink: true, backup: backupObj };
    }
    return { status: 'No', hasLink: false, backup: null };
  }

  const missionsList = [backupResult];
  const colWithBackup = getBackupStatusDisplay(propagatedReq, missionsList);
  assert(colWithBackup.status === 'Yes', 'Request with backup yields status "Yes"');
  assert(colWithBackup.hasLink === true, 'Request with backup yields clickable details link');
  assert(colWithBackup.backup?.resourceType === 'BOAT_EQUIPMENT', 'Provides full backup object');

  const colWithoutBackup = getBackupStatusDisplay(reqWithoutBackup, missionsList);
  assert(colWithoutBackup.status === 'No', 'Request without backup yields status "No"');
  assert(colWithoutBackup.hasLink === false, 'Request without backup has no clickable modal link');

  // --------------------------------------------------------------------------
  // TEST CASE 4: BackupDetailsModal Rendering
  // --------------------------------------------------------------------------
  console.log('\nTest 4: Rendering BackupDetailsModal component');
  let closeCalled = false;
  let statusUpdatedCalled = false;

  const htmlOutput = renderToString(
    React.createElement(BackupDetailsModal, {
      request: propagatedReq,
      mission: backupResult,
      onClose: () => { closeCalled = true; },
      onStatusUpdated: () => { statusUpdatedCalled = true; },
    })
  );

  assert(htmlOutput.includes('Responder Backup Request Details'), 'Modal renders header "Responder Backup Request Details"');
  assert(htmlOutput.includes('Officer Juan dela Cruz'), 'Modal displays requesting officer name');
  assert(htmlOutput.includes('Motorized Rubber Boat / Heavy Equipment'), 'Modal maps BOAT_EQUIPMENT to readable title');
  assert(
    htmlOutput.includes('Requested Quantity:') && htmlOutput.includes('Unit(s) / Personnel'),
    'Modal displays requested quantity'
  );
  assert(htmlOutput.includes('Current is too fast for single boat'), 'Modal displays responder justification');
  assert(htmlOutput.includes('Purok 2 Riverside Dike Approach'), 'Modal displays incident/scene location');
  assert(htmlOutput.includes('Nanay Corazon Ramos'), 'Modal displays linked citizen name');
  assert(htmlOutput.includes('Dispatch Backup Unit'), 'Modal has action button to dispatch backup');
  assert(htmlOutput.includes('Close'), 'Modal has action button to close modal');

  // --------------------------------------------------------------------------
  // TEST CASE 5: Coordinator Dispatches Backup Unit
  // --------------------------------------------------------------------------
  console.log('\nTest 5: Coordinator updates backup status to DISPATCHED');
  const dispatchedReq = await AssistanceRepository.updateBackupStatus(
    propagatedReq.id,
    'DISPATCHED',
    mockCoordinatorUser,
    'Team Bravo dispatched with 2 motorized rubber boats from Station 3.'
  );

  assert(dispatchedReq.backupDetails?.status === 'DISPATCHED', 'Assistance backupDetails status updated to DISPATCHED');
  assert(Boolean(dispatchedReq.backupDetails?.dispatchedAt), 'dispatchedAt timestamp recorded');

  // Resolve backup
  console.log('\nTest 6: Coordinator marks backup RESOLVED');
  const resolvedReq = await AssistanceRepository.updateBackupStatus(
    propagatedReq.id,
    'RESOLVED',
    mockCoordinatorUser,
    'All family members safely extracted and transferred to Malanday Elementary.'
  );

  assert(resolvedReq.backupDetails?.status === 'RESOLVED', 'Assistance backupDetails status updated to RESOLVED');
  assert(resolvedReq.hasBackupRequest === true, 'hasBackupRequest remains true for historical tracking');

  // --------------------------------------------------------------------------
  // TEST CASE 7: Coordinator Incidents & Reports Table Backup Column Evaluation
  // --------------------------------------------------------------------------
  console.log('\nTest 7: Incidents & Reports Table "Backup" Column Evaluation');
  const testIncidentWithBackup: Incident = {
    id: 'inc_flood_rescue_001',
    type: 'FLOOD',
    title: 'Severe Dike Overtopping at Tumana Reach',
    description: 'River breached retaining wall, 120cm floodwater on street level.',
    lat: 14.658,
    lng: 121.102,
    locationName: 'Purok 4, Tumana Dike',
    reporterId: 'res_001',
    reporterName: 'Aling Maria',
    reporterRole: 'RESIDENT',
    severity: 'CRITICAL',
    status: 'VERIFIED',
    supportingReportsCount: 3,
    contradictingReportsCount: 0,
    hasBackupRequest: true,
    backupDetails: {
      requested: true,
      resourceType: 'BOAT_EQUIPMENT',
      quantity: 2,
      reason: 'Rapid current requires motorized reinforcement raft.',
      locationName: 'Purok 4, Tumana Dike',
      requestedByResponderId: 'user_responder_juan',
      requestedByResponderName: 'Officer Juan dela Cruz',
      requestedAt: new Date().toISOString(),
      status: 'REQUESTED',
    },
    createdAt: new Date().toISOString(),
  };

  const testIncidentWithoutBackup: Incident = {
    id: 'inc_tree_fall_002',
    type: 'ROAD_BLOCKED',
    title: 'Fallen Mahogany Branch Blocking Lane',
    description: 'Single branch blocking northbound lane, passable for motorcycles.',
    lat: 14.659,
    lng: 121.103,
    locationName: 'J.P. Rizal St., Tumana',
    reporterId: 'res_002',
    reporterName: 'Mang Ben',
    reporterRole: 'RESIDENT',
    severity: 'LOW',
    status: 'REPORTED',
    supportingReportsCount: 1,
    contradictingReportsCount: 0,
    createdAt: new Date().toISOString(),
  };

  await localDB.put(STORES.INCIDENTS, testIncidentWithBackup);
  await localDB.put(STORES.INCIDENTS, testIncidentWithoutBackup);

  // Helper mimicking table cell evaluation for Incidents in CoordinatorDashboardScreen
  function getIncidentBackupStatusDisplay(
    inc: Incident,
    missionsList: Mission[],
    requestsList: AssistanceRequest[]
  ) {
    const linkedMission = missionsList.find(
      (m) =>
        m.evidenceRecordIds?.includes(inc.id) ||
        m.id === inc.assignedResponderId ||
        (m.title && inc.title && m.title.toLowerCase().includes(inc.title.toLowerCase()))
    );
    const linkedRequest = requestsList.find(
      (r) =>
        r.id === inc.id ||
        (linkedMission &&
          (linkedMission.assistanceRequestId === r.id || linkedMission.evidenceRecordIds?.includes(r.id)))
    );

    const hasBackup = Boolean(
      inc.hasBackupRequest ||
        inc.backupDetails?.requested ||
        linkedMission?.hasBackupRequest ||
        linkedMission?.backupDetails?.requested ||
        linkedRequest?.hasBackupRequest ||
        linkedRequest?.backupDetails?.requested
    );
    const backupObj = inc.backupDetails || linkedMission?.backupDetails || linkedRequest?.backupDetails;

    if (hasBackup && backupObj) {
      return { status: 'Yes', hasLink: true, backup: backupObj };
    }
    return { status: 'No', hasLink: false, backup: null };
  }

  const incColWithBackup = getIncidentBackupStatusDisplay(testIncidentWithBackup, missionsList, [propagatedReq]);
  assert(incColWithBackup.status === 'Yes', 'Incident with backup yields status "Yes"');
  assert(incColWithBackup.hasLink === true, 'Incident with backup yields clickable details link');
  assert(incColWithBackup.backup?.resourceType === 'BOAT_EQUIPMENT', 'Provides full backup object for incident');

  const incColWithoutBackup = getIncidentBackupStatusDisplay(testIncidentWithoutBackup, missionsList, [propagatedReq]);
  assert(incColWithoutBackup.status === 'No', 'Incident without backup yields status "No"');
  assert(incColWithoutBackup.hasLink === false, 'Incident without backup has no clickable modal link');

  // --------------------------------------------------------------------------
  // TEST CASE 8: Rendering BackupDetailsModal for an Incident
  // --------------------------------------------------------------------------
  console.log('\nTest 8: Rendering BackupDetailsModal component for Incident');
  const incidentModalHtml = renderToString(
    React.createElement(BackupDetailsModal, {
      incident: testIncidentWithBackup,
      onClose: () => {},
      onStatusUpdated: () => {},
    })
  );

  assert(incidentModalHtml.includes('Responder Backup Request Details'), 'Incident Modal renders header');
  assert(incidentModalHtml.includes('Linked Incident Report'), 'Incident Modal renders "Linked Incident Report" card');
  assert(incidentModalHtml.includes('Severe Dike Overtopping at Tumana Reach'), 'Incident Modal displays incident title');
  assert(incidentModalHtml.includes('Purok 4, Tumana Dike'), 'Incident Modal displays incident location');
  assert(incidentModalHtml.includes('Officer Juan dela Cruz'), 'Incident Modal displays requesting responder name');
  assert(incidentModalHtml.includes('Dispatch Backup Unit'), 'Incident Modal has action button to dispatch backup');

  // --------------------------------------------------------------------------
  // TEST CASE 9: Coordinator updates incident backup status
  // --------------------------------------------------------------------------
  console.log('\nTest 9: Coordinator updates incident backup status via IncidentRepository');
  const dispatchedIncident = await IncidentRepository.updateBackupStatus(
    testIncidentWithBackup.id,
    'DISPATCHED',
    mockCoordinatorUser,
    'Dispatched Marine Unit 2 to Tumana Dike.'
  );
  assert(dispatchedIncident.backupDetails?.status === 'DISPATCHED', 'Incident backup status updated to DISPATCHED');
  assert(Boolean(dispatchedIncident.backupDetails?.dispatchedAt), 'Incident dispatchedAt recorded');

  const resolvedIncident = await IncidentRepository.updateBackupStatus(
    testIncidentWithBackup.id,
    'RESOLVED',
    mockCoordinatorUser,
    'Reinforcement completed dike securing.'
  );
  assert(resolvedIncident.backupDetails?.status === 'RESOLVED', 'Incident backup status updated to RESOLVED');

  console.log('\n======================================================');
  console.log(`TEST RESULTS: ${passCount} Passed, ${failCount} Failed`);
  console.log('======================================================\n');

  if (failCount > 0) {
    process.exit(1);
  }
  process.exit(0);
}

runTests().catch((err) => {
  console.error('Unhandled error during test execution:', err);
  process.exit(1);
});
