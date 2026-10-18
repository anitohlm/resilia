/**
 * Coordinator AI Recommendations Service
 * Grounded in actual records (unverified reports, contradictory observations,
 * urgent assistance requests with vulnerable residents, shelter capacities, resource depletion).
 * 
 * When Gemini is available online, it is queried; otherwise, the deterministic
 * rules engine analyzes local records to produce evidence-backed recommendations
 * that require human coordinator authorization.
 */

import {
  Alert,
  AssistanceRequest,
  Community,
  Incident,
  Mission,
  Recommendation,
  Resource,
  Shelter,
} from '../../types';
import { syncClient } from '../offline/syncClient';

export interface CoordinatorAIRecommendation {
  id: string;
  category: 'URGENT_ASSISTANCE' | 'CONFLICTING_REPORT' | 'SHELTER_CAPACITY' | 'RESOURCE_SHORTAGE' | 'ROAD_SAFETY';
  title: string;
  rationale: string;
  supportingRecordIds: string[];
  dataFreshness: string;
  verificationStatus: string;
  uncertainties: string[];
  proposedAction: string;
  actionType: 'NAVIGATE' | 'OPEN_DISPATCH' | 'OPEN_VERIFY' | 'OPEN_SHELTER';
  actionTargetId?: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
}

export class CoordinatorAIService {
  /**
   * Generates dynamic, evidence-backed recommendations from live operational state.
   */
  public static generateRecommendations(params: {
    community: Community | null;
    alerts: Alert[];
    shelters: Shelter[];
    incidents: Incident[];
    assistanceRequests: AssistanceRequest[];
    missions: Mission[];
    resources: Resource[];
  }): CoordinatorAIRecommendation[] {
    const { shelters, incidents, assistanceRequests, missions, resources } = params;
    const recs: CoordinatorAIRecommendation[] = [];

    // 1. Unassigned CRITICAL or HIGH assistance requests with vulnerable people
    const criticalAssistance = assistanceRequests.filter(
      (r) =>
        (r.status === 'PENDING' || r.status === 'TRIAGED') &&
        !r.assignedMissionId &&
        (r.priority === 'CRITICAL' || r.vulnerabilityNeeds.wheelchairUser || r.vulnerabilityNeeds.bedridden)
    );

    if (criticalAssistance.length > 0) {
      const target = criticalAssistance[0];
      const needsWheelchair = target.vulnerabilityNeeds.wheelchairUser;
      const needsStretcher = target.vulnerabilityNeeds.bedridden;

      recs.push({
        id: `rec_ast_${target.id}`,
        category: 'URGENT_ASSISTANCE',
        title: `Urgent Request: ${target.residentName} (${target.peopleCount} pax)`,
        rationale: `Request has priority score ${target.priorityScore}/100 with unmet life-safety needs (${[
          needsWheelchair ? 'Wheelchair user' : null,
          needsStretcher ? 'Bedridden' : null,
          target.vulnerabilityNeeds.elderlyCount > 0 ? `${target.vulnerabilityNeeds.elderlyCount} senior(s)` : null,
          target.vulnerabilityNeeds.infantCount > 0 ? `${target.vulnerabilityNeeds.infantCount} infant(s)` : null,
        ]
          .filter(Boolean)
          .join(', ')}). No mission has been approved yet.`,
        supportingRecordIds: [target.id],
        dataFreshness: `Submitted ${new Date(target.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        verificationStatus: 'Citizen-Reported (Unverified field triage)',
        uncertainties: [
          'Flood depth along pickup corridor may exceed standard ground ambulance clearance.',
          'Phone contact should be re-confirmed prior to launching boat dispatch.',
        ],
        proposedAction: 'Generate and authorize an evacuation mission targeting an accessible shelter.',
        actionType: 'OPEN_DISPATCH',
        actionTargetId: target.id,
        severity: 'CRITICAL',
      });
    }

    // 2. Conflicting or Contradicted Incidents
    const conflicting = incidents.filter(
      (i) => i.contradictingReportsCount > 0 || i.status === 'CONTRADICTED' || i.supportingReportsCount > 3
    );

    if (conflicting.length > 0) {
      const target = conflicting[0];
      recs.push({
        id: `rec_inc_${target.id}`,
        category: 'CONFLICTING_REPORT',
        title: `Review Road / Hazard Status: ${target.title}`,
        rationale: `Incident at ${target.locationName} has ${target.supportingReportsCount} supporting report(s) and ${target.contradictingReportsCount} conflicting observation(s). Do not route dispatches through this zone until verified.`,
        supportingRecordIds: [target.id],
        dataFreshness: `Last updated ${new Date(target.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        verificationStatus: target.status,
        uncertainties: [
          'Different vehicle types report diverging passability thresholds (light cars vs high trucks).',
        ],
        proposedAction: 'Direct Barangay Tanod or Rescue 161 drone patrol to conduct physical verification.',
        actionType: 'OPEN_VERIFY',
        actionTargetId: target.id,
        severity: 'WARNING',
      });
    }

    // 3. Shelters near or exceeding capacity
    const fullShelters = shelters.filter(
      (s) => s.status === 'FULL' || s.capacityCurrent >= s.capacityTotal * 0.88
    );

    if (fullShelters.length > 0) {
      const target = fullShelters[0];
      const remaining = Math.max(0, target.capacityTotal - target.capacityCurrent);
      const alternative = shelters.find(
        (s) => s.id !== target.id && s.status === 'OPEN' && s.capacityTotal - s.capacityCurrent > 150
      );

      recs.push({
        id: `rec_sh_${target.id}`,
        category: 'SHELTER_CAPACITY',
        title: `Divert Inflow from ${target.name}`,
        rationale: `Facility is at ${Math.round((target.capacityCurrent / target.capacityTotal) * 100)}% occupancy (${target.capacityCurrent}/${target.capacityTotal}, ${remaining} slots left).${
          alternative ? ` Suggest diverting new evacuees to ${alternative.name} (${alternative.capacityTotal - alternative.capacityCurrent} open slots).` : ''
        }`,
        supportingRecordIds: [target.id, ...(alternative ? [alternative.id] : [])],
        dataFreshness: `Checked ${new Date(target.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        verificationStatus: `Verified by ${target.verifiedBy}`,
        uncertainties: [
          'Self-evacuated walk-ins may not yet be counted in the official registry.',
        ],
        proposedAction: alternative
          ? `Coordinate transit diversion toward ${alternative.name}.`
          : 'Request staging of auxiliary tents or municipal gym overflow.',
        actionType: 'OPEN_SHELTER',
        actionTargetId: target.id,
        severity: remaining === 0 ? 'CRITICAL' : 'WARNING',
      });
    }

    // 4. Resource depletion warning
    const depleting = resources.filter((r) => r.status === 'LOW' || r.estimatedDaysRemaining <= 1.5);
    if (depleting.length > 0) {
      const target = depleting[0];
      recs.push({
        id: `rec_res_${target.id}`,
        category: 'RESOURCE_SHORTAGE',
        title: `Critical Supply Buffer: ${target.name}`,
        rationale: `Stock level is ${target.quantity} ${target.unit} at ${target.locationName}. At current recorded consumption of ${target.consumptionRatePerDay}/day, stock will be exhausted in ~${target.estimatedDaysRemaining} days.`,
        supportingRecordIds: [target.id],
        dataFreshness: `Updated ${new Date(target.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        verificationStatus: 'Stored Inventory Ledger',
        uncertainties: [
          'Consumption rate accelerates significantly if flash flooding forces unexpected overnight intake.',
        ],
        proposedAction: 'Initiate municipal emergency buffer requisition or inbound logistics transfer.',
        actionType: 'NAVIGATE',
        severity: target.estimatedDaysRemaining <= 0.8 ? 'CRITICAL' : 'WARNING',
      });
    }

    return recs;
  }
}
