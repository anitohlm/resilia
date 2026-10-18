/**
 * Shelter & resource presentation shared by Home ("Nearby Help") and Find a Safe Place.
 * Availability is shown strictly from the stored record, labelled "latest known", with its
 * verification source and time. Stale records are called out. Routes are never labelled "safe".
 */

import React from 'react';
import { MapPin, Phone, Baby, PawPrint, Heart, Activity } from 'lucide-react';
import {
  BackupPowerIcon,
  FindSafePlaceIcon,
  FoodRationIcon,
  MedicalClinicIcon,
  PotableWaterIcon,
  SuppliesPackageIcon,
  WheelchairAccessibleIcon,
} from '../../components/icons/ResidentIcons';
import { Resource, Shelter } from '../../types';
import { Card, cx, Dialog, LinkButton, Notice, PrimaryButton, StatusPill } from './ui';
import { DeviceLocation, distanceKm, formatDistance, formatTime, isStale, timeAgo } from './residentUtils';
import { SHELTER_STATUS_TEXT } from './strings';

export function shelterTone(s: Shelter) {
  return s.status === 'OPEN' ? 'success' : s.status === 'NEAR_CAPACITY' ? 'warning' : 'critical';
}

export function shelterDistance(s: Shelter, loc: DeviceLocation | null): number | null {
  if (!loc || typeof s.lat !== 'number' || typeof s.lng !== 'number') return null;
  return distanceKm(loc, s);
}

export const ShelterRow: React.FC<{
  shelter: Shelter;
  location: DeviceLocation | null;
  onDetails: () => void;
}> = ({ shelter: s, location, onDetails }) => {
  const d = shelterDistance(s, location);
  const stale = isStale(s.verifiedAt);
  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <span className="w-11 h-11 rounded-full bg-rs-tint text-rs-primary flex items-center justify-center shrink-0" aria-hidden>
          <FindSafePlaceIcon className="w-5 h-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-rs-text leading-snug">{s.name}</h3>
          <p className="text-sm text-rs-muted mt-0.5">
            {d !== null ? `${formatDistance(d)} · ` : ''}
            {s.locationName}
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <StatusPill tone={shelterTone(s)}>{SHELTER_STATUS_TEXT[s.status]}</StatusPill>
            {s.isAccessibleWheelchair && (
              <StatusPill tone="neutral">
                <WheelchairAccessibleIcon className="w-4 h-4" aria-hidden="true" />
                Wheelchair accessible
              </StatusPill>
            )}
            {s.hasLactatingStation && (
              <StatusPill tone="neutral">
                <Baby className="w-3.5 h-3.5 text-cyan-600" aria-hidden="true" />
                Lactating / Infant Station
              </StatusPill>
            )}
            {s.hasPetFriendlyZone && (
              <StatusPill tone="neutral">
                <PawPrint className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />
                Pet-Friendly
              </StatusPill>
            )}
            {s.hasMedicalOxygen && (
              <StatusPill tone="neutral">
                <Activity className="w-3.5 h-3.5 text-rose-600" aria-hidden="true" />
                Medical Oxygen
              </StatusPill>
            )}
          </div>
          <p className={cx('text-sm mt-2', stale ? 'text-rs-warning font-semibold' : 'text-rs-muted')}>
            {stale ? 'May be outdated — ' : ''}Checked {timeAgo(s.verifiedAt)} by {s.verifiedBy}
          </p>
        </div>
      </div>
      <div className="mt-2 flex justify-end">
        <LinkButton onClick={onDetails} aria-label={`View details for ${s.name}`}>
          View details
        </LinkButton>
      </div>
    </Card>
  );
};

