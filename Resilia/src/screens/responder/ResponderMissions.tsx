/**
 * Responder Missions List & Management Screen
 * Displays assigned, available, and completed missions with filters,
 * quick status transitions, and integration into the Mission Details view.
 */

import React, { useState } from 'react';
import { AssistanceRequest, Incident, Mission, MissionStatus, Shelter } from '../../types';
import { useAuth } from '../../services/auth/authContext';
import { MissionRepository } from '../../services/repositories';
import { getMissionNextAction, getMissionStatusBadge } from './responderUtils';
import { ResponderMissionDetail } from './ResponderMissionDetail';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock,
  Compass,
  Filter,
  MapPin,
  Search,
  Shield,
  Truck,
  Users,
  QrCode,
} from 'lucide-react';
import { FieldTriageModal } from '../../components/triage/FieldTriageModal';

interface ResponderMissionsProps {
  missions: Mission[];
  incidents: Incident[];
  assistanceRequests: AssistanceRequest[];
  shelters: Shelter[];
  onMissionUpdated: () => void;
  onOpenMap: (mission: Mission) => void;
}

export const ResponderMissions: React.FC<ResponderMissionsProps> = ({
  missions,
  incidents,
  assistanceRequests,
  shelters,
  onMissionUpdated,
  onOpenMap,
}) => {
  const { currentUser } = useAuth();
  const [filterTab, setFilterTab] = useState<'MY_MISSIONS' | 'AVAILABLE' | 'COMPLETED' | 'ALL'>('MY_MISSIONS');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [isTriageOpen, setIsTriageOpen] = useState(false);

  // Categorize missions
  const isAssignedToMe = (m: Mission) =>
    m.assignedResponderId === currentUser.id ||
    (m.assignedResponderName && m.assignedResponderName.includes(currentUser.name));

  const myMissions = missions.filter((m) => isAssignedToMe(m) && m.status !== 'COMPLETED');
  const availableMissions = missions.filter((m) => !m.assignedResponderId && m.status === 'APPROVED');
  const completedMissions = missions.filter((m) => isAssignedToMe(m) && m.status === 'COMPLETED');

  // Filter based on active tab and search
  const filteredMissions = missions.filter((m) => {
    const matchesSearch =
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.pickupLocation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.id.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterTab === 'MY_MISSIONS') {
      return isAssignedToMe(m) && m.status !== 'COMPLETED';
    }
    if (filterTab === 'AVAILABLE') {
      return !m.assignedResponderId && m.status === 'APPROVED';
    }
    if (filterTab === 'COMPLETED') {
      return m.status === 'COMPLETED';
    }
    return true;
  });

  // If a mission is selected, open the detail view
  if (selectedMission) {
    const relIncident = incidents.find(
      (inc) => inc.id === selectedMission.assistanceRequestId || selectedMission.evidenceRecordIds?.includes(inc.id)
    );
    const relRequest = assistanceRequests.find((req) => req.id === selectedMission.assistanceRequestId);

    return (
      <ResponderMissionDetail
        mission={selectedMission}
        incident={relIncident}
        assistanceRequest={relRequest}
        shelters={shelters}
        onBack={() => setSelectedMission(null)}
        onMissionUpdated={() => {
          onMissionUpdated();
          // Update selectedMission from updated missions list
          const updated = missions.find((m) => m.id === selectedMission.id);
          if (updated) setSelectedMission(updated);
        }}
        onOpenMap={onOpenMap}
      />
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 animate-in fade-in duration-200">
      {/* Page Title & Quick Field Triage Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#182522]">Field Missions Queue</h1>
          <p className="text-xs sm:text-sm text-[#66736D] mt-0.5">
            Review assignments, acknowledge deployments, and submit operational completion reports.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsTriageOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-neutral-900 text-white font-bold text-xs hover:bg-neutral-800 transition shadow-xs self-start sm:self-auto shrink-0"
        >
          <QrCode className="w-4 h-4 text-emerald-400" />
          <span>START Triage & Field QR Tags</span>
        </button>
      </div>

      {/* Tabs & Search Filter */}
      <div className="space-y-3">
        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white border border-[#E3E9E5] shadow-xs text-xs overflow-x-auto">
          <button
            onClick={() => setFilterTab('MY_MISSIONS')}
            className={`px-3.5 py-2 rounded-xl font-bold transition whitespace-nowrap ${
              filterTab === 'MY_MISSIONS'
                ? 'bg-[#16856B] text-white shadow-xs'
                : 'text-[#66736D] hover:text-[#182522]'
            }`}
          >
            Assigned to Me ({myMissions.length})
          </button>
          <button
            onClick={() => setFilterTab('AVAILABLE')}
            className={`px-3.5 py-2 rounded-xl font-bold transition whitespace-nowrap ${
              filterTab === 'AVAILABLE'
                ? 'bg-[#16856B] text-white shadow-xs'
                : 'text-[#66736D] hover:text-[#182522]'
            }`}
          >
            Available to Claim ({availableMissions.length})
          </button>
          <button
            onClick={() => setFilterTab('COMPLETED')}
            className={`px-3.5 py-2 rounded-xl font-bold transition whitespace-nowrap ${
              filterTab === 'COMPLETED'
                ? 'bg-[#16856B] text-white shadow-xs'
                : 'text-[#66736D] hover:text-[#182522]'
            }`}
          >
            Completed ({completedMissions.length})
          </button>
          <button
            onClick={() => setFilterTab('ALL')}
            className={`px-3.5 py-2 rounded-xl font-bold transition whitespace-nowrap ${
              filterTab === 'ALL'
                ? 'bg-[#16856B] text-white shadow-xs'
                : 'text-[#66736D] hover:text-[#182522]'
            }`}
          >
            All Missions ({missions.length})
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#66736D] absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by mission name, address, or reference ID..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-[#E3E9E5] text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#16856B]"
          />
        </div>
      </div>

      {/* Mission Cards List */}
      <div className="space-y-3">
        {filteredMissions.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-[#E3E9E5] space-y-2">
            <CheckCircle2 className="w-8 h-8 text-[#16856B] mx-auto opacity-60" />
            <h3 className="font-bold text-sm text-[#182522]">No missions found in this category</h3>
            <p className="text-xs text-[#66736D]">
              {filterTab === 'MY_MISSIONS'
                ? 'You have acknowledged and completed all assigned tasks.'
                : 'No matching missions currently logged.'}
            </p>
          </div>
        ) : (
          filteredMissions.map((mission) => {
            const statusBadge = getMissionStatusBadge(mission.status);
            const isCritical = mission.priority === 'CRITICAL';
            const nextAction = getMissionNextAction(mission);

            return (
              <div
                key={mission.id}
                onClick={() => setSelectedMission(mission)}
                className="bg-white rounded-3xl border border-[#E3E9E5] hover:border-[#16856B] p-4 sm:p-5 shadow-xs transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] border ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`}
                    >
                      {statusBadge.label}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        isCritical ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {mission.priority}
                    </span>
                    <span className="text-[11px] text-[#66736D] font-mono">
                      {mission.id.substring(0, 14)}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-[#182522] group-hover:text-[#16856B] transition">
                    {mission.title}
                  </h3>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-[#66736D]">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-rose-600" />
                      <span>{mission.pickupLocation}</span>
                    </span>
                    {mission.targetShelterName && (
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-[#16856B]" />
                        <span>{mission.targetShelterName}</span>
                      </span>
                    )}
                  </div>

                  {mission.vulnerabilitySummary && (
                    <p className="text-xs text-[#182522] bg-[#F5F7F6] px-2.5 py-1.5 rounded-xl font-medium inline-block">
                      {mission.vulnerabilitySummary}
                    </p>
                  )}
                </div>

                {/* Right Action */}
                <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E3E9E5]">
                  {nextAction && (
                    <span className="px-3.5 py-1.5 rounded-xl bg-[#16856B] text-white text-xs font-bold shadow-xs">
                      {nextAction.label}
                    </span>
                  )}
                  <div className="p-2 rounded-xl bg-[#F5F7F6] text-[#66736D] group-hover:text-[#182522] group-hover:bg-neutral-200 transition">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      <FieldTriageModal
        isOpen={isTriageOpen}
        onClose={() => setIsTriageOpen(false)}
        onTriageUpdated={onMissionUpdated}
      />
    </div>
  );
};
