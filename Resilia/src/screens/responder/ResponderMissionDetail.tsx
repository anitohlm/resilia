/**
 * Responder Mission Details Screen & Lifecycle Controller
 * Section 5: Dedicated Mission Details & Status Transitions
 * Section 6: Incident Evidence and Photos Provenance Guards
 * Lifecycle: ASSIGNED -> ACCEPTED -> IN_PROGRESS -> COMPLETED
 * Requires explicit completion report before marking mission complete.
 */

import React, { useState } from 'react';
import { AssistanceRequest, Incident, Mission, MissionStatus, Shelter } from '../../types';
import { useAuth } from '../../services/auth/authContext';
import { MissionRepository } from '../../services/repositories';
import {
  formatEvidenceNotice,
  formatSyncDeliveryNotice,
  getMissionNextAction,
  getMissionStatusBadge,
} from './responderUtils';
import { ResponderBackupModal } from './ResponderBackupModal';
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  Camera,
  CheckCircle2,
  Clock,
  Compass,
  FileCheck2,
  FileText,
  MapPin,
  Navigation,
  Shield,
  ShieldAlert,
  Truck,
  Users,
  WifiOff,
  X,
} from 'lucide-react';

interface ResponderMissionDetailProps {
  mission: Mission;
  incident?: Incident | null;
  assistanceRequest?: AssistanceRequest | null;
  shelters: Shelter[];
  onBack: () => void;
  onMissionUpdated: () => void;
  onOpenMap: (mission: Mission) => void;
}

