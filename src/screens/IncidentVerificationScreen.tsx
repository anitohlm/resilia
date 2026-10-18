/**
 * Resilia Screen 8: Incident Verification
 * Coordinator inspection of original reports, corroborating and conflicting reports,
 * with mandatory rationale logging and non-destructive status updates.
 */

import React, { useState } from 'react';
import { useAuth } from '../services/auth/authContext';
import { IncidentRepository } from '../services/repositories';
import { Incident, Report } from '../types';
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Clock,
  FileCheck2,
  FileWarning,
  Layers,
  MapPin,
  MessageSquare,
  ShieldAlert,
  ThumbsDown,
  ThumbsUp,
  XCircle,
} from 'lucide-react';
import { useToast } from '../components/common/Toast';

interface IncidentVerificationScreenProps {
  incidents: Incident[];
  onIncidentVerified?: () => void;
}

export const IncidentVerificationScreen: React.FC<IncidentVerificationScreenProps> = ({
  incidents,
  onIncidentVerified,
}) => {
  const { currentUser, canVerifyIncidents } = useAuth();
  const { success: toastSuccess, error: toastError, warning: toastWarning } = useToast();
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(incidents[0] || null);
  const [reports, setReports] = useState<Report[]>([]);
  const [rationale, setRationale] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // When selected incident changes, load all associated reports
  React.useEffect(() => {
    if (selectedIncident) {
      IncidentRepository.getReportsForIncident(selectedIncident.id).then(setReports);
    }
  }, [selectedIncident]);

  const handleVerify = async (newStatus: 'VERIFIED' | 'CONTRADICTED' | 'RESOLVED') => {
    if (!selectedIncident) return;
    if (!rationale.trim()) {
      toastWarning('A verification rationale is required to explain this operational decision.', 'Rationale Required');
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = await IncidentRepository.verifyIncident(
        selectedIncident.id,
        newStatus,
        rationale.trim(),
        currentUser
      );
      setSelectedIncident(updated);
      setRationale('');
      if (onIncidentVerified) onIncidentVerified();
      toastSuccess(`Incident marked as ${newStatus} with documented rationale.`, 'Status Updated');
    } catch (err: any) {
      toastError(err.message || 'Verification failed', 'Verification Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!canVerifyIncidents) {
    return null;
  }

  return (
    <div className="space-y-4 animate-in fade-in">
      <div className="bg-white rounded-xl border border-neutral-200/80 p-4 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-neutral-900 text-white flex items-center justify-center shadow-2xs shrink-0">
            <FileCheck2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-neutral-900 tracking-tight">Incident Verification & Truth Engine</h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Inspect corroborating and conflicting citizen reports. Document rationale before updating official hazard status.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-xs">
        {/* Left Column: Incidents List */}
        <div className="lg:col-span-1 space-y-2">
          <h3 className="font-semibold uppercase tracking-wider text-neutral-400 text-[11px] px-1">
            Verification Queue ({incidents.length})
          </h3>

          <div className="space-y-2">
            {incidents.map((inc) => {
              const isSelected = selectedIncident?.id === inc.id;
              const hasConflict = inc.contradictingReportsCount > 0;
              return (
                <div
                  key={inc.id}
                  onClick={() => setSelectedIncident(inc)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition shadow-2xs space-y-1.5 ${
                    isSelected
                      ? 'bg-neutral-900 text-white border-neutral-900'
                      : 'bg-white border-neutral-200 hover:bg-neutral-50 text-neutral-900'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : inc.status === 'VERIFIED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : inc.status === 'CONTRADICTED'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {inc.status}
                    </span>

                    {hasConflict && (
                      <span className={`px-2 py-0.5 rounded font-semibold text-[10px] flex items-center gap-1 ${
                        isSelected ? 'bg-rose-500 text-white' : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        <FileWarning className="w-3 h-3" />
                        Conflicting
                      </span>
                    )}
                  </div>

                  <h4 className={`font-semibold text-xs leading-snug ${isSelected ? 'text-white' : 'text-neutral-900'}`}>{inc.title}</h4>
                  <div className={`text-[11px] truncate ${isSelected ? 'text-neutral-300' : 'text-neutral-500'}`}>{inc.locationName}</div>

                  <div className={`flex items-center gap-3 text-[10px] pt-1 border-t ${isSelected ? 'border-white/10 text-neutral-300' : 'border-neutral-100 text-neutral-400'}`}>
                    <span>{inc.supportingReportsCount} supporting</span>
                    <span>•</span>
                    <span>{inc.contradictingReportsCount} conflicting</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Detailed Evidence Inspection & Decision */}
        <div className="lg:col-span-2">
          {selectedIncident ? (
            <div className="bg-white rounded-xl border border-neutral-200/80 p-5 shadow-2xs space-y-5">
              {/* Header */}
              <div className="pb-4 border-b border-neutral-100">
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <span className="text-[10px] font-mono text-neutral-400">ID: {selectedIncident.id}</span>
                    <h3 className="text-base font-semibold text-neutral-900 tracking-tight mt-0.5">{selectedIncident.title}</h3>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded font-mono font-semibold text-[10px] uppercase tracking-wider shrink-0 border ${
                      selectedIncident.status === 'VERIFIED'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : selectedIncident.status === 'CONTRADICTED'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {selectedIncident.status}
                  </span>
                </div>
                <p className="text-neutral-700 mt-2 text-xs leading-relaxed">{selectedIncident.description}</p>

                {selectedIncident.photoUrl && (
                  <div className="mt-3 relative rounded-xl overflow-hidden border border-neutral-200 bg-neutral-950 max-h-64 shadow-xs">
                    <img
                      src={selectedIncident.photoUrl}
                      alt={selectedIncident.title}
                      className="w-full h-48 sm:h-56 object-cover"
                    />
                    <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-xs text-white text-[11px] font-semibold flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-amber-400" />
                      <span>Photographic Evidence Submitted by Reporter</span>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-4 mt-3 text-[11px] text-neutral-500">
                  <span>Location: <strong className="text-neutral-800">{selectedIncident.locationName}</strong></span>
                  <span>Reported by: <strong className="text-neutral-800">{selectedIncident.reporterName}</strong> ({selectedIncident.reporterRole})</span>
                </div>
              </div>

              {/* Supporting & Conflicting Reports Inspector */}
              <div className="space-y-3">
                <h4 className="font-semibold text-neutral-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-neutral-500" />
                  <span>Field Reports & Conflicting Observations ({reports.length})</span>
                </h4>

                <div className="space-y-2">
                  {reports.map((rep) => (
                    <div
                      key={rep.id}
                      className={`p-3 rounded-lg border text-xs space-y-1.5 ${
                        rep.reportType === 'CONTRADICTION'
                          ? 'bg-rose-50/70 border-rose-200'
                          : rep.reportType === 'CORROBORATION'
                          ? 'bg-emerald-50/70 border-emerald-200'
                          : 'bg-neutral-50 border-neutral-200'
                      }`}
                    >
                      <div className="flex justify-between items-center text-[10px]">
                        <span
                          className={`font-mono font-semibold px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider border ${
                            rep.reportType === 'CONTRADICTION'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : rep.reportType === 'CORROBORATION'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-neutral-100 text-neutral-700 border-neutral-200'
                          }`}
                        >
                          {rep.reportType}
                        </span>
                        <span className="text-neutral-400">
                          {rep.reporterName} ({rep.reporterRole}) • {new Date(rep.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-neutral-800 leading-relaxed font-medium">"{rep.observation}"</p>
                      {rep.roadStatus && (
                        <div className="text-[11px] text-neutral-600">
                          Road Observation: <strong className="text-neutral-900">{rep.roadStatus}</strong>
                          {rep.floodDepthCm ? ` (Depth: ~${rep.floodDepthCm}cm)` : ''}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Existing Verification Trail if already verified */}
              {selectedIncident.verifiedBy && (
                <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-200 text-[11px] space-y-1">
                  <div className="font-semibold text-neutral-800">
                    Prior Verification Record: {selectedIncident.verifiedBy}
                  </div>
                  <p className="text-neutral-600 italic">"{selectedIncident.verificationRationale}"</p>
                  <div className="text-neutral-400 text-[10px]">
                    Verified at: {selectedIncident.verifiedAt && new Date(selectedIncident.verifiedAt).toLocaleString()}
                  </div>
                </div>
              )}

              {/* Coordinator Decision Form */}
              <div className="p-4 rounded-xl bg-neutral-900 text-white space-y-3.5 shadow-2xs">
                <h4 className="font-semibold text-sm text-white tracking-tight">Coordinator Verification Action</h4>
                <div>
                  <label className="text-[11px] text-neutral-400 block mb-1">
                    Decision Rationale (Mandatory: record actor, timestamp, and field evidence)
                  </label>
                  <textarea
                    rows={2}
                    value={rationale}
                    onChange={(e) => setRationale(e.target.value)}
                    placeholder="e.g. Confirmed by CDRRMO drone flyover / Contradicted by Rescue 161 boat crew finding road passable..."
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                  />
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    onClick={() => handleVerify('VERIFIED')}
                    disabled={isSubmitting || !rationale.trim()}
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-2xs"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>Officially Verify Hazard</span>
                  </button>

                  <button
                    onClick={() => handleVerify('CONTRADICTED')}
                    disabled={isSubmitting || !rationale.trim()}
                    className="px-4 py-2 rounded-lg bg-rose-700 hover:bg-rose-600 disabled:opacity-50 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-2xs"
                  >
                    <ThumbsDown className="w-3.5 h-3.5" />
                    <span>Mark Contradicted</span>
                  </button>

                  <button
                    onClick={() => handleVerify('RESOLVED')}
                    disabled={isSubmitting || !rationale.trim()}
                    className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-neutral-200 border border-neutral-700 font-semibold text-xs transition flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Mark Hazard Resolved</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-neutral-400 bg-white rounded-xl border border-neutral-200/80 shadow-2xs">
              Select an incident from the queue to inspect supporting and conflicting evidence.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
