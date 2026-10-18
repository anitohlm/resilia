/**
 * Resilia Repositories
 * Abstract local IndexedDB data access, offline-first durable writes,
 * and pending-event queue synchronization.
 */

import {
  Alert,
  AssistancePriority,
  AssistanceRequest,
  AssistanceStatus,
  AuditEntry,
  Community,
  Incident,
  IncidentStatus,
  InventoryMovement,
  Mission,
  MissionStatus,
  Report,
  Resource,
  ResponderOperationalStatus,
  RiverAlertLevel,
  Shelter,
  ShelterStatus,
  User,
  Verification,
  VerificationState,
  TriageCategory,
  TriageRecord,
  RationPackageType,
  HouseholdClaimCard,
  RationDistributionRecord,
  MissingKinStatus,
  MissingKinRecord,
  MutualAidType,
  MutualAidCategory,
  MutualAidStatus,
  MutualAidPost,
  FloodExposureRecord,
  DiseaseSymptomCheck,
  OutbreakAdvisory,
} from '../../types';
import { localDB, STORES } from '../offline/db';
import { EventQueueService, generateUUID } from '../offline/eventQueue';

// --- AUDIT REPOSITORY ---
export class AuditRepository {
  public static async log(
    actor: { id: string; name: string; role: any },
    action: string,
    entityType: string,
    entityId: string,
    rationale: string,
    origin = 'BROWSER_LOCAL'
  ): Promise<AuditEntry> {
    const entry: AuditEntry = {
      id: 'aud_' + generateUUID(),
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action,
      entityType,
      entityId,
      rationale,
      timestamp: new Date().toISOString(),
      origin,
    };
    await localDB.put(STORES.AUDIT, entry);
    return entry;
  }

  public static async getAll(): Promise<AuditEntry[]> {
    const all = await localDB.getAll<AuditEntry>(STORES.AUDIT);
    return all.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
}

// --- SHELTER REPOSITORY ---
export class ShelterRepository {
  public static async getAll(): Promise<Shelter[]> {
    return localDB.getAll<Shelter>(STORES.SHELTERS);
  }

  public static async getById(id: string): Promise<Shelter | undefined> {
    return localDB.get<Shelter>(STORES.SHELTERS, id);
  }

  public static async updateCapacity(
    shelterId: string,
    newOccupancy: number,
    actor: User,
    rationale: string
  ): Promise<Shelter> {
    return this.updateShelterFeatures(shelterId, { capacityCurrent: newOccupancy }, actor, rationale);
  }

  public static async updateShelterFeatures(
    shelterId: string,
    updates: Partial<Pick<Shelter, 'capacityTotal' | 'capacityCurrent' | 'status' | 'isAccessibleWheelchair' | 'hasBackupPower' | 'hasMedicalClinic' | 'hasPotableWater' | 'contactPerson' | 'contactPhone' | 'hasLactatingStation' | 'hasPetFriendlyZone' | 'hasMedicalOxygen' | 'hasGroundFloorAccess' | 'pwdCapacity' | 'pwdCurrent' | 'petCapacity' | 'petCurrent'>>,
    actor: User,
    rationale: string
  ): Promise<Shelter> {
    if (actor.role !== 'COORDINATOR') {
      throw new Error('Permission Denied: Only Disaster Coordinators can modify shelter features and capacities.');
    }

    const shelter = await localDB.get<Shelter>(STORES.SHELTERS, shelterId);
    if (!shelter) {
      throw new Error(`Shelter ${shelterId} not found.`);
    }

    if (updates.capacityTotal !== undefined) {
      if (updates.capacityTotal <= 0) {
        throw new Error('Total capacity must be greater than zero.');
      }
      shelter.capacityTotal = updates.capacityTotal;
    }

    if (updates.capacityCurrent !== undefined) {
      if (updates.capacityCurrent < 0 || updates.capacityCurrent > shelter.capacityTotal * 1.5) {
        throw new Error(`Occupancy ${updates.capacityCurrent} is out of safe capacity bounds.`);
      }
      shelter.capacityCurrent = updates.capacityCurrent;
    }

    if (updates.isAccessibleWheelchair !== undefined) {
      shelter.isAccessibleWheelchair = updates.isAccessibleWheelchair;
    }
    if (updates.hasBackupPower !== undefined) {
      shelter.hasBackupPower = updates.hasBackupPower;
    }
    if (updates.hasMedicalClinic !== undefined) {
      shelter.hasMedicalClinic = updates.hasMedicalClinic;
    }
    if (updates.hasPotableWater !== undefined) {
      shelter.hasPotableWater = updates.hasPotableWater;
    }
    if (updates.hasLactatingStation !== undefined) {
      shelter.hasLactatingStation = updates.hasLactatingStation;
    }
    if (updates.hasPetFriendlyZone !== undefined) {
      shelter.hasPetFriendlyZone = updates.hasPetFriendlyZone;
    }
    if (updates.hasMedicalOxygen !== undefined) {
      shelter.hasMedicalOxygen = updates.hasMedicalOxygen;
    }
    if (updates.hasGroundFloorAccess !== undefined) {
      shelter.hasGroundFloorAccess = updates.hasGroundFloorAccess;
    }
    if (updates.pwdCapacity !== undefined) {
      shelter.pwdCapacity = updates.pwdCapacity;
    }
    if (updates.pwdCurrent !== undefined) {
      shelter.pwdCurrent = updates.pwdCurrent;
    }
    if (updates.petCapacity !== undefined) {
      shelter.petCapacity = updates.petCapacity;
    }
    if (updates.petCurrent !== undefined) {
      shelter.petCurrent = updates.petCurrent;
    }
    if (updates.contactPerson !== undefined) {
      shelter.contactPerson = updates.contactPerson;
    }
    if (updates.contactPhone !== undefined) {
      shelter.contactPhone = updates.contactPhone;
    }

    if (updates.status !== undefined) {
      shelter.status = updates.status;
    } else {
      if (shelter.capacityCurrent >= shelter.capacityTotal) {
        shelter.status = 'FULL';
      } else if (shelter.capacityCurrent >= shelter.capacityTotal * 0.85) {
        shelter.status = 'NEAR_CAPACITY';
      } else {
        shelter.status = 'OPEN';
      }
    }

    shelter.lastUpdated = new Date().toISOString();
    shelter.verifiedAt = new Date().toISOString();
    shelter.verifiedBy = `${actor.name} (${actor.role})`;

    await EventQueueService.recordLocalWrite('shelter', STORES.SHELTERS, shelter, 'UPDATE', actor.id);
    await AuditRepository.log(
      actor,
      'UPDATE_SHELTER_FEATURES',
      'shelter',
      shelterId,
      `Updated shelter features: Capacity ${shelter.capacityCurrent}/${shelter.capacityTotal}, Status: ${shelter.status}, Wheelchair: ${shelter.isAccessibleWheelchair}, Generator: ${shelter.hasBackupPower}. ${rationale}`
    );

    return shelter;
  }
}

// --- RESOURCE REPOSITORY ---
export class ResourceRepository {
  public static async getAll(): Promise<Resource[]> {
    return localDB.getAll<Resource>(STORES.RESOURCES);
  }

  public static async getById(id: string): Promise<Resource | undefined> {
    return localDB.get<Resource>(STORES.RESOURCES, id);
  }

