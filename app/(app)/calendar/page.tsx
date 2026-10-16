'use client';

import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, CirclePlus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';

import { useApp } from '@/app/providers';
import { AmberPill } from '@/components/amber-pill';
import { CalendarLegend, CalendarMonth } from '@/components/calendar-month';
import { LogPeriodModal } from '@/components/log-period-modal';
import { StaggerPage, fadeUp } from '@/components/motion';
import { IconButton, PrimaryButton } from '@/components/ui';
import { diffDays, formatDay, monthStart, shiftMonth } from '@/lib/cycle/dates';

export default function CalendarPage() {
  const { profile, status, cycles, today, logPeriod, deleteCycle } = useApp();
  const [cursor, setCursor] = useState(today);
  const [dir, setDir] = useState<1 | -1>(1);
  const [logging, setLogging] = useState(false);
  const [initialStart, setInitialStart] = useState<string | undefined>(undefined);

  const recentCycles = useMemo(() => [...cycles].reverse().slice(0, 6), [cycles]);

  if (!profile || !status) return null;

  const monthLabel = new Intl.DateTimeFormat('en-GB', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${monthStart(cursor)}T00:00:00Z`));

  function goMonth(delta: 1 | -1) {
    setDir(delta);
    setCursor((c) => shiftMonth(c, delta));
  }

  function openLog(start?: string) {
    setInitialStart(start);
    setLogging(true);
  }

  return (
    <StaggerPage className="space-y-4">
      <motion.header variants={fadeUp} className="px-1 pt-2">
        <h1 className="font-serif text-[28px] font-semibold tracking-tight text-burgundy-deep">
          Your calendar
        </h1>
        <p className="mt-1 text-[14px] text-muted">
          Tap any day to <AmberPill>log</AmberPill> a period from it.
        </p>
      </motion.header>

      <motion.section
        variants={fadeUp}
        aria-label="Cycle calendar"
        className="rounded-card bg-surface p-5 shadow-pill"
      >
        <div className="mb-4 flex items-center justify-between">
          <IconButton label="Previous month" onClick={() => goMonth(-1)}>
            <ChevronLeft size={20} />
          </IconButton>
          <h2 className="font-serif text-[19px] font-semibold text-burgundy-deep">{monthLabel}</h2>
          <IconButton label="Next month" onClick={() => goMonth(1)}>
            <ChevronRight size={20} />
          </IconButton>
        </div>

        <CalendarMonth
          cursor={cursor}
          dir={dir}
          today={today}
          status={status}
          cycles={cycles}
          onPick={(iso) => openLog(iso > today ? today : iso)}
        />

        <div className="mt-5">
          <CalendarLegend />
        </div>

        <PrimaryButton onClick={() => openLog()} className="mt-5 w-full">
          <CirclePlus size={17} aria-hidden />
          Log a period
        </PrimaryButton>
      </motion.section>

      <motion.section variants={fadeUp} aria-label="Recent cycles" className="rounded-card bg-surface p-5 shadow-pill">
        <h2 className="font-serif text-[19px] font-semibold text-burgundy-deep">Recent cycles</h2>
        <ul className="mt-3 divide-y divide-cream-deep/70">
          {recentCycles.map((c, i) => {
            const next = recentCycles[i - 1];
            const length = next ? diffDays(c.startDate, next.startDate) : null;
            const bleed = c.endDate ? diffDays(c.startDate, c.endDate) + 1 : null;
            return (
              <li key={c.id} className="flex items-center gap-3 py-3">
                <span
                  aria-hidden
                  className="h-2.5 w-2.5 shrink-0 rounded-full bg-phase-menstrual"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold text-burgundy-deep">
                    {formatDay(c.startDate)}
                    {c.endDate ? ` – ${formatDay(c.endDate)}` : ' – ongoing'}
                  </p>
                  <p className="text-[12px] text-muted">
                    {bleed ? `${bleed} day bleed` : 'Bleeding in progress'}
                    {length !== null ? ` · ${length} day cycle` : ''}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label={`Delete cycle starting ${formatDay(c.startDate)}`}
                  title={cycles.length <= 1 ? 'Keep at least one cycle logged' : 'Delete this cycle'}
                  disabled={cycles.length <= 1}
                  onClick={() => deleteCycle(c.id)}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-cream-deep hover:text-error disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-muted"
                >
                  <Trash2 size={16} />
                </button>
              </li>
            );
          })}
          {recentCycles.length === 0 && (
            <li className="py-3 text-[14px] text-muted">No cycles logged yet.</li>
          )}
        </ul>
      </motion.section>

      <LogPeriodModal
        open={logging}
        onClose={() => setLogging(false)}
        today={today}
        periodLength={status.effectivePeriodLength}
        initialStart={initialStart}
        onSave={async (start, end) => {
          await logPeriod(start, end);
          setLogging(false);
        }}
      />
    </StaggerPage>
  );
}
