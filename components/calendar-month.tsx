'use client';

import { AnimatePresence, motion, type Variants } from 'framer-motion';
import { useMemo } from 'react';

import { classifyMonth } from '@/lib/cycle/engine';
import { monthStart } from '@/lib/cycle/dates';
import type { CycleEntry, CycleStatus, DayKind } from '@/lib/cycle/types';
import { EASE_OUT } from './motion';

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const CELL_STYLE: Record<DayKind, string> = {
  period: 'bg-phase-menstrual text-cream font-semibold',
  'predicted-period':
    'border-2 border-dashed border-phase-menstrual/60 bg-transparent text-burgundy-deep/80',
  ovulation: 'bg-phase-ovulation text-burgundy-deep font-semibold',
  fertile: 'bg-phase-follicular/30 text-burgundy-deep',
  none: 'text-burgundy-deep/75 hover:bg-surface',
};

const CELL_LABEL: Record<DayKind, string> = {
  period: 'period day',
  'predicted-period': 'predicted period day',
  ovulation: 'predicted ovulation day',
  fertile: 'fertile window day',
  none: '',
};

const monthVariants = (dir: 1 | -1): Variants => ({
  enter: { opacity: 0, x: 32 * dir, scale: 0.98 },
  center: { opacity: 1, x: 0, scale: 1, transition: { duration: 0.3, ease: EASE_OUT } },
  exit: { opacity: 0, x: -32 * dir, scale: 0.98, transition: { duration: 0.18, ease: 'easeIn' } },
});

const gridVariants: Variants = {
  center: { transition: { staggerChildren: 0.006, delayChildren: 0.05 } },
};

const cellVariants: Variants = {
  enter: { opacity: 0, scale: 0.5 },
  center: { opacity: 1, scale: 1, transition: { duration: 0.25, ease: EASE_OUT } },
};

/**
 * A month of rounded day cells: logged periods in berry rose, predicted
 * periods dashed, ovulation amber, and the fertile window soft teal.
 * Months slide across and the cells pop in with a rapid stagger.
 */
export function CalendarMonth({
  cursor,
  dir,
  today,
  status,
  cycles,
  onPick,
}: {
  cursor: string;
  dir: 1 | -1;
  today: string;
  status: CycleStatus;
  cycles: CycleEntry[];
  onPick: (iso: string) => void;
}) {
  const cells = useMemo(() => {
    const kinds = classifyMonth(cursor, status, cycles);
    const first = monthStart(cursor);
    // Week starts Monday: JS getUTCDay() Sunday=0 → offset ((day+6)%7).
    const lead = (new Date(`${first}T00:00:00Z`).getUTCDay() + 6) % 7;
    const dates = Object.keys(kinds).sort();
    const blanks = Array.from({ length: lead }, (_, i) => `blank-${i}`);
    return { blanks, dates, kinds };
  }, [cursor, status, cycles]);

  return (
    <div className="overflow-hidden">
      <div className="mb-2 grid grid-cols-7 gap-1">
        {WEEKDAYS.map((d, i) => (
          <div key={i} className="py-1 text-center text-[11px] font-semibold uppercase tracking-wider text-muted">
            {d}
          </div>
        ))}
      </div>

      <AnimatePresence mode="popLayout" initial={false} custom={dir}>
        <motion.div
          key={monthStart(cursor)}
          variants={monthVariants(dir)}
          initial="enter"
          animate="center"
          exit="exit"
        >
          <motion.div variants={gridVariants} className="grid grid-cols-7 gap-1">
            {cells.blanks.map((b) => (
              <div key={b} aria-hidden />
            ))}
            {cells.dates.map((iso) => {
              const kind = cells.kinds[iso];
              const day = Number(iso.slice(8, 10));
              const isToday = iso === today;
              const extra = CELL_LABEL[kind];
              return (
                <motion.button
                  key={iso}
                  type="button"
                  variants={cellVariants}
                  whileHover={{ scale: 1.12 }}
                  whileTap={{ scale: 0.88 }}
                  onClick={() => onPick(iso)}
                  aria-label={`${iso}${isToday ? ', today' : ''}${extra ? ` — ${extra}` : ''}. Tap to log a period.`}
                  aria-pressed={kind === 'period'}
                  className={`flex h-10 items-center justify-center rounded-2xl text-[13.5px] tabular sm:h-11 ${CELL_STYLE[kind]} ${
                    isToday ? 'ring-2 ring-burgundy ring-offset-2 ring-offset-cream' : ''
                  }`}
                >
                  {day}
                </motion.button>
              );
            })}
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/** Legend for the calendar, as soft pills. */
export function CalendarLegend() {
  const items = [
    { swatch: 'h-3 w-3 rounded-full bg-phase-menstrual', label: 'Period' },
    {
      swatch: 'h-3 w-3 rounded-full border-2 border-dashed border-phase-menstrual/70',
      label: 'Predicted',
    },
    { swatch: 'h-3 w-3 rounded-full bg-phase-ovulation', label: 'Ovulation' },
    { swatch: 'h-3 w-3 rounded-full bg-phase-follicular/50', label: 'Fertile' },
  ];
  return (
    <ul className="flex flex-wrap gap-2" aria-label="Calendar legend">
      {items.map((item) => (
        <li
          key={item.label}
          className="flex items-center gap-2 rounded-full bg-surface px-3 py-1.5 text-[12px] font-medium text-burgundy-deep/80 shadow-pill"
        >
          <span aria-hidden className={item.swatch} />
          {item.label}
        </li>
      ))}
    </ul>
  );
}
