import React from 'react';
import { Siswa, Pembayaran } from '../../types';

interface PaymentHeatmapProps {
  siswaList: Siswa[];
  pembayaranList: Pembayaran[];
  currentMinggu: number;
}

export const PaymentHeatmap: React.FC<PaymentHeatmapProps> = ({
  siswaList,
  pembayaranList,
  currentMinggu,
}) => {
  const weeks = Array.from({ length: Math.max(4, currentMinggu) }, (_, i) => i + 1);

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-xs text-left text-slate-300">
        <thead className="text-[11px] text-slate-400 bg-slate-900/80 uppercase">
          <tr>
            <th className="px-3 py-2 sticky left-0 bg-slate-900 font-semibold z-10 min-w-[140px]">
              Siswa
            </th>
            {weeks.map((m) => (
              <th key={m} className="px-2 py-2 text-center font-bold min-w-[36px]">
                M{m}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60">
          {siswaList.map((s) => (
            <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
              <td className="px-3 py-2 sticky left-0 bg-slate-900/90 font-medium text-white truncate max-w-[150px] z-10 border-r border-slate-800">
                <span className="text-indigo-400 mr-1 font-bold">{s.noAbsen}.</span>
                {s.nama}
              </td>
              {weeks.map((m) => {
                const bayar = pembayaranList.find(
                  (p) => p.siswaId === s.id && p.mingguKe === m
                );
                
                let bg = 'bg-slate-800/60 text-slate-500'; // Belum
                let title = `Minggu ${m}: Belum Bayar`;

                if (bayar) {
                  if (bayar.status === 'lunas') {
                    bg = 'bg-emerald-500 text-slate-950 font-bold shadow-sm shadow-emerald-500/20';
                    title = `Minggu ${m}: Lunas (Rp ${bayar.nominal.toLocaleString()})`;
                  } else if (bayar.status === 'dicicil') {
                    bg = 'bg-amber-500 text-slate-950 font-bold';
                    title = `Minggu ${m}: Dicicil (Rp ${bayar.nominal.toLocaleString()})`;
                  } else if (bayar.status === 'menunggak') {
                    bg = 'bg-rose-600 text-white font-bold animate-pulse';
                    title = `Minggu ${m}: Menunggak`;
                  }
                } else if (m < currentMinggu) {
                  bg = 'bg-rose-500/20 text-rose-400 border border-rose-500/30';
                  title = `Minggu ${m}: Telat`;
                }

                return (
                  <td key={m} className="p-1 text-center">
                    <div
                      title={title}
                      className={`w-7 h-7 mx-auto rounded-lg flex items-center justify-center text-[10px] cursor-pointer transition-transform hover:scale-110 ${bg}`}
                    >
                      {bayar?.status === 'lunas' ? '✓' : bayar?.status === 'dicicil' ? '½' : m < currentMinggu && !bayar ? '!' : '-'}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
