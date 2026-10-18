/**
 * Resilia Screen 6: Responder Operations Queue & Resident Incident Receiver
 * Allows field responders to:
 * 1. View and receive all incident reports submitted by residents in real time
 * 2. Submit field corroboration / road passability updates
 * 3. Dispatch to resident incidents or mark them resolved
 * 4. Manage assigned rescue & evacuation missions with full status transitions
 */

import React, { useState } from 'react';
import { useAuth } from '../services/auth/authContext';
import { MissionRepository, IncidentRepository } from '../services/repositories';
import { Incident, Mission, MissionStatus, ResponderOperationalStatus } from '../types';
import { FieldTriageModal } from '../components/triage/FieldTriageModal';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Camera,
  Check,
  CheckCircle2,
  Clock,
  Compass,
  FileCheck2,
  FileText,
  Flame,
  HardHat,
  HeartPulse,
  MapPin,
  MessageSquare,
  Navigation,
  Radio,
  Send,
  ShieldAlert,
  ShieldCheck,
  Truck,
  UserCheck,
  Users,
  Waves,
  XCircle,
} from 'lucide-react';

interface ResponderMissionsScreenProps {
  missions: Mission[];
  incidents: Incident[];
  onMissionUpdated?: () => void;
  onIncidentUpdated?: () => void;
  onNavigateToMap?: () => void;
}

