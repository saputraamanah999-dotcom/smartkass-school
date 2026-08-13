import React from 'react';
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Pembayaran, Pengeluaran } from '../../types';
import { formatRupiah } from '../../lib/utils/formatCurrency';
import { safeStr } from '../../lib/utils/safeString';

interface CashFlowSummaryProps {
  pembayaranList: Pembayaran[];
  pengeluaranList: Pengeluaran[];
  /** Optional title override */
  title?: string;
}

/**
 * CashFlowSummary — a visual breakdown of income (pembayaran) vs
 * expense (pengeluaran) with a progress bar showing the ratio.
 *
 * Shows:
 * - Total pemasukan (green)
 * - Total pengeluaran (red)
 * - Net balance (saldo)
 * - Visual ratio bar (green vs red)
 * - Transaction counts
 */
export const CashFlowSummary: React.FC<CashFlowSummaryProps> = ({
  pembayaranList,
  pengeluaranList,
  title = 'Arus Kas Kelas',
}) => {
  const totalPemasukan = pembayaranList.reduce((acc, p) => acc + (p.nominal || 0), 0);
  // Filter out pengeluaran with zero/undefined totalHarga (e.g. _init placeholder yang lolos filter)
  const realPengeluaran = pengeluaranList.filter(p => (p.totalHarga || 0) > 0);
  const totalPengeluaran = realPengeluaran.reduce((acc, p) => acc + (p.totalHarga || 0), 0);
  const netBalance = totalPemasukan - totalPengeluaran;

  const total = totalPemasukan + totalPengeluaran;
  const pemasukanPct = total > 0 ? Math.round((totalPemasukan / total) * 100) : 0;
  const pengeluaranPct = total > 0 ? 100 - pemasukanPct : 0;

  const isPositive = netBalance >= 0;

  return (
    <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md space-y-4 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Wallet size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white font-heading">{title}</h3>
            <p className="text-[10px] text-slate-400">Ringkasan pemasukan vs pengeluaran</p>
          </div>
        </div>
        <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
          isPositive
            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
        }`}>
          {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          <span>{isPositive ? 'Surplus' : 'Defisit'}</span>
        </div>
      </div>

      {/* Net Balance */}
      <div className="text-center py-2">
        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Saldo Bersih</p>
        <p className={`text-2xl font-extrabold font-numeric ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
          {formatRupiah(netBalance)}
        </p>
      </div>

      {/* Ratio Bar */}
      <div className="space-y-1.5">
        <div className="flex h-3 rounded-full overflow-hidden bg-slate-950 border border-slate-800">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-700"
            style={{ width: `${pemasukanPct}%` }}
            title={`Pemasukan: ${pemasukanPct}%`}
          />
          <div
            className="h-full bg-gradient-to-r from-rose-500 to-rose-400 transition-all duration-700"
            style={{ width: `${pengeluaranPct}%` }}
            title={`Pengeluaran: ${pengeluaranPct}%`}
          />
        </div>
        <div className="flex justify-between text-[10px] text-slate-400 font-numeric">
          <span>{pemasukanPct}% masuk</span>
          <span>{pengeluaranPct}% keluar</span>
        </div>
      </div>

      {/* Breakdown Cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* Pemasukan */}
        <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <TrendingUp size={14} className="text-emerald-400" />
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Masuk</span>
            </div>
            <span className="text-[10px] text-slate-500 font-numeric">{pembayaranList.length} trx</span>
          </div>
          <p className="text-sm font-extrabold text-emerald-400 font-numeric">
            {formatRupiah(totalPemasukan)}
          </p>
        </div>

        {/* Pengeluaran */}
        <div className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/20 space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <TrendingDown size={14} className="text-rose-400" />
              <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">Keluar</span>
            </div>
            <span className="text-[10px] text-slate-500 font-numeric">{realPengeluaran.length} item</span>
          </div>
          <p className="text-sm font-extrabold text-rose-400 font-numeric">
            {formatRupiah(totalPengeluaran)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CashFlowSummary;
