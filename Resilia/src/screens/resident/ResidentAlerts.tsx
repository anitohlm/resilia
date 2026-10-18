/**
 * Resident alert presentation.
 * - Only active, unexpired alerts are shown.
 * - Exercises/demo alerts are always labelled as such.
 * - Old or cached alerts show their timestamp and a stale-data notice.
 * - Official advisories are kept separate from sensor readings; discrepancies are surfaced, never auto-resolved.
 */

import React from 'react';
import { ChevronRight, Info } from 'lucide-react';
import { EmergencyAlertIcon } from '../../components/icons/ResidentIcons';
import { Alert, Community } from '../../types';
import { cx, Dialog, Notice, PrimaryButton, StatusPill } from './ui';
import { formatTime, isExerciseAlert, isStale, RIVER_ALERT_THRESHOLD_M, timeAgo } from './residentUtils';

const sevStyle = {
  CRITICAL: { wrap: 'bg-rs-critical-bg border-rs-critical/40', icon: 'text-rs-critical', label: 'Emergency alert' },
  WARNING: { wrap: 'bg-rs-warning-bg border-rs-warning/40', icon: 'text-rs-warning', label: 'Warning' },
  INFO: { wrap: 'bg-rs-info-bg border-rs-info/30', icon: 'text-rs-info', label: 'Advisory' },
} as const;

/** Strip shouting caps from official titles for readability while keeping the content. */
export function readableTitle(title: string): string {
  const letters = title.replace(/[^A-Za-z]/g, '');
  const upper = letters.replace(/[^A-Z]/g, '').length;
  if (letters.length > 6 && upper / letters.length > 0.8) {
    const lower = title.toLowerCase();
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  }
  return title;
}

