'use client';

import { motion } from 'framer-motion';

import type { CycleStatus } from '@/lib/cycle/types';
import { EASE_OUT, useSoftMotion } from './motion';

/**
 * Striped progress bar: amber fill grows left to right on a burgundy track,
 * with the stripes sliding subtly.
 */
export function CycleProgress({ status }: { status: CycleStatus }) {
  const { seconds } = useSoftMotion();
  const pct = Math.round(status.cycleProgress * 100);

  return (
    <section
      aria-label="Cycle progress"
      className="rounded-card bg-surface p-5 shadow-pill"
    >
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-[13px] font-medium text-muted">Cycle progress</h2>
        <p className="tabular text-[13px] font-semibold text-burgundy">
          Day {status.cycleDay} of {status.effectiveCycleLength}
        </p>
      </div>
      <div
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Cycle ${pct}% complete`}
        className="h-3 overflow-hidden rounded-full bg-burgundy"
      >
        <motion.div
          className="relative h-full rounded-full bg-phase-ovulation"
          initial={{ width: '0%' }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: seconds(0.8), ease: EASE_OUT }}
        >
          <div className="progress-stripes animate-stripes absolute inset-0 rounded-full" />
        </motion.div>
      </div>
    </section>
  );
}
