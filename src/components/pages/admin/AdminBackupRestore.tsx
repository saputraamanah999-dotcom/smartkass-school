import React, { useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../lib/firebase/config';
import { Database, Download, RefreshCw, CheckCircle2 } from 'lucide-react';

export const AdminBackupRestore: React.FC = () => {
  const [backingUp, setBackingUp] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleBackup = async () => {
    setBackingUp(true);
    setSuccess(false);
    try {
      const sekolahSnap = await getDocs(collection(db, 'sekolah'));
      const usersSnap = await getDocs(collection(db, 'users'));
      const configSnap = await getDocs(collection(db, 'config'));

      const backupData = {
        timestamp: new Date().toISOString(),
        sekolah: sekolahSnap.docs.map((d) => d.data()),
        users: usersSnap.docs.map((d) => d.data()),
        config: configSnap.docs.map((d) => d.data()),
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `smartkas_backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();

      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (e) {
      console.error('Backup error:', e);
    } finally {
      setBackingUp(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-xl font-extrabold text-white font-heading">Backup & Restore Data</h2>
        <p className="text-xs text-slate-400 mt-0.5">Cadangkan seluruh basis data Firestore dalam format JSON</p>
      </div>

      {success && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center space-x-2">
          <CheckCircle2 size={18} />
          <span><strong>Backup Berhasil!</strong> File JSON backup telah terunduh ke perangkat Anda.</span>
        </div>
      )}

      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md space-y-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Database size={24} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white font-heading">Unduh Backup Firestore</h3>
            <p className="text-xs text-slate-400">Ekspor data sekolah, kelas, siswa, pembayaran, dan konfigurasi.</p>
          </div>
        </div>

        <button
          onClick={handleBackup}
          disabled={backingUp}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center space-x-2 shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50"
        >
          {backingUp ? <RefreshCw className="animate-spin" size={16} /> : <Download size={16} />}
          <span>{backingUp ? 'Mengekspor Data...' : 'Unduh File Backup (.json)'}</span>
        </button>
      </div>
    </div>
  );
};
