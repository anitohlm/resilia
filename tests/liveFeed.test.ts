/**
 * Resilia Disaster Coordinator Live Feed Acceptance Test Suite
 * Validates:
 * 1. Default telemetry and sensor baseline contracts
 * 2. DOST-PAGASA rainfall classification (Light, Moderate, Heavy, Intense, Torrential)
 * 3. DOST-PAGASA rainfall advisory levels (Normal, Yellow, Orange, Red)
 * 4. Merging live operational events (incidents, assistance, missions, alerts) into feed
 * 5. Telemetry polling, realistic jitter, and threshold surge detection
 * 6. Local storage offline persistence & retrieval
 * 7. Simulated drill bulletin injection & coordinator recommendations
 */

import { LiveFeedService, DEFAULT_TELEMETRY, DEFAULT_FEED_ITEMS } from '../src/services/telemetry/liveFeedService';
import { Alert, AssistanceRequest, Incident, Mission, User } from '../src/types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
  console.log(`  ✓ ${message}`);
}

async function runLiveFeedAcceptanceSuite() {
  console.log('=== RUNNING RESILIA DISASTER COORDINATOR LIVE FEED TESTS ===\n');

  // TEST 1: Default Telemetry Baseline
  console.log('[TEST 1] Default Environmental Telemetry Baseline');
  const base = { ...DEFAULT_TELEMETRY };
  assert(base.rainfallIntensityMmHr === 38.5, 'Rainfall intensity baseline is 38.5 mm/hr');
  assert(base.rainfallCategory === 'TORRENTIAL', 'Rainfall classified as TORRENTIAL');
  assert(base.rainfallAdvisoryLevel === 'RED', 'Rainfall advisory level is RED');
  assert(base.windSpeedKph === 68, 'Wind speed baseline is 68 km/h');
  assert(base.windGustKph === 95, 'Wind gust baseline is 95 km/h');
  assert(base.atmosphericPressureHpa === 992.4, 'Barometric pressure baseline is 992.4 hPa');
  assert(base.tcwsSignalLevel === 3, 'TCWS Wind Signal is #3');
  assert(base.riverWaterLevelMeters === 16.8, 'Marikina River baseline is 16.8 meters');
  assert(base.riverAlertLevel === 2, 'River alert stage is Level 2 (Warning / Pre-emptive Evacuation)');
  assert(base.radarStatus === 'ONLINE', 'Tagaytay Doppler Radar status is ONLINE');
  assert(base.radarReflectivityDbz === 54, 'Doppler radar reflectivity is 54 dBZ');

  // TEST 2: DOST-PAGASA Rainfall Classification Standards
  console.log('\n[TEST 2] DOST-PAGASA Rainfall Classification Standards');
  assert(LiveFeedService.classifyRainfall(0) === 'NONE', '0 mm/hr classified as NONE');
  assert(LiveFeedService.classifyRainfall(1.5) === 'LIGHT', '1.5 mm/hr classified as LIGHT (<2.5)');
  assert(LiveFeedService.classifyRainfall(5.0) === 'MODERATE', '5.0 mm/hr classified as MODERATE (2.5-7.5)');
  assert(LiveFeedService.classifyRainfall(12.0) === 'HEAVY', '12.0 mm/hr classified as HEAVY (7.5-15)');
  assert(LiveFeedService.classifyRainfall(22.5) === 'INTENSE', '22.5 mm/hr classified as INTENSE (15-30)');
  assert(LiveFeedService.classifyRainfall(35.0) === 'TORRENTIAL', '35.0 mm/hr classified as TORRENTIAL (>30)');

  // TEST 3: DOST-PAGASA Color-Coded Rainfall Advisory Levels
  console.log('\n[TEST 3] DOST-PAGASA Color-Coded Advisory Levels');
  assert(LiveFeedService.classifyRainfallAdvisory(4.0) === 'NORMAL', '4.0 mm/hr is NORMAL advisory');
  assert(LiveFeedService.classifyRainfallAdvisory(8.5) === 'YELLOW', '8.5 mm/hr triggers YELLOW advisory (7.5-15 mm/hr)');
  assert(LiveFeedService.classifyRainfallAdvisory(18.0) === 'ORANGE', '18.0 mm/hr triggers ORANGE advisory (15-30 mm/hr)');
  assert(LiveFeedService.classifyRainfallAdvisory(45.0) === 'RED', '45.0 mm/hr triggers RED advisory (>30 mm/hr)');

  // TEST 4: Synthesis & Merging of Live Operational State
  console.log('\n[TEST 4] Merging Live Operational State into Live Intelligence Feed');
  const mockIncidents: Incident[] = [
    {
      id: 'inc_test_flood',
      type: 'FLOOD',
      severity: 'CRITICAL',
      status: 'VERIFIED',
      title: 'Waist-Deep Flood Waters on Malanday Riverside',
      description: 'Water level breached residential pathway.',
      locationName: 'Purok 2, Malanday',
      lat: 14.658,
      lng: 121.095,
      floodDepthCm: 110,
      reporterId: 'usr_1',
      reporterName: 'Resident Kagawad',
      reporterRole: 'RESIDENT',
      verificationRationale: 'Confirmed by drone reconnaissance.',
      verifiedAt: new Date().toISOString(),
      verifiedBy: 'Coordinator Maria',
      supportingReportsCount: 2,
      contradictingReportsCount: 0,
      createdAt: new Date().toISOString(),
    },
  ];

  const mockRequests: AssistanceRequest[] = [
    {
      id: 'req_test_wheelchair',
      residentId: 'res_1',
      residentName: 'Tatay Ramon (78yo)',
      contactPhone: '09201113333',
      locationName: 'Tumana Dike St.',
      lat: 14.651,
      lng: 121.101,
      category: 'EMERGENCY_RESCUE',
      priority: 'CRITICAL',
      priorityScore: 95,
      priorityRationale: ['Wheelchair user', 'Senior citizen'],
      status: 'PENDING',
      peopleCount: 3,
      vulnerabilityNeeds: {
        wheelchairUser: true,
        elderlyCount: 1,
        infantCount: 0,
        bedridden: false,
        medicalNeeds: [],
      },
      description: 'Wheelchair user trapped on ground floor.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const mockMissions: Mission[] = [
    {
      id: 'mis_test_boat',
      assistanceRequestId: 'req_test_wheelchair',
      title: 'Deploy Rescue Boat Alpha to Malanday',
      priority: 'CRITICAL',
      rationale: 'Evacuate elderly resident.',
      destinationLocation: 'Purok 2, Malanday',
      pickupLocation: 'Purok 1 Base',
      lat: 14.658,
      lng: 121.095,
      requestedAssistance: 'RESCUE',
      vulnerabilitySummary: 'Elderly',
      assignedResponderId: 'resp_1',
      assignedResponderName: 'Officer Juan',
      assignedVehicleType: 'Motorized Rubber Boat 161',
      status: 'IN_PROGRESS',
      statusHistory: [],
      evidenceRecordIds: [],
      requiresHumanApproval: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const { telemetry: mergedTelemetry, feedItems: mergedItems } = LiveFeedService.getMergedFeed({
    incidents: mockIncidents,
    assistanceRequests: mockRequests,
    missions: mockMissions,
  });

  assert(mergedItems.length >= DEFAULT_FEED_ITEMS.length + 3, 'Merged feed contains default bulletins plus synthesized operational items');

  const opsIncident = mergedItems.find((i) => i.id === 'ops_inc_inc_test_flood');
  assert(Boolean(opsIncident), 'Synthesized operational incident item found in feed');
  assert(opsIncident?.source === 'FIELD_OPS', 'Incident item source is FIELD_OPS');
  assert(opsIncident?.category === 'FIELD_OPS', 'Incident item category is FIELD_OPS');
  assert(Boolean(opsIncident?.title.includes('Waist-Deep Flood Waters')), 'Incident item title accurately preserved');

  const opsRequest = mergedItems.find((i) => i.id === 'ops_req_req_test_wheelchair');
  assert(Boolean(opsRequest), 'Synthesized priority rescue signal item found in feed');
  assert(opsRequest?.severity === 'CRITICAL', 'Rescue request severity is CRITICAL');
  assert(Boolean(opsRequest?.summary.includes('Tatay Ramon')), 'Rescue request summary references resident name');

  const opsMission = mergedItems.find((i) => i.id === 'ops_mis_mis_test_boat');
  assert(Boolean(opsMission), 'Synthesized active mission item found in feed');
  assert(Boolean(opsMission?.summary.includes('Motorized Rubber Boat 161')), 'Mission item references assigned vehicle asset');

  // TEST 5: Telemetry Polling, Realistic Jitter, and Alert Thresholds
  console.log('\n[TEST 5] Telemetry Polling & Dynamic Variations');
  const polled = LiveFeedService.pollFreshTelemetry(base);
  assert(typeof polled.telemetry.rainfallIntensityMmHr === 'number', 'Polled rainfall intensity is a valid number');
  assert(typeof polled.telemetry.windSpeedKph === 'number', 'Polled wind speed is a valid number');
  assert(typeof polled.telemetry.riverWaterLevelMeters === 'number', 'Polled river water level is a valid number');
  assert(polled.telemetry.riverWaterLevelMeters >= 12.0 && polled.telemetry.riverWaterLevelMeters <= 21.0, 'River water level within physiological range');
  assert(polled.telemetry.atmosphericPressureHpa >= 920 && polled.telemetry.atmosphericPressureHpa <= 1015, 'Atmospheric pressure bounded in safe meteorological range');
  assert(['RAPIDLY_DROPPING', 'STEADY', 'RISING'].includes(polled.telemetry.pressureTrend), 'Pressure trend is valid enum value');

  // Multi-iteration polling stability test
  let iteratedTelemetry = { ...base };
  for (let i = 0; i < 50; i++) {
    const res = LiveFeedService.pollFreshTelemetry(iteratedTelemetry);
    iteratedTelemetry = res.telemetry;
  }
  assert(!isNaN(iteratedTelemetry.windGustKph), 'Repeated polling does not produce NaN gust speed');
  assert(iteratedTelemetry.atmosphericPressureHpa >= 920 && iteratedTelemetry.atmosphericPressureHpa <= 1015, 'Multi-step polling keeps pressure within [920, 1015] hPa');

  // TEST 6: Simulated Drill Injection & Recommendations
  console.log('\n[TEST 6] Simulated Drill Bulletin Injection');
  const drillItem = LiveFeedService.injectSimulatedBulletin({
    source: 'PAGASA',
    category: 'WEATHER',
    severity: 'CRITICAL',
    title: 'DRILL: Severe Squall Line Approaching Marikina',
    summary: 'Cloudburst simulation for disaster coordinator drill.',
    actionRecommendation: 'Test public address megaphone broadcast.',
  });

  assert(drillItem.isSimulated === true, 'Drill bulletin flagged with isSimulated = true');
  assert(drillItem.title.includes('DRILL'), 'Drill title preserved');
  assert(drillItem.actionRecommendation === 'Test public address megaphone broadcast.', 'Coordinator action recommendation preserved');

  const storedAfterDrill = LiveFeedService.getStoredFeedItems();
  const foundDrill = storedAfterDrill.find((i) => i.id === drillItem.id);
  assert(Boolean(foundDrill), 'Injected drill bulletin persisted into stored feed items');

  // TEST 7: Reset to Defaults
  console.log('\n[TEST 7] Reset Feed to Defaults');
  const resetResult = LiveFeedService.resetToDefaults();
  assert(resetResult.feedItems.length === DEFAULT_FEED_ITEMS.length, 'Reset restored baseline feed item count');
  assert(resetResult.telemetry.riverWaterLevelMeters === 16.8, 'Reset restored river level to 16.8m');

  // TEST 8: Marikina River Multi-Tier Alarm Derivation
  console.log('\n[TEST 8] Marikina River Multi-Tier Alarm Classification');
  assert(LiveFeedService.classifyRiverAlertLevel(14.2) === 0, '14.2m classified as Alert Level 0 (Normal Flow)');
  assert(LiveFeedService.classifyRiverAlertLevel(14.99) === 0, '14.99m classified as Alert Level 0 (Normal Flow)');
  assert(LiveFeedService.classifyRiverAlertLevel(15.0) === 1, '15.0m classified as Alert Level 1 (1st Alarm - Alert)');
  assert(LiveFeedService.classifyRiverAlertLevel(15.99) === 1, '15.99m classified as Alert Level 1 (1st Alarm - Alert)');
  assert(LiveFeedService.classifyRiverAlertLevel(16.0) === 2, '16.0m classified as Alert Level 2 (2nd Alarm - Warning)');
  assert(LiveFeedService.classifyRiverAlertLevel(17.99) === 2, '17.99m classified as Alert Level 2 (2nd Alarm - Warning)');
  assert(LiveFeedService.classifyRiverAlertLevel(18.0) === 3, '18.0m classified as Alert Level 3 (3rd Alarm - Forced Evacuation)');
  assert(LiveFeedService.classifyRiverAlertLevel(20.5) === 3, '20.5m classified as Alert Level 3 (3rd Alarm - Forced Evacuation)');

  // TEST 9: Edge Case Boundaries on Rainfall
  console.log('\n[TEST 9] Edge Cases: Negative & Exact Threshold Rainfall');
  assert(LiveFeedService.classifyRainfall(-5) === 'NONE', 'Negative rainfall classified as NONE');
  assert(LiveFeedService.classifyRainfall(0) === 'NONE', '0 mm/hr classified as NONE');
  assert(LiveFeedService.classifyRainfall(2.5) === 'MODERATE', 'Exact 2.5 mm/hr boundary is MODERATE');
  assert(LiveFeedService.classifyRainfall(7.5) === 'HEAVY', 'Exact 7.5 mm/hr boundary is HEAVY');
  assert(LiveFeedService.classifyRainfall(15.0) === 'INTENSE', 'Exact 15.0 mm/hr boundary is INTENSE');
  assert(LiveFeedService.classifyRainfall(30.0) === 'TORRENTIAL', 'Exact 30.0 mm/hr boundary is TORRENTIAL');

  // TEST 10: Operational Filter Guards (Resolved Incidents & Exercise Alerts)
  console.log('\n[TEST 10] Operational State Filtering & Simulation Flagging');
  const incidentsWithResolved: Incident[] = [
    {
      id: 'inc_resolved_1',
      type: 'ROAD_BLOCKED',
      severity: 'CRITICAL',
      status: 'RESOLVED',
      title: 'Resolved Landslide Cleaned',
      description: 'Debris completely cleared.',
      locationName: 'Purok 9',
      lat: 14.65,
      lng: 121.1,
      reporterId: 'usr_2',
      reporterName: 'Tanod',
      reporterRole: 'RESPONDER',
      supportingReportsCount: 1,
      contradictingReportsCount: 0,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'inc_rejected_1',
      type: 'FIRE',
      severity: 'CRITICAL',
      status: 'CONTRADICTED',
      title: 'False Alarm Fire',
      description: 'Cooking smoke only.',
      locationName: 'Purok 8',
      lat: 14.65,
      lng: 121.1,
      reporterId: 'usr_3',
      reporterName: 'Tanod 2',
      reporterRole: 'RESPONDER',
      supportingReportsCount: 0,
      contradictingReportsCount: 2,
      createdAt: new Date().toISOString(),
    },
  ];

  const exerciseAlert: Alert = {
    id: 'alt_drill_99',
    title: 'Drill Alert: Simulated Flood Evacuation',
    message: 'Test message for community drill exercise.',
    source: 'DOST-PAGASA NCR Weather Station',
    issuedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 3600000).toISOString(),
    active: true,
    severity: 'WARNING',
    isExercise: true,
  };

  const activeMissions: Mission[] = [
    {
      id: 'mis_assigned_1',
      assistanceRequestId: 'req_test_wheelchair',
      title: 'Assigned Evacuation Boat',
      priority: 'HIGH',
      rationale: 'Active deployment',
      destinationLocation: 'Purok 3',
      pickupLocation: 'Base',
      lat: 14.65,
      lng: 121.1,
      requestedAssistance: 'EVACUATION',
      vulnerabilitySummary: 'None',
      assignedResponderId: 'resp_2',
      assignedResponderName: 'Sgt. Dalisay',
      assignedVehicleType: 'Rubber Boat 102',
      status: 'ASSIGNED',
      statusHistory: [],
      evidenceRecordIds: [],
      requiresHumanApproval: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const filteredFeed = LiveFeedService.getMergedFeed({
    incidents: incidentsWithResolved,
    alerts: [exerciseAlert],
    missions: activeMissions,
  });

  const resolvedInFeed = filteredFeed.feedItems.find((i) => i.id === 'ops_inc_inc_resolved_1');
  assert(!resolvedInFeed, 'Resolved incidents correctly excluded from live operational feed');

  const rejectedInFeed = filteredFeed.feedItems.find((i) => i.id === 'ops_inc_inc_rejected_1');
  assert(!rejectedInFeed, 'Contradicted/rejected incidents correctly excluded from live operational feed');

  const alertItem = filteredFeed.feedItems.find((i) => i.id === 'ops_alt_alt_drill_99');
  assert(Boolean(alertItem), 'Exercise alert present in feed');
  assert(alertItem?.isSimulated === true, 'Exercise alert correctly flagged with isSimulated = true');
  assert(alertItem?.source === 'PAGASA', 'PAGASA alert correctly mapped to PAGASA source');
  assert(alertItem?.category === 'WEATHER', 'PAGASA alert correctly mapped to WEATHER category');

  const assignedMissionInFeed = filteredFeed.feedItems.find((i) => i.id === 'ops_mis_mis_assigned_1');
  assert(Boolean(assignedMissionInFeed), 'Assigned active mission successfully included in feed items');

  // TEST 11: Trusted Weather Sources Directory & Verification Flags
  console.log('\n[TEST 11] Trusted Weather & Sensor Telemetry Sources Registry');
  const trustedSources = LiveFeedService.getTrustedWeatherSources();
  assert(trustedSources.length >= 7, 'At least 7 trusted weather and sensor agencies registered');

  const pagasaSource = trustedSources.find((s) => s.id === 'PAGASA');
  assert(Boolean(pagasaSource), 'DOST-PAGASA registered as trusted weather source');
  assert(pagasaSource?.verified === true, 'DOST-PAGASA is verified');
  assert(Boolean(pagasaSource?.attributionUrl), 'DOST-PAGASA has attribution URL');

  const openMeteoSource = trustedSources.find((s) => s.id === 'OPEN_METEO');
  assert(Boolean(openMeteoSource), 'Open-Meteo registered as trusted WMO telemetry source');
  assert(openMeteoSource?.verified === true, 'Open-Meteo is verified');
  assert(Boolean(openMeteoSource?.endpointUrl), 'Open-Meteo has live API endpoint URL');

  const efcosSource = trustedSources.find((s) => s.id === 'EFCOS_MARIKINA');
  assert(Boolean(efcosSource), 'MMDA EFCOS registered as trusted river telemetry source');
  assert(efcosSource?.verified === true, 'MMDA EFCOS is verified');

  const jtwcSource = trustedSources.find((s) => s.id === 'JTWC');
  assert(Boolean(jtwcSource), 'JTWC registered as trusted cyclone track source');
  assert(jtwcSource?.verified === true, 'JTWC is verified');

  // TEST 12: WMO Weather Interpretation Code Mapping
  console.log('\n[TEST 12] WMO Meteorological Code Translation');
  assert(LiveFeedService.mapWmoWeatherCode(0) === 'Clear Sky', 'Code 0 mapped to Clear Sky');
  assert(LiveFeedService.mapWmoWeatherCode(65) === 'Heavy Rain Precipitation', 'Code 65 mapped to Heavy Rain Precipitation');
  assert(LiveFeedService.mapWmoWeatherCode(82) === 'Violent Rain Showers', 'Code 82 mapped to Violent Rain Showers');
  assert(LiveFeedService.mapWmoWeatherCode(95) === 'Severe Thunderstorm', 'Code 95 mapped to Severe Thunderstorm');
  assert(LiveFeedService.mapWmoWeatherCode(99) === 'Thunderstorm with Heavy Hail', 'Code 99 mapped to Thunderstorm with Heavy Hail');

  // TEST 13: Live Weather Ingestion & Offline Fallback
  console.log('\n[TEST 13] Live Weather Ingestion & Offline Resilience');
  const liveResult = await LiveFeedService.fetchLiveWeatherFeed({ lat: 14.6507, lng: 121.1029 });
  assert(Boolean(liveResult.telemetry), 'Telemetry returned from live weather fetch');
  assert(typeof liveResult.telemetry.rainfallIntensityMmHr === 'number', 'Valid rainfall intensity returned');
  assert(['NETWORK', 'CACHE'].includes(liveResult.source), 'Source flag accurately set to NETWORK or CACHE');

  // TEST 14: Feed Items Verification Attributes & Multi-Source Coverage
  console.log('\n[TEST 14] Trusted Source Feed Items Verification Attributes');
  const defaultItems = LiveFeedService.getStoredFeedItems();
  const pagasaItems = defaultItems.filter((i) => i.source === 'PAGASA');
  assert(pagasaItems.length >= 2, 'PAGASA bulletins (severe bulletin + rainfall warning) present');
  assert(pagasaItems.every((i) => i.isVerifiedSource === true), 'PAGASA bulletins flagged as verified sources');

  const openMeteoItems = defaultItems.filter((i) => i.source === 'OPEN_METEO');
  assert(openMeteoItems.length >= 1, 'Open-Meteo real-time telemetry items present');
  assert(openMeteoItems[0].isVerifiedSource === true, 'Open-Meteo item flagged as verified source');
  assert(openMeteoItems[0].reliabilityScore === 0.99, 'Open-Meteo item has 0.99 reliability score');

  const jtwcItems = defaultItems.filter((i) => i.source === 'JTWC');
  assert(jtwcItems.length >= 1, 'JTWC tropical cyclone warning present');
  assert(jtwcItems[0].isVerifiedSource === true, 'JTWC item flagged as verified source');

  console.log('\n=== ALL RESILIA DISASTER LIVE FEED TESTS PASSED ===');
}

runLiveFeedAcceptanceSuite().catch((err) => {
  console.error(err);
  process.exit(1);
});