export const ShelterDetailsDialog: React.FC<{
  shelter: Shelter | null;
  location: DeviceLocation | null;
  onClose: () => void;
  onViewMap: () => void;
}> = ({ shelter: s, location, onClose, onViewMap }) => {
  if (!s) return null;
  const d = shelterDistance(s, location);
  const stale = isStale(s.verifiedAt);
  const spacesLeft = Math.max(0, s.capacityTotal - s.capacityCurrent);
  return (
    <Dialog
      open={!!s}
      onClose={onClose}
      title={s.name}
      footer={
        <PrimaryButton full onClick={onViewMap}>
          <MapPin className="w-5 h-5" aria-hidden /> View on map
        </PrimaryButton>
      }
    >
      <div className="flex flex-wrap gap-2">
        <StatusPill tone={shelterTone(s)}>{SHELTER_STATUS_TEXT[s.status]}</StatusPill>
      </div>
      {stale && (
        <Notice tone="warning" title="This status may be outdated">
          It was last checked {timeAgo(s.verifiedAt)}. Capacity may have changed. Contact the shelter if you can.
        </Notice>
      )}
      <dl className="space-y-3 text-[15px]">
        <div>
          <dt className="text-rs-muted">Location</dt>
          <dd className="font-medium">
            {s.locationName}
            {d !== null && ` · ${formatDistance(d)} (straight line)`}
          </dd>
        </div>
        <div>
          <dt className="text-rs-muted">Latest known capacity</dt>
          <dd className="font-medium">
            {s.status === 'CLOSED'
              ? 'Closed'
              : `${s.capacityCurrent} of ${s.capacityTotal} places used · about ${spacesLeft} left`}
          </dd>
        </div>
        {(s.pwdCapacity !== undefined || s.petCapacity !== undefined) && (
          <div>
            <dt className="text-rs-muted">Dedicated special needs capacity</dt>
            <dd className="font-medium text-sm space-y-1 mt-1">
              {s.pwdCapacity !== undefined && (
                <div className="flex items-center justify-between p-2 rounded-lg bg-rs-tint/40 border border-rs-border">
                  <span className="flex items-center gap-1.5 text-rs-text">
                    <WheelchairAccessibleIcon className="w-4 h-4 text-rs-primary" /> PWD & Mobility Spaces:
                  </span>
                  <span className="font-bold text-rs-primary-dark">
                    {s.pwdCurrent || 0} of {s.pwdCapacity} used
                  </span>
                </div>
              )}
              {s.petCapacity !== undefined && (
                <div className="flex items-center justify-between p-2 rounded-lg bg-amber-50/60 border border-amber-200">
                  <span className="flex items-center gap-1.5 text-amber-900">
                    <PawPrint className="w-4 h-4 text-amber-600" /> Pet Sheltering Capacity:
                  </span>
                  <span className="font-bold text-amber-900">
                    {s.petCurrent || 0} of {s.petCapacity} pets sheltered
                  </span>
                </div>
              )}
            </dd>
          </div>
        )}
        <div>
          <dt className="text-rs-muted">Last checked</dt>
          <dd className="font-medium">
            {formatTime(s.verifiedAt)} by {s.verifiedBy}
          </dd>
        </div>
        <div>
          <dt className="text-rs-muted">Available here (as recorded)</dt>
          <dd>
            <ul className="mt-1 space-y-1.5">
              <Feature ok={s.isAccessibleWheelchair} icon={<WheelchairAccessibleIcon className="w-4 h-4" />} label="Wheelchair accessible" />
              <Feature ok={!!s.hasGroundFloorAccess} icon={<WheelchairAccessibleIcon className="w-4 h-4" />} label="Ground floor & ramp access" />
              <Feature ok={!!s.hasLactatingStation} icon={<Baby className="w-4 h-4" />} label="Lactating & infant feeding station" />
              <Feature ok={!!s.hasPetFriendlyZone} icon={<PawPrint className="w-4 h-4" />} label="Pet-friendly designated zone" />
              <Feature ok={!!s.hasMedicalOxygen} icon={<Activity className="w-4 h-4" />} label="Medical backup oxygen & nebulizer" />
              <Feature ok={s.hasPotableWater} icon={<PotableWaterIcon className="w-4 h-4" />} label="Drinking water" />
              <Feature ok={s.hasMedicalClinic} icon={<MedicalClinicIcon className="w-4 h-4" />} label="Medical station" />
              <Feature ok={s.hasBackupPower} icon={<BackupPowerIcon className="w-4 h-4" />} label="Backup power generator" />
            </ul>
          </dd>
        </div>
        {s.contactPhone && (
          <div>
            <dt className="text-rs-muted">Contact</dt>
            <dd className="font-medium">
              {s.contactPerson} ·{' '}
              <a className="text-rs-primary underline min-h-[44px] inline-flex items-center gap-1" href={`tel:${s.contactPhone.replace(/\s/g, '')}`}>
                <Phone className="w-4 h-4" aria-hidden />
                {s.contactPhone}
              </a>
            </dd>
          </div>
        )}
      </dl>
      <p className="text-sm text-rs-muted">
        Resilia cannot confirm that the route to this place is safe. Avoid flooded roads and follow local officials.
      </p>
    </Dialog>
  );
};

const Feature: React.FC<{ ok: boolean; icon: React.ReactNode; label: string }> = ({ ok, icon, label }) => (
  <li className={cx('flex items-center gap-2', ok ? 'text-rs-text' : 'text-rs-muted')}>
    <span aria-hidden>{icon}</span>
    {label}: <span className="font-semibold">{ok ? 'Yes' : 'No / not recorded'}</span>
  </li>
);

const resourceIcon = (r: Resource) =>
  r.category === 'WATER' ? (
    <PotableWaterIcon className="w-5 h-5" />
  ) : r.category === 'FOOD' ? (
    <FoodRationIcon className="w-5 h-5" />
  ) : r.category === 'MEDICINE' ? (
    <MedicalClinicIcon className="w-5 h-5" />
  ) : (
    <SuppliesPackageIcon className="w-5 h-5" />
  );

const RESOURCE_STATUS: Record<Resource['status'], { text: string; tone: 'success' | 'warning' | 'critical' | 'neutral' }> = {
  AVAILABLE: { text: 'Available', tone: 'success' },
  LOW: { text: 'Running low', tone: 'warning' },
  DEPLETED: { text: 'None left', tone: 'critical' },
  RESERVED: { text: 'Reserved', tone: 'neutral' },
};

export const ResourceRow: React.FC<{ resource: Resource; distanceText?: string }> = ({ resource: r, distanceText }) => {
  const stale = isStale(r.lastUpdated);
  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <span className="w-11 h-11 rounded-full bg-rs-tint text-rs-primary flex items-center justify-center shrink-0" aria-hidden>
          {resourceIcon(r)}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-rs-text leading-snug">{r.name}</h3>
          <p className="text-sm text-rs-muted mt-0.5">
            {distanceText ? `${distanceText} · ` : ''}
            {r.locationName}
          </p>
          <div className="mt-2">
            <StatusPill tone={RESOURCE_STATUS[r.status].tone}>{RESOURCE_STATUS[r.status].text}</StatusPill>
          </div>
          <p className={cx('text-sm mt-2', stale ? 'text-rs-warning font-semibold' : 'text-rs-muted')}>
            {stale ? 'May be outdated — ' : ''}Updated {timeAgo(r.lastUpdated)}
          </p>
        </div>
      </div>
    </Card>
  );
};
