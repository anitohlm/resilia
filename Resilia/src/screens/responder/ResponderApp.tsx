/**
 * ResponderApp — Complete Emergency Responder Application Shell
 * Section 3: Navigation & Shell architecture
 * Provides 5 responder-focused destinations:
 * 1. Home
 * 2. My Missions
 * 3. Map
 * 4. Field Reports
 * 5. More
 * Responsive layout: Mobile bottom nav, desktop/tablet compact sidebar.
 */

import React, { useState } from 'react';
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
import { useAuth } from '../../services/auth/authContext';
import { syncClient } from '../../services/offline/syncClient';
import { getActiveResponderMission } from './responderUtils';
import { ResponderHome } from './ResponderHome';
import { ResponderMissions } from './ResponderMissions';
import { ResponderMap } from './ResponderMap';
import { ResponderFieldReports } from './ResponderFieldReports';
import { ResponderMore } from './ResponderMore';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Compass,
  FileText,
  Home,
  Layers,
  MapPin,
  Menu,
  MoreHorizontal,
  Navigation,
  Radio,
  RefreshCw,
  Send,
  Shield,
  Truck,
  UserCheck,
  HardHat,
  ShieldCheck,
  Check,
  ChevronDown,
  Users,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';
import { UserRole } from '../../types';

export type ResponderTab = 'HOME' | 'MISSIONS' | 'MAP' | 'REPORTS' | 'MORE';

interface ResponderAppProps {
  community: Community | null;
  alerts: Alert[];
  shelters: Shelter[];
  incidents: Incident[];
  assistanceRequests: AssistanceRequest[];
  missions: Mission[];
  resources: Resource[];
  pendingSyncCount: number;
  connectivity: ConnectivityStatus;
  onDataChanged: () => Promise<void>;
}

