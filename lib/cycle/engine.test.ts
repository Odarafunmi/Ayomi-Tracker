import { describe, expect, it } from 'vitest';

import { addDays, diffDays, formatDay, relativeDay, shiftMonth, todayISO } from './dates';
import {
  classifyDay,
  classifyMonth,
  completedCycleLengths,
  computeStatus,
  currentCycleFor,
  detectIrregularities,
  effectiveCycleLength,
  effectivePeriodLength,
  phaseBoundaries,
  phaseForCycleDay,
  sortCycles,
} from './engine';
import type { CycleEntry, CycleSettings } from './types';

const settings: CycleSettings = { averageCycleLength: 28, averagePeriodLength: 5 };

function cycle(startDate: string, endDate: string | null = null, id = startDate): CycleEntry {
  return { id, startDate, endDate };
}

/** Two clean 28-day cycles: 1 Jan and 29 Jan 2026. */
const HISTORY: CycleEntry[] = [
  cycle('2026-01-01', '2026-01-05'),
  cycle('2026-01-29', '2026-02-02'),
];

describe('date helpers', () => {
  it('adds and diffs days across month and year boundaries', () => {
    expect(addDays('2026-01-29', 3)).toBe('2026-02-01');
    expect(addDays('2025-12-31', 1)).toBe('2026-01-01');
    expect(diffDays('2026-01-29', '2026-02-09')).toBe(11);
    expect(diffDays('2026-02-09', '2026-01-29')).toBe(-11);
  });

  it('shifts months safely on the 31st', () => {
    expect(shiftMonth('2026-01-31', 1).startsWith('2026-02')).toBe(true);
    expect(shiftMonth('2026-03-31', -1).startsWith('2026-02')).toBe(true);
  });

  it('formats human labels', () => {
    expect(relativeDay('2026-02-09', '2026-02-09')).toBe('Today');
    expect(relativeDay('2026-02-10', '2026-02-09')).toBe('Tomorrow');
    expect(relativeDay('2026-02-12', '2026-02-09')).toBe('In 3 days');
    expect(relativeDay('2026-02-07', '2026-02-09')).toBe('2 days ago');
    expect(formatDay('2026-02-11')).toContain('Feb');
  });
});

describe('phase boundaries', () => {
  it('places phases correctly for a textbook 28/5 cycle', () => {
    const b = phaseBoundaries(28, 5);
    expect(b.menstrualEnd).toBe(5);
    expect(b.ovulationDay).toBe(14);
    expect(b.ovulationStart).toBe(13);
    expect(b.ovulationEnd).toBe(15);

    expect(phaseForCycleDay(1, b)).toBe('menstrual');
    expect(phaseForCycleDay(5, b)).toBe('menstrual');
    expect(phaseForCycleDay(6, b)).toBe('follicular');
    expect(phaseForCycleDay(12, b)).toBe('follicular');
    expect(phaseForCycleDay(13, b)).toBe('ovulation');
    expect(phaseForCycleDay(14, b)).toBe('ovulation');
    expect(phaseForCycleDay(15, b)).toBe('ovulation');
    expect(phaseForCycleDay(16, b)).toBe('luteal');
    expect(phaseForCycleDay(28, b)).toBe('luteal');
    expect(phaseForCycleDay(31, b)).toBe('luteal');
  });

  it('keeps boundaries monotonic for very short cycles', () => {
    const b = phaseBoundaries(21, 5);
    expect(b.ovulationDay).toBeGreaterThan(b.menstrualEnd);
    expect(b.ovulationStart).toBeLessThanOrEqual(b.ovulationDay);
    expect(b.ovulationEnd).toBeLessThan(b.cycleLength);
    for (let d = 1; d <= 21; d += 1) {
      expect(['menstrual', 'follicular', 'ovulation', 'luteal']).toContain(
        phaseForCycleDay(d, b),
      );
    }
  });

  it('handles long cycles', () => {
    const b = phaseBoundaries(35, 6);
    expect(b.ovulationDay).toBe(21);
    expect(phaseForCycleDay(20, b)).toBe('ovulation');
    expect(phaseForCycleDay(23, b)).toBe('luteal');
  });
});

describe('learning from history', () => {
  it('computes completed cycle lengths from consecutive starts', () => {
    expect(completedCycleLengths(HISTORY)).toEqual([28]);
    expect(
      completedCycleLengths([
        cycle('2026-01-01'),
        cycle('2026-01-28'),
        cycle('2026-03-01'),
      ]),
    ).toEqual([27, 32]);
  });

  it('falls back to user settings without history', () => {
    expect(effectiveCycleLength([cycle('2026-01-01')], settings)).toBe(28);
    expect(effectivePeriodLength([], settings)).toBe(5);
  });

  it('learns average cycle and period length from logged data', () => {
    const cycles = [
      cycle('2026-01-01', '2026-01-04'),
      cycle('2026-01-27', '2026-01-30'),
      cycle('2026-02-26', '2026-03-03'),
    ];
    expect(effectiveCycleLength(cycles, settings)).toBe(28); // (26+30)/2
    expect(effectivePeriodLength(cycles, settings)).toBe(5); // (4+4+6)/3 -> 5
  });

  it('sorts cycles without mutating input and finds the current cycle', () => {
    const messy = [cycle('2026-01-29'), cycle('2026-01-01')];
    expect(sortCycles(messy).map((c) => c.startDate)).toEqual(['2026-01-01', '2026-01-29']);
    expect(messy[0].startDate).toBe('2026-01-29');
    expect(currentCycleFor(HISTORY, '2026-02-09')?.startDate).toBe('2026-01-29');
    expect(currentCycleFor(HISTORY, '2026-01-10')?.startDate).toBe('2026-01-01');
  });
});

