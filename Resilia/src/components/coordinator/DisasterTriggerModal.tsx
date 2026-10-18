import React, { useState } from 'react';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  Building2,
  Check,
  CheckCircle2,
  Flame,
  Radio,
  RotateCcw,
  Shield,
  ShieldAlert,
  Waves,
  Wind,
  X,
} from 'lucide-react';
import { DisasterRepository, TriggerDisasterParams } from '../../services/repositories';
import { useAuth } from '../../services/auth/authContext';
import { Community, RiverAlertLevel } from '../../types';

interface DisasterTriggerModalProps {
  isOpen: boolean;
  onClose: () => void;
  community: Community | null;
  activeAlertCount: number;
  onDisasterUpdated?: () => void;
}

interface DisasterPreset {
  id: string;
  name: string;
  disasterType: string;
  icon: any;
  title: string;
  severity: 'WARNING' | 'CRITICAL';
  message: string;
  riverWaterLevelMeters: number;
  riverAlertLevel: RiverAlertLevel;
  weatherCondition: string;
  rainfallStatus: string;
}

const DISASTER_PRESETS: DisasterPreset[] = [
  {
    id: 'volcano',
    name: 'Volcano Eruption & Ashfall',
    disasterType: 'VOLCANO_ERUPTION',
    icon: Flame,
    title: 'PHIVOLCS Alert Level 3: Volcanic Ashfall & Hazardous Plume Advisory',
    severity: 'CRITICAL',
    message: 'Intense explosive activity detected with hazardous ash plume rising 3km. Heavy ashfall warning over valley sector. N95 masks mandatory. High-risk areas prepare for immediate evacuation.',
    riverWaterLevelMeters: 15.2,
    riverAlertLevel: 1,
    weatherCondition: 'Heavy Ashfall Dispersion & Reduced Visibility',
    rainfallStatus: 'Sulfur & Ash Plume Advisory (PHIVOLCS)',
  },
  {
    id: 'flood_level3',
    name: '3rd Alarm River Surge & Forced Evac',
    disasterType: 'FLOOD',
    icon: Waves,
    title: 'MARIKINA RIVER: 3RD ALARM FORCED EVACUATION (18.2 METERS)',
    severity: 'CRITICAL',
    message: 'Water level reached critical 18.2 meters. Retaining dikes overtopped along Tumana and Malanday. Mandatory forced evacuation in effect for all low-lying riverside communities.',
    riverWaterLevelMeters: 18.2,
    riverAlertLevel: 3,
    weatherCondition: 'Torrential Continuous Monsoon Rainfall (Habagat)',
    rainfallStatus: 'PAGASA Red Rainfall Warning #18 (Torrential)',
  },
  {
    id: 'earthquake',
    name: 'Magnitude 7.2 Fault Rupture',
    disasterType: 'EARTHQUAKE',
    icon: Activity,
    title: 'WEST VALLEY FAULT: PEIS INTENSITY VII DESTRUCTIVE TREMOR',
    severity: 'CRITICAL',
    message: 'Severe tectonic ground shaking felt across the Marikina Valley sector. Structural integrity evaluations underway. Residents evacuate unstable masonry and stay clear of power lines.',
    riverWaterLevelMeters: 15.0,
    riverAlertLevel: 1,
    weatherCondition: 'Cloudy, Aftershock Watch In Effect',
    rainfallStatus: 'Normal Rainfall / High Seismic Aftershock Alert',
  },
  {
    id: 'flood_level2',
    name: '2nd Alarm Pre-emptive Evacuation',
    disasterType: 'FLOOD',
    icon: Waves,
    title: 'MARIKINA RIVER: 2ND ALARM (WARNING LEVEL 16.8 METERS)',
    severity: 'WARNING',
    message: 'River gauge at 16.8 meters. Pre-emptive evacuation underway for low-lying puroks. Evacuation shelters at Malanday Elementary and Concepcion Integrated School are open.',
    riverWaterLevelMeters: 16.8,
    riverAlertLevel: 2,
    weatherCondition: 'Heavy Monsoon Rain (Habagat)',
    rainfallStatus: 'Orange Rainfall Advisory (PAGASA)',
  },
  {
    id: 'typhoon_signal4',
    name: 'Super Typhoon Signal #4',
    disasterType: 'TYPHOON',
    icon: Wind,
    title: 'PAGASA TCWS #4: SUPER TYPHOON DIRECT PASSAGE ADVISORY',
    severity: 'CRITICAL',
    message: 'Violent winds exceeding 185 km/h with catastrophic flooding hazard. All outdoor movement suspended. Total power shutdown enacted as precautionary measure.',
    riverWaterLevelMeters: 17.5,
    riverAlertLevel: 2,
    weatherCondition: 'Violent Gale Winds & Torrential Rain',
    rainfallStatus: 'Red Torrential Rainfall Warning',
  },
  {
    id: 'tsunami',
    name: 'Tsunami & Coastal Inundation',
    disasterType: 'TSUNAMI',
    icon: Waves,
    title: 'PHIVOLCS TSUNAMI ADVISORY: IMMINENT WAVE SURGE HAZARD',
    severity: 'CRITICAL',
    message: 'Undersea subduction trench earthquake triggered potential destructive tsunami wave surges. Immediate evacuation for all coastal and delta lowlands to high ground or concrete structures.',
    riverWaterLevelMeters: 17.2,
    riverAlertLevel: 3,
    weatherCondition: 'Coastal Surge & Water Drawdown Detected',
    rainfallStatus: 'PHIVOLCS Tsunami Warning In Effect',
  },
];

