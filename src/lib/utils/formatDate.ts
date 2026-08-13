import { format, parseISO } from 'date-fns';

export function formatDate(dateStr: string | Date, pattern = 'dd MMMM yyyy'): string {
  try {
    const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
    return format(date, pattern);
  } catch {
    return String(dateStr);
  }
}

export function formatDateTime(dateStr: string | Date): string {
  return formatDate(dateStr, 'dd MMM yyyy HH:mm');
}

export function getCurrentTahunAjaran(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-12
  // Tahun ajaran biasanya mulai Juli (bulan 7)
  if (month >= 7) {
    return `${year}/${year + 1}`;
  }
  return `${year - 1}/${year}`;
}
