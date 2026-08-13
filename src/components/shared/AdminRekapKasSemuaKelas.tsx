import React, { useEffect, useState } from 'react';
import { collectionGroup, collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase/config';
import { Kelas, Siswa, Pembayaran, Pengeluaran } from '../../types';
import { formatRupiah } from '../../lib/utils/formatCurrency';
import { safeStr, safeLower } from '../../lib/utils/safeString';
import { KasMatrixTable } from '../tables/KasMatrixTable';
import { useSafeCollectionGroup } from '../../hooks/useSafeCollection';
import { Trophy, Medal, Search, Filter, Eye, ChevronRight, Sparkles, Building2, Layers, CheckCircle, Loader2 } from 'lucide-react';

interface AdminRekapKasSemuaKelasProps {
  sekolahId?: string;
  sekolahNama?: string;
}

export const AdminRekapKasSemuaKelas: React.FC<AdminRekapKasSemuaKelasProps> = ({
  sekolahId,
  sekolahNama,
}) => {
  // Use safe collection hooks with local fallback data
  const { data: kelasList, loading: loadingKelas } = useSafeCollectionGroup<Kelas & { _docPath?: string }>(
    'kelas',
    undefined,
    { sekolahId }
  );
  const { data: siswaList, loading: loadingSiswa } = useSafeCollectionGroup<Siswa & { _docPath?: string }>(
    'siswa',
    undefined,
    { sekolahId }
  );
  const { data: pembayaranList, loading: loadingPembayaran } = useSafeCollectionGroup<Pembayaran>(
    'pembayaran',
    undefined,
    { sekolahId }
  );
  const { data: pengeluaranList } = useSafeCollectionGroup<Pengeluaran>(
    'pengeluaran',
    undefined,
    { sekolahId }
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJurusan, setSelectedJurusan] = useState<string>('semua');
  const [selectedKelasDetail, setSelectedKelasDetail] = useState<Kelas | null>(null);

  // Dynamic jurusan list from Firestore
  const [jurusanOptions, setJurusanOptions] = useState<{ id: string; nama: string }[]>([]);

  useEffect(() => {
    if (!sekolahId) return;
    const unsub = onSnapshot(
      collection(db, `sekolah/${sekolahId}/jurusan`),
      (snap) => {
        setJurusanOptions(snap.docs.map((d) => ({ id: d.id, nama: d.data().nama || d.id })));
      },
      () => setJurusanOptions([])
    );
    return () => unsub();
  }, [sekolahId]);

  const isLoading = loadingKelas || loadingSiswa || loadingPembayaran;

  // Filter classes by sekolahId if specified (defensive — handles null/undefined)
  const effectiveKelasList = kelasList.filter((k) => {
    if (!sekolahId) return true;
    const path = safeStr((k as any)._docPath);
    const sid = safeStr((k as any).sekolahId);
    const target = safeLower(sekolahId);
    return sid.toLowerCase() === target || path.toLowerCase().includes(target);
  });

  // Compute class stats
  const classSummaries = effectiveKelasList.map((k) => {
    const classIdStr = safeLower(k.id);
    const classPayments = pembayaranList.filter(
      (p) => safeLower(p.kelasId) === classIdStr
    );
    const classStudents = siswaList.filter(
      (s) => safeLower(s.kelasId) === classIdStr
    );

    // Always compute from actual pembayaran docs — never use stale saldoSaatIni
    const totalKasFromPayments = classPayments
      .filter((p) => safeStr(p.status) === 'lunas')
      .reduce((acc, p) => acc + (p.nominal || 0), 0);
    const totalPengeluaranKelas = pengeluaranList
      .filter((p) => {
        const pKelasId = safeLower((p as any).kelasId || '');
        return pKelasId === classIdStr && (p.totalHarga || 0) > 0;
      })
      .reduce((acc, p) => acc + (p.totalHarga || 0), 0);
    const saldoKas = totalKasFromPayments - totalPengeluaranKelas;

    const totalTargetBulan = (classStudents.length || 1) * (k.nominalKasMingguan || 5000) * 4;
    const currentMonthPayments = classPayments.filter((p) => safeStr(p.status) === 'lunas').length * (k.nominalKasMingguan || 5000);
    const progressPct = totalTargetBulan > 0 ? Math.round((currentMonthPayments / totalTargetBulan) * 100) : 0;

    return {
      kelas: k,
      saldoKas,
      totalSiswa: classStudents.length,
      totalPaymentsCount: classPayments.length,
      progressPct,
    };
  });

  // Sort by Saldo Kas descending (Highest collected cash first!)
  classSummaries.sort((a, b) => b.saldoKas - a.saldoKas);

  // Filter by search & jurusan (defensive against null/undefined fields)
  const filteredSummaries = classSummaries.filter((item) => {
    const kNama = safeStr(item.kelas?.nama);
    const kId = safeStr(item.kelas?.id);
    const kWali = safeStr(item.kelas?.waliKelasNama);

    const q = safeLower(searchQuery);
    const matchesSearch =
      kNama.toLowerCase().includes(q) ||
      kId.toLowerCase().includes(q) ||
      kWali.toLowerCase().includes(q);

    const matchesJurusan =
      selectedJurusan === 'semua' ||
      safeLower(item.kelas?.jurusanId) === safeLower(selectedJurusan);

    return matchesSearch && matchesJurusan;
  });

  // Total school cash accumulated across all classes
  const totalSemuaKas = classSummaries.reduce((acc, item) => acc + item.saldoKas, 0);

  return (
    <div className="space-y-6">
      {/* Banner Rekap Multi-Kelas */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 border border-emerald-500/30 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
            <Trophy size={14} className="text-amber-400" />
            <span>Peringkat & Total Kas Seluruh Kelas</span>
          </div>
          <h2 className="text-2xl font-extrabold text-white font-heading mt-2">
            Rekapitukasi Kas Seluruh Kelas
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Pantau perbandingan total kas terkumpul, persentase kelunasan, dan keaktifan setoran kas mingguan di setiap kelas secara realtime.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950/80 border border-emerald-500/40 text-right space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            AKUMULASI SELURUH KELAS
          </span>
          <p className="text-2xl font-extrabold text-emerald-400 font-numeric">
            {formatRupiah(totalSemuaKas)}
          </p>
          <span className="text-[10px] text-emerald-500 font-semibold">
            {kelasList.length} Kelas Terkoneksi
          </span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter size={16} className="text-amber-400" />
          <select
            value={selectedJurusan}
            onChange={(e) => setSelectedJurusan(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-hidden focus:border-amber-500 cursor-pointer w-full sm:w-auto"
          >
            <option value="semua">Semua Jurusan</option>
            {jurusanOptions.map((j) => (
              <option key={j.id} value={j.id}>{j.nama}</option>
            ))}
          </select>
        </div>

        <div className="relative w-full sm:w-72">
          <Search size={14} className="absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Cari nama kelas / wali kelas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-500"
          />
        </div>
      </div>

      {/* Ranking Grid / Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full p-8 text-center bg-slate-900 border border-slate-800 rounded-3xl text-slate-400 text-xs flex items-center justify-center gap-2">
            <Loader2 size={16} className="animate-spin text-amber-400" />
            <span>Memuat data rekap kas seluruh kelas dari Firestore...</span>
          </div>
        ) : filteredSummaries.length === 0 ? (
          <div className="col-span-full p-8 text-center bg-slate-900 border border-slate-800 rounded-3xl text-slate-500 text-xs">
            Tidak ada data kelas yang sesuai pencarian.
          </div>
        ) : (
          filteredSummaries.map((item, idx) => {
            const rankNum = idx + 1;
            const isTop1 = rankNum === 1;
            const isTop2 = rankNum === 2;
            const isTop3 = rankNum === 3;

            return (
              <div
                key={item.kelas.id}
                className={`p-5 rounded-3xl border transition-all duration-200 relative overflow-hidden flex flex-col justify-between ${
                  isTop1
                    ? 'bg-gradient-to-b from-amber-950/30 via-slate-900 to-slate-900 border-amber-500/50 shadow-xl shadow-amber-500/5'
                    : isTop2
                    ? 'bg-gradient-to-b from-slate-800/40 via-slate-900 to-slate-900 border-slate-400/40'
                    : isTop3
                    ? 'bg-gradient-to-b from-amber-900/20 via-slate-900 to-slate-900 border-amber-700/30'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Top Badge */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                  <div className="flex items-center space-x-2">
                    {isTop1 ? (
                      <span className="px-2.5 py-1 rounded-xl bg-amber-500 text-slate-950 font-extrabold text-xs flex items-center gap-1 shadow-md shadow-amber-500/20">
                        <Trophy size={14} /> JUARA 1
                      </span>
                    ) : isTop2 ? (
                      <span className="px-2.5 py-1 rounded-xl bg-slate-300 text-slate-950 font-bold text-xs flex items-center gap-1">
                        <Medal size={14} /> JUARA 2
                      </span>
                    ) : isTop3 ? (
                      <span className="px-2.5 py-1 rounded-xl bg-amber-700 text-white font-bold text-xs flex items-center gap-1">
                        <Medal size={14} /> JUARA 3
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-400 text-xs font-bold font-numeric">
                        #{rankNum}
                      </span>
                    )}

                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      {safeStr(item.kelas.namaJurusan || item.kelas.jurusanNama || '').toUpperCase() || 'Jurusan'}
                    </span>
                  </div>

                  <span className="text-xs font-bold text-slate-300">
                    {item.totalSiswa} Siswa
                  </span>
                </div>

                {/* Class Info & Cash Amount */}
                <div className="space-y-3">
                  <div>
                    <h3 className="text-lg font-extrabold text-white font-heading">
                      {safeStr(item.kelas.nama) || 'Belum ada nama kelas'}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Wali: <strong className="text-slate-300">{safeStr(item.kelas.waliKelasNama) || 'Guru Wali'}</strong>
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">
                      TOTAL KAS TERKUMPUL
                    </span>
                    <p className="text-xl font-extrabold text-emerald-400 font-numeric">
                      {formatRupiah(item.saldoKas)}
                    </p>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between font-bold text-[11px]">
                      <span className="text-slate-400">Setoran Kas Bulan Ini</span>
                      <span className="text-amber-400">{item.progressPct}%</span>
                    </div>
                    <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="h-full bg-amber-500 transition-all duration-300"
                        style={{ width: `${Math.min(100, item.progressPct)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Button to view matrix detail */}
                <div className="pt-4 mt-3 border-t border-slate-800">
                  <button
                    onClick={() => setSelectedKelasDetail(item.kelas)}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer"
                  >
                    <Eye size={14} className="text-amber-400" />
                    <span>Cek Matriks Checkbox Kelas</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Detail Matriks Checkbox Kelas */}
      {selectedKelasDetail && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[11px] font-bold border border-amber-500/30 uppercase">
                  {safeStr(selectedKelasDetail.namaJurusan || selectedKelasDetail.jurusanNama || '').toUpperCase() || 'Jurusan'}
                </span>
                <h3 className="text-xl font-extrabold text-white font-heading mt-1">
                  Matriks Setoran Kas Kelas {safeStr(selectedKelasDetail.nama) || 'Kelas'}
                </h3>
                <p className="text-xs text-slate-400">
                  Wali Kelas: {safeStr(selectedKelasDetail.waliKelasNama) || 'Guru Wali'}
                </p>
              </div>

              <button
                onClick={() => setSelectedKelasDetail(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
              >
                Tutup
              </button>
            </div>

            <KasMatrixTable
              sekolahId={selectedKelasDetail.sekolahId || ''}
              jurusanId={selectedKelasDetail.jurusanId || ''}
              kelasId={safeStr(selectedKelasDetail.id)}
              kelasData={selectedKelasDetail}
              siswaList={siswaList.filter(
                (s) => safeLower(s.kelasId) === safeLower(selectedKelasDetail.id)
              )}
              pembayaranList={pembayaranList.filter(
                (p) => safeLower(p.kelasId) === safeLower(selectedKelasDetail.id)
              )}
              nominalKasMingguan={selectedKelasDetail.nominalKasMingguan || 5000}
              isEditable={true}
            />
          </div>
        </div>
      )}
    </div>
  );
};
