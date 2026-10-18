/**
 * Responder Home Screen — My Operational Status
 * Section 4: Priority on active assigned work
 * Section 4.A: Compact emergency alert (with simulated exercise transparency)
 * Section 4.B: My Active Mission (prominent primary focal point)
 * Section 4.C: Mission Queue
 * Section 4.D: Quick Field Actions cockpit
 * Section 11: Nearby Operational Information
 */

import React, { useState } from 'react';
import {
  Alert,
  AssistanceRequest,
  Community,
  Incident,
  Mission,
  MissionStatus,
  Resource,
  Shelter,
} from '../../types';
import { useAuth } from '../../services/auth/authContext';
import { MissionRepository } from '../../services/repositories';
import {
  getActiveResponderMission,
  isMissionAssignedToResponder,
  getMissionNextAction,
  getMissionStatusBadge,
  formatEvidenceNotice,
} from './responderUtils';
import { ResponderBackupModal } from './ResponderBackupModal';
import { GoBagChecklistCard } from '../../components/safety/GoBagChecklistCard';
import { GoBagChecklistModal } from '../../components/safety/GoBagChecklistModal';
import { FieldTriageModal } from '../../components/triage/FieldTriageModal';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Building2,
  Camera,
  CheckCircle2,
  ChevronRight,
  Clock,
  Compass,
  Droplets,
  ExternalLink,
  FileText,
  Flame,
  Heart,
  LifeBuoy,
  MapPin,
  Navigation,
  Phone,
  Radio,
  Send,
  Shield,
  ShieldAlert,
  Sparkles,
  Truck,
  Users,
  WifiOff,
  Wind,
  X,
  Zap,
} from 'lucide-react';

interface ResponderHomeProps {
  community: Community | null;
  alerts: Alert[];
  shelters: Shelter[];
  incidents: Incident[];
  assistanceRequests: AssistanceRequest[];
  missions: Mission[];
  resources: Resource[];
  pendingSyncCount: number;
  onNavigateToTab: (tab: 'MISSIONS' | 'MAP' | 'REPORTS' | 'MORE') => void;
  onSelectMission: (mission: Mission) => void;
  onMissionUpdated: () => void;
  onOpenMap: (mission?: Mission) => void;
}

