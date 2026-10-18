/**
 * Resilia Screen 9: Resource and Shelter Management
 * Deterministic shelter capacity updates, editable shelter features (wheelchair, generator, clinic, water, status),
 * inventory movements tracking, and supply depletion rates.
 */

import React, { useState } from 'react';
import { useAuth } from '../services/auth/authContext';
import { ResourceRepository, ShelterRepository } from '../services/repositories';
import { InventoryMovement, Resource, Shelter, ShelterStatus } from '../types';
import {
  Building2,
  CheckCircle2,
  Clock,
  Droplets,
  Edit3,
  History,
  MoveRight,
  Package,
  Plus,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Truck,
  Users,
  Zap,
} from 'lucide-react';

interface ResourceShelterScreenProps {
  shelters: Shelter[];
  resources: Resource[];
  onDataChanged?: () => void;
}

export const ResourceShelterScreen: React.FC<ResourceShelterScreenProps> = ({
  shelters,
  resources,
  onDataChanged,
}) => {
  const { currentUser, canManageResources } = useAuth();

  // Active sub-tab
  const [tab, setTab] = useState<'SHELTERS' | 'RESOURCES' | 'MOVEMENTS'>('SHELTERS');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Shelter feature modification modal state
  const [selectedShelter, setSelectedShelter] = useState<Shelter | null>(null);
  const [capacityTotal, setCapacityTotal] = useState<number>(500);
  const [newOccupancy, setNewOccupancy] = useState<number>(0);
  const [shelterStatus, setShelterStatus] = useState<ShelterStatus>('OPEN');
  const [isAccessibleWheelchair, setIsAccessibleWheelchair] = useState<boolean>(true);
  const [hasBackupPower, setHasBackupPower] = useState<boolean>(true);
  const [hasMedicalClinic, setHasMedicalClinic] = useState<boolean>(true);
  const [hasPotableWater, setHasPotableWater] = useState<boolean>(true);
  const [hasLactatingStation, setHasLactatingStation] = useState<boolean>(false);
  const [hasPetFriendlyZone, setHasPetFriendlyZone] = useState<boolean>(false);
  const [hasMedicalOxygen, setHasMedicalOxygen] = useState<boolean>(false);
  const [hasGroundFloorAccess, setHasGroundFloorAccess] = useState<boolean>(false);
  const [pwdCapacity, setPwdCapacity] = useState<number>(0);
  const [pwdCurrent, setPwdCurrent] = useState<number>(0);
  const [petCapacity, setPetCapacity] = useState<number>(0);
  const [petCurrent, setPetCurrent] = useState<number>(0);
  const [contactPerson, setContactPerson] = useState<string>('');
  const [contactPhone, setContactPhone] = useState<string>('');
  const [shelterRationale, setShelterRationale] = useState('');
  const [isSavingShelter, setIsSavingShelter] = useState(false);

  // Resource movement modal state
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [deltaQuantity, setDeltaQuantity] = useState<number>(10);
  const [movementType, setMovementType] = useState<InventoryMovement['movementType']>('INBOUND_RELIEF');
  const [movementNotes, setMovementNotes] = useState('Delivery from DSWD staging warehouse');
  const [movementsHistory, setMovementsHistory] = useState<InventoryMovement[]>([]);

  // Open shelter edit modal and populate state
  const handleOpenShelterModal = (s: Shelter) => {
    if (!canManageResources) {
      setFeedback({
        type: 'error',
        message: 'Permission Denied: Only Disaster Coordinators are authorized to modify shelter features and capacities.',
      });
      return;
    }
    setSelectedShelter(s);
    setCapacityTotal(s.capacityTotal);
    setNewOccupancy(s.capacityCurrent);
    setShelterStatus(s.status);
    setIsAccessibleWheelchair(s.isAccessibleWheelchair);
    setHasBackupPower(s.hasBackupPower);
    setHasMedicalClinic(s.hasMedicalClinic);
    setHasPotableWater(s.hasPotableWater);
    setHasLactatingStation(s.hasLactatingStation ?? false);
    setHasPetFriendlyZone(s.hasPetFriendlyZone ?? false);
    setHasMedicalOxygen(s.hasMedicalOxygen ?? false);
    setHasGroundFloorAccess(s.hasGroundFloorAccess ?? false);
    setPwdCapacity(s.pwdCapacity ?? 0);
    setPwdCurrent(s.pwdCurrent ?? 0);
    setPetCapacity(s.petCapacity ?? 0);
    setPetCurrent(s.petCurrent ?? 0);
    setContactPerson(s.contactPerson || '');
    setContactPhone(s.contactPhone || '');
    setShelterRationale('Updated capacity and operational features');
  };

  // Load movements history on tab change
  React.useEffect(() => {
    if (tab === 'MOVEMENTS') {
      ResourceRepository.getMovements().then(setMovementsHistory);
    }
  }, [tab]);

  const handleSaveShelterFeatures = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShelter) return;

    setIsSavingShelter(true);
    try {
      await ShelterRepository.updateShelterFeatures(
        selectedShelter.id,
        {
          capacityTotal: Number(capacityTotal),
          capacityCurrent: Number(newOccupancy),
          status: shelterStatus,
          isAccessibleWheelchair,
          hasBackupPower,
          hasMedicalClinic,
          hasPotableWater,
          hasLactatingStation,
          hasPetFriendlyZone,
          hasMedicalOxygen,
          hasGroundFloorAccess,
          pwdCapacity: Number(pwdCapacity),
          pwdCurrent: Number(pwdCurrent),
          petCapacity: Number(petCapacity),
          petCurrent: Number(petCurrent),
          contactPerson: contactPerson.trim(),
          contactPhone: contactPhone.trim(),
        },
        currentUser,
        shelterRationale.trim() || 'Coordinators updated shelter operational features'
      );
      setSelectedShelter(null);
      if (onDataChanged) onDataChanged();
      setFeedback({
        type: 'success',
        message: `Shelter "${selectedShelter.name}" features and capacity updated successfully!`,
      });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setIsSavingShelter(false);
    }
  };

  const handleRecordMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResource) return;

    try {
      const delta = movementType === 'CONSUMPTION' || movementType === 'DISPATCH'
        ? -Math.abs(Number(deltaQuantity))
        : Math.abs(Number(deltaQuantity));

      await ResourceRepository.recordMovement(
        selectedResource.id,
        delta,
        movementType,
        selectedResource.locationName,
        'Field Staging Unit',
        currentUser,
        movementNotes
      );

      setSelectedResource(null);
      setMovementNotes('');
      if (onDataChanged) onDataChanged();
      setFeedback({
        type: 'success',
        message: 'Inventory movement recorded with explicit ledger audit!',
      });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Header */}
      <div className="bg-white rounded-2xl border border-neutral-200/90 p-5 sm:p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-neutral-900 text-white flex items-center justify-center">
            <Building2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-neutral-900">Shelter & Resource Management</h2>
            <p className="text-xs text-neutral-500">
              Deterministic inventory ledger, editable shelter facility features, and validated evacuation capacity.
            </p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 bg-neutral-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setTab('SHELTERS')}
            className={`px-3 py-1.5 rounded-lg transition ${
              tab === 'SHELTERS' ? 'bg-white text-neutral-900 shadow-2xs font-bold' : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            Shelter Capacities & Features ({shelters.length})
          </button>
          <button
            onClick={() => setTab('RESOURCES')}
            className={`px-3 py-1.5 rounded-lg transition ${
              tab === 'RESOURCES' ? 'bg-white text-neutral-900 shadow-2xs font-bold' : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            Inventory Balances ({resources.length})
          </button>
          <button
            onClick={() => setTab('MOVEMENTS')}
            className={`px-3 py-1.5 rounded-lg transition ${
              tab === 'MOVEMENTS' ? 'bg-white text-neutral-900 shadow-2xs font-bold' : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            Movements Ledger
          </button>
        </div>
      </div>

      {/* Inline Feedback Banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-neutral-400 hover:text-neutral-700 font-bold ml-2 text-sm"
          >
            ✕
          </button>
        </div>
      )}

      {/* Tab 1: Shelters */}
      {tab === 'SHELTERS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in duration-200">
          {shelters.map((s) => {
            const availableSpaces = Math.max(0, s.capacityTotal - s.capacityCurrent);
            const occupancyPct = Math.round((s.capacityCurrent / s.capacityTotal) * 100);
            return (
              <div
                key={s.id}
                className="bg-white rounded-xl border border-neutral-200 p-5 shadow-sm space-y-3 text-xs flex flex-col justify-between hover:border-neutral-300 transition"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                        s.status === 'OPEN'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : s.status === 'NEAR_CAPACITY'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : s.status === 'FULL'
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : 'bg-neutral-100 text-neutral-600'
                      }`}
                    >
                      {s.status.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] text-neutral-400 font-mono">{s.id}</span>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-sm text-neutral-900">{s.name}</h3>
                    <p className="text-[11px] text-neutral-500">{s.locationName}</p>
                  </div>

                  {/* Progress Bar & Numerical Metrics */}
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="font-semibold text-neutral-600">
                        Occupancy: <strong>{s.capacityCurrent}</strong> / {s.capacityTotal}
                      </span>
                      <span className="font-bold text-neutral-800">{occupancyPct}% full</span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-neutral-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          occupancyPct >= 100
                            ? 'bg-rose-500'
                            : occupancyPct >= 80
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, occupancyPct)}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-neutral-500 flex justify-between pt-0.5">
                      <span>Available Slots: <strong className="text-emerald-700">{availableSpaces}</strong></span>
                      <span>Verified: {new Date(s.verifiedAt).toLocaleTimeString()}</span>
                    </div>
                  </div>

                  {/* Facility Features Badges */}
                  <div className="flex flex-wrap gap-1.5 pt-2 border-t border-neutral-100 text-[10px]">
                    <span
                      className={`px-2 py-0.5 rounded-md font-semibold ${
                        s.isAccessibleWheelchair
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-neutral-100 text-neutral-400'
                      }`}
                    >
                      {s.isAccessibleWheelchair ? '✓ Wheelchair Ramp' : '✗ No Ramp'}
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded-md font-semibold ${
                        s.hasBackupPower
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-neutral-100 text-neutral-400'
                      }`}
                    >
                      {s.hasBackupPower ? '✓ Generator Power' : '✗ No Generator'}
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded-md font-semibold ${
                        s.hasMedicalClinic
                          ? 'bg-teal-100 text-teal-800 border border-teal-200'
                          : 'bg-neutral-100 text-neutral-400'
                      }`}
                    >
                      {s.hasMedicalClinic ? '✓ Medical Clinic' : '✗ No Clinic'}
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded-md font-semibold ${
                        s.hasPotableWater
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : 'bg-neutral-100 text-neutral-400'
                      }`}
                    >
                      {s.hasPotableWater ? '✓ Potable Water' : '✗ No Clean Water'}
                    </span>
                  </div>

                  {/* Contact Info */}
                  <div className="bg-neutral-50 p-2 rounded-xl text-[10px] text-neutral-600">
                    Coordinator: <strong className="text-neutral-800">{s.contactPerson}</strong> • {s.contactPhone}
                  </div>
                </div>

                {/* Edit Button for Coordinator / Read-Only Tag for Residents */}
                <div className="pt-3 border-t border-neutral-100">
                  {canManageResources ? (
                    <button
                      onClick={() => handleOpenShelterModal(s)}
                      className="w-full py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs transition flex items-center justify-center gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Modify Features & Capacity</span>
                    </button>
                  ) : (
                    <div className="flex items-center justify-between text-[11px] text-neutral-500 py-1">
                      <span className="flex items-center gap-1 font-semibold text-emerald-800">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Verified by Coordinator</span>
                      </span>
                      <span className="px-2 py-0.5 rounded bg-neutral-100 text-neutral-500 font-mono text-[10px]">
                        Read-Only
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 2: Resources */}
      {tab === 'RESOURCES' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in duration-200">
          {resources.map((res) => (
            <div key={res.id} className="bg-white rounded-xl border border-neutral-200 p-5 shadow-sm space-y-3 text-xs flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <span className="px-2 py-0.5 rounded bg-neutral-100 text-neutral-700 font-bold text-[10px]">
                    {res.category}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      res.status === 'LOW' || res.status === 'DEPLETED'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {res.status}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-sm text-neutral-900">{res.name}</h3>
                  <p className="text-[11px] text-neutral-500">{res.locationName}</p>
                </div>

                <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Balance:</span>
                    <span className="font-black text-neutral-900 text-sm">
                      {res.quantity} {res.unit}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-neutral-500">Burn Rate:</span>
                    <span className="font-semibold text-neutral-700">{res.consumptionRatePerDay} / day</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-neutral-500">Est. Depletion:</span>
                    <span className={`font-bold ${res.estimatedDaysRemaining < 1 ? 'text-rose-600' : 'text-emerald-700'}`}>
                      ~{res.estimatedDaysRemaining} days remaining
                    </span>
                  </div>
                </div>
              </div>

              {canManageResources ? (
                <button
                  onClick={() => {
                    setSelectedResource(res);
                    setDeltaQuantity(10);
                  }}
                  className="w-full py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold transition text-xs flex items-center justify-center gap-1.5"
                >
                  <MoveRight className="w-3.5 h-3.5" />
                  <span>Record Movement / Distribution</span>
                </button>
              ) : (
                <div className="py-2 px-3 rounded-xl bg-neutral-50 border border-neutral-200 text-center text-[10px] text-neutral-500 font-semibold">
                  Managed by CDRRMO Staging Logistics
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Movement Audit Ledger */}
      {tab === 'MOVEMENTS' && (
        <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm space-y-4 text-xs animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <h3 className="font-bold text-neutral-900 flex items-center gap-2">
              <History className="w-4 h-4 text-teal-600" />
              <span>Immutable Inventory Movements Ledger</span>
            </h3>
            <span className="text-neutral-400 text-[11px]">{movementsHistory.length} movements recorded</span>
          </div>

          {movementsHistory.length === 0 ? (
            <p className="text-neutral-500 italic py-4 text-center">No inventory movements recorded yet.</p>
          ) : (
            <div className="divide-y divide-neutral-100 max-h-96 overflow-y-auto pr-1">
              {movementsHistory.map((m) => (
                <div key={m.id} className="py-2.5 flex items-start justify-between gap-3">
                  <div>
                    <div className="font-bold text-neutral-900 flex items-center gap-1.5">
                      <span>{m.resourceName}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded font-mono text-[10px] border ${
                          m.deltaQuantity > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {m.deltaQuantity > 0 ? `+${m.deltaQuantity}` : m.deltaQuantity}
                      </span>
                    </div>
                    <div className="text-[10px] text-neutral-500 mt-0.5">
                      Type: <strong>{m.movementType}</strong> • By {m.actorName}
                    </div>
                    <p className="text-[11px] text-neutral-600 mt-0.5">{m.notes}</p>
                  </div>
                  <div className="text-neutral-400 text-[10px] shrink-0">
                    {new Date(m.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL: MODIFY SHELTER FEATURES & CAPACITY */}
      {selectedShelter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-xl border border-neutral-200 p-6 max-w-lg w-full shadow-2xl text-xs space-y-4 my-8">
            <div className="flex items-start justify-between pb-2 border-b border-neutral-100">
              <div>
                <h3 className="text-base font-black text-neutral-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-emerald-600" />
                  <span>Modify Features & Capacity</span>
                </h3>
                <p className="text-neutral-500 text-[11px] mt-0.5">
                  {selectedShelter.name} ({selectedShelter.locationName})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedShelter(null)}
                className="text-neutral-400 hover:text-neutral-600 font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveShelterFeatures} className="space-y-4">
              {/* Capacity Section */}
              <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200/80 space-y-3">
                <div className="font-extrabold text-neutral-800 text-[11px] uppercase tracking-wider">
                  Capacity & Occupancy
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-neutral-700 block mb-1">Total Capacity</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={capacityTotal}
                      onChange={(e) => setCapacityTotal(Number(e.target.value))}
                      className="w-full bg-white border border-neutral-300 rounded-xl p-2.5 text-neutral-900 font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-neutral-700 block mb-1">Current Occupants</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={newOccupancy}
                      onChange={(e) => setNewOccupancy(Number(e.target.value))}
                      className="w-full bg-white border border-neutral-300 rounded-xl p-2.5 text-neutral-900 font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-neutral-700 block mb-1">Operational Status</label>
                  <select
                    value={shelterStatus}
                    onChange={(e) => setShelterStatus(e.target.value as any)}
                    className="w-full bg-white border border-neutral-300 rounded-xl p-2.5 text-neutral-900 font-semibold"
                  >
                    <option value="OPEN">OPEN (Accepting Evacuees)</option>
                    <option value="NEAR_CAPACITY">NEAR CAPACITY (&gt;85% Full)</option>
                    <option value="FULL">FULL (Divert to Alternate Shelters)</option>
                    <option value="CLOSED">CLOSED (Flooded / Inactive)</option>
                  </select>
                </div>
              </div>

              {/* Facility Features Checkboxes */}
              <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200/80 space-y-2.5">
                <div className="font-extrabold text-neutral-800 text-[11px] uppercase tracking-wider">
                  Facility Accessibility & Utilities
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 p-2 rounded-xl bg-white border border-neutral-200 cursor-pointer hover:border-emerald-500 transition">
                    <input
                      type="checkbox"
                      checked={isAccessibleWheelchair}
                      onChange={(e) => setIsAccessibleWheelchair(e.target.checked)}
                      className="w-4 h-4 accent-emerald-600 rounded"
                    />
                    <span className="font-semibold text-neutral-800">Wheelchair & Ramp Access</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-xl bg-white border border-neutral-200 cursor-pointer hover:border-amber-500 transition">
                    <input
                      type="checkbox"
                      checked={hasBackupPower}
                      onChange={(e) => setHasBackupPower(e.target.checked)}
                      className="w-4 h-4 accent-amber-600 rounded"
                    />
                    <span className="font-semibold text-neutral-800">Backup Generator Power</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-xl bg-white border border-neutral-200 cursor-pointer hover:border-teal-500 transition">
                    <input
                      type="checkbox"
                      checked={hasMedicalClinic}
                      onChange={(e) => setHasMedicalClinic(e.target.checked)}
                      className="w-4 h-4 accent-teal-600 rounded"
                    />
                    <span className="font-semibold text-neutral-800">On-Site Medical Clinic</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-xl bg-white border border-neutral-200 cursor-pointer hover:border-blue-500 transition">
                    <input
                      type="checkbox"
                      checked={hasPotableWater}
                      onChange={(e) => setHasPotableWater(e.target.checked)}
                      className="w-4 h-4 accent-blue-600 rounded"
                    />
                    <span className="font-semibold text-neutral-800">Potable Drinking Water</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-xl bg-white border border-neutral-200 cursor-pointer hover:border-pink-500 transition">
                    <input
                      type="checkbox"
                      checked={hasLactatingStation}
                      onChange={(e) => setHasLactatingStation(e.target.checked)}
                      className="w-4 h-4 accent-pink-600 rounded"
                    />
                    <span className="font-semibold text-neutral-800">Lactating / Infant Station</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-xl bg-white border border-neutral-200 cursor-pointer hover:border-amber-500 transition">
                    <input
                      type="checkbox"
                      checked={hasPetFriendlyZone}
                      onChange={(e) => setHasPetFriendlyZone(e.target.checked)}
                      className="w-4 h-4 accent-amber-600 rounded"
                    />
                    <span className="font-semibold text-neutral-800">Pet-Friendly Evac Zone</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-xl bg-white border border-neutral-200 cursor-pointer hover:border-teal-500 transition">
                    <input
                      type="checkbox"
                      checked={hasMedicalOxygen}
                      onChange={(e) => setHasMedicalOxygen(e.target.checked)}
                      className="w-4 h-4 accent-teal-600 rounded"
                    />
                    <span className="font-semibold text-neutral-800">Medical Oxygen Support</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-xl bg-white border border-neutral-200 cursor-pointer hover:border-emerald-500 transition">
                    <input
                      type="checkbox"
                      checked={hasGroundFloorAccess}
                      onChange={(e) => setHasGroundFloorAccess(e.target.checked)}
                      className="w-4 h-4 accent-emerald-600 rounded"
                    />
                    <span className="font-semibold text-neutral-800">Ground Floor Step-Free</span>
                  </label>
                </div>
              </div>

              {/* Special Needs & Pet Capacity Section */}
              <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200/80 space-y-3">
                <div className="font-extrabold text-neutral-800 text-[11px] uppercase tracking-wider">
                  Special Needs & Pet Allocations
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-neutral-700 text-xs block mb-1">PWD / Senior Capacity</label>
                    <input
                      type="number"
                      min="0"
                      value={pwdCapacity}
                      onChange={(e) => setPwdCapacity(Number(e.target.value))}
                      className="w-full bg-white border border-neutral-300 rounded-xl p-2.5 text-neutral-900 font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-neutral-700 text-xs block mb-1">PWD Current Occupants</label>
                    <input
                      type="number"
                      min="0"
                      value={pwdCurrent}
                      onChange={(e) => setPwdCurrent(Number(e.target.value))}
                      className="w-full bg-white border border-neutral-300 rounded-xl p-2.5 text-neutral-900 font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-neutral-700 text-xs block mb-1">Pet Sheltering Capacity</label>
                    <input
                      type="number"
                      min="0"
                      value={petCapacity}
                      onChange={(e) => setPetCapacity(Number(e.target.value))}
                      className="w-full bg-white border border-neutral-300 rounded-xl p-2.5 text-neutral-900 font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-neutral-700 text-xs block mb-1">Pets Current Count</label>
                    <input
                      type="number"
                      min="0"
                      value={petCurrent}
                      onChange={(e) => setPetCurrent(Number(e.target.value))}
                      className="w-full bg-white border border-neutral-300 rounded-xl p-2.5 text-neutral-900 font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-neutral-700 block mb-1">Coordinator In-Charge</label>
                  <input
                    type="text"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="e.g. Kagawad Elena Santos"
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-xl p-2.5 text-neutral-900"
                  />
                </div>
                <div>
                  <label className="font-bold text-neutral-700 block mb-1">Emergency Phone Hotline</label>
                  <input
                    type="text"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="e.g. 0917-888-4421"
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-xl p-2.5 text-neutral-900"
                  />
                </div>
              </div>

              {/* Rationale & Audit Logging */}
              <div>
                <label className="font-bold text-neutral-700 block mb-1">Verification Rationale</label>
                <input
                  type="text"
                  required
                  value={shelterRationale}
                  onChange={(e) => setShelterRationale(e.target.value)}
                  placeholder="e.g. Installed new backup diesel generator and verified ground floor ramps"
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl p-2.5 text-neutral-900"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setSelectedShelter(null)}
                  className="flex-1 py-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 font-bold text-neutral-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingShelter}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-white transition flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Features & Capacity</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Record Inventory Movement */}
      {selectedResource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl border border-neutral-200 p-6 max-w-md w-full shadow-2xl text-xs space-y-4">
            <h3 className="text-base font-black text-neutral-900">
              Record Movement: {selectedResource.name}
            </h3>
            <p className="text-neutral-500">
              Current stored quantity: <strong>{selectedResource.quantity} {selectedResource.unit}</strong>.
            </p>

            <form onSubmit={handleRecordMovement} className="space-y-3">
              <div>
                <label className="font-bold text-neutral-800 block mb-1">Movement Type</label>
                <select
                  value={movementType}
                  onChange={(e) => setMovementType(e.target.value as any)}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl p-2.5 text-neutral-900"
                >
                  <option value="INBOUND_RELIEF">INBOUND RELIEF (Adds to stock)</option>
                  <option value="CONSUMPTION">CONSUMPTION (Deducts from stock)</option>
                  <option value="DISPATCH">FIELD DISPATCH (Deducts for rescue)</option>
                  <option value="TRANSFER">INTER-FACILITY TRANSFER</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-neutral-800 block mb-1">
                  Quantity ({selectedResource.unit})
                </label>
                <input
                  type="number"
                  min="1"
                  value={deltaQuantity}
                  onChange={(e) => setDeltaQuantity(Number(e.target.value))}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl p-2.5 text-neutral-900"
                />
              </div>

              <div>
                <label className="font-bold text-neutral-800 block mb-1">Ledger Notes</label>
                <input
                  type="text"
                  required
                  value={movementNotes}
                  onChange={(e) => setMovementNotes(e.target.value)}
                  placeholder="e.g. Dispatched 15 packs to Purok 4 stranded residents..."
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl p-2.5 text-neutral-900"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedResource(null)}
                  className="flex-1 py-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 font-bold text-neutral-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 font-bold text-white transition"
                >
                  Save to Audit Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
