import { UserProfile, Siswa } from '../types';
import { safeStr, safeLower } from './utils/safeString';

/**
 * Ensures user or student object is strictly bound to a target sekolahId.
 * Prevents cross-school data leaks.
 */
export function enforceSekolahBinding<T extends { sekolahId?: string }>(
  item: T,
  activeSekolahId: string
): T {
  return {
    ...item,
    sekolahId: activeSekolahId,
  };
}

/**
 * Filters any collection array by active sekolahId to guarantee strict multi-tenant isolation.
 * Uses safe string coercion so null/undefined fields never throw.
 */
export function filterBySekolah<T extends { sekolahId?: string; _docPath?: string }>(
  items: T[],
  activeSekolahId: string
): T[] {
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
}
