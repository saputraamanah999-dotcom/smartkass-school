import React, { useState } from 'react';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase/config';
import { useAuth } from '../../../contexts/AuthContext';
import { Kelas, Siswa, Pembayaran, Pengeluaran, TargetKas } from '../../../types';
import { formatRupiah } from '../../../lib/utils/formatCurrency';
import {
} from '../../../lib/firebase/localData';
import { useSafeDoc, useSafeCollection, usePembayaranKelas } from '../../../hooks/useSafeCollection';
import { safeStr } from '../../../lib/utils/safeString';
import { StatCardSkeleton } from '../../shared/ShimmerSkeleton';
import { CoinIcon, TargetIcon, SiswaIcon, CheckLunasIcon, ClockLateIcon } from '../../icons/CustomIcons';
import { PaymentHeatmap } from '../../charts/PaymentHeatmap';
import { TopSiswaRajinBayar } from '../../shared/TopSiswaRajinBayar';
import { CashFlowSummary } from '../../shared/CashFlowSummary';
import { WeeklyCollectionChart } from '../../shared/WeeklyCollectionChart';
import { PaymentStatusDonut } from '../../shared/PaymentStatusDonut';
import { Plus, ArrowRight, ShoppingBag, Clock, UserCheck, Zap } from 'lucide-react';

interface BendaharaDashboardProps {
  onNavigate: (path: string) => void;
}

