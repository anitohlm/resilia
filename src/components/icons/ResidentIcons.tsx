/**
 * Resilia Resident Bespoke Icon System
 *
 * Designed specifically for the Resident Experience during disaster emergencies:
 * - High legibility, human, warm, and memorable under high stress.
 * - Bold silhouettes that remain unmistakable at both small (16-20px) and large (48-64px) sizes.
 * - Cohesive visual grammar: 24x24 viewBox, 2px stroke weight, rounded caps & joins,
 *   crisp pixel-aligned geometry, and semantic coloring support via `currentColor`.
 */

import React from 'react';

export interface ResidentIconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  size?: number | string;
}

/* ==========================================================================
   1. PRIMARY HOME ACTIONS & EMERGENCY BANNERS
   ========================================================================== */

/**
 * 1. Emergency Alert Icon
 * Distinctive hazard alert shield with exclamation pillar and beacon waves.
 * Instantly signals urgent official advisories without looking like a generic triangle.
 */
export const EmergencyAlertIcon: React.FC<ResidentIconProps> = ({
  className = '',
  size = 24,
  ...props
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={size}
    height={size}
    className={className}
    aria-hidden="true"
    {...props}
  >
    {/* Alert Shield with soft curves */}
    <path d="M12 2.5 C16.5 4.2 20.5 4.8 20.5 10 C20.5 16 16.5 20.2 12 22 C7.5 20.2 3.5 16 3.5 10 C3.5 4.8 7.5 4.2 12 2.5 Z" />
    {/* Exclamation Pillar */}
    <path d="M12 7.5 V13" strokeWidth="2.5" />
    {/* Exclamation Dot */}
    <circle cx="12" cy="16.75" r="1.25" fill="currentColor" stroke="none" />
  </svg>
);

/**
 * 2. GET HELP Icon (Rescue Lifebuoy with Heart / Caring Lifeline)
 * Warm, instantly recognizable emergency rescue life preserver with reflective bands
 * and tether ropes. In floods, typhoons, and collapses, a lifebuoy is universally understood.
 */
export const GetHelpIcon: React.FC<ResidentIconProps> = ({
  className = '',
  size = 24,
  ...props
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={size}
    height={size}
    className={className}
    aria-hidden="true"
    {...props}
  >
    {/* Outer Buoy Ring */}
    <circle cx="12" cy="12" r="9" />
    {/* Inner Core */}
    <circle cx="12" cy="12" r="4.25" />
    {/* 4 Straps / High-visibility reflective bands */}
    <path d="M12 3 V7.75" />
    <path d="M12 16.25 V21" />
    <path d="M3 12 H7.75" />
    <path d="M16.25 12 H21" />
    {/* Perfectly centered, symmetrical compassionate lifeline heart */}
    <path
      d="M12 14.5 C10.5 13.5 9.5 12.2 9.5 11 C9.5 9.9 10.4 9.2 11.3 9.2 C11.8 9.2 12 9.5 12 9.7 C12 9.5 12.2 9.2 12.7 9.2 C13.6 9.2 14.5 9.9 14.5 11 C14.5 12.2 13.5 13.5 12 14.5 Z"
      fill="currentColor"
      stroke="none"
    />
  </svg>
);

/**
 * 3. FIND A SAFE PLACE Icon (Shelter Haven / Sanctuary)
 * A protective haven canopy with welcoming open doorway and safety beacon star.
 * Replaces impersonal corporate skyscrapers with a safe community sanctuary.
 */
export const FindSafePlaceIcon: React.FC<ResidentIconProps> = ({
  className = '',
  size = 24,
  ...props
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={size}
    height={size}
    className={className}
    aria-hidden="true"
    {...props}
  >
    {/* Safe Haven Roof Overhang */}
    <path d="M2.5 10.5 L12 3 L21.5 10.5" />
    {/* Sturdy Structure Walls */}
    <path d="M5 9.5 V20.5 C5 21.05 5.45 21.5 6 21.5 H18 C18.55 21.5 19 21.05 19 20.5 V9.5" />
    {/* Welcoming Open Archway Door */}
    <path d="M9.5 21.5 V15 C9.5 13.6 10.6 12.5 12 12.5 C13.4 12.5 14.5 13.6 14.5 15 V21.5" />
    {/* Beacon Star of Safety above the door */}
    <path d="M12 6.5 V8.5 M11 7.5 H13" strokeWidth="2.2" />
  </svg>
);

/**
 * 4. REPORT A PROBLEM Icon (Road & Street Hazard Warning Cone with Alert Flare)
 * Represents immediate street hazards: flooding, debris, blocked roads, live wires.
 * Distinctive, memorable, and clearly actionable.
 */
export const ReportProblemIcon: React.FC<ResidentIconProps> = ({
  className = '',
  size = 24,
  ...props
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={size}
    height={size}
    className={className}
    aria-hidden="true"
    {...props}
  >
    {/* Ground Baseline / Stand */}
    <path d="M3.5 21 H20.5" strokeWidth="2.5" />
    {/* Symmetrically Centered Cone Body */}
    <path d="M6.5 21 L10.8 4.3 C11.1 3.2 12.9 3.2 13.2 4.3 L17.5 21" />
    {/* High-visibility Reflective Stripe 1 */}
    <path d="M8 15.5 H16" />
    {/* High-visibility Reflective Stripe 2 */}
    <path d="M9.5 10.5 H14.5" />
    {/* Centered Top Alert Beacon Flare */}
    <circle cx="12" cy="2.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);

/**
 * 5. MARK ME SAFE Icon (Family & Resident Safety Check-In)
 * A reassuring resident profile embracing a bright verification checkmark seal.
 * Gives comfort and certainty: "My family is accounted for, I am safe."
 */
export const MarkSafeIcon: React.FC<ResidentIconProps> = ({
  className = '',
  size = 24,
  ...props
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={size}
    height={size}
    className={className}
    aria-hidden="true"
    {...props}
  >
    {/* Person Head */}
    <circle cx="9" cy="7.5" r="3.75" />
    {/* Reassuring Person Shoulders */}
    <path d="M2.5 20.5 C2.5 16.5 5.8 13.5 9.5 13.5 C11 13.5 12.3 14 13.3 14.8" />
    {/* Prominent Verification Seal */}
    <circle cx="16.75" cy="15.75" r="4.75" />
    {/* Clear Success Checkmark */}
    <path d="M14.5 15.75 L16 17.25 L19.25 14" strokeWidth="2.3" />
  </svg>
);

/**
 * 6. 72-Hour Evacuation Go-Bag Icon (Emergency Survival Backpack)
 * A true emergency survival backpack: top carry handle, curved body,
 * zippered front pouch with first-aid cross, and side gear pockets.
 * Replaces generic cardboard packages with an unmistakable survival go-bag.
 */
export const GoBagIcon: React.FC<ResidentIconProps> = ({
  className = '',
  size = 24,
  ...props
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={size}
    height={size}
    className={className}
    aria-hidden="true"
    {...props}
  >
    {/* Top Carry Handle */}
    <path d="M9 5 C9 3.6 10.3 2.5 12 2.5 C13.7 2.5 15 3.6 15 5" />
    {/* Main Pack Body */}
    <rect x="5" y="5" width="14" height="16" rx="3.5" />
    {/* Upper Compartment Zipper */}
    <path d="M5 9.5 H19" />
    {/* Lower Gear Pocket */}
    <rect x="7.5" y="12.5" width="9" height="6.5" rx="2" />
    {/* First-Aid / Survival Cross on Front Pouch */}
    <path d="M12 14.25 V17.25" strokeWidth="2.2" />
    <path d="M10.5 15.75 H13.5" strokeWidth="2.2" />
    {/* Left Side Water Bottle / Gear Loop */}
    <path d="M5 10.5 H3.75 C3.05 10.5 2.5 11.05 2.5 11.75 V15.25 C2.5 15.95 3.05 16.5 3.75 16.5 H5" />
    {/* Right Side Flashlight / Gear Loop */}
    <path d="M19 10.5 H20.25 C20.95 10.5 21.5 11.05 21.5 11.75 V15.25 C21.5 15.95 20.95 16.5 20.25 16.5 H19" />
  </svg>
);


/* ==========================================================================
   2. RESIDENT BOTTOM NAVIGATION & APP BAR ICONS
   ========================================================================== */

/**
 * Resident Nav: Home
 * Cozy, safe haven house with warm open door and solid hearth.
 */
export const ResidentNavHomeIcon: React.FC<ResidentIconProps> = ({
  className = '',
  size = 24,
  ...props
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={size}
    height={size}
    className={className}
    aria-hidden="true"
    {...props}
  >
    <path d="M3 10.5 L12 3 L21 10.5" />
    <path d="M5.5 9.5 V19.5 C5.5 20.6 6.4 21.5 7.5 21.5 H16.5 C17.6 21.5 18.5 20.6 18.5 19.5 V9.5" />
    <path d="M10 21.5 V15 H14 V21.5" />
  </svg>
);

/**
 * Resident Nav: Map
 * Folded offline topography emergency map with clear safe beacon pin.
 */
export const ResidentNavMapIcon: React.FC<ResidentIconProps> = ({
  className = '',
  size = 24,
  ...props
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={size}
    height={size}
    className={className}
    aria-hidden="true"
    {...props}
  >
    <path d="M3 6.5 L8.5 3.5 L15.5 6.5 L21 3.5 V17.5 L15.5 20.5 L8.5 17.5 L3 20.5 Z" />
    <path d="M8.5 3.5 V17.5" />
    <path d="M15.5 6.5 V20.5" />
    {/* Center Map Pin */}
    <circle cx="12" cy="11" r="1.5" fill="currentColor" stroke="none" />
  </svg>
);

/**
 * Resident Nav: Updates & Broadcasts
 * Resilient emergency broadcast bell with acoustic alert rings.
 */
export const ResidentNavUpdatesIcon: React.FC<ResidentIconProps> = ({
  className = '',
  size = 24,
  ...props
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={size}
    height={size}
    className={className}
    aria-hidden="true"
    {...props}
  >
    <path d="M18 8 A6 6 0 0 0 6 8 C6 14 3.5 16 3.5 16 H20.5 C20.5 16 18 14 18 8 Z" />
    <path d="M10.25 19.5 C10.6 20.4 11.2 21 12 21 C12.8 21 13.4 20.4 13.75 19.5" />
    {/* Alert Radio Waves at top right */}
    <path d="M19 4 A4 4 0 0 1 22 7" strokeWidth="1.8" />
  </svg>
);

/**
 * Resident Nav: More / Tools
 * Clean 4-petal emergency utility hub with soft rounded contours.
 */
export const ResidentNavMoreIcon: React.FC<ResidentIconProps> = ({
  className = '',
  size = 24,
  ...props
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={size}
    height={size}
    className={className}
    aria-hidden="true"
    {...props}
  >
    <rect x="4" y="4" width="6.5" height="6.5" rx="2" />
    <rect x="13.5" y="4" width="6.5" height="6.5" rx="2" />
    <rect x="4" y="13.5" width="6.5" height="6.5" rx="2" />
    <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="2" />
  </svg>
);


/* ==========================================================================
   3. SHELTER & RESOURCE AMENITIES (NEARBY HELP)
   ========================================================================== */

/**
 * Drinking Water / Potable Water
 * Crisp water drop with life ripple.
 */
export const PotableWaterIcon: React.FC<ResidentIconProps> = ({
  className = '',
  size = 24,
  ...props
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={size}
    height={size}
    className={className}
    aria-hidden="true"
    {...props}
  >
    <path d="M12 2.5 C12 2.5 5.5 10.5 5.5 15.5 C5.5 19.1 8.4 22 12 22 C15.6 22 18.5 19.1 18.5 15.5 C18.5 10.5 12 2.5 12 2.5 Z" />
    {/* Fresh light shine */}
    <path d="M9.5 15 C9.5 13.5 10.5 11.5 12 10" strokeWidth="1.8" />
  </svg>
);

/**
 * Food Rations / Nutrition Packs
 * Warm relief bowl with steaming hot ration spoon.
 */
export const FoodRationIcon: React.FC<ResidentIconProps> = ({
  className = '',
  size = 24,
  ...props
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={size}
    height={size}
    className={className}
    aria-hidden="true"
    {...props}
  >
    {/* Relief bowl */}
    <path d="M3.5 10.5 H20.5 C20.5 15.5 17 19.5 12 19.5 C7 19.5 3.5 15.5 3.5 10.5 Z" />
    {/* Bowl base */}
    <path d="M8.5 19.5 L8 21.5 H16 L15.5 19.5" />
    {/* Warm steam ripples */}
    <path d="M8 4.5 C7.5 5.5 7.5 6.5 8 7.5" />
    <path d="M12 3.5 C11.5 4.8 11.5 6.2 12 7.5" />
    <path d="M16 4.5 C15.5 5.5 15.5 6.5 16 7.5" />
  </svg>
);

/**
 * Medical Clinic & Medicine
 * Professional first-aid kit with distinctive medical cross.
 */
export const MedicalClinicIcon: React.FC<ResidentIconProps> = ({
  className = '',
  size = 24,
  ...props
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={size}
    height={size}
    className={className}
    aria-hidden="true"
    {...props}
  >
    {/* Grab Handle */}
    <path d="M9 6 V4 C9 3.4 9.5 3 10.1 3 H13.9 C14.5 3 15 3.4 15 4 V6" />
    {/* Kit Box */}
    <rect x="3.5" y="6" width="17" height="15" rx="3" />
    {/* Medical Cross */}
    <path d="M12 9.5 V16.5" strokeWidth="2.4" />
    <path d="M8.5 13 H15.5" strokeWidth="2.4" />
  </svg>
);

/**
 * Backup Power & Generator
 * Sturdy generator battery with energy lightning pulse.
 */
export const BackupPowerIcon: React.FC<ResidentIconProps> = ({
  className = '',
  size = 24,
  ...props
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={size}
    height={size}
    className={className}
    aria-hidden="true"
    {...props}
  >
    {/* Battery / Generator Chassis */}
    <rect x="4" y="6" width="16" height="14" rx="2.5" />
    {/* Battery Terminals */}
    <path d="M8 3.5 V6 M16 3.5 V6" strokeWidth="2.2" />
    {/* Energy Lightning Bolt */}
    <path d="M12.5 9.5 L9.5 13.5 H13.5 L11.5 17.5" strokeWidth="2.2" />
  </svg>
);

/**
 * Wheelchair Accessibility
 * Modern, respectful accessibility icon with active posture.
 */
export const WheelchairAccessibleIcon: React.FC<ResidentIconProps> = ({
  className = '',
  size = 24,
  ...props
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={size}
    height={size}
    className={className}
    aria-hidden="true"
    {...props}
  >
    {/* Person Head */}
    <circle cx="12" cy="4" r="2" />
    {/* Back & Torso */}
    <path d="M12 6.5 V12 L15.5 14.5" />
    {/* Extended Arm */}
    <path d="M8.5 10.5 H14" />
    {/* Wheelchair Wheel */}
    <path d="M6.5 15.5 C6.5 18.5 9 21 12 21 C14.5 21 16.7 19.3 17.3 17" />
    {/* Footrest bar */}
    <path d="M15.5 17 H18" />
  </svg>
);

/**
 * General Relief Supplies Package
 * Durable emergency parcel sealed with safety band.
 */
export const SuppliesPackageIcon: React.FC<ResidentIconProps> = ({
  className = '',
  size = 24,
  ...props
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={size}
    height={size}
    className={className}
    aria-hidden="true"
    {...props}
  >
    <path d="M12 3 L21 7.5 V16.5 L12 21 L3 16.5 V7.5 Z" />
    <path d="M12 12 L21 7.5 M12 12 L3 7.5 M12 12 V21" />
  </svg>
);


/* ==========================================================================
   4. HAZARD & REPORTING TYPES (RESIDENT REPORT A PROBLEM)
   ========================================================================== */

/**
 * Flooding Hazard
 * Strong rising flood waves with water level surge marker.
 */
export const FloodHazardIcon: React.FC<ResidentIconProps> = ({
  className = '',
  size = 24,
  ...props
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={size}
    height={size}
    className={className}
    aria-hidden="true"
    {...props}
  >
    {/* House roof submerged */}
    <path d="M6 9 L12 4 L18 9" />
    <path d="M8 8 V6 H10" />
    {/* Upper Flood Wave */}
    <path d="M2.5 13.5 C5 11.5 7.5 11.5 10 13.5 C12.5 15.5 15 15.5 17.5 13.5 C20 11.5 21.5 12 22.5 13.5" />
    {/* Lower Flood Wave */}
    <path d="M2.5 18.5 C5 16.5 7.5 16.5 10 18.5 C12.5 20.5 15 20.5 17.5 18.5 C20 16.5 21.5 17 22.5 18.5" />
  </svg>
);

/**
 * Road Blocked Hazard
 * Road barrier with diagonal hazard warning stripes.
 */
export const RoadBlockedIcon: React.FC<ResidentIconProps> = ({
  className = '',
  size = 24,
  ...props
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={size}
    height={size}
    className={className}
    aria-hidden="true"
    {...props}
  >
    {/* Road Surface */}
    <path d="M4 20 L7.5 4 H16.5 L20 20" strokeDasharray="3 3" />
    {/* Heavy Detour Barrier */}
    <rect x="3" y="10" width="18" height="6" rx="1.5" />
    {/* Barrier legs */}
    <path d="M6 16 V20 M18 16 V20" strokeWidth="2.5" />
    {/* Barrier warning stripes */}
    <path d="M8 10 L6.5 16 M13 10 L11.5 16 M18 10 L16.5 16" />
  </svg>
);

/**
 * Building Damage Hazard
 * Fractured structure wall with warning fissure.
 */
export const BuildingDamageIcon: React.FC<ResidentIconProps> = ({
  className = '',
  size = 24,
  ...props
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={size}
    height={size}
    className={className}
    aria-hidden="true"
    {...props}
  >
    <path d="M3 21 H21" />
    <path d="M5 21 V5 C5 3.9 5.9 3 7 3 H17 C18.1 3 19 3.9 19 5 V21" />
    {/* Jagged crack through wall */}
    <path d="M12 3 L10 9 L14 13 L11 18 L13 21" strokeWidth="2.2" />
    {/* Intact windows */}
    <rect x="7" y="7" width="2" height="3" />
    <rect x="15" y="7" width="2" height="3" />
  </svg>
);

/**
 * Fire Hazard
 * Vivid emergency flame with core ember.
 */
export const FireHazardIcon: React.FC<ResidentIconProps> = ({
  className = '',
  size = 24,
  ...props
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={size}
    height={size}
    className={className}
    aria-hidden="true"
    {...props}
  >
    {/* Main Fire Flame Silhouette */}
    <path d="M12 2 C10.5 5 7 8 7 13 C7 17.5 9.5 21.5 12 21.5 C14.5 21.5 17 17.5 17 13 C17 8 13.5 5 12 2 Z" />
    {/* Inner Ember Heart */}
    <path d="M12 11.5 C11 13 10 14.5 10 16.5 C10 18 10.9 19 12 19 C13.1 19 14 18 14 16.5 C14 14.5 13 13 12 11.5 Z" />
  </svg>
);

/**
 * Power Outage Hazard
 * Severed lightning bolt / blackout surge.
 */
export const PowerOutageIcon: React.FC<ResidentIconProps> = ({
  className = '',
  size = 24,
  ...props
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={size}
    height={size}
    className={className}
    aria-hidden="true"
    {...props}
  >
    {/* Lightning bolt broken across diagonal strike */}
    <path d="M12.5 2 L6 13 H12 L10 22 L17.5 11 H12.5 L14.5 6" />
    {/* Disconnect strike line */}
    <path d="M3 3 L21 21" strokeWidth="2.4" />
  </svg>
);

/**
 * Medical Emergency Hazard
 * Heart lifeline pulse with urgent medical cross beacon.
 */
export const MedicalEmergencyIcon: React.FC<ResidentIconProps> = ({
  className = '',
  size = 24,
  ...props
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={size}
    height={size}
    className={className}
    aria-hidden="true"
    {...props}
  >
    {/* Heartbeat pulse waveform */}
    <path d="M2 13 H6 L8.5 7 L12.5 19 L15 13 H18" strokeWidth="2.2" />
    {/* Distinctive Medical First Aid Cross Badge */}
    <path d="M20.5 3 V9 M17.5 6 H23.5" strokeWidth="2.4" />
  </svg>
);

/**
 * Typhoon / Cyclone
 * Distinctive tropical hurricane eye and spiral bands.
 */
export const TyphoonHazardIcon: React.FC<ResidentIconProps> = ({
  className = '',
  size = 24,
  ...props
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={size}
    height={size}
    className={className}
    aria-hidden="true"
    {...props}
  >
    {/* Cyclone Eye */}
    <circle cx="12" cy="12" r="3.2" />
    {/* Spiral Arm 1 */}
    <path d="M12 5.5 C16 5.5 19.5 8.5 19.5 12.5 C19.5 15.5 18 18.5 15 20.5 C13 21.8 10 22 7.5 21" />
    {/* Spiral Arm 2 */}
    <path d="M12 18.5 C8 18.5 4.5 15.5 4.5 11.5 C4.5 8.5 6 5.5 9 3.5 C11 2.2 14 2 16.5 3" />
  </svg>
);

/**
 * Earthquake / Seismic Ground Fissure
 */
export const EarthquakeHazardIcon: React.FC<ResidentIconProps> = ({
  className = '',
  size = 24,
  ...props
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={size}
    height={size}
    className={className}
    aria-hidden="true"
    {...props}
  >
    <path d="M3 12 H6 L8.5 7 L12 17 L15.5 9 L18 12 H21" />
    <path d="M4 18 L7 16 L10 19 L14 15 L17 19 L20 17" strokeDasharray="2 2" />
  </svg>
);

/**
 * Landslide Hazard
 * Mountain slope with falling debris boulders.
 */
export const LandslideHazardIcon: React.FC<ResidentIconProps> = ({
  className = '',
  size = 24,
  ...props
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={size}
    height={size}
    className={className}
    aria-hidden="true"
    {...props}
  >
    {/* Ground baseline */}
    <path d="M2 21 H22" />
    {/* Mountain Cliff Slope on right with jagged fracture */}
    <path d="M11 21 L16 12 L14 8 L18 3 H22 V21" />
    {/* Falling Boulders tumbling down the slope */}
    <circle cx="8" cy="17" r="2.2" />
    <circle cx="11.5" cy="9.5" r="1.8" />
    {/* Slide motion trail lines */}
    <path d="M4 19 L6 19 M7 13 L9 15" strokeWidth="1.8" />
  </svg>
);

/**
 * Volcano Eruption Hazard
 * Volcano crater with rising explosive ash plume.
 */
export const VolcanoHazardIcon: React.FC<ResidentIconProps> = ({
  className = '',
  size = 24,
  ...props
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={size}
    height={size}
    className={className}
    aria-hidden="true"
    {...props}
  >
    {/* Volcano Cone */}
    <path d="M2.5 21 L8.5 10 H15.5 L21.5 21 Z" />
    <path d="M8.5 10 C10 11.5 14 11.5 15.5 10" />
    {/* Ash Plume */}
    <path d="M12 2 C10 2 8.5 3.5 9 5.5 C8 6.5 8 8 9.5 9 H14.5 C16 8 16 6.5 15 5.5 C15.5 3.5 14 2 12 2 Z" />
  </svg>
);

/**
 * Tsunami / Coastal Storm Surge
 * Towering cresting ocean wave over seawall.
 */
export const TsunamiHazardIcon: React.FC<ResidentIconProps> = ({
  className = '',
  size = 24,
  ...props
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={size}
    height={size}
    className={className}
    aria-hidden="true"
    {...props}
  >
    <path d="M2 20 C6 20 9 18 11.5 15 C14 12 16 9 18.5 9 C20 9 21.2 9.8 21.5 11 C21.8 12.2 20.8 13.5 19.5 13.5 C18 13.5 17.5 12 16.5 12 C15 12 13 14.5 11 17 C9 19.5 6 20 2 20 Z" />
    <path d="M2 21 H22" />
  </svg>
);

/**
 * Person in Distress / SOS
 * Human figure with raised waving arms for emergency rescue.
 */
export const PersonDistressIcon: React.FC<ResidentIconProps> = ({
  className = '',
  size = 24,
  ...props
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={size}
    height={size}
    className={className}
    aria-hidden="true"
    {...props}
  >
    <circle cx="12" cy="5" r="2.5" />
    <path d="M12 7.5 V15 M12 15 L8.5 21 M12 15 L15.5 21" />
    {/* Raised Waving Distress Arms */}
    <path d="M5 8.5 L9 11 L12 9.5 L15 11 L19 8.5" strokeWidth="2.3" />
  </svg>
);

/**
 * Other / General Emergency Question or Hazard
 */
export const OtherHazardIcon: React.FC<ResidentIconProps> = ({
  className = '',
  size = 24,
  ...props
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={size}
    height={size}
    className={className}
    aria-hidden="true"
    {...props}
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M12 13 C12 11.5 13.5 10.8 14 10 C14.5 9.2 14.5 8 13.5 7.2 C12.5 6.5 11 6.8 10.2 7.8" />
    <circle cx="12" cy="16.5" r="1.1" fill="currentColor" stroke="none" />
  </svg>
);


/* ==========================================================================
   5. UTILITY & SECONDARY ACTIONS (MORE SCREEN, DIALOGS)
   ========================================================================== */

/**
 * Emergency Hotlines & Direct Call
 * Landline telephone handset with emergency broadcast radio waves.
 */
export const EmergencyPhoneIcon: React.FC<ResidentIconProps> = ({
  className = '',
  size = 24,
  ...props
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={size}
    height={size}
    className={className}
    aria-hidden="true"
    {...props}
  >
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    {/* Urgent Broadcast Rings */}
    <path d="M14 3.5 A5 5 0 0 1 20.5 10" strokeWidth="1.8" />
    <path d="M14 7 A2.5 2.5 0 0 1 17 10" strokeWidth="1.8" />
  </svg>
);

/**
 * Offline Sync Center
 * Sync nodes communicating directly via offline mesh radio.
 */
export const OfflineSyncIcon: React.FC<ResidentIconProps> = ({
  className = '',
  size = 24,
  ...props
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={size}
    height={size}
    className={className}
    aria-hidden="true"
    {...props}
  >
    <path d="M21 12 A9 9 0 0 0 6 5.3 L3 8" />
    <path d="M3 3 V8 H8" />
    <path d="M3 12 A9 9 0 0 0 18 18.7 L21 16" />
    <path d="M21 21 V16 H16" />
    <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
  </svg>
);

/**
 * Ask Resilia AI Companion
 * Friendly intelligent beacon spark.
 */
export const AskResiliaIcon: React.FC<ResidentIconProps> = ({
  className = '',
  size = 24,
  ...props
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={size}
    height={size}
    className={className}
    aria-hidden="true"
    {...props}
  >
    {/* Central 4-pointed radiant star */}
    <path d="M12 3 C12 7.5 13.5 9 18 9 C13.5 9 12 10.5 12 15 C12 10.5 10.5 9 6 9 C10.5 9 12 7.5 12 3 Z" />
    {/* Secondary friendly spark */}
    <path d="M18.5 15 C18.5 17 19.5 17.5 21 17.5 C19.5 17.5 18.5 18 18.5 20 C18.5 18 17.5 17.5 16 17.5 C17.5 17.5 18.5 17 18.5 15 Z" />
  </svg>
);

/**
 * Responder Helmet (Switch to Field Responder Mode)
 * Sturdy civil defense safety hard hat with headlamp.
 */
export const ResponderHelmetIcon: React.FC<ResidentIconProps> = ({
  className = '',
  size = 24,
  ...props
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={size}
    height={size}
    className={className}
    aria-hidden="true"
    {...props}
  >
    {/* Helmet Brim */}
    <path d="M2 18 H22" strokeWidth="2.5" />
    {/* Helmet Dome */}
    <path d="M4 18 C4 11 7 6 12 6 C17 6 20 11 20 18" />
    {/* Front Mounted Rescue Headlamp */}
    <rect x="10" y="4" width="4" height="4" rx="1" />
  </svg>
);

/**
 * Evacuation Transportation
 * Emergency shuttle vehicle.
 */
export const EvacuationTransportIcon: React.FC<ResidentIconProps> = ({
  className = '',
  size = 24,
  ...props
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={size}
    height={size}
    className={className}
    aria-hidden="true"
    {...props}
  >
    {/* Vehicle Roof and Upper Body */}
    <path d="M3 16 V6 C3 4.9 3.9 4 5 4 H12 L15 8 H19 C20.1 8 21 8.9 21 10 V16" />
    {/* Undercarriage Chassis with Wheel Arches */}
    <path d="M3 16 H4.5 M9.5 16 H14.5 M19.5 16 H21" />
    {/* Windows */}
    <path d="M6 8 H10 V11 H6 Z" />
    <path d="M12 8 H15 L17 11 H12 Z" />
    {/* Wheels */}
    <circle cx="7" cy="17" r="2.5" />
    <circle cx="17" cy="17" r="2.5" />
  </svg>
);

/**
 * Resilia Brand Shield Logo
 * Bespoke resilient shield emblem with protective canopy and connectivity wave core,
 * matching the Resilia app emblem.
 */
export const ResiliaBrandIcon: React.FC<ResidentIconProps> = ({
  className = '',
  size = 24,
  ...props
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={size}
    height={size}
    className={className}
    aria-hidden="true"
    {...props}
  >
    {/* Protective Outer Shield */}
    <path d="M12 2.5 C16.5 4.2 20.5 4.8 20.5 10 C20.5 16 16.5 20.2 12 22 C7.5 20.2 3.5 16 3.5 10 C3.5 4.8 7.5 4.2 12 2.5 Z" />
    {/* Protective Haven Canopy */}
    <path d="M8.5 8.5 L12 5.5 L15.5 8.5" />
    {/* Resilient Mesh Wave */}
    <path d="M9 12 C10.5 11 13.5 11 15 12" />
    {/* Resilient Core */}
    <circle cx="12" cy="15.5" r="1.5" fill="currentColor" stroke="none" />
  </svg>
);
