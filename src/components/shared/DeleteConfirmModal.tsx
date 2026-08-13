import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  title?: string;
  description?: string;
  itemName?: string;
  isDeleting?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  title = 'Konfirmasi Hapus Data',
  description = 'Apakah Anda yakin ingin menghapus data ini? Tindakan ini permanen dan tidak dapat dibatalkan.',
  itemName,
  isDeleting = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 10 }}
          className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl relative space-y-4"
        >
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white font-heading">
                  {title}
                </h3>
                <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold mt-0.5">
                  Tindakan Permanen
                </p>
              </div>
            </div>
            <button
              onClick={onCancel}
              disabled={isDeleting}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 space-y-2">
            <p>{description}</p>
            {itemName && (
              <p className="font-bold text-slate-900 dark:text-white bg-slate-200/60 dark:bg-slate-800/80 px-2.5 py-1.5 rounded-lg font-numeric break-all">
                Item: "{itemName}"
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onCancel}
              disabled={isDeleting}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isDeleting}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md shadow-rose-500/20 flex items-center space-x-1.5 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Trash2 size={14} />
              <span>{isDeleting ? 'Menghapus...' : 'Ya, Hapus Data'}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
