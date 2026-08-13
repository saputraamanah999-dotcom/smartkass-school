import React, { useEffect, useRef, useState } from 'react';
import { doc, setDoc, deleteDoc, runTransaction } from 'firebase/firestore';
import { db } from '../../../lib/firebase/config';
import { Pengeluaran, Kelas, Pembayaran } from '../../../types';
import { useAuth } from '../../../contexts/AuthContext';
import { PengeluaranTable } from '../../tables/PengeluaranTable';
import { PengeluaranForm } from '../../forms/PengeluaranForm';
import { DeleteConfirmModal } from '../../shared/DeleteConfirmModal';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSafeDoc, useSafeCollection, usePembayaranKelas } from '../../../hooks/useSafeCollection';
import { formatRupiah } from '../../../lib/utils/formatCurrency';


export const GuruPengeluaran: React.FC = () => {
  const { user } = useAuth();
  const jurusanId = user?.jurusanId || '';
  const kelasId = user?.kelasId || '';
  const sekolahId = user?.sekolahId || '';

  // === Safe Firestore hooks (realtime from Firebase) ===
  const { data: kelas } = useSafeDoc<Kelas>(
    `sekolah/${sekolahId}/jurusan/${jurusanId}/kelas/${kelasId}`,
    null
  );

  const pengeluaranPath = (sekolahId && jurusanId && kelasId)
    ? `sekolah/${sekolahId}/jurusan/${jurusanId}/kelas/${kelasId}/pengeluaran`
    : '';

  const { data: pengeluaranListRaw } = useSafeCollection<Pengeluaran & { _docPath?: string }>(
    pengeluaranPath,
    undefined
  );

  const { data: pembayaranListRaw } = usePembayaranKelas<Pembayaran>(
    sekolahId, jurusanId, kelasId
  );

  const pengeluaranList = pengeluaranListRaw;

  // Hitung saldo REAL-TIME dari dokumen aktual (bukan kelas.saldoSaatIni yang bisa stale)
  const pengeluaranReal = pengeluaranList.filter(p => p.id !== '_init');
  const totalPengeluaran = pengeluaranReal.reduce((acc, p) => acc + (p.totalHarga || 0), 0);
  const totalPemasukan = pembayaranListRaw.reduce((acc, p) => acc + (p.nominal || 0), 0);
  const saldoRealtime = totalPemasukan - totalPengeluaran;

  // Auto-create pengeluaran collection jika belum ada
  const initDone = useRef(false);
  useEffect(() => {
    if (!sekolahId || !jurusanId || !kelasId || initDone.current) return;
    initDone.current = true;
    const path = `sekolah/${sekolahId}/jurusan/${jurusanId}/kelas/${kelasId}/pengeluaran/_init`;
    setDoc(doc(db, path), {
      id: '_init',
      namaBarang: '[INIT] Collection Placeholder',
      harga: 0, jumlah: 0, totalHarga: 0,
      kategori: 'Init',
      tanggal: new Date().toISOString().slice(0, 10),
      dicatatOlehUid: 'system',
      dicatatOlehNama: 'System',
      createdAt: new Date().toISOString(),
    }, { merge: true }).catch(() => {});
  }, [sekolahId, jurusanId, kelasId]);

  const [showModal, setShowModal] = useState(false);
  const [deletingExpense, setDeletingExpense] = useState<Pengeluaran | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSavePengeluaran = async (data: {
    namaBarang: string;
    harga: number;
    jumlah: number;
    potonganHarga?: number;
    totalHarga: number;
    kategori: string;
    tanggal: string;
    buktiUrl?: string;
    keterangan?: string;
  }) => {
    if (!sekolahId || !jurusanId || !kelasId) {
      toast.error('Data sekolah/jurusan/kelas belum tersedia. Pastikan akun Anda sudah terhubung ke kelas.');
      return;
    }
    setIsSubmitting(true);
    const id = `ex-${Date.now()}`;
    const nowIso = new Date().toISOString();
    const newEx: Pengeluaran & { updatedAt?: string } = {
      id,
      sekolahId,
      jurusanId,
      kelasId,
      namaBarang: data.namaBarang,
      harga: data.harga,
      jumlah: data.jumlah,
      potonganHarga: data.potonganHarga || 0,
      totalHarga: data.totalHarga,
      kategori: data.kategori,
      tanggal: data.tanggal,
      buktiUrl: data.buktiUrl || '',
      dicatatOlehUid: user?.uid || 'guru-01',
      dicatatOlehNama: user?.nama || 'Wali Kelas',
      keterangan: data.keterangan || '',
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    setShowModal(false);
    setIsSubmitting(false);

    try {
      // 1. Save expense document
      await setDoc(doc(db, `sekolah/${sekolahId}/jurusan/${jurusanId}/kelas/${kelasId}/pengeluaran`, id), newEx);

      // 2. Potong saldo via transaction (mencegah race condition)
      try {
        const kelasRef = doc(db, `sekolah/${sekolahId}/jurusan/${jurusanId}/kelas/${kelasId}`);
        await runTransaction(db, async (tx) => {
          const snap = await tx.get(kelasRef);
          const cur = snap.exists() ? (snap.data().saldoSaatIni || 0) : 0;
          tx.update(kelasRef, { saldoSaatIni: Math.max(0, cur - data.totalHarga), updatedAt: nowIso });
        });
      } catch (txErr) {
        console.warn('Transaction saldoSaatIni failed (non-critical):', txErr);
      }

      toast.success(`Pengeluaran "${data.namaBarang}" berhasil dicatat!`);
    } catch (err: any) {
      console.error('Error recording expense:', err);
      var errMsg = (err && err.message) ? err.message : String(err);
      toast.error('Gagal mencatat pengeluaran: ' + errMsg, { duration: 8000 });
    }
  };

  const confirmDeleteExpense = async () => {
    if (!deletingExpense) return;
    setIsDeleting(true);
    const nowIso = new Date().toISOString();
    try {
      await deleteDoc(doc(db, `sekolah/${sekolahId}/jurusan/${jurusanId}/kelas/${kelasId}/pengeluaran`, deletingExpense.id));
      
      // Kembalikan saldo via transaction
      if (deletingExpense.totalHarga) {
        try {
          const kelasRef = doc(db, `sekolah/${sekolahId}/jurusan/${jurusanId}/kelas/${kelasId}`);
          await runTransaction(db, async (tx) => {
            const snap = await tx.get(kelasRef);
            const cur = snap.exists() ? (snap.data().saldoSaatIni || 0) : 0;
            tx.update(kelasRef, { saldoSaatIni: cur + deletingExpense.totalHarga, updatedAt: nowIso });
          });
        } catch (txErr) {
          console.warn('Transaction restore saldoSaatIni failed (non-critical):', txErr);
        }
      }

      toast.success(`Pengeluaran "${deletingExpense.namaBarang}" dihapus & saldo dipulihkan.`);
      setDeletingExpense(null);
    } catch (err: any) {
      console.error('Error deleting expense:', err);
      var errMsg = (err && err.message) ? err.message : String(err);
      toast.error('Gagal menghapus pengeluaran: ' + errMsg, { duration: 8000 });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white font-heading">Catat Pengeluaran Kas Kelas</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Input pengeluaran barang & keperluan kelas — otomatis memotong saldo kas realtime</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center space-x-2 shadow-lg shadow-purple-500/20 cursor-pointer"
        >
          <Plus size={16} />
          <span>Tambah Pengeluaran</span>
        </button>
      </div>

      <PengeluaranTable
        pengeluaranList={pengeluaranReal}
        onDelete={(ex) => setDeletingExpense(ex)}
      />

      <DeleteConfirmModal
        isOpen={Boolean(deletingExpense)}
        title="Hapus Pengeluaran Kas"
        description="Apakah Anda yakin ingin menghapus data pengeluaran barang ini? Saldo kas akan dikembalikan secara otomatis."
        itemName={deletingExpense ? `${deletingExpense.namaBarang} (${deletingExpense.jumlah}x) - Rp ${deletingExpense.totalHarga?.toLocaleString('id-ID')}` : ''}
        isDeleting={isDeleting}
        onConfirm={confirmDeleteExpense}
        onCancel={() => setDeletingExpense(null)}
      />

      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white font-heading">Input Pengeluaran Baru</h3>
            <PengeluaranForm
              saldoKasCurrent={saldoRealtime}
              onSubmit={handleSavePengeluaran}
              onCancel={() => setShowModal(false)}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
      )}
    </div>
  );
};
