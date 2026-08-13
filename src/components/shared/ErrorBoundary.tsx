// @ts-nocheck — React 19 class component type issue (state/props/setState not recognized by tsc)
import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * ErrorBoundary — catches rendering errors (e.g. TypeError from undefined data)
 * anywhere in the children tree and displays a friendly fallback UI with an
 * option to reset the view so the admin panel can recover gracefully.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo } as Partial<ErrorBoundaryState>);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null } as Partial<ErrorBoundaryState>);
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleHardReload = () => {
    window.location.reload();
  };

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const { error, errorInfo } = this.state;
    const errorMessage = error?.message || 'Terjadi kesalahan yang tidak diketahui.';
    const stack = error?.stack || errorInfo?.componentStack || '';

    return (
      <div className="min-h-screen w-full bg-slate-950 text-white flex flex-col justify-center items-center p-4 relative overflow-hidden">
        {/* Ambient glows */}
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-rose-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-amber-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-lg relative z-10">
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl space-y-5">
            {/* Icon */}
            <div className="flex items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center">
                <AlertTriangle size={32} className="text-rose-400" />
              </div>
            </div>

            {/* Title */}
            <div className="text-center space-y-1">
              <h1 className="text-xl font-extrabold font-heading">
                Oops! Terjadi Kesalahan Render
              </h1>
              <p className="text-xs text-slate-400">
                Aplikasi menangkap error dan telah dihentikan agar tidak crash total.
                Anda bisa mencoba memuat ulang tampilan atau kembali ke beranda.
              </p>
            </div>

            {/* Error details */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-rose-400 uppercase tracking-wider">
                <Bug size={12} />
                <span>Detail Error</span>
              </div>
              <p className="text-xs text-slate-300 font-mono break-words">{errorMessage}</p>
              {stack && (
                <details className="mt-2">
                  <summary className="text-[10px] text-slate-500 cursor-pointer hover:text-slate-300">
                    Tampilkan stack trace
                  </summary>
                  <pre className="mt-2 text-[10px] text-slate-500 font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">
                    {stack}
                  </pre>
                </details>
              )}
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={this.handleReset}
                className="py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all"
              >
                <RefreshCw size={14} />
                <span>Reset Tampilan</span>
              </button>
              <button
                onClick={this.handleHardReload}
                className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition-all border border-slate-700"
              >
                <Home size={14} />
                <span>Muat Ulang Halaman</span>
              </button>
            </div>

            {/* Hint */}
            <p className="text-center text-[10px] text-slate-500">
              Jika error berulang, kemungkinan terjadi karena data dari Firestore masih
              dimuat atau aturan keamanan belum sepenuhnya ter-deploy.
            </p>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