export const BendaharaDashboard: React.FC<BendaharaDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
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
  const { data: pengeluaranListRaw } = useSafeCollection<Pengeluaran & { _docPath?: string }>(pengeluaranPath, undefined);

  const siswaList = siswaListRaw;
  const pembayaranList = pembayaranListRaw;
  const pengeluaranList = pengeluaranListRaw;

  const isLoading = loadingKelas || loadingSiswa || loadingPembayaran;

  // Hitung saldo REAL dari pembayaran dokumen (single source of truth)
  // Jangan pakai kelas.saldoSaatIni karena bisa stale/tdk sync dengan checkbox
  const totalPemasukanAktual = pembayaranList.reduce((acc, p) => acc + (p.nominal || 0), 0);
  const totalPengeluaranAktual = pengeluaranList.filter(p => p.id !== '_init').reduce((acc, p) => acc + (p.totalHarga || 0), 0);
  const saldo = totalPemasukanAktual - totalPengeluaranAktual;

  // RIWAYAT PEMBAYARAN TERBARU — otomatis tampil siapa yang bayar
  const recentPayments = [...pembayaranList]
    .filter(p => p.status === 'lunas')
    .sort((a, b) => new Date(b.createdAt || b.tanggalBayar).getTime() - new Date(a.createdAt || a.tanggalBayar).getTime())
    .slice(0, 10);

  // Helper format waktu relatif
  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Baru saja';
    if (mins < 60) return `${mins} menit lalu`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} jam lalu`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days} hari lalu`;
    return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const target: TargetKas = {
    tujuan: kelas?.targetKas?.tujuan || 'Belum ada target kas ditetapkan',
    nominalTarget: kelas?.targetKas?.nominalTarget || 0,
    deadline: kelas?.targetKas?.deadline || '',
  };

  const progressPercent = Math.min(100, Math.round((saldo / (target.nominalTarget || 1)) * 100));

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-950 via-slate-900 to-indigo-950 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xl">
        <div>
          <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/30">
            Panel Bendahara Kelas: {kelas?.nama || kelasId.toUpperCase()}
          </span>
          <h2 className="text-2xl font-extrabold text-white font-heading mt-2">
            Pencatatan Kas & Pemantauan Target
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Input pembayaran siswa, kelola pengeluaran & simulasi diskon, dan pantau ketaatan rajin bayar kas kelas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigate('/bendahara/pembayaran')}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center space-x-2 shadow-lg shadow-amber-500/30 transition-all cursor-pointer"
          >
            <Plus size={16} />
            <span>Setor Kas</span>
          </button>
          <button
            onClick={() => onNavigate('/bendahara/pengeluaran')}
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center space-x-2 shadow-lg shadow-purple-500/30 transition-all cursor-pointer"
          >
            <ShoppingBag size={16} />
            <span>Belanja & Diskon</span>
          </button>
        </div>
      </div>

      {/* Target Progress Bar Card */}
      {isLoading ? (
        <StatCardSkeleton />
      ) : (
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 backdrop-blur-md animate-fade-in-up">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <TargetIcon size={28} />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                  TARGET / TUJUAN KAS KELAS
                </span>
                <h3 className="text-base font-extrabold text-white font-heading">{target.tujuan}</h3>
              </div>
            </div>

            <div className="text-right">
              <p className="text-xs text-slate-400">Pencapaian Target:</p>
              <p className="text-xl font-extrabold text-amber-400 font-numeric">{progressPercent}%</p>
            </div>
          </div>

          {/* Animated Progress Bar */}
          <div className="w-full bg-slate-950 rounded-full h-3.5 p-0.5 border border-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-400 transition-all duration-1000 shadow-lg shadow-amber-500/20"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-xs font-numeric text-slate-400 pt-1">
            <span>Terkumpul: <strong className="text-emerald-400">{formatRupiah(saldo)}</strong></span>
            <span>Target: <strong className="text-white">{formatRupiah(target.nominalTarget)}</strong></span>
          </div>
        </div>
      )}

      {/* Cash Flow Summary — filter _init placeholder */}
      <CashFlowSummary
        pembayaranList={pembayaranList}
        pengeluaranList={pengeluaranList.filter(p => p.id !== '_init')}
        title="Arus Kas Kelas Saya"
      />

      {/* PEMBAYARAN TERBARU — Otomatis tampil SIAPA yang bayar */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <UserCheck size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white font-heading">Pembayaran Terbaru</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1">
                  <Zap size={10} />
                  Otomatis
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Riwayat siapa saja yang sudah bayar kas — nama otomatis terekam</p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('/bendahara/pembayaran')}
            className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center space-x-1 cursor-pointer"
          >
            <span>Lihat Semua</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {recentPayments.length === 0 ? (
          <div className="py-8 text-center">
            <Clock size={32} className="text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-500">Belum ada pembayaran kas tercatat.</p>
            <p className="text-[10px] text-slate-600 mt-1">Setiap siswa yang bayar akan otomatis muncul di sini beserta namanya.</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {recentPayments.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/70 border border-slate-800/60 hover:border-emerald-500/30 transition-all group"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  {/* Avatar otomatis dari inisial nama */}
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-extrabold shrink-0 shadow-md shadow-emerald-500/20">
                    {p.siswaNama?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white truncate">{p.siswaNama}</span>
                      <span className="text-[10px] text-slate-500 font-numeric">#{p.siswaNoAbsen}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-amber-400 font-semibold">{p.bulan || ''}</span>
                      <span className="text-slate-700">·</span>
                      <span className="text-[10px] text-slate-400">Minggu {p.mingguKe}</span>
                      <span className="text-slate-700">·</span>
                      <span className="text-[10px] text-slate-500">{timeAgo(p.createdAt || p.tanggalBayar)}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-extrabold text-emerald-400 font-numeric">+{formatRupiah(p.nominal)}</span>
                  {p.dicatatOlehNama && (
                    <p className="text-[10px] text-slate-600 mt-0.5">oleh {p.dicatatOlehNama}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
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
        title="Status Pembayaran Siswa"
      />

      {/* Payment Heatmap Grid */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white font-heading">Matriks Heatmap Pembayaran Kas per Siswa</h3>
            <p className="text-xs text-slate-400">Pantau status lunas, dicicil, atau menunggak tiap minggu</p>
          </div>
          <button
            onClick={() => onNavigate('/bendahara/siswa')}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center space-x-1 cursor-pointer"
          >
            <span>Kelola Siswa</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <PaymentHeatmap
          siswaList={siswaList}
          pembayaranList={pembayaranList}
          currentMinggu={4}
        />
      </div>

      {/* Top Siswa Rajin Bayar & Ketaatan Kas */}
      <TopSiswaRajinBayar
        siswaList={siswaList}
        pembayaranList={pembayaranList}
        currentMinggu={4}
        nominalKasMingguan={5000}
      />
    </div>
  );
};

