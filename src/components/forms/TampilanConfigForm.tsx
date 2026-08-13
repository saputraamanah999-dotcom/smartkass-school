import React, { useState } from 'react';
import { TampilanConfig } from '../../types';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase/config';
import { Check, Sparkles } from 'lucide-react';

interface TampilanConfigFormProps {
  currentConfig: TampilanConfig;
}

export const TampilanConfigForm: React.FC<TampilanConfigFormProps> = ({ currentConfig }) => {
  const [logoUrl, setLogoUrl] = useState(currentConfig.logoUrl || '');
  const [splashBackgroundUrl, setSplashBackgroundUrl] = useState(currentConfig.splashBackgroundUrl || '');
  const [splashVideoUrl, setSplashVideoUrl] = useState(currentConfig.splashVideoUrl || '');
  const [splashDuration, setSplashDuration] = useState<number>(currentConfig.splashDuration || 4);
  const [bannerUrl, setBannerUrl] = useState(currentConfig.bannerUrl || '');
  const [tagline, setTagline] = useState(currentConfig.tagline || '');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

    try {
      const updatedConfig: TampilanConfig = {
        logoUrl,
        splashBackgroundUrl,
        splashVideoUrl,
        splashDuration: Number(splashDuration) || 4,
        bannerUrl,
        tagline,
        updatedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'config', 'tampilan'), updatedConfig);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      console.error('Error saving config:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {success && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center space-x-2">
          <Check size={18} />
          <span>
            <strong>Berhasil disimpan!</strong> Seluruh perangkat dan pengguna yang sedang membuka aplikasi telah ter-update secara realtime!
          </span>
        </div>
      )}

      <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-start space-x-3">
        <Sparkles className="text-indigo-400 w-5 h-5 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-indigo-300">
          <p className="font-bold">Sistem URL Assets Realtime</p>
          <p className="mt-0.5 text-indigo-300/80">
            Semua gambar dan video dimasukkan dalam bentuk link URL. Begitu Anda klik Simpan, data tersimpan di Firestore <code>config/tampilan</code> dan langsung ter-update di layar semua pengguna secara instan tanpa refresh manual!
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Logo Sekolah / Aplikasi URL
          </label>
          <input
            type="url"
            placeholder="https://images.unsplash.com/..."
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
          {logoUrl && (
            <div className="mt-2 flex items-center space-x-3 p-2 rounded-lg bg-slate-900/60 border border-slate-800">
              <img src={logoUrl} alt="Preview Logo" className="w-10 h-10 object-contain rounded-md" />
              <span className="text-[10px] text-slate-400">Preview Logo Terpasang</span>
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Background Splash Screen URL
          </label>
          <input
            type="url"
            placeholder="https://images.unsplash.com/..."
            value={splashBackgroundUrl}
            onChange={(e) => setSplashBackgroundUrl(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-slate-300">
              Video Splash Screen URL (Aspek Rasio 16:9 - .mp4)
            </label>
            <button
              type="button"
              onClick={() =>
                setSplashVideoUrl(
                  'https://assets.mixkit.co/videos/preview/mixkit-abstract-laser-lights-background-41562-large.mp4'
                )
              }
              className="text-[10px] text-indigo-400 hover:text-indigo-300 underline font-medium cursor-pointer"
            >
              + Gunakan Video Sampel 16:9
            </button>
          </div>
          <input
            type="url"
            placeholder="https://domain.com/video-splash.mp4"
            value={splashVideoUrl}
            onChange={(e) => setSplashVideoUrl(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none font-numeric"
          />
          {splashVideoUrl && (
            <div className="mt-3 p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Live Preview Video Splash (16:9):</span>
                <button
                  type="button"
                  onClick={() => setSplashVideoUrl('')}
                  className="text-rose-400 hover:text-rose-300 text-[10px]"
                >
                  Hapus Video
                </button>
              </div>
              <div className="w-full max-w-sm aspect-video rounded-xl bg-slate-900 border border-indigo-500/30 overflow-hidden shadow-lg mx-auto">
                <video
                  src={splashVideoUrl}
                  controls
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-slate-300">
              Durasi Delay Loading Screen Splash (Detik)
            </label>
            <span className="text-[11px] font-bold text-indigo-400 font-numeric">
              {splashDuration} Detik
            </span>
          </div>
          <select
            value={splashDuration}
            onChange={(e) => setSplashDuration(Number(e.target.value))}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none font-numeric"
          >
            <option value={2}>2 Detik (Sangat Cepat)</option>
            <option value={3}>3 Detik (Default)</option>
            <option value={4}>4 Detik (Sangat Pas untuk Video Intro)</option>
            <option value={5}>5 Detik (Cukup Lama)</option>
            <option value={7}>7 Detik (Cinema Splash Preview)</option>
            <option value={10}>10 Detik (Extended Video Intro)</option>
          </select>
          <p className="text-[10px] text-slate-400 mt-1">
            Makin lama durasinya, semakin panjang kesempatan pengguna menikmati video intro splash 16:9 saat aplikasi dibuka.
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Banner Dashboard Utama URL
          </label>
          <input
            type="url"
            placeholder="https://images.unsplash.com/..."
            value={bannerUrl}
            onChange={(e) => setBannerUrl(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Tagline / Slogan Aplikasi
          </label>
          <input
            type="text"
            placeholder="Kelola Uang Kas Sekolah Cerdas, Transparan & Realtime"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="pt-4 border-t border-slate-800 flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50"
        >
          {saving ? 'Menyimpan & Broadcast Realtime...' : 'Simpan & Publikasikan Realtime'}
        </button>
      </div>
    </form>
  );
};
