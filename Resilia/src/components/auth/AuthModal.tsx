/**
 * Resilia Authentication Modal
 * Supports Firebase Sign-in with Google, Email/Password login,
 * user registration with role selection (Resident, Responder, Coordinator),
 * and account status indicators.
 */

import React, { useState } from 'react';
import { useAuth } from '../../services/auth/authContext';
import { UserRole } from '../../types';
import {
  CheckCircle2,
  HardHat,
  Lock,
  LogIn,
  LogOut,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  User,
  UserCheck,
  UserPlus,
  X,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const {
    currentUser,
    firebaseUser,
    isFirebaseAuthenticated,
    loginWithGoogle,
    loginWithEmail,
    registerWithEmail,
    logout,
  } = useAuth();

  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('RESIDENT');
  const [locationName, setLocationName] = useState('Barangay Tumana / Malanday');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await loginWithGoogle(role);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (mode === 'LOGIN') {
        await loginWithEmail(email, password);
      } else {
        await registerWithEmail(email, password, name, role, phone, locationName);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white rounded-xl border border-neutral-200 shadow-2xl p-5 sm:p-6 text-neutral-900 text-xs space-y-4 animate-in fade-in zoom-in-95">
        <div className="flex items-start justify-between pb-3 border-b border-neutral-100">
          <div>
            <h3 className="text-base font-semibold text-neutral-900 tracking-tight">
              {isFirebaseAuthenticated ? 'Account & Identity' : mode === 'LOGIN' ? 'Sign In to Resilia' : 'Create Resilia Account'}
            </h3>
            <p className="text-[11px] text-neutral-500 mt-0.5">
              Firebase Authentication with Role-Based Access Control
            </p>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-800 p-1 rounded-md hover:bg-neutral-100 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs">
            {error}
          </div>
        )}

        {isFirebaseAuthenticated ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-bold text-emerald-950">Authenticated via Firebase</span>
              </div>
              <div className="space-y-1 text-neutral-700">
                <div>User ID: <span className="font-mono text-neutral-900">{firebaseUser?.uid}</span></div>
                <div>Email: <span className="font-semibold text-neutral-900">{firebaseUser?.email}</span></div>
                <div>Assigned Role: <span className="font-black text-emerald-800">{currentUser.role}</span></div>
              </div>
            </div>

            <button
              onClick={async () => {
                await logout();
                onClose();
              }}
              className="w-full py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold transition flex items-center justify-center gap-2"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out to Demo Mode</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Google Sign-in button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full py-3 rounded-2xl border border-neutral-300 bg-white hover:bg-neutral-50 font-bold text-xs text-neutral-800 flex items-center justify-center gap-2 shadow-2xs transition"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="flex items-center gap-2 my-2 text-neutral-400 text-[10px]">
              <div className="flex-1 h-px bg-neutral-200" />
              <span>OR EMAIL</span>
              <div className="flex-1 h-px bg-neutral-200" />
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-3">
              {mode === 'REGISTER' && (
                <>
                  <div>
                    <label className="font-bold text-neutral-700 block mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Maria Santos"
                      className="w-full bg-neutral-50 border border-neutral-300 rounded-xl p-2.5 text-neutral-900"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-neutral-700 block mb-1">Desired Operational Role</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(['RESIDENT', 'RESPONDER', 'COORDINATOR'] as UserRole[]).map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setRole(r)}
                          className={`p-2 rounded-xl border text-center font-bold text-[10px] transition ${
                            role === r
                              ? 'bg-emerald-600 text-white border-emerald-700'
                              : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="font-bold text-neutral-700 block mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@resilia.ph"
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-xl pl-9 pr-3 py-2.5 text-neutral-900"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-neutral-700 block mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-xl pl-9 pr-3 py-2.5 text-neutral-900"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 font-bold text-white shadow-sm transition flex items-center justify-center gap-2"
              >
                {mode === 'LOGIN' ? <LogIn className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
                <span>{mode === 'LOGIN' ? 'Sign In with Email' : 'Register Account'}</span>
              </button>
            </form>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setMode(mode === 'LOGIN' ? 'REGISTER' : 'LOGIN')}
                className="text-emerald-700 font-bold hover:underline"
              >
                {mode === 'LOGIN'
                  ? "Don't have an account? Register with Role"
                  : 'Already registered? Sign in here'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
