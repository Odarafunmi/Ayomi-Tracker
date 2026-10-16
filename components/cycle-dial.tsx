'use client';

import { useEffect, useState } from 'react';
import { animate, motion } from 'framer-motion';

import { PHASE_CONTENT } from '@/lib/cycle/content';
import type { CycleStatus } from '@/lib/cycle/types';
import { EASE_OUT, useSoftMotion } from './motion';

const CX = 160;
const CY = 176;
const R = 124;

/** Point on the gauge for progress p in [0, 1] (180° → 0°), at radius r. */
function pointAt(p: number, r: number): { x: number; y: number } {
  const angle = Math.PI - p * Math.PI;
  return { x: CX + r * Math.cos(angle), y: CY - r * Math.sin(angle) };
}

/**
 * The hero semicircle gauge: tick marks on a cream track, the progress arc
 * sweeping from berry rose through amber, and the cycle day counting up in
 * the centre.
 */
export function CycleDial({ status }: { status: CycleStatus }) {
  const { reduce, seconds } = useSoftMotion();
  const [displayDay, setDisplayDay] = useState(reduce ? status.cycleDay : 0);
  const phase = PHASE_CONTENT[status.phase];
  const arcPath = `M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`;

  useEffect(() => {
    if (reduce) {
      setDisplayDay(status.cycleDay);
      return;
    }
    const controls = animate(0, status.cycleDay, {
      duration: 1.2,
      ease: 'easeOut',
      onUpdate: (v) => setDisplayDay(Math.round(v)),
    });
    return () => controls.stop();
  }, [status.cycleDay, reduce]);

  const ticks = Array.from({ length: status.effectiveCycleLength + 1 }, (_, i) => {
    const p = i / status.effectiveCycleLength;
    const isWeek = i % 7 === 0;
    const outer = pointAt(p, R + (isWeek ? 18 : 14));
    const inner = pointAt(p, R + 8);
    return { ...outer, x2: inner.x, y2: inner.y, isWeek, key: i };
  });

  return (
    <div className="relative mx-auto w-full max-w-[340px]">
      {/* Ambient phase glow behind the dial, cross-fading on phase change. */}
      <div
        aria-hidden
        className="absolute left-1/2 top-1/2 h-52 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-25 blur-3xl transition-colors duration-700"
        style={{ backgroundColor: phase.color }}
      />

      <svg viewBox="0 0 320 190" className="relative w-full" role="img" aria-label={`Cycle day ${status.cycleDay} of ${status.effectiveCycleLength}`}>
        <defs>
          <linearGradient id="dial-progress" gradientUnits="userSpaceOnUse" x1={CX - R} y1={CY} x2={CX + R} y2={CY}>
            <stop offset="0" stopColor="#D6336C" />
            <stop offset="0.55" stopColor="#F06E4B" />
            <stop offset="1" stopColor="#F2A33A" />
          </linearGradient>
        </defs>

        {/* Tick marks on the cream track. */}
        {ticks.map((t) => (
          <line
            key={t.key}
            x1={t.x}
            y1={t.y}
            x2={t.x2}
            y2={t.y2}
            stroke={t.isWeek ? '#C9A97E' : '#E3D2B8'}
            strokeWidth={t.isWeek ? 2.4 : 1.6}
            strokeLinecap="round"
            opacity={0.9}
          />
        ))}

        {/* Cream track. */}
        <path d={arcPath} fill="none" stroke="#EFE1CD" strokeWidth={13} strokeLinecap="round" />

        {/* Progress arc: sweeps from 0 to the current day. */}
        <motion.path
          key={status.cycleDay}
          d={arcPath}
          fill="none"
          stroke="url(#dial-progress)"
          strokeWidth={13}
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: status.cycleProgress }}
          transition={{ duration: seconds(1.2), ease: reduce ? 'linear' : EASE_OUT }}
        />
      </svg>

      {/* Centre readout. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center pb-1 text-center">
        <span className="tabular text-[64px] font-bold leading-none tracking-tight text-burgundy-deep">
          {displayDay}
        </span>
        <span className="mt-1 text-[12px] font-medium uppercase tracking-[0.14em] text-muted">
          Cycle day
        </span>
        <span className="mt-1.5 font-serif text-[19px] font-semibold text-burgundy">
          {phase.name} phase
        </span>
      </div>
    </div>
  );
}

/** Pill below the dial: "Period in 6 days" (calm amber wording when late). */
export function PeriodCountdownPill({ status }: { status: CycleStatus }) {
  const late = status.daysUntilPeriod < 0;
  const label =
    status.daysUntilPeriod === 0
      ? 'Period expected today'
      : status.daysUntilPeriod === 1
        ? 'Period expected tomorrow'
        : late
          ? `Period is ${-status.daysUntilPeriod} ${-status.daysUntilPeriod === 1 ? 'day' : 'days'} late`
          : `Period in ${status.daysUntilPeriod} days`;

  return (
    <div className="mt-4 flex justify-center">
      <span className="inline-flex items-center gap-2 rounded-full bg-surface px-5 py-2.5 text-[14px] font-semibold text-burgundy shadow-pill">
        <span
          aria-hidden
          className={`h-2 w-2 rounded-full ${late ? 'bg-phase-ovulation' : 'bg-phase-menstrual animate-pulse-dot'}`}
        />
        <span className="tabular">{label}</span>
      </span>
    </div>
  );
}
