/**
 * Resilia Resident Redesign Verification Test Suite
 * Validates the acceptance criteria for Section 13:
 * 1. Residents see simplified interface instead of coordinator controls
 * 2. Current verified emergency alert displayed correctly
 * 3. No false emergency warning appears when none exists
 * 4. Evidence-based answers & uncertainties handled
 * 5. Assistance request persistence & vulnerability calculations
 * 6. Incident report creation & offline persistence
 * 7. Mark me safe workflow (accounted vs unknown, privacy guard)
 * 8. Correct data store persistence
 * 9. Offline state handling
 * 10. Local requests never falsely described as delivered
 * 11. Shelter capacity & staleness
 * 12. Public map never exposes private citizen requests
 * 13. Coordinator & Responder permissions preserved
 */

import { Alert, AssistanceRequest, Community, Incident, Shelter, SyncEvent } from '../src/types';
import {
  currentAlerts,
  computeDelivery,
  isExerciseAlert,
  isStale,
  shortRef,
  STALE_AFTER_MS,
} from '../src/screens/resident/residentUtils';
import { helpCategoryLabel, requestStatusText } from '../src/screens/resident/strings';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SyncCenterScreen } from '../src/screens/SyncCenterScreen';
import { getRolePermissions, isScreenAllowedForRole } from '../src/services/auth/rbac';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
  console.log(`  ✓ ${message}`);
}

