import React, { useEffect, useRef, useState } from 'react';
import { Bell, CheckCircle2, Clock, AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSafeCollectionGroup } from '../../hooks/useSafeCollection';
import { Pembayaran } from '../../types';
import { formatRupiah } from '../../lib/utils/formatCurrency';
import { safeStr } from '../../lib/utils/safeString';

interface NotificationItem {
  id: string;
  type: 'payment' | 'pending' | 'overdue';
  title: string;
  subtitle: string;
  timestamp: string;
  icon: 'check' | 'clock' | 'alert';
  color: string;
}

/**
 * NotificationBell — a bell icon with a dropdown that shows recent payment
 * activity (latest payments, pending approvals, and overdue reminders).
 *
 * Uses the safe collection hooks so it works in both live and offline modes.
 */
export const NotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { data: pembayaranList } = useSafeCollectionGroup<Pembayaran>(
    'pembayaran',
    undefined);

  // Build notification list from recent payments
  const notifications: NotificationItem[] = React.useMemo(() => {
    const sorted = [...pembayaranList].sort(
      (a, b) => new Date(b.createdAt || b.tanggalBayar).getTime() - new Date(a.createdAt || a.tanggalBayar).getTime()
    );

    const items: NotificationItem[] = [];

    // Latest 5 payments
    sorted.slice(0, 5).forEach((p) => {
      const isPending = !p.approvedByGuru;
      const isMenunggak = safeStr(p.status) === 'menunggak';
      items.push({
        id: p.id,
        type: isMenunggak ? 'overdue' : isPending ? 'pending' : 'payment',
        title: `${p.siswaNama} - Minggu ${p.mingguKe}`,
        subtitle: `${formatRupiah(p.nominal)} • ${isMenunggak ? 'Menunggak' : isPending ? 'Menunggu Approval' : 'Lunas'}`,
        timestamp: p.tanggalBayar || p.createdAt,
        icon: isMenunggak ? 'alert' : isPending ? 'clock' : 'check',
        color: isMenunggak ? 'rose' : isPending ? 'amber' : 'emerald',
      });
    });

    return items;
  }, [pembayaranList]);

  const unreadCount = notifications.filter((n) => n.type === 'pending' || n.type === 'overdue').length;

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

  const getIcon = (iconType: string) => {
    switch (iconType) {
      case 'check':
        return <CheckCircle2 size={16} className="text-emerald-400" />;
      case 'clock':
        return <Clock size={16} className="text-amber-400" />;
      case 'alert':
        return <AlertTriangle size={16} className="text-rose-400" />;
      default:
        return <CheckCircle2 size={16} className="text-emerald-400" />;
    }
  };

  const formatTimeAgo = (iso: string) => {
    try {
      const date = new Date(iso);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);
      if (diffMins < 1) return 'Baru saja';
      if (diffMins < 60) return `${diffMins} menit lalu`;
      if (diffHours < 24) return `${diffHours} jam lalu`;
      if (diffDays < 7) return `${diffDays} hari lalu`;
      return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
    } catch {
      return '';
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        title="Notifikasi Aktivitas Kas"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
              <div className="flex items-center gap-2">
                <Bell size={16} className="text-indigo-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Notifikasi Kas</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            {/* Notification List */}
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500">
                  <Bell size={28} className="mx-auto mb-2 opacity-30" />
                  <p>Belum ada notifikasi aktivitas kas.</p>
                </div>
              ) : (
                notifications.map((n, idx) => (
                  <div
                    key={n.id}
                    className={`flex items-start gap-3 p-3 border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer ${
                      idx === 0 ? 'bg-indigo-500/5' : ''
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg bg-${n.color}-500/10 shrink-0 mt-0.5`}>
                      {getIcon(n.icon)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {n.title}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {n.subtitle}
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 font-numeric">
                        {formatTimeAgo(n.timestamp)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
              <p className="text-[10px] text-center text-slate-400 dark:text-slate-500 font-semibold">
                {notifications.length} total aktivitas kas tercatat
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
