/**
 * Resident Updates & Advisories Screen
 * Centralized chronological feed of official warnings, community advisories,
 * and verified incident updates without sensory overload.
 */

import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Info,
  Truck,
} from 'lucide-react';
import {
  EmergencyAlertIcon,
  GetHelpIcon,
  ReportProblemIcon,
} from '../../components/icons/ResidentIcons';
import { Alert, Incident } from '../../types';
import { Card, Notice, ScreenHeader, StatusPill } from './ui';
import { AlertCard, AlertDetailsDialog } from './ResidentAlerts';
import { currentAlerts, formatTime, isStale, timeAgo } from './residentUtils';
import { helpCategoryLabel, reportTypeLabel } from './strings';
import { Navigate, ResidentData } from './ResidentApp';
import { useAuth } from '../../services/auth/authContext';

interface ResidentUpdatesProps extends ResidentData {
  navigate: Navigate;
}

export const ResidentUpdates: React.FC<ResidentUpdatesProps> = (props) => {
  const { navigate } = props;
  const { currentUser } = useAuth();
  const alerts = currentAlerts(props.alerts);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);

  // My submitted assistance requests
  const myRequests = (props.assistanceRequests || []).filter(
    (r) => r.residentId === currentUser.id
  );

  // Verified community incidents (exclude unverified rumors)
  const verifiedIncidents = props.incidents.filter((i) => i.status === 'VERIFIED');

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <ScreenHeader
        title="Emergency Alerts & Updates"
        subtitle="Official advisories, personal request tracking, and verified hazards"
        onBack={() => navigate('HOME')}
      />

      {/* Personal Assistance Requests Status Section */}
      {myRequests.length > 0 && (
        <section aria-labelledby="my-requests-heading" className="space-y-3">
          <h2 id="my-requests-heading" className="text-base font-bold text-rs-text flex items-center gap-2">
            <GetHelpIcon className="w-5 h-5 text-rs-primary" /> My Help Requests ({myRequests.length})
          </h2>

          <div className="space-y-2.5">
            {myRequests.map((req) => {
              const assignedMission = props.missions?.find((m) => m.id === req.assignedMissionId);
              const isFulfilled = req.status === 'FULFILLED' || assignedMission?.status === 'COMPLETED';
              const isInProgress = req.status === 'IN_PROGRESS' || assignedMission?.status === 'IN_PROGRESS';
              const isAssigned = req.status === 'ASSIGNED' || assignedMission?.status === 'ASSIGNED';
              const isTriaged = req.status === 'TRIAGED' || assignedMission?.status === 'PROPOSED' || assignedMission?.status === 'APPROVED';

              let statusText = 'Request Recorded';
              let tone: 'neutral' | 'warning' | 'critical' = 'neutral';
              let description = 'Saved on device and queued for barangay operations review.';

              if (isFulfilled) {
                statusText = 'Fulfilled / Completed';
                tone = 'neutral';
                description = 'Assistance operation completed by emergency responders.';
              } else if (isInProgress) {
                statusText = 'Team In Transit / On Scene';
                tone = 'warning';
                description = assignedMission?.assignedResponderName
                  ? `Unit "${assignedMission.assignedResponderName}" is en route or on scene.`
                  : 'Assigned responder unit is currently active in the field.';
              } else if (isAssigned) {
                statusText = 'Responder Assigned';
                tone = 'warning';
                description = assignedMission?.assignedResponderName
                  ? `Assigned to ${assignedMission.assignedResponderName} (${assignedMission.assignedVehicleType || 'Vehicle'}).`
                  : 'Disaster coordinator assigned an active rescue unit.';
              } else if (isTriaged) {
                statusText = 'Prioritized by Coordinator';
                tone = 'warning';
                description = 'Reviewed in operations triage. Awaiting field responder dispatch.';
              }

              return (
                <Card key={req.id} className="p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-rs-text block text-base leading-snug">
                        {helpCategoryLabel(req.category)} — {req.locationName}
                      </span>
                      <p className="text-sm text-rs-text/90 mt-1">{req.description}</p>
                    </div>
                    <div className="shrink-0 self-start">
                      <StatusPill tone={tone}>{statusText}</StatusPill>
                    </div>
                  </div>

                  <div className="bg-rs-bg/70 p-2.5 rounded-lg text-xs space-y-1 text-rs-text/90">
                    <div className="flex items-center gap-1.5 font-medium">
                      <Truck className="w-3.5 h-3.5 text-rs-primary shrink-0" />
                      <span>{description}</span>
                    </div>
                    {req.priorityRationale && req.priorityRationale.length > 0 && (
                      <div className="text-[11px] text-rs-muted">
                        Priority: <strong>{req.priority}</strong> ({req.priorityRationale[0]})
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-between text-xs text-rs-muted pt-2 border-t border-rs-border/60">
                    <span className="font-mono">Ref: {req.id.slice(0, 12)}</span>
                    <span>{timeAgo(req.updatedAt || req.createdAt)}</span>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {/* Official Alerts Section */}
      <section aria-labelledby="official-alerts-heading" className="space-y-3">
        <h2 id="official-alerts-heading" className="text-base font-bold text-rs-text flex items-center gap-2">
          <EmergencyAlertIcon className="w-5 h-5 text-rs-primary" /> Active Official Alerts ({alerts.length})
        </h2>

        {alerts.length > 0 ? (
          alerts.map((alt) => (
            <AlertCard
              key={alt.id}
              alert={alt}
              isOffline={props.connectivity === 'OFFLINE'}
              onOpen={() => setSelectedAlert(alt)}
            />
          ))
        ) : (
          <Card className="p-6 text-center text-rs-muted space-y-1">
            <CheckCircle2 className="w-8 h-8 mx-auto text-rs-primary" />
            <p className="font-semibold text-rs-text">No active emergency alerts at this time.</p>
            <p className="text-xs">Normal monitoring protocol in effect for Marikina Valley.</p>
          </Card>
        )}
      </section>

      {/* Verified Community Hazards Section */}
      <section aria-labelledby="verified-hazards-heading" className="space-y-3 pt-2">
        <h2 id="verified-hazards-heading" className="text-base font-bold text-rs-text flex items-center gap-2">
          <ReportProblemIcon className="w-5 h-5 text-amber-600" /> Verified Hazards & Road Statuses
        </h2>

        <div className="space-y-2.5">
          {verifiedIncidents.map((inc) => (
            <Card key={inc.id} className="p-4 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <span className="font-bold text-rs-text block text-base leading-snug">
                    {reportTypeLabel(inc.type)} — {inc.locationName}
                  </span>
                  <p className="text-sm text-rs-text/90 mt-0.5">{inc.description}</p>
                </div>
                <div className="shrink-0 self-start">
                  <StatusPill tone="warning">Verified</StatusPill>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between text-xs text-rs-muted pt-2 border-t border-rs-border/60">
                <span>Verified by: {inc.verifiedBy || 'CDRRMO Coordinator'}</span>
                <span>{timeAgo(inc.verifiedAt || inc.createdAt)}</span>
              </div>
            </Card>
          ))}

          {verifiedIncidents.length === 0 && (
            <Card className="p-5 text-center text-rs-muted text-sm">
              No active verified community road blockages or flash flood alerts recorded.
            </Card>
          )}
        </div>
      </section>

      {/* Alert Details Modal */}
      <AlertDetailsDialog
        alert={selectedAlert}
        community={props.community}
        isOffline={props.connectivity === 'OFFLINE'}
        onClose={() => setSelectedAlert(null)}
        onFindShelter={() => {
          setSelectedAlert(null);
          navigate('RESOURCES_SHELTERS');
        }}
        onGetHelp={() => {
          setSelectedAlert(null);
          navigate('REQUEST_ASSISTANCE');
        }}
      />
    </div>
  );
};
