import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  User,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './config';
import { UserProfile, Role } from '../../types';

/**
 * Sign in user with email and password
 */
export async function loginWithEmailPassword(email: string, pass: string): Promise<UserProfile | null> {
  const res = await signInWithEmailAndPassword(auth, email, pass);
  if (res.user) {
    const userSnap = await getDoc(doc(db, 'users', res.user.uid));
    if (userSnap.exists()) {
      return userSnap.data() as UserProfile;
    }
  }
  return null;
}

/**
 * Register new user with profile in Firestore
 */
export async function registerNewUser(
  userData: Omit<UserProfile, 'uid' | 'createdAt'>,
  password?: string
): Promise<UserProfile> {
  let uid = `user-${Date.now()}`;
  
  if (password) {
    try {
      const userCred = await createUserWithEmailAndPassword(auth, userData.email, password);
      uid = userCred.user.uid;
      await updateProfile(userCred.user, { displayName: userData.nama });
    } catch (e) {
      console.warn('Firebase Auth creation fallback to custom doc ID:', e);
    }
  }

  const profile: UserProfile = {
    ...userData,
    uid,
    createdAt: new Date().toISOString(),
  };

  await setDoc(doc(db, 'users', uid), profile);
  return profile;
}

/**
 * Fetch UserProfile doc from Firestore
 */
export async function fetchUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (snap.exists()) {
    return snap.data() as UserProfile;
  }
  return null;
}

/**
 * Sign out current user
 */
export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

/**
 * Reset user password via Firebase Auth
 */
export async function resetUserPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}
