import React from 'react';
import { Pengeluaran } from '../../types';
import { formatRupiah } from '../../lib/utils/formatCurrency';
import { formatDate } from '../../lib/utils/formatDate';
import { ExternalLink, Trash2 } from 'lucide-react';

interface PengeluaranTableProps {
  pengeluaranList: Pengeluaran[];
  onDelete?: (pengeluaran: Pengeluaran) => void;
}

export const PengeluaranTable: React.FC<PengeluaranTableProps> = ({ pengeluaranList, onDelete }) => {
  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/60 backdrop-blur-md shadow-sm transition-colors">
      <table className="w-full text-xs text-left text-slate-700 dark:text-slate-300">
        <thead className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-950/80 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
          <tr>
            <th className="px-4 py-3.5 font-bold">Tanggal</th>
            <th className="px-4 py-3.5 font-bold">Keperluan / Barang</th>
            <th className="px-4 py-3.5 font-bold">Kategori</th>
            <th className="px-4 py-3.5 font-bold">Qty</th>
            <th className="px-4 py-3.5 font-bold">Total Harga</th>
            <th className="px-4 py-3.5 font-bold">Bukti Struk</th>
            <th className="px-4 py-3.5 font-bold">Dicatat Oleh</th>
            {onDelete && <th className="px-4 py-3.5 font-bold text-right">Aksi</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
          {pengeluaranList.length === 0 ? (
            <tr>
              <td colSpan={onDelete ? 8 : 7} className="px-4 py-8 text-center text-slate-400 dark:text-slate-500">
                Belum ada data pengeluaran kas tercatat.
              </td>
            </tr>
          ) : (
            pengeluaranList.map((ex) => (
              <tr key={ex.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                <td className="px-4 py-3 font-numeric text-slate-500 dark:text-slate-400">
                  {formatDate(ex.tanggal || ex.createdAt)}
                </td>
                <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                  {ex.namaBarang}
                  {ex.keterangan && (
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">{ex.keterangan}</p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] text-indigo-600 dark:text-indigo-300 font-medium">
                    {ex.kategori}
                  </span>
                </td>
                <td className="px-4 py-3 font-numeric text-slate-700 dark:text-slate-300">
                  {ex.jumlah}x
                </td>
                <td className="px-4 py-3 font-extrabold text-rose-600 dark:text-rose-400 font-numeric">
                  - {formatRupiah(ex.totalHarga)}
                </td>
                <td className="px-4 py-3">
                  {ex.buktiUrl ? (
                    <a
                      href={ex.buktiUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 text-indigo-600 dark:text-indigo-400 hover:underline text-[11px] font-semibold"
                    >
                      <span>Lihat Struk</span>
                      <ExternalLink size={12} />
                    </a>
                  ) : (
                    <span className="text-slate-400 dark:text-slate-600 text-[10px] italic">Tanpa Foto</span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                  {ex.dicatatOlehNama || 'Guru Wali'}
                </td>
                {onDelete && (
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => onDelete(ex)}
                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 hover:border-rose-500/40 transition-all cursor-pointer"
                      title="Hapus Pengeluaran"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
