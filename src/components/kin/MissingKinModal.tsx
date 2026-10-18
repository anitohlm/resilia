/**
 * Family Reunification & "Missing Kin" Photo Matching Modal
 *
 * Enables residents and disaster coordinators to:
 * 1. Register missing loved ones with distinguishing features and photo attachments.
 * 2. Search and auto-match against evacuation shelter rosters with privacy-preserving matching.
 * 3. Track reunification lifecycle: SEARCHING -> FOUND_SAFE -> AT_SHELTER -> REUNITED.
 * 4. Mask reporter phone numbers to protect citizen privacy.
 * 5. Client-side local storage with sync upon reconnection.
 */

import React, { useState, useEffect } from 'react';
import {
  Camera,
  Check,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  Filter,
  Heart,
  Home,
  Image as ImageIcon,
  MapPin,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  User,
  Users,
  X,
} from 'lucide-react';
import { MissingKinRecord, MissingKinStatus, Shelter } from '../../types';
import { MissingPersonsRepository } from '../../services/repositories';
import { useAuth } from '../../services/auth/authContext';

interface MissingKinModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  isInline?: boolean;
  shelters?: Shelter[];
  onUpdated?: () => void;
}

export const MissingKinModal: React.FC<MissingKinModalProps> = ({
  isOpen = true,
  onClose,
  isInline = false,
  shelters = [],
  onUpdated,
}) => {
  const { currentUser } = useAuth();
  const [records, setRecords] = useState<MissingKinRecord[]>([]);
  const [activeFilter, setActiveFilter] = useState<MissingKinStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<MissingKinRecord | null>(null);
  const [revealedPhones, setRevealedPhones] = useState<Record<string, boolean>>({});

  // Registration Form State
  const [fullName, setFullName] = useState('');
  const [nickname, setNickname] = useState('');
  const [approxAge, setApproxAge] = useState<number | ''>(68);
  const [gender, setGender] = useState<MissingKinRecord['gender']>('MALE');
  const [lastSeenLocation, setLastSeenLocation] = useState('Purok 4 Tumana Dike near basketball court');
  const [lastSeenDateTime, setLastSeenDateTime] = useState('Yesterday around 4:00 PM');
  const [distinguishingFeatures, setDistinguishingFeatures] = useState('');
  const [clothingDescription, setClothingDescription] = useState('');
  const [photoDataUrl, setPhotoDataUrl] = useState<string>('');
  const [reporterRelationship, setReporterRelationship] = useState('Daughter');
  const [reporterPhone, setReporterPhone] = useState(currentUser.phone || '+63 917 555 0101');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Status transition state
  const [targetShelterName, setTargetShelterName] = useState(
    shelters[0]?.name || 'Malanday Elementary School Evacuation Center'
  );
  const [statusNotes, setStatusNotes] = useState('');

  const loadRecords = async () => {
    try {
      const all = await MissingPersonsRepository.getAll();
      setRecords(all);
    } catch (e) {
      console.warn('Failed to load missing kin records:', e);
    }
  };

  useEffect(() => {
    if (isOpen || isInline) {
      loadRecords();
      setIsRegistering(false);
      setSelectedRecord(null);
    }
  }, [isOpen, isInline]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const rawUrl = uploadEvent.target?.result as string;
        if (!rawUrl) return;

        // Downscale large camera photos using HTML Canvas to prevent IndexedDB bloat
        if (typeof Image !== 'undefined') {
          const img = new Image();
          img.onload = () => {
            const maxDim = 800;
            let width = img.width;
            let height = img.height;
            if (width > maxDim || height > maxDim) {
              if (width > height) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              } else {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              const compressed = canvas.toDataURL('image/jpeg', 0.82);
              setPhotoDataUrl(compressed);
            } else {
              setPhotoDataUrl(rawUrl);
            }
          };
          img.onerror = () => {
            setPhotoDataUrl(rawUrl);
          };
          img.src = rawUrl;
        } else {
          setPhotoDataUrl(rawUrl);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    setIsSubmitting(true);
    try {
      await MissingPersonsRepository.registerMissingPerson(
        {
          fullName: fullName.trim(),
          nickname: nickname.trim() || undefined,
          approxAge: approxAge ? Number(approxAge) : undefined,
          gender,
          lastSeenLocation: lastSeenLocation.trim(),
          lastSeenDateTime: lastSeenDateTime.trim(),
          distinguishingFeatures: distinguishingFeatures.trim() || 'No special marks recorded',
          clothingDescription: clothingDescription.trim() || undefined,
          photoDataUrl: photoDataUrl || undefined,
          reporterName: currentUser.name,
          reporterPhone: reporterPhone.trim(),
          reporterRelationship: reporterRelationship.trim(),
        },
        currentUser
      );

      await loadRecords();
      setIsRegistering(false);
      resetForm();
      if (onUpdated) onUpdated();
    } catch (e) {
      console.warn('Registration failed:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFullName('');
    setNickname('');
    setApproxAge(30);
    setGender('UNKNOWN');
    setLastSeenLocation('');
    setLastSeenDateTime('');
    setDistinguishingFeatures('');
    setClothingDescription('');
    setPhotoDataUrl('');
  };

  const handleStatusUpdate = async (record: MissingKinRecord, newStatus: MissingKinStatus) => {
    try {
      await MissingPersonsRepository.updateStatus(
        record.id,
        newStatus,
        statusNotes.trim() || `Status updated to ${newStatus} by ${currentUser.name}`,
        currentUser,
        newStatus === 'AT_SHELTER' || newStatus === 'FOUND_SAFE' ? targetShelterName : undefined
      );

      await loadRecords();
      if (selectedRecord?.id === record.id) {
        const updated = await MissingPersonsRepository.getById(record.id);
        if (updated) setSelectedRecord(updated);
      }
      setStatusNotes('');
      if (onUpdated) onUpdated();
    } catch (e) {
      console.warn('Status update failed:', e);
    }
  };

  // Mask reporter phone number for privacy: "+63 917 555 0101" -> "+63 917 ••• •101"
  const maskPhone = (phone: string, recordId: string) => {
    if (revealedPhones[recordId]) return phone;
    if (phone.length < 8) return phone;
    const start = phone.slice(0, 7);
    const end = phone.slice(-3);
    return `${start} ••• •${end}`;
  };

  const togglePhoneReveal = (recordId: string) => {
    setRevealedPhones((prev) => ({ ...prev, [recordId]: !prev[recordId] }));
  };

  const filteredRecords = records.filter((r) => {
    if (activeFilter !== 'ALL' && r.status !== activeFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        r.fullName.toLowerCase().includes(q) ||
        (r.nickname && r.nickname.toLowerCase().includes(q)) ||
        r.lastSeenLocation.toLowerCase().includes(q) ||
        (r.matchedShelterName && r.matchedShelterName.toLowerCase().includes(q))
      );
    }
    return true;
  });

  if (!isInline && !isOpen) return null;

  const statusBadge = (status: MissingKinStatus) => {
    switch (status) {
      case 'SEARCHING':
        return {
          bg: 'bg-rose-50 text-rose-800 border-rose-300',
          dot: 'bg-rose-500 animate-ping',
          label: 'SEARCHING • SAKLOLO',
        };
      case 'FOUND_SAFE':
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-300',
          dot: 'bg-emerald-500',
          label: 'FOUND SAFE',
        };
      case 'AT_SHELTER':
        return {
          bg: 'bg-blue-50 text-blue-800 border-blue-300',
          dot: 'bg-blue-500',
          label: 'AT EVACUATION SHELTER',
        };
      case 'REUNITED':
        return {
          bg: 'bg-purple-50 text-purple-800 border-purple-300',
          dot: 'bg-purple-500',
          label: 'FAMILY REUNITED ✓',
        };
    }
  };

  const modalBody = (
    <div
      className={`bg-white rounded-2xl border border-neutral-200/80 shadow-2xs flex flex-col ${
        isInline ? 'w-full min-h-[700px]' : 'max-w-4xl w-full max-h-[92vh] overflow-hidden'
      }`}
    >
      {/* Header */}
      <div className="p-4 sm:p-5 bg-neutral-900 text-white flex items-center justify-between border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-xs">
            <Users className="w-5 h-5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 id="kin-title" className="text-base sm:text-lg font-black tracking-tight font-sans">
                FAMILY REUNIFICATION & MISSING KIN
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-white/20 text-white">
                Offline Roster Match
              </span>
            </div>
            <p className="text-xs text-neutral-300">
              Register missing family members, search shelter rosters, and coordinate local reunions
            </p>
          </div>
        </div>

        {!isInline && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-2.5 rounded-full hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors"
            aria-label="Close missing kin modal"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1 font-sans">
          {/* Top Controls: Search + Filter tabs + "+ Register Missing Kin" */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, nickname, or street..."
                className="w-full pl-10 pr-3 py-2 rounded-xl border border-neutral-300 bg-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                setIsRegistering(true);
                setSelectedRecord(null);
              }}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-mono text-xs font-bold transition-all shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>REPORT MISSING PERSON</span>
            </button>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-neutral-100 rounded-xl text-xs font-mono font-bold">
            {(['ALL', 'SEARCHING', 'FOUND_SAFE', 'AT_SHELTER', 'REUNITED'] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => {
                  setActiveFilter(status);
                  setIsRegistering(false);
                }}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeFilter === status && !isRegistering
                    ? 'bg-white text-neutral-900 shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-950'
                }`}
              >
                {status.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Registration Form */}
          {isRegistering ? (
            <form onSubmit={handleRegister} className="p-5 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-4 font-mono text-xs">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="font-bold uppercase text-neutral-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-rose-600" />
                  <span>Register Missing Loved One</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsRegistering(false)}
                  className="text-neutral-500 hover:text-neutral-800"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-neutral-700 font-bold uppercase mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Romeo Santos"
                    className="w-full p-2.5 rounded-xl border border-neutral-300 bg-white text-xs font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-neutral-700 font-bold uppercase mb-1">Nickname / Alias</label>
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="e.g. Tatay Romy"
                    className="w-full p-2.5 rounded-xl border border-neutral-300 bg-white text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-neutral-700 font-bold uppercase mb-1">Approx. Age</label>
                  <input
                    type="number"
                    min="0"
                    max="115"
                    value={approxAge}
                    onChange={(e) => setApproxAge(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-neutral-300 bg-white text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-neutral-700 font-bold uppercase mb-1">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-neutral-300 bg-white text-xs font-mono"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                    <option value="UNKNOWN">Unknown</option>
                  </select>
                </div>
                <div>
                  <label className="block text-neutral-700 font-bold uppercase mb-1">Relationship</label>
                  <input
                    type="text"
                    value={reporterRelationship}
                    onChange={(e) => setReporterRelationship(e.target.value)}
                    placeholder="e.g. Daughter, Neighbor"
                    className="w-full p-2.5 rounded-xl border border-neutral-300 bg-white text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-700 font-bold uppercase mb-1">Last Seen Location *</label>
                  <input
                    type="text"
                    value={lastSeenLocation}
                    onChange={(e) => setLastSeenLocation(e.target.value)}
                    placeholder="e.g. Near Tumana Dike basketball court"
                    className="w-full p-2.5 rounded-xl border border-neutral-300 bg-white text-xs font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-neutral-700 font-bold uppercase mb-1">Last Seen Date & Time</label>
                  <input
                    type="text"
                    value={lastSeenDateTime}
                    onChange={(e) => setLastSeenDateTime(e.target.value)}
                    placeholder="e.g. Yesterday around 4:00 PM"
                    className="w-full p-2.5 rounded-xl border border-neutral-300 bg-white text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-700 font-bold uppercase mb-1">
                  Distinguishing Features & Clothing
                </label>
                <textarea
                  rows={2}
                  value={distinguishingFeatures}
                  onChange={(e) => setDistinguishingFeatures(e.target.value)}
                  placeholder="e.g. Walking cane with rubber tip, glasses, blue duster dress, mole on left cheek"
                  className="w-full p-2.5 rounded-xl border border-neutral-300 bg-white text-xs font-mono"
                />
              </div>

              {/* Photo Upload or Data URI */}
              <div>
                <label className="block text-neutral-700 font-bold uppercase mb-1">
                  Attach Photo (Offline Storage)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="text-xs file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-mono file:font-bold file:bg-neutral-200 file:text-neutral-800 hover:file:bg-neutral-300"
                  />
                  {photoDataUrl && (
                    <img
                      src={photoDataUrl}
                      alt="Preview"
                      className="w-12 h-12 object-cover rounded-xl border border-neutral-300 shadow-2xs"
                    />
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRegistering(false)}
                  className="px-4 py-2 rounded-xl border border-neutral-300 font-bold hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold"
                >
                  {isSubmitting ? 'Submitting...' : 'BROADCAST TO SHELTER ROSTERS'}
                </button>
              </div>
            </form>
          ) : null}

          {/* Records Roster List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredRecords.map((r) => {
              const conf = statusBadge(r.status);
              const isSelected = selectedRecord?.id === r.id;

              return (
                <div
                  key={r.id}
                  onClick={() => setSelectedRecord(isSelected ? null : r)}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer bg-white relative space-y-3 ${
                    isSelected
                      ? 'border-neutral-900 shadow-md ring-2 ring-neutral-900/10'
                      : 'border-neutral-200 hover:border-neutral-300 shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {/* Avatar or Photo */}
                      {r.photoDataUrl ? (
                        <img
                          src={r.photoDataUrl}
                          alt={r.fullName}
                          className="w-14 h-14 rounded-2xl object-cover border border-neutral-200 shadow-2xs shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-neutral-100 border border-neutral-200 flex items-center justify-center shrink-0 text-neutral-400 font-black text-lg font-mono">
                          {r.fullName.charAt(0)}
                        </div>
                      )}

                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${conf.bg}`}>
                            {conf.label}
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-neutral-900 mt-0.5 leading-snug">
                          {r.fullName}
                          {r.nickname && <span className="text-neutral-500 font-normal ml-1">({r.nickname})</span>}
                        </h4>
                        <p className="text-xs font-mono text-neutral-500">
                          {r.approxAge ? `${r.approxAge} yrs · ` : ''}{r.gender}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="text-xs font-mono text-neutral-600 space-y-1 bg-neutral-50 p-2.5 rounded-xl border border-neutral-100">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                      <span className="truncate">Last seen: {r.lastSeenLocation}</span>
                    </div>
                    {r.distinguishingFeatures && (
                      <p className="text-[11px] text-neutral-500 line-clamp-2">
                        Features: {r.distinguishingFeatures}
                      </p>
                    )}
                  </div>

                  {/* Matched Shelter Banner (if located) */}
                  {r.matchedShelterName && (
                    <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs font-mono flex items-center gap-2">
                      <Home className="w-4 h-4 text-blue-600 shrink-0" />
                      <div>
                        <span className="font-bold block">Sheltered At:</span>
                        <span className="text-[11px]">{r.matchedShelterName}</span>
                      </div>
                    </div>
                  )}

                  {/* Reporter & Contact with Privacy Masking */}
                  <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-[11px] font-mono">
                    <span className="text-neutral-500">
                      Reported by {r.reporterName} ({r.reporterRelationship})
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePhoneReveal(r.id);
                      }}
                      className="inline-flex items-center gap-1 text-emerald-700 font-bold hover:underline"
                    >
                      <Phone className="w-3 h-3" />
                      <span>{maskPhone(r.reporterPhone, r.id)}</span>
                    </button>
                  </div>

                  {/* Expanded Status Updater */}
                  {isSelected && (
                    <div
                      className="mt-3 pt-3 border-t-2 border-neutral-200 bg-neutral-50 -mx-4 -mb-4 p-4 rounded-b-xl space-y-3 font-mono text-xs animate-in fade-in duration-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="font-bold uppercase text-neutral-800">
                        Update Reunification Status:
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase text-neutral-500 font-bold block">
                          Verified Evacuation Shelter:
                        </label>
                        <select
                          value={targetShelterName}
                          onChange={(e) => setTargetShelterName(e.target.value)}
                          className="w-full p-2 rounded-lg border border-neutral-300 bg-white text-xs font-mono"
                        >
                          {shelters.map((s) => (
                            <option key={s.id} value={s.name}>
                              {s.name}
                            </option>
                          ))}
                          <option value="Amang Rodriguez Memorial ER">Amang Rodriguez Memorial ER</option>
                          <option value="Home / Relatives Residence">Home / Relatives Residence</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleStatusUpdate(r, 'AT_SHELTER')}
                          className="py-2 px-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] text-center"
                        >
                          AT SHELTER
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusUpdate(r, 'FOUND_SAFE')}
                          className="py-2 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] text-center"
                        >
                          FOUND SAFE
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusUpdate(r, 'REUNITED')}
                          className="py-2 px-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-[10px] text-center"
                        >
                          REUNITED ✓
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {filteredRecords.length === 0 && (
            <div className="p-8 text-center bg-neutral-50 rounded-2xl border border-neutral-200 space-y-2 font-mono">
              <Users className="w-8 h-8 text-neutral-400 mx-auto" />
              <p className="text-xs text-neutral-600">
                No missing person inquiries matching your search filter.
              </p>
              <button
                type="button"
                onClick={() => setIsRegistering(true)}
                className="text-xs font-bold text-rose-600 hover:underline inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Register missing kin inquiry
              </button>
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
      aria-labelledby="kin-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
    >
      {modalBody}
    </div>
  );
};
