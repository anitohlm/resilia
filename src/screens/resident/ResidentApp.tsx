/**
 * Resident Experience Shell
 * Simple, calm, mobile-first layout for residents: compact header with real connection
 * status, an offline explanation when needed, and a five-destination bottom navigation.
 * Reuses the same local data, repositories, and sync client as the rest of Resilia.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import {
  AskResiliaIcon,
  GetHelpIcon,
  ResidentNavHomeIcon,
  ResidentNavMapIcon,
  ResidentNavMoreIcon,
  ResidentNavUpdatesIcon,
  ResiliaBrandIcon,
} from '../../components/icons/ResidentIcons';
import { ScreenId } from '../../components/layout/Navbar';
import { ConnectivityBadge } from '../../components/layout/ConnectivityBadge';
import { useAuth } from '../../services/auth/authContext';
import { isScreenAllowedForRole } from '../../services/auth/rbac';
import { syncClient } from '../../services/offline/syncClient';
import {
  Alert,
  AssistanceRequest,
  Community,
  ConnectivityStatus,
  Incident,
  Mission,
  Resource,
  Shelter,
} from '../../types';
import { cx } from './ui';
import { t } from './strings';
import { currentAlerts, formatTime } from './residentUtils';
import { ResidentHome } from './ResidentHome';
import { ResidentAsk } from './ResidentAsk';
import { ResidentGetHelp } from './ResidentGetHelp';
import { ResidentReport } from './ResidentReport';
import { ResidentMarkSafe } from './ResidentMarkSafe';
import { ResidentFindPlace } from './ResidentFindPlace';
import { ResidentUpdates } from './ResidentUpdates';
import { ResidentMore } from './ResidentMore';
import { ResidentMap } from './ResidentMap';
import { SyncCenterScreen } from '../SyncCenterScreen';

export interface ResidentData {
  community: Community | null;
  alerts: Alert[];
  shelters: Shelter[];
  incidents: Incident[];
  assistanceRequests: AssistanceRequest[];
  missions: Mission[];
  resources: Resource[];
  pendingSyncCount: number;
  connectivity: ConnectivityStatus;
}

export type Navigate = (screen: ScreenId, params?: { shelterId?: string }) => void;

interface ResidentAppProps extends ResidentData {
  mapsQuotaExceeded: boolean;
  refreshLocalData: () => Promise<void>;
}

const NAV: { id: ScreenId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'HOME', label: t.nav.HOME, icon: ResidentNavHomeIcon },
  { id: 'MAP', label: t.nav.MAP, icon: ResidentNavMapIcon },
  { id: 'REQUEST_ASSISTANCE', label: t.nav.REQUEST_ASSISTANCE, icon: GetHelpIcon },
  { id: 'UPDATES', label: t.nav.UPDATES, icon: ResidentNavUpdatesIcon },
  { id: 'MORE', label: t.nav.MORE, icon: ResidentNavMoreIcon },
];

/** Sub-screens highlight their parent tab. */
const TAB_FOR: Partial<Record<ScreenId, ScreenId>> = {
  ASK_RESILIA: 'HOME',
  REPORT_INCIDENT: 'HOME',
  MARK_SAFE: 'HOME',
  RESOURCES_SHELTERS: 'MAP',
  SYNC_CENTER: 'MORE',
};

