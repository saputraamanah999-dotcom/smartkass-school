import { useEffect, useState, useRef, useCallback } from 'react';
import {
  collection,
  collectionGroup,
  onSnapshot,
  doc,
  query,
  where,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../lib/firebase/config';

interface UseSafeCollectionOptions {
  /** Filter results by sekolahId (client-side filter after fetch). */
  sekolahId?: string;
  /** Filter results by kelasId (client-side filter after fetch). */
  kelasId?: string;
  /** Filter results by jurusanId (client-side filter after fetch). */
  jurusanId?: string;
  /** Filter results by user role (for the 'users' collection: 'admin' | 'guru' | 'bendahara'). */
  role?: string;
  /** Arbitrary field filter: { fieldName: value }. */
  where?: Record<string, any>;
}

interface UseSafeCollectionResult<T> {
  data: T[];
  loading: boolean;
  isOffline: boolean;
}

/**
 * `useSafeCollection` — subscribes to a Firestore collection (or collectionGroup)
 * and returns real-time data. No more demo fallback — if Firestore fails
 * (e.g. permission-denied or network error), the hook returns an empty array
 * and surfaces `isOffline: true` so the ConnectionStatus banner can show it.
 *
 * @param path       Firestore collection path (e.g. 'sekolah')
 * @param _fallback  Ignored. Kept in the signature for backwards compatibility
 *                   with existing call sites — passing LOCAL_* data here has
 *                   NO effect. Remove the argument when convenient.
 * @param options    Optional client-side filters (sekolahId, kelasId, jurusanId)
 */
export function useSafeCollection<T extends Record<string, any>>(
  path: string,
  _fallback?: T[],
  options?: UseSafeCollectionOptions
): UseSafeCollectionResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const mountedRef = useRef(true);

  const applyFilters = useCallback(
    (items: T[]): T[] => {
      if (!options) return items;
      return items.filter((item) => {
        if (options.sekolahId && item.sekolahId && item.sekolahId !== options.sekolahId) {
          if (!item._docPath || !String(item._docPath).includes(options.sekolahId)) {
            return false;
          }
        }
        if (options.kelasId && item.kelasId && item.kelasId !== options.kelasId) {
          return false;
        }
        if (options.jurusanId && item.jurusanId && item.jurusanId !== options.jurusanId) {
          return false;
        }
        if (options.role && item.role !== options.role) {
          return false;
        }
        if (options.where) {
          for (const [field, value] of Object.entries(options.where)) {
            if ((item as any)[field] !== value) return false;
          }
        }
        return true;
      });
    },
    [options?.sekolahId, options?.kelasId, options?.jurusanId, options?.role, JSON.stringify(options?.where || {})]
  );

  useEffect(() => {
    mountedRef.current = true;

    let unsub: Unsubscribe | undefined;
    let settled = false;

    try {
      unsub = onSnapshot(
        collection(db, path),
        (snap) => {
          if (!mountedRef.current) return;
          const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as unknown as T);
          setData(applyFilters(list));
          setIsOffline(false);
          setLoading(false);
          settled = true;
        },
        (err) => {
          if (!mountedRef.current || settled) return;
          // No demo fallback — keep empty array, mark offline so the UI can
          // surface a banner instead of silently showing fake data.
          // Intentionally do NOT console.warn to keep the console clean.
          setIsOffline(true);
          setData([]);
          setLoading(false);
          settled = true;
        }
      );
    } catch (err) {
      setIsOffline(true);
      setData([]);
      setLoading(false);
      settled = true;
    }

    // Safety: if Firestore never responds within 6s, release the loading
    // state so the UI is never stuck on a spinner.
    const safety = setTimeout(() => {
      if (!mountedRef.current || settled) return;
      setIsOffline(true);
      setData([]);
      setLoading(false);
      settled = true;
    }, 6000);

    return () => {
      mountedRef.current = false;
      if (unsub) unsub();
      clearTimeout(safety);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);

  return { data, loading, isOffline };
}

/**
 * `useSafeCollectionGroup` — same as useSafeCollection but uses collectionGroup
 * to query across all subcollections with the same name.
 */
export function useSafeCollectionGroup<T extends Record<string, any>>(
  collectionName: string,
  _fallback?: T[],
  options?: UseSafeCollectionOptions
): UseSafeCollectionResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const mountedRef = useRef(true);

  const applyFilters = useCallback(
    (items: T[]): T[] => {
      if (!options) return items;
      return items.filter((item) => {
        if (options.sekolahId) {
          const sid = item.sekolahId ? String(item.sekolahId) : '';
          const path = item._docPath ? String(item._docPath) : '';
          if (sid !== options.sekolahId && !path.includes(options.sekolahId)) {
            return false;
          }
        }
        if (options.kelasId && item.kelasId && String(item.kelasId) !== options.kelasId) {
          return false;
        }
        if (options.jurusanId && item.jurusanId && String(item.jurusanId) !== options.jurusanId) {
          return false;
        }
        if (options.role && item.role !== options.role) {
          return false;
        }
        if (options.where) {
          for (const [field, value] of Object.entries(options.where)) {
            if ((item as any)[field] !== value) return false;
          }
        }
        return true;
      });
    },
    [options?.sekolahId, options?.kelasId, options?.jurusanId, options?.role, JSON.stringify(options?.where || {})]
  );

  // Re-subscribe when collectionName OR filter options change
  const filterKey = JSON.stringify(options?.sekolahId || '') + '|' +
    JSON.stringify(options?.kelasId || '') + '|' +
    JSON.stringify(options?.jurusanId || '') + '|' +
    JSON.stringify(options?.role || '') + '|' +
    JSON.stringify(options?.where || {});

  useEffect(() => {
    mountedRef.current = true;

    let unsub: Unsubscribe | undefined;
    let settled = false;

    try {
      unsub = onSnapshot(
        collectionGroup(db, collectionName),
        (snap) => {
          if (!mountedRef.current) return;
          const list = snap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
            _docPath: d.ref.path,
          }) as unknown as T);
          setData(applyFilters(list));
          setIsOffline(false);
          setLoading(false);
          settled = true;
        },
        (err) => {
          if (!mountedRef.current || settled) return;
          // Log the actual error for debugging (collectionGroup permission-denied, etc.)
          console.warn('useSafeCollectionGroup error:', err?.message || err);
          setIsOffline(true);
          setData([]);
          setLoading(false);
          settled = true;
        }
      );
    } catch (err) {
      setIsOffline(true);
      setData([]);
      setLoading(false);
      settled = true;
    }

    const safety = setTimeout(() => {
      if (!mountedRef.current || settled) return;
      setIsOffline(true);
      setData([]);
      setLoading(false);
      settled = true;
    }, 6000);

    return () => {
      mountedRef.current = false;
      if (unsub) unsub();
      clearTimeout(safety);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionName, filterKey]);

  return { data, loading, isOffline };
}

