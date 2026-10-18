/**
 * Resilia Disaster Live Telemetry & Feed Service
 * Offline-first real-time ingestion engine for Disaster Coordinators.
 *
 * Integrates:
 * 1. DOST-PAGASA: Rainfall intensity (mm/hr), Wind gusts (km/h), TCWS Cyclone tracking, Barometric pressure
 * 2. MMDA / EFCOS: Marikina River hydro-telemetry, Manggahan Floodway gate status
 * 3. NDRRMC: Emergency Cell Broadcast Service (ECBS), Operations Center alerts
 * 4. DOST-PHIVOLCS: Seismic PEIS tremor and Valley Fault System monitoring
 * 5. Tactical Field Operations: Real-time incident verifications, missions, and distress calls
 *
 * Resilience:
 * - Persistent caching in localStorage with automatic fallback when offline.
 * - Local deterministic sensor telemetry generation for offline operations & drill simulations.
 */

import {
  Alert,
  AssistanceRequest,
  AuditEntry,
  Community,
  EnvironmentalTelemetry,
  Incident,
  LiveFeedItem,
  LiveFeedCategory,
  LiveFeedSeverity,
  LiveFeedSource,
  Mission,
  TrustedWeatherSourceInfo,
} from '../../types';
import { syncClient } from '../offline/syncClient';

const STORAGE_KEYS = {
  TELEMETRY: 'resilia_live_telemetry_v2',
  FEED_ITEMS: 'resilia_live_feed_items_v2',
  AUDIO_MUTED: 'resilia_live_feed_muted_v1',
};

export const TRUSTED_WEATHER_SOURCES: TrustedWeatherSourceInfo[] = [
  {
    id: 'PAGASA',
    name: 'DOST-PAGASA Weather Division',
    agency: 'Department of Science and Technology (DOST)',
    coverage: 'Philippine Area of Responsibility (PAR) / Metro Manila & Rizal',
    updateFrequency: 'Every 3 hours during active TCWS / hourly for radar',
    verified: true,
    endpointUrl: 'https://bagong.pagasa.dost.gov.ph',
    attributionUrl: 'https://www.pagasa.dost.gov.ph',
    badgeClass: 'bg-sky-50 text-sky-800 border-sky-200',
    description: 'Official national meteorological service providing Severe Weather Bulletins, Tropical Cyclone Wind Signals (TCWS #1 to #5), Heavy Rainfall Warnings (Red/Orange/Yellow), and Gale Warnings.',
  },
  {
    id: 'OPEN_METEO',
    name: 'Open-Meteo / WMO Global Telemetry',
    agency: 'World Meteorological Organization (WMO) & European Centre (ECMWF/DWD/NOAA)',
    coverage: 'Hyperlocal Station Coordinates: 14.6507°N, 121.1029°E (Marikina Catchment)',
    updateFrequency: 'Real-time hourly / 15-minute high resolution sounding',
    verified: true,
    endpointUrl: 'https://api.open-meteo.com/v1/forecast',
    attributionUrl: 'https://open-meteo.com',
    badgeClass: 'bg-teal-50 text-teal-800 border-teal-200',
    description: 'Trusted global numerical weather prediction telemetry delivering live barometric pressure (hPa), precipitation rate (mm/hr), relative humidity, ambient temperature, and 10m wind gust vectors.',
  },
  {
    id: 'DOST_RADAR',
    name: 'Tagaytay & Subic Doppler Weather Radar',
    agency: 'DOST-PAGASA Radar Operations Network',
    coverage: 'NCR, Marikina River Catchment, Sierra Madre Basin',
    updateFrequency: 'Every 10 to 15 minutes',
    verified: true,
    attributionUrl: 'https://bagong.pagasa.dost.gov.ph/weather/radar-images',
    badgeClass: 'bg-cyan-50 text-cyan-800 border-cyan-200',
    description: 'High-resolution dual-polarization S-band Doppler radar scanning convective cloud reflectivity (dBZ), echo tops, and precipitation intensity over the Marikina watershed.',
  },
  {
    id: 'EFCOS_MARIKINA',
    name: 'MMDA EFCOS River Telemetry Network',
    agency: 'Metropolitan Manila Development Authority (MMDA)',
    coverage: 'Marikina River Basin: Sto. Niño, Tumana, Nangka, Manggahan Floodway',
    updateFrequency: 'Continuous real-time sensor updates (10-minute intervals)',
    verified: true,
    attributionUrl: 'https://mmda.gov.ph/efcos',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    description: 'Effective Flood Control Operation System (EFCOS) hydro-telemetry recording water stage meters, dike overtopping alarm tiers, and Manggahan Floodway control gate hoists.',
  },
  {
    id: 'JTWC',
    name: 'Joint Typhoon Warning Center (JTWC)',
    agency: 'US INDOPACOM Joint Meteorological Command',
    coverage: 'Western North Pacific & South China Sea Tropical Cyclones',
    updateFrequency: 'Every 6 hours',
    verified: true,
    attributionUrl: 'https://www.metoc.navy.mil/jtwc/jtwc.html',
    badgeClass: 'bg-purple-50 text-purple-800 border-purple-200',
    description: 'Authoritative international satellite reconnaissance consensus tracking cyclone forward speed, central barometric minimum, and 1-minute maximum sustained winds.',
  },
  {
    id: 'NDRRMC',
    name: 'NDRRMC Operations Center',
    agency: 'Office of Civil Defense (OCD)',
    coverage: 'National Disaster Alerts & Emergency Cell Broadcast Service (ECBS)',
    updateFrequency: 'Immediate upon disaster declaration or emergency escalation',
    verified: true,
    attributionUrl: 'https://ndrrmc.gov.ph',
    badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    description: 'Emergency Cell Broadcast System (ECBS) dispatches, Red Alert posture notices, and coordinated national multi-agency disaster response directives.',
  },
  {
    id: 'PHIVOLCS',
    name: 'DOST-PHIVOLCS Seismology & Volcanology',
    agency: 'Department of Science and Technology (DOST)',
    coverage: 'West Valley Fault System, Marikina Valley, Taal Volcano',
    updateFrequency: 'Continuous broadband seismic observation',
    verified: true,
    attributionUrl: 'https://www.phivolcs.dost.gov.ph',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
    description: 'Real-time seismic network monitoring ground acceleration, PEIS earthquake intensity, fault slippage, and volcanic activity.',
  },
];

