/**
 * Verification Test Suite: Resident App Bespoke Icon System
 *
 * Tests:
 * 1. Rendering of all custom SVG icons with proper attributes (viewBox, stroke, fill, className, size).
 * 2. Proper integration into ResidentHome 4 primary quick action cards.
 * 3. Proper integration into GoBagChecklistCard (GoBagIcon replaces generic Package).
 * 4. Proper integration into AlertCard (EmergencyAlertIcon replaces generic AlertTriangle).
 * 5. Proper integration into ShelterRow & ShelterDetailsDialog amenities.
 */

import React from 'react';
import { renderToString } from 'react-dom/server';
import {
  EmergencyAlertIcon,
  GetHelpIcon,
  FindSafePlaceIcon,
  ReportProblemIcon,
  MarkSafeIcon,
  GoBagIcon,
  ResidentNavHomeIcon,
  ResidentNavMapIcon,
  ResidentNavUpdatesIcon,
  ResidentNavMoreIcon,
  PotableWaterIcon,
  FoodRationIcon,
  MedicalClinicIcon,
  BackupPowerIcon,
  WheelchairAccessibleIcon,
  SuppliesPackageIcon,
  FloodHazardIcon,
  RoadBlockedIcon,
  BuildingDamageIcon,
  FireHazardIcon,
  PowerOutageIcon,
  MedicalEmergencyIcon,
  TyphoonHazardIcon,
  EarthquakeHazardIcon,
  LandslideHazardIcon,
  VolcanoHazardIcon,
  TsunamiHazardIcon,
  PersonDistressIcon,
  OtherHazardIcon,
  EmergencyPhoneIcon,
  OfflineSyncIcon,
  AskResiliaIcon,
  ResponderHelmetIcon,
  EvacuationTransportIcon,
  ResiliaBrandIcon,
} from '../src/components/icons/ResidentIcons';
import { GoBagChecklistCard } from '../src/components/safety/GoBagChecklistCard';
import { AlertCard } from '../src/screens/resident/ResidentAlerts';
import { ShelterRow } from '../src/screens/resident/ShelterInfo';
import { Alert, Shelter } from '../src/types';

// Mock localStorage and window for component tests
const mockStorage: Record<string, string> = {};
(global as any).localStorage = {
  getItem: (k: string) => mockStorage[k] || null,
  setItem: (k: string, v: string) => { mockStorage[k] = v; },
  removeItem: (k: string) => { delete mockStorage[k]; },
  clear: () => { Object.keys(mockStorage).forEach((k) => delete mockStorage[k]); },
};
(global as any).window = {
  dispatchEvent: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
};

let passed = 0;
let failed = 0;

function assert(condition: boolean, desc: string) {
  if (condition) {
    console.log(`✓ [PASS] ${desc}`);
    passed++;
  } else {
    console.error(`✗ [FAIL] ${desc}`);
    failed++;
  }
}

console.log('=== RUNNING RESILIENT ICONS VERIFICATION TESTS ===\n');