export const ResponderMissionDetail: React.FC<ResponderMissionDetailProps> = ({
  mission,
  incident,
  assistanceRequest,
  shelters,
  onBack,
  onMissionUpdated,
  onOpenMap,
}) => {
  const { currentUser } = useAuth();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showBackupModal, setShowBackupModal] = useState(false);

  // Completion report modal state
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completionNotes, setCompletionNotes] = useState('');
  const [completionSuccess, setCompletionSuccess] = useState(true);

  // Evidence notice
  const evidenceNotice = formatEvidenceNotice(incident);

  const nextAction = getMissionNextAction(mission);
  const statusBadge = getMissionStatusBadge(mission.status);

  // Target shelter lookup
  const targetShelter = shelters.find((s) => s.id === mission.targetShelterId);

  const handleExecuteTransition = async (targetStatus: MissionStatus, note?: string) => {
    setIsTransitioning(true);
    setFeedback(null);

    try {
      await MissionRepository.updateMissionStatus(
        mission.id,
        targetStatus,
        currentUser,
        note || `Operational transition to ${targetStatus} executed by ${currentUser.name}`
      );

      setFeedback({
        type: 'success',
        message: `Mission successfully updated to ${targetStatus}!`,
      });

      onMissionUpdated();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to update mission status.',
      });
    } finally {
      setIsTransitioning(false);
    }
  };

  const handleConfirmCompletion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completionNotes.trim()) {
      setFeedback({ type: 'error', message: 'Completion report note is required to close this mission.' });
      return;
    }

    const note = `[COMPLETION REPORT] ${completionNotes.trim()} • Result: ${completionSuccess ? 'All persons secured' : 'Partial extraction / Escalated'}`;
    await handleExecuteTransition('COMPLETED', note);
    setShowCompleteModal(false);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 animate-in fade-in duration-200">
      {/* Top Header & Back Button */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-bold text-[#16856B] hover:text-[#153B32] px-3 py-2 rounded-xl bg-white border border-[#E3E9E5] transition shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Missions Queue</span>
        </button>

        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold border ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`}
          >
            {statusBadge.label}
          </span>
          <span className="text-xs text-[#66736D] font-mono">
            ID: {mission.id.substring(0, 14)}
          </span>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-medium flex items-start gap-2.5 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
              : 'bg-rose-50 text-rose-900 border border-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Main Mission Action Banner */}
      <div className="bg-white rounded-3xl border border-[#E3E9E5] p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E3E9E5]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold tracking-wider uppercase text-[#16856B]">
                {mission.requestedAssistance || 'FIELD RESPONSE ASSIGNMENT'}
              </span>
              <span className="text-xs text-[#66736D]">•</span>
              <span
                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                  mission.priority === 'CRITICAL'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {mission.priority} PRIORITY
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#182522] mt-1">{mission.title}</h1>
          </div>

          {/* Quick Route to Map */}
          <button
            onClick={() => onOpenMap(mission)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-[#F5F7F6] hover:bg-neutral-200 text-[#182522] border border-[#E3E9E5] text-xs font-bold transition shrink-0"
          >
            <Compass className="w-4 h-4 text-[#16856B]" />
            <span>Open in Map</span>
          </button>
        </div>

        {/* Operational Context Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1.5 p-3.5 rounded-2xl bg-[#F5F7F6] border border-[#E3E9E5]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#66736D] flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-rose-600" /> Staging / Pickup Point
            </span>
            <p className="font-bold text-[#182522] text-sm">{mission.pickupLocation}</p>
          </div>

          <div className="space-y-1.5 p-3.5 rounded-2xl bg-[#F5F7F6] border border-[#E3E9E5]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#66736D] flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-[#16856B]" /> Target Safe Facility
            </span>
            <p className="font-bold text-[#182522] text-sm">
              {mission.targetShelterName || mission.destinationLocation || 'Designated Community Center'}
            </p>
            {targetShelter && (
              <p className="text-[11px] text-[#66736D]">
                Capacity: {targetShelter.capacityCurrent}/{targetShelter.capacityTotal} • {targetShelter.isAccessibleWheelchair ? 'Wheelchair Accessible Ramp' : 'Standard Inflow'}
              </p>
            )}
          </div>
        </div>

        {/* Tactical Situation Description */}
        <div className="space-y-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-[#66736D]">
            Tactical Rationale & Briefing
          </span>
          <p className="text-xs sm:text-sm text-[#182522] leading-relaxed bg-neutral-50 p-3.5 rounded-2xl border border-neutral-200">
            {mission.rationale}
          </p>
        </div>

        {/* People in Need & Special Vulnerabilities */}
        {mission.vulnerabilitySummary && (
          <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 flex items-start gap-3 text-xs text-amber-950">
            <Users className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Citizen Manifest & Vulnerabilities:</span>
              <p className="mt-0.5">{mission.vulnerabilitySummary}</p>
            </div>
          </div>
        )}

        {/* Primary Context-Sensitive Lifecycle Action Bar */}
        {nextAction && (
          <div className="p-4 rounded-2xl bg-[#153B32] text-white space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">
                  Next Operational Step
                </span>
                <p className="text-xs text-neutral-200">{nextAction.description}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowBackupModal(true)}
                  className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition border border-white/20"
                >
                  Request Backup
                </button>

                <button
                  disabled={isTransitioning}
                  onClick={() => {
                    if (nextAction.requiresReport) {
                      setShowCompleteModal(true);
                    } else {
                      handleExecuteTransition(nextAction.nextStatus);
                    }
                  }}
                  className="px-5 py-2.5 rounded-xl bg-[#16856B] hover:bg-emerald-500 text-white text-xs font-extrabold transition shadow-md flex items-center gap-2"
                >
                  {isTransitioning ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>{nextAction.label}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Section 6: Verified Photographic Evidence (Guarded Provenance) */}
      <div className="bg-white rounded-3xl border border-[#E3E9E5] p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#E3E9E5] pb-3">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-[#16856B]" />
            <h3 className="text-sm font-bold text-[#182522]">Incident Photographic Evidence</h3>
          </div>
          <span className="text-[11px] text-[#66736D]">
            Related Incident: {incident?.id || 'Ref Attached'}
          </span>
        </div>

        {evidenceNotice.hasPhoto && evidenceNotice.photoUrl ? (
          <div className="space-y-3">
            {evidenceNotice.isSimulated && (
              <div className="px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-900 border border-amber-300 text-[11px] font-bold flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
                <span>{evidenceNotice.provenanceLabel}</span>
              </div>
            )}
            <div className="rounded-2xl overflow-hidden border border-[#E3E9E5] max-h-72 bg-black flex items-center justify-center">
              <img
                src={evidenceNotice.photoUrl}
                alt="Field evidence"
                className="w-full h-auto max-h-72 object-cover"
              />
            </div>
            <p className="text-[11px] text-[#66736D]">
              Photographic record attached to mission manifest. Ground verification status: {incident?.status || 'Active'}.
            </p>
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-[#F5F7F6] border border-dashed border-[#E3E9E5] text-center space-y-1">
            <Camera className="w-6 h-6 text-[#66736D] mx-auto opacity-50" />
            <p className="text-xs font-bold text-[#66736D]">No field photo available.</p>
            <p className="text-[11px] text-[#66736D]">
              Citizen reported without image attachment. Visual confirmation should be conducted on scene.
            </p>
          </div>
        )}
      </div>

      {/* Mission Timeline & Audit History */}
      <div className="bg-white rounded-3xl border border-[#E3E9E5] p-5 sm:p-6 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-[#182522] flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#16856B]" />
          <span>Operational Timeline & Audit Log</span>
        </h3>

        <div className="space-y-2.5 pt-2">
          {mission.statusHistory && mission.statusHistory.length > 0 ? (
            mission.statusHistory.map((entry, idx) => (
              <div
                key={idx}
                className="p-3 rounded-2xl bg-[#F5F7F6] border border-[#E3E9E5] text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <span className="font-bold text-[#182522]">{entry.status}:</span>{' '}
                  <span className="text-[#66736D]">{entry.note || 'Status recorded'}</span>
                </div>
                <div className="text-[11px] text-[#66736D] shrink-0 font-mono">
                  {entry.actorName} • {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-[#66736D]">Initial dispatch registered.</p>
          )}
        </div>
      </div>

      {/* Completion Modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-[#E3E9E5] shadow-2xl max-w-md w-full p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E3E9E5] pb-3">
              <h3 className="text-base font-bold text-[#182522]">Submit Final Completion Report</h3>
              <button
                onClick={() => setShowCompleteModal(false)}
                className="p-1 rounded-lg text-[#66736D] hover:bg-neutral-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmCompletion} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#182522] mb-1">
                  Did the extraction/delivery succeed?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCompletionSuccess(true)}
                    className={`p-2.5 rounded-xl border font-bold transition ${
                      completionSuccess
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-600'
                        : 'border-neutral-200 bg-white text-neutral-700'
                    }`}
                  >
                    All Persons Safe
                  </button>
                  <button
                    type="button"
                    onClick={() => setCompletionSuccess(false)}
                    className={`p-2.5 rounded-xl border font-bold transition ${
                      !completionSuccess
                        ? 'border-amber-600 bg-amber-50 text-amber-900 ring-1 ring-amber-600'
                        : 'border-neutral-200 bg-white text-neutral-700'
                    }`}
                  >
                    Partial / Escalated
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#182522] mb-1">
                  Field Observations & Debrief Note <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  placeholder="e.g. 2 residents safely brought to Malanday Elementary Clinic. In good condition."
                  className="w-full px-3 py-2 rounded-xl border border-[#E3E9E5] focus:outline-none focus:ring-2 focus:ring-[#16856B]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#E3E9E5]">
                <button
                  type="button"
                  onClick={() => setShowCompleteModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#66736D]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isTransitioning}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#16856B] text-white hover:bg-[#153B32] transition"
                >
                  {isTransitioning ? 'Submitting...' : 'Confirm Completion'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Backup Modal */}
      {showBackupModal && (
        <ResponderBackupModal
          mission={mission}
          onClose={() => setShowBackupModal(false)}
          onRequestSubmitted={onMissionUpdated}
        />
      )}
    </div>
  );
};
