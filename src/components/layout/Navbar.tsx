/**
 * Resilia Navigation Bar & Mobile Command Bar
 * Ergonomic, thumb-friendly navigation designed for high-stress disaster response.
 * - Desktop: Clean role-aware top header strip
 * - Mobile: Fixed bottom action bar (min 48px touch targets) + Quick-Action "More" drawer sheet
 */

import React, { useState } from 'react';
import { useAuth } from '../../services/auth/authContext';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Compass,
  FileText,
  HeartHandshake,
  HelpCircle,
  Home,
  LayoutDashboard,
  Menu,
  MoreHorizontal,
  RefreshCw,
  Shield,
  Truck,
  X,
} from 'lucide-react';

export type ScreenId =
  | 'HOME'
  | 'ASK_RESILIA'
  | 'MAP'
  | 'REPORT_INCIDENT'
  | 'REQUEST_ASSISTANCE'
  | 'MISSIONS'
  | 'COORDINATOR'
  | 'VERIFICATION'
  | 'RESOURCES_SHELTERS'
  | 'SYNC_CENTER'
  | 'MARK_SAFE'
  | 'UPDATES'
  | 'MORE';

interface NavbarProps {
  activeScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  pendingSyncCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeScreen,
  onNavigate,
  pendingSyncCount,
}) => {
  const { currentUser } = useAuth();
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  // For Disaster Coordinators, the Command dashboard is the only page with its own side navigation.
  if (currentUser.role === 'COORDINATOR') {
    return null;
  }
  const allNavItems: {
    id: ScreenId;
    label: string;
    sublabel?: string;
    icon: any;
    roles: ('RESIDENT' | 'RESPONDER' | 'COORDINATOR')[];
    badge?: number;
    isPrimary?: boolean;
    color?: string;
  }[] = [
    {
      id: 'HOME',
      label: 'Home',
      sublabel: 'Bahay',
      icon: Home,
      roles: ['RESIDENT', 'RESPONDER'],
    },
    {
      id: 'MAP',
      label: 'Map',
      sublabel: 'Mapa',
      icon: Compass,
      roles: ['RESIDENT', 'RESPONDER'],
    },
    {
      id: 'REQUEST_ASSISTANCE',
      label: 'Get Help',
      sublabel: 'Saklolo',
      icon: HeartHandshake,
      roles: ['RESIDENT'],
      isPrimary: true,
      color: 'rose',
    },
    {
      id: 'REPORT_INCIDENT',
      label: 'Report',
      sublabel: 'Ulat',
      icon: AlertTriangle,
      roles: ['RESIDENT', 'RESPONDER'],
    },
    {
      id: 'MISSIONS',
      label: 'Missions',
      sublabel: 'Field Ops',
      icon: Truck,
      roles: ['RESPONDER'],
    },
    {
      id: 'COORDINATOR',
      label: 'Command',
      sublabel: 'Dashboard',
      icon: LayoutDashboard,
      roles: ['COORDINATOR'],
    },
    {
      id: 'VERIFICATION',
      label: 'Verify',
      sublabel: 'Triage',
      icon: CheckCircle2,
      roles: [],
    },
    {
      id: 'RESOURCES_SHELTERS',
      label: 'Shelters',
      sublabel: 'Evac Centers',
      icon: Building2,
      roles: ['RESIDENT', 'RESPONDER'],
    },
    {
      id: 'ASK_RESILIA',
      label: 'Ask AI',
      sublabel: 'Protocols',
      icon: HelpCircle,
      roles: ['RESIDENT', 'RESPONDER'],
    },
    {
      id: 'SYNC_CENTER',
      label: 'Sync',
      sublabel: 'Offline Store',
      icon: RefreshCw,
      badge: pendingSyncCount,
      roles: ['RESIDENT', 'RESPONDER'],
    },
  ];

  // Filter items matching active role
  const roleItems = allNavItems.filter((item) => item.roles.includes(currentUser.role));

  // Determine top 4 mobile bottom tabs based on role
  let mobileTabs: typeof roleItems = [];
  if (currentUser.role === 'RESIDENT') {
    mobileTabs = [
      roleItems.find((i) => i.id === 'HOME')!,
      roleItems.find((i) => i.id === 'MAP')!,
      roleItems.find((i) => i.id === 'REQUEST_ASSISTANCE')!,
      roleItems.find((i) => i.id === 'REPORT_INCIDENT')!,
    ].filter(Boolean);
  } else if (currentUser.role === 'RESPONDER') {
    mobileTabs = [
      roleItems.find((i) => i.id === 'HOME')!,
      roleItems.find((i) => i.id === 'MISSIONS')!,
      roleItems.find((i) => i.id === 'MAP')!,
      roleItems.find((i) => i.id === 'REPORT_INCIDENT')!,
    ].filter(Boolean);
  } else {
    // COORDINATOR
    mobileTabs = [
      roleItems.find((i) => i.id === 'HOME')!,
      roleItems.find((i) => i.id === 'COORDINATOR')!,
      roleItems.find((i) => i.id === 'VERIFICATION')!,
      roleItems.find((i) => i.id === 'MAP')!,
    ].filter(Boolean);
  }

  // Secondary items for the "More" menu
  const mobileTabIds = new Set(mobileTabs.map((t) => t.id));
  const moreItems = roleItems.filter((i) => !mobileTabIds.has(i.id));

  const handleSelectScreen = (screen: ScreenId) => {
    onNavigate(screen);
    setIsMoreMenuOpen(false);
  };

  return (
    <>
      {/* ======================================================== */}
      {/* DESKTOP & TABLET TOP NAVIGATION (hidden on small mobile) */}
      {/* ======================================================== */}
      <nav className="bg-neutral-900 border-b border-neutral-800 text-neutral-300 text-xs hidden md:block select-none sticky top-12 z-30 backdrop-blur-md bg-neutral-900/95">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between min-w-max py-1.5">
          <div className="flex items-center gap-1.5">
            {roleItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeScreen === item.id;
              const isHighlight = item.isPrimary;

              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition text-xs ${
                    isActive
                      ? 'text-white bg-neutral-800 font-semibold shadow-xs'
                      : isHighlight
                      ? 'text-rose-300 hover:text-white hover:bg-rose-950/40'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
                  }`}
                >
                  <Icon
                    className={`w-3.5 h-3.5 shrink-0 ${
                      isActive
                        ? 'text-emerald-400'
                        : isHighlight
                        ? 'text-rose-400'
                        : 'text-neutral-500'
                    }`}
                  />
                  <span>{item.label}</span>
                  {typeof item.badge === 'number' && item.badge > 0 && (
                    <span className="font-mono text-[10px] text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded tabular-nums border border-amber-500/30">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="text-[11px] text-neutral-500 flex items-center gap-2">
            <span>Marikina Sector</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          </div>
        </div>
      </nav>

      {/* ======================================================== */}
      {/* MOBILE BOTTOM NAVIGATION BAR (Thumb Zone, min 48px hit) */}
      {/* ======================================================== */}
      <aside aria-label="Mobile Navigation" className="fixed bottom-0 inset-x-0 z-40 bg-neutral-950/95 backdrop-blur-md border-t border-neutral-800/80 md:hidden pb-safe">
        <div className="grid grid-cols-5 items-center justify-around h-15 px-1 max-w-lg mx-auto">
          {mobileTabs.map((item) => {
            const Icon = item.icon;
            const isActive = activeScreen === item.id;
            const isHighlight = item.isPrimary;

            return (
              <button
                key={item.id}
                onClick={() => handleSelectScreen(item.id)}
                className={`flex flex-col items-center justify-center h-full py-1 min-h-[48px] rounded-lg transition relative ${
                  isActive
                    ? 'text-white'
                    : isHighlight
                    ? 'text-rose-400'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {/* Active indicator dot */}
                {isActive && (
                  <span className="absolute top-1 w-1 h-1 rounded-full bg-emerald-400" />
                )}

                <div
                  className={`p-1 rounded-lg ${
                    isHighlight && isActive
                      ? 'bg-rose-600 text-white shadow-xs'
                      : isActive
                      ? 'bg-neutral-800 text-emerald-400'
                      : ''
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                </div>

                <span
                  className={`text-[10px] tracking-tight leading-none mt-0.5 ${
                    isActive ? 'font-bold text-white' : 'font-medium'
                  }`}
                >
                  {item.label}
                </span>

                {typeof item.badge === 'number' && item.badge > 0 && (
                  <span className="absolute top-1 right-2 font-mono text-[9px] text-amber-200 bg-amber-600 px-1 rounded tabular-nums">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* 5th Tab: "More" Menu Toggle */}
          <button
            onClick={() => setIsMoreMenuOpen(true)}
            className={`flex flex-col items-center justify-center h-full py-1 min-h-[48px] rounded-lg transition relative ${
              isMoreMenuOpen ? 'text-white' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <div className="p-1 rounded-lg">
              <MoreHorizontal className="w-4 h-4 shrink-0" />
            </div>
            <span className="text-[10px] tracking-tight leading-none mt-0.5 font-medium">
              More
            </span>
            {pendingSyncCount > 0 && (
              <span className="absolute top-1 right-2 font-mono text-[9px] text-amber-200 bg-amber-600 px-1 rounded tabular-nums">
                {pendingSyncCount}
              </span>
            )}
          </button>
        </div>
      </aside>

      {/* ======================================================== */}
      {/* MOBILE "MORE" BOTTOM SHEET / DRAWER                      */}
      {/* ======================================================== */}
      {isMoreMenuOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs md:hidden animate-in fade-in duration-200">
          <div
            className="fixed inset-0"
            onClick={() => setIsMoreMenuOpen(false)}
          />
          <div className="relative bg-neutral-900 border-t border-neutral-800 rounded-t-2xl w-full max-w-lg p-5 pb-8 space-y-4 shadow-2xl z-10 animate-in slide-in-from-bottom duration-200">
            {/* Sheet Handle */}
            <div className="w-12 h-1 bg-neutral-700 rounded-full mx-auto" />

            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <div>
                <h3 className="text-sm font-bold text-white">All Disaster Tools</h3>
                <p className="text-[11px] text-neutral-400">
                  Role: <span className="font-semibold text-neutral-200">{currentUser.role}</span>
                </p>
              </div>
              <button
                onClick={() => setIsMoreMenuOpen(false)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Grid of All Available Destintions */}
            <div className="grid grid-cols-2 gap-2.5">
              {roleItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeScreen === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectScreen(item.id)}
                    className={`p-3 rounded-xl border text-left transition flex items-center gap-3 min-h-[48px] ${
                      isActive
                        ? 'bg-neutral-800 border-emerald-500/80 text-white shadow-xs'
                        : 'bg-neutral-950/60 border-neutral-800 text-neutral-300 hover:bg-neutral-800/60 hover:text-white'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        isActive
                          ? 'bg-emerald-600 text-white'
                          : 'bg-neutral-800 text-neutral-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="overflow-hidden">
                      <div className="text-xs font-bold truncate leading-tight">
                        {item.label}
                      </div>
                      {item.sublabel && (
                        <div className="text-[10px] text-neutral-400 truncate mt-0.5">
                          {item.sublabel}
                        </div>
                      )}
                    </div>
                    {typeof item.badge === 'number' && item.badge > 0 && (
                      <span className="ml-auto font-mono text-[10px] text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/30 tabular-nums">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
