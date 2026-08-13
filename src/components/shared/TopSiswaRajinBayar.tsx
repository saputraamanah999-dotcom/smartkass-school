import React, { useState } from 'react';
import { Siswa, Pembayaran } from '../../types';
import { formatRupiah } from '../../lib/utils/formatCurrency';
import { safeStr, safeLower } from '../../lib/utils/safeString';
import { Trophy, Award, Medal, CheckCircle2, AlertTriangle, Search, Sparkles, UserCheck, Flame } from 'lucide-react';
import { motion } from 'motion/react';

interface TopSiswaRajinBayarProps {
  siswaList: Siswa[];
  pembayaranList: Pembayaran[];
  currentMinggu?: number;
  nominalKasMingguan?: number;
}

export const TopSiswaRajinBayar: React.FC<TopSiswaRajinBayarProps> = ({
  siswaList,
  pembayaranList,
  currentMinggu = 4,
  nominalKasMingguan = 5000,
}) => {
  const [filterTab, setFilterTab] = useState<'all' | 'rajin' | 'dicicil' | 'menunggak'>('all');
  const [search, setSearch] = useState('');

  // Calculate statistics per student
  const totalTargetWeek = currentMinggu;
  const targetPerSiswa = totalTargetWeek * nominalKasMingguan;

  const siswaStats = siswaList.map((siswa) => {
    const listP = pembayaranList.filter((p) => p.siswaId === siswa.id || safeLower(p.siswaNama) === safeLower(siswa.nama));

    // Calculate weeks paid fully
    let mingguLunasCount = 0;
    let totalBayar = 0;

    for (let m = 1; m <= currentMinggu; m++) {
      const pWeek = listP.filter((p) => p.mingguKe === m);
      const sumWeek = pWeek.reduce((acc, p) => acc + (p.nominal || 0), 0);
      if (sumWeek >= nominalKasMingguan) {
        mingguLunasCount += 1;
      }
      totalBayar += sumWeek;
    }

    const totalTerbayarSiswa = listP.reduce((acc, p) => acc + (p.nominal || 0), 0);
    const percentDisiplin = Math.min(100, Math.round((mingguLunasCount / currentMinggu) * 100));

    let statusType: 'rajin' | 'dicicil' | 'menunggak' = 'menunggak';
    if (percentDisiplin >= 100) {
      statusType = 'rajin';
    } else if (totalTerbayarSiswa > 0) {
      statusType = 'dicicil';
    }

    return {
      siswa,
      mingguLunasCount,
      totalTerbayarSiswa,
      percentDisiplin,
      statusType,
    };
  });

  // Sort by discipline percentage desc, then total paid desc, then no. absen asc
  const sortedSiswa = [...siswaStats].sort((a, b) => {
    if (b.percentDisiplin !== a.percentDisiplin) return b.percentDisiplin - a.percentDisiplin;
    if (b.totalTerbayarSiswa !== a.totalTerbayarSiswa) return b.totalTerbayarSiswa - a.totalTerbayarSiswa;
    return (a.siswa.noAbsen || 0) - (b.siswa.noAbsen || 0);
  });

  const countRajin = siswaStats.filter((s) => s.statusType === 'rajin').length;
  const countDicicil = siswaStats.filter((s) => s.statusType === 'dicicil').length;
  const countMenunggak = siswaStats.filter((s) => s.statusType === 'menunggak').length;

  const avgKetaatan = siswaStats.length > 0
    ? Math.round(siswaStats.reduce((acc, s) => acc + s.percentDisiplin, 0) / siswaStats.length)
    : 0;

  // Filter list by tab & search
  const filteredList = sortedSiswa.filter((item) => {
    const matchesSearch = safeLower(item.siswa.nama).includes(safeLower(search)) ||
      safeStr(item.siswa.noAbsen).includes(safeStr(search));
    if (!matchesSearch) return false;

    if (filterTab === 'rajin') return item.statusType === 'rajin';
    if (filterTab === 'dicicil') return item.statusType === 'dicicil';
    if (filterTab === 'menunggak') return item.statusType === 'menunggak';
    return true;
  });

  const top3Siswa = sortedSiswa.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Kedisiplinan Kelas</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Flame size={18} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 font-numeric">
            {avgKetaatan}%
          </p>
          <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
            <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${avgKetaatan}%` }} />
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">Rata-rata ketaatan bayar minggu 1-{currentMinggu}</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Siswa Top 100% Lunas</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Trophy size={18} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-amber-500 font-numeric">
            {countRajin} <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">Siswa</span>
          </p>
          <span className="inline-block text-[10px] text-amber-600 dark:text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-md">
            Teladan Kas Kelas
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Siswa Mencicil</span>
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
              <UserCheck size={18} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-sky-600 dark:text-sky-400 font-numeric">
            {countDicicil} <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">Siswa</span>
          </p>
          <span className="inline-block text-[10px] text-sky-600 dark:text-sky-400 font-bold bg-sky-500/10 px-2 py-0.5 rounded-md">
            Pembayaran Sebagian
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Menunggak Kas</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <AlertTriangle size={18} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 font-numeric">
            {countMenunggak} <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">Siswa</span>
          </p>
          <span className="inline-block text-[10px] text-rose-600 dark:text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded-md">
            Perlu Diingatkan
          </span>
        </div>
      </div>

      {/* Podium Top 3 Siswa Paling Rajin Bayar */}
      {top3Siswa.length > 0 && (
        <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-500/10 via-slate-900 to-indigo-950 border border-amber-500/30 text-white shadow-xl space-y-4">
          <div className="flex items-center space-x-2">
            <Sparkles size={20} className="text-amber-400 animate-pulse" />
            <h3 className="text-base font-extrabold font-heading text-amber-300">
              Podium Top Siswa Paling Disiplin & Rajin Bayar Kas
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            {top3Siswa.map((st, idx) => {
              const ranks = [
                { title: 'JUARA 1 RAJIN KAS', color: 'from-amber-400 to-yellow-600', badge: '🥇 Gold Medal' },
                { title: 'JUARA 2 RAJIN KAS', color: 'from-slate-300 to-slate-500', badge: '🥈 Silver Medal' },
                { title: 'JUARA 3 RAJIN KAS', color: 'from-amber-700 to-orange-800', badge: '🥉 Bronze Medal' },
              ];
              const rInfo = ranks[idx] || ranks[0];

              return (
                <motion.div
                  key={st.siswa.id}
                  whileHover={{ y: -3 }}
                  className="p-4 rounded-2xl bg-slate-900/90 border border-slate-700/80 flex flex-col justify-between space-y-3 relative overflow-hidden"
                >
                  <div className={`absolute top-0 right-0 px-3 py-1 rounded-bl-xl bg-gradient-to-r ${rInfo.color} text-slate-950 text-[9px] font-extrabold tracking-wider`}>
                    {rInfo.badge}
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-amber-400 font-numeric">Absen #{st.siswa.noAbsen}</span>
                    <h4 className="text-sm font-extrabold text-white font-heading truncate mt-0.5">{st.siswa.nama}</h4>
                    <p className="text-[11px] text-slate-300 font-numeric mt-1">
                      Kontribusi: <strong className="text-emerald-400">{formatRupiah(st.totalTerbayarSiswa)}</strong>
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Tingkat Kedisiplinan:</span>
                    <span className="font-extrabold text-emerald-400 font-numeric">{st.percentDisiplin}%</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter Tabs & Table List */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold overflow-x-auto">
            <button
              onClick={() => setFilterTab('all')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${filterTab === 'all' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
            >
              Semua ({siswaStats.length})
            </button>
            <button
              onClick={() => setFilterTab('rajin')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${filterTab === 'rajin' ? 'bg-amber-500 text-slate-950 font-extrabold shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
            >
              ⭐ Rajin 100% ({countRajin})
            </button>
            <button
              onClick={() => setFilterTab('dicicil')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${filterTab === 'dicicil' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
            >
              Dicicil ({countDicicil})
            </button>
            <button
              onClick={() => setFilterTab('menunggak')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${filterTab === 'menunggak' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
            >
              Menunggak ({countMenunggak})
            </button>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Cari siswa atau no absen..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-xs text-left text-slate-700 dark:text-slate-300">
            <thead className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-950 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3.5 font-bold">Peringkat & Absen</th>
                <th className="px-4 py-3.5 font-bold">Nama Siswa</th>
                <th className="px-4 py-3.5 font-bold">Progres Lunas (Minggu 1-{currentMinggu})</th>
                <th className="px-4 py-3.5 font-bold">Total Terbayar</th>
                <th className="px-4 py-3.5 font-bold">Ketaatan %</th>
                <th className="px-4 py-3.5 font-bold text-right">Lencana Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    Tidak ditemukan data siswa berdasarkan kriteria filter.
                  </td>
                </tr>
              ) : (
                filteredList.map((st, index) => {
                  return (
                    <tr key={st.siswa.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 font-numeric text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        <span className="font-extrabold text-indigo-600 dark:text-indigo-400">#{index + 1}</span> (Absen #{st.siswa.noAbsen})
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                        {st.siswa.nama}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2">
                          <span className="font-numeric font-bold text-slate-700 dark:text-slate-300">
                            {st.mingguLunasCount} / {currentMinggu} Minggu
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-numeric font-extrabold text-emerald-600 dark:text-emerald-400">
                        {formatRupiah(st.totalTerbayarSiswa)}
                      </td>
                      <td className="px-4 py-3 font-numeric font-extrabold text-slate-900 dark:text-white">
                        {st.percentDisiplin}%
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {st.statusType === 'rajin' && (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[10px] font-extrabold">
                            <Trophy size={12} />
                            <span>Siswa Teladan Lunas</span>
                          </span>
                        )}
                        {st.statusType === 'dicicil' && (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 text-[10px] font-bold">
                            <CheckCircle2 size={12} />
                            <span>Pembayaran Dicicil</span>
                          </span>
                        )}
                        {st.statusType === 'menunggak' && (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-[10px] font-bold">
                            <AlertTriangle size={12} />
                            <span>Menunggak / Belum Bayar</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
