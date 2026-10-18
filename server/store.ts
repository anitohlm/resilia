/**
 * Resilia Central Cloud Store
 * Represents central cloud persistence (Firestore model) for server-side verification,
 * idempotent sync processing, UUID deduplication, and conflict tracking.
 */

import {
  Alert,
  AssistanceRequest,
  AuditEntry,
  Community,
  Incident,
  InventoryMovement,
  Mission,
  Report,
  Resource,
  Shelter,
  SyncConflict,
  SyncEvent,
  TriageRecord,
  RationDistributionRecord,
  MissingKinRecord,
  MutualAidPost,
  FloodExposureRecord,
} from '../src/types';

class CentralCloudStore {
  public community: Community = {
    id: 'comm_marikina_tumana_malanday',
    name: 'Barangay Tumana & Malanday Resilience Cluster',
    municipality: 'Marikina City',
    region: 'National Capital Region (NCR), Philippines',
    population: 74200,
    riverWaterLevelMeters: 16.8,
    riverAlertLevel: 2,
    weatherCondition: 'Heavy Monsoon Rain',
    rainfallStatus: 'Red Rainfall Advisory',
    powerStatus: 'PARTIAL_OUTAGE',
    commsStatus: 'DEGRADED_CELLULAR',
    lastUpdated: new Date().toISOString(),
    source: 'Marikina City DRRMO Live Monitoring Station',
  };

  public shelters: Map<string, Shelter> = new Map([
    [
      'sh_malanday_elem',
      {
        id: 'sh_malanday_elem',
        name: 'Malanday Elementary School Evacuation Center',
        locationName: 'M.H. Del Pilar St., Brgy. Malanday',
        lat: 14.6592,
        lng: 121.0965,
        capacityTotal: 850,
        capacityCurrent: 620,
        isAccessibleWheelchair: true,
        hasBackupPower: true,
        hasMedicalClinic: true,
        hasPotableWater: true,
        contactPerson: 'Principal Elena Ramos',
        contactPhone: '+63 919 123 4567',
        status: 'OPEN',
        verifiedAt: new Date().toISOString(),
        verifiedBy: 'Capt. Maria Santos',
        lastUpdated: new Date().toISOString(),
      },
    ],
    [
      'sh_bulelak_gym',
      {
        id: 'sh_bulelak_gym',
        name: 'Bulelak Covered Court Evacuation Facility',
        locationName: 'Bulelak St., Brgy. Malanday',
        lat: 14.6615,
        lng: 121.0988,
        capacityTotal: 300,
        capacityCurrent: 285,
        isAccessibleWheelchair: true,
        hasBackupPower: false,
        hasMedicalClinic: false,
        hasPotableWater: true,
        contactPerson: 'Kagawad Rey Tolentino',
        contactPhone: '+63 917 234 5678',
        status: 'NEAR_CAPACITY',
        verifiedAt: new Date().toISOString(),
        verifiedBy: 'MCDRRMO Inspection Team',
        lastUpdated: new Date().toISOString(),
      },
    ],
  ]);

  public resources: Map<string, Resource> = new Map([
    [
      'res_water_malanday',
      {
        id: 'res_water_malanday',
        name: 'Purified Potable Water (5-Gallon Bottles)',
        category: 'WATER',
        quantity: 140,
        unit: '5-gal containers',
        locationId: 'sh_malanday_elem',
        locationName: 'Malanday Elementary School',
        status: 'AVAILABLE',
        consumptionRatePerDay: 50,
        estimatedDaysRemaining: 2.8,
        lastUpdated: new Date().toISOString(),
      },
    ],
  ]);

