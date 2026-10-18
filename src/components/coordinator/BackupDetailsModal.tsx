/**
 * Resilia Coordinator Backup Details Modal
 * Displays full structured backup details submitted by emergency responders
 * for linked citizen assistance requests.
 */

import React, { useState } from 'react';
import { AssistanceRequest, Mission } from '../../types';
import { useAuth } from '../../services/auth/authContext';
import { AssistanceRepository, MissionRepository } from '../../services/repositories';
import {
  AlertCircle,
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clock,
  HardHat,
  MapPin,
  PackagePlus,
  Phone,
  Send,
  Shield,
  ShieldAlert,
  Truck,
  Users,
  X,
} from 'lucide-react';

interface BackupDetailsModalProps {
  request: AssistanceRequest;
  mission?: Mission;
  onClose: () => void;
  onStatusUpdated?: () => void;
}

const RESOURCE_TYPE_LABELS: Record<string, { label: string; icon: any }> = {
  ADDITIONAL_RESPONDERS: { label: 'Additional Personnel / Rescue Squad', icon: Users },
  MEDICAL_ASSISTANCE: { label: 'Medical EMS / Paramedic Team', icon: AlertCircle },
  BOAT_EQUIPMENT: { label: 'Motorized Rubber Boat / Heavy Equipment', icon: Truck },
  ACCESSIBLE_TRANSPORT: { label: 'Wheelchair / High-Clearance Transport', icon: Truck },
  RELIEF_SUPPLIES: { label: 'Emergency Water / Rations Buffer', icon: PackagePlus },
  OTHER_SUPPORT: { label: 'Other Operational Support', icon: ShieldAlert },
};

