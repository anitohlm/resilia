/**
 * Resilia Screen 1: Home / Community Dashboard
 * Redesigned with Senior UI/UX & DRRM Operational Principles:
 * - At a glance layout for citizens and responders
 * - Interactive, prominent Disaster Advisory Banner for disasters in their area (clickable with emergency action cockpit)
 * - Rapid, direct emergency reporting directly on this screen for Residents
 * - Instant assigned incident dispatches for Responders with 1-click transit & resolution workflows
 * - Real-time Marikina River telemetry & IndexedDB local-first storage
 */

import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  Building2,
  Camera,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  Compass,
  Database,
  Droplets,
  FileCheck2,
  Flame,
  HeartHandshake,
  HelpCircle,
  Layers,
  MapPin,
  Navigation,
  Package,
  PhoneCall,
  Radio,
  RefreshCw,
  Send,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Truck,
  UserCheck,
  Users,
  Volume2,
  VolumeX,
  Waves,
  Wind,
  X,
} from 'lucide-react';
import {
  Alert,
  AssistanceRequest,
  Community,
  ConnectivityStatus,
  Incident,
  IncidentSeverity,
  IncidentType,
  Mission,
  Resource,
  ResponderOperationalStatus,
  Shelter,
} from '../types';
import { ScreenId } from '../components/layout/Navbar';
import { syncClient } from '../services/offline/syncClient';
import { useAuth } from '../services/auth/authContext';
import { IncidentRepository } from '../services/repositories';
import { emergencyAudio } from '../services/audio/emergencyAudio';
import { safetyCheckInService } from '../services/safety/safetyCheckInService';
import { SafetyCheckInModal } from '../components/safety/SafetyCheckInModal';
import { GoBagChecklistModal } from '../components/safety/GoBagChecklistModal';
import { GoBagChecklistCard } from '../components/safety/GoBagChecklistCard';
import { EmergencyHotlinesModal } from '../components/safety/EmergencyHotlinesModal';
import { useToast } from '../components/common/Toast';

interface HomeScreenProps {
  community: Community | null;
  alerts: Alert[];
  shelters: Shelter[];
  incidents: Incident[];
  assistanceRequests: AssistanceRequest[];
  missions?: Mission[];
  resources: Resource[];
  onNavigate: (screen: ScreenId) => void;
  pendingSyncCount: number;
  onDataChanged?: () => void;
}

const DISASTER_QUICK_TYPES: {
  type: IncidentType;
  label: string;
  icon: any;
  defaultSeverity: IncidentSeverity;
  hint: string;
}[] = [
  {
    type: 'FLOOD',
    label: 'Flood & River Surge',
    icon: Waves,
    defaultSeverity: 'HIGH',
    hint: 'Rising water, riverbank overtopping, gutter-to-waist flooding',
  },
  {
    type: 'EARTHQUAKE',
    label: 'Earthquake & Tremor',
    icon: Activity,
    defaultSeverity: 'CRITICAL',
    hint: 'Ground shaking, building cracks, wall collapse, fault activity',
  },
  {
    type: 'ROAD_BLOCKED',
    label: 'Road Impassable',
    icon: AlertTriangle,
    defaultSeverity: 'HIGH',
    hint: 'Submerged roads, fallen trees, debris preventing emergency vehicles',
  },
  {
    type: 'MEDICAL_EMERGENCY',
    label: 'Medical / Trapped',
    icon: ShieldAlert,
    defaultSeverity: 'CRITICAL',
    hint: 'Injured persons, citizens trapped in structures or floodwaters',
  },
  {
    type: 'PERSON_IN_DISTRESS',
    label: 'Person in Distress',
    icon: HeartHandshake,
    defaultSeverity: 'CRITICAL',
    hint: 'Stranded citizens, elderly/children trapped, urgent evacuation needed',
  },
  {
    type: 'FIRE',
    label: 'Fire Outbreak',
    icon: Flame,
    defaultSeverity: 'CRITICAL',
    hint: 'Active urban fire, electrical sparks, short circuits',
  },
  {
    type: 'VOLCANO_ERUPTION',
    label: 'Volcano Eruption',
    icon: Flame,
    defaultSeverity: 'CRITICAL',
    hint: 'PHIVOLCS alert level, heavy ashfall, volcanic tremors, lahar hazard',
  },
  {
    type: 'TSUNAMI',
    label: 'Tsunami & Coastal Surge',
    icon: Waves,
    defaultSeverity: 'CRITICAL',
    hint: 'Rapid sea recession, towering tsunami wave surge, coastal inundation, immediate high-ground evacuation',
  },
  {
    type: 'TYPHOON',
    label: 'Typhoon / Strong Winds',
    icon: Wind,
    defaultSeverity: 'HIGH',
    hint: 'Gale winds, flying debris, fallen electric poles',
  },
];

const PRESET_LOCATIONS = [
  'Purok 4, Tumana Dike Side',
  'J.P. Rizal St., Malanday',
  'Sto. Niño Lowland Sector',
  'Tumana Bridge West Approach',
  'Alley 3, Brgy. Malanday',
  'Bulelak Covered Court Area',
];

