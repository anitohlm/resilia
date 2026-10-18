/**
 * Resident "Mark Me Safe" Workflow
 * Simple "I'm Safe" check-in:
 * - Allows residents to mark themselves safe and update their location.
 * - Distinguishes accounted household members from unknown status members.
 * - Explains that information is shared only with authorized coordinators, not publicly.
 * - Persists locally and queues for sync.
 * - Distinguishes self-reported status from coordinator-verified status.
 */

import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Heart,
  Home,
  Info,
  Lock,
  MapPin,
  Users,
} from 'lucide-react';
import { MarkSafeIcon } from '../../components/icons/ResidentIcons';
import {
  Card,
  DeliveryStatus,
  Field,
  inputClass,
  Notice,
  PrimaryButton,
  ScreenHeader,
  SecondaryButton,
  StatusPill,
  Stepper,
} from './ui';
import { CitizenSafetyStatus, SafetyCheckIn, safetyCheckInService } from '../../services/safety/safetyCheckInService';
import { useAuth } from '../../services/auth/authContext';
import { syncClient } from '../../services/offline/syncClient';
import { Shelter } from '../../types';
import { computeDelivery, formatTime, useSyncEvents } from './residentUtils';
import { Navigate } from './ResidentApp';

interface ResidentMarkSafeProps {
  onBack: () => void;
  navigate: Navigate;
  shelters: Shelter[];
  connectivity: string;
  onSafetyUpdated?: () => void;
}

const SAFETY_STATUS_OPTIONS: {
  status: CitizenSafetyStatus;
  label: string;
  hint: string;
}[] = [
  { status: 'SAFE_AT_HOME', label: 'Safe at Home', hint: 'Dry, secured on upper floor, or sheltered in place' },
  { status: 'SAFE_AT_SHELTER', label: 'Safe at Evacuation Center', hint: 'Arrived at official community shelter' },
  { status: 'EVACUATING', label: 'Currently Evacuating', hint: 'En route to safer ground or shelter' },
  { status: 'NEEDS_ASSISTANCE', label: 'Safe but Need Supplies', hint: 'Safe from water, but low on food, water, or medicine' },
];

