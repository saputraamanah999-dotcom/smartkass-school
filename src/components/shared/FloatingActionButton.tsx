import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../contexts/AuthContext';
import {
  Plus,
  X,
  CreditCard,
  Receipt,
  UserPlus,
  ShieldCheck,
  FileSpreadsheet,
  School,
} from 'lucide-react';
import { collection, onSnapshot, doc, setDoc, runTransaction } from 'firebase/firestore';
import { db } from '../../lib/firebase/config';
import { Siswa, Kelas } from '../../types';
import { PembayaranForm } from '../forms/PembayaranForm';

interface FloatingActionButtonProps {
  onNavigate?: (path: string) => void;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const sekolahId = user?.sekolahId || '';
  const jurusanId = user?.jurusanId || '';
  const kelasId = user?.kelasId || '';
  const [isOpen, setIsOpen] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [kelas, setKelas] = useState<Kelas | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load siswa list and class data for quick modal usage
  useEffect(() => {
    if (!sekolahId || !jurusanId || !kelasId) return;
    const unsubK = onSnapshot(
      doc(db, `sekolah/${sekolahId}/jurusan/${jurusanId}/kelas/${kelasId}`),
      (snap) => {
        if (snap.exists()) setKelas({ id: snap.id, ...snap.data() } as Kelas);
      }
    );

    const unsubS = onSnapshot(
      collection(db, `sekolah/${sekolahId}/jurusan/${jurusanId}/kelas/${kelasId}/siswa`),
      (snap) => {
        setSiswaList(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Siswa)));
      }
    );

