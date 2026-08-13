import React, { useState } from 'react';
import { TargetKas } from '../../types';
import { formatRupiah } from '../../lib/utils/formatCurrency';

interface TargetKasFormProps {
  initialTarget?: TargetKas;
  onSubmit: (target: TargetKas) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export const TargetKasForm: React.FC<TargetKasFormProps> = ({
  initialTarget,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const [tujuan, setTujuan] = useState(initialTarget?.tujuan || '');
  const [nominalTarget, setNominalTarget] = useState<number>(initialTarget?.nominalTarget || 1000000);
  const [deadline, setDeadline] = useState(initialTarget?.deadline || '');
  const [keterangan, setKeterangan] = useState(initialTarget?.keterangan || '');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tujuan.trim()) {
      setError('Tujuan / target kas wajib diisi.');
      return;
    }
    if (nominalTarget <= 0) {
      setError('Nominal target harus lebih dari 0.');
      return;
    }

    onSubmit({
      tujuan,
      nominalTarget: Number(nominalTarget),
      deadline,
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
          Tujuan / Penggunaan Kas <span className="text-rose-400">*</span>
        </label>
        <input
          type="text"
          required
          placeholder="contoh: Study Tour & Family Gathering Kelas XI"
          value={tujuan}
          onChange={(e) => setTujuan(e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Nominal Target (Rp) <span className="text-rose-400">*</span>
          </label>
          <input
            type="number"
            min={0}
            step="any"
            required
            value={nominalTarget}
            onChange={(e) => setNominalTarget(Number(e.target.value))}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none font-numeric"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Tenggat Waktu / Deadline
          </label>
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none font-numeric"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1">
          Keterangan Rencana
        </label>
        <textarea
          rows={2}
          placeholder="Rincian peruntukan dana kas..."
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
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50"
        >
          {isSubmitting ? 'Menyimpan...' : 'Set Target Kas'}
        </button>
      </div>
    </form>
  );
};