/**
 * `useSafeDoc` — subscribes to a single Firestore document.
 * No demo fallback — returns null on error.
 */
export function useSafeDoc<T extends Record<string, any>>(
  path: string,
  _fallback?: T | null
): { data: T | null; loading: boolean; isOffline: boolean } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!path || path.includes('//'));
  const [isOffline, setIsOffline] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    // Guard: skip Firestore call if path is empty or contains double slashes
    if (!path || path.includes('//')) {
      setLoading(false);
      return;
    }

    mountedRef.current = true;
    let settled = false;
    let unsub: Unsubscribe | undefined;

    try {
      unsub = onSnapshot(
        doc(db, path),
        (snap) => {
          if (!mountedRef.current) return;
          if (snap.exists()) {
            setData({ id: snap.id, ...snap.data() } as unknown as T);
            setIsOffline(false);
          }
          setLoading(false);
          settled = true;
        },
        (err) => {
          if (!mountedRef.current || settled) return;
          setIsOffline(true);
          setData(null);
          setLoading(false);
          settled = true;
        }
      );
    } catch (err) {
      setIsOffline(true);
      setData(null);
      setLoading(false);
      settled = true;
    }

    const safety = setTimeout(() => {
      if (!mountedRef.current || settled) return;
      setIsOffline(true);
      setData(null);
      setLoading(false);
      settled = true;
    }, 6000);

    return () => {
      mountedRef.current = false;
      if (unsub) unsub();
      clearTimeout(safety);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);

  return { data, loading, isOffline };
}

