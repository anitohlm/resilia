/**
 * Resident Home Screen
 * Answers the 5 essential questions at a glance:
 * 1. Is there an official emergency alert?
 * 2. Is Resilia working without internet?
 * 3. How can I get help?
 * 4. Where can I find shelter or essential resources?
 * 5. What should I do next?
 *
 * Excludes technical dashboards, river sensor monitoring clusters, command stats,
 * and internal registries. Plain language river conditions are kept in an optional
 * "Local Conditions" expandable section.
 */

import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  MapPin,
  Radio,
  QrCode,
  Users,
  HeartHandshake,
  Droplets,
} from 'lucide-react';
import {
  FindSafePlaceIcon,
  GetHelpIcon,
  MarkSafeIcon,
  ReportProblemIcon,
} from '../../components/icons/ResidentIcons';
import { Alert, Shelter } from '../../types';
import { Card, LinkButton, Notice, SectionTitle } from './ui';
import { t } from './strings';
import {
  currentAlerts,
  formatTime,
  isSimulatedSensor,
  isStale,
  RIVER_ALERT_THRESHOLD_M,
  timeAgo,
} from './residentUtils';
import { AlertCard, AlertDetailsDialog, SensorDiscrepancy } from './ResidentAlerts';
import { ShelterDetailsDialog, ShelterRow } from './ShelterInfo';
import { useDeviceLocation } from './locationStore';
import { Navigate, ResidentData } from './ResidentApp';
import { GoBagChecklistCard } from '../../components/safety/GoBagChecklistCard';
import { GoBagChecklistModal } from '../../components/safety/GoBagChecklistModal';
import { EmergencySurvivalBeaconModal } from '../../components/safety/EmergencySurvivalBeaconModal';
import { HouseholdAyudaCardModal } from '../../components/ayuda/HouseholdAyudaCardModal';
import { MissingKinModal } from '../../components/kin/MissingKinModal';
import { BayanihanBoardModal } from '../../components/bayanihan/BayanihanBoardModal';
import { DiseaseOutbreakWatchModal } from '../../components/health/DiseaseOutbreakWatchModal';

interface ResidentHomeProps extends ResidentData {
  navigate: Navigate;
}

