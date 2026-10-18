/**
 * Responder Field Triage & Scannable QR Wristband Manager
 *
 * Implements standardized START (Simple Triage and Rapid Treatment) protocol:
 * 1. IMMEDIATE (Red) - Critical, life-threatening, immediate evacuation
 * 2. DELAYED (Yellow) - Serious injuries, stable vitals, transport can wait
 * 3. MINOR (Green) - Walking wounded, localized minor injuries
 * 4. EXPECTANT (Black) - Unsalvageable or deceased in current resource constraints
 *
 * Generates offline-scannable QR wristband tags with 1D Code 39 barcode backup.
 */

import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Copy,
  Filter,
  Heart,
  HeartPulse,
  Hospital,
  MapPin,
  Plus,
  QrCode,
  Search,
  ShieldAlert,
  User,
  Users,
  X,
} from 'lucide-react';
import { TriageCategory, TriageRecord, User as UserType } from '../../types';
import { TriageRepository } from '../../services/repositories';
import { QRCodeSVG, BarcodeSVG } from '../../utils/qrCode';
import { useAuth } from '../../services/auth/authContext';

interface FieldTriageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTriageUpdated?: () => void;
}

export const FieldTriageModal: React.FC<FieldTriageModalProps> = ({
  isOpen,
  onClose,
  onTriageUpdated,
}) => {
  const { currentUser } = useAuth();
  const [records, setRecords] = useState<TriageRecord[]>([]);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<TriageCategory | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<TriageRecord | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // START Protocol Form State
  const [victimName, setVictimName] = useState('');
  const [approxAgeGroup, setApproxAgeGroup] = useState<TriageRecord['approxAgeGroup']>('ADULT');
  const [gender, setGender] = useState<TriageRecord['gender']>('UNKNOWN');
  const [canWalk, setCanWalk] = useState(false);
  const [spontaneousBreathing, setSpontaneousBreathing] = useState(true);
  const [respiratoryRate, setRespiratoryRate] = useState<number>(24);
  const [radialPulsePresent, setRadialPulsePresent] = useState(true);
  const [capillaryRefill, setCapillaryRefill] = useState<number>(1.5);
  const [mentalStatus, setMentalStatus] = useState<TriageRecord['mentalStatus']>('FOLLOWS_COMMANDS');
  const [avpuScore, setAvpuScore] = useState<TriageRecord['avpuScore']>('ALERT');
  const [injuriesDescription, setInjuriesDescription] = useState('');
  const [destinationFacility, setDestinationFacility] = useState('Malanday Elementary Evacuation Center');
  const [manualCategoryOverride, setManualCategoryOverride] = useState<TriageCategory | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Load records from repository
  const loadRecords = async () => {
    try {
      const all = await TriageRepository.getAll();
      setRecords(all);
    } catch (e) {
      console.warn('Failed to load triage records:', e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadRecords();
    }
  }, [isOpen]);

  // Compute calculated START triage code dynamically
  const calculatedCategory: TriageCategory = React.useMemo(() => {
    if (manualCategoryOverride) return manualCategoryOverride;
    return TriageRepository.evaluateSTARTTriage({
      canWalk,
      spontaneousBreathing,
      respiratoryRateBpm: respiratoryRate,
      radialPulsePresent,
      capillaryRefillSeconds: capillaryRefill,
      mentalStatus,
      avpuScore,
    });
  }, [
    manualCategoryOverride,
    canWalk,
    spontaneousBreathing,
    respiratoryRate,
    radialPulsePresent,
    capillaryRefill,
    mentalStatus,
    avpuScore,
  ]);

  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    const tagCode = TriageRepository.generateWristbandCode();
    const name = victimName.trim() || `Unidentified ${gender !== 'UNKNOWN' ? gender : 'Person'} (${approxAgeGroup})`;

    await TriageRepository.createTriageRecord(
      {
        tagCode,
        category: calculatedCategory,
        victimName: name,
        approxAgeGroup,
        gender,
        canWalk,
        spontaneousBreathing,
        respiratoryRateBpm: respiratoryRate,
        radialPulsePresent,
        capillaryRefillSeconds: capillaryRefill,
        mentalStatus,
        avpuScore,
        injuriesDescription: injuriesDescription.trim() || 'Rescued from floodwaters / field triage',
        destinationFacility: destinationFacility.trim(),
        responderId: currentUser.id,
        responderName: currentUser.name,
        locationName: currentUser.locationName || 'Tumana River Basin',
        status: 'FIELD_TRIAGED',
      },
      currentUser
    );

    await loadRecords();
    setIsCreatingNew(false);
    resetForm();
    if (onTriageUpdated) onTriageUpdated();
  };

  const resetForm = () => {
    setVictimName('');
    setApproxAgeGroup('ADULT');
    setGender('UNKNOWN');
    setCanWalk(false);
    setSpontaneousBreathing(true);
    setRespiratoryRate(22);
    setRadialPulsePresent(true);
    setCapillaryRefill(1.5);
    setMentalStatus('FOLLOWS_COMMANDS');
    setAvpuScore('ALERT');
    setInjuriesDescription('');
    setManualCategoryOverride(null);
  };

  const handleStatusTransition = async (record: TriageRecord, nextStatus: TriageRecord['status']) => {
    await TriageRepository.updateStatus(record.id, nextStatus, currentUser);
    await loadRecords();
    if (selectedRecord?.id === record.id) {
      const updated = await TriageRepository.getByTagCode(record.tagCode);
      if (updated) setSelectedRecord(updated);
    }
    if (onTriageUpdated) onTriageUpdated();
  };

  const filteredRecords = records.filter((r) => {
    if (activeCategoryFilter !== 'ALL' && r.category !== activeCategoryFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        r.tagCode.toLowerCase().includes(q) ||
        r.victimName.toLowerCase().includes(q) ||
        r.locationName.toLowerCase().includes(q) ||
        (r.destinationFacility && r.destinationFacility.toLowerCase().includes(q))
      );
    }
    return true;
  });

  if (!isOpen) return null;

  const categoryColor = (cat: TriageCategory) => {
    switch (cat) {
      case 'IMMEDIATE':
        return {
          bg: 'bg-rose-600',
          badge: 'bg-rose-50 text-rose-700 border-rose-300',
          dot: 'bg-rose-500',
          tag: 'RED TAG • IMMEDIATE (Priority 1)',
        };
      case 'DELAYED':
        return {
          bg: 'bg-amber-500',
          badge: 'bg-amber-50 text-amber-800 border-amber-300',
          dot: 'bg-amber-400',
          tag: 'YELLOW TAG • DELAYED (Priority 2)',
        };
      case 'MINOR':
        return {
          bg: 'bg-emerald-600',
          badge: 'bg-emerald-50 text-emerald-800 border-emerald-300',
          dot: 'bg-emerald-500',
          tag: 'GREEN TAG • MINOR (Priority 3)',
        };
      case 'EXPECTANT':
        return {
          bg: 'bg-neutral-900',
          badge: 'bg-neutral-100 text-neutral-900 border-neutral-400',
          dot: 'bg-neutral-900',
          tag: 'BLACK TAG • EXPECTANT / DECEASED',
        };
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="triage-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
    >
      <div className="bg-white rounded-3xl max-w-4xl w-full border border-neutral-200 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-neutral-900 text-white flex items-center justify-between border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-xs">
              <HeartPulse className="w-5 h-5 animate-pulse" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="triage-title" className="text-lg font-black tracking-tight font-sans">
                  FIELD TRIAGE & QR WRISTBANDS
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-white/20 text-white">
                  START Protocol
                </span>
              </div>
              <p className="text-xs text-neutral-300 mt-0.5">
                Standardized disaster victim tags & scannable emergency wristband tracking
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2.5 rounded-full hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors"
            aria-label="Close triage modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Top Actions: Category tabs + "+ New Triage Tag" button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-neutral-100 rounded-xl text-xs font-mono font-bold">
              {(['ALL', 'IMMEDIATE', 'DELAYED', 'MINOR', 'EXPECTANT'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setActiveCategoryFilter(cat);
                    setIsCreatingNew(false);
                  }}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    activeCategoryFilter === cat && !isCreatingNew
                      ? 'bg-white text-neutral-900 shadow-xs'
                      : 'text-neutral-600 hover:text-neutral-950'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                setIsCreatingNew(true);
                setSelectedRecord(null);
              }}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-mono text-xs font-bold transition-transform active:scale-95 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>ISSUE FIELD TRIAGE TAG</span>
            </button>
          </div>

          {/* Form: Issue New Triage Tag */}
          {isCreatingNew ? (
            <form onSubmit={handleCreateRecord} className="p-5 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-5">
              <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-600" />
                  <h3 className="font-bold text-sm text-neutral-900 font-mono uppercase">
                    New START Triage Assessment
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreatingNew(false)}
                  className="text-xs font-mono text-neutral-500 hover:text-neutral-800"
                >
                  Cancel
                </button>
              </div>

              {/* Patient Basic Profile */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-mono font-bold text-neutral-700 uppercase mb-1">
                    Victim Name / Alias
                  </label>
                  <input
                    type="text"
                    value={victimName}
                    onChange={(e) => setVictimName(e.target.value)}
                    placeholder="Leave blank if unidentified"
                    className="w-full p-2.5 rounded-xl border border-neutral-300 text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-neutral-700 uppercase mb-1">
                    Age Group
                  </label>
                  <select
                    value={approxAgeGroup}
                    onChange={(e) => setApproxAgeGroup(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-neutral-300 text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="INFANT">Infant (&lt;1 yr)</option>
                    <option value="CHILD">Child (1-12 yrs)</option>
                    <option value="ADULT">Adult (13-59 yrs)</option>
                    <option value="ELDERLY">Elderly / Senior (60+ yrs)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-neutral-700 uppercase mb-1">
                    Gender
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-neutral-300 text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="UNKNOWN">Unknown / Unidentified</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              {/* START Decision Tree Assessment Questions */}
              <div className="p-4 rounded-xl bg-white border border-neutral-200 space-y-3 font-mono text-xs">
                <div className="font-bold text-neutral-900 uppercase border-b border-neutral-100 pb-1.5 flex items-center justify-between">
                  <span>1. Standard START Algorithm Checks</span>
                  <span className="text-[11px] text-neutral-500">Auto-evaluates category</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Can walk */}
                  <div className="flex items-center justify-between p-2.5 rounded-lg border border-neutral-200 bg-neutral-50">
                    <div>
                      <span className="font-bold block">Can victim walk?</span>
                      <span className="text-[10px] text-neutral-500">Ambulatory walking wounded</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCanWalk(!canWalk)}
                      className={`px-3 py-1.5 rounded-md font-bold text-xs ${
                        canWalk ? 'bg-emerald-600 text-white' : 'bg-neutral-200 text-neutral-700'
                      }`}
                    >
                      {canWalk ? 'YES (MINOR)' : 'NO'}
                    </button>
                  </div>

                  {/* Spontaneous breathing */}
                  <div className="flex items-center justify-between p-2.5 rounded-lg border border-neutral-200 bg-neutral-50">
                    <div>
                      <span className="font-bold block">Spontaneous breathing?</span>
                      <span className="text-[10px] text-neutral-500">After opening airway</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSpontaneousBreathing(!spontaneousBreathing)}
                      className={`px-3 py-1.5 rounded-md font-bold text-xs ${
                        spontaneousBreathing ? 'bg-emerald-600 text-white' : 'bg-neutral-900 text-white'
                      }`}
                    >
                      {spontaneousBreathing ? 'YES' : 'NO (BLACK)'}
                    </button>
                  </div>

                  {/* Respiratory rate */}
                  <div className="p-2.5 rounded-lg border border-neutral-200 bg-neutral-50 space-y-1">
                    <div className="flex justify-between">
                      <span className="font-bold">Respiratory Rate (bpm):</span>
                      <span className={`font-bold ${respiratoryRate > 30 ? 'text-rose-600' : 'text-neutral-700'}`}>
                        {respiratoryRate} bpm {respiratoryRate > 30 && '(CRITICAL)'}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="6"
                      max="48"
                      value={respiratoryRate}
                      onChange={(e) => setRespiratoryRate(Number(e.target.value))}
                      className="w-full accent-rose-600"
                    />
                  </div>

                  {/* Perfusion / Radial Pulse */}
                  <div className="flex items-center justify-between p-2.5 rounded-lg border border-neutral-200 bg-neutral-50">
                    <div>
                      <span className="font-bold block">Radial Pulse Present?</span>
                      <span className="text-[10px] text-neutral-500">Capillary refill &lt;2 sec</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setRadialPulsePresent(!radialPulsePresent)}
                      className={`px-3 py-1.5 rounded-md font-bold text-xs ${
                        radialPulsePresent ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                      }`}
                    >
                      {radialPulsePresent ? 'NORMAL PULSE' : 'ABSENT (RED)'}
                    </button>
                  </div>

                  {/* Mental Status */}
                  <div className="p-2.5 rounded-lg border border-neutral-200 bg-neutral-50 space-y-1">
                    <label className="font-bold block">Mental Status / Follows Commands:</label>
                    <select
                      value={mentalStatus}
                      onChange={(e) => setMentalStatus(e.target.value as any)}
                      className="w-full p-1.5 rounded border border-neutral-300 text-xs font-mono bg-white"
                    >
                      <option value="FOLLOWS_COMMANDS">Follows Simple Commands (Normal)</option>
                      <option value="CONFUSED">Confused / Disoriented (IMMEDIATE)</option>
                      <option value="UNRESPONSIVE">Unresponsive (IMMEDIATE)</option>
                    </select>
                  </div>

                  {/* AVPU Scale */}
                  <div className="p-2.5 rounded-lg border border-neutral-200 bg-neutral-50 space-y-1">
                    <label className="font-bold block">AVPU Consciousness:</label>
                    <select
                      value={avpuScore}
                      onChange={(e) => setAvpuScore(e.target.value as any)}
                      className="w-full p-1.5 rounded border border-neutral-300 text-xs font-mono bg-white"
                    >
                      <option value="ALERT">Alert</option>
                      <option value="VERBAL">Responds to Voice</option>
                      <option value="PAIN">Responds to Pain only (IMMEDIATE)</option>
                      <option value="UNRESPONSIVE">Unresponsive (IMMEDIATE)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Dynamic Assessment Result Badge */}
              <div className="p-4 rounded-xl border-2 flex items-center justify-between bg-white shadow-xs">
                <div>
                  <span className="text-[10px] font-mono uppercase text-neutral-500 block">
                    Calculated START Triage Code:
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`w-3.5 h-3.5 rounded-full ${categoryColor(calculatedCategory).bg}`} />
                    <span className="font-black text-base font-mono uppercase tracking-wide">
                      {categoryColor(calculatedCategory).tag}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[11px] font-mono">
                  <span className="text-neutral-500 mr-1">Override:</span>
                  {(['IMMEDIATE', 'DELAYED', 'MINOR', 'EXPECTANT'] as const).map((code) => (
                    <button
                      key={code}
                      type="button"
                      onClick={() => setManualCategoryOverride(code)}
                      className={`px-2 py-1 rounded text-[10px] font-bold border ${
                        calculatedCategory === code
                          ? 'bg-neutral-900 text-white border-neutral-900'
                          : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 border-neutral-200'
                      }`}
                    >
                      {code[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Field Notes & Destination */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono font-bold text-neutral-700 uppercase mb-1">
                    Injuries / Field Assessment Notes
                  </label>
                  <textarea
                    rows={2}
                    value={injuriesDescription}
                    onChange={(e) => setInjuriesDescription(e.target.value)}
                    placeholder="e.g. Roof fall, open fracture, severe bleeding controlled with tourniquet"
                    className="w-full p-2.5 rounded-xl border border-neutral-300 text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-neutral-700 uppercase mb-1">
                    Target Destination Facility
                  </label>
                  <input
                    type="text"
                    value={destinationFacility}
                    onChange={(e) => setDestinationFacility(e.target.value)}
                    placeholder="e.g. Amang Rodriguez ER, Malanday Elementary"
                    className="w-full p-2.5 rounded-xl border border-neutral-300 text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingNew(false)}
                  className="px-4 py-2.5 rounded-xl border border-neutral-300 text-xs font-mono font-bold text-neutral-700 hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-mono text-xs font-bold transition-all shadow-sm"
                >
                  CONFIRM & PRINT QR WRISTBAND
                </button>
              </div>
            </form>
          ) : null}

          {/* Active Triage Wristbands Roster */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-mono text-neutral-500 px-1">
              <span>{filteredRecords.length} FIELD TRIAGED PATIENTS</span>
              <span>Sorted by START priority</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredRecords.map((r) => {
                const conf = categoryColor(r.category);
                const isSelected = selectedRecord?.id === r.id;

                return (
                  <div
                    key={r.id}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden bg-white ${
                      isSelected
                        ? 'border-neutral-900 shadow-md ring-2 ring-neutral-900/10'
                        : 'border-neutral-200 hover:border-neutral-300 shadow-xs'
                    }`}
                    onClick={() => setSelectedRecord(isSelected ? null : r)}
                  >
                    {/* Top Color Accent Ribbon */}
                    <div className={`h-2.5 absolute top-0 inset-x-0 ${conf.bg}`} />

                    <div className="pt-2 flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black border ${conf.badge}`}>
                            {r.category}
                          </span>
                          <span className="font-mono text-xs font-bold text-neutral-600">
                            {r.tagCode}
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-neutral-900 mt-1 leading-snug">
                          {r.victimName}
                        </h4>
                      </div>

                      {/* Small QR Preview */}
                      <div className="shrink-0 p-1 bg-white border border-neutral-200 rounded-lg shadow-2xs">
                        <QRCodeSVG value={r.tagCode} size={44} />
                      </div>
                    </div>

                    <div className="mt-2.5 text-xs font-mono text-neutral-600 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        <span className="truncate">{r.locationName}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Hospital className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        <span className="truncate">{r.destinationFacility || 'Field Staging'}</span>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-neutral-100 flex items-center justify-between text-[11px] font-mono">
                      <span className="px-2 py-0.5 rounded bg-neutral-100 text-neutral-700 font-semibold uppercase">
                        {r.status.replace('_', ' ')}
                      </span>
                      <span className="text-neutral-400">
                        By {r.responderName}
                      </span>
                    </div>

                    {/* Expanded Wristband Details */}
                    {isSelected && (
                      <div className="mt-4 pt-3 border-t-2 border-neutral-200 space-y-3 bg-neutral-50 -mx-4 -mb-4 p-4 rounded-b-xl animate-in fade-in duration-100">
                        <div className="text-center p-3 bg-white rounded-xl border border-neutral-200 shadow-xs space-y-2">
                          <span className="text-[10px] font-mono font-bold uppercase text-neutral-500 tracking-wider">
                            OFFICIAL FIELD WRISTBAND QR & BARCODE
                          </span>
                          <div className="flex justify-center py-1">
                            <QRCodeSVG value={r.tagCode} size={130} />
                          </div>
                          <BarcodeSVG value={r.tagCode} height={36} />
                        </div>

                        <div className="text-xs font-mono space-y-1 bg-white p-3 rounded-xl border border-neutral-200">
                          <div>
                            <span className="text-neutral-400 uppercase text-[10px]">Injuries: </span>
                            <span className="font-semibold text-neutral-900">{r.injuriesDescription}</span>
                          </div>
                          <div>
                            <span className="text-neutral-400 uppercase text-[10px]">Vitals: </span>
                            <span className="font-semibold text-neutral-900">
                              RR: {r.respiratoryRateBpm || 'N/A'} bpm | Pulse:{' '}
                              {r.radialPulsePresent ? 'Present' : 'Absent'} | AVPU: {r.avpuScore}
                            </span>
                          </div>
                        </div>

                        {/* Status Transition Action Buttons */}
                        <div className="space-y-1.5 pt-1">
                          <span className="text-[10px] font-mono uppercase text-neutral-500 font-bold block">
                            Update Transport / Care Status:
                          </span>
                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusTransition(r, 'EN_ROUTE');
                              }}
                              className="py-1.5 px-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-mono text-[10px] font-bold text-center"
                            >
                              EN ROUTE (BOAT/AMB)
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusTransition(r, 'ADMITTED_SHELTER');
                              }}
                              className="py-1.5 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-[10px] font-bold text-center"
                            >
                              ADMITTED SHELTER
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusTransition(r, 'ADMITTED_HOSPITAL');
                              }}
                              className="py-1.5 px-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-mono text-[10px] font-bold text-center"
                            >
                              ADMITTED HOSPITAL
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusTransition(r, 'HANDOVER_COMPLETE');
                              }}
                              className="py-1.5 px-2 rounded-lg bg-neutral-900 hover:bg-black text-white font-mono text-[10px] font-bold text-center"
                            >
                              HANDOVER COMPLETE
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {filteredRecords.length === 0 && (
              <div className="p-8 text-center bg-neutral-50 rounded-2xl border border-neutral-200 space-y-2">
                <HeartPulse className="w-8 h-8 text-neutral-400 mx-auto" />
                <p className="text-sm font-mono text-neutral-600">
                  No active triage records matching current filter.
                </p>
                <button
                  type="button"
                  onClick={() => setIsCreatingNew(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-rose-600 hover:underline pt-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Issue first triage wristband
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