    return () => {
      unsubK();
      unsubS();
    };
  }, [sekolahId, jurusanId, kelasId]);

  const handleQuickAction = (pathOrAction: string) => {
    setIsOpen(false);
    if (pathOrAction === 'MODAL_PAYMENT') {
      setShowPayModal(true);
    } else if (onNavigate) {
      onNavigate(pathOrAction);
    }
  };

  const handleSavePayment = async (data: any) => {
    setIsSubmitting(true);
    try {
      const id = `p-${Date.now()}`;
      const newPay = {
        id,
        sekolahId,
        jurusanId,
        kelasId,
        siswaId: data.siswaId,
        siswaNama: data.siswaNama,
        siswaNoAbsen: data.siswaNoAbsen,
        nominal: data.nominal,
        tanggalBayar: new Date().toISOString(),
        mingguKe: data.mingguKe,
        tahunAjaran: '2026/2027',
        status: data.status,
        approvedByGuru: false, // Default pending approval from Guru
        dicatatOlehUid: user?.uid || 'bendahara-01',
        dicatatOlehNama: user?.nama || 'Bendahara',
        keterangan: data.keterangan || '',
        createdAt: new Date().toISOString(),
      };

      // 1. Save payment record
      await setDoc(
        doc(db, `sekolah/${sekolahId}/jurusan/${jurusanId}/kelas/${kelasId}/siswa/${data.siswaId}/pembayaran`, id),
        newPay
      );

      // 2. Update saldo via transaction (mencegah race condition)
      try {
        const kelasRef = doc(db, `sekolah/${sekolahId}/jurusan/${jurusanId}/kelas/${kelasId}`);
        await runTransaction(db, async (tx) => {
          const snap = await tx.get(kelasRef);
          const cur = snap.exists() ? (snap.data().saldoSaatIni || 0) : 0;
          tx.update(kelasRef, { saldoSaatIni: cur + data.nominal });
        });
      } catch (txErr) {
        console.warn('FAB transaction saldoSaatIni failed (non-critical):', txErr);
      }

      setShowPayModal(false);
    } catch (err) {
      console.error('Error saving payment from FAB:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Define role-aware quick actions
  const actionsByRole = {
    bendahara: [
      {
        id: 'pay',
        label: 'Input Setoran Kas',
        icon: CreditCard,
        action: 'MODAL_PAYMENT',
        color: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30',
      },
      {
        id: 'expense',
        label: 'Catat Pengeluaran',
        icon: Receipt,
        action: '/guru/pengeluaran',
        color: 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30',
      },
      {
        id: 'siswa',
        label: 'Tambah Siswa Baru',
        icon: UserPlus,
        action: '/bendahara/siswa',
        color: 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30',
      },
    ],
    guru: [
      {
        id: 'approve',
        label: 'Verifikasi & Approve Kas',
        icon: ShieldCheck,
        action: '/guru/approve-pembayaran',
        color: 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30',
      },
      {
        id: 'expense',
        label: 'Catat Pengeluaran Kelas',
        icon: Receipt,
        action: '/guru/pengeluaran',
        color: 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30',
      },
      {
        id: 'report',
        label: 'Lihat Laporan Kas',
        icon: FileSpreadsheet,
        action: '/guru/laporan',
        color: 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/30',
      },
    ],
    admin: [
      {
        id: 'kelas',
        label: 'Kelola Kelas & Guru',
        icon: UserPlus,
        action: '/admin/kelas',
        color: 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30',
      },
      {
        id: 'sekolah',
        label: 'Kelola Data Sekolah',
        icon: School,
        action: '/admin/sekolah',
        color: 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/30',
      },
      {
        id: 'pay',
        label: 'Setoran Kas Fast-Entry',
        icon: CreditCard,
        action: 'MODAL_PAYMENT',
        color: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30',
      },
    ],
  };

  const currentRole = (user?.role || 'bendahara') as 'bendahara' | 'guru' | 'admin';
  const actionList = actionsByRole[currentRole] || actionsByRole.bendahara;

  return (
    <>
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 flex flex-col items-end space-y-3 pointer-events-auto" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)', paddingRight: 'env(safe-area-inset-right, 0px)' }}>
        {/* Expanded Quick Action Items */}
        <AnimatePresence>
          {isOpen && (
            <div className="flex flex-col items-end space-y-2.5 mb-1">
              {actionList.map((item, idx) => {
                const IconComp = item.icon;
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 15, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.8 }}
                    transition={{
                      type: 'spring',
                      stiffness: 400,
                      damping: 25,
                      delay: (actionList.length - 1 - idx) * 0.05,
                    }}
                    className="flex items-center space-x-2 group cursor-pointer"
                    onClick={() => handleQuickAction(item.action)}
                  >
                    {/* Tooltip Label */}
                    <span className="px-3 py-1.5 rounded-xl bg-slate-900/90 dark:bg-slate-900 text-white text-xs font-bold shadow-xl border border-slate-700 backdrop-blur-md select-none whitespace-nowrap">
                      {item.label}
                    </span>

                    {/* Action Circle Button */}
                    <button
                      type="button"
                      className={`p-3 rounded-2xl shadow-lg flex items-center justify-center transition-all transform group-hover:scale-110 active:scale-95 ${item.color}`}
                    >
                      <IconComp size={18} />
                    </button>
                  </motion.div>
                );
              })}
            </div>
          )}
        </AnimatePresence>

        {/* Primary Main Trigger Button */}
        <motion.button
          type="button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          className={`p-3.5 sm:p-4 rounded-2xl shadow-2xl flex items-center justify-center transition-all duration-300 cursor-pointer ${
            isOpen
              ? 'bg-slate-800 text-white shadow-slate-900/50 rotate-90'
              : 'bg-gradient-to-tr from-indigo-600 via-purple-600 to-amber-500 text-white shadow-indigo-600/40'
          }`}
          aria-label="Aksi Cepat"
        >
          {isOpen ? <X size={24} /> : <Plus size={24} />}
        </motion.button>
      </div>

      {/* Quick Payment Input Modal from FAB */}
      <AnimatePresence>
        {showPayModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-heading">
                  Input Setoran Kas Cepat (FAB)
                </h3>
                <button
                  onClick={() => setShowPayModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <PembayaranForm
                siswaList={siswaList}
                nominalKasMingguan={kelas?.nominalKasMingguan || 5000}
                onSubmit={handleSavePayment}
                onCancel={() => setShowPayModal(false)}
                isSubmitting={isSubmitting}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FloatingActionButton;
