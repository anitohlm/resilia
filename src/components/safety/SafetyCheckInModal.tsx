import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Heart,
  Home,
  MapPin,
  Phone,
  Search,
  ShieldCheck,
  UserCheck,
  Users,
  X,
  Building2,
  Compass,
  Download,
  Check,
  PhoneCall,
  FileSpreadsheet,
  AlertCircle,
} from 'lucide-react';
import {
  CitizenSafetyStatus,
  SafetyCheckIn,
  safetyCheckInService,
} from '../../services/safety/safetyCheckInService';
import { useAuth } from '../../services/auth/authContext';
import { Shelter } from '../../types';

interface SafetyCheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  shelters?: Shelter[];
  initialTab?: 'CHECK_IN' | 'DIRECTORY';
}

export const SafetyCheckInModal: React.FC<SafetyCheckInModalProps> = ({
  isOpen,
  onClose,
  shelters = [],
  initialTab = 'CHECK_IN',
}) => {
  const { currentUser } = useAuth();
  const isCoordinator = currentUser.role === 'COORDINATOR';
  const [activeTab, setActiveTab] = useState<'CHECK_IN' | 'DIRECTORY'>(
    initialTab || (isCoordinator ? 'DIRECTORY' : 'CHECK_IN')
  );

  // Form state
  const [residentName, setResidentName] = useState(currentUser.name || '');
  const [contactPhone, setContactPhone] = useState(currentUser.phone || '+63 920 555 0303');
  const [status, setStatus] = useState<CitizenSafetyStatus>('SAFE_AT_SHELTER');
  const [currentLocation, setCurrentLocation] = useState(currentUser.locationName || 'Bulelak Gym Sector B');
  const [selectedShelter, setSelectedShelter] = useState<string>('Bulelak Gym Evacuation Center');
  const [familyCount, setFamilyCount] = useState<number>(3);
  const [vulnerableCount, setVulnerableCount] = useState<number>(1);
  const [notes, setNotes] = useState<string>('All accounted for. Phones charged.');

  // Directory state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<CitizenSafetyStatus | 'ALL'>('ALL');
  const [records, setRecords] = useState<SafetyCheckIn[]>([]);
  const [stats, setStats] = useState(safetyCheckInService.getSummaryStats());
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const refreshData = () => {
    setRecords(safetyCheckInService.search(searchQuery, statusFilter));
    setStats(safetyCheckInService.getSummaryStats());
  };

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab || (isCoordinator ? 'DIRECTORY' : 'CHECK_IN'));
      refreshData();
      setSubmittedSuccess(false);
    }
  }, [isOpen, searchQuery, statusFilter, initialTab, isCoordinator]);

  useEffect(() => {
    const handleUpdate = () => refreshData();
    window.addEventListener('resilia_safety_checkin_updated', handleUpdate);
    return () => window.removeEventListener('resilia_safety_checkin_updated', handleUpdate);
  }, [searchQuery, statusFilter]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const entryData = {
      residentName: residentName.trim() || 'Anonymous Resident',
      contactPhone: contactPhone.trim(),
      status,
      currentLocation: currentLocation.trim(),
      shelterName: status === 'SAFE_AT_SHELTER' ? selectedShelter : undefined,
      familyCount: Number(familyCount) || 1,
      vulnerableCount: Number(vulnerableCount) || 0,
      notes: notes.trim(),
      residentId: isCoordinator ? undefined : currentUser.id,
    };
    if (isCoordinator) {
      safetyCheckInService.recordCheckIn(entryData);
    } else {
      await safetyCheckInService.recordResidentCheckIn(entryData, currentUser.id);
    }
    setSubmittedSuccess(true);
    refreshData();
    setTimeout(() => {
      setActiveTab('DIRECTORY');
    }, 1200);
  };

  const handleToggleVerify = (id: string) => {
    safetyCheckInService.toggleVerify(id, currentUser.name || 'Coordinator');
    refreshData();
  };

  const handleExportCsv = () => {
    const csvContent = safetyCheckInService.exportToCsv();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `resilia_welfare_safe_registry_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (st: CitizenSafetyStatus) => {
    switch (st) {
      case 'SAFE_AT_SHELTER':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Building2 className="w-3 h-3" /> Safe at Evacuation Shelter
          </span>
        );
      case 'SAFE_AT_HOME':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider bg-teal-50 text-teal-700 border border-teal-200">
            <Home className="w-3 h-3" /> Safe at Home / Upper Floor
          </span>
        );
      case 'EVACUATING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
            <Compass className="w-3 h-3" /> En Route Evacuation
          </span>
        );
      case 'NEEDS_ASSISTANCE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
            <Heart className="w-3 h-3" /> Safe But Needs Supplies
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-xl max-w-3xl w-full border border-neutral-200 shadow-2xl overflow-hidden my-auto max-h-[94vh] flex flex-col">
        {/* Header */}
        <div className="bg-neutral-900 text-white p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800">
          <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
            <div className="w-9 h-9 rounded-full bg-neutral-800 text-white flex items-center justify-center shadow-2xs shrink-0">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <h3 className="font-semibold text-base sm:text-lg text-white tracking-tight leading-tight">
                  Family Welfare & "I Am Safe" Registry
                </h3>
                {isCoordinator && (
                  <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-mono uppercase font-semibold whitespace-nowrap shrink-0">
                    Coordinator View
                  </span>
                )}
                <span className="px-1.5 py-0.5 rounded bg-white/10 text-neutral-300 text-[10px] font-mono uppercase tracking-wider whitespace-nowrap shrink-0">
                  Offline Synced
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5 leading-normal">
                Authoritative record of citizens who checked in safe across Marikina Sector
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <button
              onClick={handleExportCsv}
              className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white font-medium text-xs transition flex items-center gap-1.5 border border-neutral-700 shrink-0 shadow-2xs"
              title="Download RFC-4180 CSV welfare manifest for shelter desk & Incident Command Post"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 shrink-0" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition shrink-0"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Aggregate Stats Strip */}
        <div className="bg-emerald-50/90 px-4 sm:px-5 py-2.5 border-b border-emerald-100 text-xs flex flex-col md:flex-row md:items-center justify-between gap-2.5 text-emerald-900">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="font-black text-emerald-950 text-sm font-mono">
                {stats.totalPeopleAccounted}
              </span>
              <span className="text-emerald-700 text-[11px] font-semibold">Citizens Accounted</span>
            </div>
            <div className="hidden sm:block h-3.5 w-px bg-emerald-200" />
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="font-black text-emerald-950 text-sm font-mono">{stats.totalCheckIns}</span>
              <span className="text-emerald-700 text-[11px] font-semibold">Households</span>
            </div>
            <div className="hidden sm:block h-3.5 w-px bg-emerald-200" />
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="font-black text-amber-900 text-sm font-mono">{stats.vulnerableCount}</span>
              <span className="text-amber-800 text-[11px] font-semibold">Vulnerable</span>
            </div>
          </div>
          <div className="text-[11px] text-emerald-800 font-medium flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span>Sheltered: <strong>{stats.atShelters}</strong></span>
            <span>• At Home: <strong>{stats.atHome}</strong></span>
            <span>• En Route: <strong>{stats.evacuating}</strong></span>
            <span>• Verified: <strong>{stats.verifiedCount}</strong></span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-neutral-200 bg-neutral-50 px-5 pt-3 gap-2 justify-between items-center">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('DIRECTORY')}
              className={`px-4 py-2 rounded-t-xl text-xs font-bold transition flex items-center gap-2 border-b-2 ${
                activeTab === 'DIRECTORY'
                  ? 'bg-white text-emerald-700 border-emerald-600 shadow-2xs'
                  : 'text-neutral-500 border-transparent hover:text-neutral-800'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>
                {isCoordinator ? 'Safe Citizens Roster' : 'Search Safe Citizens'} ({records.length})
              </span>
            </button>
            <button
              onClick={() => setActiveTab('CHECK_IN')}
              className={`px-4 py-2 rounded-t-xl text-xs font-bold transition flex items-center gap-2 border-b-2 ${
                activeTab === 'CHECK_IN'
                  ? 'bg-white text-emerald-700 border-emerald-600 shadow-2xs'
                  : 'text-neutral-500 border-transparent hover:text-neutral-800'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Mark Myself / Family Safe</span>
            </button>
          </div>

          <span className="text-[11px] text-neutral-400 hidden sm:inline">
            Incident Command Post Welfare Bureau
          </span>
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto flex-1">
          {activeTab === 'CHECK_IN' ? (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs max-w-xl mx-auto">
              {submittedSuccess && (
                <div className="p-3.5 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-900 flex items-center gap-2 animate-in fade-in font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>
                    Your family safety status has been saved and broadcasted to local coordinators and relatives.
                  </span>
                </div>
              )}

              {/* Status Radio Pills */}
              <div>
                <label className="font-bold text-neutral-800 block mb-1.5">
                  Select Your Current Condition
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setStatus('SAFE_AT_SHELTER')}
                    className={`p-3 rounded-2xl border text-left flex items-start gap-2.5 transition ${
                      status === 'SAFE_AT_SHELTER'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-950 ring-1 ring-emerald-400'
                        : 'bg-neutral-50 border-neutral-200 text-neutral-700 hover:bg-white'
                    }`}
                  >
                    <Building2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold">Safe at Shelter</div>
                      <div className="text-[10px] text-neutral-500">In an evacuation center</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatus('SAFE_AT_HOME')}
                    className={`p-3 rounded-2xl border text-left flex items-start gap-2.5 transition ${
                      status === 'SAFE_AT_HOME'
                        ? 'bg-blue-50 border-blue-500 text-blue-950 ring-1 ring-blue-400'
                        : 'bg-neutral-50 border-neutral-200 text-neutral-700 hover:bg-white'
                    }`}
                  >
                    <Home className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold">Safe at Home</div>
                      <div className="text-[10px] text-neutral-500">Sheltering in place / 2nd floor</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatus('EVACUATING')}
                    className={`p-3 rounded-2xl border text-left flex items-start gap-2.5 transition ${
                      status === 'EVACUATING'
                        ? 'bg-amber-50 border-amber-500 text-amber-950 ring-1 ring-amber-400'
                        : 'bg-neutral-50 border-neutral-200 text-neutral-700 hover:bg-white'
                    }`}
                  >
                    <Compass className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold">En Route / Moving</div>
                      <div className="text-[10px] text-neutral-500">Heading to high ground</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatus('NEEDS_ASSISTANCE')}
                    className={`p-3 rounded-2xl border text-left flex items-start gap-2.5 transition ${
                      status === 'NEEDS_ASSISTANCE'
                        ? 'bg-rose-50 border-rose-500 text-rose-950 ring-1 ring-rose-400'
                        : 'bg-neutral-50 border-neutral-200 text-neutral-700 hover:bg-white'
                    }`}
                  >
                    <Heart className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold">Safe But Low Supplies</div>
                      <div className="text-[10px] text-neutral-500">Need food, water, or meds</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Name and Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-neutral-800 block mb-1">
                    Resident / Household Head Name
                  </label>
                  <input
                    type="text"
                    required
                    value={residentName}
                    onChange={(e) => setResidentName(e.target.value)}
                    placeholder="e.g. Juan & Maria Dela Cruz"
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="font-bold text-neutral-800 block mb-1">
                    Contact Mobile Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                    <input
                      type="tel"
                      required
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="+63 9XX XXX XXXX"
                      className="w-full bg-neutral-50 border border-neutral-300 rounded-xl pl-9 pr-3 py-2 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Location or Shelter choice */}
              {status === 'SAFE_AT_SHELTER' ? (
                <div>
                  <label className="font-bold text-neutral-800 block mb-1">
                    Designated Evacuation Shelter
                  </label>
                  <select
                    value={selectedShelter}
                    onChange={(e) => setSelectedShelter(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                  >
                    {shelters.length > 0 ? (
                      shelters.map((s) => (
                        <option key={s.id} value={s.name}>
                          {s.name} ({s.locationName})
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="Bulelak Gym Evacuation Center">
                          Bulelak Gym Evacuation Center (Malanday)
                        </option>
                        <option value="Malanday Elementary School">Malanday Elementary School</option>
                        <option value="Tumana Covered Court">Tumana Covered Court</option>
                      </>
                    )}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="font-bold text-neutral-800 block mb-1">
                    Current Physical Location
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={currentLocation}
                      onChange={(e) => setCurrentLocation(e.target.value)}
                      placeholder="e.g. 2nd Floor, 87 Malanday High St."
                      className="w-full bg-neutral-50 border border-neutral-300 rounded-xl pl-9 pr-3 py-2 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              )}

              {/* Headcounts */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-neutral-800 block mb-1">
                    Total Family Members Safe
                  </label>
                  <div className="relative">
                    <Users className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={familyCount}
                      onChange={(e) => setFamilyCount(Number(e.target.value))}
                      className="w-full bg-neutral-50 border border-neutral-300 rounded-xl pl-9 pr-3 py-2 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-neutral-800 block mb-1">
                    Vulnerable (Elderly/Infants/PWD)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="15"
                    value={vulnerableCount}
                    onChange={(e) => setVulnerableCount(Number(e.target.value))}
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="font-bold text-neutral-800 block mb-1">
                  Message to Relatives & Emergency Coordinators
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g., Mom took her insulin. Waiting for flood to recede on 2nd floor."
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl p-2.5 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Confirm & Broadcast "I Am Safe" Beacon</span>
              </button>
            </form>
          ) : (
            <div className="space-y-3.5 text-xs">
              {/* Search and Filters Strip */}
              <div className="flex flex-col sm:flex-row gap-2.5 items-center justify-between">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by surname, mobile phone, shelter, or street..."
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-xl pl-9 pr-3 py-2 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>

                {/* Status Filter Pills */}
                <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-center">
                  {(
                    [
                      ['ALL', 'All'],
                      ['SAFE_AT_SHELTER', 'In Shelter'],
                      ['SAFE_AT_HOME', 'At Home'],
                      ['EVACUATING', 'Evacuating'],
                      ['NEEDS_ASSISTANCE', 'Needs Supplies'],
                    ] as const
                  ).map(([val, label]) => (
                    <button
                      key={val}
                      onClick={() => setStatusFilter(val)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                        statusFilter === val
                          ? 'bg-neutral-900 text-white shadow-2xs'
                          : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Roster of checked-in citizens */}
              <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                {records.length === 0 ? (
                  <div className="p-8 text-center text-neutral-500 border border-dashed rounded-2xl bg-neutral-50">
                    <AlertCircle className="w-6 h-6 text-neutral-400 mx-auto mb-1.5" />
                    No family records match "{searchQuery}" with status filter "{statusFilter}".
                  </div>
                ) : (
                  records.map((rec) => (
                    <div
                      key={rec.id}
                      className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50 hover:bg-white transition space-y-2.5 shadow-2xs"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-neutral-900 text-sm">
                              {rec.residentName}
                            </span>
                            {rec.isVerified && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-300">
                                <Check className="w-3 h-3 text-emerald-600" /> Verified by {rec.verifiedBy || 'Coordinator'}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-neutral-500 font-mono mt-0.5">
                            ID: {rec.id} • Checked in{' '}
                            {new Date(rec.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}{' '}
                            ({new Date(rec.timestamp).toLocaleDateString()})
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {getStatusBadge(rec.status)}
                          {isCoordinator && (
                            <button
                              onClick={() => handleToggleVerify(rec.id)}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 border ${
                                rec.isVerified
                                  ? 'bg-neutral-100 text-neutral-600 border-neutral-300 hover:bg-neutral-200'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-2xs'
                              }`}
                              title="Toggle Coordinator Welfare Verification"
                            >
                              <Check className="w-3 h-3" />
                              <span>{rec.isVerified ? 'Unverify' : 'Verify Citizen'}</span>
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] bg-white p-2.5 rounded-xl border border-neutral-200/80">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                          <span className="text-neutral-700 font-medium">
                            {rec.shelterName ? (
                              <strong className="text-emerald-900">{rec.shelterName}</strong>
                            ) : (
                              rec.currentLocation
                            )}
                            {rec.shelterName && rec.currentLocation && ` • ${rec.currentLocation}`}
                          </span>
                        </div>

                        <div className="flex items-center justify-between sm:justify-start gap-3">
                          <a
                            href={`tel:${rec.contactPhone.replace(/[^0-9+]/g, '')}`}
                            className="flex items-center gap-1.5 text-neutral-700 hover:text-emerald-700 font-semibold font-mono"
                          >
                            <PhoneCall className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{rec.contactPhone}</span>
                          </a>
                          <span className="text-[10px] bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded font-mono">
                            Call Direct
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-neutral-200/60 text-[11px] text-neutral-600">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-neutral-900 bg-neutral-200/80 px-2 py-0.5 rounded">
                            {rec.familyCount} People Accounted
                          </span>
                          {rec.vulnerableCount > 0 && (
                            <span className="text-amber-900 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded font-bold">
                              {rec.vulnerableCount} Vulnerable (Elderly/Infants/PWD)
                            </span>
                          )}
                        </div>

                        <div className="text-[10px] text-neutral-400">
                          Status reported via mobile beacon
                        </div>
                      </div>

                      {rec.notes && (
                        <div className="text-[11px] bg-neutral-100/80 p-2.5 rounded-xl border border-neutral-200 text-neutral-800 italic">
                          "{rec.notes}"
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
