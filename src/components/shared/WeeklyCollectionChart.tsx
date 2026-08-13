import React from 'react';
import { Calendar, TrendingUp } from 'lucide-react';
import { Pembayaran, Siswa } from '../../types';
import { formatRupiah } from '../../lib/utils/formatCurrency';
import { safeStr } from '../../lib/utils/safeString';

interface WeeklyCollectionChartProps {
  pembayaranList: Pembayaran[];
  siswaList: Siswa[];
  nominalKasMingguan?: number;
  /** Number of weeks to display (default: 4) */
  weeks?: number;
  title?: string;
}

interface WeekData {
  week: number;
  collected: number;
  target: number;
  percentage: number;
  payerCount: number;
  totalStudents: number;
}

/**
 * WeeklyCollectionChart — a visual mini bar chart showing weekly kas
 * collection progress. Each week shows a vertical bar with the collected
 * amount vs the target, plus a percentage indicator.
 *
 * Features:
 * - Vertical bars for each week (1-4)
 * - Color-coded: emerald (>80%), amber (50-80%), rose (<50%)
 * - Target line overlay
 * - Percentage labels on each bar
 * - Summary footer with total collected vs total target
 */
export const WeeklyCollectionChart: React.FC<WeeklyCollectionChartProps> = ({
  pembayaranList,
  siswaList,
  nominalKasMingguan = 5000,
  weeks = 4,
  title = 'Progress Setoran Kas Mingguan',
}) => {
  const totalStudents = siswaList.length || 1;

  // Build week data
  const weekData: WeekData[] = React.useMemo(() => {
    const data: WeekData[] = [];
    for (let w = 1; w <= weeks; w++) {
      const weekPayments = pembayaranList.filter((p) => p.mingguKe === w);
      const collected = weekPayments.reduce((acc, p) => acc + (p.nominal || 0), 0);
      const target = totalStudents * nominalKasMingguan;
      const percentage = target > 0 ? Math.min(100, Math.round((collected / target) * 100)) : 0;
      const payerCount = weekPayments.length;

      data.push({
        week: w,
        collected,
        target,
        percentage,
        payerCount,
        totalStudents,
      });
    }
    return data;
  }, [pembayaranList, siswaList, nominalKasMingguan, weeks]);

  const totalCollected = weekData.reduce((acc, w) => acc + w.collected, 0);
  const totalTarget = weekData.reduce((acc, w) => acc + w.target, 0);
  const overallPct = totalTarget > 0 ? Math.round((totalCollected / totalTarget) * 100) : 0;

  const getBarColor = (pct: number) => {
    if (pct >= 80) return { bar: 'from-emerald-500 to-emerald-400', text: 'text-emerald-400', bg: 'bg-emerald-500/10' };
    if (pct >= 50) return { bar: 'from-amber-500 to-amber-400', text: 'text-amber-400', bg: 'bg-amber-500/10' };
    return { bar: 'from-rose-500 to-rose-400', text: 'text-rose-400', bg: 'bg-rose-500/10' };
  };

  return (
    <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md space-y-4 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Calendar size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white font-heading">{title}</h3>
            <p className="text-[10px] text-slate-400">{weeks} minggu • target {formatRupiah(nominalKasMingguan)}/siswa/minggu</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Tercapai</p>
          <p className="text-lg font-extrabold text-white font-numeric">{overallPct}%</p>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="flex items-end justify-between gap-2 h-40 px-2">
        {weekData.map((wd) => {
          const colors = getBarColor(wd.percentage);
          const barHeight = Math.max(8, wd.percentage * 0.85); // min 8% height for visibility
          return (
            <div key={wd.week} className="flex-1 flex flex-col items-center gap-1.5">
              {/* Percentage label */}
              <div className={`text-[10px] font-bold ${colors.text} font-numeric`}>
                {wd.percentage}%
              </div>

              {/* Bar container */}
              <div className="relative w-full max-w-[50px] flex-1 flex items-end">
                {/* Target line (100%) */}
                <div className="absolute inset-x-0 top-0 h-px bg-slate-700/50 border-dashed" />
                {/* Bar */}
                <div
                  className={`w-full rounded-t-lg bg-gradient-to-t ${colors.bar} transition-all duration-700 shadow-lg`}
                  style={{ height: `${barHeight}%` }}
                  title={`Minggu ${wd.week}: ${formatRupiah(wd.collected)} / ${formatRupiah(wd.target)}`}
                >
                  {/* Shine effect */}
                  <div className="w-full h-1/3 rounded-t-lg bg-white/10" />
                </div>
              </div>

              {/* Week label */}
              <div className="text-[10px] text-slate-400 font-bold">M{wd.week}</div>
              {/* Payer count */}
              <div className={`text-[9px] ${colors.text} font-numeric`}>
                {wd.payerCount}/{wd.totalStudents}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary footer */}
      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800">
        <div className="text-center p-2 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
          <p className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Terkumpul</p>
          <p className="text-sm font-extrabold text-emerald-400 font-numeric">
            {formatRupiah(totalCollected)}
          </p>
        </div>
        <div className="text-center p-2 rounded-xl bg-slate-800/50 border border-slate-700">
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Target</p>
          <p className="text-sm font-extrabold text-white font-numeric">
            {formatRupiah(totalTarget)}
          </p>
        </div>
      </div>

      {/* Trend indicator */}
      {overallPct > 0 && (
        <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400">
          <TrendingUp size={12} className={overallPct >= 50 ? 'text-emerald-400' : 'text-amber-400'} />
          <span>
            {overallPct >= 80
              ? '✓ Kumpul kas sangat baik! Kelas disiplin setor.'
              : overallPct >= 50
              ? '⚠ Pengumpulan cukup, perlu lebih aktif.'
              : '⚠ Pengumpalian masih rendah, perlu diingatkan siswa.'}
          </span>
        </div>
      )}
    </div>
  );
};

export default WeeklyCollectionChart;
