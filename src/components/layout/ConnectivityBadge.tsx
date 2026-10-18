/**
 * Resilia Connectivity & Real-Time Sync Indicator
 * Displays CONNECTED when internet is available, OFFLINE when disconnected,
 * with a distinct, separate Sync icon beside the status that turns around (animate-spin)
 * whenever syncing is occurring in the application.
 */

import React from 'react';
import { RotateCw, Wifi, WifiOff } from 'lucide-react';
import { useSyncState } from './useSyncState';

export interface ConnectivityBadgeProps {
  variant?: 'dark' | 'resident' | 'responder';
  showTestOfflineToggle?: boolean;
}

export const ConnectivityBadge: React.FC<ConnectivityBadgeProps> = ({
  variant = 'dark',
  showTestOfflineToggle = true,
}) => {
  const {
    isConnected,
    isSyncing,
    isSimulatedOffline,
    pendingCount,
    triggerSync,
    toggleSimulatedOffline,
  } = useSyncState();

  // Resident portal styling
  if (variant === 'resident') {
    return (
      <div className="flex items-center gap-1.5">
        {/* Internet Status Pill */}
        <div
          role="status"
          className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-xs font-bold tracking-wide transition border shadow-xs ${
            isConnected
              ? 'bg-rs-tint text-rs-primary-dark border-rs-primary/20'
              : 'bg-rs-bg text-rs-text border-rs-border'
          }`}
          title={
            isConnected
              ? 'Internet: CONNECTED • Local & Cloud synchronized'
              : 'Internet: OFFLINE • Local database active'
          }
        >
          {isConnected ? (
            <Wifi className="w-3.5 h-3.5 text-rs-primary shrink-0" aria-hidden="true" />
          ) : (
            <WifiOff className="w-3.5 h-3.5 text-neutral-500 shrink-0" aria-hidden="true" />
          )}
          <span>{isConnected ? 'CONNECTED' : 'OFFLINE'}</span>
        </div>

        {/* Separate Sync Icon Button */}
        <button
          type="button"
          onClick={triggerSync}
          className={`relative w-9 h-9 rounded-full border transition-all flex items-center justify-center cursor-pointer shadow-xs ${
            isSyncing
              ? 'bg-rs-tint text-rs-primary border-rs-primary/40 ring-2 ring-rs-primary/20'
              : 'bg-rs-card border-rs-border text-rs-text hover:bg-rs-bg hover:text-rs-primary'
          }`}
          title={
            isSyncing
              ? 'Syncing data with cloud...'
              : isConnected
              ? 'Sync: Connected • Click to sync data now'
              : 'Sync: Offline • Click to retry connection'
          }
          aria-label={isSyncing ? 'Syncing data' : 'Trigger sync'}
        >
          <RotateCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-rs-primary' : ''}`} />
          {pendingCount > 0 && !isSyncing && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-500" />
          )}
        </button>
      </div>
    );
  }

  // Responder portal styling
  if (variant === 'responder') {
    return (
      <div className="flex items-center gap-1.5">
        {/* Internet Status Pill */}
        <div
          role="status"
          className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1.5 border uppercase tracking-wider transition shadow-xs ${
            isConnected
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-amber-50 text-amber-800 border-amber-200'
          }`}
          title={
            isConnected
              ? 'Internet: CONNECTED • Field dispatches synchronized'
              : 'Internet: OFFLINE • Operating from local device store'
          }
        >
          {isConnected ? (
            <>
              <Wifi className="w-3 h-3 text-emerald-600" />
              <span>CONNECTED</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3 h-3 text-amber-700" />
              <span>OFFLINE</span>
            </>
          )}
        </div>

        {/* Separate Sync Icon Button */}
        <button
          type="button"
          onClick={triggerSync}
          className={`relative p-1.5 rounded-full border transition flex items-center justify-center cursor-pointer shadow-xs ${
            isSyncing
              ? 'bg-emerald-50 border-emerald-300 text-emerald-700 ring-2 ring-emerald-500/20'
              : 'bg-white border-[#E3E9E5] text-[#66736D] hover:text-[#182522] hover:bg-[#F5F7F6]'
          }`}
          title={
            isSyncing
              ? 'Syncing field operations with Command Center...'
              : isConnected
              ? 'Sync: Connected • Click to sync operations now'
              : 'Sync: Offline • Click to retry connection'
          }
          aria-label={isSyncing ? 'Syncing field operations' : 'Trigger sync'}
        >
          <RotateCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-600' : ''}`} />
          {pendingCount > 0 && !isSyncing && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-500" />
          )}
        </button>
      </div>
    );
  }

  // Default 'dark' theme for Header.tsx (Disaster Coordinator Command Center & Fallback)
  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      {/* Internet Status Pill */}
      <div
        role="status"
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold tracking-wide transition shadow-xs ${
          isConnected
            ? 'bg-emerald-950/80 border-emerald-600/60 text-emerald-300'
            : 'bg-neutral-900 border-neutral-700 text-neutral-300'
        }`}
        title={
          isConnected
            ? 'Internet: CONNECTED • Real-time cloud sync active'
            : 'Internet: OFFLINE • Local IndexedDB active'
        }
      >
        <span
          className={`w-2 h-2 rounded-full shrink-0 ${
            isConnected
              ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]'
              : 'bg-amber-400'
          }`}
        />
        <span className="text-[11px] font-bold tracking-wider">
          {isConnected ? 'CONNECTED' : 'OFFLINE'}
        </span>
      </div>

      {/* Separate Sync Icon Button */}
      <button
        type="button"
        onClick={triggerSync}
        className={`relative p-1.5 rounded-lg border transition flex items-center justify-center cursor-pointer shadow-xs ${
          isSyncing
            ? 'bg-emerald-950/90 border-emerald-500/70 text-emerald-400 ring-2 ring-emerald-500/20'
            : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-emerald-300 hover:bg-neutral-850 hover:border-neutral-700'
        }`}
        title={
          isSyncing
            ? 'Syncing data with cloud...'
            : isConnected
            ? 'Sync: Connected • Click to sync data now'
            : 'Sync: Offline • Click to retry connection'
        }
        aria-label={isSyncing ? 'Syncing data' : 'Trigger sync'}
      >
        <RotateCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-400' : ''}`} />
        {pendingCount > 0 && !isSyncing && (
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-500" />
        )}
      </button>

      {/* Manual Offline Test Toggle */}
      {showTestOfflineToggle && (
        <button
          type="button"
          onClick={toggleSimulatedOffline}
          className={`px-2 py-1 text-[11px] rounded-lg border transition font-medium flex items-center gap-1.5 cursor-pointer shadow-xs ${
            isSimulatedOffline
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
              : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-neutral-200'
          }`}
          title="Simulate complete internet disconnection to test local IndexedDB persistence"
        >
          {isSimulatedOffline ? <WifiOff className="w-3 h-3 text-amber-400" /> : <Wifi className="w-3 h-3" />}
          <span className="hidden xl:inline">
            {isSimulatedOffline ? 'Simulating Offline' : 'Test Offline'}
          </span>
        </button>
      )}
    </div>
  );
};
