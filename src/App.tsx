import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { SplashScreen } from './components/shared/SplashScreen';
import { Sidebar } from './components/shared/Sidebar';
import { Navbar } from './components/shared/Navbar';
import { FloatingActionButton } from './components/shared/FloatingActionButton';
import { LoginPage } from './components/pages/auth/LoginPage';
import { ErrorBoundary } from './components/shared/ErrorBoundary';
import { ConnectionStatus } from './components/shared/ConnectionStatus';


// Admin Pages
import { AdminDashboard } from './components/pages/admin/AdminDashboard';
import { AdminSekolah } from './components/pages/admin/AdminSekolah';
import { AdminJurusan } from './components/pages/admin/AdminJurusan';
import { AdminKelas } from './components/pages/admin/AdminKelas';
// AdminGuru & AdminBendahara dihapus dari menu (sudah ada di Kelas)
import { AdminSiswa } from './components/pages/admin/AdminSiswa';
import { AdminPengaturanTampilan } from './components/pages/admin/AdminPengaturanTampilan';
import { AdminAkunRole } from './components/pages/admin/AdminAkunRole';
import { AdminBackupRestore } from './components/pages/admin/AdminBackupRestore';
import { AdminLaporan } from './components/pages/admin/AdminLaporan';

// Guru Pages
import { GuruDashboard } from './components/pages/guru/GuruDashboard';
import { GuruKelasSaya } from './components/pages/guru/GuruKelasSaya';
import { GuruPengeluaran } from './components/pages/guru/GuruPengeluaran';
import { GuruApprovePembayaran } from './components/pages/guru/GuruApprovePembayaran';
import { GuruLaporan } from './components/pages/guru/GuruLaporan';

// Bendahara Pages
import { BendaharaDashboard } from './components/pages/bendahara/BendaharaDashboard';
import { BendaharaSiswa } from './components/pages/bendahara/BendaharaSiswa';
import { BendaharaPembayaran } from './components/pages/bendahara/BendaharaPembayaran';
import { BendaharaPengeluaran } from './components/pages/bendahara/BendaharaPengeluaran';
import { BendaharaTarget } from './components/pages/bendahara/BendaharaTarget';
import { BendaharaLaporan } from './components/pages/bendahara/BendaharaLaporan';

import { Breadcrumbs, BreadcrumbItem } from './components/shared/Breadcrumbs';

