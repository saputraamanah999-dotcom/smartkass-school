import React, { useMemo, useState } from 'react';
import { doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../../lib/firebase/config';
import { Siswa, Pembayaran, Kelas } from '../../../types';
import { useAuth } from '../../../contexts/AuthContext';
import { SiswaTable } from '../../tables/SiswaTable';
import { SiswaForm } from '../../forms/SiswaForm';
import { PembayaranForm } from '../../forms/PembayaranForm';
import { DeleteConfirmModal } from '../../shared/DeleteConfirmModal';
import { ShimmerSkeleton } from '../../shared/ShimmerSkeleton';
import { useSafeCollection, usePembayaranKelas } from '../../../hooks/useSafeCollection';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';

export const BendaharaSiswa: React.FC = () => {
  const { user } = useAuth();
  const sekolahId = user?.sekolahId || '';
  const jurusanId = user?.jurusanId || '';
  const kelasId = user?.kelasId || '';
  const kelasPath = `sekolah/${sekolahId}/jurusan/${jurusanId}/kelas/${kelasId}`;

  // Listen to kelas doc so we get the dynamic nominalKasMingguan (peraturan kelas)
  const [kelas, setKelas] = useState<Kelas | null>(null);
  React.useEffect(() => {
    const unsub = onSnapshot(
      doc(db, kelasPath),
      (snap) => {
        if (snap.exists()) setKelas({ id: snap.id, ...snap.data() } as Kelas);
      },
      (err) => console.warn('BendaharaSiswa: kelas listener error', err)
    );
    return () => unsub();
  }, [kelasPath]);

  const nominalKasMingguan = kelas?.nominalKasMingguan || 5000;

    const siswaPath = (sekolahId && jurusanId && kelasId)
    ? `sekolah/${sekolahId}/jurusan/${jurusanId}/kelas/${kelasId}/siswa`
    : '';

  const {
    data: rawSiswaList,
    loading: siswaLoading,
  } = useSafeCollection<Siswa & { _docPath?: string }>(siswaPath, undefined);

  const {
    data: rawPembayaranList,
    loading: pembayaranLoading,
  } = usePembayaranKelas<Pembayaran>(sekolahId, jurusanId, kelasId);

  // Sort siswa by noAbsen (keep existing behaviour) — computed via useMemo so
  // we don't trigger a re-render storm when the underlying data updates.
  const siswaList = useMemo(() => {
    return [...rawSiswaList].sort((a, b) => (a.noAbsen || 0) - (b.noAbsen || 0));
  }, [rawSiswaList]);

  const pembayaranList = useMemo(() => rawPembayaranList, [rawPembayaranList]);

  const [showAddSiswaModal, setShowAddSiswaModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedSiswaForPay, setSelectedSiswaForPay] = useState<Siswa | null>(null);
  const [deletingSiswa, setDeletingSiswa] = useState<(Siswa & { _docPath?: string }) | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSaveSiswa = async (data: {
    nama: string;
    noAbsen: number;
    nisn?: string;
    fotoUrl?: string;
    jurusanId?: string;
    kelasId?: string;
  }) => {
    setIsSubmitting(true);
    const id = `s-${Date.now()}`;
    const nowIso = new Date().toISOString();
    const targetJurusanId = data.jurusanId || jurusanId;
    const targetKelasId = data.kelasId || kelasId;
    const newSiswa = {
      id,
      sekolahId,
      jurusanId: targetJurusanId,
      kelasId: targetKelasId,
      nama: data.nama,
      noAbsen: data.noAbsen,
      nisn: data.nisn || '',
      fotoUrl: data.fotoUrl || '',
      status: 'aktif',
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    setShowAddSiswaModal(false);
    setIsSubmitting(false);

    try {
      await setDoc(
        doc(db, `sekolah/${sekolahId}/jurusan/${targetJurusanId}/kelas/${targetKelasId}/siswa`, id),
        newSiswa
      );
      toast.success(`Siswa "${data.nama}" berhasil ditambahkan!`);
    } catch (err: any) {
      console.error('Error adding student:', err);
      toast.error('Gagal menambahkan siswa.');
    }
  };

  const confirmDeleteSiswa = async () => {
    if (!deletingSiswa) return;
    setIsDeleting(true);
    try {
      const path =
        deletingSiswa._docPath ||
        `sekolah/${sekolahId}/jurusan/${jurusanId}/kelas/${kelasId}/siswa/${deletingSiswa.id}`;
      await deleteDoc(doc(db, path));
      toast.success(`Siswa "${deletingSiswa.nama}" berhasil dihapus.`);
      setDeletingSiswa(null);
    } catch (err: any) {
      console.error('Error deleting student:', err);
      toast.error('Gagal menghapus siswa.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSavePembayaran = async (data: any) => {
    setIsSubmitting(true);
    const id = `p-${Date.now()}`;
    const nowIso = new Date().toISOString();
    const newPay: Pembayaran & { updatedAt?: string } = {
      id,
      sekolahId,
      jurusanId,
      kelasId,
      siswaId: data.siswaId,
      siswaNama: data.siswaNama,
      siswaNoAbsen: data.siswaNoAbsen,
      nominal: data.nominal,
      tanggalBayar: nowIso,
      mingguKe: data.mingguKe,
      tahunAjaran: '2026/2027',
      status: data.status,
      approvedByGuru: true,
      dicatatOlehUid: user?.uid || 'bendahara-01',
      dicatatOlehNama: user?.nama || 'Bendahara Kelas',
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    setShowPayModal(false);
    setIsSubmitting(false);

    try {
      await setDoc(
        doc(db, `sekolah/${sekolahId}/jurusan/${jurusanId}/kelas/${kelasId}/siswa/${data.siswaId}/pembayaran`, id),
        newPay
      );
      toast.success(`Pembayaran kas "${data.siswaNama}" berhasil dicatat!`);
    } catch (err: any) {
      console.error('Error saving payment:', err);
      toast.error('Gagal mencatat pembayaran.');
    }
  };

  const isLoading = siswaLoading || pembayaranLoading;

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white font-heading">
            Daftar Siswa Kelas {kelasId ? kelasId.toUpperCase() : 'Saya'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Bendahara menginput data siswa manual (Nama & Nomor Absen)</p>
        </div>
        <button
          onClick={() => setShowAddSiswaModal(true)}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center space-x-2 shadow-lg shadow-amber-500/20 cursor-pointer"
        >
          <Plus size={16} />
          <span>Tambah Siswa Manual</span>
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <ShimmerSkeleton className="h-10 w-full" />
          {Array.from({ length: 6 }).map((_, i) => (
            <ShimmerSkeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <SiswaTable
          siswaList={siswaList}
          pembayaranList={pembayaranList}
          nominalKasMingguan={nominalKasMingguan}
          currentMinggu={4}
          onDelete={(id) => {
            const found = siswaList.find((s) => s.id === id);
            if (found) setDeletingSiswa(found);
          }}
          onPayForSiswa={(s) => {
            setSelectedSiswaForPay(s);
            setShowPayModal(true);
          }}
        />
      )}

      <DeleteConfirmModal
        isOpen={Boolean(deletingSiswa)}
        title="Hapus Data Siswa"
        description="Apakah Anda yakin ingin menghapus data siswa ini?"
        itemName={deletingSiswa ? `#${deletingSiswa.noAbsen} ${deletingSiswa.nama}` : ''}
        isDeleting={isDeleting}
        onConfirm={confirmDeleteSiswa}
        onCancel={() => setDeletingSiswa(null)}
      />

      {showAddSiswaModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white font-heading">Input Siswa Baru (Manual)</h3>
            <SiswaForm
              jurusanId={jurusanId}
              kelasId={kelasId}
              onSubmit={handleSaveSiswa}
              onCancel={() => setShowAddSiswaModal(false)}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
      )}

      {showPayModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white font-heading">Catat Pembayaran Kas</h3>
            <PembayaranForm
              siswaList={selectedSiswaForPay ? [selectedSiswaForPay] : siswaList}
              nominalKasMingguan={nominalKasMingguan}
              currentMinggu={4}
              onSubmit={handleSavePembayaran}
              onCancel={() => setShowPayModal(false)}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
      )}
    </div>
  );
};
