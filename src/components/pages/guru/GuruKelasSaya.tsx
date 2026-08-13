import React, { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase/config';
import { Kelas, Siswa, Pembayaran } from '../../../types';
import { useAuth } from '../../../contexts/AuthContext';
import { SiswaTable } from '../../tables/SiswaTable';
import { KasMatrixTable } from '../../tables/KasMatrixTable';
import { CheckSquare, Users, UserPlus, X, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSafeDoc, useSafeCollection, usePembayaranKelas } from '../../../hooks/useSafeCollection';
import { safeStr } from '../../../lib/utils/safeString';

export const GuruKelasSaya: React.FC = () => {
  const { user, createAccount } = useAuth();
  const jurusanId = user?.jurusanId || '';
  const kelasId = user?.kelasId || '';
  const sekolahId = user?.sekolahId || '';

  // === Safe Firestore hooks (realtime from Firebase) ===
  const { data: kelas } = useSafeDoc<Kelas>(
    `sekolah/${sekolahId}/jurusan/${jurusanId}/kelas/${kelasId}`,
    null
  );

  const siswaPath = (sekolahId && jurusanId && kelasId)
    ? `sekolah/${sekolahId}/jurusan/${jurusanId}/kelas/${kelasId}/siswa`
    : '';

  const { data: siswaListRaw } = useSafeCollection<Siswa & { _docPath?: string }>(siswaPath, undefined);
  const { data: pembayaranListRaw } = usePembayaranKelas<Pembayaran>(sekolahId, jurusanId, kelasId);

  const siswaList = siswaListRaw;
  const pembayaranList = pembayaranListRaw;

  const [activeTab, setActiveTab] = useState<'matrix' | 'table'>('matrix');

  // Bendahara Modal state
  const [showBendaharaModal, setShowBendaharaModal] = useState(false);
  const [namaBendahara, setNamaBendahara] = useState('');
  const [emailBendahara, setEmailBendahara] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Siswa Modal state
  const [showSiswaModal, setShowSiswaModal] = useState(false);
  const [namaSiswa, setNamaSiswa] = useState('');
  const [noAbsenSiswa, setNoAbsenSiswa] = useState<number>(1);

  const handleCreateSiswa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaSiswa.trim()) return;

    setIsSubmitting(true);
    try {
      const siswaId = `sis-${Date.now()}`;
      const siswaRef = doc(db, `sekolah/${sekolahId}/jurusan/${jurusanId}/kelas/${kelasId}/siswa`, siswaId);
      await setDoc(siswaRef, {
        id: siswaId,
        nama: namaSiswa.trim(),
        noAbsen: Number(noAbsenSiswa) || 1,
        kelasId,
        jurusanId,
        sekolahId,
        createdAt: new Date().toISOString(),
      });

      toast.success(`Siswa "${namaSiswa.trim()}" berhasil ditambahkan!`);
      setShowSiswaModal(false);
      setNamaSiswa('');
      setNoAbsenSiswa((prev) => prev + 1);
    } catch (err: any) {
      console.error('Error creating student:', err);
      toast.error(err.message || 'Gagal menambahkan siswa.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateBendahara = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaBendahara.trim() || !emailBendahara.trim()) {
      toast.error('Nama dan email bendahara wajib diisi!');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailBendahara.trim())) {
      toast.error('Format email bendahara tidak valid (contoh: bendahara@sekolah.sch.id)!');
      return;
    }

    if (namaBendahara.trim().length < 3) {
      toast.error('Nama bendahara minimal 3 karakter!');
      return;
    }

    setIsSubmitting(true);
    try {
      await createAccount({
        nama: namaBendahara.trim(),
        email: emailBendahara.trim().toLowerCase(),
        role: 'bendahara',
        sekolahId,
        jurusanId,
        kelasId,
      });

      toast.success(`Akun Bendahara Kelas "${namaBendahara.trim()}" berhasil dibuat!`);
      setShowBendaharaModal(false);
      setNamaBendahara('');
      setEmailBendahara('');
    } catch (err: any) {
      console.error('Error creating bendahara account:', err);
      toast.error(err.message || 'Gagal membuat akun bendahara.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white font-heading">
            Kelas Saya: {kelas?.nama || kelasId.toUpperCase()} ({jurusanId.toUpperCase()})
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Pengawasan daftar siswa, penginputan, dan status matriks kas mingguan.
          </p>
        </div>

        {/* Tab Switcher & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowSiswaModal(true)}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <UserPlus size={15} />
            <span>+ Tambah Siswa Baru</span>
          </button>

          <button
            onClick={() => setShowBendaharaModal(true)}
            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center space-x-1.5 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
          >
            <UserPlus size={15} />
            <span>+ Buat Akun Bendahara Kelas</span>
          </button>

          <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 p-1 rounded-2xl">
            <button
              onClick={() => setActiveTab('matrix')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                activeTab === 'matrix'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <CheckSquare size={15} />
              <span>Matriks Checkbox</span>
            </button>
            <button
              onClick={() => setActiveTab('table')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                activeTab === 'table'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users size={15} />
              <span>Daftar Siswa Detail</span>
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'matrix' ? (
        <KasMatrixTable
          sekolahId={sekolahId}
          jurusanId={jurusanId}
          kelasId={kelasId}
          kelasData={kelas}
          siswaList={siswaList}
          pembayaranList={pembayaranList}
          nominalKasMingguan={kelas?.nominalKasMingguan || 5000}
          isEditable={true}
        />
      ) : (
        <SiswaTable
          siswaList={siswaList}
          pembayaranList={pembayaranList}
          nominalKasMingguan={kelas?.nominalKasMingguan || 5000}
          currentMinggu={4}
        />
      )}

      {/* Modal Create Bendahara by Guru */}
      {showBendaharaModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <UserPlus size={18} />
                </div>
                <h3 className="text-base font-bold text-white font-heading">
                  Buat Akun Bendahara Kelas Saya
                </h3>
              </div>
              <button onClick={() => setShowBendaharaModal(false)} className="text-slate-400 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Akun Bendahara yang dibuat akan secara otomatis terhubung ke kelas <strong className="text-white">{kelas?.nama || kelasId.toUpperCase()}</strong>.
            </p>

            <form onSubmit={handleCreateBendahara} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nama Lengkap Bendahara <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Fitri Bendahara"
                  value={namaBendahara}
                  onChange={(e) => setNamaBendahara(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Email Login Bendahara <span className="text-rose-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="bendahara.kelas@smartkas.sch.id"
                  value={emailBendahara}
                  onChange={(e) => setEmailBendahara(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none font-numeric"
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 flex items-center space-x-2">
                <ShieldCheck size={16} className="flex-shrink-0" />
                <span>Default password untuk login baru adalah: <strong>123456</strong></span>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowBendaharaModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
                >
                  {isSubmitting ? 'Memproses...' : 'Buat Akun Bendahara'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal Create Siswa by Guru */}
      {showSiswaModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <UserPlus size={18} />
                </div>
                <h3 className="text-base font-bold text-white font-heading">
                  Tambah Siswa Baru Ke Kelas
                </h3>
              </div>
              <button onClick={() => setShowSiswaModal(false)} className="text-slate-400 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Siswa baru akan secara otomatis terdaftar di kelas <strong className="text-white">{kelas?.nama || kelasId.toUpperCase()}</strong>.
            </p>

            <form onSubmit={handleCreateSiswa} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nomor Absen <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={noAbsenSiswa}
                  onChange={(e) => setNoAbsenSiswa(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nama Lengkap Siswa <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Ahmad Rizky"
                  value={namaSiswa}
                  onChange={(e) => setNamaSiswa(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowSiswaModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                >
                  {isSubmitting ? 'Memproses...' : 'Simpan Data Siswa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
