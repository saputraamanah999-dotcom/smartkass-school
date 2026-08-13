import React from 'react';
import { Siswa, Pembayaran } from '../../types';
import { formatRupiah } from '../../lib/utils/formatCurrency';
import { Trophy, Award, Medal } from 'lucide-react';

interface RankingChartProps {
  siswaList: Siswa[];
  pembayaranList: Pembayaran[];
}

export const RankingChart: React.FC<RankingChartProps> = ({
  siswaList,
  pembayaranList,
}) => {
  const ranked = siswaList
    .map((s) => {
      const pSiswa = pembayaranList.filter((p) => p.siswaId === s.id);
      const totalBayar = pSiswa.reduce((sum, p) => sum + (p.nominal || 0), 0);
      const countLunas = pSiswa.filter((p) => p.status === 'lunas').length;
      return {
        siswa: s,
        totalBayar,
        countLunas,
      };
    })
    .sort((a, b) => b.totalBayar - a.totalBayar || b.countLunas - a.countLunas)
    .slice(0, 5); // Top 5

  const getRankBadge = (idx: number) => {
    if (idx === 0) return <Trophy className="text-amber-400 w-5 h-5" />;
    if (idx === 1) return <Award className="text-slate-300 w-5 h-5" />;
    if (idx === 2) return <Medal className="text-amber-600 w-5 h-5" />;
    return <span className="text-xs font-bold text-slate-500">#{idx + 1}</span>;
  };

  return (
    <div className="space-y-3">
      {ranked.map((item, idx) => (
        <div
          key={item.siswa.id}
          className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 hover:bg-slate-800/80 transition-all"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center">
              {getRankBadge(idx)}
            </div>
            <div>
              <p className="text-xs font-semibold text-white">
                <span className="text-indigo-400 mr-1">#{item.siswa.noAbsen}</span>
                {item.siswa.nama}
              </p>
              <p className="text-[10px] text-slate-400 font-numeric">
                {item.countLunas} Minggu Lunas
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-extrabold text-emerald-400 font-numeric">
              {formatRupiah(item.totalBayar)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};