export const AlertCard: React.FC<{
  alert: Alert;
  isOffline: boolean;
  moreCount?: number;
  onOpen: () => void;
  onSeeAll?: () => void;
}> = ({ alert, isOffline, moreCount = 0, onOpen, onSeeAll }) => {
  const s = sevStyle[alert.severity];
  const exercise = isExerciseAlert(alert);
  const stale = isStale(alert.issuedAt);
  const hasLandfall = typeof alert.daysUntilLandfall === 'number';

  return (
    <section aria-labelledby={`alert-${alert.id}`} className={cx('rounded-2xl border p-4 shadow-xs', s.wrap)}>
      <div className="flex items-start gap-3">
        <EmergencyAlertIcon className={cx('w-6 h-6 shrink-0 mt-0.5', s.icon)} aria-hidden="true" />
        <div className="min-w-0 flex-1">
          {/* Top badges: Emergency severity, Landfall countdown, Signal */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2">
            <span className={cx('text-xs font-extrabold uppercase tracking-wide shrink-0 px-2 py-0.5 rounded-md bg-white/70 shadow-2xs', s.icon)}>
              {s.label}
            </span>

            {/* Incoming disaster landfall countdown badge */}
            {typeof alert.daysUntilLandfall === 'number' && (
              <span
                className={cx(
                  'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold text-white shadow-2xs',
                  alert.daysUntilLandfall === 0
                    ? 'bg-rose-600 animate-pulse'
                    : alert.daysUntilLandfall === 1
                    ? 'bg-rose-500'
                    : 'bg-amber-600'
                )}
              >
                <span>
                  {alert.daysUntilLandfall === 0
                    ? '🔴 Landfall Imminent (<24h)'
                    : `⏳ Landfall in ${alert.daysUntilLandfall} day${alert.daysUntilLandfall > 1 ? 's' : ''}`}
                </span>
              </span>
            )}

            {/* TCWS Wind Signal badge */}
            {typeof alert.signalLevel === 'number' && alert.signalLevel > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-neutral-900 text-white shadow-2xs">
                Signal #{alert.signalLevel}
              </span>
            )}

            {/* Disaster name */}
            {alert.disasterName && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-white/90 text-neutral-800 border border-neutral-300 shadow-2xs">
                🌀 {alert.disasterName}
              </span>
            )}

            {exercise && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rs-info-bg text-rs-info text-xs font-semibold">
                <Info className="w-3.5 h-3.5 shrink-0" aria-hidden />
                <span>Exercise / demo</span>
              </span>
            )}
          </div>

          <h2 id={`alert-${alert.id}`} className="text-lg font-bold text-rs-text leading-snug">
            {readableTitle(alert.title)}
          </h2>

          <p className="text-[15px] text-rs-text/90 mt-1 line-clamp-3 leading-relaxed">{alert.message}</p>

          {/* Affected sectors snippet */}
          {alert.affectedZones && alert.affectedZones.length > 0 && (
            <p className="text-xs font-semibold text-neutral-700 mt-2">
              <span className="text-neutral-500">Affected Sectors: </span>
              {alert.affectedZones.join(' • ')}
            </p>
          )}

          {/* Preparations needed preview */}
          {alert.preparations && alert.preparations.length > 0 && (
            <div className="mt-2.5 p-2.5 rounded-xl bg-white/80 border border-rs-border/60 text-xs text-neutral-800 space-y-1">
              <div className="font-bold text-neutral-900 flex items-center justify-between">
                <span>Preparations Needed Before Impact:</span>
                <span className="text-[10px] text-rs-primary font-bold">
                  {alert.preparations.length} action steps
                </span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-neutral-700 pl-0.5">
                {alert.preparations.slice(0, 2).map((p, i) => (
                  <li key={i} className="truncate">{p}</li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-xs text-rs-muted mt-2">
            Issued by {alert.source} · {formatTime(alert.issuedAt)}
          </p>

          {(stale || isOffline) && (
            <p className="text-xs font-semibold text-rs-warning mt-1">
              {isOffline ? 'Saved copy — ' : ''}issued {timeAgo(alert.issuedAt)}. It may be outdated; check with your barangay if you can.
            </p>
          )}
        </div>
      </div>

      <div className="mt-3.5 flex flex-wrap items-center gap-2">
        <PrimaryButton onClick={onOpen} className="!min-h-[46px] !px-4 shadow-xs">
          View safety preparations & instructions
        </PrimaryButton>
        {moreCount > 0 && onSeeAll && (
          <button
            type="button"
            onClick={onSeeAll}
            className="min-h-[46px] px-3 text-sm font-semibold text-rs-text inline-flex items-center gap-1 hover:underline"
          >
            {moreCount} more alert{moreCount > 1 ? 's' : ''} <ChevronRight className="w-4 h-4" aria-hidden />
          </button>
        )}
      </div>
    </section>
  );
};

export const AlertDetailsDialog: React.FC<{
  alert: Alert | null;
  community: Community | null;
  isOffline: boolean;
  onClose: () => void;
  onFindShelter: () => void;
  onGetHelp: () => void;
}> = ({ alert, community, isOffline, onClose, onFindShelter, onGetHelp }) => {
  if (!alert) return null;
  const exercise = isExerciseAlert(alert);
  const hasLandfall = typeof alert.daysUntilLandfall === 'number';

  return (
    <Dialog
      open={!!alert}
      onClose={onClose}
      title={readableTitle(alert.title)}
      footer={
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <PrimaryButton full onClick={onFindShelter}>
            Find a safe place
          </PrimaryButton>
          <button
            type="button"
            onClick={onGetHelp}
            className="min-h-[52px] rounded-xl border border-rs-border text-base font-semibold text-rs-text hover:bg-neutral-50 transition"
          >
            Get help
          </button>
        </div>
      }
    >
      {/* Landfall Banner if incoming disaster */}
      {hasLandfall && (
        <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-300 text-amber-950 space-y-1">
          <div className="flex items-center justify-between font-bold text-sm">
            <span className="flex items-center gap-1.5">
              <span>⏳ Expected Landfall:</span>
              <strong className="text-amber-900">
                {alert.daysUntilLandfall === 0
                  ? 'Today (Imminent within 24 hours)'
                  : `${alert.daysUntilLandfall} day(s) from now`}
              </strong>
            </span>
            {typeof alert.signalLevel === 'number' && alert.signalLevel > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-neutral-900 text-white text-[11px] font-mono">
                TCWS Signal #{alert.signalLevel}
              </span>
            )}
          </div>
          {alert.expectedLandfall && (
            <p className="text-xs text-amber-800">
              Impact Timeline: <strong>{alert.expectedLandfall}</strong>
            </p>
          )}
        </div>
      )}

      {exercise && (
        <Notice tone="info" title="This is an exercise or demonstration">
          It is sample data used to show how Resilia works. It is not a real emergency.
        </Notice>
      )}

      <div>
        <h3 className="text-base font-semibold text-rs-text">Official Guidance</h3>
        <p className="mt-1 leading-relaxed whitespace-pre-line text-[15px]">{alert.message}</p>
      </div>

      {/* Recommended Preparations List */}
      {alert.preparations && alert.preparations.length > 0 && (
        <div className="space-y-2 p-3.5 rounded-2xl bg-rs-tint/40 border border-rs-border">
          <h4 className="text-sm font-bold text-rs-text flex items-center gap-1.5">
            <span>Action Checklist: Required Preparations Before Landfall</span>
          </h4>
          <div className="space-y-1.5 pt-1 text-sm">
            {alert.preparations.map((prep, idx) => (
              <div key={idx} className="flex items-start gap-2.5 p-2 rounded-xl bg-white border border-neutral-200/70 shadow-2xs">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  ✓
                </span>
                <span className="text-neutral-800 leading-snug">{prep}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Affected Zones */}
      {alert.affectedZones && alert.affectedZones.length > 0 && (
        <div>
          <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Affected Zones & Sectors</h4>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {alert.affectedZones.map((zone, idx) => (
              <span key={idx} className="px-2.5 py-1 rounded-lg bg-neutral-100 text-neutral-800 text-xs font-semibold border border-neutral-200">
                {zone}
              </span>
            ))}
          </div>
        </div>
      )}

      <dl className="grid grid-cols-1 gap-2.5 text-xs text-rs-muted border-t border-neutral-200/80 pt-3">
        <div>
          <dt className="inline text-neutral-500 font-medium">Issued by: </dt>
          <dd className="inline font-semibold text-neutral-800">{alert.source}</dd>
        </div>
        <div>
          <dt className="inline text-neutral-500 font-medium">Issued: </dt>
          <dd className="inline font-semibold text-neutral-800">
            {formatTime(alert.issuedAt)} ({timeAgo(alert.issuedAt)})
          </dd>
        </div>
        {alert.expiresAt && (
          <div>
            <dt className="inline text-neutral-500 font-medium">Valid until: </dt>
            <dd className="inline font-semibold text-neutral-800">{formatTime(alert.expiresAt)}</dd>
          </div>
        )}
      </dl>

      {(isOffline || isStale(alert.issuedAt)) && (
        <Notice tone="warning" title="This information may be outdated">
          {isOffline ? 'You are offline, so this is the last copy saved on your device. ' : ''}
          Newer advisories may have been issued. Listen to your barangay, radio, or local officials.
        </Notice>
      )}

      <SensorDiscrepancy community={community} alerts={[alert]} />
      <p className="text-xs text-rs-muted">
        General safety: keep your 72-hour Go-Bag within reach near the door, ensure drinking water is stocked, and follow instructions from
        your barangay officials.
      </p>
    </Dialog>
  );
};

/**
 * If an official warning is active but the community sensor reads below the alert threshold
 * (or vice-versa), show both facts. Residents are never told they are safe from one reading.
 */
export const SensorDiscrepancy: React.FC<{ community: Community | null; alerts: Alert[] }> = ({ community, alerts }) => {
  if (!community || typeof community.riverWaterLevelMeters !== 'number') return null;
  const hasOfficialWarning = alerts.some((a) => a.severity !== 'INFO');
  const belowThreshold =
    community.riverAlertLevel === 0 && community.riverWaterLevelMeters < RIVER_ALERT_THRESHOLD_M;

  if (hasOfficialWarning && belowThreshold) {
    return (
      <Notice tone="warning" title="Official warning and sensor reading differ">
        The latest river sensor reading ({community.riverWaterLevelMeters.toFixed(1)} m, {formatTime(community.lastUpdated)})
        is below the alert level, but the official warning is still active. Keep following the official warning — one
        sensor reading does not mean the area is safe.
      </Notice>
    );
  }
  if (!hasOfficialWarning && community.riverAlertLevel > 0) {
    return (
      <Notice tone="info" title="Sensor reading above alert level">
        The river sensor reads {community.riverWaterLevelMeters.toFixed(1)} m ({formatTime(community.lastUpdated)}), which is
        above the alert level. No official warning has been issued in Resilia yet. Stay alert and listen to local officials.
      </Notice>
    );
  }
  return null;
};