export const BackupDetailsModal: React.FC<BackupDetailsModalProps> = ({
  request,
  mission,
  onClose,
  onStatusUpdated,
}) => {
  const { currentUser } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const backup = request.backupDetails || mission?.backupDetails;

  const resourceConfig = backup?.resourceType
    ? RESOURCE_TYPE_LABELS[backup.resourceType] || { label: backup.resourceType, icon: ShieldAlert }
    : { label: 'Operational Backup', icon: ShieldAlert };
  const ResourceIcon = resourceConfig.icon;

  const handleUpdateStatus = async (newStatus: 'DISPATCHED' | 'RESOLVED') => {
    setIsUpdating(true);
    setFeedback(null);
    try {
      await AssistanceRepository.updateBackupStatus(
        request.id,
        newStatus,
        currentUser,
        newStatus === 'DISPATCHED'
          ? 'Disaster Coordinator dispatched secondary reinforcement team.'
          : 'Backup requirement fulfilled and secured.'
      );

      // Also update linked mission if present
      if (mission) {
        if (mission.backupDetails) {
          mission.backupDetails.status = newStatus;
          if (newStatus === 'DISPATCHED') {
            mission.backupDetails.dispatchedAt = new Date().toISOString();
          }
          await MissionRepository.updateMissionStatus(
            mission.id,
            mission.status,
            currentUser,
            `Backup status set to ${newStatus}`
          );
        }
      }

      setFeedback({
        type: 'success',
        text: `Backup status successfully updated to ${newStatus}!`,
      });

      if (onStatusUpdated) {
        onStatusUpdated();
      }

      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err.message || 'Failed to update backup status.',
      });
      setIsUpdating(false);
    }
  };

  const formattedDate = backup?.requestedAt
    ? new Date(backup.requestedAt).toLocaleString('en-PH', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
      })
    : 'Recently';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-200 bg-neutral-50/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-100 text-rose-700">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-neutral-900">Responder Backup Request Details</h3>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                    backup?.status === 'DISPATCHED'
                      ? 'bg-sky-50 text-sky-700 border-sky-200'
                      : backup?.status === 'RESOLVED'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}
                >
                  {backup?.status || 'REQUESTED'}
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                Requested by field responder • Ref: {request.id}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback message */}
        {feedback && (
          <div
            className={`px-4 py-2.5 text-xs font-medium flex items-center gap-2 ${
              feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
          {/* Key Information Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Requesting Officer Card */}
            <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200/80 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
                <HardHat className="w-3.5 h-3.5 text-teal-600" />
                <span>Requesting Responder</span>
              </span>
              <p className="font-bold text-sm text-neutral-900">
                {backup?.requestedByResponderName || 'Officer Juan dela Cruz'}
              </p>
              <p className="text-[11px] text-neutral-500 font-mono">
                ID: {backup?.requestedByResponderId || 'user_responder_juan'} • Rescue 161
              </p>
            </div>

            {/* Support Needed Card */}
            <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200/80 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
                <ResourceIcon className="w-3.5 h-3.5 text-rose-600" />
                <span>Support Needed</span>
              </span>
              <p className="font-bold text-sm text-neutral-900">{resourceConfig.label}</p>
              <p className="text-[11px] text-rose-700 font-bold">
                Requested Quantity: {backup?.quantity || 1} Unit(s) / Personnel
              </p>
            </div>
          </div>

          {/* Incident / Location & Time */}
          <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-neutral-500 shrink-0" />
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                  Location on Scene
                </span>
                <span className="font-semibold text-neutral-900">
                  {backup?.locationName || request.locationName}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-neutral-500 font-mono text-[11px]">
              <Clock className="w-3.5 h-3.5" />
              <span>{formattedDate}</span>
            </div>
          </div>

          {/* Operational Justification / Reason */}
          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-1.5">
            <div className="flex items-center gap-1.5 text-amber-900 font-bold text-[11px] uppercase tracking-wide">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Operational Justification from Scene</span>
            </div>
            <p className="text-neutral-800 leading-relaxed font-medium bg-white/70 p-2.5 rounded-lg border border-amber-200/40">
              "{backup?.reason || 'Additional reinforcement needed due to severe flood conditions and access restrictions.'}"
            </p>
          </div>

          {/* Associated Citizen Assistance Request Summary */}
          <div className="p-3.5 rounded-xl border border-neutral-200 space-y-2">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
              <span className="font-bold text-neutral-900 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-600" />
                <span>Linked Resident Assistance Request</span>
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                  request.priority === 'CRITICAL'
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
              >
                {request.priority} ({request.priorityScore}/100)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-neutral-500">Resident:</span>{' '}
                <span className="font-bold text-neutral-900">{request.residentName}</span>
              </div>
              <div>
                <span className="text-neutral-500">Contact:</span>{' '}
                <span className="font-mono text-neutral-900">{request.contactPhone}</span>
              </div>
              <div>
                <span className="text-neutral-500">Headcount:</span>{' '}
                <span className="font-semibold text-neutral-900">{request.peopleCount} pax</span>
              </div>
              <div>
                <span className="text-neutral-500">Assistance Category:</span>{' '}
                <span className="font-semibold text-neutral-900">{request.category.replace('_', ' ')}</span>
              </div>
            </div>

            <div className="text-[11px] text-neutral-600 pt-1 border-t border-neutral-100">
              <span className="font-semibold text-neutral-800">Distress description:</span>{' '}
              {request.description}
            </div>
          </div>
        </div>

        {/* Modal Footer & Actions */}
        <div className="p-4 border-t border-neutral-200 bg-neutral-50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60 transition"
          >
            Close
          </button>

          <div className="flex items-center gap-2">
            {backup?.status !== 'RESOLVED' && (
              <>
                {backup?.status !== 'DISPATCHED' ? (
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => handleUpdateStatus('DISPATCHED')}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-neutral-900 hover:bg-neutral-800 text-white transition shadow-sm flex items-center gap-1.5"
                  >
                    <Truck className="w-3.5 h-3.5 text-sky-400" />
                    <span>Dispatch Backup Unit</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => handleUpdateStatus('RESOLVED')}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-sm flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Mark Backup Resolved</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
