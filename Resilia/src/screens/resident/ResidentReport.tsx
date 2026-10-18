/**
 * Resident Report a Problem Workflow ("Report what is happening")
 * Clean, low-typing reporting interface for residents:
 * Prioritizes large intuitive hazard choices, optional location pinning, optional photo,
 * and saves records durably in IndexedDB with pending sync queuing.
 * Does not expose private personal info or exact private coordinates to the public map.
 */

import React, { useState } from 'react';
import {
  Camera,
  Clock,
  MapPin,
  Send,
} from 'lucide-react';
import {
  BuildingDamageIcon,
  EarthquakeHazardIcon,
  FireHazardIcon,
  FloodHazardIcon,
  LandslideHazardIcon,
  MedicalEmergencyIcon,
  OtherHazardIcon,
  PersonDistressIcon,
  PowerOutageIcon,
  ReportProblemIcon,
  RoadBlockedIcon,
  TsunamiHazardIcon,
  TyphoonHazardIcon,
  VolcanoHazardIcon,
} from '../../components/icons/ResidentIcons';
import {
  Card,
  ChoiceTile,
  DeliveryStatus,
  Field,
  inputClass,
  Notice,
  PrimaryButton,
  ScreenHeader,
  SecondaryButton,
} from './ui';
import { REPORT_TYPES, reportTypeLabel } from './strings';
import { ConnectivityStatus, Incident, IncidentSeverity, IncidentType } from '../../types';
import { useAuth } from '../../services/auth/authContext';
import { IncidentRepository } from '../../services/repositories';
import { syncClient } from '../../services/offline/syncClient';
import { computeDelivery, shortRef, useSyncEvents } from './residentUtils';
import { useDeviceLocation } from './locationStore';
import { Navigate } from './ResidentApp';

interface ResidentReportProps {
  onBack: () => void;
  navigate: Navigate;
  connectivity: ConnectivityStatus;
  onCreated?: () => void;
}

const TYPE_ICONS: Record<IncidentType, React.ReactNode> = {
  FLOOD: <FloodHazardIcon className="w-6 h-6" />,
  ROAD_BLOCKED: <RoadBlockedIcon className="w-6 h-6" />,
  BUILDING_DAMAGE: <BuildingDamageIcon className="w-6 h-6" />,
  FIRE: <FireHazardIcon className="w-6 h-6" />,
  POWER_OUTAGE: <PowerOutageIcon className="w-6 h-6" />,
  MEDICAL_EMERGENCY: <MedicalEmergencyIcon className="w-6 h-6" />,
  OTHER: <OtherHazardIcon className="w-6 h-6" />,
  EARTHQUAKE: <EarthquakeHazardIcon className="w-6 h-6" />,
  LANDSLIDE: <LandslideHazardIcon className="w-6 h-6" />,
  TYPHOON: <TyphoonHazardIcon className="w-6 h-6" />,
  VOLCANO_ERUPTION: <VolcanoHazardIcon className="w-6 h-6" />,
  TSUNAMI: <TsunamiHazardIcon className="w-6 h-6" />,
  PERSON_IN_DISTRESS: <PersonDistressIcon className="w-6 h-6" />,
};

const INCIDENT_TYPE_METADATA: Record<IncidentType, { tone: 'default' | 'critical' | 'warning' | 'info' | 'success'; badge?: string }> = {
  FLOOD: { tone: 'info', badge: 'Water Level' },
  ROAD_BLOCKED: { tone: 'warning', badge: 'Access Route' },
  BUILDING_DAMAGE: { tone: 'warning', badge: 'Structural' },
  FIRE: { tone: 'critical', badge: 'High Danger' },
  POWER_OUTAGE: { tone: 'warning', badge: 'Grid Failure' },
  MEDICAL_EMERGENCY: { tone: 'critical', badge: 'Urgent Life-Safety' },
  EARTHQUAKE: { tone: 'warning', badge: 'Seismic' },
  LANDSLIDE: { tone: 'critical', badge: 'Slope Failure' },
  TYPHOON: { tone: 'info', badge: 'Storm Surge' },
  VOLCANO_ERUPTION: { tone: 'warning', badge: 'Ashfall' },
  TSUNAMI: { tone: 'critical', badge: 'Coast Hazard' },
  PERSON_IN_DISTRESS: { tone: 'critical', badge: 'Rescue Needed' },
  OTHER: { tone: 'default' },
};