export const ResponderApp: React.FC<ResponderAppProps> = ({
  community,
  alerts,
  shelters,
  incidents,
  assistanceRequests,
  missions,
  resources,
  pendingSyncCount,
  connectivity,
  onDataChanged,
}) => {
  const { currentUser, setRole, setUser, availableUsers } = useAuth();
  const [activeTab, setActiveTab] = useState<ResponderTab>('HOME');
  const [focusedMissionForMap, setFocusedMissionForMap] = useState<Mission | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);

  // Active mission for current responder
  const activeMission = getActiveResponderMission(missions, currentUser.id, currentUser.name);

  // Navigation handlers
  const handleOpenMapWithMission = (mission?: Mission) => {
    if (mission) setFocusedMissionForMap(mission);
    setActiveTab('MAP');
  };

  const navItems: { id: ResponderTab; label: string; icon: React.FC<{ className?: string }>; badge?: number }[] = [
    { id: 'HOME', label: 'Home', icon: Home },
    {
      id: 'MISSIONS',
      label: 'My Missions',
      icon: Truck,
      badge: missions.filter(
        (m) =>
          (m.assignedResponderId === currentUser.id || m.assignedResponderName?.includes(currentUser.name)) &&
          m.status !== 'COMPLETED'
      ).length,
    },
    { id: 'MAP', label: 'Map', icon: Compass },
    { id: 'REPORTS', label: 'Field Reports', icon: Send },
    { id: 'MORE', label: 'More', icon: MoreHorizontal, badge: pendingSyncCount > 0 ? pendingSyncCount : undefined },
  ];

  return (
    <div className="min-h-screen bg-[#F5F7F6] text-[#182522] flex flex-col md:flex-row antialiased selection:bg-emerald-200">
      {/* Tablet & Desktop Sidebar Navigation Rail */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-[#E3E9E5] p-5 shrink-0 justify-between">
        <div className="space-y-6">
          {/* Logo & Operational Badge */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#153B32] flex items-center justify-center text-white font-black shadow-sm">
              <Shield className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-base tracking-tight text-[#153B32]">RESILIA</span>
                <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-blue-100 text-blue-900">
                  FIELD
                </span>
              </div>
              <p className="text-[11px] text-[#66736D] leading-none mt-0.5">Emergency Operations</p>
            </div>
          </div>

          {/* Current Responder Identity Card */}
          <div className="p-3.5 rounded-2xl bg-[#F5F7F6] border border-[#E3E9E5] space-y-1">
            <div className="flex items-center justify-between text-[11px] text-[#66736D]">
              <span className="font-extrabold uppercase text-[#16856B]">Active Responder</span>
              <span className="flex items-center gap-1">
                {connectivity === 'ONLINE' ? (
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                )}
                <span className="font-semibold text-[10px]">
                  {connectivity === 'ONLINE' ? 'Online' : 'Offline'}
                </span>
              </span>
            </div>
            <p className="font-bold text-xs text-[#182522] truncate">{currentUser.name}</p>
            <p className="text-[10px] text-[#66736D] truncate">{currentUser.assignedZone || 'Sector 2 (Tumana-Malanday)'}</p>
          </div>

          {/* Main Navigation Destinations */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl font-bold text-xs transition ${
                    isActive
                      ? 'bg-[#153B32] text-white shadow-sm'
                      : 'text-[#66736D] hover:text-[#182522] hover:bg-[#F5F7F6]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-[#66736D]'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                        isActive ? 'bg-emerald-500 text-white' : 'bg-emerald-100 text-[#153B32]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Sidebar Offline Status & Reset */}
        <div className="space-y-3 pt-4 border-t border-[#E3E9E5] text-xs">
          {pendingSyncCount > 0 && (
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <WifiOff className="w-3.5 h-3.5 text-amber-700" />
                <span>Offline Storage Active</span>
              </div>
              <p className="text-[10px] text-amber-800">
                {pendingSyncCount} action(s) stored in IndexedDB. Will sync when online.
              </p>
            </div>
          )}

          <div className="flex items-center justify-between text-[11px] text-[#66736D]">
            <span>Active Persona:</span>
            <button
              type="button"
              onClick={() => setIsRoleModalOpen(true)}
              className="font-bold text-[#16856B] hover:underline"
            >
              Switch Role →
            </button>
          </div>
        </div>
      </aside>

      {/* Main Workspace Column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Compact Mobile & Tablet Top Bar */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#E3E9E5] px-4 py-3 flex items-center justify-between">
          {/* Left Brand & Active Screen Label */}
          <div className="flex items-center gap-2.5">
            <div className="md:hidden w-8 h-8 rounded-full bg-[#153B32] flex items-center justify-center text-white font-black shadow-xs">
              <Shield className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xs text-[#153B32] hidden sm:inline">RESILIA FIELD RESPONSE</span>
                <span className="text-xs text-[#66736D] hidden sm:inline">•</span>
                <span className="font-bold text-xs text-[#182522]">
                  {navItems.find((n) => n.id === activeTab)?.label}
                </span>
              </div>
              <p className="text-[10px] text-[#66736D] truncate max-w-[200px] sm:max-w-none">
                Officer {currentUser.name} • {currentUser.assignedZone || 'Tumana-Malanday'}
              </p>
            </div>
          </div>

          {/* Right Connectivity & Persona Status */}
          <div className="flex items-center gap-2">
            {/* Offline / Online Pill */}
            <div
              className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1.5 border ${
                connectivity === 'ONLINE'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
            >
              {connectivity === 'ONLINE' ? (
                <>
                  <Wifi className="w-3 h-3 text-emerald-600" />
                  <span className="hidden sm:inline">Connected</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3 text-amber-700" />
                  <span>Offline Mode</span>
                </>
              )}
            </div>

            {pendingSyncCount > 0 && (
              <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {pendingSyncCount} queued
              </span>
            )}

            {/* Quick Switch Dropdown / Role Selector Button */}
            <button
              type="button"
              onClick={() => setIsRoleModalOpen(true)}
              className="text-xs font-bold text-[#16856B] bg-[#E8F3EF] border border-[#16856B]/30 px-3 py-1.5 rounded-xl hover:bg-[#16856B] hover:text-white transition flex items-center gap-1.5 shadow-2xs"
              title="Switch role and persona"
            >
              <span>Switch Role</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main key={activeTab} className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 md:pb-8 max-w-5xl w-full mx-auto animate-view">
          {activeTab === 'HOME' && (
            <ResponderHome
              community={community}
              alerts={alerts}
              shelters={shelters}
              incidents={incidents}
              assistanceRequests={assistanceRequests}
              missions={missions}
              resources={resources}
              pendingSyncCount={pendingSyncCount}
              onNavigateToTab={(tab) => setActiveTab(tab)}
              onSelectMission={(mission) => {
                setFocusedMissionForMap(mission);
                setActiveTab('MISSIONS');
              }}
              onMissionUpdated={onDataChanged}
              onOpenMap={handleOpenMapWithMission}
            />
          )}

          {activeTab === 'MISSIONS' && (
            <ResponderMissions
              missions={missions}
              incidents={incidents}
              assistanceRequests={assistanceRequests}
              shelters={shelters}
              onMissionUpdated={onDataChanged}
              onOpenMap={handleOpenMapWithMission}
            />
          )}

          {activeTab === 'MAP' && (
            <ResponderMap
              missions={missions}
              incidents={incidents}
              resources={resources}
              shelters={shelters}
              focusedMission={focusedMissionForMap}
              onSelectMission={(mission) => {
                setFocusedMissionForMap(mission);
                setActiveTab('MISSIONS');
              }}
            />
          )}

          {activeTab === 'REPORTS' && (
            <ResponderFieldReports
              missions={missions}
              incidents={incidents}
              activeMission={activeMission}
              onReportSubmitted={onDataChanged}
            />
          )}

          {activeTab === 'MORE' && (
            <ResponderMore
              shelters={shelters}
              resources={resources}
              pendingSyncCount={pendingSyncCount}
              onRefreshData={onDataChanged}
            />
          )}
        </main>

        {/* Mobile Compact Bottom Navigation Bar */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E3E9E5] px-2 py-1.5 flex items-center justify-around shadow-lg safe-area-pb">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center p-1.5 rounded-2xl relative transition min-w-[56px] ${
                  isActive ? 'text-[#16856B] font-extrabold' : 'text-[#66736D] hover:text-[#182522] font-semibold'
                }`}
              >
                <div className={`p-1 rounded-xl transition ${isActive ? 'bg-emerald-50' : ''}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute top-1 right-2 w-4 h-4 rounded-full bg-emerald-600 text-white text-[9px] font-black flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Role Switcher Modal */}
      {isRoleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-[#E3E9E5] shadow-2xl max-w-md w-full p-6 text-[#182522] space-y-4 animate-modal">
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-[#153B32]">
                  Resilia Personas
                </span>
                <h3 className="text-lg font-black text-[#182522] mt-1">Switch Role & Persona</h3>
                <p className="text-xs text-[#66736D] mt-0.5">
                  Select a role to inspect role-specific emergency workflows.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsRoleModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-neutral-100 text-[#66736D]"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 pt-1">
              {[
                {
                  role: 'RESIDENT' as UserRole,
                  title: 'Resident (Citizen / Lola Rosa)',
                  desc: 'Ask Resilia, report problems, request rescue, and track help status.',
                  icon: UserCheck,
                  badge: 'Citizen',
                  color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
                },
                {
                  role: 'RESPONDER' as UserRole,
                  title: 'Emergency Responder (Rescue 161)',
                  desc: 'Accept assignments, navigate field, report observations, complete debriefs.',
                  icon: HardHat,
                  badge: 'Rescue 161',
                  color: 'text-teal-700 bg-teal-50 border-teal-200',
                },
                {
                  role: 'COORDINATOR' as UserRole,
                  title: 'Disaster Coordinator (Command Center)',
                  desc: 'Verify incidents, approve AI mission proposals, dispatch responders.',
                  icon: ShieldCheck,
                  badge: 'CDRRMO Command',
                  color: 'text-amber-800 bg-amber-50 border-amber-200',
                },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = currentUser.role === item.role;
                return (
                  <button
                    key={item.role}
                    type="button"
                    onClick={async () => {
                      await setRole(item.role);
                      setIsRoleModalOpen(false);
                      if (onDataChanged) await onDataChanged();
                    }}
                    className={`w-full p-3.5 rounded-2xl border text-left transition flex items-start gap-3.5 ${
                      isSelected
                        ? 'border-[#16856B] bg-emerald-50/70 ring-2 ring-[#16856B]'
                        : 'border-[#E3E9E5] bg-white hover:bg-[#F5F7F6]'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${item.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-xs text-[#182522]">{item.title}</span>
                        {isSelected && <Check className="w-4 h-4 text-[#16856B] shrink-0" />}
                      </div>
                      <p className="text-[11px] text-[#66736D] mt-0.5 leading-snug">{item.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-[#E3E9E5] flex justify-end">
              <button
                type="button"
                onClick={() => setIsRoleModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#66736D] hover:bg-neutral-100"
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
