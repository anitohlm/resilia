/**
 * Resilia Role-Based Access Control (RBAC) Matrix & Permission Guide
 * Explicitly breaks down what each role can access and execute:
 * - RESIDENT: Only Residents report incidents, submit help requests, ask Resilia AI, view map & sync.
 * - COORDINATOR: Verifies incidents, assigns responders, approves mission proposals, manages shelters & resources.
 * - RESPONDER: Receives incident reports in real time, responds to dispatches, updates ground status, completes missions.
 */

import React from 'react';
import { useAuth } from '../../services/auth/authContext';
import { UserRole } from '../../types';
import {
  ShieldCheck,
  UserCheck,
  HardHat,
  X,
  Check,
  Ban,
  ArrowRight,
  AlertTriangle,
  Building2,
  FileCheck2,
  Truck,
  HeartHandshake,
  Activity,
  Compass,
  HelpCircle,
} from 'lucide-react';

interface RbacMatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRole?: (role: UserRole) => void;
}

interface PermissionRow {
  capability: string;
  category: string;
  description: string;
  resident: boolean | string;
  responder: boolean | string;
  coordinator: boolean | string;
}

export const RbacMatrixModal: React.FC<RbacMatrixModalProps> = ({ isOpen, onClose, onSelectRole }) => {
  const { currentUser, setRole } = useAuth();

  if (!isOpen) return null;

  const permissions: PermissionRow[] = [
    {
      capability: 'Report Emergency Incidents & Distress',
      category: 'Field & Citizen Triage',
      description: 'Report floods, earthquakes, collapsed structures, fires, and persons in distress with GPS. Authorized for Residents and Responders on the ground.',
      resident: true,
      responder: true,
      coordinator: false,
    },
    {
      capability: 'Request Emergency Assistance',
      category: 'Citizen Triage',
      description: 'Submit household headcounts, seniors, infants, and wheelchair vulnerability needs.',
      resident: true,
      responder: false,
      coordinator: false,
    },
    {
      capability: 'Assign Responder to Incident',
      category: 'Command & Dispatch',
      description: 'Authoritative assignment of field responders (Rescue 161, boat crews) to citizen incidents.',
      resident: false,
      responder: false,
      coordinator: true,
    },
    {
      capability: 'Verify & Contradict Incidents',
      category: 'Command & Dispatch',
      description: 'Authoritative verification engine with audit trail and multi-report corroboration logic.',
      resident: false,
      responder: false,
      coordinator: true,
    },
    {
      capability: 'Approve & Reject Rescue Missions',
      category: 'Command & Dispatch',
      description: 'Human-in-the-loop review of AI-generated route proposals and vehicle dispatch approvals.',
      resident: false,
      responder: false,
      coordinator: true,
    },
    {
      capability: 'Modify Shelter Capacities & Amenities',
      category: 'Resource Management',
      description: 'Update real-time bed count, wheelchair ramps, generators, clinic availability, and open/full status.',
      resident: false,
      responder: false,
      coordinator: true,
    },
    {
      capability: 'Relief Inventory Movements',
      category: 'Resource Management',
      description: 'Log inbound water, food packs, and medical supplies, calculate burn rates and days of supply remaining.',
      resident: false,
      responder: false,
      coordinator: true,
    },
    {
      capability: 'Receive Incident Reports & Missions',
      category: 'Field Operations',
      description: 'Live field queue of all resident incident reports, flood warnings, and assigned tasks.',
      resident: false,
      responder: true,
      coordinator: true,
    },
    {
      capability: 'Respond to Dispatched Incidents',
      category: 'Field Operations',
      description: 'Acknowledge dispatch, update operational transit status (En Route, On Scene, Mark Resolved).',
      resident: false,
      responder: true,
      coordinator: true,
    },
    {
      capability: 'Submit Field Corroboration / Road Status',
      category: 'Field Operations',
      description: 'Corroborate flood depths, ground fissures, and road passability directly from the disaster zone.',
      resident: false,
      responder: true,
      coordinator: true,
    },
    {
      capability: 'Interactive Google Maps & Shelters',
      category: 'Situational Awareness',
      description: 'Explore live markers, flood risk polygons, hazard perimeters, and nearest evacuation points.',
      resident: true,
      responder: true,
      coordinator: true,
    },
    {
      capability: 'Ask Resilia Disaster AI & Protocols',
      category: 'Situational Awareness',
      description: 'Query localized disaster preparedness, flood safety, earthquake drop-cover-hold, and shelter info.',
      resident: true,
      responder: true,
      coordinator: true,
    },
    {
      capability: 'Durable Offline Sync & Queue',
      category: 'System Resilience',
      description: 'Inspect local IndexedDB storage, pending replication queue, and sync health.',
      resident: true,
      responder: true,
      coordinator: true,
    },
  ];

  const handleSwitchRole = (role: UserRole) => {
    setRole(role);
    if (onSelectRole) onSelectRole(role);
  };

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-xl border border-neutral-200 shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden text-neutral-900">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-200 bg-neutral-50/80 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[10px] font-mono font-semibold uppercase tracking-wider border border-emerald-200">
                Security & Governance
              </span>
              <span className="text-[11px] text-neutral-500 font-mono">RBAC Specification</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-neutral-900 tracking-tight">
              Role-Based Access Control (RBAC) Matrix
            </h2>
            <p className="text-xs text-neutral-600 mt-1 max-w-2xl leading-relaxed">
              Resilia enforces strict operational segregation of duties. Residents report emergencies, Coordinators dispatch and verify, and Responders execute and corroborate.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Operational Workflow Lifecycle Pill Bar */}
        <div className="bg-emerald-950 text-emerald-100 px-5 py-3 text-xs border-b border-emerald-900/60 flex flex-wrap items-center justify-between gap-3">
          <span className="font-bold text-white flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>Core RBAC Operational Flow:</span>
          </span>
          <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
            <span className="bg-emerald-800/80 px-2 py-0.5 rounded font-bold text-emerald-200">
              1. RESIDENT Reports Incident
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
            <span className="bg-amber-800/80 px-2 py-0.5 rounded font-bold text-amber-200">
              2. COORDINATOR Assigns Responder
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
            <span className="bg-teal-800/80 px-2 py-0.5 rounded font-bold text-teal-200">
              3. RESPONDER Responds & Resolves
            </span>
          </div>
        </div>

        {/* Persona Switcher Quick Bar */}
        <div className="p-4 bg-neutral-100 border-b border-neutral-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-neutral-600">Active Persona:</span>
            <span className="font-bold text-neutral-900 bg-white px-2 py-1 rounded-lg border border-neutral-200 shadow-2xs">
              {currentUser.name} ({currentUser.role})
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-neutral-500 font-medium">Switch Role:</span>
            <button
              onClick={() => handleSwitchRole('RESIDENT')}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1 text-xs ${
                currentUser.role === 'RESIDENT'
                  ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-300'
                  : 'bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-300'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Resident (Citizen)</span>
            </button>
            <button
              onClick={() => handleSwitchRole('RESPONDER')}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1 text-xs ${
                currentUser.role === 'RESPONDER'
                  ? 'bg-teal-600 text-white shadow-sm ring-2 ring-teal-300'
                  : 'bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-300'
              }`}
            >
              <HardHat className="w-3.5 h-3.5" />
              <span>Emergency Responder</span>
            </button>
            <button
              onClick={() => handleSwitchRole('COORDINATOR')}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1 text-xs ${
                currentUser.role === 'COORDINATOR'
                  ? 'bg-amber-600 text-white shadow-sm ring-2 ring-amber-300'
                  : 'bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-300'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Disaster Coordinator</span>
            </button>
          </div>
        </div>

        {/* Permissions Table */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          <div className="overflow-x-auto rounded-2xl border border-neutral-200 shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-900 text-white uppercase text-[10px] font-extrabold tracking-wider">
                <tr>
                  <th className="py-3 px-4">Capability & Scope</th>
                  <th className="py-3 px-4 text-center bg-emerald-950/80 text-emerald-200">
                    Resident
                    <div className="normal-case font-normal text-[9px] text-emerald-300">Lola Rosa / Carlo</div>
                  </th>
                  <th className="py-3 px-4 text-center bg-teal-950/80 text-teal-200">
                    Responder
                    <div className="normal-case font-normal text-[9px] text-teal-300">Officer Juan / Rescue 161</div>
                  </th>
                  <th className="py-3 px-4 text-center bg-amber-950/80 text-amber-200">
                    Coordinator
                    <div className="normal-case font-normal text-[9px] text-amber-300">Capt. Maria / ICP Head</div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {permissions.map((p, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white hover:bg-neutral-50' : 'bg-neutral-50/50 hover:bg-neutral-50'}>
                    <td className="py-3 px-4 max-w-sm">
                      <div className="font-bold text-neutral-900">{p.capability}</div>
                      <div className="text-[11px] text-neutral-500 mt-0.5">{p.description}</div>
                    </td>

                    {/* Resident Column */}
                    <td className="py-3 px-4 text-center border-l border-neutral-200/60">
                      {p.resident ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                          <Check className="w-3.5 h-3.5" /> Allowed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-neutral-100 text-neutral-400 font-semibold text-[11px]">
                          <Ban className="w-3 h-3 text-neutral-400" /> Restricted
                        </span>
                      )}
                    </td>

                    {/* Responder Column */}
                    <td className="py-3 px-4 text-center border-l border-neutral-200/60">
                      {p.responder ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-teal-100 text-teal-800 font-bold text-[11px]">
                          <Check className="w-3.5 h-3.5" /> Allowed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-neutral-100 text-neutral-400 font-semibold text-[11px]">
                          <Ban className="w-3 h-3 text-neutral-400" /> Restricted
                        </span>
                      )}
                    </td>

                    {/* Coordinator Column */}
                    <td className="py-3 px-4 text-center border-l border-neutral-200/60">
                      {p.coordinator ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-100 text-amber-800 font-bold text-[11px]">
                          <Check className="w-3.5 h-3.5" /> Allowed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-neutral-100 text-neutral-400 font-semibold text-[11px]">
                          <Ban className="w-3 h-3 text-neutral-400" /> Restricted
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Detailed Explanatory Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                <UserCheck className="w-4 h-4" />
                <h4>Resident Role Scope</h4>
              </div>
              <p className="text-[11px] text-emerald-900/80 leading-relaxed">
                Residents are the primary on-the-ground reporters. They log earthquakes, water levels, road blocks, and request life-saving help. To protect data purity, residents cannot alter command statuses, dispatch vehicles, or modify shelter parameters.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2">
              <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
                <ShieldCheck className="w-4 h-4" />
                <h4>Coordinator Role Scope</h4>
              </div>
              <p className="text-[11px] text-amber-900/80 leading-relaxed">
                Coordinators are authoritative incident commanders. They triage incoming citizen reports, assign specific responders, verify disaster rumors with audit trails, and maintain shelter capacities & relief inventories.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 space-y-2">
              <div className="flex items-center gap-2 text-teal-800 font-bold text-sm">
                <HardHat className="w-4 h-4" />
                <h4>Responder Role Scope</h4>
              </div>
              <p className="text-[11px] text-teal-900/80 leading-relaxed">
                Responders are field operatives (e.g. Marikina Rescue 161). They receive coordinator dispatches, acknowledge tasks, mark status transitions (En Route, On Scene, Resolved), and submit field corroborations.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-200 bg-neutral-50 flex items-center justify-between">
          <span className="text-[11px] text-neutral-500 font-medium">
            Enforced across all API endpoints, IndexedDB repositories, and UI views.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs transition"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
