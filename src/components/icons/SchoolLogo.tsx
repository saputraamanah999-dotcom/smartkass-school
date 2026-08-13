import React from 'react';

interface SchoolLogoProps {
  size?: number;
  className?: string;
}

/**
 * SchoolLogo — an SVG logo for SMK TI BALI GLOBAL KARANGASEM.
 * Features a graduation cap + circuit/network nodes representing
 * technology education. Scalable, no external image needed.
 */
export const SchoolLogo: React.FC<SchoolLogoProps> = ({ size = 48, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="logoGradCap" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
        <linearGradient id="logoGradCircuit" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
        <linearGradient id="logoGradBg" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
      </defs>

      {/* Background circle with gradient */}
      <circle cx="50" cy="50" r="48" fill="url(#logoGradBg)" stroke="url(#logoGradCap)" strokeWidth="2" />

      {/* Graduation cap (top half) */}
      {/* Cap base */}
      <path
        d="M20 38 L50 28 L80 38 L50 48 Z"
        fill="url(#logoGradCap)"
      />
      {/* Cap top */}
      <path
        d="M30 38 L50 30 L70 38 L50 46 Z"
        fill="#a5b4fc"
        opacity="0.6"
      />
      {/* Tassel */}
      <path
        d="M80 38 L80 45 Q80 48 78 48 L76 48"
        stroke="url(#logoGradCap)"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="76" cy="49" r="2.5" fill="#fbbf24" />

      {/* Circuit nodes (bottom half - representing tech) */}
      {/* Center node */}
      <circle cx="50" cy="68" r="4" fill="url(#logoGradCircuit)" />
      {/* Left node */}
      <circle cx="30" cy="62" r="3" fill="url(#logoGradCircuit)" opacity="0.8" />
      {/* Right node */}
      <circle cx="70" cy="62" r="3" fill="url(#logoGradCircuit)" opacity="0.8" />
      {/* Bottom left node */}
      <circle cx="35" cy="80" r="2.5" fill="url(#logoGradCircuit)" opacity="0.6" />
      {/* Bottom right node */}
      <circle cx="65" cy="80" r="2.5" fill="url(#logoGradCircuit)" opacity="0.6" />

      {/* Circuit connections */}
      <line x1="30" y1="62" x2="50" y2="68" stroke="url(#logoGradCircuit)" strokeWidth="1.5" opacity="0.5" />
      <line x1="70" y1="62" x2="50" y2="68" stroke="url(#logoGradCircuit)" strokeWidth="1.5" opacity="0.5" />
      <line x1="50" y1="68" x2="35" y2="80" stroke="url(#logoGradCircuit)" strokeWidth="1.5" opacity="0.4" />
      <line x1="50" y1="68" x2="65" y2="80" stroke="url(#logoGradCircuit)" strokeWidth="1.5" opacity="0.4" />
      <line x1="35" y1="80" x2="65" y2="80" stroke="url(#logoGradCircuit)" strokeWidth="1" opacity="0.3" />

      {/* Bottom text area indicator - small "TI" */}
      <text
        x="50"
        y="92"
        textAnchor="middle"
        fontSize="8"
        fontWeight="bold"
        fill="#818cf8"
        fontFamily="sans-serif"
      >
        TI BALI
      </text>
    </svg>
  );
};

export default SchoolLogo;
