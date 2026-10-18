/**
 * Resident alert presentation.
 * - Only active, unexpired alerts are shown.
 * - Exercises/demo alerts are always labelled as such.
 * - Old or cached alerts show their timestamp and a stale-data notice.
 * - Official advisories are kept separate from sensor readings; discrepancies are surfaced, never auto-resolved.
 */

import React, { useEffect, useState } from 'react';
import {
  Check,
  CheckCircle2,
  ChevronRight,
  Info,
  ListChecks,
  Phone,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { EmergencyAlertIcon, GoBagIcon } from '../../components/icons/ResidentIcons';
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

/**
 * Context-aware safety preparations & instructions.
 * If the coordinator or data source supplied custom action steps, honors those.
 * Otherwise, synthesizes official civil defense (NDRRMC/OCD) actionable protocols
 * matching the alert disaster type and risk profile.
 */
export function getDefaultPreparations(alert?: Alert | null): string[] {
  if (!alert) return [];
  if (alert.preparations && alert.preparations.length > 0) {
    return alert.preparations;
  }
  const text = `${alert.title || ''} ${alert.message || ''} ${alert.disasterType || ''}`.toLowerCase();

  if (text.includes('rain') || text.includes('flood') || text.includes('habagat') || text.includes('river')) {
    return [
      'Pack or inspect 72-hour family Go-Bag (drinking water, ready-to-eat food, maintenance medicines)',
      'Store minimum 1 gallon of potable drinking water per person per day (minimum 3-day reserve)',
      'Charge mobile phones, emergency lamps, and high-capacity portable power banks',
      'Move valuable household appliances, electronics, and documents to second floor or high ground',
      'Secure birth certificates, government IDs, deeds, and cash in sealed waterproof ziplock bags',
      'Low-lying & riverside puroks review designated barangay evacuation routes to nearby school gyms',
      'Unplug ground-floor electrical appliances and prepare to shut off main circuit breaker if waters rise',
    ];
  }

  if (text.includes('typhoon') || text.includes('tcws') || text.includes('storm') || text.includes('wind') || text.includes('gale')) {
    return [
      'Inspect and secure 72-hour family evacuation Go-Bag with emergency whistle and high-lumen flashlight',
      'Reinforce and anchor loose corrugated roof sheets, exterior signage, and clean drainage downspouts',
      'Stock non-perishable canned food, potable water, and infant/senior essentials for at least 72 hours',
      'Charge all communication devices, emergency lights, and battery-operated AM/FM radios',
      'Riverside & coastal puroks monitor barangay emergency sirens for pre-emptive evacuation orders',
      'Save emergency hotlines: Marikina Rescue 161 and local Barangay Disaster Operations Center',
    ];
  }

  if (text.includes('earthquake') || text.includes('quake') || text.includes('tremor') || text.includes('fault')) {
    return [
      'Practice Duck, Cover, and Hold under sturdy furniture during initial tremors; stay clear of glass windows',
      'Grab 72-hour family Go-Bag and safely evacuate to designated open-air barangay assembly grounds',
      'Check family members for injuries and administer immediate first-aid if required',
      'Check for gas leaks and smell of burning before turning on any electrical switches or open flames',
      'Expect aftershocks and keep battery-powered radio tuned to official NDRRMC advisories',
    ];
  }

  return [
    'Secure 72-hour family evacuation Go-Bag near your front exit door for immediate departure',
    'Store minimum 1 gallon of potable drinking water per family member per day (3-day supply)',
    'Keep mobile devices, rechargeable emergency lanterns, and portable power banks fully charged',
    'Keep essential prescription maintenance medications and first-aid supplies within arm’s reach',
    'Ensure family identification cards and essential documents are sealed in waterproof pouches',
    'Follow official instructions and advisories issued by your Barangay Disaster Risk Reduction Council',
  ];
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
  const preparations = getDefaultPreparations(alert);

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
          {preparations.length > 0 && (
            <div className="mt-2.5 p-2.5 rounded-xl bg-white/80 border border-rs-border/60 text-xs text-neutral-800 space-y-1">
              <div className="font-bold text-neutral-900 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <ListChecks className="w-3.5 h-3.5 text-rs-primary" />
                  <span>Preparations Needed Before Impact:</span>
                </span>
                <span className="text-[10px] text-rs-primary font-bold">
                  {preparations.length} action steps
                </span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-neutral-700 pl-0.5">
                {preparations.slice(0, 2).map((p, i) => (
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
        <PrimaryButton onClick={onOpen} className="!min-h-[46px] !px-4 shadow-xs flex items-center gap-2">
          <ListChecks className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>View safety preparations & instructions</span>
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
  onOpenGoBag?: () => void;
}> = ({ alert, community, isOffline, onClose, onFindShelter, onGetHelp, onOpenGoBag }) => {
  if (!alert) return null;
  const exercise = isExerciseAlert(alert);
  const hasLandfall = typeof alert.daysUntilLandfall === 'number';
  const preparations = getDefaultPreparations(alert);

  const [completedItems, setCompletedItems] = useState<Record<number, boolean>>({});

  useEffect(() => {
    setCompletedItems({});
  }, [alert?.id]);

  const toggleItem = (idx: number) => {
    setCompletedItems((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const markAllComplete = () => {
    const all: Record<number, boolean> = {};
    preparations.forEach((_, idx) => {
      all[idx] = true;
    });
    setCompletedItems(all);
  };

  const resetAll = () => {
    setCompletedItems({});
  };

  const completedCount = preparations.filter((_, idx) => completedItems[idx]).length;
  const percent = preparations.length > 0 ? Math.round((completedCount / preparations.length) * 100) : 0;

  return (
    <Dialog
      open={!!alert}
      onClose={onClose}
      title={readableTitle(alert.title)}
      footer={
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
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

      {/* Official Guidance Section */}
      <div className="space-y-1">
        <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
          Official Guidance & Threat Advisory
        </h3>
        <p className="p-3.5 rounded-xl bg-rs-bg border border-rs-border text-[15px] text-rs-text leading-relaxed whitespace-pre-line">
          {alert.message}
        </p>
      </div>

      {/* Action Checklist: Safety Preparations & Instructions */}
      <div className="space-y-2.5 p-4 rounded-2xl bg-rs-tint/40 border border-rs-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
          <h4 className="text-sm font-bold text-rs-text flex items-center gap-1.5">
            <ListChecks className="w-4 h-4 text-rs-primary" />
            <span>Action Checklist: Safety Preparations & Instructions</span>
          </h4>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white text-rs-text border border-rs-border self-start sm:self-auto shadow-2xs">
            {completedCount}/{preparations.length} completed ({percent}%)
          </span>
        </div>

        {/* Visual Progress Bar */}
        <div className="w-full bg-neutral-200/80 h-2 rounded-full overflow-hidden">
          <div
            className={cx(
              'h-full transition-all duration-300',
              percent >= 100 ? 'bg-emerald-600' : percent >= 50 ? 'bg-amber-500' : 'bg-emerald-500'
            )}
            style={{ width: `${percent}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs pt-0.5 pb-1 text-rs-muted">
          <span>Tap items as you complete household preparations:</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={markAllComplete}
              className="text-rs-primary font-bold hover:underline"
            >
              Check all
            </button>
            <button
              type="button"
              onClick={resetAll}
              className="hover:underline"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Interactive action items list */}
        <div className="space-y-1.5">
          {preparations.map((prep, idx) => {
            const isDone = !!completedItems[idx];
            return (
              <button
                key={idx}
                type="button"
                onClick={() => toggleItem(idx)}
                className={cx(
                  'w-full text-left flex items-start gap-3 p-3 rounded-xl border transition-all text-sm group',
                  isDone
                    ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 shadow-2xs'
                    : 'bg-white border-neutral-200 hover:border-rs-primary/50 text-neutral-800 shadow-2xs'
                )}
                aria-pressed={isDone}
              >
                <span
                  className={cx(
                    'w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 transition-colors',
                    isDone
                      ? 'bg-emerald-600 text-white'
                      : 'border border-neutral-300 bg-neutral-50 text-transparent group-hover:border-rs-primary'
                  )}
                >
                  ✓
                </span>
                <span className={cx('leading-snug flex-1', isDone && 'line-through text-emerald-900/80')}>
                  {prep}
                </span>
              </button>
            );
          })}
        </div>

        {/* Go-Bag Bridge Action */}
        {onOpenGoBag && (
          <button
            type="button"
            onClick={onOpenGoBag}
            className="w-full flex items-center justify-between p-3.5 rounded-xl bg-amber-500/15 border border-amber-300 hover:bg-amber-500/25 transition-all text-amber-950 font-semibold text-sm mt-2 shadow-2xs group"
          >
            <span className="flex items-center gap-2">
              <GoBagIcon className="w-5 h-5 text-amber-700 group-hover:scale-105 transition-transform" />
              <span>Pack 72-Hour Evacuation Go-Bag</span>
            </span>
            <span className="text-xs text-amber-800 font-bold underline">
              View 10 Essentials →
            </span>
          </button>
        )}
      </div>

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

      {/* Emergency Hotlines */}
      <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200/80 text-xs space-y-1.5">
        <span className="font-bold text-neutral-800 block">Emergency Responders & Hotlines:</span>
        <div className="flex flex-wrap items-center gap-3 text-rs-text font-medium">
          <a
            href="tel:161"
            className="inline-flex items-center gap-1.5 text-rs-primary font-bold hover:underline"
          >
            <Phone className="w-3.5 h-3.5" /> Marikina Rescue: 161
          </a>
          <span>·</span>
          <a
            href="tel:0286460427"
            className="inline-flex items-center gap-1.5 text-rs-text hover:underline"
          >
            <Phone className="w-3.5 h-3.5" /> CDRRMO Command: (02) 8646-0427
          </a>
        </div>
      </div>

      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-rs-muted border-t border-neutral-200/80 pt-3">
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
          <div className="sm:col-span-2">
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
