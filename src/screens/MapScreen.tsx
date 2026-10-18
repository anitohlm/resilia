/**
 * Resilia Screen 3: Emergency Map View
 * Displays interactive offline-ready map of Marikina River basin,
 * shelters, reported hazards, assistance requests, and road passability.
 */

import React, { useState } from 'react';
import { ResiliaMap } from '../components/map/ResiliaMap';
import { AssistanceRequest, Incident, Resource, Shelter } from '../types';
import { AlertTriangle, Building2, Camera, CheckCircle2, Droplets, Info, MapPin } from 'lucide-react';

interface MapScreenProps {
  shelters: Shelter[];
  incidents: Incident[];
  resources: Resource[];
  assistanceRequests: AssistanceRequest[];
}

export const MapScreen: React.FC<MapScreenProps> = ({
  shelters,
  incidents,
  resources,
  assistanceRequests,
}) => {
  const [selectedEntityId, setSelectedEntityId] = useState<string | undefined>(undefined);

  // User Requirement: Only verified incident reports by coordinators can be seen on the map
  const verifiedIncidents = incidents.filter((inc) => inc.status === 'VERIFIED');

  return (
    <div className="space-y-4 animate-in fade-in">
      {/* Top Banner Notice */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-emerald-600" />
          <span className="font-bold text-neutral-800">Operational Geographic View:</span>
          <span className="text-neutral-600">Barangay Tumana & Barangay Malanday Basin</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-neutral-500">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Local vector cartography active • No live tile server required</span>
        </div>
      </div>

      {/* Main Map Container */}
      <div className="h-[600px] w-full">
        <ResiliaMap
          shelters={shelters}
          incidents={incidents}
          resources={resources}
          assistanceRequests={assistanceRequests}
          selectedEntityId={selectedEntityId}
        />
      </div>

      {/* Quick Summary Cards below map */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-sm space-y-2">
          <h4 className="font-bold text-neutral-900 flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-emerald-600" /> Key Evacuation Facilities
          </h4>
          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
            {shelters.map((s) => (
              <div
                key={s.id}
                onClick={() => setSelectedEntityId(s.id)}
                className="p-2 rounded-xl bg-neutral-50 hover:bg-emerald-50 cursor-pointer border border-neutral-200 flex justify-between items-center transition"
              >
                <div>
                  <div className="font-semibold text-neutral-800">{s.name.split(' ')[0]} {s.name.split(' ')[1]}</div>
                  <div className="text-[10px] text-neutral-500">{s.locationName}</div>
                </div>
                <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-emerald-100 text-emerald-800">
                  {s.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-neutral-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Verified Hazard Markers ({verifiedIncidents.length})</span>
            </h4>
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Coordinator Verified Only
            </span>
          </div>
          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
            {verifiedIncidents.length > 0 ? (
              verifiedIncidents.map((inc) => (
                <div
                  key={inc.id}
                  onClick={() => setSelectedEntityId(inc.id)}
                  className="p-2 rounded-xl bg-neutral-50 hover:bg-emerald-50/70 cursor-pointer border border-neutral-200 flex justify-between items-center transition gap-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {inc.photoUrl ? (
                      <img
                        src={inc.photoUrl}
                        alt="Thumbnail"
                        className="w-8 h-8 rounded-lg object-cover border border-neutral-300 shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-neutral-200 text-neutral-600 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="font-semibold text-neutral-800 truncate text-xs">{inc.title}</div>
                      <div className="text-[10px] text-neutral-500 truncate">{inc.locationName}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {inc.photoUrl && (
                      <span title="Photo evidence attached">
                        <Camera className="w-3 h-3 text-neutral-500" />
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-emerald-100 text-emerald-800">
                      VERIFIED
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-[11px] text-neutral-500 p-2 italic">
                No verified hazards published yet. Reports must be verified by DRRM Coordinators before appearing on the map.
              </p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-sm space-y-2">
          <h4 className="font-bold text-neutral-900 flex items-center gap-1.5">
            <Droplets className="w-4 h-4 text-cyan-600" /> River Elevation Hazard Data
          </h4>
          <p className="text-neutral-600 text-[11px] leading-relaxed">
            The Marikina River flood basin map distinguishes hazard exposure polygons from live observed depth.
            Low-lying alleys along Tumana Dike (elevation &lt;14m above sea level) are subject to high backflow during Level 2 Warning sirens.
          </p>
          <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[10px]">
            <strong>Safety Principle:</strong> Do not label unverified roads as safe. Use coordinator verified status before transit.
          </div>
        </div>
      </div>
    </div>
  );
};
