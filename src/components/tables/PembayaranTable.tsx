import React from 'react';
import { Pembayaran } from '../../types';
import { formatRupiah } from '../../lib/utils/formatCurrency';
import { formatDate } from '../../lib/utils/formatDate';
import { getStatusBadgeStyle } from '../../lib/utils/calculateStatus';
import { ShieldCheck, Clock, CheckCircle2, Trash2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface PembayaranTableProps {
  pembayaranList: Pembayaran[];
  onApprove?: (pembayaran: Pembayaran) => void;
  onDelete?: (pembayaran: Pembayaran) => void;
  isApprovingId?: string | null;
}

export const PembayaranTable: React.FC<PembayaranTableProps> = ({
  pembayaranList,
  onApprove,
  onDelete,
  isApprovingId,
}) => {
  const { user } = useAuth();
  const showActionCol = Boolean(onApprove || onDelete);

  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/60 backdrop-blur-md shadow-sm transition-colors">
      <table className="w-full text-xs text-left text-slate-700 dark:text-slate-300">
        <thead className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-950/80 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
          <tr>
            <th className="px-4 py-3.5 font-bold">Tanggal</th>
            <th className="px-4 py-3.5 font-bold">Siswa</th>
            <th className="px-4 py-3.5 font-bold">Bulan</th>
            <th className="px-4 py-3.5 font-bold">Minggu Ke-</th>
            <th className="px-4 py-3.5 font-bold">Nominal</th>
            <th className="px-4 py-3.5 font-bold">Status Pembayaran</th>
            <th className="px-4 py-3.5 font-bold">Verifikasi Guru</th>
            <th className="px-4 py-3.5 font-bold">Dicatat Oleh</th>
            {showActionCol && <th className="px-4 py-3.5 font-bold text-right">Aksi</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
          {pembayaranList.length === 0 ? (
            <tr>
              <td colSpan={showActionCol ? 9 : 8} className="px-4 py-8 text-center text-slate-400 dark:text-slate-500">
                Belum ada riwayat pembayaran kas terdeteksi.
              </td>
            </tr>
          ) : (
            pembayaranList.map((p) => {
              const badge = getStatusBadgeStyle(p.status);
              const isApproved = p.approvedByGuru;

              return (
                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3 font-numeric text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    {formatDate(p.tanggalBayar || p.createdAt)}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white whitespace-nowrap">
                    <span className="text-indigo-600 dark:text-indigo-400 font-extrabold mr-1">#{p.siswaNoAbsen}</span>
                    {p.siswaNama}
                  </td>
                  <td className="px-4 py-3 font-semibold text-amber-600 dark:text-amber-400 whitespace-nowrap">
                    {p.bulan || p.tahunAjaran || '-'}
                  </td>
                  <td className="px-4 py-3 font-bold font-numeric text-slate-700 dark:text-slate-300 whitespace-nowrap">
                    Minggu {p.mingguKe}
                  </td>
                  <td className="px-4 py-3 font-extrabold text-emerald-600 dark:text-emerald-400 font-numeric whitespace-nowrap">
                    + {formatRupiah(p.nominal)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold border uppercase tracking-wider ${badge.bg}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                      <span>{badge.label}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {isApproved ? (
                      <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                        <ShieldCheck size={13} className="text-emerald-500" />
                        <span>Disetujui Guru</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                        <Clock size={13} className="text-amber-500 animate-pulse" />
                        <span>Menunggu Konfirmasi</span>
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    {p.dicatatOlehNama || 'Bendahara'}
                  </td>
                  {showActionCol && (
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center space-x-2 justify-end">
                        {onApprove && !isApproved && (
                          <button
                            onClick={() => onApprove(p)}
                            disabled={isApprovingId === p.id}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold inline-flex items-center space-x-1 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                            title="Setujui Pembayaran Kas"
                          >
                            <CheckCircle2 size={13} />
                            <span>{isApprovingId === p.id ? 'Memproses...' : 'Setujui Kas'}</span>
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => onDelete(p)}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 hover:border-rose-500/40 transition-all cursor-pointer"
                            title="Hapus Transaksi Kas"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

