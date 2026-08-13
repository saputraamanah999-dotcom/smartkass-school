import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './config';
import { TampilanConfig } from '../../types';

export const DEFAULT_TAMPILAN_CONFIG: TampilanConfig = {
  logoUrl: '', // Using SVG logo component instead
  splashBackgroundUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1600&auto=format&fit=crop&q=80',
  splashVideoUrl: '',
  splashDuration: 3,
  bannerUrl: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=1200&auto=format&fit=crop&q=80',
  tagline: 'Kelola Uang Kas Sekolah Cerdas, Transparan & Realtime',
  tema: 'dark',
  updatedAt: new Date().toISOString(),
};

/**
 * Background seed — runs on app startup to ensure config exists.
 * Full database setup is done via the DatabaseSetupModal (one-click button).
 * This function is non-blocking and never throws.
 */
export async function seedInitialData() {
  try {
    // Only create config if it doesn't exist
    const configRef = doc(db, 'config', 'tampilan');
    try {
      const configSnap = await getDoc(configRef);
      if (!configSnap.exists()) {
        await setDoc(configRef, DEFAULT_TAMPILAN_CONFIG);
        console.log('Created default config/tampilan');
      }
    } catch (e) {
      console.warn('Seed: could not access config/tampilan (rules?). Skipping.', e);
    }
  } catch (err) {
    console.error('Error in background seed:', err);
  }
}

/** Helper: setDoc that never throws — swallows permission/network errors. */
export async function safeSetDoc(ref: ReturnType<typeof doc>, data: Record<string, unknown> | object) {
  try {
    await setDoc(ref, data as Record<string, unknown>);
  } catch (e) {
    console.warn('Seed: setDoc failed (skipped):', e);
  }
}