export const DisasterTriggerModal: React.FC<DisasterTriggerModalProps> = ({
  isOpen,
  onClose,
  community,
  activeAlertCount,
  onDisasterUpdated,
}) => {
  const { currentUser } = useAuth();
  const [selectedPresetId, setSelectedPresetId] = useState<string>(DISASTER_PRESETS[0].id);
  const [title, setTitle] = useState(DISASTER_PRESETS[0].title);
  const [severity, setSeverity] = useState<'WARNING' | 'CRITICAL'>(DISASTER_PRESETS[0].severity);
  const [message, setMessage] = useState(DISASTER_PRESETS[0].message);
  const [riverMeters, setRiverMeters] = useState<number>(DISASTER_PRESETS[0].riverWaterLevelMeters);
  const [riverLevel, setRiverLevel] = useState<RiverAlertLevel>(DISASTER_PRESETS[0].riverAlertLevel);
  const [weatherCondition, setWeatherCondition] = useState(DISASTER_PRESETS[0].weatherCondition);
  const [rainfallStatus, setRainfallStatus] = useState(DISASTER_PRESETS[0].rainfallStatus);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  if (!isOpen) return null;

  const handleSelectPreset = (preset: DisasterPreset) => {
    setSelectedPresetId(preset.id);
    setTitle(preset.title);
    setSeverity(preset.severity);
    setMessage(preset.message);
    setRiverMeters(preset.riverWaterLevelMeters);
    setRiverLevel(preset.riverAlertLevel);
    setWeatherCondition(preset.weatherCondition);
    setRainfallStatus(preset.rainfallStatus);
  };

  const handleTriggerDisaster = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      setFeedback({ type: 'error', message: 'Title and official broadcast message are required.' });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);
    try {
      await DisasterRepository.triggerAreaDisaster(
        {
          title: title.trim(),
          severity,
          message: message.trim(),
          source: `${currentUser.name} (Disaster Operations Coordinator, Marikina CDRRMO)`,
          riverWaterLevelMeters: riverMeters,
          riverAlertLevel: riverLevel,
          weatherCondition: weatherCondition.trim(),
          rainfallStatus: rainfallStatus.trim(),
        },
        currentUser
      );

      setFeedback({
        type: 'success',
        message: 'Disaster Protocol activated! Emergency advisory broadcasted to all residents and responders.',
      });
      if (onDisasterUpdated) onDisasterUpdated();
      setTimeout(() => {
        onClose();
      }, 1400);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to trigger area disaster.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStandDown = async () => {
    setIsSubmitting(true);
    setFeedback(null);
    try {
      await DisasterRepository.standDownAreaDisaster(
        currentUser,
        `All active disaster warnings stood down by Coordinator ${currentUser.name}. Sector returned to Normal Monitoring.`
      );
      setFeedback({
        type: 'success',
        message: 'Area disaster stood down. Sector returned to normal monitoring status.',
      });
      if (onDisasterUpdated) onDisasterUpdated();
      setTimeout(() => {
        onClose();
      }, 1400);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to stand down disaster.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isCoordinator = currentUser.role === 'COORDINATOR';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-xl max-w-2xl w-full p-5 sm:p-6 shadow-xl border border-neutral-200 space-y-4 max-h-[92vh] overflow-y-auto animate-modal text-neutral-900">
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 pb-3 border-b border-neutral-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shadow-2xs shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-neutral-900 tracking-tight">
                  Sector Disaster Declaration Cockpit
                </h3>
                <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-semibold text-[10px] uppercase tracking-wider">
                  COORDINATOR ONLY
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                Broadcast sector-wide disaster emergencies, trigger alarms, or stand down protocols.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-700 p-1 rounded-lg hover:bg-neutral-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Sector Status Banner */}
        <div className="p-3.5 rounded-lg bg-neutral-900 text-white text-xs flex flex-wrap items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2">
            <Radio className={`w-4 h-4 ${activeAlertCount > 0 ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`} />
            <span>
              Sector Status:{' '}
              <strong className={activeAlertCount > 0 ? 'text-rose-300 font-semibold' : 'text-emerald-300 font-semibold'}>
                {activeAlertCount > 0 ? `DISASTER ACTIVE (${activeAlertCount} ALERTS)` : 'NORMAL MONITORING'}
              </strong>
            </span>
          </div>
          <div className="text-[11px] text-neutral-300 tabular-nums">
            River Gauge: <strong className="text-white">{community?.riverWaterLevelMeters || 16.8}m</strong> · Alert Level {community?.riverAlertLevel ?? 2}
          </div>
        </div>

        {/* Feedback message */}
        {feedback && (
          <div
            className={`p-3 rounded-lg text-xs font-medium border flex items-center gap-2 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}
          >
            {feedback.type === 'success' ? <Check className="w-4 h-4" /> : <AlertOctagon className="w-4 h-4" />}
            <span>{feedback.message}</span>
          </div>
        )}

        {!isCoordinator ? (
          <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs">
            <strong>Permission Restricted:</strong> You are currently signed in as{' '}
            <span className="font-semibold underline">{currentUser.role}</span>. Only Disaster Coordinators have the authority
            to trigger or stand down sector disaster emergency protocols. Switch to the <strong>Disaster Coordinator</strong> persona in the top header.
          </div>
        ) : (
          <form onSubmit={handleTriggerDisaster} className="space-y-4">
            {/* Quick Disaster Presets */}
            <div>
              <label className="block text-xs font-semibold text-neutral-800 mb-1.5">
                Select Disaster Scenario Preset:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {DISASTER_PRESETS.map((p) => {
                  const Icon = p.icon;
                  const isSelected = selectedPresetId === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectPreset(p)}
                      className={`p-2.5 rounded-lg border text-left transition flex items-start gap-2.5 ${
                        isSelected
                          ? 'border-neutral-900 bg-neutral-900 text-white font-medium shadow-2xs'
                          : 'border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-900'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs truncate font-semibold">{p.name}</div>
                        <div className={`text-[10px] uppercase font-semibold ${isSelected ? 'text-neutral-300' : 'text-neutral-400'}`}>
                          {p.severity}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Official Broadcast Title */}
            <div>
              <label className="block text-xs font-semibold text-neutral-800 mb-1">
                Official Broadcast Advisory Title <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. PHIVOLCS Alert Level 3: Volcanic Ashfall Advisory"
                className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-300 focus:outline-none focus:ring-1 focus:ring-neutral-900 text-neutral-900 font-medium"
                required
              />
            </div>

            {/* Severity & River Level Simulation */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-800 mb-1">Severity Level</label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-300 focus:outline-none focus:ring-1 focus:ring-neutral-900 bg-white text-neutral-900"
                >
                  <option value="CRITICAL">CRITICAL (Forced Evacuation / Immediate Danger)</option>
                  <option value="WARNING">WARNING (Pre-emptive Evacuation / Heightened Watch)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-800 mb-1">River Water Level (Meters)</label>
                <input
                  type="number"
                  step="0.1"
                  min="12.0"
                  max="22.0"
                  value={riverMeters}
                  onChange={(e) => setRiverMeters(parseFloat(e.target.value) || 16.0)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-300 focus:outline-none focus:ring-1 focus:ring-neutral-900 text-neutral-900 tabular-nums"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-800 mb-1">Alarm Tier</label>
                <select
                  value={riverLevel}
                  onChange={(e) => setRiverLevel(parseInt(e.target.value, 10) as RiverAlertLevel)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-300 focus:outline-none focus:ring-1 focus:ring-neutral-900 bg-white text-neutral-900"
                >
                  <option value={1}>Level 1: Alert (15.0m)</option>
                  <option value={2}>Level 2: Warning (16.0m)</option>
                  <option value={3}>Level 3: Evacuate (18.0m+)</option>
                </select>
              </div>
            </div>

            {/* Weather & Rainfall Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-800 mb-1">Weather Condition</label>
                <input
                  type="text"
                  value={weatherCondition}
                  onChange={(e) => setWeatherCondition(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-300 focus:outline-none focus:ring-1 focus:ring-neutral-900 text-neutral-900"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-800 mb-1">Precipitation / Advisory Notice</label>
                <input
                  type="text"
                  value={rainfallStatus}
                  onChange={(e) => setRainfallStatus(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-300 focus:outline-none focus:ring-1 focus:ring-neutral-900 text-neutral-900"
                />
              </div>
            </div>

            {/* Directive Message */}
            <div>
              <label className="block text-xs font-semibold text-neutral-800 mb-1">
                Official Sector Directive & Citizen Instructions <span className="text-rose-600">*</span>
              </label>
              <textarea
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Specific instructions for citizens, affected zones, evacuation hubs, and field responders..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-300 focus:outline-none focus:ring-1 focus:ring-neutral-900 leading-relaxed text-neutral-900"
                required
              />
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-neutral-100">
              {activeAlertCount > 0 ? (
                <button
                  type="button"
                  onClick={handleStandDown}
                  disabled={isSubmitting}
                  className="px-3.5 py-1.5 rounded-lg border border-neutral-200 text-neutral-700 hover:bg-neutral-50 text-xs font-medium transition flex items-center gap-1.5 shadow-2xs"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Stand Down / Return to Normal</span>
                </button>
              ) : (
                <div className="text-[11px] text-neutral-500">
                  Broadcasting will update Home Screen banner & trigger emergency protocols.
                </div>
              )}

              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-600 hover:bg-neutral-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-2xs transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Broadcasting...' : 'Broadcast & Trigger Directive'}</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
