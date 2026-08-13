import React from 'react';
import { Pembayaran } from '../../../types';
import { useAuth } from '../../../contexts/AuthContext';
import { exportToExcel } from '../../../lib/utils/exportExcel';
import { exportToPDF } from '../../../lib/utils/exportPDF';
import { PembayaranTable } from '../../tables/PembayaranTable';
import { FileSpreadsheet, Printer } from 'lucide-react';
import { usePembayaranKelas } from '../../../hooks/useSafeCollection';
import { safeStr, safeUpper } from '../../../lib/utils/safeString';

export const GuruLaporan: React.FC = () => {
  const { user } = useAuth();
  const jurusanId = user?.jurusanId || '';
  const kelasId = user?.kelasId || '';
  const sekolahId = user?.sekolahId || '';

  // === Safe Firestore hook (falls back to local data on permission-denied) ===
  const { data: pembayaranRaw } = usePembayaranKelas<Pembayaran>(sekolahId, jurusanId, kelasId);

  const pembayaranList = pembayaranRaw;

  const handleExportExcel = () => {
    const formatted = pembayaranList.map((p, idx) => ({
      No: idx + 1,
      Tanggal: p.tanggalBayar || p.createdAt,
      Siswa: p.siswaNama,
      Absen: p.siswaNoAbsen,
      MingguKe: p.mingguKe,
      Nominal: p.nominal,
      Status: p.status,
    }));
    exportToExcel(formatted, `Laporan_Kas_${kelasId.toUpperCase()}`);
  };

  const handleExportPDF = () => {
    const headers = ['No', 'Tanggal', 'Siswa', 'Minggu', 'Nominal (Rp)', 'Status'];
    const rows = pembayaranList.map((p, idx) => [
      idx + 1,
      p.tanggalBayar?.slice(0, 10) || '',
      p.siswaNama,
      p.mingguKe,
      p.nominal.toLocaleString('id-ID'),
      safeUpper(p.status),
    ]);

    exportToPDF({
      title: `LAPORAN KAS KELAS ${kelasId.toUpperCase()}`,
      subtitle: `Wali Kelas: ${user?.nama || 'Guru'} - ${user?.sekolahNama || 'SmartKas School'}`,
      headers,
      rows,
      filename: `Laporan_Kas_${kelasId.toUpperCase()}`,
    });
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white font-heading">
            Cetak & Export Laporan Kas Kelas ({kelasId.toUpperCase()})
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Laporan resmi kas kelas {kelasId.toUpperCase()} untuk transparansi wali murid & sekolah
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportExcel}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center space-x-2 shadow-lg shadow-emerald-500/20"
          >
            <FileSpreadsheet size={16} />
            <span>Export Excel</span>
          </button>
          <button
            onClick={handleExportPDF}
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center space-x-2 shadow-lg shadow-purple-500/20"
          >
            <Printer size={16} />
            <span>Cetak PDF</span>
          </button>
        </div>
      </div>

      <PembayaranTable pembayaranList={pembayaranList} />
    </div>
  );
};