  public static async getMovements(): Promise<InventoryMovement[]> {
    const all = await localDB.getAll<InventoryMovement>(STORES.MOVEMENTS);
    return all.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public static async recordMovement(
    resourceId: string,
    deltaQuantity: number,
    movementType: InventoryMovement['movementType'],
    sourceLocation: string,
    destinationLocation: string,
    actor: User,
    notes: string
  ): Promise<{ resource: Resource; movement: InventoryMovement }> {
    if (actor.role !== 'COORDINATOR') {
      throw new Error('Permission Denied: Only Disaster Coordinators can record inventory movements.');
    }

    const resource = await localDB.get<Resource>(STORES.RESOURCES, resourceId);
    if (!resource) {
      throw new Error(`Resource ${resourceId} not found.`);
    }

    const newQuantity = resource.quantity + deltaQuantity;
    if (newQuantity < 0) {
      throw new Error(
        `Insufficient inventory. Requested reduction ${Math.abs(deltaQuantity)} exceeds available ${resource.quantity} ${resource.unit}.`
      );
    }

    resource.quantity = newQuantity;
    resource.lastUpdated = new Date().toISOString();

    if (resource.quantity === 0) {
      resource.status = 'DEPLETED';
      resource.estimatedDaysRemaining = 0;
    } else if (resource.consumptionRatePerDay > 0) {
      resource.estimatedDaysRemaining = Number((resource.quantity / resource.consumptionRatePerDay).toFixed(1));
      resource.status = resource.estimatedDaysRemaining < 1.0 ? 'LOW' : 'AVAILABLE';
    } else {
      resource.status = 'AVAILABLE';
    }

    const movement: InventoryMovement = {
      id: 'mov_' + generateUUID(),
      resourceId: resource.id,
      resourceName: resource.name,
      deltaQuantity,
      movementType,
      sourceLocation,
      destinationLocation,
      actorId: actor.id,
      actorName: actor.name,
      notes,
      timestamp: new Date().toISOString(),
    };

    // Durable writes
    await EventQueueService.recordLocalWrite('resource', STORES.RESOURCES, resource, 'UPDATE', actor.id);
    await EventQueueService.recordLocalWrite('movement', STORES.MOVEMENTS, movement, 'CREATE', actor.id);

    await AuditRepository.log(
      actor,
      'RECORD_INVENTORY_MOVEMENT',
      'resource',
      resource.id,
      `${movementType}: ${deltaQuantity > 0 ? '+' : ''}${deltaQuantity} ${resource.unit}. New balance: ${resource.quantity}. Notes: ${notes}`
    );

    return { resource, movement };
  }
}

// --- INCIDENT & REPORT REPOSITORY ---
export class IncidentRepository {
  public static async getAll(): Promise<Incident[]> {
    const all = await localDB.getAll<Incident>(STORES.INCIDENTS);
    return all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public static async getById(id: string): Promise<Incident | undefined> {
    return localDB.get<Incident>(STORES.INCIDENTS, id);
  }

  public static async getReportsForIncident(incidentId: string): Promise<Report[]> {
    const all = await localDB.getAll<Report>(STORES.REPORTS);
    return all.filter((r) => r.incidentId === incidentId);
  }

  public static async createIncident(
    data: Omit<Incident, 'id' | 'createdAt' | 'supportingReportsCount' | 'contradictingReportsCount'>,
    actor: User
  ): Promise<Incident> {
    if (actor.role !== 'RESIDENT' && actor.role !== 'RESPONDER') {
      throw new Error(
        'RBAC Permission Denied: Only residents and field responders can report emergency incidents.'
      );
    }

    const incident: Incident = {
      ...data,
      id: 'inc_' + generateUUID(),
      createdAt: new Date().toISOString(),
      supportingReportsCount: 1,
      contradictingReportsCount: 0,
      responderStatus: data.assignedResponderId ? 'DISPATCHED' : 'UNASSIGNED',
    };

    const initialReport: Report = {
      id: 'rep_' + generateUUID(),
      incidentId: incident.id,
      reporterId: actor.id,
      reporterName: actor.name,
      reporterRole: actor.role,
      reportType: 'INITIAL',
      observation: incident.description,
      floodDepthCm: incident.floodDepthCm,
      lat: incident.lat,
      lng: incident.lng,
      timestamp: incident.createdAt,
    };

    await EventQueueService.recordLocalWrite('incident', STORES.INCIDENTS, incident, 'CREATE', actor.id);
    await EventQueueService.recordLocalWrite('report', STORES.REPORTS, initialReport, 'CREATE', actor.id);

    await AuditRepository.log(
      actor,
      'CREATE_INCIDENT',
      'incident',
      incident.id,
      `Reported ${incident.type} at ${incident.locationName} (${incident.severity})`
    );

    return incident;
  }

  public static async addCorroborationOrContradiction(
    incidentId: string,
    observation: string,
    reportType: 'CORROBORATION' | 'CONTRADICTION',
    roadStatus: Report['roadStatus'],
    floodDepthCm: number | undefined,
    lat: number,
    lng: number,
    actor: User
  ): Promise<{ incident: Incident; report: Report }> {
    const incident = await localDB.get<Incident>(STORES.INCIDENTS, incidentId);
    if (!incident) {
      throw new Error(`Incident ${incidentId} not found.`);
    }

    const report: Report = {
      id: 'rep_' + generateUUID(),
      incidentId,
      reporterId: actor.id,
      reporterName: actor.name,
      reporterRole: actor.role,
      reportType,
      observation,
      roadStatus,
      floodDepthCm,
      lat,
      lng,
      timestamp: new Date().toISOString(),
    };

    if (reportType === 'CORROBORATION') {
      incident.supportingReportsCount += 1;
    } else {
      incident.contradictingReportsCount += 1;
    }

    await EventQueueService.recordLocalWrite('incident', STORES.INCIDENTS, incident, 'UPDATE', actor.id);
    await EventQueueService.recordLocalWrite('report', STORES.REPORTS, report, 'CREATE', actor.id);

    await AuditRepository.log(
      actor,
      `ADD_${reportType}`,
      'incident',
      incidentId,
      `Submitted ${reportType} observation: "${observation}"`
    );

    return { incident, report };
  }

  public static async verifyIncident(
    incidentId: string,
    newStatus: 'VERIFIED' | 'CONTRADICTED' | 'RESOLVED',
    rationale: string,
    actor: User
  ): Promise<Incident> {
    if (actor.role !== 'COORDINATOR') {
      throw new Error('Unauthorized: Only coordinators can verify or contradict incidents.');
    }

    const incident = await localDB.get<Incident>(STORES.INCIDENTS, incidentId);
    if (!incident) {
      throw new Error(`Incident ${incidentId} not found.`);
    }

    incident.status = newStatus;
    incident.verifiedAt = new Date().toISOString();
    incident.verifiedBy = `${actor.name} (${actor.role})`;
    incident.verificationRationale = rationale;

    const verification: Verification = {
      id: 'ver_' + generateUUID(),
      targetType: 'INCIDENT',
      targetId: incidentId,
      status: newStatus === 'VERIFIED' ? 'VERIFIED' : newStatus === 'CONTRADICTED' ? 'CONTRADICTED' : 'CORROBORATED',
      actorId: actor.id,
      actorName: actor.name,
      rationale,
      timestamp: new Date().toISOString(),
    };

    await EventQueueService.recordLocalWrite('incident', STORES.INCIDENTS, incident, 'UPDATE', actor.id);
    await EventQueueService.recordLocalWrite('verification', STORES.VERIFICATIONS, verification, 'CREATE', actor.id);

    await AuditRepository.log(
      actor,
      'VERIFY_INCIDENT',
      'incident',
      incidentId,
      `Marked as ${newStatus}. Rationale: ${rationale}`
    );

    return incident;
  }

  /**
   * RBAC: Coordinator assigns a specific responder to an incident
   */
  public static async assignResponder(
    incidentId: string,
    responderId: string,
    responderName: string,
    actor: User,
    notes?: string
  ): Promise<Incident> {
    if (actor.role !== 'COORDINATOR') {
      throw new Error('RBAC Permission Denied: Only Disaster Coordinators can assign responders to incidents.');
    }

    const incident = await localDB.get<Incident>(STORES.INCIDENTS, incidentId);
    if (!incident) {
      throw new Error(`Incident ${incidentId} not found.`);
    }

    incident.assignedResponderId = responderId;
    incident.assignedResponderName = responderName;
    incident.assignedAt = new Date().toISOString();
    incident.responderStatus = 'DISPATCHED';
    if (notes) {
      incident.responderNotes = notes;
    }

    await EventQueueService.recordLocalWrite('incident', STORES.INCIDENTS, incident, 'UPDATE', actor.id);
    await AuditRepository.log(
      actor,
      'ASSIGN_RESPONDER_TO_INCIDENT',
      'incident',
      incident.id,
      `Coordinator ${actor.name} assigned responder ${responderName} (${responderId}) to incident. Notes: ${notes || 'None'}`
    );

    // Auto-create or update corresponding Mission so the dispatch immediately shows up in Responder's portal
    try {
      const allMissions = await localDB.getAll<Mission>(STORES.MISSIONS);
      const existing = allMissions.find(
        (m) => m.assistanceRequestId === incident.id || m.evidenceRecordIds?.includes(incident.id)
      );
      if (existing) {
        existing.assignedResponderId = responderId;
        existing.assignedResponderName = responderName;
        existing.status = 'ASSIGNED';
        existing.updatedAt = new Date().toISOString();
        await EventQueueService.recordLocalWrite('mission', STORES.MISSIONS, existing, 'UPDATE', actor.id);
      } else {
        const incidentMission: Mission = {
          id: 'mis_inc_' + incident.id.replace(/[^a-zA-Z0-9]/g, '_'),
          title: `Incident Response: ${incident.title}`,
          assistanceRequestId: incident.id,
          priority: incident.severity === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
          rationale: `Coordinator direct dispatch for verified hazard: ${incident.title}. ${notes ? `Instructions: ${notes}` : ''}`,
          pickupLocation: incident.locationName,
          destinationLocation: incident.locationName,
          lat: incident.lat,
          lng: incident.lng,
          requestedAssistance: incident.description,
          vulnerabilitySummary: `Field Incident ${incident.type} (${incident.severity}). Hazard Status: ${incident.status}`,
          assignedResponderId: responderId,
          assignedResponderName: responderName,
          assignedVehicleType: 'Rescue Response Vehicle 161',
          status: 'ASSIGNED',
          statusHistory: [
            {
              status: 'ASSIGNED',
              actorId: actor.id,
              actorName: actor.name,
              timestamp: new Date().toISOString(),
              note: notes || `Direct incident dispatch to ${responderName}`,
            },
          ],
          evidenceRecordIds: [incident.id],
          requiresHumanApproval: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await EventQueueService.recordLocalWrite('mission', STORES.MISSIONS, incidentMission, 'CREATE', actor.id);
      }
    } catch (missionErr) {
      console.warn('Could not auto-generate mission for incident dispatch:', missionErr);
    }

    return incident;
  }

  /**
   * RBAC: Responder responds to assigned incident (Acknowledged, En Route, On Scene, Resolved)
   */
  public static async updateIncidentResponderStatus(
    incidentId: string,
    newStatus: ResponderOperationalStatus,
    actor: User,
    notes?: string
  ): Promise<Incident> {
    if (actor.role !== 'RESPONDER' && actor.role !== 'COORDINATOR') {
      throw new Error('RBAC Permission Denied: Only Responders (or Coordinators) can respond to incident dispatches.');
    }

    const incident = await localDB.get<Incident>(STORES.INCIDENTS, incidentId);
    if (!incident) {
      throw new Error(`Incident ${incidentId} not found.`);
    }

    incident.responderStatus = newStatus;
    if (newStatus === 'RESOLVED') {
      incident.status = 'RESOLVED';
    }
    if (notes) {
      const existing = incident.responderNotes ? `${incident.responderNotes} | ` : '';
      incident.responderNotes = `${existing}[${newStatus}] ${notes}`;
    }

    await EventQueueService.recordLocalWrite('incident', STORES.INCIDENTS, incident, 'UPDATE', actor.id);
    await AuditRepository.log(
      actor,
      'UPDATE_INCIDENT_RESPONDER_STATUS',
      'incident',
      incident.id,
      `${actor.name} (${actor.role}) updated responder status to ${newStatus}. Notes: ${notes || 'None'}`
    );

    return incident;
  }
}

// --- ASSISTANCE REQUEST REPOSITORY ---
export class AssistanceRepository {
  public static async getAll(): Promise<AssistanceRequest[]> {
    const all = await localDB.getAll<AssistanceRequest>(STORES.ASSISTANCE);
    return all.sort((a, b) => b.priorityScore - a.priorityScore);
  }

  public static async getById(id: string): Promise<AssistanceRequest | undefined> {
    return localDB.get<AssistanceRequest>(STORES.ASSISTANCE, id);
  }

  public static async createRequest(
    data: Omit<AssistanceRequest, 'id' | 'createdAt' | 'updatedAt' | 'priority' | 'priorityScore' | 'priorityRationale' | 'status'>,
    actor: User
  ): Promise<AssistanceRequest> {
    // Boundary validation: people count must be at least 1, coordinates must be finite
    const peopleCount = Math.max(1, Math.floor(Number(data.peopleCount) || 1));
    const lat = Number.isFinite(data.lat) ? Number(data.lat) : 14.658;
    const lng = Number.isFinite(data.lng) ? Number(data.lng) : 121.102;

    const vulnerabilityNeeds = {
      elderlyCount: Math.max(0, Math.floor(Number(data.vulnerabilityNeeds?.elderlyCount) || 0)),
      infantCount: Math.max(0, Math.floor(Number(data.vulnerabilityNeeds?.infantCount) || 0)),
      wheelchairUser: Boolean(data.vulnerabilityNeeds?.wheelchairUser),
      bedridden: Boolean(data.vulnerabilityNeeds?.bedridden),
      medicalNeeds: Array.isArray(data.vulnerabilityNeeds?.medicalNeeds) ? data.vulnerabilityNeeds.medicalNeeds : [],
    };

    // Deterministic transparent prioritization rules (Section 6 & 11)
    let score = 30; // base score
    const rationale: string[] = [];

    if (data.category === 'EMERGENCY_RESCUE') {
      score += 40;
      rationale.push('Emergency rescue category requested (+40)');
    } else if (data.category === 'EVACUATION') {
      score += 30;
      rationale.push('Immediate evacuation requested (+30)');
    } else if (data.category === 'MEDICINE' || data.category === 'WATER') {
      score += 20;
      rationale.push('Critical health sustenance requested (+20)');
    }

    if (vulnerabilityNeeds.wheelchairUser) {
      score += 25;
      rationale.push('Wheelchair user with limited flood self-evacuation (+25)');
    }
    if (vulnerabilityNeeds.elderlyCount > 0) {
      score += 15 * Math.min(2, vulnerabilityNeeds.elderlyCount);
      rationale.push(`${vulnerabilityNeeds.elderlyCount} senior citizen(s) present (+${15 * Math.min(2, vulnerabilityNeeds.elderlyCount)})`);
    }
    if (vulnerabilityNeeds.infantCount > 0) {
      score += 20 * Math.min(2, vulnerabilityNeeds.infantCount);
      rationale.push(`${vulnerabilityNeeds.infantCount} infant(s) present (+${20 * Math.min(2, vulnerabilityNeeds.infantCount)})`);
    }
    if (vulnerabilityNeeds.bedridden) {
      score += 30;
      rationale.push('Bedridden patient requiring stretcher evacuation (+30)');
    }

    score = Math.min(100, score);

    let priority: AssistancePriority = 'LOW';
    if (score >= 85) priority = 'CRITICAL';
    else if (score >= 65) priority = 'HIGH';
    else if (score >= 45) priority = 'MEDIUM';

    const req: AssistanceRequest = {
      ...data,
      peopleCount,
      lat,
      lng,
      vulnerabilityNeeds,
      id: 'req_' + generateUUID(),
      priority,
      priorityScore: score,
      priorityRationale: rationale,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await EventQueueService.recordLocalWrite('assistance_request', STORES.ASSISTANCE, req, 'CREATE', actor.id);
    await AuditRepository.log(
      actor,
      'CREATE_ASSISTANCE_REQUEST',
      'assistance_request',
      req.id,
      `Created request for ${req.peopleCount} people at ${req.locationName}. Priority: ${priority} (${score}/100)`
    );

    return req;
  }

  public static async updateStatus(
    requestId: string,
    newStatus: AssistanceStatus,
    actor: User,
    assignedMissionId?: string
  ): Promise<AssistanceRequest> {
    const req = await localDB.get<AssistanceRequest>(STORES.ASSISTANCE, requestId);
    if (!req) {
      throw new Error(`Assistance request ${requestId} not found.`);
    }

    req.status = newStatus;
    if (assignedMissionId !== undefined) {
      req.assignedMissionId = assignedMissionId;
    }
    req.updatedAt = new Date().toISOString();

    await EventQueueService.recordLocalWrite('assistance_request', STORES.ASSISTANCE, req, 'UPDATE', actor.id);
    await AuditRepository.log(
      actor,
      'UPDATE_ASSISTANCE_STATUS',
      'assistance_request',
      requestId,
      `Updated request status to ${newStatus}${assignedMissionId ? ` (Linked mission: ${assignedMissionId})` : ''}`
    );

    return req;
  }
}

// Role-based state transition enforcement (Section 5 & 6)
export const VALID_MISSION_TRANSITIONS: Record<MissionStatus, MissionStatus[]> = {
  PROPOSED: ['APPROVED', 'REJECTED', 'CANCELLED'],
  APPROVED: ['ASSIGNED', 'ACCEPTED', 'CANCELLED'],
  ASSIGNED: ['ACCEPTED', 'CANCELLED'],
  ACCEPTED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  REJECTED: [],
  CANCELLED: [],
};

// --- MISSION REPOSITORY ---
export class MissionRepository {
  public static async getAll(): Promise<Mission[]> {
    const all = await localDB.getAll<Mission>(STORES.MISSIONS);
    return all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public static async getById(id: string): Promise<Mission | undefined> {
    return localDB.get<Mission>(STORES.MISSIONS, id);
  }

  /**
   * Assign a responder to an approved mission and link back to assistance request
   */
  public static async assignResponder(
    missionId: string,
    responderId: string,
    responderName: string,
    vehicleType: string,
    actor: User,
    notes?: string
  ): Promise<Mission> {
    if (actor.role !== 'COORDINATOR') {
      throw new Error('Unauthorized: Only coordinators can assign responders to missions.');
    }

    const mission = await localDB.get<Mission>(STORES.MISSIONS, missionId);
    if (!mission) {
      throw new Error(`Mission ${missionId} not found.`);
    }

    if (mission.status !== 'APPROVED' && mission.status !== 'ASSIGNED') {
      throw new Error(`Cannot assign responder: mission must be APPROVED (current status: ${mission.status}).`);
    }

    mission.assignedResponderId = responderId;
    mission.assignedResponderName = responderName;
    if (vehicleType) {
      mission.assignedVehicleType = vehicleType;
    }
    mission.status = 'ASSIGNED';
    mission.updatedAt = new Date().toISOString();
    mission.statusHistory.push({
      status: 'ASSIGNED',
      actorId: actor.id,
      actorName: actor.name,
      timestamp: mission.updatedAt,
      note: notes || `Assigned to responder ${responderName}`,
    });

    await EventQueueService.recordLocalWrite('mission', STORES.MISSIONS, mission, 'UPDATE', actor.id);
    await AuditRepository.log(
      actor,
      'ASSIGN_RESPONDER_TO_MISSION',
      'mission',
      missionId,
      `Assigned to responder ${responderName} (${responderId}). Vehicle: ${vehicleType}. Notes: ${notes || 'None'}`
    );

    // Bidirectional sync: Update linked AssistanceRequest status to ASSIGNED
    if (mission.assistanceRequestId) {
      try {
        const linkedReq = await localDB.get<AssistanceRequest>(STORES.ASSISTANCE, mission.assistanceRequestId);
        if (linkedReq) {
          linkedReq.status = 'ASSIGNED';
          linkedReq.assignedMissionId = mission.id;
          linkedReq.updatedAt = mission.updatedAt;
          await EventQueueService.recordLocalWrite('assistance_request', STORES.ASSISTANCE, linkedReq, 'UPDATE', actor.id);
        }
      } catch (err) {
        console.warn('Could not update linked assistance request on mission assignment:', err);
      }
    }

    return mission;
  }

  public static async updateMissionStatus(
    missionId: string,
    newStatus: MissionStatus,
    actor: User,
    note?: string
  ): Promise<Mission> {
    const mission = await localDB.get<Mission>(STORES.MISSIONS, missionId);
    if (!mission) {
      throw new Error(`Mission ${missionId} not found.`);
    }

    if (!VALID_MISSION_TRANSITIONS[mission.status].includes(newStatus)) {
      throw new Error(`Invalid status transition from ${mission.status} to ${newStatus}.`);
    }

    // Authorization checks
    if (newStatus === 'APPROVED' || newStatus === 'REJECTED') {
      if (actor.role !== 'COORDINATOR') {
        throw new Error('Unauthorized: Only coordinators can approve or reject mission proposals.');
      }
    }

    if (newStatus === 'ASSIGNED') {
      if (actor.role !== 'COORDINATOR') {
        throw new Error('Unauthorized: Only coordinators can assign responders.');
      }
    }

    if (newStatus === 'ACCEPTED' || newStatus === 'IN_PROGRESS' || newStatus === 'COMPLETED') {
      if (actor.role !== 'RESPONDER' && actor.role !== 'COORDINATOR') {
        throw new Error('Unauthorized: Only assigned responders or coordinators can perform field updates.');
      }
    }

    mission.status = newStatus;
    mission.updatedAt = new Date().toISOString();
    mission.statusHistory.push({
      status: newStatus,
      actorId: actor.id,
      actorName: actor.name,
      timestamp: mission.updatedAt,
      note,
    });

    await EventQueueService.recordLocalWrite('mission', STORES.MISSIONS, mission, 'UPDATE', actor.id);
    await AuditRepository.log(
      actor,
      'UPDATE_MISSION_STATUS',
      'mission',
      missionId,
      `Transitioned mission to ${newStatus}. Note: ${note || 'None'}`
    );

    // Bidirectional sync: Propagate mission progress to linked AssistanceRequest
    if (mission.assistanceRequestId) {
      try {
        const linkedReq = await localDB.get<AssistanceRequest>(STORES.ASSISTANCE, mission.assistanceRequestId);
        if (linkedReq) {
          let reqStatus: AssistanceStatus = linkedReq.status;
          if (newStatus === 'ACCEPTED' || newStatus === 'IN_PROGRESS') {
            reqStatus = 'IN_PROGRESS';
          } else if (newStatus === 'COMPLETED') {
            reqStatus = 'FULFILLED';
          } else if (newStatus === 'CANCELLED' || newStatus === 'REJECTED') {
            reqStatus = 'PENDING';
          }
          linkedReq.status = reqStatus;
          linkedReq.assignedMissionId = mission.id;
          linkedReq.updatedAt = mission.updatedAt;
          await EventQueueService.recordLocalWrite('assistance_request', STORES.ASSISTANCE, linkedReq, 'UPDATE', actor.id);
        }
      } catch (err) {
        console.warn('Could not update linked assistance request status on mission change:', err);
      }

      // Bidirectional sync: Propagate mission progress to linked Incident if applicable
      try {
        const linkedInc = await localDB.get<Incident>(STORES.INCIDENTS, mission.assistanceRequestId);
        if (linkedInc) {
          if (newStatus === 'ACCEPTED') {
            linkedInc.responderStatus = 'DISPATCHED';
          } else if (newStatus === 'IN_PROGRESS') {
            linkedInc.responderStatus = 'EN_ROUTE';
          } else if (newStatus === 'COMPLETED') {
            linkedInc.responderStatus = 'RESOLVED';
            linkedInc.status = 'RESOLVED';
          }
          await EventQueueService.recordLocalWrite('incident', STORES.INCIDENTS, linkedInc, 'UPDATE', actor.id);
        }
      } catch (err) {
        console.warn('Could not update linked incident status on mission change:', err);
      }
    }

    return mission;
  }

  public static async requestBackup(
    missionId: string,
    backupDetails: {
      resourceType: string;
      quantity?: number;
      reason: string;
      locationName: string;
    },
    actor: User
  ): Promise<Mission> {
    const mission = await localDB.get<Mission>(STORES.MISSIONS, missionId);
    if (!mission) {
      throw new Error(`Mission ${missionId} not found.`);
    }

    const note = `[BACKUP REQUESTED: ${backupDetails.resourceType}] Qty: ${backupDetails.quantity || 'N/A'} - ${backupDetails.reason} at ${backupDetails.locationName}`;
    mission.updatedAt = new Date().toISOString();
    mission.statusHistory.push({
      status: mission.status,
      actorId: actor.id,
      actorName: actor.name,
      timestamp: mission.updatedAt,
      note,
    });

    await EventQueueService.recordLocalWrite('mission', STORES.MISSIONS, mission, 'UPDATE', actor.id);
    await AuditRepository.log(
      actor,
      'REQUEST_BACKUP',
      'mission',
      missionId,
      note
    );

    return mission;
  }
}

// --- ALERT & DISASTER REPOSITORY (COORDINATOR-AUTHORITATIVE) ---
export interface TriggerDisasterParams {
  title: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  message: string;
  source?: string;
  riverWaterLevelMeters?: number;
  riverAlertLevel?: RiverAlertLevel;
  weatherCondition?: string;
  rainfallStatus?: string;
  disasterType?: string;
  disasterName?: string;
  daysUntilLandfall?: number;
  expectedLandfall?: string;
  preparations?: string[];
  affectedZones?: string[];
  signalLevel?: number;
  isExercise?: boolean;
}

export interface PostDisasterAdvisoryParams {
  title: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  message: string;
  source?: string;
  disasterType?: string;
  disasterName?: string;
  daysUntilLandfall?: number;
  expectedLandfall?: string;
  preparations?: string[];
  affectedZones?: string[];
  signalLevel?: number;
  isExercise?: boolean;
  riverWaterLevelMeters?: number;
  riverAlertLevel?: RiverAlertLevel;
  weatherCondition?: string;
  rainfallStatus?: string;
}

export class AlertRepository {
  public static async getAll(): Promise<Alert[]> {
    return localDB.getAll<Alert>(STORES.ALERTS);
  }

  public static async getActive(): Promise<Alert[]> {
    const all = await localDB.getAll<Alert>(STORES.ALERTS);
    return all.filter((a) => a.active);
  }

  public static async getById(id: string): Promise<Alert | undefined> {
    return localDB.get<Alert>(STORES.ALERTS, id);
  }

  /**
   * Only Disaster Coordinators have the authority to post or broadcast incoming disaster advisories.
   */
  public static async postDisasterAdvisory(
    params: PostDisasterAdvisoryParams,
    actor: User
  ): Promise<Alert> {
    if (actor.role !== 'COORDINATOR') {
      throw new Error('Permission Denied: Only Disaster Coordinators have the authority to post incoming disaster advisories.');
    }

    const durationDays = typeof params.daysUntilLandfall === 'number' && params.daysUntilLandfall > 0
      ? params.daysUntilLandfall + 2
      : 3;

    const newAlert: Alert = {
      id: 'alert_' + generateUUID(),
      title: params.title,
      severity: params.severity,
      message: params.message,
      source: params.source || `${actor.name} (Disaster Operations Coordinator, Marikina CDRRMO)`,
      issuedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + durationDays * 86400000).toISOString(),
      active: true,
      isExercise: params.isExercise ?? false,
      disasterType: params.disasterType,
      disasterName: params.disasterName,
      daysUntilLandfall: params.daysUntilLandfall,
      expectedLandfall: params.expectedLandfall,
      preparations: params.preparations,
      affectedZones: params.affectedZones,
      signalLevel: params.signalLevel,
    };

    // Save alert into local IndexedDB
    await localDB.put(STORES.ALERTS, newAlert);

    // Update community status if parameters provided
    const community = await localDB.get<Community>(STORES.COMMUNITY, 'comm_marikina_tumana_malanday');
    if (community) {
      if (params.riverWaterLevelMeters !== undefined) {
        community.riverWaterLevelMeters = params.riverWaterLevelMeters;
      }
      if (params.riverAlertLevel !== undefined) {
        community.riverAlertLevel = params.riverAlertLevel;
      }
      if (params.weatherCondition) {
        community.weatherCondition = params.weatherCondition;
      }
      if (params.rainfallStatus) {
        community.rainfallStatus = params.rainfallStatus;
      }
      community.lastUpdated = new Date().toISOString();
      await localDB.put(STORES.COMMUNITY, community);
    }

    // Record local write & log in audit ledger
    await EventQueueService.recordLocalWrite('alert', STORES.ALERTS, newAlert, 'CREATE', actor.id);
    await AuditRepository.log(
      actor,
      'POST_DISASTER_ADVISORY',
      'alert',
      newAlert.id,
      `Coordinator posted incoming disaster advisory: "${params.title}" (Days to landfall: ${params.daysUntilLandfall ?? 'N/A'}, Severity: ${params.severity})`
    );

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('resilia_local_write', { detail: { entity: newAlert } }));
    }
    return newAlert;
  }

  /**
   * Only Disaster Coordinators can dismiss or deactivate disaster alerts.
   */
  public static async dismissAlert(alertId: string, actor: User): Promise<void> {
    if (actor.role !== 'COORDINATOR') {
      throw new Error('Permission Denied: Only Disaster Coordinators have the authority to dismiss disaster alerts.');
    }
    const alert = await localDB.get<Alert>(STORES.ALERTS, alertId);
    if (alert) {
      alert.active = false;
      await localDB.put(STORES.ALERTS, alert);
      await EventQueueService.recordLocalWrite('alert', STORES.ALERTS, alert, 'UPDATE', actor.id);
      await AuditRepository.log(
        actor,
        'DISMISS_ALERT',
        'alert',
        alert.id,
        `Coordinator dismissed alert: "${alert.title}"`
      );
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('resilia_local_write'));
      }
    }
  }
}

export class DisasterRepository {
  public static async getAllAlerts(): Promise<Alert[]> {
    return AlertRepository.getAll();
  }

