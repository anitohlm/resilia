/**
 * Responder Field Reporting Screen
 * Section 8: Fast field-report workflow for disaster responders
 * Supports: Flooding, Road blocked, Building damage, Fire, Medical,
 * Power outage, Resource shortage, Conditions changed/resolved, Other.
 * Persists locally to IndexedDB & Event Queue with truth-telling sync badges.
 */

import React, { useState } from 'react';
import { Incident, Mission, Report } from '../../types';
import { useAuth } from '../../services/auth/authContext';
import { localDB, STORES } from '../../services/offline/db';
import { EventQueueService } from '../../services/offline/eventQueue';
import { AuditRepository } from '../../services/repositories';
import {
  AlertCircle,
  AlertTriangle,
  Building2,
  Camera,
  CheckCircle2,
  Droplets,
  Flame,
  HelpCircle,
  MapPin,
  RefreshCw,
  Send,
  Shield,
  Truck,
  WifiOff,
  Zap,
} from 'lucide-react';

interface ResponderFieldReportsProps {
  missions: Mission[];
  incidents: Incident[];
  activeMission?: Mission | null;
  onReportSubmitted: () => void;
}

export const ResponderFieldReports: React.FC<ResponderFieldReportsProps> = ({
  missions,
  incidents,
  activeMission,
  onReportSubmitted,
}) => {
  const { currentUser } = useAuth();

  const [category, setCategory] = useState<
    | 'ROAD_BLOCKED'
    | 'FLOOD'
    | 'BUILDING_DAMAGE'
    | 'FIRE'
    | 'MEDICAL'
    | 'POWER_OUTAGE'
    | 'RESOURCE_SHORTAGE'
    | 'CONDITIONS_CHANGED'
    | 'OTHER'
  >('ROAD_BLOCKED');

  const [locationName, setLocationName] = useState(
    activeMission ? activeMission.pickupLocation : 'Tumana Bridge Approach'
  );
  const [observation, setObservation] = useState('');
  const [roadStatus, setRoadStatus] = useState<'PASSABLE' | 'LIGHT_VEHICLES_ONLY' | 'IMPASSABLE' | 'UNKNOWN'>('IMPASSABLE');
  const [floodDepthCm, setFloodDepthCm] = useState<number | undefined>(undefined);
  const [associatedMissionId, setAssociatedMissionId] = useState(activeMission ? activeMission.id : '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionFeedback, setSubmissionFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const categories = [
    { id: 'ROAD_BLOCKED', label: 'Road Blocked / Obstruction', icon: Truck },
    { id: 'FLOOD', label: 'Flooding / Depth Change', icon: Droplets },
    { id: 'BUILDING_DAMAGE', label: 'Building Collapse / Cracks', icon: Building2 },
    { id: 'FIRE', label: 'Fire / Hazardous Gas', icon: Flame },
    { id: 'MEDICAL', label: 'Medical Emergency', icon: AlertCircle },
    { id: 'POWER_OUTAGE', label: 'Power Wire / Transformer', icon: Zap },
    { id: 'CONDITIONS_CHANGED', label: 'Conditions Changed / Cleared', icon: CheckCircle2 },
    { id: 'OTHER', label: 'Other Hazard / Observation', icon: HelpCircle },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!observation.trim()) {
      setSubmissionFeedback({ type: 'error', text: 'Please write a field observation note.' });
      return;
    }

    setIsSubmitting(true);
    setSubmissionFeedback(null);

    try {
      const reportId = 'rep_' + crypto.randomUUID();
      const newReport: Report = {
        id: reportId,
        incidentId: associatedMissionId || 'inc_field_general',
        reporterId: currentUser.id,
        reporterName: currentUser.name,
        reporterRole: currentUser.role,
        reportType: category === 'CONDITIONS_CHANGED' ? 'STATUS_UPDATE' : 'CORROBORATION',
        observation: `[${category}] ${observation.trim()} (Location: ${locationName})`,
        roadStatus: category === 'ROAD_BLOCKED' ? roadStatus : undefined,
        floodDepthCm: category === 'FLOOD' ? floodDepthCm : undefined,
        timestamp: new Date().toISOString(),
        lat: 14.654,
        lng: 121.099,
      };

      await localDB.put(STORES.REPORTS, newReport);
      await EventQueueService.recordLocalWrite('report', STORES.REPORTS, newReport, 'CREATE', currentUser.id);

      // If report links to an incident or mission with an incident, update incident report count
      const targetIncident = incidents.find(
        (i) => i.id === newReport.incidentId || i.id === associatedMissionId
      );
      if (targetIncident) {
        targetIncident.supportingReportsCount = (targetIncident.supportingReportsCount || 0) + 1;
        await localDB.put(STORES.INCIDENTS, targetIncident);
        await EventQueueService.recordLocalWrite('incident', STORES.INCIDENTS, targetIncident, 'UPDATE', currentUser.id);
      }

      await AuditRepository.log(
        currentUser,
        'SUBMIT_FIELD_REPORT',
        'report',
        reportId,
        `Field responder observation at ${locationName}: ${observation.trim()}`
      );

      setSubmissionFeedback({
        type: 'success',
        text: 'Report recorded locally in offline store and queued for command center sync.',
      });

      setObservation('');
      onReportSubmitted();
    } catch (err: any) {
      setSubmissionFeedback({
        type: 'error',
        text: err.message || 'Failed to record field observation.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-[#182522]">Report Field Conditions</h1>
        <p className="text-xs sm:text-sm text-[#66736D] mt-0.5">
          Record ground observations, flood heights, and road passability directly from the field.
        </p>
      </div>

      {submissionFeedback && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-start gap-2.5 ${
            submissionFeedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
              : 'bg-rose-50 text-rose-900 border border-rose-200'
          }`}
        >
          {submissionFeedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          )}
          <span>{submissionFeedback.text}</span>
        </div>
      )}

      {/* Main Report Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-[#E3E9E5] p-5 sm:p-6 shadow-sm space-y-5">
        {/* Category Picker */}
        <div>
          <label className="block text-xs font-bold text-[#182522] mb-2 uppercase tracking-wider">
            Observation Category
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isSelected = category === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id as any)}
                  className={`p-3 rounded-2xl border text-left flex flex-col gap-1.5 transition text-xs font-bold ${
                    isSelected
                      ? 'border-[#16856B] bg-emerald-50 text-[#153B32] ring-1 ring-[#16856B]'
                      : 'border-[#E3E9E5] bg-white text-[#182522] hover:bg-[#F5F7F6]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-[#16856B]' : 'text-[#66736D]'}`} />
                  <span className="line-clamp-2 leading-tight">{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Mission Association */}
        {missions.length > 0 && (
          <div>
            <label className="block text-xs font-bold text-[#182522] mb-1.5 uppercase tracking-wider">
              Associate with Assigned Mission (Optional)
            </label>
            <select
              value={associatedMissionId}
              onChange={(e) => setAssociatedMissionId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E3E9E5] text-xs focus:outline-none focus:ring-2 focus:ring-[#16856B] bg-[#F5F7F6] font-medium"
            >
              <option value="">General Area Observation (No Specific Mission)</option>
              {missions.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title} ({m.pickupLocation})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Location Name */}
        <div>
          <label className="block text-xs font-bold text-[#182522] mb-1.5 uppercase tracking-wider">
            Field Location / Landmark
          </label>
          <div className="relative">
            <MapPin className="w-4 h-4 text-[#66736D] absolute left-3.5 top-3" />
            <input
              type="text"
              required
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder="e.g. Tumana Bridge East Approach, JP Rizal St"
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#E3E9E5] text-xs focus:outline-none focus:ring-2 focus:ring-[#16856B] bg-white"
            />
          </div>
        </div>

        {/* Conditional Category Specific Controls */}
        {category === 'ROAD_BLOCKED' && (
          <div>
            <label className="block text-xs font-bold text-[#182522] mb-1.5 uppercase tracking-wider">
              Road Passability Status
            </label>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {(['PASSABLE', 'LIGHT_VEHICLES_ONLY', 'IMPASSABLE'] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setRoadStatus(status)}
                  className={`p-2.5 rounded-xl border font-bold text-center transition ${
                    roadStatus === status
                      ? status === 'IMPASSABLE'
                        ? 'bg-rose-50 border-rose-600 text-rose-900 ring-1 ring-rose-600'
                        : 'bg-emerald-50 border-emerald-600 text-emerald-900 ring-1 ring-emerald-600'
                      : 'bg-white border-[#E3E9E5] text-[#182522]'
                  }`}
                >
                  {status.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>
        )}

        {category === 'FLOOD' && (
          <div>
            <label className="block text-xs font-bold text-[#182522] mb-1.5 uppercase tracking-wider">
              Approximate Water Depth (Centimeters)
            </label>
            <input
              type="number"
              min="0"
              max="400"
              value={floodDepthCm ?? ''}
              onChange={(e) => setFloodDepthCm(e.target.value ? parseInt(e.target.value, 10) : undefined)}
              placeholder="e.g. 110 (Waist-deep)"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E3E9E5] text-xs focus:outline-none focus:ring-2 focus:ring-[#16856B] bg-white"
            />
          </div>
        )}

        {/* Detailed Observation */}
        <div>
          <label className="block text-xs font-bold text-[#182522] mb-1.5 uppercase tracking-wider">
            Observation Notes & Ground Intelligence <span className="text-rose-600">*</span>
          </label>
          <textarea
            rows={3}
            required
            value={observation}
            onChange={(e) => setObservation(e.target.value)}
            placeholder="Describe what you see: vehicle clearance, debris, water current speed, or safe bypass routes..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#E3E9E5] text-xs focus:outline-none focus:ring-2 focus:ring-[#16856B] bg-white"
          />
        </div>

        {/* Truth-Telling Offline Notice */}
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
          <WifiOff className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            Observations are committed immediately to this device’s local IndexedDB store. Once connectivity is established, changes sync with the command center automatically.
          </p>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-[#16856B] hover:bg-[#153B32] text-white text-xs font-extrabold transition shadow-sm flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span>Save & Transmit Field Report</span>
          </button>
        </div>
      </form>
    </div>
  );
};
