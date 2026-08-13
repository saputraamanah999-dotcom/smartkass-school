import React, { useMemo, useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase/config';
import { Pembayaran } from '../../../types';
import { useAuth } from '../../../contexts/AuthContext';
import { formatRupiah } from '../../../lib/utils/formatCurrency';
import { formatDate } from '../../../lib/utils/formatDate';
import { CheckCircle2, ShieldCheck, Clock, CheckCheck, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { usePembayaranKelas } from '../../../hooks/useSafeCollection';


export const GuruApprovePembayaran: React.FC = () => {
  const { user } = useAuth();
  const jurusanId = user?.jurusanId || '';
  const kelasId = user?.kelasId || '';
  const sekolahId = user?.sekolahId || '';

  // === Direct Firestore hooks (no collectionGroup — works with standard rules) ===
  const { data: pembayaranRaw } = usePembayaranKelas<Pembayaran & { _docPath?: string }>(
    sekolahId, jurusanId, kelasId
  );

  // Newest-first sort
  const pembayaranList = useMemo(() => {
    return [...pembayaranRaw].sort((a, b) => {
      const da = new Date(a.createdAt || a.tanggalBayar || 0).getTime();
      const dbDate = new Date(b.createdAt || b.tanggalBayar || 0).getTime();
      return dbDate - da;
    });
  }, [pembayaranRaw]);

  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [isBulkApproving, setIsBulkApproving] = useState(false);

  const handleApprove = async (item: Pembayaran & { _docPath?: string }) => {
    setLoadingId(item.id);
    const nowIso = new Date().toISOString();
    try {
      if (item._docPath) {
        await updateDoc(doc(db, item._docPath), { approvedByGuru: true, updatedAt: nowIso });
      } else {
        await updateDoc(
          doc(db, `sekolah/${sekolahId}/jurusan/${jurusanId}/kelas/${kelasId}/siswa/${item.siswaId}/pembayaran`, item.id),
          { approvedByGuru: true, updatedAt: nowIso }
        );
      }
      toast.success(`Pembayaran ${item.siswaNama} terverifikasi!`);
    } catch (e: any) {
      console.error('Error approving payment:', e);
      toast.error('Gagal memverifikasi pembayaran.');
    } finally {
      setLoadingId(null);
    }
  };

  const pendingList = pembayaranList.filter((p) => !p.approvedByGuru);
  const approvedList = pembayaranList.filter((p) => p.approvedByGuru);

  const handleApproveAll = async () => {
    if (pendingList.length === 0) return;
    setIsBulkApproving(true);
    const nowIso = new Date().toISOString();
    try {
      await Promise.all(
        pendingList.map((item) => {
          const path = (item as any)._docPath || `sekolah/${sekolahId}/jurusan/${jurusanId}/kelas/${kelasId}/siswa/${item.siswaId}/pembayaran/${item.id}`;
          return updateDoc(doc(db, path), { approvedByGuru: true, updatedAt: nowIso });
        })
      );
      toast.success(`Semua (${pendingList.length}) pembayaran berhasil disetujui!`);
    } catch (e: any) {
      console.error('Error approving all:', e);
      toast.error('Gagal menyetujui semua pembayaran.');
    } finally {
      setIsBulkApproving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-900/80 via-slate-900 to-indigo-950/80 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div>
          <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-700 dark:text-purple-300 text-xs font-semibold border border-purple-500/30">
            Wali Kelas: {kelasId.toUpperCase()} ({jurusanId.toUpperCase()})
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white font-heading mt-2">
            Persetujuan Setoran Kas Siswa
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
            Validasi dan beri persetujuan digital untuk setiap transaksi setoran kas yang diinput oleh Bendahara Kelas.
          </p>
        </div>

        {pendingList.length > 0 && (
          <button
            onClick={handleApproveAll}
            disabled={isBulkApproving}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center space-x-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50 flex-shrink-0"
          >
            <CheckCheck size={16} />
            <span>{isBulkApproving ? 'Menyetujui Semua...' : `Setujui Semua (${pendingList.length} Pending)`}</span>
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-700 dark:text-amber-300">Menunggu Persetujuan</p>
              <p className="text-lg font-extrabold text-amber-800 dark:text-amber-200 font-numeric">{pendingList.length} Transaksi</p>
            </div>
          </div>
          <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/20 px-2.5 py-1 rounded-full">Perlu Aksi</span>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">Sudah Terverifikasi Guru</p>
              <p className="text-lg font-extrabold text-emerald-800 dark:text-emerald-200 font-numeric">{approvedList.length} Transaksi</p>
            </div>
          </div>
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/20 px-2.5 py-1 rounded-full">Aman & Sah</span>
        </div>
      </div>

      {/* Table */}
      <div className="w-full overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/80 backdrop-blur-md shadow-sm">
        <table className="w-full text-xs text-left text-slate-700 dark:text-slate-300">
          <thead className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-950/80 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="px-4 py-3.5 font-bold">Tanggal</th>
              <th className="px-4 py-3.5 font-bold">Siswa</th>
              <th className="px-4 py-3.5 font-bold">Nominal</th>
              <th className="px-4 py-3.5 font-bold">Minggu Ke-</th>
              <th className="px-4 py-3.5 font-bold">Status Verifikasi</th>
              <th className="px-4 py-3.5 font-bold text-right">Aksi Wali Kelas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
            {pembayaranList.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  Belum ada data setoran kas untuk diverifikasi.
                </td>
              </tr>
            ) : (
              pembayaranList.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400 font-numeric whitespace-nowrap">
                    {formatDate(p.tanggalBayar || p.createdAt)}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold mr-1">#{p.siswaNoAbsen}</span>
                    {p.siswaNama}
                  </td>
                  <td className="px-4 py-3 font-extrabold text-emerald-600 dark:text-emerald-400 font-numeric whitespace-nowrap">
                    + {formatRupiah(p.nominal)}
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300 font-numeric whitespace-nowrap">
                    Minggu {p.mingguKe}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {p.approvedByGuru ? (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                        <ShieldCheck size={12} />
                        <span>Terverifikasi Guru</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                        <Clock size={12} className="animate-pulse" />
                        <span>Menunggu Verifikasi</span>
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {!p.approvedByGuru ? (
                      <button
                        onClick={() => handleApprove(p as any)}
                        disabled={loadingId === p.id}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold flex items-center space-x-1.5 ml-auto cursor-pointer shadow-sm transition-all disabled:opacity-50"
                      >
                        <CheckCircle2 size={13} />
                        <span>{loadingId === p.id ? 'Memproses...' : 'Setujui Kas'}</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium inline-flex items-center gap-1">
                        <Sparkles size={12} /> Disetujui
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