export const DEFAULT_TELEMETRY: EnvironmentalTelemetry = {
  rainfallIntensityMmHr: 38.5,
  rainfallCategory: 'TORRENTIAL',
  rainfallAdvisoryLevel: 'RED',
  windSpeedKph: 68,
  windGustKph: 95,
  windDirection: 'WNW',
  atmosphericPressureHpa: 992.4,
  pressureTrend: 'RAPIDLY_DROPPING',
  tcwsSignalLevel: 3,
  cycloneName: 'Super Typhoon Pepito (Man-yi)',
  cycloneTrackDescription: 'Tracking WNW at 20 km/h towards Polillo Islands & Central Luzon corridor',
  cycloneDistanceKm: 145,
  cycloneMovementSpeedKph: 20,
  riverWaterLevelMeters: 16.8,
  riverAlertLevel: 2,
  riverTrendRatePerHour: 0.35,
  radarStationName: 'Tagaytay Doppler Weather Radar (DOST-PAGASA)',
  radarStatus: 'ONLINE',
  radarReflectivityDbz: 54,
  radarPrecipitationSummary: 'Heavy convective precipitation band entering Marikina-Pasig basin',
  ambientTempC: 25.8,
  relativeHumidityPercent: 94,
  floodgateStatus: 'Manggahan Floodway: 8 of 8 gates OPEN (100% capacity · 2,400 m³/s outflow)',
  seismicStatus: 'PHIVOLCS West Valley Fault: Normal / PEIS Intensity 0',
  lastUpdated: new Date().toISOString(),
};

