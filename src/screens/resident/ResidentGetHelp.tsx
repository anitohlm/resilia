/**
 * Resident Get Help Workflow ("What do you need help with?")
 * Designed for calm, clear, low-friction assistance requesting under extreme stress.
 * 
 * Progressive disclosure:
 * Step 1: Select need category (large tiles, 1 tap)
 * Step 2: Minimal details (Where, Headcount, Vulnerability/Mobility, Notes)
 * Step 3: Clear submission confirmation with persistent offline tracking.
 * Never claims rescue is dispatched until an official assignment is confirmed.
 */

import React, { useState } from 'react';
import {
  ArrowRight,
  Clock,
  MapPin,
  Phone,
  Send,
} from 'lucide-react';
import {
  EvacuationTransportIcon,
  FindSafePlaceIcon,
  FoodRationIcon,
  GetHelpIcon,
  MedicalClinicIcon,
  OtherHazardIcon,
  PotableWaterIcon,
} from '../../components/icons/ResidentIcons';
import {
  Card,
  CheckRow,
  ChoiceTile,
  DeliveryStatus,
  Field,
  inputClass,
  Notice,
  PrimaryButton,
  ScreenHeader,
  SecondaryButton,
  Stepper,
} from './ui';
import { HELP_CATEGORIES, helpCategoryLabel, requestStatusText } from './strings';
import { AssistanceCategory, AssistanceRequest, ConnectivityStatus } from '../../types';
import { useAuth } from '../../services/auth/authContext';
import { AssistanceRepository } from '../../services/repositories';
import { syncClient } from '../../services/offline/syncClient';
import { computeDelivery, shortRef, useSyncEvents } from './residentUtils';
import { useDeviceLocation } from './locationStore';
import { Navigate } from './ResidentApp';

interface ResidentGetHelpProps {
  onBack: () => void;
  navigate: Navigate;
  connectivity: ConnectivityStatus;
  onCreated?: () => void;
}

const HELP_ICONS: Record<AssistanceCategory, React.ReactNode> = {
  EMERGENCY_RESCUE: <GetHelpIcon className="w-6 h-6" />,
  EVACUATION: <EvacuationTransportIcon className="w-6 h-6" />,
  WATER: <PotableWaterIcon className="w-6 h-6" />,
  FOOD: <FoodRationIcon className="w-6 h-6" />,
  MEDICINE: <MedicalClinicIcon className="w-6 h-6" />,
  TRANSPORTATION: <EvacuationTransportIcon className="w-6 h-6" />,
  SHELTER: <FindSafePlaceIcon className="w-6 h-6" />,
  OTHER: <OtherHazardIcon className="w-6 h-6" />,
};

const HELP_CATEGORY_METADATA: Record<AssistanceCategory, { tone: 'default' | 'critical' | 'warning' | 'info' | 'success'; badge?: string }> = {
  EMERGENCY_RESCUE: { tone: 'critical', badge: 'High Priority' },
  EVACUATION: { tone: 'warning', badge: 'Urgent Action' },
  WATER: { tone: 'info', badge: 'Life Sustaining' },
  FOOD: { tone: 'warning', badge: 'Relief Ration' },
  MEDICINE: { tone: 'critical', badge: 'First Aid' },
  TRANSPORTATION: { tone: 'info', badge: 'Mobility' },
  SHELTER: { tone: 'success', badge: 'Safe Haven' },
  OTHER: { tone: 'default' },
};

