import React from 'react';
import { X, Database, ExternalLink } from 'lucide-react';

/**
 * DatabaseSetupModal — informational modal.
 * All data is now created directly through the admin UI (realtime Firebase).
 * This modal simply guides the user to create data via the admin menu.
 */
export const DatabaseSetupModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Database size={24} />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white font-heading">Data Firebase</h2>
              <p className="text-xs text-slate-400 mt-0.5">Semua data tersimpan realtime di Firestore</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Info content */}
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 space-y-2">
            <p className="font-bold">Semua data sudah realtime dari Firebase.</p>
            <p className="text-emerald-300/80">
              Buat data langsung dari menu admin: Sekolah, Jurusan, Kelas, Guru, Bendahara, dan Siswa.
              Semua perubahan langsung tersimpan ke Firebase Firestore secara otomatis.
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Langkah-langkah awal:</p>
            <ol className="space-y-1.5 text-xs text-slate-300 list-decimal list-inside">
              <li>Buat <strong className="text-white">Sekolah</strong> di menu Kelola Sekolah</li>
              <li>Buat <strong className="text-white">Jurusan</strong> di menu Kelola Jurusan (PPLG, TJKT, DKV, dll)</li>
              <li>Buat <strong className="text-white">Kelas</strong> di menu Kelola Kelas (otomatis buat akun Guru & Bendahara)</li>
              <li>Tambah <strong className="text-white">Siswa</strong> di menu Data Siswa atau langsung di Matriks Checkbox</li>
              <li>Catat <strong className="text-white">Pembayaran Kas</strong> di menu Bendahara</li>
            </ol>
          </div>
        </div>

        {/* Close button */}
        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all cursor-pointer shadow-lg shadow-indigo-500/20"
          >
            Mengerti
          </button>
        </div>
      </div>
    </div>
  );
};

export default DatabaseSetupModal;
