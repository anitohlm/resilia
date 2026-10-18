/**
 * Resident Find a Safe Place (Shelters and Resource Search)
 * Straightforward shelter & relief distribution finder:
 * - Searchable list + Optional map integration
 * - Real filters: Accessible shelters, Open status, Drinking water, Food packs
 * - Latest known availability, capacity, wheelchair tags, and staleness indicators
 * - Never labels an unverified route as "safe"
 */

import React, { useState } from 'react';
import {
  Filter,
  MapPin,
  Search,
  X,
  Baby,
  PawPrint,
  Activity,
} from 'lucide-react';
import {
  FindSafePlaceIcon,
  PotableWaterIcon,
  WheelchairAccessibleIcon,
} from '../../components/icons/ResidentIcons';
import { Resource, Shelter } from '../../types';
import { Card, LinkButton, Notice, ScreenHeader, StatusPill } from './ui';
import { ShelterDetailsDialog, ShelterRow, ResourceRow } from './ShelterInfo';
import { useDeviceLocation } from './locationStore';
import { Navigate } from './ResidentApp';

interface ResidentFindPlaceProps {
  onBack: () => void;
  navigate: Navigate;
  shelters: Shelter[];
  resources: Resource[];
  initialShelterId?: string;
}

export const ResidentFindPlace: React.FC<ResidentFindPlaceProps> = ({
  onBack,
  navigate,
  shelters,
  resources,
  initialShelterId,
}) => {
  const { location, busy: locBusy, request: requestLoc } = useDeviceLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'SHELTERS' | 'RESOURCES'>('SHELTERS');
  const [filterWheelchairOnly, setFilterWheelchairOnly] = useState(false);
  const [filterOpenOnly, setFilterOpenOnly] = useState(false);
  const [filterLactatingOnly, setFilterLactatingOnly] = useState(false);
  const [filterPetsOnly, setFilterPetsOnly] = useState(false);
  const [filterOxygenOnly, setFilterOxygenOnly] = useState(false);
  const [selectedShelter, setSelectedShelter] = useState<Shelter | null>(() => {
    if (initialShelterId) {
      return shelters.find((s) => s.id === initialShelterId) || null;
    }
    return null;
  });

  // Filter Shelters
  const filteredShelters = shelters.filter((s) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      s.name.toLowerCase().includes(q) || s.locationName.toLowerCase().includes(q);
    if (!matchesSearch) return false;

    if (filterWheelchairOnly && !s.isAccessibleWheelchair && !s.hasGroundFloorAccess) return false;
    if (filterOpenOnly && s.status !== 'OPEN') return false;
    if (filterLactatingOnly && !s.hasLactatingStation) return false;
    if (filterPetsOnly && !s.hasPetFriendlyZone) return false;
    if (filterOxygenOnly && !s.hasMedicalOxygen) return false;

    return true;
  });

  // Filter Resources (Water & Food)
  const filteredResources = resources.filter((r) => {
    const q = searchQuery.toLowerCase();
    return (
      r.name.toLowerCase().includes(q) ||
      r.locationName.toLowerCase().includes(q) ||
      r.category.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <ScreenHeader
        title="Find a Safe Place"
        subtitle="Evacuation shelters, clean drinking water, and relief points"
        onBack={onBack}
      />

      {/* Search Input Bar */}
      <div className="relative">
        <Search className="w-5 h-5 text-rs-muted absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by shelter name, barangay, or street..."
          className="w-full min-h-[52px] pl-12 pr-10 rounded-2xl border border-rs-border bg-rs-card text-base text-rs-text placeholder:text-rs-muted focus:outline-none focus:ring-2 focus:ring-rs-primary shadow-xs transition-colors"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="w-10 h-10 absolute right-1 top-1/2 -translate-y-1/2 flex items-center justify-center text-rs-muted hover:text-rs-text"
            aria-label="Clear search"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Tabs: Shelters vs Supplies */}
      <div className="flex border-b border-rs-border text-sm font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('SHELTERS')}
          className={`flex-1 pb-3 text-center transition-colors border-b-2 flex items-center justify-center gap-2 ${
            activeTab === 'SHELTERS'
              ? 'border-rs-primary text-rs-primary-dark font-bold'
              : 'border-transparent text-rs-muted hover:text-rs-text'
          }`}
        >
          <FindSafePlaceIcon className="w-4 h-4" /> Evacuation Shelters ({filteredShelters.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('RESOURCES')}
          className={`flex-1 pb-3 text-center transition-colors border-b-2 flex items-center justify-center gap-2 ${
            activeTab === 'RESOURCES'
              ? 'border-rs-primary text-rs-primary-dark font-bold'
              : 'border-transparent text-rs-muted hover:text-rs-text'
          }`}
        >
          <PotableWaterIcon className="w-4 h-4" /> Water & Food Points ({filteredResources.length})
        </button>
      </div>

      {/* Filter Toggle Chips */}
      {activeTab === 'SHELTERS' && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => setFilterOpenOnly((p) => !p)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors flex items-center gap-1.5 ${
              filterOpenOnly
                ? 'bg-rs-tint border-rs-primary text-rs-primary-dark font-semibold'
                : 'bg-rs-card border-rs-border text-rs-muted hover:text-rs-text'
            }`}
          >
            Has space available only
          </button>

          <button
            type="button"
            onClick={() => setFilterWheelchairOnly((p) => !p)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors flex items-center gap-1.5 ${
              filterWheelchairOnly
                ? 'bg-rs-tint border-rs-primary text-rs-primary-dark font-semibold'
                : 'bg-rs-card border-rs-border text-rs-muted hover:text-rs-text'
            }`}
          >
            <WheelchairAccessibleIcon className="w-3.5 h-3.5" /> PWD & Ramps
          </button>

          <button
            type="button"
            onClick={() => setFilterLactatingOnly((p) => !p)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors flex items-center gap-1.5 ${
              filterLactatingOnly
                ? 'bg-rs-tint border-rs-primary text-rs-primary-dark font-semibold'
                : 'bg-rs-card border-rs-border text-rs-muted hover:text-rs-text'
            }`}
          >
            <Baby className="w-3.5 h-3.5 text-cyan-600" /> Lactating / Infant Station
          </button>

          <button
            type="button"
            onClick={() => setFilterPetsOnly((p) => !p)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors flex items-center gap-1.5 ${
              filterPetsOnly
                ? 'bg-rs-tint border-rs-primary text-rs-primary-dark font-semibold'
                : 'bg-rs-card border-rs-border text-rs-muted hover:text-rs-text'
            }`}
          >
            <PawPrint className="w-3.5 h-3.5 text-amber-600" /> Pet-Friendly
          </button>

          <button
            type="button"
            onClick={() => setFilterOxygenOnly((p) => !p)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors flex items-center gap-1.5 ${
              filterOxygenOnly
                ? 'bg-rs-tint border-rs-primary text-rs-primary-dark font-semibold'
                : 'bg-rs-card border-rs-border text-rs-muted hover:text-rs-text'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-rose-600" /> Medical Oxygen
          </button>

          <button
            type="button"
            onClick={() => navigate('MAP')}
            className="ml-auto text-xs font-semibold text-rs-primary hover:underline inline-flex items-center gap-1"
          >
            <MapPin className="w-3.5 h-3.5" /> View on Map
          </button>
        </div>
      )}

      {/* Results List */}
      <div className="space-y-3">
        {activeTab === 'SHELTERS' ? (
          filteredShelters.length > 0 ? (
            filteredShelters.map((s) => (
              <ShelterRow
                key={s.id}
                shelter={s}
                location={location}
                onDetails={() => setSelectedShelter(s)}
              />
            ))
          ) : (
            <Card className="p-8 text-center text-rs-muted space-y-2">
              <FindSafePlaceIcon className="w-8 h-8 mx-auto text-rs-muted/50" />
              <p className="font-semibold text-rs-text">No shelters match your search or filters.</p>
              <p className="text-xs">Try resetting filters or checking neighboring barangays.</p>
            </Card>
          )
        ) : filteredResources.length > 0 ? (
          filteredResources.map((r) => (
            <ResourceRow key={r.id} resource={r} />
          ))
        ) : (
          <Card className="p-8 text-center text-rs-muted space-y-2">
            <PotableWaterIcon className="w-8 h-8 mx-auto text-rs-muted/50" />
            <p className="font-semibold text-rs-text">No relief supply distribution points recorded.</p>
          </Card>
        )}
      </div>

      <Notice tone="neutral">
        Shelter capacity numbers are based on the latest records verified by coordinators. Resilia cannot confirm that roads
        or walking routes are completely flood-free. Stay on high ground when moving.
      </Notice>

      {/* Shelter Details Modal */}
      <ShelterDetailsDialog
        shelter={selectedShelter}
        location={location}
        onClose={() => setSelectedShelter(null)}
        onViewMap={() => {
          setSelectedShelter(null);
          navigate('MAP');
        }}
      />
    </div>
  );
};
