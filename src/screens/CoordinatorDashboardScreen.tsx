/**
 * Resilia Disaster Operations Command Center
 * Redesigned for authorized Disaster Coordinators (barangay officials / CDRRMO Incident Command).
 *
 * Design Language:
 * - Linear / Stripe Dashboard inspired — crisp typography (Inter), rigorous hierarchy, and restrained semantic colors.
 * - Answers key operational questions at a glance:
 *   1. What is happening in the sector? (KPI blocks + Situation Map + Live Activity)
 *   2. Which incidents are verified vs unverified? (Incident Truth Engine + Verification Modal)
 *   3. What resources/shelter capacities are available? (Shelter Occupancy Gauges + Supply Burn Rates)
 *   4. What assistance requests need triage/missions? (Distress Queue + 1-Click AI Mission Proposals)
 *   5. What are the AI recommendations? (Grounded AI Reasoning + Human Authorization)
 *
 * 8 Dedicated Operational Workspaces with Persistent Collapsible Sidebar:
 * 1. Operations Overview
 * 2. Situation Map
 * 3. Incidents & Reports Triage
 * 4. Assistance Requests Queue
 * 5. Field Missions & Approvals
 * 6. Resources & Shelters Management
 * 7. Community Safety Registry
 * 8. Sync & Audit Ledger
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../services/auth/authContext';
import {
  Activity,
  AlertCircle,
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  Building2,
  Camera,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  Compass,
  Copy,
  Cpu,
  Database,
  Download,
  Droplets,
  ExternalLink,
  FileCheck2,
  FileSpreadsheet,
  FileText,
  Filter,
  Flame,
  HardHat,
  Heart,
  HeartHandshake,
  HelpCircle,
  Home,
  Info,
  Layers,
  Lock,
  MapPin,
  Menu,
  MessageSquare,
  Navigation,
  Package,
  Phone,
  PhoneCall,
  Radio,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Truck,
  UserCheck,
  Users,
  Volume2,
  VolumeX,
  Waves,
  Wifi,
  WifiOff,
  Wind,
  X,
  XCircle,
  Zap,
} from 'lucide-react';
import {
  AIQuestionResponse,
  Alert,
  AssistanceRequest,
  AuditEntry,
  BackupDetails,
  Community,
  Incident,
  InventoryMovement,
  Mission,
  MovementType,
  Report,
  Resource,
  Shelter,
  ShelterStatus,
  SyncConflict,
  SyncEvent,
} from '../types';
import {
  MissionRepository,
  IncidentRepository,
  DisasterRepository,
  AlertRepository,
  ResourceRepository,
  ShelterRepository,
  AssistanceRepository,
} from '../services/repositories';
import { localDB, STORES } from '../services/offline/db';
import { DisasterTriggerModal } from '../components/coordinator/DisasterTriggerModal';
import { PostDisasterAdvisoryModal } from '../components/coordinator/PostDisasterAdvisoryModal';
import { SitrepModal } from '../components/coordinator/SitrepModal';
import { BackupDetailsModal } from '../components/coordinator/BackupDetailsModal';
import { SafetyCheckInModal } from '../components/safety/SafetyCheckInModal';
import { AyudaDistributionTrackerModal } from '../components/ayuda/AyudaDistributionTrackerModal';
import { MissingKinModal } from '../components/kin/MissingKinModal';
import { BayanihanBoardModal } from '../components/bayanihan/BayanihanBoardModal';
import { DiseaseOutbreakWatchModal } from '../components/health/DiseaseOutbreakWatchModal';
import { CoordinatorLiveFeed } from '../components/coordinator/CoordinatorLiveFeed';
import { LiveFeedService } from '../services/telemetry/liveFeedService';
import { emergencyAudio } from '../services/audio/emergencyAudio';
import {
  safetyCheckInService,
  SafetyCheckIn,
  CitizenSafetyStatus,
} from '../services/safety/safetyCheckInService';
import { ScreenId } from '../components/layout/Navbar';
import { useToast } from '../components/common/Toast';
import { syncClient } from '../services/offline/syncClient';
import { ResiliaMap } from '../components/map/ResiliaMap';
import {
  CoordinatorAIService,
  CoordinatorAIRecommendation,
} from '../services/agents/coordinatorAIService';
import { EventQueueService } from '../services/offline/eventQueue';
import { LocalAgentOrchestrator } from '../services/agents/localOrchestrator';
import { askResilia } from '../services/agents/askService';

interface CoordinatorDashboardProps {
  community: Community | null;
  alerts?: Alert[];
  shelters: Shelter[];
  incidents: Incident[];
  assistanceRequests: AssistanceRequest[];
  missions: Mission[];
  resources: Resource[];
  auditLogs: AuditEntry[];
  onNavigate?: (screen: ScreenId) => void;
  onDataChanged?: () => void;
}

export type CoordinatorTabId =
  | 'OVERVIEW'
  | 'MAP'
  | 'INCIDENTS'
  | 'ASSISTANCE'
  | 'MISSIONS'
  | 'RESOURCES'
  | 'SAFETY'
  | 'AYUDA'
  | 'KIN'
  | 'BAYANIHAN'
  | 'OUTBREAK'
  | 'ASK_AI'
  | 'HOTLINES'
  | 'SYNC';

const EMERGENCY_HOTLINES: {
  name: string;
  agency: string;
  number: string;
  telUri: string;
  category: 'ALL' | 'CDRRMO' | 'MEDICAL' | 'SECURITY' | 'UTILITY';
  badge: string;
}[] = [
  {
    name: 'National Emergency Hotline',
    agency: 'Emergency 911 Philippines',
    number: '911',
    telUri: 'tel:911',
    category: 'CDRRMO',
    badge: 'Immediate Response',
  },
  {
    name: 'Marikina Rescue 161',
    agency: 'Marikina City CDRRMO Emergency Ops',
    number: '161 / (02) 8646-2436',
    telUri: 'tel:161',
    category: 'CDRRMO',
    badge: 'River Patrol & Flood Evac',
  },
  {
    name: 'Philippine Red Cross Marikina',
    agency: 'Emergency Medical & Blood Bank',
    number: '143 / (02) 8790-2300',
    telUri: 'tel:143',
    category: 'MEDICAL',
    badge: 'Ambulance & Trauma Aid',
  },
  {
    name: 'Amang Rodriguez Memorial Medical Center',
    agency: 'Tertiary Government Hospital ER',
    number: '(02) 8941-5854',
    telUri: 'tel:0289415854',
    category: 'MEDICAL',
    badge: '24/7 Level 3 Trauma ER',
  },
  {
    name: 'Marikina Central Police Station',
    agency: 'Philippine National Police (PNP)',
    number: '117 / (02) 8941-6060',
    telUri: 'tel:117',
    category: 'SECURITY',
    badge: 'Security & Order',
  },
  {
    name: 'Bureau of Fire Protection Marikina',
    agency: 'BFP Central Fire Station',
    number: '(02) 8646-0427',
    telUri: 'tel:0286460427',
    category: 'SECURITY',
    badge: 'Fire & Hazmat Suppression',
  },
  {
    name: 'MMDA Flood Control & Metrobase',
    agency: 'Metropolitan Manila Development Authority',
    number: '136 / (02) 8882-4151',
    telUri: 'tel:136',
    category: 'UTILITY',
    badge: 'Metropolitan Watergates',
  },
  {
    name: 'Meralco Emergency Hotline',
    agency: 'Power Distribution & Downed Wires',
    number: '16211 / (02) 8631-1111',
    telUri: 'tel:16211',
    category: 'UTILITY',
    badge: 'High-Voltage De-energizing',
  },
  {
    name: 'Manila Water Hotline',
    agency: 'Potable Water Tanker Dispatch',
    number: '1627',
    telUri: 'tel:1627',
    category: 'UTILITY',
    badge: 'Emergency Drinking Water',
  },
];

const AI_SUGGESTED_QUERIES = [
  'Which evacuation center is accessible to wheelchair users?',
  'What is the current Marikina River alert level and evacuation threshold?',
  'Where can we get clean drinking water or relief food packs in Malanday?',
  'What are the emergency hotlines for Marikina Rescue 161?',
  'What is the standard emergency go-bag checklist for flood evacuation?',
];

const DISPATCHABLE_RESPONDERS = [
  { id: 'user_responder_juan', name: 'Officer Juan dela Cruz', unit: 'Marikina Rescue 161 (Tumana North)' },
  { id: 'team_boat_alpha', name: 'Rescue Boat Unit Alpha', unit: 'Tumana River Patrol' },
  { id: 'team_bfp_structural', name: 'BFP Structural Collapse Task Force', unit: 'Marikina Central Fire' },
  { id: 'team_ems_mobile', name: 'CDRRMO Rapid Medical EMS Team', unit: 'City Health Office' },
];

export const CoordinatorDashboardScreen: React.FC<CoordinatorDashboardProps> = ({
  community,
  alerts = [],
  shelters,
  incidents,
  assistanceRequests,
  missions,
  resources,
  auditLogs,
  onNavigate,
  onDataChanged,
}) => {
  const { currentUser } = useAuth();
  const { success: toastSuccess, error: toastError, warning: toastWarning, info: toastInfo } = useToast();

  // Active workspace tab
  const [activeTab, setActiveTab] = useState<CoordinatorTabId>('OVERVIEW');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Modal states
  const [isTriggerModalOpen, setIsTriggerModalOpen] = useState(false);
  const [isAdvisoryModalOpen, setIsAdvisoryModalOpen] = useState(false);
  const [advisoryInitialData, setAdvisoryInitialData] = useState<{
    title?: string;
    message?: string;
    disasterName?: string;
  } | undefined>(undefined);
  const [isSitrepOpen, setIsSitrepOpen] = useState(false);
  const [isSafetyModalOpen, setIsSafetyModalOpen] = useState(false);
  const [safetyModalTab, setSafetyModalTab] = useState<'CHECK_IN' | 'DIRECTORY'>('DIRECTORY');
  const [isStandingDown, setIsStandingDown] = useState(false);
  const [isSirenPlaying, setIsSirenPlaying] = useState(false);
  const sirenTimerRef = React.useRef<any>(null);

  // Verification & assignment states
  const [verifyingIncident, setVerifyingIncident] = useState<Incident | null>(null);
  const [verifyingIncidentReports, setVerifyingIncidentReports] = useState<Report[]>([]);
  const [verificationRationale, setVerificationRationale] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [assigningIncident, setAssigningIncident] = useState<Incident | null>(null);
  const [assigningMission, setAssigningMission] = useState<Mission | null>(null);
  const [missionVehicleType, setMissionVehicleType] = useState('Motorized Rubber Boat 161-B');
  const [selectedResponderId, setSelectedResponderId] = useState(DISPATCHABLE_RESPONDERS[0].id);
  const [dispatchInstructions, setDispatchInstructions] = useState('');
  const [isDispatching, setIsDispatching] = useState(false);
  const [isGeneratingMission, setIsGeneratingMission] = useState(false);
  const [selectedBackupRequest, setSelectedBackupRequest] = useState<AssistanceRequest | null>(null);
  const [selectedBackupIncident, setSelectedBackupIncident] = useState<{
    incident: Incident;
    backupDetails?: BackupDetails;
    linkedMission?: Mission;
    linkedRequest?: AssistanceRequest;
  } | null>(null);

  // Shelter quick update state
  const [editingShelter, setEditingShelter] = useState<Shelter | null>(null);
  const [shelterCapacityTotal, setShelterCapacityTotal] = useState(500);
  const [shelterOccupancy, setShelterOccupancy] = useState(0);
  const [shelterStatusVal, setShelterStatusVal] = useState<ShelterStatus>('OPEN');
  const [shelterWheelchair, setShelterWheelchair] = useState(true);
  const [shelterPower, setShelterPower] = useState(true);
  const [shelterClinic, setShelterClinic] = useState(true);
  const [shelterWater, setShelterWater] = useState(true);
  const [shelterLactating, setShelterLactating] = useState(false);
  const [shelterPetFriendly, setShelterPetFriendly] = useState(false);
  const [shelterOxygen, setShelterOxygen] = useState(false);
  const [shelterGroundFloor, setShelterGroundFloor] = useState(false);
  const [shelterPwdCapacity, setShelterPwdCapacity] = useState(0);
  const [shelterPwdCurrent, setShelterPwdCurrent] = useState(0);
  const [shelterPetCapacity, setShelterPetCapacity] = useState(0);
  const [shelterPetCurrent, setShelterPetCurrent] = useState(0);
  const [shelterContactPerson, setShelterContactPerson] = useState('');
  const [shelterContactPhone, setShelterContactPhone] = useState('');
  const [shelterRationale, setShelterRationale] = useState('');
  const [isSavingShelter, setIsSavingShelter] = useState(false);

  // Inventory movements state
  const [resourceSubTab, setResourceSubTab] = useState<'SHELTERS' | 'RESOURCES' | 'MOVEMENTS'>('SHELTERS');
  const [recordingResource, setRecordingResource] = useState<Resource | null>(null);
  const [deltaQuantity, setDeltaQuantity] = useState<number>(10);
  const [movementType, setMovementType] = useState<InventoryMovement['movementType']>('INBOUND_RELIEF');
  const [movementNotes, setMovementNotes] = useState('Delivery from DSWD staging warehouse');
  const [movementsHistory, setMovementsHistory] = useState<InventoryMovement[]>([]);
  const [isRecordingMovement, setIsRecordingMovement] = useState(false);

  // Ask AI state
  const [aiQuery, setAiQuery] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<AIQuestionResponse | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Hotlines state
  const [hotlineSearch, setHotlineSearch] = useState('');
  const [hotlineCategory, setHotlineCategory] = useState<'ALL' | 'CDRRMO' | 'MEDICAL' | 'SECURITY' | 'UTILITY'>('ALL');
  const [copiedNumber, setCopiedNumber] = useState<string | null>(null);

  // Safety roster filter & search
  const [safetyFilter, setSafetyFilter] = useState<CitizenSafetyStatus | 'ALL'>('ALL');
  const [safetySearch, setSafetySearch] = useState('');
  const [safetyStats, setSafetyStats] = useState(safetyCheckInService.getSummaryStats());
  const [safeCheckIns, setSafeCheckIns] = useState<SafetyCheckIn[]>(safetyCheckInService.getAll());

  // Incident & request filters
  const [incidentSearch, setIncidentSearch] = useState('');
  const [incidentStatusFilter, setIncidentStatusFilter] = useState<string>('ALL');
  const [requestSearch, setRequestSearch] = useState('');
  const [requestPriorityFilter, setRequestPriorityFilter] = useState<string>('ALL');

  // Sync state & offline tools
  const [syncStatus, setSyncStatus] = useState(syncClient.getStatus());
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(syncClient.getLastSyncTime());
  const [pendingSyncEvents, setPendingSyncEvents] = useState<any[]>([]);
  const [allSyncEvents, setAllSyncEvents] = useState<SyncEvent[]>([]);
  const [syncConflicts, setSyncConflicts] = useState<SyncConflict[]>([]);
  const [isSimulatedOffline, setIsSimulatedOffline] = useState(syncClient.isSimulatingOffline());
  const [isManualSyncing, setIsManualSyncing] = useState(false);

  // Strict RBAC Guard
  if (currentUser.role !== 'COORDINATOR') {
    return null;
  }

  // Audio lifecycle cleanup
  useEffect(() => {
    return () => {
      emergencyAudio.stop();
      if (sirenTimerRef.current) clearTimeout(sirenTimerRef.current);
    };
  }, []);

  // Fetch reports when verifying an incident
  useEffect(() => {
    if (verifyingIncident) {
      IncidentRepository.getReportsForIncident(verifyingIncident.id).then(setVerifyingIncidentReports);
    } else {
      setVerifyingIncidentReports([]);
    }
  }, [verifyingIncident]);

  // Refresh safety records reactively
  useEffect(() => {
    const handleSafetyUpdate = () => {
      setSafetyStats(safetyCheckInService.getSummaryStats());
      setSafeCheckIns(safetyCheckInService.search(safetySearch, safetyFilter));
    };
    handleSafetyUpdate();
    window.addEventListener('resilia_safety_checkin_updated', handleSafetyUpdate);
    window.addEventListener('resilia_sync_complete', handleSafetyUpdate);
    window.addEventListener('resilia_local_write', handleSafetyUpdate);
    const handleStorage = (e: StorageEvent) => {
      if (!e.key || e.key === 'resilia_safety_checkins_v1') {
        handleSafetyUpdate();
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('resilia_safety_checkin_updated', handleSafetyUpdate);
      window.removeEventListener('resilia_sync_complete', handleSafetyUpdate);
      window.removeEventListener('resilia_local_write', handleSafetyUpdate);
      window.removeEventListener('storage', handleStorage);
    };
  }, [safetySearch, safetyFilter, activeTab]);

  // Refresh pending sync queue
  useEffect(() => {
    const loadPending = async () => {
      const events = await EventQueueService.getPendingEvents();
      setPendingSyncEvents(events);
      setSyncStatus(syncClient.getStatus());
      setLastSyncTime(syncClient.getLastSyncTime());
    };
    loadPending();
    const unsub = syncClient.subscribe((s) => setSyncStatus(s));
    window.addEventListener('resilia_local_write', loadPending);
    window.addEventListener('resilia_sync_complete', loadPending);
    return () => {
      unsub();
      window.removeEventListener('resilia_local_write', loadPending);
      window.removeEventListener('resilia_sync_complete', loadPending);
    };
  }, []);

  // Compute live AI recommendations dynamically from stored records
  const dynamicRecommendations = CoordinatorAIService.generateRecommendations({
    community,
    alerts,
    shelters,
    incidents,
    assistanceRequests,
    missions,
    resources,
  });

  // KPI Calculations
  const activeIncidents = incidents.filter((i) => i.status !== 'RESOLVED');
  const unverifiedIncidents = incidents.filter((i) => i.status === 'REPORTED');
  const pendingRequests = assistanceRequests.filter((r) => {
    const linkedMission = r.assignedMissionId
      ? missions.find((m) => m.id === r.assignedMissionId)
      : missions.find(
          (m) => m.assistanceRequestId === r.id || m.evidenceRecordIds?.includes(r.id)
        );
    if (r.status === 'FULFILLED' || linkedMission?.status === 'COMPLETED') return false;
    return r.status === 'PENDING' || r.status === 'TRIAGED';
  });
  const criticalRequests = pendingRequests.filter((r) => r.priority === 'CRITICAL');
  const activeMissions = missions.filter((m) => m.status === 'ASSIGNED' || m.status === 'ACCEPTED' || m.status === 'IN_PROGRESS');
  const proposedMissions = missions.filter((m) => m.status === 'PROPOSED');
  const totalShelterCapacity = shelters.reduce((acc, s) => acc + s.capacityTotal, 0);
  const currentShelterOccupancy = shelters.reduce((acc, s) => acc + s.capacityCurrent, 0);
  const availableShelterSlots = Math.max(0, totalShelterCapacity - currentShelterOccupancy);
  const openShelters = shelters.filter((s) => s.status === 'OPEN' || s.status === 'NEAR_CAPACITY');

  // Active Disaster evaluation
  const activeAlerts = (alerts || []).filter((a) => a.active);
  const isRiverAlarmActive = LiveFeedService.classifyRiverAlertLevel(community?.riverWaterLevelMeters || 0) >= 2;
  const hasActiveDisaster = activeAlerts.length > 0 || isRiverAlarmActive;
  const primaryAlert = activeAlerts[0];
  const isExercise = primaryAlert?.isExercise || (community?.source && /demo|simulat/i.test(community.source));

  // --- ACTIONS ---

  const handleManualSync = async () => {
    setIsManualSyncing(true);
    try {
      const res = await syncClient.triggerSync();
      if (res.success) {
        toastSuccess(`Synchronized ${res.syncedCount} records with cloud server.`, 'Sync Complete');
      } else {
        toastWarning('Sync incomplete. Records safely preserved in local queue.', 'Offline Sync');
      }
      if (onDataChanged) onDataChanged();
    } catch (err: any) {
      toastError(err?.message || 'Sync failed', 'Sync Error');
    } finally {
      setIsManualSyncing(false);
    }
  };

  const handleStandDownDisaster = async () => {
    setIsStandingDown(true);
    try {
      await DisasterRepository.standDownAreaDisaster(
        currentUser,
        `All active disaster warnings stood down by Coordinator ${currentUser.name}. Sector returned to Normal Monitoring.`
      );
      if (onDataChanged) onDataChanged();
      toastSuccess('Disaster state stood down. Sector returned to normal monitoring status.', 'Disaster Advisory');
    } catch (err: any) {
      toastError(err.message || 'Failed to stand down disaster', 'Advisory Error');
    } finally {
      setIsStandingDown(false);
    }
  };

  const handleDismissAdvisory = async (alertId: string, alertTitle: string) => {
    try {
      await AlertRepository.dismissAlert(alertId, currentUser);
      if (onDataChanged) onDataChanged();
      toastSuccess(`Advisory "${alertTitle}" dismissed.`, 'Advisory Updated');
    } catch (err: any) {
      toastError(err.message || 'Failed to dismiss advisory', 'Error');
    }
  };

  const handleConfirmVerifyIncident = async (newStatus: 'VERIFIED' | 'CONTRADICTED' | 'RESOLVED') => {
    if (!verifyingIncident) return;
    if (!verificationRationale.trim()) {
      toastWarning('A verification rationale is required to explain this operational decision.', 'Rationale Required');
      return;
    }
    setIsVerifying(true);
    try {
      await IncidentRepository.verifyIncident(
        verifyingIncident.id,
        newStatus,
        verificationRationale.trim(),
        currentUser
      );
      toastSuccess(`Incident marked as ${newStatus}. Decision recorded in audit ledger.`, 'Verification Saved');
      setVerifyingIncident(null);
      setVerificationRationale('');
      if (onDataChanged) onDataChanged();
    } catch (err: any) {
      toastError(err.message || 'Failed to verify incident', 'Verification Error');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleConfirmAssignResponder = async () => {
    if (!assigningIncident) return;
    setIsDispatching(true);
    try {
      const responder =
        DISPATCHABLE_RESPONDERS.find((r) => r.id === selectedResponderId) || DISPATCHABLE_RESPONDERS[0];
      await IncidentRepository.assignResponder(
        assigningIncident.id,
        responder.id,
        responder.name,
        currentUser,
        dispatchInstructions.trim() || `Dispatched by Coordinator ${currentUser.name}`
      );
      toastSuccess(`Responder ${responder.name} assigned to incident!`, 'Dispatch Active');
      setAssigningIncident(null);
      setDispatchInstructions('');
      if (onDataChanged) onDataChanged();
    } catch (err: any) {
      toastError(err.message || 'Failed to assign responder', 'Dispatch Error');
    } finally {
      setIsDispatching(false);
    }
  };

  const handleConfirmAssignMissionResponder = async () => {
    if (!assigningMission) return;
    setIsDispatching(true);
    try {
      const responder =
        DISPATCHABLE_RESPONDERS.find((r) => r.id === selectedResponderId) || DISPATCHABLE_RESPONDERS[0];
      await MissionRepository.assignResponder(
        assigningMission.id,
        responder.id,
        responder.name,
        missionVehicleType || assigningMission.assignedVehicleType || 'Motorized Rubber Boat 161-B',
        currentUser,
        dispatchInstructions.trim() || `Dispatched by Coordinator ${currentUser.name}`
      );
      toastSuccess(`Responder ${responder.name} dispatched to mission!`, 'Mission Dispatched');
      setAssigningMission(null);
      setDispatchInstructions('');
      if (onDataChanged) onDataChanged();
    } catch (err: any) {
      toastError(err.message || 'Failed to assign responder to mission', 'Dispatch Error');
    } finally {
      setIsDispatching(false);
    }
  };

  const handleCreateAIMissionProposal = async (req: AssistanceRequest) => {
    setIsGeneratingMission(true);
    try {
      const proposed = await LocalAgentOrchestrator.proposeMissionForRequest(req, currentUser.id);
      if (proposed) {
        await EventQueueService.recordLocalWrite(
          'mission',
          STORES.MISSIONS,
          proposed,
          'CREATE',
          currentUser.id
        );
        await AssistanceRepository.updateStatus(
          req.id,
          'TRIAGED',
          currentUser,
          proposed.id
        );
        toastSuccess(`Mission Proposal generated for ${req.residentName}! Awaiting coordinator authorization.`, 'AI Dispatch Agent');
        if (onDataChanged) onDataChanged();
        setActiveTab('MISSIONS');
      }
    } catch (err: any) {
      toastError(err.message || 'Error proposing mission', 'Mission Error');
    } finally {
      setIsGeneratingMission(false);
    }
  };

  const handleOpenEditShelter = (s: Shelter) => {
    setEditingShelter(s);
    setShelterCapacityTotal(s.capacityTotal);
    setShelterOccupancy(s.capacityCurrent);
    setShelterStatusVal(s.status);
    setShelterWheelchair(s.isAccessibleWheelchair);
    setShelterPower(s.hasBackupPower);
    setShelterClinic(s.hasMedicalClinic);
    setShelterWater(s.hasPotableWater);
    setShelterLactating(s.hasLactatingStation ?? false);
    setShelterPetFriendly(s.hasPetFriendlyZone ?? false);
    setShelterOxygen(s.hasMedicalOxygen ?? false);
    setShelterGroundFloor(s.hasGroundFloorAccess ?? false);
    setShelterPwdCapacity(s.pwdCapacity ?? 0);
    setShelterPwdCurrent(s.pwdCurrent ?? 0);
    setShelterPetCapacity(s.petCapacity ?? 0);
    setShelterPetCurrent(s.petCurrent ?? 0);
    setShelterContactPerson(s.contactPerson || '');
    setShelterContactPhone(s.contactPhone || '');
    setShelterRationale('Updated capacity and operational features');
  };

  const handleSaveShelter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingShelter) return;
    setIsSavingShelter(true);
    try {
      await ShelterRepository.updateShelterFeatures(
        editingShelter.id,
        {
          capacityTotal: Number(shelterCapacityTotal),
          capacityCurrent: Number(shelterOccupancy),
          status: shelterStatusVal,
          isAccessibleWheelchair: shelterWheelchair,
          hasBackupPower: shelterPower,
          hasMedicalClinic: shelterClinic,
          hasPotableWater: shelterWater,
          hasLactatingStation: shelterLactating,
          hasPetFriendlyZone: shelterPetFriendly,
          hasMedicalOxygen: shelterOxygen,
          hasGroundFloorAccess: shelterGroundFloor,
          pwdCapacity: Number(shelterPwdCapacity),
          pwdCurrent: Number(shelterPwdCurrent),
          petCapacity: Number(shelterPetCapacity),
          petCurrent: Number(shelterPetCurrent),
          contactPerson: shelterContactPerson.trim(),
          contactPhone: shelterContactPhone.trim(),
        },
        currentUser,
        shelterRationale.trim() || 'Coordinators updated shelter operational features'
      );
      toastSuccess(`Shelter "${editingShelter.name}" capacity and features updated.`, 'Shelter Updated');
      setEditingShelter(null);
      if (onDataChanged) onDataChanged();
    } catch (err: any) {
      toastError(err.message || 'Failed to update shelter', 'Shelter Error');
    } finally {
      setIsSavingShelter(false);
    }
  };

  const handleApproveMission = async (missionId: string) => {
    try {
      await MissionRepository.updateMissionStatus(
        missionId,
        'APPROVED',
        currentUser,
        'Approved by Coordinator for field dispatch.'
      );
      toastSuccess('Mission approved & authorized for field dispatch!', 'Mission Approved');
      if (onDataChanged) onDataChanged();
    } catch (err: any) {
      toastError(err.message || 'Failed to approve mission', 'Mission Error');
    }
  };

  const handleRejectMission = async (missionId: string) => {
    try {
      await MissionRepository.updateMissionStatus(
        missionId,
        'REJECTED',
        currentUser,
        'Rejected by Coordinator after reviewing situational parameters.'
      );
      toastSuccess('Mission proposal declined.', 'Mission Status');
      if (onDataChanged) onDataChanged();
    } catch (err: any) {
      toastError(err.message || 'Failed to reject mission', 'Mission Error');
    }
  };

  const handleToggleVerifyCheckIn = (id: string) => {
    safetyCheckInService.toggleVerify(id, currentUser.name || 'Coordinator');
    setSafeCheckIns(safetyCheckInService.search(safetySearch, safetyFilter));
    setSafetyStats(safetyCheckInService.getSummaryStats());
  };

  const handleExportSafetyCsv = () => {
    const csvContent = safetyCheckInService.exportToCsv();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `resilia_citizen_safety_roster_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toastSuccess('Citizen safety roster exported to CSV.', 'Export Complete');
  };

  // Stock movements operations
  const loadMovements = async () => {
    try {
      const movs = await ResourceRepository.getMovements();
      setMovementsHistory(movs);
    } catch (e) {
      console.error('Failed to load movements:', e);
    }
  };

  useEffect(() => {
    if (activeTab === 'RESOURCES') {
      loadMovements();
    }
  }, [activeTab]);

  const handleRecordMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordingResource) return;
    setIsRecordingMovement(true);
    try {
      const delta =
        movementType === 'CONSUMPTION' || movementType === 'DISPATCH'
          ? -Math.abs(Number(deltaQuantity))
          : Math.abs(Number(deltaQuantity));

      await ResourceRepository.recordMovement(
        recordingResource.id,
        delta,
        movementType,
        recordingResource.locationName,
        'Field Staging Unit',
        currentUser,
        movementNotes.trim() || `Inventory update: ${movementType}`
      );

      toastSuccess(`Recorded ${movementType.replace(/_/g, ' ')} for ${recordingResource.name}.`, 'Stock Ledger Updated');
      setRecordingResource(null);
      setMovementNotes('');
      await loadMovements();
      if (onDataChanged) onDataChanged();
    } catch (err: any) {
      toastError(err?.message || 'Failed to record movement', 'Inventory Error');
    } finally {
      setIsRecordingMovement(false);
    }
  };

  // Ask AI operations
  const handleAskAiSubmit = async (queryText: string) => {
    if (!queryText.trim()) return;
    setIsAiLoading(true);
    setAiError(null);
    setAiResponse(null);
    try {
      const resp = await askResilia(queryText.trim());
      setAiResponse(resp);
    } catch (err: any) {
      setAiError(err?.message || 'Failed to query operational intelligence');
    } finally {
      setIsAiLoading(false);
    }
  };

  // Advanced sync tools
  const loadSyncData = async () => {
    try {
      const events = await EventQueueService.getAllEvents();
      const storedConflicts = await localDB.getAll<SyncConflict>(STORES.SYNC_CONFLICTS);
      setAllSyncEvents(events);
      setSyncConflicts(storedConflicts);
      setIsSimulatedOffline(syncClient.isSimulatingOffline());
    } catch (e) {
      console.error('Failed to load sync data:', e);
    }
  };

  useEffect(() => {
    loadSyncData();
  }, [pendingSyncEvents]);

  const handleToggleSimulateOffline = () => {
    const next = !isSimulatedOffline;
    syncClient.setSimulatedOffline(next);
    setIsSimulatedOffline(next);
    setSyncStatus(syncClient.getStatus());
    if (next) {
      toastWarning('Simulated offline mode enabled. Network requests are paused.', 'Offline Simulation');
    } else {
      toastSuccess('Simulated offline mode disabled. Normal connectivity restored.', 'Online Mode');
    }
  };

  const handleRetryFailedEvents = async () => {
    try {
      const count = await EventQueueService.retryAllFailed();
      toastSuccess(`Reset ${count} failed events back to PENDING status.`, 'Retry Complete');
      await loadSyncData();
      if (onDataChanged) onDataChanged();
    } catch (err: any) {
      toastError(err?.message || 'Failed to retry events', 'Retry Error');
    }
  };

  const handleResolveConflict = async (conflictId: string, choice: 'LOCAL' | 'REMOTE') => {
    try {
      const conf = syncConflicts.find((c) => c.id === conflictId);
      if (!conf) return;
      conf.resolved = true;
      conf.resolutionChoice = choice;
      conf.resolvedAt = new Date().toISOString();
      await localDB.put(STORES.SYNC_CONFLICTS, conf);

      if (choice === 'LOCAL') {
        const evt = allSyncEvents.find((e) => e.event_id === conf.event_id);
        if (evt) {
          evt.sync_status = 'PENDING';
          evt.last_error = undefined;
          await localDB.put(STORES.SYNC_EVENTS, evt);
        }
      }
      toastSuccess(`Conflict resolved using ${choice} data.`, 'Conflict Resolved');
      await loadSyncData();
      if (onDataChanged) onDataChanged();
    } catch (err: any) {
      toastError(err?.message || 'Failed to resolve conflict', 'Conflict Error');
    }
  };

  const handleCopyHotlineNumber = (num: string) => {
    navigator.clipboard.writeText(num);
    setCopiedNumber(num);
    toastSuccess(`Copied ${num} to clipboard`, 'Hotline Copied');
    setTimeout(() => setCopiedNumber(null), 2500);
  };

  // Nav menu destinations with badges
  const NAV_ITEMS: { id: CoordinatorTabId; label: string; badge?: number; badgeVariant?: 'rose' | 'amber' | 'neutral'; icon: any }[] = [
    { id: 'OVERVIEW', label: 'Operations Overview', icon: Compass },
    { id: 'MAP', label: 'Situation Map', icon: MapPin },
    { id: 'INCIDENTS', label: 'Incidents & Reports', badge: unverifiedIncidents.length, badgeVariant: 'amber', icon: Radio },
    { id: 'ASSISTANCE', label: 'Assistance Requests', badge: pendingRequests.length, badgeVariant: 'rose', icon: HeartHandshake },
    { id: 'MISSIONS', label: 'Missions & Approvals', badge: proposedMissions.length, badgeVariant: 'amber', icon: Truck },
    { id: 'RESOURCES', label: 'Resources & Shelters', badge: openShelters.length, badgeVariant: 'neutral', icon: Building2 },
    { id: 'SAFETY', label: 'Community Safety', badge: safetyStats.totalCheckIns, badgeVariant: 'neutral', icon: Users },
    { id: 'AYUDA', label: 'Ayuda Distribution', icon: Package },
    { id: 'KIN', label: 'Missing Kin Registry', icon: Users },
    { id: 'BAYANIHAN', label: 'Bayanihan Mutual Aid', icon: HeartHandshake },
    { id: 'OUTBREAK', label: 'Disease & Outbreak Watch', icon: Droplets },
    { id: 'ASK_AI', label: 'Ask AI Intelligence', icon: Sparkles },
    { id: 'HOTLINES', label: 'Agency Hotlines', icon: PhoneCall },
    { id: 'SYNC', label: 'Sync & Audit Trail', badge: pendingSyncEvents.length, badgeVariant: 'neutral', icon: RefreshCw },
  ];

  return (
    <div className="flex flex-col text-neutral-900 font-sans space-y-4">
      {/* ======================================================== */}
      {/* 1. PROFESSIONAL COMMAND BAR (LINEAR / STRIPE STYLE)     */}
      {/* ======================================================== */}
      <div className="bg-white border border-neutral-200/80 shadow-2xs rounded-xl p-3 sm:p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Left: Sector Title & ICP Metadata */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-neutral-900 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-semibold text-sm sm:text-base tracking-tight text-neutral-900 leading-tight">
                Disaster Operations Command Center
              </h1>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold tracking-wide uppercase bg-neutral-100 text-neutral-700 border border-neutral-200">
                EOC ACTIVE
              </span>
            </div>
            <p className="text-xs text-neutral-500 font-normal mt-0.5">
              {community?.name || 'Marikina Sector 2'} • CDRRMO Incident Command Post (ICP)
            </p>
          </div>
        </div>

        {/* Right: Operational Utility Controls */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Real Connectivity Indicator */}
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${
              syncStatus === 'ONLINE'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : syncStatus === 'SYNCING'
                ? 'bg-sky-50 text-sky-700 border-sky-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
          >
            {syncStatus === 'ONLINE' ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-mono text-[11px] uppercase tracking-wide">Online</span>
              </>
            ) : syncStatus === 'SYNCING' ? (
              <>
                <RefreshCw className="w-3 h-3 text-sky-600 animate-spin" />
                <span className="font-mono text-[11px] uppercase tracking-wide">Syncing</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 text-amber-600" />
                <span className="font-mono text-[11px] uppercase tracking-wide">Offline</span>
              </>
            )}
            <span className="text-[11px] font-mono text-neutral-500 pl-1.5 border-l border-neutral-200 tabular-nums">
              {pendingSyncEvents.length > 0 ? `${pendingSyncEvents.length} queued` : 'Synced'}
            </span>
          </div>

          {/* Quick SITREP Generator */}
          <button
            type="button"
            onClick={() => setIsSitrepOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-medium transition flex items-center gap-1.5 border border-neutral-200 shadow-2xs"
            title="Generate standard ICS-209 Situation Report"
          >
            <ClipboardList className="w-3.5 h-3.5 text-neutral-500" />
            <span className="hidden sm:inline">ICS-209 Sitrep</span>
          </button>

          {/* EAS Acoustic Siren Broadcast Toggle */}
          <button
            type="button"
            onClick={() => {
              if (isSirenPlaying) {
                emergencyAudio.stop();
                if (sirenTimerRef.current) clearTimeout(sirenTimerRef.current);
                setIsSirenPlaying(false);
              } else {
                emergencyAudio.play('EAS_ALERT', 12);
                setIsSirenPlaying(true);
                if (sirenTimerRef.current) clearTimeout(sirenTimerRef.current);
                sirenTimerRef.current = setTimeout(() => {
                  setIsSirenPlaying(false);
                }, 12000);
              }
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 border shadow-2xs ${
              isSirenPlaying
                ? 'bg-rose-600 hover:bg-rose-700 text-white border-rose-700 animate-pulse'
                : 'bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-200'
            }`}
            title="Broadcast audible Emergency Alert System dual-tone siren"
          >
            {isSirenPlaying ? (
              <VolumeX className="w-3.5 h-3.5" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-neutral-500" />
            )}
            <span>{isSirenPlaying ? 'Silence Siren' : 'EAS Siren'}</span>
          </button>

          {/* Declare / Modify Disaster Directive button */}
          <button
            type="button"
            onClick={() => setIsTriggerModalOpen(true)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shadow-2xs ${
              hasActiveDisaster
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : 'bg-neutral-900 hover:bg-neutral-800 text-white'
            }`}
          >
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>{hasActiveDisaster ? 'Modify Alert' : 'Declare Alert'}</span>
          </button>

          {/* Post Incoming Disaster / Typhoon Advisory */}
          <button
            type="button"
            onClick={() => setIsAdvisoryModalOpen(true)}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shadow-2xs bg-amber-600 hover:bg-amber-700 text-white"
            title="Broadcast incoming typhoon warning with landfall countdown and preparation checklist"
          >
            <Wind className="w-3.5 h-3.5" />
            <span>Post Advisory</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. CRITICAL DISASTER ADVISORY BANNER                    */}
      {/* ======================================================== */}
      {hasActiveDisaster && (
        <div className="bg-rose-50/70 border border-rose-200/90 rounded-xl p-4 sm:p-5 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                <ShieldAlert className="w-5 h-5 text-white" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-rose-600 text-white">
                    CRITICAL DIRECTIVE ACTIVE
                  </span>
                  {isExercise && (
                    <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-mono font-bold uppercase tracking-wider border border-amber-300">
                      SIMULATED EXERCISE — NOT A LIVE EMERGENCY
                    </span>
                  )}
                  <span className="text-xs text-neutral-500 font-mono tabular-nums">
                    Issued {primaryAlert?.issuedAt ? new Date(primaryAlert.issuedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'} by {primaryAlert?.source || 'CDRRMO'}
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-bold text-neutral-900 leading-snug">
                  {primaryAlert?.title || (isRiverAlarmActive ? `2nd Alarm River Flood Surge (${community?.riverWaterLevelMeters}m)` : 'Active Sector Emergency Directive')}
                </h2>
                <p className="text-xs sm:text-sm text-neutral-700 leading-relaxed max-w-4xl">
                  {primaryAlert?.message || 'Emergency disaster warning in effect. Low-lying zones advised to proceed to designated evacuation centers.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
              <button
                type="button"
                onClick={handleStandDownDisaster}
                disabled={isStandingDown}
                className="px-3 py-1.5 rounded-lg bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-medium transition flex items-center gap-1.5 border border-neutral-300 shadow-2xs"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isStandingDown ? 'animate-spin' : ''}`} />
                <span>Stand Down</span>
              </button>
              <button
                type="button"
                onClick={() => setIsTriggerModalOpen(true)}
                className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition shadow-2xs"
              >
                Modify Directive
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. RESPONSIVE WORKSPACE NAVIGATION & SHELL               */}
      {/* ======================================================== */}
      <div className="flex flex-col lg:flex-row gap-4 items-start">
        {/* Desktop Sidebar (Collapsible) */}
        <aside
          className={`bg-white border border-neutral-200/80 rounded-xl shadow-2xs transition-all duration-200 flex flex-col shrink-0 ${
            isSidebarCollapsed ? 'w-16' : 'w-64'
          } hidden lg:flex`}
        >
          <div className="p-3 border-b border-neutral-100 flex items-center justify-between">
            {!isSidebarCollapsed && (
              <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider px-1">
                Command Workspaces
              </span>
            )}
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-1 rounded-lg hover:bg-neutral-100 text-neutral-500 mx-auto transition"
              title={isSidebarCollapsed ? 'Expand navigation' : 'Collapse navigation'}
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>

          <nav className="p-2 space-y-1 flex-1" aria-label="Coordinator Workspaces">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition text-left relative ${
                    isActive
                      ? 'bg-neutral-900 text-white font-semibold shadow-2xs'
                      : 'text-neutral-700 hover:bg-neutral-100/80 hover:text-neutral-900 font-medium'
                  }`}
                  title={item.label}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-neutral-500'}`} />
                  {!isSidebarCollapsed && <span className="truncate flex-1">{item.label}</span>}
                  {typeof item.badge === 'number' && item.badge > 0 && !isSidebarCollapsed && (
                    <span
                      className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded tabular-nums ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : item.badgeVariant === 'rose'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : item.badgeVariant === 'amber'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-neutral-100 text-neutral-600 border border-neutral-200'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Quick Roster Status Footer */}
          {!isSidebarCollapsed && (
            <div className="p-3 border-t border-neutral-100 text-xs space-y-2">
              <div className="flex justify-between text-neutral-500 text-[11px]">
                <span>Safe Check-Ins:</span>
                <span className="font-semibold text-neutral-900 tabular-nums">
                  {safetyStats.totalPeopleAccounted} citizens
                </span>
              </div>
              <div className="flex justify-between text-neutral-500 text-[11px]">
                <span>Shelter Bed Vacancy:</span>
                <span className="font-semibold text-emerald-600 tabular-nums">
                  {availableShelterSlots.toLocaleString()} slots
                </span>
              </div>
            </div>
          )}
        </aside>

        {/* Mobile Horizontal Tabs (Scrollable Segmented Control) */}
        <div className="lg:hidden w-full overflow-x-auto pb-1 scrollbar-none">
          <div className="flex items-center gap-1.5 min-w-max p-1 bg-white border border-neutral-200/80 rounded-xl shadow-2xs">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition shrink-0 ${
                    isActive
                      ? 'bg-neutral-900 text-white shadow-2xs font-semibold'
                      : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                  {typeof item.badge === 'number' && item.badge > 0 && (
                    <span
                      className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded tabular-nums ${
                        isActive ? 'bg-white/20 text-white' : 'bg-neutral-100 text-neutral-600 border border-neutral-200'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ======================================================== */}
        {/* 4. MAIN WORKSPACE CANVAS                                 */}
        {/* ======================================================== */}
        <div key={activeTab} className="flex-1 w-full space-y-5 min-w-0">
          {/* ====================================================== */}
          {/* TAB 1: OPERATIONS OVERVIEW                             */}
          {/* ====================================================== */}
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-5">
              {/* Incoming Disaster Advisories & Typhoon Landfall Watch */}
              <div className="bg-amber-50/60 rounded-xl border border-amber-200/90 p-4 sm:p-5 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-200/80">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                      <Wind className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="font-bold text-sm text-neutral-900 tracking-tight flex items-center gap-2">
                        <span>Incoming Disaster & Typhoon Landfall Watch</span>
                        {activeAlerts.some((a) => typeof a.daysUntilLandfall === 'number' || a.disasterName) && (
                          <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-mono font-bold tracking-wide uppercase">
                            Active Advisory Broadcast
                          </span>
                        )}
                      </h2>
                      <p className="text-xs text-neutral-600 mt-0.5">
                        Broadcast incoming typhoons, days to landfall, affected sectors, and resident preparation checklists.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsAdvisoryModalOpen(true)}
                    className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-2xs transition flex items-center gap-1.5 self-start sm:self-auto"
                  >
                    <Wind className="w-3.5 h-3.5" />
                    <span>Post Incoming Advisory</span>
                  </button>
                </div>

                {/* List of active incoming disaster advisories */}
                {activeAlerts.filter((a) => typeof a.daysUntilLandfall === 'number' || a.disasterName).length > 0 ? (
                  <div className="space-y-3">
                    {activeAlerts
                      .filter((a) => typeof a.daysUntilLandfall === 'number' || a.disasterName)
                      .map((adv) => (
                        <div
                          key={adv.id}
                          className="bg-white rounded-xl border border-amber-200 p-3.5 sm:p-4 shadow-2xs space-y-2.5"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-bold text-sm text-neutral-900">{adv.title}</span>
                                {typeof adv.daysUntilLandfall === 'number' && (
                                  <span
                                    className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold tracking-wide border shadow-2xs ${
                                      adv.daysUntilLandfall === 0
                                        ? 'bg-rose-600 text-white border-rose-700 animate-pulse'
                                        : adv.daysUntilLandfall === 1
                                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                                        : 'bg-amber-50 text-amber-800 border-amber-200'
                                    }`}
                                  >
                                    {adv.daysUntilLandfall === 0
                                      ? 'Landfall Imminent (<24h)'
                                      : `Landfall in ${adv.daysUntilLandfall} Day${adv.daysUntilLandfall > 1 ? 's' : ''}`}
                                  </span>
                                )}
                                {typeof adv.signalLevel === 'number' && adv.signalLevel > 0 && (
                                  <span className="px-2 py-0.5 rounded bg-neutral-900 text-white text-[10px] font-mono font-semibold tracking-wide border border-neutral-800">
                                    TCWS Signal #{adv.signalLevel}
                                  </span>
                                )}
                                {adv.disasterName && (
                                  <span className="px-2 py-0.5 rounded bg-neutral-100 text-neutral-800 border border-neutral-200 text-[10px] font-mono font-semibold tracking-wide">
                                    {adv.disasterName}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-neutral-700 leading-relaxed">{adv.message}</p>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDismissAdvisory(adv.id, adv.title)}
                              className="px-2.5 py-1 rounded-lg bg-white hover:bg-rose-50 text-neutral-600 hover:text-rose-700 border border-neutral-200 hover:border-rose-200 text-xs font-medium transition self-start shrink-0 shadow-2xs"
                            >
                              Dismiss Advisory
                            </button>
                          </div>

                          {/* Preparations & Affected Sectors */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                            {adv.preparations && adv.preparations.length > 0 && (
                              <div className="p-2.5 rounded-lg bg-neutral-50 border border-neutral-200 space-y-1">
                                <span className="font-semibold text-neutral-800 block text-[11px]">
                                  Prescribed Preparations ({adv.preparations.length} action steps dispatched to users):
                                </span>
                                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-neutral-600">
                                  {adv.preparations.slice(0, 3).map((p, i) => (
                                    <li key={i} className="truncate">{p}</li>
                                  ))}
                                  {adv.preparations.length > 3 && (
                                    <li className="text-neutral-400">+{adv.preparations.length - 3} more steps</li>
                                  )}
                                </ul>
                              </div>
                            )}

                            {adv.affectedZones && adv.affectedZones.length > 0 && (
                              <div className="p-2.5 rounded-lg bg-neutral-50 border border-neutral-200 space-y-1">
                                <span className="font-semibold text-neutral-800 block text-[11px]">
                                  Target Sectors / Affected Zones:
                                </span>
                                <div className="flex flex-wrap gap-1">
                                  {adv.affectedZones.map((z, i) => (
                                    <span key={i} className="px-1.5 py-0.5 rounded bg-white border border-neutral-200 text-[10px] font-mono text-neutral-700">
                                      {z}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-lg bg-white/80 border border-amber-200/80 text-xs text-neutral-600 flex items-center justify-between">
                    <span>No incoming typhoon advisories currently broadcasted. Sector under normal weather monitoring.</span>
                    <button
                      type="button"
                      onClick={() => setIsAdvisoryModalOpen(true)}
                      className="text-amber-800 hover:text-amber-950 font-semibold underline shrink-0 ml-3"
                    >
                      Issue Weather Advisory
                    </button>
                  </div>
                )}
              </div>

              {/* Live Intelligence Feed for Disaster Coordinator: Real-Time Weather, Agency & Telemetry */}
              <CoordinatorLiveFeed
                community={community}
                alerts={alerts}
                incidents={incidents}
                assistanceRequests={assistanceRequests}
                missions={missions}
                auditLogs={auditLogs}
                onOpenAdvisoryModal={(data) => {
                  setAdvisoryInitialData(data);
                  setIsAdvisoryModalOpen(true);
                }}
                onNavigateToTab={(tabId) => setActiveTab(tabId as CoordinatorTabId)}
              />

              {/* Marikina River Hydrodynamic Telemetry (Non-Redundant Environmental Metric) */}
              {(() => {
                const meters = community?.riverWaterLevelMeters || 14.5;
                const alarmLevel = LiveFeedService.classifyRiverAlertLevel(meters);
                const badgeStyles = [
                  'bg-emerald-50 text-emerald-700 border-emerald-200',
                  'bg-amber-50/70 text-amber-700 border-amber-200',
                  'bg-amber-50 text-amber-700 border-amber-200',
                  'bg-rose-50 text-rose-700 border-rose-200 animate-pulse',
                ][alarmLevel];
                const badgeText = [
                  'Normal Flow (<15.0m)',
                  '1st Alarm · Water Alert & Standby (≥15.0m)',
                  '2nd Alarm · Pre-Emptive Evacuation (≥16.0m)',
                  '3rd Alarm · Forced Evacuation (≥18.0m)',
                ][alarmLevel];
                const iconBg = alarmLevel >= 3 ? 'bg-rose-600 text-white' : alarmLevel >= 2 ? 'bg-amber-600 text-white' : 'bg-emerald-600 text-white';
                const surgeLabel = alarmLevel >= 3 ? 'CRITICAL SURGE' : alarmLevel >= 2 ? 'ELEVATED SURGE' : 'BASELINE STAGE';
                const barColor = alarmLevel >= 3 ? 'bg-rose-600' : alarmLevel >= 2 ? 'bg-amber-500' : 'bg-emerald-600';
                const barWidth = `${Math.min(100, Math.max(8, ((meters - 12) / (20 - 12)) * 100))}%`;

                return (
                  <div className="bg-white rounded-xl border border-neutral-200/80 p-4 sm:p-5 shadow-2xs space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-100">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${iconBg}`}>
                          <Droplets className="w-4 h-4" />
                        </div>
                        <div>
                          <h2 className="font-semibold text-sm text-neutral-900 tracking-tight flex items-center gap-2">
                            <span>Marikina River Hydrodynamic Telemetry</span>
                            <span className="text-[11px] font-mono text-neutral-400">Sto. Niño / Tumana Sensor</span>
                          </h2>
                          <p className="text-xs text-neutral-500 mt-0.5">
                            Real-time river stage monitoring for sector dike overtopping and evacuation alarm thresholds.
                          </p>
                        </div>
                      </div>

                      <span
                        className={`self-start sm:self-auto px-2.5 py-1 rounded text-[11px] font-mono font-semibold uppercase tracking-wider border ${badgeStyles}`}
                      >
                        {badgeText}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                      <div className="sm:col-span-4 flex items-baseline gap-2">
                        <span className="text-3xl sm:text-4xl font-extrabold font-mono tracking-tight text-neutral-900 tabular-nums">
                          {meters.toFixed(1)}
                        </span>
                        <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">meters</span>
                        <span className="text-[11px] text-neutral-400 font-mono ml-auto">
                          {surgeLabel}
                        </span>
                      </div>

                      <div className="sm:col-span-8 space-y-1.5">
                        <div className="w-full h-2 rounded bg-neutral-100 overflow-hidden flex border border-neutral-200/50">
                          <div
                            style={{ width: barWidth }}
                            className={`h-full transition-all duration-300 ${barColor}`}
                          />
                        </div>
                        <div className="flex justify-between text-[11px] text-neutral-500 font-mono tabular-nums">
                          <span>12.0m Baseline</span>
                          <span className="font-semibold text-amber-600">15.0m (Alarm 1)</span>
                          <span className="font-semibold text-amber-700">16.0m (Alarm 2)</span>
                          <span className="font-semibold text-rose-600">18.0m (Alarm 3)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Operational Metrics (4 Linear/Stripe KPI Blocks) */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Metric 1 */}
                <button
                  type="button"
                  onClick={() => setActiveTab('INCIDENTS')}
                  className="p-4 rounded-xl bg-white border border-neutral-200/80 hover:border-neutral-300 transition text-left shadow-2xs group flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[10px] font-mono font-semibold text-neutral-400 uppercase tracking-wider">
                      Active Incidents
                    </span>
                    <Radio className="w-4 h-4 text-neutral-400 group-hover:text-neutral-700 transition" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-neutral-900 mt-2 tabular-nums">
                    {activeIncidents.length}
                  </div>
                  <div className="text-xs text-neutral-500 mt-1 flex items-center gap-1 font-mono tabular-nums">
                    {unverifiedIncidents.length > 0 ? (
                      <span className="text-amber-600 font-semibold">{unverifiedIncidents.length} unverified</span>
                    ) : (
                      <span className="text-emerald-600 font-medium">All verified</span>
                    )}
                    <span>• {incidents.filter((i) => i.status === 'VERIFIED').length} confirmed</span>
                  </div>
                </button>

                {/* Metric 2 */}
                <button
                  type="button"
                  onClick={() => setActiveTab('ASSISTANCE')}
                  className="p-4 rounded-xl bg-white border border-neutral-200/80 hover:border-neutral-300 transition text-left shadow-2xs group flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[10px] font-mono font-semibold text-neutral-400 uppercase tracking-wider">
                      Assistance Requests
                    </span>
                    <HeartHandshake className="w-4 h-4 text-neutral-400 group-hover:text-neutral-700 transition" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-neutral-900 mt-2 tabular-nums">
                    {pendingRequests.length}
                  </div>
                  <div className="text-xs text-neutral-500 mt-1 flex items-center gap-1 font-mono tabular-nums">
                    {criticalRequests.length > 0 ? (
                      <span className="text-rose-600 font-semibold">{criticalRequests.length} critical</span>
                    ) : (
                      <span className="text-neutral-600 font-medium">Normal priority</span>
                    )}
                    <span>• {pendingRequests.filter((r) => r.status === 'TRIAGED').length} triaged</span>
                  </div>
                </button>

                {/* Metric 3 */}
                <button
                  type="button"
                  onClick={() => setActiveTab('MISSIONS')}
                  className="p-4 rounded-xl bg-white border border-neutral-200/80 hover:border-neutral-300 transition text-left shadow-2xs group flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[10px] font-mono font-semibold text-neutral-400 uppercase tracking-wider">
                      Active Missions
                    </span>
                    <Truck className="w-4 h-4 text-neutral-400 group-hover:text-neutral-700 transition" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-neutral-900 mt-2 tabular-nums">
                    {activeMissions.length}
                  </div>
                  <div className="text-xs text-neutral-500 mt-1 flex items-center gap-1 font-mono tabular-nums">
                    {proposedMissions.length > 0 ? (
                      <span className="text-amber-600 font-semibold">{proposedMissions.length} awaiting approval</span>
                    ) : (
                      <span className="text-neutral-600 font-medium">No pending proposals</span>
                    )}
                  </div>
                </button>

                {/* Metric 4 */}
                <button
                  type="button"
                  onClick={() => setActiveTab('RESOURCES')}
                  className="p-4 rounded-xl bg-white border border-neutral-200/80 hover:border-neutral-300 transition text-left shadow-2xs group flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[10px] font-mono font-semibold text-neutral-400 uppercase tracking-wider">
                      Shelter Bed Vacancy
                    </span>
                    <Building2 className="w-4 h-4 text-neutral-400 group-hover:text-neutral-700 transition" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-emerald-600 mt-2 tabular-nums">
                    {availableShelterSlots.toLocaleString()}
                  </div>
                  <div className="text-xs text-neutral-500 mt-1 flex items-center gap-1 font-mono tabular-nums">
                    <span className="font-medium text-neutral-700">
                      {openShelters.length} of {shelters.length} centers open
                    </span>
                    <span>({Math.round((currentShelterOccupancy / Math.max(1, totalShelterCapacity)) * 100)}% occ)</span>
                  </div>
                </button>
              </div>

              {/* Two-Column Command Center Workspace */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                {/* Main Column (8 cols): Situation Map + Urgent Queues */}
                <div className="lg:col-span-8 space-y-5">
                  {/* Situation Map Preview */}
                  <div className="bg-white rounded-xl border border-neutral-200/80 p-4 sm:p-5 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-neutral-700" />
                        <h2 className="font-semibold text-sm text-neutral-900 tracking-tight">
                          Community Situation Map
                        </h2>
                        <span className="text-xs text-neutral-400 hidden sm:inline">
                          • Verified incidents, open shelters, and distress calls
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab('MAP')}
                        className="text-xs font-medium text-neutral-900 hover:text-emerald-700 flex items-center gap-1 transition"
                      >
                        <span>Full Canvas</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="rounded-lg overflow-hidden border border-neutral-200 h-72 sm:h-80 shadow-inner">
                      <ResiliaMap
                        shelters={shelters}
                        incidents={incidents.filter((i) => i.status === 'VERIFIED')}
                        resources={resources}
                        assistanceRequests={assistanceRequests}
                      />
                    </div>
                  </div>

                  {/* Urgent Assistance Queue */}
                  <div className="bg-white rounded-xl border border-neutral-200/80 p-4 sm:p-5 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                      <div className="flex items-center gap-2">
                        <HeartHandshake className="w-4 h-4 text-rose-600" />
                        <h2 className="font-semibold text-sm text-neutral-900 tracking-tight">
                          Assistance Requests Needing Action ({pendingRequests.length})
                        </h2>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab('ASSISTANCE')}
                        className="text-xs font-medium text-neutral-900 hover:text-emerald-700 flex items-center gap-1 transition"
                      >
                        <span>View All Queue</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="divide-y divide-neutral-100">
                      {pendingRequests.slice(0, 4).map((req) => (
                        <div key={req.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider shrink-0 border ${
                                  req.priority === 'CRITICAL'
                                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                                }`}
                              >
                                {req.priority} ({req.priorityScore})
                              </span>
                              <span className="font-semibold text-neutral-900">{req.residentName}</span>
                              <span className="text-neutral-500 font-mono tabular-nums">• {req.peopleCount} pax</span>
                              {req.vulnerabilityNeeds.wheelchairUser && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-neutral-100 text-neutral-700 border border-neutral-200">
                                  Wheelchair
                                </span>
                              )}
                              {req.vulnerabilityNeeds.elderlyCount > 0 && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-neutral-100 text-neutral-700 border border-neutral-200">
                                  {req.vulnerabilityNeeds.elderlyCount} Senior
                                </span>
                              )}
                            </div>
                            <p className="text-neutral-600 line-clamp-1">
                              <strong className="text-neutral-700 font-medium">{req.locationName}:</strong> {req.description}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleCreateAIMissionProposal(req)}
                            disabled={isGeneratingMission}
                            className="px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 text-white font-medium text-xs shrink-0 self-start sm:self-center transition shadow-2xs"
                          >
                            Propose Mission
                          </button>
                        </div>
                      ))}

                      {pendingRequests.length === 0 && (
                        <div className="py-6 text-center text-neutral-500 text-xs">
                          No pending assistance requests requiring coordinator triage.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Unverified Reports Triage Queue */}
                  <div className="bg-white rounded-xl border border-neutral-200/80 p-4 sm:p-5 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                      <div className="flex items-center gap-2">
                        <Radio className="w-4 h-4 text-amber-600" />
                        <h2 className="font-semibold text-sm text-neutral-900 tracking-tight">
                          Unresolved Field Reports ({unverifiedIncidents.length})
                        </h2>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab('INCIDENTS')}
                        className="text-xs font-medium text-neutral-900 hover:text-emerald-700 flex items-center gap-1 transition"
                      >
                        <span>Triage Table</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="divide-y divide-neutral-100">
                      {unverifiedIncidents.slice(0, 3).map((inc) => (
                        <div key={inc.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-mono text-[10px] uppercase font-semibold shrink-0">
                                {inc.type.replace('_', ' ')}
                              </span>
                              <span className="font-semibold text-neutral-900">{inc.title}</span>
                              {inc.floodDepthCm && (
                                <span className="text-[11px] font-mono text-neutral-500 tabular-nums">
                                  ({inc.floodDepthCm} cm)
                                </span>
                              )}
                            </div>
                            <p className="text-neutral-500 line-clamp-1">
                              {inc.locationName} • Reported by {inc.reporterName}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => setVerifyingIncident(inc)}
                            className="px-3 py-1.5 rounded-lg bg-white hover:bg-neutral-50 text-neutral-900 font-medium text-xs shrink-0 self-start sm:self-center transition border border-neutral-200 shadow-2xs"
                          >
                            Verify Report
                          </button>
                        </div>
                      ))}

                      {unverifiedIncidents.length === 0 && (
                        <div className="py-6 text-center text-neutral-500 text-xs">
                          All field incident reports have been verified or resolved.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Secondary Column (4 cols): AI Recommendations + Approvals + Audit */}
                <div className="lg:col-span-4 space-y-5">
                  {/* Grounded AI Recommendations Panel */}
                  <div className="bg-white rounded-xl border border-neutral-200/80 p-4 sm:p-5 shadow-2xs space-y-3.5">
                    <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-600" />
                        <h2 className="font-semibold text-sm text-neutral-900 tracking-tight">
                          AI Recommendations
                        </h2>
                      </div>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                        Grounded Logic
                      </span>
                    </div>

                    <div className="space-y-3">
                      {dynamicRecommendations.map((rec) => (
                        <div
                          key={rec.id}
                          className={`p-3.5 rounded-lg border text-xs space-y-2 ${
                            rec.severity === 'CRITICAL'
                              ? 'bg-rose-50/60 border-rose-200'
                              : 'bg-amber-50/60 border-amber-200'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-neutral-900 leading-snug">{rec.title}</span>
                            <span
                              className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded uppercase shrink-0 ${
                                rec.severity === 'CRITICAL'
                                  ? 'bg-rose-600 text-white'
                                  : 'bg-amber-600 text-white'
                              }`}
                            >
                              {rec.severity}
                            </span>
                          </div>

                          <p className="text-neutral-700 leading-relaxed text-xs">{rec.rationale}</p>

                          <div className="text-[11px] text-neutral-500 space-y-0.5 pt-1.5 border-t border-black/5">
                            <div>• Freshness: {rec.dataFreshness}</div>
                            <div>• Status: {rec.verificationStatus}</div>
                            {rec.uncertainties.length > 0 && (
                              <div className="text-amber-800 italic">• Caution: {rec.uncertainties[0]}</div>
                            )}
                          </div>

                          <div className="pt-2 border-t border-black/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <span className="text-[11px] font-semibold text-neutral-900 leading-snug">
                              Action: {rec.proposedAction}
                            </span>
                            {rec.actionType === 'OPEN_DISPATCH' && (
                              <button
                                type="button"
                                onClick={() => {
                                  const targetReq = assistanceRequests.find((r) => r.id === rec.actionTargetId);
                                  if (targetReq) {
                                    handleCreateAIMissionProposal(targetReq);
                                  } else {
                                    setActiveTab('ASSISTANCE');
                                  }
                                }}
                                className="px-2.5 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-[11px] shrink-0 transition shadow-2xs self-start sm:self-auto"
                              >
                                Propose Mission
                              </button>
                            )}
                            {rec.actionType === 'OPEN_VERIFY' && (
                              <button
                                type="button"
                                onClick={() => {
                                  const targetInc = incidents.find((i) => i.id === rec.actionTargetId);
                                  if (targetInc) {
                                    setVerifyingIncident(targetInc);
                                  } else {
                                    setActiveTab('INCIDENTS');
                                  }
                                }}
                                className="px-2.5 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-[11px] shrink-0 transition shadow-2xs self-start sm:self-auto"
                              >
                                Verify Report
                              </button>
                            )}
                            {(rec.actionType === 'OPEN_SHELTER' || rec.actionType === 'NAVIGATE') && (
                              <button
                                type="button"
                                onClick={() => setActiveTab('RESOURCES')}
                                className="px-2.5 py-1 rounded-lg bg-white hover:bg-neutral-50 text-neutral-900 border border-neutral-200 font-medium text-[11px] shrink-0 transition shadow-2xs self-start sm:self-auto"
                              >
                                Inspect Logistics
                              </button>
                            )}
                          </div>
                        </div>
                      ))}

                      {dynamicRecommendations.length === 0 && (
                        <div className="p-4 text-center text-xs text-neutral-500">
                          Operational telemetry is within normal baseline parameters.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Missions Awaiting Approval */}
                  <div className="bg-white rounded-xl border border-neutral-200/80 p-4 sm:p-5 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-neutral-700" />
                        <h2 className="font-semibold text-sm text-neutral-900 tracking-tight">
                          Mission Proposals ({proposedMissions.length})
                        </h2>
                      </div>
                      <span className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">
                        Human Approval
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {proposedMissions.map((m) => (
                        <div key={m.id} className="p-3.5 rounded-lg bg-neutral-50/80 border border-neutral-200 space-y-2 text-xs">
                          <div className="flex justify-between items-start gap-2">
                            <span className="font-semibold text-neutral-900">{m.title}</span>
                            <span className="font-mono text-[10px] text-rose-700 font-bold px-1.5 py-0.5 rounded bg-rose-50 border border-rose-200">
                              {m.priority}
                            </span>
                          </div>
                          <p className="text-neutral-600 text-xs line-clamp-2 leading-relaxed">{m.rationale}</p>
                          <div className="text-[11px] text-neutral-600">
                            Asset: <span className="font-medium text-neutral-900">{m.assignedVehicleType}</span>
                          </div>
                          <div className="flex gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => handleApproveMission(m.id)}
                              className="flex-1 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-xs transition shadow-2xs"
                            >
                              Authorize
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRejectMission(m.id)}
                              className="px-3 py-1.5 rounded-lg bg-white hover:bg-neutral-100 text-neutral-700 font-medium text-xs border border-neutral-200 transition shadow-2xs"
                            >
                              Decline
                            </button>
                          </div>
                        </div>
                      ))}

                      {proposedMissions.length === 0 && (
                        <div className="p-4 text-center text-xs text-neutral-500">
                          No pending mission proposals awaiting coordinator authorization.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Recent Operational Audit Activity */}
                  <div className="bg-white rounded-xl border border-neutral-200/80 p-4 sm:p-5 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-neutral-500" />
                        <h2 className="font-semibold text-sm text-neutral-900 tracking-tight">
                          Recent Activity Ledger
                        </h2>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab('SYNC')}
                        className="text-xs font-medium text-neutral-900 hover:text-emerald-700 transition"
                      >
                        All →
                      </button>
                    </div>

                    <div className="divide-y divide-neutral-100 text-xs">
                      {auditLogs.slice(0, 4).map((log) => (
                        <div key={log.id} className="py-2.5 space-y-0.5">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-medium text-neutral-900">{log.action}</span>
                            <span className="text-neutral-400 font-mono text-[11px] tabular-nums">
                              {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-neutral-500 text-xs line-clamp-1">{log.rationale}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ====================================================== */}
          {/* TAB 2: SITUATION MAP                                   */}
          {/* ====================================================== */}
          {activeTab === 'MAP' && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-neutral-200/80 p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-neutral-900 tracking-tight">
                    Full Cartographic Situation Map
                  </h2>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Multi-layer vector GIS displaying verified hazard zones, evacuation centers, relief supply hubs, and distress pins.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                    {incidents.filter((i) => i.status === 'VERIFIED').length} Verified Hazards
                  </span>
                  <span className="px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200 font-medium">
                    {openShelters.length} Open Shelters
                  </span>
                </div>
              </div>

              <div className="rounded-xl overflow-hidden border border-neutral-200/80 h-[75vh] shadow-2xs">
                <ResiliaMap
                  shelters={shelters}
                  incidents={incidents.filter((i) => i.status === 'VERIFIED')}
                  resources={resources}
                  assistanceRequests={assistanceRequests}
                  onSelectIncident={(inc) => setVerifyingIncident(inc)}
                  onSelectShelter={(sh) => handleOpenEditShelter(sh)}
                />
              </div>

              {/* Quick Facility & Hazard Inspection Below Map */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {/* Shelter Facilities Card */}
                <div className="bg-white rounded-xl border border-neutral-200/80 p-4 shadow-2xs space-y-2.5">
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                    <h3 className="font-semibold text-neutral-900 flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-emerald-600" />
                      <span>Evacuation Facilities ({shelters.length})</span>
                    </h3>
                    <span className="text-[11px] text-neutral-500 font-medium">Click to Update</span>
                  </div>
                  <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                    {shelters.map((s) => (
                      <div
                        key={s.id}
                        onClick={() => handleOpenEditShelter(s)}
                        className="p-2.5 rounded-lg bg-neutral-50 hover:bg-neutral-100/80 cursor-pointer border border-neutral-200 flex justify-between items-center transition"
                      >
                        <div className="space-y-0.5">
                          <div className="font-semibold text-neutral-900">{s.name}</div>
                          <div className="text-[11px] text-neutral-500">{s.locationName} • {s.capacityCurrent} / {s.capacityTotal} occ</div>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            s.status === 'OPEN'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : s.status === 'NEAR_CAPACITY'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {s.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Verified Hazard Markers Card */}
                <div className="bg-white rounded-xl border border-neutral-200/80 p-4 shadow-2xs space-y-2.5">
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                    <h3 className="font-semibold text-neutral-900 flex items-center gap-1.5">
                      <Radio className="w-4 h-4 text-emerald-600" />
                      <span>Verified Hazard Markers ({incidents.filter((i) => i.status === 'VERIFIED').length})</span>
                    </h3>
                    <span className="text-[11px] text-neutral-500 font-medium">Click to Triage</span>
                  </div>
                  <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                    {incidents.filter((i) => i.status === 'VERIFIED').length === 0 ? (
                      <div className="py-6 text-center text-neutral-400 text-xs italic">
                        No active verified hazards on the map.
                      </div>
                    ) : (
                      incidents
                        .filter((i) => i.status === 'VERIFIED')
                        .map((inc) => (
                          <div
                            key={inc.id}
                            onClick={() => setVerifyingIncident(inc)}
                            className="p-2.5 rounded-lg bg-neutral-50 hover:bg-neutral-100/80 cursor-pointer border border-neutral-200 flex justify-between items-center transition"
                          >
                            <div className="space-y-0.5 min-w-0">
                              <div className="font-semibold text-neutral-900 truncate">{inc.title}</div>
                              <div className="text-[11px] text-neutral-500 truncate">
                                {inc.locationName} {inc.floodDepthCm ? `• ${inc.floodDepthCm} cm depth` : ''}
                              </div>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold shrink-0 border ${
                                inc.severity === 'CRITICAL'
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}
                            >
                              {inc.severity}
                            </span>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ====================================================== */}
          {/* TAB 3: INCIDENTS & REPORTS TRIAGE                      */}
          {/* ====================================================== */}
          {activeTab === 'INCIDENTS' && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-neutral-200/80 p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-neutral-900 tracking-tight">
                    Incident Truth Engine & Report Verification
                  </h2>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Inspect incoming citizen distress reports, corroborate physical evidence, and dispatch rescue assets.
                  </p>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={incidentSearch}
                      onChange={(e) => setIncidentSearch(e.target.value)}
                      placeholder="Search title or location..."
                      className="pl-8 pr-3 py-1.5 rounded-lg border border-neutral-200 bg-white text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                    />
                  </div>
                  <select
                    value={incidentStatusFilter}
                    onChange={(e) => setIncidentStatusFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-neutral-200 bg-white text-xs font-medium text-neutral-700 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  >
                    <option value="ALL">All Statuses ({incidents.length})</option>
                    <option value="REPORTED">Unverified ({unverifiedIncidents.length})</option>
                    <option value="VERIFIED">Verified ({incidents.filter((i) => i.status === 'VERIFIED').length})</option>
                    <option value="CONTRADICTED">Contradicted</option>
                    <option value="RESOLVED">Resolved</option>
                  </select>
                </div>
              </div>

              {/* Incidents Data Table */}
              <div className="bg-white rounded-xl border border-neutral-200/80 overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-neutral-50/70 text-neutral-500 font-semibold text-[11px] uppercase tracking-wider border-b border-neutral-200">
                      <tr>
                        <th className="py-3 px-4">Type & Severity</th>
                        <th className="py-3 px-4">Title & Location</th>
                        <th className="py-3 px-4">Reporter / Source</th>
                        <th className="py-3 px-4">Evidence</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Assigned Unit</th>
                        <th className="py-3 px-4">Backup</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {(() => {
                        const filtered = incidents.filter((i) => {
                          const matchesSearch =
                            i.title.toLowerCase().includes(incidentSearch.toLowerCase()) ||
                            i.locationName.toLowerCase().includes(incidentSearch.toLowerCase());
                          const matchesFilter =
                            incidentStatusFilter === 'ALL' || i.status === incidentStatusFilter;
                          return matchesSearch && matchesFilter;
                        });

                        if (filtered.length === 0) {
                          return (
                            <tr>
                              <td colSpan={8} className="py-8 text-center text-neutral-500 text-xs">
                                No incident reports match your current search and filter criteria.
                              </td>
                            </tr>
                          );
                        }

                        return filtered.map((inc) => {
                          const linkedMission = missions.find(
                            (m) =>
                              m.evidenceRecordIds?.includes(inc.id) ||
                              m.id === inc.assignedResponderId ||
                              (m.title && inc.title && m.title.toLowerCase().includes(inc.title.toLowerCase()))
                          );
                          const linkedRequest = assistanceRequests.find(
                            (r) =>
                              r.id === inc.id ||
                              (linkedMission &&
                                (linkedMission.assistanceRequestId === r.id ||
                                  linkedMission.evidenceRecordIds?.includes(r.id)))
                          );

                          const hasBackup = Boolean(
                            inc.hasBackupRequest ||
                              inc.backupDetails?.requested ||
                              linkedMission?.hasBackupRequest ||
                              linkedMission?.backupDetails?.requested ||
                              linkedRequest?.hasBackupRequest ||
                              linkedRequest?.backupDetails?.requested
                          );
                          const backupObj =
                            inc.backupDetails || linkedMission?.backupDetails || linkedRequest?.backupDetails;

                          return (
                            <tr key={inc.id} className="hover:bg-neutral-50/60 transition">
                              <td className="py-3 px-4 whitespace-nowrap">
                                <div className="font-semibold text-neutral-900">{inc.type.replace('_', ' ')}</div>
                                <span
                                  className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wide mt-0.5 border ${
                                    inc.severity === 'CRITICAL'
                                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                                      : inc.severity === 'HIGH'
                                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  }`}
                                >
                                  {inc.severity}
                                </span>
                              </td>
                              <td className="py-3 px-4 max-w-xs">
                                <div className="font-medium text-neutral-900">{inc.title}</div>
                                <div className="text-[11px] text-neutral-500">{inc.locationName}</div>
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap">
                                <div className="font-medium text-neutral-900">{inc.reporterName}</div>
                                <div className="text-[11px] text-neutral-400 font-mono tabular-nums">
                                  {new Date(inc.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              </td>
                              <td className="py-3 px-4 text-neutral-700 whitespace-nowrap">
                                {inc.floodDepthCm ? `${inc.floodDepthCm} cm depth` : 'None'}
                                {inc.photoUrl && (
                                  <span className="ml-1 text-[11px] text-emerald-700 font-semibold">• Photo</span>
                                )}
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wide border ${
                                    inc.status === 'VERIFIED'
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : inc.status === 'CONTRADICTED'
                                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                                      : inc.status === 'RESOLVED'
                                      ? 'bg-neutral-100 text-neutral-600 border-neutral-200'
                                      : 'bg-amber-50 text-amber-700 border-amber-200'
                                  }`}
                                >
                                  {inc.status}
                                </span>
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap">
                                {inc.assignedResponderName ? (
                                  <span className="font-medium text-neutral-900">{inc.assignedResponderName}</span>
                                ) : (
                                  <span className="text-neutral-400">Unassigned</span>
                                )}
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap">
                                {hasBackup && backupObj ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setSelectedBackupIncident({
                                        incident: { ...inc, backupDetails: backupObj },
                                        backupDetails: backupObj,
                                        linkedMission,
                                        linkedRequest,
                                      })
                                    }
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 hover:border-rose-300 transition cursor-pointer shadow-2xs group"
                                    title="Click to view responder backup details"
                                  >
                                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
                                    <span>Yes</span>
                                    <span className="text-[11px] font-medium text-rose-600 underline group-hover:text-rose-800 ml-0.5">
                                      (View Details)
                                    </span>
                                  </button>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium text-neutral-400 bg-neutral-100 border border-neutral-200">
                                    No
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => setAssigningIncident(inc)}
                                  className="px-2.5 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-xs transition shadow-2xs"
                                >
                                  {inc.assignedResponderName ? 'Reassign' : 'Dispatch'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setVerifyingIncident(inc)}
                                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-neutral-50 text-neutral-900 font-medium text-xs border border-neutral-200 transition shadow-2xs"
                                >
                                  Triage
                                </button>
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ====================================================== */}
          {/* TAB 4: ASSISTANCE REQUESTS QUEUE                       */}
          {/* ====================================================== */}
          {activeTab === 'ASSISTANCE' && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-neutral-200/80 p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-neutral-900 tracking-tight">
                    Citizen Assistance Requests Queue
                  </h2>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Prioritized distress calls triaged by deterministic vulnerability scoring (infants, elderly, bedridden, medical).
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={requestSearch}
                      onChange={(e) => setRequestSearch(e.target.value)}
                      placeholder="Search resident or location..."
                      className="pl-8 pr-3 py-1.5 rounded-lg border border-neutral-200 bg-white text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                    />
                  </div>
                  <select
                    value={requestPriorityFilter}
                    onChange={(e) => setRequestPriorityFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-neutral-200 bg-white text-xs font-medium text-neutral-700 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  >
                    <option value="ALL">All Priorities ({assistanceRequests.length})</option>
                    <option value="CRITICAL">Critical ({criticalRequests.length})</option>
                    <option value="HIGH">High Priority</option>
                    <option value="MEDIUM">Medium Priority</option>
                    <option value="LOW">Low Priority</option>
                  </select>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-neutral-200/80 overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-neutral-50/70 text-neutral-500 font-semibold text-[11px] uppercase tracking-wider border-b border-neutral-200">
                      <tr>
                        <th className="py-3 px-4">Priority (Score)</th>
                        <th className="py-3 px-4">Resident & Contact</th>
                        <th className="py-3 px-4">Headcount & Vulnerability</th>
                        <th className="py-3 px-4">Location</th>
                        <th className="py-3 px-4">Assistance Need</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Backup</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {(() => {
                        const filtered = assistanceRequests.filter((r) => {
                          const matchesSearch =
                            r.residentName.toLowerCase().includes(requestSearch.toLowerCase()) ||
                            r.locationName.toLowerCase().includes(requestSearch.toLowerCase());
                          const matchesPriority =
                            requestPriorityFilter === 'ALL' || r.priority === requestPriorityFilter;
                          return matchesSearch && matchesPriority;
                        });

                        if (filtered.length === 0) {
                          return (
                            <tr>
                              <td colSpan={8} className="py-8 text-center text-neutral-500 text-xs">
                                No assistance requests match your search and filter criteria.
                              </td>
                            </tr>
                          );
                        }

                        return filtered.map((req) => {
                          const linkedMission = req.assignedMissionId
                            ? missions.find((m) => m.id === req.assignedMissionId)
                            : missions.find(
                                (m) =>
                                  m.assistanceRequestId === req.id ||
                                  m.evidenceRecordIds?.includes(req.id)
                              );
                          const isFulfilled = req.status === 'FULFILLED' || linkedMission?.status === 'COMPLETED';
                          const isInProgress = req.status === 'IN_PROGRESS' || linkedMission?.status === 'IN_PROGRESS' || linkedMission?.status === 'ACCEPTED';
                          const isAssigned = req.status === 'ASSIGNED' || linkedMission?.status === 'ASSIGNED';
                          const isTriaged = req.status === 'TRIAGED' || linkedMission?.status === 'PROPOSED' || linkedMission?.status === 'APPROVED';

                          const hasBackup = Boolean(
                            req.hasBackupRequest ||
                              req.backupDetails?.requested ||
                              linkedMission?.hasBackupRequest ||
                              linkedMission?.backupDetails?.requested
                          );
                          const backupObj = req.backupDetails || linkedMission?.backupDetails;

                          return (
                            <tr key={req.id} className="hover:bg-neutral-50/60 transition">
                              <td className="py-3 px-4 whitespace-nowrap">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wide border ${
                                    req.priority === 'CRITICAL'
                                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                                      : req.priority === 'HIGH'
                                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  }`}
                                >
                                  {req.priority} ({req.priorityScore})
                                </span>
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap">
                                <div className="font-semibold text-neutral-900">{req.residentName}</div>
                                <div className="text-[11px] text-neutral-500 font-mono tabular-nums">{req.contactPhone}</div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="font-medium text-neutral-900 font-mono tabular-nums">{req.peopleCount} pax</div>
                                <div className="text-[10px] text-neutral-500 flex flex-wrap gap-1 mt-0.5">
                                  {req.vulnerabilityNeeds.wheelchairUser && (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-neutral-100 text-neutral-700 border border-neutral-200">
                                      Wheelchair
                                    </span>
                                  )}
                                  {req.vulnerabilityNeeds.bedridden && (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-rose-50 text-rose-700 border border-rose-200">
                                      Bedridden
                                    </span>
                                  )}
                                  {req.vulnerabilityNeeds.elderlyCount > 0 && (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-neutral-100 text-neutral-700 border border-neutral-200">
                                      {req.vulnerabilityNeeds.elderlyCount} Senior
                                    </span>
                                  )}
                                  {req.vulnerabilityNeeds.infantCount > 0 && (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-neutral-100 text-neutral-700 border border-neutral-200">
                                      {req.vulnerabilityNeeds.infantCount} Infant
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-4 max-w-xs text-neutral-800">{req.locationName}</td>
                              <td className="py-3 px-4 max-w-xs">
                                <div className="font-semibold text-neutral-900">{req.category.replace('_', ' ')}</div>
                                <div className="text-[11px] text-neutral-500 line-clamp-1">{req.description}</div>
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wide border ${
                                    isFulfilled
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : isInProgress
                                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                                      : isAssigned
                                      ? 'bg-sky-50 text-sky-700 border-sky-200'
                                      : isTriaged
                                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                                      : 'bg-neutral-100 text-neutral-700 border border-neutral-200'
                                  }`}
                                >
                                  {isFulfilled ? 'FULFILLED' : isInProgress ? 'IN PROGRESS' : isAssigned ? 'ASSIGNED' : isTriaged ? 'TRIAGED' : req.status}
                                </span>
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap">
                                {hasBackup && backupObj ? (
                                  <button
                                    type="button"
                                    onClick={() => setSelectedBackupRequest({ ...req, backupDetails: backupObj })}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 hover:border-rose-300 transition cursor-pointer shadow-2xs group"
                                    title="Click to view responder backup details"
                                  >
                                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
                                    <span>Yes</span>
                                    <span className="text-[11px] font-medium text-rose-600 underline group-hover:text-rose-800 ml-0.5">
                                      (View Details)
                                    </span>
                                  </button>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium text-neutral-400 bg-neutral-100 border border-neutral-200">
                                    No
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-right whitespace-nowrap">
                                {isFulfilled ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    Fulfilled ✓
                                  </span>
                                ) : isInProgress ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                    In Progress
                                  </span>
                                ) : isAssigned ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                                    Assigned
                                  </span>
                                ) : isTriaged ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                    Mission Proposed
                                  </span>
                                ) : !req.assignedMissionId && req.status === 'PENDING' ? (
                                  <button
                                    type="button"
                                    onClick={() => handleCreateAIMissionProposal(req)}
                                    disabled={isGeneratingMission}
                                    className="px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-xs transition shadow-2xs"
                                  >
                                    Generate Mission
                                  </button>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-neutral-100 text-neutral-700 border border-neutral-200">
                                    {req.status}
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ====================================================== */}
          {/* TAB 5: MISSIONS & APPROVALS WORKSPACE                  */}
          {/* ====================================================== */}
          {activeTab === 'MISSIONS' && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-neutral-200/80 p-4 shadow-2xs flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-neutral-900 tracking-tight">
                    Field Missions & Human Authorization
                  </h2>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Coordinating rescue and supply delivery lifecycle: PROPOSED → APPROVED → ASSIGNED → IN_PROGRESS → COMPLETED.
                  </p>
                </div>
              </div>

              {/* Pending Proposals Section */}
              {proposedMissions.length > 0 && (
                <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <h3 className="font-semibold text-sm text-neutral-900 tracking-tight">
                      Proposals Requiring Coordinator Authorization ({proposedMissions.length})
                    </h3>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {proposedMissions.map((m) => (
                      <div key={m.id} className="p-4 rounded-lg bg-white border border-neutral-200 shadow-2xs space-y-2 text-xs">
                        <div className="flex justify-between items-start gap-2">
                          <span className="font-semibold text-sm text-neutral-900">{m.title}</span>
                          <span className="font-mono text-[10px] text-rose-700 font-bold px-1.5 py-0.5 rounded bg-rose-50 border border-rose-200">
                            {m.priority}
                          </span>
                        </div>
                        <p className="text-neutral-600 text-xs leading-relaxed">{m.rationale}</p>
                        <div className="bg-neutral-50 p-2.5 rounded-lg text-xs space-y-0.5 text-neutral-700">
                          <div>
                            <strong className="text-neutral-500">Pickup:</strong> {m.pickupLocation}
                          </div>
                          <div>
                            <strong className="text-neutral-500">Destination:</strong> {m.destinationLocation}
                          </div>
                          <div>
                            <strong className="text-neutral-500">Asset:</strong> {m.assignedVehicleType}
                          </div>
                        </div>
                        <div className="flex gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => handleApproveMission(m.id)}
                            className="flex-1 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-xs transition shadow-2xs"
                          >
                            Authorize Mission
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRejectMission(m.id)}
                            className="px-3 py-1.5 rounded-lg bg-white hover:bg-neutral-100 text-neutral-700 font-medium text-xs border border-neutral-200 transition shadow-2xs"
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* All Active Missions Table */}
              <div className="bg-white rounded-xl border border-neutral-200/80 overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-neutral-50/70 text-neutral-500 font-semibold text-[11px] uppercase tracking-wider border-b border-neutral-200">
                      <tr>
                        <th className="py-3 px-4">Mission ID & Priority</th>
                        <th className="py-3 px-4">Title & Details</th>
                        <th className="py-3 px-4">Route (Pickup → Dropoff)</th>
                        <th className="py-3 px-4">Assigned Unit</th>
                        <th className="py-3 px-4">Status Lifecycle</th>
                        <th className="py-3 px-4">Trail</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {missions.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-neutral-500 text-xs">
                            No field missions recorded. Generate a mission proposal from an assistance request to begin dispatch.
                          </td>
                        </tr>
                      ) : (
                        missions.map((m) => (
                          <tr key={m.id} className="hover:bg-neutral-50/60 transition">
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span className="font-mono font-medium text-neutral-900 block">{m.id}</span>
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wide bg-neutral-100 text-neutral-700 border border-neutral-200 mt-0.5">
                                {m.priority}
                              </span>
                            </td>
                            <td className="py-3 px-4 max-w-xs">
                              <div className="font-semibold text-neutral-900">{m.title}</div>
                              <div className="text-[11px] text-neutral-500 line-clamp-1">{m.vulnerabilitySummary}</div>
                            </td>
                            <td className="py-3 px-4 max-w-xs">
                              <div className="font-medium text-neutral-900 truncate">{m.pickupLocation}</div>
                              <div className="text-[11px] text-emerald-700 truncate">→ {m.destinationLocation}</div>
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <div className="font-semibold text-neutral-900">
                                {m.assignedResponderName || 'Unassigned'}
                              </div>
                              <div className="text-[11px] text-neutral-500">{m.assignedVehicleType}</div>
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wide border ${
                                  m.status === 'COMPLETED'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : m.status === 'IN_PROGRESS'
                                    ? 'bg-sky-50 text-sky-700 border-sky-200'
                                    : m.status === 'APPROVED'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : m.status === 'REJECTED'
                                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                                }`}
                              >
                                {m.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-[11px] text-neutral-400 font-mono tabular-nums whitespace-nowrap">
                              {m.statusHistory.length} event(s)
                            </td>
                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              {m.status === 'APPROVED' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAssigningMission(m);
                                    setMissionVehicleType(m.assignedVehicleType || 'Motorized Rubber Boat 161-B');
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-xs transition shadow-2xs"
                                >
                                  Dispatch
                                </button>
                              )}
                              {m.status === 'ASSIGNED' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAssigningMission(m);
                                    setMissionVehicleType(m.assignedVehicleType || 'Motorized Rubber Boat 161-B');
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-neutral-50 text-neutral-700 font-medium text-xs border border-neutral-200 transition shadow-2xs"
                                >
                                  Reassign
                                </button>
                              )}
                              {m.status !== 'APPROVED' && m.status !== 'ASSIGNED' && (
                                <span className="text-[11px] text-neutral-400">{m.status}</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ====================================================== */}
          {/* TAB 6: RESOURCES & SHELTERS MANAGEMENT                */}
          {/* ====================================================== */}
          {activeTab === 'RESOURCES' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-neutral-200/80 p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-neutral-900 tracking-tight">
                    Shelters & Relief Supply Logistics
                  </h2>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Real-time evacuation capacity meters, consumable burn rates, and staging inventory movements.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex bg-neutral-100 p-0.5 rounded-lg text-xs font-medium">
                    <button
                      type="button"
                      onClick={() => setResourceSubTab('SHELTERS')}
                      className={`px-3 py-1 rounded-md transition ${
                        resourceSubTab === 'SHELTERS' ? 'bg-white text-neutral-900 shadow-2xs font-semibold' : 'text-neutral-500 hover:text-neutral-900'
                      }`}
                    >
                      Shelters ({shelters.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setResourceSubTab('RESOURCES')}
                      className={`px-3 py-1 rounded-md transition ${
                        resourceSubTab === 'RESOURCES' ? 'bg-white text-neutral-900 shadow-2xs font-semibold' : 'text-neutral-500 hover:text-neutral-900'
                      }`}
                    >
                      Supplies ({resources.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setResourceSubTab('MOVEMENTS');
                        loadMovements();
                      }}
                      className={`px-3 py-1 rounded-md transition ${
                        resourceSubTab === 'MOVEMENTS' ? 'bg-white text-neutral-900 shadow-2xs font-semibold' : 'text-neutral-500 hover:text-neutral-900'
                      }`}
                    >
                      Movements Ledger ({movementsHistory.length})
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (resources.length > 0) {
                        setRecordingResource(resources[0]);
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold transition shadow-2xs flex items-center gap-1.5"
                  >
                    <Package className="w-3.5 h-3.5" />
                    <span>Record Stock Movement</span>
                  </button>
                </div>
              </div>

              {/* Sub-tab 1: Shelters Grid */}
              {(resourceSubTab === 'SHELTERS' || resourceSubTab === 'RESOURCES') && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                      Evacuation Centers ({shelters.length})
                    </h3>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {shelters.map((s) => {
                      const pct = Math.min(100, Math.round((s.capacityCurrent / s.capacityTotal) * 100));
                      return (
                        <div key={s.id} className="p-4 rounded-xl bg-white border border-neutral-200/80 space-y-2.5 shadow-2xs">
                          <div className="flex justify-between items-start gap-2">
                            <span className="font-semibold text-xs sm:text-sm text-neutral-900 leading-snug">{s.name}</span>
                            <span
                              className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wide shrink-0 border ${
                                s.status === 'OPEN'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : s.status === 'NEAR_CAPACITY'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-rose-50 text-rose-700 border-rose-200'
                              }`}
                            >
                              {s.status}
                            </span>
                          </div>
                          <p className="text-xs text-neutral-500">{s.locationName}</p>
                          <div>
                            <div className="flex justify-between text-xs font-medium text-neutral-900 mb-1 tabular-nums">
                              <span className="text-neutral-500 text-[11px]">Occupancy</span>
                              <span>{s.capacityCurrent} / {s.capacityTotal} ({pct}%)</span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-neutral-100 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  pct >= 90 ? 'bg-rose-600' : pct >= 75 ? 'bg-amber-500' : 'bg-emerald-600'
                                  }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                          <div className="text-[11px] text-neutral-500 pt-2 border-t border-neutral-100 flex items-center justify-between">
                            <span>Wheelchair: {s.isAccessibleWheelchair ? 'Yes' : 'No'}</span>
                            <button
                              type="button"
                              onClick={() => handleOpenEditShelter(s)}
                              className="px-2.5 py-1 rounded-md bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-[11px] transition shadow-2xs"
                            >
                              Update
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Sub-tab 2: Resources Table */}
              {(resourceSubTab === 'RESOURCES' || resourceSubTab === 'SHELTERS') && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                      Relief Supplies & Consumable Burn Rates ({resources.length})
                    </h3>
                  </div>
                  <div className="bg-white rounded-xl border border-neutral-200/80 overflow-hidden shadow-2xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-neutral-50/70 text-neutral-500 font-semibold text-[11px] uppercase tracking-wider border-b border-neutral-200">
                        <tr>
                          <th className="py-3 px-4">Supply Item</th>
                          <th className="py-3 px-4">Location</th>
                          <th className="py-3 px-4">Current Balance</th>
                          <th className="py-3 px-4">Consumption Rate</th>
                          <th className="py-3 px-4">Days Remaining</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {resources.map((r) => (
                          <tr key={r.id} className="hover:bg-neutral-50/60 transition">
                            <td className="py-3 px-4 font-semibold text-neutral-900">{r.name}</td>
                            <td className="py-3 px-4 text-neutral-500">{r.locationName}</td>
                            <td className="py-3 px-4 font-medium text-neutral-900 tabular-nums">
                              {r.quantity} {r.unit}
                            </td>
                            <td className="py-3 px-4 text-neutral-500 tabular-nums">
                              {r.consumptionRatePerDay} / day
                            </td>
                            <td className="py-3 px-4 font-medium text-neutral-900 tabular-nums">
                              ~{r.estimatedDaysRemaining} days
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${
                                  r.status === 'AVAILABLE'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-rose-50 text-rose-700 border-rose-200'
                                }`}
                              >
                                {r.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => setRecordingResource(r)}
                                className="px-2.5 py-1 rounded-md bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-[11px] transition shadow-2xs"
                              >
                                + Movement
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Sub-tab 3: Movements Ledger Table */}
              {resourceSubTab === 'MOVEMENTS' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                      Inventory Movements Ledger ({movementsHistory.length} records)
                    </h3>
                  </div>
                  <div className="bg-white rounded-xl border border-neutral-200/80 overflow-hidden shadow-2xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-neutral-50/70 text-neutral-500 font-semibold text-[11px] uppercase tracking-wider border-b border-neutral-200">
                          <tr>
                            <th className="py-3 px-4">Timestamp</th>
                            <th className="py-3 px-4">Supply Item</th>
                            <th className="py-3 px-4">Movement Type</th>
                            <th className="py-3 px-4">Quantity Change</th>
                            <th className="py-3 px-4">Location / Staging</th>
                            <th className="py-3 px-4">Coordinator</th>
                            <th className="py-3 px-4">Notes</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                          {movementsHistory.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="py-8 text-center text-neutral-500 text-xs">
                                No inventory movements recorded yet. Click "Record Stock Movement" to log transactions.
                              </td>
                            </tr>
                          ) : (
                            movementsHistory.map((mov) => (
                              <tr key={mov.id} className="hover:bg-neutral-50/60 transition">
                                <td className="py-3 px-4 text-neutral-400 font-mono text-[11px] whitespace-nowrap">
                                  {new Date(mov.timestamp).toLocaleString()}
                                </td>
                                <td className="py-3 px-4 font-semibold text-neutral-900 whitespace-nowrap">
                                  {mov.resourceName}
                                </td>
                                <td className="py-3 px-4 whitespace-nowrap">
                                  <span
                                    className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${
                                      mov.movementType === 'INBOUND_RELIEF'
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        : mov.movementType === 'DISPATCH'
                                        ? 'bg-sky-50 text-sky-700 border-sky-200'
                                        : mov.movementType === 'CONSUMPTION'
                                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                                        : 'bg-neutral-50 text-neutral-700 border-neutral-200'
                                    }`}
                                  >
                                    {mov.movementType.replace(/_/g, ' ')}
                                  </span>
                                </td>
                                <td className="py-3 px-4 font-bold tabular-nums whitespace-nowrap">
                                  <span className={mov.deltaQuantity > 0 ? 'text-emerald-600' : 'text-rose-600'}>
                                    {mov.deltaQuantity > 0 ? `+${mov.deltaQuantity}` : mov.deltaQuantity}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-neutral-600 whitespace-nowrap">
                                  {mov.sourceLocation} → {mov.destinationLocation}
                                </td>
                                <td className="py-3 px-4 text-neutral-900 font-medium whitespace-nowrap">
                                  {mov.actorName}
                                </td>
                                <td className="py-3 px-4 text-neutral-500 max-w-xs truncate">
                                  {mov.notes || 'Routine stock ledger update'}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ====================================================== */}
          {/* TAB 7: COMMUNITY SAFETY REGISTRY                       */}
          {/* ====================================================== */}
          {activeTab === 'SAFETY' && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-neutral-200/80 p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-neutral-900 tracking-tight">
                    Citizen Safety & Family Welfare Registry
                  </h2>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Authorized view of residents who marked safe. Identity data is protected under disaster privacy protocols.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExportSafetyCsv}
                    className="px-3 py-1.5 rounded-lg bg-white border border-neutral-200 hover:bg-neutral-50 text-xs font-medium text-neutral-700 transition flex items-center gap-1.5 shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5 text-neutral-500" />
                    <span>Export CSV</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSafetyModalTab('CHECK_IN');
                      setIsSafetyModalOpen(true);
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium transition flex items-center gap-1.5 shadow-2xs"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Register Citizen Check-In</span>
                  </button>
                </div>
              </div>

              {/* Safety Summary KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-xl bg-white border border-neutral-200/80 shadow-2xs">
                  <span className="text-[11px] text-neutral-400 block font-semibold uppercase tracking-wider">
                    Total Accounted
                  </span>
                  <span className="text-2xl font-bold text-neutral-900 tabular-nums mt-1 block">
                    {safetyStats.totalPeopleAccounted} <span className="text-xs font-normal text-neutral-500">citizens</span>
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-white border border-neutral-200/80 shadow-2xs">
                  <span className="text-[11px] text-neutral-400 block font-semibold uppercase tracking-wider">
                    In Shelters
                  </span>
                  <span className="text-2xl font-bold text-neutral-900 tabular-nums mt-1 block">
                    {safetyStats.atShelters} <span className="text-xs font-normal text-neutral-500">households</span>
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-white border border-neutral-200/80 shadow-2xs">
                  <span className="text-[11px] text-neutral-400 block font-semibold uppercase tracking-wider">
                    Safe at Home
                  </span>
                  <span className="text-2xl font-bold text-neutral-900 tabular-nums mt-1 block">
                    {safetyStats.atHome} <span className="text-xs font-normal text-neutral-500">households</span>
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-white border border-neutral-200/80 shadow-2xs">
                  <span className="text-[11px] text-neutral-400 block font-semibold uppercase tracking-wider">
                    Needs Aid
                  </span>
                  <span className="text-2xl font-bold text-amber-600 tabular-nums mt-1 block">
                    {safetyStats.needsAssistance} <span className="text-xs font-normal text-neutral-500">households</span>
                  </span>
                </div>
              </div>

              {/* Roster Search & Filter */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={safetySearch}
                    onChange={(e) => setSafetySearch(e.target.value)}
                    placeholder="Search safe citizens by name, phone, or address..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-neutral-200 bg-white text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  />
                </div>
                <select
                  value={safetyFilter}
                  onChange={(e) => setSafetyFilter(e.target.value as any)}
                  className="px-3 py-1.5 rounded-lg border border-neutral-200 bg-white text-xs font-medium text-neutral-700 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                >
                  <option value="ALL">All Categories</option>
                  <option value="SAFE_AT_SHELTER">Safe in Shelter</option>
                  <option value="SAFE_AT_HOME">Safe at Home</option>
                  <option value="EVACUATING">Evacuating</option>
                  <option value="NEEDS_ASSISTANCE">Needs Assistance</option>
                </select>
              </div>

              {/* Safety Registry Table */}
              <div className="bg-white rounded-xl border border-neutral-200/80 overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-neutral-50/70 text-neutral-500 font-semibold text-[11px] uppercase tracking-wider border-b border-neutral-200">
                      <tr>
                        <th className="py-3 px-4">Condition</th>
                        <th className="py-3 px-4">Resident & Phone</th>
                        <th className="py-3 px-4">Reported Location</th>
                        <th className="py-3 px-4">Headcount</th>
                        <th className="py-3 px-4">Timestamp</th>
                        <th className="py-3 px-4">Notes</th>
                        <th className="py-3 px-4 text-right">Verification</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {safeCheckIns.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-neutral-500 text-xs">
                            No registered citizen check-ins match your search or filter.
                          </td>
                        </tr>
                      ) : (
                        safeCheckIns.map((rec) => (
                          <tr key={rec.id} className="hover:bg-neutral-50/60 transition">
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${
                                  rec.status === 'SAFE_AT_SHELTER'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : rec.status === 'SAFE_AT_HOME'
                                    ? 'bg-teal-50 text-teal-700 border-teal-200'
                                    : rec.status === 'EVACUATING'
                                    ? 'bg-sky-50 text-sky-700 border-sky-200'
                                    : 'bg-rose-50 text-rose-700 border-rose-200'
                                }`}
                              >
                                {rec.status.replace(/_/g, ' ')}
                              </span>
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <div className="font-semibold text-neutral-900">{rec.residentName}</div>
                              <div className="text-[11px] text-neutral-500 tabular-nums">{rec.contactPhone}</div>
                            </td>
                            <td className="py-3 px-4 text-neutral-800">
                              {rec.shelterName || rec.currentLocation}
                            </td>
                            <td className="py-3 px-4 font-medium text-neutral-900 tabular-nums whitespace-nowrap">
                              {rec.familyCount} pax
                            </td>
                            <td className="py-3 px-4 text-neutral-400 tabular-nums text-[11px] whitespace-nowrap">
                              {new Date(rec.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="py-3 px-4 text-neutral-500 max-w-xs truncate">{rec.notes || 'None'}</td>
                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => handleToggleVerifyCheckIn(rec.id)}
                                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition ${
                                  rec.isVerified
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                                }`}
                              >
                                {rec.isVerified ? 'Verified ✓' : 'Verify'}
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ====================================================== */}
          {/* TAB 8: SYNC & ACTIVITY AUDIT LEDGER                    */}
          {/* ====================================================== */}
          {activeTab === 'SYNC' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-neutral-200/80 p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-neutral-900 tracking-tight">
                    Offline Synchronization & Audit History
                  </h2>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Inspect durable IndexedDB queue events, conflict resolution, offline simulation, and coordinator audit trail.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleToggleSimulateOffline}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 border shadow-2xs ${
                      isSimulatedOffline
                        ? 'bg-amber-600 text-white border-amber-700'
                        : 'bg-white hover:bg-neutral-50 text-neutral-700 border-neutral-200'
                    }`}
                  >
                    {isSimulatedOffline ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5 text-neutral-500" />}
                    <span>{isSimulatedOffline ? 'Resume Live Network' : 'Simulate Offline Mode'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleRetryFailedEvents}
                    className="px-3 py-1.5 rounded-lg bg-white hover:bg-neutral-50 border border-neutral-200 text-neutral-700 font-medium text-xs transition flex items-center gap-1.5 shadow-2xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-neutral-500" />
                    <span>Retry Failed Queue</span>
                  </button>

                  <button
                    type="button"
                    disabled={isManualSyncing}
                    onClick={handleManualSync}
                    className="px-3.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 text-white font-medium text-xs transition flex items-center gap-1.5 shadow-2xs"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isManualSyncing ? 'animate-spin' : ''}`} />
                    <span>{isManualSyncing ? 'Synchronizing...' : 'Trigger Cloud Sync'}</span>
                  </button>
                </div>
              </div>

              {/* Sync Status Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-white border border-neutral-200/80 shadow-2xs">
                  <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
                    Heartbeat Connection
                  </span>
                  <div className="text-lg font-bold text-neutral-900 mt-1 flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        syncStatus === 'ONLINE' ? 'bg-emerald-500' : syncStatus === 'SYNCING' ? 'bg-sky-500 animate-spin' : 'bg-amber-500'
                      }`}
                    />
                    <span>{syncStatus}</span>
                  </div>
                  <span className="text-[11px] text-neutral-500 block mt-0.5">
                    {isSimulatedOffline ? 'Simulated Offline Enabled' : 'Mesh health verified against /api/v1/health'}
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-white border border-neutral-200/80 shadow-2xs">
                  <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
                    Local Queue Length
                  </span>
                  <div className="text-lg font-bold text-neutral-900 mt-1 tabular-nums">
                    {pendingSyncEvents.length} events
                  </div>
                  <span className="text-[11px] text-neutral-500 block mt-0.5">
                    Durable local IndexedDB storage
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-white border border-neutral-200/80 shadow-2xs">
                  <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
                    Last Successful Sync
                  </span>
                  <div className="text-base font-bold text-neutral-900 mt-1 tabular-nums">
                    {lastSyncTime ? new Date(lastSyncTime).toLocaleTimeString() : 'Not synced yet'}
                  </div>
                  <span className="text-[11px] text-neutral-500 block mt-0.5">
                    Server timestamp acknowledgement
                  </span>
                </div>
              </div>

              {/* Sync Conflicts Section (If Any) */}
              {syncConflicts.length > 0 && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-700" />
                    <h3 className="font-semibold text-sm text-amber-900">
                      Sync Conflicts Detected ({syncConflicts.filter((c) => !c.resolved).length} unresolved)
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {syncConflicts.map((conf) => (
                      <div key={conf.id} className="p-3 bg-white rounded-lg border border-amber-200 text-xs space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-neutral-900">{conf.entity_type.toUpperCase()} Conflict</span>
                          <span className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded border ${conf.resolved ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                            {conf.resolved ? `Resolved (${conf.resolutionChoice})` : 'Awaiting Choice'}
                          </span>
                        </div>
                        <p className="text-neutral-600 text-[11px]">Type: {conf.conflictType.replace(/_/g, ' ')}</p>
                        {!conf.resolved && (
                          <div className="flex gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => handleResolveConflict(conf.id, 'LOCAL')}
                              className="px-3 py-1 rounded bg-neutral-900 text-white font-medium text-xs hover:bg-neutral-800"
                            >
                              Keep Local Version
                            </button>
                            <button
                              type="button"
                              onClick={() => handleResolveConflict(conf.id, 'REMOTE')}
                              className="px-3 py-1 rounded bg-white border border-neutral-300 text-neutral-700 font-medium text-xs hover:bg-neutral-100"
                            >
                              Accept Remote Cloud
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Full Audit Log */}
              <div className="bg-white rounded-xl border border-neutral-200/80 p-4 sm:p-5 shadow-2xs space-y-3">
                <h3 className="font-semibold text-sm text-neutral-900 tracking-tight">
                  Operational Audit Ledger ({auditLogs.length} events)
                </h3>
                <div className="divide-y divide-neutral-100 max-h-96 overflow-y-auto">
                  {auditLogs.length === 0 ? (
                    <div className="py-8 text-center text-neutral-500 text-xs">
                      No recorded operational events in the audit ledger.
                    </div>
                  ) : (
                    auditLogs.map((log) => (
                      <div key={log.id} className="py-2.5 text-xs flex justify-between items-start gap-4">
                        <div>
                          <div className="font-semibold text-neutral-900">
                            {log.action}{' '}
                            <span className="font-normal text-neutral-500">• {log.actorName} ({log.actorRole})</span>
                          </div>
                          <p className="text-neutral-600 mt-0.5 text-xs">{log.rationale}</p>
                        </div>
                        <span className="text-[11px] font-mono text-neutral-400 shrink-0 tabular-nums">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Durable Local Event Queue Log (Preserved from Sync Center) */}
              <div className="bg-white rounded-xl border border-neutral-200/80 p-4 sm:p-5 shadow-2xs space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-neutral-600" />
                    <h3 className="font-semibold text-sm text-neutral-900 tracking-tight">
                      Local Event Queue Log ({allSyncEvents.length} events)
                    </h3>
                  </div>
                  <span className="text-[11px] text-neutral-400 font-mono">
                    IndexedDB Durable Queue • UUID Idempotency
                  </span>
                </div>

                {allSyncEvents.length === 0 ? (
                  <div className="py-8 text-center text-neutral-500 text-xs">
                    No local offline queue events recorded yet.
                  </div>
                ) : (
                  <div className="divide-y divide-neutral-100 max-h-96 overflow-y-auto">
                    {allSyncEvents.map((evt) => (
                      <div key={evt.event_id} className="py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wide border ${
                                evt.sync_status === 'SYNCED'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : evt.sync_status === 'FAILED'
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}
                            >
                              {evt.sync_status}
                            </span>
                            <span className="font-bold text-neutral-900 uppercase font-mono text-[11px]">{evt.operation}</span>
                            <span className="text-neutral-700 font-medium">
                              {evt.entity_type} <span className="text-neutral-400 font-mono text-[10px]">({evt.entity_id})</span>
                            </span>
                          </div>
                          <div className="text-[10px] text-neutral-400 font-mono">
                            Event ID: {evt.event_id} • Device: {evt.origin_device_id?.substring(0, 16)}...
                          </div>
                          {evt.last_error && (
                            <div className="text-[10px] text-rose-600 font-medium">Error: {evt.last_error}</div>
                          )}
                        </div>

                        <div className="text-right text-[11px] text-neutral-400 font-mono tabular-nums">
                          <div>Queued: {new Date(evt.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                          {evt.server_ack_at && (
                            <div className="text-emerald-700 font-semibold">
                              Ack: {new Date(evt.server_ack_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ====================================================== */}
          {/* TAB 9: ASK AI OPERATIONAL INTELLIGENCE                 */}
          {/* ====================================================== */}
          {activeTab === 'ASK_AI' && (
            <div className="space-y-5">
              <div className="bg-white rounded-xl border border-neutral-200/80 p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-2xs shrink-0">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-neutral-900 tracking-tight">
                      Ask AI Operational Intelligence & DRRM Protocols
                    </h2>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Operational queries with dual-engine verification (Cloud Gemini Flash online, local IndexedDB retrieval offline).
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                  Dual-Engine Grounding
                </span>
              </div>

              {/* Query Input */}
              <div className="bg-white rounded-xl border border-neutral-200/80 p-4 sm:p-5 shadow-2xs space-y-4">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleAskAiSubmit(aiQuery);
                  }}
                  className="flex gap-2"
                >
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={aiQuery}
                      onChange={(e) => setAiQuery(e.target.value)}
                      placeholder="Ask about wheelchair shelters, river alert level, water supplies, medical aid..."
                      className="w-full bg-neutral-50 border border-neutral-300 rounded-lg pl-9 pr-4 py-2.5 text-xs sm:text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:bg-white transition"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isAiLoading || !aiQuery.trim()}
                    className="px-5 py-2.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 transition shadow-2xs shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isAiLoading ? 'Analyzing...' : 'Query AI'}</span>
                  </button>
                </form>

                {/* Suggested Chips */}
                <div className="pt-3 border-t border-neutral-100 space-y-2">
                  <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                    Suggested Operational Queries:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {AI_SUGGESTED_QUERIES.map((q, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setAiQuery(q);
                          handleAskAiSubmit(q);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-neutral-700 text-xs text-left transition"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* AI Response Card */}
              {isAiLoading && (
                <div className="p-12 text-center bg-white rounded-xl border border-neutral-200/80 shadow-2xs space-y-3">
                  <RefreshCw className="w-6 h-6 text-emerald-600 animate-spin mx-auto" />
                  <div className="text-xs font-semibold text-neutral-700">Synthesizing grounded disaster response data...</div>
                  <div className="text-[11px] text-neutral-400">Cross-referencing live local IndexedDB stores and NDRRMC protocols</div>
                </div>
              )}

              {aiError && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{aiError}</span>
                </div>
              )}

              {aiResponse && !isAiLoading && (
                <div className="bg-white rounded-xl border border-neutral-200/80 p-5 shadow-2xs space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-neutral-100">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      <span className="font-semibold text-sm text-neutral-900">Grounded Operational Synthesis</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="px-2 py-0.5 rounded font-mono text-[10px] font-semibold bg-neutral-100 text-neutral-700 border border-neutral-200">
                        {aiResponse.engineUsed}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          aiResponse.verificationStatus === 'GROUNDED' || aiResponse.verificationStatus === 'VERIFIED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        Status: {aiResponse.verificationStatus}
                      </span>
                    </div>
                  </div>

                  {/* Answer text */}
                  <div className="text-neutral-800 text-xs sm:text-sm leading-relaxed whitespace-pre-line bg-neutral-50/70 p-4 rounded-lg border border-neutral-200">
                    {aiResponse.answer}
                  </div>

                  {/* Confidence explanation */}
                  {aiResponse.confidenceExplanation && (
                    <div className="text-[11px] text-neutral-500 italic">
                      Grounding details: {aiResponse.confidenceExplanation}
                    </div>
                  )}

                  {/* Citations & Evidence */}
                  {aiResponse.evidenceRecordIds && aiResponse.evidenceRecordIds.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                        Grounding Evidence Records ({aiResponse.evidenceRecordIds.length})
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {aiResponse.evidenceRecordIds.map((recId, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded bg-neutral-100 border border-neutral-200 text-neutral-700 font-mono text-[10px]"
                          >
                            {recId}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Uncertainties */}
                  {aiResponse.uncertainties && aiResponse.uncertainties.length > 0 && (
                    <div className="p-3 rounded-lg bg-amber-50/80 border border-amber-200 text-amber-800 text-xs space-y-1">
                      <div className="font-semibold text-[11px] uppercase tracking-wider">Uncertainties & Operational Cautions:</div>
                      <ul className="list-disc pl-4 space-y-0.5">
                        {aiResponse.uncertainties.map((u, i) => (
                          <li key={i}>{u}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Proposed Actions */}
                  {aiResponse.proposedActions && aiResponse.proposedActions.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-neutral-100">
                      <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                        Recommended Actions:
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {aiResponse.proposedActions.map((action, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => {
                              if (/shelter|evac/i.test(action)) {
                                setActiveTab('RESOURCES');
                                setResourceSubTab('SHELTERS');
                              } else if (/incident|hazard/i.test(action)) {
                                setActiveTab('INCIDENTS');
                              } else if (/assist|rescue/i.test(action)) {
                                setActiveTab('ASSISTANCE');
                              } else if (/mission|dispatch/i.test(action)) {
                                setActiveTab('MISSIONS');
                              } else {
                                setActiveTab('MAP');
                              }
                            }}
                            className="px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-xs transition shadow-2xs"
                          >
                            {action} →
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ====================================================== */}
          {/* TAB 10: EMERGENCY AGENCY HOTLINES                      */}
          {/* ====================================================== */}
          {activeTab === 'HOTLINES' && (
            <div className="space-y-5">
              <div className="bg-white rounded-xl border border-neutral-200/80 p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-neutral-900 text-white flex items-center justify-center shadow-2xs shrink-0">
                    <PhoneCall className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-neutral-900 tracking-tight">
                      Disaster Response Agency Hotlines Directory
                    </h2>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Direct escalation lines for CDRRMO 161, Philippine Red Cross, BFP Fire, PNP Police, MMDA, and tertiary emergency trauma centers.
                    </p>
                  </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={hotlineSearch}
                      onChange={(e) => setHotlineSearch(e.target.value)}
                      placeholder="Search agency or number..."
                      className="pl-8 pr-3 py-1.5 rounded-lg border border-neutral-200 bg-white text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                    />
                  </div>
                  <select
                    value={hotlineCategory}
                    onChange={(e) => setHotlineCategory(e.target.value as any)}
                    className="px-3 py-1.5 rounded-lg border border-neutral-200 bg-white text-xs font-medium text-neutral-700 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  >
                    <option value="ALL">All Agency Types</option>
                    <option value="CDRRMO">CDRRMO & Rescue</option>
                    <option value="MEDICAL">Medical & ER</option>
                    <option value="SECURITY">Police & Fire</option>
                    <option value="UTILITY">Utilities & MMDA</option>
                  </select>
                </div>
              </div>

              {/* Hotlines Grid */}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {EMERGENCY_HOTLINES.filter((h) => {
                  const matchQuery =
                    h.name.toLowerCase().includes(hotlineSearch.toLowerCase()) ||
                    h.agency.toLowerCase().includes(hotlineSearch.toLowerCase()) ||
                    h.number.includes(hotlineSearch);
                  const matchCategory = hotlineCategory === 'ALL' || h.category === hotlineCategory;
                  return matchQuery && matchCategory;
                }).map((h, i) => (
                  <div key={i} className="p-4 rounded-xl bg-white border border-neutral-200/80 shadow-2xs space-y-3 flex flex-col justify-between">
                    <div className="space-y-1">
                      <div className="flex justify-between items-start gap-2">
                        <span className="font-semibold text-xs sm:text-sm text-neutral-900 leading-snug">{h.name}</span>
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wide bg-neutral-100 text-neutral-700 border border-neutral-200 shrink-0">
                          {h.badge}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500">{h.agency}</p>
                    </div>

                    <div className="pt-2 border-t border-neutral-100 flex items-center justify-between gap-2">
                      <span className="font-mono font-bold text-neutral-900 text-xs sm:text-sm tabular-nums">
                        {h.number}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleCopyHotlineNumber(h.number)}
                          className="p-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 text-neutral-600 transition"
                          title="Copy phone number"
                        >
                          {copiedNumber === h.number ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <a
                          href={h.telUri}
                          className="px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-xs transition shadow-2xs flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3" />
                          <span>Call</span>
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 8: AYUDA & RATION DISTRIBUTION TRACKER              */}
          {/* ======================================================== */}
          {activeTab === 'AYUDA' && (
            <AyudaDistributionTrackerModal
              isInline={true}
              shelters={shelters}
              onDistributionRecorded={() => {
                if (onDataChanged) onDataChanged();
              }}
            />
          )}

          {/* ======================================================== */}
          {/* TAB 9: FAMILY REUNIFICATION & MISSING KIN REGISTRY      */}
          {/* ======================================================== */}
          {activeTab === 'KIN' && (
            <MissingKinModal
              isInline={true}
              shelters={shelters}
              onUpdated={() => {
                if (onDataChanged) onDataChanged();
              }}
            />
          )}

          {/* ======================================================== */}
          {/* TAB 10: "BAYANIHAN" COMMUNITY MUTUAL AID BOARD           */}
          {/* ======================================================== */}
          {activeTab === 'BAYANIHAN' && (
            <BayanihanBoardModal
              isInline={true}
              onPostUpdated={() => {
                if (onDataChanged) onDataChanged();
              }}
            />
          )}

          {/* ======================================================== */}
          {/* TAB 11: BOIL WATER & DISEASE OUTBREAK WATCH             */}
          {/* ======================================================== */}
          {activeTab === 'OUTBREAK' && (
            <DiseaseOutbreakWatchModal
              isInline={true}
              onAdvisoryCreated={() => {
                if (onDataChanged) onDataChanged();
              }}
            />
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 5. MODALS & OPERATION DRAWERS (LINEAR STYLE)             */}
      {/* ======================================================== */}

      {/* Modal 1: Incident Verification Triage */}
      {verifyingIncident && (
        <div className="fixed inset-0 z-50 bg-neutral-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl border border-neutral-200 shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 text-neutral-900 space-y-4 animate-modal">
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-wider">
                  Incident Truth Engine
                </span>
                <h3 className="text-base font-semibold text-neutral-900 mt-1 tracking-tight">
                  Verify, Contradict, or Resolve Incident
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setVerifyingIncident(null)}
                className="p-1 rounded-lg hover:bg-neutral-100 text-neutral-500 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-lg bg-neutral-50 border border-neutral-200 text-xs space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-neutral-900 text-sm">{verifyingIncident.title}</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                    verifyingIncident.status === 'VERIFIED'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : verifyingIncident.status === 'CONTRADICTED'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : verifyingIncident.status === 'RESOLVED'
                      ? 'bg-neutral-100 text-neutral-600 border-neutral-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}
                >
                  {verifyingIncident.status}
                </span>
              </div>
              <div className="text-neutral-500 flex flex-wrap gap-2 text-[11px]">
                <span>{verifyingIncident.locationName}</span>
                <span>•</span>
                <span>Reported by {verifyingIncident.reporterName} ({verifyingIncident.reporterRole})</span>
                {verifyingIncident.floodDepthCm && (
                  <>
                    <span>•</span>
                    <span className="font-semibold text-neutral-700">Depth: {verifyingIncident.floodDepthCm} cm</span>
                  </>
                )}
              </div>
              <p className="text-neutral-700 pt-1 leading-relaxed">{verifyingIncident.description}</p>

              {/* Photo Evidence Preview */}
              {verifyingIncident.photoUrl && (
                <div className="mt-2 relative rounded-lg overflow-hidden border border-neutral-200 max-h-48 bg-neutral-950">
                  <img
                    src={verifyingIncident.photoUrl}
                    alt={verifyingIncident.title}
                    className="w-full h-36 object-cover"
                  />
                  <div className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded bg-black/75 backdrop-blur-xs text-white text-[10px] font-medium flex items-center gap-1">
                    <Camera className="w-3 h-3 text-amber-400" />
                    <span>Citizen Photo Evidence</span>
                  </div>
                </div>
              )}
            </div>

            {/* Corroborating and Conflicting Reports */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-neutral-800 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Field Evidence & Reports ({verifyingIncidentReports.length})</span>
                </span>
                <span className="text-[11px] text-neutral-500">
                  {verifyingIncident.supportingReportsCount} supporting • {verifyingIncident.contradictingReportsCount} conflicting
                </span>
              </div>

              {verifyingIncidentReports.length > 0 ? (
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {verifyingIncidentReports.map((rep) => (
                    <div
                      key={rep.id}
                      className={`p-2.5 rounded-lg border text-xs space-y-1 ${
                        rep.reportType === 'CONTRADICTION'
                          ? 'bg-rose-50/70 border-rose-200'
                          : rep.reportType === 'CORROBORATION'
                          ? 'bg-emerald-50/70 border-emerald-200'
                          : 'bg-neutral-50 border-neutral-200'
                      }`}
                    >
                      <div className="flex justify-between items-center text-[10px]">
                        <span
                          className={`font-mono font-semibold px-1.5 py-0.5 rounded text-[10px] uppercase border tracking-wide ${
                            rep.reportType === 'CONTRADICTION'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : rep.reportType === 'CORROBORATION'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-neutral-100 text-neutral-700 border border-neutral-200'
                          }`}
                        >
                          {rep.reportType}
                        </span>
                        <span className="text-neutral-500">
                          {rep.reporterName} • {new Date(rep.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-neutral-800 font-medium">"{rep.observation}"</p>
                      {rep.roadStatus && (
                        <div className="text-[11px] text-neutral-600">
                          Road: <strong>{rep.roadStatus}</strong>
                          {rep.floodDepthCm ? ` (${rep.floodDepthCm} cm)` : ''}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-2 text-center text-neutral-400 text-xs italic bg-neutral-50 rounded-lg">
                  No additional field corroboration or conflict reports logged yet.
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-xs text-neutral-800 block">
                Verification Rationale (Logged to Immutable Audit Trail)
              </label>
              <textarea
                rows={2}
                value={verificationRationale}
                onChange={(e) => setVerificationRationale(e.target.value)}
                placeholder="e.g. Confirmed by Tanod patrol; water spilling over primary dike."
                className="w-full bg-white border border-neutral-300 rounded-lg p-2.5 text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
              />
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setVerifyingIncident(null)}
                className="px-3 py-1.5 rounded-lg bg-white border border-neutral-200 text-neutral-700 text-xs font-medium hover:bg-neutral-50 shadow-2xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isVerifying}
                onClick={() => handleConfirmVerifyIncident('CONTRADICTED')}
                className="px-3.5 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 font-semibold text-xs transition"
              >
                Mark Contradicted
              </button>
              <button
                type="button"
                disabled={isVerifying}
                onClick={() => handleConfirmVerifyIncident('RESOLVED')}
                className="px-3.5 py-1.5 rounded-lg bg-neutral-100 border border-neutral-300 text-neutral-800 hover:bg-neutral-200 font-semibold text-xs transition"
              >
                Mark Resolved
              </button>
              <button
                type="button"
                disabled={isVerifying}
                onClick={() => handleConfirmVerifyIncident('VERIFIED')}
                className="px-4 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs shadow-2xs transition"
              >
                Confirm Verified
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Assign Responder to Incident */}
      {assigningIncident && (
        <div className="fixed inset-0 z-50 bg-neutral-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl border border-neutral-200 shadow-xl max-w-lg w-full p-5 sm:p-6 text-neutral-900 space-y-4 animate-modal">
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider">
                  Field Dispatch
                </span>
                <h3 className="text-base font-semibold text-neutral-900 mt-1 tracking-tight">
                  Assign Responder to Incident
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setAssigningIncident(null)}
                className="p-1 rounded-lg hover:bg-neutral-100 text-neutral-500 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-lg bg-neutral-50 border border-neutral-200 text-xs space-y-1">
              <div className="font-semibold text-neutral-900">{assigningIncident.title}</div>
              <div className="text-neutral-500">{assigningIncident.locationName}</div>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {DISPATCHABLE_RESPONDERS.map((resp) => {
                const isSelected = selectedResponderId === resp.id;
                return (
                  <button
                    key={resp.id}
                    type="button"
                    onClick={() => setSelectedResponderId(resp.id)}
                    className={`w-full p-2.5 rounded-lg border text-left transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-neutral-900 text-white border-neutral-900 font-medium'
                        : 'bg-white border-neutral-200 text-neutral-900 hover:bg-neutral-50'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-xs">{resp.name}</div>
                      <div className={`text-[11px] ${isSelected ? 'text-neutral-300' : 'text-neutral-500'}`}>
                        {resp.unit}
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-emerald-400" />}
                  </button>
                );
              })}
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-xs text-neutral-800 block">
                Coordinator Dispatch Orders
              </label>
              <textarea
                rows={2}
                value={dispatchInstructions}
                onChange={(e) => setDispatchInstructions(e.target.value)}
                placeholder="e.g. Conduct physical survey, assist in pre-emptive evacuation."
                className="w-full bg-white border border-neutral-300 rounded-lg p-2.5 text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setAssigningIncident(null)}
                className="px-3 py-1.5 rounded-lg bg-white border border-neutral-200 text-neutral-700 text-xs font-medium hover:bg-neutral-50 shadow-2xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDispatching}
                onClick={handleConfirmAssignResponder}
                className="px-4 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs shadow-2xs transition"
              >
                {isDispatching ? 'Dispatching...' : 'Dispatch Responder'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2B: Assign Responder to Mission */}
      {assigningMission && (
        <div className="fixed inset-0 z-50 bg-neutral-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl border border-neutral-200 shadow-xl max-w-lg w-full p-5 sm:p-6 text-neutral-900 space-y-4 animate-modal">
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider">
                  Mission Dispatch
                </span>
                <h3 className="text-base font-semibold text-neutral-900 mt-1 tracking-tight">
                  Assign Responder to Mission
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setAssigningMission(null)}
                className="p-1 rounded-lg hover:bg-neutral-100 text-neutral-500 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-lg bg-neutral-50 border border-neutral-200 text-xs space-y-1">
              <div className="font-semibold text-neutral-900">{assigningMission.title}</div>
              <div className="text-neutral-500">Pickup: {assigningMission.pickupLocation}</div>
              <div className="text-emerald-700">Destination: {assigningMission.destinationLocation}</div>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-xs text-neutral-800 block">
                Select Field Unit / Responder
              </label>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {DISPATCHABLE_RESPONDERS.map((resp) => {
                  const isSelected = selectedResponderId === resp.id;
                  return (
                    <button
                      key={resp.id}
                      type="button"
                      onClick={() => setSelectedResponderId(resp.id)}
                      className={`w-full p-2.5 rounded-lg border text-left transition flex items-center justify-between ${
                        isSelected
                          ? 'bg-neutral-900 text-white border-neutral-900 font-medium'
                          : 'bg-white border-neutral-200 text-neutral-900 hover:bg-neutral-50'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-xs">{resp.name}</div>
                        <div className={`text-[11px] ${isSelected ? 'text-neutral-300' : 'text-neutral-500'}`}>
                          {resp.unit}
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-emerald-400" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-xs text-neutral-800 block">
                Assigned Vehicle / Transport Unit
              </label>
              <select
                value={missionVehicleType}
                onChange={(e) => setMissionVehicleType(e.target.value)}
                className="w-full bg-white border border-neutral-300 rounded-lg p-2 text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
              >
                <option value="Motorized Rubber Boat 161-B">Motorized Rescue Rubber Boat 161-B</option>
                <option value="Rescue Boat Unit Alpha">Rescue Boat Unit Alpha</option>
                <option value="6x6 High-Clearance Amphibious Military Truck">6x6 High-Clearance Amphibious Military Truck</option>
                <option value="Emergency Ambulance 161-Medic">Emergency Ambulance 161-Medic</option>
                <option value="Foot Patrol / Search Team">Foot Patrol / Search Team</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-xs text-neutral-800 block">
                Coordinator Dispatch Directives
              </label>
              <textarea
                rows={2}
                value={dispatchInstructions}
                onChange={(e) => setDispatchInstructions(e.target.value)}
                placeholder="e.g. Prioritize wheelchair transfer to Malanday Elementary School."
                className="w-full bg-white border border-neutral-300 rounded-lg p-2.5 text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setAssigningMission(null)}
                className="px-3 py-1.5 rounded-lg bg-white border border-neutral-200 text-neutral-700 text-xs font-medium hover:bg-neutral-50 shadow-2xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDispatching}
                onClick={handleConfirmAssignMissionResponder}
                className="px-4 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs shadow-2xs transition"
              >
                {isDispatching ? 'Dispatching...' : 'Dispatch Responder'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Disaster Trigger Declaration */}
      <DisasterTriggerModal
        isOpen={isTriggerModalOpen}
        onClose={() => setIsTriggerModalOpen(false)}
        community={community}
        activeAlertCount={activeAlerts.length}
        onDisasterUpdated={onDataChanged}
      />

      {/* Modal 3.5: Post Incoming Disaster Advisory */}
      <PostDisasterAdvisoryModal
        isOpen={isAdvisoryModalOpen}
        onClose={() => {
          setIsAdvisoryModalOpen(false);
          setAdvisoryInitialData(undefined);
        }}
        community={community}
        initialData={advisoryInitialData}
        onAdvisoryPosted={onDataChanged}
      />

      {/* Modal 4: Sitrep Generator */}
      <SitrepModal
        isOpen={isSitrepOpen}
        onClose={() => setIsSitrepOpen(false)}
        community={community}
        alerts={alerts}
        shelters={shelters}
        incidents={incidents}
        assistanceRequests={assistanceRequests}
        missions={missions}
        resources={resources}
      />

      {/* Modal 5: Safety Directory */}
      <SafetyCheckInModal
        isOpen={isSafetyModalOpen}
        onClose={() => setIsSafetyModalOpen(false)}
        shelters={shelters}
        initialTab={safetyModalTab}
      />

      {/* Modal 6: Edit Shelter Capacity & Features */}
      {editingShelter && (
        <div className="fixed inset-0 z-50 bg-neutral-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl border border-neutral-200 shadow-xl max-w-lg w-full p-5 sm:p-6 text-neutral-900 space-y-4 animate-modal">
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider">
                  Logistics & Facilities
                </span>
                <h3 className="text-base font-semibold text-neutral-900 mt-1 tracking-tight">
                  Update Evacuation Center: {editingShelter.name}
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {editingShelter.locationName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingShelter(null)}
                className="p-1 rounded-lg hover:bg-neutral-100 text-neutral-500 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveShelter} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-xs text-neutral-800 block">
                    Current Occupancy (Pax)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={shelterOccupancy}
                    onChange={(e) => setShelterOccupancy(Number(e.target.value))}
                    className="w-full bg-white border border-neutral-300 rounded-lg p-2 text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-xs text-neutral-800 block">
                    Total Capacity (Pax)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={shelterCapacityTotal}
                    onChange={(e) => setShelterCapacityTotal(Number(e.target.value))}
                    className="w-full bg-white border border-neutral-300 rounded-lg p-2 text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-xs text-neutral-800 block">
                  Operational Status
                </label>
                <select
                  value={shelterStatusVal}
                  onChange={(e) => setShelterStatusVal(e.target.value as ShelterStatus)}
                  className="w-full bg-white border border-neutral-300 rounded-lg p-2 text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                >
                  <option value="OPEN">OPEN (Accepting Evacuees)</option>
                  <option value="NEAR_CAPACITY">NEAR CAPACITY (&gt;80% full)</option>
                  <option value="FULL">FULL (At capacity)</option>
                  <option value="CLOSED">CLOSED (Hazardous / Inactive)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="font-semibold text-xs text-neutral-800 block">
                  Facility Amenities & Capabilities
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs text-neutral-700">
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-neutral-200 hover:bg-neutral-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={shelterWheelchair}
                      onChange={(e) => setShelterWheelchair(e.target.checked)}
                      className="rounded text-neutral-900 focus:ring-neutral-900"
                    />
                    <span>Wheelchair Accessible</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-neutral-200 hover:bg-neutral-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={shelterPower}
                      onChange={(e) => setShelterPower(e.target.checked)}
                      className="rounded text-neutral-900 focus:ring-neutral-900"
                    />
                    <span>Backup Generator</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-neutral-200 hover:bg-neutral-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={shelterClinic}
                      onChange={(e) => setShelterClinic(e.target.checked)}
                      className="rounded text-neutral-900 focus:ring-neutral-900"
                    />
                    <span>Medical Clinic Station</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-neutral-200 hover:bg-neutral-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={shelterWater}
                      onChange={(e) => setShelterWater(e.target.checked)}
                      className="rounded text-neutral-900 focus:ring-neutral-900"
                    />
                    <span>Potable Drinking Water</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-neutral-200 hover:bg-neutral-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={shelterLactating}
                      onChange={(e) => setShelterLactating(e.target.checked)}
                      className="rounded text-neutral-900 focus:ring-neutral-900"
                    />
                    <span>Lactating / Infant Station</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-neutral-200 hover:bg-neutral-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={shelterPetFriendly}
                      onChange={(e) => setShelterPetFriendly(e.target.checked)}
                      className="rounded text-neutral-900 focus:ring-neutral-900"
                    />
                    <span>Pet-Friendly Evac Zone</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-neutral-200 hover:bg-neutral-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={shelterOxygen}
                      onChange={(e) => setShelterOxygen(e.target.checked)}
                      className="rounded text-neutral-900 focus:ring-neutral-900"
                    />
                    <span>Medical Oxygen Support</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-neutral-200 hover:bg-neutral-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={shelterGroundFloor}
                      onChange={(e) => setShelterGroundFloor(e.target.checked)}
                      className="rounded text-neutral-900 focus:ring-neutral-900"
                    />
                    <span>Ground Floor Step-Free</span>
                  </label>
                </div>
              </div>

              {/* Special Needs Dedicated Capacity Matrix */}
              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2.5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-700">
                  Special Needs & Pet Allocations
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-[11px] text-neutral-700 block">
                      PWD / Senior Dedicated Capacity
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={shelterPwdCapacity}
                      onChange={(e) => setShelterPwdCapacity(Number(e.target.value))}
                      className="w-full bg-white border border-neutral-300 rounded-lg p-2 text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-[11px] text-neutral-700 block">
                      PWD Current Occupants
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={shelterPwdCurrent}
                      onChange={(e) => setShelterPwdCurrent(Number(e.target.value))}
                      className="w-full bg-white border border-neutral-300 rounded-lg p-2 text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-[11px] text-neutral-700 block">
                      Pet Space Capacity (Cages/Slots)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={shelterPetCapacity}
                      onChange={(e) => setShelterPetCapacity(Number(e.target.value))}
                      className="w-full bg-white border border-neutral-300 rounded-lg p-2 text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-[11px] text-neutral-700 block">
                      Pets Currently Sheltered
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={shelterPetCurrent}
                      onChange={(e) => setShelterPetCurrent(Number(e.target.value))}
                      className="w-full bg-white border border-neutral-300 rounded-lg p-2 text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-xs text-neutral-800 block">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    value={shelterContactPerson}
                    onChange={(e) => setShelterContactPerson(e.target.value)}
                    placeholder="e.g. Captain Juan Reyes"
                    className="w-full bg-white border border-neutral-300 rounded-lg p-2 text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-xs text-neutral-800 block">
                    Contact Hotline
                  </label>
                  <input
                    type="text"
                    value={shelterContactPhone}
                    onChange={(e) => setShelterContactPhone(e.target.value)}
                    placeholder="e.g. 0917-555-0192"
                    className="w-full bg-white border border-neutral-300 rounded-lg p-2 text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-xs text-neutral-800 block">
                  Coordinator Audit Rationale
                </label>
                <input
                  type="text"
                  value={shelterRationale}
                  onChange={(e) => setShelterRationale(e.target.value)}
                  placeholder="e.g. Headcount updated after 02:00 batch evacuation"
                  className="w-full bg-white border border-neutral-300 rounded-lg p-2 text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setEditingShelter(null)}
                  className="px-3 py-1.5 rounded-lg bg-white border border-neutral-200 text-neutral-700 text-xs font-medium hover:bg-neutral-50 shadow-2xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingShelter}
                  className="px-4 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs shadow-2xs transition"
                >
                  {isSavingShelter ? 'Saving...' : 'Save Shelter Updates'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 7: Record Stock Movement */}
      {recordingResource && (
        <div className="fixed inset-0 z-50 bg-neutral-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl border border-neutral-200 shadow-xl max-w-lg w-full p-5 sm:p-6 text-neutral-900 space-y-4 animate-modal">
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider">
                  Inventory Movement Ledger
                </span>
                <h3 className="text-base font-semibold text-neutral-900 mt-1 tracking-tight">
                  Record Stock Movement: {recordingResource.name}
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Current balance: {recordingResource.quantity} {recordingResource.unit} at {recordingResource.locationName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRecordingResource(null)}
                className="p-1 rounded-lg hover:bg-neutral-100 text-neutral-500 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordMovement} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-neutral-800 block">Movement Type</label>
                <select
                  value={movementType}
                  onChange={(e) => setMovementType(e.target.value as MovementType)}
                  className="w-full bg-white border border-neutral-300 rounded-lg p-2 text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                >
                  <option value="INBOUND_RELIEF">INBOUND RELIEF (Delivery from DSWD / LGU Warehouse)</option>
                  <option value="DISPATCH">FIELD DISPATCH (Loaded onto Rescue Vehicle)</option>
                  <option value="TRANSFER">INTER-SHELTER TRANSFER</option>
                  <option value="CONSUMPTION">ON-SITE CONSUMPTION</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-neutral-800 block">
                  Quantity ({recordingResource.unit})
                </label>
                <input
                  type="number"
                  min={1}
                  value={deltaQuantity}
                  onChange={(e) => setDeltaQuantity(Number(e.target.value))}
                  className="w-full bg-white border border-neutral-300 rounded-lg p-2 text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-neutral-800 block">
                  Coordinator Audit Notes & Destination
                </label>
                <input
                  type="text"
                  value={movementNotes}
                  onChange={(e) => setMovementNotes(e.target.value)}
                  placeholder="e.g. 50 packs dispatched to Bulelak covered court"
                  className="w-full bg-white border border-neutral-300 rounded-lg p-2 text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setRecordingResource(null)}
                  className="px-3 py-1.5 rounded-lg bg-white border border-neutral-200 text-neutral-700 text-xs font-medium hover:bg-neutral-50 shadow-2xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRecordingMovement}
                  className="px-4 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs shadow-2xs transition"
                >
                  {isRecordingMovement ? 'Recording...' : 'Commit Movement to Ledger'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 8: Responder Backup Details Modal */}
      {selectedBackupRequest && (
        <BackupDetailsModal
          request={selectedBackupRequest}
          mission={
            missions.find(
              (m) =>
                m.id === selectedBackupRequest.assignedMissionId ||
                m.assistanceRequestId === selectedBackupRequest.id ||
                m.evidenceRecordIds?.includes(selectedBackupRequest.id)
            )
          }
          onClose={() => setSelectedBackupRequest(null)}
          onStatusUpdated={() => {
            if (onDataChanged) onDataChanged();
          }}
        />
      )}

      {/* Modal 9: Responder Backup Details Modal for Incidents & Reports */}
      {selectedBackupIncident && (
        <BackupDetailsModal
          incident={selectedBackupIncident.incident}
          request={selectedBackupIncident.linkedRequest}
          mission={
            selectedBackupIncident.linkedMission ||
            missions.find((m) => m.evidenceRecordIds?.includes(selectedBackupIncident.incident.id))
          }
          onClose={() => setSelectedBackupIncident(null)}
          onStatusUpdated={() => {
            if (onDataChanged) onDataChanged();
          }}
        />
      )}
    </div>
  );
};
