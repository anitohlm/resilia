/**
 * Resilia Screen 5: Request Assistance
 * Captures household emergency requests, headcounts, vulnerability needs
 * (elderly, infants, wheelchair access, medical maintenance) with deterministic transparent prioritization.
 */

import React, { useState } from 'react';
import { useAuth } from '../services/auth/authContext';
import { AssistanceRepository } from '../services/repositories';
import { AssistanceCategory, AssistanceRequest } from '../types';
import {
  Accessibility,
  Baby,
  AlertOctagon,
  CheckCircle2,
  Clock,
  Heart,
  HeartHandshake,
  MapPin,
  Phone,
  Send,
  Shield,
  ShieldAlert,
  UserCheck,
  Users,
} from 'lucide-react';
import { syncClient } from '../services/offline/syncClient';
import { SafetyCheckInModal } from '../components/safety/SafetyCheckInModal';
import { useToast } from '../components/common/Toast';

const CATEGORIES: { cat: AssistanceCategory; label: string }[] = [
  { cat: 'EVACUATION', label: 'Emergency Evacuation' },
  { cat: 'EMERGENCY_RESCUE', label: 'Critical Water Rescue' },
  { cat: 'WATER', label: 'Potable Drinking Water' },
  { cat: 'FOOD', label: 'Food Relief Pack' },
  { cat: 'MEDICINE', label: 'Critical Medicine / First Aid' },
  { cat: 'TRANSPORTATION', label: 'Specialized Transport' },
  { cat: 'SHELTER', label: 'Temporary Shelter Space' },
  { cat: 'OTHER', label: 'Other Urgent Need' },
];

