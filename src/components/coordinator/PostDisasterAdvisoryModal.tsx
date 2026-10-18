import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Compass,
  Flame,
  Layers,
  MapPin,
  Plus,
  Radio,
  Send,
  ShieldAlert,
  Sparkles,
  Trash2,
  Waves,
  Wind,
  X,
} from 'lucide-react';
import { AlertRepository, PostDisasterAdvisoryParams } from '../../services/repositories';
import { useAuth } from '../../services/auth/authContext';
import { Community } from '../../types';

interface PostDisasterAdvisoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  community: Community | null;
  initialData?: {
    title?: string;
    message?: string;
    disasterName?: string;
    severity?: 'INFO' | 'WARNING' | 'CRITICAL';
  };
  onAdvisoryPosted?: () => void;
}

interface AdvisoryPreset {
  id: string;
  name: string;
  badge: string;
  disasterType: string;
  disasterName: string;
  daysUntilLandfall: number;
  expectedLandfall: string;
  signalLevel: number;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  title: string;
  message: string;
  affectedZones: string[];
  preparations: string[];
  weatherCondition?: string;
  rainfallStatus?: string;
}

const ADVISORY_PRESETS: AdvisoryPreset[] = [
  {
    id: 'typhoon_pepito_2days',
    name: 'Super Typhoon Pepito (2 Days Out)',
    badge: 'Signal #3 • 48h Countdown',
    disasterType: 'TYPHOON',
    disasterName: 'Super Typhoon Pepito (Man-yi)',
    daysUntilLandfall: 2,
    expectedLandfall: 'Friday evening (approx. 48 hours)',
    signalLevel: 3,
    severity: 'WARNING',
    title: 'PAGASA TCWS #3: SUPER TYPHOON PEPITO APPROACHING NCR / VALLEY',
    message: 'Super Typhoon Pepito is tracking west-northwest toward Central Luzon and Metro Manila with sustained winds of 195 km/h. Expected landfall in approximately 2 days. Riverbanks and low-lying puroks must execute pre-landfall protocols.',
    affectedZones: ['Barangay Tumana', 'Malanday Lowlands', 'Nangka Riverbanks', 'Marikina Delta'],
    preparations: [
      'Inspect and pack 72-hour family Go-Bag (drinking water, ready-to-eat food, meds, cash)',
      'Anchor loose roof tin sheets, outdoor signage, and clear rainwater downspouts',
      'Fully charge all mobile devices, powerbanks, rechargeable emergency lights, and radios',
      'Store minimum 1 gallon of potable drinking water per person per day (3-day supply)',
      'Riverside puroks review pre-emptive evacuation routes to designated school gyms',
    ],
    weatherCondition: 'Approaching Gale Winds & Intermittent Outer Rainbands',
    rainfallStatus: 'Yellow to Orange Rainfall Warning Expected',
  },
  {
    id: 'typhoon_ulysses_1day',
    name: 'Typhoon Landfall Imminent (24 Hours)',
    badge: 'Signal #4 • Mandatory Evac',
    disasterType: 'TYPHOON',
    disasterName: 'Typhoon Ulysses',
    daysUntilLandfall: 1,
    expectedLandfall: 'Tomorrow morning (approx. 24 hours)',
    signalLevel: 4,
    severity: 'CRITICAL',
    title: 'PAGASA TCWS #4: TYPHOON LANDFALL IMMINENT — EXECUTE MANDATORY PRE-EMPTIVE EVACUATION',
    message: 'Typhoon is now 24 hours from direct impact. Destructive winds over 175 km/h and extreme rainfall expected. River surge forecast to exceed 17.5 meters. All residents within 100m of riverbanks must move to multi-story shelters immediately.',
    affectedZones: ['Purok 1-6 Tumana', 'Malanday Riverside', 'Provident Village Lowlands', 'Concepcion Uno'],
    preparations: [
      'Execute mandatory pre-emptive evacuation to Malanday Elementary or Bgy Gyms',
      'Grab 72-hour Go-Bag and seal all personal documents in waterproof pouches',
      'Switch off main electrical breakers and shut off LPG gas tanks before leaving',
      'Move elderly, pregnant women, and bedridden family members to safe shelters before dark',
      'Do not attempt to cross flooded streets or swollen creeks on foot or light vehicle',
    ],
    weatherCondition: 'Torrential Continuous Rains & High Velocity Winds',
    rainfallStatus: 'PAGASA Red Torrential Rainfall Warning #19',
  },
  {
    id: 'storm_watch_3days',
    name: 'Tropical Storm Watch (3 Days Out)',
    badge: 'Signal #1 • 72h Readiness',
    disasterType: 'TYPHOON',
    disasterName: 'Tropical Storm Kristine',
    daysUntilLandfall: 3,
    expectedLandfall: 'Monday afternoon (approx. 72 hours)',
    signalLevel: 1,
    severity: 'INFO',
    title: 'PAGASA TROPICAL CYCLONE ADVISORY #1: TROPICAL STORM 72-HOUR WATCH',
    message: 'A developing tropical depression east of Luzon has intensified into a tropical storm. Forecast tracks indicate possible Luzon landfall within 72 hours. Communities are advised to review disaster preparedness checklists.',
    affectedZones: ['Metro Manila Valley', 'Marikina Catchment Basin', 'Barangay Tumana'],
    preparations: [
      'Check family emergency Go-Bag contents and restock expired medicines',
      'Clean rooftop gutters and trim tree branches near electrical service drops',
      'Monitor official PAGASA and CDRRMO advisories over battery-powered radios',
      'Confirm emergency contact numbers and designated neighborhood marshals',
    ],
    weatherCondition: 'Scattered Showers and Gradual Pressure Drop',
    rainfallStatus: 'Green / Normal Monitoring (Advisory in effect)',
  },
  {
    id: 'habagat_monsoon_surge',
    name: 'Habagat Southwest Monsoon Surge',
    badge: 'Monsoon Flooding • 36h Surge',
    disasterType: 'MONSOON',
    disasterName: 'Habagat Southwest Monsoon',
    daysUntilLandfall: 1,
    expectedLandfall: 'Continuous monsoon surge over next 24-48 hours',
    signalLevel: 0,
    severity: 'WARNING',
    title: 'MCDRRMO ADVISORY: CONTINUOUS HABAGAT MONSOON FLOOD SURGE WATCH',
    message: 'Habagat southwest monsoon intensified by offshore cyclone. Continuous moderate to heavy rainfall expected over Marikina watershed. River water levels rising steadily. Flood warning sirens on standby.',
    affectedZones: ['Barangay Tumana', 'Malanday', 'Industrial Valley Complex', 'Barangka Lowlands'],
    preparations: [
      'Move vehicles and ground-floor valuables to elevated parking structures',
      'Prepare waterproof sandbags and flood barriers along doorways',
      'Keep emergency go-bags packed near front doors',
      'Elderly and mobility-impaired residents register with barangay rescue units',
    ],
    weatherCondition: 'Heavy Continuous Monsoon Downpours',
    rainfallStatus: 'PAGASA Orange Rainfall Advisory',
  },
];

