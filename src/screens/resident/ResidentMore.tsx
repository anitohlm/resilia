/**
 * Resident "More" Screen
 * Secondary tools, emergency hotlines, go-bag checklists, and offline synchronization center.
 */

import React, { useState } from 'react';
import {
  ChevronRight,
  Wifi,
  WifiOff,
  QrCode,
  Users,
  HeartHandshake,
  Droplets,
  Radio,
} from 'lucide-react';
import {
  AskResiliaIcon,
  EmergencyPhoneIcon,
  GoBagIcon,
  OfflineSyncIcon,
} from '../../components/icons/ResidentIcons';
import { Card, ScreenHeader } from './ui';
import { syncClient } from '../../services/offline/syncClient';
import { GoBagChecklistModal } from '../../components/safety/GoBagChecklistModal';
import { EmergencyHotlinesModal } from '../../components/safety/EmergencyHotlinesModal';
import { EmergencySurvivalBeaconModal } from '../../components/safety/EmergencySurvivalBeaconModal';
import { HouseholdAyudaCardModal } from '../../components/ayuda/HouseholdAyudaCardModal';
import { MissingKinModal } from '../../components/kin/MissingKinModal';
import { BayanihanBoardModal } from '../../components/bayanihan/BayanihanBoardModal';
import { DiseaseOutbreakWatchModal } from '../../components/health/DiseaseOutbreakWatchModal';
import { useAuth } from '../../services/auth/authContext';
import { formatTime } from './residentUtils';
import { Navigate } from './ResidentApp';

interface ResidentMoreProps {
  navigate: Navigate;
  pendingSyncCount: number;
  connectivity: string;
}

