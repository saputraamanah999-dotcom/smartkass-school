import React, { useState, useMemo } from 'react';
import { Siswa, StatusPembayaran } from '../../types';
import { formatRupiah } from '../../lib/utils/formatCurrency';
import { Info, Zap } from 'lucide-react';

interface PembayaranFormProps {
  siswaList: Siswa[];
  nominalKasMingguan: number;
  currentMinggu: number;
  onSubmit: (data: {
    siswaId: string;
    siswaNama: string;
    siswaNoAbsen: number;
    nominal: number;
    mingguKe: number;
    bulan: string;
    jumlahMinggu: number;
    status: StatusPembayaran;
    keterangan?: string;
  }) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

/** Generate 12 months: January to December of the given year */
function generateBulanOptions(year: number): string[] {
  const namaBulan = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];
  return namaBulan.map((b) => `${b} ${year}`);
}

export const PembayaranForm: React.FC<PembayaranFormProps> = ({
  siswaList,
  nominalKasMingguan,
  currentMinggu,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const currentYear = new Date().getFullYear();
  const BULAN_OPTIONS = useMemo(() => generateBulanOptions(currentYear), [currentYear]);

  // Default to current month
  const currentMonthName = new Date().toLocaleString('id-ID', { month: 'long' });
  const defaultBulan = `${currentMonthName} ${currentYear}`;

  const [selectedSiswaId, setSelectedSiswaId] = useState(siswaList[0]?.id || '');
  const [jumlahMinggu, setJumlahMinggu] = useState<number>(1);
  const [mulaiMingguKe, setMulaiMingguKe] = useState<number>(currentMinggu);
  const [selectedBulan, setSelectedBulan] = useState(() => {
    const found = BULAN_OPTIONS.find((b) => b.toLowerCase() === defaultBulan.toLowerCase());
    return found || BULAN_OPTIONS[0];
  });
  const [keterangan, setKeterangan] = useState('');
  const [error, setError] = useState('');

  const selectedSiswa = siswaList.find((s) => s.id === selectedSiswaId);

  // Auto-calculate nominal based on jumlah minggu
  const nominal = jumlahMinggu * nominalKasMingguan;

  // Status otomatis
  let calculatedStatus: StatusPembayaran = 'lunas';
  if (nominal >= nominalKasMingguan) {
    calculatedStatus = 'lunas';
  } else if (nominal > 0) {
    calculatedStatus = 'dicicil';
  } else {
    calculatedStatus = 'belum';
  }

  // Minggu yang akan dicentang otomatis
  const mingguList = useMemo(() => {
    const list: number[] = [];
    for (let i = 0; i < jumlahMinggu; i++) {
      const m = mulaiMingguKe + i;
      if (m <= 4) list.push(m);
    }
    return list;
  }, [jumlahMinggu, mulaiMingguKe]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSiswa) {
      setError('Pilih siswa terlebih dahulu.');
      return;
    }
    if (jumlahMinggu < 1) {
      setError('Jumlah minggu minimal 1.');
      return;
    }
    if (mulaiMingguKe < 1 || mulaiMingguKe > 4) {
      setError('Minggu ke harus antara 1-4.');
      return;
    }
    if (mulaiMingguKe + jumlahMinggu - 1 > 4) {
      setError(`Minggu ${mulaiMingguKe + jumlahMinggu - 1} melebihi batas 4 minggu per bulan.`);
      return;
    }

    onSubmit({
      siswaId: selectedSiswa.id,
      siswaNama: selectedSiswa.nama,
      siswaNoAbsen: selectedSiswa.noAbsen,
      nominal: Number(nominal),
      mingguKe: Number(mulaiMingguKe),
      bulan: selectedBulan,
      jumlahMinggu: Number(jumlahMinggu),
      status: calculatedStatus,
      keterangan,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
          {error}
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1">
          Pilih Siswa <span className="text-rose-400">*</span>
        </label>
        <select
          value={selectedSiswaId}
          onChange={(e) => setSelectedSiswaId(e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        >
          {siswaList.map((s) => (
            <option key={s.id} value={s.id}>
              Absen #{s.noAbsen} - {s.nama}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1">
          Bulan Setoran <span className="text-rose-400">*</span>
        </label>
        <select
          value={selectedBulan}
          onChange={(e) => setSelectedBulan(e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-amber-400 text-xs font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
        >
          {BULAN_OPTIONS.map((b) => (
            <option key={b} value={b} className="bg-slate-900 text-amber-400">{b}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Mulai Minggu Ke- <span className="text-rose-400">*</span>
          </label>
          <select
            value={mulaiMingguKe}
            onChange={(e) => setMulaiMingguKe(Number(e.target.value))}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none font-numeric"
          >
            {[1, 2, 3, 4].map((m) => (
              <option key={m} value={m}>Minggu {m}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
          Jumlah Minggu <span className="text-rose-400">*</span>
          </label>
          <select
            value={jumlahMinggu}
            onChange={(e) => setJumlahMinggu(Number(e.target.value))}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none font-numeric"
          >
            {[1, 2, 3, 4].map((n) => (
              <option key={n} value={n} disabled={mulaiMingguKe + n - 1 > 4}>{n} Minggu{n > 1 ? ` (${n * nominalKasMingguan.toLocaleString('id-ID')})` : ''}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Auto-Calculate Preview */}
      <div className="p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/20 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Zap size={14} className="text-indigo-400" />
            <span className="text-xs font-semibold text-indigo-300">Otomatis Dihitung:</span>
          </div>
          <span className="text-sm font-extrabold text-white font-numeric">{formatRupiah(nominal)}</span>
        </div>
        <div className="text-[11px] text-slate-400">
          {jumlahMinggu} minggu x {formatRupiah(nominalKasMingguan)} = {formatRupiah(nominal)}
        </div>
        {jumlahMinggu > 1 && (
          <div className="flex items-center gap-1.5 mt-1">
            <Info size={12} className="text-emerald-400" />
            <span className="text-[10px] text-emerald-400 font-medium">
              Checkbox Minggu {mingguList.map(m => `M${m}`).join(', ')} akan kecentang otomatis di matriks
            </span>
          </div>
        )}
      </div>

      {/* Dynamic Status Preview Badge */}
      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
        <span className="text-xs text-slate-400">Status Otomatis:</span>
        <span
          className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
            calculatedStatus === 'lunas'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
          }`}
        >
          {calculatedStatus} ({formatRupiah(nominal)} / {formatRupiah(nominalKasMingguan)}/mg)
        </span>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1">
          Catatan / Keterangan (Opsional)
        </label>
        <input
          type="text"
          placeholder="contoh: Bayar 2 minggu sekaligus, titip teman"
          value={keterangan}
          onChange={(e) => setKeterangan(e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        />
      </div>

      <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
        >
          {isSubmitting ? 'Menyimpan...' : `Simpan Setoran (${jumlahMinggu} Mg)`}
        </button>
      </div>
    </form>
  );
};
