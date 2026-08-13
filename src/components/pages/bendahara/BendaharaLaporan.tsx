import React, { useMemo, useState } from 'react';
import { Pembayaran } from '../../../types';
import { exportToExcel } from '../../../lib/utils/exportExcel';
import { exportToPDF } from '../../../lib/utils/exportPDF';
import { PembayaranTable } from '../../tables/PembayaranTable';
import { ShimmerSkeleton } from '../../shared/ShimmerSkeleton';
import { usePembayaranKelas } from '../../../hooks/useSafeCollection';
import { safeUpper } from '../../../lib/utils/safeString';
import { FileSpreadsheet, Printer } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';

export const BendaharaLaporan: React.FC = () => {
  const { user } = useAuth();
  const sekolahId = user?.sekolahId || '';
  const kelasId = user?.kelasId || '';
  const jurusanId = user?.jurusanId || '';

  // Safe hook — fetches ALL payments for the bendahara's class via collectionGroup
    // Previously this was hardcoded to a single student's subcollection (siswa/s01/pembayaran),
  // which only showed one student's payments. Now it correctly shows every payment
  // made by every student in the XI TJKT 1 class.
  const { data: rawPembayaranList, loading } = usePembayaranKelas<Pembayaran>(sekolahId, jurusanId, kelasId);

  // Sort newest-first (consistent with the rest of the bendahara pages).
  const pembayaranList = useMemo(() => {
    return [...rawPembayaranList].sort(
      (a, b) =>
        new Date(b.createdAt || b.tanggalBayar).getTime() -
        new Date(a.createdAt || a.tanggalBayar).getTime()
    );
  }, [rawPembayaranList]);

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
    exportToExcel(formatted, `Laporan_Kas_Bendahara_${kelasId || 'kelas'}`);
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
      title: 'LAPORAN REKAPITULASI UANG KAS KELAS',
      subtitle: `Bendahara - ${kelasId?.toUpperCase() || ''} ${user?.sekolahNama || 'SmartKas School'}`,
      headers,
      rows,
      filename: `Laporan_Kas_Bendahara_${kelasId || 'kelas'}`,
    });
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white font-heading">
            Laporan & Rekapitulasi Kas Kelas
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Ekspor rekapitulasi setoran kas kelas ke Excel & PDF
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
            className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 text-xs font-bold flex items-center space-x-2 shadow-lg shadow-amber-500/20"
          >
            <Printer size={16} />
            <span>Cetak PDF</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          <ShimmerSkeleton className="h-10 w-full" />
          {Array.from({ length: 6 }).map((_, i) => (
            <ShimmerSkeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <PembayaranTable pembayaranList={pembayaranList} />
      )}
    </div>
  );
};
