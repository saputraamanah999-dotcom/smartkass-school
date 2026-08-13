import React, { useState, useEffect } from 'react';
import { doc, setDoc, deleteDoc, collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../../lib/firebase/config';
import { Kelas } from '../../../types';
import { KelasIcon } from '../../icons/CustomIcons';
import { KelasForm } from '../../forms/KelasForm';
import { DeleteConfirmModal } from '../../shared/DeleteConfirmModal';
import { ShimmerSkeleton } from '../../shared/ShimmerSkeleton';
import { formatRupiah } from '../../../lib/utils/formatCurrency';
import { useAuth } from '../../../contexts/AuthContext';
import { Plus, Trash2, X, Layers } from 'lucide-react';
import toast from 'react-hot-toast';

export const AdminKelas: React.FC = () => {
  const { createAccount, activeSekolahId } = useAuth();
  const sekolahId = activeSekolahId || '';

  // Load kelas from Firestore (direct paths per jurusan)
  const [kelasList, setKelasList] = useState<(Kelas & { _docPath?: string })[]>([]);
  const [loadingKelas, setLoadingKelas] = useState(true);


  // Load sekolah list for dropdown
  const [sekolahListData, setSekolahListData] = useState<{ id: string; nama: string }[]>([]);

  // Load jurusan from Firestore for the active sekolah
  const [jurusanList, setJurusanList] = useState<{ id: string; nama: string; sekolahId: string }[]>([]);

  // Subscribe to sekolah list
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'sekolah'), (snap) => {
      setSekolahListData(snap.docs.map((d) => ({ id: d.id, nama: d.data().nama || d.id })));
    }, () => {});
    return () => unsub();
  }, []);

  // Subscribe to jurusan for active sekolah
  useEffect(() => {
    if (!sekolahId) return;
    const unsub = onSnapshot(
      collection(db, `sekolah/${sekolahId}/jurusan`),
      (snap) => {
        setJurusanList(snap.docs.map((d) => ({ id: d.id, nama: d.data().nama || '', sekolahId: d.data().sekolahId || sekolahId })));
      },
      () => setJurusanList([])
    );
    return () => unsub();
  }, [sekolahId]);

  // Subscribe to kelas — direct path per jurusan (NO collectionGroup)
  useEffect(() => {
    if (!sekolahId) return;
    setLoadingKelas(true);
    const unsubs: (() => void)[] = [];
    let allKelas: (Kelas & { _docPath?: string })[] = [];
    let settled = false;

    if (jurusanList.length === 0) {
      setKelasList([]);
      setLoadingKelas(false);
      return;
    }

    let completedCount = 0;
    jurusanList.forEach((j) => {
      const path = `sekolah/${sekolahId}/jurusan/${j.id}/kelas`;
      try {
        const unsub = onSnapshot(
          collection(db, path),
          (snap) => {
            if (settled && !mounted) return;
            const filtered = allKelas.filter(k => !k._docPath || !k._docPath.includes(`/jurusan/${j.id}/kelas/`));
            const newItems = snap.docs.map(d => ({ id: d.id, _docPath: d.ref.path, ...d.data() } as Kelas & { _docPath?: string }));
            filtered.push(...newItems);
            allKelas = filtered;
            setKelasList([...allKelas]);
            completedCount++;
            if (completedCount >= jurusanList.length && !settled) {
              settled = true;
              setLoadingKelas(false);
            }
          },
          (err) => {
            console.warn("Kelas listen error for jurusan", j.id, ":", err?.message || err);
            completedCount++;
            if (completedCount >= jurusanList.length && !settled) {
              settled = true;
              setLoadingKelas(false);
            }
          }
        );
        unsubs.push(unsub);
      } catch (e) {
        completedCount++;
        if (completedCount >= jurusanList.length && !settled) {
          settled = true;
          setLoadingKelas(false);
        }
      }
    });

    let mounted = true;
    return () => { mounted = false; unsubs.forEach(u => u()); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sekolahId, jurusanList.length]);

  const sekolahList = sekolahListData;

  const [showModal, setShowModal] = useState(false);
  const [deletingKelas, setDeletingKelas] = useState<(Kelas & { _docPath?: string }) | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleCreateKelas = async (data: {
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
  }) => {
    setIsSubmitting(true);
    setNotification(null);

    try {
      const kelasSlug = data.nama.toLowerCase().replace(/\s+/g, '-');
      const kelasId = kelasSlug || `kelas-${Date.now()}`;
      const nowIso = new Date().toISOString();

      // 1. Create Firebase Auth + Firestore profile for Guru Wali
      let guruUid: string;
      try {
        guruUid = await createAccount({
          email: data.guruEmail,
          nama: data.guruNama,
          password: data.guruPassword,
          role: 'guru',
          sekolahId: data.sekolahId,
          jurusanId: data.jurusanId,
          kelasId,
        });
      } catch (err: any) {
        toast.error(`Gagal buat akun Guru: ${err.message}`);
        setIsSubmitting(false);
        return;
      }

      // 2. Create Firebase Auth + Firestore profile for Bendahara
      let bendaharaUid: string;
      try {
        bendaharaUid = await createAccount({
          email: data.bendaharaEmail,
          nama: data.bendaharaNama,
          password: data.bendaharaPassword,
          role: 'bendahara',
          sekolahId: data.sekolahId,
          jurusanId: data.jurusanId,
          kelasId,
        });
      } catch (err: any) {
        toast.error(`Gagal buat akun Bendahara: ${err.message}`);
        setIsSubmitting(false);
        return;
      }

      // 3. Create Kelas Doc in Firestore
      await setDoc(
        doc(db, `sekolah/${data.sekolahId}/jurusan/${data.jurusanId}/kelas`, kelasId),
        {
          id: kelasId,
          nama: data.nama,
          sekolahId: data.sekolahId,
          jurusanId: data.jurusanId,
          waliKelasUid: guruUid,
          waliKelasNama: data.guruNama,
          bendaharaUid,
          bendaharaNama: data.bendaharaNama,
          nominalKasMingguan: data.nominalKasMingguan,
          saldoSaatIni: 0,
          createdAt: nowIso,
          updatedAt: nowIso,
        },
        { merge: true }
      );

      toast.success(`Kelas "${data.nama}" berhasil dibuat beserta akun Wali & Bendahara!`);
      setNotification({ type: 'success', message: `Berhasil membuat Kelas ${data.nama} beserta akun Wali Kelas & Bendahara!` });
      setShowModal(false);
      setTimeout(() => setNotification(null), 4000);
    } catch (err: any) {
      console.error('Error creating class & accounts:', err);
      toast.error(err.message || 'Gagal membuat data kelas baru.');
      setNotification({ type: 'error', message: err.message || 'Gagal membuat data kelas baru.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingKelas) return;
    setIsDeleting(true);
    try {
      const path = deletingKelas._docPath || `sekolah/${deletingKelas.sekolahId || sekolahId}/jurusan/${deletingKelas.jurusanId}/kelas/${deletingKelas.id}`;
      await deleteDoc(doc(db, path));
      toast.success(`Kelas "${deletingKelas.nama}" berhasil dihapus.`);
      setNotification({ type: 'success', message: `Kelas ${deletingKelas.nama} berhasil dihapus.` });
      setDeletingKelas(null);
      setTimeout(() => setNotification(null), 4000);
    } catch (err: any) {
      console.error('Error deleting kelas:', err);
      toast.error('Gagal menghapus data kelas.');
      setNotification({ type: 'error', message: 'Gagal menghapus data kelas.' });
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDateTime = (isoString?: string) => {
    if (!isoString) return '-';
    try {
      return new Date(isoString).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' WIB';
    } catch { return isoString; }
  };

  return (
    <div className="space-y-6">
      {notification && (
        <div className={`p-4 rounded-2xl border text-xs font-semibold flex items-center justify-between ${notification.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'}`}>
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-white"><X size={14} /></button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white font-heading">Kelola Data Kelas Sekolah</h2>
          <p className="text-xs text-slate-400 mt-0.5">Daftar seluruh kelas dengan akun wali kelas & bendahara terintegrasi Firebase Auth</p>
        </div>
        <button onClick={() => { setShowModal(true); }} className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center space-x-2 shadow-lg shadow-indigo-500/20 transition-all cursor-pointer self-start sm:self-auto">
          <Plus size={16} /><span>Buat Kelas & Akun Baru</span>
        </button>
      </div>

      <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
        <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20"><Layers size={20} /></div>
        <div className="flex-1">
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Kelas Aktif</p>
          <p className="text-xl font-extrabold text-white font-numeric">{kelasList.length} Kelas</p>
        </div>
        <div className="hidden sm:block text-right">
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Saldo Gabungan</p>
          <p className="text-lg font-extrabold text-emerald-400 font-numeric">{formatRupiah(kelasList.reduce((acc, k) => acc + (k.saldoSaatIni || 0), 0))}</p>
        </div>
      </div>

      {loadingKelas ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{[0, 1, 2].map((i) => (<div key={i} className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4"><ShimmerSkeleton className="h-8 w-8 rounded-xl" /><ShimmerSkeleton className="h-4 w-32" /><ShimmerSkeleton className="h-3 w-full" /></div>))}</div>
      ) : kelasList.length === 0 ? (
        <div className="p-12 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-slate-500 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 mx-auto flex items-center justify-center"><KelasIcon size={28} /></div>
          <p className="text-sm font-semibold text-slate-300">Belum ada kelas terdaftar</p>
          <p className="text-xs max-w-sm mx-auto">Klik "Buat Kelas & Akun Baru" untuk menambahkan kelas. Jurusan diambil dari data Firebase yang sudah dibuat.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {kelasList.map((k, idx) => (
            <div key={k.id} className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/40 backdrop-blur-md space-y-4 transition-all group animate-fade-in-up" style={{ animationDelay: `${idx * 0.05}s` }}>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20"><KelasIcon size={24} /></div>
                  <div>
                    <h3 className="text-sm font-bold text-white font-heading">{k.nama}</h3>
                    <p className="text-[10px] text-slate-400 font-numeric mt-0.5">Kas: {formatRupiah(k.nominalKasMingguan || 5000)}/mg</p>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-xs font-extrabold text-emerald-400 font-numeric">{formatRupiah(k.saldoSaatIni || 0)}</span>
                  <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[9px] font-bold uppercase mt-1">{(k.jurusanId || '').toUpperCase()}</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2 text-xs">
                <div className="flex items-center justify-between text-purple-300">
                  <span className="font-medium text-[11px]">Guru Wali:</span>
                  <span className="font-bold text-white truncate max-w-[160px]">{k.waliKelasNama || '-'}</span>
                </div>
                <div className="flex items-center justify-between text-amber-300">
                  <span className="font-medium text-[11px]">Bendahara:</span>
                  <span className="font-bold text-white truncate max-w-[160px]">{k.bendaharaNama || '-'}</span>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500 font-numeric">
                <span>{formatDateTime(k.createdAt)}</span>
                <button onClick={() => setDeletingKelas(k)} className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs transition-all cursor-pointer" title="Hapus Kelas"><Trash2 size={13} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <DeleteConfirmModal
        isOpen={Boolean(deletingKelas)}
        title="Hapus Data Kelas"
        description="Apakah Anda yakin ingin menghapus data kelas ini?"
        itemName={deletingKelas ? `Kelas ${deletingKelas.nama} (${(deletingKelas.jurusanId || '').toUpperCase()})` : ''}
        isDeleting={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeletingKelas(null)}
      />

      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white font-heading">Input Kelas Baru & Buat Akun</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white"><X size={16} /></button>
            </div>
            <KelasForm
              sekolahList={sekolahList.length > 0 ? sekolahList : [{ id: sekolahId, nama: sekolahId }]}
              sekolahId={sekolahId}
              onSubmit={handleCreateKelas}
              onCancel={() => setShowModal(false)}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
      )}
    </div>
  );
};
