import React, { useState } from 'react';
import { db } from '../../../lib/firebase/config';
import { Kelas, Siswa, Pembayaran, Pengeluaran } from '../../../types';
import { useAuth } from '../../../contexts/AuthContext';
import { formatRupiah } from '../../../lib/utils/formatCurrency';
import {
} from '../../../lib/firebase/localData';
import { useSafeDoc, useSafeCollection, usePembayaranKelas } from '../../../hooks/useSafeCollection';
import { safeStr } from '../../../lib/utils/safeString';
import { StatCardSkeleton } from '../../shared/ShimmerSkeleton';
import { CoinIcon, WalletIcon, SiswaIcon, ClockLateIcon } from '../../icons/CustomIcons';
import { RevenueChart } from '../../charts/RevenueChart';
import { RankingChart } from '../../charts/RankingChart';
import { TopSiswaRajinBayar } from '../../shared/TopSiswaRajinBayar';
import { CashFlowSummary } from '../../shared/CashFlowSummary';
import { WeeklyCollectionChart } from '../../shared/WeeklyCollectionChart';
import { PaymentStatusDonut } from '../../shared/PaymentStatusDonut';
import { Plus, UserPlus, X, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface GuruDashboardProps {
  onNavigate: (path: string) => void;
}

export const GuruDashboard: React.FC<GuruDashboardProps> = ({ onNavigate }) => {
  const { user, createAccount } = useAuth();
  const sekolahId = user?.sekolahId || '';
  const jurusanId = user?.jurusanId || '';
  const kelasId = user?.kelasId || '';

  const { data: kelas, loading: loadingKelas } = useSafeDoc<Kelas>(
    `sekolah/${sekolahId}/jurusan/${jurusanId}/kelas/${kelasId}`,
    null
  );

  const siswaPath = (sekolahId && jurusanId && kelasId)
    ? `sekolah/${sekolahId}/jurusan/${jurusanId}/kelas/${kelasId}/siswa`
    : '';
  const pengeluaranPath = (sekolahId && jurusanId && kelasId)
    ? `sekolah/${sekolahId}/jurusan/${jurusanId}/kelas/${kelasId}/pengeluaran`
    : '';

  const { data: siswaListRaw, loading: loadingSiswa } = useSafeCollection<Siswa & { _docPath?: string }>(siswaPath, undefined);
  const { data: pembayaranListRaw, loading: loadingPembayaran } = usePembayaranKelas<Pembayaran>(sekolahId, jurusanId, kelasId);
  const { data: pengeluaranListRaw, loading: loadingPengeluaran } = useSafeCollection<Pengeluaran & { _docPath?: string }>(pengeluaranPath, undefined);

  const siswaList = siswaListRaw;
  const pembayaranList = pembayaranListRaw;
  const pengeluaranList = pengeluaranListRaw;

  const isLoading = loadingKelas || loadingSiswa || loadingPembayaran || loadingPengeluaran;

  // Modal Create Bendahara state
  const [showBendaharaModal, setShowBendaharaModal] = useState(false);
  const [bendaharaNama, setBendaharaNama] = useState('');
  const [bendaharaEmail, setBendaharaEmail] = useState('');
  const [bendaharaPassword, setBendaharaPassword] = useState('');
  const [isSubmittingBendahara, setIsSubmittingBendahara] = useState(false);

  // Hitung dari dokumen aktual (single source of truth), bukan kelas.saldoSaatIni yang bisa stale
  const pengeluaranReal = pengeluaranList.filter(p => p.id !== '_init');
  const totalPengeluaran = pengeluaranReal.reduce((acc, p) => acc + (p.totalHarga || 0), 0);
  const totalPemasukan = pembayaranList.reduce((acc, p) => acc + (p.nominal || 0), 0);
  const saldoSaatIni = totalPemasukan - totalPengeluaran;

  const chartData = [
    { period: 'Minggu 1', pemasukan: Math.round(totalPemasukan * 0.2), pengeluaran: Math.round(totalPengeluaran * 0.3) },
    { period: 'Minggu 2', pemasukan: Math.round(totalPemasukan * 0.3), pengeluaran: Math.round(totalPengeluaran * 0.4) },
    { period: 'Minggu 3', pemasukan: Math.round(totalPemasukan * 0.25), pengeluaran: Math.round(totalPengeluaran * 0.1) },
    { period: 'Minggu 4', pemasukan: Math.round(totalPemasukan * 0.25), pengeluaran: Math.round(totalPengeluaran * 0.2) },
  ];

  const handleCreateBendahara = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bendaharaNama || !bendaharaEmail) {
      toast.error('Mohon lengkapi Nama dan Email Bendahara.');
      return;
    }
    if (!bendaharaPassword || bendaharaPassword.length < 6) {
      toast.error('Password minimal 6 karakter.');
      return;
    }
    setIsSubmittingBendahara(true);
    try {
      await createAccount({
        nama: bendaharaNama,
        email: bendaharaEmail,
        password: bendaharaPassword,
        role: 'bendahara',
        sekolahId,
        jurusanId,
        kelasId,
      });
      toast.success(`Akun Bendahara (${bendaharaNama}) untuk kelas ${kelasId.toUpperCase()} berhasil dibuat!`);
      setBendaharaNama('');
      setBendaharaEmail('');
      setBendaharaPassword('');
      setShowBendaharaModal(false);
    } catch (err: any) {
      console.error('Error creating bendahara account:', err);
      toast.error('Gagal membuat akun bendahara.');
    } finally {
      setIsSubmittingBendahara(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-900 via-slate-900 to-indigo-950 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div>
          <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-semibold border border-purple-500/30">
            Wali Kelas: {kelas?.nama || kelasId.toUpperCase()} ({jurusanId.toUpperCase()})
          </span>
          <h2 className="text-2xl font-extrabold text-white font-heading mt-2">
            Dashboard Pengawasan Kas Kelas
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Pantau arus pemasukan, verifikasi data bendahara, serta buat akun bendahara kelas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowBendaharaModal(true)}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center space-x-2 shadow-lg shadow-amber-500/20 cursor-pointer transition-all"
          >
            <UserPlus size={16} />
            <span>Buat Akun Bendahara</span>
          </button>
          <button
            onClick={() => onNavigate('/guru/pengeluaran')}
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center space-x-2 shadow-lg shadow-purple-500/30 transition-all cursor-pointer"
          >
            <Plus size={16} />
            <span>Input Pengeluaran Kelas</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
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
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2 animate-fade-in-up card-hover-lift glow-emerald">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">Saldo Kas Kelas Saat Ini</span>
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                  <CoinIcon size={20} />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-emerald-400 font-numeric">
                {formatRupiah(saldoSaatIni)}
              </p>
              <span className="text-[10px] text-slate-500">Otomatis Terpotong Saat Pengeluaran</span>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2 animate-fade-in-up card-hover-lift glow-rose" style={{ animationDelay: '0.05s' }}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">Total Pengeluaran</span>
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
                  <WalletIcon size={20} />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-rose-400 font-numeric">
                {formatRupiah(totalPengeluaran)}
              </p>
              <span className="text-[10px] text-slate-500">{pengeluaranReal.length} Item Terbeli</span>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2 animate-fade-in-up card-hover-lift glow-purple" style={{ animationDelay: '0.1s' }}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">Total Siswa Kelas</span>
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                  <SiswaIcon size={20} />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-white font-numeric">
                {siswaList.length} Siswa
              </p>
              <span className="text-[10px] text-purple-400">Target Kas: Rp 5.000/mg</span>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2 animate-fade-in-up card-hover-lift glow-amber" style={{ animationDelay: '0.15s' }}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">Siswa Menunggak</span>
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                  <ClockLateIcon size={20} />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-amber-400 font-numeric">
                {siswaList.filter(s => (s.status as string) === 'menunggak').length} Siswa
              </p>
              <span className="text-[10px] text-amber-500">Perlu Diingatkan</span>
            </div>
          </>
        )}
      </div>

      {/* Analytics & Ranking */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white font-heading">Grafik Arus Kas Kelas ({kelasId.toUpperCase()})</h3>
          <RevenueChart data={chartData} />
        </div>

        <CashFlowSummary
          pembayaranList={pembayaranList}
          pengeluaranList={pengeluaranReal}
          title="Arus Kas Kelas"
        />
      </div>

      {/* Ranking Chart - Full width below */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white font-heading">Ranking Siswa Paling Rajin Bayar</h3>
        <RankingChart siswaList={siswaList} pembayaranList={pembayaranList} />
      </div>

      {/* Weekly Collection Progress Chart */}
      <WeeklyCollectionChart
        pembayaranList={pembayaranList}
        siswaList={siswaList}
        nominalKasMingguan={kelas?.nominalKasMingguan || 5000}
      />

      {/* Payment Status Donut Chart */}
      <PaymentStatusDonut
        pembayaranList={pembayaranList}
        siswaList={siswaList}
        title="Status Pembayaran Kelas Saya"
      />

      {/* Top Siswa Rajin Bayar Component */}
      <TopSiswaRajinBayar
        siswaList={siswaList}
        pembayaranList={pembayaranList}
        currentMinggu={4}
        nominalKasMingguan={kelas?.nominalKasMingguan || 5000}
      />

      {/* Modal Guru Create Bendahara */}
      {showBendaharaModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                  <UserPlus size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-heading">
                    Buat Akun Bendahara Kelas
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Otomatis menetapkan kelas: <strong className="text-amber-400 uppercase">{kelasId}</strong> ({jurusanId.toUpperCase()})
                  </p>
                </div>
              </div>
              <button onClick={() => setShowBendaharaModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateBendahara} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Nama Lengkap Bendahara *</label>
                <input
                  type="text"
                  required
                  placeholder="contoh: Ananda Putri (Bendahara)"
                  value={bendaharaNama}
                  onChange={(e) => setBendaharaNama(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Email Bendahara *</label>
                <input
                  type="email"
                  required
                  placeholder="contoh: bendahara.kelas@smartkas.sch.id"
                  value={bendaharaEmail}
                  onChange={(e) => setBendaharaEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Minimal 6 karakter"
                  value={bendaharaPassword}
                  onChange={(e) => setBendaharaPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowBendaharaModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingBendahara}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingBendahara ? 'Membuat...' : 'Simpan Akun Bendahara'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
