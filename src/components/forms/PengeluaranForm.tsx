import React, { useState } from 'react';
import { formatRupiah } from '../../lib/utils/formatCurrency';
import { Calculator, Tag, Percent, DollarSign, AlertCircle, CheckCircle2 } from 'lucide-react';

interface PengeluaranFormProps {
  saldoKasCurrent: number;
  onSubmit: (data: {
    namaBarang: string;
    harga: number;
    jumlah: number;
    potonganHarga?: number;
    totalHarga: number;
    kategori: string;
    tanggal: string;
    buktiUrl?: string;
    keterangan?: string;
  }) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export const PengeluaranForm: React.FC<PengeluaranFormProps> = ({
  saldoKasCurrent,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const [namaBarang, setNamaBarang] = useState('');
  const [harga, setHarga] = useState<number>(15000);
  const [jumlah, setJumlah] = useState<number>(1);
  const [tipeDiskon, setTipeDiskon] = useState<'none' | 'rp' | 'percent'>('none');
  const [nilaiDiskon, setNilaiDiskon] = useState<number>(0);
  const [kategori, setKategori] = useState('Peralatan Kelas');
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [buktiUrl, setBuktiUrl] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [error, setError] = useState('');

  // Calculations
  const subtotal = Math.max(0, harga * jumlah);
  
  let totalPotongan = 0;
  if (tipeDiskon === 'rp') {
    totalPotongan = Math.min(subtotal, Math.max(0, nilaiDiskon));
  } else if (tipeDiskon === 'percent') {
    const pct = Math.min(100, Math.max(0, nilaiDiskon));
    totalPotongan = Math.round((subtotal * pct) / 100);
  }

  const totalHarga = Math.max(0, subtotal - totalPotongan);
  const sisaSaldoSetelahTransaksi = saldoKasCurrent - totalHarga;
  const isSaldoCukup = sisaSaldoSetelahTransaksi >= 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaBarang.trim()) {
      setError('Nama barang / pengeluaran wajib diisi.');
      return;
    }
    if (totalHarga <= 0) {
      setError('Total harga harus lebih dari 0.');
      return;
    }
    if (!isSaldoCukup) {
      setError(`Total belanja (${formatRupiah(totalHarga)}) melebihi saldo kas kelas saat ini (${formatRupiah(saldoKasCurrent)}).`);
      return;
    }

    onSubmit({
      namaBarang,
      harga: Number(harga),
      jumlah: Number(jumlah),
      potonganHarga: totalPotongan > 0 ? totalPotongan : undefined,
      totalHarga,
      kategori,
      tanggal,
      buktiUrl,
      keterangan,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-slate-800 dark:text-slate-100">
      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center space-x-2">
          <AlertCircle size={16} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
          Nama Barang / Rencana Belanja <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          required
          placeholder="contoh: Spidol Whiteboard 3 Pcs, Kertas HVS & Map"
          value={namaBarang}
          onChange={(e) => setNamaBarang(e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Harga Satuan (Rp) <span className="text-rose-500">*</span>
          </label>
          <input
            type="number"
            min={0}
            step="any"
            required
            value={harga}
            onChange={(e) => setHarga(Number(e.target.value))}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none font-numeric"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Jumlah / Qty <span className="text-rose-500">*</span>
          </label>
          <input
            type="number"
            min={1}
            required
            value={jumlah}
            onChange={(e) => setJumlah(Number(e.target.value))}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none font-numeric"
          />
        </div>
      </div>

      {/* Diskon & Potongan Harga */}
      <div className="p-3.5 rounded-2xl bg-purple-500/5 dark:bg-purple-950/20 border border-purple-500/20 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-extrabold text-purple-700 dark:text-purple-300 flex items-center space-x-1.5 font-heading">
            <Tag size={14} />
            <span>Diskon / Potongan Harga</span>
          </label>
          <div className="flex bg-slate-200 dark:bg-slate-800 p-0.5 rounded-lg text-[10px] font-bold">
            <button
              type="button"
              onClick={() => { setTipeDiskon('none'); setNilaiDiskon(0); }}
              className={`px-2 py-1 rounded-md transition-all ${tipeDiskon === 'none' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'}`}
            >
              Tanpa Diskon
            </button>
            <button
              type="button"
              onClick={() => setTipeDiskon('rp')}
              className={`px-2 py-1 rounded-md transition-all ${tipeDiskon === 'rp' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'}`}
            >
              Rupiah (Rp)
            </button>
            <button
              type="button"
              onClick={() => setTipeDiskon('percent')}
              className={`px-2 py-1 rounded-md transition-all ${tipeDiskon === 'percent' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'}`}
            >
              Persen (%)
            </button>
          </div>
        </div>

        {tipeDiskon !== 'none' && (
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              {tipeDiskon === 'rp' ? 'Nominal Potongan (Rp):' : 'Besar Diskon (%):'}
            </span>
            <input
              type="number"
              min={0}
              max={tipeDiskon === 'percent' ? 100 : subtotal}
              step="any"
              value={nilaiDiskon}
              onChange={(e) => setNilaiDiskon(Number(e.target.value))}
              placeholder={tipeDiskon === 'rp' ? '5000' : '10'}
              className="flex-1 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-numeric focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Kategori
          </label>
          <select
            value={kategori}
            onChange={(e) => setKategori(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
          >
            <option value="Peralatan Kelas">Peralatan Kelas</option>
            <option value="Konsumsi Kelas">Konsumsi Kelas</option>
            <option value="Kebersihan">Kebersihan</option>
            <option value="Acara & Kegiatan">Acara & Kegiatan</option>
            <option value="Lainnya">Lainnya</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Tanggal Transaksi
          </label>
          <input
            type="date"
            value={tanggal}
            onChange={(e) => setTanggal(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none font-numeric"
          />
        </div>
      </div>

      {/* Interactive Live Preview Box */}
      <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
          <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 font-heading">
            <Calculator size={15} className="text-purple-600 dark:text-purple-400" />
            <span>Simulasi Preview Pembelian</span>
          </div>
          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${isSaldoCukup ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'}`}>
            {isSaldoCukup ? 'Saldo Kas Cukup' : 'Saldo Tidak Cukup'}
          </span>
        </div>

        <div className="space-y-1.5 text-xs font-numeric">
          <div className="flex justify-between text-slate-500 dark:text-slate-400">
            <span>Subtotal Harga ({jumlah}x @ {formatRupiah(harga)}):</span>
            <span>{formatRupiah(subtotal)}</span>
          </div>

          {totalPotongan > 0 && (
            <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
              <span>Potongan Diskon Belanja:</span>
              <span>- {formatRupiah(totalPotongan)}</span>
            </div>
          )}

          <div className="flex justify-between text-slate-900 dark:text-white font-extrabold text-sm pt-1 border-t border-slate-200 dark:border-slate-800">
            <span>Total Akhir Dipotong:</span>
            <span className="text-rose-600 dark:text-rose-400">- {formatRupiah(totalHarga)}</span>
          </div>

          <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
            <span>Sisa Saldo Kas Setelah Ini:</span>
            <span className={`font-bold ${isSaldoCukup ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-500'}`}>
              {formatRupiah(sisaSaldoSetelahTransaksi)}
            </span>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
          Link URL Foto Struk / Bukti Nota (Opsional)
        </label>
        <input
          type="url"
          placeholder="https://images.unsplash.com/..."
          value={buktiUrl}
          onChange={(e) => setBuktiUrl(e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
          Keterangan Tambahan
        </label>
        <textarea
          rows={2}
          placeholder="Rincian / alasan pengeluaran..."
          value={keterangan}
          onChange={(e) => setKeterangan(e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
        />
      </div>

      <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all cursor-pointer"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !isSaldoCukup}
          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-500/20 transition-all cursor-pointer disabled:opacity-50"
        >
          {isSubmitting ? 'Menyimpan...' : 'Simpan & Potong Saldo'}
        </button>
      </div>
    </form>
  );
};

