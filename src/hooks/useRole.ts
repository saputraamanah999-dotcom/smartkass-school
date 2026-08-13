import { useAuth } from '../contexts/AuthContext';
import { Role } from '../types';

/**
 * Custom hook to manage Role-Based Access Control (RBAC)
 * and scope validation (sekolahId / kelasId)
 */
export function useRole() {
  const { user } = useAuth();

  const role: Role | null = user?.role || null;
  const isAdmin = role === 'admin';
  const isGuru = role === 'guru';
  const isBendahara = role === 'bendahara';

  const sekolahId = user?.sekolahId;
  const jurusanId = user?.jurusanId;
  const kelasId = user?.kelasId;

  /**
   * Check if user can access a specific school scope
   */
  const canAccessSekolah = (targetSekolahId: string): boolean => {
    if (isAdmin) return true;
    return sekolahId === targetSekolahId;
  };

  /**
   * Check if user can access a specific class scope
   */
  const canAccessKelas = (targetKelasId: string): boolean => {
    if (isAdmin) return true;
    return kelasId === targetKelasId;
  };

  /**
   * Check if current user has any of the allowed roles
   */
  const hasRole = (allowedRoles: Role[]): boolean => {
    if (!role) return false;
    return allowedRoles.includes(role);
  };

  return {
    user,
    role,
    isAdmin,
    isGuru,
    isBendahara,
    sekolahId,
    jurusanId,
    kelasId,
    canAccessSekolah,
    canAccessKelas,
    hasRole,
  };
}

export default useRole;
