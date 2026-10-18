/**
 * Resilia Screen 4: Report Community Incident
 * Enforces RBAC: ONLY RESIDENTS can report new emergency incidents.
 * Supports multi-disaster reporting including Earthquakes (PHIVOLCS PEIS intensity,
 * structural collapse, trapped individuals), Floods, Landslides, Typhoons, and Fires.
 */

import React, { useState } from 'react';
import { useAuth } from '../services/auth/authContext';
import { IncidentRepository } from '../services/repositories';
import { IncidentSeverity, IncidentType, UserRole } from '../types';
import {
  AlertTriangle,
  Activity,
  Building2,
  Camera,
  CheckCircle2,
  Clock,
  Compass,
  Database,
  Flame,
  HardHat,
  HeartHandshake,
  HelpCircle,
  Layers,
  MapPin,
  RefreshCw,
  Send,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  Waves,
  Wind,
  X,
} from 'lucide-react';
import { syncClient } from '../services/offline/syncClient';
import { useToast } from '../components/common/Toast';

interface ReportIncidentScreenProps {
  onIncidentCreated?: () => void;
  onNavigate?: (screen: any) => void;
}

const DISASTER_CATEGORIES: {
  type: IncidentType;
  label: string;
  icon: any;
  defaultSeverity: IncidentSeverity;
  hint: string;
}[] = [
  {
    type: 'EARTHQUAKE',
    label: 'Earthquake & Tremor',
    icon: Activity,
    defaultSeverity: 'CRITICAL',
    hint: 'Ground shaking, building cracks, structural collapse, West Valley fault activity',
  },
  {
    type: 'FLOOD',
    label: 'Flood & River Surge',
    icon: Waves,
    defaultSeverity: 'HIGH',
    hint: 'Marikina river overtopping, gutter-to-waist water rise, flash flooding',
  },
  {
    type: 'LANDSLIDE',
    label: 'Landslide / Soil Debris',
    icon: Layers,
    defaultSeverity: 'HIGH',
    hint: 'Slope failure, mudflow, riverbank collapse, blocked roads',
  },
  {
    type: 'TYPHOON',
    label: 'Typhoon & Gale Winds',
    icon: Wind,
    defaultSeverity: 'HIGH',
    hint: 'Gale-force winds, tin roof tearing, fallen trees, wind hazards',
  },
  {
    type: 'ROAD_BLOCKED',
    label: 'Road Impassable / Blocked',
    icon: AlertTriangle,
    defaultSeverity: 'HIGH',
    hint: 'Debris, submerged roads, fallen trees preventing emergency vehicles',
  },
  {
    type: 'BUILDING_DAMAGE',
    label: 'Structural Damage',
    icon: Building2,
    defaultSeverity: 'HIGH',
    hint: 'Collapsed walls, cracked bridges, weakened post-quake structures',
  },
  {
    type: 'FIRE',
    label: 'Fire Outbreak',
    icon: Flame,
    defaultSeverity: 'CRITICAL',
    hint: 'Active urban fire, electrical fire hazards post-disaster',
  },
  {
    type: 'VOLCANO_ERUPTION',
    label: 'Volcano Eruption & Ashfall',
    icon: Flame,
    defaultSeverity: 'CRITICAL',
    hint: 'PHIVOLCS alert levels 1-5, volcanic ashfall, pyroclastic hazard, lahar, danger zone evacuation',
  },
  {
    type: 'TSUNAMI',
    label: 'Tsunami & Coastal Surge',
    icon: Waves,
    defaultSeverity: 'CRITICAL',
    hint: 'Rapid sea recession, towering tsunami wave surge, coastal inundation, immediate high-ground evacuation',
  },
  {
    type: 'MEDICAL_EMERGENCY',
    label: 'Medical Emergency',
    icon: ShieldAlert,
    defaultSeverity: 'CRITICAL',
    hint: 'Casualties, crush injuries, severe trauma, hypothermia',
  },
  {
    type: 'PERSON_IN_DISTRESS',
    label: 'Person in Distress',
    icon: HeartHandshake,
    defaultSeverity: 'CRITICAL',
    hint: 'Stranded citizens, trapped family, urgent rescue or evacuation required',
  },
  {
    type: 'POWER_OUTAGE',
    label: 'Power Grid Hazard',
    icon: AlertTriangle,
    defaultSeverity: 'MEDIUM',
    hint: 'Downed live electric wires, transformer explosion, blacked out sector',
  },
  {
    type: 'OTHER',
    label: 'Other Disaster Hazard',
    icon: HelpCircle,
    defaultSeverity: 'LOW',
    hint: 'Other hazardous events needing community awareness',
  },
];

