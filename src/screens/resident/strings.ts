/**
 * Resident UI copy (English default).
 * Kept in one place so localization files can be added later without touching components.
 */

import { AssistanceCategory, AssistanceStatus, IncidentType, ShelterStatus } from '../../types';

export const t = {
  brand: 'Resilia',
  tagline: 'Community disaster coordination platform.',
  greeting: 'Hello, how can we help you?',

  nav: {
    HOME: 'Home',
    MAP: 'Map',
    REQUEST_ASSISTANCE: 'Get Help',
    UPDATES: 'Updates',
    MORE: 'More',
  },

  connection: {
    ONLINE: 'Connected',
    SYNCING: 'Connected · sending saved items',
    DEGRADED: 'Limited connection',
    SYNC_ERROR: 'Limited connection',
    OFFLINE: 'Offline mode — Resilia is still available',
  },

  offlineBanner:
    "You're offline. You can still view saved community information and record a request for help. Anything you send will be delivered when the connection returns.",

  delivery: {
    PENDING: 'Saved on this device. Not yet delivered to your community coordinator.',
    FAILED: 'Saved on this device. Delivery failed — Resilia will try again.',
    DELIVERED: 'Delivered to the community system',
    NO_RECORD: 'No sending record on this device',
  },
};

export const HELP_CATEGORIES: { cat: AssistanceCategory; label: string; hint: string }[] = [
  { cat: 'EMERGENCY_RESCUE', label: 'Emergency or rescue', hint: 'Someone is in danger now' },
  { cat: 'EVACUATION', label: 'Evacuation', hint: 'Help leaving your home' },
  { cat: 'WATER', label: 'Drinking water', hint: 'Safe water to drink' },
  { cat: 'FOOD', label: 'Food', hint: 'Meals or food packs' },
  { cat: 'MEDICINE', label: 'Medicine', hint: 'Medicine or first aid' },
  { cat: 'TRANSPORTATION', label: 'Transportation', hint: 'A ride to safety or care' },
  { cat: 'SHELTER', label: 'Shelter', hint: 'A place to stay' },
  { cat: 'OTHER', label: 'Other assistance', hint: 'Something else' },
];

export const helpCategoryLabel = (c: AssistanceCategory) =>
  HELP_CATEGORIES.find((h) => h.cat === c)?.label ?? 'Assistance';

export const REPORT_TYPES: { type: IncidentType; label: string }[] = [
  { type: 'FLOOD', label: 'Flooding' },
  { type: 'ROAD_BLOCKED', label: 'Blocked road' },
  { type: 'BUILDING_DAMAGE', label: 'Building damage' },
  { type: 'FIRE', label: 'Fire' },
  { type: 'POWER_OUTAGE', label: 'Power outage' },
  { type: 'MEDICAL_EMERGENCY', label: 'Medical emergency' },
  { type: 'OTHER', label: 'Other' },
];

export const reportTypeLabel = (type: IncidentType) =>
  REPORT_TYPES.find((r) => r.type === type)?.label ?? type.replace(/_/g, ' ').toLowerCase();

/** Plain-language request status. Never implies dispatch without a recorded assignment. */
export function requestStatusText(status: AssistanceStatus, hasAssignment: boolean): string {
  switch (status) {
    case 'PENDING':
      return 'Waiting for coordinator review';
    case 'TRIAGED':
      return 'Reviewed by a coordinator — no responder assigned yet';
    case 'ASSIGNED':
    case 'IN_PROGRESS':
      return hasAssignment
        ? 'A responder assignment has been recorded'
        : 'Reviewed by a coordinator — assignment not yet confirmed';
    case 'FULFILLED':
      return 'Marked as completed';
    case 'CANCELLED':
      return 'Cancelled';
  }
}

export const SHELTER_STATUS_TEXT: Record<ShelterStatus, string> = {
  OPEN: 'Has space',
  NEAR_CAPACITY: 'Almost full',
  FULL: 'Full',
  CLOSED: 'Closed',
};