export const RequestAssistanceScreen: React.FC<{ onRequestCreated?: () => void }> = ({ onRequestCreated }) => {
  const { currentUser } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();

  const [category, setCategory] = useState<AssistanceCategory>('EVACUATION');
  const [peopleCount, setPeopleCount] = useState<number>(3);
  const [description, setDescription] = useState('');
  const [locationName, setLocationName] = useState(currentUser.locationName || 'Purok 4, Tumana Dike Side');
  const [contactPhone, setContactPhone] = useState(currentUser.phone || '+63 920 555 0303');
  const [lat, setLat] = useState(14.6582);
  const [lng, setLng] = useState(121.1018);

  // Vulnerability inputs
  const [isTrapped, setIsTrapped] = useState<boolean>(false);
  const [isSafetyModalOpen, setIsSafetyModalOpen] = useState<boolean>(false);
  const [elderlyCount, setElderlyCount] = useState<number>(1);
  const [infantCount, setInfantCount] = useState<number>(0);
  const [wheelchairUser, setWheelchairUser] = useState<boolean>(true);
  const [bedridden, setBedridden] = useState<boolean>(false);

  // Strict RBAC Guard: Requesting emergency assistance is reserved for Residents
  if (currentUser.role !== 'RESIDENT') {
    return null;
  }
  const [medicalNote, setMedicalNote] = useState('Hypertension medication maintenance');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdRequest, setCreatedRequest] = useState<AssistanceRequest | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setIsSubmitting(true);
    try {
      const medicalNeeds = medicalNote.trim() ? [medicalNote.trim()] : [];
      const finalDesc = isTrapped
        ? `[IMMEDIATE LIFE THREAT: TRAPPED RESIDENTS] ${description}`
        : description;

      const req = await AssistanceRepository.createRequest(
        {
          residentId: currentUser.id,
          residentName: currentUser.name,
          contactPhone,
          peopleCount: Number(peopleCount),
          vulnerabilityNeeds: {
            elderlyCount: Number(elderlyCount),
            infantCount: Number(infantCount),
            wheelchairUser,
            bedridden,
            medicalNeeds,
          },
          category,
          description: finalDesc,
          locationName,
          lat,
          lng,
        },
        currentUser
      );

      // Attempt sync if connected
      if (syncClient.getStatus() === 'ONLINE') {
        await syncClient.triggerSync();
      }

      setCreatedRequest(req);
      toastSuccess(`Emergency request logged! Queued for triage and field dispatch.`, 'Assistance Requested');
      if (onRequestCreated) onRequestCreated();
    } catch (err: any) {
      toastError(err.message || 'Error submitting assistance request', 'Request Failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in">
      <div className="bg-white rounded-3xl border border-neutral-200 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-2xl bg-cyan-600 text-white shadow-sm">
            <HeartHandshake className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-neutral-900">Request Community Assistance</h2>
            <p className="text-xs text-neutral-500">
              Assistance requests are triaged using transparent vulnerability priority rules.
            </p>
          </div>
        </div>

        {createdRequest ? (
          <div className="mt-6 p-6 rounded-2xl bg-cyan-50 border border-cyan-200 text-center space-y-4">
            <div className="w-12 h-12 bg-cyan-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-cyan-950">Assistance Request Logged!</h3>
              <p className="text-xs text-cyan-800 mt-1">
                Your request is queued in the local database and visible to community coordinators.
              </p>
            </div>

            <div className="bg-white rounded-xl p-4 border border-cyan-200 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-neutral-500">Request ID:</span>
                <span className="font-mono font-bold text-neutral-900">{createdRequest.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Calculated Priority:</span>
                <span
                  className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                    createdRequest.priority === 'CRITICAL'
                      ? 'bg-rose-100 text-rose-800'
                      : createdRequest.priority === 'HIGH'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {createdRequest.priority} ({createdRequest.priorityScore}/100)
                </span>
              </div>
              <div className="pt-2 border-t border-neutral-100">
                <div className="text-[11px] font-semibold text-neutral-700 mb-1">
                  Transparent Priority Rationale:
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-neutral-600 text-[10px]">
                  {createdRequest.priorityRationale.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            </div>

            <button
              onClick={() => {
                setCreatedRequest(null);
                setDescription('');
              }}
              className="px-5 py-2.5 rounded-xl bg-cyan-700 hover:bg-cyan-600 text-white font-bold text-xs shadow-sm transition"
            >
              Submit Another Request
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4 text-xs">
            {/* Quick Win DR: Welfare Check-In Alternative Notice */}
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-start gap-2.5">
                <UserCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-emerald-950">Not in immediate physical peril?</span>
                  <p className="text-[11px] text-emerald-800 leading-snug">
                    If your household is safe and you only need relatives to locate you, use the Family Welfare Registry to keep emergency rescue dispatch queues clear.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSafetyModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shrink-0 transition"
              >
                Mark Myself Safe
              </button>
            </div>

            {/* Quick Win DR: Trapped / Life Threat Highlight */}
            <div className="p-3.5 rounded-2xl bg-rose-50 border-2 border-rose-300 text-xs flex items-start gap-3">
              <input
                type="checkbox"
                id="chkTrapped"
                checked={isTrapped}
                onChange={(e) => {
                  setIsTrapped(e.target.checked);
                  if (e.target.checked) {
                    setCategory('EMERGENCY_RESCUE');
                  }
                }}
                className="accent-rose-600 rounded w-4 h-4 mt-0.5"
              />
              <div>
                <label htmlFor="chkTrapped" className="font-extrabold text-rose-950 block cursor-pointer">
                  IMMEDIATE LIFE THREAT: TRAPPED RESIDENTS (Rising Floodwaters / Collapsed Structure)
                </label>
                <p className="text-[11px] text-rose-800 mt-0.5 leading-relaxed">
                  Flag this ONLY if residents are trapped on rooftops, in attics, in floodwaters, or under structural debris. Automatically prioritizes request for immediate rescue boat or heavy extraction dispatch.
                </p>
              </div>
            </div>

            {/* Assistance Category */}
            <div>
              <label className="font-bold text-neutral-800 block mb-1.5">What type of help is required?</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.cat}
                    type="button"
                    onClick={() => setCategory(c.cat)}
                    className={`p-2.5 rounded-xl border text-center transition font-semibold ${
                      category === c.cat
                        ? 'bg-cyan-50 border-cyan-500 text-cyan-950 shadow-xs'
                        : 'bg-neutral-50 border-neutral-200 text-neutral-700 hover:bg-neutral-100'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* People count & Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-neutral-800 block mb-1">Total People Needing Assistance</label>
                <div className="relative">
                  <Users className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                  <input
                    type="number"
                    min="1"
                    max="50"
                    required
                    value={peopleCount}
                    onChange={(e) => setPeopleCount(Number(e.target.value))}
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-xl pl-9 pr-3 py-2.5 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-neutral-800 block mb-1">Contact Phone (Optional / Local)</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-xl pl-9 pr-3 py-2.5 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="font-bold text-neutral-800 block mb-1">Current Household Location / Landmark</label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="e.g. Purok 4, House 12-B, Tumana Dike Side"
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl pl-9 pr-3 py-2.5 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="font-bold text-neutral-800 block mb-1">
                Describe the Situation / Needs <span className="text-cyan-600">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Details of water level, urgency, roof retreat, or specific supplies needed..."
                className="w-full bg-neutral-50 border border-neutral-300 rounded-xl p-3 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            {/* Vulnerability & Accessibility Attributes */}
            <div className="p-4 rounded-2xl bg-cyan-50/50 border border-cyan-200/80 space-y-3">
              <div className="flex items-center gap-2 font-bold text-cyan-950">
                <Accessibility className="w-4 h-4 text-cyan-600" />
                <span>Voluntary Accessibility & Vulnerability Disclosure</span>
              </div>
              <p className="text-[11px] text-cyan-900">
                Disclosing these helps match specialized rescue assets (rubber boat, ramp-equipped shelter) and calculates priority transparently.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] text-neutral-600 mb-1">Senior Citizens (60+)</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={elderlyCount}
                    onChange={(e) => setElderlyCount(Number(e.target.value))}
                    className="w-full bg-white border border-neutral-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-neutral-600 mb-1">Infants / Toddlers</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={infantCount}
                    onChange={(e) => setInfantCount(Number(e.target.value))}
                    className="w-full bg-white border border-neutral-300 rounded-lg p-2"
                  />
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    id="chkWheelchair"
                    checked={wheelchairUser}
                    onChange={(e) => setWheelchairUser(e.target.checked)}
                    className="accent-cyan-600 rounded w-4 h-4"
                  />
                  <label htmlFor="chkWheelchair" className="text-[11px] font-semibold text-neutral-700 cursor-pointer">
                    Wheelchair User
                  </label>
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    id="chkBedridden"
                    checked={bedridden}
                    onChange={(e) => setBedridden(e.target.checked)}
                    className="accent-cyan-600 rounded w-4 h-4"
                  />
                  <label htmlFor="chkBedridden" className="text-[11px] font-semibold text-neutral-700 cursor-pointer">
                    Bedridden
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-neutral-600 mb-1">
                  Maintenance Medicines / Dietary Needs
                </label>
                <input
                  type="text"
                  value={medicalNote}
                  onChange={(e) => setMedicalNote(e.target.value)}
                  placeholder="e.g. Insulin, Asthma inhaler, baby formula milk"
                  className="w-full bg-white border border-neutral-300 rounded-lg p-2 text-neutral-900"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !description.trim()}
              className="w-full py-3.5 rounded-2xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>Submit Assistance Request</span>
            </button>
          </form>
        )}
      </div>

      {/* Quick Win DR: Safety Check-In Modal */}
      <SafetyCheckInModal
        isOpen={isSafetyModalOpen}
        onClose={() => setIsSafetyModalOpen(false)}
      />
    </div>
  );
};