  public incidents: Map<string, Incident> = new Map([
    [
      'inc_tumana_dike_overtopping',
      {
        id: 'inc_tumana_dike_overtopping',
        type: 'FLOOD',
        title: 'Flood Overtopping at Purok 4 Tumana Dike Side',
        description: 'River water spilling over secondary retaining wall. Waist-deep floodwater entering residential lane.',
        lat: 14.658,
        lng: 121.102,
        locationName: 'Purok 4, Tumana Dike Access Road',
        reporterId: 'user_resident_lola_rosa',
        reporterName: 'Lola Rosa Macaraeg',
        reporterRole: 'RESIDENT',
        severity: 'HIGH',
        status: 'VERIFIED',
        floodDepthCm: 110,
        createdAt: new Date().toISOString(),
        verifiedAt: new Date().toISOString(),
        verifiedBy: 'Capt. Maria Santos',
        verificationRationale: 'Confirmed by Barangay Tanod patrol and drone sweep.',
        supportingReportsCount: 4,
        contradictingReportsCount: 0,
      },
    ],
  ]);

  public assistanceRequests: Map<string, AssistanceRequest> = new Map();
  public missions: Map<string, Mission> = new Map();
  public reports: Map<string, Report> = new Map();
  public safetyCheckIns: Map<string, any> = new Map();
  public auditEntries: AuditEntry[] = [];
  public alerts: Map<string, Alert> = new Map();
  public triageRecords: Map<string, TriageRecord> = new Map();
  public rationDistributions: Map<string, RationDistributionRecord> = new Map();
  public missingPersons: Map<string, MissingKinRecord> = new Map();
  public mutualAidPosts: Map<string, MutualAidPost> = new Map();
  public outbreakWatch: Map<string, FloodExposureRecord> = new Map();

  // Idempotency ledger: tracks all processed event_id UUIDs to prevent duplicate execution
  public processedEventIds: Set<string> = new Set();

