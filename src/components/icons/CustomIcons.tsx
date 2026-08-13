import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
}

export const SchoolIcon: React.FC<IconProps> = ({ size = 24, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <defs>
      <linearGradient id="schoolGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#6366F1" />
        <stop offset="100%" stopColor="#8B5CF6" />
      </linearGradient>
    </defs>
    <path d="M12 3L2 8L12 13L22 8L12 3Z" stroke="url(#schoolGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="url(#schoolGrad)" fillOpacity="0.15" />
    <path d="M5 10.5V17.5C5 17.5 8 19 12 19C16 19 19 17.5 19 17.5V10.5" stroke="url(#schoolGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M22 8V15" stroke="url(#schoolGrad)" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const JurusanIcon: React.FC<IconProps> = ({ size = 24, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <defs>
      <linearGradient id="jurusanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#3B82F6" />
        <stop offset="100%" stopColor="#2563EB" />
      </linearGradient>
    </defs>
    <rect x="3" y="4" width="18" height="16" rx="3" stroke="url(#jurusanGrad)" strokeWidth="2" fill="url(#jurusanGrad)" fillOpacity="0.15" />
    <path d="M7 8H17M7 12H13M7 16H11" stroke="url(#jurusanGrad)" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const KelasIcon: React.FC<IconProps> = ({ size = 24, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <defs>
      <linearGradient id="kelasGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#10B981" />
        <stop offset="100%" stopColor="#059669" />
      </linearGradient>
    </defs>
    <path d="M4 5C4 3.89543 4.89543 3 6 3H18C19.1046 3 20 3.89543 20 5V19C20 20.1046 19.1046 21 18 21H6C4.89543 21 4 20.1046 4 19V5Z" stroke="url(#kelasGrad)" strokeWidth="2" fill="url(#kelasGrad)" fillOpacity="0.15" />
    <path d="M8 7H16M8 11H16M8 15H12" stroke="url(#kelasGrad)" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const GuruIcon: React.FC<IconProps> = ({ size = 24, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <defs>
      <linearGradient id="guruGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#EC4899" />
        <stop offset="100%" stopColor="#8B5CF6" />
      </linearGradient>
    </defs>
    <circle cx="12" cy="7" r="4" stroke="url(#guruGrad)" strokeWidth="2" fill="url(#guruGrad)" fillOpacity="0.2" />
    <path d="M4 21C4 17.134 7.58172 14 12 14C16.4183 14 20 17.134 20 21" stroke="url(#guruGrad)" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const BendaharaIcon: React.FC<IconProps> = ({ size = 24, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <defs>
      <linearGradient id="bendaharaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#D97706" />
      </linearGradient>
    </defs>
    <rect x="3" y="6" width="18" height="13" rx="3" stroke="url(#bendaharaGrad)" strokeWidth="2" fill="url(#bendaharaGrad)" fillOpacity="0.15" />
    <circle cx="12" cy="12.5" r="2.5" stroke="url(#bendaharaGrad)" strokeWidth="2" />
    <path d="M16.5 9.5V9.51M7.5 15.5V15.51" stroke="url(#bendaharaGrad)" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const SiswaIcon: React.FC<IconProps> = ({ size = 24, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <defs>
      <linearGradient id="siswaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#06B6D4" />
        <stop offset="100%" stopColor="#3B82F6" />
      </linearGradient>
    </defs>
    <path d="M16 21V19C16 16.7909 14.2091 15 12 15C9.79086 15 8 16.7909 8 19V21" stroke="url(#siswaGrad)" strokeWidth="2" strokeLinecap="round" />
    <circle cx="12" cy="8" r="4" stroke="url(#siswaGrad)" strokeWidth="2" fill="url(#siswaGrad)" fillOpacity="0.15" />
  </svg>
);

export const CoinIcon: React.FC<IconProps> = ({ size = 24, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <defs>
      <linearGradient id="coinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FBBF24" />
        <stop offset="100%" stopColor="#F59E0B" />
      </linearGradient>
    </defs>
    <circle cx="12" cy="12" r="9" stroke="url(#coinGrad)" strokeWidth="2" fill="url(#coinGrad)" fillOpacity="0.2" />
    <path d="M12 7V17M14.5 9.5C14.5 9.5 13.5 8.5 12 8.5C10.5 8.5 9.5 9.5 9.5 10.75C9.5 12 10.5 12.5 12 12.5C13.5 12.5 14.5 13 14.5 14.25C14.5 15.5 13.5 16.5 12 16.5C10.5 16.5 9.5 15.5 9.5 15.5" stroke="url(#coinGrad)" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const WalletIcon: React.FC<IconProps> = ({ size = 24, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <defs>
      <linearGradient id="walletGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#10B981" />
        <stop offset="100%" stopColor="#059669" />
      </linearGradient>
    </defs>
    <path d="M19 7H5C3.89543 7 3 7.89543 3 9V18C3 19.1046 3.89543 20 5 20H19C20.1046 20 21 19.1046 21 18V9C21 7.89543 20.1046 7 19 7Z" stroke="url(#walletGrad)" strokeWidth="2" fill="url(#walletGrad)" fillOpacity="0.15" />
    <path d="M16 13.5H16.01M3 9V6C3 4.89543 3.89543 4 5 4H16" stroke="url(#walletGrad)" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const TargetIcon: React.FC<IconProps> = ({ size = 24, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <defs>
      <linearGradient id="targetGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#EF4444" />
        <stop offset="100%" stopColor="#F59E0B" />
      </linearGradient>
    </defs>
    <circle cx="12" cy="12" r="9" stroke="url(#targetGrad)" strokeWidth="2" fill="url(#targetGrad)" fillOpacity="0.1" />
    <circle cx="12" cy="12" r="5" stroke="url(#targetGrad)" strokeWidth="2" />
    <circle cx="12" cy="12" r="2" fill="url(#targetGrad)" />
  </svg>
);

export const ChartUpIcon: React.FC<IconProps> = ({ size = 24, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <defs>
      <linearGradient id="chartUpGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#10B981" />
        <stop offset="100%" stopColor="#3B82F6" />
      </linearGradient>
    </defs>
    <path d="M3 3V21H21" stroke="url(#chartUpGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M7 14L11 10L15 13L21 6" stroke="url(#chartUpGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M17 6H21V10" stroke="url(#chartUpGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const CalendarIcon: React.FC<IconProps> = ({ size = 24, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <rect x="3" y="4" width="18" height="17" rx="3" stroke="currentColor" strokeWidth="2" />
    <path d="M16 2V6M8 2V6M3 9H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const ExportIcon: React.FC<IconProps> = ({ size = 24, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <path d="M12 3V15M12 3L8 7M12 3L16 7M4 17V19C4 20.1046 4.89543 21 6 21H18C19.1046 21 20 20.1046 20 19V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const CheckLunasIcon: React.FC<IconProps> = ({ size = 24, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <circle cx="12" cy="12" r="9" fill="#10B981" fillOpacity="0.2" stroke="#10B981" strokeWidth="2" />
    <path d="M8 12L11 15L16 9" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const ClockLateIcon: React.FC<IconProps> = ({ size = 24, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <circle cx="12" cy="12" r="9" fill="#EF4444" fillOpacity="0.2" stroke="#EF4444" strokeWidth="2" />
    <path d="M12 7V12L15 15" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
