/**
 * Resilia Strict Role-Based Access Control (RBAC) Architecture
 * Principle of Least Privilege: Users never see what they cannot do.
 */

import { UserRole } from '../../types';
import { ScreenId } from '../../components/layout/Navbar';

export const ROLE_ALLOWED_SCREENS: Record<UserRole, ScreenId[]> = {
  RESIDENT: [
    'HOME',
    'MAP',
    'REQUEST_ASSISTANCE',
    'REPORT_INCIDENT',
    'RESOURCES_SHELTERS',
    'ASK_RESILIA',
    'SYNC_CENTER',
    'MARK_SAFE',
    'UPDATES',
    'MORE',
  ],
  RESPONDER: [
    'HOME',
    'MAP',
    'MISSIONS',
    'REPORT_INCIDENT',
    'RESOURCES_SHELTERS',
    'ASK_RESILIA',
    'SYNC_CENTER',
  ],
  COORDINATOR: [
    'COORDINATOR',
    'MAP',
  ],
};

/**
 * Checks if a screen is permitted for the active user role.
 */
export function isScreenAllowedForRole(screen: ScreenId, role: UserRole): boolean {
  const allowed = ROLE_ALLOWED_SCREENS[role];
  return allowed ? allowed.includes(screen) : false;
}

/**
 * Default landing screen for each role
 */
export function getDefaultScreenForRole(role: UserRole): ScreenId {
  switch (role) {
    case 'COORDINATOR':
      return 'COORDINATOR';
    case 'RESPONDER':
      return 'HOME';
    case 'RESIDENT':
    default:
      return 'HOME';
  }
}

export interface RolePermissions {
  canReportIncidents: boolean;
  canRequestAssistance: boolean;
  canVerifyIncidents: boolean;
  canApproveMissions: boolean;
  canAcceptMissions: boolean;
  canRespondToIncidents: boolean;
  canAssignResponders: boolean;
  canManageResources: boolean;
  canDeclareDisaster: boolean;
  canStandDownDisaster: boolean;
  canBroadcastSiren: boolean;
  canInspectSafeRoster: boolean;
  canAccessCommandDashboard: boolean;
  canAccessFieldMissions: boolean;
  canAccessVerification: boolean;
}

export function getRolePermissions(role: UserRole): RolePermissions {
  switch (role) {
    case 'COORDINATOR':
      return {
        canReportIncidents: false, // Coordinators command & triage; reporting is from field
        canRequestAssistance: false, // Citizens request aid; coordinators coordinate
        canVerifyIncidents: true,
        canApproveMissions: true,
        canAcceptMissions: true,
        canRespondToIncidents: true,
        canAssignResponders: true,
        canManageResources: true,
        canDeclareDisaster: true,
        canStandDownDisaster: true,
        canBroadcastSiren: true,
        canInspectSafeRoster: true,
        canAccessCommandDashboard: true,
        canAccessFieldMissions: true,
        canAccessVerification: true,
      };
    case 'RESPONDER':
      return {
        canReportIncidents: true,
        canRequestAssistance: false,
        canVerifyIncidents: false,
        canApproveMissions: false,
        canAcceptMissions: true,
        canRespondToIncidents: true,
        canAssignResponders: false,
        canManageResources: false,
        canDeclareDisaster: false,
        canStandDownDisaster: false,
        canBroadcastSiren: false,
        canInspectSafeRoster: false,
        canAccessCommandDashboard: false,
        canAccessFieldMissions: true,
        canAccessVerification: false,
      };
    case 'RESIDENT':
    default:
      return {
        canReportIncidents: true,
        canRequestAssistance: true,
        canVerifyIncidents: false,
        canApproveMissions: false,
        canAcceptMissions: false,
        canRespondToIncidents: false,
        canAssignResponders: false,
        canManageResources: false,
        canDeclareDisaster: false,
        canStandDownDisaster: false,
        canBroadcastSiren: false,
        canInspectSafeRoster: false,
        canAccessCommandDashboard: false,
        canAccessFieldMissions: false,
        canAccessVerification: false,
      };
  }
}
