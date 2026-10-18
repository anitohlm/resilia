/**
 * Resilia Application Root
 * "It works when the internet doesn't."
 * Strict RBAC Model: Users never see or access what they cannot do.
 */

import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './services/auth/authContext';
import { Header } from './components/layout/Header';
import { Navbar, ScreenId } from './components/layout/Navbar';
import { HomeScreen } from './screens/HomeScreen';
import { AskResiliaScreen } from './screens/AskResiliaScreen';
import { MapScreen } from './screens/MapScreen';
import { ReportIncidentScreen } from './screens/ReportIncidentScreen';
import { RequestAssistanceScreen } from './screens/RequestAssistanceScreen';
import { ResponderMissionsScreen } from './screens/ResponderMissionsScreen';
import { CoordinatorDashboardScreen } from './screens/CoordinatorDashboardScreen';
import { IncidentVerificationScreen } from './screens/IncidentVerificationScreen';
import { ResourceShelterScreen } from './screens/ResourceShelterScreen';
import { ResidentApp } from './screens/resident/ResidentApp';
import { ResponderApp } from './screens/responder/ResponderApp';
import { seedDemoData } from './demo/seedData';
import { localDB, STORES } from './services/offline/db';
import { EventQueueService } from './services/offline/eventQueue';
import { syncClient } from './services/offline/syncClient';
import { APIProvider } from '@vis.gl/react-google-maps';
import {
  Alert,
  AssistanceRequest,
  AuditEntry,
  Community,
  ConnectivityStatus,
  Incident,
  Mission,
  Resource,
  Shelter,
} from './types';
import { AuditRepository } from './services/repositories';
import { WifiOff } from 'lucide-react';
import { ToastProvider } from './components/common/Toast';
import { isScreenAllowedForRole, getDefaultScreenForRole } from './services/auth/rbac';

interface AppContentProps {
  community: Community | null;
  alerts: Alert[];
  shelters: Shelter[];
  incidents: Incident[];
  assistanceRequests: AssistanceRequest[];
  missions: Mission[];
  resources: Resource[];
  auditLogs: AuditEntry[];
  pendingSyncCount: number;
  connectivity: ConnectivityStatus;
  mapsQuotaExceeded: boolean;
  refreshLocalData: () => Promise<void>;
}

function AppContent({
  community,
  alerts,
  shelters,
  incidents,
  assistanceRequests,
  missions,
  resources,
  auditLogs,
  pendingSyncCount,
  connectivity,
  mapsQuotaExceeded,
  refreshLocalData,
}: AppContentProps) {
  const { currentUser } = useAuth();
  const [activeScreen, setActiveScreen] = useState<ScreenId>('HOME');

  // Strict RBAC Guard: If user switches role and current screen is not allowed, route to role default immediately
  const prevRoleRef = React.useRef(currentUser.role);
  useEffect(() => {
    if (!isScreenAllowedForRole(activeScreen, currentUser.role)) {
      setActiveScreen(getDefaultScreenForRole(currentUser.role));
    } else if (prevRoleRef.current !== currentUser.role) {
      if (currentUser.role === 'COORDINATOR' && activeScreen === 'HOME') {
        setActiveScreen('COORDINATOR');
      }
    }
    prevRoleRef.current = currentUser.role;
  }, [currentUser.role, activeScreen]);

  const handleNavigate = (screen: ScreenId) => {
    if (isScreenAllowedForRole(screen, currentUser.role)) {
      setActiveScreen(screen);
    } else {
      setActiveScreen('HOME');
    }
  };

  // 1. RESIDENT ROLE REDESIGN: Dedicated, mobile-first, calm resident experience
  if (currentUser.role === 'RESIDENT') {
    return (
      <ResidentApp
        community={community}
        alerts={alerts}
        shelters={shelters}
        incidents={incidents}
        assistanceRequests={assistanceRequests}
        missions={missions}
        resources={resources}
        pendingSyncCount={pendingSyncCount}
        connectivity={connectivity}
        mapsQuotaExceeded={mapsQuotaExceeded}
        refreshLocalData={refreshLocalData}
      />
    );
  }

  // 2. EMERGENCY RESPONDER ROLE REDESIGN: Dedicated mobile-first field response
  if (currentUser.role === 'RESPONDER') {
    return (
      <ResponderApp
        community={community}
        alerts={alerts}
        shelters={shelters}
        incidents={incidents}
        assistanceRequests={assistanceRequests}
        missions={missions}
        resources={resources}
        pendingSyncCount={pendingSyncCount}
        connectivity={connectivity}
        onDataChanged={refreshLocalData}
      />
    );
  }

  // 3. DISASTER COORDINATOR OPERATIONAL COMMAND CENTER (Single dedicated page with persistent side nav)
  if (currentUser.role === 'COORDINATOR') {
    return (
      <div className="min-h-screen bg-neutral-100 flex flex-col text-neutral-900 font-sans selection:bg-emerald-200">
        {/* Google Maps Quota Reached Notification */}
        {mapsQuotaExceeded && (
          <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
            <span>
              Google Maps Platform quota reached. If you are the app owner, visit{' '}
              <a
                href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-semibold text-amber-950 hover:text-amber-800"
              >
                maps developer site
              </a>{' '}
              for instructions to update your account.
            </span>
          </div>
        )}

        {/* Global Executive Command Header with Persona Selector & Status */}
        <Header onResetDemo={refreshLocalData} />

        {/* Quiet Offline Status Bar if disconnected */}
        {(connectivity === 'OFFLINE' || syncClient.isSimulatingOffline()) && (
          <div className="bg-amber-600 text-white px-4 py-1.5 text-xs font-medium">
            <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
              <WifiOff className="w-3.5 h-3.5 shrink-0" />
              <span>
                Offline Mode — Local IndexedDB active. All reports and requests are safely stored offline.
              </span>
            </div>
          </div>
        )}

        {/* Main Application Container: Command Center is the ONLY page */}
        <main className="flex-1 w-full mx-auto animate-in fade-in duration-200 ease-out max-w-[1600px] p-3 sm:p-5 lg:p-6 pb-20 md:pb-8">
          <CoordinatorDashboardScreen
            community={community}
            alerts={alerts}
            shelters={shelters}
            incidents={incidents}
            assistanceRequests={assistanceRequests}
            missions={missions}
            resources={resources}
            auditLogs={auditLogs}
            onNavigate={handleNavigate}
            onDataChanged={refreshLocalData}
          />
        </main>

        {/* Footer */}
        <footer className="bg-neutral-900 border-t border-neutral-800 text-neutral-400 text-xs py-6 px-4 text-center mt-auto">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <strong className="text-neutral-200">RESILIA</strong> — Community disaster coordination platform.
            </div>
            <div className="text-[11px] text-neutral-500">
              Community Resilience MVP for Philippine Disaster Risk Reduction • Metro Manila Valley
            </div>
          </div>
        </footer>
      </div>
    );
  }

  // 4. GENERAL FALLBACK (LEGACY WORKFLOWS)
  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col text-neutral-900 font-sans selection:bg-emerald-200">
      <Header onResetDemo={refreshLocalData} />
      <Navbar
        activeScreen={activeScreen}
        onNavigate={handleNavigate}
        pendingSyncCount={pendingSyncCount}
      />
      <main className="flex-1 w-full mx-auto max-w-7xl p-4 sm:p-6 lg:p-8 pb-24 md:pb-8">
        <HomeScreen
          community={community}
          alerts={alerts}
          shelters={shelters}
          incidents={incidents}
          assistanceRequests={assistanceRequests}
          missions={missions}
          resources={resources}
          onNavigate={handleNavigate}
          pendingSyncCount={pendingSyncCount}
          onDataChanged={refreshLocalData}
        />
      </main>
    </div>
  );
}

