/**
 * Resilia Core Data Contracts & System Types
 * Maintaining vital community lifelines when networks fail.
 */

export type UserRole = 'RESIDENT' | 'RESPONDER' | 'COORDINATOR';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  phone: string;
  locationName: string;
  assignedZone?: string;
  status: 'ACTIVE' | 'ON_DUTY' | 'RESTING' | 'DEPLOYED';
}

export type RiverAlertLevel = 0 | 1 | 2 | 3; // 0=Normal, 1=Alert (15m), 2=Warning (16m), 3=Evacuate (18m)

export interface Community {
  id: string;
  name: string; // e.g. "Barangay Tumana & Malanday"
  municipality: string; // "Marikina City"
  region: string; // "National Capital Region (NCR)"
  population: number;
  riverWaterLevelMeters: number;
  riverAlertLevel: RiverAlertLevel;
  weatherCondition: string;
  rainfallStatus: string;
  powerStatus: 'NORMAL' | 'PARTIAL_OUTAGE' | 'TOTAL_OUTAGE';
  commsStatus: 'NORMAL' | 'DEGRADED_CELLULAR' | 'MESH_LAN_ONLY' | 'NO_CONNECTIVITY';
  lastUpdated: string;
  source: string;
}

export type ShelterStatus = 'OPEN' | 'NEAR_CAPACITY' | 'FULL' | 'CLOSED';

export interface Shelter {
  id: string;
  name: string;
  locationName: string;
  lat: number;
  lng: number;
  capacityTotal: number;
  capacityCurrent: number;
  isAccessibleWheelchair: boolean;
  hasBackupPower: boolean;
  hasMedicalClinic: boolean;
  hasPotableWater: boolean;
  // Special Needs Matrix (PWD, Lactating, Pets, Oxygen)
  hasLactatingStation?: boolean;
  hasPetFriendlyZone?: boolean;
  hasMedicalOxygen?: boolean;
  hasGroundFloorAccess?: boolean;
  pwdCapacity?: number;
  pwdCurrent?: number;
  petCapacity?: number;
  petCurrent?: number;
  contactPerson: string;
  contactPhone: string;
  status: ShelterStatus;
  verifiedAt: string;
  verifiedBy: string;
  lastUpdated: string;
}

export type ResourceCategory =
  | 'WATER'
  | 'FOOD'
  | 'MEDICINE'
  | 'TRANSPORT'
  | 'GENERATOR'
  | 'EQUIPMENT'
  | 'SHELTER_KIT';

export type ResourceStatus = 'AVAILABLE' | 'LOW' | 'DEPLETED' | 'RESERVED';

export interface Resource {
  id: string;
  name: string;
  category: ResourceCategory;
  quantity: number;
  unit: string; // e.g. "500ml bottles", "packs", "boxes", "units"
  locationId: string;
  locationName: string;
  status: ResourceStatus;
  consumptionRatePerDay: number;
  estimatedDaysRemaining: number;
  lastUpdated: string;
}

export type MovementType =
  | 'INBOUND_RELIEF'
  | 'CONSUMPTION'
  | 'TRANSFER'
  | 'DISPATCH';

export interface InventoryMovement {
  id: string;
  resourceId: string;
  resourceName: string;
  deltaQuantity: number;
  movementType: MovementType;
  sourceLocation: string;
  destinationLocation: string;
  actorId: string;
  actorName: string;
  notes: string;
  timestamp: string;
}

export type IncidentType =
  | 'FLOOD'
  | 'EARTHQUAKE'
  | 'LANDSLIDE'
  | 'TYPHOON'
  | 'VOLCANO_ERUPTION'
  | 'TSUNAMI'
  | 'ROAD_BLOCKED'
  | 'BUILDING_DAMAGE'
  | 'FIRE'
  | 'POWER_OUTAGE'
  | 'MEDICAL_EMERGENCY'
  | 'PERSON_IN_DISTRESS'
  | 'OTHER';

export type IncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type IncidentStatus = 'REPORTED' | 'VERIFIED' | 'RESOLVED' | 'CONTRADICTED';
export type ResponderOperationalStatus = 'UNASSIGNED' | 'DISPATCHED' | 'EN_ROUTE' | 'ON_SCENE' | 'RESOLVED';

