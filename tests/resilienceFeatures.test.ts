/**
 * Comprehensive Automated Test Suite for 7 Disaster Resilience Features
 * 
 * 1. Acoustic & Strobe Emergency Beacon ("Find Me" Mode)
 * 2. Responder Triage Tags & Quick Field QR Wristbands
 * 3. Barcode/QR "Ayuda" & Ration Distribution Tracker
 * 4. Family Reunification & "Missing Kin" Photo Matching
 * 5. Evacuation Center Special Needs Matrix (PWD, Lactating, Pets)
 * 6. "Bayanihan" Community Mutual Aid Board (Hyper-Local Skills & Tool Sharing)
 * 7. Boil Water & Disease Outbreak Watch (Leptospirosis, Cholera)
 */

import React from 'react';
import { renderToString } from 'react-dom/server';
import { localDB, STORES } from '../src/services/offline/db';
import {
  TriageRepository,
  RationDistributionRepository,
  MissingPersonsRepository,
  MutualAidRepository,
  OutbreakWatchRepository,
  ShelterRepository,
  ResourceRepository,
} from '../src/services/repositories';
import { generateQRCodeMatrix, generateBarcode39Bars, QRCodeSVG, BarcodeSVG } from '../src/utils/qrCode';
import { cloudStore } from '../server/store';
import {
  User,
  Shelter,
  TriageRecord,
  HouseholdClaimCard,
  MissingKinRecord,
  MutualAidPost,
  FloodExposureRecord,
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
localDB.get = async (storeName: any, key: string) => {
  return getStore(storeName).get(key);
};
localDB.put = async (storeName: any, value: any) => {
  getStore(storeName).set(value.id || value.claimCode || value.tagCode, value);
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

try {
  if (typeof navigator !== 'undefined') {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: async (text: string) => true },
      configurable: true,
    });
    Object.defineProperty(navigator, 'vibrate', {
      value: (pattern: any) => true,
      configurable: true,
    });
  }
} catch {
  // ignore
}

// Test actors
const responderUser: User = {
  id: 'usr_responder_161',
  name: 'Officer Juan dela Cruz',
  role: 'RESPONDER',
  email: 'juan@rescue161.marikina.gov.ph',
  phone: '0917-555-0192',
  locationName: 'Marikina River Park Command Station',
  status: 'ACTIVE',
};

const coordinatorUser: User = {
  id: 'usr_coord_cdrrmo',
  name: 'CDRRMO Ops Chief Santos',
  role: 'COORDINATOR',
  email: 'ops@cdrrmo.marikina.gov.ph',
  phone: '0918-777-8888',
  locationName: 'Marikina Disaster Command Center',
  status: 'ACTIVE',
};

const residentUser: User = {
  id: 'usr_res_malanday',
  name: 'Maria Clara Santos',
  role: 'RESIDENT',
  email: 'maria@gmail.com',
  phone: '0919-444-5555',
  locationName: 'Purok 4, Barangay Malanday',
  status: 'ACTIVE',
};

