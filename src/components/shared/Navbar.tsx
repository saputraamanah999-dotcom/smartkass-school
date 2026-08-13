import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase/config';
import { Menu } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { GlobalSearchBar } from './GlobalSearchBar';
import { NotificationBell } from './NotificationBell';
import { ProfileDropdown } from './ProfileDropdown';

interface NavbarProps {
  title: string;
  onOpenMobileSidebar: () => void;
  onNavigate?: (path: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ title, onOpenMobileSidebar, onNavigate }) => {
  const { activeSekolahId } = useAuth();
  const [sekolahNama, setSekolahNama] = useState<string>('');

  useEffect(() => {
    if (!activeSekolahId) return;
    const unsub = onSnapshot(
      doc(db, 'sekolah', activeSekolahId),
      (snap) => {
        if (snap.exists()) {
          setSekolahNama(snap.data().nama || '');
        }
      },
      (err) => console.warn('Navbar: sekolah listener error', err)
    );
    return () => unsub();
  }, [activeSekolahId]);

  const navbarSubtitle = sekolahNama ? `${sekolahNama} • Sistem Kas Realtime` : 'Sistem Kas Realtime';

  return (
    <header className="sticky top-0 z-30 h-14 sm:h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-3 sm:px-6 flex items-center justify-between transition-colors duration-300">
      {/* Left side: Hamburger + Page Title */}
      <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
        <button
          onClick={onOpenMobileSidebar}
          className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden focus:outline-none transition-colors"
        >
          <Menu size={22} />
        </button>

        <div className="min-w-0">
          <h1 className="text-xs sm:text-base font-bold text-slate-900 dark:text-white tracking-tight font-heading truncate">
            {title}
          </h1>
          <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 hidden xl:block truncate">
            {navbarSubtitle}
          </p>
        </div>
      </div>

      {/* Center: Global Search Bar — hidden on very small screens */}
      <div className="hidden md:flex flex-1 max-w-sm lg:max-w-md mx-2 lg:mx-4">
        <GlobalSearchBar onNavigate={onNavigate} />
      </div>

      {/* Right side: Notification, Theme, Profile */}
      <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-3 flex-shrink-0">
        {/* Realtime Status Pill */}
        <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Realtime</span>
        </div>

        {/* Notification Bell */}
        <NotificationBell />

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* User Profile Dropdown */}
        <ProfileDropdown />
      </div>
    </header>
  );
};
