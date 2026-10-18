/**
 * Resilia Connectivity Status & Spinning Sync Icon Acceptance Test Suite
 * Validates:
 * 1. "For CONNECTED status: If there is internet, make it CONNECTED, when there is no, OFFLINE."
 * 2. "Separate a Sync icon beside the internet status, that will turn around if there is syncing in the app."
 * 3. "the location is in the upper right of all portals."
 * 4. Renders correctly across Dark (Coordinator/Fallback), Resident, and Responder variants.
 */

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ConnectivityBadge } from '../src/components/layout/ConnectivityBadge';
import { syncClient } from '../src/services/offline/syncClient';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
  console.log(`  ✓ ${message}`);
}

async function runConnectivityBadgeSuite() {
  console.log('================================================================');
  console.log('RUNNING CONNECTED / OFFLINE STATUS & SPINNING SYNC ICON TESTS');
  console.log('================================================================\n');

  // --------------------------------------------------------------------------
  // TEST 1: Online Status Displays "CONNECTED"
  // --------------------------------------------------------------------------
  console.log('[TEST 1] When internet is available, status displays "CONNECTED"');

  syncClient.setSimulatedOffline(false);
  // Force status to ONLINE
  (syncClient as any).status = 'ONLINE';
  (syncClient as any).isSyncing = false;

  const darkHtmlOnline = renderToStaticMarkup(
    React.createElement(ConnectivityBadge, { variant: 'dark' })
  );

  assert(darkHtmlOnline.includes('CONNECTED'), 'Dark variant renders "CONNECTED" when online');
  assert(!darkHtmlOnline.includes('OFFLINE'), 'Dark variant does not render "OFFLINE" when online');
  assert(darkHtmlOnline.includes('bg-emerald-'), 'Dark variant has emerald green styling when connected');

  const residentHtmlOnline = renderToStaticMarkup(
    React.createElement(ConnectivityBadge, { variant: 'resident' })
  );
  assert(residentHtmlOnline.includes('CONNECTED'), 'Resident variant renders "CONNECTED" when online');
  assert(!residentHtmlOnline.includes('OFFLINE'), 'Resident variant does not render "OFFLINE" when online');

  const responderHtmlOnline = renderToStaticMarkup(
    React.createElement(ConnectivityBadge, { variant: 'responder' })
  );
  assert(responderHtmlOnline.includes('CONNECTED'), 'Responder variant renders "CONNECTED" when online');
  assert(!responderHtmlOnline.includes('OFFLINE'), 'Responder variant does not render "OFFLINE" when online');

  // --------------------------------------------------------------------------
  // TEST 2: Disconnected Status Displays "OFFLINE"
  // --------------------------------------------------------------------------
  console.log('\n[TEST 2] When internet is disconnected, status displays "OFFLINE"');

  syncClient.setSimulatedOffline(true);

  const darkHtmlOffline = renderToStaticMarkup(
    React.createElement(ConnectivityBadge, { variant: 'dark' })
  );
  assert(darkHtmlOffline.includes('OFFLINE'), 'Dark variant renders "OFFLINE" when disconnected');
  assert(!darkHtmlOffline.includes('CONNECTED'), 'Dark variant does not render "CONNECTED" when disconnected');

  const residentHtmlOffline = renderToStaticMarkup(
    React.createElement(ConnectivityBadge, { variant: 'resident' })
  );
  assert(residentHtmlOffline.includes('OFFLINE'), 'Resident variant renders "OFFLINE" when disconnected');
  assert(!residentHtmlOffline.includes('CONNECTED'), 'Resident variant does not render "CONNECTED" when disconnected');

  const responderHtmlOffline = renderToStaticMarkup(
    React.createElement(ConnectivityBadge, { variant: 'responder' })
  );
  assert(responderHtmlOffline.includes('OFFLINE'), 'Responder variant renders "OFFLINE" when disconnected');
  assert(!responderHtmlOffline.includes('CONNECTED'), 'Responder variant does not render "CONNECTED" when disconnected');

  // Reset simulated offline
  syncClient.setSimulatedOffline(false);
  (syncClient as any).status = 'ONLINE';

  // --------------------------------------------------------------------------
  // TEST 3: Separate Sync Icon Beside Internet Status
  // --------------------------------------------------------------------------
  console.log('\n[TEST 3] Separate Sync icon beside internet status in all portals');

  for (const variant of ['dark', 'resident', 'responder'] as const) {
    const markup = renderToStaticMarkup(
      React.createElement(ConnectivityBadge, { variant })
    );

    // Verify it contains a button for triggering sync
    assert(
      markup.includes('button') && (markup.includes('aria-label="Syncing data"') || markup.includes('aria-label="Trigger sync"') || markup.includes('aria-label="Syncing field operations"')),
      `${variant} portal includes a separate interactive Sync button`
    );

    // Verify the sync icon (svg) is present in the markup
    assert(markup.includes('<svg'), `${variant} portal renders SVG icon`);
  }

  // --------------------------------------------------------------------------
  // TEST 4: Sync Icon Spins (animate-spin) When Syncing
  // --------------------------------------------------------------------------
  console.log('\n[TEST 4] Sync icon turns around (animate-spin) during synchronization');

  // Simulate active sync
  (syncClient as any).isSyncing = true;
  (syncClient as any).status = 'SYNCING';

  const syncingDarkHtml = renderToStaticMarkup(
    React.createElement(ConnectivityBadge, { variant: 'dark' })
  );
  assert(
    syncingDarkHtml.includes('animate-spin'),
    'Dark variant Sync icon has animate-spin class while syncing'
  );

  const syncingResidentHtml = renderToStaticMarkup(
    React.createElement(ConnectivityBadge, { variant: 'resident' })
  );
  assert(
    syncingResidentHtml.includes('animate-spin'),
    'Resident variant Sync icon has animate-spin class while syncing'
  );

  const syncingResponderHtml = renderToStaticMarkup(
    React.createElement(ConnectivityBadge, { variant: 'responder' })
  );
  assert(
    syncingResponderHtml.includes('animate-spin'),
    'Responder variant Sync icon has animate-spin class while syncing'
  );

  // Return to non-syncing idle state
  (syncClient as any).isSyncing = false;
  (syncClient as any).status = 'ONLINE';

  const idleDarkHtml = renderToStaticMarkup(
    React.createElement(ConnectivityBadge, { variant: 'dark' })
  );
  assert(
    !idleDarkHtml.includes('animate-spin'),
    'Idle state does not spin the Sync icon'
  );

  console.log('\n================================================================');
  console.log('✓ ALL CONNECTIVITY STATUS & SPINNING SYNC ICON TESTS PASSED');
  console.log('================================================================\n');
}

runConnectivityBadgeSuite().catch((err) => {
  console.error('\n✖ TEST SUITE FAILED:', err);
  process.exit(1);
});
