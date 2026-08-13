import React, { useEffect, useMemo, useRef, useState } from 'react';
import { doc, setDoc, updateDoc, deleteDoc, runTransaction } from 'firebase/firestore';
import { db } from '../../../lib/firebase/config';
import { Pengeluaran, Kelas, Pembayaran } from '../../../types';
import { useAuth } from '../../../contexts/AuthContext';
import { PengeluaranTable } from '../../tables/PengeluaranTable';
import { PengeluaranForm } from '../../forms/PengeluaranForm';
import { DeleteConfirmModal } from '../../shared/DeleteConfirmModal';
import { ShimmerSkeleton } from '../../shared/ShimmerSkeleton';
import { useSafeDoc, useSafeCollection, usePembayaranKelas } from '../../../hooks/useSafeCollection';
import { formatRupiah } from '../../../lib/utils/formatCurrency';
import { Plus, ShoppingBag, Calculator, Tag, Wallet, ArrowDownRight } from 'lucide-react';
import toast from 'react-hot-toast';

export const BendaharaPengeluaran: React.FC = () => {
  const { user } = useAuth();
  const sekolahId = user?.sekolahId || '';
  const jurusanId = user?.jurusanId || '';
  const kelasId = user?.kelasId || '';

    const { data: kelas, loading: kelasLoading } = useSafeDoc<Kelas>(
    `sekolah/${sekolahId}/jurusan/${jurusanId}/kelas/${kelasId}`,
    null
  );

  const pengeluaranPath = (sekolahId && jurusanId && kelasId)
    ? `sekolah/${sekolahId}/jurusan/${jurusanId}/kelas/${kelasId}/pengeluaran`
    : '';

  const {
    data: rawPengeluaranList,
    loading: pengeluaranLoading,
  } = useSafeCollection<Pengeluaran & { _docPath?: string }>(
    pengeluaranPath,
    undefined
  );

  const { data: pembayaranListRaw, loading: pembayaranLoading } = usePembayaranKelas<Pembayaran>(
    sekolahId, jurusanId, kelasId
  );

  const pengeluaranList = useMemo(() => rawPengeluaranList, [rawPengeluaranList]);
  const isLoading = kelasLoading || pengeluaranLoading || pembayaranLoading;

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
    const id = 'ex-' + Date.now();
    const nowIso = new Date().toISOString();
    const newPengeluaran: Pengeluaran & { updatedAt?: string } = {
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
      dicatatOlehUid: user?.uid || 'bendahara-01',
      dicatatOlehNama: user?.nama ? `${user.nama} (Bendahara)` : 'Bendahara Kelas',
      keterangan: data.keterangan || '',
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    setShowModal(false);
    setIsSubmitting(false);

    try {
      await setDoc(
        doc(db, `sekolah/${sekolahId}/jurusan/${jurusanId}/kelas/${kelasId}/pengeluaran`, id),
        newPengeluaran
      );

      // Potong saldo kelas via transaction (mencegah race condition)
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

      toast.success(`Pengeluaran "${data.namaBarang}" berhasil dicatat.`);
    } catch (err: any) {
      console.error('Error saving pengeluaran:', err);
      var errMsg = (err && err.message) ? err.message : String(err);
      toast.error('Gagal mencatat pengeluaran: ' + errMsg, { duration: 8000 });
    }
  };

  const confirmDeleteExpense = async () => {
    if (!deletingExpense) return;
    setIsDeleting(true);
    const nowIso = new Date().toISOString();
    try {
      await deleteDoc(
        doc(db, `sekolah/${sekolahId}/jurusan/${jurusanId}/kelas/${kelasId}/pengeluaran`, deletingExpense.id)
      );

      // Kembalikan saldo kelas via transaction
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

      toast.success(`Pengeluaran "${deletingExpense.namaBarang}" berhasil dihapus & saldo telah dipulihkan.`);
      setDeletingExpense(null);
    } catch (err: any) {
      console.error('Error deleting expense:', err);
      var errMsg = (err && err.message) ? err.message : String(err);
      toast.error('Gagal menghapus pengeluaran: ' + errMsg, { duration: 8000 });
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter _init placeholder dari perhitungan
  const realPengeluaranList = pengeluaranList.filter(p => p.id !== '_init');
  const totalPengeluaranAcc = realPengeluaranList.reduce((acc, p) => acc + (p.totalHarga || 0), 0);
  const totalDiskonAcc = realPengeluaranList.reduce((acc, p) => acc + (p.potonganHarga || 0), 0);

  // Hitung saldo REAL-TIME dari dokumen aktual (bukan kelas.saldoSaatIni yang bisa stale)
  const totalPemasukanAktual = pembayaranListRaw.reduce((acc, p) => acc + (p.nominal || 0), 0);
  const saldoRealtime = totalPemasukanAktual - totalPengeluaranAcc;

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-900 via-indigo-950 to-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div>
          <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold border border-purple-500/30">
            Fitur Belanja & Pengeluaran Kas (Bendahara)
          </span>
          <h2 className="text-2xl font-extrabold text-white font-heading mt-2">
            Pencatatan Belanja & Simulator Diskon
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Atur harga belanja barang kelas secara independen, atur potongan harga/diskon, preview simulasi sisa kas, dan simpan bukti transaksi secara otomatis.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center space-x-2 shadow-lg shadow-purple-500/30 transition-all cursor-pointer flex-shrink-0"
        >
          <Plus size={18} />
          <span>Atur & Input Belanja Barang</span>
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Saldo Kas Kelas Tersedia</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Wallet size={18} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-numeric">
            {formatRupiah(saldoRealtime)}
          </p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">Dihitung real-time dari data pembayaran & pengeluaran</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Pengeluaran Belanja</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <ArrowDownRight size={18} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 font-numeric">
            - {formatRupiah(totalPengeluaranAcc)}
          </p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">{realPengeluaranList.length} Transaksi Tercatat</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Hemat dari Diskon Belanja</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Tag size={18} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-purple-600 dark:text-purple-400 font-numeric">
            {formatRupiah(totalDiskonAcc)}
          </p>
          <p className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">Potongan harga yang didapatkan</p>
        </div>
      </div>

      {/* Table Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white font-heading">Riwayat Pengeluaran Belanja Kelas</h3>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-numeric">{realPengeluaranList.length} Item</span>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <ShimmerSkeleton className="h-10 w-full" />
            {Array.from({ length: 4 }).map((_, i) => (
              <ShimmerSkeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : (
          <PengeluaranTable
            pengeluaranList={pengeluaranList}
            onDelete={(ex) => setDeletingExpense(ex)}
          />
        )}
      </div>

      {/* Delete Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(deletingExpense)}
        title="Hapus Pengeluaran Belanja"
        description="Apakah Anda yakin ingin menghapus data pengeluaran ini? Saldo kas kelas akan dikembalikan secara otomatis."
        itemName={deletingExpense ? `${deletingExpense.namaBarang} (${deletingExpense.jumlah}x) - Rp ${deletingExpense.totalHarga?.toLocaleString('id-ID')}` : ''}
        isDeleting={isDeleting}
        onConfirm={confirmDeleteExpense}
        onCancel={() => setDeletingExpense(null)}
      />

      {/* Modal Input Belanja */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center space-x-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <ShoppingBag size={20} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white font-heading">
                  Input Belanja & Simulator Diskon
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Atur harga barang, potongan, dan lihat estimasi sisa saldo kas</p>
              </div>
            </div>

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