  public static async getActiveAlerts(): Promise<Alert[]> {
    return AlertRepository.getActive();
  }

  public static async postDisasterAdvisory(
    params: PostDisasterAdvisoryParams,
    actor: User
  ): Promise<Alert> {
    return AlertRepository.postDisasterAdvisory(params, actor);
  }

  /**
   * Only Disaster Coordinators can trigger or declare an area disaster.
   */
  public static async triggerAreaDisaster(
    params: TriggerDisasterParams,
    actor: User
  ): Promise<Alert> {
    if (actor.role !== 'COORDINATOR') {
      throw new Error('Permission Denied: Only Disaster Coordinators have the authority to trigger or broadcast sector disaster protocols.');
    }

    const newAlert: Alert = {
      id: 'alert_' + generateUUID(),
      title: params.title,
      severity: params.severity,
      message: params.message,
      source: params.source || `${actor.name} (Disaster Operations Coordinator, CDRRMO)`,
      issuedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
      active: true,
      disasterType: params.disasterType,
      disasterName: params.disasterName,
      daysUntilLandfall: params.daysUntilLandfall,
      expectedLandfall: params.expectedLandfall,
      preparations: params.preparations,
      affectedZones: params.affectedZones,
      signalLevel: params.signalLevel,
      isExercise: params.isExercise,
    };

    // Save alert into local IndexedDB
    await localDB.put(STORES.ALERTS, newAlert);

    // Update community status if parameters provided
    const community = await localDB.get<Community>(STORES.COMMUNITY, 'comm_marikina_tumana_malanday');
    if (community) {
      if (params.riverWaterLevelMeters !== undefined) {
        community.riverWaterLevelMeters = params.riverWaterLevelMeters;
      }
      if (params.riverAlertLevel !== undefined) {
        community.riverAlertLevel = params.riverAlertLevel;
      }
      if (params.weatherCondition) {
        community.weatherCondition = params.weatherCondition;
      }
      if (params.rainfallStatus) {
        community.rainfallStatus = params.rainfallStatus;
      }
      community.lastUpdated = new Date().toISOString();
      await localDB.put(STORES.COMMUNITY, community);
    }

    // Record local write & log in audit ledger
    await EventQueueService.recordLocalWrite('alert' as any, STORES.ALERTS, newAlert, 'CREATE', actor.id);
    await AuditRepository.log(
      actor,
      'TRIGGER_AREA_DISASTER',
      'alert',
      newAlert.id,
      `Coordinator triggered sector disaster alert: "${params.title}" (Severity: ${params.severity})`
    );

    window.dispatchEvent(new CustomEvent('resilia_local_write'));
    return newAlert;
  }

