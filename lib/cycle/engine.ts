/**
 * Cycle prediction and phase engine.
 *
 * Pure functions only — every function takes `today` explicitly so the whole
 * engine is deterministic and unit-testable. The heuristics follow common
 * clinical approximations:
 *  - ovulation ≈ 14 days before the end of the cycle
 *  - the fertile window ≈ 5 days before ovulation until 1 day after
 *  - a typical cycle is 21–35 days; outside that we gently flag irregularity
 */

import { addDays, diffDays, isBefore } from './dates';
import type {
  CycleAlert,
  CycleEntry,
  CycleSettings,
  CycleStatus,
  DayKind,
  PeriodPrediction,
  PhaseBoundaries,
  PhaseId,
} from './types';

export const MIN_TYPICAL_CYCLE = 21;
export const MAX_TYPICAL_CYCLE = 35;
/** Days past the predicted period start before we flag a late period. */
export const LATE_PERIOD_GRACE_DAYS = 7;
/** Cycles whose (max − min) length across recent history exceeds this are flagged. */
export const VARIANCE_THRESHOLD_DAYS = 8;
/** How many recent completed cycles inform the learned average. */
const LEARN_WINDOW = 4;
/** How many recent completed cycles the variance check looks at. */
const VARIANCE_WINDOW = 4;
/** How many future periods to predict for the calendar. */
export const PREDICTIONS_AHEAD = 3;

/** Sort cycles oldest → newest by start date (returns a new array). */
export function sortCycles(cycles: CycleEntry[]): CycleEntry[] {
  return [...cycles].sort((a, b) => (a.startDate < b.startDate ? -1 : 1));
}

/** Lengths (day-to-day) of completed cycles, oldest first. */
export function completedCycleLengths(cycles: CycleEntry[]): number[] {
  const sorted = sortCycles(cycles);
  const lengths: number[] = [];
  for (let i = 1; i < sorted.length; i += 1) {
    lengths.push(diffDays(sorted[i - 1].startDate, sorted[i].startDate));
  }
  return lengths;
}

/** A learned average cycle length from logged history, rounded to whole days. */
export function effectiveCycleLength(cycles: CycleEntry[], settings: CycleSettings): number {
  const lengths = completedCycleLengths(cycles).slice(-LEARN_WINDOW);
  if (lengths.length === 0) return settings.averageCycleLength;
  const avg = lengths.reduce((sum, n) => sum + n, 0) / lengths.length;
  const rounded = Math.round(avg);
  return Math.min(Math.max(rounded, MIN_TYPICAL_CYCLE - 4), MAX_TYPICAL_CYCLE + 5);
}

/** A learned average period length from logged bleeding ranges. */
export function effectivePeriodLength(cycles: CycleEntry[], settings: CycleSettings): number {
  const spans = sortCycles(cycles)
    .filter((c) => c.endDate)
    .map((c) => diffDays(c.startDate, c.endDate as string) + 1)
    .filter((n) => n >= 1 && n <= 12)
    .slice(-LEARN_WINDOW);
  if (spans.length === 0) return settings.averagePeriodLength;
  return Math.max(1, Math.round(spans.reduce((s, n) => s + n, 0) / spans.length));
}

/**
 * Where each phase falls for a given cycle/period length. Ovulation is
 * approximated as 14 days before the cycle ends, clamped so the boundaries
 * stay sensible for very short or long cycles.
 */
export function phaseBoundaries(cycleLength: number, periodLength: number): PhaseBoundaries {
  const menstrualEnd = Math.max(1, periodLength);
  const ovulationDay = Math.min(
    Math.max(cycleLength - 14, menstrualEnd + 2),
    cycleLength - 1,
  );
  const ovulationStart = Math.max(ovulationDay - 1, menstrualEnd + 1);
  const ovulationEnd = Math.min(ovulationDay + 1, cycleLength - 1);
  return { menstrualEnd, ovulationDay, ovulationStart, ovulationEnd, cycleLength, periodLength };
}

/** Which phase a given cycle day falls in. Days past cycle end remain luteal. */
export function phaseForCycleDay(day: number, b: PhaseBoundaries): PhaseId {
  if (day <= b.menstrualEnd) return 'menstrual';
  if (day < b.ovulationStart) return 'follicular';
  if (day <= b.ovulationEnd) return 'ovulation';
  return 'luteal';
}

/** The cycle a given date belongs to (the latest cycle starting on/before it). */
export function currentCycleFor(cycles: CycleEntry[], today: string): CycleEntry | null {
  const sorted = sortCycles(cycles);
  let current: CycleEntry | null = null;
  for (const c of sorted) {
    if (!isBefore(today, c.startDate)) current = c;
  }
  return current ?? sorted[0] ?? null;
}