  /**
   * Idempotently processes a batch of sync events uploaded from an offline client device.
   */
  public processSyncEvents(events: SyncEvent[]): {
    acknowledgements: {
      event_id: string;
      ack_at: string;
      status: 'ACKNOWLEDGED' | 'CONFLICT';
      conflict_details?: any;
    }[];
  } {
    const acknowledgements: any[] = [];
    const now = new Date().toISOString();

    for (const evt of events) {
      // 1. Idempotency Check: if already processed, return duplicate ack immediately
      if (this.processedEventIds.has(evt.event_id)) {
        acknowledgements.push({
          event_id: evt.event_id,
          ack_at: now,
          status: 'ACKNOWLEDGED',
        });
        continue;
      }

      try {
        // 2. Conflict Detection for operational facts
        if (evt.entity_type === 'shelter' && evt.operation === 'UPDATE') {
          const current = this.shelters.get(evt.entity_id);
          if (current && new Date(current.lastUpdated).getTime() > new Date(evt.created_at).getTime()) {
            // Remote version is newer than local event creation
            acknowledgements.push({
              event_id: evt.event_id,
              ack_at: now,
              status: 'CONFLICT',
              conflict_details: {
                conflictType: 'CONCURRENT_MODIFICATION',
                serverVersion: current,
              },
            });
            continue;
          }
          this.shelters.set(evt.entity_id, evt.payload);
        } else if (evt.entity_type === 'incident') {
          this.incidents.set(evt.entity_id, evt.payload);
        } else if (evt.entity_type === 'assistance_request') {
          this.assistanceRequests.set(evt.entity_id, evt.payload);
        } else if (evt.entity_type === 'mission') {
          const current = this.missions.get(evt.entity_id);
          if (current && evt.operation === 'UPDATE') {
            const VALID_TRANSITIONS: Record<string, string[]> = {
              PROPOSED: ['APPROVED', 'REJECTED', 'CANCELLED'],
              APPROVED: ['ASSIGNED', 'ACCEPTED', 'CANCELLED'],
              ASSIGNED: ['ACCEPTED', 'CANCELLED'],
              ACCEPTED: ['IN_PROGRESS', 'CANCELLED'],
              IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
              COMPLETED: [],
              REJECTED: [],
              CANCELLED: [],
            };
            const allowed = VALID_TRANSITIONS[current.status] || [];
            if (evt.payload?.status && current.status !== evt.payload.status && !allowed.includes(evt.payload.status)) {
              acknowledgements.push({
                event_id: evt.event_id,
                ack_at: now,
                status: 'CONFLICT',
                conflict_details: {
                  conflictType: 'INVALID_STATE_TRANSITION',
                  serverVersion: current,
                  attemptedStatus: evt.payload.status,
                },
              });
              continue;
            }
          }
          this.missions.set(evt.entity_id, evt.payload);
        } else if (evt.entity_type === 'resource') {
          // Authorization check: Only Coordinators can update resource inventories
          if (evt.payload?._actorRole && evt.payload._actorRole !== 'COORDINATOR') {
            acknowledgements.push({
              event_id: evt.event_id,
              ack_at: now,
              status: 'CONFLICT',
              conflict_details: {
                conflictType: 'UNAUTHORIZED_MUTATION',
                reason: 'Only Disaster Coordinators can modify emergency relief resource stock.',
              },
            });
            continue;
          }
          this.resources.set(evt.entity_id, evt.payload);
        } else if (evt.entity_type === 'report') {
          this.reports.set(evt.entity_id, evt.payload);
        } else if (evt.entity_type === 'safety_checkin') {
          this.safetyCheckIns.set(evt.entity_id, evt.payload);
        } else if (evt.entity_type === 'triage_record') {
          this.triageRecords.set(evt.entity_id, evt.payload);
        } else if (evt.entity_type === 'ration_distribution') {
          this.rationDistributions.set(evt.entity_id, evt.payload);
        } else if (evt.entity_type === 'missing_kin') {
          this.missingPersons.set(evt.entity_id, evt.payload);
        } else if (evt.entity_type === 'mutual_aid') {
          this.mutualAidPosts.set(evt.entity_id, evt.payload);
        } else if (evt.entity_type === 'outbreak_watch') {
          this.outbreakWatch.set(evt.entity_id, evt.payload);
        } else if (evt.entity_type === 'alert') {
          this.alerts.set(evt.entity_id, evt.payload);
        }

        // Mark event as processed in ledger
        this.processedEventIds.add(evt.event_id);

        acknowledgements.push({
          event_id: evt.event_id,
          ack_at: now,
          status: 'ACKNOWLEDGED',
        });
      } catch (err: any) {
        console.warn(`Failed to process event ${evt.event_id}:`, err);
      }
    }

    return { acknowledgements };
  }

  public getChangesSince(sinceTimestamp?: string): Record<string, any[]> {
    // 10-second safety margin to prevent missed updates from network transit and clock differences
    const sinceTime = sinceTimestamp ? Math.max(0, new Date(sinceTimestamp).getTime() - 10000) : 0;

    const filterSince = (items: Iterable<any>) =>
      Array.from(items).filter((item) => {
        const itemTime = item.updatedAt || item.lastUpdated || item.createdAt || item.timestamp;
        if (!itemTime) return true;
        return new Date(itemTime).getTime() >= sinceTime;
      });

    return {
      shelters: filterSince(this.shelters.values()),
      resources: filterSince(this.resources.values()),
      incidents: filterSince(this.incidents.values()),
      assistanceRequests: filterSince(this.assistanceRequests.values()),
      missions: filterSince(this.missions.values()),
      reports: filterSince(this.reports.values()),
      alerts: filterSince(this.alerts.values()),
      triageRecords: filterSince(this.triageRecords.values()),
      rationDistributions: filterSince(this.rationDistributions.values()),
      missingPersons: filterSince(this.missingPersons.values()),
      mutualAidPosts: filterSince(this.mutualAidPosts.values()),
      outbreakWatch: filterSince(this.outbreakWatch.values()),
    };
  }
}

export const cloudStore = new CentralCloudStore();
