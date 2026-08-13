/**
 * Local constants for SmartKas School.
 *
 * ALL data now lives in Firebase Firestore.
 * This file only exports helper constants and backward-compat empty arrays.
 * The empty arrays are passed to useSafeCollection hooks which ignore them anyway.
 */

// ================= BACKWARD-COMPAT EMPTY ARRAYS =================
// These are referenced by 17+ files. The hooks ignore the fallback argument,
// but we must export them to avoid import crashes.

export const LOCAL_SEKOLAH: any[] = [];
export const LOCAL_JURUSAN: any[] = [];
export const LOCAL_KELAS: any[] = [];
export const LOCAL_SISWA: any[] = [];
export const LOCAL_PEMBAYARAN: any[] = [];
export const LOCAL_PENGELUARAN: any[] = [];
export const LOCAL_USERS: any[] = [];
export const SEKOLAH_ID = '';

// ================= OFFLINE FLAG =================

/**
 * Global flag — set to true once any Firestore listener fails.
 * The ConnectionStatus indicator reads this to show the offline badge.
 */
let _isOfflineMode = false;

export function setOfflineMode(val: boolean) {
  if (val && !_isOfflineMode) {
    _isOfflineMode = val;
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('smartkas-connection-change', { detail: { offline: true } }));
    }
  }
}

export function isOfflineMode() {
  return _isOfflineMode;
}
