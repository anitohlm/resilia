/**
 * Resilia Unified Executive Command Header
 * Consolidates Brand, Upper Role Switcher Dropdown, RBAC Guide, Connectivity, and Auth
 * into a single clean, uncluttered navigation header.
 */

import React, { useState, useRef, useEffect } from 'react';
import { ConnectivityBadge } from './ConnectivityBadge';
import { PWAInstallButton } from './PWAInstallButton';
import {
  Check,
  ChevronDown,
  HardHat,
  KeyRound,
  LogIn,
  Moon,
  Presentation,
  RotateCcw,
  Shield,
  ShieldCheck,
  Sun,
  User,
  UserCheck,
} from 'lucide-react';
import { seedDemoData } from '../../demo/seedData';
import { AuthModal } from '../auth/AuthModal';
import { RbacMatrixModal } from '../auth/RbacMatrixModal';
import { useAuth } from '../../services/auth/authContext';
import { UserRole } from '../../types';

interface HeaderProps {
  onResetDemo?: () => void;
}

const ROLES_CONFIG: {
  role: UserRole;
  label: string;
  shortLabel: string;
  badge: string;
  description: string;
  icon: any;
  colorClass: string;
  activeBg: string;
  textClass: string;
}[] = [
  {
    role: 'RESIDENT',
    label: 'Resident (Citizen / Komunidad)',
    shortLabel: 'Resident',
    badge: 'Citizen',
    description: 'Report hazards, family check-in & request emergency assistance',
    icon: UserCheck,
    colorClass: 'text-emerald-400',
    activeBg: 'bg-emerald-500/10 border-emerald-500/40',
    textClass: 'text-emerald-300',
  },
  {
    role: 'RESPONDER',
    label: 'Emergency Responder (Rescue 161)',
    shortLabel: 'Responder',
    badge: 'Rescue 161',
    description: 'Field dispatches, transit updates & hazard resolution',
    icon: HardHat,
    colorClass: 'text-teal-400',
    activeBg: 'bg-teal-500/10 border-teal-500/40',
    textClass: 'text-teal-300',
  },
  {
    role: 'COORDINATOR',
    label: 'Disaster Coordinator (Incident Command)',
    shortLabel: 'Coordinator',
    badge: 'CDRRMO Command',
    description: 'Verify field hazards, assign teams, broadcast alerts & manage shelters',
    icon: ShieldCheck,
    colorClass: 'text-amber-400',
    activeBg: 'bg-amber-500/10 border-amber-500/40',
    textClass: 'text-amber-300',
  },
];

