import React from 'react';

/**
 * ShimmerSkeleton — a reusable loading skeleton with a shimmer animation.
 * Use anywhere data is loading from Firestore.
 */
interface ShimmerSkeletonProps {
  className?: string;
  /** Number of repeated skeleton rows */
  count?: number;
}

export const ShimmerSkeleton: React.FC<ShimmerSkeletonProps> = ({ className = '', count = 1 }) => {
  if (count === 1) {
    return (
      <div
        className={`relative overflow-hidden rounded-xl bg-slate-800/60 ${className}`}
      >
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-slate-600/30 to-transparent" />
      </div>
    );
  }
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`relative overflow-hidden rounded-xl bg-slate-800/60 ${className}`}
        >
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-slate-600/30 to-transparent" />
        </div>
      ))}
    </>
  );
};

/**
 * StatCardSkeleton — skeleton matching the dashboard stat card layout.
 */
export const StatCardSkeleton: React.FC = () => (
  <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
    <div className="flex items-center justify-between">
      <ShimmerSkeleton className="h-3 w-24" />
      <ShimmerSkeleton className="h-8 w-8 rounded-xl" />
    </div>
    <ShimmerSkeleton className="h-7 w-28" />
    <ShimmerSkeleton className="h-2 w-20" />
  </div>
);

/**
 * TableSkeleton — skeleton matching a data table layout.
 */
export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({
  rows = 5,
  cols = 4,
}) => (
  <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
    <div className="p-4 border-b border-slate-800">
      <ShimmerSkeleton className="h-4 w-48" />
    </div>
    <div className="divide-y divide-slate-800">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="p-4 flex items-center gap-4">
          {Array.from({ length: cols }).map((_, c) => (
            <ShimmerSkeleton key={c} className="h-3 flex-1" />
          ))}
        </div>
      ))}
    </div>
  </div>
);

export default ShimmerSkeleton;
