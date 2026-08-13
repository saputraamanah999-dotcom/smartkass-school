import React from 'react';
import { motion } from 'motion/react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '', showLabel = false }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle Theme"
      className={`relative flex items-center gap-2 p-1.5 rounded-2xl bg-slate-200/80 dark:bg-slate-800/80 border border-slate-300/70 dark:border-slate-700/70 text-slate-700 dark:text-slate-200 hover:bg-slate-300/80 dark:hover:bg-slate-700/80 transition-colors cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${className}`}
    >
      <div className="relative flex items-center justify-between w-14 h-7 p-0.5 rounded-xl bg-slate-300/60 dark:bg-slate-900/60 overflow-hidden">
        {/* Animated Thumb */}
        <motion.div
          layout
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className={`absolute top-0.5 bottom-0.5 w-6 rounded-lg bg-white dark:bg-indigo-600 shadow-md flex items-center justify-center ${
            isDark ? 'right-0.5' : 'left-0.5'
          }`}
        >
          <motion.div
            key={theme}
            initial={{ rotate: -90, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            exit={{ rotate: 90, scale: 0 }}
            transition={{ duration: 0.2 }}
          >
            {isDark ? (
              <Moon size={13} className="text-amber-300 fill-amber-300" />
            ) : (
              <Sun size={13} className="text-amber-500 fill-amber-500" />
            )}
          </motion.div>
        </motion.div>

        {/* Background Icons for visually pleasing toggle */}
        <span className="flex-1 flex items-center justify-center text-amber-500 z-0">
          <Sun size={12} className={!isDark ? 'opacity-0' : 'opacity-40'} />
        </span>
        <span className="flex-1 flex items-center justify-center text-slate-400 z-0">
          <Moon size={12} className={isDark ? 'opacity-0' : 'opacity-40'} />
        </span>
      </div>

      {showLabel && (
        <span className="text-xs font-semibold px-1 text-slate-700 dark:text-slate-300">
          {isDark ? 'Gelap' : 'Terang'}
        </span>
      )}
    </button>
  );
};

export default ThemeToggle;
