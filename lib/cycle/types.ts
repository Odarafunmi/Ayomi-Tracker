/** Core domain types for Ayomi Tracker. */

export type PhaseId = 'menstrual' | 'follicular' | 'ovulation' | 'luteal';

/** One logged menstrual cycle (one bleeding episode). */
export interface CycleEntry {
  id: string;
  /** ISO date string (yyyy-mm-dd) of the first day of bleeding. */
  startDate: string;
  /** ISO date string of the last day of bleeding, or null if ongoing/unknown. */
  endDate: string | null;
}

/** User-provided prediction settings. */
export interface CycleSettings {
  averageCycleLength: number;
  averagePeriodLength: number;
}

/** Computed boundaries for where each phase falls inside one cycle. */
export interface PhaseBoundaries {
  /** Last day counted as menstrual. */
  menstrualEnd: number;
  /** Estimated ovulation day (1-based). */
  ovulationDay: number;
  /** First day of the ovulation phase window. */
  ovulationStart: number;
  /** Last day of the ovulation phase window. */
  ovulationEnd: number;
  cycleLength: number;
  periodLength: number;
}

export type AlertKind = 'short-cycle' | 'long-cycle' | 'high-variance' | 'late-period';

/** A calm, non-alarming irregularity notice. */
export interface CycleAlert {
  id: string;
  kind: AlertKind;
  title: string;
  message: string;
  suggestion: string;
}

/** A predicted future period, for the calendar. */
export interface PeriodPrediction {
  startDate: string;
  endDate: string;
}

/** Everything the UI needs to know about "where am I in my cycle?". */
export interface CycleStatus {
  /** 1-based cycle day for `today`. */
  cycleDay: number;
  phase: PhaseId;
  /** True when today is past the predicted end of the current cycle. */
  isLate: boolean;
  /** Days until the predicted next period; negative when late. */
  daysUntilPeriod: number;
  nextPeriodStart: string;
  nextPeriodEnd: string;
  ovulationDate: string;
  fertileStart: string;
  fertileEnd: string;
  /** 0..1 progress through the current cycle (clamped). */
  cycleProgress: number;
  /** Cycle length actually used for predictions (learned or user setting). */
  effectiveCycleLength: number;
  effectivePeriodLength: number;
  boundaries: PhaseBoundaries;
  /** Upcoming predicted periods (including the immediate next one). */
  predictions: PeriodPrediction[];
  /** Predicted ovulation dates for upcoming cycles. */
  predictedOvulations: string[];
  alerts: CycleAlert[];
  /** The cycle the status is anchored to. */
  currentCycle: CycleEntry;
  /** Most recent completed cycle lengths (oldest first), used for stats. */
  completedLengths: number[];
}

export type DayKind = 'period' | 'predicted-period' | 'ovulation' | 'fertile' | 'none';