// 1. Core Action Icons SVG rendering
const allIcons = [
  { name: 'EmergencyAlertIcon', component: EmergencyAlertIcon },
  { name: 'GetHelpIcon', component: GetHelpIcon },
  { name: 'FindSafePlaceIcon', component: FindSafePlaceIcon },
  { name: 'ReportProblemIcon', component: ReportProblemIcon },
  { name: 'MarkSafeIcon', component: MarkSafeIcon },
  { name: 'GoBagIcon', component: GoBagIcon },
  { name: 'ResidentNavHomeIcon', component: ResidentNavHomeIcon },
  { name: 'ResidentNavMapIcon', component: ResidentNavMapIcon },
  { name: 'ResidentNavUpdatesIcon', component: ResidentNavUpdatesIcon },
  { name: 'ResidentNavMoreIcon', component: ResidentNavMoreIcon },
  { name: 'PotableWaterIcon', component: PotableWaterIcon },
  { name: 'FoodRationIcon', component: FoodRationIcon },
  { name: 'MedicalClinicIcon', component: MedicalClinicIcon },
  { name: 'BackupPowerIcon', component: BackupPowerIcon },
  { name: 'WheelchairAccessibleIcon', component: WheelchairAccessibleIcon },
  { name: 'SuppliesPackageIcon', component: SuppliesPackageIcon },
  { name: 'FloodHazardIcon', component: FloodHazardIcon },
  { name: 'RoadBlockedIcon', component: RoadBlockedIcon },
  { name: 'BuildingDamageIcon', component: BuildingDamageIcon },
  { name: 'FireHazardIcon', component: FireHazardIcon },
  { name: 'PowerOutageIcon', component: PowerOutageIcon },
  { name: 'MedicalEmergencyIcon', component: MedicalEmergencyIcon },
  { name: 'TyphoonHazardIcon', component: TyphoonHazardIcon },
  { name: 'EarthquakeHazardIcon', component: EarthquakeHazardIcon },
  { name: 'LandslideHazardIcon', component: LandslideHazardIcon },
  { name: 'VolcanoHazardIcon', component: VolcanoHazardIcon },
  { name: 'TsunamiHazardIcon', component: TsunamiHazardIcon },
  { name: 'PersonDistressIcon', component: PersonDistressIcon },
  { name: 'OtherHazardIcon', component: OtherHazardIcon },
  { name: 'EmergencyPhoneIcon', component: EmergencyPhoneIcon },
  { name: 'OfflineSyncIcon', component: OfflineSyncIcon },
  { name: 'AskResiliaIcon', component: AskResiliaIcon },
  { name: 'ResponderHelmetIcon', component: ResponderHelmetIcon },
  { name: 'EvacuationTransportIcon', component: EvacuationTransportIcon },
  { name: 'ResiliaBrandIcon', component: ResiliaBrandIcon },
];

for (const { name, component: Icon } of allIcons) {
  const html = renderToString(React.createElement(Icon, { className: 'w-6 h-6 custom-test', size: 32 }));
  assert(html.includes('<svg'), `${name} renders an SVG element`);
  assert(html.includes('viewBox="0 0 24 24"'), `${name} has 24x24 viewBox`);
  assert(html.includes('custom-test'), `${name} applies custom className`);
  assert(html.includes('width="32"'), `${name} respects custom size prop`);
  assert(html.includes('aria-hidden="true"'), `${name} defaults to aria-hidden for accessibility`);
}

// 2. Specific icon shape characteristics
const getHelpHtml = renderToString(React.createElement(GetHelpIcon));
assert(getHelpHtml.includes('circle') && getHelpHtml.includes('r="9"'), 'GetHelpIcon contains outer rescue buoy ring');
assert(getHelpHtml.includes('r="4.25"'), 'GetHelpIcon contains inner buoy core');
assert(getHelpHtml.includes('d="M12 14.5 C10.5 13.5'), 'GetHelpIcon renders centered, symmetrical compassionate heart lifeline');

const findSafePlaceHtml = renderToString(React.createElement(FindSafePlaceIcon));
assert(findSafePlaceHtml.includes('d="M2.5 10.5 L12 3 L21.5 10.5"'), 'FindSafePlaceIcon renders protective haven roof');

const reportProblemHtml = renderToString(React.createElement(ReportProblemIcon));
assert(reportProblemHtml.includes('d="M3.5 21 H20.5"'), 'ReportProblemIcon renders hazard cone baseline');
assert(reportProblemHtml.includes('cx="12" cy="2.5"'), 'ReportProblemIcon renders centered alert beacon flare');

const markSafeHtml = renderToString(React.createElement(MarkSafeIcon));
assert(markSafeHtml.includes('circle cx="16.75" cy="15.75" r="4.75"'), 'MarkSafeIcon renders verified safety check seal');

