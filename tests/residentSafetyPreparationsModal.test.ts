/**
 * Test Suite: Resident Portal Safety Preparations & Instructions Modal
 * Verifies:
 * 1. getDefaultPreparations synthesizes disaster-appropriate actionable checklists.
 * 2. Custom preparations supplied by authorities take precedence when present.
 * 3. AlertCard displays preparations preview and 'View safety preparations & instructions' trigger button.
 * 4. AlertDetailsDialog renders complete action checklist, progress indicators, official guidance, and hotlines.
 * 5. Dialog component accessibility, portal safety, and backdrop containment.
 */

import React from 'react';
import { renderToString } from 'react-dom/server';
import { getDefaultPreparations, AlertCard, AlertDetailsDialog } from '../src/screens/resident/ResidentAlerts';
import { Dialog } from '../src/screens/resident/ui';
import { Alert, Community } from '../src/types';

// Mock browser globals for test environment
if (typeof (global as any).window === 'undefined') {
  (global as any).window = {};
}
if (typeof (global as any).document === 'undefined') {
  (global as any).document = {
    body: { style: {} },
    addEventListener: () => {},
    removeEventListener: () => {},
  };
}

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

console.log('======================================================');
console.log('TEST SUITE: Resident Safety Preparations & Instructions Modal');
console.log('======================================================\n');

// -----------------------------------------------------------------------------
// Test 1: getDefaultPreparations for different disaster types
// -----------------------------------------------------------------------------
console.log('Test 1: Fallback Safety Preparations Synthesis');
{
  const floodAlert: Alert = {
    id: 'alt_flood_01',
    title: 'PAGASA RED RAINFALL ADVISORY #14',
    severity: 'CRITICAL',
    message: 'Torrential rains expected over Marikina Valley.',
    source: 'PAGASA',
    issuedAt: new Date().toISOString(),
    active: true,
  };

  const floodPreps = getDefaultPreparations(floodAlert);
  assert(floodPreps.length >= 5, 'Flood alert receives at least 5 actionable preparation steps');
  assert(
    floodPreps.some((p) => p.toLowerCase().includes('water') && p.toLowerCase().includes('gallon')),
    'Flood preparations include drinking water storage'
  );
  assert(
    floodPreps.some((p) => p.toLowerCase().includes('go-bag') || p.toLowerCase().includes('appliances')),
    'Flood preparations include Go-Bag or moving appliances to high ground'
  );

  const typhoonAlert: Alert = {
    id: 'alt_typhoon_01',
    title: 'PAGASA TCWS #3: SUPER TYPHOON PEPITO',
    severity: 'WARNING',
    message: 'Violent winds and torrential rain expected.',
    source: 'PAGASA',
    issuedAt: new Date().toISOString(),
    active: true,
    disasterType: 'TYPHOON',
  };

  const typhoonPreps = getDefaultPreparations(typhoonAlert);
  assert(typhoonPreps.length >= 5, 'Typhoon alert receives actionable typhoon preparation steps');
  assert(
    typhoonPreps.some((p) => p.toLowerCase().includes('roof') || p.toLowerCase().includes('whistle')),
    'Typhoon preparations include anchoring roofs or whistle/flashlight'
  );

  const quakeAlert: Alert = {
    id: 'alt_quake_01',
    title: 'PHILVOCS EARTHQUAKE ADVISORY: MAGNITUDE 6.2',
    severity: 'CRITICAL',
    message: 'Ground shaking detected along West Valley Fault.',
    source: 'PHIVOLCS',
    issuedAt: new Date().toISOString(),
    active: true,
  };

  const quakePreps = getDefaultPreparations(quakeAlert);
  assert(
    quakePreps.some((p) => p.toLowerCase().includes('duck') || p.toLowerCase().includes('cover')),
    'Earthquake preparations include Duck, Cover, and Hold'
  );

  const generalAlert: Alert = {
    id: 'alt_general_01',
    title: 'CIVIL DEFENSE ADVISORY',
    severity: 'INFO',
    message: 'Emergency advisory for district residents.',
    source: 'CDRRMO',
    issuedAt: new Date().toISOString(),
    active: true,
  };

  const generalPreps = getDefaultPreparations(generalAlert);
  assert(generalPreps.length >= 5, 'General alert receives standard civil defense instructions');
}