// PHIVOLCS Earthquake Intensity Scale (PEIS)
const PEIS_INTENSITY_LEVELS = [
  { level: 4, label: 'PEIS IV - Moderately Strong (Felt by most indoors, hanging objects swing)' },
  { level: 5, label: 'PEIS V - Strong (Felt generally, strong shaking, small objects overturn)' },
  { level: 6, label: 'PEIS VI - Very Strong (People lose balance, hairline cracks in plaster/masonry)' },
  { level: 7, label: 'PEIS VII - Destructive (Heavy furniture topples, substantial damage to weak buildings, cracks in dikes)' },
  { level: 8, label: 'PEIS VIII - Very Destructive (Many well-built structures partially collapse, ground fissures, liquefaction)' },
  { level: 9, label: 'PEIS IX - Devastating (Most buildings totally collapse, bridges destroyed, severe landslides)' },
  { level: 10, label: 'PEIS X - Completely Devastating (Total destruction, massive landscape distortion)' },
];

// PHIVOLCS Volcano Alert Levels
const PHIVOLCS_VOLCANO_ALERT_LEVELS = [
  { level: 1, label: 'Alert 1 - Low-level Unrest (Hydrothermal/steam activity)' },
  { level: 2, label: 'Alert 2 - Moderate Unrest (Magmatic intrusion/elevated tremors)' },
  { level: 3, label: 'Alert 3 - High Tendency Towards Hazardous Eruption' },
  { level: 4, label: 'Alert 4 - Hazardous Eruption Imminent (Evacuate Danger Zone)' },
  { level: 5, label: 'Alert 5 - Hazardous Eruption in Progress (Pyroclastic flow/Lahar)' },
];

