/**
 * Resident Map Wrapper
 * Wraps ResiliaMap with privacy guards:
 * Residents never see other residents' names, phone numbers, or private request details on the map.
 * Only shelters, public resources, and verified incidents are shown to residents.
 */

import React from 'react';
import { ResiliaMap } from '../../components/map/ResiliaMap';
import { Incident, Resource, Shelter } from '../../types';
import { Card, ScreenHeader } from './ui';
import { Navigate } from './ResidentApp';

interface ResidentMapProps {
  navigate: Navigate;
  shelters: Shelter[];
  incidents: Incident[];
  resources: Resource[];
  currentUserId: string;
}

export const ResidentMap: React.FC<ResidentMapProps> = ({
  navigate,
  shelters,
  incidents,
  resources,
  currentUserId,
}) => {
  // Privacy Guard: Do not pass assistance requests to the map in Resident view!
  // Residents only see community infrastructure (shelters, relief resources, verified incidents).
  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <ScreenHeader
        title="Community Map"
        subtitle="Evacuation centers, water relief points, and verified road hazards"
        onBack={() => navigate('HOME')}
      />

      <div className="rounded-3xl overflow-hidden border border-rs-border shadow-xs h-[600px] min-h-[600px] w-full relative">
        <ResiliaMap
          shelters={shelters}
          incidents={incidents.filter((i) => i.status === 'VERIFIED')}
          resources={resources}
          assistanceRequests={[]} // Deliberately empty for Resident privacy!
        />
      </div>

      <p className="text-xs text-rs-muted text-center">
        Offline vector cartography is active. Personal requests are not shown on this map to protect citizen privacy.
      </p>
    </div>
  );
};