export const ResidentReport: React.FC<ResidentReportProps> = ({
  onBack,
  navigate,
  connectivity,
  onCreated,
}) => {
  const { currentUser } = useAuth();
  const syncEvents = useSyncEvents();
  const { location, busy: locBusy, request: requestLoc } = useDeviceLocation();

  const [incidentType, setIncidentType] = useState<IncidentType | null>(null);
  const [locationName, setLocationName] = useState(
    currentUser.locationName || 'Purok 4, Tumana Dike Side'
  );
  const [description, setDescription] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [severity, setSeverity] = useState<IncidentSeverity>('MEDIUM');
  const [floodDepthCm, setFloodDepthCm] = useState<number | undefined>(undefined);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedIncident, setSubmittedIncident] = useState<Incident | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incidentType) return;
    if (!locationName.trim()) {
      setSubmitError('Please specify the location of the incident.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const created = await IncidentRepository.createIncident(
        {
          type: incidentType,
          title: `${reportTypeLabel(incidentType)} at ${locationName.trim()}`,
          description: description.trim() || `Reported ${reportTypeLabel(incidentType)} by resident.`,
          locationName: locationName.trim(),
          lat: location?.lat || 14.658,
          lng: location?.lng || 121.102,
          reporterId: currentUser.id,
          reporterName: currentUser.name,
          reporterRole: currentUser.role,
          severity,
          status: 'REPORTED',
          floodDepthCm: incidentType === 'FLOOD' ? floodDepthCm : undefined,
          photoUrl: photoUrl.trim() || undefined,
        },
        currentUser
      );

      // Trigger sync if connected
      if (connectivity === 'ONLINE') {
        syncClient.triggerSync().catch(() => undefined);
      }

      setSubmittedIncident(created);
      if (onCreated) onCreated();
    } catch (err: any) {
      setSubmitError(err?.message || 'Failed to record report.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submittedIncident) {
    const delivery = computeDelivery(syncEvents, submittedIncident.id);
    const isSavedLocally = delivery.state !== 'DELIVERED';

    return (
      <div className="space-y-6 max-w-xl mx-auto">
        <ScreenHeader title="Report Recorded" onBack={onBack} />

        <Card className="p-6 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-rs-tint text-rs-primary flex items-center justify-center mx-auto">
            <ReportProblemIcon className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-rs-text">
              {isSavedLocally ? 'Report Saved on this Device' : 'Report Received'}
            </h2>
            <p className="text-sm text-rs-muted mt-1 max-w-md mx-auto">
              {isSavedLocally
                ? 'Your incident observation has been stored offline. It has not yet reached community coordinators.'
                : 'Thank you for keeping your community informed. Your report is now available to coordinators.'}
            </p>
          </div>

          <div className="pt-1">
            <DeliveryStatus info={delivery} />
          </div>

          <div className="bg-rs-bg p-4 rounded-xl text-left text-sm space-y-2 border border-rs-border">
            <div className="flex justify-between items-center pb-2 border-b border-rs-border/60">
              <span className="text-rs-muted">Report Reference</span>
              <span className="font-mono font-bold text-rs-text">{shortRef(submittedIncident.id)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-rs-muted">Type</span>
              <span className="font-semibold text-rs-text">{reportTypeLabel(submittedIncident.type)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-rs-muted">Location</span>
              <span className="font-semibold text-rs-text truncate max-w-[220px]">{submittedIncident.locationName}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-rs-border/60">
              <span className="text-rs-muted">Verification Status</span>
              <span className="font-semibold text-amber-700">
                Awaiting coordinator verification
              </span>
            </div>
          </div>

          <Notice tone="info">
            Submitting a community report alerts coordinators, but does not guarantee immediate deployment or dispatch.
            Your privacy is protected: personal phone numbers and private exact locations are never published publicly.
          </Notice>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <PrimaryButton full onClick={onBack}>
              Return to Home
            </PrimaryButton>
            <SecondaryButton full onClick={() => navigate('MAP')}>
              View Community Map
            </SecondaryButton>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <ScreenHeader
        title="Report what is happening"
        subtitle="Help coordinators and neighbors know about hazards"
        onBack={onBack}
      />

      {/* Step 1: Select Type */}
      {!incidentType ? (
        <div className="space-y-3.5" role="radiogroup" aria-label="Incident Type">
          {REPORT_TYPES.map((t) => {
            const meta = INCIDENT_TYPE_METADATA[t.type] || { tone: 'default' };
            return (
              <ChoiceTile
                key={t.type}
                icon={TYPE_ICONS[t.type]}
                label={t.label}
                tone={meta.tone}
                badge={meta.badge}
                onClick={() => setIncidentType(t.type)}
              />
            );
          })}
        </div>
      ) : (
        /* Step 2: Minimal details */
        <form onSubmit={handleSubmit} className="space-y-5 animate-in fade-in">
          {/* Header pill */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-rs-tint border border-rs-primary/30">
            <div className="flex items-center gap-2.5">
              <span className="text-rs-primary">{TYPE_ICONS[incidentType]}</span>
              <div>
                <span className="text-xs text-rs-muted block">Reporting Hazard:</span>
                <span className="text-base font-bold text-rs-primary-dark">
                  {reportTypeLabel(incidentType)}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIncidentType(null)}
              className="text-xs font-semibold text-rs-primary underline px-2 py-1"
            >
              Change
            </button>
          </div>

          {/* Location field */}
          <Field
            label="Location of the incident"
            hint="Street, landmark, or intersection"
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
                  placeholder="e.g. Corner of Tumana Dike & Malanday"
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={async () => {
                    const l = await requestLoc();
                    if (l) setLocationName(`GPS location attached (${l.lat.toFixed(4)}, ${l.lng.toFixed(4)})`);
                  }}
                  disabled={locBusy}
                  className="text-xs font-semibold text-rs-primary inline-flex items-center gap-1.5 p-1 rounded hover:bg-rs-tint transition-colors"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  {locBusy ? 'Reading GPS...' : 'Attach device GPS coordinates (with permission)'}
                </button>
              </div>
            )}
          </Field>

          {/* If flood: Depth selector */}
          {incidentType === 'FLOOD' && (
            <Card className="p-4 space-y-2">
              <label className="block text-base font-semibold text-rs-text">
                Estimated Flood Depth (Optional)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Ankle deep', cm: 20 },
                  { label: 'Knee deep', cm: 50 },
                  { label: 'Waist deep', cm: 100 },
                  { label: 'Chest deep', cm: 140 },
                  { label: 'Submerged', cm: 200 },
                ].map((d) => (
                  <button
                    key={d.cm}
                    type="button"
                    onClick={() => setFloodDepthCm(d.cm)}
                    className={`p-2.5 rounded-xl text-xs font-semibold border transition-colors ${
                      floodDepthCm === d.cm
                        ? 'bg-rs-tint border-rs-primary text-rs-primary-dark ring-1 ring-rs-primary'
                        : 'bg-rs-bg border-rs-border text-rs-text hover:bg-rs-card'
                    }`}
                  >
                    {d.label} (~{d.cm}cm)
                  </button>
                ))}
              </div>
            </Card>
          )}

          {/* Optional description */}
          <Field label="What are you observing?" optional hint="Describe what you see">
            {(id, describedBy) => (
              <textarea
                id={id}
                aria-describedby={describedBy}
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Water is slowly entering the street, road impassable to light vehicles"
                className={`${inputClass} !h-auto py-3 resize-none`}
              />
            )}
          </Field>

          {/* Optional photo URL / Preset */}
          <Field label="Photo link / evidence" optional hint="Optional image URL or evidence photo">
            {(id, describedBy) => (
              <div className="space-y-2">
                <input
                  id={id}
                  aria-describedby={describedBy}
                  type="url"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="https://..."
                  className={inputClass}
                />
              </div>
            )}
          </Field>

          {submitError && (
            <Notice tone="critical" title="Cannot submit report">
              {submitError}
            </Notice>
          )}

          <div className="pt-2">
            <PrimaryButton full type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                'Saving Report...'
              ) : (
                <>
                  <Send className="w-5 h-5" /> Submit Report
                </>
              )}
            </PrimaryButton>
            <p className="text-xs text-rs-muted text-center mt-2">
              Saved locally on this device. Synchronized automatically when connectivity is available.
            </p>
          </div>
        </form>
      )}
    </div>
  );
};
