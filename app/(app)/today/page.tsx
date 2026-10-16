'use client';

import { motion } from 'framer-motion';
import { CirclePlus } from 'lucide-react';
import { useState } from 'react';

import { useApp } from '@/app/providers';
import { AlertBanner } from '@/components/alert-banner';
import { CycleDial, PeriodCountdownPill } from '@/components/cycle-dial';
import { CycleProgress } from '@/components/cycle-progress';
import { InsightCard } from '@/components/insight-card';
import { LogPeriodModal } from '@/components/log-period-modal';
import { StaggerPage, fadeUp } from '@/components/motion';
import { PhaseTiles } from '@/components/phase-tiles';
import { SecondaryButton } from '@/components/ui';
import { PHASE_CONTENT } from '@/lib/cycle/content';
import { formatDay } from '@/lib/cycle/dates';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function TodayPage() {
  const { profile, status, today, dismissedAlertIds, dismissAlert, logPeriod, updateCycle } =
    useApp();
  const [logging, setLogging] = useState(false);

  if (!profile || !status) return null;

  const visibleAlerts = status.alerts.filter((a) => !dismissedAlertIds.includes(a.id));
  const phase = PHASE_CONTENT[status.phase];
  const bleedingNow = status.phase === 'menstrual' && !status.isLate;
  const currentCycleOpen = status.currentCycle.endDate === null;

  return (
    <StaggerPage className="space-y-4">
      {/* Greeting */}
      <motion.header variants={fadeUp} className="px-1 pt-2">
        <p className="text-[13px] font-medium text-muted">
          {formatDay(today, { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
        <h1 className="mt-0.5 font-serif text-[28px] font-semibold tracking-tight text-burgundy-deep">
          {greeting()}, {profile.name}
        </h1>
      </motion.header>

      {/* Irregularity alerts — calm, dismissible. */}
      {visibleAlerts.map((alert) => (
        <AlertBanner key={alert.id} alert={alert} onDismiss={() => dismissAlert(alert.id)} />
      ))}

      {/* Hero dial */}
      <motion.div variants={fadeUp} className="pt-2">
        <CycleDial status={status} />
        <PeriodCountdownPill status={status} />
        <p className="mt-3 text-center text-[13px] text-muted">
          You are in your{' '}
          <span className="font-semibold" style={{ color: phase.color }}>
            {phase.name.toLowerCase()} phase
          </span>
          {status.isLate ? ' — waiting on your period' : ''}
        </p>
      </motion.div>

      {/* Quick log */}
      <motion.div variants={fadeUp} className="flex justify-center gap-3">
        {bleedingNow && currentCycleOpen ? (
          <SecondaryButton
            onClick={() => updateCycle({ ...status.currentCycle, endDate: today })}
          >
            My period has ended
          </SecondaryButton>
        ) : !bleedingNow ? (
          <SecondaryButton onClick={() => setLogging(true)}>
            <CirclePlus size={17} aria-hidden />
            Log a period
          </SecondaryButton>
        ) : null}
      </motion.div>

      {/* Phase tiles */}
      <PhaseTiles status={status} />

      {/* Progress */}
      <motion.div variants={fadeUp}>
        <CycleProgress status={status} />
      </motion.div>

      {/* Anchor insight card */}
      <InsightCard status={status} />

      <LogPeriodModal
        open={logging}
        onClose={() => setLogging(false)}
        today={today}
        periodLength={status.effectivePeriodLength}
        onSave={async (start, end) => {
          await logPeriod(start, end);
          setLogging(false);
        }}
      />
    </StaggerPage>
  );
}