export const ResidentMore: React.FC<ResidentMoreProps> = ({
  navigate,
  pendingSyncCount,
  connectivity,
}) => {
  const { setRole } = useAuth();
  const [isHotlinesOpen, setIsHotlinesOpen] = useState(false);
  const [isGoBagOpen, setIsGoBagOpen] = useState(false);
  const [isAyudaCardOpen, setIsAyudaCardOpen] = useState(false);
  const [isMissingKinOpen, setIsMissingKinOpen] = useState(false);
  const [isBayanihanOpen, setIsBayanihanOpen] = useState(false);
  const [isOutbreakOpen, setIsOutbreakOpen] = useState(false);
  const [isBeaconOpen, setIsBeaconOpen] = useState(false);
  const [simulatedOffline, setSimulatedOffline] = useState(() =>
    syncClient.isSimulatingOffline()
  );

  const toggleOfflineSimulation = () => {
    const next = !simulatedOffline;
    setSimulatedOffline(next);
    syncClient.setSimulatedOffline(next);
  };

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <ScreenHeader
        title="More Tools"
        subtitle="Preparedness guides, emergency hotlines, and offline settings"
        onBack={() => navigate('HOME')}
      />

      {/* Emergency Preparedness Section */}
      <section aria-labelledby="prep-heading" className="space-y-2">
        <h2 id="prep-heading" className="text-xs font-bold text-rs-muted uppercase tracking-wider px-1">
          Safety & Preparedness
        </h2>

        <Card className="divide-y divide-rs-border/60 overflow-hidden">
          <button
            type="button"
            onClick={() => navigate('ASK_RESILIA')}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-rs-bg/70 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-full bg-rs-tint text-rs-primary flex items-center justify-center">
                <AskResiliaIcon className="w-5 h-5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-semibold text-rs-text">
                    Ask Resilia Assistant
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-rs-tint text-rs-primary-dark text-[11px] font-bold">
                    AI & Local Records
                  </span>
                </div>
                <span className="text-xs text-rs-muted block mt-0.5">
                  Emergency guidance, shelter inquiries, drinking water, and safety instructions
                </span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-rs-muted" />
          </button>

          <button
            type="button"
            onClick={() => setIsHotlinesOpen(true)}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-rs-bg/70 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-full bg-rose-50 text-rs-critical flex items-center justify-center">
                <EmergencyPhoneIcon className="w-5 h-5" />
              </span>
              <div>
                <span className="text-base font-semibold text-rs-text block">
                  Emergency Hotlines (Marikina 161)
                </span>
                <span className="text-xs text-rs-muted block">
                  Direct phone numbers for Rescue, PNP, BFP, and Red Cross
                </span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-rs-muted" />
          </button>

          <button
            type="button"
            onClick={() => setIsGoBagOpen(true)}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-rs-bg/70 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-full bg-amber-50 text-rs-warning flex items-center justify-center">
                <GoBagIcon className="w-5 h-5" />
              </span>
              <div>
                <span className="text-base font-semibold text-rs-text block">
                  Go-Bag 72-Hour Survival Checklist
                </span>
                <span className="text-xs text-rs-muted block">
                  NDRRMC standard survival kit items and packing checklist
                </span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-rs-muted" />
          </button>
        </Card>
      </section>

      {/* Community Relief & Resilience Section */}
      <section aria-labelledby="relief-heading" className="space-y-2">
        <h2 id="relief-heading" className="text-xs font-bold text-rs-muted uppercase tracking-wider px-1">
          Community Relief & Resilience (Offline-Ready)
        </h2>

        <Card className="divide-y divide-rs-border/60 overflow-hidden">
          <button
            type="button"
            onClick={() => setIsAyudaCardOpen(true)}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-rs-bg/70 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <QrCode className="w-5 h-5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-semibold text-rs-text">
                    Household Ayuda Relief Pass
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    Official QR & Barcode
                  </span>
                </div>
                <span className="text-xs text-rs-muted block mt-0.5">
                  Digital ration claim card, family composition, and distribution history
                </span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-rs-muted" />
          </button>

          <button
            type="button"
            onClick={() => setIsMissingKinOpen(true)}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-rs-bg/70 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </span>
              <div>
                <span className="text-base font-semibold text-rs-text block">
                  Family Reunification & Missing Kin
                </span>
                <span className="text-xs text-rs-muted block">
                  Search shelter rosters, match separated family members, or register missing kin
                </span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-rs-muted" />
          </button>

          <button
            type="button"
            onClick={() => setIsBayanihanOpen(true)}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-rs-bg/70 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-full bg-purple-50 text-purple-700 flex items-center justify-center">
                <HeartHandshake className="w-5 h-5" />
              </span>
              <div>
                <span className="text-base font-semibold text-rs-text block">
                  Bayanihan Community Mutual Aid
                </span>
                <span className="text-xs text-rs-muted block">
                  Share generator power, emergency tools, transport, or offer volunteer skills
                </span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-rs-muted" />
          </button>

          <button
            type="button"
            onClick={() => setIsOutbreakOpen(true)}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-rs-bg/70 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center">
                <Droplets className="w-5 h-5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-semibold text-rs-text">
                    Water Safety & Disease Outbreak Watch
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                    DOH Advisory
                  </span>
                </div>
                <span className="text-xs text-rs-muted block mt-0.5">
                  72-hour Leptospirosis tracker, water chlorination table, and symptom checker
                </span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-rs-muted" />
          </button>

          <button
            type="button"
            onClick={() => setIsBeaconOpen(true)}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-rs-bg/70 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
                <Radio className="w-5 h-5 animate-pulse" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-semibold text-rs-text">
                    Emergency Survival Beacon ("Find Me" Mode)
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold">
                    Acoustic & Strobe
                  </span>
                </div>
                <span className="text-xs text-rs-muted block mt-0.5">
                  High-intensity optical screen strobe & Web Audio Morse SOS horn for trapped residents
                </span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-rs-muted" />
          </button>
        </Card>
      </section>

      {/* Offline Storage & Sync Controls */}
      <section aria-labelledby="sync-heading" className="space-y-2">
        <h2 id="sync-heading" className="text-xs font-bold text-rs-muted uppercase tracking-wider px-1">
          Offline Storage & Connectivity
        </h2>

        <Card className="divide-y divide-rs-border/60 overflow-hidden">
          <button
            type="button"
            onClick={() => navigate('SYNC_CENTER')}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-rs-bg/70 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-full bg-rs-tint text-rs-primary flex items-center justify-center">
                <OfflineSyncIcon className="w-5 h-5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-semibold text-rs-text">
                    Offline Sync Center
                  </span>
                  {pendingSyncCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-rs-warning text-white text-[11px] font-bold">
                      {pendingSyncCount} pending
                    </span>
                  )}
                </div>
                <span className="text-xs text-rs-muted block mt-0.5">
                  Check offline connection status and sync saved reports
                </span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-rs-muted" />
          </button>

          {/* Test Offline Simulation Toggle */}
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  simulatedOffline ? 'bg-rs-forest text-white' : 'bg-rs-bg text-rs-muted'
                }`}
              >
                {simulatedOffline ? <WifiOff className="w-5 h-5" /> : <Wifi className="w-5 h-5" />}
              </span>
              <div>
                <span className="text-sm font-semibold text-rs-text block">
                  Simulate Offline Network
                </span>
                <span className="text-xs text-rs-muted block">
                  Test how Resilia safely saves reports without internet connection
                </span>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={simulatedOffline}
              onClick={toggleOfflineSimulation}
              className={`w-12 h-7 rounded-full p-1 transition-colors ${
                simulatedOffline ? 'bg-rs-primary' : 'bg-rs-border'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  simulatedOffline ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </Card>
      </section>

      {/* Demo Persona Switcher (For Evaluation & Testing) */}
      <section aria-labelledby="role-switcher-heading" className="space-y-2">
        <h2 id="role-switcher-heading" className="text-xs font-bold text-rs-muted uppercase tracking-wider px-1">
          Demo Persona Switcher
        </h2>
        <Card className="p-4 space-y-3">
          <p className="text-xs text-rs-muted">
            Currently viewing as <span className="font-bold text-rs-text">Resident (Citizen)</span>. Switch roles to inspect Responder or Coordinator views:
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setRole('RESPONDER')}
              className="p-3 rounded-xl border border-rs-border hover:bg-rs-bg text-left transition-colors"
            >
              <span className="text-xs font-bold text-teal-800 block">Rescue 161 Responder</span>
              <span className="text-[11px] text-rs-muted block mt-0.5">Field missions & dispatches</span>
            </button>
            <button
              type="button"
              onClick={() => setRole('COORDINATOR')}
              className="p-3 rounded-xl border border-rs-border hover:bg-rs-bg text-left transition-colors"
            >
              <span className="text-xs font-bold text-amber-800 block">Disaster Coordinator</span>
              <span className="text-[11px] text-rs-muted block mt-0.5">Incident command & triage</span>
            </button>
          </div>
        </Card>
      </section>

      {/* About Resilia */}
      <section className="text-center pt-4 space-y-1 text-xs text-rs-muted">
        <p className="font-bold text-rs-text">Resilia Philippine Community Edition</p>
        <p>Tagline: "Community disaster coordination platform."</p>
        <p>Network-Resilient AI & Local Storage Prototype • Marikina Valley Cluster</p>
      </section>

      {/* Modals */}
      <EmergencyHotlinesModal
        isOpen={isHotlinesOpen}
        onClose={() => setIsHotlinesOpen(false)}
      />
      <GoBagChecklistModal
        isOpen={isGoBagOpen}
        onClose={() => setIsGoBagOpen(false)}
      />
      <HouseholdAyudaCardModal
        isOpen={isAyudaCardOpen}
        onClose={() => setIsAyudaCardOpen(false)}
      />
      <MissingKinModal
        isOpen={isMissingKinOpen}
        onClose={() => setIsMissingKinOpen(false)}
      />
      <BayanihanBoardModal
        isOpen={isBayanihanOpen}
        onClose={() => setIsBayanihanOpen(false)}
      />
      <DiseaseOutbreakWatchModal
        isOpen={isOutbreakOpen}
        onClose={() => setIsOutbreakOpen(false)}
      />
      <EmergencySurvivalBeaconModal
        isOpen={isBeaconOpen}
        onClose={() => setIsBeaconOpen(false)}
      />
    </div>
  );
};