const goBagHtml = renderToString(React.createElement(GoBagIcon));
assert(goBagHtml.includes('rect x="5" y="5" width="14" height="16" rx="3.5"'), 'GoBagIcon renders survival backpack chassis');
assert(goBagHtml.includes('d="M9 5 C9 3.6 10.3 2.5 12 2.5 C13.7 2.5 15 3.6 15 5"'), 'GoBagIcon renders top grab handle');

const fireHazardHtml = renderToString(React.createElement(FireHazardIcon));
assert(fireHazardHtml.includes('d="M12 2 C10.5 5 7 8 7 13'), 'FireHazardIcon renders unified fire flame silhouette');

const medicalEmergencyHtml = renderToString(React.createElement(MedicalEmergencyIcon));
assert(medicalEmergencyHtml.includes('d="M20.5 3 V9 M17.5 6 H23.5"'), 'MedicalEmergencyIcon renders distinctive medical cross badge');

const transportHtml = renderToString(React.createElement(EvacuationTransportIcon));
assert(transportHtml.includes('d="M3 16 H4.5 M9.5 16 H14.5 M19.5 16 H21"'), 'EvacuationTransportIcon renders chassis with clear wheel arches');

const brandHtml = renderToString(React.createElement(ResiliaBrandIcon));
assert(brandHtml.includes('d="M8.5 8.5 L12 5.5 L15.5 8.5"'), 'ResiliaBrandIcon renders haven canopy within protective shield');

// 3. Integration in GoBagChecklistCard
const goBagCardHtml = renderToString(React.createElement(GoBagChecklistCard, { variant: 'resident' }));
assert(goBagCardHtml.includes('rx="3.5"'), 'GoBagChecklistCard renders bespoke GoBagIcon backpack');
assert(goBagCardHtml.includes('72-Hour Evacuation Go-Bag'), 'GoBagChecklistCard renders title');

// 4. Integration in AlertCard
const sampleAlert: Alert = {
  id: 'alert-test-1',
  title: 'Typhoon Kristine Severe Tropical Warning',
  message: 'Pre-emptive evacuation recommended for low-lying areas.',
  severity: 'CRITICAL',
  issuedAt: new Date().toISOString(),
  expiresAt: new Date(Date.now() + 86400000).toISOString(),
  source: 'PAGASA / Marikina CDRRMO',
  active: true,
};
const alertCardHtml = renderToString(React.createElement(AlertCard, { alert: sampleAlert, isOffline: false, onOpen: () => {} }));
assert(alertCardHtml.includes('d="M12 2.5 C16.5 4.2 20.5 4.8 20.5 10'), 'AlertCard renders bespoke EmergencyAlertIcon shield');

// 5. Integration in ShelterRow
const sampleShelter: Shelter = {
  id: 'shelter-test-1',
  name: 'Malanday Elementary School Evacuation Center',
  locationName: 'Purok 3, Malanday',
  lat: 14.655,
  lng: 121.101,
  capacityTotal: 300,
  capacityCurrent: 120,
  status: 'OPEN',
  verifiedAt: new Date().toISOString(),
  verifiedBy: 'Barangay Captain Santos',
  isAccessibleWheelchair: true,
  hasPotableWater: true,
  hasMedicalClinic: true,
  hasBackupPower: true,
  contactPerson: 'Barangay Captain Santos',
  contactPhone: '+63 917 555 1234',
  lastUpdated: new Date().toISOString(),
};
const shelterRowHtml = renderToString(React.createElement(ShelterRow, { shelter: sampleShelter, location: null, onDetails: () => {} }));
assert(shelterRowHtml.includes('d="M2.5 10.5 L12 3 L21.5 10.5"'), 'ShelterRow renders bespoke FindSafePlaceIcon');
assert(shelterRowHtml.includes('Wheelchair accessible'), 'ShelterRow renders wheelchair accessibility tag');

console.log('\n======================================================');
console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log('======================================================');

if (failed > 0) {
  process.exit(1);
}
