/**
 * Responder Backup & Resource Request Modal
 * Section 9: Structured workflow for requesting additional resources
 * Requests: Additional responders, medical assistance, rescue equipment,
 * accessible transport, water/food, or other operational support.
 * Persists locally to IndexedDB & Event Queue without falsely claiming dispatch.
 */

import React, { useState } from 'react';
import { Mission } from '../../types';
import { useAuth } from '../../services/auth/authContext';
import { MissionRepository } from '../../services/repositories';
import {
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  PackagePlus,
  ShieldAlert,
  Truck,
  Users,
  WifiOff,
  X,
} from 'lucide-react';

interface ResponderBackupModalProps {
  mission: Mission;
  onClose: () => void;
  onRequestSubmitted: () => void;
}

export const ResponderBackupModal: React.FC<ResponderBackupModalProps> = ({
  mission,
  onClose,
  onRequestSubmitted,
}) => {
  const { currentUser } = useAuth();
  const [resourceType, setResourceType] = useState('ADDITIONAL_RESPONDERS');
  const [quantity, setQuantity] = useState<number>(2);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const resourceOptions = [
    { id: 'ADDITIONAL_RESPONDERS', label: 'Additional Personnel / Rescue Squad', icon: Users },
    { id: 'MEDICAL_ASSISTANCE', label: 'Medical EMS / Paramedic Team', icon: AlertCircle },
    { id: 'BOAT_EQUIPMENT', label: 'Motorized Rubber Boat / Heavy Equipment', icon: Truck },
    { id: 'ACCESSIBLE_TRANSPORT', label: 'Wheelchair / High-Clearance Transport', icon: Truck },
    { id: 'RELIEF_SUPPLIES', label: 'Emergency Water / Rations Buffer', icon: PackagePlus },
    { id: 'OTHER_SUPPORT', label: 'Other Operational Support', icon: HelpCircle },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setStatusMessage({ type: 'error', text: 'Please specify the operational reason for this backup request.' });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      await MissionRepository.requestBackup(
        mission.id,
        {
          resourceType,
          quantity: quantity > 0 ? quantity : undefined,
          reason: reason.trim(),
          locationName: mission.pickupLocation,
        },
        currentUser
      );

      setStatusMessage({
        type: 'success',
        text: 'Backup request queued. It will be dispatched once reviewed by the disaster coordinator.',
      });

      setTimeout(() => {
        onRequestSubmitted();
        onClose();
      }, 1400);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to submit backup request.' });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-[#E3E9E5] shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#E3E9E5] flex items-center justify-between bg-[#F5F7F6]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#182522]">Request Operational Backup</h3>
              <p className="text-xs text-[#66736D]">Mission Ref: {mission.id.substring(0, 16)} • {mission.pickupLocation}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#66736D] hover:text-[#182522] hover:bg-neutral-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {statusMessage && (
            <div
              className={`p-3 rounded-2xl text-xs flex items-start gap-2 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                  : 'bg-rose-50 text-rose-900 border border-rose-200'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <span className="font-medium">{statusMessage.text}</span>
            </div>
          )}

          {/* Type of Backup */}
          <div>
            <label className="block text-xs font-bold text-[#182522] mb-1.5 uppercase tracking-wider">
              Type of Support Needed
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {resourceOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = resourceType === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setResourceType(opt.id)}
                    className={`p-3 rounded-2xl border text-left flex items-start gap-2.5 transition text-xs font-semibold ${
                      isSelected
                        ? 'border-[#16856B] bg-emerald-50 text-[#153B32] ring-1 ring-[#16856B]'
                        : 'border-[#E3E9E5] bg-white text-[#182522] hover:bg-[#F5F7F6]'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${isSelected ? 'text-[#16856B]' : 'text-[#66736D]'}`} />
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantity / Unit Count */}
          <div>
            <label className="block text-xs font-bold text-[#182522] mb-1.5 uppercase tracking-wider">
              Requested Quantity or Personnel Count
            </label>
            <input
              type="number"
              min="1"
              max="20"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E3E9E5] text-sm focus:outline-none focus:ring-2 focus:ring-[#16856B] bg-[#F5F7F6]"
            />
          </div>

          {/* Reason / Situation on Scene */}
          <div>
            <label className="block text-xs font-bold text-[#182522] mb-1.5 uppercase tracking-wider">
              Operational Justification & Field Conditions
            </label>
            <textarea
              rows={3}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Current depth of floodwater requires an additional rubber boat. 3 additional stranded residents identified beyond initial manifest."
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E3E9E5] text-xs focus:outline-none focus:ring-2 focus:ring-[#16856B] bg-white placeholder-[#66736D]"
            />
          </div>

          {/* Truth-telling Notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-xs text-amber-900 flex items-start gap-2">
            <WifiOff className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Offline Resilience Notice</p>
              <p className="text-[11px] text-amber-800">
                Submitting a backup request queues it locally and notifies the Coordinator Command Center. Creating a request does not imply backup has immediately arrived.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#E3E9E5]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#66736D] hover:bg-neutral-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#16856B] hover:bg-[#153B32] text-white transition shadow-sm flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <span>Submit Backup Request</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