  /**
   * Only Disaster Coordinators can stand down active disaster alerts.
   */
  public static async standDownAreaDisaster(
    actor: User,
    standDownMessage = 'Situation de-escalated to Normal Monitoring by Disaster Coordinator.'
  ): Promise<void> {
    if (actor.role !== 'COORDINATOR') {
      throw new Error('Permission Denied: Only Disaster Coordinators have the authority to stand down disaster alerts.');
    }

    const allAlerts = await localDB.getAll<Alert>(STORES.ALERTS);
    for (const alt of allAlerts) {
      if (alt.active) {
        alt.active = false;
        await localDB.put(STORES.ALERTS, alt);
      }
    }

    // Reset community water level to normal monitoring (14.2m, level 0)
    const community = await localDB.get<Community>(STORES.COMMUNITY, 'comm_marikina_tumana_malanday');
    if (community) {
      community.riverWaterLevelMeters = 14.2;
      community.riverAlertLevel = 0;
      community.weatherCondition = 'Partly Cloudy, Normal Monitoring';
      community.rainfallStatus = 'Green / Normal (No Active Advisory)';
      community.lastUpdated = new Date().toISOString();
      await localDB.put(STORES.COMMUNITY, community);
    }

    await AuditRepository.log(
      actor,
      'STAND_DOWN_DISASTER',
      'community',
      'comm_marikina_tumana_malanday',
      standDownMessage
    );

    window.dispatchEvent(new CustomEvent('resilia_local_write'));
  }
}

// ==========================================
// 1. RESPONDER START TRIAGE REPOSITORY
// ==========================================

export class TriageRepository {
  public static evaluateSTARTTriage(params: {
    canWalk: boolean;
    spontaneousBreathing: boolean;
    respiratoryRateBpm?: number;
    radialPulsePresent: boolean;
    capillaryRefillSeconds?: number;
    mentalStatus?: 'FOLLOWS_COMMANDS' | 'CONFUSED' | 'UNRESPONSIVE';
    avpuScore?: 'ALERT' | 'VERBAL' | 'PAIN' | 'UNRESPONSIVE';
  }): TriageCategory {
    // 1. Can walk? Walking wounded -> MINOR (Green)
    if (params.canWalk) {
      return 'MINOR';
    }

    // 2. Breathing? Spontaneous respiration absent -> EXPECTANT (Black)
    if (!params.spontaneousBreathing) {
      return 'EXPECTANT';
    }

    // 3. Respiratory rate > 30 bpm or < 10 bpm (severe bradypnea / respiratory depression) -> IMMEDIATE (Red)
    if (params.respiratoryRateBpm !== undefined && (params.respiratoryRateBpm > 30 || params.respiratoryRateBpm < 10)) {
      return 'IMMEDIATE';
    }

    // 4. Perfusion: Absent radial pulse OR Capillary refill > 2 sec -> IMMEDIATE (Red)
    if (!params.radialPulsePresent || (params.capillaryRefillSeconds !== undefined && params.capillaryRefillSeconds > 2)) {
      return 'IMMEDIATE';
    }

    // 5. Mental Status: Cannot follow simple commands or unresponsive -> IMMEDIATE (Red)
    if (
      params.mentalStatus === 'CONFUSED' ||
      params.mentalStatus === 'UNRESPONSIVE' ||
      params.avpuScore === 'PAIN' ||
      params.avpuScore === 'UNRESPONSIVE'
    ) {
      return 'IMMEDIATE';
    }

    // Otherwise: Serious injury but stable vitals -> DELAYED (Yellow)
    return 'DELAYED';
  }

