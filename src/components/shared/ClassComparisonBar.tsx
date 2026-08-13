import React from 'react';
import { Trophy, Users, Wallet, TrendingUp } from 'lucide-react';
import { Kelas, Siswa, Pembayaran } from '../../types';
import { formatRupiah } from '../../lib/utils/formatCurrency';
import { safeStr } from '../../lib/utils/safeString';

interface ClassComparisonBarProps {
  kelasList: Kelas[];
  siswaList: Siswa[];
  pembayaranList: Pembayaran[];
  title?: string;
}

interface ClassStat {
  kelas: Kelas;
  siswaCount: number;
  totalCollected: number;
  lunasCount: number;
  collectionRate: number;
}

/**
 * ClassComparisonBar — a horizontal bar chart that compares all classes'
 * cash collection performance side by side.
 *
 * Features:
 * - Horizontal bars for each class showing total collected amount
 * - Color-coded ranking: Gold (#1), Silver (#2), Bronze (#3)
 * - Student count and collection rate per class
 * - Animated bar growth
 * - Sorted by collection amount (highest first)
 */
export const ClassComparisonBar: React.FC<ClassComparisonBarProps> = ({
  kelasList,
  siswaList,
  pembayaranList,
  title = 'Perbandingan Kas Antar Kelas',
}) => {
  const classStats: ClassStat[] = React.useMemo(() => {
    const stats = kelasList.map((kelas) => {
      const classSiswa = siswaList.filter((s) => safeStr(s.kelasId) === safeStr(kelas.id));
      const classPayments = pembayaranList.filter((p) => safeStr(p.kelasId) === safeStr(kelas.id));
      const totalCollected = classPayments.reduce((acc, p) => acc + (p.nominal || 0), 0);
      const lunasCount = classPayments.filter((p) => safeStr(p.status) === 'lunas').length;

      return {
        kelas,
        siswaCount: classSiswa.length,
        totalCollected,
        lunasCount,
        collectionRate: classSiswa.length > 0 ? Math.round((lunasCount / classSiswa.length) * 100) : 0,
      };
    });

    // Sort by total collected descending
    return stats.sort((a, b) => b.totalCollected - a.totalCollected);
  }, [kelasList, siswaList, pembayaranList]);

  const maxCollected = Math.max(...classStats.map((s) => s.totalCollected), 1);

  const getRankColor = (index: number) => {
    if (index === 0) return { bar: 'from-amber-400 to-amber-500', text: 'text-amber-400', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30', label: '🥇 #1' };
    if (index === 1) return { bar: 'from-slate-300 to-slate-400', text: 'text-slate-300', badge: 'bg-slate-400/20 text-slate-300 border-slate-400/30', label: '🥈 #2' };
    if (index === 2) return { bar: 'from-orange-600 to-orange-700', text: 'text-orange-400', badge: 'bg-orange-600/20 text-orange-300 border-orange-600/30', label: '🥉 #3' };
    return { bar: 'from-indigo-500 to-purple-500', text: 'text-indigo-400', badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30', label: `#${index + 1}` };
  };

  return (
    <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md space-y-4 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Trophy size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white font-heading">{title}</h3>
            <p className="text-[10px] text-slate-400">{classStats.length} kelas • diurutkan berdasarkan kas terkumpul</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Gabungan</p>
          <p className="text-sm font-extrabold text-emerald-400 font-numeric">
            {formatRupiah(classStats.reduce((acc, s) => acc + s.totalCollected, 0))}
          </p>
        </div>
      </div>

      {/* Class Bars */}
      <div className="space-y-3">
        {classStats.map((stat, idx) => {
          const rank = getRankColor(idx);
          const barWidth = Math.max(5, (stat.totalCollected / maxCollected) * 100);

          return (
            <div key={stat.kelas.id} className="space-y-1.5">
              {/* Class info row */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${rank.badge}`}>
                    {rank.label}
                  </span>
                  <span className="font-bold text-white">{stat.kelas.nama}</span>
                  <span className="text-slate-500 flex items-center gap-0.5">
                    <Users size={11} /> {stat.siswaCount}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-slate-400 flex items-center gap-0.5">
                    <TrendingUp size={11} /> {stat.collectionRate}%
                  </span>
                  <span className={`font-extrabold font-numeric ${rank.text}`}>
                    {formatRupiah(stat.totalCollected)}
                  </span>
                </div>
              </div>

              {/* Bar */}
              <div className="relative h-6 rounded-lg bg-slate-950 border border-slate-800 overflow-hidden">
                <div
                  className={`h-full rounded-lg bg-gradient-to-r ${rank.bar} transition-all duration-700 shadow-lg`}
                  style={{ width: `${barWidth}%` }}
                >
                  {/* Shine effect */}
                  <div className="w-full h-1/2 rounded-t-lg bg-white/10" />
                </div>
                {/* Wali kelas name overlay */}
                <div className="absolute inset-0 flex items-center justify-end pr-2">
                  <span className="text-[9px] text-white/70 font-medium truncate max-w-[120px]">
                    {safeStr(stat.kelas.waliKelasNama) || 'Wali Kelas'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary footer */}
      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800">
        <div className="text-center p-2 rounded-lg bg-slate-800/50">
          <div className="flex items-center justify-center gap-1 text-[9px] uppercase font-bold text-slate-400 tracking-wider">
            <Users size={11} /> Siswa
          </div>
          <p className="text-sm font-extrabold text-white font-numeric">
            {classStats.reduce((acc, s) => acc + s.siswaCount, 0)}
          </p>
        </div>
        <div className="text-center p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
          <div className="flex items-center justify-center gap-1 text-[9px] uppercase font-bold text-emerald-400 tracking-wider">
            <Wallet size={11} /> Terkumpul
          </div>
          <p className="text-sm font-extrabold text-emerald-400 font-numeric">
            {formatRupiah(classStats.reduce((acc, s) => acc + s.totalCollected, 0))}
          </p>
        </div>
        <div className="text-center p-2 rounded-lg bg-indigo-500/5 border border-indigo-500/20">
          <div className="flex items-center justify-center gap-1 text-[9px] uppercase font-bold text-indigo-400 tracking-wider">
            <TrendingUp size={11} /> Rata-rata
          </div>
          <p className="text-sm font-extrabold text-indigo-400 font-numeric">
            {classStats.length > 0
              ? Math.round(classStats.reduce((acc, s) => acc + s.collectionRate, 0) / classStats.length)
              : 0}%
          </p>
        </div>
      </div>
    </div>
  );
};

export default ClassComparisonBar;
