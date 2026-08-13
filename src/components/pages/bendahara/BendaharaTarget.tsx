import React, { useEffect, useState } from 'react';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase/config';
import { Kelas, TargetKas } from '../../../types';
import { TargetKasForm } from '../../forms/TargetKasForm';
import { TargetIcon } from '../../icons/CustomIcons';
import { formatRupiah } from '../../../lib/utils/formatCurrency';
import { useAuth } from '../../../contexts/AuthContext';
import { Edit2, Sparkles, Coins, Save, X, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export const BendaharaTarget: React.FC = () => {
  const { user } = useAuth();
  const sekolahId = user?.sekolahId || '';
  const jurusanId = user?.jurusanId || '';
  const kelasId = user?.kelasId || '';

  const [kelas, setKelas] = useState<Kelas | null>(null);
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [showNominalModal, setShowNominalModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit nominal kas mingguan state
  const [editNominal, setEditNominal] = useState<number>(5000);
  const [editKeterangan, setEditKeterangan] = useState<string>('');

  const kelasPath = `sekolah/${sekolahId}/jurusan/${jurusanId}/kelas/${kelasId}`;

  useEffect(() => {
    if (!sekolahId || !jurusanId || !kelasId) return;
    const unsub = onSnapshot(
      doc(db, kelasPath),
      (snap) => {
        if (snap.exists()) {
          const data = { id: snap.id, ...snap.data() } as Kelas;
          setKelas(data);
          setEditNominal(data.nominalKasMingguan || 5000);
          setEditKeterangan(data.keteranganNominalKas || '');
        }
      },
      (err) => {
        console.warn('BendaharaTarget: listener error', err);
      }
    );
    return () => unsub();
  }, [kelasPath]);

  const handleSaveTarget = async (newTarget: TargetKas) => {
    setIsSubmitting(true);
    setShowTargetModal(false);

    try {
      await setDoc(
        doc(db, kelasPath),
        {
          targetKas: newTarget,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      toast.success('Target kas kelas berhasil diperbarui!');
    } catch (e: any) {
      console.error('Error updating target:', e);
      toast.error('Gagal menyimpan target kas: ' + (e?.message || 'unknown'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============ EDIT NOMINAL KAS MINGGUAN (Peraturan Kelas) ============
  // Bendahara dapat mengubah nominal kas mingguan (peraturan kelas).
  // Begitu disimpan, semua checkbox di matriks & form pembayaran akan
  // otomatis memakai nominal baru (e.g. 5k -> 7k).
  const handleSaveNominal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editNominal < 0) {
      toast.error('Nominal kas tidak boleh negatif.');
      return;
    }
    setIsSubmitting(true);
    try {
      await setDoc(
        doc(db, kelasPath),
        {
          nominalKasMingguan: Number(editNominal),
          keteranganNominalKas: editKeterangan.trim(),
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      toast.success(
        `Peraturan kas mingguan kelas diperbarui ke ${formatRupiah(Number(editNominal))} / siswa / minggu. ` +
          `Semua siswa otomatis memakai nominal ini.`
      );
      setShowNominalModal(false);
    } catch (err: any) {
      console.error('Error updating nominal kas:', err);
      toast.error('Gagal menyimpan nominal kas: ' + (err?.message || 'unknown'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const target = kelas?.targetKas || {
    tujuan: 'Belum ada target kas kelas. Atur sekarang!',
    nominalTarget: 2500000,
    deadline: '2026-12-20',
    keterangan: '',
  };

  // ============ FREKUENSI KAS ============
  const frekuensiOptions: { value: 'harian' | 'mingguan' | '2x-per-2minggu'; label: string; desc: string }[] = [
    { value: 'mingguan', label: 'Mingguan (4x / bulan)', desc: 'Default. Bayar setiap minggu, 4 minggu per bulan.' },
    { value: 'harian', label: 'Harian', desc: 'Bayar setiap hari sekolah. Header matriks jadi per-hari.' },
    { value: '2x-per-2minggu', label: '2x Per 2 Minggu', desc: 'Bayar 2 kali per bulan, setiap 2 minggu sekali.' },
  ];

  const currentFrekuensi = kelas?.frekuensiKas || 'mingguan';

  const handleSaveFrekuensi = async (value: 'harian' | 'mingguan' | '2x-per-2minggu') => {
    try {
      await setDoc(
        doc(db, kelasPath),
        { frekuensiKas: value, updatedAt: new Date().toISOString() },
        { merge: true }
      );
      const opt = frekuensiOptions.find(o => o.value === value);
      toast.success(`Frekuensi kas diubah ke: ${opt?.label}`);
    } catch (err: any) {
      toast.error('Gagal mengubah frekuensi: ' + (err?.message || ''));
    }
  };

  const saldo = kelas?.saldoSaatIni || 0;
  const nominalKasMingguan = kelas?.nominalKasMingguan || 5000;
  const percent = Math.min(100, Math.round((saldo / (target.nominalTarget || 1)) * 100));

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white font-heading">
            Target & Peraturan Uang Kas Kelas
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Bendahara mengatur nominal kas mingguan & target tabungan kelas
          </p>
        </div>
        <button
          onClick={() => setShowTargetModal(true)}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center space-x-2 shadow-lg shadow-indigo-500/20"
        >
          <Edit2 size={16} />
          <span>Atur Target Kas</span>
        </button>
      </div>

      {/* ===== PERATURAN KAS MINGGUAN (NEW!) ===== */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-950/40 to-slate-900/90 border border-amber-500/30 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start space-x-4">
            <div className="p-3.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex-shrink-0">
              <Coins size={32} />
            </div>
            <div>
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                PERATURAN KAS MINGGUAN
              </span>
              <h3 className="text-lg font-extrabold text-white font-heading">
                {formatRupiah(nominalKasMingguan)} / Siswa / Minggu
              </h3>
              {kelas?.keteranganNominalKas ? (
                <p className="text-xs text-slate-400 mt-1">{kelas.keteranganNominalKas}</p>
              ) : (
                <p className="text-xs text-slate-500 mt-1">
                  Nominal ini dipakai otomatis di seluruh checkbox matriks & form
                  pembayaran untuk semua siswa di kelas ini.
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => {
              setEditNominal(nominalKasMingguan);
              setEditKeterangan(kelas?.keteranganNominalKas || '');
              setShowNominalModal(true);
            }}
            className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-amber-500/20 shrink-0"
          >
            <Edit2 size={14} />
            <span>Edit Peraturan</span>
          </button>
        </div>

        {/* Quick nominal presets */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-amber-500/20">
          <span className="text-[10px] text-amber-400/80 self-center font-semibold">
            Quick Set:
          </span>
          {[2000, 3000, 5000, 7000, 10000, 15000, 20000].map((amt) => (
            <button
              key={amt}
              onClick={async () => {
                setEditNominal(amt);
                try {
                  await setDoc(
                    doc(db, kelasPath),
                    {
                      nominalKasMingguan: amt,
                      updatedAt: new Date().toISOString(),
                    },
                    { merge: true }
                  );
                  toast.success(`Nominal kas diubah ke ${formatRupiah(amt)} / minggu`);
                } catch (err: any) {
                  toast.error('Gagal mengubah nominal: ' + (err?.message || ''));
                }
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                nominalKasMingguan === amt
                  ? 'bg-amber-500 text-slate-950 border border-amber-400'
                  : 'bg-slate-950 text-amber-400 border border-amber-500/30 hover:bg-amber-500/10'
              }`}
            >
              {amt / 1000}k
            </button>
          ))}
        </div>
      </div>

      {/* ===== FREKUENSI PEMBAYARAN KAS ===== */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-950/40 to-slate-900/90 border border-emerald-500/30 space-y-4">
        <div className="flex items-center space-x-4">
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex-shrink-0">
            <RefreshCw size={32} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
              FREKUENSI PEMBAYARAN KAS
            </span>
            <h3 className="text-lg font-extrabold text-white font-heading">
              {frekuensiOptions.find(o => o.value === currentFrekuensi)?.label}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {frekuensiOptions.find(o => o.value === currentFrekuensi)?.desc}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-emerald-500/20">
          {frekuensiOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleSaveFrekuensi(opt.value)}
              className={`p-3 rounded-xl text-left transition-all cursor-pointer ${
                currentFrekuensi === opt.value
                  ? 'bg-emerald-500 text-slate-950 border border-emerald-400 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-950 text-slate-300 border border-emerald-500/20 hover:bg-emerald-500/10 hover:border-emerald-500/40'
              }`}
            >
              <span className="text-xs font-bold block">{opt.label}</span>
              <span className={`text-[10px] block mt-0.5 ${currentFrekuensi === opt.value ? 'text-slate-950/70' : 'text-slate-500'}`}>
                {opt.desc}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ===== TARGET KAS ===== */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-6 backdrop-blur-md">
        <div className="flex items-start space-x-4">
          <div className="p-3.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex-shrink-0">
            <TargetIcon size={32} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
              TARGET AKTIF
            </span>
            <h3 className="text-lg font-extrabold text-white font-heading">{target.tujuan}</h3>
            {target.keterangan && (
              <p className="text-xs text-slate-400 mt-1">{target.keterangan}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">Progres Pengumpulan Dana:</span>
            <span className="text-indigo-400 font-extrabold font-numeric">{percent}% Selesai</span>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-4 p-0.5 border border-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 transition-all duration-1000"
              style={{ width: `${percent}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-xs font-numeric text-slate-400 pt-1">
            <span>
              Terkumpul: <strong className="text-emerald-400">{formatRupiah(saldo)}</strong>
            </span>
            <span>
              Tenggat: <strong className="text-white">{target.deadline || '20 Des 2026'}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* ===== MODAL: EDIT NOMINAL KAS MINGGUAN ===== */}
      {showNominalModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-white font-heading flex items-center gap-2">
                  <Coins size={18} className="text-amber-400" />
                  Edit Peraturan Nominal Kas
                </h3>
                <p className="text-[11px] text-slate-400 mt-1">
                  Ubah nominal kas mingguan untuk semua siswa di kelas {kelasId?.toUpperCase()}.
                  Semua checkbox & form pembayaran otomatis memakai nominal baru.
                </p>
              </div>
              <button
                onClick={() => setShowNominalModal(false)}
                className="text-slate-500 hover:text-slate-300 p-1"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveNominal} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nominal Kas Mingguan (Rp) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  min={0}
                  step="any"
                  required
                  value={editNominal}
                  onChange={(e) => setEditNominal(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none font-numeric"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Contoh: 5000 (Rp 5.000/minggu), 7000 (Rp 7.000/minggu), dst.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Keterangan Peraturan (Opsional)
                </label>
                <textarea
                  rows={2}
                  placeholder="contoh: Kas kelas X TJKT 1 ditetapkan Rp 7.000 per minggu mulai semester ganjil 2026/2027"
                  value={editKeterangan}
                  onChange={(e) => setEditKeterangan(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNominalModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Save size={14} />
                  {isSubmitting ? 'Menyimpan...' : 'Simpan & Terapkan ke Semua Siswa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== MODAL: EDIT TARGET KAS ===== */}
      {showTargetModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white font-heading">Atur Target Kas Kelas Baru</h3>
            <TargetKasForm
              initialTarget={target}
              onSubmit={handleSaveTarget}
              onCancel={() => setShowTargetModal(false)}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
      )}
    </div>
  );
};