const PHOTO_PRESETS = [
  { label: 'Flood Surge', url: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=800&q=80' },
  { label: 'Tsunami Wave Surge', url: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?auto=format&fit=crop&w=800&q=80' },
  { label: 'Volcano Ashfall', url: 'https://images.unsplash.com/photo-1542385151-efd9000785a0?auto=format&fit=crop&w=800&q=80' },
  { label: 'Quake Crack', url: 'https://images.unsplash.com/photo-1590247813693-5541d1c609fd?auto=format&fit=crop&w=800&q=80' },
  { label: 'Road Blockage', url: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=800&q=80' },
];

export const ReportIncidentScreen: React.FC<ReportIncidentScreenProps> = ({
  onIncidentCreated,
  onNavigate,
}) => {
  const { currentUser, setRole } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();

  const [type, setType] = useState<IncidentType>('EARTHQUAKE');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [locationName, setLocationName] = useState('Purok 4, Tumana Dike Side');
  const [lat, setLat] = useState(14.658);
  const [lng, setLng] = useState(121.102);
  const [severity, setSeverity] = useState<IncidentSeverity>('CRITICAL');

  // Disaster specific telemetry
  const [floodDepthCm, setFloodDepthCm] = useState<number>(80);
  const [earthquakeIntensity, setEarthquakeIntensity] = useState<number>(7);
  const [volcanoAlertLevel, setVolcanoAlertLevel] = useState<number>(3);
  const [ashfallSeverity, setAshfallSeverity] = useState<'LIGHT' | 'MODERATE' | 'HEAVY'>('MODERATE');
  const [tsunamiWaveHeightMeters, setTsunamiWaveHeightMeters] = useState<number>(3.5);
  const [inundationDistanceMeters, setInundationDistanceMeters] = useState<number>(300);
  const [structuralDamageLevel, setStructuralDamageLevel] = useState<
    'NONE' | 'MINOR_CRACKS' | 'PARTIAL_COLLAPSE' | 'TOTAL_COLLAPSE'
  >('PARTIAL_COLLAPSE');
  const [trappedPersonsCount, setTrappedPersonsCount] = useState<number>(0);
  const [aftershockWarning, setAftershockWarning] = useState<boolean>(true);
  const [photoUrl, setPhotoUrl] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{
    id: string;
    saveState: 'SAVED_LOCALLY_PENDING_SYNC' | 'SYNCHRONIZED';
    timestamp: string;
    type: IncidentType;
    photoUrl?: string;
  } | null>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setPhotoUrl(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // RBAC GUARD: Only residents and responders can report incidents (coordinators manage/verify)
  if (currentUser.role !== 'RESIDENT' && currentUser.role !== 'RESPONDER') {
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in">
        <div className="bg-white rounded-3xl border border-amber-300 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-amber-500 text-white shadow-md shrink-0">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold uppercase tracking-wide border border-amber-300">
                  RBAC Policy Enforced
                </span>
                <span className="text-xs text-neutral-500 font-medium">Field Reporting Gate</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-neutral-900 mt-1">
                Only Residents & Emergency Responders Can Report Incidents
              </h2>
              <p className="text-xs sm:text-sm text-neutral-600 mt-2 leading-relaxed">
                You are currently signed in as{' '}
                <strong className="text-neutral-900 font-bold">
                  {currentUser.name} ({currentUser.role})
                </strong>
                . Field hazard reports and distress notifications originate from Citizens and Emergency Responders on the ground.
              </p>
            </div>
          </div>

          {/* Role Comparison Table */}
          <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-200 text-xs space-y-3">
            <h4 className="font-bold text-neutral-900 flex items-center gap-1.5 text-xs">
              <Compass className="w-4 h-4 text-emerald-600" />
              <span>Resilia Segregation of Duties:</span>
            </h4>
            <div className="space-y-2">
              <div className="p-2.5 rounded-xl bg-white border border-neutral-200 flex items-start gap-2.5">
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px] shrink-0">
                  RESIDENT
                </span>
                <span className="text-neutral-700 text-[11px]">
                  <strong>Reports incidents</strong> (earthquakes, floods, fires) and requests life-saving assistance.
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-neutral-200 flex items-start gap-2.5">
                <span className="px-2 py-0.5 rounded bg-teal-100 text-teal-800 font-bold text-[10px] shrink-0">
                  RESPONDER
                </span>
                <span className="text-neutral-700 text-[11px]">
                  <strong>Reports hazards & persons in distress</strong> from the field, updates mission status, and executes rescues.
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-neutral-200 flex items-start gap-2.5">
                <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px] shrink-0">
                  COORDINATOR
                </span>
                <span className="text-neutral-700 text-[11px]">
                  <strong>Assigns responders</strong>, verifies threats, approves missions, and manages shelter resources.
                </span>
              </div>
            </div>
          </div>

          {/* Return to Authorized Dashboard */}
          <div className="pt-2">
            {onNavigate && (
              <button
                onClick={() => onNavigate('COORDINATOR')}
                className="w-full py-3 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Return to Incident Command Dashboard</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setIsSubmitting(true);
    try {
      const generatedTitle =
        title.trim() ||
        (type === 'EARTHQUAKE'
          ? `PEIS Intensity ${earthquakeIntensity} Earthquake Damage at ${locationName}`
          : type === 'VOLCANO_ERUPTION'
          ? `Volcanic Eruption Alert Level ${volcanoAlertLevel} (${ashfallSeverity} Ashfall) at ${locationName}`
          : `${type.replace('_', ' ')} Hazard at ${locationName}`);

      const newIncident = await IncidentRepository.createIncident(
        {
          type,
          title: generatedTitle,
          description,
          lat,
          lng,
          locationName,
          reporterId: currentUser.id,
          reporterName: currentUser.name,
          reporterRole: currentUser.role,
          severity,
          status: 'REPORTED',
          floodDepthCm: type === 'FLOOD' || type === 'ROAD_BLOCKED' ? Number(floodDepthCm) : undefined,
          earthquakeIntensity: type === 'EARTHQUAKE' ? Number(earthquakeIntensity) : undefined,
          structuralDamageLevel:
            type === 'EARTHQUAKE' || type === 'BUILDING_DAMAGE' ? structuralDamageLevel : undefined,
          trappedPersonsCount:
            type === 'EARTHQUAKE' || type === 'BUILDING_DAMAGE' ? Number(trappedPersonsCount) : undefined,
          aftershockWarning: type === 'EARTHQUAKE' ? aftershockWarning : undefined,
          volcanoAlertLevel: type === 'VOLCANO_ERUPTION' ? Number(volcanoAlertLevel) : undefined,
          ashfallSeverity: type === 'VOLCANO_ERUPTION' ? ashfallSeverity : undefined,
          tsunamiWaveHeightMeters: type === 'TSUNAMI' ? Number(tsunamiWaveHeightMeters) : undefined,
          inundationDistanceMeters: type === 'TSUNAMI' ? Number(inundationDistanceMeters) : undefined,
          photoUrl: photoUrl.trim() ? photoUrl : undefined,
        },
        currentUser
      );

      // Check if online to attempt immediate sync trigger
      const isOnline = syncClient.getStatus() === 'ONLINE';
      let state: 'SAVED_LOCALLY_PENDING_SYNC' | 'SYNCHRONIZED' = 'SAVED_LOCALLY_PENDING_SYNC';

      if (isOnline) {
        const syncRes = await syncClient.triggerSync();
        if (syncRes.success && syncRes.syncedCount > 0) {
          state = 'SYNCHRONIZED';
        }
      }

      setSubmissionResult({
        id: newIncident.id,
        saveState: state,
        timestamp: newIncident.createdAt,
        type: newIncident.type,
        photoUrl: newIncident.photoUrl,
      });

      toastSuccess(`Incident report #${newIncident.id.slice(0, 6).toUpperCase()} logged & queued!`, 'Report Submitted');
      if (onIncidentCreated) onIncidentCreated();
    } catch (err: any) {
      toastError(err.message || 'Error creating incident', 'Submission Failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in">
      <div className="bg-white rounded-3xl border border-neutral-200 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-2xl bg-rose-600 text-white shadow-sm">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                currentUser.role === 'RESPONDER'
                  ? 'bg-teal-100 text-teal-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}>
                {currentUser.role === 'RESPONDER' ? 'Responder Field Dispatch' : 'Citizen Portal'}
              </span>
              <span className="text-[11px] text-neutral-500">Disasters, Hazards & Persons in Distress</span>
            </div>
            <h2 className="text-xl font-extrabold text-neutral-900">Report Emergency Incident</h2>
            <p className="text-xs text-neutral-500">
              Log earthquakes, floods, structural collapse, or hazards. Works offline via IndexedDB.
            </p>
          </div>
        </div>

        {submissionResult ? (
          <div className="mt-6 p-6 sm:p-7 rounded-3xl bg-emerald-500/5 border border-emerald-500/25 text-neutral-900 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="relative flex items-center justify-center shrink-0">
                  <span className="animate-ping absolute inline-flex h-9 w-9 rounded-full bg-emerald-400 opacity-30" />
                  <div className="relative w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-md">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base sm:text-lg font-bold text-emerald-950">
                      Emergency Incident Reported Successfully!
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800">
                      #{submissionResult.id.slice(0, 8).toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-emerald-800/90 mt-0.5">
                    Your report has been written to local storage and broadcast to Responders and Coordinators.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-emerald-200/80 shadow-2xs space-y-3 text-xs">
              <div className="flex justify-between items-center py-1.5 border-b border-neutral-100">
                <span className="text-neutral-500">Incident Category:</span>
                <span className="font-bold text-neutral-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  {submissionResult.type.replace('_', ' ')}
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-neutral-100">
                <span className="text-neutral-500">Storage & Sync Verification:</span>
                <span
                  className={`font-bold px-2.5 py-1 rounded-lg text-[11px] flex items-center gap-1.5 ${
                    submissionResult.saveState === 'SYNCHRONIZED'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-teal-50 text-teal-800 border border-teal-200'
                  }`}
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>
                    {submissionResult.saveState === 'SYNCHRONIZED'
                      ? '✓ Synchronized to Cloud Feed'
                      : '✓ Saved Locally in Offline Store (Pending Cloud Sync)'}
                  </span>
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-neutral-500">Created Timestamp:</span>
                <span className="text-neutral-700 font-mono">
                  {new Date(submissionResult.timestamp).toLocaleString()}
                </span>
              </div>
            </div>

            {submissionResult.photoUrl && (
              <div className="relative rounded-2xl overflow-hidden border border-emerald-300 bg-neutral-950 max-h-56">
                <img
                  src={submissionResult.photoUrl}
                  alt={submissionResult.type}
                  className="w-full h-44 object-cover"
                />
                <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-xs text-white text-[10px] font-medium flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-amber-400" />
                  <span>Field Photo Attached</span>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <button
                onClick={() => {
                  setSubmissionResult(null);
                  setDescription('');
                  setTitle('');
                }}
                className="px-4 py-2.5 rounded-xl border border-neutral-300 hover:bg-neutral-100 text-neutral-700 font-semibold text-xs transition"
              >
                Report Another Incident
              </button>
              {onNavigate && (
                <button
                  onClick={() => onNavigate('MAP')}
                  className="px-5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-2xs"
                >
                  <Compass className="w-3.5 h-3.5 text-amber-400" />
                  <span>View Incident on Map</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-5 text-xs">
            {/* Disaster Type Selector */}
            <div>
              <label className="font-bold text-neutral-800 block mb-1.5 flex items-center justify-between">
                <span>Select Disaster / Hazard Type</span>
                <span className="text-[10px] text-neutral-400 font-normal">Choose the primary threat</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {DISASTER_CATEGORIES.map((item) => {
                  const Icon = item.icon;
                  const isSelected = type === item.type;
                  return (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => {
                        setType(item.type);
                        setSeverity(item.defaultSeverity);
                      }}
                      className={`p-3 rounded-2xl border text-left transition relative flex flex-col justify-between min-h-[72px] ${
                        isSelected
                          ? 'bg-rose-50 border-rose-500 text-rose-950 font-bold shadow-xs ring-1 ring-rose-400'
                          : 'bg-neutral-50 border-neutral-200 text-neutral-700 hover:bg-neutral-100'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <Icon
                          className={`w-4 h-4 shrink-0 ${
                            isSelected ? 'text-rose-600' : 'text-neutral-500'
                          }`}
                        />
                        <span className="text-xs font-bold leading-tight">{item.label}</span>
                      </div>
                      <span className="text-[10px] text-neutral-500 line-clamp-1 mt-1 font-normal">
                        {item.hint}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* EARTHQUAKE SPECIALIZED TELEMETRY FIELDS */}
            {type === 'EARTHQUAKE' && (
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-300 space-y-3.5 animate-in fade-in">
                <div className="flex items-center gap-2 text-amber-900 font-black text-xs">
                  <Activity className="w-4 h-4 text-amber-600" />
                  <span>Earthquake Damage & Ground Shaking Parameters (PHIVOLCS)</span>
                </div>

                {/* PEIS Intensity Selector */}
                <div>
                  <label className="font-bold text-neutral-800 block mb-1">
                    Perceived Intensity (PHIVOLCS PEIS Scale)
                  </label>
                  <select
                    value={earthquakeIntensity}
                    onChange={(e) => setEarthquakeIntensity(Number(e.target.value))}
                    className="w-full bg-white border border-amber-300 rounded-xl p-2.5 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                  >
                    {PEIS_INTENSITY_LEVELS.map((item) => (
                      <option key={item.level} value={item.level}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Structural Damage Level */}
                <div>
                  <label className="font-bold text-neutral-800 block mb-1">
                    Observed Structural Damage Level
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {[
                      { val: 'NONE', label: 'None / Superficial' },
                      { val: 'MINOR_CRACKS', label: 'Minor Cracks' },
                      { val: 'PARTIAL_COLLAPSE', label: 'Partial Collapse' },
                      { val: 'TOTAL_COLLAPSE', label: 'Total Collapse' },
                    ].map((item) => (
                      <button
                        key={item.val}
                        type="button"
                        onClick={() => setStructuralDamageLevel(item.val as any)}
                        className={`py-2 px-2 rounded-xl text-[10px] font-bold border transition ${
                          structuralDamageLevel === item.val
                            ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                            : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-100'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Trapped Persons & Aftershocks */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="font-bold text-neutral-800 block mb-1">
                      Estimated Trapped Individuals
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={trappedPersonsCount}
                      onChange={(e) => setTrappedPersonsCount(Number(e.target.value))}
                      className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-5">
                    <label className="flex items-center gap-2 text-neutral-800 font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={aftershockWarning}
                        onChange={(e) => setAftershockWarning(e.target.checked)}
                        className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-neutral-300"
                      />
                      <span>Strong Aftershocks Still Felt</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* FLOOD & ROAD BLOCKED TELEMETRY FIELDS */}
            {(type === 'FLOOD' || type === 'ROAD_BLOCKED') && (
              <div className="p-4 rounded-2xl bg-cyan-50/80 border border-cyan-300 space-y-3 animate-in fade-in">
                <div className="flex items-center gap-2 text-cyan-900 font-black text-xs">
                  <Waves className="w-4 h-4 text-cyan-600" />
                  <span>Hydrological Flood Depth Parameters</span>
                </div>
                <div>
                  <label className="font-bold text-neutral-800 block mb-1">
                    Estimated Flood Depth (cm)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="0"
                      max="300"
                      step="10"
                      value={floodDepthCm}
                      onChange={(e) => setFloodDepthCm(Number(e.target.value))}
                      className="flex-1 accent-cyan-600"
                    />
                    <span className="font-bold text-sm text-cyan-950 font-mono w-16 text-right">
                      {floodDepthCm} cm
                    </span>
                  </div>
                  <div className="flex justify-between text-[10px] text-neutral-500 mt-1">
                    <span>Ankle (20cm)</span>
                    <span>Knee (50cm)</span>
                    <span>Waist (100cm)</span>
                    <span>Neck / Submerged (&gt;150cm)</span>
                  </div>
                </div>
              </div>
            )}

            {/* VOLCANO ERUPTION SPECIFIC TELEMETRY */}
            {type === 'VOLCANO_ERUPTION' && (
              <div className="p-4 rounded-2xl bg-rose-50/80 border border-rose-300 space-y-3.5 animate-in fade-in">
                <div className="flex items-center gap-2 text-rose-950 font-black text-xs">
                  <Flame className="w-4 h-4 text-rose-600" />
                  <span>PHIVOLCS Volcanic Alert & Ashfall Parameters</span>
                </div>

                <div>
                  <label className="font-bold text-neutral-800 block mb-1.5">
                    Volcano Alert Level:
                  </label>
                  <div className="space-y-1.5">
                    {PHIVOLCS_VOLCANO_ALERT_LEVELS.map((al) => (
                      <button
                        key={al.level}
                        type="button"
                        onClick={() => setVolcanoAlertLevel(al.level)}
                        className={`w-full p-2.5 rounded-xl border text-left font-medium text-xs transition flex items-center justify-between ${
                          volcanoAlertLevel === al.level
                            ? 'bg-rose-700 text-white font-bold shadow-xs'
                            : 'bg-white text-neutral-800 border-neutral-200 hover:bg-neutral-100'
                        }`}
                      >
                        <span>{al.label}</span>
                        {volcanoAlertLevel === al.level && <CheckCircle2 className="w-4 h-4 text-white" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-rose-200 flex flex-wrap items-center justify-between gap-2">
                  <label className="font-bold text-neutral-800 text-xs">Ashfall Severity:</label>
                  <div className="flex gap-2">
                    {(['LIGHT', 'MODERATE', 'HEAVY'] as const).map((sev) => (
                      <button
                        key={sev}
                        type="button"
                        onClick={() => setAshfallSeverity(sev)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                          ashfallSeverity === sev
                            ? 'bg-neutral-900 text-white shadow-xs'
                            : 'bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-100'
                        }`}
                      >
                        {sev}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TSUNAMI & COASTAL SURGE TELEMETRY FIELDS */}
            {type === 'TSUNAMI' && (
              <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-300 space-y-3 animate-in fade-in">
                <div className="flex items-center gap-2 text-blue-900 font-black text-xs">
                  <Waves className="w-4 h-4 text-blue-600" />
                  <span>PHIVOLCS Tsunami & Coastal Inundation Parameters</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-neutral-800 block mb-1">
                      Estimated Tsunami Wave Height (Meters)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      max="30"
                      value={tsunamiWaveHeightMeters}
                      onChange={(e) => setTsunamiWaveHeightMeters(Number(e.target.value))}
                      className="w-full bg-white border border-blue-300 rounded-xl px-3 py-2 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                    <span className="text-[10px] text-blue-700 mt-1 block">
                      {tsunamiWaveHeightMeters >= 3
                        ? 'Major Tsunami Threat: Immediate vertical evacuation to 4th floor+ or inland hills'
                        : 'Tsunami Surge: Immediate shoreline & estuary evacuation'}
                    </span>
                  </div>

                  <div>
                    <label className="font-bold text-neutral-800 block mb-1">
                      Inland Inundation Reach (Meters)
                    </label>
                    <input
                      type="number"
                      step="50"
                      min="50"
                      max="5000"
                      value={inundationDistanceMeters}
                      onChange={(e) => setInundationDistanceMeters(Number(e.target.value))}
                      className="w-full bg-white border border-blue-300 rounded-xl px-3 py-2 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                    <span className="text-[10px] text-neutral-500 mt-1 block">
                      Distance water surge has penetrated inland from river mouth or coastline
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Title / Headline */}
            <div>
              <label className="font-bold text-neutral-800 block mb-1">
                Incident Title / Headline (Optional)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  type === 'EARTHQUAKE'
                    ? 'e.g., Cracked Bridge & Wall Collapse along Tumana Dike'
                    : 'e.g., Overflowing creek at Purok 4'
                }
                className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2.5 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white"
              />
            </div>

            {/* Description */}
            <div>
              <label className="font-bold text-neutral-800 block mb-1">
                Field Observation Details <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={
                  type === 'EARTHQUAKE'
                    ? 'Describe what shook, building damage, fissures on roads, stranded families or collapsed masonry...'
                    : 'Describe what you observe (water level rise, stranded people, impassable vehicles, power line down)...'
                }
                className="w-full bg-neutral-50 border border-neutral-300 rounded-xl p-3 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white"
              />
            </div>

            {/* Location & Coordinates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-neutral-800 block mb-1">Street / Landmark Location</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-xl pl-9 pr-3 py-2.5 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-neutral-800 block mb-1">Observed Severity Level</label>
                <div className="flex gap-1.5">
                  {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as IncidentSeverity[]).map((sev) => (
                    <button
                      key={sev}
                      type="button"
                      onClick={() => setSeverity(sev)}
                      className={`flex-1 py-2 rounded-xl border text-center font-bold text-[10px] transition ${
                        severity === sev
                          ? sev === 'CRITICAL'
                            ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                            : 'bg-amber-500 text-white border-amber-600 shadow-xs'
                          : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                      }`}
                    >
                      {sev}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Photo Evidence Attachment */}
            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <label className="font-bold text-neutral-800 text-xs flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-neutral-600" />
                    <span>Attach Incident Photo Evidence (Optional)</span>
                  </label>
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    Helps coordinators verify and responders prepare equipment before dispatch.
                  </p>
                </div>
                <div>
                  <label className="cursor-pointer px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-xs">
                    <Camera className="w-3.5 h-3.5 text-amber-400" />
                    <span>Upload from Device / Camera</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Sample Photo Presets for Rapid Testing */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-neutral-500">
                <span className="text-[10px] text-neutral-400">Or sample presets:</span>
                {PHOTO_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setPhotoUrl(preset.url)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition ${
                      photoUrl === preset.url
                        ? 'bg-neutral-900 text-white font-bold'
                        : 'bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-100'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Live Preview */}
              {photoUrl && (
                <div className="relative rounded-2xl overflow-hidden border border-neutral-300 bg-neutral-950 max-h-56 mt-2">
                  <img
                    src={photoUrl}
                    alt="Uploaded incident preview"
                    className="w-full h-44 object-cover"
                  />
                  <div className="absolute top-2 right-2 flex items-center gap-1.5">
                    <span className="px-2.5 py-0.5 rounded-full bg-black/75 backdrop-blur-xs text-[10px] text-white font-semibold">
                      Photo Attached
                    </span>
                    <button
                      type="button"
                      onClick={() => setPhotoUrl('')}
                      className="p-1.5 rounded-full bg-black/80 text-white hover:bg-rose-600 transition"
                      title="Remove image"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Reporter Info Bar */}
            <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-200 text-neutral-600 flex justify-between items-center text-[11px]">
              <div>
                Logged by Resident: <span className="font-bold text-neutral-900">{currentUser.name}</span>
              </div>
              <div className="flex items-center gap-1 text-emerald-700 font-semibold">
                <Database className="w-3.5 h-3.5" />
                <span>IndexedDB Durable Write</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !description.trim()}
              className="w-full py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>Submit {type.replace('_', ' ')} Incident Report</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
