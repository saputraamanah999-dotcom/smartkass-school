export type StatusPembayaran = 'lunas' | 'dicicil' | 'belum' | 'telat' | 'menunggak';

export interface Pembayaran {
  id: string;
  sekolahId: string;
  jurusanId: string;
  kelasId: string;
  siswaId: string;
  siswaNama: string;
  siswaNoAbsen: number;
  nominal: number; // Jumlah yang dibayar
  tanggalBayar: string; // ISO date string
  mingguKe: number;
  tahunAjaran: string; // e.g. "2026/2027"
  bulan?: string; // e.g. "Agustus 2026" — untuk matriks checkbox per bulan
  status: StatusPembayaran;
  dicatatOlehUid: string;
  dicatatOlehNama: string;
  approvedByGuru?: boolean;
  keterangan?: string;
  createdAt: string;
  updatedAt?: string;
}