export default function App() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [mapsQuotaExceeded, setMapsQuotaExceeded] = useState(false);

  // Core application state loaded from local IndexedDB
  const [community, setCommunity] = useState<Community | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [assistanceRequests, setAssistanceRequests] = useState<AssistanceRequest[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  const [connectivity, setConnectivity] = useState<ConnectivityStatus>(syncClient.getStatus());

  const refreshLocalData = async () => {
    try {
      const [comm, alts, shs, incs, reqs, mis, res, auds, pending] = await Promise.all([
        localDB.get<Community>(STORES.COMMUNITY, 'comm_marikina_tumana_malanday'),
        localDB.getAll<Alert>(STORES.ALERTS),
        localDB.getAll<Shelter>(STORES.SHELTERS),
        localDB.getAll<Incident>(STORES.INCIDENTS),
        localDB.getAll<AssistanceRequest>(STORES.ASSISTANCE),
        localDB.getAll<Mission>(STORES.MISSIONS),
        localDB.getAll<Resource>(STORES.RESOURCES),
        AuditRepository.getAll(),
        EventQueueService.getPendingEvents(),
      ]);

      setCommunity(comm || null);
      setAlerts(alts.filter((a) => a.active));
      setShelters(shs);
      setIncidents(incs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      setAssistanceRequests(reqs.sort((a, b) => b.priorityScore - a.priorityScore));
      setMissions(mis.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      setResources(res);
      setAuditLogs(auds);
      setPendingSyncCount(pending.length);
    } catch (err) {
      console.error('Failed to load local data:', err);
    }
  };

  useEffect(() => {
    const init = async () => {
      // 1. Seed demo data idempotently if first launch
      await seedDemoData();
      // 2. Start sync client heartbeat
      syncClient.init();
      // 3. Load all local records
      await refreshLocalData();
      setIsInitializing(false);
    };

    init();

    // Event listeners for reactive local updates
    const handleLocalWrite = () => {
      refreshLocalData();
    };
    const handleSyncComplete = () => {
      refreshLocalData();
    };

    window.addEventListener('resilia_local_write', handleLocalWrite);
    window.addEventListener('resilia_sync_complete', handleSyncComplete);

    const unsubSync = syncClient.subscribe((status) => {
      setConnectivity(status);
    });

    const handleQuota = () => {
      setMapsQuotaExceeded(true);
    };
    window.addEventListener('gmp-quota-exceeded', handleQuota);

    return () => {
      window.removeEventListener('resilia_local_write', handleLocalWrite);
      window.removeEventListener('resilia_sync_complete', handleSyncComplete);
      window.removeEventListener('gmp-quota-exceeded', handleQuota);
      unsubSync();
    };
  }, []);

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-12 h-12 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <h2 className="text-lg font-bold text-emerald-400">Initializing Resilia Offline Database...</h2>
        <p className="text-xs text-neutral-400 max-w-sm">
          Loading versioned IndexedDB stores, local cartography, and emergency registries.
        </p>
      </div>
    );
  }

  return (
    <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''}>
      <AuthProvider>
        <ToastProvider>
          <AppContent
            community={community}
            alerts={alerts}
            shelters={shelters}
            incidents={incidents}
            assistanceRequests={assistanceRequests}
            missions={missions}
            resources={resources}
            auditLogs={auditLogs}
            pendingSyncCount={pendingSyncCount}
            connectivity={connectivity}
            mapsQuotaExceeded={mapsQuotaExceeded}
            refreshLocalData={refreshLocalData}
          />
        </ToastProvider>
      </AuthProvider>
    </APIProvider>
  );
}