export interface Incident {
  id: string;
  type: IncidentType;
  title: string;
  description: string;
  lat: number;
  lng: number;
  locationName: string;
  reporterId: string;
  reporterName: string;
  reporterRole: UserRole;
  severity: IncidentSeverity;
  status: IncidentStatus;
  floodDepthCm?: number;
  // Earthquake & Structural collapse parameters
  earthquakeIntensity?: number; // PHIVOLCS PEIS Intensity Scale 1 to 10
  structuralDamageLevel?: 'NONE' | 'MINOR_CRACKS' | 'PARTIAL_COLLAPSE' | 'TOTAL_COLLAPSE';
  trappedPersonsCount?: number;
  aftershockWarning?: boolean;
  // Volcano parameters (PHIVOLCS)
  volcanoAlertLevel?: number;
  ashfallSeverity?: 'LIGHT' | 'MODERATE' | 'HEAVY';
  // Tsunami parameters (PHIVOLCS Tsunami Advisory)
  tsunamiWaveHeightMeters?: number;
  inundationDistanceMeters?: number;
  photoUrl?: string;
  createdAt: string;
  verifiedAt?: string;
  verifiedBy?: string;
  verificationRationale?: string;
  // RBAC Responder Assignment & Dispatch
  assignedResponderId?: string;
  assignedResponderName?: string;
  assignedAt?: string;
  responderStatus?: ResponderOperationalStatus;
  responderNotes?: string;
  supportingReportsCount: number;
  contradictingReportsCount: number;
  hasBackupRequest?: boolean;
  backupDetails?: BackupDetails;
}

export type VerificationState =
  | 'VERIFIED'
  | 'CORROBORATED'
  | 'UNVERIFIED'
  | 'CONTRADICTED'
  | 'STALE';

export interface Report {
  id: string;
  incidentId: string;
  reporterId: string;
  reporterName: string;
  reporterRole: UserRole;
  reportType: 'INITIAL' | 'CORROBORATION' | 'CONTRADICTION' | 'STATUS_UPDATE';
  observation: string;
  roadStatus?: 'PASSABLE' | 'LIGHT_VEHICLES_ONLY' | 'IMPASSABLE' | 'UNKNOWN';
  floodDepthCm?: number;
  timestamp: string;
  lat: number;
  lng: number;
}

export interface Verification {
  id: string;
  targetType: 'INCIDENT' | 'ROAD' | 'SHELTER';
  targetId: string;
  status: VerificationState;
  actorId: string;
  actorName: string;
  rationale: string;
  timestamp: string;
}

export type AssistanceCategory =
  | 'EMERGENCY_RESCUE'
  | 'EVACUATION'
  | 'WATER'
  | 'FOOD'
  | 'MEDICINE'
  | 'TRANSPORTATION'
  | 'SHELTER'
  | 'OTHER';

export type AssistancePriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type AssistanceStatus =
  | 'PENDING'
  | 'TRIAGED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'FULFILLED'
  | 'CANCELLED';

export interface VulnerabilityNeeds {
  elderlyCount: number;
  infantCount: number;
  wheelchairUser: boolean;
  bedridden: boolean;
  medicalNeeds: string[];
}

export interface AssistanceRequest {
  id: string;
  residentId: string;
  residentName: string;
  contactPhone: string;
  peopleCount: number;
  vulnerabilityNeeds: VulnerabilityNeeds;
  category: AssistanceCategory;
  description: string;
  locationName: string;
  lat: number;
  lng: number;
  priority: AssistancePriority;
  priorityScore: number; // 0-100 deterministic score
  priorityRationale: string[];
  status: AssistanceStatus;
  createdAt: string;
  updatedAt: string;
  assignedMissionId?: string;
  hasBackupRequest?: boolean;
  backupDetails?: BackupDetails;
}

export interface BackupDetails {
  requested: boolean;
  resourceType: string;
  quantity?: number;
  reason: string;
  locationName: string;
  requestedByResponderId: string;
  requestedByResponderName: string;
  requestedAt: string;
  status: 'REQUESTED' | 'DISPATCHED' | 'RESOLVED' | 'CANCELLED';
  dispatchedAt?: string;
  notes?: string;
}

export type MissionStatus =
  | 'PROPOSED'
  | 'APPROVED'
  | 'ASSIGNED'
  | 'ACCEPTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'REJECTED'
  | 'CANCELLED';

export interface MissionStatusEntry {
  status: MissionStatus;
  actorId: string;
  actorName: string;
  timestamp: string;
  note?: string;
}

