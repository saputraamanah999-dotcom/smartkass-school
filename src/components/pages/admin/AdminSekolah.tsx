import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase/config';
import { Sekolah } from '../../../types';
import { SchoolIcon } from '../../icons/CustomIcons';
import { DeleteConfirmModal } from '../../shared/DeleteConfirmModal';
import { AdminRekapKasSemuaKelas } from '../../shared/AdminRekapKasSemuaKelas';
import { AdminGuru } from './AdminGuru';
import { AdminBendahara } from './AdminBendahara';
import { AdminSiswa } from './AdminSiswa';
import { Breadcrumbs } from '../../shared/Breadcrumbs';
import { Plus, Edit2, Trash2, Calendar, Clock, X, School, ArrowLeft, ArrowRight, Building2, LayoutDashboard, Users, UserCheck, GraduationCap } from 'lucide-react';
import toast from 'react-hot-toast';

export const AdminSekolah: React.FC = () => {
  const [sekolahList, setSekolahList] = useState<(Sekolah & { updatedAt?: string })[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingSekolah, setEditingSekolah] = useState<(Sekolah & { updatedAt?: string }) | null>(null);
  const [deletingSekolah, setDeletingSekolah] = useState<(Sekolah & { updatedAt?: string }) | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Inspector State
  const [inspectedSekolah, setInspectedSekolah] = useState<(Sekolah & { updatedAt?: string }) | null>(null);
  const [inspectedTab, setInspectedTab] = useState<'matrix' | 'guru' | 'bendahara' | 'siswa'>('matrix');

  const [nama, setNama] = useState('');
  const [alamat, setAlamat] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'sekolah'),
      (snap) => {
        const list = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            nama: data.nama || '',
            alamat: data.alamat || '',
            logoUrl: data.logoUrl || '',
            createdAt: data.createdAt || new Date().toISOString(),
            updatedAt: data.updatedAt,
          } as Sekolah & { updatedAt?: string };
        });
        setSekolahList(list);
      },
      (err) => {
        console.error('Error listening to sekolah collection:', err);
        toast.error('Gagal mendengarkan perubahan data sekolah: ' + err.message);
      }
    );
    return () => unsub();
  }, []);

  const openAddModal = () => {
    setEditingSekolah(null);
    setNama('');
    setAlamat('');
    setLogoUrl('');
    setShowModal(true);
  };

  const openEditModal = (s: Sekolah & { updatedAt?: string }) => {
    setEditingSekolah(s);
    setNama(s.nama);
    setAlamat(s.alamat || '');
    setLogoUrl(s.logoUrl || '');
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) return;

    setIsSubmitting(true);
    const nowIso = new Date().toISOString();
    const sekolahId = editingSekolah
      ? editingSekolah.id
      : `sekolah-${Date.now()}`;

    try {
      await setDoc(
        doc(db, 'sekolah', sekolahId),
        {
          id: sekolahId,
          nama: nama.trim(),
          alamat: alamat.trim(),
          logoUrl: logoUrl.trim(),
          createdAt: editingSekolah?.createdAt || nowIso,
          updatedAt: nowIso,
        },
        { merge: true }
      );

      toast.success(
        editingSekolah
          ? `Data sekolah "${nama.trim()}" berhasil diperbarui!`
          : `Sekolah baru "${nama.trim()}" berhasil ditambahkan!`
      );
      setShowModal(false);
    } catch (err: any) {
      console.error('Error saving sekolah:', err);
      toast.error(err.message || 'Gagal menyimpan data sekolah.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingSekolah) return;
    setIsDeleting(true);
    try {
      const docRef = doc(db, 'sekolah', deletingSekolah.id);
      await deleteDoc(docRef);
      toast.success(`Data sekolah "${deletingSekolah.nama}" berhasil dihapus dari Firebase.`);
      setDeletingSekolah(null);
      // Note: onSnapshot listener will automatically update the UI
    } catch (err: any) {
      console.error('Error deleting sekolah:', err);
      const msg = err?.message || '';
      if (msg.includes('permission') || msg.includes('PERMISSION_DENIED')) {
        toast.error('Permission denied! Firestore rules tidak mengizinkan hapus sekolah. Cek security rules.');
      } else {
        toast.error('Gagal menghapus data sekolah: ' + msg);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDateTime = (isoString?: string) => {
    if (!isoString) return '-';
    try {
      const date = new Date(isoString);
      return date.toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }) + ' WIB';
    } catch {
      return isoString;
    }
  };

  // If admin clicked "Masuk Halaman Sekolah Ini" for a specific school
  if (inspectedSekolah) {
    const getTabLabel = () => {
      switch (inspectedTab) {
        case 'matrix':
          return 'Rekapitulasi Kas & Kelas';
        case 'guru':
          return 'Kelola Guru (Wali Kelas)';
        case 'bendahara':
          return 'Kelola Bendahara Kelas';
        case 'siswa':
          return 'Data Siswa Sekolah Ini';
        default:
          return '';
      }
    };

    return (
      <div className="space-y-6">
        {/* Breadcrumbs Navigation */}
        <Breadcrumbs
          items={[
            { label: 'Dashboard Utama Admin', onClick: () => setInspectedSekolah(null) },
            { label: inspectedSekolah.nama, onClick: () => setInspectedTab('matrix') },
            { label: getTabLabel() },
          ]}
        />

        {/* Inspected School Header */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-950/80 via-slate-900 to-slate-900 border border-indigo-500/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            {inspectedSekolah.logoUrl ? (
              <img
                src={inspectedSekolah.logoUrl}
                alt={inspectedSekolah.nama}
                className="w-14 h-14 object-contain rounded-xl bg-slate-900 p-1.5 border border-indigo-500/40"
              />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                <Building2 size={32} />
              </div>
            )}
            <div>
              <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold uppercase tracking-wider border border-indigo-500/30 mb-1">
                <span>Modus Halaman Sekolah</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white font-heading">
                {inspectedSekolah.nama}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {inspectedSekolah.alamat || 'Alamat sekolah belum dikonfigurasi'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setInspectedSekolah(null)}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center space-x-2 border border-slate-700 transition-all cursor-pointer self-start md:self-auto"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Kembali Ke Dashboard Admin</span>
            <span className="sm:hidden">Kembali</span>
          </button>
        </div>

        {/* Sub-tab Switcher for this school */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto scrollbar-none -mx-1 px-1">
          <button
            onClick={() => setInspectedTab('matrix')}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 sm:space-x-2 transition-all cursor-pointer whitespace-nowrap ${
              inspectedTab === 'matrix'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <LayoutDashboard size={15} />
            <span>Rekap Kas</span>
          </button>
          <button
            onClick={() => setInspectedTab('guru')}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 sm:space-x-2 transition-all cursor-pointer whitespace-nowrap ${
              inspectedTab === 'guru'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Users size={15} />
            <span>Guru Wali</span>
          </button>
          <button
            onClick={() => setInspectedTab('bendahara')}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 sm:space-x-2 transition-all cursor-pointer whitespace-nowrap ${
              inspectedTab === 'bendahara'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <UserCheck size={15} />
            <span>Bendahara</span>
          </button>
          <button
            onClick={() => setInspectedTab('siswa')}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 sm:space-x-2 transition-all cursor-pointer whitespace-nowrap ${
              inspectedTab === 'siswa'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <GraduationCap size={15} />
            <span>Data Siswa</span>
          </button>
        </div>

        {/* Tab Content */}
        {inspectedTab === 'matrix' && (
          <AdminRekapKasSemuaKelas
            sekolahId={inspectedSekolah.id}
            sekolahNama={inspectedSekolah.nama}
          />
        )}
        {inspectedTab === 'guru' && (
          <AdminGuru
            sekolahId={inspectedSekolah.id}
            sekolahNama={inspectedSekolah.nama}
          />
        )}
        {inspectedTab === 'bendahara' && (
          <AdminBendahara
            sekolahId={inspectedSekolah.id}
            sekolahNama={inspectedSekolah.nama}
          />
        )}
        {inspectedTab === 'siswa' && (
          <AdminSiswa
            sekolahId={inspectedSekolah.id}
            sekolahNama={inspectedSekolah.nama}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white font-heading">
            Kelola Data Sekolah
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Daftar sekolah terintegrasi Firebase Firestore (Real-Time Synchronized)
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center space-x-2 shadow-lg shadow-indigo-500/20 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>Tambah Sekolah Baru</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sekolahList.map((s) => (
          <div
            key={s.id}
            className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/40 backdrop-blur-md flex flex-col justify-between space-y-4 transition-all"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                {s.logoUrl ? (
                  <img
                    src={s.logoUrl}
                    alt={s.nama}
                    className="w-12 h-12 object-contain rounded-xl bg-slate-800 p-1 border border-slate-700 flex-shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 flex-shrink-0">
                    <SchoolIcon size={28} />
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-bold text-white font-heading">{s.nama}</h3>
                  <p className="text-xs text-slate-400 mt-1">{s.alamat || 'Alamat belum diatur'}</p>
                </div>
              </div>

              <div className="flex items-center space-x-1">
                <button
                  onClick={() => openEditModal(s)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-all cursor-pointer"
                  title="Edit Sekolah"
                >
                  <Edit2 size={13} />
                </button>
                <button
                  onClick={() => setDeletingSekolah(s)}
                  className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs transition-all cursor-pointer"
                  title="Hapus Sekolah"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>

            {/* Action button: Masuk Halaman Sekolah Ini */}
            <button
              onClick={() => setInspectedSekolah(s)}
              className="w-full py-2.5 px-3 rounded-xl bg-indigo-600/90 hover:bg-indigo-600 text-white text-xs font-bold flex items-center justify-center space-x-2 transition-all shadow-md shadow-indigo-600/20 cursor-pointer border border-indigo-500/30"
            >
              <Building2 size={15} />
              <span>Masuk Halaman Sekolah Ini</span>
              <ArrowRight size={14} />
            </button>

            {/* Timestamps audit */}
            <div className="pt-3 border-t border-slate-800/80 flex flex-col space-y-1 text-[11px] text-slate-500">
              <div className="flex items-center justify-between">
                <span className="flex items-center space-x-1">
                  <Calendar size={12} className="text-slate-500" />
                  <span>Dibuat:</span>
                </span>
                <span className="text-slate-300 font-numeric">{formatDateTime(s.createdAt)}</span>
              </div>
              {s.updatedAt && (
                <div className="flex items-center justify-between">
                  <span className="flex items-center space-x-1">
                    <Clock size={12} className="text-indigo-400" />
                    <span>Diperbarui:</span>
                  </span>
                  <span className="text-indigo-300 font-numeric">{formatDateTime(s.updatedAt)}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(deletingSekolah)}
        title="Hapus Data Sekolah"
        description="Apakah Anda yakin ingin menghapus data sekolah ini dari Firebase?"
        itemName={deletingSekolah ? deletingSekolah.nama : ''}
        isDeleting={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeletingSekolah(null)}
      />

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <School size={18} />
                </div>
                <h3 className="text-base font-bold text-white font-heading">
                  {editingSekolah ? 'Edit Data Sekolah' : 'Tambah Sekolah Baru'}
                </h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nama Sekolah <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="SMK Negeri 1 Surabaya"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Alamat Sekolah</label>
                <input
                  type="text"
                  placeholder="Jl. Smakda No. 1, Surabaya"
                  value={alamat}
                  onChange={(e) => setAlamat(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Logo URL (Opsional)</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                >
                  {isSubmitting ? 'Memproses...' : editingSekolah ? 'Simpan Perubahan' : 'Simpan Sekolah'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
