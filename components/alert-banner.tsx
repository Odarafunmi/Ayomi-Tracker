'use client';

import { motion } from 'framer-motion';
import { X } from 'lucide-react';

import type { CycleAlert } from '@/lib/cycle/types';

/**
 * Irregularity alerts stay calm: a cream pill banner with an amber icon dot,
 * sliding down from the top with a slight bounce. No red, ever.
 */
export function AlertBanner({
  alert,
  onDismiss,
}: {
  alert: CycleAlert;
  onDismiss: () => void;
}) {
  return (
    <motion.section
      role="status"
      aria-label={alert.title}
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 320, damping: 22 }}
      className="flex items-start gap-3 rounded-[24px] bg-surface p-4 shadow-glow"
    >
      <span
        aria-hidden
        className="mt-1.5 h-2.5 w-2.5 shrink-0 animate-pulse-dot rounded-full bg-phase-ovulation"
      />
      <div className="min-w-0 flex-1">
        <h2 className="text-[14px] font-semibold text-burgundy-deep">{alert.title}</h2>
        <p className="mt-0.5 text-[13px] leading-snug text-muted">{alert.message}</p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss this notice"
        className="-mr-1 -mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-cream-deep hover:text-burgundy"
      >
        <X size={16} />
      </button>
    </motion.section>
  );
}
