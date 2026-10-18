/**
 * Resilia Explicit Demo Role Switcher
 * Clearly marked as DEMO ENVIRONMENT. Allows quick switching between
 * RESIDENT (Lola Rosa / Carlo), RESPONDER (Officer Juan), and COORDINATOR (Capt. Maria).
 */

import React, { useState } from 'react';
import { useAuth } from '../../services/auth/authContext';
import { UserRole } from '../../types';
import { ShieldCheck, UserCheck, HardHat, ShieldAlert, KeyRound } from 'lucide-react';
import { RbacMatrixModal } from '../auth/RbacMatrixModal';

export const DemoRoleBar: React.FC = () => {
  const { currentUser, setRole, availableUsers, setUser, isFirebaseAuthenticated } = useAuth();
  const [isRbacModalOpen, setIsRbacModalOpen] = useState(false);

  return (
    <>
      <div className="bg-neutral-900 border-b border-neutral-800 px-4 py-1.5 text-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {isFirebaseAuthenticated ? (
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-extrabold uppercase tracking-wider text-[10px] border border-emerald-500/40">
              Firebase Auth
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-extrabold uppercase tracking-wider text-[10px] border border-amber-500/40">
              Demo Persona
            </span>
          )}
          <span className="text-neutral-300 hidden sm:inline">Active:</span>
          <span className="font-semibold text-emerald-400">{currentUser.name}</span>
          <span className="text-neutral-400">({currentUser.role})</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsRbacModalOpen(true)}
            className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition font-medium text-[11px] flex items-center gap-1 border border-neutral-700"
            title="Open Role-Based Access Control (RBAC) Matrix Guide"
          >
            <KeyRound className="w-3 h-3 text-amber-400" />
            <span>RBAC Matrix</span>
          </button>

          <div className="flex items-center gap-1 bg-neutral-950 p-0.5 rounded-xl border border-neutral-800">
            <button
              onClick={() => setRole('RESIDENT')}
              className={`px-2 py-0.5 rounded-lg font-medium transition flex items-center gap-1 text-[11px] ${
                currentUser.role === 'RESIDENT'
                  ? 'bg-emerald-600 text-white font-bold shadow-sm'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
              title="Resident (Can report incidents, request help, view map)"
            >
              <UserCheck className="w-3 h-3" />
              <span>Resident</span>
            </button>

            <button
              onClick={() => setRole('RESPONDER')}
              className={`px-2 py-0.5 rounded-lg font-medium transition flex items-center gap-1 text-[11px] ${
                currentUser.role === 'RESPONDER'
                  ? 'bg-teal-600 text-white font-bold shadow-sm'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
              title="Responder (Can accept missions, submit road updates)"
            >
              <HardHat className="w-3 h-3" />
              <span>Responder</span>
            </button>

            <button
              onClick={() => setRole('COORDINATOR')}
              className={`px-2 py-0.5 rounded-lg font-medium transition flex items-center gap-1 text-[11px] ${
                currentUser.role === 'COORDINATOR'
                  ? 'bg-amber-600 text-white font-bold shadow-sm'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
              title="Coordinator (Can verify hazards, assign responders, allocate resources)"
            >
              <ShieldCheck className="w-3 h-3" />
              <span>Coordinator</span>
            </button>
          </div>
        </div>
      </div>

      <RbacMatrixModal
        isOpen={isRbacModalOpen}
        onClose={() => setIsRbacModalOpen(false)}
        onSelectRole={(r) => setRole(r)}
      />
    </>
  );
};