describe('computeStatus — known 28-day example', () => {
  // Today is 9 Feb 2026: 12 days after the 29 Jan start.
  const status = computeStatus({ today: '2026-02-09', cycles: HISTORY, settings });
  if (!status) throw new Error('status should not be null');

  it('identifies cycle day and phase', () => {
    expect(status.cycleDay).toBe(12);
    expect(status.phase).toBe('follicular');
    expect(status.isLate).toBe(false);
    expect(status.effectiveCycleLength).toBe(28);
  });

  it('predicts the next period and counts down to it', () => {
    expect(status.nextPeriodStart).toBe('2026-02-26');
    expect(status.daysUntilPeriod).toBe(17);
    expect(status.nextPeriodEnd).toBe('2026-03-02');
  });

  it('locates ovulation and the fertile window', () => {
    expect(status.ovulationDate).toBe('2026-02-11');
    expect(status.fertileStart).toBe('2026-02-06');
    expect(status.fertileEnd).toBe('2026-02-12');
  });

  it('projects three future periods and their ovulations', () => {
    expect(status.predictions).toHaveLength(3);
    expect(status.predictions[0].startDate).toBe('2026-02-26');
    expect(status.predictions[1].startDate).toBe('2026-03-26');
    expect(status.predictions[2].startDate).toBe('2026-04-23');
    expect(status.predictedOvulations[0]).toBe('2026-03-11');
  });

  it('reports progress through the cycle', () => {
    expect(status.cycleProgress).toBeCloseTo(12 / 28, 5);
  });

  it('flags a late period while staying in the luteal phase', () => {
    const late = computeStatus({
      today: '2026-03-10',
      cycles: [cycle('2026-01-29', '2026-02-02')],
      settings,
    });
    expect(late?.cycleDay).toBe(41);
    expect(late?.daysUntilPeriod).toBe(-12);
    expect(late?.isLate).toBe(true);
    expect(late?.phase).toBe('luteal');
    expect(late?.alerts.some((a) => a.kind === 'late-period')).toBe(true);
  });
});

describe('irregularity detection', () => {
  const base = [cycle('2026-01-01'), cycle('2026-01-29')];

  it('flags an unusually short cycle (< 21 days)', () => {
    const cycles = [cycle('2026-01-01'), cycle('2026-01-20')];
    const alerts = detectIrregularities({
      cycles, today: '2026-01-21', cycleDay: 2, effectiveCycleLength: 28,
    });
    expect(alerts.map((a) => a.kind)).toContain('short-cycle');
  });

  it('flags an unusually long cycle (> 35 days)', () => {
    const cycles = [cycle('2026-01-01'), cycle('2026-02-07')];
    const alerts = detectIrregularities({
      cycles, today: '2026-02-08', cycleDay: 2, effectiveCycleLength: 37,
    });
    expect(alerts.map((a) => a.kind)).toContain('long-cycle');
  });

  it('flags high variance across recent cycles', () => {
    const cycles = [
      cycle('2025-11-01'),
      cycle('2025-11-26'), // 25
      cycle('2025-12-30'), // 34
      cycle('2026-01-25'), // 26
    ];
    const alerts = detectIrregularities({
      cycles, today: '2026-01-28', cycleDay: 4, effectiveCycleLength: 28,
    });
    expect(alerts.map((a) => a.kind)).toContain('high-variance');
  });

  it('flags a period that is 7+ days late, not one a few days late', () => {
    const onTime = detectIrregularities({
      cycles: base, today: '2026-02-27', cycleDay: 30, effectiveCycleLength: 28,
    });
    expect(onTime.find((a) => a.kind === 'late-period')).toBeUndefined();

    const late = detectIrregularities({
      cycles: base, today: '2026-03-05', cycleDay: 36, effectiveCycleLength: 28,
    });
    const alert = late.find((a) => a.kind === 'late-period');
    expect(alert).toBeDefined();
    expect(alert?.message).toContain('8 days');
  });

  it('stays quiet for healthy history', () => {
    const alerts = detectIrregularities({
      cycles: HISTORY, today: '2026-02-09', cycleDay: 12, effectiveCycleLength: 28,
    });
    expect(alerts).toEqual([]);
  });
});

describe('calendar classification', () => {
  const status = computeStatus({ today: '2026-02-09', cycles: HISTORY, settings });
  if (!status) throw new Error('status should not be null');

  it('classifies logged, predicted, ovulation and fertile days with the right priority', () => {
    expect(classifyDay('2026-01-30', status, HISTORY)).toBe('period');
    expect(classifyDay('2026-02-27', status, HISTORY)).toBe('predicted-period');
    expect(classifyDay('2026-03-02', status, HISTORY)).toBe('predicted-period');
    expect(classifyDay('2026-02-11', status, HISTORY)).toBe('ovulation');
    expect(classifyDay('2026-02-07', status, HISTORY)).toBe('fertile');
    expect(classifyDay('2026-02-20', status, HISTORY)).toBe('none');
  });

  it('classifies a whole month for the calendar grid', () => {
    const feb = classifyMonth('2026-02-09', status, HISTORY);
    expect(Object.keys(feb)).toHaveLength(28);
    expect(feb['2026-02-01']).toBe('period');
    expect(feb['2026-02-11']).toBe('ovulation');
    expect(feb['2026-02-26']).toBe('predicted-period');
  });
});

describe('todayISO', () => {
  it('returns a yyyy-mm-dd string', () => {
    expect(todayISO(new Date('2026-10-16T12:00:00Z'))).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
