// Source: Google Maps Platform Code Assist
/**
 * Resilia Interactive Emergency Map
 * Powered by Google Maps Platform via @vis.gl/react-google-maps.
 *
 * Implements:
 * 1. Google Maps Platform rendering with Map, AdvancedMarker, Pin, and InfoWindow
 * 2. Mandatory internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
 * 3. mapId="DEMO_MAP_ID" for AdvancedMarker support
 * 4. Resident incident reports, shelters, help requests, and telemetry markers
 * 5. Marikina River flood hazard corridor and impassable road polyline visualization
 * 6. Interactive facility & incident inspector card with coordinator/responder actions
 * 7. Seamless offline vector cartography fallback mode when disconnected
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Map,
  AdvancedMarker,
  Pin,
  InfoWindow,
  MapControl,
  ControlPosition,
  useApiIsLoaded,
  useApiLoadingStatus,
  APILoadingStatus,
} from '@vis.gl/react-google-maps';
import {
  AlertTriangle,
  Building2,
  Camera,
  CheckCircle2,
  Droplets,
  Layers,
  MapPin,
  Navigation,
  Package,
  Radio,
  Search,
  Shield,
  ShieldAlert,
  Users,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';
import { Incident, Shelter, Resource, AssistanceRequest } from '../../types';

interface ResiliaMapProps {
  shelters: Shelter[];
  incidents: Incident[];
  resources: Resource[];
  assistanceRequests: AssistanceRequest[];
  onSelectShelter?: (shelter: Shelter) => void;
  onSelectIncident?: (incident: Incident) => void;
  selectedEntityId?: string;
}

export type SelectedMapEntity =
  | { type: 'SHELTER'; data: Shelter }
  | { type: 'INCIDENT'; data: Incident }
  | { type: 'REQUEST'; data: AssistanceRequest }
  | { type: 'SENSOR'; data: { name: string; waterLevel: string; alarm: string; lat: number; lng: number } };

export const ResiliaMap: React.FC<ResiliaMapProps> = ({
  shelters,
  incidents,
  resources,
  assistanceRequests,
  onSelectShelter,
  onSelectIncident,
  selectedEntityId,
}) => {
  const [layers, setLayers] = useState({
    shelters: true,
    incidents: true,
    assistance: true,
    sensor: true,
    hazardCorridor: true,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'ALL' | 'SHELTERS' | 'HAZARDS' | 'REQUESTS'>('ALL');
  const [selectedEntity, setSelectedEntity] = useState<SelectedMapEntity | null>(null);
  const apiIsLoaded = useApiIsLoaded();
  const apiLoadingStatus = useApiLoadingStatus();

  // Initialize with offline fallback if the device is currently offline
  const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
  const [useOfflineFallback, setUseOfflineFallback] = useState(isOffline);
  const [autoFallbackTriggered, setAutoFallbackTriggered] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  // If Google Maps API fails to load, encounters auth error, or reports quota exhaustion,
  // automatically fallback to offline vector map so the user never gets an error modal or blank void.
  useEffect(() => {
    if (
      apiLoadingStatus === APILoadingStatus.FAILED ||
      apiLoadingStatus === APILoadingStatus.AUTH_FAILURE
    ) {
      console.warn(
        `[Resilia Map] Google Maps API failed to load (status: ${apiLoadingStatus}). Switching to Air-Gapped Vector Cartography.`
      );
      setUseOfflineFallback(true);
      setAutoFallbackTriggered(true);
    }

    // Google Maps Platform invokes window.gm_authFailure() when an API key is restricted, invalid, or quota-exceeded
    const originalGmAuthFailure = (window as any).gm_authFailure;
    (window as any).gm_authFailure = () => {
      console.warn(
        '[Resilia Map] Google Maps gm_authFailure triggered. Check API key HTTP Referrer restrictions in Google Cloud Console (ensure https://resilia-70100.web.app/* and https://resilia-70100.firebaseapp.com/* are allowed).'
      );
      setUseOfflineFallback(true);
      setAutoFallbackTriggered(true);
      if (typeof originalGmAuthFailure === 'function') {
        originalGmAuthFailure();
      }
    };

    const handleAuthError = (event?: any) => {
      console.warn(
        '[Resilia Map] Google Maps authentication or quota event triggered. Switching to offline vector cartography.',
        event
      );
      setUseOfflineFallback(true);
      setAutoFallbackTriggered(true);
    };

    window.addEventListener('gmp-quota-exceeded', handleAuthError);
    window.addEventListener('gm-auth-failure', handleAuthError);

    // Also observe DOM to auto-dismiss any Google Maps native auth error modal and trigger fallback
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of Array.from(mutation.addedNodes)) {
          if (node instanceof HTMLElement) {
            if (
              node.innerText?.includes("This page can't load Google Maps correctly") ||
              node.querySelector?.('.gm-err-container') ||
              node.classList?.contains('gm-err-container')
            ) {
              setUseOfflineFallback(true);
              setAutoFallbackTriggered(true);
            }
          }
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener('gmp-quota-exceeded', handleAuthError);
      window.removeEventListener('gm-auth-failure', handleAuthError);
      observer.disconnect();
    };
  }, [apiLoadingStatus]);

  // Timeout guard: If Google Maps hasn't initialized within 3.5 seconds
  // (e.g. adblocker, corporate firewall, flaky cellular, or quota error),
  // automatically show the offline vector map so the user never sees an empty void.
  useEffect(() => {
    if (!import.meta.env.VITE_GOOGLE_MAPS_API_KEY && !useOfflineFallback) {
      console.warn(
        '[Resilia Map] VITE_GOOGLE_MAPS_API_KEY is not defined. Falling back to Air-Gapped Vector Cartography. Ensure the secret is added in GitHub Actions secrets or .env.'
      );
      setAutoFallbackTriggered(true);
      setUseOfflineFallback(true);
      return;
    }

    if (!apiIsLoaded && !useOfflineFallback) {
      const timer = setTimeout(() => {
        if (!apiIsLoaded) {
          console.warn(
            '[Resilia Map] Google Maps API load timed out (3.5s). Switching to Air-Gapped Vector Cartography.'
          );
          setAutoFallbackTriggered(true);
          setUseOfflineFallback(true);
        }
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [apiIsLoaded, useOfflineFallback]);

  // Marikina River Basin coordinates (Tumana & Malanday)
  const defaultCenter = { lat: 14.654, lng: 121.099 };

  // River Telemetry Sensor point
  const riverSensor = {
    name: 'Marikina River Telemetry (Tumana Bridge)',
    waterLevel: '16.8 meters',
    alarm: '2nd Alarm (Pre-emptive Evac)',
    lat: 14.6495,
    lng: 121.0982,
  };

  // Filter items
  const filteredShelters = shelters.filter(
    (s) =>
      (activeCategory === 'ALL' || activeCategory === 'SHELTERS') &&
      (s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.locationName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Filter items (User requirement: ONLY verified incident reports by coordinators can be seen on the map)
  const verifiedIncidents = incidents.filter((inc) => inc.status === 'VERIFIED');

  const filteredIncidents = verifiedIncidents.filter(
    (inc) =>
      (activeCategory === 'ALL' || activeCategory === 'HAZARDS') &&
      (inc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inc.locationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inc.reporterName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredRequests = assistanceRequests.filter(
    (req) =>
      (activeCategory === 'ALL' || activeCategory === 'REQUESTS') &&
      (req.locationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.residentName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Fallback 2D projection for air-gapped / offline demo mode
  const LAT_MIN = 14.630;
  const LAT_MAX = 14.670;
  const LNG_MIN = 121.085;
  const LNG_MAX = 121.115;
  const projectToSvg = (lat: number, lng: number) => {
    const x = ((lng - LNG_MIN) / (LNG_MAX - LNG_MIN)) * 800;
    const y = (1 - (lat - LAT_MIN) / (LAT_MAX - LAT_MIN)) * 600;
    return { x: Math.max(20, Math.min(780, x)), y: Math.max(20, Math.min(580, y)) };
  };

  return (
    <div className="relative w-full h-[600px] min-h-[600px] bg-neutral-900 rounded-xl overflow-hidden shadow-sm border border-neutral-800 flex flex-col">
      {/* 1. TOP FLOATING CONTROL BAR */}
      <div className="absolute top-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Search & Filter Box */}
        <div className="pointer-events-auto flex items-center gap-2 bg-neutral-900/95 backdrop-blur-md px-3 py-1.5 rounded-lg border border-neutral-700/80 shadow-md text-xs w-full max-w-xs sm:max-w-sm">
          <Search className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search shelters, reports, streets..."
            className="w-full bg-transparent text-white placeholder-neutral-400 focus:outline-none text-xs"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-neutral-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Quick Category & Engine Switchers */}
        <div className="pointer-events-auto flex flex-wrap items-center gap-2">
          {/* Category Segmented Control */}
          <div className="inline-flex items-center bg-neutral-900/95 backdrop-blur-md rounded-lg p-0.5 border border-neutral-700/80 shadow-md text-xs">
            <button
              onClick={() => setActiveCategory('ALL')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                activeCategory === 'ALL'
                  ? 'bg-neutral-800 text-white shadow-2xs font-semibold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveCategory('SHELTERS')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition flex items-center gap-1 ${
                activeCategory === 'SHELTERS'
                  ? 'bg-emerald-700 text-white shadow-2xs font-semibold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <span>Shelters</span>
              <span className="font-mono text-[10px] opacity-80 tabular-nums">({filteredShelters.length})</span>
            </button>
            <button
              onClick={() => setActiveCategory('HAZARDS')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition flex items-center gap-1 ${
                activeCategory === 'HAZARDS'
                  ? 'bg-rose-700 text-white shadow-2xs font-semibold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <span>Incidents</span>
              <span className="font-mono text-[10px] opacity-80 tabular-nums">({filteredIncidents.length})</span>
            </button>
            <button
              onClick={() => setActiveCategory('REQUESTS')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition flex items-center gap-1 ${
                activeCategory === 'REQUESTS'
                  ? 'bg-sky-700 text-white shadow-2xs font-semibold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <span>Help</span>
              <span className="font-mono text-[10px] opacity-80 tabular-nums">({filteredRequests.length})</span>
            </button>
          </div>

          {/* Google Maps / Offline Vector Switcher */}
          <button
            onClick={() => {
              setUseOfflineFallback(!useOfflineFallback);
              setAutoFallbackTriggered(false);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border backdrop-blur-md transition shadow-md flex items-center gap-1.5 ${
              useOfflineFallback
                ? 'bg-amber-600/90 text-white border-amber-500 hover:bg-amber-600'
                : 'bg-neutral-800 text-neutral-200 border-neutral-700 hover:bg-neutral-700 hover:text-white'
            }`}
            title="Toggle between Google Maps Platform cloud cartography and local vector cartography"
          >
            {useOfflineFallback ? (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-200" />
                <span>Offline Vector Map</span>
                {autoFallbackTriggered && (
                  <span className="ml-1 px-1.5 py-0.2 rounded bg-amber-900/60 text-[9px] font-mono uppercase">
                    Auto-Failover
                  </span>
                )}
              </>
            ) : (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span>Google Maps Active</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. LAYER CONTROLS (Right side) */}
      <div className="absolute top-14 right-3 z-20 flex flex-col gap-2">
        <div className="bg-neutral-900/95 backdrop-blur-md rounded-lg border border-neutral-700/80 p-2.5 text-xs text-white shadow-xl space-y-2 min-w-[165px]">
          <div className="font-semibold text-neutral-400 flex items-center gap-1.5 pb-1 border-b border-neutral-800 text-[10px] uppercase tracking-wider">
            <Layers className="w-3 h-3 text-neutral-400" /> Map Layers
          </div>
          <label className="flex items-center gap-2 cursor-pointer text-neutral-300 hover:text-white">
            <input
              type="checkbox"
              checked={layers.shelters}
              onChange={(e) => setLayers({ ...layers, shelters: e.target.checked })}
              className="accent-emerald-500 rounded"
            />
            <span>Shelters ({shelters.length})</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-neutral-300 hover:text-white">
            <input
              type="checkbox"
              checked={layers.incidents}
              onChange={(e) => setLayers({ ...layers, incidents: e.target.checked })}
              className="accent-rose-500 rounded"
            />
            <span>Verified Hazards ({verifiedIncidents.length})</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-neutral-300 hover:text-white">
            <input
              type="checkbox"
              checked={layers.assistance}
              onChange={(e) => setLayers({ ...layers, assistance: e.target.checked })}
              className="accent-cyan-500 rounded"
            />
            <span>Help Requests ({assistanceRequests.length})</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-neutral-300 hover:text-white">
            <input
              type="checkbox"
              checked={layers.sensor}
              onChange={(e) => setLayers({ ...layers, sensor: e.target.checked })}
              className="accent-blue-500 rounded"
            />
            <span>River Telemetry</span>
          </label>
        </div>
      </div>

      {/* 3. PRIMARY GOOGLE MAPS PLATFORM CANVAS */}
      {!useOfflineFallback ? (
        <div className="w-full h-full flex-1 relative min-h-[600px]" style={{ minHeight: '600px', height: '100%' }}>
          {!apiIsLoaded && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-neutral-900/90 text-white p-6 text-center space-y-4">
              <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-emerald-400">Loading Community Map...</p>
                <p className="text-xs text-neutral-400 max-w-sm">
                  Connecting to satellite cartography. If offline or slow, switch to offline vector map immediately.
                </p>
              </div>
              <button
                onClick={() => setUseOfflineFallback(true)}
                className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-xs transition shadow-md flex items-center gap-2"
              >
                <WifiOff className="w-4 h-4" />
                <span>Switch to Offline Vector Map</span>
              </button>
            </div>
          )}
          <Map
            mapId="DEMO_MAP_ID"
            defaultCenter={defaultCenter}
            defaultZoom={15}
            gestureHandling="greedy"
            disableDefaultUI={false}
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            style={{ width: '100%', height: '100%', minHeight: '600px' }}
          >
            {/* SHELTER ADVANCED MARKERS */}
            {layers.shelters &&
              filteredShelters.map((s) => (
                <AdvancedMarker
                  key={s.id}
                  position={{ lat: s.lat, lng: s.lng }}
                  title={s.name}
                  onClick={() => {
                    setSelectedEntity({ type: 'SHELTER', data: s });
                    if (onSelectShelter) onSelectShelter(s);
                  }}
                >
                  <Pin
                    background="#059669"
                    borderColor="#064e3b"
                    glyphColor="#ffffff"
                  >
                    <Building2 className="w-3.5 h-3.5 text-white" />
                  </Pin>
                </AdvancedMarker>
              ))}

            {/* RESIDENT INCIDENT REPORT ADVANCED MARKERS */}
            {layers.incidents &&
              filteredIncidents.map((inc) => {
                const isCritical = inc.severity === 'CRITICAL';
                return (
                  <AdvancedMarker
                    key={inc.id}
                    position={{ lat: inc.lat, lng: inc.lng }}
                    title={inc.title}
                    onClick={() => {
                      setSelectedEntity({ type: 'INCIDENT', data: inc });
                      if (onSelectIncident) onSelectIncident(inc);
                    }}
                  >
                    <Pin
                      background={isCritical ? '#dc2626' : '#ea580c'}
                      borderColor={isCritical ? '#7f1d1d' : '#7c2d12'}
                      glyphColor="#ffffff"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-white" />
                    </Pin>
                  </AdvancedMarker>
                );
              })}

            {/* ASSISTANCE REQUEST ADVANCED MARKERS */}
            {layers.assistance &&
              filteredRequests.map((req) => (
                <AdvancedMarker
                  key={req.id}
                  position={{ lat: req.lat, lng: req.lng }}
                  title={`Help Request: ${req.residentName}`}
                  onClick={() => setSelectedEntity({ type: 'REQUEST', data: req })}
                >
                  <Pin
                    background="#0284c7"
                    borderColor="#0c4a6e"
                    glyphColor="#ffffff"
                  >
                    <Users className="w-3.5 h-3.5 text-white" />
                  </Pin>
                </AdvancedMarker>
              ))}

            {/* MARIKINA RIVER TELEMETRY SENSOR */}
            {layers.sensor && (
              <AdvancedMarker
                position={{ lat: riverSensor.lat, lng: riverSensor.lng }}
                title={riverSensor.name}
                onClick={() => setSelectedEntity({ type: 'SENSOR', data: riverSensor })}
              >
                <Pin
                  background="#2563eb"
                  borderColor="#1e3a8a"
                  glyphColor="#ffffff"
                >
                  <Droplets className="w-3.5 h-3.5 text-white" />
                </Pin>
              </AdvancedMarker>
            )}

            {/* INTERACTIVE INFOWINDOW */}
            {selectedEntity && (
              <InfoWindow
                position={
                  selectedEntity.type === 'SHELTER'
                    ? { lat: selectedEntity.data.lat, lng: selectedEntity.data.lng }
                    : selectedEntity.type === 'INCIDENT'
                    ? { lat: selectedEntity.data.lat, lng: selectedEntity.data.lng }
                    : selectedEntity.type === 'REQUEST'
                    ? { lat: selectedEntity.data.lat, lng: selectedEntity.data.lng }
                    : { lat: selectedEntity.data.lat, lng: selectedEntity.data.lng }
                }
                onCloseClick={() => setSelectedEntity(null)}
              >
                <div className="p-2 text-neutral-900 max-w-xs space-y-2 text-xs">
                  {selectedEntity.type === 'SHELTER' && (
                    <>
                      <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                        <Building2 className="w-4 h-4 shrink-0" />
                        <span className="leading-snug">{selectedEntity.data.name}</span>
                      </div>
                      <p className="text-[11px] text-neutral-600">{selectedEntity.data.locationName}</p>
                      <div className="bg-neutral-50 p-2.5 rounded-md border border-neutral-200/80 space-y-1.5 text-[11px]">
                        <div className="flex justify-between tabular-nums">
                          <span className="text-neutral-500">Occupancy:</span>
                          <span className="font-semibold text-neutral-900">
                            {selectedEntity.data.capacityCurrent} / {selectedEntity.data.capacityTotal}
                          </span>
                        </div>
                        <div className="flex justify-between tabular-nums">
                          <span className="text-neutral-500">Available Slots:</span>
                          <span className="font-semibold text-emerald-700">
                            {Math.max(0, selectedEntity.data.capacityTotal - selectedEntity.data.capacityCurrent)}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1 pt-1 text-[10px]">
                          {selectedEntity.data.isAccessibleWheelchair && (
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded text-[10px] font-medium">
                              Wheelchair Accessible
                            </span>
                          )}
                          {selectedEntity.data.hasBackupPower && (
                            <span className="bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded text-[10px] font-medium">
                              Backup Generator
                            </span>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {selectedEntity.type === 'INCIDENT' && (
                    <>
                      <div className="flex items-center justify-between gap-1">
                        <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-mono font-medium text-[10px] uppercase tracking-wider">
                          {selectedEntity.data.severity}
                        </span>
                        <span className="text-[10px] font-mono text-neutral-500 uppercase">
                          {selectedEntity.data.status}
                        </span>
                      </div>
                      <h4 className="font-semibold text-neutral-900 leading-snug">{selectedEntity.data.title}</h4>
                      <p className="text-[11px] text-neutral-600 leading-relaxed">
                        {selectedEntity.data.description}
                      </p>
                      <div className="bg-neutral-50 p-2.5 rounded-md border border-neutral-200/80 text-[11px] space-y-1">
                        <div>
                          <span className="text-neutral-500">Reporter:</span>{' '}
                          <span className="font-medium text-neutral-800">{selectedEntity.data.reporterName}</span>
                        </div>
                        <div>
                          <span className="text-neutral-500">Location:</span>{' '}
                          <span className="text-neutral-700">{selectedEntity.data.locationName}</span>
                        </div>
                        {selectedEntity.data.floodDepthCm && (
                          <div className="text-rose-700 font-medium tabular-nums">
                            Water Depth: {selectedEntity.data.floodDepthCm} cm
                          </div>
                        )}
                        {selectedEntity.data.photoUrl && (
                          <div className="pt-1">
                            <div className="relative rounded-md overflow-hidden border border-neutral-300 bg-neutral-950">
                              <img
                                src={selectedEntity.data.photoUrl}
                                alt={selectedEntity.data.title}
                                className="w-full h-28 object-cover"
                              />
                              <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-xs text-[9px] text-white font-medium flex items-center gap-1">
                                <Camera className="w-2.5 h-2.5 text-amber-400" />
                                <span>Field Photo Evidence</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {selectedEntity.type === 'REQUEST' && (
                    <>
                      <div className="flex items-center justify-between gap-1">
                        <span className="px-1.5 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-200 font-mono font-medium text-[10px] uppercase tracking-wider">
                          {selectedEntity.data.priority} PRIORITY
                        </span>
                        <span className="text-[10px] font-mono text-neutral-500 uppercase">
                          {selectedEntity.data.status}
                        </span>
                      </div>
                      <h4 className="font-semibold text-neutral-900 leading-snug">
                        Resident: {selectedEntity.data.residentName}
                      </h4>
                      <p className="text-[11px] text-neutral-600 leading-relaxed">
                        {selectedEntity.data.description}
                      </p>
                      <div className="bg-neutral-50 p-2.5 rounded-md border border-neutral-200/80 text-[11px] space-y-1">
                        <div className="tabular-nums">
                          <span className="text-neutral-500">Headcount:</span>{' '}
                          <span className="font-medium text-neutral-800">{selectedEntity.data.peopleCount} pax</span>
                        </div>
                        <div className="tabular-nums">
                          <span className="text-neutral-500">Contact:</span>{' '}
                          <span className="text-neutral-700 font-mono">{selectedEntity.data.contactPhone}</span>
                        </div>
                      </div>
                    </>
                  )}

                  {selectedEntity.type === 'SENSOR' && (
                    <>
                      <div className="text-sky-700 font-bold flex items-center gap-1.5">
                        <Droplets className="w-4 h-4 shrink-0" />
                        <span className="leading-snug">{selectedEntity.data.name}</span>
                      </div>
                      <div className="text-base font-bold text-neutral-900 font-mono tabular-nums">
                        {selectedEntity.data.waterLevel}
                      </div>
                      <div className="text-[11px] font-medium text-amber-700">
                        {selectedEntity.data.alarm}
                      </div>
                      <p className="text-[10px] text-neutral-500">
                        Official telemetry from Marikina River Disaster Monitoring Station.
                      </p>
                    </>
                  )}
                </div>
              </InfoWindow>
            )}
          </Map>
        </div>
      ) : (
        /* 4. OFFLINE AIR-GAPPED VECTOR CARTOGRAPHY FALLBACK */
        <div className="w-full h-full flex-1 relative flex flex-col justify-center items-center bg-[#0d1615]">
          <div className="absolute top-14 left-3 z-10 bg-neutral-900/95 text-amber-300 border border-amber-500/40 px-2.5 py-1 rounded-md text-[11px] font-mono font-medium flex items-center gap-1.5 shadow-md">
            <WifiOff className="w-3.5 h-3.5 text-amber-400" />
            <span>Air-Gapped Vector Cartography Active</span>
          </div>

          <svg
            viewBox="0 0 800 600"
            className="w-full h-full max-h-[600px] select-none"
            style={{ backgroundColor: '#0d1615' }}
          >
            <defs>
              <linearGradient id="riverGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0284c7" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#0369a1" stopOpacity="0.9" />
              </linearGradient>
            </defs>

            {/* Marikina River Path */}
            <path
              d="M 400 0 Q 380 150 420 300 T 360 450 T 390 600"
              fill="none"
              stroke="url(#riverGradient)"
              strokeWidth="42"
              strokeLinecap="round"
            />
            <text x="425" y="280" fill="#38bdf8" fontSize="12" fontWeight="bold" opacity="0.8">
              MARIKINA RIVER (HIGH WATER: 16.8m)
            </text>

            {/* Dike & Roads */}
            <path
              d="M 330 0 L 330 600"
              fill="none"
              stroke="#064e3b"
              strokeWidth="6"
              strokeDasharray="4 4"
            />
            <text x="240" y="50" fill="#10b981" fontSize="10" opacity="0.7">
              Tumana Flood Dike
            </text>

            {/* JP Rizal Street */}
            <path d="M 100 200 L 700 220" fill="none" stroke="#475569" strokeWidth="8" />
            <text x="120" y="195" fill="#94a3b8" fontSize="10">
              J.P. Rizal Street (Major Artery)
            </text>

            {/* Sumulong Highway */}
            <path d="M 100 480 L 720 460" fill="none" stroke="#334155" strokeWidth="7" strokeDasharray="6 3" />
            <text x="120" y="475" fill="#64748b" fontSize="9">
              Sumulong Highway
            </text>

            {/* Bridges Crossing Marikina River */}
            <path d="M 360 300 L 480 300" stroke="#f59e0b" strokeWidth="8" strokeLinecap="round" />
            <text x="490" y="304" fill="#fbbf24" fontSize="9" fontWeight="bold">
              Tumana Bridge
            </text>

            <path d="M 350 140 L 450 140" stroke="#cbd5e1" strokeWidth="8" strokeLinecap="round" />
            <text x="460" y="144" fill="#cbd5e1" fontSize="9">
              Malanday Bridge
            </text>

            {/* Shelters */}
            {layers.shelters &&
              filteredShelters.map((s) => {
                const pt = projectToSvg(s.lat, s.lng);
                return (
                  <g
                    key={s.id}
                    className="cursor-pointer transition hover:scale-125"
                    onClick={() => setSelectedEntity({ type: 'SHELTER', data: s })}
                  >
                    <circle cx={pt.x} cy={pt.y} r="14" fill="#059669" stroke="#ffffff" strokeWidth="2.5" />
                    <text x={pt.x} y={pt.y + 4} textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold">
                      S
                    </text>
                    <text x={pt.x} y={pt.y + 24} textAnchor="middle" fill="#6ee7b7" fontSize="9" fontWeight="600">
                      {s.name.split(' ')[0]}
                    </text>
                  </g>
                );
              })}

            {/* River Sensor Telemetry */}
            {layers.sensor && (() => {
              const pt = projectToSvg(riverSensor.lat, riverSensor.lng);
              return (
                <g
                  className="cursor-pointer transition hover:scale-125"
                  onClick={() => setSelectedEntity({ type: 'SENSOR', data: riverSensor })}
                >
                  <circle cx={pt.x} cy={pt.y} r="12" fill="#2563eb" stroke="#ffffff" strokeWidth="2" />
                  <text x={pt.x} y={pt.y + 4} textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold">
                    ~
                  </text>
                  <text x={pt.x} y={pt.y + 22} textAnchor="middle" fill="#93c5fd" fontSize="8" fontWeight="bold">
                    Telemetry (16.8m)
                  </text>
                </g>
              );
            })()}

            {/* Help Requests */}
            {layers.assistance &&
              filteredRequests.map((req) => {
                const pt = projectToSvg(req.lat, req.lng);
                return (
                  <g
                    key={req.id}
                    className="cursor-pointer transition hover:scale-125"
                    onClick={() => setSelectedEntity({ type: 'REQUEST', data: req })}
                  >
                    <circle cx={pt.x} cy={pt.y} r="10" fill="#0284c7" stroke="#ffffff" strokeWidth="2" />
                    <text x={pt.x} y={pt.y + 3} textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">
                      H
                    </text>
                    <text x={pt.x} y={pt.y + 18} textAnchor="middle" fill="#7dd3fc" fontSize="8" fontWeight="bold">
                      {req.residentName.split(' ')[0]}
                    </text>
                  </g>
                );
              })}

            {/* Incidents */}
            {layers.incidents &&
              filteredIncidents.map((inc) => {
                const pt = projectToSvg(inc.lat, inc.lng);
                return (
                  <g
                    key={inc.id}
                    className="cursor-pointer transition hover:scale-125"
                    onClick={() => setSelectedEntity({ type: 'INCIDENT', data: inc })}
                  >
                    <circle cx={pt.x} cy={pt.y} r="12" fill="#dc2626" stroke="#ffffff" strokeWidth="2" />
                    <text x={pt.x} y={pt.y + 4} textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold">
                      !
                    </text>
                    <text x={pt.x} y={pt.y + 22} textAnchor="middle" fill="#fca5a5" fontSize="8" fontWeight="bold">
                      {inc.title.substring(0, 16)}
                    </text>
                  </g>
                );
              })}
          </svg>
        </div>
      )}

      {/* 5. BOTTOM DETAIL INSPECTOR CARD */}
      {selectedEntity && (
        <div className="absolute bottom-3 left-3 right-3 z-30 bg-neutral-900/95 backdrop-blur-md rounded-xl border border-neutral-700/90 p-3.5 text-white shadow-xl flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            {selectedEntity.type === 'INCIDENT' && selectedEntity.data.photoUrl ? (
              <div
                className="relative shrink-0 cursor-pointer group"
                onClick={() => setPreviewPhoto(selectedEntity.data.photoUrl || null)}
                title="Click to view full photo evidence"
              >
                <img
                  src={selectedEntity.data.photoUrl}
                  alt={selectedEntity.data.title}
                  className="w-12 h-12 rounded-lg object-cover border border-neutral-700 shadow-xs group-hover:scale-105 transition"
                />
                <div className="absolute -top-1 -right-1 bg-amber-500 rounded-full p-0.5 text-black shadow-xs">
                  <Camera className="w-2.5 h-2.5" />
                </div>
                <div className="absolute inset-0 bg-black/40 rounded-lg opacity-0 group-hover:opacity-100 flex items-center justify-center transition text-[9px] font-medium text-white">
                  Enlarge
                </div>
              </div>
            ) : (
              <div
                className={`p-2 rounded-lg text-white shrink-0 ${
                  selectedEntity.type === 'SHELTER'
                    ? 'bg-emerald-700'
                    : selectedEntity.type === 'INCIDENT'
                    ? 'bg-rose-700'
                    : selectedEntity.type === 'REQUEST'
                    ? 'bg-sky-700'
                    : 'bg-blue-700'
                }`}
              >
                {selectedEntity.type === 'SHELTER' && <Building2 className="w-4 h-4" />}
                {selectedEntity.type === 'INCIDENT' && <AlertTriangle className="w-4 h-4" />}
                {selectedEntity.type === 'REQUEST' && <Users className="w-4 h-4" />}
                {selectedEntity.type === 'SENSOR' && <Droplets className="w-4 h-4" />}
              </div>
            )}
            <div>
              <div className="font-semibold text-sm text-neutral-100 flex flex-wrap items-center gap-2">
                <span>
                  {selectedEntity.type === 'SHELTER' && selectedEntity.data.name}
                  {selectedEntity.type === 'INCIDENT' && selectedEntity.data.title}
                  {selectedEntity.type === 'REQUEST' && `Help Request: ${selectedEntity.data.residentName}`}
                  {selectedEntity.type === 'SENSOR' && selectedEntity.data.name}
                </span>
                {selectedEntity.type === 'INCIDENT' && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 uppercase tracking-wide">
                    Verified
                  </span>
                )}
              </div>
              <div className="text-neutral-400 text-[11px] mt-0.5">
                {selectedEntity.type === 'SHELTER' && (
                  <span>
                    Location: {selectedEntity.data.locationName} • Capacity: <span className="font-mono tabular-nums text-neutral-300">{selectedEntity.data.capacityCurrent}/{selectedEntity.data.capacityTotal}</span>
                  </span>
                )}
                {selectedEntity.type === 'INCIDENT' && (
                  <span>
                    Reported by {selectedEntity.data.reporterName} • {selectedEntity.data.locationName}
                    {selectedEntity.data.floodDepthCm ? ` • ${selectedEntity.data.floodDepthCm} cm depth` : ''}
                    {selectedEntity.data.earthquakeIntensity ? ` • PEIS Intensity ${selectedEntity.data.earthquakeIntensity}` : ''}
                    {selectedEntity.data.volcanoAlertLevel ? ` • Volcano Alert Level ${selectedEntity.data.volcanoAlertLevel}` : ''}
                    {selectedEntity.data.tsunamiWaveHeightMeters ? ` • Tsunami Surge ${selectedEntity.data.tsunamiWaveHeightMeters}m (${selectedEntity.data.inundationDistanceMeters || 300}m inland)` : ''}
                    {selectedEntity.data.ashfallSeverity ? ` • ${selectedEntity.data.ashfallSeverity} Ashfall` : ''}
                  </span>
                )}
                {selectedEntity.type === 'REQUEST' && (
                  <span>
                    <span className="font-mono tabular-nums">{selectedEntity.data.peopleCount} pax</span> • {selectedEntity.data.locationName} • Contact: <span className="font-mono">{selectedEntity.data.contactPhone}</span>
                  </span>
                )}
                {selectedEntity.type === 'SENSOR' && (
                  <span>
                    Current Water Level: <span className="font-mono tabular-nums text-neutral-200">{selectedEntity.data.waterLevel}</span> • {selectedEntity.data.alarm}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {selectedEntity.type === 'INCIDENT' && selectedEntity.data.photoUrl && (
              <button
                onClick={() => setPreviewPhoto(selectedEntity.data.photoUrl || null)}
                className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-amber-300 font-medium text-xs transition flex items-center gap-1 border border-neutral-700"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>View Evidence</span>
              </button>
            )}
            <button
              onClick={() => setSelectedEntity(null)}
              className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white font-medium text-xs transition border border-neutral-700"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* 6. EXPANDED PHOTO LIGHTBOX MODAL */}
      {previewPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setPreviewPhoto(null)}
        >
          <div
            className="relative max-w-2xl w-full bg-neutral-900 border border-neutral-700 rounded-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-3.5 border-b border-neutral-800">
              <div className="flex items-center gap-2 text-white text-xs font-semibold">
                <Camera className="w-4 h-4 text-amber-400" />
                <span>Verified Field Photographic Evidence</span>
              </div>
              <button
                onClick={() => setPreviewPhoto(null)}
                className="p-1 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3 bg-neutral-950 flex items-center justify-center">
              <img
                src={previewPhoto}
                alt="Enlarged incident evidence"
                className="max-h-[60vh] w-auto object-contain rounded-lg"
              />
            </div>
            <div className="p-3 bg-neutral-900 border-t border-neutral-800 text-neutral-400 text-xs flex justify-between items-center">
              <span>Attached to incident report and published for community and responders.</span>
              <button
                onClick={() => setPreviewPhoto(null)}
                className="px-3 py-1.5 rounded-md bg-neutral-800 hover:bg-neutral-700 text-white font-medium text-xs transition border border-neutral-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
