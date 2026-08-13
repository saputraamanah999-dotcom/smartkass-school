import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { safeStr, safeLower } from '../lib/utils/safeString';

interface HasSekolahId {
  sekolahId?: string;
  _docPath?: string;
}

/**
 * Custom hook `useMultiTenancy` to enforce multi-tenant isolation and 
 * automatically scope Firestore data and user management by active `sekolahId`.
 *
 * All comparisons use safe string coercion so that null/undefined fields
 * (common while Firestore data is still loading) never throw.
 */
export function useMultiTenancy(overrideSekolahId?: string) {
  const { user } = useAuth();

  const activeSekolahId = useMemo(() => {
    return overrideSekolahId || user?.sekolahId || '';
  }, [overrideSekolahId, user?.sekolahId]);

  /**
   * Filter array items strictly matching activeSekolahId.
   */
  const filterBySekolah = <T extends HasSekolahId>(items: T[]): T[] => {
    if (!activeSekolahId) return items;
    const target = safeLower(activeSekolahId);
    return items.filter((item) => {
      const sid = safeStr(item.sekolahId);
      if (sid) {
        return sid.toLowerCase() === target;
      }
      const path = safeStr(item._docPath);
      if (path) {
        return path.toLowerCase().includes(target);
      }
      return true;
    });
  };

  /**
   * Binds data object with the active sekolahId before persisting to Firestore.
   */
  const bindSekolahId = <T extends Record<string, any>>(data: T): T & { sekolahId: string } => {
    return {
      ...data,
      sekolahId: activeSekolahId,
    };
  };

  return {
    activeSekolahId,
    filterBySekolah,
    bindSekolahId,
  };
}