export interface Mission {
  id: string;
  title: string;
  assistanceRequestId: string;
  priority: AssistancePriority;
  rationale: string;
  pickupLocation: string;
  destinationLocation: string;
  lat: number;
  lng: number;
  requestedAssistance: string;
  vulnerabilitySummary: string;
  assignedResponderId?: string;
  assignedResponderName?: string;
  assignedVehicleType?: string;
  targetShelterId?: string;
  targetShelterName?: string;
  status: MissionStatus;
  statusHistory: MissionStatusEntry[];
  evidenceRecordIds: string[];
  requiresHumanApproval: boolean;
  hasBackupRequest?: boolean;
  backupDetails?: BackupDetails;
  createdAt: string;
  updatedAt: string;
}

export interface Alert {
  id: string;
  title: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  message: string;
  source: string; // e.g. "PAGASA", "MCDRRMO Marikina", "Barangay Tumana Council"
  issuedAt: string;
  expiresAt: string;
  active: boolean;
  /** True for drills / demo scenario alerts. Must never be presented as a real emergency. */
  isExercise?: boolean;
  /** Incoming disaster advisory attributes */
  disasterType?: IncidentType | 'TYPHOON' | 'MONSOON' | 'STORM_SURGE' | 'FLOOD' | 'EARTHQUAKE' | 'VOLCANO' | string;
  disasterName?: string; // e.g. "Super Typhoon Pepito (Man-yi)", "Typhoon Ulysses"
  daysUntilLandfall?: number; // Estimated days until landfall (e.g., 2, 1, 0)
  expectedLandfall?: string; // Estimated landfall date/time e.g. "Friday Evening / 48 hrs"
  preparations?: string[]; // Recommended preparation actions / checklists for residents & responders
  affectedZones?: string[]; // Affected barangay sectors, riverside puroks, lowlands
  signalLevel?: number; // PAGASA TCWS Tropical Cyclone Wind Signal (1 to 5)
}

export interface Recommendation {
  id: string;
  category: 'MISSION_DISPATCH' | 'RESOURCE_TRANSFER' | 'SHELTER_DIVERT' | 'SAFETY_WARNING';
  title: string;
  description: string;
  evidenceRecordIds: string[];
  confidenceExplanation: string;
  uncertainties: string[];
  proposedActions: string[];
  requiresHumanApproval: boolean;
  createdAt: string;
}

export type SyncOperation = 'CREATE' | 'UPDATE' | 'DELETE';
export type SyncStatus = 'PENDING' | 'SYNCED' | 'FAILED' | 'CONFLICT';

export interface SyncEvent {
  event_id: string;
  entity_type:
    | 'incident'
    | 'assistance_request'
    | 'mission'
    | 'resource'
    | 'shelter'
    | 'movement'
    | 'report'
    | 'verification'
    | 'safety_checkin'
    | 'alert'
    | 'triage_record'
    | 'ration_distribution'
    | 'missing_kin'
    | 'mutual_aid'
    | 'outbreak_watch';
  entity_id: string;
  operation: SyncOperation;
  payload: any;
  origin_device_id: string;
  origin_node_id?: string;
  actor_id: string;
  created_at: string;
  schema_version: number;
  sync_status: SyncStatus;
  retry_count: number;
  last_error?: string;
  server_ack_at?: string;
}

export interface SyncConflict {
  id: string;
  event_id: string;
  entity_type: string;
  entity_id: string;
  localPayload: any;
  remotePayload: any;
  conflictType: 'CONCURRENT_MODIFICATION' | 'STALE_STATUS' | 'CAPACITY_OVERFLOW' | 'OPERATIONAL_FACT_DIVERGENCE';
  detectedAt: string;
  resolved: boolean;
  resolutionChoice?: 'LOCAL' | 'REMOTE' | 'CUSTOM';
  resolvedBy?: string;
  resolvedAt?: string;
  resolutionNotes?: string;
}

export interface AuditEntry {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  entityType: string;
  entityId: string;
  rationale: string;
  timestamp: string;
  origin: string; // 'BROWSER_LOCAL' | 'CLOUD_API' | 'SYNC_ENGINE'
}

export type ConnectivityStatus =
  | 'ONLINE'
  | 'DEGRADED'
  | 'OFFLINE'
  | 'SYNCING'
  | 'SYNC_ERROR';

export interface AIQuestionResponse {
  intent: string;
  answer: string;
  recommendations: Recommendation[];
  evidenceRecordIds: string[];
  sourceTimestamps: string[];
  verificationStatus: string;
  confidenceExplanation: string;
  uncertainties: string[];
  proposedActions: string[];
  requiresHumanApproval: boolean;
  engineUsed: 'GEMINI_3_8_FLASH' | 'LOCAL_OFFLINE_RETRIEVAL';
  isOffline: boolean;
}

// ==========================================
// LIVE INTELLIGENCE FEED & TELEMETRY TYPES
// ==========================================

