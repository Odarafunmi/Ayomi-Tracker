import { addDays } from '@/lib/cycle/dates';
import type { CycleEntry } from '@/lib/cycle/types';
import { newId, type Profile } from '@/lib/store/types';

/**
 * Realistic sample data for exploring the app without entering anything.
 * Anchored relative to `today` so the demo always shows a mid-follicular
 * state — a calm, informative moment of the cycle.
 *
 * History: cycles of 38, 28, 28, 28 days. The 38-day cycle three cycles back
 * means the "cycles vary a little" notice appears once — a chance to see how
 * gently Ayomi flags irregularity.
 */
export function buildDemoData(today: string): { profile: Profile; cycles: CycleEntry[] } {
  const starts = [105, 67, 39, 11].map((n) => addDays(today, -n));

  const cycles: CycleEntry[] = starts.map((start) => ({
    id: newId(),
    startDate: start,
    // Every logged period: bleeding lasted 5 days and has ended.
    endDate: addDays(start, 4),
  }));

  const profile: Profile = {
    id: newId(),
    name: 'Ayomi',
    email: '',
    averageCycleLength: 28,
    averagePeriodLength: 5,
    createdAt: new Date().toISOString(),
    consent: {
      healthData: true,
      reminderEmails: false,
      consentedAt: new Date().toISOString(),
    },
    reminders: { period: true, ovulation: true, phaseChange: false },
  };

  return { profile, cycles };
}
