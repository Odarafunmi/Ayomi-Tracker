'use client';

import { motion } from 'framer-motion';
import { Battery, CheckCircle2, Heart, Waves } from 'lucide-react';

import { useApp } from '@/app/providers';
import { AmberPill } from '@/components/amber-pill';
import { EnergyChart } from '@/components/energy-chart';
import { StaggerPage, fadeUp } from '@/components/motion';
import { PhaseCharacter } from '@/components/phase-character';
import { MEDICAL_DISCLAIMER, PHASE_CONTENT, PHASE_ORDER } from '@/lib/cycle/content';
import { addDays, diffDays, formatDay, relativeDay } from '@/lib/cycle/dates';
import type { CycleStatus } from '@/lib/cycle/types';

export default function InsightsPage() {
  const { status, today, dismissedAlertIds } = useApp();
  if (!status) return null;

  const content = PHASE_CONTENT[status.phase];
  const [before, after] = content.headline.split(content.highlight);
  const b = status.boundaries;

  // Upcoming phase transitions, in order, from today's anchor cycle.
  const upcoming = buildUpcoming(status);

  const statRows = [
    { icon: Heart, label: 'Mood', value: content.mood },
    { icon: Battery, label: 'Energy', value: content.energy },
    { icon: Waves, label: 'Body', value: content.body },
  ];

  const visibleAlerts = status.alerts.filter((a) => !dismissedAlertIds.includes(a.id));

  return (
    <StaggerPage className="space-y-4">
      <motion.header variants={fadeUp} className="px-1 pt-2">
        <h1 className="font-serif text-[28px] font-semibold tracking-tight text-burgundy-deep">
          Understanding <AmberPill>your cycle</AmberPill>
        </h1>
        <p className="mt-1 text-[14px] text-muted">
          What is happening, why you feel it, and what comes next.
        </p>
      </motion.header>

      {/* Current phase — glass hero tile */}
      <motion.section
        variants={fadeUp}
        aria-label={`About the ${content.name} phase`}
        className={`glass-tile tile-${status.phase} animate-drift-slow overflow-hidden rounded-tile p-6`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-burgundy-deep/70">
              <span aria-hidden className="h-2 w-2 animate-pulse-dot rounded-full bg-burgundy-deep" />
              {content.name} phase · Day {status.cycleDay}
            </p>
            <h2 className="text-balance mt-2 font-serif text-[24px] font-semibold leading-snug text-burgundy-deep">
              {before}
              {content.highlight}
              {after}
            </h2>
          </div>
          <PhaseCharacter phase={status.phase} size={92} />
        </div>
        <p className="mt-2 text-[14px] leading-relaxed text-burgundy-deep/85">{content.why}</p>
        <p className="mt-1 text-[14px] leading-relaxed text-burgundy-deep/85">{content.suggestion}</p>

        <div className="mt-5 grid grid-cols-1 gap-2">
          {statRows.map(({ icon: Icon, label, value }) => (
            <div
              key={label}
              className="flex items-center gap-3 rounded-full bg-surface/70 px-4 py-2.5 backdrop-blur"
            >
              <Icon size={16} className="shrink-0 text-burgundy" aria-hidden />
              <span className="w-14 shrink-0 text-[12px] font-semibold uppercase tracking-wide text-muted">
                {label}
              </span>
              <span className="text-[13px] font-medium text-burgundy-deep">{value}</span>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Energy across the whole cycle, with phase bands */}
      <motion.section
        variants={fadeUp}
        aria-label="Energy across your cycle"
        className="rounded-card bg-surface p-5 shadow-pill"
      >
        <h2 className="font-serif text-[19px] font-semibold text-burgundy-deep">
          Energy across your cycle
        </h2>
        <p className="mt-0.5 text-[13px] text-muted">
          A typical pattern — the amber dot is where you are today.
        </p>
        <div className="mt-3">
          <EnergyChart status={status} tone="light" showBands />
        </div>
        <ul className="mt-3 flex flex-wrap gap-2" aria-label="Phase colour legend">
          {PHASE_ORDER.map((p) => (
            <li key={p} className="flex items-center gap-1.5 text-[12px] font-medium text-muted">
              <span
                aria-hidden
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: PHASE_CONTENT[p].color }}
              />
              {PHASE_CONTENT[p].name}
            </li>
          ))}
        </ul>
      </motion.section>

      {/* Meet your phases — the character of each phase */}
      <motion.section
        variants={fadeUp}
        aria-label="Meet your phases"
        className="rounded-card bg-surface p-5 shadow-pill"
      >
        <h2 className="font-serif text-[19px] font-semibold text-burgundy-deep">Meet your phases</h2>
        <p className="mt-0.5 text-[13px] text-muted">She moves through all four with you.</p>
        <ul className="mt-4 grid grid-cols-4 gap-2">
          {PHASE_ORDER.map((p) => (
            <li key={p} className="flex flex-col items-center gap-1.5">
              <motion.div whileTap={{ scale: 0.88, rotate: -4 }} transition={{ type: 'spring', stiffness: 400, damping: 15 }}>
                <PhaseCharacter phase={p} size={64} rounded="rounded-[20px]" />
              </motion.div>
              <span
                className={`text-center text-[11px] font-semibold ${p === status.phase ? 'text-burgundy' : 'text-muted'}`}
              >
                {PHASE_CONTENT[p].name}
              </span>
            </li>
          ))}
        </ul>
      </motion.section>

      {/* Coming up */}
      <motion.section
        variants={fadeUp}
        aria-label="Coming up"
        className="rounded-card bg-surface p-5 shadow-pill"
      >
        <h2 className="font-serif text-[19px] font-semibold text-burgundy-deep">Coming up</h2>
        <ul className="mt-3 space-y-1">
          {upcoming.map((item) => (
            <li key={item.label} className="flex items-center gap-3 rounded-2xl px-2 py-2.5">
              <span
                aria-hidden
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <div className="flex-1">
                <p className="text-[14px] font-semibold text-burgundy-deep">{item.label}</p>
                <p className="text-[12px] text-muted">{formatDay(item.date)}</p>
              </div>
              <span className="rounded-full bg-cream px-3 py-1 text-[12px] font-semibold text-burgundy">
                {relativeDay(item.date, today)}
              </span>
            </li>
          ))}
        </ul>
      </motion.section>

      {/* Cycle health */}
      <motion.section
        variants={fadeUp}
        aria-label="Cycle health"
        className="rounded-card bg-surface p-5 shadow-pill"
      >
        <h2 className="font-serif text-[19px] font-semibold text-burgundy-deep">Cycle health</h2>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="rounded-3xl bg-cream px-4 py-3">
            <p className="tabular text-[24px] font-bold text-burgundy-deep">
              {status.effectiveCycleLength}
            </p>
            <p className="text-[12px] text-muted">day average cycle</p>
          </div>
          <div className="rounded-3xl bg-cream px-4 py-3">
            <p className="tabular text-[24px] font-bold text-burgundy-deep">
              {status.completedLengths.length + 1}
            </p>
            <p className="text-[12px] text-muted">cycles logged</p>
          </div>
        </div>

        {visibleAlerts.length === 0 ? (
          <div className="mt-3 flex items-start gap-3 rounded-3xl bg-phase-follicular/15 px-4 py-3.5">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-phase-follicular" aria-hidden />
            <p className="text-[13px] leading-snug text-burgundy-deep/85">
              Everything looks steady. Your recent cycles sit comfortably in the typical
              21–35 day range.
            </p>
          </div>
        ) : (
          <ul className="mt-3 space-y-2">
            {visibleAlerts.map((alert) => (
              <li key={alert.id} className="rounded-3xl bg-cream px-4 py-3.5">
                <p className="flex items-center gap-2 text-[14px] font-semibold text-burgundy-deep">
                  <span aria-hidden className="h-2 w-2 rounded-full bg-phase-ovulation" />
                  {alert.title}
                </p>
                <p className="mt-1 text-[13px] leading-snug text-muted">{alert.message}</p>
                <p className="mt-1.5 text-[13px] font-medium leading-snug text-burgundy-soft">
                  {alert.suggestion}
                </p>
              </li>
            ))}
          </ul>
        )}
      </motion.section>

      <motion.p variants={fadeUp} className="px-2 pb-2 text-[11px] leading-relaxed text-muted">
        {MEDICAL_DISCLAIMER}
      </motion.p>
    </StaggerPage>
  );
}

function buildUpcoming(status: CycleStatus) {
  const anchor = status.currentCycle.startDate;
  const b = status.boundaries;

  const items = [
    {
      label: 'Ovulation window',
      date: addDays(anchor, b.ovulationStart - 1),
      color: PHASE_CONTENT.ovulation.color,
    },
    {
      label: 'Next period begins',
      date: status.nextPeriodStart,
      color: PHASE_CONTENT.menstrual.color,
    },
    {
      label: 'Follicular phase returns',
      date: addDays(anchor, b.cycleLength + b.menstrualEnd),
      color: PHASE_CONTENT.follicular.color,
    },
  ];

  return items
    .filter((item) => diffDays(anchor, item.date) + 1 > status.cycleDay)
    .sort((a, c) => (a.date < c.date ? -1 : 1))
    .slice(0, 3);
}