export const ResidentHome: React.FC<ResidentHomeProps> = (props) => {
  const { navigate } = props;
  const { location, error: locError, busy: locBusy, request: requestLoc } = useDeviceLocation();

  const alerts = currentAlerts(props.alerts);
  const topAlert: Alert | undefined = alerts[0];
  const incomingAdvisory = alerts.find(
    (a) => (typeof a.daysUntilLandfall === 'number' || !!a.disasterName) && a.id !== topAlert?.id
  );
  const [activeAlert, setActiveAlert] = useState<Alert | null>(null);
  const [selectedShelter, setSelectedShelter] = useState<Shelter | null>(null);
  const [showConditions, setShowConditions] = useState(false);
  const [isGoBagModalOpen, setIsGoBagModalOpen] = useState(false);
  const [isBeaconOpen, setIsBeaconOpen] = useState(false);
  const [isAyudaOpen, setIsAyudaOpen] = useState(false);
  const [isMissingKinOpen, setIsMissingKinOpen] = useState(false);
  const [isBayanihanOpen, setIsBayanihanOpen] = useState(false);
  const [isOutbreakOpen, setIsOutbreakOpen] = useState(false);

  const isOffline = props.connectivity === 'OFFLINE';

  // Nearby Help: top 3 available shelters (open or near capacity first)
  const nearbyShelters = [...props.shelters]
    .sort((a, b) => {
      const rank = { OPEN: 0, NEAR_CAPACITY: 1, FULL: 2, CLOSED: 3 };
      return rank[a.status] - rank[b.status];
    })
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* A. Welcome Banner */}
      <section aria-labelledby="resident-welcome">
        <h1 id="resident-welcome" className="text-2xl sm:text-3xl font-extrabold text-rs-text leading-tight">
          {t.greeting}
        </h1>
        <p className="text-base text-rs-muted mt-1">
          Resilia helps you stay safe, find nearby supplies, and ask for help.
        </p>
      </section>

      {/* B. Emergency Alert Banner (High-visibility, compact, verified only) */}
      {topAlert && (
        <AlertCard
          alert={topAlert}
          isOffline={isOffline}
          moreCount={incomingAdvisory ? Math.max(0, alerts.length - 2) : Math.max(0, alerts.length - 1)}
          onOpen={() => setActiveAlert(topAlert)}
          onSeeAll={() => navigate('UPDATES')}
        />
      )}

      {/* B.2. Incoming Typhoon & Disaster Advisory (if different from top alert) */}
      {incomingAdvisory && (
        <AlertCard
          alert={incomingAdvisory}
          isOffline={isOffline}
          onOpen={() => setActiveAlert(incomingAdvisory)}
          onSeeAll={() => navigate('UPDATES')}
        />
      )}

      {/* C. Four Primary Emergency Actions (Immediately visible on home screen) */}
      <section aria-labelledby="quick-actions-heading">
        <h2 id="quick-actions-heading" className="sr-only">
          Emergency Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* 1. GET HELP */}
          <button
            type="button"
            onClick={() => navigate('REQUEST_ASSISTANCE')}
            className="flex items-start gap-4 p-5 rounded-2xl bg-rs-card border border-rs-border hover:border-rs-primary/40 hover:bg-rs-tint/20 text-left transition-all shadow-xs group min-h-[92px]"
          >
            <span
              className="w-12 h-12 rounded-full bg-rose-50 text-rs-critical flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform"
              aria-hidden
            >
              <GetHelpIcon className="w-6 h-6" />
            </span>
            <div className="min-w-0 flex-1">
              <span className="block text-lg font-bold text-rs-text group-hover:text-rs-primary-dark transition-colors">
                GET HELP
              </span>
              <span className="block text-sm text-rs-muted mt-0.5">
                Request emergency rescue, food, water, or evacuation assistance
              </span>
            </div>
          </button>

          {/* 2. FIND A SAFE PLACE */}
          <button
            type="button"
            onClick={() => navigate('RESOURCES_SHELTERS')}
            className="flex items-start gap-4 p-5 rounded-2xl bg-rs-card border border-rs-border hover:border-rs-primary/40 hover:bg-rs-tint/20 text-left transition-all shadow-xs group min-h-[92px]"
          >
            <span
              className="w-12 h-12 rounded-full bg-rs-tint text-rs-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform"
              aria-hidden
            >
              <FindSafePlaceIcon className="w-6 h-6" />
            </span>
            <div className="min-w-0 flex-1">
              <span className="block text-lg font-bold text-rs-text group-hover:text-rs-primary-dark transition-colors">
                FIND A SAFE PLACE
              </span>
              <span className="block text-sm text-rs-muted mt-0.5">
                Find evacuation centers, water distribution points, and resources
              </span>
            </div>
          </button>

          {/* 3. REPORT A PROBLEM */}
          <button
            type="button"
            onClick={() => navigate('REPORT_INCIDENT')}
            className="flex items-start gap-4 p-5 rounded-2xl bg-rs-card border border-rs-border hover:border-rs-primary/40 hover:bg-rs-tint/20 text-left transition-all shadow-xs group min-h-[92px]"
          >
            <span
              className="w-12 h-12 rounded-full bg-amber-50 text-rs-warning flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform"
              aria-hidden
            >
              <ReportProblemIcon className="w-6 h-6" />
            </span>
            <div className="min-w-0 flex-1">
              <span className="block text-lg font-bold text-rs-text group-hover:text-rs-primary-dark transition-colors">
                REPORT A PROBLEM
              </span>
              <span className="block text-sm text-rs-muted mt-0.5">
                Report street flooding, blocked roads, or infrastructure damage
              </span>
            </div>
          </button>

          {/* 4. MARK ME SAFE */}
          <button
            type="button"
            onClick={() => navigate('MARK_SAFE')}
            className="flex items-start gap-4 p-5 rounded-2xl bg-rs-card border border-rs-border hover:border-rs-primary/40 hover:bg-rs-tint/20 text-left transition-all shadow-xs group min-h-[92px]"
          >
            <span
              className="w-12 h-12 rounded-full bg-emerald-50 text-rs-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform"
              aria-hidden
            >
              <MarkSafeIcon className="w-6 h-6" />
            </span>
            <div className="min-w-0 flex-1">
              <span className="block text-lg font-bold text-rs-text group-hover:text-rs-primary-dark transition-colors">
                MARK ME SAFE
              </span>
              <span className="block text-sm text-rs-muted mt-0.5">
                Check in your family safety status with community coordinators
              </span>
            </div>
          </button>
        </div>
      </section>

      {/* C.1. Survival Strobe & Acoustic Beacon (1-tap life safety for trapped residents) */}
      <button
        type="button"
        onClick={() => setIsBeaconOpen(true)}
        className="w-full flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-rose-900/90 to-red-800 text-white border border-rose-500/40 shadow-sm hover:from-rose-800 hover:to-red-700 active:scale-[0.99] transition-all group"
      >
        <div className="flex items-center gap-3.5">
          <span className="w-11 h-11 rounded-full bg-rose-500/30 border border-rose-400/40 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Radio className="w-5 h-5 text-rose-300 animate-pulse" />
          </span>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base font-black tracking-wide font-mono uppercase">
                SOS SURVIVAL BEACON
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-rose-500/40 text-rose-200 border border-rose-400/30">
                Offline
              </span>
            </div>
            <p className="text-xs text-rose-200/90 mt-0.5">
              High-intensity screen strobe & acoustic SOS horn to signal rescue boats
            </p>
          </div>
        </div>
        <div className="shrink-0 text-xs font-mono font-bold bg-white text-rose-950 px-3 py-1.5 rounded-xl group-hover:bg-rose-100 transition-colors">
          LAUNCH
        </div>
      </button>

      {/* D. Emergency Go-Bag Evacuation Checklist (Resident Home Dashboard) */}
      <GoBagChecklistCard
        variant="resident"
        onOpenFullModal={() => setIsGoBagModalOpen(true)}
      />

      {/* D.1. Community Relief & Resilience Quick Bar */}
      <section aria-labelledby="resilience-quick-actions" className="space-y-2">
        <h2 id="resilience-quick-actions" className="text-xs font-bold text-rs-muted uppercase tracking-wider px-1">
          Community Relief & Resilience
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            type="button"
            onClick={() => setIsAyudaOpen(true)}
            className="p-3.5 rounded-2xl bg-rs-card border border-rs-border hover:border-emerald-500 hover:bg-emerald-50/30 text-left transition-all shadow-2xs group"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <QrCode className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-rs-text group-hover:text-emerald-800 transition-colors">
              Ayuda Pass
            </div>
            <div className="text-[11px] text-rs-muted mt-0.5 line-clamp-1">
              QR claim card
            </div>
          </button>

          <button
            type="button"
            onClick={() => setIsMissingKinOpen(true)}
            className="p-3.5 rounded-2xl bg-rs-card border border-rs-border hover:border-indigo-500 hover:bg-indigo-50/30 text-left transition-all shadow-2xs group"
          >
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Users className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-rs-text group-hover:text-indigo-800 transition-colors">
              Missing Kin
            </div>
            <div className="text-[11px] text-rs-muted mt-0.5 line-clamp-1">
              Find relatives
            </div>
          </button>

          <button
            type="button"
            onClick={() => setIsBayanihanOpen(true)}
            className="p-3.5 rounded-2xl bg-rs-card border border-rs-border hover:border-purple-500 hover:bg-purple-50/30 text-left transition-all shadow-2xs group"
          >
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <HeartHandshake className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-rs-text group-hover:text-purple-800 transition-colors">
              Bayanihan Aid
            </div>
            <div className="text-[11px] text-rs-muted mt-0.5 line-clamp-1">
              Skills & tools
            </div>
          </button>

          <button
            type="button"
            onClick={() => setIsOutbreakOpen(true)}
            className="p-3.5 rounded-2xl bg-rs-card border border-rs-border hover:border-teal-500 hover:bg-teal-50/30 text-left transition-all shadow-2xs group"
          >
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Droplets className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-rs-text group-hover:text-teal-800 transition-colors">
              Outbreak Watch
            </div>
            <div className="text-[11px] text-rs-muted mt-0.5 line-clamp-1">
              Leptospirosis
            </div>
          </button>
        </div>
      </section>

      {/* E. Local Community Information: "Nearby Help" */}
      <section aria-labelledby="nearby-help-heading">
        <SectionTitle
          id="nearby-help-heading"
          action={
            <LinkButton onClick={() => navigate('RESOURCES_SHELTERS')}>
              See all ({props.shelters.length}) <ChevronRight className="w-4 h-4" aria-hidden />
            </LinkButton>
          }
        >
          Nearby Help
        </SectionTitle>

        {!location && (
          <div className="mb-3">
            <button
              type="button"
              onClick={requestLoc}
              disabled={locBusy}
              className="text-sm font-semibold text-rs-primary inline-flex items-center gap-1.5 p-2 rounded-xl hover:bg-rs-tint transition-colors"
            >
              <MapPin className="w-4 h-4" aria-hidden />
              {locBusy ? 'Locating device...' : 'Enable location to calculate distances'}
            </button>
            {locError && <p className="text-xs text-rs-muted mt-1 px-2">{locError}</p>}
          </div>
        )}

        <div className="space-y-3">
          {nearbyShelters.map((shelter) => (
            <ShelterRow
              key={shelter.id}
              shelter={shelter}
              location={location}
              onDetails={() => setSelectedShelter(shelter)}
            />
          ))}
          {nearbyShelters.length === 0 && (
            <Card className="p-5 text-center text-rs-muted">
              No registered evacuation facilities recorded in this sector yet.
            </Card>
          )}
        </div>
      </section>

      {/* F. Plain-language Local Conditions (Collapsible, no technical jargon) */}
      {props.community && (
        <section aria-labelledby="local-conditions-heading">
          <Card className="overflow-hidden">
            <button
              type="button"
              onClick={() => setShowConditions((prev) => !prev)}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-rs-bg/60 transition-colors"
            >
              <div className="flex items-center gap-2">
                <h3 id="local-conditions-heading" className="text-base font-bold text-rs-text">
                  Local River & Weather Conditions
                </h3>
                <span className="text-xs text-rs-muted">
                  (Updated {timeAgo(props.community.lastUpdated)})
                </span>
              </div>
              <ChevronDown
                className={`w-5 h-5 text-rs-muted transition-transform duration-200 ${
                  showConditions ? 'rotate-180' : ''
                }`}
                aria-hidden
              />
            </button>

            {showConditions && (
              <div className="p-4 pt-0 border-t border-rs-border/60 text-[15px] space-y-3 mt-3">
                <SensorDiscrepancy community={props.community} alerts={props.alerts} />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="p-3 rounded-xl bg-rs-bg">
                    <span className="text-xs text-rs-muted block">River Water Level</span>
                    <span className="text-base font-bold text-rs-text">
                      {typeof props.community.riverWaterLevelMeters === 'number'
                        ? `${props.community.riverWaterLevelMeters.toFixed(1)} meters`
                        : 'Unavailable'}
                    </span>
                    <span className="text-xs text-rs-muted block mt-0.5">
                      {props.community.riverWaterLevelMeters >= RIVER_ALERT_THRESHOLD_M
                        ? 'At or above alert threshold'
                        : 'Below alert threshold at time of reading'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-rs-bg">
                    <span className="text-xs text-rs-muted block">Weather & Rainfall</span>
                    <span className="text-base font-bold text-rs-text">
                      {props.community.weatherCondition || 'Normal conditions'}
                    </span>
                    <span className="text-xs text-rs-muted block mt-0.5">
                      {props.community.rainfallStatus || 'No advisory'}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-rs-muted">
                  Source: {props.community.source}
                  {isSimulatedSensor(props.community) && ' (Simulated demo telemetry stream)'}
                </div>

                <Notice tone="neutral">
                  Resilia never determines an area is safe solely because a sensor is below an alert threshold.
                  Always follow official advisories from your local barangay disaster risk reduction office.
                </Notice>
              </div>
            )}
          </Card>
        </section>
      )}

      {/* Modals & Dialogs */}
      <AlertDetailsDialog
        alert={activeAlert}
        community={props.community}
        isOffline={isOffline}
        onClose={() => setActiveAlert(null)}
        onFindShelter={() => {
          setActiveAlert(null);
          navigate('RESOURCES_SHELTERS');
        }}
        onGetHelp={() => {
          setActiveAlert(null);
          navigate('REQUEST_ASSISTANCE');
        }}
        onOpenGoBag={() => {
          setActiveAlert(null);
          setIsGoBagModalOpen(true);
        }}
      />

      <ShelterDetailsDialog
        shelter={selectedShelter}
        location={location}
        onClose={() => setSelectedShelter(null)}
        onViewMap={() => {
          setSelectedShelter(null);
          navigate('MAP');
        }}
      />

      <GoBagChecklistModal
        isOpen={isGoBagModalOpen}
        onClose={() => setIsGoBagModalOpen(false)}
      />

      <EmergencySurvivalBeaconModal
        isOpen={isBeaconOpen}
        onClose={() => setIsBeaconOpen(false)}
      />

      <HouseholdAyudaCardModal
        isOpen={isAyudaOpen}
        onClose={() => setIsAyudaOpen(false)}
      />

      <MissingKinModal
        isOpen={isMissingKinOpen}
        onClose={() => setIsMissingKinOpen(false)}
      />

      <BayanihanBoardModal
        isOpen={isBayanihanOpen}
        onClose={() => setIsBayanihanOpen(false)}
      />

      <DiseaseOutbreakWatchModal
        isOpen={isOutbreakOpen}
        onClose={() => setIsOutbreakOpen(false)}
      />
    </div>
  );
};
