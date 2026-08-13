import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, User, Mail, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { safeStr } from '../../lib/utils/safeString';

/**
 * ProfileDropdown — a user avatar with a dropdown menu showing profile info.
 * Logout button has been moved to the Sidebar (hamburger menu).
 */
export const ProfileDropdown: React.FC = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const roleColors: Record<string, { bg: string; text: string; border: string; label: string }> = {
    admin: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/30', label: 'Administrator' },
    guru: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30', label: 'Guru Wali Kelas' },
    bendahara: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30', label: 'Bendahara Kelas' },
  };

  const rc = roleColors[safeStr(user.role)] || roleColors.admin;

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1.5 pl-1.5 sm:pl-2 border-l border-slate-200 dark:border-slate-800 ml-1 sm:ml-2 py-1 cursor-pointer transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
        title="Profil Pengguna"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-md shadow-indigo-500/20">
          {safeStr(user.nama).charAt(0) || 'U'}
        </div>
        <ChevronDown
          size={14}
          className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-72 max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50"
          >
            {/* Header with gradient */}
            <div className="p-4 bg-gradient-to-br from-indigo-600/10 via-purple-600/5 to-transparent border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-base shadow-md shadow-indigo-500/20 shrink-0">
                  {safeStr(user.nama).charAt(0) || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {safeStr(user.nama) || 'Pengguna'}
                  </p>
                  <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${rc.bg} ${rc.text} border ${rc.border}`}>
                    {rc.label}
                  </span>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Profile details */}
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-2.5 text-xs">
                <Mail size={14} className="text-slate-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Email</p>
                  <p className="text-slate-700 dark:text-slate-200 truncate font-numeric">{safeStr(user.email) || '-'}</p>
                </div>
              </div>

              {(user.kelasId || user.jurusanId) && (
                <div className="flex items-center gap-2.5 text-xs">
                  <User size={14} className="text-slate-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Penugasan</p>
                    <p className="text-slate-700 dark:text-slate-200 truncate">
                      {safeStr(user.kelasId).toUpperCase()} ({safeStr(user.jurusanId).toUpperCase()})
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfileDropdown;
