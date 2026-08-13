import { StatusPembayaran } from '../../types';

export function getMingguKe(startDateStr?: string): number {
  const start = startDateStr ? new Date(startDateStr) : new Date(new Date().getFullYear(), 6, 1); // Default July 1st
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const week = Math.max(1, Math.ceil(diffDays / 7));
  return week;
}

export function getDueDateMinggu(mingguKe: number, startDateStr?: string): Date {
  const start = startDateStr ? new Date(startDateStr) : new Date(new Date().getFullYear(), 6, 1);
  const dueDate = new Date(start);
  dueDate.setDate(dueDate.getDate() + mingguKe * 7);
  return dueDate;
}
