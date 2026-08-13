export type StatusSiswa = 'aktif' | 'pindah' | 'lulus' | 'keluar';

export interface Siswa {
  id: string;
  sekolahId: string;
  jurusanId: string;
  kelasId: string;
  nama: string;
  noAbsen: number;
  nisn?: string;
  fotoUrl?: string;
  status: StatusSiswa;
  createdAt: string;
}
