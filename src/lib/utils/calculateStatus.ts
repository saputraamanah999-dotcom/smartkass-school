import { StatusPembayaran } from '../../types';

export function determineStatusPembayaran(
  totalPaid: number,
  requiredNominal: number,
  currentMinggu: number,
  mingguDibayar: number
): StatusPembayaran {
  if (totalPaid >= requiredNominal) {
    return 'lunas';
  }
  if (totalPaid > 0) {
    return 'dicicil';
  }
  
  if (mingguDibayar < currentMinggu) {
    const gap = currentMinggu - mingguDibayar;
    if (gap >= 2) {
      return 'menunggak';
    }
    return 'telat';
  }
  
  return 'belum';
}

export function getStatusBadgeStyle(status: StatusPembayaran) {
  switch (status) {
    case 'lunas':
      return {
        bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
        dot: 'bg-emerald-500',
        label: 'Lunas',
      };
    case 'dicicil':
      return {
        bg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
        dot: 'bg-amber-500',
        label: 'Dicicil',
      };
    case 'telat':
      return {
        bg: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
        dot: 'bg-rose-500',
        label: 'Telat',
      };
    case 'menunggak':
      return {
        bg: 'bg-red-600/20 border-red-500/40 text-red-400 animate-pulse',
        dot: 'bg-red-500',
        label: 'Menunggak',
      };
    case 'belum':
    default:
      return {
        bg: 'bg-slate-500/10 border-slate-500/30 text-slate-400',
        dot: 'bg-slate-400',
        label: 'Belum Bayar',
      };
  }
}
