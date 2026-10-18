/**
 * Resilia Authentication & Role Context
 * Implements Firebase Authentication with Google Sign-In, Email/Password flows,
 * Firestore user profile sync, and offline session resilience.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, UserRole } from '../../types';
import { DEMO_USERS } from '../../demo/seedData';
import { localDB, STORES } from '../offline/db';
import { auth, db } from '../firebase/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { FirebaseAuthService } from './firebaseAuthService';
import { getRolePermissions } from './rbac';

interface AuthContextType {
  currentUser: User;
  firebaseUser: FirebaseUser | null;
  isFirebaseAuthenticated: boolean;
  isAuthReady: boolean;
  isDemoMode: boolean;
  setRole: (role: UserRole) => Promise<void>;
  setUser: (user: User) => void;
  availableUsers: User[];
  canVerifyIncidents: boolean;
  canApproveMissions: boolean;
  canAcceptMissions: boolean;
  canManageResources: boolean;
  canReportIncidents: boolean;
  canRequestAssistance: boolean;
  canAssignResponders: boolean;
  canRespondToIncidents: boolean;
  canDeclareDisaster: boolean;
  canStandDownDisaster: boolean;
  canBroadcastSiren: boolean;
  canInspectSafeRoster: boolean;
  canAccessCommandDashboard: boolean;
  canAccessFieldMissions: boolean;
  canAccessVerification: boolean;
  loginWithGoogle: (role?: UserRole) => Promise<User>;
  loginWithEmail: (email: string, pass: string) => Promise<User>;
  registerWithEmail: (
    email: string,
    pass: string,
    name: string,
    role: UserRole,
    phone?: string,
    location?: string
  ) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'resilia_current_user_id';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUserState] = useState<User>(DEMO_USERS[0]); // Default to Coordinator
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState<boolean>(false);
  const [availableUsers, setAvailableUsers] = useState<User[]>(DEMO_USERS);

  useEffect(() => {
    // 1. Initial Local Session Bootstrap from IndexedDB
    const loadCachedSession = async () => {
      try {
        const storedUsers = await localDB.getAll<User>(STORES.USERS);
        if (storedUsers.length > 0) {
          setAvailableUsers(storedUsers);
          const savedUserId = localStorage.getItem(STORAGE_KEY);
          const matched = storedUsers.find((u) => u.id === savedUserId);
          if (matched) {
            setCurrentUserState(matched);
          }
        }
      } catch (err) {
        console.warn('Could not read cached session:', err);
      }
    };
    loadCachedSession();

    // 2. Firebase onAuthStateChanged Listener
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        try {
          const profile = await FirebaseAuthService.syncFirebaseUserProfile(fbUser, currentUser.role);
          setCurrentUserState(profile);
        } catch (err) {
          console.warn('Error syncing profile on auth change:', err);
        }
      }
      setIsAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  const setUser = (user: User) => {
    setCurrentUserState(user);
    localStorage.setItem(STORAGE_KEY, user.id);
  };

  const setRole = async (role: UserRole) => {
    // In demo mode or role switching, switch to the canonical representative persona
    // so ID-based checks (assignedResponderId, residentId) work consistently across roles.
    let updatedUser: User;
    if (!firebaseUser) {
      const canonical = DEMO_USERS.find((u) => u.role === role) || {
        ...currentUser,
        role,
      };
      updatedUser = canonical;
    } else {
      updatedUser = {
        ...currentUser,
        role,
      };
    }

    setUser(updatedUser);

    // Save locally
    await localDB.put(STORES.USERS, updatedUser);

    // If authenticated in Firebase, update Firestore profile
    if (firebaseUser) {
      try {
        await setDoc(doc(db, 'users', firebaseUser.uid), { role }, { merge: true });
      } catch (err) {
        console.warn('Could not update role in Firestore:', err);
      }
    }
  };

  const loginWithGoogle = async (role: UserRole = 'RESIDENT'): Promise<User> => {
    const user = await FirebaseAuthService.loginWithGoogle(role);
    setUser(user);
    return user;
  };

  const loginWithEmail = async (email: string, pass: string): Promise<User> => {
    const user = await FirebaseAuthService.loginWithEmail(email, pass);
    setUser(user);
    return user;
  };

  const registerWithEmail = async (
    email: string,
    pass: string,
    name: string,
    role: UserRole,
    phone = '',
    location = 'Barangay Tumana / Malanday'
  ): Promise<User> => {
    const user = await FirebaseAuthService.registerWithEmail(email, pass, name, role, phone, location);
    setUser(user);
    return user;
  };

  const logout = async () => {
    await FirebaseAuthService.logout();
    setFirebaseUser(null);
    // Revert to demo account
    setUser(DEMO_USERS[0]);
  };

  // Explicit Role-Based Access Control Gates
  const perms = getRolePermissions(currentUser.role);
  const {
    canVerifyIncidents,
    canApproveMissions,
    canAcceptMissions,
    canManageResources,
    canReportIncidents,
    canRequestAssistance,
    canAssignResponders,
    canRespondToIncidents,
    canDeclareDisaster,
    canStandDownDisaster,
    canBroadcastSiren,
    canInspectSafeRoster,
    canAccessCommandDashboard,
    canAccessFieldMissions,
    canAccessVerification,
  } = perms;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        firebaseUser,
        isFirebaseAuthenticated: !!firebaseUser,
        isAuthReady,
        isDemoMode: !firebaseUser,
        setRole,
        setUser,
        availableUsers,
        canVerifyIncidents,
        canApproveMissions,
        canAcceptMissions,
        canManageResources,
        canReportIncidents,
        canRequestAssistance,
        canAssignResponders,
        canRespondToIncidents,
        canDeclareDisaster,
        canStandDownDisaster,
        canBroadcastSiren,
        canInspectSafeRoster,
        canAccessCommandDashboard,
        canAccessFieldMissions,
        canAccessVerification,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    const resident = DEMO_USERS[2]; // Default resident for headless/test environments
    return {
      currentUser: resident,
      firebaseUser: null,
      isFirebaseAuthenticated: false,
      isAuthReady: true,
      isDemoMode: true,
      setRole: async () => {},
      setUser: () => {},
      availableUsers: DEMO_USERS,
      ...getRolePermissions('RESIDENT'),
      loginWithGoogle: async () => resident,
      loginWithEmail: async () => resident,
      registerWithEmail: async () => resident,
      logout: async () => {},
    };
  }
  return context;
}
