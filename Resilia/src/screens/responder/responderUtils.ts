/**
 * Responder Utilities & Domain Helpers
 * Provides mission lifecycle validations, status formatting,
 * evidence provenance checks, and truth-telling offline status indicators.
 */

import { Alert, AssistanceRequest, Incident, Mission, MissionStatus, ResponderOperationalStatus } from '../../types';

export const RESPONDER_STATUS_KEY = 'resilia_responder_availability';

export interface ResponderAvailability {
  status: ResponderOperationalStatus;
  updatedAt: string;
  notes?: string;
  shareLocation: boolean;
}

export function getStoredResponderAvailability(): ResponderAvailability {
  try {
    const raw = localStorage.getItem(RESPONDER_STATUS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // fallback
  }
  return {
    status: 'UNASSIGNED',
    updatedAt: new Date().toISOString(),
    shareLocation: false,
  };
}

export function setStoredResponderAvailability(data: ResponderAvailability): void {
  try {
    localStorage.setItem(RESPONDER_STATUS_KEY, JSON.stringify(data));
  } catch (e) {
    // ignore
  }
}

/**
 * Derives the responder's primary active mission.
 * Prioritizes missions assigned to the current user in ACCEPTED or IN_PROGRESS,
 * followed by ASSIGNED / APPROVED.
 */
export function getActiveResponderMission(missions: Mission[], responderId: string, responderName: string): Mission | null {
  const myMissions = missions.filter(
    (m) =>
      (m.assignedResponderId === responderId || (m.assignedResponderName && m.assignedResponderName.includes(responderName))) &&
      m.status !== 'COMPLETED' &&
      m.status !== 'CANCELLED' &&
      m.status !== 'REJECTED'
  );

  if (myMissions.length === 0) return null;

  // Prioritize IN_PROGRESS, then ACCEPTED, then ASSIGNED / APPROVED
  const inProgress = myMissions.find((m) => m.status === 'IN_PROGRESS');
  if (inProgress) return inProgress;

  const accepted = myMissions.find((m) => m.status === 'ACCEPTED');
  if (accepted) return accepted;

  const assigned = myMissions.find((m) => m.status === 'ASSIGNED' || m.status === 'APPROVED');
  if (assigned) return assigned;

  return myMissions[0];
}

/**
 * Returns the context-sensitive next operational action for a mission.
 */
export function getMissionNextAction(mission: Mission): {
  label: string;
  nextStatus: MissionStatus;
  variant: 'primary' | 'warning' | 'info';
  description: string;
  requiresReport: boolean;
} | null {
  switch (mission.status) {
    case 'APPROVED':
    case 'ASSIGNED':
      return {
        label: 'ACCEPT MISSION',
        nextStatus: 'ACCEPTED',
        variant: 'primary',
        description: 'Acknowledge assignment and confirm deployment capability.',
        requiresReport: false,
      };
    case 'ACCEPTED':
      return {
        label: 'START EN ROUTE',
        nextStatus: 'IN_PROGRESS',
        variant: 'primary',
        description: 'Commence mobilization toward the incident staging location.',
        requiresReport: false,
      };
    case 'IN_PROGRESS':
      return {
        label: 'COMPLETE MISSION',
        nextStatus: 'COMPLETED',
        variant: 'info',
        description: 'Submit final completion report and confirm all persons are safe.',
        requiresReport: true,
      };
    default:
      return null;
  }
}

/**
 * Human-readable mission status badges
 */
export function getMissionStatusBadge(status: MissionStatus): {
  label: string;
  bg: string;
  text: string;
  border: string;
} {
  switch (status) {
    case 'PROPOSED':
      return { label: 'Proposed (Unapproved)', bg: 'bg-neutral-100', text: 'text-neutral-700', border: 'border-neutral-300' };
    case 'APPROVED':
      return { label: 'Approved (Pending Accept)', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' };
    case 'ASSIGNED':
      return { label: 'Assigned to You', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' };
    case 'ACCEPTED':
      return { label: 'Accepted (Mobilizing)', bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' };
    case 'IN_PROGRESS':
      return { label: 'In Progress (On Scene)', bg: 'bg-emerald-100', text: 'text-emerald-900', border: 'border-emerald-300' };
    case 'COMPLETED':
      return { label: 'Mission Completed', bg: 'bg-neutral-100', text: 'text-neutral-700', border: 'border-neutral-200' };
    case 'CANCELLED':
      return { label: 'Mission Cancelled', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' };
    case 'REJECTED':
      return { label: 'Proposal Rejected', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' };
  }
}

/**
 * Validates photo provenance: ensures no mismatched photos are presented as real evidence.
 */
export function formatEvidenceNotice(incident?: Incident | null): {
  hasPhoto: boolean;
  photoUrl?: string;
  isSimulated: boolean;
  provenanceLabel: string;
} {
  if (!incident || !incident.photoUrl) {
    return {
      hasPhoto: false,
      isSimulated: false,
      provenanceLabel: 'No field photo available.',
    };
  }

  // Check if simulated or demo data
  const isSimulated = incident.photoUrl.includes('unsplash.com') || incident.id.startsWith('inc_');

  return {
    hasPhoto: true,
    photoUrl: incident.photoUrl,
    isSimulated,
    provenanceLabel: isSimulated
      ? 'SIMULATED EXERCISE DATA — FOR TRAINING / DEMONSTRATION ONLY'
      : `Field Photo • Submitted by ${incident.reporterName} (${new Date(incident.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
  };
}

/**
 * Formats offline sync truthfulness
 */
export function formatSyncDeliveryNotice(isOffline: boolean, pendingCount: number): string {
  if (isOffline || pendingCount > 0) {
    return 'Update saved on this device. It has not yet reached the command center.';
  }
  return 'Synchronized with Command Center';
}