/**
 * `usePembayaranKelas` — subscribes to pembayaran for ALL siswa in a kelas
 * WITHOUT using collectionGroup (which requires special Firestore rules).
 * Instead, it first listens to the siswa collection, then for each siswa
 * subscribes to their pembayaran subcollection individually.
 * This guarantees checkboxes persist across refresh.
 */
export function usePembayaranKelas<T extends Record<string, any>>(
  sekolahId: string,
  jurusanId: string,
  kelasId: string
): { data: T[]; loading: boolean; isOffline: boolean } {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const mountedRef = useRef(true);
  const unsubsRef = useRef<Unsubscribe[]>([]);
  const dataRef = useRef<T[]>([]);

  useEffect(() => {
    if (!sekolahId || !jurusanId || !kelasId) {
      setLoading(false);
      return;
    }

    mountedRef.current = true;
    // Clean up all previous subscriptions
    unsubsRef.current.forEach(u => u());
    unsubsRef.current = [];
    dataRef.current = [];

    const siswaPath = `sekolah/${sekolahId}/jurusan/${jurusanId}/kelas/${kelasId}/siswa`;
    let settled = false;

    try {
      const siswaUnsub = onSnapshot(
        collection(db, siswaPath),
        (siswaSnap) => {
          if (!mountedRef.current) return;

          // Clean up old pembayaran subscriptions (keep siswa subscription)
          const oldUnsubs = unsubsRef.current.filter((_, i) => i > 0);
          oldUnsubs.forEach(u => u());
          unsubsRef.current = unsubsRef.current.slice(0, 1); // keep siswa unsub

          // Reset data and rebuild from all siswa
          const newAllData: T[] = [];
          let completedSubs = 0;
          const totalSiswa = siswaSnap.docs.length;

          if (totalSiswa === 0) {
            dataRef.current = [];
            setData([]);
            setLoading(false);
            settled = true;
            return;
          }

          siswaSnap.docs.forEach((siswaDoc) => {
            const payPath = `${siswaDoc.ref.path}/pembayaran`;
            try {
              const payUnsub = onSnapshot(
                collection(db, payPath),
                (paySnap) => {
                  if (!mountedRef.current) return;
                  const items = paySnap.docs.map((d) => ({
                    id: d.id,
                    ...d.data(),
                    _docPath: d.ref.path,
                  }) as unknown as T);

                  // Remove old items from this siswa, add new ones
                  const siswaId = siswaDoc.id;
                  const filtered = dataRef.current.filter(
                    (item: any) => !item._docPath || !item._docPath.includes(`/${siswaId}/pembayaran/`)
                  );
                  filtered.push(...items);
                  dataRef.current = filtered;
                  setData([...filtered]);

                  completedSubs++;
                  if (completedSubs >= totalSiswa && !settled) {
                    settled = true;
                    setLoading(false);
                    setIsOffline(false);
                  }
                },
                (err) => {
                  console.warn(`usePembayaranKelas: error on ${payPath}:`, err?.message || err);
                  completedSubs++;
                  if (completedSubs >= totalSiswa && !settled) {
                    settled = true;
                    setLoading(false);
                  }
                }
              );
              unsubsRef.current.push(payUnsub);
            } catch (err) {
              completedSubs++;
              if (completedSubs >= totalSiswa && !settled) {
                settled = true;
                setLoading(false);
              }
            }
          });
        },
        (err) => {
          console.warn('usePembayaranKelas: siswa listen error:', err?.message || err);
          if (!mountedRef.current || settled) return;
          setIsOffline(true);
          setData([]);
          setLoading(false);
          settled = true;
        }
      );
      unsubsRef.current = [siswaUnsub];
    } catch (err) {
      setIsOffline(true);
      setData([]);
      setLoading(false);
      settled = true;
    }

    // Safety timeout
    const safety = setTimeout(() => {
      if (!mountedRef.current || settled) return;
      settled = true;
      setLoading(false);
    }, 10000);

    return () => {
      mountedRef.current = false;
      unsubsRef.current.forEach(u => u());
      unsubsRef.current = [];
      clearTimeout(safety);
    };
  }, [sekolahId, jurusanId, kelasId]);

  return { data, loading, isOffline };
}