export const PostDisasterAdvisoryModal: React.FC<PostDisasterAdvisoryModalProps> = ({
  isOpen,
  onClose,
  community,
  initialData,
  onAdvisoryPosted,
}) => {
  const { currentUser } = useAuth();
  const [selectedPresetId, setSelectedPresetId] = useState<string>(ADVISORY_PRESETS[0].id);

  // Form Fields
  const [disasterType, setDisasterType] = useState<string>(ADVISORY_PRESETS[0].disasterType);
  const [disasterName, setDisasterName] = useState<string>(ADVISORY_PRESETS[0].disasterName);
  const [daysUntilLandfall, setDaysUntilLandfall] = useState<number>(ADVISORY_PRESETS[0].daysUntilLandfall);
  const [expectedLandfall, setExpectedLandfall] = useState<string>(ADVISORY_PRESETS[0].expectedLandfall);
  const [signalLevel, setSignalLevel] = useState<number>(ADVISORY_PRESETS[0].signalLevel);
  const [severity, setSeverity] = useState<'INFO' | 'WARNING' | 'CRITICAL'>(ADVISORY_PRESETS[0].severity);
  const [title, setTitle] = useState<string>(ADVISORY_PRESETS[0].title);
  const [message, setMessage] = useState<string>(ADVISORY_PRESETS[0].message);
  const [affectedZonesStr, setAffectedZonesStr] = useState<string>(ADVISORY_PRESETS[0].affectedZones.join(', '));
  const [preparations, setPreparations] = useState<string[]>(ADVISORY_PRESETS[0].preparations);
  const [newPrepItem, setNewPrepItem] = useState('');
  const [weatherCondition, setWeatherCondition] = useState(ADVISORY_PRESETS[0].weatherCondition || '');
  const [rainfallStatus, setRainfallStatus] = useState(ADVISORY_PRESETS[0].rainfallStatus || '');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (isOpen && initialData) {
      if (initialData.title) setTitle(initialData.title);
      if (initialData.message) setMessage(initialData.message);
      if (initialData.disasterName) setDisasterName(initialData.disasterName);
      if (initialData.severity) setSeverity(initialData.severity);
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSelectPreset = (preset: AdvisoryPreset) => {
    setSelectedPresetId(preset.id);
    setDisasterType(preset.disasterType);
    setDisasterName(preset.disasterName);
    setDaysUntilLandfall(preset.daysUntilLandfall);
    setExpectedLandfall(preset.expectedLandfall);
    setSignalLevel(preset.signalLevel);
    setSeverity(preset.severity);
    setTitle(preset.title);
    setMessage(preset.message);
    setAffectedZonesStr(preset.affectedZones.join(', '));
    setPreparations([...preset.preparations]);
    setWeatherCondition(preset.weatherCondition || '');
    setRainfallStatus(preset.rainfallStatus || '');
  };

  const handleAddPrep = () => {
    if (!newPrepItem.trim()) return;
    setPreparations([...preparations, newPrepItem.trim()]);
    setNewPrepItem('');
  };

  const handleRemovePrep = (idx: number) => {
    setPreparations(preparations.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      setFeedback({ type: 'error', message: 'Advisory headline and operational message are required.' });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    const affectedZones = affectedZonesStr
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      await AlertRepository.postDisasterAdvisory(
        {
          title: title.trim(),
          severity,
          message: message.trim(),
          disasterType,
          disasterName: disasterName.trim() || 'Approaching Weather System',
          daysUntilLandfall: Number(daysUntilLandfall),
          expectedLandfall: expectedLandfall.trim(),
          signalLevel: Number(signalLevel) || undefined,
          affectedZones: affectedZones.length > 0 ? affectedZones : ['Metro Manila Valley'],
          preparations: preparations.length > 0 ? preparations : undefined,
          weatherCondition: weatherCondition.trim() || undefined,
          rainfallStatus: rainfallStatus.trim() || undefined,
          source: `${currentUser.name} (Disaster Operations Coordinator, Marikina CDRRMO)`,
        },
        currentUser
      );

      setFeedback({
        type: 'success',
        message: 'Disaster Advisory broadcasted successfully! Responders and residents are notified.',
      });

      if (onAdvisoryPosted) {
        onAdvisoryPosted();
      }

      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to post disaster advisory.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-xl max-w-3xl w-full p-5 sm:p-6 shadow-xl border border-neutral-200 space-y-4 max-h-[92vh] overflow-y-auto text-neutral-900 animate-modal">
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-neutral-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-neutral-900 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Wind className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-neutral-900 tracking-tight">
                  Broadcast Incoming Disaster Advisory
                </h3>
                <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-mono text-[10px] uppercase tracking-wider font-medium">
                  COORDINATOR ONLY
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                Issue typhoon warnings, landfall countdowns, recommended preparations, and affected sectors.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-700 p-1 rounded-md hover:bg-neutral-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Message */}
        {feedback && (
          <div
            className={`p-3 rounded-lg text-xs font-medium flex items-center gap-2.5 animate-in fade-in duration-150 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Preset Selector */}
        <div>
          <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
            Quick-Fill Philippine Disaster Templates:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {ADVISORY_PRESETS.map((p) => {
              const isSelected = selectedPresetId === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectPreset(p)}
                  className={`p-2.5 rounded-lg border text-left transition flex items-start gap-2.5 ${
                    isSelected
                      ? 'border-neutral-900 bg-neutral-900 text-white shadow-2xs'
                      : 'border-neutral-200 bg-neutral-50/60 hover:bg-white text-neutral-800'
                  }`}
                >
                  <Wind className={`w-4 h-4 shrink-0 mt-0.5 ${isSelected ? 'text-amber-400' : 'text-neutral-500'}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-medium text-xs leading-snug truncate">{p.name}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-medium shrink-0 tabular-nums ${
                          isSelected ? 'bg-neutral-800 text-amber-300' : 'bg-neutral-200/80 text-neutral-700'
                        }`}
                      >
                        {p.daysUntilLandfall}d Landfall
                      </span>
                    </div>
                    <span className={`block text-[11px] mt-0.5 truncate ${isSelected ? 'text-neutral-300' : 'text-neutral-500'}`}>
                      {p.badge}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Advisory Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 pt-1">
          {/* Row 1: Disaster Name, Type, Days to Landfall, Signal */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <label className="block text-xs font-medium text-neutral-700">
                Disaster Name & Identification <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={disasterName}
                onChange={(e) => setDisasterName(e.target.value)}
                placeholder="e.g. Super Typhoon Pepito (Man-yi)"
                className="w-full bg-white border border-neutral-200 rounded-md px-3 py-1.5 text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-neutral-700">
                Disaster Type
              </label>
              <select
                value={disasterType}
                onChange={(e) => setDisasterType(e.target.value)}
                className="w-full bg-white border border-neutral-200 rounded-md px-3 py-1.5 text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
              >
                <option value="TYPHOON">Typhoon (Bagyo)</option>
                <option value="MONSOON">Monsoon (Habagat)</option>
                <option value="FLOOD">River Flood Surge</option>
                <option value="STORM_SURGE">Storm Surge</option>
                <option value="EARTHQUAKE">Earthquake / Tremor</option>
                <option value="VOLCANO">Volcano / Ashfall</option>
                <option value="TSUNAMI">Tsunami Advisory</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-neutral-700">
                Days to Landfall <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  max={14}
                  value={daysUntilLandfall}
                  onChange={(e) => setDaysUntilLandfall(Number(e.target.value))}
                  className="w-full bg-white border border-neutral-200 rounded-md px-3 py-1.5 text-xs text-neutral-900 font-mono tabular-nums focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  required
                />
                <span className="absolute right-3 top-2 text-[10px] text-neutral-400 font-medium">
                  {daysUntilLandfall === 0 ? 'Today (<24h)' : daysUntilLandfall === 1 ? '1 day' : `${daysUntilLandfall} days`}
                </span>
              </div>
            </div>
          </div>

          {/* Row 2: Landfall Timeline, TCWS Signal, Severity Level */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-neutral-700">
                Expected Landfall Timeline
              </label>
              <input
                type="text"
                value={expectedLandfall}
                onChange={(e) => setExpectedLandfall(e.target.value)}
                placeholder="e.g. Friday evening / approx 48 hours"
                className="w-full bg-white border border-neutral-200 rounded-md px-3 py-1.5 text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-neutral-700">
                PAGASA TCWS Wind Signal
              </label>
              <select
                value={signalLevel}
                onChange={(e) => setSignalLevel(Number(e.target.value))}
                className="w-full bg-white border border-neutral-200 rounded-md px-3 py-1.5 text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
              >
                <option value={0}>No Signal (General Advisory)</option>
                <option value={1}>Signal #1 (39–61 km/h in 36h)</option>
                <option value={2}>Signal #2 (62–88 km/h in 24h)</option>
                <option value={3}>Signal #3 (89–117 km/h in 18h)</option>
                <option value={4}>Signal #4 (118–184 km/h in 12h)</option>
                <option value={5}>Signal #5 (&ge; 185 km/h in 12h)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-neutral-700">
                Alert Severity Level <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                {(['INFO', 'WARNING', 'CRITICAL'] as const).map((sev) => {
                  const isCur = severity === sev;
                  return (
                    <button
                      key={sev}
                      type="button"
                      onClick={() => setSeverity(sev)}
                      className={`py-1.5 rounded-md text-[11px] font-mono font-medium border transition ${
                        isCur
                          ? sev === 'CRITICAL'
                            ? 'bg-rose-600 text-white border-rose-600'
                            : sev === 'WARNING'
                            ? 'bg-amber-600 text-white border-amber-600'
                            : 'bg-neutral-900 text-white border-neutral-900'
                          : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                      }`}
                    >
                      {sev}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Row 3: Headline / Title */}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-neutral-700">
              Official Advisory Headline <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. PAGASA TCWS #3: SUPER TYPHOON PEPITO APPROACHING NCR / MARIKINA VALLEY"
              className="w-full bg-white border border-neutral-200 rounded-md px-3 py-1.5 text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 font-medium"
              required
            />
          </div>

          {/* Row 4: Broadcast Message */}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-neutral-700">
              Broadcast Message & Operational Instructions <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Explain the hazard, expected wind speeds, river conditions, and guidance for residents."
              className="w-full bg-white border border-neutral-200 rounded-md p-2.5 text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 leading-relaxed"
              required
            />
          </div>

          {/* Row 5: Affected Zones / Sectors */}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-neutral-700">
              Affected Zones & Sectors (comma-separated)
            </label>
            <input
              type="text"
              value={affectedZonesStr}
              onChange={(e) => setAffectedZonesStr(e.target.value)}
              placeholder="e.g. Barangay Tumana, Malanday Lowlands, Nangka Riverbanks, Concepcion"
              className="w-full bg-white border border-neutral-200 rounded-md px-3 py-1.5 text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
            />
          </div>

          {/* Row 6: Required Preparations Checklist (Editable) */}
          <div className="space-y-2 p-3 rounded-lg bg-neutral-50/80 border border-neutral-200">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-neutral-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Recommended Preparations Checklist (Dispatched to Users)</span>
              </label>
              <span className="text-[11px] text-neutral-500 font-mono tabular-nums">
                {preparations.length} action items
              </span>
            </div>

            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {preparations.map((prep, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-2 p-2 rounded-md bg-white border border-neutral-200 text-xs text-neutral-800 shadow-2xs"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="w-4 h-4 rounded-full bg-neutral-100 text-neutral-700 flex items-center justify-center font-mono text-[10px] shrink-0">
                      {idx + 1}
                    </span>
                    <span className="truncate">{prep}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemovePrep(idx)}
                    className="text-neutral-400 hover:text-rose-600 p-1 shrink-0 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add new preparation input */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={newPrepItem}
                onChange={(e) => setNewPrepItem(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddPrep();
                  }
                }}
                placeholder="Add preparation step (e.g. Inspect Go-Bag, recharge powerbanks...)"
                className="flex-1 bg-white border border-neutral-200 rounded-md px-2.5 py-1.5 text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
              />
              <button
                type="button"
                onClick={handleAddPrep}
                className="px-3 py-1.5 rounded-md bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-xs transition flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3.5 py-1.5 rounded-md bg-white border border-neutral-200 text-neutral-700 text-xs font-medium hover:bg-neutral-50 shadow-2xs transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-4 py-1.5 rounded-md text-white font-medium text-xs shadow-2xs transition flex items-center gap-2 ${
                severity === 'CRITICAL'
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-neutral-900 hover:bg-neutral-800'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Broadcasting...' : 'Broadcast Advisory'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
