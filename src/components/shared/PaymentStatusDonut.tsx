import React from 'react';
import { CheckCircle2, Clock, AlertTriangle, Users } from 'lucide-react';
import { Pembayaran, Siswa } from '../../types';
import { safeStr } from '../../lib/utils/safeString';

interface PaymentStatusDonutProps {
  pembayaranList: Pembayaran[];
  siswaList: Siswa[];
  title?: string;
}

interface StatusCount {
  lunas: number;
  dicicil: number;
  menunggak: number;
  belumBayar: number;
}

/**
 * PaymentStatusDonut — a visual donut chart showing the breakdown of
 * payment statuses: Lunas, Dicicil, Menunggak, and Belum Bayar.
 *
 * Uses pure CSS conic-gradient for the donut (no external chart library).
 * Shows:
 * - Donut chart with 4 colored segments
 * - Center label with total students
 * - Legend with counts and percentages
 * - Color-coded status cards
 */
export const PaymentStatusDonut: React.FC<PaymentStatusDonutProps> = ({
  pembayaranList,
  siswaList,
  title = 'Status Pembayaran Siswa',
}) => {
  const totalSiswa = siswaList.length;

  const statusCounts: StatusCount = React.useMemo(() => {
    const counts = { lunas: 0, dicicil: 0, menunggak: 0, belumBayar: 0 };

    // Count unique students by their latest payment status
    const studentStatuses = new Map<string, string>();

    siswaList.forEach((s) => {
      const studentPayments = pembayaranList.filter((p) => p.siswaId === s.id);
      if (studentPayments.length === 0) {
        studentStatuses.set(s.id, 'belumBayar');
      } else {
        // Check if any payment is menunggak (highest priority)
        const hasMenunggak = studentPayments.some((p) => safeStr(p.status) === 'menunggak');
        const hasDicicil = studentPayments.some((p) => safeStr(p.status) === 'dicicil');
        const allLunas = studentPayments.every((p) => safeStr(p.status) === 'lunas');

        if (hasMenunggak) {
          studentStatuses.set(s.id, 'menunggak');
        } else if (hasDicicil) {
          studentStatuses.set(s.id, 'dicicil');
        } else if (allLunas) {
          studentStatuses.set(s.id, 'lunas');
        } else {
          studentStatuses.set(s.id, 'dicicil');
        }
      }
    });

    studentStatuses.forEach((status) => {
      counts[status as keyof StatusCount]++;
    });

    return counts;
  }, [pembayaranList, siswaList]);

  const total = totalSiswa || 1;
  const lunasPct = Math.round((statusCounts.lunas / total) * 100);
  const dicicilPct = Math.round((statusCounts.dicicil / total) * 100);
  const menunggakPct = Math.round((statusCounts.menunggak / total) * 100);
  const belumPct = Math.round((statusCounts.belumBayar / total) * 100);

  // Conic gradient segments
  const lunasEnd = lunasPct;
  const dicicilEnd = lunasEnd + dicicilPct;
  const menunggakEnd = dicicilEnd + menunggakPct;

  const conicGradient = `conic-gradient(
    #10b981 0% ${lunasEnd}%,
    #f59e0b ${lunasEnd}% ${dicicilEnd}%,
    #f43f5e ${dicicilEnd}% ${menunggakEnd}%,
    #64748b ${menunggakEnd}% 100%
  )`;

  const statusItems = [
    {
      key: 'lunas',
      label: 'Lunas',
      count: statusCounts.lunas,
      pct: lunasPct,
      color: 'emerald',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      text: 'text-emerald-400',
      dot: 'bg-emerald-400',
      icon: <CheckCircle2 size={14} />,
    },
    {
      key: 'dicicil',
      label: 'Dicicil',
      count: statusCounts.dicicil,
      pct: dicicilPct,
      color: 'amber',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      text: 'text-amber-400',
      dot: 'bg-amber-400',
      icon: <Clock size={14} />,
    },
    {
      key: 'menunggak',
      label: 'Menunggak',
      count: statusCounts.menunggak,
      pct: menunggakPct,
      color: 'rose',
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/20',
      text: 'text-rose-400',
      dot: 'bg-rose-400',
      icon: <AlertTriangle size={14} />,
    },
    {
      key: 'belumBayar',
      label: 'Belum Bayar',
      count: statusCounts.belumBayar,
      pct: belumPct,
      color: 'slate',
      bg: 'bg-slate-500/10',
      border: 'border-slate-500/20',
      text: 'text-slate-400',
      dot: 'bg-slate-400',
      icon: <Users size={14} />,
    },
  ];

  return (
    <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md space-y-4 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Users size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white font-heading">{title}</h3>
            <p className="text-[10px] text-slate-400">{totalSiswa} siswa total</p>
          </div>
        </div>
      </div>

      {/* Donut + Legend */}
      <div className="flex items-center gap-6">
        {/* Donut Chart */}
        <div className="relative w-32 h-32 shrink-0">
          <div
            className="w-full h-full rounded-full"
            style={{ background: conicGradient }}
          />
          {/* Inner circle (donut hole) */}
          <div className="absolute inset-3 rounded-full bg-slate-900 flex flex-col items-center justify-center">
            <span className="text-2xl font-extrabold text-white font-numeric">{totalSiswa}</span>
            <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Siswa</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 grid grid-cols-2 gap-2">
          {statusItems.map((item) => (
            <div
              key={item.key}
              className={`p-2.5 rounded-xl ${item.bg} border ${item.border} space-y-0.5`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${item.dot}`} />
                  <span className={`text-[10px] font-bold ${item.text} uppercase tracking-wider`}>
                    {item.label}
                  </span>
                </div>
                {item.icon}
              </div>
              <div className="flex items-baseline gap-1">
                <span className={`text-lg font-extrabold ${item.text} font-numeric`}>
                  {item.count}
                </span>
                <span className="text-[10px] text-slate-500 font-numeric">({item.pct}%)</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex h-2 rounded-full overflow-hidden bg-slate-950 border border-slate-800">
          <div className="h-full bg-emerald-500" style={{ width: `${lunasPct}%` }} />
          <div className="h-full bg-amber-500" style={{ width: `${dicicilPct}%` }} />
          <div className="h-full bg-rose-500" style={{ width: `${menunggakPct}%` }} />
          <div className="h-full bg-slate-500" style={{ width: `${belumPct}%` }} />
        </div>
        <div className="flex justify-between text-[9px] text-slate-500 font-numeric">
          <span>{lunasPct}% lunas</span>
          <span>{menunggakPct + belumPct}% bermasalah</span>
        </div>
      </div>
    </div>
  );
};

export default PaymentStatusDonut;