  public static generateWristbandCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `TRIAGE-2026-${code}`;
  }

  public static async getAll(): Promise<TriageRecord[]> {
    const all = await localDB.getAll<TriageRecord>(STORES.TRIAGE_RECORDS);
    return all.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public static async getByTagCode(tagCode: string): Promise<TriageRecord | undefined> {
    const all = await this.getAll();
    return all.find((t) => t.tagCode.toUpperCase() === tagCode.trim().toUpperCase());
  }

  public static async createTriageRecord(
    data: Omit<TriageRecord, 'id' | 'timestamp' | 'offlineGenerated'>,
    actor: User
  ): Promise<TriageRecord> {
    const record: TriageRecord = {
      ...data,
      id: 'tri_' + generateUUID(),
      timestamp: new Date().toISOString(),
      offlineGenerated: true,
    };

    await localDB.put(STORES.TRIAGE_RECORDS, record);
    await EventQueueService.recordLocalWrite('triage_record', STORES.TRIAGE_RECORDS, record, 'CREATE', actor.id);

    await AuditRepository.log(
      actor,
      'CREATE_TRIAGE_TAG',
      'triage_record',
      record.id,
      `Issued START Triage Tag ${record.tagCode} [${record.category}] for ${record.victimName} by ${actor.name}`
    );

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('resilia_local_write'));
    }
    return record;
  }

  public static async updateStatus(
    id: string,
    status: TriageRecord['status'],
    actor: User,
    notes?: string
  ): Promise<TriageRecord> {
    const record = await localDB.get<TriageRecord>(STORES.TRIAGE_RECORDS, id);
    if (!record) {
      throw new Error(`Triage record ${id} not found.`);
    }

    record.status = status;
    if (notes) {
      record.injuriesDescription = record.injuriesDescription
        ? `${record.injuriesDescription} | Update: ${notes}`
        : notes;
    }

    await localDB.put(STORES.TRIAGE_RECORDS, record);
    await EventQueueService.recordLocalWrite('triage_record', STORES.TRIAGE_RECORDS, record, 'UPDATE', actor.id);

    await AuditRepository.log(
      actor,
      'UPDATE_TRIAGE_STATUS',
      'triage_record',
      record.id,
      `Updated Triage Tag ${record.tagCode} status to ${status}. Notes: ${notes || 'None'}`
    );

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('resilia_local_write'));
    }
    return record;
  }
}

