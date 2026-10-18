/**
 * Resident helpers: time formatting, staleness, alert selection, distance, delivery status.
 * All derived strictly from stored records — nothing is assumed or simulated.
 */

import { useEffect, useState } from 'react';
import { Alert, Community, SyncEvent } from '../../types';
import { EventQueueService } from '../../services/offline/eventQueue';
import { DEMO_ALERTS } from '../../demo/seedData';

const DEMO_ALERT_IDS = new Set(DEMO_ALERTS.map((a) => a.id));

/** Records older than this are flagged as possibly outdated. */
export const STALE_AFTER_MS = 6 * 60 * 60 * 1000;

export function isStale(iso?: string, maxAgeMs = STALE_AFTER_MS): boolean {
  if (!iso) return true;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) || Date.now() - t > maxAgeMs;
}

export function formatTime(iso?: string): string {
  if (!iso) return 'Unknown time';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Unknown time';
  const sameDay = d.toDateString() === new Date().toDateString();
  const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  return sameDay ? `today at ${time}` : `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} at ${time}`;
}

export function timeAgo(iso?: string): string {
  if (!iso) return 'unknown';
  const diff = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(diff)) return 'unknown';
  const m = Math.round(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hr ago`;
  return `${Math.round(h / 24)} day(s) ago`;
}

export function shortRef(id: string): string {
  const core = id.replace(/^[a-z]+_/, '').replace(/-/g, '');
  return core.slice(0, 8).toUpperCase();
}

export function isExerciseAlert(a: Alert): boolean {
  return !!a.isExercise || DEMO_ALERT_IDS.has(a.id);
}

/** Active, unexpired alerts, most severe first. */
export function currentAlerts(alerts: Alert[]): Alert[] {
  const rank = { CRITICAL: 0, WARNING: 1, INFO: 2 } as const;
  const now = Date.now();
  return alerts
    .filter((a) => a.active && (!a.expiresAt || new Date(a.expiresAt).getTime() > now))
    .sort((a, b) => rank[a.severity] - rank[b.severity] || +new Date(b.issuedAt) - +new Date(a.issuedAt));
}

/** River thresholds documented in types (15m alert, 16m warning, 18m evacuate). */
export const RIVER_ALERT_THRESHOLD_M = 15;

export function isSimulatedSensor(c: Community | null): boolean {
  return !!c && /simulat|demo/i.test(c.source || '');
}

export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export function formatDistance(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m away` : `${km.toFixed(1)} km away`;
}

/* ---------------- Delivery status (from the real sync queue) ---------------- */

export type DeliveryState = 'PENDING' | 'FAILED' | 'DELIVERED' | 'NO_RECORD';
export interface DeliveryInfo {
  state: DeliveryState;
  ackAt?: string;
}

export function computeDelivery(events: SyncEvent[], entityId: string): DeliveryInfo {
  const mine = events.filter((e) => e.entity_id === entityId);
  if (mine.length === 0) return { state: 'NO_RECORD' };
  if (mine.some((e) => e.sync_status === 'FAILED' || e.sync_status === 'CONFLICT')) return { state: 'FAILED' };
  if (mine.some((e) => e.sync_status === 'PENDING')) return { state: 'PENDING' };
  const ack = mine
    .map((e) => e.server_ack_at)
    .filter(Boolean)
    .sort()
    .pop();
  return { state: 'DELIVERED', ackAt: ack };
}

/** Live view of the sync queue; refreshes on local writes and sync completion. */
export function useSyncEvents(): SyncEvent[] {
  const [events, setEvents] = useState<SyncEvent[]>([]);
  useEffect(() => {
    let alive = true;
    const load = () =>
      EventQueueService.getAllEvents()
        .then((e) => alive && setEvents(e))
        .catch(() => undefined);
    load();
    window.addEventListener('resilia_local_write', load);
    window.addEventListener('resilia_sync_complete', load);
    window.addEventListener('resilia_connectivity_change', load);
    return () => {
      alive = false;
      window.removeEventListener('resilia_local_write', load);
      window.removeEventListener('resilia_sync_complete', load);
      window.removeEventListener('resilia_connectivity_change', load);
    };
  }, []);
  return events;
}

/* ---------------- Optional device location (explicit permission only) ---------------- */

export interface DeviceLocation {
  lat: number;
  lng: number;
  accuracyM: number;
  at: string;
}

export function requestDeviceLocation(): Promise<DeviceLocation> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Location is not available on this device.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracyM: Math.round(pos.coords.accuracy),
          at: new Date().toISOString(),
        }),
      (err) =>
        reject(
          new Error(
            err.code === err.PERMISSION_DENIED
              ? 'Location permission was not given. You can type your location instead.'
              : 'Could not find your location. You can type it instead.'
          )
        ),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  });
}
