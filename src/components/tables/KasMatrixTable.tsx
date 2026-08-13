import React, { useState, useMemo } from 'react';
import { doc, setDoc, deleteDoc, runTransaction } from 'firebase/firestore';
import { db } from '../../lib/firebase/config';
import { Siswa, Pembayaran, Kelas } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { formatRupiah } from '../../lib/utils/formatCurrency';
import { safeStr, safeLower } from '../../lib/utils/safeString';
import { CheckCircle2, AlertCircle, UserPlus, Trash2, Calendar, CheckSquare, Square, Search } from 'lucide-react';
import toast from 'react-hot-toast';

interface KasMatrixTableProps {
  sekolahId?: string;
  jurusanId: string;
  kelasId: string;
  kelasData?: Kelas | null;
  siswaList: Siswa[];
  pembayaranList: Pembayaran[];
  nominalKasMingguan?: number;
  isEditable?: boolean;
}

/** Generate 12 months: January to December of the given year */
function generateBulanOptions(year: number): string[] {
  const namaBulan = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];
  return namaBulan.map((b) => `${b} ${year}`);
}

export const KasMatrixTable: React.FC<KasMatrixTableProps> = ({
  sekolahId = '',
  jurusanId,
  kelasId,
  kelasData,
  siswaList,
  pembayaranList,
  nominalKasMingguan = 5000,
  isEditable = true,
}) => {
  const { user } = useAuth();

  // Dynamic year based on current date
  const currentYear = new Date().getFullYear();
  const BULAN_OPTIONS = useMemo(() => generateBulanOptions(currentYear), [currentYear]);

  // Default to current month
  const currentMonthName = new Date().toLocaleString('id-ID', { month: 'long' });
  const defaultBulan = `${currentMonthName} ${currentYear}`;
  const [selectedBulan, setSelectedBulan] = useState(() => {
    // Find matching option (capitalize first letter)
    const found = BULAN_OPTIONS.find(
      (b) => b.toLowerCase() === defaultBulan.toLowerCase()
    );
    return found || BULAN_OPTIONS[0];
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [optimisticState, setOptimisticState] = useState<Record<string, boolean>>({});
  const [newNama, setNewNama] = useState('');
  const [newNoAbsen, setNewNoAbsen] = useState<number | ''>('');
  const [isAddingSiswa, setIsAddingSiswa] = useState(false);

  const bulanSlug = selectedBulan.toLowerCase().replace(/\s+/g, '-');

  const showToastSuccess = (msg: string) => {
    toast.custom((t: any) => (
      <div
        className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md bg-slate-900 border border-emerald-500/50 shadow-2xl rounded-2xl px-4 py-3 flex items-center space-x-3 text-xs text-white`}
      >
        <div className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
          <CheckCircle2 size={18} />
        </div>
        <span className="font-semibold text-slate-100">{msg}</span>
      </div>
    ));
  };

  const showToastWarning = (msg: string) => {
    toast.custom((t: any) => (
      <div
        className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md bg-slate-900 border border-amber-500/50 shadow-2xl rounded-2xl px-4 py-3 flex items-center space-x-3 text-xs text-white`}
      >
        <div className="p-1.5 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
          <AlertCircle size={18} />
        </div>
        <span className="font-semibold text-slate-100">{msg}</span>
      </div>
    ));
  };

  const filteredSiswa = siswaList
    .filter(
      (s) =>
        safeLower(s.nama).includes(safeLower(searchQuery)) ||
        safeStr(s.noAbsen).includes(safeStr(searchQuery))
    )
    .sort((a, b) => (a.noAbsen || 0) - (b.noAbsen || 0));

  const handleAddSiswa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNama.trim() || !sekolahId) {
      toast.error('Masukkan nama siswa.');
      return;
    }
    const noAbsenVal = newNoAbsen === '' ? siswaList.length + 1 : Number(newNoAbsen);
    const siswaId = `s-${Date.now()}`;

    setIsAddingSiswa(true);
    try {
      await setDoc(
        doc(db, `sekolah/${sekolahId}/jurusan/${jurusanId}/kelas/${kelasId}/siswa`, siswaId),
        {
          id: siswaId,
          sekolahId,
          jurusanId,
          kelasId,
          nama: newNama.trim(),
          noAbsen: noAbsenVal,
          status: 'aktif',
          createdAt: new Date().toISOString(),
        }
      );
      showToastSuccess(`Siswa ${newNama.trim()} (Absen ${noAbsenVal}) berhasil ditambahkan!`);
      setNewNama('');
      setNewNoAbsen('');
    } catch (err) {
      console.error('Error adding siswa:', err);
      toast.error('Gagal menambahkan siswa.');
    } finally {
      setIsAddingSiswa(false);
    }
  };

  const handleDeleteSiswa = async (s: Siswa) => {
    if (!window.confirm(`Hapus siswa ${s.nama} (Absen ${s.noAbsen}) dari kelas ini?`)) return;
    if (!sekolahId) return;
    try {
      await deleteDoc(
        doc(db, `sekolah/${sekolahId}/jurusan/${jurusanId}/kelas/${kelasId}/siswa`, s.id)
      );
      showToastSuccess(`Siswa ${s.nama} berhasil dihapus.`);
    } catch (err) {
      console.error('Error deleting siswa:', err);
      toast.error('Gagal menghapus siswa.');
    }
  };

  /** Check if a student has paid for a specific week in the selected month */
  const isPaid = (siswaId: string, mingguNum: number) => {
    const key = `${siswaId}_m${mingguNum}_${selectedBulan}`;
    if (optimisticState[key] !== undefined) {
      return optimisticState[key];
    }

    return pembayaranList.some((p) => {
      if (p.siswaId !== siswaId) return false;
      if (p.status !== 'lunas') return false;
      if (p.mingguKe !== mingguNum) return false;
      // Must match the selected month exactly via the `bulan` field
      if ((p as any).bulan === selectedBulan) return true;
      return false;
    });
  };

  const handleTogglePayment = async (siswa: Siswa, mingguNum: number) => {
    if (!isEditable || !sekolahId || !jurusanId || !kelasId) {
      toast.error('Data kelas belum tersedia. Tunggu data Firestore selesai dimuat.');
      return;
    }

    const key = `${siswa.id}_m${mingguNum}_${selectedBulan}`;
    const currentlyPaid = isPaid(siswa.id, mingguNum);
    const nextPaid = !currentlyPaid;

    setOptimisticState((prev) => ({ ...prev, [key]: nextPaid }));

    const payDocId = `p-${siswa.id}-${bulanSlug}-m${mingguNum}`;
    const payPath = `sekolah/${sekolahId}/jurusan/${jurusanId}/kelas/${kelasId}/siswa/${siswa.id}/pembayaran/${payDocId}`;
    const nowIso = new Date().toISOString();

    try {
      if (currentlyPaid) {
        await deleteDoc(doc(db, payPath));

        // Update saldoSaatIni via transaction (mencegah race condition)
        try {
          await runTransaction(db, async (tx) => {
            const kelasRef = doc(db, `sekolah/${sekolahId}/jurusan/${jurusanId}/kelas/${kelasId}`);
            const kelasSnap = await tx.get(kelasRef);
            const currentSaldo = kelasSnap.exists() ? (kelasSnap.data().saldoSaatIni || 0) : 0;
            tx.update(kelasRef, { saldoSaatIni: Math.max(0, currentSaldo - nominalKasMingguan), updatedAt: nowIso });
          });
        } catch (txErr) {
          console.warn('Transaction saldoSaatIni failed (non-critical):', txErr);
        }

        showToastWarning(`Setoran ${siswa.nama} (Minggu ${mingguNum} - ${selectedBulan}) dibatalkan.`);
      } else {
        const newPayData: Pembayaran & { bulan?: string; updatedAt?: string } = {
          id: payDocId,
          sekolahId,
          jurusanId,
          kelasId,
          siswaId: siswa.id,
          siswaNama: siswa.nama,
          siswaNoAbsen: siswa.noAbsen,
          nominal: nominalKasMingguan,
          tanggalBayar: nowIso,
          mingguKe: mingguNum,
          bulan: selectedBulan,
          tahunAjaran: `${currentYear}/${currentYear + 1}`,
          status: 'lunas',
          approvedByGuru: true,
          dicatatOlehUid: user?.uid || 'bendahara',
          dicatatOlehNama: user?.nama || 'Bendahara Kelas',
          keterangan: `Kas Mingguan (Minggu ${mingguNum} - ${selectedBulan})`,
          createdAt: nowIso,
          updatedAt: nowIso,
        };

        await setDoc(doc(db, payPath), newPayData);

        // Update saldoSaatIni via transaction (mencegah race condition saat centang cepat)
        try {
          await runTransaction(db, async (tx) => {
            const kelasRef = doc(db, `sekolah/${sekolahId}/jurusan/${jurusanId}/kelas/${kelasId}`);
            const kelasSnap = await tx.get(kelasRef);
            const currentSaldo = kelasSnap.exists() ? (kelasSnap.data().saldoSaatIni || 0) : 0;
            tx.update(kelasRef, { saldoSaatIni: currentSaldo + nominalKasMingguan, updatedAt: nowIso });
          });
        } catch (txErr) {
          console.warn('Transaction saldoSaatIni failed (non-critical):', txErr);
        }

        showToastSuccess(
          `${siswa.nama} - Minggu ${mingguNum} (${selectedBulan}) Rp ${nominalKasMingguan.toLocaleString('id-ID')} LUNAS`
        );
      }
    } catch (err) {
      console.error('Error toggling payment:', err);
      setOptimisticState((prev) => ({ ...prev, [key]: currentlyPaid }));
      toast.error('Gagal memperbarui status pembayaran.');
    }
  };

  // Frequency-aware column headers
  const frekuensi = kelasData?.frekuensiKas || 'mingguan';
  const columnHeaders = useMemo(() => {
    if (frekuensi === '2x-per-2minggu') {
      return [
        { label: 'Mg 1-2', sub: 'Periode 1' },
        { label: 'Mg 1-2', sub: 'Periode 1' },
        { label: 'Mg 3-4', sub: 'Periode 2' },
        { label: 'Mg 3-4', sub: 'Periode 2' },
      ];
    }
    if (frekuensi === 'harian') {
      return [
        { label: 'Minggu 1', sub: '~5 Hari' },
        { label: 'Minggu 2', sub: '~5 Hari' },
        { label: 'Minggu 3', sub: '~5 Hari' },
        { label: 'Minggu 4', sub: '~5 Hari' },
      ];
    }
    // default: mingguan
    return [
      { label: 'Minggu 1', sub: '' },
      { label: 'Minggu 2', sub: '' },
      { label: 'Minggu 3', sub: '' },
      { label: 'Minggu 4', sub: '' },
    ];
  }, [frekuensi]);

  const frekuensiLabel = frekuensi === '2x-per-2minggu'
    ? '2x Per 2 Minggu — centang Mg 1+2 untuk Periode 1, Mg 3+4 untuk Periode 2'
    : frekuensi === 'harian'
    ? 'Harian — 1 minggu = ~5 hari sekolah'
    : '';

  const totalWajibPerSiswa = nominalKasMingguan * 4;
  const targetKasBulanIni = siswaList.length * totalWajibPerSiswa;

  const totalTerkumpulBulanIni = siswaList.reduce((accSiswa, s) => {
    let count = 0;
    for (let m = 1; m <= 4; m++) {
      if (isPaid(s.id, m)) count++;
    }
    return accSiswa + count * nominalKasMingguan;
  }, 0);

  const persentaseTotalBulan =
    targetKasBulanIni > 0 ? Math.round((totalTerkumpulBulanIni / targetKasBulanIni) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-5 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Calendar size={20} />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                PILIH BULAN SETORAN KAS
              </label>
              <select
                value={selectedBulan}
                onChange={(e) => setSelectedBulan(e.target.value)}
                className="mt-1 px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-amber-400 font-bold text-sm focus:outline-hidden focus:border-amber-500 cursor-pointer"
              >
                {BULAN_OPTIONS.map((b) => (
                  <option key={b} value={b} className="bg-slate-900 text-amber-400">
                    {b}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="px-4 py-2 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
              <span className="text-slate-400">Kas Terkumpul ({selectedBulan}): </span>
              <strong className="text-emerald-400 font-numeric font-bold text-sm ml-1">
                {formatRupiah(totalTerkumpulBulanIni)}
              </strong>
            </div>

            <div className="px-4 py-2 rounded-2xl bg-slate-950 border border-slate-800 text-xs flex items-center space-x-2">
              <span className="text-slate-400">Progress Kelunasan: </span>
              <span
                className={`px-2 py-0.5 rounded-full font-bold text-xs ${
                  persentaseTotalBulan >= 80
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : persentaseTotalBulan >= 50
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                }`}
              >
                {persentaseTotalBulan}%
              </span>
            </div>
          </div>
        </div>

        {isEditable && (
          <div className="pt-4 border-t border-slate-800 space-y-4">
            <form
              onSubmit={handleAddSiswa}
              className="w-full bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 flex items-center space-x-1.5">
                  <UserPlus size={15} />
                  <span>Tambah Nama Siswa Ke Kelas</span>
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2.5">
                <input
                  type="text"
                  required
                  placeholder="Nama Lengkap Siswa..."
                  value={newNama}
                  onChange={(e) => setNewNama(e.target.value)}
                  className="w-full sm:flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-400 focus:outline-hidden focus:border-amber-500 font-medium"
                />
                <input
                  type="number"
                  placeholder="No Absen"
                  value={newNoAbsen}
                  onChange={(e) => setNewNoAbsen(e.target.value ? Number(e.target.value) : '')}
                  className="w-full sm:w-28 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-amber-400 placeholder-slate-400 text-center font-bold focus:outline-hidden focus:border-amber-500"
                />
                <button
                  type="submit"
                  disabled={isAddingSiswa}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold flex items-center justify-center space-x-1.5 shadow-md shadow-amber-500/20 cursor-pointer disabled:opacity-50 transition-all shrink-0"
                >
                  <UserPlus size={16} />
                  <span>+ Simpan Siswa</span>
                </button>
              </div>
            </form>

            <div className="relative w-full">
              <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama siswa atau no absen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-400 focus:outline-hidden focus:border-amber-500"
              />
            </div>
          </div>
        )}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950 text-slate-300 border-b border-slate-800 text-xs font-bold font-heading">
                <th className="py-3.5 px-4 w-12 text-center border-r border-slate-800">No</th>
                <th className="py-3.5 px-4 min-w-[180px] border-r border-slate-800">Nama Siswa</th>
                {columnHeaders.map((col, i) => (
                  <th key={i} className="py-3.5 px-3 text-center w-24 border-r border-slate-800 bg-amber-500/5">
                    {col.label}
                    <span className="block text-[10px] text-amber-400/80 font-normal">
                      {col.sub || formatRupiah(nominalKasMingguan)}
                    </span>
                  </th>
                ))}
                <th className="py-3.5 px-4 text-center min-w-[110px] border-r border-slate-800">
                  Total Bayar
                </th>
                <th className="py-3.5 px-4 text-center min-w-[140px] border-r border-slate-800">
                  Progress
                </th>
                {isEditable && <th className="py-3.5 px-3 text-center w-12">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs text-slate-200 font-sans">
              {filteredSiswa.length === 0 ? (
                <tr>
                  <td
                    colSpan={isEditable ? 9 : 8}
                    className="py-8 text-center text-slate-400 font-medium text-sm"
                  >
                    Belum ada siswa terdaftar di kelas ini. Masukkan nama siswa di form atas!
                  </td>
                </tr>
              ) : (
                filteredSiswa.map((siswa) => {
                  const m1 = isPaid(siswa.id, 1);
                  const m2 = isPaid(siswa.id, 2);
                  const m3 = isPaid(siswa.id, 3);
                  const m4 = isPaid(siswa.id, 4);

                  const countPaid = (m1 ? 1 : 0) + (m2 ? 1 : 0) + (m3 ? 1 : 0) + (m4 ? 1 : 0);
                  const totalPaidRupiah = countPaid * nominalKasMingguan;
                  const progressPct = Math.round((countPaid / 4) * 100);
                  const isFullLunas = progressPct === 100;

                  return (
                    <tr
                      key={siswa.id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isFullLunas ? 'bg-emerald-950/15' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 text-center font-bold text-slate-300 border-r border-slate-800 text-sm">
                        {siswa.noAbsen}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-white border-r border-slate-800 text-sm">
                        <div className="flex items-center justify-between">
                          <span>{siswa.nama}</span>
                          {isFullLunas && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold ml-2 whitespace-nowrap">
                              LUNAS
                            </span>
                          )}
                        </div>
                      </td>

                      {[1, 2, 3, 4].map((mNum) => {
                        const paid = isPaid(siswa.id, mNum);

                        return (
                          <td
                            key={mNum}
                            className={`py-3 px-3 text-center border-r border-slate-800 transition-all ${
                              paid ? 'bg-emerald-500/10' : ''
                            }`}
                          >
                            <button
                              type="button"
                              disabled={!isEditable}
                              onClick={() => handleTogglePayment(siswa, mNum)}
                              className={`p-2 rounded-xl inline-flex items-center justify-center transition-all cursor-pointer ${
                                paid
                                  ? 'bg-emerald-500 text-slate-950 font-extrabold hover:bg-emerald-400 shadow-md shadow-emerald-500/30 scale-105'
                                  : 'bg-slate-950 border border-slate-700 text-slate-500 hover:border-amber-500 hover:text-amber-400'
                              } disabled:opacity-50`}
                              title={`Klik untuk ${paid ? 'membatalkan' : 'menandai lunas'} Minggu ${mNum}`}
                            >
                              {paid ? <CheckSquare size={20} /> : <Square size={20} />}
                            </button>
                          </td>
                        );
                      })}

                      <td className="py-3.5 px-4 text-center font-bold text-emerald-400 font-numeric border-r border-slate-800 text-sm">
                        {formatRupiah(totalPaidRupiah)}
                      </td>

                      <td className="py-3.5 px-4 border-r border-slate-800">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-bold">
                            <span
                              className={
                                isFullLunas
                                  ? 'text-emerald-400'
                                  : progressPct >= 50
                                  ? 'text-amber-400'
                                  : 'text-rose-400'
                              }
                            >
                              {progressPct}% ({countPaid}/4 M)
                            </span>
                          </div>
                          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                            <div
                              className={`h-full transition-all duration-300 ${
                                isFullLunas
                                  ? 'bg-emerald-500'
                                  : progressPct >= 50
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                              }`}
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {isEditable && (
                        <td className="py-3.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteSiswa(siswa)}
                            className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Hapus Siswa"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <CheckCircle2 size={14} className="text-emerald-400" />
            <span>
              Tandai checkbox untuk mencatat setoran Rp {nominalKasMingguan.toLocaleString('id-ID')} / {frekuensi === 'harian' ? 'minggu (~5 hari)' : frekuensi === '2x-per-2minggu' ? 'periode' : 'minggu'}.
            </span>
          </div>
          <div className="flex items-center gap-3">
            {frekuensiLabel && (
              <span className="text-[10px] text-emerald-400/80 font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                {frekuensiLabel}
              </span>
            )}
            <span className="text-[11px] text-slate-500 font-semibold">
              Tahun {currentYear} — 12 Bulan (Januari s.d. Desember)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
