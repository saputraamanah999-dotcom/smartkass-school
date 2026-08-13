export interface Pengeluaran {
  id: string;
  sekolahId: string;
  jurusanId: string;
  kelasId: string;
  namaBarang: string;
  harga: number;
  jumlah: number;
  potonganHarga?: number;
  totalHarga: number;
  kategori: string;
  tanggal: string;
  fotoUrl?: string;
  buktiUrl?: string;
  dicatatOlehUid: string;
  dicatatOlehNama: string;
  keterangan?: string;
  createdAt: string;
}
