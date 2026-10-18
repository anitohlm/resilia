/**
 * Resilia End-to-End Online Synchronization Test Suite
 * Validates the full operational lifecycle across all three personas:
 * 1. Resident: Submits Emergency Incident & Assistance Request
 * 2. Coordinator (Command Center): Pulls changes, verifies, and dispatches Officer Juan dela Cruz
 * 3. Emergency Responder (Officer Juan): Receives mission, accepts, completes debrief
 * 4. Closed-Loop Sync: Status updates propagate back to Coordinator & Resident
 * 5. Robust Matcher: Verifies name/ID variations, lookback windows, and idempotency
 */

import { cloudStore } from '../server/store';
import {
  Incident,
  AssistanceRequest,
  Mission,
  SyncEvent,
  Report,
} from '../src/types';
import {
  isMissionAssignedToResponder,
  getActiveResponderMission,
  getMissionNextAction,
} from '../src/screens/responder/responderUtils';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
  console.log(`  ✓ ${message}`);
}

async function runEndToEndSyncSuite() {
  console.log('================================================================');
  console.log('RESILIA RESIDENT -> COMMAND CENTER -> RESPONDER E2E SYNC TESTS');
  console.log('================================================================\n');

  const now = new Date().toISOString();
  const residentId = 'user_resident_lola_rosa';
  const residentName = 'Lola Rosa Macaraeg';
  const responderId = 'user_responder_juan';
  const responderName = 'Officer Juan dela Cruz';
  const coordinatorId = 'user_coordinator_maria';
  const coordinatorName = 'Capt. Maria Santos';

  // ============================================================================
  // STEP 1: Resident Submits Assistance Request & Incident Report
  // ============================================================================
  console.log('[STEP 1] Resident submits emergency assistance request & incident');

  const incidentId = 'inc_sync_test_' + Date.now();
  const residentIncident: Incident = {
    id: incidentId,
    type: 'FLOOD',
    title: 'Severe flash flood at Tumana Dike',
    description: 'Water level reached 1.2m, 3 residents trapped in second floor',
    lat: 14.6582,
    lng: 121.1018,
    locationName: 'Purok 4, Tumana Dike Side',
    reporterId: residentId,
    reporterName: residentName,
    reporterRole: 'RESIDENT',
    severity: 'CRITICAL',
    status: 'REPORTED',
    floodDepthCm: 120,
    supportingReportsCount: 1,
    contradictingReportsCount: 0,
    responderStatus: 'UNASSIGNED',
    createdAt: now,
  };

  const requestId = 'req_sync_test_' + Date.now();
  const residentAssistanceReq: AssistanceRequest = {
    id: requestId,
    residentId: residentId,
    residentName: residentName,
    contactPhone: '+63 920 555 0303',
    peopleCount: 3,
    vulnerabilityNeeds: {
      elderlyCount: 1,
      infantCount: 0,
      wheelchairUser: true,
      bedridden: false,
      medicalNeeds: ['Hypertension maintenance medication'],
    },
    category: 'EVACUATION',
    description: 'Wheelchair user elderly needs rescue boat',
    locationName: 'Purok 4, Tumana Dike Side',
    lat: 14.6582,
    lng: 121.1018,
    priority: 'CRITICAL',
    priorityScore: 98,
    priorityRationale: ['Elderly resident', 'Wheelchair user trapped by flood'],
    status: 'PENDING',
    createdAt: now,
    updatedAt: now,
  };

  // Upload to central cloud store via Sync Events
  const residentEvents: SyncEvent[] = [
    {
      event_id: 'evt_inc_create_' + Date.now(),
      entity_type: 'incident',
      entity_id: incidentId,
      operation: 'CREATE',
      payload: residentIncident,
      origin_device_id: 'device_resident_mobile',
      actor_id: residentId,
      created_at: now,
      schema_version: 1,
      sync_status: 'PENDING',
      retry_count: 0,
    },
    {
      event_id: 'evt_req_create_' + Date.now(),
      entity_type: 'assistance_request',
      entity_id: requestId,
      operation: 'CREATE',
      payload: residentAssistanceReq,
      origin_device_id: 'device_resident_mobile',
      actor_id: residentId,
      created_at: now,
      schema_version: 1,
      sync_status: 'PENDING',
      retry_count: 0,
    },
  ];

  const uploadResult1 = cloudStore.processSyncEvents(residentEvents);
  assert(uploadResult1.acknowledgements.length === 2, 'Resident events processed by cloud store');
  assert(uploadResult1.acknowledgements.every(a => a.status === 'ACKNOWLEDGED'), 'All resident events ACKNOWLEDGED');

  // Verify server store reflects the records
  const serverIncident = cloudStore.incidents.get(incidentId);
  const serverRequest = cloudStore.assistanceRequests.get(requestId);
  assert(!!serverIncident && serverIncident.title === residentIncident.title, 'Server store has resident incident');
  assert(!!serverRequest && serverRequest.residentName === residentName, 'Server store has resident assistance request');

  // ============================================================================
  // STEP 2: Coordinator Pulls Data, Verifies & Dispatches Officer Juan
  // ============================================================================
  console.log('\n[STEP 2] Coordinator pulls pending items, verifies incident, and creates/assigns mission');

  // Pull delta changes since 1 minute ago
  const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
  const coordinatorPull = cloudStore.getChangesSince(oneMinuteAgo);

  const pulledIncident = coordinatorPull.incidents.find(i => i.id === incidentId);
  const pulledRequest = coordinatorPull.assistanceRequests.find(r => r.id === requestId);
  assert(!!pulledIncident, 'Coordinator pulled resident incident from server');
  assert(!!pulledRequest, 'Coordinator pulled resident assistance request from server');

  // Coordinator verifies incident and assigns responder
  pulledIncident!.status = 'VERIFIED';
  pulledIncident!.verifiedAt = new Date().toISOString();
  pulledIncident!.verifiedBy = `${coordinatorName} (COORDINATOR)`;
  pulledIncident!.assignedResponderId = responderId;
  pulledIncident!.assignedResponderName = responderName;
  pulledIncident!.responderStatus = 'DISPATCHED';

  // Coordinator creates and assigns official Mission
  const missionId = 'mis_sync_test_' + Date.now();
  const dispatchMission: Mission = {
    id: missionId,
    title: `Evacuation Mission: ${residentName} (3 pax)`,
    assistanceRequestId: requestId,
    priority: 'CRITICAL',
    rationale: 'Wheelchair user trapped in rising floodwaters',
    pickupLocation: residentAssistanceReq.locationName,
    destinationLocation: 'Malanday Elementary School Evacuation Center',
    lat: residentAssistanceReq.lat,
    lng: residentAssistanceReq.lng,
    requestedAssistance: residentAssistanceReq.description,
    vulnerabilitySummary: '1 Elderly, Wheelchair User',
    assignedResponderId: responderId,
    assignedResponderName: responderName,
    assignedVehicleType: 'Motorized Rubber Boat 161-B',
    status: 'ASSIGNED',
    statusHistory: [
      {
        status: 'PROPOSED',
        actorId: coordinatorId,
        actorName: coordinatorName,
        timestamp: now,
        note: 'AI mission proposal approved by coordinator',
      },
      {
        status: 'ASSIGNED',
        actorId: coordinatorId,
        actorName: coordinatorName,
        timestamp: new Date().toISOString(),
        note: `Dispatched to ${responderName}`,
      },
    ],
    evidenceRecordIds: [requestId, incidentId],
    requiresHumanApproval: true,
    createdAt: now,
    updatedAt: new Date().toISOString(),
  };

  // Push coordinator updates
  const coordinatorEvents: SyncEvent[] = [
    {
      event_id: 'evt_inc_verify_' + Date.now(),
      entity_type: 'incident',
      entity_id: incidentId,
      operation: 'UPDATE',
      payload: pulledIncident,
      origin_device_id: 'device_coordinator_station',
      actor_id: coordinatorId,
      created_at: new Date().toISOString(),
      schema_version: 1,
      sync_status: 'PENDING',
      retry_count: 0,
    },
    {
      event_id: 'evt_mis_assign_' + Date.now(),
      entity_type: 'mission',
      entity_id: missionId,
      operation: 'CREATE',
      payload: dispatchMission,
      origin_device_id: 'device_coordinator_station',
      actor_id: coordinatorId,
      created_at: new Date().toISOString(),
      schema_version: 1,
      sync_status: 'PENDING',
      retry_count: 0,
    },
  ];

  const uploadResult2 = cloudStore.processSyncEvents(coordinatorEvents);
  assert(uploadResult2.acknowledgements.every(a => a.status === 'ACKNOWLEDGED'), 'Coordinator dispatch events ACKNOWLEDGED');

  // ============================================================================
  // STEP 3: Responder (Officer Juan) Pulls and Matches Assigned Mission
  // ============================================================================
  console.log('\n[STEP 3] Responder Juan syncs, identifies assigned mission, and accepts');

  const responderPull = cloudStore.getChangesSince(oneMinuteAgo);
  const pulledMissions = responderPull.missions;

  // Test our resilient matcher with various forms of Officer Juan's identity
  assert(
    isMissionAssignedToResponder(dispatchMission, 'user_responder_juan', 'Officer Juan dela Cruz'),
    'Exact ID and name matches responder'
  );
  assert(
    isMissionAssignedToResponder(dispatchMission, 'custom_user_id', 'Officer Juan Dela Cruz'),
    'Case-insensitive capital "D" Dela Cruz matches'
  );
  assert(
    isMissionAssignedToResponder(dispatchMission, 'custom_user_id', 'Juan dela Cruz'),
    'Name without "Officer" prefix matches'
  );
  assert(
    isMissionAssignedToResponder(dispatchMission, 'user_responder_juan', 'Any Name'),
    'Canonical user_responder_juan ID matches'
  );

  // Active mission derivation finds the dispatched mission
  const activeMission = getActiveResponderMission(pulledMissions, responderId, responderName);
  assert(activeMission !== null && activeMission.id === missionId, 'Active mission correctly derived for Officer Juan');

  // Next action for ASSIGNED should be ACCEPT MISSION
  const nextAction1 = getMissionNextAction(activeMission!);
  assert(nextAction1?.nextStatus === 'ACCEPTED', 'Next action is ACCEPTED');
  assert(nextAction1?.label === 'ACCEPT MISSION', 'Action label is ACCEPT MISSION');

  // Responder Juan accepts the mission
  const acceptedMission: Mission = {
    ...activeMission!,
    status: 'ACCEPTED',
    updatedAt: new Date().toISOString(),
    statusHistory: [
      ...activeMission!.statusHistory,
      {
        status: 'ACCEPTED',
        actorId: responderId,
        actorName: responderName,
        timestamp: new Date().toISOString(),
        note: 'Officer Juan accepted mission. Mobilizing rubber boat.',
      },
    ],
  };

  const responderAcceptEvent: SyncEvent = {
    event_id: 'evt_mis_accept_' + Date.now(),
    entity_type: 'mission',
    entity_id: missionId,
    operation: 'UPDATE',
    payload: acceptedMission,
    origin_device_id: 'device_responder_handheld',
    actor_id: responderId,
    created_at: new Date().toISOString(),
    schema_version: 1,
    sync_status: 'PENDING',
    retry_count: 0,
  };

  const uploadResult3 = cloudStore.processSyncEvents([responderAcceptEvent]);
  assert(uploadResult3.acknowledgements[0].status === 'ACKNOWLEDGED', 'Mission acceptance ACKNOWLEDGED by server');

  // ============================================================================
  // STEP 4: Responder Juan Starts Mission (IN_PROGRESS) and Completes It
  // ============================================================================
  console.log('\n[STEP 4] Responder starts mission, reaches scene, submits debrief and completes');

  // Transition to IN_PROGRESS
  const inProgressMission: Mission = {
    ...acceptedMission,
    status: 'IN_PROGRESS',
    updatedAt: new Date().toISOString(),
    statusHistory: [
      ...acceptedMission.statusHistory,
      {
        status: 'IN_PROGRESS',
        actorId: responderId,
        actorName: responderName,
        timestamp: new Date().toISOString(),
        note: 'En route with rubber boat 161-B to Purok 4',
      },
    ],
  };

  // Responder submits field report
  const fieldReport: Report = {
    id: 'rep_sync_' + Date.now(),
    incidentId: incidentId,
    reporterId: responderId,
    reporterName: responderName,
    reporterRole: 'RESPONDER',
    reportType: 'CORROBORATION',
    observation: 'Approaching Tumana Dike. Water depth 110cm. Preparing wheelchair boarding.',
    roadStatus: 'IMPASSABLE',
    floodDepthCm: 110,
    timestamp: new Date().toISOString(),
    lat: 14.6582,
    lng: 121.1018,
  };

  // Responder completes mission with mandatory debrief note
  const debriefNote = 'Successfully evacuated Lola Rosa and 2 family members to Malanday Elementary School safely.';
  const completedMission: Mission = {
    ...inProgressMission,
    status: 'COMPLETED',
    updatedAt: new Date().toISOString(),
    statusHistory: [
      ...inProgressMission.statusHistory,
      {
        status: 'COMPLETED',
        actorId: responderId,
        actorName: responderName,
        timestamp: new Date().toISOString(),
        note: debriefNote,
      },
    ],
  };

  // Associated incident is marked RESOLVED and assistance request is FULFILLED
  const resolvedIncident: Incident = {
    ...serverIncident!,
    status: 'RESOLVED',
    responderStatus: 'RESOLVED',
    supportingReportsCount: 2,
  };

  const fulfilledRequest: AssistanceRequest = {
    ...serverRequest!,
    status: 'FULFILLED',
    assignedMissionId: missionId,
    updatedAt: new Date().toISOString(),
  };

  const responderCompletionEvents: SyncEvent[] = [
    {
      event_id: 'evt_mis_progress_' + Date.now(),
      entity_type: 'mission',
      entity_id: missionId,
      operation: 'UPDATE',
      payload: inProgressMission,
      origin_device_id: 'device_responder_handheld',
      actor_id: responderId,
      created_at: new Date().toISOString(),
      schema_version: 1,
      sync_status: 'PENDING',
      retry_count: 0,
    },
    {
      event_id: 'evt_rep_corrob_' + Date.now(),
      entity_type: 'report',
      entity_id: fieldReport.id,
      operation: 'CREATE',
      payload: fieldReport,
      origin_device_id: 'device_responder_handheld',
      actor_id: responderId,
      created_at: new Date().toISOString(),
      schema_version: 1,
      sync_status: 'PENDING',
      retry_count: 0,
    },
    {
      event_id: 'evt_mis_complete_' + Date.now(),
      entity_type: 'mission',
      entity_id: missionId,
      operation: 'UPDATE',
      payload: completedMission,
      origin_device_id: 'device_responder_handheld',
      actor_id: responderId,
      created_at: new Date().toISOString(),
      schema_version: 1,
      sync_status: 'PENDING',
      retry_count: 0,
    },
    {
      event_id: 'evt_inc_resolve_' + Date.now(),
      entity_type: 'incident',
      entity_id: incidentId,
      operation: 'UPDATE',
      payload: resolvedIncident,
      origin_device_id: 'device_responder_handheld',
      actor_id: responderId,
      created_at: new Date().toISOString(),
      schema_version: 1,
      sync_status: 'PENDING',
      retry_count: 0,
    },
    {
      event_id: 'evt_req_fulfill_' + Date.now(),
      entity_type: 'assistance_request',
      entity_id: requestId,
      operation: 'UPDATE',
      payload: fulfilledRequest,
      origin_device_id: 'device_responder_handheld',
      actor_id: responderId,
      created_at: new Date().toISOString(),
      schema_version: 1,
      sync_status: 'PENDING',
      retry_count: 0,
    },
  ];

  const uploadResult4 = cloudStore.processSyncEvents(responderCompletionEvents);
  assert(uploadResult4.acknowledgements.every(a => a.status === 'ACKNOWLEDGED'), 'All completion events ACKNOWLEDGED');

  // ============================================================================
  // STEP 5: Closed Loop - Coordinator & Resident Pull Final State
  // ============================================================================
  console.log('\n[STEP 5] Command Center & Resident pull verified completed state');

  const finalPull = cloudStore.getChangesSince(oneMinuteAgo);
  const finalMission = finalPull.missions.find(m => m.id === missionId);
  const finalIncident = finalPull.incidents.find(i => i.id === incidentId);
  const finalRequest = finalPull.assistanceRequests.find(r => r.id === requestId);

  assert(finalMission?.status === 'COMPLETED', 'Mission verified as COMPLETED across all clients');
  assert(finalIncident?.status === 'RESOLVED', 'Incident verified as RESOLVED across all clients');
  assert(finalRequest?.status === 'FULFILLED', 'Resident request verified as FULFILLED across all clients');

  // ============================================================================
  // STEP 6: Edge Cases, Time Drift & Robustness Checks
  // ============================================================================
  console.log('\n[STEP 6] Testing timestamp lookback window and deduplication');

  // 10s lookback safety window check: pulling with a future timestamp still captures recently written items within lookback
  const slightlyAheadTimestamp = new Date(Date.now() + 5000).toISOString();
  const driftPull = cloudStore.getChangesSince(slightlyAheadTimestamp);
  assert(
    driftPull.missions.some(m => m.id === missionId),
    '10s lookback margin protects against slight client/server clock advance'
  );

  // Idempotent resubmission of already processed event
  const duplicateResult = cloudStore.processSyncEvents([coordinatorEvents[1]]);
  assert(
    duplicateResult.acknowledgements[0].status === 'ACKNOWLEDGED',
    'Re-submitting duplicate event acknowledges idempotently without error'
  );

  console.log('\n================================================================');
  console.log('✓ ALL RESIDENT -> COORDINATOR -> RESPONDER E2E SYNC TESTS PASSED');
  console.log('================================================================\n');
}

runEndToEndSyncSuite().catch(err => {
  console.error('\n✖ E2E SYNC TEST FAILED:', err);
  process.exit(1);
});
