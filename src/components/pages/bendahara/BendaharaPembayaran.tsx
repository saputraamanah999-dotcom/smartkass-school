import React, { useMemo, useState } from 'react';
import { doc, setDoc, updateDoc, deleteDoc, runTransaction } from 'firebase/firestore';
import { db } from '../../../lib/firebase/config';
import { Siswa, Pembayaran, Kelas } from '../../../types';
import { useAuth } from '../../../contexts/AuthContext';
import { PembayaranTable } from '../../tables/PembayaranTable';
import { KasMatrixTable } from '../../tables/KasMatrixTable';
import { PembayaranForm } from '../../forms/PembayaranForm';
import { DeleteConfirmModal } from '../../shared/DeleteConfirmModal';
import { ShimmerSkeleton } from '../../shared/ShimmerSkeleton';
import { useSafeDoc, useSafeCollection, usePembayaranKelas } from '../../../hooks/useSafeCollection';
import { Plus, Info, Clock, CheckSquare, ListFilter } from 'lucide-react';
import { formatRupiah as formatRupiah2 } from '../../../lib/utils/formatCurrency';
import toast from 'react-hot-toast';

export const BendaharaPembayaran: React.FC = () => {
  const { user } = useAuth();
  const sekolahId = user?.sekolahId || '';
  const jurusanId = user?.jurusanId || '';
  const kelasId = user?.kelasId || '';

  const [activeTab, setActiveTab] = useState<'matrix' | 'table'>('matrix');
  const [showModal, setShowModal] = useState(false);
  const [deletingPayment, setDeletingPayment] = useState<(Pembayaran & { _docPath?: string }) | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const { data: kelas, loading: kelasLoading } = useSafeDoc<Kelas>(
    `sekolah/${sekolahId}/jurusan/${jurusanId}/kelas/${kelasId}`,
    null
  );

  const siswaPath = (sekolahId && jurusanId && kelasId)
    ? `sekolah/${sekolahId}/jurusan/${jurusanId}/kelas/${kelasId}/siswa`
    : '';

  const {
    data: rawSiswaList,
    loading: siswaLoading,
  } = useSafeCollection<Siswa & { _docPath?: string }>(
    siswaPath,
    undefined
  );

  const {
    data: rawPembayaranList,
    loading: pembayaranLoading,
  } = usePembayaranKelas<Pembayaran & { _docPath?: string }>(
    sekolahId, jurusanId, kelasId
  );

  const siswaList = useMemo(() => rawSiswaList, [rawSiswaList]);

  // Newest-first sort, kept identical to the previous inline logic.
  const pembayaranList = useMemo(() => {
    return [...rawPembayaranList].sort(
      (a, b) =>
        new Date(b.createdAt || b.tanggalBayar).getTime() - new Date(a.createdAt || a.tanggalBayar).getTime()
    );
  }, [rawPembayaranList]);

  const handleSavePembayaran = async (data: any) => {
    if (!sekolahId || !jurusanId || !kelasId) {
      toast.error('Data sekolah/jurusan/kelas belum tersedia. Pastikan akun sudah terhubung ke kelas.');
      return;
    }
    setIsSubmitting(true);
    const nowIso = new Date().toISOString();
    const nominalPerMinggu = kelas?.nominalKasMingguan || 5000;

    // Hitung jumlah minggu yang dibayar (otomatis dari nominal / kas mingguan)
    const jumlahMinggu = data.jumlahMinggu || Math.round(data.nominal / nominalPerMinggu) || 1;
    const bulan = data.bulan || '';

    setShowModal(false);
    setIsSubmitting(false);

    try {
      // Simpan SATU dokumen per minggu → otomatis sync dengan checkbox matriks
      for (let i = 0; i < jumlahMinggu; i++) {
        const mingguNum = data.mingguKe + i;
        if (mingguNum > 4) break; // Max 4 minggu per bulan

        const payDocId = `p-${data.siswaId}-${bulan.toLowerCase().replace(/\s+/g, '-')}-m${mingguNum}`;
        const payPath = `sekolah/${sekolahId}/jurusan/${jurusanId}/kelas/${kelasId}/siswa/${data.siswaId}/pembayaran/${payDocId}`;

        const newPay: Pembayaran & { updatedAt?: string; bulan?: string } = {
          id: payDocId,
          sekolahId,
          jurusanId,
          kelasId,
          siswaId: data.siswaId,
          siswaNama: data.siswaNama,
          siswaNoAbsen: data.siswaNoAbsen,
          nominal: nominalPerMinggu,
          tanggalBayar: nowIso,
          mingguKe: mingguNum,
          bulan: bulan,
          tahunAjaran: `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
          status: 'lunas',
          approvedByGuru: true,
          dicatatOlehUid: user?.uid || 'bendahara-01',
          dicatatOlehNama: user?.nama || 'Bendahara Kelas',
          keterangan: i === 0 ? (data.keterangan || `Kas Mingguan (${jumlahMinggu > 1 ? `M${data.mingguKe}-M${data.mingguKe + jumlahMinggu - 1}` : `M${mingguNum}`}) - ${bulan}`) : `Bagian ke-${i + 1} dari ${jumlahMinggu} minggu - ${bulan}`,
          createdAt: nowIso,
          updatedAt: nowIso,
        };

        await setDoc(doc(db, payPath), newPay);
      }

      // Tambah saldo kelas via transaction (atomis, total semua minggu)
      const totalNominal = jumlahMinggu * nominalPerMinggu;
      try {
        const kelasRef = doc(db, `sekolah/${sekolahId}/jurusan/${jurusanId}/kelas/${kelasId}`);
        await runTransaction(db, async (tx) => {
          const kelasSnap = await tx.get(kelasRef);
          const currentSaldo = kelasSnap.exists() ? (kelasSnap.data().saldoSaatIni || 0) : 0;
          tx.update(kelasRef, { saldoSaatIni: currentSaldo + totalNominal, updatedAt: nowIso });
        });
      } catch (txErr) {
        console.warn('Transaction saldoSaatIni failed (non-critical):', txErr);
      }

      toast.success(`Setoran kas ${data.siswaNama} (${jumlahMinggu} minggu, ${formatRupiah2(totalNominal)}) berhasil! Checkbox M${data.mingguKe}${jumlahMinggu > 1 ? `-M${data.mingguKe + jumlahMinggu - 1}` : ''} kecentang otomatis.`);
    } catch (err: any) {
      console.error('Error saving payment:', err);
      toast.error('Gagal mencatat setoran kas.');
    }
  };

  const handleApprove = async (item: Pembayaran & { _docPath?: string }) => {
    setApprovingId(item.id);
    try {
      const path = item._docPath || `sekolah/${sekolahId}/jurusan/${jurusanId}/kelas/${kelasId}/siswa/${item.siswaId}/pembayaran/${item.id}`;
      await setDoc(doc(db, path), { approvedByGuru: true }, { merge: true });
    } catch (err) {
      console.error('Error approving payment:', err);
    } finally {
      setApprovingId(null);
    }
  };

  const confirmDeletePayment = async () => {
    if (!deletingPayment) return;
    setIsDeleting(true);
    try {
      const path = deletingPayment._docPath || `sekolah/${sekolahId}/jurusan/${jurusanId}/kelas/${kelasId}/siswa/${deletingPayment.siswaId}/pembayaran/${deletingPayment.id}`;
      await deleteDoc(doc(db, path));

      // Kurangi saldo kelas via transaction (atomis, mencegah race condition)
      if (deletingPayment.nominal) {
        try {
          const kelasRef = doc(db, `sekolah/${sekolahId}/jurusan/${jurusanId}/kelas/${kelasId}`);
          await runTransaction(db, async (tx) => {
            const kelasSnap = await tx.get(kelasRef);
            const currentSaldo = kelasSnap.exists() ? (kelasSnap.data().saldoSaatIni || 0) : 0;
            tx.update(kelasRef, { saldoSaatIni: Math.max(0, currentSaldo - deletingPayment.nominal), updatedAt: new Date().toISOString() });
          });
        } catch (txErr) {
          console.warn('Transaction saldoSaatIni failed (non-critical):', txErr);
        }
      }

      setDeletingPayment(null);
    } catch (err) {
      console.error('Error deleting payment:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const pendingApprovalCount = pembayaranList.filter((p) => !p.approvedByGuru).length;
  const isLoading = kelasLoading || siswaLoading || pembayaranLoading;

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white font-heading">
            Catat Pembayaran Kas Mingguan
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Bendahara mencatat setoran kas siswa. Setiap setoran masuk ke persetujuan Guru Wali Kelas.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center space-x-2 shadow-lg shadow-amber-500/20 cursor-pointer transition-all self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>Input Setoran Kas</span>
        </button>
      </div>

      {/* View Tab Switcher */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('matrix')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer ${
            activeTab === 'matrix'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <CheckSquare size={16} />
          <span>Matriks Checkbox Mingguan</span>
        </button>
        <button
          onClick={() => setActiveTab('table')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer ${
            activeTab === 'table'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <ListFilter size={16} />
          <span>Riwayat Transaksi Detail</span>
        </button>
      </div>

      {/* Approval Banner Notice */}
      <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-900 dark:text-indigo-200 flex items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <Info size={16} className="text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
          <span>
            Bisa centang / uncentang langsung di tabel matriks di bawah, atau catat manual dengan tombol Input Setoran.
          </span>
        </div>
        {pendingApprovalCount > 0 && (
          <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold border border-amber-500/30 flex items-center gap-1 whitespace-nowrap">
            <Clock size={12} className="animate-pulse" />
            {pendingApprovalCount} Pending Approval
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <ShimmerSkeleton className="h-10 w-full" />
          {Array.from({ length: 6 }).map((_, i) => (
            <ShimmerSkeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : activeTab === 'matrix' ? (
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
        <PembayaranTable
          pembayaranList={pembayaranList}
          onApprove={handleApprove}
          onDelete={(p) => setDeletingPayment(p)}
          isApprovingId={approvingId}
        />
      )}

      <DeleteConfirmModal
        isOpen={Boolean(deletingPayment)}
        title="Hapus Setoran Kas"
        description="Apakah Anda yakin ingin menghapus transaksi setoran kas ini? Saldo kas kelas akan diperbarui secara otomatis."
        itemName={deletingPayment ? `Kas Minggu ${deletingPayment.mingguKe} - ${deletingPayment.siswaNama} (Rp ${deletingPayment.nominal?.toLocaleString('id-ID')})` : ''}
        isDeleting={isDeleting}
        onConfirm={confirmDeletePayment}
        onCancel={() => setDeletingPayment(null)}
      />

      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white font-heading">
              Input Setoran Kas Baru
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Setelah disimpan, setoran kas siswa akan secara otomatis masuk ke daftar konfirmasi disetujui oleh Guru Wali.
            </p>
            <PembayaranForm
              siswaList={siswaList}
              nominalKasMingguan={kelas?.nominalKasMingguan || 5000}
              currentMinggu={Math.min(4, Math.ceil(new Date().getDate() / 7))}
              onSubmit={handleSavePembayaran}
              onCancel={() => setShowModal(false)}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
      )}
    </div>
  );
};
