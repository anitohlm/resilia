/**
 * Boil Water & Disease Outbreak Watch Modal
 * (Leptospirosis, Cholera & Waterborne Disease Post-Flood Monitoring)
 *
 * Implements:
 * 1. Floodwater Exposure Tracker: Logs wading timestamp + wounds -> calculates 72-hour
 *    prophylactic Doxycycline countdown with DOH clinical protocol guidance.
 * 2. Boil-Water Advisories & Household Disinfection Dosages.
 * 3. Interactive Symptoms Self-Checker for Leptospirosis & Cholera.
 * 4. Local Health Center & Free Doxycycline Dispensing Sites Directory.
 * 5. Client-side local storage with sync upon reconnection.
 */

import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertCircle,
  AlertOctagon,
  AlertTriangle,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Droplets,
  Flame,
  Heart,
  HeartPulse,
  HelpCircle,
  Hospital,
  Info,
  MapPin,
  Pill,
  Plus,
  ShieldAlert,
  ShieldCheck,
  Stethoscope,
  Thermometer,
  Waves,
  X,
} from 'lucide-react';
import {
  FloodExposureRecord,
  OutbreakAdvisory,
  OutbreakAdvisoryType,
  OutbreakSeverity,
} from '../../types';
import { OutbreakWatchRepository } from '../../services/repositories';
import { useAuth } from '../../services/auth/authContext';

interface DiseaseOutbreakWatchModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  isInline?: boolean;
  initialTab?: HealthTab;
  onAdvisoryCreated?: () => void;
}

type HealthTab =
  | 'ADVISORIES'
  | 'EXPOSURE_TRACKER'
  | 'BOIL_WATER'
  | 'SYMPTOM_CHECKER'
  | 'HEALTH_STATIONS';

const HEALTH_STATIONS = [
  {
    name: 'Malanday Barangay Health Center',
    address: 'M.H. Del Pilar St., Barangay Malanday, Marikina',
    phone: '(02) 8942-0123 / +63 919 444 1111',
    status: 'OPEN • FREE DOXYCYCLINE AVAILABLE',
    doxyStock: 'In Stock (Free DOH Supply)',
    hours: '24/7 Emergency Triage during Flood State',
  },
  {
    name: 'Tumana Barangay Clinic & Birthing Facility',
    address: 'Near Tumana Barangay Hall, Farmers Ave.',
    phone: '(02) 8941-5522 / +63 918 555 2222',
    status: 'OPEN • PROPHYLAXIS DISPENSARY',
    doxyStock: 'In Stock (Free DOH Supply)',
    hours: '8:00 AM - 8:00 PM',
  },
  {
    name: 'Amang Rodriguez Memorial Medical Center (ER)',
    address: 'Sumulong Highway, Marikina City (Tertiary Hospital)',
    phone: '(02) 8941-5854 (ER Hotlines)',
    status: 'OPEN 24/7 LEVEL 3 HOSPITAL ER',
    doxyStock: 'Full IV & Oral Antibiotic Inventory',
    hours: '24/7 Level 3 Trauma & Critical Care',
  },
  {
    name: 'Concepcion Uno Health Station',
    address: 'J. Molina St., Barangay Concepcion Uno',
    phone: '(02) 8941-7788',
    status: 'OPEN • OUTPATIENT DISPENSARY',
    doxyStock: 'In Stock (Oral Capsules)',
    hours: '8:00 AM - 5:00 PM',
  },
];

