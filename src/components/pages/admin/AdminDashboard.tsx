import React, { useEffect, useMemo, useState, Suspense, lazy } from 'react';
import { useSafeCollection, useSafeCollectionGroup } from '../../../hooks/useSafeCollection';
import { Sekolah, Kelas, Siswa, Pembayaran, Pengeluaran } from '../../../types';
import { formatRupiah } from '../../../lib/utils/formatCurrency';
import { safeStr, safeLower } from '../../../lib/utils/safeString';
import { StatCardSkeleton } from '../../shared/ShimmerSkeleton';
import { AnimatedCounter } from '../../shared/AnimatedCounter';
import { ClassComparisonBar } from '../../shared/ClassComparisonBar';
import { SchoolIcon, KelasIcon, SiswaIcon, CoinIcon, WalletIcon } from '../../icons/CustomIcons';
import { AdminRekapKasSemuaKelas } from '../../shared/AdminRekapKasSemuaKelas';
import { Sparkles, ArrowRight, ShieldCheck, FileSpreadsheet } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';

// Lazy-load heavy recharts component to prevent crash if data is empty
const RevenueChart = lazy(() => import('../../charts/RevenueChart').then(m => ({ default: m.RevenueChart })));

// Small inline chart placeholder while RevenueChart loads
const ChartSkeleton = () => (
  <div className="w-full h-72 flex items-center justify-center rounded-xl bg-slate-950/60 border border-slate-800">
    <p className="text-xs text-slate-500">Memuat grafik...</p>
  </div>
);

interface AdminDashboardProps {
  onNavigate: (path: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const { activeSekolahId } = useAuth();

  // Use safe collection hooks with local fallback data
  const { data: sekolahList, loading: loadingSekolah } = useSafeCollection<Sekolah & { _docPath?: string }>(
    'sekolah',
    undefined);
  const { data: kelasList, loading: loadingKelas } = useSafeCollectionGroup<Kelas & { _docPath?: string }>(
    'kelas',
    undefined,
    { sekolahId: activeSekolahId }
  );
  const { data: siswaList, loading: loadingSiswa } = useSafeCollectionGroup<Siswa & { _docPath?: string }>(
    'siswa',
    undefined,
    { sekolahId: activeSekolahId }
  );
  const { data: pembayaranList } = useSafeCollectionGroup<Pembayaran>(
    'pembayaran',
    undefined,
    { sekolahId: activeSekolahId }
  );
  const { data: pengeluaranList } = useSafeCollectionGroup<Pengeluaran & { _docPath?: string }>(
    'pengeluaran',
    undefined,
    { sekolahId: activeSekolahId }
  );

  const isLoading = loadingSekolah || loadingKelas || loadingSiswa;

  // Filter scoped to activeSekolahId (defensive — handles null/undefined)
  const scopedKelasList = kelasList.filter((k) => {
    if (!activeSekolahId) return true;
    const path = safeStr((k as any)._docPath);
    const sid = safeStr((k as any).sekolahId);
    const target = safeLower(activeSekolahId);
    return sid.toLowerCase() === target || path.toLowerCase().includes(target);
  });

  const scopedSiswaList = siswaList.filter((s) => {
    if (!activeSekolahId) return true;
    const path = safeStr((s as any)._docPath);
    const sid = safeStr((s as any).sekolahId);
    const target = safeLower(activeSekolahId);
    return sid.toLowerCase() === target || path.toLowerCase().includes(target);
  });

  const activeSekolahNama = sekolahList.find((s) => s.id === activeSekolahId)?.nama || safeStr(activeSekolahId).toUpperCase().replace(/-/g, ' ');

  // Compute saldo from actual pembayaran & pengeluaran docs (NOT stale saldoSaatIni field)
  const totalPemasukanAktual = pembayaranList
    .filter((p) => safeStr(p.status) === 'lunas')
    .reduce((acc, p) => acc + (p.nominal || 0), 0);
  const totalPengeluaranAktual = pengeluaranList
    .filter((p) => (p.totalHarga || 0) > 0)
    .reduce((acc, p) => acc + (p.totalHarga || 0), 0);
  const totalSaldo = totalPemasukanAktual - totalPengeluaranAktual;
  const totalSiswa = scopedSiswaList.length;
  const totalPembayaran = pembayaranList.length;

  const chartData = useMemo(() => {
    const mingguLabels = ['Minggu 1', 'Minggu 2', 'Minggu 3', 'Minggu 4'];
    return mingguLabels.map((label, i) => {
      const mingguNum = i + 1;
      const pemasukan = pembayaranList
        .filter((p) => p.mingguKe === mingguNum && safeStr(p.status) === 'lunas')
        .reduce((s, p) => s + (p.nominal || 0), 0);
      const pengeluaran = pengeluaranList
        .filter((p) => p.kategori === 'kas')
        .reduce((s, p) => s + (p.totalHarga || 0), 0);
      return { period: label, pemasukan, pengeluaran };
    });
  }, [pembayaranList, pengeluaranList]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="relative rounded-3xl overflow-hidden p-6 sm:p-8 bg-gradient-to-r from-indigo-900 via-slate-900 to-purple-950 border border-slate-800 shadow-2xl">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold">
            <Sparkles size={14} className="text-amber-400" />
            <span>Panel Kontrol Administrator</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-heading">
            Sistem Kas Sekolah Multi-Sekolah & Kelas
          </h2>
          <p className="text-xs sm:text-sm text-slate-300">
            Mengontrol seluruh hierarki data sekolah, jurusan, kelas, wali kelas, bendahara, serta pengaturan tampilan realtime.
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md space-y-2 animate-fade-in-up card-hover-lift glow-emerald">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">Total Saldo Kas Kas</span>
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                  <CoinIcon size={20} />
                </div>
              </div>
              <p className="text-xl sm:text-2xl font-extrabold font-numeric bg-gradient-to-r from-emerald-300 to-emerald-500 bg-clip-text text-transparent">
                {formatRupiah(totalSaldo)}
              </p>
              <span className="text-[10px] text-emerald-500/80 font-medium">Updated Realtime</span>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md space-y-2 animate-fade-in-up card-hover-lift glow-indigo" style={{ animationDelay: '0.05s' }}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">Total Sekolah</span>
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                  <SchoolIcon size={20} />
                </div>
              </div>
              <p className="text-xl sm:text-2xl font-extrabold text-white font-numeric">
                <AnimatedCounter value={sekolahList.length} />
              </p>
              <span className="text-[10px] text-indigo-400 font-medium">{activeSekolahNama}</span>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md space-y-2 animate-fade-in-up card-hover-lift glow-purple" style={{ animationDelay: '0.1s' }}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">Total Kelas</span>
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                  <KelasIcon size={20} />
                </div>
              </div>
              <p className="text-xl sm:text-2xl font-extrabold text-white font-numeric">
                <AnimatedCounter value={scopedKelasList.length} />
              </p>
              <span className="text-[10px] text-purple-400 font-medium">{totalPembayaran} Setoran Tercatat</span>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md space-y-2 animate-fade-in-up card-hover-lift glow-cyan" style={{ animationDelay: '0.15s' }}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">Total Siswa Active</span>
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
                  <SiswaIcon size={20} />
                </div>
              </div>
              <p className="text-xl sm:text-2xl font-extrabold text-white font-numeric">
                <AnimatedCounter value={totalSiswa} suffix=" Siswa" />
              </p>
              <span className="text-[10px] text-cyan-400 font-medium">Terdaftar di Sistem</span>
            </div>
          </>
        )}
      </div>

