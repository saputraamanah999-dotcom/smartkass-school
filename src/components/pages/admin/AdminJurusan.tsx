import React, { useState } from 'react';
import { doc, setDoc, deleteDoc, collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../../lib/firebase/config';
import { Jurusan } from '../../../types';
import { JurusanIcon } from '../../icons/CustomIcons';
import { DeleteConfirmModal } from '../../shared/DeleteConfirmModal';
import { ShimmerSkeleton } from '../../shared/ShimmerSkeleton';
import { useAuth } from '../../../contexts/AuthContext';
import { Plus, Trash2, Edit2, Clock, Calendar, X, BookOpen, Layers, GraduationCap } from 'lucide-react';
import toast from 'react-hot-toast';

export const AdminJurusan: React.FC = () => {
  const { activeSekolahId } = useAuth();
  const sekolahId = activeSekolahId || '';

  // Load jurusan from Firestore for the ACTIVE sekolah (not hardcoded)
  const [jurusanList, setJurusanList] = useState<(Jurusan & { keterangan?: string; updatedAt?: string })[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    if (!sekolahId) return;
    const unsub = onSnapshot(
      collection(db, `sekolah/${sekolahId}/jurusan`),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setJurusanList(list);
        setLoading(false);
      },
      (err) => {
        console.warn('Error listening to jurusan:', err);
        setJurusanList([]);
        setLoading(false);
      }
    );
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sekolahId]);

  const [showModal, setShowModal] = useState(false);
  const [editingJurusan, setEditingJurusan] = useState<Jurusan | null>(null);
  const [deletingJurusan, setDeletingJurusan] = useState<Jurusan | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [id, setId] = useState('');
  const [nama, setNama] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const openAddModal = () => {
    setEditingJurusan(null);
    setId('');
    setNama('');
    setKeterangan('');
    setShowModal(true);
  };

  const openEditModal = (j: Jurusan & { keterangan?: string }) => {
    setEditingJurusan(j);
    setId(j.id);
    setNama(j.nama);
    setKeterangan(j.keterangan || '');
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim() || !sekolahId) {
      toast.error('Nama jurusan dan sekolah wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    setNotification(null);

    const jurusanId = editingJurusan
      ? editingJurusan.id
      : (id.trim().toLowerCase() || nama.trim().toLowerCase().replace(/[^a-z0-9]/g, '-'));

    const nowIso = new Date().toISOString();

    try {
      await setDoc(
        doc(db, `sekolah/${sekolahId}/jurusan`, jurusanId),
        {
          id: jurusanId,
          sekolahId,
          nama: nama.trim(),
          keterangan: keterangan.trim(),
          createdAt: editingJurusan?.createdAt || nowIso,
          updatedAt: nowIso,
        },
        { merge: true }
      );

      const successMsg = editingJurusan
        ? `Jurusan "${nama.trim()}" berhasil diperbarui!`
        : `Jurusan baru "${nama.trim()}" berhasil ditambahkan!`;

      toast.success(successMsg);
      setNotification({ type: 'success', message: successMsg });
      setShowModal(false);
      setTimeout(() => setNotification(null), 4000);
    } catch (err: any) {
      console.error('Error saving jurusan:', err);
      const errMsg = err.message || 'Gagal menyimpan data jurusan ke Firestore';
      toast.error(errMsg);
      setNotification({ type: 'error', message: errMsg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingJurusan || !sekolahId) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, `sekolah/${sekolahId}/jurusan`, deletingJurusan.id));
      toast.success(`Jurusan "${deletingJurusan.nama}" berhasil dihapus!`);
      setNotification({ type: 'success', message: `Jurusan ${deletingJurusan.nama} telah dihapus` });
      setDeletingJurusan(null);
      setTimeout(() => setNotification(null), 4000);
    } catch (err: any) {
      console.error('Error deleting jurusan:', err);
      toast.error('Gagal menghapus data jurusan');
      setNotification({ type: 'error', message: 'Gagal menghapus jurusan.' });
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDateTime = (isoString?: string) => {
    if (!isoString) return '-';
    try {
      const date = new Date(isoString);
      return date.toLocaleString('id-ID', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
      }) + ' WIB';
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-6">
      {notification && (
        <div className={`p-4 rounded-2xl border text-xs font-semibold flex items-center justify-between ${
          notification.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
        }`}>
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-white"><X size={14} /></button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white font-heading">Kelola Data Jurusan Keahlian</h2>
          <p className="text-xs text-slate-400 mt-0.5">Jurusan yang dibuat di sini otomatis muncul di dropdown saat buat kelas baru (Realtime Firebase)</p>
        </div>
        <button onClick={openAddModal} className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center space-x-2 shadow-lg shadow-blue-600/20 transition-all cursor-pointer self-start sm:self-auto">
          <Plus size={16} /><span>Tambah Jurusan Baru</span>
        </button>
      </div>

      <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
        <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20"><GraduationCap size={20} /></div>
        <div className="flex-1">
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Program Keahlian</p>
          <p className="text-xl font-extrabold text-white font-numeric">{jurusanList.length} Jurusan</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-bold text-emerald-400">Realtime Sync</span>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
              <ShimmerSkeleton className="h-8 w-8 rounded-xl" /><ShimmerSkeleton className="h-4 w-32" />
              <ShimmerSkeleton className="h-3 w-full" />
            </div>
          ))}
        </div>
      ) : jurusanList.length === 0 ? (
        <div className="p-12 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-slate-500 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 mx-auto flex items-center justify-center"><JurusanIcon size={28} /></div>
          <p className="text-sm font-semibold text-slate-300">Belum ada jurusan terdaftar</p>
          <p className="text-xs max-w-sm mx-auto">Klik "Tambah Jurusan Baru" untuk menambahkan program keahlian. Data langsung tersimpan ke Firebase & muncul di dropdown buat kelas.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jurusanList.map((j, idx) => (
            <div key={j.id} className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-blue-500/40 backdrop-blur-md space-y-4 transition-all group animate-fade-in-up" style={{ animationDelay: `${idx * 0.05}s` }}>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20"><JurusanIcon size={24} /></div>
                  <div>
                    <h3 className="text-sm font-bold text-white font-heading">{j.nama}</h3>
                    <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-bold uppercase font-numeric">ID: {j.id}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <button onClick={() => openEditModal(j)} className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-all cursor-pointer" title="Edit Jurusan"><Edit2 size={13} /></button>
                  <button onClick={() => setDeletingJurusan(j)} className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs transition-all cursor-pointer" title="Hapus Jurusan"><Trash2 size={13} /></button>
                </div>
              </div>
              {j.keterangan && (
                <p className="text-xs text-slate-400 line-clamp-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">{j.keterangan}</p>
              )}
              <div className="pt-3 border-t border-slate-800/80 flex flex-col space-y-1 text-[11px] text-slate-500">
                <div className="flex items-center justify-between">
                  <span className="flex items-center space-x-1"><Calendar size={12} className="text-slate-400" /><span>Dibuat:</span></span>
                  <span className="text-slate-300 font-numeric">{formatDateTime(j.createdAt)}</span>
                </div>
                {j.updatedAt && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center space-x-1"><Clock size={12} className="text-blue-400" /><span>Diperbarui:</span></span>
                    <span className="text-blue-300 font-numeric">{formatDateTime(j.updatedAt)}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <DeleteConfirmModal
        isOpen={Boolean(deletingJurusan)}
        title="Hapus Data Jurusan"
        description="Apakah Anda yakin ingin menghapus data jurusan ini dari database sekolah?"
        itemName={deletingJurusan ? `${deletingJurusan.nama} (ID: ${deletingJurusan.id})` : ''}
        isDeleting={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeletingJurusan(null)}
      />

      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20"><Layers size={18} /></div>
                <h3 className="text-base font-bold text-white font-heading">{editingJurusan ? 'Edit Data Jurusan' : 'Tambah Jurusan Baru'}</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white"><X size={16} /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nama Lengkap Jurusan <span className="text-rose-400">*</span></label>
                <input type="text" required placeholder="contoh: TJKT (Teknik Jaringan Komputer & Telekomunikasi)" value={nama} onChange={(e) => setNama(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
              {!editingJurusan && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Kode / Slug ID Jurusan (Opsional)</label>
                  <input type="text" placeholder="contoh: tjkt, dkv, pplg, akl" value={id} onChange={(e) => setId(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none font-numeric" />
                  <p className="text-[10px] text-slate-500 mt-1">Jika dikosongkan, ID akan dibuat secara otomatis dari nama jurusan.</p>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Keterangan / Deskripsi Singkat</label>
                <textarea rows={3} placeholder="Deskripsi jurusan keahlian..." value={keterangan} onChange={(e) => setKeterangan(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-300 flex items-start space-x-2">
                <BookOpen size={14} className="flex-shrink-0 mt-0.5" />
                <p>Jurusan yang dibuat di sini <strong className="text-white">otomatis muncul di dropdown</strong> saat membuat kelas baru di menu "Kelola Kelas".</p>
              </div>
              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all">Batal</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50">{isSubmitting ? 'Memproses...' : editingJurusan ? 'Simpan Perubahan' : 'Simpan Jurusan'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
