import React, { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase/config';

interface KelasFormProps {
  sekolahList: { id: string; nama: string }[];
  sekolahId: string;
  onSubmit: (data: {
    nama: string;
    sekolahId: string;
    jurusanId: string;
    nominalKasMingguan: number;
    guruNama: string;
    guruEmail: string;
    guruPassword: string;
    bendaharaNama: string;
    bendaharaEmail: string;
    bendaharaPassword: string;
  }) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export const KelasForm: React.FC<KelasFormProps> = ({
  sekolahList,
  sekolahId,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const [nama, setNama] = useState('');
  const [selectedSekolahId, setSelectedSekolahId] = useState(sekolahId);
  const [jurusanId, setJurusanId] = useState('');
  const [nominalKasMingguan, setNominalKasMingguan] = useState<number>(5000);

  // Guru Wali
  const [guruNama, setGuruNama] = useState('');
  const [guruEmail, setGuruEmail] = useState('');
  const [guruPassword, setGuruPassword] = useState('');

  // Bendahara
  const [bendaharaNama, setBendaharaNama] = useState('');
  const [bendaharaEmail, setBendaharaEmail] = useState('');
  const [bendaharaPassword, setBendaharaPassword] = useState('');

  const [error, setError] = useState('');

  // Load jurusan from Firestore for the selected sekolah
  const [jurusanList, setJurusanList] = useState<{ id: string; nama: string; sekolahId: string }[]>([]);

  useEffect(() => {
    if (!selectedSekolahId) return;
    const unsub = onSnapshot(
      collection(db, `sekolah/${selectedSekolahId}/jurusan`),
      (snap) => {
        const list = snap.docs.map((d) => {
          const data = d.data();
          return { id: d.id, nama: data.nama || '', sekolahId: data.sekolahId || selectedSekolahId };
        });
        setJurusanList(list);
        // Auto-select first jurusan if none selected
        if (!jurusanId && list.length > 0) {
          setJurusanId(list[0].id);
        }
      },
      (err) => {
        console.warn('Error loading jurusan:', err);
        setJurusanList([]);
      }
    );
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSekolahId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) {
      setError('Nama kelas wajib diisi (mis. XI TJKT 1).');
      return;
    }
    if (!jurusanId) {
      setError('Pilih jurusan terlebih dahulu. Buat jurusan dulu di menu "Kelola Jurusan" jika belum ada.');
      return;
    }
    if (!guruNama.trim() || !guruEmail.trim()) {
      setError('Nama dan Email Guru Wali Kelas wajib diisi.');
      return;
    }
    if (!guruPassword || guruPassword.length < 6) {
      setError('Password Guru minimal 6 karakter.');
      return;
    }
    if (!bendaharaNama.trim() || !bendaharaEmail.trim()) {
      setError('Nama dan Email Bendahara Kelas wajib diisi.');
      return;
    }
    if (!bendaharaPassword || bendaharaPassword.length < 6) {
      setError('Password Bendahara minimal 6 karakter.');
      return;
    }

    onSubmit({
      nama,
      sekolahId: selectedSekolahId,
      jurusanId,
      nominalKasMingguan: Number(nominalKasMingguan),
      guruNama,
      guruEmail,
      guruPassword,
      bendaharaNama,
      bendaharaEmail,
      bendaharaPassword,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">{error}</div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Pilih Sekolah</label>
          <select value={selectedSekolahId} onChange={(e) => setSelectedSekolahId(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs">
            {sekolahList.map((s) => (
              <option key={s.id} value={s.id}>{s.nama}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Pilih Jurusan</label>
          <select value={jurusanId} onChange={(e) => setJurusanId(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs">
            {jurusanList.length === 0 ? (
              <option value="">-- Belum ada jurusan --</option>
            ) : (
              jurusanList.map((j) => (
                <option key={j.id} value={j.id}>{j.nama}</option>
              ))
            )}
          </select>
          {jurusanList.length === 0 && (
            <p className="text-[10px] text-amber-400 mt-1">Buat jurusan dulu di menu "Kelola Jurusan"!</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Nama Kelas <span className="text-rose-400">*</span></label>
          <input type="text" required placeholder="contoh: XI TJKT 1" value={nama} onChange={(e) => setNama(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Nominal Kas Mingguan (Rp)</label>
          <input type="number" step="any" min={0} value={nominalKasMingguan} onChange={(e) => setNominalKasMingguan(Number(e.target.value))} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-numeric" />
        </div>
      </div>

      {/* Guru Wali */}
      <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 space-y-2">
        <p className="text-xs font-bold text-purple-300">Akun Guru Wali Kelas</p>
        <div className="grid grid-cols-1 gap-2">
          <input type="text" placeholder="Nama Guru Wali..." value={guruNama} onChange={(e) => setGuruNama(e.target.value)} className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs" />
          <input type="email" placeholder="guru.email@smartkas.sch.id" value={guruEmail} onChange={(e) => setGuruEmail(e.target.value)} className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs" />
          <input type="password" placeholder="Password login guru (min. 6 karakter)" value={guruPassword} onChange={(e) => setGuruPassword(e.target.value)} className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs" />
        </div>
      </div>

      {/* Bendahara */}
      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-2">
        <p className="text-xs font-bold text-amber-300">Akun Bendahara Kelas</p>
        <div className="grid grid-cols-1 gap-2">
          <input type="text" placeholder="Nama Bendahara..." value={bendaharaNama} onChange={(e) => setBendaharaNama(e.target.value)} className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs" />
          <input type="email" placeholder="bendahara.email@smartkas.sch.id" value={bendaharaEmail} onChange={(e) => setBendaharaEmail(e.target.value)} className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs" />
          <input type="password" placeholder="Password login bendahara (min. 6 karakter)" value={bendaharaPassword} onChange={(e) => setBendaharaPassword(e.target.value)} className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs" />
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold">Batal</button>
        <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-500/20">{isSubmitting ? 'Memproses...' : 'Buat Kelas & Akun'}</button>
      </div>
    </form>
  );
};
