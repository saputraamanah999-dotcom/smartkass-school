import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useTampilanConfig } from '../../../hooks/useTampilanConfig';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../lib/firebase/config';
import {
  ShieldCheck,
  ArrowRight,
  Lock,
  Mail,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
   const { loginWithEmail } = useAuth();
  const { config } = useTampilanConfig();
  const [sekolahNama, setSekolahNama] = useState<string>('');

  // Load first available sekolah name from Firestore
  useEffect(() => {
    getDocs(collection(db, 'sekolah'))
      .then((snap) => {
        if (!snap.empty) {
          const first = snap.docs[0].data();
          setSekolahNama(first.nama || '');
        }
      })
      .catch(() => {});
  }, []);

  // ---- Shared state ----
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // ============ LOGIN FLOW ============
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    if (!email.trim() || !password) {
      setError('Email dan kata sandi wajib diisi.');
      setIsSubmitting(false);
      return;
    }

    const success = await loginWithEmail(email, password);
    if (!success) {
      setError(
        'Login gagal. Periksa kembali email & kata sandi Anda. Pastikan akun sudah terdaftar di Firebase Authentication.'
      );
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-white flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background ambient glows */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Header Branding with SVG Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <div className="w-20 h-20 rounded-2xl bg-slate-900/80 border border-slate-700/60 p-1.5 shadow-xl shadow-indigo-500/20 backdrop-blur-md overflow-hidden">
              <img
                src="/favicon-192.png"
                alt="Logo SmartKas"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-heading">
            SmartKas <span className="text-indigo-400">School</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">{sekolahNama || 'SmartKas School'}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {config.tagline || 'Manajemen Uang Kas Sekolah Realtime & Transparan'}
          </p>
        </div>

        {/* Login Box */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur-xl">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start gap-2">
              <span className="shrink-0 mt-0.5">⚠</span>
              <span>{error}</span>
            </div>
          )}

          {/* ============ LOGIN FORM ============ */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Alamat Email Login
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 text-slate-500 w-4 h-4" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@smktibali.sch.id"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700/80 text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Kata Sandi
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 text-slate-500 w-4 h-4" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-12 py-2.5 rounded-xl bg-slate-950 border border-slate-700/80 text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2.5 top-2.5 text-[10px] text-slate-400 hover:text-slate-200 px-1.5 py-1 rounded"
                >
                  {showPassword ? 'Sembunyi' : 'Lihat'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
            >
              <span>{isSubmitting ? 'Memproses Login...' : 'Masuk ke Aplikasi'}</span>
              <ArrowRight size={16} />
            </button>
          </form>
        </div>

        {/* Security badge */}
        <div className="mt-6 text-center flex items-center justify-center space-x-1.5 text-slate-500 text-xs">
          <ShieldCheck size={14} className="text-emerald-500" />
          <span>Keamanan Terenkripsi Firebase Auth & Firestore Rules</span>
        </div>
      </div>
    </div>
  );
};
