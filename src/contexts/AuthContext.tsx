import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { UserProfile, Role } from '../types';
import { db, auth } from '../lib/firebase/config';
import {
  doc,
  getDoc,
  setDoc,
} from 'firebase/firestore';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  User as FirebaseUser,
} from 'firebase/auth';

// Firebase API key — read from Vite env (same as config.ts), with compile-time fallback
const FIREBASE_API_KEY = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_FIREBASE_API_KEY) || 'AIzaSyBoWywY7G-xq44oRKcabTDc5apDnk65l5I';

interface AuthContextType {
  user: UserProfile | null;
  activeSekolahId: string;
  setActiveSekolahId: (sekolahId: string) => void;
  loading: boolean;
  loginWithEmail: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  /** Create Firebase Auth user + Firestore profile. Does NOT affect current session. */
  createAccount: (
    accountData: Partial<UserProfile> & { email: string; nama: string; role: Role; password: string; sekolahId: string; jurusanId?: string; kelasId?: string }
  ) => Promise<string>; // returns new user's UID
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('smartkas_active_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [activeSekolahId, setActiveSekolahIdState] = useState<string>(() => {
    const saved = localStorage.getItem('smartkas_active_sekolah_id');
    if (saved) return saved;
    return user?.sekolahId || '';
  });

  const [loading, setLoading] = useState<boolean>(true);
  const firebaseUserRef = useRef<FirebaseUser | null>(null);

  const setActiveSekolahId = (id: string) => {
    setActiveSekolahIdState(id);
    localStorage.setItem('smartkas_active_sekolah_id', id);
  };

  const fetchProfile = async (uid: string): Promise<UserProfile | null> => {
    try {
      const userSnap = await getDoc(doc(db, 'users', uid));
      if (userSnap.exists()) {
        return userSnap.data() as UserProfile;
      }
    } catch (e) {
      console.warn('fetchProfile: could not read users/' + uid, e);
    }
    return null;
  };

  useEffect(() => {
    let unsubAuth: (() => void) | undefined;
    let safetyTimer: ReturnType<typeof setTimeout> | undefined;

    try {
      unsubAuth = onAuthStateChanged(auth, async (firebaseUser) => {
        firebaseUserRef.current = firebaseUser;
        if (firebaseUser) {
          const freshUser = await fetchProfile(firebaseUser.uid);
          if (freshUser) {
            setUser(freshUser);
            localStorage.setItem('smartkas_active_user', JSON.stringify(freshUser));
            if (freshUser.sekolahId) {
              setActiveSekolahIdState(freshUser.sekolahId);
              localStorage.setItem('smartkas_active_sekolah_id', freshUser.sekolahId);
            }
          } else {
            setUser(null);
            localStorage.removeItem('smartkas_active_user');
          }
        } else {
          setUser(null);
          localStorage.removeItem('smartkas_active_user');
        }
        setLoading(false);
      });
    } catch (e) {
      console.warn('onAuthStateChanged setup failed:', e);
      setLoading(false);
    }

    safetyTimer = setTimeout(() => setLoading(false), 5000);

    return () => {
      if (unsubAuth) unsubAuth();
      if (safetyTimer) clearTimeout(safetyTimer);
    };
  }, []);

  const loginWithEmail = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    const normalizedEmail = (email || '').trim().toLowerCase();

    try {
      const cred = await signInWithEmailAndPassword(auth, normalizedEmail, password);
      firebaseUserRef.current = cred.user;

      const profile = await fetchProfile(cred.user.uid);
      if (profile) {
        setUser(profile);
        localStorage.setItem('smartkas_active_user', JSON.stringify(profile));
        if (profile.sekolahId) {
          setActiveSekolahId(profile.sekolahId);
        }
      }

      setLoading(false);
      return true;
    } catch (err: any) {
      console.warn('Login failed:', err?.code || err?.message || err);
      setLoading(false);
      return false;
    }
  };

  /**
   * createAccount — creates a Firebase Auth user via REST API (does NOT
   * change the current admin session), then writes a Firestore profile doc.
   */
  const createAccount = async (
    accountData: Partial<UserProfile> & { email: string; nama: string; role: Role; password: string; sekolahId: string; jurusanId?: string; kelasId?: string }
  ): Promise<string> => {
    const normalizedEmail = (accountData.email || '').trim().toLowerCase();
    const { password, nama, role, sekolahId, jurusanId, kelasId } = accountData;

    // 1. Create Firebase Auth user via REST API (doesn't affect current session)
    const signUpUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_API_KEY}`;
    const signUpRes = await fetch(signUpUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: normalizedEmail,
        password,
        displayName: nama.trim(),
        returnSecureToken: false,
      }),
    });

    const signUpData = await signUpRes.json();
    if (!signUpRes.ok) {
      const errMsg = signUpData?.error?.message || 'Gagal membuat akun Firebase Authentication.';
      if (signUpData?.error?.message?.includes('EMAIL_EXISTS')) {
        throw new Error(`Email "${normalizedEmail}" sudah terdaftar.`);
      }
      if (signUpData?.error?.message?.includes('WEAK_PASSWORD')) {
        throw new Error('Kata sandi terlalu lemah. Minimal 6 karakter.');
      }
      throw new Error(errMsg);
    }

    const newUid = signUpData.localId;

    // 2. Write the user profile doc to Firestore
    const profile: UserProfile = {
      uid: newUid,
      nama: nama.trim(),
      email: normalizedEmail,
      role,
      sekolahId,
      jurusanId: role === 'admin' ? '' : (jurusanId || ''),
      kelasId: role === 'admin' ? '' : (kelasId || ''),
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'users', newUid), profile);

    return newUid;
  };

  const logout = async () => {
    try {
      await fbSignOut(auth);
    } catch (e) {
      console.warn('logout: signOut failed', e);
    }
    firebaseUserRef.current = null;
    setUser(null);
    localStorage.removeItem('smartkas_active_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        activeSekolahId,
        setActiveSekolahId,
        loading,
        loginWithEmail,
        logout,
        createAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
