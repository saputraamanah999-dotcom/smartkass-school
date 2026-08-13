import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTampilanConfig } from '../../hooks/useTampilanConfig';
import { SchoolLogo } from '../icons/SchoolLogo';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const { config } = useTampilanConfig();
  const [progress, setProgress] = useState(0);
  const [typedTagline, setTypedTagline] = useState('');

  useEffect(() => {
    // Typewriter effect for tagline
    const tagline = config.tagline || 'Kelola Uang Kas Sekolah Cerdas & Realtime';
    let i = 0;
    const interval = setInterval(() => {
      if (i < tagline.length) {
        setTypedTagline(tagline.slice(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
      }
    }, 35);

    // Dynamic progress bar animation based on config.splashDuration (in seconds)
    const durationSec = config.splashDuration || 4;
    const stepIntervalMs = Math.max(15, Math.floor((durationSec * 1000) / 100));

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(() => {
            onFinish();
          }, 400);
          return 100;
        }
        return prev + 1;
      });
    }, stepIntervalMs);

    return () => {
      clearInterval(interval);
      clearInterval(timer);
    };
  }, [config.tagline, config.splashDuration, onFinish]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
        transition={{ duration: 0.6 }}
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 text-white overflow-hidden"
      >
        {/* Background Image / Video if set in Admin Config */}
        {config.splashBackgroundUrl && (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-20 filter blur-sm scale-105"
            style={{ backgroundImage: `url(${config.splashBackgroundUrl})` }}
          />
        )}
        
        {/* Glowing Gradient Orbs */}
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-indigo-600/30 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none animate-pulse" />

        <div className="relative z-10 flex flex-col items-center max-w-lg px-6 text-center">
          {/* School / App Logo or 16:9 Video Splash Intro */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="relative mb-6 w-full flex justify-center"
          >
            {config.splashVideoUrl ? (
              <div className="w-full max-w-sm aspect-video rounded-2xl bg-slate-900 border border-indigo-500/30 overflow-hidden shadow-2xl shadow-indigo-500/25 relative group flex items-center justify-center">
                <video
                  src={config.splashVideoUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Hide video if link fails and show fallback logo
                    e.currentTarget.style.display = 'none';
                  }}
                />
                {config.logoUrl && (
                  <div className="absolute top-2 left-2 p-1.5 bg-slate-950/80 rounded-xl border border-slate-700/80 backdrop-blur-md">
                    <img src={config.logoUrl} alt="Logo Sekolah" className="w-6 h-6 object-contain" />
                  </div>
                )}
              </div>
            ) : config.logoUrl ? (
              <div className="w-24 h-24 rounded-2xl bg-slate-900/80 border border-slate-700/60 p-2 shadow-2xl shadow-indigo-500/20 flex items-center justify-center backdrop-blur-md">
                <img
                  src={config.logoUrl}
                  alt="Logo Sekolah"
                  className="w-full h-full object-contain rounded-xl"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-slate-900/80 border border-slate-700/60 p-1 shadow-2xl shadow-indigo-500/20 flex items-center justify-center backdrop-blur-md">
                <SchoolLogo size={88} />
              </div>
            )}
          </motion.div>

          {/* App Title */}
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-3xl sm:text-4xl font-extrabold tracking-tight font-heading bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent"
          >
            SmartKas <span className="text-indigo-400">School</span>
          </motion.h1>

          {/* Dynamic Tagline (Typewriter) */}
          <div className="h-12 mt-3 flex items-center justify-center">
            <p className="text-sm sm:text-base text-slate-300 font-medium tracking-wide">
              {typedTagline}
              <span className="inline-block w-1.5 h-4 ml-1 bg-indigo-500 animate-pulse" />
            </p>
          </div>

          {/* Animated Progress Bar */}
          <div className="w-full max-w-xs mt-8">
            <div className="h-2 w-full bg-slate-800/80 rounded-full overflow-hidden p-0.5 border border-slate-700/50 shadow-inner">
              <motion.div
                className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 rounded-full"
                style={{ width: `${progress}%` }}
                transition={{ ease: 'easeOut' }}
              />
            </div>
            <div className="flex justify-between items-center mt-2 text-xs text-slate-400 font-numeric">
              <span>Menyiapkan Sistem Realtime...</span>
              <span>{progress}%</span>
            </div>
          </div>
        </div>

        {/* Footer Badge */}
        <div className="absolute bottom-6 text-xs text-slate-500 font-medium tracking-wider uppercase">
          Powered by Saputra Developer
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
