export type Role = 'admin' | 'guru' | 'bendahara';

export interface UserProfile {
  uid: string;
  nama: string;
  email: string;
  role: Role;
  sekolahId?: string;
  jurusanId?: string;
  kelasId?: string;
  fotoUrl?: string;
  createdAt: string; // ISO string
}

export interface TampilanConfig {
  logoUrl: string;
  splashBackgroundUrl: string;
  splashVideoUrl: string;
  splashDuration?: number; // Loading delay duration in seconds
  bannerUrl: string;
  tagline: string;
  tema?: 'dark' | 'light' | 'system';
  updatedAt: string;
  updatedByUid?: string;
}

export interface AuditLog {
  id: string;
  uid: string;
  userNama: string;
  userRole: Role;
  aksi: string;
  targetId?: string;
  timestamp: string;
  detail?: string;
}