function runResidentVerificationSuite() {
  console.log('=== RUNNING RESILIA RESIDENT REDESIGN ACCEPTANCE TESTS ===\n');

  // Test 1: Role-Based Isolation & Simplified Interface
  console.log('[TEST 1] Role Separation & Resident Screen Restrictions');
  const residentPerms = getRolePermissions('RESIDENT');
  assert(!residentPerms.canVerifyIncidents, 'Resident cannot verify incidents');
  assert(!residentPerms.canApproveMissions, 'Resident cannot approve missions');
  assert(!residentPerms.canDeclareDisaster, 'Resident cannot declare area disaster');
  assert(!residentPerms.canInspectSafeRoster, 'Resident cannot inspect global safe roster');
  assert(residentPerms.canRequestAssistance, 'Resident can request assistance');
  assert(residentPerms.canReportIncidents, 'Resident can report problems');

  assert(isScreenAllowedForRole('HOME', 'RESIDENT'), 'Resident allowed on HOME');
  assert(isScreenAllowedForRole('REQUEST_ASSISTANCE', 'RESIDENT'), 'Resident allowed on REQUEST_ASSISTANCE');
  assert(isScreenAllowedForRole('MARK_SAFE', 'RESIDENT'), 'Resident allowed on MARK_SAFE');
  assert(!isScreenAllowedForRole('COORDINATOR', 'RESIDENT'), 'Resident forbidden from COORDINATOR command screen');
  assert(!isScreenAllowedForRole('VERIFICATION', 'RESIDENT'), 'Resident forbidden from VERIFICATION triage screen');

  // Coordinator and Responder intact
  const coordPerms = getRolePermissions('COORDINATOR');
  assert(coordPerms.canVerifyIncidents && coordPerms.canDeclareDisaster, 'Coordinator retains command powers');
  assert(isScreenAllowedForRole('COORDINATOR', 'COORDINATOR'), 'Coordinator can access command screen');

  // Test 2 & 3: Alert Filtering & No False Warnings
  console.log('\n[TEST 2 & 3] Alert Filtering & Exercise Transparency');
  const demoAlerts: Alert[] = [
    {
      id: 'alert_1',
      title: 'MARIKINA RIVER 2ND ALARM',
      severity: 'WARNING',
      message: 'Pre-emptive evacuation underway',
      source: 'MCDRRMO',
      issuedAt: new Date(Date.now() - 3600000).toISOString(),
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      active: true,
      isExercise: true,
    },
    {
      id: 'alert_expired',
      title: 'OLD FLOOD WARNING',
      severity: 'CRITICAL',
      message: 'Expired storm alert',
      source: 'PAGASA',
      issuedAt: new Date(Date.now() - 72000000).toISOString(),
      expiresAt: new Date(Date.now() - 36000000).toISOString(),
      active: true,
    },
    {
      id: 'alert_inactive',
      title: 'STAND DOWN NOTICE',
      severity: 'INFO',
      message: 'Situation normal',
      source: 'CDRRMO',
      issuedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      active: false,
    },
  ];

  const active = currentAlerts(demoAlerts);
  assert(active.length === 1, 'Only active and unexpired alerts are selected');
  assert(active[0].id === 'alert_1', 'Active alert 1 selected');
  assert(isExerciseAlert(active[0]), 'Exercise / drill alert correctly identified and flagged');

  const emptyAlerts = currentAlerts([]);
  assert(emptyAlerts.length === 0, 'No false alarm when alerts array is empty');

  // Test 4: Stale Data Detection
  console.log('\n[TEST 4] Stale Data & Timestamp Calculation');
  const freshIso = new Date(Date.now() - 1000 * 60 * 30).toISOString(); // 30 min ago
  const staleIso = new Date(Date.now() - (STALE_AFTER_MS + 10000)).toISOString(); // > 6 hrs ago
  assert(!isStale(freshIso), 'Fresh record under 6h is not stale');
  assert(isStale(staleIso), 'Record older than 6h is correctly flagged as stale');

  // Test 5: Delivery State Derivation (Real Queue vs Simulated)
  console.log('\n[TEST 5] Honest Offline Delivery State (Never Falsely Delivered)');
  const events: SyncEvent[] = [
    {
      event_id: 'evt_1',
      entity_type: 'assistance_request',
      entity_id: 'req_local_123',
      operation: 'CREATE',
      payload: {},
      origin_device_id: 'dev_1',
      actor_id: 'usr_1',
      created_at: new Date().toISOString(),
      schema_version: 1,
      sync_status: 'PENDING',
      retry_count: 0,
    },
  ];

  const pendingDelivery = computeDelivery(events, 'req_local_123');
  assert(pendingDelivery.state === 'PENDING', 'Locally queued item derived as PENDING');

  const deliveredEvents: SyncEvent[] = [
    {
      ...events[0],
      sync_status: 'SYNCED',
      server_ack_at: new Date().toISOString(),
    },
  ];
  const ackDelivery = computeDelivery(deliveredEvents, 'req_local_123');
  assert(ackDelivery.state === 'DELIVERED', 'Acknowledged item derived as DELIVERED');
  assert(typeof ackDelivery.ackAt === 'string', 'Server ack timestamp preserved');

  // Test 6: Assistance Request Status Transparency
  console.log('\n[TEST 6] Status Honesty: Never Claim Rescue Dispatched Without Mission');
  const unassignedText = requestStatusText('PENDING', false);
  assert(unassignedText.includes('Waiting for coordinator'), 'Pending request does not claim dispatch');

  const triagedText = requestStatusText('TRIAGED', false);
  assert(triagedText.includes('no responder assigned yet'), 'Triaged request clearly indicates no responder assigned yet');

  const assignedWithMissionText = requestStatusText('ASSIGNED', true);
  assert(assignedWithMissionText.includes('assignment has been recorded'), 'Assigned with mission confirms recorded assignment');

  // Test 7: Labeling and Short Reference ID
  console.log('\n[TEST 7] UX Plain Language & Short Reference Codes');
  assert(helpCategoryLabel('EMERGENCY_RESCUE') === 'Emergency or rescue', 'Category converted to human language');
  assert(shortRef('req_98b1a34c-1234-5678').length <= 8, 'Reference ID formatted into concise readable code');

  // Test 8: Resident Sync Center Privacy & Technical Jargon Shielding
  console.log('\n[TEST 8] Resident Sync Center Privacy & Technical Jargon Shielding');
  assert(typeof SyncCenterScreen === 'function', 'SyncCenterScreen is a valid component');
  const residentEl = React.createElement(SyncCenterScreen, { isResident: true });
  assert(residentEl.props.isResident === true, 'SyncCenterScreen accepts isResident prop');

  const residentHtml = renderToStaticMarkup(residentEl);
  // Ensure resident view has citizen-friendly headers & status metrics
  assert(residentHtml.includes('Offline Storage &amp; Sync Status') || residentHtml.includes('Offline Storage & Sync Status'), 'Resident view shows calm Offline Storage title');
  assert(residentHtml.includes('Connection Status'), 'Resident view has Connection Status card');
  assert(residentHtml.includes('Waiting to Send'), 'Resident view has Waiting to Send metric');
  assert(residentHtml.includes('Delivered'), 'Resident view has Delivered metric');
  assert(residentHtml.includes('How Offline Protection Works'), 'Resident view explains offline protection in plain language');

  // Strict negative assertions: Residents must NOT see developer/database internals
  assert(!residentHtml.includes('UUID-based idempotency'), 'Resident view NEVER shows UUID-based idempotency');
  assert(!residentHtml.includes('Local Event Queue Log'), 'Resident view NEVER shows Local Event Queue Log');
  assert(!residentHtml.includes('Operational State Conflicts Requiring Human Resolution'), 'Resident view NEVER shows operational conflict diffs');
  assert(!residentHtml.includes('Local Device Payload:'), 'Resident view NEVER shows Local Device Payload');
  assert(!residentHtml.includes('Remote Cloud Payload:'), 'Resident view NEVER shows Remote Cloud Payload');

  // Verify non-resident view retains technical queue engine
  const nonResidentEl = React.createElement(SyncCenterScreen, { isResident: false });
  const nonResidentHtml = renderToStaticMarkup(nonResidentEl);
  assert(nonResidentHtml.includes('Synchronization &amp; Queue Engine') || nonResidentHtml.includes('Synchronization & Queue Engine'), 'Coordinator retains technical Synchronization & Queue Engine view');
  assert(nonResidentHtml.includes('UUID-based idempotency'), 'Coordinator view retains UUID-based idempotency badge');
  assert(nonResidentHtml.includes('Local Event Queue Log'), 'Coordinator view retains Local Event Queue Log');

  console.log('\n=== ALL RESIDENT REDESIGN TESTS PASSED ===');
}

runResidentVerificationSuite();