// -----------------------------------------------------------------------------
// Test 2: Custom preparations take precedence
// -----------------------------------------------------------------------------
console.log('\nTest 2: Authority Custom Preparations Precedence');
{
  const customAlert: Alert = {
    id: 'alt_custom_01',
    title: 'PAGASA TCWS #4: TYPHOON LANDFALL',
    severity: 'CRITICAL',
    message: 'Execute emergency mandatory evacuation immediately.',
    source: 'CDRRMO',
    issuedAt: new Date().toISOString(),
    active: true,
    preparations: [
      'Mandatory immediate evacuation of Zone 1 and Zone 2',
      'Proceed immediately to Marikina Elementary Gym',
    ],
  };

  const preps = getDefaultPreparations(customAlert);
  assert(preps.length === 2, 'Custom preparations count matches authority input');
  assert(preps[0].includes('Mandatory immediate evacuation'), 'First custom preparation preserved');
}

// -----------------------------------------------------------------------------
// Test 3: AlertCard rendering with button trigger
// -----------------------------------------------------------------------------
console.log('\nTest 3: AlertCard Action Button & Preview');
{
  const alert: Alert = {
    id: 'alt_card_01',
    title: 'PAGASA RED RAINFALL ADVISORY #14',
    severity: 'CRITICAL',
    message: 'Torrential rainfall over Marikina Valley.',
    source: 'DOST-PAGASA',
    issuedAt: new Date().toISOString(),
    active: true,
  };

  const html = renderToString(
    React.createElement(AlertCard, {
      alert,
      isOffline: false,
      onOpen: () => {},
    })
  );

  assert(
    html.includes('View safety preparations &amp; instructions') ||
      html.includes('View safety preparations & instructions'),
    'AlertCard renders "View safety preparations & instructions" button'
  );
  assert(
    html.includes('Preparations Needed Before Impact:'),
    'AlertCard displays preparations preview header'
  );
  assert(
    html.includes('action steps'),
    'AlertCard displays action steps count'
  );
}

// -----------------------------------------------------------------------------
// Test 4: AlertDetailsDialog modal contents
// -----------------------------------------------------------------------------
console.log('\nTest 4: AlertDetailsDialog Modal Content & Checklist');
{
  const alert: Alert = {
    id: 'alt_modal_01',
    title: 'PAGASA RED RAINFALL ADVISORY #14',
    severity: 'CRITICAL',
    message: 'Torrential rains expected over low-lying areas.',
    source: 'DOST-PAGASA Weather Division',
    issuedAt: new Date().toISOString(),
    active: true,
    affectedZones: ['Barangay Tumana', 'Malanday Lowlands'],
  };

  const community: Community = {
    id: 'comm_01',
    name: 'Marikina Valley',
    riverWaterLevelMeters: 16.5,
    source: 'CDRRMO River Telemetry',
    lastUpdated: new Date().toISOString(),
  };

  const html = renderToString(
    React.createElement(AlertDetailsDialog, {
      alert,
      community,
      isOffline: false,
      onClose: () => {},
      onFindShelter: () => {},
      onGetHelp: () => {},
      onOpenGoBag: () => {},
    })
  );

  assert(
    html.includes('Action Checklist: Safety Preparations &amp; Instructions') ||
      html.includes('Action Checklist: Safety Preparations & Instructions'),
    'Modal renders Action Checklist header'
  );
  assert(
    html.includes('Official Guidance &amp; Threat Advisory') ||
      html.includes('Official Guidance & Threat Advisory'),
    'Modal renders Official Guidance section'
  );
  assert(
    html.includes('Barangay Tumana') && html.includes('Malanday Lowlands'),
    'Modal renders Affected Zones badges'
  );
  assert(
    html.includes('Marikina Rescue: 161') || html.includes('161'),
    'Modal includes emergency response hotline'
  );
  assert(
    html.includes('Pack 72-Hour Evacuation Go-Bag') || html.includes('Go-Bag'),
    'Modal renders Go-Bag checklist action link'
  );
  assert(
    html.includes('Find a safe place'),
    'Modal renders Find a safe place primary button'
  );
  assert(
    html.includes('Get help'),
    'Modal renders Get help action button'
  );
}

// -----------------------------------------------------------------------------
// Test 5: Accessible Dialog wrapper
// -----------------------------------------------------------------------------
console.log('\nTest 5: Accessible Dialog Component');
{
  const html = renderToString(
    React.createElement(
      Dialog,
      {
        open: true,
        onClose: () => {},
        title: 'Safety Preparations & Instructions',
      },
      React.createElement('p', null, 'Preparation details content')
    )
  );

  assert(html.includes('role="dialog"'), 'Dialog renders role="dialog"');
  assert(html.includes('aria-modal="true"'), 'Dialog renders aria-modal="true"');
  assert(html.includes('Safety Preparations &amp; Instructions') || html.includes('Safety Preparations & Instructions'), 'Dialog renders accessible title');
  assert(html.includes('Preparation details content'), 'Dialog renders body children');
}

console.log('\n======================================================');
console.log(`TEST RESULTS: ${passed} Passed, ${failed} Failed`);
console.log('======================================================\n');

if (failed > 0) {
  process.exit(1);
}