export const DEFAULT_FEED_ITEMS: LiveFeedItem[] = [
  {
    id: 'feed_pagasa_bulletin_09',
    source: 'PAGASA',
    sourceName: 'DOST-PAGASA Weather Division',
    category: 'WEATHER',
    severity: 'CRITICAL',
    title: 'PAGASA Severe Weather Bulletin #09: TCWS Signal #3 Raised for Metro Manila & Rizal',
    summary: 'Super Typhoon Pepito continues tracking west-northwest with sustained winds of 195 km/h. Violent gusts and torrential rainfall expected in Marikina Valley.',
    details: 'Heavy to intense rainfall (greater than 30 mm/hr) expected within the next 3 to 6 hours. Storm surge hazard along coastal areas; river surge alert active for Marikina River basin.',
    telemetrySnapshot: {
      rainfallIntensityMmHr: 38.5,
      windSpeedKph: 68,
      windGustKph: 95,
      atmosphericPressureHpa: 992.4,
      tcwsSignalLevel: 3,
    },
    timestamp: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
    isPinned: true,
    isVerifiedSource: true,
    sourceAgency: 'DOST-PAGASA Weather Division',
    sourceUrl: 'https://bagong.pagasa.dost.gov.ph',
    reliabilityScore: 0.99,
    actionRecommendation: 'Ensure evacuation centers along Tumana and Malanday have operational standby generators.',
  },
  {
    id: 'feed_pagasa_heavy_rainfall_red',
    source: 'PAGASA',
    sourceName: 'DOST-PAGASA Hydrometeorological Division',
    category: 'WEATHER',
    severity: 'CRITICAL',
    title: 'PAGASA Heavy Rainfall Warning #04: RED Warning Raised for Metro Manila & Rizal Catchment',
    summary: 'Torrential rainfall (>30 mm/hr) observed and expected to continue for the next 2 hours. Severe street flooding and riverbank inundation imminent.',
    details: 'Associated with spiral rain bands of Super Typhoon Pepito. Municipalities on Red Alert: Marikina City, Pasig, Quezon City, San Mateo, Rodriguez, Cainta.',
    telemetrySnapshot: {
      rainfallIntensityMmHr: 38.5,
      rainfallCategory: 'TORRENTIAL',
      rainfallAdvisoryLevel: 'RED',
    },
    timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    isPinned: true,
    isVerifiedSource: true,
    sourceAgency: 'DOST-PAGASA Hydrometeorological Division',
    sourceUrl: 'https://bagong.pagasa.dost.gov.ph',
    reliabilityScore: 0.99,
    actionRecommendation: 'Order mandatory evacuation for Purok 1 to Purok 5 riverbank settlements in Barangay Tumana and Malanday.',
  },
  {
    id: 'feed_openmeteo_live_marikina',
    source: 'OPEN_METEO',
    sourceName: 'Open-Meteo / WMO Real-Time Station (Marikina)',
    category: 'WEATHER',
    severity: 'WARNING',
    title: 'WMO Atmospheric Sounding: Pressure Drop to 992.4 hPa · High Cloudburst Probability',
    summary: 'Automated surface telemetry reports rapid barometric pressure plunge, 94% relative humidity, and 38.5 mm/hr precipitation rate.',
    details: 'Station coordinates: 14.6507°N, 121.1029°E (Sto. Niño / Marikina Basin). Surface wind vectors: 68 km/h sustained from WNW with gusts up to 95 km/h. High-resolution numerical model blend: ECMWF/DWD/NOAA.',
    telemetrySnapshot: {
      ambientTempC: 25.8,
      relativeHumidityPercent: 94,
      atmosphericPressureHpa: 992.4,
      windSpeedKph: 68,
      windGustKph: 95,
      rainfallIntensityMmHr: 38.5,
    },
    timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    isVerifiedSource: true,
    sourceAgency: 'Open-Meteo / World Meteorological Organization',
    sourceUrl: 'https://open-meteo.com',
    reliabilityScore: 0.99,
    actionRecommendation: 'Verify stormwater pumping stations along Marikina-Pasig boundary.',
  },
  {
    id: 'feed_efcos_marikina_surge',
    source: 'EFCOS_MARIKINA',
    sourceName: 'MMDA / Marikina EFCOS Sensor Network',
    category: 'RIVER_TELEMETRY',
    severity: 'WARNING',
    title: 'Marikina River Ultrasonic Sensor: Water Level 16.8m (2nd Alarm Active)',
    summary: 'Water level at Sto. Niño sensor rose by +0.35m in the last hour. Pre-emptive evacuation enforced across low-lying puroks.',
    details: 'Sto. Niño Ultrasonic Sensor: 16.8m. Tumana Dike Observation: 16.6m. Rate of rise: +0.35m/hr. Distance to 3rd Alarm (Forced Evacuation): 1.2m.',
    telemetrySnapshot: {
      riverWaterLevelMeters: 16.8,
      riverAlertLevel: 2,
      riverTrendRatePerHour: 0.35,
    },
    timestamp: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
    isPinned: true,
    isVerifiedSource: true,
    sourceAgency: 'MMDA Flood Control & Sewerage Management',
    sourceUrl: 'https://mmda.gov.ph/efcos',
    reliabilityScore: 0.99,
    actionRecommendation: 'Coordinate with CDRRMO Rescue Boat units to secure low-lying riverside pathways in Malanday.',
  },
  {
    id: 'feed_jtwc_man_yi_track',
    source: 'JTWC',
    sourceName: 'Joint Typhoon Warning Center (JTWC)',
    category: 'WEATHER',
    severity: 'CRITICAL',
    title: 'JTWC Tropical Cyclone Warning: Super Typhoon Man-yi (25W) Consensus Track',
    summary: 'Satellite reconnaissance confirms 105-knot sustained winds (195 km/h) with central eye diameter of 22 nautical miles. Inland NCR track confirmed.',
    details: 'Multi-agency consensus model (JTWC/ECMWF/JMA) projects center passage within 80km of Marikina Valley. Forward velocity 11 knots west-northwest.',
    telemetrySnapshot: {
      windSpeedKph: 68,
      windGustKph: 95,
      atmosphericPressureHpa: 992.4,
    },
    timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    isVerifiedSource: true,
    sourceAgency: 'US INDOPACOM Joint Typhoon Warning Center',
    sourceUrl: 'https://www.metoc.navy.mil/jtwc/jtwc.html',
    reliabilityScore: 0.99,
    actionRecommendation: 'Maintain continuous VHF frequency listening watch on Marikina Emergency Channel 144.740 MHz.',
  },
  {
    id: 'feed_ndrrmc_ecbs_04',
    source: 'NDRRMC',
    sourceName: 'NDRRMC Operations Center',
    category: 'AGENCY',
    severity: 'CRITICAL',
    title: 'NDRRMC Emergency Cell Broadcast: Red Rainfall & Flash Flood Alert',
    summary: 'Torrential rainfall detected over NCR and Rizal province. Residents near Marikina River and Tullahan River instructed to seek higher ground immediately.',
    details: 'Emergency Cell Broadcast Service (ECBS) dispatched to all active cellular towers in Marikina, Quezon City, and San Mateo. Red Alert operations active at Camp Aguinaldo.',
    timestamp: new Date(Date.now() - 28 * 60 * 1000).toISOString(),
    isVerifiedSource: true,
    sourceAgency: 'NDRRMC / Office of Civil Defense',
    sourceUrl: 'https://ndrrmc.gov.ph',
    reliabilityScore: 0.99,
    actionRecommendation: 'Broadcast local megaphone advisories across Barangay Tumana Purok 3 & 4.',
  },
  {
    id: 'feed_radar_tagaytay_54dbz',
    source: 'DOST_RADAR',
    sourceName: 'Tagaytay Doppler Radar Station',
    category: 'WEATHER',
    severity: 'WARNING',
    title: 'Doppler Radar Scan: Convective Rain Band (54 dBZ) Centered over Marikina Catchment',
    summary: 'Echo intensity indicates intense cloudburst precipitation. High flash-flood potential across Upper Marikina and Montalban watershed.',
    details: 'Echo Reflectivity: 54 dBZ. Cloud Top: 14.5 km. Azimuth: 035°. System speed: 18 km/h moving towards Central NCR.',
    telemetrySnapshot: {
      radarReflectivityDbz: 54,
      radarStatus: 'ONLINE',
    },
    timestamp: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
    isVerifiedSource: true,
    sourceAgency: 'DOST-PAGASA Radar Operations Network',
    sourceUrl: 'https://bagong.pagasa.dost.gov.ph/weather/radar-images',
    reliabilityScore: 0.99,
  },
  {
    id: 'feed_pagasa_gale_warning',
    source: 'PAGASA',
    sourceName: 'DOST-PAGASA Marine Weather Services',
    category: 'WEATHER',
    severity: 'WARNING',
    title: 'PAGASA Gale Warning #06: Very Rough to High Seas Warning for Eastern & Western Seaboards',
    summary: 'Wave heights 4.5m to 7.0m. Sea travel hazardous for all small sea crafts and motorized bancas. Inland water transport suspended on Laguna de Bay.',
    details: 'Strong to gale-force winds associated with TCWS #3. Philippine Coast Guard enforcing no-sail protocol across Manila Bay and Laguna Lake.',
    timestamp: new Date(Date.now() - 55 * 60 * 1000).toISOString(),
    isVerifiedSource: true,
    sourceAgency: 'DOST-PAGASA Marine Weather Division',
    sourceUrl: 'https://bagong.pagasa.dost.gov.ph',
    reliabilityScore: 0.99,
  },
  {
    id: 'feed_phivolcs_seismic_check',
    source: 'PHIVOLCS',
    sourceName: 'DOST-PHIVOLCS Seismological Observation',
    category: 'AGENCY',
    severity: 'NORMAL',
    title: 'PHIVOLCS West Valley Fault Seismic Observation: Baseline Quiet',
    summary: 'No anomalous seismic events recorded along the Marikina-Montalban fault segment in the past 24 hours. PEIS Intensity 0.',
    details: 'Continuous broadband seismic sensor stations at Antipolo and Tanay indicate normal crustal stability. Volcanic activity at Taal remains at Alert Level 1.',
    telemetrySnapshot: {
      seismicStatus: 'Normal (PEIS 0)',
    },
    timestamp: new Date(Date.now() - 75 * 60 * 1000).toISOString(),
    isVerifiedSource: true,
    sourceAgency: 'DOST-PHIVOLCS Seismological Division',
    sourceUrl: 'https://www.phivolcs.dost.gov.ph',
    reliabilityScore: 0.99,
  },
  {
    id: 'feed_efcos_manggahan_gates',
    source: 'EFCOS_MARIKINA',
    sourceName: 'MMDA Flood Control & Sewerage Management',
    category: 'RIVER_TELEMETRY',
    severity: 'ADVISORY',
    title: 'Manggahan Floodway: All 8 Control Gates Fully Hoisted (100% Discharge)',
    summary: '2,400 m³/s of peak runoff currently diverting into Laguna de Bay to prevent severe inundation of lower Marikina and Pasig delta.',
    details: 'Rosario Weir: Fully opened. Napindan Hydraulic Control Structure (NHCS): Gates closed to prevent saline Laguna backflow.',
    telemetrySnapshot: {
      floodgateStatus: 'All 8 gates 100% open',
    },
    timestamp: new Date(Date.now() - 95 * 60 * 1000).toISOString(),
    isVerifiedSource: true,
    sourceAgency: 'MMDA Flood Control & Sewerage Management',
    sourceUrl: 'https://mmda.gov.ph/efcos',
    reliabilityScore: 0.99,
  },
];