// ==========================================
// 2. RATION DISTRIBUTION & AYUDA REPOSITORY
// ==========================================

const HOUSEHOLD_CARDS_STORAGE_KEY = 'resilia_household_claim_cards_v1';

export class RationDistributionRepository {
  public static async getHouseholdCards(): Promise<HouseholdClaimCard[]> {
    try {
      const stored = localStorage.getItem(HOUSEHOLD_CARDS_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore
    }
    return [];
  }

  public static async getHouseholdByCode(claimCode: string): Promise<HouseholdClaimCard | undefined> {
    const cards = await this.getHouseholdCards();
    return cards.find((c) => c.claimCode.toUpperCase() === claimCode.trim().toUpperCase());
  }

  public static async registerHouseholdCard(
    data: Omit<HouseholdClaimCard, 'id' | 'registeredAt' | 'qrPayload'>,
    actor: User
  ): Promise<HouseholdClaimCard> {
    const id = 'hhd_' + generateUUID();
    const card: HouseholdClaimCard = {
      ...data,
      id,
      registeredAt: new Date().toISOString(),
      qrPayload: JSON.stringify({
        code: data.claimCode,
        head: data.householdHeadName,
        pax: data.familyMembersCount,
        purok: data.purokAddress,
      }),
    };

    const cards = await this.getHouseholdCards();
    const existingIdx = cards.findIndex((c) => c.claimCode === card.claimCode);
    if (existingIdx >= 0) {
      cards[existingIdx] = card;
    } else {
      cards.push(card);
    }

    try {
      localStorage.setItem(HOUSEHOLD_CARDS_STORAGE_KEY, JSON.stringify(cards));
    } catch {
      // ignore
    }

    await AuditRepository.log(
      actor,
      'REGISTER_HOUSEHOLD_CLAIM_CARD',
      'household_card',
      card.id,
      `Issued Household Relief Card ${card.claimCode} for ${card.householdHeadName} (${card.familyMembersCount} pax)`
    );

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('resilia_local_write'));
    }
    return card;
  }

  public static async getAllDistributions(): Promise<RationDistributionRecord[]> {
    const all = await localDB.getAll<RationDistributionRecord>(STORES.RATION_DISTRIBUTIONS);
    return all.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public static async getDistributionsForHousehold(claimCode: string): Promise<RationDistributionRecord[]> {
    const all = await this.getAllDistributions();
    return all.filter((d) => d.claimCode.toUpperCase() === claimCode.trim().toUpperCase());
  }

  public static async checkCooldown(
    claimCode: string,
    cooldownHours = 24
  ): Promise<{ canClaim: boolean; lastClaim?: RationDistributionRecord; hoursRemaining?: number }> {
    const history = await this.getDistributionsForHousehold(claimCode);
    if (history.length === 0) {
      return { canClaim: true };
    }

    const last = history[0];
    const elapsedMs = Date.now() - new Date(last.timestamp).getTime();
    const elapsedHours = elapsedMs / (1000 * 60 * 60);

    if (elapsedHours < cooldownHours) {
      return {
        canClaim: false,
        lastClaim: last,
        hoursRemaining: Math.ceil(cooldownHours - elapsedHours),
      };
    }

    return { canClaim: true, lastClaim: last };
  }

  public static async recordDistribution(
    recordData: Omit<RationDistributionRecord, 'id' | 'timestamp'>,
    actor: User,
    ignoreCooldown = false
  ): Promise<{ distribution: RationDistributionRecord; warning?: string }> {
    const cooldownCheck = await this.checkCooldown(recordData.claimCode, recordData.cooldownHours || 24);
    let warning: string | undefined;

    if (!cooldownCheck.canClaim && !ignoreCooldown) {
      warning = `DUPLICATE CLAIM ALERT: Household ${recordData.claimCode} claimed ${cooldownCheck.lastClaim?.packageType} within the last ${recordData.cooldownHours || 24} hours (${cooldownCheck.hoursRemaining}h cooldown remaining).`;
    }

    const distribution: RationDistributionRecord = {
      ...recordData,
      id: 'rat_' + generateUUID(),
      timestamp: new Date().toISOString(),
    };

    await localDB.put(STORES.RATION_DISTRIBUTIONS, distribution);
    await EventQueueService.recordLocalWrite('ration_distribution', STORES.RATION_DISTRIBUTIONS, distribution, 'CREATE', actor.id);

    // Automatically deduct inventory stock if resource exists (burn rate tracking)
    try {
      const resources = await localDB.getAll<Resource>(STORES.RESOURCES);
      const targetCategory =
        recordData.packageType === 'POTABLE_WATER_5GAL' ? 'WATER' : 'FOOD';
      const matchingRes = resources.find((r) => r.category === targetCategory && r.quantity > 0);
      if (matchingRes && matchingRes.quantity >= recordData.packageQuantity) {
        matchingRes.quantity -= recordData.packageQuantity;
        matchingRes.lastUpdated = new Date().toISOString();
        if (matchingRes.quantity === 0) matchingRes.status = 'DEPLETED';
        else if (matchingRes.estimatedDaysRemaining < 1.0) matchingRes.status = 'LOW';
        await localDB.put(STORES.RESOURCES, matchingRes);
      }
    } catch (e) {
      console.warn('Inventory deduction warning:', e);
    }

    await AuditRepository.log(
      actor,
      'RECORD_RATION_DISTRIBUTION',
      'ration_distribution',
      distribution.id,
      `Distributed ${distribution.packageQuantity}x ${distribution.packageType} to ${distribution.householdHeadName} [${distribution.claimCode}] at ${distribution.shelterOrSiteName}. ${warning || ''}`
    );

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('resilia_local_write'));
    }
    return { distribution, warning };
  }
}

