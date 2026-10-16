'use client';

import type { CycleEntry } from '@/lib/cycle/types';
import { sortCycles } from '@/lib/cycle/engine';
import type { DataStore, Profile } from './types';

const PROFILE_KEY = 'ayomi.profile.v1';
const CYCLES_KEY = 'ayomi.cycles.v1';

function read<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

/**
 * Browser-local store used for demo mode (and as a private, offline-first
 * option). Data never leaves the device.
 */
export class LocalStore implements DataStore {
  readonly mode = 'local' as const;

  async getProfile(): Promise<Profile | null> {
    return read<Profile>(PROFILE_KEY);
  }

  async saveProfile(profile: Profile): Promise<Profile> {
    write(PROFILE_KEY, profile);
    return profile;
  }

  async listCycles(): Promise<CycleEntry[]> {
    return sortCycles(read<CycleEntry[]>(CYCLES_KEY) ?? []);
  }

  async addCycle(entry: CycleEntry): Promise<CycleEntry> {
    const cycles = await this.listCycles();
    write(CYCLES_KEY, [...cycles, entry]);
    return entry;
  }

  async updateCycle(entry: CycleEntry): Promise<CycleEntry> {
    const cycles = await this.listCycles();
    write(CYCLES_KEY, cycles.map((c) => (c.id === entry.id ? entry : c)));
    return entry;
  }

  async deleteCycle(id: string): Promise<void> {
    const cycles = await this.listCycles();
    write(CYCLES_KEY, cycles.filter((c) => c.id !== id));
  }

  async deleteAll(): Promise<void> {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(PROFILE_KEY);
    window.localStorage.removeItem(CYCLES_KEY);
  }
}