const PHOTO_PRESETS = [
  { label: 'Flood Surge', url: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=800&q=80' },
  { label: 'Volcano Ashfall', url: 'https://images.unsplash.com/photo-1542385151-efd9000785a0?auto=format&fit=crop&w=800&q=80' },
  { label: 'Quake Damage', url: 'https://images.unsplash.com/photo-1590247813693-5541d1c609fd?auto=format&fit=crop&w=800&q=80' },
  { label: 'Road Debris', url: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=800&q=80' },
];

export const HomeScreen: React.FC<HomeScreenProps> = ({
  community,
  alerts,
  shelters,
  incidents,
  assistanceRequests,
  missions = [],
  resources,
  onNavigate,
  pendingSyncCount,
  onDataChanged,
}) => {
  const { currentUser, setRole } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();
  const [connectivity, setConnectivity] = useState<ConnectivityStatus>(syncClient.getStatus());
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(syncClient.getLastSyncTime());

  // Clickable Disaster Protocol Drawer/Modal State
  const [isDisasterModalOpen, setIsDisasterModalOpen] = useState(false);
  // Community Status At A Glance collapsible dropdown state
  const [isCommunityStatusOpen, setIsCommunityStatusOpen] = useState(true);
  // Report Hazard In Your Area collapsible dropdown state
  const [isReportHazardOpen, setIsReportHazardOpen] = useState(true);

  // Quick Win DR Operational Modals & Siren State
  const [isSafetyCheckInOpen, setIsSafetyCheckInOpen] = useState(false);
  const [isGoBagOpen, setIsGoBagOpen] = useState(false);
  const [isHotlinesOpen, setIsHotlinesOpen] = useState(false);
  const [isSirenPlaying, setIsSirenPlaying] = useState(false);
  const [safetyStats, setSafetyStats] = useState(safetyCheckInService.getSummaryStats());

  // Quick Report Incident State (Right on this screen)
  const [reportType, setReportType] = useState<IncidentType>('FLOOD');
  const [reportLocation, setReportLocation] = useState('Purok 4, Tumana Dike Side');
  const [reportDescription, setReportDescription] = useState('');
  const [reportFloodDepth, setReportFloodDepth] = useState<number>(100);
  const [reportEarthquakeIntensity, setReportEarthquakeIntensity] = useState<number>(7);
  const [reportTrappedCount, setReportTrappedCount] = useState<number>(0);
  const [reportVolcanoAlertLevel, setReportVolcanoAlertLevel] = useState<number>(3);
  const [reportAshfall, setReportAshfall] = useState<'LIGHT' | 'MODERATE' | 'HEAVY'>('MODERATE');
  const [reportPhotoUrl, setReportPhotoUrl] = useState<string>('');
  const [reportSeverity, setReportSeverity] = useState<IncidentSeverity>('HIGH');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportSuccessMessage, setReportSuccessMessage] = useState<string | null>(null);
  const [submittedQuickIncident, setSubmittedQuickIncident] = useState<Incident | null>(null);
  const [reportErrorMessage, setReportErrorMessage] = useState<string | null>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setReportPhotoUrl(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Responder status update in-flight state & resolution modal
  const [resolvingIncident, setResolvingIncident] = useState<Incident | null>(null);
  const [resolutionNoteInput, setResolutionNoteInput] = useState('');
  const [isUpdatingResponderStatus, setIsUpdatingResponderStatus] = useState(false);
  const [responderFeedback, setResponderFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  useEffect(() => {
    const unsub = syncClient.subscribe((status) => {
      setConnectivity(status);
      setLastSyncTime(syncClient.getLastSyncTime());
    });

    const handleSafetyUpdate = () => {
      setSafetyStats(safetyCheckInService.getSummaryStats());
    };
    window.addEventListener('resilia_safety_checkin_updated', handleSafetyUpdate);

    return () => {
      unsub();
      window.removeEventListener('resilia_safety_checkin_updated', handleSafetyUpdate);
      emergencyAudio.stop();
    };
  }, []);

  // Derived metrics
  const riverLevel = community?.riverWaterLevelMeters || 16.8;
  const isRiverAlarmActive = riverLevel >= 16.0;
  const activeAlerts = alerts.filter((a) => a.active);
  const primaryAlert =
    activeAlerts.find((a) => a.severity === 'CRITICAL') ||
    activeAlerts.find((a) => a.severity === 'WARNING') ||
    activeAlerts[0];

  const hasActiveDisaster =
    activeAlerts.some((a) => a.severity === 'CRITICAL' || a.severity === 'WARNING' || typeof a.daysUntilLandfall === 'number' || !!a.disasterName) ||
    isRiverAlarmActive ||
    incidents.some((i) => i.severity === 'CRITICAL' && i.status !== 'RESOLVED');

  const disasterBannerTitle =
    primaryAlert?.title ||
    (riverLevel >= 16.0
      ? `2nd Alarm Pre-emptive Evacuation: Marikina River at ${riverLevel.toFixed(1)}m`
      : 'Emergency Disaster Warning in Marikina River Valley');

  const disasterBannerMessage =
    primaryAlert?.message ||
    'Water overtopping retaining dikes along Barangay Tumana and Malanday. Residents in low-lying zones advise to proceed to designated evacuation centers.';

  const disasterBannerSource =
    primaryAlert?.source || 'Marikina DRRM Priority Advisory';

  const openShelters = shelters.filter((s) => s.status === 'OPEN' || s.status === 'NEAR_CAPACITY');
  const totalOpenSlots = shelters.reduce((acc, s) => acc + Math.max(0, s.capacityTotal - s.capacityCurrent), 0);
  const nearestShelter = openShelters[0] || shelters[0];

  const activeHazards = incidents.filter((i) => i.status !== 'RESOLVED');
  const verifiedHazards = incidents.filter((i) => i.status === 'VERIFIED');
  const unverifiedHazards = incidents.filter((i) => i.status !== 'VERIFIED' && i.status !== 'RESOLVED');

  // Filter assigned incidents for current Responder
  const assignedToMe = incidents.filter(
    (inc) =>
      inc.status !== 'RESOLVED' &&
      (inc.assignedResponderId === currentUser.id ||
        inc.assignedResponderName === currentUser.name ||
        (currentUser.role === 'RESPONDER' && inc.assignedResponderId === 'user_responder_juan'))
  );

  const unassignedIncidents = incidents.filter(
    (inc) => inc.status !== 'RESOLVED' && (!inc.assignedResponderId || inc.responderStatus === 'UNASSIGNED')
  );

  // Direct Emergency Quick Incident Submission
  const handleQuickSubmitIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser.role !== 'RESIDENT' && currentUser.role !== 'RESPONDER') {
      setReportErrorMessage('Only Residents and Responders are authorized to submit incident reports.');
      return;
    }

    if (!reportLocation.trim()) {
      setReportErrorMessage('Please provide an incident location.');
      return;
    }

    setIsSubmittingReport(true);
    setReportErrorMessage(null);
    setReportSuccessMessage(null);

    try {
      const title =
        reportType === 'EARTHQUAKE'
          ? `Earthquake Intensity PEIS ${reportEarthquakeIntensity} at ${reportLocation}`
          : reportType === 'FLOOD'
          ? `Flood Water Level (${reportFloodDepth}cm) at ${reportLocation}`
          : reportType === 'VOLCANO_ERUPTION'
          ? `Volcano Alert Level ${reportVolcanoAlertLevel} (${reportAshfall} Ashfall) at ${reportLocation}`
          : reportType === 'PERSON_IN_DISTRESS'
          ? `Urgent: Person in Distress Reported at ${reportLocation}`
          : `${reportType.replace('_', ' ')} Hazard at ${reportLocation}`;

      const created = await IncidentRepository.createIncident(
        {
          type: reportType,
          title,
          description: reportDescription || `Emergency ${reportType.replace('_', ' ')} incident reported by citizen.`,
          lat: 14.658,
          lng: 121.102,
          locationName: reportLocation,
          reporterId: currentUser.id,
          reporterName: currentUser.name,
          reporterRole: currentUser.role,
          severity: reportSeverity,
          status: 'REPORTED',
          floodDepthCm: reportType === 'FLOOD' ? reportFloodDepth : undefined,
          earthquakeIntensity: reportType === 'EARTHQUAKE' ? reportEarthquakeIntensity : undefined,
          trappedPersonsCount: reportType === 'EARTHQUAKE' || reportType === 'MEDICAL_EMERGENCY' ? reportTrappedCount : 0,
          structuralDamageLevel: reportType === 'EARTHQUAKE' ? 'PARTIAL_COLLAPSE' : undefined,
          aftershockWarning: reportType === 'EARTHQUAKE',
          volcanoAlertLevel: reportType === 'VOLCANO_ERUPTION' ? reportVolcanoAlertLevel : undefined,
          ashfallSeverity: reportType === 'VOLCANO_ERUPTION' ? reportAshfall : undefined,
          photoUrl: reportPhotoUrl.trim() ? reportPhotoUrl : undefined,
        },
        currentUser
      );

      setSubmittedQuickIncident(created);
      toastSuccess(`Emergency incident #${created.id.slice(0, 6).toUpperCase()} reported & saved offline!`, 'Hazard Dispatched');
      setReportSuccessMessage(
        `Emergency incident reported successfully! Dispatched to local Responders and CDRRMO Coordinators in your sector. (ID: #${created.id.slice(0, 8).toUpperCase()})`
      );
      setReportDescription('');
      setReportTrappedCount(0);
      setReportPhotoUrl('');
      onDataChanged?.();
    } catch (err: any) {
      toastError(err.message || 'Failed to submit incident report.', 'Report Error');
      setReportErrorMessage(err.message || 'Failed to submit incident report.');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  // Responder status transitions
  const handleUpdateResponderStatus = async (
    incident: Incident,
    newStatus: ResponderOperationalStatus,
    note?: string
  ) => {
    setIsUpdatingResponderStatus(true);
    try {
      await IncidentRepository.updateIncidentResponderStatus(
        incident.id,
        newStatus,
        currentUser,
        note || `Operational response updated to ${newStatus} by ${currentUser.name}`
      );
      setResponderFeedback({
        type: 'success',
        message: `Incident status updated to ${newStatus}. Broadcasted to DRRM command.`,
      });
      onDataChanged?.();
    } catch (err: any) {
      setResponderFeedback({
        type: 'error',
        message: err.message || 'Failed to update response status.',
      });
    } finally {
      setIsUpdatingResponderStatus(false);
    }
  };

  const handleConfirmResolution = async () => {
    if (!resolvingIncident) return;
    setIsUpdatingResponderStatus(true);
    try {
      await IncidentRepository.updateIncidentResponderStatus(
        resolvingIncident.id,
        'RESOLVED',
        currentUser,
        resolutionNoteInput || 'Hazard neutralized and site secured by field responder.'
      );
      setResponderFeedback({
        type: 'success',
        message: `Incident ${resolvingIncident.title.slice(0, 35)}... marked as RESOLVED!`,
      });
      setResolvingIncident(null);
      setResolutionNoteInput('');
      onDataChanged?.();
    } catch (err: any) {
      setResponderFeedback({
        type: 'error',
        message: err.message || 'Failed to resolve incident.',
      });
    } finally {
      setIsUpdatingResponderStatus(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. DISASTER IN YOUR AREA BANNER (CONTROLLED ENTERPRISE ALERT DESIGN) */}
      {hasActiveDisaster ? (
        <section
          onClick={() => setIsDisasterModalOpen(true)}
          className="group relative overflow-hidden bg-[#FEF3F2] text-[#202A25] rounded-xl border border-[#C93636]/30 shadow-xs p-5 sm:p-6 cursor-pointer hover:border-[#C93636]/50 transition-all"
          role="button"
          tabIndex={0}
          aria-label="Click to open disaster safety protocol and emergency actions"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-full bg-[#C93636] text-white flex items-center justify-center shrink-0 shadow-2xs">
                <AlertOctagon className="w-5 h-5 text-white" />
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-[#C93636] text-white font-medium text-[11px] tracking-wide">
                    CRITICAL EMERGENCY
                  </span>
                  {typeof primaryAlert?.daysUntilLandfall === 'number' && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold text-white shadow-2xs ${
                        primaryAlert.daysUntilLandfall === 0
                          ? 'bg-rose-600 animate-pulse'
                          : primaryAlert.daysUntilLandfall === 1
                          ? 'bg-rose-500'
                          : 'bg-amber-600'
                      }`}
                    >
                      {primaryAlert.daysUntilLandfall === 0
                        ? '🔴 Landfall Imminent (<24h)'
                        : `⏳ Landfall in ${primaryAlert.daysUntilLandfall} Day${primaryAlert.daysUntilLandfall > 1 ? 's' : ''}`}
                    </span>
                  )}
                  {typeof primaryAlert?.signalLevel === 'number' && primaryAlert.signalLevel > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-neutral-900 text-white text-[10px] font-mono font-bold">
                      TCWS Signal #{primaryAlert.signalLevel}
                    </span>
                  )}
                  {primaryAlert?.disasterName && (
                    <span className="px-2 py-0.5 rounded-full bg-white text-neutral-800 border border-neutral-300 text-[10px] font-bold">
                      🌀 {primaryAlert.disasterName}
                    </span>
                  )}
                  <span className="text-xs text-[#66736D] font-medium">
                    {disasterBannerSource}
                  </span>
                  {currentUser.role === 'COORDINATOR' && (
                    <span className="px-2 py-0.5 rounded bg-white text-[#176B55] text-[11px] font-medium border border-[#E4E8E5]">
                      Coordinator Authority
                    </span>
                  )}
                </div>

                <h2 className="text-base sm:text-lg font-semibold text-[#202A25] tracking-tight">
                  {disasterBannerTitle}
                </h2>

                <p className="text-xs sm:text-sm text-[#66736D] leading-relaxed max-w-3xl">
                  {disasterBannerMessage}
                </p>
              </div>
            </div>

            {/* Actions: Sound Siren, Stand Down, View Protocols */}
            <div className="flex flex-wrap items-center gap-2 shrink-0 self-start md:self-center">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (isSirenPlaying) {
                    emergencyAudio.stop();
                    setIsSirenPlaying(false);
                  } else {
                    emergencyAudio.play('EAS_ALERT', 10);
                    setIsSirenPlaying(true);
                  }
                }}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition flex items-center gap-1.5 border ${
                  isSirenPlaying
                    ? 'bg-[#A9670B] text-white border-[#A9670B] animate-pulse'
                    : 'bg-white hover:bg-[#F6F7F6] text-[#202A25] border-[#E4E8E5]'
                }`}
                title={isSirenPlaying ? 'Silence emergency alert siren' : 'Sound emergency alert broadcast siren'}
              >
                {isSirenPlaying ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-[#A9670B]" />}
                <span>{isSirenPlaying ? 'Silence Siren' : 'Sound Siren'}</span>
              </button>

              {currentUser.role === 'COORDINATOR' && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigate('COORDINATOR');
                  }}
                  className="px-3 py-2 rounded-lg bg-white hover:bg-[#F6F7F6] text-[#C93636] font-medium text-xs border border-[#E4E8E5] transition"
                >
                  Manage / Stand Down
                </button>
              )}
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#176B55] text-white font-medium text-xs shadow-2xs group-hover:bg-[#125642] transition">
                <span>View Safety Protocols</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
              </div>
            </div>
          </div>
        </section>
      ) : currentUser.role === 'COORDINATOR' ? (
        /* Coordinator prompt when no active disaster is declared */
        <section className="bg-white rounded-xl border border-[#E4E8E5] shadow-xs p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#176B55]/10 text-[#176B55] flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5 text-[#176B55]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-[#176B55]/10 text-[#176B55] text-[11px] font-medium">
                  Sector Status: Normal Monitoring
                </span>
                <span className="text-xs text-[#66736D] font-medium">
                  Disaster Coordinator Command
                </span>
              </div>
              <h3 className="text-sm font-semibold text-[#202A25] mt-0.5">
                No active disaster declared in your sector
              </h3>
              <p className="text-xs text-[#66736D] max-w-2xl">
                As Disaster Coordinator, you are authorized to trigger an emergency advisory for typhoon, river flood surge, volcanic eruption, or earthquake whenever field hazards escalate.
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('COORDINATOR')}
            className="px-4 py-2 rounded-lg bg-[#C93636] hover:bg-[#b52b2b] text-white font-medium text-xs shadow-2xs transition flex items-center gap-1.5 shrink-0"
          >
            <AlertOctagon className="w-4 h-4" />
            <span>Declare Disaster State</span>
          </button>
        </section>
      ) : null}

      {/* LIFE-SAFETY COCKPIT: RESTRAINED ENTERPRISE ACTION CONTROLS */}
      <section className="bg-white rounded-xl border border-[#E4E8E5] p-5 shadow-xs space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#176B55]" />
            <h3 className="font-semibold text-sm text-[#202A25]">
              Life-Safety Cockpit & Quick Actions
            </h3>
            <span className="hidden sm:inline text-xs text-[#66736D]">· Tagalog / English</span>
          </div>

          <button
            onClick={() => setIsSafetyCheckInOpen(true)}
            className="text-xs text-[#176B55] bg-white hover:bg-[#F6F7F6] px-3 py-1.5 rounded-lg font-medium border border-[#E4E8E5] transition flex items-center gap-1.5 cursor-pointer"
            title={currentUser.role === 'COORDINATOR' ? "Click to inspect safe citizen registry" : "Check in family safety status"}
          >
            <UserCheck className="w-3.5 h-3.5 text-[#176B55]" />
            <span>{safetyStats.totalPeopleAccounted} Citizens Accounted Safe</span>
            {currentUser.role === 'COORDINATOR' ? (
              <span className="text-[11px] text-[#176B55] font-semibold ml-1">
                Inspect Safe Roster →
              </span>
            ) : (
              <span className="text-[11px] text-[#66736D] ml-1">
                Family Check-In →
              </span>
            )}
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Quick Action 1: I Am Safe Beacon */}
          <button
            onClick={() => setIsSafetyCheckInOpen(true)}
            className="p-3.5 rounded-lg border border-[#E4E8E5] bg-white hover:border-[#176B55] hover:bg-[#F6F7F6] text-left transition flex flex-col justify-between group min-h-[96px]"
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-full bg-[#176B55]/10 text-[#176B55] flex items-center justify-center">
                <UserCheck className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-medium text-[#176B55] bg-[#176B55]/10 px-2 py-0.5 rounded">
                Ligtas Ako
              </span>
            </div>
            <div className="mt-2.5">
              <div className="font-semibold text-xs text-[#202A25]">"I Am Safe" Check-In</div>
              <div className="text-[11px] text-[#66736D] leading-tight mt-0.5">
                Reunify family & mark safe
              </div>
            </div>
          </button>

          {/* Quick Action 2: 72h Survival Go-Bag */}
          <button
            onClick={() => setIsGoBagOpen(true)}
            className="p-3.5 rounded-lg border border-[#E4E8E5] bg-white hover:border-[#176B55] hover:bg-[#F6F7F6] text-left transition flex flex-col justify-between group min-h-[96px]"
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-full bg-[#176B55]/10 text-[#176B55] flex items-center justify-center">
                <Package className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-medium text-[#66736D] bg-[#F6F7F6] px-2 py-0.5 rounded border border-[#E4E8E5]">
                72h Kit
              </span>
            </div>
            <div className="mt-2.5">
              <div className="font-semibold text-xs text-[#202A25]">Evacuation Go-Bag</div>
              <div className="text-[11px] text-[#66736D] leading-tight mt-0.5">
                Water, meds & whistle check
              </div>
            </div>
          </button>

          {/* Quick Action 3: Speed-Dial 911 & SMS SOS */}
          <button
            onClick={() => setIsHotlinesOpen(true)}
            className="p-3.5 rounded-lg border border-[#E4E8E5] bg-white hover:border-[#176B55] hover:bg-[#F6F7F6] text-left transition flex flex-col justify-between group min-h-[96px]"
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-full bg-[#176B55]/10 text-[#176B55] flex items-center justify-center">
                <PhoneCall className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-medium text-[#66736D] bg-[#F6F7F6] px-2 py-0.5 rounded border border-[#E4E8E5]">
                Rescue 161
              </span>
            </div>
            <div className="mt-2.5">
              <div className="font-semibold text-xs text-[#202A25]">Hotlines & Offline SOS</div>
              <div className="text-[11px] text-[#66736D] leading-tight mt-0.5">
                Marikina 161 · 911 · SMS
              </div>
            </div>
          </button>

          {/* Quick Action 4: EAS Acoustic Warning Siren */}
          <button
            onClick={() => {
              if (isSirenPlaying) {
                emergencyAudio.stop();
                setIsSirenPlaying(false);
              } else {
                emergencyAudio.play('EAS_ALERT', 8);
                setIsSirenPlaying(true);
              }
            }}
            className={`p-3.5 rounded-lg border text-left transition flex flex-col justify-between group min-h-[96px] ${
              isSirenPlaying
                ? 'bg-[#A9670B] border-[#A9670B] text-white animate-pulse'
                : 'border-[#E4E8E5] bg-white hover:border-[#176B55] hover:bg-[#F6F7F6] text-[#202A25]'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isSirenPlaying ? 'bg-white text-[#A9670B]' : 'bg-[#176B55]/10 text-[#176B55]'}`}>
                {isSirenPlaying ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </div>
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${isSirenPlaying ? 'bg-white/20 text-white' : 'text-[#66736D] bg-[#F6F7F6] border border-[#E4E8E5]'}`}>
                {isSirenPlaying ? 'Active' : 'Babala Tone'}
              </span>
            </div>
            <div className="mt-2.5">
              <div className="font-semibold text-xs">
                {isSirenPlaying ? 'Silence Warning Siren' : 'Acoustic Alert Siren'}
              </div>
              <div className={`text-[11px] leading-tight mt-0.5 ${isSirenPlaying ? 'text-white/90' : 'text-[#66736D]'}`}>
                {isSirenPlaying ? 'Tap to mute tone' : 'Synthesized 8s EAS audio'}
              </div>
            </div>
          </button>
        </div>
      </section>

      {/* 72-Hour Evacuation Go-Bag Dashboard Checklist */}
      <GoBagChecklistCard
        variant="general"
        onOpenFullModal={() => setIsGoBagOpen(true)}
      />

      {/* 2. RESPONDER VIEW: ASSIGNED INCIDENT REPORTS (SHOWN RIGHT AWAY) */}
      {currentUser.role === 'RESPONDER' && (
        <section className="bg-white rounded-2xl border-2 border-teal-500/60 shadow-sm p-5 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-neutral-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-neutral-900">
                    Incidents Assigned to You ({assignedToMe.length})
                  </h3>
                  <span className="px-2 py-0.5 rounded bg-teal-100 text-teal-800 text-[10px] font-bold font-mono">
                    Responder Dispatch Queue
                  </span>
                </div>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Logged field incidents requiring immediate acknowledgment, transit, or resolution.
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigate('MISSIONS')}
              className="text-xs text-teal-800 hover:text-teal-900 font-semibold flex items-center gap-1"
            >
              <span>Open Missions Terminal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Feedback message for responder */}
          {responderFeedback && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center justify-between gap-2 ${
                responderFeedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              <span>{responderFeedback.message}</span>
              <button
                onClick={() => setResponderFeedback(null)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Assigned Incidents List */}
          {assignedToMe.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {assignedToMe.map((inc) => (
                <div
                  key={inc.id}
                  className="bg-neutral-50/70 rounded-xl border border-neutral-200/90 p-4 space-y-3"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                            inc.severity === 'CRITICAL'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {inc.severity}
                        </span>
                        <span className="text-[11px] font-semibold text-neutral-600">
                          {inc.type.replace('_', ' ')}
                        </span>
                      </div>
                      <h4 className="font-bold text-xs text-neutral-900 mt-1 leading-snug">
                        {inc.title}
                      </h4>
                      <p className="text-[11px] text-neutral-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-neutral-400 shrink-0" />
                        <span>{inc.locationName}</span>
                      </p>
                    </div>

                    <span
                      className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded ${
                        inc.responderStatus === 'ON_SCENE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : inc.responderStatus === 'EN_ROUTE'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {inc.responderStatus || 'DISPATCHED'}
                    </span>
                  </div>

                  {inc.photoUrl && (
                    <div className="relative rounded-xl overflow-hidden border border-neutral-200/80 bg-neutral-900 max-h-40">
                      <img
                        src={inc.photoUrl}
                        alt={inc.title}
                        className="w-full h-32 object-cover"
                      />
                      <div className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded bg-black/75 backdrop-blur-xs text-[10px] text-white font-medium flex items-center gap-1">
                        <Camera className="w-3 h-3 text-amber-400" />
                        <span>Field Photo Evidence</span>
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-neutral-600 leading-relaxed bg-white p-2.5 rounded-lg border border-neutral-200/60">
                    {inc.description}
                  </p>

                  {/* Telemetry chips if available */}
                  {(inc.trappedPersonsCount || inc.floodDepthCm || inc.earthquakeIntensity) && (
                    <div className="flex flex-wrap gap-2 text-[11px] font-mono text-neutral-600">
                      {inc.trappedPersonsCount ? (
                        <span className="text-rose-700 font-bold inline-flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>{inc.trappedPersonsCount} Trapped Citizens</span>
                        </span>
                      ) : null}
                      {inc.floodDepthCm ? <span>Water Depth: {inc.floodDepthCm}cm</span> : null}
                      {inc.earthquakeIntensity ? (
                        <span>PEIS Scale: Intensity {inc.earthquakeIntensity}</span>
                      ) : null}
                    </div>
                  )}

                  {/* Immediate Responder Action Buttons */}
                  <div className="pt-2 border-t border-neutral-200/60 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      {inc.responderStatus !== 'EN_ROUTE' && inc.responderStatus !== 'ON_SCENE' && (
                        <button
                          disabled={isUpdatingResponderStatus}
                          onClick={() => handleUpdateResponderStatus(inc, 'EN_ROUTE')}
                          className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition"
                        >
                          En Route
                        </button>
                      )}

                      {inc.responderStatus !== 'ON_SCENE' && (
                        <button
                          disabled={isUpdatingResponderStatus}
                          onClick={() => handleUpdateResponderStatus(inc, 'ON_SCENE')}
                          className="px-2.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition"
                        >
                          Arrived On Scene
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setResolvingIncident(inc);
                          setResolutionNoteInput('Road cleared and hazard safely secured.');
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition"
                      >
                        Mark Resolved
                      </button>
                    </div>

                    <button
                      onClick={() => onNavigate('MAP')}
                      className="text-[11px] text-neutral-600 hover:text-neutral-900 flex items-center gap-1"
                    >
                      <Navigation className="w-3 h-3" />
                      <span>Map Route</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200/80 text-xs text-neutral-600 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="font-semibold text-neutral-900">
                  All assigned incident dispatches are completed.
                </span>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  There are {unassignedIncidents.length} unassigned field hazards in Marikina sector awaiting responder deployment.
                </p>
              </div>
              <button
                onClick={() => onNavigate('MISSIONS')}
                className="px-3 py-1.5 rounded-lg bg-neutral-900 text-white font-medium hover:bg-neutral-800 transition text-xs shrink-0"
              >
                View Available Field Incidents
              </button>
            </div>
          )}
        </section>
      )}

      {/* 2B. COORDINATOR VIEW: LIVE CITIZEN SAFETY REGISTRY & EOC COMMAND STATUS */}
      {currentUser.role === 'COORDINATOR' && (
        <section className="bg-white rounded-xl border border-[#E4E8E5] shadow-xs p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E4E8E5]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#176B55]/10 text-[#176B55] flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-[#202A25]">
                    Citizen Welfare & Safety Registry ({safetyStats.totalPeopleAccounted} Accounted)
                  </h3>
                  <span className="px-2 py-0.5 rounded bg-[#F6F7F6] text-[#66736D] text-[11px] font-medium border border-[#E4E8E5]">
                    Coordinator Registry
                  </span>
                </div>
                <p className="text-xs text-[#66736D] mt-0.5">
                  Live accounting of families safe at shelters, homebound, or evacuating across Marikina sector.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsSafetyCheckInOpen(true)}
                className="px-3.5 py-1.5 rounded-lg bg-[#176B55] hover:bg-[#125642] text-white font-medium text-xs shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Inspect Safe Roster ({safetyStats.totalCheckIns})</span>
              </button>

              <button
                onClick={() => onNavigate('COORDINATOR')}
                className="px-3 py-1.5 rounded-lg bg-white hover:bg-[#F6F7F6] text-[#202A25] font-medium text-xs border border-[#E4E8E5] transition flex items-center gap-1"
              >
                <span>Command Center</span>
                <ArrowRight className="w-3 h-3 text-[#66736D]" />
              </button>
            </div>
          </div>

          {/* Clean Roster Status Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
            <div className="bg-[#F6F7F6] rounded-lg p-3 border border-[#E4E8E5]">
              <span className="text-[11px] text-[#66736D] font-medium block">At Shelters</span>
              <div className="text-lg font-semibold text-[#202A25] mt-0.5 tabular-nums">
                {safetyStats.atShelters} <span className="text-xs font-normal text-[#66736D]">records</span>
              </div>
              <span className="text-[11px] text-[#217A57] font-medium">Safe in facilities</span>
            </div>

            <div className="bg-[#F6F7F6] rounded-lg p-3 border border-[#E4E8E5]">
              <span className="text-[11px] text-[#66736D] font-medium block">Safe at Home</span>
              <div className="text-lg font-semibold text-[#202A25] mt-0.5 tabular-nums">
                {safetyStats.atHome} <span className="text-xs font-normal text-[#66736D]">records</span>
              </div>
              <span className="text-[11px] text-[#356AC3] font-medium">Sheltered in place</span>
            </div>

            <div className="bg-[#F6F7F6] rounded-lg p-3 border border-[#E4E8E5]">
              <span className="text-[11px] text-[#66736D] font-medium block">Evacuating</span>
              <div className="text-lg font-semibold text-[#202A25] mt-0.5 tabular-nums">
                {safetyStats.evacuating} <span className="text-xs font-normal text-[#66736D]">records</span>
              </div>
              <span className="text-[11px] text-[#A9670B] font-medium">En route</span>
            </div>

            <div className="bg-[#F6F7F6] rounded-lg p-3 border border-[#E4E8E5]">
              <span className="text-[11px] text-[#66736D] font-medium block">Needs Aid</span>
              <div className="text-lg font-semibold text-[#202A25] mt-0.5 tabular-nums">
                {safetyStats.needsAssistance} <span className="text-xs font-normal text-[#66736D]">records</span>
              </div>
              <span className="text-[11px] text-[#C93636] font-medium">Requires supplies</span>
            </div>

            <div className="bg-[#F6F7F6] rounded-lg p-3 border border-[#E4E8E5] col-span-2 sm:col-span-1">
              <span className="text-[11px] text-[#66736D] font-medium block">Verified Safe</span>
              <div className="text-lg font-semibold text-[#202A25] mt-0.5 tabular-nums">
                {safetyStats.verifiedCount} <span className="text-xs font-normal text-[#66736D]">verified</span>
              </div>
              <span className="text-[11px] text-[#66736D] font-medium">Coordinator verified</span>
            </div>
          </div>
        </section>
      )}

      {/* 3. AT A GLANCE SITUATIONAL STATUS BAROMETER (COLLAPSIBLE OPERATIONAL PANEL) */}
      <section className="bg-white rounded-xl border border-[#E4E8E5] shadow-xs overflow-hidden">
        <div
          onClick={() => setIsCommunityStatusOpen((prev) => !prev)}
          className="p-5 flex flex-wrap items-center justify-between gap-3 cursor-pointer select-none hover:bg-[#F6F7F6]/80 transition"
          role="button"
          tabIndex={0}
          aria-expanded={isCommunityStatusOpen}
          aria-label="Toggle Community Status at a glance"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#176B55]/10 text-[#176B55] flex items-center justify-center shrink-0">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#217A57]" />
                <h3 className="text-sm font-semibold text-[#202A25]">
                  Community Status & Telemetry
                </h3>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-[#F6F7F6] text-[#66736D] border border-[#E4E8E5]">
                  Marikina Monitoring Cluster
                </span>
              </div>
              <p className="text-xs text-[#66736D] mt-0.5">
                Barangay Tumana & Malanday Monitoring Cluster
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-[#66736D] tabular-nums">
            <div className="hidden md:flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-[#66736D]" />
              <span>Offline Store: Ready</span>
            </div>
            <span className="hidden md:inline text-[#E4E8E5]">·</span>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#66736D]" />
              <span>
                {lastSyncTime
                  ? `Updated ${new Date(lastSyncTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                  : 'Source: Local IndexedDB'}
              </span>
            </div>
            <div className="p-1.5 rounded-lg bg-[#F6F7F6] text-[#202A25] hover:bg-[#E4E8E5] transition-colors ml-1">
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ease-in-out ${
                  isCommunityStatusOpen ? 'rotate-180 text-[#202A25]' : 'rotate-0 text-[#66736D]'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Collapsible Dropdown Content with Smooth Transition */}
        <div
          className={`grid transition-[grid-template-rows,opacity] duration-200 ease-in-out ${
            isCommunityStatusOpen
              ? 'grid-rows-[1fr] opacity-100'
              : 'grid-rows-[0fr] opacity-0 pointer-events-none'
          }`}
        >
          <div className="overflow-hidden">
            <div className="px-5 pb-5 pt-1 border-t border-[#E4E8E5] space-y-4">
              {/* 3 Core Glance Indicators */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Glance A: River Height Gauge */}
                <div className="bg-[#F6F7F6] rounded-lg p-4 border border-[#E4E8E5]">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#202A25] flex items-center gap-1.5">
                      <Droplets className="w-4 h-4 text-[#176B55]" />
                      <span>Marikina River Level</span>
                    </span>
                    <span
                      className={`font-medium text-[11px] px-2 py-0.5 rounded ${
                        riverLevel >= 18
                          ? 'bg-[#FEF3F2] text-[#C93636] border border-[#C93636]/30'
                          : riverLevel >= 16
                          ? 'bg-[#FFF8EB] text-[#A9670B] border border-[#A9670B]/30'
                          : 'bg-[#E8F3EF] text-[#217A57] border border-[#217A57]/30'
                      }`}
                    >
                      {riverLevel >= 18
                        ? '3rd Alarm · Forced Evac'
                        : riverLevel >= 16
                        ? '2nd Alarm · Pre-emptive'
                        : 'Normal River Flow'}
                    </span>
                  </div>

                  <div className="mt-2.5 flex items-baseline gap-2">
                    <span className="text-3xl font-semibold text-[#202A25] tabular-nums">
                      {riverLevel.toFixed(1)}
                    </span>
                    <span className="text-sm font-normal text-[#66736D]">meters</span>
                    <span className="text-[11px] text-[#66736D] ml-auto">
                      Sto. Niño / Tumana Sensor
                    </span>
                  </div>

                  <div className="mt-2.5">
                    <div className="h-2 rounded-full bg-[#E4E8E5] overflow-hidden flex">
                      <div
                        style={{
                          width: `${Math.min(100, Math.max(8, ((riverLevel - 12) / (20 - 12)) * 100))}%`,
                        }}
                        className={`h-full transition-all ${
                          riverLevel >= 18
                            ? 'bg-[#C93636]'
                            : riverLevel >= 16
                            ? 'bg-[#A9670B]'
                            : 'bg-[#217A57]'
                        }`}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-[#66736D] mt-1 tabular-nums">
                      <span>15.0m (Alarm 1)</span>
                      <span>16.0m (Alarm 2)</span>
                      <span>18.0m (Critical)</span>
                    </div>
                  </div>

                  <p className="text-xs text-[#66736D] mt-2.5 pt-2 border-t border-[#E4E8E5] leading-relaxed">
                    {riverLevel >= 18
                      ? 'Critical: Mandatory evacuation strictly enforced for Tumana, Malanday, & Nangka dike zones.'
                      : riverLevel >= 16
                      ? '2nd Alarm: Pre-emptive evacuation in progress. Low-lying residents proceed to designated centers.'
                      : 'Normal water level. Waterways flow unobstructed.'}
                  </p>
                </div>

                {/* Glance B: Nearest Designated Shelter */}
                <div
                  onClick={() => onNavigate('MAP')}
                  className="bg-[#F6F7F6] rounded-lg p-4 border border-[#E4E8E5] hover:border-[#176B55] transition cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs text-[#66736D]">
                      <span className="font-medium text-[#202A25] flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-[#176B55]" />
                        <span>Nearest Safe Shelter</span>
                      </span>
                      <span className="text-[11px] font-medium text-[#176B55]">
                        650m Away
                      </span>
                    </div>

                    <h4 className="font-semibold text-sm text-[#202A25] mt-2">
                      {nearestShelter ? nearestShelter.name : 'Bgy. Tumana Elementary School'}
                    </h4>
                    <p className="text-xs text-[#66736D] mt-0.5">
                      {nearestShelter ? nearestShelter.locationName : 'Purok 1, Tumana'}
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-[#E4E8E5] flex items-center justify-between text-xs">
                    <span className="text-xs text-[#66736D] tabular-nums">
                      <strong className="text-[#202A25] font-semibold">{totalOpenSlots.toLocaleString()}</strong> slots open
                    </span>
                    <span className="text-xs text-[#176B55] font-medium flex items-center gap-1">
                      <span>View Route</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>

                {/* Glance C: Hazards In Your Sector */}
                <div
                  onClick={() => onNavigate('MAP')}
                  className="bg-[#F6F7F6] rounded-lg p-4 border border-[#E4E8E5] hover:border-[#176B55] transition cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs text-[#66736D]">
                      <span className="font-medium text-[#202A25] flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-[#A9670B]" />
                        <span>Local Hazard Reports</span>
                      </span>
                      <span className="text-[11px] text-[#66736D]">Active Status</span>
                    </div>

                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-3xl font-semibold text-[#202A25] tabular-nums">
                        {activeHazards.length}
                      </span>
                      <span className="text-xs text-[#66736D]">hazards in cluster</span>
                    </div>
                    <p className="text-xs text-[#66736D] mt-1">
                      {verifiedHazards.length} verified by DRRM responders
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-[#E4E8E5] flex items-center justify-between text-xs">
                    <span className="text-xs text-[#217A57] font-medium">
                      CDRRMO Rescue 161 Active
                    </span>
                    <span className="text-xs text-[#202A25] font-medium flex items-center gap-1">
                      <span>Open Map</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. ROLE-SPECIFIC OPERATIONAL SECTION */}
      {currentUser.role === 'COORDINATOR' ? (
        <section className="bg-white rounded-2xl border border-neutral-200/90 p-5 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-900 flex items-center justify-center shrink-0">
                <FileCheck2 className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-neutral-900">
                    Community Incident Triage Queue
                  </h3>
                  <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold font-mono">
                    {unverifiedHazards.length} Pending Official Review
                  </span>
                </div>
                <p className="text-xs text-neutral-500 mt-0.5 max-w-xl">
                  Field hazards and citizen distress reports awaiting formal coordinator verification and responder dispatch.
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigate('VERIFICATION')}
              className="px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs transition flex items-center gap-2 shrink-0 shadow-2xs"
            >
              <span>Review & Verify Incidents</span>
              <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
            </button>
          </div>
        </section>
      ) : (
        <section className="bg-white rounded-2xl border-2 border-neutral-900/10 shadow-xs overflow-hidden">
          <div
            onClick={() => setIsReportHazardOpen((prev) => !prev)}
            className="p-5 sm:p-6 flex flex-wrap items-center justify-between gap-3 cursor-pointer select-none hover:bg-neutral-50/70 transition"
            role="button"
            tabIndex={0}
            aria-expanded={isReportHazardOpen}
            aria-label="Toggle Report Hazard incident reporting form"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center shrink-0">
                <Send className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-neutral-900">
                    Report Hazard In Your Area Right Now
                  </h3>
                  <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                    Rapid Logging
                  </span>
                </div>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Direct citizen & responder emergency reporting. Submits in 1-tap, works without internet.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                Local-First · Works Offline
              </span>
              <div className="p-1.5 rounded-lg bg-neutral-100 text-neutral-700 hover:bg-neutral-200 transition-colors">
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-300 ease-in-out ${
                    isReportHazardOpen ? 'rotate-180 text-neutral-900' : 'rotate-0 text-neutral-500'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Collapsible Dropdown Content with Smooth Transition */}
          <div
            className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
              isReportHazardOpen
                ? 'grid-rows-[1fr] opacity-100'
                : 'grid-rows-[0fr] opacity-0 pointer-events-none'
            }`}
          >
            <div className="overflow-hidden">
              <div className="px-5 pb-5 sm:px-6 sm:pb-6 pt-1 border-t border-neutral-100 space-y-4">
                {submittedQuickIncident ? (
              <div className="p-5 sm:p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/25 text-neutral-900 space-y-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="relative flex items-center justify-center shrink-0">
                      <span className="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-emerald-400 opacity-30" />
                      <div className="relative w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-bold text-emerald-950">
                          Emergency Incident Reported Successfully!
                        </h4>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800">
                          #{submittedQuickIncident.id.slice(0, 8).toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-emerald-800/90 mt-0.5">
                        Your report has been received, logged to the local offline datastore, and dispatched to CDRRMO field responders in Marikina.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSubmittedQuickIncident(null);
                      setReportSuccessMessage(null);
                    }}
                    className="text-neutral-400 hover:text-neutral-700 p-1 rounded-lg transition"
                    title="Dismiss"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Summary Details */}
                <div className="bg-white rounded-xl p-4 border border-emerald-200/80 shadow-2xs grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-[11px] text-neutral-500 block">Incident Type</span>
                    <span className="font-bold text-neutral-900 mt-0.5 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      {submittedQuickIncident.type.replace('_', ' ')}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-neutral-500 block">Location</span>
                    <span className="font-semibold text-neutral-900 mt-0.5 truncate block" title={submittedQuickIncident.locationName}>
                      {submittedQuickIncident.locationName}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-neutral-500 block">Database Status</span>
                    <span className="font-semibold text-emerald-700 mt-0.5 flex items-center gap-1">
                      <Database className="w-3.5 h-3.5" />
                      <span>Saved Locally & Dispatched</span>
                    </span>
                  </div>
                </div>

                {submittedQuickIncident.photoUrl && (
                  <div className="relative rounded-xl overflow-hidden border border-emerald-300 bg-neutral-950 max-h-48">
                    <img
                      src={submittedQuickIncident.photoUrl}
                      alt={submittedQuickIncident.title}
                      className="w-full h-36 object-cover"
                    />
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/75 backdrop-blur-xs text-[10px] text-white font-medium flex items-center gap-1">
                      <Camera className="w-3 h-3 text-amber-400" />
                      <span>Field Photo Attached to Report</span>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <span className="text-[11px] text-neutral-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Logged at {new Date(submittedQuickIncident.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSubmittedQuickIncident(null);
                        setReportSuccessMessage(null);
                      }}
                      className="px-3.5 py-1.5 rounded-xl border border-neutral-300 hover:bg-neutral-100 text-neutral-700 font-semibold text-xs transition"
                    >
                      Report Another Hazard
                    </button>
                    <button
                      type="button"
                      onClick={() => onNavigate('MAP')}
                      className="px-3.5 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-2xs"
                    >
                      <Compass className="w-3.5 h-3.5 text-amber-400" />
                      <span>Track on Live Map</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleQuickSubmitIncident} className="space-y-4">
            {/* Feedback Notifications */}
            {reportSuccessMessage && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{reportSuccessMessage}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setReportSuccessMessage(null)}
                  className="text-emerald-700 hover:text-emerald-900"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {reportErrorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{reportErrorMessage}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setReportErrorMessage(null)}
                  className="text-rose-700 hover:text-rose-900"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Quick 1-Tap Disaster Categories */}
            <div>
              <label className="block text-xs font-bold text-neutral-800 mb-2">
                1. Select Hazard / Disaster Category:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                {DISASTER_QUICK_TYPES.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = reportType === cat.type;
                  return (
                    <button
                      key={cat.type}
                      type="button"
                      onClick={() => {
                        setReportType(cat.type);
                        setReportSeverity(cat.defaultSeverity);
                      }}
                      className={`p-3 rounded-xl border text-left transition flex flex-col justify-between gap-2 ${
                        isSelected
                          ? 'border-neutral-900 bg-neutral-900 text-white shadow-xs'
                          : 'border-neutral-200 bg-neutral-50/60 hover:bg-neutral-100/80 text-neutral-800'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-amber-400' : 'text-neutral-500'}`} />
                      <div>
                        <div className="text-xs font-bold leading-tight">{cat.label}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Contextual Rapid Telemetry Controls */}
            {reportType === 'FLOOD' && (
              <div className="bg-neutral-50 rounded-xl p-3.5 border border-neutral-200 space-y-2">
                <span className="text-xs font-bold text-neutral-800 block">
                  Water Depth Quick Level:
                </span>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'Ankle (15cm)', val: 15 },
                    { label: 'Knee (50cm)', val: 50 },
                    { label: 'Waist (100cm)', val: 100 },
                    { label: 'Chest (130cm)', val: 130 },
                    { label: 'Submerged (200cm+)', val: 200 },
                  ].map((level) => (
                    <button
                      key={level.val}
                      type="button"
                      onClick={() => setReportFloodDepth(level.val)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                        reportFloodDepth === level.val
                          ? 'bg-neutral-900 text-white font-bold'
                          : 'bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-100'
                      }`}
                    >
                      {level.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {reportType === 'EARTHQUAKE' && (
              <div className="bg-neutral-50 rounded-xl p-3.5 border border-neutral-200 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs font-bold text-neutral-800">
                    PHIVOLCS PEIS Intensity:
                  </span>
                  <div className="flex gap-1.5">
                    {[
                      { num: 5, label: 'V Strong' },
                      { num: 6, label: 'VI Very Strong' },
                      { num: 7, label: 'VII Destructive' },
                      { num: 8, label: 'VIII Very Destructive' },
                    ].map((lvl) => (
                      <button
                        key={lvl.num}
                        type="button"
                        onClick={() => setReportEarthquakeIntensity(lvl.num)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition ${
                          reportEarthquakeIntensity === lvl.num
                            ? 'bg-rose-700 text-white'
                            : 'bg-white border border-neutral-200 text-neutral-700'
                        }`}
                      >
                        PEIS {lvl.num}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-neutral-200">
                  <span className="font-semibold text-neutral-700">Trapped Citizens:</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setReportTrappedCount((c) => Math.max(0, c - 1))}
                      className="w-7 h-7 rounded-lg bg-white border border-neutral-300 font-bold flex items-center justify-center text-neutral-800"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-bold text-sm font-mono text-neutral-900">
                      {reportTrappedCount}
                    </span>
                    <button
                      type="button"
                      onClick={() => setReportTrappedCount((c) => c + 1)}
                      className="w-7 h-7 rounded-lg bg-white border border-neutral-300 font-bold flex items-center justify-center text-neutral-800"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Volcano Eruption Specific Controls */}
            {reportType === 'VOLCANO_ERUPTION' && (
              <div className="bg-neutral-50 rounded-xl p-3.5 border border-neutral-200 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs font-bold text-neutral-800">
                    PHIVOLCS Volcanic Alert Level:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { lvl: 1, label: 'L1 Hydrothermal' },
                      { lvl: 2, label: 'L2 Moderate' },
                      { lvl: 3, label: 'L3 Magmatic' },
                      { lvl: 4, label: 'L4 Imminent' },
                      { lvl: 5, label: 'L5 Hazardous Eruption' },
                    ].map((item) => (
                      <button
                        key={item.lvl}
                        type="button"
                        onClick={() => setReportVolcanoAlertLevel(item.lvl)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition ${
                          reportVolcanoAlertLevel === item.lvl
                            ? 'bg-rose-700 text-white shadow-xs'
                            : 'bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-100'
                        }`}
                      >
                        Alert {item.lvl}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-200">
                  <span className="text-xs font-bold text-neutral-700">Ashfall Fall Severity:</span>
                  <div className="flex gap-1.5">
                    {(['LIGHT', 'MODERATE', 'HEAVY'] as const).map((sev) => (
                      <button
                        key={sev}
                        type="button"
                        onClick={() => setReportAshfall(sev)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                          reportAshfall === sev
                            ? 'bg-neutral-900 text-white shadow-xs'
                            : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-100'
                        }`}
                      >
                        {sev}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Location & Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              <div className="md:col-span-5 space-y-1.5">
                <label className="block text-xs font-bold text-neutral-800">
                  2. Incident Location:
                </label>
                <input
                  type="text"
                  value={reportLocation}
                  onChange={(e) => setReportLocation(e.target.value)}
                  placeholder="e.g. Purok 4, Tumana Dike Side"
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  required
                />
                {/* Location Quick Presets */}
                <div className="flex flex-wrap gap-1 pt-1">
                  {PRESET_LOCATIONS.slice(0, 3).map((loc) => (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => setReportLocation(loc)}
                      className="text-[10px] px-2 py-0.5 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-600 transition"
                    >
                      {loc}
                    </button>
                  ))}
                </div>
              </div>

              <div className="md:col-span-7 space-y-1.5">
                <label className="block text-xs font-bold text-neutral-800">
                  3. Key Observations & Landmarks:
                </label>
                <input
                  type="text"
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="e.g. Water spilling over dike wall near basketball court. 2 families waiting on 2nd floor."
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
                <p className="text-[10px] text-neutral-400">
                  Provide brief landmarks to assist field responders and rescue boats.
                </p>
              </div>
            </div>

            {/* 4. Photo Evidence Attachment */}
            <div className="bg-neutral-50 rounded-xl p-3.5 border border-neutral-200 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-neutral-600" />
                  <span>4. Add Picture / Field Photo Evidence (Optional):</span>
                </label>
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium transition flex items-center gap-1.5 shadow-2xs">
                    <Camera className="w-3.5 h-3.5 text-amber-400" />
                    <span>Upload or Take Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Preset Sample Images for Fast Demo */}
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-neutral-500">
                <span className="text-[10px] text-neutral-400">Or pick preset:</span>
                {PHOTO_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setReportPhotoUrl(preset.url)}
                    className={`px-2 py-0.5 rounded text-[10px] font-medium transition ${
                      reportPhotoUrl === preset.url
                        ? 'bg-neutral-900 text-white font-bold'
                        : 'bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-100'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Photo Preview */}
              {reportPhotoUrl && (
                <div className="relative rounded-xl overflow-hidden border border-neutral-300 bg-neutral-950 max-w-sm mt-2">
                  <img
                    src={reportPhotoUrl}
                    alt="Uploaded incident preview"
                    className="w-full h-36 object-cover"
                  />
                  <div className="absolute top-2 right-2 flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-full bg-black/75 backdrop-blur-xs text-[10px] text-white font-semibold">
                      Photo Attached
                    </span>
                    <button
                      type="button"
                      onClick={() => setReportPhotoUrl('')}
                      className="p-1 rounded-full bg-black/80 text-white hover:bg-rose-600 transition"
                      title="Remove image"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Direct Submit Action */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
              <div className="text-[11px] text-neutral-500 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Reports broadcast directly to Rescue 161 and field teams</span>
              </div>

              <button
                type="submit"
                disabled={isSubmittingReport}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition flex items-center gap-2"
              >
                {isSubmittingReport ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Broadcasting Report...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Incident Report Immediately (Offline OK)</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
            </div>
          </div>
        </div>
      </section>
      )}

      {/* 5. DIRECT ACTIONS GRID (ROLE-TAILORED QUICK MISSIONS & ENTRY POINTS) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {currentUser.role === 'COORDINATOR' && (
          <>
            {/* Coordinator Action 1: EOC Command */}
            <button
              onClick={() => onNavigate('COORDINATOR')}
              className="p-4 rounded-2xl border border-neutral-200/90 bg-white hover:border-neutral-300 hover:shadow-xs text-left transition flex flex-col justify-between group shadow-2xs"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-full bg-neutral-900 text-white flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                </div>
                <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:translate-x-0.5 transition" />
              </div>
              <div>
                <div className="text-xs font-bold text-neutral-900">Incident Command Center (EOC)</div>
                <p className="text-[11px] text-neutral-500 mt-1 leading-snug">
                  Operational command, live telemetry, area disaster triggers, and sitrep exports.
                </p>
              </div>
            </button>

            {/* Coordinator Action 2: Verification */}
            <button
              onClick={() => onNavigate('VERIFICATION')}
              className="p-4 rounded-2xl border border-neutral-200/90 bg-white hover:border-neutral-300 hover:shadow-xs text-left transition flex flex-col justify-between group shadow-2xs"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-full bg-neutral-900 text-white flex items-center justify-center">
                  <FileCheck2 className="w-4 h-4 text-teal-400" />
                </div>
                <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:translate-x-0.5 transition" />
              </div>
              <div>
                <div className="text-xs font-bold text-neutral-900">Incident Verification & Triage</div>
                <p className="text-[11px] text-neutral-500 mt-1 leading-snug">
                  Validate incoming field reports, corroborate evidence, and dispatch responders.
                </p>
              </div>
            </button>

            {/* Coordinator Action 3: Shelter Management */}
            <button
              onClick={() => onNavigate('RESOURCES_SHELTERS')}
              className="p-4 rounded-2xl border border-neutral-200/90 bg-white hover:border-neutral-300 hover:shadow-xs text-left transition flex flex-col justify-between group shadow-2xs"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-full bg-neutral-900 text-white flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                  <span className="font-mono text-[11px]">{totalOpenSlots.toLocaleString()} slots open</span>
                  <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:translate-x-0.5 transition" />
                </div>
              </div>
              <div>
                <div className="text-xs font-bold text-neutral-900">Shelter Capacities & Master Logistics</div>
                <p className="text-[11px] text-neutral-500 mt-1 leading-snug">
                  Modify shelter amenities, bed allocations, and record relief goods distribution.
                </p>
              </div>
            </button>

            {/* Coordinator Action 4: Master Cartography */}
            <button
              onClick={() => onNavigate('MAP')}
              className="p-4 rounded-2xl border border-neutral-200/90 bg-white hover:border-neutral-300 hover:shadow-xs text-left transition flex flex-col justify-between group shadow-2xs"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-full bg-neutral-900 text-white flex items-center justify-center">
                  <Compass className="w-4 h-4 text-cyan-400" />
                </div>
                <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:translate-x-0.5 transition" />
              </div>
              <div>
                <div className="text-xs font-bold text-neutral-900">Master Operational GIS Map</div>
                <p className="text-[11px] text-neutral-500 mt-1 leading-snug">
                  Spatial corridor oversight, river gauge telemetry, road closures, and active clusters.
                </p>
              </div>
            </button>
          </>
        )}

        {currentUser.role === 'RESPONDER' && (
          <>
            {/* Responder Action 1: Missions Queue */}
            <button
              onClick={() => onNavigate('MISSIONS')}
              className="p-4 rounded-2xl border border-neutral-200/90 bg-white hover:border-neutral-300 hover:shadow-xs text-left transition flex flex-col justify-between group shadow-2xs"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-full bg-neutral-900 text-white flex items-center justify-center">
                  <Truck className="w-4 h-4 text-teal-400" />
                </div>
                <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:translate-x-0.5 transition" />
              </div>
              <div>
                <div className="text-xs font-bold text-neutral-900">Field Operations & Dispatches</div>
                <p className="text-[11px] text-neutral-500 mt-1 leading-snug">
                  Execute search & rescue missions, acknowledge dispatches, and log status updates.
                </p>
              </div>
            </button>

            {/* Responder Action 2: Field Report */}
            <button
              onClick={() => onNavigate('REPORT_INCIDENT')}
              className="p-4 rounded-2xl border border-neutral-200/90 bg-white hover:border-neutral-300 hover:shadow-xs text-left transition flex flex-col justify-between group shadow-2xs"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-full bg-neutral-900 text-white flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                </div>
                <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:translate-x-0.5 transition" />
              </div>
              <div>
                <div className="text-xs font-bold text-neutral-900">Log Field Hazard Assessment</div>
                <p className="text-[11px] text-neutral-500 mt-1 leading-snug">
                  Report high-water marks, road blockages, structural collapses, and trapped citizens.
                </p>
              </div>
            </button>

            {/* Responder Action 3: Tactical Map */}
            <button
              onClick={() => onNavigate('MAP')}
              className="p-4 rounded-2xl border border-neutral-200/90 bg-white hover:border-neutral-300 hover:shadow-xs text-left transition flex flex-col justify-between group shadow-2xs"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-full bg-neutral-900 text-white flex items-center justify-center">
                  <Compass className="w-4 h-4 text-cyan-400" />
                </div>
                <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:translate-x-0.5 transition" />
              </div>
              <div>
                <div className="text-xs font-bold text-neutral-900">Tactical Sector Route Map</div>
                <p className="text-[11px] text-neutral-500 mt-1 leading-snug">
                  View impassable roads, safe boat routes, flood depths, and staging locations.
                </p>
              </div>
            </button>

            {/* Responder Action 4: Shelters & Staging */}
            <button
              onClick={() => onNavigate('RESOURCES_SHELTERS')}
              className="p-4 rounded-2xl border border-neutral-200/90 bg-white hover:border-neutral-300 hover:shadow-xs text-left transition flex flex-col justify-between group shadow-2xs"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-full bg-neutral-900 text-white flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-emerald-400" />
                </div>
                <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:translate-x-0.5 transition" />
              </div>
              <div>
                <div className="text-xs font-bold text-neutral-900">Evacuation Centers & Staging Hubs</div>
                <p className="text-[11px] text-neutral-500 mt-1 leading-snug">
                  Monitor capacity thresholds and logistics inventories across evacuation facilities.
                </p>
              </div>
            </button>
          </>
        )}

        {currentUser.role === 'RESIDENT' && (
          <>
            {/* Resident Action 1: Request Help */}
            <button
              onClick={() => onNavigate('REQUEST_ASSISTANCE')}
              className="p-4 rounded-2xl border border-neutral-200/90 bg-white hover:border-neutral-300 hover:shadow-xs text-left transition flex flex-col justify-between group shadow-2xs"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-full bg-neutral-900 text-white flex items-center justify-center">
                  <HeartHandshake className="w-4 h-4 text-rose-400" />
                </div>
                <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:translate-x-0.5 transition" />
              </div>
              <div>
                <div className="text-xs font-bold text-neutral-900">Request Urgent Assistance (Saklolo)</div>
                <p className="text-[11px] text-neutral-500 mt-1 leading-snug">
                  Request rescue boat, medical aid, or emergency food/water supplies for your household.
                </p>
              </div>
            </button>

            {/* Resident Action 2: Shelters */}
            <button
              onClick={() => onNavigate('RESOURCES_SHELTERS')}
              className="p-4 rounded-2xl border border-neutral-200/90 bg-white hover:border-neutral-300 hover:shadow-xs text-left transition flex flex-col justify-between group shadow-2xs"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-full bg-neutral-900 text-white flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                  <span className="font-mono text-[11px]">{totalOpenSlots.toLocaleString()} slots open</span>
                  <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:translate-x-0.5 transition" />
                </div>
              </div>
              <div>
                <div className="text-xs font-bold text-neutral-900">Evacuation Shelters Directory</div>
                <p className="text-[11px] text-neutral-500 mt-1 leading-snug">
                  Find nearest open evacuation centers, wheelchair accessibility & medical clinics.
                </p>
              </div>
            </button>

            {/* Resident Action 3: Map */}
            <button
              onClick={() => onNavigate('MAP')}
              className="p-4 rounded-2xl border border-neutral-200/90 bg-white hover:border-neutral-300 hover:shadow-xs text-left transition flex flex-col justify-between group shadow-2xs"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-full bg-neutral-900 text-white flex items-center justify-center">
                  <Compass className="w-4 h-4 text-amber-400" />
                </div>
                <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:translate-x-0.5 transition" />
              </div>
              <div>
                <div className="text-xs font-bold text-neutral-900">Offline Evacuation Cartography</div>
                <p className="text-[11px] text-neutral-500 mt-1 leading-snug">
                  Safe evacuation corridors, flooded road closures, and nearest high-ground centers.
                </p>
              </div>
            </button>

            {/* Resident Action 4: AI Protocols */}
            <button
              onClick={() => onNavigate('ASK_RESILIA')}
              className="p-4 rounded-2xl border border-neutral-200/90 bg-white hover:border-neutral-300 hover:shadow-xs text-left transition flex flex-col justify-between group shadow-2xs"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-full bg-neutral-900 text-white flex items-center justify-center">
                  <HelpCircle className="w-4 h-4 text-teal-400" />
                </div>
                <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:translate-x-0.5 transition" />
              </div>
              <div>
                <div className="text-xs font-bold text-neutral-900">Disaster Knowledge AI</div>
                <p className="text-[11px] text-neutral-500 mt-1 leading-snug">
                  Instant offline protocols for floods, earthquakes, first-aid & water purification.
                </p>
              </div>
            </button>
          </>
        )}
      </section>

      {/* 6. DISASTER EMERGENCY PROTOCOL & ACTIONS MODAL (TRIGGERED BY BANNER) */}
      {isDisasterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-neutral-200 space-y-5 max-h-[90vh] overflow-y-auto transform transition-all animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-neutral-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-rose-600 text-white flex items-center justify-center">
                  <AlertOctagon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-neutral-900">
                    {disasterBannerTitle}
                  </h3>
                  <p className="text-xs text-neutral-500">
                    {disasterBannerSource}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsDisasterModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Official Advisory Notice */}
            <div className="bg-rose-50 rounded-xl p-4 border border-rose-200 text-xs text-rose-900 space-y-2">
              <strong className="font-bold flex items-center gap-1.5">
                <Radio className="w-4 h-4 text-rose-600" />
                <span>CDRRMO Official Directive & Situation Overview:</span>
              </strong>
              <p className="leading-relaxed">
                {disasterBannerMessage}
              </p>

              {/* Landfall Countdown pill in modal */}
              {typeof primaryAlert?.daysUntilLandfall === 'number' && (
                <div className="p-3 rounded-lg bg-amber-500/15 border border-amber-300 text-amber-950 space-y-1">
                  <div className="flex items-center justify-between font-bold">
                    <span>⏳ Landfall Countdown:</span>
                    <span className="font-black text-amber-900">
                      {primaryAlert.daysUntilLandfall === 0
                        ? '🔴 Landfall Imminent (<24h)'
                        : `${primaryAlert.daysUntilLandfall} day(s) until landfall`}
                    </span>
                  </div>
                  {primaryAlert.expectedLandfall && (
                    <p className="text-[11px] text-amber-800">
                      Impact Timeline: <strong>{primaryAlert.expectedLandfall}</strong>
                    </p>
                  )}
                  {typeof primaryAlert.signalLevel === 'number' && primaryAlert.signalLevel > 0 && (
                    <p className="text-[11px] font-mono font-bold text-neutral-900">
                      PAGASA TCWS Wind Signal #{primaryAlert.signalLevel}
                    </p>
                  )}
                </div>
              )}

              {community?.riverWaterLevelMeters !== undefined && (
                <div className="text-[11px] text-rose-800 pt-1 border-t border-rose-200/60 flex items-center justify-between">
                  <span>River Water Level Gauge: <strong>{riverLevel.toFixed(1)} meters</strong></span>
                  <span>Alert Tier: <strong>Level {community.riverAlertLevel ?? 2}</strong></span>
                </div>
              )}
            </div>

            {/* Nearest Evacuation Center Info */}
            <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-neutral-900 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-emerald-600" />
                  <span>Your Designated Evacuation Hub:</span>
                </span>
                <span className="font-mono text-emerald-700 font-bold">
                  {totalOpenSlots.toLocaleString()} Slots Available
                </span>
              </div>
              <div className="text-xs text-neutral-700 font-medium">
                {nearestShelter ? nearestShelter.name : 'Bgy. Tumana Elementary School'}
              </div>
              <div className="text-[11px] text-neutral-500">
                Location: {nearestShelter ? nearestShelter.locationName : 'Purok 1, Tumana Dike Access'}
              </div>
            </div>

            {/* Prescribed Preparations from Coordinator */}
            {primaryAlert?.preparations && primaryAlert.preparations.length > 0 ? (
              <div className="space-y-2 p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs">
                <h4 className="font-bold text-amber-950 flex items-center justify-between">
                  <span>Action Checklist: Recommended Preparations Before Landfall</span>
                  <span className="text-[10px] text-amber-800 font-bold font-mono">
                    {primaryAlert.preparations.length} Steps
                  </span>
                </h4>
                <div className="space-y-1.5 pt-0.5">
                  {primaryAlert.preparations.map((prep, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-white border border-amber-200/70 text-[11px]">
                      <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                        ✓
                      </span>
                      <span className="text-neutral-800 leading-snug">{prep}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Standard Resident Action Checklist fallback */
              <div className="space-y-2 text-xs">
                <h4 className="font-bold text-neutral-900">
                  Immediate Resident Action Checklist:
                </h4>
                <ul className="space-y-1.5 text-neutral-600 text-[11px]">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Switch off main electrical breaker and LPG tank before leaving house.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Bring Go-Bag: Vital documents in waterproof pouch, 3-day meds, water, whistle.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Assist elderly family members, pregnant women, and unchain pets to safe ground.</span>
                  </li>
                </ul>
              </div>
            )}

            {/* Affected Sectors */}
            {primaryAlert?.affectedZones && primaryAlert.affectedZones.length > 0 && (
              <div className="space-y-1 text-xs">
                <span className="font-bold text-neutral-700 uppercase tracking-wider text-[10px]">
                  Target Affected Zones & Sectors:
                </span>
                <div className="flex flex-wrap gap-1 pt-0.5">
                  {primaryAlert.affectedZones.map((z, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-neutral-100 border border-neutral-200 text-[11px] text-neutral-800">
                      {z}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Emergency Hotlines */}
            <div className="bg-neutral-900 text-white rounded-xl p-3.5 text-xs flex flex-wrap items-center justify-between gap-3 font-mono">
              <div className="flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-emerald-400" />
                <span>Marikina Rescue 161: <strong>(02) 8646-2436</strong></span>
              </div>
              <div className="text-[11px] text-neutral-400">
                Philippine Red Cross: <strong>143</strong>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-neutral-100">
              {currentUser.role === 'RESIDENT' && (
                <button
                  onClick={() => {
                    setIsDisasterModalOpen(false);
                    onNavigate('REQUEST_ASSISTANCE');
                  }}
                  className="px-3.5 py-2 rounded-xl border border-neutral-300 text-neutral-800 text-xs font-semibold hover:bg-neutral-100 transition"
                >
                  Request Rescue Aid
                </button>
              )}
              {currentUser.role === 'RESPONDER' && (
                <button
                  onClick={() => {
                    setIsDisasterModalOpen(false);
                    onNavigate('MISSIONS');
                  }}
                  className="px-3.5 py-2 rounded-xl border border-neutral-300 text-neutral-800 text-xs font-semibold hover:bg-neutral-100 transition"
                >
                  View Responder Queue
                </button>
              )}
              {currentUser.role === 'COORDINATOR' && (
                <button
                  onClick={() => {
                    setIsDisasterModalOpen(false);
                    onNavigate('COORDINATOR');
                  }}
                  className="px-3.5 py-2 rounded-xl border border-neutral-300 text-neutral-800 text-xs font-semibold hover:bg-neutral-100 transition"
                >
                  Incident Command EOC
                </button>
              )}
              <button
                onClick={() => {
                  setIsDisasterModalOpen(false);
                  onNavigate('MAP');
                }}
                className="px-4 py-2 rounded-xl bg-neutral-900 text-white text-xs font-semibold hover:bg-neutral-800 transition flex items-center gap-1.5"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Open Evacuation Route Map</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. RESOLUTION CONFIRMATION MODAL (FOR RESPONDERS) */}
      {resolvingIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-neutral-200 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2 text-neutral-900">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold">Mark Incident as Resolved</h3>
              </div>
              <button
                onClick={() => setResolvingIncident(null)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-neutral-600 space-y-2">
              <p>
                You are resolving: <strong>{resolvingIncident.title}</strong>
              </p>
              <label className="block text-xs font-semibold text-neutral-800 mt-2">
                Operational Resolution Note:
              </label>
              <textarea
                value={resolutionNoteInput}
                onChange={(e) => setResolutionNoteInput(e.target.value)}
                placeholder="e.g. Trapped citizens extracted, fallen debris cleared, road now passable."
                rows={3}
                className="w-full p-2.5 rounded-xl border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
              <button
                onClick={() => setResolvingIncident(null)}
                className="px-3 py-1.5 rounded-xl border border-neutral-200 text-xs font-medium hover:bg-neutral-100 text-neutral-700"
              >
                Cancel
              </button>
              <button
                disabled={isUpdatingResponderStatus}
                onClick={handleConfirmResolution}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition"
              >
                {isUpdatingResponderStatus ? 'Submitting...' : 'Confirm Resolved'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. QUICK WIN DR OPERATIONAL MODALS */}
      <SafetyCheckInModal
        isOpen={isSafetyCheckInOpen}
        onClose={() => setIsSafetyCheckInOpen(false)}
        shelters={shelters}
      />
      <GoBagChecklistModal
        isOpen={isGoBagOpen}
        onClose={() => setIsGoBagOpen(false)}
      />
      <EmergencyHotlinesModal
        isOpen={isHotlinesOpen}
        onClose={() => setIsHotlinesOpen(false)}
      />
    </div>
  );
};
