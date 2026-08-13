export * from './user';
export * from './sekolah';
export * from './siswa';
export * from './pembayaran';
export * from './pengeluaran';

export interface DashboardStats {
  totalSaldo: number;
  totalPemasukan: number;
  totalPengeluaran: number;
  totalSiswa: number;
  siswaLunasCount: number;
  siswaDicicilCount: number;
  siswaBelumCount: number;
  siswaMenunggakCount: number;
  persentaseLunas: number;
  targetProgressPercent: number;
}