export const ResponderMissionsScreen: React.FC<ResponderMissionsScreenProps> = ({
  missions,
  incidents,
  onMissionUpdated,
  onIncidentUpdated,
  onNavigateToMap,
}) => {
  const { currentUser, setRole } = useAuth();
  const [activeTab, setActiveTab] = useState<'INCIDENTS' | 'MISSIONS'>('INCIDENTS');
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [incidentFilter, setIncidentFilter] = useState<'ALL' | 'ASSIGNED_TO_ME' | 'UNVERIFIED' | 'CRITICAL' | 'EARTHQUAKE' | 'FLOOD' | 'ROAD'>('ALL');
  const [corroborationNote, setCorroborationNote] = useState('');
  const [missionNote, setMissionNote] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [resolvingIncident, setResolvingIncident] = useState<Incident | null>(null);
  const [resolutionNoteInput, setResolutionNoteInput] = useState('Cleared by responder unit on the ground');
  const [isTriageModalOpen, setIsTriageModalOpen] = useState(false);

  // RBAC GUARD: Only RESPONDER and COORDINATOR can access Responder Missions screen
  if (currentUser.role === 'RESIDENT') {
    return null;
  }

  // Filter resident incidents
  const filteredIncidents = incidents.filter((inc) => {
    if (incidentFilter === 'ASSIGNED_TO_ME') {
      return inc.assignedResponderId === currentUser.id || inc.assignedResponderName?.includes(currentUser.name);
    }
    if (incidentFilter === 'UNVERIFIED') return inc.status === 'REPORTED';
    if (incidentFilter === 'CRITICAL') return inc.severity === 'CRITICAL' || inc.severity === 'HIGH';
    if (incidentFilter === 'EARTHQUAKE') return inc.type === 'EARTHQUAKE';
    if (incidentFilter === 'FLOOD') return inc.type === 'FLOOD';
    if (incidentFilter === 'ROAD') return inc.type === 'ROAD_BLOCKED';
    return true;
  });

  const unverifiedCount = incidents.filter((i) => i.status === 'REPORTED').length;
  const criticalCount = incidents.filter((i) => i.severity === 'CRITICAL' && i.status !== 'RESOLVED').length;
  const assignedToMeCount = incidents.filter(
    (i) => i.assignedResponderId === currentUser.id || i.assignedResponderName?.includes(currentUser.name)
  ).length;

  const handleUpdateIncidentResponderStatus = async (
    incident: Incident,
    newStatus: ResponderOperationalStatus,
    note?: string
  ) => {
    setIsUpdating(true);
    try {
      await IncidentRepository.updateIncidentResponderStatus(
        incident.id,
        newStatus,
        currentUser,
        note || `Operational response transitioned to ${newStatus} by ${currentUser.name}`
      );
      setFeedback({ type: 'success', message: `Incident status updated to ${newStatus}!` });
      if (onIncidentUpdated) onIncidentUpdated();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStatusTransition = async (missionId: string, newStatus: MissionStatus) => {
    setIsUpdating(true);
    try {
      await MissionRepository.updateMissionStatus(
        missionId,
        newStatus,
        currentUser,
        missionNote.trim() || undefined
      );
      setMissionNote('');
      if (onMissionUpdated) onMissionUpdated();
      const updated = missions.find((m) => m.id === missionId);
      if (updated) {
        setSelectedMission({ ...updated, status: newStatus });
      }
      setFeedback({ type: 'success', message: `Mission transitioned to ${newStatus} successfully.` });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCorroborateIncident = async (incident: Incident, supports: boolean) => {
    if (!corroborationNote.trim()) {
      setFeedback({ type: 'error', message: 'Please provide a field observation note before submitting.' });
      return;
    }
    setIsUpdating(true);
    try {
      await IncidentRepository.addCorroborationOrContradiction(
        incident.id,
        corroborationNote.trim(),
        supports ? 'CORROBORATION' : 'CONTRADICTION',
        'PASSABLE',
        undefined,
        incident.lat,
        incident.lng,
        currentUser
      );
      setCorroborationNote('');
      setFeedback({ type: 'success', message: `Field verification report logged by ${currentUser.name}!` });
      if (onIncidentUpdated) onIncidentUpdated();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleConfirmResolveIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingIncident) return;
    setIsUpdating(true);
    try {
      await IncidentRepository.verifyIncident(
        resolvingIncident.id,
        'RESOLVED',
        resolutionNoteInput.trim() || 'Cleared by responder team',
        currentUser
      );
      setFeedback({ type: 'success', message: `Incident marked as RESOLVED by ${currentUser.name}.` });
      setResolvingIncident(null);
      if (onIncidentUpdated) onIncidentUpdated();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Header */}
      <div className="bg-white rounded-2xl border border-neutral-200/90 p-5 sm:p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-neutral-900 text-white flex items-center justify-center">
            <Truck className="w-5 h-5 text-teal-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-neutral-900">Responder Operations Queue</h2>
            <p className="text-xs text-neutral-500">
              Live resident incident feeds, field corroboration, and assigned emergency dispatches.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          {unverifiedCount > 0 && (
            <span className="text-amber-800 font-semibold font-mono">
              {unverifiedCount} new resident reports
            </span>
          )}
          <span className="text-neutral-400">·</span>
          <span className="font-semibold text-neutral-800">
            {currentUser.name}
          </span>
        </div>
      </div>

      {/* Inline Feedback Banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-neutral-400 hover:text-neutral-700 font-bold ml-2 text-sm"
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. TAB SWITCHER: INCIDENTS VS MISSIONS VS TRIAGE */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('INCIDENTS')}
            className={`px-3.5 py-2 rounded-xl font-semibold text-xs transition flex items-center gap-2 ${
              activeTab === 'INCIDENTS'
                ? 'bg-neutral-900 text-white shadow-2xs'
                : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Resident Incident Reports ({incidents.length})</span>
            {unverifiedCount > 0 && (
              <span className="font-mono text-[10px] text-amber-300 font-bold">
                +{unverifiedCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('MISSIONS')}
            className={`px-3.5 py-2 rounded-xl font-semibold text-xs transition flex items-center gap-2 ${
              activeTab === 'MISSIONS'
                ? 'bg-neutral-900 text-white shadow-2xs'
                : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200'
            }`}
          >
            <Truck className="w-3.5 h-3.5 text-teal-400" />
            <span>Assigned Missions ({missions.length})</span>
          </button>
        </div>

        <button
          onClick={() => setIsTriageModalOpen(true)}
          className="px-3.5 py-2 rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-700 text-white transition flex items-center gap-1.5 shadow-2xs"
        >
          <HeartPulse className="w-3.5 h-3.5" />
          <span>START Triage & QR Tags</span>
        </button>
      </div>

      {/* 3. TAB CONTENT: RESIDENT INCIDENT REPORTS */}
      {activeTab === 'INCIDENTS' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-neutral-500 font-semibold text-[11px]">Filter Reports:</span>
            <button
              onClick={() => setIncidentFilter('ALL')}
              className={`px-3 py-1 rounded-xl font-bold transition ${incidentFilter === 'ALL' ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'}`}
            >
              All ({incidents.length})
            </button>
            <button
              onClick={() => setIncidentFilter('ASSIGNED_TO_ME')}
              className={`px-3 py-1 rounded-xl font-bold transition flex items-center gap-1 ${incidentFilter === 'ASSIGNED_TO_ME' ? 'bg-teal-700 text-white shadow-xs' : 'bg-teal-50 text-teal-800 border border-teal-200 hover:bg-teal-100'}`}
            >
              <HardHat className="w-3 h-3" />
              <span>Assigned to You ({assignedToMeCount})</span>
            </button>
            <button
              onClick={() => setIncidentFilter('UNVERIFIED')}
              className={`px-3 py-1 rounded-xl font-bold transition ${incidentFilter === 'UNVERIFIED' ? 'bg-amber-600 text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'}`}
            >
              Unverified ({unverifiedCount})
            </button>
            <button
              onClick={() => setIncidentFilter('CRITICAL')}
              className={`px-3 py-1 rounded-xl font-bold transition ${incidentFilter === 'CRITICAL' ? 'bg-rose-600 text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'}`}
            >
              Critical ({criticalCount})
            </button>
            <button
              onClick={() => setIncidentFilter('EARTHQUAKE')}
              className={`px-3 py-1 rounded-xl font-bold transition flex items-center gap-1 ${incidentFilter === 'EARTHQUAKE' ? 'bg-purple-700 text-white' : 'bg-purple-50 text-purple-800 border border-purple-200 hover:bg-purple-100'}`}
            >
              <Activity className="w-3 h-3" />
              <span>Earthquake</span>
            </button>
            <button
              onClick={() => setIncidentFilter('FLOOD')}
              className={`px-3 py-1 rounded-xl font-bold transition flex items-center gap-1 ${incidentFilter === 'FLOOD' ? 'bg-cyan-700 text-white' : 'bg-cyan-50 text-cyan-800 border border-cyan-200 hover:bg-cyan-100'}`}
            >
              <Waves className="w-3 h-3" />
              <span>Flood</span>
            </button>
            <button
              onClick={() => setIncidentFilter('ROAD')}
              className={`px-3 py-1 rounded-xl font-bold transition ${incidentFilter === 'ROAD' ? 'bg-amber-700 text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'}`}
            >
              Road Blockages
            </button>
          </div>

          {/* Incident Cards List */}
          <div className="grid gap-4 md:grid-cols-2">
            {filteredIncidents.map((inc) => {
              const isSelected = selectedIncident?.id === inc.id;
              const isCritical = inc.severity === 'CRITICAL';
              const isAssignedToCurrent =
                inc.assignedResponderId === currentUser.id ||
                inc.assignedResponderName?.includes(currentUser.name);

              return (
                <div
                  key={inc.id}
                  className={`bg-white rounded-3xl border p-5 shadow-sm space-y-3 transition flex flex-col justify-between ${
                    isAssignedToCurrent
                      ? 'border-teal-500 ring-2 ring-teal-200/70 bg-gradient-to-b from-teal-50/20 to-white'
                      : isSelected
                      ? 'border-rose-500 ring-2 ring-rose-200'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                            isCritical
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : inc.severity === 'HIGH'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {inc.severity}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                            inc.status === 'VERIFIED'
                              ? 'bg-teal-100 text-teal-800 border border-teal-300'
                              : inc.status === 'RESOLVED'
                              ? 'bg-neutral-100 text-neutral-600'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {inc.status}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700 font-extrabold text-[10px] uppercase">
                          {inc.type.replace('_', ' ')}
                        </span>
                      </div>
                      <span className="text-[10px] text-neutral-400 font-mono">
                        {new Date(inc.createdAt).toLocaleTimeString()}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-extrabold text-sm text-neutral-900 leading-snug">{inc.title}</h3>
                      <p className="text-xs text-neutral-600 mt-1 leading-relaxed">{inc.description}</p>
                    </div>

                    {inc.photoUrl && (
                      <div className="relative rounded-2xl overflow-hidden border border-neutral-200 bg-neutral-950 max-h-40">
                        <img
                          src={inc.photoUrl}
                          alt={inc.title}
                          className="w-full h-32 object-cover"
                        />
                        <div className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded bg-black/75 backdrop-blur-xs text-[10px] text-white font-medium flex items-center gap-1">
                          <Camera className="w-3 h-3 text-amber-400" />
                          <span>Field Photo Evidence</span>
                        </div>
                      </div>
                    )}

                    {/* Dispatch Assignment Banner */}
                    {inc.assignedResponderName && (
                      <div className="p-2.5 rounded-2xl bg-teal-50 border border-teal-200 text-xs flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-teal-950 font-bold">
                          <Truck className="w-3.5 h-3.5 text-teal-700" />
                          <span>Dispatch: {inc.assignedResponderName}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-teal-200 text-teal-900 font-extrabold text-[10px]">
                          {inc.responderStatus || 'DISPATCHED'}
                        </span>
                      </div>
                    )}

                    {/* Incident Specs Box */}
                    <div className="bg-neutral-50 p-3 rounded-2xl border border-neutral-100 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-500">Reported By Resident:</span>
                        <span className="font-bold text-neutral-800">{inc.reporterName}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-500">Location:</span>
                        <span className="font-semibold text-neutral-700">{inc.locationName}</span>
                      </div>

                      {/* Earthquake specifics */}
                      {inc.type === 'EARTHQUAKE' && (
                        <div className="pt-1 border-t border-neutral-200/60 space-y-0.5 text-purple-900 font-semibold text-[11px]">
                          {inc.earthquakeIntensity && (
                            <div>• PHIVOLCS PEIS Intensity: {inc.earthquakeIntensity}</div>
                          )}
                          {inc.structuralDamageLevel && (
                            <div>• Damage: {inc.structuralDamageLevel.replace('_', ' ')}</div>
                          )}
                          {inc.trappedPersonsCount ? (
                            <div className="text-rose-700 font-bold">
                              • {inc.trappedPersonsCount} trapped individuals!
                            </div>
                          ) : null}
                        </div>
                      )}

                      {/* Volcano eruption specifics */}
                      {inc.type === 'VOLCANO_ERUPTION' && (
                        <div className="pt-1 border-t border-neutral-200/60 space-y-0.5 text-amber-900 font-semibold text-[11px]">
                          {inc.volcanoAlertLevel && (
                            <div>• PHIVOLCS Volcanic Alert: Level {inc.volcanoAlertLevel}</div>
                          )}
                          {inc.ashfallSeverity && (
                            <div>• Ashfall: {inc.ashfallSeverity}</div>
                          )}
                        </div>
                      )}

                      {inc.floodDepthCm && (
                        <div className="flex items-center justify-between text-cyan-800 font-bold">
                          <span>Reported Water Depth:</span>
                          <span>{inc.floodDepthCm} cm ({((inc.floodDepthCm) / 100).toFixed(1)} m)</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-1 border-t border-neutral-200/60">
                        <span>Corroborating Reports:</span>
                        <span className="font-semibold text-teal-700">{inc.supportingReportsCount || 0} confirmed</span>
                      </div>
                    </div>
                  </div>

                  {/* Responder Action Controls */}
                  <div className="pt-3 border-t border-neutral-100 flex flex-wrap items-center gap-1.5 text-xs">
                    {/* Operational Response Transitions */}
                    {(!inc.responderStatus || inc.responderStatus === 'UNASSIGNED' || inc.responderStatus === 'DISPATCHED') && (
                      <button
                        onClick={() => handleUpdateIncidentResponderStatus(inc, 'EN_ROUTE')}
                        disabled={isUpdating}
                        className="px-2.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-[10px] transition flex items-center gap-1"
                      >
                        <Navigation className="w-3 h-3" />
                        <span>Acknowledge & En Route</span>
                      </button>
                    )}

                    {inc.responderStatus === 'EN_ROUTE' && (
                      <button
                        onClick={() => handleUpdateIncidentResponderStatus(inc, 'ON_SCENE')}
                        disabled={isUpdating}
                        className="px-2.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[10px] transition flex items-center gap-1"
                      >
                        <MapPin className="w-3 h-3" />
                        <span>Arrived On Scene</span>
                      </button>
                    )}

                    <button
                      onClick={() => setSelectedIncident(isSelected ? null : inc)}
                      className="px-2.5 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 font-bold text-neutral-800 text-[10px] transition"
                    >
                      {isSelected ? 'Close Form' : 'Corroborate'}
                    </button>

                    {onNavigateToMap && (
                      <button
                        onClick={onNavigateToMap}
                        className="px-2 py-1.5 rounded-xl bg-neutral-50 hover:bg-neutral-100 text-neutral-700 border border-neutral-200 font-semibold text-[10px] transition flex items-center gap-1"
                      >
                        <Compass className="w-3 h-3" />
                        <span>Map</span>
                      </button>
                    )}

                    {inc.status !== 'RESOLVED' && (
                      <button
                        onClick={() => {
                          setResolvingIncident(inc);
                          setResolutionNoteInput('Road cleared and hazard subsided');
                        }}
                        className="ml-auto px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] transition flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Mark Resolved</span>
                      </button>
                    )}
                  </div>

                  {/* Inline Field Observation Form */}
                  {isSelected && (
                    <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 space-y-2.5 text-xs animate-in fade-in">
                      <div className="font-bold text-amber-950 flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-amber-700" />
                        <span>Add Responder Field Corroboration:</span>
                      </div>
                      <textarea
                        value={corroborationNote}
                        onChange={(e) => setCorroborationNote(e.target.value)}
                        placeholder="e.g. Water currently at knee level (40cm), passability restricted to rescue trucks only."
                        className="w-full p-2.5 rounded-xl bg-white border border-amber-300 text-neutral-900 focus:outline-none text-xs h-18 resize-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleCorroborateIncident(inc, true)}
                          disabled={isUpdating}
                          className="flex-1 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold transition"
                        >
                          Confirm & Corroborate Hazard
                        </button>
                        <button
                          onClick={() => handleCorroborateIncident(inc, false)}
                          disabled={isUpdating}
                          className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition"
                        >
                          Contradict Report
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. TAB CONTENT: ASSIGNED MISSIONS */}
      {activeTab === 'MISSIONS' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="grid gap-4 md:grid-cols-2">
            {missions.map((m) => (
              <div
                key={m.id}
                className="bg-white rounded-3xl border border-neutral-200 p-5 shadow-sm space-y-3 text-xs"
              >
                <div className="flex items-start justify-between">
                  <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-teal-100 text-teal-800">
                    {m.status}
                  </span>
                  <span className="text-[10px] text-neutral-400 font-mono">{m.id}</span>
                </div>

                <div>
                  <h3 className="font-extrabold text-sm text-neutral-900">{m.title}</h3>
                  <p className="text-neutral-600 mt-1 leading-relaxed">{m.rationale}</p>
                </div>

                <div className="bg-neutral-50 p-3 rounded-2xl border border-neutral-100 space-y-1">
                  <div>
                    <span className="text-neutral-500">Pickup:</span> <span className="font-semibold">{m.pickupLocation}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500">Destination:</span> <span className="font-semibold">{m.destinationLocation}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500">Assigned Vehicle:</span> <span className="font-bold text-teal-700">{m.assignedVehicleType}</span>
                  </div>
                </div>

                {/* Status Transitions */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-neutral-100">
                  {m.status === 'APPROVED' && (
                    <button
                      onClick={() => handleStatusTransition(m.id, 'ACCEPTED')}
                      disabled={isUpdating}
                      className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold transition"
                    >
                      Accept Mission
                    </button>
                  )}
                  {m.status === 'ACCEPTED' && (
                    <button
                      onClick={() => handleStatusTransition(m.id, 'IN_PROGRESS')}
                      disabled={isUpdating}
                      className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition"
                    >
                      Start En Route (In Progress)
                    </button>
                  )}
                  {m.status === 'IN_PROGRESS' && (
                    <button
                      onClick={() => handleStatusTransition(m.id, 'COMPLETED')}
                      disabled={isUpdating}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition"
                    >
                      Complete Mission
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resolution Confirmation Modal */}
      {resolvingIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-3 shadow-xl border border-neutral-200 text-neutral-900 text-xs">
            <h3 className="font-bold text-sm text-neutral-900">
              Resolve Incident: {resolvingIncident.title}
            </h3>
            <p className="text-neutral-500">
              Please enter the ground verification note explaining how this incident was resolved:
            </p>
            <form onSubmit={handleConfirmResolveIncident} className="space-y-3">
              <input
                type="text"
                required
                value={resolutionNoteInput}
                onChange={(e) => setResolutionNoteInput(e.target.value)}
                placeholder="e.g. Cleared debris, water subsided, traffic restored"
                className="w-full bg-neutral-50 border border-neutral-300 rounded-xl p-2.5 text-neutral-900 text-xs"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResolvingIncident(null)}
                  className="px-3 py-1.5 rounded-lg text-neutral-600 hover:bg-neutral-100 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  Mark as Resolved
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Field Triage & QR Wristbands Modal */}
      <FieldTriageModal
        isOpen={isTriageModalOpen}
        onClose={() => setIsTriageModalOpen(false)}
        onTriageUpdated={onMissionUpdated}
      />
    </div>
  );
};