// ==========================================
// 3. MISSING PERSONS & REUNIFICATION REPOSITORY
// ==========================================

export class MissingPersonsRepository {
  public static async getAll(): Promise<MissingKinRecord[]> {
    const all = await localDB.getAll<MissingKinRecord>(STORES.MISSING_PERSONS);
    return all.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  public static async getById(id: string): Promise<MissingKinRecord | undefined> {
    return localDB.get<MissingKinRecord>(STORES.MISSING_PERSONS, id);
  }

  public static async registerMissingPerson(
    data: Omit<MissingKinRecord, 'id' | 'createdAt' | 'updatedAt' | 'status'>,
    actor: User
  ): Promise<MissingKinRecord> {
    const now = new Date().toISOString();
    const record: MissingKinRecord = {
      ...data,
      id: 'kin_' + generateUUID(),
      status: 'SEARCHING',
      createdAt: now,
      updatedAt: now,
    };

    await localDB.put(STORES.MISSING_PERSONS, record);
    await EventQueueService.recordLocalWrite('missing_kin', STORES.MISSING_PERSONS, record, 'CREATE', actor.id);

    await AuditRepository.log(
      actor,
      'REGISTER_MISSING_PERSON',
      'missing_kin',
      record.id,
      `Registered missing kin: ${record.fullName} (last seen at ${record.lastSeenLocation}) reported by ${record.reporterName}`
    );

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('resilia_local_write'));
    }
    return record;
  }

  public static async updateStatus(
    id: string,
    status: MissingKinStatus,
    notes: string,
    actor: User,
    matchedShelterName?: string
  ): Promise<MissingKinRecord> {
    const record = await localDB.get<MissingKinRecord>(STORES.MISSING_PERSONS, id);
    if (!record) {
      throw new Error(`Missing person record ${id} not found.`);
    }

    record.status = status;
    record.updatedAt = new Date().toISOString();
    if (matchedShelterName) record.matchedShelterName = matchedShelterName;
    if (notes) record.foundNotes = notes;

    await localDB.put(STORES.MISSING_PERSONS, record);
    await EventQueueService.recordLocalWrite('missing_kin', STORES.MISSING_PERSONS, record, 'UPDATE', actor.id);

    await AuditRepository.log(
      actor,
      'UPDATE_MISSING_PERSON_STATUS',
      'missing_kin',
      record.id,
      `Updated ${record.fullName} status to ${status}. Shelter: ${matchedShelterName || 'None'}. Notes: ${notes}`
    );

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('resilia_local_write'));
    }
    return record;
  }

  public static async searchAndMatchRoster(
    query: string,
    shelterRoster: { name: string; shelterName: string; phone?: string }[]
  ): Promise<{ candidate: { name: string; shelterName: string; phone?: string }; score: number }[]> {
    const cleanQuery = query.toLowerCase().trim();
    if (!cleanQuery) return [];

    const matches: { candidate: { name: string; shelterName: string; phone?: string }; score: number }[] = [];
    const queryTokens = cleanQuery.split(/\s+/).filter(Boolean);

    for (const person of shelterRoster) {
      const target = person.name.toLowerCase();
      let matchCount = 0;
      for (const token of queryTokens) {
        if (target.includes(token)) {
          matchCount++;
        }
      }

      if (matchCount > 0) {
        const score = Math.round((matchCount / queryTokens.length) * 100);
        matches.push({ candidate: person, score });
      }
    }

    return matches.sort((a, b) => b.score - a.score);
  }
}

// ==========================================
// 4. BAYANIHAN COMMUNITY MUTUAL AID REPOSITORY
// ==========================================

export class MutualAidRepository {
  public static async getAll(): Promise<MutualAidPost[]> {
    const all = await localDB.getAll<MutualAidPost>(STORES.MUTUAL_AID);
    return all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public static async createPost(
    data: Omit<MutualAidPost, 'id' | 'createdAt' | 'status'>,
    actor: User
  ): Promise<MutualAidPost> {
    if (actor.role !== 'RESIDENT') {
      throw new Error('RBAC Violation: Only residents are authorized to create community mutual aid posts.');
    }

    const post: MutualAidPost = {
      ...data,
      id: 'aid_' + generateUUID(),
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };

    await localDB.put(STORES.MUTUAL_AID, post);
    await EventQueueService.recordLocalWrite('mutual_aid', STORES.MUTUAL_AID, post, 'CREATE', actor.id);

    await AuditRepository.log(
      actor,
      'CREATE_MUTUAL_AID_POST',
      'mutual_aid',
      post.id,
      `Bayanihan [${post.type}] posted: ${post.title} in ${post.purokSector}`
    );

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('resilia_local_write'));
    }
    return post;
  }

  public static async updateStatus(
    id: string,
    status: MutualAidStatus,
    actor: User,
    claimedBy?: string
  ): Promise<MutualAidPost> {
    const post = await localDB.get<MutualAidPost>(STORES.MUTUAL_AID, id);
    if (!post) {
      throw new Error(`Mutual aid post ${id} not found.`);
    }

    post.status = status;
    if (claimedBy) post.claimedBy = claimedBy;
    if (status === 'COMPLETED') post.completedAt = new Date().toISOString();

    await localDB.put(STORES.MUTUAL_AID, post);
    await EventQueueService.recordLocalWrite('mutual_aid', STORES.MUTUAL_AID, post, 'UPDATE', actor.id);

    await AuditRepository.log(
      actor,
      'UPDATE_MUTUAL_AID_STATUS',
      'mutual_aid',
      post.id,
      `Bayanihan post ${post.title} marked ${status} by ${actor.name}`
    );

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('resilia_local_write'));
    }
    return post;
  }
}

// ==========================================
// 5. BOIL WATER & DISEASE OUTBREAK REPOSITORY
// ==========================================

