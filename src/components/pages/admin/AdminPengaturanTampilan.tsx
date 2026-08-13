import React from 'react';
import { useTampilanConfig } from '../../../hooks/useTampilanConfig';
import { TampilanConfigForm } from '../../forms/TampilanConfigForm';

export const AdminPengaturanTampilan: React.FC = () => {
  const { config, loading } = useTampilanConfig();

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading konfigurasi tampilan...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-extrabold text-white font-heading">
          Pengaturan Tampilan & Visual Realtime
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Ubah logo sekolah, splash background, video intro, banner dashboard, dan tagline. Semua tersimpan ke Firestore <code>config/tampilan</code> dan ter-update otomatis ke semua perangkat tanpa redeploy!
        </p>
      </div>

      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
        <TampilanConfigForm currentConfig={config} />
      </div>
    </div>
  );
};
