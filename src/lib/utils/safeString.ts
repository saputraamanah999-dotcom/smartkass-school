/**
 * Safe string coercion utilities.
 *
 * These prevent `TypeError: Cannot read properties of null/undefined
 * (reading 'toLowerCase')` when Firestore data is still loading or partially
 * populated. Use `safeStr` / `safeLower` anywhere a string field from
 * Firestore is accessed via `.toLowerCase()`, `.toUpperCase()`, `.includes()`,
 * etc.
 */

export const safeStr = (val: unknown): string => {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val;
  try {
    return String(val);
  } catch {
    return '';
  }
};

export const safeLower = (val: unknown): string => safeStr(val).toLowerCase();

export const safeUpper = (val: unknown): string => safeStr(val).toUpperCase();

/**
 * Check whether a haystack value contains a needle (case-insensitive).
 * Null/undefined haystack returns false.
 */
export const safeIncludes = (haystack: unknown, needle: unknown): boolean => {
  const h = safeLower(haystack);
  const n = safeLower(needle);
  if (!n) return true; // empty needle matches everything (search behaviour)
  return h.includes(n);
};
