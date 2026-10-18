/**
 * Session-only device location, shared across resident screens.
 * Only requested after an explicit user tap; never persisted or uploaded except when the
 * resident chooses to attach it to a request/report.
 */

import { useEffect, useState } from 'react';
import { DeviceLocation, requestDeviceLocation } from './residentUtils';

let current: DeviceLocation | null = null;
const listeners = new Set<(l: DeviceLocation | null) => void>();

export function useDeviceLocation() {
  const [loc, setLoc] = useState<DeviceLocation | null>(current);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    listeners.add(setLoc);
    return () => {
      listeners.delete(setLoc);
    };
  }, []);

  const request = async (): Promise<DeviceLocation | null> => {
    setBusy(true);
    setError(null);
    try {
      const l = await requestDeviceLocation();
      current = l;
      listeners.forEach((fn) => fn(l));
      return l;
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setBusy(false);
    }
  };

  return { location: loc, error, busy, request };
}
