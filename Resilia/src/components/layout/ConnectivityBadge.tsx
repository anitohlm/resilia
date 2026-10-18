/**
 * Resilia Connectivity & Real-Time Sync Indicator
 * Strictly distinguishes browser online flag from backend API reachability
 * and local offline capability.
 */

import React, { useEffect, useState } from 'react';
import { syncClient } from '../../services/offline/syncClient';
import { ConnectivityStatus } from '../../types';
import { Cloud, CloudOff, RefreshCw, Wifi, WifiOff } from 'lucide-react';

export const ConnectivityBadge: React.FC = () => {
  const [status, setStatus] = useState<ConnectivityStatus>(syncClient.getStatus());
  const [isSimulatedOffline, setIsSimulatedOffline] = useState(syncClient.isSimulatingOffline());

  useEffect(() => {
    const unsubscribe = syncClient.subscribe((newStatus) => {
      setStatus(newStatus);
    });
    return () => unsubscribe();
  }, []);

  const toggleSimulatedOffline = () => {
    const next = !isSimulatedOffline;
    setIsSimulatedOffline(next);
    syncClient.setSimulatedOffline(next);
  };

  const getBadgeConfig = () => {
    switch (status) {
      case 'ONLINE':
        return {
          bg: 'bg-emerald-950/80 border-emerald-700 text-emerald-300',
          dot: 'bg-emerald-400',
          label: 'ONLINE',
          sub: 'Cloud Connected',
          icon: Wifi,
        };
      case 'SYNCING':
        return {
          bg: 'bg-cyan-950/80 border-cyan-700 text-cyan-300',
          dot: 'bg-cyan-400 animate-spin',
          label: 'SYNCING',
          sub: 'Syncing Local Queue',
          icon: RefreshCw,
        };
      case 'DEGRADED':
        return {
          bg: 'bg-amber-950/80 border-amber-700 text-amber-300',
          dot: 'bg-amber-400',
          label: 'DEGRADED',
          sub: 'Intermittent Network',
          icon: CloudOff,
        };
      case 'SYNC_ERROR':
        return {
          bg: 'bg-rose-950/80 border-rose-700 text-rose-300',
          dot: 'bg-rose-400',
          label: 'SYNC ERROR',
          sub: 'Retry Safe Queue',
          icon: CloudOff,
        };
      case 'OFFLINE':
      default:
        return {
          bg: 'bg-neutral-800/90 border-neutral-600 text-neutral-300',
          dot: 'bg-neutral-400',
          label: 'OFFLINE',
          sub: 'Local Database Active',
          icon: WifiOff,
        };
    }
  };

  const config = getBadgeConfig();
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-2">
      {/* Real Status Indicator */}
      <div
        className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-neutral-300"
        title={`Status: ${config.label}. Local database operational.`}
      >
        <span className={`w-2 h-2 rounded-full ${config.dot}`} />
        <span className="font-semibold text-[11px] tracking-wide">{config.label}</span>
      </div>

      {/* Manual Offline Test Toggle */}
      <button
        onClick={toggleSimulatedOffline}
        className={`px-2 py-1 text-[11px] rounded-lg border transition font-medium flex items-center gap-1.5 ${
          isSimulatedOffline
            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
            : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-neutral-200'
        }`}
        title="Simulate complete internet disconnection to test local IndexedDB persistence"
      >
        {isSimulatedOffline ? <WifiOff className="w-3 h-3 text-amber-400" /> : <Wifi className="w-3 h-3" />}
        <span className="hidden xl:inline">{isSimulatedOffline ? 'Simulating Offline' : 'Test Offline'}</span>
      </button>
    </div>
  );
};