export const ResidentApp: React.FC<ResidentAppProps> = (props) => {
  const { currentUser } = useAuth();
  const [screen, setScreen] = useState<ScreenId>('HOME');
  const [params, setParams] = useState<{ shelterId?: string }>({});
  const mainRef = useRef<HTMLElement>(null);

  const navigate: Navigate = (next, p) => {
    const target = isScreenAllowedForRole(next, currentUser.role) ? next : 'HOME';
    setParams(p ?? {});
    setScreen(target);
  };

  // Move focus to the new screen heading for screen-reader and keyboard users.
  useEffect(() => {
    window.scrollTo({ top: 0 });
    const h1 = mainRef.current?.querySelector('h1') as HTMLElement | null;
    if (h1) {
      h1.setAttribute('tabindex', '-1');
      h1.focus({ preventScroll: true });
    }
  }, [screen]);

  const isOffline = props.connectivity === 'OFFLINE' || syncClient.isSimulatingOffline();
  const alertCount = currentAlerts(props.alerts).length;
  const activeTab = TAB_FOR[screen] ?? screen;
  const goHome = () => navigate('HOME');

  return (
    <div className="resident-ui font-inter min-h-screen bg-rs-bg text-rs-text flex flex-col">
      <a
        href="#resident-main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[70] bg-rs-card px-4 py-3 rounded-xl"
      >
        Skip to content
      </a>

      {props.mapsQuotaExceeded && (
        <div className="bg-rs-warning-bg text-rs-text text-sm px-4 py-2 text-center border-b border-rs-border">
          Online map service is temporarily unavailable. The saved offline map still works.
        </div>
      )}

      {/* Compact header */}
      <header className="sticky top-0 z-40 bg-rs-card/95 backdrop-blur border-b border-rs-border pt-[env(safe-area-inset-top)]">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={goHome}
            className="flex items-center gap-2.5 min-h-[48px] -ml-1 px-1 rounded-xl"
            aria-label="Resilia home"
          >
            <span className="w-9 h-9 rounded-full bg-rs-forest flex items-center justify-center" aria-hidden>
              <ResiliaBrandIcon className="w-5 h-5 text-white" />
            </span>
            <span className="text-lg font-bold tracking-tight text-rs-forest">{t.brand}</span>
          </button>

          <div className="flex items-center gap-1.5">
            <ConnectivityBadge variant="resident" />
            <button
              type="button"
              onClick={() => navigate('ASK_RESILIA')}
              className="relative w-11 h-11 rounded-full flex items-center justify-center text-rs-primary hover:bg-rs-tint/60 transition-colors"
              aria-label="Ask Resilia AI Assistant"
              title="Ask Resilia (AI & Local Records)"
            >
              <AskResiliaIcon className="w-5 h-5 text-rs-primary" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => navigate('UPDATES')}
              className="relative w-11 h-11 rounded-full flex items-center justify-center text-rs-text hover:bg-rs-bg transition-colors"
              aria-label={alertCount > 0 ? `Updates, ${alertCount} active alert${alertCount > 1 ? 's' : ''}` : 'Updates'}
            >
              <ResidentNavUpdatesIcon className="w-5 h-5" aria-hidden="true" />
              {alertCount > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[18px] h-4.5 px-1 rounded-full bg-rs-critical text-white text-[11px] font-bold flex items-center justify-center">
                  {alertCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {isOffline && (
        <div role="status" className="bg-rs-forest text-white">
          <div className="max-w-3xl mx-auto px-4 py-3 flex gap-3 text-[15px] leading-snug">
            <WifiOff className="w-5 h-5 shrink-0 mt-0.5" aria-hidden />
            <div>
              <p>{t.offlineBanner}</p>
              <p className="text-white/80 text-sm mt-1">
                Saved information last updated {formatTime(syncClient.getLastSyncTime() ?? undefined)}.
                {props.pendingSyncCount > 0 &&
                  ` ${props.pendingSyncCount} item${props.pendingSyncCount > 1 ? 's' : ''} waiting to be sent.`}
              </p>
            </div>
          </div>
        </div>
      )}

      <main
        id="resident-main"
        key={screen}
        ref={mainRef}
        className="flex-1 w-full max-w-3xl mx-auto px-4 pt-5 pb-[calc(6rem+env(safe-area-inset-bottom))] animate-view"
      >
        {screen === 'HOME' && <ResidentHome {...props} navigate={navigate} />}
        {screen === 'ASK_RESILIA' && <ResidentAsk onBack={goHome} />}
        {screen === 'REQUEST_ASSISTANCE' && (
          <ResidentGetHelp onBack={goHome} navigate={navigate} connectivity={props.connectivity} onCreated={props.refreshLocalData} />
        )}
        {screen === 'REPORT_INCIDENT' && (
          <ResidentReport onBack={goHome} navigate={navigate} connectivity={props.connectivity} onCreated={props.refreshLocalData} />
        )}
        {screen === 'MARK_SAFE' && (
          <ResidentMarkSafe onBack={goHome} navigate={navigate} shelters={props.shelters} connectivity={props.connectivity} />
        )}
        {screen === 'RESOURCES_SHELTERS' && (
          <ResidentFindPlace
            onBack={goHome}
            navigate={navigate}
            shelters={props.shelters}
            resources={props.resources}
            initialShelterId={params.shelterId}
          />
        )}
        {screen === 'MAP' && (
          <ResidentMap
            navigate={navigate}
            shelters={props.shelters}
            incidents={props.incidents}
            resources={props.resources}
            currentUserId={currentUser.id}
          />
        )}
        {screen === 'UPDATES' && <ResidentUpdates {...props} navigate={navigate} />}
        {screen === 'MORE' && <ResidentMore navigate={navigate} pendingSyncCount={props.pendingSyncCount} connectivity={props.connectivity} />}
        {screen === 'SYNC_CENTER' && (
          <div>
            <button
              type="button"
              onClick={() => navigate('MORE')}
              className="mb-4 min-h-[48px] text-rs-primary font-semibold"
            >
              ← Back to More
            </button>
            <SyncCenterScreen isResident={true} />
          </div>
        )}
      </main>

      {/* Bottom navigation */}
      <nav
        aria-label="Main"
        className="fixed bottom-0 inset-x-0 z-40 bg-rs-card border-t border-rs-border pb-[env(safe-area-inset-bottom)]"
      >
        <ul className="max-w-3xl mx-auto grid grid-cols-5">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            const isHelp = item.id === 'REQUEST_ASSISTANCE';
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => navigate(item.id)}
                  aria-current={active ? 'page' : undefined}
                  className={cx(
                    'w-full h-[68px] flex flex-col items-center justify-center gap-1 text-[13px] relative',
                    active ? 'text-rs-primary font-semibold' : 'text-rs-muted font-medium hover:text-rs-text'
                  )}
                >
                  {active && <span className="absolute top-0 inset-x-4 h-[3px] rounded-b-full bg-rs-primary" aria-hidden />}
                  <span
                    className={cx(
                      'flex items-center justify-center rounded-full',
                      isHelp ? 'w-10 h-8' : 'w-8 h-8',
                      isHelp && (active ? 'bg-rs-primary text-white' : 'bg-rs-tint text-rs-primary'),
                      !isHelp && active && 'bg-rs-tint'
                    )}
                    aria-hidden
                  >
                    <Icon className="w-5 h-5" />
                  </span>
                  <span>{item.label}</span>
                  {item.id === 'MORE' && props.pendingSyncCount > 0 && (
                    <span className="absolute top-2 right-[calc(50%-22px)] min-w-[18px] h-[18px] px-1 rounded-full bg-rs-warning text-white text-[11px] font-bold flex items-center justify-center">
                      <span className="sr-only">, items waiting to send: </span>
                      {props.pendingSyncCount}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
};

/** Connection status and spinning sync icon for resident portal */
const ConnectionPill: React.FC<{ status?: ConnectivityStatus; simulatedOffline?: boolean }> = () => {
  return <ConnectivityBadge variant="resident" />;
};
