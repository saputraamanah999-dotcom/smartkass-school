import React, { useMemo } from 'react';
import { Pembayaran } from '../../../types';
import { exportToExcel } from '../../../lib/utils/exportExcel';
import { exportToPDF } from '../../../lib/utils/exportPDF';
import { PembayaranTable } from '../../tables/PembayaranTable';
import { AdminRekapKasSemuaKelas } from '../../shared/AdminRekapKasSemuaKelas';
import { FileSpreadsheet, Printer } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useSafeCollectionGroup } from '../../../hooks/useSafeCollection';
import { ShimmerSkeleton } from '../../shared/ShimmerSkeleton';

export const AdminLaporan: React.FC = () => {
  const { user } = useAuth();

  // Use the safe collection-group hook so the page renders rich local demo
  // data when Firestore is locked down (permission-denied).
  const { data, loading } = useSafeCollectionGroup<Pembayaran>(
    'pembayaran',
    undefined);

  // Apply the existing sort logic (newest first) to the hook's data.
  const pembayaranList = useMemo(() => {
    const list = [...data];
    list.sort(
      (a, b) =>
        new Date(b.createdAt || b.tanggalBayar).getTime() -
        new Date(a.createdAt || a.tanggalBayar).getTime()
    );
    return list;
  }, [data]);

  const handleExportExcel = () => {
    const formatted = pembayaranList.map((p, idx) => ({
      No: idx + 1,
      Tanggal: p.tanggalBayar || p.createdAt,
      Siswa: p.siswaNama,
      MingguKe: p.mingguKe,
      Nominal: p.nominal,
      Status: p.status,
      DicatatOleh: p.dicatatOlehNama,
    }));
    exportToExcel(formatted, 'Laporan_Kas_Admin_SMKTI');
  };

  const handleExportPDF = () => {
    const headers = ['No', 'Tanggal', 'Siswa', 'Minggu', 'Nominal (Rp)', 'Status', 'Pencatat'];
    const rows = pembayaranList.map((p, idx) => [
      idx + 1,
      p.tanggalBayar?.slice(0, 10) || '',
      p.siswaNama,
      p.mingguKe,
      (p.nominal || 0).toLocaleString('id-ID'),
      (p.status || 'belum').toUpperCase(),
      p.dicatatOlehNama || 'Bendahara',
    ]);

    exportToPDF({
      title: 'LAPORAN REKAPITULASI UANG KAS SEKOLAH',
      subtitle: `${user?.sekolahNama || 'SmartKas School'} - Lintas Kelas & Jurusan`,
      headers,
      rows,
      filename: 'Laporan_Kas_Admin',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white font-heading">
            Laporan Kas Lintas Kelas & Sekolah
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Ekspor rekapitulasi transaksi kas ke format Excel, CSV, atau PDF
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportExcel}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center space-x-2 shadow-lg shadow-emerald-500/20 transition-all"
          >
            <FileSpreadsheet size={16} />
            <span>Export Excel</span>
          </button>
          <button
            onClick={handleExportPDF}
            className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center space-x-2 shadow-lg shadow-rose-500/20 transition-all"
          >
            <Printer size={16} />
            <span>Cetak PDF</span>
          </button>
        </div>
      </div>

      <AdminRekapKasSemuaKelas />

      <div className="pt-4 border-t border-slate-800">
        <h3 className="text-base font-bold text-white mb-3 font-heading">
          Seluruh Riwayat Transaksi Kas
        </h3>

        {loading ? (
          // Skeleton loading state — mimics the payment table row layout
          // (Tanggal, Siswa, Minggu, Nominal, Status, Verifikasi, Pencatat)
          <div className="w-full overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/60 backdrop-blur-md shadow-sm">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800">
              <ShimmerSkeleton className="h-4 w-48" />
            </div>
            <div className="divide-y divide-slate-200 dark:divide-slate-800/60">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="p-4 flex items-center gap-3 sm:gap-4"
                >
                  <ShimmerSkeleton className="h-3 w-16 shrink-0" />
                  <ShimmerSkeleton className="h-3 w-28 sm:w-32 shrink-0" />
                  <ShimmerSkeleton className="h-3 w-10 shrink-0" />
                  <ShimmerSkeleton className="h-3 w-16 sm:w-20 shrink-0" />
                  <ShimmerSkeleton className="h-5 w-20 sm:w-24 rounded-full shrink-0" />
                  <ShimmerSkeleton className="h-5 w-24 sm:w-28 rounded-full shrink-0" />
                  <ShimmerSkeleton className="h-3 w-20 sm:w-24 shrink-0" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="animate-fade-in-up">
            <PembayaranTable pembayaranList={pembayaranList} />
          </div>
        )}
      </div>
    </div>
  );
};
