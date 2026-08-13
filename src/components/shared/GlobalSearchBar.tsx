import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, collectionGroup, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import { Siswa, Pembayaran } from '../../types';
import { formatRupiah } from '../../lib/utils/formatCurrency';
import { safeStr, safeLower } from '../../lib/utils/safeString';
import { Search, X, User, School, ArrowRight, ShieldCheck, Clock } from 'lucide-react';

interface GlobalSearchBarProps {
  onNavigate?: (path: string) => void;
}

interface SearchResultItem {
  id: string;
  type: 'siswa' | 'kelas' | 'pembayaran';
  title: string;
  subtitle: string;
  badge?: string;
  path: string;
}

export const GlobalSearchBar: React.FC<GlobalSearchBarProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const sekolahId = user?.sekolahId || '';
  const jurusanId = user?.jurusanId || '';
  const kelasId = user?.kelasId || '';

  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [pembayaranList, setPembayaranList] = useState<Pembayaran[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut (Ctrl+K or /)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  // Realtime Listeners for Search Index — only mount after auth is established
  // so we don't spam the console with permission-denied warnings before login.
  useEffect(() => {
    if (!user || !sekolahId || !jurusanId || !kelasId) return;

    const unsubS = onSnapshot(
      collection(db, `sekolah/${sekolahId}/jurusan/${jurusanId}/kelas/${kelasId}/siswa`),
      (snap) => {
        setSiswaList(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Siswa)));
      },
      (err) => {
        // Silently swallow — the connection-status banner will surface the issue.
        // console.warn is intentionally omitted to keep the console clean.
      }
    );

    const unsubP = onSnapshot(
      collectionGroup(db, 'pembayaran'),
      (snap) => {
        setPembayaranList(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Pembayaran)));
      },
      (err) => {
        // Silently swallow.
      }
    );

    return () => {
      unsubS();
      unsubP();
    };
  }, [user, sekolahId, jurusanId, kelasId]);

  // Filter Search Results
  const results: SearchResultItem[] = [];
  const q = query.trim().toLowerCase();

  if (q.length > 0) {
    // 1. Static/Known Classes — replaced with current user's class context
    const userClassLabel = kelasId.toUpperCase();
    const defaultClasses = [
      { id: kelasId, name: userClassLabel, sekolah: sekolahId, path: '/bendahara/siswa' },
    ];
    defaultClasses.forEach((c) => {
      if (c.name.toLowerCase().includes(q) || c.sekolah.toLowerCase().includes(q)) {
        results.push({
          id: `k-${c.id}`,
          type: 'kelas',
          title: c.name,
          subtitle: `${c.sekolah} • Kelas Aktif`,
          badge: 'Kelas',
          path: c.path,
        });
      }
    });

    // 2. Siswa Search (defensive against null/undefined fields)
    siswaList.forEach((s) => {
      if (
        safeLower(s.nama).includes(q) ||
        (s.nisn && safeLower(s.nisn).includes(q)) ||
        safeStr(s.noAbsen) === q
      ) {
        results.push({
          id: `s-${s.id}`,
          type: 'siswa',
          title: `#${s.noAbsen} ${safeStr(s.nama)}`,
          subtitle: `NISN: ${s.nisn || '-'} • ${kelasId.toUpperCase()}`,
          badge: 'Siswa',
          path: '/bendahara/siswa',
        });
      }
    });

    // 3. Pembayaran Search (defensive against null/undefined fields)
    pembayaranList.forEach((p) => {
      if (
        safeLower(p.siswaNama).includes(q) ||
        safeLower(p.id).includes(q) ||
        `minggu ${p.mingguKe}`.includes(q) ||
        safeStr(p.nominal).includes(q)
      ) {
        results.push({
          id: `p-${p.id}`,
          type: 'pembayaran',
          title: `Setoran: ${p.siswaNama} (Minggu ${p.mingguKe})`,
          subtitle: `${formatRupiah(p.nominal)} • ${p.approvedByGuru ? 'Terverifikasi Guru' : 'Menunggu Approval'}`,
          badge: p.approvedByGuru ? 'Kas Approved' : 'Pending Kas',
          path: p.approvedByGuru ? '/bendahara/pembayaran' : '/guru/approve-pembayaran',
        });
      }
    });
  }

  const handleSelectResult = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    }
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Input Field */}
      <div className="relative flex items-center">
        <Search
          size={16}
          className="absolute left-3 text-slate-400 dark:text-slate-500 pointer-events-none"
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Cari Siswa, Kelas, atau Transaksi... (Ctrl+K)"
          className="w-full pl-9 pr-8 py-1.5 sm:py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-inner"
        />
        {query ? (
          <button
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            className="absolute right-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded-md"
          >
            <X size={14} />
          </button>
        ) : (
          <kbd className="hidden lg:inline-block absolute right-2.5 px-1.5 py-0.5 text-[9px] font-bold text-slate-400 bg-slate-200 dark:bg-slate-700/60 rounded border border-slate-300 dark:border-slate-600">
            ⌘K
          </kbd>
        )}
      </div>

      {/* Popover Dropdown Results */}
      <AnimatePresence>
        {isOpen && query.trim().length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-full mt-2 z-50 max-h-96 overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-2 space-y-1"
          >
            {results.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                Tidak ada siswa, kelas, atau transaksi yang cocok dengan &quot;{query}&quot;
              </div>
            ) : (
              results.slice(0, 8).map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelectResult(item.path)}
                  className="w-full text-left flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors group cursor-pointer"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div
                      className={`p-2 rounded-xl flex-shrink-0 ${
                        item.type === 'siswa'
                          ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                          : item.type === 'kelas'
                          ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                          : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {item.type === 'siswa' && <User size={16} />}
                      {item.type === 'kelas' && <School size={16} />}
                      {item.type === 'pembayaran' && <ShieldCheck size={16} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {item.title}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${
                        item.type === 'siswa'
                          ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-600 dark:text-indigo-400'
                          : item.type === 'kelas'
                          ? 'bg-purple-500/10 border-purple-500/30 text-purple-600 dark:text-purple-400'
                          : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {item.badge}
                    </span>
                    <ArrowRight
                      size={14}
                      className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                  </div>
                </button>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GlobalSearchBar;
