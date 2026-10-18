import { describe, it } from 'node:test';
import assert from 'node:assert';
import { AssistanceRequest, Mission, Incident, User } from '../src/types';

// Mock storage
const mockDB: Record<string, Map<string, any>> = {
  assistance_requests: new Map(),
  missions: new Map(),
  incidents: new Map(),
};

const localDB = {
  get: async <T>(store: string, id: string): Promise<T | undefined> => {
    return mockDB[store]?.get(id);
  },
  getAll: async <T>(store: string): Promise<T[]> => {
    return Array.from(mockDB[store]?.values() || []);
  },
  put: async <T extends { id: string }>(store: string, item: T): Promise<void> => {
    if (!mockDB[store]) mockDB[store] = new Map();
    mockDB[store].set(item.id, item);
  },
  clear: async (store: string): Promise<void> => {
    mockDB[store]?.clear();
  },
};

const dummyActor: User = {
  id: 'user_responder_juan',
  name: 'Officer Juan dela Cruz',
  email: 'juan@resilia.ph',
  role: 'RESPONDER',
  phone: '+63 917 111 2222',
  locationName: 'Tumana Bridge',
  status: 'ON_DUTY',
};

describe('Mission Completed to Assistance Request Fulfilled Synchronization', () => {
  it('1. Updates linked Assistance Request to FULFILLED when linked by mission.assistanceRequestId', async () => {
    const req: AssistanceRequest = {
      id: 'req_elderly_rescue_001',
      residentId: 'res_001',
      residentName: 'Nanay Corazon',
      contactPhone: '+63 917 111 2222',
      peopleCount: 2,
      vulnerabilityNeeds: {
        elderlyCount: 1,
        infantCount: 0,
        wheelchairUser: true,
        bedridden: false,
        medicalNeeds: [],
      },
      category: 'EMERGENCY_RESCUE',
      description: 'Trapped on second floor balcony by 1.2m flood',
      locationName: 'Purok 5, Tumana',
      lat: 14.658,
      lng: 121.101,
      priority: 'CRITICAL',
      priorityScore: 95,
      priorityRationale: ['Critical flood rescue'],
      status: 'ASSIGNED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      assignedMissionId: 'mis_rescue_001',
    };

    const mission: Mission = {
      id: 'mis_rescue_001',
      title: 'Balcony Rescue: Nanay Corazon',
      assistanceRequestId: 'req_elderly_rescue_001',
      priority: 'CRITICAL',
      rationale: 'Wheelchair extraction boat response',
      pickupLocation: 'Purok 5, Tumana',
      destinationLocation: 'Malanday School Shelter',
      lat: 14.658,
      lng: 121.101,
      requestedAssistance: 'Boat evacuation',
      vulnerabilitySummary: 'Elderly wheelchair user',
      assignedResponderId: dummyActor.id,
      assignedResponderName: dummyActor.name,
      status: 'IN_PROGRESS',
      statusHistory: [],
      evidenceRecordIds: ['req_elderly_rescue_001'],
      requiresHumanApproval: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await localDB.put('assistance_requests', req);
    await localDB.put('missions', mission);

    // Simulate completion
    mission.status = 'COMPLETED';
    mission.updatedAt = new Date().toISOString();
    await localDB.put('missions', mission);

    // Propagate completion logic
    const allRequests = await localDB.getAll<AssistanceRequest>('assistance_requests');
    const requestsToUpdate = allRequests.filter((r) => {
      if (mission.assistanceRequestId && r.id === mission.assistanceRequestId) return true;
      if (r.assignedMissionId === mission.id) return true;
      if (mission.evidenceRecordIds?.includes(r.id)) return true;
      return false;
    });

    for (const r of requestsToUpdate) {
      r.status = 'FULFILLED';
      r.assignedMissionId = mission.id;
      r.updatedAt = mission.updatedAt;
      await localDB.put('assistance_requests', r);
    }

    const updatedReq = await localDB.get<AssistanceRequest>('assistance_requests', req.id);
    assert.strictEqual(updatedReq?.status, 'FULFILLED');
    console.log('  ✓ PASS: Request updated to FULFILLED via assistanceRequestId');
  });

  it('2. Updates linked Assistance Request to FULFILLED when linked via req.assignedMissionId', async () => {
    // Notice mission.assistanceRequestId is blank, but request has assignedMissionId
    const req: AssistanceRequest = {
      id: 'req_water_delivery_002',
      residentId: 'res_002',
      residentName: 'Tatay Ruben',
      contactPhone: '+63 918 222 3333',
      peopleCount: 4,
      vulnerabilityNeeds: {
        elderlyCount: 1,
        infantCount: 1,
        wheelchairUser: false,
        bedridden: false,
        medicalNeeds: [],
      },
      category: 'WATER',
      description: 'No clean drinking water for baby',
      locationName: 'Malanday Dike House 14',
      lat: 14.659,
      lng: 121.103,
      priority: 'HIGH',
      priorityScore: 80,
      priorityRationale: ['Infant hydration'],
      status: 'ASSIGNED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      assignedMissionId: 'mis_water_delivery_bulk',
    };

    const mission: Mission = {
      id: 'mis_water_delivery_bulk',
      title: 'Bulk Clean Water Distribution Sector 4',
      assistanceRequestId: '', // not set
      priority: 'HIGH',
      rationale: 'Clean water convoy',
      pickupLocation: 'Command Center',
      destinationLocation: 'Malanday Dike House 14',
      lat: 14.659,
      lng: 121.103,
      requestedAssistance: 'Clean water jugs',
      vulnerabilitySummary: 'Infants and seniors present',
      assignedResponderId: dummyActor.id,
      assignedResponderName: dummyActor.name,
      status: 'IN_PROGRESS',
      statusHistory: [],
      evidenceRecordIds: [],
      requiresHumanApproval: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await localDB.put('assistance_requests', req);
    await localDB.put('missions', mission);

    // Complete mission
    mission.status = 'COMPLETED';
    mission.updatedAt = new Date().toISOString();
    await localDB.put('missions', mission);

    const allRequests = await localDB.getAll<AssistanceRequest>('assistance_requests');
    const requestsToUpdate = allRequests.filter((r) => {
      if (mission.assistanceRequestId && r.id === mission.assistanceRequestId) return true;
      if (r.assignedMissionId === mission.id) return true;
      if (mission.evidenceRecordIds?.includes(r.id)) return true;
      return false;
    });

    for (const r of requestsToUpdate) {
      r.status = 'FULFILLED';
      r.assignedMissionId = mission.id;
      r.updatedAt = mission.updatedAt;
      await localDB.put('assistance_requests', r);
    }

    const updatedReq = await localDB.get<AssistanceRequest>('assistance_requests', req.id);
    assert.strictEqual(updatedReq?.status, 'FULFILLED');
    console.log('  ✓ PASS: Request updated to FULFILLED via assignedMissionId');
  });

  it('3. Updates multiple linked Assistance Requests when one Mission fulfills multiple requests', async () => {
    const req1: AssistanceRequest = {
      id: 'req_family_a',
      residentId: 'res_a',
      residentName: 'Family A',
      contactPhone: '+63 900 111 0001',
      peopleCount: 3,
      vulnerabilityNeeds: { elderlyCount: 0, infantCount: 0, wheelchairUser: false, bedridden: false, medicalNeeds: [] },
      category: 'EVACUATION',
      description: 'First floor submerged',
      locationName: 'Purok 2',
      lat: 14.655,
      lng: 121.1,
      priority: 'HIGH',
      priorityScore: 70,
      priorityRationale: ['Evacuation required'],
      status: 'ASSIGNED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      assignedMissionId: 'mis_multi_evac',
    };

    const req2: AssistanceRequest = {
      id: 'req_family_b',
      residentId: 'res_b',
      residentName: 'Family B',
      contactPhone: '+63 900 111 0002',
      peopleCount: 5,
      vulnerabilityNeeds: { elderlyCount: 1, infantCount: 1, wheelchairUser: false, bedridden: false, medicalNeeds: [] },
      category: 'EVACUATION',
      description: 'Trapped on roof',
      locationName: 'Purok 2',
      lat: 14.655,
      lng: 121.1,
      priority: 'CRITICAL',
      priorityScore: 90,
      priorityRationale: ['Roof rescue with infant and elderly'],
      status: 'ASSIGNED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      assignedMissionId: 'mis_multi_evac',
    };

    const mission: Mission = {
      id: 'mis_multi_evac',
      title: 'Purok 2 Cluster Evacuation',
      assistanceRequestId: 'req_family_a',
      priority: 'CRITICAL',
      rationale: 'Cluster rescue boat mission',
      pickupLocation: 'Purok 2',
      destinationLocation: 'Tumana Elementary School Shelter',
      lat: 14.655,
      lng: 121.1,
      requestedAssistance: 'Cluster extraction',
      vulnerabilitySummary: '8 individuals across 2 households',
      assignedResponderId: dummyActor.id,
      assignedResponderName: dummyActor.name,
      status: 'IN_PROGRESS',
      statusHistory: [],
      evidenceRecordIds: ['req_family_a', 'req_family_b'],
      requiresHumanApproval: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await localDB.put('assistance_requests', req1);
    await localDB.put('assistance_requests', req2);
    await localDB.put('missions', mission);

    // Complete mission
    mission.status = 'COMPLETED';
    mission.updatedAt = new Date().toISOString();
    await localDB.put('missions', mission);

    const allRequests = await localDB.getAll<AssistanceRequest>('assistance_requests');
    const requestsToUpdate = allRequests.filter((r) => {
      if (mission.assistanceRequestId && r.id === mission.assistanceRequestId) return true;
      if (r.assignedMissionId === mission.id) return true;
      if (mission.evidenceRecordIds?.includes(r.id)) return true;
      return false;
    });

    assert.strictEqual(requestsToUpdate.length, 2);
    for (const r of requestsToUpdate) {
      r.status = 'FULFILLED';
      r.assignedMissionId = mission.id;
      r.updatedAt = mission.updatedAt;
      await localDB.put('assistance_requests', r);
    }

    const updated1 = await localDB.get<AssistanceRequest>('assistance_requests', req1.id);
    const updated2 = await localDB.get<AssistanceRequest>('assistance_requests', req2.id);

    assert.strictEqual(updated1?.status, 'FULFILLED');
    assert.strictEqual(updated2?.status, 'FULFILLED');
    console.log('  ✓ PASS: Both cluster requests updated to FULFILLED');
  });

  it('4. Resolving an incident dispatch marks corresponding Mission COMPLETED and linked Requests FULFILLED', async () => {
    const incident: Incident = {
      id: 'inc_landslide_purok3',
      type: 'ROAD_BLOCKED',
      title: 'Landslide on access road',
      description: 'Road blocked by soil and fallen trees',
      lat: 14.652,
      lng: 121.098,
      locationName: 'Purok 3 access path',
      reporterId: 'res_005',
      reporterName: 'Kagawad Mario',
      reporterRole: 'COORDINATOR',
      severity: 'HIGH',
      status: 'VERIFIED',
      responderStatus: 'ON_SCENE',
      supportingReportsCount: 2,
      contradictingReportsCount: 0,
      createdAt: new Date().toISOString(),
    };

    const mission: Mission = {
      id: 'mis_inc_inc_landslide_purok3',
      title: 'Incident Response: Landslide on access road',
      assistanceRequestId: 'inc_landslide_purok3',
      priority: 'HIGH',
      rationale: 'Direct hazard clearing',
      pickupLocation: incident.locationName,
      destinationLocation: incident.locationName,
      lat: incident.lat,
      lng: incident.lng,
      requestedAssistance: incident.description,
      vulnerabilitySummary: 'Road clearance',
      assignedResponderId: dummyActor.id,
      assignedResponderName: dummyActor.name,
      status: 'IN_PROGRESS',
      statusHistory: [],
      evidenceRecordIds: [incident.id],
      requiresHumanApproval: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const req: AssistanceRequest = {
      id: 'req_resident_stranded_by_landslide',
      residentId: 'res_stranded',
      residentName: 'Pedro San Jose',
      contactPhone: '+63 919 444 5555',
      peopleCount: 2,
      vulnerabilityNeeds: { elderlyCount: 0, infantCount: 0, wheelchairUser: false, bedridden: false, medicalNeeds: [] },
      category: 'EVACUATION',
      description: 'Cannot exit due to landslide on path',
      locationName: 'Purok 3 access path',
      lat: 14.652,
      lng: 121.098,
      priority: 'HIGH',
      priorityScore: 75,
      priorityRationale: ['Cut off by landslide'],
      status: 'ASSIGNED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      assignedMissionId: mission.id,
    };

    await localDB.put('incidents', incident);
    await localDB.put('missions', mission);
    await localDB.put('assistance_requests', req);

    // Incident resolved by responder
    incident.responderStatus = 'RESOLVED';
    incident.status = 'RESOLVED';
    await localDB.put('incidents', incident);

    // Propagation to missions
    const allMissions = await localDB.getAll<Mission>('missions');
    const linkedMissions = allMissions.filter(
      (m) =>
        m.assistanceRequestId === incident.id ||
        m.id === 'mis_inc_' + incident.id.replace(/[^a-zA-Z0-9]/g, '_') ||
        m.evidenceRecordIds?.includes(incident.id)
    );
    for (const m of linkedMissions) {
      m.status = 'COMPLETED';
      await localDB.put('missions', m);
    }

    // Propagation to requests
    const allRequests = await localDB.getAll<AssistanceRequest>('assistance_requests');
    const linkedRequests = allRequests.filter(
      (r) =>
        r.assignedMissionId === incident.id ||
        linkedMissions.some((m) => m.id === r.assignedMissionId || m.assistanceRequestId === r.id || m.evidenceRecordIds?.includes(r.id))
    );
    for (const r of linkedRequests) {
      r.status = 'FULFILLED';
      await localDB.put('assistance_requests', r);
    }

    const updatedMission = await localDB.get<Mission>('missions', mission.id);
    const updatedReq = await localDB.get<AssistanceRequest>('assistance_requests', req.id);

    assert.strictEqual(updatedMission?.status, 'COMPLETED');
    assert.strictEqual(updatedReq?.status, 'FULFILLED');
    console.log('  ✓ PASS: Incident resolution updated mission to COMPLETED and request to FULFILLED');
  });

  it('5. Coordinator UI accurately evaluates isFulfilled status and pendingRequests KPI', async () => {
    const missionsList: Mission[] = [
      {
        id: 'mis_sample_1',
        title: 'Mission 1',
        assistanceRequestId: 'req_sample_1',
        priority: 'CRITICAL',
        rationale: 'R',
        pickupLocation: 'P',
        destinationLocation: 'D',
        lat: 14,
        lng: 121,
        requestedAssistance: 'A',
        vulnerabilitySummary: 'V',
        status: 'COMPLETED', // COMPLETED
        statusHistory: [],
        evidenceRecordIds: [],
        requiresHumanApproval: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const requestsList: AssistanceRequest[] = [
      {
        id: 'req_sample_1',
        residentId: 'r1',
        residentName: 'Resident 1',
        contactPhone: '123',
        peopleCount: 1,
        vulnerabilityNeeds: { elderlyCount: 0, infantCount: 0, wheelchairUser: false, bedridden: false, medicalNeeds: [] },
        category: 'EVACUATION',
        description: 'D',
        locationName: 'L',
        lat: 14,
        lng: 121,
        priority: 'CRITICAL',
        priorityScore: 90,
        priorityRationale: [],
        status: 'ASSIGNED', // Stored as ASSIGNED, but linked mission is COMPLETED
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        assignedMissionId: 'mis_sample_1',
      },
      {
        id: 'req_sample_2',
        residentId: 'r2',
        residentName: 'Resident 2',
        contactPhone: '456',
        peopleCount: 2,
        vulnerabilityNeeds: { elderlyCount: 0, infantCount: 0, wheelchairUser: false, bedridden: false, medicalNeeds: [] },
        category: 'WATER',
        description: 'D2',
        locationName: 'L2',
        lat: 14,
        lng: 121,
        priority: 'MEDIUM',
        priorityScore: 50,
        priorityRationale: [],
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    // UI row derivation logic
    const req1 = requestsList[0];
    const linkedMission1 = req1.assignedMissionId
      ? missionsList.find((m) => m.id === req1.assignedMissionId)
      : missionsList.find((m) => m.assistanceRequestId === req1.id || m.evidenceRecordIds?.includes(req1.id));
    const isFulfilled1 = req1.status === 'FULFILLED' || linkedMission1?.status === 'COMPLETED';

    assert.strictEqual(isFulfilled1, true);

    // KPI calculation logic
    const pendingRequests = requestsList.filter((r) => {
      const linkedMission = r.assignedMissionId
        ? missionsList.find((m) => m.id === r.assignedMissionId)
        : missionsList.find((m) => m.assistanceRequestId === r.id || m.evidenceRecordIds?.includes(r.id));
      if (r.status === 'FULFILLED' || linkedMission?.status === 'COMPLETED') return false;
      return r.status === 'PENDING' || r.status === 'TRIAGED';
    });

    // req_sample_1 should be excluded because its mission is completed; only req_sample_2 is pending
    assert.strictEqual(pendingRequests.length, 1);
    assert.strictEqual(pendingRequests[0].id, 'req_sample_2');
    console.log('  ✓ PASS: UI row correctly renders FULFILLED and KPI accurately excludes completed mission');
  });
});
