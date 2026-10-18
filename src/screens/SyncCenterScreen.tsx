/**
 * Resilia Screen 10: Sync Center
 * Transparent view of the local pending-event queue, server acknowledgements,
 * conflict resolution tools, retry controls, and bidirectional sync history.
 */

import React, { useEffect, useState } from 'react';
import { syncClient } from '../services/offline/syncClient';
import { EventQueueService } from '../services/offline/eventQueue';
import { ConnectivityStatus, SyncConflict, SyncEvent } from '../types';
import { localDB, STORES } from '../services/offline/db';
import {
  AlertCircle,
  AlertTriangle,
  ArrowDownUp,
  CheckCircle2,
  Clock,
  Database,
  Layers,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useToast } from '../components/common/Toast';
import { useAuth } from '../services/auth/authContext';

export interface SyncCenterScreenProps {
  isResident?: boolean;
}

function getEntityFriendlyLabel(entityType: string): string {
  switch (entityType.toLowerCase()) {
    case 'assistance_request':
    case 'assistance':
      return 'Emergency Assistance Request';
    case 'incident':
    case 'report':
      return 'Community Hazard Report';
    case 'users':
    case 'user':
    case 'safety':
      return 'Safety Status Check-In';
    case 'shelter':
      return 'Shelter Information Update';
    case 'resource':
      return 'Resource Inventory Report';
    case 'alert':
      return 'Emergency Advisory';
    default:
      return 'Offline Report';
  }
}

