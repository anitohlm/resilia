/**
 * Resilia Firebase Authentication Service
 * Manages Google Sign-In popup, email/password registration,
 * Firestore user profile persistence, and offline fallback caching.
 */

import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/firebase';
import { User, UserRole } from '../../types';
import { localDB, STORES } from '../offline/db';

export class FirebaseAuthService {
  /**
   * Signs in with Google popup.
   */
  public static async loginWithGoogle(defaultRole: UserRole = 'RESIDENT'): Promise<User> {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const fbUser = result.user;
    return this.syncFirebaseUserProfile(fbUser, defaultRole);
  }

  /**
   * Signs in with Email and Password.
   */
  public static async loginWithEmail(email: string, pass: string): Promise<User> {
    const result = await signInWithEmailAndPassword(auth, email, pass);
    return this.syncFirebaseUserProfile(result.user);
  }

  /**
   * Registers a new user with Email, Password, and Role selection.
   */
  public static async registerWithEmail(
    email: string,
    pass: string,
    name: string,
    role: UserRole,
    phone = '',
    locationName = 'Barangay Tumana / Malanday'
  ): Promise<User> {
    const result = await createUserWithEmailAndPassword(auth, email, pass);
    const fbUser = result.user;

    const userProfile: User = {
      id: fbUser.uid,
      name: name || fbUser.displayName || 'Resilia Community Member',
      role,
      email: fbUser.email || email,
      phone,
      locationName,
      status: 'ACTIVE',
    };

    // Save to Firestore
    try {
      await setDoc(doc(db, 'users', fbUser.uid), userProfile);
    } catch (err) {
      console.warn('Could not save user profile to Firestore immediately:', err);
    }

    // Save to IndexedDB for offline durability
    await localDB.put(STORES.USERS, userProfile);
    localStorage.setItem('resilia_current_user_id', userProfile.id);

    return userProfile;
  }

  /**
   * Signs out from Firebase and updates local session.
   */
  public static async logout(): Promise<void> {
    try {
      await signOut(auth);
    } catch (err) {
      console.warn('Firebase signOut error:', err);
    }
  }

  /**
   * Retrieves or provisions user profile in Firestore and caches in IndexedDB.
   */
  public static async syncFirebaseUserProfile(fbUser: FirebaseUser, defaultRole: UserRole = 'RESIDENT'): Promise<User> {
    let role = defaultRole;
    let name = fbUser.displayName || 'Resilia User';
    let phone = fbUser.phoneNumber || '';
    let locationName = 'Barangay Tumana / Malanday';
    let status: User['status'] = 'ACTIVE';

    try {
      const userDocRef = doc(db, 'users', fbUser.uid);
      const docSnap = await getDoc(userDocRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as Partial<User>;
        if (data.role) role = data.role as UserRole;
        if (data.name) name = data.name;
        if (data.phone) phone = data.phone;
        if (data.locationName) locationName = data.locationName;
        if (data.status) status = data.status;
      } else {
        // Create initial profile in Firestore
        const newProfile: User = {
          id: fbUser.uid,
          name,
          role,
          email: fbUser.email || '',
          phone,
          locationName,
          status,
        };
        await setDoc(userDocRef, newProfile);
      }
    } catch (err) {
      console.warn('Firestore user fetch failed (offline or network disruption):', err);
    }

    const appUser: User = {
      id: fbUser.uid,
      name,
      role,
      email: fbUser.email || '',
      phone,
      locationName,
      status,
    };

    // Cache locally in IndexedDB
    await localDB.put(STORES.USERS, appUser);
    localStorage.setItem('resilia_current_user_id', appUser.id);

    return appUser;
  }
}