export const ResponderHome: React.FC<ResponderHomeProps> = ({
  community,
  alerts,
  shelters,
  incidents,
  assistanceRequests,
  missions,
  resources,
  pendingSyncCount,
  onNavigateToTab,
  onSelectMission,
  onMissionUpdated,
  onOpenMap,
}) => {
  const { currentUser } = useAuth();
  const [selectedAlertForModal, setSelectedAlertForModal] = useState<Alert | null>(null);
  const [backupModalMission, setBackupModalMission] = useState<Mission | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isGoBagModalOpen, setIsGoBagModalOpen] = useState(false);
  const [isTriageModalOpen, setIsTriageModalOpen] = useState(false);

  // Active mission for current responder
  const activeMission = getActiveResponderMission(missions, currentUser.id, currentUser.name);

  // Other missions
  const isAssignedToMe = (m: Mission) =>
    isMissionAssignedToResponder(m, currentUser.id, currentUser.name);

  const otherAssignedMissions = missions.filter(
    (m) => isAssignedToMe(m) && (!activeMission || m.id !== activeMission.id) && m.status !== 'COMPLETED'
  );

  const availableClaimableMissions = missions.filter(
    (m) => !m.assignedResponderId && m.status === 'APPROVED'
  );

  // Active critical alert
  const currentAlert = alerts.find((a) => a.active && a.severity === 'CRITICAL') || alerts.find((a) => a.active);

  // Active incoming disaster advisories (e.g. typhoons with landfall countdowns)
  const incomingAdvisories = alerts.filter(
    (a) => a.active && (typeof a.daysUntilLandfall === 'number' || !!a.disasterName)
  );

  // Next operational action on active mission
  const activeNextAction = activeMission ? getMissionNextAction(activeMission) : null;
  const activeStatusBadge = activeMission ? getMissionStatusBadge(activeMission.status) : null;
  const activeEvidenceNotice = activeMission
    ? formatEvidenceNotice(incidents.find((i) => i.id === activeMission.assistanceRequestId))
    : null;

  // Handle immediate status transition on active mission
  const handleExecuteActiveAction = async (targetStatus: MissionStatus) => {
    if (!activeMission) return;
    setIsUpdatingStatus(true);
    try {
      await MissionRepository.updateMissionStatus(
        activeMission.id,
        targetStatus,
        currentUser,
        `Quick status update to ${targetStatus} from Responder Cockpit`
      );
      onMissionUpdated();
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 animate-in fade-in duration-200">
      {/* 4.A: Compact Emergency Alert Banner */}
      {currentAlert && (
        <div
          className={`rounded-2xl border p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            currentAlert.severity === 'CRITICAL'
              ? 'bg-rose-50 border-rose-200 text-rose-950'
              : 'bg-amber-50 border-amber-200 text-amber-950'
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`p-2 rounded-xl shrink-0 ${
                currentAlert.severity === 'CRITICAL' ? 'bg-rose-600 text-white' : 'bg-amber-600 text-white'
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-black text-sm">{currentAlert.title}</span>

                {/* Days until landfall countdown badge */}
                {typeof currentAlert.daysUntilLandfall === 'number' && (
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold text-white shadow-2xs ${
                      currentAlert.daysUntilLandfall === 0
                        ? 'bg-rose-600 animate-pulse'
                        : currentAlert.daysUntilLandfall === 1
                        ? 'bg-rose-500'
                        : 'bg-amber-600'
                    }`}
                  >
                    {currentAlert.daysUntilLandfall === 0
                      ? '🔴 Landfall Imminent (<24h)'
                      : `⏳ Landfall in ${currentAlert.daysUntilLandfall} Day${currentAlert.daysUntilLandfall > 1 ? 's' : ''}`}
                  </span>
                )}

                {/* TCWS Signal */}
                {typeof currentAlert.signalLevel === 'number' && currentAlert.signalLevel > 0 && (
                  <span className="bg-neutral-900 text-white font-mono text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                    TCWS Signal #{currentAlert.signalLevel}
                  </span>
                )}

                {/* Disaster name */}
                {currentAlert.disasterName && (
                  <span className="bg-white/80 border border-neutral-300 text-neutral-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    🌀 {currentAlert.disasterName}
                  </span>
                )}

                {currentAlert.isExercise && (
                  <span className="bg-amber-200/90 text-amber-900 border border-amber-400 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                    SIMULATED EXERCISE — NOT A LIVE EMERGENCY
                  </span>
                )}
              </div>

              <p className="text-xs text-[#182522] leading-snug line-clamp-2">
                {currentAlert.message}
              </p>

              {/* Affected Sectors */}
              {currentAlert.affectedZones && currentAlert.affectedZones.length > 0 && (
                <p className="text-[11px] font-semibold text-neutral-700">
                  <span className="text-neutral-500">Affected Zones: </span>
                  {currentAlert.affectedZones.join(', ')}
                </p>
              )}

              {/* Preparations checklist preview */}
              {currentAlert.preparations && currentAlert.preparations.length > 0 && (
                <div className="pt-0.5 text-[11px] text-neutral-700 flex flex-wrap items-center gap-1.5">
                  <span className="font-bold text-neutral-900">Preparations:</span>
                  <span>{currentAlert.preparations.slice(0, 2).join(' • ')}</span>
                  {currentAlert.preparations.length > 2 && (
                    <span className="text-neutral-500 font-semibold">
                      +{currentAlert.preparations.length - 2} more
                    </span>
                  )}
                </div>
              )}

              <div className="flex items-center gap-3 text-[11px] text-[#66736D] pt-1">
                <span>Source: {currentAlert.source}</span>
                <span>•</span>
                <span>{new Date(currentAlert.issuedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setSelectedAlertForModal(currentAlert)}
            className="px-3.5 py-1.5 rounded-xl bg-white border border-[#E3E9E5] text-xs font-bold text-[#182522] hover:bg-neutral-100 transition shrink-0 self-start sm:self-auto shadow-xs"
          >
            View Full Advisory & Briefing
          </button>
        </div>
      )}

      {/* 4.A.2: Incoming Disaster & Typhoon Landfall Watch for Responders */}
      {incomingAdvisories.length > 0 && (
        <section aria-labelledby="incoming-disaster-watch-heading" className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-rose-500/10 rounded-2xl border border-amber-300 p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/80 pb-2.5">
            <div className="flex items-center gap-2">
              <Wind className="w-5 h-5 text-amber-700" />
              <div>
                <h2 id="incoming-disaster-watch-heading" className="text-sm font-extrabold text-[#182522] flex items-center gap-2">
                  <span>Incoming Disaster & Typhoon Landfall Watch</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[10px] font-mono font-bold">
                    {incomingAdvisories.length} Active {incomingAdvisories.length === 1 ? 'Advisory' : 'Advisories'}
                  </span>
                </h2>
                <p className="text-[11px] text-[#66736D]">
                  Field responder briefing on approaching typhoons, impact timelines, and resident preparation directives.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {incomingAdvisories.map((adv) => (
              <div
                key={adv.id}
                className="bg-white rounded-xl border border-amber-200/90 p-4 shadow-2xs space-y-2.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <span className="font-extrabold text-sm text-[#182522]">{adv.title}</span>
                      {typeof adv.daysUntilLandfall === 'number' && (
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold text-white shadow-2xs ${
                            adv.daysUntilLandfall === 0
                              ? 'bg-rose-600 animate-pulse'
                              : adv.daysUntilLandfall === 1
                              ? 'bg-rose-500'
                              : 'bg-amber-600'
                          }`}
                        >
                          {adv.daysUntilLandfall === 0
                            ? '🔴 Landfall Imminent (<24h)'
                            : `⏳ Landfall in ${adv.daysUntilLandfall} Day${adv.daysUntilLandfall > 1 ? 's' : ''}`}
                        </span>
                      )}
                      {typeof adv.signalLevel === 'number' && adv.signalLevel > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-neutral-900 text-white text-[10px] font-mono font-bold">
                          TCWS Signal #{adv.signalLevel}
                        </span>
                      )}
                      {adv.disasterName && (
                        <span className="px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-800 border border-neutral-300 text-[10px] font-bold">
                          🌀 {adv.disasterName}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-700 leading-relaxed">{adv.message}</p>
                    {adv.expectedLandfall && (
                      <p className="text-[11px] text-amber-800 font-semibold">
                        Impact Timeline: <strong>{adv.expectedLandfall}</strong>
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedAlertForModal(adv)}
                    className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-xs font-bold text-amber-950 transition shrink-0 self-start sm:self-auto shadow-2xs flex items-center gap-1"
                  >
                    <span>View Operational Briefing</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Preparations & Affected Zones */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                  {adv.preparations && adv.preparations.length > 0 && (
                    <div className="p-2.5 rounded-lg bg-neutral-50 border border-neutral-200 space-y-1">
                      <span className="font-bold text-neutral-800 block text-[11px]">
                        Prescribed Citizen Preparations ({adv.preparations.length} action steps):
                      </span>
                      <ul className="list-disc list-inside space-y-0.5 text-[11px] text-neutral-600">
                        {adv.preparations.slice(0, 3).map((p, i) => (
                          <li key={i} className="truncate">{p}</li>
                        ))}
                        {adv.preparations.length > 3 && (
                          <li className="text-neutral-400">+{adv.preparations.length - 3} more steps</li>
                        )}
                      </ul>
                    </div>
                  )}

                  {adv.affectedZones && adv.affectedZones.length > 0 && (
                    <div className="p-2.5 rounded-lg bg-neutral-50 border border-neutral-200 space-y-1">
                      <span className="font-bold text-neutral-800 block text-[11px]">
                        Target Sectors / Affected Zones:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {adv.affectedZones.map((z, i) => (
                          <span key={i} className="px-1.5 py-0.5 rounded bg-white border border-neutral-200 text-[10px] text-neutral-700">
                            {z}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4.B: Primary Section — My Active Mission */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#16856B]" />
            <h2 className="text-base font-extrabold text-[#182522]">My Active Mission</h2>
          </div>
          <span className="text-xs text-[#66736D]">
            Assigned Responder: <strong>{currentUser.name}</strong>
          </span>
        </div>

        {activeMission ? (
          <div className="bg-white rounded-3xl border-2 border-[#16856B]/30 p-5 sm:p-6 shadow-md space-y-4 relative overflow-hidden">
            {/* Top Tag & Status */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-mono text-[11px] font-extrabold text-[#16856B] bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                  MISSION #{activeMission.id.substring(0, 8).toUpperCase()}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${activeStatusBadge?.bg} ${activeStatusBadge?.text} ${activeStatusBadge?.border}`}
                >
                  {activeStatusBadge?.label}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                    activeMission.priority === 'CRITICAL' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {activeMission.priority} PRIORITY
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenMap(activeMission)}
                  className="px-3 py-1.5 rounded-xl bg-[#F5F7F6] hover:bg-neutral-200 text-[#182522] text-xs font-bold border border-[#E3E9E5] transition flex items-center gap-1.5"
                >
                  <Compass className="w-3.5 h-3.5 text-[#16856B]" />
                  <span>Navigate in Map</span>
                </button>
              </div>
            </div>

            {/* Title & Situation */}
            <div>
              <h3 className="text-lg sm:text-xl font-black text-[#182522]">{activeMission.title}</h3>
              <p className="text-xs sm:text-sm text-[#182522] mt-1.5 leading-relaxed bg-[#F5F7F6] p-3.5 rounded-2xl border border-[#E3E9E5]">
                {activeMission.rationale}
              </p>
            </div>

            {/* Staging & Manifest Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-1">
                <span className="text-[10px] font-extrabold uppercase text-[#66736D] flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-rose-600" /> Staging / Pickup Point
                </span>
                <p className="font-bold text-[#182522]">{activeMission.pickupLocation}</p>
              </div>

              <div className="p-3 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-1">
                <span className="text-[10px] font-extrabold uppercase text-[#66736D] flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-[#16856B]" /> Target Evacuation Facility
                </span>
                <p className="font-bold text-[#182522]">
                  {activeMission.targetShelterName || activeMission.destinationLocation || 'Designated Community Center'}
                </p>
              </div>
            </div>

            {/* Special Needs & Equipment Required */}
            {(activeMission.vulnerabilitySummary || activeMission.assignedVehicleType) && (
              <div className="flex flex-wrap items-center gap-3 text-xs">
                {activeMission.vulnerabilitySummary && (
                  <div className="flex items-center gap-1.5 text-amber-900 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 font-medium">
                    <Users className="w-3.5 h-3.5 text-amber-700" />
                    <span>Manifest: {activeMission.vulnerabilitySummary}</span>
                  </div>
                )}
                {activeMission.assignedVehicleType && (
                  <div className="flex items-center gap-1.5 text-blue-900 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200 font-medium">
                    <Truck className="w-3.5 h-3.5 text-blue-700" />
                    <span>Vehicle: {activeMission.assignedVehicleType}</span>
                  </div>
                )}
              </div>
            )}

            {/* Evidence Notice */}
            {activeEvidenceNotice && (
              <div className="text-[11px] text-[#66736D] flex items-center gap-1.5 pt-1">
                <Camera className="w-3.5 h-3.5 text-[#16856B]" />
                <span>{activeEvidenceNotice.provenanceLabel}</span>
              </div>
            )}

            {/* Action Bar */}
            <div className="pt-3 border-t border-[#E3E9E5] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <button
                onClick={() => onSelectMission(activeMission)}
                className="text-xs font-bold text-[#16856B] hover:text-[#153B32] transition flex items-center gap-1"
              >
                <span>View Full Mission Details & Debrief</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setBackupModalMission(activeMission)}
                  className="px-3.5 py-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-xs font-bold text-[#182522] transition border border-neutral-200"
                >
                  Request Backup
                </button>

                {activeNextAction && (
                  <button
                    disabled={isUpdatingStatus}
                    onClick={() => {
                      if (activeNextAction.requiresReport) {
                        onSelectMission(activeMission);
                      } else {
                        handleExecuteActiveAction(activeNextAction.nextStatus);
                      }
                    }}
                    className="px-5 py-2.5 rounded-xl bg-[#16856B] hover:bg-[#153B32] text-white text-xs font-black transition shadow-sm flex items-center gap-2"
                  >
                    {isUpdatingStatus ? (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    <span>{activeNextAction.label}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-[#E3E9E5] p-8 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-[#16856B] mx-auto opacity-70" />
            <h3 className="font-bold text-sm text-[#182522]">No Active Mission Assigned</h3>
            <p className="text-xs text-[#66736D] max-w-sm mx-auto">
              You are currently on standby. You can claim available missions from the queue or submit ground reconnaissance observations below.
            </p>
            {availableClaimableMissions.length > 0 && (
              <button
                onClick={() => onNavigateToTab('MISSIONS')}
                className="mt-2 px-4 py-2 rounded-xl bg-[#16856B] text-white text-xs font-bold hover:bg-[#153B32] transition shadow-xs inline-flex items-center gap-1.5"
              >
                <span>View {availableClaimableMissions.length} Available Missions</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </section>

      {/* 4.D: Quick Field Actions Cockpit */}
      <section className="space-y-2.5">
        <h2 className="text-base font-extrabold text-[#182522] flex items-center gap-2">
          <Truck className="w-4 h-4 text-[#16856B]" />
          <span>Quick Field Actions</span>
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <button
            onClick={() => onNavigateToTab('REPORTS')}
            className="p-4 rounded-2xl bg-white border border-[#E3E9E5] hover:border-[#16856B] shadow-xs text-left transition space-y-2 group"
          >
            <div className="p-2.5 rounded-xl bg-emerald-50 text-[#16856B] w-fit group-hover:scale-110 transition">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-[#182522]">Report Incident</p>
              <p className="text-[11px] text-[#66736D] mt-0.5">Log new field hazard</p>
            </div>
          </button>

          <button
            onClick={() => onNavigateToTab('REPORTS')}
            className="p-4 rounded-2xl bg-white border border-[#E3E9E5] hover:border-[#16856B] shadow-xs text-left transition space-y-2 group"
          >
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700 w-fit group-hover:scale-110 transition">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-[#182522]">Report Road Condition</p>
              <p className="text-[11px] text-[#66736D] mt-0.5">Passable vs blocked</p>
            </div>
          </button>

          <button
            onClick={() => {
              if (activeMission) {
                setBackupModalMission(activeMission);
              } else if (missions.length > 0) {
                setBackupModalMission(missions[0]);
              }
            }}
            className="p-4 rounded-2xl bg-white border border-[#E3E9E5] hover:border-[#16856B] shadow-xs text-left transition space-y-2 group"
          >
            <div className="p-2.5 rounded-xl bg-rose-50 text-rose-700 w-fit group-hover:scale-110 transition">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-[#182522]">Request Backup</p>
              <p className="text-[11px] text-[#66736D] mt-0.5">EMS, boat, or crew</p>
            </div>
          </button>

          <button
            onClick={() => setIsTriageModalOpen(true)}
            className="p-4 rounded-2xl bg-white border-2 border-rose-200 hover:border-rose-500 shadow-xs text-left transition space-y-2 group"
          >
            <div className="p-2.5 rounded-xl bg-rose-50 text-rose-700 w-fit group-hover:scale-110 transition">
              <Heart className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-[#182522]">Field Triage & QR</p>
              <p className="text-[11px] text-[#66736D] mt-0.5">START tags & wristbands</p>
            </div>
          </button>

          <button
            onClick={() => onNavigateToTab('MORE')}
            className="p-4 rounded-2xl bg-white border border-[#E3E9E5] hover:border-[#16856B] shadow-xs text-left transition space-y-2 group"
          >
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700 w-fit group-hover:scale-110 transition">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-[#182522]">Update Availability</p>
              <p className="text-[11px] text-[#66736D] mt-0.5">Standby / On Scene</p>
            </div>
          </button>
        </div>
      </section>

      {/* 4.C: Mission Queue (Other Assigned & Available) */}
      {(otherAssignedMissions.length > 0 || availableClaimableMissions.length > 0) && (
        <section className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-[#182522] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#16856B]" />
              <span>Upcoming Mission Queue</span>
            </h2>
            <button
              onClick={() => onNavigateToTab('MISSIONS')}
              className="text-xs font-bold text-[#16856B] hover:underline"
            >
              View All Missions ({missions.length})
            </button>
          </div>

          <div className="space-y-2.5">
            {otherAssignedMissions.map((mission) => (
              <div
                key={mission.id}
                onClick={() => onSelectMission(mission)}
                className="bg-white rounded-2xl border border-[#E3E9E5] hover:border-[#16856B] p-4 shadow-xs transition cursor-pointer flex items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#182522]">{mission.title}</span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                      Assigned to You
                    </span>
                  </div>
                  <p className="text-[11px] text-[#66736D] flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-rose-600" />
                    <span>{mission.pickupLocation}</span>
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-[#66736D] shrink-0" />
              </div>
            ))}

            {availableClaimableMissions.slice(0, 2).map((mission) => (
              <div
                key={mission.id}
                onClick={() => onSelectMission(mission)}
                className="bg-white rounded-2xl border border-[#E3E9E5] hover:border-[#16856B] p-4 shadow-xs transition cursor-pointer flex items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#182522]">{mission.title}</span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-[10px]">
                      Available to Claim
                    </span>
                  </div>
                  <p className="text-[11px] text-[#66736D] flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-rose-600" />
                    <span>{mission.pickupLocation}</span>
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-[#66736D] shrink-0" />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Section 11: Nearby Operational Information */}
      <section className="bg-white rounded-3xl border border-[#E3E9E5] p-5 sm:p-6 shadow-sm space-y-3 text-xs">
        <div className="flex items-center justify-between border-b border-[#E3E9E5] pb-3">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-[#16856B]" />
            <h2 className="text-sm font-bold text-[#182522]">Nearby Operational Information</h2>
          </div>
          <span className="text-[11px] text-[#66736D]">Sector 2 (Tumana-Malanday)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Telemetry Sensor */}
          <div className="p-3.5 rounded-2xl bg-[#F5F7F6] border border-[#E3E9E5] space-y-1">
            <span className="text-[10px] font-extrabold uppercase text-[#66736D] flex items-center gap-1">
              <Droplets className="w-3.5 h-3.5 text-blue-600" /> River Gauge Level
            </span>
            <p className="text-base font-black text-[#182522]">
              {community?.riverWaterLevelMeters ? `${community.riverWaterLevelMeters.toFixed(1)}m` : '16.8 meters'}
            </p>
            <p className="text-[10px] text-amber-700 font-bold">2nd Alarm (Pre-emptive Evac)</p>
            <p className="text-[9px] text-[#66736D]">Source: Tumana Bridge Sensor Station</p>
          </div>

          {/* Road Passability */}
          <div className="p-3.5 rounded-2xl bg-[#F5F7F6] border border-[#E3E9E5] space-y-1">
            <span className="text-[10px] font-extrabold uppercase text-[#66736D] flex items-center gap-1">
              <Truck className="w-3.5 h-3.5 text-rose-600" /> Key Road Closures
            </span>
            <p className="font-bold text-[#182522]">Tumana Bridge Western Approach</p>
            <p className="text-[10px] text-rose-700 font-bold">Impassable for light vehicles</p>
            <p className="text-[9px] text-[#66736D]">High clearance trucks / boats only</p>
          </div>

          {/* Nearest Open Shelter */}
          <div className="p-3.5 rounded-2xl bg-[#F5F7F6] border border-[#E3E9E5] space-y-1">
            <span className="text-[10px] font-extrabold uppercase text-[#66736D] flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-[#16856B]" /> Nearest Inflow Shelter
            </span>
            <p className="font-bold text-[#182522]">Malanday Elementary School</p>
            <p className="text-[10px] text-emerald-700 font-bold">620 / 850 capacity (Open)</p>
            <p className="text-[9px] text-[#66736D]">Equipped with wheelchair ramps</p>
          </div>
        </div>
      </section>

      {/* Responder & Family Go-Bag Checklist Card */}
      <GoBagChecklistCard
        variant="responder"
        onOpenFullModal={() => setIsGoBagModalOpen(true)}
      />

      {/* Advisory Modal */}
      {selectedAlertForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-[#E3E9E5] shadow-2xl max-w-lg w-full p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#E3E9E5] pb-3">
              <div className="min-w-0 flex-1 pr-2">
                <h3 className="text-base font-bold text-[#182522] leading-snug">{selectedAlertForModal.title}</h3>
                {selectedAlertForModal.disasterName && (
                  <span className="text-xs font-semibold text-[#16856B]">
                    🌀 {selectedAlertForModal.disasterName}
                  </span>
                )}
              </div>
              <button
                onClick={() => setSelectedAlertForModal(null)}
                className="p-1 rounded-lg text-[#66736D] hover:bg-neutral-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Landfall Countdown Pill */}
            {typeof selectedAlertForModal.daysUntilLandfall === 'number' && (
              <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-300 text-amber-950 space-y-1 text-xs">
                <div className="flex items-center justify-between font-bold">
                  <span>⏳ Impact Timeline / Countdown:</span>
                  <span className="font-black text-amber-900">
                    {selectedAlertForModal.daysUntilLandfall === 0
                      ? '🔴 Landfall Imminent (<24h)'
                      : `${selectedAlertForModal.daysUntilLandfall} day(s) until landfall`}
                  </span>
                </div>
                {selectedAlertForModal.expectedLandfall && (
                  <p className="text-[11px] text-amber-800">
                    Schedule: <strong>{selectedAlertForModal.expectedLandfall}</strong>
                  </p>
                )}
                {typeof selectedAlertForModal.signalLevel === 'number' && selectedAlertForModal.signalLevel > 0 && (
                  <p className="text-[11px] font-mono text-neutral-900 font-bold">
                    PAGASA Wind Signal: TCWS #{selectedAlertForModal.signalLevel}
                  </p>
                )}
              </div>
            )}

            {selectedAlertForModal.isExercise && (
              <div className="p-2.5 rounded-xl bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold">
                SIMULATED EXERCISE — NOT A LIVE EMERGENCY
              </div>
            )}

            <div className="space-y-3 text-xs text-[#182522]">
              <div>
                <span className="font-bold block text-neutral-900 mb-1">Official Directive & Overview:</span>
                <p className="leading-relaxed whitespace-pre-line text-[13px]">{selectedAlertForModal.message}</p>
              </div>

              {/* Recommended Preparations List */}
              {selectedAlertForModal.preparations && selectedAlertForModal.preparations.length > 0 && (
                <div className="p-3 rounded-2xl bg-[#F5F7F6] border border-[#E3E9E5] space-y-1.5">
                  <span className="font-bold text-[#182522] block">
                    Operational Preparations & Resident Instructions:
                  </span>
                  <div className="space-y-1 pt-0.5">
                    {selectedAlertForModal.preparations.map((prep, i) => (
                      <div key={i} className="flex items-start gap-2 p-1.5 rounded-lg bg-white border border-[#E3E9E5] text-[11px]">
                        <span className="w-4 h-4 rounded-full bg-emerald-100 text-[#16856B] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                          ✓
                        </span>
                        <span className="text-[#182522]">{prep}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Affected Sectors */}
              {selectedAlertForModal.affectedZones && selectedAlertForModal.affectedZones.length > 0 && (
                <div>
                  <span className="font-bold text-neutral-700 block text-[11px] uppercase tracking-wider mb-1">
                    Target Sectors / Affected Zones:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {selectedAlertForModal.affectedZones.map((z, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-md bg-[#F5F7F6] border border-[#E3E9E5] text-[11px] font-semibold text-[#182522]">
                        {z}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-3 rounded-2xl bg-[#F5F7F6] space-y-1 text-[11px] text-[#66736D]">
                <div>Source: <strong className="text-[#182522]">{selectedAlertForModal.source}</strong></div>
                <div>Issued: <strong className="text-[#182522]">{new Date(selectedAlertForModal.issuedAt).toLocaleString()}</strong></div>
                <div>Expires: <strong className="text-[#182522]">{new Date(selectedAlertForModal.expiresAt).toLocaleString()}</strong></div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedAlertForModal(null)}
                className="px-4 py-2 rounded-xl bg-[#16856B] text-white text-xs font-bold hover:bg-[#153B32] transition"
              >
                Close Advisory
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Go-Bag Modal */}
      <GoBagChecklistModal
        isOpen={isGoBagModalOpen}
        onClose={() => setIsGoBagModalOpen(false)}
      />

      {/* Backup Modal */}
      {backupModalMission && (
        <ResponderBackupModal
          mission={backupModalMission}
          onClose={() => setBackupModalMission(null)}
          onRequestSubmitted={onMissionUpdated}
        />
      )}

      {/* Field Triage & QR Wristband Modal */}
      <FieldTriageModal
        isOpen={isTriageModalOpen}
        onClose={() => setIsTriageModalOpen(false)}
        onTriageUpdated={onMissionUpdated}
      />
    </div>
  );
};
