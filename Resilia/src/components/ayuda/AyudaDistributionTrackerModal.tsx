/**
 * Coordinator / Shelter Marshal Ayuda & Ration Distribution Tracker
 *
 * Enables shelter marshals to scan or enter household QR codes,
 * inspect family vulnerability profiles, prevent duplicate claims within 24h cooldown,
 * disburse relief packages, and automatically update warehouse inventory burn rates.
 */

import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Baby,
  Barcode,
  Check,
  CheckCircle2,
  Clock,
  Droplets,
  Heart,
  Package,
  QrCode,
  Search,
  ShieldAlert,
  ShieldCheck,
  User,
  Users,
  Utensils,
  X,
} from 'lucide-react';
import { useAuth } from '../../services/auth/authContext';
import {
  HouseholdClaimCard,
  RationDistributionRecord,
  RationPackageType,
  Resource,
  Shelter,
} from '../../types';
import { RationDistributionRepository, ResourceRepository } from '../../services/repositories';
import { QRCodeSVG, BarcodeSVG } from '../../utils/qrCode';

interface AyudaDistributionTrackerModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  isInline?: boolean;
  shelters?: Shelter[];
  onDistributionRecorded?: () => void;
}

export const AyudaDistributionTrackerModal: React.FC<AyudaDistributionTrackerModalProps> = ({
  isOpen = true,
  onClose,
  isInline = false,
  shelters = [],
  onDistributionRecorded,
}) => {
  const { currentUser } = useAuth();
  const [claimCodeInput, setClaimCodeInput] = useState('');
  const [searchedCard, setSearchedCard] = useState<HouseholdClaimCard | null>(null);
  const [cooldownWarning, setCooldownWarning] = useState<string | null>(null);
  const [allowDuplicateOverride, setAllowDuplicateOverride] = useState(false);
  const [duplicateReason, setDuplicateReason] = useState('');

  // Selected package to disburse
  const [packageType, setPackageType] = useState<RationPackageType>('FAMILY_FOOD_PACK');
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedShelterName, setSelectedShelterName] = useState<string>(
    shelters[0]?.name || 'Malanday Elementary School Evacuation Center'
  );
  const [distributionNotes, setDistributionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Recent distributions ledger
  const [recentDistributions, setRecentDistributions] = useState<RationDistributionRecord[]>([]);

  const loadDistributions = async () => {
    try {
      const all = await RationDistributionRepository.getAllDistributions();
      setRecentDistributions(all);
    } catch (e) {
      console.warn('Failed to load distributions:', e);
    }
  };

  useEffect(() => {
    if (isOpen || isInline) {
      loadDistributions();
      setFeedback(null);
      setSearchedCard(null);
      setClaimCodeInput('');
      setCooldownWarning(null);
    }
  }, [isOpen, isInline]);

  const handleSearchCode = async (codeToSearch: string) => {
    const code = codeToSearch.trim().toUpperCase();
    if (!code) return;

    setFeedback(null);
    setCooldownWarning(null);
    setAllowDuplicateOverride(false);

    try {
      const card = await RationDistributionRepository.getHouseholdByCode(code);
      if (card) {
        setSearchedCard(card);
        // Check 24-hour duplicate claim cooldown
        const check = await RationDistributionRepository.checkCooldown(card.claimCode, 24);
        if (!check.canClaim) {
          setCooldownWarning(
            `DUPLICATE CLAIM ALERT: Household already claimed ${check.lastClaim?.packageType} at ${check.lastClaim?.shelterOrSiteName}. 24-hour cooldown is active (${check.hoursRemaining}h remaining).`
          );
        }
      } else {
        setSearchedCard(null);
        setFeedback({
          type: 'error',
          message: `Claim code "${code}" not found. Verify family pass code or register new card.`,
        });
      }
    } catch (e: any) {
      setFeedback({ type: 'error', message: e.message || 'Error looking up claim code.' });
    }
  };

  const handleDisburse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchedCard) return;

    if (cooldownWarning && !allowDuplicateOverride) {
      setFeedback({
        type: 'error',
        message: 'Cannot disburse: 24h cooldown active. Check override box with rationale to proceed.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { distribution, warning } = await RationDistributionRepository.recordDistribution(
        {
          householdId: searchedCard.id,
          claimCode: searchedCard.claimCode,
          householdHeadName: searchedCard.householdHeadName,
          familyMembersCount: searchedCard.familyMembersCount,
          packageType,
          packageQuantity: Number(quantity),
          distributedBy: currentUser.name,
          distributedById: currentUser.id,
          shelterOrSiteName: selectedShelterName,
          cooldownHours: 24,
          notes: duplicateReason ? `OVERRIDE: ${duplicateReason}` : distributionNotes || undefined,
        },
        currentUser,
        allowDuplicateOverride
      );

      setFeedback({
        type: 'success',
        message: `Successfully disbursed ${quantity}x ${packageType.replace(/_/g, ' ')} to ${searchedCard.householdHeadName}! Inventory stock updated.`,
      });

      await loadDistributions();
      setSearchedCard(null);
      setClaimCodeInput('');
      setCooldownWarning(null);
      setAllowDuplicateOverride(false);
      setDuplicateReason('');

      if (onDistributionRecorded) onDistributionRecorded();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to record distribution.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isInline && !isOpen) return null;

  const modalBody = (
    <div
      className={`bg-white rounded-2xl border border-neutral-200/80 shadow-2xs flex flex-col ${
        isInline ? 'w-full min-h-[700px]' : 'max-w-4xl w-full max-h-[92vh] overflow-hidden'
      }`}
    >
      {/* Header */}
      <div className="p-4 sm:p-5 bg-neutral-900 text-white flex items-center justify-between border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
            <Package className="w-5 h-5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 id="tracker-title" className="text-base sm:text-lg font-black tracking-tight font-sans">
                "AYUDA" & RATION DISTRIBUTION TRACKER
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-white/20 text-white">
                Duplicate Shield
              </span>
            </div>
            <p className="text-xs text-neutral-300">
              Scan household QR cards, prevent duplicate claims, and track supply burn rate
            </p>
          </div>
        </div>

        {!isInline && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-2.5 rounded-full hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors"
            aria-label="Close tracker modal"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1 font-sans">
          {/* Feedback notification */}
          {feedback && (
            <div
              className={`p-3.5 rounded-2xl border text-xs font-mono flex items-center justify-between ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : 'bg-rose-50 border-rose-300 text-rose-900'
              }`}
            >
              <div className="flex items-center gap-2">
                {feedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{feedback.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setFeedback(null)}
                className="text-neutral-500 hover:text-neutral-800 font-bold ml-2 text-sm"
              >
                ✕
              </button>
            </div>
          )}

          {/* Quick Scanner & Search Bar */}
          <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-3">
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-neutral-700">
              Scan or Enter Household Claim QR Code
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <QrCode className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={claimCodeInput}
                  onChange={(e) => setClaimCodeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSearchCode(claimCodeInput);
                    }
                  }}
                  placeholder="e.g. AYUDA-FAM-TUM-042 (or scan QR code)"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-neutral-300 bg-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <button
                type="button"
                onClick={() => handleSearchCode(claimCodeInput)}
                className="px-5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-mono text-xs font-bold transition-all shadow-xs"
              >
                LOOKUP PASS
              </button>
            </div>

            {/* Quick Demo Shortcuts */}
            <div className="flex items-center gap-2 text-[11px] font-mono text-neutral-500">
              <span>Quick Demo Passes:</span>
              <button
                type="button"
                onClick={() => {
                  setClaimCodeInput('AYUDA-FAM-TUM-042');
                  handleSearchCode('AYUDA-FAM-TUM-042');
                }}
                className="underline text-emerald-700 font-bold hover:text-emerald-900"
              >
                AYUDA-FAM-TUM-042 (Carlo M.)
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => {
                  setClaimCodeInput('AYUDA-FAM-TUM-089');
                  handleSearchCode('AYUDA-FAM-TUM-089');
                }}
                className="underline text-emerald-700 font-bold hover:text-emerald-900"
              >
                AYUDA-FAM-TUM-089 (Lola Rosa)
              </button>
            </div>
          </div>

          {/* Searched Household Demographics & Disbursement Form */}
          {searchedCard && (
            <form onSubmit={handleDisburse} className="p-5 rounded-2xl bg-white border-2 border-emerald-500 shadow-md space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-200 pb-3">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-700">
                    VERIFIED HOUSEHOLD CLAIM CARD
                  </span>
                  <h3 className="text-xl font-black text-neutral-900 uppercase">
                    {searchedCard.householdHeadName}
                  </h3>
                  <p className="text-xs font-mono text-neutral-500 mt-0.5">
                    {searchedCard.purokAddress} · Code: <span className="font-bold text-neutral-900">{searchedCard.claimCode}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1.5 rounded-xl bg-neutral-100 text-neutral-800 font-mono text-xs font-bold">
                    {searchedCard.familyMembersCount} Family Members
                  </span>
                </div>
              </div>

              {/* Vulnerabilities Pill Summary */}
              <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                <div className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200">
                  <span className="text-[10px] text-neutral-400 block uppercase">Seniors (60+)</span>
                  <span className="font-bold text-neutral-900">{searchedCard.vulnerableMembers.seniors || 0}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200">
                  <span className="text-[10px] text-neutral-400 block uppercase">Infants (0-2)</span>
                  <span className="font-bold text-cyan-700">{searchedCard.vulnerableMembers.infants || 0}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200">
                  <span className="text-[10px] text-neutral-400 block uppercase">PWD Members</span>
                  <span className="font-bold text-rose-700">{searchedCard.vulnerableMembers.pwd || 0}</span>
                </div>
              </div>

              {/* Cooldown Duplicate Warning Banner */}
              {cooldownWarning && (
                <div className="p-3.5 rounded-xl bg-amber-50 border-2 border-amber-300 text-amber-900 text-xs font-mono space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span className="font-bold">{cooldownWarning}</span>
                  </div>
                  <div className="pt-2 border-t border-amber-200 flex flex-col sm:flex-row sm:items-center gap-2">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-amber-950">
                      <input
                        type="checkbox"
                        checked={allowDuplicateOverride}
                        onChange={(e) => setAllowDuplicateOverride(e.target.checked)}
                        className="rounded accent-amber-600"
                      />
                      <span>Marshal Authorization Override (Emergency Need)</span>
                    </label>
                    {allowDuplicateOverride && (
                      <input
                        type="text"
                        value={duplicateReason}
                        onChange={(e) => setDuplicateReason(e.target.value)}
                        placeholder="Rationale (e.g. food spoiled by floodwaters)"
                        className="flex-1 p-1.5 rounded border border-amber-300 text-[11px] bg-white font-mono"
                        required
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Package Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
                <div>
                  <label className="block text-neutral-700 font-bold uppercase mb-1">Ration Package</label>
                  <select
                    value={packageType}
                    onChange={(e) => setPackageType(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-neutral-300 bg-white font-mono text-xs"
                  >
                    <option value="FAMILY_FOOD_PACK">Family Food Pack (6kg Rice, Canned, Coffee)</option>
                    <option value="HYGIENE_KIT">Hygiene Kit (Soap, Toothbrush, Napkins)</option>
                    <option value="POTABLE_WATER_5GAL">Potable Water (5-Gallon Container)</option>
                    <option value="INFANT_NUTRITION_KIT">Infant Formula & Diapers Kit</option>
                    <option value="SLEEPING_KIT">Sleeping Mat & Thermal Blanket</option>
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-700 font-bold uppercase mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-neutral-300 bg-white font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-neutral-700 font-bold uppercase mb-1">Distribution Hub</label>
                  <input
                    type="text"
                    value={selectedShelterName}
                    onChange={(e) => setSelectedShelterName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-neutral-300 bg-white font-mono text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSearchedCard(null)}
                  className="px-4 py-2.5 rounded-xl border border-neutral-300 text-xs font-mono font-bold text-neutral-700 hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs font-bold transition-all shadow-sm"
                >
                  {isSubmitting ? 'Recording...' : 'CONFIRM & RECORD DISBURSEMENT'}
                </button>
              </div>
            </form>
          )}

          {/* Live Recent Distributions Ledger */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between text-xs font-mono text-neutral-500">
              <span className="font-bold uppercase tracking-wider text-neutral-700">
                Live Distribution Ledger ({recentDistributions.length} Disbursements)
              </span>
              <span>Deducts warehouse stock live</span>
            </div>

            <div className="border border-neutral-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
              <div className="max-h-60 overflow-y-auto divide-y divide-neutral-100 text-xs font-mono">
                {recentDistributions.map((d) => (
                  <div key={d.id} className="p-3 flex items-center justify-between hover:bg-neutral-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                        ✓
                      </span>
                      <div>
                        <div className="font-bold text-neutral-900">
                          {d.packageQuantity}x {d.packageType.replace(/_/g, ' ')}
                        </div>
                        <div className="text-[11px] text-neutral-500">
                          {d.householdHeadName} [{d.claimCode}] · {d.shelterOrSiteName}
                          {d.notes && <span className="text-amber-700 font-bold ml-1">({d.notes})</span>}
                        </div>
                      </div>
                    </div>
                    <div className="text-right text-[11px] text-neutral-400 shrink-0">
                      <span>{new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="block text-[10px] text-neutral-500">By {d.distributedBy}</span>
                    </div>
                  </div>
                ))}

                {recentDistributions.length === 0 && (
                  <div className="p-6 text-center text-neutral-500 text-xs font-mono">
                    No distributions recorded yet today. Scan a family QR card above to disburse packages.
                  </div>
                )}
              </div>
            </div>
          </div>
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
      aria-labelledby="tracker-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
    >
      {modalBody}
    </div>
  );
};
