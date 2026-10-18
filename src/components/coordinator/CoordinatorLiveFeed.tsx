/**
 * Resilia Disaster Operations Live Intelligence Feed Component
 * Linear / Stripe dashboard design language.
 *
 * Provides Disaster Coordinators with:
 * 1. Live Weather Updates & Environmental Telemetry (Rainfall mm/hr, Wind gusts, Barometric pressure, TCWS Signal)
 * 2. River Hydrodynamic Telemetry (Marikina River sensors, Manggahan Floodway gates, Alarm stages)
 * 3. Doppler Radar & Volcanic/Seismic Telemetry (Tagaytay Radar reflectivity dBZ, PHIVOLCS PEIS)
 * 4. Real-time Agency Updates (DOST-PAGASA, NDRRMC, PHIVOLCS, MMDA-EFCOS)
 * 5. Live Operational Field Signals (verified incidents, citizen distress requests, mission authorizations)
 * 6. Offline-first resilience with local storage caching, auto-stream simulation, and drill injection
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Activity,
  AlertCircle,
  AlertOctagon,
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Compass,
  Database,
  Droplets,
  ExternalLink,
  Eye,
  Filter,
  Flame,
  Info,
  Layers,
  MapPin,
  Pause,
  Play,
  Radio,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
  Shield,
  ShieldAlert,
  ShieldCheck,
  CloudRain,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Volume2,
  VolumeX,
  Waves,
  Wifi,
  WifiOff,
  Wind,
  X,
  Zap,
} from 'lucide-react';
import {
  Alert,
  AssistanceRequest,
  AuditEntry,
  Community,
  EnvironmentalTelemetry,
  Incident,
  LiveFeedCategory,
  LiveFeedItem,
  LiveFeedSeverity,
  LiveFeedSource,
  Mission,
} from '../../types';
import { LiveFeedService } from '../../services/telemetry/liveFeedService';
import { emergencyAudio } from '../../services/audio/emergencyAudio';

interface CoordinatorLiveFeedProps {
  community: Community | null;
  alerts?: Alert[];
  incidents?: Incident[];
  assistanceRequests?: AssistanceRequest[];
  missions?: Mission[];
  auditLogs?: AuditEntry[];
  onOpenAdvisoryModal?: (initialData?: { title: string; message: string; disasterName?: string }) => void;
  onNavigateToTab?: (tabId: string) => void;
}

export const CoordinatorLiveFeed: React.FC<CoordinatorLiveFeedProps> = ({
  community,
  alerts = [],
  incidents = [],
  assistanceRequests = [],
  missions = [],
  auditLogs = [],
  onOpenAdvisoryModal,
  onNavigateToTab,
}) => {
  // State
  const [telemetry, setTelemetry] = useState<EnvironmentalTelemetry>(() =>
    LiveFeedService.getTelemetry(community, alerts)
  );
  const [feedItems, setFeedItems] = useState<LiveFeedItem[]>([]);
  const [isLiveStreaming, setIsLiveStreaming] = useState(true);
  const [isAudioMuted, setIsAudioMuted] = useState(() => LiveFeedService.isAudioMuted());
  const [isOfflineMode, setIsOfflineMode] = useState(() => LiveFeedService.isOffline());
  const [isPolling, setIsPolling] = useState(false);
  const [selectedBulletin, setSelectedBulletin] = useState<LiveFeedItem | null>(null);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | LiveFeedCategory>('ALL');
  const [selectedSource, setSelectedSource] = useState<'ALL' | LiveFeedSource>('ALL');
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'CRITICAL' | 'WARNING_AND_UP'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSimulateMenu, setShowSimulateMenu] = useState(false);
  const [showTrustedSourcesModal, setShowTrustedSourcesModal] = useState(false);
  const [isSyncingWeather, setIsSyncingWeather] = useState(false);
  const [weatherSyncToast, setWeatherSyncToast] = useState<string | null>(null);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<Date>(new Date());
  const [timeAgoText, setTimeAgoText] = useState('Just now');

  // Load and merge on mount or when props update
  useEffect(() => {
    const { telemetry: t, feedItems: f } = LiveFeedService.getMergedFeed({
      community,
      alerts,
      incidents,
      assistanceRequests,
      missions,
      auditLogs,
    });
    setTelemetry(t);
    setFeedItems(f);
  }, [community, alerts, incidents, assistanceRequests, missions, auditLogs]);

  // Network connectivity listener
  useEffect(() => {
    const handleConnectivity = () => {
      setIsOfflineMode(LiveFeedService.isOffline());
    };
    window.addEventListener('online', handleConnectivity);
    window.addEventListener('offline', handleConnectivity);
    const interval = setInterval(handleConnectivity, 3000);
    return () => {
      window.removeEventListener('online', handleConnectivity);
      window.removeEventListener('offline', handleConnectivity);
      clearInterval(interval);
    };
  }, []);

  // Time-ago ticker
  useEffect(() => {
    const timer = setInterval(() => {
      const diffSec = Math.floor((Date.now() - lastUpdatedTime.getTime()) / 1000);
      if (diffSec < 5) setTimeAgoText('Just now');
      else if (diffSec < 60) setTimeAgoText(`${diffSec}s ago`);
      else setTimeAgoText(`${Math.floor(diffSec / 60)}m ago`);
    }, 2000);
    return () => clearInterval(timer);
  }, [lastUpdatedTime]);

  // Unified telemetry polling handler (eliminates redundant polling logic)
  const executeTelemetryPoll = () => {
    const result = LiveFeedService.pollFreshTelemetry(telemetry);
    setTelemetry(result.telemetry);
    setLastUpdatedTime(new Date());

    if (result.newItem) {
      setFeedItems((prev) => [result.newItem!, ...prev.slice(0, 30)]);
      if (!isAudioMuted) {
        try {
          emergencyAudio.play('CHIME', 0.8);
        } catch {
          // audio context locked
        }
      }
    }
    return result;
  };

  // Periodic live telemetry simulation stream
  useEffect(() => {
    if (!isLiveStreaming) return;
    const streamInterval = setInterval(executeTelemetryPoll, 25000);
    return () => clearInterval(streamInterval);
  }, [isLiveStreaming, telemetry, isAudioMuted]);

  // Manual Poll
  const handleManualPoll = () => {
    if (isPolling) return;
    setIsPolling(true);
    setTimeout(() => {
      executeTelemetryPoll();
      setIsPolling(false);
    }, 450);
  };

  // Sync Live Real-Time Weather from Trusted Meteorological Sources (Open-Meteo WMO / Station Telemetry)
  const handleSyncLiveWeather = async () => {
    if (isSyncingWeather) return;
    setIsSyncingWeather(true);
    try {
      const result = await LiveFeedService.fetchLiveWeatherFeed();
      setTelemetry(result.telemetry);
      setLastUpdatedTime(new Date());

      if (result.newItem) {
        setFeedItems((prev) => [result.newItem!, ...prev.slice(0, 30)]);
        if (!isAudioMuted) {
          try {
            emergencyAudio.play('CHIME', 0.8);
          } catch {
            // Audio context locked
          }
        }
      }

      setWeatherSyncToast(
        result.source === 'NETWORK'
          ? 'Live weather synced from Open-Meteo / WMO Station'
          : 'Offline mode: loaded cached meteorological telemetry'
      );
      setTimeout(() => setWeatherSyncToast(null), 3500);
    } catch {
      setWeatherSyncToast('Weather telemetry up to date (offline cache)');
      setTimeout(() => setWeatherSyncToast(null), 3500);
    } finally {
      setIsSyncingWeather(false);
    }
  };

  // Toggle Audio Mute
  const handleToggleMute = () => {
    const nextMuted = !isAudioMuted;
    setIsAudioMuted(nextMuted);
    LiveFeedService.setAudioMuted(nextMuted);
  };

  // Inject Simulated Bulletin & Synchronize Telemetry Ribbon
  const handleInjectDrill = (type: 'PAGASA_TORRENTIAL' | 'MARIKINA_3RD_ALARM' | 'PHIVOLCS_QUAKE' | 'DAM_DISCHARGE') => {
    setShowSimulateMenu(false);
    let injected: LiveFeedItem;

    if (type === 'PAGASA_TORRENTIAL') {
      const updatedTel: EnvironmentalTelemetry = {
        ...telemetry,
        rainfallIntensityMmHr: 48.5,
        rainfallCategory: 'TORRENTIAL',
        rainfallAdvisoryLevel: 'RED',
        windSpeedKph: Math.max(telemetry.windSpeedKph, 75),
        radarReflectivityDbz: 58,
        lastUpdated: new Date().toISOString(),
      };
      setTelemetry(updatedTel);
      LiveFeedService.saveTelemetry(updatedTel);

      injected = LiveFeedService.injectSimulatedBulletin({
        source: 'PAGASA',
        sourceName: 'DOST-PAGASA Flash Rain Gauge',
        category: 'WEATHER',
        severity: 'CRITICAL',
        title: 'PAGASA EXTREME ADVISORY: 48.5 mm/hr Cloudburst over Upper Marikina Catchment',
        summary: 'Radar detection shows stationary squall line over San Mateo-Rodriguez headwaters. Massive surface inflow underway.',
        details: 'Precipitation rate exceeding 45 mm/hr. Flash flood threat critical within 45 to 90 minutes along riverbanks.',
        telemetrySnapshot: {
          rainfallIntensityMmHr: 48.5,
          windSpeedKph: 75,
          radarReflectivityDbz: 58,
        },
        actionRecommendation: 'Issue immediate siren broadcast for Tumana Purok 4 and river delta sectors.',
      });
    } else if (type === 'MARIKINA_3RD_ALARM') {
      const updatedTel: EnvironmentalTelemetry = {
        ...telemetry,
        riverWaterLevelMeters: 18.15,
        riverAlertLevel: 3,
        lastUpdated: new Date().toISOString(),
      };
      setTelemetry(updatedTel);
      LiveFeedService.saveTelemetry(updatedTel);

      injected = LiveFeedService.injectSimulatedBulletin({
        source: 'EFCOS_MARIKINA',
        sourceName: 'Marikina River Ultrasonic Network',
        category: 'RIVER_TELEMETRY',
        severity: 'CRITICAL',
        title: '3RD ALARM THRESHOLD BREACH: River Elevation 18.15m (Forced Evacuation Enacted)',
        summary: 'Water level crossed 18.00m threshold at Sto. Niño sensor. Complete mandatory evacuation of riverside zones underway.',
        details: 'Sensors: Sto. Niño: 18.15m · Tumana: 17.95m · Nangka: 17.80m. Alarm sirens triggered citywide by CDRRMO.',
        telemetrySnapshot: {
          riverWaterLevelMeters: 18.15,
          riverAlertLevel: 3,
        },
        actionRecommendation: 'Mobilize all reserve rubber boats and activate secondary evacuation centers.',
      });
    } else if (type === 'PHIVOLCS_QUAKE') {
      const updatedTel: EnvironmentalTelemetry = {
        ...telemetry,
        seismicStatus: 'Mag 4.8 · PEIS Intensity IV felt in Marikina',
        lastUpdated: new Date().toISOString(),
      };
      setTelemetry(updatedTel);
      LiveFeedService.saveTelemetry(updatedTel);

      injected = LiveFeedService.injectSimulatedBulletin({
        source: 'PHIVOLCS',
        sourceName: 'DOST-PHIVOLCS Earthquake Center',
        category: 'AGENCY',
        severity: 'WARNING',
        title: 'PHIVOLCS Earthquake Information: Mag 4.8 Recorded 18km E of Rodriguez, Rizal',
        summary: 'Felt at PEIS Intensity IV in Marikina City and San Mateo. Inspect river dikes and bridge foundations for ground ruptures.',
        details: 'Depth of focus: 10 km. Tectonic in origin. Evaluated by Philippine Seismic Network. Aftershocks possible.',
        telemetrySnapshot: {
          seismicStatus: 'Mag 4.8 · PEIS Intensity IV felt',
        },
        actionRecommendation: 'Dispatch structural damage assessment teams along Marikina River dike wall.',
      });
    } else {
      injected = LiveFeedService.injectSimulatedBulletin({
        source: 'EFCOS_MARIKINA',
        sourceName: 'National Irrigation Administration / MMDA',
        category: 'RIVER_TELEMETRY',
        severity: 'WARNING',
        title: 'Dam Water Elevation Advisory: Ipo & Bustos Dam Spillway Radial Gates Hoisted',
        summary: 'Controlled discharge of 280 m³/s upstream. Backwater surge buffer monitors active along tributary waterways.',
        details: 'Upstream reservoir elevation nearing spilling level. Spill operations monitored continuously.',
        actionRecommendation: 'Coordinate with downstream floodgate operators at Rosario and Manggahan.',
      });
    }

    setFeedItems((prev) => [injected, ...prev.slice(0, 30)]);
    setLastUpdatedTime(new Date());
    if (!isAudioMuted) {
      try {
        emergencyAudio.play('CHIME', 1);
      } catch {
        // audio unlock
      }
    }
  };

  // Reset Feed
  const handleResetFeed = () => {
    const { telemetry: t, feedItems: f } = LiveFeedService.resetToDefaults();
    setTelemetry(t);
    setFeedItems(f);
    setLastUpdatedTime(new Date());
  };

  // Filter Items
  const filteredItems = useMemo(() => {
    return feedItems.filter((item) => {
      // Category filter
      if (selectedCategory !== 'ALL' && item.category !== selectedCategory) {
        return false;
      }
      // Source filter
      if (selectedSource !== 'ALL' && item.source !== selectedSource) {
        return false;
      }
      // Severity filter
      if (severityFilter === 'CRITICAL' && item.severity !== 'CRITICAL') {
        return false;
      }
      if (severityFilter === 'WARNING_AND_UP' && item.severity !== 'CRITICAL' && item.severity !== 'WARNING') {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesSummary = item.summary.toLowerCase().includes(q);
        const matchesSource = item.sourceName.toLowerCase().includes(q);
        const matchesDetails = (item.details || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesSummary && !matchesSource && !matchesDetails) {
          return false;
        }
      }
      return true;
    });
  }, [feedItems, selectedCategory, selectedSource, severityFilter, searchQuery]);

  const getSourceBadgeClass = (source: LiveFeedSource) => {
    switch (source) {
      case 'PAGASA':
        return 'bg-sky-50 text-sky-800 border-sky-200';
      case 'OPEN_METEO':
        return 'bg-teal-50 text-teal-800 border-teal-200';
      case 'EFCOS_MARIKINA':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'DOST_RADAR':
        return 'bg-cyan-50 text-cyan-800 border-cyan-200';
      case 'JTWC':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'NDRRMC':
        return 'bg-indigo-50 text-indigo-800 border-indigo-200';
      case 'PHIVOLCS':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      case 'FIELD_OPS':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'COORDINATOR':
      default:
        return 'bg-neutral-100 text-neutral-800 border-neutral-200';
    }
  };

  // Counts for filter pills
  const counts = useMemo(() => {
    return {
      all: feedItems.length,
      weather: feedItems.filter((i) => i.category === 'WEATHER').length,
      river: feedItems.filter((i) => i.category === 'RIVER_TELEMETRY').length,
      agency: feedItems.filter((i) => i.category === 'AGENCY').length,
      ops: feedItems.filter((i) => i.category === 'FIELD_OPS').length,
    };
  }, [feedItems]);

  return (
    <div className="bg-white rounded-xl border border-neutral-200/90 shadow-2xs overflow-hidden space-y-0">
      {/* ======================================================== */}
      {/* 1. COMMAND HEADER & LIVE STREAM TELEMETRY BAR             */}
      {/* ======================================================== */}
      <div className="p-4 sm:p-5 border-b border-neutral-200/80 bg-neutral-50/70">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Title and Scope */}
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-neutral-900 text-white flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
              <Radio className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-semibold text-sm sm:text-base text-neutral-900 tracking-tight flex items-center gap-1.5">
                  <span>Live Operations Intelligence Feed</span>
                </h2>

                {/* Connection Status Badge */}
                {isOfflineMode ? (
                  <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-mono font-medium flex items-center gap-1.5">
                    <WifiOff className="w-3 h-3 text-amber-600" />
                    <span>CACHED TELEMETRY • OFFLINE</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-mono font-medium flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>LIVE TELEMETRY STREAM</span>
                  </span>
                )}

                <span className="text-[11px] font-mono text-neutral-400 tabular-nums">
                  Updated {timeAgoText}
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">
                Integrated DOST-PAGASA radar, MMDA-EFCOS river stage, NDRRMC alerts, PHIVOLCS seismology, and field signals.
              </p>
            </div>
          </div>

          {/* Action Tools */}
          <div className="flex flex-wrap items-center gap-2 self-start lg:self-center">
            {/* Play/Pause Auto-Stream */}
            <button
              type="button"
              onClick={() => setIsLiveStreaming(!isLiveStreaming)}
              className={`px-2.5 py-1.5 rounded-md text-xs font-medium border transition flex items-center gap-1.5 shadow-2xs ${
                isLiveStreaming
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-neutral-100 text-neutral-700 border-neutral-300 hover:bg-neutral-200'
              }`}
              title={isLiveStreaming ? 'Pause live stream simulation' : 'Resume live stream simulation'}
            >
              {isLiveStreaming ? <Pause className="w-3 h-3 text-emerald-700" /> : <Play className="w-3 h-3" />}
              <span>{isLiveStreaming ? 'Live Streaming' : 'Stream Paused'}</span>
            </button>

            {/* Sync Live Weather from Open-Meteo & Trusted Providers */}
            <button
              type="button"
              onClick={handleSyncLiveWeather}
              disabled={isSyncingWeather}
              className="px-2.5 py-1.5 rounded-md bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-medium shadow-2xs transition flex items-center gap-1.5 disabled:opacity-50"
              title="Sync live weather telemetry from Open-Meteo (WMO)"
            >
              <CloudRain className={`w-3.5 h-3.5 ${isSyncingWeather ? 'animate-bounce text-teal-600' : 'text-teal-700'}`} />
              <span>{isSyncingWeather ? 'Syncing...' : 'Sync Live Weather'}</span>
            </button>

            {/* Trusted Weather Sources Directory */}
            <button
              type="button"
              onClick={() => setShowTrustedSourcesModal(true)}
              className="px-2.5 py-1.5 rounded-md bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-200 text-xs font-medium shadow-2xs transition flex items-center gap-1.5"
              title="Inspect verified meteorological and agency sources"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Trusted Sources</span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-mono tabular-nums border border-emerald-200">
                {LiveFeedService.getTrustedWeatherSources().length}
              </span>
            </button>

            {/* Manual Poll */}
            <button
              type="button"
              onClick={handleManualPoll}
              disabled={isPolling}
              className="px-2.5 py-1.5 rounded-md bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-200 text-xs font-medium shadow-2xs transition flex items-center gap-1.5 disabled:opacity-50"
              title="Poll latest sensor telemetry"
            >
              <RefreshCw className={`w-3 h-3 ${isPolling ? 'animate-spin text-neutral-900' : 'text-neutral-500'}`} />
              <span>Poll</span>
            </button>

            {/* Audio Chime Mute/Unmute */}
            <button
              type="button"
              onClick={handleToggleMute}
              className={`p-1.5 rounded-md border text-xs shadow-2xs transition ${
                isAudioMuted
                  ? 'bg-neutral-100 text-neutral-400 border-neutral-200 hover:text-neutral-600'
                  : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
              }`}
              title={isAudioMuted ? 'Unmute alert tone' : 'Mute alert tone'}
            >
              {isAudioMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-neutral-600" />}
            </button>

            {/* Drill Simulation Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowSimulateMenu(!showSimulateMenu)}
                className="px-2.5 py-1.5 rounded-md bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium shadow-2xs transition flex items-center gap-1.5"
              >
                <Zap className="w-3 h-3 text-amber-400" />
                <span>Simulate Drill</span>
                <ChevronDown className="w-3 h-3 text-neutral-400" />
              </button>

              {showSimulateMenu && (
                <div className="absolute right-0 mt-1 w-64 bg-white rounded-lg border border-neutral-200 shadow-lg py-1 z-20 text-xs">
                  <div className="px-3 py-1.5 font-semibold text-[10px] text-neutral-400 uppercase tracking-wider border-b border-neutral-100">
                    Inject Live Drill Packet
                  </div>
                  <button
                    type="button"
                    onClick={() => handleInjectDrill('PAGASA_TORRENTIAL')}
                    className="w-full text-left px-3 py-2 hover:bg-neutral-50 text-neutral-800 hover:text-rose-700 transition flex items-center gap-2"
                  >
                    <Wind className="w-3.5 h-3.5 text-rose-600" />
                    <span>PAGASA 48.5mm/hr Cloudburst</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInjectDrill('MARIKINA_3RD_ALARM')}
                    className="w-full text-left px-3 py-2 hover:bg-neutral-50 text-neutral-800 hover:text-rose-700 transition flex items-center gap-2"
                  >
                    <Droplets className="w-3.5 h-3.5 text-rose-600" />
                    <span>Marikina 18.15m 3rd Alarm Surge</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInjectDrill('PHIVOLCS_QUAKE')}
                    className="w-full text-left px-3 py-2 hover:bg-neutral-50 text-neutral-800 hover:text-amber-700 transition flex items-center gap-2"
                  >
                    <Activity className="w-3.5 h-3.5 text-amber-600" />
                    <span>PHIVOLCS Mag 4.8 PEIS IV Quake</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInjectDrill('DAM_DISCHARGE')}
                    className="w-full text-left px-3 py-2 hover:bg-neutral-50 text-neutral-800 hover:text-sky-700 transition flex items-center gap-2 border-t border-neutral-100"
                  >
                    <Waves className="w-3.5 h-3.5 text-sky-600" />
                    <span>Upstream Dam Spillway Release</span>
                  </button>
                  <div className="border-t border-neutral-100 pt-1 mt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setShowSimulateMenu(false);
                        handleResetFeed();
                      }}
                      className="w-full text-left px-3 py-1.5 text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50 transition flex items-center gap-1.5 text-[11px]"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset to Baseline Telemetry</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Weather Sync Feedback Toast */}
        {weatherSyncToast && (
          <div className="mt-3 px-3 py-2 rounded-lg bg-teal-50/90 border border-teal-200/90 text-teal-900 text-xs flex items-center justify-between shadow-2xs animate-in fade-in duration-200">
            <span className="flex items-center gap-2 font-medium">
              <CloudRain className="w-4 h-4 text-teal-600 shrink-0" />
              <span>{weatherSyncToast}</span>
            </span>
            <button
              type="button"
              onClick={() => setWeatherSyncToast(null)}
              className="p-1 text-teal-600 hover:text-teal-900 rounded transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ======================================================== */}
        {/* 2. REAL-TIME SENSOR TELEMETRY RIBBON (6 LINEAR KPI BLOCKS) */}
        {/* ======================================================== */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 mt-4">
          {/* Metric 1: Rainfall Intensity */}
          <div className="p-3 rounded-lg bg-white border border-neutral-200/90 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-[11px] font-medium text-neutral-500">
              <span className="flex items-center gap-1 truncate">
                <Droplets className="w-3.5 h-3.5 text-sky-600" />
                <span>Rainfall</span>
              </span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-medium border ${
                  telemetry.rainfallAdvisoryLevel === 'RED'
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : telemetry.rainfallAdvisoryLevel === 'ORANGE'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : telemetry.rainfallAdvisoryLevel === 'YELLOW'
                    ? 'bg-amber-50/70 text-amber-700 border-amber-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}
              >
                {telemetry.rainfallAdvisoryLevel}
              </span>
            </div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 font-mono tabular-nums">
                {telemetry.rainfallIntensityMmHr.toFixed(1)}
              </span>
              <span className="text-[11px] font-medium text-neutral-400">mm/hr</span>
            </div>
            <div className="text-[10px] text-neutral-500 truncate flex items-center justify-between">
              <span>{telemetry.rainfallCategory}</span>
              <span className="font-mono text-neutral-400">AWS Sto. Niño</span>
            </div>
          </div>

          {/* Metric 2: Wind Speed & Gusts */}
          <div className="p-3 rounded-lg bg-white border border-neutral-200/90 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-[11px] font-medium text-neutral-500">
              <span className="flex items-center gap-1 truncate">
                <Wind className="w-3.5 h-3.5 text-cyan-600" />
                <span>Wind & Gusts</span>
              </span>
              <span className="font-mono text-[10px] text-neutral-700 font-medium">{telemetry.windDirection}</span>
            </div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 font-mono tabular-nums">
                {telemetry.windSpeedKph}
              </span>
              <span className="text-[11px] font-medium text-neutral-400">km/h</span>
            </div>
            <div className="text-[10px] text-neutral-500 truncate flex items-center justify-between">
              <span>Gusts {telemetry.windGustKph} km/h</span>
              <span className="font-mono text-neutral-400">Gale Alert</span>
            </div>
          </div>

          {/* Metric 3: Atmospheric Pressure */}
          <div className="p-3 rounded-lg bg-white border border-neutral-200/90 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-[11px] font-medium text-neutral-500">
              <span className="flex items-center gap-1 truncate">
                <Compass className="w-3.5 h-3.5 text-indigo-600" />
                <span>Barometer</span>
              </span>
              <span
                className={`text-[10px] font-medium flex items-center gap-0.5 ${
                  telemetry.pressureTrend === 'RAPIDLY_DROPPING'
                    ? 'text-rose-700'
                    : telemetry.pressureTrend === 'RISING'
                    ? 'text-emerald-700'
                    : 'text-neutral-600'
                }`}
              >
                {telemetry.pressureTrend === 'RAPIDLY_DROPPING' ? (
                  <TrendingDown className="w-2.5 h-2.5" />
                ) : telemetry.pressureTrend === 'RISING' ? (
                  <TrendingUp className="w-2.5 h-2.5" />
                ) : (
                  <ArrowRight className="w-2.5 h-2.5" />
                )}
                <span>
                  {telemetry.pressureTrend === 'RAPIDLY_DROPPING'
                    ? 'Dropping'
                    : telemetry.pressureTrend === 'RISING'
                    ? 'Rising'
                    : 'Steady'}
                </span>
              </span>
            </div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 font-mono tabular-nums">
                {telemetry.atmosphericPressureHpa.toFixed(1)}
              </span>
              <span className="text-[11px] font-medium text-neutral-400">hPa</span>
            </div>
            <div className="text-[10px] text-neutral-500 truncate">
              {telemetry.atmosphericPressureHpa < 1000 ? 'Low pressure cyclone corridor' : 'Barometric equilibrium'}
            </div>
          </div>

          {/* Metric 4: TCWS Signal & Cyclone */}
          <div className="p-3 rounded-lg bg-white border border-neutral-200/90 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-[11px] font-medium text-neutral-500">
              <span className="flex items-center gap-1 truncate">
                <Flame className="w-3.5 h-3.5 text-amber-600" />
                <span>PAGASA TCWS</span>
              </span>
              <span className="px-1.5 py-0.5 rounded bg-neutral-900 text-white font-mono text-[10px] font-medium">
                Signal #{telemetry.tcwsSignalLevel || 0}
              </span>
            </div>
            <div className="truncate font-semibold text-sm text-neutral-900 mt-1" title={telemetry.cycloneName}>
              {telemetry.cycloneName || 'No Active Cyclone'}
            </div>
            <div className="text-[10px] text-neutral-500 truncate tabular-nums">
              {telemetry.cycloneMovementSpeedKph || 20} km/h {telemetry.windDirection || 'WNW'} • {telemetry.cycloneDistanceKm || 145}km
            </div>
          </div>

          {/* Metric 5: Marikina River Stage */}
          <div className="p-3 rounded-lg bg-white border border-neutral-200/90 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-[11px] font-medium text-neutral-500">
              <span className="flex items-center gap-1 truncate">
                <Waves className="w-3.5 h-3.5 text-emerald-600" />
                <span>River Stage</span>
              </span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                  telemetry.riverAlertLevel >= 3
                    ? 'bg-rose-50 text-rose-700 border-rose-200 font-semibold'
                    : telemetry.riverAlertLevel === 2
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : telemetry.riverAlertLevel === 1
                    ? 'bg-amber-50/70 text-amber-700 border-amber-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}
              >
                {telemetry.riverAlertLevel >= 3
                  ? '3rd Alarm'
                  : telemetry.riverAlertLevel === 2
                  ? '2nd Alarm'
                  : telemetry.riverAlertLevel === 1
                  ? '1st Alarm'
                  : 'Normal Flow'}
              </span>
            </div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 font-mono tabular-nums">
                {telemetry.riverWaterLevelMeters.toFixed(1)}
              </span>
              <span className="text-[11px] font-medium text-neutral-400">meters</span>
            </div>
            <div className="text-[10px] text-neutral-500 truncate tabular-nums">
              {telemetry.riverWaterLevelMeters >= 18.0
                ? 'Forced Evacuation Enacted'
                : `${(18.0 - telemetry.riverWaterLevelMeters).toFixed(1)}m to Forced Evac`}
            </div>
          </div>

          {/* Metric 6: Doppler Radar & Seismology */}
          <div className="p-3 rounded-lg bg-white border border-neutral-200/90 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-[11px] font-medium text-neutral-500">
              <span className="flex items-center gap-1 truncate">
                <Activity className="w-3.5 h-3.5 text-indigo-600" />
                <span>Doppler / PEIS</span>
              </span>
              <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono text-[10px] font-medium">
                {telemetry.radarReflectivityDbz} dBZ
              </span>
            </div>
            <div className="truncate font-semibold text-xs text-neutral-900 mt-1">
              Tagaytay Doppler Online
            </div>
            <div className="text-[10px] text-neutral-500 truncate" title={telemetry.seismicStatus}>
              {telemetry.seismicStatus
                ? telemetry.seismicStatus.includes(':')
                  ? telemetry.seismicStatus.split(':')[1].trim()
                  : telemetry.seismicStatus
                : 'Fault Quiet (PEIS 0)'}
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. FILTER TABS & SEARCH BAR                                */}
      {/* ======================================================== */}
      <div className="px-4 py-3 border-b border-neutral-200/80 bg-neutral-50/50 flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        {/* Category Segmented Control */}
        <div className="inline-flex flex-wrap items-center p-0.5 bg-neutral-100 rounded-lg border border-neutral-200/70">
          <button
            type="button"
            onClick={() => setSelectedCategory('ALL')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
              selectedCategory === 'ALL'
                ? 'bg-white text-neutral-900 shadow-2xs font-semibold'
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            All Updates ({counts.all})
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('WEATHER')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition flex items-center gap-1 ${
              selectedCategory === 'WEATHER'
                ? 'bg-white text-neutral-900 shadow-2xs font-semibold'
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Wind className="w-3 h-3 text-sky-600" />
            <span>Weather ({counts.weather})</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('RIVER_TELEMETRY')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition flex items-center gap-1 ${
              selectedCategory === 'RIVER_TELEMETRY'
                ? 'bg-white text-neutral-900 shadow-2xs font-semibold'
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Droplets className="w-3 h-3 text-emerald-600" />
            <span>River Telemetry ({counts.river})</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('AGENCY')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition flex items-center gap-1 ${
              selectedCategory === 'AGENCY'
                ? 'bg-white text-neutral-900 shadow-2xs font-semibold'
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Shield className="w-3 h-3 text-indigo-600" />
            <span>Agencies ({counts.agency})</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('FIELD_OPS')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition flex items-center gap-1 ${
              selectedCategory === 'FIELD_OPS'
                ? 'bg-white text-neutral-900 shadow-2xs font-semibold'
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Radio className="w-3 h-3 text-amber-600" />
            <span>Field Ops ({counts.ops})</span>
          </button>
        </div>

        {/* Search & Severity Filter */}
        <div className="flex items-center gap-2">
          {/* Search Input */}
          <div className="relative flex-1 md:w-56">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter bulletins..."
              className="w-full pl-8 pr-3 py-1.5 rounded-md bg-white border border-neutral-200 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Source Dropdown Filter */}
          <select
            value={selectedSource}
            onChange={(e: any) => setSelectedSource(e.target.value)}
            className="px-2.5 py-1.5 rounded-md bg-white border border-neutral-200 text-xs font-medium text-neutral-700 focus:outline-none focus:ring-1 focus:ring-neutral-900 shadow-2xs"
            title="Filter by trusted source"
          >
            <option value="ALL">All Sources ({feedItems.length})</option>
            <option value="PAGASA">DOST-PAGASA ({feedItems.filter((i) => i.source === 'PAGASA').length})</option>
            <option value="OPEN_METEO">Open-Meteo / WMO ({feedItems.filter((i) => i.source === 'OPEN_METEO').length})</option>
            <option value="EFCOS_MARIKINA">MMDA EFCOS River ({feedItems.filter((i) => i.source === 'EFCOS_MARIKINA').length})</option>
            <option value="DOST_RADAR">DOST Radar ({feedItems.filter((i) => i.source === 'DOST_RADAR').length})</option>
            <option value="JTWC">JTWC Cyclone ({feedItems.filter((i) => i.source === 'JTWC').length})</option>
            <option value="NDRRMC">NDRRMC ECBS ({feedItems.filter((i) => i.source === 'NDRRMC').length})</option>
            <option value="PHIVOLCS">PHIVOLCS ({feedItems.filter((i) => i.source === 'PHIVOLCS').length})</option>
            <option value="FIELD_OPS">Field Ops ({feedItems.filter((i) => i.source === 'FIELD_OPS').length})</option>
          </select>

          {/* Severity Dropdown */}
          <select
            value={severityFilter}
            onChange={(e: any) => setSeverityFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-md bg-white border border-neutral-200 text-xs font-medium text-neutral-700 focus:outline-none focus:ring-1 focus:ring-neutral-900 shadow-2xs"
          >
            <option value="ALL">All Severities</option>
            <option value="WARNING_AND_UP">Warning & Critical</option>
            <option value="CRITICAL">Critical Only</option>
          </select>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. LIVE BULLETIN STREAM FEED LIST                         */}
      {/* ======================================================== */}
      <div className="divide-y divide-neutral-100 max-h-[520px] overflow-y-auto">
        {filteredItems.map((item) => {
          const isCritical = item.severity === 'CRITICAL';
          const isWarning = item.severity === 'WARNING';

          return (
            <div
              key={item.id}
              className={`p-3.5 sm:p-4 hover:bg-neutral-50/70 transition space-y-2 border-l-[3px] ${
                isCritical
                  ? 'border-l-rose-500 bg-rose-50/20'
                  : isWarning
                  ? 'border-l-amber-500 bg-amber-50/15'
                  : 'border-l-transparent'
              }`}
            >
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Source Badge */}
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-medium tracking-wide border ${getSourceBadgeClass(
                        item.source
                      )}`}
                    >
                      {item.sourceName}
                    </span>

                    {/* Verified Trusted Meteorological Source Badge */}
                    {item.isVerifiedSource && (
                      <span
                        className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[9px] font-mono font-medium flex items-center gap-1"
                        title={item.sourceAgency || 'Verified Trusted Meteorological / Agency Source'}
                      >
                        <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" />
                        <span>TRUSTED</span>
                      </span>
                    )}

                    {/* Severity Pill */}
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider border ${
                        isCritical
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : isWarning
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : item.severity === 'ADVISORY'
                          ? 'bg-sky-50 text-sky-800 border-sky-200'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      }`}
                    >
                      {item.severity}
                    </span>

                    {/* Pinned Pill */}
                    {item.isPinned && (
                      <span className="px-1.5 py-0.5 rounded bg-neutral-900 text-white text-[9px] font-mono font-semibold tracking-wider">
                        PINNED
                      </span>
                    )}

                    {/* Simulated Pill */}
                    {item.isSimulated && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[9px] font-mono font-medium">
                        DRILL
                      </span>
                    )}

                    {/* Timestamp */}
                    <span className="text-[11px] font-mono text-neutral-400 tabular-nums ml-auto sm:ml-0">
                      {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-semibold text-xs sm:text-sm text-neutral-900 leading-snug">
                    {item.title}
                  </h3>
                </div>

                {/* Quick Coordinator Action Buttons */}
                <div className="flex items-center gap-1.5 shrink-0 self-start">
                  {onOpenAdvisoryModal && (item.category === 'WEATHER' || item.category === 'RIVER_TELEMETRY') && (
                    <button
                      type="button"
                      onClick={() =>
                        onOpenAdvisoryModal({
                          title: item.title,
                          message: item.summary,
                          disasterName: telemetry.cycloneName,
                        })
                      }
                      className="px-2.5 py-1 rounded-md bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-200 text-xs font-medium transition flex items-center gap-1 shadow-2xs"
                      title="Broadcast bulletin to community as official advisory"
                    >
                      <Send className="w-3 h-3 text-neutral-500" />
                      <span className="hidden sm:inline">Broadcast</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setSelectedBulletin(item)}
                    className="px-2.5 py-1 rounded-md bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium transition flex items-center gap-1 shadow-2xs"
                  >
                    <Eye className="w-3 h-3" />
                    <span>Inspect</span>
                  </button>
                </div>
              </div>

              {/* Summary */}
              <p className="text-xs text-neutral-600 leading-relaxed">
                {item.summary}
              </p>

              {/* Telemetry Snapshot Callouts if present */}
              {item.telemetrySnapshot && (
                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  {typeof item.telemetrySnapshot.rainfallIntensityMmHr === 'number' && (
                    <span className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-800 border border-sky-200 text-[11px] font-mono tabular-nums">
                      Rain: {item.telemetrySnapshot.rainfallIntensityMmHr} mm/hr
                    </span>
                  )}
                  {typeof item.telemetrySnapshot.riverWaterLevelMeters === 'number' && (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-mono tabular-nums">
                      River: {item.telemetrySnapshot.riverWaterLevelMeters.toFixed(2)}m
                    </span>
                  )}
                  {typeof item.telemetrySnapshot.windSpeedKph === 'number' && (
                    <span className="px-2 py-0.5 rounded-md bg-cyan-50 text-cyan-800 border border-cyan-200 text-[11px] font-mono tabular-nums">
                      Wind: {item.telemetrySnapshot.windSpeedKph} km/h (Gusts {item.telemetrySnapshot.windGustKph || 95})
                    </span>
                  )}
                  {typeof item.telemetrySnapshot.radarReflectivityDbz === 'number' && (
                    <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-800 border border-indigo-200 text-[11px] font-mono tabular-nums">
                      Echo: {item.telemetrySnapshot.radarReflectivityDbz} dBZ
                    </span>
                  )}
                  {typeof item.telemetrySnapshot.tcwsSignalLevel === 'number' && (
                    <span className="px-2 py-0.5 rounded-md bg-neutral-900 text-white text-[11px] font-mono font-medium tabular-nums">
                      TCWS Signal #{item.telemetrySnapshot.tcwsSignalLevel}
                    </span>
                  )}
                </div>
              )}

              {/* Action Recommendation */}
              {item.actionRecommendation && (
                <div className="p-2.5 rounded-lg bg-neutral-50 border border-neutral-200/80 text-xs text-neutral-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-start gap-1.5 flex-1">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-semibold text-neutral-900">Recommended Action: </strong>
                      <span className="text-neutral-600">{item.actionRecommendation}</span>
                    </div>
                  </div>
                  {onNavigateToTab && item.category === 'FIELD_OPS' && (
                    <button
                      type="button"
                      onClick={() => {
                        if (item.id.startsWith('ops_inc_')) onNavigateToTab('INCIDENTS');
                        else if (item.id.startsWith('ops_req_')) onNavigateToTab('ASSISTANCE');
                        else if (item.id.startsWith('ops_mis_')) onNavigateToTab('MISSIONS');
                      }}
                      className="shrink-0 self-start sm:self-auto px-2.5 py-1 rounded-md bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-200 font-medium text-xs flex items-center gap-1 transition shadow-2xs"
                    >
                      <span>Jump to {item.id.startsWith('ops_inc_') ? 'Incidents' : item.id.startsWith('ops_req_') ? 'Assistance' : 'Missions'}</span>
                      <ArrowRight className="w-3 h-3 text-neutral-400" />
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {filteredItems.length === 0 && (
          <div className="py-10 text-center space-y-2">
            <Radio className="w-6 h-6 text-neutral-300 mx-auto" />
            <p className="text-xs text-neutral-500 font-medium">
              No live telemetry bulletins match the current filter or search criteria.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('ALL');
                setSeverityFilter('ALL');
                setSearchQuery('');
              }}
              className="text-xs text-neutral-900 font-semibold underline hover:text-emerald-700 transition"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 5. BULLETIN DETAIL MODAL                                   */}
      {/* ======================================================== */}
      {selectedBulletin && (
        <div className="fixed inset-0 z-50 bg-neutral-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl border border-neutral-200 max-w-xl w-full p-5 sm:p-6 space-y-4 shadow-xl animate-modal text-neutral-900">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-neutral-100">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-neutral-100 text-neutral-800 border border-neutral-200">
                    {selectedBulletin.sourceName}
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider border ${
                      selectedBulletin.severity === 'CRITICAL'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : selectedBulletin.severity === 'WARNING'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    {selectedBulletin.severity}
                  </span>
                  <span className="text-[11px] font-mono text-neutral-400 tabular-nums">
                    {new Date(selectedBulletin.timestamp).toLocaleString()}
                  </span>
                </div>
                <h3 className="font-semibold text-base text-neutral-900 leading-snug">
                  {selectedBulletin.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBulletin(null)}
                className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-neutral-700">
              {/* Trusted Source Verification Banner */}
              {selectedBulletin.isVerifiedSource && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg bg-teal-50/80 border border-teal-200/80 text-teal-900 text-xs">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
                    <div>
                      <strong className="font-semibold">Verified Trusted Source: </strong>
                      <span>{selectedBulletin.sourceAgency || selectedBulletin.sourceName}</span>
                      {selectedBulletin.reliabilityScore && (
                        <span className="ml-1 text-teal-700 font-mono">({Math.round(selectedBulletin.reliabilityScore * 100)}% reliability)</span>
                      )}
                    </div>
                  </div>
                  {selectedBulletin.sourceUrl && (
                    <a
                      href={selectedBulletin.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-teal-700 hover:text-teal-900 underline font-medium flex items-center gap-1 self-start sm:self-auto shrink-0"
                    >
                      <span>Official Portal</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}

              <p className="font-medium text-neutral-900">{selectedBulletin.summary}</p>
              {selectedBulletin.details && (
                <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-200 space-y-1 font-mono text-[11px]">
                  <div className="font-semibold text-neutral-800">Technical Bulletin Details:</div>
                  <div className="text-neutral-600 whitespace-pre-wrap">{selectedBulletin.details}</div>
                </div>
              )}

              {selectedBulletin.actionRecommendation && (
                <div className="p-3 rounded-lg bg-emerald-50/80 border border-emerald-200 text-emerald-900 space-y-1">
                  <div className="font-semibold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Operations Command Recommendation</span>
                  </div>
                  <p className="text-emerald-800">{selectedBulletin.actionRecommendation}</p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                {onOpenAdvisoryModal && (selectedBulletin.category === 'WEATHER' || selectedBulletin.category === 'RIVER_TELEMETRY') && (
                  <button
                    type="button"
                    onClick={() => {
                      const data = {
                        title: selectedBulletin.title,
                        message: selectedBulletin.summary,
                        disasterName: telemetry.cycloneName,
                      };
                      setSelectedBulletin(null);
                      onOpenAdvisoryModal(data);
                    }}
                    className="px-3 py-1.5 rounded-md bg-amber-700 hover:bg-amber-800 text-white text-xs font-medium shadow-2xs transition flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Broadcast to Community</span>
                  </button>
                )}

                {onNavigateToTab && selectedBulletin.category === 'FIELD_OPS' && (
                  <button
                    type="button"
                    onClick={() => {
                      const targetTab = selectedBulletin.id.startsWith('ops_inc_')
                        ? 'INCIDENTS'
                        : selectedBulletin.id.startsWith('ops_req_')
                        ? 'ASSISTANCE'
                        : 'MISSIONS';
                      setSelectedBulletin(null);
                      onNavigateToTab(targetTab);
                    }}
                    className="px-3 py-1.5 rounded-md bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium shadow-2xs transition flex items-center gap-1.5"
                  >
                    <span>
                      Open in {selectedBulletin.id.startsWith('ops_inc_') ? 'Incidents' : selectedBulletin.id.startsWith('ops_req_') ? 'Assistance' : 'Missions'}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-neutral-400" />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setSelectedBulletin(null)}
                className="px-4 py-1.5 rounded-md bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-200 text-xs font-medium transition shadow-2xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. TRUSTED SOURCES DIRECTORY MODAL                        */}
      {/* ======================================================== */}
      {showTrustedSourcesModal && (
        <div className="fixed inset-0 z-50 bg-neutral-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl border border-neutral-200 max-w-2xl w-full p-5 sm:p-6 space-y-4 shadow-xl animate-modal text-neutral-900 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-base text-neutral-900 tracking-tight flex items-center gap-2">
                    <span>Trusted Weather & Sensor Telemetry Sources</span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-mono font-semibold tracking-wider border border-emerald-300">
                      VERIFIED AGENCIES
                    </span>
                  </h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Official government and international meteorological observation networks integrated into Resilia.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTrustedSourcesModal(false)}
                className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {LiveFeedService.getTrustedWeatherSources().map((src) => (
                <div key={src.id} className="p-3.5 rounded-lg border border-neutral-200/90 bg-neutral-50/50 space-y-2 hover:bg-neutral-50 transition">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold border ${src.badgeClass}`}>
                        {src.name}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-mono flex items-center gap-1 font-medium">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        <span>Verified</span>
                      </span>
                    </div>
                    {src.attributionUrl && (
                      <a
                        href={src.attributionUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-sky-700 hover:text-sky-900 underline font-medium flex items-center gap-1 self-start sm:self-auto"
                      >
                        <span>Official Portal</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <p className="text-xs text-neutral-600 leading-relaxed">
                    {src.description}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 text-[11px] font-mono text-neutral-500 border-t border-neutral-200/50">
                    <div><span className="font-semibold text-neutral-700">Coverage:</span> {src.coverage}</div>
                    <div><span className="font-semibold text-neutral-700">Frequency:</span> {src.updateFrequency}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-neutral-100 flex items-center justify-between">
              <p className="text-[11px] text-neutral-500 font-mono">
                Offline-ready: All telemetry packets cached locally with automatic fallback.
              </p>
              <button
                type="button"
                onClick={() => setShowTrustedSourcesModal(false)}
                className="px-4 py-1.5 rounded-md bg-neutral-900 text-white text-xs font-medium hover:bg-neutral-800 transition shadow-2xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
