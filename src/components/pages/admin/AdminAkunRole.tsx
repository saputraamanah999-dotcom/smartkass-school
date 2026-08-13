import React, { useState, useEffect } from 'react';
import { doc, deleteDoc, updateDoc, collection, collectionGroup, onSnapshot } from 'firebase/firestore';
import { db } from '../../../lib/firebase/config';
import { UserProfile, Role, Jurusan, Kelas } from '../../../types';
import { useAuth } from '../../../contexts/AuthContext';
import { Users, UserPlus, ShieldCheck, Mail, Lock, Search, Trash2, Edit2, X } from 'lucide-react';
import { DeleteConfirmModal } from '../../shared/DeleteConfirmModal';
import { ShimmerSkeleton } from '../../shared/ShimmerSkeleton';
import { safeIncludes } from '../../../lib/utils/safeString';
import toast from 'react-hot-toast';

export const AdminAkunRole: React.FC = () => {
  const { user, activeSekolahId, createAccount } = useAuth();
  const sekolahId = activeSekolahId || '';

  // Load users from Firestore
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Load jurusan & kelas dynamically from Firestore
  const [jurusanList, setJurusanList] = useState<{ id: string; nama: string }[]>([]);
  const [kelasList, setKelasList] = useState<Kelas[]>([]);

  useEffect(() => {
    if (!sekolahId) {
      setLoadingUsers(false);
      return;
    }
    const unsub = onSnapshot(
      collection(db, 'users'),
      (snap) => {
        const list = snap.docs.map((d) => ({ uid: d.id, ...d.data() } as UserProfile));
        setUsers(list);
        setLoadingUsers(false);
      },
      (err) => {
        console.warn('Error listening to users:', err);
        setUsers([]);
        setLoadingUsers(false);
      }
    );
    return () => unsub();
  }, [sekolahId]);

  // Load jurusan
  useEffect(() => {
    if (!sekolahId) return;
    const unsub = onSnapshot(
      collection(db, `sekolah/${sekolahId}/jurusan`),
      (snap) => {
        setJurusanList(snap.docs.map((d) => ({ id: d.id, nama: d.data().nama || '' })));
      },
      () => setJurusanList([])
    );
    return () => unsub();
  }, [sekolahId]);

  // Load kelas (collectionGroup)
  useEffect(() => {
    if (!sekolahId) return;
    const unsub = onSnapshot(
      collectionGroup(db, 'kelas'),
      (snap) => {
        const list = snap.docs
          .map((d) => ({ id: d.id, _docPath: d.ref.path, ...d.data() } as Kelas & { _docPath?: string }))
          .filter((k) => k.sekolahId === sekolahId || (k._docPath && k._docPath.includes(sekolahId)));
        setKelasList(list);
      },
      () => setKelasList([])
    );
    return () => unsub();
  }, [sekolahId]);

  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserProfile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form
  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('guru');
  const [jurusanId, setJurusanId] = useState('');
  const [kelasId, setKelasId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter kelas by selected jurusan
  const filteredKelas = kelasList.filter((k) => k.jurusanId === jurusanId);

  // When jurusan changes, auto-select first kelas
  useEffect(() => {
    if (jurusanId && filteredKelas.length > 0 && !editingUser) {
      setKelasId(filteredKelas[0].id);
    }
  }, [jurusanId, filteredKelas.length]);

  const openAddModal = () => {
    setEditingUser(null);
    setNama('');
    setEmail('');
    setPassword('');
    setRole('guru');
    setJurusanId(jurusanList.length > 0 ? jurusanList[0].id : '');
    setKelasId('');
    setShowModal(true);
  };

  const openEditModal = (u: UserProfile) => {
    setEditingUser(u);
    setNama(u.nama || '');
    setEmail(u.email || '');
    setPassword('');
    setRole(u.role);
    setJurusanId(u.jurusanId || jurusanList[0]?.id || '');
    setKelasId(u.kelasId || '');
    setShowModal(true);
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim() || !email.trim()) return;

    // Password required for new accounts
    if (!editingUser && (!password || password.length < 6)) {
      toast.error('Password wajib diisi (minimal 6 karakter) untuk membuat akun baru.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingUser) {
        await updateDoc(doc(db, 'users', editingUser.uid), {
          nama: nama.trim(),
          email: email.trim().toLowerCase(),
          role,
          jurusanId: role === 'admin' ? '' : jurusanId,
          kelasId: role === 'admin' ? '' : kelasId,
          updatedAt: new Date().toISOString(),
        });
        toast.success(`Data pengguna "${nama}" berhasil diperbarui!`);
      } else {
        // Create new account with Firebase Auth
        await createAccount({
          nama: nama.trim(),
          email: email.trim().toLowerCase(),
          password,
          role,
          sekolahId,
          jurusanId: role === 'admin' ? '' : jurusanId,
          kelasId: role === 'admin' ? '' : kelasId,
        });
        toast.success(`Akun pengguna "${nama}" berhasil dibuat!`);
      }
      setShowModal(false);
    } catch (err: any) {
      console.error('Error saving account:', err);
      toast.error(err.message || 'Gagal menyimpan data pengguna.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingUser) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'users', deletingUser.uid));
      toast.success(`Akun "${deletingUser.nama}" berhasil dihapus.`);
      setDeletingUser(null);
    } catch (err: any) {
      console.error('Error deleting user:', err);
      toast.error('Gagal menghapus akun pengguna.');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      safeIncludes(u.nama, searchQuery) ||
      safeIncludes(u.email, searchQuery) ||
      safeIncludes(u.role, searchQuery) ||
      safeIncludes(u.kelasId, searchQuery)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white font-heading">Kelola Akun & Role (RBAC)</h2>
          <p className="text-xs text-slate-400 mt-0.5">Manajemen hak akses & akun pengguna (Admin, Guru Wali Kelas, Bendahara Kelas)</p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-500 w-3.5 h-3.5" />
            <input type="text" placeholder="Cari nama, email, role..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none w-48 sm:w-64 font-numeric" />
          </div>
          <button onClick={openAddModal} className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center space-x-2 shadow-lg shadow-indigo-500/20 transition-all cursor-pointer whitespace-nowrap">
            <UserPlus size={16} /><span>Buat Akun Baru</span>
          </button>
        </div>
      </div>

      <div className="w-full overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-md">
        <table className="w-full text-xs text-left text-slate-300">
          <thead className="text-[11px] text-slate-400 bg-slate-950/80 uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th className="px-4 py-3.5 font-bold">Nama Pengguna</th>
              <th className="px-4 py-3.5 font-bold">Email</th>
              <th className="px-4 py-3.5 font-bold">Role Akses</th>
              <th className="px-4 py-3.5 font-bold">Sekolah / Kelas</th>
              <th className="px-4 py-3.5 font-bold text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {loadingUsers ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={`skeleton-${i}`}>
                  <td className="px-4 py-3"><div className="flex items-center space-x-2"><ShimmerSkeleton className="h-7 w-7 rounded-full shrink-0" /><ShimmerSkeleton className="h-3 w-28" /></div></td>
                  <td className="px-4 py-3"><ShimmerSkeleton className="h-3 w-40" /></td>
                  <td className="px-4 py-3"><ShimmerSkeleton className="h-5 w-16 rounded-full" /></td>
                  <td className="px-4 py-3"><ShimmerSkeleton className="h-3 w-24" /></td>
                  <td className="px-4 py-3 text-right"><div className="flex items-center justify-end space-x-1"><ShimmerSkeleton className="h-6 w-6 rounded-lg" /><ShimmerSkeleton className="h-6 w-6 rounded-lg" /></div></td>
                </tr>
              ))
            ) : filteredUsers.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">Tidak ada data akun pengguna yang ditemukan.</td></tr>
            ) : (
              filteredUsers.map((u, idx) => (
                <tr key={u.uid || idx} className="hover:bg-slate-800/40 transition-colors" style={{ animationFillMode: 'backwards' }}>
                  <td className="px-4 py-3 font-semibold text-white">
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 rounded-full bg-indigo-600/30 text-indigo-300 font-bold flex items-center justify-center text-xs border border-indigo-500/30">{(u.nama || '?').charAt(0)}</div>
                      <span>{u.nama || 'Tanpa Nama'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-400 font-numeric">{u.email || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${u.role === 'admin' ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' : u.role === 'guru' ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-300 font-semibold">{u.kelasId ? `${u.kelasId.toUpperCase()} (${(u.jurusanId || '-').toUpperCase()})` : u.jurusanId ? u.jurusanId.toUpperCase() : '-'}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end space-x-1">
                      <button onClick={() => openEditModal(u)} className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer" title="Edit Role & Data"><Edit2 size={14} /></button>
                      <button onClick={() => setDeletingUser(u)} className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-all cursor-pointer" title="Hapus Akun"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <DeleteConfirmModal isOpen={Boolean(deletingUser)} title="Hapus Akun Pengguna" description="Apakah Anda yakin ingin menghapus akun ini?" itemName={deletingUser ? `${deletingUser.nama || ''} (${deletingUser.email || ''} - Role: ${deletingUser.role})` : ''} isDeleting={isDeleting} onConfirm={confirmDelete} onCancel={() => setDeletingUser(null)} />

      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white font-heading">{editingUser ? 'Edit Akun Pengguna' : 'Buat Akun Pengguna Baru'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white"><X size={16} /></button>
            </div>

            <form onSubmit={handleSaveAccount} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nama Lengkap</label>
                <input type="text" required placeholder="Pak Dedi Supriyadi" value={nama} onChange={(e) => setNama(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email Login</label>
                <input type="email" required placeholder="nama.user@smartkas.sch.id" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none font-numeric" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {editingUser ? 'Password Baru (kosongkan jika tidak diubah)' : 'Password Login'} <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 text-slate-500 w-3.5 h-3.5" />
                  <input type="password" placeholder={editingUser ? 'Kosongkan jika tidak diubah' : 'Minimal 6 karakter'} value={password} onChange={(e) => setPassword(e.target.value)} className={`w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none ${!editingUser ? 'border-rose-500/50' : ''}`} />
                </div>
                {!editingUser && <p className="text-[10px] text-slate-500 mt-1">Akun ini akan dibuat di Firebase Authentication. Guru/Bendahara bisa login dengan email + password ini.</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Pilih Role Akses</label>
                <select value={role} onChange={(e) => setRole(e.target.value as Role)} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                  <option value="admin">Admin (Akses Penuh Seluruh Sekolah)</option>
                  <option value="guru">Guru / Wali Kelas</option>
                  <option value="bendahara">Bendahara Kelas</option>
                </select>
              </div>

              {role !== 'admin' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Pilih Jurusan</label>
                    <select value={jurusanId} onChange={(e) => { setJurusanId(e.target.value); setKelasId(''); }} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                      {jurusanList.length === 0 ? (<option value="">-- Belum ada jurusan --</option>) : jurusanList.map((j) => (<option key={j.id} value={j.id}>{j.nama}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Pilih Kelas</label>
                    <select value={kelasId} onChange={(e) => setKelasId(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                      {filteredKelas.length === 0 ? (<option value="">-- Pilih jurusan dulu --</option>) : filteredKelas.map((k) => (<option key={k.id} value={k.id}>{k.nama}</option>))}
                    </select>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all">Batal</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50">{isSubmitting ? 'Memproses...' : editingUser ? 'Simpan Perubahan' : 'Buat Akun'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
