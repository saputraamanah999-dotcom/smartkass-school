import React, { useState, useEffect } from 'react';
import { doc, setDoc, deleteDoc, updateDoc, addDoc, collection, collectionGroup, onSnapshot } from 'firebase/firestore';
import { db } from '../../../lib/firebase/config';
import { UserProfile, Jurusan, Kelas } from '../../../types';
import { GuruIcon } from '../../icons/CustomIcons';
import { DeleteConfirmModal } from '../../shared/DeleteConfirmModal';
import { ShimmerSkeleton } from '../../shared/ShimmerSkeleton';
import { useAuth } from '../../../contexts/AuthContext';
import { safeIncludes } from '../../../lib/utils/safeString';
import { Mail, ShieldCheck, Plus, Search, Trash2, Edit, X, UserPlus, School, BookOpen, GraduationCap, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

interface AdminGuruProps {
  sekolahId?: string;
  sekolahNama?: string;
}

export const AdminGuru: React.FC<AdminGuruProps> = ({ sekolahId: initialSekolahId }) => {
  const { user, activeSekolahId, createAccount } = useAuth();
  const sekolahId = initialSekolahId || activeSekolahId || '';

  // Load guru users from Firestore
  const [guruList, setGuruList] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Load sekolah, jurusan, kelas dynamically
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
    const unsub = onSnapshot(collectionGroup(db, 'kelas'), (snap: any) => {
      const list = snap.docs
        .map((d: any) => ({ id: d.id, _docPath: d.ref.path, ...d.data() }))
        .filter((k: any) => k.sekolahId === sekolahId || (k._docPath && k._docPath.includes(sekolahId)))
        .map((k: any) => ({ id: k.id, nama: k.nama, jurusanId: k.jurusanId }));
      setKelasList(list);
    }, () => setKelasList([]));
    return () => unsub();
  }, [sekolahId]);

  // Subscribe to users with role=guru
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snap) => {
      const list = snap.docs
        .map((d) => ({ uid: d.id, ...d.data() } as UserProfile))
        .filter((u) => u.role === 'guru');
      setGuruList(list);
      setLoading(false);
    }, () => { setGuruList([]); setLoading(false); });
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGuru, setEditingGuru] = useState<UserProfile | null>(null);
  const [deletingGuru, setDeletingGuru] = useState<UserProfile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formSekolahId, setFormSekolahId] = useState(sekolahId);
  const [jurusanId, setJurusanId] = useState('');
  const [kelasId, setKelasId] = useState('');

  useEffect(() => {
    if (jurusanId && filteredKelas.length > 0 && !editingGuru) {
      setKelasId(filteredKelas[0].id);
    }
  }, [jurusanId, filteredKelas.length]);

  const openAddModal = () => {
    setEditingGuru(null);
    setNama('');
    setEmail('');
    setPassword('');
    setFormSekolahId(sekolahId);
    setJurusanId('');
    setKelasId('');
    setIsModalOpen(true);
  };

  const openEditModal = (guru: UserProfile) => {
    setEditingGuru(guru);
    setNama(guru.nama);
    setEmail(guru.email);
    setPassword('');
    setFormSekolahId(guru.sekolahId || sekolahId);
    setJurusanId(guru.jurusanId || '');
    setKelasId(guru.kelasId || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim() || !email.trim()) {
      toast.error('Nama dan email wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingGuru) {
        // Update existing user
        await setDoc(doc(db, 'users', editingGuru.uid), {
          nama: nama.trim(),
          email: email.trim().toLowerCase(),
          role: 'guru',
          sekolahId: formSekolahId,
          jurusanId,
          kelasId,
          updatedAt: new Date().toISOString(),
        }, { merge: true });

        // Update kelas wali kelas
        if (formSekolahId && jurusanId && kelasId) {
          await updateDoc(doc(db, `sekolah/${formSekolahId}/jurusan/${jurusanId}/kelas/${kelasId}`), {
            waliKelasUid: editingGuru.uid,
            waliKelasNama: nama.trim(),
          }).catch(() => {});
        }

        toast.success(`Data guru "${nama.trim()}" berhasil diperbarui!`);
      } else {
        // New account - password required
        if (!password || password.length < 6) {
          toast.error('Password wajib diisi (minimal 6 karakter).');
          setIsSubmitting(false);
          return;
        }

        const newUid = await createAccount({
          nama: nama.trim(),
          email: email.trim().toLowerCase(),
          password,
          role: 'guru',
          sekolahId: formSekolahId,
          jurusanId,
          kelasId,
        });

        // Update kelas wali kelas
        if (formSekolahId && jurusanId && kelasId) {
          await updateDoc(doc(db, `sekolah/${formSekolahId}/jurusan/${jurusanId}/kelas/${kelasId}`), {
            waliKelasUid: newUid,
            waliKelasNama: nama.trim(),
          }).catch(() => {});
        }

        toast.success(`Guru baru "${nama.trim()}" berhasil ditambahkan!`);
      }

      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Error saving guru:', err);
      toast.error(err.message || 'Gagal menyimpan data guru.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDeleteGuru = async () => {
    if (!deletingGuru) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'users', deletingGuru.uid));
      toast.success(`Data guru "${deletingGuru.nama}" telah dihapus.`);
      setDeletingGuru(null);
    } catch (err: any) {
      console.error('Failed to delete guru:', err);
      toast.error('Gagal menghapus data guru.');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredGuru = guruList.filter((g) => {
    if (initialSekolahId && g.sekolahId && g.sekolahId !== initialSekolahId) return false;
    return safeIncludes(g.nama, searchQuery) || safeIncludes(g.email, searchQuery) || safeIncludes(g.kelasId, searchQuery);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white font-heading">Data Guru / Wali Kelas</h2>
          <p className="text-xs text-slate-400 mt-0.5">Akun login guru dibuat di Firebase Authentication dengan password. Data jurusan & kelas diambil dari Firebase.</p>
        </div>
        <button onClick={openAddModal} className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-purple-600 text-white font-semibold text-xs shadow-lg shadow-purple-500/25 hover:bg-purple-500 transition-all cursor-pointer">
          <UserPlus size={18} /><span>+ Input Data Guru</span>
        </button>
      </div>

      <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
        <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20"><GraduationCap size={20} /></div>
        <div className="flex-1">
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Guru Wali Kelas</p>
          <p className="text-xl font-extrabold text-white font-numeric">{guruList.length} Guru</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-bold text-emerald-400">Realtime Sync</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? ([0, 1, 2].map((i) => (
          <div key={i} className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4"><ShimmerSkeleton className="h-8 w-8 rounded-xl" /><ShimmerSkeleton className="h-4 w-32" /><ShimmerSkeleton className="h-3 w-full" /></div>
        ))) : (
          filteredGuru.map((g, idx) => (
            <div key={g.uid} className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-purple-500/40 space-y-4 transition-all group animate-fade-in-up" style={{ animationDelay: `${Math.min(idx * 0.05, 0.4)}s`, animationFillMode: 'backwards' }}>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20"><GuruIcon size={24} /></div>
                  <div>
                    <h3 className="text-sm font-bold text-white font-heading">{g.nama}</h3>
                    <p className="text-xs text-purple-300 font-semibold mt-0.5">Guru Wali Kelas</p>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <button onClick={() => openEditModal(g)} className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-all cursor-pointer" title="Edit Guru"><Edit size={16} /></button>
                  <button onClick={() => setDeletingGuru(g)} className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs transition-all cursor-pointer" title="Hapus Guru"><Trash2 size={16} /></button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 flex items-center space-x-2">
                  <Mail size={14} className="text-slate-400 flex-shrink-0" /><span className="truncate">{g.email}</span>
                </div>
                <div className="flex items-center justify-between text-xs px-1 text-slate-500">
                  <span className="flex items-center space-x-1"><BookOpen size={12} className="text-indigo-500" /><span>Kelas: <strong className="text-slate-200 uppercase">{g.kelasId || '-'}</strong></span></span>
                  <span className="flex items-center space-x-1"><School size={12} className="text-indigo-500" /><span>{(g.jurusanId || '').toUpperCase()}</span></span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-800">
                <span className="flex items-center space-x-1 text-emerald-400"><ShieldCheck size={12} /><span>Terverifikasi Admin</span></span>
              </div>
            </div>
          ))
        )}

        {filteredGuru.length === 0 && !loading && (
          <div className="col-span-full p-8 text-center bg-slate-900/40 rounded-2xl border border-dashed border-slate-800">
            <GuruIcon size={36} className="mx-auto text-slate-400 mb-2 opacity-50" />
            <p className="text-sm font-semibold text-slate-400">Belum Ada Data Guru</p>
            <p className="text-xs text-slate-500 mt-1">Klik tombol "+ Input Data Guru" untuk menambahkan wali kelas baru.</p>
          </div>
        )}
      </div>

      <DeleteConfirmModal isOpen={Boolean(deletingGuru)} title="Hapus Data Guru" description="Apakah Anda yakin ingin menghapus data wali kelas ini?" itemName={deletingGuru ? `${deletingGuru.nama} (${deletingGuru.email})` : ''} isDeleting={isDeleting} onConfirm={confirmDeleteGuru} onCancel={() => setDeletingGuru(null)} />

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-2xl relative space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400"><UserPlus size={20} /></div>
                <h3 className="text-base sm:text-lg font-extrabold text-white font-heading">{editingGuru ? 'Edit Data Guru' : 'Input Data Guru Baru'}</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors"><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nama Lengkap Guru / Wali Kelas *</label>
                <input type="text" required placeholder="Contoh: Ibu Ratna Dewi, S.Pd." value={nama} onChange={(e) => setNama(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Alamat Email Login Guru *</label>
                <input type="email" required placeholder="Contoh: ratna.guru@smartkas.sch.id" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {editingGuru ? 'Password Baru (kosongkan jika tidak diubah)' : 'Password Login Guru *'}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 text-slate-500 w-4 h-4" />
                  <input type="password" placeholder={editingGuru ? 'Kosongkan jika tidak diubah' : 'Minimal 6 karakter'} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Pilih Sekolah *</label>
                <select value={formSekolahId} onChange={(e) => setFormSekolahId(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 font-semibold">
                  {sekolahList.map((s) => (<option key={s.id} value={s.id}>{s.nama}</option>))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Jurusan</label>
                  <select value={jurusanId} onChange={(e) => { setJurusanId(e.target.value); setKelasId(''); }} className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:ring-2 focus:ring-purple-500">
                    {formJurusanList.length === 0 ? (<option value="">-- Belum ada --</option>) : formJurusanList.map((j) => (<option key={j.id} value={j.id}>{j.nama}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Kelas Diampu</label>
                  <select value={kelasId} onChange={(e) => setKelasId(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:ring-2 focus:ring-purple-500">
                    {filteredKelas.length === 0 ? (<option value="">-- Pilih jurusan --</option>) : filteredKelas.map((k) => (<option key={k.id} value={k.id}>{k.nama}</option>))}
                  </select>
                </div>
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-slate-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl border border-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-800 transition-colors">Batal</button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-500/20 transition-all disabled:opacity-50">{isSubmitting ? 'Menyimpan...' : editingGuru ? 'Simpan Perubahan' : 'Input Data Guru'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default AdminGuru;
