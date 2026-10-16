'use client';

import { useEffect, useRef, useState } from 'react';
import { animate, motion } from 'framer-motion';

import { PHASE_CONTENT } from '@/lib/cycle/content';
import { phaseForCycleDay } from '@/lib/cycle/engine';
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
 * the centre. Interactive: drag (or use arrow keys) along the arc to preview
 * any day of the cycle — it springs back to today when you let go.
 */
export function CycleDial({ status }: { status: CycleStatus }) {
  const { reduce } = useSoftMotion();
  const [displayDay, setDisplayDay] = useState(reduce ? status.cycleDay : 0);
  /** Live preview position (in fractional days) while scrubbing. */
  const [preview, setPreview] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const keyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const phase = PHASE_CONTENT[status.phase];
  const arcPath = `M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`;
  const len = status.effectiveCycleLength;

  const previewDay = preview === null ? null : Math.min(len, Math.max(1, Math.round(preview)));
  const shownDay = previewDay ?? status.cycleDay;
  const shownProgress = preview === null ? status.cycleProgress : Math.min(Math.max(preview / len, 0), 1);
  const shownPhase =
    previewDay === null ? phase : PHASE_CONTENT[phaseForCycleDay(previewDay, status.boundaries)];

  // Initial count-up of today's cycle day.
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

  const ticks = Array.from({ length: len + 1 }, (_, i) => {
    const p = i / len;
    const isWeek = i % 7 === 0;
    const outer = pointAt(p, R + (isWeek ? 18 : 14));
    const inner = pointAt(p, R + 8);
    return { ...outer, x2: inner.x, y2: inner.y, isWeek, key: i };
  });

  function dayFromPointer(clientX: number): number {
    const el = svgRef.current;
    if (!el) return status.cycleDay;
    const rect = el.getBoundingClientRect();
    const p = Math.min(0.999, Math.max(0.001, (clientX - rect.left) / rect.width));
    return p * len;
  }

  function nudgeByKeyboard(delta: number | 'home' | 'end') {
    const base = previewDay ?? status.cycleDay;
    const next =
      delta === 'home' ? 1 : delta === 'end' ? len : Math.min(len, Math.max(1, base + delta));
    setPreview(next);
    if (keyTimer.current) clearTimeout(keyTimer.current);
    keyTimer.current = setTimeout(() => setPreview(null), 1400);
  }

  return (
    <div className="relative mx-auto w-full max-w-[340px]">
      {/* Ambient phase glow behind the dial, cross-fading on phase change. */}
      <div
        aria-hidden
        className="absolute left-1/2 top-1/2 h-52 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-25 blur-3xl transition-colors duration-700"
        style={{ backgroundColor: shownPhase.color }}
      />

      <svg
        ref={svgRef}
        viewBox="0 0 320 190"
        className="relative w-full cursor-ew-resize touch-none select-none"
        role="slider"
        tabIndex={0}
        aria-label={`Cycle day explorer. Today is day ${status.cycleDay} of ${len}`}
        aria-valuemin={1}
        aria-valuemax={len}
        aria-valuenow={shownDay}
        aria-valuetext={`Day ${shownDay} of ${len}, ${shownPhase.name} phase${previewDay !== null ? ' (preview)' : ''}`}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          setPreview(dayFromPointer(e.clientX));
        }}
        onPointerMove={(e) => {
          if (e.buttons & 1) setPreview(dayFromPointer(e.clientX));
        }}
        onPointerUp={() => setPreview(null)}
        onPointerCancel={() => setPreview(null)}
        onBlur={() => setPreview(null)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
            e.preventDefault();
            nudgeByKeyboard(-1);
          } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
            e.preventDefault();
            nudgeByKeyboard(1);
          } else if (e.key === 'Home') {
            e.preventDefault();
            nudgeByKeyboard('home');
          } else if (e.key === 'End') {
            e.preventDefault();
            nudgeByKeyboard('end');
          }
        }}
      >
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
            stroke={t.isWeek ? '#D3B98F' : '#E7DAC2'}
            strokeWidth={t.isWeek ? 2.4 : 1.6}
            strokeLinecap="round"
            opacity={0.95}
          />
        ))}

        {/* Cream track. */}
        <path d={arcPath} fill="none" stroke="#F0E4CE" strokeWidth={13} strokeLinecap="round" />

        {/* Progress arc: sweeps to today, follows the pointer while previewing,
            and springs back on release. */}
        <motion.path
          d={arcPath}
          fill="none"
          stroke="url(#dial-progress)"
          strokeWidth={13}
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: shownProgress }}
          transition={
            preview !== null
              ? { duration: 0.06, ease: 'linear' }
              : reduce
                ? { duration: 0 }
                : { type: 'spring', stiffness: 260, damping: 24, mass: 0.8 }
          }
        />
        {/* Preview handle dot riding the arc. */}
        {previewDay !== null && (
          (() => {
            const p = pointAt(shownProgress, R);
            return (
              <motion.circle
                cx={p.x}
                cy={p.y}
                r={9}
                fill="#FFFBF5"
                stroke="#6D1A36"
                strokeWidth={3}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
              />
            );
          })())}
      </svg>

      {/* Centre readout. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center pb-1 text-center">
        <span className="tabular text-[64px] font-bold leading-none tracking-tight text-burgundy-deep">
          {previewDay ?? displayDay}
        </span>
        <span className="mt-1 flex items-center gap-1.5 text-[12px] font-medium uppercase tracking-[0.14em] text-muted">
          Cycle day
          {previewDay !== null && (
            <span className="rounded-full bg-phase-ovulation px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-burgundy-deep">
              preview
            </span>
          )}
        </span>
        <span
          className="mt-1.5 font-serif text-[19px] font-semibold transition-colors duration-500"
          style={{ color: previewDay !== null ? shownPhase.color : '#6D1A36' }}
        >
          {shownPhase.name} phase
        </span>
      </div>

      <p className="mt-2 text-center text-[12px] text-muted/80">
        Drag the arc to explore any day
      </p>
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
      <motion.span
        key={label}
        initial={{ opacity: 0, y: 8, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: EASE_OUT }}
        className="inline-flex items-center gap-2 rounded-full bg-surface px-5 py-2.5 text-[14px] font-semibold text-burgundy shadow-pill"
      >
        <span
          aria-hidden
          className={`h-2 w-2 rounded-full ${late ? 'bg-phase-ovulation' : 'bg-phase-menstrual animate-pulse-dot'}`}
        />
        <span className="tabular">{label}</span>
      </motion.span>
    </div>
  );
}
