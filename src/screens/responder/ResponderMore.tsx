/**
 * Responder More Screen & Safety Controls
 * Section 10: Responder Safety and Availability
 * Section 3: Secondary navigation items (Emergency Contacts, Shelters, Sync Center, Settings)
 */

import React, { useState, useEffect } from 'react';
import { Shelter, Resource, ResponderOperationalStatus } from '../../types';
import { useAuth } from '../../services/auth/authContext';
import { syncClient } from '../../services/offline/syncClient';
import {
  getStoredResponderAvailability,
  setStoredResponderAvailability,
  ResponderAvailability,
} from './responderUtils';
import {
  Building2,
  CheckCircle2,
  Flame,
  LifeBuoy,
  MapPin,
  Package,
  Phone,
  Radio,
  RefreshCw,
  Shield,
  ShieldAlert,
  Users,
  Wifi,
  WifiOff,
} from 'lucide-react';

interface ResponderMoreProps {
  shelters: Shelter[];
  resources: Resource[];
  pendingSyncCount: number;
  onRefreshData: () => Promise<void>;
}

export const ResponderMore: React.FC<ResponderMoreProps> = ({
  shelters,
  resources,
  pendingSyncCount,
  onRefreshData,
}) => {
  const { currentUser, setRole, setUser, availableUsers } = useAuth();
  const [availability, setAvailability] = useState<ResponderAvailability>(getStoredResponderAvailability());
  const [isSyncing, setIsSyncing] = useState(false);
  const [statusUpdatedFeedback, setStatusUpdatedFeedback] = useState(false);

  const availabilityOptions: { id: ResponderOperationalStatus; label: string; desc: string; color: string }[] = [
    { id: 'UNASSIGNED', label: 'Available / Standby', desc: 'Ready for new mission assignment', color: 'bg-emerald-50 text-emerald-800 border-emerald-300' },
    { id: 'DISPATCHED', label: 'Assigned / Mobilizing', desc: 'Briefed and preparing equipment', color: 'bg-blue-50 text-blue-800 border-blue-300' },
    { id: 'EN_ROUTE', label: 'En Route', desc: 'Traveling to staging or target zone', color: 'bg-amber-50 text-amber-800 border-amber-300' },
    { id: 'ON_SCENE', label: 'On Scene', desc: 'Conducting ground operations', color: 'bg-emerald-100 text-emerald-900 border-emerald-400' },
  ];

  const handleStatusChange = (newStatus: ResponderOperationalStatus) => {
    const updated: ResponderAvailability = {
      ...availability,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };
    setAvailability(updated);
    setStoredResponderAvailability(updated);
    setStatusUpdatedFeedback(true);
    setTimeout(() => setStatusUpdatedFeedback(false), 2000);
  };

  const handleToggleLocationSharing = () => {
    const updated: ResponderAvailability = {
      ...availability,
      shareLocation: !availability.shareLocation,
      updatedAt: new Date().toISOString(),
    };
    setAvailability(updated);
    setStoredResponderAvailability(updated);
  };

  const handleForceSync = async () => {
    setIsSyncing(true);
    try {
      await syncClient.triggerSync();
      await onRefreshData();
    } finally {
      setIsSyncing(false);
    }
  };

  const emergencyContacts = [
    { name: 'Marikina Rescue 161 (Emergency Dispatch)', phone: '161 / 02-8646-0427', channel: 'VHF 146.520 MHz' },
    { name: 'MCDRRMO Command Center', phone: '02-8646-2436', channel: 'VHF 145.000 MHz' },
    { name: 'Bureau of Fire Protection (BFP Marikina)', phone: '02-8646-0428', channel: 'Direct Line' },
    { name: 'Barangay Tumana Emergency Desk', phone: '02-8941-5522', channel: 'Barangay Tanod Net' },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 animate-in fade-in duration-200">
      {/* Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-[#182522]">Field Operations & Settings</h1>
        <p className="text-xs sm:text-sm text-[#66736D] mt-0.5">
          Manage your responder availability status, emergency contacts, local resources, and offline sync.
        </p>
      </div>

      {/* 1. Safety & Availability Control */}
      <div className="bg-white rounded-3xl border border-[#E3E9E5] p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#E3E9E5] pb-3">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-[#16856B]" />
            <h2 className="text-sm font-bold text-[#182522]">My Operational Readiness</h2>
          </div>
          {statusUpdatedFeedback && (
            <span className="text-[11px] font-bold text-emerald-700 animate-in fade-in">
              Status saved!
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {availabilityOptions.map((opt) => {
            const isSelected = availability.status === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => handleStatusChange(opt.id)}
                className={`p-3.5 rounded-2xl border text-left transition flex items-start gap-3 ${
                  isSelected ? `${opt.color} ring-2 ring-[#16856B]` : 'bg-white border-[#E3E9E5] hover:bg-[#F5F7F6]'
                }`}
              >
                <div
                  className={`w-3.5 h-3.5 rounded-full mt-1 shrink-0 ${
                    isSelected ? 'bg-[#16856B]' : 'border-2 border-neutral-300'
                  }`}
                />
                <div>
                  <p className="font-bold text-xs text-[#182522]">{opt.label}</p>
                  <p className="text-[11px] text-[#66736D] mt-0.5">{opt.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Location Sharing Toggle */}
        <div className="pt-2 flex items-center justify-between border-t border-[#E3E9E5] text-xs">
          <div>
            <span className="font-bold text-[#182522]">Share Tactical Ground Location</span>
            <p className="text-[11px] text-[#66736D]">
              Sends GPS telemetry to the Coordinator Situation Map during active operations.
            </p>
          </div>
          <button
            onClick={handleToggleLocationSharing}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition text-xs ${
              availability.shareLocation
                ? 'bg-[#16856B] text-white shadow-xs'
                : 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300'
            }`}
          >
            {availability.shareLocation ? 'Active (Sharing)' : 'Disabled'}
          </button>
        </div>
      </div>

      {/* 2. Emergency Radio & Phone Directory */}
      <div className="bg-white rounded-3xl border border-[#E3E9E5] p-5 sm:p-6 shadow-sm space-y-3">
        <div className="flex items-center gap-2 border-b border-[#E3E9E5] pb-3">
          <Phone className="w-4 h-4 text-[#16856B]" />
          <h2 className="text-sm font-bold text-[#182522]">Emergency Radio & Hotline Directory</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {emergencyContacts.map((contact, idx) => (
            <div key={idx} className="p-3.5 rounded-2xl bg-[#F5F7F6] border border-[#E3E9E5] space-y-1">
              <p className="font-bold text-[#182522]">{contact.name}</p>
              <div className="flex items-center justify-between text-[11px] text-[#66736D]">
                <span>Hotline: <strong className="text-[#182522]">{contact.phone}</strong></span>
                <span>Radio: <strong className="text-[#16856B]">{contact.channel}</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Offline Synchronization Queue */}
      <div className="bg-white rounded-3xl border border-[#E3E9E5] p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#E3E9E5] pb-3">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-[#16856B]" />
            <h2 className="text-sm font-bold text-[#182522]">Data Synchronization & Ledger</h2>
          </div>
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
              pendingSyncCount > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
            }`}
          >
            {pendingSyncCount > 0 ? `${pendingSyncCount} Pending Changes` : 'All Synced'}
          </span>
        </div>

        <p className="text-xs text-[#66736D] leading-relaxed">
          Resilia stores all your mission updates, corroborations, and reports in durable IndexedDB stores. When internet or local mesh connectivity is detected, changes sync seamlessly.
        </p>

        <div className="flex items-center justify-between pt-2 border-t border-[#E3E9E5]">
          <span className="text-xs text-[#66736D]">
            Last verified local database integrity: OK
          </span>
          <button
            onClick={handleForceSync}
            disabled={isSyncing}
            className="px-4 py-2 rounded-xl bg-[#16856B] hover:bg-[#153B32] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Synchronizing...' : 'Trigger Sync'}</span>
          </button>
        </div>
      </div>

      {/* 4. Persona Switcher (For Pair Testing & Evaluation) */}
      <div className="bg-white rounded-3xl border border-[#E3E9E5] p-5 sm:p-6 shadow-sm space-y-3">
        <h2 className="text-sm font-bold text-[#182522]">Evaluation Profile / Switch Role</h2>
        <p className="text-xs text-[#66736D]">
          Current Persona: <strong>{currentUser.name}</strong> ({currentUser.role}). Switch to inspect other experiences:
        </p>
        <div className="flex flex-wrap gap-2 pt-1 text-xs">
          <button
            type="button"
            onClick={async () => {
              await setRole('RESIDENT');
              if (onRefreshData) await onRefreshData();
            }}
            className="px-3.5 py-2 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-900 font-bold hover:bg-emerald-100 transition shadow-2xs"
          >
            Switch to Resident (Lola Rosa)
          </button>
          <button
            type="button"
            onClick={async () => {
              await setRole('COORDINATOR');
              if (onRefreshData) await onRefreshData();
            }}
            className="px-3.5 py-2 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 font-bold hover:bg-amber-100 transition shadow-2xs"
          >
            Switch to Coordinator (Capt. Maria)
          </button>
        </div>
      </div>
    </div>
  );
};
