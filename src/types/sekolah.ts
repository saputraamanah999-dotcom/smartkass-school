export interface Sekolah {
  id: string;
  nama: string;
  alamat?: string;
  logoUrl?: string;
  createdAt: string;
}

export interface Jurusan {
  id: string;
  sekolahId: string;
  nama: string; // e.g. TJKT, RPL, AKL
  createdAt: string;
}

export interface TargetKas {
  tujuan: string;
  nominalTarget: number;
  deadline?: string;
  keterangan?: string;
}

export interface Kelas {
  id: string;
  sekolahId: string;
  jurusanId: string;
  nama: string; // e.g. "XI TJKT 1"
  waliKelasUid?: string;
  waliKelasNama?: string;
  bendaharaUid?: string;
  bendaharaNama?: string;
  nominalKasMingguan: number; // default 5000, editable by bendahara
  keteranganNominalKas?: string; // optional note explaining the peraturan
  frekuensiKas?: 'harian' | 'mingguan' | '2x-per-2minggu'; // default 'mingguan', bisa diatur per kelas
  targetKas?: TargetKas;
  saldoSaatIni: number;
  createdAt: string;
  updatedAt?: string;
}