export const SyncCenterScreen: React.FC<SyncCenterScreenProps> = ({ isResident: propIsResident }) => {
  const { currentUser } = useAuth();
  const isResident = propIsResident ?? (currentUser?.role === 'RESIDENT');
  const { success: toastSuccess, error: toastError, info: toastInfo } = useToast();
  const [connectivity, setConnectivity] = useState<ConnectivityStatus>(syncClient.getStatus());
  const [isSimulatedOffline, setIsSimulatedOffline] = useState(syncClient.isSimulatingOffline());
  const [allEvents, setAllEvents] = useState<SyncEvent[]>([]);
  const [conflicts, setConflicts] = useState<SyncConflict[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(syncClient.getLastSyncTime());

  const loadData = async () => {
    const events = await EventQueueService.getAllEvents();
    const storedConflicts = await localDB.getAll<SyncConflict>(STORES.SYNC_CONFLICTS);
    setAllEvents(events);
    setConflicts(storedConflicts);
    setLastSyncTime(syncClient.getLastSyncTime());
  };

  useEffect(() => {
    loadData();
    const unsub = syncClient.subscribe((status) => {
      setConnectivity(status);
      setIsSimulatedOffline(syncClient.isSimulatingOffline());
    });

    const handleSyncComplete = () => {
      loadData();
    };
    window.addEventListener('resilia_sync_complete', handleSyncComplete);

    return () => {
      unsub();
      window.removeEventListener('resilia_sync_complete', handleSyncComplete);
    };
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      const res = await syncClient.triggerSync();
      await loadData();
      toastSuccess(`Sync completed! ${res.syncedCount} event(s) synced, ${res.conflictCount} conflict(s).`, 'Sync Complete');
    } catch (err: any) {
      toastError(err.message || 'Sync failed', 'Sync Error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRetryFailed = async () => {
    const count = await EventQueueService.retryAllFailed();
    await loadData();
    toastInfo(`Reset ${count} failed events back to PENDING queue.`, 'Retry Queue');
  };

  const handleResolveConflict = async (conflictId: string, choice: 'LOCAL' | 'REMOTE') => {
    const conf = conflicts.find((c) => c.id === conflictId);
    if (!conf) return;

    conf.resolved = true;
    conf.resolutionChoice = choice;
    conf.resolvedAt = new Date().toISOString();
    await localDB.put(STORES.SYNC_CONFLICTS, conf);

    // If chose local, put back into sync queue
    if (choice === 'LOCAL') {
      const evt = allEvents.find((e) => e.event_id === conf.event_id);
      if (evt) {
        evt.sync_status = 'PENDING';
        evt.last_error = undefined;
        await localDB.put(STORES.SYNC_EVENTS, evt);
      }
    }

    await loadData();
    toastSuccess(`Conflict resolved favoring ${choice} state.`, 'Conflict Resolved');
  };

  const pendingCount = allEvents.filter((e) => e.sync_status === 'PENDING').length;
  const syncedCount = allEvents.filter((e) => e.sync_status === 'SYNCED').length;
  const failedCount = allEvents.filter((e) => e.sync_status === 'FAILED').length;
  const unresolvedConflicts = conflicts.filter((c) => !c.resolved);

  if (isResident) {
    // Only show events that belong to resident workflows (assistance requests, hazards, safety check-ins)
    // Filter out internal coordinator/system records (alerts, missions, inventory movements, shelter configs)
    const residentEvents = allEvents.filter((e) => {
      if (currentUser?.id && e.actor_id === currentUser.id) return true;
      return ['assistance_request', 'incident', 'report', 'users', 'safety_checkin'].includes(e.entity_type);
    });

    const pendingResidentEvents = residentEvents.filter((e) => e.sync_status === 'PENDING');
    const failedResidentEvents = residentEvents.filter((e) => e.sync_status === 'FAILED');
    const unsentResidentEvents = residentEvents.filter(
      (e) => e.sync_status === 'PENDING' || e.sync_status === 'FAILED'
    );
    const syncedResidentEvents = residentEvents.filter((e) => e.sync_status === 'SYNCED');
    const totalWaitingToSend = unsentResidentEvents.length;

    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in pb-12">
        {/* Top Banner */}
        <div className="bg-white rounded-3xl border border-neutral-200 p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-600 text-white shadow-sm">
              <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-neutral-900">Offline Storage & Sync Status</h2>
              <p className="text-xs text-neutral-500">
                Your reports and requests are safely saved on this device and delivered when connected.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleManualSync}
              disabled={isSyncing || connectivity === 'OFFLINE'}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-sm min-h-[44px]"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
            </button>

            {failedCount > 0 && (
              <button
                type="button"
                onClick={handleRetryFailed}
                className="px-3 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs border border-amber-300 transition flex items-center gap-1.5 min-h-[44px]"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                <span>Retry Sync ({failedCount})</span>
              </button>
            )}
          </div>
        </div>

        {/* Status Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl bg-white border border-neutral-200 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
              Connection Status
            </span>
            <div className={`text-lg font-black flex items-center gap-1.5 ${connectivity === 'ONLINE' ? 'text-emerald-600' : 'text-amber-500'}`}>
              {connectivity === 'ONLINE' ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              <span>{connectivity === 'ONLINE' ? 'Connected' : 'Offline'}</span>
            </div>
            <p className="text-[11px] text-neutral-500 mt-1">
              {connectivity === 'ONLINE' ? 'Live network' : 'Local storage active'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-neutral-200 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
              Waiting to Send
            </span>
            <div className={`text-3xl font-black ${totalWaitingToSend > 0 ? 'text-amber-500' : 'text-emerald-600'}`}>
              {totalWaitingToSend}
            </div>
            <p className="text-[11px] text-neutral-500 mt-1">
              {totalWaitingToSend === 0
                ? 'All delivered'
                : failedResidentEvents.length > 0
                ? `${failedResidentEvents.length} needs retry • saved on phone`
                : 'Saved on this phone'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-neutral-200 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
              Delivered
            </span>
            <div className="text-3xl font-black text-emerald-600">{syncedResidentEvents.length}</div>
            <p className="text-[11px] text-neutral-500 mt-1">Received by responders</p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-neutral-200 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
              Last Synced
            </span>
            <div className="text-sm font-black text-neutral-800 truncate">
              {lastSyncTime ? new Date(lastSyncTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Not Yet'}
            </div>
            <p className="text-[11px] text-neutral-500 mt-1">
              {lastSyncTime ? new Date(lastSyncTime).toLocaleDateString() : 'Awaiting connection'}
            </p>
          </div>
        </div>

        {/* Offline Guarantee Info Card */}
        <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-2">
          <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs uppercase tracking-wide">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>How Offline Protection Works</span>
          </div>
          <p className="text-xs text-emerald-800 leading-relaxed">
            During power outages or flood conditions, Resilia stores all your assistance requests and damage reports directly in your phone’s durable local memory. As soon as cellular, Wi-Fi, or emergency mesh signal returns, everything synchronizes automatically. You never need to re-submit your reports.
          </p>
        </div>

        {/* Saved Items Summary (Simplified, no raw debug logs, UUIDs, or engine internals) */}
        {unsentResidentEvents.length > 0 ? (
          <div className="bg-white rounded-3xl border border-neutral-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="font-bold text-neutral-900 flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-amber-500" />
                <span>Items Saved on This Phone ({unsentResidentEvents.length})</span>
              </h3>
              <span className="text-amber-700 font-semibold text-xs">Waiting for connection</span>
            </div>

            <div className="divide-y divide-neutral-100">
              {unsentResidentEvents.map((evt) => {
                const isFailed = evt.sync_status === 'FAILED';
                return (
                  <div key={evt.event_id} className="py-3 flex items-center justify-between gap-3 text-xs">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-neutral-900">
                          {getEntityFriendlyLabel(evt.entity_type)}
                        </span>
                        {isFailed ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            Needs Retry
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                            Saved Locally
                          </span>
                        )}
                      </div>
                      <div className="text-neutral-500 text-[11px]">
                        {isFailed
                          ? 'Could not be delivered yet • Tap "Retry Sync" to send'
                          : 'Saved securely on this phone • Ready to upload'}
                      </div>
                    </div>
                    <div className="text-right text-[11px] text-neutral-400">
                      {new Date(evt.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-neutral-200 p-8 shadow-sm text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-neutral-900">All Reports Up to Date</h3>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              All your emergency requests and reports have been safely transmitted to the Marikina Disaster Operations Center.
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl border border-neutral-200 p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-cyan-600 text-white shadow-sm">
            <ArrowDownUp className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-neutral-900">Synchronization & Queue Engine</h2>
            <p className="text-xs text-neutral-500">
              Durable event logs, idempotent acknowledgements, and conflict resolution.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleManualSync}
            disabled={isSyncing || connectivity === 'OFFLINE'}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
          </button>

          {failedCount > 0 && (
            <button
              onClick={handleRetryFailed}
              className="px-3 py-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold text-xs border border-neutral-300 transition flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry Failed ({failedCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-neutral-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
            Pending Uploads
          </span>
          <div className="text-3xl font-black text-amber-500">{pendingCount}</div>
          <p className="text-[11px] text-neutral-500 mt-1">Held in IndexedDB</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-neutral-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
            Server Acknowledged
          </span>
          <div className="text-3xl font-black text-emerald-600">{syncedCount}</div>
          <p className="text-[11px] text-neutral-500 mt-1">Confirmed by cloud</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-neutral-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
            Sync Conflicts
          </span>
          <div className="text-3xl font-black text-rose-600">{unresolvedConflicts.length}</div>
          <p className="text-[11px] text-neutral-500 mt-1">Require coordinator review</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-neutral-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
            Last Successful Sync
          </span>
          <div className="text-sm font-black text-neutral-800 truncate">
            {lastSyncTime ? new Date(lastSyncTime).toLocaleTimeString() : 'Not Yet Synced'}
          </div>
          <p className="text-[11px] text-neutral-500 mt-1">
            {lastSyncTime ? new Date(lastSyncTime).toLocaleDateString() : 'Awaiting Connection'}
          </p>
        </div>
      </div>

      {/* Conflicts Requiring Human Resolution Section (Principle 5 & Section 8) */}
      {unresolvedConflicts.length > 0 && (
        <div className="p-6 rounded-3xl bg-rose-50 border border-rose-200 space-y-4">
          <div className="flex items-center gap-2 text-rose-900 font-extrabold text-sm">
            <ShieldAlert className="w-5 h-5 text-rose-600" />
            <span>Operational State Conflicts Requiring Human Resolution ({unresolvedConflicts.length})</span>
          </div>
          <p className="text-xs text-rose-800">
            Conflicting operational facts (such as shelter occupancy or road passability) cannot be automatically overwritten.
            Review both versions and select which state to accept.
          </p>

          <div className="space-y-3">
            {unresolvedConflicts.map((conf) => (
              <div key={conf.id} className="p-4 rounded-2xl bg-white border border-rose-300 text-xs shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <span className="font-bold text-neutral-900">
                    Conflict on {conf.entity_type.toUpperCase()} (ID: {conf.entity_id})
                  </span>
                  <span className="text-[10px] text-neutral-400 font-mono">{conf.id}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                  <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 space-y-1">
                    <span className="font-bold text-emerald-800 block">Local Device Payload:</span>
                    <pre className="text-[10px] bg-white p-2 rounded border overflow-x-auto text-neutral-700">
                      {JSON.stringify(conf.localPayload, null, 2)}
                    </pre>
                  </div>

                  <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 space-y-1">
                    <span className="font-bold text-rose-800 block">Remote Cloud Payload:</span>
                    <pre className="text-[10px] bg-white p-2 rounded border overflow-x-auto text-neutral-700">
                      {JSON.stringify(conf.remotePayload, null, 2)}
                    </pre>
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => handleResolveConflict(conf.id, 'LOCAL')}
                    className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition text-xs"
                  >
                    Keep Local Version (Re-queue)
                  </button>
                  <button
                    onClick={() => handleResolveConflict(conf.id, 'REMOTE')}
                    className="flex-1 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold transition text-xs"
                  >
                    Accept Cloud Remote Version
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Durable Event Queue Log */}
      <div className="bg-white rounded-3xl border border-neutral-200 p-6 shadow-sm space-y-4 text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
          <h3 className="font-bold text-neutral-900 flex items-center gap-2">
            <Database className="w-4 h-4 text-neutral-600" />
            <span>Local Event Queue Log ({allEvents.length} events)</span>
          </h3>
          <span className="text-neutral-500 text-[11px]">UUID-based idempotency</span>
        </div>

        {allEvents.length === 0 ? (
          <p className="text-neutral-400 text-center py-8">No events generated yet.</p>
        ) : (
          <div className="divide-y divide-neutral-100 max-h-96 overflow-y-auto pr-1">
            {allEvents.map((evt) => (
              <div key={evt.event_id} className="py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                        evt.sync_status === 'SYNCED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : evt.sync_status === 'FAILED'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {evt.sync_status}
                    </span>
                    <span className="font-bold text-neutral-900 uppercase">{evt.operation}</span>
                    <span className="text-neutral-600 font-mono text-[11px]">
                      {evt.entity_type} ({evt.entity_id})
                    </span>
                  </div>
                  <div className="text-[10px] text-neutral-400 font-mono mt-0.5">
                    Event ID: {evt.event_id} • Device: {evt.origin_device_id.substring(0, 15)}...
                  </div>
                  {evt.last_error && (
                    <div className="text-[10px] text-rose-600 mt-0.5">Error: {evt.last_error}</div>
                  )}
                </div>

                <div className="text-right text-[10px] text-neutral-400">
                  <div>Created: {new Date(evt.created_at).toLocaleTimeString()}</div>
                  {evt.server_ack_at && (
                    <div className="text-emerald-700 font-semibold">
                      Server Ack: {new Date(evt.server_ack_at).toLocaleTimeString()}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
