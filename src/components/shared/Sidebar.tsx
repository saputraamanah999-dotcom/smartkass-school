import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../contexts/AuthContext';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase/config';
import {
  JurusanIcon,
  KelasIcon,
  GuruIcon,
  BendaharaIcon,
  SiswaIcon,
  CoinIcon,
  WalletIcon,
  TargetIcon,
  ExportIcon,
} from '../icons/CustomIcons';
import { SchoolLogo } from '../icons/SchoolLogo';
import { HelpGuide } from './HelpGuide';
import {
  LayoutDashboard,
  Palette,
  Users,
  Database,
  FileSpreadsheet,
  ChevronRight,
  LogOut,
  BookOpen,
} from 'lucide-react';

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPath,
  onNavigate,
  isOpenMobile,
  onCloseMobile,
}) => {
  const { user, logout } = useAuth();
  const [sekolahNama, setSekolahNama] = useState<string>('');
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    if (!user?.sekolahId) return;
    const unsub = onSnapshot(
      doc(db, 'sekolah', user.sekolahId),
      (snap) => {
        if (snap.exists()) {
          setSekolahNama(snap.data().nama || '');
        }
      },
      (err) => console.warn('Sidebar: sekolah listener error', err)
    );
    return () => unsub();
  }, [user?.sekolahId]);

  if (!user) return null;

  const role = user.role;

  const adminMenu = [
    { label: 'Dashboard Admin', path: '/admin', icon: LayoutDashboard },
    { label: 'Sekolah', path: '/admin/sekolah', icon: SchoolLogo },
    { label: 'Jurusan', path: '/admin/jurusan', icon: JurusanIcon },
    { label: 'Kelas', path: '/admin/kelas', icon: KelasIcon },
    // Guru Wali & Bendahara dihapus — sudah ada di menu Kelas
    { label: 'Data Siswa', path: '/admin/siswa', icon: SiswaIcon },
    { label: 'Pengaturan Tampilan', path: '/admin/pengaturan/tampilan', icon: Palette },
    { label: 'Kelola Akun & Role', path: '/admin/pengaturan/akun', icon: Users },
    { label: 'Backup & Restore', path: '/admin/pengaturan/backup', icon: Database },
    { label: 'Laporan Lintas Kelas', path: '/admin/laporan', icon: FileSpreadsheet },
  ];

  const guruMenu = [
    { label: 'Dashboard Guru', path: '/guru', icon: LayoutDashboard },
    { label: 'Kelas Saya', path: '/guru/kelas-saya', icon: KelasIcon },
    { label: 'Catat Pengeluaran', path: '/guru/pengeluaran', icon: WalletIcon },
    { label: 'Approve Pembayaran', path: '/guru/approve-pembayaran', icon: CoinIcon },
    { label: 'Laporan Kas Kelas', path: '/guru/laporan', icon: FileSpreadsheet },
  ];

  const bendaharaMenu = [
    { label: 'Dashboard Kas', path: '/bendahara', icon: LayoutDashboard },
    { label: 'Daftar Siswa Kelas', path: '/bendahara/siswa', icon: SiswaIcon },
    { label: 'Catat Pembayaran', path: '/bendahara/pembayaran', icon: CoinIcon },
    { label: 'Belanja & Diskon Kas', path: '/bendahara/pengeluaran', icon: WalletIcon },
    { label: 'Target / Tujuan Kas', path: '/bendahara/target', icon: TargetIcon },
    { label: 'Laporan Kas Kelas', path: '/bendahara/laporan', icon: ExportIcon },
  ];

  let menu = adminMenu;
  if (role === 'guru') menu = guruMenu;
  if (role === 'bendahara') menu = bendaharaMenu;

  const getRoleBadge = (r: string) => {
    if (r === 'admin') return { label: 'ADMINISTRATOR', bg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' };
    if (r === 'guru') return { label: 'GURU WALI KELAS', bg: 'bg-purple-500/20 text-purple-300 border-purple-500/30' };
    return { label: 'BENDAHARA KELAS', bg: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
  };

  const badge = getRoleBadge(role);

  return (
    <>
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isOpenMobile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden"
            onClick={onCloseMobile}
          />
        )}
      </AnimatePresence>

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-white/95 dark:bg-slate-900/95 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header Branding with SVG Logo */}
        <div className="p-5 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center space-x-3">
          <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 p-0.5 shrink-0">
            <SchoolLogo size={40} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight font-heading">SmartKas <span className="text-indigo-600 dark:text-indigo-400">School</span></h2>
            <p className="text-[9px] text-slate-500 dark:text-slate-400 font-medium truncate max-w-[170px]">{sekolahNama || 'SmartKas School'}</p>
          </div>
        </div>

        {/* User Card Info */}
        <div className="mx-4 mt-4 p-3 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-indigo-600/20 border border-indigo-400/40 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold text-sm">
              {user.nama.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{user.nama}</p>
              <span className={`inline-block px-2 py-0.5 mt-1 text-[9px] font-extrabold rounded-full border ${badge.bg}`}>
                {badge.label}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 mb-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            MENU UTAMA
          </div>
          {menu.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path;
            return (
              <button
                key={item.path}
                onClick={() => {
                  onNavigate(item.path);
                  onCloseMobile();
                }}
                className={`relative w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors group cursor-pointer ${
                  isActive
                    ? 'text-white font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNavIndicator"
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/20"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <div className="relative z-10 flex items-center space-x-3">
                  <Icon size={18} className={isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'} />
                  <span className="truncate">{item.label}</span>
                </div>
                {isActive && <ChevronRight size={14} className="relative z-10 text-white/80" />}
              </button>
            );
          })}
        </nav>

        {/* Help & Logout — pinned at bottom */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
          <button
            onClick={() => setShowHelp(true)}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 dark:hover:bg-indigo-500/10 transition-colors cursor-pointer border border-transparent hover:border-indigo-500/20"
          >
            <BookOpen size={18} />
            <span>Panduan Penggunaan</span>
          </button>
          <button
            onClick={() => {
              onCloseMobile();
              logout();
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-500 dark:text-rose-400 hover:bg-rose-500/10 dark:hover:bg-rose-500/10 transition-colors cursor-pointer border border-transparent hover:border-rose-500/20"
          >
            <LogOut size={18} />
            <span>Keluar Sesi</span>
          </button>
        </div>

        <HelpGuide
          isOpen={showHelp}
          onClose={() => setShowHelp(false)}
          role={role as 'bendahara' | 'guru' | 'admin'}
        />
      </aside>
    </>
  );
};
