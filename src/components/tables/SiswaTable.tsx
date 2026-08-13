import React from 'react';
import { Siswa, Pembayaran } from '../../types';
import { formatRupiah } from '../../lib/utils/formatCurrency';
import { getStatusBadgeStyle } from '../../lib/utils/calculateStatus';
import { Edit2, Trash2, CheckCircle2 } from 'lucide-react';

interface SiswaTableProps {
  siswaList: Siswa[];
  pembayaranList: Pembayaran[];
  nominalKasMingguan: number;
  currentMinggu: number;
  onEdit?: (s: Siswa) => void;
  onDelete?: (id: string) => void;
  onPayForSiswa?: (s: Siswa) => void;
}

export const SiswaTable: React.FC<SiswaTableProps> = ({
  siswaList,
  pembayaranList,
  nominalKasMingguan,
  currentMinggu,
  onEdit,
  onDelete,
  onPayForSiswa,
}) => {
  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
      <table className="w-full text-xs text-left text-slate-300">
        <thead className="text-[11px] text-slate-400 bg-slate-950/80 uppercase tracking-wider border-b border-slate-800">
          <tr>
            <th className="px-4 py-3.5 font-bold">No. Absen</th>
            <th className="px-4 py-3.5 font-bold">Siswa</th>
            <th className="px-4 py-3.5 font-bold">Total Terbayar</th>
            <th className="px-4 py-3.5 font-bold">Status Minggu Ini (M{currentMinggu})</th>
            <th className="px-4 py-3.5 font-bold text-right">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60">
          {siswaList.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                Belum ada data siswa di kelas ini. Klik tombol Tambah Siswa untuk menginput.
              </td>
            </tr>
          ) : (
            siswaList.map((s) => {
              const pSiswa = pembayaranList.filter(
                (p) => (p.siswaId || '').toLowerCase() === (s.id || '').toLowerCase()
              );
              const totalBayar = pSiswa.reduce((acc, p) => acc + (p.nominal || 0), 0);
              
              const currentWeekPay = pSiswa.find((p) => p.mingguKe === currentMinggu);
              let statusThisWeek = currentWeekPay
                ? currentWeekPay.status
                : currentMinggu > 1
                ? 'telat'
                : 'belum';

              const badge = getStatusBadgeStyle(statusThisWeek);

              return (
                <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3 font-extrabold text-indigo-400 font-numeric">
                    #{s.noAbsen}
                  </td>
                  <td className="px-4 py-3 font-medium text-white">
                    <div className="flex items-center space-x-3">
                      {s.fotoUrl ? (
                        <img src={s.fotoUrl} alt={s.nama} className="w-8 h-8 rounded-full object-cover border border-slate-700" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-indigo-300 font-bold text-xs">
                          {s.nama.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="font-semibold">{s.nama}</p>
                          <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[9px] font-bold uppercase">
                            {(s.kelasId || 'XI TJKT 1').toUpperCase()}
                          </span>
                        </div>
                        {s.nisn && <p className="text-[10px] text-slate-500 font-numeric">NISN: {s.nisn}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-bold text-emerald-400 font-numeric">
                    {formatRupiah(totalBayar)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold border uppercase tracking-wider ${badge.bg}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                      <span>{badge.label}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end space-x-1">
                      {onPayForSiswa && (
                        <button
                          onClick={() => onPayForSiswa(s)}
                          className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-semibold flex items-center space-x-1 transition-all"
                          title="Bayar Kas"
                        >
                          <CheckCircle2 size={13} />
                          <span>Bayar</span>
                        </button>
                      )}
                      {onEdit && (
                        <button
                          onClick={() => onEdit(s)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
                          title="Edit Siswa"
                        >
                          <Edit2 size={14} />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(s.id)}
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-all"
                          title="Hapus Siswa"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};