const AppContent: React.FC = () => {
  const { user, activeSekolahId, loading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Set default path based on role once user logs in
  useEffect(() => {
    if (user) {
      if (user.role === 'admin' && !currentPath.startsWith('/admin')) {
        setCurrentPath('/admin');
      } else if (user.role === 'guru' && !currentPath.startsWith('/guru')) {
        setCurrentPath('/guru');
      } else if (user.role === 'bendahara' && !currentPath.startsWith('/bendahara')) {
        setCurrentPath('/bendahara');
      }
    }
  }, [user]);

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  // While the auth session is still initializing, show a lightweight loader
  // instead of attempting to render protected routes prematurely.
  if (loading) {
    return (
      <div className="min-h-screen w-full bg-slate-950 text-white flex flex-col justify-center items-center p-4">
        <div className="w-12 h-12 rounded-full border-2 border-slate-700 border-t-indigo-500 animate-spin mb-4" />
        <p className="text-xs text-slate-400 font-medium">Memverifikasi sesi login...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  // Get current page title for Navbar
  const getPageTitle = (path: string): string => {
    switch (path) {
      case '/admin': return 'Dashboard Utama Admin';
      case '/admin/sekolah': return 'Kelola Sekolah';
      case '/admin/jurusan': return 'Kelola Jurusan';
      case '/admin/kelas': return 'Kelola Kelas';
      case '/admin/guru': return 'Kelola Kelas';
      case '/admin/bendahara': return 'Kelola Kelas';
      case '/admin/siswa': return 'Data Siswa Lintas Kelas';
      case '/admin/pengaturan/tampilan': return 'Pengaturan Tampilan & Assets URL';
      case '/admin/pengaturan/akun': return 'Kelola Akun & Role (RBAC)';
      case '/admin/pengaturan/backup': return 'Backup & Restore Data';
      case '/admin/laporan': return 'Laporan Kas Sekolah';

      case '/guru': return 'Dashboard Guru Wali Kelas';
      case '/guru/kelas-saya': return 'Kelas Saya';
      case '/guru/pengeluaran': return 'Catat Pengeluaran Kas';
      case '/guru/approve-pembayaran': return 'Verifikasi Pembayaran Kas';
      case '/guru/laporan': return 'Laporan Kas Kelas';

      case '/bendahara': return 'Dashboard Kas Kelas';
      case '/bendahara/siswa': return 'Daftar Siswa Kelas';
      case '/bendahara/pembayaran': return 'Catat Setoran Kas';
      case '/bendahara/pengeluaran': return 'Belanja & Diskon Kas';
      case '/bendahara/target': return 'Target & Tujuan Kas';
      case '/bendahara/laporan': return 'Laporan Setoran Kas';
      default: return 'SmartKas School';
    }
  };

  const getBreadcrumbItems = (path: string): BreadcrumbItem[] => {
    const schoolLabel = activeSekolahId
      ? activeSekolahId.toUpperCase().replace(/-/g, ' ')
      : 'Sekolah';

    if (path.startsWith('/admin')) {
      const items: BreadcrumbItem[] = [
        { label: 'Dashboard Admin', onClick: () => setCurrentPath('/admin') },
        { label: schoolLabel, onClick: () => setCurrentPath('/admin/sekolah') },
      ];

      switch (path) {
        case '/admin/sekolah': items.push({ label: 'Kelola Sekolah' }); break;
        case '/admin/jurusan': items.push({ label: 'Kelola Jurusan' }); break;
        case '/admin/kelas': items.push({ label: 'Kelola Kelas' }); break;
        // /admin/guru & /admin/bendahara redirected to Kelas
        case '/admin/siswa': items.push({ label: 'Data Siswa' }); break;
        case '/admin/pengaturan/tampilan': items.push({ label: 'Pengaturan Tampilan' }); break;
        case '/admin/pengaturan/akun': items.push({ label: 'RBAC & User Access' }); break;
        case '/admin/pengaturan/backup': items.push({ label: 'Backup Restore' }); break;
        case '/admin/laporan': items.push({ label: 'Laporan Kas Sekolah' }); break;
        default: break;
      }
      return items;
    }

    if (path.startsWith('/guru')) {
      const classLabel = user?.kelasId ? user.kelasId.toUpperCase() : 'Kelas Saya';
      const items: BreadcrumbItem[] = [
        { label: 'Dashboard Guru', onClick: () => setCurrentPath('/guru') },
        { label: classLabel, onClick: () => setCurrentPath('/guru/kelas-saya') },
      ];

      switch (path) {
        case '/guru/kelas-saya': items.push({ label: 'Kelas Saya & Siswa' }); break;
        case '/guru/pengeluaran': items.push({ label: 'Pengeluaran Kas' }); break;
        case '/guru/approve-pembayaran': items.push({ label: 'Verifikasi Setoran' }); break;
        case '/guru/laporan': items.push({ label: 'Laporan Kas Kelas' }); break;
        default: break;
      }
      return items;
    }

    if (path.startsWith('/bendahara')) {
      const classLabel = user?.kelasId ? user.kelasId.toUpperCase() : 'Kelas Saya';
      const items: BreadcrumbItem[] = [
        { label: 'Dashboard Bendahara', onClick: () => setCurrentPath('/bendahara') },
        { label: classLabel, onClick: () => setCurrentPath('/bendahara/siswa') },
      ];

      switch (path) {
        case '/bendahara/siswa': items.push({ label: 'Daftar Siswa Kelas' }); break;
        case '/bendahara/pembayaran': items.push({ label: 'Catat Setoran Kas' }); break;
        case '/bendahara/pengeluaran': items.push({ label: 'Pengeluaran & Diskon' }); break;
        case '/bendahara/target': items.push({ label: 'Target & Goal Kas' }); break;
        case '/bendahara/laporan': items.push({ label: 'Laporan Setoran' }); break;
        default: break;
      }
      return items;
    }

    return [{ label: 'SmartKas' }];
  };

  const renderPageView = () => {
    // Admin Views
    if (user.role === 'admin') {
      switch (currentPath) {
        case '/admin/sekolah': return <AdminSekolah />;
        case '/admin/jurusan': return <AdminJurusan />;
        case '/admin/kelas': return <AdminKelas />;
        case '/admin/guru': return <AdminKelas />;
        case '/admin/bendahara': return <AdminKelas />;
        case '/admin/siswa': return <AdminSiswa />;
        case '/admin/pengaturan/tampilan': return <AdminPengaturanTampilan />;
        case '/admin/pengaturan/akun': return <AdminAkunRole />;
        case '/admin/pengaturan/backup': return <AdminBackupRestore />;
        case '/admin/laporan': return <AdminLaporan />;
        case '/admin':
        default: return <AdminDashboard onNavigate={setCurrentPath} />;
      }
    }

    // Guru Views
    if (user.role === 'guru') {
      switch (currentPath) {
        case '/guru/kelas-saya': return <GuruKelasSaya />;
        case '/guru/pengeluaran': return <GuruPengeluaran />;
        case '/guru/approve-pembayaran': return <GuruApprovePembayaran />;
        case '/guru/laporan': return <GuruLaporan />;
        case '/guru':
        default: return <GuruDashboard onNavigate={setCurrentPath} />;
      }
    }

    // Bendahara Views
    if (user.role === 'bendahara') {
      switch (currentPath) {
        case '/bendahara/siswa': return <BendaharaSiswa />;
        case '/bendahara/pembayaran': return <BendaharaPembayaran />;
        case '/bendahara/pengeluaran': return <BendaharaPengeluaran />;
        case '/bendahara/target': return <BendaharaTarget />;
        case '/bendahara/laporan': return <BendaharaLaporan />;
        case '/bendahara':
        default: return <BendaharaDashboard onNavigate={setCurrentPath} />;
      }
    }

    return <AdminDashboard onNavigate={setCurrentPath} />;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col lg:flex-row font-sans transition-colors duration-300 overflow-x-hidden">
      <Sidebar
        currentPath={currentPath}
        onNavigate={setCurrentPath}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      <div className="flex-1 lg:pl-72 flex flex-col min-w-0">
        <Navbar
          title={getPageTitle(currentPath)}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onNavigate={setCurrentPath}
        />

        <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-x-hidden">
          <Breadcrumbs items={getBreadcrumbItems(currentPath)} />
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPath}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              {renderPageView()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <FloatingActionButton onNavigate={setCurrentPath} />
      <ConnectionStatus />
    </div>
  );
};


export function App() {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <AuthProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#0f172a',
                color: '#f8fafc',
                border: '1px solid #334155',
                borderRadius: '12px',
                fontSize: '13px',
                fontWeight: 500,
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#0f172a',
                },
              },
              error: {
                iconTheme: {
                  primary: '#f43f5e',
                  secondary: '#0f172a',
                },
              },
            }}
          />
          <AppContent />
        </AuthProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;