export const DiseaseOutbreakWatchModal: React.FC<DiseaseOutbreakWatchModalProps> = ({
  isOpen = true,
  onClose,
  isInline = false,
  initialTab = 'ADVISORIES',
  onAdvisoryCreated,
}) => {
  const { currentUser } = useAuth();
  const isCoordinator = currentUser.role === 'COORDINATOR';
  const [activeTab, setActiveTab] = useState<HealthTab>(initialTab);
  const [exposures, setExposures] = useState<FloodExposureRecord[]>([]);
  const [advisories, setAdvisories] = useState<OutbreakAdvisory[]>([]);

  // Coordinator Advisory Posting State
  const [isPostingAdvisory, setIsPostingAdvisory] = useState(false);
  const [advisoryTitle, setAdvisoryTitle] = useState('');
  const [advisoryType, setAdvisoryType] = useState<OutbreakAdvisoryType>('BOIL_WATER');
  const [advisorySeverity, setAdvisorySeverity] = useState<OutbreakSeverity>('WARNING');
  const [advisoryAreas, setAdvisoryAreas] = useState('Purok 1 Malanday, Purok 3 Malanday Riverside, Tumana');
  const [waterSource, setWaterSource] = useState('Secondary Pipeline & Submerged Ground Wells');
  const [boilMinutes, setBoilMinutes] = useState(3);
  const [clinicSites, setClinicSites] = useState('Malanday Barangay Health Center, Tumana Clinic');
  const [advisoryGuidance, setAdvisoryGuidance] = useState('');
  const [isSubmittingAdvisory, setIsSubmittingAdvisory] = useState(false);

  // Log Exposure Form State
  const [exposureHoursAgo, setExposureHoursAgo] = useState<number>(6);
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [waterDepth, setWaterDepth] = useState<FloodExposureRecord['waterDepth']>('KNEE');
  const [hasOpenWounds, setHasOpenWounds] = useState<boolean>(true);
  const [exposureNotes, setExposureNotes] = useState<string>('');
  const [isLogging, setIsLogging] = useState(false);

  // Symptom Checker State
  const [selectedSymptoms, setSelectedSymptoms] = useState<Record<string, boolean>>({});

  const loadExposures = async () => {
    try {
      const records = await OutbreakWatchRepository.getExposureRecords();
      setExposures(records);
    } catch (e) {
      console.warn('Failed to load exposure records:', e);
    }
  };

  const loadAdvisories = async () => {
    try {
      const advs = await OutbreakWatchRepository.getAdvisories();
      setAdvisories(advs);
    } catch (e) {
      console.warn('Failed to load outbreak advisories:', e);
    }
  };

  useEffect(() => {
    if (isOpen || isInline) {
      loadExposures();
      loadAdvisories();
      setIsLogging(false);
      setIsPostingAdvisory(false);
    }
  }, [isOpen, isInline]);

  const handleCreateAdvisory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCoordinator) {
      alert('RBAC Violation: Outbreak Watch advisories can only be posted by authorized Disaster Coordinators.');
      return;
    }
    if (!advisoryTitle.trim() || !advisoryGuidance.trim()) return;

    setIsSubmittingAdvisory(true);
    try {
      await OutbreakWatchRepository.createAdvisory(
        {
          title: advisoryTitle.trim(),
          type: advisoryType,
          severity: advisorySeverity,
          affectedAreas: advisoryAreas.split(',').map((s) => s.trim()).filter(Boolean),
          waterSource: waterSource.trim() || undefined,
          boilDurationMinutes: advisoryType === 'BOIL_WATER' ? Number(boilMinutes) : undefined,
          clinicDispensingSites: clinicSites.split(',').map((s) => s.trim()).filter(Boolean),
          guidance: advisoryGuidance.trim(),
          issuedByCoordinatorId: currentUser.id,
          issuedByName: currentUser.name,
        },
        currentUser
      );

      await loadAdvisories();
      setIsPostingAdvisory(false);
      setAdvisoryTitle('');
      setAdvisoryGuidance('');
      if (onAdvisoryCreated) onAdvisoryCreated();
    } catch (err: any) {
      console.warn('Failed to create advisory:', err);
      alert(err?.message || 'Failed to post advisory');
    } finally {
      setIsSubmittingAdvisory(false);
    }
  };

  const handleToggleAdvisory = async (id: string, currentActive: boolean) => {
    if (!isCoordinator) {
      alert('RBAC Violation: Only coordinators can update or resolve outbreak watch advisories.');
      return;
    }
    try {
      await OutbreakWatchRepository.toggleAdvisoryStatus(id, currentUser, !currentActive);
      await loadAdvisories();
      if (onAdvisoryCreated) onAdvisoryCreated();
    } catch (err: any) {
      alert(err?.message || 'Failed to update advisory');
    }
  };

  const handleLogExposure = async (e: React.FormEvent) => {
    e.preventDefault();
    const exposureDate = new Date(Date.now() - exposureHoursAgo * 3600000).toISOString();

    await OutbreakWatchRepository.logFloodExposure({
      userId: currentUser.id,
      userName: currentUser.name,
      exposureTimestamp: exposureDate,
      wadingDurationMinutes: Number(durationMinutes),
      waterDepth,
      hasOpenWounds,
      takenProphylaxis: false,
      notes: exposureNotes.trim() || undefined,
    });

    await loadExposures();
    setIsLogging(false);
    setExposureNotes('');
  };

  const handleToggleProphylaxis = async (recordId: string, currentStatus: boolean) => {
    await OutbreakWatchRepository.markProphylaxisTaken(recordId, !currentStatus);
    await loadExposures();
  };

  const toggleSymptom = (key: string) => {
    setSelectedSymptoms((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Symptom Evaluation
  const hasLeptoKeySymptoms =
    (selectedSymptoms.fever && selectedSymptoms.calf_pain) ||
    (selectedSymptoms.fever && selectedSymptoms.red_eyes) ||
    selectedSymptoms.dark_urine;

  const hasCholeraKeySymptoms =
    (selectedSymptoms.watery_diarrhea && selectedSymptoms.vomiting) ||
    selectedSymptoms.severe_dehydration;

  if (!isInline && !isOpen) return null;

  const activeAdvisoriesCount = advisories.filter((a) => a.isActive).length;

  const modalBody = (
    <div
      className={`bg-white rounded-2xl border border-neutral-200/80 shadow-2xs flex flex-col ${
        isInline ? 'w-full min-h-[700px]' : 'max-w-4xl w-full max-h-[92vh] overflow-hidden'
      }`}
    >
      {/* Header */}
      <div className="p-4 sm:p-5 bg-neutral-900 text-white flex items-center justify-between border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-2xl bg-amber-500 text-neutral-950 flex items-center justify-center shadow-xs">
            <Stethoscope className="w-5 h-5 text-neutral-950" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 id="outbreak-title" className="text-base sm:text-lg font-black tracking-tight font-sans">
                BOIL WATER & DISEASE OUTBREAK WATCH
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-amber-400 text-neutral-950">
                Leptospirosis & Cholera
              </span>
              {isCoordinator ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Coordinator Authority Active
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-neutral-800 text-neutral-300">
                  Read-Only ({currentUser.role})
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-300">
              Post-flood disease surveillance, 72-hr Doxycycline countdown, and water sanitation protocols
            </p>
          </div>
        </div>

        {!isInline && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-2.5 rounded-full hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors"
            aria-label="Close health watch modal"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1.5 p-2 bg-neutral-100 border-b border-neutral-200 overflow-x-auto text-xs font-mono font-bold">
        <button
          type="button"
          onClick={() => setActiveTab('ADVISORIES')}
          className={`px-3 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'ADVISORIES'
              ? 'bg-white text-neutral-950 shadow-xs'
              : 'text-neutral-600 hover:text-neutral-950'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
          <span>Health Bulletins & Advisories ({activeAdvisoriesCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('EXPOSURE_TRACKER')}
          className={`px-3 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'EXPOSURE_TRACKER'
              ? 'bg-white text-neutral-950 shadow-xs'
              : 'text-neutral-600 hover:text-neutral-950'
          }`}
        >
          <Waves className="w-3.5 h-3.5 text-blue-600" />
          <span>Flood Exposure & Doxycycline ({exposures.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('BOIL_WATER')}
          className={`px-3 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'BOIL_WATER'
              ? 'bg-white text-neutral-950 shadow-xs'
              : 'text-neutral-600 hover:text-neutral-950'
          }`}
        >
          <Flame className="w-3.5 h-3.5 text-rose-500" />
          <span>Boil-Water & Chlorine Dosages</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('SYMPTOM_CHECKER')}
          className={`px-3 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'SYMPTOM_CHECKER'
              ? 'bg-white text-neutral-950 shadow-xs'
              : 'text-neutral-600 hover:text-neutral-950'
          }`}
        >
          <Thermometer className="w-3.5 h-3.5 text-amber-500" />
          <span>Symptoms Self-Checker</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('HEALTH_STATIONS')}
          className={`px-3 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'HEALTH_STATIONS'
              ? 'bg-white text-neutral-950 shadow-xs'
              : 'text-neutral-600 hover:text-neutral-950'
          }`}
        >
          <Hospital className="w-3.5 h-3.5 text-emerald-600" />
          <span>Health Centers & Free Clinics</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1 font-sans">
        {/* ======================================================== */}
        {/* 0. OFFICIAL HEALTH DIRECTIVES & OUTBREAK ADVISORIES     */}
        {/* ======================================================== */}
        {activeTab === 'ADVISORIES' && (
          <div className="space-y-4 font-mono text-xs">
            {/* Top Controls: Header info & Coordinator Broadcast Button */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-neutral-50 rounded-2xl border border-neutral-200">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-neutral-900 text-sm">Official CDRRMO Health Bulletins</h3>
                  <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-bold">
                    {activeAdvisoriesCount} Active Directives
                  </span>
                </div>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  Boil-water declarations, floodwater contamination & Leptospirosis surge advisories
                </p>
              </div>

              {/* RBAC Protected: Outbreak Watch posted by Coordinator ONLY */}
              {isCoordinator ? (
                <button
                  type="button"
                  onClick={() => setIsPostingAdvisory(!isPostingAdvisory)}
                  className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isPostingAdvisory ? 'Close Form' : 'Broadcast Health Advisory'}</span>
                </button>
              ) : (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-xs">
                  <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>Official EOC Health Advisories (Coordinator-Issued • Read-Only)</span>
                </div>
              )}
            </div>

            {/* Coordinator Broadcast Advisory Form */}
            {isCoordinator && isPostingAdvisory && (
              <form
                onSubmit={handleCreateAdvisory}
                className="p-4 sm:p-5 rounded-2xl bg-white border-2 border-rose-200 shadow-md space-y-4 animate-in fade-in duration-150"
              >
                <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-rose-600" />
                    <span className="font-bold text-sm text-neutral-900">
                      Issue Official Boil-Water or Outbreak Advisory
                    </span>
                  </div>
                  <span className="text-[10px] uppercase font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded">
                    EOC Directive
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Title */}
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[11px] font-bold text-neutral-700">Directive / Advisory Title *</label>
                    <input
                      type="text"
                      required
                      value={advisoryTitle}
                      onChange={(e) => setAdvisoryTitle(e.target.value)}
                      placeholder="e.g. Malanday Low-Pressure Water Pipeline Boil-Water Directive"
                      className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                    />
                  </div>

                  {/* Advisory Type */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-neutral-700">Health Threat Category *</label>
                    <select
                      value={advisoryType}
                      onChange={(e) => setAdvisoryType(e.target.value as OutbreakAdvisoryType)}
                      className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs bg-white focus:ring-2 focus:ring-rose-500"
                    >
                      <option value="BOIL_WATER">Boil Water Advisory (Water Sanitation)</option>
                      <option value="LEPTOSPIROSIS_SURGE">Leptospirosis Surge Alert (Flood Exposure)</option>
                      <option value="CHOLERA_WARNING">Cholera / Acute Gastroenteritis Warning</option>
                      <option value="FLOOD_CONTAMINATION">Floodwater Chemical / Bio Contamination</option>
                    </select>
                  </div>

                  {/* Severity */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-neutral-700">Severity Level *</label>
                    <select
                      value={advisorySeverity}
                      onChange={(e) => setAdvisorySeverity(e.target.value as OutbreakSeverity)}
                      className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs bg-white focus:ring-2 focus:ring-rose-500"
                    >
                      <option value="CRITICAL">CRITICAL (Immediate boil / prophylaxis mandatory)</option>
                      <option value="WARNING">WARNING (Elevated risk across flooded sectors)</option>
                      <option value="WATCH">WATCH (Precautionary monitoring & advisories)</option>
                    </select>
                  </div>

                  {/* Affected Areas */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-neutral-700">Affected Puroks / Sectors *</label>
                    <input
                      type="text"
                      required
                      value={advisoryAreas}
                      onChange={(e) => setAdvisoryAreas(e.target.value)}
                      placeholder="Comma-separated: Purok 1, Purok 3, Tumana"
                      className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  {/* Water Source */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-neutral-700">Contaminated Source / Origin</label>
                    <input
                      type="text"
                      value={waterSource}
                      onChange={(e) => setWaterSource(e.target.value)}
                      placeholder="e.g. Submerged Shallow Wells & Tap Pipeline Sector 2"
                      className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  {/* Boil Duration */}
                  {advisoryType === 'BOIL_WATER' && (
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-neutral-700">Minimum Rolling Boil Duration (Minutes)</label>
                      <input
                        type="number"
                        min="1"
                        max="15"
                        value={boilMinutes}
                        onChange={(e) => setBoilMinutes(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs focus:ring-2 focus:ring-rose-500"
                      />
                    </div>
                  )}

                  {/* Clinic Dispensing Sites */}
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[11px] font-bold text-neutral-700">Free Prophylaxis / Clinic Dispensing Sites</label>
                    <input
                      type="text"
                      value={clinicSites}
                      onChange={(e) => setClinicSites(e.target.value)}
                      placeholder="Comma-separated: Malanday Barangay Health Center, Tumana Birthing Clinic"
                      className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  {/* Guidance Directive */}
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[11px] font-bold text-neutral-700">Official Directive & Clinical Guidance *</label>
                    <textarea
                      required
                      rows={3}
                      value={advisoryGuidance}
                      onChange={(e) => setAdvisoryGuidance(e.target.value)}
                      placeholder="State precise instructions: boil all water for 3 minutes before ingesting, report wading within 72h to get free Doxycycline, avoid wading without rubber boots..."
                      className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-200">
                  <button
                    type="button"
                    onClick={() => setIsPostingAdvisory(false)}
                    className="px-4 py-2 rounded-xl border border-neutral-300 text-neutral-700 font-bold hover:bg-neutral-100 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingAdvisory}
                    className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition flex items-center gap-1.5 shadow-sm"
                  >
                    <ShieldAlert className="w-4 h-4" />
                    <span>{isSubmittingAdvisory ? 'Broadcasting...' : 'Issue EOC Directive'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* List of Active & Past Advisories */}
            <div className="space-y-3">
              {advisories.map((adv) => {
                const isCritical = adv.severity === 'CRITICAL';
                const isWarning = adv.severity === 'WARNING';
                return (
                  <div
                    key={adv.id}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                      adv.isActive
                        ? isCritical
                          ? 'bg-rose-50/80 border-rose-300 shadow-2xs'
                          : isWarning
                          ? 'bg-amber-50/80 border-amber-300 shadow-2xs'
                          : 'bg-blue-50/80 border-blue-300 shadow-2xs'
                        : 'bg-neutral-50 border-neutral-200 opacity-60'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-black/5">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              adv.isActive
                                ? isCritical
                                  ? 'bg-rose-600 text-white'
                                  : isWarning
                                  ? 'bg-amber-600 text-white'
                                  : 'bg-blue-600 text-white'
                                : 'bg-neutral-400 text-white'
                            }`}
                          >
                            {adv.severity} • {adv.type.replace('_', ' ')}
                          </span>

                          <span className="text-[11px] text-neutral-500">
                            Issued: {new Date(adv.issuedAt).toLocaleString()}
                          </span>

                          {!adv.isActive && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-200 text-neutral-700">
                              RESOLVED / INACTIVE
                            </span>
                          )}
                        </div>

                        <h4 className="font-bold text-sm text-neutral-900 mt-1">{adv.title}</h4>
                      </div>

                      {/* Coordinator Toggle */}
                      {isCoordinator && (
                        <button
                          type="button"
                          onClick={() => handleToggleAdvisory(adv.id, adv.isActive)}
                          className={`px-3 py-1 rounded-lg text-[11px] font-bold transition shrink-0 ${
                            adv.isActive
                              ? 'bg-neutral-200 hover:bg-neutral-300 text-neutral-800'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          }`}
                        >
                          {adv.isActive ? 'Mark Resolved' : 'Reactivate Directive'}
                        </button>
                      )}
                    </div>

                    {/* Directive Details */}
                    <div className="pt-3 space-y-2.5">
                      <p className="text-xs text-neutral-800 leading-relaxed font-sans">{adv.guidance}</p>

                      <div className="flex flex-wrap gap-2 text-[11px]">
                        {adv.waterSource && (
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/80 border border-neutral-200 text-neutral-800">
                            <Droplets className="w-3.5 h-3.5 text-blue-600" />
                            <span>Source: {adv.waterSource}</span>
                          </div>
                        )}

                        {adv.boilDurationMinutes && (
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-100/80 border border-rose-300 text-rose-900 font-bold">
                            <Flame className="w-3.5 h-3.5 text-rose-600" />
                            <span>{adv.boilDurationMinutes} Min Rolling Boil Required</span>
                          </div>
                        )}

                        {adv.affectedAreas && adv.affectedAreas.length > 0 && (
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/80 border border-neutral-200 text-neutral-700">
                            <MapPin className="w-3.5 h-3.5 text-neutral-500" />
                            <span>Sectors: {adv.affectedAreas.join(', ')}</span>
                          </div>
                        )}
                      </div>

                      {adv.clinicDispensingSites && adv.clinicDispensingSites.length > 0 && (
                        <div className="p-2.5 rounded-xl bg-white/60 border border-neutral-200/80 text-[11px] text-neutral-700 flex items-center gap-2">
                          <Hospital className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>
                            <strong>Free DOH Antibiotic Dispensary:</strong> {adv.clinicDispensingSites.join(' • ')}
                          </span>
                        </div>
                      )}

                      <div className="text-[10px] text-neutral-500 pt-1">
                        Official Authority: <strong>{adv.issuedByName}</strong> (Incident Command Post)
                      </div>
                    </div>
                  </div>
                );
              })}

              {advisories.length === 0 && (
                <div className="p-8 text-center bg-neutral-50 rounded-2xl border border-neutral-200 space-y-2">
                  <ShieldCheck className="w-8 h-8 text-emerald-600 mx-auto" />
                  <p className="text-xs text-neutral-600">No active health directives posted.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 1. FLOOD EXPOSURE & DOXYCYCLINE COUNTDOWN */}
        {activeTab === 'EXPOSURE_TRACKER' && (
          <div className="space-y-4 font-mono text-xs">
              {/* Top Banner with DOH Clinical Guidance */}
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 space-y-2">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
                  <span className="font-bold uppercase text-[11px] tracking-wider">
                    DOH Leptospirosis Prophylaxis Advisory
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-amber-900">
                  Anyone who waded in contaminated Marikina floodwaters must take prophylactic Doxycycline
                  within <strong className="underline">24 to 72 hours</strong> to prevent severe Leptospirosis.
                  Free capsules are distributed at Barangay Malanday & Tumana Health Centers.
                </p>
                <p className="text-[10px] text-amber-800 italic">
                  * Clinical Disclaimer: Consult a registered barangay physician or nurse before starting. Not recommended for pregnant women, lactating mothers, or children under 8 years old.
                </p>
              </div>

              {/* Action Button: Log Flood Exposure */}
              <div className="flex items-center justify-between">
                <span className="font-bold text-neutral-700 uppercase tracking-wider">
                  Logged Flood Exposures ({exposures.length})
                </span>
                <button
                  type="button"
                  onClick={() => setIsLogging(!isLogging)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-900 text-white font-bold text-xs hover:bg-neutral-800 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>LOG NEW FLOODWATER CONTACT</span>
                </button>
              </div>

              {/* Form: Log Exposure */}
              {isLogging && (
                <form onSubmit={handleLogExposure} className="p-4 rounded-2xl bg-neutral-50 border border-neutral-300 space-y-3">
                  <div className="font-bold text-neutral-900 uppercase border-b pb-2">
                    Record When & Where You Waded
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-neutral-700 font-bold mb-1">When did you wade?</label>
                      <select
                        value={exposureHoursAgo}
                        onChange={(e) => setExposureHoursAgo(Number(e.target.value))}
                        className="w-full p-2 rounded-xl border border-neutral-300 bg-white text-xs"
                      >
                        <option value={2}>2 hours ago (Today)</option>
                        <option value={6}>6 hours ago (Today)</option>
                        <option value={12}>12 hours ago</option>
                        <option value={24}>24 hours ago (Yesterday)</option>
                        <option value={48}>48 hours ago (2 days ago)</option>
                        <option value={60}>60 hours ago</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-neutral-700 font-bold mb-1">Wading Duration</label>
                      <select
                        value={durationMinutes}
                        onChange={(e) => setDurationMinutes(Number(e.target.value))}
                        className="w-full p-2 rounded-xl border border-neutral-300 bg-white text-xs"
                      >
                        <option value={15}>15 minutes or less</option>
                        <option value={45}>30 to 60 minutes</option>
                        <option value={120}>Over 1 hour</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-neutral-700 font-bold mb-1">Water Depth</label>
                      <select
                        value={waterDepth}
                        onChange={(e) => setWaterDepth(e.target.value as any)}
                        className="w-full p-2 rounded-xl border border-neutral-300 bg-white text-xs"
                      >
                        <option value="ANKLE">Ankle deep (&lt;1 foot)</option>
                        <option value="KNEE">Knee deep (1-2 feet)</option>
                        <option value="WAIST_OR_DEEPER">Waist deep or higher</option>
                      </select>
                    </div>
                  </div>

                  {/* Open Wounds Checkbox */}
                  <div className="p-3 rounded-xl bg-white border border-neutral-200 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-neutral-900 block">
                        Do you have open wounds, scratches, or insect bites on feet or legs?
                      </span>
                      <span className="text-[11px] text-neutral-500">
                        Broken skin drastically increases Leptospira bacteria penetration.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setHasOpenWounds(!hasOpenWounds)}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs ${
                        hasOpenWounds ? 'bg-rose-600 text-white' : 'bg-neutral-200 text-neutral-700'
                      }`}
                    >
                      {hasOpenWounds ? 'YES (HIGH RISK)' : 'NO (INTACT SKIN)'}
                    </button>
                  </div>

                  <div>
                    <label className="block text-neutral-700 font-bold mb-1">Incident Notes (Optional)</label>
                    <input
                      type="text"
                      value={exposureNotes}
                      onChange={(e) => setExposureNotes(e.target.value)}
                      placeholder="e.g. Scraped leg against submerged galvanized iron roof while rescuing pets"
                      className="w-full p-2.5 rounded-xl border border-neutral-300 bg-white text-xs"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsLogging(false)}
                      className="px-4 py-2 rounded-xl border border-neutral-300 font-bold hover:bg-neutral-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold"
                    >
                      CALCULATE WINDOW & LOG
                    </button>
                  </div>
                </form>
              )}

              {/* Exposure Records Cards with Countdown */}
              <div className="space-y-3">
                {exposures.map((r) => {
                  const guidance = OutbreakWatchRepository.calculateLeptospirosisGuidance(
                    r.exposureTimestamp,
                    r.hasOpenWounds
                  );

                  return (
                    <div
                      key={r.id}
                      className={`p-4 rounded-2xl border-2 space-y-3 bg-white shadow-xs ${
                        guidance.isWithinWindow
                          ? 'border-amber-300'
                          : 'border-neutral-200 opacity-80'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 pb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                r.hasOpenWounds
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {r.hasOpenWounds ? 'HIGH RISK (WOUNDS PRESENT)' : 'LOW RISK (INTACT SKIN)'}
                            </span>
                            <span className="text-neutral-500 text-xs">
                              {new Date(r.exposureTimestamp).toLocaleDateString()} at{' '}
                              {new Date(r.exposureTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-sm font-bold text-neutral-900 mt-0.5">
                            {r.userName} · Waded {r.wadingDurationMinutes} mins in {r.waterDepth} deep floodwater
                          </p>
                        </div>

                        {/* 72-Hour Countdown Clock */}
                        <div className="p-2.5 rounded-xl bg-neutral-900 text-white text-center shrink-0 min-w-[130px]">
                          <span className="text-[9px] uppercase tracking-wider text-amber-400 block font-bold">
                            WINDOW REMAINING
                          </span>
                          <span className="text-base font-black text-white">
                            {guidance.hoursRemaining} HOURS LEFT
                          </span>
                        </div>
                      </div>

                      {/* DOH Dosage Recommendation */}
                      <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 text-xs leading-relaxed text-neutral-800">
                        <strong className="block text-neutral-900 uppercase text-[10px] mb-0.5">
                          DOH Recommended Protocol:
                        </strong>
                        {guidance.recommendation}
                      </div>

                      {/* Prophylaxis Taken Action */}
                      <div className="flex items-center justify-between pt-1">
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-neutral-800">
                          <input
                            type="checkbox"
                            checked={r.takenProphylaxis}
                            onChange={() => handleToggleProphylaxis(r.id, r.takenProphylaxis)}
                            className="w-4 h-4 rounded accent-emerald-600"
                          />
                          <span>
                            {r.takenProphylaxis
                              ? `Doxycycline Taken on ${new Date(r.takenAt || '').toLocaleDateString()}`
                              : 'Mark as Taken (Acquired from Health Center)'}
                          </span>
                        </label>

                        {r.takenProphylaxis && (
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            PROTECTION INITIATED ✓
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}

                {exposures.length === 0 && (
                  <div className="p-8 text-center bg-neutral-50 rounded-2xl border border-neutral-200 space-y-2">
                    <Waves className="w-8 h-8 text-neutral-400 mx-auto" />
                    <p className="text-neutral-600">No floodwater contact recorded yet.</p>
                    <button
                      type="button"
                      onClick={() => setIsLogging(true)}
                      className="text-xs font-bold text-rose-600 hover:underline"
                    >
                      + Log flood exposure to calculate 72-hr Doxycycline countdown
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 2. BOIL-WATER ADVISORIES & DISINFECTION */}
          {activeTab === 'BOIL_WATER' && (
            <div className="space-y-4 font-mono text-xs">
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-950 space-y-2">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-rose-600 shrink-0" />
                  <span className="font-bold uppercase text-[11px] tracking-wider">
                    Official Municipal Boil Water Advisory
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-rose-900">
                  Flood runoff contaminates potable pipelines and shallow groundwater wells with E. coli and Vibrio cholerae.
                  All tap water, well water, and refilled containers must be brought to a{' '}
                  <strong className="underline">vigorous rolling boil for 1 to 3 minutes</strong> before drinking or food prep.
                </p>
              </div>

              {/* Household Bleach Chlorine Table */}
              <div className="p-4 rounded-2xl bg-white border border-neutral-200 shadow-2xs space-y-3">
                <div className="flex items-center gap-2 border-b pb-2">
                  <Droplets className="w-4 h-4 text-blue-600" />
                  <h3 className="font-bold text-sm text-neutral-900 uppercase">
                    Household Chlorine Disinfection (Emergency Table)
                  </h3>
                </div>
                <p className="text-neutral-600 text-[11px]">
                  If firewood or cooking gas is unavailable, use standard regular unscented 5% household bleach (e.g. Zonrox/Chlorox without scent):
                </p>

                <div className="border border-neutral-200 rounded-xl overflow-hidden divide-y divide-neutral-200 text-xs">
                  <div className="grid grid-cols-3 bg-neutral-100 p-2.5 font-bold uppercase text-neutral-700 text-[11px]">
                    <div>Water Volume</div>
                    <div>Clear Water Dosage</div>
                    <div>Cloudy/Murky Water</div>
                  </div>
                  <div className="grid grid-cols-3 p-2.5">
                    <div className="font-bold">1 Liter (Bottle)</div>
                    <div>2 drops (0.1 mL)</div>
                    <div className="text-rose-700 font-bold">4 drops (Filter first)</div>
                  </div>
                  <div className="grid grid-cols-3 p-2.5 bg-neutral-50">
                    <div className="font-bold">1 Gallon (3.8 L)</div>
                    <div>8 drops</div>
                    <div className="text-rose-700 font-bold">16 drops</div>
                  </div>
                  <div className="grid grid-cols-3 p-2.5">
                    <div className="font-bold">5 Gallons (Blue Container)</div>
                    <div>1/2 teaspoon (2.5 mL)</div>
                    <div className="text-rose-700 font-bold">1 full teaspoon (5 mL)</div>
                  </div>
                  <div className="grid grid-cols-3 p-2.5 bg-neutral-50">
                    <div className="font-bold">200-Liter Drum (Tambol)</div>
                    <div>5 tablespoons (75 mL)</div>
                    <div className="text-rose-700 font-bold">10 tablespoons</div>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-[11px]">
                  <strong>CRITICAL INSTRUCTION:</strong> Stir thoroughly and allow water to stand for{' '}
                  <strong className="underline">at least 30 minutes</strong> before drinking. The water should have a slight chlorine scent. Store in covered containers.
                </div>
              </div>
            </div>
          )}

          {/* 3. SYMPTOMS SELF-CHECKER */}
          {activeTab === 'SYMPTOM_CHECKER' && (
            <div className="space-y-4 font-mono text-xs">
              <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-2">
                <span className="font-bold text-neutral-900 uppercase block">
                  Select Any Symptoms Experienced Since Flooding:
                </span>
                <p className="text-[11px] text-neutral-500">
                  Resilia will triage your signs against Leptospirosis and acute waterborne gastroenteritis / Cholera protocols.
                </p>
              </div>

              {/* Symptoms Checklist */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  { key: 'fever', label: 'High Sudden Fever (38.5°C+)', desc: 'Leptospirosis / Infection indicator' },
                  { key: 'calf_pain', label: 'Severe Calf Muscle Pain', desc: 'Hallmark early sign of Leptospirosis' },
                  { key: 'red_eyes', label: 'Bloodshot Red Eyes (No pus)', desc: 'Conjunctival suffusion' },
                  { key: 'dark_urine', label: 'Dark Tea-Colored Urine / Low Output', desc: 'Kidney involvement' },
                  { key: 'watery_diarrhea', label: 'Frequent Watery Diarrhea', desc: 'Rice-water stools' },
                  { key: 'vomiting', label: 'Persistent Vomiting & Nausea', desc: 'Dehydration risk' },
                  { key: 'severe_dehydration', label: 'Extreme Thirst / Sunken Eyes', desc: 'Hypovolemic shock risk' },
                ].map((s) => {
                  const isChecked = !!selectedSymptoms[s.key];
                  return (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => toggleSymptom(s.key)}
                      className={`p-3 rounded-xl border text-left flex items-start justify-between transition-all ${
                        isChecked
                          ? 'bg-rose-50 border-rose-400 text-rose-950 shadow-xs'
                          : 'bg-white border-neutral-200 text-neutral-700 hover:border-neutral-300'
                      }`}
                    >
                      <div>
                        <span className="font-bold block text-xs">{s.label}</span>
                        <span className="text-[10px] text-neutral-500">{s.desc}</span>
                      </div>
                      <span
                        className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 ${
                          isChecked ? 'bg-rose-600 border-rose-600 text-white' : 'border-neutral-300'
                        }`}
                      >
                        {isChecked && '✓'}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Evaluation Outcome Box */}
              {hasLeptoKeySymptoms || hasCholeraKeySymptoms ? (
                <div className="p-4 rounded-2xl bg-rose-600 text-white space-y-2 shadow-lg animate-pulse">
                  <div className="flex items-center gap-2">
                    <AlertOctagon className="w-5 h-5 text-white" />
                    <span className="font-black text-sm uppercase">
                      URGENT MEDICAL ATTENTION REQUIRED
                    </span>
                  </div>
                  <p className="text-xs text-rose-100 leading-relaxed">
                    {hasLeptoKeySymptoms &&
                      'Your reported signs (High Fever + Calf Muscle Pain + Red Eyes) strongly match clinical criteria for active LEPTOSPIROSIS. '}
                    {hasCholeraKeySymptoms &&
                      'Your reported gastrointestinal signs match ACUTE CHOLERA / DEHYDRATION. '}
                    Proceed immediately to Amang Rodriguez Memorial Hospital ER or Malanday Barangay Health Center. Do NOT self-medicate with painkillers.
                  </p>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs">
                  No red-flag acute Leptospirosis or Cholera clusters detected yet. Continue monitoring daily for 14 days post-floodwater contact.
                </div>
              )}
            </div>
          )}

          {/* 4. HEALTH CENTERS DIRECTORY */}
          {activeTab === 'HEALTH_STATIONS' && (
            <div className="space-y-3 font-mono text-xs">
              <div className="text-neutral-500 text-xs px-1">
                DESIGNATED BARANGAY CLINICS & FREE DOXYCYCLINE STATIONS
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {HEALTH_STATIONS.map((st, i) => (
                  <div key={i} className="p-4 rounded-2xl border border-neutral-200 bg-white shadow-2xs space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-sm text-neutral-900 leading-snug">{st.name}</h4>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 shrink-0">
                        OPEN
                      </span>
                    </div>

                    <div className="text-xs text-neutral-600 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        <span className="truncate">{st.address}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Pill className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="text-emerald-800 font-bold">{st.doxyStock}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-xs">
                      <span className="text-neutral-400 text-[11px]">{st.hours}</span>
                      <a href={`tel:${st.phone.split('/')[0].trim()}`} className="text-emerald-700 font-bold underline">
                        Call Center
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
  );

  if (isInline) {
    return modalBody;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="outbreak-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
    >
      {modalBody}
    </div>
  );
};
