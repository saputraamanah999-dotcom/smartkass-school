import React, { useState } from 'react';
import { Siswa } from '../../types';

interface SiswaFormProps {
  initialData?: Partial<Siswa>;
  /**
   * Jurusan & kelas are PASSED IN by the parent page (BendaharaSiswa,
   * AdminSiswa, KasMatrixTable, etc.). The user does NOT pick them —
   * they're implicit from the page context. This matches the user's
   * request: "langsung buat nama dan no absen" (no role selection).
   */
  jurusanId?: string;
  kelasId?: string;
  onSubmit: (data: {
    nama: string;
    noAbsen: number;
    nisn?: string;
    fotoUrl?: string;
    jurusanId?: string;
    kelasId?: string;
  }) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export const SiswaForm: React.FC<SiswaFormProps> = ({
  initialData,
  jurusanId,
  kelasId,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const [nama, setNama] = useState(initialData?.nama || '');
  const [noAbsen, setNoAbsen] = useState<number>(initialData?.noAbsen || 1);
  const [nisn, setNisn] = useState(initialData?.nisn || '');
  const [fotoUrl, setFotoUrl] = useState(initialData?.fotoUrl || '');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) {
      setError('Nama siswa wajib diisi.');
      return;
    }
    if (!noAbsen || noAbsen < 1) {
      setError('Nomor absen minimal 1.');
      return;
    }
    setError('');
    onSubmit({
      nama: nama.trim(),
      noAbsen: Number(noAbsen),
      nisn: nisn.trim(),
      fotoUrl: fotoUrl.trim(),
      jurusanId,
      kelasId,
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
          Nama Lengkap Siswa <span className="text-rose-400">*</span>
        </label>
        <input
          type="text"
          required
          autoFocus
          placeholder="contoh: Ananda Putri"
          value={nama}
          onChange={(e) => setNama(e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Nomor Absen <span className="text-rose-400">*</span>
          </label>
          <input
            type="number"
            min={1}
            step={1}
            required
            value={noAbsen}
            onChange={(e) => setNoAbsen(Number(e.target.value))}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none font-numeric"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            NISN (Opsional)
          </label>
          <input
            type="text"
            inputMode="numeric"
            placeholder="00849200..."
            value={nisn}
            onChange={(e) => setNisn(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none font-numeric"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1">
          Foto Siswa URL (Opsional)
        </label>
        <input
          type="url"
          placeholder="https://images.unsplash.com/..."
          value={fotoUrl}
          onChange={(e) => setFotoUrl(e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        />
        <p className="text-[10px] text-slate-500 mt-1">
          Tidak perlu upload file. Masukkan link URL foto bila ada.
        </p>
      </div>

      {/* Implicit context (read-only display) — no role/jurusan/kelas selection */}
      {(jurusanId || kelasId) && (
        <div className="text-[10px] text-slate-500 bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2 flex items-center gap-2">
          <span className="text-slate-400">Menambahkan ke:</span>
          <span className="font-mono text-amber-400">{jurusanId || '?'}</span>
          <span className="text-slate-600">/</span>
          <span className="font-mono text-emerald-400">{kelasId || '?'}</span>
        </div>
      )}

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
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50"
        >
          {isSubmitting ? 'Menyimpan...' : 'Simpan Siswa'}
        </button>
      </div>
    </form>
  );
};
