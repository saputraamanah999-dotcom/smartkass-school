import React, { useState, useEffect } from 'react';
import { doc, setDoc, deleteDoc, collection, collectionGroup, onSnapshot } from 'firebase/firestore';
import { db } from '../../../lib/firebase/config';
import { UserProfile, Jurusan, Kelas } from '../../../types';
import { BendaharaIcon } from '../../icons/CustomIcons';
import { ShimmerSkeleton } from '../../shared/ShimmerSkeleton';
import { DeleteConfirmModal } from '../../shared/DeleteConfirmModal';
import { useAuth } from '../../../contexts/AuthContext';
import { safeIncludes } from '../../../lib/utils/safeString';
import { Mail, ShieldCheck, UserPlus, Search, Trash2, Edit2, X, School, BookOpen, Wallet, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

interface AdminBendaharaProps {
  sekolahId?: string;
  sekolahNama?: string;
}

export const AdminBendahara: React.FC<AdminBendaharaProps> = ({ sekolahId: initialSekolahId }) => {
  const { user, activeSekolahId, createAccount } = useAuth();
  const sekolahId = initialSekolahId || activeSekolahId || '';

  // Load bendahara users from Firestore
  const [bendaharaList, setBendaharaList] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Load sekolah, jurusan, kelas dynamically from Firestore
  const [sekolahList, setSekolahList] = useState<{ id: string; nama: string }[]>([]);
  const [jurusanList, setJurusanList] = useState<{ id: string; nama: string }[]>([]);
  const [kelasList, setKelasList] = useState<{ id: string; nama: string; jurusanId: string }[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'sekolah'), (snap) => {
      setSekolahList(snap.docs.map((d) => ({ id: d.id, nama: d.data().nama || d.id })));
    }, () => {});
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!sekolahId) return;
    const unsub = onSnapshot(collection(db, `sekolah/${sekolahId}/jurusan`), (snap) => {
      setJurusanList(snap.docs.map((d) => ({ id: d.id, nama: d.data().nama || '' })));
    }, () => setJurusanList([]));
    return () => unsub();
  }, [sekolahId]);

  useEffect(() => {
    const unsub = onSnapshot(collectionGroup(db, 'kelas'), (snap: any) => {
      const list = snap.docs
        .map((d: any) => ({ id: d.id, _docPath: d.ref.path, ...d.data() }))
        .filter((k: any) => k.sekolahId === sekolahId || (k._docPath && k._docPath.includes(sekolahId)))
        .map((k: any) => ({ id: k.id, nama: k.nama, jurusanId: k.jurusanId }));
      setKelasList(list);
    }, () => setKelasList([]));
    return () => unsub();
  }, [sekolahId]);

  // Subscribe to users with role=bendahara
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snap) => {
      const list = snap.docs
        .map((d) => ({ uid: d.id, ...d.data() } as UserProfile))
        .filter((u) => u.role === 'bendahara');
      setBendaharaList(list);
      setLoading(false);
    }, () => { setBendaharaList([]); setLoading(false); });
    return () => unsub();
  }, []);

  // Load jurusan for the form's selected sekolah (reacts to formSekolahId changes)
  const [formJurusanList, setFormJurusanList] = useState<{ id: string; nama: string }[]>([]);
  useEffect(() => {
    if (!formSekolahId) { setFormJurusanList([]); return; }
    const unsub = onSnapshot(collection(db, `sekolah/${formSekolahId}/jurusan`), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, nama: d.data().nama || '' }));
      setFormJurusanList(list);
      // Reset jurusan & kelas when school changes
      setJurusanId('');
      setKelasId('');
    }, () => { setFormJurusanList([]); });
    return () => unsub();
  }, [formSekolahId]);

  const filteredKelas = kelasList.filter((k) => k.jurusanId === jurusanId);

  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingBendahara, setEditingBendahara] = useState<UserProfile | null>(null);
  const [deletingBendahara, setDeletingBendahara] = useState<UserProfile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formSekolahId, setFormSekolahId] = useState(sekolahId);
  const [jurusanId, setJurusanId] = useState('');
  const [kelasId, setKelasId] = useState('');

  useEffect(() => {
    if (jurusanId && filteredKelas.length > 0 && !editingBendahara) {
      setKelasId(filteredKelas[0].id);
    }
  }, [jurusanId, filteredKelas.length]);

  const openAddModal = () => {
    setEditingBendahara(null);
    setNama('');
    setEmail('');
    setPassword('');
    setFormSekolahId(sekolahId);
    setJurusanId('');
    setKelasId('');
    setShowModal(true);
  };

  const openEditModal = (b: UserProfile) => {
    setEditingBendahara(b);
    setNama(b.nama);
    setEmail(b.email);
    setPassword('');
    setFormSekolahId(b.sekolahId || sekolahId);
    setJurusanId(b.jurusanId || '');
    setKelasId(b.kelasId || '');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim() || !email.trim()) {
      toast.error('Nama dan email wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingBendahara) {
        await setDoc(doc(db, 'users', editingBendahara.uid), {
          nama: nama.trim(),
          email: email.trim().toLowerCase(),
          role: 'bendahara',
          sekolahId: formSekolahId,
          jurusanId,
          kelasId,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
        toast.success(`Data Bendahara "${nama}" berhasil diperbarui!`);
      } else {
        // New account - password required
        if (!password || password.length < 6) {
          toast.error('Password wajib diisi (minimal 6 karakter).');
          setIsSubmitting(false);
          return;
        }

        await createAccount({
          nama: nama.trim(),
          email: email.trim().toLowerCase(),
          password,
          role: 'bendahara',
          sekolahId: formSekolahId,
          jurusanId,
          kelasId,
        });
        toast.success(`Akun Bendahara "${nama}" berhasil dibuat!`);
      }
      setShowModal(false);
    } catch (err: any) {
      console.error('Error saving bendahara:', err);
      toast.error(err.message || 'Gagal menyimpan data akun bendahara.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingBendahara) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'users', deletingBendahara.uid));
      toast.success(`Akun Bendahara "${deletingBendahara.nama}" telah dihapus.`);
      setDeletingBendahara(null);
    } catch (err: any) {
      console.error('Error deleting bendahara:', err);
      toast.error('Gagal menghapus akun bendahara.');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredList = bendaharaList.filter((b) => {
    if (initialSekolahId && b.sekolahId && b.sekolahId !== initialSekolahId) return false;
    return safeIncludes(b.nama, searchQuery) || safeIncludes(b.email, searchQuery) || safeIncludes(b.kelasId, searchQuery);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white font-heading">Data Bendahara Kelas</h2>
          <p className="text-xs text-slate-400 mt-0.5">Akun login bendahara terintegrasi Firebase Auth. Jurusan & kelas diambil dari data Firebase.</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-500 w-3.5 h-3.5" />
            <input type="text" placeholder="Cari bendahara / kelas..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none w-48 sm:w-64" />
          </div>
          <button onClick={openAddModal} className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center space-x-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer whitespace-nowrap">
            <UserPlus size={16} /><span>Buat Akun Bendahara</span>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
        <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20"><Wallet size={20} /></div>
        <div className="flex-1">
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Bendahara Kelas</p>
          <p className="text-xl font-extrabold text-white font-numeric">{bendaharaList.length} Bendahara</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-bold text-emerald-400">Realtime Sync</span>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{[0, 1, 2].map((i) => (<div key={i} className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4"><ShimmerSkeleton className="h-8 w-8 rounded-xl" /><ShimmerSkeleton className="h-4 w-32" /><ShimmerSkeleton className="h-3 w-full" /></div>))}</div>
      ) : filteredList.length === 0 ? (
        <div className="p-12 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-slate-500 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 mx-auto flex items-center justify-center"><BendaharaIcon size={28} /></div>
          <p className="text-sm font-semibold text-slate-300">Belum ada akun Bendahara</p>
          <p className="text-xs max-w-sm mx-auto">Klik tombol "Buat Akun Bendahara" untuk menambahkan bendahara kelas baru.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredList.map((b, idx) => (
            <div key={b.uid} className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 backdrop-blur-md space-y-4 transition-all group animate-fade-in-up" style={{ animationDelay: `${idx * 0.05}s` }}>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20"><BendaharaIcon size={24} /></div>
                  <div>
                    <h3 className="text-sm font-bold text-white font-heading">{b.nama}</h3>
                    <p className="text-[11px] text-amber-300 font-semibold mt-0.5">Bendahara Kelas</p>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <button onClick={() => openEditModal(b)} className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-all" title="Edit Bendahara"><Edit2 size={13} /></button>
                  <button onClick={() => setDeletingBendahara(b)} className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs transition-all" title="Hapus Akun"><Trash2 size={13} /></button>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium text-[11px]">Jurusan & Kelas:</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[11px] font-bold uppercase">{(b.kelasId || '-').toUpperCase()} ({(b.jurusanId || '-').toUpperCase()})</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-slate-300 pt-1 border-t border-slate-900">
                  <Mail size={13} className="text-slate-500 flex-shrink-0" /><span className="truncate text-slate-300 font-numeric">{b.email}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-800/80">
                <span className="flex items-center space-x-1 text-emerald-400"><ShieldCheck size={12} /><span>Akses Login Aktif</span></span>
              </div>
            </div>
          ))}
        </div>
      )}

      <DeleteConfirmModal isOpen={Boolean(deletingBendahara)} title="Hapus Akun Bendahara" description="Apakah Anda yakin ingin menghapus akun bendahara ini?" itemName={deletingBendahara ? `${deletingBendahara.nama} (${deletingBendahara.email})` : ''} isDeleting={isDeleting} onConfirm={confirmDelete} onCancel={() => setDeletingBendahara(null)} />

      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20"><UserPlus size={18} /></div>
                <h3 className="text-base font-bold text-white font-heading">{editingBendahara ? 'Edit Akun Bendahara' : 'Buat Akun Bendahara'}</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white"><X size={16} /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nama Lengkap Bendahara <span className="text-rose-400">*</span></label>
                <input type="text" required placeholder="contoh: Ananda Putri" value={nama} onChange={(e) => setNama(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email Login <span className="text-rose-400">*</span></label>
                <input type="email" required placeholder="bendahara.xdkv2@smartkas.sch.id" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none font-numeric" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {editingBendahara ? 'Password Baru (kosongkan jika tidak diubah)' : 'Password Login *'}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 text-slate-500 w-4 h-4" />
                  <input type="password" placeholder={editingBendahara ? 'Kosongkan jika tidak diubah' : 'Minimal 6 karakter'} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Pilih Sekolah <span className="text-rose-400">*</span></label>
                <select value={formSekolahId} onChange={(e) => setFormSekolahId(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none font-semibold">
                  {sekolahList.map((s) => (<option key={s.id} value={s.id}>{s.nama}</option>))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Pilih Jurusan</label>
                  <select value={jurusanId} onChange={(e) => { setJurusanId(e.target.value); setKelasId(''); }} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none">
                    {formJurusanList.length === 0 ? (<option value="">-- Belum ada --</option>) : formJurusanList.map((j) => (<option key={j.id} value={j.id}>{j.nama}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Pilih Kelas</label>
                  <select value={kelasId} onChange={(e) => setKelasId(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none">
                    {filteredKelas.length === 0 ? (<option value="">-- Pilih jurusan --</option>) : filteredKelas.map((k) => (<option key={k.id} value={k.id}>{k.nama}</option>))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all">Batal</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50">{isSubmitting ? 'Memproses...' : editingBendahara ? 'Simpan Perubahan' : 'Buat Akun Bendahara'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