      {/* Analytics Chart & Quick Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white font-heading">Grafik Pemasukan vs Pengeluaran</h3>
              <p className="text-xs text-slate-400">Tren akumulasi kas sekolah realtime</p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              Live Firestore
            </span>
          </div>
          <Suspense fallback={<ChartSkeleton />}>
            <RevenueChart data={chartData} />
          </Suspense>
        </div>

        {/* Shortcuts */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white font-heading">Aksi Cepat Admin</h3>
          <div className="space-y-2.5">
            <button
              onClick={() => onNavigate('/admin/pengaturan/tampilan')}
              className="w-full p-3 rounded-xl bg-indigo-600/10 border border-indigo-500/30 hover:bg-indigo-600/20 text-indigo-300 text-xs font-semibold flex items-center justify-between transition-all"
            >
              <span>Atur Logo, Banner & Video URL</span>
              <ArrowRight size={14} />
            </button>

            <button
              onClick={() => onNavigate('/admin/kelas')}
              className="w-full p-3 rounded-xl bg-purple-600/10 border border-purple-500/30 hover:bg-purple-600/20 text-purple-300 text-xs font-semibold flex items-center justify-between transition-all"
            >
              <span>Tambah Kelas & Akun Guru/Bendahara</span>
              <ArrowRight size={14} />
            </button>

            <button
              onClick={() => onNavigate('/admin/siswa')}
              className="w-full p-3 rounded-xl bg-cyan-600/10 border border-cyan-500/30 hover:bg-cyan-600/20 text-cyan-300 text-xs font-semibold flex items-center justify-between transition-all"
            >
              <span>Kelola Daftar Siswa Manual</span>
              <ArrowRight size={14} />
            </button>

            <button
              onClick={() => onNavigate('/admin/laporan')}
              className="w-full p-3 rounded-xl bg-emerald-600/10 border border-emerald-500/30 hover:bg-emerald-600/20 text-emerald-300 text-xs font-semibold flex items-center justify-between transition-all"
            >
              <span>Cetak / Export Excel Laporan</span>
              <FileSpreadsheet size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Rekap Setoran Kas Seluruh Kelas untuk Admin */}
      <AdminRekapKasSemuaKelas sekolahId={activeSekolahId} sekolahNama={activeSekolahNama} />

      {/* Class Comparison Bar Chart */}
      <ClassComparisonBar
        kelasList={scopedKelasList}
        siswaList={scopedSiswaList}
        pembayaranList={pembayaranList}
      />
    </div>
  );
};
