import { useAuth as useAuthContext } from '../contexts/AuthContext';

/**
 * Custom hook to leverage AuthContext for user session state,
 * login, logout, and auth persistence.
 */
export function useAuth() {
  return useAuthContext();
}

export default useAuth;