export type LiveFeedSource =
  | 'PAGASA'
  | 'OPEN_METEO'
  | 'JTWC'
  | 'NDRRMC'
  | 'PHIVOLCS'
  | 'EFCOS_MARIKINA'
  | 'DOST_RADAR'
  | 'FIELD_OPS'
  | 'COORDINATOR';

export type LiveFeedCategory =
  | 'WEATHER'
  | 'AGENCY'
  | 'RIVER_TELEMETRY'
  | 'FIELD_OPS';

export type LiveFeedSeverity =
  | 'NORMAL'
  | 'ADVISORY'
  | 'INFO'
  | 'WARNING'
  | 'CRITICAL';

export interface EnvironmentalTelemetry {
  rainfallIntensityMmHr: number;
  rainfallCategory: 'NONE' | 'LIGHT' | 'MODERATE' | 'HEAVY' | 'INTENSE' | 'TORRENTIAL';
  rainfallAdvisoryLevel?: 'NORMAL' | 'YELLOW' | 'ORANGE' | 'RED';
  windSpeedKph: number;
  windGustKph: number;
  windDirection: string;
  atmosphericPressureHpa: number;
  pressureTrend: 'RAPIDLY_DROPPING' | 'STEADY' | 'RISING';
  tcwsSignalLevel?: number; // 0 to 5
  cycloneName?: string;
  cycloneTrackDescription?: string;
  cycloneDistanceKm?: number;
  cycloneMovementSpeedKph?: number;
  riverWaterLevelMeters: number;
  riverAlertLevel: RiverAlertLevel;
  riverTrendRatePerHour?: number; // e.g. +0.4 m/hr
  radarStationName: string;
  radarStatus: 'ONLINE' | 'STANDBY' | 'DEGRADED';
  radarReflectivityDbz: number;
  radarPrecipitationSummary: string;
  ambientTempC: number;
  relativeHumidityPercent: number;
  floodgateStatus?: string;
  seismicStatus?: string;
  lastUpdated: string;
}

export interface TrustedWeatherSourceInfo {
  id: LiveFeedSource;
  name: string;
  agency: string;
  coverage: string;
  updateFrequency: string;
  verified: boolean;
  endpointUrl?: string;
  attributionUrl: string;
  badgeClass: string;
  description: string;
}

export interface LiveFeedItem {
  id: string;
  source: LiveFeedSource;
  sourceName: string;
  category: LiveFeedCategory;
  severity: LiveFeedSeverity;
  title: string;
  summary: string;
  details?: string;
  telemetrySnapshot?: Partial<EnvironmentalTelemetry>;
  timestamp: string;
  isSimulated?: boolean;
  isPinned?: boolean;
  actionRecommendation?: string;
  externalLink?: string;
  isVerifiedSource?: boolean;
  sourceAgency?: string;
  sourceUrl?: string;
  reliabilityScore?: number;
}

// ==========================================
// 1. RESPONDER START TRIAGE & FIELD QR TAGS
// ==========================================

export type TriageCategory = 'IMMEDIATE' | 'DELAYED' | 'MINOR' | 'EXPECTANT';

export interface TriageRecord {
  id: string;
  tagCode: string; // e.g. "TRIAGE-2026-X89F"
  category: TriageCategory;
  victimName: string; // "Carlo Mendoza" or "Unidentified Male (Approx 40s)"
  approxAgeGroup: 'INFANT' | 'CHILD' | 'ADULT' | 'ELDERLY';
  gender: 'MALE' | 'FEMALE' | 'OTHER' | 'UNKNOWN';
  canWalk: boolean;
  spontaneousBreathing: boolean;
  respiratoryRateBpm?: number;
  radialPulsePresent: boolean;
  capillaryRefillSeconds?: number;
  mentalStatus: 'FOLLOWS_COMMANDS' | 'CONFUSED' | 'UNRESPONSIVE';
  avpuScore: 'ALERT' | 'VERBAL' | 'PAIN' | 'UNRESPONSIVE';
  injuriesDescription?: string;
  destinationFacility?: string;
  incidentId?: string;
  responderId: string;
  responderName: string;
  locationName: string;
  timestamp: string;
  status: 'FIELD_TRIAGED' | 'EN_ROUTE' | 'ADMITTED_SHELTER' | 'ADMITTED_HOSPITAL' | 'HANDOVER_COMPLETE';
  offlineGenerated: boolean;
}

// ==========================================
// 2. BARCODE/QR AYUDA & RATION TRACKER
// ==========================================

