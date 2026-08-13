/// <reference types="vite/client" />
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Read config from environment variables (VITE_ prefix required for Vite)
const env = (import.meta as any).env || {};

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || 'AIzaSyBoWywY7G-xq44oRKcabTDc5apDnk65l5I',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || 'bendahara-3e921.firebaseapp.com',
  databaseURL: env.VITE_FIREBASE_DATABASE_URL || 'https://bendahara-3e921-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: env.VITE_FIREBASE_PROJECT_ID || 'bendahara-3e921',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || 'bendahara-3e921.firebasestorage.app',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '310193913138',
  appId: env.VITE_FIREBASE_APP_ID || '1:310193913138:web:7db45f27a1b6ddbbb92b2b',
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || 'G-W6ZMHRMFZ0',
};

// Initialize Firebase (singleton-safe)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Use the default Firestore database
export const db = getFirestore(app);

export const storage = getStorage(app);

// Initialize Analytics safely (guarded — can throw in restricted environments)
export let analytics: ReturnType<typeof import('firebase/analytics').getAnalytics> | null = null;
if (typeof window !== 'undefined') {
  try {
    import('firebase/analytics')
      .then(({ getAnalytics }) => {
        analytics = getAnalytics(app);
      })
      .catch((err) => {
        console.warn('Firebase Analytics could not be initialized:', err);
      });
  } catch (err) {
    console.warn('Firebase Analytics init skipped:', err);
  }
}

export default app;