/** Detect calm, non-alarming irregularities from recent history. */
export function detectIrregularities(args: {
  cycles: CycleEntry[];
  today: string;
  cycleDay: number;
  effectiveCycleLength: number;
}): CycleAlert[] {
  const { cycles, today, cycleDay, effectiveCycleLength } = args;
  const alerts: CycleAlert[] = [];
  const lengths = completedCycleLengths(cycles);
  const latest = lengths[lengths.length - 1];

  if (latest !== undefined && latest < MIN_TYPICAL_CYCLE) {
    alerts.push({
      id: `short-${cycles.length}-${latest}`,
      kind: 'short-cycle',
      title: 'A shorter cycle than usual',
      message: `Your last cycle was ${latest} days. Anything from ${MIN_TYPICAL_CYCLE} to ${MAX_TYPICAL_CYCLE} days is broadly typical, so this is worth a gentle note.`,
      suggestion:
        'If your cycles stay under 21 days, or this happens repeatedly, it is worth mentioning to a doctor.',
    });
  } else if (latest !== undefined && latest > MAX_TYPICAL_CYCLE) {
    alerts.push({
      id: `long-${cycles.length}-${latest}`,
      kind: 'long-cycle',
      title: 'A longer cycle than usual',
      message: `Your last cycle was ${latest} days. Anything from ${MIN_TYPICAL_CYCLE} to ${MAX_TYPICAL_CYCLE} days is broadly typical, so this is worth a gentle note.`,
      suggestion:
        'If your cycles stay over 35 days, or this happens repeatedly, it is worth mentioning to a doctor.',
    });
  }

  const recent = lengths.slice(-VARIANCE_WINDOW);
  if (recent.length >= 3) {
    const spread = Math.max(...recent) - Math.min(...recent);
    if (spread > VARIANCE_THRESHOLD_DAYS) {
      alerts.push({
        id: `variance-${recent.join('-')}`,
        kind: 'high-variance',
        title: 'Your cycles vary a little',
        message: `Your recent cycles range across ${spread} days. Some variation is normal; larger swings can be worth watching.`,
        suggestion:
          'If your cycle length keeps swinging noticeably over 3 or more cycles, consider chatting with a doctor.',
      });
    }
  }

  const daysLate = cycleDay - effectiveCycleLength;
  if (daysLate >= LATE_PERIOD_GRACE_DAYS) {
    alerts.push({
      id: `late-${today}`,
      kind: 'late-period',
      title: 'Your period is late',
      message: `It is ${daysLate} days past your predicted start. Stress, travel and illness can all delay a cycle, so this is often nothing to worry about.`,
      suggestion:
        'If your period does not arrive within another week — or there is any chance of pregnancy — consider a test or a chat with a doctor.',
    });
  }

  return alerts;
}

/**
 * Compute the full cycle status for `today`: current phase, predictions,
 * fertile window, irregularity alerts.
 */
export function computeStatus(args: {
  today: string;
  cycles: CycleEntry[];
  settings: CycleSettings;
  predictionsAhead?: number;
}): CycleStatus | null {
  const { today, cycles, settings } = args;
  const predictionsAhead = args.predictionsAhead ?? PREDICTIONS_AHEAD;
  const current = currentCycleFor(cycles, today);
  if (!current) return null;

  const cycleLength = effectiveCycleLength(cycles, settings);
  const periodLength = effectivePeriodLength(cycles, settings);
  const boundaries = phaseBoundaries(cycleLength, periodLength);

  const cycleDay = diffDays(current.startDate, today) + 1;
  const phase = phaseForCycleDay(cycleDay, boundaries);
  const isLate = cycleDay > cycleLength;

  const nextPeriodStart = addDays(current.startDate, cycleLength);
  const nextPeriodEnd = addDays(nextPeriodStart, periodLength - 1);
  const daysUntilPeriod = diffDays(today, nextPeriodStart);

  const ovulationDate = addDays(current.startDate, boundaries.ovulationDay - 1);

  const predictions: PeriodPrediction[] = [];
  const predictedOvulations: string[] = [];
  for (let k = 1; k <= predictionsAhead; k += 1) {
    const start = addDays(current.startDate, cycleLength * k);
    predictions.push({ startDate: start, endDate: addDays(start, periodLength - 1) });
    predictedOvulations.push(addDays(start, boundaries.ovulationDay - 1));
  }

  return {
    cycleDay,
    phase,
    isLate,
    daysUntilPeriod,
    nextPeriodStart,
    nextPeriodEnd,
    ovulationDate,
    fertileStart: addDays(ovulationDate, -5),
    fertileEnd: addDays(ovulationDate, 1),
    cycleProgress: Math.min(Math.max(cycleDay / cycleLength, 0), 1),
    effectiveCycleLength: cycleLength,
    effectivePeriodLength: periodLength,
    boundaries,
    predictions,
    predictedOvulations,
    alerts: detectIrregularities({ cycles, today, cycleDay, effectiveCycleLength: cycleLength }),
    currentCycle: current,
    completedLengths: completedCycleLengths(cycles),
  };
}

/** Does `date` fall inside a logged bleeding range? Unknown ends use the typical length. */
export function isLoggedPeriodDay(
  date: string,
  cycles: CycleEntry[],
  periodLength: number,
): boolean {
  return sortCycles(cycles).some((c) => {
    const end = c.endDate ?? addDays(c.startDate, periodLength - 1);
    return date >= c.startDate && date <= end;
  });
}

/**
 * Classify one calendar day for display: logged period, predicted period,
 * ovulation day, fertile window, or an ordinary day.
 */
export function classifyDay(
  date: string,
  status: CycleStatus,
  cycles: CycleEntry[],
): DayKind {
  if (isLoggedPeriodDay(date, cycles, status.effectivePeriodLength)) return 'period';
  if (date === status.ovulationDate || status.predictedOvulations.includes(date)) {
    return 'ovulation';
  }
  if (date >= status.fertileStart && date <= status.fertileEnd) return 'fertile';
  const inPrediction = status.predictions.some(
    (p) => date >= p.startDate && date <= p.endDate,
  );
  if (inPrediction) return 'predicted-period';
  return 'none';
}

/**
 * Full-month classification for the calendar (keys are ISO dates).
 * `cursor` is any day inside the desired month.
 */
export function classifyMonth(
  cursor: string,
  status: CycleStatus,
  cycles: CycleEntry[],
): Record<string, DayKind> {
  const [y, m] = cursor.split('-').map(Number);
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const out: Record<string, DayKind> = {};
  for (let d = 1; d <= daysInMonth; d += 1) {
    const iso = `${cursor.slice(0, 8)}${String(d).padStart(2, '0')}`;
    out[iso] = classifyDay(iso, status, cycles);
  }
  return out;
}