export const ResidentGetHelp: React.FC<ResidentGetHelpProps> = ({
  onBack,
  navigate,
  connectivity,
  onCreated,
}) => {
  const { currentUser } = useAuth();
  const syncEvents = useSyncEvents();
  const { location, busy: locBusy, request: requestLoc } = useDeviceLocation();

  // Multi-step flow state
  const [selectedCategory, setSelectedCategory] = useState<AssistanceCategory | null>(null);
  const [peopleCount, setPeopleCount] = useState<number>(1);
  const [locationName, setLocationName] = useState<string>(
    currentUser.locationName || 'Purok 4, Tumana Dike Side'
  );
  const [contactPhone, setContactPhone] = useState<string>(
    currentUser.phone || '+63 920 555 0303'
  );
  const [notes, setNotes] = useState<string>('');

  // Voluntary vulnerability needs
  const [hasElderly, setHasElderly] = useState(false);
  const [elderlyCount, setElderlyCount] = useState(1);
  const [hasInfant, setHasInfant] = useState(false);
  const [infantCount, setInfantCount] = useState(1);
  const [wheelchairUser, setWheelchairUser] = useState(false);
  const [bedridden, setBedridden] = useState(false);
  const [urgentMedical, setUrgentMedical] = useState(false);
  const [medicalDetails, setMedicalDetails] = useState('');

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRequest, setSubmittedRequest] = useState<AssistanceRequest | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory) return;
    if (!locationName.trim()) {
      setSubmitError('Please provide a location so responders can find where assistance is needed.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const medList: string[] = [];
      if (urgentMedical && medicalDetails.trim()) {
        medList.push(medicalDetails.trim());
      }

      const req = await AssistanceRepository.createRequest(
        {
          residentId: currentUser.id,
          residentName: currentUser.name,
          contactPhone: contactPhone.trim(),
          peopleCount: Math.max(1, peopleCount),
          vulnerabilityNeeds: {
            elderlyCount: hasElderly ? Math.max(1, elderlyCount) : 0,
            infantCount: hasInfant ? Math.max(1, infantCount) : 0,
            wheelchairUser,
            bedridden,
            medicalNeeds: medList,
          },
          category: selectedCategory,
          description: notes.trim() || `${helpCategoryLabel(selectedCategory)} requested.`,
          locationName: locationName.trim(),
          lat: location?.lat || 14.6582,
          lng: location?.lng || 121.1018,
        },
        currentUser
      );

      // Trigger sync if connected
      if (connectivity === 'ONLINE') {
        syncClient.triggerSync().catch(() => undefined);
      }

      setSubmittedRequest(req);
      if (onCreated) onCreated();
    } catch (err: any) {
      setSubmitError(err?.message || 'Failed to submit assistance request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // If already submitted, display the confirmation view
  if (submittedRequest) {
    const delivery = computeDelivery(syncEvents, submittedRequest.id);
    const isSavedLocally = delivery.state !== 'DELIVERED';

    return (
      <div className="space-y-6 max-w-xl mx-auto">
        <ScreenHeader title="Assistance Request Recorded" onBack={onBack} />

        <Card className="p-6 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-rs-tint text-rs-primary flex items-center justify-center mx-auto">
            <GetHelpIcon className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-rs-text">
              {isSavedLocally ? 'Request Saved on this Device' : 'Request Submitted'}
            </h2>
            <p className="text-sm text-rs-muted mt-1 max-w-md mx-auto">
              {isSavedLocally
                ? 'Your request has been safely saved in Resilia offline storage. It has not yet reached your community coordinator.'
                : 'Your request has been received by the community disaster coordination center.'}
            </p>
          </div>

          <div className="pt-2">
            <DeliveryStatus info={delivery} />
          </div>

          {/* Request Reference Details */}
          <div className="bg-rs-bg p-4 rounded-xl text-left text-sm space-y-2 border border-rs-border">
            <div className="flex justify-between items-center pb-2 border-b border-rs-border/60">
              <span className="text-rs-muted">Reference Number</span>
              <span className="font-mono font-bold text-rs-text">{shortRef(submittedRequest.id)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-rs-muted">Assistance Needed</span>
              <span className="font-semibold text-rs-text">{helpCategoryLabel(submittedRequest.category)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-rs-muted">People Needing Help</span>
              <span className="font-semibold text-rs-text">{submittedRequest.peopleCount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-rs-muted">Location</span>
              <span className="font-semibold text-rs-text truncate max-w-[220px]">{submittedRequest.locationName}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-rs-border/60">
              <span className="text-rs-muted">Current System Status</span>
              <span className="font-semibold text-rs-primary">
                {requestStatusText(submittedRequest.status, !!submittedRequest.assignedMissionId)}
              </span>
            </div>
          </div>

          {/* What Happens Next Guidance */}
          <div className="text-left p-4 rounded-xl bg-amber-50/70 border border-amber-200/60 text-xs text-amber-900 space-y-1.5">
            <span className="font-bold block text-sm">What happens next?</span>
            <p>
              1. Community coordinators triage and verify urgent requests as updates are synced.
            </p>
            <p>
              2. Responders will only be assigned once approved by coordinators. Resilia never assumes help is on the way until verified.
            </p>
            <p>
              3. If you have immediate access to a phone or radio, you can also dial Marikina Rescue 161.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <PrimaryButton full onClick={onBack}>
              Return to Home
            </PrimaryButton>
            <SecondaryButton full onClick={() => navigate('RESOURCES_SHELTERS')}>
              View Shelters Nearby
            </SecondaryButton>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <ScreenHeader
        title="What do you need help with?"
        subtitle="Select a category to request emergency assistance"
        onBack={onBack}
      />

      {/* Step 1: Select Category */}
      {!selectedCategory ? (
        <div className="space-y-3.5" role="radiogroup" aria-label="Assistance Category">
          {HELP_CATEGORIES.map((c) => {
            const meta = HELP_CATEGORY_METADATA[c.cat] || { tone: 'default' };
            return (
              <ChoiceTile
                key={c.cat}
                icon={HELP_ICONS[c.cat]}
                label={c.label}
                hint={c.hint}
                tone={meta.tone}
                badge={meta.badge}
                onClick={() => setSelectedCategory(c.cat)}
              />
            );
          })}
        </div>
      ) : (
        /* Step 2: Minimal Necessary Information Collection */
        <form onSubmit={handleSubmit} className="space-y-5 animate-in fade-in">
          {/* Selected Category Banner */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-rs-tint border border-rs-primary/30">
            <div className="flex items-center gap-3">
              <span className="text-rs-primary">{HELP_ICONS[selectedCategory]}</span>
              <div>
                <span className="text-xs text-rs-muted block">Selected Category:</span>
                <span className="text-base font-bold text-rs-primary-dark">
                  {helpCategoryLabel(selectedCategory)}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedCategory(null)}
              className="text-xs font-semibold text-rs-primary underline px-2 py-1"
            >
              Change
            </button>
          </div>

          {/* Location field */}
          <Field
            label="Where is assistance needed?"
            hint="Provide your house number, street, or nearest landmark"
            error={submitError && !locationName.trim() ? submitError : undefined}
          >
            {(id, describedBy) => (
              <div className="space-y-2">
                <input
                  id={id}
                  aria-describedby={describedBy}
                  type="text"
                  required
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="e.g. 14 J.P. Rizal St., Malanday"
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={async () => {
                    const l = await requestLoc();
                    if (l) setLocationName(`Location pinned (${l.lat.toFixed(4)}, ${l.lng.toFixed(4)})`);
                  }}
                  disabled={locBusy}
                  className="text-xs font-semibold text-rs-primary inline-flex items-center gap-1.5 p-1 rounded hover:bg-rs-tint transition-colors"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  {locBusy ? 'Detecting device GPS...' : 'Use current device GPS coordinates (with permission)'}
                </button>
              </div>
            )}
          </Field>

          {/* People Count Stepper */}
          <Card className="p-4">
            <Stepper
              label="How many people need help?"
              value={peopleCount}
              min={1}
              max={30}
              onChange={setPeopleCount}
            />
          </Card>

          {/* Voluntary Vulnerability & Mobility Information */}
          <Card className="p-4 space-y-3">
            <div>
              <span className="text-base font-semibold text-rs-text block">
                Accessibility & Special Requirements
              </span>
              <span className="text-xs text-rs-muted block">
                Voluntary: Helps responders allocate rubber boats or accessible vehicles
              </span>
            </div>

            <CheckRow
              checked={wheelchairUser}
              onChange={setWheelchairUser}
              label="Person with physical disability or wheelchair user"
              hint="Requires ramped shelter or wheelchair-accessible transport"
            />

            <CheckRow
              checked={bedridden}
              onChange={setBedridden}
              label="Bedridden resident"
              hint="Requires stretcher extraction"
            />

            <CheckRow
              checked={hasElderly}
              onChange={setHasElderly}
              label="Older adults / Senior citizens present"
            />
            {hasElderly && (
              <div className="pl-4 pt-1">
                <Stepper
                  label="Number of senior citizens"
                  value={elderlyCount}
                  min={1}
                  max={peopleCount}
                  onChange={setElderlyCount}
                />
              </div>
            )}

            <CheckRow
              checked={hasInfant}
              onChange={setHasInfant}
              label="Infants or young children present"
            />
            {hasInfant && (
              <div className="pl-4 pt-1">
                <Stepper
                  label="Number of infants"
                  value={infantCount}
                  min={1}
                  max={peopleCount}
                  onChange={setInfantCount}
                />
              </div>
            )}

            <CheckRow
              checked={urgentMedical}
              onChange={setUrgentMedical}
              label="Critical medical condition or medication need"
            />
            {urgentMedical && (
              <div className="pl-4 pt-1">
                <input
                  type="text"
                  value={medicalDetails}
                  onChange={(e) => setMedicalDetails(e.target.value)}
                  placeholder="e.g. Insulin, dialysis maintenance, oxygen support"
                  className={inputClass}
                />
              </div>
            )}
          </Card>

          {/* Contact Phone */}
          <Field label="Contact Phone" hint="Used by coordinators to reach you">
            {(id, describedBy) => (
              <input
                id={id}
                aria-describedby={describedBy}
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+63 9xx xxx xxxx"
                className={inputClass}
              />
            )}
          </Field>

          {/* Additional details */}
          <Field label="Additional details" optional hint="Any other notes responders should know">
            {(id, describedBy) => (
              <textarea
                id={id}
                aria-describedby={describedBy}
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Flooded up to ground floor, waiting on 2nd floor balcony"
                className={`${inputClass} !h-auto py-3 resize-none`}
              />
            )}
          </Field>

          {submitError && (
            <Notice tone="critical" title="Cannot submit request">
              {submitError}
            </Notice>
          )}

          {/* Submit Button */}
          <div className="pt-2">
            <PrimaryButton full type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                'Submitting Request...'
              ) : (
                <>
                  <Send className="w-5 h-5" /> Submit Request
                </>
              )}
            </PrimaryButton>
            <p className="text-xs text-rs-muted text-center mt-2">
              All requests are saved on this device and delivered automatically when connectivity is available.
            </p>
          </div>
        </form>
      )}
    </div>
  );
};