export class OutbreakWatchRepository {
  public static calculateLeptospirosisGuidance(
    exposureIsoDate: string,
    hasWounds: boolean
  ): {
    hoursElapsed: number;
    hoursRemaining: number;
    isWithinWindow: boolean;
    protocol: 'LOW_RISK_SINGLE_DOSE' | 'MODERATE_HIGH_RISK_DAILY' | 'CONSULT_DOCTOR_PREGNANT_CHILD';
    recommendation: string;
  } {
    const exposureTime = new Date(exposureIsoDate).getTime();
    const elapsedMs = Math.max(0, Date.now() - exposureTime);
    const hoursElapsed = Math.floor(elapsedMs / (1000 * 60 * 60));
    const windowHours = 72; // DOH 72-hour window post-exposure
    const hoursRemaining = Math.max(0, windowHours - hoursElapsed);
    const isWithinWindow = hoursElapsed <= windowHours;

    let protocol: 'LOW_RISK_SINGLE_DOSE' | 'MODERATE_HIGH_RISK_DAILY' | 'CONSULT_DOCTOR_PREGNANT_CHILD';
    let recommendation = '';

    if (hasWounds) {
      protocol = 'MODERATE_HIGH_RISK_DAILY';
      recommendation =
        'HIGH RISK EXPOSURE (Wounds Present): DOH Clinical Protocol recommends Doxycycline 200mg once daily for 3-5 days. Initiate within 24-72 hours of floodwater contact. Report to Barangay Health Center immediately for physician prescription.';
    } else {
      protocol = 'LOW_RISK_SINGLE_DOSE';
      recommendation =
        'LOW RISK EXPOSURE (Intact Skin): DOH Clinical Protocol recommends a single dose of Doxycycline 200mg within 24 to 72 hours of exposure. Obtain from nearest health center.';
    }

    return {
      hoursElapsed,
      hoursRemaining,
      isWithinWindow,
      protocol,
      recommendation,
    };
  }

  public static async getExposureRecords(userId?: string): Promise<FloodExposureRecord[]> {
    const all = await localDB.getAll<any>(STORES.OUTBREAK_WATCH);
    const exposureRecords = all.filter(
      (r) => r && r.id && (r.id.startsWith('exp_') || r.exposureTimestamp)
    ) as FloodExposureRecord[];
    const filtered = userId ? exposureRecords.filter((r) => r.userId === userId) : exposureRecords;
    return filtered.sort(
      (a, b) => new Date(b.exposureTimestamp).getTime() - new Date(a.exposureTimestamp).getTime()
    );
  }

  public static async getAdvisories(): Promise<OutbreakAdvisory[]> {
    const all = await localDB.getAll<any>(STORES.OUTBREAK_WATCH);
    const advisories = all.filter(
      (r) => r && r.id && (r.id.startsWith('adv_') || (r.type && r.issuedByCoordinatorId))
    ) as OutbreakAdvisory[];

    if (advisories.length === 0) {
      // Seed initial active boil-water and leptospirosis advisories
      const defaultAdvisories: OutbreakAdvisory[] = [
        {
          id: 'adv_boil_water_01',
          title: 'Malanday Water Pipeline Boil-Water Directive',
          type: 'BOIL_WATER',
          severity: 'CRITICAL',
          affectedAreas: ['Purok 1 Malanday', 'Purok 3 Malanday Riverside', 'Tumana Riverbanks'],
          waterSource: 'Low-Pressure Pipeline & Submerged Ground Wells',
          boilDurationMinutes: 3,
          clinicDispensingSites: ['Malanday Barangay Health Center', 'Tumana Health Clinic'],
          guidance:
            'CDRRMO Health Directive: Boil all tap and well water vigorously for at least 3 minutes before drinking, cooking, or tooth brushing due to flood sediment intrusion. Use aqua-tabs or bottled water for infants.',
          issuedByCoordinatorId: 'coord_eoc_01',
          issuedByName: 'Hon. Elena Santos (CDRRMO Health Officer)',
          issuedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
          isActive: true,
        },
        {
          id: 'adv_lepto_surge_02',
          title: 'Post-Flood Leptospirosis Prophylaxis Surge Alert',
          type: 'LEPTOSPIROSIS_SURGE',
          severity: 'WARNING',
          affectedAreas: ['Purok 1 Malanday', 'Purok 2 Malanday', 'Tumana Dike Side'],
          clinicDispensingSites: [
            'Malanday Barangay Health Center',
            'Tumana Clinic & Birthing Facility',
            'Amang Rodriguez ER',
          ],
          guidance:
            'DOH Alert: All individuals who waded through floodwaters within the last 72 hours must obtain free prophylactic Doxycycline at their Barangay Health Station. Wounds must be cleaned with antibacterial soap immediately.',
          issuedByCoordinatorId: 'coord_eoc_01',
          issuedByName: 'Hon. Elena Santos (CDRRMO Health Officer)',
          issuedAt: new Date(Date.now() - 3600000 * 8).toISOString(),
          isActive: true,
        },
      ];
      for (const adv of defaultAdvisories) {
        await localDB.put(STORES.OUTBREAK_WATCH, adv);
      }
      return defaultAdvisories;
    }

    return advisories.sort(
      (a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime()
    );
  }

  public static async createAdvisory(
    data: Omit<OutbreakAdvisory, 'id' | 'issuedAt' | 'isActive'>,
    actor: User
  ): Promise<OutbreakAdvisory> {
    if (actor.role !== 'COORDINATOR') {
      throw new Error(
        'RBAC Violation: Outbreak Watch and Boil Water advisories can only be posted by authorized Disaster Coordinators.'
      );
    }

    const advisory: OutbreakAdvisory = {
      ...data,
      id: 'adv_' + generateUUID(),
      issuedAt: new Date().toISOString(),
      isActive: true,
    };

    await localDB.put(STORES.OUTBREAK_WATCH, advisory);
    await EventQueueService.recordLocalWrite(
      'outbreak_watch',
      STORES.OUTBREAK_WATCH,
      advisory,
      'CREATE',
      actor.id
    );

    await AuditRepository.log(
      actor,
      'CREATE_OUTBREAK_ADVISORY',
      'outbreak_watch',
      advisory.id,
      `Outbreak advisory [${advisory.type}] issued: ${advisory.title} (${advisory.severity})`
    );

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('resilia_local_write'));
    }
    return advisory;
  }

  public static async toggleAdvisoryStatus(
    id: string,
    actor: User,
    isActive: boolean
  ): Promise<OutbreakAdvisory> {
    if (actor.role !== 'COORDINATOR') {
      throw new Error(
        'RBAC Violation: Only coordinators can update or resolve outbreak watch advisories.'
      );
    }

    const advisory = await localDB.get<OutbreakAdvisory>(STORES.OUTBREAK_WATCH, id);
    if (!advisory) {
      throw new Error(`Outbreak advisory ${id} not found.`);
    }

    advisory.isActive = isActive;
    await localDB.put(STORES.OUTBREAK_WATCH, advisory);
    await EventQueueService.recordLocalWrite(
      'outbreak_watch',
      STORES.OUTBREAK_WATCH,
      advisory,
      'UPDATE',
      actor.id
    );

    await AuditRepository.log(
      actor,
      'UPDATE_OUTBREAK_ADVISORY_STATUS',
      'outbreak_watch',
      advisory.id,
      `Outbreak advisory ${advisory.title} marked ${isActive ? 'ACTIVE' : 'RESOLVED'} by ${actor.name}`
    );

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('resilia_local_write'));
    }
    return advisory;
  }

  public static async logFloodExposure(
    data: Omit<FloodExposureRecord, 'id' | 'prophylaxisWindowExpiry' | 'recommendedProtocol'>
  ): Promise<FloodExposureRecord> {
    const guidance = this.calculateLeptospirosisGuidance(data.exposureTimestamp, data.hasOpenWounds);
    const expiry = new Date(new Date(data.exposureTimestamp).getTime() + 72 * 60 * 60 * 1000).toISOString();

    const record: FloodExposureRecord = {
      ...data,
      id: 'exp_' + generateUUID(),
      prophylaxisWindowExpiry: expiry,
      recommendedProtocol: guidance.protocol,
    };

    await localDB.put(STORES.OUTBREAK_WATCH, record);
    await EventQueueService.recordLocalWrite('outbreak_watch', STORES.OUTBREAK_WATCH, record, 'CREATE', data.userId || 'resident');

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('resilia_local_write'));
    }
    return record;
  }

  public static async markProphylaxisTaken(
    id: string,
    taken: boolean,
    notes?: string
  ): Promise<FloodExposureRecord> {
    const record = await localDB.get<FloodExposureRecord>(STORES.OUTBREAK_WATCH, id);
    if (!record) {
      throw new Error(`Flood exposure record ${id} not found.`);
    }

    record.takenProphylaxis = taken;
    record.takenAt = taken ? new Date().toISOString() : undefined;
    if (notes) record.notes = notes;

    await localDB.put(STORES.OUTBREAK_WATCH, record);
    await EventQueueService.recordLocalWrite('outbreak_watch', STORES.OUTBREAK_WATCH, record, 'UPDATE', record.userId || 'resident');

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('resilia_local_write'));
    }
    return record;
  }
}

