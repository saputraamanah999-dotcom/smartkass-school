import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff, Cloud, CloudOff, Loader2, RefreshCw } from 'lucide-react';
import { isOfflineMode } from '../../lib/firebase/localData';

/**
 * ConnectionStatus — small floating badge that shows whether the app is
 * connected to live Firestore data.
 *
 * Reads the global `isOfflineMode()` flag set by `useSafeCollection`.
 * Listens to a custom event for immediate updates without polling.
 * Includes a "Refresh" button to reload the page and retry Firestore.
 */
export const ConnectionStatus: React.FC = () => {
  const [offline, setOffline] = useState(isOfflineMode());
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    setOffline(isOfflineMode());

    const handleChange = () => setOffline(isOfflineMode());
    window.addEventListener('smartkas-connection-change', handleChange);

    const interval = setInterval(() => {
      setOffline(isOfflineMode());
    }, 3000);

    return () => {
      window.removeEventListener('smartkas-connection-change', handleChange);
      clearInterval(interval);
    };
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      window.location.reload();
    }, 300);
  };

  if (offline) {
    return (
      <div className="fixed bottom-4 left-4 z-40 group">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 backdrop-blur-md shadow-lg animate-pulse-glow">
          <div className="relative">
            <CloudOff size={14} className="text-rose-400" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-400 animate-ping" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider leading-none">
              Offline
            </span>
            <span className="text-[9px] text-rose-500/70 leading-none mt-0.5">
              Firestore tidak terhubung
            </span>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="ml-1 p-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 transition-all cursor-pointer disabled:opacity-50"
            title="Refresh & coba ulang koneksi Firestore"
          >
            <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
        </div>
        <div className="absolute bottom-full left-0 mb-2 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-[10px] text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl">
          Firestore tidak dapat diakses. Periksa koneksi internet & Firestore Rules, lalu refresh.
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 z-40">
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 backdrop-blur-md shadow-lg">
        <div className="relative">
          <Cloud size={14} className="text-emerald-400" />
          <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400" />
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider leading-none">
            Live
          </span>
          <span className="text-[9px] text-emerald-500/70 leading-none mt-0.5">
            Firestore realtime
          </span>
        </div>
      </div>
    </div>
  );
};

export default ConnectionStatus;