export const ResidentMarkSafe: React.FC<ResidentMarkSafeProps> = ({
  onBack,
  navigate,
  shelters,
  connectivity,
  onSafetyUpdated,
}) => {
  const { currentUser } = useAuth();
  const syncEvents = useSyncEvents();

  // Resident check-in history
  const [existingCheckIns, setExistingCheckIns] = useState<SafetyCheckIn[]>(() =>
    safetyCheckInService.getForResident(currentUser.id)
  );

  const [status, setStatus] = useState<CitizenSafetyStatus>('SAFE_AT_HOME');
  const [locationText, setLocationText] = useState(
    currentUser.locationName || 'Purok 4, Tumana Dike Side'
  );
  const [shelterName, setShelterName] = useState<string>(
    shelters[0]?.name || 'Malanday Elementary School Evacuation Center'
  );
  const [familyCount, setFamilyCount] = useState<number>(1);
  const [unknownCount, setUnknownCount] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recentSaved, setRecentSaved] = useState<SafetyCheckIn | null>(null);

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const saved = await safetyCheckInService.recordResidentCheckIn(
        {
          residentName: currentUser.name,
          contactPhone: currentUser.phone || '',
          residentId: currentUser.id,
          status,
          currentLocation: status === 'SAFE_AT_SHELTER' ? shelterName : locationText,
          shelterName: status === 'SAFE_AT_SHELTER' ? shelterName : undefined,
          familyCount: Math.max(1, familyCount),
          unknownCount: Math.max(0, unknownCount),
          vulnerableCount: 0,
          notes: notes.trim() || undefined,
        },
        currentUser.id
      );

      if (connectivity === 'ONLINE') {
        syncClient.triggerSync().catch(() => undefined);
      } else {
        syncClient.scheduleDebouncedSync(50);
      }

      onSafetyUpdated?.();

      setRecentSaved(saved);
      setExistingCheckIns(safetyCheckInService.getForResident(currentUser.id));
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (recentSaved) {
    const delivery = computeDelivery(syncEvents, recentSaved.id);

    return (
      <div className="space-y-6 max-w-xl mx-auto">
        <ScreenHeader title="Safety Status Updated" onBack={onBack} />

        <Card className="p-6 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-rs-tint text-rs-primary flex items-center justify-center mx-auto">
            <MarkSafeIcon className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-rs-text">
              Status Recorded: {recentSaved.status.replace(/_/g, ' ')}
            </h2>
            <p className="text-sm text-rs-muted mt-1 max-w-md mx-auto">
              Your check-in has been recorded. This lets coordinators know you and your household are accounted for.
            </p>
          </div>

          <div className="pt-1">
            <DeliveryStatus info={delivery} />
          </div>

          <div className="bg-rs-bg p-4 rounded-xl text-left text-sm space-y-2 border border-rs-border">
            <div className="flex justify-between items-center">
              <span className="text-rs-muted">Accounted Safe</span>
              <span className="font-bold text-rs-primary-dark">{recentSaved.familyCount} person(s)</span>
            </div>
            {recentSaved.unknownCount !== undefined && recentSaved.unknownCount > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-rs-muted">Unaccounted / Unknown Status</span>
                <span className="font-bold text-rs-warning">{recentSaved.unknownCount} person(s)</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-rs-muted">Reported Location</span>
              <span className="font-semibold text-rs-text">{recentSaved.currentLocation}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-rs-border/60">
              <span className="text-rs-muted">Verification</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                Self-Reported (Unverified by coordinator)
              </span>
            </div>
          </div>

          <Notice tone="info">
            <span className="flex items-center gap-1 font-semibold text-rs-text">
              <Lock className="w-4 h-4 text-rs-primary" /> Confidentiality Notice
            </span>
            Safety check-ins are restricted to authorized Disaster Operations Coordinators. Detailed rosters are never
            published to the public map or shared externally.
          </Notice>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <PrimaryButton full onClick={onBack}>
              Return to Home
            </PrimaryButton>
            <SecondaryButton full onClick={() => setRecentSaved(null)}>
              Update Status Again
            </SecondaryButton>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <ScreenHeader
        title="Mark Me Safe"
        subtitle="Check in your household's safety status"
        onBack={onBack}
      />

      {/* Privacy Notice */}
      <div className="p-4 rounded-2xl bg-rs-tint/60 border border-rs-primary/20 flex gap-3 text-xs text-rs-text">
        <Lock className="w-5 h-5 text-rs-primary shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block text-sm">Who sees this information?</span>
          Your safety status is shared strictly with authorized community disaster coordinators to help prioritize rescue
          efforts and manage evacuation registries. It is never exposed publicly.
        </div>
      </div>

      <form onSubmit={handleCheckIn} className="space-y-5">
        {/* Status choices */}
        <div className="space-y-2">
          <label className="block text-base font-semibold text-rs-text">
            What is your current safety status?
          </label>
          <div className="space-y-2">
            {SAFETY_STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.status}
                type="button"
                onClick={() => setStatus(opt.status)}
                className={`w-full text-left p-4 rounded-2xl border transition-colors flex items-start gap-3 ${
                  status === opt.status
                    ? 'bg-rs-tint border-rs-primary ring-1 ring-rs-primary'
                    : 'bg-rs-card border-rs-border hover:bg-rs-bg'
                }`}
              >
                <div className="w-5 h-5 rounded-full border border-rs-border flex items-center justify-center mt-0.5 shrink-0">
                  {status === opt.status && (
                    <div className="w-2.5 h-2.5 rounded-full bg-rs-primary" />
                  )}
                </div>
                <div>
                  <span className="block text-base font-semibold text-rs-text">{opt.label}</span>
                  <span className="block text-xs text-rs-muted mt-0.5">{opt.hint}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Location selector */}
        {status === 'SAFE_AT_SHELTER' ? (
          <Field label="Which shelter are you currently at?">
            {(id, describedBy) => (
              <select
                id={id}
                aria-describedby={describedBy}
                value={shelterName}
                onChange={(e) => setShelterName(e.target.value)}
                className={inputClass}
              >
                {shelters.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name} ({s.locationName})
                  </option>
                ))}
              </select>
            )}
          </Field>
        ) : (
          <Field label="Your Current Location" hint="Street address or landmark">
            {(id, describedBy) => (
              <input
                id={id}
                aria-describedby={describedBy}
                type="text"
                required
                value={locationText}
                onChange={(e) => setLocationText(e.target.value)}
                placeholder="e.g. 2nd floor, 42 J.P. Rizal St."
                className={inputClass}
              />
            )}
          </Field>
        )}

        {/* Household headcounts: Accounted vs Unknown */}
        <Card className="p-4 space-y-4">
          <Stepper
            label="Household members accounted for as safe"
            value={familyCount}
            min={1}
            max={25}
            onChange={setFamilyCount}
          />

          <div className="pt-3 border-t border-rs-border/60">
            <Stepper
              label="Household members with unknown status"
              value={unknownCount}
              min={0}
              max={25}
              onChange={setUnknownCount}
            />
            {unknownCount > 0 && (
              <p className="text-xs text-rs-warning font-semibold mt-1">
                {unknownCount} family member(s) flagged as status unknown.
              </p>
            )}
          </div>
        </Card>

        {/* Optional note for relatives or coordinators */}
        <Field label="Message for coordinators or relatives" optional>
          {(id, describedBy) => (
            <textarea
              id={id}
              aria-describedby={describedBy}
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Grandma is with us, all phones low on battery"
              className={`${inputClass} !h-auto py-3 resize-none`}
            />
          )}
        </Field>

        <PrimaryButton full type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            'Saving Status...'
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5" /> Submit Safety Check-in
            </>
          )}
        </PrimaryButton>
      </form>

      {/* Previous Check-in Log (Only Resident's Own Records) */}
      {existingCheckIns.length > 0 && (
        <div className="pt-4 space-y-2">
          <h3 className="text-sm font-bold text-rs-text uppercase tracking-wider">
            Your Previous Check-ins
          </h3>
          <div className="space-y-2">
            {existingCheckIns.slice(0, 3).map((ci) => (
              <Card key={ci.id} className="p-3 text-xs flex justify-between items-center">
                <div>
                  <span className="font-bold text-rs-text block">
                    {ci.status.replace(/_/g, ' ')} ({ci.familyCount} safe
                    {ci.unknownCount ? `, ${ci.unknownCount} unknown` : ''})
                  </span>
                  <span className="text-rs-muted">{ci.currentLocation}</span>
                </div>
                <div className="text-right">
                  <span className="text-rs-muted block">{formatTime(ci.timestamp)}</span>
                  <span className="text-[10px] text-rs-primary font-semibold">
                    {ci.isVerified ? 'Verified by coordinator' : 'Self-Reported'}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
