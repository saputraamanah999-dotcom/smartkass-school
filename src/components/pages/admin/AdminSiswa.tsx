import React, { useMemo, useState } from 'react';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase/config';
import { Siswa, Pembayaran, Kelas } from '../../../types';
import { SiswaTable } from '../../tables/SiswaTable';
import { SiswaForm } from '../../forms/SiswaForm';
import { DeleteConfirmModal } from '../../shared/DeleteConfirmModal';
import { AdminRekapKasSemuaKelas } from '../../shared/AdminRekapKasSemuaKelas';
import { ShimmerSkeleton } from '../../shared/ShimmerSkeleton';
import { useSafeCollectionGroup } from '../../../hooks/useSafeCollection';
import { safeStr, safeLower } from '../../../lib/utils/safeString';
import { Plus, Users } from 'lucide-react';
import toast from 'react-hot-toast';

interface AdminSiswaProps {
  sekolahId?: string;
  sekolahNama?: string;
}

export const AdminSiswa: React.FC<AdminSiswaProps> = ({ sekolahId, sekolahNama }) => {
  const { data: siswaListRaw, loading: loadingSiswa } = useSafeCollectionGroup<Siswa & { _docPath?: string }>(
    'siswa',
    undefined,
    { sekolahId }
  );
  const { data: pembayaranList, loading: loadingPembayaran } = useSafeCollectionGroup<Pembayaran>(
    'pembayaran',
    undefined,
    { sekolahId }
  );
  const { data: kelasList } = useSafeCollectionGroup<Kelas & { _docPath?: string }>(
    'kelas',
    undefined,
    { sekolahId }
  );

  // Extra client-side filter by sekolahId (for _docPath matching)
  const siswaList = siswaListRaw.filter((s) => {
    if (!sekolahId) return true;
    const path = safeStr(s._docPath);
    const sid = safeStr((s as any).sekolahId);
    return sid.toLowerCase() === safeLower(sekolahId) || path.toLowerCase().includes(safeLower(sekolahId));
  }).sort((a, b) => (a.noAbsen || 0) - (b.noAbsen || 0));

  const isLoading = loadingSiswa || loadingPembayaran;

  const [showModal, setShowModal] = useState(false);
  const [selectedSiswa, setSelectedSiswa] = useState<(Siswa & { _docPath?: string }) | null>(null);
  const [deletingSiswa, setDeletingSiswa] = useState<(Siswa & { _docPath?: string }) | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // For admin, pick the class to add the siswa to (default = first available class)
  const availableKelas = useMemo(
    () =>
      kelasList
        .filter((k) => !sekolahId || safeStr((k as any).sekolahId) === sekolahId || safeStr(k._docPath).includes(sekolahId))
        .sort((a, b) => (a.nama || '').localeCompare(b.nama || '')),
    [kelasList, sekolahId]
  );
  const [targetKelasId, setTargetKelasId] = useState<string>('');
  const targetKelas = availableKelas.find((k) => k.id === targetKelasId) || availableKelas[0];

  const handleSaveSiswa = async (data: {
    nama: string;
    noAbsen: number;
    nisn?: string;
    fotoUrl?: string;
    jurusanId?: string;
    kelasId?: string;
  }) => {
    setIsSubmitting(true);
    const id = selectedSiswa ? selectedSiswa.id : `s-${Date.now()}`;
    const jurusanId =
      selectedSiswa?.jurusanId || data.jurusanId || targetKelas?.jurusanId || '';
    const kelasId = selectedSiswa?.kelasId || data.kelasId || targetKelas?.id || '';
    const nowIso = new Date().toISOString();

    const newS = {
      id,
      sekolahId: sekolahId || '',
      jurusanId,
      kelasId,
      nama: data.nama,
      noAbsen: data.noAbsen,
      nisn: data.nisn || '',
      fotoUrl: data.fotoUrl || '',
      status: 'aktif',
      createdAt: selectedSiswa?.createdAt || nowIso,
      updatedAt: nowIso,
    };

    setShowModal(false);
    const isEdit = Boolean(selectedSiswa);
    setSelectedSiswa(null);
    setIsSubmitting(false);

    try {
      const path =
        selectedSiswa?._docPath || `sekolah/${sekolahId || ''}/jurusan/${jurusanId}/kelas/${kelasId}/siswa/${id}`;
      await setDoc(doc(db, path), newS, { merge: true });
      toast.success(isEdit ? `Data siswa "${data.nama}" diperbarui!` : `Siswa "${data.nama}" ditambahkan!`);
    } catch (err: any) {
      console.error('Error saving siswa:', err);
      toast.error('Gagal menyimpan data siswa.');
    }
  };

  const confirmDeleteSiswa = async () => {
    if (!deletingSiswa) return;
    setIsDeleting(true);
    try {
      const path =
        deletingSiswa._docPath ||
        `sekolah/${sekolahId || ''}/jurusan/${deletingSiswa.jurusanId || ''}/kelas/${deletingSiswa.kelasId || ''}/siswa/${deletingSiswa.id}`;
      await deleteDoc(doc(db, path));
      toast.success(`Siswa "${deletingSiswa.nama}" berhasil dihapus.`);
      setDeletingSiswa(null);
    } catch (err: any) {
      console.error('Error deleting student:', err);
      toast.error('Gagal menghapus data siswa.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white font-heading">Data Siswa (Semua Kelas)</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Kelola data siswa manual (Nama & Nomor Absen)</p>
        </div>
        <button
          onClick={() => {
            setSelectedSiswa(null);
            if (availableKelas.length > 0) setTargetKelasId(availableKelas[0].id);
            setShowModal(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center space-x-2 shadow-lg shadow-indigo-500/20 cursor-pointer"
        >
          <Plus size={16} />
          <span>Tambah Siswa</span>
        </button>
      </div>

      {/* Summary Stat Bar */}
      <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
        <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
          <Users size={20} />
        </div>
        <div className="flex-1">
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Siswa Terdaftar</p>
          <p className="text-xl font-extrabold text-white font-numeric">{siswaList.length} Siswa</p>
        </div>
        <div className="hidden sm:block text-right">
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Setoran Tercatat</p>
          <p className="text-lg font-extrabold text-emerald-400 font-numeric">{pembayaranList.length} Transaksi</p>
        </div>
      </div>

      <AdminRekapKasSemuaKelas sekolahId={sekolahId} sekolahNama={sekolahNama} />

      <div className="pt-6 border-t border-slate-800">
        <h3 className="text-base font-bold text-white mb-3 font-heading">
          Seluruh Register Data Siswa
        </h3>
        {isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-4">
                <ShimmerSkeleton className="h-8 w-8 rounded-full" />
                <ShimmerSkeleton className="h-3 w-32" />
                <ShimmerSkeleton className="h-3 w-24" />
                <ShimmerSkeleton className="h-3 w-20" />
              </div>
            ))}
          </div>
        ) : (
          <div className="animate-fade-in-up">
            <SiswaTable
              siswaList={siswaList}
              pembayaranList={pembayaranList}
              nominalKasMingguan={5000}
              currentMinggu={4}
              onEdit={(s) => {
                setSelectedSiswa(s);
                setShowModal(true);
              }}
              onDelete={(id) => {
                const found = siswaList.find((s) => s.id === id);
                if (found) setDeletingSiswa(found);
              }}
            />
          </div>
        )}
      </div>

      <DeleteConfirmModal
        isOpen={Boolean(deletingSiswa)}
        title="Hapus Data Siswa"
        description="Apakah Anda yakin ingin menghapus data siswa ini?"
        itemName={deletingSiswa ? `#${deletingSiswa.noAbsen} ${deletingSiswa.nama}` : ''}
        isDeleting={isDeleting}
        onConfirm={confirmDeleteSiswa}
        onCancel={() => setDeletingSiswa(null)}
      />

      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white font-heading">
              {selectedSiswa ? 'Edit Data Siswa' : 'Input Siswa Baru (Manual)'}
            </h3>

            {/* Class picker (admin only) — auto-fills SiswaForm context */}
            {!selectedSiswa && availableKelas.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tambahkan ke Kelas <span className="text-rose-400">*</span>
                </label>
                <select
                  value={targetKelasId || availableKelas[0]?.id || ''}
                  onChange={(e) => setTargetKelasId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  {availableKelas.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.nama || k.id} ({k.jurusanId || '?'})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  Kelas dipilih otomatis sesuai konteks. Siswa cukup isi Nama + No Absen.
                </p>
              </div>
            )}

            <SiswaForm
              initialData={selectedSiswa || undefined}
              jurusanId={targetKelas?.jurusanId}
              kelasId={targetKelas?.id}
              onSubmit={handleSaveSiswa}
              onCancel={() => setShowModal(false)}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
      )}
    </div>
  );
};