export const Header: React.FC<HeaderProps> = ({ onResetDemo }) => {
  const { currentUser, setRole, isFirebaseAuthenticated } = useAuth();
  const [isResetting, setIsResetting] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isRbacModalOpen, setIsRbacModalOpen] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isTacticalOled, setIsTacticalOled] = useState(() => {
    return typeof window !== 'undefined' && localStorage.getItem('resilia_tactical_oled') === 'true';
  });

  useEffect(() => {
    if (isTacticalOled) {
      document.documentElement.classList.add('tactical-oled');
    } else {
      document.documentElement.classList.remove('tactical-oled');
    }
  }, [isTacticalOled]);

  const toggleTacticalOled = () => {
    setIsTacticalOled((prev) => {
      const next = !prev;
      localStorage.setItem('resilia_tactical_oled', String(next));
      return next;
    });
  };

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsRoleDropdownOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsRoleDropdownOpen(false);
      }
    };

    if (isRoleDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isRoleDropdownOpen]);

  const executeReset = async () => {
    setIsResetting(true);
    setShowResetConfirm(false);
    await seedDemoData(true);
    if (onResetDemo) onResetDemo();
    window.location.reload();
  };

  const currentRoleConfig =
    ROLES_CONFIG.find((r) => r.role === currentUser.role) || ROLES_CONFIG[0];
  const CurrentIcon = currentRoleConfig.icon;

  const handleSelectRole = (r: UserRole) => {
    setRole(r);
    setIsRoleDropdownOpen(false);
  };

  return (
    <>
      <header className="bg-neutral-950 text-white border-b border-neutral-800/80 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-3">
          {/* 1. Brand Identity */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center shadow-xs">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm sm:text-base font-bold tracking-tight text-white">RESILIA</span>
                <span className="text-[10px] text-neutral-400 hidden sm:inline">· Disaster Response</span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-neutral-400 leading-tight hidden xs:block">
                Marikina Resilience Cluster
              </p>
            </div>
          </div>

          {/* 2. Upper Roles Dropdown Selector */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsRoleDropdownOpen((prev) => !prev)}
              aria-haspopup="listbox"
              aria-expanded={isRoleDropdownOpen}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all text-xs font-medium cursor-pointer shadow-xs ${
                isRoleDropdownOpen
                  ? 'bg-neutral-800 border-neutral-600 text-white ring-2 ring-emerald-500/30'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-200 hover:bg-neutral-850 hover:border-neutral-700'
              }`}
              title="Click to switch between Resident, Responder, and Coordinator roles"
            >
              <div className="flex items-center gap-1.5">
                <CurrentIcon className={`w-3.5 h-3.5 shrink-0 ${currentRoleConfig.colorClass}`} />
                <span className="text-neutral-400 text-[11px] hidden md:inline">Role:</span>
                <span className="font-semibold text-white">
                  <span className="md:hidden">{currentRoleConfig.shortLabel}</span>
                  <span className="hidden md:inline">{currentRoleConfig.label.split('(')[0].trim()}</span>
                </span>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border border-white/10 hidden sm:inline ${
                  currentUser.role === 'RESIDENT'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : currentUser.role === 'RESPONDER'
                    ? 'bg-teal-500/20 text-teal-300'
                    : 'bg-amber-500/20 text-amber-300'
                }`}>
                  {currentRoleConfig.badge}
                </span>
              </div>

              <ChevronDown
                className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 ${
                  isRoleDropdownOpen ? 'rotate-180 text-white' : ''
                }`}
              />
            </button>

            {/* Dropdown Menu Panel */}
            {isRoleDropdownOpen && (
              <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:right-0 z-50 w-72 sm:w-80 bg-neutral-900 border border-neutral-700/80 rounded-xl shadow-2xl p-2 animate-dropdown">
                <div className="px-3 py-2 border-b border-neutral-800">
                  <span className="text-[11px] font-bold text-neutral-200 uppercase tracking-wider block">
                    Switch Active Role & Persona
                  </span>
                  <span className="text-[10px] text-neutral-400 block mt-0.5">
                    Select a role to test role-specific emergency workflows
                  </span>
                </div>

                <div className="py-1 space-y-1" role="listbox">
                  {ROLES_CONFIG.map((item) => {
                    const Icon = item.icon;
                    const isSelected = currentUser.role === item.role;
                    return (
                      <button
                        key={item.role}
                        onClick={() => handleSelectRole(item.role)}
                        role="option"
                        aria-selected={isSelected}
                        className={`w-full text-left p-2.5 rounded-xl transition flex items-start gap-3 cursor-pointer ${
                          isSelected
                            ? `${item.activeBg} border`
                            : 'hover:bg-neutral-800 text-neutral-300 hover:text-white border border-transparent'
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                            isSelected
                              ? 'bg-neutral-800'
                              : 'bg-neutral-950 text-neutral-400'
                          }`}
                        >
                          <Icon className={`w-4 h-4 ${item.colorClass}`} />
                        </div>

                        <div className="flex-1 overflow-hidden">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-bold text-white truncate">
                              {item.label}
                            </span>
                            {isSelected && (
                              <Check className={`w-3.5 h-3.5 shrink-0 ${item.colorClass}`} />
                            )}
                          </div>
                          <p className="text-[10px] text-neutral-400 leading-tight mt-0.5 line-clamp-2">
                            {item.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="pt-1.5 mt-1 border-t border-neutral-800 flex items-center justify-between px-2">
                  <button
                    onClick={() => {
                      setIsRoleDropdownOpen(false);
                      setIsRbacModalOpen(true);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-neutral-400 hover:text-amber-300 hover:bg-neutral-800/80 transition text-[11px] font-medium flex items-center justify-between"
                  >
                    <span className="flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                      <span>View RBAC Matrix Guide</span>
                    </span>
                    <span className="text-[10px] text-neutral-500 font-mono">Permissions →</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 3. Action & Status Group */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <ConnectivityBadge />
            <PWAInstallButton />

            {/* Competition Pitch Deck */}
            <a
              href="/presentation.html"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-600/60 text-emerald-300 transition shadow-xs"
              title="Open Competition Pitch Deck & Vision Proposal (16:9 Slides)"
            >
              <Presentation className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Pitch Deck</span>
            </a>

            {/* Account / User info */}
            <button
              onClick={() => setIsAuthOpen(true)}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg transition border ${
                isFirebaseAuthenticated
                  ? 'bg-emerald-950 border-emerald-700 text-emerald-300'
                  : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border-neutral-800'
              }`}
              title="Account Settings & Authentication"
            >
              {isFirebaseAuthenticated ? <User className="w-3.5 h-3.5" /> : <LogIn className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">
                {isFirebaseAuthenticated ? currentUser.name.split(' ')[0] : 'Sign In'}
              </span>
            </button>

            {/* Tactical OLED Blackout & Rain High-Contrast Mode Toggle */}
            <button
              onClick={toggleTacticalOled}
              className={`p-1.5 rounded-lg border transition cursor-pointer ${
                isTacticalOled
                  ? 'bg-neutral-800 text-amber-300 border-amber-500/50 shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 border-transparent hover:border-neutral-800'
              }`}
              title={
                isTacticalOled
                  ? 'Tactical OLED Blackout Active — Click for High-Contrast Light Mode'
                  : 'Enable Tactical OLED Blackout & Battery Saver (Ideal for power blackouts & rain glare)'
              }
            >
              {isTacticalOled ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>

            {/* Reset Demo button */}
            <button
              onClick={() => setShowResetConfirm(true)}
              disabled={isResetting}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 border border-transparent hover:border-neutral-800 transition cursor-pointer"
              title="Reset demo scenario to baseline"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Confirmation Modal for Reset (replaces browser confirm) */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-3 shadow-xl border border-neutral-200 text-neutral-900">
            <h3 className="font-bold text-sm text-neutral-900">Reset Demo Scenario?</h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              This resets shelters, simulated river water level, and emergency events back to initial Marikina seed data.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg text-neutral-700 hover:bg-neutral-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={executeReset}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white transition"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      <RbacMatrixModal
        isOpen={isRbacModalOpen}
        onClose={() => setIsRbacModalOpen(false)}
        onSelectRole={(r) => setRole(r)}
      />
    </>
  );
};
