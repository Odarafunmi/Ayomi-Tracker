'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { MotionConfig } from 'framer-motion';

import { computeStatus, sortCycles } from '@/lib/cycle/engine';
import { todayISO } from '@/lib/cycle/dates';
import type { CycleEntry, CycleStatus } from '@/lib/cycle/types';
import { buildDemoData } from '@/lib/demo';
import { createStore } from '@/lib/store';
import { newId, type DataStore, type Profile } from '@/lib/store/types';

interface AppState {
  ready: boolean;
  mode: 'local' | 'supabase';
  today: string;
  profile: Profile | null;
  cycles: CycleEntry[];
  status: CycleStatus | null;
  dismissedAlertIds: string[];
}

interface OnboardingInput {
  name: string;
  email: string;
  lastPeriodStart: string;
  averageCycleLength: number;
  averagePeriodLength: number;
  consentReminderEmails: boolean;
}

interface AppActions {
  completeOnboarding(input: OnboardingInput): Promise<void>;
  updateProfile(patch: Partial<Profile>): Promise<void>;
  logPeriod(startDate: string, endDate: string | null): Promise<void>;
  updateCycle(entry: CycleEntry): Promise<void>;
  deleteCycle(id: string): Promise<void>;
  seedDemo(): Promise<void>;
  deleteEverything(): Promise<void>;
  dismissAlert(id: string): void;
}

const AppContext = createContext<(AppState & AppActions) | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<DataStore | null>(null);
  const [state, setState] = useState<AppState>({
    ready: false,
    mode: 'local',
    today: todayISO(),
    profile: null,
    cycles: [],
    status: null,
    dismissedAlertIds: [],
  });

  useEffect(() => {
    const store = createStore();
    storeRef.current = store;
    let cancelled = false;
    (async () => {
      try {
        const [profile, cycles] = await Promise.all([store.getProfile(), store.listCycles()]);
        if (!cancelled) {
          setState((s) => ({ ...s, ready: true, mode: store.mode, profile, cycles }));
        }
      } catch {
        if (!cancelled) setState((s) => ({ ...s, ready: true, mode: store.mode }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const status = useMemo(() => {
    if (!state.profile || state.cycles.length === 0) return null;
    return computeStatus({
      today: state.today,
      cycles: state.cycles,
      settings: {
        averageCycleLength: state.profile.averageCycleLength,
        averagePeriodLength: state.profile.averagePeriodLength,
      },
    });
  }, [state.profile, state.cycles, state.today]);

  const completeOnboarding = useCallback(async (input: OnboardingInput) => {
    const store = storeRef.current;
    if (!store) return;
    const profile: Profile = {
      id: newId(),
      name: input.name.trim() || 'Friend',
      email: input.email.trim(),
      averageCycleLength: input.averageCycleLength,
      averagePeriodLength: input.averagePeriodLength,
      createdAt: new Date().toISOString(),
      consent: {
        healthData: true,
        reminderEmails: input.consentReminderEmails,
        consentedAt: new Date().toISOString(),
      },
      reminders: { period: true, ovulation: true, phaseChange: false },
    };
    const entry: CycleEntry = {
      id: newId(),
      startDate: input.lastPeriodStart,
      endDate: addDaysSafe(input.lastPeriodStart, input.averagePeriodLength - 1),
    };
    await store.saveProfile(profile);
    await store.addCycle(entry);
    const cycles = await store.listCycles();
    setState((s) => ({ ...s, profile, cycles }));
  }, []);

  const updateProfile = useCallback(async (patch: Partial<Profile>) => {
    const store = storeRef.current;
    setState((s) => {
      if (!s.profile || !store) return s;
      const next: Profile = {
        ...s.profile,
        ...patch,
        consent: { ...s.profile.consent, ...(patch.consent ?? {}) },
        reminders: { ...s.profile.reminders, ...(patch.reminders ?? {}) },
      };
      void store.saveProfile(next);
      return { ...s, profile: next };
    });
  }, []);

  const logPeriod = useCallback(async (startDate: string, endDate: string | null) => {
    const store = storeRef.current;
    if (!store) return;
    const entry: CycleEntry = { id: newId(), startDate, endDate };
    await store.addCycle(entry);
    const cycles = await store.listCycles();
    setState((s) => ({ ...s, cycles: sortCycles(cycles) }));
  }, []);

  const updateCycle = useCallback(async (entry: CycleEntry) => {
    const store = storeRef.current;
    if (!store) return;
    await store.updateCycle(entry);
    const cycles = await store.listCycles();
    setState((s) => ({ ...s, cycles: sortCycles(cycles) }));
  }, []);

  const deleteCycle = useCallback(async (id: string) => {
    const store = storeRef.current;
    if (!store) return;
    await store.deleteCycle(id);
    const cycles = await store.listCycles();
    setState((s) => ({ ...s, cycles: sortCycles(cycles) }));
  }, []);

  const seedDemo = useCallback(async () => {
    const store = storeRef.current;
    if (!store) return;
    const { profile, cycles } = buildDemoData(todayISO());
    await store.saveProfile(profile);
    for (const c of cycles) {
      // eslint-disable-next-line no-await-in-loop
      await store.addCycle(c);
    }
    const stored = await store.listCycles();
    setState((s) => ({ ...s, profile, cycles: stored }));
  }, []);

  const deleteEverything = useCallback(async () => {
    const store = storeRef.current;
    if (!store) return;
    await store.deleteAll();
    setState((s) => ({ ...s, profile: null, cycles: [], dismissedAlertIds: [] }));
  }, []);

  const dismissAlert = useCallback((id: string) => {
    setState((s) => ({ ...s, dismissedAlertIds: [...s.dismissedAlertIds, id] }));
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      status,
      completeOnboarding,
      updateProfile,
      logPeriod,
      updateCycle,
      deleteCycle,
      seedDemo,
      deleteEverything,
      dismissAlert,
    }),
    [
      state,
      status,
      completeOnboarding,
      updateProfile,
      logPeriod,
      updateCycle,
      deleteCycle,
      seedDemo,
      deleteEverything,
      dismissAlert,
    ],
  );

  return (
    <MotionConfig reducedMotion="user">
      <AppContext.Provider value={value}>{children}</AppContext.Provider>
    </MotionConfig>
  );
}

function addDaysSafe(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function useApp(): AppState & AppActions {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}
