'use client';

import { motion, type HTMLMotionProps } from 'framer-motion';
import type { ReactNode } from 'react';

/* Primary CTA: burgundy fill, cream text. Secondary: surface pill, burgundy text. */

export function PrimaryButton({
  children,
  className = '',
  ...props
}: HTMLMotionProps<'button'> & { children: ReactNode }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.12 }}
      className={`inline-flex h-12 items-center justify-center gap-2 rounded-full bg-burgundy px-6 text-[15px] font-semibold text-cream shadow-pill transition-colors duration-200 hover:bg-burgundy-soft disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}

export function SecondaryButton({
  children,
  className = '',
  ...props
}: HTMLMotionProps<'button'> & { children: ReactNode }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.12 }}
      className={`inline-flex h-12 items-center justify-center gap-2 rounded-full bg-surface px-6 text-[15px] font-semibold text-burgundy shadow-pill transition-colors duration-200 hover:bg-cream-deep disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}

/** Circular icon button (44–48px). */
export function IconButton({
  children,
  label,
  className = '',
  ...props
}: HTMLMotionProps<'button'> & { children: ReactNode; label: string }) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.12 }}
      aria-label={label}
      title={label}
      className={`inline-flex h-11 w-11 items-center justify-center rounded-full bg-surface text-burgundy shadow-pill transition-colors duration-200 hover:bg-cream-deep ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}

/** Soft switch used in settings. */
export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200 ${
        checked ? 'bg-burgundy' : 'bg-cream-deep'
      }`}
    >
      <span
        className={`absolute top-0.5 h-6 w-6 rounded-full bg-surface shadow transition-transform duration-200 ${
          checked ? 'translate-x-[22px]' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}