export type RationPackageType =
  | 'FAMILY_FOOD_PACK'
  | 'HYGIENE_KIT'
  | 'POTABLE_WATER_5GAL'
  | 'INFANT_NUTRITION_KIT'
  | 'SLEEPING_KIT';

export interface HouseholdClaimCard {
  id: string;
  claimCode: string; // e.g. "AYUDA-FAM-TUM-042"
  householdHeadName: string;
  familyMembersCount: number;
  vulnerableMembers: {
    infants: number;
    seniors: number;
    pwd: number;
    lactating: number;
  };
  contactPhone: string;
  purokAddress: string;
  evacuationCenterId?: string;
  qrPayload: string;
  registeredAt: string;
}

export interface RationDistributionRecord {
  id: string;
  householdId: string;
  claimCode: string;
  householdHeadName: string;
  familyMembersCount: number;
  packageType: RationPackageType;
  packageQuantity: number;
  distributedBy: string;
  distributedById: string;
  shelterOrSiteName: string;
  timestamp: string;
  cooldownHours: number;
  notes?: string;
}

// ==========================================
// 3. FAMILY REUNIFICATION & MISSING KIN
// ==========================================

export type MissingKinStatus = 'SEARCHING' | 'FOUND_SAFE' | 'AT_SHELTER' | 'REUNITED';

export interface MissingKinRecord {
  id: string;
  fullName: string;
  nickname?: string;
  approxAge?: number;
  gender: 'MALE' | 'FEMALE' | 'OTHER' | 'UNKNOWN';
  lastSeenLocation: string;
  lastSeenDateTime: string;
  distinguishingFeatures: string;
  clothingDescription?: string;
  photoDataUrl?: string; // Base64 data URL or photo asset path
  reporterName: string;
  reporterPhone: string;
  reporterRelationship: string;
  status: MissingKinStatus;
  matchedShelterName?: string;
  foundNotes?: string;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// 4. "BAYANIHAN" COMMUNITY MUTUAL AID BOARD
// ==========================================

export type MutualAidType = 'OFFER' | 'REQUEST';

export type MutualAidCategory =
  | 'POWER_CHARGING'
  | 'EQUIPMENT_TOOLS'
  | 'SKILL_VOLUNTEER'
  | 'TRANSPORT'
  | 'FOOD_WATER'
  | 'OTHER';

export type MutualAidStatus = 'ACTIVE' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface MutualAidPost {
  id: string;
  title: string;
  description: string;
  type: MutualAidType;
  category: MutualAidCategory;
  purokSector: string;
  contactName: string;
  contactPhone: string;
  status: MutualAidStatus;
  createdAt: string;
  completedAt?: string;
  claimedBy?: string;
  locationDetails?: string;
}

// ==========================================
// 5. BOIL WATER & DISEASE OUTBREAK WATCH
// ==========================================

export interface FloodExposureRecord {
  id: string;
  userId?: string;
  userName: string;
  exposureTimestamp: string;
  wadingDurationMinutes: number;
  waterDepth: 'ANKLE' | 'KNEE' | 'WAIST_OR_DEEPER';
  hasOpenWounds: boolean;
  prophylaxisWindowExpiry: string; // 72 hours post-exposure
  recommendedProtocol: 'LOW_RISK_SINGLE_DOSE' | 'MODERATE_HIGH_RISK_DAILY' | 'CONSULT_DOCTOR_PREGNANT_CHILD';
  takenProphylaxis: boolean;
  takenAt?: string;
  notes?: string;
}

export interface DiseaseSymptomCheck {
  id: string;
  suspectedDisease: 'LEPTOSPIROSIS' | 'CHOLERA_GASTROENTERITIS' | 'DENGUE';
  symptoms: string[];
  triageSeverity: 'MILD_MONITOR' | 'URGENT_HEALTH_CENTER' | 'EMERGENCY_HOSPITAL';
  advice: string;
  timestamp: string;
}

export type OutbreakAdvisoryType =
  | 'BOIL_WATER'
  | 'LEPTOSPIROSIS_SURGE'
  | 'CHOLERA_WARNING'
  | 'FLOOD_CONTAMINATION';

export type OutbreakSeverity = 'WATCH' | 'WARNING' | 'CRITICAL';

export interface OutbreakAdvisory {
  id: string;
  title: string;
  type: OutbreakAdvisoryType;
  severity: OutbreakSeverity;
  affectedAreas: string[];
  waterSource?: string;
  boilDurationMinutes?: number;
  clinicDispensingSites?: string[];
  guidance: string;
  issuedByCoordinatorId: string;
  issuedByName: string;
  issuedAt: string;
  isActive: boolean;
}



