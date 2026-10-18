import React, { useState } from 'react';
import {
  AlertTriangle,
  Building2,
  Check,
  ClipboardList,
  Copy,
  Download,
  FileText,
  Printer,
  Shield,
  Truck,
  Users,
  Waves,
  X,
} from 'lucide-react';
import {
  Alert,
  AssistanceRequest,
  Community,
  Incident,
  Mission,
  Resource,
  Shelter,
} from '../../types';
import { safetyCheckInService } from '../../services/safety/safetyCheckInService';

interface SitrepModalProps {
  isOpen: boolean;
  onClose: () => void;
  community: Community | null;
  alerts: Alert[];
  shelters: Shelter[];
  incidents: Incident[];
  assistanceRequests: AssistanceRequest[];
  missions: Mission[];
  resources: Resource[];
}

export const SitrepModal: React.FC<SitrepModalProps> = ({
  isOpen,
  onClose,
  community,
  alerts,
  shelters,
  incidents,
  assistanceRequests,
  missions,
  resources,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const now = new Date();
  const timestampStr = now.toLocaleString('en-PH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const activeAlerts = alerts.filter((a) => a.active);
  const verifiedIncidents = incidents.filter((i) => i.status === 'VERIFIED');
  const pendingIncidents = incidents.filter((i) => i.status === 'REPORTED');
  const criticalAssistance = assistanceRequests.filter((r) => r.priority === 'CRITICAL');
  const highAssistance = assistanceRequests.filter((r) => r.priority === 'HIGH');
  const totalShelterCapacity = shelters.reduce((s, sh) => s + sh.capacityTotal, 0);
  const totalShelterOccupancy = shelters.reduce((s, sh) => s + sh.capacityCurrent, 0);
  const shelterUtilizationPercent = totalShelterCapacity > 0
    ? Math.round((totalShelterOccupancy / totalShelterCapacity) * 100)
    : 0;

  const safetyStats = safetyCheckInService.getSummaryStats();
  const lowResources = resources.filter((r) => r.status === 'LOW' || r.status === 'DEPLETED');
  const activeMissions = missions.filter((m) => m.status === 'IN_PROGRESS' || m.status === 'ASSIGNED');

  const sitrepText = `==================================================================
DISASTER INCIDENT SITUATION REPORT (ICS-209 FORMAT)
BARANGAY TUMANA & MALANDAY RESILIENCE CLUSTER • MARIKINA CITY
==================================================================
REPORT TIME: ${timestampStr}
INCIDENT COMMAND POST: Marikina CDRRMO Sector ICP / Resilia Mesh
OPERATIONAL PERIOD: Active Emergency Monitoring (OP-01)

1. SECTOR HAZARD STATUS & EARLY WARNING
------------------------------------------------------------------
• Declared Disaster Status: ${activeAlerts.length > 0 ? 'EMERGENCY DISASTER PROTOCOL ACTIVE' : 'NORMAL BASELINE MONITORING'}
• River Gauge: ${(community?.riverWaterLevelMeters || 16.8).toFixed(1)} meters [Alarm Level: ${community?.riverAlertLevel || '2ND_ALARM'}]
• Active Advisories (${activeAlerts.length}):
${activeAlerts.length > 0 ? activeAlerts.map(a => `  - [${a.severity}] ${a.title}: ${a.message}`).join('\n') : '  - None active'}

2. CASUALTY, POPULATION & CITIZEN STATUS
------------------------------------------------------------------
• Citizens Accounted Safe: ${safetyStats.totalPeopleAccounted} individuals (${safetyStats.totalCheckIns} households checked in)
• Sheltered in Evac Centers: ${safetyStats.atShelters} registered safe
• Safe at Home / Upper Floors: ${safetyStats.atHome} households
• Currently En Route Evacuating: ${safetyStats.evacuating} households
• Vulnerable Persons Accounted: ${safetyStats.vulnerableCount} (elderly/infants/PWD)

3. FIELD INCIDENT DAMAGE & HAZARDS (TOTAL: ${incidents.length})
------------------------------------------------------------------
• Verified Hazards: ${verifiedIncidents.length}
• Unverified Pending Drone/Field Corroboration: ${pendingIncidents.length}
• Incidents by Type:
  - Flooding / River Breach: ${incidents.filter(i => i.type === 'FLOOD').length}
  - Tsunami / Coastal Surge: ${incidents.filter(i => i.type === 'TSUNAMI').length}
  - Volcano Eruption / Ashfall: ${incidents.filter(i => i.type === 'VOLCANO_ERUPTION').length}
  - Structural / Building Damage: ${incidents.filter(i => i.type === 'BUILDING_DAMAGE').length}
  - Fire Outbreaks: ${incidents.filter(i => i.type === 'FIRE').length}
  - Earthquakes / Landslides: ${incidents.filter(i => i.type === 'EARTHQUAKE' || i.type === 'LANDSLIDE').length}

4. RESCUE & ASSISTANCE TRIAGE QUEUE (TOTAL: ${assistanceRequests.length})
------------------------------------------------------------------
• CRITICAL (Immediate Life Threat / Trapped): ${criticalAssistance.length}
• HIGH Priority (Vulnerable / Medical / Meds): ${highAssistance.length}
• Total Persons Needing Assistance: ${assistanceRequests.reduce((sum, r) => sum + r.peopleCount, 0)}

5. SHELTER CAPABILITY & OCCUPANCY
------------------------------------------------------------------
• Total Shelters Operational: ${shelters.length}
• Sector Utilization: ${shelterUtilizationPercent}% (${totalShelterOccupancy} / ${totalShelterCapacity} evacuees)
• Remaining Open Slots: ${Math.max(0, totalShelterCapacity - totalShelterOccupancy)}
${shelters.map(s => `  - ${s.name}: ${s.capacityCurrent}/${s.capacityTotal} (${Math.round((s.capacityCurrent/s.capacityTotal)*100)}% full)`).join('\n')}

6. RESOURCE DEPLETIONS & CRITICAL SHORTAGES
------------------------------------------------------------------
${lowResources.length > 0 ? lowResources.map(r => `  [CRITICAL DEFICIT] ${r.name} - Only ${r.quantity} ${r.unit} left (${r.status})`).join('\n') : '  - Supplies currently above minimum 25% threshold.'}

7. DISPATCHED RESPONSE TEAMS & MISSIONS
------------------------------------------------------------------
• Active Sorties / Missions: ${activeMissions.length}
• Completed Missions: ${missions.filter(m => m.status === 'COMPLETED').length}
==================================================================
End of SITREP • Prepared by Marikina CDRRMO Disaster Coordinator
==================================================================`;

  const handleCopy = () => {
    navigator.clipboard.writeText(sitrepText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-900/50 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-3xl w-full border border-neutral-200 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col animate-modal">
        {/* Header */}
        <div className="bg-neutral-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-neutral-800 text-white flex items-center justify-center font-semibold shadow-2xs shrink-0">
              <ClipboardList className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm sm:text-base text-white tracking-tight">
                  Incident Commander Situation Report (ICS-209)
                </h3>
                <span className="px-2 py-0.5 rounded bg-white/10 text-neutral-300 text-[10px] uppercase font-semibold tracking-wider">
                  Automated Briefing
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Authoritative tactical operational summary for Mayor, LGU Council & OCD
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Highlights Grid */}
        <div className="bg-neutral-50/80 p-3.5 border-b border-neutral-200 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          <div className="bg-white p-3 rounded-lg border border-neutral-200 shadow-2xs">
            <div className="text-[11px] text-neutral-400 font-semibold uppercase tracking-wider">Sector Status</div>
            <div className="font-semibold text-xs text-neutral-900 mt-1">
              {activeAlerts.length > 0 ? 'Disaster Directive Active' : 'Normal Monitoring'}
            </div>
          </div>

          <div className="bg-white p-3 rounded-lg border border-neutral-200 shadow-2xs">
            <div className="text-[11px] text-neutral-400 font-semibold uppercase tracking-wider">River Stage</div>
            <div className="font-semibold text-xs text-neutral-900 mt-1 tabular-nums">
              {(community?.riverWaterLevelMeters || 16.8).toFixed(1)}m (Alarm {community?.riverAlertLevel ?? 2})
            </div>
          </div>

          <div className="bg-white p-3 rounded-lg border border-neutral-200 shadow-2xs">
            <div className="text-[11px] text-neutral-400 font-semibold uppercase tracking-wider">Critical Requests</div>
            <div className="font-semibold text-xs text-rose-600 mt-1 tabular-nums">
              {criticalAssistance.length} Immediate SOS
            </div>
          </div>

          <div className="bg-white p-3 rounded-lg border border-neutral-200 shadow-2xs">
            <div className="text-[11px] text-neutral-400 font-semibold uppercase tracking-wider">Shelter Occupancy</div>
            <div className="font-semibold text-xs text-neutral-900 mt-1 tabular-nums">
              {shelterUtilizationPercent}% ({totalShelterOccupancy}/{totalShelterCapacity})
            </div>
          </div>
        </div>

        {/* Formatted SITREP Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 font-mono text-xs bg-neutral-950 text-neutral-100 leading-relaxed select-text">
          <pre className="whitespace-pre-wrap">{sitrepText}</pre>
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 bg-white border-t border-neutral-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="text-neutral-500 text-[11px]">
            Generated from local IndexedDB telemetry • Formatted for NDRRMC ICS-209
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-neutral-50 text-neutral-700 font-medium text-xs transition flex items-center gap-1.5 border border-neutral-200 shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5 text-neutral-500" />
              <span>Print Briefing</span>
            </button>
            <button
              onClick={handleCopy}
              className="px-4 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-2xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy SITREP Text'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
