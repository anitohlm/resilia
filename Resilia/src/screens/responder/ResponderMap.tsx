/**
 * Responder Operational Map Screen
 * Section 7: Map and Navigation focused on current mission destination,
 * ground hazards, road conditions, and accessible shelters.
 */

import React, { useState } from 'react';
import { Incident, Mission, Resource, Shelter } from '../../types';
import { ResiliaMap } from '../../components/map/ResiliaMap';
import {
  Building2,
  Compass,
  MapPin,
  Navigation,
  Shield,
  Truck,
  WifiOff,
} from 'lucide-react';

interface ResponderMapProps {
  missions: Mission[];
  incidents: Incident[];
  resources: Resource[];
  shelters: Shelter[];
  focusedMission?: Mission | null;
  onSelectMission?: (mission: Mission) => void;
}

export const ResponderMap: React.FC<ResponderMapProps> = ({
  missions,
  incidents,
  resources,
  shelters,
  focusedMission,
  onSelectMission,
}) => {
  const [activeView, setActiveView] = useState<'MAP' | 'LOCATIONS_LIST'>('MAP');

  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-12 animate-in fade-in duration-200">
      {/* Header & View Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#182522]">Field Tactical Map</h1>
          <p className="text-xs sm:text-sm text-[#66736D] mt-0.5">
            Geographic view of mission staging points, road closures, and verified relief hubs.
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-white rounded-2xl border border-[#E3E9E5] text-xs font-bold self-start sm:self-auto shadow-xs">
          <button
            onClick={() => setActiveView('MAP')}
            className={`px-3.5 py-1.5 rounded-xl transition ${
              activeView === 'MAP'
                ? 'bg-[#16856B] text-white shadow-xs'
                : 'text-[#66736D] hover:text-[#182522]'
            }`}
          >
            Tactical Map
          </button>
          <button
            onClick={() => setActiveView('LOCATIONS_LIST')}
            className={`px-3.5 py-1.5 rounded-xl transition ${
              activeView === 'LOCATIONS_LIST'
                ? 'bg-[#16856B] text-white shadow-xs'
                : 'text-[#66736D] hover:text-[#182522]'
            }`}
          >
            Location Roster ({missions.length + shelters.length})
          </button>
        </div>
      </div>

      {/* Focused Mission Route Banner */}
      {focusedMission && (
        <div className="p-3.5 rounded-2xl bg-[#153B32] text-white flex flex-wrap items-center justify-between gap-3 text-xs shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-700 text-white shrink-0">
              <Navigation className="w-4 h-4" />
            </div>
            <div>
              <p className="font-extrabold text-emerald-300">Target Staging: {focusedMission.pickupLocation}</p>
              <p className="text-[11px] text-neutral-300">
                Mission: {focusedMission.title} • Destination: {focusedMission.targetShelterName || focusedMission.destinationLocation}
              </p>
            </div>
          </div>
          {onSelectMission && (
            <button
              onClick={() => onSelectMission(focusedMission)}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition border border-white/20"
            >
              Open Briefing
            </button>
          )}
        </div>
      )}

      {/* Main View Area */}
      {activeView === 'MAP' ? (
        <div className="rounded-3xl overflow-hidden border border-[#E3E9E5] shadow-sm h-[600px] min-h-[600px] w-full relative">
          <ResiliaMap
            shelters={shelters}
            incidents={incidents}
            resources={resources}
            assistanceRequests={[]}
            selectedEntityId={focusedMission?.id}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Mission Destinations */}
          <div className="bg-white rounded-3xl border border-[#E3E9E5] p-5 shadow-xs space-y-3">
            <h2 className="text-sm font-bold text-[#182522] flex items-center gap-2 border-b border-[#E3E9E5] pb-2">
              <MapPin className="w-4 h-4 text-rose-600" />
              <span>Assigned Staging Points ({missions.length})</span>
            </h2>

            <div className="space-y-2">
              {missions.map((m) => (
                <div
                  key={m.id}
                  onClick={() => onSelectMission && onSelectMission(m)}
                  className="p-3 rounded-2xl bg-[#F5F7F6] hover:bg-emerald-50 border border-[#E3E9E5] transition cursor-pointer space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#182522]">{m.title}</span>
                    <span className="font-mono text-[10px] text-[#66736D]">{m.id.substring(0, 8)}</span>
                  </div>
                  <p className="text-[11px] text-[#66736D]">{m.pickupLocation}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Shelters & Resource Hubs */}
          <div className="bg-white rounded-3xl border border-[#E3E9E5] p-5 shadow-xs space-y-3">
            <h2 className="text-sm font-bold text-[#182522] flex items-center gap-2 border-b border-[#E3E9E5] pb-2">
              <Building2 className="w-4 h-4 text-[#16856B]" />
              <span>Shelter Facilities ({shelters.length})</span>
            </h2>

            <div className="space-y-2">
              {shelters.map((s) => (
                <div key={s.id} className="p-3 rounded-2xl bg-[#F5F7F6] border border-[#E3E9E5] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#182522]">{s.name}</span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      {s.capacityCurrent} / {s.capacityTotal}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#66736D]">{s.locationName}</p>
                  <p className="text-[10px] text-[#66736D]">
                    Wheelchair Accessible: {s.isAccessibleWheelchair ? 'Yes' : 'No'} • Backup Power: {s.hasBackupPower ? 'Yes' : 'No'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
