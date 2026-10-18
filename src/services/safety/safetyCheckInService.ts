/**
 * Citizen Family Welfare & "I Am Safe" Safety Check-In Service
 * Offline-first persistent registry to reduce 911 / ICP congestion
 * and enable family reunification during cellular / data disruptions.
 */

import { EventQueueService } from '../offline/eventQueue';

export type CitizenSafetyStatus =
  | 'SAFE_AT_HOME'
  | 'SAFE_AT_SHELTER'
  | 'EVACUATING'
  | 'NEEDS_ASSISTANCE';

export interface SafetyCheckIn {
  id: string;
  residentName: string;
  contactPhone: string;
  status: CitizenSafetyStatus;
  currentLocation: string;
  shelterName?: string;
  familyCount: number;
  vulnerableCount: number;
  notes?: string;
  timestamp: string;
  isVerified?: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
  /** Links the check-in to the resident account that created it (self-reported). */
  residentId?: string;
  /** Household members whose status is still unknown at the time of check-in. */
  unknownCount?: number;
}

const STORAGE_KEY = 'resilia_safety_checkins_v1';

const INITIAL_CHECKINS: SafetyCheckIn[] = [
  {
    id: 'safe_001',
    residentName: 'Elena Santos & Family',
    contactPhone: '+63 917 555 1204',
    status: 'SAFE_AT_SHELTER',
    currentLocation: 'Bulelak Gym Sector B, Cot 14',
    shelterName: 'Bulelak Gym Evacuation Center',
    familyCount: 4,
    vulnerableCount: 1,
    notes: 'Elderly mother with maintenance meds accounted for. Safe and dry.',
    timestamp: new Date(Date.now() - 32 * 60 * 1000).toISOString(),
    isVerified: true,
    verifiedBy: 'Coordinator Maria',
    verifiedAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
  },
  {
    id: 'safe_002',
    residentName: 'Ricardo & Maria Dela Cruz',
    contactPhone: '+63 920 888 4120',
    status: 'SAFE_AT_HOME',
    currentLocation: 'Upper Level, 42 J.P. Rizal St., Malanday',
    familyCount: 3,
    vulnerableCount: 0,
    notes: 'Moved to 2nd floor with 72h water supply. Not flooded yet.',
    timestamp: new Date(Date.now() - 58 * 60 * 1000).toISOString(),
  },
  {
    id: 'safe_003',
    residentName: 'Capt. Aris Mendoza Family',
    contactPhone: '+63 908 777 9110',
    status: 'SAFE_AT_SHELTER',
    currentLocation: 'Malanday Elementary School Room 204',
    shelterName: 'Malanday Elementary School',
    familyCount: 5,
    vulnerableCount: 2,
    notes: 'Two infants safe. Received hot porridge from Red Cross.',
    timestamp: new Date(Date.now() - 85 * 60 * 1000).toISOString(),
    isVerified: true,
    verifiedBy: 'Coordinator Maria',
    verifiedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'safe_004',
    residentName: 'Lourdes Bautista',
    contactPhone: '+63 919 222 3411',
    status: 'EVACUATING',
    currentLocation: 'En route Tumana Dike toward Concepcion',
    familyCount: 2,
    vulnerableCount: 1,
    notes: 'Walking with neighbor. High ground targeted.',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
  {
    id: 'safe_005',
    residentName: 'Mateo & Grace Gonzales',
    contactPhone: '+63 918 333 9082',
    status: 'SAFE_AT_SHELTER',
    currentLocation: 'Tumana Covered Court Bleachers West',
    shelterName: 'Tumana Covered Court',
    familyCount: 4,
    vulnerableCount: 1,
    notes: 'All 4 accounted for including infant child. Secured dry clothes.',
    timestamp: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
    isVerified: true,
    verifiedBy: 'Coordinator Maria',
  },
  {
    id: 'safe_006',
    residentName: 'Aling Remedios Soriano',
    contactPhone: '+63 922 456 7819',
    status: 'NEEDS_ASSISTANCE',
    currentLocation: '3rd Floor, 18 Kalapati St., Tumana',
    familyCount: 2,
    vulnerableCount: 1,
    notes: 'Safe on 3rd floor from flash flood, but low on drinking water and dialysis medication.',
    timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
  },
];

class SafetyCheckInService {
  private crossTabChannel: BroadcastChannel | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      if ('BroadcastChannel' in window) {
        try {
          this.crossTabChannel = new BroadcastChannel('resilia_safety_channel');
          this.crossTabChannel.onmessage = (event) => {
            if (event.data?.type === 'SAFETY_CHECKIN_UPDATED') {
              window.dispatchEvent(new CustomEvent('resilia_safety_checkin_updated'));
            }
          };
        } catch {
          // ignore
        }
      }

      window.addEventListener('storage', (event) => {
        if (event.key === STORAGE_KEY) {
          window.dispatchEvent(new CustomEvent('resilia_safety_checkin_updated'));
        }
      });
    }
  }

  private getStore(): SafetyCheckIn[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_CHECKINS));
        return INITIAL_CHECKINS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_CHECKINS;
    }
  }

  private saveStore(items: SafetyCheckIn[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('resilia_safety_checkin_updated'));
        if (this.crossTabChannel) {
          try {
            this.crossTabChannel.postMessage({ type: 'SAFETY_CHECKIN_UPDATED' });
          } catch {
            // ignore
          }
        }
      }
    } catch (e) {
      console.error('Failed to save safety check-in locally:', e);
    }
  }

  public getAll(): SafetyCheckIn[] {
    return this.getStore().sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  public recordCheckIn(entry: Omit<SafetyCheckIn, 'id' | 'timestamp'>): SafetyCheckIn {
    const items = this.getStore();
    const existingIndex = entry.residentId
      ? items.findIndex((i) => i.residentId === entry.residentId)
      : -1;

    let newEntry: SafetyCheckIn;
    if (existingIndex >= 0) {
      newEntry = {
        ...items[existingIndex],
        ...entry,
        timestamp: new Date().toISOString(),
      };
      items[existingIndex] = newEntry;
    } else {
      newEntry = {
        ...entry,
        id: `safe_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        timestamp: new Date().toISOString(),
      };
      items.unshift(newEntry);
    }

    this.saveStore(items);
    return newEntry;
  }

  /**
   * Resident self check-in: persists locally (survives restart) and queues a sync
   * event so it is delivered to authorized coordinators when connectivity returns.
   */
  public async recordResidentCheckIn(
    entry: Omit<SafetyCheckIn, 'id' | 'timestamp' | 'isVerified' | 'verifiedBy' | 'verifiedAt'>,
    actorId: string
  ): Promise<SafetyCheckIn> {
    const saved = this.recordCheckIn({ ...entry, isVerified: false });
    await EventQueueService.enqueueEvent('safety_checkin', saved, 'CREATE', actorId);
    return saved;
  }

  /**
   * Merges remote check-ins pulled from the server or cloud sync.
   */
  public mergeRemoteCheckIns(remoteItems: SafetyCheckIn[]): void {
    if (!Array.isArray(remoteItems) || remoteItems.length === 0) return;
    const items = this.getStore();
    let hasChanges = false;

    for (const remote of remoteItems) {
      const idx = items.findIndex(
        (i) => i.id === remote.id || (remote.residentId && i.residentId === remote.residentId)
      );
      if (idx >= 0) {
        const localTime = new Date(items[idx].timestamp).getTime();
        const remoteTime = new Date(remote.timestamp).getTime();
        if (remoteTime >= localTime) {
          items[idx] = { ...items[idx], ...remote };
          hasChanges = true;
        }
      } else {
        items.unshift(remote);
        hasChanges = true;
      }
    }

    if (hasChanges) {
      this.saveStore(items);
    }
  }

  /** Only the resident's own check-ins — never the community roster. */
  public getForResident(residentId: string): SafetyCheckIn[] {
    return this.getAll().filter((i) => i.residentId === residentId);
  }

  public toggleVerify(id: string, coordinatorName: string): SafetyCheckIn | null {
    const items = this.getStore();
    const idx = items.findIndex((i) => i.id === id);
    if (idx === -1) return null;

    const current = items[idx];
    const isNowVerified = !current.isVerified;
    items[idx] = {
      ...current,
      isVerified: isNowVerified,
      verifiedBy: isNowVerified ? coordinatorName : undefined,
      verifiedAt: isNowVerified ? new Date().toISOString() : undefined,
    };
    this.saveStore(items);
    return items[idx];
  }

  public deleteCheckIn(id: string): boolean {
    const items = this.getStore();
    const filtered = items.filter((i) => i.id !== id);
    if (filtered.length !== items.length) {
      this.saveStore(filtered);
      return true;
    }
    return false;
  }

  public search(query: string, statusFilter?: CitizenSafetyStatus | 'ALL'): SafetyCheckIn[] {
    const q = query.trim().toLowerCase();
    let list = this.getAll();

    if (statusFilter && statusFilter !== 'ALL') {
      list = list.filter((item) => item.status === statusFilter);
    }

    if (!q) return list;

    return list.filter(
      (item) =>
        item.residentName.toLowerCase().includes(q) ||
        item.contactPhone.toLowerCase().includes(q) ||
        item.currentLocation.toLowerCase().includes(q) ||
        (item.shelterName && item.shelterName.toLowerCase().includes(q)) ||
        (item.notes && item.notes.toLowerCase().includes(q))
    );
  }

  public getSummaryStats(): {
    totalCheckIns: number;
    totalPeopleAccounted: number;
    atShelters: number;
    atHome: number;
    evacuating: number;
    needsAssistance: number;
    vulnerableCount: number;
    verifiedCount: number;
  } {
    const list = this.getAll();
    return {
      totalCheckIns: list.length,
      totalPeopleAccounted: list.reduce((sum, item) => sum + (item.familyCount || 1), 0),
      atShelters: list.filter((item) => item.status === 'SAFE_AT_SHELTER').length,
      atHome: list.filter((item) => item.status === 'SAFE_AT_HOME').length,
      evacuating: list.filter((item) => item.status === 'EVACUATING').length,
      needsAssistance: list.filter((item) => item.status === 'NEEDS_ASSISTANCE').length,
      vulnerableCount: list.reduce((sum, item) => sum + (item.vulnerableCount || 0), 0),
      verifiedCount: list.filter((item) => item.isVerified).length,
    };
  }

  public exportToCsv(): string {
    const list = this.getAll();
    const headers = [
      'Record ID',
      'Resident / Family Name',
      'Contact Phone',
      'Safety Status',
      'Current Location / Shelter',
      'Shelter Name',
      'Family Headcount',
      'Vulnerable Count',
      'Reported Timestamp',
      'Verified By Coordinator',
      'Notes / Relatives Message',
    ];

    const rows = list.map((item) => [
      item.id,
      `"${item.residentName.replace(/"/g, '""')}"`,
      `"${item.contactPhone.replace(/"/g, '""')}"`,
      item.status,
      `"${item.currentLocation.replace(/"/g, '""')}"`,
      `"${(item.shelterName || '').replace(/"/g, '""')}"`,
      item.familyCount,
      item.vulnerableCount,
      `"${item.timestamp}"`,
      item.isVerified ? `"YES (${item.verifiedBy || 'Coordinator'})"` : '"NO"',
      `"${(item.notes || '').replace(/"/g, '""')}"`,
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }
}

export const safetyCheckInService = new SafetyCheckInService();
