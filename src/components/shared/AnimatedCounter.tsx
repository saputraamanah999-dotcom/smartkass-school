import React, { useEffect, useRef, useState } from 'react';

interface AnimatedCounterProps {
  /** Target value to count up to */
  value: number;
  /** Duration of the animation in milliseconds (default: 1000) */
  duration?: number;
  /** Prefix string (e.g. "Rp") */
  prefix?: string;
  /** Suffix string (e.g. " Siswa") */
  suffix?: string;
  /** Number of decimal places (default: 0) */
  decimals?: number;
  /** Whether to format with locale thousands separators (default: true) */
  localeFormat?: boolean;
  /** Additional className for the span */
  className?: string;
}

/**
 * AnimatedCounter — counts up from 0 to the target value with a smooth
 * easing animation. Re-runs whenever the value changes.
 *
 * Uses requestAnimationFrame for buttery-smooth 60fps animation.
 */
export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  duration = 1000,
  prefix = '',
  suffix = '',
  decimals = 0,
  localeFormat = true,
  className = '',
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const animationRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    // Reset and start animation
    startRef.current = null;
    setDisplayValue(0);

    const animate = (timestamp: number) => {
      if (startRef.current === null) {
        startRef.current = timestamp;
      }
      const elapsed = timestamp - startRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic for a natural deceleration
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = eased * value;

      setDisplayValue(current);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, duration]);

  const formatted = localeFormat
    ? displayValue.toLocaleString('id-ID', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })
    : displayValue.toFixed(decimals);

  return (
    <span className={className}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
};

export default AnimatedCounter;