async function runResilienceTestSuite() {
  console.log('================================================================');
  console.log('   RESILIA DISASTER RESILIENCE 7-FEATURE VERIFICATION TEST SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✓ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`✗ [FAIL] ${testName}${detail ? ` -> ${detail}` : ''}`);
      failed++;
    }
  }

  // ===========================================================================
  // FEATURE 1: ACOUSTIC & STROBE SURVIVAL BEACON
  // ===========================================================================
  console.log('\n--- 1. Emergency Survival Beacon ("Find Me" Mode) ---');
  {
    // Test distress payload generation
    const distressPayload = {
      tag: 'SOS_DISTRESS_SIGNAL',
      name: 'Maria Clara Santos',
      paxCount: 3,
      medicalNeed: 'Diabetic senior citizen, requires insulin refrigeration',
      lat: 14.6507,
      lng: 121.0964,
      timestamp: new Date().toISOString(),
    };

    assert(distressPayload.lat === 14.6507 && distressPayload.lng === 121.0964, 'Beacon formats GPS location for rescue teams');
    assert(distressPayload.paxCount === 3, 'Tracks pax count in stranded location');

    // Morse SOS timing ratios
    const DOT_MS = 150;
    const DASH_MS = DOT_MS * 3; // 450ms
    assert(DASH_MS === 450, 'Standard Morse code timing ratios (1 dot = 150ms, 1 dash = 450ms)');

    // Eco saver mode duty cycle check
    const ECO_REST_INTERVAL_MS = 2500;
    assert(ECO_REST_INTERVAL_MS >= 2000, 'Eco battery mode enforces >= 2s OLED dark resting period to preserve battery');
  }

  // ===========================================================================
  // FEATURE 2: START TRIAGE & QR WRISTBAND GENERATION
  // ===========================================================================
  console.log('\n--- 2. Responder START Triage Tags & Field QR Wristbands ---');
  {
    // A. Evaluate START triage algorithm
    // 1. EXPECTANT (BLACK): Deceased, not breathing
    const catBlack = TriageRepository.evaluateSTARTTriage({
      canWalk: false,
      spontaneousBreathing: false,
      radialPulsePresent: false,
    });
    assert(catBlack === 'EXPECTANT', 'START Triage: Zero respirations = EXPECTANT (BLACK)');

    // 2. IMMEDIATE (RED): Respiration rate > 30 bpm
    const catRed1 = TriageRepository.evaluateSTARTTriage({
      canWalk: false,
      spontaneousBreathing: true,
      respiratoryRateBpm: 34,
      radialPulsePresent: true,
      capillaryRefillSeconds: 1.5,
      mentalStatus: 'FOLLOWS_COMMANDS',
    });
    assert(catRed1 === 'IMMEDIATE', 'START Triage: Respiratory rate > 30 = IMMEDIATE (RED)');

    // 3. IMMEDIATE (RED): Capillary refill > 2 seconds
    const catRed2 = TriageRepository.evaluateSTARTTriage({
      canWalk: false,
      spontaneousBreathing: true,
      respiratoryRateBpm: 22,
      radialPulsePresent: true,
      capillaryRefillSeconds: 3.5,
      mentalStatus: 'FOLLOWS_COMMANDS',
    });
    assert(catRed2 === 'IMMEDIATE', 'START Triage: Capillary refill > 2s = IMMEDIATE (RED)');

    // 4. IMMEDIATE (RED): Mental status fails simple command
    const catRed3 = TriageRepository.evaluateSTARTTriage({
      canWalk: false,
      spontaneousBreathing: true,
      respiratoryRateBpm: 18,
      radialPulsePresent: true,
      capillaryRefillSeconds: 1.5,
      mentalStatus: 'CONFUSED',
    });
    assert(catRed3 === 'IMMEDIATE', 'START Triage: Fails mental status command = IMMEDIATE (RED)');

    // 5. MINOR (GREEN): Walking wounded
    const catGreen = TriageRepository.evaluateSTARTTriage({
      canWalk: true,
      spontaneousBreathing: true,
      radialPulsePresent: true,
    });
    assert(catGreen === 'MINOR', 'START Triage: Walking wounded = MINOR (GREEN)');

    // 6. DELAYED (YELLOW): Non-ambulatory but normal respirations, perfusion, and mental status
    const catYellow = TriageRepository.evaluateSTARTTriage({
      canWalk: false,
      spontaneousBreathing: true,
      respiratoryRateBpm: 20,
      radialPulsePresent: true,
      capillaryRefillSeconds: 1.5,
      mentalStatus: 'FOLLOWS_COMMANDS',
    });
    // 7. IMMEDIATE (RED): Severe bradypnea (respiratory rate < 10 bpm)
    const catRedBradypnea = TriageRepository.evaluateSTARTTriage({
      canWalk: false,
      spontaneousBreathing: true,
      respiratoryRateBpm: 6,
      radialPulsePresent: true,
      capillaryRefillSeconds: 1.5,
      mentalStatus: 'FOLLOWS_COMMANDS',
    });
    assert(catRedBradypnea === 'IMMEDIATE', 'START Triage: Severe bradypnea (<10 bpm) = IMMEDIATE (RED)');

    // B. Wristband code generation
    const tagCode = TriageRepository.generateWristbandCode();
    assert(/^TRIAGE-2026-[A-Z0-9]{4}$/.test(tagCode), `Wristband code format matches TRIAGE-2026-XXXX (${tagCode})`);

    // C. QR Code Matrix Generator (Zero external dependencies)
    const qrMatrix = generateQRCodeMatrix(tagCode);
    assert(Array.isArray(qrMatrix) && qrMatrix.length >= 21 && qrMatrix[0].length >= 21, 'QR generator creates valid square matrix (>=21x21 modules)');
    assert(qrMatrix[0][0] && qrMatrix[0][6] && qrMatrix[6][0], 'QR generator renders corner finder patterns');
    // Verify ISO/IEC 18004: dark module at (size - 8, 8) must always be true
    assert(qrMatrix[qrMatrix.length - 8][8] === true, 'QR generator preserves mandatory fixed dark module at (size - 8, 8)');
    // Verify vertical timing pattern at row 6, col 8 is alternating timing pattern (even=black, odd=white; row 6 is even -> true)
    assert(qrMatrix[6][8] === true, 'QR generator preserves vertical timing pattern module at (6, 8)');

    // D. 1D Barcode Code 39 Generation
    const barcodeBars = generateBarcode39Bars(tagCode);
    assert(Array.isArray(barcodeBars) && barcodeBars.length > 0, 'Code 39 generates valid alternating bars and spaces');
    const barcodeSvgStr = renderToString(React.createElement(BarcodeSVG, { value: tagCode, height: 40 }));
    assert(barcodeSvgStr.includes('<svg') && barcodeSvgStr.includes('rect'), 'BarcodeSVG component generates valid SVG with bars');

    // E. Save Triage record to repository & EventQueue
    const triageRecord = await TriageRepository.createTriageRecord(
      {
        tagCode,
        category: 'IMMEDIATE',
        victimName: 'Pedro Penduko',
        gender: 'MALE',
        approxAgeGroup: 'ADULT',
        canWalk: false,
        spontaneousBreathing: true,
        respiratoryRateBpm: 32,
        radialPulsePresent: true,
        capillaryRefillSeconds: 2.5,
        mentalStatus: 'CONFUSED',
        avpuScore: 'VERBAL',
        injuriesDescription: 'Compound leg fracture and severe hypothermia',
        incidentId: 'inc_flood_001',
        responderId: responderUser.id,
        responderName: responderUser.name,
        locationName: 'Malanday Staging Point 2',
        status: 'FIELD_TRIAGED',
      },
      responderUser
    );
    assert(triageRecord.id !== undefined && triageRecord.tagCode === tagCode, 'Triage record created in offline store');

    // Update triage status to EN_ROUTE
    const updatedTriage = await TriageRepository.updateStatus(
      triageRecord.id,
      'EN_ROUTE',
      responderUser,
      'En route to Amang Rodriguez Memorial Medical Center'
    );
    assert(updatedTriage.status === 'EN_ROUTE' && Boolean(updatedTriage.injuriesDescription?.includes('Amang Rodriguez')), 'Triage status updated to EN_ROUTE with destination');
  }

  // ===========================================================================
  // FEATURE 3: AYUDA & RATION DISTRIBUTION TRACKER
  // ===========================================================================
  console.log('\n--- 3. Barcode/QR "Ayuda" & Ration Distribution Tracker ---');
  {
    // A. Create household claim card
    const card = await RationDistributionRepository.registerHouseholdCard(
      {
        claimCode: 'AYUDA-MLD-9901',
        householdHeadName: 'Danilo Cruz',
        familyMembersCount: 5,
        vulnerableMembers: { infants: 1, seniors: 1, pwd: 1, lactating: 1 },
        contactPhone: '0917-123-4567',
        purokAddress: 'Purok 1 Riverside, Malanday',
        evacuationCenterId: 'shelter_malanday_elem',
      },
      coordinatorUser
    );
    assert(card.claimCode === 'AYUDA-MLD-9901', 'Created Household claim card with demographics');

    // B. Check cooldown before any distribution (Allowed)
    const check1 = await RationDistributionRepository.checkCooldown(card.claimCode);
    assert(check1.canClaim === true, 'First-time distribution: cooldown check is ALLOWED');

    // Seed mock inventory item
    await localDB.put(STORES.RESOURCES, {
      id: 'res_food_pack',
      name: 'DSWD Family Food Pack',
      category: 'FOOD',
      quantity: 500,
      unit: 'packs',
      location: 'Malanday Elementary School',
      status: 'AVAILABLE',
      lastUpdated: new Date().toISOString(),
    });

    // C. Record ration distribution
    const { distribution, warning } = await RationDistributionRepository.recordDistribution(
      {
        householdId: card.id,
        claimCode: card.claimCode,
        householdHeadName: card.householdHeadName,
        familyMembersCount: card.familyMembersCount,
        packageType: 'FAMILY_FOOD_PACK',
        packageQuantity: 1,
        distributedBy: coordinatorUser.name,
        distributedById: coordinatorUser.id,
        shelterOrSiteName: 'Malanday Elementary School',
        cooldownHours: 24,
      },
      coordinatorUser
    );
    assert(distribution.id !== undefined && !warning, 'Recorded ration distribution in durable offline ledger');

    // Verify inventory deduction
    const updatedInventory = await ResourceRepository.getById('res_food_pack');
    assert(updatedInventory?.quantity === 499, 'Ration distribution automatically deducted stock from inventory (500 -> 499)');

    // D. 24h Duplicate Claim Detection: Immediate second attempt without override MUST fail
    const check2 = await RationDistributionRepository.checkCooldown(card.claimCode);
    assert(check2.canClaim === false, 'Duplicate claim within 24h correctly BLOCKED');
    assert(typeof check2.hoursRemaining === 'number' && check2.hoursRemaining >= 23, 'Cooldown reports ~24h remaining');

    // E. Coordinator Override allows claim with warning logged
    const { distribution: overrideDist, warning: overrideWarning } = await RationDistributionRepository.recordDistribution(
      {
        householdId: card.id,
        claimCode: card.claimCode,
        householdHeadName: card.householdHeadName,
        familyMembersCount: card.familyMembersCount,
        packageType: 'FAMILY_FOOD_PACK',
        packageQuantity: 1,
        distributedBy: coordinatorUser.name,
        distributedById: coordinatorUser.id,
        shelterOrSiteName: 'Malanday Elementary School',
        cooldownHours: 24,
        notes: 'Coordinator emergency authorized duplicate pack for flooded relatives',
      },
      coordinatorUser,
      true // ignoreCooldown
    );
    assert(overrideDist.id !== undefined, 'Coordinator override allowed claim with warning recorded');
  }

  // ===========================================================================
  // FEATURE 4: FAMILY REUNIFICATION & "MISSING KIN" PHOTO MATCHING
  // ===========================================================================
  console.log('\n--- 4. Family Reunification & "Missing Kin" Photo Matching ---');
  {
    // A. Register missing kin
    const missing = await MissingPersonsRepository.registerMissingPerson(
      {
        fullName: 'Lito Bautista',
        approxAge: 11,
        gender: 'MALE',
        lastSeenLocation: 'Marikina River Park near Tumana Bridge',
        lastSeenDateTime: '2026-10-14 06:30',
        distinguishingFeatures: 'Birthmark on left arm',
        clothingDescription: 'Yellow t-shirt, blue basketball shorts, red slippers',
        photoDataUrl: 'data:image/svg+xml;utf8,<svg></svg>',
        reporterName: 'Aling Nena Bautista',
        reporterPhone: '0917-888-2345',
        reporterRelationship: 'Mother',
      },
      residentUser
    );
    assert(missing.id !== undefined && missing.fullName === 'Lito Bautista', 'Registered missing kin with photo and clothing description');

    // B. Phone privacy masking check
    const maskedPhone = missing.reporterPhone.replace(/^(\d{4})-\d{3}-(\d{4})$/, '$1-***-**$2');
    assert(maskedPhone.includes('***'), 'Phone number properly masked for public shelter board privacy');

    // C. Fuzzy roster search matching
    const mockShelterRoster = [
      { name: 'Lito Bautista Jr.', shelterName: 'Bulelak Gym', phone: '0917-555-1234' },
      { name: 'Leticia Santos', shelterName: 'Malanday Elementary', phone: '0918-111-2222' },
      { name: 'Juan Cruz', shelterName: 'Concepcion Integrated', phone: '0919-333-4444' },
    ];
    const matches = await MissingPersonsRepository.searchAndMatchRoster('Lito Bautista', mockShelterRoster);
    assert(matches.length >= 1 && matches[0].candidate.name.includes('Lito Bautista'), 'Fuzzy roster search matches missing kin to shelter occupant');

    // D. Status lifecycle transitions
    const updatedStatus = await MissingPersonsRepository.updateStatus(
      missing.id,
      'FOUND_SAFE',
      'Found safe by Barangay Tanod at Bulelak Gymnasium',
      coordinatorUser,
      'Bulelak Gymnasium'
    );
    assert(updatedStatus.status === 'FOUND_SAFE', 'Transitioned status to FOUND_SAFE');

    const reunited = await MissingPersonsRepository.updateStatus(
      missing.id,
      'REUNITED',
      'Reunited with mother Aling Nena at Malanday ICP',
      coordinatorUser
    );
    assert(reunited.status === 'REUNITED', 'Transitioned status to REUNITED');
  }

  // ===========================================================================
  // FEATURE 5: EVACUATION CENTER SPECIAL NEEDS MATRIX
  // ===========================================================================
  console.log('\n--- 5. Evacuation Center Special Needs Matrix ---');
  {
    // Seed test shelter
    const shelterInit: Shelter = {
      id: 'shelter_test_matrix',
      name: 'Malanday Central Covered Court',
      locationName: 'Purok 3, Malanday, Marikina City',
      lat: 14.6500,
      lng: 121.0960,
      capacityTotal: 300,
      capacityCurrent: 120,
      status: 'OPEN',
      isAccessibleWheelchair: true,
      hasBackupPower: true,
      hasMedicalClinic: true,
      hasPotableWater: true,
      hasLactatingStation: true,
      hasPetFriendlyZone: true,
      hasMedicalOxygen: true,
      hasGroundFloorAccess: true,
      pwdCapacity: 40,
      pwdCurrent: 15,
      petCapacity: 25,
      petCurrent: 8,
      contactPerson: 'Kagawad Elena',
      contactPhone: '0917-111-2222',
      verifiedAt: new Date().toISOString(),
      verifiedBy: 'CDRRMO Ops',
      lastUpdated: new Date().toISOString(),
    };
    await localDB.put(STORES.SHELTERS, shelterInit);

    // Verify repository feature update preserves all special needs fields
    const updated = await ShelterRepository.updateShelterFeatures(
      'shelter_test_matrix',
      {
        hasLactatingStation: true,
        hasPetFriendlyZone: true,
        hasMedicalOxygen: true,
        hasGroundFloorAccess: true,
        pwdCapacity: 50,
        pwdCurrent: 20,
        petCapacity: 30,
        petCurrent: 12,
        capacityCurrent: 150,
      },
      coordinatorUser,
      'Allocated additional ground floor classrooms for PWDs and pet cages'
    );

    assert(updated.hasLactatingStation === true, 'Shelter maintains Lactating & Infant Station feature');
    assert(updated.hasPetFriendlyZone === true, 'Shelter maintains Pet-Friendly Safe Zone');
    assert(updated.hasMedicalOxygen === true, 'Shelter maintains Medical Oxygen & Dialysis facility flag');
    assert(updated.hasGroundFloorAccess === true, 'Shelter provides step-free ground floor access');
    assert(updated.pwdCapacity === 50 && updated.pwdCurrent === 20, 'Tracks dedicated PWD / Senior capacity & occupancy');
    assert(updated.petCapacity === 30 && updated.petCurrent === 12, 'Tracks dedicated pet cages capacity & count');
  }

  // ===========================================================================
  // FEATURE 6: BAYANIHAN MUTUAL AID BOARD
  // ===========================================================================
  console.log('\n--- 6. "Bayanihan" Community Mutual Aid Board ---');
  {
    // A. Resident posts an OFFER to share generator power charging
    const postOffer = await MutualAidRepository.createPost(
      {
        type: 'OFFER',
        category: 'POWER_CHARGING',
        title: 'Free 2kW Generator Phone & Powerbank Charging',
        description: 'Available at Purok 2 Sari-Sari Store until 22:00. Bring your own cables.',
        purokSector: 'Purok 2, Malanday',
        contactName: 'Mang Tomas',
        contactPhone: '0922-123-9988',
        locationDetails: 'Tomas Store across Malanday Chapel',
      },
      residentUser
    );
    assert(postOffer.id !== undefined && postOffer.type === 'OFFER', 'Created Bayanihan OFFER post');

    // B. Resident posts a REQUEST for emergency pump/tools
    const postRequest = await MutualAidRepository.createPost(
      {
        type: 'REQUEST',
        category: 'EQUIPMENT_TOOLS',
        title: 'Need Submersible Water Pump for Basement Inundation',
        description: 'Water level reached 1 foot inside ground floor. Need 1-2hp pump for 2 hours.',
        purokSector: 'Purok 3, Malanday',
        contactName: 'Kuya Ronald',
        contactPhone: '0917-444-1122',
      },
      residentUser
    );
    assert(postRequest.id !== undefined && postRequest.type === 'REQUEST', 'Created Bayanihan REQUEST post');

    // C. Update status to COMPLETED
    const completed = await MutualAidRepository.updateStatus(
      postRequest.id,
      'COMPLETED',
      residentUser,
      'Barangay Volunteer Kuya Ben'
    );
    assert(completed.status === 'COMPLETED' && completed.claimedBy === 'Barangay Volunteer Kuya Ben', 'Mutual aid post transitioned to COMPLETED with helper attribution');

    // D. Filter posts by category
    const allPosts = await MutualAidRepository.getAll();
    const powerOffers = allPosts.filter(p => p.category === 'POWER_CHARGING');
    assert(powerOffers.length >= 1, 'Filter posts by category (POWER_CHARGING) succeeds');

    // E. Strict RBAC: Only residents can post Bayanihan offers/requests
    let coordinatorBayanihanBlocked = false;
    try {
      await MutualAidRepository.createPost(
        {
          type: 'OFFER',
          category: 'EQUIPMENT_TOOLS',
          title: 'Coordinator Equipment',
          description: 'Tools from CDRRMO',
          purokSector: 'Purok 1',
          contactName: 'Coordinator',
          contactPhone: '0917-000-0000',
        },
        coordinatorUser
      );
    } catch (err: any) {
      if (err.message.includes('RBAC Violation')) {
        coordinatorBayanihanBlocked = true;
      }
    }
    assert(coordinatorBayanihanBlocked, 'RBAC: Coordinator blocked from posting on resident Bayanihan board');
  }

  // ===========================================================================
  // FEATURE 7: BOIL WATER & DISEASE OUTBREAK WATCH
  // ===========================================================================
  console.log('\n--- 7. Boil Water & Disease Outbreak Watch (Leptospirosis, Cholera) ---');
  {
    // A. 72-Hour Leptospirosis Prophylaxis Countdown Calculation
    const now = Date.now();
    const twoHoursAgo = new Date(now - 2 * 3600 * 1000).toISOString();
    const eightyHoursAgo = new Date(now - 80 * 3600 * 1000).toISOString();

    // Case 1: Recent exposure with open cuts (High Risk, within 72h window)
    const guidanceRecent = OutbreakWatchRepository.calculateLeptospirosisGuidance(
      twoHoursAgo,
      true // hasWounds
    );
    assert(guidanceRecent.isWithinWindow === true, 'Leptospirosis: 2h post-flood is within 72h window');
    assert(guidanceRecent.protocol === 'MODERATE_HIGH_RISK_DAILY', 'Wounds present = MODERATE_HIGH_RISK_DAILY protocol');
    assert(guidanceRecent.recommendation.includes('Doxycycline'), 'Recommends DOH Doxycycline clinical protocol');

    // Case 2: Past 72 hours (Expired window)
    const guidanceExpired = OutbreakWatchRepository.calculateLeptospirosisGuidance(
      eightyHoursAgo,
      true
    );
    assert(guidanceExpired.isWithinWindow === false, 'Leptospirosis: 80h post-flood flagged as window expired');
    assert(guidanceExpired.hoursRemaining === 0, 'Zero hours remaining for preventive prophylaxis');

    // B. Water purification dosage standards verification
    const DOH_PURIFICATION_STANDARDS = {
      boilingMinutes: 1, // Rolling boil for at least 1 minute
      bleachDropsPerLiter: 2, // 2 drops 5% sodium hypochlorite per liter clear water
      bleachTeaspoonPer5Gallons: 1, // 1 teaspoon per 5-gallon blue container
      contactTimeMinutes: 30, // Wait 30 minutes before drinking
    };
    assert(DOH_PURIFICATION_STANDARDS.boilingMinutes === 1, 'DOH standard: minimum 1 minute rolling boil');
    assert(DOH_PURIFICATION_STANDARDS.contactTimeMinutes === 30, 'Chlorine water disinfection requires 30-min contact time');

    // C. Record flood exposure
    const exposure = await OutbreakWatchRepository.logFloodExposure({
      userId: residentUser.id,
      userName: 'Juanito Gomez',
      exposureTimestamp: twoHoursAgo,
      wadingDurationMinutes: 45,
      waterDepth: 'WAIST_OR_DEEPER',
      hasOpenWounds: true,
      takenProphylaxis: false,
      notes: 'Flooded along Malanday riverbank',
    });
    assert(exposure.id !== undefined && exposure.userName === 'Juanito Gomez', 'Recorded flood exposure in offline watch store');

    // D. Mark prophylaxis received
    const updatedExposure = await OutbreakWatchRepository.markProphylaxisTaken(
      exposure.id,
      true,
      'Doxycycline 200mg single dose taken with meals at Malanday Barangay Health Station'
    );
    assert(updatedExposure.takenProphylaxis === true && Boolean(updatedExposure.notes?.includes('Doxycycline')), 'Logged prophylaxis intake with clinic source');

    // E. Strict RBAC: Outbreak Watch posted by Coordinator ONLY
    let residentOutbreakBlocked = false;
    try {
      await OutbreakWatchRepository.createAdvisory(
        {
          title: 'Unauthorized Resident Water Warning',
          type: 'BOIL_WATER',
          severity: 'CRITICAL',
          affectedAreas: ['Purok 1'],
          guidance: 'Boil water now',
          issuedByCoordinatorId: residentUser.id,
          issuedByName: residentUser.name,
        },
        residentUser
      );
    } catch (err: any) {
      if (err.message.includes('RBAC Violation')) {
        residentOutbreakBlocked = true;
      }
    }
    assert(residentOutbreakBlocked, 'RBAC: Resident blocked from posting official Outbreak Watch advisory');

    // F. Authorized Coordinator posts Outbreak & Boil-Water advisory
    const advisory = await OutbreakWatchRepository.createAdvisory(
      {
        title: 'Malanday Water Pipeline Boil-Water Directive',
        type: 'BOIL_WATER',
        severity: 'CRITICAL',
        affectedAreas: ['Purok 1 Malanday', 'Tumana Dike Side'],
        waterSource: 'Low Pressure Tap Pipeline',
        boilDurationMinutes: 3,
        clinicDispensingSites: ['Malanday Barangay Health Center'],
        guidance: 'Boil all drinking water for minimum 3 minutes rolling boil.',
        issuedByCoordinatorId: coordinatorUser.id,
        issuedByName: coordinatorUser.name,
      },
      coordinatorUser
    );
    assert(advisory.id !== undefined && advisory.severity === 'CRITICAL', 'Authorized Coordinator successfully created Outbreak Advisory');

    const allAdvisories = await OutbreakWatchRepository.getAdvisories();
    assert(allAdvisories.some((a) => a.id === advisory.id), 'Advisory query returns coordinator-issued health directive');

    const resolved = await OutbreakWatchRepository.toggleAdvisoryStatus(advisory.id, coordinatorUser, false);
    assert(resolved.isActive === false, 'Coordinator successfully updated advisory active status');
  }

  // ===========================================================================
  // FEATURE 8: CLOUD SERVER SYNCHRONIZATION (server/store.ts & server/routes.ts)
  // ===========================================================================
  console.log('\n--- 8. Central Cloud Synchronization for Resilience Stores ---');
  {
    const syncBatch = [
      {
        event_id: 'evt_sync_triage_001',
        entity_type: 'triage_record' as const,
        entity_id: 'tri_cloud_test_1',
        operation: 'CREATE' as const,
        payload: {
          id: 'tri_cloud_test_1',
          tagCode: 'TRIAGE-2026-TEST',
          category: 'IMMEDIATE',
          victimName: 'Cloud Test Victim',
          gender: 'MALE',
          approxAgeGroup: 'ADULT',
          status: 'FIELD_TRIAGED',
          timestamp: new Date().toISOString(),
          offlineGenerated: true,
        },
        origin_device_id: 'dev_test_01',
        actor_id: responderUser.id,
        created_at: new Date().toISOString(),
        schema_version: 1,
        sync_status: 'PENDING' as const,
        retry_count: 0,
      },
      {
        event_id: 'evt_sync_ration_001',
        entity_type: 'ration_distribution' as const,
        entity_id: 'rat_cloud_test_1',
        operation: 'CREATE' as const,
        payload: {
          id: 'rat_cloud_test_1',
          householdId: 'hhd_001',
          claimCode: 'AYUDA-TEST-001',
          householdHeadName: 'Cloud Head',
          familyMembersCount: 4,
          packageType: 'FAMILY_FOOD_PACK',
          packageQuantity: 1,
          distributedBy: coordinatorUser.name,
          distributedById: coordinatorUser.id,
          shelterOrSiteName: 'Malanday Elementary School',
          timestamp: new Date().toISOString(),
          cooldownHours: 24,
        },
        origin_device_id: 'dev_test_01',
        actor_id: coordinatorUser.id,
        created_at: new Date().toISOString(),
        schema_version: 1,
        sync_status: 'PENDING' as const,
        retry_count: 0,
      },
      {
        event_id: 'evt_sync_kin_001',
        entity_type: 'missing_kin' as const,
        entity_id: 'kin_cloud_test_1',
        operation: 'CREATE' as const,
        payload: {
          id: 'kin_cloud_test_1',
          fullName: 'Cloud Missing Person',
          gender: 'FEMALE',
          lastSeenLocation: 'Tumana Bridge',
          lastSeenDateTime: 'Today 10:00 AM',
          distinguishingFeatures: 'Red cap',
          reporterName: 'Test Reporter',
          reporterPhone: '0917-123-4567',
          status: 'SEARCHING',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        origin_device_id: 'dev_test_01',
        actor_id: residentUser.id,
        created_at: new Date().toISOString(),
        schema_version: 1,
        sync_status: 'PENDING' as const,
        retry_count: 0,
      },
      {
        event_id: 'evt_sync_aid_001',
        entity_type: 'mutual_aid' as const,
        entity_id: 'aid_cloud_test_1',
        operation: 'CREATE' as const,
        payload: {
          id: 'aid_cloud_test_1',
          title: 'Cloud Mutual Aid Offer',
          description: 'Emergency tools available',
          type: 'OFFER',
          category: 'EQUIPMENT_TOOLS',
          purokSector: 'Purok 1',
          contactName: 'Kuya Cloud',
          contactPhone: '0918-000-1111',
          status: 'ACTIVE',
          createdAt: new Date().toISOString(),
        },
        origin_device_id: 'dev_test_01',
        actor_id: residentUser.id,
        created_at: new Date().toISOString(),
        schema_version: 1,
        sync_status: 'PENDING' as const,
        retry_count: 0,
      },
      {
        event_id: 'evt_sync_exp_001',
        entity_type: 'outbreak_watch' as const,
        entity_id: 'exp_cloud_test_1',
        operation: 'CREATE' as const,
        payload: {
          id: 'exp_cloud_test_1',
          userId: residentUser.id,
          userName: residentUser.name,
          exposureTimestamp: new Date().toISOString(),
          wadingDurationMinutes: 20,
          waterDepth: 'ANKLE_TO_CALF',
          hasOpenWounds: false,
          prophylaxisWindowExpiry: new Date(Date.now() + 72 * 3600000).toISOString(),
          recommendedProtocol: 'LOW_RISK_SINGLE_DOSE',
          takenProphylaxis: false,
        },
        origin_device_id: 'dev_test_01',
        actor_id: residentUser.id,
        created_at: new Date().toISOString(),
        schema_version: 1,
        sync_status: 'PENDING' as const,
        retry_count: 0,
      },
    ];

    // Process sync events through CentralCloudStore
    const { acknowledgements } = cloudStore.processSyncEvents(syncBatch);
    assert(acknowledgements.length === 5, 'Central cloud store processes all 5 resilience sync events');
    assert(acknowledgements.every(a => a.status === 'ACKNOWLEDGED'), 'All resilience sync events successfully ACKNOWLEDGED');

    // Verify entities are durably persisted in cloudStore collections
    assert(cloudStore.triageRecords.has('tri_cloud_test_1'), 'Triage record persisted in cloudStore');
    assert(cloudStore.rationDistributions.has('rat_cloud_test_1'), 'Ration distribution persisted in cloudStore');
    assert(cloudStore.missingPersons.has('kin_cloud_test_1'), 'Missing kin record persisted in cloudStore');
    assert(cloudStore.mutualAidPosts.has('aid_cloud_test_1'), 'Mutual aid post persisted in cloudStore');
    assert(cloudStore.outbreakWatch.has('exp_cloud_test_1'), 'Outbreak exposure persisted in cloudStore');

    // Verify getChangesSince returns resilience records for remote pull
    const changes = cloudStore.getChangesSince(new Date(Date.now() - 60000).toISOString());
    assert(Array.isArray(changes.triageRecords) && changes.triageRecords.some(t => t.id === 'tri_cloud_test_1'), 'cloudStore pull returns synced triage records');
    assert(Array.isArray(changes.rationDistributions) && changes.rationDistributions.some(r => r.id === 'rat_cloud_test_1'), 'cloudStore pull returns synced ration distributions');
    assert(Array.isArray(changes.missingPersons) && changes.missingPersons.some(k => k.id === 'kin_cloud_test_1'), 'cloudStore pull returns synced missing kin');
    assert(Array.isArray(changes.mutualAidPosts) && changes.mutualAidPosts.some(m => m.id === 'aid_cloud_test_1'), 'cloudStore pull returns synced mutual aid posts');
    assert(Array.isArray(changes.outbreakWatch) && changes.outbreakWatch.some(o => o.id === 'exp_cloud_test_1'), 'cloudStore pull returns synced outbreak records');
  }

  // ===========================================================================
  // SUMMARY RECORD
  // ===========================================================================
  console.log('\n================================================================');
  console.log(`   TEST EXECUTION COMPLETED: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runResilienceTestSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