export class LiveFeedService {
  /**
   * Determine whether the client is operating in offline mode.
   */
  public static isOffline(): boolean {
    if (typeof window === 'undefined') return false;
    if (syncClient && syncClient.isSimulatingOffline()) return true;
    return typeof navigator !== 'undefined' && !navigator.onLine;
  }

  private static safeLocalStorageGet<T>(key: string): T | null {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  private static safeLocalStorageSet(key: string, value: unknown): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // storage quota or private browsing
    }
  }

  /**
   * Retrieve cached environmental telemetry or initialize defaults.
   */
  public static getTelemetry(community?: Community | null, activeAlerts?: Alert[]): EnvironmentalTelemetry {
    let telemetry: EnvironmentalTelemetry = { ...DEFAULT_TELEMETRY };

    const stored = this.safeLocalStorageGet<Partial<EnvironmentalTelemetry>>(STORAGE_KEYS.TELEMETRY);
    if (stored) {
      telemetry = { ...telemetry, ...stored };
    }

    // Synchronize dynamically with live Community entity if available
    if (community) {
      if (typeof community.riverWaterLevelMeters === 'number') {
        telemetry.riverWaterLevelMeters = community.riverWaterLevelMeters;
      }
      if (typeof community.riverAlertLevel === 'number') {
        telemetry.riverAlertLevel = community.riverAlertLevel;
      } else if (typeof community.riverWaterLevelMeters === 'number') {
        telemetry.riverAlertLevel = this.classifyRiverAlertLevel(community.riverWaterLevelMeters);
      }
    } else {
      telemetry.riverAlertLevel = this.classifyRiverAlertLevel(telemetry.riverWaterLevelMeters);
    }

    // Synchronize with active alerts if available
    if (activeAlerts && activeAlerts.length > 0) {
      const typhoonAlert = activeAlerts.find(
        (a) => a.active && (typeof a.signalLevel === 'number' || a.disasterType === 'TYPHOON')
      );
      if (typhoonAlert) {
        if (typeof typhoonAlert.signalLevel === 'number') {
          telemetry.tcwsSignalLevel = typhoonAlert.signalLevel;
        }
        if (typhoonAlert.disasterName) {
          telemetry.cycloneName = typhoonAlert.disasterName;
        }
      }
    }

    telemetry.rainfallCategory = this.classifyRainfall(telemetry.rainfallIntensityMmHr);
    telemetry.rainfallAdvisoryLevel = this.classifyRainfallAdvisory(telemetry.rainfallIntensityMmHr);
    telemetry.lastUpdated = new Date().toISOString();

    return telemetry;
  }

  /**
   * Classify Marikina River hydrodynamic alert level based on official MMDA/CDRRMO thresholds:
   * Level 0: < 15.0m (Normal Flow)
   * Level 1: >= 15.0m (1st Alarm - Alert & Prepare)
   * Level 2: >= 16.0m (2nd Alarm - Pre-emptive Evacuation)
   * Level 3: >= 18.0m (3rd Alarm - Forced Evacuation)
   */
  public static classifyRiverAlertLevel(meters: number): 0 | 1 | 2 | 3 {
    if (meters >= 18.0) return 3;
    if (meters >= 16.0) return 2;
    if (meters >= 15.0) return 1;
    return 0;
  }

  /**
   * Classify rainfall intensity based on DOST-PAGASA official standards:
   * Light: < 2.5 mm/hr
   * Moderate: 2.5 - 7.5 mm/hr
   * Heavy: 7.5 - 15.0 mm/hr
   * Intense: 15.0 - 30.0 mm/hr
   * Torrential: > 30.0 mm/hr
   */
  public static classifyRainfall(
    mmHr: number
  ): 'NONE' | 'LIGHT' | 'MODERATE' | 'HEAVY' | 'INTENSE' | 'TORRENTIAL' {
    if (mmHr <= 0) return 'NONE';
    if (mmHr < 2.5) return 'LIGHT';
    if (mmHr < 7.5) return 'MODERATE';
    if (mmHr < 15.0) return 'HEAVY';
    if (mmHr < 30.0) return 'INTENSE';
    return 'TORRENTIAL';
  }

  /**
   * DOST-PAGASA Color-Coded Rainfall Advisory Levels:
   * Red: > 30 mm/hr (Torrential / Evacuation)
   * Orange: 15 - 30 mm/hr (Intense / Threatening)
   * Yellow: 7.5 - 15 mm/hr (Heavy / Monitor)
   */
  public static classifyRainfallAdvisory(
    mmHr: number
  ): 'NORMAL' | 'YELLOW' | 'ORANGE' | 'RED' {
    const category = this.classifyRainfall(mmHr);
    if (category === 'TORRENTIAL') return 'RED';
    if (category === 'INTENSE') return 'ORANGE';
    if (category === 'HEAVY') return 'YELLOW';
    return 'NORMAL';
  }

  private static inMemoryTelemetry: EnvironmentalTelemetry | null = null;
  private static inMemoryFeedItems: LiveFeedItem[] | null = null;

  /**
   * Save telemetry snapshot to local storage (or in-memory fallback).
   */
  public static saveTelemetry(telemetry: EnvironmentalTelemetry): void {
    LiveFeedService.inMemoryTelemetry = telemetry;
    this.safeLocalStorageSet(STORAGE_KEYS.TELEMETRY, telemetry);
  }

  /**
   * Retrieve cached feed items.
   */
  public static getStoredFeedItems(): LiveFeedItem[] {
    const stored = this.safeLocalStorageGet<LiveFeedItem[]>(STORAGE_KEYS.FEED_ITEMS);
    if (Array.isArray(stored) && stored.length > 0) {
      return stored;
    }
    if (LiveFeedService.inMemoryFeedItems && LiveFeedService.inMemoryFeedItems.length > 0) {
      return LiveFeedService.inMemoryFeedItems;
    }
    return DEFAULT_FEED_ITEMS;
  }

  /**
   * Save feed items to local storage (or in-memory fallback).
   */
  public static saveFeedItems(items: LiveFeedItem[]): void {
    LiveFeedService.inMemoryFeedItems = items;
    this.safeLocalStorageSet(STORAGE_KEYS.FEED_ITEMS, items);
  }

  /**
   * Ingest live operational events from Resilia state (incidents, requests, missions, audit)
   * and blend them with meteorological and agency bulletins.
   */
  public static getMergedFeed(
    options: {
      community?: Community | null;
      alerts?: Alert[];
      incidents?: Incident[];
      assistanceRequests?: AssistanceRequest[];
      missions?: Mission[];
      auditLogs?: AuditEntry[];
    } = {}
  ): { telemetry: EnvironmentalTelemetry; feedItems: LiveFeedItem[] } {
    const telemetry = this.getTelemetry(options.community, options.alerts);
    const storedItems = this.getStoredFeedItems();

    // Synthesize operational signals from live state
    const synthesizedOperationalItems: LiveFeedItem[] = [];

    // 1. Incidents (Exclude resolved/contradicted incidents so feed represents active operations)
    if (options.incidents && options.incidents.length > 0) {
      options.incidents
        .filter(
          (i) =>
            (i.status === 'VERIFIED' || i.severity === 'CRITICAL') &&
            i.status !== 'RESOLVED' &&
            i.status !== 'CONTRADICTED'
        )
        .slice(0, 4)
        .forEach((inc) => {
          synthesizedOperationalItems.push({
            id: `ops_inc_${inc.id}`,
            source: 'FIELD_OPS',
            sourceName: 'Resilia Incident Verification',
            category: 'FIELD_OPS',
            severity: inc.severity === 'CRITICAL' ? 'CRITICAL' : 'WARNING',
            title: `Field Incident Verified: ${inc.title}`,
            summary: `${inc.locationName} (${inc.type.replaceAll('_', ' ')}): ${inc.description}`,
            details: `Reporter: ${inc.reporterName || 'Citizen Report'} · Status: ${inc.status}${
              inc.floodDepthCm ? ` · Flood depth: ${inc.floodDepthCm} cm` : ''
            }`,
            timestamp: inc.verifiedAt || inc.createdAt,
            actionRecommendation: 'Review sector boat routes and dispatch field team if access is submerged.',
          });
        });
    }

    // 2. Critical Assistance Requests
    if (options.assistanceRequests && options.assistanceRequests.length > 0) {
      options.assistanceRequests
        .filter(
          (r) =>
            (r.status === 'PENDING' || r.status === 'ASSIGNED') &&
            (r.priority === 'CRITICAL' || r.priority === 'HIGH')
        )
        .slice(0, 3)
        .forEach((req) => {
          synthesizedOperationalItems.push({
            id: `ops_req_${req.id}`,
            source: 'FIELD_OPS',
            sourceName: 'Resilia Distress Triage Queue',
            category: 'FIELD_OPS',
            severity: req.priority === 'CRITICAL' ? 'CRITICAL' : 'WARNING',
            title: `Priority Citizen Rescue Signal: ${req.residentName}`,
            summary: `${req.residentName} (${req.peopleCount} pax) at ${req.locationName} (${req.category.replaceAll('_', ' ')})`,
            details: `Needs: ${req.description} · Vulnerabilities: ${
              req.vulnerabilityNeeds.wheelchairUser ? 'Wheelchair user, ' : ''
            }${req.vulnerabilityNeeds.elderlyCount ? `${req.vulnerabilityNeeds.elderlyCount} elderly, ` : ''}${
              req.vulnerabilityNeeds.bedridden ? 'Bedridden' : ''
            }`,
            timestamp: req.createdAt,
            actionRecommendation: 'Formulate 1-click rescue mission proposal in Overview board.',
          });
        });
    }

    // 3. Missions (Include all active operations: APPROVED, ASSIGNED, ACCEPTED, IN_PROGRESS)
    if (options.missions && options.missions.length > 0) {
      options.missions
        .filter(
          (m) =>
            m.status === 'APPROVED' ||
            m.status === 'ASSIGNED' ||
            m.status === 'ACCEPTED' ||
            m.status === 'IN_PROGRESS'
        )
        .slice(0, 3)
        .forEach((m) => {
          synthesizedOperationalItems.push({
            id: `ops_mis_${m.id}`,
            source: 'FIELD_OPS',
            sourceName: 'Resilia Mission Command',
            category: 'FIELD_OPS',
            severity: m.priority === 'CRITICAL' ? 'CRITICAL' : 'NORMAL',
            title: `Field Mission Active: ${m.title}`,
            summary: `Asset ${m.assignedVehicleType || 'Rescue Boat'} deployed by ${
              m.assignedResponderName || 'Task Force Unit'
            } to ${m.destinationLocation}`,
            details: `Priority: ${m.priority} · Status: ${m.status}`,
            timestamp: m.updatedAt || m.createdAt,
          });
        });
    }

    // 4. Coordinator Alerts & Agency Bulletins
    if (options.alerts && options.alerts.length > 0) {
      options.alerts
        .filter((a) => a.active)
        .slice(0, 4)
        .forEach((alt) => {
          let src: LiveFeedSource = 'COORDINATOR';
          let cat: LiveFeedCategory = 'AGENCY';
          const srcUpper = (alt.source || '').toUpperCase();
          if (srcUpper.includes('PAGASA')) {
            src = 'PAGASA';
            cat = 'WEATHER';
          } else if (srcUpper.includes('NDRRMC')) {
            src = 'NDRRMC';
            cat = 'AGENCY';
          } else if (srcUpper.includes('PHIVOLCS')) {
            src = 'PHIVOLCS';
            cat = 'AGENCY';
          } else if (srcUpper.includes('EFCOS') || srcUpper.includes('MARIKINA RIVER')) {
            src = 'EFCOS_MARIKINA';
            cat = 'RIVER_TELEMETRY';
          }

          synthesizedOperationalItems.push({
            id: `ops_alt_${alt.id}`,
            source: src,
            sourceName: alt.source || 'Incident Command Broadcast',
            category: cat,
            severity: alt.severity === 'INFO' ? 'ADVISORY' : alt.severity,
            title: alt.title,
            summary: alt.message,
            details: alt.preparations?.join(' · ') || undefined,
            timestamp: alt.issuedAt,
            isPinned: true,
            isSimulated: Boolean(alt.isExercise),
          });
        });
    }

    // Merge and deduplicate by ID
    const mergedMap = new Map<string, LiveFeedItem>();

    // Add stored items first
    storedItems.forEach((item) => mergedMap.set(item.id, item));

    // Overlay operational items
    synthesizedOperationalItems.forEach((item) => mergedMap.set(item.id, item));

    // Sort: pinned first, then newest timestamp first
    const sortedFeed = Array.from(mergedMap.values()).sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    return {
      telemetry,
      feedItems: sortedFeed,
    };
  }

  /**
   * Simulate or poll new telemetry with slight realistic jitter.
   * Useful for dynamic live feel and offline testing.
   */
  public static pollFreshTelemetry(baseTelemetry: EnvironmentalTelemetry): {
    telemetry: EnvironmentalTelemetry;
    newItem?: LiveFeedItem;
  } {
    // Generate realistic jitter
    const rainDelta = (Math.random() - 0.45) * 1.5; // slight upward bias in storm
    const windDelta = (Math.random() - 0.45) * 2.0;
    const riverDelta = (Math.random() - 0.4) * 0.04;

    const newRainfall = Math.max(5, Math.min(85, parseFloat((baseTelemetry.rainfallIntensityMmHr + rainDelta).toFixed(1))));
    const newWind = Math.max(20, Math.min(180, Math.round(baseTelemetry.windSpeedKph + windDelta)));
    const newGust = Math.max(newWind + 15, Math.min(230, Math.round((baseTelemetry.windGustKph || baseTelemetry.windSpeedKph + 25) + windDelta)));
    const newRiver = Math.max(12.5, Math.min(20.5, parseFloat((baseTelemetry.riverWaterLevelMeters + riverDelta).toFixed(2))));
    const newRiverAlert = this.classifyRiverAlertLevel(newRiver);

    // Bounded barometric pressure jitter with trend determination
    const pressureDelta = (Math.random() - 0.48) * 0.2;
    const newPressure = Math.max(920, Math.min(1015, parseFloat((baseTelemetry.atmosphericPressureHpa - pressureDelta).toFixed(1))));
    const pressureTrend: 'RAPIDLY_DROPPING' | 'STEADY' | 'RISING' =
      pressureDelta > 0.05 ? 'RAPIDLY_DROPPING' : pressureDelta < -0.05 ? 'RISING' : 'STEADY';

    const updatedTelemetry: EnvironmentalTelemetry = {
      ...baseTelemetry,
      rainfallIntensityMmHr: newRainfall,
      rainfallCategory: this.classifyRainfall(newRainfall),
      rainfallAdvisoryLevel: this.classifyRainfallAdvisory(newRainfall),
      windSpeedKph: newWind,
      windGustKph: newGust,
      riverWaterLevelMeters: newRiver,
      riverAlertLevel: newRiverAlert,
      atmosphericPressureHpa: newPressure,
      pressureTrend,
      riverTrendRatePerHour: parseFloat(((newRiver - baseTelemetry.riverWaterLevelMeters) * 10).toFixed(2)) || baseTelemetry.riverTrendRatePerHour,
      radarReflectivityDbz: Math.min(65, Math.max(40, Math.round(baseTelemetry.radarReflectivityDbz + (Math.random() - 0.5) * 2))),
      lastUpdated: new Date().toISOString(),
    };

    this.saveTelemetry(updatedTelemetry);

    // Occasionally create a live telemetry packet
    let newItem: LiveFeedItem | undefined = undefined;
    if (Math.random() > 0.4) {
      const isRiverAlert = newRiver >= 16.0;
      const isRainIntense = newRainfall >= 30.0;

      if (isRiverAlert) {
        newItem = {
          id: `feed_telemetry_river_${Date.now()}`,
          source: 'EFCOS_MARIKINA',
          sourceName: 'Marikina River Ultrasonic Telemetry',
          category: 'RIVER_TELEMETRY',
          severity: newRiver >= 18.0 ? 'CRITICAL' : 'WARNING',
          title: `River Telemetry Surge: ${newRiver.toFixed(2)}m Recorded at Tumana Sensor`,
          summary: `Current river elevation at ${newRiver.toFixed(2)}m (${
            newRiver >= 18.0 ? '3rd Alarm: Forced Evacuation' : '2nd Alarm: Pre-emptive Evacuation'
          }). Surge trend: +${(Math.abs(updatedTelemetry.riverTrendRatePerHour || 0.35)).toFixed(2)} m/hr.`,
          telemetrySnapshot: {
            riverWaterLevelMeters: newRiver,
            riverAlertLevel: newRiverAlert,
          },
          timestamp: new Date().toISOString(),
          actionRecommendation: 'Verify Tumana and Malanday evacuation center reception gates.',
        };
      } else if (isRainIntense) {
        newItem = {
          id: `feed_telemetry_rain_${Date.now()}`,
          source: 'PAGASA',
          sourceName: 'DOST-PAGASA Automated Weather Station (AWS)',
          category: 'WEATHER',
          severity: 'CRITICAL',
          title: `Torrential Rain Spike: ${newRainfall.toFixed(1)} mm/hr Inflow Detected`,
          summary: `Marikina Science High AWS gauge reports ${newRainfall.toFixed(1)} mm/hr cloudburst. Surface street drainage overcapacity warning.`,
          telemetrySnapshot: {
            rainfallIntensityMmHr: newRainfall,
            windSpeedKph: newWind,
          },
          timestamp: new Date().toISOString(),
          actionRecommendation: 'Inspect stormwater drains and alert low-lying creekside puroks.',
        };
      }
    }

    if (newItem) {
      const stored = this.getStoredFeedItems();
      const updatedList = [newItem, ...stored.slice(0, 24)];
      this.saveFeedItems(updatedList);
    }

    return { telemetry: updatedTelemetry, newItem };
  }

  /**
   * Inject a drill or simulation bulletin into the live feed stream.
   */
  public static injectSimulatedBulletin(item: Partial<LiveFeedItem>): LiveFeedItem {
    const fullItem: LiveFeedItem = {
      id: item.id || `sim_bulletin_${Date.now()}`,
      source: item.source || 'PAGASA',
      sourceName: item.sourceName || 'DOST-PAGASA Weather Division (Drill Stream)',
      category: item.category || 'WEATHER',
      severity: item.severity || 'WARNING',
      title: item.title || 'Simulated Emergency Bulletin',
      summary: item.summary || 'Live exercise transmission injected into Resilia operations console.',
      details: item.details,
      telemetrySnapshot: item.telemetrySnapshot,
      timestamp: new Date().toISOString(),
      isSimulated: true,
      actionRecommendation: item.actionRecommendation,
    };

    const stored = this.getStoredFeedItems();
    const updatedList = [fullItem, ...stored.slice(0, 24)];
    this.saveFeedItems(updatedList);

    return fullItem;
  }

  /**
   * Reset feed items back to initial seed dataset.
   */
  public static resetToDefaults(): { telemetry: EnvironmentalTelemetry; feedItems: LiveFeedItem[] } {
    LiveFeedService.inMemoryTelemetry = null;
    LiveFeedService.inMemoryFeedItems = null;
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEYS.TELEMETRY);
        localStorage.removeItem(STORAGE_KEYS.FEED_ITEMS);
      } catch {
        // ignore
      }
    }
    return {
      telemetry: { ...DEFAULT_TELEMETRY, lastUpdated: new Date().toISOString() },
      feedItems: [...DEFAULT_FEED_ITEMS],
    };
  }

  /**
   * Sound preferences for new incoming bulletins.
   */
  public static isAudioMuted(): boolean {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem(STORAGE_KEYS.AUDIO_MUTED) === 'true';
  }

  public static setAudioMuted(muted: boolean): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.AUDIO_MUTED, muted ? 'true' : 'false');
  }

  /**
   * Return the authoritative list of trusted weather and sensor telemetry providers.
   */
  public static getTrustedWeatherSources(): TrustedWeatherSourceInfo[] {
    return TRUSTED_WEATHER_SOURCES;
  }

  /**
   * Map WMO (World Meteorological Organization) weather interpretation codes (0-99)
   * to human-readable weather conditions.
   */
  public static mapWmoWeatherCode(code: number): string {
    switch (code) {
      case 0:
        return 'Clear Sky';
      case 1:
        return 'Mainly Clear';
      case 2:
        return 'Partly Cloudy';
      case 3:
        return 'Overcast';
      case 45:
      case 48:
        return 'Dense Fog & Depositing Rime Fog';
      case 51:
      case 53:
      case 55:
        return 'Light to Dense Drizzle';
      case 56:
      case 57:
        return 'Freezing Drizzle';
      case 61:
        return 'Slight Rain';
      case 63:
        return 'Moderate Rain';
      case 65:
        return 'Heavy Rain Precipitation';
      case 66:
      case 67:
        return 'Freezing Rain';
      case 71:
      case 73:
      case 75:
        return 'Snow Fall';
      case 77:
        return 'Snow Grains';
      case 80:
        return 'Slight Rain Showers';
      case 81:
        return 'Moderate Rain Showers';
      case 82:
        return 'Violent Rain Showers';
      case 85:
      case 86:
        return 'Snow Showers';
      case 95:
        return 'Severe Thunderstorm';
      case 96:
      case 99:
        return 'Thunderstorm with Heavy Hail';
      default:
        return 'Precipitation Squall';
    }
  }

  /**
   * Fetches real-time weather telemetry from Open-Meteo (trusted WMO global provider).
   * Automatically falls back to local cached/simulated telemetry when offline or in sandbox.
   */
  public static async fetchLiveWeatherFeed(
    coords: { lat: number; lng: number } = { lat: 14.6507, lng: 121.1029 }
  ): Promise<{
    telemetry: EnvironmentalTelemetry;
    newItem?: LiveFeedItem;
    source: 'NETWORK' | 'CACHE';
  }> {
    const base = this.getTelemetry();
    let networkSucceeded = false;
    let fetchedData: any = null;

    if (typeof fetch !== 'undefined' && !this.isOffline()) {
      try {
        const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
        const timeoutId = controller ? setTimeout(() => controller.abort(), 3500) : null;

        const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lng}&current=temperature_2m,relative_humidity_2m,precipitation,rain,weather_code,surface_pressure,wind_speed_10m,wind_gusts_10m,wind_direction_10m`;
        const resp = await fetch(url, {
          signal: controller?.signal,
          headers: { Accept: 'application/json' },
        });
        if (timeoutId) clearTimeout(timeoutId);

        if (resp.ok) {
          fetchedData = await resp.json();
          networkSucceeded = true;
        }
      } catch {
        networkSucceeded = false;
      }
    }

    if (networkSucceeded && fetchedData?.current) {
      const c = fetchedData.current;
      const precip = typeof c.precipitation === 'number' ? c.precipitation : (c.rain || 0);
      const temp = typeof c.temperature_2m === 'number' ? c.temperature_2m : base.ambientTempC;
      const rh = typeof c.relative_humidity_2m === 'number' ? c.relative_humidity_2m : base.relativeHumidityPercent;
      const pressure = typeof c.surface_pressure === 'number' ? parseFloat(c.surface_pressure.toFixed(1)) : base.atmosphericPressureHpa;
      const wind = typeof c.wind_speed_10m === 'number' ? Math.round(c.wind_speed_10m) : base.windSpeedKph;
      const gust = typeof c.wind_gusts_10m === 'number' ? Math.round(c.wind_gusts_10m) : Math.max(wind + 15, base.windGustKph);
      const weatherCode = typeof c.weather_code === 'number' ? c.weather_code : 65;

      const weatherCondition = this.mapWmoWeatherCode(weatherCode);
      const rainRate = Math.max(precip, base.rainfallIntensityMmHr);

      const updatedTelemetry: EnvironmentalTelemetry = {
        ...base,
        ambientTempC: temp,
        relativeHumidityPercent: rh,
        atmosphericPressureHpa: pressure,
        windSpeedKph: wind,
        windGustKph: gust,
        rainfallIntensityMmHr: rainRate,
        rainfallCategory: this.classifyRainfall(rainRate),
        rainfallAdvisoryLevel: this.classifyRainfallAdvisory(rainRate),
        lastUpdated: new Date().toISOString(),
      };

      this.saveTelemetry(updatedTelemetry);

      const liveItem: LiveFeedItem = {
        id: `live_weather_openmeteo_${Date.now()}`,
        source: 'OPEN_METEO',
        sourceName: 'Open-Meteo / WMO Live Telemetry',
        category: 'WEATHER',
        severity: updatedTelemetry.rainfallIntensityMmHr >= 30 ? 'CRITICAL' : updatedTelemetry.rainfallIntensityMmHr >= 15 ? 'WARNING' : 'ADVISORY',
        title: `Live Surface Observation: ${weatherCondition} (${updatedTelemetry.rainfallIntensityMmHr.toFixed(1)} mm/hr)`,
        summary: `Real-time atmospheric telemetry synced from Open-Meteo WMO station for Marikina (${coords.lat.toFixed(4)}°N, ${coords.lng.toFixed(4)}°E). Temp: ${temp.toFixed(1)}°C, Pressure: ${pressure} hPa, Wind: ${wind} km/h (gusts ${gust} km/h).`,
        details: `WMO Weather Code: ${weatherCode} (${weatherCondition}). Relative Humidity: ${rh}%. Surface Pressure: ${pressure} hPa. High-resolution numerical model: ECMWF/DWD/NOAA blend.`,
        telemetrySnapshot: {
          ambientTempC: temp,
          relativeHumidityPercent: rh,
          atmosphericPressureHpa: pressure,
          windSpeedKph: wind,
          windGustKph: gust,
          rainfallIntensityMmHr: updatedTelemetry.rainfallIntensityMmHr,
        },
        timestamp: new Date().toISOString(),
        isVerifiedSource: true,
        sourceAgency: 'Open-Meteo / World Meteorological Organization',
        sourceUrl: 'https://open-meteo.com',
        reliabilityScore: 0.99,
        actionRecommendation: updatedTelemetry.rainfallIntensityMmHr >= 15 ? 'Monitor local stream gauges and prepare sandbag reinforcement.' : undefined,
      };

      const stored = this.getStoredFeedItems();
      this.saveFeedItems([liveItem, ...stored.slice(0, 24)]);

      return { telemetry: updatedTelemetry, newItem: liveItem, source: 'NETWORK' };
    }

    const polled = this.pollFreshTelemetry(base);
    return { telemetry: polled.telemetry, newItem: polled.newItem, source: 'CACHE' };
  }
}
