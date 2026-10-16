import type { CycleEntry, CycleSettings } from '@/lib/cycle/types';

/** User profile with preferences and consent record. */
export interface Profile {
  id: string;
  name: string;
  /** Used for reminder emails; empty when not provided. */
  email: string;
  averageCycleLength: number;
  averagePeriodLength: number;
  createdAt: string;
  /** NDPA consent record. */
  consent: {
    healthData: boolean;
    reminderEmails: boolean;
    consentedAt: string;
  };
  reminders: {
    period: boolean;
    ovulation: boolean;
    phaseChange: boolean;
  };
}

export type { CycleEntry, CycleSettings };

/**
 * Storage abstraction. The app ships with two implementations:
 *  - LocalStore: browser localStorage (default, works offline with no setup)
 *  - SupabaseStore: Postgres + Auth + RLS (enabled via env vars)
 */
export interface DataStore {
  readonly mode: 'local' | 'supabase';
  getProfile(): Promise<Profile | null>;
  saveProfile(profile: Profile): Promise<Profile>;
  listCycles(): Promise<CycleEntry[]>;
  addCycle(entry: CycleEntry): Promise<CycleEntry>;
  updateCycle(entry: CycleEntry): Promise<CycleEntry>;
  deleteCycle(id: string): Promise<void>;
  /** Delete every trace of the user's data (account deletion). */
  deleteAll(): Promise<void>;
}

export function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
