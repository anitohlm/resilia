/**
 * Digital Household Relief Claim QR Card ("Ayuda" Pass)
 *
 * Resident-facing digital ration pass containing household demographics,
 * Stored locally in IndexedDB with local QR generation.
 */

import React, { useState, useEffect } from 'react';
import {
  Baby,
  CheckCircle2,
  Clock,
  Copy,
  Edit2,
  Heart,
  Package,
  QrCode,
  ShieldCheck,
  User,
  Users,
  Utensils,
  X,
} from 'lucide-react';
import { useAuth } from '../../services/auth/authContext';
import { HouseholdClaimCard, RationDistributionRecord } from '../../types';
import { RationDistributionRepository } from '../../services/repositories';
import { QRCodeSVG, BarcodeSVG } from '../../utils/qrCode';

interface HouseholdAyudaCardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HouseholdAyudaCardModal: React.FC<HouseholdAyudaCardModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { currentUser } = useAuth();
  const [householdCard, setHouseholdCard] = useState<HouseholdClaimCard | null>(null);
  const [history, setHistory] = useState<RationDistributionRecord[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Form edit state
  const [headName, setHeadName] = useState(currentUser.name || 'Carlo Mendoza');
  const [paxCount, setPaxCount] = useState(5);
  const [infantsCount, setInfantsCount] = useState(1);
  const [seniorsCount, setSeniorsCount] = useState(1);
  const [pwdCount, setPwdCount] = useState(1);
  const [purokAddress, setPurokAddress] = useState(currentUser.locationName || 'Purok 3 Riverside St., Malanday');

  const loadCardAndHistory = async () => {
    try {
      const cards = await RationDistributionRepository.getHouseholdCards();
      // Match by current user or first card
      let matched = cards.find(
        (c) =>
          c.householdHeadName.toLowerCase().includes(currentUser.name.toLowerCase()) ||
          currentUser.name.toLowerCase().includes(c.householdHeadName.toLowerCase())
      );

      if (matched) {
        setHouseholdCard(matched);
        setHeadName(matched.householdHeadName);
        setPaxCount(matched.familyMembersCount);
        setInfantsCount(matched.vulnerableMembers.infants || 0);
        setSeniorsCount(matched.vulnerableMembers.seniors || 0);
        setPwdCount(matched.vulnerableMembers.pwd || 0);
        setPurokAddress(matched.purokAddress);

        const dists = await RationDistributionRepository.getDistributionsForHousehold(matched.claimCode);
        setHistory(dists);
      } else {
        // Create initial default card for user
        const initialCode = `AYUDA-FAM-TUM-${Math.floor(100 + Math.random() * 900)}`;
        const created = await RationDistributionRepository.registerHouseholdCard(
          {
            claimCode: initialCode,
            householdHeadName: currentUser.name || 'Resident Family',
            familyMembersCount: 4,
            vulnerableMembers: { infants: 0, seniors: 1, pwd: 0, lactating: 0 },
            contactPhone: currentUser.phone || '+63 920 000 0000',
            purokAddress: currentUser.locationName || 'Barangay Tumana / Malanday',
          },
          currentUser
        );
        setHouseholdCard(created);
      }
    } catch (e) {
      console.warn('Error loading household card:', e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadCardAndHistory();
    }
  }, [isOpen]);

  const handleSaveCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!householdCard) return;

    const updated = await RationDistributionRepository.registerHouseholdCard(
      {
        claimCode: householdCard.claimCode,
        householdHeadName: headName.trim(),
        familyMembersCount: Number(paxCount),
        vulnerableMembers: {
          infants: Number(infantsCount),
          seniors: Number(seniorsCount),
          pwd: Number(pwdCount),
          lactating: 0,
        },
        contactPhone: currentUser.phone || '+63 922 555 0404',
        purokAddress: purokAddress.trim(),
      },
      currentUser
    );

    setHouseholdCard(updated);
    setIsEditing(false);
  };

  const handleCopyCode = () => {
    if (householdCard?.claimCode && navigator.clipboard) {
      navigator.clipboard.writeText(householdCard.claimCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ayuda-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
    >
      <div className="bg-white rounded-3xl max-w-lg w-full border border-neutral-200 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#153B32] text-white flex items-center justify-between border-b border-[#1c4d42]">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-white/10 text-emerald-300 flex items-center justify-center border border-white/10">
              <Package className="w-5 h-5 text-emerald-300" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="ayuda-title" className="text-base sm:text-lg font-black tracking-tight font-sans">
                  DIGITAL HOUSEHOLD AYUDA PASS
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-white/20 text-white">
                  Verified
                </span>
              </div>
              <p className="text-xs text-white/80">
                Official relief ration claim card for food packs, water, and hygiene kits
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors"
            aria-label="Close ayuda modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {householdCard && !isEditing ? (
            <div className="space-y-4">
              {/* Card Physical Skeuomorph */}
              <div className="p-5 rounded-3xl bg-neutral-900 text-white border-2 border-neutral-800 shadow-xl space-y-4 text-center">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-2.5 text-xs font-mono text-neutral-400">
                  <span className="text-emerald-400 font-bold uppercase tracking-widest text-[10px]">
                    DISASTER RELIEF PASS
                  </span>
                  <span className="flex items-center gap-1 text-neutral-300">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>LGU MARIKINA DSWD</span>
                  </span>
                </div>

                {/* QR Code Container */}
                <div className="flex flex-col items-center justify-center p-3.5 bg-white rounded-2xl max-w-[210px] mx-auto shadow-sm">
                  <QRCodeSVG value={householdCard.claimCode} size={160} />
                  <div className="w-full mt-2 pt-1 border-t border-neutral-200">
                    <BarcodeSVG value={householdCard.claimCode} height={34} />
                  </div>
                </div>

                {/* Family Details */}
                <div className="space-y-1">
                  <div className="text-xl sm:text-2xl font-black font-sans uppercase tracking-tight text-white">
                    {householdCard.householdHeadName}
                  </div>
                  <div className="text-xs font-mono text-emerald-300">
                    {householdCard.purokAddress}
                  </div>
                </div>

                {/* Demographics Pill Grid */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-neutral-800 text-xs font-mono">
                  <div className="p-2 rounded-xl bg-neutral-800/80 border border-neutral-700">
                    <span className="text-[10px] text-neutral-400 block uppercase">Family Size</span>
                    <span className="text-sm font-bold text-white">{householdCard.familyMembersCount} Pax</span>
                  </div>
                  <div className="p-2 rounded-xl bg-neutral-800/80 border border-neutral-700">
                    <span className="text-[10px] text-neutral-400 block uppercase">Seniors / PWD</span>
                    <span className="text-sm font-bold text-amber-300">
                      {(householdCard.vulnerableMembers.seniors || 0) + (householdCard.vulnerableMembers.pwd || 0)}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-neutral-800/80 border border-neutral-700">
                    <span className="text-[10px] text-neutral-400 block uppercase">Infants</span>
                    <span className="text-sm font-bold text-cyan-300">
                      {householdCard.vulnerableMembers.infants || 0}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 text-[11px] font-mono text-neutral-400">
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="flex items-center gap-1 hover:text-white"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedCode ? 'Copied code!' : householdCard.claimCode}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-1 text-emerald-400 hover:underline font-bold"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Profile</span>
                  </button>
                </div>
              </div>

              {/* Distribution History Ledger */}
              <div className="space-y-2.5">
                <h3 className="font-bold text-xs uppercase font-mono tracking-wider text-neutral-500">
                  Recent Relief Claim History
                </h3>

                {history.length > 0 ? (
                  <div className="space-y-2">
                    {history.map((h) => (
                      <div
                        key={h.id}
                        className="p-3 rounded-xl border border-neutral-200 bg-neutral-50 flex items-center justify-between text-xs font-mono"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                            ✓
                          </span>
                          <div>
                            <span className="font-bold text-neutral-900 block">
                              {h.packageQuantity}x {h.packageType.replace(/_/g, ' ')}
                            </span>
                            <span className="text-[11px] text-neutral-500">
                              Claimed at {h.shelterOrSiteName}
                            </span>
                          </div>
                        </div>
                        <span className="text-neutral-400 text-[10px]">
                          {new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 text-center text-xs font-mono text-neutral-500">
                    No relief distributions recorded for this pass yet today. Present card at evacuation center relief desk.
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Editing Household Profile */
            <form onSubmit={handleSaveCard} className="space-y-4 font-mono text-xs">
              <div className="font-bold uppercase text-neutral-800 border-b pb-2">
                Update Household Information
              </div>

              <div>
                <label className="block text-neutral-700 font-bold mb-1">Household Head Name</label>
                <input
                  type="text"
                  value={headName}
                  onChange={(e) => setHeadName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-neutral-300 text-xs font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-neutral-700 font-bold mb-1">Purok / Home Address</label>
                <input
                  type="text"
                  value={purokAddress}
                  onChange={(e) => setPurokAddress(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-neutral-300 text-xs font-mono"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-700 font-bold mb-1">Total Family Members</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={paxCount}
                    onChange={(e) => setPaxCount(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-neutral-300 text-xs font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-neutral-700 font-bold mb-1">Infants (0-2 yrs)</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={infantsCount}
                    onChange={(e) => setInfantsCount(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-neutral-300 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-700 font-bold mb-1">Senior Citizens (60+)</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={seniorsCount}
                    onChange={(e) => setSeniorsCount(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-neutral-300 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-neutral-700 font-bold mb-1">PWD / Mobility Impaired</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={pwdCount}
                    onChange={(e) => setPwdCount(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-neutral-300 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl border border-neutral-300 font-bold hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-700 text-white font-bold hover:bg-emerald-800"
                >
                  Save Pass
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
